import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {PIXELS,renderShow,renderFrame,lookup,encodeFseq,decodeFseq,fppOutputs,portRows,propRows,DDP_ONE_BASED} from '../src/software/fseq.js';
import {CONTROLLERS,TOTAL_CHANNELS,FSEQ_FRAMES,FSEQ_FPS,cueFrameAt} from '../src/software/plan.js';
import {WIRING} from '../src/wiring/plan.js';
import {OWN_CHANNELS} from '../src/props.js';
import {prepareOriginalCues} from '../src/original/cues.js';

const cueData=JSON.parse(readFileSync(new URL('../outputs/original-house-cues.json',import.meta.url)));
const cues=prepareOriginalCues(cueData,OWN_CHANNELS);
const show=renderShow(cueData);

test('every wired pixel is in the sequence once, in the wiring plan\'s order',()=>{
 assert.equal(PIXELS.length,WIRING.pixels);
 assert.equal(PIXELS.length*3,TOTAL_CHANNELS);
 // Each port's block holds exactly its props' bulbs, in order.
 let i=0;
 for(const z of WIRING.zones)for(const p of z.ports)for(const prop of p.props){
  const c=OWN_CHANNELS.findIndex(x=>x.id===prop.id);
  for(let k=0;k<prop.pixels;k++,i++)assert.equal(PIXELS[i].channel,c,`${prop.id} pixel ${k}`);
 }
});

test('a lit pixel shows its bulb colour at the channel\'s level; off is black',()=>{
 const states=new Uint8Array(OWN_CHANNELS.length),levels=new Uint8Array(OWN_CHANNELS.length).fill(100),flat=lookup({gamma:1,brightness:100});
 assert.ok(renderFrame(states,levels,flat).every(v=>v===0));
 states.fill(1);
 const yellow=renderFrame(states,levels,flat);
 PIXELS.forEach((p,i)=>{
  const expect=p.tone===2?[0,0,0]:p.rgb;
  assert.deepEqual([...yellow.subarray(i*3,i*3+3)],expect);
 });
 // Both colours on the two-colour strips, at half level and half brightness.
 states.fill(3);levels.fill(50);
 const half=renderFrame(states,levels,lookup({gamma:1,brightness:50}));
 PIXELS.forEach((p,i)=>assert.equal(half[i*3],Math.round(p.rgb[0]/4)));
 // The gamma curve keeps full colours and darkens the middle.
 const g=lookup({gamma:2.2,brightness:100});
 assert.equal(g[100*256+255],255);assert.equal(g[100*256],0);assert.ok(g[50*256+255]<64);
});

test('each output frame shows the cue frame on screen at that moment',()=>{
 assert.equal(show.length,FSEQ_FRAMES);
 const table=lookup({gamma:2.2,brightness:100});
 for(const k of [0,1,40,1234,4000,FSEQ_FRAMES-1]){
  const t=k/FSEQ_FPS,states=cues.stateAt(t),levels=new Uint8Array(cues.count);cues.stateAt(t,states,levels);
  assert.equal(cues.frameAt(t),cueFrameAt(k));
  assert.deepEqual(show[k],renderFrame(states,levels,table),`frame ${k}`);
 }
 // The show isn't dark: most frames light something.
 assert.ok(show.filter(f=>f.some(v=>v)).length>FSEQ_FRAMES*.8);
});

test('the FSEQ file reads back frame for frame',()=>{
 const frames=show.slice(0,100),file=encodeFseq(frames,{media:'show.mp3'}),back=decodeFseq(file);
 assert.equal(file.toString('ascii',0,4),'PSEQ');
 assert.equal(file[7],2);assert.equal(file[20]&15,1,'zstd');
 assert.equal(file.readUInt16LE(4)%4,0,'channel data starts on a multiple of 4');
 assert.deepEqual({channels:back.channels,count:back.count,stepMs:back.stepMs},{channels:TOTAL_CHANNELS,count:100,stepMs:25});
 assert.equal(back.vars.mf,'show.mp3');
 for(let k=0;k<100;k++)assert.deepEqual(new Uint8Array(back.frame(k)),frames[k]);
 // Uncompressed works the same.
 const raw=decodeFseq(encodeFseq(frames,{compress:false}));
 assert.deepEqual(new Uint8Array(raw.frame(99)),frames[99]);
});

test('the committed show.fseq is the current export',()=>{
 const file=readFileSync(new URL('../outputs/fpp/show.fseq',import.meta.url)),back=decodeFseq(file);
 assert.equal(back.channels,TOTAL_CHANNELS);assert.equal(back.count,FSEQ_FRAMES);assert.equal(back.stepMs,1000/FSEQ_FPS);
 assert.equal(back.vars.mf,'show.mp3');
 for(let k=0;k<FSEQ_FRAMES;k++)if(!Buffer.from(show[k]).equals(back.frame(k)))assert.fail(`frame ${k} differs: run node tools/fseq/export.mjs`);
});

test('Falcon Player sends each controller its own block over DDP',()=>{
 const json=fppOutputs({facade:'10.0.0.1',garden:'10.0.0.2'}),u=json.channelOutputs[0].universes;
 assert.equal(json.channelOutputs[0].type,'universes');
 assert.deepEqual(u.map(x=>[x.address,x.startChannel,x.channelCount,x.type]),CONTROLLERS.map((c,i)=>[`10.0.0.${i+1}`,c.start,c.channels,DDP_ONE_BASED]));
 assert.equal(u.reduce((s,x)=>s+x.channelCount,0),TOTAL_CHANNELS);
 const committed=JSON.parse(readFileSync(new URL('../outputs/fpp/co-universes.json',import.meta.url)));
 assert.deepEqual(committed.channelOutputs[0].universes.map(x=>[x.startChannel,x.channelCount]),u.map(x=>[x.startChannel,x.channelCount]));
});

test('port and prop tables start each controller at its channel 1',()=>{
 const ports=portRows();
 for(const c of CONTROLLERS){const rows=ports.filter(r=>r.controller===c.name);
  assert.equal(rows[0].localStart,1);assert.equal(rows.at(-1).localEnd,c.channels);
  rows.forEach((r,i)=>{if(i)assert.equal(r.localStart,rows[i-1].localEnd+1);assert.equal(r.localEnd-r.localStart+1,r.pixels*3);});}
 const props=propRows();
 assert.equal(props.length,OWN_CHANNELS.length);
 assert.equal(props.reduce((s,p)=>s+p.pixels,0),WIRING.pixels);
 for(const p of props)assert.equal(p.showEnd-p.showStart+1,p.pixels*3);
});
