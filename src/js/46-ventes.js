/* ===== Ventes aux enchères : chaque jour, 4 lots de chevaux à disputer au Comte de Valmont et à deux autres acheteurs =====
   Catalogue tiré de la date et de la ligue (le même pour tous les joueurs d'une ligue). Le vrai potentiel est caché : la visite
   vétérinaire en donne une fourchette, d'autant plus fine que la clinique est développée. Les autres acheteurs, eux, connaissent la
   valeur du cheval : quand ils s'acharnent, c'est souvent une pépite ; quand ils lâchent vite, méfiance. Leurs plafonds sont tirés de
   la graine du jour (on ne peut pas relancer une vente en rechargeant). Débloqué après 6 courses. */
const BIDDERS={valmont:{n:'Comte de Valmont',a:'au comte de Valmont',i:'🎩'},sercey:{n:'Marquise de Sercey',a:'à la marquise de Sercey',i:'👒'},ashby:{n:'Lord Ashby',a:'à Lord Ashby',i:'🎖️'}};
const LOT_TYPES={yearling:{n:'Yearling',d:'Jeune cheval de 2 ans : tout est à construire, mais le potentiel est là.'},pret:{n:'Prêt à courir',d:'Cheval confirmé, engageable dès aujourd’hui.'},
 specialiste:{n:'Spécialiste',d:'Taillé pour une distance, redoutable sur son terrain.'},vedette:{n:'Lot vedette',d:'Le cheval le plus convoité de la vente.'}};
