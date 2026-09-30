/* ===== Course — réalisme : ciel et nuages, gazon, monde 3D (09-race-world), chevaux 3D articulés, ombres qui suivent la caméra, mottes, post-traitement ===== */
let racePlayer=null;
const raceFX=(()=>{
 const NOISE=`float rfxH(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}
float rfxN(vec2 p){vec2 i=floor(p),f=fract(p);vec2 u=f*f*(3.-2.*f);return mix(mix(rfxH(i),rfxH(i+vec2(1,0)),u.x),mix(rfxH(i+vec2(0,1)),rfxH(i+vec2(1,1)),u.x),u.y);}
float rfxF(vec2 p){float s=0.,a=.5;for(int i=0;i<4;i++){s+=a*rfxN(p);p*=2.03;a*=.5;}return s;}
`;
 const HSV=`vec3 rfxHsv(vec3 c){vec4 K=vec4(0.,-1./3.,2./3.,-1.);vec4 p=mix(vec4(c.bg,K.wz),vec4(c.gb,K.xy),step(c.b,c.g));vec4 q=mix(vec4(p.xyw,c.r),vec4(c.r,p.yzx),step(p.x,c.r));float d=q.x-min(q.w,q.y);return vec3(abs(q.z+(q.w-q.y)/(6.*d+1e-10)),d/(q.x+1e-10),q.x);}
`;
 // casaques (linéaire) : joueur = bleu roi/or d'origine ; rivaux recolorés
 const SILKS=[null,[.55,.02,.03],[.02,.26,.07],[.26,.05,.38],[.8,.3,.02],[.035,.035,.035]];
 const COATS=[1,.55,1.12,.78,1.04,.66];
 const F=[{x0:.007,x1:.2233,y0:.257,y1:.797},{x0:.2233,x1:.444,y0:.3425,y1:.811},{x0:.4374,x1:.650,y0:.2251,y1:.8329},{x0:.6545,x1:.704,y0:.105,y1:.8425},{x0:.7049,x1:.8057,y0:.4945,y1:.8439},{x0:.8089,x1:.994,y0:.4323,y1:.8301}];
 let fx=null;
 const load=(url,cb)=>{const t=new THREE.TextureLoader().load(url,cb);t.colorSpace=THREE.SRGBColorSpace;return t};
 function radialTex(inner='rgba(0,0,0,.85)',size=128){const c=document.createElement('canvas');c.width=c.height=size;const x=c.getContext('2d'),g=x.createRadialGradient(size/2,size/2,0,size/2,size/2,size/2);g.addColorStop(0,inner);g.addColorStop(.55,inner.replace(/[\d.]+\)$/,'0.35)'));g.addColorStop(1,'rgba(0,0,0,0)');x.fillStyle=g;x.fillRect(0,0,size,size);return new THREE.CanvasTexture(c)}
 function blob(scene,w,l,op){const m=new THREE.Mesh(new THREE.PlaneGeometry(w,l).rotateX(-Math.PI/2),new THREE.MeshBasicMaterial({map:fx.shadowTex,transparent:true,opacity:op,depthWrite:false,color:0x000000,polygonOffset:true,polygonOffsetFactor:-2}));m.renderOrder=1;scene.add(m);return m}
 function sky(scene,sunDir){const mat=new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,depthTest:false,fog:false,uniforms:{uSun:{value:sunDir},uZen:{value:new THREE.Vector3(.035,.14,.46)},uMid:{value:new THREE.Vector3(.08,.28,.68)},uHor:{value:new THREE.Vector3(.42,.6,.78)},uSunC:{value:new THREE.Vector3(1,.86,.62)},uSunK:{value:1},uTime:{value:0},uCloud:{value:.4},uNight:{value:0}},
   vertexShader:'varying vec3 vD;void main(){vD=normalize(position);vec4 p=projectionMatrix*modelViewMatrix*vec4(position,1.);gl_Position=p.xyww;}',
   // nuages : bruit fractal projeté sur un plafond, couverture selon la météo (uCloud), éclairés côté soleil
   fragmentShader:'uniform vec3 uSun,uZen,uMid,uHor,uSunC;uniform float uSunK,uTime,uCloud,uNight;varying vec3 vD;\n'+NOISE+'void main(){float h=clamp(vD.y,0.,1.);vec3 c=mix(uHor,uMid,smoothstep(0.,.3,h));c=mix(c,uZen,smoothstep(.3,1.,h));float s=max(dot(vD,uSun),0.);c+=uSunC*(pow(s,900.)*14.+pow(s,24.)*.28+pow(s,4.)*.06)*uSunK;'+
    'vec2 cp=vD.xz/(vD.y+.1)*1.3+vec2(uTime*.008,uTime*.003);float n=rfxF(cp)*.7+rfxF(cp*3.1+5.)*.3,cov=smoothstep(1.02-uCloud,1.3-uCloud,n)*smoothstep(0.,.14,vD.y);vec3 cc=mix(vec3(.58,.62,.7),vec3(1.,.98,.95),smoothstep(.35,.85,rfxF(cp*1.8+2.)))*mix(vec3(1.),uHor*1.4,.3)+uSunC*pow(s,6.)*.35*uSunK;c=mix(c,cc*mix(1.,.18,uNight),cov*.92);'+
    // étoiles la nuit (masquées par les nuages)
    'vec3 sd=floor(vD*420.);float st=step(.9985,rfxH(sd.xy+sd.z*7.13))*smoothstep(.05,.3,vD.y)*(1.-cov);c+=vec3(.9,.95,1.)*st*uNight*(.6+.4*sin(uTime*3.+sd.x));gl_FragColor=vec4(c,1.);}'});fx.skyMat=mat;
  const m=new THREE.Mesh(new THREE.SphereGeometry(1500,32,16),mat);m.renderOrder=-10;m.frustumCulled=false;scene.add(m)}
 function horizon(scene){const R=900,Hc=R*2*Math.PI/3*486/1912;const t=load('assets/race/horizon.webp');t.wrapS=THREE.RepeatWrapping;t.repeat.set(-3,1);t.anisotropy=8;
  const m=new THREE.Mesh(new THREE.CylinderGeometry(R,R,Hc,128,1,true),new THREE.MeshBasicMaterial({map:t,side:THREE.BackSide,transparent:true,depthWrite:false,fog:false,color:0xf2f2f2}));m.position.y=Hc/2-10;m.renderOrder=-5;scene.add(m);fx.horizonMat=m.material}
 function turfMaterial(renderer,track){const t=load('assets/race/grass.webp');t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=renderer.capabilities.getMaxAnisotropy();
  const rep=track?new THREE.Vector2(4.2,6.1):new THREE.Vector2(220,220);t.repeat.copy(rep);
  const mat=new THREE.MeshStandardMaterial({map:t,roughness:1,color:track?0xf4ffe6:0xe8f0dc});
  mat.onBeforeCompile=s=>{s.uniforms.uRep={value:rep};s.vertexShader='varying vec3 vW;\n'+s.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvW=(modelMatrix*vec4(position,1.)).xyz;');
   s.fragmentShader='varying vec3 vW;uniform vec2 uRep;\n'+NOISE+s.fragmentShader.replace('#include <map_fragment>','#include <map_fragment>\n'+(track?
    `{vec2 tu=vMapUv/uRep;float bf=fract(tu.y*3.06),band=smoothstep(.47,.53,bf)*(1.-smoothstep(.97,1.,bf));diffuseColor.rgb*=mix(.87,1.1,band);float wear=exp(-pow((tu.x-.16)/.11,2.));float div=smoothstep(.62,.8,rfxF(vW.xz*.55));diffuseColor.rgb=mix(diffuseColor.rgb,diffuseColor.rgb*vec3(1.12,.94,.7),wear*.32);diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.16,.11,.06),div*wear*.55);diffuseColor.rgb*=mix(.9,1.06,rfxF(vW.xz*.008));float near=1.-smoothstep(8.,70.,distance(vW,cameraPosition));float bl=rfxF(vW.xz*vec2(2.6,2.6))*.55+rfxF(vW.xz*9.)*.45;diffuseColor.rgb*=mix(1.,mix(.84,1.12,bl),near);float clod=smoothstep(.8,.9,rfxF(vW.xz*1.7+11.))*wear;diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.2,.14,.08),clod*near*.7);}`:
    `{float m=rfxF(vW.xz*.005),m2=rfxF(vW.xz*.035+7.),dry=smoothstep(.56,.78,rfxF(vW.xz*.011+3.));diffuseColor.rgb*=mix(.74,1.1,m)*mix(.92,1.05,m2);diffuseColor.rgb=mix(diffuseColor.rgb,diffuseColor.rgb*vec3(1.16,1.04,.72),dry*.55);}`))};
  return mat}
 function ground(scene,renderer){const turf=new THREE.Mesh(new THREE.PlaneGeometry(2200,2200),turfMaterial(renderer,false));turf.rotation.x=-Math.PI/2;turf.position.y=-.1;turf.receiveShadow=true;scene.add(turf);
  const track=new THREE.Mesh(ribbonGeometry(-21,21,0,520),turfMaterial(renderer,true));track.receiveShadow=true;scene.add(track)}
 function billboards(scene,renderer){const list=[];const add=(frame,t,off,h,flip)=>list.push({frame,t,off,h,flip});
  for(const [t,off] of[[.105,86],[.16,86]])add(0,t,off,64,false);
  add(1,.215,74,30,false);add(5,.045,70,20,false);add(5,.012,66,18,true);add(4,RACE_ORIGIN+.004,-34,19,false);
  for(const t of[.16,.34,.56,.74,.91])add(3,t,62,56,t>.5);
  let seed=91;const rnd=()=>{seed=(seed*16807)%2147483647;return seed/2147483647};
  for(let t=0;t<1;t+=.016){const home=t>.07&&t<.24;add(2,(t+rnd()*.006)%1,(home?150:112)+rnd()*60,34+rnd()*16,rnd()<.5)}
  for(let t=.02;t<1;t+=.05)add(2,t,-78-rnd()*36,28+rnd()*12,rnd()<.5);
  load('assets/trackside-world-atlas.webp',atlas=>{atlas.anisotropy=8;const texs={};
   const texFor=(i,flip)=>{const k=i+(flip?'f':'');if(texs[k])return texs[k];const t=atlas.clone();const f=F[i];t.repeat.set((f.x1-f.x0)*(flip?-1:1),f.y1-f.y0);t.offset.set(flip?f.x1:f.x0,1-f.y1);t.needsUpdate=true;return texs[k]=t};
   for(const b of list){const f=F[b.frame],asp=((f.x1-f.x0)*2172)/((f.y1-f.y0)*724),w=b.h*asp,pose=trackPose(b.t,b.off);
    const m=new THREE.Mesh(new THREE.PlaneGeometry(w,b.h).translate(0,b.h/2,0),new THREE.MeshBasicMaterial({map:texFor(b.frame,b.flip),alphaTest:.5,side:THREE.DoubleSide,color:0xdedede}));
    m.position.set(pose.p.x,-.15,pose.p.z);scene.add(m);fx.boards.push(m);
    const s=blob(scene,w*1.05,Math.max(6,w*.45),b.frame===2?.42:.28);s.position.set(pose.p.x+w*.14,.02,pose.p.z-w*.05)}});
 }
 function dust(scene){const N=360,g=new THREE.BufferGeometry(),pos=new Float32Array(N*3),col=new Float32Array(N*3);for(let i=0;i<N;i++){pos[i*3+1]=-50;const soil=Math.random()<.62;col.set(soil?[.13+Math.random()*.06,.085,.04]:[.1,.2+Math.random()*.08,.05],i*3)}
  g.setAttribute('position',new THREE.BufferAttribute(pos,3));g.setAttribute('color',new THREE.BufferAttribute(col,3));
  const c=document.createElement('canvas');c.width=c.height=32;const x=c.getContext('2d');x.fillStyle='#fff';x.beginPath();x.arc(16,16,13,0,7);x.fill();
  const pts=new THREE.Points(g,new THREE.PointsMaterial({size:.55,vertexColors:true,map:new THREE.CanvasTexture(c),alphaTest:.4,sizeAttenuation:true}));pts.frustumCulled=false;scene.add(pts);
  return{pts,pos,vel:new Float32Array(N*3),life:new Float32Array(N),next:0,N}}
 function post(){const mat=new THREE.ShaderMaterial({depthTest:false,depthWrite:false,uniforms:{tDiffuse:{value:null},uRes:{value:new THREE.Vector2(1,1)},uTime:{value:0},uBlur:{value:0},uExp:{value:1},uBloom:{value:0}},
   vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}',
   fragmentShader:`uniform sampler2D tDiffuse;uniform vec2 uRes;uniform float uTime,uBlur,uExp,uBloom;varying vec2 vUv;
vec3 rrt(vec3 v){vec3 a=v*(v+.0245786)-.000090537;vec3 b=v*(.983729*v+.4329510)+.238081;return a/b;}
vec3 aces(vec3 c){const mat3 I=mat3(vec3(.59719,.07600,.02840),vec3(.35458,.90834,.13383),vec3(.04823,.01566,.83777));const mat3 O=mat3(vec3(1.60475,-.10208,-.00327),vec3(-.53108,1.10813,-.07276),vec3(-.07367,-.00605,1.07602));c*=uExp/.6;c=I*c;c=rrt(c);c=O*c;return clamp(c,0.,1.);}
float hash(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);}
void main(){vec2 d=vUv-vec2(.5,.46);vec3 col=texture2D(tDiffuse,vUv).rgb;
 if(uBlur>.002){float w=1.,e=smoothstep(.12,.55,length(d));for(int i=1;i<8;i++){col+=texture2D(tDiffuse,vUv-d*(float(i)/8.)*.045*uBlur*e).rgb;w+=1.;}col/=w;}
 float r2=dot(d,d);col.r=mix(col.r,texture2D(tDiffuse,vUv-d*.005*r2).r,.6);col.b=mix(col.b,texture2D(tDiffuse,vUv+d*.005*r2).b,.6);
 // halo (bloom) : les zones plus lumineuses que le blanc (reflets du soleil sur les robes et les casaques, ciel autour du soleil) débordent en douceur
 if(uBloom>0.){vec3 b=vec3(0.);vec2 k=vec2(uRes.y/uRes.x,1.)*.028;for(int i=0;i<10;i++){float fi=float(i)+.5,a=fi*2.39996;vec2 o=vec2(cos(a),sin(a))*sqrt(fi/10.)*k;b+=max(texture2D(tDiffuse,vUv+o).rgb-.95,0.);}col+=b*(uBloom/10.);}
 col=aces(col);float l=dot(col,vec3(.2126,.7152,.0722));
 col=mix(col,col*vec3(1.05,1.01,.92),smoothstep(.35,1.,l)*.55);col=mix(col,col*vec3(.93,.98,1.07),(1.-smoothstep(0.,.3,l))*.6);col=mix(vec3(l),col,.94);
 col=mix(col*12.92,pow(max(col,vec3(0.)),vec3(1./2.4))*1.055-.055,step(vec3(.0031308),col));
 col*=mix(1.,smoothstep(1.15,.3,length(d*vec2(uRes.x/uRes.y,1.))),.42);
 col+=(hash(vUv*uRes+fract(uTime))-.5)*.02;gl_FragColor=vec4(col,1.);}`});
  const scene=new THREE.Scene(),quad=new THREE.Mesh(new THREE.PlaneGeometry(2,2),mat);quad.frustumCulled=false;scene.add(quad);return{mat,scene,cam:new THREE.OrthographicCamera(-1,1,1,-1,0,1),rt:null}}
 function build(q){const{scene,renderer}=q;fx={boards:[],horseShadows:[],phase:[0,0,0,0,0,0],last:performance.now(),blur:0,fov:62,size:new THREE.Vector2()};fx.shadowTex=radialTex();
  const sunDir=new THREE.Vector3(-260,360,180).normalize();sky(scene,sunDir);
  {const s=q.sun.shadow.camera;s.left=s.bottom=-115;s.right=s.top=115;s.near=10;s.far=900;s.updateProjectionMatrix();q.sun.shadow.bias=-.0004;q.sun.shadow.normalBias=.04}
  fx.dust=dust(scene);fx.post=post();
  for(let i=0;i<6;i++)fx.horseShadows.push(blob(scene,3.4,8.2,.5));
  // chevaux : planche de galop 8 images peinte aux couleurs de chaque écurie (joueur = son champion)
  fx.gallop=[];q.horses.forEach((h,i)=>{const t=new THREE.CanvasTexture(document.createElement('canvas'));t.colorSpace=THREE.SRGBColorSpace;t.repeat.set(1/8,1);t.anisotropy=8;fx.gallop.push(t);q.horseTextures[i]=t;const m=h.material;m.map=t;m.alphaTest=.35;m.needsUpdate=true});liveries(q);
 }
 // décor de l'hippodrome (2.7, dans le groupe de 10-race raceVenue) : monde en vraie 3D ; si sa construction échoue, décor photo d'origine
 function world(q,g){if(!fx)return;fx.boards=[];fx.horizonMat=null;fx.world=null;try{fx.world=raceWorld.build(g,QUALITY[settings.level()],TRACK.id,TRACK.dir)}catch(e){console.warn('monde 3D',e);horizon(g);billboards(g,q.renderer)}}
 function liveries(q){if(!fx)return;LIVERY.ready.then(()=>{const me=champion.get(),F=currentField||buildField(),list=[me,...F.rivals.map(r=>r.livery)];fx.liv=list;
  (fx.h3d||[]).forEach(m=>{q.scene.remove(m);HORSE3D.dispose(m)});fx.h3d=list.map((l,i)=>{const m=HORSE3D.build(l,{number:i+1,blinkers:!i&&gear.sel.id==='oeilleres',lod:!i&&settings.level()==='haute'?0:1});m.scale.setScalar(4.4);m.visible=false;q.scene.add(m);return m});
  hurdles(q);
  list.forEach((l,i)=>{const t=fx.gallop[i];t.image=LIVERY.gallop(l,i?.5:1);t.needsUpdate=true;const p=new THREE.CanvasTexture(LIVERY.portrait(l));p.colorSpace=THREE.SRGBColorSpace;p.anisotropy=8;q.podiumTextures[i]?.dispose();q.podiumTextures[i]=p})})} // 2.6 : l'ancienne texture est libérée
 function horse(q,i,p,speed,now){const h=q.horses[i];if(!fx)return;const running=q.startPhase==='running';
  const dt=Math.min(.05,(now-(fx.lastH||now))/1000);if(i===5)fx.lastH=now;
  if(h.material.map!==fx.gallop[i])h.material.map=fx.gallop[i];
  // saut d'obstacle (courses de haies) : phase du saut selon la distance à la haie la plus proche
  let jmp=-1;if(fx.hp&&visualProgress.length)for(const hp of fx.hp){const d=(visualProgress[i]||0)-hp;if(d>-.96&&d<.96){jmp=(d+.96)/1.92;break}}
  // cheval 3D articulé sous tous les angles ; l'image peinte ne sert que le temps que son maillage se calcule
  {const m=fx.h3d&&fx.h3d[i],u=m&&m.userData,three=!!u&&!u.pending;h.visible=!three;fx.use3d=fx.use3d||[];fx.use3d[i]=three;if(m)m.visible=three;
   if(three){if(!u.hashed){u.hashed=true;u.mats.forEach(x=>{if(!x.alphaTest)x.alphaHash=true})}if(!i)HORSE3D.setLod(m,settings.level()==='haute'?0:1);
    const c=q.camera.position,dx=c.x-p.p.x,dz=c.z-p.p.z,drive=!running?0:i?(rivalAI[i-1]&&rivalAI[i-1].final?1:.15):(playerFinal&&playerEnergy>0?1:.15);
    m.position.set(p.p.x,0,p.p.z);{const t=Math.max(-.35,Math.min(.35,p.lat||0)),hx=p.f.x+p.n.x*t,hz=p.f.z+p.n.z*t;m.rotation.order='YXZ';m.rotation.y=Math.atan2(-hz,hx);m.rotation.x=t*.55}HORSE3D.pose(m,((fx.phase[i]/8)%1+1)%1,running?1:.12,drive,0,running?jmp:-1);if(running&&jmp>=0)m.position.y=Math.sin(jmp*Math.PI)*5.4;const near=Math.min(1,Math.max(0,(Math.hypot(dx,dz)-8.5)/3)),op=near*near*(3-2*near);if(Math.abs((u.op??1)-op)>.02){u.op=op;u.mats.forEach(x=>{x.opacity=op});m.visible=op>.02}}}
  fx.phase[i]+=(running?dt*(2.1+speed*1.6)*8:dt*1.2);const fr=Math.floor(fx.phase[i]+i*3)%8;fx.gallop[i].offset.x=fr/8;
  const lift=running?Math.abs(Math.sin(fx.phase[i]/8*Math.PI*2))*.22:0,H=12.6;
  h.position.copy(p.p);h.position.y=H*.5-H*.105+lift;h.scale.set(H*.375,H,1);h.material.rotation=running?Math.sin(fx.phase[i]/8*Math.PI*2)*.012:0;
  const s=fx.horseShadows[i];s.visible=h.visible&&!(fx.use3d&&fx.use3d[i]);s.position.set(p.p.x+1.1,.03,p.p.z-.5);s.rotation.y=Math.atan2(p.f.x,p.f.z);
  if(running&&i<6&&Math.random()<.9){const D=fx.dust;for(let k=0;k<2;k++){const j=D.next=(D.next+1)%D.N,side=(Math.random()-.5)*2.2;
   D.pos[j*3]=p.p.x-p.f.x*1.4+p.n.x*side;D.pos[j*3+1]=.35;D.pos[j*3+2]=p.p.z-p.f.z*1.4+p.n.z*side;
   const back=5+Math.random()*6;D.vel[j*3]=-p.f.x*back+p.n.x*(Math.random()-.5)*2;D.vel[j*3+1]=3+Math.random()*4;D.vel[j*3+2]=-p.f.z*back+p.n.z*(Math.random()-.5)*2;D.life[j]=.55+Math.random()*.4}}}
 function parade(q,now,k){const m=fx&&fx.h3d&&fx.h3d[0];if(!m)return false;const b=trackPose(RACE_ORIGIN+.03,-52),e=k*k*(3-2*k);
  if(m.userData.pending)return false;HORSE3D.setLod(m,0);m.visible=true;q.horses[0].visible=false;fx.horseShadows[0].visible=false;if(m.userData.op!==1){m.userData.op=1;m.userData.mats.forEach(x=>{x.opacity=1})}
  m.position.set(b.p.x+b.f.x*(e*9-4.5),0,b.p.z+b.f.z*(e*9-4.5));m.rotation.y=Math.atan2(-b.f.z,b.f.x);HORSE3D.pose(m,(now*.00085)%1,.3);
  const a=.55+e*1.5,R=18-e*3;q.camera.position.set(m.position.x+(b.f.x*Math.cos(a)+b.n.x*Math.sin(a))*R,4.2+e*2.2,m.position.z+(b.f.z*Math.cos(a)+b.n.z*Math.sin(a))*R);q.camera.lookAt(m.position.x,5.6,m.position.z);return true}
 // haies de la course (steeple) : broussaille, lisse blanche, ailes rayées ; une géométrie partagée, recréée à chaque course
 let HG=null;function hurdleGeo(){if(HG)return HG;const k=raceWorld.kit,P=[],r=k.rng(5),box=(w,h,d)=>new THREE.BoxGeometry(w,h,d);
  P.push({g:box(40,3.4,1.6),m:k.M4(0,1.7,0),c:0x3e5a2c});for(let x=-19.4;x<=19.5;x+=1.4)P.push({g:k.fluffy(new THREE.IcosahedronGeometry(.95,1).scale(1,.75+r()*.3,1.1),0,0,0,.6),m:k.M4(x,3.55+r()*.2,0),c:r()<.5?0x4c6e34:0x567a3a});
  P.push({g:box(40,1,.25).rotateX(-.4),m:k.M4(0,.55,-1.05),c:0xf2efe6},{g:box(40,.3,.3),m:k.M4(0,3.1,-.9),c:0xf2efe6});
  for(const s of[-1,1]){P.push({g:box(.6,6.2,3.2),m:k.M4(s*21,3.1,0),c:0xf2efe6});for(const y of[1.3,3.1,4.9])P.push({g:box(.65,.7,3.25),m:k.M4(s*21,y,0),c:0xe0782d})}
  return HG=k.merge(P)}
 function hurdles(q){if(fx.hurdles){q.scene.remove(fx.hurdles);fx.hurdles=null}fx.hp=null;const n=RACE.haies|0;if(!n)return;const g=new THREE.Group(),mat=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.9});fx.hp=haies.posOf(n);
  for(const hp of fx.hp){const p=trackPose(RACE_ORIGIN+hp/100,0),m=new THREE.Mesh(hurdleGeo(),mat);m.position.copy(p.p);m.rotation.y=Math.atan2(p.f.x,p.f.z);m.castShadow=m.receiveShadow=true;g.add(m)}q.scene.add(g);fx.hurdles=g}
 // podium : les trois premiers, en 3D, de trois quarts sur leur marche (rend faux tant que le maillage n'est pas prêt : l'image peinte prend le relais)
 function podium(q,i,slot,now){if(!fx)return false;fx.horseShadows[i].visible=false;const m=fx.h3d&&fx.h3d[i];if(!m)return false;if(!slot||m.userData.pending){m.visible=false;return false}
  const u=m.userData;HORSE3D.setLod(m,0);m.visible=true;if(u.op!==1){u.op=1;u.mats.forEach(x=>{x.opacity=1})}const S=slot.x?2.9:3.2;m.scale.setScalar(S);
  m.position.set(slot.x,slot.h,.4);m.rotation.y=-Math.PI/2+(slot.x<0?.42:slot.x>0?-.42:.2);HORSE3D.pose(m,(now*.0004+i*.3)%1,.05,0);return true}
 function render(q){const r=q.renderer;if(!fx)return r.render(q.scene,q.camera);const now=performance.now(),dt=Math.min(.05,(now-fx.last)/1000);fx.last=now;
  r.getDrawingBufferSize(fx.size);const P=fx.post;if(!P.rt){P.rt=new THREE.WebGLRenderTarget(fx.size.x,fx.size.y,{type:THREE.HalfFloatType,samples:r.capabilities.isWebGL2?4:0});P.mat.uniforms.tDiffuse.value=P.rt.texture}
  if(P.rt.width!==fx.size.x||P.rt.height!==fx.size.y)P.rt.setSize(fx.size.x,fx.size.y);P.mat.uniforms.uBloom.value=fx.bloom=({haute:.55,moyenne:.4,basse:0})[settings.level()]??.4;
  const cam=q.camera;for(const b of fx.boards)b.rotation.y=Math.atan2(cam.position.x-b.position.x,cam.position.z-b.position.z);
  if(fx.world)raceWorld.update(q,now);if(fx.skyMat)fx.skyMat.uniforms.uTime.value=now*.001;
  // ombres nettes : la zone d'ombre du soleil suit ce que regarde la caméra (la direction du soleil vient de l'ambiance)
  {const sun=q.sun;if(!fx.sunSet||!sun.position.equals(fx.sunSet))fx.sunDir=sun.position.clone().normalize();const f=fx.focus||(fx.focus=new THREE.Vector3());cam.getWorldDirection(f);f.y=0;f.normalize().multiplyScalar(45).add(cam.position);f.y=0;
   sun.target.position.copy(f);sun.target.updateMatrixWorld();sun.position.copy(f).addScaledVector(fx.sunDir,420);fx.sunSet=sun.position.clone()}
  const D=fx.dust;for(let j=0;j<D.N;j++){if(D.life[j]<=0){D.pos[j*3+1]=-50;continue}D.life[j]-=dt;D.vel[j*3+1]-=16*dt;D.pos[j*3]+=D.vel[j*3]*dt;D.pos[j*3+1]=Math.max(.05,D.pos[j*3+1]+D.vel[j*3+1]*dt);D.pos[j*3+2]+=D.vel[j*3+2]*dt}D.pts.geometry.attributes.position.needsUpdate=true;
  const running=q.startPhase==='running'&&!q.podiumActive&&!q.finishView,sprint=running&&playerFinal&&playerEnergy>0;if(running&&!raceFinished[0])sound.gallop(autoSpeed,dt);
  fx.blur+=((sprint?1:running?.3:0)-fx.blur)*Math.min(1,dt*4);const fov=running?58+Math.max(0,autoSpeed-.42)*38+(sprint?5:0):62;fx.fov+=(fov-fx.fov)*Math.min(1,dt*3);
  if(Math.abs(cam.fov-fx.fov)>.01){cam.fov=fx.fov;cam.updateProjectionMatrix()}
  let bob=0;if(running){bob=Math.sin(fx.phase[0]/8*Math.PI*2)*.14;cam.position.y+=bob}
  if(!QUALITY[settings.level()].post){r.render(q.scene,cam);cam.position.y-=bob;return}r.setRenderTarget(P.rt);r.render(q.scene,cam);r.setRenderTarget(null);cam.position.y-=bob;
  P.mat.uniforms.uRes.value.copy(fx.size);P.mat.uniforms.uTime.value=now*.001;P.mat.uniforms.uBlur.value=fx.blur;r.render(P.scene,P.cam)}
 // lumière d'environnement : un ciel en dégradé (zénith, horizon, sol) et un soleil, filtrés en carte PMREM. Tous les matériaux
 // « standard » y prennent leurs reflets (robe lustrée, casaques satinées, vernis des tribunes). Réutilisée par le domaine 3D.
 const envCache=new WeakMap();
 function skyEnv(renderer,o){if(!renderer||!renderer.capabilities)return null;let E=envCache.get(renderer);
  if(!E){const pm=new THREE.PMREMGenerator(renderer),s=new THREE.Scene(),mat=new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,
    uniforms:{uZen:{value:new THREE.Vector3()},uHor:{value:new THREE.Vector3()},uGnd:{value:new THREE.Vector3()},uSun:{value:new THREE.Vector3(0,1,0)},uSunC:{value:new THREE.Vector3(1,1,1)},uK:{value:1}},
    vertexShader:'varying vec3 vD;void main(){vD=normalize(position);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader:'uniform vec3 uZen,uHor,uGnd,uSun,uSunC;uniform float uK;varying vec3 vD;void main(){float y=vD.y;vec3 c=y>0.?mix(uHor,uZen,pow(smoothstep(0.,1.,y),.6)):mix(uHor*.7,uGnd,smoothstep(0.,-.35,y));float s=max(dot(vD,normalize(uSun)),0.);c+=uSunC*(pow(s,48.)*6.+pow(s,6.)*.35)*uK;gl_FragColor=vec4(c,1.);}'});
   s.add(new THREE.Mesh(new THREE.SphereGeometry(10,48,24),mat));E={pm,s,mat,rt:null};envCache.set(renderer,E)}
  const U=E.mat.uniforms,k=o.k??1;U.uZen.value.set(...o.zen).multiplyScalar(k);U.uHor.value.set(...o.hor).multiplyScalar(k);U.uGnd.value.set(...o.gnd).multiplyScalar(k);U.uSun.value.set(...o.sun);U.uSunC.value.set(...o.sunC).multiplyScalar(k);U.uK.value=o.sunK??1;
  const rt=E.pm.fromScene(E.s,0,.1,100);E.rt?.dispose();E.rt=rt;return rt.texture}
 // gerbe de poussière (ouverture des stalles) : n grains projetés vers l'avant autour d'une position de piste
 function burst(p,n=24,power=1){if(!fx||!fx.dust)return;const D=fx.dust;for(let k=0;k<n;k++){const j=D.next=(D.next+1)%D.N,side=(Math.random()-.5)*4.5,fw=(Math.random()-.2)*3;
   D.pos[j*3]=p.p.x+p.f.x*fw+p.n.x*side;D.pos[j*3+1]=.3+Math.random()*.6;D.pos[j*3+2]=p.p.z+p.f.z*fw+p.n.z*side;const sp=(4+Math.random()*9)*power;
   D.vel[j*3]=p.f.x*sp+p.n.x*(Math.random()-.5)*5;D.vel[j*3+1]=2.5+Math.random()*5.5*power;D.vel[j*3+2]=p.f.z*sp+p.n.z*(Math.random()-.5)*5;D.life[j]=.7+Math.random()*.7}}
 return{build,world,horse,podium,parade,render,ground,liveries,burst,skyEnv,get _fx(){return fx},set exposure(v){if(fx)fx.post.mat.uniforms.uExp.value=v}};
})();
