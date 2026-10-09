# Transcription on Alex-desktop

Model inference runs on Alex-desktop over the saved LAN SSH connection. The laptop only launches jobs and reviews results. Never fall back to laptop inference when the desktop is unavailable. Do not fetch new model weights without explicit user authorization.

The migration transfers the existing checkpoints, model source snapshots, input recording, stems, MIDI, scoring evidence and listening previews. The desktop workspace is outside Git and Dropbox; its checkpoint directory points into the desktop's external model store. Existing laptop results remain reviewable. Do not commit derived media.

## Launch from the laptop

Connection details are deliberately untracked in `work/transcription/desktop.json`. It contains `host` (saved SSH alias), `root` (desktop workspace) and `python` (desktop environment executable), all as strings. SSH uses the user's saved configuration and agent; no private keys or credentials belong in this repository.

```sh
# Deploy code and documentation changes; never transfers or downloads weights.
python3 tools/transcription/desktop.py sync

# GPU separation using explicitly local checkpoint paths.
python3 tools/transcription/desktop.py separate demucs work/transcription/song.wav work/transcription/desktop-demucs
python3 tools/transcription/desktop.py separate roformer work/transcription/song.wav work/transcription/desktop-roformer

python3 tools/transcription/desktop.py run_yourmt3 work/transcription/desktop-roformer/stems work/transcription/desktop-yourmt3 --device cuda --batch-size 1 --stems bass drums lead piano
python3 tools/transcription/desktop.py compare_models basicpitch --separator-root work/transcription/desktop-demucs --run-root work/transcription/desktop-basicpitch
python3 tools/transcription/desktop.py compare_models bytedance --separator-root work/transcription/desktop-demucs --run-root work/transcription/desktop-piano --checkpoint work/transcription/models/bytedance-piano.pth --device cuda
python3 tools/transcription/desktop.py compare_models adtof --separator-root work/transcription/desktop-roformer/stems --run-root work/transcription/desktop-drums --device cuda

python3 tools/transcription/desktop.py evaluate work/transcription/desktop-yourmt3 --reference-stems work/transcription/demucs-basicpitch/stems
python3 tools/transcription/desktop.py test_pipeline
```

Assembly and preview use the same launcher (`assemble` and `preview`) with their existing arguments. Paths passed to the tools are relative to the desktop workspace. Copy finished MIDI, metrics and previews back over SSH when needed for review. The launcher waits for completion and reports the remote exit status.

GPU jobs share the desktop with ComfyUI. Check available GPU memory before large jobs; do not stop or unload another session without authorization. `--device cpu` runs on the desktop CPU when appropriate; it does not select laptop execution.

## Environment and offline safeguards

The isolated Python 3.11 environment reuses the desktop's existing Torch/CUDA and torchaudio files through directory junctions. Its other packages are installed separately from ComfyUI. ComfyUI files and running sessions are not changed. Because Torch and torchaudio are linked, changes to the shared GPU runtime require another transcription smoke test.

`requirements-desktop.txt` lists software dependencies, not checkpoint downloads. The previously downloaded Demucs, Basic Pitch and ByteDance Python package snapshots are available in the transferred `sources/vendor`; the MT3, RoFormer and ADTOF source revisions are those in the original results note. Basic Pitch and ADTOF use their transferred bundled weights. YourMT3 explicitly sets `auto_download=False`; the launcher and inference guard set Hugging Face and Transformers offline flags. Demucs loads its local safetensors directly; RoFormer receives both explicit local checkpoint and config paths.

Audio references use hard links on Windows, with a copy fallback when linking is unavailable. The migration manifest verifies SHA-256 hashes of transferred checkpoints and bundled assets before reconstructing old audio references.

## Migration verification

Verified on 9 October 2026:

- 64 transferred checkpoints and bundled assets passed SHA-256 verification; 48 audio references were restored.
- All 13 synthetic pipeline tests passed on Windows, including the laptop inference guard and reusable audio references.
- Four-second audio smoke tests passed for Demucs, RoFormer, Basic Pitch, ByteDance piano transcription, ADTOF and YourMT3. Demucs, ByteDance, ADTOF and YourMT3 ran on CUDA. Basic Pitch used ONNX on CPU. RoFormer ran on the desktop CPU because ComfyUI retained most GPU memory; its CUDA inference path remains untested in this migration.
- Re-evaluating the existing final MIDI against the fixed Demucs references produced exactly the original metrics JSON.
- Rendering the existing final MIDI listening previews completed successfully on the desktop.

The reused GPU runtime is Torch 2.13.0+cu130 with CUDA 13.0, torchaudio 2.11.0+cu130 and an RTX 5090. These short checks establish that this workflow works with those installed versions; retest after changing the shared runtime. Resolved desktop software versions and the validation logs remain in the ignored desktop work directory.

These are migration checks, not a new full-song model benchmark or listening approval. The original results and musical-review caveats still apply. Laptop inference is disabled. Removing the old laptop checkpoint/runtime copies requires separate cleanup approval.
