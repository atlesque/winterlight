import {HOUSE,PROP_LAYOUT as L} from '../house.js';
import {OWN_CHANNELS,along,outline,STRIP,DENSE} from '../props.js';
import {estimate,ALL,DEFAULTS} from '../costs/estimate.js';

// The measurements still to take with a tape: the 2021 plan gives every
// length along the facade and the garden's width, but no heights, and it
// doesn't dimension the forecourt or the planting tiles. Each one is drawn on
// the 3D model as a dimension line (from → to, in the model's metres: x along
// the facade, y up, z out to the street) with the model's guess, and entered
// on the measure page (app/pages/measure.vue). Values are kept in D1 next to
// the runbook's ticks (worker/index.js) and flow into the runbook through
// applyMeasures() below: the measuring step ticks itself once all its values
// are in, and the steps that depend on them show the updated numbers.
const [, , kitchen, small]=HOUSE.windows,UP=HOUSE.windows[0],door=HOUSE.door,garage=HOUSE.garage;
const {tiles,size:TILE,bush:BUSH}=HOUSE.planters;
const r2=v=>Math.round(v*100)/100;
const upperTop=r2(UP.y+UP.height/2),sill=r2(UP.y-UP.height/2);
const gapX=r2(tiles[1].x-tiles[0].x-TILE),gapZ=r2(tiles[2].z-tiles[0].z-TILE);
const FRONT=.42,kitchenTop=r2(kitchen.y+kitchen.height/2),setback=r2(tiles[0].z-TILE/2);
// The model's guesses before the tape came out. The house model (src/house.js)
// now carries the measured values; these stay so the measure page can show
// what each measurement changed, and so the order baseline below holds.
const GUESSES={smallWindowHeight:.7,doorHeight:2.3,kitchenWindowHeight:1.4,garageDoorHeight:2.25,garageEaveHeight:2.74,
 upstairsWindowTop:4.85,letterBand:1.15,gardenDepth:4.2,tileGapWidth:.62,tileGapDepth:.85,bushWidth:.72,
 // Added after the first round, so their guesses are the model as it then stood.
 kitchenWindowTop:2.1,tileSetback:.91};
