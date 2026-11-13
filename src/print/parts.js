import {PROP_LAYOUT as L} from '../house.js';
import {OWN_CHANNELS} from '../props.js';
// The PETG parts still to print on the Bambu Lab A1 (3D prints page, print.html):
// the frames, hubs and weighted feet the garden props stand on. The facade props hang on
// coro and ready-made letters, so they have nothing to print. Each part has an
// OpenSCAD source in tools/print/; `node tools/print/make.mjs` renders the STLs
// into outputs/print/ with the sizes below, read off the same model as the show.
export const BED={name:'Bambu Lab A1',x:256,y:256,z:256};
export const FILAMENT={name:'Bambu Lab PETG Basic',density:1.27,rolls:6,grams:1000};
// Slicer settings for every part (Bambu Studio, 0.4 mm nozzle).
export const SETTINGS=[
 ['Filament','Bambu PETG Basic profile'],
 ['Plate','Textured PEI, no glue (glue stick on the smooth plate)'],
 ['Layers','0.2 mm (Standard)'],
 ['Walls','4 loops, 5 top and bottom layers'],
 ['Infill','25% gyroid'],
 ['Supports','None, every part is drawn as it prints'],

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
export const MINI_SPOKE_CM=slope(mini.height-3-4,mini.r_base-34),STRAND_CM=slope(tree.height-5-35,tree.r_base-88);

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
   {id:'minitree-base',name:'Base ring',per:1,spare:1,params:{...mini},how:'Flat side down. Stand a spoke in each channel and tie it.'},
   {id:'minitree-top',name:'Top cap',per:1,spare:1,params:{...mini},how:'Prints upside down. Push onto the rod, spokes into the channels, tie.'},
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
