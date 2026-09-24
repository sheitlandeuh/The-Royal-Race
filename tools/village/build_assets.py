"""Build village assets: smoothed 2x masks, halo overlays, building cutouts, hit map, meta json."""
import json, sys, cv2, numpy as np
from PIL import Image

S = 2  # output scale vs source painting (1672x941)
W0, H0 = 1672, 941
W, H = W0 * S, H0 * S
BASE = sys.argv[1] if len(sys.argv) > 1 else None   # upscaled base (3344x1882) or None -> lanczos
OUT = '/home/claude/work/village'
import os; os.makedirs(OUT, exist_ok=True)

masks = dict(np.load('/home/claude/work/masks.npz'))
order = ['hippodrome', 'carriere', 'haras', 'clinique', 'ecurie', 'chantier', 'moulin', 'paddocks']

def smooth_mask(m1x):
    f = cv2.resize(m1x.astype(np.float32) / 255, (W, H), interpolation=cv2.INTER_LINEAR)
    f = cv2.GaussianBlur(f, (0, 0), 2.2 * S)            # round off grabcut jaggies
    # smoothstep around 0.5 -> clean anti-aliased edge (~1.5px ramp)
    t = np.clip((f - 0.5) / 0.12 + 0.5, 0, 1)
    return t * t * (3 - 2 * t)

if BASE:
    base = np.array(Image.open(BASE).convert('RGB'))
else:
    base = np.array(Image.open('/home/claude/the-royal-race/assets/royal-estate.png').convert('RGB').resize((W, H), Image.LANCZOS))
assert base.shape[:2] == (H, W), base.shape

GOLD = np.array([255, 196, 64], np.float32)
CORE = np.array([255, 247, 214], np.float32)
meta = {}
hit = np.zeros((H0 // 2, W0 // 2), np.uint8)  # low-res index map for pointer hit-testing

for idx, name in enumerate(order, start=1):
    a = smooth_mask(masks[name])
    ys, xs = np.where(a > 0.02)
    M = 60 * S  # room for glow
    x0, y0 = max(0, xs.min() - M), max(0, ys.min() - M)
    x1, y1 = min(W, xs.max() + M), min(H, ys.max() + M)
    A = a[y0:y1, x0:x1]
    # --- halo: crisp bright rim on the contour + layered gold glow outside ---
    inside = A
    outside = 1 - A
    K = lambda r: cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2 * r + 1, 2 * r + 1))
    core = cv2.GaussianBlur(np.clip(cv2.dilate(A, K(3 * S)) - A, 0, 1), (0, 0), 0.45 * S)
    band = cv2.GaussianBlur(np.clip(cv2.dilate(A, K(7 * S)) - A, 0, 1), (0, 0), 1.2 * S)
    d2 = cv2.GaussianBlur(cv2.dilate(A, K(7 * S)), (0, 0), 6 * S)
    d3 = cv2.GaussianBlur(A, (0, 0), 18 * S)
    glow = np.clip(np.clip(d2 * 1.7, 0, 1) * 0.75 + np.clip(d3 * 1.8, 0, 1) * 0.45, 0, 1) * outside
    layers = [(glow, np.array([255, 150, 20], np.float32)), (band, np.array([255, 200, 46], np.float32)), (core, np.array([255, 246, 196], np.float32))]
    ca = np.zeros(A.shape + (3,), np.float32); aa = np.zeros(A.shape, np.float32)
    for la, lc in layers:  # premultiplied "over"
        ca = lc * la[..., None] + ca * (1 - la[..., None]); aa = la + aa * (1 - la)
    col = np.where(aa[..., None] > 1e-4, ca / np.maximum(aa[..., None], 1e-4), 0)
    alpha = aa
    halo = np.dstack([col, alpha[..., None] * 255]).astype(np.uint8)
    Image.fromarray(halo, 'RGBA').save(f'{OUT}/{name}-halo.webp', quality=90, method=6)
    # --- cutout: the painted building itself (for lift / bounce / brighten) ---
    cut = np.dstack([base[y0:y1, x0:x1], (A * 255).astype(np.uint8)])
    Image.fromarray(cut, 'RGBA').save(f'{OUT}/{name}-cut.webp', quality=92, method=6)
    # --- hit map ---
    small = cv2.resize(masks[name], (W0 // 2, H0 // 2), interpolation=cv2.INTER_AREA)
    hit[small > 127] = idx
    ty = int(ys.min())
    top_x = float(xs[ys < ty + 6 * S].mean())
    meta[name] = dict(i=idx, x=x0 / W, y=y0 / H, w=(x1 - x0) / W, h=(y1 - y0) / H,
                      topX=top_x / W, topY=ty / H, cx=float(xs.mean()) / W, cy=float(ys.mean()) / H,
                      baseY=float(ys.max()) / H)

# hit map: encode index in red channel, lossless png
Image.fromarray(np.dstack([hit * 30, hit * 30, hit * 30]).astype(np.uint8)).save(f'{OUT}/hitmap.png', optimize=True)
Image.fromarray(base).save(f'{OUT}/estate.webp', quality=86, method=6)
wpts=json.load(open('/home/claude/work/water.json'))
allm=np.zeros((H0,W0),np.uint8)
for n in order: allm|=masks[n]
wpts=[p for p in wpts if allm[min(H0-1,int(p[1]*H0)),min(W0-1,int(p[0]*W0))]==0]
json.dump(dict(water=wpts,order=order, size=[W0, H0], hitScale=2, buildings=meta), open(f'{OUT}/meta.json', 'w'), indent=1)
print(json.dumps(meta)[:400])
