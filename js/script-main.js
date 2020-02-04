import {BufferLoader} from "./BufferLoader.js";

window.onload = init;
let context;
let bufferLoader;
let analyser;
let dataArray;

function init() {
    // webkitAudioContext is for Chrome, otherwise use AudioContext.
    window.AudioContext = window.AudioContext || window.webkitAudioContext;
    context = new AudioContext();

    bufferLoader = new BufferLoader(
        context,
        [
            './resources/sounds/kick.wav',
            './resources/sounds/snare.wav',
            './resources/sounds/opera_part1.mp3',
            './resources/sounds/opera_part2.mp3'
        ],
        finishedLoading
    );

    bufferLoader.load();

    document.getElementById("song2").addEventListener("click", function() {
        document.getElementById("click_text").style.display = "none";
    })
}

function finishedLoading(bufferList) {

    // Kick
    document.getElementById('kick').addEventListener('click', function() {
        let source = context.createBufferSource();
        source.buffer = bufferList[0];

        source.connect(context.destination);
        source.start(0);
    });

    //Snare
    document.getElementById('snare').addEventListener('click', function() {
        let source = context.createBufferSource();
        source.buffer = bufferList[1];

        source.connect(context.destination);
        source.start(0);
    });

    // Song part 1
    document.getElementById('song').addEventListener('click', function() {
        let source = context.createBufferSource();
        source.buffer = bufferList[2];

        source.connect(context.destination);
        source.start(0);
        source.onended = function() {
            document.getElementById("song2").style.display = "block";
            document.getElementById("click_text").style.display = "block";
        };

    });

    // Song part 2
    document.getElementById('song2').addEventListener('click', function() {

        let source = context.createBufferSource();
        source.buffer = bufferList[3];

        source.connect(context.destination);
        source.start(0);

        analyser = context.createAnalyser();
        analyser.fftSize = 2048;
        let bufferLength = analyser.frequencyBinCount;
        dataArray = new Uint8Array(bufferLength);
        analyser.getByteTimeDomainData(dataArray);
        source.connect(analyser);

    });

    function draw() {
        const WIDTH = 10;
        const HEIGHT = 20;
        canvasCtx.clearRect(0, 0, WIDTH, HEIGHT);
        let drawVisual = requestAnimationFrame(draw);
        analyser.getByteTimeDomainData(dataArray);

        canvasCtx.fillStyle = 'rgb(200, 200, 200)';
        canvasCtx.fillRect(0, 0, WIDTH, HEIGHT);
    }

}

