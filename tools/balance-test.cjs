// Test d'équilibrage (nécessite Playwright) : node tools/balance-test.cjs  — le jeu doit être servi sur http://localhost:8765
const { chromium } = require('playwright');
(async()=>{const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const p=await b.newPage({viewport:{width:800,height:500}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.addInitScript(()=>{localStorage.setItem('trr.champion',JSON.stringify({name:'Éclair de Lune',coat:'alezan',main:'#c21c27',second:'#f4f2ec',pattern:'chevrons',cap:'#f4f2ec'}))});
await p.goto('http://localhost:8765/index.html');await p.waitForTimeout(2500);
const res=await p.evaluate(()=>{
 function sim(meet,seed,tactic,playSprint=true){RACE={...MEETINGS.find(m=>m.id===meet)};state.strategy=tactic;const h=stable.active();h.fatigue=10;h.form=62;h.moral=72;currentField=null;buildField(seed);state.feed=99999;startRace();threeRace.startPhase='waiting';threeRace.goTime=performance.now();launchFromStalls();clearInterval(raceLoop);autoSpeed=.5;
  let n=0,sp=0;while(finishOrder.length<6&&n<9000){if(playSprint&&progress[0]>(tactic==='finisher'?74:80)&&sprintReady&&playerEnergy>25){sprintReady=false;sprintUntil=raceTime+32;sp++;setTimeout(()=>{},0)}if(raceTime>=sprintUntil&&!sprintReady&&raceTime>sprintUntil+60)sprintReady=true;{const a=nearbyHorses(0)[0];const boxed=a&&a.gap<1.6&&Math.abs(a.l-playerLane)<11;playerLane+=boxed?(playerLane<60?4:-4):(14-playerLane)*.05}runRaceV2();n++}
  const r={order:finishOrder.join(''),times:raceFinishTimes.map(t=>t.toFixed(2)).join(' '),rank:finishOrder.indexOf(0)+1,e:Math.round(playerEnergy),t:raceFinishTimes[finishOrder[0]].toFixed(1)};leaveRace();return r}
 const A=sim('m2',424242,'stalker'),B=sim('m2',424242,'stalker');
 const bal={};for(const m of ['m1','m2','m3','m4'])for(const t of['leader','stalker','finisher']){let s=0,w=0,tt=0;for(let k=1;k<=24;k++){const r=sim(m,k*7919,t);s+=r.rank;w+=r.rank===1;tt+=+r.t}bal[m+'-'+t]=`rang moyen ${(s/24).toFixed(2)} · victoires ${w}/24 · temps vainqueur ${(tt/24).toFixed(1)}s`}
 return{A,B,same:A.order===B.order&&A.times===B.times,bal}});
console.log(JSON.stringify(res,null,1));console.log(errs);await b.close()})();
