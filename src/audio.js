import { analyzeSamples, REFERENCE_DURATION } from './show.js';
export class AudioClock {
  constructor(){this.context=null;this.buffer=null;this.source=null;this.offset=0;this.started=0;this.playing=false;this.volume=.35;this.analysis=null;this.duration=REFERENCE_DURATION;}
  async init(){if(!this.context){this.context=new AudioContext();this.gain=this.context.createGain();this.gain.gain.value=this.volume;this.gain.connect(this.context.destination);}await this.context.resume();}
  stopSource(){if(this.source){this.source.onended=null;this.source.stop();this.source.disconnect();this.source=null;}}
  pause(){this.offset=this.time;this.playing=false;this.stopSource();}
  async play(){await this.init();if(!this.buffer)await this.demo();if(this.offset>=this.duration)this.offset=0;this.stopSource();this.source=this.context.createBufferSource();this.source.buffer=this.buffer;this.source.connect(this.gain);this.started=this.context.currentTime;this.source.onended=()=>{this.offset=this.duration;this.playing=false;};this.source.start(0,this.offset);this.playing=true;}
  seek(t){const resume=this.playing;this.pause();this.offset=Math.max(0,Math.min(t,this.duration));if(resume)this.play();}
  get time(){return this.playing?Math.min(this.duration,this.offset+this.context.currentTime-this.started):this.offset;}
  setVolume(v){this.volume=v;if(this.gain)this.gain.gain.setTargetAtTime(v,this.context.currentTime,.03);}
  async load(file,accept=()=>true){this.pause();await this.init();const buffer=await this.context.decodeAudioData(await file.arrayBuffer());if(accept())this.use(buffer);}
  use(buffer){this.buffer=buffer;this.duration=buffer.duration;this.offset=0;const mono=new Float32Array(buffer.length);for(let ch=0;ch<buffer.numberOfChannels;ch++){const data=buffer.getChannelData(ch);for(let i=0;i<mono.length;i++)mono[i]+=data[i]/buffer.numberOfChannels;}this.analysis=analyzeSamples(mono,buffer.sampleRate);}
  async demo(){this.pause();await this.init();const rate=22050,buffer=this.context.createBuffer(1,REFERENCE_DURATION*rate,rate),data=buffer.getChannelData(0),notes=[62,69,65,72,67,74,65,69];
    for(let i=0;i<data.length;i++){const t=i/rate,beat=Math.floor(t/.4),phase=t%(.4),n=notes[(beat+Math.floor(t/24))%notes.length],freq=440*2**((n-69)/12),amp=Math.min(1,t/2,(185-t)/3),bell=Math.sin(2*Math.PI*freq*t)*Math.exp(-phase*9)*.12,kick=Math.sin(2*Math.PI*(60*phase+4*(1-Math.exp(-phase*25))))*Math.exp(-phase*30)*.17,bass=Math.sin(2*Math.PI*146.83*t)*.025;data[i]=(bell+kick+bass)*amp;}
    this.use(buffer);
  }
}
