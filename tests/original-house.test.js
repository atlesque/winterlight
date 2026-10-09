import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';
import {CHANNELS,PROPS,REFERENCE} from '../src/original/layout.js';
import {prepareOriginalCues,CUE_FORMAT} from '../src/original/cues.js';

const count=prop=>CHANNELS.filter(c=>c.prop===prop).length;
const cueData=(channels,range={startFrame:0,endFrame:60})=>({format:CUE_FORMAT,source:{frameRate:[30000,1001],firstPtsSeconds:0},range,channels:Object.fromEntries(CHANNELS.map(c=>[c.id,channels[c.id]||[]]))});

test('layout has every listed prop at its stated addressing',()=>{
 assert.equal(new Set(CHANNELS.map(c=>c.id)).size,CHANNELS.length);
 assert.deepEqual(PROPS.map(p=>p.id).filter(id=>!count(id)),[]);
 for(const [prop,n] of [['upper',1],['lower',1],['windows',1],['letters',13],['wreaths',2],['canes',8],['minitrees',11],['fence',1],['peace',1],['tree',17]])assert.equal(count(prop),n,prop);
 assert.equal(CHANNELS.filter(c=>c.prop==='letters').map(c=>c.model.char).join(''),'HAPPYHOLIDAYS');
});
test('every detection region lies inside the reference still',()=>{
 for(const c of CHANNELS){
  const pts=[...(c.roi.lines||[]).flat(),...(c.roi.poly||[]),...(c.roi.box?[c.roi.box.slice(0,2),c.roi.box.slice(2)]:[]),...(c.roi.ring?[[c.roi.ring[0]-c.roi.ring[2],c.roi.ring[1]-c.roi.ring[2]],[c.roi.ring[0]+c.roi.ring[2],c.roi.ring[1]+c.roi.ring[2]]]:[])];
  assert.ok(pts.length,c.id);
  for(const [x,y] of pts)assert.ok(x>=0&&y>=0&&x<=REFERENCE.width&&y<=REFERENCE.height,`${c.id} leaves the frame`);
 }
});
test('cue frames switch exactly on video frame boundaries',()=>{
 const cues=prepareOriginalCues(cueData({'cane-1':[[10,11,1,40],[11,12,1,100]],upper:[[0,5,2,100],[5,6,3,100]]}),CHANNELS);
 const cane=CHANNELS.findIndex(c=>c.id==='cane-1'),upper=CHANNELS.findIndex(c=>c.id==='upper');
 const at=f=>cues.stateAt(f*1001/30000);
 assert.equal(at(9)[cane],0);assert.equal(at(10)[cane],1);assert.equal(at(11)[cane],1);assert.equal(at(12)[cane],0);
 const level=new Uint8Array(CHANNELS.length);
 cues.stateAt(10*1001/30000,undefined,level);assert.equal(level[cane],40);
 cues.stateAt(11*1001/30000,undefined,level);assert.equal(level[cane],100);
 cues.stateAt(-1,undefined,level);assert.equal(level.some(Boolean),false);
 assert.equal(cues.stateAt(10*1001/30000-1e-4)[cane],0);
 assert.equal(at(4)[upper],2);assert.equal(at(5)[upper],3);assert.equal(at(6)[upper],0);
 assert.equal(cues.stateAt(-1).some(Boolean),false);assert.equal(at(60).some(Boolean),false);
});
test('invalid cue runs are rejected',()=>{
 assert.throws(()=>prepareOriginalCues(cueData({'cane-1':[[5,8,1,100],[7,9,1,100]]}),CHANNELS),/Invalid run/);
 assert.throws(()=>prepareOriginalCues(cueData({'cane-1':[[5,8,2,100]]}),CHANNELS),/single colour/);
 assert.throws(()=>prepareOriginalCues(cueData({'cane-1':[[5,80,1,100]]}),CHANNELS),/Invalid run/);
 assert.throws(()=>prepareOriginalCues(cueData({'cane-1':[[5,8,1,0]]}),CHANNELS),/Invalid run/);
 assert.throws(()=>prepareOriginalCues(cueData({'cane-1':[[5,8,1]]}),CHANNELS),/Invalid run/);
 assert.throws(()=>prepareOriginalCues({...cueData({}),format:'x'},CHANNELS),/format/);
});
const stored=new URL('../outputs/original-house-cues.json',import.meta.url);
test('stored original-video cues cover the first 30 seconds of every channel',{skip:!existsSync(stored)},()=>{
 const data=JSON.parse(readFileSync(stored,'utf8')),cues=prepareOriginalCues(data,CHANNELS);
 assert.equal(data.source.sha256,'32bac17909d2b27a5d065470c52666c2f7f9d727cd721b60d14c93a0b1f27c42');
 assert.equal(cues.startFrame,0);assert.ok(cues.end>=30-1/cues.rate);
 assert.deepEqual(Object.keys(data.channels).sort(),CHANNELS.map(c=>c.id).sort());
});
