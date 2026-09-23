let raceLoop=null,progress=[],visualProgress=[],raceTime=0,playerLane=50,lookDir=0,autoSpeed=.42,sprintUntil=0,sprintReady=true,startBoostUntil=0,playerEnergy=100,rivalAI=[],raceFinished=[],raceFinishTimes=[],finishOrder=[],raceStartClock=0;state.strategy='stalker';
const rivalLanes=[46,25,70,58,12],rivalBase=[.432,.405,.448,.415,.424];
const raceNames=['Royal Thunder','Black Majesty','Éclair Rouge','Silver Crown','Royal Shadow','Golden Star'];
const race3d=$('#race3d'),RACE_ORIGIN=.235;let threeRace=null;
let sceneFrame=0,lastScene=0,raceSeed=1,raceRng=Math.random;
const seeded=seed=>{let a=seed>>>0;return()=>{a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}};
