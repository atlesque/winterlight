<script setup>
import {PRINT_PROPS,PARTS,BED,FILAMENT,SETTINGS,MINI_SPOKE_CM,STRAND_CM,BRICK,BRICKS,PARASOL,NOZZLES,NOZZLE_STEPS,BASE_PARTS,BASE_SPEED,GRAMS_PER_HOUR,MEASURE,PLATES} from '~~/src/print/parts.js';
import {ASSEMBLIES} from '~~/src/print/assembly.js';
import MANIFEST from '~~/outputs/print/manifest.json';

// The 3D prints page: the PETG parts the garden props still need, sized for
// the Bambu Lab A1. The 3D view shows each finished prop, or each part on the
// bed as it prints, and every part has its STL and OpenSCAD source.
definePageMeta({alias:['/print.html']});
const info=id=>MANIFEST[id]??{size:[0,0,0],grams:0};
const size=id=>info(id).size.map(v=>Math.round(v)).join(' × ');
const total={
 parts:PARTS.reduce((s,p)=>s+p.qty,0),
 grams:PARTS.reduce((s,p)=>s+p.qty*info(p.id).grams,0),
 kinds:PARTS.length,
};
const kg=g=>`${(Math.round(g/100)/10).toLocaleString('en')} kg`;
const rolls=Math.ceil(total.grams/FILAMENT.grams);
const spare=FILAMENT.rolls*FILAMENT.grams-total.grams;
// The plate plan: grams per plate from the manifest, hours from a rough print speed,
// faster on the 0.6 mm nozzle and with the bases' coarser settings.
const nozzle=ref('n06');
const currentNozzle=computed(()=>NOZZLES.find(n=>n.id===nozzle.value));
const plateGrams=pl=>Object.entries(pl.parts).reduce((s,[id,n])=>s+n*info(id).grams,0);
const plateHours=(pl,nz)=>Object.entries(pl.parts).reduce((s,[id,n])=>s+n*info(id).grams/GRAMS_PER_HOUR*nz.speed*(BASE_PARTS.includes(id)?BASE_SPEED:1),0);
const plateParts=pl=>Object.entries(pl.parts).map(([id,n])=>`${n} × ${PARTS.find(p=>p.id===id).name.toLowerCase()}`).join(', ');
const hoursFor=nz=>PLATES.reduce((s,pl)=>s+pl.count*plateHours(pl,nz),0);
const plateCount=PLATES.reduce((s,pl)=>s+pl.count,0);
const fmtHours=h=>h<10?`${Math.round(h*2)/2} h`:`${Math.round(h)} h`;
const mode=ref('prop'),prop=ref(PRINT_PROPS[0].id),part=ref(PARTS[0].id);
const currentProp=computed(()=>PRINT_PROPS.find(p=>p.id===prop.value));
const currentPart=computed(()=>PARTS.find(p=>p.id===part.value));
const thumbs=ref({});
const reveal=()=>{if(import.meta.client)document.getElementById('viewer')?.scrollIntoView({behavior:'smooth',block:'start'});};
const showProp=id=>{mode.value='prop';prop.value=id;reveal();};
const showPart=id=>{mode.value='part';part.value=id;prop.value=PARTS.find(p=>p.id===id).prop;reveal();};
const propName=id=>PRINT_PROPS.find(x=>x.id===id).name;

const SITE='https://winterlight.alexander-df0.workers.dev';
const TITLE='Winterlight · 3D prints';
const DESCRIPTION='The PETG parts the Winterlight garden props still need, designed in OpenSCAD for a Bambu Lab A1: mini-tree frames, the wireframe tree\'s crown hub, base ring and star holder, and brick-weighted bases for the candy canes and the ground strip, with a 3D view of each finished prop, STL downloads, what to measure first, a plate plan and print settings for the 0.4 and 0.6 mm nozzles.';
useHead({title:TITLE,link:[{rel:'canonical',href:`${SITE}/print.html`}],bodyAttrs:{class:'print-page'}});
useSeoMeta({description:DESCRIPTION,ogType:'website',ogSiteName:'Winterlight',ogLocale:'en_GB',ogTitle:TITLE,ogDescription:DESCRIPTION,ogUrl:`${SITE}/print.html`,
 ogImage:`${SITE}/og-image.jpg`,ogImageType:'image/jpeg',ogImageWidth:1200,ogImageHeight:630,ogImageAlt:'3D model of a house with a wireframe Christmas tree, a peace sign, Christmas circles and HAPPY HOLIDAYS letters lit up',
 twitterCard:'summary_large_image',twitterTitle:TITLE,twitterDescription:DESCRIPTION,twitterImage:`${SITE}/og-image.jpg`});
