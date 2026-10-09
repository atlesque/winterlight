// The original filmed house, described once in the coordinates of a reference
// still (1295 × 604 px, the all-on final frame). Both the 3D model and the
// video detector (tools/original/detect.py) are derived from these channels,
// so a prop that moves here moves in both.
//
// The reference still is a 2× crop of the video: video960 = ref × 0.5 + (163, 64)
// on a 960 × 540 frame. Checked against the wreath, lettering, cane and tree
// sample points already used by outputs/source-mapping.json.
export const REFERENCE={width:1295,height:604,toVideo960:{scale:.5,offset:[163,64]},video:{width:960,height:540}};
// Facade metres: about 62 px per metre at the house front, origin at the
// front door's ground line.
export const PX_PER_M=62,ORIGIN=[505,450];
export const toMeters=(x,y)=>[(x-ORIGIN[0])/PX_PER_M,(ORIGIN[1]-y)/PX_PER_M];

// Multicolour strips carry alternating yellow and blue bulbs, so a channel can
// be off, yellow, blue or both. Single-colour props are simply on or off.
export const MULTI={1:'yellow',2:'blue',3:'both'};
export const COLORS={yellow:'#ffc860',blue:'#3d6bff',red:'#ff2a1e',green:'#27e06a',warm:'#ffd690'};

export const PROPS=[
 {id:'upper',name:'Upper floor strip',addressing:'one channel'},
 {id:'lower',name:'Lower floor strip',addressing:'one channel'},
 {id:'windows',name:'Window strips',addressing:'one group'},
 {id:'letters',name:'HAPPY HOLIDAYS letters',addressing:'per letter'},
 {id:'wreaths',name:'Christmas circles',addressing:'per circle'},
 {id:'canes',name:'Candy canes',addressing:'per cane'},
 {id:'minitrees',name:'Mini trees',addressing:'per tree'},
 {id:'fence',name:'Ground strip (30 cm)',addressing:'one channel'},
 {id:'peace',name:'Peace sign',addressing:'one channel'},
 {id:'tree',name:'Wireframe tree',addressing:'per vertical strip + star'},
];

const LETTERS='HAPPY HOLIDAYS',LETTER_COLORS=['red','green','yellow'];
const CANES=[412,428,468,488,510,526,548,600];
const MINITREES=[612,642,672,702,732,762,792,822,852,882];
export const TREE={apex:[985,135],base:[997,455],halfWidth:97,star:[980,118],starRadius:20,strips:16,depth:1.5};

function build(){
 const list=[];
 const add=(prop,id,name,kind,palette,roi,model={})=>list.push({id,prop,name,kind,palette,roi,model});
 add('upper','upper','Upper floor strip','strip','multi',{lines:[[[128,150],[245,72],[385,128]],[[385,128],[655,128]],[[655,125],[790,52],[925,122]],[[250,72],[785,60]]],width:10},{icicles:[1,1,1,0],lineZ:[-.9,-.9,-.9,-5.4]});
 add('lower','lower','Lower floor strip','strip','multi',{lines:[[[85,265],[690,265]],[[150,232],[690,232]],[[690,272],[905,272]]],width:10},{icicles:[1,0,1],lineZ:[.15,-.95,.15]});
 add('windows','windows','Window strips','strip','multi',{lines:[[[157,150],[157,240]],[[358,132],[358,240]],[[686,150],[686,250]],[[893,135],[893,250]],[[95,275],[95,440]],[[462,300],[462,392]],[[680,285],[680,382]],[[905,282],[905,440]]],width:8},{lineZ:[-.9,-.9,-.9,-.9,.15,.15,.15,.15]});
 // Letters hang under the middle eave; 13 letters plus one gap across 405–650 px.
 const slot=(650-405)/LETTERS.length;let n=0;
 [...LETTERS].forEach((ch,i)=>{if(ch===' ')return;const x=405+slot*(i+.5);n++;
  add('letters',`letter-${String(n).padStart(2,'0')}`,`Letter ${n} · ${ch}`,'letter',LETTER_COLORS[(n-1)%3],{box:[x-slot*.42,186,x+slot*.42,216]},{char:ch,x,y:201,w:slot*.84,h:30});});
 add('wreaths','wreath-left','Left circle','wreath','green',{ring:[260,183,30],width:10},{bow:[260,215]});
 add('wreaths','wreath-right','Right circle','wreath','green',{ring:[790,172,30],width:10},{bow:[790,204]});
 CANES.forEach((x,i)=>{const hook=i%2?-1:1;
  add('canes',`cane-${i+1}`,`Candy cane ${i+1}`,'cane','red',{lines:[[[x,450],[x,412],[x+hook*5,404],[x+hook*10,410]]],width:6},{x,hook,z:2.6,height:.75});});
 MINITREES.forEach((x,i)=>add('minitrees',`minitree-${i+1}`,`Mini tree ${i+1}`,'minitree','red',{poly:[[x,402],[x-13,486],[x+13,486]]},{x,z:3.1,height:.8,radius:.22}));
 add('fence','fence','Ground strip','strip','multi',{lines:[[[318,472],[392,440]],[[330,495],[1240,495]],[[1105,445],[1245,472]]],width:16},{path3d:[[-3,.4,.6],[-3,.4,4.6],[12,.4,4.6],[12,.4,1]]});
 add('peace','peace','Peace sign','peace','yellow',{ring:[788,365,35],lines:[[[788,330],[788,400]],[[788,365],[763,390]],[[788,365],[813,390]]],width:7},{z:.7});
 for(let k=0;k<TREE.strips;k++){
  // Strip k sits at angle θ around the cone. θ and π−θ project onto the same
  // line from the camera, so those front/back pairs share one detection line.
  const theta=2*Math.PI*k/TREE.strips,s=Math.sin(theta),bx=TREE.base[0]+TREE.halfWidth*s;
  add('tree',`tree-${String(k+1).padStart(2,'0')}`,`Tree strip ${k+1}`,'treeStrip','yellow',{lines:[[[TREE.apex[0]+(bx-TREE.apex[0])*.3,TREE.apex[1]+(TREE.base[1]-TREE.apex[1])*.3],[bx,TREE.base[1]-6]]],width:5},{theta});
 }
 add('tree','tree-star','Tree star','star','yellow',{ring:[...TREE.star,TREE.starRadius*.7],width:12});
 return list;
}
export const CHANNELS=build();
export const CHANNEL_INDEX=new Map(CHANNELS.map((c,i)=>[c.id,i]));
