/* ===== Quoi de neuf : présenté une seule fois par version aux joueurs qui avaient déjà commencé leur partie (seulement ce qu'ils n'ont pas encore vu) =====
   Un nouveau joueur découvre tout au fil des déblocages (35-onboarding) : il ne voit jamais cet écran. */
const NOUVEAUTES=[
 ['🏆','Un vrai podium','Marches de marbre et médailles, portique au nom de la course, projecteurs, pluie de confettis et guirlande de roses pour le vainqueur. Pendant la cérémonie, les commandes de course s’effacent.',0,'2.8'],
 ['🎨','Atelier en 3D','Robe, casaque et toque se choisissent sur le vrai cheval de course : fais-le tourner, regarde-le au galop. Chaque cheval de l’écurie se personnalise, et ses portraits (écurie, courses, ventes, Légendes) sont en 3D.',0,'2.8'],
 ['🏇','Jockey en selle','À l’arrêt, le jockey s’assoit dans la selle ; ses jambes épousent les flancs, ses bottes reposent dans les étriers. Le numéro du tapis se lit droit sur les deux flancs, la robe est plus lisse et lustrée.',0,'2.8'],
 ['🧰','Coffres','Coffres dessinés (bois, argent, or, royal), décompte à la seconde avec sa barre de progression, et une ouverture en trois temps : le coffre tremble, s’ouvre dans un éclat de lumière, puis chaque gain se compte.',0,'2.8'],
 ['🍂','Le domaine et la course se répondent','Depuis l’Hippodrome Royal, c’est ton haras qu’on voit sur la colline, au niveau que tu as construit ; les arbres des hippodromes suivent la saison du domaine. Une seule icône pour l’or, le fourrage et les gemmes, partout. Les ponts du village enjambent droit la rivière.',0,'2.8'],
 ['🔁','Recourir sans accroc','RECOURIR relance proprement la course suivante : plus d’écran gris, et plus aucune fenêtre ne s’ouvre en pleine course.',0,'2.8'],
 ['🗺️','Cinq hippodromes','Forêt (main droite, virages serrés), Côte face à la mer (longues lignes droites), Cimes au pied des glaciers, Capitale sous les projecteurs, et l’Hippodrome Royal. Le tracé compte : dans les virages serrés, courir au large coûte plus cher. Quatre nouvelles courses, et un succès pour qui gagne partout.',0,'2.7'],
 ['📐','Domaine plus lisible','La fiche d’un bâtiment ne recouvre plus l’objectif, les coffres ni COURIR, sur aucun téléphone ; la caméra cadre le bâtiment au-dessus de sa fiche. Gros montants abrégés (2,3 M) dans la barre du haut.',0,'2.7'],
 ['📱','Course lisible sur petits téléphones','Sur les écrans étroits, la carte du cheval, l’allure, le sprint et les couloirs ne se chevauchent plus. Le commentaire ne s’affiche plus par-dessus la course : tu entends le speaker, le classement en direct donne les écarts.',0,'2.6'],
 ['🔋','Plus économe, sans ralentir','Le domaine affiche moitié moins d’images quand tu ne le touches pas, et la mémoire graphique ne s’accumule plus de course en course : de longues sessions restent fluides.',0,'2.6'],
 ['✨','Finitions','Bouton COURIR toujours visible, temps à la française (89,55 s), atelier du champion dès l’ouverture du jeu, réglage « réduire les animations » de ton appareil respecté.',0,'2.6'],
 ['🏰','Domaine 100 % 3D','Ton domaine s’affiche en 3D dès le lancement, sur tous les appareils : l’ancienne vue peinte a disparu.',0,'2.5'],
 ['🎚️','Allure en course','Pendant la course, presse ou retiens ton cheval (▲ / ▼). Bloqué derrière un cheval ? Retiens-le : il garde ses forces pour le sprint. Une ouverture ? Presse-le pour la prendre.',0,'2.5'],
 ['🏇','Écuries rivales','Tes adversaires courent pour 12 écuries, chacune avec sa casaque : tu les recroises de course en course et le jeu retient qui mène le face-à-face. Au départ, leurs chances s’affichent en mots : favori, prétendant, outsider.',0,'2.5'],
 ['⚡','Plus rapide, plus fluide','Écran de chargement animé et domaine construit par étapes. En qualité Auto, le jeu mesure sa fluidité et baisse la résolution si ton appareil peine.',0,'2.5'],
 ['🛟','Aide','Réglages → Aide : signale un problème avec un rapport prêt à copier, et retrouve la confidentialité et les crédits. Avant d’abandonner une course, le jeu te demande confirmation.',0,'2.5'],
 ['🤫','Course sans interruption','Plus de conseils ni de temps forts à choisir pendant la course : tu ne penses qu’à ton couloir, ton sprint et tes sauts. Nouvelle mission : doubler 5 adversaires.',0,'2.4'],
 ['〰️','Déplacements fluides','Les chevaux changent de couloir en douceur, s’orientent et s’inclinent dans le mouvement : plus aucun à-coup à l’image.',0,'2.4'],
 ['✨','Chevaux et jockeys plus réalistes','Robe lustrée qui reflète le ciel, muscles en relief, crinière plus fournie, casaques en soie satinée, reflets lumineux sur l’hippodrome.',0,'2.4'],
 ['🏰','Domaine plus beau','Pierre et tuiles sur les bâtiments, reflets du ciel selon l’heure, herbe plus fine quand tu zoomes.',0,'2.4'],
 ['🏁','Départ commun','Plus de bouton PARTEZ : au GO, les stalles s’ouvrent pour tout le monde en même temps. Ton cheval jaillit selon son Départ, depuis la stalle que le tirage lui a donnée.',0,'2.3'],
 ['🐎','Chevaux solides','Les chevaux ne se traversent plus : pour doubler, il faut trouver l’ouverture sur le côté. Enfermé derrière un cheval, tu cours à son allure, dans son sillage, jusqu’à ce que le passage s’ouvre.',0,'2.3'],
 ['⏱️','Course sans pause','Comme une course en ligne, elle ne s’arrête jamais, même si tu quittes l’écran.',0,'2.3'],
 ['📡','Course en direct','Le nom et la place de chaque partant au-dessus de lui, et le classement en direct avec les écarts en longueurs.',0,'2.3'],
 ['🎮','Nouveau look','Interface repensée façon jeu vidéo : nouvelles polices, néons, boutons et HUD de course plus lisibles.',0,'2.3'],
 ['🏇','Courses de haies','Prix des Haies et Grand Steeple Royal : avant chaque haie, choisis ton élan, prudent ou à fond. Un cheval intelligent et calme fait moins de fautes.',0,'2.2'],
 ['🧠','Chaque qualité compte','Le Départ donne de l’élan, l’Intelligence fait gagner du terrain dans les virages et quand tu es enfermé, le Tempérament garde ton cheval calme dans le peloton.',0,'2.2'],
 ['🌙','Nocturne sous les projecteurs','Nouvelle course, la Nocturne Royale : pylônes allumés et ciel étoilé. Quand il fait nuit chez toi, les courses se courent aussi sous les projecteurs.',0,'2.2'],
 ['🌹','Ton domaine, tes chevaux','Tes chevaux broutent dans les prés du domaine (touche leur nom pour ouvrir leur fiche). Embellis-le à la Boutique : roseraie, kiosque, étang aux cygnes, statue dorée…',0,'2.2'],
 ['🏰','Le domaine en 3D','Ton domaine est construit en volumes : fais-le tourner, zoome sur chaque bâtiment. Les chevaux broutent au pré, galopent sur la piste, et les fenêtres s’allument le soir.',0,'2.1'],
 ['🐎','Chevaux et jockeys en 3D','Des chevaux articulés, avec crinière, queue, robe et balzanes propres à chacun. Au sprint, ton jockey pousse et sort la cravache.',0,'2.1'],
 ['🏟️','Hippodrome en 3D','Tribunes pleines d’une foule qui se lève au passage des chevaux, écran géant du classement en direct, collines, château et nuages selon la météo.',0,'2.1'],
 ['🏗️','Le domaine prend vie','Chaque bâtiment s’améliore pour de vrai : entraînement, soins, allocations, places à l’écurie. Le moulin produit du fourrage même quand tu ne joues pas.',2],
 ['👑','La Couronne','Six Grands Prix contre le Comte de Valmont, jusqu’au Grand Prix de la Couronne. Motifs de casaque exclusifs à la clé.',4],
 ['🔨','Ventes aux enchères','Chaque jour, quatre chevaux à disputer à Valmont. Lis le potentiel estimé, ne paie pas plus qu’il ne vaut.',6],
 ['🎖️','Légendes','Tes champions prennent leur retraite, entrent dans la Salle des trophées et transmettent leur sang au Haras.',0],
 ['⚔️','Duels entre amis','Envoie une course par lien : ton ami la court avec son cheval contre ton fantôme. Les temps sont vérifiés.',0],
 ['⚖️','Courses rééquilibrées','La note d’un cheval reflète sa vraie valeur en course et tous les talents comptent : chaque cheval de ton écurie peut gagner à sa distance.',0]];
