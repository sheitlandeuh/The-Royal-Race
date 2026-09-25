// Bot d'équilibrage à lancer dans la console du navigateur (aucune installation) — jeu servi en local.
//   await import('./tools/balance-bot.js')  puis  await bot.run([...])  → résultats dans la console.
// Il ne sauvegarde rien (window.__noSave) et neutralise la fin de course (pas d'or, de trophées ni de coffres).
// Politique de temps forts : { tire:'a'|'b'|fn, breche:..., attaque:... } ; 'b' = ne rien faire.
export const bot = window.bot = (() => {
  // sans WebGL (machine sans carte graphique, navigateur qui a bloqué la 3D) : scène factice, la simulation n'a pas besoin de rendu
  const gl = (() => { try { return !!document.createElement('canvas').getContext('webgl2') } catch (e) { return false } })();
  function headless() {
    if (threeRace || gl) return;
    threeRace = { headless: true, startPhase: 'idle', goTime: 0, introStart: 0, falseStartPenalty: 0, horses: [], silks: [], markers: [], horseTextures: [], podiumTextures: [],
      podium: { visible: false }, stalls: { visible: true, userData: { doors: [] } }, renderer: { setPixelRatio() {}, setSize() {}, shadowMap: {} },
      sun: { color: { set() {} }, position: { set() {} } }, hemi: { color: { set() {} }, groundColor: { set() {} } }, scene: { fog: { color: { set() {} } }, add() {} }, camera: {} };
  }
  function race(meet, seed, tactic, policy) {
    headless();
    RACE = { ...MEETINGS.find(m => m.id === meet) }; state.strategy = tactic; career.data.rival.lvl = 0;
    const h = stable.active(); h.fatigue = 10; h.form = 62; h.moral = 72;
    currentField = null; buildField(seed); state.feed = 99999; startRace(); if (threeRace.headless) $('#raceScreen').classList.remove('open');
    threeRace.startPhase = 'waiting'; threeRace.goTime = performance.now() - 150; launchFromStalls();
    clearInterval(raceLoop); raceLoop = -1;
    let n = 0;
    while (finishOrder.length < 6 && n < 9000) {
      if (coach.open) coach.hide(); // un conseil de l'entraîneur met la course en pause
      if (!playerFinal && progress[0] > 35 && sprintReach(racePlayer, playerEnergy, racePlayer.cruise) >= remainingM(progress[0])) sprint();
      if (!moments.active) { const a = nearbyHorses(0)[0], boxed = a && a.gap < 1.6 && Math.abs(a.l - playerLane) < 11; playerLane += boxed ? (playerLane < 60 ? 4 : -4) : (14 - playerLane) * .05 }
      else { let c = policy[moments.cur.k] || 'b'; if (typeof c === 'function') c = c(moments.cur); if (c !== 'b') moments.choose(c) }
      runRaceV2(); n++;
    }
    const r = { rank: finishOrder.indexOf(0) + 1, log: moments.log.map(e => e.k + e.ch + (e.k === 'breche' && e.ch === 'a' ? (e.ok ? '+' : '-') : '')) };
    leaveRace(); return r;
  }
  function one(policy, meet = 'm2', tactic = 'stalker', N = 50) {
    let s = 0, w = 0; const cnt = {};
    for (let k = 1; k <= N; k++) { const r = race(meet, k * 7919, tactic, policy); s += r.rank; w += r.rank === 1; r.log.forEach(x => cnt[x] = (cnt[x] || 0) + 1) }
    return `rang ${(s / N).toFixed(2)} · victoires ${w}/${N} · ${JSON.stringify(cnt)}`;
  }
  // jobs : [[nom, politique, course, tactique, N]] — exécutés un par un pour ne pas bloquer la page
  async function run(jobs) {
    window.__noSave = true; const done = completeRace; completeRace = () => {}; const out = {};
    try { for (const [name, pol, meet, tac, N] of jobs) { out[name] = one(pol, meet, tac, N); await new Promise(r => setTimeout(r, 0)) } }
    finally { completeRace = done }
    console.table(out); return out;
  }
  const smart = {
    tire: () => RACE.dist <= 1200 ? 'b' : 'a',
    breche: 'a',
    attaque: c => RACE.dist > 1200 || playerEnergy > rivalAI[c.r - 1].energy + 15 ? 'a' : 'b',
  };
  // même graine, choix 'a' puis 'b' sur un seul type de temps fort : à quel point ce choix change-t-il le résultat ?
  async function pair(kind, meet = 'm2', tactic = 'stalker', N = 40) {
    window.__noSave = true; const done = completeRace; completeRace = () => {}; let diff = 0, changed = 0, seen = 0, better = 0;
    try { for (let k = 1; k <= N; k++) { const A = race(meet, k * 7919, tactic, { [kind]: 'a' }), B = race(meet, k * 7919, tactic, { [kind]: 'b' });
      if (!A.log.some(x => x.startsWith(kind))) continue; seen++; diff += B.rank - A.rank; if (A.rank !== B.rank) changed++; if (A.rank < B.rank) better++ } }
    finally { completeRace = done }
    return `${kind} ${meet} ${tactic} : vu ${seen}× · change le rang ${changed}× · 'a' meilleur ${better}× · écart moyen ${(diff / Math.max(1, seen)).toFixed(2)} place (positif = 'a' mieux)`;
  }
  // tactique choisie en lisant le plateau : course lente → mener, un seul animateur → dans les dos, course rapide → attendre
  const counter = () => { const n = currentField.rivals.filter(r => r.tac === 'leader').length; return n === 0 ? 'leader' : n >= 2 ? 'finisher' : 'stalker' };
  function tactics(meet, N = 40, policy = {}) {
    window.__noSave = true; const done = completeRace; completeRace = () => {}; const out = {};
    try { for (const mode of ['leader', 'stalker', 'finisher', 'lecture']) { let s = 0, w = 0;
      for (let k = 1; k <= N; k++) { const seed = k * 7919; RACE = { ...MEETINGS.find(m => m.id === meet) }; currentField = null; buildField(seed);
        const r = race(meet, seed, mode === 'lecture' ? counter() : mode, policy); s += r.rank; w += r.rank === 1 }
      out[mode] = `rang ${(s / N).toFixed(2)} · victoires ${w}/${N}` } }
    finally { completeRace = done }
    return out;
  }
  return { race, one, run, pair, tactics, smart, headless, get gl() { return gl } };
})();
