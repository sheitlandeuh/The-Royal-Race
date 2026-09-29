/* ===== Écuries rivales (2.5) : des adversaires qu'on reconnaît d'une course à l'autre =====
   Douze écuries, chacune avec sa casaque (couleurs et motif fixes) et six chevaux nommés, avec leur robe.
   Un plateau prend au plus un cheval par écurie, tiré sur la graine du plateau (flux de hasard propre : la simulation
   n'en dépend pas). Les écuries dont la couleur ressemble à celle du joueur sont écartées. Black Majesty (Valmont)
   reste le rival personnel (20-rival). Face-à-face mémorisé par cheval dans career.data.face : rencontres et
   combien de fois il a fini devant le joueur. Les noms et casaques voyagent dans le plateau (rejeux, duels). */
const ECURIES = [
  { id: 'crown', n: 'Écurie Royal Crown', liv: { main: '#1f3f9f', second: '#c8982c', pattern: 'losange', cap: '#1f3f9f' },
    ch: [['Crown Prince', 'bai'], ['Éclair Rouge', 'alezan'], ['Silver Crown', 'gris'], ['Royal Shadow', 'noir'], ['Golden Star', 'palomino'], ['Crown Jewel', 'baibrun']] },
  { id: 'longchene', n: 'Haras de Longchêne', liv: { main: '#0f3b29', second: '#f3c41a', pattern: 'bandes', cap: '#f3c41a' },
    ch: [['Sirocco', 'alezan'], ['Prince Noir', 'noir'], ['Duc des Landes', 'bai'], ['Belle de Mai', 'gris'], ['Orage d’Été', 'baibrun'], ['Grand Chêne', 'bai']] },
  { id: 'montclair', n: 'Écurie Montclair', liv: { main: '#5aa4e3', second: '#f4f2ec', pattern: 'cercle', cap: '#f4f2ec' },
    ch: [['Azur Express', 'gris'], ['Rêve Bleu', 'bai'], ['Marquis d’Azur', 'baibrun'], ['Lune Bleue', 'gris'], ['Ciel de Traîne', 'alezan'], ['Montclair', 'bai']] },
  { id: 'saintaubin', n: 'Écurie Saint-Aubin', liv: { main: '#6c1428', second: '#f4f2ec', pattern: 'chevrons', cap: '#6c1428' },
    ch: [['Vin de Garde', 'baibrun'], ['Grenat', 'alezan'], ['Comte Rouge', 'alezan'], ['Rubis du Val', 'bai'], ['Pourpre Royal', 'noir'], ['Saint-Aubin', 'bai']] },
  { id: 'windsor', n: 'Windsor Lane Stud', liv: { main: '#15264a', second: '#f3c41a', pattern: 'croix', cap: '#f3c41a' },
    ch: [['Yellow Jacket', 'palomino'], ['Night Rider', 'noir'], ['Sir Galahad', 'gris'], ['Honey Bee', 'alezan'], ['Midnight Oil', 'baibrun'], ['Lord Windsor', 'bai']] },
  { id: 'rivieres', n: 'Haras des Trois Rivières', liv: { main: '#17824c', second: '#f4f2ec', pattern: 'pois', cap: '#17824c' },
    ch: [['Loire Sauvage', 'bai'], ['Mascaret', 'gris'], ['Fleur d’Eau', 'palomino'], ['Estuaire', 'baibrun'], ['Flot d’Argent', 'gris'], ['Trois Rivières', 'alezan']] },
  { id: 'valcourt', n: 'Écurie Valcourt', liv: { main: '#ee6914', second: '#15264a', pattern: 'manches', cap: '#ee6914' },
    ch: [['Feu Follet', 'alezan'], ['Soleil Levant', 'palomino'], ['Ambre Gris', 'gris'], ['Brasier', 'alezan'], ['Tigre du Bengale', 'bai'], ['Valcourt', 'baibrun']] },
  { id: 'mistral', n: 'Écurie du Mistral', liv: { main: '#8b9097', second: '#c21c27', pattern: 'brassards', cap: '#c21c27' },
    ch: [['Tramontane', 'gris'], ['Vent d’Autan', 'bai'], ['Libeccio', 'alezan'], ['Rafale', 'noir'], ['Alizé', 'gris'], ['Grand Mistral', 'baibrun']] },
  { id: 'beaulieu', n: 'Haras Beaulieu', liv: { main: '#e4679d', second: '#0f3b29', pattern: 'uni', cap: '#0f3b29' },
    ch: [['Pivoine', 'alezan'], ['Belle Époque', 'bai'], ['Lady Rose', 'gris'], ['Camélia', 'palomino'], ['Joli Cœur', 'baibrun'], ['Beaulieu', 'bai']] },
  { id: 'morvan', n: 'Écurie du Morvan', liv: { main: '#5a2a88', second: '#f3c41a', pattern: 'etoile', cap: '#5a2a88' },
    ch: [['Druide', 'gris'], ['Forêt Noire', 'noir'], ['Loup Gris', 'gris'], ['Menhir', 'baibrun'], ['Brocéliande', 'bai'], ['Morvandiau', 'alezan']] },
  { id: 'castelroux', n: 'Écurie Castelroux', liv: { main: '#c21c27', second: '#f4f2ec', pattern: 'bandes', cap: '#f4f2ec' },
    ch: [['Coquelicot', 'alezan'], ['Cardinal', 'bai'], ['Fort Castel', 'baibrun'], ['Baron Rouge', 'alezan'], ['Écarlate', 'noir'], ['Castelroux', 'bai']] },
  { id: 'boisjoli', n: 'Écurie Bois-Joli', liv: { main: '#5e341c', second: '#5aa4e3', pattern: 'croix', cap: '#5aa4e3' },
    ch: [['Cacao', 'baibrun'], ['Noisetier', 'bai'], ['Sous-Bois', 'noir'], ['Châtaigne', 'alezan'], ['Bois Joli', 'bai'], ['Pain d’Épices', 'palomino']] },
];
const ecuries = (() => {
  const rgb = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  const proche = (a, b) => { const x = rgb(a), y = rgb(b); return Math.hypot(x[0] - y[0], x[1] - y[1], x[2] - y[2]) < 70 };
  const byId = id => ECURIES.find(e => e.id === id);
  // n chevaux d'écuries différentes ; évite la couleur du joueur et les noms de ses chevaux
  function tirage(seed, n, joueur = {}) {
    const R = seeded(((seed >>> 0) ^ 0x2545f491) >>> 0), noms = new Set((joueur.noms || []).map(s => s.toLowerCase()));
    const E = ECURIES.filter(e => !joueur.main || !proche(e.liv.main, joueur.main));
    for (let i = E.length - 1; i > 0; i--) { const j = Math.floor(R() * (i + 1));[E[i], E[j]] = [E[j], E[i]] }
    return E.slice(0, n).map(e => {
      const libres = e.ch.filter(c => !noms.has(c[0].toLowerCase())), [name, coat] = (libres.length ? libres : e.ch)[Math.floor(R() * (libres.length || e.ch.length))];
      return { name, ecurie: e.id, livery: { ...e.liv, coat } };
    });
  }
  const joueur = () => ({ main: stable.silks.main, noms: stable.data.horses.map(h => h.name) });
  // face-à-face : chaque course terminée (hors rejeux et duels), pour chaque adversaire nommé
  const face = () => career.data.face = career.data.face || {};
  let engage = null; // plateau de la course en cours (currentField est vidé avant la fin de course)
  hooks.on('race:end', () => {
    if (replays.busy || RACE.duel) return; const F = engage, me = finishOrder.indexOf(0); if (!F || me < 0) return; const f = face();
    F.rivals.forEach((r, i) => { const k = r.name; if (!k) return; const x = f[k] = f[k] || { n: 0, devant: 0 }; x.n++; if (finishOrder.indexOf(i + 1) < me) x.devant++ });
    const cles = Object.keys(f); if (cles.length > 120) cles.sort((a, b) => f[a].n - f[b].n).slice(0, cles.length - 120).forEach(k => delete f[k]);
    career.save();
  }, 5);
  // noms de la course en cours (commentaire, classement, photo) : ceux du plateau engagé
  hooks.on('race:start', () => { const F = engage = currentField; if (F) F.rivals.forEach((r, i) => { if (r.name) raceNames[i + 1] = r.name }) }, 60);
  // texte court pour la liste des partants : « 3ᵉ rencontre · tu mènes 2–0 »
  function bilan(name) {
    const x = (career.data.face || {})[name]; if (!x || !x.n) return ''; const moi = x.n - x.devant, lui = x.devant;
    return `${x.n + 1}ᵉ rencontre · ${moi > lui ? `tu mènes ${moi}–${lui}` : moi < lui ? `il mène ${lui}–${moi}` : `égalité ${moi}–${lui}`}`;
  }
  return { tirage, joueur, bilan, nom: id => id === 'valmont' ? 'Écurie du ' + VALMONT.owner : byId(id)?.n || '', get face() { return career.data.face || {} } };
})();
