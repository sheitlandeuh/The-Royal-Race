# Inventaire des fichiers et de leur provenance

À tenir à jour à chaque ajout. Avant toute vente, chaque ligne doit indiquer **qui a créé le fichier et à quel titre le jeu peut l'utiliser commercialement** (création maison, commande avec cession de droits, banque d'images avec licence, outil d'IA et ses conditions d'utilisation…).

État au 29/09/2026 (version 2.5 : le domaine est désormais entièrement en 3D, la peinture n'est plus livrée).

## 1. Composants tiers (licences connues)

| Fichier | Contenu | Auteur | Licence | Visible dans le jeu |
|---|---|---|---|---|
| `assets/vendor/three.min.js` | Moteur 3D three.js r160 (seule modification : l'avertissement de dépréciation du build global, en tête de fichier, est retiré) | three.js authors | MIT | Réglages → Crédits |
| `assets/fonts/russo-one-400.woff2` | Police Russo One | Jovanny Lemonad | SIL OFL 1.1 | Réglages → Crédits |
| `assets/fonts/rajdhani-*.woff2` | Police Rajdhani | Indian Type Foundry | SIL OFL 1.1 | Réglages → Crédits |
| `assets/fonts/exo-2-*.woff2` | Police Exo 2 | Natanael Gama | SIL OFL 1.1 | Réglages → Crédits |

Textes de licence : en-tête de `three.min.js`, `assets/fonts/OFL.txt`, et l'écran Crédits.

## 2. Créé par le code du jeu (aucun droit tiers)

Chevaux et jockeys 3D (`08-horse3d`), hippodrome 3D (`09-race-world`), domaine 3D (`51-domaine3d`), ciel et lumière, icônes de l'interface (SVG, `tools/icons.py`), bruitages et musique (Web Audio, synthétisés en direct).
Texture calculée : `assets/race/grass.webp` (bruit procédural, `tools/race/race_assets.py`).

## 3. Images sources de provenance NON documentée — à régulariser

Ajoutées le 23/09/2026 par le commit `d85ff43` « Add complete game artwork » (rangées depuis dans `assets-src/`). Leur auteur et leur licence ne figurent nulle part dans le dépôt.

| Source (`assets-src/`) | Fichiers du jeu qui en sont tirés | Où on les voit | Encore indispensable ? |
|---|---|---|---|
| `royal-estate.png` | icônes de l'application `assets/icons/*.png` (château recadré) ; la peinture du domaine et ses dérivés (`assets/village/`) ont été retirés du jeu en 2.5 (domaine uniquement en 3D) | Icône installée, écran d'accueil du téléphone | Oui tant que l'icône n'est pas refaite (elle peut l'être depuis le domaine 3D) |
| `rival-gallop-sheet.png` | `assets/rival-gallop-sheet.webp`, `assets/horses/gallop-mask.png`, `meta.json` (`tools/horses/horse_masks.py`) | Cheval peint affiché en course tant que le cheval 3D se calcule | Remplaçable par des rendus du modèle 3D |
| `podium-horses-front-v1.png` | `assets/podium-horses-front-v1.webp`, `assets/horses/podium-mask.png` | Portraits des chevaux (écurie, écran des courses, atelier des couleurs) | Remplaçable par des rendus du modèle 3D |
| `trackside-world-atlas.png` | `assets/trackside-world-atlas.webp` | Éléments plats du décor, au bord de la piste en course | Remplaçable par des éléments 3D ou des textures calculées |
| `croise-panorama-loop.png` | `assets/race/horizon.webp` (`tools/race/race_assets.py`) | Horizon lointain de l'hippodrome | Remplaçable par un horizon calculé |
| `croise-track-pov.png`, `opponent-horse.png`, `race-horses-rear-v1.png`, `race-pov.png`, `royal-oval-track.png` | aucun | — | Non : ne sont plus utilisées par le jeu |

## Ce qu'il faut faire avant une vente

1. Pour chaque source du tableau 3 : retrouver qui l'a produite et avec quel outil. Si c'est une IA générative, conserver la preuve des conditions d'utilisation de l'outil à la date de création (usage commercial autorisé, pas de reprise d'œuvres ou de marques protégées).
2. À défaut de preuve : remplacer. La 3D du jeu permet déjà de remplacer les vignettes de chevaux et le podium par des rendus du modèle, et l'horizon ou l'atlas par des textures calculées ; l'icône peut être refaite à partir du domaine 3D.
3. Supprimer du dépôt les sources qui ne servent plus (dernière ligne du tableau 3).
