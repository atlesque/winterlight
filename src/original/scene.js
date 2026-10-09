import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {UnrealBloomPass} from 'three/addons/postprocessing/UnrealBloomPass.js';
import {OutputPass} from 'three/addons/postprocessing/OutputPass.js';
import {CHANNELS,COLORS,TREE,toMeters,PX_PER_M} from './layout.js';

// The original two-storey house from the filmed show, built from the same
// reference-still coordinates the detector samples. Facade lights sit on the
// facade plane; yard props stand in front of it at their own depth.
const OFF=.07,BULB_SPACING=.2;

export function createOriginalScene(host){
 const scene=new THREE.Scene();scene.background=new THREE.Color('#05070c');scene.fog=new THREE.FogExp2('#05070c',.012);
 const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});renderer.setPixelRatio(Math.min(devicePixelRatio,1.7));renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=.9;host.appendChild(renderer.domElement);
 const camera=new THREE.PerspectiveCamera(30,1,.1,200);
 const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.minDistance=6;controls.maxDistance=60;controls.maxPolarAngle=Math.PI/2-.03;
 scene.add(new THREE.HemisphereLight('#8a9cc0','#3a302a',.55));
 // Warm spill from the lights onto the facade, as on camera.
 for(const [x,y,z] of [[-4,3.5,3],[1,3.5,3],[5,3.5,3],[2,1,5]]){const l=new THREE.PointLight('#ffc98a',3.5,0,1.6);l.position.set(x,y,z);scene.add(l);}
 const moon=new THREE.DirectionalLight('#9fb4e0',.3);moon.position.set(-10,14,12);scene.add(moon);
 const mat=c=>new THREE.MeshStandardMaterial({color:c,roughness:.9});
 const mats={siding:mat('#8a8276'),brick:mat('#6e4a3e'),roof:mat('#2c2c31'),trim:mat('#9c978c'),dark:mat('#191a1e'),glass:new THREE.MeshStandardMaterial({color:'#20232a',emissive:'#3a2a18',emissiveIntensity:.5,roughness:.3}),snow:mat('#7d858c'),lawn:mat('#3b3a36'),street:mat('#1c1d22'),garage:mat('#4a4440')};
 const box=(w,h,d,x,y,z,m)=>{const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);mesh.position.set(x,y,z);scene.add(mesh);return mesh;};
 const rect=(x0,y0,x1,y1,z,m,d=.06)=>{const [a,b]=toMeters(x0,y0),[c,e]=toMeters(x1,y1);return box(c-a,b-e,d,(a+c)/2,(b+e)/2,z,m);};

 // Ground, street and snowy verge.
 box(80,.1,60,2,-.05,0,mats.lawn);box(80,.02,8,2,.01,13,mats.street);box(80,.03,2.2,2,.015,8,mats.snow);
 // Ground floor and upper floor, front faces at z=0 and z=-1.
 const [gx0]=toMeters(88,0),[gx1]=toMeters(905,0),[ux0]=toMeters(157,0),[ux1]=toMeters(893,0),floor=toMeters(0,267)[1];
 box(gx1-gx0,floor,10,(gx0+gx1)/2,floor/2,-5,mats.brick);
 box(ux1-ux0,5.15-floor,9,(ux0+ux1)/2,(floor+5.15)/2,-5.5,mats.siding);
 // Lean-to porch roof between the floors.
 const porch=new THREE.Mesh(new THREE.BoxGeometry(gx1-gx0+.3,.12,1.4),mats.roof);porch.position.set((gx0+gx1)/2,floor+.28,-.35);porch.rotation.x=.38;scene.add(porch);
 // Main roof along the frontage, then the two front gables from their light outlines.
 const ridge=toMeters(0,66)[1],eave=5.15;
 const roofShape=new THREE.Shape();roofShape.moveTo(-1,eave);roofShape.lineTo(-5.5,ridge);roofShape.lineTo(-10,eave);roofShape.closePath();
 const main=new THREE.Mesh(new THREE.ExtrudeGeometry(roofShape,{depth:ux1-ux0+.4,bevelEnabled:false}),mats.roof);main.rotation.y=-Math.PI/2;main.position.x=ux1+.2;scene.add(main);
 for(const pts of [[[128,150],[245,72],[385,128]],[[655,125],[790,52],[925,122]]]){
  const shape=new THREE.Shape(pts.map(p=>new THREE.Vector2(...toMeters(...p))));
  const gable=new THREE.Mesh(new THREE.ExtrudeGeometry(shape,{depth:4.6,bevelEnabled:false}),mats.siding);gable.position.z=-5.5;scene.add(gable);
  const [a,b,c]=pts.map(p=>toMeters(...p));
  for(const [p,q] of [[a,b],[b,c]]){const len=Math.hypot(q[0]-p[0],q[1]-p[1]);const slab=box(len+.3,.1,4.8,(p[0]+q[0])/2,(p[1]+q[1])/2+.06,-3.2,mats.roof);slab.rotation.z=Math.atan2(q[1]-p[1],q[0]-p[0]);}
 }
 // Openings: garage, front door, lower right window and the two upper windows.
 rect(145,320,430,450,.03,mats.garage);for(let i=1;i<4;i++)rect(145,320+i*32.5,430,321+i*32.5,.07,mats.dark,.02);
 rect(540,305,605,450,.03,mats.dark);rect(730,295,855,390,.03,mats.glass);rect(785,295,792,390,.07,mats.dark,.02);
 rect(185,150,345,225,-.97,mats.glass);rect(705,138,860,212,-.97,mats.glass);rect(180,150,200,225,-.95,mats.dark,.04);rect(330,150,350,225,-.95,mats.dark,.04);rect(840,138,865,212,-.95,mats.dark,.04);
 // Walkway to the door.
 box(1.4,.03,5,1.1,.02,2.5,mats.snow);

 // Lights. Bulbs are one instanced mesh; each channel owns a range of bulbs
 // with their base colours, so a state change only rewrites that range.
 const bulbs=[],channelBulbs=CHANNELS.map(()=>[]),glows=CHANNELS.map(()=>[]);
 const addBulb=(c,pos,color,size=1,tone=0)=>{channelBulbs[c].push(bulbs.length);bulbs.push({pos,color:new THREE.Color(color),size,tone});};
 const along=(points,step=BULB_SPACING)=>{const out=[];for(let i=0;i<points.length-1;i++){const a=points[i],b=points[i+1],len=Math.hypot(b[0]-a[0],b[1]-a[1],b[2]-a[2]),n=Math.max(1,Math.round(len/step));for(let k=0;k<n;k++){const t=k/n;out.push(a.map((v,j)=>v+(b[j]-v)*t));}}out.push(points.at(-1));return out;};
 const multi=(c,pos,i,size)=>addBulb(c,pos,i%2?COLORS.blue:COLORS.yellow,size,i%2?2:1);
 CHANNELS.forEach((ch,c)=>{
  const m=ch.model,col=COLORS[ch.palette]||COLORS.warm;
  if(ch.kind==='strip'){
   const paths=m.path3d?[m.path3d]:(m.lines||ch.roi.lines).map((line,i)=>line.map(([x,y])=>[...toMeters(x,y),m.lineZ?.[i]??.15]));
   paths.forEach((path,i)=>along(path).forEach((p,k)=>{multi(c,p,k);
    // Icicle drops under every other bulb, alternating length.
    if(m.icicles?.[i]&&k%2===0)for(let d=1;d<=(k%4?2:3);d++)multi(c,[p[0],p[1]-d*.09,p[2]+.02],k+d,.6);}));
  }else if(ch.kind==='letter'){
   const canvas=document.createElement('canvas');canvas.width=64;canvas.height=96;const g=canvas.getContext('2d');g.fillStyle='#fff';g.font='bold 86px Arial,sans-serif';g.textAlign='center';g.textBaseline='middle';g.fillText(m.char,32,52);
   const tex=new THREE.CanvasTexture(canvas);const material=new THREE.MeshBasicMaterial({map:tex,transparent:true,color:col,toneMapped:false,depthWrite:false});
   const [x,y]=toMeters(m.x,m.y),plane=new THREE.Mesh(new THREE.PlaneGeometry(m.w/PX_PER_M,m.h/PX_PER_M),material);plane.position.set(x,y,-.6);scene.add(plane);
   glows[c].push({material,color:new THREE.Color(col)});
  }else if(ch.kind==='wreath'||ch.kind==='peace'||ch.kind==='star'){
   const [cx,cy]=toMeters(ch.roi.ring[0],ch.roi.ring[1]),z=m.z??(ch.kind==='star'?TREE.depth:-.85);
   const ring=(r,n,color)=>{for(let k=0;k<n;k++){const a=2*Math.PI*k/n;addBulb(c,[cx+Math.cos(a)*r,cy+Math.sin(a)*r,z],color);}};
   if(ch.kind==='wreath'){ring(30/PX_PER_M,34,col);ring(17/PX_PER_M,22,col);const [bx,by]=toMeters(...m.bow);for(const dx of [-.08,0,.08])for(const dy of [-.06,0,.06])addBulb(c,[bx+dx,by+dy,z+.03],COLORS.red,.9);}
   else if(ch.kind==='peace'){const r=ch.roi.ring[2]/PX_PER_M;ring(r,40,col);ch.roi.lines.forEach(line=>along(line.map(([x,y])=>[...toMeters(x,y),z]),.09).forEach(p=>addBulb(c,p,col)));}
   else{const R=TREE.starRadius/PX_PER_M,top=toMeters(...TREE.apex)[1]+R*.9,pts=[];for(let k=0;k<=10;k++){const a=Math.PI/2+k*Math.PI/5,r=k%2?R*.45:R;pts.push([cx+Math.cos(a)*r,top+Math.sin(a)*r,z]);}along(pts,.08).forEach(p=>addBulb(c,p,col,1.1));}
  }else if(ch.kind==='cane'){
   const [x]=toMeters(m.x,0),h=m.height,pts=[[x,0,m.z],[x,h*.78,m.z]];for(let k=0;k<=6;k++){const a=Math.PI*k/6;pts.push([x+m.hook*(.09-Math.cos(a)*.09),h*.78+Math.sin(a)*.11,m.z]);}
   along(pts,.045).forEach(p=>addBulb(c,p,col,.8));
  }else if(ch.kind==='minitree'){
   const [x]=toMeters(m.x,0);for(let s=0;s<6;s++){const a=2*Math.PI*s/6;along([[x+Math.cos(a)*m.radius,0,m.z+Math.sin(a)*m.radius],[x,m.height,m.z]],.07).forEach(p=>addBulb(c,p,col,.75));}
  }else if(ch.kind==='treeStrip'){
   const [bx]=toMeters(TREE.base[0],0),R=TREE.halfWidth/PX_PER_M,top=toMeters(...TREE.apex)[1];
   along([[bx+Math.sin(m.theta)*R,0,TREE.depth+Math.cos(m.theta)*R],[bx,top,TREE.depth]],.11).forEach(p=>addBulb(c,p,col,.85));
  }
 });
 const sphere=new THREE.SphereGeometry(.035,8,6),material=new THREE.MeshBasicMaterial({toneMapped:false});
 const mesh=new THREE.InstancedMesh(sphere,material,bulbs.length),m4=new THREE.Matrix4(),tmp=new THREE.Color();
 bulbs.forEach((b,i)=>{m4.makeScale(b.size,b.size,b.size).setPosition(...b.pos);mesh.setMatrixAt(i,m4);mesh.setColorAt(i,tmp.copy(b.color).multiplyScalar(OFF));});
 mesh.instanceMatrix.needsUpdate=true;scene.add(mesh);
 const composer=new EffectComposer(renderer);composer.addPass(new RenderPass(scene,camera));
 const bloom=new UnrealBloomPass(new THREE.Vector2(1,1),.95,.5,.1);composer.addPass(bloom);composer.addPass(new OutputPass());

 const last=new Uint8Array(CHANNELS.length).fill(255);
 function draw(states,brightness=1){
  let dirty=false;
  CHANNELS.forEach((ch,c)=>{const v=states[c];if(v===last[c])return;last[c]=v;dirty=true;
   for(const i of channelBulbs[c]){const b=bulbs[i],lit=v&&(!b.tone||(v&b.tone));mesh.setColorAt(i,tmp.copy(b.color).multiplyScalar(lit?brightness*2.2:OFF));}
   for(const g of glows[c])g.material.color.copy(g.color).multiplyScalar(v?brightness*2:OFF*1.5);});
  if(dirty)mesh.instanceColor.needsUpdate=true;
 }
 function setBrightness(){last.fill(255);}
 const views={
  // Matches the fixed camera of the filmed show, across the street.
  video:()=>{camera.fov=Math.max(22,2*Math.atan(10.6/34/camera.aspect)*180/Math.PI);camera.position.set(2.3,3,34);controls.target.set(2.3,3.3,0);},
  orbit:()=>{camera.fov=40;camera.position.set(-12,7,18);controls.target.set(1.5,2.4,0);},
  yard:()=>{camera.fov=45;camera.position.set(4,1.6,9);controls.target.set(3,1.4,1);},
 };
 let current='video';
 function view(name){current=name;views[name]();camera.updateProjectionMatrix();controls.update();}
 function resize(){const w=host.clientWidth||1,h=host.clientHeight||1;renderer.setSize(w,h,false);composer.setSize(w,h);bloom.resolution.set(w,h);camera.aspect=w/h;if(current==='video')view('video');else camera.updateProjectionMatrix();}
 new ResizeObserver(resize).observe(host);resize();
 renderer.setAnimationLoop(()=>{controls.update();composer.render();});
 return {draw,view,setBrightness,bulbCount:bulbs.length};
}
