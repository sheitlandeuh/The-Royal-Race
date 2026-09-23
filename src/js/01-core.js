const state={gold:85400,feed:42750,gems:320,trophies:1245,building:null,upgrading:false};
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const fmt=n=>n.toLocaleString('fr-FR');
function toast(msg){const t=$('#toast');t.textContent=msg;t.classList.add('show');clearTimeout(t._x);t._x=setTimeout(()=>t.classList.remove('show'),2200)}
function sync(){ $('#gold').textContent=fmt(state.gold);$('#feed').textContent=fmt(state.feed);$('#gems').textContent=fmt(state.gems);$('#trophies').textContent=fmt(state.trophies)}
