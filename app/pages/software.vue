<script setup>
import {CUE,SHOW_SECONDS,FSEQ_FPS,FSEQ_FRAMES,FSEQ_MB,CONTROLLERS,TOTAL_CHANNELS,UNIVERSES} from '~~/src/software/plan.js';
import {WIRE_COLORS} from '~~/src/wiring/plan.js';

// The show software: one diagram of how the devices talk during the show, what
// runs where, and how the detected 3-minute show becomes a sequence Falcon
// Player can play on the real controllers. Hardware numbers come from the
// wiring plan; the conversion is still a proposal and the page says so.
definePageMeta({alias:['/software.html']});
const n=v=>v.toLocaleString('en');
const mmss=s=>`${Math.floor(s/60)}:${String(Math.round(s%60)).padStart(2,'0')}`;
const [facade,garden]=CONTROLLERS;
const C={data:WIRE_COLORS.network,audio:'#b48cff',setup:'#8397a9'};

// Diagram geometry: setup devices on the left, the garage in the middle, the
// street and the garden box on the right.
const W=1160,ROW=21;
const LAPTOP={x:24,y:52,w:220,h:122},CLOUD={x:24,y:236,w:220,h:112},ROUTER={x:24,y:410,w:220,h:104};
const GARAGE={x:276,y:20,w:572,h:560};
const PI={x:298,y:58,w:240,h:196},SWITCH={x:298,y:304,w:240,h:62};
const SOUND={x:574,y:58,w:252,h:58},FM={x:574,y:150,w:252,h:74};
const FACADE={x:574,y:290,w:252,h:92+facade.ports.length*ROW};
const STREET={x:872,y:52,w:266,h:150},YARD={x:872,y:262,w:266,h:136+garden.ports.length*ROW};
const GARDEN={x:886,y:YARD.y+32,w:238,h:92+garden.ports.length*ROW};
const H=GARAGE.y+GARAGE.h+20;
const r=b=>({x:b.x,y:b.y,width:b.w,height:b.h});
const curve=(x1,y1,x2,y2)=>{const m=(x1+x2)/2;return `M${x1},${y1} C${m},${y1} ${m},${y2} ${x2},${y2}`;};
const toGarden=`M${SWITCH.x+80},${SWITCH.y+SWITCH.h} V${H-46} H${GARDEN.x-30} V${GARDEN.y+40} H${GARDEN.x}`;
const portRows=(ctrl,box)=>ctrl.ports.map((p,i)=>({...p,y:box.y+70+i*ROW}));

const STATUS={done:'Done',bought:'Bought',decided:'Decided',proposal:'Proposal',open:'To decide'};
const SERVICES=[
 {device:'Raspberry Pi 5 (the spare one at hand)',where:'Garage, next to the facade board',software:'Falcon Player (FPP)',job:'Plays the sequence and the music together, sends every pixel\'s colour to both controllers 40 times a second, and starts the show on its evening schedule. Its web page is where it is set up.',status:'decided'},
 {device:'Facade controller, Baldrick 8',where:'Garage wall board',software:'Baldrick firmware',job:`Takes its block of ${n(facade.channels)} channels off the network and drives ${facade.ports.length} pixel ports (${n(facade.pixels)} pixels). Port lengths and colour order are set on its own web page.`,status:'bought'},
 {device:'Garden controller, Baldrick 8',where:'IP66 box behind the front-left bush',software:'Baldrick firmware',job:`The same for the garden: ${n(garden.channels)} channels, ${garden.ports.length} ports, ${n(garden.pixels)} pixels.`,status:'bought'},
 {device:'5-port switch',where:'Garage',software:'None',job:'Joins the Pi and both controllers on one wired network: a patch cable to the facade controller, 15 m of outdoor Cat5e to the garden box.',status:'decided'},
 {device:'USB sound card and FM transmitter',where:'Garage, street side',software:'None (the Pi\'s audio output)',job:'Carries the music from the Pi to car radios on the street.',status:'bought'},
 {device:'Laptop',where:'Anywhere at home',software:'A browser, the export script, xLights if wanted',job:'Setup only: makes the sequence, uploads it to the Pi and sets up the controllers. Not needed on show nights.',status:'proposal'},
 {device:'Home router',where:'House',software:'DHCP and internet time',job:'Fixed addresses for the Pi and the controllers, the clock the schedule runs on, and the way in from the laptop.',status:'open'},
 {device:'Winterlight site',where:'Cloudflare',software:'Static pages, a Worker and a D1 database',job:'The 3D preview of the show, the cue file and the runbook. Nothing in the garage talks to it during the show.',status:'done'},
];

