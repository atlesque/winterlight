"""Verify a transferred bundle and rebuild portable audio references on Windows."""
import hashlib
import json
import os
from pathlib import Path


def main():
    root = Path(__file__).resolve().parents[2]
    manifest = json.loads((root / 'work/transcription/migration-manifest.json').read_text())
    for name, expected in manifest['sha256'].items():
        digest = hashlib.sha256()
        with (root / name).open('rb') as source:
            for block in iter(lambda: source.read(8 * 1024 * 1024), b''):
                digest.update(block)
        if digest.hexdigest() != expected:
            raise ValueError(f'Transferred asset checksum mismatch: {name}')
    for name, target in manifest['references'].items():
        destination, source = root / name, root / target
        destination.parent.mkdir(parents=True, exist_ok=True)
        if not destination.exists():
            os.link(source, destination)
    print(f"Verified {len(manifest['sha256'])} assets; restored {len(manifest['references'])} references.")


if __name__ == '__main__':
    main()
