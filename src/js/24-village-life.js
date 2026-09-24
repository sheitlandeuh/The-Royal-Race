/* ===== Vie du domaine : des chevaux montés galopent sur la piste du village.
   Leurs images sont rendues une seule fois à partir du modèle 3D (8 orientations × 8 temps de galop), éclairées comme la peinture. ===== */
const FREE_COATS=['bai','alezan','gris','noir'];
const villageLife=(()=>{
 // ligne médiane de la piste du village (détectée sur la peinture, coordonnées carte 0..1)
 const RING=[[0.3958,0.2283],[0.3891,0.179],[0.418,0.1482],[0.4553,0.1405],[0.484,0.1428],[0.5038,0.147],[0.5175,0.1507],[0.5278,0.1535],[0.5367,0.1563],[0.5443,0.1581],[0.5522,0.1581],[0.5588,0.1634],[0.5647,0.1746],[0.5722,0.1813],[0.5835,0.1847],[0.6034,0.1868],[0.6279,0.197],[0.6567,0.2217],[0.6775,0.2594],[0.6831,0.2991],[0.6622,0.329],[0.6321,0.3422],[0.6061,0.3447],[0.5858,0.342],[0.5704,0.3366],[0.5584,0.3311],[0.5488,0.3268],[0.5408,0.3245],[0.5332,0.3207],[0.5257,0.317],[0.518,0.313],[0.5092,0.3087],[0.4986,0.3034],[0.4842,0.2967],[0.4634,0.2863],[0.4309,0.2649]],CEN=[.5422,.2463],FW=96,FH=76,DIRS=8,FR=8,PITCH=.72,P=RING.map(([u,v])=>[u*3344,v*1882]),LEN=[0];
 for(let i=0;i<P.length;i++){const a=P[i],b=P[(i+1)%P.length];LEN.push(LEN[i]+Math.hypot(b[0]-a[0],b[1]-a[1]))}const TOT=LEN[P.length];
 const pt=(d,lane=1)=>{d=((d%TOT)+TOT)%TOT;let i=0;while(LEN[i+1]<d)i++;const t=(d-LEN[i])/(LEN[i+1]-LEN[i]),a=RING[i],b=RING[(i+1)%RING.length],u=a[0]+(b[0]-a[0])*t,v=a[1]+(b[1]-a[1])*t;return[CEN[0]+(u-CEN[0])*lane,CEN[1]+(v-CEN[1])*lane]};
 let sheets=null,busy=false,runners=[];
 // rendu progressif (une orientation à la fois, pendant les temps morts) pour ne jamais figer l'interface
 function render(){if(busy||sheets||!window.THREE)return;if(settings.level()==='basse'){sheets=[];return}busy=true;
  let r,sc,cam,cv,out=[],jobs=[];const livs=[champion.get(),VALMONT.livery,{coat:'gris',main:'#1f5fbf',second:'#ffffff',pattern:'croix',cap:'#ffffff'},{coat:'bai',main:'#f2c230',second:'#1d6b3a',pattern:'bretelles',cap:'#1d6b3a'},
   ...FREE_COATS.map(coat=>({coat,main:'#000',second:'#000',pattern:'uni',cap:'#000',free:true}))];
  try{cv=document.createElement('canvas');cv.width=FW;cv.height=FH;r=new THREE.WebGLRenderer({canvas:cv,alpha:true,antialias:true,preserveDrawingBuffer:true});r.setClearColor(0,0);r.outputColorSpace=THREE.SRGBColorSpace;r.toneMapping=THREE.ACESFilmicToneMapping;r.toneMappingExposure=1.15;
   sc=new THREE.Scene();sc.add(new THREE.HemisphereLight(0xfff4e0,0x4a5a30,1.5));const sun=new THREE.DirectionalLight(0xfff0d0,3.2);sun.position.set(-3,5,2);sc.add(sun);
   cam=new THREE.OrthographicCamera(-1.55,1.55,1.23,-1.23,.1,20);cam.position.set(0,Math.sin(PITCH)*8,Math.cos(PITCH)*8);cam.lookAt(0,1.05,0);
   livs.forEach((l,k)=>{for(let d=0;d<DIRS;d++)jobs.push([k,d])})}catch(e){sheets=[];busy=false;return}
  let cur=-1,h=null,x=null;const idle=f=>(window.requestIdleCallback?requestIdleCallback(f,{timeout:400}):setTimeout(f,30));
  const step=()=>{try{const job=jobs.shift();if(!job){if(h){sc.remove(h);HORSE3D.dispose(h)}r.dispose();r.forceContextLoss?.();sheets=out;busy=false;
     runners=[0,1,2,3].map(i=>({s:i,th:i*TOT*.23+80,sp:.07+i*.004,lane:1.02-i*.012,f:Math.random()*8}));return}
    const[k,d]=job;if(k!==cur){if(h){sc.remove(h);HORSE3D.dispose(h)}cur=k;h=HORSE3D.build(livs[k],{number:1});sc.add(h);const S=document.createElement('canvas');S.width=FW*(FR+2);S.height=FH*DIRS;out[k]=S;x=S.getContext('2d');
     // cheval en liberté : sans jockey, sans selle ni rênes
     if(livs[k].free){const U=h.userData;U.jk.visible=false;U.reins.forEach(o=>{o.visible=false});U.body.children[1].visible=false;U.body.children[2].visible=false}}
    h.rotation.y=d/DIRS*Math.PI*2;const free=livs[k].free;for(let f=0;f<FR+2;f++){if(f<FR)HORSE3D.pose(h,f/FR,free?.32:1);else HORSE3D.pose(h,f===FR?0:.3,.04);r.render(sc,cam);x.drawImage(cv,f*FW,d*FH)}idle(step)}catch(e){console.warn('village horses',e);sheets=[];busy=false}};
  idle(step)}
 // carrière : deux cavaliers au petit galop sur la piste de sable (ellipse inclinée comme la peinture)
 const ARENA={cx:.175,cy:.326,rx:.066,ry:.033,rot:-.2},riders=[{s:2,a:0},{s:3,a:Math.PI}];
 const onArena=a=>{const c=Math.cos(a),n=Math.sin(a),R=ARENA;return[R.cx+R.rx*c*Math.cos(R.rot)-R.ry*n*Math.sin(R.rot),R.cy+R.rx*c*Math.sin(R.rot)+R.ry*n*Math.cos(R.rot)]};
 // prés : chevaux en liberté qui marchent, s'arrêtent, repartent (champs vides de la peinture, coordonnées carte)
 const FIELDS=[[.29,.58,.385,.66],[.552,.612,.655,.695],[.655,.762,.765,.84],[.275,.376,.37,.428]];
 const herd=[[0,4],[0,6],[1,5],[1,7],[2,4],[3,6]].map(([f,s],i)=>{const F=FIELDS[f],u=F[0]+(F[2]-F[0])*((i*.37)%1),v=F[1]+(F[3]-F[1])*((i*.61)%1);return{f,s,u,v,tu:u,tv:v,walk:false,until:2000+i*1700,fr:i,d:i%8}});
 // carrosse royal : deux chevaux attelés montent et descendent l'allée centrale
 const COACH={u:.4832,v0:.64,v1:1.03,v:.66,dir:1,wait:0};
 function coachDraw(ctx,x,y,sc,down){const k=sc*1.3,w=34*k,l=48*k,yy=y-l/2;
  ctx.globalAlpha=.25;ctx.fillStyle='#1d2410';ctx.beginPath();ctx.ellipse(x+3*k,yy+l*.55,w*.7,l*.35,0,0,6.283);ctx.fill();ctx.globalAlpha=1;
  ctx.fillStyle='#1b1410';for(const[dx,dy]of[[-.62,.18],[.62,.18],[-.62,.82],[.62,.82]]){ctx.beginPath();ctx.ellipse(x+dx*w,yy+dy*l,3.2*k,6.5*k,0,0,6.283);ctx.fill()}
  const g=ctx.createLinearGradient(x-w/2,0,x+w/2,0);g.addColorStop(0,'#0c1f3c');g.addColorStop(.5,'#23467e');g.addColorStop(1,'#0c1f3c');ctx.fillStyle=g;ctx.strokeStyle='#e2b44c';ctx.lineWidth=Math.max(1,1.6*k);
  ctx.beginPath();ctx.roundRect(x-w/2,yy,w,l,5*k);ctx.fill();ctx.stroke();ctx.fillStyle='#2f5a9c';ctx.beginPath();ctx.roundRect(x-w*.36,yy+l*.14,w*.72,l*.72,4*k);ctx.fill();
  ctx.fillStyle='#f3c64a';ctx.beginPath();ctx.arc(x,yy+l*.5,2.6*k,0,6.283);ctx.fill();for(const dx of[-.5,.5]){ctx.fillStyle='#ffe7a0';ctx.beginPath();ctx.arc(x+dx*w,yy+(down?l:0),1.8*k,0,6.283);ctx.fill()}}
 const dirOf=(du,dv)=>{const yaw=Math.atan2(-dv*1882/Math.sin(PITCH),du*3344);return((Math.round(yaw/(Math.PI*2)*DIRS)%DIRS)+DIRS)%DIRS};
 // appelé par la boucle d'animation du village
 function draw(ctx,now,dt,toScreen,sc,vw,vh){if(!sheets){if(now>6000)render();return}if(!sheets.length)return;
  const list=[];
  for(const R of runners){R.th=(R.th+R.sp*dt)%TOT;R.f+=dt*.016;const[u,v]=pt(R.th,R.lane),[u2,v2]=pt(R.th+6,R.lane);if(v>.298&&u>.452&&u<.515)continue;list.push({u,v,s:R.s,k:.62,fr:Math.floor(R.f)%FR,d:dirOf(u2-u,v2-v)})}
  for(const R of riders){R.a=(R.a+dt*.00032)%(Math.PI*2);R.f=(R.f||0)+dt*.011;const[u,v]=onArena(R.a),[u2,v2]=onArena(R.a+.03);list.push({u,v,s:R.s,k:1.2,fr:Math.floor(R.f)%FR,d:dirOf(u2-u,v2-v)})}
  if(sheets.length>7)for(const H of herd){const F=FIELDS[H.f];
   if(H.walk){const du=H.tu-H.u,dv=H.tv-H.v,L=Math.hypot(du*1.78,dv),st=dt*.0000042;if(L<st*1.5){H.walk=false;H.until=now+3500+Math.random()*7000}else{H.u+=du/L*st;H.v+=dv/L*st;H.d=dirOf(du,dv);H.fr+=dt*.006}}
   else if(now>H.until){H.walk=true;H.tu=F[0]+Math.random()*(F[2]-F[0]);H.tv=F[1]+Math.random()*(F[3]-F[1])}
   list.push({u:H.u,v:H.v,s:H.s,k:1.25,fr:H.walk?Math.floor(H.fr)%FR:FR+(Math.floor(now/1600+H.s)%2),d:H.d})}
  if(sheets.length>7){const C=COACH;if(C.wait>0)C.wait-=dt;else{C.v+=C.dir*dt*.0000105;if(C.v>C.v1||C.v<C.v0){C.dir*=-1;C.v=Math.max(C.v0,Math.min(C.v1,C.v));C.wait=C.dir>0?6000:18000}}
   if(C.wait<=0||C.v<C.v1){const down=C.dir>0,d=dirOf(0,C.dir),fr=C.wait>0?FR:Math.floor(now*.006)%FR;
    list.push({u:C.u-.0062,v:C.v,s:4,k:1.1,fr,d},{u:C.u+.0062,v:C.v+.0004,s:6,k:1.1,fr:(fr+3)%FR,d},{u:C.u,v:C.v+(down?-.03:.012),fn:(ctx,x,y)=>coachDraw(ctx,x,y,sc,down)})}}
  list.sort((a,b)=>a.v-b.v);
  // taille : chevaux de la piste (lointaine) plus petits ; carrière et prés à l'échelle des chevaux peints
  for(const S of list){const[x,y]=toScreen(S.u,S.v),w=FW*sc*(S.k||1),h=FH*sc*(S.k||1);if(x<-60||y<-60||x>vw+60||y>vh+60)continue;if(S.fn){S.fn(ctx,x,y);continue}
   ctx.globalAlpha=.22;ctx.fillStyle='#1d2410';ctx.beginPath();ctx.ellipse(x+3*sc,y+1.5*sc,w*.3,h*.08,0,0,6.283);ctx.fill();
   ctx.globalAlpha=1;ctx.drawImage(sheets[S.s],S.fr*FW,S.d*FH,FW,FH,x-w/2,y-h*.8,w,h)}ctx.globalAlpha=1}
 champion.on?.(()=>{sheets=null});
 return{draw,get ready(){return!!(sheets&&sheets.length)},get coach(){return COACH}}})();
