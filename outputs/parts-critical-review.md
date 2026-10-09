# Winterlight — current parts review

Updated 9 October 2026 for the approved facade layout. The authoritative quantities are in [revised-bom.csv](revised-bom.csv); the former screen/bar design and its whole-project budget are superseded.

## Changes that matter

1. **Reuse 800 bullet pixels.** Arches use 400, stars 200 and ten poles 200. Removed bars and screen release 450 pixels; 200 can populate the poles, leaving 250 unused if all original pixels already exist. For a new purchase, 18 × 50-node strings cover installation plus 100 spare, five fewer strings than before.
2. **Add grouped facade strip.** Kitchen: 64 groups/6.4 m; WC: 28/2.8 m; door: 62/6.2 m. Order four 5 m rolls, with 4.6 m spare. Required variant is 12 V WS2811 RGB, 30 LEDs/m, three LEDs/address, at most 7.2 W/m. Specify sealed corner/pad transitions and removable frame profiles. These 154 addresses contain 462 physical LED packages.
3. **Keep three existing controller kits.** The new map needs 19 of 24 available outputs: A=6, B=5, C=8. Conditional pixel loads are 264.96 / 244.80 / 177.12 W; confirm complete-enclosure thermal/ingress performance and controller overhead. [Baldrick8's manual](https://www.baldrickboard.com/en/boards/baldrick8/manual) documents its eight outputs, WS2811 compatibility and power-input arrangement.
4. **Revise distribution rather than relying on kit fuses.** 27 protected feeds: A=9, B=8, C=10. Use rated distribution with enough branches and ≥30 A bus rating after derating. Twelve 50-node sections, ten 20-node poles and five strip sections need different provisional fuse allowances (4 A / 1.5 A / 2.5 A), confirmed against actual downstream conductors and fuse characteristics. Eight internal section boundaries isolate V+ while continuing data and same-bank GND. Isolate the data harness positive when externally injecting power.
5. **Price the bases and facade harness.** Ten slim uprights/diffusers and bases replace the panel/four bars. Pole height is 0.9 m lit, bases shown as 0.22 m squares; wind stability is site-specific. Facade leads run above the lintel rather than across the entrance paving. Qualify longest first-pixel data length or use supported differential hardware. Include 19 data tails, 27 feed interfaces, five unused-output caps and 19 prop-end seals.
6. **Keep playback limits explicit.** Updated Wizards WLT2 contains all 5,569 original PTS with the new 2,862 channels. Bank exports preserve these bytes/timestamps, but are not FSEQ or ready-to-flash firmware. Real controller and sound-output latency still need commissioning.

## Cost result

The architecture avoids a fourth controller and reuses suitable existing pixels. For a new build it removes five 50-node strings and the matrix blank/support. It adds strip, frame channels/corners, ten pole bases and six more power feeds. Net delivered saving is **unquoted**; do not reuse earlier €1,590–2,110 or €1,900–2,950 envelopes as the revised total. Obtain one BOM-based combined quote to avoid counting included kit components twice.

The software full-white maximum is 686.88 W only with the specified strip power cap and bullet specification. That arithmetic is not a measurement or a completed electrical design. Weather suitability, site cable lengths, protection, voltage drop and thermal behavior remain procurement/commissioning checks.
