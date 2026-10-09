import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {decodeTiming,frameAtUs,verifyRgbIntegrity,sha256} from '../src/timing.js';
// The extracted show was made for the old facade props (poles, arches, stars and
// outlines), so it is checked against that layout's own channel map.
const legacyMap=readFileSync(new URL('../outputs/legacy-facade/pixel-map.csv',import.meta.url));
const LEGACY=legacyMap.toString().trim().split(/\r?\n/).slice(1).map(line=>{const [id,count,start,end,bank]=line.split(',');return {id,count:+count,start:+start,end:+end,bank};});
const CHANNEL_COUNT=LEGACY.at(-1).end;
const BANKS=Object.fromEntries(['A','B','C'].map(bank=>{const rows=LEGACY.filter(p=>p.bank===bank);return [bank,{channelStart:rows[0].start,channels:rows.at(-1).end-rows[0].start+1}];}));
const parent=decodeTiming(readFileSync(new URL('../outputs/wizards-ground-level.wltiming',import.meta.url)),CHANNEL_COUNT);
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
test('actual artifact uses the old facade map and every old prop has spatial provenance',async()=>{
 assert.equal(parent.meta.channelMapSha256,await sha256(legacyMap));assert.equal(parent.meta.channels,CHANNEL_COUNT);
 assert.deepEqual(parent.meta.extraction.models.map(m=>[m.target,m.pixels]),LEGACY.map(p=>[p.id,p.count]));
 assert.equal(parent.meta.extraction.adaptation.temporalChanges,0);
 for(const m of parent.meta.extraction.models){assert.equal(m.samples960x540.length,m.pixels);assert.equal(m.legacySamples.length,m.pixels);}
});
