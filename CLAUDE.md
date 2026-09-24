# The Royal Race — guide pour Claude Code

Jeu de courses hippiques (PC / mobile, navigateur), en français. Remplace l'ancien projet Turf Royal (abandonné).
Propriétaire : Enzo. Échanges et textes du jeu en français.

## Commandes
- `npm run build` : assemble `src/` en un seul `index.html` jouable (CSS et JS insérés, dans l'ordre alphabétique des fichiers).
- `npm run check` : vérifie seulement la syntaxe de chaque module et du bundle.
- `npm start` : build puis serveur local sur http://localhost:8000
- Sans Node : `python3 tools/build.py` (même résultat que `npm run build`, sans la vérification de syntaxe) puis `python3 -m http.server 8000`.
- `node tools/balance-test.cjs` : bot Playwright qui court des dizaines de courses (équilibrage).
- Sans installation : `tools/balance-bot.js`, à charger dans la console du jeu (`await import('./tools/balance-bot.js')`, puis `await bot.run([...])` ou `await bot.pair('attaque','m2')`). Il couvre aussi les temps forts.
- Ne jamais modifier `index.html` à la main : il est régénéré. On modifie `src/`, puis on build.

## Architecture
- Pas de framework, pas de bundler, pas de dépendance d'exécution. Three.js r160 (build global) dans `assets/vendor/three.min.js`.
- Événements (`hooks` dans `01-core`) : le moteur émet `field:built`, `courses:render`, `race:start`, `race:header`, `race:go`, `race:launch`, `race:tick`, `race:sprint`, `race:end`, `race:leave`, `tip`. Un nouveau module s'y abonne (`hooks.on`) au lieu de remplacer une fonction du moteur.
- `src/js/NN-nom.js` : modules en IIFE qui exposent un objet global (`stable`, `career`, `meta`, `season`, `breeding`, `rival`, `gear`, `tour`, `palmares`, `shop`, `HORSE3D`, `raceFX`, `villageLife`…). L'ordre des fichiers = l'ordre d'exécution : un module ne peut appeler un module plus loin qu'au moment de l'exécution (événements, rAF), jamais au chargement (zone morte temporelle des `const`).
- Sauvegarde : `localStorage` — `trr.stable` (chevaux, casaque, ressources), `trr.progress` (carrière et tous les systèmes méta), `trr.settings`, `trr.champion`, copie de secours `trr.bak`. `sync()` enregistre automatiquement les ressources.
- Course : simulation déterministe à graine (`raceRng`, `seeded`), une étape toutes les 100 ms ; rendu Three.js séparé (`05-race-scene`, `09-race-fx`, `10-race`). Même formule de performance pour joueur et adversaires (`stable.racePerf` → `terrainPerf` → `gear.apply` pour le joueur). Temps forts (`27-moments`) : programme tiré sur un flux dérivé de la graine, effets dans `MOMENT_FX`, choix du joueur consignés au pas près (`moments.log`) pour pouvoir rejouer la course côté serveur. Rythme (`28-pace`) : tactique de chaque adversaire tirée à la création du plateau (graine), effets par rythme dans `PACE_FX`. Ambiances (`29-ambiance`, table `AMBIANCES`) : lumière, ciel, brouillard, pluie selon le terrain et l'heure. `30-photo` : mini-carte et arrivée serrée au ralenti (seul l'intervalle change, pas le nombre de pas). `31-heure` : lumière du village selon l'heure réelle (`?heure=nuit` pour tester).
- Chevaux 3D : `08-horse3d.js`, anatomie en surfaces implicites maillées au chargement (surface nets), vertex `ao`/`rid`. En course, de dos : images peintes (`LIVERY.gallop`) ; de côté : modèle 3D.
- Village : peinture 2D (`assets/village/estate.webp`), carte de clic, halos par bâtiment, calque d'animation canvas (`02-village.js` + `24-village-life.js`).
- Village en rendu WebGL2 (`32-village-gl.js`) : un shader plein écran redessine la peinture à la résolution de l'écran (Catmull-Rom + netteté + grain au fort zoom) et l'anime (vent dans les arbres, eau, ailes du moulin, nuages, rais de soleil, lumière matin/jour/soir/nuit, fenêtres éclairées). Masques calculés au chargement depuis les couleurs (R végétation, G eau, B lumières). L'image `<img class=map-base>` et les calques CSS restent le repli (qualité « basse », pas de WebGL2, contexte perdu) : classe `gl-on` sur `#world`. Caméra lue via `village.view`.
- Vie du domaine : `24-village-life` (chevaux de course sur la piste, cavaliers en carrière, chevaux en liberté dans les prés, carrosse royal dans l'allée — images rendues depuis le modèle 3D) et `33-village-vie` (réverbères, lucioles, papillons, fontaine, montgolfière, particules de saison selon la date réelle).
- Vérifier sur capture sans attendre : `?heure=nuit|soir|matin|jour`, `?saison=hiver|printemps|ete|automne`, `villageGL.snap(t,'nuit')`, `villageVie.snap(ms)`, `villageGL.off=true` (comparaison avant/après). Le panneau du navigateur intégré, masqué, ne fait pas tourner `requestAnimationFrame` : forcer les images avec ces fonctions.

## Règles de travail
- Toute amélioration visuelle se vérifie sur captures réelles (Playwright + Chromium, 1280×800 et 390×844) avant d'être annoncée.
- Les changements d'équilibrage se vérifient avec le bot (taux de victoire attendu d'un bon joueur à la distance idéale ≈ 35–75 %). Un temps fort doit rester un vrai choix : aucune réponse ne doit être toujours la meilleure (`bot.pair`), et la politique `bot.smart` doit battre « toujours non » et « toujours oui ». Tactiques : `bot.tactics('m2')` — la tactique choisie en lisant le plateau (« lecture ») doit battre chaque tactique fixe. Pour ces tests, simuler un joueur confirmé (`career.data.stats.races=10`), sinon le plateau débutant fausse tout.
- Aucun contenu factice visible par le joueur (boutons « bientôt », faux chiffres).
- Messages de commit en français, préfixés par la version (`v0.15 : …`).

## Feuille de route
Voir `docs/VISION.md` (promesse, piliers, priorités), `docs/PLAYTEST.md` et `README.md`. Prochaine grande étape : comptes + sauvegarde cloud, économie validée côté serveur (rejouer la course à partir de la graine), courses « fantômes » asynchrones, emballage stores (Capacitor) et achats intégrés.
