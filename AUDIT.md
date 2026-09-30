# Audit — The Royal Race 2.5 → 2.6 (29/09/2026, exigence relevée)

**Question posée :** refaire l'audit en élevant le niveau d'exigence, puis corriger ce qui peut l'être.
**Périmètre :** version 2.5 publiée (commit `e1a5012`), 57 modules JS, bundle de 663 Ko, domaine entièrement en 3D.
**Audits précédents :** `docs/audits/AUDIT-2.4.md` (audit de la 2.4 et son suivi en 2.5).

**Méthode — cette fois, tout est mesuré dans le jeu, pas seulement lu dans le code :**
- parcours complet d'un nouveau joueur (atelier → domaine → première course → arrivée → podium → retour), capturé à 320×568, 360×640, 390×844 et 412×915 ;
- test d'injection : noms piégés (balises HTML) sur les chevaux, le champion, un duel reçu, la course du duel en direct et le classement final ;
- mémoire graphique sur cinq courses d'affilée ;
- coût d'une image (triangles, appels de dessin, mémoire) par niveau de qualité ;
- accessibilité (noms accessibles, tailles de texte, réglage « réduire les animations ») ;
- console du navigateur au lancement.

Outil : Chromium piloté par Playwright, **rendu logiciel sans carte graphique**. Les durées absolues sont donc pessimistes ; les comparaisons avant / après restent valables.

---

## Verdict

La 2.5 était **propre en surface mais pas prête pour de vrais joueurs sur de vrais téléphones**. Quatre défauts graves n'apparaissaient qu'en jouant pour de bon :

1. **Une fuite de mémoire graphique** : +12 textures à chaque course. Une longue session sur téléphone finissait par saturer la mémoire graphique et faire tomber la 3D.
2. **Un écran de course cassé sur les petits téléphones** : sur 320 px de large, la carte du cheval couvrait le milieu de l'écran et six éléments se chevauchaient.
3. **Un texte par-dessus la course** : l'encart du commentateur s'affichait au milieu de l'écran, contrairement à la règle « rien par-dessus la course ».
4. **Un premier lancement trop long** : un nouveau joueur attendait la construction complète du domaine 3D avant même de pouvoir créer son champion.

Tous les quatre sont corrigés en 2.6, avec des tests qui empêchent leur retour. L'injection de code, elle, était déjà impossible (vérifié sur tous les écrans) ; elle est maintenant testée à chaque envoi.

| Axe | 2.5 | 2.6 | Ce qui manque pour 9/10 |
|---|---|---|---|
| Solidité technique (rejeu, tests, mémoire, sécurité) | 7 | 9 | Tests sur vrais appareils |
| Mobile : lisibilité et ergonomie | 5 | 7 | Validation en playtest, réglage de la taille du texte |
| Performances et batterie | 5 | 6 | Budget GPU du domaine en qualité moyenne (voir P1) |
| Premier lancement | 5 | 7 | Tutoriel de course interactif, mesures de rétention réelles |
| Accessibilité | 3 | 5 | Taille du texte, mode daltonien, lecteur d'écran en course |
| Direction artistique et 3D | 6 | 6 | Gros plans, identité visuelle unique |
| Contenu et rejouabilité | 5 | 5 | Plusieurs hippodromes, calendrier, événements |
| Audio | 3 | 3 | Sons et musique enregistrés |
| Données, légal, stores, monétisation | 1 | 1 | Serveur, comptes, achats, mentions légales — à décider par toi |

---

## Corrigé dans la 2.6

