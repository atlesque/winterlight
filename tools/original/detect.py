"""Detect, frame by frame, how brightly each prop of the original filmed house is lit.

The original video is filmed from a fixed camera, so every prop stays at the
same pixels. For each channel in src/original/layout.js this samples its region
on every decoded frame, learns that channel's own off and on levels over the
whole video, and records each frame's brightness in 5% steps so fades survive
(the wireframe tree, which only switches on and off, is stored at full level).
Multicolour strips are also classified as yellow, blue or both. No smoothing or
resampling: one value per source frame, timed by the source frame index.

Requires ffmpeg/ffprobe, numpy, Pillow and node (to read the shared layout).

  python3 -I tools/original/detect.py VIDEO --end 30 --out outputs/original-house-cues.json
  python3 -I tools/original/detect.py VIDEO --overlay work/original/overlay.png --at 180
  python3 -I tools/original/detect.py --reference STILL.png --overlay work/original/reference.png
"""
import argparse, hashlib, json, subprocess, sys
from fractions import Fraction
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[2]
W, H = 960, 540
FORMAT = 'Winterlight original-house cues v2'
# A channel whose 5th and 97th percentile levels differ by less than this never visibly changes.
MIN_CONTRAST = 18


def layout():
    out = subprocess.run(['node', str(ROOT / 'tools/original/channels.mjs')], check=True, capture_output=True, text=True).stdout
    return json.loads(out)


def to_target(scale, offset):
    """Reference-still coordinates to target pixels (video960 or the still itself)."""
    return lambda p: (p[0] * scale + offset[0], p[1] * scale + offset[1])


def draw_roi(draw, roi, tf, scale, fill=255, outline_only=False):
    width = max(1, round(roi.get('width', 6) * scale))
    for line in roi.get('lines', []):
        draw.line([tf(p) for p in line], fill=fill, width=width, joint='curve')
    if 'ring' in roi:
        cx, cy = tf(roi['ring'][:2]); r = roi['ring'][2] * scale
        draw.ellipse([cx - r, cy - r, cx + r, cy + r], outline=fill, width=width)
    if 'box' in roi:
        a, b = tf(roi['box'][:2]), tf(roi['box'][2:])
        draw.rectangle([a, b], outline=fill if outline_only else None, fill=None if outline_only else fill, width=1)
    if 'poly' in roi:
        draw.polygon([tf(p) for p in roi['poly']], outline=fill if outline_only else None, fill=None if outline_only else fill)


def masks(data):
    ref = data['reference']['toVideo960']; tf = to_target(ref['scale'], ref['offset'])
    out = []
    for c in data['channels']:
        img = Image.new('L', (W, H), 0); draw_roi(ImageDraw.Draw(img), c['roi'], tf, ref['scale'])
        m = np.array(img) > 0
        if m.sum() < 4: raise SystemExit(f"{c['id']} covers fewer than 4 pixels")
        out.append(m)
    return out


def overlay(data, image, path, scale, offset):
    """Draw every channel's region on a frame so placement can be checked by eye."""
    img = image.convert('RGB'); draw = ImageDraw.Draw(img); tf = to_target(scale, offset)
    hues = [(0, 255, 255), (255, 0, 255), (255, 255, 0), (0, 255, 0)]
    for i, c in enumerate(data['channels']):
        col = hues[i % len(hues)]
        draw_roi(draw, {**c['roi'], 'width': 1 / scale}, tf, scale, fill=col, outline_only=True)
    Path(path).parent.mkdir(parents=True, exist_ok=True); img.save(path); print('Overlay written to', path)


def probe(video):
    info = json.loads(subprocess.run(['ffprobe', '-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height,r_frame_rate,time_base', '-show_entries', 'frame=pts', '-of', 'json', video], check=True, capture_output=True, text=True).stdout)
    s = info['streams'][0]; pts = [int(f['pts']) for f in info['frames'] if 'pts' in f]
    return s, Fraction(s['time_base']), pts


