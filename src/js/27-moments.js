/* ===== Temps forts : jusqu’à 3 décisions tactiques par course, à prendre en 4 secondes ===== */
/* Déterministe : tirage sur un flux dérivé de la graine (le flux des adversaires reste inchangé) + choix du joueur enregistrés au pas près (M.log) */
const MOMENT_TYPES={
 tire:{a:'Le reprendre',b:'Le laisser aller',t:h=>`${h} tire sur les rênes !`,d:()=>`Il veut accélérer tout de suite. ${RACE.dist<=1200?'Sur une course courte, il peut se le permettre.':'Sur cette distance, chaque effort se paiera dans la ligne droite.'}`},
 breche:{a:'Plonger',b:'Rester',t:(h,r,m)=>m.lane<20?'Brèche à la corde !':'Ouverture à l’extérieur !',d:()=>'Un trou s’ouvre : tu peux t’y glisser pour courir libre. Plus ton cheval est intelligent, plus il a de chances de passer.'},
 attaque:{a:'Suivre',b:'Laisser filer',t:(h,r)=>`${r} attaque de loin !`,d:m=>`Le suivre coûte de l’énergie ; le laisser filer, c’est parier qu’il s’usera. Énergie : toi ${Math.round(playerEnergy)} % · lui ≈ ${Math.round(rivalAI[m.r-1].energy/10)*10} %`}};
