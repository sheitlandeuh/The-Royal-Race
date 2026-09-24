"""Class masks for recolouring the jockey silks / horse coat on the race (rear) and podium (front) sprite sheets.
Mask PNG channels: R = class id, G = sub-class (shading group).  Classes: 1 jersey, 2 cap, 3 saddle cloth, 4 coat, 5 hair.
"""
import json, os, cv2, numpy as np
from PIL import Image
A = '/home/claude/the-royal-race/assets/'
OUT = A + 'horses/'; os.makedirs(OUT, exist_ok=True)
PREV = '/home/claude/work/'

def hsv(img):
    rgb = img[..., :3].astype(np.float32) / 255
    h = cv2.cvtColor(rgb, cv2.COLOR_RGB2HSV)
    return h[..., 0], h[..., 1], h[..., 2], rgb

def fill_holes(m):
    cnts, _ = cv2.findContours(m.astype(np.uint8), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
    f = np.zeros(m.shape, np.uint8); cv2.drawContours(f, cnts, -1, 1, -1); return f.astype(bool)

K = lambda r: cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2 * r + 1, 2 * r + 1))
meta = {}

# ------------------------------------------------------------------ REAR (race) sheet: 8 frames
im = np.array(Image.open(A + 'rival-gallop-sheet.png').convert('RGBA'))
H, W = im.shape[:2]; FW = W / 8
h, s, v, rgb = hsv(im); a = im[..., 3] > 40
lum = rgb @ np.array([.2126, .7152, .0722], np.float32)
yy, xx = np.mgrid[0:H, 0:W]
cls = np.zeros((H, W), np.uint8); sub = np.zeros((H, W), np.uint8)
blue = a & (h > 195) & (h < 265) & (s > .28)
gold = a & (h > 30) & (h < 58) & (s > .38) & (v > .42)
rear_frames = []
for f in range(8):
    x0, x1 = int(round(f * FW)), int(round((f + 1) * FW))
    fr = np.zeros((H, W), bool); fr[:, x0:x1] = True
    B, G, AL = blue & fr, gold & fr, a & fr
    cx = (x0 + x1) / 2
    # saddle cloth: blue below the breeches; locate the white breeches band
    white = AL & (s < .16) & (v > .72)
    wy = np.where(white.any(1))[0]; wy = wy[(wy > .15 * H) & (wy < .5 * H)]
    hem = int(np.percentile(wy, 5)) if len(wy) else int(.24 * H)
    seat = int(np.percentile(wy, 95)) if len(wy) else int(.34 * H)
    silk = (B | G) & (yy < seat)
    near_silk = cv2.dilate(silk.astype(np.uint8), K(6)).astype(bool)
    silk = (B | (G & near_silk)) & (yy < seat)
    # cap vs jersey: narrowest silk row between cap and shoulders
    ys = np.where(silk.any(1))[0]; top = ys.min()
    widths = np.array([silk[y].sum() for y in range(top, top + int(.12 * H))])
    band = widths[int(.035 * H):int(.09 * H)]
    neck = top + int(.035 * H) + int(np.argmin(band))
    cap = silk & (yy <= neck); jer = silk & (yy > neck) & (yy < hem + int(.06 * H))
    jer = jer | (silk & (yy > neck) & (np.abs(xx - cx) > .17 * FW))  # sleeves hang lower
    cloth_b = B & (yy >= seat - int(.02 * H)) & (yy < .52 * H)
    cloth_g = G & cv2.dilate(cloth_b.astype(np.uint8), K(5)).astype(bool) & (yy >= seat - int(.02 * H)) & (yy < .52 * H)
    for m, c in ((cap, 2), (jer, 1)):
        cls[m] = c; sub[m & G] = 1
    cls[cloth_b] = 3; cls[cloth_g] = 3; sub[cloth_g] = 1
    # horse coat and hair (tail, mane, dark legs)
    horse = AL & (yy > seat - int(.03 * H)) & (cls == 0)
    coat = horse & (h < 42) & (s > .22) & (v > .1) & ~(gold)
    dark = horse & ~coat & (v < .38) & (s < .45)
    boots = (yy < .5 * H) & (np.abs(xx - cx) > .19 * FW)
    hoof = yy > .86 * H
    hair = dark & ~boots & ~hoof
    cls[coat] = 4; cls[hair] = 5
    jy, jx = np.where(cls[:, x0:x1] == 1); cy_, cx2 = np.where(cls[:, x0:x1] == 2)
    rear_frames.append(dict(x0=x0, x1=x1, jersey=[int(jx.min()) + x0, int(jy.min()), int(jx.max()) + x0, int(jy.max())],
                            cap=[int(cx2.min()) + x0, int(cy_.min()), int(cx2.max()) + x0, int(cy_.max())]))
Image.fromarray(np.dstack([cls, sub * 255, np.zeros_like(cls)]), 'RGB').save(OUT + 'gallop-mask.png', optimize=True)
rear_coat_l = lum[cls == 4]
cdf = np.searchsorted(np.sort(rear_coat_l), np.linspace(0, 1, 256)) / len(rear_coat_l)
meta['gallop'] = dict(frames=rear_frames, coatCdf=[round(float(x), 4) for x in cdf])
# preview
col = np.array([[0, 0, 0], [40, 90, 255], [255, 60, 60], [0, 220, 220], [150, 90, 40], [255, 255, 0]], np.uint8)
pv = rgb.copy() * 255; m = cls > 0; pv[m] = pv[m] * .35 + col[cls[m]] * .65
Image.fromarray(pv.astype(np.uint8)[:, :int(FW * 3)]).save(PREV + 'mask-rear.png')

