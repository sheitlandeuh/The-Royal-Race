/* ===== Méta-jeu : coffres, séries de victoires, récompense quotidienne, adéquation cheval/course, barre d'accueil ===== */
const CHESTS={bois:{n:'en bois',min:15,col:'#a8733f',ico:'🧰'},argent:{n:'d’argent',min:60,col:'#c9d3dc',ico:'🎁'},or:{n:'d’or',min:180,col:'#f3c64a',ico:'💰'},royal:{n:'royal',min:480,col:'#b98cff',ico:'👑'}};
// 2.8 : un vrai coffre dessiné (bois cerclé de fer, argent, or, royal violet et couronne) au lieu d'un émoji, le même partout
// (emplacements, ouverture, boutique, saison, tournoi, La Couronne) ; couvercle à part pour l'ouverture. Aplats seulement : aucun dégradé à
// identifiant, l'icône peut être répétée et masquée sans rien casser.
const CHEST_ART={bois:['#9a6232','#4b3622','#d8b04a'],argent:['#b7c3ce','#66788a','#f4f7fa'],or:['#ebb73c','#9a6a12','#fff1b8'],royal:['#6d3fcb','#f3c64a','#ffe08a']};
function chestSVG(t,cls=''){const[b,band,lock]=CHEST_ART[t]||CHEST_ART.bois,wood=t==='bois'?'<path d="M9 37.5h46M9 45.5h46" stroke="#0000002e" stroke-width="1.6"/>':'';
 return `<svg class="chest ${cls}" viewBox="0 0 64 64" role="img" aria-label="Coffre ${CHESTS[t]?.n||''}"><ellipse class="ch-shadow" cx="32" cy="58.5" rx="23" ry="3.6" fill="#00000059"/>`+
  `<g class="ch-body"><rect x="9" y="30" width="46" height="26" rx="4" fill="${b}"/><rect x="9" y="45" width="46" height="11" rx="4" fill="#00000033"/>${wood}<rect x="15" y="30" width="6.5" height="26" fill="${band}"/><rect x="42.5" y="30" width="6.5" height="26" fill="${band}"/><rect x="9" y="52.5" width="46" height="3.5" rx="1.7" fill="${band}"/></g>`+
  `<g class="ch-glow"><ellipse cx="32" cy="30" rx="19" ry="5" fill="#fff6c8"/></g>`+
  `<g class="ch-lid"><rect x="9" y="14.5" width="46" height="17.5" rx="8" fill="${b}"/><path d="M13 20.5C16 16.6 48 16.6 51 20.5" fill="none" stroke="#ffffff6b" stroke-width="2.2" stroke-linecap="round"/><rect x="15" y="15.2" width="6.5" height="16.8" fill="${band}"/><rect x="42.5" y="15.2" width="6.5" height="16.8" fill="${band}"/><rect x="8" y="28.5" width="48" height="4.2" rx="2" fill="${band}"/>${t==='royal'?`<path d="M23.5 15.5 26 7.5l6 4.6 6-4.6 2.5 8z" fill="${band}" stroke="#00000040" stroke-width="1"/><circle cx="32" cy="9.6" r="1.6" fill="#ff5d8f"/>`:''}</g>`+
  `<g class="ch-lock"><rect x="26.5" y="27" width="11" height="13" rx="2.6" fill="${lock}" stroke="#00000038" stroke-width="1"/><circle cx="32" cy="32" r="1.9" fill="#0000009c"/><rect x="31.2" y="32.4" width="1.6" height="4.2" rx=".8" fill="#0000009c"/></g></svg>`}