const STEPS=[
 {status:'done',icon:'i-lucide-scan-eye',title:'Detected cues',text:`The cue file the site plays: ${CUE.channels} channels × ${n(CUE.frames)} video frames at 29.97 fps, ${mmss(SHOW_SECONDS)} of show. For each frame a channel has a colour (off, on, or yellow, blue or both on the two-colour strips) and a brightness in 5% steps.`},
 {status:'proposal',icon:'i-lucide-git-fork',title:'Channels to pixels',text:'Each channel lights its own pixels: src/props.js says which bulbs, the wiring plan their order on each port. A pixel\'s red, green and blue are its bulb colour times the channel\'s brightness; on the two-colour strips the yellow bulbs follow yellow, the blue ones blue, both follow both.'},
 {status:'proposal',icon:'i-lucide-timer',title:`Resample to ${FSEQ_FPS} fps`,text:`Falcon Player's frames are whole milliseconds, so the video's 33.37 ms frames can't be kept. Every ${1000/FSEQ_FPS} ms output frame shows the video frame on screen at that moment, never more than one frame off. ${FSEQ_FPS} fps also fits the Baldrick's ports.`},
 {status:'proposal',icon:'i-lucide-file-cog',title:'Write show.fseq',text:`One Node script in the repo (tools/fseq/export.mjs) that reads the same files the site does and writes Falcon Player's sequence: ${n(TOTAL_CHANNELS)} channels × ${n(FSEQ_FRAMES)} frames, about ${FSEQ_MB} MB before compression and far less after.`},
 {status:'proposal',icon:'i-lucide-music',title:'The music',text:'The site\'s soundtrack was taken from the same video, so second 0 of the audio is frame 0 of the cues. Converted to MP3 it plays on the Pi, and Falcon Player keeps the lights on the music\'s clock.'},
 {status:'decided',icon:'i-lucide-calendar-clock',title:'Playlist and schedule',text:'Upload show.fseq and the MP3 in Falcon Player\'s web page, put them in a playlist and schedule it for the evenings. These steps are already in the runbook\'s software chapter.'},
];

const OPEN=[
 {title:'The converter',text:'A script that writes the sequence directly (recommended above), or one that writes an xLights sequence for xLights to render. The xLights way lets you tweak effects by hand, but it needs a second layout of all 56 props kept in step with the model, and what xLights renders may not match the site. Either way the runbook\'s xLights steps become optional.'},
 {title:'DDP or E1.31',text:`The Baldrick takes both. DDP sends each controller one block of channels; E1.31 would need ${UNIVERSES} universes of 170 pixels set up on both ends. Proposal: DDP.`},
 {title:'How the switch reaches the house network',text:'The laptop needs to reach the Pi, and the Pi needs the time for its schedule. Either the switch gets a cable to the router, or the Pi joins the home Wi-Fi and keeps its Ethernet for the show. Not decided yet.'},
 {title:'IP addresses',text:'Three fixed addresses, for the Pi and the two controllers, reserved on the router. The runbook step is still open.'},
 {title:'Brightness on real pixels',text:'The cue levels are what the camera saw. Real pixels will likely need a gamma curve and an overall brightness limit, tuned at the test run in Falcon Player or in the export.'},
];
const ROUTE=[
 'Only one place describes the props: the export reads the same layout and wiring the site and the cost page use, so a prop that changes there changes in the sequence.',
 'What plays on the house is what plays on the site. A test can check sample frames of the sequence against the site\'s player.',
 'Because every pixel of a single-colour prop shows the same thing, the tree strands and mini-tree spokes that are wired up one and down the next need no reversing in the file; only the two-colour strips care about pixel order, and the controller can reverse a whole port.',
 'Colour order (RGB or GRB, found at the bench test) is set per port on the controllers, so the file stays plain RGB.',
];

