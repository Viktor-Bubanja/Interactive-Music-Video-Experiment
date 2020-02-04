import * as THREE from '../build/three.module.js';

let scene, camera, renderer;
let group;
let songPart1, songPart2, analyserPart1, analyserPart2;
let secondAct = false;

init();

function init() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(36, window.innerWidth / window.innerHeight, 1, 100);
    camera.position.set(0,0,5);

    group = new THREE.Group();

    initialiseLight();
    initialiseSound();
    initialiseAudioAnalyserPart1();
    initialiseAudioAnalyserPart2();
    initialiseRenderer();
}

function initialiseSound() {
    let listener = new THREE.AudioListener();
    camera.add(listener);

    songPart1 = new THREE.Audio(listener);
    songPart2 = new THREE.Audio(listener);

    document.getElementById('song1').addEventListener('click', function() {
        let audioLoader = new THREE.AudioLoader();
        songPart1 = new THREE.Audio(listener);
        audioLoader.load("resources/sounds/supine_part1.mp3", function(buffer) {
            songPart1.setBuffer(buffer);
            songPart1.play();

            initialiseAudioAnalyserPart1();
            animateFirstSection();
        });

        let slider = document.getElementById("detuner");
        slider.oninput = function() {
            songPart1.setPlaybackRate(Math.pow(slider.value / 50, 0.5));
            console.log(slider.value);
        }
    });

    document.getElementById('song2').addEventListener('click', function() {
        secondAct = true;
        let audioLoader = new THREE.AudioLoader();
        songPart2 = new THREE.Audio(listener);
        audioLoader.load("resources/sounds/supine_part2.mp3", function(buffer) {
            songPart2.setBuffer(buffer);
            songPart2.play();
            songPart1.stop();
            initialiseAudioAnalyserPart2();
            animateSecondSection();
        });
    });
}

function initialiseAudioAnalyserPart1() {
    let fftSize = 32;
    analyserPart1 = new THREE.AudioAnalyser(songPart1, fftSize);
}

function initialiseAudioAnalyserPart2() {
    let fftSize = 32;
    analyserPart2 = new THREE.AudioAnalyser(songPart2, fftSize);
}

function animateFirstSection() {
    let geometry = new THREE.BoxGeometry(0.01, 0.01, 0.01);
    let material = new THREE.MeshBasicMaterial({color: 0xff0051});
    let dot = new THREE.Mesh(geometry, material);
    let data = analyserPart1.getAverageFrequency() / 10;
    dot.position.set(((Math.random() * 2) - 1) * data, Math.random() * data, -1 * Math.random() * data);


    group.add(dot);
    scene.add(group);

    requestAnimationFrame(animateFirstSection);
    renderer.render(scene, camera);
}

function animateSecondSection() {
    var frequencyData = analyserPart2.getFrequencyData();
    var avgVolume = (frequencyData.reduce((a, b) => a + b, 0)) / 1000;

    group.rotation.x =  avgVolume / 10;

    requestAnimationFrame(animateSecondSection);
    renderer.render(scene, camera);
}

function initialiseRenderer() {
    renderer = new THREE.WebGLRenderer( { antialias: true } );
    renderer.shadowMap.enabled = true;
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );
    renderer.setClearColor( 0x263238 );
    window.addEventListener( 'resize', onWindowResize, false );
    document.body.appendChild( renderer.domElement );

    renderer.localClippingEnabled = true;
}

function initialiseLight() {
    scene.add(new THREE.AmbientLight(0xffffff, 0.5 ));
    let dirLight = new THREE.DirectionalLight( 0xffffff, 1 );
    dirLight.position.set( 5, 10, 7.5 );
    dirLight.castShadow = true;
    dirLight.shadow.camera.right = 2;
    dirLight.shadow.camera.left = - 2;
    dirLight.shadow.camera.top	= 2;
    dirLight.shadow.camera.bottom = - 2;

    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    scene.add( dirLight );
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize( window.innerWidth, window.innerHeight );

}
