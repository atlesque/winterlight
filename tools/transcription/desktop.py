"""Launch transcription tools over SSH. No local model imports or inference.

Connection settings live in ignored work/transcription/desktop.json:
{"host": "SSH alias", "root": "Windows workspace", "python": "Windows Python"}
"""
import argparse
import base64
import json
from pathlib import Path
import subprocess
import tempfile
import uuid
import zipfile

ROOT = Path(__file__).resolve().parents[2]
TOOLS = ('sync', 'separate', 'compare_models', 'run_yourmt3', 'evaluate', 'assemble',
         'preview', 'split_fullmix', 'smoke_desktop', 'test_pipeline')


def ps_quote(value):
    return "'" + str(value).replace("'", "''") + "'"


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('tool', choices=TOOLS)
    parser.add_argument('arguments', nargs=argparse.REMAINDER)
    args = parser.parse_args()
    settings = json.loads((ROOT / 'work/transcription/desktop.json').read_text())
    root, python = settings['root'], settings['python']
    if args.tool == 'sync':
        name = f'winterlight-code-{uuid.uuid4().hex}.zip'
        with tempfile.TemporaryDirectory() as directory:
            archive = Path(directory) / name
            with zipfile.ZipFile(archive, 'w', zipfile.ZIP_DEFLATED) as bundle:
                for folder in ('tools/transcription', 'docs'):
                    for source in (ROOT / folder).glob('*'):
                        if source.is_file():
                            bundle.write(source, str(source.relative_to(ROOT)))
            subprocess.run(['scp', '-q', str(archive), f"{settings['host']}:{name}"], check=True)
        command = '\n'.join([
            "$ErrorActionPreference='Stop'; $ProgressPreference='SilentlyContinue'",
            f'$archive=Join-Path $env:USERPROFILE {ps_quote(name)}',
            f'Expand-Archive -LiteralPath $archive -DestinationPath {ps_quote(root)} -Force',
            'Remove-Item -LiteralPath $archive',
        ])
        encoded = base64.b64encode(command.encode('utf-16-le')).decode('ascii')
        result = subprocess.run(['ssh', '-o', 'BatchMode=yes', settings['host'],
                                 'powershell', '-NoProfile', '-EncodedCommand', encoded])
        raise SystemExit(result.returncode)
    command = '\n'.join([
        "$ErrorActionPreference='Stop'; $ProgressPreference='SilentlyContinue'",
        f'Set-Location -LiteralPath {ps_quote(root)}',
        "$env:HF_HUB_OFFLINE='1'; $env:TRANSFORMERS_OFFLINE='1'",
        "$env:MT3_CHECKPOINT_DIR=Join-Path (Get-Location) 'work/transcription/models/mt3'",
        "$env:HF_HOME=Join-Path (Get-Location) 'work/transcription/cache/huggingface'",
        "$env:PYTHONUTF8='1'",
        '& ' + ' '.join(ps_quote(v) for v in [python, '-u',
            f'tools/transcription/{args.tool}.py', *args.arguments]),
        'exit $LASTEXITCODE',
    ])
    encoded = base64.b64encode(command.encode('utf-16-le')).decode('ascii')
    result = subprocess.run(['ssh', '-o', 'BatchMode=yes', '-o', 'ConnectTimeout=10',
                             settings['host'], 'powershell', '-NoProfile', '-EncodedCommand', encoded])
    raise SystemExit(result.returncode)


if __name__ == '__main__':
    main()
