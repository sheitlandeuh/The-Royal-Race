/* ===== Premières minutes : les systèmes se débloquent un par un, un objectif est toujours visible =====
   Un nouveau joueur ne voit d'abord que le domaine et la course. Chaque déblocage est annoncé par Maître Armand.
   Les joueurs déjà avancés (7 courses ou plus) voient tout, comme avant. */
const UNLOCKS=[
 {k:'coffres',at:1,sel:['.homebar .slots'],n:'Coffres',txt:'Chaque podium rapporte un <b>coffre</b>. Touche-le pour lancer son ouverture : plus il est précieux, plus il est long à ouvrir.'},
 {k:'missions',at:1,sel:['[data-panel=missions]'],n:'Missions du jour',txt:'Chaque jour, <b>3 missions</b> rapportent de l’or, du fourrage et des gemmes. Touche le parchemin.'},
 {k:'ecurie',at:2,sel:['.nav[data-view=chevaux]','.nav[data-view=ecurie]'],n:'Écurie et entraînement',txt:'Ton écurie est ouverte : <b>entraîne</b> tes chevaux, soigne-les, répartis leurs points de niveau.'},
 {k:'ligues',at:3,sel:['[data-panel=trophees]','[data-panel=saison]'],n:'Ligues et Route des étoiles',txt:'Tes trophées te font monter de <b>ligue</b> (de nouvelles courses s’ouvrent), tes étoiles de course font avancer la <b>Route des étoiles</b>.'},
 {k:'tournoi',at:5,sel:['.nav[data-view=events]','[data-panel=events]','[data-panel=palmares]'],n:'Tournoi royal',txt:'Chaque jour, un <b>tournoi</b> à élimination directe. Et chaque semaine, un cheval rare à gagner.'},
 {k:'boutique',at:7,sel:['[data-panel=boutique]','.resource .plus','#panelBody h4:has(+ .tack)','#panelBody .tack'],n:'Boutique et sellerie',txt:'La <b>boutique</b> accepte tes gemmes, et la <b>sellerie</b> permet d’équiper ton cheval selon le terrain.'}];
const onboarding=(()=>{const races=()=>career.data.stats?.races||0;
 const style=document.createElement('style');style.textContent=UNLOCKS.map(U=>U.sel.map(s=>`body.lk-${U.k} ${s}`).join(',')+'{display:none!important}').join('\n');document.head.appendChild(style);
 function apply(){const n=races();for(const U of UNLOCKS)document.body.classList.toggle('lk-'+U.k,n<U.at)}
 let pending=[];
 hooks.on('race:end',()=>{const n=races();pending.push(...UNLOCKS.filter(U=>U.at===n))});
 // les annonces attendent le retour au domaine (après la course, le podium et le récapitulatif)
 hooks.on('race:leave',()=>{if(!pending.length)return;const list=pending;pending=[];setTimeout(()=>{apply();list.forEach(U=>coach.tip('unlock-'+U.k,`<b>Nouveau : ${U.n} !</b><br>${U.txt}`,U.sel[0]));buzz([20,30,20]);sound.coin()},700)});
 // objectif suivant, toujours visible au-dessus du bouton COURIR
 const bar=$('.homebar'),goal=document.createElement('button');goal.className='goal';bar.appendChild(goal);
 function next(){const C=career.data,h=stable.active(),n=races(),M=C.missions||[],ready=(C.chests||[]).findIndex(c=>c&&c.ends&&Date.now()>=c.ends);
  if(!n)return['Lance ta première course','courses'];
  if(h.injury||h.fatigue>=90)return[`${h.name} doit se reposer : engage un autre cheval`,'courses'];
  if(ready>=0)return['Ouvre ton coffre','chest:'+ready];
  if(M.some(m=>!m.done&&m.p>=(MISSION_POOL.find(x=>x.k===m.k)||{goal:1}).goal))return['Récupère ta récompense de mission','missions'];
  if(!C.stats.wins)return['Gagne ta première course','courses'];
  const pts=n>=2&&stable.data.horses.find(x=>x.points>0);if(pts)return[`Répartis les points de niveau de ${pts.name}`,'ecurie'];
  if(n>=3){const L=career.league(),nx=LEAGUES[L+1];if(nx)return[`Ligue ${nx.n} : encore ${fmt(Math.max(0,nx.min-state.trophies))} trophées`,'trophees']}
  const R=rival.rec;if(R.w<=R.l)return[`Prends l’avantage sur Black Majesty (${R.w} – ${R.l})`,'courses'];
  return[n>=5?'Remporte le Tournoi royal du jour':'Enchaîne les victoires','courses']}
 function render(){const[t,a]=next();if(goal.dataset.a!==a||goal.textContent!=='🎯 '+t){goal.textContent='🎯 '+t;goal.dataset.a=a}}
 goal.onclick=()=>{const a=goal.dataset.a;if(a.startsWith('chest:'))return bar.querySelectorAll('.slots [data-slot]')[+a.slice(6)]?.click();if(a==='ecurie')return openStable();openPanel(a)};
 // la récompense quotidienne attend la fin de la première course (sinon, rien ne doit détourner du premier départ)
 hooks.on('race:leave',()=>{if(races()>0)setTimeout(()=>meta.login(),1600)});
 apply();render();setInterval(render,1500);hooks.on('race:leave',()=>setTimeout(render,50));
 return{apply,next}})();
