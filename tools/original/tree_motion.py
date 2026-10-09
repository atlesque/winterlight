"""Turn the wireframe tree's flat, front-on view back into motion round the cone.

The camera sees the cone side on, so a strip at angle θ and the one at π−θ
(front and back) land on the same line across the tree. Detection can only say
which of the seven lines across the tree (wedges) are lit, and so lights the
front and back strips of a wedge together. In the video the light really goes
round: a slice of the cone chases round it, or several arms turn together, or
two points start at one side, run round the front and the back and meet on the
other side to light the whole circle.

This module picks, for every lit wedge, the front strip, the back strip or both,
so that the model keeps exactly the video's front-on view while its motion goes
round the circle:

* A long passage (a chase) is fitted as a rigid pattern turning round the cone:
  one slice, or two, three or four evenly spaced arms, each a few strips wide.
  A dynamic programme over the runs of identical frames finds the pattern, its
  angle in each run and its direction, preferring steady turning in one
  direction; the pattern may change part way. In each run the model then lights
  the strips, among those that reproduce the video exactly, closest to the
  turning pattern.
* A short passage is two points running round both sides at once (opening from
  one side and converging on the other), so each lit wedge keeps its front and
  back strips.

The direction of turning can't be seen from the front: a pattern turning one way
looks exactly like its mirror image turning the other. Turning with the front
moving left to right is preferred when the two explain the video equally well.

  python3 -I tools/original/tree_motion.py outputs/original-house-cues.json
re-times the tree strips of an existing cue file in place, from the wedges its
strips show, so it gives the same result when run again.
"""
import itertools, json, subprocess, sys
from functools import lru_cache
from pathlib import Path
import numpy as np

ROOT = Path(__file__).resolve().parents[2]
WEDGES = np.array([-1, -.71, -.38, 0, .38, .71, 1])
# A passage with fewer runs of identical frames than this is two points running round both sides.
MIN_RUNS = 12
# Rigid patterns: (arms evenly spaced round the cone, strips per arm).
PATTERNS = [(1, 1), (1, 2), (1, 3), (1, 4), (2, 1), (2, 2), (2, 3), (2, 4), (3, 1), (3, 2), (4, 1), (4, 2)]
PAUSE, BACKWARDS, TOO_FAST, SWITCH, CHANGE = .5, 4., 4., 6., 6.
METHOD = ('Tree strips seen on the same line (front and back of the cone) are then told apart by motion: a passage of '
          f'{MIN_RUNS} or more changes is fitted as one slice or several evenly spaced arms turning round the cone, and each '
          'frame lights the strips nearest that pattern that still look exactly like the video from the front; shorter '
          'passages keep both sides lit, as two points running round the front and the back.')


class Tree:
    def __init__(self, thetas):
        self.n = n = len(thetas); th = np.asarray(thetas, float)
        self.all = (1 << n) - 1
        self.front = np.cos(th) > 1e-6; self.back = np.cos(th) < -1e-6
        wedge = np.array([np.argmin(np.abs(WEDGES - s)) for s in np.sin(th)])
        self.members = [np.flatnonzero(wedge == w) for w in range(len(WEDGES))]
        self.wmask = [self.mask(m) for m in self.members]
        self.options = [self._options(m) for m in self.members]
        k = np.arange(n); self.cd = np.minimum(np.abs(k[:, None] - k[None]), n - np.abs(k[:, None] - k[None]))

    def mask(self, strips):
        m = 0
        for k in strips: m |= 1 << int(k)
        return m

    def bits(self, m): return np.array([(m >> k) & 1 for k in range(self.n)], bool)

    def _options(self, members):
        """A lit wedge is lit by its front strip, its back strip or both (and, at the
        sides, by the strip right on the edge too)."""
        f = [k for k in members if self.front[k]]; b = [k for k in members if self.back[k]]; e = [k for k in members if not self.front[k] and not self.back[k]]
        sets = [f, b, f + b] if not e else [f, e, b, f + e, e + b, f + e + b]
        return [self.mask(s) for s in sets if s]

    def wedges(self, m): return tuple(bool(m & w) for w in self.wmask)

    def symmetric(self, obs):
        m = 0
        for w, lit in zip(self.wmask, obs):
            if lit: m |= w
        return m

    def rot(self, m, k):
        k %= self.n; return ((m << k) | (m >> (self.n - k))) & self.all

    def pattern(self, arms, width):
        m = 0
        for a in range(arms):
            for j in range(width): m |= 1 << ((round(a * self.n / arms) + j) % self.n)
        return m

    def chamfer(self, a, b):
        """Mean distance round the circle from each lit strip to the nearest lit strip of the other, both ways."""
        A, B = self.bits(a), self.bits(b)
        if not A.any() or not B.any(): return 0. if A.any() == B.any() else float(self.n)
        d = self.cd[A][:, B]
        return d.min(1).mean() + d.min(0).mean()


def runs_of(obs):
    out, start = [], 0
    for f in range(1, len(obs) + 1):
        if f == len(obs) or obs[f] != obs[start]: out.append((start, f, obs[start])); start = f
    return out


def passages(runs):
    """Split at dark or fully lit runs of two frames or more."""
    out, cur = [], []
    for r in runs:
        if (not any(r[2]) or all(r[2])) and r[1] - r[0] >= 2:
            if cur: out.append(cur); cur = []
            continue
        cur.append(r)
    if cur: out.append(cur)
    return out


