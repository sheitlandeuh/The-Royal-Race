/* ===== Domaine : bâtiments à niveaux, ouvriers, travaux en temps réel, production du moulin et de la Salle des trophées =====
   Chaque niveau a un effet réel (formules DOMAIN_FX dans 01-core, lues par l'écurie, l'élevage et la course).
   Les autres bâtiments peuvent dépasser le Haras d'un niveau au plus ; ses propres niveaux 3, 4 et 5 demandent les ligues Argent, Or et Royale.
   Les travaux avancent jeu fermé ; on peut les terminer tout de suite avec des gemmes (1 💎 par tranche de 6 minutes restantes).
   Le moulin produit du fourrage et la Salle des trophées attire des visiteurs (or), à récolter : réserve plafonnée à 10 h de production. */
const BATIMENTS={
 haras:{max:5,k:1.6,t:1.5,fx:l=>[`Autres bâtiments jusqu’au niveau ${Math.min(5,l+1)}`,l>1?`Poulains : potentiel +${String((l-1)*1.5).replace('.',',')} · naissance en ${dureeTxt(breedMin(l))}`:`Poulains : naissance en ${dureeTxt(breedMin(l))}`,l>=4?'3 ouvriers au lieu de 2':null]},
 hippodrome:{max:5,k:1.3,t:1.2,fx:l=>[l>1?`Allocations des courses +${(l-1)*6} %`:'Allocations des courses de base']},
 clinique:{max:5,k:1,t:1,fx:l=>l>1?[`Soins vétérinaires −${(l-1)*12} %`,`Risque et durée des blessures −${(l-1)*12} %`]:['Soins vétérinaires : 3 000 or','Blessures : 30 min de repos']},
 ecurie:{max:5,k:1.2,t:1.1,fx:l=>[`${DOMAIN_FX.ecurie(l)} places pour tes chevaux`]},
 moulin:{max:5,k:.8,t:.8,fx:l=>[`${DOMAIN_FX.moulin(l)} 🌾 produits par heure`,`Réserve : ${fmt(DOMAIN_FX.moulin(l)*10)} 🌾`]},
 paddocks:{max:5,k:.8,t:.9,fx:l=>[l>1?`Récupération de la fatigue +${(l-1)*20} %`:'Récupération : 9 points de fatigue par heure',`Repos au pré : fatigue −${Math.round(30*DOMAIN_FX.paddocks(l))}`]},
 carriere:{max:5,k:1,t:1,fx:l=>[l>1?`Gains d’entraînement +${(l-1)*5} %`:'Gains d’entraînement de base']},
 chantier:{max:3,fx:l=>l?[`${SALLE_OR[l]} 🪙 de visiteurs par heure`,`Réserve : ${fmt(SALLE_OR[l]*10)} 🪙`]:['Pas encore construite']}};
