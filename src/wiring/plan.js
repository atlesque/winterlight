import {estimate,ALL,ZONES,GROUP_LIST,DEFAULTS} from '../costs/estimate.js';
import {PRICES as P,WATTS_PER_PIXEL,PSU_WATTS,PSU_LOAD,PORT_PIXELS,PORTS_PER_CONTROLLER,INJECT_EVERY} from '../costs/catalog.js';
import {OWN_CHANNELS} from '../props.js';
import {HOUSE} from '../house.js';

// The wiring plan: how the full show is connected, read from the cost model
// (src/costs/estimate.js) so the 3D model's wiring layer, the wiring page and
// the shopping list all agree. Each zone has one box with a controller and its
// power supplies; every prop group is one chain on one controller port, wired
// from the box to the first prop and prop to prop; a chain gets power injected
// every INJECT_EVERY pixels. The show computer and switch sit indoors, and a
// network cable and a 230 V feed run from there to each box.
const FULL=estimate(ALL,DEFAULTS);
const byId=Object.fromEntries(OWN_CHANNELS.map(c=>[c.id,c]));
const round1=v=>Math.round(v*10)/10;

// One colour per controller port, shared by the 3D model and the diagram.
export const PORT_COLORS=['#f6c75a','#5ec8f0','#b48cff','#ff8fb1','#7ee081','#ff9d4d','#4fd1c5','#e6e96b','#9fb4ff','#f07167'];
export const WIRE_COLORS={power:'#ff4d3d',network:'#4a9dff',mains:'#ff9a2e'};
// Where the cables leave the house: the garage, at the corner next to the facade box.
export const HUB={name:'Indoors',where:'in the garage (the plan has no spot for it yet)',entry:[HOUSE.garageWidth+.05,.25,.03],
 parts:[`Raspberry Pi 5 with Falcon Player (FPP)`,'5-port network switch','230 V sockets for the boxes']};

// Cables follow the walls and the ground in straight runs: on the facade they
// go up first, then across; in the garden they drop to the ground, run along
// it and come back up to the prop.
const WALL_Z=.03,GROUND_Y=.04;
const same=(a,b)=>a.every((v,j)=>Math.abs(v-b[j])<1e-6);
const clean=points=>points.filter((p,i)=>!i||!same(p,points[i-1]));
export function route(a,b){
 if(a[2]<.5&&b[2]<.5)return clean([a,[a[0],a[1],WALL_Z],[a[0],b[1],WALL_Z],[b[0],b[1],WALL_Z],b]);
 return clean([a,[a[0],GROUND_Y,a[2]],[a[0],GROUND_Y,b[2]],[b[0],GROUND_Y,b[2]],b]);
}
const pathLength=points=>points.slice(1).reduce((s,p,i)=>s+Math.hypot(...p.map((v,j)=>v-points[i][j])),0);
// The garden box is reached over the front door, as the runbook's lead from the garage is.
const OVER_DOOR=2.55,GARDEN_X=HOUSE.entry.maxX+.1;
function feed(zone,offset=0){
 const e=[HUB.entry[0]+offset,HUB.entry[1],HUB.entry[2]],box=ZONES[zone].box;
 if(zone==='facade')return clean([e,[e[0],box[1]+offset,WALL_Z],[box[0],box[1]+offset,WALL_Z],box]);
 return clean([e,[e[0],OVER_DOOR+offset,WALL_Z],[GARDEN_X+offset,OVER_DOOR+offset,WALL_Z],[GARDEN_X+offset,GROUND_Y,WALL_Z],[GARDEN_X+offset,GROUND_Y,box[2]],box]);
}

function buildZone(id,firstColor){
 const zone=ZONES[id],z=FULL.zones[id],box=zone.box;
 const groups=FULL.groups.filter(g=>g.zone===id&&g.props.length);
 // Each group is one chain on its own port, in the order the cost page lists them.
 const ports=groups.map((g,i)=>{
  const meta=GROUP_LIST.find(x=>x.id===g.id);
  let from=box,index=0;const segments=[],props=[];
  for(const p of g.props){
   const c=byId[p.id];
   segments.push(route(from,c.bulbs[0].pos));from=c.bulbs.at(-1).pos;
   props.push({id:p.id,name:p.name,pixels:p.pixels,run:p.run,first:index});index+=p.pixels;
  }
  // Power is injected at every INJECT_EVERY-th pixel along the chain.
  const bulbs=g.props.flatMap(p=>byId[p.id].bulbs.map(b=>b.pos));
  const injections=Array.from({length:Math.floor((g.pixels-1)/INJECT_EVERY)},(_,k)=>{
   const at=(k+1)*INJECT_EVERY,prop=props.findLast(p=>p.first<=at);return {at,pos:bulbs[at],prop:prop.name};});
  return {n:i+1,group:g.id,name:meta.name,color:PORT_COLORS[(firstColor+i)%PORT_COLORS.length],pixels:g.pixels,
   load:g.pixels/PORT_PIXELS,cable:g.props.reduce((s,p)=>s+p.run,0),props,segments,injections,watts:round1(g.pixels*WATTS_PER_PIXEL)};
 });
 // Power supplies share the ports: the biggest chain goes to the least loaded supply.
 const psus=Array.from({length:z.psus},(_,i)=>({n:i+1,ports:[],pixels:0}));
 for(const port of [...ports].sort((a,b)=>b.pixels-a.pixels)){
  const psu=psus.reduce((m,s)=>s.pixels<m.pixels?s:m);psu.ports.push(port.n);psu.pixels+=port.pixels;port.psu=psu.n;
 }
 for(const s of psus){s.ports.sort((a,b)=>a-b);s.watts=round1(s.pixels*WATTS_PER_PIXEL);s.load=s.watts/PSU_WATTS;}
 for(const port of ports)for(const inj of port.injections){inj.psu=port.psu;inj.path=route(box,inj.pos);}
 const network=feed(id),mains=feed(id,.06);
 return {id,name:zone.name,where:zone.where,box,pixels:z.pixels,watts:round1(z.pixels*WATTS_PER_PIXEL),
  controllers:z.controllers,portsFree:z.controllers*PORTS_PER_CONTROLLER-ports.length,boxes:z.boxes,
  ports,psus,network:{path:network,length:Math.ceil(pathLength(network)+1)},mains:{path:mains,length:Math.ceil(pathLength(mains)+1)}};
}

const facade=buildZone('facade',0);
export const WIRING={
 hub:HUB,
 zones:[facade,buildZone('garden',facade.ports.length)],
 pixels:FULL.pixels,watts:FULL.watts,
 parts:{controller:P.controller.name,psu:P.psu.name,psuWatts:PSU_WATTS,psuLoad:PSU_LOAD,portPixels:PORT_PIXELS,injectEvery:INJECT_EVERY,player:P.player.name,enclosure:P.enclosure.name},
};
export const LONGEST_RUN=Math.max(...WIRING.zones.flatMap(z=>z.ports.flatMap(p=>p.props.map(x=>x.run))));
