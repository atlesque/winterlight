// Keeps the official YouTube video in step with the hosted soundtrack. The
// video plays muted beside the model. While both play, the lights read the
// video's clock and the soundtrack is nudged to it when they drift apart; if
// the video buffers, the soundtrack and the lights wait for it.
export const VIDEO_ID='pWBjl-jPcVM';
// Seconds to add to the soundtrack time to get the YouTube time. The hosted
// soundtrack comes from the same official video, so they share one timeline.
export const VIDEO_OFFSET=0;
export const MAX_DRIFT=.12;

// How far the soundtrack must move to match the video, or 0 when close enough.
export function driftCorrection(videoTime,audioTime,offset=VIDEO_OFFSET,max=MAX_DRIFT){
 if(!Number.isFinite(videoTime)||!Number.isFinite(audioTime))return 0;
 const drift=videoTime-offset-audioTime;
 return Math.abs(drift)>max?drift:0;
}

// The video has no controls of its own, so only buffering and playing matter;
// pauses it reports are echoes of our own seeks and pauses.
const PLAYING=1,BUFFERING=3;
function loadApi(){
 if(window.YT?.Player)return Promise.resolve(window.YT);
 return new Promise((resolve,reject)=>{
  const previous=window.onYouTubeIframeAPIReady;
  window.onYouTubeIframeAPIReady=()=>{previous?.();resolve(window.YT);};
  const script=document.createElement('script');script.src='https://www.youtube.com/iframe_api';script.onerror=()=>reject(new Error('Could not reach YouTube.'));document.head.appendChild(script);
 });
}

export function syncYouTube(host,audio,onStatus=()=>{}){
 let player=null,ready=false,holding=false,lastDrift=null,ownSeek=false,resuming=false;
 // Moves the soundtrack to the video without echoing the seek back to the video.
 const setAudio=t=>{ownSeek=true;audio.currentTime=Math.max(0,t);};
 const videoTime=()=>player.getCurrentTime()||0;
 // Seeks the video to the soundtrack, unless it is already there (a seek makes YouTube buffer).
 const follow=()=>{if(!ready)return;const target=Math.max(0,audio.currentTime+VIDEO_OFFSET);if(Math.abs(videoTime()-target)>MAX_DRIFT)player.seekTo(target,true);};
 audio.addEventListener('play',()=>{if(!ready)return;if(resuming){resuming=false;return;}follow();player.playVideo();});
 audio.addEventListener('pause',()=>{if(ready&&!holding)player.pauseVideo();});
 audio.addEventListener('seeking',()=>{if(ownSeek){ownSeek=false;return;}if(!holding)follow();});
 audio.addEventListener('ended',()=>ready&&player.pauseVideo());
 function onState({data}){
  if(data===BUFFERING&&!audio.paused){holding=true;audio.pause();onStatus('Video buffering · lights waiting');}
  else if(data===PLAYING&&holding){holding=false;setAudio(videoTime()-VIDEO_OFFSET);resuming=true;
   // Audio takes a moment to start; line it up again once it is actually playing.
   audio.addEventListener('playing',()=>setAudio(videoTime()-VIDEO_OFFSET),{once:true});
   audio.play().catch(()=>{resuming=false;});onStatus('In sync with the video');}
  else if(data===PLAYING&&audio.paused){player.pauseVideo();}
 }
 setInterval(()=>{
  if(!ready||holding||audio.paused||player.getPlayerState()!==PLAYING)return;
  const vt=videoTime(),fix=driftCorrection(vt,audio.currentTime);lastDrift=vt-VIDEO_OFFSET-audio.currentTime;
  if(fix)setAudio(audio.currentTime+fix);
  onStatus(fix?'Resynced to the video':`In sync with the video · ${Math.round(Math.abs(lastDrift)*1000)} ms apart`);
 },500);
 loadApi().then(YT=>{
  player=new YT.Player(host,{videoId:VIDEO_ID,width:'100%',height:'100%',playerVars:{playsinline:1,controls:0,disablekb:1,rel:0,modestbranding:1,mute:1,origin:location.origin},
   events:{onReady:()=>{ready=true;player.mute();follow();onStatus('Video ready · plays with the show');},onStateChange:onState,
    onError:e=>{ready=false;holding=false;onStatus(`YouTube can't play here (code ${e.data}); the lights still follow the soundtrack.`);}}});
 }).catch(error=>onStatus(`${error.message} The lights still follow the soundtrack.`));
 // While the video is playing the lights read its clock, so they stay on the
 // picture's frames even when the soundtrack runs a few milliseconds off.
 const time=()=>ready&&!holding&&!audio.paused&&player.getPlayerState()===PLAYING?Math.max(0,videoTime()-VIDEO_OFFSET):audio.currentTime;
 return {time,get ready(){return ready;},get drift(){return lastDrift;}};
}
