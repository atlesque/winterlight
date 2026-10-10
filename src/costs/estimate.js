import {OWN_CHANNELS} from '../props.js';
import {PROPS} from '../original/layout.js';
import {PRICES as P,WATTS_PER_PIXEL,PSU_LOAD,PSU_WATTS,PORT_PIXELS,PORTS_PER_CONTROLLER,INJECT_EVERY} from './catalog.js';

// The cost model: every prop on our house (one per channel of the original),
// with its real pixel count and frame length from src/props.js, priced as
// 12 V WS2811 pixels on the mounts below. Props hang off two controller boxes,
// one on the facade between the garage and the front door and one at the
// garden's front left corner; props of a group are wired in a chain.
export const ZONES={
 facade:{name:'Facade box',where:'on the wall between the garage and the front door',box:[3.3,1.2,0]},
 garden:{name:'Garden box',where:'at the front left corner of the garden',box:[5.75,.3,.6]},
};
const dist=(a,b)=>Math.hypot(...a.map((v,j)=>v-b[j]));
const walk=(a,b)=>a.reduce((s,v,j)=>s+Math.abs(v-b[j]),0);
const length=frames=>frames.reduce((s,f)=>s+f.slice(1).reduce((t,p,i)=>t+dist(f[i],p),0),0);
const round=v=>Math.round(v*100)/100;
// Coro board a little larger than the prop's own outline.
function boardArea(bulbs,margin=.05){
 const xs=bulbs.map(b=>b.pos[0]),ys=bulbs.map(b=>b.pos[1]);
 return (Math.max(...xs)-Math.min(...xs)+2*margin)*(Math.max(...ys)-Math.min(...ys)+2*margin);
}
const line=(item,qty,unit=P[item].price)=>({item,name:P[item].name,qty:round(qty),unit,cost:round(qty*unit)});
const strip=c=>[line('mountStrip',Math.ceil(length(c.frames))),line('stake',Math.ceil(length(c.frames)/.5))];
const coro=c=>[line('coro',round(boardArea(c.bulbs))),line('stake',2)];

// Per group: the LED pick and why, how it is mounted, and the mounting parts per prop.
export const GROUPS={
 upper:{zone:'facade',led:'12 mm bullet pixels, icicle drops tied on below the run',why:'One RGB pixel shows yellow, blue or both, so the multicolour strip needs one run instead of two coloured strings on two channels.',mount:strip},
 lower:{zone:'facade',led:'12 mm bullet pixels, icicle drops tied on below the run',why:'Same as the upper strip, under the garage eave.',mount:strip},
 windows:{zone:'facade',led:'12 mm bullet pixels at 10 cm',why:'The string\'s own 10 cm pitch matches the outlines, so no slack to hide.',mount:strip},
 letters:{zone:'facade',led:'12 mm bullet pixels pushed into coro letters',why:'Coro boards keep each letter\'s shape exactly; the 4.5 cm spacing is drilled into the board and the spare wire runs behind it.',mount:coro},
 wreaths:{zone:'facade',led:'12 mm bullet pixels in a coro ring',why:'Green rings and the red bow come from the same pixels, so no separate bow string.',mount:coro},
 peace:{zone:'facade',led:'12 mm bullet pixels in a coro sign',why:'A coro board holds the circle and the three strokes on the door glass.',mount:coro},
 canes:{zone:'garden',led:'12 mm bullet pixels in coro canes',why:'Coro canes stand on two stakes in the snow and survive wind better than tubes.',mount:coro},
 minitrees:{zone:'garden',led:'12 mm bullet pixels up six spokes',why:'Pixels instead of red mini-lights let each tree fade on its own channel like the original.',mount:()=>[line('minitreeFrame',1)]},
 fence:{zone:'garden',led:'12 mm bullet pixels on a staked rail, 30 cm up',why:'Multicolour, so pixels again; a mounting strip on stakes keeps it straight.',mount:strip},
 tree:{zone:'garden',led:'12 mm bullet pixels on 16 strands and a coro star',why:'Each strand is its own channel, so the circular chases and sweeps of the original play as they do in the model.',mount:c=>c.kind==='star'?coro(c):[line('mountStrip',Math.ceil(length(c.frames))),line('stake',1)],fixed:[['treeFrame',1]]},
};

export const PROP_LIST=OWN_CHANNELS.map(c=>({id:c.id,group:c.prop,name:c.name,pixels:c.bulbs.length,start:c.bulbs[0].pos,mount:GROUPS[c.prop].mount(c)}));
export const GROUP_LIST=PROPS.map(g=>({...g,...GROUPS[g.id],props:PROP_LIST.filter(p=>p.group===g.id)}));
export const DEFAULTS={pixelPrice:P.pixels50.price,spare:5,contingency:10,audio:true};

