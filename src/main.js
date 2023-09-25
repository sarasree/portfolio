
import {
  Scene,
  WebGLRenderer,
  PerspectiveCamera,
  AmbientLight,
  InstancedMesh,
  Matrix4,
  Vector3,
  Object3D,
  Color,
  DirectionalLight,
  HemisphereLight,
  MeshLambertMaterial,
  BasicShadowMap,
  SRGBColorSpace,
  AxesHelper,
  AnimationMixer,
  LoadingManager,
} from "three";

import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { DRACOLoader } from "./DarcoLoader";
import { MeshSurfaceSampler } from "three/examples/jsm/math/MeshSurfaceSampler";

const size = {};
size.width = window.innerWidth;
size.height = window.innerHeight;

const canvas = document.querySelector("canvas.webgl");
canvas.style.position = "fixed";
canvas.style.background =
  "linear-gradient(0deg, hsl(200, 50%,100%) 50%, hsl(214,80%,70%) 100%)";

const renderer = new WebGLRenderer({
  canvas,
  antialias: true,
  alpha: true,
  performance: "high-performance",
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = BasicShadowMap;
window.renderer = renderer;
renderer.outputColorSpace = SRGBColorSpace;

const scene = new Scene();
const camera = new PerspectiveCamera(60, size.width / size.height, 1, 1000);
camera.position.set(0, 4, 150);

const controls = new OrbitControls(camera, renderer.domElement);

controls.enableDamping = true;
controls.minPolarAngle = Math.PI / 2.4;
controls.maxPolarAngle = Math.PI / 2;

controls.rotateSpeed = 0.5;
controls.minDistance = 15;
controls.maxDistance = 20;

let axesHelper = new AxesHelper(5, 5, 5);
axesHelper.geometry.translate(0, 0, 11);
axesHelper.position.set(0, 0, 0);
scene.add(axesHelper);

scene.add(new AmbientLight("white", 0.5));

const hemiLight = new HemisphereLight(0xfff, 0xfff, 0.6);
hemiLight.color.setHSL(0.6, 1, 0.6);
hemiLight.groundColor.setHSL(0.095, 1, 0.75);
hemiLight.position.set(0, 500, 0);
scene.add(hemiLight);

let shadowMapSize = 13;
const sunLight = new DirectionalLight(0xffffff, 1, 100);
window.sunLight = sunLight;
sunLight.position.set(0, 12, 12);
sunLight.color.setHSL(0.1, 1, 0.95);
sunLight.visible = true;
sunLight.castShadow = true;
sunLight.shadow.mapSize.width = 2048;
sunLight.shadow.mapSize.height = 2048;
sunLight.shadow.camera.near = 0.5;
sunLight.shadow.camera.far = shadowMapSize * 2;
sunLight.shadow.camera.top = shadowMapSize;
sunLight.shadow.camera.bottom = -shadowMapSize;
sunLight.shadow.camera.left = -shadowMapSize;
sunLight.shadow.camera.right = shadowMapSize;
sunLight.shadow.normalBias = 0.02;
//sunLight.intensity = 0.2
scene.add(sunLight);
scene.add(sunLight.target);

let isLoaded = false;

const loadingManager = new LoadingManager();

let explore = document.getElementsByClassName("explore")[0];
let dragHelper = document.getElementsByClassName('helper')[0] 

dragHelper.ontouchstart = dragHelper.onclick = (e) => {
  e.stopPropagation();
  dragHelper.classList.toggle('disabled');
}




explore.onclick=()=>{

  document.getElementsByClassName('loading__screen')[0].classList.toggle('disabled');
}



loadingManager.onProgress = (url, itemsLoaded, itemsTotal) => {
  let percent = (itemsLoaded / itemsTotal) * 100;
  explore.innerText = "Loading . . .";
  explore.style.color = "black";
  explore.style.backgroundImage = `linear-gradient(to right, #542BEC ${percent}% , #fff ${percent}%)`;
};

loadingManager.onLoad = () => {
  isLoaded = true;
  explore.innerHTML = "Explore my world &nbsp ➔";
  explore.classList.toggle("progress");
  explore.style.color = "white";
  explore.style.color = "";
  explore.style.backgroundImage = ``;
};

const loader = new GLTFLoader(loadingManager);
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath("js/draco/");
loader.setDRACOLoader(dracoLoader);

const dummy = new Object3D();
let _normal = new Vector3();
let _position = new Vector3();

let sampler, Tree, Cyclist;

let cyclistMixer, cyclistAnimation;

const count = 20;

loadModel("models/treeline.glb", loadTreeline);

function loadTreeline(gltf) {
  const treeline = gltf.scene.getObjectByName("Treeline");
  sampler = new MeshSurfaceSampler(treeline);
  sampler.build();
  loadModel("models/tree.glb", loadTree);
  loadModel("models/island.glb", loadGround);
  loadModel("models/cyclist.glb", loadCyclist);
}

function loadGround(gltf) {
  gltf.scene.traverse((node) => {
    if (node.isMesh) {
      node.castShadow = true;
      node.receiveShadow = true;
    }
  });
  scene.add(gltf.scene);
}

function loadCyclist(gltf) {
  Cyclist = gltf.scene;

  gltf.scene.traverse((node) => {
    if (node.isMesh) {
      node.castShadow = true;
      node.receiveShadow = true;
    }
  });

  gltf.scene.scale.set(0.7, 0.7, 0.7);
  scene.add(gltf.scene);
  cyclistMixer = new AnimationMixer(Cyclist);
  cyclistAnimation = cyclistMixer.clipAction(gltf.animations[0]);
  cyclistAnimation.play();
}

function loadTree(gltf) {
  const treePalette = [0x320daa, 0x411bc7, 0x5028e3];
  const _tree = gltf.scene.getObjectByName("tree");
  const material = new MeshLambertMaterial();
  const defaultTransform = new Matrix4()
    .makeRotationX(-Math.PI)
    .multiply(new Matrix4().makeScale(0.1, 0.1, 0.1));
  _tree.geometry.applyMatrix4(defaultTransform);
  Tree = new InstancedMesh(_tree.geometry, material, count);
  Tree.castShadow = true;
  Tree.receiveShadow = true;
  scene.add(Tree);

  for (let i = 0; i < count; i++) {
    sampler.sample(_position, _normal);
    dummy.position.copy(_position);
    _normal.add(_position);
    dummy.lookAt(_normal);
    let scale = random(0.3, 0.7);
    dummy.scale.set(scale, scale, scale);
    dummy.updateMatrix();
    Tree.setMatrixAt(i, dummy.matrix);
    Tree.setColorAt(
      i,
      new Color().setHex(treePalette[Math.floor(Math.random() * 3)])
    );
    Tree.instanceMatrix.needsUpdate = true;
    Tree.instanceColor.needsUpdate = true;
  }
}

const radius = 11.8;
let lastCycleAngle = 0,
  lastTimeStrap = 0,
  cycleAngleSpeed = 0,
  cycleAngle = 0;

const calculateCycleAngleSpeed = () => {
  const currentTimeStrap = performance.now();
  const deltaTime = currentTimeStrap - lastTimeStrap;
  const currentCycleAngle = controls.getAzimuthalAngle();
  let cycleAngleChange = currentCycleAngle - lastCycleAngle;
  cycleAngleSpeed = cycleAngleChange / deltaTime;

  if (cycleAngleChange > Math.PI) {
    cycleAngleChange -= 2 * Math.PI;
  } else if (cycleAngleChange < -Math.PI) {
    cycleAngleChange += 2 * Math.PI;
  }

  if (deltaTime > 0) {
    cycleAngleSpeed = cycleAngleChange / deltaTime;
  } else {
    cycleAngleSpeed = 0;
  }

  lastCycleAngle = currentCycleAngle;
  lastTimeStrap = currentTimeStrap;

  return cycleAngleSpeed;
};

let isFirst = true;
controls.enabled = false;
function animate() {

  cycleAngle = controls.getAzimuthalAngle();
  if (Cyclist) {
    Cyclist.position.x = Math.sin(cycleAngle) * radius;
    Cyclist.position.z = Math.cos(cycleAngle) * radius;
    Cyclist.rotation.y = cycleAngle;
    cyclistMixer.update(calculateCycleAngleSpeed() * 50);
  }
  if( camera.position.z > 16 &&  isFirst && isLoaded ){
    camera.position.z -= 0.75;
  }else if(isLoaded) {
    isFirst = false;
    controls.enabled = true
    camera.position.y = Math.PI / 2 + Math.sin((cycleAngle * Math.PI) / 2);
  } 


  renderer.render(scene, camera);
  window.requestAnimationFrame(animate);
}

animate();

window.addEventListener("resize", () => {
  size.width = window.innerWidth;
  size.height = window.innerHeight;
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(size.width, size.height);
  renderer.setPixelRatio(window.devicePixelRatio);
});



function random(min, max) {
  return Math.random() * (1 + (max - min)) + min;
}

function loadModel(url, oncomplete) {
  loader.load(url, oncomplete);
}