def frames(video):
    cmd = ['ffmpeg', '-v', 'error', '-i', video, '-map', '0:v:0', '-vf', f'scale={W}:{H}:flags=area', '-fps_mode', 'passthrough', '-f', 'rawvideo', '-pix_fmt', 'rgb24', 'pipe:1']
    proc = subprocess.Popen(cmd, stdout=subprocess.PIPE); size = W * H * 3
    while True:
        raw = proc.stdout.read(size)
        if not raw: break
        if len(raw) != size: raise RuntimeError('Partial decoded frame')
        yield np.frombuffer(raw, np.uint8).reshape(H, W, 3)
    if proc.wait() != 0: raise RuntimeError('Video decode failed')


def measure(video, ms, channels):
    """Per frame and channel: brightness of the brightest quarter of the region (or its mean,
    for channels whose detect.stat is 'mean'), and the blue share of its lit pixels."""
    idx = [np.flatnonzero(m.ravel()) for m in ms]; use_mean = [c['detect'].get('stat') == 'mean' for c in channels]
    level, blue, still = [], [], None
    for n, frame in enumerate(frames(video)):
        flat = frame.reshape(-1, 3).astype(np.int16); lv, bl = [], []
        for ix, mean in zip(idx, use_mean):
            px = flat[ix]; lum = px.max(axis=1); k = max(2, len(ix) // 4)
            level_now = lum.mean() if mean else lum[np.argpartition(lum, -k)[-k:]].mean(); lv.append(level_now)
            # Blue share among all clearly lit pixels, so alternating yellow and blue bulbs read as both.
            lit = px[lum >= level_now * .5]
            bl.append(np.mean(lit[:, 2] > np.maximum(lit[:, 0], lit[:, 1]) + 12))
        level.append(lv); blue.append(bl); still = frame
        if (n + 1) % 1000 == 0: print('Measured', n + 1, 'frames', flush=True)
    return np.array(level, np.float32), np.array(blue, np.float32), still


def brightness(level, channels):
    """Per frame and channel: brightness as a share of that channel's own range.

    0 is the channel's off level (5th percentile over the video) and 1 its
    brightest (97th percentile), so fades and partial frames keep their level.
    Anything under the channel's floor is light spilling from neighbours."""
    lo, hi = np.percentile(level, 5, axis=0), np.percentile(level, 97, axis=0)
    out = np.zeros(level.shape, np.float32); stats = []
    for c in range(level.shape[1]):
        span = hi[c] - lo[c]; stat = {'off': round(float(lo[c]), 1), 'on': round(float(hi[c]), 1)}
        if span < MIN_CONTRAST:
            # Never visibly changes in this video: decide on absolute brightness.
            out[:, c] = level[:, c] > 90; stats.append({**stat, 'static': True}); continue
        n = np.clip((level[:, c] - lo[c]) / span, 0, 1)
        out[:, c] = np.where(n >= channels[c]['detect']['floor'], n, 0); stats.append(stat)
    # Channels in a group (the wireframe tree's strips) spill onto each other, so
    # one also has to reach a share of the group's brightest region that frame.
    groups = {}
    for c, ch in enumerate(channels):
        if ch['detect'].get('group'): groups.setdefault(ch['detect']['group'], []).append(c)
    for members in groups.values():
        top = level[:, members].max(axis=1)
        for c in members: out[level[:, c] < channels[c]['detect']['ratio'] * top, c] = 0
    return out, stats


def segments(values, levels, start, end):
    """[[first, last+1, colour, percent], ...] runs of lit frames inside [start, end)."""
    out, run = [], None
    for f in range(start, end):
        key = (int(values[f]), int(levels[f])) if levels[f] else (0, 0)
        if run and (run[2], run[3]) == key: run[1] = f + 1; continue
        if run and run[3]: out.append(run)
        run = [f, f + 1, *key]
    if run and run[3]: out.append(run)
    return out


def main():
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument('video', nargs='?'); p.add_argument('--start', type=float, default=0); p.add_argument('--end', type=float)
    p.add_argument('--out'); p.add_argument('--levels', help='CSV of raw per-frame levels for inspection')
    p.add_argument('--overlay'); p.add_argument('--at', type=float, default=0, help='video time (s) for --overlay')
    p.add_argument('--reference', help='draw the regions on the reference still instead of a video frame')
    a = p.parse_args(); data = layout()
    if a.reference:
        overlay(data, Image.open(a.reference), a.overlay, 1, (0, 0)); return
    if not a.video: p.error('video required')
    stream, tb, pts = probe(a.video)
    if a.overlay:
        raw = subprocess.run(['ffmpeg', '-v', 'error', '-ss', str(a.at), '-i', a.video, '-frames:v', '1', '-vf', f'scale={W}:{H}:flags=area', '-f', 'rawvideo', '-pix_fmt', 'rgb24', 'pipe:1'], check=True, capture_output=True).stdout
        ref = data['reference']['toVideo960']
        overlay(data, Image.frombytes('RGB', (W, H), raw), a.overlay, ref['scale'], ref['offset']); return
    if not a.out: p.error('--out required')
    steps = {b - a_ for a_, b in zip(pts, pts[1:])}
    if len(steps) != 1: raise SystemExit(f'Variable frame rate ({sorted(steps)[:5]}…); store a PTS table before using this format')
    step = steps.pop(); rate = 1 / (tb * step)
    level, blue, _ = measure(a.video, masks(data), data['channels'])
    if len(level) != len(pts): raise SystemExit(f'Decoded {len(level)} frames but probed {len(pts)}')
    lit, stats = brightness(level, data['channels'])
    # Whole 5% steps keep the runs short; a 5% step is below what the camera resolves.
    percent = np.where(lit > 0, np.maximum(5, np.rint(lit * 20) * 5), 0).astype(int)
    # Props that only switch on and off (the wireframe tree) are stored at full level.
    for c, ch in enumerate(data['channels']):
        if ch['detect'].get('onOff'): percent[:, c] = np.where(percent[:, c] > 0, 100, 0)
    t0 = pts[0] * tb
    first = max(0, int(np.ceil((Fraction(a.start) - t0) * rate - Fraction(1, 1000))))
    last = len(pts) if a.end is None else min(len(pts), int(np.ceil((Fraction(a.end) - t0) * rate - Fraction(1, 1000))))
    channels = {}
    for c, ch in enumerate(data['channels']):
        if ch['palette'] == 'multi':
            b = blue[:, c]; v = np.where(b < .25, 1, np.where(b > .75, 2, 3))
        else: v = np.ones(len(level), int)
        channels[ch['id']] = segments(v, percent[:, c], first, last)
        stats[c]['litFrames'] = int((percent[first:last, c] > 0).sum())
    if a.levels:
        Path(a.levels).parent.mkdir(parents=True, exist_ok=True)
        np.savetxt(a.levels, level[first:last], delimiter=',', fmt='%.1f', header=','.join(ch['id'] for ch in data['channels']), comments='')
    result = {
        'format': FORMAT,
        'source': {'sha256': hashlib.sha256(Path(a.video).read_bytes()).hexdigest(), 'width': stream['width'], 'height': stream['height'], 'frameCount': len(pts),
                   'frameRate': [rate.numerator, rate.denominator], 'firstPtsSeconds': float(t0)},
        'range': {'startFrame': first, 'endFrame': last},
        'method': 'Per-frame region brightness (top quarter of pixels at 960x540, or the mean for the mini trees) as a share of the channel\'s own 5th-97th percentile range over the whole video, in 5% steps (the wireframe tree only on or off); levels under a per-channel floor count as spill from neighbours, and a tree strip must also reach 60% of the brightest strip in that frame. Multicolour strips split by blue share. No smoothing.',
        'channels': channels,
        'levels': {ch['id']: s for ch, s in zip(data['channels'], stats)},
    }
    Path(a.out).write_text(json.dumps(result, separators=(',', ':')) + '\n')
    print(json.dumps({'frames': [first, last], 'channels': len(channels), 'segments': sum(len(v) for v in channels.values())}))


if __name__ == '__main__':
    main()
