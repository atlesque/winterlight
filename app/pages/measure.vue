<script setup>
import {createScene} from '~~/src/scene.js';
import {CHANNELS} from '~~/src/original/layout.js';
import {MEASUREMENTS,MEASURE_STEPS,applyMeasures,completeSteps,validMeasure,BASELINE,cm,metres} from '~~/src/measures/measures.js';

// The measure page: every tape measurement the runbook still needs, drawn on
// the 3D model as a dimension line, with a field to enter what the tape says.
// Values go to the same D1 database as the runbook's ticks (/api/runbook,
// worker/index.js), so the runbook's measuring steps tick themselves and the
// steps that depend on them show the updated numbers (src/measures/measures.js).
// The page and its API sit behind Cloudflare Access with the runbook. Without
// the Worker (npm run dev, previews) values stay in this browser, in the same
// place the runbook keeps its local ticks.
definePageMeta({alias:['/measure.html']});
const API='/api/runbook',LOCAL='winterlight-runbook-v2';
const STEPS=Object.entries(MEASURE_STEPS).map(([id,title])=>({id,title,items:MEASUREMENTS.filter(m=>m.step===id)}));
const number=Object.fromEntries(MEASUREMENTS.map((m,i)=>[m.id,i+1]));

const values=reactive({});
const drafts=reactive(Object.fromEntries(MEASUREMENTS.map(m=>[m.id,''])));
const errors=reactive({});
const mode=ref('loading'),status=ref(''),why=ref(''),active=ref(MEASUREMENTS[0].id),saving=ref(null);
const result=computed(()=>applyMeasures(values));
const complete=computed(()=>new Set(completeSteps(values)));
const notes=computed(()=>Object.values(result.value.steps).flatMap(s=>s.notes));
const fill=()=>{for(const m of MEASUREMENTS)drafts[m.id]=m.id in values?String(Math.round(values[m.id]*1000)/10):'';};
const store=v=>{try{const s=JSON.parse(localStorage.getItem(LOCAL)||'null')||{done:{},expense:{}};localStorage.setItem(LOCAL,JSON.stringify({...s,measures:v}));}catch{}};
const setAll=m=>{for(const k of Object.keys(values))delete values[k];for(const [k,v] of Object.entries(m||{}))if(validMeasure(k,v))values[k]=v;};

// Save one value (metres, or null to clear it). Changes locally first, undone if saving fails.
async function save(id,v){
 const before={...values};v===null?delete values[id]:values[id]=v;
 if(mode.value==='local'){store({...values});return;}
 saving.value=id;
 try{const r=await fetch(API,{method:'PATCH',headers:{'content-type':'application/json'},body:JSON.stringify({measures:{[id]:v}}),redirect:'manual'});
  if(!r.ok)throw new Error(r.status);setAll((await r.json()).measures);status.value='';
 }catch{setAll(before);fill();status.value='Could not save that value. Reload the page (you may need to sign in again) and try again.';}
 finally{saving.value=null;}
}
function commit(m){
 const text=String(drafts[m.id]??'').trim().replace(',','.');
 if(!text){errors[m.id]='';if(m.id in values)save(m.id,null);return;}
 const v=Math.round(Number(text)*10)/1000;
 if(!Number.isFinite(v)||!validMeasure(m.id,v)){errors[m.id]=`Enter centimetres between ${Math.round(m.min*100)} and ${Math.round(m.max*100)}.`;return;}
 errors[m.id]='';if(values[m.id]!==v)save(m.id,v);
}

