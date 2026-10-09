"""Compile the assembled instrument MIDI into Winterlight note cues.

Usage: python -I tools/transcription/build_light_cues.py work/transcription/final/wizards-instruments.mid

Writes outputs/wizards-note-cues.json. The output is a light program, not a
transcription: pitches are reduced to a prop slot (pole, arch, colour bucket)
and the MIDI itself stays in the ignored work/ folder. Note times are the
transcription's own times, which were derived from the hosted recording.
"""
import hashlib, json, sys
from pathlib import Path
import pretty_midi

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'outputs/wizards-note-cues.json'
AUDIO = ROOT / 'public/media/wizards-in-winter.m4a'
KICK, SNARE = {35, 36}, {37, 38, 39, 40}
TOMS = {41, 43, 45, 47, 48, 50}
CYMBALS = {42, 44, 46, 49, 51, 52, 53, 54, 55, 56, 57, 59}
# Pitch spans used to spread an instrument across its props (5th-95th percentile
# of the assembled MIDI); notes outside are clamped to the end slots.
SPAN = {'piano': (40, 84), 'guitar': (38, 62), 'bass': (26, 46), 'lead': (43, 76), 'other': (55, 88)}

def slot(pitch, part, slots):
    lo, hi = SPAN[part]
    return min(slots - 1, max(0, int((pitch - lo) / (hi - lo + 1) * slots)))

def cue(n, s):
    return [round(n.start * 1000), max(10, round((n.end - n.start) * 1000)), s, round(n.velocity / 127, 2)]

def build(path):
    midi = pretty_midi.PrettyMIDI(str(path))
    parts = {i.name: i for i in midi.instruments}
    missing = {'piano', 'guitar', 'bass', 'lead', 'other', 'drums'} - parts.keys()
    if missing: raise ValueError(f'MIDI is missing tracks: {sorted(missing)}')
    groups = {
        'poles': [cue(n, slot(n.pitch, 'piano', 10)) for n in parts['piano'].notes],
        'arches': [cue(n, slot(n.pitch, 'guitar', 4)) for n in parts['guitar'].notes],
        'archLead': [cue(n, slot(n.pitch, 'lead', 4)) for n in parts['lead'].notes],
        'windows': [cue(n, slot(n.pitch, 'bass', 6)) for n in parts['bass'].notes],
        'stars': [cue(n, slot(n.pitch, 'other', 2)) for n in parts['other'].notes],
        'door': [], 'sparkle': [],
    }
    for n in parts['drums'].notes:
        if n.pitch in KICK: groups['door'].append(cue(n, 0))
        elif n.pitch in SNARE: groups['door'].append(cue(n, 1))
        elif n.pitch in TOMS: groups['door'].append(cue(n, 2))
        elif n.pitch in CYMBALS: groups['sparkle'].append(cue(n, 1 if n.pitch in {49, 52, 55, 57} else 0))
    for events in groups.values(): events.sort()
    return {
        'format': 'Winterlight note cues v1',
        'audio': AUDIO.name, 'audioSha256': hashlib.sha256(AUDIO.read_bytes()).hexdigest(),
        'midiSha256': hashlib.sha256(path.read_bytes()).hexdigest(),
        'offsetMs': 0,
        'event': ['startMs', 'durationMs', 'slot', 'level'],
        'groups': groups,
    }

if __name__ == '__main__':
    data = build(Path(sys.argv[1]))
    OUT.write_text(json.dumps(data, separators=(',', ':')) + '\n')
    print(OUT, {k: len(v) for k, v in data['groups'].items()})
