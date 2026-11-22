// The coro props cut from the blank sheets: the two Christmas circles, the
// peace sign, the candy canes and the tree star. Their shape comes from the
// same bulbs and frames as the 3D model (src/props.js), so the cutting page
// (cutting.html), the runbook and the templates (tools/templates/make.mjs)
// always agree with the model.
import {OWN_CHANNELS} from './props.js';

// Width of the coro band round the bulbs and frames, and the pixel hole, in mm.
export const BAND=50,HOLE=12;
// Two model pixels closer than this (m) share one hole: the peace sign's stroke
// ends, the circle's bow pixels that sit on the ring.
const SAME_SPOT=.02;
// The pixel strings are 10 cm between pixels.
export const PITCH=.1;
export const SHEET={w:1400,h:1000,t:3,bought:5};

// Which channel stands for each template, how many to cut, and which frames are coro
// (the star's second frame is its stem down to the tree, not part of the board).
// Bridges (degrees) tie the circle's inner ring to the outer one so it stays in one piece.
// openings: the holes to cut inside the band. start: where pixel 1 sits.
export const CORO_TEMPLATES=[
 {file:'christmas-circle',id:'wreath-left',kind:'wreath',title:'Christmas circle',cut:2,bridges:[45,135,225,315],openings:5,openingsText:'the middle and the four windows between the rings',start:'the top of the outer ring, going anticlockwise',icon:'i-lucide-circle-dot'},
 {file:'peace-sign',id:'peace',kind:'peace',title:'Peace sign',cut:1,openings:4,openingsText:'the four windows between the strokes',start:'the top of the ring, going anticlockwise',icon:'i-lucide-heart-handshake'},
 {file:'candy-cane',id:'cane-1',kind:'cane',title:'Candy cane',cut:8,openings:0,openingsText:'none',start:'the bottom of the stem',icon:'i-lucide-candy-cane',note:'Flip the template for the four canes whose hook points the other way.'},
 {file:'tree-star',id:'tree-star',kind:'star',title:'Tree star',cut:1,frames:1,openings:1,openingsText:'the middle',start:'the top point, going anticlockwise',icon:'i-lucide-star'},
];

const dist=(p,q)=>Math.hypot(p[0]-q[0],p[1]-q[1]);

// The prop's outline in model metres: the frames the band follows, the hole
// spots, which pixels have no hole of their own, and its bounding box.
export function coroShape(t){
 const c=OWN_CHANNELS.find(x=>x.id===t.id),frames=c.frames.slice(0,t.frames??c.frames.length);
 if(t.bridges){
  const cx=c.bulbs.reduce((s,b)=>s+b.pos[0],0)/c.bulbs.length,cy=frames[0].reduce((s,p)=>s+p[1],0)/frames[0].length;
  const radii=frames.map(f=>Math.hypot(f[0][0]-cx,f[0][1]-cy)),r0=Math.min(...radii),r1=Math.max(...radii),z=frames[0][0][2];
  for(const d of t.bridges){const a=d*Math.PI/180;frames.push([r0,r1].map(r=>[cx+Math.cos(a)*r,cy+Math.sin(a)*r,z]));}
 }
 const bulbs=c.bulbs.map(b=>b.pos);
 const shared=bulbs.map((p,i)=>bulbs.slice(0,i).findIndex(q=>dist(p,q)<SAME_SPOT));
 const spots=bulbs.filter((p,i)=>shared[i]<0);
 const pts=[...bulbs,...frames.flat()];
 const x0=Math.min(...pts.map(p=>p[0])),x1=Math.max(...pts.map(p=>p[0])),y0=Math.min(...pts.map(p=>p[1])),y1=Math.max(...pts.map(p=>p[1]));
 return {channel:c,frames,bulbs,shared,spots,x0,x1,y0,y1};
}

// Everything the cutting page and runbook say about one prop.
export function coroProp(t){
 const s=coroShape(t),n=s.bulbs.length;
 // Pixels that share a hole with an earlier one: they stay on the string behind the board.
 const hidden=s.shared.map((j,i)=>j<0?null:{pixel:i+1,with:j+1}).filter(Boolean);
 // Between two pixels that do have holes, the string's 10 cm per step must reach.
 const lit=s.bulbs.map((p,i)=>i).filter(i=>s.shared[i]<0),extensions=[];
 for(let k=1;k<lit.length;k++){
  const i=lit[k-1],j=lit[k],d=dist(s.bulbs[i],s.bulbs[j]);
  if(d>PITCH*(j-i)-.005)extensions.push({from:i+1,to:j+1,cm:Math.round(d*100),add:Math.ceil(((d-PITCH*(j-i))*100+5)/5)*5});
 }
 const gaps=s.spots.slice(1).map((p,i)=>dist(p,s.spots[i]));
 return {...t,
  w:Math.round((s.x1-s.x0)*1000+BAND),h:Math.round((s.y1-s.y0)*1000+BAND),
  holes:s.spots.length,pixels:n,hidden,extensions,
  spacing:[Math.round(Math.min(...gaps)*100),Math.round(Math.max(...gaps.filter(g=>g<=PITCH))*100)],
 };
}

export const CORO_PROPS=CORO_TEMPLATES.map(coroProp);
const byKind=Object.fromEntries(CORO_PROPS.map(p=>[p.kind,p]));
export const CORO_PIECES=CORO_PROPS.reduce((s,p)=>s+p.cut,0);
export const CORO_HOLES=CORO_PROPS.reduce((s,p)=>s+p.cut*p.holes,0);

// How the pieces sit on the sheets, side by side across the 140 cm, with the
// flutes along the 100 cm side so every prop's up-down runs along them.
export const CORO_SHEETS=[
 ['wreath','wreath','cane'],
 ['peace','star','cane','cane'],
 ['cane','cane','cane','cane','cane'],
].map(kinds=>{
 const pieces=kinds.map(k=>byKind[k]),gap=10;
 return {pieces,width:pieces.reduce((s,p)=>s+p.w,0)+gap*(pieces.length-1),gap};
});

// The piece in millimetres, with (0,0) at the top left of its cut edge: the
// lines the band follows, every bulb, and the hole spots. For drawing it.
export function coroOutline(t){
 const s=coroShape(t),r=BAND/2,P=p=>[Math.round(((p[0]-s.x0)*1000+r)*10)/10,Math.round(((s.y1-p[1])*1000+r)*10)/10];
 return {lines:s.frames.map(f=>f.map(P)),bulbs:s.bulbs.map(P),spots:s.spots.map(P),w:Math.round((s.x1-s.x0)*1000+BAND),h:Math.round((s.y1-s.y0)*1000+BAND)};
}
