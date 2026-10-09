import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {parseMap,makeLayout} from '../src/show.js';
import {prepareCues,renderNotes,NOTE_GROUPS} from '../src/note-show.js';
const props=parseMap(readFileSync(new URL('../outputs/pixel-map.csv',import.meta.url),'utf8'));
const pixels=makeLayout(props);
const stored=JSON.parse(readFileSync(new URL('../outputs/wizards-note-cues.json',import.meta.url),'utf8'));
const cues=prepareCues(stored);
const litProps=frame=>new Set(pixels.filter(p=>frame[p.index*3]+frame[p.index*3+1]+frame[p.index*3+2]>.01).map(p=>p.prop.id));
// The stored cues name the old poles, arches and outlines, so the renderer is
// exercised on the new props through cue files that assign them to instruments.
const GROUPS={piano:['Canes','MiniTrees'],lead:['Tree'],guitar:['Letters','EaveMain'],bass:['Peace'],other:['Wreath1','Wreath2'],drums:['TreeStar','EaveGarage']};
const only=(name,events)=>prepareCues({...stored,groups:Object.fromEntries(NOTE_GROUPS.map(n=>[n,{props:GROUPS[n],events:n===name?events:[]}]))});
const busy=prepareCues({...stored,groups:Object.fromEntries(NOTE_GROUPS.map((n,g)=>[n,{props:GROUPS[n],events:Array.from({length:400},(_,k)=>[k*450+g*37,120+(k*53)%400,k%GROUPS[n].length,.4+.6*((k*7)%10)/10])}]))});

test('stored cues give every instrument its own props and use every one of them',()=>{
 assert.equal(stored.audioSha256,'8eb6d0f422eca3c1e45eb0832153fe1c79ba6a83536647efc50a768bec2330d6');
 for(const name of NOTE_GROUPS){const used=new Set(cues.groups[name].list.map(e=>e.prop));assert.equal(used.size,cues.groups[name].props.length,`${name} leaves props unused`);}
 assert.ok(Math.max(...NOTE_GROUPS.map(n=>cues.groups[n].list.at(-1).end))<185.876);
});
test('consecutive notes move round robin through the group',()=>{
 for(const name of ['piano','guitar','drums']){const seq=cues.groups[name].list.map(e=>e.prop),moves=seq.slice(1).filter((p,i)=>p!==seq[i]).length;assert.ok(moves/(seq.length-1)>.95,name);}
});
test('a note lights only its assigned prop',()=>{
 const check=(name,index,expected)=>assert.deepEqual([...litProps(renderNotes(pixels,1.05,10,only(name,[[1000,200,index,1]]),1))],[expected]);
 check('piano',1,'MiniTrees');check('lead',0,'Tree');check('guitar',0,'Letters');check('bass',0,'Peace');check('other',1,'Wreath2');check('drums',1,'EaveGarage');
});
test('notes are silent before their start and decay after release',()=>{
 const c=only('piano',[[1000,200,0,1]]),level=t=>renderNotes(pixels,t,10,c,1)[pixels.find(p=>p.prop.id==='Canes').index*3];
 assert.equal(level(.99),0);assert.ok(level(1.1)>.5);assert.ok(level(1.5)<level(1.25));assert.ok(level(3)<.01);
});
test('rendering is bounded, deterministic, seekable and black at the end',()=>{
 for(let t=0;t<186;t+=.37){const a=renderNotes(pixels,t,185.876,busy,.3);assert.ok(a.every(x=>Number.isFinite(x)&&x>=0&&x<=.300001));assert.deepEqual(a,renderNotes(pixels,t,185.876,busy,.3));}
 assert.ok(renderNotes(pixels,30,185.876,busy,.3).some(x=>x>.05),'busy cues light something');
 assert.ok(renderNotes(pixels,185.876,185.876,busy).every(x=>x===0));
});
test('malformed cue files are rejected',()=>{
 assert.throws(()=>prepareCues({format:'Winterlight note cues v1'}));
 assert.throws(()=>only('piano',[[2000,100,0,1],[1000,100,0,1]]));assert.throws(()=>only('piano',[[0,100,5,1]]));assert.throws(()=>only('piano',[[0,100,0,2]]));
 assert.throws(()=>prepareCues({...stored,groups:{...stored.groups,lead:{...stored.groups.lead,props:['Pole1']}}}));
});
