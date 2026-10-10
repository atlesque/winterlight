// Drives the show from one media element at a time: the hosted soundtrack, or
// the original video once it is available. The video carries its own sound, so
// while it plays nothing needs syncing: the lights read the frame on screen.
export const HOSTED_VIDEO='/media/wizards-in-winter-video.mp4';
// Length of the original upload the cues were detected from.
export const SOURCE_SECONDS=185.875737;
// Its frame rate (30000/1001), for stepping frames before the cues have loaded.
export const SOURCE_RATE=30000/1001;

// Whether a video is the same cut as the source, so its frames line up with the cues.
export function matchesSource(duration,expected=SOURCE_SECONDS){return Number.isFinite(duration)&&Math.abs(duration-expected)<.5;}

export function createShowClock(audio,video,onChange=()=>{}){
 let media=audio,frameTime=null,watching=false;
 // Presentation time of the frame on screen, so the lights change with the picture.
 const watch=()=>video.requestVideoFrameCallback((now,meta)=>{frameTime=meta.mediaTime;watch();});
 video.addEventListener('seeking',()=>{frameTime=null;});
 function switchTo(next){
  if(next===media)return;
  const t=media.currentTime,playing=!media.paused;media.pause();
  next.currentTime=t;media=next;onChange(media);
  if(playing)next.play().catch(()=>{});
 }
 return {
  get media(){return media;},
  get usingVideo(){return media===video;},
  useVideo(){video.muted=false;if(!watching&&video.requestVideoFrameCallback){watching=true;watch();}switchTo(video);},
  useAudio(){switchTo(audio);},
  time(){return media===video&&!video.paused&&frameTime!=null?frameTime:media.currentTime;},
 };
}

// The picked video is kept in this browser so it only has to be chosen once.
const DB='winterlight',STORE='media',KEY='original-video';
function open(){return new Promise((resolve,reject)=>{const r=indexedDB.open(DB,1);r.onupgradeneeded=()=>r.result.createObjectStore(STORE);r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});}
async function run(mode,fn){const db=await open();return new Promise((resolve,reject)=>{const tx=db.transaction(STORE,mode),r=fn(tx.objectStore(STORE));tx.oncomplete=()=>{db.close();resolve(r.result);};tx.onerror=()=>{db.close();reject(tx.error);};});}
export async function rememberVideo(file){try{await run('readwrite',s=>s.put(file,KEY));}catch{}}
export async function recallVideo(){try{return await run('readonly',s=>s.get(KEY))||null;}catch{return null;}}
export async function forgetVideo(){try{await run('readwrite',s=>s.delete(KEY));}catch{}}
