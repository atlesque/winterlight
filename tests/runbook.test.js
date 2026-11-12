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
 for(const id of ['switch','player','playerKit'])assert.ok(!get(id),`${id} is at hand`);
 // The garden box stands outdoors: its enclosure, mains and network run are on the list.
 for(const id of ['gardenBox','gardenMains','gardenNetwork'])assert.ok(get(id),id);
 // What was bought on 6 Nov plus what was added on 10 Nov covers what the model needs.
 assert.ok((get('mountStrip').qty+get('mountStripMore').qty)*50>=e.groups.flatMap(g=>g.props.flatMap(p=>p.lines)).filter(l=>l.item==='mountStrip').reduce((s,l)=>s+l.qty,0));
 const facadeInject=e.groups.filter(g=>g.zone==='facade').flatMap(g=>g.injectRuns).reduce((s,r)=>s+r.m,0);
 assert.ok(get('injectWire').qty/2+get('injectCable').qty>=facadeInject,'the facade injection runs are covered');
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
 assert.deepEqual(steps,['measure-facade','measure-garden','measure-more','box-spots']);
});

test('the orders placed on 6 Nov start ticked and add up to what was paid',async()=>{
 const {PRESET}=await import('../src/runbook/runbook.js');
 const ordered=PURCHASES.filter(p=>p.ordered==='2026-11-06');
 assert.equal(Math.round(ordered.reduce((s,p)=>s+p.cost,0)*100)/100,2133.1);
 const shop=id=>Math.round(ordered.filter(p=>p.shop===id).reduce((s,p)=>s+p.cost,0)*100)/100;
 assert.deepEqual(['pixelimperium','ledshows','aliexpress','audiophonics','propixeler','bol','elektramat','bambu','kunststofshop'].map(shop),[820.47,391,407.46,140.96,103,61.94,33.58,62.24,112.45]);
 for(const p of PURCHASES.filter(p=>p.ordered))assert.ok(PRESET.includes(`buy-${p.id}`),p.id);
 for(const id of PRESET)assert.ok(STEP_IDS.includes(id),id);
 assert.ok(!PRESET.includes('buy-treeFrame'),'the tree pole is still to buy locally');
});

test('the runbook API needs an Access sign-in, reads defaults and validates changes',async()=>{
 const {default:worker,statements}=await import('../worker/index.js');
 const rows=new Map(),measured=new Map();
 const select={all:async()=>({results:[...rows].map(([k,value])=>{const [kind,id]=k.split(':');return {kind,id,value};})})};
 const mselect={all:async()=>({results:[...measured].map(([id,value])=>({id,value}))})};
 const db={
  prepare:sql=>sql.startsWith('SELECT')?(sql.includes('measurements')?mselect:select):{bind:(...a)=>({sql,a})},
  batch:async list=>{for(const {sql,a} of list){
   if(sql.includes('measurements'))sql.startsWith('DELETE')?measured.delete(a[0]):measured.set(a[0],a[1]);
   else if(sql.startsWith('DELETE'))rows.delete(`expense:${a[0]}`);else rows.set(`${a[0]}:${a[1]}`,a[2]);}},
 };
 const env={RUNBOOK_DB:db};
 const call=(method,body,user)=>worker.fetch(new Request('https://x/api/runbook',{method,headers:{'content-type':'application/json',...(user&&{'cf-access-authenticated-user-email':user})},body:body&&JSON.stringify(body)}),env);
 const me='alex@example.com';
 assert.equal((await call('GET')).status,401);
 assert.equal((await call('PATCH',{done:{'buy-pixels':false}})).status,401);
 assert.deepEqual(await (await call('GET',null,me)).json(),{done:{},expense:{},measures:{}});
 const viaCookie=await worker.fetch(new Request('https://x/api/runbook',{headers:{cookie:'theme=dark; CF_Authorization=abc'}}),env);
 assert.equal(viaCookie.status,200,'the Access cookie alone is enough');
 const viaJwt=await worker.fetch(new Request('https://x/api/runbook',{headers:{'cf-access-jwt-assertion':'abc'}}),env);
 assert.equal(viaJwt.status,200,'the Access JWT header alone is enough');
 assert.equal((await call('PATCH',{done:{'not-a-step':true}},me)).status,400);
 assert.equal((await call('PATCH',{expense:{pixels:'gift'}},me)).status,400);
 const ok=await call('PATCH',{done:{'buy-pixels':false,'rcd':true},expense:{pixels:'business'}},me);
 assert.deepEqual(await ok.json(),{done:{'buy-pixels':false,rcd:true},expense:{pixels:'business'},measures:{}});
 const back=await call('PATCH',{expense:{pixels:null}},me);
 assert.deepEqual((await back.json()).expense,{});
 assert.equal((await worker.fetch(new Request('https://x/api/other'),env)).status,404);
 assert.throws(()=>statements(db,{done:{rcd:'yes'}}));
});

