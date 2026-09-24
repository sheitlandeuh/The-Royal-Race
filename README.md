# The Royal Race

Jeu de courses hippiques pour navigateur (PC et mobile) : domaine équestre, écurie, entraînement, courses en 3D.

## Jouer

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

| Dossier | Contenu |
|---|---|
| `src/index.html` | structure HTML (écrans, HUD) |
| `src/css/` | styles, assemblés dans l’ordre des numéros |
| `src/js/` | modules du jeu, exécutés dans l’ordre des numéros |
| `assets/` | fichiers livrés avec le jeu (≈ 4 Mo) |
| `assets-src/` | images originales en haute définition (non livrées) |
| `tools/` | build + scripts de génération des images (détourage du village, halos, masques des casaques) |

### Modules JS
`01-core` état et utilitaires · `02-village` carte, halo, vie ambiante · `03-panels` panneaux · `04-race-state` état de course + générateur aléatoire à graine · `05-race-scene` décor 3D, stalles, départ · `06-livery` robes et casaques · `07-stable` chevaux, stats, entraînement, sauvegarde · `08-horse3d` cheval + jockey 3D sculptés (surfaces implicites maillées au chargement) · `09-race-fx` rendu réaliste · `10-race` simulation de course · `11-studio` atelier du champion · `12-stable-ui` écurie et engagements · `13-settings` réglages et qualité graphique · `14-career` ligues, programme, missions, événement · `15-sound` son synthétisé et speaker · `16-tutorial` conseils de l’entraîneur · `17-meta` coffres, séries, récompense quotidienne, bouton COURIR · `18-season` Route des étoiles · `19-breeding` élevage au Haras · `20-rival` le Comte de Valmont · `21-gear` sellerie (équipement) · `22-tournament` Tournoi royal du jour · `23-palmares` succès et vitrine · `24-village-life` chevaux au galop sur la piste du village (images rendues depuis le modèle 3D) · `25-shop` boutique royale (gemmes gagnées en jeu) · `26-release` sauvegarde fiable, secours, export/import, erreurs, hors ligne (PWA) · `27-moments` temps forts de course (décisions en 4 s) et bouton RECOURIR · `28-pace` tactiques adverses et rythme de course · `29-ambiance` météo et lumière des courses · `30-photo` mini-carte des partants et arrivée serrée au ralenti · `31-heure` lumière du domaine selon l’heure · `32-village-gl` rendu WebGL2 du domaine (netteté UHD, eau, vent, moulin, lumière du jour et de la nuit) · `33-village-vie` réverbères, lucioles, papillons, fontaine, montgolfière, saisons. · `34-playtest` enregistreur de session de test (`?test=Prénom`) · `35-onboarding` déblocages progressifs et objectif suivant. · `36-replay` enregistrement et rejeu vérifié de chaque course (base des courses fantômes et de l’anti-triche).

### Commandes en course
Bouton **PARTEZ !** (ou `F`) au GO · flèches / boutons ◀ ▶ pour la position · **SPRINT** (ou espace) : un seul sprint final, à lancer quand le bouton passe au vert · `A` / `E` pour regarder sur les côtés.

**Temps forts** : jusqu’à 3 fois par course, une décision surgit et laisse 4 secondes (boutons, ou touches `1` / `2`). Sans réponse, le choix de droite s’applique.
- *Il tire sur les rênes* : le reprendre (économise l’énergie, perd un peu de vitesse) ou le laisser aller (plus vite, mais cher en énergie — surtout sur 1 200 m).
- *Brèche / ouverture* : quand tu es enfermé ou à l’extérieur ; la chance de passer dépend de l’Intelligence du cheval (affichée).
- *Un adversaire attaque de loin* : le suivre ou le laisser s’user ; la carte montre ton énergie et une estimation de la sienne.
Le bilan de course détaille chaque temps fort et les places gagnées ou perdues.

**Rythme de course** : la tactique de chaque adversaire est affichée avant le départ. Seul en tête, un cheval « aux avant-postes » s’économise ; à deux ou plus, ils se disputent la tête et s’usent. En résumé : course lente → mener ; un seul animateur → le suivre « dans les dos » ; course rapide → attentiste.

**Ambiances** : terrain souple = ciel couvert, terrain lourd = pluie, Critérium et Derby au coucher du soleil (et toutes les courses en terrain bon le soir). Le domaine suit l’heure réelle : matin, jour, soir, nuit.

**Le domaine vivant** : rendu WebGL net à tous les niveaux de zoom, arbres qui bougent au vent, rivières et cascade qui coulent, ailes du moulin qui tournent, ombres de nuages, fenêtres et réverbères allumés la nuit, lucioles, chevaux en liberté dans les prés, cavaliers en carrière, carrosse royal dans l’allée, montgolfière de temps en temps, et une saison qui suit le calendrier (feuilles mortes, neige, pétales, pollen). En qualité « basse », le jeu garde l’image simple.

## Premières minutes
Un nouveau joueur ne voit que le domaine et la course. Les systèmes s’ouvrent au fil des courses terminées : coffres et missions (1), écurie (2), ligues et Route des étoiles (3), tournoi et palmarès (5), boutique et sellerie (7). Un objectif est toujours affiché au-dessus du bouton COURIR. La toute première course ne propose qu’un temps fort, expliqué.

## Simulation
La course est **déterministe** : avec la même graine (tirée à la création du plateau) et les mêmes actions du joueur, le résultat est identique. C’est ce qui permettra au serveur de revérifier les courses (étape 3).
Voir `claude/the-royal-race-systeme-ecurie.md` (projet) pour les formules.
