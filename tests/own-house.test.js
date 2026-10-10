import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {CHANNELS} from '../src/original/layout.js';
import {prepareOriginalCues} from '../src/original/cues.js';
import {OWN_CHANNELS} from '../src/props.js';
import {HOUSE,PROP_LAYOUT} from '../src/house.js';

const GARDEN=new Set(['canes','minitrees','fence','tree']);
const bulbs=kind=>OWN_CHANNELS.filter(c=>c.kind===kind).flatMap(c=>c.bulbs.map(b=>b.pos));

test('our house has every original channel, in the same order and addressing',()=>{
 assert.deepEqual(OWN_CHANNELS.map(c=>[c.id,c.prop,c.kind,c.palette]),CHANNELS.map(c=>[c.id,c.prop,c.kind,c.palette]));
 for(const c of OWN_CHANNELS){
  assert.ok(c.bulbs.length>0,`${c.id} has no bulbs`);
  for(const b of c.bulbs){assert.ok(b.pos.every(Number.isFinite));assert.ok(c.palette==='multi'?b.tone===1||b.tone===2:b.tone===0,`${c.id} tone`);}
 }
});

test('the original detected timing drives our house unchanged',()=>{
 const data=JSON.parse(readFileSync(new URL('../outputs/original-house-cues.json',import.meta.url),'utf8'));
 const ours=prepareOriginalCues(data,OWN_CHANNELS),theirs=prepareOriginalCues(data,CHANNELS);
 for(const t of [0,12.5,60,147.5,180]){const a=new Uint8Array(CHANNELS.length),b=new Uint8Array(CHANNELS.length),la=new Uint8Array(CHANNELS.length),lb=new Uint8Array(CHANNELS.length);
  assert.deepEqual(ours.stateAt(t,a,la),theirs.stateAt(t,b,lb));assert.deepEqual(la,lb);}
});

test('facade props stay on our frontage and garden props in the garden, off the planting tiles or above the bushes',()=>{
 const {size,bush,tiles}=HOUSE.planters,onTile=(x,z)=>tiles.some(t=>Math.abs(x-t.x)<size/2+.02&&Math.abs(z-t.z)<size/2+.02);
 for(const c of OWN_CHANNELS)for(const {pos:[x,y,z]} of c.bulbs){
  if(GARDEN.has(c.prop)){assert.ok(x>HOUSE.entry.maxX&&x<=HOUSE.garden.maxX,`${c.id} clear of the entrance`);assert.ok(z>=HOUSE.garden.minZ&&z<=HOUSE.forecourtDepth,`${c.id} in the garden`);assert.ok(!onTile(x,z)||y>=bush,`${c.id} inside a bush`);}
  else{assert.ok(x>-.1&&x<HOUSE.width+.1,`${c.id} on this frontage`);assert.ok(y<HOUSE.eaves&&z>=.05&&z<=.3,`${c.id} on the front wall`);}
 }
 // The ground strip runs along the left side of the shrubbery.
 const fence=OWN_CHANNELS.find(c=>c.id==='fence').bulbs.map(b=>b.pos);
 assert.ok(Math.max(...fence.filter(p=>p[2]<3.5).map(p=>p[0]))<Math.min(...tiles.map(t=>t.x))-size/2);
});

test('letters sit between the door and the upper windows; circles fit one pane; the peace sign is on the door',()=>{
 const letters=bulbs('letter'),top=HOUSE.windows[0].y-HOUSE.windows[0].height/2-.1;
 assert.ok(Math.min(...letters.map(p=>p[1]))>HOUSE.door.height+.15);assert.ok(Math.max(...letters.map(p=>p[1]))<top);
 const peace=bulbs('peace'),{door}=HOUSE;
 assert.ok(peace.every(([x,y])=>Math.abs(x-door.x)<door.width/2-.1&&y>door.height/2&&y<door.height-.15),'peace sign on the door');
 for(const kind of ['wreath'])for(const c of OWN_CHANNELS.filter(c=>c.kind===kind)){
  const xs=c.bulbs.map(b=>b.pos[0]),window=HOUSE.windows.slice(0,2).find(w=>Math.abs(w.x-xs[0])<w.width/2),half=window.width/2;
  const pane=xs[0]<window.x?[window.x-half,window.x]:[window.x,window.x+half];
  assert.ok(Math.min(...xs)>pane[0]&&Math.max(...xs)<pane[1],`${c.id} fits one pane`);
 }
});

test('the upper strip runs along the top edge of the upper windows, from the left one to the right one',()=>{
 const [left,right]=HOUSE.windows,top=left.y+left.height/2,line=OWN_CHANNELS.find(c=>c.id==='upper').bulbs.filter(b=>b.size===1).map(b=>b.pos);
 assert.ok(line.every(p=>p[1]>top&&p[1]<top+.2),'just above the window tops');
 assert.ok(Math.abs(Math.min(...line.map(p=>p[0]))-(left.x-left.width/2))<.15&&Math.abs(Math.max(...line.map(p=>p[0]))-(right.x+right.width/2))<.15,'window to window');
});

test('the mini trees stand on the bush tops, where the bushes cannot hide them',()=>{
 const {size,bush,tiles}=HOUSE.planters,trees=OWN_CHANNELS.filter(c=>c.kind==='minitree');
 assert.equal(trees.length,11);
 for(const c of trees){const base=Math.min(...c.bulbs.map(b=>b.pos[1])),[x,,z]=c.bulbs[0].pos;
  assert.ok(base>=bush&&base<bush+.1,`${c.id} on a bush top`);assert.ok(tiles.some(t=>Math.abs(x-t.x)<size/2&&Math.abs(z-t.z)<size/2),`${c.id} over a bush`);}
 // Left to right, so chases still run across the garden.
 const xs=trees.map(c=>Math.min(...c.bulbs.map(b=>b.pos[0])));assert.deepEqual(xs,[...xs].sort((a,b)=>a-b));
});

test('the star sits just above the tree, with a small gap',()=>{
 const top=Math.max(...bulbs('treeStrip').map(p=>p[1])),star=Math.min(...bulbs('star').map(p=>p[1]));
 assert.ok(star>top&&star-top<.25);assert.ok(PROP_LAYOUT.tree.height>2);
});
