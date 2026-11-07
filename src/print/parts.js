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
 ['Filament','Bambu PETG Basic, the system profile'],
 ['Plate','Textured PEI, no glue. On the smooth plate, a thin layer of glue stick so the PETG lets go.'],
 ['Layers','0.2 mm (Standard)'],
 ['Walls','4 loops, 5 top and bottom layers'],
 ['Infill','25% gyroid'],
 ['Supports','None. Every part is drawn in the orientation it prints in.'],
 ['Cooling','The PETG profile as it is; open the door a crack if the room is warm'],
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
export const PARASOL={name:'Granite parasol base, 30 kg, with a tube clamp for 25–50 mm poles',kg:30};
const ringWeights=4;

// Props, each with the parts it needs. `params` go to OpenSCAD as -D overrides;
// `scad` names the source when a part shares one with another.
export const PRINT_PROPS=[
 {id:'minitrees',name:'Mini trees',count:count('minitree'),icon:'i-lucide-tree-pine',bricks:0,
  about:`Each of the ${count('minitree')} mini trees is six spokes of pixel mounting strip, ${MINI_SPOKE_CM} cm long, standing in a printed base ring and leaning in to a printed top cap. They stand on top of the clipped bushes, the one place with something to push into: an 8 mm rod (a garden cane or fibreglass rod, about 70 cm) runs through both caps, stiffens the tree and goes 15 cm down into the bush, and two cable ties hold the base ring to the branches.`,
  parts:[
   {id:'minitree-base',name:'Base ring',per:1,spare:1,params:{...mini},how:'Flat side down. Stand a spoke in each channel, face out, and pull a cable tie round the groove.'},
   {id:'minitree-top',name:'Top cap',per:1,spare:1,params:{...mini},how:'Prints upside down: the flat top on the plate. Push it onto the rod and the spokes into its channels, then tie them.'},
  ]},
 {id:'tree',name:'Wireframe tree',count:1,icon:'i-lucide-triangle',bricks:ringWeights,
  about:`The pole stands in a ${PARASOL.kg} kg parasol base on the paving between the planting tiles, cut so its top is about 2.6 m up. ${count('treeStrip')} strands of mounting strip, about ${STRAND_CM} cm each, run from a printed ring on the ground, ${mm(L.tree.radius)*2/10} cm across, up to a crown hub on the pole. The ring is ${count('treeStrip')} segments that puzzle together; ${ringWeights} of them carry a paving brick, so the strands hold the pole up like guy lines and the bricks and the base hold the whole tree down. The coro star stands on the pole's top in a printed holder.`,
  parts:[
   {id:'tree-crown',name:'Crown hub',per:1,spare:0,params:{...tree},how:'Prints upside down, channels up. Slide it onto the pole, channels down, to 2.5 m above the ground and bolt it (M5) or tie it there. Drawn for a 32 mm pole: set pole_d to yours.'},
   {id:'tree-star-holder',name:'Star holder',per:1,spare:0,params:{},how:'Sleeve down. Push it onto the top of the pole, stand the star\'s bottom notch in the slot and tie it through two 5 mm holes drilled in the coro.'},
   {id:'tree-ring',name:'Ring segment',per:count('treeStrip')-ringWeights,spare:1,params:{...tree},how:'Flat side down. Puzzle the segments together round the parasol base, the weighted ones on the four sides between the bushes, and stand a strand in each channel.'},
   {id:'tree-ring-weight',scad:'tree-ring',name:'Ring segment with brick tray',per:ringWeights,spare:0,params:{...tree,weighted:true},how:'As the plain segment, with a tray outside the ring for one paving brick. Put these at the front, back, left and right, where there is room between the bushes.'},
  ]},
 {id:'canes',name:'Candy canes',count:count('cane'),icon:'i-lucide-candy-cane',bricks:2*count('cane'),
  about:`The ${count('cane')} coro canes stand along the street edge, each in a base that holds two paving bricks (about 8 kg) either side of a rib. The bottom of the cane's stem sits in a slot in the rib.`,
  parts:[
   {id:'cane-base',name:'Cane base',per:1,spare:0,params:{},how:'Flat side down. Lay a brick either side of the rib, drop the cane\'s stem into the slot, drill the coro through the two holes and tie it.'},
  ]},
 {id:'fence',name:'Ground strip',count:1,icon:'i-lucide-fence',bricks:FENCE_POSTS,
  about:`The ground strip runs ${(Math.round(fenceLength*100)/100).toFixed(2)} m along the left side and the front of the shrubbery, ${mm(L.fence.path[0][1])/10} cm up, on ${FENCE_POSTS} posts at most ${POST_SPACING*100} cm apart. Each post stands in a foot that holds one paving brick behind the strip, out of sight from the street.`,
  parts:[
   {id:'fence-foot',name:'Post foot',per:FENCE_POSTS,spare:0,params:{},how:'Flat side down, socket up. Lay a brick in the tray, behind the strip.'},
   {id:'fence-post',name:'Post',per:FENCE_POSTS,spare:1,params:{strip_y:mm(L.fence.path[0][1])},how:'Lies on its side. Push its tenon into the foot\'s socket and drop the strip in the slot face out; a cable tie round the top holds it.'},
  ]},
];
export const PARTS=PRINT_PROPS.flatMap(p=>p.parts.map(x=>({...x,scad:x.scad??x.id,prop:p.id,qty:x.per*p.count+x.spare})));
export const BRICKS=PRINT_PROPS.reduce((s,p)=>s+p.bricks,0);
