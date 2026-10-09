# EU sourcing research — Christmas pixel show

Checked 8 October 2026. No purchase or supplier contact made. Prices are observed merchant prices, not delivered Belgian quotes; recheck variant, Belgian VAT, delivery charges and stock at checkout. Netherlands and Germany sources avoid a UK import as the main route.

## Current buying route — revised 9 October 2026

Use the [approved BOM](revised-bom.csv) for quantities: 18 × 50-node bullet strings if buying anew, four 5 m rolls of grouped strip, ten pole bases/diffusers, ground-floor frame channels and three retained controller assemblies. Reuse available pixels first. Banks now contain 368 / 340 / 246 RGB addresses, not equal 350-node allocations.

The merchant offers below are **historical observations from 8 October**, not rechecked live prices/stock. They are retained as sourcing leads; the old full-project budget is superseded. A matching facade-strip supplier/delivered quote remains unconfirmed. Required strip is 12 V RGB WS2811, 30 LEDs/m, three LEDs/address, <=7.2 W/m; verify an actual sample/specification before ordering. Higher-power variants require a new load calculation.

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
| 100-pixel stars | Retain/custom DIY UV-stable coro | Historical estimate €30–€60 for two blanks; screen removed from current order. |
| Injection T adapters | [Pixel Imperium xConnect T 3:2:3](https://pixel-imperium.de/xConnect-T-connector-Power-Injection-323), €3.49 incl. German VAT | Available immediately; IP65, 0.75 mm², max 10 A published. At 21% unchanged net, approx €3.55. Confirm pinout and feed voltage. |
| End caps | [xConnect end cap](https://pixel-imperium.de/end_cap-xconnect_for_3_pin_connector-plug), €0.29 incl. German VAT | Available immediately; cap every unused end. Approx €0.30 at 21% unchanged net. |
| Pixel mounting strip | [Black 12 mm mounting strip](https://pixel-imperium.de/Mounting-strip-for-12mm-LED-Pixel-black), €2.59 per approximately 2.42 m; 50 m roll €39.99 linked on pixel page | Available immediately. For the new poles, fasten to rigid uprights with rear loom clearance; facade uses separate grouped strip and frame profiles. Verify hole pitch matches planned physical geometry. |
| Extensions / pigtails | [Pixel Imperium pixel page accessories](https://pixel-imperium.de/ws2811-pixel-string-12mm-12v-ip68) | Three-pin extensions available but price on request; pigtails €2.59 **out of stock**. Kit already contains pigtails; budget separately for extensions/injection leads. |

## Electrical evidence and procurement limits

Pixel Imperium publishes **36 W / 3 A maximum per 50 pixels** and 72 W / 6 A per 100 pixels. Thus use 0.72 W / 60 mA per pixel for this resistor-pixel design. The current 800 bullet pixels are 576 W / 48 A. The specified 154 strip groups add at most 110.88 W / 9.24 A; total 686.88 W / 57.24 A before controller overhead. The merchant recommends about 20% PSU reserve and warns that JST-SM is not watertight. Pixel bodies are IP68, but mated xConnect connectors are IP65; sealed pixel rating does not waterproof connectors or cuts.

[Meanwell official RSP320 datasheet](https://www.meanwell.com/Upload/PDF/RSP-320/RSP-320-SPEC.PDF): RSP-320-12 is 12 V, 26.7 A, 320.4 W; 20–90% RH **non-condensing**, -30 to +70 °C with derating curve. Maintain suitable ventilation/thermal capacity and manage condensation inside enclosure. 350 pixels = 252 W, leaving 68.4 W for overhead and reserve; 400 pixels = 288 W, only about 10% headroom. A 500-pixel bank needs 360 W and overloads this supply at full white. Brightness caps are operational controls, not substitutes for correct fuse and PSU sizing.

The assembled kit merchant claims outdoor use, but publishes no complete enclosure IP rating, gland seal test, condensation plan, grounding report or full-load thermal rating. Confirm these, controller bank-current limits, fuse values and exact PSU version before paying. Mount boxes elevated on an independent stand, sheltered, gland entries downward and drip loops. Match Xconnector/xConnect geometry **and pin assignment**, not just the name. Prefer one connector supplier. Fuse each injection feed at its source. Do not parallel independent PSU positive outputs through a pixel chain.

## WLED alternative

[QuinLED Dig-Octa Brainboard official NL store](https://nl.quinled.shop/Huis-en-kantoor/Quinled-LED-verlichting/Dig-Octa/QUINLED/QuinLED-Dig-Octa-Brainboard-32-8L-QLD-DOBB-p_41968.html) is €39.99 incl. VAT, eight level-shifted outputs, ESP32, built-in Ethernet. On check: warehouse **out of stock**, estimated 2–3 weeks. This is only the brainboard; fused powerboard, PSU, enclosure and harness are additional. It is a good WLED choice when the user wants WLED's local effects as well as external show streaming, but the assembled Baldrick route is easier to specify for this project. Do not price the bare brainboard as a complete outdoor controller.

## Revised cost comparison

Five fewer 50-node strings and the removed matrix structure are potential new-build savings. If the original 1,050 pixels already exist, reuse 800 and retain 250 spare; no new bullet purchase is necessary when compatible. Three controller kits remain. The new BOM adds 20 m of strip, ten pole bases/diffusers, profiles/corners and six extra feed connections. Net delivered saving and final project total are unquoted. The prior whole-project envelopes are retired; do not add historic kit allowances to a quote that already includes them.

[Pixel Imperium shipping policy](https://pixel-imperium.de/shipment) lists all EU member states and destination-country VAT for EU deliveries. Standard EU delivery observed: up to 3 kg €24.90, 5 kg €27.90, 10 kg €34.90, 20 kg €47.90. Final packed weight determines cost; this verifies Belgium as within the published shipping region without claiming an exact quote.

## Pre-order confirmation list

1. Measure frontage and exact available ground areas before committing to four arch sizes.
2. Confirm Belgian delivery, VAT and all connector variants with merchants.
3. Confirm bullet and strip full-white current, grouped strip density, RGB order, cable spacing and connector pinout.
4. Confirm controller input-bank ratings, fuse values, enclosure ingress rating and thermal/condensation guidance.
5. Obtain custom 100-pixel star, ten pole base/diffuser and 15.4 m facade-profile quotes; the matrix is removed.
6. Order a sample string/controller first; test colour order, data stability and full-white current before bulk buying.
