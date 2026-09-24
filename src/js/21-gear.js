/* ===== Sellerie : équipement choisi avant chaque course (fers, œillères, selle) — des choix simples, lisibles, liés au terrain ===== */
const GEAR=[
 {id:'std',n:'Fers standard',i:'🧲',price:0,d:'Neutres : aucun bonus, aucun défaut.',fit:()=>0},
 {id:'alu',n:'Fers aluminium',i:'⚡',price:4000,d:'Terrain bon : plus rapide. Souple ou lourd : s’épuise plus vite.',fit:m=>m.terrain==='bon'?1:-1},
 {id:'crampons',n:'Fers à crampons',i:'⛰️',price:4000,d:'Souple ou lourd : −7 % d’usure d’énergie. Terrain bon : un peu plus lent.',fit:m=>m.terrain==='bon'?-1:1},
 {id:'oeilleres',n:'Œillères',i:'🎯',price:6000,d:'Départ plus facile, course régulière, moins gêné dans le peloton. Sprint −2 %.',fit:()=>0},
 {id:'selle',n:'Selle de course légère',i:'🪶',price:15000,league:1,d:'+ accélération au sprint final (+6 %). Le sprint coûte un peu plus d’énergie.',fit:m=>m.dist<=1600?1:0}];
const gear=(()=>{const C=career.data;C.gear=C.gear||{owned:['std'],sel:'std'};const G=C.gear;
 const save=()=>{try{localStorage.setItem('trr.progress',JSON.stringify(C))}catch(e){}};
 const byId=id=>GEAR.find(g=>g.id===id)||GEAR[0];
 function apply(P){const g=G.sel,o={...P},wet=RACE.terrain!=='bon';
  if(g==='alu'){if(wet)o.drain*=1.06;else o.cruise*=1.005}
  if(g==='crampons'){if(wet)o.drain*=.93;else o.cruise*=.996}
  if(g==='oeilleres'){o.window+=45;o.noise*=.55;o.boxed+=.03;o.sprint*=.98}
  if(g==='selle'){o.sprint*=1.06;o.sprintDrain*=1.03}
  return o}
 function pick(id){const g=byId(id);if(G.owned.includes(id)){G.sel=id;save();return true}
  if(g.league&&career.league()<g.league)return toast(`${g.n} : disponible en ligue ${LEAGUES[g.league].n}`),false;
  if(state.gold<g.price)return toast('Or insuffisant'),false;state.gold-=g.price;G.owned.push(id);G.sel=id;save();sync();sound.coin();toast(`${g.n} acheté et équipé !`);palmares.check();return true}
 // bloc affiché dans l'écran d'engagement
 function block(m=RACE){return `<h4 style="margin-top:14px">ÉQUIPEMENT <em>${byId(G.sel).i} ${byId(G.sel).n}</em></h4><div class="tack">${GEAR.map(g=>{const own=G.owned.includes(g.id),f=g.fit(m),lock=g.league&&career.league()<g.league;
  return `<button data-gear="${g.id}" class="${G.sel===g.id?'on':''}${lock?' locked':''}" title="${g.d}"><i>${g.i}</i><b>${g.n}</b><small>${g.d}</small>${f>0?'<em class="suit ideal">✓ Conseillé ici</em>':f<0?'<em class="suit risk">⚠ Déconseillé ici</em>':''}${own?'':`<span class="price">${lock?'🔒 Ligue '+LEAGUES[g.league].n:'🪙 '+fmt(g.price)}</span>`}</button>`}).join('')}</div>`}
 $('#panelBody').addEventListener('click',e=>{const b=e.target.closest('[data-gear]');if(!b)return;if(pick(b.dataset.gear))renderCourses()});
 return{apply,block,get sel(){return byId(G.sel)},get owned(){return G.owned}}})();
