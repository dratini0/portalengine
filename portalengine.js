/*
portalengine.js - main script file
Copyright (C) 2013 Bálint Kovács
See COPYRIGHT for details
*/

var scene, mainContainer, camera, controls, renderer, gl;
var portals = [], parts = [];
var requestID;
var width, height, aspect;
var loadCount = 0;
var clock;
var manager;
var collada;

//var debugscene, debugcam;

function Portal(geometry, matrix){
    this.matrix = new THREE.Matrix4();
    if(matrix instanceof THREE.Matrix4) {
        this.matrix.copy(matrix);
    } else {
        this.matrix.elements.set(matrix);
    };
    
    this.geometry = [];
    if(geometry instanceof Array){
        for(var i = 0; i < geometry.length; i++){
            this.geometry.push(new THREE.Vector4().copy(geometry[i]));
        };
    } else {
        throw new TypeError("Geometry passed to Portal constructor not an array!");
    };
    
    this._geometry = new THREE.Geometry();
    this.updateGeometry();
    this.mesh = new THREE.Mesh(this._geometry, new THREE.MeshBasicMaterial({color: 0}));
    this.scene = new THREE.Scene();
    this.scene.add(this.mesh);
};

Portal.prototype.makePair = function makePair(){
    var invertedGeometry = [];
    for(var i = this.geometry.length - 1; i >= 0; i--){
    //for(var i = 0; i < this.geometry.length; i++){
        invertedGeometry.push(this.geometry[i].clone().applyMatrix4(this.matrix));
    };
    var invertedMatrix = new THREE.Matrix4().getInverse(this.matrix);
    return new Portal(invertedGeometry, invertedMatrix);
};

Portal.prototype.updateGeometry = function updateGeometry(){
    for(var i = 0; i < this.geometry.length; i++){
        this._geometry.vertices.push(this.geometry[i]);
    };
    for(var i = 2; i < this.geometry.length; i++){
        this._geometry.faces.push(new THREE.Face3(0, i-1, i));
    };
};

function ColladaLoader(manager){
    var scope = this;
    var loader = new THREE.ColladaLoader();
    this.options = loader.options;
    this.load = function load(url, onLoad){
        manager.itemStart(url);
        loader.load(url,
            function onLoad_(event){
                if(onLoad != undefined) onLoad(event);
                manager.itemEnd(url);
            }
        );
    };
};

function loadResources(){
    var loader;
    manager = new THREE.LoadingManager(init);
    loader = new ColladaLoader(manager);
    loader.options.convertUpAxis = true;
    loader.load('room1.dae', function colladaLoad(dae){collada = dae});
};

function init(){
    clock = new THREE.Clock();
    scene = new THREE.Scene();
    width = window.innerWidth;
    height = window.innerHeight;
    aspect = width / height;
    renderer = new THREE.WebGLRenderer(
        {antialias: true, stencil: true});
    renderer.setSize(width, height);
    window.addEventListener( 'resize', onWindowResize, false );
    document.body.appendChild(renderer.domElement);
    gl = renderer.context;
    width = gl.drawingBufferWidth;
    height = gl.drawingBufferHeight;
    renderer.autoClear = false;
    renderer.gammaInput = true;
    renderer.gammaOutput = true;
    gl.enable(gl.STENCIL_TEST);
    fillScene();
    animate();
};

function onWindowResize(){
    width = window.innerWidth;
    height = window.innerHeight;
    aspect = width/height;
    camera.aspect = aspect;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
};

function fillScene(){
    scene = new THREE.Scene();
    
    // Camera
    camera = new THREE.PerspectiveCamera(60, aspect, 0.1, 100);
    camera.position.set(0, 0, 4);
    camera.updateMatrix();
    camera.matrixAutoUpdate = false;
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    
    /*/ Lights //replaced by collada!
    var ambient = new THREE.AmbientLight(0x222222);
    scene.add(ambient);
    var directional = new THREE.DirectionalLight(0xffffff);
    directional.position.set( 0.5, 1, 0.2 );
    scene.add(directional);
    
    // Objects
    var geometry, object, container, material;
    geometry = new THREE.SphereGeometry(1, 32, 16);
    material = new THREE.MeshLambertMaterial({shading: THREE.FlatShading});
    object = new THREE.Mesh(geometry, material);
    scene.add(object);
    
    geometry = new THREE.CubeGeometry(-10, -10, -10); // this makes a room!
    for(var i = 0; i < geometry.faces.length; i++){
        geometry.faces[i].normal.negate();
    };
    object = new THREE.Mesh(geometry, material);
    scene.add(object);*/
    
    scene.add(collada.scene);
    
    var portal, pgeom, pmatrix;
    pgeom = [new THREE.Vector3(-7.5, -5, -10), new THREE.Vector3(7.5, -5, -10),
             new THREE.Vector3(7.5, 5, -10), new THREE.Vector3(-7.5, 5, -10)];
    pmatrix = new THREE.Matrix4().makeTranslation(0, 0, 20);
    pmatrix.multiply(new THREE.Matrix4().makeScale(0.5, 1, 1));
    portal = new Portal(pgeom, pmatrix);
    portals.push(portal);
    portals.push(portal.makePair());
    
    /*debugscene = new THREE.Scene();
    var geometry, object, material;
    geometry = new THREE.PlaneGeometry(2, 2);
    material = new THREE.MeshBasicMaterial({color: 0});
    object = new THREE.Mesh(geometry, material);
    debugscene.add(object);
    debugcam = new THREE.OrthographicCamera(-1, 1, 1, -1, 1, -1);*/
};

function render(){
    controls.update(clock.getDelta());
    camera.updateMatrix();
    var cameraMatrix = camera.matrix.clone();
    
    // Actual render!
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    for(var i = 0; i < portals.length; i++){
        // draw stencil
        gl.colorMask(false, false, false, false);
        gl.depthMask(false);
        gl.stencilMask(true);
        gl.clear(gl.STENCIL_BUFFER_BIT);
        gl.stencilFunc(gl.NEVER, 1, 0x1);
        gl.stencilOp(gl.REPLACE, gl.REPLACE, gl.REPLACE);
        renderer.render(portals[i].scene, camera);

        // draw behind stencil
        gl.colorMask(true, true, true, true);
        gl.depthMask(true);
        gl.stencilMask(false);
        gl.stencilFunc(gl.EQUAL, 1, 0x1);
        camera.matrix.multiplyMatrices(portals[i].matrix, cameraMatrix);
        camera.matrixWorldNeedsUpdate = true;
        renderer.render(scene, camera);
        camera.matrix.copy(cameraMatrix);
        camera.matrixWorldNeedsUpdate = true;
    };
    
    //add z-masks
    gl.clear(gl.DEPTH_BUFFER_BIT);
    gl.stencilFunc(gl.ALWAYS, 1, 0x1);
    gl.colorMask(false, false, false, false);
    for(var i = 0; i < portals.length; i++){
        renderer.render(portals[i].scene, camera);
    };
    
    // render root scene
    gl.colorMask(true, true, true, true);
    camera.matrix.copy(cameraMatrix);
    camera.matrixWorldNeedsUpdate = true;
    renderer.render(scene, camera);
    //debugger;
};
function animate(){
    render();
    requestID = window.requestAnimationFrame(animate);
    //requestID = window.setTimeout(animate, 500);
};

function stopHandler(e){
    if(e.keyCode == 81) window.cancelAnimationFrame(requestID);
};

window.addEventListener("load", loadResources, false);
window.addEventListener("keydown", stopHandler, false);
