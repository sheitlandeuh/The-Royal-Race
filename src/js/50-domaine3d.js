/* ===== Le domaine en vraie 3D =====
   Même plan que la peinture (haras au centre, hippodrome au nord, carrière, clinique, écurie, chantier, moulin, paddocks, rivière,
   forêt), mais construit en volumes : bâtiments procéduraux qui grandissent avec leur niveau (bannières, Salle des trophées qui
   remplace le chantier), chevaux 3D articulés (galop sur la piste, cavaliers en carrière, chevaux qui broutent au pré), moulin dont
   les ailes tournent, fontaine, réverbères, drapeaux, lumière selon l'heure réelle et feuillage selon la saison.
   Caméra : glisser pour se déplacer, pincer / molette pour zoomer, deux doigts ou clic droit pour tourner autour.
   Les étiquettes, minuteurs et bulles de récolte du village (02-village, 45-domaine) sont repris et placés par projection 3D ;
   un toucher sur un bâtiment appelle village.select, comme sur la peinture. La peinture reste le repli (réglage, qualité basse,
   pas de WebGL2). API : domaine3d.on (actif ?), set(bool), snap(ms), view. */
const domaine3d = (() => {
  const world = $('#world'), K = () => raceWorld.kit;
  let R = null, S = null, cam = null, on = false, built = false, T = null, raf = 0, last = 0, horses = [], sails = null, fountainW = null;
  const W3 = { tx: 4, tz: -6, dist: 255, yaw: 0, vx: 0, vz: 0, goal: null };
  // plan de la peinture → sol (mètres) : u, v ∈ [0, 1]
  const U2X = u => (u - .5) * 330, V2Z = v => (v - .5) * 250;
  // bâtiments : centre au sol, hauteur de l'étiquette, orientation
  const B = { haras: [-5, -12, 34, 0], hippodrome: [16, -80, 22, 0], carriere: [-102, -52, 16, .1], clinique: [-110, 4, 22, .35], ecurie: [112, -26, 18, -.3], chantier: [72, 24, 16, -.15], moulin: [122, 42, 30, -.2], paddocks: [-92, 62, 10, .15] };
  const C = { wall: 0xefe3cb, wall2: 0xe3d2b2, stone: 0xc6b89c, roof: 0x34504b, roof2: 0x2a423e, trim: 0xf7f2e6, gold: 0xd4a73a, win: 0x22303e, door: 0x5a3d26, wood: 0x8a6440, wood2: 0x5e4128, red: 0x8e1b24, navy: 0x10284a, green: 0x1f6b3a, brick: 0x9a5a3c };
  const supported = () => { try { return !!window.THREE && !!document.createElement('canvas').getContext('webgl2') } catch (e) { return false } };
  const wanted = () => { const v = settings.get('d3'); return v === undefined ? settings.level() !== 'basse' : !!v };
  // ---------- petites constructions (morceaux fusionnés, attribut glow = fenêtre éclairée la nuit) ----------
  const M = (x, y, z, ry = 0, sx = 1, sy = sx, sz = sx) => K().M4(x, y, z, ry, sx, sy, sz);
  const bx = (w, h, d) => new THREE.BoxGeometry(w, h, d);
  function gable(w, d, h) { const s = new THREE.Shape([new THREE.Vector2(-d / 2, 0), new THREE.Vector2(d / 2, 0), new THREE.Vector2(0, h)]); return new THREE.ExtrudeGeometry(s, { depth: w, bevelEnabled: false }).translate(0, 0, -w / 2).rotateY(Math.PI / 2) }
  const mansard = (w, d, h, top = .55) => new THREE.CylinderGeometry(top, 1, h, 4, 1).rotateY(Math.PI / 4).scale(w / Math.SQRT2, 1, d / Math.SQRT2).translate(0, h / 2, 0);
  function windows(P, x0, x1, y, z, n, ww = 1.6, wh = 2.2, face = 1, rot = 0) { for (let i = 0; i < n; i++) { const x = x0 + (x1 - x0) * (n > 1 ? i / (n - 1) : .5); P.push({ g: bx(ww, wh, .3), m: M(x, y, z + face * .1), c: C.win, glow: 1 }, { g: bx(ww + .5, .3, .5), m: M(x, y - wh / 2 - .1, z + face * .15), c: C.trim }) } }
  function part(P, g, x, y, z, c, ry = 0, glow = 0) { P.push({ g, m: M(x, y, z, ry), c, glow }) }
  function mesh(P, mat) { const m = new THREE.Mesh(K().merge(P, ['glow']), mat); m.castShadow = m.receiveShadow = true; return m }
  // matériau des bâtiments : couleurs par sommet, fenêtres qui s'allument la nuit, surbrillance au survol / à la sélection
  function bldMat() {
    const m = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .78 }); m.userData.u = { uNight: { value: 0 }, uHi: { value: 0 } };
    m.onBeforeCompile = s => { Object.assign(s.uniforms, m.userData.u); s.vertexShader = 'attribute float glow;varying float vGlow;\n' + s.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvGlow=glow;');
      s.fragmentShader = 'uniform float uNight,uHi;varying float vGlow;\n' + s.fragmentShader.replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\ntotalEmissiveRadiance+=vec3(1.,.72,.38)*vGlow*uNight*1.6+vec3(1.,.85,.45)*uHi*.18;') };
    return m
  }
  // ---------- bâtiments ----------
  function haras(lv) {
    const P = [];
    part(P, bx(22, 2, 18), 0, 1, 0, C.stone); part(P, bx(20, 17, 16), 0, 10, 0, C.wall); part(P, mansard(20.5, 16.5, 7, .62), 0, 18.5, 0, C.roof);
    windows(P, -7, 7, 6, 8, 5); windows(P, -7, 7, 11, 8, 5); windows(P, -5, 5, 15.5, 8, 3, 1.4, 1.8); windows(P, -7, 7, 6, -8, 5, 1.6, 2.2, -1); windows(P, -7, 7, 11, -8, 5, 1.6, 2.2, -1);
    part(P, new THREE.SphereGeometry(6, 24, 10, 0, Math.PI * 2, 0, Math.PI / 2), 0, 25.5, 0, C.roof2); part(P, new THREE.CylinderGeometry(6.2, 6.2, 1, 24), 0, 25.4, 0, C.trim);
    part(P, new THREE.CylinderGeometry(1.4, 1.4, 3, 10), 0, 32.5, 0, C.trim); part(P, new THREE.SphereGeometry(1.6, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2), 0, 34, 0, C.roof2); part(P, new THREE.ConeGeometry(.5, 3, 8), 0, 36.5, 0, C.gold);
    part(P, new THREE.CylinderGeometry(1.8, 1.8, .4, 20).rotateX(Math.PI / 2), 0, 17, 8.3, C.gold);
    for (const s of [-1, 1]) {
      part(P, bx(18, 1.6, 13), s * 19, .8, 0, C.stone); part(P, bx(18, 12, 12), s * 19, 7, 0, C.wall2); part(P, mansard(18.5, 12.5, 5, .55), s * 19, 13, 0, C.roof);
      windows(P, s * 12, s * 26, 5, 6, 4); windows(P, s * 12, s * 26, 9.6, 6, 4); windows(P, s * 12, s * 26, 5, -6, 4, 1.6, 2.2, -1); windows(P, s * 12, s * 26, 9.6, -6, 4, 1.6, 2.2, -1);
      part(P, bx(9, 1.6, 15), s * 32, .8, 0, C.stone); part(P, bx(8, 14, 14), s * 32, 7.8, 0, C.wall); part(P, mansard(8.5, 14.5, 6, .2), s * 32, 14.7, 0, C.roof); windows(P, s * 32, s * 32, 5.5, 7, 1); windows(P, s * 32, s * 32, 10.5, 7, 1);
      part(P, bx(1.2, 3.5, 1.2), s * 14, 16.5, -2, C.stone); part(P, bx(1.2, 3.5, 1.2), s * 26, 16.5, 2, C.stone)
    }
    part(P, bx(4.5, 6, .6), 0, 4, 8.2, C.door); part(P, bx(5.4, .5, .8), 0, 7.2, 8.3, C.gold);
    for (let k = 0; k < 4; k++) part(P, bx(14 - k * 2, .5, 1.4), 0, .25 + k * .5, 12.6 - k * 1.3, C.trim);
    return { P, flags: [[-32, 21.5, 0], [32, 21.5, 0], [0, 38, 0]].slice(0, 1 + Math.min(2, lv)) }
  }
  function ecurie(lv) {
    const P = [];
    part(P, bx(46, 7, 11), 0, 3.5, 0, C.wall); part(P, gable(47, 12, 5), 0, 7, 0, C.roof); windows(P, -20, 20, 4.5, -5.5, 9, 1.4, 1.2, -1);
    for (let x = -20; x <= 20; x += 4) if (Math.abs(x) > 5) { part(P, bx(2.2, 3.6, .4), x, 2.1, 5.6, C.wood2); part(P, bx(2.2, 1.4, .45), x, 4.8, 5.6, C.win, 0, 1) }
    part(P, bx(11, 11, 13), 0, 5.5, .5, C.wall2); part(P, mansard(11.5, 13.5, 4, .3), 0, 11, .5, C.roof); part(P, bx(4.5, 6.5, .5), 0, 3.25, 7.1, C.door); part(P, bx(5.2, .5, .6), 0, 6.8, 7.2, C.gold);
    part(P, bx(3, 3, 3), 0, 16.4, .5, C.trim); part(P, new THREE.ConeGeometry(2.4, 3, 4).rotateY(Math.PI / 4), 0, 19.4, .5, C.roof2); part(P, new THREE.ConeGeometry(.25, 2.5, 6), 0, 21.8, .5, C.gold);
    for (const s of [-1, 1]) { part(P, bx(11, 7, 20), s * 23, 3.5, 9, C.wall); part(P, gable(20, 12, 5), s * 23, 7, 9, C.roof, Math.PI / 2); for (let z = 3; z <= 16; z += 4) part(P, bx(.4, 3.6, 2.2), s * (23 - 5.6), 2.1, z, C.wood2) }
    return { P, flags: [[-23, 13.5, 9], [23, 13.5, 9], [0, 23.5, .5]].slice(0, 1 + Math.min(2, lv)) }
  }
  function clinique(lv) {
    const P = [];
    part(P, bx(26, 9, 13), 0, 4.5, 0, C.wall); part(P, mansard(26.5, 13.5, 5, .5), 0, 9, 0, C.roof); windows(P, -10, 10, 3.5, 6.5, 6); windows(P, -10, 10, 7, 6.5, 6, 1.4, 1.8); windows(P, -10, 10, 3.5, -6.5, 6, 1.6, 2.2, -1); windows(P, -10, 10, 7, -6.5, 6, 1.4, 1.8, -1);
    part(P, bx(9, 12, 3), 0, 6, 7, C.wall2); part(P, gable(3.2, 9.5, 4), 0, 12, 7, C.roof, Math.PI / 2); part(P, bx(3.5, 5, .5), 0, 2.5, 8.6, C.door);
    part(P, new THREE.CylinderGeometry(2.1, 2.1, .4, 24).rotateX(Math.PI / 2), 0, 9.6, 8.7, C.trim); part(P, bx(2.8, .8, .3), 0, 9.6, 8.95, 0xc8202c); part(P, bx(.8, 2.8, .3), 0, 9.6, 8.95, 0xc8202c);
    part(P, bx(5.5, 17, 5.5), -14, 8.5, -2, C.wall2); part(P, new THREE.ConeGeometry(4.4, 6, 4).rotateY(Math.PI / 4), -14, 20, -2, C.roof2); windows(P, -14, -14, 13, .8, 1, 1.4, 2.4);
    part(P, bx(12, 6, 10), 17, 3, -1, C.wall2); part(P, gable(12.5, 10.5, 3.5), 17, 6, -1, C.roof);
    return { P, flags: [[-14, 24, -2], [12, 11, 6], [-12, 11, 6]].slice(0, 1 + Math.min(2, lv)) }
  }
  function moulin(lv) {
    const P = [];
    part(P, new THREE.CylinderGeometry(4.2, 6, 17, 16), 0, 8.5, 0, C.stone); part(P, new THREE.ConeGeometry(5, 5, 16), 0, 19.5, 0, C.wood2); windows(P, 0, 0, 6, 5.6, 1); windows(P, 0, 0, 12, 4.7, 1);
    part(P, bx(2.5, 4, .5), 0, 2, 5.8, C.door);
    part(P, bx(17, 8, 12), 17, 4, 2, C.brick); part(P, gable(17.5, 12.5, 5), 17, 8, 2, C.roof2); part(P, bx(5, 6, .5), 17, 3, 8.2, C.wood2);
    part(P, new THREE.CylinderGeometry(3.2, 3.2, 13, 18), 32, 6.5, -2, 0xc9ccd0); part(P, new THREE.SphereGeometry(3.2, 18, 8, 0, Math.PI * 2, 0, Math.PI / 2), 32, 13, -2, 0xa8adb3);
    for (const [x, z, y] of [[6, 10, 1], [8.5, 10, 1], [7.2, 10, 3], [24, 10, 1], [26.5, 10, 1]]) part(P, new THREE.CylinderGeometry(1.1, 1.1, 1.6, 12).rotateZ(Math.PI / 2), x, y, z, 0xd9b75a);
    // ailes : groupe à part, tourne en continu
    const sP = []; for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2, g = bx(2.6, 12, .25).translate(1.1, 7.8, 0).rotateZ(a), f = bx(.35, 14, .35).translate(0, 7, 0).rotateZ(a); sP.push({ g, c: 0xefe7d6 }, { g: f, c: C.wood2 }) }
    sP.push({ g: new THREE.CylinderGeometry(.8, .8, 1.5, 10).rotateX(Math.PI / 2), c: C.wood2 });
    return { P, sP, flags: [[17, 14, 2], [32, 17.5, -2], [0, 23.5, 0]].slice(0, Math.min(3, lv)) }
  }
  function chantier(lv) {
    const P = [];
    if (lv >= 1) {
      // Salle des trophées : portique à colonnes, fronton, dôme doré
      part(P, bx(28, 2, 20), 0, 1, 0, C.stone); part(P, bx(24, 11, 16), 0, 7, -1, C.wall); part(P, mansard(24.5, 16.5, 3, .8), 0, 12.5, -1, C.roof);
      for (let k = 0; k < 6; k++) part(P, new THREE.CylinderGeometry(.6, .7, 10, 12), -10 + k * 4, 7, 8.5, C.trim);
      part(P, bx(24, 1.2, 4), 0, 12.6, 8.5, C.trim); part(P, gable(4, 24.5, 4), 0, 13.2, 8.5, C.wall, Math.PI / 2);
      part(P, new THREE.SphereGeometry(5.5, 24, 10, 0, Math.PI * 2, 0, Math.PI / 2), 0, 15.5, -1, C.gold); part(P, new THREE.ConeGeometry(.6, 3, 8), 0, 22.5, -1, C.gold);
      windows(P, -9, 9, 5.5, 7, 4, 1.8, 3); part(P, bx(4, 6, .5), 0, 5, 7.2, C.door);
      for (let k = 0; k < 4; k++) part(P, bx(18 - k * 2, .5, 1.2), 0, .25 + k * .5, 11.5 - k * 1.1, C.trim);
      return { P, flags: [[-13, 17, 7], [13, 17, 7]].slice(0, Math.min(2, lv)) }
    }
    // chantier : fondations, murs inachevés, échafaudages, grue en bois, matériaux
    part(P, bx(26, 1.2, 18), 0, .6, 0, C.stone);
    for (const [x, z, w, d, h] of [[-12, 0, 1.2, 16, 7], [12, 0, 1.2, 16, 5], [0, -8, 24, 1.2, 8], [-6, 8, 12, 1.2, 4]]) part(P, bx(w, h, d), x, 1.2 + h / 2, z, C.wall2);
    for (let x = -13; x <= 13; x += 4.3) for (const z of [-9.5, 9.5]) part(P, new THREE.CylinderGeometry(.14, .14, 11, 5), x, 5.5, z, C.wood);
    for (const y of [4, 8]) for (const z of [-9.5, 9.5]) part(P, bx(27, .25, 1.2), 0, y, z, C.wood);
    part(P, bx(.8, 20, .8), 16, 10, -6, C.wood2); part(P, bx(16, .6, .6), 10, 19.5, -6, C.wood2); part(P, new THREE.CylinderGeometry(.05, .05, 8, 4), 4, 15.5, -6, 0x333333);
    for (const [x, z] of [[18, 6], [20, 3], [-17, 7]]) part(P, bx(2.4, 1.6, 2.4), x, .8, z, C.wood);
    for (let k = 0; k < 5; k++) part(P, new THREE.CylinderGeometry(.3, .3, 6, 6).rotateZ(Math.PI / 2), -4 + (k % 3) * .7, .3 + Math.floor(k / 3) * .6, 13, C.wood);
    return { P, flags: [] }
  }
  function carriere() {
    const P = [], fence = [];
    // tour du juge, obstacles
    part(P, bx(5, 7, 5), 30, 3.5, -10, C.wood); part(P, bx(6.4, .4, 6.4), 30, 7.2, -10, C.wood2); part(P, new THREE.ConeGeometry(5, 3.5, 4).rotateY(Math.PI / 4), 30, 11, -10, C.roof);
    for (const [x, z] of [[27.6, -12.4], [32.4, -12.4], [27.6, -7.6], [32.4, -7.6]]) part(P, bx(.3, 2.2, .3), x, 8.3, z, C.wood2);
    for (const [x, z, c] of [[-10, -4, 0xc8202c], [8, 5, 0x1f5fbf], [-2, 8, 0xf2c230]]) { part(P, bx(.4, 1.8, .4), x - 2, .9, z, C.trim); part(P, bx(.4, 1.8, .4), x + 2, .9, z, C.trim); part(P, bx(4.4, .25, .25), x, 1.2, z, c); part(P, bx(4.4, .25, .25), x, .6, z, C.trim) }
    return { P, fence: [roundRect(0, 0, 30, 16, 6)] }
  }
  function paddocks() {
    const P = [];
    for (const [x, z] of [[-14, -12], [16, -10]]) { part(P, bx(7, 3.4, 5), x, 1.7, z, C.wood); part(P, gable(8, 6, 2.2), x, 3.4, z, C.roof2); part(P, bx(6, 2.6, .3), x, 1.5, z + 2.6, 0x2a1d12) }
    part(P, bx(4, .8, 1.2), 0, .4, 8, C.stone);
    return { P, fence: [rect(-15, 0, 28, 30), rect(15, 0, 28, 30)] }
  }
  function hippodrome() {
    const P = [];
    // tribune au nord de la piste, face au sud
    const zb = -40, x0 = 12, x1 = 58, rows = 8;
    for (let k = 0; k < rows; k++) { const y = 1.5 + k * 1.1; part(P, bx(x1 - x0, y, 2), (x0 + x1) / 2, y / 2, zb + (rows - k) * 2, 0xd6d0c4); part(P, bx(x1 - x0, .5, .6), (x0 + x1) / 2, y + .25, zb + (rows - k) * 2 + .5, k % 2 ? C.red : C.navy) }
    part(P, bx(x1 - x0, 15, 1.5), (x0 + x1) / 2, 7.5, zb, C.wall); part(P, bx(x1 - x0 + 4, .8, 22), (x0 + x1) / 2, 15, zb + 9, C.roof); part(P, bx(x1 - x0 + 4.4, 1.4, .5), (x0 + x1) / 2, 14.6, zb + 20, C.navy);
    for (let x = x0; x <= x1; x += 11.5) part(P, new THREE.CylinderGeometry(.3, .3, 14.5, 8), x, 7.2, zb + 19, C.trim);
    for (const x of [x0 - 3, x1 + 3]) { part(P, bx(6, 20, 6), x, 10, zb + 4, C.wall2); part(P, new THREE.ConeGeometry(4.6, 6, 4).rotateY(Math.PI / 4), x, 23, zb + 4, C.roof2); windows(P, x, x, 14, zb + 7, 1) }
    // stalles de départ, écran géant, monument au centre
    for (let k = 0; k < 6; k++) part(P, bx(1.6, 3.4, 3.2), 40 + k * 1.8, 1.7, 14, C.green); part(P, bx(11.5, .5, 3.6), 44.5, 3.6, 14, C.trim);
    part(P, bx(16, 9, .8), -38, 10, -30, 0x0a1624); part(P, bx(17, 10, .6), -38, 10, -30.5, C.navy); for (const x of [-44, -32]) part(P, bx(.8, 6, .8), x, 3, -30.5, C.navy);
    part(P, bx(4, 2, 4), 0, 1, 0, C.stone); part(P, new THREE.CylinderGeometry(.9, 1.2, 8, 8), 0, 6, 0, C.trim); part(P, new THREE.ConeGeometry(1, 2.5, 8), 0, 11, 0, C.gold);
    return { P, fence: [ellipse(0, 0, 62.5, 32.5), ellipse(0, 0, 50, 21)], flags: [[x0 - 3, 26.5, zb + 4], [x1 + 3, 26.5, zb + 4]], extra: g => { const c = document.createElement('canvas'); c.width = 256; c.height = 144; const x = c.getContext('2d'); x.fillStyle = '#071a2d'; x.fillRect(0, 0, 256, 144); x.fillStyle = '#e0b249'; x.fillRect(0, 0, 256, 6); x.fillRect(0, 138, 256, 6); x.font = '900 26px Georgia,serif'; x.textAlign = 'center'; x.fillText('THE ROYAL RACE', 128, 66); x.font = '700 16px system-ui,sans-serif'; x.fillStyle = '#fff7dc'; x.fillText('HIPPODROME DU DOMAINE', 128, 98);
      const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; const s = new THREE.Mesh(new THREE.PlaneGeometry(15, 8.2), new THREE.MeshBasicMaterial({ map: t, toneMapped: false })); s.position.set(-38, 10, -29.55); g.add(s) } }
  }
  // ---------- clôtures (poteaux + deux lisses) ----------
  const rect = (x, z, w, d) => { const a = [[x - w / 2, z - d / 2], [x + w / 2, z - d / 2], [x + w / 2, z + d / 2], [x - w / 2, z + d / 2]]; a.push(a[0]); return a };
  const ellipse = (x, z, rx, rz, n = 72) => Array.from({ length: n + 1 }, (_, i) => [x + Math.cos(i / n * 6.2832) * rx, z + Math.sin(i / n * 6.2832) * rz]);
  const roundRect = (x, z, hw, hd, r, n = 10) => { const a = []; for (const [cx, cz, a0] of [[hw - r, -hd + r, -Math.PI / 2], [hw - r, hd - r, 0], [-hw + r, hd - r, Math.PI / 2], [-hw + r, -hd + r, Math.PI]]) for (let i = 0; i <= n; i++) { const t = a0 + i / n * Math.PI / 2; a.push([x + cx + Math.cos(t) * r, z + cz + Math.sin(t) * r]) } a.push(a[0]); return a };
  function fences(list, tr, P, col = C.trim) {
    for (const path of list) for (let i = 0; i < path.length - 1; i++) {
      const [ax, az] = path[i], [bx_, bz] = path[i + 1], L = Math.hypot(bx_ - ax, bz - az); if (L < .01) continue;
      const n = Math.max(1, Math.round(L / 3)), ang = -Math.atan2(bz - az, bx_ - ax);
      for (const y of [.7, 1.3]) P.push({ g: bx(L, .14, .12), m: tr.clone().multiply(M((ax + bx_) / 2, y, (az + bz) / 2, ang)), c: col });
      for (let k = 0; k < n; k++) { const t = k / n; P.push({ g: bx(.2, 1.5, .2), m: tr.clone().multiply(M(ax + (bx_ - ax) * t, .75, az + (bz - az) * t)), c: col }) }
    }
  }
  // ---------- sol peint : herbe, allées, sable, pelouses tondues ----------
  const GW = 420, GD = 330;
  const ROADS = [[[-6, 125], [-6, 60], [-6, 22]], [[-6, 6], [-5, -2]], [[-18, 14], [-55, 10], [-95, 8]], [[6, 14], [40, 20], [60, 22]], [[84, 28], [105, 38]], [[-30, -18], [-62, -34], [-78, -44]], [[26, -16], [70, -24], [96, -24]], [[-5, -28], [-2, -44]],
    [[-20, 24], [-55, 44], [-72, 56]], [[-110, 20], [-106, 44]], [[114, -8], [120, 28]], [[-130, -40], [-128, -10], [-122, 0]], [[60, 40], [70, 70], [60, 110], [30, 124]], [[-40, -60], [-70, -75], [-90, -95]], [[90, -50], [120, -70], [150, -80]]];
  const RIVER = [[-200, -10], [-172, 40], [-142, 82], [-100, 110], [-40, 124], [20, 128], [80, 122], [128, 104], [168, 84], [205, 70]];
  const LAWNS = [[-40, 40, 26, 26], [30, 42, 26, 26], [-42, -40, 22, 16], [32, 58, 0, 0], [-38, 88, 24, 30], [30, 88, 24, 30]];
  function catmull(pts, seg = 8) { const v = pts.map(([x, z]) => new THREE.Vector3(x, 0, z)); return new THREE.CatmullRomCurve3(v).getPoints(Math.max(2, (pts.length - 1) * seg)).map(p => [p.x, p.z]) }
  function groundTexture(season) {
    const c = document.createElement('canvas'), SC = 5; c.width = GW * SC; c.height = GD * SC; const x = c.getContext('2d'), P = (X, Z) => [(X + GW / 2) * SC, (Z + GD / 2) * SC], r = K().rng(7);
    const winter = season === 'hiver', base = winter ? '#dfe6ea' : season === 'automne' ? '#7d8a3c' : season === 'ete' ? '#6d9138' : '#5f9138';
    x.fillStyle = base; x.fillRect(0, 0, c.width, c.height);
    for (let i = 0; i < 2600; i++) { const [px, py] = [r() * c.width, r() * c.height], rr = 8 + r() * 60; x.globalAlpha = .08 + r() * .1; x.fillStyle = winter ? (r() < .5 ? '#ffffff' : '#c8d4da') : (r() < .5 ? '#86a948' : r() < .5 ? '#4a7a2a' : '#9aa84e'); x.beginPath(); x.ellipse(px, py, rr, rr * (.5 + r() * .5), r() * 3, 0, 6.3); x.fill() }
    x.globalAlpha = 1;
    // pelouses tondues en bandes
    for (const [X, Z, w, d] of LAWNS) { if (!w) continue; const [a, b] = P(X - w / 2, Z - d / 2); x.fillStyle = winter ? '#eef2f4' : '#6fa640'; x.fillRect(a, b, w * SC, d * SC); x.globalAlpha = .18; x.fillStyle = winter ? '#d4dde2' : '#8cc255'; for (let k = 0; k < w; k += 4) x.fillRect(a + k * SC, b, 2 * SC, d * SC); x.globalAlpha = 1 }
    const road = (pts, w, col, edge) => { const q = catmull(pts); x.lineCap = x.lineJoin = 'round'; x.beginPath(); q.forEach(([X, Z], i) => { const [a, b] = P(X, Z); i ? x.lineTo(a, b) : x.moveTo(a, b) }); x.strokeStyle = edge; x.lineWidth = (w + 1.4) * SC; x.stroke(); x.strokeStyle = col; x.lineWidth = w * SC; x.stroke() };
    // rivière (lit sombre sous l'eau), allées, place de la fontaine, cour du haras
    road(RIVER, 22, '#3d5a4a', '#6a6a4a');
    ROADS.forEach((p, i) => road(p, i < 2 ? 9 : 6, winter ? '#e8e0d0' : '#d9c28c', winter ? '#cfc6b6' : '#a98f5e'));
    x.fillStyle = winter ? '#e8e0d0' : '#dcc592'; { const [a, b] = P(-6, 14); x.beginPath(); x.arc(a, b, 17 * SC, 0, 6.3); x.fill() } { const [a, b] = P(-45, -1); x.fillRect(a, b, 80 * SC, 9 * SC) }
    // sable : carrière, piste de l'hippodrome (anneau), stalles
    const [ca, cb] = P(B.carriere[0], B.carriere[1]); x.save(); x.translate(ca, cb); x.rotate(B.carriere[3] * -1); x.fillStyle = '#c9955a'; x.beginPath(); x.roundRect(-30 * SC, -16 * SC, 60 * SC, 32 * SC, 6 * SC); x.fill(); x.restore();
    const [ha, hb] = P(B.hippodrome[0], B.hippodrome[1]); x.save(); x.translate(ha, hb); x.fillStyle = '#c7925a'; x.beginPath(); x.ellipse(0, 0, 62 * SC, 32 * SC, 0, 0, 6.3); x.fill(); x.fillStyle = winter ? '#eef2f4' : '#72a843'; x.beginPath(); x.ellipse(0, 0, 50.5 * SC, 21.5 * SC, 0, 0, 6.3); x.fill();
    x.globalAlpha = .25; x.strokeStyle = '#e4bc84'; x.lineWidth = 2 * SC; x.beginPath(); x.ellipse(0, 0, 56 * SC, 26.5 * SC, 0, 0, 6.3); x.stroke(); x.restore(); x.globalAlpha = 1;
    // paddocks : herbe plus sombre et broutée
    const [pa, pb] = P(B.paddocks[0], B.paddocks[1]); x.fillStyle = winter ? '#e2e8ec' : '#5c8a33'; x.fillRect(pa - 30 * SC, pb - 16 * SC, 60 * SC, 32 * SC);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t
  }
  // ---------- montage de la scène ----------
  function build() {
    const Q = QUALITY[settings.level()], season = villageVie.season(), kit = K();
    S = new THREE.Scene(); S.background = new THREE.Color(0x9cc4e4); S.fog = new THREE.Fog(0x9cc4e4, 380, 900);
    const hemi = new THREE.HemisphereLight(0xdcebff, 0x3a4a26, 1.25), sun = new THREE.DirectionalLight(0xfff2dc, 3); sun.castShadow = !!Q.shadow; sun.shadow.mapSize.set(Q.shadow || 1024, Q.shadow || 1024); sun.shadow.bias = -.0005; sun.shadow.normalBias = .05;
    S.add(hemi, sun, sun.target); T = { hemi, sun, bmats: {}, glows: [], lamps: null, season };
    // sol
    const gm = new THREE.MeshStandardMaterial({ map: groundTexture(season), roughness: 1 });
    gm.onBeforeCompile = s => { s.vertexShader = 'varying vec3 vW;\n' + s.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvW=(modelMatrix*vec4(position,1.)).xyz;');
      s.fragmentShader = 'varying vec3 vW;float gh(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}float gn(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(gh(i),gh(i+vec2(1,0)),f.x),mix(gh(i+vec2(0,1)),gh(i+vec2(1,1)),f.x),f.y);}\n' +
        s.fragmentShader.replace('#include <map_fragment>', '#include <map_fragment>\n{float n=gn(vW.xz*1.3)*.5+gn(vW.xz*5.)*.3+gn(vW.xz*.2)*.2;diffuseColor.rgb*=mix(.86,1.1,n);}') };
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(GW, GD).rotateX(-Math.PI / 2), gm); ground.receiveShadow = true; S.add(ground);
    const far = new THREE.Mesh(new THREE.PlaneGeometry(2400, 2400).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ color: season === 'hiver' ? 0xd8e0e6 : 0x3f6a2a, roughness: 1 })); far.position.y = -.05; S.add(far);
    // bâtiments (un maillage et un matériau par bâtiment, pour la surbrillance)
    const lv = id => { try { return dlv(id) } catch (e) { return 1 } }, pick = [];
    const makers = { haras, ecurie, clinique, moulin, chantier, carriere, paddocks, hippodrome }, fenceP = [];
    T.blds = {};
    for (const id of VILLAGE.order) {
      const [x, z, , ry] = B[id], g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; S.add(g);
      const r = makers[id](lv(id)), mat = bldMat(); T.bmats[id] = mat;
      if (r.P.length) { const m = mesh(r.P, mat); m.userData.id = id; g.add(m); pick.push(m) }
      if (r.fence) fences(r.fence, new THREE.Matrix4().compose(g.position, new THREE.Quaternion().setFromEuler(g.rotation), new THREE.Vector3(1, 1, 1)), fenceP);
      if (r.extra) r.extra(g);
      if (r.sP) { sails = new THREE.Mesh(kit.merge(r.sP), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .8 })); sails.position.set(0, 16, 5.6); sails.castShadow = true; g.add(sails) }
      (r.flags || []).forEach(([fx, fy, fz], k) => { const f = kit.flagMesh(k % 2 ? C.red : C.navy, C.gold, 3.2, 2); f.position.set(fx, fy + 3.5, fz); f.scale.setScalar(1); g.add(f) });
      // anneau doré au sol pour la sélection
      const ring = new THREE.Mesh(new THREE.RingGeometry(1, 1.12, 64).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0xffd66b, transparent: true, opacity: 0, depthWrite: false })); const rr = { hippodrome: 66, carriere: 34, paddocks: 34, haras: 40 }[id] || 26; ring.scale.setScalar(rr); ring.position.y = .15; g.add(ring);
      T.blds[id] = { g, ring, lv: lv(id), top: B[id][2] }
    }
    T.pick = pick;
    fences([rect(112, 4, 27, 13)], new THREE.Matrix4(), fenceP);
    if (fenceP.length) { const f = new THREE.Mesh(kit.merge(fenceP), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .6 })); f.castShadow = true; f.receiveShadow = true; S.add(f) }
    decor(season, Q);
    buildHorses();
    built = true
  }
  // ---------- décor : rivière, ponts, fontaine, réverbères, haies, arbres ----------
  function decor(season, Q) {
    const kit = K(), P = [], r = kit.rng(31);
    // rivière : ruban d'eau animé et rochers sur les berges
    const q = catmull(RIVER, 10), pos = [], idx = [];
    q.forEach(([x, z], i) => { const a = q[Math.max(0, i - 1)], b = q[Math.min(q.length - 1, i + 1)], dx = b[0] - a[0], dz = b[1] - a[1], L = Math.hypot(dx, dz) || 1, nx = -dz / L, nz = dx / L, w = 9 + Math.sin(i * .37) * 1.5; pos.push(x + nx * w, .06, z + nz * w, x - nx * w, .06, z - nz * w); if (i) { const k = (i - 1) * 2; idx.push(k, k + 2, k + 1, k + 1, k + 2, k + 3) } });
    const wg = new THREE.BufferGeometry(); wg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); wg.setIndex(idx); wg.computeVertexNormals();
    const wm = new THREE.MeshStandardMaterial({ color: 0x3f6f86, roughness: .06, metalness: .4 }); wm.userData.u = raceWorld.uniforms;
    wm.onBeforeCompile = s => { s.uniforms.uTime = raceWorld.uniforms.uTime; s.vertexShader = 'varying vec3 vW2;\n' + s.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvW2=(modelMatrix*vec4(position,1.)).xyz;');
      s.fragmentShader = 'uniform float uTime;varying vec3 vW2;\n' + s.fragmentShader.replace('#include <normal_fragment_maps>', '#include <normal_fragment_maps>\n{vec2 p=vW2.xz;normal=normalize(normal+vec3(sin(p.x*.8+uTime*1.6)*.05+sin(p.y*1.3-uTime*1.2)*.04,0.,cos(p.y*.9+uTime*1.3)*.05));}')
        .replace('#include <color_fragment>', '#include <color_fragment>\n{float f=fract(sin(dot(floor(vW2.xz*1.5),vec2(12.9,78.2)))*43758.5);diffuseColor.rgb+=vec3(.6,.7,.75)*step(.985,f)*(.5+.5*sin(uTime*3.+f*40.));}') };
    const water = new THREE.Mesh(wg, wm); water.receiveShadow = true; S.add(water);
    const rocks = []; for (let i = 0; i < q.length; i += 2) for (const s of [1, -1]) if (r() < .55) { const a = q[Math.max(0, i - 1)], b = q[Math.min(q.length - 1, i + 1)], dx = b[0] - a[0], dz = b[1] - a[1], L = Math.hypot(dx, dz) || 1; rocks.push([q[i][0] - dz / L * s * (10 + r() * 2), q[i][1] + dx / L * s * (10 + r() * 2), .6 + r() * 1.6]) }
    const rm = new THREE.InstancedMesh(new THREE.DodecahedronGeometry(1, 0), new THREE.MeshStandardMaterial({ color: 0x8a8a80, roughness: .95, flatShading: true }), rocks.length);
    rocks.forEach(([x, z, s], i) => rm.setMatrixAt(i, M(x, s * .2, z, r() * 6, s, s * .6, s))); rm.instanceMatrix.needsUpdate = true; rm.castShadow = rm.receiveShadow = true; S.add(rm);
    // ponts de pierre en arc (avenue principale, est)
    for (const [x, z, ry] of [[-6, 126, 0], [150, 94, -.4], [-150, 70, .9]]) { const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; const bp = [];
      for (let k = 0; k <= 8; k++) { const t = k / 8, y = Math.sin(t * Math.PI) * 2.2; bp.push({ g: bx(11, .8, 3.4), m: M(0, y + .3, -12 + t * 24, 0), c: C.stone }) }
      for (const s of [-1, 1]) for (let k = 0; k <= 8; k++) { const t = k / 8, y = Math.sin(t * Math.PI) * 2.2; bp.push({ g: bx(.6, 1.2, 3.2), m: M(s * 5.4, y + 1.2, -12 + t * 24), c: C.trim }) }
      g.add(mesh(bp, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .9 }))); S.add(g) }
    // fontaine : bassins, colonne, gerbe d'eau animée
    { const fP = []; part(fP, new THREE.CylinderGeometry(8, 8.4, 1, 32), 0, .5, 0, C.stone); part(fP, new THREE.CylinderGeometry(1.4, 1.8, 4, 12), 0, 2.5, 0, C.trim); part(fP, new THREE.CylinderGeometry(3.4, 2.6, .7, 20), 0, 4.2, 0, C.stone); part(fP, new THREE.CylinderGeometry(.5, .7, 2, 10), 0, 5.5, 0, C.trim); part(fP, new THREE.SphereGeometry(.9, 12, 8), 0, 7, 0, C.gold);
      const g = mesh(fP, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .7 })); g.position.set(-6, 0, 14); S.add(g);
      const pool = new THREE.Mesh(new THREE.CircleGeometry(7.4, 32).rotateX(-Math.PI / 2), wm); pool.position.set(-6, .9, 14); S.add(pool);
      const jm = new THREE.MeshStandardMaterial({ color: 0xdff2ff, transparent: true, opacity: .55, roughness: .1, depthWrite: false });
      jm.onBeforeCompile = s => { s.uniforms.uTime = raceWorld.uniforms.uTime; s.vertexShader = 'uniform float uTime;varying float vJ;\n' + s.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvJ=fract(position.y*.35-uTime*1.4);transformed.xz*=1.+.08*sin(uTime*6.+position.y*3.);');
        s.fragmentShader = 'varying float vJ;\n' + s.fragmentShader.replace('#include <color_fragment>', '#include <color_fragment>\ndiffuseColor.a*=.45+.55*smoothstep(.2,.8,vJ);') };
      fountainW = new THREE.Mesh(new THREE.CylinderGeometry(3.2, .3, 3, 20, 4, true).translate(0, 5.8, 0), jm); fountainW.position.set(-6, 0, 14); S.add(fountainW) }
    // réverbères de l'avenue et de la place (lanternes allumées le soir et la nuit)
    const lampPos = []; for (const z of [30, 45, 60, 75, 90, 105]) for (const s of [-1, 1]) lampPos.push([-6 + s * 7, z]); for (let k = 0; k < 8; k++) { const a = k / 8 * 6.283 + .4; lampPos.push([-6 + Math.cos(a) * 18.5, 14 + Math.sin(a) * 18.5]) }
    const lp = []; lampPos.forEach(([x, z]) => { lp.push({ g: new THREE.CylinderGeometry(.14, .2, 4.4, 6), m: M(x, 2.2, z), c: 0x222222 }, { g: bx(.7, .9, .7), m: M(x, 4.7, z), c: 0xffe6a8, glow: 1 }, { g: new THREE.ConeGeometry(.6, .5, 4).rotateY(Math.PI / 4), m: M(x, 5.35, z), c: 0x222222 }) });
    const lm = bldMat(); T.lampMat = lm; S.add(mesh(lp, lm));
    const halo = new THREE.SpriteMaterial({ map: glowTex(), color: 0xffc46b, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0 }); T.halo = halo;
    lampPos.forEach(([x, z]) => { const s = new THREE.Sprite(halo); s.position.set(x, 4.7, z); s.scale.setScalar(6); S.add(s) });
    // haies et massifs fleuris autour des pelouses et le long de l'avenue
    const hedges = [], flowers = [];
    for (const [X, Z, w, d] of LAWNS) { if (!w) continue; for (let t = 0; t < 1; t += 1 / Math.round((w + d) / 2.2)) { const per = (w + d) * 2, s = t * per; let x, z; if (s < w) { x = X - w / 2 + s; z = Z - d / 2 } else if (s < w + d) { x = X + w / 2; z = Z - d / 2 + s - w } else if (s < 2 * w + d) { x = X + w / 2 - (s - w - d); z = Z + d / 2 } else { x = X - w / 2; z = Z + d / 2 - (s - 2 * w - d) } if (Math.abs(x + 6) > 6) hedges.push([x, z]) } }
    for (let x = -42; x <= 30; x += 6) if (Math.abs(x + 6) > 8) flowers.push([x, 6.5]);
    for (const z of [36, 50, 64, 78, 92]) for (const s of [-1, 1]) flowers.push([-6 + s * 10.5, z]);
    const lf = kit.leafMat(), hm = new THREE.InstancedMesh(kit.fluffy(new THREE.IcosahedronGeometry(1.2, 1).scale(1.4, .8, 1.4), 0, 0, 0, .6).translate(0, .8, 0), lf, hedges.length);
    hedges.forEach(([x, z], i) => { hm.setMatrixAt(i, M(x, 0, z, r() * 3, .9 + r() * .3)); hm.setColorAt(i, new THREE.Color(season === 'hiver' ? 0x5d7a5a : 0x3f6a2a).multiplyScalar(.85 + r() * .3)) }); hm.instanceMatrix.needsUpdate = true; hm.instanceColor.needsUpdate = true; hm.castShadow = hm.receiveShadow = true; S.add(hm);
    const FL = [0xc8324a, 0xf2d24a, 0xf4f0ea, 0xa04ab8, 0xf08a3a], fm = new THREE.InstancedMesh(kit.fluffy(new THREE.IcosahedronGeometry(1, 1).scale(1.8, .55, 1), 0, 0, 0, .5).translate(0, .45, 0), new THREE.MeshStandardMaterial({ roughness: .9 }), flowers.length);
    flowers.forEach(([x, z], i) => { fm.setMatrixAt(i, M(x, 0, z, 0, 1)); fm.setColorAt(i, new THREE.Color(season === 'hiver' ? 0xeef2f4 : FL[i % FL.length])) }); fm.instanceMatrix.needsUpdate = true; fm.instanceColor.needsUpdate = true; S.add(fm);
    trees(season, Q); smokeAndBirds()
  }
  // fumées de cheminées et vols d'oiseaux
  function smokeAndBirds() {
    const tex = glowTex(), SM = []; T.smoke = SM;
    for (const [x, y, z] of [[-19, 18.6, -14], [21, 18.6, -10], [-127, 11, 2]]) for (let k = 0; k < 9; k++) { const m = new THREE.SpriteMaterial({ map: tex, color: 0xf2efe8, transparent: true, depthWrite: false, opacity: 0 }), sp = new THREE.Sprite(m); S.add(sp); SM.push({ sp, x, y, z, t: k / 9 }) }
    const n = 7, pos = new Float32Array(n * 9), g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const birds = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: 0x2a2320, side: THREE.DoubleSide })); birds.frustumCulled = false; S.add(birds); T.birds = { g, pos, n, t0: -99, dir: 1, z: 0 }
  }
  function stepLife(dt, t) {
    const night = T.tod === 'nuit';
    for (const s of T.smoke) { s.t = (s.t + dt / 7) % 1; const k = s.t; s.sp.position.set(s.x + k * 6, s.y + k * 12, s.z - k * 3); s.sp.scale.setScalar(1.5 + k * 7); s.sp.material.opacity = Math.sin(k * Math.PI) * (night ? .12 : .32) }
    const B_ = T.birds, P = B_.pos; if (t - B_.t0 > 26) { B_.t0 = t; B_.dir = Math.random() < .5 ? 1 : -1; B_.z = -90 + Math.random() * 180; B_.y = 38 + Math.random() * 20 }
    const u = (t - B_.t0) / 22, cx = B_.dir * (-260 + u * 520);
    for (let i = 0; i < B_.n; i++) { const row = Math.ceil(i / 2), side = i % 2 ? 1 : -1, x = cx - B_.dir * row * 5, z = B_.z + side * row * 4, y = B_.y + Math.sin(t * 1.3 + i) * .8, f = Math.sin(t * 9 + i * 1.7) * 1.2, o = i * 9;
      P.set([x - B_.dir * 1.2, y + f, z - 1.8, x + B_.dir * .6, y, z, x - B_.dir * 1.2, y + f, z + 1.8], o) } B_.g.attributes.position.needsUpdate = true
  }
  function glowTex() { const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d'), g = x.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(.25, 'rgba(255,220,160,.55)'); g.addColorStop(1, 'rgba(255,200,120,0)'); x.fillStyle = g; x.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c) }
  // arbres : forêt de conifères autour du domaine, feuillus et peupliers entre les bâtiments (jamais sur une allée, un bâtiment ou l'eau)
  function trees(season, Q) {
    const kit = K(), r = kit.rng(4242), G = kit.treeGeos(), dens = !Q.shadow ? .5 : Q.shadow < 2048 ? .8 : 1, list = [[], [], []];
    const segs = []; for (const p of ROADS) { const q = catmull(p, 4); for (let i = 0; i < q.length - 1; i++) segs.push([q[i], q[i + 1], 6]) } { const q = catmull(RIVER, 4); for (let i = 0; i < q.length - 1; i++) segs.push([q[i], q[i + 1], 14]) }
    const dseg = (x, z, [a, b]) => { const dx = b[0] - a[0], dz = b[1] - a[1], t = Math.max(0, Math.min(1, ((x - a[0]) * dx + (z - a[1]) * dz) / (dx * dx + dz * dz || 1))); return Math.hypot(x - a[0] - dx * t, z - a[1] - dz * t) };
    const FOOT = { haras: [48, 22], hippodrome: [70, 46], carriere: [38, 24], clinique: [26, 16], ecurie: [32, 26], chantier: [22, 18], moulin: [42, 16], paddocks: [36, 24] };
    const blocked = (x, z) => { for (const id in B) { const [bx_, bz] = B[id], [w, d] = FOOT[id]; if (Math.abs(x - bx_ - (id === 'moulin' ? 14 : 0)) < w && Math.abs(z - bz) < d) return true }
      if (Math.hypot(x + 6, z - 14) < 22) return true; for (const [X, Z, w, d] of LAWNS) if (w && Math.abs(x - X) < w / 2 + 2 && Math.abs(z - Z) < d / 2 + 2) return true; for (const s of segs) if (dseg(x, z, s) < s[2] + 1.5) return true; return false };
    // forêt extérieure (conifères surtout)
    for (let i = 0; i < 1400 * dens; i++) { const x = (r() - .5) * GW * 1.25, z = (r() - .5) * GD * 1.3, e = Math.pow(Math.abs(x) / 175, 4) + Math.pow(Math.abs(z) / 128, 4); if (e < 1 || blocked(x, z)) continue; list[r() < .78 ? 2 : 0].push([x, z, .55 + r() * .4]) }
    // bosquets à l'intérieur
    for (let i = 0; i < 700 * dens; i++) { const x = (r() - .5) * 340, z = (r() - .5) * 250, e = Math.pow(Math.abs(x) / 175, 4) + Math.pow(Math.abs(z) / 128, 4); if (e >= 1 || r() < .45 || blocked(x, z)) continue; list[r() < .5 ? 0 : r() < .6 ? 2 : 1].push([x, z, .4 + r() * .3]) }
    const bark = new THREE.MeshStandardMaterial({ color: 0x5b4633, roughness: 1 }), leaf = kit.leafMat(), c = new THREE.Color();
    const GREENS = season === 'automne' ? [[0xc2702a, 0xd9a03a, 0x9c4a22, 0x7f8a30], [0xd9b040, 0xc89a30], [0x2f5230, 0x3a5e36]] : season === 'hiver' ? [[0x8a8f86, 0x9a9690], [0x8c9088], [0x3e5a44, 0x4a664e]] : [[0x4f7a2e, 0x3f6a28, 0x6a8f3a, 0x587f30], [0x5d8a35, 0x4c7a2c], [0x2f5230, 0x3a5e36, 0x28482a]];
    for (let k = 0; k < 3; k++) { const L = list[k]; if (!L.length) continue; const cr = new THREE.InstancedMesh(G[k].crown, leaf, L.length), tr = new THREE.InstancedMesh(G[k].trunk, bark, L.length);
      L.forEach(([x, z, s], i) => { const m = M(x, 0, z, r() * 6.28, s, s * (.9 + r() * .25), s); cr.setMatrixAt(i, m); tr.setMatrixAt(i, m); cr.setColorAt(i, c.set(GREENS[k][(r() * GREENS[k].length) | 0]).multiplyScalar(.85 + r() * .3)) });
      for (const o of [cr, tr]) { o.castShadow = !!Q.shadow; o.receiveShadow = true; o.instanceMatrix.needsUpdate = true; S.add(o) } cr.instanceColor.needsUpdate = true }
  }
  // ---------- chevaux ----------
  function buildHorses() {
    const H = []; let liv0; try { liv0 = champion.get() } catch (e) { liv0 = { coat: 'alezan', main: '#c21c27', second: '#f4f2ec', pattern: 'chevrons', cap: '#f4f2ec', name: 'Champion' } }
    const riders = [liv0, (typeof VALMONT !== 'undefined' && VALMONT.livery) || { coat: 'noir', main: '#111', second: '#c9a13c', pattern: 'uni', cap: '#c9a13c' }, { coat: 'gris', main: '#1f5fbf', second: '#ffffff', pattern: 'croix', cap: '#ffffff', name: 'Brume' }, { coat: 'bai', main: '#f2c230', second: '#1d6b3a', pattern: 'bretelles', cap: '#1d6b3a', name: 'Soleil' }, { coat: 'baibrun', main: '#7a1f5c', second: '#f4f2ec', pattern: 'etoile', cap: '#7a1f5c', name: 'Prune' }];
    // trois chevaux au galop sur la piste de l'hippodrome
    riders.slice(0, 3).forEach((l, i) => H.push({ kind: 'track', liv: l, s: i * 60 + 10, lane: 56 - i * 2.2, sp: 15 + i * .8 }));
    // deux cavaliers au petit galop dans la carrière
    riders.slice(3, 5).forEach((l, i) => H.push({ kind: 'arena', liv: l, a: i * Math.PI, sp: .26 }));
    // chevaux en liberté : paddocks et pré de l'écurie
    const FREE = [['bai', 0], ['alezan', 0], ['gris', 1], ['noir', 1], ['palomino', 2], ['alezan', 2]];
    FREE.forEach(([coat, f], i) => H.push({ kind: 'free', liv: { coat, main: '#000', second: '#000', pattern: 'uni', cap: '#000', name: 'Libre' + i }, f, x: 0, z: 0, tx: 0, tz: 0, st: 'graze', until: 0, ph: i * .3 }));
    const FIELDS = [[-107, 62, 10, 11], [-77, 62, 10, 11], [112, 4, 12, 5]];
    // chevaux plus grands que nature (comme sur la peinture) pour rester lisibles à l'échelle du domaine
    H.forEach((h, i) => { h.m = HORSE3D.build(h.liv, { lod: 2, free: h.kind === 'free', number: i + 1, seed: h.liv.name }); h.m.scale.setScalar(2.4); S.add(h.m); h.p = Math.random();
      if (h.kind === 'free') { const F = FIELDS[h.f]; h.F = F; h.x = F[0] + (Math.random() - .5) * F[2]; h.z = F[1] + (Math.random() - .5) * F[3]; h.tx = h.x; h.tz = h.z; h.yaw = Math.random() * 6.28 } });
    horses = H; HORSE3D.ready(2).then(() => horses.forEach(h => h.m.traverse(o => { if (o.isMesh) o.castShadow = true })))
  }
  function stepHorses(dt, t) {
    const [hx, hz] = B.hippodrome, [ax, az, , ar] = B.carriere;
    for (const h of horses) {
      let x, z, yaw, run, g = 0, rate;
      if (h.kind === 'track') { h.s = (h.s + h.sp * dt) % 1e6; const L = 2 * Math.PI * Math.sqrt((h.lane ** 2 + (h.lane * .5) ** 2) / 2), a = -(h.s / L) * 6.2832, rx = h.lane, rz = h.lane * .5 - 2; x = hx + Math.cos(a) * rx; z = hz + Math.sin(a) * rz; const dx = Math.sin(a) * rx, dz = -Math.cos(a) * rz; yaw = Math.atan2(-dz, dx); run = 1; rate = 2.3 }
      else if (h.kind === 'arena') { h.a -= h.sp * dt; const c = Math.cos(h.a), s = Math.sin(h.a), lx = c * 22, lz = s * 10, ca = Math.cos(-ar), sa = Math.sin(-ar); x = ax + lx * ca - lz * sa; z = az + lx * sa + lz * ca; const tx = -s * 22, tz = -c * 10, wx = tx * ca - tz * sa, wz = tx * sa + tz * ca; yaw = Math.atan2(wz, -wx) + Math.PI; run = .62; rate = 1.7 }
      else {
        if (t > h.until) { const r = Math.random(); if (r < .45) { h.st = 'walk'; h.tx = h.F[0] + (Math.random() - .5) * h.F[2] * 1.6; h.tz = h.F[1] + (Math.random() - .5) * h.F[3] * 1.6; h.until = t + 20 } else { h.st = r < .85 ? 'graze' : 'idle'; h.until = t + 4 + Math.random() * 9 } }
        if (h.st === 'walk') { const dx = h.tx - h.x, dz = h.tz - h.z, d = Math.hypot(dx, dz); if (d < 1) { h.st = 'graze'; h.until = t + 5 + Math.random() * 6 } else { const want = Math.atan2(-dz, dx); let dy = ((want - h.yaw + Math.PI * 3) % (Math.PI * 2)) - Math.PI; h.yaw += Math.max(-1, Math.min(1, dy)) * dt * 1.8; if (Math.abs(dy) < .6) { h.x += Math.cos(h.yaw) * 3 * dt; h.z -= Math.sin(h.yaw) * 3 * dt } } }
        x = h.x; z = h.z; yaw = h.yaw; run = h.st === 'walk' ? .28 : 0; g = h.st === 'graze' ? 1 : 0; rate = .9
      }
      h.gz = (h.gz || 0) + (g - (h.gz || 0)) * Math.min(1, dt * 1.5);
      h.p = (h.p + dt * rate) % 1; h.m.position.set(x, 0, z); h.m.rotation.y = yaw; HORSE3D.pose(h.m, h.p, run, 0, h.gz)
    }
  }
  // ---------- lumière selon l'heure, saison ----------
  const TOD = { matin: { sun: [0xffd9a8, 2.6, 180, 90, 120], hemi: [0xcfe3ff, 0x4a5a36, 1.1], bg: 0xbcd6ec, night: 0 }, jour: { sun: [0xfff2dc, 3, -120, 260, 150], hemi: [0xdcebff, 0x3a4a26, 1.25], bg: 0x9cc4e4, night: 0 },
    soir: { sun: [0xffa060, 2.5, -220, 80, 90], hemi: [0xffc89a, 0x4a3418, 1], bg: 0xe8a878, night: .55 }, nuit: { sun: [0x9fb8ff, .65, -80, 260, 160], hemi: [0x2a3a66, 0x0a0f18, .5], bg: 0x0b1530, night: 1 } };
  function light() {
    const k = document.body.dataset.tod || 'jour', A = TOD[k] || TOD.jour; if (T.tod === k) return; T.tod = k;
    T.sun.color.set(A.sun[0]); T.sun.intensity = A.sun[1]; T.sunDir = new THREE.Vector3(A.sun[2], A.sun[3], A.sun[4]).normalize(); T.hemi.color.set(A.hemi[0]); T.hemi.groundColor.set(A.hemi[1]); T.hemi.intensity = A.hemi[2];
    S.background.set(A.bg); S.fog.color.set(A.bg); for (const id in T.bmats) T.bmats[id].userData.u.uNight.value = A.night; T.lampMat.userData.u.uNight.value = A.night; T.halo.opacity = A.night * .85
  }
  // ---------- caméra ----------
  function camera() {
    const Wd = world.clientWidth, Hd = world.clientHeight; if (!cam) cam = new THREE.PerspectiveCamera(42, 1, 1, 2500);
    if (R.__w !== Wd || R.__h !== Hd) { R.__w = Wd; R.__h = Hd; R.setSize(Wd, Hd, false); cam.aspect = Wd / Math.max(1, Hd); cam.fov = cam.aspect < .8 ? 52 : 42; cam.updateProjectionMatrix() }
    const k = (W3.dist - 45) / (330 - 45), pitch = (.62 + .38 * Math.max(0, Math.min(1, k))) * .98;
    cam.position.set(W3.tx + Math.sin(W3.yaw) * Math.cos(pitch) * W3.dist, Math.sin(pitch) * W3.dist, W3.tz + Math.cos(W3.yaw) * Math.cos(pitch) * W3.dist); cam.lookAt(W3.tx, 0, W3.tz);
    // ombres : la zone du soleil suit ce que l'on regarde
    const sp = Math.min(260, W3.dist * 1.1), sc = T.sun.shadow.camera; if (sc.right !== sp) { sc.left = sc.bottom = -sp; sc.right = sc.top = sp; sc.near = 1; sc.far = 900; sc.updateProjectionMatrix() }
    T.sun.target.position.set(W3.tx, 0, W3.tz); T.sun.target.updateMatrixWorld(); T.sun.position.set(W3.tx, 0, W3.tz).addScaledVector(T.sunDir, 420)
  }
  const clampT = () => { W3.tx = Math.max(-165, Math.min(165, W3.tx)); W3.tz = Math.max(-130, Math.min(125, W3.tz)); W3.dist = Math.max(45, Math.min(330, W3.dist)) };
  function pan(dx, dy) { const k = 2 * Math.tan(cam.fov * Math.PI / 360) * W3.dist / Math.max(1, world.clientHeight), c = Math.cos(W3.yaw), s = Math.sin(W3.yaw); W3.tx -= (dx * c + dy * s * 1.25) * k; W3.tz -= (-dx * s + dy * c * 1.25) * k; clampT() }
  // ---------- étiquettes, minuteurs, bulles : repris du village et placés par projection ----------
  let ui = null, moved = [];
  function adopt() {
    ui = document.createElement('div'); ui.id = 'd3ui'; world.appendChild(ui); moved = [];
    const E = village.els; for (const id of VILLAGE.order) { const e = E[id]; for (const el of [e.tag, e.timer, e.hit]) if (el) { moved.push([el, el.style.cssText, id]); ui.appendChild(el) } }
    $$('#map .bld-harvest').forEach(el => { const id = Object.keys(VILLAGE.buildings).find(k => Math.abs(parseFloat(el.style.left) - VILLAGE.buildings[k].cx * 100) < .01); moved.push([el, el.style.cssText, id]); ui.appendChild(el) })
  }
  function release() { const map = $('#map'); for (const [el, css] of moved) { el.style.cssText = css; map.appendChild(el) } moved = []; ui && ui.remove(); ui = null }
  const V3 = new THREE.Vector3();
  function placeUI() {
    const Wd = world.clientWidth, Hd = world.clientHeight;
    for (const [el, , id] of moved) { if (!id) continue; const b = B[id], harvest = el.classList.contains('bld-harvest'), hit = el.classList.contains('bld-hit'); V3.set(b[0], harvest ? b[2] * .55 : hit ? b[2] * .4 : b[2] + 2, b[1]).project(cam);
      const x = (V3.x * .5 + .5) * Wd, y = (-V3.y * .5 + .5) * Hd, off = V3.z > 1 || x < -80 || x > Wd + 80 || y < -40 || y > Hd + 80;
      el.style.left = x.toFixed(1) + 'px'; el.style.top = Math.max(harvest ? 60 : 96, y).toFixed(1) + 'px'; el.style.visibility = off ? 'hidden' : ''; if (hit) { el.style.width = '64px'; el.style.height = '64px'; el.style.marginLeft = el.style.marginTop = '-32px' } }
  }
  // ---------- entrées ----------
  const pts = new Map(); let drag = null, pinch = null, lastMove = 0, hover = null;
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  function pickAt(cx, cy) { const r = R.domElement.getBoundingClientRect(); ndc.set((cx - r.left) / r.width * 2 - 1, -((cy - r.top) / r.height) * 2 + 1); ray.setFromCamera(ndc, cam); const h = ray.intersectObjects(T.pick, false)[0]; if (h) return h.object.userData.id;
    // à défaut, le bâtiment dont l'emprise au sol est sous le doigt
    const p = new THREE.Vector3(); if (!ray.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), p)) return null; let best = null, bd = 1e9; for (const id in B) { const d = Math.hypot(p.x - B[id][0], p.z - B[id][1]); if (d < ({ hippodrome: 60, carriere: 30, paddocks: 32 }[id] || 20) && d < bd) { bd = d; best = id } } return best }
  function input(cv) {
    const stop = e => e.stopPropagation();
    cv.addEventListener('contextmenu', e => e.preventDefault());
    cv.addEventListener('pointerdown', e => { stop(e); cv.setPointerCapture(e.pointerId); pts.set(e.pointerId, { x: e.clientX, y: e.clientY }); W3.vx = W3.vz = 0; W3.goal = null;
      if (pts.size === 1) drag = { x: e.clientX, y: e.clientY, moved: false, rot: e.button === 2 || e.shiftKey }; else if (pts.size === 2) { const [a, b] = [...pts.values()]; pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), dist: W3.dist, ang: Math.atan2(b.y - a.y, b.x - a.x), yaw: W3.yaw, mx: (a.x + b.x) / 2, my: (a.y + b.y) / 2 }; if (drag) drag.moved = true } });
    cv.addEventListener('pointermove', e => { stop(e); const p = pts.get(e.pointerId); if (!p) { if (e.pointerType === 'mouse') { const id = pickAt(e.clientX, e.clientY); if (id !== hover) { hover = id; world.classList.toggle('over-bld', !!id) } } return }
      const dx = e.clientX - p.x, dy = e.clientY - p.y; p.x = e.clientX; p.y = e.clientY;
      if (pinch && pts.size === 2) { const [a, b] = [...pts.values()], d = Math.hypot(a.x - b.x, a.y - b.y), ang = Math.atan2(b.y - a.y, b.x - a.x), mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2; W3.dist = pinch.dist * pinch.d / Math.max(20, d); W3.yaw = pinch.yaw - (ang - pinch.ang); pan(mx - pinch.mx, my - pinch.my); pinch.mx = mx; pinch.my = my; clampT(); return }
      if (!drag) return; if (!drag.moved && Math.hypot(e.clientX - drag.x, e.clientY - drag.y) > 7) { drag.moved = true; world.classList.add('dragging') }
      if (drag.moved) { if (drag.rot) W3.yaw -= dx * .006; else { pan(dx, dy); const now = performance.now(), dt = Math.max(1, now - lastMove); W3.vx = dx / dt * 16; W3.vz = dy / dt * 16; lastMove = now } } });
    const end = e => { stop(e); if (!pts.has(e.pointerId)) return; pts.delete(e.pointerId); if (pts.size < 2) pinch = null; if (pts.size) return; world.classList.remove('dragging');
      if (drag && !drag.moved && e.type === 'pointerup') { const id = pickAt(e.clientX, e.clientY); id ? village.select(id) : village.deselect() } else if (drag && performance.now() - lastMove > 80) { W3.vx = W3.vz = 0 } drag = null };
    cv.addEventListener('pointerup', end); cv.addEventListener('pointercancel', end);
    cv.addEventListener('wheel', e => { e.preventDefault(); e.stopPropagation(); W3.goal = null; W3.dist *= Math.exp(e.deltaY * .0012); clampT() }, { passive: false });
    cv.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse' && hover) { hover = null; world.classList.remove('over-bld') } })
  }
  // ---------- boucle ----------
  let selId = null;
  function frame(now) {
    raf = requestAnimationFrame(frame); if (!on) return;
    if ($('#raceScreen').classList.contains('open') || document.hidden) { last = now; return }
    const dt = Math.min(.05, (now - (last || now)) / 1000); last = now; const t = now / 1000;
    raceWorld.uniforms.uTime.value = t; light();
    if (!drag && !pinch && (Math.abs(W3.vx) + Math.abs(W3.vz) > .2)) { pan(W3.vx, W3.vz); W3.vx *= .92; W3.vz *= .92 }
    // sélection : la caméra glisse vers le bâtiment, anneau doré qui pulse, bâtiment éclairé
    const sel = village.selected; if (sel !== selId) { selId = sel; if (sel && B[sel]) W3.goal = { x: B[sel][0], z: B[sel][1] + 6, d: Math.min(W3.dist, sel === 'hippodrome' ? 170 : 115) } }
    if (W3.goal) { const k = 1 - Math.pow(.02, dt); W3.tx += (W3.goal.x - W3.tx) * k; W3.tz += (W3.goal.z - W3.tz) * k; W3.dist += (W3.goal.d - W3.dist) * k; if (Math.hypot(W3.goal.x - W3.tx, W3.goal.z - W3.tz) < .3) W3.goal = null }
    const chk = t > (T.nextChk || 0); if (chk) T.nextChk = t + .5;
    for (const id in T.blds) { const b = T.blds[id], s = id === selId, hv = id === hover; b.ring.material.opacity += ((s ? .55 + .3 * Math.sin(t * 4) : hv ? .35 : 0) - b.ring.material.opacity) * .2; T.bmats[id].userData.u.uHi.value += ((s ? .7 + .3 * Math.sin(t * 4) : hv ? .45 : 0) - T.bmats[id].userData.u.uHi.value) * .2;
      // un bâtiment amélioré ou construit est reconstruit (bannières, Salle des trophées)
      if (!chk) continue; let l = 1; try { l = dlv(id) } catch (e) { } if (l !== b.lv) rebuild(id) }
    if (sails) sails.rotation.z -= dt * .9;
    stepHorses(dt, t); stepLife(dt, t); camera(); R.render(S, cam); placeUI()
  }
  function rebuild(id) {
    const b = T.blds[id], l = dlv(id), r = ({ haras, ecurie, clinique, moulin, chantier, carriere, paddocks, hippodrome })[id](l); b.lv = l;
    for (const c of [...b.g.children]) if (c !== b.ring && c !== sails) { b.g.remove(c); c.geometry && c.geometry.dispose() }
    if (r.P.length) { const m = mesh(r.P, T.bmats[id]); m.userData.id = id; b.g.add(m); T.pick = T.pick.filter(o => o.userData.id !== id).concat(m) }
    (r.flags || []).forEach(([fx, fy, fz], k) => { const f = K().flagMesh(k % 2 ? C.red : C.navy, C.gold, 3.2, 2); f.position.set(fx, fy + 3.5, fz); b.g.add(f) })
  }
  // ---------- activation ----------
  function set(v) {
    v = !!v && supported(); if (v === on) return on;
    if (v) {
      try {
        if (!R) { const cv = document.createElement('canvas'); cv.id = 'domain3d'; world.prepend(cv); R = new THREE.WebGLRenderer({ canvas: cv, antialias: true, powerPreference: 'high-performance' }); R.outputColorSpace = THREE.SRGBColorSpace; R.toneMapping = THREE.ACESFilmicToneMapping; R.toneMappingExposure = 1.05; R.shadowMap.enabled = !!QUALITY[settings.level()].shadow; R.shadowMap.type = THREE.PCFSoftShadowMap; input(cv) }
        R.setPixelRatio(Math.min(QUALITY[settings.level()].pr, devicePixelRatio || 1));
        if (!built) { const t0 = performance.now(); build(); T.ms = Math.round(performance.now() - t0); if (world.clientWidth < world.clientHeight * .8) { W3.dist = 280; W3.tz = -4 } } light(); camera()
      } catch (e) { console.warn('domaine 3D', e); return on = false }
      on = true; world.classList.add('d3-on');
      setTimeout(() => { try { if (on && !$('#panel').classList.contains('open') && career.data.stats.races >= 1) coach.tip('d3', 'Ton domaine est maintenant en <b>3D</b> : glisse pour te déplacer, pince ou utilise la molette pour zoomer, <b>deux doigts</b> (ou clic droit) pour tourner autour. Touche un bâtiment pour l’ouvrir.') } catch (e) { } }, 7000); try { villageGL.off = true } catch (e) { } adopt(); if (!raf) raf = requestAnimationFrame(frame)
    } else { on = false; world.classList.remove('d3-on'); try { villageGL.off = false } catch (e) { } release(); try { village.layout() } catch (e) { } }
    return on
  }
  hooks.on('ready', () => { if (wanted()) setTimeout(() => set(true), 60) });
  return { get on() { return on }, set, view: W3, supported, wanted, get stats() { return T && { ms: T.ms, tris: R && R.info.render.triangles, calls: R && R.info.render.calls } },
    // capture sans attendre requestAnimationFrame (panneau masqué) : fait avancer la vie de ms millisecondes puis dessine
    snap(ms = 0) { if (!on) return; const t = performance.now() / 1000; for (let k = 0; k < 4; k++) { stepHorses(ms / 4000, t); stepLife(ms / 4000, t) } raceWorld.uniforms.uTime.value = t; light(); camera(); R.render(S, cam); placeUI() } }
})();
