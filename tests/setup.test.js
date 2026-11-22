import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {IPS,PORT_TABLES,OUTPUTS,PROP_RANGES,FILES} from '../src/software/setup.js';
import {CONTROLLERS} from '../src/software/plan.js';

const csv=readFileSync(new URL('../outputs/fpp/controller-ports.csv',import.meta.url),'utf8').trim().split('\n').slice(1).map(l=>l.split(','));
test('the setup page\'s port tables match the committed controller-ports.csv',()=>{
 const rows=PORT_TABLES.flatMap(t=>t.ports.map(p=>[t.name,String(p.port),p.chain,String(p.pixels),String(p.start)]));
 assert.deepEqual(rows,csv.map(r=>r.slice(0,5)));
 for(const t of PORT_TABLES)for(const p of t.ports)assert.equal((p.startPixel-1)*3+1,p.start);
});
test('the setup page\'s outputs and IPs match the committed co-universes.json',()=>{
 const u=JSON.parse(readFileSync(new URL('../outputs/fpp/co-universes.json',import.meta.url))).channelOutputs[0].universes;
 assert.deepEqual(OUTPUTS.map(o=>[o.name,o.start,o.size,o.ip]),u.map(x=>[x.description,x.startChannel,x.channelCount,x.address]));
 assert.equal(new Set(Object.values(IPS)).size,3);
});
test('every prop has its channels listed, and every file on the page exists',()=>{
 assert.equal(PROP_RANGES.length,CONTROLLERS.length);
 for(const c of PROP_RANGES)assert.ok(c.props.length>0);
 for(const f of FILES)readFileSync(new URL(`../outputs/fpp/${f.file}`,import.meta.url));
});
import {STEPS,SETUP_TICK_IDS} from '../src/software/setup.js';
test('every guide step has tasks, and every saved tick id is unique and short',()=>{
 assert.equal(new Set(STEPS.map(s=>s.id)).size,STEPS.length);
 for(const s of STEPS)assert.ok(s.tasks.length>0,s.id);
 assert.equal(new Set(SETUP_TICK_IDS).size,SETUP_TICK_IDS.length);
 for(const id of SETUP_TICK_IDS)assert.match(id,/^setup\/[a-z0-9-]+\/[a-z0-9-]+$/),assert.ok(id.length<=80);
});
