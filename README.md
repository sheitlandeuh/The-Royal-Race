# The Royal Race

Jeu de courses hippiques pour navigateur (PC et mobile) : domaine équestre, écurie, entraînement, courses en 3D.

**Version 2.0** — le domaine prend vie (bâtiments à niveaux aux effets réels), ventes aux enchères, retraite et Légendes, duels entre amis par lien, campagne « La Couronne » contre le Comte de Valmont, et un équilibrage des courses entièrement remesuré. Détails plus bas.

## Jouer

En ligne (une fois GitHub Pages activé sur le dépôt : Settings → Pages → *Deploy from a branch*, `main`, dossier `/`) : https://sheitlandeuh.github.io/The-Royal-Race/

Ouvrir `index.html` via un petit serveur local (les navigateurs bloquent certains fichiers en `file://`) :

```sh
npm start          # construit puis sert sur http://localhost:8000
```

Tout est inclus : aucune connexion Internet n’est nécessaire (Three.js est embarqué dans `assets/vendor/`).

## Développer

Le code source est dans `src/`. **Ne pas modifier `index.html` à la main** : il est généré.

```sh
npm run check      # vérifie la syntaxe de chaque module
npm run build      # src/ -> index.html
python3 tools/build.py   # idem, sans Node
```

Tests automatiques, dans la console du jeu servi en local : `await import('./tools/tests.js').then(m => m.run())` (rejeu identique, falsification détectée, équilibrage des tactiques et des temps forts, déblocages, défi identique pour tous, effets du domaine, duel vérifié et triche refusée, chapitre de la Couronne, catalogue des ventes, modules chargés, aucun texte factice).

Test de fumée (Playwright) : `python3 -m http.server 8765` puis `node tools/smoke.cjs` — charge le jeu avec six sauvegardes types (neuve, débutant, une course, confirmé, fin de partie, sauvegarde abîmée) et ouvre tous les écrans ; échoue à la moindre erreur JavaScript, à un module en échec ou à un texte cassé. `--shots dossier` produit les captures en 1280×800 et 390×844.

| Dossier | Contenu |
|---|---|
| `src/index.html` | structure HTML (écrans, HUD) |
| `src/css/` | styles, assemblés dans l’ordre des numéros |
| `src/js/` | modules du jeu, exécutés dans l’ordre des numéros |
| `assets/` | fichiers livrés avec le jeu (≈ 4 Mo) |
| `assets-src/` | images originales en haute définition (non livrées) |
| `tools/` | build + scripts de génération des images (détourage du village, halos, masques des casaques) |