export const MEASURE_STEPS={
 'measure-facade':'Facade heights',
 'measure-garden':'Garden and planting tiles',
 'measure-more':'Kitchen window and tile position',
};
// min and max (metres) bound what the page and the API accept.
export const MEASUREMENTS=[
 {id:'smallWindowHeight',step:'measure-facade',label:'Small window height',guess:GUESSES.smallWindowHeight,min:.2,max:2,
  how:'The small window left of the front door: inside of the frame, bottom to top.',
  from:[small.x+small.width/2+.2,small.y-small.height/2,FRONT],to:[small.x+small.width/2+.2,small.y+small.height/2,FRONT],view:[[4.6,1.9,4.2],[3.7,1.7,0]]},
 {id:'doorHeight',step:'measure-facade',label:'Front door height',guess:GUESSES.doorHeight,min:1.8,max:3,
  how:'The front door opening: the doorstep to the underside of the frame at the top.',
  from:[door.x+door.width/2+.2,0,FRONT],to:[door.x+door.width/2+.2,door.height,FRONT],view:[[5.6,1.6,5.6],[4.8,1.2,0]]},
 {id:'kitchenWindowHeight',step:'measure-facade',label:'Kitchen window height',guess:GUESSES.kitchenWindowHeight,min:.5,max:2.5,
  how:'The window right of the front door: inside of the frame, bottom to top.',
  from:[kitchen.x+kitchen.width/2+.25,kitchen.y-kitchen.height/2,FRONT],to:[kitchen.x+kitchen.width/2+.25,kitchen.y+kitchen.height/2,FRONT],view:[[7.6,1.7,5.4],[6.9,1.6,0]]},
 {id:'kitchenWindowTop',step:'measure-more',label:'Height of the kitchen window',guess:GUESSES.kitchenWindowTop,min:1.2,max:3,
  how:'The ground to the top of the kitchen window frame. The model has it level with the top of the front door; the letters hang just above it.',
  from:[kitchen.x+kitchen.width/2+.5,0,FRONT+.05],to:[kitchen.x+kitchen.width/2+.5,kitchenTop,FRONT+.05],view:[[9.8,2,5.2],[7.6,1.3,0]]},
 {id:'garageDoorHeight',step:'measure-facade',label:'Garage door height',guess:GUESSES.garageDoorHeight,min:1.8,max:3,
  how:'The garage door opening: the floor to the underside of the frame at the top.',
  from:[garage.x+garage.width/2+.15,0,FRONT],to:[garage.x+garage.width/2+.15,garage.height,FRONT],view:[[2.6,1.5,6],[1.8,1.2,0]]},
 {id:'garageEaveHeight',step:'measure-facade',label:'Garage eave height',guess:GUESSES.garageEaveHeight,min:2,max:4,
  how:'The ground to the underside of the garage\'s eave, where the lower floor strip hangs.',
  from:[.25,0,FRONT],to:[.25,L.eaves.garage.y,FRONT],view:[[1.8,1.8,6.2],[1,1.4,0]]},
 {id:'upstairsWindowTop',step:'measure-facade',label:'Height of the upstairs windows',guess:GUESSES.upstairsWindowTop,min:3.5,max:7,
  how:'The ground to the top of the upstairs window frames. The upper floor strip hangs 13 cm above it; from a window upstairs, measure down to the ground with a weighted tape.',
  from:[UP.x+(HOUSE.windows[1].x-UP.x)/2,0,FRONT+.05],to:[UP.x+(HOUSE.windows[1].x-UP.x)/2,upperTop,FRONT+.05],view:[[5.6,3,9.5],[5.6,2.6,0]]},
 {id:'letterBand',step:'measure-facade',label:'Letter band',guess:GUESSES.letterBand,min:.2,max:2,
  how:'The top of the front door frame to the sill of the upstairs window above it: the band HAPPY HOLIDAYS hangs in.',
  from:[door.x+.25,door.height,FRONT+.1],to:[door.x+.25,sill,FRONT+.1],view:[[5.2,3,4.6],[4.8,2.9,0]]},
 {id:'gardenDepth',step:'measure-garden',label:'Garden depth',guess:GUESSES.gardenDepth,min:2,max:8,
  how:'From the facade to the street edge, along the entrance path. The ground strip\'s side run is this less 55 cm.',
  from:[HOUSE.entry.maxX,.06,0],to:[HOUSE.entry.maxX,.06,HOUSE.forecourtDepth],view:[[3.4,3.2,6.4],[5.6,0,2]]},
 {id:'tileGapWidth',step:'measure-garden',label:'Gap between the tiles, left to right',guess:GUESSES.tileGapWidth,min:.2,max:2,
  how:'Between the left and right planting tiles, edge to edge across the paving. The tree stands in the middle of the four tiles.',
  from:[tiles[0].x+TILE/2,.08,L.tree.z],to:[tiles[1].x-TILE/2,.08,L.tree.z],view:[[L.tree.x,2.6,5.2],[L.tree.x,0,L.tree.z]]},
 {id:'tileGapDepth',step:'measure-garden',label:'Gap between the tiles, front to back',guess:GUESSES.tileGapDepth,min:.2,max:2,
  how:'Between the tiles nearest the house and the tiles nearest the street, edge to edge.',
  from:[L.tree.x,.1,tiles[0].z+TILE/2],to:[L.tree.x,.1,tiles[2].z-TILE/2],view:[[9.4,2.4,L.tree.z],[L.tree.x,0,L.tree.z]]},
 {id:'bushWidth',step:'measure-garden',label:'Bush top width',guess:GUESSES.bushWidth,min:.2,max:1.5,
  how:'Across the flat top of the narrowest clipped bush. The mini trees stand on the bush tops, three across.',
  from:[tiles[2].x-BUSH/2,BUSH+.09,tiles[2].z+BUSH/2+.04],to:[tiles[2].x+BUSH/2,BUSH+.09,tiles[2].z+BUSH/2+.04],view:[[6.2,1.9,5.3],[6.03,.6,2.97]]},
 {id:'tileSetback',step:'measure-more',label:'House to the front tiles',guess:GUESSES.tileSetback,min:.2,max:3,
  how:'From the facade to the near edge of the planting tiles closest to the house. With the gaps, it places the tiles, the tree and the mini trees.',
  from:[tiles[0].x-TILE/2-.08,.08,0],to:[tiles[0].x-TILE/2-.08,.08,setback],view:[[3.4,3.6,4.6],[5.8,.3,.7]]},
];
export const MEASURE_IDS=MEASUREMENTS.map(m=>m.id);
export const byStep=step=>MEASUREMENTS.filter(m=>m.step===step);
// Steps whose every measurement has a value.
export const completeSteps=values=>Object.keys(MEASURE_STEPS).filter(s=>byStep(s).every(m=>Number.isFinite(values?.[m.id])));
// A value the API will store: a number of metres within the measurement's bounds.
export function validMeasure(id,value){const m=MEASUREMENTS.find(x=>x.id===id);return Boolean(m)&&typeof value==='number'&&Number.isFinite(value)&&value>=m.min&&value<=m.max;}

export const cm=v=>`${Math.round(v*100)} cm`;
export const metres=v=>`${(Math.round(v*100)/100).toFixed(2)} m`;