test('measurements are stored, checked against their bounds and tick their measuring step once complete',async()=>{
 const {default:worker}=await import('../worker/index.js');
 const {MEASUREMENTS,byStep}=await import('../src/measures/measures.js');
 const rows=new Map(),measured=new Map();
 const db={
  prepare:sql=>sql.startsWith('SELECT')?{all:async()=>({results:sql.includes('measurements')?[...measured].map(([id,value])=>({id,value})):[...rows].map(([k,value])=>{const [kind,id]=k.split(':');return {kind,id,value};})})}:{bind:(...a)=>({sql,a})},
  batch:async list=>{for(const {sql,a} of list){if(sql.includes('measurements'))sql.startsWith('DELETE')?measured.delete(a[0]):measured.set(a[0],a[1]);else rows.set(`${a[0]}:${a[1]}`,a[2]);}},
 };
 const call=body=>worker.fetch(new Request('https://x/api/runbook',{method:'PATCH',headers:{'content-type':'application/json','cf-access-jwt-assertion':'abc'},body:JSON.stringify(body)}),{RUNBOOK_DB:db});
 assert.equal((await call({measures:{doorHeight:12}})).status,400,'12 m is no door');
 assert.equal((await call({measures:{nope:1}})).status,400);
 assert.equal((await call({measures:{doorHeight:'2.1'}})).status,400);
 const garden=byStep('measure-garden');
 let s=await (await call({measures:Object.fromEntries(garden.slice(1).map(m=>[m.id,m.guess]))})).json();
 assert.equal(s.done['measure-garden'],undefined,'not ticked while one value is missing');
 s=await (await call({measures:{[garden[0].id]:garden[0].guess+.1}})).json();
 assert.equal(s.done['measure-garden'],true,'ticked with the last value');
 assert.equal(s.measures[garden[0].id],garden[0].guess+.1);
 s=await (await call({done:{'measure-garden':false}})).json();
 s=await (await call({measures:{[garden[1].id]:garden[1].guess+.02}})).json();
 assert.equal(s.done['measure-garden'],false,'an untick stays when a value is corrected');
 s=await (await call({measures:{[garden[0].id]:null}})).json();
 assert.equal(s.measures[garden[0].id],undefined,'null clears a value');
 assert.equal(new Set(MEASUREMENTS.map(m=>m.id)).size,MEASUREMENTS.length);
});

