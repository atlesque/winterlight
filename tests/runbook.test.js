import test from 'node:test';
import assert from 'node:assert/strict';
import {estimate,ALL} from '../src/costs/estimate.js';
import {CHAPTERS,PURCHASES,SHOPS,STEP_IDS,SHOW_DATE} from '../src/runbook/runbook.js';

test('every to-do has a unique id and every chapter is due before show night',()=>{
 assert.equal(new Set(STEP_IDS).size,STEP_IDS.length);
 for(const c of CHAPTERS){assert.ok(c.steps.length,c.id);assert.ok(c.due<SHOW_DATE,c.id);}
});

test('every purchase is ordered once, links to a shop and has an expense tag',()=>{
 const buys=CHAPTERS.flatMap(c=>c.steps.filter(s=>s.buy).map(s=>s.buy));
 assert.deepEqual([...buys].sort(),PURCHASES.map(p=>p.id).sort());
 for(const p of PURCHASES){
  assert.match(p.url,/^https:\/\//,p.id);assert.ok(SHOPS[p.shop],p.id);
  assert.ok(['private','business'].includes(p.expense),p.id);assert.ok(p.qty>0&&p.cost>0,p.id);
 }
});

test('the shopping list covers the full show in the cost model',()=>{
 const e=estimate(ALL),get=id=>PURCHASES.find(p=>p.id===id);
 assert.ok(get('pixels').qty*50>=e.pixels);
 const z=Object.values(e.zones);
 assert.equal(get('controller').qty,z.reduce((s,x)=>s+x.controllers,0));
 assert.equal(get('psu').qty,z.reduce((s,x)=>s+x.psus,0));
 assert.equal(get('enclosure').qty,z.reduce((s,x)=>s+x.boxes,0));
 const total=PURCHASES.reduce((s,p)=>s+p.cost,0);
 assert.ok(total>=e.subtotal*.95,'purchases come close to the cost page before contingency');
});

test('the runbook links every coro template, and each is made from the model',async()=>{
 const {existsSync}=await import('node:fs');
 const {TEMPLATES:made}=await import('../tools/templates/make.mjs');
 const {TEMPLATES}=await import('../src/runbook/runbook.js');
 assert.deepEqual(TEMPLATES.map(t=>[t.file,t.cut]),made.map(t=>[t.file,t.cut]));
 for(const t of TEMPLATES)for(const ext of ['svg','pdf'])assert.ok(existsSync(new URL(`../outputs/templates/${t.file}.${ext}`,import.meta.url)),`${t.file}.${ext}`);
});

test('the measuring steps say what the plan gives and what needs a tape',async()=>{
 const {MEASURES}=await import('../src/runbook/runbook.js');
 const rows=Object.values(MEASURES).flat();
 for(const r of rows){assert.ok(['plan','tape'].includes(r.from),r.what);assert.ok(r.value&&r.how,r.what);assert.doesNotMatch(r.value+r.how,/NaN|undefined/,r.what);}
 assert.equal(MEASURES.facade[0].value,'3.93 m');
 assert.ok(rows.some(r=>r.from==='tape'&&/height/i.test(r.what)),'heights are not on the plan');
 const lead=+MEASURES.boxes[0].value.match(/\d+/)[0];assert.ok(lead<15,'garden lead stays under 15 m');
 const steps=CHAPTERS[0].steps.filter(s=>s.measures).map(s=>s.id);
 assert.deepEqual(steps,['measure-facade','measure-garden','box-spots','network-runs']);
});
