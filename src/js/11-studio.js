// pas de zoom du navigateur (2.5) : Safari (iPhone) ignore en partie user-scalable=no et touch-action ; on bloque son pincement,
// et en course un deuxième toucher rapproché (< 350 ms) est traité comme un toucher simple sur le bouton visé, jamais comme un zoom
document.addEventListener('gesturestart',e=>e.preventDefault(),{passive:false});
{let last=0;document.addEventListener('touchend',e=>{const now=e.timeStamp,quick=now-last<350;last=now;if(!quick||e.touches.length||!$('#raceScreen').classList.contains('open')||e.target.closest('input,textarea,select'))return;
 e.preventDefault();const b=e.target.closest('button');if(b&&!b.disabled&&b.id!=='quitRace')b.click()},{passive:false})} // double-tap sur Quitter : le bouton reste seulement armé
// quitter une course en cours (2.5) : pas de pause, donc on confirme d'abord — le bouton lui-même le demande, rien ne s'affiche par-dessus la course
{const q=$('#quitRace');let t=0,armedAt=0;const reset=()=>{clearTimeout(t);t=0;q.classList.remove('armed');q.textContent='Quitter'};
 q.onclick=e=>{const live=$('#raceScreen').classList.contains('open')&&finishOrder.length<6&&!tele.on,ts=e.timeStamp;if(!live||q.classList.contains('armed')){if(live&&ts-armedAt<450)return;reset();return leaveRace()} // un double clic involontaire ne confirme pas l'abandon
  armedAt=ts;
  q.classList.add('armed');q.innerHTML=`Abandonner ?<small>${RACE.fee&&!RACE.defi&&!RACE.duel&&!RACE.tour?'engagement perdu':'la course s’arrête'}</small>`;t=setTimeout(reset,3500)};
 hooks.on('race:leave',reset);hooks.on('race:start',reset)}
