/* ===== Cheval + jockey en 3D — anatomie sculptée par surfaces implicites (union lisse d'ellipsoïdes et de cônes arrondis),
   maillée une seule fois au chargement (« surface nets »), ombrage de pelage (occlusion ambiante cuite, poil, reflets), galop animé ===== */
const HORSE3D=(()=>{
 const V=(x,y,z=0)=>new THREE.Vector3(x,y,z);
 // ---------- primitives de sculpture (distance signée approchée) ----------
 const E=(c,r,id=0,rz=0)=>({t:0,c,r,id,cz:Math.cos(rz),sz:Math.sin(rz)});
 const C=(a,b,ra,rb,id=0,zs=1)=>({t:1,a,b,ra,rb,id,zs});
 function dist(P,x,y,z){if(P.t===0){let dx=x-P.c.x,dy=y-P.c.y,dz=z-P.c.z;if(P.sz){const u=dx*P.cz+dy*P.sz;dy=-dx*P.sz+dy*P.cz;dx=u}
   const X=dx/P.r.x,Y=dy/P.r.y,Z=dz/P.r.z,k0=Math.sqrt(X*X+Y*Y+Z*Z),k1=Math.sqrt(X*X/(P.r.x*P.r.x)+Y*Y/(P.r.y*P.r.y)+Z*Z/(P.r.z*P.r.z));return k1>1e-9?k0*(k0-1)/k1:-Math.min(P.r.x,P.r.y,P.r.z)}
  const zs=P.zs,ax=P.a.x,ay=P.a.y,az=P.a.z/zs,bx=P.b.x-ax,by=P.b.y-ay,bz=P.b.z/zs-az,px=x-ax,py=y-ay,pz=z/zs-az,L=bx*bx+by*by+bz*bz,t=Math.max(0,Math.min(1,(px*bx+py*by+pz*bz)/L)),qx=px-bx*t,qy=py-by*t,qz=pz-bz*t;
  return (Math.sqrt(qx*qx+qy*qy+qz*qz)-(P.ra+(P.rb-P.ra)*t))*Math.min(1,zs)}
 function bound(P){if(P.t===0){P.bc=P.c;P.br=Math.max(P.r.x,P.r.y,P.r.z)}else{P.bc=P.a.clone().add(P.b).multiplyScalar(.5);P.br=P.a.distanceTo(P.b)/2+Math.max(P.ra,P.rb)*Math.max(1,P.zs)}}
 function field(prims,k){prims.forEach(bound);return(x,y,z)=>{let d=1e9;for(let i=0;i<prims.length;i++){const P=prims[i],sx=x-P.bc.x,sy=y-P.bc.y,sz=z-P.bc.z,sb=Math.sqrt(sx*sx+sy*sy+sz*sz)-P.br;if(sb>d+k)continue;const e=dist(P,x,y,z),h=Math.max(k-Math.abs(d-e),0)/k;d=Math.min(d,e)-h*h*k*.25}return d}}
 function nearest(prims,x,y,z){let b=1e9,id=0;for(const P of prims){const e=dist(P,x,y,z);if(e<b){b=e;id=P.id}}return id}
 // ---------- maillage « surface nets » ----------
 function nets(f,mn,mx,h){const nx=Math.ceil((mx.x-mn.x)/h)+1,ny=Math.ceil((mx.y-mn.y)/h)+1,nz=Math.ceil((mx.z-mn.z)/h)+1,F=new Float32Array(nx*ny*nz),I=(i,j,k)=>i+nx*(j+ny*k);
  for(let k=0;k<nz;k++)for(let j=0;j<ny;j++)for(let i=0;i<nx;i++)F[I(i,j,k)]=f(mn.x+i*h,mn.y+j*h,mn.z+k*h);
  const vid=new Int32Array(nx*ny*nz).fill(-1),pos=[],idx=[],E12=[[0,1],[2,3],[4,5],[6,7],[0,2],[1,3],[4,6],[5,7],[0,4],[1,5],[2,6],[3,7]],cv=new Float32Array(8);
  for(let k=0;k<nz-1;k++)for(let j=0;j<ny-1;j++)for(let i=0;i<nx-1;i++){let m=0;for(let c=0;c<8;c++){cv[c]=F[I(i+(c&1),j+(c>>1&1),k+(c>>2&1))];if(cv[c]<0)m|=1<<c}if(m===0||m===255)continue;
   let sx=0,sy=0,sz=0,n=0;for(const[a,b]of E12){if((cv[a]<0)===(cv[b]<0))continue;const t=cv[a]/(cv[a]-cv[b]);sx+=(a&1)+((b&1)-(a&1))*t;sy+=(a>>1&1)+((b>>1&1)-(a>>1&1))*t;sz+=(a>>2&1)+((b>>2&1)-(a>>2&1))*t;n++}
   vid[I(i,j,k)]=pos.length/3;pos.push(mn.x+(i+sx/n)*h,mn.y+(j+sy/n)*h,mn.z+(k+sz/n)*h)}
  const quad=(a,b,c,d,flip)=>{if(a<0||b<0||c<0||d<0)return;flip?idx.push(a,d,c,a,c,b):idx.push(a,b,c,a,c,d)};
  for(let k=1;k<nz-1;k++)for(let j=1;j<ny-1;j++)for(let i=1;i<nx-1;i++){const s=F[I(i,j,k)]<0;
   if(s!==(F[I(i+1,j,k)]<0))quad(vid[I(i,j,k)],vid[I(i,j-1,k)],vid[I(i,j-1,k-1)],vid[I(i,j,k-1)],!s);
   if(s!==(F[I(i,j+1,k)]<0))quad(vid[I(i,j,k)],vid[I(i,j,k-1)],vid[I(i-1,j,k-1)],vid[I(i-1,j,k)],!s);
   if(s!==(F[I(i,j,k+1)]<0))quad(vid[I(i,j,k)],vid[I(i-1,j,k)],vid[I(i-1,j-1,k)],vid[I(i,j-1,k)],!s)}
  return{pos,idx}}
 // géométrie finale : normales par gradient, occlusion ambiante cuite, région par vertex
 function sculpt(prims,k,mn,mx,h,extra){const f=field(prims,k),{pos,idx}=nets(f,mn,mx,h),n=pos.length/3,nor=new Float32Array(n*3),ao=new Float32Array(n),rid=new Float32Array(n),e=h*.5;
  for(let v=0;v<n;v++){const x=pos[v*3],y=pos[v*3+1],z=pos[v*3+2];let gx=f(x+e,y,z)-f(x-e,y,z),gy=f(x,y+e,z)-f(x,y-e,z),gz=f(x,y,z+e)-f(x,y,z-e);const L=Math.hypot(gx,gy,gz)||1;gx/=L;gy/=L;gz/=L;nor.set([gx,gy,gz],v*3);
   let o=0;for(const[d,w]of[[.025,1],[.06,.6],[.12,.3]])o+=w*Math.max(0,d-f(x+gx*d,y+gy*d,z+gz*d))/d;ao[v]=Math.max(.35,1-o*.55);rid[v]=nearest(prims,x,y,z)}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('normal',new THREE.BufferAttribute(nor,3));g.setAttribute('ao',new THREE.BufferAttribute(ao,1));g.setAttribute('rid',new THREE.BufferAttribute(rid,1));
  if(extra)extra(g,pos,n);g.setIndex(idx);g.computeBoundingSphere();return g}
 // ---------- tubes (jambes, crins) ----------
 function loft(pts,rads,seg=16,caps=true,arc=[0,Math.PI*2]){const pos=[],uv=[],idx=[],n=pts.length,Z=V(0,0,1),X=V(1,0,0);
  for(let i=0;i<n;i++){const a=pts[Math.max(0,i-1)],b=pts[Math.min(n-1,i+1)],t=b.clone().sub(a).normalize();let side=Z.clone().addScaledVector(t,-t.dot(Z));if(side.lengthSq()<.01)side=X.clone().addScaledVector(t,-t.dot(X));side.normalize();const up=new THREE.Vector3().crossVectors(t,side).normalize();
   for(let j=0;j<=seg;j++){const ang=arc[0]+j/seg*(arc[1]-arc[0]),p=pts[i].clone().addScaledVector(side,Math.cos(ang)*rads[i][0]).addScaledVector(up,Math.sin(ang)*rads[i][1]);pos.push(p.x,p.y,p.z);uv.push(j/seg,i/(n-1))}}
  const R=seg+1;for(let i=0;i<n-1;i++)for(let j=0;j<seg;j++){const a=i*R+j,b=a+1,c=a+R,d=c+1;idx.push(a,b,c,b,d,c)}
  if(caps)for(const[i,flip]of[[0,1],[n-1,0]]){const ci=pos.length/3;pos.push(pts[i].x,pts[i].y,pts[i].z);uv.push(.5,i/(n-1));for(let j=0;j<seg;j++){const a=i*R+j,b=a+1;flip?idx.push(ci,b,a):idx.push(ci,a,b)}}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();return g}
 const smooth=(ctrl,steps=5)=>{const c=new THREE.CatmullRomCurve3(ctrl.map(p=>p[0]),false,'centripetal'),n=(ctrl.length-1)*steps+1,pts=c.getPoints(n-1),r=[];for(let i=0;i<n;i++){const f=i/(n-1)*(ctrl.length-1),k=Math.min(ctrl.length-2,Math.floor(f)),u=f-k,s=u*u*(3-2*u);r.push([ctrl[k][1]+(ctrl[k+1][1]-ctrl[k][1])*s,ctrl[k][2]+(ctrl[k+1][2]-ctrl[k][2])*s])}return[pts,r]};
 // attributs ao/rid pour les tubes : sombre (rid=1) sous le seuil y donné (balzanes / extrémités noires)
 const flat=(g,a=1,r=0)=>{const n=g.attributes.position.count;g.setAttribute('ao',new THREE.BufferAttribute(new Float32Array(n).fill(a),1));g.setAttribute('rid',new THREE.BufferAttribute(new Float32Array(n).fill(r),1));return g};
 function tube(ctrl,seg,darkBelow=-9,caps=true,arc){const[p,r]=smooth(ctrl);const g=loft(p,r,seg,caps,arc),P=g.attributes.position,n=P.count,ao=new Float32Array(n),rid=new Float32Array(n);
  for(let i=0;i<n;i++){const y=P.getY(i);ao[i]=.8+Math.min(.2,Math.max(0,y+.05)*.4);rid[i]=y<darkBelow?1:0}g.setAttribute('ao',new THREE.BufferAttribute(ao,1));g.setAttribute('rid',new THREE.BufferAttribute(rid,1));return g}
 // ---------- anatomie (mètres : x = avant, y = haut, z = côté ; sol à y = 0) ----------
 let GEO=null;function geo(){if(GEO)return GEO;const q=(settings&&settings.level&&settings.level()==='basse')?1.45:1,t0=performance.now();
  const BODY=[E(V(-.1,1.3),V(.55,.31,.265)),E(V(.4,1.25),V(.28,.28,.24),0,-.35),E(V(.36,1.33,.12),V(.26,.25,.12),0,-.9),E(V(.36,1.33,-.12),V(.26,.25,.12),0,-.9),
   E(V(.27,1.53),V(.24,.1,.1),0,.1),C(V(.18,1.53),V(-.5,1.53),.12,.13),E(V(-.62,1.36),V(.34,.29,.26)),E(V(-.7,1.24,.13),V(.28,.3,.13),0,.35),E(V(-.7,1.24,-.13),V(.28,.3,.13),0,.35),
   E(V(-.88,1.34),V(.14,.22,.19)),E(V(-.12,1.07),V(.5,.15,.22)),E(V(-.52,1.05,.19),V(.11,.14,.07)),E(V(-.52,1.05,-.19),V(.11,.14,.07)),C(V(-.9,1.5),V(-1.0,1.46),.07,.05),
   E(V(.46,1.02,.14),V(.1,.15,.075)),E(V(.46,1.02,-.14),V(.1,.15,.075)),E(V(-.74,1.02,.15),V(.14,.19,.09)),E(V(-.74,1.02,-.15),V(.14,.19,.09))];
  const MUZ=1;const HEAD=[C(V(.34,1.36),V(.92,1.87),.28,.135,0,.6),C(V(.4,1.63),V(.96,1.98),.095,.055,0,.55),C(V(.52,1.26),V(.98,1.73),.11,.075,0,.7),
   E(V(1.0,1.93),V(.125,.11,.105)),E(V(1.02,1.8),V(.165,.12,.098),0,-.8),C(V(1.05,1.88),V(1.28,1.64),.088,.072,0,.88),E(V(1.3,1.6),V(.088,.082,.072),MUZ,-.7),E(V(1.33,1.55),V(.055,.04,.055),MUZ,-.7)];
  const JK=[C(V(-.1,1.98),V(.26,2.07),.15,.135,0,1.25),E(V(.25,2.06),V(.09,.08,.19),0),C(V(.26,2.05,.16),V(.43,1.94,.14),.05,.042,1),C(V(.26,2.05,-.16),V(.43,1.94,-.14),.05,.042,1),
   C(V(.43,1.94,.14),V(.62,1.87,.075),.042,.035,1),C(V(.43,1.94,-.14),V(.62,1.87,-.075),.042,.035,1),E(V(.645,1.862,.07),V(.04,.035,.035),7),E(V(.645,1.862,-.07),V(.04,.035,.035),7),
   C(V(.31,2.1),V(.39,2.15),.05,.045,4),E(V(.435,2.165),V(.085,.095,.078),4),E(V(.415,2.215),V(.12,.095,.108),5),E(V(.52,2.195),V(.028,.024,.056),6),
   E(V(-.1,1.95),V(.14,.11,.15),2),C(V(-.08,1.95,.12),V(.18,1.85,.21),.078,.062,2),C(V(-.08,1.95,-.12),V(.18,1.85,-.21),.078,.062,2),
   C(V(.18,1.85,.21),V(.05,1.62,.25),.055,.042,3),C(V(.18,1.85,-.21),V(.05,1.62,-.25),.055,.042,3),C(V(.04,1.6,.255),V(.15,1.575,.255),.035,.032,3),C(V(.04,1.6,-.255),V(.15,1.575,-.255),.035,.032,3)];
  const silkUV=(g,pos,n)=>{const uv=new Float32Array(n*2);for(let v=0;v<n;v++){uv[v*2]=.5+pos[v*3+2]/.4;uv[v*2+1]=(pos[v*3]+.14)/.46}g.setAttribute('uv',new THREE.BufferAttribute(uv,2))};
  GEO={body:sculpt(BODY,.09,V(-1.12,.8,-.4),V(.8,1.74,.4),.021*q),head:sculpt(HEAD,.07,V(.02,1.02,-.2),V(1.44,2.12,.2),.018*q),jockey:sculpt(JK,.035,V(-.3,1.5,-.33),V(.74,2.36,.33),.016*q,silkUV),
   ear:flat(new THREE.ConeGeometry(.03,.13,8),.8),eye:new THREE.SphereGeometry(.026,12,8),
   upperF:tube([[V(0,.16),.085,.15],[V(.01,-.14),.078,.1],[V(0,-.4),.056,.062],[V(0,-.47),.06,.062]],14),
   lowerF:tube([[V(0,.02),.06,.06],[V(0,-.07),.04,.047],[V(0,-.29),.037,.043],[V(0,-.36),.05,.052]],12,-.2),
   upperH:tube([[V(.03,.18),.09,.19],[V(-.05,-.2),.09,.13],[V(-.11,-.44),.056,.066],[V(-.14,-.5),.062,.052]],14),
   lowerH:tube([[V(0,.02),.058,.054],[V(-.02,-.06),.04,.047],[V(0,-.33),.037,.042],[V(0,-.4),.05,.052]],12,-.2),
   pastern:tube([[V(0,.01),.05,.052],[V(.03,-.06),.038,.04],[V(.05,-.12),.04,.044]],10,9),
   hoof:new THREE.CylinderGeometry(.048,.06,.08,14),
   mane:[0,1,2,3,4].map(s=>tube([[V(.47+s*.1,1.66+s*.068,0),.012,.035],[V(.5+s*.1,1.58+s*.068,.03),.01,.03],[V(.52+s*.1,1.52+s*.068,.05),.006,.015]],6,9)),
   forelock:tube([[V(1.02,2.03,0),.012,.03],[V(1.1,1.97,0),.01,.025],[V(1.14,1.9,0),.005,.012]],6,9),
   tail:[-.025,-.008,.008,.025].map((z,s)=>tube([[V(0,0,z*.5),.05,.04],[V(-.12,-.08,z*1.2),.075,.05],[V(-.22,-.3,z*1.6),.085,.045],[V(-.27-s*.015,-.56,z*2),.07,.035],[V(-.28-s*.02,-.78+s*.02,z*2.4),.025,.012]],8,9)),
   cloth:tube([[V(-.36,1.345),.315,.33],[V(-.1,1.305),.322,.357],[V(.18,1.305),.312,.362]],28,-9,false,[-.3,Math.PI+.3]),
   saddle:tube([[V(-.18,1.665),.14,.03],[V(0,1.655),.15,.035],[V(.14,1.685),.12,.03]],12),
   iron:new THREE.TorusGeometry(.035,.008,6,12),strap:new THREE.CylinderGeometry(.006,.006,1,5),
   nose:new THREE.TorusGeometry(.085,.012,6,20),brow:new THREE.TorusGeometry(.1,.011,6,20),rein:new THREE.CylinderGeometry(.007,.007,1,5).translate(0,.5,0).rotateZ(-Math.PI/2),
   blink:new THREE.SphereGeometry(.05,12,8,0,Math.PI*2,0,Math.PI*.5)};
  GEO.ms=Math.round(performance.now()-t0);return GEO}
 // ---------- matériaux ----------
 const NOISE3='float h3(vec3 p){return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453);}float n3(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(mix(h3(i),h3(i+vec3(1,0,0)),f.x),mix(h3(i+vec3(0,1,0)),h3(i+vec3(1,1,0)),f.x),f.y),mix(mix(h3(i+vec3(0,0,1)),h3(i+vec3(1,0,1)),f.x),mix(h3(i+vec3(0,1,1)),h3(i+vec3(1,1,1)),f.x),f.y),f.z);}';
 // pelage : couleur de robe + extrémités sombres + occlusion + poil fin + pommelures (gris)
 function coatMat(col,dark,dapple){const m=new THREE.MeshPhysicalMaterial({color:col,roughness:.46,sheen:.7,sheenRoughness:.35,sheenColor:new THREE.Color(0xfff0d8),clearcoat:.22,clearcoatRoughness:.45});
  m.onBeforeCompile=s=>{s.uniforms.uDark={value:dark};s.uniforms.uDap={value:dapple?1:0};
   s.vertexShader='attribute float ao;attribute float rid;varying float vAo;varying float vRid;varying vec3 vObj;\n'+s.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvAo=ao;vRid=rid;vObj=position;');
   s.fragmentShader='uniform vec3 uDark;uniform float uDap;varying float vAo;varying float vRid;varying vec3 vObj;\n'+NOISE3+'\n'+s.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
    {float hair=n3(vObj*vec3(38.,160.,38.))*.5+n3(vObj*9.)*.5;diffuseColor.rgb=mix(diffuseColor.rgb,uDark,clamp(vRid,0.,1.));
     float top=smoothstep(1.05,1.6,vObj.y);diffuseColor.rgb*=mix(.9,1.06,top)*mix(.93,1.05,hair);
     if(uDap>.5){float d=smoothstep(.5,.72,n3(vObj*11.));diffuseColor.rgb=mix(diffuseColor.rgb,diffuseColor.rgb*1.28,d*.55*(1.-vRid));}
     diffuseColor.rgb*=pow(vAo,1.3);}`)};return m}
 // jockey : casaque (texture à motif) + manches, culotte blanche, bottes, peau, toque, lunettes, gants
 function jockeyMat(tex,cols){const m=new THREE.MeshStandardMaterial({map:tex,roughness:.42,metalness:.02});
  m.onBeforeCompile=s=>{s.uniforms.uCols={value:cols};
   s.vertexShader='attribute float ao;attribute float rid;varying float vAo;flat varying float vRid;\n'+s.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvAo=ao;vRid=rid;');
   s.fragmentShader='uniform vec3 uCols[8];varying float vAo;flat varying float vRid;\n'+s.fragmentShader.replace('#include <map_fragment>',`vec4 sT=texture2D(map,vMapUv);int r=int(vRid+.5);vec3 c=uCols[0];
    for(int i=1;i<8;i++){if(i==r)c=uCols[i];}diffuseColor.rgb=(r==0?sT.rgb:c)*pow(vAo,1.2);`).replace('#include <roughnessmap_fragment>','#include <roughnessmap_fragment>\nif(int(vRid+.5)==5||int(vRid+.5)==6)roughnessFactor=.18;if(int(vRid+.5)==3)roughnessFactor=.3;')};return m}
 const HAIR={bai:0x120c09,noir:0x0b0a0a,alezan:0x5a2410,gris:0x4a4a4e,baibrun:0x0e0a08,palomino:0xf2e6c4};
 const POINTS={bai:true,noir:true,baibrun:true,gris:true};
 function silkTexture(liv){const c=document.createElement('canvas');c.width=c.height=256;const x=c.getContext('2d'),img=x.createImageData(256,256),m=hexRGB(liv.main),s=hexRGB(liv.second),pat=LIVERY.pattern;
  for(let j=0;j<256;j++)for(let i=0;i<256;i++){const u=i/256,v=j/256,alt=pat(liv.pattern,u,v),c2=alt?s:m,k=((255-j)*256+i)*4,fold=.93+.07*Math.sin(u*40+v*9);img.data[k]=c2[0]*fold;img.data[k+1]=c2[1]*fold;img.data[k+2]=c2[2]*fold;img.data[k+3]=255}
  x.putImageData(img,0,0);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;return t}
 function clothTexture(liv,num){const c=document.createElement('canvas');c.width=512;c.height=128;const x=c.getContext('2d');x.fillStyle=liv.main;x.fillRect(0,0,512,128);x.fillStyle=liv.second;x.fillRect(0,0,512,10);x.fillRect(0,118,512,10);
  x.fillStyle='#fff';x.font='900 64px Georgia,serif';x.textAlign='center';x.textBaseline='middle';for(const cx of[128,384]){x.save();x.translate(cx,64);x.scale(cx<256?1:-1,1);x.fillText(String(num||1),0,4);x.restore()}
  const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t}
 const hexRGB=h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16));
 const lin=h=>new THREE.Color(h);
 function coatColor(liv){const i=Math.max(0,LIVERY.COATS.findIndex(c=>c.id===liv.coat)),l=LIVERY.coatLut(i);return new THREE.Color().setRGB(l[0]/255,l[1]/255,l[2]/255,THREE.SRGBColorSpace)}
 // ---------- assemblage ----------
 function build(liv,opt={}){const G=geo(),root=new THREE.Group(),body=new THREE.Group();root.add(body);const pts=POINTS[liv.coat],dk=lin(HAIR[liv.coat]||0x120c09);
  const coat=coatMat(coatColor(liv),pts?dk:coatColor(liv).multiplyScalar(.6),liv.coat==='gris'),
   hair=new THREE.MeshStandardMaterial({color:HAIR[liv.coat]||0x120c09,roughness:.62,metalness:0}),hoof=new THREE.MeshStandardMaterial({color:0x2a2420,roughness:.55}),
   silkTex=silkTexture(liv),cols=[lin(liv.main),lin(liv.pattern==='manches'?liv.second:liv.main),lin(0xf1efe8),lin(0x141312),lin(0xc98f6d),lin(liv.cap),lin(0x1a1f24),lin(0xf4f2ec)],jk=jockeyMat(silkTex,cols),
   clothTex=clothTexture(liv,opt.number),cloth=new THREE.MeshStandardMaterial({map:clothTex,roughness:.85,side:THREE.DoubleSide}),leather=new THREE.MeshStandardMaterial({color:0x2a1a10,roughness:.45}),
   steel=new THREE.MeshStandardMaterial({color:0xc9ccd0,roughness:.25,metalness:.9}),eye=new THREE.MeshPhysicalMaterial({color:0x0a0706,roughness:.05,clearcoat:1}),capM=new THREE.MeshStandardMaterial({color:liv.cap,roughness:.35});
  const M=(g,m,parent=body)=>{const o=new THREE.Mesh(g,m);o.castShadow=true;parent.add(o);return o};
  M(G.body,coat);M(G.cloth,cloth);M(G.saddle,leather);
  const neck=new THREE.Group();neck.position.set(.55,1.5,0);body.add(neck);const nb=new THREE.Group();nb.position.set(-.55,-1.5,0);neck.add(nb);
  M(G.head,coat,nb);G.mane.forEach(g=>M(g,hair,nb));M(G.forelock,hair,nb);
  for(const z of[-.05,.05]){const e=M(G.ear,coat,nb);e.position.set(.99,2.07,z*1.2);e.rotation.set(z*3,0,-.35);const ey=M(G.eye,eye,nb);ey.position.set(1.1,1.915,z*1.72)}
  // bride : muserolle, frontal, rênes jusqu'aux mains du jockey
  const nose=M(G.nose,leather,nb);nose.position.set(1.25,1.68,0);nose.rotation.set(0,Math.PI/2,.72);nose.scale.set(1,.95,1.05);const brow=M(G.brow,leather,nb);brow.position.set(1.02,1.99,0);brow.rotation.set(0,Math.PI/2,.35);brow.scale.set(1.02,.55,1);
  if(opt.blinkers)for(const z of[-1,1]){const b=M(G.blink,capM,nb);b.position.set(1.08,1.93,z*.1);b.rotation.set(z*-Math.PI/2,0,0)}
  const reins=[-1,1].map(z=>M(G.rein,leather,body));
  const tail=new THREE.Group();tail.position.set(-.99,1.47,0);body.add(tail);G.tail.forEach(g=>M(g,hair,tail));
  // jambes : épaule/hanche -> genou/jarret -> boulet
  const legs=[];for(const[fore,x,z,ph]of[[1,.46,.135,.52],[1,.46,-.135,.40],[0,-.74,.14,.12],[0,-.74,-.14,0]]){const hip=new THREE.Group();hip.position.set(x,fore?1.07:1.13,z);body.add(hip);
   M(fore?G.upperF:G.upperH,coat,hip);const knee=new THREE.Group();knee.position.set(fore?0:-.13,fore?-.46:-.5,0);hip.add(knee);M(fore?G.lowerF:G.lowerH,coat,knee);
   const fet=new THREE.Group();fet.position.set(0,fore?-.36:-.4,0);knee.add(fet);M(G.pastern,coat,fet);const h=M(G.hoof,hoof,fet);h.position.set(.055,-.15,0);h.rotation.z=-.12;legs.push({hip,knee,fet,fore,ph})}
  // jockey + étriers
  const jg=new THREE.Group();body.add(jg);M(G.jockey,jk,jg);for(const z of[-.26,.26]){const ir=M(G.iron,steel,jg);ir.position.set(.1,1.56,z);ir.rotation.y=Math.PI/2;const st=M(G.strap,leather,jg);st.position.set(.02,1.61,z*.97);st.scale.y=.12;st.rotation.z=.4}
  root.userData={body,neck,tail,legs,jk:jg,reins,mats:[coat,hair,hoof,jk,cloth,leather,steel,eye,capM],texs:[silkTex,clothTex]};pose(root,0,0);return root}
 // ---------- galop (4 temps) ----------
 const _a=new THREE.Vector3(),_b=new THREE.Vector3(),X1=new THREE.Vector3(1,0,0);
 function pose(root,p,run=1){const u=root.userData,TAU=Math.PI*2,st=.34;
  u.body.position.y=Math.sin(p*TAU*2)*.045*run;u.body.rotation.z=Math.sin(p*TAU+.6)*.05*run;u.neck.rotation.z=Math.sin(p*TAU+2.2)*.13*run-.04;
  u.tail.rotation.z=-.25-Math.sin(p*TAU)*.14*run-run*.4;u.tail.rotation.x=Math.sin(p*TAU*.5)*.08*run;
  u.jk.position.y=-u.body.position.y*.75;u.jk.position.x=Math.sin(p*TAU*2+.8)*.012*run;u.jk.rotation.z=-u.body.rotation.z*.85;
  for(const L of u.legs){const q=((p-L.ph)%1+1)%1,A=(L.fore?.55:.5)*run;let a,flex;if(q<st){a=A-2*A*(q/st);flex=0}else{const s=(q-st)/(1-st);a=-A+2*A*(s*s*(3-2*s));flex=Math.sin(s*Math.PI)}
   L.hip.rotation.z=a+(L.fore?0:.08);L.knee.rotation.z=L.fore?-flex*1.5*run:.45+flex*.9*run;L.fet.rotation.z=L.fore?-flex*.9*run+(q<st?.25*run*Math.sin(q/st*Math.PI):0):-.45-flex*.9*run}
  // rênes : du mors (tête) aux mains (jockey)
  const c=Math.cos(u.neck.rotation.z),s=Math.sin(u.neck.rotation.z);u.reins.forEach((r,k)=>{const z=k?.07:-.07;const bx=1.34-.55,by=1.63-1.5;_a.set(.55+bx*c-by*s,1.5+bx*s+by*c,z*1.05);_b.set(.64+u.jk.position.x,1.862+u.jk.position.y,z);
   const d=_b.sub(_a),L=d.length();r.position.copy(_a);r.scale.set(L,1,1);r.quaternion.setFromUnitVectors(X1,d.divideScalar(L))})}
 return{build,pose,geo,dispose(root){root.userData.mats.forEach(m=>m.dispose());root.userData.texs.forEach(t=>t.dispose())}}})();
if(window.THREE)setTimeout(()=>{try{HORSE3D.geo()}catch(e){}},3500);
