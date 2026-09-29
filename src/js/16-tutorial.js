/* ===== Tutoriel : conseils de l’entraîneur, affichés une seule fois ===== */
const coach=(()=>{const el=document.createElement('div');el.className='coach';el.innerHTML='<div class="coach-face">🎩</div><div class="coach-body"><b>Maître Armand, entraîneur</b><p></p><button class="action green">COMPRIS</button></div>';el.hidden=true;$('#game').appendChild(el);
 // une seule attente à la fois : deux conseils demandés pendant qu'un panneau est ouvert ne doivent pas s'afficher l'un sur l'autre
 let queue=[],ring=null,wait=0;const later=ms=>{if(!wait)wait=setTimeout(next,ms)};const hide=()=>{el.hidden=true;ring?.remove();ring=null;if(queue.length)later(250)};el.querySelector('button').onclick=hide;
 function next(){wait=0;if(!el.hidden||!queue.length)return;const inRace=$('#raceScreen').classList.contains('open');if($('#panel').classList.contains('open')&&!inRace||$('#studio').classList.contains('open'))return later(700);
  // en course : seuls les conseils qui visent l'écran de course s'affichent (les autres attendent la fin de la course)
  const qi=inRace?queue.findIndex(q=>q[2]&&$(q[2])&&$('#raceScreen').contains($(q[2]))):0;if(qi<0)return later(1500);const[k,txt,sel]=queue.splice(qi,1)[0];el.classList.toggle('in-race',inRace);clearTimeout(el._t);if(inRace)el._t=setTimeout(hide,7000);el.querySelector('p').innerHTML=txt;el.hidden=false;hooks.emit('tip',k);const t=sel&&$(sel);el.classList.remove('top');if(t&&t.offsetParent&&!inRace){const r=t.getBoundingClientRect(),g=$('#game').getBoundingClientRect();// cible dans le bas de l'écran : la bulle passe en haut pour ne pas la cacher
  if(r.top-g.top>g.height*.55&&!$('#raceScreen').classList.contains('open'))el.classList.add('top');ring=document.createElement('div');ring.className='coach-ring';Object.assign(ring.style,{left:r.left-g.left-6+'px',top:r.top-g.top-6+'px',width:r.width+12+'px',height:r.height+12+'px'});$('#game').appendChild(ring)}}
 function tip(k,txt,sel){if($('#raceScreen').classList.contains('open'))return;if(!career.tip(k))return;queue.push([k,txt,sel]);next()}
 // en course : aucun conseil (la course ne s'interrompt jamais, rien ne s'affiche par-dessus)
 return{tip,hide,get open(){return !el.hidden}}})();
// premiers pas : après la création du champion
champion.on(()=>{setTimeout(()=>{coach.tip('welcome',`Bienvenue au domaine ! <b>${escapeHTML(HN())}</b> est prêt pour sa première course. Touche <b>COURIR</b> : le reste du domaine s’ouvrira au fil de tes courses.`,'#playBtn')},600)});
if(champion.exists()&&career.data.stats?.races>=1)setTimeout(()=>coach.tip('missions','Nouveau : 3 missions quotidiennes, des ligues et le Derby du Royaume chaque semaine. Touche le parchemin pour commencer.','[data-panel=missions]'),1800);
career.badges();{const s1=sync;sync=function(){s1();career.badges()}}
apply();