const nouveautes=(()=>{const C=career.data,races=()=>C.stats?.races||0;
 const save=()=>{try{localStorage.setItem('trr.progress',JSON.stringify(C))}catch(e){}};
 // dernière version présentée (les parties V2 ont C.v2 = true) ; un nouveau joueur n'a rien à rattraper
 const seen=()=>C.news||(C.v2?'2.0':''),fresh=()=>NOUVEAUTES.filter(x=>(x[4]||'2.0')>seen()),done=()=>{C.news=VERSION;C.v2=true;save()};
 if(!races()&&seen()!==VERSION)done();
 const free=()=>!$('#panel').classList.contains('open')&&!$('#studio').classList.contains('open')&&!coach.open&&!$('#raceScreen').classList.contains('open');
 function open(){const n=races();$('#panelTitle').textContent=`The Royal Race ${VERSION}`;$('#panel .card').classList.add('wide');
  const list=fresh().length?fresh():NOUVEAUTES;
  $('#panelBody').innerHTML=`<p class="hint">Bienvenue dans la version ${VERSION} ! Voici ce qui a changé au domaine.</p><div class="news">${list.map(([i,t,d,at])=>`<article class="news-it"><i>${i}</i><div><b>${t}</b><p>${d}</p>${at>n?`<small>Débloqué après ${at} courses</small>`:''}</div></article>`).join('')}</div>
   <div class="race-entry"><button class="action green" data-news-ok>C’EST PARTI !</button></div>`;$('#panel').classList.add('open')}
 $('#panelBody').addEventListener('click',e=>{if(e.target.closest('[data-news-ok]'))$('#panel').classList.remove('open');else if(e.target.closest('[data-news]')){e.preventDefault();open()}});
 hooks.on('ready',()=>{if(!fresh().length)return;setTimeout(()=>{const t=setInterval(()=>{if(!free())return;clearInterval(t);open();done()},600)},2600)});
 PANELS.nouveautes=open;
 return{open}})();
