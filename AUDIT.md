# Audit — The Royal Race (version du 23/09/2026)

**Périmètre :** dépôt `fish4win59/the-royal-race`, commit `36ab2e3` (8 commits, tous du 23/09/2026).
**Méthode :** lecture intégrale du code (`index.html`, 222 lignes / 97 Ko, HTML + CSS + JS dans un seul fichier), puis parties complètes pilotées par script dans Chromium : PC 1440×900, mobile paysage 844×390, mobile portrait 390×844, et un test sans accès au CDN. Captures dans `audit/`.

---

## Verdict en une phrase

C'est une **démo de vitrine réussie visuellement** (village peint très joli, départ en stalles 3D spectaculaire, podium), mais pas encore un jeu : **la course est impossible à lancer sur mobile**, rien n'est sauvegardé, et toutes les couches « méta » (chevaux, entraînement, tactique, club, boutique, missions) sont des maquettes sans effet sur la partie.

| Axe | État | Note /10 |
|---|---|---|
| Direction artistique (village, stalles, podium) | Très bon niveau, cohérent | 7 |
| Boucle de course (gameplay) | Jouable sur PC seulement, peu de décisions réelles | 3 |
| Méta‑progression / économie | Maquette statique, non persistée | 1 |
| Mobile (cible principale) | Bloquant | 1 |
| Technique / architecture | Fichier unique, code mort, pas de build | 2 |
| Multijoueur | Inexistant (5 IA) | 0 |
| Prêt à commercialiser | Non | — |

---

## P0 — Bloquants (à corriger avant toute diffusion)

