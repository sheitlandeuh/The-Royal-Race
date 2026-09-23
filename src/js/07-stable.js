/* ===== Écurie : chevaux, statistiques, condition, entraînement — sauvegardé dans ce navigateur ===== */
const STATS=[
 {k:'vit',n:'Vitesse',d:'Vitesse de croisière et vitesse de pointe'},
 {k:'acc',n:'Accélération',d:'Puissance du sprint et coût du sprint en endurance'},
 {k:'end',n:'Endurance',d:'Énergie dépensée en course (surtout hors du sillage)'},
 {k:'dep',n:'Départ',d:'Fenêtre de réaction à la sortie des stalles'},
 {k:'tac',n:'Intelligence',d:'Gain d’aspiration et vitesse quand le cheval est enfermé'},
 {k:'tem',n:'Tempérament',d:'Régularité de la foulée et pénalité de faux départ'}];
const DISTS=[[1200,'Sprinter'],[1600,'Mile'],[2000,'Classique'],[2400,'Tenace']];
const SESSIONS=[
 {id:'galop',n:'Galop de vitesse',b:'hippodrome',where:'Hippodrome',ico:'⚡',gain:{vit:2.3,acc:.4},fat:18,cost:{feed:400},txt:'Accélérations franches sur la ligne droite.'},
 {id:'fractionne',n:'Fractionné',b:'carriere',where:'Carrière',ico:'⏱️',gain:{acc:2.1,end:.6},fat:20,cost:{feed:450},txt:'Répétitions courtes et intenses.'},
 {id:'canter',n:'Canter long',b:'paddocks',where:'Paddocks',ico:'🌿',gain:{end:2.3,tem:.3},fat:13,cost:{feed:350},txt:'Galop régulier sur longue distance.'},
 {id:'cote',n:'Travail en côte',b:'paddocks',where:'Paddocks',ico:'⛰️',gain:{acc:1.2,end:1.2,vit:.3},fat:22,cost:{feed:500},txt:'Renforce l’arrière-main et le souffle.'},
 {id:'stalles',n:'Sorties de stalles',b:'hippodrome',where:'Hippodrome',ico:'🚪',gain:{dep:2.5,tem:.4},fat:9,cost:{gold:1200},txt:'Habitue le cheval au bruit des portes.'},
 {id:'groupe',n:'Galop en groupe',b:'carriere',where:'Carrière',ico:'🐎',gain:{tac:2.3,tem:.4},fat:12,cost:{gold:1500},txt:'Apprend à courir dans le peloton et dans les dos.'},
 {id:'longe',n:'Longe & dressage',b:'carriere',where:'Carrière',ico:'🎯',gain:{tem:2.3,tac:.5},fat:6,cost:{gold:900},txt:'Calme, écoute et équilibre.'},
 {id:'piscine',n:'Piscine équine',b:'clinique',where:'Clinique',ico:'💧',gain:{end:1.5},fat:3,cost:{gold:2500},txt:'Cardio sans impact sur les membres.'}];
const CARE=[
 {id:'repos',n:'Repos au pré',b:'paddocks',where:'Paddocks',ico:'☀️',fat:-30,form:2,moral:12,cost:{},txt:'Récupération naturelle, moral en hausse.'},
 {id:'soins',n:'Soins vétérinaires',b:'clinique',where:'Clinique',ico:'🩺',fat:-60,moral:4,heal:true,cost:{gold:3000},txt:'Guérit les petites blessures, efface la fatigue.'},
 {id:'ration',n:'Ration premium',b:'moulin',where:'Moulin',ico:'🌾',form:8,moral:6,cost:{feed:1200},txt:'Avoine, orge et luzerne : la forme monte.'}];