// Prices the selected props. `selected` is a Set of prop ids; options as DEFAULTS.
export function estimate(selected,options={}){
 const o={...DEFAULTS,...options},pixelUnit=o.pixelPrice/50;
 const groups=[],zones={};
 for(const g of GROUP_LIST){
  const zone=ZONES[g.zone];let from=zone.box;const props=[];
  for(const p of g.props){
   if(!selected.has(p.id))continue;
   // A chain runs from the box to the first prop, then prop to prop, plus slack.
   const run=Math.ceil(walk(from,p.start)+.5);from=p.start;
   const lines=[{item:'pixels',name:'Pixels',qty:p.pixels,unit:pixelUnit,cost:round(p.pixels*pixelUnit)},...p.mount,line('cable',run),line('pigtail',1),line('zipTies',p.pixels/1000)];
   props.push({...p,run,lines,total:round(lines.reduce((s,l)=>s+l.cost,0))});
  }
  const pixels=props.reduce((s,p)=>s+p.pixels,0),extras=[];
  if(props.length){
   const injections=Math.floor((pixels-1)/INJECT_EVERY);
   if(injections)extras.push(line('tSplitter',injections),line('injectWire',injections*4));
   for(const [item,qty] of g.fixed||[])extras.push(line(item,qty));
   const z=zones[g.zone]||={pixels:0,ports:0};z.pixels+=pixels;z.ports+=Math.ceil(pixels/PORT_PIXELS);
  }
  const total=round(props.reduce((s,p)=>s+p.total,0)+extras.reduce((s,l)=>s+l.cost,0));
  groups.push({id:g.id,name:g.name,zone:g.zone,props,extras,pixels,total,count:props.length,of:g.props.length});
 }
 // Controllers, power and boxes per zone, then the show computer, network and spares.
 const infra=[];
 for(const [id,z] of Object.entries(zones)){
  const name=ZONES[id].name,controllers=Math.ceil(z.ports/PORTS_PER_CONTROLLER),psus=Math.ceil(z.pixels*WATTS_PER_PIXEL/(PSU_WATTS*PSU_LOAD)),boxes=Math.ceil((controllers+psus)/2);
  Object.assign(z,{controllers,psus,boxes});
  infra.push({zone:id,...line('controller',controllers),name:`${name}: ${P.controller.name}`},{zone:id,...line('psu',psus),name:`${name}: ${P.psu.name}`},{zone:id,...line('enclosure',boxes),name:`${name}: ${P.enclosure.name}`},{zone:id,...line('fittings',boxes),name:`${name}: ${P.fittings.name}`},{zone:id,...line('mains',1),name:`${name}: ${P.mains.name}`},{zone:id,...line('network',1),name:`${name}: ${P.network.name}`});
 }
 const pixels=groups.reduce((s,g)=>s+g.pixels,0);
 if(pixels){
  infra.push(line('player',1),line('playerKit',1),line('switch',1));
  if(o.audio)infra.push(line('soundCard',1),line('fm',1));
  // Pixels come in strings of 50: the spare share plus rounding up to whole strings.
  const strings=Math.ceil(pixels*(1+o.spare/100)/50),extra=strings*50-pixels;
  if(extra)infra.push({item:'spares',name:`Spare pixels and rounding to whole strings (${strings} strings of 50)`,qty:extra,unit:pixelUnit,cost:round(extra*pixelUnit)});
 }
 const direct=round(groups.reduce((s,g)=>s+g.total,0)),infraTotal=round(infra.reduce((s,l)=>s+l.cost,0));
 const subtotal=round(direct+infraTotal),contingency=round(subtotal*o.contingency/100),total=round(subtotal+contingency);
 // What the money goes on, for the breakdown chart.
 const sum=f=>round(groups.reduce((s,g)=>s+g.props.reduce((t,p)=>t+p.lines.filter(f).reduce((u,l)=>u+l.cost,0),0),0));
 const inf=items=>round(infra.filter(l=>items.includes(l.item)).reduce((s,l)=>s+l.cost,0));
 const ext=items=>round(groups.reduce((s,g)=>s+g.extras.filter(l=>items.includes(l.item)).reduce((t,l)=>t+l.cost,0),0));
 const categories=[
  {id:'leds',name:'Pixels',cost:round(sum(l=>l.item==='pixels')+inf(['spares']))},
  {id:'mounts',name:'Prop frames and mounts',cost:round(sum(l=>['mountStrip','stake','coro','minitreeFrame'].includes(l.item))+ext(['treeFrame']))},
  {id:'wiring',name:'Wiring and power injection',cost:round(sum(l=>['cable','pigtail','zipTies'].includes(l.item))+ext(['tSplitter','injectWire']))},
  {id:'control',name:'Controllers',cost:inf(['controller'])},
  {id:'power',name:'Power supplies, boxes and mains',cost:inf(['psu','enclosure','fittings','mains'])},
  {id:'show',name:'Show computer, network and audio',cost:inf(['player','playerKit','switch','network','soundCard','fm'])},
  {id:'contingency',name:`Contingency (${o.contingency}%)`,cost:contingency},
 ];
 return {groups,infra,zones,pixels,watts:Math.round(pixels*WATTS_PER_PIXEL),direct,infraTotal,subtotal,contingency,total,categories};
}
export const ALL=new Set(PROP_LIST.map(p=>p.id));
