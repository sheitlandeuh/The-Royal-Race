/* ===== Réglages : qualité graphique, animations, son, sauvegarde ===== */
const settings=(()=>{let S={q:'auto',anim:true,sfx:.8,music:.45,voice:true};try{Object.assign(S,JSON.parse(localStorage.getItem('trr.settings')||'{}'))}catch(e){}
 const save=()=>{try{localStorage.setItem('trr.settings',JSON.stringify(S))}catch(e){}};
 const auto=()=>{const touch=matchMedia('(pointer:coarse)').matches,cores=navigator.hardwareConcurrency||4,mem=navigator.deviceMemory||4;return touch&&(cores<=4||mem<=3)?'basse':touch||cores<=4?'moyenne':'haute'};
 return{get:k=>S[k],set(k,v){S[k]=v;save();apply()},level:()=>S.q==='auto'?auto():S.q}})();
const QUALITY={basse:{pr:1,shadow:0,post:false,n:'Basse',d:'Pour les téléphones modestes : pas d’ombres ni d’effets caméra.'},moyenne:{pr:1.5,shadow:1024,post:true,n:'Moyenne',d:'Ombres légères et effets caméra.'},haute:{pr:2,shadow:2048,post:true,n:'Haute',d:'Tous les effets, ombres fines. Pour PC et téléphones récents.'}};
function applyRaceQuality(q){if(!q)return;const Q=QUALITY[settings.level()];q.renderer.setPixelRatio(Math.min(Q.pr,devicePixelRatio||1));const had=q.renderer.shadowMap.enabled;q.renderer.shadowMap.enabled=!!Q.shadow;
 q.scene.traverse(o=>{if(o.isDirectionalLight&&o.castShadow&&Q.shadow&&o.shadow.mapSize.x!==Q.shadow){o.shadow.mapSize.set(Q.shadow,Q.shadow);o.shadow.map?.dispose();o.shadow.map=null}if(had!==!!Q.shadow&&o.material){(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>m.needsUpdate=true)}});q.lastW=0}
function apply(){document.body.classList.toggle('no-anim',!settings.get('anim'));if(typeof threeRace!=='undefined'&&threeRace)applyRaceQuality(threeRace);try{sound.volumes()}catch(e){}}
function openSettings(){$('#panelTitle').textContent='Réglages';$('#panel .card').classList.remove('wide');const lv=settings.get('q');
 $('#panelBody').innerHTML=`<div class="set">
 <section><h4>QUALITÉ GRAPHIQUE</h4><div class="seg">${['auto','basse','moyenne','haute'].map(k=>`<button data-q="${k}" class="${lv===k?'on':''}">${k==='auto'?'Auto':QUALITY[k].n}</button>`).join('')}</div>
  <p class="hint">${lv==='auto'?`Auto : ${QUALITY[settings.level()].n.toLowerCase()} sur cet appareil. `:''}${QUALITY[settings.level()].d}</p></section>
 <section><h4>AFFICHAGE</h4><label class="tog"><input type="checkbox" id="setAnim" ${settings.get('anim')?'checked':''}> Animations du domaine (nuages, oiseaux, bannières)</label></section>
 <section><h4>SON</h4><label class="sl">Effets <input type="range" id="setSfx" min="0" max="1" step=".05" value="${settings.get('sfx')}"></label><label class="sl">Musique <input type="range" id="setMusic" min="0" max="1" step=".05" value="${settings.get('music')}"></label><label class="tog"><input type="checkbox" id="setVoice" ${settings.get('voice')?'checked':''}> Commentaire du speaker</label></section>
 <section><h4>SAUVEGARDE</h4><p class="hint">Ta partie est enregistrée dans ce navigateur (${stable.data.horses.length} chevaux, ${fmt(state.gold)} or).</p><button class="action green" id="saveTools">TRANSFÉRER / SAUVEGARDER MA PARTIE</button> <button class="action" id="resetSave">Recommencer une partie</button></section><p class="hint set-version">The Royal Race ${VERSION} · <a href="#" data-news>quoi de neuf ?</a></p></div>`;
 $('#panel').classList.add('open')}
$('#panelBody').addEventListener('click',e=>{const b=e.target.closest('[data-q]');if(b){settings.set('q',b.dataset.q);openSettings();toast(`Qualité : ${QUALITY[settings.level()].n.toLowerCase()}`)}
 if(e.target.id==='resetSave'){const r=e.target;if(r.dataset.armed){try{window.__noSave=true;['trr.stable','trr.champion','trr.progress','trr.bak'].forEach(k=>localStorage.removeItem(k))}catch(err){}location.reload()}else{r.dataset.armed=1;r.textContent='Confirmer : tout effacer';r.classList.add('danger');setTimeout(()=>{if(r.isConnected){delete r.dataset.armed;r.textContent='Recommencer une partie';r.classList.remove('danger')}},4000)}}});
$('#panelBody').addEventListener('change',e=>{if(e.target.id==='setAnim')settings.set('anim',e.target.checked);if(e.target.id==='setVoice')settings.set('voice',e.target.checked)});
$('#panelBody').addEventListener('input',e=>{if(e.target.id==='setSfx')settings.set('sfx',+e.target.value);if(e.target.id==='setMusic')settings.set('music',+e.target.value)});
$('.resource.gear').addEventListener('click',openSettings);
