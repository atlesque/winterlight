import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {parseMap,makeLayout,renderFrame,estimatePower,analyzeSamples,cueAt} from '../src/show.js';
import {HOUSE,PROP_LAYOUT,BANK_POSITIONS} from '../src/house.js';
import {BANKS,BULB,CHANNEL_COUNT,FEED_COUNT,powerSections,cableRoute,propColors,propPositions} from '../src/props.js';
const props=parseMap(readFileSync(new URL('../outputs/pixel-map.csv',import.meta.url),'utf8'));
const pixels=makeLayout(props);
const facade=p=>p.prop.mount==='facade';
test('physical layout preserves all channel assignments, power sections and access constraints',()=>{
 assert.equal(pixels.length,1095);assert.equal(props.length,10);assert.equal(props.reduce((sum,p)=>sum+p.sections,0),27);
 for(const bank of ['A','B','C'])assert.equal(pixels.filter(p=>p.prop.bank===bank).length,BANKS[bank].count);
 for(const p of pixels){
  assert.ok(p.position.every(Number.isFinite));
  if(facade(p)){assert.ok(p.position[0]>-.1&&p.position[0]<HOUSE.width+.1,'on this frontage');assert.ok(p.position[1]<HOUSE.eaves,'below the gutter');assert.ok(p.position[2]>=.05&&p.position[2]<=.3,'on the front wall');}
  else{assert.ok(p.position[0]>=HOUSE.garden.minX&&p.position[0]<=HOUSE.garden.maxX,'standing props clear of access');assert.ok(p.position[2]>=HOUSE.garden.minZ&&p.position[2]<=HOUSE.garden.maxZ);assert.ok(p.position[1]<=3.1);}
 }
 for(let i=0;i<props.length;i++){assert.equal(props[i].count*3,props[i].channelEnd-props[i].channelStart+1);if(i)assert.equal(props[i-1].channelEnd+1,props[i].channelStart);}
 assert.equal(props.at(-1).channelEnd,CHANNEL_COUNT);
});
test('every pixel has its own bulb colour and the letters cycle red, green and yellow',()=>{
 for(const prop of props){const colors=propColors(prop);assert.equal(colors.length,prop.count);assert.ok(colors.every(c=>c.length===3&&c.every(v=>v>=0&&v<=1)));}
 const letters=propColors(props.find(p=>p.id==='Letters'));assert.deepEqual([...new Set(letters.map(String))],[BULB.red,BULB.green,BULB.yellow].map(String));
 const tree=props.find(p=>p.id==='Tree'),star=props.find(p=>p.id==='TreeStar');
 const top=Math.max(...propPositions(tree).map(p=>p[1])),starBottom=Math.min(...propPositions(star).map(p=>p[1]));
 assert.ok(starBottom>top&&starBottom-top<.2,'star sits just above the tree with a small gap');
});
test('procurement power maximum fits all three retained supplies',()=>{const frame=renderFrame(pixels,10,185,1,null,true),load=estimatePower(pixels,frame);assert.ok(Math.abs(load.total-1095*.72)<.001);for(const [bank,watts] of Object.entries(load.watts)){assert.ok(Math.abs(watts-BANKS[bank].watts)<.001);assert.ok(watts<320.4);}});
test('all185seconds generate bounded deterministic frames, black at end',()=>{
 for(let t=0;t<185;t+=.5){const a=renderFrame(pixels,t,185,.3),b=renderFrame(pixels,t,185,.3);assert.deepEqual(a,b);assert.ok(a.every(x=>Number.isFinite(x)&&x>=0&&x<=.300001));}
 assert.ok(renderFrame(pixels,185,185).every(x=>x===0));
});
test('seekable choreography has no dependence on prior playback',()=>{const first=renderFrame(pixels,78.4,185);renderFrame(pixels,120,185);assert.deepEqual(first,renderFrame(pixels,78.4,185));assert.equal(cueAt(180,185).name,'Finale · all together');});
test('analysis detects an audio onset and silence produces no energy',()=>{const rate=8000,samples=new Float32Array(rate);for(let i=4000;i<4400;i++)samples[i]=.8*Math.sin(i);const features=analyzeSamples(samples,rate);assert.equal(features.length,40);assert.equal(features[0].energy,0);assert.ok(features.slice(20,23).some(f=>f.hit>.5));assert.ok(features.every(f=>f.energy>=0&&f.energy<=1));});

