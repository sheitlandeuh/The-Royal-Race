"""Bake realism assets for the 3D race: horizon panorama, grass tile. Also village grade + cloud shadow tile."""
import numpy as np, cv2
from PIL import Image, ImageDraw
rng = np.random.default_rng(42)
A = '/home/claude/the-royal-race/assets/'
OUT = '/home/claude/the-royal-race/assets/race/'
import os; os.makedirs(OUT, exist_ok=True)

def periodic_noise(n, scale, seed):
    """Tileable noise: random spectrum low-passed around a scale (in px)."""
    r = np.random.default_rng(seed)
    f = np.fft.fftfreq(n)[:, None] ** 2 + np.fft.fftfreq(n)[None, :] ** 2
    spec = (r.normal(size=(n, n)) + 1j * r.normal(size=(n, n))) * np.exp(-f * (scale ** 2) * 9)
    x = np.real(np.fft.ifft2(spec)); x -= x.mean(); return x / (x.std() + 1e-9)

# ---------- 1. horizon panorama (tileable, alpha-faded base, aerial haze) ----------
pan = np.array(Image.open(A + '../assets-src/croise-panorama-loop.png').convert('RGB')).astype(np.float32)
H0, W0 = pan.shape[:2]
CUT = 486
pan = pan[:CUT]
ov = 260  # crossfade overlap to make it loop
w = np.linspace(0, 1, ov)[None, :, None]
loop = pan[:, :W0 - ov].copy()
loop[:, :ov] = pan[:, W0 - ov:] * (1 - w) + pan[:, :ov] * w
h, W = loop.shape[:2]
haze = np.array([196, 214, 222], np.float32)
yy = np.linspace(0, 1, h)[:, None, None]
aerial = np.clip((yy - 0.45) / 0.55, 0, 1) * 0.28  # distant ground/tree line gets hazier
loop = loop * (1 - aerial) + haze * aerial
loop = loop * 0.97 + 4  # slight flatten so it reads as distance
alpha = (np.clip((CUT - 6 - np.arange(h)) / 34, 0, 1) * np.clip(np.arange(h) / 60, 0, 1))[:, None] * np.ones((1, W))
img = np.dstack([np.clip(loop, 0, 255), alpha[..., None] * 255]).astype(np.uint8)
Image.fromarray(img, 'RGBA').save(OUT + 'horizon.webp', quality=88, method=6)
top = loop[:12].reshape(-1, 3).mean(0); print('horizon top colour', top.round())

# ---------- 2. grass tile (tileable, blades + multi-scale variation) ----------
N = 1024
v = 0.2 * periodic_noise(N, 140, 1) + 0.35 * periodic_noise(N, 36, 2) + 0.45 * periodic_noise(N, 8, 3)
v = (v - v.min()) / (v.max() - v.min())
dark, light = np.array([56, 90, 32], np.float32), np.array([100, 140, 58], np.float32)
base = dark + (light - dark) * v[..., None] ** 1.1
im = Image.fromarray(np.clip(base, 0, 255).astype(np.uint8))
d = ImageDraw.Draw(im, 'RGBA')
for _ in range(90000):
    x, y = rng.uniform(0, N, 2); L = rng.uniform(3, 9); a = rng.normal(-1.57, 0.5)
    c = rng.choice([0, 1, 2], p=[.55, .35, .10])
    col = [(38, 70, 22), (112, 158, 62), (150, 162, 88)][c]
    al = int(rng.uniform(60, 150))
    dx, dy = np.cos(a) * L, np.sin(a) * L
    for ox in (-N, 0, N):
        for oy in (-N, 0, N):
            if -12 < x + ox < N + 12 and -12 < y + oy < N + 12:
                d.line([(x + ox, y + oy), (x + ox + dx, y + oy + dy)], fill=col + (al,), width=1)
g = np.array(im).astype(np.float32)
g = cv2.GaussianBlur(g, (0, 0), 0.6)
Image.fromarray(np.clip(g, 0, 255).astype(np.uint8)).save(OUT + 'grass.webp', quality=86, method=6)

# ---------- 3. cloud-shadow tile for the village (tileable alpha) ----------
N2 = 512
c = 0.6 * periodic_noise(N2, 90, 7) + 0.4 * periodic_noise(N2, 30, 8)
c = (c - c.min()) / (c.max() - c.min())
m = np.clip((c - 0.52) / 0.2, 0, 1)
m = cv2.GaussianBlur(m, (0, 0), 6)
sh = np.dstack([np.full((N2, N2), 22), np.full((N2, N2), 38), np.full((N2, N2), 30), m * 255]).astype(np.uint8)
Image.fromarray(sh, 'RGBA').save('/home/claude/the-royal-race/assets/village/cloud-shadows.webp', quality=80, method=6)
print('ok')