// coffre en ligne dans un texte HTML (récompenses de saison, tournoi, boutique, La Couronne) ; les toasts gardent l'émoji
const chestIco=t=>`<span class="ico-chest">${chestSVG(t)}</span>`;
// temps restant d'un coffre : « 14:32 » sous l'heure, « 2 h 05 » au-delà
const chestLeft=ms=>{const s=Math.max(0,Math.ceil(ms/1000)),h=Math.floor(s/3600),m=Math.floor(s%3600/60),x=s%60;return h?`${h} h ${String(m).padStart(2,'0')}`:`${m}:${String(x).padStart(2,'0')}`};
const LOGIN=[{gold:2000},{feed:2500},{gems:10},{gold:5000},{elixir:1},{feed:6000},{chest:'or'}];
const meta=(()=>{const C=career.data;C.chests=C.chests||[null,null,null,null];C.streak=C.streak||0;C.elixirs=C.elixirs||0;C.login=C.login||{day:'',idx:-1};
 const save=()=>{try{localStorage.setItem('trr.progress',JSON.stringify(C))}catch(e){}};
 const L=()=>career.league();
 function addChest(type){const i=C.chests.findIndex(c=>!c);if(i<0)return null;C.chests[i]={type,ends:0};save();render();return CHESTS[type]}
 function onRace(rank,stars){season.add(stars);C.streak=rank===1?C.streak+1:0;const streakBonus=rank===1&&C.streak>=2?Math.min(.5,(C.streak-1)*.1):0;let type=rank===1?(stars===3?'or':'argent'):rank<=3?'bois':null;
  if(rank===1&&C.streak>0&&C.streak%5===0)type='royal';let chest=null,chestFull=false;if(type){chest=addChest(type);chestFull=!chest}save();return{streakBonus:+streakBonus.toFixed(1),chest,chestFull,streak:C.streak}}
 function contents(type,seed){let x=seed%2147483646+1;const r=()=>(x=(x*16807)%2147483647)/2147483647,k=1+L()*.6,m={bois:1,argent:2.6,or:6,royal:14}[type];
  const o={gold:Math.round((700+r()*500)*m*k/50)*50,feed:Math.round((500+r()*400)*m*k/50)*50};if(type!=='bois')o.gems=Math.round((2+r()*3)*m/2.6);if(type==='or'||type==='royal'||(type==='argent'&&r()<.35))o.elixir=type==='royal'?3:1;return o}
 function tap(i){const c=C.chests[i];if(!c)return;const now=Date.now();
  if(c.ends&&now>=c.ends)return open(i);
  if(c.ends){const min=Math.ceil((c.ends-now)/6e4);return confirmGems(i,gemCost(c.ends-now),min)}
  if(C.chests.some(x=>x&&x.ends&&x.ends>now))return confirmGems(i,Math.max(1,Math.ceil(CHESTS[c.type].min/6)),CHESTS[c.type].min,true);
  c.ends=now+CHESTS[c.type].min*6e4;save();render();toast(`Ouverture du coffre ${CHESTS[c.type].n} : ${fmtMin(CHESTS[c.type].min)}`)}
 const gemCost=ms=>Math.max(1,Math.ceil(Math.ceil(ms/6e4)/6));
 function confirmGems(i,cost,min,busy){const c=C.chests[i],T=CHESTS[c.type];$('#panelTitle').textContent=`Coffre ${T.n}`;$('#panel .card').classList.remove('wide');
  const other=busy&&C.chests.find(x=>x&&x.ends&&x.ends>Date.now());
  $('#panelBody').innerHTML=`<div class="chest-pop${busy?'':' timing'}" data-chest="${i}" style="--c:${T.col}"><div class="chest-stage">${chestSVG(c.type,'big')}</div>
   ${busy?`<p>Un seul coffre s’ouvre à la fois : le coffre ${CHESTS[other.type].n} sera prêt dans <b class="chest-left" data-ends="${other.ends}">${chestLeft(other.ends-Date.now())}</b>.<br>Celui-ci demande ${fmtMin(T.min)}.</p>`
   :`<p class="chest-count">Ouverture dans <b class="chest-left" data-ends="${c.ends}">${chestLeft(c.ends-Date.now())}</b></p><div class="chest-bar"><i style="width:${(100*(1-(c.ends-Date.now())/(T.min*6e4))).toFixed(1)}%"></i></div>`}
   <button class="action green" data-open-gems="${i}" data-cost="${cost}">OUVRIR MAINTENANT · 💎 ${cost}</button></div>`;$('#panel').classList.add('open')}
 function open(i,paid){const c=C.chests[i];if(!c)return;const o=contents(c.type,Date.now());C.chests[i]=null;state.gold+=o.gold;state.feed+=o.feed;state.gems+=o.gems||0;C.elixirs+=o.elixir||0;save();sync();render();
  $('#panelTitle').textContent=`Coffre ${CHESTS[c.type].n}`;$('#panel .card').classList.remove('wide');
  const L=[['🪙',o.gold,'or'],['🌾',o.feed,'fourrage'],['💎',o.gems,'gemmes'],['🧪',o.elixir,'élixir d’XP']].filter(x=>x[1]);
  $('#panelBody').innerHTML=`<div class="chest-pop opening" style="--c:${CHESTS[c.type].col}"><div class="chest-stage"><span class="chest-rays"></span>${chestSVG(c.type,'big')}<span class="chest-sparks">${'<i></i>'.repeat(10)}</span></div>
   <div class="loot">${L.map(([e,v,n])=>`<div><i>${e}</i><b data-to="${v}">+0</b><small>${n}</small></div>`).join('')}</div><button class="action green" id="lootOk">SUPER !</button><p class="chest-skip">Touche le coffre pour tout voir</p></div>`;$('#panel').classList.add('open');
  // déroulé : le coffre tremble, le couvercle saute dans un éclat de lumière, puis chaque gain apparaît et se compte ; toucher le coffre montre tout
  const pop=$('#panelBody .chest-pop'),items=[...pop.querySelectorAll('.loot div')],still=REDUCE_MOTION.matches,T0=performance.now();let done=false;
  const count=(el,ms)=>{const to=+el.dataset.to,t0=performance.now(),f=now=>{if(!el.isConnected)return;const k=Math.min(1,(now-t0)/ms),e=1-Math.pow(1-k,3);el.textContent='+'+fmt(Math.round(to*e));if(k<1)requestAnimationFrame(f)};requestAnimationFrame(f)};
  const finish=()=>{if(done)return;done=true;pop.classList.add('opened','shown');items.forEach(d=>{d.classList.add('in');const b=d.querySelector('b');b.textContent='+'+fmt(+b.dataset.to)})};
  if(still){sound.fanfare();buzz([30,30,60]);return finish()}
  pop.querySelector('.chest-stage').addEventListener('click',finish);
  setTimeout(()=>{if(done||!pop.isConnected)return;pop.classList.add('opened');sound.fanfare();buzz([30,30,60])},700);
  items.forEach((d,k)=>setTimeout(()=>{if(done||!pop.isConnected)return;d.classList.add('in');count(d.querySelector('b'),650);sound.coin()},1050+k*380));
  setTimeout(()=>{if(!done&&pop.isConnected){done=true;pop.classList.add('shown')}},1050+L.length*380+500)}
 const fmtMin=m=>m>=60?`${Math.floor(m/60)} h${m%60?` ${m%60}`:''}`:`${m} min`;
 $('#panelBody').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.openGems!=null){const cost=+b.dataset.cost;if(state.gems<cost)return toast('Pas assez de gemmes');state.gems-=cost;sync();open(+b.dataset.openGems)}else if(b.dataset.openFree!=null)open(+b.dataset.openFree);else if(b.id==='lootOk'||b.id==='loginOk')$('#panel').classList.remove('open')});
 // ---------- récompense quotidienne ----------
 function login(){const d=new Date().toISOString().slice(0,10);if(C.login.day===d)return;C.login.day=d;C.login.idx=(C.login.idx+1)%7;const R=LOGIN[C.login.idx];
  state.gold+=R.gold||0;state.feed+=R.feed||0;state.gems+=R.gems||0;C.elixirs+=R.elixir||0;if(R.chest)addChest(R.chest);save();sync();
  setTimeout(()=>{if($('#studio').classList.contains('open'))return;$('#panelTitle').textContent='Récompense du jour';$('#panel .card').classList.remove('wide');
   $('#panelBody').innerHTML=`<p class="hint">Reviens chaque jour : la 7e récompense est un coffre d’or.</p><div class="login">${LOGIN.map((x,i)=>`<div class="${i<C.login.idx?'got':i===C.login.idx?'today':''}"><small>Jour ${i+1}</small><i>${x.gold?'🪙':x.feed?'🌾':x.gems?'💎':x.elixir?'🧪':chestSVG(x.chest||'or')}</i><b>${x.gold?fmt(x.gold):x.feed?fmt(x.feed):x.gems||x.elixir||'Coffre'}</b></div>`).join('')}</div><button class="action green" id="loginOk">RÉCUPÉRER</button>`;$('#panel').classList.add('open');sound.coin()},1400)}
 // ---------- adéquation cheval / course ----------
 function suit(h,m=RACE){const T=TERRAINS[m.terrain],d=Math.abs(h.dist-m.dist)/400,terr=T.drain>1?(65-h.stats.end)/15:0,s=d*1.2+Math.max(0,terr)+(h.dist<m.dist?d*.5:0)+(h.fatigue>55?1:0);
  return s<.7?{k:'ideal',n:'Idéal',i:'✓'}:s<1.6?{k:'ok',n:'Correct',i:'~'}:{k:'risk',n:'Risqué',i:'⚠'}}
 // ---------- barre d'accueil : coffres + bouton COURIR ----------
 const bar=document.createElement('div');bar.className='homebar';bar.innerHTML='<div class="slots"></div><button class="play" id="playBtn"><b>COURIR</b><small></small></button>';$('#game').appendChild(bar);
 bar.querySelector('.slots').addEventListener('click',e=>{const s=e.target.closest('[data-slot]');if(s)tap(+s.dataset.slot)});$('#playBtn').onclick=()=>openCourses();
 function render(){const now=Date.now();bar.querySelector('.slots').innerHTML=C.chests.map((c,i)=>{if(!c)return `<div class="slot empty" data-slot="${i}" title="Gagne ou place-toi sur le podium pour remplir cet emplacement"><i>${chestSVG('bois','ghost')}</i><small>Libre</small></div>`;const T=CHESTS[c.type],ready=c.ends&&now>=c.ends;
   return `<button class="slot${ready?' ready':c.ends?' going':''}" data-slot="${i}" style="--c:${T.col}${c.ends&&!ready?`;--p:${(1-(c.ends-now)/(T.min*6e4)).toFixed(3)}`:''}" aria-label="Coffre ${T.n}${ready?' : prêt, touche pour l’ouvrir':c.ends?' en cours d’ouverture':` : touche pour lancer son ouverture (${fmtMin(T.min)})`}"><i>${chestSVG(c.type,ready?'ready':'')}</i><small${c.ends&&!ready?` data-ends="${c.ends}"`:''}>${ready?'OUVRIR':c.ends?chestLeft(c.ends-now):fmtMin(T.min)}</small>${c.ends&&!ready?'<span class="prog"></span>':''}</button>`}).join('');
  const h=stable.active(),sf=suit(h);$('#playBtn small').innerHTML=`${escapeHTML(RACE.n)} · <span class="suit ${sf.k}">${sf.i} ${escapeHTML(h.name)}</span>`;
  const n=C.chests.filter(c=>c&&c.ends&&now>=c.ends).length;bar.classList.toggle('has-ready',!!n)}
 setInterval(render,20e3);champion.on(render);
 // décompte à la seconde (emplacements et fenêtre du coffre ouverte) ; quand un coffre devient prêt : tout est redessiné, un petit son
 setInterval(()=>{if(document.hidden)return;const now=Date.now();let ready=false;
  bar.querySelectorAll('.slot.going small[data-ends]').forEach(el=>{const e=+el.dataset.ends,sl=el.parentNode,T=CHESTS[C.chests[+sl.dataset.slot]?.type];if(now>=e){ready=true;return}el.textContent=chestLeft(e-now);if(T)sl.style.setProperty('--p',(1-(e-now)/(T.min*6e4)).toFixed(3))});
  const pop=$('#panelBody .chest-pop[data-chest]');if(pop&&$('#panel').classList.contains('open')){const i=+pop.dataset.chest,c=C.chests[i];
   pop.querySelectorAll('.chest-left[data-ends]').forEach(el=>el.textContent=chestLeft(+el.dataset.ends-now));
   if(c&&c.ends&&pop.classList.contains('timing')){const T=CHESTS[c.type],bt=pop.querySelector('[data-open-gems]'),w=pop.querySelector('.chest-bar i');if(w)w.style.width=(100*Math.min(1,1-(c.ends-now)/(T.min*6e4))).toFixed(1)+'%';
    if(now>=c.ends){pop.classList.remove('timing');pop.classList.add('ready');pop.querySelector('.chest-count').innerHTML='<b>Prêt !</b>';if(bt){bt.outerHTML=`<button class="action green" data-open-free="${i}">OUVRIR</button>`}}
    else if(bt){const k=gemCost(c.ends-now);if(+bt.dataset.cost!==k){bt.dataset.cost=k;bt.textContent=`OUVRIR MAINTENANT · 💎 ${k}`}}}}
  if(ready){render();sound.coin()}},1000);
 return{onRace,render,suit,addChest,login,get elixirs(){return C.elixirs},useElixir(){if(C.elixirs<1)return false;C.elixirs--;save();return true},get streak(){return C.streak}}})();
meta.render();if(career.data.stats?.races>0)meta.login();{const s2=sync;sync=function(){s2();meta.render()}}
