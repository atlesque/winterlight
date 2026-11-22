<script setup>
import {CORO_PROPS,CORO_PIECES,CORO_HOLES,CORO_SHEETS,SHEET,HOLE,BAND,PITCH,coroOutline} from '~~/src/coro.js';
import {CUTTING_STEPS,CUTTING_KEY} from '~~/src/guides/cutting.js';

// The coro cutting page: which props to cut from the blank sheets, how to lay
// them out, and how to cut and drill them. Sizes, hole counts and the pixels
// that need a hole of their own all come from the 3D model (src/coro.js).
// The step-by-step guide at the top (src/guides/cutting.js) walks through it
// one piece at a time, with the sheet drawn under each step.
definePageMeta({alias:['/cutting.html']});
const outline=Object.fromEntries(CORO_PROPS.map(p=>[p.kind,coroOutline(p)]));
const cm=mm=>Math.round(mm/10);
const sheetsUsed=CORO_SHEETS.length;
const list=a=>a.length<2?a.join(''):`${a.slice(0,-1).join(', ')} and ${a.at(-1)}`;
const name=(t,n)=>{const w=t.replace(/^(?!Christmas)\w/,c=>c.toLowerCase()).replace(/^(\w+) (\w)/,(m,a,b)=>`${a} ${b.toLowerCase()}`);return n>1?`${n} ${w}s`:`1 ${w}`;};
const captions=CORO_SHEETS.map(s=>list(Object.entries(s.pieces.reduce((m,p)=>(m[p.title]=(m[p.title]||0)+1,m),{})).map(([t,n])=>name(t,n))));

const SITE='https://winterlight.alexander-df0.workers.dev';
const TITLE='Winterlight · Cutting the coro props';
const DESCRIPTION=`How to cut the Winterlight coro props from blank 3 mm sheets: ${CORO_PIECES} pieces (two Christmas circles, a peace sign, eight candy canes and the tree star) with ${CORO_HOLES} pixel holes of ${HOLE} mm, full-size and A4 templates, the sheet layout, tools and the order of work.`;
useHead({title:TITLE,link:[{rel:'canonical',href:`${SITE}/cutting.html`}],bodyAttrs:{class:'cutting-page'}});
useSeoMeta({description:DESCRIPTION,ogType:'website',ogSiteName:'Winterlight',ogLocale:'en_GB',ogTitle:TITLE,ogDescription:DESCRIPTION,ogUrl:`${SITE}/cutting.html`,
 ogImage:`${SITE}/og-image.jpg`,ogImageType:'image/jpeg',ogImageWidth:1200,ogImageHeight:630,ogImageAlt:'3D model of a house with a wireframe Christmas tree, a peace sign, Christmas circles and HAPPY HOLIDAYS letters lit up',
 twitterCard:'summary_large_image',twitterTitle:TITLE,twitterDescription:DESCRIPTION,twitterImage:`${SITE}/og-image.jpg`});
</script>

