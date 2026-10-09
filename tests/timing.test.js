import test from 'node:test';
import assert from 'node:assert/strict';
import {encodeTiming,decodeTiming,frameAtUs,copyFrame,sha256,verifyRgbIntegrity} from '../src/timing.js';
import {CHANNEL_COUNT} from '../src/props.js';
const meta={format:'Winterlight source frames v2',sourceSha256:'a'.repeat(64),channelMapSha256:'b'.repeat(64),rgbSha256:'c'.repeat(64),channels:CHANNEL_COUNT,frameCount:5,durationUs:200000};
// Uneven presentation times deliberately cannot be recovered from a nominal FPS.
const pts=new Float64Array([0,33367,66733,110000,143367]);
const rgb=new Uint8Array(5*CHANNEL_COUNT);for(let f=0;f<5;f++)rgb.fill(f*50,f*CHANNEL_COUNT,(f+1)*CHANNEL_COUNT);
meta.rgbSha256=await sha256(rgb);
const sequence=decodeTiming(encodeTiming(meta,pts,rgb));
test('shared file preserves every source PTS and all RGB channel bytes',()=>{assert.deepEqual(sequence.timestamps,pts);assert.deepEqual(sequence.rgb,rgb);});
test('every exact boundary chooses that frame, never a nominal-FPS approximation',()=>{for(let f=0;f<pts.length;f++){assert.equal(frameAtUs(sequence,pts[f]),f);if(f)assert.equal(frameAtUs(sequence,pts[f]-1),f-1);}assert.equal(frameAtUs(sequence,200000),-1);assert.equal(frameAtUs(sequence,-1),-1);});
test('seeking and repeated sampling use identical frozen RGB data',()=>{const out=new Float32Array(CHANNEL_COUNT);for(const frame of [4,1,3,0,2,1]){copyFrame(sequence,frame,out);assert.ok(out.every(x=>Math.abs(x-frame*50/255)<1e-7));}copyFrame(sequence,-1,out);assert.ok(out.every(x=>x===0));});
test('rejects incomplete, overlapping or incompatible sequence data',()=>{assert.throws(()=>decodeTiming(encodeTiming(meta,pts,rgb).subarray(0,-1)),/Truncated/);assert.throws(()=>encodeTiming(meta,[0,1,1,3,4],rgb),/strictly/);assert.throws(()=>encodeTiming({...meta,sourceSha256:''},pts,rgb),/SHA/);assert.throws(()=>decodeTiming(encodeTiming(meta,pts,rgb),CHANNEL_COUNT+1),/dimensions/);});

test('payload integrity detects a one-byte change without accepting a truncated substitute',async()=>{await verifyRgbIntegrity(sequence);const corrupt=decodeTiming(encodeTiming(meta,pts,rgb));corrupt.rgb[corrupt.rgb.length-1]^=1;await assert.rejects(verifyRgbIntegrity(corrupt),/checksum mismatch/);assert.throws(()=>encodeTiming({...meta,rgbSha256:undefined},pts,rgb),/RGB payload SHA/);});
