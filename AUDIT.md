# Audit — The Royal Race 2.4 (29/09/2026)

**Question posée :** que manque-t-il, que faut-il améliorer, pour une version commercialisable ?
**Périmètre :** version 2.4 publiée (commit `96204a4`), 55 modules JS (~548 Ko), CSS, assets, outils et documentation.
**Méthode :** relecture du code et des systèmes ; tests automatiques (tous verts) et test de fumée (6 sauvegardes types, PC et mobile, sans erreur) ; mesures dans Chromium piloté par Playwright (rendu **logiciel**, sans carte graphique : les temps absolus sont pessimistes, les rapports restent parlants).
**Non vérifié :** comportement sur de vrais téléphones (fluidité, chauffe, batterie), avis de vrais joueurs, statut juridique des images. Ce sont justement trois des plus gros risques.

> L'audit précédent (23/09, version 1) ne décrit plus le jeu : tous ses points bloquants ont été traités depuis (départ tactile, Three.js embarqué, sauvegarde, classement, mobile paysage, profondeur des choix, son…).

## Suivi — version 2.5 (29/09/2026)

La 2.5 traite dans le code tout ce que la phase 1 permettait sans compte, sans fournisseur et sans décision du propriétaire. Le reste de cet audit (écrit sur la 2.4) reste valable.

