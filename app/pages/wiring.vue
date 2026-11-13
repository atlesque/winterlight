<script setup>
import {WIRING,WIRE_COLORS,LONGEST_RUN} from '~~/src/wiring/plan.js';

// The wiring plan: one diagram of how the full show is connected, from the
// garage, where the facade box and the show computer sit, and the garden box
// outdoors, to every prop, and a table per controller. Everything comes
// from src/wiring/plan.js, which reads the cost model.
definePageMeta({alias:['/wiring.html']});
const {hub,zones,parts}=WIRING;
const pct=v=>`${Math.round(v*100)}%`;
const W=1180,RH=58,TOP=50,GAP=28,HEAD=56;
// Short chip labels: the letter, the tree or strand number, a star for the tree star.
const short=(port,p)=>port.props.length===1?port.name:p.name.includes('·')?p.name.split('·').pop().trim():p.name.endsWith('star')?'★':p.name.split(' ').pop();

// Diagram geometry: the garage on the left (show computer, then a block per box with its power
// supplies and controller), and outside its wall one row per controller port
// with the chain of props drawn to scale against the port's pixel limit.
const BOX={x:340,w:300},CTRL={x:504,w:120},PSU={x:356,w:136},TRACK={x:680,w:W-680-16};
let y=TOP;
const blocks=zones.map(z=>{
 if(z.outdoor)y+=44;
 const h=HEAD+z.ports.length*RH+14,top=y;y+=h+GAP;
 const rows=z.ports.map((port,i)=>{
  const ry=top+HEAD+i*RH,scale=TRACK.w/parts.portPixels;let x=TRACK.x;
  const chips=port.props.map(p=>{const w=p.pixels*scale,c={x,w,label:short(port,p),title:`${p.name}: ${p.pixels} pixels, ${p.run} m of cable from the ${p===port.props[0]?'box':'previous prop'}`};x+=w;return c;});
  return {port,y:ry,pin:ry+38,chips,injections:port.injections.map(j=>({x:TRACK.x+j.at*scale,title:`Power injection at pixel ${j.at} (${j.prop}), fed from power supply ${j.psu}`}))};
 });
 const psuH=40,psus=z.psus.map((s,i)=>({...s,y:top+HEAD+i*(psuH+12),h:psuH}));
 return {z,top,h,rows,psus,ctrl:{y:top+HEAD-6,h:z.ports.length*RH+2}};
});
const H=y-GAP+20;
// The garage holds the show computer and the indoor boxes; an outdoor box gets its own outline.
const inside=blocks.filter(b=>!b.z.outdoor),outside=blocks.filter(b=>b.z.outdoor);
const garageBottom=inside.length?inside.at(-1).top+inside.at(-1).h+12:H-8;
const GARAGE={x:8,y:8,w:BOX.x+BOX.w+16-8,h:garageBottom-8},HUB={x:24,w:210,y:Math.max(TOP,(8+garageBottom)/2-78),h:156};
const yards=outside.map(b=>({x:BOX.x-16,y:b.top-26,w:BOX.w+32,h:b.h+38}));
const curve=(x1,y1,x2,y2)=>{const m=(x1+x2)/2;return `M${x1},${y1} C${m},${y1} ${m},${y2} ${x2},${y2}`;};
const links=blocks.flatMap(b=>[
 {d:curve(HUB.x+HUB.w,HUB.y+64,BOX.x,b.top+30),color:WIRE_COLORS.network,label:b.z.outdoor?'Outdoor network cable':'Patch cable',lx:BOX.x-8,ly:b.top+24},
 ...b.psus.map(s=>({d:curve(HUB.x+HUB.w,HUB.y+112,PSU.x,s.y+s.h/2),color:WIRE_COLORS.mains,dash:'5 4'})),
]);
const mainsLabels=blocks.map(b=>({x:BOX.x-8,y:b.psus.at(-1).y+b.psus.at(-1).h+16,text:b.z.outdoor?'Outdoor mains cable':'Power strip'}));

const totals={ports:zones.reduce((s,z)=>s+z.ports.length,0),injections:zones.reduce((s,z)=>s+z.ports.reduce((t,p)=>t+p.injections.length,0),0),
 cable:zones.reduce((s,z)=>s+z.ports.reduce((t,p)=>t+p.cable,0),0),psus:zones.reduce((s,z)=>s+z.psus.length,0)};

