/* ===== Icônes des ressources (2.8) : une seule icône par ressource, dans tout le jeu =====
   Les dessins de la barre du haut (or, fourrage, gemmes, ouvriers) et la coupe du bouton des trophées servent de modèle : copiés une fois
   en <symbol> (identifiants préfixés, pour ne dépendre d'aucun élément masqué), ils remplacent partout les émojis 🪙 🌾 💎 🏆 🔨 des
   textes du jeu (boutons, récompenses, coffres, boutique, messages, étiquettes du domaine). Un observateur convertit tout texte ajouté ou
   modifié : aucun écran n'a à s'en soucier, et un texte écrit plus tard suit la règle d'office. Les émojis restent dans les textes envoyés
   hors du jeu (partage d'un duel) et dans les attributs (title, aria-label). */
const RESSOURCE_ICONES=(()=>{
 const NS='http://www.w3.org/2000/svg';
 const MAP={'🪙':['or','.resources .resource:nth-child(1) svg','or'],'🌾':['fourrage','.resources .resource:nth-child(2) svg','fourrage'],
  '💎':['gemmes','.resources .resource:nth-child(3) svg','gemmes'],'🔨':['ouvrier','.resources .builder svg','ouvriers'],'🏆':['trophee','[data-panel=trophees] svg','trophée']};
 const HAS=/🪙|🌾|💎|🏆|🔨/,ALL=/🪙|🌾|💎|🏆|🔨/g,SKIP=new Set(['SCRIPT','STYLE','TEXTAREA','INPUT','OPTION','TITLE','CANVAS','svg']);
 // planche de symboles, rendue (pas display:none : un dégradé défini dans un élément masqué ne se peint pas)
 const sp=document.createElementNS(NS,'svg');sp.setAttribute('aria-hidden','true');sp.style.cssText='position:absolute;width:0;height:0;overflow:hidden;pointer-events:none';
 for(const[,[id,sel]]of Object.entries(MAP)){const src=document.querySelector(sel);if(!src)continue;const sym=document.createElementNS(NS,'symbol');sym.id='ri-'+id;sym.setAttribute('viewBox',src.getAttribute('viewBox')||'0 0 64 64');
  sym.innerHTML=src.innerHTML.replace(/id="([^"]+)"/g,(m,x)=>`id="ri-${id}-${x}"`).replace(/url\(#([^)]+)\)/g,(m,x)=>`url(#ri-${id}-${x})`);sp.appendChild(sym)}
 document.body.prepend(sp);
 function icon(e){const[id,,lab]=MAP[e],s=document.createElementNS(NS,'svg');s.setAttribute('class','ri ri-'+id);s.setAttribute('role','img');s.setAttribute('aria-label',lab);s.setAttribute('viewBox','0 0 64 64');
  const u=document.createElementNS(NS,'use');u.setAttribute('href','#ri-'+id);s.appendChild(u);return s}
 // chaîne HTML (pour un texte dessiné hors du DOM converti plus tard, ou un usage explicite) : RESSOURCE_ICONES.html('🪙')
 const html=e=>MAP[e]?`<svg class="ri ri-${MAP[e][0]}" role="img" aria-label="${MAP[e][2]}" viewBox="0 0 64 64"><use href="#ri-${MAP[e][0]}"/></svg>`:e;
 function fix(n){const t=n.nodeValue,p=n.parentNode;if(!t||!HAS.test(t)||!p||SKIP.has(p.nodeName)||p.closest&&p.closest('svg,[data-no-ri]'))return;
  const f=document.createDocumentFragment();let last=0;t.replace(ALL,(m,i)=>{if(i>last)f.appendChild(document.createTextNode(t.slice(last,i)));f.appendChild(icon(m));last=i+m.length;return m});
  if(last<t.length)f.appendChild(document.createTextNode(t.slice(last)));p.replaceChild(f,n)}
 function scan(root){if(root.nodeType===3)return fix(root);if(root.nodeType!==1||SKIP.has(root.nodeName)||root.closest&&root.closest('svg,[data-no-ri]'))return;
  const w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT),L=[];while(w.nextNode())if(HAS.test(w.currentNode.nodeValue))L.push(w.currentNode);L.forEach(fix)}
 new MutationObserver(ms=>{for(const m of ms){if(m.type==='characterData')fix(m.target);else m.addedNodes.forEach(scan)}}).observe(document.body,{subtree:true,childList:true,characterData:true});
 scan(document.body);
 return{html,scan}})();
