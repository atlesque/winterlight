import {frameAtUs,sha256} from './timing.js';
export class SourceVideoClock {
  constructor(video,onFrame,onStatus){this.video=video;this.onFrame=onFrame;this.onStatus=onStatus;this.sequence=null;this.fileHash=null;this.ready=false;this.callback=null;this.url=null;this.generation=0;this.resetAudit();
    video.addEventListener('seeking',()=>this.resetAudit());
    video.addEventListener('ended',()=>onFrame(-1,{mediaTime:video.duration},this.audit));
    video.addEventListener('error',()=>this.fail('The browser cannot decode this source video.'));
  }
  resetAudit(){this.lastFrame=null;this.lastPresented=null;this.seen=new Uint8Array(this.sequence?.meta.frameCount||0);this.audit={uniqueFrames:0,callbacks:0,skippedSourceFrames:0,missedCallbacks:0,unmatchedPTS:0,maxTimestampErrorUs:0,lateCallbacks:0};}
  fail(message){this.ready=false;this.video.pause();if(this.callback!==null){this.video.cancelVideoFrameCallback(this.callback);this.callback=null;}this.onStatus(message);}
  async load(file){const generation=++this.generation;this.ready=false;this.fileHash=null;this.video.pause();if(this.url)URL.revokeObjectURL(this.url);this.url=URL.createObjectURL(file);this.video.src=this.url;this.video.load();this.onStatus('Checking source-video identity…');const hash=await sha256(file);if(generation!==this.generation)return;this.fileHash=hash;await this.bind();}
  async setSequence(sequence){this.sequence=sequence;this.ready=false;this.video.pause();await this.bind();}
  async bind(){if(!this.sequence||!this.fileHash){this.onStatus('Load both the source video and its timing file.');return;}
    if(this.fileHash!==this.sequence.meta.sourceSha256){this.fail('This timing file belongs to a different video. The edit must match byte-for-byte.');return;}
    if(!this.video.requestVideoFrameCallback){this.fail('This browser lacks per-video-frame callbacks; exact source-frame playback is unavailable.');return;}
    this.ready=true;this.resetAudit();this.onStatus(`Source verified · ${this.sequence.meta.frameCount.toLocaleString()} frames. Playback audit will report any skipped or unmatched frames.`);this.arm();this.video.currentTime=0;
  }
  arm(){if(this.callback!==null)this.video.cancelVideoFrameCallback(this.callback);
    this.callback=this.video.requestVideoFrameCallback((now,metadata)=>{
      this.callback=null;if(!this.ready)return;
      // microsecond rounding removes only representation noise; no FPS snapping.
      const us=Math.round(metadata.mediaTime*1e6),index=frameAtUs(this.sequence,us);
      const error=index<0?Infinity:Math.abs(us-this.sequence.timestamps[index]);
      this.audit.callbacks++;if(index>=0&&error<=1&&!this.seen[index]){this.seen[index]=1;this.audit.uniqueFrames++;}
      if(error>1)this.audit.unmatchedPTS++;
      this.audit.maxTimestampErrorUs=Math.max(this.audit.maxTimestampErrorUs,Number.isFinite(error)?error:0);
      if(!this.video.paused&&this.lastFrame!==null&&index>this.lastFrame+1)this.audit.skippedSourceFrames+=index-this.lastFrame-1;
      if(this.lastPresented!==null)this.audit.missedCallbacks+=Math.max(0,metadata.presentedFrames-this.lastPresented-1);
      if(now>metadata.expectedDisplayTime)this.audit.lateCallbacks++;
      this.lastFrame=index;this.lastPresented=metadata.presentedFrames;
      // Do not claim alignment or display a guessed earlier frame on unknown PTS.
      this.onFrame(error<=1?index:-1,metadata,this.audit);this.arm();
    });
  }
  async play(){if(!this.ready)throw new Error('A matching source video and timing file are required.');if(this.video.ended)this.video.currentTime=0;await this.video.play();}
  pause(){this.video.pause();}
  seek(t){if(!this.ready)return;this.video.currentTime=Math.max(0,Math.min(t,this.video.duration||this.sequence.meta.durationUs/1e6));}
  get time(){return this.video.currentTime;}
  get duration(){return this.sequence?.meta.durationUs/1e6||0;}
  get playing(){return !this.video.paused&&!this.video.ended;}
}
