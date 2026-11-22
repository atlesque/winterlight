import {PROP_LAYOUT as L} from '../house.js';
import {OWN_CHANNELS} from '../props.js';
// The PETG parts still to print on the Bambu Lab A1 (3D prints page, print.html):
// the frames, hubs and weighted feet the garden props stand on. The facade props hang on
// coro and ready-made letters, so they have nothing to print. Each part has an
// OpenSCAD source in tools/print/; `node tools/print/make.mjs` renders the STLs
// into outputs/print/ with the sizes below, read off the same model as the show.
export const BED={name:'Bambu Lab A1',x:256,y:256,z:256};
export const FILAMENT={name:'Bambu Lab PETG Basic',density:1.27,rolls:6,grams:1000};
// Slicer settings (Bambu Studio). The standard set is for the 0.4 mm nozzle the A1
// ships with; the fast set swaps in the 0.6 mm nozzle, which cuts the print time by
// about 40%. Three walls of a 0.6 mm line make the same 1.8 mm wall as four of 0.4 mm.
// The cane bases and post feet hide behind their bricks, so they print coarser.
export const SETTINGS=[
 ['Filament','Bambu PETG Basic profile'],
 ['Plate','Textured PEI, no glue (glue stick on the smooth plate)'],
 ['Layers','0.2 mm (Standard)'],
 ['Walls','4 loops, 5 top and bottom layers'],
 ['Infill','25% gyroid'],
 ['Supports','None, every part is drawn as it prints'],
 ['Brim','Only on the star holder (5 mm): it stands 152 mm tall on its sleeve'],
];
export const NOZZLES=[
 {id:'n04',name:'0.4 mm nozzle',short:'0.4 mm',speed:1,rows:[
  {parts:'Frames, hubs, ring and posts',layer:'0.2 mm',walls:4,shells:5,infill:'25%'},
  {parts:'Cane bases and post feet',layer:'0.28 mm (Draft)',walls:3,shells:4,infill:'15%'}]},
 {id:'n06',name:'0.6 mm nozzle (fast)',short:'0.6 mm',speed:.6,rows:[
  {parts:'Frames, hubs, ring and posts',layer:'0.3 mm',walls:3,shells:4,infill:'25%'},
  {parts:'Cane bases and post feet',layer:'0.36 mm',walls:3,shells:3,infill:'15%'}]},
];
// The bases' coarser settings save about a quarter of their time.
export const BASE_PARTS=['cane-base','fence-foot'],BASE_SPEED=.75;
export const NOZZLE_STEPS=[
 'Let the hotend cool, open the front clip, pull the 0.4 mm hotend out and push the 0.6 mm one in. No tools needed.',
 'Set the nozzle to 0.6 mm on the printer\'s screen, so it matches the slicer.',
 'In Bambu Studio pick the "Bambu Lab A1 0.6 nozzle" printer, PETG Basic and the 0.30 mm Standard process; set walls, shells and infill from the table and save both rows as presets.',
 'Swap before the test plates, so they check the fits with the nozzle everything else prints with. Thicker lines can make the strip slots a little tighter.',
];
// A rough print speed for the plan, PETG on the 0.4 mm nozzle: Bambu Studio shows
// the real time per plate once it is sliced.
export const GRAMS_PER_HOUR=25;

// Measure these before printing; each part adds its own clearance (0.4 mm a side),
// so enter the size as measured.
export const MEASURE=[
 {what:'Tree pole',has:'1-inch galvanised pipe from Hubo, 33.7 mm',drawn:'32 mm',where:'pole_d in tree-crown.scad and tree-star-holder.scad',parts:'Crown hub, star holder',warn:'Too small: the hole comes out 33.2 mm. Measure the pipe and set pole_d before printing these two.'},
 {what:'Mounting strip',has:'LEDshows strip, arrived: 30 mm wide',drawn:'30 × 1.54 mm',where:'strip_w and strip_t in lib.scad',parts:'Every strip channel'},
 {what:'Coro',has:'3 mm sheets, arrived 19 Nov',drawn:'3 mm',where:'coro_t in cane-base.scad and tree-star-holder.scad',parts:'Cane base, star holder'},
 {what:'Paving brick',has:'Borrowed, or the Brico 22 × 11 × 7 cm brick',drawn:'22 × 11 × 8 cm',where:'brick_l, brick_w and brick_h in lib.scad',parts:'Cane base, post foot, weighted ring segment',note:'A 7 cm brick fits as it is.'},
];