// The 3D model, lit as at dusk with the props softly on and the dimension lines over it.
const viewport=ref(),list=ref(),sceneError=ref('');
let scene=null,frame=0;
const ALL_ON=new Uint8Array(CHANNELS.map(c=>c.palette==='multi'?3:1)),LEVELS=new Uint8Array(CHANNELS.length).fill(18);
const lines=()=>MEASUREMENTS.map(m=>({id:m.id,from:m.from,to:m.to,done:m.id in values,active:m.id===active.value}));
const mid=Object.fromEntries(MEASUREMENTS.map(m=>[m.id,m.from.map((v,i)=>(v+m.to[i])/2)]));
const tags={};
// Labels on the lines are plain buttons over the canvas, moved every frame.
function placeTags(){for(const m of MEASUREMENTS){const el=tags[m.id];if(!el)continue;const p=scene.project(mid[m.id]);el.style.transform=`translate(${p.x}px,${p.y}px) translate(-50%,-50%)`;el.style.visibility=p.visible?'visible':'hidden';}}
const fmt=v=>v>=3?metres(v):cm(v);
function select(id,{fly=true,scroll=false}={}){
 active.value=id;const m=MEASUREMENTS.find(x=>x.id===id);
 if(fly&&scene)scene.look(...m.view);
 if(scroll)nextTick(()=>list.value?.querySelector(`[data-measure="${id}"]`)?.scrollIntoView({behavior:'smooth',block:'nearest'}));
}
watch([()=>({...values}),active],()=>scene?.setMeasures(lines()),{deep:true});
const overview=()=>scene?.look([5.2,3.6,10.5],[4.6,1.9,1]);

onMounted(async()=>{
 try{scene=createScene(viewport.value);scene.setDusk(true);scene.setMeasures(lines());overview();
  const loop=()=>{frame=requestAnimationFrame(loop);scene.draw(ALL_ON,LEVELS,.5);placeTags();};loop();
 }catch(e){sceneError.value='The 3D model needs WebGL. Enable hardware acceleration or try a WebGL-capable browser; the list still works.';console.error(e);}
 try{const r=await fetch(API,{headers:{accept:'application/json'},redirect:'manual'});if(!r.ok)throw new Error(r.type==='opaqueredirect'?'sign-in redirect':`HTTP ${r.status}`);
  setAll((await r.json()).measures);mode.value='shared';
 }catch(e){why.value=e?.message||'no connection';mode.value='local';try{setAll(JSON.parse(localStorage.getItem(LOCAL)||'null')?.measures);}catch{}}
 fill();
 // Read-only diagnostics for browser checks.
 window.winterlightMeasure={get status(){return {mode:mode.value,values:{...values},active:active.value,measured:result.value.measured};}};
});
onBeforeUnmount(()=>{cancelAnimationFrame(frame);delete window.winterlightMeasure;});

const SITE='https://winterlight.alexander-df0.workers.dev';
const TITLE='Winterlight · Measure the house';
const DESCRIPTION='Every measurement the Winterlight build still needs, shown on the 3D model of our house, with a field to enter each one. The values feed the build runbook.';
useHead({title:TITLE,link:[{rel:'canonical',href:`${SITE}/measure.html`}],bodyAttrs:{class:'measure-page'}});
useSeoMeta({robots:'noindex',description:DESCRIPTION,ogType:'website',ogSiteName:'Winterlight',ogLocale:'en_GB',ogTitle:TITLE,ogDescription:DESCRIPTION,ogUrl:`${SITE}/measure.html`,
 ogImage:`${SITE}/og-image.jpg`,ogImageType:'image/jpeg',ogImageWidth:1200,ogImageHeight:630,ogImageAlt:'3D model of a house with a wireframe Christmas tree, a peace sign, Christmas circles and HAPPY HOLIDAYS letters lit up',
 twitterCard:'summary_large_image',twitterTitle:TITLE,twitterDescription:DESCRIPTION,twitterImage:`${SITE}/og-image.jpg`});
</script>

