# Plan: per-instrument transcription of *Wizards in Winter*

**Goal:** produce note-level MIDI for each instrument in the hosted track (`public/media/wizards-in-winter.m4a`) so every prop group can later be driven as its own instrument. This plan is for an agent with normal internet access (model downloads). It does **not** change the visualization; that comes after the results are compared.

## Rules for the run

- Work only from the repo's own audio file. Do not download MIDI, tabs or scores of the song from the internet.
- Never commit stems, MIDI, rendered audio or note CSVs: they are derived from a commercial recording. Write them under `work/transcription/` (gitignored). Commit only code, this plan and a metrics-only results note.
- Do not edit `src/` or the `.wltiming` artifact.
- Record exact model names, versions/checkpoints and commands for every run.

## Baseline (already done, 9 Oct 2026)

Spleeter 5-stem separation → Spotify Basic Pitch per stem, drums split by frequency band. Scored with `tools/transcription/evaluate.py`:

| Stem | Notes | Onset F | Chroma cos | Coverage | Match to filmed lights (F) |
|---|---|---|---|---|---|
| piano | 1,008 | 0.611 | 0.749 | 0.912 | 0.460 |
| bass | 458 | 0.489 | 0.726 | 0.880 | 0.470 |
| other (guitar + strings + synth) | 1,122 | 0.457 | 0.719 | 0.770 | 0.468 |
| kick / snare / hats (band onsets) | 778 / 504 / 454 | n/a | n/a | n/a | 0.527 / 0.479 / 0.391 |

The filmed light changes match best when shifted by about +0.11 s, i.e. the stored lights land roughly 110 ms **before** the matching audio onsets. Weaknesses: guitar, violin and synth are lumped in one stem; many octave errors and spurious notes; drum classes are bleed-prone.

## Recommended model stack

### 1. Source separation (biggest single gain)

| Use | Model | Why |
|---|---|---|
| guitar, piano stems | **Demucs v4 `htdemucs_6s`** (`pip install demucs`; weights from `dl.fbaipublicfiles.com`) | Only widely used open model with separate guitar and piano stems |
| drums, bass, vocal/lead split | **BS-RoFormer / Mel-Band RoFormer** checkpoints via `audio-separator` (`pip install "audio-separator[cpu]"` or `[gpu]`) | Current top open models on MUSDB-style drums/bass/vocals; cleaner than Demucs on these |
| fallback | `htdemucs_ft` | If RoFormer checkpoints are unavailable |

Final stem set to aim for: `drums`, `bass`, `guitar`, `piano`, `lead` (vocal-model output: violin/lead synth often lands here), `other`. Listen to each stem briefly and note in the results what actually ended up in it.

### 2. Transcription

| Stem | Primary | Compare against |
|---|---|---|
| all (full mix and each stem) | **YourMT3+** (multi-instrument MT3 successor, 2024; code and checkpoints on GitHub/Hugging Face, `mimbres/YourMT3`; use the best "YPTF.MoE+Multi" checkpoint) | Basic Pitch baseline |
| piano | **ByteDance high-resolution piano transcription** (`pip install piano_transcription_inference`) | YourMT3+ on the piano stem; Transkun if time allows |
| drums | YourMT3+ drum track (GM drum notes) | **ADTOF** drum transcription models; baseline band onsets |
| bass, guitar, lead, other | YourMT3+ on each stem | Basic Pitch on the same new stems (isolates separation gain from model gain) |

YourMT3+ labels instruments itself, so the full-mix run is a useful cross-check of what instruments the song contains. Check each project's README for the current recommended checkpoint before running; prefer GPU but a 3-minute track is feasible on CPU.

## Steps

1. Convert audio: `ffmpeg -i public/media/wizards-in-winter.m4a -ar 44100 work/transcription/song.wav`.
2. Separate with both separators; build the target stem set.
3. For each candidate (model × stem), write a run directory:
   `work/transcription/<run-name>/stems/<stem>.wav` and `.../midi/<stem>.mid` (drums as `midi/drums.mid` using GM drum notes).
4. Score every run: `python -I tools/transcription/evaluate.py work/transcription/<run-name>` → `metrics.json`.
5. Pick the best source per stem by metrics **and** a listening check: render the MIDI (e.g. FluidSynth with any GM soundfont) and A/B it against the stem in the most recognizable sections (intro piano, main riff, solos, ending).
6. Assemble `work/transcription/final/wizards-instruments.mid`: one named track per instrument, tempo map from beat tracking (song detects at ~152 BPM), notes cleaned of sub-30 ms fragments and obvious octave jumps.
7. Commit `docs/transcription-results.md` (metrics tables, chosen sources, commands, model versions, what landed in each stem, and remaining error areas with timestamps). No note data in the commit.

## Comparing with the baseline

Higher onset F and chroma cosine on the same stem name = better. A clearly better result should also show: fewer octave errors on listening, guitar and lead separated from "other", drums classes that sound right when rendered, and equal or higher match to the filmed lights. Report the offset found by `evaluate.py`; if the new transcription confirms the ~110 ms lead, flag it as a candidate correction for the existing show.

## Intended instrument → prop mapping (for the later build)

| Prop group | Instrument | Behaviour |
|---|---|---|
| 10 poles | piano | pitch → pole like a 10-key keyboard, velocity → brightness |
| 4 arches | guitar / lead | pitch → fill height along the arch |
| 2 window outlines | bass | note-on pulse, pitch → hue |
| door outline | kick + snare | kick full flash, snare alternating halves |
| 2 stars | hats / cymbals | sparkle on hats, burst on crashes |

Adjust once the results show which instruments separate cleanly.
