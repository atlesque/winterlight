<script setup>
import {GROUP_LIST,ZONES,DEFAULTS,ALL,estimate} from '~~/src/costs/estimate.js';
import {PRICES,CHECKED,WATTS_PER_PIXEL,WATTS_SOURCE,PSU_LOAD,PORT_PIXELS,INJECT_EVERY} from '~~/src/costs/catalog.js';

// The interactive LED cost page: tick props or groups off and every total,
// the infrastructure they need and the breakdown follow.
definePageMeta({alias:['/costs.html']});
const euro=v=>new Intl.NumberFormat('en-IE',{style:'currency',currency:'EUR',maximumFractionDigits:v>=1000?0:2,minimumFractionDigits:v>=1000?0:2}).format(v);
const qty=l=>l.item==='pixels'||l.item==='spares'?`${l.qty} px`:['mountStrip','cable','injectWire'].includes(l.item)?`${l.qty} m`:l.item==='coro'?`${l.qty} m²`:l.item==='zipTies'?`${Math.round(l.qty*100)} ties`:`${l.qty} ×`;
const estimated=l=>PRICES[l.item]?.estimate;

const selected=reactive(new Set(ALL)),options=reactive({...DEFAULTS}),open=reactive(new Set());
const FULL=estimate(ALL,DEFAULTS).total;
const e=computed(()=>estimate(new Set(selected),{...options}));
const checked=new Date(CHECKED).toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'});

const groups=computed(()=>GROUP_LIST.map(g=>{const r=e.value.groups.find(x=>x.id===g.id);
 return {g,r,priced:new Map(r.props.map(p=>[p.id,p])),state:r.count===r.of?true:r.count?'indeterminate':false};}));
function toggleGroup(g,on){for(const p of g.props)on?selected.add(p.id):selected.delete(p.id);}
function toggleProp(id,on){on?selected.add(id):selected.delete(id);}
const toggleOpen=id=>open.has(id)?open.delete(id):open.add(id);
function reset(){for(const id of ALL)selected.add(id);Object.assign(options,DEFAULTS);}

const delta=computed(()=>{const d=Math.round((e.value.total-FULL)*100)/100;return d===0?'The full show, every prop included.':`${d<0?'−':'+'}${euro(Math.abs(d))} compared with the full show (${euro(FULL)}).`;});
const kpis=computed(()=>{const z=Object.values(e.value.zones);return [[e.value.pixels.toLocaleString('en'),'pixels','i-lucide-sparkle'],[z.reduce((s,x)=>s+x.controllers,0),'controllers','i-lucide-cpu'],[z.reduce((s,x)=>s+x.psus,0),'power supplies','i-lucide-plug-zap'],[`${e.value.watts} W`,'at full white','i-lucide-sun']];});
const maxCategory=computed(()=>Math.max(...e.value.categories.map(c=>c.cost),1));

// Why these LEDs: the reasoning behind the picks, from the same numbers.
const full=estimate(ALL,DEFAULTS),pixelGroups=full.groups.filter(g=>g.pixels),maxPixels=Math.max(...pixelGroups.map(x=>x.pixels));
const longestRun=Math.max(...full.groups.flatMap(g=>g.props.map(p=>p.run)));
const kwh=Math.round(full.watts/3*5*31/1000);

const SITE='https://winterlight.alexander-df0.workers.dev';
const TITLE='Winterlight · LED cost estimate';
const DESCRIPTION='Which LEDs to use for every prop of the Winterlight show on our house, and what it costs in euro per prop, per group and in total, with wiring, controllers and power. Switch props on or off to see the total change.';
const SHORT='Which LEDs to use for every prop of the Winterlight show on our house, and what it costs in euro per prop, per group and in total, with wiring, controllers and power.';
useHead({title:TITLE,link:[{rel:'canonical',href:`${SITE}/costs.html`}],bodyAttrs:{class:'costs-page'}});
useSeoMeta({description:DESCRIPTION,ogType:'website',ogSiteName:'Winterlight',ogLocale:'en_GB',ogTitle:TITLE,ogDescription:SHORT,ogUrl:`${SITE}/costs.html`,
 ogImage:`${SITE}/og-image.jpg`,ogImageType:'image/jpeg',ogImageWidth:1200,ogImageHeight:630,ogImageAlt:'3D model of a house with a wireframe Christmas tree, a peace sign, Christmas circles and HAPPY HOLIDAYS letters lit up',
 twitterCard:'summary_large_image',twitterTitle:TITLE,twitterDescription:SHORT,twitterImage:`${SITE}/og-image.jpg`});
