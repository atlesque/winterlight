import './style.css';
import mapCSV from '../outputs/pixel-map.csv?raw';
import {parseMap,makeLayout,renderFrame,estimatePower,cueAt,CUES,FPS,BANK_COLORS} from './show.js';
import {AudioClock} from './audio.js';
import {createScene} from './scene.js';
import {decodeTiming,copyFrame,sha256,verifyRgbIntegrity} from './timing.js';
import {SourceVideoClock} from './video-clock.js';
import {HostedAudioClock} from './hosted-clock.js';

const $=id=>document.getElementById(id), props=parseMap(mapCSV),pixels=makeLayout(props),audio=new AudioClock();
let mode='demo',youtube=null,ytReady=false,ytError=null,brightness=.3,white=false,colors=new Float32Array(3150),scene,selected=null,latestTime=0,exporting=false;
let sourceSequence=null,sourceFrame=-1;
const sourceClock=new SourceVideoClock($('source-video'),(index,metadata,audit)=>{
  sourceFrame=index;if(mode!=='timing'||!sourceSequence)return;copyFrame(sourceSequence,index,colors);scene?.draw(colors);
  $('frame-audit').dataset.audit=JSON.stringify({...audit,frame:index,mediaTime:metadata.mediaTime,ended:sourceClock.video.ended});
  text('frame-audit',`${index<0?"Black / end":"Frame "+(index+1)} / ${sourceSequence.meta.frameCount} · source PTS ${(metadata.mediaTime).toFixed(6)}s · covered ${audit?.uniqueFrames||0} · skipped ${audit?.skippedSourceFrames||0} · unmatched ${audit?.unmatchedPTS||0} · late callbacks ${audit?.lateCallbacks||0} · max PTS error ${audit?.maxTimestampErrorUs||0}µs`);
},message=>{if(mode==='timing'){notice(message);$('play').disabled=!sourceClock.ready;}});
$('source-video').volume=.35;
const hostedClock=new HostedAudioClock($('hosted-audio'),(index,audit)=>{if(mode!=='soundtrack'||!sourceSequence)return;sourceFrame=index;copyFrame(sourceSequence,index,colors);text('hosted-audit',`Stored frame ${index+1} / ${sourceSequence.meta.frameCount} · audio clock · skipped ${audit.skippedSourceFrames}`);$('hosted-audit').dataset.audit=JSON.stringify({...audit,frame:index,mediaTime:hostedClock.time});});
$('hosted-audio').volume=.35;
const mapHash=sha256(new TextEncoder().encode(mapCSV));
function leaveSource(){sourceClock.pause();hostedClock.pause();$('brightness').disabled=false;$('white-test').disabled=false;}
const format=t=>`${Math.floor(t/60)}:${String(Math.floor(t%60)).padStart(2,'0')}`;
const text=(id,value)=>$(id).textContent=value;
function duration(){return mode==='soundtrack'?hostedClock.duration:mode==='timing'?sourceClock.duration||185:mode==='youtube'?youtube?.getDuration?.()||185:audio.duration;}
function time(){return mode==='soundtrack'?hostedClock.time:mode==='timing'?sourceClock.time:mode==='youtube'?youtube?.getCurrentTime?.()||0:audio.time;}
function playing(){return mode==='soundtrack'?hostedClock.playing:mode==='timing'?sourceClock.playing:mode==='youtube'?youtube?.getPlayerState?.()===1:audio.playing;}
function notice(value){text('source-note',value);}
function select(prop){selected=prop;$('prop-select').value=prop.id;$('inspector').innerHTML=`<span class="eyebrow muted">PROP INSPECTOR</span><h3>${prop.id.replace(/(Arch|Bar|Star)(\d)/,'$1 $2').replace('Matrix25x10','Matrix · 25 × 10')}</h3><div class="prop-details"><span>${prop.count} pixels · Bank ${prop.bank} / Port ${prop.port}</span><span>RGB channels ${prop.channelStart}–${prop.channelEnd}</span><span>${prop.sections} isolated 50-node power sections</span><span>Full white: ${prop.count*.72} W / ${(prop.count*.06).toFixed(1)} A</span></div>`;}
$('prop-select').innerHTML+=props.map(p=>`<option value="${p.id}">${p.id} · ${p.count} pixels</option>`).join('');
$('prop-select').onchange=e=>{const prop=props.find(p=>p.id===e.target.value);if(prop)select(prop);};
try{scene=createScene($('viewport'),pixels,select);}catch(error){$('scene-error').hidden=false;text('scene-error','The 3D scene needs WebGL. Enable hardware acceleration or try a WebGL-capable browser.');console.error(error);}
$('bank-bars').innerHTML=['A','B','C'].map(bank=>`<div class="bank-row"><span style="color:${BANK_COLORS[bank]}">${bank}</span><div class="bank-track"><i id="bank-${bank}" style="background:${BANK_COLORS[bank]}"></i></div><b id="watts-${bank}">0 W</b></div>`).join('');
const reviews=[
 ['01','Separate the fusing','Add three rated distribution blocks, 21 protected 50-node feeds and positive isolation. The kit’s 7.5 A output fuses alone do not implement this plan.'],
 ['02','Allow for the pixel loom','10 cm factory wire spacing leaves substantial cable behind dense stars, bars and the panel. Provide strain relief and dry sealed breaks.'],
 ['03','Resolve the service location','Three nearby dry banks are a layout assumption. If no suitable route exists, redesign with documented outdoor assemblies or supported differential data.'],
 ['04','Specify the actual props','100-node stars and the 250-node panel are custom designs. A 150-node retail star changes both channel and power allocations.'],
 ['05','Complete the small parts','Eleven data tails, 21 feed connections, caps, glands, mounts, ballast, rated DC cable and matching fuse holders need an explicit order.'],
 ['06','Close the playback chain','Include FPP host + PSU + storage, Ethernet switch and cables, wired audio, lawful recording and corrected music cues. The YouTube mode is approximate.'],
];
$('review-list').innerHTML=reviews.map(([n,title,body])=>`<article class="review"><span>${n}</span><div><h3>${title}</h3><p>${body}</p></div></article>`).join('');
for(const [tab,panel] of [['show','show'],['parts','parts']]) $(tab+'-tab').onclick=()=>{for(const key of ['show','parts']){$(key+'-panel').hidden=key!==panel;$(key+'-tab').classList.toggle('active',key===panel);}};
for(const id of ['front','orbit','overhead'])$(id).onclick=()=>scene?.view(id);
$('wires').onchange=e=>scene?.setWires(e.target.checked);
$('brightness').oninput=e=>{brightness=+e.target.value/100;text('brightness-value',`${e.target.value}%`);};
$('white-test').onchange=e=>white=e.target.checked;
$('volume').oninput=e=>{audio.setVolume(+e.target.value/100);$('source-video').volume=+e.target.value/100;$('hosted-audio').volume=+e.target.value/100;if(ytReady)youtube.setVolume(+e.target.value);};
$('play').onclick=async()=>{try{if(mode==='soundtrack'){playing()?hostedClock.pause():await hostedClock.play();}else if(mode==='timing'){playing()?sourceClock.pause():await sourceClock.play();}else if(mode==='youtube'){if(!ytReady){notice('Wait for the video player or choose a local audio file.');return;}playing()?youtube.pauseVideo():youtube.playVideo();}else{if(playing())audio.pause();else await audio.play();}}catch(e){notice(`Audio could not start: ${e.message}`);}};
function seek(t){if(mode==='soundtrack'){hostedClock.seek(t);}else if(mode==='timing'){sourceClock.seek(t);}else if(mode==='youtube'){if(ytReady)youtube.seekTo(t,true);}else audio.seek(t);}
$('restart').onclick=()=>seek(0);$('timeline').oninput=e=>seek(+e.target.value);
function setTrack(name,info,chip,note){text('track-name',name);text('track-info',info);text('source-chip',chip);notice(note);$('source-video-container').hidden=mode!=='timing';$('hosted-audit').hidden=mode!=='soundtrack';$('play').disabled=(mode==='youtube'&&!!ytError)||(mode==='timing'&&!sourceClock.ready)||(mode==='soundtrack'&&!hostedClock.ready);$('demo-button').hidden=mode==='demo';$('youtube-container').hidden=mode!=='youtube';$('export').disabled=mode==='youtube'||mode==='timing'||mode==='soundtrack';text('export-note',(mode==='timing'||mode==='soundtrack')?'The loaded .wltiming file is the authoritative reusable sequence; it is not regenerated here.':mode==='youtube'?'YouTube cannot be exported here. Load a local recording or use the original demo.':'Exports RGB channel data and cues. Browser simulation; does not send to real controllers.');}
let loadGeneration=0;
$('audio-file').onchange=async e=>{const file=e.target.files[0];if(!file)return;const generation=++loadGeneration;leaveSource();audio.pause();if(ytReady)youtube.pauseVideo();notice('Decoding the recording and finding musical accents…');$('play').disabled=true;
 try{await audio.load(file,()=>generation===loadGeneration);if(generation!==loadGeneration)return;mode='local';setTrack(file.name,`${format(audio.duration)} · ${audio.analysis.length} analysed frames`,'LOCAL','This recording stays in your browser. Accents follow detected audio energy; phrase choreography is an adaptation, not the original sequence.');}catch(error){notice(`Could not decode this file. Choose a browser-supported MP3 or WAV. ${error.message}`);}finally{$('play').disabled=false;}
};
$('demo-button').onclick=async()=>{++loadGeneration;leaveSource();audio.pause();if(ytReady)youtube.pauseVideo();mode='demo';await audio.demo();setTrack('Winterlight demo','Original synthetic test score · 3:05','DEMO','The demo is an original test score, not Wizards in Winter. Load your recording for audio-driven accents.');};
$('youtube-button').onclick=()=>{++loadGeneration;leaveSource();audio.pause();mode='youtube';setTrack('Wizards in Winter','Trans-Siberian Orchestra · official reference','VIDEO','Lights follow the video’s playback position. Cues are an authored approximation; audio analysis is unavailable for embedded video.');
 if(ytError){notice(`YouTube playback is unavailable here (code ${ytError}). Load your own lawful MP3/WAV or use the original demo.`);return;}if(ytReady)return;
 const create=()=>{if(youtube)return;youtube=new window.YT.Player('youtube-player',{videoId:'pWBjl-jPcVM',width:'100%',height:185,playerVars:{playsinline:1,origin:location.origin},events:{onReady:()=>{ytReady=true;youtube.setVolume(+$('volume').value);},onError:e=>{ytError=e.data;$('play').disabled=mode==='youtube';notice(`YouTube playback is unavailable here (code ${e.data}). Load your own lawful MP3/WAV or use the original demo.`);}}});};
 if(window.YT?.Player)create();else{window.onYouTubeIframeAPIReady=create;if(!document.querySelector('#yt-api')){const script=document.createElement('script');script.id='yt-api';script.src='https://www.youtube.com/iframe_api';script.onerror=()=>notice('Could not reach YouTube. Local audio and the original demo work independently.');document.head.appendChild(script);}}
};
$('export').onclick=async()=>{if(mode==='youtube'||mode==='timing'||mode==='soundtrack'||exporting)return;exporting=true;$('export').disabled=true;const wasPlaying=audio.playing,priorMode=mode;audio.pause();try{if(!audio.buffer)await audio.demo();const exportDuration=audio.duration,exportAnalysis=audio.analysis,exportBrightness=brightness,exportMode=mode;const frames=Math.ceil(exportDuration*FPS),data=new Uint8Array(frames*3150),scratch=new Float32Array(3150);for(let f=0;f<frames;f++){renderFrame(pixels,f/FPS,exportDuration,exportBrightness,exportAnalysis,false,scratch);for(let c=0;c<3150;c++)data[f*3150+c]=Math.round(scratch[c]*255);if(f%400===0){text('export-note',`Rendering frames… ${Math.round(f/frames*100)}%`);await new Promise(resolve=>setTimeout(resolve,0));}}
 const meta={format:'Winterlight RGB v1',fps:FPS,channels:3150,frames,duration:exportDuration,source:exportMode,brightness:exportBrightness,whiteTest:false,cueStatus:'Adapted phrase cues; detected audio accents',props,cues:CUES.map(c=>({...c,time:c.at*exportDuration}))};const header=new TextEncoder().encode(JSON.stringify(meta)),prefix=new Uint8Array(8);prefix.set([87,76,83,49]);new DataView(prefix.buffer).setUint32(4,header.length,true);const url=URL.createObjectURL(new Blob([prefix,header,data],{type:'application/octet-stream'})),a=document.createElement('a');a.href=url;a.download='winterlight-show.wlshow';a.click();setTimeout(()=>URL.revokeObjectURL(url),60000);text('export-note',`Exported ${frames.toLocaleString()} frames / ${(data.length/1e6).toFixed(1)} MB. Custom RGB format; not an FSEQ file. No audio is bundled.`);
 }catch(e){text('export-note',`Export failed: ${e.message}`);}finally{exporting=false;$('export').disabled=mode==='youtube'||mode==='timing'||mode==='soundtrack';if(wasPlaying&&mode===priorMode)audio.play();}
};
let lastUI=0;
function animate(now){requestAnimationFrame(animate);latestTime=time();const d=duration();if(mode==='soundtrack')hostedClock.sample();if(mode!=='timing'&&mode!=='soundtrack')renderFrame(pixels,latestTime,d,brightness,mode==='youtube'?null:audio.analysis,white,colors);if(mode!=='timing'||!sourceClock.playing)scene?.draw(colors);if(now-lastUI>100){lastUI=now;const power=estimatePower(pixels,colors);text('power-total',`${Math.round(power.total)} W`);for(const bank of ['A','B','C']){$('bank-'+bank).style.width=`${power.watts[bank]/252*100}%`;text('watts-'+bank,`${Math.round(power.watts[bank])} W`);}text('time',format(latestTime));text('duration',format(d));text('cue-name',(mode==='timing'||mode==='soundtrack')?`Source frame ${sourceFrame+1} · stored RGB`:white?'Power test · full-white override':cueAt(latestTime,d).name);$('timeline').max=d;$('timeline').value=latestTime;text('play',playing()?'Ⅱ':'▶');$('play').setAttribute('aria-label',playing()?'Pause show':'Play show');}}
requestAnimationFrame(animate);
function enterSource(){++loadGeneration;audio.pause();hostedClock.pause();if(ytReady)youtube.pauseVideo();mode='timing';sourceClock.fail('Checking source files…');sourceFrame=-1;white=false;$('white-test').checked=false;$('white-test').disabled=true;$('brightness').disabled=true;colors.fill(0);setTrack('Source-frame sequence','Video + shared .wltiming','FRAMES','Load both the source recording and its timing file.');}
$('source-video-file').onchange=async e=>{const file=e.target.files[0];if(!file)return;enterSource();try{await sourceClock.load(file);}catch(error){notice(error.message);}};
async function loadSequence(bytes){enterSource();const generation=loadGeneration;try{const sequence=await verifyRgbIntegrity(decodeTiming(await bytes));if(sequence.meta.channelMapSha256!==await mapHash)throw new Error('This timing file uses a different channel map.');if(generation!==loadGeneration)return;sourceSequence=sequence;sourceFrame=-1;await sourceClock.setSequence(sequence);text('track-info',`${sequence.meta.frameCount.toLocaleString()} source frames · ${format(sequence.meta.durationUs/1e6)} · camera-effect adaptation`);}catch(error){if(generation!==loadGeneration)return;sourceSequence=null;sourceClock.sequence=null;sourceClock.fail(error.message);}}
$('timing-file').onchange=e=>{const file=e.target.files[0];if(file)loadSequence(file.arrayBuffer());};
$('extracted-show').onclick=()=>loadSequence(fetch('/outputs/wizards-ground-level.wltiming').then(r=>{if(!r.ok)throw new Error('Extracted show file is unavailable.');return r.arrayBuffer();}));

