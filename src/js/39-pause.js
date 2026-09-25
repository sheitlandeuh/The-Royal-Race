/* ===== Pause de course et manette =====
   Pause : automatique quand le jeu passe en arrière-plan (appel, notification, autre appli, autre onglet), ou à la demande
   (bouton ⏸, Échap, P, Start). La simulation s'arrête net (même nombre de pas : le rejeu reste identique) ; on repart après 3-2-1.
   Manette (standard) : A = partir / sprint / valider, croix ou stick = se décaler, X / Y = choix des temps forts,
   LB / RB = regarder sur les côtés, Start = pause. */
const pauseRace=(()=>{
 const ov=document.createElement('div');ov.className='pause-ov';ov.hidden=true;ov.innerHTML='<div class="pause-card"><strong>PAUSE</strong><span class="pause-cd"></span><button class="action green" data-p="resume">REPRENDRE</button><button class="action" data-p="quit">QUITTER LA COURSE</button></div>';$('#raceScreen').appendChild(ov);
 const btn=document.createElement('button');btn.className='race-pause';btn.setAttribute('aria-label','Pause');btn.textContent='⏸';$('#quitRace').before(btn);
 let paused=false,since=0,rate=100,wasRunning=false,counting=0;
 const open=()=>$('#raceScreen').classList.contains('open');
 const racing=()=>open()&&(raceLoop>0||(threeRace&&['cinematic','waiting'].includes(threeRace.startPhase)));
 function pause(){if(paused||!racing())return;paused=true;since=performance.now();wasRunning=raceLoop>0;rate=photo.slow?320:100;if(wasRunning){clearInterval(raceLoop);raceLoop=null}
  try{sound.ctx&&sound.ctx.suspend();speechSynthesis.cancel()}catch(e){}ov.querySelector('.pause-cd').textContent='';ov.querySelector('.pause-card').classList.remove('counting');ov.hidden=false;hooks.emit('race:pause')}
 function resume(){if(!paused||counting)return;const card=ov.querySelector('.pause-card'),cd=ov.querySelector('.pause-cd');card.classList.add('counting');let n=3;cd.textContent=n;
  counting=setInterval(()=>{n--;if(n>0){cd.textContent=n;return}clearInterval(counting);counting=0;
   // l'introduction et la mesure du temps de réaction reprennent là où elles s'étaient arrêtées
   const d=performance.now()-since;if(threeRace){threeRace.introStart+=d;if(threeRace.goTime)threeRace.goTime+=d;threeRace.lastIntro=0}
   try{sound.ctx&&sound.ctx.resume()}catch(e){}paused=false;ov.hidden=true;if(wasRunning&&open())raceLoop=setInterval(runRaceV2,rate);hooks.emit('race:resume')},650)}
 const toggle=()=>paused?resume():pause();
 btn.onclick=e=>{e.stopPropagation();pause()};
 ov.addEventListener('click',e=>{const b=e.target.closest('[data-p]');if(!b)return;e.stopPropagation();if(b.dataset.p==='resume')resume();else{clearInterval(counting);counting=0;paused=false;ov.hidden=true;try{sound.ctx&&sound.ctx.resume()}catch(e){}leaveRace()}});
 document.addEventListener('visibilitychange',()=>{if(document.hidden)pause()});addEventListener('blur',()=>pause());
 hooks.on('race:leave',()=>{paused=false;clearInterval(counting);counting=0;ov.hidden=true});
 // en pause, les commandes de course sont bloquées (sinon on pourrait se replacer « hors du temps »)
 addEventListener('keydown',e=>{if(!open())return;const k=e.key.toLowerCase();if(k==='escape'||k==='p'){e.preventDefault();e.stopImmediatePropagation();toggle();return}if(paused){if(k==='enter'||k===' ')resume();e.preventDefault();e.stopImmediatePropagation()}},true);
 // ---------- manette ----------
 let prev=[],nextSteer=0,announced=false;
 addEventListener('gamepadconnected',()=>{if(announced)return;announced=true;toast('Manette connectée : A = partir / sprint · croix = se décaler · X / Y = temps forts · Start = pause')});
 function poll(now){requestAnimationFrame(poll);const gp=[...(navigator.getGamepads?.()||[])].find(Boolean);if(!gp)return;
  const P=gp.buttons.map(b=>b.pressed),E=P.map((p,i)=>p&&!prev[i]);prev=P;const vis=s=>{const x=$(s);return x&&x.offsetParent&&!x.hidden?x:null};
  if(!open()){if(E[0])(vis('.coach:not([hidden]) button')||vis('#panel.open #raceJoin')||vis('#playBtn'))?.click();return}
  if(E[9]){toggle();return}if(paused){if(E[0])resume();return}
  if(E[0]){const c=vis('.coach:not([hidden]) button');if(c)c.click();else if(!$('#goBtn').hidden)launchFromStalls();else if(raceLoop)sprint();else(vis('#raceResult.show #raceAgain')||vis('#finishBoard.show #showPodium')||vis('#raceResult.show #returnDomain'))?.click()}
  if(moments.active){if(E[2])moments.choose('a');if(E[3])moments.choose('b')}
  const ax=gp.axes[0]||0,left=P[14]||ax<-.55,right=P[15]||ax>.55;if((left||right)&&now>nextSteer){steer(left?-1:1);nextSteer=now+220}if(!left&&!right)nextSteer=0;
  if(E[4])look(-1);if(E[5])look(1)}
 requestAnimationFrame(poll);
 return{pause,resume,get paused(){return paused}}})();
