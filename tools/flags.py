"""Cut the banners / château flag out of the village painting so they can wave; inpaint the painting behind them."""
import json, numpy as np, cv2
from PIL import Image
SRC, DST = 'estate-graded.png', 'estate-flagless.png'
im = np.array(Image.open(SRC).convert('RGB')); H, W = im.shape[:2]
hsv = cv2.cvtColor(im.astype(np.float32) / 255, cv2.COLOR_RGB2HSV)
h, s, v = hsv[..., 0], hsv[..., 1], hsv[..., 2]
red = (((h > 335) | (h < 14)) & (s > .4) & (v > .15) & (v < .7)).astype(np.uint8)
# (x, y, w, h, kind)  kind: 'hang' = banner hanging from a crossbar, 'pole' = flag flying from a pole on its left
FLAGS = [(1259, 434, 47, 89, 'hang'), (2097, 618, 52, 89, 'hang'), (1264, 697, 34, 65, 'hang'), (1902, 698, 31, 67, 'hang'),
         (1129, 262, 25, 35, 'hang'), (1625, 529, 56, 58, 'pole')]
K = lambda r: cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2 * r + 1, 2 * r + 1))
sprites, hole = [], np.zeros((H, W), np.uint8)
x_cursor, atlas_parts = 0, []
for (x, y, w, hh, kind) in FLAGS:
    P = 6
    x0, y0, x1, y1 = x - P, y - P, x + w + P, y + hh + P
    sub = red[y0:y1, x0:x1].copy()
    sub = cv2.morphologyEx(sub, cv2.MORPH_CLOSE, K(3))
    n, lab, st, _ = cv2.connectedComponentsWithStats(sub)
    big = 1 + np.argmax(st[1:, cv2.CC_STAT_AREA]); m = (lab == big).astype(np.uint8)
    cnts, _ = cv2.findContours(m, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE); m = np.zeros_like(m); cv2.drawContours(m, cnts, -1, 1, -1)
    gold = (((h > 28) & (h < 60) & (s > .3) & (v > .38))[y0:y1, x0:x1]).astype(np.uint8)
    m = np.maximum(m, gold & cv2.dilate(m, K(5)))
    m = cv2.morphologyEx(m, cv2.MORPH_CLOSE, K(2)); m = cv2.dilate(m, K(1))
    alpha = cv2.GaussianBlur(m.astype(np.float32), (0, 0), .8)
    rgba = np.dstack([im[y0:y1, x0:x1], (np.clip(alpha * 1.4, 0, 1) * 255).astype(np.uint8)])
    atlas_parts.append(rgba)
    sprites.append(dict(x=x0, y=y0, w=x1 - x0, h=y1 - y0, ax=x_cursor, kind=kind))
    x_cursor += x1 - x0 + 4
    hole[y0:y1, x0:x1] |= cv2.dilate(m, K(3))
out = cv2.inpaint(im, hole, 7, cv2.INPAINT_TELEA)
Image.fromarray(out).save(DST)
AH = max(p.shape[0] for p in atlas_parts)
atlas = np.zeros((AH, x_cursor, 4), np.uint8)
for p, s_ in zip(atlas_parts, sprites): atlas[:p.shape[0], s_['ax']:s_['ax'] + p.shape[1]] = p
Image.fromarray(atlas, 'RGBA').save('/home/claude/the-royal-race/assets/village/flags.webp', lossless=True)
json.dump(dict(size=[W, H], flags=sprites), open('flags.json', 'w'))
Image.fromarray(np.hstack([im[420:620, 1200:1400], out[420:620, 1200:1400]])).save('flag-inpaint.png')
print(sprites)