/* effets (vitesse ajoutée, multiplicateur de dépense d'énergie, durée en pas de 100 ms) — réglés au bot d'équilibrage */
const MOMENT_FX={tireA:{speed:-.025,drain:.4,n:30},tireB:{speed:.055,drain:1.9,n:30},gapOk:{speed:.04,drain:.7,n:25},gapKo:{speed:-.07,drain:1,n:15},attack:{speed:.07,drain:2.8,n:45},follow:{speed:.065,drain:1.7}};
const moments=(()=>{let M=null;const F=(k,t)=>({...MOMENT_FX[k],until:t+(MOMENT_FX[k].n||0)});const DUR=40,ord=n=>n+(n===1?'er':'e');
 const card=document.createElement('div');card.className='moment';card.hidden=true;card.innerHTML='<b class="mo-title"></b><p></p><div class="mo-time"><i></i></div><div class="mo-btns"><button data-mo="a"><kbd>1</kbd><span></span></button><button data-mo="b"><kbd>2</kbd><span></span></button></div>';
 const news=document.createElement('div');news.className='mo-news';$('#raceScreen').append(card,news);
 const say=t=>{news.textContent=t;news.classList.add('show');clearTimeout(news._t);news._t=setTimeout(()=>news.classList.remove('show'),2600)};
 const lane=i=>i?rivalLanes[i-1]:playerLane,rankNow=()=>raceFinished[0]?finishOrder.indexOf(0)+1:progress.map((p,i)=>({p,i})).sort((a,b)=>b.p-a.p).findIndex(x=>x.i===0)+1;
 // le programme des temps forts est tiré au départ : chacun a sa chance et son point de déclenchement (en % de course)
 function reset(){const r=seeded((raceSeed^0x5bd1e995)>>>0),tem=stable.active().stats.tem;M={rng:r,cur:null,pending:null,next:20,fx:[],log:[],said:{},
  plan:{tire:r()<.35+(70-tem)*.015?10+r()*24:null,breche:r()<.7?24+r()*36:null,attaque:r()<.8?42+r()*24:null}};card.hidden=true;news.classList.remove('show')}
 function fx(i){const f=M&&M.fx[i];return f&&raceTime<f.until?f:{speed:0,drain:1}}
 // quel temps fort peut surgir maintenant ?
 function pick(){const ph=progress[0],h=stable.active(),due=(k,max)=>M.plan[k]!=null&&ph>=M.plan[k]&&ph<max;
  if(due('tire',40))return{k:'tire'};
  // ouverture : seulement si le joueur est enfermé derrière un cheval ou loin de la corde, et qu'un couloir libre existe
  if(due('breche',72)){const a=nearbyHorses(0)[0],stuck=a&&a.gap<2&&Math.abs(a.l-playerLane)<11;const free=[12,30,48].find(L=>Math.abs(L-playerLane)>=10&&!progress.some((p,j)=>j&&!raceFinished[j]&&Math.abs(lane(j)-L)<9&&p-ph>-1.2&&p-ph<3.5));if((stuck||playerLane>30)&&free!=null)return{k:'breche',lane:free,p:Math.min(.95,.5+h.stats.tac*.0055)}}
  if(due('attaque',74)){const c=rivalAI.map((ai,i)=>({ai,i:i+1,g:progress[i+1]-ph})).filter(x=>!raceFinished[x.i]&&!x.ai.final&&x.ai.energy>45&&x.g>-3&&x.g<4).sort((a,b)=>Math.abs(a.g)-Math.abs(b.g))[0];if(c)return{k:'attaque',r:c.i}}
  return null}
 function open(m){const T=MOMENT_TYPES[m.k],name=m.r?raceNames[m.r]:'';M.plan[m.k]=null;M.cur={...m,start:raceTime,end:raceTime+DUR,rank0:rankNow()};
  // l'attaque adverse a lieu quoi que fasse le joueur : il accélère, mais s'use deux fois plus vite
  if(m.k==='attaque')M.fx[m.r]=F('attack',raceTime);
  card.querySelector('.mo-title').textContent=T.t(HN(),name,m);card.querySelector('p').textContent=T.d(m);card.querySelector('[data-mo=a] span').textContent=T.a+(m.p?` · ${Math.round(m.p*100)} %`:'');card.querySelector('[data-mo=b] span').textContent=T.b;
  card.dataset.k=m.k;card.hidden=false;card.querySelector('.mo-time i').style.transform='scaleX(1)';buzz(20);sound.say(T.t(HN(),name,m));setTimeout(()=>M&&M.cur&&coach.tip('moment',`<b>Temps fort !</b> Tu as 4 secondes pour choisir${matchMedia('(hover:none)').matches?'':' (touches <b>1</b> / <b>2</b> au clavier)'}. Sans réponse, c’est le choix de droite qui s’applique. Regarde ton endurance et la place devant toi.`,'.moment'),300)}
 function resolve(ch){const c=M.cur,t=raceTime;M.cur=null;card.hidden=true;let ok=true;
  if(c.k==='tire')M.fx[0]=F(ch==='a'?'tireA':'tireB',t);
  if(c.k==='breche'&&ch==='a'){ok=M.rng()<c.p;if(ok){playerLane=c.lane;updateLane();M.fx[0]=F('gapOk',t)}else M.fx[0]=F('gapKo',t)}
  // suivre = hausser le rythme avec lui ; on ne se rabat dans son sillage que s'il est sur une trajectoire proche (sinon on irait perdre du terrain à l'extérieur)
  if(c.k==='attaque'&&ch==='a'){if(Math.abs(lane(c.r)-playerLane)<20){playerLane=clampRace(lane(c.r),7,93);updateLane()}M.fx[0]={...MOMENT_FX.follow,until:c.start+MOMENT_FX.attack.n}}
  const e={k:c.k,ch,ok,r:c.r,t,rank0:c.rank0,dPos:null};M.log.push(e);M.watch=e;
  say(c.k==='breche'&&ch==='a'?(ok?(c.lane<20?'Tu te glisses à la corde !':'Tu trouves l’ouverture !'):'La brèche se referme : tu perds ton élan'):c.k==='attaque'?(ch==='a'?`Tu suis ${raceNames[c.r]}`:`Tu laisses filer ${raceNames[c.r]}`):ch==='a'?`${HN()} se relâche`:`${HN()} accélère`)}
 function tick(){if(!M||!rivalAI.length)return;
  if(M.watch&&raceTime>=M.watch.t+50){const d=M.watch.dPos=M.watch.rank0-rankNow();if(d>0)career.bump('moment',d);M.watch=null}
  if(M.cur){if(M.pending||raceTime>=M.cur.end||raceFinished[0]){resolve(M.pending||'b');M.pending=null}else card.querySelector('.mo-time i').style.transform=`scaleX(${(M.cur.end-raceTime)/DUR})`}
  else if(!raceFinished[0]&&!playerFinal&&raceTime>=M.next){const m=pick();if(m){open(m);M.next=raceTime+DUR+55}else M.next=raceTime+3}
  // lecture de course : qui lance son sprint, qui craque devant toi
  rivalAI.forEach((ai,i)=>{const j=i+1,g=progress[j]-progress[0];if(raceFinished[j]||raceFinished[0])return;
   if(ai.final&&!M.said['f'+j]&&g>-4&&g<8){M.said['f'+j]=1;say(`${raceNames[j]} lance son sprint`)}
   else if(ai.energy<=0&&!M.said['e'+j]&&g>-2&&g<8){M.said['e'+j]=1;say(`${raceNames[j]} est à bout de souffle !`)}})}
 function choose(ch){if(M&&M.cur&&!M.pending)M.pending=ch}
 card.addEventListener('click',e=>{const b=e.target.closest('[data-mo]');if(b)choose(b.dataset.mo)});
 document.addEventListener('keydown',e=>{if(!M||!M.cur)return;if(e.code==='Digit1'||e.code==='Numpad1')choose('a');if(e.code==='Digit2'||e.code==='Numpad2')choose('b')});
 // bilan affiché sous l'analyse de course
 function summary(){if(!M||!M.log.length)return '';const L=M.log.map(e=>{const n=e.r?raceNames[e.r]:'',fin=e.r?finishOrder.indexOf(e.r)+1:0,me=finishOrder.indexOf(0)+1,
   txt=e.k==='tire'?(e.ch==='a'?'Cheval repris : énergie économisée':'Cheval laissé libre : plus vite, mais plus d’énergie brûlée'):e.k==='breche'?(e.ch==='b'?'Ouverture ignorée':e.ok?'Ouverture prise : tu cours libre':'Ouverture tentée : elle s’est refermée'):`${e.ch==='a'?'Attaque de':'Tu as laissé filer'} ${escapeHTML(n)}${e.ch==='a'?' suivie':''} — il finit ${ord(fin)}${fin>me?', derrière toi':''}`;
   const d=e.dPos==null?'':e.dPos>0?` <em class="up">+${e.dPos} place${e.dPos>1?'s':''}</em>`:e.dPos<0?` <em class="down">${e.dPos} place${e.dPos<-1?'s':''}</em>`:'';return `<li>${txt}${d}</li>`}).join('');
  return `<div class="mo-sum"><b>⚡ Temps forts</b><ul>${L}</ul></div>`}
 return{reset,fx,tick,choose,summary,get cur(){return M&&M.cur},get log(){return M?M.log:[]},get active(){return !!(M&&M.cur)}}})();
hooks.on('race:launch',()=>moments.reset());
hooks.on('race:end',()=>{$('#fbStars').insertAdjacentHTML('beforeend',moments.summary());replay.show()});
/* ===== Recourir : relancer la même course en un geste (nouveau plateau), ou changer de cheval s'il est fatigué ===== */
const replay=(()=>{const b=document.createElement('button');b.className='action';b.id='raceAgain';$('#returnDomain').after(b);
 function show(){const h=stable.active();if(RACE.tour){b.hidden=true;return}b.hidden=false;const tired=h.injury||h.fatigue>=90;b.dataset.mode=tired?'swap':'again';b.innerHTML=tired?`CHANGER DE CHEVAL<small>${escapeHTML(h.name)} doit se reposer</small>`:`RECOURIR<small>🌾 ${fmt(RACE.fee)} · ${escapeHTML(h.name)}</small>`}
 b.onclick=()=>{leaveRace();if(b.dataset.mode==='swap')return openCourses();currentField=null;buildField();startRace()};
 return{show}})();
