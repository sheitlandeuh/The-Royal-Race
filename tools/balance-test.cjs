// Test d'équilibrage (nécessite Playwright) : node tools/balance-test.cjs — le jeu doit être servi sur http://localhost:8765
const { chromium } = require('playwright');
(async()=>{const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const p=await b.newPage({viewport:{width:800,height:500}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.addInitScript(()=>{localStorage.setItem('trr.champion',JSON.stringify({name:'Éclair de Lune',coat:'alezan',main:'#c21c27',second:'#f4f2ec',pattern:'chevrons',cap:'#f4f2ec'}))});
await p.goto('http://localhost:8765/index.html');await p.waitForTimeout(2500);
const res=await p.evaluate(()=>{
 function sim(meet,seed,tactic,mode){RACE={...MEETINGS.find(m=>m.id===meet)};state.strategy=tactic;const h=stable.active();h.fatigue=10;h.form=62;h.moral=72;currentField=null;buildField(seed);state.feed=99999;startRace();threeRace.startPhase='waiting';threeRace.goTime=performance.now();launchFromStalls();clearInterval(raceLoop);raceLoop=-1;autoSpeed=.5;
  let n=0;while(finishOrder.length<6&&n<9000){if(!playerFinal&&progress[0]>35){const reach=sprintReach(racePlayer,playerEnergy,racePlayer.cruise),rem=remainingM(progress[0]);if(mode==='ideal'&&reach>=rem||mode==='early'&&progress[0]>55||mode==='late'&&rem<RACE.dist*.08)sprint()}
   {const a=nearbyHorses(0)[0];const boxed=a&&a.gap<1.6&&Math.abs(a.l-playerLane)<11;playerLane+=boxed?(playerLane<60?4:-4):(14-playerLane)*.05}runRaceV2();n++}
  const r={rank:finishOrder.indexOf(0)+1,stars:(()=>{try{return raceAnalysis(finishOrder.indexOf(0)+1).stars}catch(e){return e.message}})()};leaveRace();return r}
 const out={};for(const m of ['m1','m2','m3','m4'])for(const mode of['ideal'])for(const t of(mode==='ideal'?['leader','stalker','finisher']:['stalker'])){let s=0,w=0,st=0;for(let k=1;k<=20;k++){const r=sim(m,k*7919,t,mode);s+=r.rank;w+=r.rank===1;st+=r.stars}out[`${m} ${mode} ${t}`]=`rang ${(s/20).toFixed(2)} · victoires ${w}/20 · étoiles ${(st/20).toFixed(1)}`}
 return out});
console.log(JSON.stringify(res,null,1));console.log(errs);await b.close()})();
