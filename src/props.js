import {HOUSE,PROP_LAYOUT} from './house.js';
// Props modelled on the filmed original house (see src/original/layout.js):
// a wireframe tree under its star, a peace sign, two Christmas circles,
// HAPPY HOLIDAYS letters, candy canes, mini trees and yellow/blue eave strips.
// Each prop's geometry yields its pixel positions, its natural bulb colours
// and the wire frames the scene draws behind the bulbs.
export const BULB={yellow:[1,.72,.3],blue:[.2,.38,1],red:[1,.12,.08],green:[.12,.9,.35],white:[1,.92,.85],warm:[1,.78,.45]};
const LETTER_COLORS=[BULB.red,BULB.green,BULB.yellow];

function samplePath(vertices,count,closed){
  const lengths=vertices.slice(1).map((b,i)=>Math.hypot(...b.map((n,j)=>n-vertices[i][j])));
  const total=lengths.reduce((a,b)=>a+b,0);
  return Array.from({length:count},(_,i)=>{
    let distance=i*total/(closed?count:count-1),edge=0;
    while(edge<lengths.length-1&&distance>lengths[edge])distance-=lengths[edge++];
    return vertices[edge].map((n,j)=>n+(vertices[edge+1][j]-n)*distance/lengths[edge]);
  });
}
const pathLength=vertices=>vertices.slice(1).reduce((n,b,i)=>n+Math.hypot(...b.map((v,j)=>v-vertices[i][j])),0);
const lerp=(a,b,t)=>a.map((v,j)=>v+(b[j]-v)*t);
const circle=(cx,cy,z,r,n)=>Array.from({length:n},(_,k)=>{const a=Math.PI/2+2*Math.PI*k/n;return [cx+Math.cos(a)*r,cy+Math.sin(a)*r,z];});

// Stroke font in a unit box (x right, y up) for the letters of HAPPY HOLIDAYS.
const GLYPHS={
  H:[[[0,0],[0,1]],[[1,0],[1,1]],[[0,.5],[1,.5]]],
  A:[[[0,0],[.5,1],[1,0]],[[.25,.5],[.75,.5]]],
  P:[[[0,0],[0,1],[.75,1],[1,.85],[1,.65],[.75,.5],[0,.5]]],
  Y:[[[0,1],[.5,.5],[1,1]],[[.5,.5],[.5,0]]],
  O:[[[.3,0],[.7,0],[1,.3],[1,.7],[.7,1],[.3,1],[0,.7],[0,.3],[.3,0]]],
  L:[[[0,1],[0,0],[1,0]]],
  I:[[[.5,0],[.5,1]],[[.2,1],[.8,1]],[[.2,0],[.8,0]]],
  D:[[[0,0],[0,1],[.6,1],[1,.7],[1,.3],[.6,0],[0,0]]],
  S:[[[1,.85],[.8,1],[.2,1],[0,.85],[0,.62],[.2,.5],[.8,.5],[1,.38],[1,.15],[.8,0],[.2,0],[0,.15]]],
};
const LETTER_SPACING=.045;

