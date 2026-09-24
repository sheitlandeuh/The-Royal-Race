/* ===== Vie du domaine : des chevaux montés galopent sur la piste du village.
   Leurs images sont rendues une seule fois à partir du modèle 3D (8 orientations × 8 temps de galop), éclairées comme la peinture. ===== */
const villageLife=(()=>{
 // ligne médiane de la piste du village (détectée sur la peinture, coordonnées carte 0..1)
 const RING=[[0.3958,0.2283],[0.3891,0.179],[0.418,0.1482],[0.4553,0.1405],[0.484,0.1428],[0.5038,0.147],[0.5175,0.1507],[0.5278,0.1535],[0.5367,0.1563],[0.5443,0.1581],[0.5522,0.1581],[0.5588,0.1634],[0.5647,0.1746],[0.5722,0.1813],[0.5835,0.1847],[0.6034,0.1868],[0.6279,0.197],[0.6567,0.2217],[0.6775,0.2594],[0.6831,0.2991],[0.6622,0.329],[0.6321,0.3422],[0.6061,0.3447],[0.5858,0.342],[0.5704,0.3366],[0.5584,0.3311],[0.5488,0.3268],[0.5408,0.3245],[0.5332,0.3207],[0.5257,0.317],[0.518,0.313],[0.5092,0.3087],[0.4986,0.3034],[0.4842,0.2967],[0.4634,0.2863],[0.4309,0.2649]],CEN=[.5422,.2463],FW=96,FH=76,DIRS=8,FR=8,PITCH=.72,P=RING.map(([u,v])=>[u*3344,v*1882]),LEN=[0];
 for(let i=0;i<P.length;i++){const a=P[i],b=P[(i+1)%P.length];LEN.push(LEN[i]+Math.hypot(b[0]-a[0],b[1]-a[1]))}const TOT=LEN[P.length];
 const pt=(d,lane=1)=>{d=((d%TOT)+TOT)%TOT;let i=0;while(LEN[i+1]<d)i++;const t=(d-LEN[i])/(LEN[i+1]-LEN[i]),a=RING[i],b=RING[(i+1)%RING.length],u=a[0]+(b[0]-a[0])*t,v=a[1]+(b[1]-a[1])*t;return[CEN[0]+(u-CEN[0])*lane,CEN[1]+(v-CEN[1])*lane]};
 let sheets=null,busy=false,runners=[];
 // rendu progressif (une orientation à la fois, pendant les temps morts) pour ne jamais figer l'interface
 function render(){if(busy||sheets||!window.THREE)return;if(settings.level()==='basse'){sheets=[];return}busy=true;
  let r,sc,cam,cv,out=[],jobs=[];const livs=[champion.get(),VALMONT.livery,{coat:'gris',main:'#1f5fbf',second:'#ffffff',pattern:'croix',cap:'#ffffff'},{coat:'bai',main:'#f2c230',second:'#1d6b3a',pattern:'bretelles',cap:'#1d6b3a'}];
  try{cv=document.createElement('canvas');cv.width=FW;cv.height=FH;r=new THREE.WebGLRenderer({canvas:cv,alpha:true,antialias:true,preserveDrawingBuffer:true});r.setClearColor(0,0);r.outputColorSpace=THREE.SRGBColorSpace;r.toneMapping=THREE.ACESFilmicToneMapping;r.toneMappingExposure=1.15;
   sc=new THREE.Scene();sc.add(new THREE.HemisphereLight(0xfff4e0,0x4a5a30,1.5));const sun=new THREE.DirectionalLight(0xfff0d0,3.2);sun.position.set(-3,5,2);sc.add(sun);
   cam=new THREE.OrthographicCamera(-1.55,1.55,1.23,-1.23,.1,20);cam.position.set(0,Math.sin(PITCH)*8,Math.cos(PITCH)*8);cam.lookAt(0,1.05,0);
   livs.forEach((l,k)=>{for(let d=0;d<DIRS;d++)jobs.push([k,d])})}catch(e){sheets=[];busy=false;return}
  let cur=-1,h=null,x=null;const idle=f=>(window.requestIdleCallback?requestIdleCallback(f,{timeout:400}):setTimeout(f,30));
  const step=()=>{try{const job=jobs.shift();if(!job){if(h){sc.remove(h);HORSE3D.dispose(h)}r.dispose();r.forceContextLoss?.();sheets=out;busy=false;
     runners=[0,1,2,3].map(i=>({s:i,th:i*TOT*.23+80,sp:.07+i*.004,lane:1.02-i*.012,f:Math.random()*8}));return}
    const[k,d]=job;if(k!==cur){if(h){sc.remove(h);HORSE3D.dispose(h)}cur=k;h=HORSE3D.build(livs[k],{number:1});sc.add(h);const S=document.createElement('canvas');S.width=FW*FR;S.height=FH*DIRS;out[k]=S;x=S.getContext('2d')}
    h.rotation.y=d/DIRS*Math.PI*2;for(let f=0;f<FR;f++){HORSE3D.pose(h,f/FR,1);r.render(sc,cam);x.drawImage(cv,f*FW,d*FH)}idle(step)}catch(e){console.warn('village horses',e);sheets=[];busy=false}};
  idle(step)}
 // appelé par la boucle d'animation du village
 function draw(ctx,now,dt,toScreen,sc,vw,vh){if(!sheets){if(now>6000)render();return}if(!sheets.length)return;
  const order=runners.map(R=>{R.th=(R.th+R.sp*dt)%TOT;R.f+=dt*.016;return R}).sort((a,b)=>pt(a.th,a.lane)[1]-pt(b.th,b.lane)[1]);
  for(const R of order){const[u,v]=pt(R.th,R.lane),[u2,v2]=pt(R.th+6,R.lane);if(v>.298&&u>.452&&u<.515)continue;
   const[x,y]=toScreen(u,v);if(x<-60||y<-60||x>vw+60||y>vh+60)continue;
   // direction à l'écran -> direction au sol (vue plongeante) -> image la plus proche
   const dx=(u2-u)*3344,dy=(v2-v)*1882/Math.sin(PITCH),yaw=Math.atan2(-dy,dx),d=((Math.round(yaw/(Math.PI*2)*DIRS)%DIRS)+DIRS)%DIRS,fr=Math.floor(R.f)%FR,
    w=FW*sc*.62,h=FH*sc*.62;
   ctx.globalAlpha=.22;ctx.fillStyle='#1d2410';ctx.beginPath();ctx.ellipse(x+3*sc,y+1.5*sc,w*.3,h*.08,0,0,6.283);ctx.fill();
   ctx.globalAlpha=1;ctx.drawImage(sheets[R.s],fr*FW,d*FH,FW,FH,x-w/2,y-h*.8,w,h)}ctx.globalAlpha=1}
 champion.on?.(()=>{sheets=null});
 return{draw,get ready(){return!!(sheets&&sheets.length)}}})();
