import '../style.css';
import './style.css';
import {CHANNELS,PROPS,COLORS,MULTI} from './layout.js';
import {prepareOriginalCues} from './cues.js';
import {createOriginalScene} from './scene.js';

const $=id=>document.getElementById(id),audio=$('audio');
const format=t=>`${Math.floor(t/60)}:${String(Math.floor(t%60)).padStart(2,'0')}`;
const SOUNDTRACK_SECONDS=185.875737;
let scene=null,cues=null,brightness=.6,allOn=false;
const states=new Uint8Array(CHANNELS.length),ALL_ON=new Uint8Array(CHANNELS.map(c=>c.palette==='multi'?3:1));
try{scene=createOriginalScene($('viewport'));scene.view('video');}catch(error){$('scene-error').hidden=false;$('scene-error').textContent='The 3D scene needs WebGL. Enable hardware acceleration or try a WebGL-capable browser.';console.error(error);}
for(const name of ['video','orbit','yard'])$('view-'+name).onclick=()=>scene?.view(name);

// One lamp per channel, grouped by prop, so the detected states can be read alongside the model.
const lamps=[];
$('board').innerHTML=PROPS.map(p=>`<div class="board-group"><small>${p.name} · ${p.addressing}</small><div>${CHANNELS.map((c,i)=>c.prop===p.id?`<span class="lamp${c.kind==='strip'?' wide':''}" data-i="${i}" title="${c.name}">${c.kind==='letter'?c.model.char:c.kind==='strip'?c.name.replace(/ strip(s)?$/,''):c.kind==='star'?'★':c.id.split('-').at(-1).replace(/^0/,'')}</span>`:'').join('')}</div></div>`).join('');
for(const el of document.querySelectorAll('.lamp'))lamps[+el.dataset.i]=el;
const shown=new Uint8Array(CHANNELS.length).fill(255);
function board(values){CHANNELS.forEach((c,i)=>{const v=values[i];if(v===shown[i])return;shown[i]=v;const el=lamps[i],col=c.palette==='multi'?(v===2?COLORS.blue:v===3?`linear-gradient(90deg,${COLORS.yellow} 50%,${COLORS.blue} 50%)`:COLORS.yellow):COLORS[c.palette];
 el.classList.toggle('on',!!v);el.style.background=v?col:'';el.style.setProperty('--glow',v?(c.palette==='multi'&&v===2?COLORS.blue:COLORS[c.palette]||COLORS.yellow):'transparent');el.title=`${c.name}${v?` · on${c.palette==='multi'?` (${MULTI[v]})`:''}`:' · off'}`;});}

async function load(){
 try{
  const response=await fetch('/outputs/original-house-cues.json');
  if(!response.ok)throw new Error('No detected timing has been published yet.');
  const data=await response.json().catch(()=>{throw new Error('No detected timing has been published yet.');});
  cues=prepareOriginalCues(data,CHANNELS);
  $('cue-info').textContent=`${(cues.endFrame-cues.startFrame).toLocaleString()} video frames · ${format(cues.start)}–${format(cues.end)} detected`;
  $('range-name').textContent=`Detected from the original video · ${format(cues.start)}–${format(cues.end)}`;
  $('range-start').textContent=format(cues.start);$('range-end').textContent=`detected until ${format(cues.end)}`;
 }catch(error){$('cue-info').textContent=error.message;$('cue-chip').textContent='NONE';}
 $('play').disabled=false;
}
load();

$('play').onclick=async()=>{try{if(!audio.paused)audio.pause();else{if(audio.ended)audio.currentTime=0;await audio.play();}}catch(error){$('cue-note').textContent=`Audio could not start: ${error.message}`;}};
$('restart').onclick=()=>{audio.currentTime=cues?.start||0;};
$('timeline').oninput=e=>{audio.currentTime=+e.target.value;};
$('volume').oninput=e=>audio.volume=+e.target.value/100;audio.volume=.35;
$('brightness').oninput=e=>{brightness=+e.target.value/100;$('brightness-value').textContent=`${e.target.value}%`;scene?.setBrightness();};
$('all-on').onchange=e=>{allOn=e.target.checked;scene?.setBrightness();};
audio.addEventListener('play',()=>$('play').textContent='❚❚');audio.addEventListener('pause',()=>$('play').textContent='▶');

let lastUI=0;
function animate(now){
 requestAnimationFrame(animate);
 const t=audio.currentTime,d=Number.isFinite(audio.duration)?audio.duration:SOUNDTRACK_SECONDS;
 const values=allOn?ALL_ON:cues?cues.stateAt(t,states):states.fill(0);
 scene?.draw(values,brightness);board(values);
 if(now-lastUI>80){lastUI=now;$('time').textContent=format(t);$('duration').textContent=format(d);$('timeline').max=d;if(document.activeElement!==$('timeline'))$('timeline').value=t;
  const f=cues?.frameAt(t);$('frame-label').textContent=cues?(f>=cues.startFrame&&f<cues.endFrame?`· video frame ${f+1}`:'· outside the detected range'):'';}
}
requestAnimationFrame(animate);

// Read-only diagnostics for browser checks.
window.winterlightOriginal={get status(){return {time:audio.currentTime,frame:cues?.frameAt(audio.currentTime),channels:CHANNELS.length,bulbs:scene?.bulbCount,lit:[...states].filter(Boolean).length,cues:!!cues};}};