<template>
  <div class="costs-shell">
    <FestiveSky />
    <AppHeader />
    <main class="costs measure">
      <section class="intro">
        <h1>Measure the house</h1>
        <p>The {{ MEASUREMENTS.length }} measurements the plan doesn't give, on the model. Amber lines are still to measure and show the model's guess; green ones are done.
          Tap a line or a card to see where it goes, then type what the tape says. Values save straight to the <a href="/runbook.html">runbook</a>.</p>
      </section>

      <div class="measure-layout">
        <section class="model glass" aria-label="3D model with the measurements">
          <div class="model-wrap">
            <div ref="viewport" class="model-view" />
            <button v-for="m in MEASUREMENTS" :key="m.id" :ref="e=>{tags[m.id]=e;}" type="button" class="tag" :class="{done:m.id in values,active:active===m.id}"
              :aria-label="`${m.label}: ${m.id in values?cm(values[m.id]):'not measured yet'}`" @click="select(m.id,{scroll:true})">
              <b>{{ number[m.id] }}</b><span>{{ m.id in values?fmt(values[m.id]):`${fmt(m.guess)}?` }}</span>
            </button>
          </div>
          <p v-if="sceneError" class="note model-error">{{ sceneError }}</p>
          <div class="model-bar">
            <span class="legend"><i class="dot todo" /> To measure <i class="dot done" /> Measured</span>
            <UButton size="xs" color="neutral" variant="soft" icon="i-lucide-house" label="Whole house" @click="overview" />
          </div>
        </section>

        <div ref="list" class="measure-list">
          <div class="measure-summary glass" aria-live="polite">
            <div>
              <div class="field-title"><UIcon name="i-lucide-ruler" /> Measured</div>
              <div id="measured" class="total">{{ result.measured }}<small> / {{ result.of }}</small></div>
              <div class="bar progress-bar"><i :style="{width:`${result.measured/result.of*100}%`}" /></div>
            </div>
            <dl class="money">
              <div><dt>Pixels for the show</dt><dd>{{ result.pixels.toLocaleString('en') }}</dd></div>
              <div><dt>Pixel strings needed, with spare</dt><dd :class="{warn:result.strings>BASELINE.strings}">{{ result.strings }} of {{ BASELINE.strings }} ordered</dd></div>
            </dl>
          </div>

          <section v-for="g in STEPS" :key="g.id" class="measure-group">
            <h2>{{ g.title }} <UBadge v-if="complete.has(g.id)" label="done in the runbook" color="success" variant="subtle" size="sm" /></h2>
            <article v-for="m in g.items" :key="m.id" class="measure-card glass" :class="{active:active===m.id,done:m.id in values}" :data-measure="m.id" @click="select(m.id)">
              <header>
                <span class="num">{{ number[m.id] }}</span>
                <h3>{{ m.label }}</h3>
                <UIcon v-if="m.id in values" name="i-lucide-circle-check" class="tick" />
              </header>
              <p class="how">{{ m.how }}</p>
              <div class="entry" @click.stop>
                <label :for="`m-${m.id}`">Tape</label>
                <div class="field">
                  <input :id="`m-${m.id}`" v-model="drafts[m.id]" type="text" inputmode="decimal" autocomplete="off" :placeholder="String(Math.round(m.guess*100))"
                    :aria-invalid="Boolean(errors[m.id])" :disabled="mode==='loading'" @focus="select(m.id)" @blur="commit(m)" @keydown.enter.prevent="commit(m);$event.target.blur()">
                  <span>cm</span>
                </div>
                <small v-if="errors[m.id]" class="err" role="alert">{{ errors[m.id] }}</small>
                <small v-else-if="saving===m.id">Saving…</small>
                <small v-else-if="m.id in values">Model guessed {{ fmt(m.guess) }} · {{ values[m.id]>=m.guess?'+':'' }}{{ Math.round((values[m.id]-m.guess)*100) }} cm</small>
                <small v-else>Model's guess: {{ fmt(m.guess) }}</small>
              </div>
            </article>
          </section>

          <section v-if="notes.length" class="glass measure-effects">
            <h2>What changes in the runbook</h2>
            <p v-for="(n,i) in notes" :key="i" class="step-note" :class="{warn:n.warn}"><UIcon :name="n.warn?'i-lucide-triangle-alert':'i-lucide-ruler'" /> {{ n.text }}</p>
          </section>

          <div id="sync" class="sync" :data-mode="mode">
            <p class="note">
              <template v-if="mode==='shared'">Values are saved to the shared runbook.</template>
              <template v-else-if="mode==='local'">The shared runbook is out of reach, so values are saved in this browser only ({{ why }}).</template>
              <template v-else>Loading the shared runbook…</template>
            </p>
            <p v-if="status" class="note sync-error" role="alert">{{ status }}</p>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
