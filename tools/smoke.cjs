// Test de fumée (nécessite Playwright) : charge le jeu avec plusieurs sauvegardes types et ouvre tous les écrans.
//   node tools/smoke.cjs                 le jeu doit être servi sur http://localhost:8765 (python3 -m http.server 8765)
//   node tools/smoke.cjs --shots dossier captures de chaque écran, en 1280×800 et 390×844
//   ONLY=confirme,neuf node tools/smoke.cjs   seulement ces profils ; MOBILE=1 : aussi en 390×844 (et 320×568 pour les parties avancées), sans captures (intégration continue)
// Échoue (code 1) à la moindre erreur JavaScript, à un module manquant ou à un texte cassé (undefined, NaN).
const { chromium } = require('playwright');
const URL = process.env.URL || 'http://localhost:8765/index.html';
const shotsDir = process.argv.includes('--shots') ? process.argv[process.argv.indexOf('--shots') + 1] : null;
const MODULES = ['hooks', 'stable', 'career', 'meta', 'season', 'breeding', 'rival', 'gear', 'tour', 'palmares', 'shop', 'moments', 'pace', 'ambiance', 'photo',
  'onboarding', 'replays', 'defi', 'partage', 'tele', 'installer', 'speaker', 'jockeys', 'domaine', 'ventes', 'legendes', 'duel', 'couronne', 'nouveautes', 'HORSE3D', 'raceWorld', 'domaine3d', 'haies', 'decors', 'manette', 'direct', 'fluidite', 'journal', 'mesures', 'aide', 'ecuries'];