<template>
  <div class="costs-shell">
    <FestiveSky />
    <AppHeader />
    <main class="costs cutting">
      <section class="intro">
        <h1>Cutting the coro props</h1>
        <p>The circles, the peace sign, the candy canes and the tree star are cut from blank {{ SHEET.t }} mm coro sheets. Each one is an outline band {{ BAND/10 }} cm wide, with the pixel holes in the middle of the band. The HAPPY HOLIDAYS letters come pre-drilled, so they need no cutting.</p>
        <p class="actions">
          <UButton to="#guide" icon="i-lucide-list-checks" label="Step by step" color="primary" />
          <UButton to="#props" icon="i-lucide-file-down" label="Templates" color="neutral" variant="subtle" />
          <UButton to="/runbook.html#build" external icon="i-lucide-book-open-check" label="Build steps in the runbook" color="neutral" variant="subtle" />
        </p>
      </section>

      <div class="kpis-row">
        <div class="glass"><b>{{ CORO_PIECES }}</b><span>pieces to cut</span></div>
        <div class="glass"><b>{{ CORO_HOLES }}</b><span>pixel holes of {{ HOLE }} mm</span></div>
        <div class="glass"><b>{{ sheetsUsed }} of {{ SHEET.bought }}</b><span>sheets of {{ cm(SHEET.w) }} × {{ cm(SHEET.h) }} cm, the rest spare</span></div>
        <div class="glass"><b>{{ CORO_PROPS.length }}</b><span>templates to print, one of each</span></div>
      </div>

      <section id="guide" class="block">
        <h2>Step by step</h2>
        <p class="lead">One piece at a time, in the order of the sheet plan. Tick each task as you go; the guide opens where you left off.</p>
        <StepGuide :steps="CUTTING_STEPS" :storage-key="CUTTING_KEY">
          <template #step-ready>
            <div class="guide-files">
              <span v-for="p in CORO_PROPS" :key="p.kind" class="guide-file">
                <b>{{ p.title }}</b>
                <a :href="`/outputs/templates/${p.file}-a4.pdf`" download>A4 pages</a>
                <a :href="`/outputs/templates/${p.file}.pdf`" download>full size</a>
              </span>
            </div>
          </template>
          <template v-for="s in CUTTING_STEPS.filter(x=>x.sheet!==null)" :key="s.id" #[`step-${s.id}`]>
            <figure class="guide-sheet">
              <CoroSheet :sheet="s.sheet" :focus="s.slot" :cut="Array.from({length:s.slot},(_,i)=>i)" />
              <figcaption>Sheet {{ s.sheet+1 }}: <span class="key focus" /> this piece <span class="key cut" /> cut already <span class="key later" /> still to come</figcaption>
            </figure>
          </template>
        </StepGuide>
      </section>

      <section id="props" class="block">
        <h2>What to cut</h2>
        <div class="prop-grid">
          <article v-for="p in CORO_PROPS" :id="p.kind" :key="p.kind" class="prop glass">
            <div class="preview">
              <svg :viewBox="`-10 -10 ${outline[p.kind].w+20} ${outline[p.kind].h+20}`" role="img" :aria-label="`${p.title} template`">
                <g class="band" :stroke-width="BAND">
                  <polyline v-for="(l,i) in outline[p.kind].lines" :key="i" :points="l.map(q=>q.join(',')).join(' ')" />
                </g>
                <circle v-for="(b,i) in outline[p.kind].bulbs" :key="`b${i}`" class="band-dot" :cx="b[0]" :cy="b[1]" :r="BAND/2" />
                <circle v-for="(s,i) in outline[p.kind].spots" :key="`s${i}`" class="hole" :cx="s[0]" :cy="s[1]" :r="HOLE/2+2" />
              </svg>
            </div>
            <div class="prop-body">
              <h3><UIcon :name="p.icon" class="card-icon" /> {{ p.title }}</h3>
              <p class="qty"><b>Cut {{ p.cut }}</b> · about {{ cm(p.w) }} × {{ cm(p.h) }} cm</p>
              <dl>
                <div><dt>Holes</dt><dd>{{ p.holes }}<template v-if="p.cut>1"> each</template></dd></div>
                <div><dt>Pixels</dt><dd>{{ p.pixels }}</dd></div>
                <div><dt>Openings</dt><dd>{{ p.openingsText }}</dd></div>
              </dl>
              <p v-if="p.kind==='wreath'" class="how">Cut the first one from the template. For the second, lay the finished circle face down on a blank area, trace it with a marker on what will be the back, and drill through its holes. The four short bridges at the diagonals hold the inner ring; the two bumps at the bottom carry the red bow pixels.</p>
              <p v-else-if="p.kind==='peace'" class="how">Cut straight from the template. Take your time in the sharp inside corners where the strokes meet the ring. Where the strokes meet, one hole serves two pixels, so it has {{ p.holes }} holes for {{ p.pixels }} pixels.</p>
              <p v-else-if="p.kind==='cane'" class="how">Cut the first from the template and trace the other {{ p.cut-1 }} from it, drilling through its holes. Lay it face down to trace canes 3, 5 and 7, and face up for canes 2, 4, 6 and 8, whose hooks point the other way: the marker lines then always end up on the back. The bottom 5 cm of the stem goes into the slot of the printed cane base with its aluminium stiffener: drill the two tie holes through the base's holes once it's printed.</p>
              <p v-else-if="p.kind==='star'" class="how">Cut the outer edge and the middle, drill the {{ p.holes }} pixel holes, then two 5 mm holes just above the notch between the two lower points, to tie it into the printed star holder's slot.</p>
              <p class="files">
                <UButton :to="`/outputs/templates/${p.file}.pdf`" external download size="sm" icon="i-lucide-download" label="Full size PDF" color="primary" variant="subtle" />
                <UButton :to="`/outputs/templates/${p.file}-a4.pdf`" external download size="sm" icon="i-lucide-printer" label="A4 pages" color="neutral" variant="subtle" />
              </p>
            </div>
          </article>
        </div>
        <p class="tip">Print at 100% (actual size), never "fit to page", and check the 100 mm bar with a ruler before cutting. The full size PDFs suit a copy shop: the circle is {{ cm(CORO_PROPS[0].w)+4 }} cm wide with its margin, so it needs A0, the others fit on A1. The A4 versions are labelled A1, A2, B1 and so on: trim each page on its grey frame and lay its edge on the next page's red dashed line.</p>
      </section>

      <section class="block">
        <h2>Layout on the sheets</h2>
        <p class="lead">Lay every template so the prop's up-down runs along the flutes: rain drains out of the channels, and the canes and the star are stiff where it counts. With the flutes along the {{ cm(SHEET.h) }} cm side, everything fits on {{ sheetsUsed }} sheets. If yours run along the {{ cm(SHEET.w) }} cm side, turn the layout: one circle per row, with canes in the gaps.</p>
        <div class="sheets">
          <figure v-for="(s,i) in CORO_SHEETS" :key="i" class="sheet glass">
            <CoroSheet :sheet="i" />
            <figcaption><b>Sheet {{ i+1 }}</b> · {{ captions[i] }} · {{ cm(CORO_SHEETS[i].width) }} of {{ cm(SHEET.w) }} cm</figcaption>
          </figure>
        </div>
      </section>

      <section class="block two">
        <div class="glass card">
          <UIcon name="i-lucide-wrench" class="card-icon" /><h3>Tools</h3>
          <ul class="points">
            <li><b>Stanley FatMax knife</b> with fresh 1992 trapezoid blades. Change the blade after each sheet: a blunt one tears the flutes.</li>
            <li><b>Steel ruler</b> of 60 cm or more.</li>
            <li><b>Drill with the {{ HOLE }} mm step drill</b> (a {{ HOLE }} mm brad-point bit works too), and a 5 mm bit for the tie holes.</li>
            <li><b>Bison spray adhesive</b> for the paper templates.</li>
            <li><b>A scrap board</b> to cut and drill on: old MDF, plywood or thick cardboard.</li>
            <li><b>A fine marker</b> to trace the copies. A jigsaw with a fine blade is optional: every curve here is short.</li>
          </ul>
        </div>
        <div class="glass card">
          <UIcon name="i-lucide-scan-search" class="card-icon" /><h3>Before the first cut</h3>
          <ul class="points">
            <li><b>Find the flute direction</b> on each sheet: look at the edge, the channels run one way.</li>
            <li><b>Test the hole size</b> on an offcut with a pixel you already have. It should click in and hold. Too tight: go up half a step. Loose: use the brad-point bit, which cuts tighter than the step drill's bevel. Settle this before drilling {{ CORO_HOLES }} holes.</li>
            <li><b>Print one template of each prop.</b> The first circle and the first cane become the masters for the copies, so there is no need for {{ CORO_PIECES }} prints.</li>
          </ul>
        </div>
      </section>

      <section class="block">
        <h2>Order of work, for each piece</h2>
        <ol class="cut-steps">
          <li class="glass"><b>Stick the template down.</b> A light coat of spray on the back of the paper, not on the coro. Wait half a minute, lay it on and smooth it from the middle out.</li>
          <li class="glass"><b>Drill all the pixel holes</b> while the piece is still part of the stiff sheet. Straight down through each crosshair at medium speed, with the scrap board underneath.</li>
          <li class="glass"><b>Cut the inside openings</b>, while the sheet round the piece still holds it flat.</li>
          <li class="glass"><b>Cut the outside edge</b> along the edge of the grey band.</li>
          <li class="glass"><b>Peel off the template</b> and wipe off any glue left behind.</li>
          <li class="glass"><b>Mark the back</b> with the prop's name and an arrow at the pixel 1 hole.</li>
        </ol>
        <ul class="points knife">
          <li>Use the ruler on every straight. Along the flutes one firm pass goes through; across them, two or three light passes rather than one hard one.</li>
          <li>The band's edges are straights joined by short arcs round each pixel. Cut the arcs freehand in short strokes, turning the sheet rather than your wrist.</li>
          <li>In inside corners, cut toward the corner from both sides so you never run into the band. Keep the knife upright: a tilted blade leaves a sloped edge that shows in the light.</li>
        </ul>
      </section>

      <section class="block">
        <h2>When the pixels go in</h2>
        <div class="table-wrap glass">
          <table>
            <thead><tr><th>Prop</th><th>Pixel 1</th><th>Pixels without a hole</th><th>Wire to solder in</th></tr></thead>
            <tbody>
              <tr v-for="p in CORO_PROPS" :key="p.kind">
                <td>{{ p.title }}</td>
                <td>{{ p.start }}</td>
                <td><template v-if="p.hidden.length">{{ list(p.hidden.map(h=>String(h.pixel))) }}</template><template v-else>none</template></td>
                <td><template v-if="p.extensions.length">{{ list(p.extensions.map(e=>`about ${e.add} cm from pixel ${e.from} to ${e.to}`)) }}</template><template v-else>none</template></td>
              </tr>
            </tbody>
          </table>
        </div>
        <ul class="points">
          <li><b>Pixel 1</b> follows the 3D model, as seen from the front. Mark it on the back now, so the data order matches the model later.</li>
          <li><b>Pixels without a hole</b> share a spot with an earlier pixel in the model. They stay on the string, tucked behind the board: the prop must still carry its full pixel count, or every prop after it on the port lights the wrong pixels.</li>
          <li><b>Wire to solder in</b> is where two lit pixels sit further apart than the string's {{ PITCH*100 }} cm allows. Cut the string and add a short piece of 3-core wire. The peace sign needs none: its pixels without a hole give the string the slack it needs.</li>
        </ul>
      </section>
    </main>
  </div>
