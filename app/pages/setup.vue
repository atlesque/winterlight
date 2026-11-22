<script setup>
import {IPS,PORT_TABLES,OUTPUTS,PROP_RANGES,FILES,STEPS,SETUP_GUIDE_KEY} from '~~/src/software/setup.js';
import {CONTROLLERS,TOTAL_CHANNELS} from '~~/src/software/plan.js';

// Pi and controller setup: step by step from a blank card to the first test
// run. Port tables, outputs and prop ranges come from src/software/setup.js,
// which reads the wiring plan the same way tools/fseq/export.mjs does.
definePageMeta({alias:['/setup.html']});
const n=v=>v.toLocaleString('en');
const CURL=`curl -X POST -H 'Content-Type: application/json' --data @outputs/fpp/co-universes.json http://fpp.local/api/channel/output/universeOutputs`;
const EXPORT='node tools/fseq/export.mjs --facade-ip <facade IP> --garden-ip <garden IP>';

const SITE='https://winterlight.alexander-df0.workers.dev';
const TITLE='Winterlight · Pi and controller setup';
const DESCRIPTION='Step by step: Falcon Player on the Raspberry Pi 4, the two Baldrick 8 controllers, the DDP outputs, the show upload and schedule, and the checks at the test run.';
useHead({title:TITLE,link:[{rel:'canonical',href:`${SITE}/setup.html`}],bodyAttrs:{class:'setup-page'}});
useSeoMeta({description:DESCRIPTION,ogType:'website',ogSiteName:'Winterlight',ogLocale:'en_GB',ogTitle:TITLE,ogDescription:DESCRIPTION,ogUrl:`${SITE}/setup.html`,
 ogImage:`${SITE}/og-image.jpg`,ogImageType:'image/jpeg',ogImageWidth:1200,ogImageHeight:630,ogImageAlt:'3D model of a house with a wireframe Christmas tree, a peace sign, Christmas circles and HAPPY HOLIDAYS letters lit up',
 twitterCard:'summary_large_image',twitterTitle:TITLE,twitterDescription:DESCRIPTION,twitterImage:`${SITE}/og-image.jpg`});
</script>

<template>
  <div class="costs-shell">
    <FestiveSky />
    <AppHeader />
    <main class="costs setup">
      <section class="intro">
        <h1>Pi and controller setup</h1>
        <p>The Raspberry Pi 4 runs Falcon Player (FPP), which streams the colour of all {{ n(TOTAL_CHANNELS/3) }} pixels over the network to the two Baldrick 8 controllers using DDP, and plays the music to the FM transmitter.
          Work through the guide below one step at a time and tick each task off; your ticks stay in this browser. Plan about an evening at the bench and an hour on site. How the pieces fit is on the <a href="/software.html">show software</a> page; the runbook's bench test and software chapters tick these steps off.</p>
      </section>

      <section class="glass card">
        <h2>How it fits together</h2>
        <p class="lead">Everything sits on one wired network: the Pi and the facade controller plug into the switch in the garage, and the garden controller hangs off the same switch on the outdoor network cable. The Pi sends each controller its own block of channels.</p>
        <div class="table-scroll">
          <table>
            <thead><tr><th>Device</th><th>Where</th><th>Suggested IP</th><th>Show channels</th></tr></thead>
            <tbody>
              <tr><td>Raspberry Pi 4, Falcon Player</td><td>Facade board, garage</td><td class="mono">{{ IPS.pi }}</td><td>sends all {{ n(TOTAL_CHANNELS) }}</td></tr>
              <tr v-for="c in CONTROLLERS" :key="c.id"><td>{{ c.name }}, Baldrick 8</td><td>{{ c.outdoor?'Garden box':'Facade board, garage' }}</td><td class="mono">{{ IPS[c.id] }}</td>
                <td>{{ n(c.start) }}–{{ n(c.end) }} ({{ n(c.pixels) }} pixels, {{ c.ports.length }} ports)</td></tr>
            </tbody>
          </table>
        </div>
        <p class="lead">The controller addresses are the ones the show files were made with, so keeping them saves a step. They work if the home network is 192.168.1.x and the addresses sit outside the router's DHCP range, or are reserved for these devices. If the router uses another range, such as 192.168.0.x, pick three free addresses there and use them everywhere below.</p>
        <p class="callout"><UIcon name="i-lucide-clock" class="callout-icon" /><span><b>The Pi needs internet time.</b> It has no clock battery, so without internet it starts each evening at the wrong time and the schedule misfires. Connect the switch to the home router, even through a long cable or a powerline adapter, or put the Pi on the home Wi-Fi for time and keep the show traffic on the cable.</span></p>
      </section>

      <section class="glass card">
        <h2>The files for the Pi</h2>
        <ul class="files">
          <li v-for="f in FILES" :key="f.file"><a :href="`/outputs/fpp/${f.file}`" download><UIcon name="i-lucide-download" class="file-icon" />{{ f.file }}</a><span>{{ f.what }}</span></li>
        </ul>
      </section>

      <StepGuide :steps="STEPS" :storage-key="SETUP_GUIDE_KEY">
        <template #step-baldrick>
          <div class="port-tables">
            <div v-for="t in PORT_TABLES" :key="t.id">
              <h3>{{ t.name }} <span class="mono dim">{{ t.ip }}</span></h3>
              <div class="table-scroll"><table>
                <thead><tr><th>Port</th><th>Chain</th><th class="num">Pixels</th><th class="num">Start channel</th><th class="num">Start pixel</th></tr></thead>
                <tbody><tr v-for="p in t.ports" :key="p.port"><td>{{ p.port }}</td><td>{{ p.chain }}</td><td class="num">{{ p.pixels }}</td><td class="num">{{ n(p.start) }}</td><td class="num">{{ n(p.startPixel) }}</td></tr></tbody>
              </table></div>
            </div>
          </div>
          <p class="note">Both controllers count from channel 1: FPP sends each its own block ("one based"). Use the start pixel column if the port page asks for pixels rather than channels. Don't reverse any port: the show file is already in the order the strings are wired, from the end nearest the box.</p>
        </template>
        <template #step-outputs>
          <div class="table-scroll">
            <table>
              <thead><tr><th>Active</th><th>Description</th><th class="num">Start</th><th class="num">Size</th><th>Type</th><th>IP</th></tr></thead>
              <tbody><tr v-for="o in OUTPUTS" :key="o.name"><td>yes</td><td>{{ o.name }}</td><td class="num">{{ o.start }}</td><td class="num">{{ o.size }}</td><td>DDP - One Based</td><td class="mono">{{ o.ip }}</td></tr></tbody>
            </table>
          </div>
          <p class="lead"><b>No re-export needed for other IPs.</b> The addresses only end up in co-universes.json, not in show.fseq. With the addresses above, post the file instead of typing, from the repo folder on the laptop (it replaces whatever is on that tab):</p>
          <pre class="code">{{ CURL }}</pre>
          <p class="lead">With other addresses, type them into the table, or run this and post the new file:</p>
          <pre class="code">{{ EXPORT }}</pre>
        </template>
        <template #step-test>
          <details v-for="c in PROP_RANGES" :key="c.id">
            <summary>{{ c.name }}: channels per prop</summary>
            <div class="table-scroll">
              <table>
                <thead><tr><th>Port</th><th>Prop</th><th class="num">Pixels</th><th class="num">Pixels on port</th><th class="num">Show channels</th></tr></thead>
                <tbody><tr v-for="p in c.props" :key="p.id"><td>{{ p.port }}</td><td>{{ p.prop }}</td><td class="num">{{ p.pixels }}</td><td class="num">{{ p.firstPixel }}–{{ p.lastPixel }}</td><td class="num">{{ n(p.showStart) }}–{{ n(p.showEnd) }}</td></tr></tbody>
              </table>
            </div>
          </details>
          <p class="note">A prop that starts a few pixels early or late means a prop before it on the same port has more or fewer pixels in the chain than the model: count and cut, so every prop carries exactly its pixel count. If spare pixels must stay, change the prop's count in src/props.js and re-run the export. Before each show night: press the RCD adapter's test button, check the Pi's clock, and keep the backup card in the facade box.</p>
        </template>
      </StepGuide>
    </main>
  </div>
