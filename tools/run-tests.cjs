// Tests du jeu (tools/tests.js) dans Chromium piloté par Playwright — pour l'intégration continue et en local.
//   node tools/run-tests.cjs [--quick]     (le jeu doit être servi sur http://localhost:8765, ou PORT=…)
// Code de sortie 1 si un test échoue ou si une erreur inattendue apparaît dans la page.
const { chromium } = require('playwright');
const PORT = process.env.PORT || 8765, quick = process.argv.includes('--quick');
// erreurs provoquées exprès par les tests (journal : erreur rattrapée par hooks)
const VOULUES = [/erreur de test du journal/];
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: 1280, height: 800 } });
  const errs = [];
  p.on('pageerror', e => errs.push(e.message));
  p.on('console', m => { if (m.type() === 'error') errs.push('console : ' + m.text()) });
  await p.addInitScript(() => { if (!localStorage.getItem('trr.stable')) localStorage.setItem('trr.champion', JSON.stringify({ name: 'Éclair de Lune', coat: 'alezan', main: '#c21c27', second: '#f4f2ec', pattern: 'chevrons', cap: '#f4f2ec' })) });
  await p.goto(`http://localhost:${PORT}/index.html`, { timeout: 90000 }); await p.waitForTimeout(2500);
  const t0 = Date.now();
  const res = await p.evaluate(async q => { const m = await import('./tools/tests.js'); return m.run({ quick: q }) }, quick);
  for (const t of res.results) console.log(`${t.ok} ${t.test} — ${t['détail'] || ''}`);
  const autres = errs.filter(e => !VOULUES.some(r => r.test(e)));
  if (autres.length) console.log('Erreurs dans la page :\n  ' + [...new Set(autres)].slice(0, 12).join('\n  '));
  console.log(`${res.ok && !autres.length ? '✅' : '❌'} ${res.results.filter(t => t.ok === '✓').length}/${res.results.length} tests · ${((Date.now() - t0) / 1000).toFixed(0)} s`);
  await b.close();
  process.exit(res.ok && !autres.length ? 0 : 1);
})().catch(e => { console.error(e); process.exit(1) });
