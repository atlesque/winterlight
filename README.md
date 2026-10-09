# Winterlight

A Christmas light show for an 8.50 m Belgian brick-house facade, adapted to *Wizards in Winter*. The approved layout has **four arches, two stars, ten standing poles, two ground-floor window outlines and a U-shaped door outline**. The former screen and four bars are removed; roof, upstairs and garage remain unlit.

The 800 individual bullet pixels and 154 grouped strip addresses total **954 RGB addresses / 2,862 channels**. All 19 props have individual data outputs. Three existing controller/power banks serve 368 / 340 / 246 addresses through 27 isolated power feeds. Ground-floor frame mounting is now authorized; entrance and garage paving access stay clear.

## Run and view

```bash
npm install
npm run dev
```

Open the reported local URL. The main page loads the matching extracted soundtrack and revised stored Wizards artifact; press **Play**. Drag to orbit, choose street/garden/plan views, inspect props and enable cable routes. `/props-preview.html` remains a static colour/placement view of the same approved geometry.

The hosted site is [Winterlight](https://winterlight.alexander-df0.workers.dev). Deploy through `npm run deploy`; `npm run deploy:check` builds and checks packaging without publishing. It uses Cloudflare Workers Static Assets with no server handler or storage binding.

## Wiring and procurement

The facade route rises on the right and passes above the door lintel, keeping the threshold clear. Dimensions and wire routes are schematic estimates pending site measurements. `src/props.js` is the shared source for prop counts, banks, ports, power sections and geometry. Opening dimensions live in `src/house.js`.

Use 12 V WS2811 bullet pixels at ≤0.72 W/node and grouped RGB facade strip at **30 LEDs/m, three LEDs/group, 10 addresses/m, ≤7.2 W/m**. Install 15.4 m of strip including corner allowance. Higher-power/density substitutions require a revised electrical calculation and channel map. The conditional full-white design maximum is 686.88 W, excluding controllers, losses and ambient derating. Software estimates are not voltage-drop, fuse, thermal or physical commissioning tests.

Reuse existing compatible pixels first. A new build needs 18 × 50-node strings (16 installed plus two spare), versus 23 formerly. Strip, profiles, bases and extra feed connections still need a combined delivered quote; no net saving is claimed before costing those additions.

## Wizards timing

The revised `outputs/wizards-ground-level.wltiming` stores **5,569 native source frames**, with every original PTS and the complete 185.875737 s audio timeline preserved. Filmed icicle samples are spatially reassigned to the window and door outlines; columns from the filmed central sign supply pole accents. Retained arches and stars keep their samples. No temporal resampling, beat regeneration or colour averaging is used. Camera colours/shapes are adaptations, not original controller data.

Hosted audio drives frame selection. **Load video** and **Use extracted Wizards show** can pair the exact original local MP4 with this artifact for presented-video-frame comparisons. Local `.wltiming` files must match the current channel-map hash and source identity. Source playback disables brightness/full-white overrides to preserve stored bytes. The final frame holds through the 56.770 ms audio tail and blacks out at end.

Bank partitions contain A=1,104, B=1,020 and C=738 channels/frame. Native timestamps and all corresponding RGB bytes are preserved. WLT2 is a custom format, **not FSEQ**; physical FPP/controller playback requires an adapter with documented timestamp quantization and measured latency. This project sends no commands to real controllers.

**Return to original demo** enables a synthetic test score and full-white checks; **Load audio** analyses a local recording for adapted energy/onset effects. The demo's 40 fps `.wlshow` export is separate from native-frame Wizards playback. It has magic `WLS1`, a little-endian JSON-header length, metadata and frame-major RGB (2,862 channels/frame), with no audio.

## Current deliverables

- [Approved build guide](outputs/christmas-show-project.md) and [printable HTML](outputs/christmas-show-project.html)
- [Facade/plan layout](outputs/layout.svg) and [wiring diagram](outputs/wiring.svg)
- [Pixel/channel map](outputs/pixel-map.csv), [controller port settings](outputs/controller-config.csv) and [power feed schedule](outputs/power-feeds.csv)
- [Revised parts checklist](outputs/revised-bom.csv) and [parts review](outputs/parts-critical-review.md)
- [Sourcing and cost changes](outputs/eu-sourcing-research.md) and [technical research](outputs/technical-research.md)
- [Playback guide](outputs/source-playback-guide.md), [sampling provenance](outputs/source-mapping.json), [every-frame worksheet](outputs/source-frame-summary.csv) and [cue assignments](outputs/cue-worksheet.csv)
- [Integrity report](outputs/source-integrity-report.json), [bank manifest](outputs/controller-banks/manifest.json) and [playback audit](outputs/source-playback-audit.json)

Historical price/regulatory research is dated explicitly; it is not a current delivered purchase quote. Prior screenshots depict earlier revisions unless identified as the approved facade edition.

## Rebuild and validate

```bash
node tools/build-project.mjs
# Equivalent planning rebuild: python3 work/package.py
node tools/export-banks.mjs outputs/wizards-ground-level.wltiming outputs/controller-banks
node tools/frame-worksheet.mjs
npm test
npm run build
```

The planning generator rebuilds the guide, diagrams, BOM and CSV wiring/port schedules from shared configuration. It does not silently relabel a timing file when the map changes. Re-extract and package from the exact source recording when sampling/counts change:

```bash
python3 tools/extract-source.py source.mp4 work/source.rgb work/source-mapping.json
node tools/pack-source-frames.mjs source.mp4 work/source.rgb outputs/wizards-ground-level.wltiming work/source-mapping.json
node tools/verify-source-frames.mjs source.mp4 outputs/wizards-ground-level.wltiming outputs/source-integrity-report.json
```

The extractor uses reviewed current sampling coordinates in `outputs/source-mapping.json`. `tools/remap-source-props.mjs` also reproduces this specific spatial migration from an archived legacy artifact/map/provenance. Original MP4 and private migration backups are excluded from the repository; the requested extracted soundtrack remains in `public/media/`.
