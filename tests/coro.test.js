import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import {CORO_PROPS,CORO_SHEETS,CORO_PIECES,CORO_HOLES,SHEET} from '../src/coro.js';
import {OWN_CHANNELS} from '../src/props.js';

const byKind=k=>CORO_PROPS.find(p=>p.kind===k);

test('every coro prop in the model is cut, in the right number',()=>{
 const count=k=>OWN_CHANNELS.filter(c=>c.kind===k).length;
 for(const p of CORO_PROPS)assert.equal(p.cut,count(p.kind),p.kind);
 assert.equal(CORO_PIECES,CORO_PROPS.reduce((s,p)=>s+p.cut,0));
});

test('each prop carries its full pixel count: holes plus the pixels without one',()=>{
 for(const p of CORO_PROPS)assert.equal(p.holes+p.hidden.length,p.pixels,p.kind);
 assert.equal(CORO_HOLES,2*42+39+8*16+30);
});

test('wire is soldered in only where the string can\'t reach',()=>{
 assert.deepEqual(byKind('wreath').extensions.map(e=>[e.from,e.to]),[[24,25],[38,40]]);
 for(const k of ['peace','cane','star'])assert.deepEqual(byKind(k).extensions,[],k);
});

test('the pieces fit the sheets, and the sheets bought cover them',()=>{
 const placed=CORO_SHEETS.flatMap(s=>s.pieces).reduce((m,p)=>(m[p.kind]=(m[p.kind]||0)+1,m),{});
 for(const p of CORO_PROPS)assert.equal(placed[p.kind],p.cut,p.kind);
 for(const s of CORO_SHEETS){
  assert.ok(s.width<=SHEET.w,`${s.width} mm`);
  for(const p of s.pieces)assert.ok(p.h<=SHEET.h,p.kind);
 }
 assert.ok(CORO_SHEETS.length<=SHEET.bought);
});

test('every template has its full size and A4 PDF',()=>{
 for(const p of CORO_PROPS)for(const f of [`${p.file}.svg`,`${p.file}.pdf`,`${p.file}-a4.pdf`])
  assert.ok(existsSync(new URL(`../outputs/templates/${f}`,import.meta.url)),f);
});

test('the step-by-step guide cuts every piece once, and its ticks are accepted by the Worker',async()=>{
 const {CUTTING_STEPS,CUTTING_TICK_IDS,CUT_PIECES}=await import('../src/guides/cutting.js');
 const {GUIDE_STEP_IDS}=await import('../src/guides/index.js');
 const {statements}=await import('../worker/index.js');
 assert.equal(new Set(CUTTING_TICK_IDS).size,CUTTING_TICK_IDS.length);
 assert.equal(new Set(GUIDE_STEP_IDS).size,GUIDE_STEP_IDS.length);
 assert.equal(CUT_PIECES.length,CORO_PIECES);
 assert.equal(CUTTING_STEPS.filter(s=>s.sheet!==null).length,CORO_PIECES);
 for(const s of CUTTING_STEPS)assert.ok(s.tasks.length>0,s.id);
 const db={prepare:()=>({bind:(...a)=>a})};
 assert.equal(statements(db,{done:Object.fromEntries(CUTTING_TICK_IDS.map(id=>[id,true]))}).length,CUTTING_TICK_IDS.length);
 assert.throws(()=>statements(db,{done:{'cut/nope/x':true}}));
});
