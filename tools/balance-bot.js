// Bot d'équilibrage à lancer dans la console du navigateur (aucune installation) — jeu servi en local.
//   await import('./tools/balance-bot.js')  puis  await bot.run([...])  → résultats dans la console.
// Il ne sauvegarde rien (window.__noSave) et neutralise la fin de course (pas d'or, de trophées ni de coffres).
// Politique de temps forts : { tire:'a'|'b'|fn, breche:..., attaque:... } ; 'b' = ne rien faire.
export const bot = window.bot = (() => {
  // sans WebGL (machine sans carte graphique, navigateur qui a bloqué la 3D) : scène factice, la simulation n'a pas besoin de rendu
  const gl = (() => { try { return !!document.createElement('canvas').getContext('webgl2') } catch (e) { return false } })();
  function headless() {
    if (threeRace || gl) return;
    threeRace = { headless: true, startPhase: 'idle', introStart: 0, horses: [], silks: [], markers: [], horseTextures: [], podiumTextures: [],
      podium: { visible: false }, stalls: { visible: true, userData: { doors: [] } }, renderer: { setPixelRatio() {}, setSize() {}, shadowMap: {} },
      sun: { color: { set() {} }, position: { set() {} } }, hemi: { color: { set() {} }, groundColor: { set() {} } }, scene: { fog: { color: { set() {} } }, add() {} }, camera: {} };
  }
  function race(meet, seed, tactic, policy) {
    headless();
    RACE = { ...MEETINGS.find(m => m.id === meet) }; state.strategy = tactic; career.data.rival.lvl = 0;
    const h = stable.active(); h.fatigue = 10; h.form = 62; h.moral = 72;
    currentField = null; buildField(seed); state.feed = 99999; startRace(); if (threeRace.headless) $('#raceScreen').classList.remove('open');
    openGates(); clearInterval(raceLoop); raceLoop = -1;
    let n = 0; const st = { pass: 0 };
    while (finishOrder.length < 6 && n < 9000) {
      if (coach.open) coach.hide();
      if (!playerFinal && progress[0] > 35 && sprintReach(racePlayer, playerEnergy, racePlayer.cruise) >= remainingM(progress[0])) sprint();
      if (!moments.active) drive(st);
      else { let c = policy[moments.cur.k] || 'b'; if (typeof c === 'function') c = c(moments.cur); if (c !== 'b') moments.choose(c) }
      // haies : élan choisi un peu avant l'obstacle (politique.haie : 'p' | 'n' | 'f' | fonction)
      if (typeof haies !== 'undefined' && policy.haie) { const u = haies.upcoming(); if (u && u.m < RACE.dist * .03 && haies.state.choice === 'n') { const c = typeof policy.haie === 'function' ? policy.haie(u) : policy.haie; if (c !== 'n') haies.choose(c) } }
      // allure en course (2.5) : politique.pace = -1 | 0 | 1 | fonction, appliquée hors sprint final
      if (policy.pace !== undefined && !playerFinal) { const v = typeof policy.pace === 'function' ? policy.pace() : policy.pace; if (v !== playerPace) setPace(v) }
      runRaceV2(); n++;
    }
    const r = { rank: finishOrder.indexOf(0) + 1, aheadBM: finishOrder.indexOf(0) < finishOrder.indexOf(1), log: moments.log.map(e => e.k + e.ch + (e.k === 'breche' && e.ch === 'a' ? (e.ok ? '+' : '-') : '')) };
    leaveRace(); return r;
  }
  // placement d'un bon joueur (moteur 3) : à la corde ou dans un sillage ; derrière un cheval plus lent, au moment du sprint
  // ou dans la dernière ligne droite, il déborde par le côté libre (l'intérieur s'il est ouvert, sinon l'extérieur).
  // Le bot fixe directement le couloir visé (sans entrée enregistrée) : ses courses ne se rejouent pas.
  function drive(st) {
    if (raceFinished[0]) return;
    if (st.pass > 0) { st.pass--; return }
    const a = nearbyHorses(0).find(h => Math.abs(h.l - playerLane) < HORSE_W), slow = a && a.gap < 1.2 && (playerFinal || raceBlocked[0] > 2 || speedOf(a.j) < racePlayer.cruise * .99 || progress[0] > 62);
    const sideFree = d => !progress.some((p, j) => j && !raceFinished[j] && Math.abs(p - progress[0]) < HORSE_LEN * 1.6 && (laneOf(j) - playerLane) * d > 0 && Math.abs(laneOf(j) - playerLane) < HORSE_W + 6);
    if (slow) { const d = playerLane - 12 >= 7 && sideFree(-1) ? -1 : 1; playerTarget = clampRace(playerLane + d * 12, 7, 93); st.pass = 12 }
    // 3.0 : corde lourde annoncée → à 3-4 couloirs de la lice dans les lignes droites, à la corde dans les virages
    else playerTarget = lourde() && courseTurn(Math.min(1, progress[0] / 100)) < .1 && progress[0] < 93 ? 30 : 10;
  }
  const lourde = () => raceEng >= 6 && currentField && currentField.cond && currentField.cond.corde < 0;
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
  // allure d'un joueur qui lit sa jauge : retenir tant que l'endurance (en %) est sous 1,2 × la distance restante (en %), sinon allure normale
  const gestion = () => playerEnergy / Math.max(1, 100 - progress[0]) < 1.2 ? -1 : 0;
  const smart = {
    tire: () => RACE.dist <= 1200 ? 'b' : 'a',
    breche: 'a',
    // suivre une attaque : oui jusqu'au mile, jamais sur 2 400 m, sur 2 000 m seulement si la voie est libre devant
    attaque: () => RACE.dist <= 1600 ? 'a' : RACE.dist >= 2400 ? 'b' : boxedIn() ? 'b' : 'a',
    // haies : prudent quand fatigué ou maladroit, à fond quand frais et adroit
    haie: u => playerEnergy < 32 || u.risk > .125 ? 'p' : u.risk < .105 && playerEnergy > 45 ? 'f' : 'n',
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
  // 3.0 : avec le vent de face dans la ligne droite, mener à découvert coûte : on attend dans les dos même quand personne ne veut mener
  const counter = () => { const n = currentField.rivals.filter(r => r.tac === 'leader').length, C = currentField.cond || {}; return n === 0 ? (C.vent > 0 ? 'stalker' : 'leader') : n >= 2 ? 'finisher' : 'stalker' };
  function tactics(meet, N = 40, policy = {}) {
    window.__noSave = true; const done = completeRace; completeRace = () => {}; const out = {};
    try { for (const mode of ['leader', 'stalker', 'finisher', 'lecture']) { let s = 0, w = 0;
      for (let k = 1; k <= N; k++) { const seed = k * 7919; RACE = { ...MEETINGS.find(m => m.id === meet) }; currentField = null; buildField(seed);
        const r = race(meet, seed, mode === 'lecture' ? counter() : mode, policy); s += r.rank; w += r.rank === 1 }
      out[mode] = `rang ${(s / N).toFixed(2)} · victoires ${w}/${N}` } }
    finally { completeRace = done }
    return out;
  }
  return { race, one, run, pair, tactics, smart, gestion, headless, counter, get gl() { return gl } };
})();
