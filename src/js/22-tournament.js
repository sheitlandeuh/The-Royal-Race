/* ===== Tournoi royal du jour : 3 manches (qualifications, demi-finale, finale) avec le même cheval — la fatigue se cumule ===== */
const TOUR_ROUNDS=['Qualifications','Demi-finale','Finale'],TOUR_GEMS=10;
const tour=(()=>{const C=career.data;C.tour=C.tour||{day:'',used:false,cups:0,a:null,best:0};const T=C.tour;let pickId=null,armed=false;
 const save=()=>{try{localStorage.setItem('trr.progress',JSON.stringify(C))}catch(e){}};
 const day=()=>new Date().toISOString().slice(0,10),k=()=>1+career.league()*.6;
 function roll(){if(T.day!==day()){T.day=day();T.used=false;save()}}
 // conditions du jour, identiques pour tous les joueurs d'une même ligue
 function conf(){let x=[...(day()+career.league())].reduce((a,c)=>a*31+c.charCodeAt(0),11)%2147483647;const r=()=>(x=(x*16807)%2147483647)/2147483647;r();
  const dist=[1200,1600,2000,2400][Math.floor(r()*4)],ter=career.league()?['bon','souple','lourd'][Math.floor(r()*3)]:['bon','souple'][Math.floor(r()*2)];return{dist,terrain:ter}}
 function meeting(){const a=T.a;if(!a)return{...MEETINGS[1]};const L=career.league();
  return{id:'tour',tour:true,round:a.round,n:`Tournoi royal · ${TOUR_ROUNDS[a.round]}`,dist:a.dist,terrain:a.terrain,league:0,diff:L*2-2+a.round*2.5,purse:Math.round([1500,2500,4000][a.round]*k()/50)*50,fee:0}}
 const prizes=()=>{const K=k(),L=career.league();return[{gold:Math.round(8000*K/50)*50,gems:20,chest:L>=2?'royal':'or'},{gold:Math.round(4000*K/50)*50,chest:'argent'},{gold:Math.round(2500*K/50)*50,chest:'bois'}]};
 const ptxt=p=>[p.gold?`🪙 ${fmt(p.gold)}`:'',p.gems?`💎 ${p.gems}`:'',p.chest?`${CHESTS[p.chest].ico} coffre ${CHESTS[p.chest].n}`:''].filter(Boolean).join(' · ');
 function enter(){roll();const h=stable.byId(pickId||stable.data.active);if(!h)return;if(h.injury||h.fatigue>=70)return toast(`${h.name} doit être reposé (fatigue < 70) pour un tournoi`);
  if(T.used){if(state.gems<TOUR_GEMS)return toast('Pas assez de gemmes');state.gems-=TOUR_GEMS;sync()}T.used=true;const c=conf();T.a={horse:h.id,round:0,dist:c.dist,terrain:c.terrain,ranks:[]};save();refresh();
  stable.setActive(h.id);champion.emit();RACE=meeting();sound.fanfare();openCourses()}
 function abandon(){T.a=null;save();RACE={...MEETINGS[1]};refresh();open()}
 // appelé à la fin de chaque course
 function after(rank){if(!RACE.tour||!T.a)return '';const a=T.a;a.ranks.push(rank);let msg;
  if(a.round<2){if(rank<=3){a.round++;msg=`Qualifié ! Prochaine manche : <b>${TOUR_ROUNDS[a.round]}</b>`;RACE=meeting()}
   else{const g=Math.round((a.round?1500:800)*k()/50)*50;state.gold+=g;msg=`Éliminé en ${TOUR_ROUNDS[a.round].toLowerCase()} · lot de consolation +${fmt(g)} or`;T.best=Math.max(T.best,a.round);T.a=null}}
  else{const p=prizes()[rank-1];T.best=Math.max(T.best,rank===1?3:2);if(p){state.gold+=p.gold||0;state.gems+=p.gems||0;const ch=p.chest&&meta.addChest(p.chest);msg=rank===1?`🏆 VAINQUEUR DU TOURNOI ROYAL ! ${ptxt(p)}${p.chest&&!ch?' (coffres pleins)':''}`:`Finale : ${rank}e · ${ptxt(p)}`;if(rank===1)T.cups++}else msg=`Finale : ${rank}e place`;T.a=null}
  sync();save();refresh();return msg}
 function pips(a){return `<div class="pips">${TOUR_ROUNDS.map((n,i)=>`<span class="${a&&i<a.round?'done':a&&i===a.round?'cur':''}">${a&&i<a.round?'✓ ':''}${n}</span>`).join('<i>›</i>')}</div>`}
 function html(){roll();const a=T.a,c=a?{dist:a.dist,terrain:a.terrain}:conf(),H=stable.data.horses,P=prizes(),m={dist:c.dist,terrain:c.terrain};if(!pickId||!stable.byId(pickId))pickId=[...H].sort((x,y)=>({ideal:0,ok:1,risk:2}[meta.suit(x,m).k]-{ideal:0,ok:1,risk:2}[meta.suit(y,m).k])||stable.rating(y)-stable.rating(x))[0].id;
  const head=`<div class="tour-head"><div class="cup-art">🏆</div><div><b>Tournoi royal du jour</b><small>${fmt(c.dist)} m · terrain ${TERRAINS[c.terrain].n.toLowerCase()} · ${distName(c.dist)}</small><p>3 manches avec <b>le même cheval</b>. Termine dans les <b>3 premiers</b> pour passer à la manche suivante. La fatigue s’accumule : soigne-le entre deux manches !</p></div></div>${pips(a)}`;
  if(a){const h=stable.byId(a.horse);return `${head}<div class="tour-live">${h?`<canvas width="84" height="112" data-hid="${h.id}"></canvas><div><b>${escapeHTML(h.name)}</b><small>Fatigue : ${condLabel('fatigue',h.fatigue).toLowerCase()} (${Math.round(h.fatigue)}) · ${a.ranks.map((r,i)=>`${TOUR_ROUNDS[i]} : ${r}e`).join(' · ')||'prêt'}</small></div>`:''}<div class="tour-btns"><button class="action ghost-red" data-tour-quit>${armed?'CONFIRMER L’ABANDON':'ABANDONNER'}</button><button class="action" data-tour-care>SOIGNER</button><button class="action green" data-tour-go>COURIR · ${TOUR_ROUNDS[a.round].toUpperCase()}</button></div></div>`}
  return `${head}<div class="tour-prizes">${P.map((p,i)=>`<div><i>${['🥇','🥈','🥉'][i]}</i><small>${ptxt(p)}</small></div>`).join('')}</div>
  <div class="st-horses">${H.map(h=>{const sf=meta.suit(h,m);return `<button class="st-pick${h.id===pickId?' on':''}" data-tour-pick="${h.id}"><canvas width="84" height="112" data-hid="${h.id}"></canvas><div><b>${escapeHTML(h.name)}</b><small>Niv. ${h.level} · ${condLabel('fatigue',h.fatigue).toLowerCase()}</small><br><span class="note">${stable.rating(h)}</span> <em class="suit ${sf.k}">${sf.i} ${sf.n}</em></div></button>`}).join('')}</div>
  <div class="race-entry"><button class="action green" data-tour-enter>🏆 ENTRER DANS LE TOURNOI · ${T.used?`💎 ${TOUR_GEMS}`:'GRATUIT AUJOURD’HUI'}</button></div>${T.cups?`<p class="hint" style="text-align:center">Coupes remportées : <b>${T.cups}</b> 🏆</p>`:''}`}
 function open(){career.openEvents();$('#panelTitle').textContent='Événements';$('#panel .card').classList.add('wide');$('#panelBody').insertAdjacentHTML('afterbegin',`<section class="tour">${html()}</section>`);
  $$('#panelBody .tour canvas[data-hid]').forEach(cv=>drawPortrait(cv,stable.byId(cv.dataset.hid),1.6,-2));coach.tip('tour','Chaque jour, un <b>Tournoi royal</b> gratuit : choisis le cheval le mieux adapté (pastille verte), finis dans les 3 premiers pour passer la manche, et remporte la coupe en finale !','.tour')}
 function card(){if(!T.a)return '';const m=meeting();return `<button class="meet tourm${RACE.tour?' on':''}" data-meet="tour"><b>🏆 Tournoi royal</b><em class="suit ideal">${TOUR_ROUNDS[T.a.round]}</em><small>${fmt(m.dist)} m · ${TERRAINS[m.terrain].n}</small><span>Manche ${T.a.round+1} / 3</span></button>`}
 function badge(){roll();$('.nav[data-view=events]')?.classList.toggle('hot',!T.used||!!T.a);const b=$('[data-panel=events] .badge');if(!b)return;if(!T.used||T.a){b.hidden=false;b.textContent='!'}}
 const refresh=()=>{try{career.badges()}catch(e){}};
 $('#panelBody').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;
  if(b.dataset.tourPick){pickId=b.dataset.tourPick;open()}else if(b.hasAttribute('data-tour-enter'))enter();
  else if(b.hasAttribute('data-tour-go')){stable.setActive(T.a.horse);champion.emit();RACE=meeting();openCourses()}
  else if(b.hasAttribute('data-tour-care')){stUI.horse=T.a.horse;openStable({tab:'care'})}
  else if(b.hasAttribute('data-tour-quit')){if(!armed){armed=true;open();setTimeout(()=>{armed=false},4000);return}armed=false;abandon()}});
 // bouton « manche suivante » sur l'écran de résultat
 const nb=document.createElement('button');nb.className='action';nb.id='nextRound';nb.hidden=true;$('#returnDomain').before(nb);
 nb.onclick=()=>{leaveRace();openCourses()};
 function resultBtn(){nb.hidden=!T.a;if(T.a)nb.textContent=`🏆 ${TOUR_ROUNDS[T.a.round].toUpperCase()}`}
 badge();return{meeting,after,open,card,badge,resultBtn,conf,get active(){return T.a},get cups(){return T.cups},get horse(){return T.a&&T.a.horse}}})();
