import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { HOUSE, PROP_LAYOUT } from './house.js';
import { OWN_CHANNELS } from './props.js';
import { HOUSE_STRIPS, STRIP_POWER } from './original/layout.js';

// Our house with the original house's props. Bulbs are one instanced mesh; each
// channel owns a range of bulbs with their base colours, and draw() takes the
// same per-channel colour states and levels as the original house's scene.
const OFF=.07;
export function createScene(host) {
  const scene=new THREE.Scene();scene.background=new THREE.Color('#070b12');scene.fog=new THREE.FogExp2('#070b12',.018);
  const renderer=new THREE.WebGLRenderer({antialias:true, powerPreference:'high-performance'});renderer.setPixelRatio(Math.min(devicePixelRatio,1.7));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=.8;host.appendChild(renderer.domElement);
  const camera=new THREE.PerspectiveCamera(43,1,.1,100);camera.position.set(14,9,20);
  const controls=new OrbitControls(camera,renderer.domElement);controls.target.set(4.25,2.8,-1.5);controls.enableDamping=true;controls.minDistance=5;controls.maxDistance=35;controls.maxPolarAngle=Math.PI/2-.035;controls.update();
  // A dark night: the moon and sky only sketch the house in, so the lights carry the scene.
  scene.add(new THREE.HemisphereLight('#8ea6d6','#2a2422',.12));
  const moon=new THREE.DirectionalLight('#a6bff2',.22);moon.position.set(-8,15,7);moon.castShadow=true;moon.shadow.mapSize.set(2048,2048);moon.shadow.camera.left=-16;moon.shadow.camera.right=16;moon.shadow.camera.top=12;moon.shadow.camera.bottom=-12;scene.add(moon);
  const mats={snow:new THREE.MeshStandardMaterial({color:'#8a949e',roughness:.85}),dark:new THREE.MeshStandardMaterial({color:'#22252b',roughness:.62}),metal:new THREE.MeshStandardMaterial({color:'#5b626e',metalness:.3,roughness:.65}),trim:new THREE.MeshStandardMaterial({color:'#bac5ca',roughness:.7}),path:new THREE.MeshStandardMaterial({color:'#505b62',roughness:.7}),soil:new THREE.MeshStandardMaterial({color:'#4b514d',roughness:1}),frame:new THREE.MeshStandardMaterial({color:'#1b222a',roughness:.8})};
  function brickTexture(){const canvas=document.createElement('canvas');canvas.width=512;canvas.height=512;const c=canvas.getContext('2d');c.fillStyle='#765a50';c.fillRect(0,0,512,512);for(let row=0;row<16;row++)for(let col=-1;col<8;col++){let seed=(row*71+col*33+123)&255;c.fillStyle=`rgb(${112+seed%24},${61+seed%17},${42+seed%15})`;c.fillRect(col*80+(row%2?40:0)+2,row*32+2,76,28);}const tex=new THREE.CanvasTexture(canvas);tex.colorSpace=THREE.SRGBColorSpace;tex.wrapS=tex.wrapT=THREE.RepeatWrapping;tex.repeat.set(3,1.4);tex.anisotropy=renderer.capabilities.getMaxAnisotropy();return tex;}
  const brick=new THREE.MeshStandardMaterial({map:brickTexture(),roughness:.92});
  function box(w,h,d,x,y,z,mat){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;scene.add(m);return m;}
  function cylinder(r,h,x,y,z,mat){const m=new THREE.Mesh(new THREE.CylinderGeometry(r,r,h,12),mat);m.position.set(x,y,z);m.castShadow=true;scene.add(m);return m;}
  // Frames are polylines: straight runs between their points, so letter and star corners stay sharp.
  function tube(points,r=.018,mat=mats.frame){const curve=new THREE.CurvePath(),v=points.map(p=>new THREE.Vector3(...p));for(let i=1;i<v.length;i++)curve.add(new THREE.LineCurve3(v[i-1],v[i]));const mesh=new THREE.Mesh(new THREE.TubeGeometry(curve,Math.max(12,(v.length-1)*6),r,6,false),mat);scene.add(mesh);return mesh;}
  box(60,.15,50,0,-.13,5,mats.snow);
  const roofMat=new THREE.MeshStandardMaterial({color:'#55535a',roughness:.94});
  function roof(x,width,depth,eaves,ridge){
    const cross=new THREE.Shape();cross.moveTo(0,eaves);cross.lineTo(-depth/2,ridge);cross.lineTo(-depth,eaves);cross.closePath();
    const mesh=new THREE.Mesh(new THREE.ExtrudeGeometry(cross,{depth:width,bevelEnabled:false}),roofMat);
    // Shape coordinates become world z/y; extrusion runs across the frontage.
    mesh.rotation.y=-Math.PI/2;mesh.position.x=x+width;mesh.castShadow=true;mesh.receiveShadow=true;scene.add(mesh);
  }
  const mainWidth=HOUSE.width-HOUSE.garageWidth;
  box(mainWidth,HOUSE.eaves,HOUSE.depth,HOUSE.garageWidth+mainWidth/2,HOUSE.eaves/2,-HOUSE.depth/2,brick);
  roof(HOUSE.garageWidth,mainWidth,HOUSE.depth,HOUSE.eaves,HOUSE.ridge);
  box(HOUSE.garageWidth,HOUSE.garageHeight,HOUSE.garageDepth,HOUSE.garageWidth/2,HOUSE.garageHeight/2,-HOUSE.garageDepth/2,brick);
  roof(0,HOUSE.garageWidth,HOUSE.garageDepth,HOUSE.garageHeight,4.25);
  for(const [x,w,h,d] of [[HOUSE.garageWidth+mainWidth/2,mainWidth,HOUSE.eaves,HOUSE.depth],[HOUSE.garageWidth/2,HOUSE.garageWidth,HOUSE.garageHeight,HOUSE.garageDepth]]){
    box(w+.12,.16,d+.14,x,h,-d/2,mats.trim);
  }
  const garage=HOUSE.garage;
  box(garage.width,garage.height,.09,garage.x,garage.height/2,.01,mats.dark);
  for(let j=0;j<12;j++)box(garage.width-.06,.018,.025,garage.x,.12+j*.18,.071,mats.metal);
  const glass=new THREE.MeshStandardMaterial({color:'#4c4032',emissive:'#e6aa58',emissiveIntensity:.1,roughness:.4,metalness:.15});
  function window(x,y,w,h){box(w+.17,h+.17,.15,x,y,.025,mats.dark);box(w,h,.07,x,y,.12,glass);if(w>.5)box(.05,h,.08,x,y,.175,mats.dark);box(w+.25,.08,.26,x,y-h/2-.07,.12,mats.trim);}
  for(const opening of HOUSE.windows)window(opening.x,opening.y,opening.width,opening.height);
  const door=HOUSE.door;
  box(door.width+.16,door.height+.12,.12,door.x,door.height/2,.04,mats.trim);
  box(door.width,door.height,.14,door.x,door.height/2,.14,mats.dark);
  for(const y of [.55,1.6])box(door.width-.25,.8,.025,door.x,y,.223,glass);
  box(.025,.18,.04,door.x+.4,1.1,.23,mats.metal);
  // One level forecourt across the full frontage; access zones only guide prop placement.
  box(HOUSE.width,.035,HOUSE.forecourtDepth,HOUSE.width/2,.005,HOUSE.forecourtDepth/2,mats.path);
  // Planting tiles: dark mulch flush with the paving under a full, cube-clipped variegated shrub.
  const mulch=new THREE.MeshStandardMaterial({color:'#2e2620',roughness:1});
  const leafColors=['#4f6b3e','#5d7a4a','#7f9666','#d3d6b4'].map(c=>new THREE.Color(c));
  const leafMat=new THREE.MeshStandardMaterial({roughness:.85,flatShading:true});
  const leafGeo=new THREE.IcosahedronGeometry(1,0), leaf=new THREE.Object3D();
  const leaves=[];
  HOUSE.planters.tiles.forEach((tile,t)=>{
    const {size,bush}=HOUSE.planters,half=bush/2;
    box(size,.024,size,tile.x,.025,tile.z,mulch);
    box(bush*.9,bush*.92,bush*.9,tile.x,.037+bush*.46,tile.z,new THREE.MeshStandardMaterial({color:'#3c5530',roughness:.95}));
    let seed=t*977+31;const rand=()=>((seed=(seed*16807)%2147483647)/2147483647);
    // Leaf clusters cover the top and four sides on a jittered grid, so the outline reads as a clipped block.
    const steps=7;
    for(let i=0;i<=steps;i++)for(let j=0;j<=steps;j++){
      const u=-half+bush*i/steps,v=bush*j/steps;
      const faces=[[u,.037+v,half],[u,.037+v,-half],[half,.037+v,u],[-half,.037+v,u]];
      if(j<steps)for(const f of faces)leaves.push([tile.x+f[0],f[1],tile.z+f[2],rand]);
      leaves.push([tile.x+u,.037+bush,tile.z-half+bush*j/steps,rand]);
    }
  });
  const mesh=new THREE.InstancedMesh(leafGeo,leafMat,leaves.length);mesh.castShadow=true;mesh.receiveShadow=true;
  leaves.forEach((p,i)=>{const rand=p[3],j=()=>(rand()-.5)*.05;leaf.position.set(p[0]+j(),p[1]+j(),p[2]+j());leaf.rotation.set(rand()*3,rand()*3,rand()*3);leaf.scale.setScalar(.055+.03*rand());leaf.updateMatrix();mesh.setMatrixAt(i,leaf.matrix);mesh.setColorAt(i,leafColors[Math.floor(rand()*leafColors.length)]);});
  scene.add(mesh);
  const mailbox=HOUSE.mailbox;
  const concrete=new THREE.MeshStandardMaterial({color:'#97968e',roughness:1});
  box(mailbox.width,mailbox.height,mailbox.depth,mailbox.x,mailbox.height/2+.023,mailbox.z,concrete);
  box(mailbox.width+.04,.045,mailbox.depth+.02,mailbox.x,mailbox.height+.025,mailbox.z,concrete);
  // Street-facing letter slot and small metal surround.
  const mailboxFront=mailbox.z+mailbox.depth/2;
  box(.39,.085,.014,mailbox.x,.84,mailboxFront+.008,mats.metal);
  box(.34,.035,.018,mailbox.x,.845,mailboxFront+.018,mats.dark);
  // Everything so far is the house; overlay mode hides it so only the lights sit over the video.
  const houseParts=[...scene.children],background=scene.background,fog=scene.fog,BLACK=new THREE.Color('#000');
  // Wire frames behind each channel's bulbs, posts under the ground strip and a base under the tree.
  const frameMats={frame:mats.frame,leaf:new THREE.MeshStandardMaterial({color:'#1f3a26',roughness:.8}),cane:new THREE.MeshStandardMaterial({color:'#d9d4cc',roughness:.6})};
  for(const c of OWN_CHANNELS){
    const mat=c.kind==='wreath'?frameMats.leaf:c.cane?frameMats.cane:mats.frame,r=c.cane?.014:c.kind==='strip'?.01:.007;
    for(const points of c.frames)tube(points,r,mat);
    for(const [x,y,z] of c.posts||[])cylinder(.012,y,x,y/2,z,mats.frame);
  }
  const tree=PROP_LAYOUT.tree;cylinder(.02,tree.height,tree.x,tree.height/2,tree.z,mats.frame);cylinder(.12,.06,tree.x,.03,tree.z,mats.frame);
  const bulbs=[],channelBulbs=OWN_CHANNELS.map(()=>[]);
  OWN_CHANNELS.forEach((c,i)=>{for(const b of c.bulbs){channelBulbs[i].push(bulbs.length);bulbs.push({...b,color:new THREE.Color(b.color)});}});
  const lights=new THREE.InstancedMesh(new THREE.SphereGeometry(.016,8,6),new THREE.MeshBasicMaterial({toneMapped:false}),bulbs.length),m4=new THREE.Matrix4(),tmp=new THREE.Color();
  // The house strips get bigger bulbs and a wider glow, as bright as the original's.
  const STRIP_BULB=1.5,STRIP_GLOW=1.5;
  OWN_CHANNELS.forEach((c,i)=>{if(HOUSE_STRIPS.has(c.id))for(const k of channelBulbs[i])bulbs[k].strip=true;});
  bulbs.forEach((b,i)=>{const s=b.size*(b.strip?STRIP_BULB:1);m4.makeScale(s,s,s).setPosition(...b.pos);lights.setMatrixAt(i,m4);lights.setColorAt(i,tmp.copy(b.color).multiplyScalar(OFF));});
  lights.instanceMatrix.needsUpdate=true;scene.add(lights);
  // Soft additive glow around each lit bulb, following its colour.
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(bulbs.flatMap(b=>b.pos),3));const glowColors=new Float32Array(bulbs.length*3);geometry.setAttribute('color',new THREE.BufferAttribute(glowColors,3));geometry.setAttribute('scale',new THREE.Float32BufferAttribute(bulbs.map(b=>b.strip?STRIP_GLOW:1),1));
  const glowMat=new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,vertexColors:true,uniforms:{ratio:{value:renderer.getPixelRatio()}},vertexShader:'attribute float scale; varying vec3 vColor; uniform float ratio; void main(){vColor=color;vec4 mv=modelViewMatrix*vec4(position,1.0);gl_PointSize=min(40.0*scale,220.0*scale*ratio/-mv.z);gl_Position=projectionMatrix*mv;}',fragmentShader:'varying vec3 vColor; void main(){float r=length(gl_PointCoord-.5)*2.0;if(r>1.0)discard;float a=exp(-r*r*7.0)*.5;gl_FragColor=vec4(vColor,a);}'});
  scene.add(new THREE.Points(geometry,glowMat));
  const composer=new EffectComposer(renderer);composer.addPass(new RenderPass(scene,camera));composer.addPass(new UnrealBloomPass(new THREE.Vector2(800,600),.35,.45,.82));composer.addPass(new OutputPass());
  const bounce=new THREE.PointLight('#ffd9a0',0,9,2);bounce.position.set(6.5,1.5,2.6);scene.add(bounce);
  let aspectFit=1;
  const resize=()=>{const w=host.clientWidth,h=host.clientHeight;if(!w||!h)return;camera.aspect=w/h;const fit=Math.max(1,1.4/camera.aspect);camera.position.sub(controls.target).multiplyScalar(fit/aspectFit).add(controls.target);aspectFit=fit;controls.maxDistance=Math.max(35,35*fit);camera.updateProjectionMatrix();renderer.setSize(w,h);composer.setSize(w,h);};new ResizeObserver(resize).observe(host);resize();
  const views={video:[[4.25,4.5,14],[4.25,3,0]],orbit:[[12,7,13],[4.25,2.8,-1.5]],yard:[[9.5,1.6,7.5],[6.3,1.3,1.5]],overlay:[[4.25,4.5,14],[4.25,3,0]]};
  const last=new Uint8Array(OWN_CHANNELS.length).fill(255),lastLevel=new Uint8Array(OWN_CHANNELS.length);
  let glowSum=0;const channelGlow=new Float32Array(OWN_CHANNELS.length);
  // values: colour per channel (0 off, multicolour 1 yellow / 2 blue / 3 both); levels: brightness 0–100.
  function draw(values,levels,brightness=1){
    let dirty=false;
    OWN_CHANNELS.forEach((c,i)=>{const v=values[i],l=v?levels[i]:0;if(v===last[i]&&l===lastLevel[i])return;last[i]=v;lastLevel[i]=l;dirty=true;
      const power=HOUSE_STRIPS.has(c.id)?STRIP_POWER:1,on=OFF+(brightness*2.2*power-OFF)*l/100;let sum=0;
      for(const k of channelBulbs[i]){const b=bulbs[k],lit=v&&(!b.tone||(v&b.tone));lights.setColorAt(k,tmp.copy(b.color).multiplyScalar(lit?on:OFF));const g=lit?brightness*power*l/100:0;glowColors[k*3]=b.color.r*g;glowColors[k*3+1]=b.color.g*g;glowColors[k*3+2]=b.color.b*g;sum+=g;}
      glowSum+=sum-channelGlow[i];channelGlow[i]=sum;});
    if(dirty){lights.instanceColor.needsUpdate=true;geometry.attributes.color.needsUpdate=true;bounce.intensity=glowSum/bulbs.length*2;}
    controls.update();composer.render();
  }
  return {draw,bulbCount:bulbs.length,
    setBrightness(){last.fill(255);},
    view(name){const overlay=name==='overlay';for(const o of houseParts)o.visible=!overlay;scene.background=overlay?BLACK:background;scene.fog=overlay?null:fog;camera.position.set(...views[name][0]);controls.target.set(...views[name][1]);camera.position.sub(controls.target).multiplyScalar(aspectFit).add(controls.target);controls.update();},
    snapshot(){return renderer.domElement.toDataURL('image/png');}};
}
