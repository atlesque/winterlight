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
 assert.ok((get('pixels').qty+get('pixelsRegulated').qty)*50>=e.pixels);
 const z=Object.values(e.zones);
 assert.equal(get('controller').qty,z.reduce((s,x)=>s+x.controllers,0));
 assert.equal(get('psu').qty,z.reduce((s,x)=>s+x.psus,0));
 assert.equal(get('fittings').qty,z.length,'one wall board per garage box');
 // The Pi, its kit and the switch are at hand, so they are left off the list.
 const owned=e.infra.filter(l=>['player','playerKit','switch'].includes(l.item)).reduce((s,l)=>s+l.cost,0);
 const total=PURCHASES.reduce((s,p)=>s+p.cost,0);
 assert.ok(total>=(e.subtotal-owned)*.95,'purchases come close to the cost page before contingency');
 for(const id of ['enclosure','mains','network','switch','player','playerKit'])assert.ok(!get(id),`${id} is no longer bought`);
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
 assert.deepEqual(steps,['measure-facade','measure-garden','box-spots']);
});

test('the orders placed on 6 Nov start ticked and add up to what was paid',async()=>{
 const {PRESET}=await import('../src/runbook/runbook.js');
 const ordered=PURCHASES.filter(p=>p.ordered);
 assert.equal(Math.round(ordered.reduce((s,p)=>s+p.cost,0)*100)/100,2133.1);
 const shop=id=>Math.round(ordered.filter(p=>p.shop===id).reduce((s,p)=>s+p.cost,0)*100)/100;
 assert.deepEqual(['pixelimperium','ledshows','aliexpress','audiophonics','propixeler','bol','elektramat','bambu','kunststofshop'].map(shop),[820.47,391,407.46,140.96,103,61.94,33.58,62.24,112.45]);
 for(const p of ordered)assert.ok(PRESET.includes(`buy-${p.id}`),p.id);
 for(const id of PRESET)assert.ok(STEP_IDS.includes(id),id);
 assert.ok(!PRESET.includes('buy-treeFrame'),'the tree pole is still to buy locally');
});

test('the runbook API reads defaults, refuses writes without the key and validates changes',async()=>{
 const {default:worker,statements}=await import('../worker/index.js');
 const rows=new Map();
 const select={all:async()=>({results:[...rows].map(([k,value])=>{const [kind,id]=k.split(':');return {kind,id,value};})})};
 const db={
  prepare:sql=>sql.startsWith('SELECT')?select:{bind:(...a)=>({sql,a})},
  batch:async list=>{for(const {sql,a} of list){if(sql.startsWith('DELETE'))rows.delete(`expense:${a[0]}`);else rows.set(`${a[0]}:${a[1]}`,a[2]);}},
 };
 const env={RUNBOOK_DB:db,RUNBOOK_KEY:'sesame'};
 const call=(method,body,key)=>worker.fetch(new Request('https://x/api/runbook',{method,headers:{'content-type':'application/json',...(key&&{authorization:`Bearer ${key}`})},body:body&&JSON.stringify(body)}),env);
 assert.deepEqual(await (await call('GET')).json(),{done:{},expense:{}});
 assert.equal((await call('PATCH',{done:{'buy-pixels':false}})).status,401);
 assert.equal((await call('PATCH',{done:{'buy-pixels':false}},'wrong')).status,401);
 assert.equal((await call('PATCH',{done:{'not-a-step':true}},'sesame')).status,400);
 assert.equal((await call('PATCH',{expense:{pixels:'gift'}},'sesame')).status,400);
 const ok=await call('PATCH',{done:{'buy-pixels':false,'rcd':true},expense:{pixels:'business'}},'sesame');
 assert.deepEqual(await ok.json(),{done:{'buy-pixels':false,rcd:true},expense:{pixels:'business'}});
 const back=await call('PATCH',{expense:{pixels:null}},'sesame');
 assert.deepEqual((await back.json()).expense,{});
 assert.equal((await worker.fetch(new Request('https://x/api/other'),env)).status,404);
 assert.throws(()=>statements(db,{done:{rcd:'yes'}}));
});
