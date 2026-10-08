/* ===== Stratégie de course (3.0, moteur 6) : des courses moins prévisibles, des adversaires qui courent pour gagner =====
   Tout est tiré de la graine du plateau (rejeu, duels, serveur) et annoncé avant le départ quand un connaisseur le verrait :
   - conditions du jour : corde rapide ou lourde (vitesse le long de la lice), vent dans la ligne d'arrivée (de face : le sillage vaut
     davantage et qui court à découvert s'use ; dans le dos : les animateurs tiennent mieux, le sillage compte moins) ;
   - rond de présentation : un adversaire peut être en grande forme, terne, ou nerveux (il tire sur son jockey : vite au début, il s'use) ;
     un départ manqué, lui, ne se voit qu'à l'ouverture des stalles — ton cheval compris (un bon Départ et du calme le rendent rare) ;
   - adversaires : chacun court avec un plan. Un animateur peut accélérer en tête pour décramponner le peloton, un cheval « dans les dos »
     attaquer avant la ligne droite ; l'attentiste reste abrité puis déborde ; doublé dans la ligne droite, un cheval de cœur riposte ;
     un cheval à l'extérieur du tien peut te laisser enfermé ; certains jockeys connaissent la piste et évitent une corde lourde.
   Seules les courses du moteur 6 en dépendent (raceEng) : un rejeu ou un duel d'une version antérieure garde ses règles.
   Réglages STRAT_FX mesurés au bot (voir README, Nouveautés 3.0). */
const STRAT_FX={err:.55,sitP:.5,sitUntil:76,sitMax:30,corde:.008,vent:{face:.012,draftFace:1.5,dos:.004,draftDos:.6,from:75},tire:{c:1.025,d:1.45,until:45},forme:.02,depart:{k:.7,ticks:9},
 moveP:{leader:.6,stalker:.45},move:{c:1.022,d:1.6,min:45,stop:20},fight:{c:1.014,d:1.3,ticks:22,last:70}};
