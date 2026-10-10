import './style.css';
import './player.css';
import {CHANNELS,PROPS,COLORS,MULTI} from './original/layout.js';
import {prepareOriginalCues} from './original/cues.js';
import {createShowClock,HOSTED_VIDEO,SOURCE_RATE,matchesSource,rememberVideo,recallVideo,forgetVideo} from './original/video-clock.js';

// The show player both houses share: the same controls, the same detected cue
// file and the same video clock, with a toggle between the original house, our
// house, or both stacked. Each house brings its own 3D scene (whose draw()
// takes per-channel colour states and levels) and its own wording.
const format=t=>`${Math.floor(t/60)}:${String(Math.floor(t%60)).padStart(2,'0')}`;
const SOUNDTRACK_SECONDS=185.875737;

// The two houses the page can show, in the order the toggle lists them.
export const MODES=['original','ours','split'];
const HOUSES=['original','ours'];

function render(houses){
 const stage=document.querySelector('.stage'),aside=document.querySelector('aside');
 // One pane per house: its viewport, its heading and, for the original, the overlay video.
 stage.insertAdjacentHTML('afterbegin',`<div class="panes">${HOUSES.map(id=>{const h=houses[id].page;return `<section class="pane" id="pane-${id}" data-house="${id}" aria-label="${h.label}">
  ${id==='original'?'<canvas id="overlay-video" class="overlay-video" hidden></canvas>':''}<div class="viewport" id="viewport-${id}"></div>
  <div class="scene-heading"><div class="eyebrow"><span class="dot"></span> ${h.eyebrow}</div><${h.heading} class="scene-title">${h.title}</${h.heading}><p>${h.subtitle}</p></div>
  ${id==='original'?'<div id="overlay-controls" class="overlay-controls" hidden><label for="overlay-mix">Model opacity <input id="overlay-mix" type="range" min="0" max="100" value="70"></label><label><input id="overlay-diff" type="checkbox"> Difference</label><small id="overlay-note"></small></div>':''}
 </section>`;}).join('')}</div>`);
 stage.insertAdjacentHTML('beforeend',`<div class="scene-controls"><button id="view-video" class="small-button">Front view</button><button id="view-orbit" class="small-button">Garden view</button><button id="view-yard" class="small-button">Yard view</button><button id="view-overlay" class="small-button" aria-pressed="false">Overlay video</button></div>
 <div class="scene-footer"><span>Drag to orbit · Scroll to zoom · ← → step one frame</span><span class="scale-tag" id="scale-tag"></span></div>
 <div id="scene-error" hidden></div>`);
 aside.insertAdjacentHTML('beforeend',`<div class="source-card"><span class="music-icon">♫</span><div><strong>Wizards in Winter</strong><small id="cue-info">Loading detected timing…</small></div><span class="chip" id="cue-chip">VIDEO</span></div>
 <div class="video-panel"><video id="video" playsinline preload="auto" muted></video><div id="video-empty" class="video-empty" hidden><label class="small-button">Load the original video<input id="video-file" type="file" accept="video/mp4,video/*"></label><small>Your MP4 of the official video. It stays on this computer and is remembered in this browser.</small></div></div>
 <p class="note video-status"><span id="video-status">Looking for the original video…</span> <button id="video-change" class="text-button inline" hidden>Change video</button></p>
 <p id="cue-note" class="note"></p>
 <div class="settings">
  <label class="range-label" for="brightness">Light intensity <span id="brightness-value">100%</span></label><input id="brightness" type="range" min="5" max="100" value="100">
  <label class="switch-row"><span>All props on <small id="all-on-hint"></small></span><input id="all-on" type="checkbox"></label>
 </div>
 <div class="field-title" style="margin-top:22px">Props <span class="note" id="frame-label"></span></div>
 <div id="board" class="board"></div>`);
 document.querySelector('main').insertAdjacentHTML('afterend',`<footer class="transport"><button id="play" class="play-button" aria-label="Play show" disabled>▶</button><button id="restart" class="restart-button" aria-label="Restart show">↺</button>
 <div class="frame-step"><button id="frame-back" class="step-button" aria-label="Back one frame" title="Back one frame (←)">⏴</button><span id="frame-number" class="frame-number" title="Video frame">–</span><button id="frame-forward" class="step-button" aria-label="Forward one frame" title="Forward one frame (→)">⏵</button></div>
 <div class="timeline-wrap"><div class="timeline-top"><strong id="range-name">Detected range</strong><span><b id="time">0:00</b> / <span id="duration">3:05</span></span></div><input id="timeline" type="range" aria-label="Show position" min="0" max="185" step="0.01" value="0"><div class="timeline-labels"><span id="range-start">0:00</span><span id="range-end"></span></div></div><label class="volume" aria-label="Volume">♪<input id="volume" type="range" min="0" max="100" value="35"></label></footer>
 <audio id="audio" preload="metadata" src="/media/wizards-in-winter.m4a"></audio>`);
}

