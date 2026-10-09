# Wizards in Winter transcription results — 9 October 2026

The recommended models were run against the repository's recording. All stems,
MIDI, checkpoint files, rendered comparisons and note-level diagnostics stay in
the ignored `work/transcription/` directory. The light-show implementation and
stored timing artifact are unchanged.

## How to interpret the comparison

There is no annotated ground-truth score. Onset F compares MIDI attacks with
Librosa's audio onset detector; chroma cosine compares pitch classes and cannot
detect octave errors. Coverage measures whether notes exist during loud audio.
Filmed-light F compares attacks with changes across the whole stored show, not
with a ground-truth instrument performance or individual prop group.

Candidates from different separators are also scored against **the same Demucs
reference stems**, using `evaluate.py --reference-stems`. These fixed-reference
scores allow a controlled transcription comparison. Each run's own-stem scores
are retained separately, but changing its reference audio confounds comparisons.
Demucs is itself an imperfect reference and can favor transcriptions of its bleed.

The baseline in `transcription-plan.md` is historical: its original Spleeter
stems/MIDI are not in this checkout and were not rerun. Comparisons against those
numbers are diagnostic, not evidence of an increase in ground-truth accuracy.

No listening judgment is claimed. Soundfont renders and A/B sheets are generated
for listening review at 0–20, 35–55, 95–115 and 165–185 seconds. Model predictions
and energy measurements cannot establish what actually landed in each stem.
Any assembled candidate is provisional until that review resolves bleed,
instrument identity, octave mistakes and percussion classes.

## Measured comparisons

D = Demucs, R = RoFormer, BP = Basic Pitch, Y = YourMT3+, BD = ByteDance. All melodic rows below use the fixed Demucs references in `demucs-basicpitch/stems`. Light offsets are shifts applied to the stored light events: positive means lights lead the audio.

| Stem | Candidate | Notes | Onset F | Chroma cos | Coverage | Light F | Offset (s) |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: |
| bass | D / BP | 587 | 0.566 | 0.748 | 0.928 | 0.497 | +0.12 |
| bass | R / BP | 592 | 0.586 | 0.759 | 0.949 | 0.494 | +0.11 |
| bass | D / Y | 543 | 0.462 | 0.764 | 0.370 | 0.277 | -0.01 |
| bass | R / Y | 517 | 0.399 | 0.612 | 0.342 | 0.326 | -0.09 |
| bass | Mix / Y labels | 219 | 0.266 | 0.737 | 0.273 | 0.325 | -0.06 |
| guitar | D / BP | 1,020 | 0.507 | 0.751 | 0.825 | 0.531 | +0.15 |
| guitar | R / BP | 816 | 0.506 | 0.693 | 0.765 | 0.540 | +0.01 |
| guitar | D / Y | 2,934 | 0.426 | 0.705 | 0.649 | 0.407 | +0.09 |
| guitar | Mix / Y labels | 2,463 | 0.505 | 0.709 | 0.735 | 0.371 | +0.09 |
| piano | D / BP | 664 | 0.576 | 0.718 | 0.626 | 0.343 | -0.30 |
| piano | R / BP | 1,704 | 0.629 | 0.725 | 0.977 | 0.515 | +0.10 |
| piano | D / Y | 5,362 | 0.445 | 0.642 | 0.581 | 0.452 | -0.16 |
| piano | R / Y | 2,514 | 0.460 | 0.641 | 0.765 | 0.573 | -0.15 |
| piano | D / BD | 2,609 | 0.745 | 0.642 | 0.515 | 0.454 | -0.12 |
| piano | R / BD | 2,379 | 0.555 | 0.635 | 0.718 | 0.527 | -0.11 |
| piano | Mix / Y labels | 1,857 | 0.631 | 0.594 | 0.536 | 0.508 | -0.12 |
| lead | D / BP | 381 | 0.303 | 0.784 | 0.943 | 0.347 | -0.13 |
| lead | R / BP | 267 | 0.406 | 0.688 | 0.991 | 0.143 | +0.26 |
| lead | D / Y | 1,922 | 0.046 | 0.308 | 0.062 | 0.460 | +0.08 |
| lead | R / Y | 124 | 0.090 | 0.639 | 0.328 | 0.030 | -0.20 |
| lead | Mix / Y labels | 27 | 0.013 | — | 0.000 | 0.070 | +0.16 |
| other | D / BP | 1,476 | 0.428 | 0.774 | 0.904 | 0.448 | +0.08 |
| other | R / BP | 1,987 | 0.438 | 0.697 | 0.976 | 0.446 | -0.10 |
| other | D / Y | 4,434 | 0.332 | 0.615 | 0.784 | 0.405 | -0.15 |
| other | Mix / Y labels | 2,202 | 0.376 | 0.552 | 0.833 | 0.510 | +0.06 |