</template>

<style scoped>
.intro .actions{display:flex;flex-wrap:wrap;gap:10px;margin-top:18px}
.intro p+p{margin-top:0}
.kpis-row{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin:18px 0 30px}
.kpis-row>div{padding:16px 18px;display:flex;flex-direction:column;gap:2px}
.kpis-row b{font-family:var(--font-display);font-size:28px;font-weight:500;color:var(--gold);font-variant-numeric:tabular-nums}
.kpis-row span{font-size:12px;color:#a3b3c3}
.block{margin-bottom:34px;scroll-margin-top:80px}
.lead{color:#a3b3c3;font-size:13.5px;line-height:1.7;max-width:820px;margin:0 0 14px}
.prop-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin-top:12px}
.prop{display:grid;grid-template-columns:170px minmax(0,1fr);gap:16px;padding:14px;scroll-margin-top:80px}
.preview{display:flex;align-items:center;justify-content:center;aspect-ratio:3/4;align-self:start;border-radius:12px;border:1px solid #ffffff12;background:radial-gradient(ellipse at 50% 35%,#1d2c44,#0d1626);padding:12px}
.preview svg{width:100%;height:100%}
.band{fill:none;stroke:#e8e6df;stroke-linecap:round;stroke-linejoin:round}
.band-dot{fill:#e8e6df}
.hole{fill:#0d1626;stroke:var(--gold);stroke-width:3}
.prop-body h3{display:flex;align-items:center;gap:8px;margin:2px 0 4px}
.qty{font-size:12px;color:#a3b3c3;margin:0 0 8px}
.qty b{color:var(--gold);font-weight:600}
.prop dl{display:flex;flex-direction:column;gap:3px;margin:0 0 8px;font-size:12px}
.prop dt{display:inline;color:#8397a9;margin-right:6px}
.prop dd{display:inline;margin:0;color:#d6dfe6}
.how{font-size:12px;line-height:1.6;color:#a3b3c3;margin:0 0 10px}
.files{display:flex;flex-wrap:wrap;gap:8px;margin:0}
.tip{font-size:12px;line-height:1.6;color:#8397a9;margin:12px 0 0;max-width:900px}
.sheets{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}
.sheet{margin:0;padding:12px}
.guide-files{display:flex;flex-wrap:wrap;gap:8px 18px;font-size:12.5px;color:#a3b3c3}
.guide-file{display:inline-flex;gap:8px;align-items:baseline}
.guide-file b{color:#e3e9ee;font-weight:600}
.guide-file a{color:var(--gold-soft);text-decoration:underline;text-underline-offset:3px}
.guide-sheet{margin:0;max-width:640px}
.guide-sheet figcaption{display:flex;flex-wrap:wrap;align-items:center;gap:4px 8px;font-size:11.5px;color:#8397a9;margin-top:6px}
.key{display:inline-block;width:10px;height:10px;border-radius:3px}
.key.focus{background:#f0c49a}.key.cut{background:#7fd0a080}.key.later{background:#e8e6df47}
.sheet figcaption{font-size:12px;color:#a3b3c3;margin-top:8px}
.sheet figcaption b{color:#e3e9ee;font-weight:600}
.two{display:grid;grid-template-columns:repeat(2,1fr);gap:12px}
.card{padding:18px 20px}
.points{margin:6px 0 12px;padding-left:18px;list-style:disc;color:#a3b3c3;font-size:13px;line-height:1.6;max-width:820px}
.points li{margin:4px 0}
.points li::marker{color:var(--gold-soft)}
.points b{color:#e3e9ee;font-weight:600}
.cut-steps{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin:12px 0 14px;padding:0;list-style:none;counter-reset:step}
.cut-steps li{counter-increment:step;padding:16px 18px 16px 52px;position:relative;font-size:13px;line-height:1.6;color:#a3b3c3}
.cut-steps li::before{content:counter(step);position:absolute;left:16px;top:14px;width:26px;height:26px;border-radius:50%;display:grid;place-items:center;font-family:var(--font-display);font-size:15px;color:#0d1626;background:var(--gold)}
.cut-steps b{color:#e3e9ee;font-weight:600}
.table-wrap{padding:6px 16px;margin:12px 0;overflow-x:auto}
.table-wrap td:first-child{color:#e3e9ee;white-space:nowrap}
@media (max-width:980px){
  .kpis-row{grid-template-columns:repeat(2,1fr)}
  .prop-grid,.two{grid-template-columns:1fr}
  .sheets{grid-template-columns:1fr}
  .cut-steps{grid-template-columns:1fr 1fr}
}
@media (max-width:620px){
  .prop{grid-template-columns:110px minmax(0,1fr);gap:12px}
  .cut-steps{grid-template-columns:1fr}
  .table-wrap table{min-width:560px}
}
</style>