async function prepareHostedShow(autoplay=false){
 ++loadGeneration;const generation=loadGeneration;leaveSource();audio.pause();if(ytReady)youtube.pauseVideo();mode='soundtrack';white=false;$('white-test').checked=false;$('white-test').disabled=true;$('brightness').disabled=true;colors.fill(0);setTrack('Wizards in Winter','Loading extracted soundtrack + stored source frames…','MUSIC','Preparing the recorded show…');
 try{const response=await fetch('/outputs/wizards-ground-level.wltiming');if(!response.ok)throw new Error('Stored light sequence is unavailable.');const sequence=await verifyRgbIntegrity(decodeTiming(await response.arrayBuffer()));if(sequence.meta.channelMapSha256!==await mapHash)throw new Error('Channel map differs.');if(generation!==loadGeneration)return;sourceSequence=sequence;await hostedClock.bind(sequence);if(generation!==loadGeneration){hostedClock.pause();return;}setTrack('Wizards in Winter','Original extracted audio · 5,569 stored source frames','MUSIC','The original soundtrack plays against the same stored timestamps and RGB data. Shapes and camera colours are adapted.');if(autoplay)await hostedClock.play();}
 catch(error){if(generation===loadGeneration){hostedClock.ready=false;$('play').disabled=true;notice(error.message);}}
}
$('hosted-show').onclick=()=>prepareHostedShow(true);
prepareHostedShow(false);

// Read-only diagnostics for bench/browser verification, never controller output.
window.winterlight={get status(){return {mode,time:latestTime,duration:duration(),playing:playing(),pixelCount:pixels.length,sections:scene?.sectionCount,selected:selected?.id,brightness,white,analysisFrames:audio.analysis?.length||0,power:estimatePower(pixels,colors)};}};
