"""Photographic grade for the village painting: calmer saturation, filmic contrast, split toning, aerial perspective, subtle clarity."""
import numpy as np, cv2, sys
from PIL import Image
src = sys.argv[1]; dst = sys.argv[2]
im = np.array(Image.open(src).convert('RGB')).astype(np.float32) / 255
H, W = im.shape[:2]
lin = im ** 2.2
# 1) saturation: calm the over-saturated greens/yellows most
hsv = cv2.cvtColor(im, cv2.COLOR_RGB2HSV)  # H 0-360, S 0-1, V 0-1
h, s, v = hsv[..., 0], hsv[..., 1], hsv[..., 2]
green = np.exp(-((h - 95) / 40) ** 2)
s = s * (1 - 0.16 * green - 0.03)
hsv = np.dstack([h, s, v]); im = cv2.cvtColor(hsv, cv2.COLOR_HSV2RGB)
# 2) clarity (local contrast) — large-radius unsharp on luminance
L = im @ np.array([.2126, .7152, .0722], np.float32)
blur = cv2.GaussianBlur(L, (0, 0), 18)
im = np.clip(im + (L - blur)[..., None] * 0.35, 0, 1)
# 3) filmic S-curve
im = np.clip(im, 0, 1); im = im * im * (3 - 2 * im) * 0.35 + im * 0.65
# 4) split toning: warm highlights, cool-teal shadows
L = im @ np.array([.2126, .7152, .0722], np.float32)
hi = np.clip((L - .45) / .5, 0, 1)[..., None]; lo = np.clip((.4 - L) / .4, 0, 1)[..., None]
im = im * (1 + hi * np.array([.05, .015, -.05])) * (1 + lo * np.array([-.05, .0, .05]))
# 5) aerial perspective: the far (top) edge of the estate recedes into haze
y = np.linspace(0, 1, H)[:, None, None]
haze = np.clip((0.34 - y) / 0.34, 0, 1) ** 1.5 * 0.22
im = im * (1 - haze) + np.array([.78, .85, .88]) * haze
# 6) very soft sun bloom from the top-left
yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
d = np.sqrt(((xx / W) - 0.05) ** 2 + ((yy / H) + 0.1) ** 2)
glow = np.clip(1 - d / 0.9, 0, 1) ** 2 * 0.08
im = im + glow[..., None] * np.array([1., .9, .7])
Image.fromarray((np.clip(im, 0, 1) * 255 + .5).astype(np.uint8)).save(dst)
