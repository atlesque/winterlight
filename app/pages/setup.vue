<script setup>
import {IPS,FPP_RELEASES,BALDRICK_MANUAL,PORT_TABLES,OUTPUTS,PROP_RANGES,FILES} from '~~/src/software/setup.js';
import {CONTROLLERS,TOTAL_CHANNELS} from '~~/src/software/plan.js';

// Pi and controller setup: step by step from a blank card to the first test
// run. Port tables, outputs and prop ranges come from src/software/setup.js,
// which reads the wiring plan the same way tools/fseq/export.mjs does.
definePageMeta({alias:['/setup.html']});
const n=v=>v.toLocaleString('en');
const [facade,garden]=PORT_TABLES;
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
          Plan about an evening at the bench and an hour on site. How the pieces fit is on the <a href="/software.html">show software</a> page; the runbook's bench test and software chapters tick these steps off.</p>
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

      <ol class="setup-steps">
        <li class="glass card">
          <div class="step-head"><span class="step-n">1</span><h2>Flash Falcon Player onto the Pi</h2></div>
          <ol>
            <li>On the laptop, download the latest stable Raspberry Pi image from the <a :href="FPP_RELEASES" target="_blank" rel="noopener">FPP releases page</a> (a zipped .img).</li>
            <li>Write it to one of the 64 GB cards with Raspberry Pi Imager ("Use custom") or balenaEtcher. Skip Imager's OS customisation; FPP sets itself up.</li>
            <li>Put the card in the Pi in its FLIRC case, plug the network cable into the switch, then the USB-C supply. The first boot expands the card and reboots once; give it about 5 minutes.</li>
            <li>On the laptop, on the same network, open <span class="mono">http://fpp.local</span>. If that doesn't load, find the Pi in the router's client list, or join the "FPP" Wi-Fi hotspot the Pi starts when it has no network and open <span class="mono">http://192.168.8.1</span>.</li>
            <li>Work through the first-run wizard if it appears; it asks for the same things as step 2.</li>
          </ol>
        </li>

        <li class="glass card">
          <div class="step-head"><span class="step-n">2</span><h2>Pi settings</h2></div>
          <p class="lead">Under Status/Control, then Settings or Network. Menu names shift a little between FPP versions.</p>
          <ol>
            <li><b>Network (eth0):</b> static, IP <span class="mono">{{ IPS.pi }}</span>, netmask 255.255.255.0, gateway and DNS the router's address. Save, reboot, and reconnect at the new address.</li>
            <li><b>Time:</b> time zone Europe/Brussels, NTP on. The Status page should show the right local time.</li>
            <li><b>Audio:</b> plug the USB sound card in before booting, then choose it as the audio output device. Volume about 80%; fine-tune it at the FM transmitter.</li>
            <li><b>Mode:</b> leave FPP in Player mode, the default. It's the only player on the network.</li>
            <li><b>Backup:</b> once step 5 works, shut the Pi down from the menu and clone its card to the second 64 GB card. If the first card dies on a show night, swap and reboot.</li>
          </ol>
          <p class="note">Always shut the Pi down from FPP's menu, not by pulling the plug: the card can corrupt.</p>
        </li>

        <li class="glass card">
          <div class="step-head"><span class="step-n">3</span><h2>Set up each Baldrick 8</h2></div>
          <p class="lead">On the bench, one controller at a time, powered from its 12 V supply and patched into the switch. The <a :href="BALDRICK_MANUAL" target="_blank" rel="noopener">Baldrick 8 manual</a> gives its factory address and the exact page names.</p>
          <ol>
            <li>Open the controller's web page at its factory address, or find it in the router's client list.</li>
            <li><b>Network:</b> static IP, <span class="mono">{{ facade.ip }}</span> for the facade one, <span class="mono">{{ garden.ip }}</span> for the garden one. Label each board with its IP.</li>
            <li><b>Input:</b> DDP.</li>
            <li><b>Ports:</b> for each port in use, the pixels and start channel below. Leave the other ports off.</li>
            <li><b>Every port:</b> pixel type WS2811, colour order from the bench test (RGB or GRB), reverse off, null pixels 0, gamma 1.0, brightness 100%. The show file already has the gamma curve, so a second one on the controller would make fades too dark.</li>
            <li>Save, reboot the controller, and use its own test pattern to check each string lights to its end.</li>
          </ol>
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
        </li>

        <li class="glass card">
          <div class="step-head"><span class="step-n">4</span><h2>Falcon Player's two DDP outputs</h2></div>
          <p class="lead">Input/Output Setup, then Channel Outputs, then the E1.31 / ArtNet / DDP / KiNet tab. Tick "Enable Output", add two rows, save, and restart FPPD when FPP asks.</p>
          <div class="table-scroll">
            <table>
              <thead><tr><th>Active</th><th>Description</th><th class="num">Start</th><th class="num">Size</th><th>Type</th><th>IP</th></tr></thead>
              <tbody><tr v-for="o in OUTPUTS" :key="o.name"><td>yes</td><td>{{ o.name }}</td><td class="num">{{ o.start }}</td><td class="num">{{ o.size }}</td><td>DDP - One Based</td><td class="mono">{{ o.ip }}</td></tr></tbody>
            </table>
          </div>
          <p class="lead"><b>No re-export needed for other IPs.</b> The addresses only end up in co-universes.json, not in show.fseq, so the show file stays the same whatever addresses you pick. With the addresses above, post the file instead of typing, from the repo folder on the laptop (it replaces whatever is on that tab):</p>
          <pre class="code">{{ CURL }}</pre>
          <p class="lead">With other addresses, type them into the table, or run this and post the new file:</p>
          <pre class="code">{{ EXPORT }}</pre>
        </li>

        <li class="glass card">
          <div class="step-head"><span class="step-n">5</span><h2>Upload the show, playlist and schedule</h2></div>
          <ol>
            <li>Content Setup, File Manager: upload show.fseq on the Sequences tab and show.mp3 on the Audio tab (the files above).</li>
            <li>Content Setup, Playlists: a new playlist "Winterlight" with one "Sequence and Media" entry, show.fseq with show.mp3. Save, and play it once from the Status page.</li>
            <li>Content Setup, Scheduler: the Winterlight playlist on the show evenings, repeating, for example 17:00 to 22:00 from Sat 12 Dec. Check the Status page shows the next run.</li>
            <li>Tune the FM transmitter to a free frequency and listen from a parked car: the music and the lights should match.</li>
          </ol>
        </li>

        <li class="glass card">
          <div class="step-head"><span class="step-n">6</span><h2>Test run checks</h2></div>
          <ol>
            <li><b>Test pattern first.</b> Status/Control, Display Testing: run "RGB Cycle" over one prop's channels at a time (the ranges below). Only that prop should light, from its first pixel to its last.</li>
            <li><b>A prop starts a few pixels early or late:</b> a prop before it on the same port has more or fewer pixels in the chain than the model. Count and cut, so every prop carries exactly its pixel count; spare pixels folded behind a prop still count.</li>
            <li><b>Wrong colours (red shows green):</b> change that port's colour order on the controller, RGB to GRB or back.</li>
            <li><b>A whole controller stays dark:</b> check it answers at its IP from the laptop, that its input is DDP, and that its output row in FPP is ticked with the right IP.</li>
            <li><b>Fades too dark:</b> re-export with <span class="mono">--gamma 1.8</span>. Too bright, or the supplies run warm: <span class="mono">--brightness 70</span>. Then upload the new show.fseq.</li>
            <li><b>Spare pixels that must stay on a prop:</b> change its count in src/props.js and re-run the export; the show file and the port tables both change.</li>
          </ol>
          <details v-for="c in PROP_RANGES" :key="c.id">
            <summary>{{ c.name }}: channels per prop</summary>
            <div class="table-scroll">
              <table>
                <thead><tr><th>Port</th><th>Prop</th><th class="num">Pixels</th><th class="num">Pixels on port</th><th class="num">Show channels</th></tr></thead>
                <tbody><tr v-for="p in c.props" :key="p.id"><td>{{ p.port }}</td><td>{{ p.prop }}</td><td class="num">{{ p.pixels }}</td><td class="num">{{ p.firstPixel }}–{{ p.lastPixel }}</td><td class="num">{{ n(p.showStart) }}–{{ n(p.showEnd) }}</td></tr></tbody>
              </table>
            </div>
          </details>
          <p class="note">Before each show night: press the RCD adapter's test button, check the Pi's clock on the Status page, and keep the cloned backup card in the facade box.</p>
        </li>
      </ol>
    </main>
  </div>
