// Ticks for a step-by-step guide (StepGuide.vue): which tasks are done and
// which step is open. Ids are `${storageKey}/${stepId}/${taskId}`; ids not in
// `ids` are ignored, so a renamed task simply starts unticked.
// For now kept in this browser's storage only (wrapped in try/catch, since
// private windows can refuse it); the signature stays the same if this moves
// to the site's Worker for ticks shared across devices.
export function useGuideTicks(storageKey,ids){
 const valid=new Set(ids);
 const done=reactive({});
 const step=ref(null);
 const save=()=>{try{localStorage.setItem(`winterlight-guide-${storageKey}`,JSON.stringify({done:Object.keys(done).filter(k=>done[k]),step:step.value}));}catch{}};
 onMounted(()=>{
  try{const s=JSON.parse(localStorage.getItem(`winterlight-guide-${storageKey}`)||'null');
   if(s){for(const k of s.done||[])if(valid.has(k))done[k]=true;step.value=s.step??null;}
  }catch{}
 });
 const toggle=id=>{if(!valid.has(id))return;done[id]=!done[id];if(!done[id])delete done[id];save();};
 const reset=()=>{for(const k of Object.keys(done))delete done[k];save();};
 const open=id=>{step.value=id;save();};
 return {done,toggle,reset,step,open};
}
