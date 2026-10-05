const VERSION='2.9';
const state={gold:6000,feed:4000,gems:40,trophies:0};
/* sauvegarde corrompue ? on restaure la dernière copie de secours (trr.bak) avant que les modules ne la lisent */
(()=>{try{const bak=JSON.parse(localStorage.getItem('trr.bak')||'null');for(const k of['trr.stable','trr.progress','trr.champion']){const v=localStorage.getItem(k);if(v==null)continue;try{JSON.parse(v)}catch(e){if(bak&&bak.k&&bak.k[k]){localStorage.setItem(k,bak.k[k]);window.__restored=true}else localStorage.removeItem(k)}}}catch(e){}})();
/* bâtiments du domaine : niveaux lus dès le démarrage (la récupération hors ligne de l'écurie en dépend) ; travaux, coûts et écrans dans 45-domaine.
   DOMAIN_FX donne l'effet d'un niveau : Haras = niveau max des autres, hippodrome = allocations, clinique = coût et risque des soins, écurie = places,
   moulin = fourrage produit par heure, paddocks = récupération, carrière = gains d'entraînement, chantier = Salle des trophées (0 = pas construite). */
const domainLv=(()=>{try{return JSON.parse(localStorage.getItem('trr.progress')||'{}').domaine?.lv||{}}catch(e){return{}}})();
const DOMAIN_FX={haras:l=>l,hippodrome:l=>1+.06*(l-1),clinique:l=>1-.12*(l-1),ecurie:l=>5+l,moulin:l=>[0,120,200,320,480,700][l]||0,paddocks:l=>1+.2*(l-1),carriere:l=>1+.05*(l-1),chantier:l=>l};
const dlv=id=>domainLv[id]??(id==='chantier'?0:1),dfx=id=>DOMAIN_FX[id](dlv(id));
const stableMax=()=>dfx('ecurie'),purseOf=m=>Math.round((m.purse||0)*dfx('hippodrome')/50)*50;
/* événements du jeu : les modules s'y abonnent au lieu de s'emboîter les uns dans les autres (ordre d'abonnement = ordre des fichiers) */
// priorité facultative : les abonnés de priorité plus haute passent d'abord (ex. effets sur racePlayer avant l'enregistrement du rejeu)
const hooks=(()=>{const L={};return{on(e,f,p=0){const l=L[e]=L[e]||[];l.push({f,p});l.sort((a,b)=>b.p-a.p)},emit(e,...a){for(const{f}of(L[e]||[]).slice())try{f(...a)}catch(err){console.error('hook '+e,err)}}}})();
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const fmt=n=>n.toLocaleString('fr-FR');
// temps affichés (2.6) : virgule décimale et espace insécable avant l'unité — « 89,55 s » ne se coupe jamais en fin de ligne
// réglage système « réduire les animations » (2.6) : pas de secousse de caméra, animations CSS coupées (13-gaming)
const REDUCE_MOTION=matchMedia('(prefers-reduced-motion: reduce)');
// une course est à l'écran (2.8) : ce qui attendait la sortie d'une course (récompense du jour, scène, invitation) attend la suivante
const enCourse=()=>!!document.querySelector('#raceScreen.open');
const sec=(x,d=2)=>Number(x).toFixed(d).replace('.',',')+'\u00a0s';
function toast(msg,ms=2200){const t=$('#toast');t.textContent=msg;t.classList.add('show');clearTimeout(t._x);t._x=setTimeout(()=>t.classList.remove('show'),ms)}
// sauvegarde impossible (stockage du navigateur plein ou bloqué, 2.6) : prévenir une fois par session au lieu de perdre la progression en silence
const saveKo=(()=>{let said=false;return e=>{try{journal.erreur('sauvegarde',String(e&&e.name||e),'')}catch(x){}if(said||window.__noSave)return;said=true;
 setTimeout(()=>toast('Sauvegarde impossible : le stockage du navigateur est plein ou bloqué. Exporte ta partie : Réglages → Transférer ma partie.',8000),0)}})();
// barre du haut : nombres compacts au-delà de 100 000 (« 150 k », « 2,5 M », arrondis vers le bas), valeur exacte au survol
const fmtC=n=>n<1e5?fmt(n):n<1e6?fmt(Math.floor(n/1e3))+'\u00a0k':(Math.floor(n/1e4)/100).toLocaleString('fr-FR')+'\u00a0M';
function sync(){ for(const k of['gold','feed','gems']){const e=$('#'+k);e.textContent=fmtC(state[k]);e.parentElement.title=fmt(state[k])}$('#trophies').textContent=fmt(state.trophies)}
