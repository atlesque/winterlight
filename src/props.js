import {CHANNELS,COLORS} from './original/layout.js';
import {HOUSE,PROP_LAYOUT} from './house.js';
// Our house carries the original filmed house's props one for one: every
// channel in src/original/layout.js has a counterpart here with the same id,
// colours and addressing, so the original's detected timing drives both.
// This file only says where each channel's bulbs sit on our house.
const lerp=(a,b,t)=>a.map((v,j)=>v+(b[j]-v)*t);
const dist=(a,b)=>Math.hypot(...a.map((v,j)=>v-b[j]));
// Evenly spaced points along a polyline, ends included (a closed one skips the repeat).
function along(points,step,closed=false){
  const pts=closed?[...points,points[0]]:points,out=[];
  for(let i=0;i<pts.length-1;i++){const n=Math.max(1,Math.round(dist(pts[i],pts[i+1])/step));for(let k=0;k<n;k++)out.push(lerp(pts[i],pts[i+1],k/n));}
  if(!closed)out.push(pts.at(-1));
  return out;
}
const circle=(cx,cy,z,r,n)=>Array.from({length:n},(_,k)=>{const a=Math.PI/2+2*Math.PI*k/n;return [cx+Math.cos(a)*r,cy+Math.sin(a)*r,z];});

// Stroke font in a unit box (x right, y up) for the letters of HAPPY HOLIDAYS.
export const GLYPHS={
  H:[[[0,0],[0,1]],[[1,0],[1,1]],[[0,.5],[1,.5]]],
  A:[[[0,0],[.5,1],[1,0]],[[.25,.5],[.75,.5]]],
  P:[[[0,0],[0,1],[.75,1],[1,.85],[1,.65],[.75,.5],[0,.5]]],
  Y:[[[0,1],[.5,.5],[1,1]],[[.5,.5],[.5,0]]],
  O:[[[.3,0],[.7,0],[1,.3],[1,.7],[.7,1],[.3,1],[0,.7],[0,.3],[.3,0]]],
  L:[[[0,1],[0,0],[1,0]]],
  I:[[[.5,0],[.5,1]],[[.2,1],[.8,1]],[[.2,0],[.8,0]]],
  D:[[[0,0],[0,1],[.6,1],[1,.7],[1,.3],[.6,0],[0,0]]],
  S:[[[1,.85],[.8,1],[.2,1],[0,.85],[0,.62],[.2,.5],[.8,.5],[1,.38],[1,.15],[.8,0],[.2,0],[0,.15]]],
};

// A bulb: position, base colour, multicolour tone (1 yellow, 2 blue, 0 single
// colour) and relative size. Frames are the wires the scene draws behind them.
const bulb=(pos,color,tone=0,size=1)=>({pos,color,tone,size});
const multi=(pos,i,size)=>bulb(pos,i%2?COLORS.blue:COLORS.yellow,i%2?2:1,size);
// A multicolour run with icicle drops under every other bulb, alternating length.
function multiRun(path,step,icicles){
  const bulbs=[];
  along(path,step).forEach((p,k)=>{bulbs.push(multi(p,k));if(icicles&&k%2===0)for(let d=1;d<=(k%4?2:3);d++)bulbs.push(multi([p[0],p[1]-d*.08,p[2]+.02],k+d,.6));});
  return bulbs;
}
// Outline just outside an opening; a door or garage leaves the ground side open.
function outline(o,z,open=false){
  const w=o.width/2+.12,bottom=open?.05:o.y-o.height/2-.1,top=open?o.height+.1:o.y+o.height/2+.1;
  return open?[[o.x-w,bottom,z],[o.x-w,top,z],[o.x+w,top,z],[o.x+w,bottom,z]]:[[o.x-w,bottom,z],[o.x-w,top,z],[o.x+w,top,z],[o.x+w,bottom,z],[o.x-w,bottom,z]];
}

