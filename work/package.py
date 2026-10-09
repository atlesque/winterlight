"""Rebuild all planning artifacts from the shared approved prop configuration."""
from pathlib import Path
import subprocess
root = Path(__file__).resolve().parent.parent
subprocess.run(['node', 'tools/build-project.mjs'], cwd=root, check=True)