export function startPlayer({houses,modes,debugName='winterlight'}){
 render(houses);
 const $=id=>document.getElementById(id),audio=$('audio'),video=$('video');
 let cues=null,brightness=1,allOn=false;
 const states=new Uint8Array(CHANNELS.length),levels=new Uint8Array(CHANNELS.length),ALL_ON=new Uint8Array(CHANNELS.map(c=>c.palette==='multi'?3:1)),FULL=new Uint8Array(CHANNELS.length).fill(100);
 const scenes={};
 for(const id of HOUSES){try{scenes[id]=houses[id].createScene($('viewport-'+id));scenes[id].view('video');}catch(error){$('scene-error').hidden=false;$('scene-error').textContent='The 3D scene needs WebGL. Enable hardware acceleration or try a WebGL-capable browser.';console.error(error);}}
 // Which house is on screen: one of them, or both stacked (original on top).
 const stage=document.querySelector('.stage'),panes={original:$('pane-original'),ours:$('pane-ours')};
 let mode='ours',viewName='video',overlayOn=false;
 const shows=id=>mode==='split'||mode===id;
 // Overlay mode: the original model's lights over the original video, lined up
 // in Video view, so each frame can be compared with what was filmed. Our house
 // doesn't line up with the filmed one, so it keeps the front view meanwhile.
 const overlayCanvas=$('overlay-video'),overlayContext=overlayCanvas.getContext('2d');
 function setView(name){
  if(name==='overlay'&&!shows('original'))name='video';
  viewName=name;overlayOn=name==='overlay';
  stage.classList.toggle('overlay',overlayOn);panes.original.classList.toggle('overlay',overlayOn);overlayCanvas.hidden=!overlayOn;$('overlay-controls').hidden=!overlayOn;
  $('view-overlay').setAttribute('aria-pressed',overlayOn);
  scenes.original?.view(name);scenes.ours?.view(overlayOn?'video':name);
 }
 for(const name of ['video','orbit','yard','overlay'])$('view-'+name).onclick=()=>setView(name==='overlay'&&overlayOn?'video':name);
 $('overlay-mix').oninput=e=>panes.original.style.setProperty('--model-mix',+e.target.value/100);
 $('overlay-diff').onchange=e=>panes.original.classList.toggle('difference',e.target.checked);
 // The toggle switches houses in place; the choice is kept in the URL (?house=) so it can be shared.
 const toggles=[...document.querySelectorAll('[data-mode]')];
 function setMode(next){
  mode=MODES.includes(next)?next:'ours';const page=modes[mode];
  stage.dataset.mode=mode;for(const id of HOUSES)panes[id].hidden=!shows(id);
  for(const b of toggles)b.setAttribute('aria-pressed',b.dataset.mode===mode);
  $('view-overlay').hidden=!shows('original');$('view-video').textContent=page.videoView;
  $('scale-tag').textContent=page.scaleTag;$('cue-note').textContent=page.cueNote;$('all-on-hint').textContent=page.allOnHint;$('aside-title').innerHTML=page.asideTitle;
  document.title=page.title;
  if(overlayOn&&!shows('original'))setView('video');else setView(viewName);
  const url=new URL(location.href);if(mode==='ours')url.searchParams.delete('house');else url.searchParams.set('house',mode);
  if(url.href!==location.href)history.replaceState(null,'',url);
 }
 for(const b of toggles)b.onclick=()=>setMode(b.dataset.mode);
 setMode(new URLSearchParams(location.search).get('house'));
 // Draws the frame the video is showing, fitted to the original's pane the same way the overlay camera is.
 function paintOverlay(){
  const pane=panes.original,dpr=Math.min(devicePixelRatio,2),w=Math.round(pane.clientWidth*dpr),h=Math.round(pane.clientHeight*dpr);
  if(overlayCanvas.width!==w||overlayCanvas.height!==h){overlayCanvas.width=w;overlayCanvas.height=h;}
  overlayContext.fillStyle='#000';overlayContext.fillRect(0,0,w,h);
  const ready=clock.usingVideo&&video.readyState>=2&&video.videoWidth;
  $('overlay-note').textContent=ready?houses.original.page.overlayNote:'Load the original video in the sidebar to compare it with the model.';
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
 const togglePlay=async()=>{const m=media();try{if(!m.paused)m.pause();else{if(m.ended)m.currentTime=0;await m.play();}}catch(error){$('cue-note').textContent=`Playback could not start: ${error.message}`;}};
 $('play').onclick=togglePlay;
 $('restart').onclick=()=>{media().currentTime=cues?.start||0;};
 // The playhead follows the show except while it is being dragged; seeks are
 // clamped to the media so the end of the slider never lands past it.
 const timeline=$('timeline');let scrubbing=false;
 const seek=t=>{const m=media(),d=Number.isFinite(m.duration)?m.duration:t;m.currentTime=Math.max(0,Math.min(t,d-.01));};
 timeline.addEventListener('pointerdown',()=>{scrubbing=true;});
 for(const type of ['pointerup','pointercancel'])addEventListener(type,()=>{scrubbing=false;});
 timeline.oninput=e=>seek(+e.target.value);
 timeline.onchange=e=>{seek(+e.target.value);scrubbing=false;};
 // Frame stepping pauses the show and lands in the middle of the next or
 // previous video frame, so the video and the lights show the same frame.
 const rate=()=>cues?.rate||SOURCE_RATE,firstPts=()=>cues?.firstPts||0;
 const frameAt=t=>Math.floor((t-firstPts())*rate()+1e-6);
 function step(frames){
  const m=media();m.pause();
  const d=Number.isFinite(m.duration)?m.duration:SOUNDTRACK_SECONDS,last=Math.floor((d-firstPts())*rate())-1;
  const f=Math.max(0,Math.min(last,frameAt(clock.time())+frames));
  m.currentTime=cues?cues.timeOf(f):(f+.5)/SOURCE_RATE;timeline.value=m.currentTime;
 }
 $('frame-back').onclick=()=>step(-1);$('frame-forward').onclick=()=>step(1);
 // ← → step one frame (Shift: one second), Space plays or pauses; text fields keep their keys.
 addEventListener('keydown',e=>{
  if(e.metaKey||e.ctrlKey||e.altKey)return;
  const el=e.target,tag=el?.tagName;
  if(tag==='TEXTAREA'||tag==='SELECT'||el?.isContentEditable||(tag==='INPUT'&&!['range','checkbox'].includes(el.type)))return;
  if(el?.type==='range'&&el!==timeline)return;
  if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();step((e.key==='ArrowLeft'?-1:1)*(e.shiftKey?Math.round(rate()):1));}
  else if(e.key===','||e.key==='.'){e.preventDefault();step(e.key===','?-1:1);}
  else if(e.key===' '&&tag!=='BUTTON'){e.preventDefault();togglePlay();}
 });
 $('volume').oninput=e=>{audio.volume=video.volume=+e.target.value/100;};audio.volume=video.volume=.35;
 $('brightness').oninput=e=>{brightness=+e.target.value/100;$('brightness-value').textContent=`${e.target.value}%`;for(const s of Object.values(scenes))s.setBrightness();};
 $('all-on').onchange=e=>{allOn=e.target.checked;};
 for(const m of [audio,video]){m.addEventListener('play',()=>{if(m===media())$('play').textContent='❚❚';});m.addEventListener('pause',()=>{if(m===media())$('play').textContent='▶';});}

 let lastUI=0;
 function animate(now){
  requestAnimationFrame(animate);
  const t=clock.time(),d=Number.isFinite(media().duration)?media().duration:SOUNDTRACK_SECONDS;
  const values=allOn?ALL_ON:cues?cues.stateAt(t,states,levels):states.fill(0),level=allOn?FULL:levels;
  for(const id of HOUSES)if(shows(id))scenes[id]?.draw(values,level,brightness);board(values,level);if(overlayOn)paintOverlay();
  const paused=media().paused;
  if(paused||now-lastUI>80){lastUI=now;$('time').textContent=format(t);$('duration').textContent=format(d);$('timeline').max=d;if(!scrubbing)timeline.value=t;
   const f=frameAt(t);$('frame-number').textContent=`${(f+1).toLocaleString()}`;
   $('frame-label').textContent=cues?(f>=cues.startFrame&&f<cues.endFrame?`· video frame ${f+1}`:'· outside the detected range'):'';}
 }
 requestAnimationFrame(animate);

 // Read-only diagnostics for browser checks.
 window[debugName]={get status(){const t=clock.time();return {time:t,clock:clock.usingVideo?'video':'soundtrack',videoTime:video.currentTime,frame:frameAt(t),channels:CHANNELS.length,mode,view:viewName,bulbs:Object.fromEntries(HOUSES.map(id=>[id,scenes[id]?.bulbCount])),lit:[...states].filter(Boolean).length,cues:!!cues};}};
}