| # | Constat (mesuré) | Correction | Preuve |
|---|---|---|---|
| 1 | **Fuite de mémoire graphique** : 55 → 108 textures en 5 courses. Cause : les squelettes des chevaux 3D (cheval + jockey) n'étaient pas libérés, soit 6 × 2 textures d'os par course | `HORSE3D.dispose` libère les squelettes ; les portraits du podium aussi | 55 → 60 → 53 → 60 → 60 (plateau). Nouveau test « Mémoire graphique stable entre les courses » |
| 2 | **Écran de course sur petit téléphone** : à 320×568, chevauchements carte/allure, distance/« Quitter », légende de piste/« Droite », sprint/« Droite », message/« Arrivée » ; message tronqué | En-tête resserré, message sur deux lignes, carte compacte à gauche de l'allure, commandes du bas recalculées | 0 chevauchement mesuré à 320, 360, 390 et 412 px (script de contrôle des rectangles) |
| 3 | **Encart du commentateur** au milieu de l'écran pendant la course | En direct, le speaker parle seulement (si la voix est activée) ; le texte n'apparaît qu'une fois ton cheval arrivé | Règle ajoutée à CLAUDE.md |
| 4 | **Premier lancement** : l'atelier du champion n'apparaissait qu'après la première image du domaine 3D (~12 s en rendu logiciel) | L'atelier s'affiche dès qu'il est prêt, le domaine se construit derrière ; si le joueur valide avant la fin, l'écran titre revient au lieu d'un écran vide | ~12 s → ~8 s en rendu logiciel |
| 5 | **Classement officiel** : temps coupés sur deux lignes (« 89.55 / s ») et point décimal, alors que le direct affiche « 1,2 L » | Format commun `sec()` : « 89,55 s », virgule et espace insécable | Captures 320 px : une seule ligne |
| 6 | **Écran des courses** : le bouton COURIR n'apparaissait qu'après avoir fait défiler toute la page sur téléphone | Bouton toujours visible en bas du panneau | Capture 320 px |
| 7 | **Batterie** : le domaine se redessinait 60 fois par seconde même immobile | 30 images/s au repos (aucun geste depuis 1,2 s, caméra immobile), 60 dès qu'on le touche | Logique vérifiée ; gain réel à mesurer sur téléphone (le rendu logiciel est trop lent pour atteindre 30 i/s) |
| 8 | **Console** : deux avertissements à chaque lancement (build global de three.js déprécié, compilation parallèle absente) | Avertissement retiré du fichier three.js ; compilation parallèle seulement si le pilote la propose | Console vide au lancement |
| 9 | **Accessibilité** : aucune règle « réduire les animations » (les deux qui existaient ont disparu avec la peinture 2D), textes à 9 px, bulles de récolte sans nom accessible | Réglage système respecté (animations CSS, secousse de caméra au départ) ; étiquettes agrandies (POSITION, GAUCHE / DROITE, PRESSER / RETENIR, SPRINT, emplacements « Libre ») ; `aria-label` sur les bulles | Aucun texte visible sous 10 px, mesuré sur tous les écrans et sur l'écran de course de 320 à 1280 px ; contrôle ajouté au test de fumée |
| 10 | **Sauvegarde** : si le stockage du navigateur est plein ou bloqué, l'échec était silencieux et la progression perdue sans prévenir | Message clair (8 s) invitant à exporter la partie, erreur notée au journal ; stockage persistant demandé dès la première course | — |
| 11 | **Sécurité** : noms piégés sur les chevaux, le champion, un duel reçu (cheval et adversaires), la course du duel en direct (étiquettes, classement) et le classement final → **aucun code exécuté** | Défense en profondeur (nom de course échappé), profil de fumée permanent « noms-pieges » | 14/14 profils de fumée |
| 12 | **Typographie** : retour à la ligne juste avant « : » dans les messages de course | Espace insécable avant les deux-points | — |

---

## Suivi 2.7 (30/09/2026)

Parti d'une capture d'iPhone : la fiche d'un bâtiment se faisait recouvrir par l'objectif, les coffres et COURIR. Mesuré ensuite sur 14 tailles d'écran, pas seulement celle de la capture.

