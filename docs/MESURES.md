# Mesures et erreurs (2.5)

Le jeu tient un journal **sur l'appareil du joueur**. Par défaut, **rien n'est envoyé**. Le rapport de problème (Réglages → Aide → Signaler un problème) est copié ou téléchargé par le joueur lui-même.

## Ce qui est noté

| Clé `localStorage` | Contenu | Écrit par |
|---|---|---|
| `trr.erreurs` | Les 30 dernières erreurs distinctes : type (`js`, `promesse`, `rattrapée`, `fichier`), message, fichier:ligne:colonne, pile (8 lignes), version, écran (course / panneau / domaine), nombre d'occurrences, dates, 8 derniers événements du jeu | `00-journal` |
| `trr.mesures` | Premier lancement, version de départ, jours joués (`jours` : numéros de jour depuis l'installation), sessions (30 min sans regarder le jeu = nouvelle session), temps de jeu visible, durée des 30 dernières sessions, étapes de la première partie, compteurs, gains et dépenses par source, fluidité, appareil | `00-journal`, `55-mesures` |

**Étapes (entonnoir)**, notées une seule fois avec le temps de jeu cumulé, le numéro de session et le jour :
`lancement`, `champion`, `course_1`, `depart_1`, `arrivee_1`, `victoire_1`, `arrivee_3`, `arrivee_10`, `arrivee_50`, `recolte_1`, `travaux_1`, `vente_1`, `legende_1`, `duel_partage_1`, `duel_joue_1`, `defi_1`, `couronne_1`, `decor_1`.
Une partie commencée avant la 2.5 porte `partieAnterieure: true` : son entonnoir est incomplet.

**Compteurs** : `courses` (et `courses_plat` / `haies` / `defi` / `duel`), `arrivees`, `rang_1` … `rang_6`, `abandons`, `travaux`, `recoltes`, `ventes_lancees`, `ventes`, `legendes`, `duels_partages`, `duels_joues`, `defis`, `couronne`, `decors`, `fluidite`.

**Économie** (`flux`) : pour l'or, les gemmes et le fourrage, total gagné et dépensé par source. La source est l'événement du jeu qui vient d'avoir lieu (course, récoltes, travaux, ventes, légendes, couronne, décors, défi du jour, duels), sinon le titre du panneau ouvert (boutique royale, écurie…), sinon « domaine ».

**Rétention** : `journal.bilan()` rend `J1`, `J7`, `J30` (le joueur est-il revenu ce jour-là), le nombre de jours joués et la durée médiane des sessions. Chiffres d'**un** appareil : une rétention de population demande l'envoi (ci-dessous).

Dans la console : `journal.bilan()`, `journal.erreurs`, `mesures.rapport()`.

## Brancher un envoi (serveur à fournir)

1. Dans `src/js/00-journal.js`, renseigner `JOURNAL_ENVOI.url` (adresse https qui accepte un `POST` JSON) et, pour le bouton « Écrire au support », `JOURNAL_ENVOI.contact` (adresse e-mail).
2. Le choix apparaît alors dans Réglages → Aide → Confidentialité : **décoché par défaut** (consentement explicite, RGPD). Tant que le joueur ne l'a pas coché, rien ne part.
3. Quand le jeu passe en arrière-plan, il envoie par `navigator.sendBeacon` :

```json
{
  "format": 1,
  "id": "identifiant tiré au hasard sur l'appareil (crypto.randomUUID)",
  "version": "2.5",
  "date": "2026-09-29T10:00:00.000Z",
  "bilan": { "depuis": "…", "sessions": 3, "jeuMin": 42, "joursJoues": 2, "J1": true, "J7": false, "J30": false,
             "dureeMedianeS": 610, "etapes": { … }, "compteurs": { … }, "flux": { … } },
  "appareil": { "navigateur": "…", "ecran": "390×844", "dpr": 3, "coeurs": 6, "memoireGo": 4, "tactile": true, "langue": "fr-FR", "installe": false, "webgl2": true },
  "qualite": { "choix": "auto", "niveau": "moyenne", "resolution": 0.85, "domaine3d": true, "appareil": "moyenne" },
  "erreurs": [ { "type": "js", "msg": "…", "src": "10-race.js:120:33", "pile": "…", "n": 2, "t": 1790000000000, "premiere": 1790000000000, "v": "2.5", "ecran": "course", "fil": [ … ], "session": 3 } ]
}
```

Seules les erreurs apparues depuis le dernier envoi réussi sont jointes.

4. **À mettre à jour en même temps** : la page Confidentialité (`56-aide`, section « Ce qui sort de l'appareil »), la politique de confidentialité publiée, et le registre des traitements. Un outil tiers (Sentry, analytics) se branche au même endroit, avec les mêmes conditions de consentement.
