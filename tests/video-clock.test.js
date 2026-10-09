import test from 'node:test';
import assert from 'node:assert/strict';
import {matchesSource,SOURCE_SECONDS} from '../src/original/video-clock.js';

test('only a video of the original length is treated as the source cut',()=>{
 assert.equal(matchesSource(SOURCE_SECONDS),true);
 assert.equal(matchesSource(185.875011),true);
 assert.equal(matchesSource(183),false);
 assert.equal(matchesSource(NaN),false);
});
