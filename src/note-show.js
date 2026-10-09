import {clamp} from './show.js';
// Note cues are compiled from the instrument transcription by
// tools/transcription/build_light_cues.py. Each instrument owns one prop group;
// times come from the transcription of the hosted recording, so the hosted
// audio clock drives them directly.
const RELEASE={poles:.18,arches:.22,archLead:.3,windows:.28,stars:.45,door:.11,sparkle:.09};
const COLORS={poles:[1,.78,.42],arches:[1,.22,.06],archLead:[.62,.28,1],windows:[[.1,.3,1],[.08,.5,1],[.05,.75,.95],[.1,.9,.7],[.35,.55,1],[.55,.4,1]],stars:[.45,.7,1],kick:[1,.85,.55],snare:[1,1,1],tom:[1,.55,.2],sparkle:[.85,.95,1]};
export const NOTE_GROUPS=Object.keys(RELEASE);

export function prepareCues(data){
  if(data?.format!=='Winterlight note cues v1')throw new Error('Unsupported note-cue format');
  const groups={};
  for(const name of NOTE_GROUPS){
    const events=data.groups?.[name];if(!Array.isArray(events))throw new Error(`Missing note-cue group ${name}`);
    let maxDuration=0,last=-Infinity;
    const list=events.map(([start,duration,slot,level],index)=>{
      if(![start,duration,slot,level].every(Number.isFinite)||start<last||duration<=0||level<0||level>1)throw new Error(`Invalid ${name} cue ${index}`);
      last=start;maxDuration=Math.max(maxDuration,duration/1000);
      return {start:start/1000,end:(start+duration)/1000,slot,level,index};
    });
    groups[name]={list,lookback:maxDuration+RELEASE[name]*6};
  }
  return {offset:(data.offsetMs||0)/1000,groups};
}

// Linear 20 ms attack, held at 75% while the note sounds, exponential release.
function envelope(e,t,release){
  if(t<e.start)return 0;
  const attack=Math.min(1,(t-e.start)/.02);
  if(t<e.end)return e.level*(t-e.start<.06?attack:.75+.25*Math.exp(-(t-e.start-.06)/.15));
  return e.level*.75*Math.exp(-(t-e.end)/release);
}
function active(group,t,visit){
  const {list,lookback}=group;let lo=0,hi=list.length;
  while(lo<hi){const mid=(lo+hi)>>1;if(list[mid].start<=t)lo=mid+1;else hi=mid;}
  for(let i=lo-1;i>=0&&list[i].start>=t-lookback;i--)visit(list[i]);
}
function slotLevels(group,t,release,slots){
  const out=new Float32Array(slots);
  active(group,t,e=>{const v=envelope(e,t,release);if(v>out[e.slot])out[e.slot]=v;});
  return out;
}
const hash=n=>{n=Math.imul(n^n>>>16,0x45d9f3b);n=Math.imul(n^n>>>16,0x45d9f3b);return ((n^n>>>16)>>>0)/4294967296;};

export function renderNotes(pixels,time,duration,cues,brightness=.3,out=new Float32Array(pixels.length*3)){
  out.fill(0);if(time>=duration)return out;
  const t=time-cues.offset,g=cues.groups;
  const poles=slotLevels(g.poles,t,RELEASE.poles,10),arches=slotLevels(g.arches,t,RELEASE.arches,4),lead=slotLevels(g.archLead,t,RELEASE.archLead,4),stars=slotLevels(g.stars,t,RELEASE.stars,2);
  // Bass keeps the strongest note per frame so its colour follows the pitch bucket.
  let bass=0,bassSlot=0;active(g.windows,t,e=>{const v=envelope(e,t,RELEASE.windows);if(v>bass){bass=v;bassSlot=e.slot;}});
  const door={kick:0,snare:[0,0],tom:0};
  active(g.door,t,e=>{if(e.slot===0)door.kick=Math.max(door.kick,e.level*Math.exp(-(t-e.start)/RELEASE.door));else if(e.slot===1){const side=e.index%2;door.snare[side]=Math.max(door.snare[side],e.level*Math.exp(-(t-e.start)/RELEASE.door));}else door.tom=Math.max(door.tom,e.level*Math.exp(-(t-e.start)/(RELEASE.door*1.6)));});
  let crash=0;const twinkles=[];
  active(g.sparkle,t,e=>{const v=e.level*Math.exp(-(t-e.start)/(e.slot?RELEASE.sparkle*5:RELEASE.sparkle));if(e.slot)crash=Math.max(crash,v);else twinkles.push([e.index,v]);});
  const doorPixels=pixels.filter(p=>p.prop.id==='StripDoor'),doorX=doorPixels.reduce((n,p)=>n+p.position[0],0)/(doorPixels.length||1),doorTop=Math.max(...doorPixels.map(p=>p.position[1]),0);
  for(const pixel of pixels){
    const {prop,local,position}=pixel,id=prop.id;let col=[0,0,0],v=0;
    if(id.startsWith('Pole')){const k=+id.slice(4)-1,u=local/(prop.count-1);v=poles[k];col=COLORS.poles;if(u>.35+.65*v)v*=.2;}
    else if(id.startsWith('Arch')){
      const k=+id.slice(4)-1,row=Math.floor(local/50),u=(row?49-local%50:local%50)/49,reach=Math.abs(u-.5)*2;
      const guitar=arches[k]*(reach>=1-arches[k]?1:.15),violet=row?lead[k]*.9:0;
      if(guitar>=violet){v=guitar;col=COLORS.arches;}else{v=violet;col=COLORS.archLead;}
    }
    else if(id==='StripWC'||id==='StripKitchen'){v=bass;col=COLORS.windows[bassSlot];}
    else if(id.startsWith('Star')){
      const k=id==='Star1'?0:1,twinkle=twinkles.reduce((m,[n,level])=>hash(n*977+k*131+local)<.18?Math.max(m,level):m,0);
      const glow=stars[k]*.55;v=Math.max(glow,twinkle,crash);col=v===glow?COLORS.stars:COLORS.sparkle;
    }
    else if(id==='StripDoor'){
      const top=position[1]>doorTop-.05,side=position[0]<doorX?0:1,snare=top?0:door.snare[side],tom=top?door.tom:0;
      v=Math.max(door.kick,snare,tom);col=v===door.kick?COLORS.kick:v===snare?COLORS.snare:COLORS.tom;
    }
    const gain=clamp(v)*brightness;
    for(let c=0;c<3;c++)out[pixel.index*3+c]=clamp(col[c]*gain);
  }
  return out;
}
