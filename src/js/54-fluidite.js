/* ===== Fluidité : la qualité « auto » s'ajuste aux images par seconde réellement mesurées =====
   On mesure le temps entre deux images quand le joueur regarde vraiment la 3D (course en cours, ou domaine 3D sans panneau ouvert).
   Médiane glissante sur ~2 s : au-delà de 34 ms (moins de 30 images/s), la résolution de rendu baisse d'un cran (100 → 85 → 72 → 60 %),
   puis, si ça ne suffit pas, le niveau d'effets (haute → moyenne → basse). Sous 17 ms pendant 8 s, la résolution remonte d'un cran.
   Les ajustements sont retenus pour la partie suivante ; choisir un niveau à la main dans Réglages les annule. Rien ne change hors « Auto ». */
const fluidite=(()=>{const STEPS=[1,.85,.72,.6],ORD=['basse','moyenne','haute'];let last=0,buf=[],next=0,good=0,said=false;
 const watching=()=>{if(document.hidden)return false;if($('#raceScreen').classList.contains('open'))return !!(typeof threeRace!=='undefined'&&threeRace&&!threeRace.headless&&threeRace.startPhase==='running');
  try{return domaine3d.on&&!$('#panel').classList.contains('open')}catch(e){return false}};
 const median=a=>{const s=a.slice().sort((x,y)=>x-y);return s[s.length>>1]};
 function adjust(dir){const rs=settings.scale(),i=STEPS.indexOf(STEPS.find(x=>x<=rs+1e-6)??1);
  if(dir<0){if(i<STEPS.length-1){settings.set('rs',STEPS[i+1]);return true}const l=settings.level(),k=ORD.indexOf(l);if(k>0){settings.set('cap',ORD[k-1]);settings.set('rs',STEPS[1]);return true}return false}
  if(i>0){settings.set('rs',STEPS[i-1]);return true}return false}
 function frame(now){requestAnimationFrame(frame);const dt=now-last;last=now;if(settings.get('q')!=='auto'||!watching()){buf.length=0;good=0;return}if(dt<=0||dt>3000)return;// > 3 s : pause du système, pas une image
  // fenêtre : 20 images couvrant 1,5 s, ou 5 s de mesure pour un appareil très lent
  buf.push(dt);if(buf.length>120)buf.shift();const sum=buf.reduce((a,x)=>a+x,0);if(now<next||!(buf.length>=20&&sum>=1500||sum>=5000&&buf.length>=3))return;next=now+2000;const m=median(buf);
  if(m>34){if(adjust(-1)){buf.length=0;good=0;hooks.emit('fluidite',{ms:Math.round(m),rs:settings.scale(),niveau:settings.level()});if(!said){said=true;toast('Qualité ajustée pour garder le jeu fluide')}}}
  else if(m<17){good+=2;if(good>=8&&adjust(1)){good=0;buf.length=0;hooks.emit('fluidite',{ms:Math.round(m),rs:settings.scale(),niveau:settings.level()})}}else good=0}
 requestAnimationFrame(frame);
 // état (rapport de bug, tests) : images mesurées, médiane, mesure active ou non, résolution et niveau
 return{get etat(){return{n:buf.length,ms:buf.length?Math.round(median(buf)):0,mesure:watching(),rs:settings.scale(),niveau:settings.level()}},reset(){settings.set('cap',undefined);settings.set('rs',undefined)}}})();
