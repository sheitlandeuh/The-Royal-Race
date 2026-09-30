// Chevauchements de l'interface (2.7, nécessite Playwright) : HUD du domaine (bâtiment choisi, objectif, coffres, COURIR, navigation,
// rails, ressources) et commandes de l'écran de course, sur une gamme de tailles d'écran (téléphones en portrait et en paysage, tablettes, PC).
//   python3 -m http.server 8765 puis node tools/hud.cjs          SIZES=390x844,844x390 node tools/hud.cjs    --shots dossier : captures
// Échoue (code 1) dès que deux éléments se recouvrent ou qu'un texte de commande sort de l'écran.
const { chromium } = require('playwright');
const URL = process.env.URL || 'http://localhost:8765/index.html';
const SIZES = (process.env.SIZES || '320x568,360x640,375x667,390x844,412x915,430x932,640x360,667x375,844x390,932x430,768x1024,1024x768,1280x800,1920x1080').split(',').map(s => s.split('x').map(Number));
const shots = process.argv.includes('--shots') ? process.argv[process.argv.indexOf('--shots') + 1] : null;
// rectangles des éléments visibles ; paires qui se recouvrent (un élément et son contenu ne comptent pas)
const OVERLAPS = E => {
  const vis = e => { if (!e) return false; const r = e.getBoundingClientRect(), cs = getComputedStyle(e); return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && +cs.opacity > .05 && cs.display !== 'none' };
  const k = Object.keys(E).filter(n => vis(document.querySelector(E[n]))), el = n => document.querySelector(E[n]), R = n => el(n).getBoundingClientRect(), o = [];
  for (let i = 0; i < k.length; i++) for (let j = i + 1; j < k.length; j++) { const a = R(k[i]), b = R(k[j]); if (a.left < b.right - 1 && b.left < a.right - 1 && a.top < b.bottom - 1 && b.top < a.bottom - 1 && !el(k[i]).contains(el(k[j])) && !el(k[j]).contains(el(k[i]))) o.push(k[i] + ' × ' + k[j]) }
  for (const n of k) { const r = R(n); if (r.left < -1 || r.right > innerWidth + 1 || r.bottom > innerHeight + 1) o.push(n + ' hors écran') }
  return o };
const DOMAINE = { 'carte du bâtiment': '#selection', objectif: '.homebar .goal', coffres: '.homebar .slots', COURIR: '#playBtn', navigation: '.dock', 'rail gauche': '.rail.left', 'rail droit': '.rail.right', ressources: '.resources', profil: '.profile' };
const COURSE = { carte: '#autoGallop', allure: '#paceCtl', sprint: '#sprintBtn', gauche: '#moveLeft', droite: '#moveRight', piste: '.lane-meter', 'légende piste': '.lane-meter span', quitter: '#quitRace', distance: '.race-head .distance', position: '.fp-head .position', message: '#raceComment', 'regard gauche': '#lookLeft', 'regard droit': '#lookRight' };
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true }), p = await ctx.newPage(), errs = [];
  p.on('pageerror', e => errs.push(e.message));
  // partie confirmée (tout est débloqué), grands nombres, cheval fatigué : l'objectif le plus long s'affiche
  await p.addInitScript(() => { if (sessionStorage.getItem('hud')) return; sessionStorage.setItem('hud', 1); localStorage.clear();
    localStorage.setItem('trr.champion', JSON.stringify({ name: 'Royal Thunder', coat: 'alezan', main: '#c21c27', second: '#f4f2ec', pattern: 'chevrons', cap: '#f4f2ec' }));
    localStorage.setItem('trr.progress', JSON.stringify({ stats: { races: 12, wins: 3 }, tips: { all: 1 }, news: '9.9' })); localStorage.setItem('trr.settings', JSON.stringify({ q: 'basse' })) });
  await p.goto(URL); await p.waitForFunction(() => typeof domaine3d !== 'undefined' && domaine3d.on, null, { timeout: 120000, polling: 250 });
  await p.evaluate(() => { state.gold = 2345678; state.feed = 456789; sync(); const h = stable.active(); h.fatigue = 95 });
  await p.waitForTimeout(3000);
  let failed = 0;
  for (const [w, h] of SIZES) {
    await p.setViewportSize({ width: w, height: h }); await p.waitForTimeout(400);
    // domaine : un bâtiment choisi (carte ouverte), puis sans sélection (objectif visible)
    const dom = [];
    for (const sel of ['carriere', null]) {
      await p.evaluate(s => { try { while (coach.open) coach.hide() } catch (e) { } document.querySelector('#panel').classList.remove('open'); s ? village.select(s) : village.deselect() }, sel);
      await p.waitForFunction(s => { const c = document.querySelector('#selection'); return s ? +getComputedStyle(c).opacity > .99 : +getComputedStyle(c).opacity < .01 }, sel, { timeout: 8000 }).catch(() => {});
      await p.waitForTimeout(350);
      dom.push(...(await p.evaluate(OVERLAPS, DOMAINE)).map(o => (sel ? 'bâtiment : ' : '') + o));
      if (shots && sel) await p.screenshot({ path: `${shots}/hud-domaine-${w}x${h}.png` });
    }
    // écran de course (commandes seules, sans lancer de course) avec les textes les plus longs
    await p.evaluate(() => { document.querySelector('#raceScreen').classList.add('open'); document.querySelector('#raceComment').textContent = 'Un cheval court à ta hauteur : pas de passage';
      document.querySelector('#sprintInfo').innerHTML = 'Sprint possible : <b>1 240 m</b> · arrivée : <b>2 400 m</b>'; document.querySelector('#meters').textContent = '2 400' });
    await p.waitForTimeout(250);
    const race = await p.evaluate(OVERLAPS, COURSE);
    if (shots) await p.screenshot({ path: `${shots}/hud-course-${w}x${h}.png` });
    await p.evaluate(() => document.querySelector('#raceScreen').classList.remove('open'));
    const all = [...new Set([...dom.map(x => 'domaine · ' + x), ...race.map(x => 'course · ' + x)])];
    if (all.length) failed++;
    console.log(`${all.length ? '✗' : '✓'} ${w}×${h}${all.length ? '\n    ' + all.join('\n    ') : ''}`);
  }
  if (errs.length) { failed++; console.log('erreurs :', errs.slice(0, 4).join(' | ')) }
  await b.close();
  console.log(failed ? `❌ ${failed} taille(s) avec chevauchement` : '✅ Aucun chevauchement, de 320 px à 1920 px');
  process.exit(failed ? 1 : 0);
})();
