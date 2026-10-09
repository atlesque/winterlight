"""Desktop execution policy and portable references for derived audio."""
import filecmp
import os
import shutil
import socket
from pathlib import Path


def require_desktop():
    expected = os.environ.get('TRANSCRIPTION_DESKTOP_NAME', 'Alex-desktop')
    if socket.gethostname().casefold() != expected.casefold():
        raise RuntimeError('Run model inference on Alex-desktop over SSH; laptop inference is disabled.')
    os.environ['HF_HUB_OFFLINE'] = '1'
    os.environ['TRANSFORMERS_OFFLINE'] = '1'


def reference_audio(source, destination):
    """Use hard links on Windows, where symlinks often need administrator rights."""
    source, destination = Path(source).resolve(), Path(destination)
    if destination.exists() or destination.is_symlink():
        if destination.exists() and os.path.samefile(source, destination):
            return
        if destination.is_file() and filecmp.cmp(source, destination, shallow=False):
            return
        raise FileExistsError(f'{destination} already references another source')
    destination.parent.mkdir(parents=True, exist_ok=True)
    if os.name == 'nt':
        try:
            os.link(source, destination)
        except OSError:
            shutil.copy2(source, destination)
    else:
        destination.symlink_to(source)
