/* ===== Cheval + jockey en 3D (procédural, animé au galop) — utilisé quand la caméra voit le peloton de côté ou d'en haut ===== */
const HORSE3D=(()=>{
 const V=(x,y,z=0)=>new THREE.Vector3(x,y,z);
 // tube à sections elliptiques le long d'une polyligne (rw = demi-largeur latérale, rh = demi-hauteur)
 function loft(pts,rads,seg=16,caps=true,arc=[0,Math.PI*2]){const pos=[],uv=[],idx=[],n=pts.length,Z=V(0,0,1),X=V(1,0,0);
  for(let i=0;i<n;i++){const a=pts[Math.max(0,i-1)],b=pts[Math.min(n-1,i+1)],t=b.clone().sub(a).normalize();
   let side=Z.clone().addScaledVector(t,-t.dot(Z));if(side.lengthSq()<.01)side=X.clone().addScaledVector(t,-t.dot(X));side.normalize();const up=new THREE.Vector3().crossVectors(t,side).normalize();
   for(let j=0;j<=seg;j++){const ang=arc[0]+j/seg*(arc[1]-arc[0]),p=pts[i].clone().addScaledVector(side,Math.cos(ang)*rads[i][0]).addScaledVector(up,Math.sin(ang)*rads[i][1]);pos.push(p.x,p.y,p.z);uv.push(j/seg,i/(n-1))}}
  const R=seg+1;for(let i=0;i<n-1;i++)for(let j=0;j<seg;j++){const a=i*R+j,b=a+1,c=a+R,d=c+1;idx.push(a,b,c,b,d,c)}
  if(caps){for(const[i,flip]of[[0,1],[n-1,0]]){const ci=pos.length/3;pos.push(pts[i].x,pts[i].y,pts[i].z);uv.push(.5,i/(n-1));for(let j=0;j<seg;j++){const a=i*R+j,b=a+1;flip?idx.push(ci,b,a):idx.push(ci,a,b)}}}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();return g}
 const smooth=(ctrl,steps=6)=>{const c=new THREE.CatmullRomCurve3(ctrl.map(p=>p[0]),false,'centripetal');const n=(ctrl.length-1)*steps+1,pts=c.getPoints(n-1),r=[];for(let i=0;i<n;i++){const f=i/(n-1)*(ctrl.length-1),k=Math.min(ctrl.length-2,Math.floor(f)),u=f-k,s=u*u*(3-2*u);r.push([ctrl[k][1]+(ctrl[k+1][1]-ctrl[k][1])*s,ctrl[k][2]+(ctrl[k+1][2]-ctrl[k][2])*s])}return[pts,r]};
 const shape=(ctrl,seg,caps,arc)=>{const[p,r]=smooth(ctrl);return loft(p,r,seg,caps,arc)};
 // ---------- géométries partagées (mètres, x = avant, y = haut, z = côté) ----------
 let GEO=null;function geo(){if(GEO)return GEO;GEO={
  body:shape([[V(-.99,1.34),.1,.12],[V(-.92,1.37),.23,.24],[V(-.74,1.37),.29,.3],[V(-.45,1.33),.3,.32],[V(-.1,1.28),.31,.35],[V(.25,1.28),.3,.36],[V(.5,1.32),.26,.34],[V(.68,1.38),.19,.27],[V(.77,1.43),.09,.13]],20),
  neck:shape([[V(.42,1.44),.16,.3],[V(.66,1.6),.13,.25],[V(.88,1.78),.1,.17],[V(1.02,1.9),.085,.13]],16),
  head:shape([[V(.98,1.96),.075,.09],[V(1.08,1.92),.08,.12],[V(1.22,1.78),.068,.095],[V(1.34,1.64),.055,.07],[V(1.39,1.58),.045,.05]],14),
  ear:new THREE.ConeGeometry(.028,.12,6),
  upperF:shape([[V(0,.08),.08,.12],[V(0,-.2),.065,.085],[V(0,-.46),.042,.052]],10),
  lowerF:shape([[V(0,0),.04,.045],[V(0,-.33),.03,.034],[V(0,-.37),.036,.04]],8),
  upperH:shape([[V(.02,.1),.1,.16],[V(-.06,-.22),.08,.11],[V(-.12,-.5),.045,.06]],10),
  lowerH:shape([[V(0,0),.042,.048],[V(0,-.36),.03,.034],[V(0,-.4),.036,.04]],8),
  pastern:shape([[V(0,0),.034,.036],[V(.04,-.11),.031,.033]],8),
  hoof:new THREE.CylinderGeometry(.042,.052,.07,10),
  tail:shape([[V(0,0),.05,.05],[V(-.12,-.1),.08,.05],[V(-.24,-.3),.1,.05],[V(-.3,-.55),.09,.035],[V(-.32,-.7),.04,.02]],10),
  mane:shape([[V(.5,1.64),.02,.04],[V(.72,1.8),.025,.06],[V(.9,1.94),.02,.05],[V(1.0,2.0),.01,.02]],6),
  cloth:shape([[V(-.34,1.335),.32,.335],[V(-.1,1.29),.325,.365],[V(.2,1.29),.315,.37]],24,false,[-.35,Math.PI+.35]),
  saddle:shape([[V(-.2,1.68),.15,.035],[V(0,1.67),.16,.04],[V(.15,1.7),.13,.035]],10),
  torso:shape([[V(-.14,1.97),.15,.11],[V(.04,2.02),.17,.12],[V(.2,2.06),.16,.11],[V(.3,2.08),.1,.08]],14,true),
  head2:new THREE.SphereGeometry(.1,16,12),helmet:new THREE.SphereGeometry(.113,16,10,0,Math.PI*2,0,Math.PI*.55),peak:new THREE.BoxGeometry(.08,.01,.14),
  arm:shape([[V(0,0),.05,.05],[V(.16,-.1),.042,.042],[V(.32,-.22),.035,.035]],8),
  thigh:shape([[V(0,0),.085,.08],[V(.18,-.08),.07,.068],[V(.32,-.13),.058,.058]],8),
  shin:shape([[V(0,0),.055,.055],[V(-.1,-.16),.048,.048],[V(-.17,-.28),.045,.045]],8),
  boot:new THREE.BoxGeometry(.2,.07,.08)};return GEO}
 // ---------- matériaux ----------
 const HAIR={bai:0x17110e,noir:0x100f0f,alezan:0x6e2c10,gris:0x8a8a8c,baibrun:0x120d0b,palomino:0xe6d6ac};
 const POINTS={bai:true,noir:true,baibrun:true};
 function silkTexture(liv){const c=document.createElement('canvas');c.width=c.height=256;const x=c.getContext('2d'),img=x.createImageData(256,256),m=hexRGB(liv.main),s=hexRGB(liv.second),pat=LIVERY.pattern;
  for(let j=0;j<256;j++)for(let i=0;i<256;i++){const u=(i/256*2)%1,v=j/256,alt=pat(liv.pattern,u,v),c2=alt?s:m,k=(j*256+i)*4;img.data[k]=c2[0];img.data[k+1]=c2[1];img.data[k+2]=c2[2];img.data[k+3]=255}
  x.putImageData(img,0,0);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t}
 const hexRGB=h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16));
 function coatColor(liv){const i=Math.max(0,LIVERY.COATS.findIndex(c=>c.id===liv.coat)),l=LIVERY.coatLut(i);return new THREE.Color().setRGB(l[0]/255,l[1]/255,l[2]/255,THREE.SRGBColorSpace)}
 // ---------- assemblage ----------
 function build(liv){const G=geo(),root=new THREE.Group(),body=new THREE.Group();root.add(body);
  const coat=new THREE.MeshPhysicalMaterial({color:coatColor(liv),roughness:.5,sheen:.6,sheenRoughness:.4,sheenColor:new THREE.Color(0xfff2dc)}),
   hair=new THREE.MeshStandardMaterial({color:HAIR[liv.coat]||0x17110e,roughness:.85}),leg=POINTS[liv.coat]?hair:coat,
   hoof=new THREE.MeshStandardMaterial({color:0x2c2622,roughness:.7}),silkTex=silkTexture(liv),
   silk=new THREE.MeshStandardMaterial({map:silkTex,roughness:.38,metalness:.05}),sleeve=new THREE.MeshStandardMaterial({color:liv.pattern==='manches'?liv.second:liv.main,roughness:.4}),
   white=new THREE.MeshStandardMaterial({color:0xf2f0ea,roughness:.6}),black=new THREE.MeshStandardMaterial({color:0x121212,roughness:.45}),
   capM=new THREE.MeshStandardMaterial({color:liv.cap,roughness:.35}),skin=new THREE.MeshStandardMaterial({color:0xd9a784,roughness:.7}),
   cloth=new THREE.MeshStandardMaterial({color:liv.main,roughness:.8}),leather=new THREE.MeshStandardMaterial({color:0x3a2416,roughness:.6});
  const M=(g,m,parent=body)=>{const o=new THREE.Mesh(g,m);o.castShadow=true;parent.add(o);return o};
  M(G.body,coat);const neck=new THREE.Group();neck.position.set(.55,1.5,0);body.add(neck);
  const nk=M(G.neck,coat,neck);nk.position.set(-.55,-1.5,0);const hd=M(G.head,coat,neck);hd.position.set(-.55,-1.5,0);const mn=M(G.mane,hair,neck);mn.position.set(-.55,-1.5,0);
  for(const z of[-.045,.045]){const e=M(G.ear,coat,neck);e.position.set(1.0-.55,2.05-1.5,z);e.rotation.z=-.5}
  const cl=M(G.cloth,cloth);cl.material.side=THREE.DoubleSide;M(G.saddle,leather);
  const tail=new THREE.Group();tail.position.set(-.97,1.34,0);body.add(tail);M(G.tail,hair,tail);
  // jambes : hanche/épaule -> genou/jarret -> boulet
  const legs=[];for(const[fore,x,z,ph]of[[1,.5,.15,.52],[1,.5,-.15,.40],[0,-.74,.16,.12],[0,-.74,-.16,0]]){const hip=new THREE.Group();hip.position.set(x,fore?1.07:1.13,z);body.add(hip);
   M(fore?G.upperF:G.upperH,coat,hip);const knee=new THREE.Group();knee.position.set(fore?0:-.12,fore?-.46:-.5,0);hip.add(knee);M(fore?G.lowerF:G.lowerH,leg,knee);
   const fet=new THREE.Group();fet.position.set(0,fore?-.37:-.4,0);knee.add(fet);M(G.pastern,leg,fet);const h=M(G.hoof,hoof,fet);h.position.set(.045,-.14,0);legs.push({hip,knee,fet,fore,ph})}
  // jockey
  const jk=new THREE.Group();body.add(jk);M(G.torso,silk,jk);const head=M(G.head2,skin,jk);head.position.set(.4,2.13,0);const hm=M(G.helmet,capM,jk);hm.position.set(.4,2.15,0);hm.rotation.z=-.35;const pk=M(G.peak,capM,jk);pk.position.set(.5,2.14,0);pk.rotation.z=-.3;
  for(const z of[-.15,.15]){const a=M(G.arm,sleeve,jk);a.position.set(.24,2.04,z*.95);const th=M(G.thigh,white,jk);th.position.set(-.1,1.92,z*1.25);
   const sh=M(G.shin,white,jk);sh.position.set(.22,1.79,z*1.5);const bt=M(G.boot,black,jk);bt.position.set(.07,1.5,z*1.55);bt.rotation.z=-.1}
  root.userData={body,neck,tail,legs,jk,mats:[coat,hair,hoof,silk,sleeve,white,black,capM,skin,cloth,leather],silkTex};return root}
 // ---------- galop (4 temps) ----------
 function pose(root,p,run=1){const u=root.userData,TAU=Math.PI*2,st=.34;
  u.body.position.y=Math.sin(p*TAU*2)*.045*run;u.body.rotation.z=Math.sin(p*TAU+.6)*.06*run;u.neck.rotation.z=Math.sin(p*TAU+2.2)*.14*run-.05;u.tail.rotation.z=-.35-Math.sin(p*TAU)*.12*run-run*.25;
  u.jk.position.y=-u.body.position.y*.7;u.jk.rotation.z=-u.body.rotation.z*.8;
  for(const L of u.legs){const q=((p-L.ph)%1+1)%1,A=(L.fore?.55:.5)*run;let a,flex;if(q<st){a=A-2*A*(q/st);flex=0}else{const s=(q-st)/(1-st);a=-A+2*A*(s*s*(3-2*s));flex=Math.sin(s*Math.PI)}
   L.hip.rotation.z=a+(L.fore?0:.08);L.knee.rotation.z=L.fore?-flex*1.5*run:.45+flex*.9*run;L.fet.rotation.z=L.fore?-flex*.9*run:-.45-flex*.9*run}}
 return{build,pose,dispose(root){root.userData.mats.forEach(m=>m.dispose());root.userData.silkTex.dispose()}}})();
