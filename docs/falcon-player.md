# Playing the show on Falcon Player

The show file is ready in `outputs/fpp/`:

| File | What it is |
| --- | --- |
| `show.fseq` | Every pixel's colour, 40 frames a second (25 ms), 7,155 channels × 7,433 frames, 3:06. FSEQ v2, zstd-compressed (0.3 MB). |
| `show.mp3` | The soundtrack, cut from the same video as the cues, so second 0 of the music is frame 0 of the lights. |
| `co-universes.json` | Falcon Player's channel outputs: one DDP output per Baldrick 8. |
| `controller-ports.csv` | What to set on each Baldrick's port page. |
| `props.csv` | Which pixels of a port each prop owns, to check during the test pattern. |

They are made by `node tools/fseq/export.mjs` from the same files the site plays (`outputs/original-house-cues.json`, `src/props.js`, the wiring plan). Run it again after any change to a prop, its pixel count or the wiring; `npm test` fails if the committed `show.fseq` no longer matches.

```
node tools/fseq/export.mjs --facade-ip 192.168.1.201 --garden-ip 192.168.1.202 --gamma 2.2 --brightness 100
```

## How the channels are laid out

Channels run in wiring order: the facade controller first, then the garden one, each port's chain in data order, three channels (R, G, B) per pixel.

| Controller | Show channels | Ports |
| --- | --- | --- |
| Facade | 1–3,513 (1,171 pixels) | 1 upper strip 180 · 2 lower strip 148 · 3 windows 222 · 4 letters 488 · 5 circles 88 · 6 peace sign 45 |
| Garden | 3,514–7,155 (1,214 pixels) | 1 canes 128 · 2 mini trees 594 · 3 ground strip 126 · 4 tree 366 |

Each controller gets its own block over DDP, "one based", so each Baldrick sees its block from its own channel 1 and port 1 always starts at channel 1. The per-port start channels are in `controller-ports.csv` (`localStart`).

The file is already in the order the strings are wired, as `src/props.js` models it: the eave strip from its right end, the tree strands and mini-tree spokes up one and down the next. **Do not reverse any port on the controllers.**

## 1. The controllers (Baldrick 8 web page)

For each controller:

1. Fixed IP (the ones the export was made with, or re-run the export with yours).
2. Input: DDP.
3. For each port in use: pixel type WS2811, the pixel count and start channel from `controller-ports.csv`, colour order from the bench test (RGB or GRB), no reverse, no null pixels, gamma 1.0 and brightness 100% (the file already has the gamma curve; see below).

## 2. Falcon Player's outputs

Either type them in, or post the file.

**By hand:** Input/Output Setup → Channel Outputs → E1.31 / ArtNet / DDP / KiNet. Tick "Enable Output", add two rows:

| Active | Description | Start | Size | Type | IP |
| --- | --- | --- | --- | --- | --- |
| ✓ | Facade controller | 1 | 3513 | DDP - One Based | facade IP |
| ✓ | Garden controller | 3514 | 3642 | DDP - One Based | garden IP |

Save, then restart FPPD when it asks.

**From the file:** from the laptop, with the Pi at `fpp.local` (or its IP):

```
curl -X POST -H 'Content-Type: application/json' --data @outputs/fpp/co-universes.json http://fpp.local/api/channel/output/universeOutputs
```

This replaces any outputs already on that tab. Check the tab afterwards and restart FPPD.

## 3. Upload and play

1. Content Setup → File Manager: upload `show.fseq` on the Sequences tab and `show.mp3` on the Audio tab.
2. Content Setup → Playlists: new playlist "Winterlight", add an entry of type "Seq+Med" (sequence and media) with `show.fseq` and `show.mp3`. Play it once from the Status page.
3. Content Setup → Scheduler: the playlist on the show evenings, repeating, for example 17:00–22:00.

Falcon Player keeps the sequence on the music's clock, so the lights stay in time with the FM signal.

## 4. Checks at the test run

* **Test pattern first** (Status/Control → Display Testing, "RGB Cycle" per channel range): each prop lights on its own range from `props.csv`. If a prop starts lit a few pixels late or early, the chain before it has more or fewer pixels than the model.
* **Every prop must have exactly its pixel count in the chain.** A 50-pixel string on a 46-pixel letter leaves 4 pixels: cut them off before the next prop's pigtail, or every prop after it on that port shifts by 4. The same goes for the 100-pixel strings used for two props side by side: the pixels between the two props must be cut out, not folded behind. (If spare pixels must stay, change the prop's count in `src/props.js` and re-run the export; the mini trees' port is at 594 of 600.)
* **Brightness.** The cue levels and colours are screen values, so the export applies a 2.2 gamma curve: a 50% fade is 22% PWM, and the yellows come out warm. If the show looks too dark in fades, re-export with `--gamma 1.8`; if it's too bright or the supplies run warm, `--brightness 70`.

## What's in the file

For each 25 ms frame, the exporter takes the video frame on screen at that moment (never more than one 33 ms video frame off), and for each pixel: lit when its channel is on (on the two-colour strips, when the channel's colour includes the bulb's yellow or blue), coloured with the bulb colour from the model, scaled by the channel's detected level, then gamma and brightness. Off is black. The test `tests/fseq.test.js` checks sample frames against the site's own player, reads the whole committed file back, and checks the DDP blocks against the wiring plan.

The FSEQ layout follows Falcon Player's `docs/FSEQ_Sequence_File_Format.txt` and its reader in `src/fseq/FSEQFile.cpp`: v2.0, 248 zstd blocks of 30 frames, no sparse ranges, `mf` (show.mp3) and `sp` variable headers.