</template>

<style scoped>
.setup a:not(.files a){color:var(--gold-soft);text-decoration:underline;text-underline-offset:3px}
.card{padding:20px 22px;margin-top:14px}
.intro+.card{margin-top:30px}
.lead{margin:0 0 12px;font-size:13px;line-height:1.7;color:#a3b3c3;max-width:820px}
.lead b,.setup li b{color:#e3e9ee;font-weight:600}
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
.setup-steps{list-style:none;margin:0;padding:0}
.step-head{display:flex;align-items:center;gap:12px;margin-bottom:12px}
.step-head h2{margin:0}
.step-n{display:grid;place-items:center;flex-shrink:0;width:28px;height:28px;border-radius:50%;font-size:13px;font-weight:700;color:#10141c;background:var(--gold)}
.setup-steps ol{list-style:decimal;margin:0 0 12px;padding-left:20px;font-size:13px;line-height:1.7;color:#cbd6df;max-width:860px}
.setup-steps ol li+li{margin-top:6px}
.port-tables{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:22px;margin:16px 0 4px}
.port-tables h3{margin-bottom:4px}
.port-tables .table-scroll table{min-width:420px}
.lead,.setup-steps ol,.note,.callout{overflow-wrap:anywhere}
.code{margin:0 0 12px;padding:12px 14px;border-radius:10px;background:#0a1120;border:1px solid #ffffff14;font-size:12px;line-height:1.6;color:#e8d3b5;white-space:pre-wrap;word-break:break-all}
.note{max-width:820px}
@media (max-width:900px){.port-tables{grid-template-columns:minmax(0,1fr)}}
@media (max-width:720px){.card{padding:16px}.files li{grid-template-columns:1fr;gap:2px}}
</style>
