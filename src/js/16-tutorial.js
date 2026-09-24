/* ===== Tutoriel : conseils de l’entraîneur, affichés une seule fois ===== */
const coach=(()=>{const el=document.createElement('div');el.className='coach';el.innerHTML='<div class="coach-face">🎩</div><div class="coach-body"><b>Maître Armand, entraîneur</b><p></p><button class="action green">COMPRIS</button></div>';el.hidden=true;$('#game').appendChild(el);
 // une seule attente à la fois : deux conseils demandés pendant qu'un panneau est ouvert ne doivent pas s'afficher l'un sur l'autre
 let queue=[],ring=null,wait=0;const later=ms=>{if(!wait)wait=setTimeout(next,ms)};const hide=()=>{el.hidden=true;ring?.remove();ring=null;if(queue.length)later(250)};el.querySelector('button').onclick=hide;
 function next(){wait=0;if(!el.hidden||!queue.length)return;if($('#panel').classList.contains('open')&&!$('#raceScreen').classList.contains('open')||$('#studio').classList.contains('open'))return later(700);const[k,txt,sel]=queue.shift();el.querySelector('p').innerHTML=txt;el.hidden=false;hooks.emit('tip',k);const t=sel&&$(sel);el.classList.remove('top');if(t&&t.offsetParent){const r=t.getBoundingClientRect(),g=$('#game').getBoundingClientRect();// cible dans le bas de l'écran : la bulle passe en haut pour ne pas la cacher
  if(r.top-g.top>g.height*.55&&!$('#raceScreen').classList.contains('open'))el.classList.add('top');ring=document.createElement('div');ring.className='coach-ring';Object.assign(ring.style,{left:r.left-g.left-6+'px',top:r.top-g.top-6+'px',width:r.width+12+'px',height:r.height+12+'px'});$('#game').appendChild(ring)}}
 function tip(k,txt,sel){if(!career.tip(k))return;queue.push([k,txt,sel]);next()}
 // en course, un conseil affiché met la simulation en pause (le joueur lit sans être pénalisé)
 return{tip,hide,get open(){return !el.hidden}}})();
// premiers pas : après la création du champion
champion.on(()=>{setTimeout(()=>{coach.tip('welcome',`Bienvenue au domaine ! <b>${escapeHTML(HN())}</b> est prêt pour sa première course. Touche <b>COURIR</b> : le reste du domaine s’ouvrira au fil de tes courses.`,'#playBtn')},600)});
if(champion.exists()&&career.data.stats?.races>=1)setTimeout(()=>coach.tip('missions','Nouveau : 3 missions quotidiennes, des ligues et le Derby du Royaume chaque semaine. Touche le parchemin pour commencer.','[data-panel=missions]'),1800);
career.badges();{const s1=sync;sync=function(){s1();career.badges()}}
apply();
