#!/usr/bin/env node
// Writes the show for Falcon Player from the same files the site plays:
//
//   node tools/fseq/export.mjs [--gamma 2.2] [--brightness 100]
//        [--facade-ip 192.168.1.201] [--garden-ip 192.168.1.202] [--out outputs/fpp]
//
// Out come show.fseq (every pixel, 40 frames a second), show.mp3 (the
// soundtrack, if ffmpeg is installed), co-universes.json (FPP's two DDP
// outputs), controller-ports.csv and props.csv (what to set and check on the
// controllers). docs/falcon-player.md says how to load them.
import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {resolve,relative} from 'node:path';
import {parseArgs} from 'node:util';
import {renderShow,encodeFseq,fppOutputs,portRows,propRows,DEFAULT_OPTIONS,PIXELS} from '../../src/software/fseq.js';
import {FSEQ_FPS,FSEQ_FRAMES,TOTAL_CHANNELS,SHOW_SECONDS} from '../../src/software/plan.js';
import {IPS} from '../../src/software/setup.js';

const root=new URL('../../',import.meta.url);
const {values:a}=parseArgs({options:{
 gamma:{type:'string',default:String(DEFAULT_OPTIONS.gamma)},
 brightness:{type:'string',default:String(DEFAULT_OPTIONS.brightness)},
 'facade-ip':{type:'string',default:IPS.facade},
 'garden-ip':{type:'string',default:IPS.garden},
 out:{type:'string',default:'outputs/fpp'},
 'no-audio':{type:'boolean',default:false},
}});
const gamma=Number(a.gamma),brightness=Number(a.brightness);
if(!(gamma>=1&&gamma<=3))throw new Error('--gamma takes 1 to 3');
if(!(brightness>0&&brightness<=100))throw new Error('--brightness takes 1 to 100 (percent)');
const out=resolve(a.out);mkdirSync(out,{recursive:true});
const show=p=>relative(process.cwd(),resolve(out,p));

const cues=JSON.parse(readFileSync(new URL('outputs/original-house-cues.json',root)));
const frames=renderShow(cues,{gamma,brightness});
const fseq=encodeFseq(frames,{media:'show.mp3'});
writeFileSync(resolve(out,'show.fseq'),fseq);
console.log(`${show('show.fseq')}: ${PIXELS.length} pixels, ${TOTAL_CHANNELS} channels × ${FSEQ_FRAMES} frames at ${FSEQ_FPS} fps (${(SHOW_SECONDS).toFixed(1)} s), gamma ${gamma}, brightness ${brightness}%, ${(fseq.length/1e6).toFixed(2)} MB`);

writeFileSync(resolve(out,'co-universes.json'),JSON.stringify(fppOutputs({facade:a['facade-ip'],garden:a['garden-ip']}),null,2)+'\n');
console.log(`${show('co-universes.json')}: DDP to ${a['facade-ip']} and ${a['garden-ip']}`);

const csv=rows=>[Object.keys(rows[0]).join(','),...rows.map(r=>Object.values(r).map(v=>/[",]/.test(String(v))?`"${String(v).replaceAll('"','""')}"`:v).join(','))].join('\n')+'\n';
writeFileSync(resolve(out,'controller-ports.csv'),csv(portRows()));
writeFileSync(resolve(out,'props.csv'),csv(propRows()));
console.log(`${show('controller-ports.csv')}, ${show('props.csv')}`);

// The soundtrack the site plays, as MP3 for the Pi. It was taken from the same
// video as the cues, so its second 0 is the show's frame 0.
if(!a['no-audio']){
 const src=new URL('public/media/wizards-in-winter.m4a',root).pathname,mp3=resolve(out,'show.mp3');
 const r=spawnSync('ffmpeg',['-v','error','-y','-i',src,'-map_metadata','-1','-codec:a','libmp3lame','-b:a','192k','-ar','44100',mp3],{stdio:'inherit'});
 if(r.error||r.status)console.warn('No ffmpeg: show.mp3 not written. Convert public/media/wizards-in-winter.m4a to MP3 another way, or upload the .m4a.');
 else if(existsSync(mp3))console.log(`${show('show.mp3')}: soundtrack, 192 kbit/s`);
}