// The baseline the orders were placed on: the cost model's full show as it
// stood on the guesses (51 strings of 50, two 50 m rolls of mounting strip),
// plus the third roll added on 10 Nov once the mini-tree spokes were counted.
// Fixed numbers, since the model has since moved to the measured sizes.
const SPARE=1+DEFAULTS.spare/100;
export const BASELINE={pixels:2399,strings:51,stripMetres:86,rolls:3,windows:230,fence:132};
// The show as the model now stands, which applyMeasures() adjusts for any
// value that differs from it.
const FULL=estimate(ALL,DEFAULTS);
const pixelsOf=prop=>OWN_CHANNELS.filter(c=>c.prop===prop).reduce((n,c)=>n+c.bulbs.length,0);
const runLength=paths=>paths.reduce((t,f)=>t+f.slice(1).reduce((s,p,i)=>s+Math.hypot(...p.map((v,j)=>v-f[i][j])),0),0);
const stripMetres=FULL.groups.flatMap(g=>g.props.flatMap(p=>p.lines)).filter(l=>l.item==='mountStrip').reduce((s,l)=>s+l.qty,0);
export const MODEL={pixels:FULL.pixels,stripMetres,windows:pixelsOf('windows'),fence:pixelsOf('fence')};

// The window outlines and the ground strip with the measured sizes, built
// the same way src/props.js builds them for the model.
function windowPaths(v){
 const z=L.outlines.z,h=(id,o)=>v[id]??o.height;
 return [outline({...small,height:h('smallWindowHeight',small)},z),outline({...door,height:h('doorHeight',door),y:0},z,true),
  outline({...kitchen,height:h('kitchenWindowHeight',kitchen)},z),outline({...garage,height:h('garageDoorHeight',garage),y:0},z,true)];
}
const fencePath=depth=>{const [a,b,c]=L.fence.path,front=b[2]+(depth-HOUSE.forecourtDepth);return [a,[b[0],b[1],front],[c[0],c[1],front]];};

