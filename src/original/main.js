import '../style.css';
import './style.css';
import {CHANNELS,PROPS,COLORS,MULTI} from './layout.js';
import {prepareOriginalCues} from './cues.js';
import {createOriginalScene} from './scene.js';
import {createShowClock,HOSTED_VIDEO,matchesSource,rememberVideo,recallVideo,forgetVideo} from './video-clock.js';

const $=id=>document.getElementById(id),audio=$('audio'),video=$('video');
const format=t=>`${Math.floor(t/60)}:${String(Math.floor(t%60)).padStart(2,'0')}`;
const SOUNDTRACK_SECONDS=185.875737;
let scene=null,cues=null,brightness=.6,allOn=false;
const states=new Uint8Array(CHANNELS.length),levels=new Uint8Array(CHANNELS.length),ALL_ON=new Uint8Array(CHANNELS.map(c=>c.palette==='multi'?3:1)),FULL=new Uint8Array(CHANNELS.length).fill(100);
try{scene=createOriginalScene($('viewport'));scene.view('video');}catch(error){$('scene-error').hidden=false;$('scene-error').textContent='The 3D scene needs WebGL. Enable hardware acceleration or try a WebGL-capable browser.';console.error(error);}
// Overlay mode: the model's lights over the original video, lined up in Video
// view, so each frame can be compared with what was filmed.
const stage=document.querySelector('.stage'),overlayCanvas=$('overlay-video'),overlayContext=overlayCanvas.getContext('2d');
let overlayOn=false;
function setView(name){
 overlayOn=name==='overlay';stage.classList.toggle('overlay',overlayOn);overlayCanvas.hidden=!overlayOn;$('overlay-controls').hidden=!overlayOn;
 $('view-overlay').setAttribute('aria-pressed',overlayOn);scene?.view(name);
}
for(const name of ['video','orbit','yard','overlay'])$('view-'+name).onclick=()=>setView(name==='overlay'&&overlayOn?'video':name);
$('overlay-mix').oninput=e=>stage.style.setProperty('--model-mix',+e.target.value/100);
$('overlay-diff').onchange=e=>stage.classList.toggle('difference',e.target.checked);
// Draws the frame the video is showing, fitted to the stage the same way the overlay camera is.
function paintOverlay(){
 const dpr=Math.min(devicePixelRatio,2),w=Math.round(stage.clientWidth*dpr),h=Math.round(stage.clientHeight*dpr);
 if(overlayCanvas.width!==w||overlayCanvas.height!==h){overlayCanvas.width=w;overlayCanvas.height=h;}
 overlayContext.fillStyle='#000';overlayContext.fillRect(0,0,w,h);
 const ready=clock.usingVideo&&video.readyState>=2&&video.videoWidth;
 $('overlay-note').textContent=ready?'Lights from the model over the original video, lined up frame by frame. Difference turns matching light dark.':'Load the original video in the sidebar to compare it with the model.';
 if(!ready)return;
 const k=Math.min(w/video.videoWidth,h/video.videoHeight),vw=video.videoWidth*k,vh=video.videoHeight*k;
 overlayContext.drawImage(video,(w-vw)/2,(h-vh)/2,vw,vh);
}

