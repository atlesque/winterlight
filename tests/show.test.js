import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {parseMap,makeLayout,renderFrame,estimatePower,analyzeSamples,cueAt} from '../src/show.js';
import {HOUSE,PROP_LAYOUT,BANK_POSITIONS} from '../src/house.js';
const props=parseMap(readFileSync(new URL('../outputs/pixel-map.csv',import.meta.url),'utf8'));
const pixels=makeLayout(props);
test('physical layout preserves all channel assignments, power sections and access constraints',()=>{
 assert.equal(pixels.length,1050);assert.equal(props.reduce((sum,p)=>sum+p.sections,0),21);
 for(const bank of ['A','B','C'])assert.equal(pixels.filter(p=>p.prop.bank===bank).length,350);
 for(const p of pixels){assert.ok(p.position[0]>=HOUSE.garden.minX&&p.position[0]<=HOUSE.garden.maxX,'pixels stay in this property garden, clear of entrance and driveway');assert.ok(p.position[2]>=HOUSE.garden.minZ&&p.position[2]<=HOUSE.garden.maxZ,'pixels stay within the forecourt');assert.ok(p.position[1]<=1.2,'no high props');assert.ok(p.position[2]>0,'no wall-mounted pixels');}
 for(let i=0;i<props.length;i++){assert.equal(props[i].count*3,props[i].channelEnd-props[i].channelStart+1);if(i)assert.equal(props[i-1].channelEnd+1,props[i].channelStart);}
 assert.equal(props.at(-1).channelEnd,3150);
});
test('hardware design full-white load remains756W with252W per bank',()=>{const frame=renderFrame(pixels,10,185,1,null,true),load=estimatePower(pixels,frame);assert.ok(Math.abs(load.total-756)<.001);for(const watts of Object.values(load.watts))assert.ok(Math.abs(watts-252)<.001);});
test('all185seconds generate bounded deterministic frames, black at end',()=>{
 for(let t=0;t<185;t+=.5){const a=renderFrame(pixels,t,185,.3),b=renderFrame(pixels,t,185,.3);assert.deepEqual(a,b);assert.ok(a.every(x=>Number.isFinite(x)&&x>=0&&x<=.300001));}
 assert.ok(renderFrame(pixels,185,185).every(x=>x===0));
});
test('seekable choreography has no dependence on prior playback',()=>{const first=renderFrame(pixels,78.4,185);renderFrame(pixels,120,185);assert.deepEqual(first,renderFrame(pixels,78.4,185));assert.equal(cueAt(180,185).name,'Finale · all together');});
test('analysis detects an audio onset and silence produces no energy',()=>{const rate=8000,samples=new Float32Array(rate);for(let i=4000;i<4400;i++)samples[i]=.8*Math.sin(i);const features=analyzeSamples(samples,rate);assert.equal(features.length,40);assert.equal(features[0].energy,0);assert.ok(features.slice(20,23).some(f=>f.hit>.5));assert.ok(features.every(f=>f.energy>=0&&f.energy<=1));});

test('stands, cabinets and cable corridors stay clear of both access routes',()=>{
 const inGarden=(x,r=0)=>{assert.ok(x-r>=HOUSE.garden.minX);assert.ok(x+r<=HOUSE.garden.maxX);};
 for(const x of PROP_LAYOUT.arches.centers)inGarden(x,PROP_LAYOUT.arches.radius+.018);
 for(const x of PROP_LAYOUT.bars.centers)inGarden(x,.13);
 for(const x of PROP_LAYOUT.stars.centers)inGarden(x,.37+.012);
 inGarden(PROP_LAYOUT.matrix.x,.65);
 for(const [x,,z] of Object.values(BANK_POSITIONS)){inGarden(x,.14);assert.ok(z>.2);}
 // Wires connect banks to pixel x positions along z=.65/.83, wholly in the garden.
 for(const pixel of pixels)inGarden(pixel.position[0]);
 const mailbox=HOUSE.mailbox;
 assert.ok(mailbox.x-mailbox.width/2-.02>=HOUSE.driveway.maxX,'mailbox cap clears garage access');
 assert.ok(mailbox.x+mailbox.width/2+.02<=HOUSE.entry.minX,'mailbox cap clears entrance');
 assert.ok(Math.abs(mailbox.z+mailbox.depth/2-HOUSE.forecourtDepth)<.001,'mailbox at street edge');
 assert.ok(HOUSE.entry.minX<=HOUSE.door.x-HOUSE.door.width/2);
 assert.ok(HOUSE.entry.maxX>=HOUSE.door.x+HOUSE.door.width/2);
 assert.ok(HOUSE.driveway.minX<=HOUSE.garage.x-HOUSE.garage.width/2);
 assert.ok(HOUSE.driveway.maxX>=HOUSE.garage.x+HOUSE.garage.width/2);
});