const SITE='https://winterlight.alexander-df0.workers.dev';
const TITLE='Winterlight · Wiring plan';
const DESCRIPTION='How the Winterlight show on our house is wired: the show computer and the facade box in the garage, the garden box outdoors, their power supplies, every controller port and its chain of props, and power injection.';
useHead({title:TITLE,link:[{rel:'canonical',href:`${SITE}/wiring.html`}],bodyAttrs:{class:'wiring-page'}});
useSeoMeta({description:DESCRIPTION,ogType:'website',ogSiteName:'Winterlight',ogLocale:'en_GB',ogTitle:TITLE,ogDescription:DESCRIPTION,ogUrl:`${SITE}/wiring.html`,
 ogImage:`${SITE}/og-image.jpg`,ogImageType:'image/jpeg',ogImageWidth:1200,ogImageHeight:630,ogImageAlt:'3D model of a house with a wireframe Christmas tree, a peace sign, Christmas circles and HAPPY HOLIDAYS letters lit up',
 twitterCard:'summary_large_image',twitterTitle:TITLE,twitterDescription:DESCRIPTION,twitterImage:`${SITE}/og-image.jpg`});
</script>

<template>
  <div class="costs-shell">
    <FestiveSky />
    <AppHeader />
    <main class="costs wiring">
      <section class="intro">
        <h1>Wiring plan</h1>
        <p>How the full show is connected: {{ WIRING.pixels.toLocaleString('en') }} pixels on {{ totals.ports }} controller ports, with the facade box and the show computer in the garage and the garden box outdoors behind the front-left bush.
          Numbers come from the LED cost estimate. <a href="/?wiring=1">See the wiring in the 3D model</a>.</p>
      </section>

      <section class="diagram glass" aria-label="Wiring diagram">
        <div class="legend">
          <span><i class="swatch-line" :style="{background:WIRE_COLORS.network}" /> Network</span>
          <span><i class="swatch-line dashed" :style="{color:WIRE_COLORS.mains}" /> 230 V mains</span>
          <span><i class="swatch-line" :style="{background:WIRE_COLORS.power}" /> 12 V power</span>
          <span><i class="swatch-line" style="background:linear-gradient(90deg,#f6c75a,#5ec8f0,#b48cff)" /> Pixel data, one colour per port</span>
          <span><i class="swatch-dot" :style="{background:WIRE_COLORS.power}" /> Power injection</span>
        </div>
        <div class="diagram-scroll">
          <svg id="wiring-diagram" :viewBox="`0 0 ${W} ${H}`" role="img" aria-labelledby="diagram-title">
            <title id="diagram-title">Wiring diagram: the garage with the show computer, switch and facade box, the garden box outdoors, and each controller port's chain of props</title>
            <rect :x="GARAGE.x" :y="GARAGE.y" :width="GARAGE.w" :height="GARAGE.h" rx="18" class="garage" />
            <text :x="GARAGE.x+16" :y="GARAGE.y+26" class="t-room">GARAGE</text>
            <text :x="GARAGE.x+GARAGE.w-8" :y="GARAGE.y+26" class="t-dim" text-anchor="end">through the wall to the props →</text>
            <g v-for="(o,i) in yards" :key="`y${i}`">
              <rect :x="o.x" :y="o.y" :width="o.w" :height="o.h" rx="18" class="yard" />
              <text :x="o.x+16" :y="o.y+18" class="t-room yard-label">GARDEN · IP66 BOX</text>
            </g>
            <path v-for="(l,i) in links" :key="i" :d="l.d" fill="none" :stroke="l.color" stroke-width="2" :stroke-dasharray="l.dash" opacity=".85" />
            <text v-for="(l,i) in links.filter(l=>l.label)" :key="`n${i}`" :x="l.lx" :y="l.ly" class="t-wire" :fill="WIRE_COLORS.network" text-anchor="end">{{ l.label }}</text>
            <text v-for="(m,i) in mainsLabels" :key="`m${i}`" :x="m.x" :y="m.y" class="t-wire" :fill="WIRE_COLORS.mains" text-anchor="end">{{ m.text }}</text>

            <g class="hub">
              <rect :x="HUB.x" :y="HUB.y" :width="HUB.w" :height="HUB.h" rx="14" class="card" />
              <text :x="HUB.x+16" :y="HUB.y+28" class="t-title">Show computer</text>
              <text :x="HUB.x+16" :y="HUB.y+44" class="t-dim">on a shelf next to the facade box</text>
              <text :x="HUB.x+16" :y="HUB.y+70" class="t-body">Raspberry Pi 5 · Falcon Player</text>
              <text :x="HUB.x+16" :y="HUB.y+90" class="t-body">5-port switch</text>
              <text :x="HUB.x+16" :y="HUB.y+116" class="t-body">Power strip on a plug-in 30 mA RCD</text>
              <text :x="HUB.x+16" :y="HUB.y+136" class="t-dim">FM transmitter on 12 V</text>
            </g>

            <g v-for="b in blocks" :key="b.z.id" class="zone" :data-zone="b.z.id">
              <rect :x="BOX.x" :y="b.top" :width="BOX.w" :height="b.h" rx="14" class="card" />
              <text :x="BOX.x+16" :y="b.top+26" class="t-title">{{ b.z.name }}</text>
              <text :x="BOX.x+16" :y="b.top+42" class="t-dim">{{ b.z.pixels.toLocaleString('en') }} px · {{ b.z.watts }} W max · {{ b.z.feeds }}</text>

              <g v-for="s in b.psus" :key="s.n">
                <rect :x="PSU.x" :y="s.y" :width="PSU.w" :height="s.h" rx="8" class="psu" />
                <text :x="PSU.x+10" :y="s.y+17" class="t-body">PSU {{ s.n }} · ports {{ s.ports.join(', ') }}</text>
                <text :x="PSU.x+10" :y="s.y+32" class="t-dim">{{ s.watts }} W · {{ pct(s.load) }} of 348 W</text>
                <path :d="`M${PSU.x+PSU.w},${s.y+s.h/2} H${CTRL.x}`" :stroke="WIRE_COLORS.power" stroke-width="2" />
              </g>

              <rect :x="CTRL.x" :y="b.ctrl.y" :width="CTRL.w" :height="b.ctrl.h" rx="8" class="ctrl" />
              <text :x="CTRL.x+10" :y="b.ctrl.y+18" class="t-body">Baldrick 8</text>
              <text :x="CTRL.x+10" :y="b.ctrl.y+33" class="t-dim">{{ b.z.ports.length }} of 8 ports used</text>

              <g v-for="r in b.rows" :key="r.port.n" class="port" :data-port="`${b.z.id}-${r.port.n}`">
                <path :d="curve(CTRL.x+CTRL.w,r.pin,TRACK.x,r.y+38)" fill="none" :stroke="r.port.color" stroke-width="2.5" />
                <circle :cx="CTRL.x+CTRL.w" :cy="r.pin" r="4.5" :fill="r.port.color" />
                <text :x="CTRL.x+CTRL.w-10" :y="r.pin+4" class="t-pin" text-anchor="end">{{ r.port.n }}</text>
                <text :x="TRACK.x" :y="r.y+20" class="t-body"><tspan :fill="r.port.color" font-weight="600">Port {{ r.port.n }}</tspan> · {{ r.port.name }}</text>
                <text :x="TRACK.x+TRACK.w" :y="r.y+20" class="t-dim" text-anchor="end">{{ r.port.pixels }} px · {{ pct(r.port.load) }} of the port · {{ r.port.cable }} m cable · PSU {{ r.port.psu }}</text>
                <rect :x="TRACK.x" :y="r.y+29" :width="TRACK.w" height="18" rx="4" class="track" />
                <g v-for="(c,i) in r.chips" :key="i">
                  <rect :x="c.x+.75" :y="r.y+29" :width="Math.max(c.w-1.5,1)" height="18" rx="3" :fill="r.port.color" :opacity="i%2?.62:.82"><title>{{ c.title }}</title></rect>
                  <text v-if="c.w>=(c.label.length*6.4+6)" :x="c.x+c.w/2" :y="r.y+42" class="t-chip" text-anchor="middle">{{ c.label }}</text>
                </g>
                <g v-for="(j,i) in r.injections" :key="`j${i}`">
                  <line :x1="j.x" :x2="j.x" :y1="r.y+26" :y2="r.y+50" :stroke="WIRE_COLORS.power" stroke-width="2" />
                  <circle :cx="j.x" :cy="r.y+26" r="3.5" :fill="WIRE_COLORS.power"><title>{{ j.title }}</title></circle>
                </g>
              </g>
            </g>
          </svg>
        </div>
        <p class="note scroll-hint">Scroll sideways to see the whole diagram. Each bar is one port, drawn against its {{ parts.portPixels }}-pixel limit.</p>
      </section>

      <div class="wiring-kpis">
        <div class="glass"><b>{{ totals.ports }}</b><span>controller ports</span></div>
        <div class="glass"><b>{{ totals.psus }}</b><span>power supplies</span></div>
        <div class="glass"><b>{{ totals.injections }}</b><span>power injections</span></div>
        <div class="glass"><b>{{ totals.cable }} m</b><span>pixel extension cable</span></div>
      </div>

      <section v-for="z in zones" :id="z.id" :key="z.id" class="glass box-card">
        <h2>{{ z.name }}</h2>
        <p v-if="z.outdoor" class="led">Outdoors, for {{ z.feeds }}: one {{ parts.controller.split(' (')[0] }} and {{ z.psus.length }} power supplies in an IP66 box on two bricks behind the front-left bush, fed by an outdoor mains cable from the power strip and an outdoor network cable from the switch. Cable lengths run from the box.</p>
        <p v-else class="led">In the garage, for {{ z.feeds }}: one {{ parts.controller.split(' (')[0] }} and {{ z.psus.length }} power supplies on a wall board, a patch cable to the switch and a plug in the power strip. Cable lengths run from the board, out through the jamb.</p>
        <div class="table-scroll">
          <table>
            <thead><tr><th>Port</th><th>Chain, in data order</th><th class="num">Pixels</th><th class="num">Cable</th><th>Power injection</th><th class="num">Supply</th></tr></thead>
            <tbody>
              <tr v-for="p in z.ports" :key="p.n">
                <td><i class="port-dot" :style="{background:p.color}" /> {{ p.n }}</td>
                <td><strong>{{ p.name }}</strong><small v-if="p.props.length>1">{{ p.props.map(x=>short(p,x)).join(' → ') }}</small></td>
                <td class="num">{{ p.pixels }}</td>
                <td class="num">{{ p.cable }} m</td>
                <td>{{ p.injections.length?p.injections.map(j=>`px ${j.at} (${j.prop})`).join(', '):'–' }}</td>
                <td class="num">PSU {{ p.psu }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="psu-bars">
          <div v-for="s in z.psus" :key="s.n">
            <span>Power supply {{ s.n }} · ports {{ s.ports.join(', ') }}</span>
            <div class="bar"><i :style="{width:pct(s.watts/parts.psuWatts)}" /><em :style="{left:pct(parts.psuLoad)}" /></div>
            <small>{{ s.watts }} W of {{ parts.psuWatts }} W at full white · limit {{ pct(parts.psuLoad) }}</small>
          </div>
        </div>
      </section>

      <section class="wiring-notes">
        <div class="glass"><UIcon name="i-lucide-cable" class="card-icon" /><h3>Data</h3><p>Each prop group is one chain on one port: out of its box to the first prop, then from where one prop's data ends to where the next starts, on xConnect 18 AWG extensions with a pigtail pair per prop. Facade chains leave the garage through the jamb and go up the wall; garden chains run along the ground strip from the box behind the bush. The longest lead is about {{ LONGEST_RUN }} m, well under the 15 m where a null pixel is needed. The tree strands and mini-tree spokes are wired up one and down the next, the outlines start at the garage door, and the eave strip at its right end.</p></div>
        <div class="glass"><UIcon name="i-lucide-zap" class="card-icon" /><h3>Power</h3><p>12 V, two Mean Well supplies per controller, each kept under {{ pct(parts.psuLoad) }} load at full white. Every {{ parts.injectEvery }} pixels a T-splitter takes a run from the chain's supply. On the facade that is red and black 4 mm² for the near points and 2 × 4 mm² outdoor cable for the upper strip and the S, joined with Wagos in a gel box; in the garden a short xConnect extension plugs straight in. The regulated strings go on the facade's strips, outlines and letters, which hold full brightness on their leads.</p></div>
        <div class="glass"><UIcon name="i-lucide-network" class="card-icon" /><h3>Network and music</h3><p>The Pi runs Falcon Player and sends E1.31/DDP to both controllers through the switch: a patch cable to the facade controller, and a 15 m outdoor cable to the garden box. Reserve fixed IP addresses for the Pi and both controllers. The car FM transmitter runs from a 12 V supply, on the street side of the garage and not in a metal box.</p></div>
        <div class="glass"><UIcon name="i-lucide-shield-alert" class="card-icon" /><h3>Mains</h3><p>Everything plugs into one power strip in the garage, and that into socket S through a plug-in 30 mA RCD (PRCD): the socket itself has no working 30 mA RCD. The garden box's 15 m of H07RN-F rubber cable plugs into the same strip, so it is behind the RCD too; no plug or coupler lies on the ground. Fuse every 12 V output, and keep the plug out while wiring.</p></div>
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
.swatch-dot{display:inline-block;width:9px;height:9px;border-radius:50%}
.diagram-scroll{overflow-x:auto;scrollbar-width:thin}
.diagram-scroll svg{display:block;width:100%;min-width:1040px;height:auto;font-family:var(--font-sans)}
.scroll-hint{display:none}
.card{fill:#0f1a2c;stroke:#ffffff1f}
.garage{fill:#ffffff05;stroke:#efc19755;stroke-dasharray:6 5}
.yard{fill:#7ee08105;stroke:#7ee08155;stroke-dasharray:6 5}
.yard-label{fill:#9fdca2}
.t-room{font-size:11px;letter-spacing:2px;font-weight:700;fill:#e3bd8f}
.psu{fill:#2a1714;stroke:#ff4d3d55}
.ctrl{fill:#14233a;stroke:#5ec8f055}
.track{fill:#ffffff08;stroke:#ffffff14}
.t-title{font-size:16px;font-weight:600;fill:#fbf4e8}
.t-body{font-size:12.5px;fill:#d6dfe6}
.t-dim{font-size:11px;fill:#8397a9}
.t-wire{font-size:11px;font-weight:500;stroke:#0d1626;stroke-width:5px;paint-order:stroke;stroke-linejoin:round}
.t-pin{font-size:11px;fill:#d6dfe6;font-weight:600}
.t-chip{font-size:10.5px;font-weight:700;fill:#10141c;pointer-events:none}
.wiring-kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin:18px 0}
.wiring-kpis>div{padding:16px 18px;display:flex;flex-direction:column;gap:2px}
.wiring-kpis b{font-family:var(--font-display);font-size:28px;font-weight:500;color:var(--gold);font-variant-numeric:tabular-nums}
.wiring-kpis span{font-size:12px;color:#a3b3c3}
.box-card{padding:20px 22px;margin-bottom:14px}
.box-card .led{margin:0 0 12px}
.table-scroll{overflow-x:auto}
.box-card table{min-width:640px}
.box-card td small{display:block;color:#8397a9;font-size:11px;margin-top:3px}
.port-dot{display:inline-block;width:9px;height:9px;border-radius:50%;margin-right:4px}
.psu-bars{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:16px}
.psu-bars span{font-size:12px;color:#cbd6df}
.psu-bars small{font-size:11px;color:#8397a9}
.psu-bars .bar{position:relative;height:8px;border-radius:99px;background:#ffffff0d;margin:6px 0 4px;overflow:visible}
.psu-bars .bar i{position:absolute;inset:0 auto 0 0;border-radius:99px;background:linear-gradient(90deg,#e7a96c,#ff4d3d)}
.psu-bars .bar em{position:absolute;top:-3px;bottom:-3px;width:2px;background:#fbf4e8aa}
.wiring-notes{display:grid;grid-template-columns:repeat(2,1fr);gap:12px;margin-top:18px}
.wiring-notes>div{padding:18px 20px}
.wiring-notes p{font-size:13px;line-height:1.7;color:#a3b3c3;margin:0}
.wiring-notes .card-icon{color:var(--gold);width:20px;height:20px;margin-bottom:8px}
@media (max-width:1000px){.scroll-hint{display:block}}
@media (max-width:720px){.wiring-kpis{grid-template-columns:repeat(2,1fr)}.psu-bars,.wiring-notes{grid-template-columns:1fr}.diagram{padding:14px 12px 4px}}
</style>
