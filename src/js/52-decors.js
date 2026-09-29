/* ===== Décors du domaine : embellissements achetés à la Boutique royale (or ou gemmes), visibles dans le domaine en 3D =====
   Purement décoratifs (jamais de vitesse à vendre). Enregistrés dans career.data.deco.owned ; 51-domaine3d les construit. */
const DECORS = [
  { id: 'lanternes', i: '🏮', n: 'Allée des lanternes', d: 'Des lanternes le long des allées, allumées le soir.', gold: 8000 },
  { id: 'roseraie', i: '🌹', n: 'Roseraie royale', d: 'Arches de roses et massifs fleuris sur la pelouse ouest.', gold: 12000 },
  { id: 'cygnes', i: '🦢', n: 'Étang aux cygnes', d: 'Un étang et trois cygnes qui y glissent.', gold: 15000 },
  { id: 'kiosque', i: '🎼', n: 'Kiosque à musique', d: 'Kiosque octogonal bleu roi et or sur la pelouse est.', gold: 18000 },
  { id: 'statue', i: '🐎', n: 'Statue équestre dorée', d: 'Un cheval cabré, tout en or, sur son socle.', gold: 25000 },
  { id: 'obelisque', i: '🗿', n: 'Obélisque des Légendes', d: 'Un obélisque à pointe dorée devant le haras.', gems: 40 },
  { id: 'arc', i: '🏛️', n: 'Arc de triomphe royal', d: 'L’entrée de l’avenue, digne d’un roi.', gems: 60 }];
const decors = (() => {
  const C = career.data; C.deco = C.deco || { owned: [] }; const D = C.deco;
  const save = () => { try { localStorage.setItem('trr.progress', JSON.stringify(C)) } catch (e) { } };
  const has = id => D.owned.includes(id), price = d => d.gems ? `💎 ${d.gems}` : `🪙 ${fmt(d.gold)}`;
  function buy(id) {
    const d = DECORS.find(x => x.id === id); if (!d || has(id)) return;
    if (d.gems ? state.gems < d.gems : state.gold < d.gold) return toast(d.gems ? `Il te manque ${d.gems - state.gems} 💎` : `Il te manque ${fmt(d.gold - state.gold)} or`);
    if (d.gems) state.gems -= d.gems; else state.gold -= d.gold; D.owned.push(id); save(); sync(); try { sound.coin(); buzz(20) } catch (e) { }
    toast(`${d.i} ${d.n} installé au domaine`); hooks.emit('deco', id); render()
  }
  // section ajoutée à la Boutique royale
  function section() {
    return `<h4 class="shop-h">DÉCORS DU DOMAINE <small>visibles dans le domaine en 3D</small></h4><div class="wares">${DECORS.map(d => `<article class="ware${has(d.id) ? ' done' : ''}"><i>${d.i}</i><b>${d.n}</b><small>${d.d}</small><button class="action green" data-deco="${d.id}" ${has(d.id) ? 'disabled' : ''}>${has(d.id) ? 'INSTALLÉ' : price(d)}</button></article>`).join('')}</div>`
  }
  function render() { const b = $('#panelBody'); if ($('#panelTitle').textContent !== 'Boutique royale') return; b.querySelector('.deco-sec')?.remove(); const top = b.querySelector('.wares.top'), html = `<div class="deco-sec">${section()}</div>`; top ? top.insertAdjacentHTML('afterend', html) : b.insertAdjacentHTML('beforeend', html) }
  hooks.on('shop:render', render);
  $('#panelBody').addEventListener('click', e => { const b = e.target.closest('[data-deco]'); if (b) buy(b.dataset.deco) });
  return { buy, has, get owned() { return D.owned.slice() } }
})();
