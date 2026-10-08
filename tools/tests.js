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
    const mods = ['hooks', 'stable', 'career', 'meta', 'moments', 'pace', 'ambiance', 'photo', 'onboarding', 'replays', 'defi', 'jockeys', 'domaine', 'ventes', 'legendes', 'duel', 'couronne', 'nouveautes', 'HORSE3D', 'raceWorld', 'domaine3d', 'haies', 'decors', 'manette', 'direct', 'fluidite', 'journal', 'mesures', 'aide', 'ecuries'];
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
    // allure en course (2.5) : entrée enregistrée et rejouée à l'identique ; elle change vraiment la course ; ignorée pendant le sprint
    { const one = plan => { RACE = { ...MEETINGS[1] }; currentField = null; buildField(424242); stable.active().fatigue = 10; state.feed = 99999; state.strategy = 'stalker';
        bot.headless(); startRace(); if (threeRace.headless) $('#raceScreen').classList.remove('open'); openGates(); clearInterval(raceLoop); raceLoop = -1; let n = 0;
        while (finishOrder.length < 6 && n < 9000) { if (coach.open) coach.hide(); const v = plan(progress[0]); if (v !== playerPace) setPace(v);
          if (!playerFinal && progress[0] > 35 && sprintReach(racePlayer, playerEnergy, racePlayer.cruise) >= remainingM(progress[0])) sprint(); runRaceV2(); n++ }
        raceLoop = null; const r = replays.last(), t = raceFinishTimes[0]; while (coach.open) coach.hide(); const ok = replays.verify(r).ok; leaveRace(); while (coach.open) coach.hide(); return { r, t, ok } };
      const a = one(() => 0), b = one(p => p < 25 ? 1 : p < 50 ? -1 : 0), paces = b.r.inputs.filter(x => x[1] === 'pace').map(x => x[2]);
      const ok = a.ok && b.ok && !a.r.inputs.some(x => x[1] === 'pace') && paces[0] === 1 && paces[1] === -1 && Math.abs(a.t - b.t) > .01;
      pass('Allure en course : enregistrée, rejouée, efficace', ok, `rejeux ${a.ok && b.ok ? 'identiques' : 'DIFFÉRENTS'} · entrées ${paces.join(' → ') || 'aucune'} · temps ${a.t.toFixed(2)} s → ${b.t.toFixed(2)} s`); await tick() }
    // allure : aucune allure fixe ne paie, retenir en lisant sa jauge d'endurance oui (2 000 m, mêmes graines, joueur confirmé)
    { const keepRaces = career.data.stats.races; career.data.stats.races = 10; const done = completeRace; completeRace = () => {}; const R = {}, NA = quick ? 40 : 80;
      try { for (const [k, pace] of [['normal', 0], ['retenir', -1], ['presser', 1], ['jauge', bot.gestion]]) { let s = 0;
        for (let n = 1; n <= NA; n++) { const seed = n * 7919 + 13; RACE = { ...MEETINGS.find(m => m.id === 'm3') }; currentField = null; buildField(seed); s += bot.race('m3', seed, 'stalker', { ...bot.smart, pace }).rank }
        R[k] = s / NA; await tick() } } finally { completeRace = done; career.data.stats.races = keepRaces }
      pass('Allure : lire sa jauge bat toute allure fixe', R.jauge < R.normal && R.jauge < R.retenir && R.jauge < R.presser, Object.entries(R).map(([k, v]) => `${k} ${v.toFixed(2)}`).join(' · ') + ' (rang moyen)') }
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
    // domaine tout en 3D (2.5) : affiché dès le démarrage, étiquettes projetées, sélection au toucher ; plus aucun calque 2D
    { let t0 = performance.now(); while (!domaine3d.on && performance.now() - t0 < 60000) await new Promise(r => setTimeout(r, 200));
      village.select('haras'); const tag = document.querySelector('#d3ui .bld-tag[data-id="haras"]'), inUI = !!tag && tag.classList.contains('show'), sel = village.selected === 'haras'; village.deselect();
      const flat = ['#map', '.map-base', '#ambient', '#villageGL', '#villageGlow'].filter(q => document.querySelector(q)), msg = document.body.innerText.includes('maintenant en 3D');
      pass('Domaine 3D : affiché, sélection, aucun calque 2D', domaine3d.on && inUI && sel && !flat.length && !msg, `3D ${domaine3d.on ? 'affichée' : 'ABSENTE'} · étiquette ${inUI ? 'oui' : 'non'} · sélection ${sel ? 'oui' : 'non'} · calques 2D ${flat.join(', ') || 'aucun'}`) }
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

    // mémoire graphique (2.6) : trois courses d'affilée ne doivent pas accumuler de textures (squelettes des chevaux 3D, portraits du podium).
    // 2.8 : three.js n'envoie une texture au GPU que la première fois qu'elle est vue ; le compte dépendait donc de ce que la caméra
    // d'introduction avait déjà montré (un drapeau lointain vu à la 2e course comptait comme une fuite). On attend que les chevaux
    // soient assemblés, puis toutes les textures de la scène sont envoyées avant de compter : seules les vraies fuites font grimper le compte.
    if (threeRace && !threeRace.headless) { const frames = n => new Promise(r => { const f = () => --n > 0 ? requestAnimationFrame(f) : r(); requestAnimationFrame(f) }), T = [], R3 = threeRace.renderer;
      const upload = () => threeRace.scene.traverse(o => { const ms = o.material ? (Array.isArray(o.material) ? o.material : [o.material]) : []; for (const m of ms) for (const key in m) { const v = m[key]; if (v && v.isTexture && v.image) try { R3.initTexture(v) } catch (e) { } }
        if (o.isSkinnedMesh && o.skeleton) { if (!o.skeleton.boneTexture) o.skeleton.computeBoneTexture(); try { R3.initTexture(o.skeleton.boneTexture) } catch (e) { } } });
      const ready = async () => { for (let i = 0; i < 300 && (raceFX._fx?.h3d || []).some(m => m.userData.pending); i++) await frames(2) };
      for (let k = 0; k < 3; k++) { RACE = { ...MEETINGS[k % 2] }; currentField = null; buildField(300 + k); stable.active().fatigue = 10; state.feed = 99999; startRace(); await frames(6); await ready(); upload(); while (coach.open) coach.hide(); leaveRace(); while (coach.open) coach.hide(); await frames(3); upload(); T.push(R3.info.memory.textures) }
      pass('Mémoire graphique stable entre les courses', T[2] - T[0] <= 2, `textures après chaque course : ${T.join(' → ')}`) }

    // hippodromes (2.7) : l'Hippodrome Royal n'a pas bougé (moteur 4), chaque hippodrome se rejoue à l'identique, le tracé compte,
    // commandes à l'écran sur un tracé à main droite, un lien de duel garde son hippodrome, changer d'hippodrome ne laisse rien en mémoire graphique
    { const keep = RACE, bell = (a, b, x) => x <= a || x >= b ? 0 : Math.sin((x - a) / (b - a) * Math.PI); let diff = 0;
      for (let p = 0; p <= 1.0001; p += .0005) { const old = bell(.015, .265, p) + bell(.515, .765, p); RACE = { ...MEETINGS[1] }; delete RACE.hippo; diff += Math.abs(courseTurn(p) - old); RACE = { ...MEETINGS[1], hippo: 'royal' }; diff += Math.abs(courseTurn(p) - old) }
      setTrack('royal'); const ref = (t, lane) => { const S = 520, R = 165, L = S * 2 + Math.PI * 2 * R, d = (((t % 1) + 1) % 1) * L; if (d < S) return [-S / 2 + d, R + lane]; if (d < S + Math.PI * R) { const a = Math.PI / 2 - (d - S) / R; return [S / 2 + (R + lane) * Math.cos(a), (R + lane) * Math.sin(a)] } if (d < S * 2 + Math.PI * R) return [S / 2 - (d - S - Math.PI * R), -R - lane]; const a = -Math.PI / 2 - (d - S * 2 - Math.PI * R) / R; return [-S / 2 + (R + lane) * Math.cos(a), (R + lane) * Math.sin(a)] };
      for (let t = 0; t < 1; t += .013) for (const lane of [-7, 0, 9]) { const q = trackPose(t, lane).p, r = ref(t, lane); diff += Math.abs(q.x - r[0]) + Math.abs(q.z - r[1]) }
      RACE = keep; pass('Hippodromes : Hippodrome Royal inchangé', diff < 1e-6 && RACE_ORIGIN === .235 && ENGINE_OK.includes(4), `écart ${diff.toExponential(1)} (virages et tracé) · rejeux du moteur 4 acceptés`) }
    { const I = id => { RACE = { ...MEETINGS[1], hippo: id }; let s = 0; for (let p = 0; p <= 1; p += .001) s += courseTurn(p) * .001; return s }, v = Object.fromEntries(Object.keys(HIPPOS).map(id => [id, I(id)])); RACE = { ...MEETINGS[1] };
      pass('Hippodromes : le tracé compte en course', v.foret > v.capitale && v.capitale > v.cimes && v.cimes > v.royal && v.royal > v.cote, Object.entries(v).map(([k, x]) => `${k} ${x.toFixed(3)}`).join(' · ') + ' (coût des virages pour qui court au large)') }
    { let ok = 0, hp = 0; const ids = Object.keys(HIPPOS), done = completeRace;
      for (const id of ids) { RACE = { ...MEETINGS[1], hippo: id }; currentField = null; buildField(9001 + id.length); stable.active().fatigue = 10; state.feed = 99999; state.strategy = 'stalker';
        bot.headless(); startRace(); if (threeRace.headless) $('#raceScreen').classList.remove('open'); openGates(); clearInterval(raceLoop); raceLoop = -1; let n = 0;
        while (finishOrder.length < 6 && n < 9000) { if (coach.open) coach.hide(); if (n % 29 === 0) steerScreen(n % 58 ? 1 : -1); if (!playerFinal && progress[0] > 35 && sprintReach(racePlayer, playerEnergy, racePlayer.cruise) >= remainingM(progress[0])) sprint(); runRaceV2(); n++ }
        raceLoop = null; const r = replays.last(); hp += r.race.hippo === id; while (coach.open) coach.hide(); if (replays.verify(r).ok) ok++; leaveRace(); while (coach.open) coach.hide(); await tick() }
      completeRace = done; pass('Hippodromes : rejeu identique sur chacun', ok === ids.length && hp === ids.length, `${ok}/${ids.length} rejeux identiques · hippodrome enregistré ${hp}/${ids.length}`) }
    { const keep = { ...TRACK }; setTrack('foret'); playerTarget = 50; playerLane = 50; steerScreen(-1); const a = playerTarget; steerScreen(1); steerScreen(1); const b = playerTarget; setTrack('royal'); playerTarget = 50; steerScreen(-1); const c = playerTarget; TRACK = keep; setTrack(keep.id);
      pass('Hippodromes : à main droite, ◀ va vers l’extérieur', a > 50 && b < a && c < 50, `main droite : ◀ ${a}, puis ▶▶ ${b} · main gauche : ◀ ${c}`) }
    { const r = { e: 5, race: { id: 'lien', dist: 1600, terrain: 'bon', hippo: 'cimes' } }, o = { e: 4, race: { id: 'm3', dist: 2000, terrain: 'souple' } };
      const a = duel.safeRace(r.race, 5).hippo, b = duel.safeRace(o.race, 4).hippo, c = duel.safeRace({ id: 'm3', dist: 2000, terrain: 'souple', hippo: 'cote' }, 5).hippo;
      pass('Hippodromes : un duel garde son hippodrome', a === 'cimes' && b === undefined && c === 'foret', `lien → ${a} · ancien lien (moteur 4) → ${b || 'Hippodrome Royal'} · course du programme → ${c} (celui du programme, pas celui du lien)`) }
    // 3.0 (moteur 6) : conditions du jour, observations, incidents et plans des adversaires — tirés de la graine, enregistrés avec le plateau,
    // rejoués à l'identique ; une course du moteur 5 (duel d'un ami resté en 2.9) garde ses règles ; la corde et le vent changent vraiment la course
    { const run6 = (seed, setup, opt = {}) => { RACE = { ...MEETINGS[1], ...(opt.race || {}) }; currentField = null; buildField(seed); setup && setup(currentField); Object.assign(stable.active(), { fatigue: 10, form: 62, moral: 72 }); state.feed = 99999; state.strategy = opt.tac || 'stalker';
        bot.headless(); startRace(); if (threeRace.headless) $('#raceScreen').classList.remove('open'); openGates(); clearInterval(raceLoop); raceLoop = -1; let n = 0;
        while (finishOrder.length < 6 && n < 9000) { if (coach.open) coach.hide(); if (opt.steer && n % 53 === 0) steer(n % 106 ? 1 : -1); if (opt.rail) playerTarget = 10;
          if (!playerFinal && progress[0] > 35 && sprintReach(racePlayer, playerEnergy, racePlayer.cruise) >= remainingM(progress[0])) sprint(); runRaceV2(); n++ }
        raceLoop = null; const r = replays.last(), S = strat.state, inc = { on: S.on, slowMe: S.me.slow, moves: rivalAI.filter(a => a.mv && a.mv.on !== undefined).length, fights: rivalAI.filter(a => a.fought).length }, t = raceFinishTimes[0];
        while (coach.open) coach.hide(); const v = replays.verify(r); leaveRace(); while (coach.open) coach.hide(); return { r, ok: v.ok, inc, t } };
      const forced = F => { F.cond = { corde: -1, vent: 1, obs: F.rivals.map((x, k) => ({ q: ['tire', 'forme+', 'forme-', null, null][k], slow: k === 3 })) } };
      let ok = 0, moves = 0, seen = 0; for (let k = 1; k <= 3; k++) { const o = run6(k * 50021, forced, { steer: true, tac: ['leader', 'stalker', 'finisher'][k - 1] }); ok += o.ok === true && o.r.e === ENGINE && o.inc.on; moves += o.inc.moves; seen += o.r.field.cond.obs[0].q === 'tire'; await tick() }
      pass('Moteur 6 : conditions, incidents et plans rejoués à l’identique', ok === 3 && seen === 3, `${ok}/3 rejeux identiques · conditions enregistrées ${seen}/3 · ${moves} accélérations d’adversaires`);
      const o5 = run6(77777, forced, { steer: true, race: { eng: 5 } });
      pass('Moteur 6 : une course du moteur 5 garde ses règles', o5.ok === true && o5.r.e === 5 && !o5.inc.on, `enregistrée au moteur ${o5.r.e} · rejeu ${o5.ok ? 'identique' : 'DIFFÉRENT'} · aléas ${o5.inc.on ? 'ACTIFS' : 'inactifs'}`);
      // corde rapide / lourde, même graine, cheval à la corde ; vent de face : courir à découvert en tête coûte
      const T = (corde, vent, tac) => run6(31337, F => { F.cond = { corde, vent, obs: F.rivals.map(() => ({ q: null, slow: false })) } }, { rail: true, tac }).t;
      const rap = T(1, 0, 'stalker'), lou = T(-1, 0, 'stalker'); await tick();
      // vent dans la ligne droite : la règle elle-même (un cheval de tête abrité dans un sillage profite au contraire du vent de face)
      const S = strat.state, keep = { F: currentField, on: S.on, eng: raceEng, lane: playerLane }, W = v => { currentField = { seed: 1, rivals: [], cond: { corde: 0, vent: v, obs: [] } }; raceEng = 6; S.on = true; playerLane = 50;
        const a = strat.step(0, { own: 85, shelter: false, attacking: false, energy: 50 }), b = strat.step(0, { own: 85, shelter: true, attacking: false, energy: 50 }); return [a.c, b.dr] };
      let face, dos; try { face = W(1); dos = W(-1) } finally { currentField = keep.F; S.on = keep.on; raceEng = keep.eng; playerLane = keep.lane }
      pass('Moteur 6 : la corde et le vent changent la course', lou - rap > .3 && face[0] < 1 && dos[0] > 1 && face[1] > 1 && dos[1] < 1, `à la corde : rapide ${sec(rap, 2)} · lourde ${sec(lou, 2)} · à découvert dans la ligne droite : vent de face ×${face[0].toFixed(3)}, dans le dos ×${dos[0].toFixed(3)} · sillage ×${face[1]} / ×${dos[1]}`) }

    if (threeRace && !threeRace.headless) { const frames = n => new Promise(r => { const f = () => --n > 0 ? requestAnimationFrame(f) : r(); requestAnimationFrame(f) }), M = [];
      for (const id of ['royal', 'cote', 'royal', 'cote', 'royal']) { RACE = { ...MEETINGS[1], hippo: id }; raceVenue(threeRace); threeRace.renderer.render(threeRace.scene, threeRace.camera); await frames(2); M.push(threeRace.renderer.info.memory.geometries + '/' + threeRace.renderer.info.memory.textures) }
      RACE = { ...MEETINGS[1] }; raceVenue(threeRace); const g = M.map(x => x.split('/').map(Number));
      pass('Hippodromes : changer d’hippodrome ne laisse rien en mémoire', Math.abs(g[4][0] - g[2][0]) <= 2 && Math.abs(g[4][1] - g[2][1]) <= 2 && Math.abs(g[3][0] - g[1][0]) <= 2, `géométries / textures : ${M.join(' → ')}`) }

    // RECOURIR (2.8) : la vérification de la course précédente ne doit rien laisser dans la nouvelle (caméra d'arrivée = écran uni, HUD figé)
    if (threeRace && !threeRace.headless) { RACE = { ...MEETINGS[1] }; currentField = null; buildField(4242); stable.active().fatigue = 10; state.feed = 99999; state.strategy = 'stalker';
      startRace(); openGates(); clearInterval(raceLoop); raceLoop = -1; let n = 0; while (finishOrder.length < 6 && n++ < 9000) { if (!playerFinal && progress[0] > 40) sprint(); runRaceV2() } raceLoop = null; while (coach.open) coach.hide();
      $('#raceAgain').onclick(); await new Promise(r => setTimeout(r, 900)); while (coach.open) coach.hide();
      const st = { camera: threeRace.finishView ? 'arrivée' : 'course', pas: raceTime, distance: $('#meters').textContent, phase: threeRace.startPhase };
      leaveRace(); while (coach.open) coach.hide(); await new Promise(r => setTimeout(r, 600));
      pass('Recourir : la nouvelle course part proprement', st.camera === 'course' && st.pas === 0 && st.distance === fmt(RACE.dist) && st.phase === 'cinematic', `caméra ${st.camera} · ${st.pas} pas · ${st.distance} m affichés · ${st.phase}`) }

    // 2.8 : jockey en selle (jambes sur leur propre os, assis à l'arrêt, accroupi au galop), coffres au décompte à la seconde,
    // une seule icône par ressource partout, podium au nom de la course
    { const g = await HORSE3D.ready(2), h = HORSE3D.build(champion.get(), { lod: 2 }), u = h.userData, V = new THREE.Vector3(), y = run => { HORSE3D.pose(h, .3, run, 0); h.updateMatrixWorld(true); return u.JB[0].getWorldPosition(V).y };
      const assis = y(0), galop = y(1), pied = (u.JB[7] && u.JB[7].getWorldPosition(new THREE.Vector3())) || V; HORSE3D.dispose(h);
      pass('Jockey en selle : assis à l’arrêt, accroupi au galop', !!g && u.JB.length === 8 && assis < galop - .03, `${u.JB.length} os · bassin ${assis.toFixed(2)} m à l’arrêt, ${galop.toFixed(2)} m au galop`) }
    { const a = chestLeft(47 * 6e4 + 12e3), b = chestLeft(2 * 36e5 + 5 * 6e4), c = chestSVG('royal');
      pass('Coffres : décompte à la seconde, coffre dessiné', a === '47:12' && b === '2 h 05' && c.includes('ch-lid') && !c.includes('id='), `${a} · ${b} · ${c.length} caractères`) }
    { const d = document.createElement('div'); d.textContent = 'Gain : 🪙 500 · 🌾 20 · 💎 3'; document.body.appendChild(d); await new Promise(r => setTimeout(r, 30));
      const n = d.querySelectorAll('svg.ri use').length, reste = /🪙|🌾|💎/.test(d.textContent); d.remove();
      pass('Icônes : une seule icône par ressource, partout', n === 3 && !reste, `${n} icônes dessinées · émoji restant : ${reste ? 'OUI' : 'non'}`) }
    if (threeRace && !threeRace.headless) { podiumTitle(threeRace.podium, MEETINGS[1]); const U = threeRace.podium.userData;
      pass('Podium : trois marches, bandeau au nom de la course', PODIUM_SLOTS.length === 3 && !!U.banner.map && U.conf.N > 100 && !!podiumGarland(), `bandeau ${U.bannerKey} · ${U.conf.N} confettis`) }

    // 2.9 : au village, aucun cheval (piste, carrière, prés) ne passe à travers un bâtiment, une tribune, un obstacle ou une lice
    if (domaine3d.on && domaine3d.croise) { let c = null; const t0 = performance.now(); while (!(c = domaine3d.croise()) && performance.now() - t0 < 60000) await new Promise(r => setTimeout(r, 300)); c = c || []; const par = {}; for (const q of c) par[q.what + ' → ' + q.id] = (par[q.what + ' → ' + q.id] || 0) + 1;
      pass('Village : aucun cheval à travers un bâtiment ou une lice', !c.length, c.length ? Object.entries(par).map(([k, n]) => `${k} (${n})`).join(', ') : `piste, carrière et prés dégagés (${c.points} points, ${c.arbres} arbres)`) }

    // 12. aucun contenu factice visible
    const txt = document.body.innerText, bad = ['bientôt', 'Lorem', 'TODO', 'undefined', 'NaN'].filter(w => txt.includes(w));
    pass('Aucun texte factice ou cassé', !bad.length, bad.length ? 'trouvé : ' + bad.join(', ') : 'rien trouvé');
  } finally {
    Object.assign(career.data, JSON.parse(saved)); state.strategy = savedStrat; stable.setActive(savedActive); onboarding.apply(); while (coach.open) coach.hide();
  }
  console.table(out); const ok = out.every(t => t.ok === '✓'); console.log(ok ? '✅ Tous les tests passent' : '❌ Des tests échouent'); return { ok, results: out };
}
