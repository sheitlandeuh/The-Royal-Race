import json, cv2, numpy as np
from PIL import Image

SRC = '/home/claude/the-royal-race/assets-src/royal-estate.png'
img = cv2.imread(SRC)
H, W = img.shape[:2]

B = {
 'haras': dict(cut=True, pts=[(811,264),(840,271),(839,291),(819,289),(819,295),(837,307),(842,325),(860,330),(880,327),(900,335),(930,377),(960,382),(1025,419),(1022,457),(990,458),(930,452),(890,452),(850,458),(842,462),(838,493),(781,493),(777,462),(770,458),(730,452),(680,453),(630,455),(600,455),(595,410),(660,380),(687,360),(705,335),(730,332),(750,340),(777,327),(780,310),(800,294),(810,290)]),
 'hippodrome': dict(cut=False, pts=[(589,174),(607,152),(664,133),(764,124),(764,96),(786,68),(796,44),(814,44),(820,68),(848,74),(970,69),(986,54),(998,43),(1011,55),(1015,74),(1114,99),(1123,89),(1129,108),(1154,136),(1182,174),(1195,236),(1189,280),(1164,305),(1114,324),(1007,336),(882,331),(776,314),(695,292),(620,252),(592,211)]),
 'clinique': dict(cut=True, pts=[(166,460),(194,448),(216,418),(222,414),(254,408),(270,412),(306,402),(318,392),(330,382),(338,392),(346,402),(374,412),(400,444),(395,478),(390,498),(350,502),(310,514),(250,514),(214,516),(174,500),(166,484)]),
 'ecurie': dict(cut=True, pts=[(1260,345),(1290,320),(1315,308),(1340,320),(1363,301),(1397,299),(1420,310),(1445,317),(1485,322),(1495,333),(1522,345),(1540,358),(1554,379),(1540,388),(1535,417),(1476,409),(1454,406),(1440,399),(1390,395),(1354,392),(1295,386),(1265,383),(1260,358)]),
 'chantier': dict(cut=True, pts=[(1053,527),(1114,498),(1127,468),(1183,457),(1231,455),(1266,472),(1301,481),(1318,498),(1318,529),(1340,548),(1342,575),(1266,598),(1227,614),(1192,616),(1105,585),(1057,559)]),
 'moulin': dict(cut=True, pts=[(1315,612),(1345,584),(1375,595),(1372,545),(1402,540),(1420,580),(1445,542),(1462,550),(1450,595),(1525,605),(1555,622),(1575,620),(1597,595),(1625,620),(1627,690),(1600,718),(1560,725),(1530,722),(1490,720),(1440,722),(1418,712),(1395,700),(1350,700),(1318,690)]),
 'paddocks': dict(cut=False, pts=[(178,648),(220,630),(265,610),(302,595),(307,580),(335,572),(362,585),(360,605),(390,602),(417,620),(450,617),(490,640),(515,665),(515,725),(470,742),(395,770),(380,770),(320,730),(270,702),(200,675),(178,667)]),
 'carriere': dict(cut=False, pts=[(116,318),(138,299),(216,277),(299,254),(344,241),(394,239),(444,246),(452,224),(466,207),(488,188),(519,218),(511,238),(508,307),(461,321),(416,332),(349,352),(272,374),(194,384),(138,371),(115,343)]),
}

def poly_mask(pts):
    m = np.zeros((H, W), np.uint8)
    cv2.fillPoly(m, [np.array(pts, np.int32)], 255)
    return m

def refine(pts):
    base = poly_mask(pts)
    k = lambda r: cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2*r+1, 2*r+1))
    sure_fg = cv2.erode(base, k(9))
    outer = cv2.dilate(base, k(10))
    gc = np.full((H, W), cv2.GC_BGD, np.uint8)
    gc[outer > 0] = cv2.GC_PR_BGD
    gc[base > 0] = cv2.GC_PR_FGD
    gc[sure_fg > 0] = cv2.GC_FGD
    x, y, w, h = cv2.boundingRect(outer)
    pad = 20
    x0, y0, x1, y1 = max(0, x-pad), max(0, y-pad), min(W, x+w+pad), min(H, y+h+pad)
    sub = gc[y0:y1, x0:x1].copy()
    bg, fg = np.zeros((1, 65), np.float64), np.zeros((1, 65), np.float64)
    cv2.grabCut(img[y0:y1, x0:x1], sub, None, bg, fg, 6, cv2.GC_INIT_WITH_MASK)
    out = np.zeros((H, W), np.uint8)
    out[y0:y1, x0:x1] = np.where((sub == cv2.GC_FGD) | (sub == cv2.GC_PR_FGD), 255, 0)
    # keep largest component, close gaps, fill holes
    out = cv2.morphologyEx(out, cv2.MORPH_CLOSE, k(3))
    n, lab, st, _ = cv2.connectedComponentsWithStats(out)
    if n > 1:
        big = 1 + np.argmax(st[1:, cv2.CC_STAT_AREA])
        out = np.where(lab == big, 255, 0).astype(np.uint8)
    cnts, _ = cv2.findContours(out, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
    filled = np.zeros_like(out); cv2.drawContours(filled, cnts, -1, 255, -1)
    out = cv2.morphologyEx(filled, cv2.MORPH_OPEN, k(2))
    # never spill far outside the hand-drawn silhouette (keeps bases/fronts clean)
    out = cv2.bitwise_and(out, cv2.dilate(base, k(4)))
    return out

masks = {}
for name, b in B.items():
    m = refine(b['pts']) if b['cut'] else poly_mask(b['pts'])
    masks[name] = m
# occlusion: château is in front of the hippodrome
masks['hippodrome'] = cv2.bitwise_and(masks['hippodrome'], cv2.bitwise_not(cv2.dilate(masks['haras'], np.ones((3, 3), np.uint8))))

np.savez_compressed('/home/claude/work/masks.npz', **masks)

# review overlay
ov = img.copy()
cols = [(0,215,255),(255,120,0),(0,0,255),(255,0,255),(0,255,0),(255,255,0),(0,128,255),(200,200,255)]
for i, (n, m) in enumerate(masks.items()):
    cnts, _ = cv2.findContours(m, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
    cv2.drawContours(ov, cnts, -1, cols[i % len(cols)], 2)
cv2.imwrite('/home/claude/work/review.png', ov)
print({n: int(m.sum() / 255) for n, m in masks.items()})