const INTENS=[{id:'leger',n:'Léger',g:.6,f:.55},{id:'normal',n:'Normal',g:1,f:1},{id:'intensif',n:'Intensif',g:1.55,f:1.7}];
const XP_LEVEL=l=>Math.round(90*Math.pow(l,1.2));
const rating=h=>Math.round(h.stats.vit*.24+h.stats.acc*.2+h.stats.end*.18+h.stats.dep*.1+h.stats.tac*.15+h.stats.tem*.13);
const stable=(()=>{
 const mk=(id,name,coat,stats,caps,dist,level)=>({id,name,coat,breed:'Pur-sang',age:4,level,xp:0,points:0,stats,caps,dist,form:62,fatigue:8,moral:72,injury:0,races:0,wins:0,places:0,log:[]});
 const fresh=()=>({v:1,created:false,silks:{main:'#1f3f9f',second:'#c8982c',pattern:'losange',cap:'#1f3f9f'},active:'h1',res:null,lastT:Date.now(),
  horses:[mk('h1','Royal Thunder','bai',{vit:72,acc:66,end:60,dep:58,tac:55,tem:62},{vit:94,acc:90,end:86,dep:85,tac:88,tem:84},1600,8),
          mk('h2','Belle Étoile','gris',{vit:63,acc:57,end:76,dep:52,tac:66,tem:70},{vit:86,acc:82,end:95,dep:80,tac:90,tem:92},2000,7),
          mk('h3','Prince d’Or','palomino',{vit:69,acc:73,end:50,dep:68,tac:52,tem:55},{vit:92,acc:95,end:74,dep:92,tac:80,tem:78},1200,6)]});
 let S=null;try{S=JSON.parse(localStorage.getItem('trr.stable')||'null')}catch(e){}
 if(S&&S.v===1&&S.horses.length>3&&!S.horses[3].id)S.horses.length=3;if(!S||S.v!==1){S=fresh();try{const old=JSON.parse(localStorage.getItem('trr.champion')||'null');if(old){S.created=true;S.silks={main:old.main,second:old.second,pattern:old.pattern,cap:old.cap};S.horses[0].name=old.name;S.horses[0].coat=old.coat}}catch(e){}}
 const save=()=>{S.res={gold:state.gold,feed:state.feed,gems:state.gems,trophies:state.trophies};try{localStorage.setItem('trr.stable',JSON.stringify(S))}catch(e){}};
 if(S.res)Object.assign(state,S.res);
 const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
 // récupération en temps réel : la fatigue baisse, la forme revient vers la moyenne
 function tick(){const now=Date.now(),hrs=Math.max(0,(now-S.lastT)/36e5);if(hrs<.001)return;S.lastT=now;for(const h of S.horses){h.fatigue=clamp(h.fatigue-9*hrs,0,100);h.moral=clamp(h.moral+(72-h.moral)*Math.min(1,hrs*.08),0,100);h.form=clamp(h.form+(58-h.form)*Math.min(1,hrs*.02),0,100);if(h.injury&&now>h.injury)h.injury=0}}
 tick();
 const byId=id=>S.horses.find(h=>h.id===id)||S.horses[0];
 const log=(h,t)=>{h.log.unshift({t,at:Date.now()});h.log.length=Math.min(h.log.length,12)};
 function gainXP(h,x){h.xp+=x;let up=0;while(h.xp>=XP_LEVEL(h.level)){h.xp-=XP_LEVEL(h.level);h.level++;h.points+=3;up++;for(const s of STATS)h.caps[s.k]=Math.min(100,h.caps[s.k]+.5)}return up}
 const canPay=c=>(c.gold||0)<=state.gold&&(c.feed||0)<=state.feed;
 const pay=c=>{state.gold-=c.gold||0;state.feed-=c.feed||0;sync()};
 const room=(h,k)=>clamp((h.caps[k]-h.stats[k])/Math.max(6,h.caps[k]-35),0,1);
 function preview(h,ses,int){const I=INTENS.find(x=>x.id===int)||INTENS[1],out={};for(const[k,b]of Object.entries(ses.gain)){const g=b*I.g*Math.pow(room(h,k),.75)*(h.fatigue>70?.55:1)*(.85+h.form/400);out[k]=[g*.8,g*1.2]}return{gain:out,fat:Math.round(ses.fat*I.f),risk:h.fatigue+ses.fat*I.f>85&&I.id==='intensif'?'élevé':h.fatigue+ses.fat*I.f>92?'modéré':'faible'}}
 function train(id,sesId,int){tick();const h=byId(id),ses=SESSIONS.find(s=>s.id===sesId),I=INTENS.find(x=>x.id===int)||INTENS[1];
  if(h.injury)return{err:`${h.name} est blessé : passe par la clinique.`};if(h.fatigue>=95)return{err:`${h.name} est épuisé. Laisse-le se reposer.`};if(!canPay(ses.cost))return{err:ses.cost.gold?'Or insuffisant':'Fourrage insuffisant'};
  pay(ses.cost);const p=preview(h,ses,int),delta={};for(const[k,[a,b]]of Object.entries(p.gain)){const g=a+Math.random()*(b-a),before=h.stats[k];h.stats[k]=Math.min(h.caps[k],+(h.stats[k]+g).toFixed(2));delta[k]=h.stats[k]-before}
  h.fatigue=clamp(h.fatigue+p.fat,0,100);h.form=clamp(h.form+(h.fatigue<70?1.5:-3),0,100);h.moral=clamp(h.moral+(I.id==='intensif'?-4:I.id==='leger'?2:0),0,100);
  let hurt=false;if(I.id==='intensif'&&h.fatigue>85&&Math.random()<.3){h.injury=Date.now()+30*60e3;hurt=true}
  const up=gainXP(h,Math.round(22*I.g));log(h,`${ses.n} (${I.n.toLowerCase()}) : `+Object.entries(delta).map(([k,d])=>`${STATS.find(s=>s.k===k).n} +${d.toFixed(1)}`).join(', '));save();return{delta,hurt,up,h}}
 function care(id,cId){tick();const h=byId(id),c=CARE.find(x=>x.id===cId);if(!canPay(c.cost))return{err:c.cost.gold?'Or insuffisant':'Fourrage insuffisant'};pay(c.cost);
  h.fatigue=clamp(h.fatigue+(c.fat||0),0,100);h.form=clamp(h.form+(c.form||0),0,100);h.moral=clamp(h.moral+(c.moral||0),0,100);if(c.heal)h.injury=0;log(h,c.n);save();return{h}}
 function spend(id,k){const h=byId(id);if(h.points<1||h.stats[k]>=h.caps[k])return false;h.points--;h.stats[k]=Math.min(h.caps[k],h.stats[k]+1);save();return true}
 function afterRace(id,rank,field){const h=byId(id);h.races++;if(rank===1)h.wins++;if(rank<=3)h.places++;h.fatigue=clamp(h.fatigue+24,0,100);h.form=clamp(h.form+(rank===1?5:rank<=3?2:-2),0,100);h.moral=clamp(h.moral+(rank===1?10:rank<=3?4:-3),0,100);
  const xp=[140,105,85,65,55,45][rank-1]||40,up=gainXP(h,xp);log(h,`Course : ${rank}${rank===1?'er':'e'} sur ${field}`);save();return{xp,up}}
 // paramètres de course dérivés des statistiques (joueur et adversaires utilisent les mêmes formules)
 function racePerf(st,cond={},dist=1600,pref=1600,tactic='stalker'){const c=1+((cond.form??60)-60)*.0009-Math.max(0,(cond.fatigue??0)-40)*.0016+((cond.moral??65)-65)*.0003,fit=1-Math.min(.02,Math.max(0,pref-dist)/400*.008),fitD=1+Math.max(0,dist-pref)/400*.07;
  const t={leader:{c:1.01,d:1.25,s:0},stalker:{c:1,d:1,s:0},finisher:{c:.984,d:.8,s:.04}}[tactic]||{c:1,d:1,s:0};
  return{cruise:(.418+st.vit*.0007)*c*fit,sprint:.1+st.acc*.0011+t.s,sprintDrain:.62*(1.4-st.acc*.006),drain:.105*(1.55-st.end*.0085)*fitD,boxed:.27+st.tac*.0006,draft:.008+st.tac*.00012,noise:(100-st.tem)*.00008,window:180+(st.dep-50)*2.2,tactic:t}}
 function rivals(ref,n=5,seed=Date.now()){let x=seed%2147483646+1;const r=()=>(x=(x*16807)%2147483647)/2147483647;return Array.from({length:n},()=>{const base=ref-7+r()*14,st={};for(const s of STATS)st[s.k]=clamp(base+(r()-.5)*22,35,99);return{stats:st,pref:DISTS[Math.floor(r()*4)][0]}})}
 function addHorse(o){if(S.horses.some(h=>h.name===o.name))return false;const h=mk('h'+(S.horses.length+1)+Date.now()%1000,o.name,o.coat,o.stats,o.caps,o.dist,o.level);h.rare=!!o.rare;S.horses.push(h);log(h,'Arrivée à l’écurie');save();return h}
 return{addHorse,get data(){return S},save,tick,active:()=>byId(S.active),byId,setActive(id){S.active=id;save()},train,care,spend,afterRace,preview,racePerf,rivals,rating,room,
  get silks(){return S.silks},set silks(v){S.silks=v},get created(){return S.created},set created(v){S.created=v}}})();
setInterval(()=>{stable.tick();stable.save()},60e3);
/* champion = couleurs du propriétaire + robe/nom du cheval actif (API utilisée par l’atelier et la course) */
const champion=(()=>{const L=[];return{get(){const h=stable.active();return{...stable.silks,name:h.name,coat:h.coat}},exists:()=>stable.created,
 set(v){stable.silks={main:v.main,second:v.second,pattern:v.pattern,cap:v.cap};const h=stable.active();h.name=v.name;h.coat=v.coat;stable.created=true;stable.save();L.forEach(f=>f(this.get()))},on:f=>L.push(f),emit(){L.forEach(f=>f(this.get()))}}})();
{const s0=sync;sync=function(){s0();stable.save()}}sync();
