"""Render MIDI with a GM soundfont and make a local stem/MIDI listening sheet.

Install tinysoundfont without its optional playback dependencies; offline
rendering does not require PyAudio or a system audio library.
Usage: python -I tools/transcription/preview.py RUN --soundfont BANK.sf2
All outputs stay within RUN/preview (derived media, never commit).
"""
import argparse
import hashlib
import html
import json
from pathlib import Path

import numpy as np
import pretty_midi
import soundfile as sf
import tinysoundfont


SECTIONS = [(0, 20), (35, 55), (95, 115), (165, 185)]


def render(midi_path, soundfont, output, duration, sr=22050):
    pm = pretty_midi.PrettyMIDI(str(midi_path))
    synth = tinysoundfont.Synth(gain=-9, samplerate=sr)
    sfid = synth.sfload(str(soundfont))
    events = []
    channels = iter([channel for channel in range(16) if channel != 9])
    for instrument in pm.instruments:
        channel = 9 if instrument.is_drum else next(channels)
        synth.program_select(channel, sfid, 128 if instrument.is_drum else 0,
                             instrument.program, is_drums=instrument.is_drum)
        for note in instrument.notes:
            for time, order in [(note.start, 1), (note.end, 0)]:
                events.append((max(0, round(time * sr)), order, channel, note.pitch, note.velocity))
    frames = round(duration * sr)
    previous = 0
    with sf.SoundFile(output, 'w', samplerate=sr, channels=2, subtype='PCM_16') as wav:
        for frame, order, channel, pitch, velocity in sorted(events):
            frame = min(frame, frames)
            if frame > previous:
                wav.write(np.frombuffer(synth.generate(frame - previous), dtype=np.float32).reshape(-1, 2))
                previous = frame
            if order:
                synth.noteon(channel, pitch, velocity)
            else:
                synth.noteoff(channel, pitch)
        if previous < frames:
            wav.write(np.frombuffer(synth.generate(frames - previous), dtype=np.float32).reshape(-1, 2))


def preview(run, soundfont):
    output = run / 'preview'
    output.mkdir(parents=True, exist_ok=True)
    sections, metadata = [], {}
    for mid in sorted((run / 'midi').glob('*.mid')):
        stem = run / 'stems' / f'{mid.stem}.wav'
        if not stem.exists():
            continue
        reference, sr = sf.read(stem, always_2d=True)
        duration = len(reference) / sr
        rendered = output / f'{mid.stem}-midi.wav'
        render(mid, soundfont, rendered, duration)
        synthesized, synth_sr = sf.read(rendered, always_2d=True)
        rows = []
        for start, end in SECTIONS:
            end = min(end, duration)
            if end <= start:
                continue
            audios = []
            for label, data, rate in [('stem', reference, sr), ('midi', synthesized, synth_sr)]:
                filename = f'{mid.stem}-{label}-{start}.wav'
                sf.write(output / filename, data[round(start * rate):round(end * rate)], rate)
                audios.append(f'<td><audio controls preload="none" src="{html.escape(filename)}"></audio></td>')
            rows.append(f'<tr><td>{start}–{end:.1f} s</td>{"".join(audios)}</tr>')
        sections.append(f'<h2>{html.escape(mid.stem)}</h2><table><tr><th>Section</th><th>Separated audio</th><th>Transcribed MIDI</th></tr>{"".join(rows)}</table>')
        metadata[mid.stem] = {'duration_s': duration, 'render': rendered.name}
    content = ('<!doctype html><html lang="en"><meta charset="utf-8"><title>Transcription listening review</title>'
               '<style>body{font:16px system-ui;background:#171923;color:#eee;margin:3rem auto;max-width:1000px}'
               'table{width:100%;border-collapse:collapse}td,th{padding:.6rem;text-align:left}audio{max-width:100%}</style>'
               f'<h1>{html.escape(run.name)} listening review</h1><p>Compare separated audio with GM MIDI rendering. '
               'These previews have not been listening-approved. Check missed notes, octave errors, instrument bleed, '
               'and drum classes. The render uses model velocities; soundfont timbre differs from the recording.</p>'
               + ''.join(sections)
               + '<script>const players=[...document.querySelectorAll("audio")];'
                 'players.forEach(player=>player.addEventListener("play",()=>{'
                 'players.filter(other=>other!==player).forEach(other=>other.pause());'
                 '}));</script></html>')
    (output / 'index.html').write_text(content)
    (output / 'metadata.json').write_text(json.dumps({'soundfont_sha256': hashlib.sha256(soundfont.read_bytes()).hexdigest(),
                                                     'sections_s': SECTIONS, 'tracks': metadata}, indent=2) + '\n')


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('run', type=Path)
    parser.add_argument('--soundfont', type=Path, required=True)
    args = parser.parse_args()
    work_root = Path(__file__).resolve().parents[2] / 'work/transcription'
    if not args.run.resolve().is_relative_to(work_root.resolve()):
        parser.error('RUN must be inside ignored work/transcription')
    if not any((args.run / 'midi').glob('*.mid')):
        parser.error('RUN has no MIDI candidates')
    preview(args.run, args.soundfont)


if __name__ == '__main__':
    main()
