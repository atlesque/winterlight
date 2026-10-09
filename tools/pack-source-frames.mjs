import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {probeSourceFrames} from './source-frames.mjs';
import {encodeTiming} from '../src/timing.js';

// No audio analysis, nominal-FPS conversion or procedural effects in this tool.
// RGB input must already contain one reviewed target frame per source frame.
const [video,rgbPath,outPath,provenancePath]=process.argv.slice(2);
if(!video||!rgbPath||!outPath){console.error('Usage: node tools/pack-source-frames.mjs source.mp4 reviewed-frame-major.rgb output.wltiming [mapping.json]');process.exit(1);}
const source=probeSourceFrames(video);
const {timestamps,durationUs}=source;
const map=readFileSync(new URL('../outputs/pixel-map.csv',import.meta.url));
const hash=data=>createHash('sha256').update(data).digest('hex');
const rgb=readFileSync(rgbPath);
const meta={format:'Winterlight source frames v2',channels:3150,frameCount:timestamps.length,durationUs,sourceSha256:hash(readFileSync(video)),channelMapSha256:hash(map),rgbSha256:hash(rgb),sourceFilename:video.split('/').at(-1),videoEndUs:source.videoEndUs,timeBase:source.timeBase,mediaOriginUs:source.mediaOriginUs,nativePts:source.nativePts,rgbProvenance:'Reviewed frame-major input; fidelity requires separate source/prop review'};
if(provenancePath){const provenance=JSON.parse(readFileSync(provenancePath,'utf8'));if(provenance.sourceSha256!==meta.sourceSha256||provenance.rgbSha256!==meta.rgbSha256||provenance.frames!==meta.frameCount)throw new Error('Extraction provenance does not match RGB/source');meta.extraction=provenance;meta.rgbProvenance=provenance.method;}
writeFileSync(outPath,encodeTiming(meta,timestamps,rgb));
console.log(JSON.stringify({path:outPath,frames:timestamps.length,channels:3150,durationUs,sourceSha256:meta.sourceSha256,rgbSha256:meta.rgbSha256},null,2));
