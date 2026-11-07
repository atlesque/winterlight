import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';
import {PARTS,PRINT_PROPS,BED,FILAMENT,FENCE_POSTS} from '../src/print/parts.js';
import {OWN_CHANNELS} from '../src/props.js';
import {measure} from '../tools/print/make.mjs';
import MANIFEST from '../outputs/print/manifest.json' with {type:'json'};

const file=f=>new URL(`../${f}`,import.meta.url);

test('every part has its source, a rendered STL and fits the A1 bed',()=>{
 for(const p of PARTS){
  assert.ok(existsSync(file(`tools/print/${p.id}.scad`)),p.id);
  assert.ok(existsSync(file(`outputs/print/${p.id}.scad`)),p.id);
  const m=measure(readFileSync(file(`outputs/print/${p.id}.stl`)));
  assert.ok(m.triangles>12,p.id);
  assert.deepEqual(m.size,MANIFEST[p.id].size,`${p.id}: manifest is out of date, run node tools/print/make.mjs`);
  m.size.forEach((v,j)=>assert.ok(v<=[BED.x,BED.y,BED.z][j],`${p.id} is ${m.size.join(' × ')} mm`));
 }
});

test('there is a part for every garden prop that needs one, in the right number',()=>{
 const qty=id=>PARTS.find(p=>p.id===id).qty,count=k=>OWN_CHANNELS.filter(c=>c.kind===k).length;
 assert.ok(qty('minitree-base')>=count('minitree')&&qty('minitree-top')>=count('minitree'));
 assert.ok(qty('tree-peg')>=count('treeStrip'));
 assert.ok(qty('cane-stake')>=count('cane'));
 assert.ok(qty('fence-spike')>=FENCE_POSTS&&qty('fence-post')===qty('fence-spike'));
 assert.equal(new Set(PRINT_PROPS.map(p=>p.id)).size,PRINT_PROPS.length);
});

test('the PETG bought covers every print',()=>{
 const grams=PARTS.reduce((s,p)=>s+p.qty*MANIFEST[p.id].grams,0);
 assert.ok(grams<FILAMENT.rolls*FILAMENT.grams,`${grams} g`);
});
