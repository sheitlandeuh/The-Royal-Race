/* ===== Carrière : ligues, programme des courses, missions du jour, événement de la semaine ===== */
const LEAGUES=[{id:'bronze',n:'Bronze',min:0,col:'#c9834a',reward:{gold:0}},{id:'argent',n:'Argent',min:300,col:'#c9d3dc',reward:{gold:10000,gems:20}},
 {id:'or',n:'Or',min:900,col:'#f3c64a',reward:{gold:25000,gems:60}},{id:'royale',n:'Royale',min:1800,col:'#b98cff',reward:{gold:60000,gems:150}}];
const TERRAINS={bon:{n:'Bon',speed:1,drain:1,d:'Terrain rapide'},souple:{n:'Souple',speed:.985,drain:1.1,d:'L’endurance compte davantage'},lourd:{n:'Lourd',speed:.965,drain:1.22,d:'Épuisant : réservé aux chevaux de tenue'}};
const MEETINGS=[
 {id:'m1',n:'Prix des Écuries',dist:1200,terrain:'bon',league:0,diff:-4,purse:3500,fee:300},
 {id:'m2',n:'Grand Prix du Domaine Royal',dist:1600,terrain:'bon',league:0,diff:0,purse:7000,fee:500},
 {id:'m3',n:'Prix de la Forêt',dist:2000,terrain:'souple',league:1,diff:1,purse:8500,fee:600},
 {id:'m4',n:'Coupe d’Automne',dist:2400,terrain:'lourd',league:2,diff:3,purse:14000,fee:900},
 {id:'m5',n:'Critérium des Sprinters',dist:1200,terrain:'bon',league:2,diff:4,purse:15000,fee:900},
 {id:'m6',n:'Derby du Royaume',dist:2400,terrain:'bon',league:3,diff:7,purse:40000,fee:2000}];
const TROPHY_DELTA=[30,18,10,2,-6,-12];
const MISSION_POOL=[{k:'train',n:'Entraîner un cheval',goal:3,r:{gold:1500}},{k:'race',n:'Disputer des courses',goal:2,r:{feed:1500}},{k:'top3',n:'Finir sur le podium',goal:1,r:{gold:2500}},
 {k:'win',n:'Gagner une course',goal:1,r:{gems:10}},{k:'care',n:'Soigner ou reposer un cheval',goal:1,r:{feed:800}},{k:'sprint',n:'Réussir un sprint final parfait',goal:1,r:{gold:2000}},{k:'perfect',n:'Réussir un départ parfait',goal:1,r:{gems:5}},{k:'moment',n:'Gagner 3 places sur des temps forts',goal:3,r:{gold:2500}}];
