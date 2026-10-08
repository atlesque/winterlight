# Winterlight — critical parts review

Reviewed 8 October 2026. The 1,050-node design and three 350-node power banks remain workable, but the original list is a concept budget, not a complete purchase order. The accompanying Three.js simulator shows all eleven models using the existing channel map; its dimensions and cable routes are planning assumptions.

## Findings that change the order

1. **The assembled kits are not the complete injection system.** The [Propixeler kit](https://www.propixeler.nl/product/baldrick8-pre-build-ki) is listed at €220 and describes supplied 7.5 A fuses, a controller, RSP320 supply, enclosure, eight pigtails, glands and network feedthrough. It does not explicitly include the three external distribution blocks or 21 independently protected power feeds proposed here. Reserve enclosure space, feedthroughs and labour for them. A 7.5 A fuse is not automatically appropriate protection for every thinner downstream conductor. Our 4 A per-section starting point remains subject to DC interrupt rating, actual holder, wire/connector ratings and fuse curves.
2. **The pixel loom has to fit behind dense props.** The [pixel supplier](https://pixel-imperium.de/ws2811-pixel-string-12mm-12v-ip68) specifies 10 cm factory wire pitch. Closely spaced mounting holes need excess wire dressed behind the frame, with strain relief, ventilation and no sharp bends. The total factory loom is approximately 105 m for 1,050 nodes, not the length of the visible light outlines. Order a sample and make a ten-node mockup first.
3. **Power injection needs real positive isolation.** Across the 21 separately fused 50-node sections, ten internal inter-section data links must keep V+ isolated while passing data and the same-bank reference ground. A generic three-pin T adapter does not do this. Specify the pinout for each harness; do not just buy 21 T adapters and leave every positive rail connected.
4. **Controller locations are unresolved.** The original suggestion to keep all mains indoors conflicts with a short first-pixel data route if the nearest dry service room is far from the right garden. The simulator draws A/B/C boxes near the bed as conceptual service locations; it does not certify that those locations are dry or weatherproof. Either establish dry nearby service points with safe cable access, or obtain documented complete outdoor assemblies. If using distant dry banks, qualify data cable runs or add the controller manufacturer's supported differential solution. Price and compatibility of that alternative are not yet verified.
5. **The enclosure needs more than an IP claim.** Confirm the rating of the assembled enclosure, including feedthroughs, condensation control, mains/DC separation, protective earth and load/ambient thermal performance. Confirm the 12 V PSU variant and permitted loading under the actual installation. Do not assume a component PSU can be sealed without ventilation. Fusing does not compensate for rain ingress or hot connectors.
6. **Props must match the channel map.** Our arches are two 50-node curves, stars two 50-node outlines, and matrix ten serpentine rows of 25. Custom frames require suitable hole sizes, sufficient rear depth, weather-resistant material and support. A supplied 100-hole arch may have a different geometry. Two retail 150-node stars would raise the total to 1,150 nodes and invalidate the 350/350/350 bank assignment. Confirm dimensions, model and insertion path before buying.

## What is sound, and what is over-specified

The electrical design basis is 0.72 W/node at full white: 756 W total and 252 W per bank. Three RSP-320-12 supplies provide sufficient nameplate capacity at the stated load plus small controller overhead, pending ambient derating. Brightness limiting does not change protective hardware requirements. Twenty-one 50-node sections is conservative; a revised engineer-approved harness could use fewer feeds after actual voltage-drop measurements, but this simulation retains the specified isolation strategy.

Three eight-output controllers supply eleven used ports out of twenty-four. That is deliberately modular but not the cheapest architecture. Two boards with three PSUs may reduce cost, but increases power-domain mapping complexity and must follow the exact controller power-bank rules. Keep the three-controller design for the first build unless a supplier assembles and documents the alternative.

A 25 × 10 matrix is useful for simple icons and big scrolling text. It is too low resolution for detailed video. The right garden needs roughly 5.2 m of clear width for the four 1 m arches and gaps; the simulator assumes a roughly 6.25 m-wide bed. These dimensions are inferred, not surveyed. No pixels, fixings or light wash are added to the garages, entrance path, upper walls or roof.

## Complete parts checklist

The machine-readable [revised BOM](revised-bom.csv) separates included kit components, extra quantities and unresolved specifications. Essentials omitted or bundled too loosely in the initial list:

- 3 independent rated distribution blocks, at least 7 usable circuits each, with at least 21 A continuous bus capacity after derating; target 30 A or greater with supplier proof.
- 21 DC-rated fuse holders and selected branch fuses, plus spares. Assess upstream/trunk protection and controller supply protection separately.
- 21 two-conductor power harnesses, 21 matching sealed feed interfaces, 10 positive-isolated data links, and 11 first-pixel data/ground routes. Lengths are to be measured. Three-wire T adapters are optional harness components, not substitutes for isolation/fusing.
- 13 unused controller output caps and 11 prop terminal caps, matched to actual gender/type; injection ends need additional caps if unused. Controller kits already supply 24 output pigtails, so do not double-count those as a separate order.
- Outdoor-rated power/data leads with verified conductor size and connector pin assignment, extra glands, adhesive-lined splice/seal materials, ferrules, labels and strain relief.
- Four arch supports, four bar bases, two star stands and one matrix support. Ballast/anchors are site-specific; soil anchors require a buried-services check. No anchors or cables on the entrance path/public pavement.
- One supported FPP host, correct PSU and storage, one Ethernet switch (at least five ports), four Ethernet links, wired USB audio/DAC where required and a speaker/audio cable.
- A verified protected mains circuit, suitable isolation and outdoor mains hardware if any is needed. Electrician labour and circuit changes are separate.
- A multimeter, appropriate current-measurement method and thermal inspection method for commissioning, plus spares, storage containers and configuration backups.

## Revised budget

The earlier €1,700–2,500 envelope remains provisional. Reserve a further €200–450 within or above it for the newly itemized distribution, isolation harnesses, glands and support fabrication if not already covered by the cable/frame allowances. A realistic procurement target is **€1,900–2,950 before electrician/circuit work and music permissions**, with £/UK import routes excluded from the primary sourcing. This is an allowance, not new merchant quotes. Do not add the reserve twice if supplier quotations already include these items. Standardize the earlier sourcing report's mixed electrician/shipping allowance when obtaining actual quotes.

## Simulation fidelity and limits

Every one of the 1,050 pixels has a position, RGB channel range, data port, power bank and 50-node section. The cable overlay draws eleven data paths and 21 separately supplied power sections. Full-white test at 100% produces 252 W per bank / 756 W total in the arithmetic model. The load estimate assumes equal 0.24 W RGB component contributions; it is not a measurement of driver idle current, supply loss, voltage drop, enclosure temperature, fuse behavior, EMC or connector quality. Geometry and glow are visual approximations, not surveyed photometry or engineering certification.

The original demo is a newly generated test score. Local recordings are decoded in the browser, analysed at 40 frames/second and used for musical energy/accent timing; pause, seek and render use the same audio clock. Phrase choreography remains authored approximation. The official YouTube reference mode follows its media clock with approximate choreography but cannot inspect cross-origin audio or ignore ads/embedding restrictions. This is not a recovered original xLights sequence. No recording is uploaded, and no hardware receives commands.

The intended user-provided recording is still needed for a faithful final sequence. Browser exports contain adapted RGB frames without audio in a documented custom format; they are not immediately deployable FSEQ files. Before live use, transfer and verify the choreography in xLights and retest on the real installation.

References: [Three.js](https://threejs.org/docs/), [YouTube IFrame Player API](https://developers.google.com/youtube/iframe_api_reference), [Mean Well RSP-320 datasheet](https://www.meanwell.com/Upload/PDF/RSP-320/RSP-320-SPEC.PDF), and the project's existing technical and EU sourcing reports.