test('measured values flow into the runbook: outlines, ground strip, pixel strings and fit checks',async()=>{
 const {applyMeasures,BASELINE,MEASUREMENTS}=await import('../src/measures/measures.js');
 const {MEASURES}=await import('../src/runbook/runbook.js');
 const guesses=Object.fromEntries(MEASUREMENTS.map(m=>[m.id,m.guess]));
 const same=applyMeasures(guesses);
 assert.equal(same.windows,BASELINE.windows,'the guesses rebuild the model\'s outlines');
 assert.equal(same.fence,BASELINE.fence,'and its ground strip');
 assert.equal(same.pixels,BASELINE.pixels);
 assert.equal(BASELINE.strings,PURCHASES.filter(p=>p.id.startsWith('pixels')).reduce((n,p)=>n+p.qty,0),'the strings ordered');
 assert.equal(BASELINE.rolls,PURCHASES.filter(p=>p.id.startsWith('mountStrip')).reduce((n,p)=>n+p.qty,0),'the rolls bought');
 assert.deepEqual(applyMeasures({}).steps,{},'nothing measured, nothing changes');
 // The model now carries the taped values of 8 Nov 2026: entering them changes no count.
 const {MODEL}=await import('../src/measures/measures.js');
 const taped=applyMeasures({smallWindowHeight:.76,doorHeight:2.1,kitchenWindowHeight:1.21,garageDoorHeight:2.12,gardenDepth:3.91});
 assert.deepEqual([taped.windows,taped.fence,taped.pixels,taped.stripMetres],[MODEL.windows,MODEL.fence,MODEL.pixels,MODEL.stripMetres]);
 assert.ok(taped.strings<=BASELINE.strings&&taped.rolls<=BASELINE.rolls,'the order still covers the measured house');
 const taller=applyMeasures({doorHeight:2.5,garageDoorHeight:2.45});
 assert.ok(taller.windows>BASELINE.windows,'taller openings need more outline pixels');
 assert.match(taller.steps['build-windows'].text,new RegExp(String(taller.windows)));
 assert.ok(taller.steps['count-pixels'].notes[0].text.includes('still cover'));
 const deep=applyMeasures({gardenDepth:6});
 assert.ok(deep.fence>BASELINE.fence);assert.match(deep.steps['build-fence'].text,new RegExp(String(deep.fence)));
 const huge=applyMeasures({smallWindowHeight:2,doorHeight:3,kitchenWindowHeight:2.5,garageDoorHeight:3,gardenDepth:8});
 assert.ok(huge.strings>BASELINE.strings&&huge.steps['count-pixels'].notes[0].warn,'runs past the spare warn to order more strings');
 assert.ok(applyMeasures({letterBand:.35}).steps['place-letters'].notes[0].warn);
 assert.ok(!applyMeasures({letterBand:.9}).steps['place-letters'].notes[0].warn);
 assert.ok(applyMeasures({bushWidth:.5}).steps['place-garden'].notes[0].warn);
 assert.ok(!applyMeasures({kitchenWindowTop:2.1}).steps['place-letters'].notes[0].warn,'a kitchen window level with the door clears the letters');
 assert.ok(applyMeasures({kitchenWindowTop:2.7}).steps['place-letters'].notes[0].warn,'a taller one runs into them');
 assert.ok(!applyMeasures({tileSetback:.91}).steps['place-garden'].notes[0].warn);
 assert.ok(applyMeasures({tileSetback:1.6}).steps['place-garden'].notes[0].warn,'tiles past the cane line');
 assert.ok(!applyMeasures({tileGapWidth:.62,tileGapDepth:.85}).steps['place-tree'].notes[0].warn);
 for(const step of Object.keys(huge.steps))assert.ok(STEP_IDS.includes(step),step);
 // Every tape line in the measuring steps points at measurements on the measure page.
 for(const r of Object.values(MEASURES).flat().filter(r=>r.from==='tape'))for(const id of r.ids)assert.ok(guesses[id]!==undefined,id);
 for(const m of MEASUREMENTS){assert.ok(m.guess>=m.min&&m.guess<=m.max,m.id);assert.ok([...m.from,...m.to].every(Number.isFinite),m.id);assert.ok(STEP_IDS.includes(m.step),m.id);}
});

