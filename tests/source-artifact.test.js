import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {decodeTiming,frameAtUs,verifyRgbIntegrity} from '../src/timing.js';
const parent=decodeTiming(readFileSync(new URL('../outputs/wizards-ground-level.wltiming',import.meta.url)));
test('actual source artifact retains all 5569 exact frame boundaries and its audio tail',async()=>{
 await verifyRgbIntegrity(parent);assert.equal(parent.meta.frameCount,5569);assert.equal(parent.meta.timeBase,'1/30000');assert.equal(parent.meta.durationUs,185875737);assert.equal(parent.meta.videoEndUs,185818967);
 for(let i=0;i<5569;i++){assert.equal(frameAtUs(parent,parent.timestamps[i]),i);assert.equal(parent.timestamps[i],Number((BigInt(parent.meta.nativePts[i])*1000000n+15000n)/30000n));}
 assert.equal(frameAtUs(parent,185850000),5568);assert.equal(frameAtUs(parent,185875737),-1);
});
test('all controller bank frames recombine to the exact simulator bytes without timestamp changes',async()=>{
 for(let b=0;b<3;b++){
  const bank=decodeTiming(readFileSync(new URL(`../outputs/controller-banks/bank-${'ABC'[b]}.wltiming`,import.meta.url)),1050);await verifyRgbIntegrity(bank);assert.deepEqual(bank.timestamps,parent.timestamps);
  for(let f=0;f<5569;f++)assert.deepEqual(bank.rgb.subarray(f*1050,(f+1)*1050),parent.rgb.subarray(f*3150+b*1050,f*3150+(b+1)*1050));
 }
});
