import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {decodeTiming,encodeTiming,verifyRgbIntegrity} from '../src/timing.js';
const [path,outDir]=process.argv.slice(2);
if(!path||!outDir)throw new Error('Usage: node tools/export-banks.mjs show.wltiming output-directory');
const raw=readFileSync(path),source=await verifyRgbIntegrity(decodeTiming(raw)),hash=x=>createHash('sha256').update(x).digest('hex');
const map=readFileSync(new URL('../outputs/pixel-map.csv',import.meta.url));
if(source.meta.channelMapSha256!==hash(map))throw new Error('Channel map does not match');
mkdirSync(outDir,{recursive:true});const banks=[];
for(let b=0;b<3;b++){
 const rgb=new Uint8Array(source.meta.frameCount*1050);
 for(let f=0;f<source.meta.frameCount;f++)rgb.set(source.rgb.subarray(f*3150+b*1050,f*3150+(b+1)*1050),f*1050);
 const meta={...source.meta,channels:1050,bank:'ABC'[b],parentTimingSha256:hash(raw),globalChannelStart:b*1050+1,globalChannelEnd:(b+1)*1050,rgbSha256:hash(rgb)};
 const file=`bank-${meta.bank}.wltiming`;const bytes=encodeTiming(meta,source.timestamps,rgb);writeFileSync(`${outDir}/${file}`,bytes);
 const check=await verifyRgbIntegrity(decodeTiming(bytes,1050));
 for(let f=0;f<source.meta.frameCount;f++){
  if(check.timestamps[f]!==source.timestamps[f])throw new Error(`Timestamp changed at frame ${f}`);
  if(Buffer.compare(check.rgb.subarray(f*1050,(f+1)*1050),source.rgb.subarray(f*3150+b*1050,f*3150+(b+1)*1050))!==0)throw new Error(`Bank RGB differs at frame ${f}`);
 }
 banks.push({bank:meta.bank,file,channels:1050,frames:meta.frameCount,globalChannelStart:meta.globalChannelStart,globalChannelEnd:meta.globalChannelEnd,sha256:hash(bytes),timestampChanges:0,rgbByteChanges:0});
}
const report={parentTimingSha256:hash(raw),sourceSha256:source.meta.sourceSha256,durationUs:source.meta.durationUs,banks,format:'WLT2 bank partition, not FSEQ',hardwareStatus:'No physical controller playback has been verified; player must use original PTS and shared audio clock'};
writeFileSync(`${outDir}/manifest.json`,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
