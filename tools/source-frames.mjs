import {execFileSync} from 'node:child_process';
// Preserve native PTS. The browser alignment of media origin remains a runtime gate.
export function probeSourceFrames(video){
 const probe=JSON.parse(execFileSync('ffprobe',['-v','error','-select_streams','v:0','-show_frames','-show_streams','-show_format','-show_entries','frame=best_effort_timestamp,duration,pkt_duration:stream=time_base,start_time,duration:format=start_time,duration','-of','json',video],{maxBuffer:64*1024*1024}));
 const stream=probe.streams?.[0],frames=probe.frames;
 if(!stream||!frames?.length)throw new Error('Source has no video frames');
 const [num,den]=stream.time_base.split('/').map(BigInt);
 const originUs=Math.round(Number(probe.format.start_time||0)*1e6);
 const toUs=ticks=>Number((BigInt(ticks)*num*1000000n+den/2n)/den)-originUs;
 const timestamps=frames.map((f,i)=>{if(f.best_effort_timestamp===undefined)throw new Error(`Missing native PTS on frame ${i}`);return toUs(f.best_effort_timestamp);});
 const last=frames.at(-1),lastDurationTicks=last.duration??last.pkt_duration;
 if(lastDurationTicks===undefined)throw new Error('Final frame duration is missing; do not invent it from average FPS');
 return {timestamps,durationUs:toUs(BigInt(last.best_effort_timestamp)+BigInt(lastDurationTicks)),timeBase:stream.time_base,mediaOriginUs:originUs,nativePts:frames.map(f=>String(f.best_effort_timestamp))};
}
