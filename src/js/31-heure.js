/* ===== Heure du domaine : la lumière du village suit l'heure réelle du joueur (matin, jour, soir, nuit) ===== */
const heure=(()=>{const map=$('#map'),tod=document.createElement('div');tod.className='map-tod';map.appendChild(tod);
 const lamps=document.createElement('div');lamps.className='map-lamps';map.appendChild(lamps);
 // lanternes aux bâtiments : allumées le soir et la nuit
 lamps.innerHTML=Object.entries(VILLAGE.buildings).map(([k,b],i)=>`<i style="left:${(b.cx*100).toFixed(2)}%;top:${(b.cy*100).toFixed(2)}%;--d:${(i*.37%1.6).toFixed(2)}s;--s:${k==='hippodrome'?1.3:k==='haras'?1.35:1}"></i>`).join('');
 const phaseAt=h=>h>=6&&h<10?'matin':h>=10&&h<17.5?'jour':h>=17.5&&h<21?'soir':'nuit';
 // ?heure=nuit dans l'adresse : pour vérifier le rendu sans attendre (outil de développement)
 const forced=new URLSearchParams(location.search).get('heure');
 function apply(){const d=new Date(),p=PHASES.includes(forced)?forced:phaseAt(d.getHours()+d.getMinutes()/60);if(document.body.dataset.tod!==p)document.body.dataset.tod=p}
 const PHASES=['matin','jour','soir','nuit'];apply();setInterval(apply,5*60e3);
 return{get phase(){return document.body.dataset.tod},apply}})();
