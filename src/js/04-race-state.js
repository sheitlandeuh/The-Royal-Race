/* moteur 3 (course pensée pour le multijoueur) : départ commun, pas de pause, chevaux solides.
   STALL_LANES : couloirs des 6 stalles (n°1 à la corde) ; HORSE_LEN : longueur d'un cheval (en % de course) ; HORSE_W : largeur (en couloirs) ;
   LANE_V : vitesse latérale maximale (couloirs par pas). Deux chevaux ne peuvent jamais se superposer : on double par le côté. */
const STALL_LANES=[12,26,40,54,68,82],HORSE_LEN=.62,HORSE_W=8,LANE_V=1.6;
let playerTarget=44,stallOf=[0,1,2,3,4,5],raceBlocked=[0,0,0,0,0,0];
// affichage : état juste avant le dernier pas (raceSnap), couloirs affichés lissés (visualLane) et leur vitesse (laneVel, couloirs / s)
let raceSnap=null,visualLane=[],laneVel=[0,0,0,0,0,0];
let playerFinal=false,playerPace=0,raceLoop=null,progress=[],visualProgress=[],raceTime=0,playerLane=50,lookDir=0,autoSpeed=.42,playerEnergy=100,rivalAI=[],raceFinished=[],raceFinishTimes=[],finishOrder=[];state.strategy='stalker';
const rivalLanes=[46,25,70,58,12],rivalBase=[.432,.405,.448,.415,.424];
// noms affichés pendant la course (0 = cheval du joueur, 1-5 = adversaires) : réécrits à chaque départ depuis le plateau engagé (11-ecuries)
const raceNames=['Royal Thunder','Black Majesty','Éclair Rouge','Silver Crown','Royal Shadow','Golden Star'];
// RACE_ORIGIN : place du départ sur le tour affiché (l'arrivée y est aussi : une course = un tour) ; propre à chaque hippodrome (setTrack)
const race3d=$('#race3d');let RACE_ORIGIN=.235,threeRace=null;
let sceneFrame=0,lastScene=0,raceSeed=1,raceRng=Math.random;
const seeded=seed=>{let a=seed>>>0;return()=>{a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}};
