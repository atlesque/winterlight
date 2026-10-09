import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { BANK_COLORS } from './show.js';
import { HOUSE, PROP_LAYOUT, BANK_POSITIONS } from './house.js';

export function createScene(host,pixels,onSelect) {
  const scene=new THREE.Scene();scene.background=new THREE.Color('#131f2e');scene.fog=new THREE.FogExp2('#131f2e',.018);
  const renderer=new THREE.WebGLRenderer({antialias:true, powerPreference:'high-performance'});renderer.setPixelRatio(Math.min(devicePixelRatio,1.7));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=.85;host.appendChild(renderer.domElement);
  const camera=new THREE.PerspectiveCamera(43,1,.1,100);camera.position.set(14,9,20);
  const controls=new OrbitControls(camera,renderer.domElement);controls.target.set(4.25,2.8,-1.5);controls.enableDamping=true;controls.minDistance=5;controls.maxDistance=35;controls.maxPolarAngle=Math.PI/2-.035;controls.update();
  scene.add(new THREE.HemisphereLight('#b6cff7','#3b3230',.6));
  const moon=new THREE.DirectionalLight('#a6bff2',.65);moon.position.set(-8,15,7);moon.castShadow=true;moon.shadow.mapSize.set(2048,2048);moon.shadow.camera.left=-16;moon.shadow.camera.right=16;moon.shadow.camera.top=12;moon.shadow.camera.bottom=-12;scene.add(moon);
  const mats={snow:new THREE.MeshStandardMaterial({color:'#d7e1e8',roughness:.85}),dark:new THREE.MeshStandardMaterial({color:'#22252b',roughness:.62}),metal:new THREE.MeshStandardMaterial({color:'#5b626e',metalness:.3,roughness:.65}),trim:new THREE.MeshStandardMaterial({color:'#bac5ca',roughness:.7}),path:new THREE.MeshStandardMaterial({color:'#505b62',roughness:.7}),soil:new THREE.MeshStandardMaterial({color:'#4b514d',roughness:1}),frame:new THREE.MeshStandardMaterial({color:'#1b222a',roughness:.8})};
  function brickTexture(){const canvas=document.createElement('canvas');canvas.width=512;canvas.height=512;const c=canvas.getContext('2d');c.fillStyle='#765a50';c.fillRect(0,0,512,512);for(let row=0;row<16;row++)for(let col=-1;col<8;col++){let seed=(row*71+col*33+123)&255;c.fillStyle=`rgb(${112+seed%24},${61+seed%17},${42+seed%15})`;c.fillRect(col*80+(row%2?40:0)+2,row*32+2,76,28);}const tex=new THREE.CanvasTexture(canvas);tex.colorSpace=THREE.SRGBColorSpace;tex.wrapS=tex.wrapT=THREE.RepeatWrapping;tex.repeat.set(3,1.4);tex.anisotropy=renderer.capabilities.getMaxAnisotropy();return tex;}
  const brick=new THREE.MeshStandardMaterial({map:brickTexture(),roughness:.92});
  function box(w,h,d,x,y,z,mat){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;scene.add(m);return m;}
  function cylinder(r,h,x,y,z,mat){const m=new THREE.Mesh(new THREE.CylinderGeometry(r,r,h,12),mat);m.position.set(x,y,z);m.castShadow=true;scene.add(m);return m;}
  function tube(points,r=.018,mat=mats.frame){const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)));const mesh=new THREE.Mesh(new THREE.TubeGeometry(curve,Math.max(12,points.length*2),r,6,false),mat);scene.add(mesh);return mesh;}
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
  const glass=new THREE.MeshStandardMaterial({color:'#4c4032',emissive:'#e6aa58',emissiveIntensity:.24,roughness:.4,metalness:.15});
  function window(x,y,w,h){box(w+.17,h+.17,.15,x,y,.025,mats.dark);box(w,h,.07,x,y,.12,glass);if(w>.5)box(.05,h,.08,x,y,.175,mats.dark);box(w+.25,.08,.26,x,y-h/2-.07,.12,mats.trim);}
  for(const opening of HOUSE.windows)window(opening.x,opening.y,opening.width,opening.height);
  const door=HOUSE.door;
  box(door.width+.16,door.height+.12,.12,door.x,door.height/2,.04,mats.trim);
  box(door.width,door.height,.14,door.x,door.height/2,.14,mats.dark);
  for(const y of [.55,1.6])box(door.width-.25,.8,.025,door.x,y,.223,glass);
  box(.025,.18,.04,door.x+.4,1.1,.23,mats.metal);
  // One level forecourt across the full frontage; access zones only guide prop placement.
  box(HOUSE.width,.035,HOUSE.forecourtDepth,HOUSE.width/2,.005,HOUSE.forecourtDepth/2,mats.path);
  const mailbox=HOUSE.mailbox;
  const concrete=new THREE.MeshStandardMaterial({color:'#97968e',roughness:1});
  box(mailbox.width,mailbox.height,mailbox.depth,mailbox.x,mailbox.height/2+.023,mailbox.z,concrete);
  box(mailbox.width+.04,.045,mailbox.depth+.02,mailbox.x,mailbox.height+.025,mailbox.z,concrete);
  // Street-facing letter slot and small metal surround.
  const mailboxFront=mailbox.z+mailbox.depth/2;
  box(.39,.085,.014,mailbox.x,.84,mailboxFront+.008,mats.metal);
  box(.34,.035,.018,mailbox.x,.845,mailboxFront+.018,mats.dark);
  for(const prop of [...new Set(pixels.map(p=>p.prop))]) {
    const positions=pixels.filter(p=>p.prop===prop).map(p=>p.position);
    if(prop.id.startsWith('Arch'))tube(positions.slice(0,50));
    if(prop.id.startsWith('Star')){tube([...positions.slice(0,50),positions[0]],.012);tube([...positions.slice(50),positions[50]],.012);cylinder(.018,.62,positions[0][0],.31,PROP_LAYOUT.stars.z,mats.frame);box(.45,.07,.32,positions[0][0],.06,PROP_LAYOUT.stars.z,mats.frame);}
    if(prop.id.startsWith('Bar')){cylinder(.023,1.1,positions[0][0],.6,PROP_LAYOUT.bars.z,mats.frame);box(.26,.07,.3,positions[0][0],.06,PROP_LAYOUT.bars.z,mats.frame);}
    if(prop.id.startsWith('Matrix')){box(1.3,.57,.045,PROP_LAYOUT.matrix.x,.805,PROP_LAYOUT.matrix.z-.025,mats.frame);for(const x of [PROP_LAYOUT.matrix.x-.5,PROP_LAYOUT.matrix.x+.5])cylinder(.02,.65,x,.325,PROP_LAYOUT.matrix.z,mats.frame);}
  }
  const wires=new THREE.Group();scene.add(wires);wires.visible=false;
  const bankPositions=BANK_POSITIONS;
  const labels=[];
  function label(text,pos){const el=document.createElement('span');el.className='scene-label';el.textContent=text;host.appendChild(el);labels.push({el,pos:new THREE.Vector3(...pos)});}
  for(const [bank,pos] of Object.entries(bankPositions)){
    const cabinet=box(.28,.35,.21,...pos,mats.metal);wires.add(cabinet);
    label(`${bank} · 350px / 252W max`,[pos[0],.66,pos[2]]);
  }
  let sectionCount=0;
  for(const prop of [...new Set(pixels.map(p=>p.prop))]) {
    const pp=pixels.filter(p=>p.prop===prop), source=bankPositions[prop.bank];
    for(let i=0;i<pp.length;i+=50){const dest=pp[i].position;const path=[new THREE.Vector3(...source),new THREE.Vector3(source[0],.145,.65),new THREE.Vector3(dest[0],.145,.65),new THREE.Vector3(dest[0],.145,dest[2]),new THREE.Vector3(...dest)];
      const line=new THREE.Line(new THREE.BufferGeometry().setFromPoints(path),new THREE.LineBasicMaterial({color:BANK_COLORS[prop.bank],transparent:true,opacity:.85}));wires.add(line);
      const marker=new THREE.Mesh(new THREE.SphereGeometry(.038,8,6),new THREE.MeshBasicMaterial({color:BANK_COLORS[prop.bank]}));marker.position.copy(path.at(-1));wires.add(marker);sectionCount++;
    }
    const d=pp[0].position;
    const line=new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(source[0],.3,source[2]),new THREE.Vector3(d[0],.155,.83),new THREE.Vector3(d[0],.155,d[2]),new THREE.Vector3(...d)]),new THREE.LineDashedMaterial({color:'#e9eef5',dashSize:.065,gapSize:.045,transparent:true,opacity:.65}));line.computeLineDistances();wires.add(line);
  }
  const core=new THREE.InstancedMesh(new THREE.SphereGeometry(.013,6,4),new THREE.MeshBasicMaterial({toneMapped:false}),pixels.length);core.instanceMatrix.setUsage(THREE.StaticDrawUsage);const dummy=new THREE.Object3D();
  for(const p of pixels){dummy.position.set(...p.position);dummy.updateMatrix();core.setMatrixAt(p.index,dummy.matrix);core.setColorAt(p.index,new THREE.Color('#111111'));}scene.add(core);
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(pixels.flatMap(p=>p.position),3));const colorArray=new Float32Array(pixels.length*3);geometry.setAttribute('color',new THREE.BufferAttribute(colorArray,3));
  const glowMat=new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,vertexColors:true,uniforms:{ratio:{value:renderer.getPixelRatio()}},vertexShader:'varying vec3 vColor; uniform float ratio; void main(){vColor=color;vec4 mv=modelViewMatrix*vec4(position,1.0);gl_PointSize=min(48.0,290.0*ratio/-mv.z);gl_Position=projectionMatrix*mv;}',fragmentShader:'varying vec3 vColor; void main(){float r=length(gl_PointCoord-.5)*2.0;if(r>1.0)discard;float a=exp(-r*r*7.0)*.58;gl_FragColor=vec4(vColor*1.8,a);}'});
  const glows=new THREE.Points(geometry,glowMat);scene.add(glows);
  const composer=new EffectComposer(renderer);composer.addPass(new RenderPass(scene,camera));composer.addPass(new UnrealBloomPass(new THREE.Vector2(800,600),.35,.45,.82));composer.addPass(new OutputPass());
  const bounce=new THREE.PointLight('#85aaff',0,8,2);bounce.position.set(7,.45,2.6);scene.add(bounce);
  const ray=new THREE.Raycaster();let down;
  renderer.domElement.addEventListener('pointerdown',e=>down=[e.clientX,e.clientY]);renderer.domElement.addEventListener('pointerup',e=>{if(!down||Math.hypot(e.clientX-down[0],e.clientY-down[1])>5)return;const rect=renderer.domElement.getBoundingClientRect();ray.setFromCamera(new THREE.Vector2((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1),camera);const hit=ray.intersectObject(core)[0];if(hit)onSelect(pixels[hit.instanceId].prop);});
  let aspectFit=1;
  const resize=()=>{const w=host.clientWidth,h=host.clientHeight;if(!w||!h)return;camera.aspect=w/h;const fit=Math.max(1,1.4/camera.aspect);camera.position.sub(controls.target).multiplyScalar(fit/aspectFit).add(controls.target);aspectFit=fit;controls.maxDistance=Math.max(35,35*fit);camera.updateProjectionMatrix();renderer.setSize(w,h);composer.setSize(w,h);};new ResizeObserver(resize).observe(host);resize();
  const color=new THREE.Color();
  return {sectionCount,core,scene,
    setWires(value){wires.visible=value;},
    view(name){const views={front:[[4.25,4.5,23],[4.25,3,0]],orbit:[[14,9,20],[4.25,2.8,-1.5]],overhead:[[4.25,22,6],[4.25,0,-3]]};camera.position.set(...views[name][0]);controls.target.set(...views[name][1]);camera.position.sub(controls.target).multiplyScalar(aspectFit).add(controls.target);controls.update();},
    draw(colors){let sum=0;for(const p of pixels){const i=p.index*3;color.setRGB(colors[i]*2.2,colors[i+1]*2.2,colors[i+2]*2.2);core.setColorAt(p.index,color);colorArray[i]=colors[i];colorArray[i+1]=colors[i+1];colorArray[i+2]=colors[i+2];sum+=colors[i]+colors[i+1]+colors[i+2];}core.instanceColor.needsUpdate=true;geometry.attributes.color.needsUpdate=true;bounce.intensity=sum/pixels.length*1.7;controls.update();for(const {el,pos} of labels){const projected=pos.clone().project(camera);el.style.display=wires.visible&&projected.z<1?'block':'none';el.style.left=`${(projected.x*.5+.5)*host.clientWidth}px`;el.style.top=`${(-projected.y*.5+.5)*host.clientHeight}px`;}composer.render();},
    snapshot(){return renderer.domElement.toDataURL('image/png');}
  };
}
