import {zstdCompressSync,zstdDecompressSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import {OWN_CHANNELS} from '../props.js';
import {CONTROLLERS,FSEQ_FPS,FSEQ_FRAMES,TOTAL_CHANNELS,cueFrameAt} from './plan.js';
import {WIRING} from '../wiring/plan.js';
import {prepareOriginalCues} from '../original/cues.js';

// The show as Falcon Player plays it: the detected cue file turned into one
// RGB value per pixel per 25 ms frame, written as an FSEQ v2 file. Node only
// (zstd and hashing); the site imports plan.js, not this file.

// Every pixel in sequence order: the facade controller's ports, then the garden
// one's, each chain in data order, each prop's bulbs in the order src/props.js
// wires them. So pixel i owns channels 3i+1..3i+3, as on the software page.
const byId=Object.fromEntries(OWN_CHANNELS.map((c,i)=>[c.id,{...c,index:i}]));
const hex=h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16));
export const PIXELS=WIRING.zones.flatMap(z=>z.ports.flatMap(p=>p.props.flatMap(prop=>{
 const c=byId[prop.id];
 return c.bulbs.map(b=>({channel:c.index,rgb:hex(b.color),tone:b.tone}));
})));

// What the camera saw becomes what the pixels show: a bulb is lit when its
// channel is on (and, on the two-colour strips, when the channel's colour
// includes the bulb's yellow or blue); its colour is scaled by the channel's
// detected level, then by an overall brightness, and made linear for the
// LEDs with a gamma curve (the colours and levels are screen values, a
// WS2811's PWM is linear). Off is black: real pixels have no faint glow.
export const DEFAULT_OPTIONS={gamma:2.2,brightness:100};
export function lookup({gamma,brightness}){
 // One table per colour value and level: table[level*256+value] = output byte.
 const table=new Uint8Array(101*256);
 for(let l=0;l<=100;l++)for(let v=0;v<256;v++)table[l*256+v]=Math.round(255*Math.pow(v/255*l/100,gamma)*brightness/100);
 return table;
}

// Fills `out` (TOTAL_CHANNELS bytes) for one cue frame's states and levels.
export function renderFrame(states,levels,table,out=new Uint8Array(TOTAL_CHANNELS)){
 PIXELS.forEach((p,i)=>{
  const v=states[p.channel],lit=v&&(!p.tone||(v&p.tone)),row=lit?levels[p.channel]*256:0;
  out[i*3]=table[row+p.rgb[0]];out[i*3+1]=table[row+p.rgb[1]];out[i*3+2]=table[row+p.rgb[2]];
 });
 return out;
}

// All FSEQ_FRAMES frames, one Uint8Array of TOTAL_CHANNELS bytes per frame.
export function renderShow(cueData,options={}){
 const o={...DEFAULT_OPTIONS,...options},cues=prepareOriginalCues(cueData,OWN_CHANNELS),table=lookup(o);
 const frames=[];
 for(let k=0;k<FSEQ_FRAMES;k++){
  const f=cueFrameAt(k),at=f*cues.count;
  frames.push(renderFrame(cues.states.subarray(at,at+cues.count),cues.levels.subarray(at,at+cues.count),table));
 }
 return frames;
}

// FSEQ v2.0, zstd-compressed in blocks of frames, as FPP's own FSEQFile.cpp
// reads it (docs/FSEQ_Sequence_File_Format.txt in the FPP repo): a 32-byte
// header, the block index (first frame and compressed length of each block),
// no sparse ranges, then variable headers ('mf' media file, 'sp' producer),
// padded to a multiple of 4, then the blocks.
const HEADER=32,FRAMES_PER_BLOCK=30;
const varHeader=(code,text)=>{const data=Buffer.from(text+'\0','utf8'),b=Buffer.alloc(4+data.length);b.writeUInt16LE(b.length,0);b.write(code,2,'ascii');data.copy(b,4);return b;};

