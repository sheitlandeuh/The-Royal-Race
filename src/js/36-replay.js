/* ===== Rejeu de course : graine + plateau + paramètres du joueur + actions datées au pas près =====
   Chaque course terminée est enregistrée (10 dernières, trr.replays) puis rejouée aussitôt, sans affichage, pour vérifier
   qu'on retrouve exactement le même classement et les mêmes temps. C'est la base des courses fantômes et de la validation
   côté serveur : un serveur qui dispose du même moteur peut refaire la course et refuser un résultat truqué. */
// ENGINE : version des formules de course ; un enregistrement d'une autre version ne peut pas être refait à l'identique (ok:null, why:'version')
const ENGINE=4;
const replays=(()=>{const KEY='trr.replays',clone=o=>JSON.parse(JSON.stringify(o));let rec=null,busy=false,toCheck=null;
 const load=()=>{try{return JSON.parse(localStorage.getItem(KEY)||'[]')}catch(e){return[]}},store=list=>{try{localStorage.setItem(KEY,JSON.stringify(list.slice(-10)))}catch(e){}};
 const at=(type,v)=>{if(rec&&!busy)rec.inputs.push([raceTime,type,v])};
 hooks.on('race:start',()=>{if(busy)return;rec={v:1,e:ENGINE,at:new Date().toISOString(),race:clone(RACE),field:clone(currentField),seed:raceSeed,player:clone(racePlayer),strategy:state.strategy,horse:stable.active().name,liv:{...stable.silks,coat:stable.active().coat},inputs:[]}});
 hooks.on('race:launch',()=>{if(rec&&!busy)rec.plan=moments.plan});
 hooks.on('race:steer',d=>at('steer',d));
 hooks.on('race:sprint',()=>at('sprint'));
 hooks.on('race:jump',c=>at('jump',c));
 hooks.on('race:pace',v=>at('pace',v));
 hooks.on('moment:choose',ch=>at('moment',ch));
 hooks.on('race:end',()=>{if(!rec||busy)return;rec.result={order:finishOrder.slice(),times:raceFinishTimes.map(t=>+t.toFixed(3))};const list=load();list.push(rec);store(list);toCheck=rec;rec=null});
 // vérification au retour au domaine (le podium n'utilise plus l'état de course)
 hooks.on('race:leave',()=>{const r=toCheck;toCheck=null;if(r)setTimeout(()=>{const v=verify(r);if(v.ok===false)console.warn('Rejeu : écart détecté',v);try{playtest.on&&playtest.log('rejeu',{ok:v.ok})}catch(e){}},400)});
 // refait la course sans rien afficher ni jouer de son, puis restaure l'état ; opts.track : trajectoire du joueur pas à pas (fantôme d'un duel)
 function verify(r,opts={}){if((r&&r.e||1)!==ENGINE)return{ok:null,why:'version'};if(busy||raceLoop>0)return{ok:null,why:'course en cours'};busy=true;
  const keep={RACE,currentField,racePlayer,strategy:state.strategy,complete:completeRace,say:sound.say,bump:career.bump,tip:coach.tip,said:runRaceV2.said,tipd:runRaceV2.tipd,
   progress,visualProgress,raceFinished,raceFinishTimes,finishOrder,rivalAI,raceTime,playerEnergy,playerFinal,playerPace,playerLane,playerTarget,autoSpeed,raceSeed,raceRng,stallOf,raceBlocked,lanes:rivalLanes.slice(),RS:{...RS}};
  try{completeRace=()=>{};sound.say=()=>{};career.bump=()=>{};coach.tip=()=>{};try{Object.defineProperty(navigator,'vibrate',{value:()=>false,configurable:true})}catch(e){}runRaceV2.said=1;runRaceV2.tipd=1;
   RACE=clone(r.race);currentField=clone(r.field);racePlayer=clone(r.player);state.strategy=r.strategy;raceSeed=r.seed;raceRng=seeded(raceSeed);
   resetRacers();raceLoop=-1;
   initRivalAI();if(r.plan)moments.plan=r.plan;
   let i=0,n=0;const I=r.inputs,tr=opts.track?{p:[0],l:[Math.round(playerLane)]}:null;
   while(finishOrder.length<6&&n<9000){while(i<I.length&&I[i][0]<=raceTime){const[,type,val]=I[i++];raceInput(type,val)}runRaceV2();n++;if(tr&&!raceFinished[0]){tr.p[raceTime]=+progress[0].toFixed(3);tr.l[raceTime]=Math.round(playerLane)}}
   if(tr)tr.p.push(101);
   const times=raceFinishTimes.map(t=>+t.toFixed(3)),same=JSON.stringify(finishOrder)===JSON.stringify(r.result.order)&&times.every((t,k)=>Math.abs(t-r.result.times[k])<.002);
   return{ok:same,order:finishOrder.slice(),expected:r.result.order,times,expectedTimes:r.result.times,track:tr}}
  finally{raceLoop=null;({progress,visualProgress,raceFinished,raceFinishTimes,finishOrder,rivalAI,raceTime,playerEnergy,playerFinal,playerPace,playerLane,playerTarget,autoSpeed,raceSeed,raceRng,stallOf,raceBlocked}=keep);keep.lanes.forEach((v,i)=>rivalLanes[i]=v);Object.assign(RS,keep.RS);RACE=keep.RACE;currentField=keep.currentField;racePlayer=keep.racePlayer;state.strategy=keep.strategy;completeRace=keep.complete;sound.say=keep.say;career.bump=keep.bump;coach.tip=keep.tip;try{delete navigator.vibrate}catch(e){}runRaceV2.said=keep.said;runRaceV2.tipd=keep.tipd;busy=false}}
 return{get list(){return load()},get busy(){return busy},verify,last:()=>load().slice(-1)[0]}})();