$('#returnDomain').onclick=leaveRace;$('#showPodium').onclick=showPodium;$('#moveLeft').onclick=()=>steerScreen(-1);$('#moveRight').onclick=()=>steerScreen(1);$('#lookLeft').onclick=()=>look(-1);$('#lookRight').onclick=()=>look(1);$('#sprintBtn').onclick=sprint;$('#paceUp').onclick=()=>setPace(playerPace+1);$('#paceDown').onclick=()=>setPace(playerPace-1);document.addEventListener('keydown',e=>{if(!$('#raceScreen').classList.contains('open'))return;if(e.key==='ArrowLeft')steerScreen(-1);if(e.key==='ArrowRight')steerScreen(1);if(e.key===' ')sprint();if(!(typeof haies!=='undefined'&&haies.active)){if(e.key==='ArrowUp'){e.preventDefault();setPace(playerPace+1)}if(e.key==='ArrowDown'){e.preventDefault();setPace(playerPace-1)}}{const k=e.key.toLowerCase();if(k==='z'||k==='w')setPace(playerPace+1);if(k==='s')setPace(playerPace-1)}if(e.key.toLowerCase()==='a')look(-1);if(e.key.toLowerCase()==='e')look(1)});
/* ===== Atelier du champion ===== */
const HN=()=>champion.get().name||'Mon champion';
const studio=(()=>{const el=$('#studio'),cv=$('#studioCanvas'),ctx=cv.getContext('2d');let silks=null,horses={},cur=null,view='portrait',anim=0,firstRun=false,in3d=false;
 const S=LIVERY,stageEl=$('.studio-stage');
 // 2.8 : brouillon = couleurs de l'écurie (casaque, toque : communes à tous les chevaux) + nom et robe de chaque cheval modifié
 const draft=()=>({...silks,...horses[cur]});
 // 2.8 : après les teintes proposées, une couleur libre (sélecteur du système) : toute couleur #rrggbb est valable, liens de duel compris
 const hexOk=v=>/^#[0-9a-f]{6}$/i.test(v||'');
 function sw(group,val){const free=hexOk(val)&&!S.COLORS.some(([,c])=>c.toLowerCase()===val.toLowerCase());
  return S.COLORS.map(([n,c])=>`<button class="sw${c===val?' on':''}" style="background:${c}" data-k="${group}" data-v="${c}" aria-label="${n}" title="${n}"></button>`).join('')+
   `<label class="sw sw-free${free?' on':''}" title="Couleur libre"${free?` style="background:${val}"`:''}><input type="color" data-free="${group}" value="${hexOk(val)?val.toLowerCase():'#888888'}" aria-label="Couleur libre"></label>`}
 function render(){const d=draft();$('#studioName').value=d.name;
  const H=stable.data.horses;$('#studioHorses').innerHTML=H.length>1?H.map(h=>`<button role="tab" aria-selected="${h.id===cur}" class="${h.id===cur?'on':''}" data-horse="${h.id}">${S.silkSVG({...silks,coat:(horses[h.id]||h).coat},22)}<span>${escapeHTML((horses[h.id]||h).name)}</span></button>`).join(''):'';
  $('#studioCoats').innerHTML=S.COATS.map((c,i)=>`<button class="coat${c.id===d.coat?' on':''}" data-k="coat" data-v="${c.id}"><i style="background:${S.coatSwatch(i)}"></i>${c.name}</button>`).join('');
  $('#studioMain').innerHTML=sw('main',d.main);$('#studioSecond').innerHTML=sw('second',d.second);$('#studioCap').innerHTML=sw('cap',d.cap);
  $('#studioMotifs').innerHTML=S.PATTERNS.map(([id,n])=>S.LOCKS[id]&&!(career.data.unlocks||[]).includes(id)?`<button class="motif locked" disabled title="${S.LOCKS[id][1]}">${S.silkSVG({...d,pattern:id},40)}🔒 ${S.LOCKS[id][0]}</button>`:`<button class="motif${id===d.pattern?' on':''}" data-k="pattern" data-v="${id}">${S.silkSVG({...d,pattern:id},40)}${n}</button>`).join('');
  $('#studioPlate').innerHTML=`${S.silkSVG(d,46)}<div><b>${escapeHTML(d.name||'Sans nom')}</b><small>${S.COATS.find(c=>c.id===d.coat).name.toUpperCase()} · PUR-SANG</small></div>`;
  if(in3d)PORTRAIT3D.stage.set(d);else draw(performance.now())}
 function fit(){const r=cv.getBoundingClientRect(),k=Math.min(2,devicePixelRatio||1);cv.width=Math.max(1,r.width*k);cv.height=Math.max(1,r.height*k)}
 // repli sans WebGL : l'image peinte d'avant la 2.8
 function draw(now){if(!el.classList.contains('open')||in3d)return;const W=cv.width,H=cv.height,d=draft();ctx.clearRect(0,0,W,H);
  const shadow=y=>{ctx.save();ctx.fillStyle='rgba(0,0,0,.38)';ctx.filter='blur(6px)';ctx.beginPath();ctx.ellipse(W/2,y,W*.16,H*.022,0,0,7);ctx.fill();ctx.restore()};
  if(view!=='galop'){const c=S.portrait(d),s=Math.min(W*.92/c.width,H*.9/c.height);shadow(H*.95-c.height*s*.02);ctx.drawImage(c,(W-c.width*s)/2,H*.95-c.height*s,c.width*s,c.height*s)}
  else{const g=S.gallop(d,.5),fw=g.width/8,f=Math.floor(now/70)%8,s=Math.min(W*.8/fw,H*.9/g.height),bob=Math.abs(Math.sin(now/70/8*Math.PI*2))*H*.008;
   shadow(H*.95-g.height*s*.1);ctx.drawImage(g,f*fw,0,fw,g.height,(W-fw*s)/2,H*.95-g.height*s-bob,fw*s,g.height*s);anim=requestAnimationFrame(draw)}}
 el.addEventListener('click',e=>{const hb=e.target.closest('[data-horse]');if(hb){pick(hb.dataset.horse);return}const b=e.target.closest('[data-k]');if(!b)return;const k=b.dataset.k,v=b.dataset.v;
  if(k==='coat')horses[cur].coat=v;else silks[k]=v;cancelAnimationFrame(anim);render()});
 // couleur libre : aperçu pendant qu'on glisse dans le sélecteur (sans tout redessiner, le sélecteur reste ouvert), tout se redessine à la fin
 el.addEventListener('input',e=>{const k=e.target.dataset&&e.target.dataset.free;if(!k||!hexOk(e.target.value))return;silks[k]=e.target.value.toLowerCase();const l=e.target.parentNode;
  l.parentNode.querySelectorAll('.sw').forEach(x=>x.classList.toggle('on',x===l));l.style.background=silks[k];if(in3d)PORTRAIT3D.stage.set(draft())});
 el.addEventListener('change',e=>{if(e.target.dataset&&e.target.dataset.free)render()});
 function pick(id){const h=stable.byId(id);if(!h)return;cur=id;horses[id]=horses[id]||{name:h.name,coat:h.coat};render()}
 $('#studioName').addEventListener('input',e=>{horses[cur].name=e.target.value.slice(0,18);$('#studioPlate b').textContent=horses[cur].name||'Sans nom';const t=$(`#studioHorses [data-horse="${cur}"] span`);if(t)t.textContent=horses[cur].name;if(in3d)PORTRAIT3D.stage.set(draft())});
 $$('.studio-view button').forEach(b=>b.onclick=()=>{view=b.dataset.view;$$('.studio-view button').forEach(x=>x.classList.toggle('on',x===b));cancelAnimationFrame(anim);if(in3d)PORTRAIT3D.stage.mode(view);else draw(performance.now())});
 $('#studioRandom').onclick=()=>{const r=S.random(Date.now()%100000);silks={main:r.main,second:r.second,pattern:r.pattern,cap:r.cap};horses[cur].coat=r.coat;cancelAnimationFrame(anim);render()};
 $('#studioSave').onclick=()=>{stable.silks={...silks};for(const[id,v]of Object.entries(horses)){const h=stable.byId(id);if(!h)continue;const n=(v.name||'').trim();if(n)h.name=n.slice(0,18);else if(!h.name)h.name='Royal Thunder';h.coat=v.coat}
  stable.created=true;stable.save();champion.emit();const nm=champion.get().name;close();if(firstRun)try{if(!domaine3d.on)splash.show()}catch(e){}toast(firstRun?`Bienvenue, ${nm} !`:'Couleurs enregistrées')};
 $('#studioClose').onclick=()=>close();
 function open(first=false,horseId){firstRun=first;if(first)try{splash.hide()}catch(e){} // 2.6 : un nouveau joueur crée son champion tout de suite, le domaine 3D finit de se construire derrière
  const a=stable.active();silks={main:stable.silks.main,second:stable.silks.second,pattern:stable.silks.pattern,cap:stable.silks.cap};horses={};cur=null;pick(stable.byId(horseId)?horseId:a.id);
  $('#studioTitle').textContent=first?'Crée ton premier champion':'Atelier de l’écurie';
  $('#studioIntro').textContent=first?'Choisis la robe de ton cheval et les couleurs de ton écurie. Tu pourras les changer à tout moment.':'Nom et robe de chaque cheval, casaque et toque de l’écurie : c’est ce que tu vois en course, en 3D.';
  $('#studioClose').hidden=first;el.classList.add('open');view='portrait';$$('.studio-view button').forEach(x=>x.classList.toggle('on',x.dataset.view==='portrait'));
  // 2.8 : le vrai modèle de course, en 3D ; l'image peinte seulement si la 3D est indisponible
  in3d=PORTRAIT3D.stage.start(stageEl,draft());stageEl.classList.toggle('is3d',in3d);if(in3d)PORTRAIT3D.stage.mode('portrait');
  S.ready.then(()=>{fit();render()})}
 function close(){el.classList.remove('open');cancelAnimationFrame(anim);if(in3d)PORTRAIT3D.stage.stop();in3d=false;stageEl.classList.remove('is3d')}
 addEventListener('resize',()=>{if(el.classList.contains('open')&&!in3d){fit();draw(performance.now())}});
 return{open,close,get in3d(){return in3d}}})();
