# EU sourcing research — Christmas pixel show

Checked 8 October 2026. No purchase or supplier contact made. Prices are observed merchant prices, not delivered Belgian quotes; recheck variant, Belgian VAT, delivery charges and stock at checkout. Netherlands and Germany sources avoid a UK import as the main route.

## Recommended buying route

Use a Netherlands specialist for the controller assemblies and props, and a documented German pixel supplier for pixels and matching injection accessories. For a 1,050-pixel build, do **not** assign 500–550 conventional 12 V pixels to one 320 W PSU. Use three power banks of 350 pixels, or four banks where avoiding power breaks inside props is simpler.

| Item | Verified merchant offer | Availability / caveat |
|---|---|---|
| 12 V individually addressable WS2811 12 mm bullet strings | [Pixel Imperium](https://pixel-imperium.de/ws2811-pixel-string-12mm-12v-ip68), €11.99–€23.98 incl. German 19% VAT for 50/100 variants | Available immediately; select **black cable, xConnect**, then Belgium. Price is variant-dependent; Belgium gross price may be approximately €12.19/€24.38 if the net remains unchanged and 21% VAT applies. |
| Alternative Netherlands pixels | [Propixeler 12V WS2811 Pixels](https://www.propixeler.nl/product/12v-ws2811-pixels), €12–€24 incl. VAT, 50/100 pixels | 18 AWG / 0.75 mm² cable, IP68, Xconnector. Page has purchasing option but no explicit stock count. Max power not published on this page: obtain supplier value before final electrical design. |
| 8-output Ethernet show controller | [Propixeler Baldrick8](https://www.propixeler.nl/product/baldrick8), **€75 incl. VAT** | Current product page says in stock. Category page still says €70; use product price. DDP, Art-Net and sACN; merchant states 750 pixels/output at 40 fps. Eight pixel outputs, onboard fuses. External player still needed for musical sequences. |
| Ready assembled 12 V controller + PSU enclosure | [Baldrick8 pre-build kit](https://www.propixeler.nl/product/baldrick8-pre-build-ki), **€220 incl. VAT** | Select 12 V. Includes controller, Meanwell RSP320, medium enclosure, eight Xconnector pigtails, 4 mm² internal power leads, nine glands, mains lead and network feedthrough. No explicit stock or assembled IP/thermal rating published; supplier confirmation required. Three units €660. |
| DIY version of above | [Baldrick8 build kit](https://www.propixeler.nl/product/baldrick8-build-kit), €185 incl. VAT | Same components, assembly needed, mains lead excluded. Three €555; use competent electrician for mains assembly. |
| Standalone PSU | [Meanwell RSP320 12V at Propixeler](https://www.propixeler.nl/product-categorie/accessoires/voedingen), €59.50 incl. VAT | Category listing verified; product fetch challenged. Building-in PSU requiring enclosure/protected terminals. Not itself a waterproof supply. |
| Coro arch blanks | [Propixeler arches](https://www.propixeler.nl/product-categorie/coro/bogen), Arch 100 €25 incl. VAT | Four €100. Pixels and independent ground support are extra. Confirm actual dimensions, 100-hole model, lead time and xLights model with supplier; individual page not readable. |
| Ready star alternative | [Starflair](https://www.propixeler.nl/product/starflair), €25 incl. VAT | **150 pixels**, 60 × 60 × 1 cm, white/black. Two require 300 pixels, increasing this design to 1,150. Do not silently substitute into a 100-pixel star plan. |
| Larger star alternative | [Propixeler star category](https://www.propixeler.nl/product-categorie/coro/ster), Star 200 €30 incl. VAT | Two would require 400 pixels instead of 200. Appropriate only after updating pixel/power counts. |
| 100-pixel stars / 250-pixel matrix | Custom DIY holes in UV-stable coro or custom cut by local sign fabricator | Estimates: €30–€60 for two star blanks; €30–€60 matrix blank. These are estimates, not verified stock products. Purchase no generic mains LED star as a pixel substitute. |
| Injection T adapters | [Pixel Imperium xConnect T 3:2:3](https://pixel-imperium.de/xConnect-T-connector-Power-Injection-323), €3.49 incl. German VAT | Available immediately; IP65, 0.75 mm², max 10 A published. At 21% unchanged net, approx €3.55. Confirm pinout and feed voltage. |
| End caps | [xConnect end cap](https://pixel-imperium.de/end_cap-xconnect_for_3_pin_connector-plug), €0.29 incl. German VAT | Available immediately; cap every unused end. Approx €0.30 at 21% unchanged net. |
| Pixel mounting strip | [Black 12 mm mounting strip](https://pixel-imperium.de/Mounting-strip-for-12mm-LED-Pixel-black), €2.59 per approximately 2.42 m; 50 m roll €39.99 linked on pixel page | Available immediately. For freestanding bars, fasten to rigid PVC/aluminium uprights, not to house walls. Verify hole pitch matches planned physical geometry. |
| Extensions / pigtails | [Pixel Imperium pixel page accessories](https://pixel-imperium.de/ws2811-pixel-string-12mm-12v-ip68) | Three-pin extensions available but price on request; pigtails €2.59 **out of stock**. Kit already contains pigtails; budget separately for extensions/injection leads. |

## Electrical evidence and procurement limits

Pixel Imperium publishes **36 W / 3 A maximum per 50 pixels** and 72 W / 6 A per 100 pixels. Thus use 0.72 W / 60 mA per pixel for this resistor-pixel design. 1,050 pixels are 756 W / 63 A at full white before controller overhead. The merchant recommends about 20% PSU reserve and warns that JST-SM is not watertight. Pixel bodies are IP68, but mated xConnect connectors are IP65; sealed pixel rating does not waterproof connectors or cuts.

[Meanwell official RSP320 datasheet](https://www.meanwell.com/Upload/PDF/RSP-320/RSP-320-SPEC.PDF): RSP-320-12 is 12 V, 26.7 A, 320.4 W; 20–90% RH **non-condensing**, -30 to +70 °C with derating curve. Maintain suitable ventilation/thermal capacity and manage condensation inside enclosure. 350 pixels = 252 W, leaving 68.4 W for overhead and reserve; 400 pixels = 288 W, only about 10% headroom. A 500-pixel bank needs 360 W and overloads this supply at full white. Brightness caps are operational controls, not substitutes for correct fuse and PSU sizing.

The assembled kit merchant claims outdoor use, but publishes no complete enclosure IP rating, gland seal test, condensation plan, grounding report or full-load thermal rating. Confirm these, controller bank-current limits, fuse values and exact PSU version before paying. Mount boxes elevated on an independent stand, sheltered, gland entries downward and drip loops. Match Xconnector/xConnect geometry **and pin assignment**, not just the name. Prefer one connector supplier. Fuse each injection feed at its source. Do not parallel independent PSU positive outputs through a pixel chain.

## WLED alternative

[QuinLED Dig-Octa Brainboard official NL store](https://nl.quinled.shop/Huis-en-kantoor/Quinled-LED-verlichting/Dig-Octa/QUINLED/QuinLED-Dig-Octa-Brainboard-32-8L-QLD-DOBB-p_41968.html) is €39.99 incl. VAT, eight level-shifted outputs, ESP32, built-in Ethernet. On check: warehouse **out of stock**, estimated 2–3 weeks. This is only the brainboard; fused powerboard, PSU, enclosure and harness are additional. It is a good WLED choice when the user wants WLED's local effects as well as external show streaming, but the assembled Baldrick route is easier to specify for this project. Do not price the bare brainboard as a complete outdoor controller.

## Working 1,050-pixel budget (estimates marked)

Buy 23 × 50-pixel strings = 1,150 pixels, leaving 100 spares: about €280 at indicative Belgian VAT for the German offer, or €276 at the Dutch observed price. Three assembled 320 W controller boxes: €660. Four arch blanks: €100. Two DIY 100-pixel stars, matrix blank and bar frames: **estimated €100–€200**. Injection connectors/caps/extension leads, DC cable, fused distribution changes, cable covers and stakes: **estimated €180–€350**. FPP player, storage, PSU and wired network/audio accessories: **estimated €120–€220**. Safety/electrician allowance and final transport: **estimated €150–€300**. Total planning envelope: **about €1,590–€2,110**, excluding music rights fees, labour to sequence/build and any replacement garden landscaping.

If using off-the-shelf 150-pixel Starflair stars, revise count to 1,150 and bank loading before order. For 350/350/350 banks on the exact 1,050 design, assign A = two 100-pixel arches + one 100-pixel star + one 50-pixel bar; B = same; C = 250-pixel matrix + two 50-pixel bars. Use dedicated fused feeds sized for each 50-pixel power section, with data routed across sections and common DC return where required. Keep independently supplied positive rails isolated.

[Pixel Imperium shipping policy](https://pixel-imperium.de/shipment) lists all EU member states and destination-country VAT for EU deliveries. Standard EU delivery observed: up to 3 kg €24.90, 5 kg €27.90, 10 kg €34.90, 20 kg €47.90. Final packed weight determines cost; this verifies Belgium as within the published shipping region without claiming an exact quote.

## Pre-order confirmation list

1. Measure frontage and exact available ground areas before committing to four arch sizes.
2. Confirm Belgian delivery, VAT and all connector variants with merchants.
3. Confirm selected pixels' exact full-white current, cable spacing and connector pinout.
4. Confirm controller input-bank ratings, fuse values, enclosure ingress rating and thermal/condensation guidance.
5. Obtain custom 100-pixel star / 250-pixel matrix cut quote, or update counts for readily available alternatives.
6. Order a sample string/controller first; test colour order, data stability and full-white current before bulk buying.
