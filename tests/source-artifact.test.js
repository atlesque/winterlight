import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {decodeTiming,frameAtUs,verifyRgbIntegrity,sha256} from '../src/timing.js';
import {BANKS,CHANNEL_COUNT,PROPS} from '../src/props.js';
const parent=decodeTiming(readFileSync(new URL('../outputs/wizards-ground-level.wltiming',import.meta.url)));
test('actual source artifact retains all 5569 exact frame boundaries and its audio tail',async()=>{
 await verifyRgbIntegrity(parent);assert.equal(parent.meta.frameCount,5569);assert.equal(parent.meta.timeBase,'1/30000');assert.equal(parent.meta.durationUs,185875737);assert.equal(parent.meta.videoEndUs,185818967);
 for(let i=0;i<5569;i++){assert.equal(frameAtUs(parent,parent.timestamps[i]),i);assert.equal(parent.timestamps[i],Number((BigInt(parent.meta.nativePts[i])*1000000n+15000n)/30000n));}
 assert.equal(frameAtUs(parent,185850000),5568);assert.equal(frameAtUs(parent,185875737),-1);
});
test('all controller bank frames recombine to the exact simulator bytes without timestamp changes',async()=>{
 for(const [name,config] of Object.entries(BANKS)){
  const channels=config.channels,offset=config.channelStart-1;
  const bank=decodeTiming(readFileSync(new URL(`../outputs/controller-banks/bank-${name}.wltiming`,import.meta.url)),channels);await verifyRgbIntegrity(bank);assert.deepEqual(bank.timestamps,parent.timestamps);
  for(let f=0;f<5569;f++)assert.deepEqual(bank.rgb.subarray(f*channels,(f+1)*channels),parent.rgb.subarray(f*CHANNEL_COUNT+offset,f*CHANNEL_COUNT+offset+channels));
 }
});
test('actual artifact uses the approved map and every new prop has spatial provenance',async()=>{
 const map=readFileSync(new URL('../outputs/pixel-map.csv',import.meta.url));
 assert.equal(parent.meta.channelMapSha256,await sha256(map));assert.equal(parent.meta.channels,CHANNEL_COUNT);
 assert.deepEqual(parent.meta.extraction.models.map(m=>[m.target,m.pixels]),PROPS.map(p=>[p.id,p.count]));
 assert.equal(parent.meta.extraction.adaptation.temporalChanges,0);
 for(const m of parent.meta.extraction.models){assert.equal(m.samples960x540.length,m.pixels);assert.equal(m.legacySamples.length,m.pixels);}
});
