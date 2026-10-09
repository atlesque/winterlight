"""Assemble selected transcriptions without quantizing their audio timestamps.

Example (use the isolated transcription environment):
  python tools/transcription/assemble.py work/transcription/song.wav \
    --source piano=work/transcription/piano/midi/piano.mid \
    --source drums=work/transcription/drums/midi/drums.mid

Outputs are local, derived media; keep the output directory out of Git.
Octave spikes are reported for listening review, never guessed away in chords.
"""

from runtime import reference_audio
import argparse
import copy
import json
from pathlib import Path

import librosa
import mido
import numpy as np
import pretty_midi


PROGRAMS = {"piano": 0, "bass": 33, "guitar": 29, "lead": 80, "other": 48, "drums": 0}


def clean_notes(notes, duration, min_duration=0.03, merge_overlaps=True):
    """Clip to the recording and remove fragments and duplicate detections."""
    cleaned, seen = [], set()
    counts = {"fragments_removed": 0, "duplicates_removed": 0, "clipped": 0,
              "overlaps_merged": 0, "octave_spikes_for_review": 0}
    for note in sorted(notes, key=lambda n: (n.start, n.pitch, n.end)):
        start, end = max(0.0, note.start), min(duration, note.end)
        if end - start < min_duration - 1e-9:
            counts["fragments_removed"] += 1
            continue
        key = (note.pitch, round(start, 6), round(end, 6))
        if key in seen:
            counts["duplicates_removed"] += 1
            continue
        seen.add(key)
        result = copy.copy(note)
        result.start, result.end = start, end
        counts["clipped"] += int(start != note.start or end != note.end)
        cleaned.append(result)
    # A stem can contain several predicted instrument labels. After collapsing
    # them to one MIDI channel, overlapping notes of the same pitch must share
    # one gate; otherwise an earlier note-off cuts a still-active note short.
    merged, last_by_pitch = [], {}
    for note in cleaned:
        previous = last_by_pitch.get(note.pitch)
        if merge_overlaps and previous is not None and note.start < previous.end:
            previous.end = max(previous.end, note.end)
            previous.velocity = max(previous.velocity, note.velocity)
            counts['overlaps_merged'] += 1
        else:
            merged.append(note)
            last_by_pitch[note.pitch] = note
    cleaned = merged
    # Flag isolated A -> A+/-12 -> A transitions; polyphony needs human review.
    for before, note, after in zip(cleaned, cleaned[1:], cleaned[2:]):
        if (before.pitch == after.pitch and abs(note.pitch - before.pitch) == 12
                and before.end <= note.start and note.end <= after.start
                and after.start - before.end <= 0.5):
            counts["octave_spikes_for_review"] += 1
    return cleaned, counts


def clean_drum_notes(notes, duration):
    """Preserve short percussion attacks and retriggers; durations are MIDI gates."""
    notes, counts = clean_notes(notes, duration, min_duration=1e-6, merge_overlaps=False)
    counts['drum_gates_trimmed'] = 0
    last_by_pitch = {}
    for note in notes:
        previous = last_by_pitch.get(note.pitch)
        if previous is not None and previous.end > note.start:
            previous.end = note.start
            counts['drum_gates_trimmed'] += 1
        last_by_pitch[note.pitch] = note
    # Simultaneous predictions of the same hit can have different durations.
    return [note for note in notes if note.end > note.start], counts


def tempo_events(beat_times, fallback=152.0):
    """Tempo at beat boundaries, in seconds; preserve a nonzero first-beat phase."""
    beats = np.asarray(beat_times, dtype=float)
    intervals = np.diff(beats)
    if len(intervals) < 2 or np.any(intervals <= 0):
        return [(0.0, mido.bpm2tempo(fallback))]
    tempos = [int(round(interval * 1_000_000)) for interval in intervals]
    events = [(0.0, tempos[0])]
    for time, tempo in zip(beats[:-1], tempos):
        if tempo != events[-1][1]:
            events.append((float(time), tempo))
    return events


def seconds_to_tick(seconds, events, resolution):
    ticks = 0.0
    for index, (start, tempo) in enumerate(events):
        stop = events[index + 1][0] if index + 1 < len(events) else seconds
        ticks += max(0.0, min(seconds, stop) - start) * resolution * 1_000_000 / tempo
        if seconds <= stop:
            break
    return int(round(ticks))