export function encodeFseq(frames,{stepMs=1000/FSEQ_FPS,media,producer='Winterlight tools/fseq/export.mjs',compress=true}={}){
 const channels=frames[0].length;
 if(!Number.isInteger(stepMs)||stepMs<1||stepMs>255)throw new Error('FSEQ frame times are whole milliseconds');
 const blocks=[];
 if(compress)for(let f=0;f<frames.length;f+=FRAMES_PER_BLOCK){
  const raw=Buffer.concat(frames.slice(f,f+FRAMES_PER_BLOCK));
  blocks.push({frame:f,data:zstdCompressSync(raw)});
 }
 if(blocks.length>255)throw new Error('More than 255 compression blocks');
 const vars=[...(media?[varHeader('mf',media)]:[]),varHeader('sp',producer)];
 const indexEnd=HEADER+blocks.length*8,varLen=vars.reduce((s,b)=>s+b.length,0),offset=Math.ceil((indexEnd+varLen)/4)*4;
 const head=Buffer.alloc(offset);
 head.write('PSEQ',0,'ascii');
 head.writeUInt16LE(offset,4);
 head[6]=0;head[7]=2;
 head.writeUInt16LE(indexEnd,8);
 head.writeUInt32LE(channels,10);
 head.writeUInt32LE(frames.length,14);
 head[18]=stepMs;
 head[20]=compress?1:0;
 head[21]=blocks.length;
 // A fixed id from the frames, so the same show always writes the same header.
 createHash('sha256').update(Buffer.concat(frames)).digest().copy(head,24,0,8);
 blocks.forEach((b,i)=>{head.writeUInt32LE(b.frame,HEADER+i*8);head.writeUInt32LE(b.data.length,HEADER+i*8+4);});
 let at=indexEnd;for(const v of vars){v.copy(head,at);at+=v.length;}
 return Buffer.concat([head,...(compress?blocks.map(b=>b.data):frames)]);
}

// Reads a file encodeFseq wrote (or any dense v2 file, uncompressed or zstd).
export function decodeFseq(buf){
 if(buf.toString('ascii',0,4)!=='PSEQ'||buf[7]!==2)throw new Error('Not an FSEQ v2 file');
 const offset=buf.readUInt16LE(4),channels=buf.readUInt32LE(10),count=buf.readUInt32LE(14),stepMs=buf[18],compression=buf[20]&15,nBlocks=buf[21]|((buf[20]&0xF0)<<4),ranges=buf[22];
 if(ranges)throw new Error('Sparse ranges are not supported here');
 const vars={};
 for(let at=HEADER+nBlocks*8;at+4<offset;){const len=buf.readUInt16LE(at);if(len<=4)break;vars[buf.toString('ascii',at+2,at+4)]=buf.toString('utf8',at+4,at+len).replace(/\0+$/,'');at+=len;}
 let data;
 if(compression===0)data=buf.subarray(offset);
 else if(compression===1){
  const parts=[];let pos=offset;
  for(let i=0;i<nBlocks;i++){const len=buf.readUInt32LE(HEADER+i*8+4);if(!len)continue;parts.push(zstdDecompressSync(buf.subarray(pos,pos+len)));pos+=len;}
  data=Buffer.concat(parts);
 }else throw new Error(`Compression type ${compression} is not supported here`);
 if(data.length<channels*count)throw new Error('The file is shorter than its header says');
 return {channels,count,stepMs,vars,frame:k=>data.subarray(k*channels,(k+1)*channels)};
}

// FPP's channel outputs (Input/Output Setup → Channel Outputs → E1.31 / ArtNet /
// DDP / KiNet), in the JSON its page posts to api/channel/output/universeOutputs
// and saves as config/co-universes.json. Type 5 is "DDP - One Based": each
// controller gets its own block and sees it from its channel 1.
export const DDP_ONE_BASED=5;
export function fppOutputs(addresses){
 return {channelOutputs:[{type:'universes',enabled:1,interface:'eth0',startChannel:1,channelCount:-1,
  universes:CONTROLLERS.map((c,i)=>({active:1,description:c.name,id:i+1,startChannel:c.start,channelCount:c.channels,type:DDP_ONE_BASED,universeCount:1,
   address:addresses[c.id],priority:0,monitor:1,deDuplicate:0}))}]};
}

// One row per controller port, for its own setup page: the port's pixels and
// where its block starts in the controller's own numbering (1-based).
export function portRows(){
 return CONTROLLERS.flatMap(c=>c.ports.map(p=>({controller:c.name,port:p.n,chain:p.name,pixels:p.pixels,
  localStart:p.start-c.start+1,localEnd:p.end-c.start+1,showStart:p.start,showEnd:p.end})));
}
// One row per prop: which pixels of its port it owns, to check at the test pattern.
export function propRows(){
 return WIRING.zones.flatMap((z,zi)=>z.ports.flatMap(p=>{const c=CONTROLLERS[zi],port=c.ports.find(x=>x.n===p.n);
  return p.props.map(prop=>({controller:c.name,port:p.n,prop:prop.name,id:prop.id,pixels:prop.pixels,firstPixel:prop.first+1,lastPixel:prop.first+prop.pixels,
   showStart:port.start+prop.first*3,showEnd:port.start+(prop.first+prop.pixels)*3-1}));}));
}
