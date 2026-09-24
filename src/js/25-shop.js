/* ===== Boutique royale : on échange les gemmes gagnées en jeu contre de l'or, du fourrage, des coffres, des élixirs.
   Un cadeau gratuit par jour et une offre du jour à prix réduit donnent une raison de passer chaque jour. Aucun achat réel. ===== */
const shop=(()=>{const C=career.data;C.shop=C.shop||{day:'',gift:false,deal:false};const S=C.shop;
 const save=()=>{try{localStorage.setItem('trr.progress',JSON.stringify(C))}catch(e){}};
 const day=()=>new Date().toISOString().slice(0,10),k=()=>1+career.league()*.5,r50=n=>Math.round(n/50)*50;
 function roll(){if(S.day!==day()){S.day=day();S.gift=false;S.deal=false;save()}}
 const items=()=>[
  {id:'gold1',i:'🪙',n:'Bourse d’or',got:{gold:r50(9000*k())},cost:15},{id:'gold2',i:'💰',n:'Coffre-fort',got:{gold:r50(32000*k())},cost:45},
  {id:'feed1',i:'🌾',n:'Charrette de fourrage',got:{feed:r50(7000*k())},cost:12},{id:'feed2',i:'🚜',n:'Grange pleine',got:{feed:r50(25000*k())},cost:36},
  {id:'elixir',i:'🧪',n:'Élixir d’XP',got:{elixir:1},cost:12},{id:'chestOr',i:'💰',n:'Coffre d’or',got:{chest:'or'},cost:30},{id:'chestRoyal',i:'👑',n:'Coffre royal',got:{chest:'royal'},cost:80}];
 // offre du jour : un article tiré au sort, −40 %
 function deal(){const L=items();let x=[...day()].reduce((a,c)=>a*31+c.charCodeAt(0),5)%2147483647;x=(x*16807)%2147483647;const it=L[x%L.length];return{...it,id:'deal',n:it.n+' · offre du jour',cost:Math.max(1,Math.round(it.cost*.6)),was:it.cost}}
 const gift=()=>({gold:r50(1200*k()),feed:r50(900*k())});
 const txt=g=>[g.gold?`🪙 ${fmt(g.gold)}`:'',g.feed?`🌾 ${fmt(g.feed)}`:'',g.gems?`💎 ${g.gems}`:'',g.elixir?`🧪 ${g.elixir} élixir`:'',g.chest?`${CHESTS[g.chest].ico} coffre ${CHESTS[g.chest].n}`:''].filter(Boolean).join(' · ');
 function give(g){if(g.chest&&!meta.addChest(g.chest)){toast('Tes 4 emplacements de coffres sont pleins');return false}state.gold+=g.gold||0;state.feed+=g.feed||0;state.gems+=g.gems||0;if(g.elixir)C.elixirs=(C.elixirs||0)+g.elixir;save();sync();sound.coin();buzz(20);return true}
 function buy(id){roll();if(id==='gift'){if(S.gift)return;if(give(gift())){S.gift=true;save();toast('Cadeau du jour récupéré !')}return open()}
  const it=id==='deal'?deal():items().find(x=>x.id===id);if(!it)return;if(id==='deal'&&S.deal)return;if(state.gems<it.cost)return toast(`Il te manque ${it.cost-state.gems} 💎 — gagne-en avec les succès, missions et coffres`);
  state.gems-=it.cost;if(!give(it.got)){state.gems+=it.cost;sync();return}if(id==='deal'){S.deal=true;save()}toast(`${it.n} : ${txt(it.got)}`);open()}
 function card(it,done){return `<article class="ware${it.id==='deal'?' deal':''}"><i>${it.i}</i><b>${it.n}</b><small>${txt(it.got)}</small><button class="action green" data-ware="${it.id}" ${done?'disabled':''}>${done?'ACHETÉ':`${it.was?`<s>💎 ${it.was}</s> `:''}💎 ${it.cost}`}</button></article>`}
 function open(focus){roll();$('#panelTitle').textContent='Boutique royale';$('#panel .card').classList.add('wide');const g=gift(),left=new Date();left.setHours(24,0,0,0);const h=Math.ceil((left-new Date())/36e5);
  $('#panelBody').innerHTML=`<p class="hint">Tu as <b>💎 ${fmt(state.gems)}</b>. Les gemmes se gagnent en jouant : succès, missions, coffres, Route des étoiles, tournoi. Nouvelles offres dans ${h} h.</p>
  <div class="wares top"><article class="ware gift${S.gift?' done':''}"><i>🎁</i><b>Cadeau du jour</b><small>${txt(g)}</small><button class="action green" data-ware="gift" ${S.gift?'disabled':''}>${S.gift?'REVIENS DEMAIN':'GRATUIT'}</button></article>${card(deal(),S.deal)}</div>
  <h4 class="shop-h">OR & FOURRAGE</h4><div class="wares">${items().filter(x=>x.got.gold||x.got.feed).map(x=>card(x)).join('')}</div>
  <h4 class="shop-h">COFFRES & ÉLIXIRS</h4><div class="wares">${items().filter(x=>!x.got.gold&&!x.got.feed).map(x=>card(x)).join('')}</div>`;
  $('#panel').classList.add('open');if(focus){const el=$(`#panelBody [data-ware=${focus}]`);el?.closest('.ware')?.scrollIntoView({block:'center'})}badge()}
 function badge(){roll();const b=$('[data-panel=boutique] .badge');if(b){b.hidden=S.gift;b.textContent='1'}}
 $('#panelBody').addEventListener('click',e=>{const b=e.target.closest('[data-ware]');if(b)buy(b.dataset.ware)});
 $$('[data-buy]').forEach(b=>b.onclick=e=>{e.stopPropagation();open({Or:'gold1',Fourrage:'feed1',Gemmes:null}[b.dataset.buy])});
 badge();return{open,badge}})();