const geometry={
  // Sixteen strips from a ring on the ground to the apex; the star sits above it.
  tree(){
    const {x,z,radius:R,height,strips}=PROP_LAYOUT.tree,apex=[x,height,z],positions=[],frames=[{points:[[x,0,z],apex],radius:.02,mat:'frame'},{points:circle(x,z,0,R,strips).map(([a,b])=>[a,.02,b]),closed:true,radius:.008,mat:'frame'}];
    for(let k=0;k<strips;k++){
      const theta=2*Math.PI*k/strips,base=[x+Math.sin(theta)*R,.03,z+Math.cos(theta)*R];
      for(let j=0;j<20;j++)positions.push(lerp(base,apex,j/20));
      frames.push({points:[base,apex],radius:.006,mat:'frame'});
    }
    return {positions,colors:positions.map(()=>BULB.yellow),frames};
  },
  star(){
    const {x,z,height,star:{radius:R,gap}}=PROP_LAYOUT.tree,cy=height+gap+R*.81;
    const outline=Array.from({length:10},(_,k)=>{const a=Math.PI/2+k*Math.PI/5,r=k%2?R*.42:R;return [x+Math.cos(a)*r,cy+Math.sin(a)*r,z];});
    const positions=[];for(let e=0;e<10;e++)for(let f=0;f<4;f++)positions.push(lerp(outline[e],outline[(e+1)%10],f/4));
    return {positions,colors:positions.map(()=>BULB.yellow),frames:[{points:outline,closed:true,radius:.01,mat:'frame'},{points:[[x,height,z],[x,cy,z]],radius:.012,mat:'frame'}]};
  },
  peace(){
    const {x,y,radius:r,z}=PROP_LAYOUT.peace,c=[x,y,z],spoke=a=>[x+Math.cos(a)*r,y+Math.sin(a)*r,z];
    const top=[x,y+r,z],bottom=[x,y-r,z],left=spoke(Math.PI*1.25),right=spoke(Math.PI*1.75);
    const positions=[...circle(x,y,z,r,36),...Array.from({length:10},(_,i)=>lerp(top,bottom,(i+.5)/10)),...[left,right].flatMap(end=>Array.from({length:5},(_,i)=>lerp(c,end,(i+.5)/5)))];
    return {positions,colors:positions.map(()=>BULB.yellow),frames:[{points:circle(x,y,z-.01,r,36),closed:true,radius:.012,mat:'frame'},...[[top,bottom],[c,left],[c,right]].map(points=>({points:points.map(p=>[p[0],p[1],z-.01]),radius:.012,mat:'frame'}))]};
  },
  // Two rings of green bulbs with a red bow at the bottom, as on the original.
  wreath(index){
    const {x,y,radius:r,z}=PROP_LAYOUT.wreaths[index];
    const bow=[[-.06,0],[-.1,.03],[-.1,-.03],[.06,0],[.1,.03],[.1,-.03]].map(([dx,dy])=>[x+dx*r/.3,y-r+dy*r/.3,z+.02]);
    const positions=[...circle(x,y,z,r,28),...circle(x,y,z,r*.62,16),...bow];
    return {positions,colors:positions.map((_,i)=>i<44?BULB.green:BULB.red),frames:[{points:circle(x,y,z-.01,r,28),closed:true,radius:.012,mat:'leaf'},{points:circle(x,y,z-.01,r*.62,16),closed:true,radius:.012,mat:'leaf'}]};
  },
  letters(){
    const {text,from,to,y,height,z}=PROP_LAYOUT.letters,slot=(to-from)/text.length,width=height*.7,positions=[],colors=[],frames=[];let n=0;
    [...text].forEach((ch,i)=>{if(ch===' ')return;const color=LETTER_COLORS[n++%3],cx=from+slot*(i+.5);
      for(const stroke of GLYPHS[ch]){
        const points=stroke.map(([u,v])=>[cx+(u-.5)*width,y+(v-.5)*height,z]),closed=stroke.length>2&&stroke[0].every((v,j)=>v===stroke.at(-1)[j]);
        const count=Math.max(2,Math.round(pathLength(points)/LETTER_SPACING)+(closed?0:1));
        for(const p of samplePath(points,count,closed)){positions.push(p);colors.push(color);}
        frames.push({points:points.map(p=>[p[0],p[1],z-.01]),radius:.007,mat:'frame'});
      }});
    return {positions,colors,frames};
  },
  // Red and white canes along the street edge of the garden, hooks alternating.
  canes(){
    const {xs,z,height:h}=PROP_LAYOUT.canes,positions=[],colors=[],frames=[];
    xs.forEach((x,i)=>{const hook=i%2?-1:1,path=[[x,.03,z],[x,h*.78,z]];
      for(let k=1;k<=6;k++){const a=Math.PI*k/6;path.push([x+hook*(.09-Math.cos(a)*.09),h*.78+Math.sin(a)*.11,z]);}
      samplePath(path,14,false).forEach((p,k)=>{positions.push(p);colors.push(k%2?BULB.white:BULB.red);});
      frames.push({points:path,radius:.014,mat:'cane'});});
    return {positions,colors,frames};
  },
  minitrees(){
    const {xs,z,height,radius:r}=PROP_LAYOUT.minitrees,positions=[],frames=[];
    for(const x of xs){const top=[x,height,z];
      for(let s=0;s<6;s++){const a=2*Math.PI*s/6,base=[x+Math.cos(a)*r,.03,z+Math.sin(a)*r];for(let j=0;j<3;j++)positions.push(lerp(base,top,j/3));frames.push({points:[base,top],radius:.006,mat:'frame'});}}
    return {positions,colors:positions.map(()=>BULB.red),frames};
  },
  // Alternating yellow and blue bulbs along an eave; the garage one has icicles.
  eave(name,icicles){
    const {from,to,y}=PROP_LAYOUT.eaves[name],z=PROP_LAYOUT.eaves.z,count=Math.round((to-from)*10),positions=[],colors=[];
    for(let k=0;k<count;k++){const p=[from+(to-from)*k/(count-1),y,z];positions.push(p);colors.push(k%2?BULB.blue:BULB.yellow);
      if(icicles&&k%2===0)for(let d=1;d<=(k%4?2:3);d++){positions.push([p[0],y-d*.09,z+.02]);colors.push((k+d)%2?BULB.blue:BULB.yellow);}}
    return {positions,colors,frames:[{points:[[from,y,z-.02],[to,y,z-.02]],radius:.01,mat:'frame'}]};
  },
};