const strat=(()=>{
 const FX=STRAT_FX,S={on:false,rng:Math.random,me:{slow:false},prev:[],msgAt:-99,said:{}};
 const on=()=>S.on&&raceEng>=6;
 // ---------- conditions du jour et rond de présentation (après les plateaux imposés : Défi, duel, Couronne) ----------
 function draw(F){const r=seeded((F.seed^0x51ed270b)>>>0),T=RACE.terrain||'bon',pc=T==='bon'?[.24,.56]:T==='souple'?[.14,.5]:[.08,.42];
  const x=r(),corde=x<pc[0]?1:x<pc[0]+pc[1]?0:-1,y=r(),vent=y<.22?1:y<.38?-1:0;
  // nervosité plus fréquente chez un cheval peu calme ; départ manqué plus fréquent chez un cheval qui part mal
  const obs=F.rivals.map(rv=>{const st=rv.stats,z=r(),nerv=.08+Math.max(0,60-st.tem)*.006,q=z<nerv?'tire':z<nerv+.17?'forme+':z<nerv+.25?'forme-':null;return{q,slow:r()<.05+Math.max(0,60-st.dep)*.002}});
  return{corde,vent,obs}}
 hooks.on('field:built',F=>{if(!F.cond)F.cond=draw(F)},-10);
 const cond=()=>currentField&&currentField.cond;
 // ---------- au départ : plan de chaque adversaire, départ manqué du joueur (flux propre, dérivé de la graine) ----------
 hooks.on('race:launch',()=>{const C=cond();S.on=!!C&&raceEng>=6;S.said={};S.msgAt=-99;S.me={slow:false};if(!S.on)return;
  const r=S.rng=seeded((raceSeed^0x7f4a7c15)>>>0),P=racePlayer;
  rivalAI.forEach((ai,k)=>{const o=C.obs[k]||{},t=ai.tac,rv=currentField.rivals[k]||{},st=rv.stats||{};ai.q=o.q||null;ai.slow=!!o.slow;
   // jockeys plus fins : le sprint final part plus près du bon moment (erreur réduite, même tirage)
   ai.err*=FX.err;
   // accélération en cours de course : l'animateur pour décramponner, le cheval « dans les dos » pour attaquer avant la ligne droite
   const mv=r()<(FX.moveP[t]||0);ai.mv=mv?{at:t==='leader'?58+r()*12:66+r()*10,len:5+r()*4}:null;
   // riposte quand il se fait doubler dans la ligne droite : cheval calme ou « cœur de champion »
   ai.fightOK=(rv.talent==='coeur'||(st.tem||60)>=58)&&ai.q!=='tire'&&r()<.75;ai.fight=0;ai.fought=false;ai.knows=r()<.5;
   // jockey fin tacticien (plus souvent sur un cheval intelligent) : il reste dans le sillage au lieu de déborder trop tôt
   ai.sits=r()<clampRace(FX.sitP+((st.tac||60)-65)*.015,.1,.9)});
  // départ manqué du joueur : rare avec un bon Départ et un cheval calme (élan jump, nervosité nerve)
  S.me.slow=r()<Math.max(.02,Math.min(.12,.04+Math.max(0,1.03-(P.jump||1))*.6+Math.max(0,P.nerve||0)*.2));
  S.prev=rivalAI.map(()=>false)},-10);
 // rester dans le sillage (comme un bon joueur) plutôt que déborder le cheval qu'on rattrape : seulement s'il ne ralentit pas,
 // tant que le sprint final n'est pas lancé, pas trop longtemps enfermé ; l'animateur, lui, veut la tête
 function sit(k,ahead){if(!on())return false;const ai=rivalAI[k],i=k+1;return ai.sits&&ai.tac!=='leader'&&!ai.final&&!(ai.mv&&ai.mv.on)&&progress[i]<FX.sitUntil&&raceBlocked[i]<FX.sitMax&&speedOf(ahead.j)>=ai.P.cruise*.97}
 // ---------- messages en course : sur la ligne de commentaire (jamais par-dessus la course), le speaker parle ----------
 function say(t,voice){if(typeof replays!=='undefined'&&replays.busy)return;S.msgAt=raceTime;const c=$('#raceComment');if(c)c.textContent=t;if(voice&&raceLoop>0)try{sound.say(voice)}catch(e){}}
 const busyMsg=()=>raceTime-S.msgAt<26;
 // ---------- effets sur l'allure (appelé par paceStep pour chaque cheval) : c vitesse, d dépense, dr sillage ----------
 function step(i,o){let c=1,d=1,dr=1;if(!on())return{c,d,dr};const C=cond(),L=laneOf(i);
  if(C.corde)c*=1+C.corde*FX.corde*clampRace((34-L)/20,0,1);
  if(C.vent&&o.own>FX.vent.from){if(C.vent>0){if(!o.shelter)c*=1-FX.vent.face;dr*=FX.vent.draftFace}else{c*=1+FX.vent.dos;dr*=FX.vent.draftDos}}
  if(i){const ai=rivalAI[i-1];
   if(ai.q==='tire'&&o.own<FX.tire.until){c*=FX.tire.c;d*=FX.tire.d}else if(ai.q==='forme+')c*=1+FX.forme;else if(ai.q==='forme-')c*=1-FX.forme;
   if(ai.slow&&raceTime<=FX.depart.ticks)c*=FX.depart.k;
   const mv=ai.mv;if(mv&&!mv.done&&!o.attacking){if(!mv.on&&o.own>=mv.at){if(o.energy>FX.move.min){mv.on=true;if(!raceFinished[0])say(ai.tac==='leader'?`${raceNames[i]} accélère pour décramponner le peloton !`:`${raceNames[i]} attaque avant la ligne droite !`,`${raceNames[i]} place son accélération !`)}else mv.done=true}
    if(mv.on){if(o.own>=mv.at+mv.len||o.energy<FX.move.stop){mv.on=false;mv.done=true}else{c*=FX.move.c;d*=FX.move.d}}}
   if(ai.fight>0&&o.energy>5){c*=FX.fight.c;d*=FX.fight.d}}
  else if(S.me.slow&&raceTime<=FX.depart.ticks)c*=FX.depart.k;
  return{c,d,dr}}
 // ---------- couloir visé par un adversaire (après sa décision de base, à chaque décision) ----------
 function lane(k){if(!on())return;const ai=rivalAI[k],i=k+1,own=progress[i],L=rivalLanes[k],C=cond(),r=S.rng,curve=courseTurn(Math.min(1,own/100));
  const ahead=progress.map((p,j)=>({j,g:p-own,l:laneOf(j)})).filter(x=>x.j!==i&&!raceFinished[x.j]&&x.g>.4&&x.g<3.2).sort((a,b)=>a.g-b.g)[0];
  // dans les dos : il se cale dans le sillage du cheval qui le précède ; l'attentiste reste abrité jusqu'à la ligne droite, puis déborde
  if(ai.tac==='stalker'&&ahead&&ai.energy>35&&!ai.final)ai.targetLane=clampRace(ahead.l,9,80);
  else if(ai.tac==='finisher'){if(own<74&&ahead)ai.targetLane=clampRace(ahead.l,9,80);else if(own>=74&&ahead&&ahead.g<1.4)ai.targetLane=clampRace(ahead.l+17,9,85)}
  // corde lourde : un jockey qui connaît la piste s'en écarte dans les lignes droites et y revient dans les virages
  if(C.corde<0&&ai.knows&&own<93)ai.targetLane=curve>.1?Math.min(ai.targetLane,14):Math.max(ai.targetLane,28+r()*5);
  // porte fermée : à l'extérieur du cheval du joueur, à sa hauteur, il garde sa ligne au lieu de lui ouvrir le passage
  const me=progress[0];if(!raceFinished[0]&&own>50&&Math.abs(me-own)<1.1&&L>playerLane&&L-playerLane<HORSE_W+5&&raceBlocked[0]>0&&r()<.6)ai.targetLane=L}
 // ---------- après chaque pas : riposte des chevaux doublés, annonces ----------
 function tick(){if(!on())return;const me=progress[0];
  if(raceTime===3){if(S.me.slow)say('Départ manqué ! Ton cheval a hésité dans les stalles\u00a0: reste calme, la course est longue.');else{const k=rivalAI.findIndex(a=>a.slow);if(k>=0)say(`${raceNames[k+1]} manque son départ !`)}}
  if(!S.said.tire&&me>8&&me<30&&!busyMsg()){const k=rivalAI.findIndex(a=>a.q==='tire');if(k>=0){S.said.tire=1;say(`${raceNames[k+1]} tire sur son jockey\u00a0: il va vite… et s’use`)}}
  const C=cond();if(!S.said.vent&&C.vent>0&&me>FX.vent.from&&!raceFinished[0]&&!busyMsg()){S.said.vent=1;say('Vent de face dans la ligne droite\u00a0: reste abrité le plus longtemps possible')}
  for(let k=0;k<5;k++){const i=k+1,ai=rivalAI[k];if(ai.fight>0)ai.fight--;if(raceFinished[i]||raceFinished[0]){S.prev[k]=false;continue}const ahead=progress[i]>me;
   if(S.prev[k]&&!ahead&&me>FX.fight.last&&ai.fightOK&&!ai.fought&&me-progress[i]<HORSE_LEN*1.6&&Math.abs(laneOf(i)-playerLane)<28){ai.fight=FX.fight.ticks;ai.fought=true;say(`${raceNames[i]} ne s’avoue pas vaincu\u00a0: il riposte !`,`${raceNames[i]} riposte !`)}
   S.prev[k]=ahead}}
 // ---------- écran des courses : conditions du jour, rond de présentation ----------
 const Q={tire:['🔥','Nerveux','tire sur son jockey\u00a0: rapide au début, il risque de s’user'],'forme+':['✨','En forme','superbe au rond de présentation'],'forme-':['😓','Terne','transpire, l’œil terne']};
 function texts(C){const corde=C.corde>0?['🧭','Corde rapide','la piste est plus rapide le long de la lice\u00a0: colle à la corde.']:C.corde<0?['🧭','Corde lourde','la lice est creusée\u00a0: écarte-toi de 3 ou 4 couloirs dans les lignes droites, reviens à la corde dans les virages.']:null;
  const vent=C.vent>0?['🌬️','Vent de face dans la ligne droite','qui court à découvert s’use\u00a0: reste dans un sillage le plus longtemps possible, avantage aux attentistes.']:C.vent<0?['🍃','Vent dans le dos dans la ligne droite','les chevaux de tête tiendront mieux\u00a0: ne les laisse pas filer.']:null;
  return{corde,vent}}
 hooks.on('courses:render',()=>{const F=currentField,C=F&&F.cond;if(!C)return;
  $$('#panelBody .runners tr').forEach((tr,i)=>{if(!i)return;const o=C.obs[i-1],td=tr.children[1];if(!o||!o.q||!td)return;const q=Q[o.q],chip=` <span class="tac-chip q-chip q-${o.q.replace('+','p').replace('-','m')}" title="${q[2]}">${q[0]} ${q[1]}</span>`,t=td.querySelector('.tac-chip');if(t)t.insertAdjacentHTML('afterend',chip);else td.insertAdjacentHTML('beforeend',chip)});
  const T=texts(C),seen=C.obs.map((o,k)=>o.q?`<strong>${escapeHTML(F.rivals[k].name)}</strong> ${Q[o.q][0]} ${Q[o.q][2]}`:null).filter(Boolean),
   row=(i,h,t)=>`<p class="cl"><i>${i}</i><span>${h?`<strong>${h}</strong>\u00a0: `:''}${t}</span></p>`,
   lines=[T.corde&&row(...T.corde),T.vent&&row(...T.vent)].filter(Boolean);
  const box=`<div class="pace cond${C.corde||C.vent?' cond-on':''}"><b>CONDITIONS DU JOUR</b>${lines.length?lines.join(''):row('☀️','','Piste régulière, pas de vent\u00a0: la course se jouera sur le rythme.')}${row('👀','Au rond de présentation',seen.length?seen.join(' · '):'rien à signaler.')}<p class="obs-n">Un départ manqué ne se voit qu’à l’ouverture des stalles.</p></div>`;
  const p=$('#panelBody .pace');if(p)p.insertAdjacentHTML('afterend',box);else $('#panelBody .tactics')?.insertAdjacentHTML('beforebegin',box)});
 // en-tête de course : les conditions restent sous les yeux
 hooks.on('race:header',()=>{const C=cond();if(!C||raceEng<6)return;const T=texts(C),s=$('.race-head small');if(s)s.textContent+=[T.corde&&` • ${T.corde[1]}`,T.vent&&` • ${C.vent>0?'Vent de face':'Vent dans le dos'}`].filter(Boolean).join('')});
 // pronostic de l'écran des courses : un cheval superbe au rond de présentation monte, un cheval terne ou nerveux descend (points de note)
 const prono=k=>{const C=currentField&&currentField.cond,o=C&&C.obs[k];return!o||!o.q?0:o.q==='forme+'?2:o.q==='forme-'?-2:-1.5};
 return{step,lane,tick,sit,draw,texts,prono,get busy(){return busyMsg()},get state(){return S}}})();