const SALLE_OR=[0,90,180,320];
const dureeTxt=m=>m<1?`${Math.max(1,Math.round(m*60))} s`:m<60?`${Math.round(m)} min`:`${Math.floor(m/60)} h${Math.round(m%60)?' '+String(Math.round(m%60)).padStart(2,'0'):''}`;
const domaine=(()=>{const C=career.data;C.domaine=C.domaine||{lv:{},work:[],prod:{}};const D=C.domaine;
 // les niveaux lus au démarrage (01-core) et ceux de la sauvegarde ne font qu'un seul objet
 Object.assign(domainLv,D.lv);D.lv=domainLv;D.work=D.work||[];D.prod=D.prod||{};
 const save=()=>{try{localStorage.setItem('trr.progress',JSON.stringify(C))}catch(e){}};
 const COST=[0,0,10000,32000,85000,210000],TIME=[0,0,3,20,90,240],SALLE_COST=[0,25000,90000,240000],SALLE_TIME=[0,30,120,360];
 const name=id=>id==='chantier'&&dlv(id)>0?'Salle des trophées':BUILDINGS[id].name,icon=id=>id==='chantier'&&dlv(id)>0?'🏛️':BUILDINGS[id].icon;
 const builders=()=>dlv('haras')>=4?3:2,busy=id=>D.work.find(w=>w.id===id),free=()=>builders()-D.work.length;
 const cost=(id,to)=>id==='chantier'?SALLE_COST[to]:Math.round(COST[to]*BATIMENTS[id].k/500)*500,minutes=(id,to)=>id==='chantier'?SALLE_TIME[to]:TIME[to]*BATIMENTS[id].t;
 const unlocked=()=>!document.body.classList.contains('lk-domaine');
 // pourquoi ce bâtiment ne peut-il pas monter d'un niveau ?
 function block(id){const to=dlv(id)+1,B=BATIMENTS[id];if(to>B.max)return 'Niveau maximal';
  if(id==='haras'){const L={3:1,4:2,5:3}[to];if(L&&career.league()<L)return `Ligue ${LEAGUES[L].n} requise`}
  else if(id==='chantier'){if(dlv('haras')<to+1)return `Haras niveau ${to+1} requis`}
  else if(to>dlv('haras')+1)return `Haras niveau ${to-1} requis`;return null}
 // ---------- production (moulin : fourrage, Salle des trophées : or) ----------
 const PROD={moulin:{res:'feed',ico:'🌾',rate:l=>DOMAIN_FX.moulin(l)},chantier:{res:'gold',ico:'🪙',rate:l=>SALLE_OR[l]||0}};
 const cap=id=>PROD[id].rate(dlv(id))*10;
 function settle(id){const P=D.prod[id]=D.prod[id]||{t:Date.now(),stock:0},now=Date.now();P.stock=Math.min(cap(id),P.stock+PROD[id].rate(dlv(id))*Math.max(0,now-P.t)/36e5);P.t=now;return P}
 const stock=id=>Math.floor(settle(id).stock);
 function collect(id,from){const n=stock(id);if(n<1)return toast(dlv(id)?'Rien à récolter pour l’instant':'Bâtiment pas encore construit');D.prod[id].stock-=n;state[PROD[id].res]+=n;save();sync();sound.coin();buzz(15);
  if(from)flyText(from,`+${fmt(n)} ${PROD[id].ico}`);else toast(`+${fmt(n)} ${PROD[id].ico} récoltés`);hooks.emit('domaine:recolte',id,n);refresh()}
 // ---------- travaux ----------
 function start(id){const to=dlv(id)+1,why=block(id);if(why)return toast(why);if(busy(id))return toast('Travaux déjà en cours ici');if(free()<1)return toast('Tous tes ouvriers sont occupés');
  const c=cost(id,to);if(state.gold<c)return toast(`Il te manque ${fmt(c-state.gold)} or`);state.gold-=c;sync();
  if(PROD[id])settle(id);const m=minutes(id,to);D.work.push({id,to,start:Date.now(),ends:Date.now()+m*6e4});save();sound.coin();buzz(20);hooks.emit('domaine:travaux',id,to);
  toast(`Travaux lancés : ${name(id)} niveau ${to} · ${dureeTxt(m)}`);refresh()}
 const left=w=>Math.max(0,(w.ends-Date.now())/6e4),rush=w=>Math.max(1,Math.ceil(left(w)/6));
 function finishNow(id){const w=busy(id);if(!w)return;const g=rush(w);if(state.gems<g)return toast('Pas assez de gemmes');state.gems-=g;sync();w.ends=Date.now();check()}
 function check(){const now=Date.now(),done=D.work.filter(w=>now>=w.ends);if(!done.length)return;
  for(const w of done){if(PROD[w.id])settle(w.id);D.lv[w.id]=w.to;D.work=D.work.filter(x=>x!==w);village.clearTimer(w.id);hooks.emit('domaine:fini',w.id,w.to);
   toast(`🏗️ ${name(w.id)} passe au niveau ${w.to} !`);sound.fanfare();buzz([30,30,60]);
   coach.tip('domaine-fini',`Travaux terminés ! Chaque niveau a un <b>effet réel</b> : retrouve-le dans l’écran du domaine (🔨). Pour monter plus haut, agrandis le <b>Haras</b> : les autres bâtiments peuvent le dépasser d’un niveau au plus.`,null)}
  save();refresh();try{meta.render()}catch(e){}}
 // ---------- carte du bâtiment sélectionné sur la carte du domaine ----------
 let sel=null;
 const ACT={haras:['ÉLEVAGE',()=>breeding.open()],hippodrome:['COURIR',()=>openCourses()],clinique:['SOINS',()=>openStable({tab:'care',filter:'clinique'})],ecurie:['CHEVAUX',()=>openStable()],
  moulin:['RATION',()=>openStable({tab:'care',filter:'moulin'})],paddocks:['ENTRAÎNER',()=>openStable({tab:'train',filter:'paddocks'})],carriere:['ENTRAÎNER',()=>openStable({tab:'train',filter:'carriere'})],chantier:['INFOS',()=>open('chantier')]};
 function action(id){if(PROD[id]&&dlv(id)&&unlocked()&&stock(id)>=1)return[`RÉCOLTER<br>${PROD[id].ico} ${fmt(stock(id))}`,()=>collect(id,$('#infoBtn'))];
  if(id==='chantier'&&dlv(id))return['VITRINE',()=>palmares.open()];return ACT[id]}
 function card(id){sel=id;const l=dlv(id),w=busy(id),why=block(id),to=l+1,fx=BATIMENTS[id].fx(l).filter(Boolean);
  $('#selIcon').textContent=icon(id);$('#selTitle').textContent=name(id);
  $('#selDesc').innerHTML=`${l?`<b>Niveau ${l}</b> · `:''}${escapeHTML(fx[0]||BUILDINGS[id].desc)}${w?`<span class="sel-prog"><i style="width:${Math.min(100,(Date.now()-w.start)/(w.ends-w.start)*100)}%"></i></span>`:''}`;
  const a=action(id),info=$('#infoBtn'),up=$('#upgradeBtn');info.innerHTML=a[0];info.onclick=()=>{village.deselect();a[1]()};
  up.style.display='';up.disabled=false;up.classList.toggle('green',!w);
  if(w){up.innerHTML=`⏱ ${dureeTxt(left(w))}<br>TERMINER · 💎 ${rush(w)}`;up.onclick=()=>finishNow(id)}
  else if(why){up.innerHTML=why==='Niveau maximal'?'NIVEAU<br>MAXIMAL':`🔒<br><small>${why}</small>`;up.disabled=why==='Niveau maximal';up.onclick=()=>open(id)}
  else{up.innerHTML=`${l?'AMÉLIORER':'CONSTRUIRE'}<br>🪙 ${fmt(cost(id,to))}`;up.onclick=()=>open(id)}
  $('#selection').classList.add('open')}
 village.onSelect=card;
 // ---------- écran « Domaine royal » : tous les bâtiments, niveaux, effets, travaux ----------
 const ORDER=['haras','hippodrome','ecurie','carriere','paddocks','clinique','moulin','chantier'];
 function open(focus){check();$('#panelTitle').textContent='Domaine royal';$('#panel .card').classList.add('wide');const fr=free(),B=builders();
  const prod=Object.keys(PROD).filter(id=>dlv(id)>0).map(id=>`<div class="dom-prod"><i>${PROD[id].ico}</i><div><b>${name(id)}</b><small>${fmt(stock(id))} / ${fmt(cap(id))} · +${fmt(PROD[id].rate(dlv(id)))} par heure</small><div class="bar"><i style="width:${stock(id)/Math.max(1,cap(id))*100}%"></i></div></div><button class="action green" data-dom-collect="${id}" ${stock(id)>=1?'':'disabled'}>RÉCOLTER</button></div>`).join('');
  $('#panelBody').innerHTML=`<p class="hint">🔨 <b>${fr} ouvrier${fr>1?'s':''} libre${fr>1?'s':''} sur ${B}</b> · Les bâtiments peuvent dépasser le <b>Haras</b> d’un niveau au plus. Chaque niveau a un effet réel sur ta partie.</p>${prod?`<div class="dom-prods">${prod}</div>`:''}
  <div class="dom-grid">${ORDER.map(id=>{const l=dlv(id),M=BATIMENTS[id].max,w=busy(id),why=block(id),to=l+1,now=BATIMENTS[id].fx(l).filter(Boolean),next=to<=M?BATIMENTS[id].fx(to).filter(Boolean):null;
   const pips=Array.from({length:M},(_,i)=>`<i class="${i<l?'on':w&&i===l?'go':''}"></i>`).join('');
   const btn=w?`<button class="action" data-dom-rush="${id}">⏱ ${dureeTxt(left(w))} · TERMINER 💎 ${rush(w)}</button>`:why?`<span class="dom-lock">${why==='Niveau maximal'?'✓ Niveau maximal':'🔒 '+why}</span>`
    :`<button class="action green" data-dom-up="${id}" ${state.gold<cost(id,to)||fr<1?'disabled':''}>${l?'AMÉLIORER':'CONSTRUIRE'} · 🪙 ${fmt(cost(id,to))} · ${dureeTxt(minutes(id,to))}</button>${fr<1?'<small class="dom-why">Tous les ouvriers sont occupés</small>':state.gold<cost(id,to)?`<small class="dom-why">Il te manque ${fmt(cost(id,to)-state.gold)} or</small>`:''}`;
   return `<article class="dom${id===focus?' focus':''}${w?' working':''}" data-dom="${id}"><header><i>${icon(id)}</i><div><b>${name(id)}</b><span class="pips">${pips}</span></div></header>
    <ul class="now">${now.map(t=>`<li>${escapeHTML(t)}</li>`).join('')}</ul>${next?`<ul class="next"><li class="h">${w?`En travaux → niveau ${to}`:`Niveau ${to}`}</li>${next.map(t=>`<li>${escapeHTML(t)}</li>`).join('')}</ul>`:''}
    ${w?`<div class="bar"><i style="width:${Math.min(100,(Date.now()-w.start)/(w.ends-w.start)*100)}%"></i></div>`:''}<div class="dom-btn">${btn}</div></article>`}).join('')}</div>`;
  $('#panel').classList.add('open');if(focus)$(`#panelBody [data-dom="${focus}"]`)?.scrollIntoView({block:'nearest'})}
 const panelOpen=()=>$('#panel').classList.contains('open')&&$('#panelTitle').textContent==='Domaine royal';
 $('#panelBody').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;
  if(b.dataset.domUp){start(b.dataset.domUp);open(b.dataset.domUp)}else if(b.dataset.domRush){finishNow(b.dataset.domRush);open(b.dataset.domRush)}else if(b.dataset.domCollect){collect(b.dataset.domCollect,b);open()}});
 // ---------- affichage sur la carte : niveaux, minuteurs, bulles de récolte ----------
 const bubbles={};for(const id of Object.keys(PROD)){const m=VILLAGE.buildings[id],b=document.createElement('button');b.className='bld-harvest';b.hidden=true;Object.assign(b.style,{left:m.cx*100+'%',top:m.cy*100+'%'});
  b.addEventListener('pointerdown',e=>e.stopPropagation());b.addEventListener('click',e=>{e.stopPropagation();collect(id,b)});$('#map').appendChild(b);bubbles[id]=b}
 function refresh(){for(const id of ORDER){const l=dlv(id);village.setTag(id,name(id),id==='chantier'&&!l?null:`NIV. ${l}`);const w=busy(id);if(w)village.setTimer(id,dureeTxt(left(w)));else village.clearTimer(id)}
  for(const id of Object.keys(PROD)){const n=dlv(id)?stock(id):0,b=bubbles[id];b.hidden=!(unlocked()&&n>=Math.max(20,cap(id)*.25));if(!b.hidden)b.innerHTML=`${PROD[id].ico}<b>+${fmt(n)}</b>`}
  const el=$('#builders');if(el)el.textContent=`${free()}/${builders()}`;
  if(sel&&village.selected===sel&&$('#selection').classList.contains('open'))card(sel)}
 $('.resource.builder')?.addEventListener('click',()=>open());$('.resource.builder')?.setAttribute('role','button');
 setInterval(()=>{check();refresh();if(panelOpen()&&D.work.length&&!document.hidden)$$('#panelBody .dom.working .bar i').forEach(i=>{const w=busy(i.closest('.dom').dataset.dom);if(w)i.style.width=Math.min(100,(Date.now()-w.start)/(w.ends-w.start)*100)+'%'})},1000);
 check();refresh();
 // pour les tests : tout au niveau maximal
 const debug={max(){ORDER.forEach(id=>{D.lv[id]=BATIMENTS[id].max});D.work=[];save();refresh()}};
 return{open,start,finishNow,collect,stock,cap,builders,free,block,cost,minutes,name,refresh,debug,get work(){return D.work}}})();