def fit(tree, runs):
    """Rigid pattern, angle and direction per run, by dynamic programming."""
    n = tree.n; P = len(PATTERNS)
    rots = np.array([[tree.rot(tree.pattern(*p), f) for f in range(n)] for p in PATTERNS])
    proj = np.array([[tree.wedges(int(m)) for m in row] for row in rots])  # P x n x 7
    weight = np.array([min(b - a, 3) for a, b, _ in runs])
    miss = (proj[None] != np.array([r[2] for r in runs], bool)[:, None, None]).sum(3) * weight[:, None, None]  # R x P x n
    # Step from angle i to j for each pattern, measured within its period.
    steps = []
    for arms, _ in PATTERNS:
        per = n // arms if n % arms == 0 else n
        d = (np.arange(n)[None] - np.arange(n)[:, None]) % per; d = np.where(d > per / 2, d - per, d)
        steps.append(d)
    complexity = np.array([.5 * a * w for a, w in PATTERNS])
    cost = np.empty((P, n, 2)); cost[:] = (miss[0] + complexity[:, None])[:, :, None]; cost[:, :, 1] += .01
    back = []
    for r in range(1, len(runs)):
        new = np.full((P, n, 2), np.inf); arg = np.zeros((P, n, 2, 3), int)
        for p in range(P):
            d = steps[p]
            for di, sign in enumerate((1, -1)):
                step = np.where(d == 0, PAUSE, np.where(d * sign > 0, 0., BACKWARDS)) + np.where(np.abs(d) > 3, TOO_FAST, 0.)
                for pdi in range(2):
                    c = cost[p, :, pdi][:, None] + step + (SWITCH if pdi != di else 0.)
                    i = c.argmin(0); v = c[i, np.arange(n)]
                    better = v < new[p, :, di]
                    new[p, better, di] = v[better]; arg[p, better, di] = np.stack([np.full(n, p), i, np.full(n, pdi)], 1)[better]
        # Changing pattern part way costs a fixed amount, from the best state so far.
        bp, bi, bd = np.unravel_index(cost.argmin(), cost.shape); change = cost.min() + CHANGE + complexity[:, None, None]
        better = change < new; new = np.where(better, change, new); arg[better] = (bp, bi, bd)
        cost = new + miss[r][:, :, None]; cost -= cost.min(); back.append(arg)
    p, i, di = np.unravel_index(cost.argmin(), cost.shape); path = [(p, i)]
    for arg in back[::-1]: p, i, di = arg[p, i, di]; path.append((p, i))
    return [int(rots[p, i]) for p, i in path[::-1]]


def closest(tree, obs, target):
    """Among the masks that light exactly the wedges seen, the one nearest the target."""
    lit = [w for w, x in enumerate(obs) if x]
    best = None
    for combo in itertools.product(*[tree.options[w] for w in lit]):
        m = 0
        for c in combo: m |= c
        bits = tree.bits(m)
        key = (round(tree.chamfer(m, target), 6), int(bits.sum()), int(bits[tree.back].sum()))
        if best is None or key < best[0]: best = (key, m)
    return best[1]


def decode(states, thetas):
    """states: frames x strips (bool), as detected. Returns the same shape, with each
    lit wedge lit on the side of the cone that keeps the motion going round."""
    tree = Tree(thetas); states = np.asarray(states, bool)
    obs = [tree.wedges(tree.mask(np.flatnonzero(s))) for s in states]
    out = np.zeros_like(states); masks = np.zeros(len(states), np.int64)
    runs = runs_of(obs)
    for a, b, o in runs: masks[a:b] = tree.symmetric(o)
    near = lru_cache(maxsize=None)(lambda o, t: closest(tree, o, t))
    for passage in passages(runs):
        if len(passage) < MIN_RUNS: continue
        for (a, b, o), target in zip(passage, fit(tree, passage)): masks[a:b] = near(o, target)
    for f, m in enumerate(masks): out[f] = tree.bits(int(m))
    return out


def tree_channels(channels):
    return [(i, c) for i, c in enumerate(channels) if c['kind'] == 'treeStrip']


def retime(path):
    """Re-time the tree strips of a cue file in place."""
    data = json.loads(Path(path).read_text())
    layout = json.loads(subprocess.run(['node', str(ROOT / 'tools/original/channels.mjs')], check=True, capture_output=True, text=True).stdout)
    strips = [c for _, c in tree_channels(layout['channels'])]
    first, last = data['range']['startFrame'], data['range']['endFrame']
    states = np.zeros((last, len(strips)), bool)
    for j, c in enumerate(strips):
        for a, b, *_ in data['channels'][c['id']]: states[a:b, j] = True
    decoded = decode(states, [c['model']['theta'] for c in strips])
    for j, c in enumerate(strips):
        segs, run = [], None
        for f in range(first, last):
            if decoded[f, j]:
                if run and run[1] == f: run[1] = f + 1
                else: run = [f, f + 1, 1, 100]; segs.append(run)
        data['channels'][c['id']] = segs
    if METHOD not in data['method']: data['method'] = data['method'].rstrip() + ' ' + METHOD
    Path(path).write_text(json.dumps(data, separators=(',', ':')) + '\n')
    changed = int((decoded[first:last] != states[first:last]).any(1).sum())
    print(json.dumps({'frames': [first, last], 'treeFramesChanged': changed}))


if __name__ == '__main__':
    if len(sys.argv) != 2: raise SystemExit(__doc__)
    retime(sys.argv[1])
