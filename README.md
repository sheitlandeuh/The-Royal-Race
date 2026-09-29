# The Royal Race

Jeu de courses hippiques pour navigateur (PC et mobile) : domaine équestre, écurie, entraînement, courses en 3D.

**Version 2.4** — des courses sans interruption (plus de conseils ni de temps forts à choisir en pleine course), des déplacements gauche / droite fluides (le cheval s'oriente et s'incline en changeant de couloir), des chevaux et jockeys plus réalistes (robe lustrée qui reflète le ciel, relief musculaire, soie satinée), un hippodrome plus lumineux et un domaine plus détaillé. Détails dans « Nouveautés de la 2.4 ».

**Version 2.3** — des courses pensées pour le multijoueur : départ commun sans bouton (les stalles s'ouvrent pour tous au GO), plus de pause, des chevaux solides qui ne se traversent plus (on double par le côté), le nom et la place de chaque partant au-dessus de lui avec un classement en direct, et une interface repensée façon jeu vidéo (nouvelles polices, néons, HUD). Détails dans « Nouveautés de la 2.3 ».

**Version 2.2** — courses de haies (un choix d'élan avant chaque obstacle), un moteur de course où le Départ, l'Intelligence et le Tempérament comptent enfin, la Nocturne sous les projecteurs, tes chevaux dans les prés du domaine, des décors à acheter pour l'embellir, des allures réalistes (pas, trot) et un affichage adapté aux téléphones en paysage et aux tablettes. Détails dans « Nouveautés de la 2.2 ».

**Version 2.1** — tout passe en vraie 3D : le domaine (bâtiments, chevaux qui broutent et galopent, rivière, forêt, lumière selon l'heure), l'hippodrome (tribunes et foule animée, écran du classement, collines, château) et de nouveaux chevaux et jockeys articulés. Détails dans « Nouveautés de la 2.1 ».

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

Tests automatiques, dans la console du jeu servi en local : `await import('./tools/tests.js').then(m => m.run())` (rejeu identique, falsification détectée, équilibrage des tactiques, course sans interruption, déblocages, défi identique pour tous, effets du domaine, duel vérifié et triche refusée, chapitre de la Couronne, catalogue des ventes, modules chargés, journal des erreurs, écuries rivales, aucun texte factice). En ligne de commande (Playwright) : `node tools/run-tests.cjs --quick`.

**Intégration continue** (`.github/workflows/verifications.yml`) : à chaque envoi sur `main` ou une branche `claude/…`, GitHub Actions vérifie que `index.html` est bien régénéré depuis `src/`, la syntaxe, lance les tests rapides puis le test de fumée en 1280×800 et 390×844 (`MOBILE=1`).

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
`01-core` état et utilitaires · `02-village` carte, halo, vie ambiante · `03-panels` panneaux · `04-race-state` état de course + générateur aléatoire à graine · `05-race-scene` décor 3D, stalles, départ · `06-livery` robes et casaques · `07-stable` chevaux, stats, entraînement, sauvegarde · `08-horse3d` cheval + jockey 3D articulés (surfaces implicites maillées dans un Worker, squelette de 18 os, trois niveaux de détail) · `09-race-fx` rendu réaliste · `09-race-world` monde 3D autour de la piste (tribunes, foule, arbres, collines, château, écran du classement, projecteurs) · `10-haies` courses de haies (choix d'élan, fautes, carte PRUDENT / À FOND) · `10-race` simulation de course · `11-studio` atelier du champion · `12-stable-ui` écurie et engagements · `13-settings` réglages et qualité graphique · `14-career` ligues, programme, missions, événement · `15-sound` son synthétisé et speaker · `16-tutorial` conseils de l’entraîneur · `17-meta` coffres, séries, récompense quotidienne, bouton COURIR · `18-season` Route des étoiles · `19-breeding` élevage au Haras · `20-rival` le Comte de Valmont · `21-gear` sellerie (équipement) · `22-tournament` Tournoi royal du jour · `23-palmares` succès et vitrine · `24-village-life` chevaux au galop sur la piste du village (images rendues depuis le modèle 3D) · `25-shop` boutique royale (gemmes gagnées en jeu) · `26-release` sauvegarde fiable, secours, export/import, erreurs, hors ligne (PWA) · `27-moments` temps forts de course (décisions en 4 s) et bouton RECOURIR · `28-pace` tactiques adverses et rythme de course · `29-ambiance` météo et lumière des courses · `30-photo` mini-carte des partants et arrivée serrée (effet d’image, sans ralenti) · `31-heure` lumière du domaine selon l’heure · `32-village-gl` rendu WebGL2 du domaine (netteté UHD, eau, vent, moulin, lumière du jour et de la nuit) · `33-village-vie` réverbères, lucioles, papillons, fontaine, montgolfière, saisons. · `34-playtest` enregistreur de session de test (`?test=Prénom`) · `35-onboarding` déblocages progressifs et objectif suivant. · `36-replay` enregistrement et rejeu vérifié de chaque course (base des courses fantômes et de l’anti-triche). · `37-defi` Défi du jour (même course pour tous, fantôme de son meilleur essai). · `38-partage` carte image du record du défi, partagée par le téléphone. · `39-manette` manette (la course n’a plus de pause) · `40-musique` musique de course adaptative. · `41-tele` replay télévisé de la dernière course (caméra de bord de piste, ×2, passer) · `42-installer` installation du jeu sur l’écran d’accueil. · `43-speaker` commentaire du speaker aux points clés et leçon de rythme à l’arrivée. · `44-jockeys` jockeys à recruter, choisis avant chaque course, qui progressent en montant. · `45-domaine` bâtiments à niveaux, ouvriers, travaux en temps réel, récoltes (moulin, Salle des trophées) · `46-ventes` ventes aux enchères quotidiennes · `47-legendes` retraite, Légendes, galerie de la Salle des trophées · `48-duel` duels entre amis par lien (fantôme, vérification par rejeu) · `49-couronne` campagne en six Grands Prix contre Valmont · `50-nouveautes` écran « Quoi de neuf » (une fois par version) · `51-domaine3d` le domaine en vraie 3D (bâtiments, tes chevaux, décors, rivière, forêt, caméra orbitale et clavier ; la peinture reste le repli) · `52-decors` décors du domaine à la Boutique royale · `53-direct` étiquettes au-dessus des chevaux et classement en direct · `54-fluidite` qualité « auto » ajustée aux images par seconde mesurées · `55-mesures` mesures de jeu (entonnoir, économie, fluidité) et rapport de problème · `56-aide` Signaler un problème, Confidentialité, Crédits. Avant tous les autres : `00-journal` (erreurs et mesures gardées sur l'appareil, voir `docs/MESURES.md`). Juste avant l'atelier : `11-ecuries` (écuries rivales et face-à-face).

**Chargement** : chaque module est rangé dans une balise `<script type="text/x-module">` ; un petit chargeur les exécute tous, dans l’ordre, au sein d’une seule tâche. Une erreur dans un module n’empêche plus les suivants de démarrer (`window.__modulesKo` les liste) et l’événement `ready` part quand tout est chargé.

### Commandes en course
Départ automatique : au GO, les stalles s’ouvrent pour tout le monde en même temps (pas de bouton). Flèches / boutons ◀ ▶ : choisir son couloir (le cheval s’y rend s’il a la place ; un trait cyan sur la jauge montre le couloir visé) · **SPRINT** (ou espace) : un seul sprint final, à lancer quand le bouton passe au vert · **Allure** ▲ PRESSER / ▼ RETENIR (↑ / ↓, ou `Z` / `S` ; en course de haies, ↑ / ↓ règlent l'élan et `Z` / `S` l'allure) : retenir économise l'énergie en perdant un peu de vitesse, presser l'inverse ; sans effet pendant le sprint · ↑ / ↓ : élan avant une haie · `A` / `E` pour regarder sur les côtés. **Pas de pause** : comme une course en ligne, elle continue même si le jeu passe en arrière-plan.

**Replay** : après l’arrivée, **REVOIR LA COURSE** rejoue toute la course vue de côté, comme à la télévision (chevaux 3D, ×2, PASSER). Le replay est exactement la course courue (rejeu déterministe) et n’a aucun effet sur la partie.

**Installer le jeu** : proposé une fois, au retour de la 3e course, puis dans Réglages (Android / Chrome : installation système ; iPhone : marche à suivre Safari).

**Manette** : A = sprint / valider · croix ou stick gauche = se décaler · ↑ / ↓ de la croix = élan (haies) · LB / RB = regarder.

**En course, rien ne s’interrompt** (2.4) : ni conseil de l’entraîneur, ni temps fort à choisir. Les décisions se prennent avant (cheval, tactique, jockey, équipement) et pendant par le jeu lui-même : couloir, sillage, moment du sprint, élan sur les haies. 
**Rythme de course** : la tactique de chaque adversaire est affichée avant le départ. Seul en tête, un cheval « aux avant-postes » s’économise ; à deux ou plus, ils se disputent la tête et s’usent. En résumé : course lente → mener ; un seul animateur → le suivre « dans les dos » ; course rapide → attentiste.

**Ambiances** : terrain souple = ciel couvert, terrain lourd = pluie, Critérium et Derby au coucher du soleil (et toutes les courses en terrain bon le soir). Le domaine suit l’heure réelle : matin, jour, soir, nuit.

**Le domaine vivant** : rendu WebGL net à tous les niveaux de zoom, arbres qui bougent au vent, rivières et cascade qui coulent, ailes du moulin qui tournent, ombres de nuages, fenêtres et réverbères allumés la nuit, lucioles, chevaux en liberté dans les prés, cavaliers en carrière, carrosse royal dans l’allée, montgolfière de temps en temps, et une saison qui suit le calendrier (feuilles mortes, neige, pétales, pollen). En qualité « basse », le jeu garde l’image simple.

## Jockeys
Débloqués après 4 courses. Choisis dans l’écran des courses, ils modifient les paramètres de course du joueur (appliqués avant l’enregistrement du rejeu) :

| Jockey | Spécialité | Effet (niveau 0) | Prix |
|---|---|---|---|
| Paul Garnier | Polyvalent | aucun | offert |
| Léa Martin | Départ éclair | élan de départ +2,5 % | 5 000 or |
| Hugo Bernard | Finisseur | sprint +4 % | 8 000 or |
| Inès Dubois | Tacticienne | sillage +25 %, moins gênée enfermée | 8 000 or |
| Victor Laurent | Économe | énergie −4 % | 10 000 or, ligue Argent |
| Chloé Moreau | Sprint long | coût du sprint −3 % | 12 000 or, ligue Argent |

Un niveau toutes les 5 courses montées (niveau 5 au plus), +15 % d’effet par niveau. Mesuré au bot en v0.16 (1 600 m, 30 courses) : 0 à 0,15 place gagnée en moyenne par rapport au jockey maison, selon la course.

## Défi du jour
Chaque jour (changement à minuit UTC), une course identique pour tous les joueurs : même graine, même plateau. On la retente gratuitement, sans fatigue ni trophées ; le meilleur essai du jour court à côté de soi en cheval fantôme, et un bandeau indique l’écart en mètres. Récompenses : un coffre d’argent à la première arrivée du jour, 3 gemmes par record battu (3 fois par jour au plus). Débloqué après 3 courses. Après un essai, **PARTAGER MON TEMPS** génère une carte image (casaque, temps, « Tu fais mieux ? », adresse du jeu) envoyée par le partage natif du téléphone, ou téléchargée sur PC.

## Premières minutes
Un nouveau joueur ne voit que le domaine et la course. Les systèmes s’ouvrent au fil des courses terminées : coffres et missions (1), écurie et travaux du domaine (2), ligues, Route des étoiles et Défi du jour (3), jockeys et La Couronne (4), tournoi et palmarès (5), ventes aux enchères (6), boutique et sellerie (7). Un objectif est toujours affiché au-dessus du bouton COURIR.

## Simulation
La course est **déterministe** : avec la même graine (tirée à la création du plateau) et les mêmes actions du joueur, le résultat est identique. C’est ce qui permettra au serveur de revérifier les courses (étape 3).
Voir `claude/the-royal-race-systeme-ecurie.md` (projet) pour les formules.

## Nouveautés de la 2.4

### Course sans interruption
Plus aucun conseil de Maître Armand, carte de temps fort ni annonce pendant la course (les conseils attendent le retour au domaine). La mission « Gagner 3 places sur des temps forts » devient « Doubler 5 adversaires en course » (chaque nouvelle meilleure place après la sortie des stalles compte). Sans temps forts, le rythme a été remesuré au bot : la tactique lue sur le plateau bat chaque tactique fixe de 1 200 à 2 400 m, 47 % de victoires sur 1 600 m (un seul animateur favorise davantage le cheval qui le suit « dans les dos »).

### Déplacements fluides
L'image montre la course un pas (100 ms) en retard, en interpolant entre les deux derniers états de la simulation : l'avance est continue, sans à-coups. Les couloirs affichés passent par un ressort amorti ; le cheval s'oriente dans le sens du changement de couloir et s'incline légèrement. Mesuré à 60 images/s : à-coups latéraux divisés par ~45, à-coups d'avance par ~100. La caméra, les étiquettes, les fantômes et le replay télévisé suivent le même lissage. Affichage seulement : la simulation n'en dépend pas. Le rythme ayant été rééquilibré, `ENGINE` passe à 4 : un duel 2.3 est refusé poliment (« autre version »).

### Chevaux, jockeys, hippodrome, domaine
Lumière d'environnement (ciel en dégradé + soleil filtrés en carte PMREM, `raceFX.skyEnv`) calée sur l'ambiance de la course et sur l'heure du domaine ; robe lustrée (vernis, reflet de poil, relief musculaire procédural), ganaches et menton, crinière plus fournie ; casaques en soie satinée avec plis ; halo lumineux (bloom HDR) et bandes de tonte sur l'hippodrome ; au domaine, assises de pierre, rangs de tuiles et patine au pied des murs (le détail s'efface au loin pour ne pas scintiller), grain d'herbe de près, vignettage. En qualité basse, ni environnement, ni satin, ni halo.

## Nouveautés de la 2.3

### Moteur de course 3 : une course pensée pour le multijoueur
- **Départ commun** : plus de bouton PARTEZ ni de faux départ. Les stalles s'ouvrent pour les six partants au même instant, à l'heure prévue ; chacun part de la stalle que le tirage (sur la graine de la course) lui a donnée et jaillit selon son Départ (+15 points : de 4,5e à 1,9e à la sortie des stalles).
- **Pas de pause** : la course suit l'horloge (un pas toutes les 100 ms depuis le GO). Si le jeu passe en arrière-plan, elle continue et rattrape les pas manqués au retour. Plus de ralenti en direct à l'arrivée (effet d'image seulement). Les conseils en course s'affichent en bandeau compact, qui se referme seul.
- **Chevaux solides** : mêmes règles pour tous, joueur compris. Chacun vise un couloir et s'y rend (vitesse latérale commune, plus vive pour un cheval intelligent) sans jamais entrer dans un cheval à sa hauteur ; on ne traverse jamais le cheval qui précède dans son couloir : collé derrière lui, on court à son allure (dans son sillage) jusqu'à trouver l'ouverture. Test automatique : aucun chevauchement sur des milliers de pas.
- **Rééquilibrage au bot** : 50 à 55 % de victoires sur 1 600 m avec la tactique lue sur le plateau, qui bat chaque tactique fixe (1 200 à 2 000 m) ; « Le laisser aller » redevient le bon choix sur 1 200 m ; suivre une attaque dépend de la distance et de la voie libre devant soi (indiquée dans le temps fort).
- `ENGINE` passe à 3 : les rejeux et duels d'une version précédente sont refusés poliment.

### Course en direct
Nom et place de chaque partant au-dessus de lui (étiquettes 3D désencombrées), classement en direct avec les écarts en longueurs puis les temps à l'arrivée (PC et tablette). Stalles qui s'ouvrent d'un coup, gerbe de poussière et caméra qui encaisse le départ ; après le poteau, les chevaux se relèvent peu à peu dans leur couloir.

### Nouveau look
Interface « gaming » : polices Russo One (titres), Rajdhani (interface, chiffres) et Exo 2 (textes) embarquées (licence OFL, `assets/fonts`), fond nuit, néons violet et cyan, or royal, coins biseautés, HUD de course repensé (jauge d'endurance segmentée, bouton SPRINT lumineux, compte à rebours et GO).

## Nouveautés de la 2.2

### Moteur de course 2 : chaque qualité compte
Le Départ donne un élan sur les premiers 10 % de la course ; l'Intelligence réduit la perte dans les virages larges, aide à relancer quand le cheval est enfermé, renforce le sillage et fait économiser de l'énergie ; le Tempérament décide si un cheval s'use (nerveux) ou se repose (calme) dans un peloton serré, y compris pendant le sprint. Mesures au bot, +10 points, plateau identique : Départ ≈ 0,2 place, Intelligence ≈ 0,15 à 0,25, Tempérament ≈ 0,1 à 0,2 (avant : rien), Vitesse ≈ 0,6 à 0,9, Accélération ≈ 0,75, Endurance ≈ 0,05 (1 200 m) à 0,5 (2 000 m).
La note servant à caler les plateaux dépend maintenant de la distance (`RATING_D` dans `07-stable`) et `FIELD_EDGE` passe à 0 : Éclair de Lune gagne 47 % à 1 600 m avec la tactique lue sur le plateau, qui bat toujours les tactiques fixes. Les rejeux portent la version du moteur (`ENGINE`) : un duel reçu d'une ancienne version est refusé poliment au lieu d'être pris pour une triche.

### Courses de haies
Prix des Haies (2 000 m, 6 haies, ligue Argent) et Grand Steeple Royal (2 400 m, 8 haies, ligue Or). Avant chaque haie, une carte propose PRUDENT (perd un peu de terrain, presque aucun risque) ou À FOND (gagne du terrain, coûte un peu d'énergie, risque de faute presque doublé) ; sans choix, le saut est normal. Le risque dépend de l'Intelligence, du Tempérament et de la fatigue ; une faute coûte plusieurs longueurs et de l'énergie. Au bot : un cheval adroit gagne à sauter à fond, un cheval maladroit à rester prudent. Clavier : ↑ à fond, ↓ prudent. Haies en 3D (broussaille, ailes rayées), chevaux qui sautent, bilan des sauts à l'arrivée ; les choix sont enregistrés (entrée `jump`) : rejeu, replay télévisé et duels identiques.

### 3D
Allures réalistes (pas en quatre temps, trot en diagonales, galop), cheval qui respire et balance la queue à l'arrêt. Nocturne Royale (nouvelle course) et courses de nuit quand il fait nuit chez le joueur : pylônes de projecteurs, halos, ciel étoilé. Au domaine, les chevaux de ton écurie broutent et se promènent au pré, leur nom au-dessus d'eux (toucher = fiche). Décors à acheter à la Boutique royale (or ou gemmes, purement décoratifs) : allée des lanternes, roseraie, étang aux cygnes, kiosque à musique, statue équestre dorée, obélisque, arc de triomphe.

### Adaptation
Téléphone en paysage : barre de navigation, coffres et icônes compactés. Tablette en portrait : commandes de course qui ne se chevauchent plus. Panneaux toujours au-dessus de la barre de navigation. Domaine 3D au clavier : flèches ou ZQSD / WASD, A / E pour tourner, + / − pour zoomer.

## Nouveautés de la 2.1 : la 3D

### Chevaux et jockeys
Un seul maillage par cheval, sculpté en surfaces implicites (union lisse d'ellipsoïdes et de cônes arrondis) et maillé dans un Worker, pondéré sur 18 os : jambes à trois segments, encolure, tête et queue se plient sans cassure. Crinière posée sur l'encolure, queue en volume, robes avec extrémités noires, pommelures du gris, balzanes et liste tirées du nom (le même cheval garde ses marques partout). Le jockey est articulé : il amortit le galop, pousse au sprint et sort la cravache. Trois niveaux de détail (≈ 80 000, 24 000 et 5 000 triangles) partagés par tous les chevaux ; les pièces de harnachement sont fusionnées par os. API : `HORSE3D.ready(lod)`, `build(livrée, {number, blinkers, lod, free, seed})`, `pose(cheval, phase, allure, poussée, broute)`, `setLod`, `dispose`.

### L'hippodrome
Le décor photo est remplacé par un monde généré : tribunes à gradins avec loge royale, foule qui se lève au passage des chevaux, spectateurs sur la pelouse, feuillus, peupliers et conifères au vent, haies, jardinières, étang, collines en damier de champs et de bois, château, drapeaux, écran géant qui affiche le classement en direct, nuages selon la météo. Les chevaux sont en 3D sous tous les angles (de dos, au rond de présentation, sur le podium) ; les ombres suivent la caméra. La densité (foule, arbres, ombres) suit le réglage de qualité.

### Le domaine
Le plan de la peinture reconstruit en volumes : haras à dôme, hippodrome et sa tribune, carrière, clinique, écurie, chantier puis Salle des trophées (dès qu'elle est construite), moulin aux ailes qui tournent, paddocks, rivière et ponts, fontaine, réverbères, forêt dont le feuillage suit la saison. Les bâtiments gagnent des bannières avec leur niveau. Chevaux 3D : galop sur la piste, cavaliers en carrière, chevaux qui broutent et se promènent au pré. Fenêtres et lanternes allumées le soir et la nuit, fumées de cheminée, oiseaux.
Caméra : glisser pour se déplacer, pincer ou molette pour zoomer, deux doigts ou clic droit pour tourner autour. Toucher un bâtiment ouvre sa fiche, comme sur la peinture. La peinture reste disponible (Réglages → « Domaine en 3D »), et c'est le choix par défaut en qualité basse ou sans WebGL2.
Vérifier sur capture : `domaine3d.snap(ms)` fait avancer la vie du domaine puis dessine (utile quand `requestAnimationFrame` ne tourne pas) ; `domaine3d.view` règle la caméra (`tx`, `tz`, `dist`, `yaw`) ; `?heure=nuit`, `?saison=hiver` fonctionnent aussi en 3D.

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
