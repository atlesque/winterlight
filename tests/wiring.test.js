import test from 'node:test';
import assert from 'node:assert/strict';
import {estimate,ALL} from '../src/costs/estimate.js';
import {PSU_WATTS,PSU_LOAD,PORT_PIXELS,PORTS_PER_CONTROLLER} from '../src/costs/catalog.js';
import {WIRING} from '../src/wiring/plan.js';

const e=estimate(ALL);
test('the wiring plan wires every prop of the cost model once',()=>{
 const wired=WIRING.zones.flatMap(z=>z.ports.flatMap(p=>p.props.map(x=>x.id)));
 assert.deepEqual([...wired].sort(),[...ALL].sort());
 assert.equal(WIRING.zones.reduce((s,z)=>s+z.pixels,0),e.pixels);
});
test('ports, power supplies and injections match the cost model',()=>{
 for(const z of WIRING.zones){
  const m=e.zones[z.id];
  assert.equal(z.ports.length,m.ports,z.id);assert.ok(z.ports.length<=m.controllers*PORTS_PER_CONTROLLER);
  assert.equal(z.psus.length,m.psus,z.id);
  for(const p of z.ports){assert.ok(p.pixels<=PORT_PIXELS,p.name);assert.ok(z.psus.some(s=>s.n===p.psu));}
  for(const s of z.psus)assert.ok(s.watts<=PSU_WATTS*PSU_LOAD,`${z.id} PSU ${s.n}`);
  const inj=z.ports.reduce((s,p)=>s+p.injections.length,0),splitters=e.groups.filter(g=>g.zone===z.id).flatMap(g=>g.extras).filter(l=>l.item==='tSplitter').reduce((s,l)=>s+l.qty,0);
  assert.equal(inj,splitters,z.id);
 }
});
test('every chain leaves its box and every route ends at a bulb',()=>{
 for(const z of WIRING.zones)for(const p of z.ports){
  assert.ok(Math.hypot(...p.segments[0][0].map((v,j)=>v-z.box[j]))<.5,p.name);
  for(const seg of p.segments)assert.ok(seg.length>=2&&seg.every(pt=>pt.every(Number.isFinite)));
  for(const j of p.injections)assert.ok(j.pos&&j.path.at(-1)===j.pos);
 }
});