### Modules JS
`01-core` état et utilitaires · `02-village` carte, halo, vie ambiante · `03-panels` panneaux · `04-race-state` état de course + générateur aléatoire à graine · `05-race-scene` décor 3D, stalles, départ · `06-livery` robes et casaques · `07-stable` chevaux, stats, entraînement, sauvegarde · `08-horse3d` cheval + jockey 3D sculptés (surfaces implicites maillées au chargement) · `09-race-fx` rendu réaliste · `10-race` simulation de course · `11-studio` atelier du champion · `12-stable-ui` écurie et engagements · `13-settings` réglages et qualité graphique · `14-career` ligues, programme, missions, événement · `15-sound` son synthétisé et speaker · `16-tutorial` conseils de l’entraîneur · `17-meta` coffres, séries, récompense quotidienne, bouton COURIR · `18-season` Route des étoiles · `19-breeding` élevage au Haras · `20-rival` le Comte de Valmont · `21-gear` sellerie (équipement) · `22-tournament` Tournoi royal du jour · `23-palmares` succès et vitrine · `24-village-life` chevaux au galop sur la piste du village (images rendues depuis le modèle 3D) · `25-shop` boutique royale (gemmes gagnées en jeu) · `26-release` sauvegarde fiable, secours, export/import, erreurs, hors ligne (PWA) · `27-moments` temps forts de course (décisions en 4 s) et bouton RECOURIR · `28-pace` tactiques adverses et rythme de course · `29-ambiance` météo et lumière des courses · `30-photo` mini-carte des partants et arrivée serrée au ralenti · `31-heure` lumière du domaine selon l’heure · `32-village-gl` rendu WebGL2 du domaine (netteté UHD, eau, vent, moulin, lumière du jour et de la nuit) · `33-village-vie` réverbères, lucioles, papillons, fontaine, montgolfière, saisons. · `34-playtest` enregistreur de session de test (`?test=Prénom`) · `35-onboarding` déblocages progressifs et objectif suivant. · `36-replay` enregistrement et rejeu vérifié de chaque course (base des courses fantômes et de l’anti-triche). · `37-defi` Défi du jour (même course pour tous, fantôme de son meilleur essai). · `38-partage` carte image du record du défi, partagée par le téléphone. · `39-pause` pause automatique (arrière-plan) ou manuelle, manette · `40-musique` musique de course adaptative. · `41-tele` replay télévisé de la dernière course (caméra de bord de piste, ×2, passer) · `42-installer` installation du jeu sur l’écran d’accueil. · `43-speaker` commentaire du speaker aux points clés et leçon de rythme à l’arrivée. · `44-jockeys` jockeys à recruter, choisis avant chaque course, qui progressent en montant. · `45-domaine` bâtiments à niveaux, ouvriers, travaux en temps réel, récoltes (moulin, Salle des trophées) · `46-ventes` ventes aux enchères quotidiennes · `47-legendes` retraite, Légendes, galerie de la Salle des trophées · `48-duel` duels entre amis par lien (fantôme, vérification par rejeu) · `49-couronne` campagne en six Grands Prix contre Valmont · `50-nouveautes` écran « Quoi de neuf » de la V2.

**Chargement** : chaque module est rangé dans une balise `<script type="text/x-module">` ; un petit chargeur les exécute tous, dans l’ordre, au sein d’une seule tâche. Une erreur dans un module n’empêche plus les suivants de démarrer (`window.__modulesKo` les liste) et l’événement `ready` part quand tout est chargé.

### Commandes en course
Bouton **PARTEZ !** (ou `F`) au GO · flèches / boutons ◀ ▶ pour la position · **SPRINT** (ou espace) : un seul sprint final, à lancer quand le bouton passe au vert · `A` / `E` pour regarder sur les côtés. · **Pause** : bouton ⏸, `Échap` ou `P` (automatique si le jeu passe en arrière-plan : appel, notification, autre appli) ; reprise après 3-2-1.

**Replay** : après l’arrivée, **REVOIR LA COURSE** rejoue toute la course vue de côté, comme à la télévision (chevaux 3D, ×2, PASSER). Le replay est exactement la course courue (rejeu déterministe) et n’a aucun effet sur la partie.

**Installer le jeu** : proposé une fois, au retour de la 3e course, puis dans Réglages (Android / Chrome : installation système ; iPhone : marche à suivre Safari).

**Manette** : A = partir / sprint / valider · croix ou stick gauche = se décaler · X / Y = choix des temps forts · LB / RB = regarder · Start = pause.

**Temps forts** : jusqu’à 3 fois par course, une décision surgit et laisse 4 secondes (boutons, ou touches `1` / `2`). Sans réponse, le choix de droite s’applique.
- *Il tire sur les rênes* : le reprendre (économise l’énergie, perd un peu de vitesse) ou le laisser aller (plus vite, mais cher en énergie — surtout sur 1 200 m).
- *Brèche / ouverture* : quand tu es enfermé ou à l’extérieur ; la chance de passer dépend de l’Intelligence du cheval (affichée).
- *Un adversaire attaque de loin* : le suivre ou le laisser s’user ; la carte montre ton énergie et une estimation de la sienne.
Le bilan de course détaille chaque temps fort et les places gagnées ou perdues.

