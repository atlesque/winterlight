<script setup>
import {CHAPTERS,PURCHASES,SHOPS,STEP_IDS,SHOW_DATE,CHECKED,PRESET} from '~~/src/runbook/runbook.js';

// The build runbook: chapters of to-dos from ordering to the first test run.
// Ticks and private/business switches are shared through the site's Worker
// (worker/index.js, a D1 database), so every device sees the same runbook.
// The page and its API sit behind Cloudflare Access, so only Alex gets here.
// Steps in PRESET (orders already placed, decisions made) start ticked, and
// the database only holds changes to those defaults. Without the Worker (npm
// run dev, previews) the page falls back to this browser's storage.
definePageMeta({alias:['/runbook.html']});
const API='/api/runbook',LOCAL='winterlight-runbook-v2',OLD='winterlight-runbook';
const euro=v=>new Intl.NumberFormat('en-IE',{style:'currency',currency:'EUR',minimumFractionDigits:v>=1000?0:2,maximumFractionDigits:v>=1000?0:2}).format(v);
const day=d=>new Date(`${d}T12:00:00Z`).toLocaleDateString('en-GB',{weekday:'short',day:'numeric',month:'short',timeZone:'UTC'});
const KIND={private:{label:'Private',other:'business'},business:{label:'Business',other:'private'}};
const byId=Object.fromEntries(PURCHASES.map(p=>[p.id,p]));
const DEFAULT=new Set(PRESET);

// Overrides of the defaults: done[id]=true|false, expense[id]='private'|'business'.
const over=reactive({done:{},expense:{}});
const done=computed(()=>new Set(STEP_IDS.filter(id=>over.done[id]??DEFAULT.has(id))));
const kind=p=>over.expense[p.id]||p.expense;
// 'loading', 'shared' (the database), or 'local' (this browser only).
const mode=ref('loading'),status=ref('');
const canEdit=computed(()=>mode.value!=='loading');
const store=(k,v)=>{try{v==null?localStorage.removeItem(k):localStorage.setItem(k,typeof v==='string'?v:JSON.stringify(v));}catch{}};
const load=k=>{try{return localStorage.getItem(k);}catch{return null;}};
const apply=s=>{over.done={...s.done};over.expense={...s.expense};};

async function send(change){
 if(mode.value==='local'){store(LOCAL,over);return true;}
 try{const r=await fetch(API,{method:'PATCH',headers:{'content-type':'application/json'},body:JSON.stringify(change),redirect:'manual'});
  if(!r.ok)throw new Error(r.status);apply(await r.json());status.value='';return true;
 }catch{status.value='Could not save that change. Reload the page (you may need to sign in again) and try again.';return false;}
}
// Change locally first, so the tick feels instant, and undo it if saving fails.
async function change(c){
 const before={done:{...over.done},expense:{...over.expense}};
 Object.assign(over.done,c.done||{});for(const [id,k] of Object.entries(c.expense||{}))k===null?delete over.expense[id]:over.expense[id]=k;
 if(!await send(c))apply(before);
}
const toggle=(id,on)=>change({done:{[id]:on}});
const flip=p=>{const k=KIND[kind(p)].other;change({expense:{[p.id]:k===p.expense?null:k}});};
function reset(){if(confirm('Put every tick back to the start: only the placed orders and made decisions ticked?'))
 change({done:Object.fromEntries(STEP_IDS.map(id=>[id,DEFAULT.has(id)])),expense:Object.fromEntries(Object.keys(over.expense).map(id=>[id,null]))});}

// Ticks made before the runbook was shared lived in this browser; carry them over once.
async function migrate(){
 let old;try{old=JSON.parse(load(OLD)||'null');}catch{}
 if(!old)return;
 const d=Object.fromEntries((old.done||[]).filter(id=>STEP_IDS.includes(id)&&!done.value.has(id)).map(id=>[id,true]));
 const e=Object.fromEntries(Object.entries(old.expense||{}).filter(([id,k])=>byId[id]&&KIND[k]&&!over.expense[id]));
 if(Object.keys(d).length||Object.keys(e).length){await change({done:d,expense:e});if(status.value)return;}
 store(OLD,null);
}

onMounted(async()=>{
 try{const r=await fetch(API,{headers:{accept:'application/json'},redirect:'manual'});if(!r.ok)throw new Error(r.status);
  apply(await r.json());mode.value='shared';await migrate();
 }catch{
  mode.value='local';
  try{const s=JSON.parse(load(LOCAL)||'null');if(s)apply({done:Object.fromEntries(Object.entries(s.done||{}).filter(([id])=>STEP_IDS.includes(id))),
   expense:Object.fromEntries(Object.entries(s.expense||{}).filter(([id,k])=>byId[id]&&KIND[k]))});}catch{}
 }
});

