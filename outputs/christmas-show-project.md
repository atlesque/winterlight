# Belgian house Christmas light show — build project

Prepared 8 October 2026. Recommended design: 1,050 individually addressable RGB pixels, entirely at ground level, xLights sequencing and FPP playback over wired Ethernet. This is an adaptation of the referenced show under the access constraints. It is not a verified frame-for-frame clone or a ready-to-upload sequence.

## 1. Evidence and boundaries

The recovered conversation contains two JPEGs: a reference-show still and a decorated Belgian brick-house image. Both were visually inspected. The house image shows a two-story brick facade, garages on the left, a central door and path, and planting on the right. It may be an earlier edited concept: existing lighting, snow, exact dimensions, fixing points and electrical provision cannot be inferred as real. Use the geometry for placement; measure on site before buying frames.

Prior instructions exclude Christmas trees, wall-mounted lights, door garland and access near the high roof. This project also excludes all roof/eave/window outlines, hanging icicles, facade wash lights and lights on either garage. The four removal coordinates are preserved: (79%,23%), (35%,23%), (93%,30%) and (4%,43%) in the prior image. Their exact marked-image extent is unavailable; conservatively keep the entire upper facade and left garages unlit rather than treating each coordinate as a tiny point. No props are fixed to brickwork. Nothing is attached to the door or its surround.

