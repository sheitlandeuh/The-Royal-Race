/* ===== Partager son temps du Défi du jour : une carte image (1080×1350) envoyée par le partage natif du téléphone =====
   Si le partage de fichiers n'existe pas (PC), l'image est téléchargée. Aucune donnée personnelle : nom du cheval, casaque, temps. */
const partage=(()=>{
 const W=1080,H=1350,svgImg=svg=>new Promise(res=>{const i=new Image();i.onload=()=>res(i);i.onerror=()=>res(null);i.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg.includes('xmlns')?svg:svg.replace('<svg','<svg xmlns="http://www.w3.org/2000/svg"'))});
 async function card(){const T=defi.today(),M=defi.meeting(),h=stable.active(),liv={...stable.silks,coat:h.coat},c=document.createElement('canvas');c.width=W;c.height=H;const x=c.getContext('2d');
  // fond : nuit bleue, liseré or, halo
  let g=x.createLinearGradient(0,0,0,H);g.addColorStop(0,'#0d2a47');g.addColorStop(1,'#061524');x.fillStyle=g;x.fillRect(0,0,W,H);
  g=x.createRadialGradient(W/2,H*.42,40,W/2,H*.42,W*.75);g.addColorStop(0,'rgba(243,198,74,.28)');g.addColorStop(1,'rgba(243,198,74,0)');x.fillStyle=g;x.fillRect(0,0,W,H);
  x.strokeStyle='#e5bb5a';x.lineWidth=10;x.strokeRect(34,34,W-68,H-68);x.lineWidth=2;x.strokeRect(56,56,W-112,H-112);
  x.textAlign='center';x.fillStyle='#ffe29a';x.font='900 64px Georgia,serif';x.fillText('THE ROYAL RACE',W/2,170);
  x.fillStyle='#bfe6ff';x.font='700 40px system-ui,sans-serif';x.fillText(`DÉFI DU JOUR · ${new Date().toLocaleDateString('fr-FR',{day:'numeric',month:'long'}).toUpperCase()}`,W/2,240);
  x.fillStyle='#d5e1ea';x.font='600 34px system-ui,sans-serif';x.fillText(`${fmt(M.dist)} m · terrain ${TERRAINS[M.terrain].n.toLowerCase()} · même course pour tous`,W/2,295);
  // casaque de l'écurie
  const img=await svgImg(LIVERY.silkSVG(liv,300));if(img)x.drawImage(img,W/2-150,340,300,300);
  x.fillStyle='#fff';x.font='800 58px Georgia,serif';x.fillText(h.name,W/2,720);
  // le temps
  x.fillStyle='#ffe29a';x.font='900 190px Georgia,serif';x.fillText(`${T.best.toFixed(2).replace('.',',')} s`,W/2,930);
  x.fillStyle='#d5e1ea';x.font='700 38px system-ui,sans-serif';x.fillText(`meilleur temps en ${T.tries} essai${T.tries>1?'s':''}`,W/2,995);
  // l'appel au défi
  x.fillStyle='#9dffab';x.font='900 62px system-ui,sans-serif';x.fillText('Tu fais mieux ?',W/2,1135);
  x.fillStyle='#8fb0c8';x.font='600 30px system-ui,sans-serif';x.fillText(location.host+location.pathname.replace(/index\.html$/,''),W/2,1220);
  return new Promise(res=>c.toBlob(b=>res(b),'image/png'))}
 async function share(){try{const b=await card(),T=defi.today(),name=`royal-race-defi-${T.day}.png`,f=new File([b],name,{type:'image/png'}),url=location.origin+location.pathname,text=`Défi du jour The Royal Race : ${T.best.toFixed(2).replace('.',',')} s avec ${stable.active().name}. Tu fais mieux ? ${url}`;
   if(navigator.canShare&&navigator.canShare({files:[f]})){await navigator.share({files:[f],text,title:'The Royal Race'});return}
   const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),2000);toast('Image enregistrée : partage-la où tu veux')}
  catch(e){if(e&&e.name!=='AbortError')toast('Partage impossible sur cet appareil')}}
 // bouton sous le bilan du défi
 hooks.on('race:end',()=>{if(!RACE.defi||!defi.today().best)return;$('#fbGain').insertAdjacentHTML('beforeend','<br><button class="action" id="defiShare">📤 PARTAGER MON TEMPS</button>');$('#defiShare').onclick=e=>{e.stopPropagation();share()}});
 return{card,share}})();
