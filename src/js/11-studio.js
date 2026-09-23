$('#quitRace').onclick=leaveRace;$('#returnDomain').onclick=leaveRace;$('#showPodium').onclick=showPodium;$('#moveLeft').onclick=()=>steer(-1);$('#moveRight').onclick=()=>steer(1);$('#lookLeft').onclick=()=>look(-1);$('#lookRight').onclick=()=>look(1);$('#sprintBtn').onclick=sprint;$('#goBtn').onclick=launchFromStalls;document.addEventListener('keydown',e=>{if(!$('#raceScreen').classList.contains('open'))return;if(e.key.toLowerCase()==='f')launchFromStalls();if(e.key==='ArrowLeft')steer(-1);if(e.key==='ArrowRight')steer(1);if(e.key===' ')sprint();if(e.key.toLowerCase()==='a')look(-1);if(e.key.toLowerCase()==='e')look(1)});
/* ===== Atelier du champion ===== */
const HN=()=>champion.get().name||'Mon champion';
const studio=(()=>{const el=$('#studio'),cv=$('#studioCanvas'),ctx=cv.getContext('2d');let draft=null,view='portrait',anim=0,firstRun=false;
 const S=LIVERY;
 function sw(group,val){return S.COLORS.map(([n,c])=>`<button class="sw${c===val?' on':''}" style="background:${c}" data-k="${group}" data-v="${c}" aria-label="${n}" title="${n}"></button>`).join('')}
 function render(){const d=draft;$('#studioName').value=d.name;
  $('#studioCoats').innerHTML=S.COATS.map((c,i)=>`<button class="coat${c.id===d.coat?' on':''}" data-k="coat" data-v="${c.id}"><i style="background:${S.coatSwatch(i)}"></i>${c.name}</button>`).join('');
  $('#studioMain').innerHTML=sw('main',d.main);$('#studioSecond').innerHTML=sw('second',d.second);$('#studioCap').innerHTML=sw('cap',d.cap);
  $('#studioMotifs').innerHTML=S.PATTERNS.map(([id,n])=>`<button class="motif${id===d.pattern?' on':''}" data-k="pattern" data-v="${id}">${S.silkSVG({...d,pattern:id},40)}${n}</button>`).join('');
  $('#studioPlate').innerHTML=`${S.silkSVG(d,46)}<div><b>${escapeHTML(d.name||'Sans nom')}</b><small>${S.COATS.find(c=>c.id===d.coat).name.toUpperCase()} · PUR-SANG</small></div>`;draw(performance.now())}
 function fit(){const r=cv.getBoundingClientRect(),k=Math.min(2,devicePixelRatio||1);cv.width=Math.max(1,r.width*k);cv.height=Math.max(1,r.height*k)}
 function draw(now){if(!el.classList.contains('open'))return;const W=cv.width,H=cv.height;ctx.clearRect(0,0,W,H);
  const shadow=y=>{ctx.save();ctx.fillStyle='rgba(0,0,0,.38)';ctx.filter='blur(6px)';ctx.beginPath();ctx.ellipse(W/2,y,W*.16,H*.022,0,0,7);ctx.fill();ctx.restore()};
  if(view==='portrait'){const c=S.portrait(draft),s=Math.min(W*.92/c.width,H*.9/c.height);shadow(H*.95-c.height*s*.02);ctx.drawImage(c,(W-c.width*s)/2,H*.95-c.height*s,c.width*s,c.height*s)}
  else{const g=S.gallop(draft,.5),fw=g.width/8,f=Math.floor(now/70)%8,s=Math.min(W*.8/fw,H*.9/g.height),bob=Math.abs(Math.sin(now/70/8*Math.PI*2))*H*.008;
   shadow(H*.95-g.height*s*.1);ctx.drawImage(g,f*fw,0,fw,g.height,(W-fw*s)/2,H*.95-g.height*s-bob,fw*s,g.height*s);anim=requestAnimationFrame(draw)}}
 el.addEventListener('click',e=>{const b=e.target.closest('[data-k]');if(!b)return;draft[b.dataset.k]=b.dataset.v;cancelAnimationFrame(anim);render()});
 $('#studioName').addEventListener('input',e=>{draft.name=e.target.value.slice(0,18);$('#studioPlate b').textContent=draft.name||'Sans nom'});
 $$('.studio-view button').forEach(b=>b.onclick=()=>{view=b.dataset.view;$$('.studio-view button').forEach(x=>x.classList.toggle('on',x===b));cancelAnimationFrame(anim);draw(performance.now())});
 $('#studioRandom').onclick=()=>{const r=S.random(Date.now()%100000);draft={...r,name:draft.name};cancelAnimationFrame(anim);render()};
 $('#studioSave').onclick=()=>{draft.name=(draft.name||'').trim()||'Royal Thunder';champion.set(draft);close();toast(firstRun?`Bienvenue, ${draft.name} !`:'Couleurs enregistrées')};
 $('#studioClose').onclick=()=>close();
 function open(first=false){firstRun=first;draft={...champion.get()};$('#studioTitle').textContent=first?'Crée ton premier champion':'Mon champion';
  $('#studioIntro').textContent=first?'Choisis la robe de ton cheval et les couleurs de ton écurie. Tu pourras les changer à tout moment.':'Robe, casaque et toque : tes couleurs apparaissent en course et sur le podium.';
  $('#studioClose').hidden=first;el.classList.add('open');S.ready.then(()=>{fit();render()})}
 function close(){el.classList.remove('open');cancelAnimationFrame(anim)}
 addEventListener('resize',()=>{if(el.classList.contains('open')){fit();draw(performance.now())}});
 return{open,close}})();
function refreshChampion(){const c=champion.get();$('.avatar').innerHTML=LIVERY.silkSVG(c,56);$('.profile-card b').textContent=c.name;raceNames[0]=c.name;
 $('#autoGallop span').textContent=c.name.toUpperCase();$('#resultText').textContent=`${c.name} remporte la course.`}
champion.on(refreshChampion);refreshChampion();
$('.avatar').setAttribute('role','button');$('.avatar').setAttribute('tabindex','0');$('.avatar').setAttribute('aria-label','Personnaliser mon champion');
$('.avatar').addEventListener('click',()=>studio.open());$('.avatar').addEventListener('keydown',e=>{if(e.key==='Enter')studio.open()});
function championTile(extra=''){const c=champion.get();return `<div class="champ-tile"><canvas class="champ-thumb" width="148" height="220"></canvas><div><strong>${escapeHTML(c.name)}</strong><small>Pur-sang · ${LIVERY.COATS.find(x=>x.id===c.coat).name} · Niveau 8</small>${extra}<button class="action green" data-studio>PERSONNALISER</button></div></div>`}
function paintThumbs(){LIVERY.ready.then(()=>{const p=LIVERY.portrait(champion.get());$$('.champ-thumb').forEach(cv=>{const x=cv.getContext('2d');x.clearRect(0,0,cv.width,cv.height);const s=cv.width/p.width*1.35;x.drawImage(p,(cv.width-p.width*s)/2,-4,p.width*s,p.height*s)})})}
document.addEventListener('click',e=>{if(e.target.closest('[data-studio]')){$('#panel').classList.remove('open');studio.open()}});
LIVERY.ready.then(()=>{if(!champion.exists())setTimeout(()=>studio.open(true),900)}).catch(()=>{});
