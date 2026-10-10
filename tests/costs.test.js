import test from 'node:test';
import assert from 'node:assert/strict';
import {OWN_CHANNELS} from '../src/props.js';
import {estimate,ALL,PROP_LIST} from '../src/costs/estimate.js';

test('the full show prices every prop with its pixels from the model',()=>{
 const e=estimate(ALL);
 assert.equal(PROP_LIST.length,OWN_CHANNELS.length);
 assert.equal(e.pixels,OWN_CHANNELS.reduce((n,c)=>n+c.bulbs.length,0));
 assert.equal(e.groups.reduce((n,g)=>n+g.count,0),OWN_CHANNELS.length);
 const sum=e.groups.reduce((s,g)=>s+g.total,0)+e.infra.reduce((s,l)=>s+l.cost,0)+e.contingency;
 assert.ok(Math.abs(sum-e.total)<.05);
 assert.ok(Math.abs(e.categories.reduce((s,c)=>s+c.cost,0)-e.total)<.05,'breakdown adds up to the total');
});

test('removing props lowers the total and drops infrastructure no longer needed',()=>{
 const full=estimate(ALL),noTree=new Set([...ALL].filter(id=>!id.startsWith('tree')));
 const less=estimate(noTree);
 assert.ok(less.total<full.total);
 assert.equal(less.groups.find(g=>g.id==='tree').total,0);
 const facadeOnly=new Set(PROP_LIST.filter(p=>['upper','lower','windows','letters','wreaths','peace'].includes(p.group)).map(p=>p.id));
 assert.deepEqual(Object.keys(estimate(facadeOnly).zones),['facade']);
 assert.equal(estimate(new Set()).total,0);
});

test('power supplies and controllers cover the selected pixels',()=>{
 const e=estimate(ALL);
 for(const z of Object.values(e.zones)){assert.ok(z.psus*348*.8>=z.pixels*.3);assert.ok(z.controllers*8>=z.ports);}
});
