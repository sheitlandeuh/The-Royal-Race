/* ===== Ambiances de course : la météo suit le terrain (souple = ciel couvert, lourd = pluie), les grandes courses se courent au coucher du soleil ===== */
const AMBIANCES={
 jour:{n:'Plein soleil',i:'☀️',zen:[.035,.14,.46],mid:[.08,.28,.68],hor:[.42,.6,.78],sunC:[1,.86,.62],sunK:1,sun:[0xfff0d2,3.3,-260,360,180],hemi:[0xdcebff,0x3a4a26,1.3],fog:[0xc4d6de,300,1000],tint:0xffffff,board:0xdedede,horizon:0xf2f2f2,exp:1},
 couchant:{n:'Coucher de soleil',i:'🌇',zen:[.05,.09,.26],mid:[.32,.26,.4],hor:[1,.56,.3],sunC:[1,.55,.25],sunK:1.8,sun:[0xffa860,3.4,-430,150,250],hemi:[0xffc79a,0x4a3418,1.3],fog:[0xe0a070,300,1100],tint:0xffd6ae,board:0xe0b48c,horizon:0xffbf8c,exp:1.1},
 couvert:{n:'Ciel couvert',i:'🌥️',zen:[.24,.29,.35],mid:[.4,.45,.51],hor:[.6,.64,.68],sunC:[1,1,1],sunK:.04,sun:[0xe4ebf2,1.25,-160,420,120],hemi:[0xcdd6df,0x323a31,1.45],fog:[0x8a949c,240,950],tint:0xd2d8de,board:0xaab1b7,horizon:0xa4adb5,exp:.9},
 pluie:{n:'Sous la pluie',i:'🌧️',zen:[.13,.16,.2],mid:[.25,.29,.33],hor:[.42,.46,.5],sunC:[1,1,1],sunK:0,sun:[0xcfd8e2,.75,-160,420,120],hemi:[0xa8b4c0,0x26302a,1.25],fog:[0x5a636b,160,760],tint:0xb2bac2,board:0x8a939a,horizon:0x6f7a84,exp:.84,rain:true}};
MEETINGS.forEach(m=>{if(m.id==='m5'||m.id==='m6')m.amb='couchant'});
const ambiance=(()=>{let rain=null,cur=null;
 // terrain bon : plein soleil, ou coucher de soleil quand c'est le soir chez le joueur (heure du domaine)
 const key=(m=RACE)=>m.amb||(m.terrain==='lourd'?'pluie':m.terrain==='souple'?'couvert':document.body.dataset.tod==='soir'?'couchant':'jour');
 function makeRain(q){const N=1400,pos=new Float32Array(N*6),g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(pos,3));
  const L=new THREE.LineSegments(g,new THREE.LineBasicMaterial({color:0xc8d4e0,transparent:true,opacity:.42,depthWrite:false,fog:false}));L.frustumCulled=false;L.renderOrder=5;q.scene.add(L);
  const drops=Array.from({length:N},()=>({x:(Math.random()-.5)*90,y:Math.random()*40,z:(Math.random()-.5)*90,v:30+Math.random()*14}));return{L,pos,drops,g}}
 function stepRain(q,dt){const fx=raceFX._fx;// le décor photo se charge après coup : on le teinte dès qu'il arrive
  if(cur&&fx&&fx.boards.length&&fx.boards[fx.boards.length-1].material.color.getHex()!==cur.board)fx.boards.forEach(b=>b.material.color.set(cur.board));
  if(!rain||!rain.L.visible)return;const c=q.camera.position,P=rain.pos;rain.L.position.set(c.x,0,c.z);
  rain.drops.forEach((d,i)=>{d.y-=d.v*dt;if(d.y<0){d.y+=40;d.x=(Math.random()-.5)*90;d.z=(Math.random()-.5)*90}const o=i*6;P[o]=d.x;P[o+1]=d.y+c.y-14;P[o+2]=d.z;P[o+3]=d.x+.18;P[o+4]=d.y+c.y-14+1.3;P[o+5]=d.z+.1});rain.g.attributes.position.needsUpdate=true}
 function apply(q,k=key()){const A=AMBIANCES[k],fx=raceFX._fx;if(!q||!A)return;const v=a=>new THREE.Vector3(...a);
  q.sun.color.set(A.sun[0]);q.sun.intensity=A.sun[1];q.sun.position.set(A.sun[2],A.sun[3],A.sun[4]);q.hemi.color.set(A.hemi[0]);q.hemi.groundColor.set(A.hemi[1]);q.hemi.intensity=A.hemi[2];
  q.scene.fog.color.set(A.fog[0]);q.scene.fog.near=A.fog[1];q.scene.fog.far=A.fog[2];
  if(fx){const U=fx.skyMat&&fx.skyMat.uniforms;if(U){U.uZen.value=v(A.zen);U.uMid.value=v(A.mid);U.uHor.value=v(A.hor);U.uSunC.value=v(A.sunC);U.uSunK.value=A.sunK;U.uSun.value=v(A.sun.slice(2)).normalize()}
   fx.horizonMat&&fx.horizonMat.color.set(A.horizon);fx.boards.forEach(b=>b.material.color.set(A.board));raceFX.exposure=A.exp}
  // les chevaux peints (vus de dos) ne sont pas éclairés par la scène : on les teinte comme la lumière du jour
  q.horses.forEach(h=>h.material.color.set(A.tint));cur=A;
  if(A.rain&&!rain)rain=makeRain(q);if(rain)rain.L.visible=!!A.rain;$('#raceScreen').dataset.amb=k}
 return{key,apply,step:stepRain,info:(m=RACE)=>AMBIANCES[key(m)]}})();
hooks.on('race:start',()=>{if(threeRace)ambiance.apply(threeRace)});
{const r0=raceFX.render;let last=0;raceFX.render=function(q){const now=performance.now(),dt=Math.min(.05,(now-(last||now))/1000);last=now;ambiance.step(q,dt);return r0.call(this,q)}}
hooks.on('race:header',()=>{const A=ambiance.info();$('.race-head small').textContent+=` • ${A.i} ${A.n}`});
/* écran des courses : la météo du jour sur chaque carte */
hooks.on('courses:render',()=>{$$('#panelBody .meet[data-meet]').forEach(b=>{const m=b.dataset.meet==='tour'?RACE.tour&&RACE:MEETINGS.find(x=>x.id===b.dataset.meet);const s=b.querySelector('small');if(m&&s){const A=ambiance.info(m);s.insertAdjacentHTML('afterbegin',`<i class="amb" title="${A.n}">${A.i}</i> `)}})});