Changing the reference changes the apparent result. For example, RoFormer/BP bass has own-stem F/chroma/coverage **0.636/0.793/0.949**, versus fixed-reference **0.586/0.759/0.949**. RoFormer/BP piano has own-stem **0.829/0.777/0.979**, versus fixed-reference **0.629/0.725/0.977**. YourMT3 on the same RoFormer piano has own-stem **0.703/0.709/0.767**, versus fixed-reference **0.460/0.641/0.765**; the piano choice was checked on both separators. ByteDance on RoFormer piano has own-stem **0.845/0.692/0.708**, versus fixed-reference **0.555/0.635/0.718**. Own-stem scores are retained in each run’s `metrics.json`; fixed-reference scores are in `metrics-reference.json`.

| Drum candidate | Kick hits / light F / offset | Snare hits / light F / offset | Hats/cymbals hits / light F / offset |
| --- | --- | --- | --- |
| Historical band-onset baseline | 778 / 0.527 / not recorded | 504 / 0.479 / not recorded | 454 / 0.391 / not recorded |
| D / ADTOF | 242 / 0.363 / +0.12 s | 88 / 0.188 / +0.30 s | 257 / 0.414 / +0.08 s |
| R / ADTOF | 246 / 0.361 / +0.12 s | 88 / 0.188 / +0.30 s | 305 / 0.431 / +0.11 s |
| D / Y | 241 / 0.366 / +0.10 s | 115 / 0.213 / +0.15 s | 329 / 0.368 / +0.10 s |
| R / Y | 245 / 0.366 / +0.11 s | 135 / 0.243 / -0.06 s | 323 / 0.368 / -0.10 s |
| Mix / Y | 250 / 0.358 / +0.11 s | 88 / 0.191 / +0.30 s | 219 / 0.352 / -0.13 s |

RoFormer/YourMT3 drums retain the complete GM percussion track and have the strongest kick/snare light proxies among the new runs. RoFormer/ADTOF has the best new hats/cymbals proxy, so it remains an alternative for listening review. The new kick/snare light scores remain below the historical baseline. This run does **not** meet the plan’s uniform improvement gate.

### Provisional assembled candidate

Local file: `work/transcription/final/wizards-instruments.mid`, six named tracks, **6,162 notes**, 960 ticks/beat. The container lasts **185.875639 s**, within 0.1 ms of the recording. Beat tracking with `trim=False` detected **452 beats** and **151.999 BPM**, producing 316 tempo events; endpoint trimming otherwise discarded trailing beats. Note pitch and velocity match the selected sources exactly, and every note start/end differs by less than **0.22 ms** due to MIDI tick rounding. No note is shifted by the inferred light-show offset.

| Track | Selected source | Notes | Reason for provisional choice |
| --- | --- | ---: | --- |
| bass | R / BP | 592 | Strong fixed-reference onset/chroma/coverage balance and a narrower observed pitch range than the Demucs candidate |
| piano | R / BP | 1,704 | Stronger chroma/coverage balance than ByteDance or YourMT3; listening must distinguish sustain from spurious activity |
| guitar | D / BP | 1,020 | Better chroma/coverage than the other guitar candidates |
| lead | D / BP | 381 | Better pitch/coverage proxies than YourMT3; identity is still unconfirmed and onset recall is weak |
| other | D / BP | 1,476 | Better chroma than RoFormer/BP, and stronger proxies than YourMT3 |
| drums | R / Y | 989 | Full GM track, strongest new kick/snare proxies; hats/cymbals and extra percussion require review |

Assembly and listening renders are intentionally note-only: source pitch bends and pedal/control events are omitted. Therefore the assembled chroma scores differ from raw model MIDI, even though note pitch, velocity and timing are preserved. Coverage and chroma are proxies and do not justify choosing a model solely by the highest individual number.

Post-assembly fixed-reference metrics:

| Track | Onset F | Chroma cos | Coverage | Light F | Offset (s) |
| --- | ---: | ---: | ---: | ---: | ---: |
| bass | 0.588 | 0.747 | 0.949 | 0.494 | +0.11 |
| guitar | 0.507 | 0.737 | 0.825 | 0.530 | +0.15 |
| lead | 0.303 | 0.877 | 0.943 | 0.349 | -0.13 |
| other | 0.428 | 0.773 | 0.904 | 0.448 | +0.08 |
| piano | 0.631 | 0.692 | 0.977 | 0.518 | +0.10 |

Cleanup removes pitched fragments under 30 ms, duplicates, out-of-recording notes and same-pitch overlaps when needed; short drum attacks and retriggers are preserved. The selected sources required no fragment removal or overlap merging. Three isolated guitar octave-spike candidates were flagged in the **102–112 s** region, with review windows **102–108 s** and **106–112 s**. Their pitches were not automatically changed; no reduction in octave errors is claimed.

Bass, piano and kick offsets around **+0.10–+0.12 s** support the earlier observation that the stored lights lead the audio. Lead, snare and cymbal candidates give inconsistent offsets. The search uses a 70 ms matching window, 10 ms grid and largest-offset tie-break; it is not a precise clock calibration. Do not apply a global show correction from these proxies alone.

Listening entry point: `work/transcription/final/preview/index.html`. Each run’s own previews and the alternative MIDI files remain local. Review **0–20 s** (piano/lead bleed), **35–55 s** (guitar/bass separation), **95–115 s** (including the guitar octave flags) and **165–185 s** (ending notes and percussion). These are required review areas, not asserted listening findings.

Assembly and preview commands:

```sh
python -I tools/transcription/assemble.py work/transcription/song.wav --source piano=work/transcription/roformer-basicpitch/midi/piano.mid --source bass=work/transcription/roformer-basicpitch/midi/bass.mid --source guitar=work/transcription/demucs-basicpitch/midi/guitar.mid --source lead=work/transcription/demucs-basicpitch/midi/lead.mid --source other=work/transcription/demucs-basicpitch/midi/other.mid --source drums=work/transcription/roformer-yourmt3/midi/drums.mid
python -I tools/transcription/preview.py work/transcription/final --soundfont work/transcription/soundfonts/FluidR3_GM.sf2
```

Final per-track scoring/preview MIDI is split from the master candidate; the assembly audit and timing verification are kept locally. Model setup is recorded, but Demucs `--shifts 1` used a random shift without a pinned seed, so rerunning its command is not guaranteed to yield bit-identical stems.

Historical melodic baseline, on the original Spleeter references:

| Stem | Notes | Onset F | Chroma cos | Coverage | Light F |
| --- | ---: | ---: | ---: | ---: | ---: |
| piano | 1,008 | 0.611 | 0.749 | 0.912 | 0.460 |
| bass | 458 | 0.489 | 0.726 | 0.880 | 0.470 |
| other (guitar/strings/synth) | 1,122 | 0.457 | 0.719 | 0.770 | 0.468 |

## Model provenance

Source: `public/media/wizards-in-winter.m4a`, 185.875737 seconds,
SHA-256 `8eb6d0f422eca3c1e45eb0832153fe1c79ba6a83536647efc50a768bec2330d6`.
Execution used macOS arm64, Python 3.11.16 and PyTorch 2.5.1. The resolved local
environment is saved in `work/transcription/requirements-resolved.txt`.
Inference also pins Transformers 4.43.4 and Hugging Face Hub 0.36.2; audio
evaluation uses Librosa 0.11.0, mir-eval 0.8.2 and pretty-midi 0.2.11.post0.

