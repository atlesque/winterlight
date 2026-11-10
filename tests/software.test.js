import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {CUE,CONTROLLERS,TOTAL_CHANNELS,FSEQ_FRAMES,FSEQ_FPS,cueFrameAt} from '../src/software/plan.js';
import {WIRING} from '../src/wiring/plan.js';
import {CUE_FORMAT} from '../src/original/cues.js';

const cues=JSON.parse(readFileSync(new URL('../outputs/original-house-cues.json',import.meta.url)));
test('the software page describes the cue file as it is',()=>{
 assert.equal(cues.format,CUE_FORMAT);
 assert.equal(cues.range.endFrame-cues.range.startFrame,CUE.frames);
 assert.equal(cues.source.frameRate[0]/cues.source.frameRate[1],CUE.rate);
 assert.equal(Object.keys(cues.channels).length,CUE.channels);
});
test('every pixel gets three channels, controller after controller, with no gaps',()=>{
 assert.equal(TOTAL_CHANNELS,WIRING.pixels*3);
 let next=1;
 for(const c of CONTROLLERS){
  assert.equal(c.start,next);
  for(const p of c.ports){assert.equal(p.start,next);assert.equal(p.end-p.start+1,p.pixels*3);next=p.end+1;}
  assert.equal(c.end,next-1);
 }
});
test('resampling to the sequence rate keeps the show in time',()=>{
 assert.equal(cueFrameAt(0),0);
 assert.equal(cueFrameAt(FSEQ_FRAMES-1),CUE.frames-1);
 // An output frame never shows a video frame more than one output frame late.
 for(let k=0;k<FSEQ_FRAMES;k+=97){const t=k/FSEQ_FPS,f=cueFrameAt(k);assert.ok(f/CUE.rate<=t+1e-9&&t-f/CUE.rate<1/CUE.rate);}
});
