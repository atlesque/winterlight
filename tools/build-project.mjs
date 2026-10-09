import {writeFileSync,readFileSync} from 'node:fs';
import {PROPS,PIXEL_COUNT,CHANNEL_COUNT,BANKS,FEED_COUNT,powerSections,propPositions,cableRoute} from '../src/props.js';
import {HOUSE,BANK_POSITIONS} from '../src/house.js';
const out=(name,data)=>writeFileSync(new URL(`../outputs/${name}`,import.meta.url),data);
const csv=rows=>rows.map(row=>row.map(x=>{const s=String(x);return /[",\r\n]/.test(s)?`"${s.replaceAll('"','""')}"`:s;}).join(',')).join('\r\n')+'\r\n';
const fmt=n=>n.toFixed(2);
out('pixel-map.csv',csv([['model','pixels','channel_start','channel_end','bank','data_port','max_50_address_power_sections','local_pixel_start_zero_based'],...PROPS.map(p=>[p.id,p.count,p.channelStart,p.channelEnd,p.bank,p.port,p.sections,p.localStart])]));
out('controller-config.csv',csv([['bank','model','port','protocol','RGB_addresses','global_channel_start','global_channel_end','controller_local_channel_start_1_based','controller_local_channel_end_1_based','DDP_receiver_offset_zero_based','colour_order_to_commission'],...PROPS.map(p=>[p.bank,p.id,p.port,'WS2811 / 800 kHz',p.count,p.channelStart,p.channelEnd,p.localStart*3+1,(p.localStart+p.count)*3,0,'RGB; verify on hardware'])]));
let feedId={A:0,B:0,C:0};
const feeds=PROPS.flatMap(p=>powerSections(p).map(({start,end},i)=>{
 const position=propPositions(p)[start],route=cableRoute(BANK_POSITIONS[p.bank],p,position);
 const length=route.slice(1).reduce((n,point,j)=>n+Math.hypot(...point.map((v,k)=>v-route[j][k])),0);
 return {id:`${p.bank}-${++feedId[p.bank]}`,bank:p.bank,model:p.id,port:p.port,start,end,count:end-start,amps:(end-start)*p.wattsPerAddress/12,fuse:p.path?2.5:p.id.startsWith('Pole')?1.5:4,route,length,isolateAfter:i<p.sections-1};
}));
out('power-feeds.csv',csv([['feed','bank','model','data_port','first_address_1_based','last_address_1_based','address_count','full_white_amps','provisional_DC_fuse_amps','schematic_one_way_metres','positive_isolation_after_section','route_xyz_metres'],...feeds.map(f=>[f.id,f.bank,f.model,f.port,f.start+1,f.end,f.count,fmt(f.amps),f.fuse,fmt(f.length),f.isolateAfter?'yes; pass data and same-bank GND only':'prop end; cap V+',JSON.stringify(f.route)])]));
const bom=[
 ['12V WS2811 50-node strings',18,'reuse / order if needed','16 installed (800 pixels) plus 2 spare; matching sealed pinout; max 0.72W/node'],
 ['12V grouped WS2811 RGB strip; 5m rolls',4,'new specification','20m ordered; 15.4m fitted (154 addresses) plus 4.6m spare; 30 LEDs/m; 3 LEDs/address; <=7.2W/m; weather-suitable sealed ends'],
 ['Baldrick8 12V RSP320 assembled kit',3,'retain','Existing three-controller architecture; verify thermal and ingress performance'],
 ['Controller output pigtails',24,'included','19 used; do not double-count kit components'],
 ['DC distribution block',3,'revise','A:9 B:8 C:10 protected branches; use >=10-way rated distribution and >=30A bus after derating'],
 ['DC fuse holders',27,'revise','DC interruption and voltage ratings verified for actual circuit'],
 ['4A DC branch fuses',18,'provisional','12 installed plus 6 spare; 50-node bullet sections; actual wire/connector/fuse assessment required'],
 ['1.5A DC branch fuses',15,'provisional','10 installed plus 5 spare; 20-node poles; actual protection assessment required'],
 ['2.5A DC branch fuses',8,'provisional','5 installed plus 3 spare; strip sections up to 32 groups; actual protection assessment required'],
 ['Upstream/controller supply protection',3,'confirm','Verify trunk and controller wiring protection separately'],
 ['Power feed harness',27,'revise','See power-feeds.csv; measure real routes and calculate conductor size / voltage drop'],
 ['Sealed feed connector pairs',27,'revise','Verified current/pinout; adapt strip pads to matching sealed harnesses'],
 ['Positive-isolated inter-section data link',8,'revise','6 arch/star boundaries + 2 long-strip boundaries; pass data and same-bank GND only'],
 ['First-address data/GND route',19,'revise','One per prop; facade route over door lintel; qualify longest data run / supported differential solution'],
 ['Unused controller output caps',5,'revise','24 outputs minus 19 used'],
 ['Prop terminal caps',19,'revise','Additional injection seals as applicable'],
 ['Coro 100-node arch plus support',4,'retain','Two 50-node curves; match actual frame geometry'],
 ['Custom 100-node star plus stand',2,'retain','Two 50-node outlines; no substituted 150-node retail star'],
 ['0.9m pole upright plus diffuser',10,'new / reuse pixels','20 bullet pixels per pole; rear loom space and sealed detachable harness'],
 ['Weighted pole base',10,'new','Wind/site-specific ballast; 0.22m square footprint shown, actual base must fit garden'],
 ['Facade channel / removable mounting', '15.4m plus corners','new','Mount on ground-floor opening frames; no threshold strip; profile and weather exposure to confirm'],
 ['Extra glands/seals/strain relief','1 set','revise','Count after harness and enclosure design'],
 ['Rated DC power/data cable','measure','revise','power-feeds.csv contains schematic lengths only; calculate voltage drop and ampacity'],
 ['FPP host with PSU and storage','1 set','retain','Supported image and reliable storage; WLT2 needs verified adapter for FSEQ playback'],
 ['Ethernet switch',1,'retain','At least 5 ports'],['Ethernet cable','4 routes','retain','Outdoor-rated where exposed'],
 ['USB DAC speaker audio cable','1 set','retain','Use supplied matching soundtrack and wired audio'],
 ['Mains circuit isolation/protection','1 system','site review','Electrician verification; circuit work priced separately'],
 ['Ferrules labels seal kits spare fuses','1 set','revise','Label bank port model section and polarity'],
 ['Electrical commissioning tools','1 set','confirm','Current voltage and thermal inspection'],
 ['Public playback/music permissions','as applicable','confirm','Separate from possession of the recording'],
 ['Former 25x10 screen and four bar frames',0,'removed','No longer part of active layout or purchase list'],
];
out('revised-bom.csv',csv([['item','quantity','status','specification_or_action'],...bom]));
const schedule=PROPS.map(p=>`| ${p.name} | ${p.count} | ${p.channelStart}–${p.channelEnd} | ${p.bank} / ${p.port} | ${p.sections} |`).join('\n');
const banks=Object.entries(BANKS).map(([name,b])=>`| ${name} | ${b.count} | ${b.channelStart}–${b.channelEnd} | ${b.ports} | ${b.sections} | ${fmt(b.watts)} W / ${fmt(b.watts/12)} A |`).join('\n');
out('christmas-show-project.md',`# Winterlight — approved facade light show

Updated 9 October 2026 after approval of the facade preview. The main simulator, wiring overlay, channel map, parts list and stored Wizards in Winter sequence share this layout: **four arches, two stars, ten 0.9 m poles, two ground-floor window outlines and one U-shaped door outline**. The four former bars and 25×10 screen are removed.

## 1. Layout and access

The supplied plan defines one 8.50 m property, one left garage, the entrance, small WC window, kitchen window and two upstairs windows. Heights and forecourt depth remain estimated. Both ground-floor windows receive full strip outlines. Only the door sides and lintel receive strip; nothing crosses the threshold. Upstairs, roof and garage remain unlit. This approval supersedes the earlier ban on ground-floor frame mounting.

Ten 20-pixel poles have about 0.9 m lit height and sit in two staggered rows in the right garden. Four one-metre arches remain in two rows, with two low stars behind them. Garage access (x=0–3.35 m), entrance access (x=4–5.5 m) and public pavement stay clear of freestanding props and paving-level cable. The mailbox remains at the street edge. Mounting and ballast need site measurements; modeled base size is not a wind calculation.

See [layout.svg](layout.svg) for facade and plan views. The approved static view remains available at /props-preview.html; the main show is at /.

## 2. Pixel and strip specification

Retain or buy **800 individual 12 V WS2811 bullet pixels**: 400 for arches, 200 for stars and 200 for poles. Reuse suitable existing pixels from the removed bars/panel before buying more. For a new build, 18 × 50-node strings provide 800 installed plus 100 spare, five fewer strings than the former 23-string order.

Facade strip is a separate specification: **12 V WS2811 RGB, 30 LEDs/m, three LEDs per address, 10 addresses/m, maximum 7.2 W/m at full white**. Kitchen: 64 groups / 6.4 m; WC: 28 groups / 2.8 m; door: 62 groups / 6.2 m. Total: 154 groups / 15.4 m / 462 LED packages. Four 5 m rolls allow 4.6 m spare. These lengths include corner/slack allowance; measure the frames and place any excess deliberately. Do not increase density, substitute RGBW/5 V strip or change group size without updating the map, power calculation and sequence.

The simulator represents each three-LED strip group as one luminous point. Thus **954 RGB addresses** is the channel count, not the physical LED-package count (1,262). Weather-rated strip does not seal cut pads, corners or connectors. Use supported removable frame channels and sealed transitions; adhesive alone is not the specified outdoor fixing method.

## 3. Pixel and channel schedule

| Model | RGB addresses | Global RGB channels | Bank / data port | Power feeds |
|---|---:|---:|---|---:|
${schedule}
| **Total** | **${PIXEL_COUNT}** | **${CHANNEL_COUNT}** | **19 used outputs** | **${FEED_COUNT}** |

Each prop has its own controller port. No inter-prop daisy chain is required. [controller-config.csv](controller-config.csv) gives one-based controller-local ranges. Data runs begin at the first sample in the model; mark inputs and strip corner direction before mounting. Arches and stars retain their original numbered insertion paths; pole pixels run bottom to top. Window outlines run bottom-left → top-left → top-right → bottom-right → bottom-left, with the duplicate endpoint omitted. Door runs bottom-left → top-left → top-right → bottom-right.

## 4. Controllers and outputs

Keep three Baldrick8 controllers and three RSP-320-12 supplies. Current [Baldrick8 documentation](https://www.baldrickboard.com/en/boards/baldrick8/manual) specifies eight WS2811-compatible outputs and DDP; the new map uses 6 / 5 / 8 outputs, with five spare across the system. No additional controller is needed.

| Bank | Addresses | Global channels | Data ports | Fused feeds | Full-white design load |
|---|---:|---|---:|---:|---|
${banks}

Global FPP source ranges are A=1–1104, B=1105–2124, C=2125–2862. Each DDP receiver starts at **local offset zero**; do not apply the global starting channel again at the receiver. Configure actual IP addresses at commissioning, not invented addresses in this plan. For separated 510-channel E1.31 universes, A: U1=510 / U2=510 / U3=84; B: U4=510 / U5=510; C: U6=510 / U7=228. Do not mix this map with former universe assignments.

## 5. Wiring and power

See [wiring.svg](wiring.svg) and [power-feeds.csv](power-feeds.csv). Each PSU is an independent positive power domain. Source each prop's fused injection feeds from its assigned bank; continue data and same-bank reference ground across internal sections, but isolate V+ between separately protected sections. Do not parallel PSU positives. The controller data harness carries data/GND; remove or isolate its positive conductor when external injection is used so it cannot bypass branch protection. Controller board supply/input wiring needs its own protection and must follow the manufacturer's power-input rules.

There are 27 independently fused feeds: 12 × 50-node arch/star sections, 10 × 20-node poles, one × 28-group WC strip, two × 32-group kitchen sections and two × 31-group door sections. Initial fuse allowances are 4 A, 1.5 A and 2.5 A respectively, subject to actual cable/connector ratings, DC interruption rating, holder, ambient conditions and fuse curves. Distribution blocks need at least A=9, B=8 and C=10 usable protected circuits, with a verified 30 A bus after derating. Eight internal data/GND links cross positive-isolated section boundaries.

Facade leads rise in the right garden to a **2.55 m high frame/wall route**, pass above the door lintel, then descend along the relevant opening frame. No cable crosses the entrance at paving level. This overhead route is a proposal, not a surveyed mounting point; use frame-safe clips and inspect access/reach before fitting. Plan the actual frame-following branch runs, drip loops and strain relief. CSV cable lengths and the 3D overlay are schematic routing estimates, not order lengths. Qualify the longest first-pixel data lead; use the controller maker's supported differential solution if needed.

The selected procurement maximum is 0.72 W/address for both bullet nodes and grouped strip. That yields **686.88 W / 57.24 A total**, excluding controller overhead and PSU losses, versus 756 W in the former design. This lower maximum is conditional on procuring strip at <=7.2 W/m; higher-power variants invalidate it. A's 264.96 W is the largest bank load. Retained 320.4 W supplies have nominal room for the pixel load, but full-load thermal derating and controller overhead still need verification. Software dimming is supplementary and does not size protective hardware.

Keep mains supplies dry, ventilated and protected, or obtain documented complete outdoor assemblies. Confirm site mains protection and assembly with a qualified electrician. Actual conductor sizing, voltage-drop calculation, last-pixel white test, current and enclosure temperature measurements precede outdoor operation. Existing [technical research](technical-research.md) covers the separately identified regulatory research and commissioning considerations.

## 6. Sequencing and timing

The matching extracted Wizards in Winter soundtrack drives the stored **5,569 native frames × 2,862 channels**. Original native PTS, video end (185.818967 s) and audio end (185.875737 s) are preserved. The last frame holds through the 56.770 ms audio tail, then blacks out. This is spatial reassignment of observed camera colours, not recovery of original controller commands.

| Reference role | Current prop assignment |
|---|---|
| Candy canes and mini/tree clusters | Four retained arches |
| Left/right wreaths | Two retained stars |
| First two roof-icicle sections | Kitchen-window outline |
| Third roof-icicle section | WC-window outline |
| Last roof-icicle section | Door sides/lintel |
| Central filmed sign | Ten pole columns, bottom-to-top; colour accents rather than text |

Nearest original RGB triplets are copied into each new prop. There is no temporal interpolation, beat generation or nominal-FPS resampling. New outlines follow the original filmed icicle activity; poles follow the sign's colour activity. Camera dim/background suppression remains the original extraction's approximation. [source-mapping.json](source-mapping.json) records every sampling coordinate and parent artifact hash.

[Controller bank partitions](controller-banks/manifest.json) contain A=1,104, B=1,020 and C=738 channels per native frame. They recombine to the exact new artifact without RGB or timestamp changes. WLT2 remains a custom preview format, **not FSEQ**. A fixed-interval xLights/FPP adapter must document quantization and commissioning latency before hardware playback. No real controller has been connected or commanded. The optional demo and 40 fps .wlshow export use the new geometry and map but remain separate authored approximations.

## 7. Cost and procurement

[revised-bom.csv](revised-bom.csv) is the current checklist. Cost reductions come from reusing pixels, removing the panel structure and buying five fewer bullet strings for a new build. Added costs are 20 m of grouped strip, facade channels/corners, ten pole bases/diffusers, six extra power feeds and eight extra data tails versus the former design. Three assembled controller kits remain in the plan. Net delivered saving is **not yet priced**; earlier whole-project budget totals are superseded rather than presented as current quotes. Obtain one combined quote with matching connectors and fabrication included.

## 8. Deliverables and rebuild

The simulator, CSV wiring/configuration schedules, BOM, facade/plan SVGs, printable HTML guide, every-frame worksheet, timing integrity report and all bank partitions use this approved map. Run \`node tools/build-project.mjs\` or \`python3 work/package.py\` to rebuild planning files. Then re-extract/repack timing if source sampling or pixel counts change; changing a map must not silently relabel old RGB data.

The recording and source sequence are local project assets. Existing regulatory/music research is background material dated 8 October 2026, not newly verified permissions or a purchase authorization. Physical installation, FSEQ playback and acoustic/optical alignment remain commissioning tasks.
`);
// Readable SVGs derived from the same metre coordinates as the simulator.
const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
const text=(x,y,s,size=15)=>`<text x="${x}" y="${y}" font-size="${size}">${esc(s)}</text>`;
const svg=(body,height=870)=>`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="${height}" viewBox="0 0 1200 ${height}"><style>text{font-family:Arial,sans-serif;fill:#dce7ee} .box{fill:#172a38;stroke:#668092;stroke-width:1.5}</style><rect width="1200" height="${height}" fill="#101d28"/>${body}</svg>`;
const palette={A:'#edab63',B:'#85b8fb',C:'#9bd6bd'};
let layout=text(45,43,'Approved facade layout · ground-floor outlines + ten poles',26)+text(45,72,'Same geometry as the main simulator. Opening heights, forecourt depth and supports remain estimates.',14);
const sx=x=>100+x*110,sy=y=>420-y*38;
layout+=`<rect x="100" y="${sy(2.8)}" width="341" height="${2.8*38}" fill="#503c37"/><rect x="441" y="${sy(5.5)}" width="594" height="${5.5*38}" fill="#503c37"/>`;
layout+=`<path d="M441 ${sy(5.5)} L738 ${sy(8.3)} L1035 ${sy(5.5)}" fill="#29323d"/>`;
const opening=(x,y,w,h)=>`<rect x="${sx(x-w/2)}" y="${sy(y+h/2)}" width="${w*110}" height="${h*38}" fill="#1e2e39" stroke="#72828d"/>`;
layout+=opening(HOUSE.garage.x,HOUSE.garage.height/2,HOUSE.garage.width,HOUSE.garage.height)+opening(HOUSE.door.x,HOUSE.door.height/2,HOUSE.door.width,HOUSE.door.height);
for(const win of HOUSE.windows)layout+=opening(win.x,win.y,win.width,win.height);
for(const p of PROPS){const pts=propPositions(p);layout+=`<polyline points="${(p.closed?[...pts,pts[0]]:pts).map(([x,y])=>`${sx(x)},${sy(y)}`).join(' ')}" stroke="${p.path?'#ffd393':p.id.startsWith('Pole')?'#80caff':'#92ded7'}" stroke-width="${p.path?4:3}" fill="none"/>`;}
layout+=text(110,452,'Garage and entrance stay clear · no roof/upstairs lights · door threshold unlit',16)+text(45,501,'Plan view · standing props and schematic service banks',23);
const px=x=>100+x*110,pz=z=>555+z*58;
layout+=`<rect x="100" y="555" width="935" height="244" fill="#263846"/><rect x="100" y="555" width="368.5" height="244" fill="#33414a"/><rect x="540" y="555" width="165" height="244" fill="#33414a"/>`;
layout+=text(130,680,'Garage access',16)+text(548,680,'Entrance',16);
for(const t of HOUSE.planters.tiles){const half=HOUSE.planters.size/2;layout+=`<rect x="${px(t.x-half)}" y="${pz(t.z-half)}" width="${HOUSE.planters.size*110}" height="${HOUSE.planters.size*58}" fill="#2f3a2c" stroke="#5d7a4a"/>`;}
layout+=text(px(6.2),pz(3.95)+16,'Planting tiles',13);
for(const p of PROPS.filter(p=>!p.path)){const pts=propPositions(p);layout+=`<polyline points="${pts.map(([x,,z])=>`${px(x)},${pz(z)}`).join(' ')}" stroke="${palette[p.bank]}" stroke-width="4" fill="none"/>`;if(p.id.startsWith('Pole'))layout+=`<circle cx="${px(pts[0][0])}" cy="${pz(pts[0][2])}" r="5" fill="#80caff"/>`;}
for(const [bank,[x,,z]] of Object.entries(BANK_POSITIONS))layout+=`<rect x="${px(x)-10}" y="${pz(z)-9}" width="20" height="18" fill="${palette[bank]}"/>`+text(px(x)-5,pz(z)-14,bank,13);
layout+=text(45,840,'19 props · 954 addresses · 27 fused feeds · strips total 15.4 m including corner/slack allowance',17);
out('layout.svg',svg(layout));
let wiring=text(45,43,'Power and data · approved facade edition',27)+text(45,76,'Independent 12 V PSU positives. Fuses protect actual conductors; final cable sizing and fuse approval required.',14);
wiring+=`<rect x="45" y="103" width="1110" height="66" class="box"/>`+text(64,131,'One shared soundtrack/timeline → Ethernet switch → three controllers',19)+text(64,155,'WLT2 bank files preserve native PTS; an FSEQ adapter and physical latency verification remain required.',14);
for(const [j,[bank,b]] of Object.entries(BANKS).entries()){
 const y=199+j*168;
 wiring+=`<rect x="45" y="${y}" width="310" height="130" class="box"/><rect x="400" y="${y}" width="310" height="130" class="box"/><rect x="755" y="${y}" width="400" height="130" class="box"/>`;
 wiring+=text(62,y+27,`${bank}: controller + 320.4 W PSU`,20)+text(62,y+54,`${b.ports} ports · channels ${b.channelStart}–${b.channelEnd}`,15)+text(62,y+81,`${b.count} addresses / ${fmt(b.watts)} W max`,15)+text(62,y+107,'DDP receive offset 0 · data + GND',14);
 wiring+=text(417,y+28,`${b.sections} fused injection branches`,20)+text(417,y+55,`Pixel load ${fmt(b.watts/12)} A at 12 V`,15)+text(417,y+82,'Rated ≥30 A distribution bus',15)+text(417,y+108,'V+ isolated at section boundaries',14);
 const names=PROPS.filter(p=>p.bank===bank).map(p=>p.id);
 wiring+=text(773,y+28,`${bank} props`,20)+text(773,y+57,names.slice(0,4).join(' · '),14)+text(773,y+82,names.slice(4).join(' · '),14)+text(773,y+108,'Detailed endpoints: power-feeds.csv',14);
 wiring+=`<path d="M355 ${y+60} H400 M710 ${y+60} H755" stroke="${palette[bank]}" stroke-width="4" fill="none"/>`;
}
wiring+=text(45,749,'Feed split: 12 × 50-node arch/star · 10 × 20-node pole · 28 / 32 / 32 / 31 / 31 strip groups',16)+text(45,780,'Provisional fuses: bullets 4 A · poles 1.5 A · strips 2.5 A. No controller V+ bypass of injection protection.',14)+text(45,811,'Facade cables rise on the right, then route at y=2.55 m above the door lintel. Threshold and paving stay clear.',14)+text(45,842,'Design maximum 686.88 W, excluding overhead/losses; requires strip ≤7.2 W/m at 10 addresses/m.',14);
out('wiring.svg',svg(wiring));
const htmlEscape=s=>esc(s).replaceAll('"','&quot;');
function markdown(s){
 let table=false;const parts=[];
 for(const line of s.split('\n')){
  if(line.startsWith('|')){if(/^\|[\s:|\-]+\|$/.test(line))continue;const tag=table?'td':'th';if(!table){parts.push('<table>');table=true;}parts.push('<tr>'+line.slice(1,-1).split('|').map(c=>`<${tag}>${inline(c.trim())}</${tag}>`).join('')+'</tr>');continue;}
  if(table){parts.push('</table>');table=false;}
  const heading=line.match(/^(#{1,6}) (.*)/);parts.push(heading?`<h${heading[1].length}>${inline(heading[2])}</h${heading[1].length}>`:line?`<p>${inline(line)}</p>`:'');
 }
 return parts.join('\n');
}
function inline(s){return htmlEscape(s).replace(/\[([^\]]+)\]\(([^)]+)\)/g,'<a href="$2">$1</a>').replace(/\*\*([^*]+)\*\*/g,'<strong>$1</strong>').replace(/`([^`]+)`/g,'<code>$1</code>');}
let html=markdown(readFileSync(new URL('../outputs/christmas-show-project.md',import.meta.url),'utf8'));
html=html.replace('<h2>3. Pixel and channel schedule</h2>','<img src="layout.svg" alt="Approved facade layout"><h2>3. Pixel and channel schedule</h2>').replace('<h2>6. Sequencing and timing</h2>','<img src="wiring.svg" alt="Updated bank wiring"><h2>6. Sequencing and timing</h2>');
out('christmas-show-project.html',`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Winterlight · Approved facade build guide</title><style>body{font:16px/1.65 system-ui;color:#18313d;background:#eef3f5;margin:0}main{max-width:1100px;margin:30px auto;padding:40px;background:white}h1{font-size:34px}h2{margin-top:35px}img{width:100%;height:auto}table{border-collapse:collapse;width:100%;font-size:13px}td,th{padding:7px;border:1px solid #dce5e9;text-align:left}a{color:#166697}code{background:#eef3f5} @media print{main{margin:0;padding:0}body{font-size:10pt}tr,img{break-inside:avoid}}</style><main>${html}</main></html>`);
if(PROPS.at(-1).channelEnd!==CHANNEL_COUNT||feeds.length!==FEED_COUNT||Object.values(BANKS).some(b=>b.ports>8||b.watts>320.4))throw new Error('Invalid hardware schedule');
console.log(`Updated guide, layout/wiring diagrams, BOM and controller/feed CSVs: ${PIXEL_COUNT} addresses / ${CHANNEL_COUNT} channels / ${FEED_COUNT} feeds.`);