const facade=(id,name,bank,port,build,detail)=>({id,name,bank,port,build,detail,mount:'facade'});
const standing=(id,name,bank,port,build,detail)=>({id,name,bank,port,build,detail,mount:'garden'});
const definitions=[
  standing('Tree','Wireframe tree','A',1,()=>geometry.tree(),'2.5 m cone of sixteen warm-yellow strips between the planting tiles, in front of the kitchen window. Strictly on or off, like the original.'),
  standing('TreeStar','Tree star','A',2,()=>geometry.star(),'Star above the tree top with a small gap; the strips meet directly under it.'),
  facade('Wreath1','Upper Christmas circle','A',3,()=>geometry.wreath(0),'Green double ring with a red bow in front of the upper right window.'),
  facade('Letters','HAPPY HOLIDAYS letters','B',1,()=>geometry.letters(),'Thirteen letters under the eave, red, green and yellow in turn; each letter is its own address range.'),
  facade('EaveMain','Main eave strip','B',2,()=>geometry.eave('main',false),'Alternating yellow and blue bulbs along the main gutter.'),
  facade('EaveGarage','Garage eave strip','B',3,()=>geometry.eave('garage',true),'Alternating yellow and blue bulbs with icicle drops along the garage gutter.'),
  facade('Peace','Peace sign','C',1,()=>geometry.peace(),'One-metre yellow peace sign in front of the upper left window.'),
  facade('Wreath2','Door Christmas circle','C',2,()=>geometry.wreath(1),'Smaller green ring with a red bow on the front door.'),
  standing('Canes','Candy canes','C',3,()=>geometry.canes(),'Six red-and-white canes along the street edge of the garden.'),
  standing('MiniTrees','Mini trees','C',4,()=>geometry.minitrees(),'Six red one-metre mini trees in the band between the facade and the planting tiles.'),
];
const BUILT=new Map(definitions.map(d=>[d.id,d.build()]));
let channel=1;const local={A:0,B:0,C:0};
// Procurement maximum: 12 V WS2811 pixels at <=0.72 W per address.
export const PROPS=definitions.map(({build,...p})=>{
  const count=BUILT.get(p.id).positions.length;
  const prop={...p,count,wattsPerAddress:.72,sections:Math.ceil(count/50),channelStart:channel,channelEnd:channel+count*3-1,localStart:local[p.bank]};
  channel+=count*3;local[p.bank]+=count;return prop;
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
function built(prop){
  const model=BUILT.get(prop.id);if(!model)throw new Error(`Unknown prop ${prop.id}`);
  if(prop.count!==model.positions.length)throw new Error(`Pixel count differs for ${prop.id}`);
  return model;
}
export const propPositions=prop=>built(prop).positions;
// Each pixel's own bulb colour when the prop is fully lit.
export const propColors=prop=>built(prop).colors;
export const propFrames=prop=>built(prop).frames;
// Facade runs rise in the right garden and cross above the door lintel; garden
// runs past the planting tiles keep to the corridors between them.
export function cableRoute(source,prop,dest){
  if(prop.mount==='facade'){const riser=Math.max(2.55,dest[1]);return [source,[source[0],.145,.65],[source[0],.145,.25],[source[0],riser,.25],[dest[0],riser,.25],dest];}
  const tiles=HOUSE.planters.tiles,edge=Math.min(...tiles.map(t=>t.z))-HOUSE.planters.size/2;
  if(dest[2]<=edge)return [source,[source[0],.145,.65],[dest[0],.145,.65],[dest[0],.145,dest[2]],dest];
  const lane=PROP_LAYOUT.corridors.reduce((a,b)=>Math.abs(b-dest[0])<Math.abs(a-dest[0])?b:a);
  return [source,[source[0],.145,.65],[lane,.145,.65],[lane,.145,dest[2]],[dest[0],.145,dest[2]],dest];
}