# ------------------------------------------------------------------ FRONT (podium) sheet: 6 frames, each a different coat
im2 = np.array(Image.open(A + 'podium-horses-front-v1.png').convert('RGBA'))
H2, W2 = im2.shape[:2]; FW2 = W2 / 6
h2, s2, v2, rgb2 = hsv(im2); a2 = im2[..., 3] > 40
lum2 = rgb2 @ np.array([.2126, .7152, .0722], np.float32)
Y2, X2 = np.mgrid[0:H2, 0:W2]
cls2 = np.zeros((H2, W2), np.uint8); sub2 = np.zeros((H2, W2), np.uint8)
HUE = lambda lo, hi: (h2 >= lo) & (h2 < hi) if lo < hi else ((h2 >= lo) | (h2 < hi))
white = (s2 < .17) & (v2 > .66)
rules = [  # (main, secondary) colour classes of each baked silk
    (HUE(340, 12) & (s2 > .5), white),
    (HUE(205, 250) & (s2 > .4), white),
    (HUE(40, 62) & (s2 > .5), HUE(205, 255) & (s2 > .28) & (v2 < .55)),
    (HUE(115, 175) & (s2 > .28), (s2 < .15) & (v2 > .6)),
    (HUE(250, 300) & (s2 > .22), HUE(35, 56) & (s2 > .33) & (v2 > .5)),
    (HUE(14, 36) & (s2 > .66) & (v2 > .6), HUE(205, 255) & (s2 > .28)),
]
# jersey box (x0,y0,x1,y1 in frame px), head box excluded from jersey, helmet box
boxes = [
    dict(j=(88, 72, 252, 212), cap=(135, 5, 205, 58), face=(140, 40, 200, 88)),
    dict(j=(120, 76, 272, 205), cap=(170, 8, 240, 58), face=(172, 40, 225, 92)),
    dict(j=(72, 84, 208, 210), cap=(110, 10, 180, 60), face=(115, 42, 175, 98)),
    dict(j=(82, 76, 240, 205), cap=(125, 5, 190, 55), face=(130, 35, 185, 88)),
    dict(j=(80, 76, 205, 212), cap=(125, 8, 195, 60), face=(125, 40, 180, 95)),
    dict(j=(95, 70, 250, 205), cap=(145, 5, 210, 55), face=(150, 38, 205, 88)),
]
front_frames = []
coat_luts = []
for f in range(6):
    x0 = int(round(f * FW2)); x1 = int(round((f + 1) * FW2)); b = boxes[f]
    inbox = lambda bx: (X2 >= x0 + bx[0]) & (X2 < x0 + bx[2]) & (Y2 >= bx[1]) & (Y2 < bx[3])
    mainc, secc = rules[f]
    jb = inbox(b['j']) & a2 & ~inbox(b['face'])
    jm, js = jb & mainc, jb & secc
    if f == 3: js = js & ~inbox((126, 100, 206, 260))  # grey horse head sits in front of the white sleeves
    # keep only components connected to the shoulder seed band (removes blazes, horse whites)
    seed = inbox((b['j'][0], b['j'][1], b['j'][2], b['j'][1] + 26))
    both = (jm | js).astype(np.uint8)
    both = cv2.morphologyEx(both, cv2.MORPH_CLOSE, K(1))
    n, lab = cv2.connectedComponents(both)
    keep = np.zeros_like(both, bool)
    for i in np.unique(lab[seed & (both > 0)]):
        if i: keep |= lab == i
    j = keep & (jm | js)
    cls2[j] = 1; sub2[j & js] = 1
    cb = inbox(b['cap']) & a2 & ~inbox((b['face'][0], b['face'][1] + 8, b['face'][2], b['face'][3]))
    cm, cs = cb & mainc, cb & secc & (v2 > .7) & (Y2 < b['cap'][1] + 40)
    cls2[cm | cs] = 2; sub2[cs] = 1
    ys, xs = np.where(cls2[:, x0:x1] == 1); cys, cxs = np.where(cls2[:, x0:x1] == 2)
    front_frames.append(dict(x0=x0, x1=x1, jersey=[int(xs.min()) + x0, int(ys.min()), int(xs.max()) + x0, int(ys.max())],
                             cap=[int(cxs.min()) + x0, int(cys.min()), int(cxs.max()) + x0, int(cys.max())]))
    # coat colour lookup: chest / forearm area of this horse, sorted by luminance
    chest = a2 & (X2 >= x0 + 95) & (X2 < x0 + 265) & (Y2 > 330) & (Y2 < 520) & (v2 > .06)
    px = rgb2[chest]; order = np.argsort(px @ np.array([.2126, .7152, .0722]))
    px = px[order]; q = np.linspace(0, len(px) - 1, 64).astype(int)
    lut = cv2.GaussianBlur(px[q].reshape(64, 1, 3), (1, 5), 0).reshape(64, 3)
    coat_luts.append([[int(c * 255 + .5) for c in p] for p in lut])
Image.fromarray(np.dstack([cls2, sub2 * 255, np.zeros_like(cls2)]), 'RGB').save(OUT + 'podium-mask.png', optimize=True)
meta['podium'] = dict(frames=front_frames)
meta['coatLuts'] = coat_luts
json.dump(meta, open(OUT + 'meta.json', 'w'))
pv = rgb2.copy() * 255; m = cls2 > 0; pv[m] = pv[m] * .35 + col[cls2[m]] * .65
Image.fromarray(pv.astype(np.uint8)[:320]).save(PREV + 'mask-front.png')
print('ok', [f['jersey'] for f in front_frames])
