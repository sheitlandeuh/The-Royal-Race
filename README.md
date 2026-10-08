# The Royal Race

Jeu de courses hippiques pour navigateur (PC et mobile) : domaine équestre, écurie, entraînement, courses en 3D.

**Version 2.7** — cinq hippodromes au tracé et au décor différents (Royal, Forêt, Côte, Cimes, Capitale), où la forme de la piste compte en course, et une interface du domaine qui ne se chevauche plus sur aucun écran.

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

**Intégration continue** (`.github/workflows/verifications.yml`) : à chaque envoi sur `main` ou une branche `claude/…`, GitHub Actions vérifie que `index.html` est bien régénéré depuis `src/`, la syntaxe, lance les tests rapides, le test de fumée en 1280×800, 390×844 et 320×568 (`MOBILE=1`), puis le contrôle des chevauchements de l'interface (`tools/hud.cjs`).

Test de fumée (Playwright) : `python3 -m http.server 8765` puis `node tools/smoke.cjs` — charge le jeu avec sept sauvegardes types (neuve, débutant, une course, confirmé, fin de partie, noms piégés, sauvegarde abîmée) et ouvre tous les écrans ; échoue à la moindre erreur JavaScript, à un module en échec, à un texte cassé ou trop petit (moins de 10 px), ou si un nom piégé exécute du code. `--shots dossier` produit les captures en 1280×800 et 390×844.

| Dossier | Contenu |
|---|---|
| `src/index.html` | structure HTML (écrans, HUD) |
| `src/css/` | styles, assemblés dans l’ordre des numéros |
| `src/js/` | modules du jeu, exécutés dans l’ordre des numéros |
| `assets/` | fichiers livrés avec le jeu (≈ 3 Mo) |
| `assets-src/` | images originales en haute définition (non livrées) |
| `tools/` | build + scripts de génération des images (détourage du village, halos, masques des casaques) |

### Modules JS
`01-core` état et utilitaires · `02-village` bâtiments, étiquettes et sélection du domaine, écran titre · `03-panels` panneaux · `04-race-state` état de course + générateur aléatoire à graine · `05-race-scene` décor 3D, stalles, départ · `06-livery` robes et casaques · `07-stable` chevaux, stats, entraînement, sauvegarde · `08-horse3d` cheval + jockey 3D articulés (surfaces implicites maillées dans un Worker, squelette de 18 os, trois niveaux de détail) · `09-race-fx` rendu réaliste · `09-race-world` monde 3D autour de la piste (tribunes, foule, arbres, collines, château, écran du classement, projecteurs) · `10-haies` courses de haies (choix d'élan, fautes, carte PRUDENT / À FOND) · `10-race` simulation de course · `11-studio` atelier du champion · `12-stable-ui` écurie et engagements · `13-settings` réglages et qualité graphique · `14-career` ligues, programme, missions, événement · `15-sound` son synthétisé et speaker · `16-tutorial` conseils de l’entraîneur · `17-meta` coffres, séries, récompense quotidienne, bouton COURIR · `18-season` Route des étoiles · `19-breeding` élevage au Haras · `20-rival` le Comte de Valmont · `21-gear` sellerie (équipement) · `22-tournament` Tournoi royal du jour · `23-palmares` succès et vitrine · `25-shop` boutique royale (gemmes gagnées en jeu) · `26-release` sauvegarde fiable, secours, export/import, erreurs, hors ligne (PWA) · `27-moments` temps forts de course (décisions en 4 s) et bouton RECOURIR · `28-pace` tactiques adverses et rythme de course · `29-ambiance` météo et lumière des courses · `30-photo` mini-carte des partants et arrivée serrée (effet d’image, sans ralenti) · `31-heure` heure et saison du domaine (lumière, feuillage) ·· `34-playtest` enregistreur de session de test (`?test=Prénom`) · `35-onboarding` déblocages progressifs et objectif suivant. · `36-replay` enregistrement et rejeu vérifié de chaque course (base des courses fantômes et de l’anti-triche). · `37-defi` Défi du jour (même course pour tous, fantôme de son meilleur essai). · `38-partage` carte image du record du défi, partagée par le téléphone. · `39-manette` manette (la course n’a plus de pause) · `40-musique` musique de course adaptative. · `41-tele` replay télévisé de la dernière course (caméra de bord de piste, ×2, passer) · `42-installer` installation du jeu sur l’écran d’accueil. · `43-speaker` commentaire du speaker aux points clés et leçon de rythme à l’arrivée. · `44-jockeys` jockeys à recruter, choisis avant chaque course, qui progressent en montant. · `45-domaine` bâtiments à niveaux, ouvriers, travaux en temps réel, récoltes (moulin, Salle des trophées) · `46-ventes` ventes aux enchères quotidiennes · `47-legendes` retraite, Légendes, galerie de la Salle des trophées · `48-duel` duels entre amis par lien (fantôme, vérification par rejeu) · `49-couronne` campagne en six Grands Prix contre Valmont · `50-nouveautes` écran « Quoi de neuf » (une fois par version) · `51-domaine3d` le domaine, entièrement en 3D (bâtiments, tes chevaux, décors, rivière, forêt, caméra orbitale et clavier) · `52-decors` décors du domaine à la Boutique royale · `53-direct` étiquettes au-dessus des chevaux et classement en direct · `54-fluidite` qualité « auto » ajustée aux images par seconde mesurées · `55-mesures` mesures de jeu (entonnoir, économie, fluidité) et rapport de problème · `56-aide` Signaler un problème, Confidentialité, Crédits. Avant tous les autres : `00-journal` (erreurs et mesures gardées sur l'appareil, voir `docs/MESURES.md`). Juste avant l'atelier : `11-ecuries` (écuries rivales et face-à-face).

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

