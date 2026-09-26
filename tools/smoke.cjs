// Test de fumée (nécessite Playwright) : charge le jeu avec plusieurs sauvegardes types et ouvre tous les écrans.
//   node tools/smoke.cjs                 le jeu doit être servi sur http://localhost:8765 (python3 -m http.server 8765)
//   node tools/smoke.cjs --shots dossier captures de chaque écran, en 1280×800 et 390×844
//   ONLY=confirme,neuf node tools/smoke.cjs   seulement ces profils
// Échoue (code 1) à la moindre erreur JavaScript, à un module manquant ou à un texte cassé (undefined, NaN).
const { chromium } = require('playwright');
const URL = process.env.URL || 'http://localhost:8765/index.html';
const shotsDir = process.argv.includes('--shots') ? process.argv[process.argv.indexOf('--shots') + 1] : null;
const MODULES = ['hooks', 'stable', 'career', 'meta', 'season', 'breeding', 'rival', 'gear', 'tour', 'palmares', 'shop', 'moments', 'pace', 'ambiance', 'photo',
  'villageGL', 'villageLife', 'villageVie', 'onboarding', 'replays', 'defi', 'partage', 'pauseRace', 'tele', 'installer', 'speaker', 'jockeys', 'domaine', 'ventes', 'legendes', 'duel', 'couronne', 'nouveautes'];
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
];
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  let failed = 0;
  for (const [name, P] of Object.entries(PROFILES).filter(([n]) => !process.env.ONLY || process.env.ONLY.split(',').includes(n))) {
    for (const vp of shotsDir ? [{ width: 1280, height: 800, tag: 'pc' }, { width: 390, height: 844, tag: 'mobile' }] : [{ width: 1280, height: 800, tag: 'pc' }]) {
      const ctx = await b.newContext({ viewport: { width: vp.width, height: vp.height }, hasTouch: vp.tag === 'mobile' });
      const p = await ctx.newPage(), errs = [];
      p.on('pageerror', e => errs.push(e.message));
      p.on('console', m => { if (m.type() === 'error') errs.push(m.text()) });
      await p.addInitScript(ls => { if (sessionStorage.getItem('smoke')) return; sessionStorage.setItem('smoke', 1); localStorage.clear();
        for (const [k, v] of Object.entries(ls || {})) localStorage.setItem(k, typeof v === 'string' ? v : JSON.stringify(v)) }, P.ls);
      await p.goto(URL); await p.waitForTimeout(2200);
      if (P.setup) { await p.evaluate(P.setup).catch(e => errs.push('setup: ' + e.message)); await p.reload(); await p.waitForTimeout(2200) }
      const missing = await p.evaluate(list => list.filter(m => { try { return eval(`typeof ${m}`) === 'undefined' } catch (e) { return true } }), MODULES);
      const ko = await p.evaluate(() => window.__modulesKo || ['chargeur des modules absent']); if (ko.length) errs.push('modules en échec au chargement : ' + ko.join(', '));
      for (const [screen, js] of SCREENS) {
        await p.evaluate(`try{while(coach.open)coach.hide()}catch(e){};${js}`).catch(e => errs.push(`${screen}: ${e.message}`));
        await p.waitForTimeout(shotsDir ? 700 : 150);
        const bad = await p.evaluate(() => { const t = document.body.innerText; return ['undefined', 'NaN', '[object Object]', 'Infinity'].filter(w => t.includes(w)) });
        if (bad.length) errs.push(`${screen}: texte cassé (${bad.join(', ')})`);
        if (shotsDir) await p.screenshot({ path: `${shotsDir}/${name}-${vp.tag}-${screen}.png` });
      }
      const ok = !errs.length && !missing.length; if (!ok) failed++;
      console.log(`${ok ? '✓' : '✗'} ${name} (${vp.tag})${missing.length ? ' · modules manquants : ' + missing.join(', ') : ''}${errs.length ? '\n    ' + [...new Set(errs)].slice(0, 8).join('\n    ') : ''}`);
      await ctx.close();
    }
  }
  await b.close();
  console.log(failed ? `❌ ${failed} profil(s) en échec` : '✅ Tous les profils se chargent sans erreur');
  process.exit(failed ? 1 : 0);
})();
