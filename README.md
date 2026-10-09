# Winterlight

A practical ground-level Christmas pixel light show project for a Belgian brick house, inspired by Trans-Siberian Orchestra's *Wizards in Winter*.

The design uses 1,050 RGB pixels in four arches, four short bars, two stars and a small matrix. All props are freestanding, with no roof access, wall mounting, door garland or Christmas trees. Three independent 350-pixel power banks support xLights sequencing and wired FPP playback.

## Run the Three.js simulator

```bash
npm install
npm run dev
```

Open the local address printed by the server. Press Play for a full 3:05 original demo score, or choose **Load audio** to decode a local MP3/WAV and drive the lights from that recording's musical accents. Files stay in the browser. Phrase choreography is adapted; it is not the recovered original sequence. The official video blocks embedded playback in the tested environment (YouTube error150), so use a lawfully obtained local recording for the intended soundtrack.

The scene models the house, garden, all1,050 individual pixels, all11 data outputs and21 isolated50-node power sections. Drag to orbit, choose street/garden/plan views, inspect props, show cable routes and use the brightness/full-white controls. Dimensions are provisional. The pixel-power estimate is not a fuse, thermal, voltage-drop or photometric simulation.

`npm test` checks the physical constraints, channel continuity, all185seconds of deterministic effects, audio accent detection and maximum bank loads. `npm run build` creates a distributable site in `dist/`, including the project documents; `npm run preview` serves that build locally.

### Exported show frames

The export button renders40frames/second using the same recording analysis, channel map and intensity setting. It ignores the temporary full-white test override. `.wlshow` is a custom preview format, **not FSEQ**: bytes0–3 are ASCII `WLS1`, bytes4–7 are the little-endian JSON-header length, followed by UTF-8 metadata and frame-major RGB bytes (3,150 channels/frame). It contains no audio. A deployment adapter and real xLights verification are still required before playback on hardware.

### Source-frame playback

**Load video** and **Use extracted Wizards show** play the supplied recording with its generated5,569-frame artifact. **Load timing** can pair another validated local recording with an immutable `.wltiming` artifact. Video supplies picture and audio; its presented frame timestamps select stored RGB bytes. Source-video and channel-map hashes must match. Brightness and full-white overrides are disabled in this mode. The audit records frame coverage, skipped frames, unmatched timestamps and late callbacks.

WLT2 stores native source-frame presentation times and one RGB frame per source frame. It is distinct from the approximate 40 fps `.wlshow` export. To package already reviewed RGB frames, install FFmpeg/ffprobe and run:

```bash
node tools/pack-source-frames.mjs source.mp4 reviewed-frame-major.rgb output.wltiming
node tools/verify-source-frames.mjs source.mp4 output.wltiming report.json
```

The verifier checks the RGB checksum, source identity, channel map, every native timestamp and final frame duration. It rejects changed RGB bytes or altered playback timestamps. Browser loading also checks the RGB checksum before enabling playback. These checks establish artifact integrity, not extracted-light fidelity or physical display alignment.

The actual recording has been processed into [wizards-ground-level.wltiming](outputs/wizards-ground-level.wltiming), with one stored RGB frame per source PTS and a documented camera-effect adaptation. [Playback and extraction guide](outputs/source-playback-guide.md) explains the spatial/colour approximations, audio tail and exact bank partitions. Browser callbacks do not guarantee simultaneous optical output; physical controller playback still requires an adapter and measured output latency.

## Project files

- [Source-frame playback guide](outputs/source-playback-guide.md)
- [Full-source playback audit](outputs/source-playback-audit.json)
- [Every-frame timeline worksheet](outputs/source-frame-summary.csv)
- [Source integrity report](outputs/source-integrity-report.json)
- [Controller bank manifest](outputs/controller-banks/manifest.json)
- [Critical parts review](outputs/parts-critical-review.md)
- [Revised parts checklist](outputs/revised-bom.csv)
- [Complete project guide](outputs/christmas-show-project.md)
- [Printable HTML guide](outputs/christmas-show-project.html) — download/clone and open locally with its SVG files beside it
- [Ground-level layout](outputs/layout.svg)
- [Power and wiring diagram](outputs/wiring.svg)
- [Pixel/channel map](outputs/pixel-map.csv)
- [Music cue worksheet](outputs/cue-worksheet.csv)
- [EU supplier research](outputs/eu-sourcing-research.md)
- [Technical and Belgian regulatory research](outputs/technical-research.md)

Prices and research were checked on 8 October 2026. The supplied video now has a native-frame timing artifact; the older phrase cue worksheet remains approximate. The documentation distinguishes observed video details from proposed adaptations. Confirm site measurements, component specifications, electrical protection and applicable music permissions before purchasing or installation.

## Rebuild the documents

Run `python3 work/package.py` from the repository root. The script uses the Python standard library to regenerate the HTML guide, SVG diagrams and CSV worksheets from the project material, and checks the channel totals and bank allocations.

This repository includes the simulator, planning documentation and document packaging script. It does not send network commands to real controllers or include a licensed commercial recording.
