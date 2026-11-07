<script setup>
// The 3D view on the 3D prints page. In 'prop' mode it shows a finished prop
// (src/print/assembly.js): the printed parts in gold where they sit once built,
// with the strip, coro, pixels, bricks and pole round them. In 'part' mode it
// shows one part lying on the Bambu A1's 256 mm bed, as it prints. It also
// draws the small previews for the cards, with the same WebGL renderer.
import * as THREE from 'three';
import {STLLoader} from 'three/examples/jsm/loaders/STLLoader.js';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js';
import {ASSEMBLIES,COLORS} from '~~/src/print/assembly.js';

const props=defineProps({mode:{type:String,default:'prop'},prop:{type:String,required:true},part:{type:String,required:true},bed:{type:Object,required:true},parts:{type:Array,default:()=>[]}});
const emit=defineEmits(['thumbs']);
const host=ref(null);
let renderer,scene,camera,controls,content,bed,frame,observer;
const geometries=new Map(),loader=new STLLoader();
const load=id=>{
  if(!geometries.has(id))geometries.set(id,loader.loadAsync(`/outputs/print/${id}.stl`).then(g=>{g.computeBoundingBox();g.computeVertexNormals();return g;}));
  return geometries.get(id);
};
const mat={};
const material=(color,extra={})=>{const k=`${color}-${JSON.stringify(extra)}`;return mat[k]??=new THREE.MeshStandardMaterial({color,roughness:.6,metalness:.05,...extra});};
const printed=()=>material(COLORS.printed,{roughness:.5});