**Verified video metadata:** the [artist's official YouTube video](https://www.youtube.com/watch?v=pWBjl-jPcVM) is titled “Trans-Siberian Orchestra — Wizards in Winter (Official Music Video) [HD]”; its description identifies *The Lost Christmas Eve* (2004). The player displays 3:05. Browser access worked after the ordinary webpage fetch returned an error. No audio file was extracted.

**Direct visual samples:** approximately 0:06 shows a mostly dark facade and a small illuminated central sign/ground accents; 0:26 shows isolated warm ground props; 0:55 shows roof/garage icicles, green circular window motifs and a central circular motif; 1:32 shows a large warm-white cone with a top star and smaller warm ground forms; 2:10 is largely dark; 2:47 shows warm facade outlines/icicles, blue boundary lighting, circular motifs, red vertical ground shapes and the tall tree. These are sampled states, not exact effect onset times. The supplied reference still additionally shows a “HAPPY HOLIDAYS” sign and similar props.

**Not verified:** original lamp counts, controller, wiring, channel assignments, exact BPM, note timings, fade lengths, all prop identities, or a downloadable original sequence. Do not describe the original as an addressable RGB-pixel installation based on these observations. Colour chases, arches, stars and a matrix below are our proposed replacements.

| Reference visual role | Accessible replacement | Status |
|---|---|---|
| Warm outlines and icicles | Four short freestanding bars; staggered downward wipes | Adaptation; no high installation |
| Tall star-topped cone | Two low freestanding stars plus upward sweeps on bars | Adaptation; respects no-tree preference |
| Circular window motifs | Star-ring effects on low stars; optional circles displayed on panel | Adaptation; no wall/window fixing |
| Small ground forms / alternating groups | Four low arches with left/right call-and-response | Adaptation; arches not confirmed in original |
| Blue illuminated boundary | Arches at dim blue between musical hits | Adaptation |
| Central holiday sign | Optional 25 × 10 pixel panel | Adaptation; low resolution suits large initials/icons or scrolling text |

## 2. Layout that fits the house

See `layout.svg`: a schematic, not a measured overlay. All new lighting sits within the right-hand private planting area. Keep the central entrance route, garage openings, parking and public footway clear. Do not assume space between shrubs is usable until measured. If the garden cannot hold four arches, build the starter tier with two; do not move equipment into the driveway or removal zones.

Maximum proposed prop height is 1.2 m, assembled flat on the ground and lifted onto bases by hand. Four arches are about 0.9–1.0 m wide and 0.45–0.55 m high; use two parallel pixel rows of 50 nodes per arch rather than forcing a 100-node supplied string into an unrealistically short curve. Four bars are about 1 m tall with 50 nodes at about 20 mm spacing. Two stars are about 0.6–0.8 m across, on short freestanding stands with total height under 1.2 m. The 25 × 10 matrix at 50 mm pitch has an active area about 1.2 × 0.45 m. Frame margins add size. Pixel wire length may exceed hole pitch; secure excess behind each prop without sharp folds.

Use weighted removable bases on paving or suitable stakes in private soil after checking buried services. Coro and panels catch wind: use two-point restrained bases, protected edges and short secured restraints entirely inside the bed. Determine ballast on site; no invented universal ballast weight. Remove props for severe wind. Plants are not structural supports. No ladder is needed for assembly, service or removal.

## 3. Pixel and channel schedule

Use one batch of 12 V WS2811 **individually addressable** 12 mm bullet pixels, RGB, matching connector/pinout and spacing. Avoid 12 V strips that control three LEDs as one pixel if expecting independent bulbs. Existing strips/spools can substitute only after voltage, protocol, logical pixel count, RGB order and outdoor suitability are checked; do not mix a 5 V strip onto 12 V.

| Model | Pixels | Global RGB channels | Power bank / data port |
|---|---:|---:|---|
| Arch 1 | 100 | 1–300 | A / 1 |
| Arch 2 | 100 | 301–600 | A / 2 |
| Star 1 | 100 | 601–900 | A / 3 |
| Bar 1 | 50 | 901–1050 | A / 4 |
| Arch 3 | 100 | 1051–1350 | B / 1 |
| Arch 4 | 100 | 1351–1650 | B / 2 |
| Star 2 | 100 | 1651–1950 | B / 3 |
| Bar 2 | 50 | 1951–2100 | B / 4 |
| Matrix, 25 columns × 10 rows | 250 | 2101–2850 | C / 1 |
| Bar 3 | 50 | 2851–3000 | C / 2 |
| Bar 4 | 50 | 3001–3150 | C / 3 |
| **Total** | **1050** | **3150** | **350 pixels per bank** |

Build arches as two 50-node lines linked for data and mapped as two layers/custom models. Stars are custom 100-node designs with numbered insertion paths. If a purchased prop has a different hole count, update the model and BOM before assembly rather than leaving unaccounted pixels. Matrix: ten horizontal rows of 25, serpentine from lower left when viewed from the street; mark input corner and every row direction. 250 pixels cannot show detailed video.

Each Ethernet controller receives 1,050 channel values (350 RGB pixels), mapped to its local ports. Global FPP channel start A=1, B=1051, C=2101. DDP destination offset normally starts at zero for each controller; map FPP's global source range to the receiving controller's local buffer. Validate against the chosen controller's configuration interface; global channel numbers are not an instruction to offset every receiver by its global start.

DDP is preferred. If using sACN/E1.31 instead, a separate simple plan is 510 channels per universe: A uses U1=510 and U2=510 and U3=30; B uses U4/U5/U6; C uses U7/U8/U9. Each bank has 1,050 channels. These are deliberately bank-separated universes, not the compact seven-universe global packing. Do not mix the two mappings.

## 4. Controller and playback recommendation

**Recommended:** three wired eight-port show controllers such as Baldrick8, one per 350-pixel power bank. Spare outputs are capacity for reconfiguration, not permission to add unbudgeted current. Use xLights on the computer to model and sequence; export FSEQ and the lawfully obtained exact music file to one Raspberry Pi running Falcon Player (FPP). FPP is the single playback/audio clock. Connect FPP and all controllers through an indoor Ethernet switch. Audio leaves the Pi via a supported USB sound adapter to a small speaker inside/sheltered beside the house. Start with computer playback during bench commissioning to postpone the Pi purchase if desired.

Assign reserved local IP addresses, label A/B/C and keep the show network private. Enable only the protocol actually used and one realtime sender. Save controller configuration backups and the xLights show folder. No Internet dependency should remain during scheduled playback. FPP playlists can play one show at chosen evening times; Europe/Brussels timezone and clock must be set correctly. Suggested household schedule: 18:00–20:30, one song every 15 minutes, dim/static between shows, off afterwards, adjusted for neighbours and municipality requirements.

**WLED alternative:** Ethernet-capable ESP32 controller with buffered outputs, fusing and correctly sized power distribution; not a bare development board carrying pixel current. WLED is a receiver/test-effects engine, not the master music sequencer. Use DDP input and disable sound-reactive/autonomous effects during scheduled playback. Its [DDP documentation](https://kno.wled.ge/interfaces/ddp/) states it ignores incoming timecodes; one FPP sender and wired network reduce jitter but do not make receivers hard-genlocked. Read the [WLED realtime guidance](https://kno.wled.ge/interfaces/e1.31-dmx/) and validate the actual board/firmware output limits. Do not choose a single Wi-Fi ESP32 for all 1,050 pixels to save a small part of the total budget.

Sequence at 40 frames/s (25 ms). A 250-pixel WS2811 port has approximately 7.5 ms of data transmission at 800 kbit/s plus reset; the largest proposed port is well below a 25 ms frame interval. This calculation is not a guarantee of whole-system timing. Verify RGB order, correct port lengths, matrix direction and no frame losses with every prop active. See [xLights documentation](https://manual.xlights.org/) and [Falcon Player](https://github.com/FalconChristmas/fpp).

## 5. Power, wiring and weather protection

This is a low-voltage display downstream of professionally verified mains supplies. It is a planning specification, not instructions for DIY exposed 230 V work. Have a qualified Belgian electrician check the outdoor outlet, earthing, cable route, required protection and any new fixed installation under the [current AREI/RGIE](https://economie.fgov.be/nl/publicaties/algemeen-reglement-op-de). Use a suitable 30 mA RCD-protected supply as the project design requirement; the existing main differential alone is not a substitute for checking the outdoor circuit. Applicable protection and inspection depend on the installation.

Sizing assumes a conservative **60 mA per 12 V pixel at full RGB white**: 50 nodes=3 A/36 W; 100=6 A/72 W; 250=15 A/180 W. Total=63 A at 12 V, or 756 W. Three 350-node banks each need21 A/252 W. The [Mean Well RSP-320-12 datasheet](https://www.meanwell.com/Upload/PDF/RSP-320/RSP-320-SPEC.PDF) specifies26.7 A/320.4 W, so 21 A is about79% utilization before controller consumption and thermal derating. Allow a few watts for each controller, verify hot-enclosure derating, and increase PSU size/reduce bank population if its permitted continuous output falls below the actual demand. Full system mains draw is higher than756 W because of conversion losses; allow roughly0.9–1.0 kW plus player/audio, and have circuit/inrush checked. Pixel variants with lower measured demand do not justify smaller protection without their actual maximum specification.

Use an initial artistic brightness cap around25–30%, but size hardware for full white. Neither a software cap nor WLED current estimation is a protective fuse. A rough energy upper bound at1 kW for3 hours is3 kWh; actual music operation will be lower and should be measured. Multiply measured kWh by your own tariff.

**Preferred physical arrangement:** keep PSUs, controller boxes, player and mains plugs in a dry ventilated utility/garage position close to the right garden; only low-voltage feeds and suitable outdoor Ethernet reach the props. Confirm a cable route without pinching windows/doors or crossing the path. A sheltered garage position must still avoid vehicle impact and condensation. If distance makes short data/power routes impossible, use professionally assembled, documented outdoor mains/controller enclosures or supported differential pixel transmitter/receiver links near the bed. An outdoor-looking box with no specified assembled IP/thermal rating is not verified rain-ready.

See `wiring.svg`. All mains connections, class-I PSU protective earth, terminal covers, separation, strain relief and isolation are part of the qualified assembly. The RSP-320 is an enclosed component with vents and mains terminals, not itself a sealed garden supply. Never place it in a sealed plastic box without a justified thermal design. Each bank has its own PSU; never parallel their positive outputs. Keep all prop sections and injection feeds on their assigned bank. Across any inter-bank data link carry only the reference ground and data as specified by the controller, with positive disconnected; this project avoids such links entirely.

**Power injection design:** break positive continuity into 50-node electrical sections, with a separate fused12 V feed and return to each section. There are21 sections across the display. Data continues in the numbered direction; reference grounds remain common within a bank. For100-node props feed two50-node sections; matrix feed five50-node blocks, each covering two25-node rows. Feed a section at both ends from its **same fused branch** if terminal voltage requires it. Do not connect independently fused positives through an intact pixel positive wire: it can backfeed and undermine protection.

Start branch design at a4 A DC-rated fuse per50-node section carrying3 A maximum, subject to verified cable/connector ratings, ambient derating and fuse time/current curves. A5 A controller output is not a suitable sole6 A supply for100 nodes. Use controller data/GND only where necessary, with dedicated fused power distribution sized for21 A per bank. Confirm with the supplier that the controller supports this arrangement. Position every branch fuse at its power source so the entire outgoing cable is protected. Any smaller downstream wire must also be adequately protected; do not use a large trunk fuse as protection for every thin pixel lead.

Illustrative short branch: 2 × 1.5 mm² copper power cable, 2 m one-way length,3 A gives voltage drop about0.14 V using0.0175 Ω·mm²/m at room temperature. At5 m it is about0.35 V before connectors/pixel leads. This is a voltage-drop example, not an ampacity certification. Hot wires have more resistance. Long runs may require2.5 mm², a local bank or additional same-bank feeds. Measure voltage at the last node under sustained full white and compare to the pixel manufacturer's permitted range. Do not raise PSU voltage beyond pixel specifications to mask drop.

Use outdoor-rated cable, genuine mating connectors with confirmed voltage/current/pinout, rated glands, drip loops and strain relief. Keep joints and boxes above puddles/snow level and protected from sprinklers/standing water. IP68 pixels do not make their splices, connector ends or entire assembly IP68. Ordinary JST plugs belong inside dry enclosures. Seal cut ends using adhesive-lined heat shrink and an appropriate sealed splice system; do not rely on tape alone. Provide protected ventilation/condensation management for boxes, caps on unused ports, UV-resistant ties and clear labels. No buried connectors or mains extension joints on wet ground. Ramp any unavoidable private walking crossing and keep public pavement clear. Unplug before connecting, inspecting or repairing; test RCD as instructed and stop on water ingress, repeated fuse/RCD trips, hot connectors or damaged insulation.

## 6. Sequencing and timing

Obtain a lawful local copy of the intended recording; music subscriptions/YouTube playback are not a dependable FPP audio source. Confirm whether it matches the video edit: player duration3:05 alone does not prove identical audio offsets. Set sequence length from that file, choose40 fps, import waveform and add separate timing tracks for phrase boundaries, beats and major accents. Auto-detected beats must be corrected by ear. Captions such as “[Música]” do not provide cue timing.

Use the observed video timestamps only as navigation anchors. Proposed choreography:

| Musical cue to mark in your audio | Proposed effect |
|---|---|
| First motif / sparse opening | Bars alternate warm-white pulses; stars stay dim |
| Answering phrase | Arch1/2 then Arch3/4 chase; avoid illuminating the path |
| Strong ensemble accent | Brief warm-white hit on stars and arches, followed by dark space |
| Fast repeated notes | Short blue/white chases on arches; single group at a time |
| Sustained phrase | Bars rise slowly and stars expand from centre |
| Repeat / build | Mirror left/right groups; introduce restrained red and green |
| Final broad passage | All low props in warm white plus blue arches; matrix holiday icon |
| End of actual audio | Fade to zero, then scheduled dim static preset if wanted |

These are proposed effects, not measured onset times or original BPM. The included cue worksheet deliberately leaves exact times blank. To approach a clone, review the full reference with audio, log every change, then translate inaccessible roof/tree groups into these low groups. The limitation is visual scale: a1.2 m garden show cannot reproduce the original tall facade/tree silhouette. Avoid rapid full-display strobing; moderate pulse depth and brightness improve neighbour comfort and video readability.

## 7. Budget and purchasing gates

| Purchase | Quantity | Observed price / allowance | Link and limitation |
|---|---:|---:|---|
| 12 V WS2811 50-node strings | 23 (21 installed, 2 spare) | €11.99 German VAT each; approximately €280 total at Belgian VAT | [Pixel Imperium](https://pixel-imperium.de/ws2811-pixel-string-12mm-12v-ip68); choose matching xConnect variant |
| Assembled Baldrick8 + RSP320 kit | 3 | €220 each / €660 | [Propixeler NL](https://www.propixeler.nl/product/baldrick8-pre-build-ki); select12 V; confirm fuse/distribution, stock, thermal and enclosure ratings |
| Arch100 coro blank | 4 | €25 each / €100 | [Propixeler arches](https://www.propixeler.nl/product-categorie/coro/bogen); dimensions and support extra |
| Custom100-node stars, matrix and bars | 1 set | €100–200 estimated | Local sign fabricator/DIY; no verified100-node star product |
| DC cable,21 fused branches, plugs, supports and weather protection | 1 set | €180–350 estimated | [Injection adapter example](https://pixel-imperium.de/xConnect-T-connector-Power-Injection-323) €3.49 German VAT; adapter is not a fuse or a positive-isolation device |
| FPP player/storage/power/network/wired audio | 1 set | €120–220 estimated | Buy supported Pi kit locally after checking FPP image compatibility; retail quote still needed |
| Shipping, extra distribution and contingency | — | €250–690 estimated | Site routing and supplier kit confirmations determine this |

The resulting rounded shopping/build allowance is €1,700–2,500 before electrician labour and rights fees. A readily available [150-node Starflair](https://www.propixeler.nl/product/starflair) costs €25 per blank but is not a drop-in substitute: two increase the show to1,150 nodes and require a revised bank/power map. An [Ethernet Dig-Octa WLED brainboard](https://nl.quinled.shop/Huis-en-kantoor/Quinled-LED-verlichting/Dig-Octa/QUINLED/QuinLED-Dig-Octa-Brainboard-32-8L-QLD-DOBB-p_41968.html) was listed at €39.99 with no stock and an estimated2–3 weeks; powerboard, PSU, enclosure and assembly are extra.



The separate sourcing report lists checked merchant links and prices. Treat published prices as observations on8 October2026, not quotes; delivered Belgian VAT, shipping, stock, firmware, pixel spacing and enclosure suitability must be reconfirmed. Do not order until the site measurements, controller kit details and power routing fit.

| Tier | Scope | Planning total, delivered/assembled allowances |
|---|---|---:|
| Starter | Two100-node arches + two50-node bars;300 nodes; one320 W bank; computer playback | €650–1,050 |
| Recommended | Four arches, four bars, two stars,250-node panel;1050 nodes; three banks; FPP | €1,700–2,500 |
| Expanded | About1500 nodes, larger low panel/more ground props; five350-or-fewer banks or redesigned larger supply system | €2,800–4,000 |

Totals are estimates including pixels/spares, controllers/PSUs, frames, cable/fuses/connectors, player and contingency; electrician work, music permissions, optional sequence purchases and new household circuits are separate. Expansion keeps the same access exclusions. Do not add a tree or facade lights to spend the expanded budget.

## 8. Assembly and acceptance plan

1. **Survey, half day:** measure usable garden width/depth, prop viewing lines, door/parking clearance, outlet location and each one-way cable route. Photograph/label the four exclusion zones. Inventory existing LEDs by voltage/protocol and condition. Choose starter if space is insufficient.
2. **Electrical review and sample order:** agree protected supply and bank location with electrician. Buy one50-node sample, connector set and one controller first. Require controller/output fuse limits, power-injection method, bank current rating and thermal/enclosure documentation.
3. **Bench proof, one day:** verify voltage/polarity with a meter before plugging pixels; run RGB singles, numbered chase and full white. Measure sample current and far-end voltage. Keep conventional unbuffered first-pixel data runs around1–2 m initially, test the actual cable, and use the controller maker’s supported differential link for longer unreliable routes; Ethernet length is not the pixel-data length. Check xLights→controller; then FPP→controller with the same audio/output map. Save working configuration.
4. **Frame build, one–two weekends:** create a full-size template, drill suitable bullet holes or use vendor coro props, deburr, push pixels without stressing wires, number inputs, secure wiring to the back. All construction is at table/ground height. Cut/seal only with power removed. Label every50-node power section.
5. **Full electrical test:** qualify all21 branches, fuse values, connector ratings and polarity. Test every prop at maximum configured demand; perform a supervised30-minute full-white thermal check. Check voltage/current per bank and hot spots; no hot connectors, resets or colour loss. Inspect earth/RCD provision with electrician. Software limiting is supplementary.
6. **Dry outdoor install, half–one day:** secure bases, route feeds, elevate joints, fit drip loops/caps, verify no path or public-footway obstruction. Confirm weather suitability before exposure; no improvised live hose test. Inspect after first rain with power disconnected.
7. **Sequence, roughly10–25 hours for first song:** build the eleven models, mark verified audio cues, create groups, compose and render. Test all pixel addresses and take a street-view recording from a safe position. Adjust overall audio/video latency; Bluetooth speakers introduce variable delay, so use wired audio.
8. **Dress rehearsal:** run at least three complete loops plus scheduled start/stop and restart after power loss. Test a disconnected network lead: controllers must return to a safe dark state using documented loss-of-data behavior or player-managed shutdown; configure and verify actual behavior, don't assume it. Keep an accessible master isolation point.
9. **Operate/store:** inspect before each session and after severe weather; keep a maintenance log. Keep spare50-node strings, fuses, pigtails and seals. Power off before swapping. Dry equipment before indoor storage; retain labels, layout and configuration backups.

For Christmas2026: survey and proof by18 October; main order by25 October; build and power tests through15 November; sequence and rehearsal by29 November. These are suggested milestones, dependent on stock and personal availability. No procurement or installation has been performed.

## 9. Music, public playback and local operation

Ask [Unisono](https://www.unisono.be/nl/knowledgebase/heb-ik-een-licentie-nodig-voor-mijn-prive-evenement-of-een-evenement-dat-ik-organiseer-in-familiekring) for the classification/permission covering a residential outdoor Christmas show audible to passers-by, including recording rights and the intended dates. Its family-circle exemption has conditions; a free display on private land does not automatically qualify when advertised or aimed at a street audience. Buying a track or sequence does not itself clear public-performance rights. Keep the receipt/licence for the exact audio file. A public-domain composition can still have a copyrighted arrangement and recording; an alternative commissioned recording needs explicit public playback and online video rights.

Publishing a video with the commercial track can require separate synchronization/master permissions and may trigger platform claims; an event/public-playback licence is not automatically a video licence. Confirm requirements with the rightsholders/Unisono for the planned uses. Check municipality/neighbour expectations for noise, operating hours and audience obstruction. No speaker volume/dB limit is invented here.

Use a quiet wired speaker as the default. Belgian BIPT's exemption for tiny FM audio transmitters is limited; typical0.1–1 W Christmas-show transmitters should not be bought as a presumed legal solution. The [BIPT interface](https://www.bipt.be/file/cc73d96153bbd5448a56f19d925d05b1379c7f21/33f41557d82019ffc913e797d2ea2cebde9fac4b/25-11-b-nl.pdf) specifies87.5–108 MHz, at most50 nW ERP and occupied bandwidth up to200 kHz for this exemption. A phone stream is an option for quiet operation but adds buffering latency and needs explicit rights to stream; a simple QR song link will not keep visitors synchronized.

## 10. What remains to make this order-ready

Site dimensions/cable lengths; real status of existing strips; exact purchased prop node counts; supplier-confirmed controller/enclosure and distribution specifications; electrician's circuit assessment; lawful matching audio and corrected cue times; public-playback classification. The project supplies a conservative build specification and alternatives without claiming these unresolved facts are verified.

Supporting files: `layout.svg`, `wiring.svg`, `pixel-map.csv`, `cue-worksheet.csv`, `eu-sourcing-research.md`, `technical-research.md`. A consolidated HTML copy is provided for reading/printing.
