/* ===== Livrées : robe du cheval, casaque, toque — recoloration réaliste des sprites (course + podium) ===== */
const LIVERY=(()=>{
 const META=/*HORSEMETA*/null;
 const COATS=[
  {id:'bai',name:'Bai',hair:[22,17,14]},{id:'noir',name:'Noir',hair:[16,15,15]},{id:'alezan',name:'Alezan',hair:[112,48,20]},
  {id:'gris',name:'Gris',hair:[118,118,120]},{id:'baibrun',name:'Bai brun',hair:[18,13,11]},{id:'palomino',name:'Palomino',hair:[232,214,172]}];
 const COLORS=[['Bleu roi','#1f3f9f'],['Marine','#15264a'],['Ciel','#5aa4e3'],['Rouge','#c21c27'],['Bordeaux','#6c1428'],['Rose','#e4679d'],
  ['Vert','#17824c'],['Vert anglais','#0f3b29'],['Jaune','#f3c41a'],['Or','#c8982c'],['Orange','#ee6914'],['Violet','#5a2a88'],
  ['Blanc','#f4f2ec'],['Gris','#8b9097'],['Noir','#17181b'],['Chocolat','#5e341c']];
 const PATTERNS=[['uni','Uni'],['losange','Losange'],['bandes','Rayures'],['cercle','Cerclé'],['chevrons','Chevrons'],['croix','Croix'],['etoile','Étoile'],['manches','Manches'],['brassards','Brassards'],['pois','Pois']];
 const DEFAULT={name:'Royal Thunder',coat:'bai',main:'#1f3f9f',second:'#c8982c',pattern:'losange',cap:'#1f3f9f'};
 const hex=h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16));
 function star(u,v,r){const a=Math.atan2(v,u),d=Math.hypot(u,v),k=Math.PI/5,m=((a%(2*k))+2*k)%(2*k)-k;return d*Math.cos(m)/Math.cos(k)<r*(.55+.45*Math.abs(Math.cos(2.5*a+Math.PI/2)))}
 function pat(id,u,v){switch(id){
  case 'losange':return Math.abs(u-.5)/.21+Math.abs(v-.42)/.27<1;
  case 'bandes':return Math.floor(u*8)%2===1;
  case 'cercle':return Math.floor(v*6)%2===1;
  case 'chevrons':{const t=v*2.4-Math.abs(u-.5)*2.1+.15;return t-Math.floor(t)<.42}
  case 'croix':return Math.abs((u-.5)*1.15-(v-.48))<.085||Math.abs((u-.5)*1.15+(v-.48))<.085;
  case 'etoile':return star((u-.5)*1.1,v-.44,.24);
  case 'manches':return Math.abs(u-.5)>.29;
  case 'brassards':return Math.abs(u-.5)>.27&&v>.44&&v<.6;
  case 'pois':{const fu=u*6.5,fv=v*5.2,cu=fu-Math.floor(fu)-.5,cv=fv-Math.floor(fv)-.5,sh=Math.floor(fv)%2?.5:0;const cu2=((fu+sh)%1)-.5;return Math.hypot(cu2,cv)<.26}
  default:return false}}
 // ---------- chargement des planches + masques ----------
 const img=src=>new Promise((res,rej)=>{const i=new Image();i.onload=()=>res(i);i.onerror=rej;i.src=src});
 const px=i=>{const c=document.createElement('canvas');c.width=i.naturalWidth;c.height=i.naturalHeight;const x=c.getContext('2d',{willReadFrequently:true});x.drawImage(i,0,0);return x.getImageData(0,0,c.width,c.height)};
 let G=null,P=null;
 const ready=Promise.all(['assets/rival-gallop-sheet.png','assets/horses/gallop-mask.png','assets/podium-horses-front-v1.png','assets/horses/podium-mask.png'].map(img)).then(([gs,gm,ps,pm])=>{
  G=prep(px(gs),px(gm),META.gallop.frames);P=prep(px(ps),px(pm),META.podium.frames);
  const lum=G.lum,cls=G.cls;let hs=0,hn=0;for(let i=0;i<cls.length;i++)if(cls[i]===5){hs+=lum[i];hn++}G.hairMean=hs/Math.max(1,hn);return true});
 function prep(src,mask,frames){const n=src.width*src.height,cls=new Uint8Array(n),sub=new Uint8Array(n),lum=new Float32Array(n),fr=new Uint8Array(n),W=src.width;
  const d=src.data,m=mask.data;for(let i=0;i<n;i++){cls[i]=m[i*4];sub[i]=m[i*4+1]>127?1:0;lum[i]=(.2126*d[i*4]+.7152*d[i*4+1]+.0722*d[i*4+2])/255}
  frames.forEach((f,k)=>{for(let y=0;y<src.height;y++)fr.fill(k,y*W+f.x0,y*W+Math.min(W,f.x1))});
  // luminance moyenne par (image, classe, sous-classe) pour neutraliser les motifs d'origine
  const sum=new Float64Array(frames.length*8*2),cnt=new Float64Array(frames.length*8*2);
  for(let i=0;i<n;i++){if(!cls[i])continue;const k=(fr[i]*8+cls[i])*2+sub[i];sum[k]+=lum[i];cnt[k]++}
  const mean=sum.map((s,k)=>cnt[k]?s/cnt[k]:1);return{src,W,H:src.height,cls,sub,lum,fr,frames,mean}}
 // ---------- peinture ----------
 function paint(S,liv,opts={}){const{frames:only=null,coat=true}=opts,W=S.W,H=S.H,out=new ImageData(new Uint8ClampedArray(S.src.data),W,H),o=out.data;
  const main=hex(liv.main),sec=hex(liv.second),cap=hex(liv.cap),ci=Math.max(0,COATS.findIndex(c=>c.id===liv.coat)),lut=META.coatLuts[ci],cdf=META.gallop.coatCdf,hair=COATS[ci].hair;
  const boxes=S.frames.map(f=>f.jersey),caps=S.frames.map(f=>f.cap);
  const shadeCol=(c,sh)=>{const s=Math.max(.16,Math.min(1.85,sh));const lift=Math.max(0,s-1)*46;return[c[0]*s+lift,c[1]*s+lift,c[2]*s+lift]};
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=y*W+x,c=S.cls[i];if(!c)continue;const f=S.fr[i];if(only&&!only.includes(f))continue;const p=i*4;let col=null;
   if(c===1||c===3){const b=boxes[f],u=(x-b[0])/(b[2]-b[0]),v=(y-b[1])/(b[3]-b[1]);const sh=S.lum[i]/S.mean[(f*8+c)*2+S.sub[i]];
    const alt=c===3?S.sub[i]===1:pat(liv.pattern,u,v);col=shadeCol(alt?sec:main,sh)}
   else if(c===2){const sh=S.lum[i]/S.mean[(f*8+2)*2+S.sub[i]];col=shadeCol(S.sub[i]?sec:cap,sh)}
   else if(c===4&&coat&&ci>0){const r=cdf[Math.min(255,Math.round(S.lum[i]*255))],q=lut[Math.min(63,Math.round(r*63))];col=q}
   else if(c===5&&coat&&ci>0){const sh=S.lum[i]/S.hairMean;col=shadeCol(hair,sh*.9)}
   if(col){o[p]=col[0];o[p+1]=col[1];o[p+2]=col[2]}}
  return out}
 const toCanvas=(data,sx=0,sw=data.width,scale=1)=>{const c=document.createElement('canvas'),t=document.createElement('canvas');t.width=data.width;t.height=data.height;t.getContext('2d').putImageData(data,0,0);
  c.width=Math.round(sw*scale);c.height=Math.round(data.height*scale);const x=c.getContext('2d');x.imageSmoothingQuality='high';x.drawImage(t,sx,0,sw,data.height,0,0,c.width,c.height);return c};
 const cache=new Map();
 function gallop(liv,scale=1){const k='g'+scale+JSON.stringify(liv);if(cache.has(k))return cache.get(k);const c=toCanvas(paint(G,liv),0,G.W,scale);cache.set(k,c);if(cache.size>24)cache.delete(cache.keys().next().value);return c}
 function portrait(liv){const k='p'+JSON.stringify(liv);if(cache.has(k))return cache.get(k);const ci=Math.max(0,COATS.findIndex(c=>c.id===liv.coat)),f=P.frames[ci];
  const c=toCanvas(paint(P,liv,{frames:[ci],coat:false}),f.x0,f.x1-f.x0);cache.set(k,c);return c}
 // ---------- icône casaque (SVG) ----------
 function silkSVG(liv,size=64){const id='s'+Math.random().toString(36).slice(2,8),m=liv.main,s=liv.second;
  const body='M18 20 L30 13 Q40 19 50 13 L62 20 L74 44 L63 50 L58 38 L58 74 Q40 79 22 74 L22 38 L17 50 L6 44 Z';
  let p='';const R=(x,y,w,h)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${s}"/>`;
  switch(liv.pattern){case 'losange':p=`<path d="M40 30 L50 44 L40 58 L30 44Z" fill="${s}"/>`;break;
   case 'bandes':for(let x=10;x<74;x+=12)p+=R(x+6,0,6,80);break;case 'cercle':for(let y=16;y<80;y+=12)p+=R(0,y+6,80,6);break;
   case 'chevrons':for(let y=22;y<80;y+=16)p+=`<path d="M4 ${y} L40 ${y+16} L76 ${y} L76 ${y+7} L40 ${y+23} L4 ${y+7}Z" fill="${s}"/>`;break;
   case 'croix':p=`<path d="M14 18 L22 14 L66 70 L58 76Z M66 18 L58 14 L14 70 L22 76Z" fill="${s}"/>`;break;
   case 'etoile':p=`<path d="M40 30 L43.5 39.5 L53.5 39.8 L45.6 46 L48.4 55.7 L40 50 L31.6 55.7 L34.4 46 L26.5 39.8 L36.5 39.5Z" fill="${s}"/>`;break;
   case 'manches':p=R(0,0,23,80)+R(57,0,23,80);break;case 'brassards':p=R(0,33,23,7)+R(57,33,23,7);break;
   case 'pois':for(const[x,y]of[[30,28],[50,28],[40,40],[28,52],[52,52],[40,64],[14,40],[66,40]])p+=`<circle cx="${x}" cy="${y}" r="3.6" fill="${s}"/>`;break}
  return `<svg viewBox="0 0 80 84" width="${size}" height="${size}" aria-hidden="true"><defs><clipPath id="${id}"><path d="${body}"/></clipPath><linearGradient id="${id}g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".28"/><stop offset=".55" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".3"/></linearGradient></defs>
<g clip-path="url(#${id})"><path d="${body}" fill="${m}"/>${p}<path d="${body}" fill="url(#${id}g)"/></g><path d="${body}" fill="none" stroke="#0007" stroke-width="1.6"/>
<path d="M30 13 Q40 19 50 13 L48 9 Q40 14 32 9Z" fill="${liv.cap}" stroke="#0006"/><ellipse cx="40" cy="7" rx="9" ry="6" fill="${liv.cap}" stroke="#0007" stroke-width="1.4"/><path d="M31 8 Q40 2 49 8" stroke="${s}" stroke-width="2.2" fill="none"/></svg>`}
 function random(seed,avoid=[]){let x=seed*9301+49297;const r=()=>(x=(x*16807)%2147483647)/2147483647;
  const pick=a=>a[Math.floor(r()*a.length)];let main,second;do{main=pick(COLORS)[1]}while(avoid.includes(main));do{second=pick(COLORS)[1]}while(second===main);
  return{name:'',coat:pick(COATS).id,main,second,pattern:pick(PATTERNS)[0],cap:r()<.5?main:second}}
 return{COATS,COLORS,PATTERNS,DEFAULT,ready,gallop,portrait,silkSVG,random,pattern:pat,coatLut:i=>META.coatLuts[i][36],coatSwatch:i=>{const l=META.coatLuts[i][40];return `rgb(${l[0]},${l[1]},${l[2]})`}};
})();
const escapeHTML=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
