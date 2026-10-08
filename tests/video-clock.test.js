import test from 'node:test';
import assert from 'node:assert/strict';
import {SourceVideoClock} from '../src/video-clock.js';
function fixture(){
 const events={},video={paused:true,ended:false,currentTime:0,duration:.12,addEventListener:(name,fn)=>events[name]=fn,pause(){this.paused=true;},async play(){this.paused=false;},requestVideoFrameCallback(fn){this.frame=fn;return 1;},cancelVideoFrameCallback(){this.frame=null;}};
 const output=[],status=[],clock=new SourceVideoClock(video,(i,m,a)=>output.push({i,a:a&&{...a}}),s=>status.push(s));
 clock.fileHash='a'.repeat(64);
 const sequence={meta:{sourceSha256:clock.fileHash,frameCount:3,durationUs:120000},timestamps:[0,33367,80000]};
 return {video,events,output,status,clock,sequence};
}
test('video clock uses exact presented PTS, keeps coverage at end and audits dropped frames',async()=>{
 const {video,events,output,clock,sequence}=fixture();await clock.setSequence(sequence);
 video.frame(0,{mediaTime:0,presentedFrames:1,expectedDisplayTime:1});await clock.play();
 video.frame(20,{mediaTime:.08,presentedFrames:3,expectedDisplayTime:19});
 assert.equal(output.at(-1).i,2);assert.equal(clock.audit.uniqueFrames,2);assert.equal(clock.audit.skippedSourceFrames,1);assert.equal(clock.audit.missedCallbacks,1);
 events.ended();assert.equal(output.at(-1).i,-1);assert.equal(output.at(-1).a.uniqueFrames,2);
 events.seeking();assert.equal(clock.audit.uniqueFrames,0);
});
test('unknown timestamps render black and a different video cannot play the timing file',async()=>{
 const {video,output,clock,sequence}=fixture();await clock.setSequence(sequence);
 video.frame(0,{mediaTime:.02,presentedFrames:1,expectedDisplayTime:1});assert.equal(output.at(-1).i,-1);assert.equal(clock.audit.unmatchedPTS,1);
 clock.fileHash='b'.repeat(64);await clock.bind();assert.equal(clock.ready,false);assert.equal(video.paused,true);assert.equal(video.frame,null);await assert.rejects(clock.play(),/matching source/);
});
