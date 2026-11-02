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
