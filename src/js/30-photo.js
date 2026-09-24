/* ===== Lecture de course (tous les partants sur la mini-carte) et arrivée serrée au ralenti (photo-finish) ===== */
const photo=(()=>{const map=$('.race-map'),dots=Array.from({length:5},()=>{const b=document.createElement('b');b.className='rdot';map.appendChild(b);return b});
 const banner=document.createElement('div');banner.className='pf-banner';banner.textContent='ARRIVÉE SERRÉE !';$('#povWorld').append(banner);$('#povWorld').insertAdjacentHTML('beforeend','<i class="lbox top"></i><i class="lbox bot"></i>');
 let slow=false,restore=0;
 function colors(){const F=currentField;dots.forEach((d,i)=>{const r=F&&F.rivals[i];d.style.background=r?r.livery.main:'#999';d.classList.toggle('nem',!!(r&&r.nemesis));d.title=r?r.name:''})}
 function map2(){dots.forEach((d,i)=>{d.style.left=Math.min(100,progress[i+1]||0)+'%'})}
 function reset(){slow=false;clearTimeout(restore);restore=0;$('#raceScreen').classList.remove('slowmo');banner.classList.remove('show');colors();map2()}
 // arrivée serrée dans les 3 premiers : la simulation passe au ralenti (même nombre de pas, donc même résultat)
 function check(){map2();if(!(raceLoop>0))return;
  if(!slow&&!raceFinished[0]&&progress[0]>97.6){const rank=progress.filter((p,j)=>j&&p>progress[0]).length+1,close=progress.some((p,j)=>j&&!raceFinished[j]&&Math.abs(p-progress[0])<.35);
   if(close&&rank<=3){slow=true;clearInterval(raceLoop);raceLoop=setInterval(runRaceV2,320);$('#raceScreen').classList.add('slowmo');banner.classList.add('show');buzz([20,40,20]);sound.say('Arrivée serrée !',true)}}
  if(slow&&raceFinished[0]&&!restore)restore=setTimeout(()=>{$('#raceScreen').classList.remove('slowmo');banner.classList.remove('show');if(raceLoop>0){clearInterval(raceLoop);raceLoop=setInterval(runRaceV2,100)}},1400)}
 // écart à l'arrivée, dans le vocabulaire des courses
 const margin=g=>g<.03?'un nez':g<.08?'une courte tête':g<.15?'une tête':g<.3?'une encolure':g<.6?'une demi-longueur':null;
 function verdict(){const me=finishOrder.indexOf(0);if(me<0)return'';const t=i=>raceFinishTimes[finishOrder[i]];
  if(me===0&&finishOrder.length>1){const m=margin(t(1)-t(0));const g=t(1)-t(0);return m?`<p class="pf-note win">${g<.15?'📸 Photo-finish : victoire':'🏁 Victoire'} d’${m} devant ${escapeHTML(raceNames[finishOrder[1]])}</p>`:''}
  const g=t(me)-t(me-1),m=margin(g);return m?`<p class="pf-note">${g<.15?'📸 Photo-finish : battu':'Battu'} d’${m} par ${escapeHTML(raceNames[finishOrder[me-1]])}</p>`:''}
 return{reset,check,verdict,get slow(){return slow}}})();
{const r0=runRaceV2;runRaceV2=function(){r0();photo.check()}}
{const s0=startRace;startRace=function(){s0.apply(this,arguments);photo.reset()}}
{const c0=completeRace;completeRace=function(){c0();$('#fbStars').insertAdjacentHTML('afterbegin',photo.verdict())}}