const mm=v=>Math.round(v*1000);
const count=kind=>OWN_CHANNELS.filter(c=>c.kind===kind).length;
const fenceLength=L.fence.path.slice(1).reduce((t,p,i)=>t+Math.hypot(p[0]-L.fence.path[i][0],p[2]-L.fence.path[i][2]),0);
// A post every 75 cm or less along the ground strip, ends and corner included.
export const POST_SPACING=.75;
const fenceSegments=L.fence.path.slice(1).map((p,i)=>Math.ceil(Math.hypot(p[0]-L.fence.path[i][0],p[2]-L.fence.path[i][2])/POST_SPACING));
export const FENCE_POSTS=fenceSegments.reduce((a,b)=>a+b,0)+1;

const tree={r_base:mm(L.tree.radius),height:mm(L.tree.height)};
const mini={r_base:mm(L.minitrees.radius),height:mm(L.minitrees.height)};
// Spoke and strand cut lengths: from channel floor to channel floor along the slope.
const slope=(rise,run)=>Math.round(Math.hypot(rise,run)/10);
export const MINI_SPOKE_CM=slope(mini.height-3-4,mini.r_base-42),STRAND_CM=slope(tree.height-5-35,tree.r_base-100);

// The paving in front of the house is stone, so nothing stands on a stake:
// the tree, the canes and the ground strip stand on printed trays weighed down
// with concrete paving bricks, and the tree's pole in a parasol base. Only the
// mini trees, on top of the bushes, have something to push into.
export const BRICK={name:'Concrete paving brick (betonklinker), grey, 22 × 11 × 8 cm',size:[220,110,80],kg:4};
export const PARASOL={name:'Parasol base, about 30 kg, whose tube or clamp takes the 34 mm pole',kg:30};
const ringWeights=4;

// Props, each with the parts it needs. `params` go to OpenSCAD as -D overrides;
// `scad` names the source when a part shares one with another.
export const PRINT_PROPS=[
 {id:'minitrees',name:'Mini trees',count:count('minitree'),icon:'i-lucide-tree-pine',bricks:0,
  points:[`${count('minitree')} trees, each standing on top of a clipped bush`,`6 spokes of mounting strip, ${MINI_SPOKE_CM} cm each, between a printed base and top cap`,'A rod of about 1.2 m through the middle, down through the bush into the soil','Base ring tied to a couple of branches'],
  parts:[
   {id:'minitree-base',name:'Base ring',per:1,spare:1,params:{...mini},how:'Flat side down. Stand a spoke in each channel, drill 4.5 mm through the tie holes into the strip, and tie it through them.'},
   {id:'minitree-top',name:'Top cap',per:1,spare:1,params:{...mini},how:'Prints upside down. Push onto the rod, spokes into the channels, drill through the tie holes and tie.'},
  ]},
 {id:'tree',name:'Wireframe tree',count:1,icon:'i-lucide-triangle',bricks:ringWeights,
  points:[`Pole in a ${PARASOL.kg} kg parasol base, cut to about 2.6 m`,`${count('treeStrip')} strands of mounting strip, about ${STRAND_CM} cm each, from a ring on the ground up to a crown hub`,`The ring is ${count('treeStrip')} puzzle segments, ${mm(L.tree.radius)*2/10} cm across; ${ringWeights} of them hold a brick`,'The base and bricks hold it to about 60 km/h; four guy lines from the hub to the planting tiles\' soil hold it in a storm','The coro star sits on a holder on top of the pole'],
  parts:[
   {id:'tree-crown',name:'Crown hub',per:1,spare:0,params:{...tree},how:'Prints upside down. Slide onto the pole to 2.5 m and bolt or tie it.'},
   {id:'tree-star-holder',name:'Star holder',per:1,spare:0,params:{},how:'Push onto the pole top; tie the star into the slot.'},
   {id:'tree-ring',name:'Ring segment',per:count('treeStrip')-ringWeights,spare:1,params:{...tree},how:'Puzzle the segments into a ring round the parasol base.'},
   {id:'tree-ring-weight',scad:'tree-ring',name:'Ring segment with brick tray',per:ringWeights,spare:0,params:{...tree,weighted:true},how:'Same, with a tray for one brick. Put these front, back, left and right.'},
  ]},
 {id:'canes',name:'Candy canes',count:count('cane'),icon:'i-lucide-candy-cane',bricks:2*count('cane'),
  points:[`${count('cane')} coro canes along the street edge`,'Each in a base holding two bricks (about 8 kg)','The stem sits in a slot between the bricks'],
  parts:[
   {id:'cane-base',name:'Cane base',per:1,spare:0,params:{},how:'A brick each side of the rib, the cane\'s stem and its aluminium stiffener in the slot, tied.'},
  ]},
 {id:'fence',name:'Ground strip',count:1,icon:'i-lucide-fence',bricks:FENCE_POSTS,
  points:[`${(Math.round(fenceLength*100)/100).toFixed(2)} m along the left side and front of the shrubbery, ${mm(L.fence.path[0][1])/10} cm up`,`${FENCE_POSTS} posts, at most ${POST_SPACING*100} cm apart`,'Each post stands in a foot holding one brick, hidden behind the strip'],
  parts:[
   {id:'fence-foot',name:'Post foot',per:FENCE_POSTS,spare:0,params:{},how:'A brick in the tray, behind the strip.'},
   {id:'fence-post',name:'Post',per:FENCE_POSTS,spare:1,params:{strip_y:mm(L.fence.path[0][1])},how:'Lies on its side. Push into the foot; strip in the slot, face out.'},
  ]},
];
export const PARTS=PRINT_PROPS.flatMap(p=>p.parts.map(x=>({...x,scad:x.scad??x.id,prop:p.id,qty:x.per*p.count+x.spare})));
export const BRICKS=PRINT_PROPS.reduce((s,p)=>s+p.bricks,0);