## Nouveautés de la 3.0

**Moteur 6 : des courses plus difficiles et moins prévisibles** (`src/js/28-strategie.js`, réglages `STRAT_FX`). Tout est tiré de la graine du plateau : le rejeu, les duels et une future vérification serveur restent exacts. Un enregistrement du moteur 4 ou 5 se refait avec ses propres règles (`raceEng`), et un duel se court au moteur de l'ami qui l'a envoyé.

- **Conditions du jour**, annoncées sur l'écran des courses et rappelées dans l'en-tête de course :
  - **Corde rapide ou lourde** (±0,8 % de vitesse le long de la lice, plus souvent lourde en terrain souple ou lourd). Avec une corde lourde, le bon chemin est à 3 ou 4 couloirs dans les lignes droites, à la corde dans les virages.
  - **Vent dans la ligne d'arrivée.** De face : −1,2 % pour qui court à découvert, sillage ×1,5. Dans le dos : +0,4 %, sillage ×0,6.
- **Rond de présentation.** Un adversaire peut être en forme (±2 %), terne, ou nerveux : il tire sur son jockey, va 2,5 % plus vite sur les premiers 45 % et dépense 45 % d'énergie en plus. Le pronostic en tient compte.
- **Départ manqué.** Il ne se voit qu'à l'ouverture des stalles (−30 % de vitesse sur 0,9 s), y compris pour ton cheval : 2 à 12 % des courses selon son Départ et son calme.
- **Adversaires**, chacun avec un plan :
  - Un animateur accélère en tête pour décramponner le peloton (60 % des animateurs), un cheval « dans les dos » attaque avant la ligne droite (45 %) ; +2,2 % de vitesse, dépense ×1,6.
  - Le jockey fin tacticien (plus souvent sur un cheval intelligent) reste dans le sillage au lieu de déborder le cheval qu'il rattrape. C'était le principal avantage du joueur sur l'IA.
  - Doublé dans la ligne droite, un cheval calme ou « cœur de champion » riposte (+1,4 % pendant 2,2 s).
  - Le sprint final part plus près du bon moment (erreur de jugement ×0,55).
  - Un cheval à l'extérieur du tien peut garder sa ligne et te laisser enfermé.
  - La moitié des jockeys connaît la piste et évite une corde lourde.
- **Annonces** sur la ligne de commentaire, 2,5 s, sans rien par-dessus la course ; le speaker parle des accélérations et des ripostes.

Mesuré au bot : bon joueur, cheval du mile, lecture du plateau et des conditions, `bot.counter`.