test('stands, cabinets and cable corridors stay clear of both access routes',()=>{
 const inGarden=(x,r=0)=>{assert.ok(x-r>=HOUSE.garden.minX);assert.ok(x+r<=HOUSE.garden.maxX);};
 const {tree,minitrees,canes}=PROP_LAYOUT;
 inGarden(tree.x,tree.radius);for(const x of minitrees.xs)inGarden(x,minitrees.radius);for(const x of canes.xs)inGarden(x,.01);
 for(const [x,,z] of Object.values(BANK_POSITIONS)){inGarden(x,.14);assert.ok(z>.2);}
 // Wires connect banks to pixel x positions along z=.65/.83, wholly in the garden.
 for(const pixel of pixels.filter(p=>!facade(p)))inGarden(pixel.position[0]);
 const mailbox=HOUSE.mailbox;
 assert.ok(mailbox.x-mailbox.width/2-.02>=HOUSE.driveway.maxX,'mailbox cap clears garage access');
 assert.ok(mailbox.x+mailbox.width/2+.02<=HOUSE.entry.minX,'mailbox cap clears entrance');
 assert.ok(Math.abs(mailbox.z+mailbox.depth/2-HOUSE.forecourtDepth)<.001,'mailbox at street edge');
 assert.ok(HOUSE.entry.minX<=HOUSE.door.x-HOUSE.door.width/2);
 assert.ok(HOUSE.entry.maxX>=HOUSE.door.x+HOUSE.door.width/2);
 assert.ok(HOUSE.driveway.minX<=HOUSE.garage.x-HOUSE.garage.width/2);
 assert.ok(HOUSE.driveway.maxX>=HOUSE.garage.x+HOUSE.garage.width/2);
});

test('standing props, bases and cable routes stay off the planting tiles',()=>{
 const {size,tiles}=HOUSE.planters;
 const onTile=(x,z,rx=0,rz=rx)=>tiles.some(t=>Math.abs(x-t.x)<size/2+rx&&Math.abs(z-t.z)<size/2+rz);
 for(const p of pixels.filter(p=>!facade(p)))assert.ok(!onTile(p.position[0],p.position[2],.03),`${p.prop.id} over a planter`);
 assert.ok(!onTile(PROP_LAYOUT.tree.x,PROP_LAYOUT.tree.z,.12),'tree base clear');
 // The tree's strips clear the clipped bushes at bush height.
 const {x,z,radius,height}=PROP_LAYOUT.tree,{bush}=HOUSE.planters,r=radius*(1-bush/height);
 for(let a=0;a<2*Math.PI;a+=.1)assert.ok(!tiles.some(t=>Math.abs(x+Math.sin(a)*r-t.x)<bush/2&&Math.abs(z+Math.cos(a)*r-t.z)<bush/2),'tree strip through a bush');
 for(const p of props.filter(p=>p.mount!=='facade'))for(const {start} of powerSections(p)){
  const route=cableRoute(BANK_POSITIONS[p.bank],p,pixels.find(x=>x.prop===p&&x.local===start).position);
  for(let i=1;i<route.length;i++)for(let f=0;f<=1;f+=.02){const a=route[i-1],b=route[i];assert.ok(!onTile(a[0]+(b[0]-a[0])*f,a[2]+(b[2]-a[2])*f),`${p.id} cable crosses a planter`);}
 }
});

test('all 27 sections cover each prop once and facade leads cross above the door',()=>{
 let count=0;
 for(const p of props){const sections=powerSections(p);let next=0;for(const {start,end} of sections){assert.equal(start,next);assert.ok(end-start>0&&end-start<=50);next=end;count++;}assert.equal(next,p.count);assert.ok(p.port>=1&&p.port<=8);
  const route=cableRoute(BANK_POSITIONS[p.bank],p,pixels.find(x=>x.prop===p).position);
  for(let i=1;i<route.length;i++){
   const a=route[i-1],b=route[i];
   if(Math.min(a[0],b[0])<HOUSE.entry.maxX&&Math.max(a[0],b[0])>HOUSE.entry.minX){assert.ok(Math.min(a[1],b[1])>2.3||Math.max(a[2],b[2])<=.25,'entrance crossings are above lintel or on frame');}
  }
 }
 assert.equal(count,FEED_COUNT);
 for(const bank of ['A','B','C'])assert.equal(new Set(props.filter(p=>p.bank===bank).map(p=>p.port)).size,BANKS[bank].ports);
});
