import {CHANNELS} from '~~/src/original/layout.js';
import {prepareOriginalCues} from '~~/src/original/cues.js';
import {createShowClock,HOSTED_VIDEO,SOURCE_RATE,matchesSource,rememberVideo,recallVideo,forgetVideo} from '~~/src/original/video-clock.js';

// The show player both houses share: the same controls, the same detected cue
// file and the same video clock, with a toggle between the original house, our
// house, or both stacked. Each house brings its own 3D scene (whose draw()
// takes per-channel colour states and levels) and its own wording.
export const formatTime=t=>`${Math.floor(t/60)}:${String(Math.floor(t%60)).padStart(2,'0')}`;
const SOUNDTRACK_SECONDS=185.875737;

// The houses the page can show, in the order the toggle lists them.
export const MODES=['original','ours','split'];
export const HOUSES=['original','ours'];

export function useShowPlayer({houses,modes,debugName='winterlight'}){
 // Elements the template hands over once mounted.
 const route=useRoute();
 const el={viewports:{original:ref(),ours:ref()},originalPane:ref(),overlayCanvas:ref(),video:ref(),audio:ref(),timeline:ref(),videoFile:ref(),board:ref()};
 const state=reactive({
  mode:'ours',view:'video',overlayOn:false,overlayMix:70,overlayDiff:false,overlayNote:'',
  ready:false,playing:false,time:'0:00',duration:'3:05',frame:'–',frameLabel:'',
  cueInfo:'Loading detected timing…',cueChip:'VIDEO',rangeName:'Detected range',rangeStart:'0:00',rangeEnd:'',
  videoStatus:'Looking for the original video…',videoEmpty:false,videoChange:false,playbackError:'',
  brightness:100,allOn:false,volume:35,sceneError:'',
 });
 const page=computed(()=>modes[state.mode]);
 const shows=id=>state.mode==='split'||state.mode===id;
 const scenes={};
 let cues=null,clock=null,frameRequest=0,videoUrl=null;

 // Overlay mode: the original model's lights over the original video, lined up
 // in Video view, so each frame can be compared with what was filmed. Our house
 // doesn't line up with the filmed one, so it keeps the front view meanwhile.
 function setView(name){
  if(name==='overlay'&&!shows('original'))name='video';
  state.view=name;state.overlayOn=name==='overlay';
  scenes.original?.view(name);scenes.ours?.view(state.overlayOn?'video':name);
 }
 const pressView=name=>setView(name==='overlay'&&state.overlayOn?'video':name);

 // The toggle switches houses in place; the choice is kept in the URL (?house=) so it can be shared.
 function setMode(next){
  state.mode=MODES.includes(next)?next:'ours';state.playbackError='';
  if(state.overlayOn&&!shows('original'))setView('video');else setView(state.view);
  const url=new URL(location.href);if(state.mode==='ours')url.searchParams.delete('house');else url.searchParams.set('house',state.mode);
  if(url.href!==location.href)history.replaceState(history.state,'',url);
 }

 // Draws the frame the video is showing, fitted to the original's pane the same way the overlay camera is.
 let overlayContext=null;
 function paintOverlay(){
  const pane=el.originalPane.value,canvas=el.overlayCanvas.value,video=el.video.value;if(!pane||!canvas)return;
  overlayContext||=canvas.getContext('2d');
  const dpr=Math.min(devicePixelRatio,2),w=Math.round(pane.clientWidth*dpr),h=Math.round(pane.clientHeight*dpr);
  if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}
  overlayContext.fillStyle='#000';overlayContext.fillRect(0,0,w,h);
  const ready=clock.usingVideo&&video.readyState>=2&&video.videoWidth;
  state.overlayNote=ready?houses.original.page.overlayNote:'Load the original video in the sidebar to compare it with the model.';
  if(!ready)return;
  const k=Math.min(w/video.videoWidth,h/video.videoHeight),vw=video.videoWidth*k,vh=video.videoHeight*k;
  overlayContext.drawImage(video,(w-vw)/2,(h-vh)/2,vw,vh);
 }

 async function load(){
  try{
   const response=await fetch('/outputs/original-house-cues.json');
   if(!response.ok)throw new Error('No detected timing has been published yet.');
   const data=await response.json().catch(()=>{throw new Error('No detected timing has been published yet.');});
   cues=prepareOriginalCues(data,CHANNELS);
   state.cueInfo=`${(cues.endFrame-cues.startFrame).toLocaleString()} video frames · ${formatTime(cues.start)}–${formatTime(cues.end)} detected`;
   state.rangeName=`Detected from the original video · ${formatTime(cues.start)}–${formatTime(cues.end)}`;
   state.rangeStart=formatTime(cues.start);state.rangeEnd=`detected until ${formatTime(cues.end)}`;
  }catch(error){state.cueInfo=error.message;state.cueChip='NONE';}
  state.ready=true;
 }

 // The original video plays in the side panel with its own sound; once it is
 // there it becomes the clock, otherwise the soundtrack is.
 function showVideo(source,name,picked,startAt=0){
  const video=el.video.value;
  if(videoUrl)URL.revokeObjectURL(videoUrl);videoUrl=typeof source==='string'?null:URL.createObjectURL(source);
  video.src=videoUrl||source;state.videoStatus='Loading the original video…';
  video.onloadedmetadata=()=>{video.onerror=null;state.videoEmpty=false;state.videoChange=picked;if(startAt)video.currentTime=startAt;clock.useVideo();
   state.videoStatus=matchesSource(video.duration)?`${name} · the lights follow the frame on screen`:`${name} is ${formatTime(video.duration)} long, not the 3:05 original, so its frames won't line up with the lights.`;
   if(typeof source==='string')ensureSeekable(source,name);};
  video.onerror=()=>{video.onloadedmetadata=null;clock.useAudio();if(picked)forgetVideo();askForVideo('That file could not be played. ');};
 }
 // A server that ignores byte ranges leaves only the downloaded part seekable;
 // then play the whole file from memory so any point can be reached.
 async function ensureSeekable(source,name){
  const video=el.video.value,s=video.seekable;if(s.length&&s.end(s.length-1)>=video.duration-1)return;
  try{const blob=await (await fetch(source,{cache:'no-store'})).blob();const t=video.currentTime,playing=!video.paused;showVideo(blob,name,false,t);if(playing)video.play().catch(()=>{});}catch{}
 }
 function askForVideo(prefix=''){state.videoEmpty=true;state.videoChange=false;state.videoStatus=`${prefix}Until a video is loaded, the lights follow the soundtrack.`;}
 function pickVideo(e){const file=e.target.files[0];if(!file)return;rememberVideo(file);showVideo(file,file.name,true);e.target.value='';}
 const changeVideo=()=>el.videoFile.value?.click();

 const media=()=>clock.media;
 async function togglePlay(){const m=media();try{if(!m.paused)m.pause();else{if(m.ended)m.currentTime=0;await m.play();}}catch(error){state.playbackError=`Playback could not start: ${error.message}`;}}
 const restart=()=>{media().currentTime=cues?.start||0;};

 // The playhead follows the show except while it is being dragged; seeks are
 // clamped to the media so the end of the slider never lands past it.
 let scrubbing=false;
 const seek=t=>{const m=media(),d=Number.isFinite(m.duration)?m.duration:t;m.currentTime=Math.max(0,Math.min(t,d-.01));};
 const scrubStart=()=>{scrubbing=true;};
 const scrubEnd=()=>{scrubbing=false;};
 const scrub=e=>seek(+e.target.value);
 const scrubDone=e=>{seek(+e.target.value);scrubbing=false;};

 // Frame stepping pauses the show and lands in the middle of the next or
 // previous video frame, so the video and the lights show the same frame.
 const rate=()=>cues?.rate||SOURCE_RATE,firstPts=()=>cues?.firstPts||0;
 const frameAt=t=>Math.floor((t-firstPts())*rate()+1e-6);
 function step(frames){
  const m=media();m.pause();
  const d=Number.isFinite(m.duration)?m.duration:SOUNDTRACK_SECONDS,last=Math.floor((d-firstPts())*rate())-1;
  const f=Math.max(0,Math.min(last,frameAt(clock.time())+frames));
  m.currentTime=cues?cues.timeOf(f):(f+.5)/SOURCE_RATE;el.timeline.value.value=m.currentTime;
 }
 // ← → step one frame (Shift: one second), Space plays or pauses; text fields keep their keys.
 function onKey(e){
  if(e.metaKey||e.ctrlKey||e.altKey)return;
  const target=e.target,tag=target?.tagName,timeline=el.timeline.value;
  if(tag==='TEXTAREA'||tag==='SELECT'||target?.isContentEditable||(tag==='INPUT'&&!['range','checkbox'].includes(target.type)))return;
  if((target?.type==='range'||target?.getAttribute?.('role')==='slider')&&target!==timeline)return;
  if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();step((e.key==='ArrowLeft'?-1:1)*(e.shiftKey?Math.round(rate()):1));}
  else if(e.key===','||e.key==='.'){e.preventDefault();step(e.key===','?-1:1);}
  else if(e.key===' '&&tag!=='BUTTON'){e.preventDefault();togglePlay();}
 }

 watch(()=>state.volume,v=>{if(el.audio.value)el.audio.value.volume=el.video.value.volume=v/100;});
 watch(()=>state.brightness,()=>{for(const s of Object.values(scenes))s.setBrightness();});

 const states=new Uint8Array(CHANNELS.length),levels=new Uint8Array(CHANNELS.length),ALL_ON=new Uint8Array(CHANNELS.map(c=>c.palette==='multi'?3:1)),FULL=new Uint8Array(CHANNELS.length).fill(100);
 let lastUI=0;
 function animate(now){
  frameRequest=requestAnimationFrame(animate);
  const t=clock.time(),d=Number.isFinite(media().duration)?media().duration:SOUNDTRACK_SECONDS,brightness=state.brightness/100;
  const values=state.allOn?ALL_ON:cues?cues.stateAt(t,states,levels):states.fill(0),level=state.allOn?FULL:levels;
  for(const id of HOUSES)if(shows(id))scenes[id]?.draw(values,level,brightness);el.board.value?.update(values,level);if(state.overlayOn)paintOverlay();
  const paused=media().paused;
  if(paused||now-lastUI>80){lastUI=now;state.time=formatTime(t);state.duration=formatTime(d);const timeline=el.timeline.value;timeline.max=d;if(!scrubbing)timeline.value=t;timeline.style.setProperty('--progress',`${Math.min(100,t/d*100)}%`);
   const f=frameAt(t);state.frame=(f+1).toLocaleString();
   state.frameLabel=cues?(f>=cues.startFrame&&f<cues.endFrame?`· video frame ${f+1}`:'· outside the detected range'):'';}
 }

 onMounted(()=>{
  const audio=el.audio.value,video=el.video.value;
  for(const id of HOUSES){try{scenes[id]=houses[id].createScene(el.viewports[id].value);scenes[id].view('video');}catch(error){state.sceneError='The 3D scene needs WebGL. Enable hardware acceleration or try a WebGL-capable browser.';console.error(error);}}
  clock=createShowClock(audio,video);
  setMode(new URLSearchParams(location.search).get('house'));
  // During hydration the router briefly reports the prerendered path without its query; follow it once it settles.
  watch(()=>route.query.house,house=>{if((house||'ours')!==state.mode)setMode(house);});
  load();
  (async()=>{
   try{const r=await fetch(HOSTED_VIDEO,{method:'HEAD'});if(r.ok&&(r.headers.get('content-type')||'').startsWith('video/')){showVideo(HOSTED_VIDEO,'Original video',false);return;}}catch{}
   const saved=await recallVideo();if(saved)showVideo(saved,saved.name||'Original video',true);else askForVideo();
  })();
  audio.volume=video.volume=state.volume/100;
  for(const m of [audio,video]){m.addEventListener('play',()=>{if(m===media())state.playing=true;});m.addEventListener('pause',()=>{if(m===media())state.playing=false;});}
  addEventListener('keydown',onKey);
  for(const type of ['pointerup','pointercancel'])addEventListener(type,scrubEnd);
  frameRequest=requestAnimationFrame(animate);
  // Read-only diagnostics for browser checks.
  window[debugName]={get status(){const t=clock.time();return {time:t,clock:clock.usingVideo?'video':'soundtrack',videoTime:video.currentTime,frame:frameAt(t),channels:CHANNELS.length,mode:state.mode,view:state.view,bulbs:Object.fromEntries(HOUSES.map(id=>[id,scenes[id]?.bulbCount])),lit:[...states].filter(Boolean).length,cues:!!cues};}};
 });
 onBeforeUnmount(()=>{
  cancelAnimationFrame(frameRequest);removeEventListener('keydown',onKey);
  for(const type of ['pointerup','pointercancel'])removeEventListener(type,scrubEnd);
  clock?.media.pause();if(videoUrl)URL.revokeObjectURL(videoUrl);delete window[debugName];
 });

 return {el,state,page,shows,setMode,pressView,togglePlay,restart,step,scrubStart,scrub,scrubDone,pickVideo,changeVideo};
}