function bedGroup(){
  const g=new THREE.Group(),{x,y}=props.bed;
  const plate=new THREE.Mesh(new THREE.BoxGeometry(x,2,y),material(0x1b2638,{roughness:.9}));
  plate.position.y=-1;g.add(plate);
  const grid=new THREE.GridHelper(x,8,0x5a6f88,0x33445c);grid.position.y=.05;g.add(grid);
  const edge=new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(x,props.bed.z,y)),new THREE.LineBasicMaterial({color:0xefc197,transparent:true,opacity:.18}));
  edge.position.y=props.bed.z/2;g.add(edge);
  return g;
}
// A part alone, Y up and resting in the middle of the bed.
function placeOnBed(geo){
  const m=new THREE.Mesh(geo,printed()),b=geo.boundingBox;
  m.rotation.x=-Math.PI/2;
  m.position.set(-(b.min.x+b.max.x)/2,-b.min.z,(b.min.y+b.max.y)/2);
  return m;
}
const V=a=>new THREE.Vector3(...a);
// A flat box from a to b, w wide and t thick with its face towards n.
function slab(a,b,n,w,t,color){
  const A=V(a),B=V(b),dir=B.clone().sub(A),len=dir.length();dir.normalize();
  const z=V(n).sub(dir.clone().multiplyScalar(V(n).dot(dir))).normalize(),y=z.clone().cross(dir);
  const m=new THREE.Mesh(new THREE.BoxGeometry(len,w,t),material(color));
  m.matrixAutoUpdate=false;m.matrix.makeBasis(dir,y,z).setPosition(A.clone().add(B).multiplyScalar(.5));
  return m;
}
async function assembly(id){
  const g=new THREE.Group(),bulb=new THREE.SphereGeometry(6,12,8);
  for(const it of ASSEMBLIES[id].items){
    if(it.stl){
      const m=new THREE.Mesh(await load(it.stl),printed()),[r0,r1,r2]=it.m;
      m.matrixAutoUpdate=false;m.matrix.set(...r0,it.t[0],...r1,it.t[1],...r2,it.t[2],0,0,0,1);g.add(m);
    }else if(it.ground==='paving'){
      const p=new THREE.Mesh(new THREE.BoxGeometry(2400,2400,20),material(COLORS.paving,{roughness:.95}));p.position.z=-10;p.userData.ground=true;g.add(p);
    }else if(it.box){
      const m=new THREE.Mesh(new THREE.BoxGeometry(...it.box),material(it.ground==='bush'?COLORS.bush:it.color,it.ground==='bush'?{roughness:1}:{}));
      m.position.set(...it.c);m.rotation.z=(it.rz??0)*Math.PI/180;m.userData.ground=!!it.ground;g.add(m);
    }else if(it.cyl){
      const {r,z0,z1}=it.cyl,m=new THREE.Mesh(new THREE.CylinderGeometry(r,r,z1-z0,24),material(it.color));
      m.rotation.x=Math.PI/2;m.position.set(it.at[0],it.at[1],(z0+z1)/2);g.add(m);
    }else if(it.strip){
      const {a,b,n,w,t}=it.strip;g.add(slab(a,b,n,w,t,COLORS.strip));
    }else if(it.band){
      const {points,n,w,t}=it.band;
      for(let i=1;i<points.length;i++)g.add(slab(points[i-1],points[i],n,w,t,COLORS.coro));
      for(const p of points){const c=new THREE.Mesh(new THREE.CylinderGeometry(w/2,w/2,t,24),material(COLORS.coro));c.position.set(...p);c.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),V(n).normalize());g.add(c);}
    }else if(it.pixels){
      const m=new THREE.InstancedMesh(bulb,material(it.color,{emissive:it.color,emissiveIntensity:1.6}),it.pixels.length),o=new THREE.Object3D();
      it.pixels.forEach((p,i)=>{o.position.set(...p);o.updateMatrix();m.setMatrixAt(i,o.matrix);});g.add(m);
    }
  }
  g.rotation.x=-Math.PI/2;
  return g;
}
function lights(s){
  s.add(new THREE.HemisphereLight(0xdfe9ff,0x1a1410,1.6));
  const key=new THREE.DirectionalLight(0xffffff,2.2);key.position.set(200,400,260);s.add(key);
  const rim=new THREE.DirectionalLight(0xefc197,1.2);rim.position.set(-300,160,-260);s.add(rim);
}
// Frame an object from the front, a little above and to the side.
// The paving and the bush are left out of the framing, so the prop fills the view.
function frameView(obj,cam,ctl,dir=new THREE.Vector3(.9,.55,-1.25)){
  obj.updateMatrixWorld(true);
  const box=new THREE.Box3();obj.traverse(o=>{if(o.isMesh&&!o.userData.ground)box.expandByObject(o);});
  if(box.isEmpty())box.setFromObject(obj);
  const c=box.getCenter(new THREE.Vector3()),r=box.getBoundingSphere(new THREE.Sphere()).radius;
  const dist=r/Math.sin(THREE.MathUtils.degToRad(cam.fov/2))*1.22;c.y-=r*.05;
  cam.position.copy(c).add(dir.normalize().multiplyScalar(dist));cam.near=dist/100;cam.far=dist*20;cam.lookAt(c);cam.updateProjectionMatrix();
  if(ctl){ctl.target.copy(c);ctl.minDistance=r*.4;ctl.maxDistance=dist*3;ctl.update();}
}
let token=0;
async function show(){
  const t=++token,obj=props.mode==='prop'?await assembly(props.prop):placeOnBed(await load(props.part));
  if(t!==token)return;
  if(content)scene.remove(content);
  content=obj;scene.add(content);bed.visible=props.mode==='part';
  frameView(props.mode==='part'?bed:content,camera,controls,props.mode==='part'?new THREE.Vector3(.7,.8,1):undefined);
}
// Card previews: every finished prop and every part alone.
async function thumbs(){
  // Load everything first, so the renders below run back to back without a frame in between.
  await Promise.all([...props.parts,'tree-ring','tree-ring-weight'].map(load));
  const s=new THREE.Scene();lights(s);
  const cam=new THREE.PerspectiveCamera(30,4/3,1,5000),out={},size=new THREE.Vector2();renderer.getSize(size);
  renderer.setSize(480,360,false);
  const shot=(obj,key,dir)=>{s.add(obj);frameView(obj,cam,null,dir);renderer.setClearColor(0x000000,0);renderer.render(s,cam);out[key]=renderer.domElement.toDataURL('image/png');s.remove(obj);};
  for(const id of Object.keys(ASSEMBLIES))shot(await assembly(id),`prop:${id}`);
  for(const id of props.parts)shot(placeOnBed(await load(id)),id,new THREE.Vector3(1,.8,1.2));
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
  scene=new THREE.Scene();lights(scene);bed=bedGroup();scene.add(bed);
  camera=new THREE.PerspectiveCamera(34,1,1,20000);
  controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.maxPolarAngle=Math.PI*.495;
  resize();observer=new ResizeObserver(resize);observer.observe(host.value);
  await show();
  const loop=()=>{frame=requestAnimationFrame(loop);controls.update();renderer.setClearColor(0x000000,0);renderer.render(scene,camera);};loop();
  thumbs();
});
watch(()=>[props.mode,props.prop,props.part],()=>{if(scene)show();});
onBeforeUnmount(()=>{cancelAnimationFrame(frame);observer?.disconnect();controls?.dispose();renderer?.dispose();});
</script>

<template>
  <div ref="host" class="part-viewer" />
</template>

<style scoped>
.part-viewer{position:absolute;inset:0}
.part-viewer :deep(canvas){width:100%;height:100%;display:block;touch-action:none}
</style>