// One lamp per channel, grouped by prop, so the detected states can be read alongside the model.
const lamps=[];
$('board').innerHTML=PROPS.map(p=>`<div class="board-group"><small>${p.name} · ${p.addressing}</small><div>${CHANNELS.map((c,i)=>c.prop===p.id?`<span class="lamp${c.kind==='strip'?' wide':''}" data-i="${i}" title="${c.name}">${c.kind==='letter'?c.model.char:c.kind==='strip'?c.name.replace(/ strip(s)?$/,''):c.kind==='star'?'★':c.id.split('-').at(-1).replace(/^0/,'')}</span>`:'').join('')}</div></div>`).join('');
for(const el of document.querySelectorAll('.lamp'))lamps[+el.dataset.i]=el;
const shown=new Uint8Array(CHANNELS.length).fill(255),shownLevel=new Uint8Array(CHANNELS.length);
// A lamp's opacity follows the detected brightness, so fades read on the board too.
function board(values,level){CHANNELS.forEach((c,i)=>{const v=values[i],l=v?level[i]:0;if(v===shown[i]&&l===shownLevel[i])return;shown[i]=v;shownLevel[i]=l;const el=lamps[i],col=c.palette==='multi'?(v===2?COLORS.blue:v===3?`linear-gradient(90deg,${COLORS.yellow} 50%,${COLORS.blue} 50%)`:COLORS.yellow):COLORS[c.palette];
 el.classList.toggle('on',!!v);el.style.background=v?col:'';el.style.opacity=v?.35+.65*l/100:'';el.style.setProperty('--glow',v?(c.palette==='multi'&&v===2?COLORS.blue:COLORS[c.palette]||COLORS.yellow):'transparent');el.title=`${c.name}${v?` · ${l}%${c.palette==='multi'?` (${MULTI[v]})`:''}`:' · off'}`;});}

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
// The original video plays in the side panel with its own sound; once it is
// there it becomes the clock, otherwise the soundtrack is.
const clock=createShowClock(audio,video);
const videoStatus=text=>{$('video-status').textContent=text;};
let videoUrl=null;
function showVideo(source,name,picked,startAt=0){
 if(videoUrl)URL.revokeObjectURL(videoUrl);videoUrl=typeof source==='string'?null:URL.createObjectURL(source);
 video.src=videoUrl||source;videoStatus('Loading the original video…');
 video.onloadedmetadata=()=>{video.onerror=null;$('video-empty').hidden=true;$('video-change').hidden=!picked;if(startAt)video.currentTime=startAt;clock.useVideo();
  videoStatus(matchesSource(video.duration)?`${name} · the lights follow the frame on screen`:`${name} is ${format(video.duration)} long, not the 3:05 original, so its frames won't line up with the lights.`);
  if(typeof source==='string')ensureSeekable(source,name);};
 video.onerror=()=>{video.onloadedmetadata=null;clock.useAudio();if(picked)forgetVideo();askForVideo('That file could not be played. ');};
}
// A server that ignores byte ranges leaves only the downloaded part seekable;
// then play the whole file from memory so any point can be reached.
async function ensureSeekable(source,name){
 const s=video.seekable;if(s.length&&s.end(s.length-1)>=video.duration-1)return;
 try{const blob=await (await fetch(source,{cache:'no-store'})).blob();const t=video.currentTime,playing=!video.paused;showVideo(blob,name,false,t);if(playing)video.play().catch(()=>{});}catch{}
}
function askForVideo(prefix=''){$('video-empty').hidden=false;$('video-change').hidden=true;videoStatus(`${prefix}Until a video is loaded, the lights follow the soundtrack.`);}
$('video-file').onchange=e=>{const file=e.target.files[0];if(!file)return;rememberVideo(file);showVideo(file,file.name,true);e.target.value='';};
$('video-change').onclick=()=>$('video-file').click();
(async()=>{
 try{const r=await fetch(HOSTED_VIDEO,{method:'HEAD'});if(r.ok&&(r.headers.get('content-type')||'').startsWith('video/')){showVideo(HOSTED_VIDEO,'Original video',false);return;}}catch{}
 const saved=await recallVideo();if(saved)showVideo(saved,saved.name||'Original video',true);else askForVideo();
})();

const media=()=>clock.media;
$('play').onclick=async()=>{const m=media();try{if(!m.paused)m.pause();else{if(m.ended)m.currentTime=0;await m.play();}}catch(error){$('cue-note').textContent=`Playback could not start: ${error.message}`;}};
$('restart').onclick=()=>{media().currentTime=cues?.start||0;};
// The playhead follows the show except while it is being dragged; seeks are
// clamped to the media so the end of the slider never lands past it.
const timeline=$('timeline');let scrubbing=false;
const seek=t=>{const m=media(),d=Number.isFinite(m.duration)?m.duration:t;m.currentTime=Math.max(0,Math.min(t,d-.01));};
timeline.addEventListener('pointerdown',()=>{scrubbing=true;});
for(const type of ['pointerup','pointercancel'])addEventListener(type,()=>{scrubbing=false;});
timeline.oninput=e=>seek(+e.target.value);
timeline.onchange=e=>{seek(+e.target.value);scrubbing=false;};
$('volume').oninput=e=>{audio.volume=video.volume=+e.target.value/100;};audio.volume=video.volume=.35;
$('brightness').oninput=e=>{brightness=+e.target.value/100;$('brightness-value').textContent=`${e.target.value}%`;scene?.setBrightness();};
$('all-on').onchange=e=>{allOn=e.target.checked;};
for(const m of [audio,video]){m.addEventListener('play',()=>{if(m===media())$('play').textContent='❚❚';});m.addEventListener('pause',()=>{if(m===media())$('play').textContent='▶';});}

let lastUI=0;
function animate(now){
 requestAnimationFrame(animate);
 const t=clock.time(),d=Number.isFinite(media().duration)?media().duration:SOUNDTRACK_SECONDS;
 const values=allOn?ALL_ON:cues?cues.stateAt(t,states,levels):states.fill(0),level=allOn?FULL:levels;
 scene?.draw(values,level,brightness);board(values,level);if(overlayOn)paintOverlay();
 if(now-lastUI>80){lastUI=now;$('time').textContent=format(t);$('duration').textContent=format(d);$('timeline').max=d;if(!scrubbing)timeline.value=t;
  const f=cues?.frameAt(t);$('frame-label').textContent=cues?(f>=cues.startFrame&&f<cues.endFrame?`· video frame ${f+1}`:'· outside the detected range'):'';}
}
requestAnimationFrame(animate);

// Read-only diagnostics for browser checks.
window.winterlightOriginal={get status(){const t=clock.time();return {time:t,clock:clock.usingVideo?'video':'soundtrack',videoTime:video.currentTime,frame:cues?.frameAt(t),channels:CHANNELS.length,bulbs:scene?.bulbCount,lit:[...states].filter(Boolean).length,cues:!!cues};}};
