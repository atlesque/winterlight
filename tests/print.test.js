import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';
import {PARTS,PRINT_PROPS,BED,FILAMENT,FENCE_POSTS} from '../src/print/parts.js';
import {OWN_CHANNELS} from '../src/props.js';
import {measure} from '../tools/print/make.mjs';
import {ASSEMBLIES} from '../src/print/assembly.js';
import MANIFEST from '../outputs/print/manifest.json' with {type:'json'};

const file=f=>new URL(`../${f}`,import.meta.url);

test('every part has its source, a rendered STL and fits the A1 bed',()=>{
 for(const p of PARTS){
  assert.ok(existsSync(file(`tools/print/${p.scad}.scad`)),p.id);
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
 assert.ok(qty('tree-ring')+qty('tree-ring-weight')>=count('treeStrip'));
 assert.ok(qty('cane-base')>=count('cane'));
 assert.ok(qty('fence-foot')>=FENCE_POSTS&&qty('fence-post')>=qty('fence-foot'));
 assert.equal(new Set(PRINT_PROPS.map(p=>p.id)).size,PRINT_PROPS.length);
});

test('the PETG bought covers every print',()=>{
 const grams=PARTS.reduce((s,p)=>s+p.qty*MANIFEST[p.id].grams,0);
 assert.ok(grams<FILAMENT.rolls*FILAMENT.grams,`${grams} g`);
});

test('the finished props are drawn from the printed parts, nothing staked into the paving',()=>{
 const ids=new Set(PARTS.map(p=>p.id));
 for(const [id,a] of Object.entries(ASSEMBLIES)){
  const stls=a.items.filter(i=>i.stl).map(i=>i.stl);
  assert.ok(stls.length,id);for(const s of stls)assert.ok(ids.has(s),`${id}: ${s}`);
  // Only the mini trees reach below ground level, into their bush.
  if(id!=='minitrees')for(const i of a.items.filter(i=>i.cyl))assert.ok(i.cyl.z0>=0,id);
 }
 for(const p of PRINT_PROPS)assert.ok(ASSEMBLIES[p.id],p.id);
});
