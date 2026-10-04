/* ===== Portraits et atelier en 3D (2.8) : le vrai cheval de course, partout =====
   Un petit rendu WebGL hors écran dessine le modèle de la course (08-horse3d : même robe, mêmes balzanes, même casaque et même toque)
   dans un studio éclairé : 1) les vignettes des chevaux (écurie, courses, haras, ventes, Légendes, tournoi) via draw(canvas, livrée),
   gardées en cache ; 2) la scène de l'atelier (stage) : plateau tournant, glisser pour tourner, vues trois-quarts / profil / galop /
   casaque. Sans WebGL, ou si le modèle n'est pas prêt, l'image peinte (LIVERY.portrait) reste en place : rien ne casse. */
const PORTRAIT3D=(()=>{
 let R=null,S=null,cam=null,rig=null,disc=null,shadow=null,failed=false,horse=null,hKey='';
 const cache=new Map(),queue=[],V=new THREE.Vector3();
 const keyOf=l=>[l.coat,l.main,l.second,l.pattern,l.cap,l.name||''].join('|');
 function init(){if(R||failed)return R;try{R=new THREE.WebGLRenderer({antialias:true,alpha:true,preserveDrawingBuffer:true,powerPreference:'low-power'})}catch(e){failed=true;return null}
  R.outputColorSpace=THREE.SRGBColorSpace;R.toneMapping=THREE.ACESFilmicToneMapping;R.toneMappingExposure=1.12;R.shadowMap.enabled=true;R.shadowMap.type=THREE.PCFSoftShadowMap;R.setClearColor(0,0);
  R.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();failed=true;R=null});
  S=new THREE.Scene();cam=new THREE.PerspectiveCamera(28,1,.05,60);
  // éclairage de studio : clé chaude devant à gauche, contre-jour froid qui détache la silhouette, ciel doux ; reflets du ciel (skyEnv)
  S.add(new THREE.HemisphereLight(0xe8f0ff,0x3a3020,1.05));const key=new THREE.DirectionalLight(0xfff0dc,2.6);key.position.set(3.2,5.5,4.5);key.castShadow=true;key.shadow.mapSize.set(1024,1024);
  Object.assign(key.shadow.camera,{left:-3,right:3,top:3,bottom:-3,near:.5,far:20});key.shadow.bias=-.0006;key.shadow.normalBias=.02;S.add(key,key.target);
  const rim=new THREE.DirectionalLight(0x9fc4ff,1.7);rim.position.set(-4,3.5,-4.5);S.add(rim);const fill=new THREE.DirectionalLight(0xffe2c4,.45);fill.position.set(-3,1.5,3);S.add(fill);
  try{S.environment=raceFX.skyEnv(R,{zen:[.12,.2,.38],hor:[.62,.66,.72],gnd:[.3,.26,.2],sun:[3.2,5.5,4.5],sunC:[1,.94,.84],sunK:.9,k:.75})}catch(e){}
  // ombre portée sur un sol invisible + halo de contact (le cheval ne flotte pas)
  const sm=new THREE.Mesh(new THREE.PlaneGeometry(12,12).rotateX(-Math.PI/2),new THREE.ShadowMaterial({opacity:.32}));sm.receiveShadow=true;S.add(sm);
  const c=document.createElement('canvas');c.width=c.height=128;const x=c.getContext('2d'),g=x.createRadialGradient(64,64,0,64,64,64);g.addColorStop(0,'rgba(0,0,0,.55)');g.addColorStop(.6,'rgba(0,0,0,.2)');g.addColorStop(1,'rgba(0,0,0,0)');x.fillStyle=g;x.fillRect(0,0,128,128);
  rig=new THREE.Group();S.add(rig);
  // plateau tournant de l'atelier : disque sombre et liseré néon, comme le podium (masqué pour les vignettes)
  disc=new THREE.Group();const dm=new THREE.Mesh(new THREE.CylinderGeometry(1.72,1.8,.14,72),new THREE.MeshStandardMaterial({color:0x0b0f2c,roughness:.8,metalness:.1,envMapIntensity:.25}));dm.position.y=-.07;dm.receiveShadow=true;
  const ring=new THREE.Mesh(new THREE.TorusGeometry(1.74,.03,8,96).rotateX(Math.PI/2),new THREE.MeshBasicMaterial({color:0x9b7bff,toneMapped:false}));ring.position.y=.002;
  const ring2=new THREE.Mesh(new THREE.TorusGeometry(1.8,.018,6,96).rotateX(Math.PI/2),new THREE.MeshBasicMaterial({color:0x46d8ff,toneMapped:false}));ring2.position.y=-.12;disc.add(dm,ring,ring2);rig.add(disc);shadow=new THREE.Mesh(new THREE.PlaneGeometry(3.4,1.3).rotateX(-Math.PI/2),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(c),transparent:true,depthWrite:false}));shadow.position.y=.005;rig.add(shadow);return R}
 // le cheval affiché (un seul à la fois) : reconstruit quand la livrée change, l'ancien est libéré
 function setHorse(liv){const k=keyOf(liv);if(horse&&hKey===k)return horse;if(horse){rig.remove(horse);HORSE3D.dispose(horse)}horse=HORSE3D.build(liv,{lod:0,number:1});hKey=k;
  rig.add(horse);return horse}
 // une fois le maillage arrivé : ombres portées ET reçues (l'ombre du jockey se pose sur le dos et le flanc du cheval)
 function shade(m){const u=m.userData;if(u.pending||u.shaded)return;u.shaded=1;m.traverse(o=>{if(o.isMesh){o.castShadow=o.receiveShadow=true;o.frustumCulled=false}})}
 // cadrages : yaw = angle de la caméra autour du cheval (0 = de face), cible, demi-largeur et demi-hauteur à faire tenir à l'image
 // (modèle : 2,83 de long, 2,31 de haut avec le jockey) ; la distance se calcule pour le format du cadre, sans jamais rogner,
 // sauf crop (vignettes) : cadrée sur la hauteur, en buste, la queue peut sortir d'un cadre étroit
 const FRAMES={portrait:{yaw:.72,ty:1.12,tx:0,hw:1.55,hh:1.28,el:.12},profil:{yaw:1.5708,ty:1.1,tx:0,hw:1.55,hh:1.25,el:.06},galop:{yaw:1.5708,ty:1.12,tx:0,hw:1.6,hh:1.3,el:.08},
  casaque:{yaw:.85,ty:1.88,tx:.25,hw:.82,hh:.62,el:.1},vignette:{yaw:.55,ty:1.62,tx:.36,hw:.72,hh:.8,el:.1,crop:1}};
 // ins : marges de l'interface posée sur l'image (en fraction de la hauteur, haut / bas) : le cheval se cadre dans la partie libre
 function place(view,yawOff=0,aspect=1,ins=[0,0]){const F=FRAMES[view]||FRAMES.portrait,a=F.yaw+yawOff,free=1-ins[0]-ins[1],tv=Math.tan(cam.fov*Math.PI/360),d=Math.max(F.hh/(tv*free),F.crop?0:F.hw/(tv*aspect))*1.06+F.hw*.4;
  cam.aspect=aspect;const H=1000,Wd=H*aspect;if(ins[0]||ins[1])cam.setViewOffset(Wd,H,0,(ins[1]-ins[0])/2*H,Wd,H);else cam.clearViewOffset();cam.updateProjectionMatrix();V.set(F.tx,F.ty,0);cam.position.set(V.x+Math.cos(a)*d*Math.cos(F.el),V.y+Math.sin(F.el)*d,V.z+Math.sin(a)*d*Math.cos(F.el));cam.lookAt(V)}
 // ---------- vignettes ----------
 function pump(){if(stage.on||!queue.length)return;const job=queue.shift();if(!job.cv.isConnected)return setTimeout(pump,0);
  HORSE3D.ready(0).then(()=>{if(stage.on){queue.unshift(job);return}if(!init())return;const k=job.key;if(!cache.has(k)){const W=job.W,H=job.H;R.setPixelRatio(1);R.setSize(W,H,false);
    const m=setHorse(job.liv);if(m.userData.pending){queue.unshift(job);return setTimeout(pump,120)}shade(m);HORSE3D.pose(m,.18,0);m.position.set(0,0,0);m.rotation.set(0,0,0);rig.rotation.y=0;shadow.visible=true;disc.visible=false;place('vignette',0,W/H);R.render(S,cam);
    const out=document.createElement('canvas');out.width=W;out.height=H;out.getContext('2d').drawImage(R.domElement,0,0,W,H);cache.set(k,out);if(cache.size>48)cache.delete(cache.keys().next().value)}
   paint(job.cv,cache.get(k));requestAnimationFrame(()=>setTimeout(pump,0))}).catch(()=>{failed=true})}
 function paint(cv,img){const x=cv.getContext('2d');x.clearRect(0,0,cv.width,cv.height);x.drawImage(img,0,0,cv.width,cv.height);cv.classList.add('p3d')}
 // dessine la livrée en 3D dans le canevas (rendu à 2× pour la netteté) ; rend false si la 3D est indisponible (l'appelant garde son image)
 function draw(cv,liv){if(failed||!window.THREE||!liv)return false;const W=Math.min(512,cv.width*2),H=Math.min(640,cv.height*2),k=keyOf(liv)+'|'+W+'x'+H,c=cache.get(k);if(c){paint(cv,c);return true}
  for(let i=queue.length-1;i>=0;i--)if(queue[i].cv===cv)queue.splice(i,1);queue.push({cv,liv,key:k,W,H});if(queue.length===1)setTimeout(pump,0);return true}
 // ---------- atelier : scène animée ----------
 const stage={on:false,el:null,view:'portrait',yaw:0,vel:0,drag:null,liv:null,raf:0,t0:0,
  start(host,liv){if(!init())return false;this.el=host;host.prepend(R.domElement);R.domElement.className='studio3d';R.domElement.setAttribute('aria-label','Aperçu 3D du cheval et de la casaque');this.on=true;this.yaw=0;this.vel=.0;this.set(liv);this.t0=performance.now();
   const cv=R.domElement;if(!cv.__bound){cv.__bound=1;cv.addEventListener('pointerdown',e=>{this.drag={x:e.clientX,y:this.yaw};cv.setPointerCapture(e.pointerId);this.vel=0});
    cv.addEventListener('pointermove',e=>{if(!this.drag)return;const dx=e.clientX-this.drag.x;this.yaw=this.drag.y-dx*.012;if(Math.abs(dx)>12&&this.el)this.el.classList.add('turned')});cv.addEventListener('pointerup',e=>{if(this.drag){this.vel=0;this.drag=null;this.idleAt=performance.now()}});
    cv.addEventListener('pointercancel',()=>{this.drag=null})}
   cancelAnimationFrame(this.raf);const loop=now=>{if(!this.on)return;this.raf=requestAnimationFrame(loop);this.frame(now)};this.raf=requestAnimationFrame(loop);return true},
  set(liv){this.liv=liv;if(R)setHorse(liv)},
  mode(v){this.view=v;this.yaw=0},
  frame(now){const host=this.el;if(!host||!horse)return;const r=host.getBoundingClientRect(),W=Math.max(2,Math.round(r.width)),H=Math.max(2,Math.round(r.height)),pr=Math.min(2,devicePixelRatio||1);
   if(R.getPixelRatio()!==pr)R.setPixelRatio(pr);const sz=R.getSize(V);if(sz.x!==W||sz.y!==H)R.setSize(W,H,false);
   shade(horse);const u=horse.userData,t=(now-this.t0)/1000,gal=this.view==='galop',still=REDUCE_MOTION.matches;
   // plateau tournant : lent, repris 2 s après qu'on a lâché le cheval ; au galop, de profil et sans rotation
   if(!this.drag&&!gal&&!still&&now-(this.idleAt||0)>2000)this.yaw+=.0035;
   if(!u.pending)HORSE3D.pose(horse,gal?(t*1.55)%1:(t*.12)%1,gal?1:0,gal?.25:0);
   horse.position.y=0;rig.rotation.y=gal?0:-this.yaw;shadow.visible=true;shadow.scale.x=gal?1.1:1;disc.visible=true;this.frames=(this.frames||0)+1;
   // parties de l'image couvertes par la plaque du nom (haut) et le choix des vues (bas)
   const pl=host.querySelector('.studio-plate'),hn=host.querySelector('.studio-hint'),vw=hn&&hn.offsetParent&&getComputedStyle(hn).top==='auto'?hn:host.querySelector('.studio-view'),top=pl?(pl.getBoundingClientRect().bottom-r.top+6)/H:0,bot=vw?(r.bottom-vw.getBoundingClientRect().top+8)/H:0;
   place(this.view,0,W/H,[Math.min(.3,Math.max(0,top)),Math.min(.3,Math.max(0,bot))]);R.render(S,cam);host.classList.toggle('loading',!!u.pending)},
  stop(){this.on=false;cancelAnimationFrame(this.raf);if(R&&R.domElement.parentNode)R.domElement.remove();this.el=null;setTimeout(pump,50)}};
 return{draw,stage,get ready(){return !failed},get cacheSize(){return cache.size}}})();