// Window outlines keep the 10 cm pitch; the three house strips are twice as dense.
const STRIP=.1,DENSE=.05,L=PROP_LAYOUT;
const geometry={
  upper(){const {from,to,y,z}=L.upper;return {bulbs:multiRun([[from,y,z],[to,y,z]],DENSE,true),frames:[[[from,y,z-.02],[to,y,z-.02]]]};},
  lower(){const {from,to,y}=L.eaves.garage;return {bulbs:multiRun([[from,y,L.eaves.z],[to,y,L.eaves.z]],DENSE,true),frames:[[[from,y,L.eaves.z-.02],[to,y,L.eaves.z-.02]]]};},
  // The small left window, the door frame, the kitchen window and the garage door.
  windows(){
    const z=L.outlines.z,paths=[outline(HOUSE.windows[3],z),outline({...HOUSE.door,y:0},z,true),outline(HOUSE.windows[2],z),outline({...HOUSE.garage,y:0},z,true)];
    return {bulbs:paths.flatMap(p=>multiRun(p,STRIP,false)),frames:paths};
  },
  fence(){const path=L.fence.path;return {bulbs:multiRun(path,DENSE,false),frames:[path.map(p=>[p[0],p[1]-.01,p[2]])],posts:path};},
  letter(channel,index){
    const {from,to,y,height,z}=L.letters,slot=(to-from)/L.letters.text.length,width=height*.7;
    // The channel's own place in HAPPY HOLIDAYS, so the gap between the words stays.
    const at=[...L.letters.text].reduce((list,ch,i)=>ch===' '?list:[...list,i],[])[index],cx=from+slot*(at+.5),bulbs=[],frames=[];
    for(const stroke of GLYPHS[channel.model.char]){
      const points=stroke.map(([u,v])=>[cx+(u-.5)*width,y+(v-.5)*height,z]);
      for(const p of along(points,.045))bulbs.push(bulb(p,COLORS[channel.palette]));
      frames.push(points.map(p=>[p[0],p[1],z-.01]));
    }
    return {bulbs,frames};
  },
  // Two rings of green with a red bow at the bottom, as on the original.
  wreath(channel){
    const {x,y,radius:r,z}=L.wreaths[channel.id],bulbs=[...circle(x,y,z,r,24),...circle(x,y,z,r*.6,14)].map(p=>bulb(p,COLORS.green));
    for(const [dx,dy] of [[-.06,0],[-.1,.03],[-.1,-.03],[.06,0],[.1,.03],[.1,-.03]])bulbs.push(bulb([x+dx*r/.3,y-r+dy*r/.3,z+.02],COLORS.red,0,.9));
    return {bulbs,frames:[[...circle(x,y,z-.01,r,24),circle(x,y,z-.01,r,24)[0]],[...circle(x,y,z-.01,r*.6,14),circle(x,y,z-.01,r*.6,14)[0]]]};
  },
  peace(){
    const {x,y,radius:r,z}=L.peace,c=[x,y,z],spoke=a=>[x+Math.cos(a)*r,y+Math.sin(a)*r,z];
    const strokes=[[[x,y+r,z],[x,y-r,z]],[c,spoke(Math.PI*1.25)],[c,spoke(Math.PI*1.75)]];
    const bulbs=[...circle(x,y,z,r,26),...strokes.flatMap(s=>along(s,.06))].map(p=>bulb(p,COLORS.yellow));
    return {bulbs,frames:[[...circle(x,y,z-.01,r,26),circle(x,y,z-.01,r,26)[0]],...strokes.map(s=>s.map(p=>[p[0],p[1],z-.01]))]};
  },
  cane(channel,index){
    const {xs,z,height:h,hook:w}=L.canes,x=xs[index],hook=index%2?-1:1,path=[[x,.03,z],[x,h*.78,z]];
    for(let k=1;k<=6;k++){const a=Math.PI*k/6;path.push([x+hook*(w/2-Math.cos(a)*w/2),h*.78+Math.sin(a)*w*.6,z]);}
    return {bulbs:along(path,.05).map(p=>bulb(p,COLORS.red,0,.8)),frames:[path],cane:true};
  },
  minitree(channel,index){
    const {spots,height,radius:r}=L.minitrees,{x,y,z}=spots[index],top=[x,y+height,z],bulbs=[],frames=[];
    for(let s=0;s<6;s++){const a=2*Math.PI*s/6,base=[x+Math.cos(a)*r,y,z+Math.sin(a)*r];bulbs.push(...along([base,top],.07).map(p=>bulb(p,COLORS.red,0,.75)));frames.push([base,top]);}
    return {bulbs,frames};
  },
  // Strip at angle θ around the cone, from the ground ring to the apex under the star.
  treeStrip(channel){
    const {x,z,radius:R,height}=L.tree,theta=channel.model.theta,base=[x+Math.sin(theta)*R,.03,z+Math.cos(theta)*R],apex=[x,height,z];
    return {bulbs:along([base,apex],.12).slice(0,-1).map(p=>bulb(p,COLORS.yellow,0,.85)),frames:[[base,apex]]};
  },
  star(){
    const {x,z,height,star:{radius:R,gap}}=L.tree,cy=height+gap+R*.81;
    const outline=Array.from({length:11},(_,k)=>{const a=Math.PI/2+k*Math.PI/5,r=k%2?R*.42:R;return [x+Math.cos(a)*r,cy+Math.sin(a)*r,z];});
    return {bulbs:along(outline,.05,false).slice(0,-1).map(p=>bulb(p,COLORS.yellow,0,1.1)),frames:[outline,[[x,height,z],[x,cy-R*.81,z]]]};
  },
};

function build(channel,index){
  const kind=channel.kind==='strip'?channel.id:channel.kind;
  if(!geometry[kind])throw new Error(`No place on our house for ${channel.id}`);
  return geometry[kind](channel,index);
}
// Each channel's bulbs and frames, in the original's channel order.
export const OWN_CHANNELS=CHANNELS.map(channel=>{
  const index=CHANNELS.filter(c=>c.kind===channel.kind).indexOf(channel);
  return {...channel,...build(channel,index)};
});
export const BULB_COUNT=OWN_CHANNELS.reduce((n,c)=>n+c.bulbs.length,0);