function refreshChampion(){const c=champion.get();$('.avatar').innerHTML=LIVERY.silkSVG(c,56);$('.profile-card b').textContent=c.name;raceNames[0]=c.name;
 $('#autoGallop span').textContent=c.name.toUpperCase();$('#resultText').textContent=`${c.name} remporte la course.`}
champion.on(refreshChampion);refreshChampion();
$('.avatar').setAttribute('role','button');$('.avatar').setAttribute('tabindex','0');$('.avatar').setAttribute('aria-label','Personnaliser mon champion');
$('.avatar').addEventListener('click',()=>studio.open());$('.avatar').addEventListener('keydown',e=>{if(e.key==='Enter')studio.open()});
function championTile(extra=''){const c=champion.get();return `<div class="champ-tile"><canvas class="champ-thumb" width="148" height="220"></canvas><div><strong>${escapeHTML(c.name)}</strong><small>Pur-sang · ${LIVERY.COATS.find(x=>x.id===c.coat).name} · Niveau 8</small>${extra}<button class="action green" data-studio>PERSONNALISER</button></div></div>`}
function paintThumbs(){const c=champion.get();$$('.champ-thumb').forEach(cv=>PORTRAIT3D.draw(cv,c)||LIVERY.ready.then(()=>{const p=LIVERY.portrait(c);[cv].forEach(cv=>{const x=cv.getContext('2d');x.clearRect(0,0,cv.width,cv.height);const s=cv.width/p.width*1.35;x.drawImage(p,(cv.width-p.width*s)/2,-4,p.width*s,p.height*s)})}))}
document.addEventListener('click',e=>{if(e.target.closest('[data-studio]')){$('#panel').classList.remove('open');studio.open()}});
LIVERY.ready.then(()=>{if(!champion.exists())setTimeout(()=>studio.open(true),900)}).catch(()=>{});
