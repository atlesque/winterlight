import test from 'node:test';
import assert from 'node:assert/strict';
import {encodeTiming,decodeTiming,frameAtUs,copyFrame} from '../src/timing.js';
const meta={format:'Winterlight source frames v2',sourceSha256:'a'.repeat(64),channelMapSha256:'b'.repeat(64),channels:3150,frameCount:5,durationUs:200000};
// Uneven presentation times deliberately cannot be recovered from a nominal FPS.
const pts=new Float64Array([0,33367,66733,110000,143367]);
const rgb=new Uint8Array(5*3150);for(let f=0;f<5;f++)rgb.fill(f*50,f*3150,(f+1)*3150);
const sequence=decodeTiming(encodeTiming(meta,pts,rgb));
test('shared file preserves every source PTS and all RGB channel bytes',()=>{assert.deepEqual(sequence.timestamps,pts);assert.deepEqual(sequence.rgb,rgb);});
test('every exact boundary chooses that frame, never a nominal-FPS approximation',()=>{for(let f=0;f<pts.length;f++){assert.equal(frameAtUs(sequence,pts[f]),f);if(f)assert.equal(frameAtUs(sequence,pts[f]-1),f-1);}assert.equal(frameAtUs(sequence,200000),-1);assert.equal(frameAtUs(sequence,-1),-1);});
test('seeking and repeated sampling use identical frozen RGB data',()=>{const out=new Float32Array(3150);for(const frame of [4,1,3,0,2,1]){copyFrame(sequence,frame,out);assert.ok(out.every(x=>Math.abs(x-frame*50/255)<1e-7));}copyFrame(sequence,-1,out);assert.ok(out.every(x=>x===0));});
test('rejects incomplete, overlapping or incompatible sequence data',()=>{assert.throws(()=>decodeTiming(encodeTiming(meta,pts,rgb).subarray(0,-1)),/Truncated/);assert.throws(()=>encodeTiming(meta,[0,1,1,3,4],rgb),/strictly/);assert.throws(()=>encodeTiming({...meta,sourceSha256:''},pts,rgb),/SHA/);assert.throws(()=>decodeTiming(encodeTiming(meta,pts,rgb),3000),/dimensions/);});
