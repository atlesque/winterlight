import {HOUSE,PROP_LAYOUT} from './house.js';
function outline(opening,door=false){
  const x=opening.x,w=opening.width+.16;
  const bottom=door?.08:opening.y-opening.height/2-.08;
  const top=door?opening.height+.08:opening.y+opening.height/2+.08;
  const vertices=[[x-w/2,bottom,.25],[x-w/2,top,.25],[x+w/2,top,.25],[x+w/2,bottom,.25]];
  if(!door)vertices.push(vertices[0]);
  return vertices;
}
function samplePath(vertices,count,closed){
  const lengths=vertices.slice(1).map((b,i)=>Math.hypot(...b.map((n,j)=>n-vertices[i][j])));
  const total=lengths.reduce((a,b)=>a+b,0);
  return Array.from({length:count},(_,i)=>{
    let distance=i*total/(closed?count:count-1),edge=0;
    while(edge<lengths.length-1&&distance>lengths[edge])distance-=lengths[edge++];
    return vertices[edge].map((n,j)=>n+(vertices[edge+1][j]-n)*distance/lengths[edge]);
  });
}
function retainedPositions(prop) {
  const points=[];
  if (prop.id.startsWith('Arch')) {
    const k=+prop.id.slice(4)-1, cx=PROP_LAYOUT.arches.centers[k];
    for(let i=0;i<100;i++) {
      const row=Math.floor(i/50), u=(row ? 49-i%50 : i%50)/49, theta=Math.PI*(1-u);
      points.push([cx+Math.cos(theta)*(PROP_LAYOUT.arches.radius-row*.032), .10+Math.sin(theta)*(PROP_LAYOUT.arches.radius-row*.032), PROP_LAYOUT.arches.z[k]]);
    }
  } else if(prop.id.startsWith('Star')) {
    const cx=PROP_LAYOUT.stars.centers[prop.id==='Star1'?0:1];
    for(let i=0;i<100;i++) {
      const ring=Math.floor(i/50), edge=Math.floor((i%50)/5), f=(i%5)/5, r=.37-ring*.09;
      const vertex=j=>{const a=Math.PI/2+j*Math.PI/5, rad=j%2?r*.43:r;return [Math.cos(a)*rad,Math.sin(a)*rad]};
      const a=vertex(edge),b=vertex((edge+1)%10);
      points.push([cx+a[0]+(b[0]-a[0])*f,.79+a[1]+(b[1]-a[1])*f,PROP_LAYOUT.stars.z]);
    }
  }
  return points;
}

const arch=(id,bank,port)=>({id,name:id.replace('Arch','Arch '),count:100,bank,port,detail:'Existing one-metre arch retained.'});
const star=(id,bank,port)=>({id,name:id.replace('Star','Star '),count:100,bank,port,detail:'Existing low star retained.'});
const pole=(i,bank,port)=>({id:`Pole${i}`,name:`Pole ${i}`,count:20,bank,port,detail:'About 0.9 m lit height; slim diffuser on a weighted base.'});
const definitions=[
  arch('Arch1','A',1),arch('Arch2','A',2),star('Star1','A',3),pole(1,'A',4),pole(2,'A',5),
  {id:'StripWC',name:'Small ground-floor window',count:28,bank:'A',port:6,path:outline(HOUSE.windows[3]),closed:true,detail:'Full small-window outline; 2.8 m strip including corner allowance.'},
  arch('Arch3','B',1),arch('Arch4','B',2),star('Star2','B',3),pole(3,'B',4),pole(4,'B',5),
  ...Array.from({length:6},(_,i)=>pole(i+5,'C',i+1)),
  {id:'StripKitchen',name:'Kitchen window',count:64,bank:'C',port:7,path:outline(HOUSE.windows[2]),closed:true,detail:'Full ground-floor window outline; 6.4 m strip including corner allowance.'},
  {id:'StripDoor',name:'Door frame',count:62,bank:'C',port:8,path:outline(HOUSE.door,true),closed:false,detail:'Sides and lintel only; threshold clear. 6.2 m strip including corner allowance.'},
];
let channel=1;const local={A:0,B:0,C:0};
// Procurement maximum: bullets <=0.72 W/node, facade strip <=7.2 W/m
// at 10 RGB addresses/m. Higher-power substitutions require a power redesign.
export const PROPS=definitions.map(p=>{
  const prop={...p,wattsPerAddress:.72,sections:Math.ceil(p.count/50),channelStart:channel,channelEnd:channel+p.count*3-1,localStart:local[p.bank]};
  channel+=p.count*3;local[p.bank]+=p.count;return prop;
});
export const PIXEL_COUNT=PROPS.reduce((n,p)=>n+p.count,0);
export const CHANNEL_COUNT=PIXEL_COUNT*3;
export const FEED_COUNT=PROPS.reduce((n,p)=>n+p.sections,0);
export const BANKS=Object.fromEntries(['A','B','C'].map(bank=>{
  const props=PROPS.filter(p=>p.bank===bank);
  return [bank,{count:local[bank],channels:local[bank]*3,channelStart:props[0].channelStart,channelEnd:props.at(-1).channelEnd,watts:props.reduce((n,p)=>n+p.count*p.wattsPerAddress,0),sections:props.reduce((n,p)=>n+p.sections,0),ports:props.length}];
}));
export function powerSections(prop){
  return Array.from({length:prop.sections},(_,i)=>({start:Math.floor(i*prop.count/prop.sections),end:Math.floor((i+1)*prop.count/prop.sections)}));
}
export function propPositions(prop){
  const model=PROPS.find(p=>p.id===prop.id);if(!model)throw new Error(`Unknown prop ${prop.id}`);
  if(prop.count!==model.count)throw new Error(`Pixel count differs for ${prop.id}`);
  if(model.path)return samplePath(model.path,prop.count,model.closed);
  if(prop.id.startsWith('Pole')){
    const [x,z]=PROP_LAYOUT.poles[Number(prop.id.slice(4))-1];
    return Array.from({length:prop.count},(_,j)=>[x,.1+j/(prop.count-1)*.9,z]);
  }
  return retainedPositions(prop);
}
// Facade runs rise in the right garden and cross above the door lintel; garden
// runs past the planting tiles keep to the corridors between them.
export function cableRoute(source,prop,dest){
  if(prop.id.startsWith('Strip'))return [source,[source[0],.145,.65],[source[0],.145,.25],[source[0],2.55,.25],[dest[0],2.55,.25],dest];
  const tiles=HOUSE.planters.tiles,edge=Math.min(...tiles.map(t=>t.z))-HOUSE.planters.size/2;
  if(dest[2]<=edge)return [source,[source[0],.145,.65],[dest[0],.145,.65],[dest[0],.145,dest[2]],dest];
  const lane=PROP_LAYOUT.corridors.reduce((a,b)=>Math.abs(b-dest[0])<Math.abs(a-dest[0])?b:a);
  return [source,[source[0],.145,.65],[lane,.145,.65],[lane,.145,dest[2]],[dest[0],.145,dest[2]],dest];
}
