/* ===== Aide et informations (2.5) : signaler un problème, confidentialité, crédits =====
   Écrans ouverts depuis Réglages (section AIDE). Tout ce qui est écrit ici doit rester vrai : si le jeu se met à envoyer
   des données (JOURNAL_ENVOI), à afficher de la publicité ou à ouvrir des comptes, la page Confidentialité change avec. */
const aide = (() => {
  const panneau = (titre, html) => { $('#panelTitle').textContent = titre; $('#panel .card').classList.remove('wide'); $('#panelBody').innerHTML = `<div class="aide">${html}</div>`; $('#panel').classList.add('open') };
  const pluriel = (n, mot) => `${n} ${mot}${n > 1 ? 's' : ''}`;
  // --- signaler un problème ---
  function signaler() {
    const n = journal.erreurs.length;
    panneau('Signaler un problème', `<p class="hint">Décris ce qui s'est passé : ce que tu faisais, ce que tu attendais, ce qui est arrivé.</p>
      <textarea class="savecode" id="bugDesc" maxlength="1500" placeholder="Ex. : au départ du Grand Prix, l'écran est resté noir…"></textarea>
      <p class="hint">Le rapport joint la version du jeu, ton appareil et ton navigateur, les réglages graphiques, ${n ? pluriel(n, 'erreur') + ' enregistrée' + (n > 1 ? 's' : '') : 'aucune erreur enregistrée'}, les derniers écrans ouverts et un résumé de ta progression. Aucune donnée personnelle, et rien ne part sans toi : copie-le ou télécharge-le, puis joins-le à ton message.</p>
      <div class="race-entry"><button class="action green" id="bugCopy">COPIER LE RAPPORT</button> <button class="action" id="bugDl">TÉLÉCHARGER</button>${JOURNAL_ENVOI.contact ? ' <button class="action" id="bugMail">ÉCRIRE AU SUPPORT</button>' : ''}</div>
      <details class="aide-plus" id="bugVoir"><summary>Voir le rapport</summary><pre class="savecode" id="bugPre"></pre></details>`);
  }
  const texte = () => mesures.rapport($('#bugDesc')?.value || '');
  // --- confidentialité : ce que le jeu garde, où, et ce qu'il n'envoie pas ---
  const CLES = [['trr.stable', 'Écurie : chevaux, casaque, or, gemmes, fourrage'], ['trr.progress', 'Progression : carrière, domaine, ventes, Légendes, Couronne, missions'],
    ['trr.champion', 'Ton premier cheval'], ['trr.settings', 'Réglages'], ['trr.replays', 'Les 10 dernières courses (rejeux)'], ['trr.defi', 'Défi du jour'], ['trr.duels', 'Duels reçus et envoyés'],
    ['trr.bak', 'Copie de secours de la partie'], ['trr.mesures', 'Journal technique : jours joués, sessions, étapes, gains et dépenses'], ['trr.erreurs', 'Journal technique : erreurs rencontrées']];
  const taille = k => { try { const v = localStorage.getItem(k); return v == null ? 0 : v.length } catch (e) { return 0 } };
  const ko = n => n < 1024 ? `${n} o` : `${(n / 1024).toFixed(1).replace('.', ',')} Ko`;
  function confidentialite() {
    const envoi = mesures.envoiPossible();
    panneau('Confidentialité', `<section><h4>CE QUE LE JEU GARDE</h4>
      <p class="hint">Ta partie est enregistrée <b>uniquement dans ce navigateur</b>, sur cet appareil. Il n'y a ni compte, ni serveur de sauvegarde : si tu vides les données du site, la partie est perdue — garde un code de sauvegarde (Réglages → Transférer ma partie).</p>
      <table class="aide-t">${CLES.map(([k, d]) => `<tr><td>${d}</td><td>${taille(k) ? ko(taille(k)) : '—'}</td></tr>`).join('')}</table></section>
      <section><h4>JOURNAL TECHNIQUE</h4><p class="hint">Pour corriger les problèmes, le jeu note sur cet appareil les erreurs rencontrées et quelques statistiques (jours joués, durée des sessions, étapes franchies, gains et dépenses, fluidité). Ce journal ne sert qu'au rapport que tu peux copier toi-même (Signaler un problème).</p>
      ${envoi ? `<label class="tog"><input type="checkbox" id="setEnvoi" ${mesures.envoiAccepte() ? 'checked' : ''}> Envoyer ce journal, sans nom ni adresse, pour aider à améliorer le jeu</label>` : ''}
      <button class="action" id="journalEffacer">Effacer le journal technique</button></section>
      <section><h4>CE QUI SORT DE L'APPAREIL</h4><p class="hint">${envoi ? `Seulement si tu l'acceptes ci-dessus : le journal technique, avec un identifiant tiré au hasard.` : `Rien. Le jeu ne contient ni publicité, ni mesure d'audience, ni compte, et ses fichiers (images, polices, moteur 3D) sont servis avec lui.`}
      Les duels passent par un lien que tu partages toi-même : il contient ton cheval (nom, qualités, casaque), la course et ton résultat, rien d'autre.
      Le commentaire du speaker utilise la synthèse vocale de ton navigateur, avec une voix installée sur l'appareil quand il en a une ; sinon, selon le navigateur, la voix peut être produite en ligne par son éditeur (seul le texte du commentaire est transmis). Tu peux couper le commentaire dans Réglages.</p></section>`);
  }
  // --- crédits : composants tiers et leurs licences ---
  const MIT = `Copyright © 2010-2023 three.js authors

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.`;
  function credits() {
    panneau('Crédits', `<section><h4>THE ROYAL RACE ${escapeHTML(VERSION)}</h4><p class="hint">Chevaux, jockeys, hippodrome et domaine 3D sont construits par le jeu lui-même. Bruitages et musique sont synthétisés en direct (Web Audio) ; le commentaire utilise la synthèse vocale de ton appareil.</p></section>
      <section><h4>MOTEUR 3D</h4><p class="hint"><b>three.js</b> r160 — © 2010-2023 three.js authors — licence MIT.</p><details class="aide-plus"><summary>Texte de la licence</summary><pre class="savecode">${escapeHTML(MIT)}</pre></details></section>
      <section><h4>POLICES</h4><p class="hint"><b>Russo One</b> — Jovanny Lemonad · <b>Rajdhani</b> — Indian Type Foundry · <b>Exo 2</b> — Natanael Gama.<br>Licence SIL Open Font License 1.1 — <a href="assets/fonts/OFL.txt" target="_blank" rel="noopener">texte complet</a>.</p></section>`);
  }
  // --- clics (panneau commun) ---
  $('#panelBody').addEventListener('click', async e => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.id === 'aideBug') signaler();
    else if (b.id === 'aidePrivee') confidentialite();
    else if (b.id === 'aideCredits') credits();
    else if (b.id === 'bugCopy') { try { await navigator.clipboard.writeText(texte()); toast('Rapport copié : colle-le dans ton message') } catch (err) { const v = $('#bugVoir'); v.open = true; $('#bugPre').textContent = texte(); toast('Copie impossible : sélectionne le rapport affiché') } }
    else if (b.id === 'bugDl') { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([texte()], { type: 'text/plain;charset=utf-8' })); a.download = `royal-race-rapport-${new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-')}.txt`; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000) }
    else if (b.id === 'bugMail') { const t = texte(); location.href = `mailto:${JOURNAL_ENVOI.contact}?subject=${encodeURIComponent(`The Royal Race ${VERSION} — problème`)}&body=${encodeURIComponent(t.length > 1800 ? t.slice(0, 1800) + '\n… (rapport complet : bouton Télécharger)' : t)}` }
    else if (b.id === 'journalEffacer') { if (!b.dataset.armed) { b.dataset.armed = 1; b.textContent = 'Confirmer : effacer le journal'; b.classList.add('danger'); return } journal.effacer(); toast('Journal technique effacé'); confidentialite() }
  });
  $('#panelBody').addEventListener('toggle', e => { if (e.target.id === 'bugVoir' && e.target.open) $('#bugPre').textContent = texte() }, true);
  $('#panelBody').addEventListener('change', e => { if (e.target.id === 'setEnvoi') settings.set('envoi', e.target.checked) });
  return { signaler, confidentialite, credits };
})();
