/* ===== Courses de haies =====
   Des haies sur la piste (RACE.haies = nombre d'obstacles). Avant chaque haie, le joueur choisit l'élan : PRUDENT (perd un peu de
   terrain, presque aucun risque), normal (sans rien toucher) ou À FOND (gagne du terrain, coûte de l'énergie, risque de faute
   doublé). Le risque de faute dépend de l'Intelligence et du Tempérament (P.jumpRisk, calculé par stable.racePerf) et grimpe quand
   le cheval est fatigué ; une faute coûte plusieurs longueurs et de l'énergie. Les adversaires choisissent aussi leur élan.
   Tout est déterministe (raceRng) et appelé depuis runRaceV2 : la course se rejoue à l'identique (entrée 'jump' dans les rejeux).
   Affichage : carte d'élan dans le HUD (↑ / ↓ au clavier), haies en 3D et sauts dans 09-race-fx. */
const HAIES_FX = { p: { speed: -.035, n: 8, risk: .35 }, n: { speed: 0, n: 0, risk: 1 }, f: { speed: .045, n: 8, risk: 1.8, cost: .6 }, faute: { speed: -.12, n: 14, cost: 4 } };
const haies = (() => {
  let S = null;
  const posOf = n => Array.from({ length: n }, (_, k) => +(9 + k * 75 / Math.max(1, n - 1)).toFixed(3));
  // état remis à zéro au lancement de la course (aussi pendant un rejeu : race:launch est émis par initRivalAI)
  function reset() { const n = RACE.haies | 0; S = n ? { pos: posOf(n), next: Array(6).fill(0), fx: Array(6).fill(null), choice: 'n', log: [], last: Array(6).fill(null) } : null; ui() }
  hooks.on('race:launch', reset, 9);
  hooks.on('race:start', () => { S = null; ui() });
  const riskOf = (P, energy, c) => (P.jumpRisk ?? .1) * HAIES_FX[c].risk * (energy < 30 ? 1.6 : 1);
  // élan des adversaires : prudent quand ils sont fatigués ou maladroits, à fond pour les meneurs frais et adroits
  function aiChoice(ai) { const r = ai.P.jumpRisk ?? .1; if (ai.energy < 28 || r > .14) return 'p'; if (ai.tac === 'leader' && ai.energy > 55 && r < .12) return 'f'; return raceRng() < .2 ? 'f' : 'n' }
  function step() {
    if (!S) return;
    for (let i = 0; i < 6; i++) {
      if (raceFinished[i]) continue;
      while (S.next[i] < S.pos.length && progress[i] >= S.pos[S.next[i]]) {
        const k = S.next[i]++, ai = i ? rivalAI[i - 1] : null, P = i ? ai.P : racePlayer, energy = i ? ai.energy : playerEnergy, c = i ? aiChoice(ai) : S.choice;
        const fault = raceRng() < riskOf(P, energy, c), fx = fault ? HAIES_FX.faute : HAIES_FX[c], cost = (HAIES_FX[c].cost || 0) + (fault ? HAIES_FX.faute.cost : 0);
        S.fx[i] = fx.n ? { speed: fx.speed, until: raceTime + fx.n } : null; S.last[i] = { k, fault, c, t: raceTime };
        if (i) ai.energy = Math.max(0, ai.energy - cost);
        else { playerEnergy = Math.max(0, playerEnergy - cost); S.log.push({ k, c, fault }); S.choice = 'n'; if (!replays.busy) feedback(k, c, fault) }
      }
    }
  }
  const speed = i => { const f = S && S.fx[i]; return f && raceTime < f.until ? f.speed : 0 };
  // entrée du joueur (enregistrée pour le rejeu)
  function choose(c) { if (!S || !HAIES_FX[c] || S.next[0] >= S.pos.length) return; S.choice = c; hooks.emit('race:jump', c); ui() }
  // prochaine haie du joueur : distance en mètres, ou null
  function upcoming() { if (!S || raceFinished[0] || S.next[0] >= S.pos.length) return null; const k = S.next[0], m = (S.pos[k] - progress[0]) * RACE.dist / 100; return { k, n: S.pos.length, m, risk: riskOf(racePlayer, playerEnergy, 'n') } }
  // ---------- affichage ----------
  let card = null;
  function ensure() {
    if (card) return card; card = document.createElement('div'); card.className = 'jump-card'; card.hidden = true;
    card.innerHTML = '<div class="jc-h"><b>HAIE</b><span></span></div><div class="jc-b"><button data-j="p">⬇ PRUDENT<small>sûr, perd du terrain</small></button><button data-j="f">⬆ À FOND<small>gagne du terrain, risqué</small></button></div><div class="jc-r"></div>';
    card.addEventListener('pointerdown', e => { const b = e.target.closest('[data-j]'); if (!b) return; e.preventDefault(); e.stopPropagation(); choose(S && S.choice === b.dataset.j ? 'n' : b.dataset.j) });
    $('#raceScreen').appendChild(card); return card
  }
  function ui() {
    const c = ensure(), u = raceLoop > 0 && !replays.busy ? upcoming() : null, show = !!u && u.m < RACE.dist * .045 && u.m > -2;
    c.hidden = !show; if (!show) return;
    c.querySelector('.jc-h span').textContent = `${u.k + 1} / ${u.n} · ${Math.max(0, Math.round(u.m / 5) * 5)} m`;
    c.querySelectorAll('[data-j]').forEach(b => b.classList.toggle('on', S.choice === b.dataset.j));
    const r = u.risk, lvl = r < .08 ? ['faible', 'ok'] : r < .13 ? ['moyen', 'mid'] : ['élevé', 'bad'];
    c.querySelector('.jc-r').innerHTML = `Risque de faute <b class="${lvl[1]}">${lvl[0]}</b>${playerEnergy < 30 ? ' · fatigué : prudence' : ''}`
  }
  function feedback(k, c, fault) {
    const t = fault ? 'Faute sur la haie !' : c === 'f' ? 'Saut à fond, superbe !' : c === 'p' ? 'Saut prudent, sans risque' : 'Saut propre';
    $('#raceComment').textContent = t; try { if (fault) { sound.say('Faute !', true); buzz([30, 40, 30]) } else if (c === 'f') buzz(12) } catch (e) { }
    hooks.emit('haie', k, c, fault)
  }
  hooks.on('race:tick', ui);
  document.addEventListener('keydown', e => { if (!S || !$('#raceScreen').classList.contains('open')) return; if (e.key === 'ArrowUp') { e.preventDefault(); choose(S.choice === 'f' ? 'n' : 'f') } if (e.key === 'ArrowDown') { e.preventDefault(); choose(S.choice === 'p' ? 'n' : 'p') } });
  // bilan après l'arrivée
  function summary() { if (!S || !S.log.length) return ''; const f = S.log.filter(x => x.fault).length, a = S.log.filter(x => x.c === 'f').length, p = S.log.filter(x => x.c === 'p').length;
    return `<div class="mo-sum"><b>🏇 Haies</b><ul><li>${S.log.length - f} saut${S.log.length - f > 1 ? 's' : ''} propre${S.log.length - f > 1 ? 's' : ''} sur ${S.log.length}${f ? ` · <b style="color:#ff9a8a">${f} faute${f > 1 ? 's' : ''}</b>` : ' · aucune faute'}</li><li>${a} à fond · ${p} prudent${p > 1 ? 's' : ''} · ${S.log.length - a - p} normal${S.log.length - a - p > 1 ? 's' : ''}</li>${f && playerEnergy < 40 ? '<li>Fatigué, un cheval fait plus de fautes : garde de l’énergie pour les dernières haies.</li>' : ''}</ul></div>` }
  hooks.on('race:end', () => { if (S && S.log.length) $('#fbStars').insertAdjacentHTML('beforeend', summary()) });
  return { step, speed, choose, upcoming, reset, summary, posOf, get active() { return !!S }, get state() { return S } }
})();
