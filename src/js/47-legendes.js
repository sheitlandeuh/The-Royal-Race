/* ===== Retraite et Légendes : un cheval qui a fait sa carrière entre dans l'histoire du domaine =====
   Après 10 courses (ou au niveau 12), un cheval peut prendre sa retraite : il libère sa place à l'écurie et devient une Légende.
   Les Légendes restent disponibles au Haras comme reproducteurs (potentiel du poulain +2), et sont exposées dans la Salle des
   trophées (chantier royal construit) : chaque Légende exposée attire des visiteurs (+20 or par heure, voir 45-domaine).
   Les données vivent dans career.data.legendes (lues aussi par l'élevage et le domaine sans dépendre de ce module). */
const legendes=(()=>{const C=career.data;C.legendes=C.legendes||[];const L=C.legendes;
 const save=()=>{try{localStorage.setItem('trr.progress',JSON.stringify(C))}catch(e){}};
 const can=h=>h.races>=10||h.level>=12;
 const title=l=>l.wins>=25?'Légende des pistes':l.wins>=10?'Grand champion':l.places>=10?'Cheval de cœur':'Fidèle compagnon';
 const slots=()=>SALLE_SLOTS[dlv('chantier')]||0;
 // pourquoi ce cheval ne peut-il pas (encore) partir à la retraite ?
 function why(h){if(!can(h))return `Retraite possible après 10 courses (${h.races}/10) ou au niveau 12`;if(h.id===stable.data.active)return 'Engage un autre cheval avant sa retraite';
  if(h.id===tour.horse)return 'Il dispute le Tournoi royal';if(stable.data.horses.length<2)return 'Il te faut au moins un autre cheval';return null}
 function retire(id){const h=stable.byId(id);if(!h||h.id!==id||why(h))return false;
  const snap={id:'L:'+h.id,name:h.name,coat:h.coat,talent:h.talent,dist:h.dist,stats:{...h.stats},caps:{...h.caps},level:h.level,races:h.races,wins:h.wins,places:h.places,age:h.age,parents:h.parents||null,rare:!!h.rare,at:Date.now()};
  if(!stable.removeHorse(id))return false;try{domaine.stock('chantier')}catch(e){}L.push(snap);save();hooks.emit('legende',snap);sound.fanfare();buzz([40,60,40]);ceremony(snap);return true}
 // cérémonie d'adieu
 function ceremony(l){const n=L.indexOf(l)+1,shown=n<=slots();$('#panelTitle').textContent='Une Légende est née';$('#panel .card').classList.remove('wide');
  $('#panelBody').innerHTML=`<div class="chest-pop open legend-pop"><div class="legend-frame"><canvas width="220" height="270" class="lg-pic"></canvas></div><p class="lg-name">${escapeHTML(l.name)}</p><p class="lg-title">🎖️ ${title(l)}</p>
   <p class="hint">${l.races} courses · ${l.wins} victoire${l.wins>1?'s':''} · ${l.places} podium${l.places>1?'s':''} · niveau ${l.level}</p>
   <p class="hint">${shown?'Il rejoint la <b>Salle des trophées</b> : les visiteurs viendront l’admirer (+20 or par heure).':dlv('chantier')?'La Salle des trophées est pleine : agrandis-la pour l’exposer. Il coule des jours heureux au pré.':'Il coule des jours heureux au pré. Construis la <b>Salle des trophées</b> au chantier royal pour l’exposer.'} Il reste disponible au Haras comme reproducteur.</p>
   <button class="action green" data-lg-go>VOIR LES LÉGENDES</button></div>`;$('#panel').classList.add('open');drawPortrait($('.lg-pic'),l,1.2,0)}
 // Salle des trophées : vitrine des coupes et galerie des Légendes
 function open(){const lv=dlv('chantier'),S=slots(),cups=tour.cups||0;$('#panelTitle').textContent=lv?'Salle des trophées':'Légendes du domaine';$('#panel .card').classList.add('wide');
  const rate=lv?domaine.rate('chantier'):0;
  $('#panelBody').innerHTML=`<p class="hint">${lv?`Salle des trophées niveau ${lv} · <b>${Math.min(L.length,S)}/${S}</b> Légendes exposées · visiteurs : <b>+${fmt(rate)} 🪙 par heure</b>.`:'Construis la <b>Salle des trophées</b> au chantier royal (Haras niveau 2) pour exposer tes Légendes et attirer des visiteurs.'} Un cheval peut prendre sa retraite après 10 courses ou au niveau 12 (bouton dans l’écurie).</p>
   <div class="cabinet"><div class="shelf">${cups?Array.from({length:Math.min(cups,12)},()=>'<i>🏆</i>').join('')+(cups>12?`<b>×${cups}</b>`:''):'<small>Aucune coupe pour l’instant : remporte un Tournoi royal.</small>'}</div></div>
   ${L.length?`<div class="legends">${L.map((l,i)=>`<article class="legend${i<S?' shown':''}"><div class="legend-frame"><canvas width="150" height="185" data-lg="${i}"></canvas></div><b>${escapeHTML(l.name)}</b><em>🎖️ ${title(l)}</em>
    <small>${l.races} courses · ${l.wins} victoires · ${l.places} podiums</small><small>${TALENTS[l.talent].i} ${TALENTS[l.talent].n} · ${distName(l.dist)} · retraite le ${new Date(l.at).toLocaleDateString('fr-FR')}</small><span class="lg-where">${i<S?'Exposée':'Au pré'}</span></article>`).join('')}</div>`
    :'<p class="hint" style="text-align:center;margin-top:18px">Aucune Légende pour l’instant. Tes champions y entreront à la fin de leur carrière.</p>'}`;
  $('#panel').classList.add('open');$$('#panelBody canvas[data-lg]').forEach(cv=>drawPortrait(cv,L[+cv.dataset.lg],1.2,-2))}
 // bouton dans l'écurie
 hooks.on('stable:render',h=>{const row=$('#panelBody .st-row');if(!row||!h)return;const w=why(h);if(!can(h)&&h.races<5)return;
  row.insertAdjacentHTML('beforeend',`<button class="action legend-btn" data-retire="${h.id}" ${w?`disabled title="${w}"`:''}>🎖️ RETRAITE</button>`);if(w&&can(h))row.insertAdjacentHTML('afterend',`<p class="hint" style="margin:6px 0 0">🎖️ ${w}.</p>`)});
 $('#panelBody').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;
  if(b.dataset.retire){const h=stable.byId(b.dataset.retire);if(!b.dataset.armed){b.dataset.armed=1;b.textContent=`CONFIRMER : ${h.name} prend sa retraite`;setTimeout(()=>{if(b.isConnected){delete b.dataset.armed;b.textContent='🎖️ RETRAITE'}},4000);return}retire(b.dataset.retire)}
  else if(b.hasAttribute('data-lg-go'))open()});
 PANELS.legendes=open;
 // pour les tests
 const debug={fill(){if(L.length)return;[['Tonnerre d’Antan','noir','finisseur',2000],['Reine des Prés','gris','increvable',2400]].forEach(([n,c,t,d],i)=>L.push({id:'L:t'+i,name:n,coat:c,talent:t,dist:d,stats:{vit:84,acc:82,end:80,dep:75,tac:78,tem:80},caps:{vit:96,acc:94,end:95,dep:90,tac:92,tem:92},level:18,races:40,wins:18+i*9,places:28,age:7,parents:null,rare:false,at:Date.now()-864e5*(20-i)}));save()}};
 return{open,retire,why,can,title,slots,debug,get list(){return L}}})();
