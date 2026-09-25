/* ===== Le speaker de l'hippodrome : commentaire en direct aux points clés, puis la leçon de rythme à l'arrivée =====
   Le texte varie (hasard d'affichage uniquement : Math.random ne touche jamais la simulation). Voix si « Speaker » est activé. */
const speaker=(()=>{const el=document.createElement('div');el.className='speaker';$('#raceScreen').appendChild(el);
 let said={},hideT=0;const pick=a=>a[Math.floor(Math.random()*a.length)],me=()=>escapeHTML(HN()),N=i=>i===0?me():escapeHTML(raceNames[i]);
 const order=()=>progress.map((p,i)=>({p,i})).sort((a,b)=>b.p-a.p),rank=()=>order().findIndex(x=>x.i===0)+1;
 const lengths=(a,b)=>{const g=Math.abs(progress[a]-progress[b])*RACE.dist/100/2.4;return g<.4?'une tête':g<1?'une encolure':g<1.5?'une longueur':`${Math.round(g*2)/2} longueurs`.replace('.5',' ½')};
 const de=g=>/^[aeiouéèêh]/i.test(g)?'d’'+g:'de '+g;
 const pos=n=>n===1?'en tête':`${n}${n===1?'er':'e'}`;
 function show(html,voice){el.innerHTML=`<i>🎙️</i> ${html}`;el.classList.add('show');clearTimeout(hideT);hideT=setTimeout(()=>el.classList.remove('show'),4200);if(voice)sound.say(voice)}
 function call(k){const O=order(),L=O[0].i,S=O[1].i,n=rank(),youLead=L===0,gapL=youLead?lengths(0,S):lengths(0,L);
  if(k==='q1'){const t=pace.info().k,ry=t==='rapide'||t==='duel'?' sur un rythme soutenu':t==='lent'?' sans forcer l’allure':'';show(youLead?pick([`${me()} emmène le peloton${ry}, avec ${gapL} d’avance.`,`Premier tournant : ${me()} en tête, ${gapL} devant ${N(S)}.`]):pick([`${N(L)} emmène le peloton${ry}. ${me()} ${pos(n)}, à ${gapL}.`,`Premier tournant : ${N(L)} en tête, ${me()} ${pos(n)} à ${gapL}.`]),youLead?`${HN()} mène !`:null)}
  if(k==='q2')show(youLead?pick([`Mi-course : ${me()} mène ${de(gapL)} devant ${N(S)}.`,`À mi-parcours, ${me()} est toujours devant !`]):pick([`Mi-course : ${N(L)} devant ${N(S)}. ${me()} ${pos(n)}, à ${gapL} de la tête.`,`À mi-parcours, ${N(L)} contrôle. ${me()} ${pos(n)}.`]));
  if(k==='q3')show(youLead?`Entrée de la ligne droite : ${me()} en tête, ${N(S)} à ${gapL} !`:`Entrée de la ligne droite ! ${N(L)} en tête, ${me()} ${pos(n)} à ${gapL}.`,youLead?null:'Dernière ligne droite !');
  if(k==='f200'){const close=Math.abs(progress[L]-progress[S])*RACE.dist/100<4;show(close?`Plus que 200 m : ${N(L)} et ${N(S)} au coude à coude !`:`Plus que 200 m ! ${youLead?me():N(L)} file vers la victoire…`,close?'Au coude à coude !':null)}}
 let tacs=[];hooks.on('race:start',()=>{said={};el.classList.remove('show');tacs=(currentField?currentField.rivals:[]).map(r=>({name:r.name,tac:r.tac}))});
 hooks.on('race:tick',()=>{if(raceFinished[0])return;const p=progress[0];for(const[k,at]of[['q1',22],['q2',50],['q3',74]])if(p>=at&&!said[k]){said[k]=1;call(k)}if(remainingM(p)<=200&&!said.f200){said.f200=1;call('f200')}});
 // leçon de rythme : ce que la course a révélé sur la tactique des animateurs
 hooks.on('race:end',()=>{const lead=tacs.map((r,i)=>({r,i:i+1})).filter(x=>x.r.tac==='leader'),meLead=state.strategy==='leader',n=lead.length+(meLead?1:0);
  const place=i=>finishOrder.indexOf(i)+1,best=[...lead.map(x=>place(x.i)),...(meLead?[place(0)]:[])],top=Math.min(...best);let t='';
  if(n===0)t='Personne n’a voulu mener : la course est restée lente, les attentistes ont eu du mal à refaire leur retard.';
  else if(n===1)t=meLead?`Tu as mené sans être contesté : ${top<=2?'tu as tenu jusqu’au bout.':`tu as pourtant fini ${top}e.`}`:`Un seul animateur, ${escapeHTML(lead[0].r.name)}, a mené sans être contesté : ${top<=2?'il a tenu jusqu’au bout.':`il a pourtant fini ${top}e.`}`;
  else t=`${n} chevaux se sont disputé la tête${meLead?', toi compris':''} : le meilleur d’entre eux a fini ${top}${top===1?'er':'e'}. ${top>=3?'Le rythme rapide a profité aux chevaux venus de l’arrière.':'Il a malgré tout résisté.'}`;
  $('#fbStars').insertAdjacentHTML('beforeend',`<div class="pace-lesson"><b>🎙️ Le rythme de la course</b><span>${t}</span></div>`)});
 return{show}})();
