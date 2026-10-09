# Wizards in Winter — source-frame adaptation

This show uses the locally supplied official music-video recording, not the old synthetic demo or beat-reactive generator. Every decoded source frame has one stored 3,150-channel RGB frame. Playback uses the video element's presented-frame timestamp; that same element supplies the original audio, pause and seek clock.

## Run it

1. Start the simulator with `npm run dev` and open its local URL.
2. Choose **Load video** and select the original MP4 supplied in this chat.
3. Choose **Use extracted Wizards show**, then **Play**.
4. The audit reports covered frames, skipped frames, unmatched timestamps, late callbacks and maximum timestamp lookup error. Brightness and full-white controls are disabled to preserve the stored RGB values.

The recording stays local and is excluded from the public repository. A differently encoded copy or edited version will fail its identity check. Reload the same original file after refreshing the page. Use the local `.wltiming` upload for other validated artifacts.

## Exact timing; adapted shapes and colours

The source has 5,569 frames at 30000/1001 fps and native time base1/30000. Both audio and video begin at0. The video ends at185.818967s; audio continues until185.875737s. The final RGB frame is held through that56.770ms tail, then playback blacks out. WLT2 retains the original integer native PTS ticks as well as their nearest-microsecond browser lookup representation. No nominal40fps resampling, musical beat estimation, temporal interpolation or smoothing is used.

| Filmed effect | Freestanding target |
|---|---|
| Red candy canes | Arch1 |
| Left mini-tree cluster | Arch2 |
| Right mini-tree cluster | Arch3 |
| Large tree fan | Arch4, with no physical tree added |
| Left / right green wreaths | Star1 / Star2 |
| Four sections of roof icicles | Four low bars, with no roof or wall mounting |
| Central HAPPY HOLIDAYS lettering | Serpentine25x10 matrix |

The 11 target props and all3,150 channel assignments follow `pixel-map.csv`. This preserves the approved ground-level layout and removal zones. The original ground-blue strip, peace wheel and wreath bows do not have dedicated target props. A geometrically identical clone would contradict the installation constraints.

Sampling coordinates for every target node and all processing parameters are in `source-mapping.json` and embedded in the WLT2 header. Extraction decodes every frame to960x540 RGB, selects the brightest actual RGB triplet in a5x5 neighbourhood, subtracts each sample's fifth-percentile baseline across the complete recording, rejects residual signals below35/255, applies1.6 contrast gain and stores a30% brightness cap. Camera sampling is an explicit visual approximation: lens bloom, exposure, occlusion, compression and thresholding affect the result. It cannot recover the original controller commands, electrical intensities or dim lights below the noise threshold. The matrix maps image-top to physical-top, respecting serpentine channel order.

## Reproduce and verify

Use a Python environment with numpy, plus FFmpeg and ffprobe:

```bash
python3 tools/extract-source.py source.mp4 work/source.rgb work/source-mapping.json
node tools/pack-source-frames.mjs source.mp4 work/source.rgb outputs/wizards-ground-level.wltiming work/source-mapping.json
node tools/verify-source-frames.mjs source.mp4 outputs/wizards-ground-level.wltiming outputs/source-integrity-report.json
node tools/export-banks.mjs outputs/wizards-ground-level.wltiming outputs/controller-banks
npm test
```

The verifier independently probes every source timestamp, checks source/channel-map/RGB hashes and verifies frame count, native PTS, playback PTS, video end and complete audio duration. It establishes artifact integrity, not original-controller fidelity or acoustic alignment. The complete data are immutable in playback.

## Reuse in the physical project

The canonical artifact is `wizards-ground-level.wltiming`. The three bank partitions in `controller-banks/` retain every original timestamp and exactly the corresponding1,050 channels/frame. Their manifest proves zero changed timestamps and zero changed RGB bytes on all5,569 frames. They contain no music. They are WLT2, not FSEQ files and not controller firmware.

A hardware player must use these stored frames and native timestamps against the same audio timeline, preserve the channel order, and black out at the media end. It must also account for measured audio-device, network and controller scan delays. No actual controller has been connected or commanded. Do not regenerate the show with WLED audio-reactive effects or silently convert to the old40fps approximate export. A fixed-interval FPP/xLights conversion needs an explicit quantization/error report before claiming source-frame timing preservation.

Browser callback timing is audited rather than guaranteed. A callback can arrive one display refresh late; separate video and Three.js surfaces are not a certified simultaneous optical output. Exact stored data and timestamp selection do not establish physical photon/acoustic alignment. Installations still need commissioning measurements and the safety checks in the project guide.

## Full-duration playback evidence

The final corrected artifact completed all5,569frames: zero skipped source frames, zero missed callbacks, zero unmatched PTS and0µs maximum timestamp lookup error. One late callback occurred at the initial paused frame; the count remained one throughout playback. Video/music played through185.875737s and ended in blackout. A subsequent175s seek presented frame5244 at174.974800s with0µs lookup error. Browser error logs were empty. `source-playback-audit.json` records the final artifact and source hashes; `source-frame-summary.csv` gives every timestamp, per-prop peak and estimated bank load for review. These data substantiate software frame selection and full coverage, not certified optical/acoustic simultaneity.