</script>

<template>
  <div class="costs-shell">
    <FestiveSky />
    <AppHeader>
      <UButton class="back-link" to="/" external color="primary" variant="ghost" icon="i-lucide-arrow-left" label="Back to the light show" />
    </AppHeader>
    <main class="costs">
      <section class="intro">
        <h1>LED cost estimate</h1>
        <p>Every prop on our house, priced as 12 V WS2811 pixels with wiring, controllers and power. Untick props or groups to see what they cost. Euro incl. VAT, prices checked <span id="checked">{{ checked }}</span>; <UBadge label="estimate" color="primary" variant="subtle" size="sm" /> marks a rounded guess.</p>
      </section>

      <div class="layout">
        <div id="groups" class="groups">
          <article v-for="{g,r,priced,state} in groups" :key="g.id" class="prop-group glass" :class="{off:!r.count}" :data-group="g.id">
            <div class="group-head">
              <UCheckbox :model-value="state" :data-toggle-group="g.id" @update:model-value="v=>toggleGroup(g,v===true)">
                <template #label><strong>{{ g.name }}</strong></template>
                <template #description>{{ r.count }} of {{ r.of }} {{ r.of===1?'prop':'props' }} · {{ r.pixels.toLocaleString('en') }} pixels · {{ ZONES[g.zone].name.toLowerCase() }}</template>
              </UCheckbox>
              <div class="group-total">{{ euro(r.total) }}</div>
            </div>
            <p class="led"><b>{{ g.led }}.</b> {{ g.why }}</p>
            <UButton class="expand" variant="link" color="primary" size="xs" :trailing-icon="open.has(g.id)?'i-lucide-chevron-up':'i-lucide-chevron-down'" :aria-expanded="open.has(g.id)" :data-expand="g.id"
              :label="`${open.has(g.id)?'Hide':'Show'} ${r.of===1?'parts':`the ${r.of} props and parts`}`" @click="toggleOpen(g.id)" />
            <div v-if="open.has(g.id)" class="props">
              <table>
                <thead><tr><th>Prop</th><th class="num">Pixels</th><th class="num">Cost</th></tr></thead>
                <tbody>
                  <template v-for="p in g.props" :key="p.id">
                    <tr class="prop" :class="{off:!priced.get(p.id)}">
                      <td>
                        <UCheckbox :model-value="!!priced.get(p.id)" :data-toggle-prop="p.id" size="sm" @update:model-value="v=>toggleProp(p.id,v===true)">
                          <template #label>{{ p.name }}</template>
                          <template v-if="priced.get(p.id)" #description>{{ priced.get(p.id).run }} m of cable from the {{ priced.get(p.id)===r.props[0]?'box':'previous prop' }}</template>
                        </UCheckbox>
                      </td>
                      <td class="num">{{ p.pixels }}</td><td class="num">{{ priced.get(p.id)?euro(priced.get(p.id).total):'–' }}</td>
                    </tr>
                    <template v-if="priced.get(p.id)&&r.of===1">
                      <tr v-for="(l,i) in priced.get(p.id).lines" :key="i" class="line"><td>{{ l.name }} <UBadge v-if="estimated(l)" label="estimate" color="primary" variant="subtle" size="sm" /></td><td class="num">{{ qty(l) }}</td><td class="num">{{ euro(l.cost) }}</td></tr>
                    </template>
                  </template>
                  <template v-if="r.extras.length">
                    <tr class="sub"><td colspan="3">Group parts</td></tr>
                    <tr v-for="(l,i) in r.extras" :key="'x'+i" class="line"><td>{{ l.name }} <UBadge v-if="estimated(l)" label="estimate" color="primary" variant="subtle" size="sm" /></td><td class="num">{{ qty(l) }}</td><td class="num">{{ euro(l.cost) }}</td></tr>
                  </template>
                </tbody>
              </table>
              <details v-if="r.of>1&&r.props.length">
                <summary>Parts per prop</summary>
                <table v-for="p in r.props" :key="p.id" class="parts"><caption>{{ p.name }}</caption><tbody>
                  <tr v-for="(l,i) in p.lines" :key="i" class="line"><td>{{ l.name }} <UBadge v-if="estimated(l)" label="estimate" color="primary" variant="subtle" size="sm" /></td><td class="num">{{ qty(l) }}</td><td class="num">{{ euro(l.cost) }}</td></tr>
                </tbody></table>
              </details>
            </div>
          </article>
        </div>

        <aside class="summary glass" aria-live="polite">
          <div class="total-card">
            <div class="field-title"><UIcon name="i-lucide-gift" /> Estimated total</div>
            <div id="total" class="total">{{ euro(e.total) }}</div>
            <div id="delta" class="delta">{{ delta }}</div>
            <dl id="kpis" class="kpis"><div v-for="[v,k,icon] in kpis" :key="k"><dt><UIcon :name="icon" /> {{ k }}</dt><dd>{{ v }}</dd></div></dl>
          </div>
          <div class="field-title">Where the money goes</div>
          <div id="breakdown" class="breakdown" role="table" aria-label="Cost by category">
            <div v-for="c in e.categories" :key="c.name" class="bar-row" role="row" :title="`${c.name}: ${euro(c.cost)}${e.total?` (${Math.round(c.cost/e.total*100)}%)`:''}`">
              <span role="cell">{{ c.name }}</span><span class="bar" role="presentation"><i :style="{width:`${c.cost/maxCategory*100}%`}" /></span><b role="cell">{{ euro(c.cost) }}</b>
            </div>
          </div>
          <div class="options">
            <label class="range-label" for="pixel-price">Price per string of 50 pixels <span id="pixel-price-value">{{ euro(options.pixelPrice) }} ({{ euro(options.pixelPrice/50) }} each)</span></label>
            <USlider id="pixel-price" v-model="options.pixelPrice" :min="6" :max="25" :step=".5" size="sm" aria-label="Price per string of 50 pixels" />
            <label class="range-label" for="spare">Spare pixels <span id="spare-value">{{ options.spare }}%</span></label>
            <USlider id="spare" v-model="options.spare" :min="0" :max="20" :step="1" size="sm" aria-label="Spare pixels" />
            <label class="range-label" for="contingency">Contingency <span id="contingency-value">{{ options.contingency }}%</span></label>
            <USlider id="contingency" v-model="options.contingency" :min="0" :max="30" :step="1" size="sm" aria-label="Contingency" />
            <div class="switch-row"><span>Music for visitors <small>USB sound card and FM transmitter</small></span><USwitch id="audio" v-model="options.audio" aria-label="Music for visitors" /></div>
            <UButton id="reset" block color="neutral" variant="soft" icon="i-lucide-undo-2" label="Back to the full show" class="mt-5" @click="reset" />
          </div>
        </aside>
      </div>

      <section class="infra"><h2>Show infrastructure</h2><p class="note">Shared by every prop: it grows with the pixels and boxes the selected props need.</p>
        <div id="infra" class="glass table-card">
          <table v-if="e.infra.length">
            <tbody><tr v-for="(l,i) in e.infra" :key="i" class="line"><td>{{ l.name }} <UBadge v-if="estimated(l)" label="estimate" color="primary" variant="subtle" size="sm" /></td><td class="num">{{ qty(l) }}</td><td class="num">{{ euro(l.cost) }}</td></tr></tbody>
            <tfoot>
              <tr><td>Infrastructure</td><td /><td class="num">{{ euro(e.infraTotal) }}</td></tr>
              <tr><td>Props (all groups)</td><td /><td class="num">{{ euro(e.direct) }}</td></tr>
              <tr><td>Contingency ({{ options.contingency }}%)</td><td /><td class="num">{{ euro(e.contingency) }}</td></tr>
              <tr class="grand"><td>Total</td><td /><td class="num">{{ euro(e.total) }}</td></tr>
            </tfoot>
          </table>
          <p v-else class="note">No props selected.</p>
        </div>
      </section>

      <section id="analysis" class="analysis">
        <h2>Why these LEDs</h2>
        <div class="cards">
          <div class="glass"><UIcon name="i-lucide-palette" class="card-icon" /><h3>Pixels, not coloured strings</h3><p>The show runs 56 channels, fades included, and four of them (the upper, lower, window and ground strips) switch yellow and blue independently. With ordinary coloured strings that is 60 dimmable outputs and two strings on every multicolour run. Addressable WS2811 pixels take one data line per run: each bulb can be yellow, blue, red or green at any brightness, so the same detected timing drives every prop, and each prop can later do more than the original did.</p></div>
          <div class="glass"><UIcon name="i-lucide-lightbulb" class="card-icon" /><h3>12 V, 12 mm bullets</h3><p>12 mm bullet pixels look like the original's C-style bulbs from the street and are sealed to IP68. 12 V loses less voltage over the {{ longestRun }} m runs and long chains than 5 V; a run still gets power injected every {{ INJECT_EVERY }} pixels. They come in strings of 50 at a 10 cm pitch; where a prop packs them tighter (the letters at 4.5 cm, the house strips at 5 cm), the spare wire hides behind the board or the run.</p></div>
          <div class="glass"><UIcon name="i-lucide-box" class="card-icon" /><h3>Two boxes, one player</h3><p>A {{ ZONES.facade.name.toLowerCase() }} {{ ZONES.facade.where }} feeds the facade props, and a {{ ZONES.garden.name.toLowerCase() }} {{ ZONES.garden.where }} feeds the garden props. Each holds a Baldrick 8 controller (8 ports of up to 750 pixels; we load at most {{ PORT_PIXELS }} per port) and Mean Well 12 V supplies at no more than {{ Math.round(PSU_LOAD*100) }}% load. A Raspberry Pi with Falcon Player plays the sequence and the music and sends it to both boxes over the network. xLights and Falcon Player are free.</p></div>
          <div class="glass"><UIcon name="i-lucide-zap" class="card-icon" /><h3>Power and running cost</h3><p>At about {{ WATTS_PER_PIXEL }} W per pixel (<a :href="WATTS_SOURCE">OpenELAB spec</a>) all {{ full.pixels.toLocaleString('en') }} pixels at full white would draw {{ full.watts }} W. The show is mostly yellow, red and dark, so it averages far less: at a third of that for 5 hours a night through December, about {{ kwh }} kWh, or roughly {{ euro(Math.round(kwh*.35)) }} of electricity at €0.35 per kWh.</p></div>
        </div>
        <h3 class="per-group-title">Pixels per group</h3>
        <div class="mini-bars">
          <div v-for="g in pixelGroups" :key="g.id" class="bar-row" :title="`${g.name}: ${g.pixels} pixels`"><span>{{ g.name }}</span><span class="bar"><i :style="{width:`${g.pixels/maxPixels*100}%`}" /></span><b>{{ g.pixels }}</b></div>
        </div>
        <p class="note">Not included: tools (drill, crimper, multimeter), shipping, labour and the time to sequence. Pixel counts come straight from the 3D model of our house; build the props denser or sparser and the pixel cost follows.</p>
      </section>

      <section class="sources"><h2>Prices and sources</h2>
        <div id="sources" class="glass table-card">
          <table><thead><tr><th>Part</th><th>Shop</th><th class="num">Price</th></tr></thead><tbody>
            <tr v-for="p in Object.values(PRICES)" :key="p.name"><td>{{ p.name }} <UBadge v-if="p.estimate" label="estimate" color="primary" variant="subtle" size="sm" /></td><td><a v-if="p.url" :href="p.url" rel="noopener">{{ p.shop }}</a><template v-else>–</template></td><td class="num">{{ euro(p.price) }}</td></tr>
          </tbody></table>
        </div>
        <p class="note">Cheaper pixels: the same 12 V strings sell for less from importers (Alitove on Amazon.nl, AliExpress), which the pixel price slider lets you try. A QuinLED Dig-Octa (<a href="https://quinled.shop/product/dig-octa-system/">from about $65</a>) is an alternative 8-port controller.</p>
      </section>
    </main>
  </div>
</template>
