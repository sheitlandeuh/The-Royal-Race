/* ===== Jockeys : un choix avant chaque course, une équipe à constituer, des jockeys qui progressent =====
   Chaque jockey a une spécialité qui modifie les paramètres de course du joueur (appliquée avant l'enregistrement du rejeu :
   la course reste rejouable à l'identique). Il gagne un niveau toutes les 5 courses montées (niveau 5 au plus) : sa spécialité
   se renforce de 15 % par niveau. Débloqué après 4 courses. */
const JOCKEYS=[
 {id:'paul',n:'Paul Garnier',c:'#7a8a99',price:0,spe:'Polyvalent',d:'Le jockey maison : fiable, sans spécialité.',fx:()=>({}),fit:()=>0},
 {id:'lea',n:'Léa Martin',c:'#e0567a',price:5000,spe:'Départ éclair',d:'Fenêtre de réaction aux stalles élargie (+40 ms).',fx:k=>({window:40*k}),fit:m=>m.dist<=1200?1:0},
 {id:'hugo',n:'Hugo Bernard',c:'#e89b2e',price:8000,spe:'Finisseur',d:'Sprint final plus puissant (+4 %).',fx:k=>({sprintMul:1+.04*k}),fit:m=>m.dist>=1600&&m.dist<=2000?1:0},
 {id:'ines',n:'Inès Dubois',c:'#3aa0e0',price:8000,spe:'Tacticienne',d:'Profite mieux des sillages (+25 %) et se dégage plus vite quand elle est enfermée.',fx:k=>({draftMul:1+.25*k,boxed:.015*k}),fit:()=>0},
 {id:'victor',n:'Victor Laurent',c:'#4caf6a',price:10000,league:1,spe:'Économe',d:'Ménage sa monture : −4 % d’énergie dépensée en course.',fx:k=>({drainMul:1-.04*k}),fit:m=>m.dist>=2000||m.terrain!=='bon'?1:-0},
 {id:'chloe',n:'Chloé Moreau',c:'#9a6cd6',price:12000,league:1,spe:'Sprint long',d:'Peut lancer son sprint de plus loin : il coûte 3 % d’énergie en moins.',fx:k=>({sprintDrainMul:1-.03*k}),fit:m=>m.dist>=2000?1:0}];
const jockeys=(()=>{const C=career.data;C.jockeys=C.jockeys||{owned:['paul'],sel:'paul',xp:{}};const J=C.jockeys;
 const save=()=>{try{localStorage.setItem('trr.progress',JSON.stringify(C))}catch(e){}};
 const byId=id=>JOCKEYS.find(j=>j.id===id)||JOCKEYS[0],lvl=id=>Math.min(5,Math.floor((J.xp[id]||0)/5)),power=id=>1+.15*lvl(id);
 const initials=n=>n.split(' ').map(w=>w[0]).join('');
 // effet sur les paramètres de course du joueur — priorité haute : avant l'enregistrement du rejeu
 hooks.on('race:start',()=>{if(!racePlayer)return;const j=byId(J.sel),f=j.fx(power(j.id)),o={...racePlayer};
  if(f.window)o.window+=f.window;if(f.sprintMul)o.sprint*=f.sprintMul;if(f.draftMul)o.draft*=f.draftMul;if(f.boxed)o.boxed+=f.boxed;if(f.drainMul)o.drain*=f.drainMul;if(f.noiseMul)o.noise*=f.noiseMul;if(f.sprintDrainMul)o.sprintDrain*=f.sprintDrainMul;
  o.jockey=j.id;racePlayer=o},5);
 hooks.on('race:end',()=>{const id=J.sel,before=lvl(id);J.xp[id]=(J.xp[id]||0)+1;save();if(lvl(id)>before)setTimeout(()=>toast(`${byId(id).n} passe niveau ${lvl(id)} : sa spécialité se renforce !`),1200)});
 function pick(id){const j=byId(id);if(J.owned.includes(id)){J.sel=id;save();return true}
  if(j.league&&career.league()<j.league)return toast(`${j.n} ne monte qu’en ligue ${LEAGUES[j.league].n}`),false;
  if(state.gold<j.price)return toast('Or insuffisant'),false;state.gold-=j.price;J.owned.push(id);J.sel=id;save();sync();sound.coin();toast(`${j.n} rejoint ton écurie !`);return true}
 const badge=j=>`<span class="jk-face" style="--c:${j.c}">${initials(j.n)}</span>`;
 function block(m=RACE){const s=byId(J.sel);return `<div class="jockeys-block"><h4 style="margin-top:14px">JOCKEY <em>${badge(s)} ${escapeHTML(s.n)}</em></h4><div class="jockeys">${JOCKEYS.map(j=>{const own=J.owned.includes(j.id),lock=j.league&&career.league()<j.league,f=j.fit(m),L=lvl(j.id);
  return `<button data-jockey="${j.id}" class="${J.sel===j.id?'on':''}${lock?' locked':''}">${badge(j)}<b>${escapeHTML(j.n)}</b><small class="jk-spe">${j.spe}${own&&j.price?` · niv. ${L}`:''}</small><small>${j.d}</small>${f>0?'<em class="suit ideal">✓ Conseillé ici</em>':''}${own?'':`<span class="price">${lock?'🔒 Ligue '+LEAGUES[j.league].n:'🪙 '+fmt(j.price)}</span>`}</button>`}).join('')}</div></div>`}
 hooks.on('courses:render',()=>{const h=[...$$('#panelBody h4')].find(x=>x.textContent.startsWith('ÉQUIPEMENT'));if(h)h.insertAdjacentHTML('beforebegin',block())});
 $('#panelBody').addEventListener('click',e=>{const b=e.target.closest('[data-jockey]');if(!b)return;if(pick(b.dataset.jockey))renderCourses()});
 // le jockey apparaît dans le bandeau de course
 hooks.on('race:header',()=>{const j=byId(J.sel);$('#autoGallop span').textContent=`${HN()} · ${j.n}`});
 return{get sel(){return byId(J.sel)},lvl,block,byId,get owned(){return J.owned}}})();
