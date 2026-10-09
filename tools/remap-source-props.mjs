import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {decodeTiming,encodeTiming,verifyRgbIntegrity} from '../src/timing.js';
import {PROPS,CHANNEL_COUNT} from '../src/props.js';
import {parseMap} from '../src/show.js';
const [legacyPath,legacyMapPath,legacyMappingPath,outPath]=process.argv.slice(2);
if(!outPath)throw new Error('Usage: node tools/remap-source-props.mjs legacy.wltiming legacy-pixel-map.csv legacy-source-mapping.json output.wltiming');
const hash=data=>createHash('sha256').update(data).digest('hex');
const legacyBytes=readFileSync(legacyPath),legacyMapBytes=readFileSync(legacyMapPath);
const legacy=await verifyRgbIntegrity(decodeTiming(legacyBytes,3150));
if(legacy.meta.channelMapSha256!==hash(legacyMapBytes))throw new Error('Legacy map mismatch');
const oldProps=parseMap(legacyMapBytes.toString()),oldMapping=JSON.parse(readFileSync(legacyMappingPath,'utf8'));
if(oldMapping.rgbSha256!==legacy.meta.rgbSha256||oldMapping.sourceSha256!==legacy.meta.sourceSha256)throw new Error('Legacy sampling provenance mismatch');
const oldById=Object.fromEntries(oldProps.map(p=>[p.id,p]));
const samples=Object.fromEntries(oldMapping.models.map(m=>[m.target,m.samples960x540]));
const mapping=[];
for(const prop of PROPS){
  let ids,role;
  if(prop.id.startsWith('Pole')){
    const column=Math.floor((Number(prop.id.slice(4))-.5)*25/10);
    ids=Array.from({length:prop.count},(_,i)=>{const row=Math.floor(i*10/prop.count);return ['Matrix25x10',row*25+(row%2?24-column:column)];});
    role=`Central filmed lettering, column ${column+1}; vertical colour accents without displaying text`;
  }else{
    const sourceIds=prop.id==='StripKitchen'?['Bar1','Bar2']:prop.id==='StripWC'?['Bar3']:prop.id==='StripDoor'?['Bar4']:[prop.id];
    const pool=sourceIds.flatMap(id=>Array.from({length:oldById[id].count},(_,i)=>[id,i]));
    ids=Array.from({length:prop.count},(_,i)=>pool[Math.round(i*(pool.length-1)/(prop.count-1))]);
    role=prop.path?`Filmed roof icicles transferred to ${prop.name.toLowerCase()}`:oldMapping.models.find(m=>m.target===prop.id).source;
  }
  mapping.push({target:prop.id,source:role,pixels:prop.count,legacySamples:ids,samples960x540:ids.map(([id,i])=>samples[id][i])});
}
const offsets=mapping.flatMap(m=>m.legacySamples.map(([id,i])=>oldById[id].channelStart-1+i*3));
const rgb=new Uint8Array(legacy.meta.frameCount*CHANNEL_COUNT);
for(let frame=0;frame<legacy.meta.frameCount;frame++)for(let pixel=0;pixel<offsets.length;pixel++){
  const start=frame*3150+offsets[pixel];rgb.set(legacy.rgb.subarray(start,start+3),frame*CHANNEL_COUNT+pixel*3);
}
const extraction={...oldMapping,channels:CHANNEL_COUNT,rgbSha256:hash(rgb),method:'Observed-camera RGB samples; spatial reassignment to approved facade props, every native source frame retained',models:mapping,adaptation:{parentTimingSha256:hash(legacyBytes),parentRgbSha256:legacy.meta.rgbSha256,parentChannelMapSha256:hash(legacyMapBytes),temporalChanges:0,spatialMethod:'Nearest original RGB triplet; no colour averaging, temporal resampling or generated beat effects'}};
const map=readFileSync(new URL('../outputs/pixel-map.csv',import.meta.url));
const meta={...legacy.meta,channels:CHANNEL_COUNT,channelMapSha256:hash(map),rgbSha256:hash(rgb),rgbProvenance:extraction.method,extraction};
const bytes=encodeTiming(meta,legacy.timestamps,rgb);writeFileSync(outPath,bytes);
await verifyRgbIntegrity(decodeTiming(bytes));
writeFileSync(new URL('../outputs/source-mapping.json',import.meta.url),JSON.stringify(extraction,null,2)+'\n');
writeFileSync(new URL('../outputs/source-integrity-report.json',import.meta.url),JSON.stringify({status:'remapped-artifact-integrity-verified',frames:meta.frameCount,channels:meta.channels,durationUs:meta.durationUs,sourceSha256:meta.sourceSha256,channelMapSha256:meta.channelMapSha256,rgbSha256:meta.rgbSha256,timingSha256:hash(bytes),parentTimingSha256:hash(legacyBytes),timestampMismatches:0,nativePtsChanges:0,verification:'All timestamps and duration inherited byte-for-byte from previously source-probed artifact; all RGB triplets compared in migration tests',limitations:['Spatial adaptation is not original controller data','Browser and physical controller latency require separate checks']},null,2)+'\n');
console.log(`${meta.frameCount} native frames remapped to ${PROPS.length} props / ${CHANNEL_COUNT} channels; no timestamp changes.`);
