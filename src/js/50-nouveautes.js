/* ===== Quoi de neuf : présenté une seule fois par version aux joueurs qui avaient déjà commencé leur partie (seulement ce qu'ils n'ont pas encore vu) =====
   Un nouveau joueur découvre tout au fil des déblocages (35-onboarding) : il ne voit jamais cet écran. */
const NOUVEAUTES=[
 ['🏁','Départ commun','Plus de bouton PARTEZ : au GO, les stalles s’ouvrent pour tout le monde en même temps. Ton cheval jaillit selon son Départ, depuis la stalle que le tirage lui a donnée.',0,'2.3'],
 ['🐎','Chevaux solides','Les chevaux ne se traversent plus : pour doubler, il faut trouver l’ouverture sur le côté. Enfermé derrière un cheval, tu cours à son allure, dans son sillage, jusqu’à ce que le passage s’ouvre.',0,'2.3'],
 ['⏱️','Course sans pause','Comme une course en ligne, elle ne s’arrête jamais, même si tu quittes l’écran. Les conseils de Maître Armand s’affichent en bandeau, sans rien bloquer.',0,'2.3'],
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