1. **Impossible de partir sur mobile / tablette.** Le départ des stalles n'est déclenché que par la touche `F` (`launchFromStalls` n'est appelé que dans le `keydown`). Sur écran tactile, le jeu reste figé sur « APPUYE SUR F ! » indéfiniment ; le bouton SPRINT est désactivé. *Vérifié en test tactile : phase `waiting`, boucle de course jamais lancée.* → Ajouter un gros bouton « PARTEZ ! » tactile (et le rendre aussi accessible à la souris).
2. **Sans Three.js, aucune course possible.** Three.js est chargé depuis un CDN ; si le CDN est bloqué (réseau d'entreprise, hors‑ligne, bloqueur), `launchFromStalls` sort immédiatement (`if(!q) return`) et le rendu de secours 2D est cassé (chevaux géants superposés, cf. `audit/course-sans-cdn.png`). → Embarquer Three.js dans le projet (bundle), supprimer le rendu 2D de secours.
3. **Aucune sauvegarde.** Pas de `localStorage`, pas de serveur : un rechargement remet l'or, les trophées et le fourrage à leurs valeurs initiales. *Vérifié : or 87 200 → 85 400 après rechargement.*
4. **Classement affiché faux après l'arrivée.** `markFinish` attribue une progression croissante aux chevaux dans l'ordre d'arrivée, donc le dernier arrivé a la plus grande valeur : le HUD affiche « 1er » alors que le joueur est 6e (cf. `audit/podium-position-fausse.png`).
5. **Mobile paysage : la barre de navigation disparaît.** `.game{min-height:600px}` (500 px sur mobile) dépasse la hauteur d'un téléphone en paysage (≈390 px) → le dock est coupé, plus aucune navigation (cf. `audit/mobile-paysage-sans-dock.png`).
6. **Les panneaux bloquent la navigation.** Quand un panneau est ouvert (Chevaux, Courses…), il recouvre le dock (z-index 20 contre 9) : il faut fermer avant de changer d'onglet.

## P1 — Le jeu n'a pas encore de profondeur

7. **Les choix d'avant-course n'ont aucun effet.** `state.strategy` est enregistré mais jamais lu par la simulation. Les stats du cheval et du jockey (88/82/79…) sont du HTML en dur. « Entraîner » et « Coaching » retirent des ressources puis affichent un texte, sans rien modifier.
8. **L'endurance ne compte pas.** Le sprint coûte ~15 % et la récupération est quasi permanente : dans nos parties la jauge était à 100 % en milieu et en fin de course. Il n'y a donc pas de vrai dilemme « quand sprinter ».
9. **Un seul cheval jouable, une seule course, 5 rivaux figés** (mêmes noms à chaque course). Pas de progression, pas de ligues, pas de récompense autre que de l'or.
10. **Tout le reste est décoratif :** bouton « + » des ressources (« boutique bientôt disponible »), réglages ⚙️ (aucune action), Club, Boutique, Événements, Trophées, Missions (une seule récompense récupérable, recréée à chaque ouverture = or infini).
11. **Aucun son.** Pas de musique, pas de galop, pas de foule, pas de speaker : c'est l'un des plus gros leviers de sensation pour une course.
12. **HUD de course : le bloc « ROYAL THUNDER / ENDURANCE » est coupé à gauche** sur PC comme sur mobile (reste d'un ancien `transform: translateX(-50%)`). En portrait, la carte profil est recouverte par les ressources.
13. **Textes :** « APPUYE SUR F » → « APPUIE ». Le badge « 6 joueurs » est trompeur (ce sont des IA). Temps de course ≈ 44 s pour 1 600 m (≈ 130 km/h) : à assumer comme « arcade » ou recaler.

## P2 — Technique et performance

14. **Tout dans un seul fichier de 97 Ko**, CSS réécrit par couches successives (« Course v4 » par‑dessus v1–v3), JS minifié à la main. Code mort : `runRace` et `finishRace` (ancienne version), `addNaturalTrees` défini deux fois, tout le rendu canvas 2D, les éléments `.opponent` masqués. → Passer à un vrai projet (Vite + modules), un fichier par système.
15. **Images : 20 Mo de PNG**, dont 5,2 Mo jamais utilisés (`croise-panorama-loop.png`, `croise-track-pov.png`). Conversion WebP/AVIF → ~2–3 Mo au total, et un écran de chargement.
16. **Rendu 3D lourd pour mobile :** ombres 2048² en PCF soft, `pixelRatio` jusqu'à 2,5, 5 lumières ponctuelles sur l'arche, antialias. À mesurer sur un Android d'entrée de gamme ; prévoir un réglage qualité (bas/moyen/haut). *Notre environnement de test n'a pas de GPU, donc aucune mesure de FPS fiable n'a pu être faite.*
17. **Simulation liée à l'horloge réelle** (`setInterval` 100 ms, temps mesurés avec `performance.now`, rivaux avec `Math.random`). Onglet en arrière‑plan = course ralentie ; résultats non reproductibles ; impossible à valider côté serveur. Three.js r160 utilisé via la build globale `three.min.js`, dépréciée.
18. **Outils `document.modelContext`** (expérimentaux) exposés en production, dont un qui dépense 25 000 or : à retirer.

---

## Ce qui est déjà bien (à garder)

- Le **village peint** : lisible, riche, cohérent avec la marque ; bonne base pour la navigation par bâtiments.
- La **séquence de départ** : survol de l'hippodrome, compte à rebours, stalles, bonus de réaction (<180 ms « PARFAIT »). C'est le meilleur moment du jeu.
- **Placement / aspiration / virage large** : bonne intuition de gameplay, à rendre plus lisible et plus punitive.
- **Classement officiel + podium 3D** : belle récompense de fin de course.
- Ton, identité « royale » et interface en français soignées.

---

## Feuille de route vers une version commercialisable

### Étape 1 — « Jeu jouable partout » (1–2 semaines)
- Corriger les P0 (bouton de départ tactile, Three.js embarqué, sauvegarde locale, classement, dock, panneaux).
- Migrer vers Vite + modules ; supprimer le code mort et les images inutilisées ; convertir les images.
- Réglage qualité graphique + test réel sur iPhone et Android d'entrée de gamme (objectif 60 fps / 30 fps minimum).

### Étape 2 — « Boucle de jeu qui donne envie de rejouer » (3–5 semaines)
- **Simulation déterministe** (graine + entrées du joueur) où stats, tactique, jockey et endurance comptent vraiment.
- Écurie réelle : plusieurs chevaux, stats par cheval, fatigue/repos (Clinique), entraînement qui fait progresser.
- Ligues à trophées, plusieurs hippodromes/distances/terrains, rivaux générés.
- Missions quotidiennes, coffres, événement hebdomadaire.
- Son : musique, galop, foule, speaker ; retours haptiques sur mobile.
- Tutoriel de 60 secondes (premier départ guidé).

### Étape 3 — « Produit commercial » (6–10 semaines)
- **Backend** : comptes, sauvegarde cloud, économie validée côté serveur, anti‑triche (la simulation déterministe permet de rejouer la course sur le serveur).
- **Multijoueur** : d'abord asynchrone (courir contre les « fantômes » d'autres joueurs, bien plus simple et robuste), puis temps réel en option.
- **Monétisation** : passe de saison + cosmétiques (casaques, robes, décors du domaine) ; éviter le « pay‑to‑win » sur les stats.
- **Stores** : emballage PWA + Capacitor pour iOS/Android ; les achats de gemmes doivent passer par l'In‑App Purchase Apple/Google.
- **Analytics & live ops** : funnel du tutoriel, rétention J1/J7/J30, équilibrage de l'économie.

### Étape 4 — Conformité avant lancement
- RGPD (consentement, politique de confidentialité, suppression de compte), CGU, classification PEGI / âge.
- **Pas de paris** en monnaie réelle ni rien qui y ressemble (sinon régulation jeux d'argent) ; prudence avec les coffres aléatoires (interdits ou encadrés dans certains pays, ex. Belgique) → afficher les probabilités.
- Vérifier les droits commerciaux des images générées par IA et la disponibilité du nom « The Royal Race » (marque, stores, nom de domaine).

---

## Checklist « 100 % complet »

- [ ] Jouable au tactile, à la souris et au clavier
- [ ] Fonctionne hors CDN, chargement < 5 s en 4G
- [ ] Sauvegarde (locale puis cloud)
- [ ] Stats, tactique, jockey et endurance influencent réellement la course
- [ ] Plusieurs chevaux, entraînement, repos, progression
- [ ] Ligues, missions, événements fonctionnels
- [ ] Boutique et réglages fonctionnels (son, qualité, langue)
- [ ] Musique et effets sonores
- [ ] Tutoriel
- [ ] Multijoueur (au minimum asynchrone)
- [ ] Économie validée côté serveur
- [ ] Builds iOS / Android + PWA
- [ ] Analytics, CGU, confidentialité, PEGI
