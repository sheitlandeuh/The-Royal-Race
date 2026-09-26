/* ===== La Couronne : la campagne contre le Comte de Valmont, six Grands Prix jusqu'au Grand Prix de la Couronne =====
   Chaque chapitre est une vraie course (allocation, trophées, fatigue) sur un plateau relevé, avec un objectif : finir devant
   Black Majesty, monter sur le podium, ou gagner. Valmont provoque, Maître Armand conseille. Récompenses : or, gemmes, coffres,
   motifs de casaque exclusifs (Écharpe, Éclair, Damier, Couronne) et, au bout du chemin, un cheval d'exception.
   On retente un chapitre autant qu'on veut (engagement en fourrage). Débloqué après 4 courses. */
const COURONNE=[
 {id:'c1',n:'Le défi du Comte',race:{n:'Prix du Comte',dist:1600,terrain:'bon',diff:1,purse:9000,fee:400},goal:'rival',req:{},reward:{gold:6000,pattern:'echarpe'},
  intro:'« Vous avez de beaux chevaux… pour un débutant. Venez donc mesurer votre champion à Black Majesty, au Prix du Comte. Si vous osez. »',
  armand:'Pas besoin de gagner : finis simplement devant Black Majesty. Regarde sa tactique dans la liste des partants, et ne le laisse pas s’abriter dans ton sillage.',
  after:'« Une course ne fait pas une saison, mon cher. »'},
 {id:'c2',n:'La Poule d’Essai',race:{n:'Poule d’Essai Royale',dist:1600,terrain:'bon',diff:2,purse:12000,fee:500},goal:'top3',req:{},reward:{gold:8000,gems:10},
  intro:'« La Poule d’Essai réunit les meilleurs milers du royaume. Votre place n’y est pas encore… prouvez-moi le contraire. »',
  armand:'Un podium suffit. Lis le rythme avant le départ : sur un mile, la tactique fait la différence.',
  after:'« Troisième, deuxième… le public ne se souvient que du vainqueur. »'},
 {id:'c3',n:'Sous l’orage',race:{n:'Prix de l’Orage',dist:2000,terrain:'lourd',diff:2.5,purse:15000,fee:700},goal:'rival',req:{league:1},reward:{gems:15,pattern:'eclair'},
  intro:'« Il pleut sur le domaine. Black Majesty adore la boue, et vos chevaux de salon la détestent. »',
  armand:'Terrain lourd : l’endurance compte double. Engage un cheval de tenue, des fers à crampons, et garde des forces pour la ligne droite.',
  after:'« La chance… sans doute la chance. »'},
 {id:'c4',n:'Le Jockey-Club',race:{n:'Prix du Jockey-Club Royal',dist:2400,terrain:'bon',amb:'couchant',diff:1,purse:22000,fee:900},goal:'win',req:{league:1,haras:2},reward:{gems:25,chest:'or'},
  intro:'« Le Jockey-Club ! Mon grand-père l’a gagné, mon père l’a gagné, et je le gagnerai. »',
  armand:'2 400 m, la plus longue course du royaume, et cette fois il faut gagner. Un cheval tenace, un jockey économe… et du sang-froid pour sprinter au bon moment.',
  after:'« … Profitez-en. Cela ne se reproduira pas. »'},
 {id:'c5',n:'Le Sprint des Rois',race:{n:'Sprint des Rois',dist:1200,terrain:'bon',diff:2.5,purse:26000,fee:1000},goal:'win',req:{league:2},reward:{gems:30,pattern:'damier'},
  intro:'« Sur 1 200 m, pas de place pour la tactique. Seulement pour la vitesse. Black Majesty en a à revendre. »',
  armand:'Tout se joue au départ : un sprinter, un départ parfait, et aucune hésitation sur les temps forts.',
  after:'« Vous commencez à m’agacer. La Couronne, en revanche, ne vous échappera pas… à moi. »'},
 {id:'c6',n:'La Couronne',race:{n:'Grand Prix de la Couronne',dist:2400,terrain:'souple',amb:'couchant',diff:2,purse:60000,fee:2500},goal:'win',bm:3,req:{league:2,haras:3},reward:{gems:100,pattern:'couronne',horse:true},
  intro:'« Le Grand Prix de la Couronne. Son vainqueur devient le premier éleveur du royaume. Black Majesty n’a jamais été aussi prêt. Et vous ? »',
  armand:'C’est la course de ta vie : terrain souple, 2 400 m, le meilleur Black Majesty qu’on ait jamais vu. Repose ton cheval, choisis ton jockey… et fais-moi honneur.',
  after:'« Le royaume a un nouveau maître… Je vous salue. Mais retenez bien ceci : Black Majesty a un fils. »'}];
