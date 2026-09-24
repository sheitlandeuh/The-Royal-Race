/* ===== Méta-jeu : coffres, séries de victoires, récompense quotidienne, adéquation cheval/course, barre d'accueil ===== */
const CHESTS={bois:{n:'en bois',min:15,col:'#a8733f',ico:'🧰'},argent:{n:'d’argent',min:60,col:'#c9d3dc',ico:'🎁'},or:{n:'d’or',min:180,col:'#f3c64a',ico:'💰'},royal:{n:'royal',min:480,col:'#b98cff',ico:'👑'}};
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
  if(c.ends){const min=Math.ceil((c.ends-now)/6e4),cost=Math.max(1,Math.ceil(min/6));return confirmGems(i,cost,min)}
  if(C.chests.some(x=>x&&x.ends&&x.ends>now))return confirmGems(i,Math.max(1,Math.ceil(CHESTS[c.type].min/6)),CHESTS[c.type].min,true);
  c.ends=now+CHESTS[c.type].min*6e4;save();render();toast(`Ouverture du coffre ${CHESTS[c.type].n} : ${fmtMin(CHESTS[c.type].min)}`)}
 function confirmGems(i,cost,min,busy){$('#panelTitle').textContent=`Coffre ${CHESTS[C.chests[i].type].n}`;$('#panel .card').classList.remove('wide');
  $('#panelBody').innerHTML=`<div class="chest-pop"><div class="chest-big" style="--c:${CHESTS[C.chests[i].type].col}">${CHESTS[C.chests[i].type].ico}</div><p>${busy?'Un autre coffre est déjà en cours d’ouverture.':`Encore ${fmtMin(min)} avant l’ouverture.`}</p><button class="action green" data-open-gems="${i}" data-cost="${cost}">OUVRIR MAINTENANT · 💎 ${cost}</button></div>`;$('#panel').classList.add('open')}
 function open(i,paid){const c=C.chests[i];if(!c)return;const o=contents(c.type,Date.now());C.chests[i]=null;state.gold+=o.gold;state.feed+=o.feed;state.gems+=o.gems||0;C.elixirs+=o.elixir||0;save();sync();render();sound.fanfare();buzz([30,30,60]);
  $('#panelTitle').textContent=`Coffre ${CHESTS[c.type].n}`;$('#panel .card').classList.remove('wide');
  $('#panelBody').innerHTML=`<div class="chest-pop open"><div class="chest-big" style="--c:${CHESTS[c.type].col}">${CHESTS[c.type].ico}</div><div class="loot">${[['🪙',o.gold,'or'],['🌾',o.feed,'fourrage'],['💎',o.gems,'gemmes'],['🧪',o.elixir,'élixir d’XP']].filter(x=>x[1]).map(([i,v,n],k)=>`<div style="animation-delay:${.15+k*.18}s"><i>${i}</i><b>+${fmt(v)}</b><small>${n}</small></div>`).join('')}</div><button class="action green" id="lootOk">SUPER !</button></div>`;$('#panel').classList.add('open')}
 const fmtMin=m=>m>=60?`${Math.floor(m/60)} h${m%60?` ${m%60}`:''}`:`${m} min`;
 $('#panelBody').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.openGems!=null){const cost=+b.dataset.cost;if(state.gems<cost)return toast('Pas assez de gemmes');state.gems-=cost;sync();open(+b.dataset.openGems)}else if(b.id==='lootOk'||b.id==='loginOk')$('#panel').classList.remove('open')});
 // ---------- récompense quotidienne ----------
 function login(){const d=new Date().toISOString().slice(0,10);if(C.login.day===d)return;C.login.day=d;C.login.idx=(C.login.idx+1)%7;const R=LOGIN[C.login.idx];
  state.gold+=R.gold||0;state.feed+=R.feed||0;state.gems+=R.gems||0;C.elixirs+=R.elixir||0;if(R.chest)addChest(R.chest);save();sync();
  setTimeout(()=>{if($('#studio').classList.contains('open'))return;$('#panelTitle').textContent='Récompense du jour';$('#panel .card').classList.remove('wide');
   $('#panelBody').innerHTML=`<p class="hint">Reviens chaque jour : la 7e récompense est un coffre d’or.</p><div class="login">${LOGIN.map((x,i)=>`<div class="${i<C.login.idx?'got':i===C.login.idx?'today':''}"><small>Jour ${i+1}</small><i>${x.gold?'🪙':x.feed?'🌾':x.gems?'💎':x.elixir?'🧪':'💰'}</i><b>${x.gold?fmt(x.gold):x.feed?fmt(x.feed):x.gems||x.elixir||'Coffre'}</b></div>`).join('')}</div><button class="action green" id="loginOk">RÉCUPÉRER</button>`;$('#panel').classList.add('open');sound.coin()},1400)}
 // ---------- adéquation cheval / course ----------
 function suit(h,m=RACE){const T=TERRAINS[m.terrain],d=Math.abs(h.dist-m.dist)/400,terr=T.drain>1?(65-h.stats.end)/15:0,s=d*1.2+Math.max(0,terr)+(h.dist<m.dist?d*.5:0)+(h.fatigue>55?1:0);
  return s<.7?{k:'ideal',n:'Idéal',i:'✓'}:s<1.6?{k:'ok',n:'Correct',i:'~'}:{k:'risk',n:'Risqué',i:'⚠'}}
 // ---------- barre d'accueil : coffres + bouton COURIR ----------
 const bar=document.createElement('div');bar.className='homebar';bar.innerHTML='<div class="slots"></div><button class="play" id="playBtn"><b>COURIR</b><small></small></button>';$('#game').appendChild(bar);
 bar.querySelector('.slots').addEventListener('click',e=>{const s=e.target.closest('[data-slot]');if(s)tap(+s.dataset.slot)});$('#playBtn').onclick=()=>openCourses();
 function render(){const now=Date.now();bar.querySelector('.slots').innerHTML=C.chests.map((c,i)=>{if(!c)return `<div class="slot empty" data-slot="${i}"><small>Gagne une course</small></div>`;const T=CHESTS[c.type],ready=c.ends&&now>=c.ends,left=c.ends?Math.max(0,Math.ceil((c.ends-now)/6e4)):T.min;
   return `<button class="slot${ready?' ready':c.ends?' going':''}" data-slot="${i}" style="--c:${T.col}"><i>${T.ico}</i><small>${ready?'OUVRIR':c.ends?fmtMin(left):fmtMin(T.min)}</small></button>`}).join('');
  const h=stable.active(),sf=suit(h);$('#playBtn small').innerHTML=`${escapeHTML(RACE.n)} · <span class="suit ${sf.k}">${sf.i} ${escapeHTML(h.name)}</span>`;
  const n=C.chests.filter(c=>c&&c.ends&&now>=c.ends).length;bar.classList.toggle('has-ready',!!n)}
 setInterval(render,20e3);champion.on(render);
 return{onRace,render,suit,addChest,login,get elixirs(){return C.elixirs},useElixir(){if(C.elixirs<1)return false;C.elixirs--;save();return true},get streak(){return C.streak}}})();
meta.render();meta.login();{const s2=sync;sync=function(){s2();meta.render()}}
