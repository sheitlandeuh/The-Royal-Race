/* ===== Route des étoiles : pass de saison gratuit (28 jours), alimenté par les étoiles gagnées en course ===== */
const SEASON_TIERS=Array.from({length:20},(_,i)=>{const t=i+1;return t===20?{pattern:'soleil',label:'Motif « Soleil royal »'}:t%5===0?{chest:t===15?'royal':'or'}:t%4===0?{elixir:1}:t%3===0?{gems:5+t}:t%2===0?{feed:1500+t*150}:{gold:2000+t*250}});
const season=(()=>{const C=career.data,sid=()=>Math.floor(Date.now()/864e5/28),left=()=>{const e=(sid()+1)*28*864e5;return Math.ceil((e-Date.now())/864e5)};
 if(!C.season||C.season.id!==sid())C.season={id:sid(),stars:0,claimed:[]};C.unlocks=C.unlocks||[];const S=C.season,PER=3;
 const save=()=>{try{localStorage.setItem('trr.progress',JSON.stringify(C))}catch(e){}};
 const tier=()=>Math.min(20,Math.floor(S.stars/PER));
 const rtxt=r=>r.pattern?'🎨 '+r.label:r.chest?`${CHESTS[r.chest].ico} Coffre ${CHESTS[r.chest].n}`:r.elixir?'🧪 Élixir':r.gems?`💎 ${r.gems}`:r.feed?`🌾 ${fmt(r.feed)}`:`🪙 ${fmt(r.gold)}`;
 function add(n){if(!n)return;const before=tier();S.stars+=n;save();badge();if(tier()>before)toast(`Route des étoiles : palier ${tier()} atteint !`)}
 function claim(t){if(S.claimed.includes(t)||tier()<t)return;const r=SEASON_TIERS[t-1];if(r.chest&&!meta.addChest(r.chest))return toast('Libère un emplacement de coffre d’abord');
  S.claimed.push(t);state.gold+=r.gold||0;state.feed+=r.feed||0;state.gems+=r.gems||0;if(r.elixir)career.data.elixirs=(career.data.elixirs||0)+r.elixir;if(r.pattern&&!C.unlocks.includes(r.pattern)){C.unlocks.push(r.pattern);toast('Nouveau motif de casaque débloqué : Soleil royal !')}save();sync();sound.coin();open()}
 function badge(){const b=$('[data-panel=saison] .badge'),n=Array.from({length:tier()},(_,i)=>i+1).filter(t=>!S.claimed.includes(t)).length;if(b){b.textContent=n;b.hidden=!n}}
 function open(){$('#panelTitle').textContent='Route des étoiles';$('#panel .card').classList.add('wide');const t=tier(),into=S.stars%PER;
  $('#panelBody').innerHTML=`<p class="hint">Chaque course rapporte jusqu’à <b>3 ★</b> (départ, placement, sprint). ${PER} ★ = 1 palier. Saison : encore <b>${left()} jours</b>.</p>
  <div class="season-head"><b>${S.stars} ★</b><div class="bar"><i style="width:${t>=20?100:into/PER*100}%"></i></div><small>${t>=20?'Route terminée !':`Palier ${t+1} dans ${PER-into} ★`}</small></div>
  <div class="season">${SEASON_TIERS.map((r,i)=>{const n=i+1,got=S.claimed.includes(n),ok=t>=n;return `<div class="tier${ok?' ok':''}${got?' got':''}${r.pattern?' big':''}"><small>${n}</small><span>${rtxt(r)}</span>${got?'<em>✓</em>':ok?`<button class="action green" data-tier="${n}">PRENDRE</button>`:`<em>${n*PER} ★</em>`}</div>`}).join('')}</div>`;
  $('#panel').classList.add('open');const cur=$('.tier.ok:not(.got)')||$('.tier:not(.ok)');cur?.scrollIntoView({inline:'center',block:'nearest'})}
 $('#panelBody').addEventListener('click',e=>{const b=e.target.closest('[data-tier]');if(b)claim(+b.dataset.tier)});
 badge();return{add,open,badge,unlocked:p=>C.unlocks.includes(p)}})();