</script>

<template>
  <div class="costs-shell">
    <FestiveSky />
    <AppHeader />
    <main class="costs prints">
      <section class="intro">
        <h1>3D prints</h1>
        <p>PETG parts for the garden props, all sized for the {{ BED.name }}.</p>
        <ul class="points">
          <li>The paving is stone, so nothing is staked: props stand on printed trays weighed down with paving bricks.</li>
          <li>The tree's pole stands in a parasol base; the mini trees push a rod into their bush.</li>
          <li>Every part fits the {{ BED.x }} mm bed and prints without supports.</li>
        </ul>
        <p class="actions">
          <UButton to="/outputs/print/winterlight-prints.zip" external download icon="i-lucide-download" label="All STLs and sources (.zip)" color="primary" />
          <UButton to="/runbook.html#build" external icon="i-lucide-list-checks" label="Build steps in the runbook" color="neutral" variant="subtle" />
        </p>
      </section>

      <div class="wiring-kpis">
        <div class="glass"><b>{{ total.parts }}</b><span>parts to print, spares included</span></div>
        <div class="glass"><b>{{ kg(total.grams) }}</b><span>of PETG, about {{ rolls }} of the {{ FILAMENT.rolls }} rolls bought</span></div>
        <div class="glass"><b>{{ BRICKS }}</b><span>paving bricks for ballast, about {{ BRICKS*BRICK.kg }} kg</span></div>
        <div class="glass"><b>{{ Math.round(hoursFor(NOZZLES[1])) }} h</b><span>of printing on the 0.6 mm nozzle, about {{ Math.round(hoursFor(NOZZLES[0])) }} h on the 0.4 mm</span></div>
      </div>

      <section id="viewer" class="viewer glass" aria-label="3D view">
        <div class="stage">
          <ClientOnly><PartViewer :mode="mode" :prop="prop" :part="part" :bed="BED" :parts="PARTS.map(p=>p.id)" @thumbs="t=>thumbs=t" /></ClientOnly>
          <div class="mode-toggle house-toggle" role="group" aria-label="What to show">
            <button type="button" :aria-pressed="mode==='prop'" @click="mode='prop'"><UIcon name="i-lucide-sparkles" class="toggle-icon" />Finished prop</button>
            <button type="button" :aria-pressed="mode==='part'" @click="mode='part'"><UIcon name="i-lucide-printer" class="toggle-icon" />Parts on the bed</button>
          </div>
          <div class="stage-label">
            <template v-if="mode==='prop'">
              <strong>{{ currentProp.name }}</strong>
              <span class="legend"><i class="sw gold" />printed <i class="sw strip" />strip <i class="sw coro" />coro <i class="sw brick" />brick</span>
            </template>
            <template v-else>
              <strong>{{ currentPart.name }}</strong>
              <span>{{ size(currentPart.id) }} mm on the {{ BED.x }} × {{ BED.y }} mm bed, as it prints.</span>
            </template>
            <span class="hint">Drag to turn, scroll or pinch to zoom.</span>
          </div>
        </div>
        <nav class="part-picker" aria-label="Choose a prop or part">
          <template v-if="mode==='prop'">
            <button v-for="p in PRINT_PROPS" :key="p.id" type="button" :aria-pressed="p.id===prop" @click="prop=p.id">
              <span>{{ p.name }}</span><small>{{ p.parts.length }} printed {{ p.parts.length===1?'part':'parts' }}<template v-if="p.bricks"> · {{ p.bricks }} bricks</template></small>
            </button>
          </template>
          <template v-else>
            <button v-for="p in PARTS" :key="p.id" type="button" :aria-pressed="p.id===part" @click="part=p.id">
              <span>{{ p.name }}</span><small>{{ propName(p.prop) }} · {{ p.qty }} ×</small>
            </button>
          </template>
        </nav>
      </section>

      <section id="before" class="guide-block">
        <h2><UIcon name="i-lucide-ruler" class="card-icon" /> Before you print</h2>
        <p class="lead">Measure four things, then print the two test plates. Every part adds its own clearance, 0.4 mm a side, so enter sizes as measured.</p>
        <div class="glass guide-table">
          <table class="measure">
            <thead><tr><th>Measure</th><th>Drawn for</th><th>Change it in</th><th>Affects</th></tr></thead>
            <tbody>
              <tr v-for="m in MEASURE" :key="m.what" :class="{warn:m.warn}">
                <td><b>{{ m.what }}</b><small>{{ m.has }}</small></td>
                <td>{{ m.drawn }}<small v-if="m.warn" class="warn-text">{{ m.warn }}</small><small v-else-if="m.note">{{ m.note }}</small></td>
                <td><code>{{ m.where }}</code></td>
                <td>{{ m.parts }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <ol class="howto">
          <li><b>Swap to the 0.6 mm nozzle</b> if you have it, before anything else (see <a href="#plates">the plate plan</a>).</li>
          <li><b>Print the two test plates:</b> a mini-tree base with its top cap, and a post foot with a post. The strip should slide snugly into the channels, a bamboo cane through the rod hole, and a brick drop into the tray.</li>
          <li><b>If they fit,</b> print the rest as they are. If not, change the size in <a href="/outputs/print/lib.scad" download>lib.scad</a> in <a href="https://openscad.org/" target="_blank" rel="noopener">OpenSCAD</a> (F6 to render, F7 to export the STL).</li>
          <li><b>Print the crown hub and star holder</b> only once the pole is bought and <code>pole_d</code> is set to its measured size.</li>
        </ol>
      </section>
      <section v-for="p in PRINT_PROPS" :id="p.id" :key="p.id" class="prop-block">
        <header>
          <button type="button" class="thumb prop-thumb" :aria-label="`Show the finished ${p.name.toLowerCase()} in 3D`" @click="showProp(p.id)">
            <img v-if="thumbs[`prop:${p.id}`]" :src="thumbs[`prop:${p.id}`]" :alt="`The finished ${p.name.toLowerCase()}`">
            <UIcon v-else :name="p.icon" class="thumb-placeholder" />
          </button>
          <div>
            <h2><UIcon :name="p.icon" class="card-icon" /> {{ p.name }}</h2>
            <ul class="points">
              <li v-for="t in p.points" :key="t">{{ t }}</li>
            </ul>
            <UButton size="sm" color="neutral" variant="subtle" icon="i-lucide-rotate-3d" label="See it finished in 3D" @click="showProp(p.id)" />
          </div>
        </header>
        <div class="part-grid">
          <article v-for="x in p.parts" :key="x.id" class="part glass" :data-part="x.id">
            <button type="button" class="thumb" :aria-label="`Show the ${x.name.toLowerCase()} on the print bed`" @click="showPart(x.id)">
              <img v-if="thumbs[x.id]" :src="thumbs[x.id]" :alt="`${x.name}, as it prints`">
              <UIcon v-else name="i-lucide-box" class="thumb-placeholder" />
            </button>
            <div class="part-body">
              <h3>{{ x.name }}</h3>
              <p class="qty"><b>Print {{ x.per*p.count+x.spare }}</b> · {{ x.per*p.count }} needed<template v-if="x.spare"> + {{ x.spare }} spare</template></p>
              <dl>
                <div><dt>Size</dt><dd>{{ size(x.id) }} mm</dd></div>
                <div><dt>PETG</dt><dd>about {{ info(x.id).grams }} g each</dd></div>
              </dl>
              <p class="how">{{ x.how }}</p>
              <p class="files">
                <UButton :to="`/outputs/print/${x.id}.stl`" external download size="sm" icon="i-lucide-download" label="STL" color="primary" variant="subtle" />
                <UButton :to="`/outputs/print/${x.id}.scad`" external download size="sm" icon="i-lucide-file-code" label="OpenSCAD" color="neutral" variant="subtle" />
              </p>
            </div>
          </article>
        </div>
      </section>

      <section id="plates" class="guide-block">
        <div class="guide-head">
          <h2><UIcon name="i-lucide-layers" class="card-icon" /> Plate plan</h2>
          <div class="house-toggle" role="group" aria-label="Nozzle">
            <button v-for="n in NOZZLES" :key="n.id" type="button" :aria-pressed="n.id===nozzle" @click="nozzle=n.id">{{ n.name }}</button>
          </div>
        </div>
        <p class="lead">{{ plateCount }} plates and about {{ Math.round(hoursFor(currentNozzle)) }} hours on the {{ currentNozzle.short }} nozzle. Parts that fit the bed together share a plate; the rest nearly fill it alone, so more per plate would only save the few minutes of heating and calibration each. The frames that get pixels go first, since the pixels land from 28 Nov; the bases only hold bricks, so they go last.</p>
        <div class="glass guide-table">
          <table class="plates">
            <thead><tr><th>Plate</th><th class="num">Plates</th><th class="num">PETG each</th><th class="num">Time each</th><th class="when">When</th></tr></thead>
            <tbody>
              <tr v-for="pl in PLATES" :key="pl.id" :class="{test:pl.test}">
                <td><b>{{ pl.name }}</b><small>{{ plateParts(pl) }}</small><small class="when-m">{{ pl.when }}</small></td>
                <td class="num">{{ pl.count }}</td>
                <td class="num">{{ plateGrams(pl) }} g</td>
                <td class="num">{{ fmtHours(plateHours(pl,currentNozzle)) }}</td>
                <td class="when">{{ pl.when }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="nozzle-grid">
          <div class="glass">
            <h3>Settings on the {{ currentNozzle.name }}</h3>
            <table class="nozzle">
              <thead><tr><th>Parts</th><th>Layer</th><th class="num">Walls</th><th class="num">Top / bottom</th><th class="num">Infill</th></tr></thead>
              <tbody><tr v-for="r in currentNozzle.rows" :key="r.parts"><td>{{ r.parts }}</td><td>{{ r.layer }}</td><td class="num">{{ r.walls }}</td><td class="num">{{ r.shells }}</td><td class="num">{{ r.infill }}</td></tr></tbody>
            </table>
            <p class="tip">Times are rough, at {{ GRAMS_PER_HOUR }} g of PETG an hour on the 0.4 mm nozzle; Bambu Studio shows the real time per plate. Run the long plates overnight and swap the short ones in the day.</p>
          </div>
          <div class="glass">
            <h3>Switching to the 0.6 mm nozzle</h3>
            <ol class="howto compact"><li v-for="t in NOZZLE_STEPS" :key="t">{{ t }}</li></ol>
          </div>
        </div>
      </section>
      <section class="wiring-notes">
        <div class="glass">
          <UIcon name="i-lucide-printer" class="card-icon" /><h3>Print settings for every part</h3>
          <table class="settings"><tbody><tr v-for="[k,v] in SETTINGS" :key="k"><th>{{ k }}</th><td>{{ v }}</td></tr></tbody></table>
        </div>
        <div class="glass">
          <UIcon name="i-lucide-weight" class="card-icon" /><h3>To buy</h3>
          <ul class="points">
            <li><b>{{ BRICKS }} paving bricks</b>, 22 × 11 × 8 cm (about {{ BRICK.kg }} kg each): 2 per cane, 1 per post, 4 for the tree</li>
            <li><b>A parasol base</b> of about {{ PARASOL.kg }} kg whose clamp takes the pole</li>
            <li><b>Rods of about 1.2 m</b> (fibreglass, bamboo or galvanised), one per mini tree, down through the bush into the soil</li>
            <li><b>Guy rope and four ground anchors</b> for the tree, into the soil of the planting tiles</li>
          </ul>
        </div>
        <div class="glass">
          <UIcon name="i-lucide-cylinder" class="card-icon" /><h3>Filament</h3>
          <ul class="points">
            <li><b>{{ FILAMENT.name }}</b>, 1.75 mm: {{ FILAMENT.rolls }} rolls of 1 kg, arrived 12 Nov. PETG rather than PLA: these stand out in the cold and wet carrying bricks.</li>
            <li>The parts need about {{ kg(total.grams) }}, leaving only about {{ Math.round(spare/10)*10 }} g, less than two failed cane bases.</li>
            <li>Slice one of each plate and add them up. Over about 5.8 kg, order <a href="https://eu.store.bambulab.com/products/petg-basic" target="_blank" rel="noopener">one more roll</a> by 25 Nov (it takes 3 to 7 days).</li>
          </ul>
        </div>
        <div class="glass">
          <UIcon name="i-lucide-scissors" class="card-icon" /><h3>Strip to cut</h3>
          <ul class="points">
            <li><b>Mini trees:</b> {{ PRINT_PROPS[0].count*6 }} spokes of {{ MINI_SPOKE_CM }} cm</li>
            <li><b>Wireframe tree:</b> 16 strands of about {{ STRAND_CM }} cm; cut long, trim once the hub is up</li>
          </ul>
          <p class="tip">Dry the PETG (65 °C, 4 h) if it strings. The cane base is the biggest print, almost the whole bed.</p>
        </div>
      </section>
    </main>
  </div>
</template>

<style scoped>
.wiring-kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin:18px 0}
.wiring-kpis>div{padding:16px 18px;display:flex;flex-direction:column;gap:2px}
.wiring-kpis b{font-family:var(--font-display);font-size:28px;font-weight:500;color:var(--gold);font-variant-numeric:tabular-nums}
.wiring-kpis span{font-size:12px;color:#a3b3c3}
.wiring-notes{display:grid;grid-template-columns:repeat(2,1fr);gap:12px;margin-top:18px}
.wiring-notes>div{padding:18px 20px}
.intro .actions{display:flex;flex-wrap:wrap;gap:10px;margin-top:18px}
.viewer{display:grid;grid-template-columns:minmax(0,1fr) 260px;gap:0;overflow:hidden;margin:18px 0 34px;scroll-margin-top:80px}
.stage{position:relative;min-height:540px;background:radial-gradient(ellipse at 50% 30%,#1d2c44,#0d1626)}
.stage-label{position:absolute;left:18px;bottom:16px;right:18px;display:flex;flex-direction:column;gap:3px;pointer-events:none;text-shadow:0 2px 12px #000c}
.stage-label strong{font-family:var(--font-display);font-size:20px;font-weight:500;color:#fbf4e8}
.stage-label span{font-size:12px;color:#a3b3c3;max-width:640px}
.stage-label .hint{color:#7d92a8;font-size:11px}
.mode-toggle{position:absolute;top:14px;left:14px;z-index:2;backdrop-filter:blur(8px);background:rgb(16 26 44 / .72)}
.part-picker{display:flex;flex-direction:column;gap:4px;padding:12px;border-left:1px solid #ffffff12;max-height:540px;overflow:auto}
.part-picker button{display:flex;flex-direction:column;align-items:flex-start;gap:2px;text-align:left;padding:9px 12px;border-radius:10px;border:1px solid transparent;background:none;color:#d6dfe6;font-size:13px;cursor:pointer;transition:background .2s,border-color .2s}
.part-picker button small{font-size:11px;color:#8397a9}
.part-picker button:hover{background:#ffffff0a}
.part-picker button[aria-pressed=true]{background:#efc1971a;border-color:#efc19755;color:var(--gold)}
.prop-block{margin-bottom:34px;scroll-margin-top:80px}
.prop-block header{display:flex;gap:14px;align-items:flex-start;margin-bottom:14px}
.prop-block h2{display:flex;align-items:center;gap:10px}
.points{margin:6px 0 12px;padding-left:18px;list-style:disc;color:#a3b3c3;font-size:13.5px;line-height:1.6;max-width:780px}
.points li{margin:3px 0}
.points li::marker{color:var(--gold-soft)}
.points b{color:#e3e9ee;font-weight:600}
.intro .points{font-size:14px}
.wiring-notes .points{font-size:12.5px}
.tip{font-size:12px!important;color:#8397a9!important}
.legend{display:flex;flex-wrap:wrap;align-items:center;gap:4px 12px}
.sw{display:inline-block;width:10px;height:10px;border-radius:3px;margin-right:-6px}
.sw.gold{background:#f0c49a}.sw.strip{background:#16181d;border:1px solid #ffffff44}.sw.coro{background:#f2f2ee}.sw.brick{background:#7c8288}
.prop-thumb{width:200px;flex-shrink:0}
.prop-block .led{color:#a3b3c3;font-size:13.5px;line-height:1.7;max-width:820px;margin:0}
.part-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(330px,1fr));gap:12px}
.part{display:grid;grid-template-columns:140px minmax(0,1fr);gap:16px;padding:14px}
.thumb{display:flex;align-items:center;justify-content:center;aspect-ratio:4/3;align-self:start;border-radius:12px;border:1px solid #ffffff12;background:radial-gradient(ellipse at 50% 35%,#1d2c44,#0d1626);cursor:pointer;padding:0;overflow:hidden}
.thumb:hover{border-color:#efc19766}
.thumb img{width:100%;height:100%;object-fit:contain}
.thumb-placeholder{width:28px;height:28px;color:#5a6f88}
.part-body h3{margin:2px 0 4px}
.qty{font-size:12px;color:#a3b3c3;margin:0 0 8px}
.qty b{color:var(--gold);font-weight:600}
.part dl{display:flex;flex-wrap:wrap;gap:4px 16px;margin:0 0 8px;font-size:12px}
.part dt{display:inline;color:#8397a9;margin-right:5px}
.part dd{display:inline;margin:0;color:#d6dfe6;font-variant-numeric:tabular-nums}
.how{font-size:12px;line-height:1.6;color:#a3b3c3;margin:0 0 10px}
.files{display:flex;gap:8px;margin:0}
.wiring-notes p{font-size:12.5px;line-height:1.7;color:#a3b3c3;margin:0 0 8px}
.wiring-notes a{color:var(--gold-soft);text-decoration:underline;text-underline-offset:3px}
.wiring-notes code{font-size:11.5px;color:#e3e9ee}
.settings{font-size:12px}
.guide-block{margin:0 0 34px;scroll-margin-top:80px}
.guide-block h2{display:flex;align-items:center;gap:10px}
.guide-head{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:10px}
.lead{color:#a3b3c3;font-size:13.5px;line-height:1.6;max-width:820px;margin:6px 0 14px}
.guide-table{padding:6px 18px 4px;overflow-x:auto}
.guide-table td b{color:#e3e9ee;font-weight:600}
.guide-table td small,.nozzle-grid td small{display:block;color:#8397a9;font-size:11px;margin-top:3px;line-height:1.5}
.guide-table code,.howto code{font-size:11px;color:#e3e9ee}
.guide-table .num,.nozzle .num{text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap}
.measure tr.warn td:first-child b{color:var(--gold)}
.warn-text{color:#f0a48a!important}
.plates tr.test td:first-child b::after{content:'test';margin-left:8px;padding:1px 7px;border-radius:999px;font-size:10px;font-weight:500;color:#2a1a0c;background:var(--gold)}
.howto{margin:14px 0 0;padding-left:20px;list-style:decimal;color:#a3b3c3;font-size:13.5px;line-height:1.6;max-width:820px}
.howto li{margin:5px 0}
.howto li::marker{color:var(--gold-soft)}
.howto b{color:#e3e9ee;font-weight:600}
.howto a{color:var(--gold-soft);text-decoration:underline;text-underline-offset:3px}
.howto.compact{font-size:12.5px;margin-top:8px}
.nozzle-grid{display:grid;grid-template-columns:3fr 2fr;gap:12px;margin-top:12px}
.nozzle-grid>div{padding:18px 20px}
.nozzle-grid h3{margin:0 0 8px}
.guide-table small.when-m{display:none;color:var(--gold-soft)}
.settings th{width:84px;text-transform:none;letter-spacing:0;font-size:12px;color:#8397a9;border-bottom:1px solid #ffffff0a;vertical-align:top;padding:7px 8px 7px 0}
.settings td{padding:7px 0}
@media (max-width:980px){
  .wiring-kpis{grid-template-columns:repeat(2,1fr)}
  .wiring-notes{grid-template-columns:1fr}
  .nozzle-grid{grid-template-columns:1fr}
  .viewer{grid-template-columns:1fr}
  .stage{min-height:340px}
  .part-picker{flex-direction:row;overflow-x:auto;border-left:0;border-top:1px solid #ffffff12;max-height:none}
  .part-picker button{flex-shrink:0}
}
@media (max-width:720px){
  .prop-block header{flex-direction:column}
  .prop-thumb{width:100%;max-width:340px}
  .part-grid{grid-template-columns:1fr}
  .part{grid-template-columns:110px minmax(0,1fr);gap:12px}
  .plates .when{display:none}
  .guide-table small.when-m{display:block}
  .guide-table{padding:4px 12px 2px}
}
</style>
