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
    const mods = ['hooks', 'stable', 'career', 'meta', 'moments', 'pace', 'ambiance', 'photo', 'villageGL', 'villageLife', 'villageVie', 'onboarding', 'replays', 'defi', 'jockeys', 'domaine', 'ventes', 'legendes', 'duel', 'couronne', 'nouveautes', 'HORSE3D', 'raceWorld', 'domaine3d', 'haies', 'decors', 'manette', 'direct', 'fluidite', 'journal', 'mesures', 'aide', 'ecuries'];
    const missing = mods.filter(m => { try { return typeof eval(m) === 'undefined' } catch (e) { return true } });
    pass('Modules chargés', !missing.length, missing.length ? 'manquants : ' + missing.join(', ') : `${mods.length} modules`); await tick();

    // 2. déterminisme : des courses avec actions variées se rejouent à l'identique
    let det = 0; const D = quick ? 4 : 8;
    const completeOrig = completeRace;
    for (let k = 1; k <= D; k++) {
      RACE = { ...MEETINGS[k % 3] }; currentField = null; buildField(k * 104729); stable.active().fatigue = 10; state.feed = 99999; state.strategy = ['leader', 'stalker', 'finisher'][k % 3]; career.data.jockeys && (career.data.jockeys.owned = JOCKEYS.map(j => j.id), career.data.jockeys.sel = JOCKEYS[k % JOCKEYS.length].id);
      bot.headless(); startRace(); if (threeRace.headless) $('#raceScreen').classList.remove('open'); openGates(); clearInterval(raceLoop); raceLoop = -1; let n = 0;
      while (finishOrder.length < 6 && n < 9000) { if (coach.open) coach.hide(); if (moments.active && n % 4 === 0) moments.choose(n % 3 ? 'a' : 'b'); if (n % 41 === 0) steer(n % 82 ? 1 : -1);
        if (!playerFinal && progress[0] > 35 && sprintReach(racePlayer, playerEnergy, racePlayer.cruise) >= remainingM(progress[0])) sprint(); runRaceV2(); n++ }
      raceLoop = null; const r = replays.last(); while (coach.open) coach.hide(); if (replays.verify(r).ok) det++; leaveRace(); while (coach.open) coach.hide(); await tick();
    }
    completeRace = completeOrig; if (career.data.jockeys) career.data.jockeys.sel = 'paul'; // équilibrage mesuré sans bonus de jockey
    pass('Rejeu identique', det === D, `${det}/${D} courses`);
    { const r = JSON.parse(JSON.stringify(replays.last())); r.result.times[0] -= .3; pass('Falsification détectée', replays.verify(r).ok === false, 'temps truqué refusé') }
    await tick();

    // 2 bis. moteur 3 : départ commun, chevaux solides (jamais superposés), dépassements par le côté
    { let bad = 0, steps = 0, blocked = 0, passes = 0, go = 0; const R = quick ? 4 : 8;
      for (let k = 1; k <= R; k++) {
        RACE = { ...MEETINGS[k % 4] }; currentField = null; buildField(k * 7331); stable.active().fatigue = 10; state.feed = 99999; state.strategy = 'stalker';
        bot.headless(); startRace(); if (threeRace.headless) $('#raceScreen').classList.remove('open'); openGates(); clearInterval(raceLoop); raceLoop = -1; let n = 0;
        if (progress.every(p => p === 0) && rivalAI.every(a => a.speed > .2) && autoSpeed > .2) go++;
        let order = progress.map((p, i) => i).sort((a, b) => progress[b] - progress[a]).join();
        while (finishOrder.length < 6 && n < 9000) { if (coach.open) coach.hide(); if (n % 37 === 0) steer(n % 74 ? 1 : -1);
          if (!playerFinal && progress[0] > 35 && sprintReach(racePlayer, playerEnergy, racePlayer.cruise) >= remainingM(progress[0])) sprint(); runRaceV2(); n++;
          const on = [0, 1, 2, 3, 4, 5].filter(i => !raceFinished[i]);
          for (const i of on) for (const j of on) if (i < j && Math.abs(progress[i] - progress[j]) < HORSE_LEN - 1e-9 && Math.abs(laneOf(i) - laneOf(j)) < HORSE_W - 1e-9) bad++;
          steps++; blocked += raceBlocked.filter(b => b > 0).length;
          const o = progress.map((p, i) => i).sort((a, b) => progress[b] - progress[a]).join(); if (o !== order) { passes++; order = o } }
        raceLoop = null; leaveRace(); while (coach.open) coach.hide(); await tick() }
      pass('Moteur 3 : départ commun, aucun chevauchement', go === R && bad === 0 && blocked > 0 && passes > R * 3, `${go}/${R} départs communs · ${bad} chevauchement${bad > 1 ? 's' : ''} sur ${steps} pas · ${blocked} pas bloqués derrière un cheval · ${passes} changements d’ordre`) }
    // pas de pause : sans bouton PARTEZ ni pause, la course avance à l'horloge (un onglet en arrière-plan rattrape son retard)
    { const noBtn = !document.querySelector('#goBtn') && !document.querySelector('.race-pause'); RACE = { ...MEETINGS[1] }; currentField = null; buildField(4242); stable.active().fatigue = 10; state.feed = 99999;
      bot.headless(); startRace(); if (threeRace.headless) $('#raceScreen').classList.remove('open'); openGates(); raceClock.t0 -= 3000; raceClock.pump(); const t = raceTime; clearInterval(raceLoop); raceLoop = null; leaveRace(); while (coach.open) coach.hide();
      pass('Pas de pause : la course suit l’horloge', noBtn && t >= 29 && t <= 32, `bouton PARTEZ / pause absents ${noBtn ? 'oui' : 'NON'} · 3 s rattrapées en ${t} pas`); await tick() }

    // 3. équilibrage : lire le plateau paie, taux de victoire dans la cible
    stable.setActive('h1');
    // 30 courses au moins, même en mode rapide : sur 16, une seule place d'écart fait basculer la comparaison
    const NT = Math.max(N, 30), T = bot.tactics('m2', NT, bot.smart), rk = s => +s.match(/rang ([\d.]+)/)[1], wins = s => +s.match(/victoires (\d+)/)[1];
    pass('Lecture du plateau ≥ meilleure tactique fixe', rk(T.lecture) <= Math.min(rk(T.leader), rk(T.stalker), rk(T.finisher)) + .05, `lecture ${rk(T.lecture)} · fixes ${rk(T.leader)} / ${rk(T.stalker)} / ${rk(T.finisher)}`);
    const wr = wins(T.lecture) / NT; pass('Taux de victoire 35–75 % (1 600 m, cheval idéal)', wr >= .35 && wr <= .75, `${Math.round(wr * 100)} %`); await tick();

    // 4. course sans interruption : aucun temps fort, aucun conseil, aucune annonce pendant la course
    { let opened = 0, tips = 0, live = true; hooks.on('moment:open', () => { if (live) opened++ }); hooks.on('tip', () => { if (live) tips++ });
      for (let k = 1; k <= 3; k++) { RACE = { ...MEETINGS[k] }; currentField = null; buildField(k * 3301); stable.active().fatigue = 10; state.feed = 99999;
        bot.headless(); startRace(); openGates(); clearInterval(raceLoop); raceLoop = -1; let n = 0; coach.tip('test-course', 'test', '.steer');
        while (finishOrder.length < 6 && n < 9000) { if (!playerFinal && progress[0] > 35 && sprintReach(racePlayer, playerEnergy, racePlayer.cruise) >= remainingM(progress[0])) sprint(); runRaceV2(); n++ }
        raceLoop = null; leaveRace(); await tick() }
      live = false;
      pass('Course sans interruption', opened === 0 && tips === 0 && !moments.log.length, `${opened} temps fort · ${tips} conseil affiché pendant 3 courses`); await tick() }

    // 5. premières minutes : déblocages
    career.data.stats.races = 0; onboarding.apply(); const locked0 = UNLOCKS.every(U => document.body.classList.contains('lk-' + U.k));
    career.data.stats.races = 7; onboarding.apply(); const open7 = UNLOCKS.every(U => !document.body.classList.contains('lk-' + U.k));
    pass('Déblocages progressifs', locked0 && open7, `0 course : tout verrouillé ${locked0 ? 'oui' : 'NON'} · 7 courses : tout ouvert ${open7 ? 'oui' : 'NON'}`);

    // 6. Défi du jour : même plateau pour tous, quel que soit le cheval ou la progression du joueur
    { const sig = () => JSON.stringify(defi.field().rivals.map(r => [r.stats, r.tac, r.pref, r.talent])); const a = sig(); stable.setActive('h2'); career.data.stats.races = 2; const b = sig(); stable.setActive(savedActive);
      pass('Défi du jour identique pour tous', a === b, `graine ${defi.meeting().seed} · ${defi.meeting().dist} m`) }

    // 7. domaine : chaque niveau a un effet réel (entraînement, allocations, places, récupération)
    { const keep = { ...domainLv }, h = stable.active(), g = () => stable.preview(h, SESSIONS[0], 'normal').gain.vit[1], m = MEETINGS[1];
      const lv = n => { Object.keys(domainLv).forEach(k => delete domainLv[k]); ['haras', 'hippodrome', 'ecurie', 'carriere', 'paddocks', 'clinique', 'moulin'].forEach(k => domainLv[k] = n) };
      lv(1); const a = [g(), purseOf(m), stableMax(), dfx('paddocks'), stable.careCost(CARE[1]).gold]; lv(4); const b = [g(), purseOf(m), stableMax(), dfx('paddocks'), stable.careCost(CARE[1]).gold];
      Object.keys(domainLv).forEach(k => delete domainLv[k]); Object.assign(domainLv, keep);
      pass('Domaine : effets réels des niveaux', b[0] > a[0] * 1.14 && b[1] > a[1] && b[2] === a[2] + 3 && b[3] > a[3] && b[4] < a[4], `niveau 1 → 4 : gains ×${(b[0] / a[0]).toFixed(2)} · allocation ${fmt(a[1])} → ${fmt(b[1])} · places ${a[2]} → ${b[2]} · soins ${fmt(a[4])} → ${fmt(b[4])} or`) }

    // 8. duels entre amis : lien → décodage → vérification ; temps truqué et couleurs piégées refusés
    { const r = replays.last(), code = await duel.encode(duel.pack(r)), back = await duel.decode(code), v = replays.verify(JSON.parse(JSON.stringify(back)), { track: true });
      const bad = JSON.parse(JSON.stringify(back)); bad.result.times[0] -= .4; const ko = replays.verify(bad).ok === false;
      const inj = JSON.parse(JSON.stringify(back)); inj.field.rivals[0].livery.main = '"><img src=x onerror=alert(1)>';
      pass('Duel : lien vérifié, fantôme tracé, triche refusée', duel.valid(back) && v.ok && v.track.p.length > 100 && ko && !duel.valid(inj), `lien ${code.length} caractères · trajectoire ${v.track.p.length} pas · temps truqué refusé ${ko ? 'oui' : 'NON'} · couleurs piégées refusées ${!duel.valid(inj) ? 'oui' : 'NON'}`) }

    // 8 bis. courses de haies : un choix d'élan avant chaque haie (entrées 'jump' enregistrées), rejeu identique
    { let ok = 0, jumps = 0, faults = 0; const H = quick ? 2 : 4;
      for (let k = 1; k <= H; k++) {
        RACE = { ...MEETINGS.find(m => m.id === 'h1') }; currentField = null; buildField(k * 6007); stable.active().fatigue = 10; state.feed = 99999;
        bot.headless(); startRace(); if (threeRace.headless) $('#raceScreen').classList.remove('open'); openGates(); clearInterval(raceLoop); raceLoop = -1; let n = 0;
        while (finishOrder.length < 6 && n < 9000) { if (coach.open) coach.hide(); if (moments.active && n % 4 === 0) moments.choose('a'); if (n % 53 === 0) steer(n % 106 ? 1 : -1);
          const u = haies.upcoming(); if (u && u.m < RACE.dist * .03 && haies.state.choice === 'n' && u.k % 3 !== 2) haies.choose(u.k % 3 ? 'f' : 'p');
          if (!playerFinal && progress[0] > 35 && sprintReach(racePlayer, playerEnergy, racePlayer.cruise) >= remainingM(progress[0])) sprint(); runRaceV2(); n++ }
        raceLoop = null; const log = haies.state ? haies.state.log : []; jumps += log.length; faults += log.filter(x => x.fault).length;
        const r = replays.last(); while (coach.open) coach.hide(); if (r && r.race.haies && r.inputs.some(x => x[1] === 'jump') && replays.verify(r).ok) ok++; leaveRace(); while (coach.open) coach.hide(); await tick() }
      pass('Haies : sauts décidés et rejeu identique', ok === H && jumps === H * 6, `${ok}/${H} rejeux identiques · ${jumps} sauts · ${faults} faute${faults > 1 ? 's' : ''}`) }

    // 9. La Couronne : un chapitre réussi débloque sa récompense (plateau affaibli pour garantir l'objectif)
    { const keepRace = RACE; couronne.select('c1'); RACE.diff = -40; currentField = null; buildField(1234); stable.active().fatigue = 10; state.feed = 99999;
      bot.headless(); startRace(); if (threeRace.headless) $('#raceScreen').classList.remove('open'); openGates(); clearInterval(raceLoop); raceLoop = -1; let n = 0;
      while (finishOrder.length < 6 && n < 9000) { if (coach.open) coach.hide(); if (!playerFinal && progress[0] > 35 && sprintReach(racePlayer, playerEnergy, racePlayer.cruise) >= remainingM(progress[0])) sprint(); runRaceV2(); n++ }
      raceLoop = null; const ok = career.data.couronne.done.includes('c1') && career.data.unlocks.includes('echarpe'); leaveRace(); while (coach.open) coach.hide(); RACE = keepRace; $('#panel').classList.remove('open');
      pass('Couronne : chapitre réussi et récompensé', ok, `rang ${finishOrder.indexOf(0) + 1} · Black Majesty ${finishOrder.indexOf(1) + 1}e · motif Écharpe ${ok ? 'débloqué' : 'NON débloqué'}`) }

    // 10. ventes : le catalogue du jour ne dépend que de la ligue (même vente pour tous les joueurs d'une ligue)
    { const sig = () => JSON.stringify(ventes.lots().map(l => [l.type, l.stats, l.pot, l.value, l.talent])); const a = sig(); const h = stable.active(), k = { ...h.stats }; h.stats.vit += 9; stable.setActive('h2'); const b = sig(); Object.assign(h.stats, k); stable.setActive(savedActive);
      pass('Ventes : même catalogue pour une ligue', a === b, `${ventes.lots().length} lots · ${ventes.lots().map(l => l.type).join(', ')}`) }

    // 11. chargement : aucun module en échec
    // 3D : cheval articulé (maillage du Worker, 18 os) ; domaine 3D sélectionnable, repli sur la peinture sans perdre les étiquettes
    { const g = await HORSE3D.ready(2), h = HORSE3D.build(champion.get(), { lod: 2 }), u = h.userData, ok = !u.pending && g.H.attributes.position.count > 2000 && u.B.length === 18 && !!u.jm;
      HORSE3D.pose(h, .3, 1, 1); HORSE3D.dispose(h); pass('Cheval 3D articulé', ok, `${g.H.attributes.position.count} sommets · ${u.B ? u.B.length : 0} os · jockey ${u.jm ? 'oui' : 'non'}`) }
    if (typeof domaine3d !== 'undefined' && domaine3d.supported()) {
      const was = domaine3d.on; domaine3d.set(true); village.select('haras'); const inUI = !!document.querySelector('#d3ui .bld-tag'), sel = village.selected === 'haras'; village.deselect();
      domaine3d.set(false); const back = !document.querySelector('#d3ui') && document.querySelectorAll('#map .bld-tag').length === VILLAGE.order.length; domaine3d.set(was);
      pass('Domaine 3D : sélection, retour à la peinture', inUI && sel && back, `étiquettes en 3D ${inUI ? 'oui' : 'non'} · sélection ${sel ? 'oui' : 'non'} · rendues à la peinture ${back ? 'oui' : 'non'}`)
    }
    pass('Tous les modules se sont chargés', !(window.__modulesKo || []).length, (window.__modulesKo || []).join(', ') || 'aucun échec');

    // journal (2.5) : une erreur rattrapée par hooks est notée avec l'écran et le fil ; un gain est rangé par source ; le rapport part avec
    { const before = journal.erreurs.length, fx = JSON.stringify(journal.mesures.flux.or || {}); hooks.on('test:journal', () => { throw new Error('erreur de test du journal') }); hooks.emit('test:journal');
      const e = journal.erreurs.find(x => /erreur de test du journal/.test(x.msg)), g0 = state.gold; hooks.emit('domaine:recolte', 'test', 0); state.gold += 7; sync(); await new Promise(r => setTimeout(r, 20));
      const src = (journal.mesures.flux.or || { gain: {} }).gain['récoltes'] || 0, rep = mesures.rapport('test'); state.gold = g0; sync(); await new Promise(r => setTimeout(r, 20));
      journal.retirer(/erreur de test du journal/); if (journal.mesures.flux.or) journal.mesures.flux.or = JSON.parse(fx);
      const ok = !!e && e.type === 'rattrapée' && !!e.ecran && Array.isArray(e.fil) && src >= 7 && rep.includes('erreur de test du journal') && rep.includes('"version"') && journal.erreurs.length === before;
      pass('Journal : erreur notée, gain rangé, rapport', ok, `erreur ${e ? e.type + ' · écran ' + e.ecran : 'NON notée'} · récolte +${src} · rapport ${rep.length} car.`) }

    // écuries rivales (2.5) : un cheval par écurie, noms valides pour les duels, couleur du joueur écartée, plateau reproductible
    { let bad = 0; const J = { main: stable.silks.main, noms: stable.data.horses.map(h => h.name) }, noms = new Set();
      for (let sd = 1; sd <= 300; sd++) { const T = ecuries.tirage(sd, 5, J); if (new Set(T.map(t => t.ecurie)).size !== 5) bad++;
        T.forEach(t => { noms.add(t.name); if (t.name.length > 24 || J.noms.includes(t.name) || Math.hypot(...[1, 3, 5].map(k => parseInt(t.livery.main.slice(k, k + 2), 16) - parseInt(J.main.slice(k, k + 2), 16))) < 70) bad++ }) }
      const a = JSON.stringify(ecuries.tirage(99, 5, J)), b = JSON.stringify(ecuries.tirage(99, 5, J));
      pass('Écuries rivales : plateaux variés et valides', !bad && a === b && noms.size >= 50, `${noms.size} chevaux croisés sur 300 plateaux · ${bad} anomalie${bad > 1 ? 's' : ''}`) }

    // 12. aucun contenu factice visible
    const txt = document.body.innerText, bad = ['bientôt', 'Lorem', 'TODO', 'undefined', 'NaN'].filter(w => txt.includes(w));
    pass('Aucun texte factice ou cassé', !bad.length, bad.length ? 'trouvé : ' + bad.join(', ') : 'rien trouvé');
  } finally {
    Object.assign(career.data, JSON.parse(saved)); state.strategy = savedStrat; stable.setActive(savedActive); onboarding.apply(); while (coach.open) coach.hide();
  }
  console.table(out); const ok = out.every(t => t.ok === '✓'); console.log(ok ? '✅ Tous les tests passent' : '❌ Des tests échouent'); return { ok, results: out };
}
