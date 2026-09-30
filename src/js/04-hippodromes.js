/* ===== Hippodromes (2.7) : chaque course se court sur un hippodrome (RACE.hippo ; Hippodrome Royal par défaut) =====
   Un hippodrome, c'est un tracé — longueur des lignes droites S, rayon des virages r, sens (main gauche 1, main droite -1) — et un décor
   (thème de 09-race-world). Le tracé compte en course : courseTurn (10-race) tire la place et la force des deux virages de la géométrie
   (TRACKS) ; plus un virage est serré, plus courir au large y coûte. L'Hippodrome Royal garde exactement ses valeurs d'avant la 2.7,
   donc ses courses et leurs rejeux ne changent pas. RACE.hippo voyage avec la course (rejeu, duel) : rien ne dépend de l'appareil. */
const HIPPOS={
 royal:{n:'Hippodrome Royal',c:'Royal',i:'🏰',S:520,r:165,dir:1,fog:[1,1],trait:'Tracé équilibré',d:'Le grand ovale du domaine, face au château : lignes droites et virages équilibrés.'},
 foret:{n:'Hippodrome de la Forêt',c:'Forêt',i:'🌲',S:400,r:146,dir:-1,fog:[.62,.8],trait:'Main droite, virages serrés',d:'À main droite, sous les chênes et les sapins : des virages serrés où courir au large coûte cher, une ligne d’arrivée courte.'},
 cote:{n:'Hippodrome de la Côte',c:'Côte',i:'🌊',S:720,r:180,dir:1,fog:[1.1,1.15],trait:'Longues lignes droites, virages larges',d:'Face à la mer : de longues lignes droites et des virages larges, où courir au large coûte moins cher qu’ailleurs.'},
 cimes:{n:'Hippodrome des Cimes',c:'Cimes',i:'🏔️',S:470,r:156,dir:-1,fog:[1.3,1.3],trait:'Main droite, au pied des glaciers',d:'Au pied des glaciers, à main droite : un tracé technique, des virages plus serrés qu’au domaine.'},
 capitale:{n:'Hippodrome de la Capitale',c:'Capitale',i:'🌃',S:480,r:132,dir:1,fog:[1,1.05],trait:'Virages très serrés',d:'Au cœur de la ville, sous les projecteurs : des virages très serrés, la corde vaut de l’or.'}};
const hippoOf=(R=RACE)=>R&&HIPPOS[R.hippo]?R.hippo:'royal';
// géométrie dérivée : longueur du tour L, départ o (l'arrivée est à 32 m de la fin de la ligne d'arrivée, comme au domaine),
// fenêtres des deux virages en fraction de course et force k (inverse du rayon, 1 à l'Hippodrome Royal)
const TRACKS={};for(const[id,h]of Object.entries(HIPPOS)){const L=2*h.S+2*Math.PI*h.r,o=(h.S-32)/L;TRACKS[id]={L,o,t1:[h.S/L-o,(h.S+Math.PI*h.r)/L-o],t2:[(2*h.S+Math.PI*h.r)/L-o,1-o],k:165/h.r}}
// tracé affiché (trackPose) : m = sens appliqué ; le décor est construit dans le sens de référence (m = 1) puis retourné en bloc
let TRACK={id:'royal',S:520,r:165,dir:1,m:1};
function setTrack(id){const h=HIPPOS[id]||HIPPOS.royal;TRACK={id:HIPPOS[id]?id:'royal',S:h.S,r:h.r,dir:h.dir,m:h.dir};RACE_ORIGIN=TRACK.id==='royal'?.235:TRACKS[TRACK.id].o}