| Course | Moteur 5 (2.9) | Moteur 6 (3.0) |
|---|---|---|
| 1 200 m (Prix des Écuries, course d'initiation) | 78 % de victoires | 72 % |
| 1 600 m (distance idéale) | 41 % | 35 à 40 % |
| 2 000 m, terrain souple (hors distance) | 26 % | 15 à 20 % |

Sur 80 courses de 1 600 m :
- corde ou vent particuliers dans 2 courses sur 3 ;
- un ou deux adversaires marqués au rond de présentation par course ;
- 0,6 accélération adverse par course ;
- une riposte dans 3 courses sur 10 ;
- un départ manqué (adversaire ou toi) dans 3 courses sur 10. Lire le plateau reste la meilleure tactique (test « Lecture du plateau ≥ meilleure tactique fixe »). Tests ajoutés :
- « Moteur 6 : conditions, incidents et plans rejoués à l'identique » ;
- « une course du moteur 5 garde ses règles » ;
- « la corde et le vent changent la course ».

## Nouveautés de la 2.9

**Jockey.** Couleurs au pixel (`08-horse3d`) : chaque sommet porte sa distance à chaque groupe de couleur (casaque, manches, culotte, bottes, peau, gants, revers ; `spec.groups` de `SCULPT`, attributs `gA` / `gB`) et le shader prend le groupe le plus proche, fondu sur un pixel : plus de bords « déchirés » qui suivaient les arêtes du maillage. Culotte, revers de botte et botte sont coupés le long de l'axe genou → cheville (revers plus haut devant). Le motif de la casaque est projeté autour du dos (angle autour de l'axe du buste, dérivées prises sur l'angle continu : aucune couture sous la poitrine), image de 384 px gardée par livrée. Visage plus court, nez, pommettes, oreilles (fondu propre à la primitive : `P.k`), jugulaire du casque ; la peau garde des ombres chaudes. Jockey plus fin en course (pas de 0,025 m au lieu de 0,03) et en gros plan (0,011).

**Cheval et harnachement.** Filet en cuir posé sur la tête sculptée (`HORSE_TACK`, calculé dans le Worker : montants derrière l'œil, frontal, têtière, sous-gorge, muserolle, chaque point projeté sur la surface). Œil dans son orbite sous une arcade (creux dans le champ de distance), brun profond. Selle de course moulée sur le dos (coque épaisse : troussequin et pommeau relevés, siège creux) et quartiers de cuir épais aux coins arrondis, glissés sous la selle (`shell`) ; ombres de contact de la selle sur le tapis et du tapis sur la robe. Relief doux de l'épaule, de la hanche et du triceps, robe un peu moins vernie. Cheval plus fin en course (0,035 m au lieu de 0,038).

**Village.** Le bâtiment choisi n'a plus d'anneau : il s'entoure d'un contour doré tracé à l'écran (coque élargie en espace écran, masquée par le pochoir du bâtiment) et s'éclaire en lumière rasante ; la piste, la carrière et les paddocks s'éclairent au sol à leur forme exacte. Les cavaliers de la carrière avancent dans le sens de leur trajectoire (la tangente avait un signe faux). Hippodrome du domaine : tribune derrière la lice extérieure, stalles de départ détaillées garées dans l'enceinte, poteau d'arrivée. Pré de l'écurie déplacé hors de l'allée (un arbre y poussait), chevaux des paddocks loin des abris. Contrôle permanent `domaine3d.croise()` : piste, carrière et prés parcourus à l'échelle du village, aucun cheval ne touche un bâtiment, une lice ou un arbre (test « Village : aucun cheval à travers un bâtiment ou une lice »).

## Nouveautés de la 2.8

**Atelier et portraits en 3D.** L'atelier (`11-studio`) montre le vrai cheval de course (`08-portrait3d` : rendu hors écran, plateau tournant, vues 3/4, profil, galop, casaque, cheval qu'on fait tourner du doigt) ; chaque cheval de l'écurie se personnalise (nom, robe), la casaque et la toque restent celles de l'écurie. Les vignettes (écurie, courses, haras, ventes, Légendes, tournoi) sont rendues en 3D, en buste, et mises en cache ; l'image peinte ne sert plus que sans WebGL.

**Cheval et jockey.** Le jockey a un os pour ses jambes (`JB[7]`) : à l'arrêt il s'assoit dans la selle, buste relevé, et reprend la position de course dès le trot ; cuisses le long du garrot, bottes dans les étriers contre les flancs, par-dessus les quartiers de la selle. Le tapis passe enfin sur le dos (le tube était à l'envers, sous le ventre) et son numéro se lit droit sur les deux flancs. Relief de la robe adouci (plus de taches de reflets en gros plan), ombre du jockey sur le cheval dans l'atelier.

**Podium.** Nouvelle scène (`05-race-scene` : `createPodium`, `podiumTitle`, `podiumFX`, `podiumGarland`) : estrade ronde éclairée, marches de marbre aux médailles, fond courbe aux néons, portique au nom de la course, projecteurs et faisceaux, confettis qui tombent, guirlande de roses au garrot du vainqueur ; chevaux de trois quarts tournés vers le centre ; la caméra avance doucement et se cadre au-dessus de la carte du résultat (portrait comme paysage). Les commandes de course s'effacent pendant la cérémonie (`#raceScreen.podium`) ; le bouton du podium reste visible en bas du classement officiel ; boutons du résultat alignés.

**Coffres.** Coffres dessinés (`chestSVG` : bois cerclé de fer, argent, or, royal à couronne), le même dans les emplacements, la boutique, la saison, le tournoi et La Couronne ; décompte à la seconde (« 46:47 », « 2 h 05 ») avec barre de progression, dans l'emplacement comme dans la fenêtre du coffre ; ouverture en trois temps (secousse, couvercle et éclat de lumière, gains comptés un à un ; toucher le coffre montre tout ; rien d'animé avec « réduire les animations »).

**Domaine et course reliés.** Une seule icône par ressource dans tout le jeu (`01-icones` : les dessins de la barre du haut remplacent partout les émojis 🪙 🌾 💎 🔨 🏆). Depuis l'Hippodrome Royal, le château sur la colline est le haras du joueur (`domaine3d.model('haras')`, à son niveau, fenêtres allumées la nuit) ; les arbres des hippodromes suivent la saison du domaine (automne roux, hiver nu). Ponts du village calculés sur la rivière (`PONTS`), droits sur le courant.

**Corrections.** RECOURIR : la vérification du rejeu de la course précédente attend le retour au domaine (`36-replay`), plus d'écran gris ; aucune fenêtre (déblocage, installation, La Couronne, récompense du jour) ne s'ouvre pendant une course (`enCourse()`).

## Nouveautés de la 2.7

**Cinq hippodromes.** Chaque course a son hippodrome (`src/js/04-hippodromes.js`) : un tracé (longueur des lignes droites, rayon des virages, sens) et un décor 3D (`09-race-world`, thèmes).
| Hippodrome | Tracé | Décor | Coût des virages pour qui court au large |
|---|---|---|---|
| 🏰 Royal | ovale 520 m / rayon 165, main gauche | château, étang, champs (inchangé) | référence (0,318) |
| 🌲 Forêt | 400 / 146, **main droite** | tribunes en bois, sapins et chênes serrés, pavillon de chasse, brume | +21 % |
| 🌊 Côte | 720 / 180, main gauche | plage, mer, phare, cabines, voiliers, pins parasols, dunes | −19 % |
| 🏔️ Cimes | 470 / 156, **main droite** | montagnes enneigées, chalets, lac, sapins | +8 % |
| 🌃 Capitale | 480 / 132, main gauche | tours éclairées la nuit, boulevard, grande tribune de verre | +16 % |

Le tracé compte : `courseTurn` tire la place et la force des virages de la géométrie (l'Hippodrome Royal garde exactement ses valeurs : ses courses et leurs rejeux ne changent pas, moteur 5 compatible avec le moteur 4). Mesuré au bot (1 600 m, joueur confirmé) : un bon joueur gagne 35–50 % sur chaque hippodrome, courir au large coûte davantage en Forêt et à la Capitale, et « lire le plateau » reste la meilleure tactique partout. Sur un hippodrome à main droite, la corde est à droite de l'écran : ◀ ▶ suivent l'écran.
Quatre nouvelles courses (Prix de la Plage dès la ligue Bronze, Prix des Sapins, Grand Prix de la Capitale, Prix du Glacier), les courses existantes réparties sur les hippodromes, le Défi du jour et le Tournoi qui changent d'hippodrome, chaque chapitre de La Couronne sur le sien, un succès « Tour des hippodromes ».

**Interface.** La fiche d'un bâtiment se place au-dessus des coffres et de COURIR (mesurée à chaque changement de taille), l'objectif s'efface le temps qu'elle est ouverte, deux rangées sur téléphone, bouton de fermeture ; la caméra cadre le bâtiment au-dessus de sa fiche ; montants abrégés (2,3 M) ; écran de course corrigé sur tablette en paysage et téléphone en paysage. Nouveau contrôle `tools/hud.cjs` (14 tailles de 320 à 1920 px, intégration continue).

## Nouveautés de la 2.6

Deuxième audit, plus exigeant (`AUDIT.md`), mené en jouant réellement : parcours d'un nouveau joueur sur quatre tailles de téléphone, test d'injection, mémoire graphique, accessibilité.
Corrigé : fuite de mémoire graphique à chaque course (squelettes des chevaux 3D), écran de course illisible sur petits téléphones (plus aucun chevauchement de 320 à 412 px), commentaire écrit par-dessus la course (voix seule en direct), atelier du champion dès l'ouverture, bouton COURIR toujours visible, temps à la française (« 89,55 s »), domaine à 30 images/s au repos, console propre, réglage « réduire les animations » respecté, aucun texte sous 10 px, sauvegarde qui prévient si le stockage est plein.

## Nouveautés de la 2.5

### Domaine entièrement en 3D
Le domaine s'affiche en 3D dès le démarrage, sur tous les appareils (qualité basse comprise) : l'ancienne vue peinte a disparu, avec ses images (−2,3 Mo). L'essentiel (sol, bâtiments) apparaît d'abord, le décor et les chevaux juste après.

### Course
Allure en course (▲ presser / ▼ retenir) réglée au bot, repère de réserve sur la jauge d'endurance, abandon confirmé. Adversaires issus de 12 écuries rivales, face-à-face mémorisé ; plus de cotes chiffrées.

### Solidité et conformité
Qualité automatique selon les images par seconde réellement mesurées, journal local des erreurs et des mesures (`docs/MESURES.md`), rapport de problème, pages Confidentialité et Crédits, inventaire des images (`docs/ASSETS.md`), intégration continue.

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
