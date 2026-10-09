import {clamp} from './show.js';
// Note cues are compiled from the instrument transcription by
// tools/transcription/build_light_cues.py. Each MIDI instrument owns one prop
// group and its notes are dealt round robin across that group's props. Times
// come from the transcription of the hosted recording, so the hosted audio
// clock drives them directly.
const STYLE={
  piano:{release:.18,color:[1,.78,.42]},
  lead:{release:.3,color:[.62,.3,1]},
  guitar:{release:.22,color:[1,.22,.06]},
  bass:{release:.28,color:[.1,.4,1]},
  other:{release:.45,color:[.45,.75,1]},
  drums:{release:.12,color:[1,.9,.65],percussive:true},
};
export const NOTE_GROUPS=Object.keys(STYLE);

export function prepareCues(data){
  if(data?.format!=='Winterlight note cues v2')throw new Error('Unsupported note-cue format');
  const groups={},owner=new Map();
  for(const name of NOTE_GROUPS){
    const group=data.groups?.[name];
    if(!Array.isArray(group?.props)||!group.props.length||!Array.isArray(group.events))throw new Error(`Missing note-cue group ${name}`);
    group.props.forEach((prop,index)=>{if(owner.has(prop))throw new Error(`${prop} belongs to two groups`);owner.set(prop,{name,index});});
    let maxDuration=0,last=-Infinity;
    const list=group.events.map(([start,duration,prop,level],index)=>{
      if(![start,duration,prop,level].every(Number.isFinite)||start<last||duration<=0||level<0||level>1||prop<0||prop>=group.props.length)throw new Error(`Invalid ${name} cue ${index}`);
      last=start;maxDuration=Math.max(maxDuration,duration/1000);
      return {start:start/1000,end:(start+duration)/1000,prop,level};
    });
    groups[name]={props:group.props,list,lookback:(STYLE[name].percussive?0:maxDuration)+STYLE[name].release*6};
  }
  return {offset:(data.offsetMs||0)/1000,groups,owner};
}

// Linear 20 ms attack, settling to 75% while the note sounds, exponential release.
// Percussive hits ignore duration and decay from their start.
function envelope(e,t,{release,percussive}){
  if(t<e.start)return 0;
  if(percussive)return e.level*Math.exp(-(t-e.start)/release);
  const attack=Math.min(1,(t-e.start)/.02);
  if(t<e.end)return e.level*(t-e.start<.06?attack:.75+.25*Math.exp(-(t-e.start-.06)/.15));
  return e.level*.75*Math.exp(-(t-e.end)/release);
}
export function groupLevels(group,style,t){
  const out=new Float32Array(group.props.length),{list,lookback}=group;let lo=0,hi=list.length;
  while(lo<hi){const mid=(lo+hi)>>1;if(list[mid].start<=t)lo=mid+1;else hi=mid;}
  for(let i=lo-1;i>=0&&list[i].start>=t-lookback;i--){const v=envelope(list[i],t,style);if(v>out[list[i].prop])out[list[i].prop]=v;}
  return out;
}
function doorSegment(pixel,door){
  if(pixel.position[1]>door.top-.05)return 'StripDoor:lintel';
  return pixel.position[0]<door.x?'StripDoor:left':'StripDoor:right';
}

export function renderNotes(pixels,time,duration,cues,brightness=.3,out=new Float32Array(pixels.length*3)){
  out.fill(0);if(time>=duration)return out;
  const t=time-cues.offset,levels={};
  for(const name of NOTE_GROUPS)levels[name]=groupLevels(cues.groups[name],STYLE[name],t);
  const doorPixels=pixels.filter(p=>p.prop.id==='StripDoor');
  const door={x:doorPixels.reduce((n,p)=>n+p.position[0],0)/(doorPixels.length||1),top:Math.max(0,...doorPixels.map(p=>p.position[1]))};
  for(const pixel of pixels){
    const {prop,local}=pixel,key=prop.id==='StripDoor'?doorSegment(pixel,door):prop.id,slot=cues.owner.get(key);
    if(!slot)continue;
    let v=levels[slot.name][slot.index];
    if(prop.id.startsWith('Pole')){if(local/(prop.count-1)>.3+.7*v)v*=.15;}
    else if(prop.id.startsWith('Arch')){const u=(local<50?local:99-local)%50/49;if(Math.abs(u-.5)*2<1-v)v*=.15;}
    const gain=clamp(v)*brightness,col=STYLE[slot.name].color;
    for(let c=0;c<3;c++)out[pixel.index*3+c]=clamp(col[c]*gain);
  }
  return out;
}