const GOALS={rival:'Finir devant Black Majesty',top3:'Finir sur le podium',win:'Gagner la course'};
const couronne=(()=>{const C=career.data;C.couronne=C.couronne||{done:[],tries:{}};const K=C.couronne;C.unlocks=C.unlocks||[];
 const save=()=>{try{localStorage.setItem('trr.progress',JSON.stringify(C))}catch(e){}};
 const idx=()=>COURONNE.findIndex(c=>!K.done.includes(c.id)),cur=()=>COURONNE[idx()]||null,byId=id=>COURONNE.find(c=>c.id===id);
 // conditions d'un chapitre (le précédent doit être réussi)
 function lock(ch){const i=COURONNE.indexOf(ch);if(i>0&&!K.done.includes(COURONNE[i-1].id))return 'Réussis le chapitre précédent';const R=ch.req;
  if(R.league&&career.league()<R.league)return `Ligue ${LEAGUES[R.league].n} requise`;if(R.haras&&dlv('haras')<R.haras)return `Haras niveau ${R.haras} requis`;return null}
 const rtxt=r=>[r.gold?`🪙 ${fmt(r.gold)}`:'',r.gems?`💎 ${r.gems}`:'',r.chest?`${CHESTS[r.chest].ico} coffre ${CHESTS[r.chest].n}`:'',r.pattern?`🎨 motif « ${LIVERY.PATTERNS.find(p=>p[0]===r.pattern)[1]} »`:'',r.horse?'🐎 un cheval d’exception':''].filter(Boolean).join(' · ');
 function meeting(ch){return{id:'cour',keep:true,couronne:ch.id,league:0,...ch.race,n:ch.race.n}}
 function select(id){const ch=byId(id);if(!ch||lock(ch))return false;RACE=meeting(ch);currentField=null;buildField();return true}
 // Black Majesty au sommet de sa forme pour la finale
 hooks.on('field:built',F=>{const ch=RACE.couronne&&byId(RACE.couronne);if(!ch||!ch.bm)return;const r=F.rivals[0];for(const s of STATS)r.stats[s.k]=Math.min(99,r.stats[s.k]+ch.bm);r.rating=ratingOf(r.stats)-7});
 // ---------- écran des courses ----------
 hooks.on('courses:render',()=>{const g=$('#panelBody .meets');if(!g)return;const ch=cur();
  if(RACE.couronne){const c=byId(RACE.couronne),info=g.nextElementSibling;if(info&&info.tagName==='P')info.insertAdjacentHTML('beforeend',` · <b class="cour-goal">👑 Objectif : ${GOALS[c.goal].charAt(0).toLowerCase()+GOALS[c.goal].slice(1)}</b>`);
   const t=$('#panelBody .taunt p');if(t)t.textContent=c.intro;$('#panelBody .taunt')?.insertAdjacentHTML('afterend',`<div class="taunt cour-armand"><div class="tface">🎩</div><div><b>Maître Armand</b><p>${c.armand}</p></div></div>`)}
  if(ch&&!lock(ch))g.insertAdjacentHTML('afterbegin',`<button class="meet cour-meet${RACE.couronne===ch.id?' on':''}" data-cour="${ch.id}"><b>👑 ${ch.n}</b><em class="suit ideal">Chapitre ${idx()+1} / 6</em><small>${fmt(ch.race.dist)} m · ${TERRAINS[ch.race.terrain].n} · ${GOALS[ch.goal]}</small><span>🪙 ${fmt(purseOf(ch.race))}</span></button>`)});
 $('#panelBody').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;
  if(b.dataset.cour){if(select(b.dataset.cour))renderCourses()}
  else if(b.dataset.courGo){if(select(b.dataset.courGo)){$('#panelTitle').textContent='Courses';$('#panel .card').classList.add('wide');renderCourses()}}});
 hooks.on('race:header',()=>{if(RACE.couronne)$('.race-head small').textContent+=` • 👑 ${GOALS[byId(RACE.couronne).goal]}`});
 // ---------- fin de course : objectif atteint ? ----------
 let epilogue=null;
 hooks.on('race:end',rank=>{const ch=RACE.couronne&&byId(RACE.couronne);if(!ch||RACE.defi||RACE.duel)return;K.tries[ch.id]=(K.tries[ch.id]||0)+1;
  const ok=ch.goal==='win'?rank===1:ch.goal==='top3'?rank<=3:finishOrder.indexOf(0)<finishOrder.indexOf(1),first=ok&&!K.done.includes(ch.id);
  if(first){K.done.push(ch.id);const R=ch.reward;state.gold+=R.gold||0;state.gems+=R.gems||0;if(R.chest&&!meta.addChest(R.chest))state.gems+=10;if(R.pattern&&!C.unlocks.includes(R.pattern))C.unlocks.push(R.pattern);
   if(R.horse)stable.addHorse({name:'Couronne d’Or',coat:'palomino',stats:{vit:78,acc:76,end:80,dep:70,tac:76,tem:78},caps:{vit:98,acc:97,end:99,dep:94,tac:97,tem:96},dist:2400,level:12,talent:'coeur',rare:true});
   sync();epilogue=ch;hooks.emit('couronne',ch.id)}save();badge();
  $('#fbGain').insertAdjacentHTML('beforeend',`<div class="cour-res${ok?' ok':''}"><b>👑 ${ch.n} : ${ok?(first?'chapitre réussi !':'objectif atteint'):'objectif manqué'}</b><span>${GOALS[ch.goal]}${ok?'':' · retente ta chance'}</span>${first?`<small>${rtxt(ch.reward)}</small>`:''}</div>`);
  });
 // de retour au domaine : Valmont réagit, et le chapitre suivant s'annonce
 hooks.on('race:leave',()=>{if(!epilogue)return;const ch=epilogue;epilogue=null;setTimeout(()=>scene(ch),900)});
 function scene(ch){const nx=cur(),end=!nx;$('#panelTitle').textContent=end?'La Couronne est à toi !':`${ch.n} : réussi !`;$('#panel .card').classList.remove('wide');
  $('#panelBody').innerHTML=`<div class="cour-scene"><div class="tface big">🎩</div><p class="cour-quote">${ch.after}</p><small>— Le Comte de Valmont</small>
   <p class="hint">Récompense : ${rtxt(ch.reward)}${ch.reward.pattern?' — à choisir dans l’atelier du champion (touche ta casaque).':''}</p>
   ${end?'<p class="hint"><b>Couronne d’Or</b>, un palomino d’exception, rejoint ton écurie. Tu es le premier éleveur du royaume.</p>':`<p class="hint">Prochain chapitre : <b>${nx.n}</b>${lock(nx)?` · 🔒 ${lock(nx)}`:''}</p>`}
   <div class="race-entry"><button class="action green" data-cour-open>${end?'VOIR LA CAMPAGNE':'LA SUITE'}</button></div></div>`;$('#panel').classList.add('open');sound.fanfare()}
 // ---------- écran de la campagne ----------
 function open(){$('#panelTitle').textContent='La Couronne';$('#panel .card').classList.add('wide');const i=idx();
  $('#panelBody').innerHTML=`<p class="hint">Six Grands Prix contre le <b>Comte de Valmont</b> et son Black Majesty, jusqu’au Grand Prix de la Couronne. Chaque chapitre a un objectif ; on le retente autant qu’on veut.</p>
  <div class="cour-path">${COURONNE.map((ch,k)=>{const done=K.done.includes(ch.id),L=!done&&lock(ch),now=k===i;
   return `<article class="cour-ch${done?' done':''}${now?' now':''}${L?' locked':''}"><div class="cour-n">${done?'✓':k+1}</div><div class="cour-body"><b>${ch.n}</b><small>${escapeHTML(ch.race.n)} · ${fmt(ch.race.dist)} m · ${TERRAINS[ch.race.terrain].n} · ${GOALS[ch.goal]}</small>
    ${now?`<p class="cour-quote">${ch.intro}</p><p class="cour-tip">🎩 ${ch.armand}</p>`:''}<span class="cour-rw">${rtxt(ch.reward)}</span>
    ${now?(L?`<span class="dom-lock">🔒 ${L}</span>`:`<button class="action green" data-cour-go="${ch.id}">👑 DISPUTER LE CHAPITRE${K.tries[ch.id]?` · essai ${K.tries[ch.id]+1}`:''}</button>`):done?'<span class="chip">Réussi</span>':''}</div></article>`}).join('')}</div>`;
  $('#panel').classList.add('open')}
 $('#panelBody').addEventListener('click',e=>{if(e.target.closest('[data-cour-open]'))open()});
 // badge du bouton : un chapitre est disponible
 function badge(){const b=$('[data-panel=couronne] .badge');if(!b)return;const ch=cur();b.hidden=!(ch&&!lock(ch));b.textContent='!'}
 // objectif affiché au-dessus du bouton COURIR (35-onboarding)
 function goal(){const ch=cur();if(!ch||lock(ch)||(career.data.stats?.races||0)<4)return null;return[`La Couronne, chapitre ${idx()+1} : ${ch.n}`,'couronne']}
 PANELS.couronne=open;setInterval(badge,5000);hooks.on('ready',badge);
 return{open,select,goal,lock,badge,get done(){return K.done.slice()},get chapter(){return cur()}}})();
