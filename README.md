# Winterlight

A Christmas light show for an 8.50 m Belgian brick-house facade, synced to *Wizards in Winter*. Our house carries the [original filmed house](original.html)'s props one for one (all 56 channels) and runs the original's detected timing, so both houses play the same show.

Where they sit (`src/house.js`, geometry in `src/props.js`): yellow/blue icicle strips along the main and garage eaves (upper and lower floor strips), outlines round the small left window, the door frame, the kitchen window and the garage door (window strips), HAPPY HOLIDAYS in the band between the door and the upper windows, the two circles and the peace sign each in one pane of the upper windows, a 2.5 m wireframe tree with its star between the planting tiles, eleven mini trees between the facade and the tiles, eight candy canes along the street edge and the ground strip along the left side and front of the shrubbery.

## Run and view

```bash
npm install
npm run dev
```

Open the reported local URL. The main page works exactly like `/original.html`: the original video (or its soundtrack) is the clock, the lights follow `outputs/original-house-cues.json`, and the side panel has the same light intensity, all-props-on switch and per-channel board. **Overlay video** lays our lights over the original video; our props sit where they are on our house, so they do not line up with the filmed ones.

The hosted site is [Winterlight](https://winterlight.alexander-df0.workers.dev). Deploy through `npm run deploy`; `npm run deploy:check` builds and checks packaging without publishing. It uses Cloudflare Workers Static Assets with no server handler or storage binding. Pushes to `main` deploy automatically through Workers Builds, and other branches get a Preview URL through `wrangler preview` using the empty `previews` block in `wrangler.jsonc`.

## Earlier layouts

The old facade layout (arches, stars, poles and outlines, mapped in `outputs/legacy-facade/pixel-map.csv`), its MIDI note show and its extracted `.wltiming` show have been retired from the page; their output files stay in `outputs/` for reference and the code is in git history.

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
npm test
npm run build
```

## SEO and sharing preview

Each page's `<head>` carries its own title, description, canonical URL, Open Graph and Twitter card tags. The main page uses `public/og-image.jpg`, and `original.html` uses `public/og-image-original.jpg`. Both are 1200×630 renders of the site's own 3D scenes. The pages also share `favicon.svg`, `apple-touch-icon.png`, `robots.txt` and `sitemap.xml`.

To regenerate the share images after a model changes: `npm run build`, start `npx vite preview --port 4173`, then run `node tools/og-image/render.mjs` (needs Playwright). The page list, show moment and card text live at the top of that script; the card layout is `tools/og-image/card.html`.

To add a new page: copy the head block from `original.html`, change the title, description, canonical, `og:url`, `og:title`, `og:description` and the two `twitter:` text tags, add the page to `tools/og-image/render.mjs` if it should have its own image, and add its URL to `public/sitemap.xml`.
