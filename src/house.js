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
};
export const PROP_LAYOUT = {
  arches:{centers:[6.3,7.7,6.3,7.7],radius:.5,z:[2.85,2.85,3.6,3.6]},
  stars:{centers:[6.25,7.85],z:1.15},
};
export const BANK_POSITIONS = {A:[5.9,.24,.34],B:[8.2,.24,.34],C:[7.05,.24,.34]};