let RACE={...MEETINGS[1]};
const career=(()=>{const day=()=>new Date().toISOString().slice(0,10),week=()=>{const d=new Date(),t=new Date(Date.UTC(d.getFullYear(),d.getMonth(),d.getDate()));const n=(t.getUTCDay()+6)%7;t.setUTCDate(t.getUTCDate()-n+3);const f=new Date(Date.UTC(t.getUTCFullYear(),0,4));return t.getUTCFullYear()+'-S'+(1+Math.round(((t-f)/864e5-3+((f.getUTCDay()+6)%7))/7))};
 let C={};try{C=JSON.parse(localStorage.getItem('trr.progress')||'{}')}catch(e){}
 C.best=Math.max(C.best||0,state.trophies);C.claimed=C.claimed||[];C.tips=C.tips||{};C.stats=C.stats||{races:0,wins:0};
 const save=()=>{try{localStorage.setItem('trr.progress',JSON.stringify(C))}catch(e){}};
 function roll(){if(C.day!==day()){C.day=day();let x=[...day()].reduce((a,c)=>a*31+c.charCodeAt(0),7)%2147483647;const r=()=>(x=(x*16807)%2147483647)/2147483647;const pool=[...MISSION_POOL];C.missions=[];while(C.missions.length<3){const m=pool.splice(Math.floor(r()*pool.length),1)[0];C.missions.push({k:m.k,p:0,done:false})}}
  if(C.week!==week()){C.week=week();C.weekRaces=0;C.weekClaimed=false}save()}
 roll();
 const league=(t=state.trophies)=>{let i=0;LEAGUES.forEach((l,k)=>{if(t>=l.min)i=k});return i};
 function bump(k,n=1){roll();let changed=false;for(const m of C.missions){const d=MISSION_POOL.find(x=>x.k===m.k);if(m.k===k&&!m.done&&m.p<d.goal){m.p=Math.min(d.goal,m.p+n);changed=true;if(m.p>=d.goal)toast(`Mission accomplie : ${d.n} ✓`)}}if(changed){save();badges()}}
 function give(r){state.gold+=r.gold||0;state.feed+=r.feed||0;state.gems+=r.gems||0;sync();sound.coin()}
 const rtxt=r=>[r.gold?`🪙 ${fmt(r.gold)}`:'',r.feed?`🌾 ${fmt(r.feed)}`:'',r.gems?`💎 ${r.gems}`:''].filter(Boolean).join(' · ');
 function claimMission(i){const m=C.missions[i],d=MISSION_POOL.find(x=>x.k===m.k);if(!m||m.done||m.p<d.goal)return;m.done=true;give(d.r);save();badges()}
 function badges(){const b=$('[data-panel=missions] .badge'),n=C.missions.filter(m=>!m.done).length;if(b){b.textContent=n;b.hidden=!n}const e=$('[data-panel=events] .badge');if(e){const ready=C.weekRaces>=5&&!C.weekClaimed;e.textContent=ready?'!':Math.max(0,5-C.weekRaces);e.hidden=C.weekClaimed}
  try{tour.badge()}catch(e){}const lv=$('.level');if(lv)lv.textContent=stable.active().level;const c=$('.profile-card small');if(c)c.innerHTML=`🏆 <span id="trophies">${fmt(state.trophies)}</span> · Ligue ${LEAGUES[league()].n}`}
 function afterRace(rank,meeting,stars=0){roll();const before=league(),d=TROPHY_DELTA[rank-1];state.trophies=Math.max(0,state.trophies+d);C.best=Math.max(C.best,state.trophies);C.weekRaces++;C.stats.races++;if(rank===1)C.stats.wins++;save();
  bump('race');if(rank<=3)bump('top3');if(rank===1)bump('win');const after=league();sync();badges();return{d,promoted:after>before?LEAGUES[after]:null,relegated:after<before?LEAGUES[after]:null,...meta.onRace(rank,stars)}}
 function claimLeague(i){if(C.claimed.includes(i)||C.best<LEAGUES[i].min)return;C.claimed.push(i);give(LEAGUES[i].reward);save();openTrophies()}
 function claimWeek(){if(C.weekRaces<5||C.weekClaimed)return;C.weekClaimed=true;save();const got=stable.addHorse({name:'Étoile du Roi',coat:'noir',stats:{vit:74,acc:70,end:72,dep:64,tac:66,tem:68},caps:{vit:97,acc:94,end:96,dep:90,tac:94,tem:92},dist:2000,level:9,rare:true});
  if(got){toast('Nouveau cheval rare : Étoile du Roi rejoint ton écurie !');sound.fanfare()}else give({gems:60});badges();openEvents()}
 function openMissions(){roll();$('#panelTitle').textContent='Missions du jour';$('#panel .card').classList.remove('wide');const left=new Date();left.setHours(24,0,0,0);const h=Math.ceil((left-new Date())/36e5);
  $('#panelBody').innerHTML=`<p class="hint">Nouvelles missions dans ${h} h.</p><div class="missions">${C.missions.map((m,i)=>{const d=MISSION_POOL.find(x=>x.k===m.k);return `<article class="mis${m.done?' done':''}"><div><b>${d.n}</b><div class="bar"><i style="width:${m.p/d.goal*100}%"></i></div><small>${m.p} / ${d.goal} · ${rtxt(d.r)}</small></div>${m.done?'<span class="chip">Récupéré</span>':`<button class="action green" data-claim-m="${i}" ${m.p<d.goal?'disabled':''}>RÉCUPÉRER</button>`}</article>`}).join('')}</div>`;$('#panel').classList.add('open')}
 function openTrophies(){$('#panelTitle').textContent='Ligues';$('#panel .card').classList.remove('wide');const cur=league(),t=state.trophies,next=LEAGUES[cur+1];
  $('#panelBody').innerHTML=`<p class="hint"><b style="color:${LEAGUES[cur].col}">Ligue ${LEAGUES[cur].n}</b> · ${fmt(t)} trophées${next?` · encore ${fmt(next.min-t)} pour la ligue ${next.n}`:''}. Victoire +30, 2e +18, 3e +10, 4e +2, 5e −6, 6e −12.</p>
  <div class="ladder">${LEAGUES.map((l,i)=>`<article class="rung${i===cur?' cur':''}${C.best>=l.min?' reached':''}"><i style="background:${l.col}"></i><div><b>${l.n}</b><small>${fmt(l.min)} trophées · courses : ${MEETINGS.filter(m=>m.league===i).map(m=>m.n).join(', ')||'—'}</small></div>${i&&!C.claimed.includes(i)?`<button class="action green" data-claim-l="${i}" ${C.best<l.min?'disabled':''}>${rtxt(l.reward)}</button>`:i?'<span class="chip">Récupéré</span>':''}</article>`).reverse().join('')}</div>`;$('#panel').classList.add('open')}
 function openEvents(){roll();$('#panelTitle').textContent='Derby du Royaume';$('#panel .card').classList.remove('wide');const n=Math.min(5,C.weekRaces),has=stable.data.horses.some(h=>h.name==='Étoile du Roi');
  $('#panelBody').innerHTML=`<div class="event"><div class="ev-art">👑</div><div><p style="margin:0">Termine <b>5 courses cette semaine</b> pour recevoir <b>Étoile du Roi</b>, un pur-sang noir rare (note 70, potentiel exceptionnel, cheval de tenue).${has?' Tu l’as déjà : la récompense sera 60 gemmes.':''}</p>
  <div class="bar" style="margin:12px 0 6px"><i style="width:${n/5*100}%"></i></div><small>${n} / 5 courses · se termine dimanche soir</small><div style="margin-top:12px">${C.weekClaimed?'<span class="chip">Récompense récupérée</span>':`<button class="action green" data-claim-w ${n<5?'disabled':''}>RÉCUPÉRER</button>`}</div></div></div>`;$('#panel').classList.add('open')}
 $('#panelBody').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.claimM!=null){claimMission(+b.dataset.claimM);openMissions()}else if(b.dataset.claimL!=null)claimLeague(+b.dataset.claimL);else if(b.hasAttribute('data-claim-w'))claimWeek()});
 return{bump,afterRace,league,badges,openMissions,openTrophies,openEvents,tip:k=>{if(C.tips[k])return false;C.tips[k]=1;save();return true},get data(){return C},roll}})();
/* ---------- programme des courses ---------- */
function meetingCard(m){const lock=m.league>career.league(),T=TERRAINS[m.terrain],sf=meta.suit(stable.active(),m);return `<button class="meet${RACE.id===m.id?' on':''}" data-meet="${m.id}" ${lock?'disabled':''}><b>${m.n}</b>${lock?'':`<em class="suit ${sf.k}">${sf.i} ${sf.n}</em>`}<small>${fmt(m.dist)} m · ${T.n} · ${distName(m.dist)}</small><span>🪙 ${fmt(purseOf(m))}${lock?` · 🔒 Ligue ${LEAGUES[m.league].n}`:''}</span></button>`}
$('#panelBody').addEventListener('click',e=>{const b=e.target.closest('[data-meet]');if(!b)return;if(b.dataset.meet==='tour'){RACE=tour.meeting();stable.setActive(tour.horse);champion.emit()}else RACE={...MEETINGS.find(m=>m.id===b.dataset.meet)};buildField();renderCourses()});
