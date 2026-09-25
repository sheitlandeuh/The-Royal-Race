/* ===== Replay télévisé : revoir la course qui vient de se terminer, caméra de bord de piste =====
   On rejoue l'enregistrement (graine + actions) en temps réel dans la scène 3D, sans aucun effet sur la partie :
   les événements du jeu sont mis en sourdine (sauf le lancement, nécessaire au moteur), missions et voix aussi.
   Comme la course est déterministe, le replay est exactement la course que le joueur a courue. */
const tele=(()=>{let on=false,loop=0,rec=null,i=0,keep=null,speed=1;
 const scr=$('#raceScreen'),bar=document.createElement('div');bar.className='tv-bar';bar.innerHTML='<span class="tv-live">● REPLAY</span><b class="tv-title"></b><button data-tv="speed">×2</button><button data-tv="skip">PASSER</button>';scr.appendChild(bar);
 const btn=document.createElement('button');btn.className='action';btn.id='tvBtn';btn.innerHTML='📺 REVOIR LA COURSE';$('#returnDomain').before(btn);
 function start(){const r=replays.last();if(on||!r||!threeRace||!r.result)return;rec=r;on=true;i=0;speed=1;
  // mise en sourdine de tout ce qui pourrait toucher la partie pendant le replay
  keep={emit:hooks.emit,bump:career.bump,say:sound.say,complete:completeRace};const E=keep.emit;
  hooks.emit=(e,...a)=>{if(e==='race:launch')return E(e,...a);if(e==='race:leave'){stop();return E(e,true)}};career.bump=()=>{};sound.say=()=>{};completeRace=()=>{};
  RACE=JSON.parse(JSON.stringify(r.race));currentField=JSON.parse(JSON.stringify(r.field));racePlayer=JSON.parse(JSON.stringify(r.player));state.strategy=r.strategy;raceSeed=r.seed;raceRng=seeded(raceSeed);
  progress=[0,0,0,0,0,0];visualProgress=progress.slice();raceFinished=Array(6).fill(false);raceFinishTimes=Array(6).fill(0);finishOrder=[];rivalAI=[];raceTime=0;playerEnergy=100;playerFinal=false;playerLane=44;[12,28,56,72,88].forEach((v,k)=>rivalLanes[k]=v);resetRaceStats();
  const RW=r.window||180,x=r.reaction??RW*2;autoSpeed=x<RW?.59:x<RW*1.78?.52:x<RW*2.9?.44:.35;RS.reaction=x;RS.window=RW;runRaceV2.said=1;runRaceV2.tipd=1;
  initRivalAI();if(r.plan)moments.plan=r.plan;
  const q=threeRace;q.podiumActive=false;q.finishView=false;q.tvView=true;q.startPhase='running';q.camPos=null;q.camTarget=null;q.podium.visible=false;q.stalls.visible=true;q.stalls.userData.doors.forEach(d=>{d.rotation.x=-Math.PI/2;d.position.y=.15});
  q.horses.forEach((h,k)=>{h.visible=true;h.material.map=q.horseTextures[k];h.material.needsUpdate=true});
  $('#finishBoard').classList.remove('show');$('#raceResult').classList.remove('show');scr.classList.add('tv');bar.querySelector('.tv-title').textContent=r.race.n;bar.querySelector('[data-tv=speed]').textContent='×2';
  sound.crowdStart();loop=setInterval(tickTv,100)}
 function tickTv(){for(let s=0;s<speed;s++){if(finishOrder.length>=6)return end();raceLoop=-1;const I=rec.inputs;while(i<I.length&&I[i][0]<=raceTime){const[,type,val]=I[i++];if(type==='steer')steer(val);else if(type==='sprint')sprint();else if(type==='moment')moments.choose(val)}
   runRaceV2();raceLoop=null}sound.crowdLevel(Math.max(0,(Math.max(...progress)-60)/40))}// raceLoop factice pendant un pas : le sprint exige une course « en cours »
 function end(){stop();$('#raceResult').classList.add('show')}
 function stop(){if(!on)return;on=false;clearInterval(loop);loop=0;hooks.emit=keep.emit;career.bump=keep.bump;sound.say=keep.say;completeRace=keep.complete;scr.classList.remove('tv');$('.moment')&&($('.moment').hidden=true);
  const q=threeRace;if(q){q.tvView=false;q.finishView=true;q.camPos=null;q.camTarget=null}}
 btn.onclick=e=>{e.stopPropagation();start()};
 bar.addEventListener('click',e=>{const b=e.target.closest('[data-tv]');if(!b)return;e.stopPropagation();if(b.dataset.tv==='skip'){while(on&&finishOrder.length<6&&raceTime<9000)tickTv();if(on)end()}else{speed=speed===1?2:1;b.textContent=speed===1?'×2':'×1'}});
 // le bouton n'apparaît qu'après une course enregistrée (pas pendant un tournoi : l'écran de résultat y est différent)
 hooks.on('race:start',()=>{btn.hidden=true});hooks.on('race:end',()=>{btn.hidden=!replays.last()});
 // step(n) : avance le replay de n pas (vérification sur capture)
 return{start,stop,step:n=>{for(let k=0;k<n&&on;k++)tickTv()},get on(){return on}}})();
