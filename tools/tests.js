// Tests automatiques du jeu, à lancer dans la console du jeu servi en local (aucune installation) :
//   await import('./tools/tests.js').then(m => m.run())
// Ne sauvegarde rien (window.__noSave) et restaure la progression à la fin. Durée : 1 à 2 minutes.
import './balance-bot.js';
const bot = window.bot;
export async function run({ quick = false } = {}) {
  const N = quick ? 16 : 30, out = [], pass = (name, ok, detail) => { out.push({ test: name, ok: ok ? '✓' : '✗', détail: detail }); console[ok ? 'log' : 'warn'](`${ok ? '✓' : '✗'} ${name} — ${detail}`) };
  const tick = () => new Promise(r => setTimeout(r, 0));
  window.__noSave = true; while (coach.open) coach.hide();
  const saved = JSON.stringify(career.data), savedStrat = state.strategy, savedActive = stable.data.active;
  career.data.stats.races = 10; // joueur confirmé (le plateau débutant fausserait l'équilibrage)
  try {
    // 1. modules présents
    const mods = ['hooks', 'stable', 'career', 'meta', 'moments', 'pace', 'ambiance', 'photo', 'villageGL', 'villageLife', 'villageVie', 'onboarding', 'replays', 'defi'];
    const missing = mods.filter(m => { try { return typeof eval(m) === 'undefined' } catch (e) { return true } });
    pass('Modules chargés', !missing.length, missing.length ? 'manquants : ' + missing.join(', ') : `${mods.length} modules`); await tick();

    // 2. déterminisme : des courses avec actions variées se rejouent à l'identique
    let det = 0; const D = quick ? 4 : 8;
    const completeOrig = completeRace;
    for (let k = 1; k <= D; k++) {
      RACE = { ...MEETINGS[k % 3] }; currentField = null; buildField(k * 104729); stable.active().fatigue = 10; state.feed = 99999; state.strategy = ['leader', 'stalker', 'finisher'][k % 3];
      startRace(); threeRace.startPhase = 'waiting'; threeRace.goTime = performance.now() - (120 + k * 37); launchFromStalls(); clearInterval(raceLoop); raceLoop = -1; let n = 0;
      while (finishOrder.length < 6 && n < 9000) { if (coach.open) coach.hide(); if (moments.active && n % 4 === 0) moments.choose(n % 3 ? 'a' : 'b'); if (n % 41 === 0) steer(n % 82 ? 1 : -1);
        if (!playerFinal && progress[0] > 35 && sprintReach(racePlayer, playerEnergy, racePlayer.cruise) >= remainingM(progress[0])) sprint(); runRaceV2(); n++ }
      raceLoop = null; const r = replays.last(); while (coach.open) coach.hide(); if (replays.verify(r).ok) det++; leaveRace(); while (coach.open) coach.hide(); await tick();
    }
    completeRace = completeOrig;
    pass('Rejeu identique', det === D, `${det}/${D} courses`);
    { const r = JSON.parse(JSON.stringify(replays.last())); r.result.times[0] -= .3; pass('Falsification détectée', replays.verify(r).ok === false, 'temps truqué refusé') }
    await tick();

    // 3. équilibrage : lire le plateau paie, taux de victoire dans la cible
    stable.setActive('h1');
    const T = bot.tactics('m2', N, bot.smart), rk = s => +s.match(/rang ([\d.]+)/)[1], wins = s => +s.match(/victoires (\d+)/)[1];
    pass('Lecture du plateau ≥ meilleure tactique fixe', rk(T.lecture) <= Math.min(rk(T.leader), rk(T.stalker), rk(T.finisher)) + .05, `lecture ${rk(T.lecture)} · fixes ${rk(T.leader)} / ${rk(T.stalker)} / ${rk(T.finisher)}`);
    const wr = wins(T.lecture) / N; pass('Taux de victoire 35–75 % (1 600 m, cheval idéal)', wr >= .35 && wr <= .75, `${Math.round(wr * 100)} %`); await tick();

    // 4. temps forts : la politique « malin » ne fait pas moins bien que toujours oui / toujours non
    const A = { tire: 'a', breche: 'a', attaque: 'a' }; let okM = 0; const det2 = [];
    for (const m of ['m1', 'm3']) { const r = await bot.run([[m + ' non', {}, m, 'stalker', N], [m + ' oui', A, m, 'stalker', N], [m + ' malin', bot.smart, m, 'stalker', N]]);
      const s = rk(r[m + ' malin']), best = Math.min(rk(r[m + ' non']), rk(r[m + ' oui'])); if (s <= best + .15) okM++; det2.push(`${m} malin ${s} / meilleur fixe ${best}`) }
    pass('Temps forts : lire la course ne pénalise pas', okM === 2, det2.join(' · ')); await tick();

    // 5. premières minutes : déblocages
    career.data.stats.races = 0; onboarding.apply(); const locked0 = UNLOCKS.every(U => document.body.classList.contains('lk-' + U.k));
    career.data.stats.races = 7; onboarding.apply(); const open7 = UNLOCKS.every(U => !document.body.classList.contains('lk-' + U.k));
    pass('Déblocages progressifs', locked0 && open7, `0 course : tout verrouillé ${locked0 ? 'oui' : 'NON'} · 7 courses : tout ouvert ${open7 ? 'oui' : 'NON'}`);

    // 6. Défi du jour : même plateau pour tous, quel que soit le cheval ou la progression du joueur
    { const sig = () => JSON.stringify(defi.field().rivals.map(r => [r.stats, r.tac, r.pref, r.talent])); const a = sig(); stable.setActive('h2'); career.data.stats.races = 2; const b = sig(); stable.setActive(savedActive);
      pass('Défi du jour identique pour tous', a === b, `graine ${defi.meeting().seed} · ${defi.meeting().dist} m`) }

    // 7. aucun contenu factice visible
    const txt = document.body.innerText, bad = ['bientôt', 'Lorem', 'TODO', 'undefined', 'NaN'].filter(w => txt.includes(w));
    pass('Aucun texte factice ou cassé', !bad.length, bad.length ? 'trouvé : ' + bad.join(', ') : 'rien trouvé');
  } finally {
    Object.assign(career.data, JSON.parse(saved)); state.strategy = savedStrat; stable.setActive(savedActive); onboarding.apply(); while (coach.open) coach.hide();
  }
  console.table(out); const ok = out.every(t => t.ok === '✓'); console.log(ok ? '✅ Tous les tests passent' : '❌ Des tests échouent'); return { ok, results: out };
}
