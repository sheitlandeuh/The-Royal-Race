/* ===== Palmarès : succès à collectionner (récompensés en gemmes), vitrine des coupes et statistiques de carrière ===== */
const palmares=(()=>{const C=career.data;C.pal=C.pal||{got:[],seen:[],s3:0,lourd:0,dists:[],streak:0,foals:0,lvl:1,horses:1};const A=C.pal;
 const save=()=>{try{localStorage.setItem('trr.progress',JSON.stringify(C))}catch(e){}};
 const S=()=>C.stats||{races:0,wins:0};
 const LIST=[
  ['win1','Première victoire','🥇','Gagne ta première course',()=>S().wins,1,{gems:5}],
  ['race25','Habitué du paddock','🐎','Dispute 25 courses',()=>S().races,25,{gold:5000}],
  ['win10','Dix victoires','🏅','Gagne 10 courses',()=>S().wins,10,{gems:15}],
  ['s3','Course parfaite','⭐','Obtiens 3 ★ dans une course',()=>A.s3,1,{gems:10}],
  ['s3x10','Maître jockey','🌟','Obtiens 3 ★ dans 10 courses',()=>A.s3,10,{gems:30}],
  ['lourd','Roi de la boue','🌧️','Gagne une course sur terrain lourd',()=>A.lourd,1,{gems:15}],
  ['dists','Polyvalent','📏','Gagne sur 1 200, 1 600, 2 000 et 2 400 m',()=>A.dists.length,4,{gems:25}],
  ['streak5','Invincible','🔥','Enchaîne 5 victoires',()=>A.streak,5,{gems:30}],
  ['rival5','Némésis','🎩','Devance Black Majesty 5 fois',()=>rival.rec.w,5,{gems:20}],
  ['cup1','Vainqueur de tournoi','🏆','Remporte un Tournoi royal',()=>tour.cups,1,{gems:25}],
  ['foal','Éleveur','🐣','Fais naître un poulain au Haras',()=>A.foals,1,{gems:15}],
  ['lvl10','Champion confirmé','💪','Amène un cheval au niveau 10',()=>A.lvl,10,{gems:20}],
  ['stable6','Grande écurie','🏡','Possède 6 chevaux',()=>A.horses,6,{gems:20}],
  ['gear','Sellier royal','🧰','Possède tout l’équipement',()=>gear.owned.length,GEAR.length,{gems:20}],
  ['or','Ligue Or','🟡','Atteins la ligue Or',()=>C.best||0,900,{gems:30}],
  ['cup5','Seigneur des tournois','👑','Remporte 5 Tournois royaux',()=>tour.cups,5,{gems:60}],
  ['win50','Légende des pistes','🏛️','Gagne 50 courses',()=>S().wins,50,{gems:50}],
  ['royale','Ligue Royale','💜','Atteins la ligue Royale',()=>C.best||0,1800,{gems:80}],
  // V2 : domaine, ventes, Légendes, duels, Couronne (lus dans les données, sans dépendre des modules chargés plus loin)
  ['batisseur','Bâtisseur','🏗️','Monte un bâtiment au niveau 3',()=>Math.max(1,...Object.values(domainLv)),3,{gems:10}],
  ['domaine5','Domaine royal','🏰','Monte les sept bâtiments au niveau 5',()=>Math.min(...['haras','hippodrome','ecurie','carriere','paddocks','clinique','moulin'].map(dlv)),5,{gems:60}],
  ['enchere','Coup de marteau','🔨','Achète un cheval aux enchères',()=>C.ventes?.bought||0,1,{gems:10}],
  ['legende','Entrée dans l’histoire','🎖️','Mets un cheval à la retraite',()=>(C.legendes||[]).length,1,{gems:15}],
  ['duel3','Duelliste','⚔️','Gagne 3 duels contre des amis',()=>{try{return JSON.parse(localStorage.getItem('trr.duels')||'{}').wins||0}catch(e){return 0}},3,{gems:15}],
  ['couronne','Vainqueur de la Couronne','👑','Remporte le Grand Prix de la Couronne',()=>(C.couronne?.done||[]).includes('c6')?1:0,1,{gems:80}]].map(([id,n,i,d,p,goal,r])=>({id,n,i,d,p,goal,r}));
 const rtxt=r=>r.gems?`💎 ${r.gems}`:`🪙 ${fmt(r.gold)}`,done=a=>{try{return a.p()>=a.goal}catch(e){return false}};
 function sample(){const H=stable.data.horses;A.horses=Math.max(A.horses,H.length);A.lvl=Math.max(A.lvl,...H.map(h=>h.level));A.foals=Math.max(A.foals,H.filter(h=>h.parents).length)}
 function check(silent){sample();let n=0;for(const a of LIST){if(done(a)&&!A.seen.includes(a.id)){A.seen.push(a.id);if(!silent)toast(`${a.i} Succès débloqué : ${a.n}`);n++}}save();badge();return n}
 function onRace(rank,stars){if(stars===3)A.s3++;if(rank===1){if(RACE.terrain==='lourd')A.lourd++;if(!A.dists.includes(RACE.dist))A.dists.push(RACE.dist)}A.streak=Math.max(A.streak,meta.streak);check()}
 function claim(id){const a=LIST.find(x=>x.id===id);if(!a||A.got.includes(id)||!done(a))return;A.got.push(id);state.gold+=a.r.gold||0;state.gems+=a.r.gems||0;save();sync();sound.coin();buzz(20);open()}
 function badge(){const b=$('[data-panel=palmares] .badge');if(!b)return;const n=LIST.filter(a=>done(a)&&!A.got.includes(a.id)).length;b.textContent=n;b.hidden=!n}
 function open(){sample();$('#panelTitle').textContent='Palmarès';$('#panel .card').classList.add('wide');const st=S(),pct=st.races?Math.round(st.wins/st.races*100):0,got=LIST.filter(done).length;
  const order=[...LIST].sort((x,y)=>{const f=a=>A.got.includes(a.id)?2:done(a)?0:1;return f(x)-f(y)||(f(x)===1?(y.p()/y.goal)-(x.p()/x.goal):0)});
  $('#panelBody').innerHTML=`<div class="cabinet"><div class="shelf">${tour.cups?Array.from({length:Math.min(tour.cups,12)},()=>'<i>🏆</i>').join('')+(tour.cups>12?`<b>×${tour.cups}</b>`:''):'<small>Ta vitrine est vide : remporte un Tournoi royal pour y exposer ta première coupe.</small>'}</div>
   <div class="kpis"><div><b>${fmt(st.races)}</b><small>courses</small></div><div><b>${fmt(st.wins)}</b><small>victoires</small></div><div><b>${pct} %</b><small>réussite</small></div><div><b>${fmt(C.best||0)}</b><small>record de trophées</small></div><div><b>${rival.rec.w}–${rival.rec.l}</b><small>contre Valmont</small></div></div></div>
   <p class="hint">Succès : <b>${got} / ${LIST.length}</b> débloqués. Chaque succès rapporte des gemmes.</p>
   <div class="achs">${order.map(a=>{const v=Math.min(a.goal,a.p()),ok=v>=a.goal,g=A.got.includes(a.id);return `<article class="ach${ok?' ok':''}${g?' got':''}"><i>${a.i}</i><div><b>${a.n}</b><small>${a.d}</small><div class="bar"><i style="width:${v/a.goal*100}%"></i></div><small>${a.goal>=1000?fmt(v)+' / '+fmt(a.goal):v+' / '+a.goal}</small></div>${g?'<span class="chip">✓</span>':`<button class="action green" data-ach="${a.id}" ${ok?'':'disabled'}>${rtxt(a.r)}</button>`}</article>`}).join('')}</div>`;
  $('#panel').classList.add('open')}
 $('#panelBody').addEventListener('click',e=>{const b=e.target.closest('[data-ach]');if(b)claim(b.dataset.ach)});
 check(true);['domaine:fini','legende','couronne','vente:fin'].forEach(e=>hooks.on(e,()=>check()));hooks.on('duel:end',()=>setTimeout(()=>check(),50));
 return{open,onRace,check,badge}})();
