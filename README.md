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
`01-core` état et utilitaires · `02-village` carte, halo, vie ambiante · `03-panels` panneaux · `04-race-state` état de course + générateur aléatoire à graine · `05-race-scene` décor 3D, stalles, départ · `06-livery` robes et casaques · `07-stable` chevaux, stats, entraînement, sauvegarde · `08-horse3d` cheval + jockey 3D · `09-race-fx` rendu réaliste · `10-race` simulation de course · `11-studio` atelier du champion · `12-stable-ui` écurie et engagements · `13-settings` réglages et qualité graphique · `14-career` ligues, programme, missions, événement · `15-sound` son synthétisé et speaker · `16-tutorial` conseils de l’entraîneur · `17-meta` coffres, séries, récompense quotidienne, bouton COURIR · `18-season` Route des étoiles · `19-breeding` élevage au Haras · `20-rival` le Comte de Valmont · `21-gear` sellerie (équipement) · `22-tournament` Tournoi royal du jour · `23-palmares` succès et vitrine.

### Commandes en course
Bouton **PARTEZ !** (ou `F`) au GO · flèches / boutons ◀ ▶ pour la position · **SPRINT** (ou espace) : un seul sprint final, à lancer quand le bouton passe au vert · `A` / `E` pour regarder sur les côtés.

## Simulation
La course est **déterministe** : avec la même graine (tirée à la création du plateau) et les mêmes actions du joueur, le résultat est identique. C’est ce qui permettra au serveur de revérifier les courses (étape 3).
Voir `claude/the-royal-race-systeme-ecurie.md` (projet) pour les formules.
