/* ===== Duels entre amis : une course partagée par lien, courue contre le fantôme de l'ami =====
   Après une course, DÉFIER UN AMI produit un lien qui contient tout l'enregistrement de la course (graine, plateau, paramètres
   du cheval, actions datées au pas) — compressé, sans serveur. L'ami qui l'ouvre court exactement la même course avec son propre
   cheval, contre le fantôme translucide de son ami. Avant le départ, le jeu refait la course de l'ami (replays.verify) : un temps
   truqué est refusé, et c'est ce rejeu qui trace la trajectoire du fantôme. Comme le Défi du jour : ni trophées, ni gains, ni fatigue.
   DUEL_V change si la simulation change : un lien d'une autre version est refusé proprement. */
const DUEL_V=1;
const duel=(()=>{const KEY='trr.duels';let D={list:[],wins:0,losses:0};try{Object.assign(D,JSON.parse(localStorage.getItem(KEY)||'{}'))}catch(e){}
 const save=()=>{try{localStorage.setItem(KEY,JSON.stringify({...D,list:D.list.slice(-12)}))}catch(e){}};
 const clone=o=>JSON.parse(JSON.stringify(o)),t2=t=>t.toFixed(2).replace('.',',');
 // ---------- lien : JSON compressé (deflate) en base64 url ----------
 const b64=u=>{let s='';for(let i=0;i<u.length;i+=8192)s+=String.fromCharCode(...u.subarray(i,i+8192));return btoa(s).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'')};
 const unb64=s=>{const b=atob(s.replace(/-/g,'+').replace(/_/g,'/'));return Uint8Array.from(b,c=>c.charCodeAt(0))};
 async function encode(o){const s=JSON.stringify(o);if(window.CompressionStream){try{const z=new Blob([s]).stream().pipeThrough(new CompressionStream('deflate-raw'));return 'z'+b64(new Uint8Array(await new Response(z).arrayBuffer()))}catch(e){}}return 'j'+b64(new TextEncoder().encode(s))}
 async function decode(c){const b=unb64(c.slice(1));if(c[0]==='z'){const z=new Blob([b]).stream().pipeThrough(new DecompressionStream('deflate-raw'));return JSON.parse(await new Response(z).text())}if(c[0]==='j')return JSON.parse(new TextDecoder().decode(b));throw 0}
 const pack=r=>({v:DUEL_V,race:{...r.race,id:r.race.src||r.race.id},field:r.field,seed:r.seed,player:r.player,strategy:r.strategy,horse:r.horse,liv:r.liv,inputs:r.inputs,reaction:r.reaction,window:r.window,plan:r.plan,result:r.result,at:r.at});
 // un lien vient de n'importe où : on vérifie la forme avant de s'en servir (tailles bornées, nombres finis)
 const num=x=>typeof x==='number'&&isFinite(x),str=(x,n=40)=>typeof x==='string'&&x.length<=n;
 const livOk=l=>!!l&&['main','second','cap'].every(k=>/^#[0-9a-f]{6}$/i.test(l[k]))&&LIVERY.PATTERNS.some(p=>p[0]===l.pattern)&&LIVERY.COATS.some(c=>c.id===l.coat);
 function valid(o){try{if(!o||o.v!==DUEL_V)return false;const F=o.field,R=o.race,P=o.player;
  if(!F||!Array.isArray(F.rivals)||F.rivals.length!==5||!num(F.seed)||!num(o.seed)||!R||![1200,1600,2000,2400].includes(R.dist)||!TERRAINS[R.terrain])return false;
  if(!P||!['cruise','sprint','sprintDrain','drain','boxed','draft','noise','window'].every(k=>num(P[k]))||!P.tactic||!num(P.tactic.c))return false;
  if(!F.rivals.every(r=>r&&str(r.name,24)&&r.stats&&STATS.every(s=>num(r.stats[s.k]))&&num(r.pref)&&livOk(r.livery)&&TALENTS[r.talent]&&['leader','stalker','finisher'].includes(r.tac)))return false;
  if(!Array.isArray(o.inputs)||o.inputs.length>3000||!o.inputs.every(x=>Array.isArray(x)&&num(x[0])&&['steer','sprint','moment'].includes(x[1])))return false;
  if(!o.result||!Array.isArray(o.result.times)||!o.result.times.every(num)||!str(o.horse,24)||!['leader','stalker','finisher'].includes(o.strategy))return false;
  return !o.liv||livOk(o.liv)}catch(e){return false}}
 // la course reçue est reconstruite à partir de champs connus : rien de ce qui vient du lien n'est affiché sans contrôle
 function safeRace(R){const M=MEETINGS.find(m=>m.id===R.id),D=R.id==='defi'||R.defi===true;return{id:M?M.id:D?'defi':'lien',n:M?M.n:D?'Défi du jour':'Course amicale',dist:R.dist,terrain:R.terrain,amb:AMBIANCES[R.amb]?R.amb:undefined,league:0,diff:0,purse:0,fee:0}}
 async function share(r=replays.last()){if(!r||!r.result)return toast('Aucune course à partager');const code=await encode(pack(r)),url=`${location.origin}${location.pathname}#duel=${code}`,
  me=r.result.order.indexOf(0)+1,text=`⚔️ ${r.horse} te défie sur « ${safeRace(r.race).n} » (${fmt(r.race.dist)} m) : ${t2(r.result.times[0])} s, ${me}${me===1?'er':'e'} sur 6. Tu fais mieux ?`;
  hooks.emit('duel:partage',url.length);
  if(navigator.share&&matchMedia('(pointer:coarse)').matches){try{await navigator.share({title:'The Royal Race — duel',text,url});return}catch(e){if(e&&e.name==='AbortError')return}}
  try{await navigator.clipboard.writeText(`${text}\n${url}`);toast('Lien du duel copié : envoie-le à un ami !')}catch(e){
   $('#panelTitle').textContent='Défier un ami';$('#panel .card').classList.remove('wide');$('#panelBody').innerHTML=`<p class="hint">Copie ce lien et envoie-le : ton ami courra la même course contre ton fantôme.</p><textarea class="savecode" readonly>${escapeHTML(text+'\n'+url)}</textarea>`;$('#panel').classList.add('open');$('#panelBody textarea').select()}}
 // ---------- réception ----------
 const idOf=r=>`${r.seed}-${r.horse}-${r.result.times[0]}`;
 function add(r){r.race=safeRace(r.race);const id=idOf(r);let d=D.list.find(x=>x.id===id);if(!d){d={id,rec:r,got:Date.now(),tries:0,best:null,won:false};D.list.push(d);if(D.list.length>12)D.list.shift();save()}return d}
 async function fromHash(){const m=location.hash.match(/duel=([A-Za-z0-9_-]+)/);if(!m)return;history.replaceState(null,'',location.pathname+location.search);
  let r=null;try{r=await decode(m[1])}catch(e){}
  if(!r||r.v!==DUEL_V)return later(()=>toast(r&&r.v?'Ce duel vient d’une autre version du jeu : demande à ton ami de le renvoyer':'Lien de duel illisible'));
  if(!valid(r))return later(()=>toast('Lien de duel invalide'));const d=add(r);later(()=>card(d))}
 // présenter le duel quand le joueur a créé son champion (partie neuve) et qu'aucun autre écran n'est ouvert (récompense du jour…)
 const free=()=>!$('#panel').classList.contains('open')&&!$('#studio').classList.contains('open')&&!coach.open&&!$('#raceScreen').classList.contains('open');
 const when=f=>{const t=setInterval(()=>{if(free()){clearInterval(t);f()}},500)};
 function later(f){if(champion.exists())return setTimeout(()=>when(f),2200);let done=false;champion.on(()=>{if(!done){done=true;setTimeout(()=>when(f),1500)}})}
 // vérification de la course de l'ami : refaite pas à pas, elle doit retrouver exactement son classement et ses temps
 let cur=null,G=null;
 function check(d){const v=replays.verify(clone(d.rec),{track:true});if(v.ok===null)return null;d.ok=!!v.ok;save();return v.ok?v.track:false}
 function card(d){const r=d.rec,L={...stable.silks,...(r.liv||{})},me=r.result.order.indexOf(0)+1;$('#panelTitle').textContent='Duel reçu';$('#panel .card').classList.remove('wide');
  $('#panelBody').innerHTML=`<div class="duel-card"><div class="duel-silk">${LIVERY.silkSVG(L,74)}</div><p class="duel-t">⚔️ <b>${escapeHTML(r.horse)}</b> te défie !</p>
   <p class="hint">${escapeHTML(safeRace(r.race).n)} · ${fmt(r.race.dist)} m · terrain ${TERRAINS[r.race.terrain].n.toLowerCase()}</p><div class="duel-time"><b>${t2(r.result.times[0])} s</b><small>${me}${me===1?'er':'e'} sur 6</small></div>
   <p class="hint">Même course, mêmes adversaires, même départ : avec ton propre cheval, bats son temps. Son fantôme court à côté de toi. Gratuit, sans fatigue ni trophées.</p>
   <div class="race-entry"><button class="action green" data-duel-go="${escapeHTML(d.id)}">⚔️ RELEVER LE DÉFI</button></div></div>`;$('#panel').classList.add('open')}
 function meeting(d){const R=safeRace(d.rec.race);return{...R,id:'duel',src:R.id,n:`Duel · ${R.n}`,duel:true,defi:false,tour:false}}
 function select(d){while(coach.open)coach.hide();const tr=check(d);if(tr===null)return toast('Un instant…');if(tr===false){toast('Ce duel n’a pas pu être vérifié : le temps de ton ami ne correspond pas à sa course');return false}
  cur=d;G=tr;RACE=meeting(d);currentField=null;buildField();return true}
 // (openCourses remettrait une course du programme : on ouvre l'écran directement)
 function go(id){const d=D.list.find(x=>x.id===id);if(!d||!select(d))return;$('#panelTitle').textContent='Courses';$('#panel .card').classList.add('wide');$('#panel').classList.add('open');renderCourses()}
 // le plateau du duel remplace celui qui vient d'être tiré (y compris pour RECOURIR)
 hooks.on('field:built',F=>{if(RACE.duel&&cur)Object.assign(F,clone(cur.rec.field))});
 // ---------- écran des courses : cartes des duels reçus ----------
 hooks.on('courses:render',()=>{const g=$('#panelBody .meets');if(!g)return;
  if(RACE.duel&&cur){const r=cur.rec,info=g.nextElementSibling;if(info&&info.tagName==='P')info.innerHTML=`<b style="color:#ffd9a0">⚔️ Duel contre ${escapeHTML(r.horse)}</b> · ${fmt(r.race.dist)} m · Terrain ${TERRAINS[r.race.terrain].n.toLowerCase()} · <b>gratuit</b>, sans fatigue ni trophées : bats <b>${t2(r.result.times[0])} s</b> <span class="duel-ok">✓ temps vérifié</span>${cur.best?` · ton record : ${t2(cur.best)} s`:''}`;$('#panelBody .taunt')?.remove()}
  g.insertAdjacentHTML('afterbegin',D.list.slice().reverse().slice(0,3).map(d=>`<button class="meet duel-meet${RACE.duel&&cur===d?' on':''}" data-duel="${escapeHTML(d.id)}"><b>⚔️ ${escapeHTML(d.rec.horse)}</b><em class="suit ${d.won?'ideal':'ok'}">${d.won?'✓ Battu':'Duel'}</em><small>${fmt(d.rec.race.dist)} m · ${TERRAINS[d.rec.race.terrain].n} · ${t2(d.rec.result.times[0])} s</small><span>${d.tries?`${d.tries} essai${d.tries>1?'s':''}${d.best?` · ${t2(d.best)} s`:''}`:'à relever'}</span></button>`).join(''))});
 $('#panelBody').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;
  if(b.dataset.duel){const d=D.list.find(x=>x.id===b.dataset.duel);if(d&&select(d))renderCourses()}else if(b.dataset.duelGo)go(b.dataset.duelGo)});
 // un duel choisi, puis une autre course : on quitte le duel
 hooks.on('courses:render',()=>{if(!RACE.duel){cur=null;G=null}});
 // ---------- en course : en-tête, fantôme, écart ----------
 hooks.on('race:header',()=>{if(RACE.duel&&cur)$('.race-head small').textContent+=` • ⚔️ ${cur.rec.horse} : ${t2(cur.rec.result.times[0])} s`});
 let ghost=null,tex=null,gv=0,phase=0;const gap=document.createElement('div');gap.className='ghost-gap duel-gap';$('#raceScreen').appendChild(gap);
 hooks.on('race:start',()=>{gv=0;gap.classList.remove('show');if(ghost)ghost.visible=false;if(RACE.duel&&cur&&threeRace&&!threeRace.headless)LIVERY.ready.then(()=>{const L={...stable.silks,...(cur.rec.liv||{})};tex?.dispose();tex=new THREE.CanvasTexture(LIVERY.gallop(L,.5));tex.colorSpace=THREE.SRGBColorSpace;tex.repeat.set(1/8,1);if(ghost)ghost.material.map=tex,ghost.material.needsUpdate=true})});
 hooks.on('race:tick',()=>{if(!RACE.duel||!G||raceFinished[0])return;const gp=G.p[Math.min(raceTime,G.p.length-1)]??101,m=Math.round((gp-progress[0])*RACE.dist/100);
  gap.innerHTML=Math.abs(m)<2?`⚔️ Au coude à coude avec ${escapeHTML(cur.rec.horse)}`:m>0?`⚔️ ${escapeHTML(cur.rec.horse)} <b>${m} m</b> devant`:`⚔️ Tu as <b>${-m} m</b> d’avance`;gap.classList.add('show');gap.classList.toggle('ahead',m<=0)});
 {const r0=raceFX.render;let last=0;raceFX.render=function(q){const on=RACE.duel&&G&&tex&&q.startPhase==='running'&&!q.podiumActive&&!q.finishView&&!q.tvView,now=performance.now(),dt=Math.min(.05,(now-(last||now))/1000);last=now;
  if(on){if(!ghost){ghost=new THREE.Sprite(new THREE.SpriteMaterial({map:tex,transparent:true,opacity:.5,depthWrite:false,color:0xffe7b8}));ghost.frustumCulled=false;q.scene.add(ghost)}
   const i=Math.min(raceTime,G.p.length-1),tp=G.p[i]??101,ln=G.l[i]??44;gv+=(tp-gv)*Math.min(1,dt*9);phase+=dt*(2.1+.5*1.6)*8;tex.offset.x=(Math.floor(phase)%8)/8;
   if(gv<100.5){const p=trackPose(RACE_ORIGIN+gv/100,(ln-50)*.38),H=12.6;ghost.position.copy(p.p);ghost.position.y=H*.5-H*.105;ghost.scale.set(H*.375,H,1);ghost.visible=true}else ghost.visible=false}
  else if(ghost)ghost.visible=false;return r0.call(this,q)}}
 // ---------- bilan ----------
 hooks.on('duel:end',()=>{const d=cur;if(!d)return;const mine=raceFinishTimes[0],his=d.rec.result.times[0],rank=finishOrder.indexOf(0)+1,won=mine<his,first=!d.won&&won;gap.classList.remove('show');
  d.tries++;d.best=d.best==null?mine:Math.min(d.best,mine);if(won){if(!d.won)D.wins++;d.won=true}else if(d.tries===1)D.losses++;save();
  const A=raceAnalysis(rank),t0=raceFinishTimes[finishOrder[0]],dt=Math.abs(mine-his);
  $('#finishRows').innerHTML=finishOrder.map((idx,pos)=>`<tr class="${idx===0?'player':''}"><td>${pos+1}</td><td>${escapeHTML(raceNames[idx])}${idx===0?' • VOUS':''}</td><td>${raceFinishTimes[idx].toFixed(2)} s</td><td>${pos?`+${(raceFinishTimes[idx]-t0).toFixed(2)} s`:'—'}</td></tr>`).join('');
  $('#fbStars').innerHTML=`<div class="duel-res${won?' win':''}"><b>${won?`⚔️ Tu bats ${escapeHTML(d.rec.horse)} !`:`⚔️ ${escapeHTML(d.rec.horse)} garde l’avantage`}</b><span>${t2(mine)} s contre ${t2(his)} s (${won?'−':'+'}${t2(dt)} s)</span><small>Essai n° ${d.tries} · ${rank}${rank===1?'er':'e'} sur 6${first?' · premier duel gagné contre lui !':''}</small></div>`+`<div class="stars">${[0,1,2].map(i=>`<i class="${i<A.stars?'on':''}" style="animation-delay:${.3+i*.25}s">★</i>`).join('')}</div>${A.lines.map(([ok,n,t])=>`<div class="an ${ok?'ok':''}"><b>${ok?'✓':'✗'} ${n}</b><span>${t}</span></div>`).join('')}`;
  $('#fbGain').innerHTML=won?'Renvoie-lui la balle : il devra battre ton temps.':'Retente ta chance : seule compte ta meilleure course.';
  if(won){sound.fanfare();buzz([60,40,120])}else buzz(40);$('#raceComment').textContent=won?'Duel gagné !':'Duel perdu';$('#finishBoard').classList.add('show');
  $('#resultCup').textContent=won?'⚔️':'🎖️';$('#resultTitle').textContent=won?'Duel gagné !':`Duel perdu de ${t2(dt)} s`;$('#resultText').textContent=`${HN()} boucle la course en ${t2(mine)} s, contre ${t2(his)} s pour ${d.rec.horse}.`;currentField=null});
 // boutons sous le bilan : défier un ami (toute course terminée hors tournoi), réessayer le duel
 hooks.on('race:end',()=>{if(RACE.tour)return;const b=$('#raceAgain');if(RACE.duel&&b&&!b.hidden&&b.dataset.mode==='again')b.innerHTML=`RÉESSAYER LE DUEL<small>gratuit · bats ${t2(cur?.rec.result.times[0]||0)} s</small>`;
  $('#fbGain').insertAdjacentHTML('beforeend',`<br><button class="action duel-btn" id="duelShare">⚔️ ${RACE.duel?'RENVOYER LE DÉFI':'DÉFIER UN AMI'}</button>`);$('#duelShare').onclick=e=>{e.stopPropagation();share()}});
 hooks.on('ready',()=>{fromHash();addEventListener('hashchange',fromHash)});
 PANELS.duel=()=>{const d=D.list[D.list.length-1];if(d)card(d)};
 return{share,encode,decode,valid,pack,add,card,select,go,get list(){return D.list},get wins(){return D.wins},get cur(){return cur}}})();
