/* ===== Le rival : le Comte de Valmont et son champion Black Majesty, présents à chaque course ===== */
const VALMONT={name:'Black Majesty',owner:'Comte de Valmont',livery:{coat:'noir',main:'#17181b',second:'#c8982c',pattern:'etoile',cap:'#c8982c'},talent:'tacticien'};
const rival=(()=>{const C=career.data;C.rival=C.rival||{w:0,l:0,lvl:0,met:false};const R=C.rival;
 const save=()=>{try{localStorage.setItem('trr.progress',JSON.stringify(C))}catch(e){}};
 const lines={first:'« Ainsi, voici le nouveau propriétaire du domaine… Mon Black Majesty n’a jamais perdu ici. »',ahead:'« Une victoire de chance. Black Majesty s’est remis au travail. »',behind:'« Vous pouvez toujours changer de métier, mon cher. »',even:'« Nos écuries se valent… pour l’instant. »',lvl:'« Black Majesty a passé l’été à Chantilly. Il est plus fort que jamais. »'};
 function taunt(){if(!R.met)return lines.first;if(R.justLvl)return lines.lvl;return R.w>R.l?lines.ahead:R.w<R.l?lines.behind:lines.even}
 // Black Majesty remplace le premier adversaire du plateau
 function inject(F){const r=F.rivals[0],h=stable.active(),boost=1+Math.min(4,R.lvl)*1.5,st={};for(const s of STATS)st[s.k]=Math.min(99,r.stats[s.k]+boost);r.stats=st;r.name=VALMONT.name;r.livery={...VALMONT.livery};r.talent=VALMONT.talent;r.pref=RACE.dist;r.rating=ratingOf(st)-7;r.nemesis=true;return F}
 function after(){const me=finishOrder.indexOf(0),him=finishOrder.indexOf(1);R.met=true;R.justLvl=false;let msg='';
  if(me<him){R.w++;state.gold+=800;msg=`Tu as devancé Black Majesty ! +800 or (${R.w}–${R.l})`;if(R.w%3===0){R.lvl++;R.justLvl=true}}else{R.l++;msg=`Black Majesty t’a devancé (${R.w}–${R.l})`}save();sync();return msg}
 return{inject,after,taunt,get rec(){return R}}})();
