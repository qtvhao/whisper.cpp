console.log('Hello World!');
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
(async function(){
    console.log('Start whispering...');
    let modelFile = '/whisper.cpp/models/ggml-tiny.bin';
    let inputFile = '/whisper.cpp/in.wav';

    let djb2Str = djb2(translated.join(''));
    let outputFile = '/whisper.cpp/output/x' + djb2Str +'.json';
    let whisperExecFile = 'whisper.cpp';
    //
    await whisperFile(modelFile, inputFile, outputFile, whisperExecFile);
    let outputSrt = fs.readFileSync(outputFile, 'utf8');
    console.log(outputSrt);
    console.log(translated);
})();
