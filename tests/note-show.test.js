import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {parseMap,makeLayout} from '../src/show.js';
import {prepareCues,renderNotes,NOTE_GROUPS} from '../src/note-show.js';
const props=parseMap(readFileSync(new URL('../outputs/pixel-map.csv',import.meta.url),'utf8'));
const pixels=makeLayout(props);
const stored=JSON.parse(readFileSync(new URL('../outputs/wizards-note-cues.json',import.meta.url),'utf8'));
const cues=prepareCues(stored);
const lit=(frame,prefix)=>pixels.some(p=>p.prop.id.startsWith(prefix)&&frame[p.index*3]+frame[p.index*3+1]+frame[p.index*3+2]>.01);
const cue=(groups)=>prepareCues({format:'Winterlight note cues v1',offsetMs:0,groups:Object.fromEntries(NOTE_GROUPS.map(n=>[n,groups[n]||[]]))});

test('stored note cues cover every instrument group and the soundtrack',()=>{
 assert.equal(stored.audioSha256,'8eb6d0f422eca3c1e45eb0832153fe1c79ba6a83536647efc50a768bec2330d6');
 for(const name of NOTE_GROUPS)assert.ok(cues.groups[name].list.length>0,name);
 const last=Math.max(...NOTE_GROUPS.map(n=>cues.groups[n].list.at(-1).end));assert.ok(last<185.876);
});
test('each instrument lights only its own prop group',()=>{
 const one=(group,event,prefix)=>{const frame=renderNotes(pixels,1.05,10,cue({[group]:[event]}),1);assert.ok(lit(frame,prefix),group);
  for(const other of ['Pole','Arch','Star','StripWC','StripKitchen','StripDoor'])if(!prefix.startsWith(other)&&!(prefix==='StripWC'&&other==='StripKitchen'))assert.ok(!lit(frame,other),`${group} lit ${other}`);};
 one('poles',[1000,200,3,1],'Pole4');one('arches',[1000,200,2,1],'Arch3');one('windows',[1000,200,0,1],'StripWC');one('stars',[1000,200,1,1],'Star2');one('door',[1000,10,0,1],'StripDoor');
});
test('notes are silent before their start and decay after release',()=>{
 const c=cue({poles:[[1000,200,0,1]]}),level=t=>renderNotes(pixels,t,10,c,1)[pixels.find(p=>p.prop.id==='Pole1').index*3];
 assert.equal(level(.99),0);assert.ok(level(1.1)>.5);assert.ok(level(1.5)<level(1.25));assert.ok(level(3)<.01);
});
test('rendering is bounded, deterministic, seekable and black at the end',()=>{
 for(let t=0;t<186;t+=.37){const a=renderNotes(pixels,t,185.876,cues,.3);assert.ok(a.every(x=>Number.isFinite(x)&&x>=0&&x<=.300001));assert.deepEqual(a,renderNotes(pixels,t,185.876,cues,.3));}
 assert.ok(renderNotes(pixels,185.876,185.876,cues).every(x=>x===0));
});
test('malformed cue files are rejected',()=>{
 assert.throws(()=>prepareCues({format:'other'}));assert.throws(()=>cue({poles:[[2000,100,0,1],[1000,100,0,1]]}));assert.throws(()=>cue({poles:[[0,100,0,2]]}));
});