| Model | Exact implementation/checkpoint |
| --- | --- |
| Demucs | 4.1.0, `htdemucs_6s`, `5c90dfd2.safetensors`, HF revision `3c5ee475be622df764938de97e4281a7b07ffa58` |
| BS-RoFormer | SW by jarredou, `BS-Rofo-SW-Fixed.ckpt`; [bs-roformer-infer](https://github.com/openmirlab/bs-roformer-infer) 0.1.6, revision `95c8de7b0b091d00f064d694bf916a21866c32f5` |
| YourMT3+ | `YPTF.MoE+Multi (noPS)`, experiment `mc13_256_g4_all_v7_mt3f_sqr_rms_moe_wf4_n8k2_silu_rope_rp_b36_nops`, `last.ckpt` from the [official Space](https://huggingface.co/spaces/mimbres/YourMT3); [mt3-infer](https://github.com/openmirlab/mt3-infer) revision `d8cbd287470291dee335f84315c5a9b9ff6e6c8a` |
| Piano | `piano-transcription-inference` 0.0.6; [ByteDance](https://github.com/bytedance/piano_transcription) `CRNN_note_F1=0.9677_pedal_F1=0.9186.pth` |
| Drums | [ADTOF](https://github.com/MZehren/ADTOF) converted `Frame_RNN` weights through [ADTOF-pytorch](https://github.com/xavriley/ADTOF-pytorch), revision `85c192e78f716ea0b111cc8a5ee4a8f6a3a4f8a9` |
| Basic Pitch | 0.4.0, bundled ICASSP 2022 `nmp.onnx`, ONNX Runtime 1.31.0 |

The ADTOF port is an explicitly documented substitution for the original Keras
implementation; upstream describes small preprocessing/numerical differences.
Its defaults are 100 fps with thresholds 0.22/0.24/0.32/0.22/0.30 for kick,
snare, tom, hi-hat and cymbal. The scorer omits toms and several other GM
percussion classes, so scored hit counts do not equal all MIDI drum notes.
Basic Pitch uses onset/frame thresholds 0.5/0.3, minimum duration 127.7 ms and
the default Melodia trick. ByteDance uses the published inference defaults and
compatibility aliases for removed NumPy `float`/`int` names.

Checkpoint SHA-256 identifiers:

- Demucs: `d2a1745f0744721f6b8ca5bf469b67c651ea5ed1b52998cab033b2158609d411`
- RoFormer: `24e7d35ee9c64415673d3fd33e06a67cac2c103c5df6267ba1576459c775916e`
- YourMT3+: `ae38e415c79efd5592dcb9b658cdb99ddb11d4c4e1eaa364cab04a052473fc25`
- ADTOF: `1bc986e596ec47ba0b44916f87cd4a39f0b2bec23596df3fb5d0e87749217320`
- Basic Pitch: `2c3c1d144bfa61ad236e92e169c13535c880469a12a047d4e73451f2c059a0ec`
- ByteDance: `c3fa9730725bf4a762f1c14bc80cd5986eacda01b026f5a4a2525cd607876141`

Demucs' MPS path failed because the required convolution exceeds the supported
channel count; CPU separation completed. A YourMT3 MPS smoke test succeeded,
but the full guitar attempt was slower and was stopped before producing MIDI.
Authoritative YourMT3 candidates use CPU. Its wrapper's Git LFS downloader was
unavailable, so the official checkpoint was downloaded directly and verified.
Demucs 4.1.0 fetches the HF safetensors version instead of the older weight host.
No online song MIDI, tabs or scores were used.

## Stem identity and remaining review

Demucs guitar has RMS 0.12209, bass 0.08002, drums 0.09102, piano 0.04936,
other 0.04688 and vocals 0.02148. `lead.wav` initially aliases vocals: this is
a naming convention, not evidence of a clean violin or synth stem. Its energy
is only approximately 0.96% of the mix's energy; isolated fragments and bleed
can therefore dominate transcription scores.

Full-mix YourMT3 assigned strong guitar, piano and strings labels; these are
model predictions, not listening-confirmed instrumentation. The grouped lead
candidate has poor coverage and does not provide a dependable lead track.

Review the four preview sections for missed intro piano, guitar/piano bleed,
the sparse lead/other split, solo octave errors and ending percussion. The
whole-track pitch-class proxy cannot localize or validate these errors.

## Reproducing runs

Use the isolated environment's interpreter below; `python` denotes
`work/transcription/venv/bin/python`. Install the pinned implementations above,
download the corresponding verified checkpoints into `work/transcription/models`
and set the model caches before inference:

```sh
export PATH="$PWD/work/transcription/venv/bin:$PATH"
export HF_HOME="$PWD/work/transcription/cache/hf"
export TORCH_HOME="$PWD/work/transcription/models/torch"
export MT3_CHECKPOINT_DIR="$PWD/work/transcription/models/mt3"
ffmpeg -i public/media/wizards-in-winter.m4a -ar 44100 work/transcription/song.wav
mkdir -p work/transcription/inputs
ln -s ../song.wav work/transcription/inputs/song.wav
python -m demucs -n htdemucs_6s -d cpu --shifts 1 -j 4 --out work/transcription/demucs work/transcription/song.wav
OMP_NUM_THREADS=4 bs-roformer-infer --models_dir work/transcription/models/roformer --input_folder work/transcription/inputs --store_dir work/transcription/roformer/stems --device cpu
python -I tools/transcription/compare_models.py basicpitch --separator-root work/transcription/demucs/htdemucs_6s/song --run-root work/transcription/demucs-basicpitch
python -I tools/transcription/compare_models.py basicpitch --separator-root work/transcription/roformer/stems --run-root work/transcription/roformer-basicpitch
python -I tools/transcription/compare_models.py bytedance --separator-root work/transcription/demucs/htdemucs_6s/song --run-root work/transcription/demucs-bytedance --checkpoint work/transcription/models/bytedance-piano.pth
python -I tools/transcription/compare_models.py bytedance --separator-root work/transcription/roformer/stems --run-root work/transcription/roformer-bytedance --checkpoint work/transcription/models/bytedance-piano.pth
python -I tools/transcription/compare_models.py adtof --separator-root work/transcription/demucs/htdemucs_6s/song --run-root work/transcription/demucs-adtof
python -I tools/transcription/compare_models.py adtof --separator-root work/transcription/roformer/stems --run-root work/transcription/roformer-adtof
python -I tools/transcription/run_yourmt3.py work/transcription/demucs/htdemucs_6s/song work/transcription/demucs-yourmt3 --threads 2
python -I tools/transcription/run_yourmt3.py work/transcription/demucs/htdemucs_6s/song work/transcription/demucs-yourmt3-piano-lead --threads 4 --batch-size 4 --stems piano vocals
python -I tools/transcription/run_yourmt3.py work/transcription/roformer/stems work/transcription/roformer-yourmt3 --threads 2 --batch-size 4 --stems bass drums vocals
python -I tools/transcription/run_yourmt3.py work/transcription/roformer/stems work/transcription/roformer-yourmt3-piano --threads 4 --batch-size 4 --stems piano
python -I tools/transcription/evaluate.py work/transcription/roformer-basicpitch
python -I tools/transcription/evaluate.py work/transcription/roformer-basicpitch --reference-stems work/transcription/demucs-basicpitch/stems
```

`inputs/song.wav` is a symlink to the converted audio. The full-mix run also
uses the official YourMT3 CLI and is split with `split_fullmix.py` into GM
families: piano 0–7, guitar 24–31, bass 32–39, lead 40–43 or 80–87, drums,
and all other pitched programs. Original MIDI is retained in the ignored run.
For the recorded Demucs/YourMT3 run, the first serial process was stopped after
bass/drums/guitar/other completed. Piano/lead used the second command above,
and their completed MIDI files were copied into `demucs-yourmt3/midi` before
scoring. Both used the same weights and Demucs references.
RoFormer/YourMT3 initially used bass/drums/lead; the extra piano command above
checked the selected separator's piano before final selection. Its completed
MIDI was merged into `roformer-yourmt3/midi/piano.mid`, and both scoring files
were regenerated. YourMT3 was run on every stem used in the final candidate;
RoFormer guitar/other were optional Basic Pitch comparisons rather than extra
YourMT3 candidates.
The full-mix command and grouping command were:

```sh
OMP_NUM_THREADS=4 mt3-infer transcribe work/transcription/song.wav -m yourmt3 -d cpu --no-download -o work/transcription/yourmt3-full/midi/full.mid -v
python tools/transcription/split_fullmix.py work/transcription/yourmt3-full/midi/full.mid work/transcription/demucs/htdemucs_6s/song work/transcription/fullmix-labelled-demucs
```

Runners and scoring commands are preserved in the local model/comparison
evidence files. Raw note diagnostics remain local.

The `preview.py` helper renders offline with `tinysoundfont` 0.3.7 and
[FluidR3 GM](https://github.com/Jacalz/fluid-soundfont), SHA-256
`74594e8f4250680adf590507a306655a299935343583256f3b722c48a1bc1cb0`.
Its soundfont and license are retained locally. Rendered sounds are comparisons,
not an original-recording resynthesis or a listening sign-off.

Validation: **11 pipeline tests passed**, **19 app tests passed**, and the
production build passed. The pipeline has synthetic checks for timestamp preservation through tempo
changes, fragment/duplicate cleanup, overlapping pitched notes, short drum
attacks, percussion classification, silent/empty runs, fixed reference scoring
and offset sign. Existing app checks also cover the unchanged stored show.
