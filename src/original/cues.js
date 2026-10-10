// Per-frame states and brightness detected from the original video by
// tools/original/detect.py. The hosted soundtrack was extracted from the same
// video, so its clock is the video clock: frame = floor(t × rate).
export const CUE_FORMAT='Winterlight original-house cues v2';

export function prepareOriginalCues(data,channels){
 if(data?.format!==CUE_FORMAT)throw new Error('Unsupported original-house cue format');
 const [num,den]=data.source?.frameRate||[];
 if(!(num>0&&den>0))throw new Error('Missing frame rate');
 const {startFrame,endFrame}=data.range||{};
 if(!Number.isInteger(startFrame)||!Number.isInteger(endFrame)||startFrame<0||endFrame<=startFrame)throw new Error('Invalid frame range');
 const frames=endFrame-startFrame,count=channels.length,states=new Uint8Array(frames*count),levels=new Uint8Array(frames*count);
 channels.forEach((channel,c)=>{
  const runs=data.channels?.[channel.id];
  if(!Array.isArray(runs))throw new Error(`Missing channel ${channel.id}`);
  let last=startFrame;
  // Each run is [first frame, last frame + 1, colour, brightness in percent].
  for(const [from,to,value,percent] of runs){
   if(!Number.isInteger(from)||!Number.isInteger(to)||from<last||to<=from||to>endFrame||!(value>=1&&value<=3)||!Number.isInteger(percent)||percent<1||percent>100)throw new Error(`Invalid run in ${channel.id}`);
   if(channel.palette!=='multi'&&value!==1)throw new Error(`${channel.id} is single colour`);
   for(let f=from;f<to;f++){states[(f-startFrame)*count+c]=value;levels[(f-startFrame)*count+c]=percent;}
   last=to;
  }
 });
 const rate=num/den,firstPts=data.source.firstPtsSeconds||0;
 return {rate,firstPts,startFrame,endFrame,count,states,levels,start:firstPts+startFrame/rate,end:firstPts+endFrame/rate,
  // Small epsilon so a time exactly on a frame boundary selects that frame.
  frameAt(t){return Math.floor((t-firstPts)*rate+1e-6);},
  // Middle of a frame, so seeking there shows that frame whichever way the player rounds.
  timeOf(f){return firstPts+(f+.5)/rate;},
  // Fills out with each channel's colour and, if given, level with its brightness (0–100).
  stateAt(t,out=new Uint8Array(count),level){const f=this.frameAt(t);
   if(f<startFrame||f>=endFrame){out.fill(0);level?.fill(0);return out;}
   const i=(f-startFrame)*count;out.set(states.subarray(i,i+count));level?.set(levels.subarray(i,i+count));return out;},
 };
}
