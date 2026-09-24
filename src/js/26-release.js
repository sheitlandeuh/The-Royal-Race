/* ===== Solidité avant sortie : ressources toujours enregistrées, copie de secours, export/import de partie,
   erreurs attrapées proprement, perte du contexte 3D gérée, installation hors ligne (PWA) ===== */
const KEYS=['trr.stable','trr.progress','trr.champion','trr.settings'];
// 1) toute modification d'or / fourrage / gemmes / trophées est enregistrée (avant : seulement lors d'une action d'écurie)
{const s4=sync;sync=function(){s4();clearTimeout(sync._t);sync._t=setTimeout(()=>{try{stable.save()}catch(e){}},250)}}
// 2) copie de secours de toute la partie (toutes les minutes et à la fermeture de l'onglet)
const backup=()=>{if(window.__noSave)return;try{stable.save();const k={};KEYS.forEach(x=>{const v=localStorage.getItem(x);if(v!=null)k[x]=v});localStorage.setItem('trr.bak',JSON.stringify({t:Date.now(),k}))}catch(e){}};
setInterval(backup,60e3);addEventListener('pagehide',backup);document.addEventListener('visibilitychange',()=>{if(document.hidden)backup()});
if(window.__restored)setTimeout(()=>toast('Sauvegarde abîmée : ta dernière copie de secours a été restaurée'),1500);
// 3) export / import (changement d'appareil, sécurité avant de vider le navigateur)
const saveCode={export(){backup();const k={};KEYS.forEach(x=>{const v=localStorage.getItem(x);if(v!=null)k[x]=v});return 'TRR1.'+btoa(unescape(encodeURIComponent(JSON.stringify({v:1,t:Date.now(),k}))))},
 import(code){try{const o=JSON.parse(decodeURIComponent(escape(atob(String(code).trim().replace(/^TRR1\./,'')))));const st=JSON.parse(o.k['trr.stable']);if(!st||!Array.isArray(st.horses)||!st.horses.length)throw 0;
  backup();localStorage.setItem('trr.bak.avant-import',localStorage.getItem('trr.bak')||'');window.__noSave=true;Object.entries(o.k).forEach(([x,v])=>{if(KEYS.includes(x))localStorage.setItem(x,v)});return true}catch(e){return false}}};
function openSaveTools(){$('#panelTitle').textContent='Transférer ma partie';$('#panel .card').classList.remove('wide');const code=saveCode.export();
 $('#panelBody').innerHTML=`<p class="hint">Copie ce code et garde-le précieusement : il contient toute ta partie (chevaux, ressources, progression). Colle-le sur un autre appareil pour continuer.</p>
 <textarea class="savecode" readonly>${code}</textarea><div class="race-entry"><button class="action green" id="copySave">COPIER LE CODE</button></div>
 <h4 style="margin-top:16px">IMPORTER UNE PARTIE</h4><textarea class="savecode" id="importCode" placeholder="Colle ici un code TRR1…"></textarea><div class="race-entry"><button class="action" id="doImport">IMPORTER (remplace la partie actuelle)</button></div>`;$('#panel').classList.add('open')}
$('#panelBody').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;
 if(b.id==='saveTools')openSaveTools();
 else if(b.id==='copySave'){const t=$('.savecode');t.select();(navigator.clipboard?navigator.clipboard.writeText(t.value):Promise.reject()).then(()=>toast('Code copié'),()=>{document.execCommand?.('copy');toast('Code sélectionné : copie-le')})}
 else if(b.id==='doImport'){if(!b.dataset.armed){b.dataset.armed=1;b.textContent='CONFIRMER : la partie actuelle sera remplacée';return}if(saveCode.import($('#importCode').value)){toast('Partie importée !');setTimeout(()=>location.reload(),600)}else{toast('Code invalide');delete b.dataset.armed;b.textContent='IMPORTER (remplace la partie actuelle)'}}});
// 4) erreurs : message clair plutôt qu'un jeu bloqué sans explication
{let last=0;const oops=m=>{console.error(m);const now=Date.now();if(now-last<8000)return;last=now;toast('Petit souci technique : si le jeu se bloque, recharge la page (ta partie est sauvegardée)')};
 addEventListener('error',e=>{if(e.filename&&!/index\.html|^$/.test(e.filename.split('/').pop()||''))return;oops(e.message)});addEventListener('unhandledrejection',e=>oops(e.reason))}
// 5) le téléphone reprend la mémoire graphique (appel, changement d'appli…) : on annule proprement la course et on rembourse
$('#race3d')?.addEventListener('webglcontextlost',e=>{e.preventDefault();if($('#raceScreen').classList.contains('open')&&!finishOrder.length){state.feed+=RACE.fee||0;sync();leaveRace();toast('Affichage 3D interrompu : course annulée, engagement remboursé')}});
$('#race3d')?.addEventListener('webglcontextrestored',()=>{try{threeRace&&threeRace.renderer.setSize(1,1,false);threeRace.lastW=0}catch(e){}});
// 6) jeu installable et jouable hors ligne (sur un vrai hébergement https)
if('serviceWorker' in navigator&&/^https:|^http:\/\/localhost/.test(location.href)&&window.top===window){addEventListener('load',()=>navigator.serviceWorker.register('sw.js').catch(()=>{}))}
