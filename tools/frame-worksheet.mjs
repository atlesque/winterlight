import {readFileSync,writeFileSync} from 'node:fs';
import {decodeTiming,verifyRgbIntegrity} from '../src/timing.js';
import {PROPS,CHANNEL_COUNT} from '../src/props.js';
const sequence=await verifyRgbIntegrity(decodeTiming(readFileSync(new URL('../outputs/wizards-ground-level.wltiming',import.meta.url))));
const rows=[['frame_zero_based','native_pts_ticks','media_time_us','bank_A_watts','bank_B_watts','bank_C_watts',...PROPS.map(p=>`${p.id}_peak_RGB8`)].join(',')];
for(let f=0;f<sequence.meta.frameCount;f++){
 const watts={A:0,B:0,C:0},peaks=[];
 for(const p of PROPS){let peak=0;for(let c=p.channelStart-1;c<p.channelEnd;c++){const value=sequence.rgb[f*CHANNEL_COUNT+c];watts[p.bank]+=value/255*p.wattsPerAddress/3;peak=Math.max(peak,value);}peaks.push(peak);}
 rows.push([f,sequence.meta.nativePts[f],sequence.timestamps[f],...Object.values(watts).map(w=>w.toFixed(3)),...peaks].join(','));
}
writeFileSync(new URL('../outputs/source-frame-summary.csv',import.meta.url),rows.join('\n')+'\n');
const mappings=sequence.meta.extraction.models;
writeFileSync(new URL('../outputs/cue-worksheet.csv',import.meta.url),['model,source_role,timing_basis,RGB_addresses',...mappings.map(m=>[m.target,`"${m.source.replaceAll('"','""')}"`,'Every native source PTS in source-frame-summary.csv',m.pixels].join(','))].join('\n')+'\n');
console.log(`Updated all ${sequence.meta.frameCount} frame rows and ${mappings.length} source-effect assignments.`);
