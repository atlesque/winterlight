import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { HOUSE, PROP_LAYOUT } from './house.js';
import { OWN_CHANNELS } from './props.js';
import { HOUSE_STRIPS } from './original/layout.js';
import { WIRING, WIRE_COLORS } from './wiring/plan.js';

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
  const hemi=new THREE.HemisphereLight('#8ea6d6','#2a2422',.12);scene.add(hemi);
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
  // The garage is a hollow shell behind its door, so the door can open onto the show's boxes inside.
  {const W=HOUSE.garageWidth,H=HOUSE.garageHeight,D=HOUSE.garageDepth,T=.12,g=HOUSE.garage,left=g.x-g.width/2,right=g.x+g.width/2;
    box(T,H,D,T/2,H/2,-D/2,brick);box(T,H,D,W-T/2,H/2,-D/2,brick);box(W,H,T,W/2,H/2,-D+T/2,brick);box(W,T,D,W/2,H-T/2,-D/2,brick);
    box(left,H,T,left/2,H/2,-T/2,brick);box(W-right,H,T,(W+right)/2,H/2,-T/2,brick);box(g.width,H-g.height,T,g.x,(H+g.height)/2,-T/2,brick);
    box(W-2*T,.02,D-2*T,W/2,.012,-D/2,new THREE.MeshStandardMaterial({color:'#6d6a64',roughness:.95}));}
  roof(0,HOUSE.garageWidth,HOUSE.garageDepth,HOUSE.garageHeight,4.25);
  for(const [x,w,h,d] of [[HOUSE.garageWidth+mainWidth/2,mainWidth,HOUSE.eaves,HOUSE.depth],[HOUSE.garageWidth/2,HOUSE.garageWidth,HOUSE.garageHeight,HOUSE.garageDepth]]){
    box(w+.12,.16,d+.14,x,h,-d/2,mats.trim);
  }
  const garage=HOUSE.garage;
  // An up-and-over door: it swings up about its top edge to lie under the garage ceiling.
  const garageDoor=new THREE.Group();garageDoor.position.set(garage.x,garage.height,.01);scene.add(garageDoor);
  const doorPanel=(w,h,d,y,z,mat)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);m.position.set(0,y-garage.height,z);m.castShadow=true;m.receiveShadow=true;garageDoor.add(m);};
  doorPanel(garage.width,garage.height,.09,garage.height/2,0,mats.dark);
  for(let j=0;j<12;j++)doorPanel(garage.width-.06,.018,.025,.12+j*.18,.061,mats.metal);
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
  // The wiring layer, hidden until switched on: each controller port's data
  // cable in its own colour from the garage, and the power injection points
  // with their feeds (src/wiring/plan.js).
  const wiring=new THREE.Group();wiring.visible=false;scene.add(wiring);
  const wireMat=color=>new THREE.MeshBasicMaterial({color:new THREE.Color(color).multiplyScalar(.38)});
  function wire(points,r,mat){const curve=new THREE.CurvePath(),v=points.map(p=>new THREE.Vector3(...p));for(let i=1;i<v.length;i++)curve.add(new THREE.LineCurve3(v[i-1],v[i]));wiring.add(new THREE.Mesh(new THREE.TubeGeometry(curve,(v.length-1)*4,r,5,false),mat));}
  function tag(text,pos,color='#f6efe2'){
    const canvas=document.createElement('canvas'),c=canvas.getContext('2d'),font='600 30px system-ui, sans-serif';c.font=font;
    canvas.width=Math.ceil(c.measureText(text).width)+28;canvas.height=46;c.font=font;c.fillStyle='rgba(8,14,26,.82)';c.beginPath();c.roundRect(0,0,canvas.width,canvas.height,12);c.fill();
    c.fillStyle=color;c.textBaseline='middle';c.fillText(text,14,24);
    const tex=new THREE.CanvasTexture(canvas);tex.colorSpace=THREE.SRGBColorSpace;
    const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:tex,color:'#a3a3a3',depthTest:false}));sprite.renderOrder=10;
    sprite.scale.set(canvas.width/canvas.height*.3,.3,1);sprite.position.set(...pos);wiring.add(sprite);
  }
  const powerMat=wireMat(WIRE_COLORS.power),node=new THREE.SphereGeometry(.045,10,8),injectMat=new THREE.MeshBasicMaterial({color:WIRE_COLORS.power});
  for(const z of WIRING.zones){
    for(const port of z.ports){const mat=wireMat(port.color);for(const seg of port.segments)wire(seg,.01,mat);}
    for(const port of z.ports)for(const inj of port.injections){wire(inj.path,.008,powerMat);const m=new THREE.Mesh(node,injectMat);m.position.set(...inj.pos);wiring.add(m);}
  }
  // Inside the garage: a wall board on the left wall with the facade controller
  // and its power supplies, the show computer on a shelf, and every cable going
  // up, across the ceiling and out through the right jamb. The garden box stands
  // outdoors behind the front-left bush, fed by a mains and a network cable from
  // the garage (src/wiring/plan.js).
  // Cables run along the inside of the front wall, just under the door's header, so they show through the opening.
  const IN_X=.12,CEIL=HOUSE.garage.height-.12,FRONT=-.2,[ex,ey,ez]=WIRING.hub.exit;
  const ply=new THREE.MeshStandardMaterial({color:'#8a6b4a',roughness:.9}),ctrlMat=new THREE.MeshStandardMaterial({color:'#24303f',roughness:.5}),psuMat=new THREE.MeshStandardMaterial({color:'#9aa3ad',metalness:.5,roughness:.4});
  const part=(w,h,d,x,y,z,mat)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);m.position.set(x,y,z);wiring.add(m);return m;};
  part(.02,1.1,1.6,IN_X+.01,1.4,-1.25,ply);
  WIRING.zones.filter(z=>!z.outdoor).forEach((z,k)=>{
    const zc=-.85-k*.75,cx=IN_X+.05;
    part(.07,.3,.22,cx,1.55,zc,ctrlMat);
    z.psus.forEach((s,n)=>part(.05,.21,.11,IN_X+.045,1.05,zc-.17+n*.34,psuMat));
    z.ports.forEach((port,i)=>{const start=port.segments[0][0],y=1.6+(i-z.ports.length/2)*.035,o=(k*6+i)*.018;
      wire([[cx+.035,y,zc],[cx+.08+o,y,zc],[cx+.08+o,CEIL-o*.3,zc],[cx+.08+o,CEIL-o*.3,FRONT-o*.3],[ex-.06,CEIL-o*.3,FRONT-o*.3],[ex-.06,start[1],FRONT-o*.3],[ex-.06,start[1],start[2]],start],.009,wireMat(port.color));});
    for(const port of z.ports)for(const inj of port.injections){const start=inj.path[0];
      wire([[IN_X+.07,1.05,zc],[IN_X+.3,1.05,zc],[IN_X+.3,CEIL-.12,zc],[IN_X+.3,CEIL-.12,FRONT-.3],[ex-.1,CEIL-.12,FRONT-.3],[ex-.1,start[1],FRONT-.3],[ex-.1,start[1],start[2]],start],.007,powerMat);}
  });
  part(.3,.02,.4,IN_X+.15,.95,-2.35,ply);part(.1,.03,.07,IN_X+.1,.975,-2.3,ctrlMat);part(.08,.03,.16,IN_X+.2,.975,-2.45,ctrlMat);
  tag('Facade controller, power supplies, show computer',[IN_X+.55,.6,-1.3]);
  const boxMat=new THREE.MeshStandardMaterial({color:'#c9ced4',roughness:.55}),brickMat=new THREE.MeshStandardMaterial({color:'#7c8288',roughness:.9});
  for(const z of WIRING.zones.filter(z=>z.outdoor)){
    const [bx,by,bz]=z.box;
    for(const dz of [-.08,.08])part(.22,.08,.11,bx,.04,bz+dz,brickMat);
    part(.17,.3,.4,bx,.08+.15,bz,boxMat);
    tag('Garden box',[bx,.6,bz]);
    // Its feed from the garage: mains and network, out through the jamb and over the front door.
    const outMains=wireMat(WIRE_COLORS.mains),outNet=wireMat(WIRE_COLORS.network);
    wire(z.feed.mains,.009,outMains);wire(z.feed.network,.008,outNet);
    const s=z.feed.mains[0];
    wire([[IN_X+.4,1.2,-1.3],[IN_X+.4,CEIL-.2,-1.3],[IN_X+.4,CEIL-.2,FRONT-.4],[ex-.14,CEIL-.2,FRONT-.4],[ex-.14,s[1],FRONT-.4],[ex-.14,s[1],s[2]],s],.009,outMains);
    const n=z.feed.network[0];
    wire([[IN_X+.2,.98,-2.3],[IN_X+.45,.98,-2.3],[IN_X+.45,CEIL-.24,-2.3],[IN_X+.45,CEIL-.24,FRONT-.45],[ex-.18,CEIL-.24,FRONT-.45],[ex-.18,n[1],FRONT-.45],[ex-.18,n[1],n[2]],n],.008,outNet);
  }
  const gland=part(.08,.08,.04,ex,ey,ez,new THREE.MeshStandardMaterial({color:'#3a4350',roughness:.6}));
  // A work light in the garage, on with the wiring so the boards read through the open door.
  const garageLight=new THREE.PointLight('#ffd9a8',0,9,1.2);garageLight.position.set(1.1,1.9,-1.3);scene.add(garageLight);
  const bulbs=[],channelBulbs=OWN_CHANNELS.map(()=>[]);
  OWN_CHANNELS.forEach((c,i)=>{for(const b of c.bulbs){channelBulbs[i].push(bulbs.length);bulbs.push({...b,color:new THREE.Color(b.color)});}});
  const lights=new THREE.InstancedMesh(new THREE.SphereGeometry(.029,8,6),new THREE.MeshBasicMaterial({toneMapped:false}),bulbs.length),m4=new THREE.Matrix4(),tmp=new THREE.Color();
  // Bulbs, bloom and drive match the original house's scene (its bulbs seen from
  // its own camera), so every prop is as bright here as there; the house strips
  // get the same 1.3x bulbs as the original's dense strips.
  const STRIP_BULB=1.3;
  OWN_CHANNELS.forEach((c,i)=>{if(HOUSE_STRIPS.has(c.id))for(const k of channelBulbs[i])bulbs[k].strip=true;});
  bulbs.forEach((b,i)=>{const s=b.size*(b.strip?STRIP_BULB:1);m4.makeScale(s,s,s).setPosition(...b.pos);lights.setMatrixAt(i,m4);lights.setColorAt(i,tmp.copy(b.color).multiplyScalar(OFF));});
  lights.instanceMatrix.needsUpdate=true;scene.add(lights);
  const composer=new EffectComposer(renderer);composer.addPass(new RenderPass(scene,camera));composer.addPass(new UnrealBloomPass(new THREE.Vector2(800,600),.95,.5,.1));composer.addPass(new OutputPass());
  const bounce=new THREE.PointLight('#ffd9a0',0,9,2);bounce.position.set(6.5,1.5,2.6);scene.add(bounce);
  let aspectFit=1;
  const resize=()=>{const w=host.clientWidth,h=host.clientHeight;if(!w||!h)return;camera.aspect=w/h;const fit=Math.max(1,1.4/camera.aspect);camera.position.sub(controls.target).multiplyScalar(fit/aspectFit).add(controls.target);aspectFit=fit;controls.maxDistance=Math.max(35,35*fit);camera.updateProjectionMatrix();renderer.setSize(w,h);composer.setSize(w,h);};new ResizeObserver(resize).observe(host);resize();
  const views={video:[[4.25,4.5,14],[4.25,3,0]],orbit:[[12,7,13],[4.25,2.8,-1.5]],yard:[[9.5,1.6,7.5],[6.3,1.3,1.5]],overlay:[[4.25,4.5,14],[4.25,3,0]],garage:[[2.1,1.45,4.4],[.5,1.3,-1.3]]};
  const last=new Uint8Array(OWN_CHANNELS.length).fill(255),lastLevel=new Uint8Array(OWN_CHANNELS.length);
  let glowSum=0,doorOpen=0;const channelGlow=new Float32Array(OWN_CHANNELS.length);
  // values: colour per channel (0 off, multicolour 1 yellow / 2 blue / 3 both); levels: brightness 0–100.
  function draw(values,levels,brightness=1){
    let dirty=false;
    OWN_CHANNELS.forEach((c,i)=>{const v=values[i],l=v?levels[i]:0;if(v===last[i]&&l===lastLevel[i])return;last[i]=v;lastLevel[i]=l;dirty=true;
      const on=OFF+(brightness*2.2-OFF)*l/100;let sum=0;
      for(const k of channelBulbs[i]){const b=bulbs[k],lit=v&&(!b.tone||(v&b.tone));lights.setColorAt(k,tmp.copy(b.color).multiplyScalar(lit?on:OFF));if(lit)sum+=brightness*l/100;}
      glowSum+=sum-channelGlow[i];channelGlow[i]=sum;});
    if(dirty){lights.instanceColor.needsUpdate=true;bounce.intensity=glowSum/bulbs.length*2;}
    const open=wiring.visible?1:0;doorOpen+=(open-doorOpen)*.12;if(Math.abs(open-doorOpen)<.002)doorOpen=open;
    garageDoor.rotation.x=doorOpen*Math.PI/2*.98;garageLight.intensity=doorOpen*5;
    controls.update();composer.render();
  }
  // The measuring layer (the measure page): a dimension line per tape
  // measurement with end ticks, amber while still to measure and green once
  // measured; the selected one is thicker and drawn over everything. The page
  // puts its own labels on the lines with project().
  const measureGroup=new THREE.Group();scene.add(measureGroup);
  function setMeasures(list){
    for(const o of [...measureGroup.children]){measureGroup.remove(o);o.geometry?.dispose();o.material?.dispose();}
    for(const m of list){
      const color=new THREE.Color(m.done?'#5fe39a':'#ffb347').multiplyScalar(m.active?.9:.45),mat=new THREE.MeshBasicMaterial({color,toneMapped:false,depthTest:!m.active});
      const a=new THREE.Vector3(...m.from),b=new THREE.Vector3(...m.to),dir=b.clone().sub(a),len=dir.length(),r=m.active?.013:.008;
      const bar=new THREE.Mesh(new THREE.CylinderGeometry(r,r,len,8),mat);bar.position.copy(a).add(b).multiplyScalar(.5);bar.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),dir.clone().normalize());bar.renderOrder=m.active?15:5;measureGroup.add(bar);
      // End ticks across the line, in the facade's plane or flat on the ground.
      const side=Math.abs(dir.y)>.5?new THREE.Vector3(1,0,0):new THREE.Vector3(0,1,0).cross(dir).normalize();
      for(const end of [a,b]){const t=new THREE.Mesh(new THREE.CylinderGeometry(r,r,.16,6),mat);t.position.copy(end);t.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),side);t.renderOrder=bar.renderOrder;measureGroup.add(t);}
    }
  }
  // Where a point of the model lands on the canvas, in CSS pixels, and whether it is in front of the camera.
  const projected=new THREE.Vector3();
  function project(p){projected.set(...p).project(camera);const r=renderer.domElement;return {x:(projected.x+1)/2*r.clientWidth,y:(1-projected.y)/2*r.clientHeight,visible:projected.z<1&&Math.abs(projected.x)<1.05&&Math.abs(projected.y)<1.05};}
  // Light the house as at dusk, so the walls and openings read while measuring.
  function setDusk(on){hemi.intensity=on?.85:.12;moon.intensity=on?1.1:.22;fog.density=on?.006:.018;background.set(on?'#141d2b':'#070b12');fog.color.copy(background);}
  function look(pos,target){camera.position.set(...pos);controls.target.set(...target);camera.position.sub(controls.target).multiplyScalar(aspectFit).add(controls.target);controls.update();}
  return {draw,bulbCount:bulbs.length,
    setMeasures,project,setDusk,look,
    setBrightness(){last.fill(255);},
    setWiring(on){wiring.visible=on;},
    view(name){const overlay=name==='overlay';for(const o of houseParts)o.visible=!overlay;scene.background=overlay?BLACK:background;scene.fog=overlay?null:fog;camera.position.set(...views[name][0]);controls.target.set(...views[name][1]);camera.position.sub(controls.target).multiplyScalar(aspectFit).add(controls.target);controls.update();},
    snapshot(){return renderer.domElement.toDataURL('image/png');}};
}
