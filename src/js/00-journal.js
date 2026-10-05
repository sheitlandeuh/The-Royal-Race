/* ===== Journal local (2.5) : erreurs et mesures de jeu, gardées sur l'appareil =====
   Premier module chargé, sans dépendance, pour attraper aussi les erreurs des modules suivants.
   - trr.erreurs : les 30 dernières erreurs distinctes (message, fichier:ligne, pile courte, version, écran, nombre, derniers événements) ;
     erreurs JS, promesses rejetées, erreurs attrapées par hooks (console.error), fichiers introuvables.
   - trr.mesures : premier lancement, jours joués (rétention J1 / J7 / J30), sessions et temps de jeu, étapes de la première partie
     (entonnoir), courses, gains et dépenses par source, fluidité, appareil. Rempli par 55-mesures (événements du jeu).
   Rien ne quitte l'appareil : le joueur copie lui-même le rapport (Réglages → Signaler un problème). Un envoi vers un serveur
   n'existe que si JOURNAL_ENVOI.url est renseigné ET que le joueur l'accepte (voir 55-mesures et docs/MESURES.md). */
const JOURNAL_ENVOI = { url: '', contact: '' }; // vides dans le jeu publié : aucun envoi, aucun choix affiché
const journal = (() => {
  const KE = 'trr.erreurs', KM = 'trr.mesures', JOUR = 864e5, PAUSE_SESSION = 30 * 60e3;
  const lire = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k) || 'null'); return v && typeof v === 'object' ? v : d } catch (e) { return d } };
  const ecrire = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)) } catch (e) { } };
  const minuit = t => { const d = new Date(t); d.setHours(0, 0, 0, 0); return d.getTime() };
  const version = () => typeof VERSION !== 'undefined' ? VERSION : '?';
  let E = lire(KE, []); if (!Array.isArray(E)) E = [];
  const M = lire(KM, {});
  const t0 = Date.now();
  // --- sessions, jours joués, temps de jeu (visible seulement) ---
  if (!M.debut) { M.debut = t0; M.premiereVersion = version() }
  M.jeu = M.jeu || 0; M.jours = Array.isArray(M.jours) ? M.jours : []; M.durees = Array.isArray(M.durees) ? M.durees : [];
  M.etapes = M.etapes || {}; M.compteurs = M.compteurs || {}; M.flux = M.flux || {};
  // durée de la session précédente (enCours, en s) rangée à l'ouverture suivante : rien à faire à la fermeture de l'onglet
  const finSession = () => { if (M.enCours) { M.durees.push(M.enCours); if (M.durees.length > 30) M.durees.shift() } M.enCours = 0 };
  // rechargement de la page moins de 30 min après la dernière mesure : même session
  const suite = M.sessions && M.maj && t0 - M.maj < PAUSE_SESSION;
  if (!suite) { finSession(); M.sessions = (M.sessions || 0) + 1; M.sessionDebut = t0 }
  let session = { debut: M.sessionDebut || t0, jeu: suite ? (M.enCours || 0) * 1000 : 0 }, visibleDepuis = document.hidden ? 0 : t0, cacheLe = document.hidden ? t0 : 0;
  const jour = () => { const j = Math.round((minuit(Date.now()) - minuit(M.debut)) / JOUR); if (!M.jours.includes(j)) { M.jours.push(j); if (M.jours.length > 400) M.jours.shift() } };
  const compterTemps = () => { if (!visibleDepuis) return; const now = Date.now(), d = Math.min(now - visibleDepuis, 10 * 60e3); visibleDepuis = now; session.jeu += d; M.jeu += d; M.enCours = Math.round(session.jeu / 1000) };
  const sauver = () => { compterTemps(); M.maj = Date.now(); M.version = version(); if (!M.premiereVersion || M.premiereVersion === '?') M.premiereVersion = M.version; ecrire(KM, M) };
  jour();
  // plus de 30 min sans regarder le jeu : la session suivante commence au retour
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { compterTemps(); visibleDepuis = 0; cacheLe = Date.now(); sauver() }
    else { const now = Date.now(); if (cacheLe && now - cacheLe > PAUSE_SESSION) { finSession(); M.sessions++; M.sessionDebut = now; session = { debut: now, jeu: 0 } } visibleDepuis = now; cacheLe = 0; jour() }
  });
  addEventListener('pagehide', sauver);
  setInterval(sauver, 30e3);
  // --- fil des derniers événements (joint à chaque erreur) ---
  const fil = [];
  const trace = (nom, info) => { fil.push({ t: Math.round((Date.now() - t0) / 100) / 10, nom, ...(info ? { info: String(info).slice(0, 60) } : {}) }); if (fil.length > 12) fil.shift() };
  // --- erreurs ---
  const ecran = () => { try { const r = document.getElementById('raceScreen'), p = document.getElementById('panel'); if (r && r.classList.contains('open')) return 'course'; if (p && p.classList.contains('open')) return 'panneau : ' + (document.getElementById('panelTitle')?.textContent || '?'); return 'domaine' } catch (e) { return '?' } };
  const fichier = s => String(s || '').split(/[?#]/)[0].split('/').pop();
  let dernier = 0, vu = { msg: '', t: 0 };
  function erreur(type, msg, src, pile) {
    msg = String(msg || 'erreur inconnue').slice(0, 300); src = String(src || '').slice(0, 120);
    const cle = type + '|' + msg + '|' + src, now = Date.now();
    // la même erreur répétée aussitôt par console.error (message d'erreur de 26-release) n'est comptée qu'une fois
    if (type === 'rattrapée' && vu.t > now - 300 && msg.includes(vu.msg)) return; vu = { msg, t: now };
    let e = E.find(x => x.cle === cle);
    if (e) { e.n++; e.t = now; E = E.filter(x => x !== e) }
    else e = { cle, type, msg, src, pile: pile ? String(pile).split('\n').slice(0, 8).map(l => l.trim().replace(/(https?:)?\/\/[^)\s]*\//, '')).join('\n').slice(0, 900) : '', n: 1, t: now, premiere: now };
    e.v = version(); e.ecran = ecran(); e.fil = fil.slice(-8); e.session = M.sessions;
    E.push(e); if (E.length > 30) E.shift();
    if (now - dernier > 250) { dernier = now; ecrire(KE, E) } else setTimeout(() => ecrire(KE, E), 300);
    trace('erreur', msg);
  }
  addEventListener('error', ev => {
    const cible = ev.target;
    if (cible && cible !== window && (cible.src || cible.href)) { erreur('fichier', 'Fichier introuvable : ' + fichier(cible.src || cible.href), cible.tagName); return } // image, son, script
    if (!ev.message) return;
    erreur('js', ev.message, ev.filename ? fichier(ev.filename) + ':' + ev.lineno + ':' + ev.colno : '', ev.error && ev.error.stack);
  }, true);
  addEventListener('unhandledrejection', ev => { const r = ev.reason; erreur('promesse', r && r.message || r, '', r && r.stack) });
  // erreurs rattrapées (écouteurs de hooks, chargeur des modules) : elles ne remontent pas jusqu'à window
  const ce = console.error.bind(console);
  console.error = (...a) => { ce(...a); try { const x = a.find(v => v instanceof Error); erreur('rattrapée', a.map(v => v instanceof Error ? v.message : typeof v === 'string' ? v : '').filter(Boolean).join(' '), '', x && x.stack) } catch (e) { } };
  // --- mesures (appelées par 55-mesures) ---
  const tempsJeu = () => { compterTemps(); return Math.round(M.jeu / 1000) };
  return {
    erreur, trace,
    // première fois qu'une étape de la partie est franchie : temps de jeu cumulé (s), session, jour
    etape(nom) { if (M.etapes[nom]) return false; M.etapes[nom] = { jeu: tempsJeu(), session: M.sessions, jour: Math.round((minuit(Date.now()) - minuit(M.debut)) / JOUR) }; sauver(); return true },
    compte(nom, n = 1) { M.compteurs[nom] = (M.compteurs[nom] || 0) + n },
    // or / gemmes / fourrage gagnés ou dépensés, par source
    flux(res, delta, source, sure) { if (!delta) return; const f = M.flux[res] = M.flux[res] || { gain: {}, depense: {} }, sens = delta > 0 ? f.gain : f.depense; if (!sure && !(source in sens) && Object.keys(sens).length >= 24) source = 'autre'; sens[source] = (sens[source] || 0) + Math.abs(delta) },
    note(k, v) { M[k] = v },
    sauver, tempsJeu,
    get mesures() { compterTemps(); return M }, get erreurs() { return E.slice() }, get session() { return { ...session, n: M.sessions } }, get fil() { return fil.slice() },
    // bilan lisible : rétention, entonnoir, économie
    bilan() {
      const J = M.jours, s = x => J.includes(x);
      return { depuis: new Date(M.debut).toISOString().slice(0, 10), sessions: M.sessions, jeuMin: Math.round(tempsJeu() / 60), joursJoues: J.length, J1: s(1), J7: s(7), J30: s(30),
        dureeMedianeS: M.durees.length ? M.durees.slice().sort((a, b) => a - b)[M.durees.length >> 1] : null, etapes: M.etapes, compteurs: M.compteurs, flux: M.flux }
    },
    // test automatique : retire les erreurs provoquées exprès
    retirer(re) { E = E.filter(e => !re.test(e.msg)); ecrire(KE, E) },
    effacer() { E = []; for (const k in M) delete M[k]; Object.assign(M, { debut: Date.now(), sessions: 1, sessionDebut: Date.now(), jeu: 0, enCours: 0, jours: [0], durees: [], etapes: {}, compteurs: {}, flux: {}, premiereVersion: version() }); session = { debut: Date.now(), jeu: 0 }; try { localStorage.removeItem(KE) } catch (e) { } sauver() }
  };
})();