</template>

<style scoped>
.setup a:not(.files a){color:var(--gold-soft);text-decoration:underline;text-underline-offset:3px}
.card{padding:20px 22px;margin-top:14px}
.intro+.card{margin-top:30px}
.lead{margin:0 0 12px;font-size:13px;line-height:1.7;color:#a3b3c3;max-width:820px}
.lead b{color:#e3e9ee;font-weight:600}
.table-scroll{overflow-x:auto;margin-bottom:12px}
.table-scroll table{min-width:520px}
.costs th.num,.costs td.num{text-align:right}
.mono{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:.92em;color:#e8d3b5}
.dim{color:#8397a9;font-weight:400;margin-left:6px}
.callout{display:flex;gap:10px;margin:4px 0 0;padding:12px 14px;border-radius:12px;background:#efc19712;border:1px solid #efc19733;font-size:13px;line-height:1.65;color:#cbd6df;max-width:820px}
.callout b{color:#fbf4e8}
.callout-icon{flex-shrink:0;width:18px;height:18px;color:var(--gold);margin-top:2px}
.files{list-style:none;margin:0;padding:0;display:grid;gap:8px}
.files li{display:grid;grid-template-columns:190px 1fr;gap:12px;align-items:baseline;font-size:13px}
.files a{display:inline-flex;align-items:center;gap:7px;color:var(--gold-soft);font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:12.5px}
.files a:hover{color:var(--gold)}
.files span{color:#a3b3c3;line-height:1.6}
.file-icon{width:15px;height:15px;flex-shrink:0}
.port-tables{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:22px;margin:16px 0 4px}
.port-tables h3{margin-bottom:4px}
.port-tables .table-scroll table{min-width:420px}
.lead,.note,.callout{overflow-wrap:anywhere}
.code{margin:0 0 12px;padding:12px 14px;border-radius:10px;background:#0a1120;border:1px solid #ffffff14;font-size:12px;line-height:1.6;color:#e8d3b5;white-space:pre-wrap;word-break:break-all}
.note{max-width:820px}
@media (max-width:900px){.port-tables{grid-template-columns:minmax(0,1fr)}}
@media (max-width:720px){.card{padding:16px}.files li{grid-template-columns:1fr;gap:2px}}
</style>
