import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {decodeTiming,verifyRgbIntegrity} from '../src/timing.js';
import {probeSourceFrames} from './source-frames.mjs';
const [video,timingPath,reportPath]=process.argv.slice(2);
if(!video||!timingPath){console.error('Usage: node tools/verify-source-frames.mjs source.mp4 output.wltiming [report.json]');process.exit(1);}
const hash=data=>createHash('sha256').update(data).digest('hex');
try {
 const sequence=await verifyRgbIntegrity(decodeTiming(readFileSync(timingPath))),meta=sequence.meta;
 if(meta.sourceSha256!==hash(readFileSync(video)))throw new Error('Source video identity does not match');
 if(meta.channelMapSha256!==hash(readFileSync(new URL('../outputs/pixel-map.csv',import.meta.url))))throw new Error('Channel map identity does not match');
 const source=probeSourceFrames(video);
 if(meta.frameCount!==source.timestamps.length)throw new Error('Source frame count differs');
 if(meta.timeBase!==source.timeBase||meta.mediaOriginUs!==source.mediaOriginUs)throw new Error('Native time base or media origin differs');
 if(meta.durationUs!==source.durationUs)throw new Error('Final source frame duration differs');
 for(let i=0;i<meta.frameCount;i++){
  if(meta.nativePts?.[i]!==source.nativePts[i])throw new Error(`Native PTS differs at frame ${i}`);
  if(sequence.timestamps[i]!==source.timestamps[i])throw new Error(`Playback PTS differs at frame ${i}`);
 }
 const report={status:'artifact-integrity-verified',frames:meta.frameCount,channels:meta.channels,durationUs:meta.durationUs,sourceSha256:meta.sourceSha256,rgbSha256:meta.rgbSha256,timingSha256:hash(readFileSync(timingPath)),timestampMismatches:0,limitations:['Does not establish fidelity of light states to source images','Does not establish browser compositor, audio-device or physical-controller alignment']};
 if(reportPath)writeFileSync(reportPath,JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify(report,null,2));
}catch(error){console.error(`Verification failed: ${error.message}`);process.exit(1);}
