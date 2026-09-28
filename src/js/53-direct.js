/* ===== Course en direct : étiquettes au-dessus des chevaux et classement en temps réel =====
   Esprit course en ligne : chaque adversaire porte son nom et sa place au-dessus de lui (projection de sa position 3D sur l'écran),
   et un classement suit la course pas à pas (écart en longueurs, ou temps à l'arrivée). Affichage seulement : rien ici ne touche
   la simulation. Les étiquettes s'effacent avec la distance ; le classement se range sur les petits écrans. */
const direct=(()=>{
  const world=$('#povWorld'),scr=$('#raceScreen');
  const tags=document.createElement('div');tags.className='rtags';world.appendChild(tags);
  const T=Array.from({length:6},(_,i)=>{const d=document.createElement('div');d.className='rtag'+(i?'':' me');d.innerHTML='<i></i><b></b>';tags.appendChild(d);return d});
  const board=document.createElement('ol');board.className='standings';board.setAttribute('aria-label','Classement en direct');scr.appendChild(board);
  let v=null,rows=[],colors=[],names=[];
  const LEN=2.4; // une longueur ≈ 2,4 m
  // ordre du moment : les arrivés dans l'ordre d'arrivée, puis les autres selon leur avance
  const order=()=>finishOrder.concat(progress.map((p,i)=>({p,i})).filter(x=>!raceFinished[x.i]).sort((a,b)=>b.p-a.p||a.i-b.i).map(x=>x.i));
  function setup(){const F=currentField;colors=[stable.silks.main,...(F?F.rivals.map(r=>r.livery.main):Array(5).fill('#888'))];names=raceNames.slice(0,6);
    T.forEach((d,i)=>{d.style.setProperty('--c',colors[i]||'#888');d.querySelector('i').textContent='';d.querySelector('b').textContent=i?names[i]:'VOUS';d.style.opacity=0});
    board.innerHTML=Array.from({length:6},()=>'<li><em></em><i></i><b></b><small></small></li>').join('');rows=[...board.children];update()}
  function update(){if(!rows.length)return;const o=order(),lead=progress[o[0]]??0,t0=raceFinishTimes[finishOrder[0]];
    o.forEach((i,k)=>{const r=rows[k];r.className=i===0?'me':'';r.children[0].textContent=k+1;r.children[1].style.background=colors[i]||'#888';r.children[2].textContent=i?names[i]:'VOUS';
      const gap=raceFinished[i]?(k?`+${(raceFinishTimes[i]-t0).toFixed(2).replace('.',',')} s`:`${raceFinishTimes[i].toFixed(2).replace('.',',')} s`):k?`+${Math.max(0,(lead-progress[i])*RACE.dist/100/LEN).toFixed(1).replace('.',',')} L`:'EN TÊTE';
      r.children[3].textContent=gap;T[i].querySelector('i').textContent=k+1})}
  hooks.on('race:start',setup);hooks.on('race:tick',update);hooks.on('race:end',update);
  // étiquettes : projetées à chaque image, tant que la course est en cours (pas pendant l'intro, l'arrivée vue de côté ou le podium)
  function frame(){requestAnimationFrame(frame);const q=threeRace,on=scr.classList.contains('open')&&q&&!q.headless&&q.startPhase==='running'&&!q.podiumActive&&!q.finishView&&visualProgress.length;
    tags.classList.toggle('on',!!on);if(!on)return;if(!v)v=new THREE.Vector3();const W=world.clientWidth,H=world.clientHeight,cam=q.camera.position;
    const L=[];for(let i=0;i<6;i++){const d=T[i],lane=(laneOf(i)-50)*.38,p=trackPose(RACE_ORIGIN+(visualProgress[i]||0)/100,lane).p,dist=Math.hypot(p.x-cam.x,p.z-cam.z);
      v.set(p.x,i?8.6:9.4,p.z).project(q.camera);const vis=v.z<1&&Math.abs(v.x)<1.05&&v.y<1&&v.y>-1&&dist<(i?170:60)&&dist>(i?9:14);
      if(!vis){if(d.style.opacity!=='0')d.style.opacity=0;continue}const k=Math.max(.55,Math.min(1.1,38/dist+.35));
      L.push({d,dist,k,x:(v.x+1)/2*W,y:(1-v.y)/2*H,w:(d.offsetWidth||90)*k,h:24*k})}
    // désencombrement : du plus proche au plus lointain, une étiquette qui en recouvre une autre monte d'un cran
    L.sort((a,b)=>a.dist-b.dist);const placed=[];
    for(const t of L){for(let n=0;n<6&&placed.some(o=>Math.abs(o.x-t.x)<(o.w+t.w)/2+4&&Math.abs(o.y-t.y)<(o.h+t.h)/2+2);n++)t.y-=t.h+3;placed.push(t);
      t.d.style.opacity=Math.min(1,(170-t.dist)/40).toFixed(2);t.d.style.transform=`translate(${t.x.toFixed(1)}px,${t.y.toFixed(1)}px) translate(-50%,-100%) scale(${t.k.toFixed(2)})`}}
  requestAnimationFrame(frame);
  return{order,update}})();
