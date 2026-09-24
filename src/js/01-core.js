const state={gold:6000,feed:4000,gems:40,trophies:0,building:null,upgrading:false};
/* sauvegarde corrompue ? on restaure la dernière copie de secours (trr.bak) avant que les modules ne la lisent */
(()=>{try{const bak=JSON.parse(localStorage.getItem('trr.bak')||'null');for(const k of['trr.stable','trr.progress','trr.champion']){const v=localStorage.getItem(k);if(v==null)continue;try{JSON.parse(v)}catch(e){if(bak&&bak.k&&bak.k[k]){localStorage.setItem(k,bak.k[k]);window.__restored=true}else localStorage.removeItem(k)}}}catch(e){}})();
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const fmt=n=>n.toLocaleString('fr-FR');
function toast(msg){const t=$('#toast');t.textContent=msg;t.classList.add('show');clearTimeout(t._x);t._x=setTimeout(()=>t.classList.remove('show'),2200)}
function sync(){ $('#gold').textContent=fmt(state.gold);$('#feed').textContent=fmt(state.feed);$('#gems').textContent=fmt(state.gems);$('#trophies').textContent=fmt(state.trophies)}
