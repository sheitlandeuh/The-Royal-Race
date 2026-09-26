# Protocole de test joueurs

**But :** savoir si un joueur qui découvre le jeu comprend la course, prend du plaisir à décider, et a envie de relancer. On observe, on n'aide pas.

## Préparation (10 min)
- **5 à 10 personnes** qui ne connaissent pas le jeu, dont au moins 3 qui ne s'intéressent pas aux courses hippiques. Idéalement sur **leur propre téléphone**.
- Mettre le jeu en ligne (hébergement statique) ou le servir sur le réseau local : `python3 -m http.server 8000`, puis ouvrir `http://<adresse-du-mac>:8000/index.html?test=Prénom` sur le téléphone.
- **Partie neuve obligatoire** : navigation privée, ou Réglages → effacer la sauvegarde.
- La pastille rouge « ● TEST » en haut de l'écran confirme l'enregistrement. Rien ne quitte le téléphone.
- Si possible, filmer l'écran (enregistrement d'écran du téléphone) et le visage ou les mains.

## Consigne donnée au joueur (à lire mot pour mot)
> « C'est un jeu de courses de chevaux en cours de création. Joue comme tu le ferais chez toi, pendant 15 minutes. Pense à voix haute : dis ce que tu comprends, ce que tu cherches, ce qui t'agace. Je ne peux pas t'aider, c'est le jeu qui doit s'expliquer. Tu peux arrêter quand tu veux. »

## Pendant la session (15 min) — grille d'observation
Noter l'heure (le chronomètre de la pastille) pour chaque moment marquant.

| Moment | À observer | Noté |
|---|---|---|
| Création du champion | Temps passé, plaisir visible, choix du nom | |
| Arrivée au domaine | Sait-il quoi faire ? Trouve-t-il COURIR ? | |
| Écran des courses | Lit-il le rythme prévu, les tactiques ? Change-t-il de tactique ? | |
| Départ | Comprend le bouton PARTEZ ? Faux départ ? | |
| Premier temps fort | Lit la carte ? Répond à temps ? Comprend l'effet ? | |
| Sprint | Attend le vert ? Sprinte trop tôt ou trop tard ? | |
| Arrivée | Regarde l'analyse ? Comprend pourquoi il a gagné ou perdu ? | |
| Après la course | RECOURIR, retour au domaine, ou arrêt ? | |
| Domaine | Explore les bâtiments ? Remarque la vie (chevaux, moulin, carrosse) ? | |
| Travaux du domaine (V2) | Lance une amélioration ? Comprend l'effet ? Pense à récolter le moulin ? | |
| La Couronne (V2) | Ouvre la campagne ? Lit l'objectif du chapitre ? Retente après un échec ? | |
| Ventes aux enchères (V2) | Enchérit ? Se fie au potentiel estimé ou au prix ? Frustration face à Valmont ? | |
| Duel (V2) | Envoie un défi ? (demander à un ami présent de l'ouvrir sur son téléphone) | |
| Signes forts | « Encore une ! », rire, soupir, abandon, question répétée | |

## Après la session (5 min) — questions
1. En une phrase, c'est quoi ce jeu ?
2. Qu'est-ce qui fait gagner une course ?
3. Quel moment as-tu préféré ? Lequel t'a ennuyé ou perdu ?
4. Qu'est-ce que tu n'as pas compris ?
5. Sur 10, quelle envie de rejouer demain ? Pourquoi pas plus ?
6. Tu le conseillerais à qui ?

## Récupérer les données
Toucher la pastille « ● TEST » : le résumé s'affiche (durée, temps avant la 1re course, classements, réaction au départ, précision du sprint, temps forts répondus ou non, panneaux ouverts, moments d'inactivité). **Télécharger (.json)** et renommer le fichier avec le prénom, ou **Copier le journal** et l'envoyer.

## Synthèse (après 5 sessions)
Pour chaque problème : **combien de joueurs l'ont eu** (x/5), **gravité** (bloquant / gênant / détail), **piste de correction**. On corrige d'abord ce qui bloque au moins 2 joueurs sur 5.

Signaux à surveiller en priorité :
- plus de **2 minutes** avant la première course ;
- des temps forts **sans réponse** plus d'une fois sur trois (carte pas lue ou trop rapide) ;
- un écart au **sprint idéal** supérieur à 150 m après 3 courses (le joueur ne comprend pas le sprint) ;
- un **abandon** de course ;
- aucun joueur n'utilise RECOURIR.