const CHAMPION = { name: 'Éclair de Lune', coat: 'alezan', main: '#c21c27', second: '#f4f2ec', pattern: 'chevrons', cap: '#f4f2ec' };
// chaque profil : état de départ (localStorage) + éventuellement du code joué dans le jeu avant de recharger la page
const PROFILES = {
  neuf: {},
  debutant: { ls: { 'trr.champion': CHAMPION } },
  'une-course': { ls: { 'trr.champion': CHAMPION, 'trr.progress': { stats: { races: 1, wins: 0 } } } },
  confirme: { ls: { 'trr.champion': CHAMPION, 'trr.progress': { stats: { races: 12, wins: 5 }, best: 350 } } },
  'fin-de-partie': {
    ls: { 'trr.champion': CHAMPION, 'trr.progress': { stats: { races: 160, wins: 74 }, best: 2100 } },
    // on remplit la partie depuis le jeu lui-même, puis on recharge
    setup: `state.gold=2e6;state.feed=5e5;state.gems=900;state.trophies=2100;
      for(const n of['Étoile du Roi','Mistral Royal','Perle d’Or'])stable.addHorse({name:n,coat:'noir',stats:{vit:80,acc:78,end:77,dep:70,tac:72,tem:74},caps:{vit:97,acc:95,end:96,dep:92,tac:94,tem:93},dist:2000,level:14,talent:'coeur',rare:true});
      stable.data.horses.forEach(h=>{h.level=Math.max(h.level,12);h.races=30;h.wins=12});
      career.data.gear.owned=GEAR.map(g=>g.id);career.data.jockeys.owned=JOCKEYS.map(j=>j.id);career.data.jockeys.xp={lea:30,hugo:12};
      career.data.rival={w:21,l:14,lvl:5,met:true};career.data.tour.cups=6;
      try{domaine.debug.max()}catch(e){}try{legendes.debug.fill()}catch(e){}
      sync();stable.save();localStorage.setItem('trr.progress',JSON.stringify(career.data))` },
  // noms piégés (2.6) : chevaux, champion et face-à-face au nom de balise HTML ; aucun code ne doit s'exécuter, sur aucun écran
  'noms-pieges': { ls: { 'trr.champion': CHAMPION },
    setup: `stable.data.horses.forEach((h,i)=>h.name=['"><img src onerror=__x(1)>',"<img src onerror=__x(2)>","'><svg onload=__x(3)>"][i%3]);
      champion.set({...champion.get(),name:'"><img src onerror=__x(4)>'});career.data.face={'<img src onerror=__x(5)>':{n:3,devant:1}};
      sync();stable.save();localStorage.setItem('trr.progress',JSON.stringify(career.data))` },
  'sauvegarde-abimee': { ls: { 'trr.champion': CHAMPION, 'trr.progress': '{"stats":{"races":4' , 'trr.bak': { t: 1, k: { 'trr.progress': JSON.stringify({ stats: { races: 4, wins: 1 } }) } } } },
};
const SCREENS = [
  ['domaine', `document.querySelector('#panel').classList.remove('open')`],
  ['courses', `openCourses()`], ['ecurie', `openStable()`], ['missions', `career.openMissions()`], ['ligues', `career.openTrophies()`],
  ['saison', `season.open()`], ['palmares', `palmares.open()`], ['boutique', `shop.open()`], ['tournoi', `tour.open()`], ['reglages', `openSettings()`],
  ['haras', `breeding.open()`], ['batiment', `document.querySelector('#panel').classList.remove('open');village.select('moulin')`],
  ['batiments', `typeof domaine!=='undefined'&&domaine.open('carriere')`], ['ventes', `typeof ventes!=='undefined'&&ventes.open()`],
  ['legendes', `typeof legendes!=='undefined'&&legendes.open()`], ['couronne', `typeof couronne!=='undefined'&&couronne.open()`],
  ['nouveautes', `typeof nouveautes!=='undefined'&&nouveautes.open()`], ['duel', `typeof duel!=='undefined'&&duel.list.length&&duel.card(duel.list[0])`],
  ['rapport', `aide.signaler();document.querySelector('#bugVoir').open=true;document.querySelector('#bugPre').textContent=mesures.rapport('essai')`], ['confidentialite', `aide.confidentialite()`], ['credits', `aide.credits()`],
  ['domaine-3d', `document.querySelector('#panel').classList.remove('open');village.select('haras')`],
];
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  let failed = 0;
  for (const [name, P] of Object.entries(PROFILES).filter(([n]) => !process.env.ONLY || process.env.ONLY.split(',').includes(n))) {
    // MOBILE : aussi en 390×844 et, pour les parties avancées (tout débloqué, grands nombres), sur un petit téléphone 320×568 (2.7)
    for (const vp of shotsDir || process.env.MOBILE ? [{ width: 1280, height: 800, tag: 'pc' }, { width: 390, height: 844, tag: 'mobile' }, ...(['confirme', 'fin-de-partie'].includes(name) ? [{ width: 320, height: 568, tag: 'petit' }] : [])] : [{ width: 1280, height: 800, tag: 'pc' }]) {
      const ctx = await b.newContext({ viewport: { width: vp.width, height: vp.height }, hasTouch: vp.tag !== 'pc' });
      const p = await ctx.newPage(), errs = [];
      p.on('pageerror', e => errs.push(e.message));
      p.on('console', m => { if (m.type() === 'error') errs.push(m.text()) });
      await p.addInitScript(() => { window.__x = n => { (window.__xss = window.__xss || []).push(n) } });
      await p.addInitScript(ls => { if (sessionStorage.getItem('smoke')) return; sessionStorage.setItem('smoke', 1); localStorage.clear();
        for (const [k, v] of Object.entries(ls || {})) localStorage.setItem(k, typeof v === 'string' ? v : JSON.stringify(v)) }, P.ls);
      // le domaine est entièrement en 3D (2.5) : il doit apparaître, sans aucun calque 2D
      const d3 = async () => { const ok = await p.waitForFunction(() => typeof domaine3d !== 'undefined' && domaine3d.on, null, { timeout: 90000, polling: 250 }).then(() => true, () => false); if (!ok) errs.push('domaine 3D jamais affiché'); };
      await p.goto(URL); await p.waitForTimeout(1200); await d3();
      if (P.setup) { await p.evaluate(P.setup).catch(e => errs.push('setup: ' + e.message)); await p.reload(); await p.waitForTimeout(1200); await d3() }
      const flat = await p.evaluate(() => ['#map', '.map-base', '#ambient', '#villageGL', '#villageGlow'].filter(q => document.querySelector(q))); if (flat.length) errs.push('calques 2D présents : ' + flat.join(', '));
      const missing = await p.evaluate(list => list.filter(m => { try { return eval(`typeof ${m}`) === 'undefined' } catch (e) { return true } }), MODULES);
      const ko = await p.evaluate(() => window.__modulesKo || ['chargeur des modules absent']); if (ko.length) errs.push('modules en échec au chargement : ' + ko.join(', '));
      for (const [screen, js] of SCREENS) {
        await p.evaluate(`try{while(coach.open)coach.hide()}catch(e){};${js}`).catch(e => errs.push(`${screen}: ${e.message}`));
        await p.waitForTimeout(shotsDir ? 700 : 150);
        const bad = await p.evaluate(() => { const t = document.body.innerText; return ['undefined', 'NaN', '[object Object]', 'Infinity'].filter(w => t.includes(w)) });
        if (bad.length) errs.push(`${screen}: texte cassé (${bad.join(', ')})`);
        // lisibilité (2.6) : aucun texte visible sous 10 px
        const tiny = await p.evaluate(() => { const vis = e => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(e).visibility !== 'hidden' && +getComputedStyle(e).opacity > .05 };
          return [...new Set([...document.querySelectorAll('body *')].filter(e => vis(e) && [...e.childNodes].some(n => n.nodeType === 3 && n.textContent.trim()) && parseFloat(getComputedStyle(e).fontSize) < 10).map(e => `« ${e.textContent.trim().slice(0, 16)} » ${getComputedStyle(e).fontSize}`))] }).catch(() => []);
        if (tiny.length) errs.push(`${screen}: texte trop petit (${tiny.slice(0, 4).join(', ')})`);
        // HUD du domaine (2.7) : carte du bâtiment, objectif, coffres, COURIR, navigation, rails, ressources et profil ne se chevauchent jamais
        if (screen === 'domaine' || screen === 'batiment' || screen === 'domaine-3d') {
          await p.waitForFunction(() => { const c = document.querySelector('#selection'); return !c.classList.contains('open') || +getComputedStyle(c).opacity > .99 }, null, { timeout: 8000 }).catch(() => {}); await p.waitForTimeout(350);
          const hud = await p.evaluate(() => { const vis = e => { if (!e) return false; const r = e.getBoundingClientRect(), cs = getComputedStyle(e); return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && +cs.opacity > .05 };
            const E = { carte: '#selection', objectif: '.homebar .goal', coffres: '.homebar .slots', COURIR: '#playBtn', navigation: '.dock', 'rail gauche': '.rail.left', 'rail droit': '.rail.right', ressources: '.resources', profil: '.profile' };
            const k = Object.keys(E).filter(n => vis(document.querySelector(E[n]))), el = n => document.querySelector(E[n]), R = n => el(n).getBoundingClientRect(), o = [];
            for (let i = 0; i < k.length; i++) for (let j = i + 1; j < k.length; j++) { const a = R(k[i]), b = R(k[j]); if (a.left < b.right - 1 && b.left < a.right - 1 && a.top < b.bottom - 1 && b.top < a.bottom - 1 && !el(k[i]).contains(el(k[j])) && !el(k[j]).contains(el(k[i]))) o.push(k[i] + ' × ' + k[j]) }
            return o }).catch(() => []);
          if (hud.length) errs.push(`${screen}: HUD du domaine qui se chevauche (${hud.join(', ')})`);
        }
        if (shotsDir) await p.screenshot({ path: `${shotsDir}/${name}-${vp.tag}-${screen}.png` });
      }
      // erreurs rattrapées sans bruit (écouteurs de hooks, fichiers introuvables) : le journal du jeu les a notées
      const notees = await p.evaluate(() => typeof journal === 'undefined' ? [] : journal.erreurs.map(e => `${e.type} : ${e.msg}${e.src ? ' (' + e.src + ')' : ''}`)).catch(() => []);
      errs.push(...notees.map(m => 'journal · ' + m));
      const xss = await p.evaluate(() => window.__xss || []).catch(() => []); if (xss.length) errs.push('code injecté exécuté (noms piégés) : ' + xss.join(', '));
      const ok = !errs.length && !missing.length; if (!ok) failed++;
      console.log(`${ok ? '✓' : '✗'} ${name} (${vp.tag})${missing.length ? ' · modules manquants : ' + missing.join(', ') : ''}${errs.length ? '\n    ' + [...new Set(errs)].slice(0, 8).join('\n    ') : ''}`);
      await ctx.close();
    }
  }
  await b.close();
  console.log(failed ? `❌ ${failed} profil(s) en échec` : '✅ Tous les profils se chargent sans erreur');
  process.exit(failed ? 1 : 0);
})();
