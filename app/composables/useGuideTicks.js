// Ticks for a step-by-step guide (StepGuide.vue): which tasks are done and
// which step is open. Ids are `${storageKey}/${stepId}/${taskId}`; ids not in
// `ids` are ignored, so a renamed task simply starts unticked.
//
// Ticks are shared through the site's Worker (/api/runbook, kind 'done', the
// same D1 table as the runbook), so a tick on the phone shows on the laptop.
// The Worker only takes ids listed in src/guides/index.js. Without it (not
// signed in through Cloudflare Access, npm run dev, previews) ticks fall back
// to this browser's storage. The open step is always kept per browser.
const API='/api/runbook',CHUNK=150;

export function useGuideTicks(storageKey,ids){
 const valid=new Set(ids),LOCAL=`winterlight-guide-${storageKey}`;
 const done=reactive({});
 const step=ref(null);
 // 'loading', 'shared' (every device) or 'local' (this browser only).
 const mode=ref('loading'),status=ref('');
 const read=()=>{try{return JSON.parse(localStorage.getItem(LOCAL)||'null');}catch{return null;}};
 const save=()=>{try{localStorage.setItem(LOCAL,JSON.stringify({done:mode.value==='shared'?[]:Object.keys(done).filter(k=>done[k]),step:step.value}));}catch{}};
 const apply=state=>{for(const k of Object.keys(done))delete done[k];for(const [k,v] of Object.entries(state||{}))if(v&&valid.has(k))done[k]=true;};
 async function send(change){
  const r=await fetch(API,{method:'PATCH',headers:{'content-type':'application/json'},body:JSON.stringify({done:change}),redirect:'manual'});
  if(!r.ok)throw new Error(`HTTP ${r.status}`);
  return (await r.json()).done;
 }
 // Large changes (a reset) go in chunks, under the Worker's limit per request.
 async function sendAll(change){
  const entries=Object.entries(change);let state;
  for(let i=0;i<entries.length;i+=CHUNK)state=await send(Object.fromEntries(entries.slice(i,i+CHUNK)));
  return state;
 }
 async function change(c){
  const before={...done};
  for(const [k,v] of Object.entries(c))v?done[k]=true:delete done[k];
  if(mode.value!=='shared'){save();return;}
  try{apply(await sendAll(c));status.value='';}
  catch{apply(before);status.value='Could not save that tick. Reload the page (you may need to sign in again) and try again.';}
 }

 onMounted(async()=>{
  const local=read();
  step.value=local?.step??null;
  try{
   const r=await fetch(API,{headers:{accept:'application/json'},redirect:'manual'});
   if(!r.ok)throw new Error(r.type==='opaqueredirect'?'sign-in redirect':`HTTP ${r.status}`);
   const state=(await r.json()).done||{};
   mode.value='shared';apply(state);
   // Ticks made in this browser before it could reach the Worker are carried over once.
   const carry=Object.fromEntries((local?.done||[]).filter(k=>valid.has(k)&&!(k in state)).map(k=>[k,true]));
   if(Object.keys(carry).length)await change(carry);
   save();
  }catch{
   mode.value='local';
   apply(Object.fromEntries((local?.done||[]).map(k=>[k,true])));
  }
 });
 const toggle=id=>{if(valid.has(id))change({[id]:!done[id]});};
 const reset=()=>change(Object.fromEntries([...valid].map(k=>[k,false])));
 const open=id=>{step.value=id;save();};
 return {done,toggle,reset,step,open,mode,status};
}
