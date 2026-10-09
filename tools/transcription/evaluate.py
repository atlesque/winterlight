"""Score a transcription run against its own audio and the stored light show.

Usage: python -I tools/transcription/evaluate.py work/transcription/<run>

The run directory holds stems/<name>.wav and midi/<name>.mid with matching
names (e.g. piano, bass, guitar). Drum hits come from midi/drums.mid
(General MIDI notes 35/36 kick, 38/40 snare, 42/44/46/49/51/57 hats-cymbals)
or, failing that, from drum-onsets.json ({"kick": [...], ...} in seconds).
Writes <run>/metrics.json and prints it. These are proxies: there is no
ground-truth score, so compare runs against each other, not against 1.0.
"""
import json, sys
from pathlib import Path
import numpy as np, librosa, pretty_midi, mir_eval, scipy.signal as ss

ROOT = Path(__file__).resolve().parents[2]
TIMING = ROOT / 'outputs/wizards-ground-level.wltiming'
DRUM_CLASSES = {'kick': {35, 36}, 'snare': {37, 38, 40}, 'hats_cymbals': {42, 44, 46, 49, 51, 52, 55, 57, 59}}

def stem_metrics(wav, mid):
    y, sr = librosa.load(wav, sr=22050, mono=True); hop = 512
    pm = pretty_midi.PrettyMIDI(str(mid))
    notes = [n for i in pm.instruments if not i.is_drum for n in i.notes]
    ons = np.array(sorted(n.start for n in notes))
    ded = ons[np.r_[True, np.diff(ons) > 0.03]] if len(ons) else ons
    f, p, r = mir_eval.onset.f_measure(librosa.onset.onset_detect(y=y, sr=sr, units='time'), ded, window=0.05)
    C = librosa.feature.chroma_cqt(y=y, sr=sr, hop_length=hop)
    R = pm.get_chroma(fs=sr / hop)[:, :C.shape[1]]
    R = np.pad(R, ((0, 0), (0, C.shape[1] - R.shape[1])))
    rms = librosa.feature.rms(y=y, hop_length=hop)[0][:C.shape[1]]
    act = (R.sum(0) > 0) & (rms > 0.02 * rms.max()); loud = rms > 0.05 * rms.max()
    cos = (C * R).sum(0) / (np.linalg.norm(C, axis=0) * np.linalg.norm(R, axis=0) + 1e-9)
    pitches = [n.pitch for n in notes]
    return dict(notes=len(notes), pitch_range=[min(pitches), max(pitches)] if pitches else None,
                onset_F=round(f, 3), onset_P=round(p, 3), onset_R=round(r, 3),
                chroma_cos=round(float(cos[act].mean()), 3) if act.any() else None,
                coverage=round(float((R.sum(0)[loud] > 0).mean()), 3))

def drum_onsets(run):
    mid = run / 'midi/drums.mid'
    if mid.exists():
        pm = pretty_midi.PrettyMIDI(str(mid)); hits = [n for i in pm.instruments for n in i.notes]
        return {k: sorted(n.start for n in hits if n.pitch in v) for k, v in DRUM_CLASSES.items()}
    js = run / 'drum-onsets.json'
    return json.loads(js.read_text()) if js.exists() else {}

def light_events():
    b = TIMING.read_bytes(); hl = int.from_bytes(b[4:8], 'little'); meta = json.loads(b[8:8 + hl])
    n, ch = meta['frameCount'], meta['channels']
    ts = np.frombuffer(b, '<u8', n, 8 + hl) / 1e6
    rgb = np.frombuffer(b, np.uint8, n * ch, 8 + hl + 8 * n).reshape(n, ch).astype(np.int16)
    d = np.abs(np.diff(rgb, axis=0)).mean(1)
    pk, _ = ss.find_peaks(d, height=np.percentile(d, 80), distance=3)
    return ts[1:][pk]

def light_match(L, ref):
    ref = np.asarray(ref)
    if not len(ref): return None
    f, o = max((mir_eval.onset.f_measure(ref, np.clip(L + o, 0, None), window=0.07)[0], o) for o in np.arange(-0.3, 0.31, 0.01))
    return dict(F=round(f, 3), best_offset_s=round(float(o), 2))

run = Path(sys.argv[1]); out = {'stems': {}, 'drums': {}, 'lights': {}}
L = light_events()
for mid in sorted((run / 'midi').glob('*.mid')):
    wav = run / 'stems' / f'{mid.stem}.wav'
    if mid.stem == 'drums' or not wav.exists(): continue
    out['stems'][mid.stem] = stem_metrics(wav, mid)
    pm = pretty_midi.PrettyMIDI(str(mid))
    out['lights'][mid.stem] = light_match(L, np.unique(np.round([n.start for i in pm.instruments for n in i.notes], 2)))
for k, v in drum_onsets(run).items():
    out['drums'][k] = len(v); out['lights'][k] = light_match(L, v)
(run / 'metrics.json').write_text(json.dumps(out, indent=1))
print(json.dumps(out, indent=1))
