/* ===== Cheval + jockey en 3D — maillage sculpté d'un seul tenant et déformé par un squelette =====
   Anatomie en surfaces implicites (union lisse d'ellipsoïdes et de cônes arrondis, creusements pour les naseaux), maillée
   dans un Worker (« surface nets » en bande étroite) pour ne pas bloquer le jeu, puis pondérée sur 18 os : le corps, l'encolure,
   la tête, la queue et quatre jambes à trois segments se plient sans cassure. Crinière, toupet et queue en mèches (cartes de crins),
   robes avec extrémités noires, pommelures, balzanes et liste tirées du nom du cheval, jockey articulé (bras qui poussent au sprint).
   Trois niveaux de détail (0 gros plan ~80 000 triangles, 1 course ~24 000, 2 domaine), géométries partagées par tous les chevaux.
   API : ready(lod) → promesse, build(livrée, {number, blinkers, lod, free, seed}) rend tout de suite un groupe qui s'assemble
   dès que le maillage est prêt (userData.pending), pose(cheval, phase, allure, poussée, broute), setLod(cheval, lod), dispose(cheval). */
const HORSE3D = (() => {
  // ---------- sculpture et anatomie (fonctions autonomes : leur source est aussi envoyée au Worker) ----------
  // Moteur de sculpture (sans THREE) : union lisse de primitives + creusements, maillage « surface nets » en bande étroite,
  // normales par gradient, occlusion cuite, région par sommet. Fonction autonome (sérialisable pour un Worker).
  function SCULPT(spec) {
    const { prims, negs = [], k = .06, kn = .02, min, max, h } = spec;
    // primitive : e = ellipsoïde {c,r,rz,ry}, c = capsule {a,b,ra,rb,zs}
    for (const P of prims.concat(negs)) {
      if (P.e) { P.cz = Math.cos(P.rz || 0); P.sz = Math.sin(P.rz || 0); P.cy = Math.cos(P.ry || 0); P.sy = Math.sin(P.ry || 0); P.bc = P.c; P.br = Math.max(P.r[0], P.r[1], P.r[2]) }
      else { P.zs = P.zs || 1; P.bc = [(P.a[0] + P.b[0]) / 2, (P.a[1] + P.b[1]) / 2, (P.a[2] + P.b[2]) / 2]; P.br = Math.hypot(P.a[0] - P.b[0], P.a[1] - P.b[1], P.a[2] - P.b[2]) / 2 + Math.max(P.ra, P.rb) * Math.max(1, P.zs) }
    }
    function dist(P, x, y, z) {
      if (P.e) {
        let dx = x - P.c[0], dy = y - P.c[1], dz = z - P.c[2];
        if (P.sy) { const u = dx * P.cy - dz * P.sy; dz = dx * P.sy + dz * P.cy; dx = u }
        if (P.sz) { const u = dx * P.cz + dy * P.sz; dy = -dx * P.sz + dy * P.cz; dx = u }
        const X = dx / P.r[0], Y = dy / P.r[1], Z = dz / P.r[2], k0 = Math.sqrt(X * X + Y * Y + Z * Z), k1 = Math.sqrt(X * X / (P.r[0] * P.r[0]) + Y * Y / (P.r[1] * P.r[1]) + Z * Z / (P.r[2] * P.r[2]));
        return k1 > 1e-9 ? k0 * (k0 - 1) / k1 : -Math.min(P.r[0], P.r[1], P.r[2])
      }
      const zs = P.zs, ax = P.a[0], ay = P.a[1], az = P.a[2] / zs, bx = P.b[0] - ax, by = P.b[1] - ay, bz = P.b[2] / zs - az, px = x - ax, py = y - ay, pz = z / zs - az, L = bx * bx + by * by + bz * bz, t = Math.max(0, Math.min(1, (px * bx + py * by + pz * bz) / L)), qx = px - bx * t, qy = py - by * t, qz = pz - bz * t;
      return (Math.sqrt(qx * qx + qy * qy + qz * qz) - (P.ra + (P.rb - P.ra) * t)) * Math.min(1, zs)
    }
    function f(x, y, z) {
      let d = 1e9;
      for (let i = 0; i < prims.length; i++) { const P = prims[i], sx = x - P.bc[0], sy = y - P.bc[1], sz = z - P.bc[2], sb = Math.sqrt(sx * sx + sy * sy + sz * sz) - P.br; if (sb > d + k) continue; const e = dist(P, x, y, z), hh = Math.max(k - Math.abs(d - e), 0) / k; d = Math.min(d, e) - hh * hh * k * .25 }
      for (let i = 0; i < negs.length; i++) { const P = negs[i], sx = x - P.bc[0], sy = y - P.bc[1], sz = z - P.bc[2]; if (Math.sqrt(sx * sx + sy * sy + sz * sz) - P.br > kn) continue; const e = -dist(P, x, y, z), hh = Math.max(kn - Math.abs(d - e), 0) / kn; d = Math.max(d, e) + hh * hh * kn * .25 }
      return d
    }
    // région la plus proche, la suivante (autre région) et un poids de fondu : les frontières de couleur restent lisses
    function region(x, y, z) { let b = 1e9, id = 0, b2 = 1e9, id2 = -1; const best = {};
      for (const P of prims) { const e = dist(P, x, y, z), r = P.id || 0; if (!(r in best) || e < best[r]) best[r] = e }
      for (const r in best) { const e = best[r]; if (e < b) { b2 = b; id2 = id; b = e; id = +r } else if (e < b2) { b2 = e; id2 = +r } }
      return [id, id2 < 0 ? id : id2, id2 < 0 ? 0 : .5 * Math.exp(-(b2 - b) / (spec.soft || h * .7))] }
    // grille grossière (pas H) puis fine (pas h) seulement près de la surface
    const R = 4, H = h * R, cx = Math.ceil((max[0] - min[0]) / H) + 1, cy = Math.ceil((max[1] - min[1]) / H) + 1, cz = Math.ceil((max[2] - min[2]) / H) + 1;
    const CF = new Float32Array(cx * cy * cz), CI = (i, j, k2) => i + cx * (j + cy * k2);
    for (let k2 = 0; k2 < cz; k2++) for (let j = 0; j < cy; j++) for (let i = 0; i < cx; i++) CF[CI(i, j, k2)] = f(min[0] + i * H, min[1] + j * H, min[2] + k2 * H);
    const nx = (cx - 1) * R + 1, ny = (cy - 1) * R + 1, nz = (cz - 1) * R + 1, F = new Float32Array(nx * ny * nz), I = (i, j, k2) => i + nx * (j + ny * k2);
    let evals = 0;
    for (let k2 = 0; k2 < cz - 1; k2++) for (let j = 0; j < cy - 1; j++) for (let i = 0; i < cx - 1; i++) {
      let mn = 1e9; const c = []; for (let q = 0; q < 8; q++) { const v = CF[CI(i + (q & 1), j + (q >> 1 & 1), k2 + (q >> 2 & 1))]; c.push(v); mn = Math.min(mn, Math.abs(v)) }
      const near = mn < H * 1.9;
      for (let kk = 0; kk <= R; kk++) for (let jj = 0; jj <= R; jj++) for (let ii = 0; ii <= R; ii++) {
        const gi = i * R + ii, gj = j * R + jj, gk = k2 * R + kk, id = I(gi, gj, gk);
        if (near) { F[id] = f(min[0] + gi * h, min[1] + gj * h, min[2] + gk * h); evals++ }
        else if (F[id] === 0) { const u = ii / R, v = jj / R, w = kk / R; F[id] = ((c[0] * (1 - u) + c[1] * u) * (1 - v) + (c[2] * (1 - u) + c[3] * u) * v) * (1 - w) + ((c[4] * (1 - u) + c[5] * u) * (1 - v) + (c[6] * (1 - u) + c[7] * u) * v) * w || 1e-6 }
      }
    }
    // surface nets
    const vid = new Int32Array(nx * ny * nz).fill(-1), pos = [], idx = [], E12 = [[0, 1], [2, 3], [4, 5], [6, 7], [0, 2], [1, 3], [4, 6], [5, 7], [0, 4], [1, 5], [2, 6], [3, 7]], cv = new Float32Array(8);
    for (let k2 = 0; k2 < nz - 1; k2++) for (let j = 0; j < ny - 1; j++) for (let i = 0; i < nx - 1; i++) {
      let m = 0; for (let c = 0; c < 8; c++) { cv[c] = F[I(i + (c & 1), j + (c >> 1 & 1), k2 + (c >> 2 & 1))]; if (cv[c] < 0) m |= 1 << c } if (m === 0 || m === 255) continue;
      let sx = 0, sy = 0, sz = 0, n = 0; for (const [a, b] of E12) { if ((cv[a] < 0) === (cv[b] < 0)) continue; const t = cv[a] / (cv[a] - cv[b]); sx += (a & 1) + ((b & 1) - (a & 1)) * t; sy += (a >> 1 & 1) + ((b >> 1 & 1) - (a >> 1 & 1)) * t; sz += (a >> 2 & 1) + ((b >> 2 & 1) - (a >> 2 & 1)) * t; n++ }
      vid[I(i, j, k2)] = pos.length / 3; pos.push(min[0] + (i + sx / n) * h, min[1] + (j + sy / n) * h, min[2] + (k2 + sz / n) * h)
    }
    const quad = (a, b, c, d, flip) => { if (a < 0 || b < 0 || c < 0 || d < 0) return; flip ? idx.push(a, d, c, a, c, b) : idx.push(a, b, c, a, c, d) };
    for (let k2 = 1; k2 < nz - 1; k2++) for (let j = 1; j < ny - 1; j++) for (let i = 1; i < nx - 1; i++) {
      const s = F[I(i, j, k2)] < 0;
      if (s !== (F[I(i + 1, j, k2)] < 0)) quad(vid[I(i, j, k2)], vid[I(i, j - 1, k2)], vid[I(i, j - 1, k2 - 1)], vid[I(i, j, k2 - 1)], !s);
      if (s !== (F[I(i, j + 1, k2)] < 0)) quad(vid[I(i, j, k2)], vid[I(i, j, k2 - 1)], vid[I(i - 1, j, k2 - 1)], vid[I(i - 1, j, k2)], !s);
      if (s !== (F[I(i, j, k2 + 1)] < 0)) quad(vid[I(i, j, k2)], vid[I(i - 1, j, k2)], vid[I(i - 1, j - 1, k2)], vid[I(i, j - 1, k2)], !s)
    }
    // lissage léger des positions (Laplacien) : efface l'escalier des surface nets sans perdre les formes
    const n = pos.length / 3, P = new Float32Array(pos);
    if (spec.smooth) {
      const nb = Array.from({ length: n }, () => []); for (let t = 0; t < idx.length; t += 3) { const a = idx[t], b = idx[t + 1], c = idx[t + 2]; nb[a].push(b, c); nb[b].push(a, c); nb[c].push(a, b) }
      for (let it = 0; it < spec.smooth; it++) { const Q = new Float32Array(P); for (let v = 0; v < n; v++) { const L = nb[v]; if (!L.length) continue; let x = 0, y = 0, z = 0; for (const u of L) { x += Q[u * 3]; y += Q[u * 3 + 1]; z += Q[u * 3 + 2] } P[v * 3] = Q[v * 3] * .5 + x / L.length * .5; P[v * 3 + 1] = Q[v * 3 + 1] * .5 + y / L.length * .5; P[v * 3 + 2] = Q[v * 3 + 2] * .5 + z / L.length * .5 } }
    }
    const nor = new Float32Array(n * 3), ao = new Float32Array(n), reg = new Uint8Array(n), reg2 = new Uint8Array(n), rt = new Float32Array(n), e = h * .5;
    for (let v = 0; v < n; v++) {
      const x = P[v * 3], y = P[v * 3 + 1], z = P[v * 3 + 2]; let gx = f(x + e, y, z) - f(x - e, y, z), gy = f(x, y + e, z) - f(x, y - e, z), gz = f(x, y, z + e) - f(x, y, z - e); const L = Math.hypot(gx, gy, gz) || 1; gx /= L; gy /= L; gz /= L; nor[v * 3] = gx; nor[v * 3 + 1] = gy; nor[v * 3 + 2] = gz;
      let o = 0; for (const [d, w] of [[.02, 1], [.05, .6], [.11, .35]]) o += w * Math.max(0, d - f(x + gx * d, y + gy * d, z + gz * d)) / d; ao[v] = Math.max(.3, 1 - o * .5); const R3 = region(x, y, z); reg[v] = R3[0]; reg2[v] = R3[1]; rt[v] = R3[2]
    }
    spec.f = f;
    return { pos: P, nor, ao, reg, reg2, rt, idx: n > 65535 ? new Uint32Array(idx) : new Uint16Array(idx), evals }
  }
  // Anatomie du pur-sang (mètres ; x = avant, y = haut, z = côté ; sol à y = 0), jambes d'aplomb au repos.
  // Régions : 0 corps, 1 encolure, 2 tête, 3 queue, 4 antérieur gauche, 5 antérieur droit, 6 postérieur gauche, 7 postérieur droit.
  function HORSE_SPEC(h) {
    const E = (c, r, id = 0, rz = 0, ry = 0) => ({ e: 1, c, r, id, rz, ry }), C = (a, b, ra, rb, id = 0, zs = 1) => ({ a, b, ra, rb, id, zs });
    const P = [
      // tronc
      E([-.12, 1.3, 0], [.56, .31, .27]), E([.42, 1.24, 0], [.26, .28, .23], 0, -.35),
      E([.37, 1.34, .12], [.27, .24, .12], 0, -.95), E([.37, 1.34, -.12], [.27, .24, .12], 0, -.95),
      E([.27, 1.52, 0], [.23, .1, .1], 0, .12), C([.16, 1.53, 0], [-.5, 1.54, 0], .12, .13),
      E([-.62, 1.37, 0], [.34, .28, .25]), E([-.72, 1.24, .13], [.28, .3, .13], 0, .35), E([-.72, 1.24, -.13], [.28, .3, .13], 0, .35),
      E([-.9, 1.33, 0], [.14, .21, .18]), E([-.1, 1.08, 0], [.47, .14, .21]),
      E([.5, 1.12, .09], [.1, .12, .09]), E([.5, 1.12, -.09], [.1, .12, .09]),
      E([-.62, 1.03, .16], [.2, .2, .09], 0, .3), E([-.62, 1.03, -.16], [.2, .2, .09], 0, .3),
      C([-.88, 1.47, 0], [-1.0, 1.41, 0], .068, .05, 3),
      // encolure
      C([.36, 1.38, 0], [.9, 1.86, 0], .27, .13, 1, .62), C([.42, 1.62, 0], [.95, 1.98, 0], .095, .055, 1, .55), C([.54, 1.24, 0], [.97, 1.73, 0], .11, .075, 1, .7),
      // tête
      E([1.0, 1.93, 0], [.13, .11, .105], 2), E([1.02, 1.8, 0], [.165, .12, .1], 2, -.8), C([1.05, 1.88, 0], [1.28, 1.64, 0], .09, .072, 2, .88),
      E([1.3, 1.6, 0], [.09, .083, .074], 2, -.7), E([1.33, 1.55, 0], [.058, .04, .056], 2, -.7),
      E([1.08, 1.915, .08], [.04, .03, .03], 2), E([1.08, 1.915, -.08], [.04, .03, .03], 2),
      // ganaches (joues larges et plates) et menton : une tête moins « tube »
      E([1.0, 1.79, .065], [.11, .095, .05], 2, -.75), E([1.0, 1.79, -.065], [.11, .095, .05], 2, -.75), E([1.26, 1.555, 0], [.05, .032, .045], 2, -.6),
    ];
    // jambes (gauche z>0, droite z<0)
    for (const [s, idF, idH] of [[1, 4, 6], [-1, 5, 7]]) {
      const zf = .135 * s, zh = .145 * s;
      P.push(C([.48, 1.1, zf], [.46, .63, zf], .085, .056, idF, .85), E([.475, .9, zf], [.085, .19, .075], idF),
        E([.46, .575, zf], [.058, .066, .052], idF), C([.46, .55, zf], [.465, .27, zf], .042, .04, idF, .85), C([.435, .52, zf], [.44, .29, zf], .026, .024, idF),
        E([.462, .225, zf], [.064, .058, .052], idF), E([.41, .2, zf], [.03, .03, .028], idF), C([.47, .21, zf], [.51, .105, zf], .042, .047, idF), E([.515, .088, zf], [.058, .022, .054], idF));
      P.push(C([-.72, 1.0, zh], [-.86, .67, zh], .1, .06, idH, .8), E([-.78, .86, zh], [.1, .18, .075], idH, .5),
        E([-.87, .62, zh], [.065, .075, .055], idH), E([-.94, .665, zh], [.035, .035, .03], idH), C([-.87, .58, zh], [-.86, .27, zh], .045, .04, idH, .85), C([-.9, .55, zh], [-.89, .29, zh], .026, .024, idH),
        E([-.86, .225, zh], [.064, .058, .052], idH), E([-.91, .2, zh], [.03, .03, .028], idH), C([-.855, .21, zh], [-.82, .105, zh], .042, .047, idH), E([-.815, .088, zh], [.058, .022, .054], idH));
    }
    const N = [E([1.37, 1.6, .04], [.016, .026, .014]), E([1.37, 1.6, -.04], [.016, .026, .014]), E([1.35, 1.54, 0], [.03, .006, .04], 0, -.7)];
    return { prims: P, negs: N, k: .07, kn: .012, min: [-1.12, .06, -.42], max: [1.46, 2.12, .42], h, smooth: 1 };
  }
  // Jockey en position de course (accroupi sur les étriers), mains aux rênes. Régions :
  // 0 casaque (motif), 1 manches, 2 culotte blanche, 3 bottes, 4 peau, 7 gants, 8 revers de botte,
  // 10 bras gauche (manche), 11 bras droit (manche), 12 main gauche, 13 main droite — les bras sont pondérés sur leurs os.
  function JOCKEY_SPEC(h) {
    const E = (c, r, id = 0, rz = 0, ry = 0) => ({ e: 1, c, r, id, rz, ry }), C = (a, b, ra, rb, id = 0, zs = 1) => ({ a, b, ra, rb, id, zs });
    const P = [
      // buste penché, dos plat
      C([-.1, 1.99, 0], [.24, 2.07, 0], .15, .13, 0, 1.25), E([.02, 2.0, 0], [.2, .1, .17], 0, .15), E([.24, 2.06, 0], [.09, .085, .19], 0),
      E([-.1, 1.94, 0], [.15, .115, .155], 2), E([.1, 1.93, 0], [.12, .07, .12], 0, .2),
      // cou, tête (le casque, la visière et les lunettes sont des pièces rigides posées sur l'os de la tête)
      C([.3, 2.1, 0], [.38, 2.15, 0], .05, .045, 4), E([.43, 2.158, 0], [.08, .09, .074], 4), E([.483, 2.098, 0], [.04, .03, .045], 4),
    ];
    for (const [s, arm, hand] of [[1, 10, 12], [-1, 11, 13]]) P.push(
      // bras : épaule -> coude -> poignet, gant
      C([.26, 2.05, .16 * s], [.43, 1.94, .14 * s], .052, .043, arm), C([.43, 1.94, .14 * s], [.61, 1.875, .08 * s], .043, .034, arm), E([.645, 1.865, .07 * s], [.042, .036, .036], hand),
      // cuisse, genou, jambe (botte), pied dans l'étrier
      C([-.08, 1.95, .12 * s], [.18, 1.85, .2 * s], .08, .064, 2), E([.19, 1.84, .21 * s], [.06, .058, .052], 2),
      C([.18, 1.83, .21 * s], [.12, 1.72, .235 * s], .058, .052, 8), C([.12, 1.72, .235 * s], [.05, 1.62, .25 * s], .052, .042, 3), C([.04, 1.6, .255 * s], [.16, 1.575, .255 * s], .036, .032, 3));
    return { prims: P, negs: [], k: .035, kn: .01, min: [-.32, 1.5, -.34], max: [.74, 2.36, .34], h, smooth: 1 };
  }
  // Pondérations de peau (4 os au plus par sommet) calculées d'après la région sculptée et la position au repos.
  // Os du cheval : 0 corps, 1 encolure, 2 tête, 3-5 queue, 6-8 antérieur gauche (bras, canon, paturon), 9-11 antérieur droit, 12-14 postérieur gauche, 15-17 postérieur droit.
  function HORSE_WEIGHTS(pos, reg) {
    const n = reg.length, si = new Uint16Array(n * 4), sw = new Float32Array(n * 4), ss = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t) };
    const LEG = { 4: [6, 1.1, .575], 5: [9, 1.1, .575], 6: [12, 1.05, .62], 7: [15, 1.05, .62] };
    const ax = .42, ay = 1.42, bx = .97, by = 1.95, L2 = (bx - ax) ** 2 + (by - ay) ** 2;
    for (let v = 0; v < n; v++) {
      const x = pos[v * 3], y = pos[v * 3 + 1], r = reg[v], W = {};
      const add = (b, w) => { if (w > 1e-4) W[b] = (W[b] || 0) + w };
      if (LEG[r]) {
        const [b0, top, knee] = LEG[r], fet = .225, wb = ss(top - .12, top + .08, y), rest = 1 - wb, t1 = ss(knee + .04, knee - .04, y), t2 = ss(fet + .035, fet - .035, y);
        add(0, wb); add(b0, rest * (1 - t1)); add(b0 + 1, rest * t1 * (1 - t2)); add(b0 + 2, rest * t1 * t2)
      } else if (r === 1 || r === 2) {
        const t = ((x - ax) * (bx - ax) + (y - ay) * (by - ay)) / L2, wn = ss(.0, .3, t), wh = ss(.9, 1.06, t);
        add(0, 1 - wn); add(1, wn * (1 - wh)); add(2, wn * wh)
      } else if (r === 3) { const w = ss(-.9, -.99, x); add(0, 1 - w); add(3, w) }
      else add(0, 1);
      const L = Object.entries(W).sort((a, b) => b[1] - a[1]).slice(0, 4), s = L.reduce((a, e) => a + e[1], 0) || 1;
      L.forEach(([b, w], k) => { si[v * 4 + k] = +b; sw[v * 4 + k] = w / s })
    }
    return { si, sw }
  }
  // Os du jockey : 0 bassin, 1 buste, 2 tête, 3 bras gauche, 4 avant-bras gauche, 5 bras droit, 6 avant-bras droit.
  function JOCKEY_WEIGHTS(pos, reg) {
    const n = reg.length, si = new Uint16Array(n * 4), sw = new Float32Array(n * 4), ss = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t) };
    for (let v = 0; v < n; v++) {
      const x = pos[v * 3], y = pos[v * 3 + 1], r = reg[v], W = {}; const add = (b, w) => { if (w > 1e-4) W[b] = (W[b] || 0) + w };
      if (r >= 10) { const left = r === 10 || r === 12, up = left ? 3 : 5, t = ss(.39, .47, x), sh = ss(.2, .31, x); add(1, 1 - sh); add(up, sh * (1 - t)); add(up + 1, sh * t) }
      else if (r === 4 || r === 5 || r === 6) { const t = ss(.3, .38, x); add(1, 1 - t); add(2, t) }
      else if (r === 2 || r === 3 || r === 8) add(0, 1);
      else { const t = ss(-.04, .1, x); add(0, 1 - t); add(1, t) }
      const L = Object.entries(W).sort((a, b) => b[1] - a[1]).slice(0, 4), s = L.reduce((a, e) => a + e[1], 0) || 1;
      L.forEach(([b, w], k) => { si[v * 4 + k] = +b; sw[v * 4 + k] = w / s })
    }
    return { si, sw }
  }
  // Crinière et toupet : mèches posées sur la surface sculptée (projection sur le champ de distance), calculées avec le maillage.
  function HORSE_MANE(f) {
    const grad = (x, y, z) => { const e = .003; return [(f(x + e, y, z) - f(x - e, y, z)) / (2 * e), (f(x, y + e, z) - f(x, y - e, z)) / (2 * e), (f(x, y, z + e) - f(x, y, z - e)) / (2 * e)] };
    const proj = p => { for (let i = 0; i < 6; i++) { const d = f(p[0], p[1], p[2]), g = grad(p[0], p[1], p[2]), L = g[0] * g[0] + g[1] * g[1] + g[2] * g[2] || 1; p = [p[0] - d * g[0] / L, p[1] - d * g[1] / L, p[2] - d * g[2] / L] } return p };
    const nrm = p => { const g = grad(p[0], p[1], p[2]), L = Math.hypot(g[0], g[1], g[2]) || 1; return [g[0] / L, g[1] / L, g[2] / L] };
    let s = 11; const r = () => (s = (s * 16807) % 2147483647) / 2147483647;
    const A = [.4, 1.71], B = [.98, 2.04], d = [B[0] - A[0], B[1] - A[1]], dl = Math.hypot(d[0], d[1]), dx = d[0] / dl, dy = d[1] / dl, nx = -dy, ny = dx, S = [], N = 64, K = 6;
    for (let i = 0; i < N; i++) {
      const t = (i + r() * .7) / N, cx = A[0] + d[0] * t, cy = A[1] + d[1] * t, q = [cx + nx * .22, cy + ny * .22, 0];
      for (let k = 0; k < 140 && f(q[0], q[1], q[2]) > 0; k++) { q[0] -= nx * .004; q[1] -= ny * .004 }
      const Rc = .13 - .05 * t, L = (1.2 + r() * .4) * (1 - .3 * t), c = [q[0] - nx * Rc, q[1] - ny * Rc, 0], p = [], w = [];
      for (let k = 0; k <= K; k++) {
        const fk = k / K, th = .05 + fk * L; let P = proj([c[0] + nx * Math.cos(th) * Rc, c[1] + ny * Math.cos(th) * Rc, -Math.sin(th) * Rc]); const no = nrm(P), off = .006 + fk * fk * .028 + r() * .004;
        p.push([P[0] + no[0] * off - fk * fk * .04, P[1] + no[1] * off, P[2] + no[2] * off]); w.push([dx * .06 * (1 - fk * .3), dy * .06 * (1 - fk * .3), 0])
      }
      S.push({ p, w, root: [q[0], q[1]] })
    }
    for (let i = 0; i < 7; i++) {
      const z = (i - 3) * .011, p = [], w = [];
      for (let k = 0; k <= 4; k++) { const fk = k / 4; let P = proj([1.0 + fk * .13, 2.07 - fk * .15, z * (1 + fk * .8)]); const no = nrm(P), o = .008 + fk * .007; p.push([P[0] + no[0] * o, P[1] + no[1] * o, P[2] + no[2] * o]); w.push([0, 0, .044 * (1 - fk * .4)]) }
      S.push({ p, w, root: null })
    }
    return S
  }

  const LOD_H = [[.018, .014], [.038, .03], [.06, .045]];
  // ---------- calcul des maillages (Worker, sinon fil principal) ----------
  const FNS = [SCULPT, HORSE_SPEC, JOCKEY_SPEC, HORSE_WEIGHTS, JOCKEY_WEIGHTS, HORSE_MANE];
  function compute(lod) {
    const [hh, hj] = LOD_H[lod], hs = HORSE_SPEC(hh), H = SCULPT(hs), J = SCULPT(JOCKEY_SPEC(hj));
    return { H: Object.assign(H, HORSE_WEIGHTS(H.pos, H.reg)), J: Object.assign(J, JOCKEY_WEIGHTS(J.pos, J.reg)), M: HORSE_MANE(hs.f) }
  }
  let worker = null, jobs = {};
  try {
    const src = FNS.map(f => f.toString()).join('\n') + '\nconst LOD_H=' + JSON.stringify(LOD_H) + ';\n' + compute.toString() +
      '\nonmessage=e=>{const r=compute(e.data.lod),t=[];for(const m of[r.H,r.J])for(const k in m)if(m[k]&&m[k].buffer)t.push(m[k].buffer);postMessage({lod:e.data.lod,r},t)}';
    worker = new Worker(URL.createObjectURL(new Blob([src], { type: 'text/javascript' })));
    worker.onmessage = e => { const J = jobs[e.data.lod]; if (J) J.res(e.data.r) };
    worker.onerror = () => { worker = null; for (const l in jobs) if (!jobs[l].done) jobs[l].res(compute(+l)) };
  } catch (e) { worker = null }
  const DATA = {};
  function ready(lod = 0) {
    if (jobs[lod]) return jobs[lod].p;
    const J = jobs[lod] = {}; J.p = new Promise(res => { J.res = r => { J.done = true; DATA[lod] = { H: geo(r.H), J: geo(r.J), M: r.M }; res(DATA[lod]) } });
    if (worker) worker.postMessage({ lod }); else setTimeout(() => J.res(compute(lod)), 0);
    return J.p
  }
  // ---------- géométries THREE ----------
  function geo(m) {
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(m.pos, 3)); g.setAttribute('normal', new THREE.BufferAttribute(m.nor, 3));
    g.setAttribute('ao', new THREE.BufferAttribute(m.ao, 1)); g.setAttribute('reg', new THREE.BufferAttribute(new Float32Array(m.reg), 1));
    g.setAttribute('reg2', new THREE.BufferAttribute(new Float32Array(m.reg2), 1)); g.setAttribute('rt', new THREE.BufferAttribute(m.rt, 1));
    g.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(m.si, 4)); g.setAttribute('skinWeight', new THREE.BufferAttribute(m.sw, 4)); g.setIndex(new THREE.BufferAttribute(m.idx, 1)); g.computeBoundingSphere(); return g
  }
  const V = (x, y, z = 0) => new THREE.Vector3(x, y, z);
  // squelettes : positions au repos (repère du cheval) et parenté
  const HB = [[0, 1.3, 0, -1], [.5, 1.45, 0, 0], [.97, 1.95, 0, 1], [-.99, 1.47, 0, 0], [-1.1, 1.2, 0, 3], [-1.16, .9, 0, 4]];
  for (const [x0, top, knee, z] of [[.48, 1.1, [.46, .575], .135], [.48, 1.1, [.46, .575], -.135], [-.7, 1.05, [-.87, .62], .145], [-.7, 1.05, [-.87, .62], -.145]]) {
    const b = HB.length; HB.push([x0, top, z, 0], [knee[0], knee[1], z, b], [knee[0] + (x0 > 0 ? .002 : .01), .225, z, b + 1])
  }
  const JB = [[-.08, 1.9, 0, -1], [.1, 1.98, 0, 0], [.36, 2.12, 0, 1], [.26, 2.05, .16, 1], [.43, 1.94, .14, 3], [.26, 2.05, -.16, 1], [.43, 1.94, -.14, 5]];
  function bones(list) { const B = list.map(([x, y, z]) => { const b = new THREE.Bone(); b.position.set(x, y, z); return b }); list.forEach(([, , , p], i) => { if (p >= 0) { B[p].add(B[i]); B[i].position.sub(V(list[p][0], list[p][1], list[p][2])) } }); return B }
  // ---------- crins : cartes texturées (crinière couchée à droite, toupet, queue en gerbe) ----------
  const hairTex = {};
  function hairTexture(solid = 0) {
    if (hairTex[solid]) return hairTex[solid]; const c = document.createElement('canvas'); c.width = 128; c.height = 512; const x = c.getContext('2d'); x.clearRect(0, 0, 128, 512);
    if (solid) { x.fillStyle = '#7a7a7a'; x.fillRect(0, 0, 128, 512) }
    let s = 7; const r = () => (s = (s * 16807) % 2147483647) / 2147483647;
    for (let i = 0; i < 170; i++) {
      const x0 = 4 + r() * 120, len = 512 * (.62 + r() * .38), w = .8 + r() * 1.8, sh = 150 + r() * 105 | 0, sway = (r() - .5) * 14;
      const g = x.createLinearGradient(0, 0, 0, len); g.addColorStop(0, `rgba(${sh},${sh},${sh},1)`); g.addColorStop(.75, `rgba(${sh},${sh},${sh},.95)`); g.addColorStop(1, `rgba(${sh},${sh},${sh},0)`);
      x.strokeStyle = g; x.lineWidth = w; x.beginPath(); x.moveTo(x0, 0); x.bezierCurveTo(x0 + sway, len * .35, x0 - sway, len * .7, x0 + sway * .6, len); x.stroke()
    }
    const t = hairTex[solid] = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; if (solid) { t.wrapS = THREE.RepeatWrapping; t.repeat.set(3, 1) } return t
  }
  // bande de carte : points p[i] (Vector3), direction de largeur w[i] (Vector3, déjà mise à l'échelle), os / poids par point
  function strips(list) {
    const pos = [], uv = [], nor = [], si = [], sw = [], idx = [];
    for (const S of list) {
      const n = S.p.length, b0 = pos.length / 3;
      for (let i = 0; i < n; i++) {
        const t = S.p[Math.min(n - 1, i + 1)].clone().sub(S.p[Math.max(0, i - 1)]).normalize(), nn = new THREE.Vector3().crossVectors(S.w[i], t).normalize();
        for (const k of [-.5, .5]) { const q = S.p[i].clone().addScaledVector(S.w[i], k); pos.push(q.x, q.y, q.z); uv.push(S.u0 + (k + .5) * S.du, i / (n - 1)); nor.push(nn.x, nn.y, nn.z); si.push(...S.b[i][0]); sw.push(...S.b[i][1]) }
      }
      for (let i = 0; i < n - 1; i++) { const a = b0 + i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2) }
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    g.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(si, 4)); g.setAttribute('skinWeight', new THREE.Float32BufferAttribute(sw, 4)); g.setIndex(idx); g.computeBoundingSphere(); return g
  }
  let HAIR_GEO = null;
  const ss = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t) };
  function hairGeo(M) {
    if (HAIR_GEO) return HAIR_GEO; let s = 3; const r = () => (s = (s * 16807) % 2147483647) / 2147483647;
    const neckW = (x, y) => { const t = ((x - .42) * .55 + (y - 1.42) * .53) / (.55 * .55 + .53 * .53), wn = ss(0, .3, t), wh = ss(.9, 1.06, t); return [[0, 1, 2, 0], [1 - wn, wn * (1 - wh), wn * wh, 0]] };
    // crinière et toupet : mèches posées sur l'encolure par le Worker
    const mane = M.map(S => { const bw = S.root ? neckW(S.root[0], S.root[1]) : [[2, 0, 0, 0], [1, 0, 0, 0]]; return { p: S.p.map(a => V(...a)), w: S.w.map(a => V(...a)), b: S.p.map(() => bw), u0: r() * .6, du: .4 } });
    // queue : un fourreau de crins plein (volume) et une gerbe de mèches qui s'évase au bout
    const curve = new THREE.CatmullRomCurve3([V(-.93, 1.465), V(-1.04, 1.33), V(-1.12, 1.1), V(-1.16, .86), V(-1.185, .62)]), CL = curve.getLength();
    const at = f => f <= 1 ? curve.getPoint(f) : curve.getPoint(1).addScaledVector(curve.getTangent(1), (f - 1) * CL);
    const rad = f => .03 + .046 * Math.sin(Math.PI * .5 * Math.min(1, f / .45)) * (1 - .5 * Math.max(0, (f - .5) / .5));
    const tw = y => { const b1 = ss(1.4, 1.1, y), b2 = ss(1.05, .75, y); return [[3, 4, 5, 0], [1 - b1, b1 * (1 - b2), b1 * b2, 0]] };
    const NS = 18, cp = [], cr = []; for (let i = 0; i <= NS; i++) { const f = i / NS; cp.push(at(f)); cr.push([rad(f) * 1.1, rad(f) * .85]) }
    const core = loft(cp, cr, 14, [0, Math.PI * 2]), pa = core.attributes.position, csi = [], csw = [];
    for (let v = 0; v < pa.count; v++) { const w = tw(pa.getY(v)); csi.push(...w[0]); csw.push(...w[1]) }
    core.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(csi, 4)); core.setAttribute('skinWeight', new THREE.Float32BufferAttribute(csw, 4));
    const tail = [], Z = V(0, 0, 1);
    for (let i = 0; i < 46; i++) {
      const a = r() * Math.PI * 2, f0 = .08 + r() * .38, f1 = .95 + r() * .2, spread = .7 + r() * .7, pts = [], ws = [], bw = [];
      for (let k = 0; k <= 8; k++) {
        const f = f0 + (f1 - f0) * k / 8, c = at(f), T = curve.getTangent(Math.min(1, f)), side = Z.clone().addScaledVector(T, -T.z).normalize(), up = new THREE.Vector3().crossVectors(T, side), R = rad(Math.min(1, f)) * (.75 + .3 * r()) + Math.max(0, f - .5) * .07 * spread;
        const q = c.addScaledVector(side, Math.cos(a) * R * 1.1).addScaledVector(up, Math.sin(a) * R * .85); pts.push(q); ws.push(side.clone().multiplyScalar(-Math.sin(a) * .08).addScaledVector(up, Math.cos(a) * .065).multiplyScalar(1 - k / 8 * .25)); bw.push(tw(q.y))
      }
      tail.push({ p: pts, w: ws, b: bw, u0: r() * .6, du: .4 })
    }
    return HAIR_GEO = { mane: strips(mane), tail: strips(tail), core }
  }
  // tube lissé le long d'une courbe (rayons latéral / vertical par point)
  function loft(pts, rads, seg, arc) {
    const pos = [], uv = [], idx = [], n = pts.length, Z = V(0, 0, 1), X = V(1, 0, 0);
    for (let i = 0; i < n; i++) { const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)], t = b.clone().sub(a).normalize(); let side = Z.clone().addScaledVector(t, -t.dot(Z)); if (side.lengthSq() < .01) side = X.clone().addScaledVector(t, -t.dot(X)); side.normalize(); const up = new THREE.Vector3().crossVectors(t, side).normalize();
      for (let j = 0; j <= seg; j++) { const ang = arc[0] + j / seg * (arc[1] - arc[0]), p = pts[i].clone().addScaledVector(side, Math.cos(ang) * rads[i][0]).addScaledVector(up, Math.sin(ang) * rads[i][1]); pos.push(p.x, p.y, p.z); uv.push(j / seg, i / (n - 1)) } }
    const R = seg + 1; for (let i = 0; i < n - 1; i++) for (let j = 0; j < seg; j++) { const a = i * R + j; idx.push(a, a + 1, a + R, a + 1, a + R + 1, a + R) }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals(); return g
  }
  // ---------- petites pièces : sabots, yeux, oreilles, harnachement ----------
  // fusion de géométries (position, normale ; attributs constants facultatifs, ex. { ao: .9, reg: 2 } pour le pelage)
  function mergeG(list, extra) {
    const P = [], N = [], I = []; let base = 0;
    for (const g of list) { const p = g.attributes.position, n = g.attributes.normal; for (let i = 0; i < p.count; i++) { P.push(p.getX(i), p.getY(i), p.getZ(i)); N.push(n.getX(i), n.getY(i), n.getZ(i)) } if (g.index) for (let i = 0; i < g.index.count; i++) I.push(base + g.index.getX(i)); else for (let i = 0; i < p.count; i++) I.push(base + i); base += p.count }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3)); g.setIndex(I);
    for (const k in extra || {}) g.setAttribute(k, new THREE.Float32BufferAttribute(new Float32Array(base).fill(extra[k]), 1)); g.computeBoundingSphere(); return g
  }
  let PARTS = null;
  function parts() {
    if (PARTS) return PARTS;
    const hoof = new THREE.LatheGeometry([new THREE.Vector2(0, 0), new THREE.Vector2(.066, 0), new THREE.Vector2(.064, .03), new THREE.Vector2(.056, .075), new THREE.Vector2(.05, .085), new THREE.Vector2(0, .085)], 16);
    const ear = new THREE.LatheGeometry([new THREE.Vector2(0, 0), new THREE.Vector2(.034, .01), new THREE.Vector2(.036, .05), new THREE.Vector2(.026, .1), new THREE.Vector2(.008, .145), new THREE.Vector2(0, .15)], 10, 0, Math.PI * 1.35).scale(1, 1, .6);
    const smooth = (ctrl, steps = 5) => { const c = new THREE.CatmullRomCurve3(ctrl.map(p => p[0]), false, 'centripetal'), n = (ctrl.length - 1) * steps + 1, pts = c.getPoints(n - 1), r = []; for (let i = 0; i < n; i++) { const f = i / (n - 1) * (ctrl.length - 1), k = Math.min(ctrl.length - 2, Math.floor(f)), u = f - k, s = u * u * (3 - 2 * u); r.push([ctrl[k][1] + (ctrl[k + 1][1] - ctrl[k][1]) * s, ctrl[k][2] + (ctrl[k + 1][2] - ctrl[k][2]) * s]) } return [pts, r] };
    const tube = (ctrl, seg, arc = [0, Math.PI * 2]) => { const [p, r] = smooth(ctrl); return loft(p, r, seg, arc) };
    // pièces rigides regroupées par os et par matière (un seul appel de dessin chacune), positions relatives à l'os au repos
    const T = (g, x, y, z, rx = 0, ry = 0, rz = 0, sx = 1, sy = 1, sz = 1) => g.clone().applyMatrix4(new THREE.Matrix4().compose(V(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz)), V(sx, sy, sz)));
    const both = f => [f(1), f(-1)], HX = .97, HY = 1.95, JX = .36, JY = 2.12;
    const nose = new THREE.TorusGeometry(.086, .012, 6, 22), brow = new THREE.TorusGeometry(.1, .011, 6, 22), cheek = new THREE.CylinderGeometry(.008, .008, 1, 5), bit = new THREE.TorusGeometry(.026, .006, 6, 14), blink = new THREE.SphereGeometry(.05, 12, 8, 0, Math.PI * 2, 0, Math.PI * .5);
    const helmet = new THREE.SphereGeometry(1, 28, 14, 0, Math.PI * 2, 0, Math.PI * .58).scale(.112, .1, .104), peak = new THREE.CylinderGeometry(1, 1, 1, 16, 1, false, 0, Math.PI).scale(.075, .007, .095), pom = new THREE.SphereGeometry(.018, 10, 8);
    const lens = new THREE.SphereGeometry(1, 12, 8).scale(.012, .02, .026), band = new THREE.TorusGeometry(1, .08, 5, 26).rotateX(Math.PI / 2).scale(.084, .084, .078), iron = new THREE.TorusGeometry(.035, .008, 6, 12), strap = new THREE.CylinderGeometry(.007, .007, 1, 5);
    const eye = new THREE.SphereGeometry(.027, 14, 10), earA = s => T(ear, 1.0 - HX, 2.06 - HY, .06 * s, s * .35, s * (Math.PI * .5 - .25), -.25);
    return PARTS = { hoof,
      head: {
        leather: mergeG([T(nose, 1.255 - HX, 1.675 - HY, 0, 0, Math.PI / 2, .72, 1, .95, 1.06), T(brow, 1.02 - HX, 1.995 - HY, 0, 0, Math.PI / 2, .35, 1.03, .55, 1), ...both(s => T(cheek, 1.13 - HX, 1.84 - HY, .083 * s, 0, 0, .9, 1, .33, 1))]),
        steel: mergeG(both(s => T(bit, 1.31 - HX, 1.6 - HY, .066 * s))), eye: mergeG(both(s => T(eye, 1.1 - HX, 1.918 - HY, .094 * s))),
        ear: mergeG(both(s => earA(s)), { ao: .9, reg: 2 }), earIn: mergeG(both(s => T(ear, 1.0 - HX, 2.063 - HY, .058 * s, s * .35, s * (Math.PI * .5 - .25), -.25, .82, .9, .7))),
        blink: mergeG(both(s => T(blink, 1.08 - HX, 1.93 - HY, .1 * s, s * -Math.PI / 2))) },
      cap: mergeG([T(helmet, .418 - JX, 2.19 - JY, 0, 0, 0, .18), T(peak, .505 - JX, 2.186 - JY, 0, 0, 0, -.1), T(pom, .4 - JX, 2.29 - JY, 0)]),
      glass: mergeG([...both(s => T(lens, .508 - JX, 2.168 - JY, .031 * s)), T(band, .43 - JX, 2.168 - JY, 0)]),
      irons: mergeG(both(s => T(iron, .1, 1.56, .26 * s, 0, Math.PI / 2))), straps: mergeG(both(s => T(strap, .03, 1.625, .255 * s, 0, 0, .35, 1, .13, 1))),
      cloth: tube([[V(-.34, 1.36), .33, .345], [V(-.1, 1.32), .337, .372], [V(.16, 1.32), .327, .377]], 30, [-.28, Math.PI + .28]),
      saddle: tube([[V(-.17, 1.68), .14, .03], [V(0, 1.668), .15, .035], [V(.13, 1.695), .12, .03]], 12),
      girth: new THREE.TorusGeometry(1, .05, 6, 44).rotateY(Math.PI / 2).scale(1, .335, .292),
      rein: new THREE.CylinderGeometry(.007, .007, 1, 5).translate(0, .5, 0).rotateZ(-Math.PI / 2),
      whip: new THREE.CylinderGeometry(.005, .009, .62, 5).translate(0, -.31, 0) }
  }
  // ---------- matériaux ----------
  const NOISE3 = 'float h3(vec3 p){return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453);}float n3(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(mix(h3(i),h3(i+vec3(1,0,0)),f.x),mix(h3(i+vec3(0,1,0)),h3(i+vec3(1,1,0)),f.x),f.y),mix(mix(h3(i+vec3(0,0,1)),h3(i+vec3(1,0,1)),f.x),mix(h3(i+vec3(0,1,1)),h3(i+vec3(1,1,1)),f.x),f.y),f.z);}';
  // pelage : robe, extrémités sombres, balzanes (hauteur par jambe), liste / étoile, pommelures, bout du nez, poil fin, occlusion
  function coatMat(col, dark, o) {
    // robe lustrée d'un pur-sang : vernis léger (clearcoat) qui prend les reflets du ciel, reflet de poil (sheen) et relief musculaire (bosselage procédural)
    const m = new THREE.MeshPhysicalMaterial({ color: col, roughness: .42, sheen: .8, sheenRoughness: .38, sheenColor: new THREE.Color(0xfff2dc), clearcoat: .32, clearcoatRoughness: .36, envMapIntensity: 1.15 });
    m.onBeforeCompile = s => {
      Object.assign(s.uniforms, { uDark: { value: dark }, uPts: { value: o.points ? 1 : 0 }, uDap: { value: o.dapple ? 1 : 0 }, uSocks: { value: new THREE.Vector4(...o.socks) }, uBlaze: { value: o.blaze } });
      s.vertexShader = 'attribute float ao;attribute float reg;varying float vAo;varying float vReg;varying vec3 vRest;varying vec3 vRestN;\n' + s.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvAo=ao;vReg=reg;vRest=position;vRestN=normal;');
      s.fragmentShader = 'uniform vec3 uDark;uniform float uPts,uDap,uBlaze;uniform vec4 uSocks;varying float vAo;varying float vReg;varying vec3 vRest;varying vec3 vRestN;\n' + NOISE3 + '\n' + s.fragmentShader.replace('#include <color_fragment>', `#include <color_fragment>
      {vec3 P=vRest;float hair=n3(P*vec3(40.,170.,40.))*.5+n3(P*9.)*.5;int r=int(vReg+.5);
       float leg=r>=4?1.:0.;float kneeY=r>=6?.66:.61;float pts=leg*smoothstep(kneeY+.1,kneeY-.12,P.y)*uPts;
       float top=smoothstep(1.05,1.62,P.y);diffuseColor.rgb*=mix(.88,1.07,top)*mix(.93,1.05,hair);
       if(uDap>.5){float d=smoothstep(.48,.7,n3(P*12.));diffuseColor.rgb=mix(diffuseColor.rgb,diffuseColor.rgb*1.32,d*.6*(1.-pts));}
       diffuseColor.rgb=mix(diffuseColor.rgb,uDark,pts);
       float muz=(r==2)?smoothstep(1.22,1.33,P.x):0.;diffuseColor.rgb=mix(diffuseColor.rgb,uDark*1.3+vec3(.02),muz*.55);
       float sock=0.;if(r>=4){float hs=r==4?uSocks.x:r==5?uSocks.y:r==6?uSocks.z:uSocks.w;sock=smoothstep(hs+.012,hs-.012,P.y+(n3(P*60.)-.5)*.03);}
       float bl=0.;if(r==2&&uBlaze>.5){vec2 a=vec2(1.02,2.0),b=vec2(1.36,1.57);vec2 d=b-a;float t=clamp(dot(P.xy-a,d)/dot(d,d),0.,1.);float front=dot(vRestN.xy,normalize(vec2(d.y,-d.x)));
        float w=uBlaze>1.5?.028+t*.018:(t<.2?.03:0.);bl=smoothstep(w+.006,w-.006,abs(P.z))*smoothstep(.2,.45,front)*(uBlaze>1.5?step(t,.93):1.);}
       diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.93,.91,.87),max(sock,bl));
       diffuseColor.rgb*=pow(vAo,1.25);}`).replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
      {vec3 P=vRest;float lg=mix(.3,1.,smoothstep(.85,1.15,P.y));
       float hB=(n3(P*vec3(6.,7.5,6.))*.05+n3(P*17.)*.01)*lg;vec2 dH=vec2(dFdx(hB),dFdy(hB));
       vec3 sX=dFdx(-vViewPosition),sY=dFdy(-vViewPosition),R1=cross(sY,normal),R2=cross(normal,sX);float fD=dot(sX,R1);
       normal=normalize(abs(fD)*normal-sign(fD)*(dH.x*R1+dH.y*R2));}`)
    }; return m
  }
  // jockey : casaque à motif, couleur par région fondue d'un sommet à l'autre (frontières lisses), bras pondérés
  function jockeyMat(tex, cols) {
    // soie satinée (reflet doux qui glisse sur les plis) sauf en qualité basse
    const m = settings.level() === 'basse' ? new THREE.MeshStandardMaterial({ map: tex, roughness: .45, metalness: .02 }) : new THREE.MeshPhysicalMaterial({ map: tex, roughness: .45, metalness: .02, sheen: .7, sheenRoughness: .32, sheenColor: new THREE.Color(0xffffff), envMapIntensity: 1.1 });
    m.onBeforeCompile = s => {
      s.uniforms.uCols = { value: cols };
      s.vertexShader = `attribute float ao;attribute float reg;attribute float reg2;attribute float rt;uniform vec3 uCols[9];varying float vAo;varying vec3 vCol;varying float vSilk;varying float vRough;varying vec3 vRest;
       int jr(float x){int r=int(x+.5);return r>=12?7:r>=10?1:r;}vec3 jc(int r){vec3 c=uCols[0];for(int i=1;i<9;i++){if(i==r)c=uCols[i];}return c;}float jro(int r){return r==3?.25:r==4?.62:r==2?.55:r==7?.5:.4;}
` + s.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
       vAo=ao;int r1=jr(reg),r2=jr(reg2);float s1=r1==0?1.:0.,s2=r2==0?1.:0.;vCol=mix(jc(r1)*(1.-s1),jc(r2)*(1.-s2),rt);vSilk=mix(s1,s2,rt);vRough=mix(jro(r1),jro(r2),rt);vRest=position;`);
      s.fragmentShader = 'varying float vAo;varying vec3 vCol;varying float vSilk;varying float vRough;varying vec3 vRest;\n' + s.fragmentShader.replace('#include <map_fragment>', `vec4 sT=texture2D(map,vec2(.5+vRest.z/.42,(vRest.x+.14)/.46));diffuseColor.rgb=(vCol+vSilk*sT.rgb)*pow(vAo,1.2);`)
        .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\nroughnessFactor=vRough;')
        .replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
        {vec3 P=vRest;float f=sin(P.x*62.+sin(P.z*25.)*2.2+sin(P.y*30.)*1.6)*.5+.5;float hB=f*f*.0045*(1.-vSilk*.3)*smoothstep(.07,.12,distance(P,vec3(.44,2.15,0.)));vec2 dH=vec2(dFdx(hB),dFdy(hB));
         vec3 sX=dFdx(-vViewPosition),sY=dFdy(-vViewPosition),R1=cross(sY,normal),R2=cross(normal,sX);float fD=dot(sX,R1);normal=normalize(abs(fD)*normal-sign(fD)*(dH.x*R1+dH.y*R2));}`)
    }; return m
  }
  const HAIR = { bai: 0x120c09, noir: 0x0b0a0a, alezan: 0x6a2c12, gris: 0x55555a, baibrun: 0x0e0a08, palomino: 0xefe2c0 };
  const POINTS = { bai: true, noir: true, baibrun: true, gris: true };
  const hexRGB = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  function silkTexture(liv) { const c = document.createElement('canvas'); c.width = c.height = 256; const x = c.getContext('2d'), img = x.createImageData(256, 256), m = hexRGB(liv.main), s = hexRGB(liv.second), pat = LIVERY.pattern;
    for (let j = 0; j < 256; j++) for (let i = 0; i < 256; i++) { const u = i / 256, v = j / 256, alt = pat(liv.pattern, u, v), c2 = alt ? s : m, k = ((255 - j) * 256 + i) * 4, fold = .93 + .07 * Math.sin(u * 40 + v * 9); img.data[k] = c2[0] * fold; img.data[k + 1] = c2[1] * fold; img.data[k + 2] = c2[2] * fold; img.data[k + 3] = 255 }
    x.putImageData(img, 0, 0); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t }
  function clothTexture(liv, num) { const c = document.createElement('canvas'); c.width = 512; c.height = 128; const x = c.getContext('2d'); x.fillStyle = liv.main; x.fillRect(0, 0, 512, 128); x.fillStyle = liv.second; x.fillRect(0, 0, 512, 10); x.fillRect(0, 118, 512, 10);
    x.fillStyle = '#fff'; x.font = '64px "Russo One",sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; for (const cx of [128, 384]) { x.save(); x.translate(cx, 64); x.scale(cx < 256 ? 1 : -1, 1); x.fillText(String(num || 1), 0, 4); x.restore() }
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t }
  function coatColor(liv) { const i = Math.max(0, LIVERY.COATS.findIndex(c => c.id === liv.coat)), l = LIVERY.coatLut(i); return new THREE.Color().setRGB(l[0] / 255, l[1] / 255, l[2] / 255, THREE.SRGBColorSpace) }
  // balzanes et liste : tirées du nom (le même cheval garde ses marques partout)
  function marks(liv, seed) { let x = [...String(seed ?? liv.name ?? liv.main)].reduce((a, c) => (a * 31 + c.charCodeAt(0)) % 2147483647, 17) || 1; const r = () => (x = (x * 16807) % 2147483647) / 2147483647;
    const sock = () => r() < .32 ? .12 + r() * .2 : -1, blaze = r() < .3 ? 2 : r() < .45 ? 1 : 0; return { socks: [sock(), sock(), sock(), sock()], blaze } }
  // ---------- assemblage ----------
  // opt : number (tapis), blinkers (œillères), lod (0 gros plan, 1 course, 2 loin), free (cheval en liberté : ni jockey ni harnachement), seed (marques)
  function build(liv, opt = {}) {
    const root = new THREE.Group(), lod = opt.lod || 0; root.userData = { mats: [], texs: [], lod, pending: true, liv, free: !!opt.free };
    const go = D => { const u = root.userData; if (u.disposed) return; assemble(root, D, liv, opt); u.pending = false; if (u.want !== undefined && u.want !== lod) setLod(root, u.want); pose(root, u.p || 0, u.run ?? 0, 0, u.graze || 0) };
    if (DATA[lod]) go(DATA[lod]); else ready(lod).then(go); return root
  }
  // change le niveau de détail d'un cheval déjà construit (même squelette : seules les géométries du corps et du jockey changent)
  function setLod(root, lod) {
    const u = root.userData; u.want = lod; if (u.pending || u.lod === lod) return;
    const D = DATA[lod]; if (!D) { ready(lod).then(() => { if (!u.disposed && u.want === lod) setLod(root, lod) }); return }
    u.lod = lod; u.body.geometry = D.H; if (u.jm) u.jm.geometry = D.J
  }
  function assemble(root, D, liv, opt) {
    const P = parts(), HG = hairGeo(D.M), u = root.userData, mk = marks(liv, opt.seed), pts = POINTS[liv.coat], dk = new THREE.Color(HAIR[liv.coat] || 0x120c09), cc = coatColor(liv);
    const coat = coatMat(cc, pts ? dk : cc.clone().multiplyScalar(.62), { points: pts, dapple: liv.coat === 'gris', socks: mk.socks, blaze: mk.blaze });
    const hair = new THREE.MeshStandardMaterial({ color: HAIR[liv.coat] || 0x120c09, map: hairTexture(), alphaTest: .42, side: THREE.DoubleSide, roughness: .55 });
    const tailM = new THREE.MeshStandardMaterial({ color: HAIR[liv.coat] || 0x120c09, map: hairTexture(1), roughness: .6 });
    const hoof = new THREE.MeshStandardMaterial({ color: 0x2b2420, roughness: .42 }), leather = new THREE.MeshStandardMaterial({ color: 0x2a1a10, roughness: .45 }), steel = new THREE.MeshStandardMaterial({ color: 0xc9ccd0, roughness: .25, metalness: .9 });
    const glass = new THREE.MeshStandardMaterial({ color: 0x1c2228, roughness: .08, metalness: .6 });
    const eye = new THREE.MeshPhysicalMaterial({ color: 0x0a0706, roughness: .04, clearcoat: 1 }), earIn = new THREE.MeshStandardMaterial({ color: 0x1a1512, roughness: .8, side: THREE.DoubleSide });
    const silkTex = silkTexture(liv), clothTex = clothTexture(liv, opt.number), cloth = new THREE.MeshStandardMaterial({ map: clothTex, roughness: .85, side: THREE.DoubleSide }), capM = new THREE.MeshStandardMaterial({ color: liv.cap, roughness: .35 });
    const lin = h => new THREE.Color(h), jk = jockeyMat(silkTex, [lin(liv.main), lin(liv.pattern === 'manches' ? liv.second : liv.main), lin(0xf1efe8), lin(0x141312), lin(0xdfa487), lin(liv.cap), lin(0x1a1f24), lin(0xf4f2ec), lin(0x8a5a32)]);
    u.mats.push(coat, hair, tailM, glass, hoof, leather, steel, eye, earIn, cloth, capM, jk); u.texs.push(silkTex, clothTex);
    // cheval : corps sculpté + crins, un seul squelette
    const B = bones(HB), body = new THREE.SkinnedMesh(D.H, coat); body.castShadow = true; body.add(B[0]); root.add(body);
    root.updateMatrixWorld(true); const sk = new THREE.Skeleton(B); body.bind(sk);
    for (const [g, mt] of [[HG.mane, hair], [HG.tail, hair], [HG.core, tailM]]) { const m = new THREE.SkinnedMesh(g, mt); m.castShadow = true; root.add(m); m.bind(sk) }
    const at = (b, g, mat, x, y, z, shadow) => { const o = new THREE.Mesh(g, mat); o.castShadow = !!shadow; const w = B[b].getWorldPosition(new THREE.Vector3()); o.position.set(x - w.x, y - w.y, z - w.z); B[b].add(o); return o }, onHead = (g, mat) => { const o = new THREE.Mesh(g, mat); B[2].add(o); return o };
    for (const [b, x] of [[8, .53], [11, .53], [14, -.81], [17, -.81]]) at(b, P.hoof, hoof, x, 0, B[b].getWorldPosition(new THREE.Vector3()).z);
    onHead(P.head.eye, eye); onHead(P.head.ear, coat).castShadow = true; onHead(P.head.earIn, earIn);
    const u2 = { B, body, reins: [] }; if (opt.free) { Object.assign(u, u2); return }
    onHead(P.head.leather, leather); onHead(P.head.steel, steel); if (opt.blinkers) onHead(P.head.blink, capM);
    at(0, P.cloth, cloth, 0, 0, 0, 1).position.set(0, -1.3, 0); at(0, P.saddle, leather, 0, 0, 0, 1).position.set(0, -1.3, 0); at(0, P.girth, leather, .24, 1.29, 0);
    // jockey : son propre squelette, accroché au corps du cheval
    const jg = new THREE.Group(); jg.position.set(0, -1.3, 0); B[0].add(jg); const JB_ = bones(JB), jm = new THREE.SkinnedMesh(D.J, jk); jm.castShadow = true; jm.add(JB_[0]); jg.add(jm); root.updateMatrixWorld(true); jm.bind(new THREE.Skeleton(JB_));
    jg.add(new THREE.Mesh(P.irons, steel), new THREE.Mesh(P.straps, leather));
    // casque (toque aux couleurs), visière, lunettes : pièces rigides sur l'os de la tête
    { const cap = new THREE.Mesh(P.cap, capM); cap.castShadow = true; JB_[2].add(cap, new THREE.Mesh(P.glass, glass)) }
    const whip = new THREE.Mesh(P.whip, leather); whip.position.set(.645 - .43, 1.865 - 1.94, -.07 + .14); JB_[6].add(whip); whip.rotation.z = -1.1;
    const reins = [1, -1].map(() => { const r = new THREE.Mesh(P.rein, leather); root.add(r); return r });
    Object.assign(u, u2, { JB: JB_, jg, reins, whip, jm })
  }
  // ---------- allures : phases des jambes (antérieur gauche, antérieur droit, postérieur gauche, postérieur droit), part d'appui, amplitude, flexion ----------
  const GAITS = { pas: { ph: [.25, .75, 0, .5], st: .62, A: [.26, .24], kf: [.95, .75], bob: .012, roll: .015, nod: .07, nodF: 2 },
    trot: { ph: [0, .5, .5, 0], st: .45, A: [.36, .33], kf: [1.25, .95], bob: .03, roll: .02, nod: .03, nodF: 2 },
    galop: { ph: [.52, .4, .12, 0], st: .34, A: [.55, .5], kf: [1.5, 1.05], bob: .045, roll: .05, nod: .12, nodF: 1 } };
  // ---------- galop (4 temps) ----------
  const X1 = new THREE.Vector3(1, 0, 0), BIT = new THREE.Vector3(), HAND = new THREE.Vector3();
  // p : phase du galop (0..1), run : allure (0 arrêt, ~.3 pas / trot, 1 galop), drive : poussée du jockey (cravache > .5), graze : tête baissée pour brouter,
  // jmp : phase d'un saut d'obstacle (0 appel → 1 réception ; < 0 = pas de saut)
  function pose(root, p, run = 1, drive = 0, graze = 0, jmp = -1) {
    const u = root.userData; u.p = p; u.run = run; u.graze = graze; if (u.pending) return; const B = u.B, JB_ = u.JB, TAU = Math.PI * 2;
    // allure selon run : pas (4 temps latéraux), trot (diagonales), galop (4 temps) ; à l'arrêt, le cheval respire, balance la queue et bouge la tête
    const G = run < .4 ? GAITS.pas : run < .75 ? GAITS.trot : GAITS.galop, k = G === GAITS.galop ? run : Math.min(1, run / (G === GAITS.pas ? .2 : .5)), idle = Math.max(0, 1 - run * 5), st = G.st;
    B[0].position.y = 1.3 + Math.sin(p * TAU * 2) * G.bob * k + Math.sin(p * TAU) * .006 * idle; B[0].rotation.z = Math.sin(p * TAU + .6) * G.roll * k;
    B[1].rotation.z = Math.sin(p * TAU * G.nodF + 2.2) * G.nod * k - .03 * run - graze * 1.1 + Math.sin(p * TAU * .5) * .04 * idle; B[2].rotation.z = -Math.sin(p * TAU * G.nodF + 2.2) * G.nod * .4 * k + .02 - graze * .5 + Math.sin(p * TAU * 1.5 + 1) * .05 * idle;
    B[2].rotation.y = Math.sin(p * TAU * .5 + 2) * .1 * idle;
    const tz = -.2 - Math.sin(p * TAU) * .12 * run - (G === GAITS.galop ? run * .75 : run * .15); B[3].rotation.z = tz * .5; B[4].rotation.z = tz * .35 - Math.sin(p * TAU - .8) * .1 * run; B[5].rotation.z = tz * .25 - Math.sin(p * TAU - 1.6) * .12 * run;
    B[3].rotation.x = Math.sin(p * TAU * .5) * .07 * run + Math.sin(p * TAU * 2) * .22 * idle; B[4].rotation.x = Math.sin(p * TAU * 2 - .7) * .18 * idle;
    for (let l = 0; l < 4; l++) {
      const fore = l < 2, b = 6 + l * 3, q = ((p - G.ph[l]) % 1 + 1) % 1, A = (fore ? G.A[0] : G.A[1]) * k; let a, flex;
      if (q < st) { a = A - 2 * A * (q / st); flex = 0 } else { const s = (q - st) / (1 - st); a = -A + 2 * A * (s * s * (3 - 2 * s)); flex = Math.sin(s * Math.PI) }
      const kf = (fore ? G.kf[0] : G.kf[1]) * k, gr = G === GAITS.galop ? run : k * .5;
      B[b].rotation.z = a + (fore ? 0 : .08 * gr); B[b + 1].rotation.z = fore ? -flex * kf : .2 * gr + flex * kf;
      B[b + 2].rotation.z = fore ? -flex * kf * .63 + (q < st ? .28 * gr * Math.sin(q / st * Math.PI) : 0) : -.2 * gr - flex * kf * .9 + (q < st ? .22 * gr * Math.sin(q / st * Math.PI) : 0)
    }
    // saut : antérieurs repliés puis tendus à la réception, postérieurs qui poussent puis se rassemblent, dos qui bascule
    const jup = jmp >= 0 ? Math.sin(Math.min(1, jmp) * Math.PI) : 0;
    if (jmp >= 0) {
      const ju = Math.min(1, Math.max(0, jmp)), jc = Math.cos(ju * Math.PI); B[0].rotation.z += .24 * jc; B[1].rotation.z += -.1 - .12 * jup; B[2].rotation.z += .05 * jup;
      for (let l = 0; l < 4; l++) { const b = 6 + l * 3, off = l % 2 ? .05 : 0;
        if (l < 2) { B[b].rotation.z = (ju < .75 ? .95 * Math.sin(Math.min(1, ju / .3) * Math.PI / 2) : .95 - (ju - .75) / .25 * 1.35) - off; B[b + 1].rotation.z = ju < .8 ? -2 * Math.sin(Math.min(1, ju / .25) * Math.PI / 2) : -2 * (1 - (ju - .8) / .2); B[b + 2].rotation.z = -.9 * jup }
        else { B[b].rotation.z = (ju < .25 ? -.55 * ju / .25 : -.55 + (ju - .25) / .75 * 1.05) + off; B[b + 1].rotation.z = .25 + .95 * jup; B[b + 2].rotation.z = -.3 - .5 * jup } }
    }
    if (!JB_) return;
    // jockey : amortit le galop, pousse au sprint (bras qui accompagnent l'encolure, cravache)
    const bob = B[0].position.y - 1.3; u.jg.position.y = -1.3 - bob * .75; u.jg.position.x = Math.sin(p * TAU * 2 + .8) * .012 * run; u.jg.rotation.z = -B[0].rotation.z * .85;
    const push = Math.sin(p * TAU + 2.6) * (.08 + drive * .22) * run;
    JB_[1].rotation.z = -push * .25 - drive * .05 - jup * .22; JB_[2].rotation.z = push * .2 + jup * .12; u.jg.position.y += jup * .05;
    for (const [sh, el] of [[3, 4], [5, 6]]) { JB_[sh].rotation.z = -push * 1.1; JB_[el].rotation.z = push * .8 }
    u.whip.visible = drive > .5; JB_[6].rotation.x = drive > .5 ? Math.sin(p * TAU * 2) * .25 : 0;
    // rênes : du mors aux mains
    root.updateMatrixWorld(true);
    u.reins.forEach((r, k) => { const s = k ? -1 : 1; BIT.set(1.31 - .97, 1.6 - 1.95, .066 * s); B[2].localToWorld(BIT); root.worldToLocal(BIT); HAND.set(.645 - .43, 1.865 - 1.94, .07 * s - .14 * s); JB_[k ? 6 : 4].localToWorld(HAND); root.worldToLocal(HAND);
      const d = HAND.sub(BIT), L = d.length(); r.position.copy(BIT); r.scale.set(L, 1, 1); r.quaternion.setFromUnitVectors(X1, d.divideScalar(L)) })
  }
  // 2.6 : les squelettes (cheval et jockey) ont chacun une texture d'os sur le GPU : sans skeleton.dispose(), +12 textures à chaque course
  function dispose(root) { const u = root.userData; u.disposed = true; u.mats.forEach(m => m.dispose()); u.texs.forEach(t => t.dispose()); root.traverse(o => { if (o.isSkinnedMesh && o.skeleton) o.skeleton.dispose() }) }
  return { ready, build, pose, setLod, dispose, marks, get loaded() { return Object.keys(DATA).map(Number) } }
})();
// maillages calculés d'avance, pendant que le joueur est au domaine (niveau course, puis gros plan sur les appareils puissants)
if (window.THREE) hooks.on('ready', () => setTimeout(() => { try { HORSE3D.ready(1).then(() => { if (settings.level() === 'haute') HORSE3D.ready(0) }) } catch (e) { } }, 2500));
