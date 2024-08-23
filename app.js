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
    // filter items that are not corrected
    let incorrectTranscription = transcription.filter((item) => { return !item.corrected; }).map((item) => { return item.text; });
    console.log('Incorrect transcription:', incorrectTranscription);
    let correctedTranscription = transcription.filter((item) => { return item.corrected; }).map((item) => { return item.text; });
    console.log('Corrected transcription:', correctedTranscription);
    transcription = transcription.filter((item) => { return item.text.length > 0; });

    let processed;
    processed = {
        fromBeginning: [],
        transcription2: transcription,
        translatedText2: translatedText
    }
    fromBeginning = processed.fromBeginning;
    // processed = processIncorrectPhrases(processed.transcription2, processed.translatedText2, processed.fromBeginning);    if (processed.fromBeginning === fromBeginning) { return fromBeginning;    }
    // processed = processIncorrectPhrases(processed.transcription2, processed.translatedText2, processed.fromBeginning);    if (processed.fromBeginning === fromBeginning) { return fromBeginning;    }
    // processed = processIncorrectPhrases(processed.transcription2, processed.translatedText2, processed.fromBeginning);    if (processed.fromBeginning === fromBeginning) { return fromBeginning;    }
    // processed = processIncorrectPhrases(processed.transcription2, processed.translatedText2, processed.fromBeginning);    if (processed.fromBeginning === fromBeginning) { return fromBeginning;    }
    // processed = processIncorrectPhrases(processed.transcription2, processed.translatedText2, processed.fromBeginning);    if (processed.fromBeginning === fromBeginning) { return fromBeginning;    }
    // processed = processIncorrectPhrases(processed.transcription2, processed.translatedText2, processed.fromBeginning);    if (processed.fromBeginning === fromBeginning) { return fromBeginning;    }
    // processed = processIncorrectPhrases(processed.transcription2, processed.translatedText2, processed.fromBeginning);    if (processed.fromBeginning === fromBeginning) { return fromBeginning;    }
    do {
        fromBeginning = processed.fromBeginning;
        processed = processIncorrectPhrases(processed.transcription2, processed.translatedText2, processed.fromBeginning);
    } while (processed.fromBeginning.length !== fromBeginning.length);

    // return processed;
    // console.log('Cut translate text:', processed.transcription2.slice(0, 5), processed.translatedText2, '\n\n\n' + processed.fromBeginning);        process.exit();

    return processed.transcription;
};
function processIncorrectPhrases(transcription, translatedText, fromBeginning) {
    let correctedAtFirst = transcription.findIndex((item) => { return item.corrected; });
    let postTextItems = transcription.slice(correctedAtFirst, correctedAtFirst + 5);
    let postText = postTextItems.map((item) => { return item.text; }).join('');
    if (correctedAtFirst > 0) {
        let correctedText = translatedText.substring(0, translatedText.indexOf(postText));
        let correctedContentAtFirst = transcription.slice(0, correctedAtFirst).map((item) => { return item.text; }).join('');
        let correctedTextWordsCount = correctedText.trim().split(' ').length;
        if (correctedTextWordsCount === correctedAtFirst) {
            console.log('Corrected text is correct', correctedText, correctedContentAtFirst);
            // replace transcription with corrected text
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
            // throw new Error('Corrected text is incorrect. Corrected text: ' + correctedText + ' Corrected content at first: ' + correctedContentAtFirst + ' Corrected text words count: ' + correctedTextWordsCount + ' Corrected at first: ' + correctedAtFirst);
        }
    }
    let nextIncorrectedAtFirst = transcription.findIndex((item) => { return !item.corrected; });
    if (nextIncorrectedAtFirst === -1) {
        console.log('From beginning:', fromBeginning);
        return {
            fromBeginning,
            transcription2: [...transcription],
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
    // for (let i = 0; i < transcription.length; i++) {
    //     if (!transcription[i].corrected) {
    //         // let theLastCorrectedIndex = i - 1;
    //         // if (theLastCorrectedIndex < 0) {
    //         //     theLastCorrectedIndex = 0;
    //         // }
    //         // let theLastCorrectedPhrase = transcription.slice(theLastCorrectedIndex - windowSize, theLastCorrectedIndex).map((item) => { return item.text; }).join('');
    //         // let theNextCorrectedIndex = transcription.slice(i).findIndex((item) => { return item.corrected; });
    //         // if (theNextCorrectedIndex === -1) {
    //         //     theNextCorrectedIndex = transcription.length;
    //         // } else {
    //         //     theNextCorrectedIndex += i;
    //         // }
    //         // let theNextCorrectedPhrase = transcription.slice(theNextCorrectedIndex, theNextCorrectedIndex + windowSize).map((item) => { return item.text; }).join('');
    //         // theNextCorrectedPhrase = theNextCorrectedPhrase.trim().toLowerCase();
    //         // theNextCorrectedPhrase = removePunctuation(theNextCorrectedPhrase).trim();
    //         // theLastCorrectedPhrase = theLastCorrectedPhrase.trim().toLowerCase();
    //         // theLastCorrectedPhrase = removePunctuation(theLastCorrectedPhrase).trim();
    //         // // let sequence = transcription.slice(theLastCorrectedIndex, theNextCorrectedIndex).map((item) => { return item.text; }).join('');
    //         // if (translatedText.indexOf(theLastCorrectedPhrase) === -1 || translatedText.indexOf(theNextCorrectedPhrase) === -1) {
    //         //     // console.log('Sequence:', theLastCorrectedPhrase, '-', sequence, '-', theNextCorrectedPhrase);
    //         //     if (windowSize === 1) {
    //         //         // console.log('Cannot correct the phrase:', sequence);
    //         //         return;
    //         //     }
    //         //     i = theNextCorrectedIndex;
    //         // }else{
    //         //     let correctedSequence = translatedText.substring(translatedText.indexOf(theLastCorrectedPhrase) + theLastCorrectedPhrase.length, translatedText.indexOf(theNextCorrectedPhrase));
    //         //     // get the sequence between the last corrected phrase and the next corrected phrase
    //         //     if (correctedSequence.length > 200) {
    //         //         console.log('Corrected sequence is too long:', correctedSequence);
    //         //         throw new Error('Corrected sequence is too long');
    //         //     }
    //         //     // console.log('Sequence:', theLastCorrectedPhrase, '-', correctedSequence, '-', theNextCorrectedPhrase);
    //         //     transcription.splice(theLastCorrectedIndex, theNextCorrectedIndex - theLastCorrectedIndex, { text: " " + correctedSequence.trim(), corrected: true });
    //         //     // replace the sequence with the corrected sequence
    //         //     i = theLastCorrectedIndex + 1;
    //         // }
    //     }
    // }
    // //
    // if (windowSize === 1) {
        // return transcription;
    // }else{
    //     return processIncorrectPhrases(transcription, translatedText, windowSize - 1);
    // }
}
// function substrBetween(str, start, end) {
//     let startIndex = str.indexOf(start);
//     if (startIndex === -1) {
//         return null;
//     }
//     startIndex += start.length;
//     let endIndex = str.indexOf(end, startIndex);
//     if (endIndex === -1) {
//         return null;
//     }
//     return str.substring(startIndex, endIndex);
// }
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