**Rythme de course** : la tactique de chaque adversaire est affichée avant le départ. Seul en tête, un cheval « aux avant-postes » s’économise ; à deux ou plus, ils se disputent la tête et s’usent. En résumé : course lente → mener ; un seul animateur → le suivre « dans les dos » ; course rapide → attentiste.

**Ambiances** : terrain souple = ciel couvert, terrain lourd = pluie, Critérium et Derby au coucher du soleil (et toutes les courses en terrain bon le soir). Le domaine suit l’heure réelle : matin, jour, soir, nuit.

**Le domaine vivant** : rendu WebGL net à tous les niveaux de zoom, arbres qui bougent au vent, rivières et cascade qui coulent, ailes du moulin qui tournent, ombres de nuages, fenêtres et réverbères allumés la nuit, lucioles, chevaux en liberté dans les prés, cavaliers en carrière, carrosse royal dans l’allée, montgolfière de temps en temps, et une saison qui suit le calendrier (feuilles mortes, neige, pétales, pollen). En qualité « basse », le jeu garde l’image simple.

## Jockeys
Débloqués après 4 courses. Choisis dans l’écran des courses, ils modifient les paramètres de course du joueur (appliqués avant l’enregistrement du rejeu) :

| Jockey | Spécialité | Effet (niveau 0) | Prix |
|---|---|---|---|
| Paul Garnier | Polyvalent | aucun | offert |
| Léa Martin | Départ éclair | fenêtre de réaction +40 ms | 5 000 or |
| Hugo Bernard | Finisseur | sprint +4 % | 8 000 or |
| Inès Dubois | Tacticienne | sillage +25 %, moins gênée enfermée | 8 000 or |
| Victor Laurent | Économe | énergie −4 % | 10 000 or, ligue Argent |
| Chloé Moreau | Sprint long | coût du sprint −3 % | 12 000 or, ligue Argent |

Un niveau toutes les 5 courses montées (niveau 5 au plus), +15 % d’effet par niveau. Mesuré au bot en v0.16 (1 600 m, 30 courses) : 0 à 0,15 place gagnée en moyenne par rapport au jockey maison, selon la course.

## Défi du jour
Chaque jour (changement à minuit UTC), une course identique pour tous les joueurs : même graine, même plateau. On la retente gratuitement, sans fatigue ni trophées ; le meilleur essai du jour court à côté de soi en cheval fantôme, et un bandeau indique l’écart en mètres. Récompenses : un coffre d’argent à la première arrivée du jour, 3 gemmes par record battu (3 fois par jour au plus). Débloqué après 3 courses. Après un essai, **PARTAGER MON TEMPS** génère une carte image (casaque, temps, « Tu fais mieux ? », adresse du jeu) envoyée par le partage natif du téléphone, ou téléchargée sur PC.

## Premières minutes
Un nouveau joueur ne voit que le domaine et la course. Les systèmes s’ouvrent au fil des courses terminées : coffres et missions (1), écurie et travaux du domaine (2), ligues, Route des étoiles et Défi du jour (3), jockeys et La Couronne (4), tournoi et palmarès (5), ventes aux enchères (6), boutique et sellerie (7). Un objectif est toujours affiché au-dessus du bouton COURIR. La toute première course ne propose qu’un temps fort, expliqué.

## Simulation
La course est **déterministe** : avec la même graine (tirée à la création du plateau) et les mêmes actions du joueur, le résultat est identique. C’est ce qui permettra au serveur de revérifier les courses (étape 3).
Voir `claude/the-royal-race-systeme-ecurie.md` (projet) pour les formules.

## Nouveautés de la V2

### Le domaine
Chaque bâtiment monte du niveau 1 au niveau 5 (la Salle des trophées de 0 à 3), contre de l’or et un temps de travaux réel (3 min à 6 h), avec 2 ouvriers (3 avec le Haras niveau 4). Les travaux avancent jeu fermé ; on peut les terminer en gemmes (1 💎 par tranche de 6 minutes). Les bâtiments peuvent dépasser le Haras d’un niveau au plus ; ses niveaux 3, 4 et 5 demandent les ligues Argent, Or et Royale.

