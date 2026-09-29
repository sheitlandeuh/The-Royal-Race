/* ===== Mesures de jeu (2.5) : ce que 00-journal enregistre, tiré des événements du jeu =====
   Entonnoir de la première partie (étapes datées en temps de jeu), compteurs (courses, abandons, rangs, ventes, duels…),
   gains et dépenses d'or / gemmes / fourrage par source, fluidité et première image 3D, appareil.
   Tout reste dans ce navigateur (trr.mesures). Envoi à un serveur : seulement si JOURNAL_ENVOI.url est renseigné et que le
   joueur l'a accepté dans Réglages (settings 'envoi') — un résumé et les nouvelles erreurs, au moment où le jeu passe en arrière-plan. */
const mesures = (() => {
  const J = journal;
  // --- entonnoir et compteurs ---
  const etape = n => { if (J.etape(n)) J.trace('étape', n) };
  const kind = () => RACE.defi ? 'defi' : RACE.duel ? 'duel' : RACE.haies ? 'haies' : 'plat';
  hooks.on('ready', () => {
    const M = J.mesures;
    // partie commencée avant la 2.5 : son entonnoir est incomplet, on le signale au lieu de fausser les chiffres
    if (!M.etapes.lancement) { etape('lancement'); if ((career.data.stats?.races || 0) > 0) J.note('partieAnterieure', true) }
    if (champion.exists()) etape('champion');
    J.note('appareil', appareil());
  });
  champion.on(() => etape('champion'));
  hooks.on('race:start', () => { if (replays.busy) return; J.compte('courses'); J.compte('courses_' + kind()); J.trace('course', RACE.n); etape('course_1') });
  hooks.on('race:go', () => { if (!replays.busy) etape('depart_1') });
  hooks.on('race:end', rank => {
    if (replays.busy) return; J.compte('arrivees'); J.compte('rang_' + rank); J.trace('arrivée', rank + 'e');
    etape('arrivee_1'); if (rank === 1) etape('victoire_1');
    const n = J.mesures.compteurs.arrivees; if (n === 3) etape('arrivee_3'); if (n === 10) etape('arrivee_10'); if (n === 50) etape('arrivee_50');
  });
  hooks.on('race:leave', fini => { if (!fini && !replays.busy) { J.compte('abandons'); J.trace('abandon', RACE.n) } });
  const suivi = { 'domaine:travaux': ['travaux', 'travaux_1'], 'domaine:recolte': ['recoltes', 'recolte_1'], 'vente:debut': ['ventes_lancees'], 'vente:fin': ['ventes', 'vente_1'],
    legende: ['legendes', 'legende_1'], 'duel:partage': ['duels_partages', 'duel_partage_1'], 'duel:end': ['duels_joues', 'duel_joue_1'], 'defi:end': ['defis', 'defi_1'],
    couronne: ['couronne', 'couronne_1'], deco: ['decors', 'decor_1'] };
  for (const [e, [c, s]] of Object.entries(suivi)) hooks.on(e, () => { J.compte(c); J.trace(e); if (s) etape(s) });
  // fluidité : ajustements de la qualité automatique, temps jusqu'à la première image du domaine 3D
  hooks.on('fluidite', x => { J.compte('fluidite'); J.note('fluidite', x) });
  hooks.on('domaine3d:pret', ms => { const l = (J.mesures.premiereImage3d || []).concat(Math.round(ms)).slice(-5); J.note('premiereImage3d', l) });
  // écrans ouverts (fil joint aux erreurs)
  new MutationObserver(() => { if ($('#panel').classList.contains('open')) J.trace('panneau', $('#panelTitle').textContent) }).observe($('#panel'), { attributes: true, attributeFilter: ['class'] });
  // --- économie : chaque variation d'or, de gemmes ou de fourrage est rangée par source ---
  // la source est l'événement du jeu qui vient d'avoir lieu (récolte, travaux, vente…), sinon l'écran ouvert (course, nom du panneau), sinon le domaine
  const SOURCES = { 'race:start': 'course', 'race:end': 'course', 'domaine:recolte': 'récoltes', 'domaine:travaux': 'travaux', 'domaine:fini': 'travaux',
    'vente:debut': 'ventes', 'vente:fin': 'ventes', legende: 'légendes', couronne: 'couronne', deco: 'décors', 'defi:end': 'défi du jour', 'duel:end': 'duels' };
  let recent = { nom: '', t: -1e9 };
  for (const [e, nom] of Object.entries(SOURCES)) hooks.on(e, () => { recent = { nom, t: performance.now() } }, 20);
  const source = () => performance.now() - recent.t < 1500 ? recent.nom : $('#raceScreen').classList.contains('open') ? 'course'
    : $('#panel').classList.contains('open') ? ($('#panelTitle').textContent || 'panneau').trim().toLowerCase().slice(0, 30) : 'domaine';
  let avant = { or: state.gold, gemmes: state.gems, fourrage: state.feed }, prevu = false;
  // mesuré juste après la tâche en cours : l'événement qui suit souvent la modification (hooks.emit après sync) est alors connu
  const compter = () => { prevu = false; const now = { or: state.gold, gemmes: state.gems, fourrage: state.feed }, src = source();
    for (const k in now) if (Number.isFinite(now[k]) && Number.isFinite(avant[k])) J.flux(k, now[k] - avant[k], src); avant = now };
  { const s55 = sync; sync = function () { s55(); if (!prevu) { prevu = true; setTimeout(compter, 0) } } }
  // --- appareil (rapport de bug) ---
  function gpu() {
    for (const id of ['domain3d', 'race3d']) { const c = document.getElementById(id); if (!c) continue;
      try { const g = c.getContext('webgl2') || c.getContext('webgl'); if (!g) continue; const x = g.getExtension('WEBGL_debug_renderer_info'); return String(x ? g.getParameter(x.UNMASKED_RENDERER_WEBGL) : g.getParameter(g.RENDERER)).slice(0, 90) } catch (e) { } }
    return 'inconnu (3D pas encore affichée)' }
  function appareil() {
    return { navigateur: navigator.userAgent.slice(0, 180), ecran: `${screen.width}×${screen.height}`, fenetre: `${innerWidth}×${innerHeight}`, dpr: devicePixelRatio || 1,
      coeurs: navigator.hardwareConcurrency || null, memoireGo: navigator.deviceMemory || null, tactile: matchMedia('(pointer:coarse)').matches, langue: navigator.language,
      installe: matchMedia('(display-mode: standalone)').matches, webgl2: !!window.WebGL2RenderingContext }
  }
  // --- envoi (désactivé tant que JOURNAL_ENVOI.url est vide) ---
  const envoiPossible = () => !!JOURNAL_ENVOI.url && typeof navigator.sendBeacon === 'function';
  const envoiAccepte = () => envoiPossible() && settings.get('envoi') === true;
  function envoyer() {
    if (!envoiAccepte()) return;
    const M = J.mesures; if (!M.id) J.note('id', (crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2) + Date.now().toString(36)));
    const depuis = M.envoiErreurs || 0, E = J.erreurs.filter(e => e.t > depuis).map(({ cle, ...e }) => e);
    const corps = JSON.stringify({ format: 1, id: M.id, version: VERSION, date: new Date().toISOString(), bilan: J.bilan(), appareil: appareil(), qualite: qualite(), erreurs: E });
    if (navigator.sendBeacon(JOURNAL_ENVOI.url, new Blob([corps], { type: 'application/json' }))) { J.note('envoiErreurs', Date.now()); J.sauver() }
  }
  document.addEventListener('visibilitychange', () => { if (document.hidden) envoyer() });
  const qualite = () => ({ choix: settings.get('q'), niveau: settings.level(), resolution: settings.scale(), domaine3d: typeof domaine3d !== 'undefined' && domaine3d.on, appareil: settings.device() });
  // --- rapport de bug : texte lisible + données techniques (JSON), copié ou téléchargé par le joueur ---
  function rapport(description = '') {
    const b = J.bilan(), E = J.erreurs.slice(-10).reverse().map(({ cle, ...e }) => ({ ...e, t: new Date(e.t).toISOString(), premiere: new Date(e.premiere).toISOString() }));
    const etat = { ecran: $('#raceScreen').classList.contains('open') ? 'course' : $('#panel').classList.contains('open') ? $('#panelTitle').textContent : 'domaine',
      chevaux: stable.data.horses.length, courses: career.data.stats?.races || 0, trophees: state.trophies, modulesEnEchec: window.__modulesKo || [] };
    const donnees = { format: 1, version: VERSION, date: new Date().toISOString(), appareil: { ...appareil(), gpu: gpu() }, qualite: { ...qualite(), fluidite: fluidite.etat }, etat, erreurs: E, fil: J.fil, bilan: b };
    return `The Royal Race ${VERSION} — rapport de problème (${new Date().toLocaleString('fr-FR')})\n\nCe qui s'est passé :\n${description.trim() || '(non décrit)'}\n\n`
      + `Erreurs enregistrées : ${J.erreurs.length}${E[0] ? ` — dernière : ${E[0].msg}` : ''}\n\n--- Données techniques ---\n${JSON.stringify(donnees, null, 1)}\n`;
  }
  return { rapport, appareil, envoiPossible, envoiAccepte, envoyer, get bilan() { return J.bilan() } };
})();
