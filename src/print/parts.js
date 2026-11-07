import {PROP_LAYOUT as L} from '../house.js';
import {OWN_CHANNELS} from '../props.js';
// The PETG parts still to print on the Bambu Lab A1 (3D prints page, print.html):
// the frames, hubs and stakes the garden props stand on. The facade props hang on
// coro and ready-made letters, so they have nothing to print. Each part has an
// OpenSCAD source in tools/print/; `node tools/print/make.mjs` renders the STLs
// into outputs/print/ with the sizes below, read off the same model as the show.
export const BED={name:'Bambu Lab A1',x:256,y:256,z:256};
export const FILAMENT={name:'Bambu Lab PETG Basic',density:1.27,rolls:6,grams:1000};
// Slicer settings for every part (Bambu Studio, 0.4 mm nozzle).
export const SETTINGS=[
 ['Filament','Bambu PETG Basic, the system profile'],
 ['Plate','Textured PEI, no glue. On the smooth plate, a thin layer of glue stick so the PETG lets go.'],
 ['Layers','0.2 mm (Standard)'],
 ['Walls','4 loops, 5 top and bottom layers'],
 ['Infill','25% gyroid; 40% for the stakes and pegs, which get hammered in'],
 ['Supports','None. Every part is drawn in the orientation it prints in.'],
 ['Cooling','The PETG profile as it is; open the door a crack if the room is warm'],
];

const mm=v=>Math.round(v*1000);
const count=kind=>OWN_CHANNELS.filter(c=>c.kind===kind).length;
const fenceLength=L.fence.path.slice(1).reduce((t,p,i)=>t+Math.hypot(p[0]-L.fence.path[i][0],p[2]-L.fence.path[i][2]),0);
// A post every 50 cm along the ground strip, ends and corner included.
const fenceSegments=L.fence.path.slice(1).map((p,i)=>Math.ceil(Math.hypot(p[0]-L.fence.path[i][0],p[2]-L.fence.path[i][2])/.5));
export const FENCE_POSTS=fenceSegments.reduce((a,b)=>a+b,0)+1;

const tree={r_base:mm(L.tree.radius),height:mm(L.tree.height)};
const mini={r_base:mm(L.minitrees.radius),height:mm(L.minitrees.height)};
// Spoke and strand cut lengths: from channel floor to channel floor along the slope.
const slope=(rise,run)=>Math.round(Math.hypot(rise,run)/10);
export const MINI_SPOKE_CM=slope(mini.height-3-4,mini.r_base-34),STRAND_CM=slope(tree.height-5-35,tree.r_base-88);

// Props, each with the parts it needs. `params` go to OpenSCAD as -D overrides.
export const PRINT_PROPS=[
 {id:'minitrees',name:'Mini trees',count:count('minitree'),icon:'i-lucide-tree-pine',
  about:`Each of the ${count('minitree')} mini trees is six spokes of pixel mounting strip, ${MINI_SPOKE_CM} cm long, standing in a printed base and leaning in to a printed top cap. An 8 mm rod (a garden cane or fibreglass rod, about 70 cm) runs through both, stiffens the tree and pushes into the clipped bush it stands on.`,
  parts:[
   {id:'minitree-base',name:'Base ring',per:1,spare:1,params:{...mini},how:'Flat side down. Stand a spoke in each channel, face out, and pull a cable tie round the groove.'},
   {id:'minitree-top',name:'Top cap',per:1,spare:1,params:{...mini},how:'Prints upside down: the flat top on the plate. Push it onto the rod and the spokes into its channels, then tie them.'},
  ]},
 {id:'tree',name:'Wireframe tree',count:1,icon:'i-lucide-triangle',
  about:`The ${count('treeStrip')} strands are mounting strip, about ${STRAND_CM} cm each, from a peg on the ${mm(L.tree.radius)*2/10} cm circle up to a crown hub on the 3 m pole. The coro star stands on the pole's top in a printed holder. Measure the pole and set pole_d before printing the hub and the holder (32 mm is a guess).`,
  parts:[
   {id:'tree-crown',name:'Crown hub',per:1,spare:0,params:{...tree},how:'Prints upside down, channels up. Slide it onto the pole, channels down, to 2.5 m above the ground and bolt it (M5) or tie it there.'},
   {id:'tree-star-holder',name:'Star holder',per:1,spare:0,params:{},how:'Sleeve down. Push it onto the top of the pole, stand the star in the slot and tie it through two 5 mm holes drilled in the coro.'},
   {id:'tree-peg',name:'Strand peg',per:count('treeStrip'),spare:2,params:{...tree},how:'Lies on its side. Hammer one in under each strand, pocket leaning towards the pole; drill the strip through the side hole and tie it so the strand can be pulled tight.'},
  ]},
 {id:'canes',name:'Candy canes',count:count('cane'),icon:'i-lucide-candy-cane',
  about:`The ${count('cane')} coro canes stand along the street edge, each in one stake that grips the bottom of its stem.`,
  parts:[
   {id:'cane-stake',name:'Cane stake',per:1,spare:1,params:{},how:'Lies on its side. Drop the cane\'s stem into the slot, drill the coro through the two holes and tie it. Push the stake in up to the head.'},
  ]},
 {id:'fence',name:'Ground strip',count:1,icon:'i-lucide-fence',
  about:`The ground strip runs ${(Math.round(fenceLength*100)/100).toFixed(2)} m along the left side and the front of the shrubbery, ${mm(L.fence.path[0][1])/10} cm up, on ${FENCE_POSTS} posts about 50 cm apart. Each post is two prints: a spike, and the post that slides over its tenon and holds the strip.`,
  parts:[
   {id:'fence-spike',name:'Post spike',per:FENCE_POSTS,spare:1,params:{},how:'Lies on its side. Hammer it in up to the shoulder.'},
   {id:'fence-post',name:'Post',per:FENCE_POSTS,spare:1,params:{strip_y:mm(L.fence.path[0][1])},how:'Lies on its side. Slide it over the spike\'s tenon, bolt or tie it through the two holes, and drop the strip in the slot face out.'},
  ]},
];
export const PARTS=PRINT_PROPS.flatMap(p=>p.parts.map(x=>({...x,prop:p.id,qty:x.per*p.count+x.spare})));