// The print queue, one step per kind of plate, easiest and surest first: small
// flat parts whose fit only the strip decides, then the parts that wait on the
// pole's size, then everything that holds a brick, once a brick is measured.
// Parts that fit the 256 mm bed together share a plate. `needs` names what to
// measure before that step; its `plates` are printed one by one and ticked off.
const times=(n,parts)=>Array.from({length:n},()=>parts);
export const PLATES=[
 {id:'test-mini',name:'Test plate: one mini tree',plates:times(1,{'minitree-base':1,'minitree-top':1}),when:'First',test:true,
  why:'Small and quick, and it checks the two fits most parts share: the mounting strip should sit snugly in a channel and lock with a cable tie through the holes in its back, and a bamboo cane should go through the rod hole. If both fit, print everything else as it is.'},
 {id:'minitree',name:'Mini trees',plates:times(11,{'minitree-base':1,'minitree-top':1}),when:'By 28 Nov',
  why:'The other 11 base rings and top caps: a short plate each, flat on the bed, nothing to measure.'},
 {id:'post',name:'Ground strip posts',plates:[{'fence-post':6},{'fence-post':5}],when:'By 28 Nov',
  why:'The posts lie flat, six to a plate. Each only plugs into its foot\'s socket, so the brick doesn\'t matter: 10 needed and a spare.'},
 {id:'ring',name:'Tree ring segments',plates:[{'tree-ring':5},{'tree-ring':5},{'tree-ring':3}],when:'By 28 Nov',
  why:'The plain segments of the tree\'s base ring, five to a plate: 12 needed and a spare.'},
 {id:'hub',name:'Crown hub and star holder',plates:[{'tree-crown':1},{'tree-star-holder':1}],when:'By 28 Nov',needs:'pole',
  why:'Both slide over the pole. Measure the pipe first and set pole_d in both files to its size: as drawn (32 mm) the hole is too small for 1-inch pipe. Brim on the star holder. With the 30 mm strip the hub is too wide to share a plate, so they print one after the other.'},
 {id:'test-foot',name:'Test plate: one post foot',plates:times(1,{'fence-foot':1}),when:'Once the brick is known',test:true,needs:'brick',
  why:'Checks that the brick drops into a tray and that a post fits the socket. If the brick isn\'t 22 × 11 cm or less, change brick_l, brick_w and brick_h in lib.scad and export this and the next steps again.'},
 {id:'ring-weight',name:'Ring segments with brick tray',plates:times(4,{'tree-ring-weight':1}),when:'By 4 Dec',needs:'brick',
  why:'The four segments that each hold a brick: front, back, left and right of the tree.'},
 {id:'foot',name:'Post feet',plates:times(9,{'fence-foot':1}),when:'By 4 Dec',needs:'brick',
  why:'The other nine feet, one brick each. Hidden behind the strip, so they print coarser.'},
 {id:'cane',name:'Cane bases',plates:times(8,{'cane-base':1}),when:'By 4 Dec',needs:'brick',
  why:'The biggest prints, nearly the whole bed, two bricks each. Run them overnight.'},
];
// Each plate is a task of its step: task id `p<n>`, saved by the step guide as
// print/<stepId>/<taskId> (storageKey 'print'), which the site's Worker accepts.
export const plateTaskId=i=>`p${i+1}`;
export const PRINT_TICK_IDS=PLATES.flatMap(s=>s.plates.map((_,i)=>`print/${s.id}/${plateTaskId(i)}`));
