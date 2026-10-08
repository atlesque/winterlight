import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {encodeTiming} from '../src/timing.js';

// No audio analysis, nominal-FPS conversion or procedural effects in this tool.
// RGB input must already contain one reviewed target frame per source frame.
const [video,rgbPath,outPath]=process.argv.slice(2);
if(!video||!rgbPath||!outPath){console.error('Usage: node tools/pack-source-frames.mjs source.mp4 reviewed-frame-major.rgb output.wltiming');process.exit(1);}
const probe=JSON.parse(execFileSync('ffprobe',['-v','error','-select_streams','v:0','-show_frames','-show_streams','-show_format','-show_entries','frame=best_effort_timestamp,duration,pkt_duration:stream=time_base,start_time,duration:format=start_time,duration','-of','json',video],{maxBuffer:64*1024*1024}));
const stream=probe.streams?.[0],frames=probe.frames;
if(!stream||!frames?.length)throw new Error('Source has no video frames');
const [num,den]=stream.time_base.split('/').map(BigInt);
const originUs=Math.round(Number(probe.format.start_time||0)*1e6);
const toUs=ticks=>Number((BigInt(ticks)*num*1000000n+den/2n)/den)-originUs;
const timestamps=frames.map((f,i)=>{if(f.best_effort_timestamp===undefined)throw new Error(`Missing native PTS on frame ${i}`);return toUs(f.best_effort_timestamp);});
const last=frames.at(-1),lastDurationTicks=last.duration??last.pkt_duration;
if(lastDurationTicks===undefined)throw new Error('Final frame duration is missing; do not invent it from average FPS');
const durationUs=toUs(BigInt(last.best_effort_timestamp)+BigInt(lastDurationTicks));
const map=readFileSync(new URL('../outputs/pixel-map.csv',import.meta.url));
const hash=data=>createHash('sha256').update(data).digest('hex');
const rgb=readFileSync(rgbPath);
const meta={format:'Winterlight source frames v2',channels:3150,frameCount:frames.length,durationUs,sourceSha256:hash(readFileSync(video)),channelMapSha256:hash(map),rgbSha256:hash(rgb),sourceFilename:video.split('/').at(-1),timeBase:stream.time_base,mediaOriginUs:originUs,nativePts:frames.map(f=>String(f.best_effort_timestamp)),rgbProvenance:'Reviewed frame-major input; fidelity requires separate source/prop review'};
writeFileSync(outPath,encodeTiming(meta,timestamps,rgb));
console.log(JSON.stringify({path:outPath,frames:frames.length,channels:3150,durationUs,sourceSha256:meta.sourceSha256,rgbSha256:meta.rgbSha256},null,2));
