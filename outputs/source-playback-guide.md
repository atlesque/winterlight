# Wizards in Winter — approved facade adaptation

Updated 9 October 2026. The soundtrack and native source timeline remain unchanged; the approved layout replaces four bars and the screen with ten poles and three ground-floor frame outlines. The current artifact contains **5,569 frames × 2,862 RGB channels**.

## Playback

Run `npm run dev` and open its reported URL. The main page prepares the supplied extracted soundtrack and current stored sequence. Press Play. The same audio media timeline handles play, pause, seek and native-frame lookup. For local video comparison, load the exact original MP4 and choose **Use extracted Wizards show**. Its SHA-256 must match the artifact. The source recording stays local; uploaded audio/video is not transmitted.

Brightness/full-white overrides are disabled while stored Wizards frames are active. Return to the original demo for those tests. Demo/onset effects and their 40 fps .wlshow export are separate adaptations, not native-frame Wizards playback.

## Timing and spatial mapping

The recording has 5,569 frames, 30000/1001 fps and time base 1/30000. Media starts at zero; video ends at 185.818967 s, audio at 185.875737 s. The final light frame holds through the 56.770 ms tail and blacks out at the audio end. Every native PTS tick and its rounded-microsecond lookup value is retained.

| Filmed source role | Approved target |
|---|---|
| Candy canes | Arch1 |
| Left mini-tree cluster | Arch2 |
| Right mini-tree cluster | Arch3 |
| Large tree fan | Arch4; no physical tree added |
| Left/right wreaths | Star1 / Star2 |
| First and second roof-icicle sections | Kitchen-window outline (64 groups) |
| Third roof-icicle section | Small WC-window outline (28 groups) |
| Last roof-icicle section | Door sides/lintel (62 groups) |
| Central sign | Ten pole columns, 20 nodes bottom-to-top each |

The spatial migration selects nearest existing source samples. Kitchen combines the former two first roof sampling curves; WC and door use the remaining curves. Pole samples use columns 2, 4, 7, 9, 12, 14, 17, 19, 22 and 24 from the former 25-column sign sampling, respecting its serpentine lower-to-upper row order. Ten camera rows map onto twenty pole nodes by repeating each row twice. This transfers colour accents, not readable sign lettering. Retained arches/stars copy their original samples exactly.

No temporal resampling, smoothing, colour averaging or generated beat sequence is added. All RGB triplets come from the former reviewed source artifact. The original extraction used a 960×540 image, brightest actual RGB triplet within 5×5 neighbourhoods, fifth-percentile baseline subtraction, residual threshold 35/255, gain 1.6 and 30% encoded brightness cap. Camera exposure, bloom, occlusion and compression remain limitations; this cannot recover original controller commands or below-threshold light.

`source-mapping.json` and the WLT2 header record every current source coordinate, legacy sample index, parent hash and zero temporal changes. The new channel-map hash is checked before playback, so a legacy 3,150-channel artifact cannot silently run on the revised map.

## Reproduce and verify

Reproduce this migration from the exact archived legacy files:

```bash
node tools/remap-source-props.mjs legacy.wltiming legacy-pixel-map.csv legacy-source-mapping.json outputs/wizards-ground-level.wltiming
node tools/verify-source-frames.mjs source.mp4 outputs/wizards-ground-level.wltiming outputs/source-integrity-report.json
node tools/export-banks.mjs outputs/wizards-ground-level.wltiming outputs/controller-banks
node tools/frame-worksheet.mjs
npm test
```

For fresh extraction, `tools/extract-source.py` reads current reviewed sample coordinates from `outputs/source-mapping.json`; run it with numpy and FFmpeg, then package through `tools/pack-source-frames.mjs`. Re-extraction uses the recorded rounded camera coordinates and may produce different RGB from the exact legacy migration; review and regenerate hashes rather than expecting an unchanged payload checksum. The timestamp verifier independently probes the exact original MP4 with ffprobe and compares every native PTS, lookup timestamp, final frame duration, source identity, current map and RGB checksum.

## Controller reuse

The three bank partitions retain every original timestamp and exactly their corresponding current RGB bytes: A=1,104 channels, B=1,020, C=738. Recombination tests cover all 5,569 frames. Source/global channel starts are A=1, B=1105, C=2125; every receiver uses local offset zero. No bank file contains audio.

WLT2 is a custom artifact, not FSEQ, firmware or a validated real-controller playback format. Fixed-rate xLights/FPP conversion needs an explicit timing-quantization report, and real output needs measured network/controller/audio-device latency. Exact stored timestamps do not establish acoustic/optical simultaneity. No controller is connected or commanded by this project.

## Evidence

`source-integrity-report.json` describes current source/map/RGB integrity verification. `source-playback-audit.json` identifies the tested artifact and whether its run used hosted audio or source video. `source-frame-summary.csv` lists all current per-prop peaks and bank duty estimates. The previous source-video full-run audit is preserved only as historical evidence in the private migration backup and must not be attributed to the new artifact.