const SITE='https://winterlight.alexander-df0.workers.dev';
const TITLE='Winterlight · Show software';
const DESCRIPTION='How the software side of the Winterlight show works: Falcon Player on a Raspberry Pi sending pixel data to two Baldrick 8 controllers, the music to an FM transmitter, and how the detected 3-minute show becomes a sequence the controllers can play.';
useHead({title:TITLE,link:[{rel:'canonical',href:`${SITE}/software.html`}],bodyAttrs:{class:'software-page'}});
useSeoMeta({description:DESCRIPTION,ogType:'website',ogSiteName:'Winterlight',ogLocale:'en_GB',ogTitle:TITLE,ogDescription:DESCRIPTION,ogUrl:`${SITE}/software.html`,
 ogImage:`${SITE}/og-image.jpg`,ogImageType:'image/jpeg',ogImageWidth:1200,ogImageHeight:630,ogImageAlt:'3D model of a house with a wireframe Christmas tree, a peace sign, Christmas circles and HAPPY HOLIDAYS letters lit up',
 twitterCard:'summary_large_image',twitterTitle:TITLE,twitterDescription:DESCRIPTION,twitterImage:`${SITE}/og-image.jpg`});
</script>

<template>
  <div class="costs-shell">
    <FestiveSky />
    <AppHeader />
    <main class="costs software">
      <section class="intro">
        <h1>Show software</h1>
        <p>During the show a Raspberry Pi in the garage runs Falcon Player. It plays the music and, {{ FSEQ_FPS }} times a second, sends the colour of all {{ n(TOTAL_CHANNELS/3) }} pixels over the network to the two Baldrick 8 controllers, which drive the pixel strings.
          The music goes out to car radios through an FM transmitter. The hardware below is what was ordered and wired (see the <a href="/wiring.html">wiring plan</a>); how the {{ mmss(SHOW_SECONDS) }} show on this site becomes a file the Pi can play is still a <b class="tag proposal">proposal</b>.</p>
      </section>

      <section class="diagram glass" aria-label="Data diagram">
        <div class="legend">
          <span><i class="swatch-line" :style="{background:C.data}" /> Show data (wired network)</span>
          <span><i class="swatch-line" :style="{background:C.audio}" /> Music</span>
          <span><i class="swatch-line dashed" :style="{color:C.setup}" /> Setup only, not needed during the show</span>
        </div>
        <div class="diagram-scroll">
          <svg id="software-diagram" :viewBox="`0 0 ${W} ${H}`" role="img" aria-labelledby="sw-title">
            <title id="sw-title">Data diagram: the laptop, home router and website for setup; in the garage the Raspberry Pi with Falcon Player, the switch, the facade controller and the sound card with FM transmitter; outdoors the garden controller and car radios on the street</title>
            <rect v-bind="r(GARAGE)" rx="18" class="garage" />
            <text :x="GARAGE.x+16" :y="GARAGE.y+24" class="t-room">GARAGE</text>
            <rect v-bind="r(STREET)" rx="18" class="street" />
            <text :x="STREET.x+16" :y="STREET.y+24" class="t-room street-label">STREET</text>
            <rect v-bind="r(YARD)" rx="18" class="yard" />
            <text :x="YARD.x+16" :y="YARD.y+22" class="t-room yard-label">GARDEN · IP66 BOX</text>

            <!-- links, drawn under the cards -->
            <path :d="curve(LAPTOP.x+LAPTOP.w/2,LAPTOP.y+LAPTOP.h,CLOUD.x+CLOUD.w/2,CLOUD.y)" :stroke="C.setup" class="wire dashed" />
            <text :x="LAPTOP.x+LAPTOP.w/2+8" :y="CLOUD.y-20" class="t-wire" :fill="C.setup">cue file, model</text>
            <path :d="`M${LAPTOP.x+LAPTOP.w},${LAPTOP.y+90} C${LAPTOP.x+LAPTOP.w+18},${LAPTOP.y+90} ${LAPTOP.x+LAPTOP.w+18},${ROUTER.y+30} ${ROUTER.x+ROUTER.w},${ROUTER.y+30}`" :stroke="C.setup" class="wire dashed" />
            <text :x="LAPTOP.x+LAPTOP.w+22" :y="(LAPTOP.y+ROUTER.y)/2+50" class="t-wire" :fill="C.setup">Wi-Fi</text>
            <path :d="curve(ROUTER.x+ROUTER.w,ROUTER.y+70,SWITCH.x,SWITCH.y+40)" :stroke="C.setup" class="wire dashed" />
            <text :x="ROUTER.x+ROUTER.w+12" :y="ROUTER.y+92" class="t-wire" :fill="C.setup">uplink, to decide</text>
            <path :d="`M${SWITCH.x+120},${PI.y+PI.h} V${SWITCH.y}`" :stroke="C.data" class="wire" />
            <text :x="SWITCH.x+130" :y="PI.y+PI.h+30" class="t-wire" :fill="C.data">Ethernet</text>
            <path :d="curve(SWITCH.x+SWITCH.w,SWITCH.y+30,FACADE.x,FACADE.y+40)" :stroke="C.data" class="wire" />
            <text :x="SWITCH.x+SWITCH.w+6" :y="SWITCH.y+56" class="t-wire" :fill="C.data">patch</text>
            <path :d="toGarden" :stroke="C.data" class="wire" />
            <text :x="(SWITCH.x+GARDEN.x)/2+60" :y="H-54" class="t-wire" :fill="C.data" text-anchor="middle">15 m outdoor Cat5e, out through the jamb · DDP</text>
            <path :d="`M${PI.x+PI.w},${SOUND.y+30} H${SOUND.x}`" :stroke="C.audio" class="wire" />
            <text :x="PI.x+PI.w+6" :y="SOUND.y+24" class="t-wire" :fill="C.audio">USB</text>
            <path :d="`M${SOUND.x+60},${SOUND.y+SOUND.h} V${FM.y}`" :stroke="C.audio" class="wire" />
            <text :x="SOUND.x+68" :y="FM.y-10" class="t-wire" :fill="C.audio">3.5 mm</text>
            <path :d="curve(FM.x+FM.w,FM.y+36,STREET.x+30,STREET.y+104)" :stroke="C.audio" class="wire dashed-short" />
            <text :x="FM.x+FM.w+10" :y="FM.y+60" class="t-wire" :fill="C.audio">FM</text>

            <g>
              <rect v-bind="r(LAPTOP)" rx="14" class="card setup" />
              <text :x="LAPTOP.x+16" :y="LAPTOP.y+28" class="t-title">Laptop</text>
              <text :x="LAPTOP.x+16" :y="LAPTOP.y+44" class="t-dim">setup only</text>
              <text :x="LAPTOP.x+16" :y="LAPTOP.y+68" class="t-body">Export script → show.fseq</text>
              <text :x="LAPTOP.x+16" :y="LAPTOP.y+88" class="t-body">Browser: FPP and Baldrick pages</text>
              <text :x="LAPTOP.x+16" :y="LAPTOP.y+108" class="t-dim">xLights, optional</text>
            </g>
            <g>
              <rect v-bind="r(CLOUD)" rx="14" class="card setup" />
              <text :x="CLOUD.x+16" :y="CLOUD.y+28" class="t-title">Winterlight site</text>
              <text :x="CLOUD.x+16" :y="CLOUD.y+44" class="t-dim">Cloudflare</text>
              <text :x="CLOUD.x+16" :y="CLOUD.y+68" class="t-body">3D preview of the show</text>
              <text :x="CLOUD.x+16" :y="CLOUD.y+88" class="t-body">Cue file, runbook</text>
            </g>
            <g>
              <rect v-bind="r(ROUTER)" rx="14" class="card setup" />
              <text :x="ROUTER.x+16" :y="ROUTER.y+28" class="t-title">Home router</text>
              <text :x="ROUTER.x+16" :y="ROUTER.y+52" class="t-body">Fixed IPs for Pi and controllers</text>
              <text :x="ROUTER.x+16" :y="ROUTER.y+72" class="t-body">Internet time for the schedule</text>
            </g>

            <g>
              <rect v-bind="r(PI)" rx="14" class="card pi" />
              <text :x="PI.x+16" :y="PI.y+28" class="t-title">Raspberry Pi 5</text>
              <text :x="PI.x+16" :y="PI.y+44" class="t-dim">Falcon Player (FPP)</text>
              <text :x="PI.x+16" :y="PI.y+72" class="t-body">Scheduler: evenings</text>
              <text :x="PI.x+16" :y="PI.y+94" class="t-body">Player: show.fseq + show.mp3</text>
              <text :x="PI.x+16" :y="PI.y+116" class="t-body">Output: DDP, {{ FSEQ_FPS }} frames a second</text>
              <text :x="PI.x+16" :y="PI.y+138" class="t-body">{{ n(TOTAL_CHANNELS) }} channels per frame</text>
              <text :x="PI.x+16" :y="PI.y+164" class="t-dim">Web page for setup and uploads</text>
            </g>
            <g>
              <rect v-bind="r(SWITCH)" rx="12" class="card" />
              <text :x="SWITCH.x+16" :y="SWITCH.y+26" class="t-title">5-port switch</text>
              <text :x="SWITCH.x+16" :y="SWITCH.y+44" class="t-dim">wired show network</text>
            </g>
            <g>
              <rect v-bind="r(SOUND)" rx="12" class="card" />
              <text :x="SOUND.x+16" :y="SOUND.y+24" class="t-title">USB sound card</text>
              <text :x="SOUND.x+16" :y="SOUND.y+42" class="t-dim">audio out of the Pi</text>
            </g>
            <g>
              <rect v-bind="r(FM)" rx="12" class="card" />
              <text :x="FM.x+16" :y="FM.y+24" class="t-title">FM transmitter</text>
              <text :x="FM.x+16" :y="FM.y+42" class="t-dim">on 12 V from a Mean Well</text>
              <text :x="FM.x+16" :y="FM.y+60" class="t-dim">street side, out of any metal box</text>
            </g>
            <g>
              <text :x="STREET.x+20" :y="STREET.y+84" class="t-body">Car radios on a free</text>
              <text :x="STREET.x+20" :y="STREET.y+102" class="t-body">FM frequency</text>
              <text :x="STREET.x+20" :y="STREET.y+122" class="t-dim">visitors hear the music</text>
            </g>

            <g v-for="[ctrl,box] in [[facade,FACADE],[garden,GARDEN]]" :key="ctrl.id">
              <rect v-bind="r(box)" rx="14" class="card ctrl" />
              <text :x="box.x+16" :y="box.y+26" class="t-title">{{ ctrl.name }}</text>
              <text :x="box.x+16" :y="box.y+42" class="t-dim">Baldrick 8 · channels {{ n(ctrl.start) }}–{{ n(ctrl.end) }}</text>
              <g v-for="p in portRows(ctrl,box)" :key="p.n">
                <circle :cx="box.x+22" :cy="p.y-4" r="4.5" :fill="p.color" />
                <text :x="box.x+34" :y="p.y" class="t-port">{{ p.n }} · {{ p.name }}</text>
                <text :x="box.x+box.w-14" :y="p.y" class="t-dim" text-anchor="end">{{ p.pixels }} px</text>
              </g>
              <text :x="box.x+16" :y="box.y+box.h-12" class="t-dim">{{ ctrl.outdoor?'chains run along the ground strip':'chains leave through the jamb' }}</text>
            </g>
          </svg>
        </div>
        <p class="note scroll-hint">Scroll sideways to see the whole diagram.</p>
      </section>

      <div class="wiring-kpis">
        <div class="glass"><b>{{ CONTROLLERS.length }}</b><span>controllers on the network</span></div>
        <div class="glass"><b>{{ n(TOTAL_CHANNELS) }}</b><span>channels a frame (3 per pixel)</span></div>
        <div class="glass"><b>{{ FSEQ_FPS }} fps</b><span>show sequence, proposed</span></div>
        <div class="glass"><b>{{ mmss(SHOW_SECONDS) }}</b><span>show length</span></div>
      </div>

      <section class="glass box-card">
        <h2>What runs where</h2>
        <div class="table-scroll">
          <table class="services">
            <thead><tr><th>Device</th><th>Software</th><th>What it does</th><th>Status</th></tr></thead>
            <tbody>
              <tr v-for="s in SERVICES" :key="s.device">
                <td>{{ s.device }}<small>{{ s.where }}</small></td>
                <td>{{ s.software }}</td>
                <td>{{ s.job }}</td>
                <td><span class="tag" :class="s.status">{{ STATUS[s.status] }}</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section class="pipeline-head">
        <h2>From the simulation to the controllers</h2>
        <p class="lead">The show on this site is not a video: it is the detected cue file, played on the 3D model. The plan is to turn that same file into Falcon Player's sequence format (.fseq), which holds every pixel's colour for every frame, and play it with the music. Only the first step exists today.</p>
      </section>
      <ol class="pipeline">
        <li v-for="(s,i) in STEPS" :key="s.title" class="glass">
          <div class="step-top"><span class="step-n">{{ i+1 }}</span><UIcon :name="s.icon" class="card-icon" /><span class="tag" :class="s.status">{{ STATUS[s.status] }}</span></div>
          <h3>{{ s.title }}</h3>
          <p>{{ s.text }}</p>
        </li>
      </ol>

      <section class="glass box-card">
        <h2>Where each pixel lands</h2>
        <p class="led">The sequence numbers its channels in wiring order: the facade controller first, then the garden one, each port's chain in data order. Falcon Player gets two outputs, one per controller IP, each with its own block; each controller maps its block onto its ports. <span class="tag proposal">Proposal</span></p>
        <div class="table-scroll">
          <table class="map">
            <thead><tr><th>Controller</th><th>Port</th><th>Chain</th><th class="num">Pixels</th><th class="num">Channels</th></tr></thead>
            <tbody>
              <template v-for="c in CONTROLLERS" :key="c.id">
                <tr v-for="(p,i) in c.ports" :key="`${c.id}${p.n}`">
                  <td>{{ i?'':c.name }}</td>
                  <td><i class="port-dot" :style="{background:p.color}" /> {{ p.n }}</td>
                  <td>{{ p.name }}<small v-if="p.props>1">{{ p.props }} props</small></td>
                  <td class="num">{{ p.pixels }}</td>
                  <td class="num">{{ n(p.start) }}–{{ n(p.end) }}</td>
                </tr>
              </template>
            </tbody>
          </table>
        </div>
      </section>

      <section class="wiring-notes">
        <div class="glass"><UIcon name="i-lucide-route" class="card-icon" /><h3>Why write the sequence straight from the model</h3>
          <ul><li v-for="r in ROUTE" :key="r">{{ r }}</li></ul></div>
        <div class="glass"><UIcon name="i-lucide-circle-help" class="card-icon" /><h3>Still to decide</h3>
          <dl><template v-for="o in OPEN" :key="o.title"><dt>{{ o.title }}</dt><dd>{{ o.text }}</dd></template></dl></div>
      </section>
    </main>
  </div>
