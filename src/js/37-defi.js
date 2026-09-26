/* ===== Défi du jour : la même course pour tous les joueurs, contre son propre fantôme =====
   Graine et plateau tirés de la date (identiques sur tous les appareils : base du futur classement en ligne).
   On la retente autant qu'on veut ; le meilleur essai du jour court à côté, en fantôme translucide.
   Ni trophées, ni gains, ni fatigue : seulement un coffre à la première arrivée du jour et des gemmes par record battu. */
const defi=(()=>{
 const KEY='trr.defi',day=()=>new Date().toISOString().slice(0,10);
 const hash=s=>[...s].reduce((a,c)=>(a*31+c.charCodeAt(0))%2147483647,7);
 let D={};try{D=JSON.parse(localStorage.getItem(KEY)||'{}')}catch(e){}
 const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(D))}catch(e){}};
 function today(){if(D.day!==day())D={day:day(),best:null,tries:0,first:false,pbGems:0,ghost:null};return D}
 // course du jour : graine, distance et terrain tirés de la date
 function meeting(){const h=hash('defi-'+day()),base=MEETINGS.filter(m=>m.league<=1)[h%3];
  return{...base,id:'defi',n:'Défi du jour',defi:true,fee:0,purse:0,seed:1+h%89999,ref:60+h%6}}
 // plateau identique pour tous : force de référence fixe (pas celle du cheval du joueur), pas de rival personnel
 function field(M=meeting()){const seed=M.seed,rv=stable.rivals(M.ref,5,seed),R=seeded(seed),used=[stable.silks.main],coats=LIVERY.COATS.map(c=>c.id).sort(()=>R()-.5),T=seeded((seed^0x9e3779b9)>>>0);
  return{seed,rivals:rv.map((r,i)=>{const l=LIVERY.random(seed+i*131,used);used.push(l.main);l.coat=coats[i];return{...r,name:raceNames[i+1],livery:l,rating:ratingOf(r.stats)-7,tac:pace.choose(r.stats,T)}})}}
 // tout plateau construit pendant le défi (sélection d'un autre cheval, RECOURIR…) redevient celui du jour
 hooks.on('field:built',F=>{if(RACE.defi)Object.assign(F,field())});
 function select(){RACE=meeting();currentField=null;buildField();renderCourses()}
 // carte dans l'écran des courses
 hooks.on('courses:render',()=>{const g=$('#panelBody .meets');if(!g)return;const T=today(),M=meeting();
  if(RACE.defi){const info=g.nextElementSibling;if(info&&info.tagName==='P')info.innerHTML=`<b style="color:#bfe6ff">Défi du jour</b> · ${fmt(M.dist)} m · Terrain ${TERRAINS[M.terrain].n.toLowerCase()} · <b>gratuit</b>, sans fatigue ni trophées : seul ton meilleur temps compte${T.best?` (record : ${T.best.toFixed(2)} s)`:''}.`;$('#panelBody .taunt')?.remove()}
  g.insertAdjacentHTML('afterbegin',`<button class="meet defi-card${RACE.defi?' on':''}" data-defi><b>⏱️ Défi du jour</b><em class="suit ideal">Même course pour tous</em><small>${fmt(M.dist)} m · ${TERRAINS[M.terrain].n} · ${T.tries?`${T.tries} essai${T.tries>1?'s':''}`:'jamais tenté'}</small><span>${T.best?`Record : ${T.best.toFixed(2)} s`:'🎁 Coffre à la 1re arrivée'}</span></button>`)});
 $('#panelBody').addEventListener('click',e=>{if(e.target.closest('[data-defi]'))select()});
 // trajectoire de l'essai en cours (pour devenir le fantôme s'il bat le record)
 let track=null,ghost=null,gv=0,gap=null;
 hooks.on('race:start',()=>{track=RACE.defi?{p:[],l:[]}:null;gv=0;if(ghost)ghost.visible=false;gap?.classList.remove('show')});
 hooks.on('race:tick',()=>{if(!track||raceFinished[0])return;track.p[raceTime]=+progress[0].toFixed(3);track.l[raceTime]=Math.round(playerLane);
  const G=today().ghost;if(G&&gap){const gp=G.p[Math.min(raceTime,G.p.length-1)]??100,m=Math.round((gp-progress[0])*RACE.dist/100);gap.innerHTML=Math.abs(m)<2?'👻 Au coude à coude avec ton fantôme':m>0?`👻 Fantôme <b>${m} m</b> devant`:`👻 Tu as <b>${-m} m</b> d’avance`;gap.classList.add('show');gap.classList.toggle('ahead',m<=0)}});
 hooks.on('race:header',()=>{if(!RACE.defi)return;const T=today();$('.race-head small').textContent+=T.best?` • Record ${T.best.toFixed(2)} s`:' • Premier essai'});
 // fantôme : un cheval translucide qui rejoue le meilleur essai, sans gêner la course (hors simulation)
 {const r0=raceFX.render;let last=0;raceFX.render=function(q){const G=RACE.defi&&today().ghost,now=performance.now(),dt=Math.min(.05,(now-(last||now))/1000);last=now;
  if(G&&q.startPhase==='running'&&!q.podiumActive&&!q.finishView){if(!ghost){ghost=new THREE.Sprite(new THREE.SpriteMaterial({map:q.horseTextures[0],transparent:true,opacity:.36,depthWrite:false,color:0xcfe6ff}));ghost.frustumCulled=false;q.scene.add(ghost)}
   ghost.material.map=q.horseTextures[0];const i=Math.min(raceTime,G.p.length-1),tp=G.p[i]??100,ln=G.l[i]??44;gv+=(tp-gv)*Math.min(1,dt*9);
   if(gv<100.5){const p=trackPose(RACE_ORIGIN+gv/100,(ln-50)*.38),H=12.6;ghost.position.copy(p.p);ghost.position.y=H*.5-H*.105;ghost.scale.set(H*.375,H,1);ghost.visible=true}else ghost.visible=false}
  else if(ghost)ghost.visible=false;return r0.call(this,q)}}
 // bilan du défi
 hooks.on('defi:end',()=>{const T=today(),rank=finishOrder.indexOf(0)+1,time=raceFinishTimes[0],old=T.best,first=!T.first;T.tries++;let gain=[];
  const rec=old==null||time<old;if(rec){T.best=time;if(track){const n=track.p.length;for(let k=0;k<n;k++){if(track.p[k]==null){track.p[k]=track.p[k-1]??0;track.l[k]=track.l[k-1]??44}}track.p.push(101);T.ghost=track}}
  if(first){T.first=true;const c=meta.addChest('argent');gain.push(c?'🎁 Coffre d’argent':'💎 +5 gemmes (coffres pleins)');if(!c){state.gems+=5;sync()}}
  else if(rec&&T.pbGems<3){T.pbGems++;state.gems+=3;sync();gain.push('💎 +3 gemmes (nouveau record)')}
  save();track=null;currentField=null;const A=raceAnalysis(rank),t0=raceFinishTimes[finishOrder[0]];
  $('#finishRows').innerHTML=finishOrder.map((idx,pos)=>`<tr class="${idx===0?'player':''}"><td>${pos+1}</td><td>${escapeHTML(raceNames[idx])}${idx===0?' • VOUS':''}</td><td>${raceFinishTimes[idx].toFixed(2)} s</td><td>${pos?`+${(raceFinishTimes[idx]-t0).toFixed(2)} s`:'—'}</td></tr>`).join('');
  $('#fbStars').innerHTML=`<div class="defi-res${rec?' rec':''}"><b>${rec?(old==null?'Premier temps du jour':'Nouveau record !'):'Pas de record cette fois'}</b><span>${time.toFixed(2)} s${old!=null?` · record précédent ${old.toFixed(2)} s (${time<old?'−':'+'}${Math.abs(time-old).toFixed(2)} s)`:''}</span><small>Essai n° ${T.tries} · ${rank}${rank===1?'er':'e'} sur 6</small></div>`+`<div class="stars">${[0,1,2].map(i=>`<i class="${i<A.stars?'on':''}" style="animation-delay:${.3+i*.25}s">★</i>`).join('')}</div>${A.lines.map(([ok,n,t])=>`<div class="an ${ok?'ok':''}"><b>${ok?'✓':'✗'} ${n}</b><span>${t}</span></div>`).join('')}`;
  $('#fbGain').innerHTML=gain.join(' · ')||'Retente ta chance : seul ton meilleur temps compte.';
  if(rec){sound.fanfare();buzz([60,40,120])}else buzz(40);
  $('#raceComment').textContent=rec?'Nouveau record du jour !':'Défi terminé';$('#finishBoard').classList.add('show');$('#resultCup').textContent=rec?'⏱️':'🎖️';$('#resultTitle').textContent=rec?'Record du jour !':`${rank}e place`;$('#resultText').textContent=`${HN()} boucle le Défi du jour en ${time.toFixed(2)} s.`});
 // bouton sous le bilan : réessayer le défi
 hooks.on('race:end',()=>{if(!RACE.defi)return;const b=$('#raceAgain');if(b&&!b.hidden&&b.dataset.mode==='again')b.innerHTML=`RÉESSAYER LE DÉFI<small>gratuit · bats ton temps</small>`});
 // écart au fantôme, affiché en course
 gap=document.createElement('div');gap.className='ghost-gap';$('#raceScreen').appendChild(gap);
 return{meeting,field,select,today,get done(){return !!today().first}}})();