def assemble(audio, sources, output):
    y, sr = librosa.load(audio, sr=22050, mono=True)
    duration = len(y) / sr
    tempo, beats = librosa.beat.beat_track(y=y, sr=sr, start_bpm=152, units="time", trim=False)
    events = tempo_events(beats)
    resolution = 960
    midi = mido.MidiFile(type=1, ticks_per_beat=resolution)
    conductor = mido.MidiTrack()
    midi.tracks.append(conductor)
    conductor.append(mido.MetaMessage("track_name", name="Audio beat map"))
    last_tick = 0
    for time, value in events:
        tick = seconds_to_tick(time, events, resolution)
        conductor.append(mido.MetaMessage("set_tempo", tempo=value, time=tick - last_tick))
        last_tick = tick
    end_tick = seconds_to_tick(duration, events, resolution)
    conductor.append(mido.MetaMessage('end_of_track', time=end_tick - last_tick))
    report = {"duration_s": duration, "detected_bpm": float(np.asarray(tempo).reshape(-1)[0]),
              "beat_count": len(beats), "tempo_events": len(events), "tracks": {}}
    melodic_channels = iter([c for c in range(16) if c != 9])
    for name, path in sources.items():
        transcription = pretty_midi.PrettyMIDI(str(path))
        drum = name == "drums"
        notes = [note for inst in transcription.instruments if inst.is_drum == drum for note in inst.notes]
        if not notes:
            raise ValueError(f"No {'drum' if drum else 'melodic'} notes in {path} for {name}")
        input_count = len(notes)
        notes, counts = clean_drum_notes(notes, duration) if drum else clean_notes(notes, duration)
        if not notes:
            raise ValueError(f"No notes survive cleanup for {name}")
        channel = 9 if drum else next(melodic_channels)
        track = mido.MidiTrack()
        midi.tracks.append(track)
        track.append(mido.MetaMessage("track_name", name=name))
        track.append(mido.Message("program_change", program=PROGRAMS[name], channel=channel))
        messages = []
        for note in notes:
            for time, kind, velocity in [(note.start, "note_on", note.velocity), (note.end, "note_off", 0)]:
                tick = seconds_to_tick(time, events, resolution)
                messages.append((tick, 0 if kind == "note_off" else 1,
                                 mido.Message(kind, note=note.pitch, velocity=velocity, channel=channel)))
        previous = 0
        for tick, _, message in sorted(messages, key=lambda item: item[:2]):
            message.time = tick - previous
            track.append(message)
            previous = tick
        track.append(mido.MetaMessage('end_of_track', time=end_tick - previous))
        report["tracks"][name] = {"source": str(path), "input_notes": input_count,
                                  "notes": len(notes), **counts}
    output.parent.mkdir(parents=True, exist_ok=True)
    midi.save(output)
    # Keep the exact tempo map in per-track files, so the documented scorer and
    # listening helper work on a fresh assembly without a separate split step.
    (output.parent / 'midi').mkdir(exist_ok=True)
    (output.parent / 'stems').mkdir(exist_ok=True)
    for name, track in zip(sources, midi.tracks[1:]):
        destination = output.parent / 'midi' / f'{name}.mid'
        if destination.resolve() == sources[name].resolve():
            raise ValueError(f'Assembly would overwrite source MIDI: {destination}')
        subset = mido.MidiFile(type=1, ticks_per_beat=resolution)
        subset.tracks.extend([copy.deepcopy(conductor), copy.deepcopy(track)])
        subset.save(destination)
        reference = sources[name].parent.parent / 'stems' / f'{name}.wav'
        link = output.parent / 'stems' / f'{name}.wav'
        if reference.exists():
            if link.is_symlink() and link.resolve() != reference.resolve():
                link.unlink()
            reference_audio(reference, link)
    output.with_suffix(".assembly.json").write_text(json.dumps(report, indent=2) + "\n")
    return report


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("audio", type=Path)
    parser.add_argument("--source", action="append", required=True, metavar="NAME=MIDI")
    parser.add_argument("--output", type=Path, default=Path("work/transcription/final/wizards-instruments.mid"))
    args = parser.parse_args()
    work_root = Path(__file__).resolve().parents[2] / 'work/transcription'
    if not args.output.resolve().is_relative_to(work_root.resolve()):
        parser.error('--output must be inside ignored work/transcription')
    sources = {}
    for value in args.source:
        name, separator, path = value.partition("=")
        if not separator or name not in PROGRAMS or name in sources:
            parser.error(f"Source must have a unique supported name: {', '.join(PROGRAMS)}")
        sources[name] = Path(path)
    print(json.dumps(assemble(args.audio, sources, args.output), indent=2))


if __name__ == "__main__":
    main()