| Bâtiment | Effet par niveau |
|---|---|
| Haras Royal | niveau maximal des autres, poulains : potentiel +1,5, naissance −12 %, 3e ouvrier au niveau 4 |
| Hippodrome | allocations des courses +6 % |
| Écurie | une place de plus (6 à 10 chevaux) |
| Carrière | gains d’entraînement +5 % |
| Paddocks | récupération de la fatigue +20 %, repos au pré plus efficace |
| Clinique | soins −12 %, risque et durée des blessures −12 %, estimation vétérinaire plus fine aux ventes |
| Moulin | 120 → 700 fourrages par heure (réserve : 10 h) |
| Salle des trophées (chantier) | 90 → 320 or de visiteurs par heure, +20 par Légende exposée (3 / 6 / 10 places) |

Formules : `DOMAIN_FX` dans `01-core` (niveaux lus dès le démarrage : la récupération hors ligne en dépend).

### Ventes aux enchères
Chaque jour, par ligue, quatre lots : un yearling, un cheval prêt à courir, un spécialiste (1 200 ou 2 400 m) et un lot vedette. Le potentiel est donné en fourchette par la visite vétérinaire. L’enchère se joue en direct (« Une fois… deux fois… adjugé ! ») contre le Comte de Valmont, la Marquise de Sercey et Lord Ashby, qui connaissent la vraie valeur ; leurs plafonds sont tirés de la graine du jour.

### Retraite et Légendes
Après 10 courses (ou au niveau 12), un cheval peut prendre sa retraite depuis l’écurie : il libère sa place, devient une Légende (palmarès et titre), reste reproducteur au Haras (potentiel du poulain +2) et s’expose dans la Salle des trophées.

### Duels entre amis
Après une course, **DÉFIER UN AMI** crée un lien (≈ 1,7 Ko, enregistrement complet compressé, sans serveur). L’ami court la même course avec son cheval contre un fantôme aux couleurs de son ami. La course de l’ami est d’abord refaite pas à pas (`replays.verify`) : un temps truqué est refusé, et c’est ce rejeu qui trace le fantôme. Les données reçues sont contrôlées (tailles, nombres, couleurs, motifs, nom de course reconstruit). `DUEL_V` change si la simulation change.

### La Couronne
Six Grands Prix contre le Comte de Valmont, chacun avec un objectif (finir devant Black Majesty, podium, victoire) : Prix du Comte, Poule d’Essai, Prix de l’Orage, Jockey-Club, Sprint des Rois, Grand Prix de la Couronne. Récompenses : or, gemmes, coffre, motifs de casaque exclusifs (Écharpe, Éclair, Damier, Couronne) et, en finale, Couronne d’Or. Mesuré au bot : ≈ 70 % de réussite au premier chapitre, ≈ 20 % en finale avec un cheval de 2 000 m.

### Équilibrage remesuré
Mesures au bot (plateau identique, 40 à 60 courses) : +10 en Vitesse ou Accélération ≈ une place, Endurance ≈ une demi-place, Départ / Intelligence / Tempérament presque rien pour le bot (le Départ compte pour un joueur humain). La note d’un cheval est maintenant pondérée ainsi (Vitesse 32 %, Accélération 26 %, Endurance 18 %, Départ 10 %, Intelligence 8 %, Tempérament 6 %) : comme les plateaux sont calés sur la note, une note qui surestime une qualité inutile rendait les courses plus dures sans rendre le cheval plus fort. Talents rapprochés (écart ≈ 0,5 place au lieu de 1,4), pénalité de distance symétrisée, plateaux à +3 points de note (`FIELD_EDGE`), temps forts fonction de la distance. Résultat : Éclair de Lune 42 % de victoires à 1 600 m, Belle Étoile 30 % sur le Prix de la Forêt (avant : 48 % et 12 %).
