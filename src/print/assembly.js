import {PROP_LAYOUT as L} from '../house.js';
import {OWN_CHANNELS} from '../props.js';
import {BRICK} from './parts.js';
// The finished props for the 3D prints page: where each printed part sits once
// it is built, with the strip, coro, pixels, bricks and pole drawn round it.
// Millimetres, Z up (as in the STLs); the page's viewer turns it Y up.
// Items: {stl,m,t} a printed part (world = m·p + t), {box,c,rz} a box centred
// at c turned rz degrees round Z, {cyl,at} an upright cylinder, {strip} a flat
// strip from a to b with its face towards n, {band} a coro band along a
// polyline, {pixels} 12 mm bullets at points, and {ground} the paving or a bush.
const I=[[1,0,0],[0,1,0],[0,0,1]];
const FLIP=[[1,0,0],[0,-1,0],[0,0,-1]];
const rz=deg=>{const a=deg*Math.PI/180,c=Math.cos(a),s=Math.sin(a);return [[c,-s,0],[s,c,0],[0,0,1]];};
const lerp=(a,b,t)=>a.map((v,j)=>v+(b[j]-v)*t);
const add=(a,b)=>a.map((v,j)=>v+b[j]);
const scale=(a,k)=>a.map(v=>v*k);
// Points spaced along a straight strip, pushed out to the pixels' heads.
const onStrip=(a,b,n,step,from=.04,to=.96)=>{const len=Math.hypot(...b.map((v,j)=>v-a[j])),k=Math.max(1,Math.round(len*(to-from)/step));
 return Array.from({length:k+1},(_,i)=>add(lerp(a,b,from+(to-from)*i/k),scale(n,7)));};
export const COLORS={printed:0xf0c49a,brick:0x7c8288,paving:0x4a515b,strip:0x16181d,coro:0xf2f2ee,bush:0x3d6b3c,pole:0x9a7b55,parasol:0x6d7178,rod:0xc8b17f};
const PIX={red:0xff4b3e,yellow:0xffc94a,blue:0x4aa8ff,green:0x3ee07a};
const [BL,BW,BH]=BRICK.size;
// Tray sizes, as in tools/print/lib.scad.
const CLR=3,WALL=1.6,FLOOR=1.6,trayIn=n=>[BL+2*CLR,n*(BW+2*CLR)];

function miniTree(){
 const r0=mm(L.minitrees.radius),h=mm(L.minitrees.height),r1=34,items=[];
 items.push({ground:'bush',box:[720,720,300],c:[0,0,-150]});
 items.push({stl:'minitree-base',m:I,t:[0,0,0]},{stl:'minitree-top',m:FLIP,t:[0,0,h]});
 items.push({cyl:{r:4,z0:-150,z1:h-5},at:[0,0],color:COLORS.rod});
 const red=[];
 for(let i=0;i<6;i++){
  const a=i*Math.PI/3,d=[Math.cos(a),Math.sin(a),0],from=[...scale(d,r0-1.4).slice(0,2),3],to=[...scale(d,r1-1.4).slice(0,2),h-3];
  items.push({strip:{a:from,b:to,n:d,w:25,t:2}});red.push(...onStrip(from,to,d,70,.08,.9));
 }
 items.push({pixels:red,color:PIX.red});
 return items;
}

