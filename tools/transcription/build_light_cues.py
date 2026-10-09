"""Compile the assembled instrument MIDI into Winterlight note cues.

Usage: python -I tools/transcription/build_light_cues.py work/transcription/final/wizards-instruments.mid

Writes outputs/wizards-note-cues.json. Each MIDI instrument drives its own
prop group, and its notes are dealt round robin across that group's props:
each note goes to the next prop in order that is not still lit, so phrases
travel along the group. The output is a light program, not a transcription:
no pitches are stored and the MIDI itself stays in the ignored work/ folder.
"""
import hashlib, json, sys
from pathlib import Path
import pretty_midi

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'outputs/wizards-note-cues.json'
AUDIO = ROOT / 'public/media/wizards-in-winter.m4a'
# Instrument -> props in round-robin order (left to right, front to back).
# The door has three segments: left side, lintel, right side.
GROUPS = {
    'piano': ['Pole1', 'Pole2', 'Pole3', 'Pole4', 'Pole5'],
    'lead': ['Pole6', 'Pole7', 'Pole8', 'Pole9', 'Pole10'],
    'guitar': ['Arch1', 'Arch2', 'Arch3', 'Arch4'],
    'bass': ['StripWC', 'StripKitchen'],
    'other': ['Star1', 'Star2'],
    'drums': ['StripDoor:left', 'StripDoor:lintel', 'StripDoor:right'],
}
# A prop counts as busy until shortly after its note ends; drum hits are short.
HOLD = {'drums': .12}
GAP = .05

def deal(notes, props, hold=None):
    """Assign notes to props round robin, skipping props that are still lit."""
    busy = [float('-inf')] * len(props); pointer = 0; events = []
    for n in sorted(notes, key=lambda n: (n.start, n.pitch)):
        order = [(pointer + i) % len(props) for i in range(len(props))]
        free = [k for k in order if busy[k] <= n.start]
        k = free[0] if free else min(order, key=lambda k: busy[k])
        busy[k] = (n.start + hold if hold else n.end) + GAP
        pointer = (k + 1) % len(props)
        events.append([round(n.start * 1000), max(10, round((n.end - n.start) * 1000)), k, round(n.velocity / 127, 2)])
    return events

def build(path):
    midi = pretty_midi.PrettyMIDI(str(path))
    parts = {i.name: i for i in midi.instruments}
    missing = GROUPS.keys() - parts.keys()
    if missing: raise ValueError(f'MIDI is missing tracks: {sorted(missing)}')
    return {
        'format': 'Winterlight note cues v2',
        'audio': AUDIO.name, 'audioSha256': hashlib.sha256(AUDIO.read_bytes()).hexdigest(),
        'midiSha256': hashlib.sha256(path.read_bytes()).hexdigest(),
        'offsetMs': 0,
        'event': ['startMs', 'durationMs', 'propIndex', 'level'],
        'groups': {name: {'props': props, 'events': deal(parts[name].notes, props, HOLD.get(name))} for name, props in GROUPS.items()},
    }

if __name__ == '__main__':
    data = build(Path(sys.argv[1]))
    OUT.write_text(json.dumps(data, separators=(',', ':')) + '\n')
    print(OUT, {k: len(v['events']) for k, v in data['groups'].items()})
