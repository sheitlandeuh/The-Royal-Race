# The Royal Race — vision

## La promesse, en une phrase
**Le jeu de courses hippiques où tu lis la course comme un vrai jockey.**

Chaque course dure moins d'une minute, et elle se gagne sur trois ou quatre décisions : la tactique choisie face au plateau, le placement (sillage, ouverture pour doubler), le moment du sprint. Le domaine, l'écurie et la carrière existent pour donner du sens à ces décisions, pas l'inverse.

## Les trois piliers
1. **Lire la course.** Le joueur voit les tactiques adverses, le rythme prévu, l'énergie qui fond, les rivaux qui craquent. Une bonne lecture bat un meilleur cheval. Chaque nouvelle fonctionnalité doit enrichir cette lecture, sinon elle attend.
2. **Mon écurie, mon histoire.** Un champion aux couleurs du joueur, un rival (le Comte de Valmont), un domaine qui vit à l'heure du joueur. On revient pour ses chevaux, pas pour une barre de progression.
3. **Une course de plus.** Sessions de 3 à 5 minutes, relance en un geste (RECOURIR), une récompense ou un objectif visible après chaque course.

## Le joueur visé
Joueur mobile de 16 à 45 ans, amateur de jeux de gestion légers et de jeux de course « à décisions » (pas de réflexes purs). Il joue dans les transports ou le soir, 2 à 4 sessions par jour. Il n'est pas forcément amateur de turf : le jeu doit s'expliquer tout seul.

## Ce que le jeu n'est pas
- **Pas un jeu de paris.** Aucune mise, aucun gain réel, aucune cote : les chances de chaque partant s'affichent en mots (favori, prétendant, outsider, petite chance).
- **Pas un jeu de réflexes.** Le départ est commun (les stalles s'ouvrent pour tous), on gagne par la lecture : placement, sillage, ouverture, moment du sprint.
- **Pas un « pay-to-win ».** On vend des cosmétiques (casaques, robes, décors du domaine) et du confort, jamais de la vitesse.

## Priorités (fin septembre 2026, après la V2)
La V2 a livré : un domaine réel (chaque niveau de bâtiment a un effet), les ventes aux enchères, la retraite et les Légendes, les duels entre amis par lien (courses fantômes asynchrones, vérifiées par rejeu, sans serveur), la campagne « La Couronne » contre Valmont, et un équilibrage remesuré au bot (note des chevaux, talents, distances, temps forts).
1. Tester la V2 avec de vrais joueurs (voir [PLAYTEST.md](PLAYTEST.md)) : les duels donnent-ils envie de revenir ? la campagne est-elle bien dosée ? l'économie du domaine tient-elle sur deux semaines ?
2. Serveur : comptes, sauvegarde cloud, résultats revérifiés avec le moteur de `replays.verify`, classement en ligne du Défi du jour et des duels. La 2.3 a préparé le terrain : moteur 3 sans pause ni bouton de départ, chevaux solides et règles identiques pour tous, horloge de course commune — six joueurs humains peuvent maintenant partager une course (un serveur qui distribue la graine, l'heure du GO et les entrées datées de chacun).
3. ~~Faire compter le Départ, l'Intelligence et le Tempérament en course~~ — fait en 2.2 (moteur 2, courses de haies). Suite : d'autres disciplines à décisions (cross, relais d'écurie) et un calendrier de saison qui les mélange.
4. Lancement discret dans un ou deux pays tests (Capacitor, achats intégrés de cosmétiques).

## Indicateurs de réussite du lancement discret
| Indicateur | Objectif |
|---|---|
| Joueurs qui terminent la 1re course | ≥ 90 % |
| Joueurs qui lancent une 2e course | ≥ 75 % |
| Rétention J1 / J7 / J30 | 40 % / 15 % / 6 % |
| Courses par joueur actif et par jour | ≥ 6 |
