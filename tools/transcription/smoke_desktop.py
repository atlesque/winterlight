"""Run short desktop-only migration checks without fetching any model assets."""
import argparse
import json
from pathlib import Path
import subprocess
import sys
import time
from runtime import require_desktop


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--start-step', type=int, choices=range(1, 9), default=1)
    args = parser.parse_args()
    require_desktop()
    import soundfile as sf
    import torch
    root = Path(__file__).resolve().parents[2]
    work = root / 'work/transcription'
    output = work / 'desktop-validation'
    output.mkdir(exist_ok=True)
    song, sr = sf.read(work / 'song.wav', start=35 * 44100, stop=39 * 44100, always_2d=True)
    sf.write(output / 'song.wav', song, sr)
    report = {'host': __import__('socket').gethostname(), 'torch': torch.__version__,
              'cuda': torch.version.cuda, 'gpu': torch.cuda.get_device_name(), 'steps': []}
    commands = [
        ['-m', 'unittest', 'discover', '-s', 'tools/transcription', '-p', 'test_*.py'],
        ['tools/transcription/separate.py', 'demucs', str(output / 'song.wav'), str(output / 'demucs'), '--device', 'cuda'],
        ['tools/transcription/separate.py', 'roformer', str(output / 'song.wav'), str(output / 'roformer'), '--device', 'cpu'],
        ['tools/transcription/compare_models.py', 'basicpitch', '--separator-root', str(output / 'demucs'), '--run-root', str(output / 'basicpitch'), '--stems', 'guitar'],
        ['tools/transcription/compare_models.py', 'bytedance', '--separator-root', str(output / 'demucs'), '--run-root', str(output / 'piano'), '--checkpoint', str(work / 'models/bytedance-piano.pth'), '--device', 'cuda'],
        ['tools/transcription/compare_models.py', 'adtof', '--separator-root', str(output / 'roformer/stems'), '--run-root', str(output / 'drums'), '--device', 'cuda'],
        ['tools/transcription/run_yourmt3.py', str(output / 'roformer/stems'), str(output / 'yourmt3'), '--device', 'cuda', '--batch-size', '1', '--stems', 'piano'],
        ['tools/transcription/evaluate.py', 'work/transcription/final', '--reference-stems', 'work/transcription/demucs-basicpitch/stems'],
    ]
    if args.start_step > 1:
        report['steps'] = json.loads((output / 'report.json').read_text())['steps'][:args.start_step - 1]
    for index, command in enumerate(commands):
        if index < args.start_step - 1:
            continue
        start = time.monotonic()
        print(f'Step {index + 1}/{len(commands)}: {command[0:2]}', flush=True)
        log = output / f'step-{index + 1}.log'
        with log.open('w', encoding='utf-8') as handle:
            result = subprocess.run([sys.executable, '-u', *command], cwd=root,
                                    stdout=handle, stderr=subprocess.STDOUT)
        step = {'command': command, 'exit_code': result.returncode,
                'seconds': round(time.monotonic() - start, 2), 'log': str(log)}
        report['steps'].append(step)
        (output / 'report.json').write_text(json.dumps(report, indent=2))
        print(step, flush=True)
        if result.returncode:
            print(log.read_text(encoding='utf-8'), flush=True)
            raise SystemExit(result.returncode)
    print('All desktop migration checks passed.', flush=True)


if __name__ == '__main__':
    main()
