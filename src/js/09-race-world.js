/* ===== Course — le monde autour de la piste en vraie 3D =====
   Tribunes à gradins (toit, colonnes, loge royale) et foule animée qui se lève au passage des chevaux, spectateurs debout le long de
   la lice, arbres (feuillus, peupliers, conifères) qui bougent au vent, haies, collines en damier de champs et de bois, château sur la
   colline, étang, écran géant qui affiche le classement, drapeaux au vent. Tout est généré au chargement (aucune image),
   regroupé en quelques maillages (InstancedMesh, géométries fusionnées) ; la densité suit le réglage de qualité. */
const raceWorld = (() => {
  const U = { uTime: { value: 0 }, uExcite: { value: 0 }, uLead: { value: 0 } };
  let W = null;
  const rng = seed => { let s = seed; return () => (s = (s * 16807) % 2147483647) / 2147483647 };
  const M4 = (x, y, z, ry = 0, sx = 1, sy = sx, sz = sx) => new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, ry, 0)), new THREE.Vector3(sx, sy, sz));
  // fusionne des géométries (couleur par morceau, attributs supplémentaires constants par morceau)
  function merge(parts, extra = []) {
    const P = [], N = [], C = [], I = [], X = extra.map(() => []), col = new THREE.Color(); let base = 0;
    for (const pt of parts) {
      const g = pt.m ? pt.g.clone().applyMatrix4(pt.m) : pt.g, pa = g.attributes.position, na = g.attributes.normal; col.set(pt.c ?? 0xffffff);
      for (let i = 0; i < pa.count; i++) { P.push(pa.getX(i), pa.getY(i), pa.getZ(i)); N.push(na.getX(i), na.getY(i), na.getZ(i)); C.push(col.r, col.g, col.b); extra.forEach((k, j) => X[j].push(pt[k] || 0)) }
      if (g.index) for (let i = 0; i < g.index.count; i++) I.push(base + g.index.getX(i)); else for (let i = 0; i < pa.count; i++) I.push(base + i);
      base += pa.count
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3));
    extra.forEach((k, j) => g.setAttribute(k, new THREE.Float32BufferAttribute(X[j], 1))); g.setIndex(I); g.computeBoundingSphere(); return g
  }
  const box = (w, h, d) => new THREE.BoxGeometry(w, h, d);
  // ---------- tribunes ----------
  // x0..x1 le long de la ligne droite (x), z0 = bord avant, gradins vers +z ; seats = couleur des sièges
  function stand(parts, crowd, x0, x1, z0, rows, seats, royal, r) {
    const len = x1 - x0, cx = (x0 + x1) / 2, rise = 1.9, step = 3.1, b = 5, top = b + rows * rise, H = top + 15;
    for (let k = 0; k < rows; k++) {
      const y = b + (k + 1) * rise, z = z0 + k * step;
      parts.push({ g: box(len, y, step), m: M4(cx, y / 2, z + step / 2), c: k % 2 ? 0xd6d0c4 : 0xcfc9bc }, { g: box(len, .8, .9), m: M4(cx, y + .4, z + step * .32), c: seats });
      for (let x = x0 + 1.2; x < x1 - 1; x += 1.95) if (r() < crowd.occ) crowd.list.push([x + (r() - .5) * .5, y, z + step * .52, 0])
    }
    const zb = z0 + rows * step;
    parts.push({ g: box(len, H, 2.5), m: M4(cx, H / 2, zb + 1.25), c: 0xe9e0cc });
    // façade du rez-de-chaussée : arcades
    parts.push({ g: box(len, b, .6), m: M4(cx, b / 2, z0 - .3), c: 0xf1e8d4 }, { g: box(len, .5, .9), m: M4(cx, b + .1, z0 - .4), c: 0xc9a13c });
    for (let x = x0 + 5; x < x1 - 3; x += 9) parts.push({ g: box(4.2, 3.4, .3), m: M4(x, 1.7, z0 - .65), c: 0x2c3440 });
    // toit en porte-à-faux, bandeau bleu roi et or, colonnes
    const rz0 = z0 - 9, rz1 = zb + 2.5, rc = (rz0 + rz1) / 2;
    parts.push({ g: box(len + 6, 1.4, rz1 - rz0), m: M4(cx, H, rc), c: 0x55606c }, { g: box(len + 6.4, 2.4, .8), m: M4(cx, H - .3, rz0), c: 0x10284a }, { g: box(len + 6.6, .5, 1), m: M4(cx, H - 1.4, rz0 - .1), c: 0xd4a73a });
    for (let x = x0 + 2; x <= x1 - 1; x += 22) parts.push({ g: new THREE.CylinderGeometry(.55, .7, H - .6, 8), m: M4(x, (H - .6) / 2, z0 + 1.2), c: 0xf4efe4 });
    // pignons aux extrémités
    for (const x of [x0 - .3, x1 + .3]) parts.push({ g: box(.8, H, zb - z0 + 2.5), m: M4(x, H / 2, (z0 + zb + 2.5) / 2), c: 0xe4dac4 });
    if (royal) {
      // loge royale : balcon en avancée, draperie rouge, couronne dorée
      const lx = cx, ly = b + 6 * rise;
      parts.push({ g: box(26, 1, 9), m: M4(lx, ly, z0 + 5 * step - 1), c: 0xe9e0cc }, { g: box(26, 3.2, .6), m: M4(lx, ly + 2, z0 + 5 * step - 5.2), c: 0x8e1b24 }, { g: box(26.4, .45, .9), m: M4(lx, ly + 3.7, z0 + 5 * step - 5.3), c: 0xd4a73a });
      parts.push({ g: new THREE.ConeGeometry(2.2, 3.6, 5), m: M4(lx, H + 3.2, rz0 + 1), c: 0xe0b447 }, { g: box(12, 4.2, .6), m: M4(lx, H + 1.4, rz0 - .2), c: 0x10284a });
    }
  }
  // spectateur : torse, tête, bras (attribut arm), assis ; debout = mis à l'échelle
  function personGeo() {
    const p = [{ g: new THREE.CylinderGeometry(.72, 1.05, 2.9, 6, 1, true), m: M4(0, 2.1, 0), c: 0xffffff }, { g: new THREE.SphereGeometry(.74, 6, 3, 0, Math.PI * 2, 0, Math.PI / 2).scale(1, .45, .8), m: M4(0, 3.5, 0), c: 0xffffff },
      { g: new THREE.SphereGeometry(.56, 6, 4), m: M4(0, 4.15, 0), c: 0xffffff, skin: 1 },
      { g: box(.42, 2.1, .42), m: M4(1.15, 2.5, 0), c: 0xffffff, arm: 1 }, { g: box(.42, 2.1, .42), m: M4(-1.15, 2.5, 0), c: 0xffffff, arm: 1 },
      { g: new THREE.CylinderGeometry(.95, .95, .2, 6), m: M4(0, 4.62, 0), c: 0xffffff, hat: 1 }];
    return merge(p, ['skin', 'arm', 'hat'])
  }
  function crowdMesh(list, standing) {
    const g = personGeo(), n = list.length, mat = new THREE.MeshStandardMaterial({ roughness: .85 }), ph = new Float32Array(n);
    const PAL = [0x1f3b66, 0xf2efe6, 0xc8b89a, 0x8e1b24, 0xe8a3b8, 0x7fb0d8, 0x2f5d3a, 0x222222, 0x8a8f96, 0xe0c060, 0x5a3a78, 0xffffff];
    const HATS = [0xf2efe6, 0x1f3b66, 0xe8a3b8, 0xd8c7a0, 0x8e1b24];
    const m = new THREE.InstancedMesh(g, mat, n), r = rng(5 + n), c = new THREE.Color();
    list.forEach(([x, y, z, ry], i) => { m.setMatrixAt(i, M4(x, y, z, ry + (r() - .5) * .5, standing ? 1 : 1, standing ? 1.28 : 1, 1)); m.setColorAt(i, c.set(PAL[(r() * PAL.length) | 0])); ph[i] = r() * 100 + (r() < .3 ? 1000 : 0) + (r() < .5 ? 0 : 2000) + ((r() * HATS.length) | 0) * 10000 });
    g.setAttribute('aPh', new THREE.InstancedBufferAttribute(ph, 1));
    mat.onBeforeCompile = s => {
      Object.assign(s.uniforms, U);
      s.vertexShader = 'uniform float uTime,uExcite,uLead;attribute float skin;attribute float arm;attribute float hat;attribute float aPh;varying float vSkin;varying float vHat;varying float vHatC;\n' + s.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
       float ph=mod(aPh,100.),hasHat=mod(floor(aPh/1000.),2.),hc=floor(aPh/10000.);vec3 wp=(instanceMatrix*vec4(0.,0.,0.,1.)).xyz;
       float ex=clamp(uExcite+.9*exp(-abs(wp.x-uLead)/70.)*step(.01,uExcite),0.,1.),j=max(0.,sin(uTime*(5.+ph*.04)+ph))*ex;
       transformed.y+=j*.9;if(arm>.5){transformed.y+=ex*step(.35,fract(ph*.37))*(1.6+sin(uTime*7.+ph)*.35);}
       if(hat>.5&&hasHat<.5)transformed*=0.;vSkin=skin;vHat=hat;vHatC=hc;`);
      s.fragmentShader = 'varying float vSkin;varying float vHat;varying float vHatC;\n' + s.fragmentShader.replace('#include <color_fragment>', `#include <color_fragment>
       vec3 hc=vHatC<.5?vec3(.9,.88,.84):vHatC<1.5?vec3(.02,.05,.14):vHatC<2.5?vec3(.8,.35,.45):vHatC<3.5?vec3(.7,.6,.4):vec3(.45,.02,.03);
       diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.85,.6,.45),vSkin);diffuseColor.rgb=mix(diffuseColor.rgb,hc,vHat);`)
    };
    m.instanceMatrix.needsUpdate = true; if (m.instanceColor) m.instanceColor.needsUpdate = true; m.castShadow = false; m.receiveShadow = true; return m
  }
  // ---------- arbres ----------
  function fluffy(g, cx, cy, cz, k = .75) { const p = g.attributes.position, n = g.attributes.normal, v = new THREE.Vector3(), w = new THREE.Vector3(); for (let i = 0; i < p.count; i++) { v.set(p.getX(i) - cx, (p.getY(i) - cy) * .8, p.getZ(i) - cz).normalize(); w.set(n.getX(i), n.getY(i), n.getZ(i)).lerp(v, k).normalize(); n.setXYZ(i, w.x, w.y, w.z) } return g }
  function treeGeos() {
    const ico = (r, x, y, z, sy = 1) => new THREE.IcosahedronGeometry(r, 1).scale(1, sy, 1).translate(x, y, z);
    const oak = merge([[6.2, 0, 15, 0], [4.4, 3.8, 13, 1.2], [4.6, -3.4, 13.5, -1.6], [4.4, 1, 18.6, -1], [4, -1.6, 12, 3.2], [3.8, 1.8, 12.4, -3.4]].map(([r, x, y, z]) => ({ g: fluffy(ico(r, x, y, z), 0, 14.5, 0) })));
    const poplar = merge([[3.1, 9.5], [3.3, 14.5], [2.6, 19.5], [1.6, 23]].map(([r, y]) => ({ g: fluffy(ico(r, 0, y, 0, 1.55), 0, 16, 0, .6) })));
    const pine = merge([[5.2, 8, 7], [4.2, 7.5, 11.5], [3, 6.5, 15.5], [1.8, 5, 19]].map(([r, h, y]) => ({ g: new THREE.ConeGeometry(r, h, 8, 1).translate(0, y, 0) })));
    const trunk = h => merge([{ g: new THREE.CylinderGeometry(.45, .85, h, 6).translate(0, h / 2, 0) }, { g: new THREE.CylinderGeometry(.2, .35, 5, 5).rotateZ(.8).translate(1.6, h * .7, 0) }]);
    return [{ crown: oak, trunk: trunk(12) }, { crown: poplar, trunk: trunk(7) }, { crown: pine, trunk: trunk(6) }]
  }
  function leafMat() {
    const m = new THREE.MeshStandardMaterial({ roughness: .92 });
    m.onBeforeCompile = s => {
      Object.assign(s.uniforms, U);
      s.vertexShader = 'uniform float uTime;varying vec3 vLeaf;\n' + s.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
       vec3 wp=(instanceMatrix*vec4(0.,0.,0.,1.)).xyz;float hh=max(0.,position.y-7.)/18.;transformed.x+=sin(uTime*1.3+wp.x*.05+wp.z*.03)*hh*.55+sin(uTime*3.1+position.y*.4+wp.z)*hh*.12;transformed.z+=cos(uTime*1.1+wp.z*.05)*hh*.35;
       vLeaf=(instanceMatrix*vec4(position,1.)).xyz;`);
      s.fragmentShader = 'varying vec3 vLeaf;\nfloat lh(vec3 p){return fract(sin(dot(p,vec3(12.9898,78.233,37.719)))*43758.5453);}float ln(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(mix(lh(i),lh(i+vec3(1,0,0)),f.x),mix(lh(i+vec3(0,1,0)),lh(i+vec3(1,1,0)),f.x),f.y),mix(mix(lh(i+vec3(0,0,1)),lh(i+vec3(1,0,1)),f.x),mix(lh(i+vec3(0,1,1)),lh(i+vec3(1,1,1)),f.x),f.y),f.z);}\n' +
        s.fragmentShader.replace('#include <color_fragment>', `#include <color_fragment>
       {float n=ln(vLeaf*.9)*.6+ln(vLeaf*2.7)*.4;diffuseColor.rgb*=mix(.62,1.18,n);diffuseColor.rgb*=mix(.8,1.08,smoothstep(0.,22.,vLeaf.y));}`)
    }; return m
  }
  function forest(scene, list, q) {
    const G = treeGeos(), bark = new THREE.MeshStandardMaterial({ color: 0x5b4633, roughness: 1 }), leaf = leafMat(), c = new THREE.Color(), r = rng(77);
    const GREENS = [[0x4f7a2e, 0x3f6a28, 0x6a8f3a, 0x587f30], [0x5d8a35, 0x4c7a2c, 0x6f9440], [0x2f5230, 0x3a5e36, 0x28482a]];
    for (let k = 0; k < 3; k++) {
      const L = list.filter(t => t[3] === k); if (!L.length) continue;
      const cr = new THREE.InstancedMesh(G[k].crown, leaf, L.length), tr = new THREE.InstancedMesh(G[k].trunk, bark, L.length);
      L.forEach(([x, z, s], i) => { const m = M4(x, 0, z, r() * 6.28, s, s * (.9 + r() * .25), s); cr.setMatrixAt(i, m); tr.setMatrixAt(i, m); cr.setColorAt(i, c.set(GREENS[k][(r() * GREENS[k].length) | 0]).multiplyScalar(.85 + r() * .3)) });
      for (const o of [cr, tr]) { o.castShadow = q.shadow >= 2048; o.receiveShadow = true; o.instanceMatrix.needsUpdate = true; scene.add(o) } cr.instanceColor.needsUpdate = true
    }
  }
  // ---------- collines, champs et bois au loin ----------
  function noise2(seed) { const r = rng(seed), T = Array.from({ length: 256 }, r); const h = (i, j) => T[(i * 31 + j * 17 + ((i * j) & 255)) & 255]; return (x, y) => { const i = Math.floor(x), j = Math.floor(y), u = x - i, v = y - j, s = u * u * (3 - 2 * u), t = v * v * (3 - 2 * v); return (h(i, j) * (1 - s) + h(i + 1, j) * s) * (1 - t) + (h(i, j + 1) * (1 - s) + h(i + 1, j + 1) * s) * t } }
  const N1 = noise2(11), N2 = noise2(23), N3 = noise2(37);
  const hillH = (x, z) => { const r = Math.hypot(x, z), k = Math.max(0, Math.min(1, (r - 620) / 380)), s = k * k * (3 - 2 * k); return s * (26 + 70 * N1(x * .0035 + 3, z * .0035) + 45 * N2(x * .009, z * .009) + 90 * Math.max(0, (r - 1000) / 400)) };
  function hills(scene) {
    const RS = 176, RR = 12, pos = [], col = [], idx = [], c = new THREE.Color(), FIELDS = [0x7da048, 0x9bb45a, 0x6b9140, 0xb9b56c, 0x88a650, 0xa7a45a], FOREST = new THREE.Color(0x35522a);
    for (let j = 0; j <= RR; j++) for (let i = 0; i <= RS; i++) {
      const r = 600 + 820 * Math.pow(j / RR, 1.3), a = i / RS * Math.PI * 2, x = Math.cos(a) * r, z = Math.sin(a) * r, y = hillH(x, z) - .5;
      pos.push(x, y, z); const f = N3(x * .012, z * .012), cell = Math.floor(N1(x * .006 + 9, z * .006) * 6) % 6; c.set(FIELDS[cell]).multiplyScalar(.85 + f * .25);
      if (N2(x * .008 + 4, z * .008) > .58) c.lerp(FOREST, .85); col.push(c.r, c.g, c.b)
    }
    for (let j = 0; j < RR; j++) for (let i = 0; i < RS; i++) { const a = j * (RS + 1) + i, b = a + RS + 1; idx.push(a, a + 1, b, a + 1, b + 1, b) }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.setIndex(idx); g.computeVertexNormals();
    const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1 })); m.receiveShadow = false; scene.add(m);
    // bosquets sur les collines (cônes simples, très nombreux mais légers)
    const r = rng(91), trees = []; for (let k = 0; k < 900; k++) { const a = r() * 6.283, rr = 640 + r() * 700, x = Math.cos(a) * rr, z = Math.sin(a) * rr; if (N2(x * .008 + 4, z * .008) > .55 || r() < .08) trees.push([x, hillH(x, z), z, 5 + r() * 5]) }
    const cg = new THREE.ConeGeometry(1, 2.4, 6).translate(0, 1.2, 0), cm = new THREE.InstancedMesh(cg, new THREE.MeshStandardMaterial({ color: 0x2c4a26, roughness: 1 }), trees.length);
    trees.forEach(([x, y, z, s], i) => cm.setMatrixAt(i, M4(x, y - 1, z, 0, s, s * (1.4 + r()), s))); cm.instanceMatrix.needsUpdate = true; scene.add(cm)
  }
  // ---------- château sur la colline ----------
  function castle(scene, x, z) {
    const y0 = hillH(x, z) - 4, P = [], stone = 0xe6dcc6, roof = 0x3a4a66, gold = 0xd4a73a, dark = 0x2a2f38;
    const tower = (tx, tz, r, h) => { P.push({ g: new THREE.CylinderGeometry(r, r * 1.05, h, 14), m: M4(tx, h / 2, tz), c: stone }, { g: new THREE.ConeGeometry(r * 1.25, h * .42, 14), m: M4(tx, h + h * .21, tz), c: roof }, { g: new THREE.SphereGeometry(r * .18, 8, 6), m: M4(tx, h + h * .44, tz), c: gold });
      for (let k = 0; k < 3; k++) P.push({ g: box(r * .3, r * .5, r * .3), m: M4(tx + r * .95, h * (.35 + k * .2), tz), c: dark }) };
    P.push({ g: box(70, 34, 36), m: M4(0, 17, 0), c: stone }, { g: new THREE.ConeGeometry(48, 22, 4), m: M4(0, 45, 0, Math.PI / 4, 1, 1, .62), c: roof });
    for (let k = -3; k <= 3; k++) for (const yy of [10, 22]) P.push({ g: box(3, 5, .6), m: M4(k * 9, yy, 18.1), c: dark });
    tower(-38, -20, 8, 50); tower(38, -20, 8, 50); tower(-38, 20, 8, 46); tower(38, 20, 8, 46); tower(0, -6, 10, 72);
    for (const [ax, az, bx, bz] of [[-38, 20, -80, 44], [38, 20, 80, 44]]) { const L = Math.hypot(bx - ax, bz - az); P.push({ g: box(L, 20, 5), m: M4((ax + bx) / 2, 10, (az + bz) / 2, -Math.atan2(bz - az, bx - ax)), c: stone }) }
    tower(-80, 44, 6, 34); tower(80, 44, 6, 34);
    const m = new THREE.Mesh(merge(P), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .85 })); m.position.set(x, y0, z); m.rotation.y = Math.atan2(x, z) + Math.PI; scene.add(m);
    const flag = flagMesh(0x10284a, 0xd4a73a, 9, 6); flag.position.set(0, 72 + 30 + 2, -6); m.add(flag)
  }
  // ---------- drapeaux au vent ----------
  function flagMesh(c1, c2, w = 7, h = 4.5) {
    const g = new THREE.PlaneGeometry(w, h, 12, 1).translate(w / 2, 0, 0), cv = document.createElement('canvas'); cv.width = 64; cv.height = 40; const x = cv.getContext('2d');
    // bannière : fond uni, liseré et médaillon (pas de croix, pour ne ressembler à aucun drapeau national)
    x.fillStyle = new THREE.Color(c1).getStyle(); x.fillRect(0, 0, 64, 40); x.fillStyle = new THREE.Color(c2).getStyle(); x.fillRect(0, 34, 64, 6); x.fillRect(0, 0, 64, 3); x.beginPath(); x.arc(24, 18, 9, 0, 6.3); x.fill(); x.fillStyle = new THREE.Color(c1).getStyle(); x.beginPath(); x.arc(24, 18, 5.5, 0, 6.3); x.fill(); x.fillStyle = new THREE.Color(c2).getStyle(); x.beginPath(); x.moveTo(19, 20); x.lineTo(20, 13); x.lineTo(22.5, 16.5); x.lineTo(24, 12); x.lineTo(25.5, 16.5); x.lineTo(28, 13); x.lineTo(29, 20); x.fill();
    const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace;
    const mat = new THREE.MeshStandardMaterial({ map: t, side: THREE.DoubleSide, roughness: .8 });
    mat.onBeforeCompile = s => { Object.assign(s.uniforms, U); s.vertexShader = 'uniform float uTime;\n' + s.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>\nfloat fk=position.x/${w.toFixed(1)};transformed.z+=sin(uTime*5.+position.x*.9)*fk*${(w * .09).toFixed(2)};transformed.y-=fk*fk*${(h * .12).toFixed(2)};`); s.vertexShader = s.vertexShader.replace('#include <beginnormal_vertex>', '#include <beginnormal_vertex>\nobjectNormal=normalize(objectNormal+vec3(0.,0.,cos(uTime*5.+position.x*.9)*.6));') };
    const f = new THREE.Mesh(g, mat), pole = new THREE.Mesh(new THREE.CylinderGeometry(.18, .22, h * 2.6, 6).translate(0, -h * .9, 0), new THREE.MeshStandardMaterial({ color: 0xf2efe6, roughness: .5 })); f.add(pole); return f
  }
  // ---------- écran géant : classement en direct ----------
  function screen(scene) {
    const cv = document.createElement('canvas'); cv.width = 512; cv.height = 256; const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace;
    const g = new THREE.Group(), frame = new THREE.Mesh(box(46, 26, 2), new THREE.MeshStandardMaterial({ color: 0x10284a, roughness: .5 })), panel = new THREE.Mesh(new THREE.PlaneGeometry(42, 21), new THREE.MeshBasicMaterial({ map: t, toneMapped: false }));
    frame.position.y = 30; panel.position.set(0, 30, 1.05); g.add(frame, panel);
    for (const x of [-14, 14]) { const leg = new THREE.Mesh(box(2, 18, 2), frame.material); leg.position.set(x, 9, 0); g.add(leg) }
    const trim = new THREE.Mesh(box(47, .8, 2.4), new THREE.MeshStandardMaterial({ color: 0xd4a73a, metalness: .6, roughness: .3 })); trim.position.y = 43.2; g.add(trim);
    const p = trackPose(RACE_ORIGIN - .045, -58); g.position.copy(p.p); g.rotation.y = Math.atan2(p.n.x, p.n.z) - .55; scene.add(g);
    return { cv, t, last: 0 }
  }
  function drawScreen(S, now) {
    if (now - S.last < 500) return; S.last = now; const x = S.cv.getContext('2d'), fx = raceFX._fx, liv = fx && fx.liv;
    x.fillStyle = '#071a2d'; x.fillRect(0, 0, 512, 256); x.fillStyle = '#e0b249'; x.fillRect(0, 0, 512, 40); x.fillStyle = '#071a2d'; x.font = '24px "Russo One",sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('THE ROYAL RACE', 256, 21);
    const src = (typeof progress !== 'undefined' && progress.length) ? progress : [0, 0, 0, 0, 0, 0], order = src.map((p, i) => [p, i]).sort((a, b) => b[0] - a[0]).slice(0, 4);
    order.forEach(([p, i], k) => {
      const y = 70 + k * 46, l = liv && liv[i]; x.fillStyle = k ? '#fff7dc' : '#ffd66b'; x.font = '700 32px Rajdhani,system-ui,sans-serif'; x.textAlign = 'left'; x.fillText(`${k + 1}`, 24, y);
      x.fillStyle = l ? l.main : '#888'; x.fillRect(70, y - 16, 44, 32); x.fillStyle = l ? l.second : '#ccc'; x.fillRect(70, y - 4, 44, 8);
      x.fillStyle = '#fff'; x.font = '800 26px system-ui,sans-serif'; const nm = i === 0 ? (typeof champion !== 'undefined' ? champion.get().name : 'Toi') : (currentField && currentField.rivals[i - 1] ? currentField.rivals[i - 1].name : `N° ${i + 1}`); x.fillText(`${i + 1}  ${nm}`.slice(0, 26), 130, y)
    }); S.t.needsUpdate = true
  }
  // ---------- étang ----------
  function pond(scene, x, z, rx, rz) {
    const shore = new THREE.Mesh(new THREE.CircleGeometry(1, 48).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0x9c8f64, roughness: 1 })); shore.scale.set(rx + 5, 1, rz + 5); shore.position.set(x, .05, z); shore.receiveShadow = true; scene.add(shore);
    const mat = new THREE.MeshStandardMaterial({ color: 0x4f7488, roughness: .08, metalness: .35 });
    mat.onBeforeCompile = s => { Object.assign(s.uniforms, U); s.fragmentShader = 'uniform float uTime;\n' + s.fragmentShader.replace('#include <normal_fragment_maps>', '#include <normal_fragment_maps>\n{vec2 p=vViewPosition.xy;normal=normalize(normal+vec3(sin(p.x*.9+uTime*1.3)*.04+sin(p.y*1.7-uTime)*.03,cos(p.y*1.1+uTime*1.1)*.04,0.));}') };
    const w = new THREE.Mesh(new THREE.CircleGeometry(1, 48).rotateX(-Math.PI / 2), mat); w.scale.set(rx, 1, rz); w.position.set(x, .12, z); w.receiveShadow = true; scene.add(w);
    const r = rng(19), reeds = []; for (let k = 0; k < 90; k++) { const a = r() * 6.283; reeds.push([x + Math.cos(a) * (rx + 1 + r() * 3), z + Math.sin(a) * (rz + 1 + r() * 3)]) }
    const rm = new THREE.InstancedMesh(new THREE.ConeGeometry(.9, 5, 4).translate(0, 2.5, 0), new THREE.MeshStandardMaterial({ color: 0x5e7a34, roughness: 1 }), reeds.length);
    reeds.forEach(([a, b], i) => rm.setMatrixAt(i, M4(a, 0, b, r() * 3, .7 + r() * .6, .6 + r() * .8))); rm.instanceMatrix.needsUpdate = true; scene.add(rm)
  }
  // ---------- montage ----------
  function build(scene, q) {
    const Q = q || { shadow: 1 }, dens = !Q.shadow ? .45 : Q.shadow < 2048 ? .75 : 1, r = rng(1234);
    W = { dens }; const parts = [], crowd = { list: [], occ: dens >= 1 ? .86 : dens >= .75 ? .7 : .38 };
    // tribunes le long de la ligne d'arrivée (côté extérieur, z > 185)
    const zf = 165 + 38; stand(parts, crowd, 95, 255, zf, 16, 0x1f3b66, true, r); stand(parts, crowd, -60, 88, zf + 4, 13, 0x8e1b24, false, r); stand(parts, crowd, -200, -68, zf + 8, 10, 0x1d5b3a, false, r);
    const stands = new THREE.Mesh(merge(parts), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .82 })); stands.castShadow = !!Q.shadow; stands.receiveShadow = true; scene.add(stands);
    scene.add(crowdMesh(crowd.list, false));
    // spectateurs debout sur la pelouse, entre la lice et les tribunes
    const lawn = []; for (let x = -40; x < 262; x += 2.2) for (let k = 0; k < 3; k++) if (r() < (.35 + .4 * (x > 120)) * dens + .1) lawn.push([x + (r() - .5) * 1.6, 0, 165 + 26 + k * 3.2 + r() * 1.5, Math.PI + (r() - .5) * .6]);
    scene.add(crowdMesh(lawn, true));
    // drapeaux sur les toits
    [[110, 0x10284a, 0xd4a73a], [150, 0x8e1b24, 0xf2efe6], [190, 0x10284a, 0xd4a73a], [230, 0x1d5b3a, 0xf2efe6], [20, 0x8e1b24, 0xf2efe6], [-130, 0x10284a, 0xd4a73a]].forEach(([x, c1, c2], k) => { const f = flagMesh(c1, c2); f.position.set(x, (k < 4 ? 5 + 16 * 1.9 + 15 : k < 5 ? 5 + 13 * 1.9 + 15 : 5 + 10 * 1.9 + 15) + 10, zf + 2); scene.add(f) });
    // haies basses le long de la lice extérieure (hors tribunes) et massifs de fleurs près de l'arrivée
    const hedge = [], flowers = []; for (let t = 0; t < 1; t += .0028) { const p = trackPose(t, 27); if (p.p.z > 150 && p.p.x > -210 && p.p.x < 262) continue; hedge.push([p.p.x, p.p.z, Math.atan2(p.f.x, p.f.z)]) }
    for (let x = -30; x < 250; x += 9) flowers.push([x, 165 + 24]);
    const hm = new THREE.InstancedMesh(fluffy(new THREE.IcosahedronGeometry(2.2, 1).scale(1.5, .8, 1), 0, 0, 0, .6).translate(0, 1.4, 0), leafMat(), hedge.length);
    hedge.forEach(([x, z, a], i) => { hm.setMatrixAt(i, M4(x, 0, z, a, .9 + r() * .3)); hm.setColorAt(i, new THREE.Color(0x3f6a2a).multiplyScalar(.85 + r() * .3)) }); hm.instanceMatrix.needsUpdate = true; hm.instanceColor.needsUpdate = true; hm.receiveShadow = true; scene.add(hm);
    // jardinières : bac de pierre et massif fleuri (taches de couleur semées par le shader)
    const pg = merge([{ g: box(5, 1.1, 1.8).translate(0, .55, 0), c: 0xe9e2d2 }, { g: fluffy(new THREE.IcosahedronGeometry(1, 1).scale(2.4, .6, .85), 0, 0, 0, .6).translate(0, 1.25, 0), c: 0x3d6a2c, fl: 1 }], ['fl']);
    const pm = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .9 }), FL = [[.75, .08, .12], [.95, .78, .2], [.95, .93, .9], [.55, .2, .7]];
    pm.onBeforeCompile = s => { s.vertexShader = 'attribute float fl;varying float vFl;varying vec3 vP;\n' + s.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvFl=fl;vP=(instanceMatrix*vec4(position,1.)).xyz;');
      s.fragmentShader = 'varying float vFl;varying vec3 vP;\n' + s.fragmentShader.replace('#include <color_fragment>', `#include <color_fragment>
       if(vFl>.5){vec3 q=floor(vP*2.2);float h=fract(sin(dot(q,vec3(12.9898,78.233,37.719)))*43758.5453);if(h>.45){float k=fract(h*7.3);diffuseColor.rgb=k<.25?vec3(${FL[0]}):k<.5?vec3(${FL[1]}):k<.75?vec3(${FL[2]}):vec3(${FL[3]});}}`) };
    const fm = new THREE.InstancedMesh(pg, pm, flowers.length); flowers.forEach(([x, z], i) => fm.setMatrixAt(i, M4(x, 0, z, 0, 1))); fm.instanceMatrix.needsUpdate = true; fm.receiveShadow = true; scene.add(fm);
    // arbres : derrière les tribunes, autour de la piste, dans l'enceinte, rideaux de peupliers
    // pas d'arbre sur la piste (40 unités de part et d'autre de la corde), dans les tribunes ni dans l'étang
    const trees = [], add = (x, z, s, k) => { if (Math.abs(Math.hypot(Math.max(0, Math.abs(x) - 260), z) - 165) < 40 || (z > 185 && z < 275 && x > -210 && x < 262) || Math.hypot((x + 150) / 95, (z + 45) / 50) < 1.15 || Math.hypot(x, z) < 48) return; trees.push([x, z, s, k]) };
    for (let x = -300; x < 320; x += 11 / dens) add(x + r() * 6, 165 + 105 + r() * 30, 1 + r() * .4, r() < .3 ? 1 : 0);
    for (let k = 0; k < 260 * dens; k++) { const t = r(), p = trackPose(t, 60 + r() * 180); if (p.p.z > 180 && p.p.x > -220 && p.p.x < 270) continue; add(p.p.x, p.p.z, .8 + r() * .6, r() < .2 ? 1 : r() < .35 ? 2 : 0) }
    for (let k = 0; k < 26 * dens; k++) { const x = -230 + r() * 400, z = -100 + r() * 110; if (x > 100 && z > -40) continue; add(x, z, .8 + r() * .5, r() < .25 ? 1 : 0) }
    for (let x = -240; x < 240; x += 15) add(x, -236, 1.1, 1);
    forest(scene, trees, Q);
    pond(scene, -150, -45, 85, 42);
    hills(scene); castle(scene, -160, -900);
    W.screen = screen(scene); floodlights(scene);
    return W
  }
  // ---------- projecteurs (courses de nuit) : pylônes toujours là, lampes et halos allumés la nuit ----------
  const LAMP = new THREE.MeshStandardMaterial({ color: 0x20242a, emissive: 0xfff4dc, emissiveIntensity: 0, roughness: .4 });
  let halo = null;
  function floodlights(scene) {
    const P = [], L = []; halo = new THREE.SpriteMaterial({ map: haloTex(), color: 0xfff1d6, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0, fog: false });
    for (const [t, off] of [[.03, 58], [.13, 44], [.21, 44], [.53, 58], [.63, 58], [.73, 58], [.37, 64], [.87, 64]]) {
      const p = trackPose(t, off), ry = Math.atan2(-p.n.x, -p.n.z), m = M4(p.p.x, 0, p.p.z, ry);
      P.push({ g: new THREE.CylinderGeometry(.8, 1.3, 72, 8).translate(0, 36, 0), m, c: 0x8a9098 }, { g: box(16, 8, 1.6).translate(0, 74, 0), m, c: 0x2a2f36 });
      const lm = new THREE.Mesh(box(15, 7, .4).rotateX(-.45).translate(0, 74, 1.1), LAMP); lm.position.set(p.p.x, 0, p.p.z); lm.rotation.y = ry; scene.add(lm);
      const s = new THREE.Sprite(halo); s.position.set(p.p.x - p.n.x * 2, 74, p.p.z - p.n.z * 2); s.scale.setScalar(46); scene.add(s)
    }
    const g = new THREE.Mesh(merge(P), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .6, metalness: .3 })); g.castShadow = true; scene.add(g)
  }
  function haloTex() { const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d'), g = x.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(.2, 'rgba(255,240,210,.5)'); g.addColorStop(1, 'rgba(255,230,190,0)'); x.fillStyle = g; x.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c) }
  function night(v) { LAMP.emissiveIntensity = v * 2.4; if (halo) halo.opacity = v * .9 }
  function update(q, now) {
    U.uTime.value = now * .001; if (!W) return;
    const src = (typeof progress !== 'undefined' && progress.length) ? progress : [0], lead = Math.max(...src), running = q.startPhase === 'running';
    // la foule s'enflamme dans la dernière ligne droite, et surtout là où passent les chevaux
    const ex = running ? Math.max(0, Math.min(1, (lead - 72) / 20)) : q.podiumActive ? .8 : 0; U.uExcite.value += (ex - U.uExcite.value) * .05;
    const lp = trackPose(RACE_ORIGIN + Math.min(100, lead) / 100, 0).p; U.uLead.value = lp.z > 150 ? lp.x : -9999;
    if (W.screen) drawScreen(W.screen, now)
  }
  // boîte à outils partagée avec le domaine en 3D (50-domaine3d)
  return { build, update, merge, hillH, night, get uniforms() { return U }, kit: { merge, M4, rng, fluffy, treeGeos, leafMat, flagMesh, noise2, box } }
})();
