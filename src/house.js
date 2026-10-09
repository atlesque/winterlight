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
// Props modelled on the filmed original house. Facade props hang on the front
// wall; the wireframe tree stands in the cross-shaped gap between the four
// planting tiles, the mini trees in the band between the facade and the first
// tile row, and the candy canes along the street edge of the garden.
export const PROP_LAYOUT = {
  // Front edge of the eave trims (main house and garage), just under the gutter.
  eaves:{main:{from:3.05,to:8.55,y:5.42},garage:{from:-.05,to:3.15,y:2.74},z:.09},
  // HAPPY HOLIDAYS in the band between the upper windows and the eave.
  letters:{text:'HAPPY HOLIDAYS',from:3.4,to:8.2,y:5.16,height:.34,z:.07},
  // Upstairs, so the tree in front of the kitchen window hides neither: the
  // peace sign in the left window and a circle in the right one, both clear of
  // the sills; a smaller circle hangs on the front door.
  wreaths:[{x:6.8,y:4.15,radius:.42,z:.26},{x:4.7,y:1.72,radius:.22,z:.25}],
  peace:{x:4.45,y:4.15,radius:.5,z:.26},
  tree:{x:6.74,z:2.375,radius:.42,height:2.5,strips:16,star:{radius:.2,gap:.06}},
  canes:{xs:[5.8,6.3,6.8,7.3,7.8,8.3],z:3.78,height:.6},
  minitrees:{xs:[5.9,6.38,6.86,7.34,7.82,8.3],z:.75,height:1,radius:.17},
  // Cable corridors run street-ward through the gap between the tile columns
  // and the strip right of them, then along the clear band to each prop.
  corridors:[6.74,8.18],
};
export const BANK_POSITIONS = {A:[5.9,.24,.34],B:[8.2,.24,.34],C:[7.05,.24,.34]};
