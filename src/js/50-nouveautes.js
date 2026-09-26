/* ===== Quoi de neuf dans la V2 : présenté une seule fois aux joueurs qui avaient déjà commencé leur partie =====
   Un nouveau joueur découvre tout au fil des déblocages (35-onboarding) : il ne voit jamais cet écran. */
const NOUVEAUTES=[
 ['🏗️','Le domaine prend vie','Chaque bâtiment s’améliore pour de vrai : entraînement, soins, allocations, places à l’écurie. Le moulin produit du fourrage même quand tu ne joues pas.',2],
 ['👑','La Couronne','Six Grands Prix contre le Comte de Valmont, jusqu’au Grand Prix de la Couronne. Motifs de casaque exclusifs à la clé.',4],
 ['🔨','Ventes aux enchères','Chaque jour, quatre chevaux à disputer à Valmont. Lis le potentiel estimé, ne paie pas plus qu’il ne vaut.',6],
 ['🎖️','Légendes','Tes champions prennent leur retraite, entrent dans la Salle des trophées et transmettent leur sang au Haras.',0],
 ['⚔️','Duels entre amis','Envoie une course par lien : ton ami la court avec son cheval contre ton fantôme. Les temps sont vérifiés.',0],
 ['⚖️','Courses rééquilibrées','La note d’un cheval reflète sa vraie valeur en course et tous les talents comptent : chaque cheval de ton écurie peut gagner à sa distance.',0]];
const nouveautes=(()=>{const C=career.data,races=()=>C.stats?.races||0;
 const save=()=>{try{localStorage.setItem('trr.progress',JSON.stringify(C))}catch(e){}};
 if(!C.v2&&!races()){C.v2=true;save()}
 const free=()=>!$('#panel').classList.contains('open')&&!$('#studio').classList.contains('open')&&!coach.open&&!$('#raceScreen').classList.contains('open');
 function open(){const n=races();$('#panelTitle').textContent=`The Royal Race ${VERSION}`;$('#panel .card').classList.add('wide');
  $('#panelBody').innerHTML=`<p class="hint">Bienvenue dans la version ${VERSION} ! Voici ce qui a changé au domaine.</p><div class="news">${NOUVEAUTES.map(([i,t,d,at])=>`<article class="news-it"><i>${i}</i><div><b>${t}</b><p>${d}</p>${at>n?`<small>Débloqué après ${at} courses</small>`:''}</div></article>`).join('')}</div>
   <div class="race-entry"><button class="action green" data-news-ok>C’EST PARTI !</button></div>`;$('#panel').classList.add('open')}
 $('#panelBody').addEventListener('click',e=>{if(e.target.closest('[data-news-ok]'))$('#panel').classList.remove('open');else if(e.target.closest('[data-news]')){e.preventDefault();open()}});
 hooks.on('ready',()=>{if(C.v2)return;setTimeout(()=>{const t=setInterval(()=>{if(!free())return;clearInterval(t);C.v2=true;save();open()},600)},2600)});
 PANELS.nouveautes=open;
 return{open}})();