const ventes=(()=>{const C=career.data;C.ventes=C.ventes||{day:'',sold:{},bought:0};const V=C.ventes;
 const save=()=>{try{localStorage.setItem('trr.progress',JSON.stringify(C))}catch(e){}};
 const day=()=>new Date().toISOString().slice(0,10),hash=s=>[...s].reduce((a,c)=>(a*31+c.charCodeAt(0))%2147483647,7);
 function roll(){if(V.day!==day()){V.day=day();V.sold={};save()}for(const k in V.sold)if(V.sold[k].to==='live'){V.sold[k]={to:'retire'};save()}}
 const SIRES=['Grand Monarque','Roi Soleil','Tonnerre Noir','Sultan d’Or','Fier Lancier','Vent du Large','Capitaine Fracasse','Prince Noir'],
  DAMS=['Belle de Mai','Reine Margot','Douce France','Perle Rare','Étoile Filante','Dame de Cœur','Rose des Vents','Lune de Miel'],
  NA=['Duc','Marquis','Belle','Reine','Prince','Comtesse','Baron','Orage','Mistral','Zéphyr','Sirocco','Aquilon','Éclat','Sultane','Capitaine','Diamant'],
  NB=['de Lune','d’Argent','du Nord','Royal','des Brumes','de Minuit','Doré','Impérial','du Soir','de Feu','des Vents','d’Azur','Sauvage','de Légende'];
 const r50=n=>Math.round(n/500)*500,avg=o=>Object.values(o).reduce((a,b)=>a+b,0)/6;
 const worth=(rt,pot,L)=>r50((Math.pow(Math.max(0,rt-45),1.6)*72+Math.pow(Math.max(0,pot-70),1.7)*120+3000)*(1+L*.35));
 // les 4 lots du jour
 function lots(){roll();const L=career.league(),R=seeded(hash(`ventes-${day()}-${L}`)),ref=62+L*5,keys=STATS.map(s=>s.k),tl=Object.keys(TALENTS),used=stable.data.horses.map(h=>h.name);
  const name=()=>{let n;do{n=`${NA[Math.floor(R()*NA.length)]} ${NB[Math.floor(R()*NB.length)]}`}while(used.includes(n)||n.length>18);used.push(n);return n};
  const mk=(type,o)=>{const caps={},stats={};for(const k of keys){caps[k]=Math.round(Math.min(99,Math.max(55,o.cap+(R()-.5)*o.sp+(o.skew?.[k]||0))));stats[k]=Math.round(Math.min(caps[k]-2,Math.max(30,o.st?o.st+(R()-.5)*o.sp+(o.skew?.[k]||0)*.6:caps[k]*(.48+R()*.07))))}
   const h={type,name:name(),coat:LIVERY.COATS[Math.floor(R()*LIVERY.COATS.length)].id,age:o.age,level:o.level,stats,caps,dist:o.dist||DISTS[Math.floor(R()*4)][0],talent:o.talent||tl[Math.floor(R()*tl.length)],parents:[SIRES[Math.floor(R()*SIRES.length)],DAMS[Math.floor(R()*DAMS.length)]]};
   h.rating=ratingOf(stats);h.pot=Math.round(avg(caps));h.value=worth(h.rating,h.pot,L);return h};
  const long=R()<.5,list=[mk('yearling',{age:2,level:1,cap:86+L*3+R()*6,sp:10}),mk('pret',{age:4,level:6+L*3,cap:ref+21+R()*5,st:ref+R()*5-1,sp:9}),
   mk('specialiste',{age:3,level:3+L*2,cap:ref+24,st:ref+2,sp:8,dist:long?2400:1200,talent:long?'increvable':'fusee',skew:long?{end:9,tem:5,acc:-5,dep:-6}:{acc:8,dep:9,vit:4,end:-10}}),
   mk('vedette',{age:3,level:4+L*2,cap:91+L*2+R()*4,st:ref+3+R()*3,sp:6,talent:['coeur','finisseur','tacticien'][Math.floor(R()*3)]})];
  // fourchette de la visite vétérinaire (plus fine avec la clinique) et plafonds des acheteurs (Valmont s'acharne sur le lot vedette)
  const w=[0,12,10,8,6,4][dlv('clinique')]||12;
  list.forEach((h,i)=>{h.id='lot'+(i+1);const lo=Math.round(h.pot-R()*w);h.est=[lo,Math.min(99,lo+w)];h.start=r50(h.value*.42);h.inc=Math.max(500,r50(h.value*.05));h.estim=[r50(h.value*.85),r50(h.value*1.15)];
   h.max={};for(const b of Object.keys(BIDDERS)){const keen=b==='valmont'&&h.type==='vedette';h.max[b]=keen?h.value*(1.05+R()*.3):R()<.25?0:h.value*(.7+R()*.45)}});
  return list}
 // ---------- enchère en direct ----------
 let A=null;const CALL=1400,SAY=['','Une fois…','Deux fois…'];
 const next=()=>A.top?A.price+A.lot.inc:A.price,full=()=>stable.data.horses.length>=stableMax();
 function start(id){const lot=lots().find(l=>l.id===id);if(!lot||V.sold[id])return;if(full())return toast(`Écurie pleine (${stableMax()} places) : agrandis-la ou libère un cheval`);
  if(state.gold<lot.start)return toast(`La mise à prix est de ${fmt(lot.start)} or`);
  V.sold[id]={to:'live'};save();A={lot,price:lot.start,top:null,step:0,log:[],out:{},timers:[]};hooks.emit('vente:debut',id);render(true);call(CALL*1.8);plan();sound.say(`Lot ${id.slice(3)} : ${lot.name}. Mise à prix, ${lot.start} pièces d’or.`,true)}
 function clear(){A.timers.forEach(clearTimeout);A.timers=[]}
 function bid(who){if(!A||A.done)return;if(who==='player'){if(A.top==='player')return;if(state.gold<next())return toast('Or insuffisant');if(full())return toast('Écurie pleine')}
  A.price=next();A.top=who;A.step=0;A.log.unshift([who,A.price]);if(who==='player'){buzz(15);sound.coin()}else sound.tone(520,.08,'triangle',.05);clear();call(CALL);plan();render()}
 // les autres acheteurs répondent, parfois tout de suite, parfois au dernier moment
 function plan(){const p=next();for(const b of Object.keys(BIDDERS)){if(b===A.top||A.out[b])continue;if(A.lot.max[b]<p){if(A.top&&!A.out[b]&&A.lot.max[b]>0&&A.log.some(x=>x[0]===b)){A.out[b]=1}continue}
  const late=Math.random()<.4,d=late?CALL*1.6+Math.random()*CALL*1.1:450+Math.random()*CALL*.9;A.timers.push(setTimeout(()=>{if(A&&!A.done&&A.top!==b&&A.lot.max[b]>=next())bid(b)},d))}}
 function call(first){A.timers.push(setTimeout(function tick(){if(!A||A.done)return;A.step++;if(A.step>=3)return end();render();A.timers.push(setTimeout(tick,CALL))},first))}
 function end(){clear();A.done=true;const L=A.lot,win=A.top==='player';
  if(win){state.gold-=A.price;sync();let n=L.name;while(stable.data.horses.some(h=>h.name===n))n=(n+' II').slice(0,18);
   const h=stable.addHorse({name:n,coat:L.coat,stats:{...L.stats},caps:{...L.caps},dist:L.dist,level:L.level,talent:L.talent});if(h){h.age=L.age;h.parents=L.parents;h.xp=0;stable.save()}A.horse=h;
   V.bought=(V.bought||0)+1;sound.fanfare();buzz([40,40,80]);sound.say('Adjugé !',true)}
  else if(A.top){sound.thud(0,.4);sound.say(`Adjugé ${BIDDERS[A.top].a} !`,true)}
  V.sold[L.id]={to:A.top||'retire',price:A.top?A.price:0};save();hooks.emit('vente:fin',L.id,A.top,A.price);render();try{palmares.check()}catch(e){}}
 function quit(){if(!A)return;if(!A.done){A.out.player=1;if(A.top==='player')return toast('Tu mènes l’enchère : attends le coup de marteau');toast('Tu te retires de l’enchère')}}
 // ---------- écrans ----------
 const T=()=>$('#panelTitle').textContent==='Ventes aux enchères';
 const face=(k)=>k==='player'?`<span class="auc-face me">${LIVERY.silkSVG(stable.silks,28)}</span>`:`<span class="auc-face">${BIDDERS[k].i}</span>`,who=k=>k==='player'?'Toi':BIDDERS[k].n;
 function lotCard(h,inAuc){const s=V.sold[h.id],est=`${h.est[0]}–${h.est[1]}`;
  return `<article class="lot${h.type==='vedette'?' star':''}${s&&s.to!=='live'?' sold':''}" data-lot="${h.id}"><div class="lot-pic"><canvas width="150" height="190" data-lotpic="${h.id}"></canvas><span class="lot-n">LOT ${h.id.slice(3)}</span></div>
   <div class="lot-info"><em class="lot-type t-${h.type}">${h.type==='vedette'?'⭐ ':''}${LOT_TYPES[h.type].n}</em><b>${escapeHTML(h.name)}</b><small>${h.age} ans · Niv. ${h.level} · ${coatName(h.coat)} · par ${escapeHTML(h.parents[0])} et ${escapeHTML(h.parents[1])}</small>
   <div class="lot-kpi"><div><span class="note">${h.rating}</span><small>note</small></div><div><b>${est}</b><small>potentiel estimé</small></div><div><b>${distName(h.dist)}</b><small>${fmt(h.dist)} m</small></div></div>
   <p class="lot-t" title="${TALENTS[h.talent].d}">${TALENTS[h.talent].i} <b>${TALENTS[h.talent].n}</b> · ${TALENTS[h.talent].d}</p>
   <p class="lot-est">Estimation de la maison : <b>${fmt(h.estim[0])} – ${fmt(h.estim[1])} 🪙</b> · mise à prix ${fmt(h.start)}</p>
   ${inAuc?'':s?`<span class="lot-sold">${s.to==='player'?`✓ Acheté ${fmt(s.price)} 🪙`:s.to==='retire'?'Lot retiré':`Adjugé à ${BIDDERS[s.to]?.n||'un autre acheteur'} · ${fmt(s.price)} 🪙`}</span>`
    :`<button class="action green" data-lot-bid="${h.id}" ${state.gold<h.start||full()?'disabled':''}>ENCHÉRIR · dès ${fmt(h.start)} 🪙</button>`}</div></article>`}
 function open(){roll();if(A&&!A.done)return render(true);A=null;$('#panelTitle').textContent='Ventes aux enchères';$('#panel .card').classList.add('wide');const L=lots(),left=new Date();left.setUTCHours(24,0,0,0);const h=Math.ceil((left-new Date())/36e5);
  $('#panelBody').innerHTML=`<p class="hint">Chaque jour, 4 chevaux sont mis en vente. Le <b>potentiel estimé</b> vient de la visite vétérinaire (plus précise avec une clinique développée). Les autres acheteurs connaissent la vraie valeur : s’ils s’acharnent, c’est bon signe. Écurie : <b>${stable.data.horses.length}/${stableMax()}</b> · 🪙 ${fmt(state.gold)} · nouvelle vente dans ${h} h.</p>
  <div class="lots">${L.map(x=>lotCard(x)).join('')}</div>`;$('#panel').classList.add('open');paint();
  coach.tip('ventes','Bienvenue aux <b>ventes</b> ! Regarde le <b>potentiel estimé</b> et l’estimation de la maison, puis enchéris. Au marteau (« Une fois… deux fois… adjugé ! »), le dernier enchérisseur l’emporte. Ne paie pas plus qu’il ne vaut !','.lots')}
 function paint(){$$('#panelBody canvas[data-lotpic]').forEach(cv=>{const h=(A&&A.lot.id===cv.dataset.lotpic)?A.lot:lots().find(l=>l.id===cv.dataset.lotpic);if(h)drawPortrait(cv,h,1.25,-2)})}
 // build : construit l'écran de l'enchère ; sinon, simple mise à jour, et seulement s'il est affiché (le joueur a pu fermer ou changer de panneau)
 function render(build){if(!A)return;if(build){$('#panelTitle').textContent='Ventes aux enchères';$('#panel .card').classList.add('wide');$('#panel').classList.add('open');$('#panelBody').innerHTML=''}else if(!T()||!$('#panelBody .auc'))return;
  const L=A.lot,n=next(),can=!A.done&&A.top!=='player'&&!A.out.player&&state.gold>=n&&!full(),active=['player',...Object.keys(BIDDERS)];
  const say=A.done?(A.top==='player'?'Adjugé ! Il est à toi.':A.top?`Adjugé à ${BIDDERS[A.top].n} !`:'Aucune enchère : lot retiré'):A.top?SAY[A.step]||`À ${fmt(A.price)} or ?`:`Mise à prix : ${fmt(A.price)} or. Qui dit mieux ?`;
  const had=!!$('#panelBody .auc');
  if(!had){$('#panelBody').innerHTML=`<div class="auc"><div class="lots">${lotCard(L,true)}</div><section class="auc-live"><small>ENCHÈRE EN COURS</small><b class="auc-price"></b><span class="auc-top"></span>
   <div class="auc-call"><i></i><i></i><i></i></div><p class="auc-say"></p><div class="auc-bidders"></div><ul class="auc-log"></ul><div class="auc-btns"></div></section></div>`;paint()}
  $('.auc-price').textContent=`${fmt(A.price)} 🪙`;$('.auc-top').innerHTML=A.top?`${face(A.top)} ${escapeHTML(who(A.top))}${A.top==='player'?' mène':''}`:'Aucune enchère';
  $$('.auc-call i').forEach((i,k)=>i.classList.toggle('on',A.top&&k<A.step+(A.done?1:0)));$('.auc-say').textContent=say;$('.auc-say').classList.toggle('hot',A.step>=2||A.done);
  $('.auc-bidders').innerHTML=active.map(k=>`<span class="${A.top===k?'top':''}${A.out[k]?' out':''}">${face(k)}<small>${k==='player'?'Toi':BIDDERS[k].n.split(' ').pop()}</small></span>`).join('');
  $('.auc-log').innerHTML=A.log.slice(0,6).map(([k,p])=>`<li>${face(k)} ${escapeHTML(who(k))} · <b>${fmt(p)} 🪙</b></li>`).join('');
  $('.auc-btns').innerHTML=A.done?(A.top==='player'&&A.horse?`<button class="action green" data-auc="stable">VOIR ${escapeHTML(A.horse.name.toUpperCase())} À L’ÉCURIE</button>`:'')+`<button class="action" data-auc="back">RETOUR AU CATALOGUE</button>`
   :`<button class="action green" data-auc="bid" ${can?'':'disabled'}>${A.top==='player'?'TU MÈNES':A.out.player?'RETIRÉ':`ENCHÉRIR · ${fmt(n)} 🪙`}</button><button class="action" data-auc="quit" ${A.out.player||A.top==='player'?'disabled':''}>ME RETIRER</button>${state.gold<n&&!A.out.player&&A.top!=='player'?`<small class="dom-why">Il te manque ${fmt(n-state.gold)} or</small>`:''}`}
 $('#panelBody').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;
  if(b.dataset.lotBid)start(b.dataset.lotBid);else if(b.dataset.auc==='bid')bid('player');else if(b.dataset.auc==='quit'){quit();render()}
  else if(b.dataset.auc==='back'){A=null;open()}else if(b.dataset.auc==='stable'){const id=A.horse.id;A=null;stUI.horse=id;openStable()}});
 // fermer le panneau pendant une enchère : elle continue, le résultat s'affiche en message
 hooks.on('vente:fin',(id,to,price)=>{if(!T()||!$('#panel').classList.contains('open'))toast(to==='player'?`Adjugé ! ${A.horse?.name||'Ton cheval'} rejoint ton écurie`:to?`Lot vendu à ${BIDDERS[to].n} pour ${fmt(price)} or`:'Lot retiré')});
 PANELS.ventes=open;
 return{open,lots,start,bid,get live(){return A},get bought(){return V.bought||0}}})();
