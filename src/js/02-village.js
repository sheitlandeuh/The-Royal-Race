/* ===== Domaine : bâtiments, étiquettes, sélection =====
   Depuis la 2.5, le domaine est entièrement en 3D (51-domaine3d) : plus de peinture. Ce module crée, pour chaque bâtiment,
   l'étiquette (nom + niveau), le minuteur de travaux et un bouton accessible au clavier, dans le calque #d3ui que le domaine 3D
   place à l'écran par projection ; il tient la sélection (select / deselect, appelés au toucher d'un bâtiment en 3D).
   45-domaine remplit la carte du bâtiment sélectionné et ajoute les bulles de récolte dans le même calque. */
const VILLAGE={order:['hippodrome','carriere','haras','clinique','ecurie','chantier','moulin','paddocks']};
/* bâtiments : nom, icône, rôle — niveaux, travaux et effets dans 45-domaine */
const BUILDINGS={
 haras:{name:'Haras Royal',icon:'🏰',desc:'Le cœur du domaine : il limite le niveau des autres bâtiments.'},
 hippodrome:{name:'Hippodrome Royal',icon:'🏁',desc:'Toutes les courses du domaine s’y disputent.'},
 clinique:{name:'Clinique vétérinaire',icon:'🩺',desc:'Soins, repos et guérison des blessures.'},
 ecurie:{name:'Écurie des champions',icon:'🐴',desc:'Les boxes de tes chevaux.'},
 moulin:{name:'Moulin du domaine',icon:'🌾',desc:'Produit du fourrage, même quand tu ne joues pas.'},
 paddocks:{name:'Paddocks royaux',icon:'🌿',desc:'Travail en extérieur et repos au pré.'},
 carriere:{name:'Carrière d’entraînement',icon:'🏇',desc:'Dressage, fractionné et galop en groupe.'},
 chantier:{name:'Chantier royal',icon:'🏗️',desc:'Ici s’élèvera la Salle des trophées.'}
};
const village=(()=>{
 const ui=document.createElement('div');ui.id='d3ui';$('#world').appendChild(ui);
 const els={};let selected=null,onSelect=()=>{};
 for(const id of VILLAGE.order){const b=BUILDINGS[id];
  const tag=document.createElement('div');tag.className='bld-tag';tag.dataset.id=id;tag.innerHTML=`<span>${b.icon}</span><em>${b.name}</em><i hidden></i>`;
  const timer=document.createElement('div');timer.className='bld-timer';timer.dataset.id=id;
  const hit=document.createElement('button');hit.className='bld-hit';hit.dataset.id=id;hit.setAttribute('aria-label',b.name);hit.addEventListener('click',()=>select(id));
  ui.append(tag,timer,hit);els[id]={tag,timer,hit}}
 function select(id){if(!id)return deselect();if(selected&&selected!==id)deselect(true);const e=els[id];selected=id;e.tag.classList.add('show');e.timer.classList.remove('show');navigator.vibrate?.(8);onSelect(id)}
 function deselect(keepCard){if(!selected)return;const e=els[selected];e.tag.classList.remove('show');if(e.timer.dataset.on)e.timer.classList.add('show');selected=null;if(!keepCard)$('#selection').classList.remove('open')}
 return{select,deselect,get selected(){return selected},get els(){return els},get layer(){return ui},
  setTimer(id,text){const t=els[id].timer;t.innerHTML=`🔨 <b>${text}</b>`;t.dataset.on=1;t.classList.toggle('show',selected!==id)},clearTimer(id){const t=els[id].timer;delete t.dataset.on;t.classList.remove('show')},
  setTag(id,name,lvl){const t=els[id].tag,i=t.querySelector('i');t.querySelector('em').textContent=name;i.hidden=lvl==null;if(lvl!=null)i.textContent=lvl},set onSelect(f){onSelect=f}};
})();
/* écran titre : reste affiché jusqu'à la première image du domaine 3D ; step() montre l'étape en cours. Sans WebGL 2, ou si le
   domaine n'a pas pu se construire, il l'explique au lieu d'afficher un domaine vide (le jeu entier a besoin de la 3D). */
const splash=(()=>{const sp=$('#splash');let done=false,late=0;const hide=()=>{if(done)return;done=true;clearTimeout(late);setTimeout(()=>sp.classList.add('gone'),250)};
 function step(t){const e=sp.querySelector('em');if(e)e.textContent=t}
 function fail(title,txt){if(done)return;clearTimeout(late);const box=sp.querySelector('div');box.classList.add('fail');box.querySelector('i')?.remove();
  step(title);let p=box.querySelector('p');if(!p){p=document.createElement('p');box.appendChild(p)}p.innerHTML=txt;
  if(!box.querySelector('button')){const b=document.createElement('button');b.className='action green';b.textContent='RECHARGER';b.onclick=()=>location.reload();box.appendChild(b)}}
 // construction anormalement longue (appareil très lent, pilote graphique bloqué) : proposer de recharger, sans cacher l'écran
 late=setTimeout(()=>{if(!done){const box=sp.querySelector('div');if(!box.querySelector('button')){const b=document.createElement('button');b.className='action';b.textContent='RECHARGER';b.onclick=()=>location.reload();box.appendChild(b)}step('Le domaine met du temps à se construire…')}},45000);
 return{hide,step,fail,get done(){return done}}})();