.intro a{color:var(--gold-soft);text-decoration:underline;text-underline-offset:3px}
.measure-layout{display:grid;grid-template-columns:minmax(0,1.35fr) minmax(0,1fr);gap:18px;margin-top:26px;align-items:start}
.model{position:sticky;top:96px;overflow:hidden;padding:0}
.model-wrap{position:relative;overflow:hidden}
.model-view{height:min(72vh,680px);touch-action:none;cursor:grab}
.tag{position:absolute;left:0;top:0;display:inline-flex;align-items:center;gap:5px;padding:2px 8px 2px 3px;border-radius:999px;border:0;cursor:pointer;white-space:nowrap;
 font-size:11.5px;font-weight:600;font-variant-numeric:tabular-nums;color:#1a1206;background:#ffb347e6;box-shadow:0 2px 10px #0008;visibility:hidden}
.tag b{display:grid;place-items:center;width:17px;height:17px;border-radius:50%;font-size:10px;background:#0b111c;color:#ffb347}
.tag.done{background:#5fe39ae6;color:#06200f}.tag.done b{color:#5fe39a}
.tag.active{z-index:2;outline:2px solid #fff4d6;outline-offset:1px;font-size:12.5px}
@media (max-width:980px){.tag:not(.active){padding:2px}.tag:not(.active) span{display:none}}
.model-view:active{cursor:grabbing}
.model-error{padding:12px 16px}
.model-bar{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:10px 14px;border-top:1px solid #ffffff0d}
.legend{display:inline-flex;align-items:center;gap:7px;font-size:12px;color:#a3b3c3}
.dot{display:inline-block;width:10px;height:10px;border-radius:50%;margin-left:6px}
.dot.todo{background:#ffb347}.dot.done{background:#5fe39a}
.measure-list{display:flex;flex-direction:column;gap:14px}
.measure-summary{display:grid;grid-template-columns:1fr 1.3fr;gap:16px;padding:16px 18px;align-items:center}
.measure-summary .money{margin:0}
.measure-summary .warn{color:#ffc27a}
.measure-group{display:flex;flex-direction:column;gap:10px}
.measure-group h2{display:flex;align-items:center;gap:10px;font-size:22px;margin:8px 0 0}
.measure-card{padding:14px 16px;cursor:pointer;transition:border-color .2s,box-shadow .2s}
.measure-card:hover{border-color:#efc19740}
.measure-card.active{border-color:#ffb347aa;box-shadow:0 0 0 1px #ffb34755,0 10px 40px -18px #000c}
.measure-card.done.active{border-color:#5fe39aaa;box-shadow:0 0 0 1px #5fe39a55}
.measure-card header{display:flex;align-items:center;gap:10px}
.measure-card h3{margin:0;font-size:15px;flex:1}
.num{display:grid;place-items:center;flex-shrink:0;width:24px;height:24px;border-radius:50%;font-size:12px;font-weight:700;color:#0b111c;background:#ffb347}
.done .num{background:#5fe39a}
.tick{color:#5fe39a;width:18px;height:18px}
.how{margin:8px 0 10px;font-size:12.5px;line-height:1.55;color:#a3b3c3}
.entry{display:grid;grid-template-columns:auto minmax(0,9em) 1fr;align-items:center;gap:6px 10px;cursor:default}
.entry label{font-size:11px;letter-spacing:.4px;text-transform:uppercase;color:var(--gold-soft)}
.field{display:flex;align-items:center;gap:6px;padding:0 10px;height:38px;border-radius:10px;background:#0b1424;border:1px solid #ffffff1f}
.field:focus-within{border-color:#efc197aa}
.field input{width:100%;min-width:0;background:none;border:0;outline:0;font-size:16px;color:#fbf4e8;font-variant-numeric:tabular-nums}
.field input::placeholder{color:#5d6f82}
.field span{font-size:12px;color:#8397a9}
.entry small{font-size:11.5px;color:#8397a9}
.entry small.err{color:#ff9b8f}
.measure-effects{padding:16px 18px}
.measure-effects h2{font-size:20px}
@media (max-width:980px){
 .measure-layout{grid-template-columns:minmax(0,1fr)}
 .model{position:sticky;top:60px;z-index:2}
 .model-view{height:42vh}
 .model-bar{padding:6px 12px}
}
@media (max-width:520px){.measure-summary{grid-template-columns:1fr}.entry{grid-template-columns:auto minmax(0,1fr)}.entry small{grid-column:1/-1}}
</style>
