"""Run the recommended YourMT3 checkpoint on a mix or a directory of stems.

Install mt3-infer at the revision recorded in docs/transcription-results.md.
Set MT3_CHECKPOINT_DIR and HF_HOME under work/transcription before invoking.
Outputs are derived media and must remain in the gitignored work directory.
"""
import argparse
import json
from pathlib import Path


def stem_name(path):
    name = Path(path).stem.removeprefix('song_')
    return 'lead' if name == 'vocals' else name


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("input", type=Path)
    parser.add_argument("output", type=Path)
    parser.add_argument("--device", choices=("cpu", "cuda", "mps"), default="cpu",
                        help="mps is an experimental direct-model path; mt3-infer's public API only supports CPU/CUDA")
    parser.add_argument("--threads", type=int, default=4)
    parser.add_argument("--batch-size", type=int, default=8)
    parser.add_argument("--overwrite", action="store_true")
    parser.add_argument("--stems", nargs="+", help="Only these input filenames, without .wav")
    args = parser.parse_args()
    ignored_root = Path(__file__).resolve().parents[2] / "work/transcription"
    if not args.output.resolve().is_relative_to(ignored_root.resolve()):
        parser.error("Derived outputs must stay under work/transcription")
    if args.threads < 1 or args.batch_size < 1:
        parser.error("--threads and --batch-size must be positive")
    import librosa
    import torch
    import pretty_midi
    from mt3_infer import load_model

    torch.set_num_threads(args.threads)
    model = load_model("yourmt3", device="cpu" if args.device == "mps" else args.device)
    if args.device == "mps":
        if not torch.backends.mps.is_available():
            parser.error("MPS unavailable")
        model.model.to("mps")
        model.device_str = "mps"

    @torch.inference_mode()
    def forward_with_progress(features):
        predictions = []
        for start in range(0, len(features), args.batch_size):
            batch = features[start:start + args.batch_size].to(model.device_str)
            result = model.model.inference_file(bsz=args.batch_size, audio_segments=batch)
            predictions.extend(result[0] if isinstance(result, tuple) else result)
            print(f"Decoded {min(start + args.batch_size, len(features))}/{len(features)} segments", flush=True)
        return predictions

    model.forward = forward_with_progress
    inputs = sorted(args.input.glob("*.wav")) if args.input.is_dir() else [args.input]
    if args.input.is_dir():
        inputs = [source for source in inputs if stem_name(source) != 'instrumental']
    if args.stems:
        selected = {stem_name(Path(f'{name}.wav')) for name in args.stems}
        inputs = [source for source in inputs if stem_name(source) in selected]
    if not inputs:
        parser.error("No WAV inputs found")
    (args.output / "stems").mkdir(parents=True, exist_ok=True)
    (args.output / "midi").mkdir(exist_ok=True)
    summaries = {}
    for source in inputs:
        name = stem_name(source)
        destination = args.output / "midi" / f"{name}.mid"
        reference = args.output / "stems" / f"{name}.wav"
        if reference.exists() or reference.is_symlink():
            if reference.resolve() != source.resolve():
                raise FileExistsError(f"{reference} references a different audio source")
        else:
            reference.symlink_to(source.resolve())
        if destination.exists() and not args.overwrite:
            midi = pretty_midi.PrettyMIDI(str(destination))
        else:
            audio, sample_rate = librosa.load(source, sr=16000, mono=True)
            midi = model.transcribe(audio, sr=sample_rate)
            midi.save(str(destination))
            midi = pretty_midi.PrettyMIDI(str(destination))
        summaries[name] = [{"program": int(instrument.program),
                            "name": instrument.name,
                            "is_drum": instrument.is_drum,
                            "notes": len(instrument.notes)} for instrument in midi.instruments]
        print(name, summaries[name], flush=True)
    (args.output / "instrument-summary.json").write_text(json.dumps(summaries, indent=2) + "\n")


if __name__ == "__main__":
    main()
