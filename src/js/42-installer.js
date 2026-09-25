/* ===== Installer le jeu sur l'écran d'accueil (application web) =====
   Proposé une seule fois au bon moment (au retour de la 3e course, quand le joueur a accroché), puis disponible dans les réglages.
   Android / Chrome / Edge : vraie fenêtre d'installation du système. iPhone / iPad (Safari) : la marche à suivre, le système ne proposant pas de bouton.
   Jamais proposé si le jeu est déjà installé. */
const installer=(()=>{const KEY='trr.install';let S={};try{S=JSON.parse(localStorage.getItem(KEY)||'{}')}catch(e){}
 const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){}};
 let deferred=null;const installed=()=>matchMedia('(display-mode: standalone)').matches||matchMedia('(display-mode: fullscreen)').matches||navigator.standalone===true;
 const ios=/iphone|ipad|ipod/i.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
 addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferred=e});
 addEventListener('appinstalled',()=>{S.done=true;save();deferred=null;card.hidden=true;toast('The Royal Race est installé sur ton écran d’accueil')});
 const available=()=>!installed()&&(deferred||ios);
 const card=document.createElement('div');card.className='install-card';card.hidden=true;$('#game').appendChild(card);
 function show(){if(!available())return false;card.innerHTML=`<div class="ic-icon"><img src="assets/icons/icon-192.png" alt=""></div><div class="ic-body"><b>Installe The Royal Race</b><p>${ios?'Touche <b>Partager</b> <span class="ic-share">⬆︎</span> dans Safari, puis <b>« Sur l’écran d’accueil »</b>.':'Plein écran, lancement instantané, jouable même sans connexion.'}</p><div>${ios?'':'<button class="action green" data-in="go">INSTALLER</button>'}<button class="action" data-in="later">${ios?'COMPRIS':'PLUS TARD'}</button></div></div>`;card.hidden=false;return true}
 card.addEventListener('click',async e=>{const b=e.target.closest('[data-in]');if(!b)return;e.stopPropagation();if(b.dataset.in==='go'&&deferred){deferred.prompt();const r=await deferred.userChoice.catch(()=>null);deferred=null;if(r&&r.outcome==='accepted'){S.done=true;save()}}card.hidden=true;S.asked=new Date().toISOString().slice(0,10);save()});
 // au bon moment : retour au domaine après la 3e course terminée
 hooks.on('race:leave',fini=>{if(!fini||S.asked||S.done||(career.data.stats?.races||0)<3)return;setTimeout(()=>{if(!$('#panel').classList.contains('open')&&!coach.open)show()},2200)});
 // aussi dans les réglages
 new MutationObserver(()=>{if(!$('#panel').classList.contains('open')||$('#panelTitle').textContent!=='Réglages'||$('#panelBody .set-install')||!available())return;
  $('#panelBody .set')?.insertAdjacentHTML('afterbegin','<section class="set-install"><h4>APPLICATION</h4><button class="action green" id="installBtn">📲 INSTALLER LE JEU SUR L’ÉCRAN D’ACCUEIL</button></section>');$('#installBtn').onclick=()=>{$('#panel').classList.remove('open');show()}}).observe($('#panel'),{attributes:true,attributeFilter:['class'],subtree:false});
 return{show,get available(){return !!available()},installed}})();
