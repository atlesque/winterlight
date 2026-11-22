import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';
import {PARTS,PRINT_PROPS,BED,FILAMENT,FENCE_POSTS,PLATES,NOZZLES,BASE_PARTS} from '../src/print/parts.js';
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

test('the print queue prints every part exactly as many times as needed, each plate fitting the bed',()=>{
 const n={};
 for(const st of PLATES)for(const pl of st.plates)for(const [id,k] of Object.entries(pl)){assert.ok(MANIFEST[id],`${st.id}: ${id}`);n[id]=(n[id]??0)+k;}
 for(const p of PARTS)assert.equal(n[p.id],p.qty,p.id);
 for(const st of PLATES)for(const pl of st.plates){
  const sizes=Object.entries(pl).flatMap(([id,k])=>Array(k).fill(MANIFEST[id].size));
  // Side by side along X, 5 mm apart: each part turned with its short side along X.
  const x=sizes.reduce((s,v)=>s+Math.min(v[0],v[1]),0)+5*(sizes.length-1);
  assert.ok(x<=BED.x&&sizes.every(v=>Math.max(v[0],v[1])<=BED.y),`${st.id}: ${x} mm`);
 }
 assert.equal(new Set(PLATES.map(s=>s.id)).size,PLATES.length);
 // Nothing that holds a brick comes before the step that measures one.
 const firstBrick=PLATES.findIndex(s=>s.needs==='brick'),bricky=new Set(['cane-base','fence-foot','tree-ring-weight']);
 PLATES.forEach((st,i)=>{if(st.plates.some(pl=>Object.keys(pl).some(id=>bricky.has(id))))assert.ok(i>=firstBrick&&st.needs==='brick',st.id);});
 for(const id of BASE_PARTS)assert.ok(MANIFEST[id],id);
 assert.ok(NOZZLES.find(z=>z.id==='n06').speed<1);
});
