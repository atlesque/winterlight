import test from 'node:test';
import assert from 'node:assert/strict';
import {driftCorrection,MAX_DRIFT} from '../src/original/youtube-sync.js';

test('the soundtrack only moves when it drifts past the limit from the video',()=>{
 assert.equal(driftCorrection(10.05,10,0),0);
 assert.equal(driftCorrection(10-MAX_DRIFT*.9,10,0),0);
 assert.ok(Math.abs(driftCorrection(10.5,10,0)-.5)<1e-9);
 assert.ok(Math.abs(driftCorrection(9.7,10,0)+.3)<1e-9);
 assert.ok(Math.abs(driftCorrection(12.5,10,2)-.5)<1e-9);
 assert.equal(driftCorrection(NaN,10),0);
});
