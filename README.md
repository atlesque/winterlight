# Winterlight

A Christmas light show for an 8.50 m Belgian brick-house facade, adapted to *Wizards in Winter*. The approved layout has **four arches, two stars, ten standing poles, two ground-floor window outlines and a U-shaped door outline**. The former screen and four bars are removed; roof, upstairs and garage remain unlit.

The 800 individual bullet pixels and 154 grouped strip addresses total **954 RGB addresses / 2,862 channels**. All 19 props have individual data outputs. Three existing controller/power banks serve 368 / 340 / 246 addresses through 27 isolated power feeds. Ground-floor frame mounting is now authorized; entrance and garage paving access stay clear.

## Run and view

```bash
npm install
npm run dev
```

Open the reported local URL. The main page loads the matching extracted soundtrack and revised stored Wizards artifact; press **Play**. Drag to orbit, choose street/garden/plan views, inspect props and enable cable routes. `/props-preview.html` remains a static colour/placement view of the same approved geometry.

The hosted site is [Winterlight](https://winterlight.alexander-df0.workers.dev). Deploy through `npm run deploy`; `npm run deploy:check` builds and checks packaging without publishing. It uses Cloudflare Workers Static Assets with no server handler or storage binding. Pushes to `main` deploy automatically through Workers Builds, and other branches get a Preview URL through `wrangler preview` using the empty `previews` block in `wrangler.jsonc`.

## Wiring and procurement

The facade route rises on the right and passes above the door lintel, keeping the threshold clear. Dimensions and wire routes are schematic estimates pending site measurements. `src/props.js` is the shared source for prop counts, banks, ports, power sections and geometry. Opening dimensions live in `src/house.js`.

Use 12 V WS2811 bullet pixels at ≤0.72 W/node and grouped RGB facade strip at **30 LEDs/m, three LEDs/group, 10 addresses/m, ≤7.2 W/m**. Install 15.4 m of strip including corner allowance. Higher-power/density substitutions require a revised electrical calculation and channel map. The conditional full-white design maximum is 686.88 W, excluding controllers, losses and ambient derating. Software estimates are not voltage-drop, fuse, thermal or physical commissioning tests.

Reuse existing compatible pixels first. A new build needs 18 × 50-node strings (16 installed plus two spare), versus 23 formerly. Strip, profiles, bases and extra feed connections still need a combined delivered quote; no net saving is claimed before costing those additions.

## Wizards timing

The **Light timings** dropdown picks what drives the Wizards show. **MIDI instrument timings** (the default) drive the lights from instrument note cues (`outputs/wizards-note-cues.json`) on the hosted audio clock. Each MIDI instrument owns a prop group: piano the front five poles, lead the back five poles, guitar the four arches, bass the two window outlines, strings/synths the two stars and drums the door's left side, lintel and right side. Notes are dealt round robin across the group, skipping props that are still lit, so phrases travel along the group. The cues are compiled from the local instrument MIDI by `tools/transcription/build_light_cues.py`; no pitches are stored and the MIDI itself is not committed. **Original timings (filmed show)** keeps the source-frame playback described below. Light intensity defaults to 60%.

The revised `outputs/wizards-ground-level.wltiming` stores **5,569 native source frames**, with every original PTS and the complete 185.875737 s audio timeline preserved. Filmed icicle samples are spatially reassigned to the window and door outlines; columns from the filmed central sign supply pole accents. Retained arches and stars keep their samples. No temporal resampling, beat regeneration or colour averaging is used. Camera colours/shapes are adaptations, not original controller data.

Hosted audio drives frame selection. **Load video** and **Use extracted Wizards show** can pair the exact original local MP4 with this artifact for presented-video-frame comparisons. Local `.wltiming` files must match the current channel-map hash and source identity. Source playback disables brightness/full-white overrides to preserve stored bytes. The final frame holds through the 56.770 ms audio tail and blacks out at end.

Bank partitions contain A=1,104, B=1,020 and C=738 channels/frame. Native timestamps and all corresponding RGB bytes are preserved. WLT2 is a custom format, **not FSEQ**; physical FPP/controller playback requires an adapter with documented timestamp quantization and measured latency. This project sends no commands to real controllers.

**Return to original demo** enables a synthetic test score and full-white checks; **Load audio** analyses a local recording for adapted energy/onset effects. The demo's 40 fps `.wlshow` export is separate from native-frame Wizards playback. It has magic `WLS1`, a little-endian JSON-header length, metadata and frame-major RGB (2,862 channels/frame), with no audio.

## Original house

`/original.html` rebuilds the house from the filmed show as its own 3D scene, separate from the facade model above, so the original show can be reverse-engineered prop by prop. Its props and how they are addressed:

| Prop | Channels |
|---|---|
| Upper and lower floor strips (yellow/blue) | one per floor |
| Window strips (yellow/blue) | one group |
| HAPPY HOLIDAYS letters (red, green, yellow) | one per letter (13) |
| Christmas circles | left, right |
| Candy canes | one per cane (8) |
| Mini trees | one per tree (11) |
| Ground strip, 30 cm high (yellow/blue) | one |
| Peace sign | one |
| Wireframe tree | one per vertical strip (16) + star |

All 56 channels are described once in `src/original/layout.js`, in the pixel coordinates of a reference still of the final all-on frame (a 2× crop of the video). The 3D model and the detector both read that file. Counts of canes, mini trees and tree strips are estimates from the still.

Because the original video is filmed from a fixed camera, `tools/original/detect.py` samples each channel's region on every decoded frame, learns that channel's own off and on brightness over the whole video, and records each frame's brightness between them in 5% steps, so the show's fades come through rather than being flattened to on/off. The wireframe tree's strips and star are the exception: they only switch on and off, so they are stored at full level. Multicolour strips are also classified as yellow, blue or both. There is no smoothing or resampling, so cue changes land on exact video frames (29.97 fps). The page plays them against the hosted soundtrack, which was extracted from the same video.

```bash
# Check the regions against a frame of the video, then detect a range.
python3 -I tools/original/detect.py source.mp4 --overlay work/original/overlay.png --at 180
python3 -I tools/original/detect.py source.mp4 --out outputs/original-house-cues.json --levels work/original/levels.csv
```

Light spills between neighbouring props, so each channel has a floor below which it counts as off: 10% for the floor strips, 25% for the canes and circles, 50% for the letters (they catch up to ~46% spill from the icicles above) and 45% for the ground strip (snow lit by the icicles and mini trees). The mini trees stand closer together than their glow is wide, so each is watched along its centre line by mean brightness with a 45% floor. The window-strip regions stop short of the icicles, and the peace sign is watched only along its upper half, above the mini-tree tops, for the same reason. `outputs/original-house-cues.json` covers the whole video, 0:00–3:05 (all 5,569 frames).

The side panel plays the original video with its own sound, and while it plays the lights follow the frame on screen (`src/original/video-clock.js`). The site hosts a 720p copy at `public/media/wizards-in-winter-video.mp4` (about 13 MB, every source frame and timestamp kept). If it is ever missing, the page asks for a local MP4 once and keeps it in that browser, and without any video the hosted soundtrack drives the lights. The hosted copy was made with:

```bash
ffmpeg -i source.mp4 -map 0:v:0 -map 0:a:0 -vf scale=1280:720:flags=lanczos -c:v libx264 -preset slow -crf 27 -pix_fmt yuv420p -fps_mode passthrough -c:a aac -b:a 96k -movflags +faststart public/media/wizards-in-winter-video.mp4
```

Seen from the camera, tree strips at angle θ and π−θ overlap, so each front/back pair shares one detection line and one state.

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

## SEO and sharing preview

Each page's `<head>` carries its own title, description, canonical URL, Open Graph and Twitter card tags. The main page and `props-preview.html` share `public/og-image.jpg`, and `original.html` uses `public/og-image-original.jpg`. Both are 1200×630 renders of the site's own 3D scenes. The pages also share `favicon.svg`, `apple-touch-icon.png`, `robots.txt` and `sitemap.xml`. `props-preview.html` is `noindex` so search results land on the shows.

To regenerate the share images after a model changes: `npm run build`, start `npx vite preview --port 4173`, then run `node tools/og-image/render.mjs` (needs Playwright). The page list, show moment and card text live at the top of that script; the card layout is `tools/og-image/card.html`.

To add a new page: copy the head block from `original.html`, change the title, description, canonical, `og:url`, `og:title`, `og:description` and the two `twitter:` text tags, add the page to `tools/og-image/render.mjs` if it should have its own image, and add its URL to `public/sitemap.xml`.
