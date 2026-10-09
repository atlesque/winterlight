import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {decodeTiming,encodeTiming,verifyRgbIntegrity} from '../src/timing.js';
import {BANKS,CHANNEL_COUNT} from '../src/props.js';
const [path,outDir]=process.argv.slice(2);
if(!path||!outDir)throw new Error('Usage: node tools/export-banks.mjs show.wltiming output-directory');
const raw=readFileSync(path),source=await verifyRgbIntegrity(decodeTiming(raw)),hash=x=>createHash('sha256').update(x).digest('hex');
const map=readFileSync(new URL('../outputs/pixel-map.csv',import.meta.url));
if(source.meta.channelMapSha256!==hash(map))throw new Error('Channel map does not match');
mkdirSync(outDir,{recursive:true});const banks=[];
for(const [bank,config] of Object.entries(BANKS)){
 const {channels,channelStart,channelEnd}=config,offset=channelStart-1;
 const rgb=new Uint8Array(source.meta.frameCount*channels);
 for(let f=0;f<source.meta.frameCount;f++)rgb.set(source.rgb.subarray(f*CHANNEL_COUNT+offset,f*CHANNEL_COUNT+offset+channels),f*channels);
 const meta={...source.meta,channels,bank,parentTimingSha256:hash(raw),globalChannelStart:channelStart,globalChannelEnd:channelEnd,rgbSha256:hash(rgb)};
 // Parent provenance is linked by hash; its full-map sample coordinates are not bank-local.
 delete meta.extraction;
 const file=`bank-${bank}.wltiming`;const bytes=encodeTiming(meta,source.timestamps,rgb);writeFileSync(`${outDir}/${file}`,bytes);
 const check=await verifyRgbIntegrity(decodeTiming(bytes,channels));
 for(let f=0;f<source.meta.frameCount;f++){
  if(check.timestamps[f]!==source.timestamps[f])throw new Error(`Timestamp changed at frame ${f}`);
  if(Buffer.compare(check.rgb.subarray(f*channels,(f+1)*channels),source.rgb.subarray(f*CHANNEL_COUNT+offset,f*CHANNEL_COUNT+offset+channels))!==0)throw new Error(`Bank RGB differs at frame ${f}`);
 }
 banks.push({bank,file,channels,frames:meta.frameCount,globalChannelStart:channelStart,globalChannelEnd:channelEnd,sha256:hash(bytes),timestampChanges:0,rgbByteChanges:0});
}
const report={parentTimingSha256:hash(raw),sourceSha256:source.meta.sourceSha256,channelMapSha256:source.meta.channelMapSha256,durationUs:source.meta.durationUs,banks,format:'WLT2 bank partition, not FSEQ',hardwareStatus:'No physical controller playback has been verified; player must use original PTS and shared audio clock'};
writeFileSync(`${outDir}/manifest.json`,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
