<script setup>
import {PRINT_PROPS,PARTS,BED,FILAMENT,SETTINGS,MINI_SPOKE_CM,STRAND_CM} from '~~/src/print/parts.js';
import MANIFEST from '~~/outputs/print/manifest.json';

// The 3D prints page: the PETG parts the garden props still need, sized for
// the Bambu Lab A1, with a 3D view of each on the bed and its STL and source.
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
const selected=ref(PARTS[0].id);
const current=computed(()=>PARTS.find(p=>p.id===selected.value));
const thumbs=ref({});
const pick=id=>{selected.value=id;if(import.meta.client&&matchMedia('(max-width: 980px)').matches)document.getElementById('viewer')?.scrollIntoView({behavior:'smooth',block:'start'});};

const SITE='https://winterlight.alexander-df0.workers.dev';
const TITLE='Winterlight · 3D prints';
const DESCRIPTION='The PETG parts the Winterlight garden props still need, designed in OpenSCAD for a Bambu Lab A1: mini-tree frames, the wireframe tree\'s crown hub, star holder and strand pegs, candy cane stakes and ground strip posts, with STL downloads and print settings.';
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
        <p>The PETG parts the garden props still need: frames for the mini trees, the wireframe tree's crown hub, star holder and strand pegs, stakes for the candy canes and posts for the ground strip.
          Every part fits the {{ BED.name }}'s {{ BED.x }} mm bed and prints without supports. Sizes come from the same model as the show, so a part changes with it.
          The facade props hang on coro and ready-made letters, so they have nothing to print.</p>
        <p class="actions">
          <UButton to="/outputs/print/winterlight-prints.zip" external download icon="i-lucide-download" label="All STLs and sources (.zip)" color="primary" />
          <UButton to="/runbook.html#build" external icon="i-lucide-list-checks" label="Build steps in the runbook" color="neutral" variant="subtle" />
        </p>
      </section>

      <div class="wiring-kpis">
        <div class="glass"><b>{{ total.parts }}</b><span>parts to print, spares included</span></div>
        <div class="glass"><b>{{ total.kinds }}</b><span>different parts</span></div>
        <div class="glass"><b>{{ kg(total.grams) }}</b><span>of PETG, about</span></div>
        <div class="glass"><b>{{ rolls }} of {{ FILAMENT.rolls }}</b><span>rolls bought</span></div>
      </div>

      <section id="viewer" class="viewer glass" aria-label="3D view of the selected part on the print bed">
        <div class="stage">
          <ClientOnly><PartViewer :part="selected" :bed="BED" :parts="PARTS.map(p=>p.id)" @thumbs="t=>thumbs=t" /></ClientOnly>
          <div class="stage-label">
            <strong>{{ current.name }}</strong>
            <span>{{ size(current.id) }} mm on the {{ BED.x }} × {{ BED.y }} mm bed, as it prints. Drag to turn, scroll or pinch to zoom.</span>
          </div>
        </div>
        <nav class="part-picker" aria-label="Parts">
          <button v-for="p in PARTS" :key="p.id" type="button" :aria-pressed="p.id===selected" @click="pick(p.id)">
            <span>{{ p.name }}</span><small>{{ PRINT_PROPS.find(x=>x.id===p.prop).name }} · {{ p.qty }} ×</small>
          </button>
        </nav>
      </section>

      <section v-for="prop in PRINT_PROPS" :id="prop.id" :key="prop.id" class="prop-block">
        <header>
          <UIcon :name="prop.icon" class="card-icon" />
          <div><h2>{{ prop.name }}</h2><p class="led">{{ prop.about }}</p></div>
        </header>
        <div class="part-grid">
          <article v-for="part in prop.parts" :key="part.id" class="part glass" :data-part="part.id">
            <button type="button" class="thumb" :aria-label="`Show the ${part.name.toLowerCase()} in 3D`" @click="pick(part.id)">
              <img v-if="thumbs[part.id]" :src="thumbs[part.id]" :alt="`${part.name}, as it prints`">
              <UIcon v-else name="i-lucide-box" class="thumb-placeholder" />
            </button>
            <div class="part-body">
              <h3>{{ part.name }}</h3>
              <p class="qty"><b>Print {{ part.per*prop.count+part.spare }}</b> · {{ part.per*prop.count }} needed<template v-if="part.spare"> + {{ part.spare }} spare</template></p>
              <dl>
                <div><dt>Size</dt><dd>{{ size(part.id) }} mm</dd></div>
                <div><dt>PETG</dt><dd>about {{ info(part.id).grams }} g each</dd></div>
              </dl>
              <p class="how">{{ part.how }}</p>
              <p class="files">
                <UButton :to="`/outputs/print/${part.id}.stl`" external download size="sm" icon="i-lucide-download" label="STL" color="primary" variant="subtle" />
                <UButton :to="`/outputs/print/${part.id}.scad`" external download size="sm" icon="i-lucide-file-code" label="OpenSCAD" color="neutral" variant="subtle" />
              </p>
            </div>
          </article>
        </div>
      </section>

      <section class="wiring-notes">
        <div class="glass">
          <UIcon name="i-lucide-printer" class="card-icon" /><h3>Print settings</h3>
          <table class="settings"><tbody><tr v-for="[k,v] in SETTINGS" :key="k"><th>{{ k }}</th><td>{{ v }}</td></tr></tbody></table>
        </div>
        <div class="glass">
          <UIcon name="i-lucide-ruler" class="card-icon" /><h3>Measure before you print</h3>
          <p>The channels and slots are drawn for a 25 × 2 mm pixel mounting strip, 3 mm coro and a 32 mm tree pole, with 0.4 mm clearance per side. Measure the strip from LEDshows and the pole once they are in, and print one mini-tree base and one cane stake to try before the rest.</p>
          <p>To change a size, open the part's .scad file in <a href="https://openscad.org/" target="_blank" rel="noopener">OpenSCAD</a> (strip_w, strip_t, clr and pole_d are at the top of lib.scad and the hub), render with F6 and export the STL. Each part needs <a href="/outputs/print/lib.scad" download>lib.scad</a> in the same folder (the zip has it). In the repository, <code>node tools/print/make.mjs</code> renders them all again.</p>
        </div>
        <div class="glass">
          <UIcon name="i-lucide-scissors" class="card-icon" /><h3>Strip to cut</h3>
          <p>Mini trees: 6 spokes of {{ MINI_SPOKE_CM }} cm each, {{ PRINT_PROPS[0].count*6 }} in all. Wireframe tree: 16 strands of about {{ STRAND_CM }} cm, from the peg's pocket to the hub's channel; cut them long and trim once the hub is on the pole. The spokes stop 3.4 cm short of the centre at the top, because six 25 mm strips can't meet at a point.</p>
        </div>
        <div class="glass">
          <UIcon name="i-lucide-tree-pine" class="card-icon" /><h3>On the A1</h3>
          <p>A full plate of stakes or posts lies flat side by side; the bed takes about eight across. The crown hub is the widest part at {{ Math.round(info('tree-crown').size[0]) }} mm. Dry the PETG (65 °C, 4 h) if it strings or pops, and let the plate cool before taking PETG off the textured plate.</p>
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
.stage{position:relative;min-height:440px;background:radial-gradient(ellipse at 50% 30%,#1d2c44,#0d1626)}
.stage-label{position:absolute;left:18px;bottom:16px;right:18px;display:flex;flex-direction:column;gap:3px;pointer-events:none;text-shadow:0 2px 12px #000c}
.stage-label strong{font-family:var(--font-display);font-size:20px;font-weight:500;color:#fbf4e8}
.stage-label span{font-size:12px;color:#a3b3c3}
.part-picker{display:flex;flex-direction:column;gap:4px;padding:12px;border-left:1px solid #ffffff12;max-height:440px;overflow:auto}
.part-picker button{display:flex;flex-direction:column;align-items:flex-start;gap:2px;text-align:left;padding:9px 12px;border-radius:10px;border:1px solid transparent;background:none;color:#d6dfe6;font-size:13px;cursor:pointer;transition:background .2s,border-color .2s}
.part-picker button small{font-size:11px;color:#8397a9}
.part-picker button:hover{background:#ffffff0a}
.part-picker button[aria-pressed=true]{background:#efc1971a;border-color:#efc19755;color:var(--gold)}
.prop-block{margin-bottom:34px;scroll-margin-top:80px}
.prop-block header{display:flex;gap:14px;align-items:flex-start;margin-bottom:14px}
.prop-block header .card-icon{margin-top:6px;flex-shrink:0}
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
.settings th{width:84px;text-transform:none;letter-spacing:0;font-size:12px;color:#8397a9;border-bottom:1px solid #ffffff0a;vertical-align:top;padding:7px 8px 7px 0}
.settings td{padding:7px 0}
@media (max-width:980px){
  .wiring-kpis{grid-template-columns:repeat(2,1fr)}
  .wiring-notes{grid-template-columns:1fr}
  .viewer{grid-template-columns:1fr}
  .stage{min-height:340px}
  .part-picker{flex-direction:row;overflow-x:auto;border-left:0;border-top:1px solid #ffffff12;max-height:none}
  .part-picker button{flex-shrink:0}
}
@media (max-width:720px){
  .part-grid{grid-template-columns:1fr}
  .part{grid-template-columns:110px minmax(0,1fr);gap:12px}
}
</style>
