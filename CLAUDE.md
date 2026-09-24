# The Royal Race — guide pour Claude Code

Jeu de courses hippiques (PC / mobile, navigateur), en français. Remplace l'ancien projet Turf Royal (abandonné).
Propriétaire : Enzo. Échanges et textes du jeu en français.

## Commandes
- `npm run build` : assemble `src/` en un seul `index.html` jouable (CSS et JS insérés, dans l'ordre alphabétique des fichiers).
- `npm run check` : vérifie seulement la syntaxe de chaque module et du bundle.
- `npm start` : build puis serveur local sur http://localhost:8000
- `node tools/balance-test.cjs` : bot Playwright qui court des dizaines de courses (équilibrage).
- Ne jamais modifier `index.html` à la main : il est régénéré. On modifie `src/`, puis on build.

## Architecture
- Pas de framework, pas de bundler, pas de dépendance d'exécution. Three.js r160 (build global) dans `assets/vendor/three.min.js`.
- `src/js/NN-nom.js` : modules en IIFE qui exposent un objet global (`stable`, `career`, `meta`, `season`, `breeding`, `rival`, `gear`, `tour`, `palmares`, `shop`, `HORSE3D`, `raceFX`, `villageLife`…). L'ordre des fichiers = l'ordre d'exécution : un module ne peut appeler un module plus loin qu'au moment de l'exécution (événements, rAF), jamais au chargement (zone morte temporelle des `const`).
- Sauvegarde : `localStorage` — `trr.stable` (chevaux, casaque, ressources), `trr.progress` (carrière et tous les systèmes méta), `trr.settings`, `trr.champion`, copie de secours `trr.bak`. `sync()` enregistre automatiquement les ressources.
- Course : simulation déterministe à graine (`raceRng`, `seeded`), une étape toutes les 100 ms ; rendu Three.js séparé (`05-race-scene`, `09-race-fx`, `10-race`). Même formule de performance pour joueur et adversaires (`stable.racePerf` → `terrainPerf` → `gear.apply` pour le joueur).
- Chevaux 3D : `08-horse3d.js`, anatomie en surfaces implicites maillées au chargement (surface nets), vertex `ao`/`rid`. En course, de dos : images peintes (`LIVERY.gallop`) ; de côté : modèle 3D.
- Village : peinture 2D (`assets/village/estate.webp`), carte de clic, halos par bâtiment, calque d'animation canvas (`02-village.js` + `24-village-life.js`).

## Règles de travail
- Toute amélioration visuelle se vérifie sur captures réelles (Playwright + Chromium, 1280×800 et 390×844) avant d'être annoncée.
- Les changements d'équilibrage se vérifient avec le bot (taux de victoire attendu d'un bon joueur à la distance idéale ≈ 35–75 %).
- Aucun contenu factice visible par le joueur (boutons « bientôt », faux chiffres).
- Messages de commit en français, préfixés par la version (`v0.12 : …`).

## Feuille de route
Voir `README.md` et le document d'avancement du projet. Prochaine grande étape : comptes + sauvegarde cloud, économie validée côté serveur (rejouer la course à partir de la graine), courses « fantômes » asynchrones, emballage stores (Capacitor) et achats intégrés.
