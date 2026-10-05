/* ===== Le domaine en vraie 3D =====
   Même plan que la peinture (haras au centre, hippodrome au nord, carrière, clinique, écurie, chantier, moulin, paddocks, rivière,
   forêt), mais construit en volumes : bâtiments procéduraux qui grandissent avec leur niveau (bannières, Salle des trophées qui
   remplace le chantier), chevaux 3D articulés (galop sur la piste, cavaliers en carrière, chevaux qui broutent au pré), moulin dont
   les ailes tournent, fontaine, réverbères, drapeaux, lumière selon l'heure réelle et feuillage selon la saison.
   Caméra : glisser pour se déplacer, pincer / molette pour zoomer, deux doigts ou clic droit pour tourner autour.
   Les étiquettes, minuteurs et bulles de récolte (calque #d3ui, créé par 02-village et 45-domaine) sont placés par projection 3D ;
   un toucher sur un bâtiment appelle village.select. Depuis la 2.5, c'est le seul domaine : plus de peinture 2D, sur tous les
   appareils (qualité basse comprise). Démarrage : l'essentiel (sol, bâtiments, clôtures) avant la première image, le décor, les
   décors achetés et les chevaux juste après. API : domaine3d.on (affiché ?), start(), snap(ms), view, quality(), stats. */
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
  // ---------- petites constructions (morceaux fusionnés, attribut glow = fenêtre éclairée la nuit) ----------
  const M = (x, y, z, ry = 0, sx = 1, sy = sx, sz = sx) => K().M4(x, y, z, ry, sx, sy, sz);
  const bx = (w, h, d) => new THREE.BoxGeometry(w, h, d);
  function gable(w, d, h) { const s = new THREE.Shape([new THREE.Vector2(-d / 2, 0), new THREE.Vector2(d / 2, 0), new THREE.Vector2(0, h)]); return new THREE.ExtrudeGeometry(s, { depth: w, bevelEnabled: false }).translate(0, 0, -w / 2).rotateY(Math.PI / 2) }
  const mansard = (w, d, h, top = .55) => new THREE.CylinderGeometry(top, 1, h, 4, 1).rotateY(Math.PI / 4).scale(w / Math.SQRT2, 1, d / Math.SQRT2).translate(0, h / 2, 0);
  function windows(P, x0, x1, y, z, n, ww = 1.6, wh = 2.2, face = 1, rot = 0) { for (let i = 0; i < n; i++) { const x = x0 + (x1 - x0) * (n > 1 ? i / (n - 1) : .5); P.push({ g: bx(ww, wh, .3), m: M(x, y, z + face * .1), c: C.win, glow: 1 }, { g: bx(ww + .5, .3, .5), m: M(x, y - wh / 2 - .1, z + face * .15), c: C.trim }) } }
  function part(P, g, x, y, z, c, ry = 0, glow = 0) { P.push({ g, m: M(x, y, z, ry), c, glow }) }
  // ---------- surbrillance (2.9) : contour doré autour de la silhouette du bâtiment choisi, de largeur constante à l'écran, dessiné
  // seulement hors du bâtiment (stencil écrit par bldMat) ; pour les lieux surtout au sol (hippodrome, carrière, paddocks), c'est
  // leur surface même (piste, sable, prés) qui s'illumine, à leur forme exacte — plus d'anneau autour ----------
  const HL = { col: new THREE.Color(0xffd36b), res: new THREE.Vector2(1, 1) };
  function outlineMat() {
    return new THREE.ShaderMaterial({ uniforms: { uA: { value: 0 }, uPx: { value: 3.2 }, uRes: { value: HL.res }, uC: { value: HL.col } }, transparent: true, depthTest: false, depthWrite: false,
      stencilWrite: true, stencilRef: 1, stencilFunc: THREE.NotEqualStencilFunc, stencilFail: THREE.KeepStencilOp, stencilZFail: THREE.KeepStencilOp, stencilZPass: THREE.KeepStencilOp,
      vertexShader: 'attribute vec3 onorm;uniform float uPx;uniform vec2 uRes;void main(){mat4 M=projectionMatrix*modelViewMatrix;vec4 c=M*vec4(position,1.),c2=M*vec4(position+onorm*.3,1.);vec2 d=c2.xy/c2.w-c.xy/c.w;float l=length(d);if(l>1e-6)c.xy+=d/l*uPx*2./uRes*c.w;gl_Position=c;}',
      fragmentShader: 'uniform vec3 uC;uniform float uA;void main(){gl_FragColor=vec4(uC,uA);}' })
  }
  // normales lissées par position (les boîtes fusionnées ont des normales par face : sans lissage, le contour s'ouvrirait aux arêtes)
  function outline(m) {
    const g = m.geometry, pos = g.attributes.position, nor = g.attributes.normal, n = pos.count, key = i => Math.round(pos.getX(i) * 50) + ',' + Math.round(pos.getY(i) * 50) + ',' + Math.round(pos.getZ(i) * 50), acc = new Map(), sm = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) { const k = key(i); let a = acc.get(k); if (!a) acc.set(k, a = [0, 0, 0]); a[0] += nor.getX(i); a[1] += nor.getY(i); a[2] += nor.getZ(i) }
    for (let i = 0; i < n; i++) { const a = acc.get(key(i)), l = Math.hypot(a[0], a[1], a[2]) || 1; sm[i * 3] = a[0] / l; sm[i * 3 + 1] = a[1] / l; sm[i * 3 + 2] = a[2] / l }
    const og = new THREE.BufferGeometry(); og.setAttribute('position', pos); og.setAttribute('onorm', new THREE.BufferAttribute(sm, 3)); if (g.index) og.setIndex(g.index);
    const o = new THREE.Mesh(og, outlineMat()); o.renderOrder = 5; o.frustumCulled = false; o.visible = false; o.userData.outline = 1; return o
  }
  // surface au sol d'un lieu (forme exacte) : voile doré, bord plus vif, posé juste au-dessus du sol
  function zoneMat() { return new THREE.MeshBasicMaterial({ color: HL.col, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }) }
  function zone(paths, holes = []) {
    const open = pts => { const a = pts[0], b = pts[pts.length - 1]; return Math.hypot(a[0] - b[0], a[1] - b[1]) < 1e-6 ? pts.slice(0, -1) : pts }, v2 = pts => open(pts).map(([x, z]) => new THREE.Vector2(x, -z));
    const shp = paths.map((pts, i) => { const s = new THREE.Shape(v2(pts)); if (holes[i]) s.holes.push(new THREE.Path(v2(holes[i]))); return s });
    const fill = new THREE.Mesh(new THREE.ShapeGeometry(shp, 6).rotateX(-Math.PI / 2), zoneMat()); fill.position.y = .12; fill.renderOrder = 4;
    // bord : bande de 1,6 m le long de chaque contour (extérieur et trous)
    const P = [], I = [], w = .8;
    for (const pts of [...paths, ...holes.filter(Boolean)]) for (let i = 0; i < pts.length - 1; i++) { const [ax, az] = pts[i], [bx_, bz] = pts[i + 1], L = Math.hypot(bx_ - ax, bz - az); if (L < 1e-6) continue; const nx = -(bz - az) / L * w, nz = (bx_ - ax) / L * w, k = P.length / 3;
      P.push(ax - nx, .14, az - nz, ax + nx, .14, az + nz, bx_ - nx, .14, bz - nz, bx_ + nx, .14, bz + nz); I.push(k, k + 1, k + 2, k + 1, k + 3, k + 2) }
    const eg = new THREE.BufferGeometry(); eg.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); eg.setIndex(I);
    const edge = new THREE.Mesh(eg, zoneMat()); edge.renderOrder = 4; edge.material.side = THREE.DoubleSide;
    const z = new THREE.Group(); z.add(fill, edge); z.visible = false; z.userData = { fill, edge }; return z
  }
  function mesh(P, mat) { const m = new THREE.Mesh(K().merge(P, ['glow']), mat); m.castShadow = m.receiveShadow = true; return m }
  // matériau des bâtiments : couleurs par sommet, fenêtres qui s'allument la nuit, surbrillance au survol / à la sélection
  // (2.9 : plus d'anneau au sol ; uHi pose un liseré doré sur les bords — Fresnel — et un voile chaud léger sur les faces)
  function bldMat() {
    const m = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .78, stencilWrite: true, stencilRef: 1, stencilFunc: THREE.AlwaysStencilFunc, stencilZPass: THREE.ReplaceStencilOp }); m.userData.u = { uNight: { value: 0 }, uHi: { value: 0 } };
    // 2.4 : matières procédurales (assises de pierre et joints sur les murs, rangs de tuiles sur les toits, grain, patine au pied des murs) ; le détail fin s'efface au loin (fwidth) pour ne pas scintiller
    m.onBeforeCompile = s => { Object.assign(s.uniforms, m.userData.u); s.vertexShader = 'attribute float glow;varying float vGlow;varying vec3 vWp;varying vec3 vWn;\n' + s.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvGlow=glow;vWp=(modelMatrix*vec4(transformed,1.)).xyz;vWn=normalize(mat3(modelMatrix)*objectNormal);');
      s.fragmentShader = 'uniform float uNight,uHi;varying float vGlow;varying vec3 vWp;varying vec3 vWn;float bh(vec3 p){return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453);}float bn(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(mix(bh(i),bh(i+vec3(1,0,0)),f.x),mix(bh(i+vec3(0,1,0)),bh(i+vec3(1,1,0)),f.x),f.y),mix(mix(bh(i+vec3(0,0,1)),bh(i+vec3(1,0,1)),f.x),mix(bh(i+vec3(0,1,1)),bh(i+vec3(1,1,1)),f.x),f.y),f.z);}\n' + s.fragmentShader.replace('#include <color_fragment>', `#include <color_fragment>
      {vec3 N=normalize(vWn);float wall=1.-smoothstep(.2,.45,abs(N.y)),roof=smoothstep(.22,.38,N.y)*(1.-smoothstep(.93,.99,N.y));float lum=dot(diffuseColor.rgb,vec3(.3,.59,.11));
       float u=dot(vWp.xz,normalize(vec2(-N.z,N.x)+1e-4)),fw=fwidth(vWp.y)+fwidth(u),fine=1.-smoothstep(.06,.22,fw);
       float row=floor(vWp.y/.7),jy=smoothstep(.9,.97,fract(vWp.y/.7)),jx=smoothstep(.95,.985,fract(u/1.5+row*.5));float stone=max(jy,jx)*fine*wall*step(.45,lum);
       diffuseColor.rgb*=1.-stone*.2;diffuseColor.rgb*=mix(.93,1.06,bn(vWp*1.7+row));
       float tile=smoothstep(.62,.95,fract(vWp.y/.42))*fine*roof;diffuseColor.rgb*=1.-tile*.26;diffuseColor.rgb*=mix(1.,mix(.9,1.08,bn(vWp*.9)),roof);
       diffuseColor.rgb*=mix(.74,1.,smoothstep(0.,2.6,vWp.y));}`).replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\ntotalEmissiveRadiance+=vec3(1.,.72,.38)*vGlow*uNight*1.6;\n{float fr=pow(1.-clamp(abs(dot(normalize(normal),normalize(vViewPosition))),0.,1.),2.2);totalEmissiveRadiance+=vec3(1.,.78,.36)*uHi*(.1+.8*fr)+diffuseColor.rgb*uHi*.3;}') };
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
    return { P, fence: [roundRect(0, 0, 30, 16, 6)], zone: [[roundRect(0, 0, 30, 16, 6)]] }
  }
  function paddocks() {
    const P = [];
    for (const [x, z] of [[-14, -12], [16, -10]]) { part(P, bx(7, 3.4, 5), x, 1.7, z, C.wood); part(P, gable(8, 6, 2.2), x, 3.4, z, C.roof2); part(P, bx(6, 2.6, .3), x, 1.5, z + 2.6, 0x2a1d12) }
    part(P, bx(4, .8, 1.2), 0, .4, 8, C.stone);
    return { P, fence: [rect(-15, 0, 28, 30), rect(15, 0, 28, 30)], zone: [[rect(-15, 0, 28, 30), rect(15, 0, 28, 30)]] }
  }
  function hippodrome() {
    const P = [];
    // tribune au nord de la piste, face au sud — 2.9 : entièrement derrière la lice extérieure (avant, son avant-toit et ses
    // premiers gradins mordaient sur la piste et les chevaux galopaient au travers)
    const zb = -52, x0 = 12, x1 = 58, rows = 8;
    for (let k = 0; k < rows; k++) { const y = 1.5 + k * 1.1; part(P, bx(x1 - x0, y, 2), (x0 + x1) / 2, y / 2, zb + (rows - k) * 2, 0xd6d0c4); part(P, bx(x1 - x0, .5, .6), (x0 + x1) / 2, y + .25, zb + (rows - k) * 2 + .5, k % 2 ? C.red : C.navy) }
    part(P, bx(x1 - x0, 15, 1.5), (x0 + x1) / 2, 7.5, zb, C.wall); part(P, bx(x1 - x0 + 4, .8, 18.5), (x0 + x1) / 2, 15, zb + 8.2, C.roof); part(P, bx(x1 - x0 + 4.4, 1.4, .5), (x0 + x1) / 2, 14.6, zb + 17.2, C.navy);
    for (let x = x0; x <= x1; x += 11.5) part(P, new THREE.CylinderGeometry(.3, .3, 14.5, 8), x, 7.2, zb + 16.6, C.trim);
    // pelouse des spectateurs entre la tribune et la lice : barrière basse
    part(P, bx(x1 - x0 + 6, .9, .25), (x0 + x1) / 2, .45, zb + 18.6, C.trim);
    for (const x of [x0 - 3, x1 + 3]) { part(P, bx(6, 20, 6), x, 10, zb + 4, C.wall2); part(P, new THREE.ConeGeometry(4.6, 6, 4).rotateY(Math.PI / 4), x, 23, zb + 4, C.roof2); windows(P, x, x, 14, zb + 7, 1) }
    // stalles de départ, écran géant, monument au centre
    // stalles de départ garées dans l'enceinte, le long de la lice intérieure (plus sur la piste où passent les chevaux)
    // 2.9 : vraies stalles (cadre et cloisons verts, portes avant à barreaux blancs, portes arrière pleines, roues de remorquage)
    { const sx = 32.5, sz = 8, n = 6, bw = 1.9, W = n * bw, l = sx - W / 2;
      for (let k = 0; k <= n; k++) part(P, bx(.2, 3, 3.3), l + k * bw, 1.95, sz, C.green);
      part(P, bx(W + .5, .45, 3.7), sx, 3.6, sz, C.green); part(P, bx(W + .7, .18, 3.9), sx, 3.9, sz, C.trim); part(P, bx(W + .2, .5, .14), sx, 3.15, sz + 1.72, C.trim);
      for (let k = 0; k < n; k++) { const x = l + (k + .5) * bw;
        part(P, bx(.62, .42, .08), x, 3.15, sz + 1.81, k % 2 ? C.red : C.navy); part(P, bx(bw - .3, 1.9, .1), x, 1.55, sz - 1.62, C.green);
        for (const y of [.65, 2.35]) part(P, bx(bw - .3, .12, .1), x, y, sz + 1.66, C.trim); for (let b = 0; b < 5; b++) part(P, bx(.07, 1.7, .07), x - (bw - .5) / 2 + b * (bw - .5) / 4, 1.5, sz + 1.66, C.trim) }
      for (const x of [l - .4, l + W + .4]) for (const z of [sz - 1.15, sz + 1.15]) part(P, new THREE.CylinderGeometry(.55, .55, .3, 14).rotateZ(Math.PI / 2), x, .55, z, 0x2a2a2a) }
    // poteau d'arrivée face à la tribune, côté spectateurs de la lice extérieure : disque rouge à cœur blanc
    part(P, new THREE.CylinderGeometry(.13, .16, 4.6, 8), 35, 2.3, -28.2, C.trim); part(P, new THREE.CylinderGeometry(.8, .8, .1, 24).rotateX(Math.PI / 2), 35, 4.9, -28.2, 0xc8202c); part(P, new THREE.CylinderGeometry(.42, .42, .14, 20).rotateX(Math.PI / 2), 35, 4.9, -28.2, C.trim);
    part(P, bx(16, 9, .8), -38, 10, -30, 0x0a1624); part(P, bx(17, 10, .6), -38, 10, -30.5, C.navy); for (const x of [-44, -32]) part(P, bx(.8, 6, .8), x, 3, -30.5, C.navy);
    part(P, bx(4, 2, 4), 0, 1, 0, C.stone); part(P, new THREE.CylinderGeometry(.9, 1.2, 8, 8), 0, 6, 0, C.trim); part(P, new THREE.ConeGeometry(1, 2.5, 8), 0, 11, 0, C.gold);
    return { P, fence: [ellipse(0, 0, 62.5, 32.5), ellipse(0, 0, 50, 21)], zone: [[ellipse(0, 0, 62.5, 32.5)], [ellipse(0, 0, 50, 21)]], flags: [[x0 - 3, 26.5, zb + 4], [x1 + 3, 26.5, zb + 4]], extra: g => { const c = document.createElement('canvas'); c.width = 256; c.height = 144; const x = c.getContext('2d'); x.fillStyle = '#071a2d'; x.fillRect(0, 0, 256, 144); x.fillStyle = '#e0b249'; x.fillRect(0, 0, 256, 6); x.fillRect(0, 138, 256, 6); x.font = '26px "Russo One",sans-serif'; x.textAlign = 'center'; x.fillText('THE ROYAL RACE', 128, 66); x.font = '700 17px Rajdhani,system-ui,sans-serif'; x.fillStyle = '#fff7dc'; x.fillText('HIPPODROME DU DOMAINE', 128, 98);
      const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; const s = new THREE.Mesh(new THREE.PlaneGeometry(15, 8.2), new THREE.MeshBasicMaterial({ map: t, toneMapped: false })); s.position.set(-38, 10, -29.55); g.add(s) } }
  }
  // ---------- clôtures (poteaux + deux lisses) ----------
  const rect = (x, z, w, d) => { const a = [[x - w / 2, z - d / 2], [x + w / 2, z - d / 2], [x + w / 2, z + d / 2], [x - w / 2, z + d / 2]]; a.push(a[0]); return a };
  const ellipse = (x, z, rx, rz, n = 72) => Array.from({ length: n + 1 }, (_, i) => [x + Math.cos(i / n * 6.2832) * rx, z + Math.sin(i / n * 6.2832) * rz]);
  const roundRect = (x, z, hw, hd, r, n = 10) => { const a = []; for (const [cx, cz, a0] of [[hw - r, -hd + r, -Math.PI / 2], [hw - r, hd - r, 0], [-hw + r, hd - r, Math.PI / 2], [-hw + r, -hd + r, Math.PI]]) for (let i = 0; i <= n; i++) { const t = a0 + i / n * Math.PI / 2; a.push([x + cx + Math.cos(t) * r, z + cz + Math.sin(t) * r]) } a.push(a[0]); return a };
  function fences(list, tr, P, col = C.trim) {
    // tracé au sol de chaque lice (contrôle des chevaux : croise)
    if (T) for (const path of list) (T.lices || (T.lices = [])).push(path.map(([x, z]) => { const v = new THREE.Vector3(x, 0, z).applyMatrix4(tr); return [v.x, v.z] }));
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
  // ponts (2.8) : posés en travers de la rivière (perpendiculaires au courant à l'endroit franchi, plus « de travers »), reliés aux allées
  // des deux côtés : côté domaine jusqu'à l'allée la plus proche, côté forêt un sentier qui s'y enfonce
  const PONTS = (() => { const q = catmull(RIVER, 10);
    return [[-6, 126, null], [148, 92, [105, 38]], [-150, 66, [-106, 44]]].map(([x, z, link]) => {
      let bi = 0, bd = 1e9; q.forEach(([a, b], i) => { const d = Math.hypot(a - x, b - z); if (d < bd) { bd = d; bi = i } });
      const [cx, cz] = q[bi], a = q[Math.max(0, bi - 1)], b = q[Math.min(q.length - 1, bi + 1)], tx = b[0] - a[0], tz = b[1] - a[1], L = Math.hypot(tx, tz) || 1;
      let nx = -tz / L, nz = tx / L; if (nx * -cx + nz * -cz < 0) { nx = -nx; nz = -nz } // vers le cœur du domaine
      const E = 17, w = 9 + Math.sin(bi * .37) * 1.5, inn = [cx + nx * E, cz + nz * E], out = [cx - nx * E, cz - nz * E], paths = [[out, [out[0] - nx * 14 + tx / L * 4, out[1] - nz * 14 + tz / L * 4], [out[0] - nx * 30 + tx / L * 10, out[1] - nz * 30 + tz / L * 10]]];
      if (link) paths.push([inn, [inn[0] + nx * 12, inn[1] + nz * 12], [(inn[0] + nx * 12 + link[0]) / 2, (inn[1] + nz * 12 + link[1]) / 2], link]);
      return { x: cx, z: cz, ry: Math.atan2(nx, nz), w, E, paths } }) })();
  // pré de l'écurie (centre x, z, largeur, profondeur) : clôture, chevaux en liberté, aucun arbre
  const PRE = [141, 11, 24, 14];
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
    PONTS.forEach(b => b.paths.forEach(p => road(p, 6, winter ? '#e8e0d0' : '#d9c28c', winter ? '#cfc6b6' : '#a98f5e')));
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
  // construction en étapes : start() rend la main au navigateur entre deux étapes (l'écran titre reste fluide) et affiche le
  // domaine dès que l'essentiel est prêt
  function buildSteps() {
    const Q = QUALITY[settings.level()], season = heure.season(), kit = K(), steps = [];
    const lv = id => { try { return dlv(id) } catch (e) { return 1 } }, pick = [], fenceP = [];
    const makers = { haras, ecurie, clinique, moulin, chantier, carriere, paddocks, hippodrome };
    steps.push(() => {
    S = new THREE.Scene(); S.background = new THREE.Color(0x9cc4e4); S.fog = new THREE.Fog(0x9cc4e4, 380, 900);
    const hemi = new THREE.HemisphereLight(0xdcebff, 0x3a4a26, 1.25), sun = new THREE.DirectionalLight(0xfff2dc, 3); sun.castShadow = !!Q.shadow; sun.shadow.mapSize.set(Q.shadow || 1024, Q.shadow || 1024); sun.shadow.bias = -.0005; sun.shadow.normalBias = .05;
    S.add(hemi, sun, sun.target); T = { hemi, sun, bmats: {}, glows: [], lamps: null, season };
    // sol
    const gm = new THREE.MeshStandardMaterial({ map: groundTexture(season), roughness: 1 });
    gm.onBeforeCompile = s => { s.vertexShader = 'varying vec3 vW;\n' + s.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvW=(modelMatrix*vec4(position,1.)).xyz;');
      s.fragmentShader = 'varying vec3 vW;float gh(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}float gn(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(gh(i),gh(i+vec2(1,0)),f.x),mix(gh(i+vec2(0,1)),gh(i+vec2(1,1)),f.x),f.y);}\n' +
        s.fragmentShader.replace('#include <map_fragment>', '#include <map_fragment>\n{float n=gn(vW.xz*1.3)*.5+gn(vW.xz*5.)*.3+gn(vW.xz*.2)*.2;diffuseColor.rgb*=mix(.86,1.1,n);float near=1.-smoothstep(25.,110.,distance(vW,cameraPosition));diffuseColor.rgb*=mix(1.,mix(.84,1.1,gn(vW.xz*4.3)*.55+gn(vW.xz*13.)*.45),near);}') };
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(GW, GD).rotateX(-Math.PI / 2), gm); ground.receiveShadow = true; S.add(ground);
    const far = new THREE.Mesh(new THREE.PlaneGeometry(2400, 2400).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ color: season === 'hiver' ? 0xd8e0e6 : 0x3f6a2a, roughness: 1 })); far.position.y = -.05; S.add(far);
    T.blds = {} });
    // bâtiments (un maillage et un matériau par bâtiment, pour la surbrillance)
    for (const id of VILLAGE.order) steps.push(() => {
      const [x, z, , ry] = B[id], g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; S.add(g);
      const r = makers[id](lv(id)), mat = bldMat(); T.bmats[id] = mat;
      let ol = null; if (r.P.length) { const m = mesh(r.P, mat); m.userData.id = id; g.add(m); pick.push(m); ol = outline(m); g.add(ol) }
      if (r.fence) fences(r.fence, new THREE.Matrix4().compose(g.position, new THREE.Quaternion().setFromEuler(g.rotation), new THREE.Vector3(1, 1, 1)), fenceP);
      const zn = r.zone ? zone(...r.zone) : null; if (zn) g.add(zn);
      if (r.extra) r.extra(g);
      if (r.sP) { sails = new THREE.Mesh(kit.merge(r.sP), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .8 })); sails.position.set(0, 16, 5.6); sails.castShadow = true; g.add(sails) }
      (r.flags || []).forEach(([fx, fy, fz], k) => { const f = kit.flagMesh(k % 2 ? C.red : C.navy, C.gold, 3.2, 2); f.position.set(fx, fy + 3.5, fz); f.scale.setScalar(1); g.add(f) });
      // 2.9 : plus d'anneau au sol pour la sélection : le bâtiment s'illumine lui-même (uHi dans bldMat)
      T.blds[id] = { g, lv: lv(id), top: B[id][2], ol, zn }
    });
    steps.push(() => {
    T.pick = pick;
    fences([rect(...PRE)], new THREE.Matrix4(), fenceP);
    if (fenceP.length) { const f = new THREE.Mesh(kit.merge(fenceP), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .6 })); f.castShadow = true; f.receiveShadow = true; S.add(f) } },
    () => decor(season, Q), () => decos(), () => { buildHorses(); built = true });
    return steps
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
    // ponts de pierre (2.8) : un seul bloc en arc elliptique au-dessus de l'eau, tablier lisse en dos d'âne, rampes douces, parapets qui suivent
    // le tablier, piliers d'angle à chapeau, claveaux autour de l'arche ; posé en travers du courant (PONTS)
    { const shp = pts => { const sh = new THREE.Shape(); pts.forEach(([u, v], i) => i ? sh.lineTo(u, v) : sh.moveTo(u, v)); return sh },
        ext = (pts, depth, x0) => new THREE.ExtrudeGeometry(shp(pts), { depth, bevelEnabled: false, curveSegments: 1 }).rotateY(Math.PI / 2).translate(x0, 0, 0), bm = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .92 });
      for (const b of PONTS) { const W = 9, a = b.w + 1.2, E = b.E, D = E - 4.5, top = u => { const t = Math.abs(u); return t <= D ? .9 + 2.1 * (1 - (t / D) ** 2) : .9 - .75 * (t - D) / (E - D) }, N = 28, deck = [], arch = [], ring = [];
        for (let k = 0; k <= N; k++) { const u = -E + 2 * E * k / N; deck.push([u, top(u)]) }
        for (let k = 0; k <= N; k++) { const u = a - 2 * a * k / N, e = Math.sqrt(Math.max(0, 1 - (u / a) ** 2)); arch.push([u, 2.05 * e]); ring.push([u, (2.05 + .55) * Math.sqrt(Math.max(0, 1 - (u / (a + .55)) ** 2))]) }
        // corps : dessus = tablier, dessous = sol (-.4) avec l'arche ouverte au-dessus de l'eau
        const body = [[-E, -.4], ...deck, [E, -.4], [a, -.4], ...arch, [-a, -.4]], bp = [{ g: ext(body, W, -W / 2), m: M(0, 0, 0), c: C.stone }];
        // claveaux : anneau légèrement en relief sur les deux faces
        for (const x0 of [-W / 2 - .18, W / 2]) bp.push({ g: ext([[a + .55, 0], ...ring.slice(1, -1), [-a - .55, 0], [-a, 0], ...arch.slice(1, -1).reverse(), [a, 0]], .18, x0), m: M(0, 0, 0), c: C.trim });
        // parapets qui suivent le tablier, piliers d'angle à chapeau
        const par = [...deck.map(([u, v]) => [u, v + 1]), ...deck.slice().reverse()];
        for (const x0 of [-W / 2, W / 2 - .5]) bp.push({ g: ext(par, .5, x0), m: M(0, 0, 0), c: C.trim });
        for (const sx of [-1, 1]) for (const su of [-1, 1]) { const u = su * (E - .4), y = top(u); bp.push({ g: bx(1.1, 1.9, 1.1), m: M(sx * (W / 2 - .25), y + .95, u), c: C.stone }, { g: new THREE.ConeGeometry(.85, .7, 4), m: M(sx * (W / 2 - .25), y + 2.25, u, Math.PI / 4), c: C.trim }) }
        const g = new THREE.Group(); g.position.set(b.x, 0, b.z); g.rotation.y = b.ry; const m = mesh(bp, bm); g.add(m); S.add(g) } }
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
  // ---------- décors achetés à la Boutique (52-decors) : career.data.deco.owned ----------
  let decoSig = '', swans = [];
  const decoOwned = () => { try { return ((career.data.deco || {}).owned || []).slice().sort() } catch (e) { return [] } };
  function decos() {
    const own = decoOwned(); decoSig = own.join(','); if (T.deco) { S.remove(T.deco); T.deco.traverse(o => { if (o.geometry) o.geometry.dispose() }) } swans = [];
    const g = new THREE.Group(), kit = K(), mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .7 }), gold = new THREE.MeshStandardMaterial({ color: 0xe0b447, metalness: .85, roughness: .28 }); T.deco = g; S.add(g);
    const put = (P, x, z, ry = 0, m = mat) => { const o = mesh(P, m); o.position.set(x, 0, z); o.rotation.y = ry; g.add(o); return o };
    for (const id of own) {
      const P = [];
      if (id === 'roseraie') { // arches de roses et massifs
        for (const [x, z, r] of [[-40, 30, 0], [-40, 50, 0], [-50, 40, Math.PI / 2], [-30, 40, Math.PI / 2]]) { P.push({ g: new THREE.TorusGeometry(2.4, .18, 6, 18, Math.PI), m: M(x + 40, 0, z - 40, r), c: 0x3f6a2a }); for (let k = 0; k <= 8; k++) { const a = k / 8 * Math.PI; P.push({ g: new THREE.IcosahedronGeometry(.42, 0), m: M(x + 40 + Math.cos(a) * 2.4 * Math.cos(r), Math.sin(a) * 2.4, z - 40 - Math.cos(a) * 2.4 * Math.sin(r)), c: k % 2 ? 0xe0567a : 0xf4f0ea }) } }
        for (const [x, z] of [[-6, -6], [6, -6], [-6, 6], [6, 6], [0, 0]]) { P.push({ g: new THREE.CylinderGeometry(2.6, 2.8, .5, 16), m: M(x, .25, z), c: 0x6b4a2e }); for (let k = 0; k < 9; k++) { const a = k / 9 * 6.28; P.push({ g: new THREE.IcosahedronGeometry(.75, 1), m: M(x + Math.cos(a) * 1.6, .9, z + Math.sin(a) * 1.6), c: [0xc8324a, 0xe0567a, 0xf4f0ea][k % 3] }) } }
        put(P, -40, 40) }
      else if (id === 'kiosque') { // kiosque à musique octogonal
        P.push({ g: new THREE.CylinderGeometry(5.2, 5.6, 1, 8), m: M(0, .5, 0), c: C.trim }, { g: new THREE.CylinderGeometry(6.2, 4.6, 3.2, 8, 1, true), m: M(0, 7.6, 0), c: C.navy }, { g: new THREE.ConeGeometry(6.4, 3.6, 8), m: M(0, 10.8, 0), c: C.navy }, { g: new THREE.ConeGeometry(.5, 2.2, 8), m: M(0, 13.6, 0), c: C.gold });
        for (let k = 0; k < 8; k++) { const a = k / 8 * 6.28 + .39; P.push({ g: new THREE.CylinderGeometry(.22, .28, 5.2, 8), m: M(Math.cos(a) * 4.7, 3.6, Math.sin(a) * 4.7), c: C.trim }, { g: bx(3.4, .5, .25), m: M(Math.cos(a) * 4.9, 1.7, Math.sin(a) * 4.9, -a + Math.PI / 2 + .39), c: C.gold }) }
        put(P, 30, 42) }
      else if (id === 'cygnes') { // étang aux cygnes
        const wm = new THREE.MeshStandardMaterial({ color: 0x3f6f86, roughness: .05, metalness: .45 }), pond = new THREE.Mesh(new THREE.CircleGeometry(1, 40).rotateX(-Math.PI / 2), wm); pond.scale.set(10, 1, 13); pond.position.set(-38, .12, 88); g.add(pond);
        P.push({ g: new THREE.TorusGeometry(1, .06, 6, 40).rotateX(Math.PI / 2).scale(10.4, 1, 13.4), m: M(0, .12, 0), c: 0xb8ad8a }); for (let k = 0; k < 26; k++) { const a = k / 26 * 6.28; P.push({ g: new THREE.ConeGeometry(.3, 2 + (k % 3) * .6, 4), m: M(Math.cos(a) * 10.8, 1, Math.sin(a) * 13.8), c: 0x5e7a34 }) } put(P, -38, 88);
        for (let k = 0; k < 3; k++) { const sP = [{ g: new THREE.SphereGeometry(1, 12, 8).scale(1.2, .55, .7), m: M(0, .5, 0), c: 0xffffff }, { g: new THREE.CylinderGeometry(.14, .2, 1.8, 6).rotateZ(-.25), m: M(.95, 1.35, 0), c: 0xffffff }, { g: new THREE.SphereGeometry(.28, 8, 6), m: M(1.15, 2.25, 0), c: 0xffffff }, { g: new THREE.ConeGeometry(.12, .45, 6).rotateZ(-Math.PI / 2), m: M(1.5, 2.2, 0), c: 0xe0782d }];
          const sw = mesh(sP, mat); g.add(sw); swans.push({ o: sw, a: k * 2.1, r: 5 + k * 1.6, sp: .12 + k * .03 }) } }
      else if (id === 'statue') { // statue équestre dorée, cabrée, sur son socle
        P.push({ g: bx(5, 4, 8), m: M(0, 2, 0), c: C.stone }, { g: bx(5.4, .5, 8.4), m: M(0, 4.1, 0), c: C.gold }, { g: bx(6, .8, 9), m: M(0, .4, 0), c: C.stone }); put(P, 30, 88);
        const h = HORSE3D.build({ coat: 'palomino', main: '#000', second: '#000', pattern: 'uni', cap: '#000', name: 'Statue' }, { lod: 1, free: true }); h.scale.setScalar(2.6); h.position.set(30.5, 4.3, 88); h.rotation.set(0, Math.PI / 2 + .3, .42); g.add(h);
        HORSE3D.ready(1).then(() => { HORSE3D.pose(h, 0, 0, 0, 0, .28); h.traverse(o => { if (o.isMesh) { o.material = gold; o.castShadow = true } }) }) }
      else if (id === 'obelisque') { P.push({ g: bx(4.4, 2, 4.4), m: M(0, 1, 0), c: C.stone }, { g: new THREE.CylinderGeometry(.9, 1.5, 17, 4).rotateY(Math.PI / 4), m: M(0, 10.5, 0), c: 0xe6dcc6 }, { g: new THREE.ConeGeometry(1.25, 2.2, 4).rotateY(Math.PI / 4), m: M(0, 20.1, 0), c: C.gold }, { g: bx(2.2, 1.4, .2), m: M(0, 4, 1.2), c: C.gold }); put(P, -42, -40) }
      else if (id === 'arc') { // arc de triomphe à l'entrée de l'avenue
        for (const s of [-1, 1]) P.push({ g: bx(4.5, 15, 4.5), m: M(s * 7.6, 7.5, 0), c: 0xe9e0cc }, { g: bx(5.2, 1, 5.2), m: M(s * 7.6, .5, 0), c: C.stone });
        P.push({ g: bx(20, 4.5, 4.8), m: M(0, 16.5, 0), c: 0xe9e0cc }, { g: bx(20.6, .7, 5.2), m: M(0, 19, 0), c: C.gold }, { g: bx(10, 2.2, .3), m: M(0, 16.4, 2.5), c: C.navy }, { g: new THREE.ConeGeometry(1.6, 2.6, 5), m: M(0, 20.8, 0), c: C.gold });
        const a = put(P, -6, 110); a.castShadow = true }
      else if (id === 'lanternes') { const lp = [];
        for (const r of [ROADS[2], ROADS[3], ROADS[6], ROADS[5]]) { const q = catmull(r, 10); for (let i = 2; i < q.length - 1; i += 3) { const [x, z] = q[i], [x2, z2] = q[i + 1], dx = x2 - x, dz = z2 - z, L = Math.hypot(dx, dz) || 1; for (const sd of [1, -1]) { const lx = x - dz / L * 5 * sd, lz = z + dx / L * 5 * sd; lp.push({ g: new THREE.CylinderGeometry(.12, .16, 3.6, 6), m: M(lx, 1.8, lz), c: 0x222222 }, { g: bx(.6, .75, .6), m: M(lx, 3.9, lz), c: 0xffd08a, glow: 1 }) } } }
        const lm = T.lampMat; g.add(mesh(lp, lm)) }
    }
  }
  function glowTex() { const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d'), g = x.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(.25, 'rgba(255,220,160,.55)'); g.addColorStop(1, 'rgba(255,200,120,0)'); x.fillStyle = g; x.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c) }
  // arbres : forêt de conifères autour du domaine, feuillus et peupliers entre les bâtiments (jamais sur une allée, un bâtiment ou l'eau)
  function trees(season, Q) {
    const kit = K(), r = kit.rng(4242), G = kit.treeGeos(), dens = !Q.shadow ? .5 : Q.shadow < 2048 ? .8 : 1, list = [[], [], []];
    const segs = []; for (const p of ROADS) { const q = catmull(p, 4); for (let i = 0; i < q.length - 1; i++) segs.push([q[i], q[i + 1], 6]) } { const q = catmull(RIVER, 4); for (let i = 0; i < q.length - 1; i++) segs.push([q[i], q[i + 1], 14]) }
    for (const b of PONTS) { for (const p of b.paths) { const q = catmull(p, 4); for (let i = 0; i < q.length - 1; i++) segs.push([q[i], q[i + 1], 6]) } const s2 = Math.sin(b.ry), c2 = Math.cos(b.ry); segs.push([[b.x - s2 * (b.E + 3), b.z - c2 * (b.E + 3)], [b.x + s2 * (b.E + 3), b.z + c2 * (b.E + 3)], 8]) }
    const dseg = (x, z, [a, b]) => { const dx = b[0] - a[0], dz = b[1] - a[1], t = Math.max(0, Math.min(1, ((x - a[0]) * dx + (z - a[1]) * dz) / (dx * dx + dz * dz || 1))); return Math.hypot(x - a[0] - dx * t, z - a[1] - dz * t) };
    const FOOT = { haras: [48, 22], hippodrome: [70, 58], carriere: [38, 24], clinique: [26, 16], ecurie: [32, 26], chantier: [22, 18], moulin: [42, 16], paddocks: [36, 24] };
    const blocked = (x, z) => { for (const id in B) { const [bx_, bz] = B[id], [w, d] = FOOT[id]; if (Math.abs(x - bx_ - (id === 'moulin' ? 14 : 0)) < w && Math.abs(z - bz) < d) return true }
      if (Math.hypot(x + 6, z - 14) < 22 || (Math.abs(x - PRE[0]) < PRE[2] / 2 + 7 && Math.abs(z - PRE[1]) < PRE[3] / 2 + 7)) return true; for (const [X, Z, w, d] of LAWNS) if (w && Math.abs(x - X) < w / 2 + 2 && Math.abs(z - Z) < d / 2 + 2) return true; for (const s of segs) if (dseg(x, z, s) < s[2] + 1.5) return true; return false };
    // forêt extérieure (conifères surtout)
    for (let i = 0; i < 1400 * dens; i++) { const x = (r() - .5) * GW * 1.25, z = (r() - .5) * GD * 1.3, e = Math.pow(Math.abs(x) / 175, 4) + Math.pow(Math.abs(z) / 128, 4); if (e < 1 || blocked(x, z)) continue; list[r() < .78 ? 2 : 0].push([x, z, .55 + r() * .4]) }
    // bosquets à l'intérieur
    for (let i = 0; i < 700 * dens; i++) { const x = (r() - .5) * 340, z = (r() - .5) * 250, e = Math.pow(Math.abs(x) / 175, 4) + Math.pow(Math.abs(z) / 128, 4); if (e >= 1 || r() < .45 || blocked(x, z)) continue; list[r() < .5 ? 0 : r() < .6 ? 2 : 1].push([x, z, .4 + r() * .3]) }
    const bark = new THREE.MeshStandardMaterial({ color: 0x5b4633, roughness: 1 }), leaf = kit.leafMat(), c = new THREE.Color();
    const GREENS = season === 'automne' ? [[0xc2702a, 0xd9a03a, 0x9c4a22, 0x7f8a30], [0xd9b040, 0xc89a30], [0x2f5230, 0x3a5e36]] : season === 'hiver' ? [[0x8a8f86, 0x9a9690], [0x8c9088], [0x3e5a44, 0x4a664e]] : [[0x4f7a2e, 0x3f6a28, 0x6a8f3a, 0x587f30], [0x5d8a35, 0x4c7a2c], [0x2f5230, 0x3a5e36, 0x28482a]];
    // emprise de chaque arbre à hauteur de cheval (tronc du chêne, houppier bas du peuplier et du conifère) : contrôle croise
    T.arbres = list.flatMap((L, k) => L.map(([x, z, s]) => [x, z, [1.1, 3.3, 5.2][k] * s]));
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
    // chevaux plus grands que nature (comme sur la peinture) pour rester lisibles à l'échelle du domaine
    H.forEach((h, i) => { h.m = HORSE3D.build(h.liv, { lod: 2, number: i + 1, seed: h.liv.name }); h.m.scale.setScalar(2.4); S.add(h.m); h.p = Math.random() });
    horses = H; buildMine(); HORSE3D.ready(2).then(() => horses.forEach(h => h.m.traverse(o => { if (o.isMesh) o.castShadow = true })))
  }
  // les chevaux de ton écurie, en liberté dans les paddocks et le pré de l'écurie (le blessé reste au box devant l'écurie) ; leur nom s'affiche de près
  // 2.9 : centres des deux paddocks (tournés de 0,15 rad) avancés vers l'avant, loin des abris du fond ; marges calculées pour que tout le
  // cheval reste dans sa lice (contrôle : croise)
  // pré de l'écurie : à l'est de l'allée de l'écurie (avant, posé en travers de l'allée, avec un arbre dedans)
  const FIELDS = [[-106.5, 66.7, 9, 7.5], [-76.8, 62.2, 9, 7.5], [PRE[0], PRE[1], 10, 4.5]];
  let mineSig = '';
  const mineList = () => { try { return stable.data.horses.map(h => ({ id: h.id, name: h.name, coat: h.coat, inj: !!h.injury, tired: h.fatigue > 60 })) } catch (e) { return [] } };
  function buildMine() {
    const list = mineList(); mineSig = JSON.stringify(list);
    for (const h of horses.filter(h => h.kind === 'free')) { S.remove(h.m); HORSE3D.dispose(h.m); h.tag && h.tag.remove() }
    horses = horses.filter(h => h.kind !== 'free');
    list.forEach((x, i) => { const f = x.inj ? 2 : i % 3, F = FIELDS[f], h = { kind: 'free', mine: x, liv: { coat: x.coat, main: '#000', second: '#000', pattern: 'uni', cap: '#000', name: x.name }, f, F, st: x.inj ? 'idle' : 'graze', until: 0, p: Math.random() };
      h.x = F[0] + (Math.random() - .5) * F[2]; h.z = F[1] + (Math.random() - .5) * F[3]; h.tx = h.x; h.tz = h.z; h.yaw = Math.random() * 6.28;
      h.m = HORSE3D.build(h.liv, { lod: 2, free: true, seed: x.name }); h.m.scale.setScalar(2.4); S.add(h.m); HORSE3D.ready(2).then(() => h.m.traverse(o => { if (o.isMesh) o.castShadow = true })); horses.push(h) })
  }
  function horseTag(h) {
    if (h.tag && h.tag.isConnected) return h.tag; if (!ui) return null; const b = document.createElement('button'); b.className = 'd3-horse';
    b.innerHTML = `${h.mine.inj ? '🩹 ' : h.mine.tired ? '💤 ' : ''}${escapeHTML(h.mine.name)}`; b.addEventListener('pointerdown', e => e.stopPropagation());
    b.addEventListener('click', e => { e.stopPropagation(); try { stUI.horse = h.mine.id; openStable() } catch (x) { } }); ui.appendChild(b); return h.tag = b
  }
  // trajets : piste de l'hippodrome (ovale du couloir, sens inverse des aiguilles vu du ciel) et ovale de la carrière
  function onTrack(lane, s) {
    const [hx, hz] = B.hippodrome, L = 2 * Math.PI * Math.sqrt((lane ** 2 + (lane * .5) ** 2) / 2), a = -(s / L) * 6.2832, rx = lane, rz = lane * .5 - 2;
    return { x: hx + Math.cos(a) * rx, z: hz + Math.sin(a) * rz, yaw: Math.atan2(Math.cos(a) * rz, Math.sin(a) * rx), L }
  }
  // 2.9 : tangente exacte (a décroît : dérivée de (cos, sin) = (sin, -cos)) — avant, la composante x avait le mauvais signe et
  // les cavaliers remontaient les longueurs à reculons ; ovale élargi pour passer au large des obstacles
  function inArena(a) {
    const [ax, az, , ar] = B.carriere, c = Math.cos(a), s = Math.sin(a), RX = 24, RZ = 11.5, lx = c * RX, lz = s * RZ, ca = Math.cos(-ar), sa = Math.sin(-ar), tx = s * RX, tz = -c * RZ;
    return { x: ax + lx * ca - lz * sa, z: az + lx * sa + lz * ca, yaw: Math.atan2(-(tx * sa + tz * ca), tx * ca - tz * sa) }
  }
  // contrôle (tests) : points où un cheval du domaine, à l'échelle du village, toucherait un bâtiment, un obstacle ou une tribune —
  // piste et carrière sur tout leur tour, chevaux en liberté partout où ils peuvent aller ; rend [] si tout est dégagé
  function croise() {
    if (!T || !T.pick || !built) return null; const out = [], rc = new THREE.Raycaster(), dn = new THREE.Vector3(0, -1, 0), o = new THREE.Vector3(), HL = 1.15 * 2.4, HW = .32 * 2.4;
    // une lice entre (ax, az) et (x, z) ?
    const seg = [], cut = (ax, az, x, z) => { for (const [px, pz, qx, qz] of seg) { const d = (x - ax) * (qz - pz) - (z - az) * (qx - px); if (Math.abs(d) < 1e-9) continue; const t = ((px - ax) * (qz - pz) - (pz - az) * (qx - px)) / d, u = ((px - ax) * (z - az) - (pz - az) * (x - ax)) / d; if (t > 0 && t < 1 && u >= 0 && u <= 1) return true } return false };
    for (const L of T.lices || []) for (let i = 0; i < L.length - 1; i++) seg.push([L[i][0], L[i][1], L[i + 1][0], L[i + 1][1]]);
    let n = 0; const hit = (x, z, what, ax, az) => { n++; o.set(x, 80, z); rc.set(o, dn); const h = rc.intersectObjects(T.pick, false)[0]; if (h && h.point.y > .3) out.push({ what, id: h.object.userData.id, x: +x.toFixed(1), z: +z.toFixed(1) });
      else if (cut(ax, az, x, z)) out.push({ what, id: 'lice', x: +x.toFixed(1), z: +z.toFixed(1) });
      else for (const [tx, tz, tr] of near) if (Math.hypot(x - tx, z - tz) < tr) { out.push({ what, id: 'arbre', x: +x.toFixed(1), z: +z.toFixed(1) }); break } };
    let near = []; const zoneArbres = (x0, z0, R) => { near = (T.arbres || []).filter(([x, z]) => Math.hypot(x - x0, z - z0) < R + 8) };
    // corps du cheval (tête, croupe, flancs) ; aucune lice entre ce point et l'origine (centre du cheval, ou centre du pré pour un cheval en liberté)
    const body = (p, what, ox = p.x, oz = p.z) => { const c = Math.cos(p.yaw), s = -Math.sin(p.yaw); for (const [f, l] of [[1, 0], [-1, 0], [0, 1], [0, -1], [.5, 1], [.5, -1], [-.5, 1], [-.5, -1], [0, 0]]) hit(p.x + c * f * HL - s * l * HW, p.z + s * f * HL + c * l * HW, what, ox, oz) };
    for (const h of horses) {
      if (h.kind === 'track') { zoneArbres(B.hippodrome[0], B.hippodrome[1], h.lane + 4); const L = onTrack(h.lane, 0).L; for (let s = 0; s < L; s += 1) body(onTrack(h.lane, s), 'piste') }
      else if (h.kind === 'arena') { zoneArbres(B.carriere[0], B.carriere[1], 30); for (let k = 0; k < 360; k++) body(inArena(k / 360 * 6.2832), 'carrière') }
    }
    // chevaux en liberté : rectangle de leurs destinations (marche en ligne droite, donc tout le rectangle), corps dans tous les sens
    for (const F of FIELDS) { zoneArbres(F[0], F[1], F[2] + F[3] + 4); for (let u = -.8; u <= .8; u += .1) for (let v = -.8; v <= .8; v += .1) for (let k = 0; k < 8; k++) body({ x: F[0] + u * F[2], z: F[1] + v * F[3], yaw: k * Math.PI / 4 }, 'pré', F[0], F[1]) }
    out.points = n; out.arbres = (T.arbres || []).length; return out
  }
  function stepHorses(dt, t) {
    for (const h of horses) {
      let x, z, yaw, run, g = 0, rate;
      if (h.kind === 'track') { h.s = (h.s + h.sp * dt) % 1e6; ({ x, z, yaw } = onTrack(h.lane, h.s)); run = 1; rate = 2.3 }
      else if (h.kind === 'arena') { h.a -= h.sp * dt; ({ x, z, yaw } = inArena(h.a)); run = .62; rate = 1.7 }
      else {
        if (t > h.until && h.mine && h.mine.inj) { h.st = 'idle'; h.until = t + 30 }
        else if (t > h.until) { const r = Math.random(); if (r < .45) { h.st = 'walk'; h.tx = h.F[0] + (Math.random() - .5) * h.F[2] * 1.6; h.tz = h.F[1] + (Math.random() - .5) * h.F[3] * 1.6; h.until = t + 20 } else { h.st = r < .85 ? 'graze' : 'idle'; h.until = t + 4 + Math.random() * 9 } }
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
    S.background.set(A.bg); S.fog.color.set(A.bg);
    // reflets du ciel de l'heure (toits vernissés, eau, dorures, vitres), sauf en qualité basse
    if (settings.level() !== 'basse') { try { const c = x => { const k = new THREE.Color(x); return [k.r, k.g, k.b] }, sk = c(A.hemi[0]), bg = c(A.bg); S.environment = raceFX.skyEnv(R, { zen: [sk[0] * .45, sk[1] * .6, sk[2] * .9], hor: bg, gnd: c(A.hemi[1]), sun: [A.sun[2], A.sun[3], A.sun[4]], sunC: c(A.sun[0]), sunK: A.night ? .05 : 1, k: A.night ? .2 : .38 }); T.hemi.intensity = A.hemi[2] * .86 } catch (e) { } } for (const id in T.bmats) T.bmats[id].userData.u.uNight.value = A.night; if (T.lampMat) T.lampMat.userData.u.uNight.value = A.night; if (T.halo) T.halo.opacity = A.night * .85
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
    ui = village.layer; moved = $$('#d3ui [data-id]').map(el => [el, '', el.dataset.id]); T.nUI = moved.length
  }
  const V3 = new THREE.Vector3();
  // 2.7 : cadrage du bâtiment choisi au centre de la zone laissée libre par le HUD (sous la barre du haut, au-dessus de sa carte,
  // entre les rails), et non plus au centre de l'écran, où la carte le cachait sur téléphone
  function zoneHUD() { try { domaine.place(); return domaine.zone } catch (e) { return null } }
  function cadre(id) {
    const d = Math.min(W3.dist, id === 'hippodrome' ? 170 : 115), Wd = world.clientWidth, Hd = Math.max(1, world.clientHeight), z = zoneHUD();
    if (!z || z.b - z.t < 80) return { x: B[id][0], z: B[id][1] + 6, d };
    const dx = (z.l + z.r) / 2 - Wd / 2, dy = z.t + (z.b - z.t) * .62 - Hd / 2, k = 2 * Math.tan(cam.fov * Math.PI / 360) * d / Hd, c = Math.cos(W3.yaw), sn = Math.sin(W3.yaw);
    return { x: B[id][0] - (dx * c + dy * sn * 1.25) * k, z: B[id][1] - (-dx * sn + dy * c * 1.25) * k, d };
  }
  function placeUI() {
    const Wd = world.clientWidth, Hd = world.clientHeight;
    // étiquette du bâtiment choisi : toujours entière, entre les rails et au-dessus de la carte (mesurée avant toute écriture de style)
    const st = selId && village.els[selId] ? village.els[selId].tag : null, tw = st ? st.offsetWidth : 0, th = st ? st.offsetHeight : 0, z = st ? domaine.zone : null;
    for (const h of horses) { if (h.kind !== 'free' || !h.mine) continue; const tag = horseTag(h); if (!tag) continue; V3.set(h.m.position.x, 7.2, h.m.position.z).project(cam);
      const x = (V3.x * .5 + .5) * Wd, y = (-V3.y * .5 + .5) * Hd, off = W3.dist > 150 || V3.z > 1 || x < -60 || x > Wd + 60 || y < 70 || y > Hd - 60; tag.style.visibility = off ? 'hidden' : ''; if (!off) { tag.style.left = x.toFixed(1) + 'px'; tag.style.top = y.toFixed(1) + 'px' } }
    for (const [el, , id] of moved) { if (!id) continue; const b = B[id], harvest = el.classList.contains('bld-harvest'), hit = el.classList.contains('bld-hit'); V3.set(b[0], harvest ? b[2] * .55 : hit ? b[2] * .4 : b[2] + 2, b[1]).project(cam);
      const x = (V3.x * .5 + .5) * Wd, y = (-V3.y * .5 + .5) * Hd, off = V3.z > 1 || (el !== st && (x < -80 || x > Wd + 80 || y < -40 || y > Hd + 80));
      let px = x, py = Math.max(harvest ? 60 : 96, y);
      if (el === st && z) { const l = z.l + tw / 2 + 4, r = z.r - tw / 2 - 4; px = l <= r ? Math.min(r, Math.max(l, x)) : (z.l + z.r) / 2; py = Math.min(Math.max(py, z.t + th + 8), Math.max(z.t + th + 8, z.b)) }
      el.style.left = px.toFixed(1) + 'px'; el.style.top = py.toFixed(1) + 'px'; el.style.visibility = off ? 'hidden' : ''; if (hit) { el.style.width = '64px'; el.style.height = '64px'; el.style.marginLeft = el.style.marginTop = '-32px' } }
  }
  // ---------- entrées ----------
  const pts = new Map(); let drag = null, pinch = null, lastMove = 0, hover = null, geste = 0;
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  function pickAt(cx, cy) { const r = R.domElement.getBoundingClientRect(); ndc.set((cx - r.left) / r.width * 2 - 1, -((cy - r.top) / r.height) * 2 + 1); ray.setFromCamera(ndc, cam); const h = ray.intersectObjects(T.pick, false)[0]; if (h) return h.object.userData.id;
    // à défaut, le bâtiment dont l'emprise au sol est sous le doigt
    const p = new THREE.Vector3(); if (!ray.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), p)) return null; let best = null, bd = 1e9; for (const id in B) { const d = Math.hypot(p.x - B[id][0], p.z - B[id][1]); if (d < ({ hippodrome: 60, carriere: 30, paddocks: 32 }[id] || 20) && d < bd) { bd = d; best = id } } return best }
  function input(cv) {
    const stop = e => e.stopPropagation();
    cv.addEventListener('contextmenu', e => e.preventDefault());
    cv.addEventListener('pointerdown', e => { stop(e); geste = performance.now(); cv.setPointerCapture(e.pointerId); pts.set(e.pointerId, { x: e.clientX, y: e.clientY }); W3.vx = W3.vz = 0; W3.goal = null;
      if (pts.size === 1) drag = { x: e.clientX, y: e.clientY, moved: false, rot: e.button === 2 || e.shiftKey }; else if (pts.size === 2) { const [a, b] = [...pts.values()]; pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), dist: W3.dist, ang: Math.atan2(b.y - a.y, b.x - a.x), yaw: W3.yaw, mx: (a.x + b.x) / 2, my: (a.y + b.y) / 2 }; if (drag) drag.moved = true } });
    cv.addEventListener('pointermove', e => { stop(e); const p = pts.get(e.pointerId); if (p) geste = performance.now(); if (!p) { if (e.pointerType === 'mouse') { const id = pickAt(e.clientX, e.clientY); if (id !== hover) { hover = id; world.classList.toggle('over-bld', !!id) } } return }
      const dx = e.clientX - p.x, dy = e.clientY - p.y; p.x = e.clientX; p.y = e.clientY;
      if (pinch && pts.size === 2) { const [a, b] = [...pts.values()], d = Math.hypot(a.x - b.x, a.y - b.y), ang = Math.atan2(b.y - a.y, b.x - a.x), mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2; W3.dist = pinch.dist * pinch.d / Math.max(20, d); W3.yaw = pinch.yaw - (ang - pinch.ang); pan(mx - pinch.mx, my - pinch.my); pinch.mx = mx; pinch.my = my; clampT(); return }
      if (!drag) return; if (!drag.moved && Math.hypot(e.clientX - drag.x, e.clientY - drag.y) > 7) { drag.moved = true; world.classList.add('dragging') }
      if (drag.moved) { if (drag.rot) W3.yaw -= dx * .006; else { pan(dx, dy); const now = performance.now(), dt = Math.max(1, now - lastMove); W3.vx = dx / dt * 16; W3.vz = dy / dt * 16; lastMove = now } } });
    const end = e => { stop(e); if (!pts.has(e.pointerId)) return; pts.delete(e.pointerId); if (pts.size < 2) pinch = null; if (pts.size) return; world.classList.remove('dragging');
      if (drag && !drag.moved && e.type === 'pointerup') { const id = pickAt(e.clientX, e.clientY); id ? village.select(id) : village.deselect() } else if (drag && performance.now() - lastMove > 80) { W3.vx = W3.vz = 0 } drag = null };
    cv.addEventListener('pointerup', end); cv.addEventListener('pointercancel', end);
    cv.addEventListener('wheel', e => { e.preventDefault(); e.stopPropagation(); geste = performance.now(); W3.goal = null; W3.dist *= Math.exp(e.deltaY * .0012); clampT() }, { passive: false });
    cv.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse' && hover) { hover = null; world.classList.remove('over-bld') } })
  }
  // ---------- clavier (PC) : flèches ou ZQSD / WASD pour se déplacer, A / E pour tourner, + / − pour zoomer ----------
  const keys = new Set(), KEYMAP = { arrowleft: 'l', q: 'l', arrowright: 'r', d: 'r', arrowup: 'u', z: 'u', w: 'u', arrowdown: 'b', s: 'b', a: 'rl', e: 'rr', '+': 'in', '=': 'in', '-': 'out' };
  const keyOk = e => on && !e.ctrlKey && !e.metaKey && !e.altKey && !/input|textarea|select/i.test(e.target.tagName) && !$('#panel').classList.contains('open') && !$('#raceScreen').classList.contains('open') && !$('#studio')?.classList.contains('open');
  addEventListener('keydown', e => { const k = KEYMAP[e.key.toLowerCase()]; if (!k || !keyOk(e)) return; keys.add(k); W3.goal = null; if (e.key.startsWith('Arrow')) e.preventDefault() });
  addEventListener('keyup', e => { const k = KEYMAP[e.key.toLowerCase()]; if (k) keys.delete(k) }); addEventListener('blur', () => keys.clear());
  function stepKeys(dt) { if (!keys.size) return; const v = 520 * dt; pan((keys.has('l') ? v : 0) - (keys.has('r') ? v : 0), (keys.has('u') ? v : 0) - (keys.has('b') ? v : 0)); if (keys.has('rl')) W3.yaw += dt * 1.4; if (keys.has('rr')) W3.yaw -= dt * 1.4; if (keys.has('in')) W3.dist *= 1 - dt * 1.2; if (keys.has('out')) W3.dist *= 1 + dt * 1.2; clampT() }
  // ---------- boucle ----------
  let selId = null;
  function frame(now) {
    raf = requestAnimationFrame(frame); if (!on) return;
    if ($('#raceScreen').classList.contains('open') || document.hidden) { last = now; return }
    // un panneau couvre le domaine : quelques images par seconde suffisent (batterie des téléphones)
    if ($('#panel').classList.contains('open') && !pts.size && now - last < 150) return;
    // 2.6 : domaine au repos (aucun geste depuis 1,2 s, caméra immobile) : 30 images/s suffisent — moitié moins de calcul, de batterie et de chauffe
    if (!pts.size && !keys.size && !W3.goal && Math.abs(W3.vx) + Math.abs(W3.vz) < .2 && now - geste > 1200 && now - last < 30) return;
    const dt = Math.min(.05, (now - (last || now)) / 1000); last = now; const t = now / 1000;
    raceWorld.uniforms.uTime.value = t; light();
    if (!drag && !pinch && (Math.abs(W3.vx) + Math.abs(W3.vz) > .2)) { pan(W3.vx, W3.vz); W3.vx *= .92; W3.vz *= .92 }
    stepKeys(dt);
    // sélection : la caméra glisse vers le bâtiment, anneau doré qui pulse, bâtiment éclairé
    const sel = village.selected; if (sel !== selId) { selId = sel; if (sel && B[sel]) W3.goal = cadre(sel) }
    if (W3.goal) { const k = 1 - Math.pow(.02, dt); W3.tx += (W3.goal.x - W3.tx) * k; W3.tz += (W3.goal.z - W3.tz) * k; W3.dist += (W3.goal.d - W3.dist) * k; if (Math.hypot(W3.goal.x - W3.tx, W3.goal.z - W3.tz) < .3) W3.goal = null }
    const chk = t > (T.nextChk || 0); if (chk) T.nextChk = t + .5;
    R.getDrawingBufferSize(HL.res);
    for (const id in T.blds) { const b = T.blds[id], s = id === selId, hv = id === hover, still = REDUCE_MOTION.matches, U = T.bmats[id].userData.u; U.uHi.value += ((s ? .85 + (still ? 0 : .25 * Math.sin(t * 3)) : hv ? .45 : 0) - U.uHi.value) * .18;
      const h = U.uHi.value; if (b.ol) { b.ol.visible = h > .02; b.ol.material.uniforms.uA.value = Math.min(1, h * 1.05) } if (b.zn) { b.zn.visible = h > .02; b.zn.userData.fill.material.opacity = h * .16; b.zn.userData.edge.material.opacity = h * .55 }
      // un bâtiment amélioré ou construit est reconstruit (bannières, Salle des trophées)
      if (!chk) continue; let l = 1; try { l = dlv(id) } catch (e) { } if (l !== b.lv) rebuild(id) }
    if (chk && built && JSON.stringify(mineList()) !== mineSig) buildMine();
    if (sails) sails.rotation.z -= dt * .9;
    if (chk && built && decoOwned().join(',') !== decoSig) decos();
    for (const w of swans) { w.a += dt * w.sp; w.o.position.set(-38 + Math.cos(w.a) * w.r, .1, 88 + Math.sin(w.a) * w.r * 1.25); w.o.rotation.y = -w.a - Math.PI / 2 }
    stepHorses(dt, t); if (T.smoke) stepLife(dt, t); camera(); R.render(S, cam); T.images = (T.images || 0) + 1; placeUI();
    if (!T.shown) { T.shown = true; try { splash.hide() } catch (e) { } hooks.emit('domaine3d:pret', T.ms) }
  }
  function rebuild(id) {
    const b = T.blds[id], l = dlv(id), r = ({ haras, ecurie, clinique, moulin, chantier, carriere, paddocks, hippodrome })[id](l); b.lv = l;
    for (const c of [...b.g.children]) if (c !== sails && c !== b.zn) { b.g.remove(c); c.geometry && c.geometry.dispose(); if (c.userData.outline) c.material.dispose() }
    b.ol = null; if (r.P.length) { const m = mesh(r.P, T.bmats[id]); m.userData.id = id; b.g.add(m); T.pick = T.pick.filter(o => o.userData.id !== id).concat(m); b.ol = outline(m); b.g.add(b.ol) }
    (r.flags || []).forEach(([fx, fy, fz], k) => { const f = K().flagMesh(k % 2 ? C.red : C.navy, C.gold, 3.2, 2); f.position.set(fx, fy + 3.5, fz); b.g.add(f) })
  }
  // ---------- activation ----------
  // contexte WebGL perdu (mémoire du téléphone) : on ne provoque jamais de perte nous-mêmes ; le navigateur rend le contexte et
  // three.js recharge tout seul géométries, textures et shaders au premier rendu qui suit
  let lost = null;
  function renderer() {
        if (R && R.getContext().isContextLost()) { R.domElement.remove(); R = null }
        if (!R) { const cv = document.createElement('canvas'); cv.id = 'domain3d'; world.prepend(cv); R = new THREE.WebGLRenderer({ canvas: cv, antialias: true, powerPreference: 'high-performance' }); R.outputColorSpace = THREE.SRGBColorSpace; R.toneMapping = THREE.ACESFilmicToneMapping; R.toneMappingExposure = 1.05; R.shadowMap.enabled = !!QUALITY[settings.level()].shadow; R.shadowMap.type = THREE.PCFSoftShadowMap; input(cv);
          cv.addEventListener('webglcontextlost', e => { e.preventDefault(); if (!lost) { lost = document.createElement('div'); lost.className = 'd3-lost'; lost.innerHTML = '<b>Affichage 3D interrompu</b><span>Le téléphone a repris la mémoire graphique : reprise dès qu’il la rend.</span><button class="action">RECHARGER</button>'; lost.querySelector('button').onclick = () => location.reload(); world.appendChild(lost) } });
          cv.addEventListener('webglcontextrestored', () => { lost?.remove(); lost = null; if (T) T.tod = null; try { R.shadowMap.needsUpdate = true } catch (e) { } }) }
        R.setPixelRatio(Math.min(QUALITY[settings.level()].pr, devicePixelRatio || 1) * settings.scale()) }
  // démarrage du jeu : l'essentiel (sol, bâtiments, clôtures) en étapes, compilation des shaders en parallèle quand le pilote le
  // permet (KHR_parallel_shader_compile), première image ; puis le décor, les décors achetés et les chevaux, une étape par tâche
  let starting = false;
  const ESSENTIEL = 1 + VILLAGE.order.length + 1; // scène et sol, un bâtiment par étape, clôtures
  async function start() {
    if (on || starting) return; if (!supported()) { try { splash.fail('La 3D n’est pas disponible', 'Le domaine et les courses sont en 3D : ton navigateur doit prendre en charge <b>WebGL 2</b>. Mets-le à jour, ou active l’accélération matérielle dans ses réglages, puis recharge la page.') } catch (e) { } return }
    starting = true; const t0 = performance.now();
    try {
      renderer(); if (world.clientWidth < world.clientHeight * .8) { W3.dist = 280; W3.tz = -4 }
      const L = buildSteps(), next = () => new Promise(r => setTimeout(r, 0));
      for (let k = 0; k < ESSENTIEL; k++) { L[k](); try { splash.step(`Construction du domaine… ${Math.round((k + 1) / ESSENTIEL * 100)} %`) } catch (e) { } await next() }
      light(); camera(); try { splash.step('Préparation de la lumière…') } catch (e) { }
      // compilation en parallèle seulement si le pilote la propose (sinon three.js l'annonce dans la console et compile quand même)
      if (R.compileAsync && R.extensions.has('KHR_parallel_shader_compile')) await R.compileAsync(S, cam).catch(() => { }); else R.compile(S, cam);
      T.ms = Math.round(performance.now() - t0); show();
      for (let k = ESSENTIEL; k < L.length; k++) { await next(); L[k]() }
      T.tod = null; // les lampes du décor prennent la lumière de l'heure
      T.complet = Math.round(performance.now() - t0)
    } catch (e) { console.error('domaine 3D', e); try { splash.fail('Le domaine n’a pas pu se construire', 'Recharge la page. Si le problème revient, signale-le depuis Réglages → Aide (un rapport est prêt à copier).') } catch (x) { } }
    starting = false
  }
  function show() { on = true; world.classList.add('d3-on'); adopt(); if (!raf) raf = requestAnimationFrame(frame) }
  hooks.on('ready', () => setTimeout(start, 30));
  // 2.8 : un bâtiment du domaine à son niveau actuel, hors de la scène du domaine (le château vu depuis l'Hippodrome Royal est le haras du joueur) ;
  // même matériau (fenêtres qui s'allument la nuit : model(id).userData.night(v))
  function model(id) {
    const mk = ({ haras, ecurie, clinique, moulin, chantier, carriere, paddocks, hippodrome })[id]; if (!mk) return null;
    let l = 1; try { l = dlv(id) || 1 } catch (e) { }
    const r = mk(l), mat = bldMat(), g = new THREE.Group(); if (r.P.length) g.add(mesh(r.P, mat));
    (r.flags || []).forEach(([fx, fy, fz], k) => { const f = K().flagMesh(k % 2 ? C.red : C.navy, C.gold, 3.2, 2); f.position.set(fx, fy + 3.5, fz); g.add(f) });
    g.userData.night = v => { mat.userData.u.uNight.value = v }; return g
  }
  return { get on() { return on }, start, view: W3, supported, model, quality() { if (R) R.setPixelRatio(Math.min(QUALITY[settings.level()].pr, devicePixelRatio || 1) * settings.scale()) }, get stats() { return T && { ms: T.ms, tris: R && R.info.render.triangles, calls: R && R.info.render.calls, images: T.images || 0 } },
    // capture sans attendre requestAnimationFrame (panneau masqué) : fait avancer la vie de ms millisecondes puis dessine
    croise,
    snap(ms = 0) { if (!on) return; const t = performance.now() / 1000; for (let k = 0; k < 4; k++) { stepHorses(ms / 4000, t); if (T.smoke) stepLife(ms / 4000, t) } raceWorld.uniforms.uTime.value = t; light(); camera(); R.render(S, cam); placeUI() } }
})();