test('the LEDshows and Elektramat parcels arrived on 9 Nov, the Bambu Lab PETG and the rest of bol.com on 12 Nov, and start ticked',async()=>{
 const {PRESET}=await import('../src/runbook/runbook.js');
 const steps=CHAPTERS.find(c=>c.id==='deliveries').steps;
 const arrived=steps.filter(s=>s.arrived).map(s=>[s.id,s.arrived]);
 assert.deepEqual(arrived.sort(),[['arrive-bambu-1','2026-11-12'],['arrive-bol-1','2026-11-12'],['arrive-elektramat-1','2026-11-09'],['arrive-ledshows-1','2026-11-09']]);
 for(const [id] of arrived)assert.ok(PRESET.includes(id),id);
 assert.ok(!PRESET.includes('arrive-pixelimperium-1'),'the pixels are still on their way');
});

test('the pixel order shows what each pixel cost, with and without shipping',async()=>{
 const {PER_PIXEL}=await import('../src/runbook/runbook.js');
 const r=v=>Math.round(v*1000)/1000;
 assert.equal(PER_PIXEL.pixelShipping.pixels,2550);
 assert.equal(PER_PIXEL.pixelShipping.total,820.47);
 assert.equal(r(PER_PIXEL.pixelShipping.each),0.322);
 assert.equal(r(PER_PIXEL.pixels.each),0.244);
 assert.equal(r(PER_PIXEL.pixelsRegulated.each),0.344);
 // Shipping split by pixel: the rows add back up to the whole order.
 const sum=['pixels','pixelsRegulated'].reduce((t,id)=>{const p=PURCHASES.find(x=>x.id===id);return t+PER_PIXEL[id].withShipping*p.qty*50;},0);
 assert.equal(Math.round(sum*100)/100,820.47);
});

test('bol.com came in part on 10 Nov and the rest on 12 Nov: the Wago gel boxes went back and four were reordered from Elektramat',async()=>{
 const {PRESET}=await import('../src/runbook/runbook.js');
 const steps=CHAPTERS.find(c=>c.id==='deliveries').steps,byId=Object.fromEntries(PURCHASES.map(p=>[p.id,p]));
 assert.equal(byId.gelbox.returned,'2026-11-10');
 const reorder=byId.gelboxReorder;
 assert.deepEqual([reorder.shop,reorder.qty,reorder.ordered,reorder.cost,reorder.expense],['elektramat',4,'2026-11-10',23.9,'business']);
 assert.ok(PRESET.includes('buy-gelboxReorder'),'the reorder was placed on 10 Nov');
 const bol=steps.find(s=>s.id==='arrive-bol-1');
 assert.equal(bol.arrived,'2026-11-12','the FM transmitter, the last part, came on 12 Nov');assert.ok(PRESET.includes(bol.id));
 assert.match(bol.tip,/FM transmitter/);assert.doesNotMatch(bol.tip,/1 pack WAGO/,'the returned pack is not awaited');
 const again=steps.find(s=>s.id==='arrive-elektramat-reorder');
 assert.deepEqual([again.due,again.arrived],['2026-11-13',undefined]);
 assert.match(steps.find(s=>s.id==='arrive-elektramat-1').tip,/^6 ×/,'the first Elektramat parcel holds only the six');
});

test('a delivery is only expected once every order in it is placed: the installation parts are not ordered yet',async()=>{
 const {PRESET}=await import('../src/runbook/runbook.js');
 const steps=CHAPTERS.find(c=>c.id==='deliveries').steps.filter(s=>s.buys);
 const placed=s=>s.buys.every(id=>PRESET.includes(id));
 const expected=steps.filter(placed).map(s=>s.id).sort(),waiting=steps.filter(s=>!placed(s)).map(s=>s.id).sort();
 assert.deepEqual(expected,['arrive-aliexpress-1','arrive-bambu-1','arrive-bol-1','arrive-elektramat-1','arrive-elektramat-reorder','arrive-kunststofshop-1','arrive-ledshows-1','arrive-pixelimperium-1','arrive-propixeler-1','arrive-audiophonics-1'].sort());
 assert.deepEqual(waiting,['arrive-aliexpress-2','arrive-bol-2','arrive-elektramat-2','arrive-ledshows-2']);
 for(const s of steps.filter(s=>!placed(s)))assert.ok(!PRESET.includes(s.id),`${s.id} has not arrived`);
});
