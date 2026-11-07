<script setup>
// A 3D view of one printed part lying on the Bambu A1's 256 mm bed, as it
// prints, that you can turn and zoom. It also draws small previews of every
// part for the cards (one WebGL renderer for all of them).
import * as THREE from 'three';
import {STLLoader} from 'three/examples/jsm/loaders/STLLoader.js';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js';

const props=defineProps({part:{type:String,required:true},bed:{type:Object,required:true},parts:{type:Array,default:()=>[]}});
const emit=defineEmits(['thumbs']);
const host=ref(null);
let renderer,scene,camera,controls,mesh,frame,observer;
const geometries=new Map();
const loader=new STLLoader();
const load=id=>{
  if(!geometries.has(id))geometries.set(id,loader.loadAsync(`/outputs/print/${id}.stl`).then(g=>{g.computeBoundingBox();g.computeVertexNormals();return g;}));
  return geometries.get(id);
};
const material=new THREE.MeshStandardMaterial({color:0xf0c49a,roughness:.55,metalness:.05});

// The bed: a dark plate with a 32 mm grid, the part sits in the middle in print orientation.
function bedGroup(){
  const g=new THREE.Group(),{x,y}=props.bed;
  const plate=new THREE.Mesh(new THREE.BoxGeometry(x,2,y),new THREE.MeshStandardMaterial({color:0x1b2638,roughness:.9}));
  plate.position.y=-1;g.add(plate);
  const grid=new THREE.GridHelper(x,8,0x5a6f88,0x33445c);grid.position.y=.05;g.add(grid);
  const edge=new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(x,props.bed.z,y)),new THREE.LineBasicMaterial({color:0xefc197,transparent:true,opacity:.18}));
  edge.position.y=props.bed.z/2;g.add(edge);
  return g;
}
// STL is Z up; three is Y up. Centre the part on the bed, resting on it.
function place(geo){
  const m=new THREE.Mesh(geo,material),b=geo.boundingBox;
  m.rotation.x=-Math.PI/2;
  m.position.set(-(b.min.x+b.max.x)/2,-b.min.z,(b.min.y+b.max.y)/2);
  return m;
}
function lights(s){
  s.add(new THREE.HemisphereLight(0xdfe9ff,0x1a1410,1.6));
  const key=new THREE.DirectionalLight(0xffffff,2.2);key.position.set(200,400,260);s.add(key);
  const rim=new THREE.DirectionalLight(0xefc197,1.2);rim.position.set(-300,160,-260);s.add(rim);
}
async function show(id){
  const geo=await load(id);
  if(mesh)scene.remove(mesh);
  mesh=place(geo);scene.add(mesh);
}
// Previews for the cards: each part alone, framed to its own size.
async function thumbs(){
  const s=new THREE.Scene();lights(s);
  const cam=new THREE.PerspectiveCamera(30,4/3,1,5000),out={};
  const size=new THREE.Vector2();renderer.getSize(size);
  const w=480,h=360;renderer.setSize(w,h,false);
  for(const id of props.parts){
    const m=place(await load(id));s.add(m);
    const box=new THREE.Box3().setFromObject(m),c=box.getCenter(new THREE.Vector3()),r=box.getBoundingSphere(new THREE.Sphere()).radius;
    cam.position.copy(c).add(new THREE.Vector3(1,.8,1.2).normalize().multiplyScalar(r/Math.sin(THREE.MathUtils.degToRad(15))*1.05));
    cam.lookAt(c);cam.updateProjectionMatrix();
    renderer.setClearColor(0x000000,0);renderer.render(s,cam);out[id]=renderer.domElement.toDataURL('image/png');
    s.remove(m);
  }
  renderer.setSize(size.x,size.y,false);
  emit('thumbs',out);
}
function resize(){
  const el=host.value;if(!el)return;
  const w=el.clientWidth,h=el.clientHeight;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();
}
onMounted(async()=>{
  renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,preserveDrawingBuffer:true});
  renderer.setPixelRatio(Math.min(devicePixelRatio,2));
  host.value.appendChild(renderer.domElement);
  scene=new THREE.Scene();lights(scene);scene.add(bedGroup());
  camera=new THREE.PerspectiveCamera(34,1,1,5000);camera.position.set(260,300,380);
  controls=new OrbitControls(camera,renderer.domElement);controls.target.set(0,40,0);controls.enableDamping=true;controls.maxDistance=1200;controls.minDistance=120;controls.maxPolarAngle=Math.PI*.49;
  resize();observer=new ResizeObserver(resize);observer.observe(host.value);
  await thumbs();
  resize();
  await show(props.part);
  const loop=()=>{frame=requestAnimationFrame(loop);controls.update();renderer.setClearColor(0x000000,0);renderer.render(scene,camera);};loop();
});
watch(()=>props.part,id=>{if(scene)show(id);});
onBeforeUnmount(()=>{cancelAnimationFrame(frame);observer?.disconnect();controls?.dispose();renderer?.dispose();});
</script>

<template>
  <div ref="host" class="part-viewer" />
</template>

<style scoped>
.part-viewer{position:absolute;inset:0}
.part-viewer :deep(canvas){width:100%;height:100%;display:block;touch-action:none}
</style>
