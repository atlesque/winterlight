// Metres, street-facing facade at z=0; x=0..8.5 is this property only.
// Frontage/openings follow the supplied 2021 plan. Heights and forecourt
// depth are visual estimates because the scan does not dimension them.
export const HOUSE = {
  width:8.5, depth:11.6, garageWidth:3.1, garageDepth:6.6,
  eaves:5.5, ridge:8.3, garageHeight:2.8, forecourtDepth:4.2,
  garage:{x:1.55,width:2.5,height:2.25},
  door:{x:4.7,width:1.1,height:2.3},
  windows:[{x:4.45,y:4.15,width:1.4,height:1.4},{x:6.8,y:4.15,width:1.4,height:1.4},{x:6.8,y:1.6,width:1.4,height:1.4},{x:3.55,y:1.75,width:.3,height:.7}],
  driveway:{minX:0,maxX:3.35}, entry:{minX:4,maxX:5.5},
  // Concrete mailbox at the street edge, between the two clear access corridors.
  mailbox:{x:3.7,z:3.975,width:.56,depth:.45,height:1.05},
  garden:{minX:5.65,maxX:8.5,minZ:.25,maxZ:3.9},
  // Four square cut-outs in the slate paving, read from the street photo:
  // a 2x2 grid right of the door. Each holds a full variegated shrub clipped
  // into a cube (bush = width and height). Positions are photo estimates.
  planters:{size:.8,bush:.72,tiles:[
    {x:6.03,z:1.55},{x:7.45,z:1.55},{x:6.03,z:3.2},{x:7.45,z:3.2},
  ]},
};
// Where the original house's props sit on ours (see src/props.js). Facade
// props hang on the front wall: eave strips, outlines round the ground-floor
// openings and garage, the letters in the band between the door and the
// upper windows, and one circle or peace sign per upper window pane. In the
// garden the tree stands between the planting tiles, the mini trees between
// the facade and the tiles, the canes along the street edge and the ground
// strip along the left side and front of the shrubbery.
const tick=(from,to,n)=>Array.from({length:n},(_,i)=>+(from+(to-from)*i/(n-1)).toFixed(3));
export const PROP_LAYOUT = {
  eaves:{main:{from:3.05,to:8.55,y:5.42},garage:{from:-.05,to:3.15,y:2.74},z:.09},
  outlines:{z:.27},
  letters:{text:'HAPPY HOLIDAYS',from:3.2,to:8.4,y:2.9,height:.42,z:.07},
  // Each upper window has two panes; a prop fills one pane, clear of the sill.
  wreaths:{'wreath-left':{x:4.1,y:4.15,radius:.27,z:.26},'wreath-right':{x:7.15,y:4.15,radius:.27,z:.26}},
  peace:{x:6.45,y:4.15,radius:.27,z:.26},
  tree:{x:6.74,z:2.375,radius:.42,height:2.5,star:{radius:.2,gap:.06}},
  canes:{xs:tick(5.75,8.34,8),z:3.8,height:.6,hook:.12},
  minitrees:{xs:tick(5.8,8.35,11),z:.75,height:1,radius:.1},
  fence:{path:[[5.58,.3,.3],[5.58,.3,3.95],[8.5,.3,3.95]]},
};
