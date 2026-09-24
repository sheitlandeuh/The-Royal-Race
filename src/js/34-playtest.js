/* ===== Enregistreur de session de test joueur =====
   Actif seulement avec ?test dans l'adresse (?test=Prénom pour nommer la session). Rien ne quitte l'appareil :
   le journal reste dans ce navigateur (trr.playtest) et l'animateur l'exporte à la fin (copier ou télécharger).
   Il note ce que fait le joueur (courses, décisions, conseils lus, panneaux ouverts, hésitations) et en tire un résumé. */
const playtest=(()=>{const q=new URLSearchParams(location.search);if(!q.has('test'))return{on:false};
 const KEY='trr.playtest',who=q.get('test')||'Joueur',T0=performance.now();let all=[];try{all=JSON.parse(localStorage.getItem(KEY)||'[]')}catch(e){}
 const S={who,start:new Date().toISOString(),ua:navigator.userAgent,screen:`${innerWidth}×${innerHeight}`,ev:[]};all.push(S);
 const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(all))}catch(e){}};
 const now=()=>Math.round(performance.now()-T0);let lastAct=now();
 function log(type,data={}){S.ev.push({t:now(),type,...data});lastAct=now();save()}
 // ce que le moteur annonce
 hooks.on('race:start',()=>log('course',{nom:RACE.n,dist:RACE.dist,cheval:stable.active().name,tactique:state.strategy,rythme:pace.info().label}));
 hooks.on('race:go',(ms,fen)=>log('depart',{reaction:Math.round(ms),fenetre:Math.round(fen)}));
 hooks.on('race:sprint',(rest,ideal)=>log('sprint',{reste:Math.round(rest),ideal:ideal==null?null:Math.round(ideal)}));
 hooks.on('moment',m=>log('temps_fort',m));
 hooks.on('race:end',rank=>log('arrivee',{rang:rank,etoiles:$$('#fbStars .stars i.on').length}));
 hooks.on('race:leave',fini=>{if(!fini)log('abandon',{progression:Math.round(progress[0]||0)})});
 hooks.on('tip',k=>log('conseil',{k}));
 // panneaux ouverts, boutons touchés, hésitations, erreurs
 new MutationObserver(()=>{if($('#panel').classList.contains('open'))log('panneau',{titre:$('#panelTitle').textContent})}).observe($('#panel'),{attributes:true,attributeFilter:['class']});
 document.addEventListener('click',e=>{const b=e.target.closest('button');if(b)log('touche',{bouton:(b.getAttribute('aria-label')||b.textContent||b.id||'').trim().replace(/\s+/g,' ').slice(0,40)})},true);
 setInterval(()=>{if(now()-lastAct>30000&&!document.hidden){log('inactif',{depuis:Math.round((now()-lastAct)/1000)})}},10000);
 addEventListener('error',e=>log('erreur',{msg:String(e.message).slice(0,120)}));
 document.addEventListener('visibilitychange',()=>log(document.hidden?'pause':'retour'));
 // résumé automatique
 function summary(s=S){const E=s.ev,f=t=>E.filter(e=>e.type===t),first=f('course')[0],end=E.length?E[E.length-1].t:0,mm=x=>`${Math.floor(x/60000)} min ${String(Math.round(x/1000)%60).padStart(2,'0')} s`;
  const tf=f('temps_fort'),sp=f('sprint').filter(e=>e.ideal!=null),dep=f('depart');
  return[['Durée de la session',mm(end)],['Avant la 1re course',first?mm(first.t):'jamais lancée'],['Courses lancées / terminées / abandonnées',`${f('course').length} / ${f('arrivee').length} / ${f('abandon').length}`],
   ['Classements',f('arrivee').map(e=>e.rang+(e.rang===1?'er':'e')).join(', ')||'—'],['Réaction moyenne au départ',dep.length?Math.round(dep.reduce((a,e)=>a+e.reaction,0)/dep.length)+' ms':'—'],
   ['Écart moyen au sprint idéal',sp.length?Math.round(sp.reduce((a,e)=>a+Math.abs(e.reste-e.ideal),0)/sp.length)+' m':'—'],
   ['Temps forts : répondus / sans réponse',tf.length?`${tf.filter(e=>!e.auto).length} / ${tf.filter(e=>e.auto).length}`+(tf.some(e=>!e.auto)?` · ${(tf.filter(e=>!e.auto).reduce((a,e)=>a+e.ms,0)/tf.filter(e=>!e.auto).length/1000).toFixed(1)} s pour décider`:''):'—'],
   ['Tactiques choisies',[...new Set(f('course').map(e=>e.tactique))].join(', ')||'—'],['Conseils affichés',f('conseil').length],['Panneaux ouverts',[...new Set(f('panneau').map(e=>e.titre))].join(', ')||'—'],
   ['Moments d’inactivité (> 30 s)',f('inactif').length],['Erreurs',f('erreur').length]]}
 // pastille + fenêtre pour l'animateur
 const pill=document.createElement('button');pill.className='pt-pill';pill.setAttribute('aria-label','Session de test');$('#game').appendChild(pill);
 setInterval(()=>{const s=Math.round(now()/1000);pill.textContent=`● TEST ${who} · ${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`},1000);
 const box=document.createElement('div');box.className='pt-box';box.hidden=true;$('#game').appendChild(box);
 function open(){box.innerHTML=`<section><h3>Session de test — ${escapeHTML(who)}</h3><table>${summary().map(([k,v])=>`<tr><td>${k}</td><td><b>${escapeHTML(String(v))}</b></td></tr>`).join('')}</table>
  <p>${all.length} session(s) enregistrée(s) dans ce navigateur · ${S.ev.length} événements pour celle-ci.</p><div><button data-pt="copy">Copier le journal</button><button data-pt="dl">Télécharger (.json)</button><button data-pt="clear">Tout effacer</button><button data-pt="close">Fermer</button></div></section>`;box.hidden=false}
 pill.onclick=e=>{e.stopPropagation();open()};
 box.addEventListener('click',async e=>{const b=e.target.closest('[data-pt]');if(!b)return;e.stopPropagation();const json=JSON.stringify(all.map(s=>({...s,resume:Object.fromEntries(summary(s))})),null,1);
  if(b.dataset.pt==='copy'){try{await navigator.clipboard.writeText(json);toast('Journal copié')}catch(err){toast('Copie impossible : utilise Télécharger')}}
  if(b.dataset.pt==='dl'){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([json],{type:'application/json'}));a.download=`royal-race-test-${who}-${S.start.slice(0,10)}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),2000)}
  if(b.dataset.pt==='clear'&&confirm('Effacer toutes les sessions de test de ce navigateur ?')){all=[S];S.ev=[];save();open()}
  if(b.dataset.pt==='close')box.hidden=true});
 log('session',{version:'0.15',nouvellePartie:!champion.exists()});
 return{on:true,log,summary}})();
