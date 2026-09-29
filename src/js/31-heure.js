/* ===== Heure et saison du domaine : la lumière suit l'heure réelle du joueur (matin, jour, soir, nuit), le feuillage la saison =====
   body[data-tod] est lu par le domaine 3D (51-domaine3d) et l'ambiance des courses (29-ambiance).
   Outils de développement : ?heure=nuit|soir|matin|jour et ?saison=hiver|printemps|ete|automne dans l'adresse. */
const heure=(()=>{const q=new URLSearchParams(location.search),PHASES=['matin','jour','soir','nuit'],SEASONS=['hiver','printemps','ete','automne'];
 const phaseAt=h=>h>=6&&h<10?'matin':h>=10&&h<17.5?'jour':h>=17.5&&h<21?'soir':'nuit',forced=q.get('heure'),forcedS=q.get('saison');
 function apply(){const d=new Date(),p=PHASES.includes(forced)?forced:phaseAt(d.getHours()+d.getMinutes()/60);if(document.body.dataset.tod!==p)document.body.dataset.tod=p}
 const season=()=>SEASONS.includes(forcedS)?forcedS:SEASONS[Math.floor(((new Date().getMonth()+1)%12)/3)];
 apply();setInterval(apply,5*60e3);
 return{get phase(){return document.body.dataset.tod},apply,season}})();