const chapters=computed(()=>CHAPTERS.map((c,i)=>({...c,n:i+1,count:c.steps.filter(s=>done.value.has(s.id)).length,
 cost:c.steps.reduce((t,s)=>t+(s.buy?byId[s.buy].cost:0),0)})));
const progress=computed(()=>({done:STEP_IDS.filter(id=>done.value.has(id)).length,of:STEP_IDS.length}));
const next=computed(()=>{for(const c of chapters.value)for(const s of c.steps)if(!done.value.has(s.id))return {c,s};return null;});
const stepText=s=>s.buy?`Order: ${byId[s.buy].name}`:s.text;
// Optional items (gear that may already be at hand) stay out of the totals until ticked as ordered.
const money=computed(()=>{const t={private:0,business:0,ordered:0,all:0,optional:0};
 for(const p of PURCHASES){const bought=done.value.has(`buy-${p.id}`);if(bought)t.ordered+=p.cost;
  if(p.optional&&!bought){t.optional+=p.cost;continue;}t[kind(p)]+=p.cost;t.all+=p.cost;}return t;});
const links=s=>s.links||(s.link?[s.link]:[]);
const qty=p=>p.unit==='×'?`${p.qty} ×`:`${p.qty} ${p.unit}`;
const checked=new Date(CHECKED).toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'});

const SITE='https://winterlight.alexander-df0.workers.dev';
const TITLE='Winterlight · Build runbook';
const DESCRIPTION='Step-by-step runbook for building the Winterlight show on our house: what to order and when, building the props, hanging them, setting up the software and the first test run.';
useHead({title:TITLE,link:[{rel:'canonical',href:`${SITE}/runbook.html`}],bodyAttrs:{class:'runbook-page'}});
useSeoMeta({robots:'noindex',description:DESCRIPTION,ogType:'website',ogSiteName:'Winterlight',ogLocale:'en_GB',ogTitle:TITLE,ogDescription:DESCRIPTION,ogUrl:`${SITE}/runbook.html`,
 ogImage:`${SITE}/og-image.jpg`,ogImageType:'image/jpeg',ogImageWidth:1200,ogImageHeight:630,ogImageAlt:'3D model of a house with a wireframe Christmas tree, a peace sign, Christmas circles and HAPPY HOLIDAYS letters lit up',
 twitterCard:'summary_large_image',twitterTitle:TITLE,twitterDescription:DESCRIPTION,twitterImage:`${SITE}/og-image.jpg`});
</script>