| Constat (mesuré) | Correction | Preuve |
|---|---|---|
| Domaine : fiche du bâtiment × objectif × coffres × COURIR **sur toutes les tailles** (320 px à 1280 px), titre coupé en deux lignes, coût d'AMÉLIORER caché ; ressources sur le profil à 320 px ; étiquette 3D du bâtiment sous le rail | Fiche placée par mesure au-dessus de la barre du bas, objectif effacé pendant qu'elle est ouverte, deux rangées sur téléphone, bouton ×, caméra qui cadre le bâtiment au-dessus de la fiche, étiquette gardée dans la zone libre, montants abrégés | `tools/hud.cjs` : 0 chevauchement de 320×568 à 1920×1080 (en CI) ; profil de fumée 320×568 |
| Écran de course : carte du cheval sur ◀ en tablette paysage (1000–1024 px), allure sur ▶ ou sur SPRINT en téléphone paysage (640–932 px), « 860 / m » coupé | Commandes décalées après la carte, allure à côté du sprint, espaces insécables | idem |
| Contenu (P1 n° 6) : un seul hippodrome | Cinq hippodromes au tracé et au décor différents, quatre courses de plus (13 au programme) | Tests « Hippodromes » (6), équilibrage au bot par hippodrome (README) |

Scores revus : Mobile 7 → 8, Contenu 5 → 6. Le reste du tableau et des priorités ci-dessous est inchangé.

## Ce qui reste — P0 : bloquant pour vendre (décisions et comptes à ta main)

Inchangé depuis l'audit précédent, parce que rien de cela ne peut se faire sans toi :

1. **Comptes et sauvegarde en ligne, économie côté serveur.** Le moteur de vérification (`replays.verify`) est prêt. Il manque un hébergement : Firebase, Supabase ou serveur maison.
2. **Monétisation.** Choisir le modèle, ouvrir les comptes développeur Apple et Google, emballer avec Capacitor.
3. **Légal.** Identité de l'éditeur, CGU / CGV, classification d'âge, recherche de marque.
4. **Images.** Retrouver l'auteur des 5 sources encore utilisées, ou les remplacer (`docs/ASSETS.md`).
5. **Vrais joueurs et vrais téléphones.** Aucun playtest ni test sur appareil n'a encore eu lieu. C'est le plus gros angle mort : tout ce qui précède a été mesuré dans un navigateur sans carte graphique.

## P1 — Qualité perçue (faisable dans le code, par ordre d'impact)

1. **Budget GPU du domaine en qualité moyenne** : 317 000 triangles et 223 appels de dessin par image, dont environ la moitié pour les ombres. C'est le réglage par défaut de la plupart des téléphones. Pistes : instancier arbres et clôtures, ne recalculer les ombres statiques qu'à la demande, alléger le décor lointain.
2. **Course en qualité basse** : 211 000 triangles et 125 appels. À budgéter pour les Android d'entrée de gamme.
3. **Tutoriel de course.** Le premier départ explique peu : couloir, sillage, sprint et allure se découvrent seuls. Un départ guidé, sans rien afficher par-dessus la course (par exemple une course d'essai commentée à la voix), réduirait les abandons.
4. **Allure « presser ».** Le bot montre la valeur de « retenir en lisant sa jauge », pas encore celle de « presser ». À valider en playtest, ou à réserver aux ouvertures dans le peloton.
5. **Audio.** Tout est synthétisé : il faut des bruitages et une musique enregistrés.
6. **Contenu.** Cinq hippodromes et 13 courses depuis la 2.7 ; il manque encore un calendrier et des événements pour garder les joueurs des semaines.
7. **Accessibilité, suite** : taille du texte réglable, mode daltonien (casaques, pastilles de forme), annonces pour lecteur d'écran en dehors de la course.
8. **Anglais.** Le jeu est en français seulement : environ 550 textes à extraire.

## P2 — Industrialisation

- Passer three.js en modules ES (le build global est déprécié ; l'avertissement est seulement masqué).
- Découper les modules les plus denses (`10-race`, `12-stable-ui`) en fonctions lisibles.
- Mesurer les budgets de performance dans la CI (triangles, appels de dessin, textures) pour détecter toute régression.

---

## Tests ajoutés en 2.6

- **Mémoire graphique** : trois courses d'affilée, le nombre de textures ne doit pas grossir (`tools/tests.js`).
- **Noms piégés** : profil de fumée qui ouvre tous les écrans avec des noms contenant du HTML, puis vérifie qu'aucun code ne s'est exécuté (`tools/smoke.cjs`).
- **Écran de course à 320–412 px** : contrôle des chevauchements, lancé pendant l'audit (script dans l'historique de la session). À intégrer à la CI si la mise en page de course évolue.
