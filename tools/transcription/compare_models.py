"""Run comparison transcribers on local separator stems.

Example (install model packages in an isolated environment first)::

    python tools/transcription/compare_models.py basicpitch \\
        --separator-root work/transcription/demucs/htdemucs_6s/song \\
        --run-root work/transcription/demucs-basicpitch

ByteDance requires --checkpoint pointing to the official downloaded piano weights.
ADTOF uses the converted weights bundled with adtof-pytorch. Basic Pitch uses its
bundled ICASSP 2022 ONNX model. Outputs must stay in the ignored work directory.
"""
import argparse
from pathlib import Path


def stem_path(root, stem):
    names = [stem, 'vocals'] if stem == 'lead' else [stem]
    for name in names:
        for filename in (f'{name}.wav', f'song_{name}.wav'):
            path = root / filename
            if path.is_file():
                return path
    raise FileNotFoundError(f'No audio for {stem} in {root}')


def prepare_run(separator_root, run_root, stems):
    (run_root / 'stems').mkdir(parents=True, exist_ok=True)
    (run_root / 'midi').mkdir(exist_ok=True)
    for stem in stems:
        source = stem_path(separator_root, stem).resolve()
        link = run_root / 'stems' / f'{stem}.wav'
        if link.exists() or link.is_symlink():
            if link.resolve() != source:
                raise FileExistsError(f'{link} already references another source')
        else:
            link.symlink_to(source)


def basicpitch(run_root, stems):
    from basic_pitch import build_icassp_2022_model_path, FilenameSuffix
    from basic_pitch.inference import Model, predict
    model = Model(build_icassp_2022_model_path(FilenameSuffix.onnx))
    for stem in stems:
        print(f'Transcribing {stem} with Basic Pitch', flush=True)
        _, midi, notes = predict(run_root / 'stems' / f'{stem}.wav', model)
        for instrument in midi.instruments:
            instrument.name = stem
        midi.write(str(run_root / 'midi' / f'{stem}.mid'))
        print(f'{stem}: {len(notes)} notes', flush=True)


def bytedance(run_root, checkpoint):
    import librosa
    import numpy as np
    # The published 0.0.6 package still uses removed NumPy aliases.
    np.float = float
    np.int = int
    from piano_transcription_inference import PianoTranscription
    model = PianoTranscription(checkpoint_path=str(checkpoint), device='cpu')
    audio, _ = librosa.load(str(run_root / 'stems/piano.wav'), sr=16000, mono=True)
    model.transcribe(audio, str(run_root / 'midi/piano.mid'))


def adtof(run_root):
    from adtof_pytorch import get_default_weights_path, transcribe_to_midi
    weights = get_default_weights_path()
    if not weights or not Path(weights).is_file():
        raise FileNotFoundError('ADTOF weights missing; refusing untrained inference')
    transcribe_to_midi(run_root / 'stems/drums.wav', run_root / 'midi/drums.mid',
                       device='cpu', weights=weights)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('model', choices=('basicpitch', 'bytedance', 'adtof'))
    parser.add_argument('--separator-root', type=Path, required=True)
    parser.add_argument('--run-root', type=Path, required=True)
    parser.add_argument('--checkpoint', type=Path)
    parser.add_argument('--stems', nargs='+', default=['bass', 'guitar', 'piano', 'other', 'lead'])
    parser.add_argument('--threads', type=int, default=4)
    args = parser.parse_args()
    if args.threads < 1:
        parser.error('--threads must be positive')
    if args.model == 'bytedance' and (not args.checkpoint or not args.checkpoint.is_file()
                                    or args.checkpoint.stat().st_size < 160_000_000):
        parser.error('--checkpoint must reference the complete official ByteDance piano weights')
    work_root = Path(__file__).resolve().parents[2] / 'work/transcription'
    if not args.run_root.resolve().is_relative_to(work_root.resolve()):
        parser.error('--run-root must be inside ignored work/transcription')
    import torch
    torch.set_num_threads(args.threads)
    stems = args.stems if args.model == 'basicpitch' else ['piano' if args.model == 'bytedance' else 'drums']
    prepare_run(args.separator_root, args.run_root, stems)
    if args.model == 'basicpitch':
        basicpitch(args.run_root, stems)
    elif args.model == 'bytedance':
        bytedance(args.run_root, args.checkpoint)
    else:
        adtof(args.run_root)


if __name__ == '__main__':
    main()
