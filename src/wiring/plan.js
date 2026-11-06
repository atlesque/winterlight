import {estimate,ALL,GROUP_LIST,ZONES,DEFAULTS} from '../costs/estimate.js';
import {PRICES as P,WATTS_PER_PIXEL,PSU_WATTS,PSU_LOAD,PORT_PIXELS,PORTS_PER_CONTROLLER,INJECT_EVERY} from '../costs/catalog.js';
import {OWN_CHANNELS} from '../props.js';

// The wiring plan: how the full show is connected, read from the cost model
// (src/costs/estimate.js) so the 3D model's wiring layer, the wiring page and
// the shopping list all agree. Each zone has one box with a controller and its
// power supplies; every prop group is one chain on one controller port, wired
// from the box to the first prop and prop to prop; a chain gets power injected
// every INJECT_EVERY pixels. Both boxes sit in the garage with the show
// computer and switch (the runbook's choice), so every chain leaves the garage
// through one hole next to the facade, and network and mains stay indoors.
const FULL=estimate(ALL,DEFAULTS);
const byId=Object.fromEntries(OWN_CHANNELS.map(c=>[c.id,c]));
const round1=v=>Math.round(v*10)/10;

// One colour per controller port, shared by the 3D model and the diagram.
export const PORT_COLORS=['#f6c75a','#5ec8f0','#b48cff','#ff8fb1','#7ee081','#ff9d4d','#4fd1c5','#e6e96b','#9fb4ff','#f07167'];
export const WIRE_COLORS={power:'#ff4d3d',network:'#4a9dff',mains:'#ff9a2e'};
// Where the cables leave the house: the garage, at the corner next to the facade box.
// Where the cables leave the garage: through the brick jamb right of the
// garage door, the cost model's start for every chain.
export const HUB={name:'Garage',where:'both boxes, the show computer and the switch',exit:ZONES.facade.box};

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
// Garden cables follow the cost model's lead: over the front door and down
// beside it, so the door and the path stay clear.
function fromGarage(zone,to,offset=0){
 const e=[HUB.exit[0],HUB.exit[1]+offset,HUB.exit[2]],via=ZONES[zone].via.map(([x,y,z],i,a)=>[x+(i?offset:0),i===a.length-1?y:y+offset,z]);
 if(!via.length)return route(e,to);
 return clean([e,...via,...route(via.at(-1),to).slice(1)]);
}

function buildZone(id,firstColor){
 const z=FULL.zones[id],box=HUB.exit;
 const groups=FULL.groups.filter(g=>g.zone===id&&g.props.length);
 // Each group is one chain on its own port, in the order the cost page lists them.
 const ports=groups.map((g,i)=>{
  const meta=GROUP_LIST.find(x=>x.id===g.id);
  let from=null,index=0;const segments=[],props=[];
  for(const p of g.props){
   const c=byId[p.id],seg=from?route(from,c.bulbs[0].pos):fromGarage(id,c.bulbs[0].pos,i*.035);
   segments.push(seg);from=c.bulbs.at(-1).pos;
   props.push({id:p.id,name:p.name,pixels:p.pixels,run:p.run,first:index});index+=p.pixels;
  }
  // Power is injected at every INJECT_EVERY-th pixel along the chain.
  const bulbs=g.props.flatMap(p=>byId[p.id].bulbs.map(b=>b.pos));
  const injections=Array.from({length:Math.floor((g.pixels-1)/INJECT_EVERY)},(_,k)=>{
   const at=(k+1)*INJECT_EVERY,prop=props.findLast(p=>p.first<=at);return {at,pos:bulbs[at],prop:prop.name};});
  return {n:i+1,group:g.id,name:meta.name,color:PORT_COLORS[(firstColor+i)%PORT_COLORS.length],pixels:g.pixels,
   load:g.pixels/PORT_PIXELS,cable:props.reduce((s,p)=>s+p.run,0),props,segments,injections,watts:round1(g.pixels*WATTS_PER_PIXEL)};
 });
 // Power supplies share the ports: the biggest chain goes to the least loaded supply.
 const psus=Array.from({length:z.psus},(_,i)=>({n:i+1,ports:[],pixels:0}));
 for(const port of [...ports].sort((a,b)=>b.pixels-a.pixels)){
  const psu=psus.reduce((m,s)=>s.pixels<m.pixels?s:m);psu.ports.push(port.n);psu.pixels+=port.pixels;port.psu=psu.n;
 }
 for(const s of psus){s.ports.sort((a,b)=>a-b);s.watts=round1(s.pixels*WATTS_PER_PIXEL);s.load=s.watts/PSU_WATTS;}
 // The 4 mm² injection runs come from the supplies in the garage along the same way out.
 for(const port of ports)for(const inj of port.injections){inj.psu=port.psu;inj.path=fromGarage(id,inj.pos,-.04);}
 return {id,name:id==='facade'?'Facade controller':'Garden controller',feeds:id==='facade'?'the facade props':'the garden props',pixels:z.pixels,watts:round1(z.pixels*WATTS_PER_PIXEL),
  controllers:z.controllers,portsFree:z.controllers*PORTS_PER_CONTROLLER-ports.length,ports,psus};
}

const facade=buildZone('facade',0);
export const WIRING={
 hub:HUB,
 zones:[facade,buildZone('garden',facade.ports.length)],
 pixels:FULL.pixels,watts:FULL.watts,
 parts:{controller:P.controller.name,psu:P.psu.name,psuWatts:PSU_WATTS,psuLoad:PSU_LOAD,portPixels:PORT_PIXELS,injectEvery:INJECT_EVERY,player:P.player.name,enclosure:P.enclosure.name},
};
export const LONGEST_RUN=Math.max(...WIRING.zones.flatMap(z=>z.ports.flatMap(p=>p.props.map(x=>x.run))));