// What the measured values change. Returns the updated quantities and, per
// runbook step, a new text and/or a note. Missing values keep the model's own value.
export function applyMeasures(values={}){
 const v=Object.fromEntries(MEASURE_IDS.filter(id=>Number.isFinite(values[id])).map(id=>[id,values[id]]));
 const has=id=>id in v,steps={};
 const note=(id,text,warn=false)=>{(steps[id]||={notes:[]}).notes.push({text,warn});};
 // Window outlines (10 cm pitch) and the ground strip (5 cm pitch).
 const wPaths=windowPaths(v),windows=wPaths.reduce((n,p)=>n+along(p,STRIP).length,0);
 const fPath=fencePath(v.gardenDepth??HOUSE.forecourtDepth),fence=along(fPath,DENSE).length;
 const windowsStrip=Math.ceil(runLength(wPaths)),fenceStrip=Math.ceil(runLength([fPath]));
 const modelWindowsStrip=Math.ceil(runLength(windowPaths({}))),modelFenceStrip=Math.ceil(runLength([fencePath(HOUSE.forecourtDepth)]));
 const pixels=MODEL.pixels+(windows-MODEL.windows)+(fence-MODEL.fence);
 const strings=Math.ceil(pixels*SPARE/50),stripMetres=MODEL.stripMetres+(windowsStrip-modelWindowsStrip)+(fenceStrip-modelFenceStrip);
 const rolls=Math.ceil(stripMetres/50),measured=Object.keys(v).length;
 const out={measured,of:MEASURE_IDS.length,windows,fence,pixels,strings,stripMetres,rolls,steps};
 const facadeHeights=['smallWindowHeight','doorHeight','kitchenWindowHeight','garageDoorHeight'].filter(has);

 if(facadeHeights.length)steps['build-windows']={text:`Fix the window outlines to mounting strip: ${windows} pixels at 10 cm`,notes:[]};
 if(facadeHeights.length)note('build-windows',`From ${facadeHeights.length===4?'all four measured heights':`${facadeHeights.length} of the 4 measured heights`}: ${windows} pixels instead of the ${BASELINE.windows} the order was counted on, ${windowsStrip} m of mounting strip.`);
 if(has('gardenDepth')){
  steps['build-fence']={text:`Fix the ground strip to its staked rail: ${fence} pixels`,notes:[]};
  note('build-fence',`The garden is ${metres(v.gardenDepth)} deep, so the side run is ${metres(fPath[1][2]-fPath[0][2])}: ${fence} pixels instead of the ${BASELINE.fence} the order was counted on, ${fenceStrip} m of mounting strip.`);
 }
 if(facadeHeights.length||has('gardenDepth')){
  const spare=BASELINE.strings*50-pixels,d=pixels-BASELINE.pixels;
  note('count-pixels',strings<=BASELINE.strings
   ?`With the measurements the show needs ${pixels.toLocaleString('en')} pixels (${d>=0?'+':''}${d}). The ${BASELINE.strings} strings ordered still cover it, with ${spare} spare.`
   :`With the measurements the show needs ${pixels.toLocaleString('en')} pixels (+${d}): ${strings} strings with the ${DEFAULTS.spare}% spare, ${strings-BASELINE.strings} more than the ${BASELINE.strings} ordered.${spare>=0?` Without spare the ${BASELINE.strings} strings still reach, with ${spare} to go.`:''}`,strings>BASELINE.strings);
  if(rolls>BASELINE.rolls)note('count-pixels',`Mounting strip: ${stripMetres} m, more than the ${BASELINE.rolls} × 50 m ${BASELINE.rolls>1?'rolls':'roll'} ordered. Order ${rolls-BASELINE.rolls} more.`,true);
 }
 if(has('upstairsWindowTop')||has('garageEaveHeight')){
  const parts=[];
  if(has('upstairsWindowTop'))parts.push(`the upper strip hangs at ${metres(v.upstairsWindowTop+.13)}, so the ladder has to reach that`);
  if(has('garageEaveHeight'))parts.push(`the garage eave strip hangs at ${metres(v.garageEaveHeight)}`);
  note('place-strips',`Measured: ${parts.join('; ')}.`);
 }
 if(has('letterBand')){
  const room=v.letterBand-L.letters.height;
  note('place-letters',room>=.1?`The band is ${cm(v.letterBand)}: the 30 cm letters fit with ${cm(room/2)} above and below. Centre them ${metres((v.doorHeight??door.height)+v.letterBand/2)} up.`
   :`The band is only ${cm(v.letterBand)}, too tight for the 30 cm letters with room round them. Hang them above the upstairs window sills or over the garage instead.`,room<.1);
 }
 if(has('kitchenWindowTop')){
  // The letters hang centred in the band over the door; the kitchen outline runs 12 cm above its window.
  const top=v.kitchenWindowTop,doorTop=v.doorHeight??door.height,band=v.letterBand??r2(sill-door.height);
  const letterFoot=doorTop+band/2-L.letters.height/2,clear=letterFoot-(top+.12),d=Math.round((top-doorTop)*100);
  note('build-windows',`The kitchen window's top is ${metres(top)}, ${d===0?'level with':`${Math.abs(d)} cm ${d>0?'above':'below'}`} the top of the front door.`);
  note('place-letters',clear>=.05?`The letters' feet are ${cm(clear)} above the kitchen window's outline.`
   :`The kitchen window's outline reaches ${clear<0?`${cm(-clear)} into`:'right under'} the letters. Hang them higher, or take the outline's top run under the frame.`,clear<.05);
 }
 if(has('tileGapWidth')||has('tileGapDepth')){
  const gx=v.tileGapWidth??gapX,gz=v.tileGapDepth??gapZ,inset=(TILE-BUSH)/2,fit=2*Math.hypot(gx/2+inset,gz/2+inset),base=2*L.tree.radius;
  note('place-tree',fit>=base+.1?`The tiles leave room for a cone up to ${cm(fit)} across between the bushes; the tree's base is ${cm(base)}, so it fits. Centre the pole in the middle of the four tiles.`
   :`The tiles leave room for a cone of only ${cm(fit)} across between the bushes, and the tree's base is ${cm(base)}. Narrow the base or move the tree forward of the tiles.`,fit<base+.1);
 }
 if(has('tileSetback')){
  const gz=v.tileGapDepth??gapZ,depth=v.gardenDepth??HOUSE.forecourtDepth,pole=v.tileSetback+TILE+gz/2,back=v.tileSetback+2*TILE+gz,room=depth-.4-back;
  note('place-tree',`The tree's pole stands ${metres(pole)} out from the facade.`);
  note('place-garden',room>=.1?`The back tiles end ${metres(back)} out, ${cm(room)} short of the cane line.`
   :`The back tiles end ${metres(back)} out, ${room<0?'past':'right at'} the cane line 40 cm in from the street. Set the canes along the street edge itself.`,room<.1);
 }
 if(has('bushWidth')){
  const w=v.bushWidth;
  note('place-garden',w>=.6?`The bush tops are ${cm(w)} wide, so three mini trees fit across each, ${cm((w-.16)/2)} apart.`
   :w>=.4?`The bush tops are only ${cm(w)} wide: two mini trees fit across each, not three. Stand the third behind the bush, or on the paving beside it.`
   :`The bush tops are only ${cm(w)} wide, too narrow for the mini trees. Stand them on the paving in front of the bushes.`,w<.6);
 }
 return out;
}