</template>

<style scoped>
.intro a{color:var(--gold-soft);text-decoration:underline;text-underline-offset:3px}
.diagram{margin-top:30px;padding:18px 18px 8px}
.legend{display:flex;flex-wrap:wrap;gap:8px 20px;font-size:12px;color:#a3b3c3;margin:0 4px 12px}
.legend span{display:inline-flex;align-items:center;gap:8px}
.swatch-line{display:inline-block;width:22px;height:3px;border-radius:2px}
.swatch-line.dashed{height:0;border-top:3px dashed currentColor}
.diagram-scroll{overflow-x:auto;scrollbar-width:thin}
.diagram-scroll svg{display:block;width:100%;min-width:1040px;height:auto;font-family:var(--font-sans)}
.scroll-hint{display:none;font-size:12px;color:#8397a9}
.card{fill:#0f1a2c;stroke:#ffffff1f}
.card.setup{fill:#0d1626;stroke:#8397a955;stroke-dasharray:5 4}
.card.pi{stroke:#efc19777}
.card.ctrl{fill:#14233a;stroke:#5ec8f055}
.garage{fill:#ffffff05;stroke:#efc19755;stroke-dasharray:6 5}
.yard{fill:#7ee08105;stroke:#7ee08155;stroke-dasharray:6 5}
.street{fill:#b48cff06;stroke:#b48cff55;stroke-dasharray:6 5}
.yard-label{fill:#9fdca2}
.street-label{fill:#c9b2ff}
.wire{fill:none;stroke-width:2.2}
.wire.dashed{stroke-dasharray:6 5}
.wire.dashed-short{stroke-dasharray:3 4}
.t-room{font-size:11px;letter-spacing:2px;font-weight:700;fill:#e3bd8f}
.t-title{font-size:16px;font-weight:600;fill:#fbf4e8}
.t-body{font-size:12.5px;fill:#d6dfe6}
.t-port{font-size:12px;fill:#d6dfe6}
.t-dim{font-size:11px;fill:#8397a9}
.t-wire{font-size:11px;font-weight:500;stroke:#0d1626;stroke-width:5px;paint-order:stroke;stroke-linejoin:round}
.tag{display:inline-block;font-size:10px;font-weight:600;letter-spacing:.5px;text-transform:uppercase;padding:2px 8px;border-radius:99px;white-space:nowrap;border:1px solid currentColor}
.tag.done,.tag.bought{color:#7ee081}
.tag.decided{color:#5ec8f0}
.tag.proposal{color:#f6c75a}
.tag.open{color:#ff8fb1}
.wiring-kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin:18px 0}
.wiring-kpis>div{padding:16px 18px;display:flex;flex-direction:column;gap:2px}
.wiring-kpis b{font-family:var(--font-display);font-size:28px;font-weight:500;color:var(--gold);font-variant-numeric:tabular-nums}
.wiring-kpis span{font-size:12px;color:#a3b3c3}
.box-card{padding:20px 22px;margin-bottom:14px}
.box-card .led{margin:0 0 12px;font-size:13px;line-height:1.7;color:#a3b3c3;max-width:820px}
.table-scroll{overflow-x:auto}
.services{min-width:720px}
.services td:nth-child(3){color:#a3b3c3;line-height:1.6}
.map{min-width:520px}
.map th.num{text-align:right}
.costs td small{display:block;color:#8397a9;font-size:11px;margin-top:3px}
.port-dot{display:inline-block;width:9px;height:9px;border-radius:50%;margin-right:4px}
.pipeline-head{margin:34px 0 14px}
.pipeline-head .lead{font-size:14px;line-height:1.75;color:#a3b3c3;max-width:820px;margin:0}
.pipeline{list-style:none;padding:0;margin:0 0 18px;display:grid;grid-template-columns:repeat(3,1fr);gap:12px}
.pipeline li{padding:16px 18px}
.pipeline p{font-size:13px;line-height:1.7;color:#a3b3c3;margin:0}
.step-top{display:flex;align-items:center;gap:10px;margin-bottom:8px}
.step-top .tag{margin-left:auto}
.step-n{display:grid;place-items:center;width:24px;height:24px;border-radius:50%;font-size:12px;font-weight:700;color:#10141c;background:var(--gold)}
.card-icon{color:var(--gold);width:20px;height:20px}
.wiring-notes{display:grid;grid-template-columns:repeat(2,1fr);gap:12px;margin-top:18px}
.wiring-notes>div{padding:18px 20px}
.wiring-notes .card-icon{margin-bottom:8px}
.wiring-notes ul{margin:0;padding-left:18px;font-size:13px;line-height:1.7;color:#a3b3c3}
.wiring-notes li+li{margin-top:6px}
.wiring-notes dl{margin:0;font-size:13px;line-height:1.7}
.wiring-notes dt{color:#e3e9ee;font-weight:600;margin-top:10px}
.wiring-notes dt:first-child{margin-top:0}
.wiring-notes dd{margin:0;color:#a3b3c3}
@media (max-width:1000px){.scroll-hint{display:block}.pipeline{grid-template-columns:repeat(2,1fr)}}
@media (max-width:720px){.wiring-kpis{grid-template-columns:repeat(2,1fr)}.pipeline,.wiring-notes{grid-template-columns:1fr}.diagram{padding:14px 12px 4px}}
</style>
