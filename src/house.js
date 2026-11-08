// Metres, street-facing facade at z=0; x=0..8.5 is this property only.
// Frontage/openings follow the supplied 2021 plan. The heights, the forecourt
// depth and the planting tiles were taped on 8 Nov 2026 (the measure page, D1);
// the guesses they replaced are kept in src/measures/measures.js.
export const HOUSE = {
  width:8.5, depth:11.6, garageWidth:3.1, garageDepth:6.6,
  eaves:5.5, ridge:8.3, garageHeight:2.92, forecourtDepth:3.91,
  garage:{x:1.55,width:2.5,height:2.12},
  door:{x:4.7,width:1.1,height:2.1},
  // Upstairs: top 5.15 m, sill 3.65 m (door top 2.10 + letter band 1.55). The
  // ground-floor windows' tops are taken level with the door's.
  windows:[{x:4.45,y:4.4,width:1.4,height:1.5},{x:6.8,y:4.4,width:1.4,height:1.5},{x:6.8,y:1.495,width:1.4,height:1.21},{x:3.55,y:1.72,width:.3,height:.76}],
  driveway:{minX:0,maxX:3.35}, entry:{minX:4,maxX:5.5},
  // Concrete mailbox at the street edge, between the two clear access corridors.
  mailbox:{x:3.7,z:3.685,width:.56,depth:.45,height:1.05},
  garden:{minX:5.65,maxX:8.5,minZ:.25,maxZ:3.61},
  // Four square cut-outs in the slate paving, read from the street photo:
  // a 2x2 grid right of the door. Each holds a full variegated shrub clipped
  // into a cube (bush = width and height). The gaps between the tiles (76 cm
  // across, 80 cm front to back) and the bush tops (60 cm) are measured; the
  // left tiles stay clear of the entrance path and the back ones 20 cm short of the canes.
  planters:{size:.8,bush:.6,tiles:[
    {x:6.03,z:1.31},{x:7.59,z:1.31},{x:6.03,z:2.91},{x:7.59,z:2.91},
  ]},
};
// Where the original house's props sit on ours (see src/props.js). Facade
// props hang on the front wall: an icicle strip along the top of the upper
// windows and one under the garage eave, outlines round the ground-floor
// openings and garage, the letters in the band between the door and the
// upper windows, a circle in one pane of each upper window and the peace sign
// on the front door. In the
// garden the tree stands between the planting tiles, the mini trees on top of
// the four clipped bushes (the bushes hid them when they stood behind), the canes along the street edge and the ground
// strip along the left side and front of the shrubbery.
const tick=(from,to,n)=>Array.from({length:n},(_,i)=>+(from+(to-from)*i/(n-1)).toFixed(3));
const UPPER=HOUSE.windows.slice(0,2);
export const PROP_LAYOUT = {
  // The upper icicle strip runs along the top edge of the two upper windows, from the
  // left one's frame to the right one's, in front of their glass; the lower one under the garage eave.
  upper:{from:+(UPPER[0].x-UPPER[0].width/2-.09).toFixed(3),to:+(UPPER[1].x+UPPER[1].width/2+.09).toFixed(3),y:+(UPPER[0].y+UPPER[0].height/2+.13).toFixed(3),z:.22},
  eaves:{garage:{from:-.05,to:3.15,y:2.86},z:.09},
  outlines:{z:.27},
  // ProPixeler's 30 cm coro letters (propixeler.nl), bought ready-made.
  letters:{text:'HAPPY HOLIDAYS',from:3.2,to:8.4,y:2.875,height:.3,z:.07},
  // Each upper window has two panes; a wreath fills one pane, clear of the sill.
  wreaths:{'wreath-left':{x:4.1,y:4.4,radius:.27,z:.26},'wreath-right':{x:7.15,y:4.4,radius:.27,z:.26}},
  // The peace sign hangs on the front door at eye height, in front of its upper glass and clear of the handle.
  peace:{x:HOUSE.door.x,y:1.62,radius:.25,z:.27},
  tree:{x:6.81,z:2.11,radius:.42,height:2.5,star:{radius:.2,gap:.06}},
  canes:{xs:tick(5.75,8.34,8),z:3.51,height:.6,hook:.12},
  // Eleven short trees standing on the bush tops: a row of three across each
  // bush, two on the back right one. Listed left to right so chases still run across.
  minitrees:{height:.55,radius:.08,spots:HOUSE.planters.tiles.flatMap((t,i)=>(i===1?[-.15,.15]:[-.22,0,.22]).map(dx=>({x:+(t.x+dx).toFixed(3),z:t.z,y:+(.037+HOUSE.planters.bush).toFixed(3)}))).sort((a,b)=>a.x-b.x||a.z-b.z)},
  fence:{path:[[5.58,.3,.3],[5.58,.3,3.66],[8.5,.3,3.66]]},
};
