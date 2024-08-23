console.log('='.repeat(350));
let job = require('./audio.json');
let jobData = job.data;
let videoScript = jobData.videoScript;
let translated = videoScript.map((item) => { return item.translated; });
let audioFile = jobData.audioFile;
// console.log(audioFile);
// whisper.cpp --model /whisper.cpp/models/ggml-tiny.bin -f in.wav -osrt --max-len 1 --split-on-word true -l vi
let whisperFile = async (modelFile, inputFile, outputFile, whisperExecFile) => {
    let outputFileWithoutExt = outputFile.replace(/\.[^/.]+$/, '');
    let whisper = child_process.spawn(whisperExecFile, ['--model', modelFile, '-f', inputFile, '-ojf', '--max-len', '1', '--split-on-word', 'true', '-l', 'vi', '-of', outputFileWithoutExt]);
    whisper.stdout.on('data', (data) => {
        console.log(`stdout: ${data}`);
    });
    whisper.stderr.on('data', (data) => {
        console.log(`stderr: ${data}`);
    });
    whisper.on('close', (code) => {
        console.log(`child process exited with code ${code}`);
    });
    await new Promise((resolve, reject) => {
        whisper.on('close', (code) => {
            if (code === 0) {
                resolve();
            } else {
                reject(new Error('whisper failed'));
            }
        });
    });
    console.log('End whispering...');

    return outputFile;
}

let child_process = require('child_process');
let fs = require('fs');
function djb2(str) {
    let hash = 5381;
    for (let i = 0; i < str.length; i++) {
        hash = (hash * 33) ^ str.charCodeAt(i);
    }
    return hash >>> 0;
}
function removePunctuation(text) {
    // replace all punctuation and newlines with empty string
    return text.replace(/[.,\/#!$%\^&\*;:{}=\-–_`~()]/g, '').replace(/\n/g, ' ').replace(/\s+/g, ' ');
}
function correctTranscription(transcription, translated) {
    let translatedText = translated.join('').toLowerCase()
    translatedText = removePunctuation(translatedText);
    console.log('Correcting transcription...');
    for (let i = 0; i < transcription.length; i++) {
        let phrase = transcription.slice(i, i + 5).map((item) => { return item.text; }).join('');
        phrase = phrase.trim().toLowerCase();
        phrase = removePunctuation(phrase).trim();
        // if the phrase is in the translated text
        if (translatedText.includes(' ' + phrase + ' ')) {
            // mark these words as corrected
            for (let j = i; j < i + 5; j++) {
                if (j >= transcription.length) {
                    break;
                }
                transcription[j].corrected = true;
            }
        }
    }
    transcription = transcription.filter((item) => { return item.text.replace(/^\s+$/gi, '').length > 0; });

    let processed;
    processed = {
        fromBeginning: [],
        transcription2: transcription,
        translatedText2: translatedText
    }
    do {
        processed = processIncorrectPhrases(processed.transcription2, processed.translatedText2, processed.fromBeginning);
    } while (processed.transcription2.length > 0);
    processed.fromBeginning = processed.fromBeginning.filter((item) => { return !item.beRemoved; });

    return processed.fromBeginning;
};
function processIncorrectPhrases(transcription, translatedText, fromBeginning) {
    let correctedAtFirst = transcription.findIndex((item) => { return item.corrected; });
    let postTextItems = transcription.slice(correctedAtFirst, correctedAtFirst + 5);
    let postText = postTextItems.map((item) => { return item.text; }).join('');
    if (correctedAtFirst > 0) {
        let correctedText = translatedText.substring(0, translatedText.indexOf(postText)).trim();
        let correctedTextWordsCount = correctedText.split(' ').length;
        if (correctedTextWordsCount === correctedAtFirst) {
            for (let i = 0; i < correctedAtFirst; i++) {
                transcription[i].text = " " + correctedText.split(' ')[i];
                transcription[i].corrected = true;
            }
        }else{
            transcription[0].text = " " + correctedText;
            transcription[0].corrected = true;
            for (let i = 1; i < correctedAtFirst; i++) {
                transcription[i].text = "";
                transcription[i].corrected = true;
                transcription[i].beRemoved = true;
            }
        }
    }
    let nextIncorrectedAtFirst = transcription.findIndex((item) => { return !item.corrected; });
    if (nextIncorrectedAtFirst === -1) {
        return {
            fromBeginning: fromBeginning.concat(transcription),
            transcription2: [],
            translatedText2: translatedText
        };
    }
    fromBeginning = fromBeginning.concat(transcription.slice(0, nextIncorrectedAtFirst));

    postTextItems = transcription.slice(nextIncorrectedAtFirst - 5, nextIncorrectedAtFirst);
    postText = postTextItems.map((item) => { return item.text; }).join('');
    let endOfPostText = translatedText.indexOf(postText) + postText.length;
    let cutTranslateText = translatedText.slice(endOfPostText);
    transcription = transcription.slice(nextIncorrectedAtFirst);
    // remove all items before the next incorrected phrase
    if (cutTranslateText.length === 0) {
        return transcription;
    }

    return {
        fromBeginning,
        transcription2: [...transcription],
        translatedText2: cutTranslateText
    };
}

(async function(){
    console.log('Start whispering...');
    let modelFile = '/whisper.cpp/models/ggml-tiny.bin';
    let inputFile = '/whisper.cpp/in.wav';

    let djb2Str = djb2(translated.join(''));
    let outputFile = '/whisper.cpp/output/x' + djb2Str +'.json';
    let whisperExecFile = 'whisper.cpp';
    //
    if ( !fs.existsSync(outputFile) ) {
        await whisperFile(modelFile, inputFile, outputFile, whisperExecFile);
    }
    let outputSrt = fs.readFileSync(outputFile, 'utf8');
    // console.log(outputSrt);
    let outputSrtJson = JSON.parse(outputSrt);
    let transcription = outputSrtJson.transcription;
    // console.log(transcription);
    let correctedTranscription = correctTranscription(transcription, translated);
    console.log('-'.repeat(290));
    console.log(correctedTranscription.map((item) => { return item.text; }).join(''));
})();
