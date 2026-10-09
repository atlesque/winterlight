import test from 'node:test';
import assert from 'node:assert/strict';
import {HostedAudioClock} from '../src/hosted-clock.js';
function fixture(duration=.2){const events={},frames=[],media={duration,currentTime:0,readyState:4,paused:true,ended:false,addEventListener:(e,fn)=>events[e]=fn,pause(){this.paused=true;},async play(){this.paused=false;}};const clock=new HostedAudioClock(media,(i,audit)=>frames.push({i,...audit}));return {media,events,frames,clock};}
const sequence={meta:{durationUs:200000},timestamps:[0,33367,66733,110000,143367]};
test('hosted soundtrack follows the exact stored PTS through playback and seeks',async()=>{const {media,events,frames,clock}=fixture();await clock.bind(sequence);assert.equal(frames.at(-1).i,0);await clock.play();media.currentTime=.067;clock.sample();assert.equal(frames.at(-1).i,2);assert.equal(clock.audit.skippedSourceFrames,1);media.paused=true;clock.seek(.111);events.seeking();clock.sample();assert.equal(frames.at(-1).i,3);assert.equal(clock.audit.skippedSourceFrames,0);events.ended();assert.equal(frames.at(-1).i,-1);});
test('an incompatible soundtrack cannot enable playback',async()=>{const {clock}=fixture(180);await assert.rejects(clock.bind(sequence),/duration differs/);assert.equal(clock.ready,false);await assert.rejects(clock.play(),/Wait for/);});