| Point | Fait en 2.5 | Preuve |
|---|---|---|
| 6. Démarrage bloqué par la 3D | Écran titre animé jusqu'à la première image ; domaine 3D construit par étapes, shaders compilés en parallèle quand le pilote le permet ; peinture du domaine (2,3 Mo) chargée seulement si elle sert | Mobile 390×844, qualité moyenne, rendu logiciel : interface utilisable 15,8 s → 4,1 s ; premier téléchargement 3,4 Mo → 0,7 à 1,3 Mo |
| 6 / 11. Domaine et identité visuelle | Domaine **uniquement en 3D** sur tous les appareils (qualité basse comprise) : peinture 2D, calques d'animation 2D et leurs images (2,3 Mo) supprimés ; première image dès l'essentiel construit, décor et chevaux ensuite | Rendu logiciel : domaine 3D visible 3 à 6 s après l'ouverture sur téléphone (auparavant ~11 s) ; test « Domaine 3D : affiché, sélection, aucun calque 2D » |
| 6. Qualité selon les images/s réelles | `54-fluidite` : au-delà de 34 ms par image, résolution 100 → 85 → 72 → 60 %, puis niveau d'effets ; remonte sous 17 ms ; un choix manuel l'annule | Vérifié en rendu logiciel (ajustements successifs jusqu'à « basse » à 60 %) |
| 5. Erreurs et mesures | `00-journal` (chargé en premier) + `55-mesures` : erreurs JS, promesses, erreurs rattrapées, fichiers introuvables ; entonnoir de la première partie, jours joués (J1 / J7 / J30), sessions, gains et dépenses par source ; rapport de problème à copier (Réglages → Aide). Envoi prêt à brancher, désactivé | Test « Journal » ; `docs/MESURES.md` |
| 8. Rivaux aux noms figés | 12 écuries rivales avec casaque fixe, 72 chevaux nommés, face-à-face mémorisé par cheval | Test « Écuries rivales » : 66 chevaux différents sur 300 plateaux |
| 7. Profondeur de course | Allure en course (presser / retenir), entrée enregistrée et rejouée, repère de réserve sur la jauge | Bot, rang moyen sur 3 distances : allure normale 2,56 · toujours retenir 3,98 · toujours presser 3,10 · lire sa jauge 2,33 ; test automatique |
| 3. Vocabulaire des paris | Plus de cotes « 2.5/1 » : favori, prétendant, outsider, petite chance | — |
| 3. Licences tierces | Écran Crédits (three.js MIT avec son texte, polices OFL) | — |
| 3. Confidentialité | Page exacte dans le jeu : ce qui est gardé, où, ce qui sort ; voix de synthèse installée sur l'appareil de préférence | — |
| 3. Droits sur les images | Inventaire `docs/ASSETS.md` : composants tiers, fichiers calculés par le jeu, et 10 images sources **sans provenance** (5 encore utilisées) | — |
| 12. Ergonomie | Abandon de course confirmé sur le bouton lui-même ; barre du bas à 12 px sur téléphone ; manifeste aux couleurs actuelles | Captures PC, téléphone, paysage, tablette |
| 14. Intégration continue | GitHub Actions à chaque envoi : `index.html` à jour, syntaxe, tests, test de fumée PC + mobile | Premier passage réussi |

### Ce qui ne peut pas avancer sans toi

| Sujet | Ce qu'il faut | Ce qui est prêt côté jeu |
|---|---|---|
| Comptes, sauvegarde en ligne, économie serveur (1) | Choisir un hébergement (Firebase, Supabase, serveur maison) et le financer | `replays.verify` rejoue et vérifie chaque course ; export / import de partie |
| Monétisation (2) | Choisir le modèle ; comptes développeur Apple (99 $/an) et Google (25 $) ; emballage Capacitor | Boutique, Route des étoiles, cosmétiques |
| Légal (3) | Identité de l'éditeur (mentions légales, CGU / CGV), classification IARC, recherche d'antériorité sur le nom | Page Confidentialité exacte, Crédits |
| Images (3) | Retrouver l'auteur et la licence des sources listées dans `docs/ASSETS.md`, ou les faire remplacer | La 3D peut remplacer portraits, cheval peint, horizon et bord de piste |
| Mesures en ligne (5) | Choisir un outil (Sentry, analytics conforme RGPD), renseigner `JOURNAL_ENVOI.url` ; adresse de support dans `JOURNAL_ENVOI.contact` | Journal, format d'envoi documenté, consentement déjà prévu (décoché par défaut) |
| Vrais joueurs (4) et vrais téléphones (6) | 5 à 10 sessions de test ; iPhone SE / 11, Android 3–4 Go, tablette | Protocole `docs/PLAYTEST.md`, enregistreur `?test=Prénom`, qualité auto |
| Audio, gros plans 3D, identité visuelle, anglais (9–11, 16) | Production (sons, musique, artiste 3D, traduction) | — |


---

## Verdict

Le jeu est **complet et cohérent en solo**, et **techniquement sain** : simulation déterministe, rejeu vérifié, duels anti-triche, tests automatiques, hors ligne, adapté PC / mobile / tablette. Mais il **n'est pas commercialisable en l'état**. Il manque presque tout ce qui entoure un jeu vendu :

- des comptes et une sauvegarde en ligne ;
- une monétisation ;
- de la mesure (analytics, remontée d'erreurs) ;
- la conformité juridique et l'emballage pour les stores ;
- une validation par de vrais joueurs.

Sur le fond, quatre risques restent ouverts :

- la profondeur de la course, réduite depuis la 2.4 ;
- la variété du contenu ;
- les performances sur les mobiles modestes ;
- la qualité audio.

| Axe | État | Note /10 |
|---|---|---|
| Technique (simulation, rejeu, tests) | Solide, rare pour un projet de cette taille | 8 |
| Méta-progression | Riche et cohérente (domaine, ventes, Légendes, Couronne, ligues, missions, saison) | 7 |
| Direction artistique et 3D | Domaine et hippodrome agréables ; cheval « jouet » de près, style hybride peinture / 3D / néon | 6 |
| Boucle de course | Lisible (couloirs, sillage, collisions, sprint), mais peu de décisions en course | 5 |
| Mobile et performances | Interface adaptée ; démarrage bloqué par la 3D, scènes lourdes, jamais mesuré sur téléphone | 5 |
| Contenu et rejouabilité | 9 courses, rivaux aux 5 mêmes noms à chaque course | 4 |
| Audio | Sons synthétisés, voix de synthèse du navigateur | 3 |
| Multijoueur | Moteur prêt ; duels par lien seulement, aucun classement | 3 |
| Langues et accessibilité | Français seul, ~550 chaînes en dur, peu d'options | 3 |
| Données, légal, stores | Rien en place | 1 |
| Monétisation | Inexistante | 0 |

---

## P0 — Bloquants pour vendre

### 1. Comptes, sauvegarde en ligne, économie côté serveur

Aujourd'hui, tout est en `localStorage`. Conséquences :

- la partie est perdue si le cache est vidé ou si le joueur change d'appareil ;
- Safari efface le stockage d'un site après 7 jours sans visite, sauf si l'application est installée ;
- l'or et les gemmes se modifient en deux lignes de console.

Tout cela est incompatible avec des achats ou des classements. Ce qu'il faut mettre en place :

- **Comptes** : Apple, Google ou e-mail.
- **Sauvegarde en ligne** avec gestion des conflits entre appareils.
- **Économie côté serveur** : monnaies et inventaire tenus par le serveur, pas par le navigateur.
- **Vérification des résultats côté serveur** avec `replays.verify`. Le moteur a été conçu pour ça : c'est le principal atout technique du projet.

### 2. Monétisation

Rien n'est implémenté : la boutique ne vend que contre des gemmes gagnées en jouant. Il faut :

1. **Choisir un modèle.** Conforme à la promesse (`docs/VISION.md` : « pas de pay-to-win ») : jeu gratuit avec cosmétiques (casaques, robes, décors), passe de saison premium (la Route des étoiles existe déjà) et confort (places d'écurie, travaux accélérés). Une publicité récompensée est possible, en option.
2. **Brancher les achats intégrés** (StoreKit, Google Play Billing via Capacitor), avec **validation des reçus côté serveur**.
3. **Faire attention aux coffres aléatoires.** S'ils deviennent achetables, il faut afficher les probabilités (exigence Apple et Google), et ils sont interdits à la vente en Belgique. Recommandation : coffres uniquement gagnés, vente d'objets en direct.

### 3. Légal et conformité

- Mentions légales, CGU / CGV, politique de confidentialité (RGPD), consentement dès qu'il y a analytics ou publicité.
- Classification d'âge (questionnaire IARC / PEGI).
- **Vocabulaire des paris.** L'écran des courses affiche « Partants & cotes » avec des cotes « 2.5/1 ». Cela peut valoir une classification « jeu d'argent simulé » ou des refus selon les pays, alors que le jeu ne mise rien. → Renommer en « indice de forme » ou « favori / outsider », sans cote chiffrée.
- **Droits sur les images.** La peinture du domaine, les feuilles de sprites, l'atlas du bord de piste et les chevaux du podium (`assets/`, `assets-src/`) n'ont pas de provenance documentée. Pour chaque image, il faut prouver le droit d'usage commercial. Si elles ont été générées par IA, vérifier les conditions de l'outil utilisé.
- **Licences tierces** (Three.js MIT, polices OFL) : les regrouper dans un écran « Crédits ». Aujourd'hui, elles ne sont visibles que dans les fichiers.
- **Marque** : recherche d'antériorité sur « The Royal Race » avant d'investir dans le nom.

### 4. Validation par de vrais joueurs

`docs/PLAYTEST.md` contient un protocole complet, mais aucune session n'a été consignée. Tout l'équilibrage a été mesuré par un bot, qui ne dit rien du plaisir, de la compréhension ni de l'envie de revenir. Ordre recommandé :

1. 5 à 10 sessions en personne.
2. Corrections.
3. Bêta fermée avec analytics.

### 5. Analytics et remontée d'erreurs

Le jeu ne mesure rien et ne remonte aucune erreur. Impossible de piloter un lancement sans :

- l'entonnoir de la première course ;
- la rétention J1 / J7 / J30 (objectifs fixés dans VISION : 40 / 15 / 6 %) ;
- la durée des sessions ;
- les sources et dépenses d'or ;
- les plantages par appareil.

→ Un SDK analytics conforme RGPD et un outil de suivi d'erreurs (type Sentry).

### 6. Performances sur de vrais téléphones

Mesures prises sur mobile 390×844, en rendu logiciel :

| Mesure | Domaine 3D actif | Qualité basse (sans 3D) |
|---|---|---|
| Interface utilisable après (DOMContentLoaded) | **9 à 13 s** | **0,7 s** |

Cause : l'exécution des modules ne prend que 0,1 à 0,4 s ; ce sont la construction et la première image de la 3D qui bloquent la page. Sur un vrai GPU l'écart sera plus petit, mais l'écran reste figé pendant ce temps. → Écran de chargement, puis construction progressive (bâtiments, arbres et chevaux en plusieurs images).

| Coût d'une image | Triangles | Appels de dessin | Mémoire JS |
|---|---|---|---|
| Domaine 3D | ~264 000 | ~139 | ~60 Mo |
| Course (ombres comprises) | ~355 000 | ~155 | ~64 Mo |

C'est correct pour un milieu de gamme, risqué pour un Android d'entrée de gamme. Pour le mobile :

- **Tester sur un parc réel** : iPhone SE / 11, Android 3 à 4 Go de RAM, tablette. Relever les images par seconde, la chauffe et la batterie sur 10 minutes.
- **Fixer des budgets** de triangles, d'appels de dessin et de mémoire par niveau de qualité.
- **Choisir la qualité automatiquement** d'après les images par seconde réellement mesurées, et pas seulement d'après l'appareil.

Premier téléchargement : **3,4 Mo** non compressés (16 requêtes), dont 2,3 Mo pour la peinture du domaine. Cette peinture n'est plus que le repli de la 3D : elle peut se charger à la demande.

---

## P1 — Qualité de jeu (ce qui fera revenir les joueurs)

### 7. Profondeur de la course

Depuis la 2.4, le joueur agit en course sur trois choses : son couloir, le moment du sprint et l'élan avant les haies. Sur quelques courses, c'est clair et agréable. Sur des centaines, le risque de passivité est réel : le résultat se décide surtout avant le départ (cheval, tactique, jockey, équipement).

Pistes non intrusives, sans fenêtre ni texte :

- un geste pour tenir ou relâcher le cheval (gestion du rythme) ;
- une cravache à doser, avec une jauge ;
- des ouvertures signalées visuellement dans le peloton ;
- des défauts propres à chaque cheval : il tire à l'intérieur, il déteste être enfermé…

À valider en playtest (point 4).

### 8. Contenu et variété

- **Courses et lieux** : 9 courses, 4 distances, 3 terrains, un seul hippodrome. → D'autres hippodromes (tracé, sens de rotation, dénivelé, décor), un calendrier de saison, des événements limités dans le temps.
- **Rivaux aux noms figés** : les 5 adversaires portent **toujours les mêmes noms** (`raceNames[1..5]` dans `buildField`) ; seules leurs statistiques changent. Cela casse l'immersion dès la troisième course. → Générateur de noms, écuries rivales persistantes avec leurs couleurs, des rivaux qui progressent.
- **Autres contenus** : 6 jockeys, 5 équipements, 7 décors, 6 talents, 20 paliers de saison. Correct pour un lancement discret ; il faudra un rythme de nouveautés (live ops) ensuite.
- **Long terme** : l'élevage et les Légendes sont la bonne direction. À approfondir : lignées, caractères héréditaires, collection.

### 9. Audio

Bruitages synthétisés en WebAudio et commentaire par la voix de synthèse du navigateur : la qualité varie fortement d'un appareil à l'autre et fait « prototype ». → Bruitages enregistrés (galop sur gazon, stalles, foule, cloche), musique composée (menus, course, victoire) et commentateur enregistré, même avec un nombre limité de phrases.

### 10. Chevaux et jockeys en gros plan

En course, les chevaux sont convaincants. De près (podium, présentation, écurie), la tête reste simplifiée et le jockey ressemble à un mannequin. → Une passe d'artiste 3D, ou des modèles dédiés aux gros plans (glTF animés), en gardant le modèle procédural pour la course.

### 11. Identité visuelle

Plusieurs styles cohabitent : domaine peint (repli), domaine 3D stylisé, interface néon « gaming », chevaux 3D. → Arrêter une identité et l'appliquer partout : écran titre, icône, fiche store, bande-annonce. Le manifeste utilise encore les anciennes couleurs (`#071a2d`).

### 12. Parcours et ergonomie

- **Écran titre / chargement** : il n'y en a pas (voir point 6).
- **Textes trop petits sur mobile** : la barre du bas descend à 10 px, à agrandir.
- **Sortir d'une course** : il faut toucher « Quitter » et la course est perdue. Ce comportement doit être annoncé clairement, puisqu'il n'y a plus de pause.

### 13. Multijoueur

Le moteur est prêt pour des courses partagées (même graine, horloge commune, entrées datées, aucun chevauchement), mais seuls existent les duels asynchrones par lien. Progression proposée :

1. Classements en ligne (Défi du jour, duels).
2. Courses asynchrones contre des fantômes choisis par niveau.
3. Courses en temps réel à 6.

---

## P2 — Industrialisation

14. **Code et intégration continue.**
   - Le JS (~548 Ko) est écrit en lignes très denses : efficace en solo, difficile à relire et à reprendre en équipe.
   - Pas de typage, pas de lint.
   - Tests et fumée se lancent à la main. → Intégration continue GitHub Actions (build, `check`, tests, test de fumée à chaque push), formatage imposé des nouveaux fichiers, découpage progressif des plus gros modules.
15. **Three.js r160 en « build global »** : ce format est déprécié (avertissement dans la console). → Passer aux modules ES avant la prochaine mise à jour de Three.js.
16. **Langues.** Français seul, environ 550 chaînes en dur dans le code, aucun système de traduction. → Extraire les textes et ajouter l'anglais : le marché est au moins 10 fois plus grand.
17. **Accessibilité.** 29 `aria-label`, 2 règles `prefers-reduced-motion`. → Taille du texte, mode daltonien (casaques et pastilles), réduction des animations et des flashs, commandes entièrement au clavier et à la manette, contrastes vérifiés.
18. **Stores.** Emballage Capacitor (iOS / Android), icônes adaptatives, écran de démarrage, notifications (fin de travaux, Défi du jour), fiche store (captures, vidéo), tests sur WKWebView (iOS) et sur les WebView Android.
19. **Live ops.** Événements, équilibrage et messages sont figés dans le code. → Configuration à distance, calendrier d'événements côté serveur, messages dans le jeu.

---

## Points forts à préserver

- **Simulation déterministe et rejeu vérifié.** Le serveur pourra valider chaque course avec le même moteur : l'anti-triche est prête avant même d'avoir un serveur.
- **Tests automatiques utiles** : équilibrage mesuré au bot, rejeu identique, aucun chevauchement, duels falsifiés refusés, course sans interruption. S'y ajoute un test de fumée sur 6 profils de sauvegarde, PC et mobile.
- **Méta-progression riche et reliée** : chaque bâtiment a un effet réel, ventes, Légendes, Couronne, ligues, missions, Défi du jour.
- **Hors ligne complet** (PWA), aucune dépendance réseau, qualité graphique réglable, interface adaptée PC / mobile / tablette.

---

## Feuille de route proposée vers un lancement discret

Durées indicatives, à affiner selon l'équipe.

| Phase | Durée | Contenu |
|---|---|---|
| **1. Prouver le plaisir** | 4 à 6 semaines | 5 à 10 playtests, analytics et suivi d'erreurs, écran de chargement et construction progressive de la 3D, tests sur vrais téléphones, noms de rivaux, remplacement des cotes, écran Crédits, provenance des images |
| **2. Construire le service** | 2 à 3 mois | Comptes et sauvegarde en ligne, économie et vérification côté serveur, classements, traduction et anglais, audio professionnel, 2 à 3 hippodromes et une vingtaine de courses, profondeur de la course (selon playtests) |
| **3. Lancer** | 1 à 2 mois | Capacitor, achats intégrés, conformité stores et classification d'âge, bêta fermée, lancement discret dans 1 à 2 pays avec les indicateurs de `docs/VISION.md` |
