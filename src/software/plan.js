import {WIRING} from '../wiring/plan.js';
import {OWN_CHANNELS} from '../props.js';

// The software page (software.html): how the show's data gets from the detected
// cue file to the pixels. The hardware side reads the wiring plan, so the
// controllers, ports and pixel counts here are the ones that were ordered and
// wired; the conversion numbers follow from them.

// The detected cue file (outputs/original-house-cues.json): one colour state and
// one brightness per channel per video frame. Kept here as numbers so the page
// doesn't ship the 550 KB file; tests/software.test.js checks them against it.
export const CUE={frames:5569,rate:30000/1001,channels:OWN_CHANNELS.length};
export const SHOW_SECONDS=CUE.frames/CUE.rate;

// Falcon Player's sequence at 40 frames a second (25 ms a frame).
// The Baldrick 8 drives 750 pixels a port at 40 fps and our fullest port has
// under 600, so 40 fps fits every port; FSEQ frame times are whole milliseconds,
// so the video's 33.37 ms frames can't be kept exactly.
export const FSEQ_FPS=40;
export const FSEQ_FRAMES=Math.ceil(SHOW_SECONDS*FSEQ_FPS);
// The video frame an output frame shows: the one on screen at that moment.
export const cueFrameAt=k=>Math.min(CUE.frames-1,Math.floor(k/FSEQ_FPS*CUE.rate+1e-6));

// Each controller gets one block of RGB channels in the sequence, in wiring
// order: the facade controller first, then the garden one, each port's chain
// in data order. Three channels (red, green, blue) per pixel.
let next=1;
export const CONTROLLERS=WIRING.zones.map(z=>{
 const channels=z.pixels*3,start=next;next+=channels;
 let px=0;
 const ports=z.ports.map(p=>{const first=px;px+=p.pixels;return {n:p.n,name:p.name,color:p.color,pixels:p.pixels,props:p.props.length,start:start+first*3,end:start+px*3-1};});
 return {id:z.id,name:z.name,outdoor:z.outdoor,where:z.where,pixels:z.pixels,channels,start,end:start+channels-1,ports,portsFree:z.portsFree};
});
export const TOTAL_CHANNELS=next-1;
// Uncompressed sequence size; FPP's v2 files are zstd-compressed, and a show
// whose pixels mostly hold still compresses to a fraction of this.
export const FSEQ_MB=Math.round(TOTAL_CHANNELS*FSEQ_FRAMES/1e5)/10;
// E1.31 would need this many 512-channel universes (170 pixels each); DDP needs none.
export const UNIVERSES=CONTROLLERS.reduce((s,c)=>s+Math.ceil(c.pixels/170),0);
export const PLAYER=WIRING.parts.player;

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
