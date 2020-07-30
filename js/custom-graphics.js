import * as THREE from '../build/three.module.js';

let scene, camera, renderer, listener;
let group;
let songPart1, songPart2, analyserPart1, analyserPart2;
let secondAct = false;


init();

function init() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(36, window.innerWidth / window.innerHeight, 1, 100);
    camera.position.set(0,0,0);
    camera.lookAt(0, 0, 10);

    group = new THREE.Group();

    renderer = new THREE.WebGLRenderer( { antialias: true } );
    renderer.shadowMap.enabled = true;
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );
    renderer.setClearColor( 0x000000 );
    window.addEventListener( 'resize', onWindowResize, false );
    document.body.appendChild( renderer.domElement );

    renderer.localClippingEnabled = true;

    initialiseLight();
    initialiseSound();
    animateSwarm();
    initialiseAudioAnalyserPart1();
    initialiseAudioAnalyserPart2();
    initialiseKeysSlider();
}


function initialiseSound() {
    listener = new THREE.AudioListener();
    camera.add(listener);
    songPart1 = new THREE.Audio(listener);
    songPart2 = new THREE.Audio(listener);

    document.getElementById('pauseSong1').addEventListener('click', function() {
        songPart1.pause();
    })

    document.getElementById('pauseSong2').addEventListener('click', function() {
        songPart2.pause();
    })

    document.getElementById('song1').addEventListener('click', function() {
        let audioLoader = new THREE.AudioLoader();

        initialisePlaybackSlider();
        initialiseFilterSlider();
        audioLoader.load("resources/sounds/supine_part1.mp3", function(buffer) {
            songPart1.setBuffer(buffer);
            songPart1.play();
            initialiseAudioAnalyserPart1();
            animateFirstSection();
        });
    });

    document.getElementById('song2').addEventListener('click', function() {
        secondAct = true;
        let audioLoader = new THREE.AudioLoader();

        initialiseFilterSlider();
        audioLoader.load("resources/sounds/supine_part2.mp3", function(buffer) {
            songPart2.setBuffer(buffer);
            songPart2.play();
            songPart1.stop();
            initialiseAudioAnalyserPart2();
            animateSecondSection();
        });
    });
}

function initialiseKeysSlider() {
    const audioLoader = new THREE.AudioLoader();
    const key1 = loadSound(audioLoader, "resources/sounds/keys/E.mp3");
    const key2 = loadSound(audioLoader, "resources/sounds/keys/A.mp3");
    const key3 = loadSound(audioLoader, "resources/sounds/keys/B.mp3");
    const key4 = loadSound(audioLoader, "resources/sounds/keys/C.mp3");
    const key5 = loadSound(audioLoader, "resources/sounds/keys/C2.mp3");
    const key6 = loadSound(audioLoader, "resources/sounds/keys/E2.mp3");
    const key7 = loadSound(audioLoader, "resources/sounds/keys/F.mp3");
    const keys = [key1, key2, key3, key4, key5, key6, key7];

    let slider = document.getElementById("keys");
    slider.oninput = function() {
        for (const key of keys) {
            if (key.isPlaying === true) {
                key.stop();
            }
        }
        keys[slider.value].play();
    };
}

function loadSound(audioLoader, path) {
    let audio = new THREE.Audio(listener);
    audioLoader.load(path, function(buffer) {
        audio.setBuffer(buffer);
    });
    return audio;
}


function initialisePlaybackSlider() {
    let slider = document.getElementById("detuner");
    slider.oninput = function() {
        songPart1.setPlaybackRate(Math.pow(slider.value / 50, 0.5));
        group.rotation.x = -1 * (group.rotation.x + 50 - slider.value) / 1000;
    }
}

function initialiseFilterSlider() {
    let slider = document.getElementById("filter");
    // let audioContext = new AudioContext();
    let filter = songPart1.context.createBiquadFilter();
    songPart1.setFilter(filter);
    filter.type = "lowpass";
    filter.frequency.value = 10000;
    slider.oninput = function() {
        filter.frequency.value = slider.value
    };
}

function initialiseAudioAnalyserPart1() {
    let fftSize = 32;
    analyserPart1 = new THREE.AudioAnalyser(songPart1, fftSize);
}

function initialiseAudioAnalyserPart2() {
    let fftSize = 32;
    analyserPart2 = new THREE.AudioAnalyser(songPart2, fftSize);
}


function animateSwarm() {
    let geom = new THREE.Geometry();
    let v1 = new THREE.Vector3(0, 20, 0);
    let v2 = new THREE.Vector3(5, 20, 0);
    let v3 = new THREE.Vector3(5, 20, -5);
    let triangle = new THREE.Triangle(v1, v2, v3);
    let normal = triangle.getNormal();
    geom.vertices.push(triangle.a);
    geom.vertices.push(triangle.b);
    geom.vertices.push(triangle.c);
    geom.faces.push(new THREE.Face3(0, 1, 2, normal));
    let mesh = new THREE.Mesh(geom, new THREE.MeshNormalMaterial());
    scene.add(mesh);
    requestAnimationFrame(animateSwarm);
    renderer.render(scene, camera);
}

function animateFirstSection() {
    let geometry = new THREE.SphereGeometry(0.01, 10, 10);
    let material = new THREE.MeshBasicMaterial({color: 0xff0051});
    let dot = new THREE.Mesh(geometry, material);
    let data = analyserPart1.getAverageFrequency() / 10;
    dot.position.set(
        ((Math.random() * 2) - 1) * data,
        Math.random() * data - 5,
        (Math.random() * data + 10) % 100);
    console.log(dot.position)
    //
    // dot.position.set(0, 10, 10)

    group.add(dot);
    scene.add(group);

    setTimeout(function() {
        requestAnimationFrame(animateFirstSection);
        renderer.render(scene, camera);
        }, 200);

}

function animateSecondSection() {
    let frequencyData = analyserPart2.getFrequencyData();
    let avgVolume = (frequencyData.reduce((a, b) => a + b, 0));
    let avgFrequency = analyserPart2.getAverageFrequency();

    for (const dot of group.children) {
        console.log(dot.position.y);
        if (dot.position.y > 7) {
            let red = Math.min(Math.max(0.7, dot.position.y * avgFrequency / 1000), 0.95);
            let green = Math.min(Math.max(0.3, Math.random() * dot.position.y * avgFrequency / 1500), 0.6);
            let blue = Math.min(Math.max(0.3, Math.random() * dot.position.y * avgFrequency / 1500), 0.6);
            dot.material.color.setRGB(red, green, blue);
        }
    }

    group.rotation.x =  avgVolume / 80000;

    requestAnimationFrame(animateSecondSection);
    renderer.render(scene, camera);
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
