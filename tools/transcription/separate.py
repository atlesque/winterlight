"""Separate audio on the desktop using transferred checkpoints only."""
import argparse
from pathlib import Path
from runtime import require_desktop


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('model', choices=('demucs', 'roformer'))
    parser.add_argument('audio', type=Path)
    parser.add_argument('output', type=Path)
    parser.add_argument('--device', choices=('cpu', 'cuda'), default='cuda')
    parser.add_argument('--seconds', type=float, help='Limit input for smoke validation')
    args = parser.parse_args()
    require_desktop()
    work = Path(__file__).resolve().parents[2] / 'work/transcription'
    if not args.output.resolve().is_relative_to(work.resolve()):
        parser.error('Outputs must stay under work/transcription')
    import soundfile as sf
    import torch
    torch.set_num_threads(4)
    if args.model == 'demucs':
        from demucs.hf import load_safetensors_model
        from demucs.apply import apply_model
        from demucs.audio import convert_audio
        path = work / 'models/demucs/5c90dfd2.safetensors'
        model = load_safetensors_model(path).eval()
        audio, sr = sf.read(args.audio, always_2d=True, dtype='float32')
        if args.seconds is not None:
            audio = audio[:int(sr * args.seconds)]
        tensor = convert_audio(torch.from_numpy(audio.T.copy()), sr, model.samplerate, model.audio_channels)
        reference = tensor.mean(0)
        mean, std = reference.mean(), reference.std().clamp_min(1e-8)
        tensor = (tensor - mean) / std
        with torch.inference_mode():
            separated = apply_model(model, tensor[None], device=args.device,
                                    shifts=1, split=True, overlap=0.25, progress=True)[0].cpu()
        separated = separated * std + mean
        args.output.mkdir(parents=True, exist_ok=True)
        for name, stem in zip(model.sources, separated):
            sf.write(args.output / f'{name}.wav', stem.T.numpy(), model.samplerate, subtype='PCM_16')
    else:
        from bs_roformer.clean_api import BSRoformerSession
        folder = work / 'models/roformer/roformer-model-bs-roformer-sw-by-jarredou'
        audio, sr = sf.read(args.audio, always_2d=True, dtype='float32')
        if args.seconds is not None:
            audio = audio[:int(sr * args.seconds)]
        source = args.output / 'input'
        source.mkdir(parents=True, exist_ok=True)
        sf.write(source / 'song.wav', audio, sr, subtype='FLOAT')
        session = BSRoformerSession(model_path=folder / 'BS-Rofo-SW-Fixed.ckpt',
                                  config_path=folder / 'BS-Rofo-SW-Fixed.yaml', device=args.device)
        session.load()
        try:
            session.infer(source, store_dir=args.output / 'stems')
        finally:
            session.release()


if __name__ == '__main__':
    main()