function tree(){
 const R=mm(L.tree.radius),H=mm(L.tree.height),hub=88,items=[{ground:'paving'}],yellow=[];
 items.push({box:[450,450,70],c:[0,0,35],color:COLORS.parasol});
 const poleTop=H+60,holder=poleTop-47;
 items.push({cyl:{r:16,z0:70,z1:poleTop},at:[0,0],color:COLORS.pole});
 items.push({stl:'tree-crown',m:FLIP,t:[0,0,H]},{stl:'tree-star-holder',m:I,t:[0,0,holder]});
 for(let i=0;i<16;i++){
  const deg=i*22.5,a=deg*Math.PI/180,d=[Math.cos(a),Math.sin(a),0],weighted=i%4===0;
  items.push({stl:weighted?'tree-ring-weight':'tree-ring',m:rz(deg),t:[0,0,0]});
  if(weighted)items.push({box:[BW,BL,BH],c:[...scale(d,R+10+WALL+CLR+BW/2).slice(0,2),FLOOR+BH/2],rz:deg,color:COLORS.brick});
  const from=[...scale(d,R-1.4).slice(0,2),8],to=[...scale(d,hub-1.4).slice(0,2),H-3];
  items.push({strip:{a:from,b:to,n:d,w:25,t:2}});yellow.push(...onStrip(from,to,d,120,.03,.97));
 }
 // The coro star: its bottom notch sits on the V floor of the holder's slot.
 const S=mm(L.tree.star.radius),slope=(.809-.42)/.588,top=50+24+(40+slope*45)+8,notch=holder+top-40+30,cz=notch+.42*S;
 const outline=Array.from({length:11},(_,k)=>{const a=Math.PI/2+k*Math.PI/5,r=k%2?S*.42:S;return [Math.cos(a)*r,0,cz+Math.sin(a)*r];});
 items.push({band:{points:outline,n:[0,1,0],w:50,t:3}});
 const star=OWN_CHANNELS.find(c=>c.kind==='star');
 const sc=star.bulbs.map(b=>b.pos),sx=L.tree.x,sy=L.tree.height+L.tree.star.gap+L.tree.star.radius*.81;
 yellow.push(...sc.map(p=>[(p[0]-sx)*1000,7,cz+(p[1]-sy)*1000]));
 items.push({pixels:yellow,color:PIX.yellow});
 return items;
}

function cane(){
 const [ix,iy]=trayIn(2),rib=16,out=[ix+2*WALL,iy+rib+2*WALL],items=[{ground:'paving'}];
 items.push({stl:'cane-base',m:I,t:[-out[0]/2,-out[1]/2,0]});
 for(const s of [-1,1])items.push({box:[BL,BW,BH],c:[0,s*(rib/2+CLR+BW/2),FLOOR+BH/2],color:COLORS.brick});
 const c=OWN_CHANNELS.find(x=>x.kind==='cane'),[x0,y0]=c.frames[0][0],base=115-50+25;
 const P=p=>[(p[0]-x0)*1000,0,(p[1]-y0)*1000+base];
 items.push({band:{points:c.frames[0].map(P),n:[0,1,0],w:50,t:3}});
 items.push({pixels:c.bulbs.map(b=>add(P(b.pos),[0,7,0])),color:PIX.red});
 return items;
}

function fence(){
 const out=[trayIn(1)[0]+2*WALL,trayIn(1)[1]+2*WALL],sock=[out[0]/2,out[1]+10],y=mm(L.fence.path[0][1]),items=[{ground:'paving'}],posts=[0,750,1500];
 for(const x of posts){
  items.push({stl:'fence-foot',m:I,t:[x-sock[0],-sock[1],0]});
  items.push({box:[BL,BW,BH],c:[x,out[1]/2-sock[1],FLOOR+BH/2],color:COLORS.brick});
  items.push({stl:'fence-post',m:[[0,0,1],[1,0,0],[0,1,0]],t:[x-8,0,0]});
 }
 const a=[-250,6.6,y],b=[1750,6.6,y];
 items.push({strip:{a,b,n:[0,1,0],w:25,t:2}});
 const pts=onStrip(a,b,[0,1,0],50,.01,.99);
 items.push({pixels:pts.filter((_,i)=>i%2===0),color:PIX.yellow},{pixels:pts.filter((_,i)=>i%2),color:PIX.blue});
 return items;
}
function mm(v){return Math.round(v*1000);}

export const ASSEMBLIES={
 minitrees:{items:miniTree(),caption:'One mini tree on top of its bush: base ring, six strip spokes, top cap and the rod down into the bush.'},
 tree:{items:tree(),caption:'The wireframe tree: the pole in a parasol base, the ring of 16 segments with four bricks, the strands up to the crown hub and the star on its holder.'},
 canes:{items:cane(),caption:'One candy cane in its base, two bricks either side of the rib.'},
 fence:{items:fence(),caption:'A 2 m stretch of the ground strip: posts in brick feet, the strip in their slots.'},
};
