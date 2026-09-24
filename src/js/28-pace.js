/* ===== Rythme de course : la tactique de chaque adversaire est connue avant le départ =====
   Un seul cheval aux avant-postes mène sans être contesté et s'économise ; dès qu'ils sont deux ou plus,
   ils se disputent la tête et s'usent. Lire le plateau et choisir sa tactique en conséquence devient un vrai choix. */
const PACE_FX={
 leader:{base:{c:1.025,d:.944},lent:{d:.75},seul:{d:.75},rapide:{},duel:.2},
 stalker:{base:{},lent:{c:.99},seul:{d:.9},rapide:{}},
 finisher:{base:{s:-.005},lent:{c:.985},seul:{c:.985},rapide:{d:.9}}};
const pace=(()=>{
 const TAC=Object.fromEntries(TACTICS.map(([id,n])=>[id,n])),ICO={leader:'⚡',stalker:'🎯',finisher:'🏁'};
 // la tactique d'un adversaire découle de son profil (départ + vitesse → devant ; accélération → derrière), avec une part de hasard
 function choose(st,R){const w={leader:Math.max(.15,1+(st.dep-60)*.045+(st.vit-st.end)*.025),stalker:Math.max(.15,1.15+(st.tac-60)*.03),finisher:Math.max(.15,1+(st.acc-60)*.045+(st.end-st.vit)*.025)};
  let x=R()*(w.leader+w.stalker+w.finisher);for(const k of['leader','stalker','finisher']){if((x-=w[k])<=0)return k}return'finisher'}
 const rivalLeaders=()=>currentField?currentField.rivals.filter(r=>r.tac==='leader'):[];
 const leaders=(me=state.strategy)=>rivalLeaders().length+(me==='leader'?1:0);
 // effet du rythme sur chaque tactique (c : vitesse en début de course, d : dépense d'énergie en début de course, s : puissance du sprint)
 // n = nombre de chevaux aux avant-postes (joueur compris). Réglé au bot : la bonne tactique dépend du plateau.
 function fx(tac,me=state.strategy){const n=leaders(me),F=PACE_FX[tac],k=n===0?'lent':n===1?'seul':'rapide',B=F.base,K=F[k],o={c:(B.c||1)*(K.c||1),d:(B.d||1)*(K.d||1),s:(B.s||0)+(K.s||0)};if(tac==='leader'&&n>=2)o.d*=1+F.duel*(n-1);return o}
 function adjust(P,tac,me){const f=fx(tac,me);return{...P,sprint:P.sprint+f.s,tactic:{...P.tactic,c:P.tactic.c*f.c,d:P.tactic.d*f.d}}}
 const mul=(tac,me)=>fx(tac,me).d;
 function info(){const R=rivalLeaders(),me=state.strategy==='leader',n=R.length+(me?1:0),names=R.map(r=>escapeHTML(r.name)).join(', ');
  const k=n===0?'lent':n===1?'seul':n===2?'duel':'rapide',label={lent:'Lent',seul:'Tranquille',duel:'Disputé',rapide:'Rapide'}[k];
  const txt=n===0?'Personne ne veut mener : un cheval aux avant-postes aurait le champ libre, et les attentistes auraient du mal à refaire leur retard.'
   :n===1&&me?`Tu seras seul en tête : ton cheval mène sans être contesté et dépense ${Math.round((1-mul('leader'))*100)} % d’énergie en moins en début de course.`
   :n===1?`Un seul animateur, ${names} : il aura le champ libre. Le suivre « dans les dos », dans son sillage, est idéal ; le rejoindre en tête lancerait un duel.`
   :`${n} chevaux${me?', toi compris,':''} vont se disputer la tête${R.length&&!me?` (${names})`:''} : ils dépenseront ${Math.round((mul('leader')-1)*100)} % d’énergie en plus en début de course. Avantage aux attentistes.`;
  return{k,label,txt,n}}
 const chip=t=>t?`<span class="tac-chip t-${t}">${ICO[t]} ${TAC[t]}</span>`:'';
 return{choose,mul,fx,adjust,info,chip,leaders}})();
/* le plateau reçoit ses tactiques dès sa création (flux dérivé de la graine : même plateau = mêmes tactiques) */
{const b0=buildField;buildField=function(fixed){const F=b0(fixed),R=seeded((F.seed^0x9e3779b9)>>>0);F.rivals.forEach(r=>{r.tac=pace.choose(r.stats,R)});return F}}
/* en course, les adversaires suivent la tactique annoncée, et le rythme modifie l'effort des animateurs */
{const i0=initRivalAI;initRivalAI=function(){i0();const F=currentField;rivalAI.forEach((ai,i)=>{const r=F&&F.rivals[i];if(r&&r.tac&&ai.tac!==r.tac){const P=terrainPerf(stable.racePerf(r.stats,{form:61,fatigue:10,moral:65},RACE.dist,r.pref,r.tac),r.stats,r.talent);const off=t=>t==='leader'?-.06:t==='finisher'?.04:0;ai.err=(ai.err||0)-off(ai.tac)+off(r.tac);ai.P=P;ai.speed=P.cruise;ai.tac=r.tac}
  ai.P=pace.adjust(ai.P,ai.tac)})}}
{const s0=startRace;startRace=function(){const before=racePlayer;s0.apply(this,arguments);if(racePlayer&&racePlayer!==before)racePlayer=pace.adjust(racePlayer,state.strategy)}}
/* écran des courses : tactique de chaque partant + rythme prévu */
{const r0=renderCourses;renderCourses=function(){r0.apply(this,arguments);const F=currentField;if(!F)return;
  $$('#panelBody .runners tr').forEach((tr,i)=>{const td=tr.children[1];if(td)td.insertAdjacentHTML('beforeend',' '+pace.chip(i?F.rivals[i-1].tac:state.strategy))});
  const I=pace.info(),box=`<div class="pace pace-${I.k}"><b>RYTHME PRÉVU : ${I.label.toUpperCase()}</b><p>${I.txt}</p></div>`;$('#panelBody .tactics')?.insertAdjacentHTML('beforebegin',box);
  if($('#panelBody .pace'))coach.tip('pace','Regarde la <b>tactique des adversaires</b> : s’ils sont plusieurs à vouloir mener, la course sera rapide et ils s’useront. Choisis ta tactique en conséquence.','#panelBody .pace')}}
