import {frameAtUs} from './timing.js';
// One audio media timeline drives the immutable source-frame table. No beat
// detection, nominal FPS conversion, or regenerated effects in hosted playback.
export class HostedAudioClock {
  constructor(media,onFrame){this.media=media;this.onFrame=onFrame;this.sequence=null;this.ready=false;this.reset();media.addEventListener('seeking',()=>this.reset());media.addEventListener('ended',()=>{this.onFrame(-1,this.audit);});}
  reset(){this.lastFrame=null;this.audit={presentedFrames:0,skippedSourceFrames:0,maxBoundaryLagUs:0};}
  async bind(sequence){this.media.pause();this.ready=false;this.sequence=sequence;this.reset();
    if(this.media.readyState<1)await new Promise((resolve,reject)=>{const done=()=>{cleanup();resolve();},fail=()=>{cleanup();reject(new Error('Hosted soundtrack could not load.'));},cleanup=()=>{this.media.removeEventListener('loadedmetadata',done);this.media.removeEventListener('error',fail);};this.media.addEventListener('loadedmetadata',done);this.media.addEventListener('error',fail);this.media.load();});
    if(Math.abs(this.media.duration-sequence.meta.durationUs/1e6)>.002)throw new Error('Soundtrack duration differs from the stored source timeline.');this.ready=true;this.media.currentTime=0;this.sample();
  }
  sample(){if(!this.ready)return;const us=Math.round(this.media.currentTime*1e6),index=frameAtUs(this.sequence,us);if(index===this.lastFrame)return;
    if(index>=0){this.audit.presentedFrames++;if(!this.media.paused&&this.lastFrame!==null&&index>this.lastFrame+1)this.audit.skippedSourceFrames+=index-this.lastFrame-1;this.audit.maxBoundaryLagUs=Math.max(this.audit.maxBoundaryLagUs,us-this.sequence.timestamps[index]);}
    this.lastFrame=index;this.onFrame(index,this.audit);
  }
  async play(){if(!this.ready)throw new Error('Wait for the soundtrack and stored frames to load.');if(this.media.ended)this.media.currentTime=0;await this.media.play();}
  pause(){this.media.pause();}
  seek(t){this.media.currentTime=Math.max(0,Math.min(t,this.duration));}
  get time(){return this.media.currentTime;}
  get duration(){return this.sequence?.meta.durationUs/1e6||0;}
  get playing(){return !this.media.paused&&!this.media.ended;}
}
