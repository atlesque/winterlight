"""Synthetic checks; no recording-derived media is stored in the repository.

Run: work/transcription/venv/bin/python -m unittest discover -s tools/transcription -p 'test_*.py'
"""
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

import numpy as np
import pretty_midi
import mido
import soundfile as sf

from assemble import assemble, clean_notes, clean_drum_notes, tempo_events, seconds_to_tick
from evaluate import drum_onsets, evaluate, light_match, stem_metrics
from run_yourmt3 import stem_name


class PipelineTests(unittest.TestCase):
    def test_separator_names_share_reference_names(self):
        self.assertEqual(stem_name('song_bass.wav'), 'bass')
        self.assertEqual(stem_name('song_vocals.wav'), 'lead')
        self.assertEqual(stem_name('vocals.wav'), 'lead')
        self.assertEqual(stem_name('song.wav'), 'song')

    def test_cleanup_clips_and_keeps_polyphony(self):
        notes = [pretty_midi.Note(90, 60, 0, 0.2), pretty_midi.Note(90, 60, 0, 0.2),
                 pretty_midi.Note(90, 72, 0, 0.2), pretty_midi.Note(90, 65, 0.3, 0.31),
                 pretty_midi.Note(90, 64, 0.8, 1.2)]
        kept, report = clean_notes(notes, 1)
        self.assertEqual([n.pitch for n in kept], [60, 72, 64])
        self.assertEqual(kept[-1].end, 1)
        self.assertEqual(report['fragments_removed'], 1)
        self.assertEqual(report['duplicates_removed'], 1)
        self.assertEqual(report['clipped'], 1)

    def test_beat_map_preserves_phase_and_changes(self):
        events = tempo_events([0.2, 0.6, 1.1, 1.6])
        self.assertEqual(events, [(0, 400000), (0.6, 500000)])
        self.assertEqual(seconds_to_tick(0.2, events, 960), 480)
        self.assertEqual(seconds_to_tick(1.1, events, 960), 2400)

    def test_collapsed_instrument_tracks_do_not_cut_overlapping_notes(self):
        notes = [pretty_midi.Note(70, 60, 0, 0.4), pretty_midi.Note(90, 60, 0.2, 0.6),
                 pretty_midi.Note(80, 60, 0.6, 0.8)]
        kept, report = clean_notes(notes, 1)
        self.assertEqual([(n.start, n.end) for n in kept], [(0, 0.6), (0.6, 0.8)])
        self.assertEqual(kept[0].velocity, 90)
        self.assertEqual(report['overlaps_merged'], 1)

    def test_assembly_roundtrip_preserves_seconds_and_drums(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            audio = root / 'mix.wav'
            sf.write(audio, np.zeros(44100 * 2), 44100)
            sources = {}
            (root / 'sources/midi').mkdir(parents=True)
            (root / 'sources/stems').mkdir()
            for name, drum, pitch in [('piano', False, 60), ('drums', True, 36)]:
                pm = pretty_midi.PrettyMIDI(initial_tempo=120)
                inst = pretty_midi.Instrument(0, is_drum=drum)
                inst.notes.append(pretty_midi.Note(100, pitch, 0.123, 0.456))
                pm.instruments.append(inst)
                sources[name] = root / 'sources/midi' / f'{name}.mid'
                sf.write(root / 'sources/stems' / f'{name}.wav', np.zeros(44100 * 2), 44100)
                pm.write(str(sources[name]))
            output = root / 'final.mid'
            with patch('assemble.librosa.beat.beat_track', return_value=(np.array([150]), np.array([0.2, 0.6, 1.1, 1.6]))):
                assemble(audio, sources, output)
            result = pretty_midi.PrettyMIDI(str(output))
            self.assertAlmostEqual(mido.MidiFile(output).length, 2, delta=0.001)
            self.assertEqual(pretty_midi.PrettyMIDI(str(root / 'midi/drums.mid')).instruments[0].name, 'drums')
            self.assertTrue((root / 'stems/piano.wav').exists())
            self.assertEqual([i.name for i in result.instruments], ['piano', 'drums'])
            self.assertEqual([i.is_drum for i in result.instruments], [False, True])
            # Include quantization in both source MIDI and final MIDI.
            for inst in result.instruments:
                self.assertAlmostEqual(inst.notes[0].start, 0.123, delta=0.002)
                self.assertAlmostEqual(inst.notes[0].end, 0.456, delta=0.002)

    def test_short_drum_attacks_and_retriggers_survive(self):
        notes = [pretty_midi.Note(90, 36, 0.1, 0.11), pretty_midi.Note(90, 42, 0.2, 0.3),
                 pretty_midi.Note(90, 42, 0.25, 0.35)]
        kept, report = clean_drum_notes(notes, 1)
        self.assertEqual([n.start for n in kept], [0.1, 0.2, 0.25])
        self.assertEqual(kept[1].end, 0.25)
        self.assertEqual(report['drum_gates_trimmed'], 1)

    def test_silent_stem_has_null_coverage(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            sf.write(root / 'silent.wav', np.zeros(22050 * 2), 22050)
            pretty_midi.PrettyMIDI().write(str(root / 'empty.mid'))
            metrics = stem_metrics(root / 'silent.wav', root / 'empty.mid')
            self.assertIsNone(metrics['coverage'])
            self.assertIsNone(metrics['chroma_cos'])
            self.assertEqual(metrics['notes'], 0)

    def test_drum_classifier_ignores_melodic_bass_pitches(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            (root / 'midi').mkdir()
            pm = pretty_midi.PrettyMIDI()
            for drum, pitch in [(False, 36), (True, 38)]:
                inst = pretty_midi.Instrument(0, is_drum=drum)
                inst.notes.append(pretty_midi.Note(90, pitch, 0.1, 0.2))
                pm.instruments.append(inst)
            pm.write(str(root / 'midi/drums.mid'))
            hits = drum_onsets(root)
            self.assertEqual(hits['kick'], [])
            self.assertEqual(len(hits['snare']), 1)

    def test_fixed_reference_scoring_preserves_original_report(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            (root / 'midi').mkdir()
            reference = root / 'reference'
            reference.mkdir()
            sf.write(reference / 'piano.wav', np.zeros(22050 * 2), 22050)
            pm = pretty_midi.PrettyMIDI()
            inst = pretty_midi.Instrument(0)
            inst.notes.append(pretty_midi.Note(90, 60, 0.1, 0.5))
            pm.instruments.append(inst)
            pm.write(str(root / 'midi/piano.mid'))
            (root / 'metrics.json').write_text('original')
            with patch('evaluate.light_events', return_value=np.array([0.1])):
                result = evaluate(root, reference)
            self.assertIsNone(result['stems']['piano']['coverage'])
            self.assertEqual((root / 'metrics.json').read_text(), 'original')
            self.assertTrue((root / 'metrics-reference.json').exists())

    def test_empty_run_is_rejected(self):
        with tempfile.TemporaryDirectory() as directory:
            with patch('evaluate.light_events', return_value=np.array([0.1])):
                with self.assertRaisesRegex(ValueError, 'No transcription'):
                    evaluate(Path(directory))

    def test_positive_offset_means_lights_lead_audio(self):
        match = light_match(np.arange(1, 5), np.arange(1, 5) + 0.11)
        self.assertEqual(match['F'], 1)
        # The scorer chooses the largest tied offset within its 70 ms window.
        self.assertGreater(match['best_offset_s'], 0)


if __name__ == '__main__':
    unittest.main()
