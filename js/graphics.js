import * as THREE from '../build/three.module.js';

var camera, scene, renderer, object;
var planes, planeObjects, planeHelpers;
var clock;
var analyser;

var params = {

    animate: true,
    planeX: {

        constant: 0,
        negated: false,
        displayHelper: false

    },
    planeY: {

        constant: 0,
        negated: false,
        displayHelper: false

    },
    planeZ: {

        constant: 0,
        negated: false,
        displayHelper: false

    }


};

init();
animate();

function createPlaneStencilGroup( geometry, plane, renderOrder ) {

    var group = new THREE.Group();
    var baseMat = new THREE.MeshBasicMaterial();
    baseMat.depthWrite = false;
    baseMat.depthTest = false;
    baseMat.colorWrite = false;
    baseMat.stencilWrite = true;
    baseMat.stencilFunc = THREE.AlwaysStencilFunc;

    // back faces
    var mat0 = baseMat.clone();
    mat0.side = THREE.BackSide;
    mat0.clippingPlanes = [ plane ];
    mat0.stencilFail = THREE.IncrementWrapStencilOp;
    mat0.stencilZFail = THREE.IncrementWrapStencilOp;
    mat0.stencilZPass = THREE.IncrementWrapStencilOp;

    var mesh0 = new THREE.Mesh( geometry, mat0 );
    mesh0.renderOrder = renderOrder;
    group.add( mesh0 );

    // front faces
    var mat1 = baseMat.clone();
    mat1.side = THREE.FrontSide;
    mat1.clippingPlanes = [ plane ];
    mat1.stencilFail = THREE.DecrementWrapStencilOp;
    mat1.stencilZFail = THREE.DecrementWrapStencilOp;
    mat1.stencilZPass = THREE.DecrementWrapStencilOp;

    var mesh1 = new THREE.Mesh( geometry, mat1 );
    mesh1.renderOrder = renderOrder;

    group.add( mesh1 );

    return group;

}

function init() {

    clock = new THREE.Clock();

    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera( 36, window.innerWidth / window.innerHeight, 1, 100 );
    camera.position.set( 2, 2, 2 );


    var listener = new THREE.AudioListener();
    camera.add(listener);

    var sound = new THREE.Audio(listener);

    var audioLoader = new THREE.AudioLoader();
    audioLoader.load("resources/sounds/supine.mp3", function(buffer) {
        sound.setBuffer(buffer);
        sound.play();
    });


    analyser = new THREE.AudioAnalyser(sound, 32);


    scene.add( new THREE.AmbientLight( 0xffffff, 0.5 ) );

    var dirLight = new THREE.DirectionalLight( 0xffffff, 1 );
    dirLight.position.set( 5, 10, 7.5 );
    dirLight.castShadow = true;
    dirLight.shadow.camera.right = 2;
    dirLight.shadow.camera.left = - 2;
    dirLight.shadow.camera.top	= 2;
    dirLight.shadow.camera.bottom = - 2;

    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    scene.add( dirLight );

    planes = [
        new THREE.Plane( new THREE.Vector3( - 1, 0, 0 ), 0 ),
        new THREE.Plane( new THREE.Vector3( 0, - 1, 0 ), 0 ),
        new THREE.Plane( new THREE.Vector3( 0, 0, - 1 ), 0 )
    ];

    planeHelpers = planes.map( p => new THREE.PlaneHelper( p, 2, 0xffffff ) );
    planeHelpers.forEach( ph => {

        ph.visible = false;
        scene.add( ph );

    } );

    var geometry = new THREE.TorusKnotBufferGeometry( 0.4, 0.15, 220, 60 );
    object = new THREE.Group();
    scene.add( object );

    // Set up clip plane rendering
    planeObjects = [];
    var planeGeom = new THREE.PlaneBufferGeometry( 4, 4 );
    for ( var i = 0; i < 3; i ++ ) {

        var poGroup = new THREE.Group();
        var plane = planes[ i ];
        var stencilGroup = createPlaneStencilGroup( geometry, plane, i + 1 );

        // plane is clipped by the other clipping planes
        var planeMat =
            new THREE.MeshStandardMaterial( {

                color: 0xE91E63,
                metalness: 0.1,
                roughness: 0.75,
                clippingPlanes: planes.filter( p => p !== plane ),

                stencilWrite: true,
                stencilRef: 0,
                stencilFunc: THREE.NotEqualStencilFunc,
                stencilFail: THREE.ReplaceStencilOp,
                stencilZFail: THREE.ReplaceStencilOp,
                stencilZPass: THREE.ReplaceStencilOp,

            } );
        var po = new THREE.Mesh( planeGeom, planeMat );
        po.onAfterRender = function ( renderer ) {

            renderer.clearStencil();

        };
        po.renderOrder = i + 1.1;

        object.add( stencilGroup );
        poGroup.add( po );
        planeObjects.push( po );
        scene.add( poGroup );

    }

    var material = new THREE.MeshStandardMaterial( {

        color: 0xFFC107,
        metalness: 0.1,
        roughness: 0.75,
        clippingPlanes: planes,
        clipShadows: true,
        shadowSide: THREE.DoubleSide,

    } );


    // add the color
    var clippedColorFront = new THREE.Mesh( geometry, material );
    clippedColorFront.castShadow = true;
    clippedColorFront.renderOrder = 6;
    object.add( clippedColorFront );


    var ground = new THREE.Mesh(
        new THREE.PlaneBufferGeometry( 9, 9, 1, 1 ),
        new THREE.ShadowMaterial( { color: 0, opacity: 0.25, side: THREE.DoubleSide } )
    );

    ground.rotation.x = - Math.PI / 2; // rotates X/Y to X/Z
    ground.position.y = - 1;
    ground.receiveShadow = true;
    scene.add( ground );


    // Renderer
    renderer = new THREE.WebGLRenderer( { antialias: true } );
    renderer.shadowMap.enabled = true;
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );
    renderer.setClearColor( 0x263238 );
    window.addEventListener( 'resize', onWindowResize, false );
    document.body.appendChild( renderer.domElement );

    renderer.localClippingEnabled = true;

}

function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize( window.innerWidth, window.innerHeight );

}

function animate() {

    var avgSoundFrequency = analyser.getAverageFrequency();
    var frequencyData = analyser.getFrequencyData();
    var avgVolume = (frequencyData.reduce((a, b) => a + b, 0))/ 1000;

    var delta = clock.getDelta();

    requestAnimationFrame( animate );

    if ( params.animate ) {

        object.rotation.x += Math.pow(avgVolume, 5) / 1000;
        object.rotation.y += Math.pow(avgVolume, 5) / 1000;

    }

    for ( var i = 0; i < planeObjects.length; i ++ ) {

        var plane = planes[ i ];
        var po = planeObjects[ i ];
        plane.coplanarPoint( po.position );
        po.lookAt(
            po.position.x - plane.normal.x,
            po.position.y - plane.normal.y,
            po.position.z - plane.normal.z,
        );

    }

    renderer.render( scene, camera );
}
