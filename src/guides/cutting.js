// The step-by-step cutting guide on cutting.html, in the shape StepGuide.vue
// takes: one step per piece (and one to get ready, one to finish), each with
// its actions as tickable tasks, following the sheet plan in src/coro.js.
// Ticks are saved as 'cut/<stepId>/<taskId>' (CUTTING_TICK_IDS).
import {CORO_SHEETS,CORO_PROPS,CORO_HOLES,HOLE} from '../coro.js';

const where=(i,n)=>n===1?'in the middle':i===0?'at the left':i===n-1?'at the right':n===3?'in the middle':`${['','second','third','fourth'][i]} from the left`;
const lower=t=>t.replace(/^(?!Christmas)\w/,c=>c.toLowerCase());
const pixelOne={wreath:'the top hole of the outer ring',peace:'the top hole of the ring',cane:'the bottom hole of the stem',star:'the hole at the top point'};
// Canes 2, 4, 6 and 8 hook the other way from cane 1 (src/props.js).
const turned=n=>n%2===0;

// Each piece on the sheets, numbered per prop: the first of a kind is cut from
// the paper template, the rest are traced from it.
export const CUT_PIECES=[];
{
 const seen={};
 CORO_SHEETS.forEach((s,sheet)=>s.pieces.forEach((p,slot)=>{
  const n=seen[p.kind]=(seen[p.kind]||0)+1;
  CUT_PIECES.push({kind:p.kind,prop:p,n,sheet,slot,master:n===1,name:p.cut>1?`${p.title} ${n}`:p.title,place:where(slot,s.pieces.length)});
 }));
}

export const CUTTING_KEY='cut';
const task=(id,title,text)=>({id,html:`<b>${title}.</b> ${text}`});

function pieceSteps(c){
 const p=c.prop,out=[],first=`${p.title} 1`;
 const step=(k,title,text)=>out.push(task(k,title,text));
 const extra=p.kind==='star'?' Then drill two 5 mm holes just above the notch between the two lower points, for tying the star into its printed holder.':'';
 if(c.master){
  step('stick',`Stick the ${lower(p.title)} template on sheet ${c.sheet+1}`,`Place it ${c.place}, as in the drawing, with the prop's up-down running along the flutes. Spray a light coat of adhesive on the back of the paper, not on the coro, wait half a minute, then smooth it down from the middle out.`);
  step('drill',`Drill the ${p.holes} pixel holes`,`With the scrap board underneath, drill straight down through the centre of every crosshair with the ${HOLE} mm step drill, at medium speed. The piece is still part of the sheet, so it stays stiff.${extra}`);
 }else if(p.kind==='cane'){
  // Traced face down, the copy matches the master; face up, it comes out mirrored,
  // with the hook the other way. Either way the marker lines end up on its back.
  const mirror=turned(c.n);
  step('trace',`Trace ${c.name} from ${first} and drill its ${p.holes} holes`,`Lay ${first} face ${mirror?'up':'down'} ${c.place} on sheet ${c.sheet+1}, along the flutes${mirror?': this cane\'s hook points the other way':''}. Trace round it with the marker, then drill through its holes into the sheet below. The marker lines end up on the back.`);
 }else{
  step('trace',`Trace ${c.name} from ${first}`,`Lay ${first} face down ${c.place} on sheet ${c.sheet+1}, along the flutes. Trace its outline and its openings with the marker. The marker lines end up on the back.`);
  step('drill',`Drill the ${p.holes} pixel holes through ${first}`,`Keep ${first} in place, clamped or weighted, and use its holes as a drill guide, with the scrap board underneath.`);
 }
 if(p.openings)step('openings',`Cut ${p.openingsText}`,`Inside cuts first, while the sheet round the piece still holds it flat. Cut the straights along the steel ruler and the short arcs freehand in short strokes. In the corners, cut toward the corner from both sides.`);
 
 if(p.kind==='cane'&&!c.master)step('cut',`Cut out ${c.name} and mark its back`,`Cut along the traced edge: one firm pass along the flutes, two or three light passes across them. Then write "${c.name}" on the back and an arrow at ${pixelOne.cane}.`);
 else{
  step('edge','Cut the outside edge',`Follow the edge of the ${c.master?'grey band':'traced line'}. Along the flutes one firm pass goes through; across them, two or three light passes. Keep the knife upright.`);
  step('mark',c.master?'Peel off the template and mark the back':'Mark the back',`${c.master?'Peel the paper off slowly and wipe off any glue left. ':''}Write "${c.name}" on the back and draw an arrow at ${pixelOne[p.kind]}: that is pixel 1.${c.master&&p.cut>1?` This is the master for ${p.cut===2?`${p.title} 2`:`the other ${p.cut-1}`}, so keep it flat.`:''}`);
 }
 return {id:`${p.kind}-${c.n}`,title:`Sheet ${c.sheet+1}: ${c.name}`,
  intro:c.master?`Cut from the paper template, ${c.place} of sheet ${c.sheet+1}.`:`Traced from ${first}, ${c.place} of sheet ${c.sheet+1}.`,
  sheet:c.sheet,slot:c.slot,tasks:out};
}

const prep=[
 {id:'cut-print',title:'Print the four templates',text:'One of each prop is enough: the first circle and the first cane become the masters for the rest. Print the A4 pages at home, or the full-size PDFs at a copy shop (the circle needs A0). Print at 100% and check the 100 mm bar with a ruler.'},
 {id:'cut-tape',title:'Tape the A4 pages together',text:'Trim each page on its grey frame and lay its edge on the red dashed line of the next page (A1 next to A2, A1 above B1). Skip this if the copy shop printed them in one piece.'},
 {id:'cut-tools',title:'Put the tools ready',text:`The FatMax knife with a fresh trapezoid blade, the steel ruler, the drill with the ${HOLE} mm step drill and a 5 mm bit, the spray adhesive, a fine marker and a scrap board to cut on.`},
 {id:'cut-flutes',title:'Find the flute direction on three sheets',text:'Look at the edge of each sheet: the channels run one way. Mark it with an arrow in a corner. Every prop is laid with its up-down along the flutes.'},
 {id:'cut-test',title:'Drill a test hole in an offcut',text:`Push in a pixel you already have. It should click in and hold. Too tight: go up half a step. Loose: use a ${HOLE} mm brad-point bit instead. Settle this before the ${CORO_HOLES} holes.`},
].map(t=>task(t.id.replace('cut-',''),t.title,t.text));

const finish=[{id:'check',title:'Count and stack the pieces',
 text:`You should have ${CORO_PROPS.map(p=>`${p.cut} ${lower(p.title)}${p.cut>1?'s':''}`).join(', ').replace(/, ([^,]*)$/,' and $1')}. Check each one has its holes and a pixel 1 arrow, then stack them flat until the pixels go in.`}].map(t=>task(t.id,t.title,t.text));

export const CUTTING_STEPS=[
 {id:'ready',title:'Get ready',intro:'Once, before the first sheet.',sheet:null,tasks:prep},
 ...CUT_PIECES.map(pieceSteps),
 {id:'finish',title:'Finish',intro:'When the last cane is cut.',sheet:null,tasks:finish},
];
export const CUTTING_TICK_IDS=CUTTING_STEPS.flatMap(s=>s.tasks.map(t=>`${CUTTING_KEY}/${s.id}/${t.id}`));