<template>
  <div class="costs-shell">
    <FestiveSky />
    <AppHeader />
    <main class="costs runbook">
      <section class="intro">
        <h1>Build runbook</h1>
        <p>From ordering the parts to the first test run, for the full show. Show night {{ day(SHOW_DATE) }}. Ticks are shared across devices.
          <InfoTip :text="`Quantities and prices come from the LED cost estimate (prices checked ${checked}), in the units the shops sell. Delivery dates are estimates.`" label="About the quantities" /></p>
      </section>

      <div class="layout">
        <div class="chapters">
          <article v-for="c in chapters" :id="c.id" :key="c.id" class="chapter glass" :class="{complete:c.count===c.steps.length}">
            <header class="chapter-head">
              <span class="chapter-icon"><UIcon :name="c.count===c.steps.length?'i-lucide-circle-check':c.icon" /></span>
              <div>
                <h2>{{ c.n }}. {{ c.title }} <InfoTip v-if="c.tip" :text="c.tip" :label="`About ${c.title.toLowerCase()}`" /></h2>
                <small>By {{ day(c.due) }} · {{ c.count }} of {{ c.steps.length }} done<template v-if="c.cost"> · {{ euro(c.cost) }}</template></small>
              </div>
            </header>
            <ul class="steps">
              <li v-for="s in c.steps" :key="s.id" :class="{done:done.has(s.id),buy:s.buy}" :data-step="s.id">
                <UCheckbox :model-value="done.has(s.id)" :disabled="!canEdit" :aria-label="stepText(s)" @update:model-value="v=>toggle(s.id,v===true)" />
                <template v-if="s.buy">
                  <div class="step-body">
                    <span class="step-text">{{ byId[s.buy].name }} <InfoTip v-if="byId[s.buy].tip" :text="byId[s.buy].tip" :label="`About ${byId[s.buy].name}`" /></span>
                    <span class="step-meta">{{ qty(byId[s.buy]) }} · <a :href="byId[s.buy].url" target="_blank" rel="noopener">{{ SHOPS[byId[s.buy].shop].name }}<UIcon name="i-lucide-external-link" /></a>
                      <template v-if="byId[s.buy].estimate"> · <UBadge label="estimate" color="primary" variant="subtle" size="sm" /></template>
                      <template v-if="byId[s.buy].optional"> · <UBadge label="optional" color="neutral" variant="subtle" size="sm" /></template></span>
                  </div>
                  <button type="button" class="expense" :disabled="!canEdit" :data-kind="kind(byId[s.buy])" :aria-label="`${KIND[kind(byId[s.buy])].label} expense, switch to ${KIND[kind(byId[s.buy])].other}`" @click="flip(byId[s.buy])">{{ KIND[kind(byId[s.buy])].label }}</button>
                  <span class="price">{{ euro(byId[s.buy].cost) }}</span>
                </template>
                <template v-else>
                  <div class="step-body">
                    <span class="step-text">{{ s.text }} <InfoTip v-if="s.tip" :text="s.tip" label="More about this step" /></span>
                    <span v-if="s.due||links(s).length" class="step-meta"><template v-if="s.due">Expected {{ day(s.due) }}</template><template v-for="(l,i) in links(s)" :key="l.href"><template v-if="s.due||i"> · </template><a :href="l.href" target="_blank" rel="noopener">{{ l.label }}<UIcon name="i-lucide-external-link" /></a></template></span>
                    <dl v-if="s.measures" class="measures">
                      <div v-for="x in s.measures" :key="x.what" :data-from="x.from">
                        <dt><span class="from">{{ x.from==='plan'?'Plan':'Tape' }}</span> {{ x.what }}</dt>
                        <dd><strong>{{ x.value }}</strong> <span>{{ x.how }}</span></dd>
                      </div>
                    </dl>
                  </div>
                </template>
              </li>
            </ul>
          </article>
        </div>

        <aside class="summary glass" aria-live="polite">
          <div class="total-card">
            <div class="field-title"><UIcon name="i-lucide-list-checks" /> Progress</div>
            <div id="progress" class="total">{{ progress.done }}<small> / {{ progress.of }}</small></div>
            <div class="bar progress-bar"><i :style="{width:`${progress.done/progress.of*100}%`}" /></div>
            <div id="next" class="delta">{{ next?`Next: ${stepText(next.s)}`:'Everything done. Enjoy the show.' }}</div>
          </div>
          <div class="field-title">Spend <InfoTip text="Euro incl. VAT, without the cost page's contingency or the optional items. Click a Private or Business tag to move an item. Business VAT may be reclaimable." label="About the spend" /></div>
          <dl id="money" class="money">
            <div><dt><i class="swatch private" /> Private</dt><dd>{{ euro(money.private) }}</dd></div>
            <div><dt><i class="swatch business" /> Business</dt><dd>{{ euro(money.business) }}</dd></div>
            <div class="grand"><dt>Total</dt><dd>{{ euro(money.all) }}</dd></div>
            <div v-if="money.optional"><dt>Optional, if not at hand <InfoTip text="Gear that may already be at hand. Not in the total until ticked as ordered." label="About optional items" /></dt><dd>{{ euro(money.optional) }}</dd></div>
            <div><dt>Ordered so far</dt><dd>{{ euro(money.ordered) }}</dd></div>
          </dl>
          <nav class="chapter-nav" aria-label="Chapters">
            <a v-for="c in chapters" :key="c.id" :href="`#${c.id}`" :class="{complete:c.count===c.steps.length}"><span>{{ c.n }}. {{ c.title }}</span><b>{{ c.count }}/{{ c.steps.length }}</b></a>
          </nav>
          <div id="sync" class="sync" :data-mode="mode">
            <p class="note">
              <template v-if="mode==='shared'">Ticks are saved to the shared runbook.</template>
              <template v-else-if="mode==='local'">The shared runbook is out of reach, so ticks are saved in this browser only.</template>
              <template v-else>Loading the shared runbook…</template>
            </p>
            <p v-if="status" class="note sync-error" role="alert">{{ status }}</p>
          </div>
          <UButton id="reset-runbook" block color="neutral" variant="soft" icon="i-lucide-undo-2" label="Reset ticks" class="mt-3" :disabled="!canEdit" @click="reset" />
          <p class="note"><a href="/costs.html">LED cost estimate</a></p>
        </aside>
      </div>
    </main>
  </div>
</template>
