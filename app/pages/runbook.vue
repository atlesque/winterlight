<script setup>
import {CHAPTERS,PURCHASES,SHOPS,STEP_IDS,SHOW_DATE,CHECKED} from '~~/src/runbook/runbook.js';

// The build runbook: chapters of to-dos from ordering to the first test run.
// Ticks and private/business switches are kept in this browser only.
definePageMeta({alias:['/runbook.html']});
const KEY='winterlight-runbook';
const euro=v=>new Intl.NumberFormat('en-IE',{style:'currency',currency:'EUR',minimumFractionDigits:v>=1000?0:2,maximumFractionDigits:v>=1000?0:2}).format(v);
const day=d=>new Date(`${d}T12:00:00Z`).toLocaleDateString('en-GB',{weekday:'short',day:'numeric',month:'short',timeZone:'UTC'});
const KIND={private:{label:'Private',other:'business'},business:{label:'Business',other:'private'}};
const byId=Object.fromEntries(PURCHASES.map(p=>[p.id,p]));

const done=reactive(new Set()),expense=reactive({});
const kind=p=>expense[p.id]||p.expense;
onMounted(()=>{
 try{const s=JSON.parse(localStorage.getItem(KEY)||'{}');for(const id of s.done||[])if(STEP_IDS.includes(id))done.add(id);
  for(const [id,k] of Object.entries(s.expense||{}))if(byId[id]&&KIND[k])expense[id]=k;}catch{}
 watch([()=>[...done],()=>({...expense})],([d,e])=>{try{localStorage.setItem(KEY,JSON.stringify({done:d,expense:e}));}catch{}});
});
const toggle=(id,on)=>on?done.add(id):done.delete(id);
const flip=p=>{const k=KIND[kind(p)].other;k===p.expense?delete expense[p.id]:expense[p.id]=k;};
function reset(){if(confirm('Clear every tick in the runbook?'))done.clear();}

const chapters=computed(()=>CHAPTERS.map((c,i)=>({...c,n:i+1,count:c.steps.filter(s=>done.has(s.id)).length,
 cost:c.steps.reduce((t,s)=>t+(s.buy?byId[s.buy].cost:0),0)})));
const progress=computed(()=>({done:STEP_IDS.filter(id=>done.has(id)).length,of:STEP_IDS.length}));
const next=computed(()=>{for(const c of chapters.value)for(const s of c.steps)if(!done.has(s.id))return {c,s};return null;});
const stepText=s=>s.buy?`Order: ${byId[s.buy].name}`:s.text;
const money=computed(()=>{const t={private:0,business:0,ordered:0,all:0};
 for(const p of PURCHASES){t[kind(p)]+=p.cost;t.all+=p.cost;if(done.has(`buy-${p.id}`))t.ordered+=p.cost;}return t;});
const qty=p=>p.unit==='×'?`${p.qty} ×`:`${p.qty} ${p.unit}`;
const checked=new Date(CHECKED).toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'});

const SITE='https://winterlight.alexander-df0.workers.dev';
const TITLE='Winterlight · Build runbook';
const DESCRIPTION='Step-by-step runbook for building the Winterlight show on our house: what to order and when, building the props, hanging them, setting up the software and the first test run.';
useHead({title:TITLE,link:[{rel:'canonical',href:`${SITE}/runbook.html`}],bodyAttrs:{class:'runbook-page'}});
useSeoMeta({description:DESCRIPTION,ogType:'website',ogSiteName:'Winterlight',ogLocale:'en_GB',ogTitle:TITLE,ogDescription:DESCRIPTION,ogUrl:`${SITE}/runbook.html`,
 ogImage:`${SITE}/og-image.jpg`,ogImageType:'image/jpeg',ogImageWidth:1200,ogImageHeight:630,ogImageAlt:'3D model of a house with a wireframe Christmas tree, a peace sign, Christmas circles and HAPPY HOLIDAYS letters lit up',
 twitterCard:'summary_large_image',twitterTitle:TITLE,twitterDescription:DESCRIPTION,twitterImage:`${SITE}/og-image.jpg`});
</script>

<template>
  <div class="costs-shell">
    <FestiveSky />
    <AppHeader>
      <UButton class="back-link" to="/" external color="primary" variant="ghost" icon="i-lucide-arrow-left" label="Back to the light show" />
    </AppHeader>
    <main class="costs runbook">
      <section class="intro">
        <h1>Build runbook</h1>
        <p>From ordering the parts to the first test run, for the full show. Show night {{ day(SHOW_DATE) }}. Ticks are saved in this browser.
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
                <UCheckbox :model-value="done.has(s.id)" :aria-label="stepText(s)" @update:model-value="v=>toggle(s.id,v===true)" />
                <template v-if="s.buy">
                  <div class="step-body">
                    <span class="step-text">{{ byId[s.buy].name }} <InfoTip v-if="byId[s.buy].tip" :text="byId[s.buy].tip" :label="`About ${byId[s.buy].name}`" /></span>
                    <span class="step-meta">{{ qty(byId[s.buy]) }} · <a :href="byId[s.buy].url" target="_blank" rel="noopener">{{ SHOPS[byId[s.buy].shop].name }}<UIcon name="i-lucide-external-link" /></a>
                      <template v-if="byId[s.buy].estimate"> · <UBadge label="estimate" color="primary" variant="subtle" size="sm" /></template></span>
                  </div>
                  <button type="button" class="expense" :data-kind="kind(byId[s.buy])" :aria-label="`${KIND[kind(byId[s.buy])].label} expense, switch to ${KIND[kind(byId[s.buy])].other}`" @click="flip(byId[s.buy])">{{ KIND[kind(byId[s.buy])].label }}</button>
                  <span class="price">{{ euro(byId[s.buy].cost) }}</span>
                </template>
                <template v-else>
                  <div class="step-body">
                    <span class="step-text">{{ s.text }} <InfoTip v-if="s.tip" :text="s.tip" label="More about this step" /></span>
                    <span v-if="s.due||s.link" class="step-meta"><template v-if="s.due">Expected {{ day(s.due) }}</template><template v-if="s.due&&s.link"> · </template><a v-if="s.link" :href="s.link.href" target="_blank" rel="noopener">{{ s.link.label }}<UIcon name="i-lucide-external-link" /></a></span>
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
          <div class="field-title">Spend <InfoTip text="Euro incl. VAT, without the cost page's contingency. Click a Private or Business tag to move an item. Business VAT may be reclaimable." label="About the spend" /></div>
          <dl id="money" class="money">
            <div><dt><i class="swatch private" /> Private</dt><dd>{{ euro(money.private) }}</dd></div>
            <div><dt><i class="swatch business" /> Business</dt><dd>{{ euro(money.business) }}</dd></div>
            <div class="grand"><dt>Total</dt><dd>{{ euro(money.all) }}</dd></div>
            <div><dt>Ordered so far</dt><dd>{{ euro(money.ordered) }}</dd></div>
          </dl>
          <nav class="chapter-nav" aria-label="Chapters">
            <a v-for="c in chapters" :key="c.id" :href="`#${c.id}`" :class="{complete:c.count===c.steps.length}"><span>{{ c.n }}. {{ c.title }}</span><b>{{ c.count }}/{{ c.steps.length }}</b></a>
          </nav>
          <UButton id="reset-runbook" block color="neutral" variant="soft" icon="i-lucide-undo-2" label="Clear all ticks" class="mt-5" :disabled="!progress.done" @click="reset" />
          <p class="note"><a href="/costs.html">LED cost estimate</a></p>
        </aside>
      </div>
    </main>
  </div>
</template>
