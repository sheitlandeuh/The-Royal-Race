/* ===== Domaine vivant : réverbères, lucioles, papillons, fontaine, particules de saison =====
   Dessinés sur leur propre calque (au-dessus des chevaux) pour que les lumières restent vives la nuit.
   La saison suit la date réelle : pétales au printemps, pollen l'été, feuilles mortes l'automne, neige l'hiver (?saison=hiver pour tester). */
const villageVie=(()=>{
 const world=$('#world'),cv=document.createElement('canvas');cv.id='villageGlow';cv.setAttribute('aria-hidden','true');$('#ambient').after(cv);const ctx=cv.getContext('2d');
 const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
 // réverbères de l'allée centrale (tête de la lanterne, coordonnées carte)
 const LAMPS=[[.4513,.6435],[.5144,.6435],[.4498,.7269],[.5161,.7269],[.4438,.8794],[.5194,.8794],[.4821,.5834]];
 const FOUNTAIN={u:.4815,v:.5553,bu:.4815,bv:.5653};
 const LAWNS=[[.29,.58,.385,.66],[.552,.612,.655,.695],[.655,.762,.765,.84],[.275,.376,.37,.428],[.02,.5,.3,.95],[.6,.8,1,1]];
 const forced=new URLSearchParams(location.search).get('saison'),SEASONS=['hiver','printemps','ete','automne'];
 const season=()=>SEASONS.includes(forced)?forced:SEASONS[Math.floor(((new Date().getMonth()+1)%12)/3)];
 const rnd=(a,b)=>a+Math.random()*(b-a);
 const flies=Array.from({length:70},()=>{const L=LAWNS[Math.floor(Math.random()*LAWNS.length)];return{u:rnd(L[0],L[2]),v:rnd(L[1],L[3]),p:Math.random()*6.28,f:rnd(.6,1.6),a:Math.random()*6.28}});
 const butterflies=Array.from({length:9},(_,i)=>({u:rnd(.44,.53),v:rnd(.55,.7),p:Math.random()*6.28,c:['#ffd24a','#ffffff','#ff9ec4','#9fd8ff'][i%4]}));
 let drops=[],fall=[],night=0,eve=0,last=performance.now(),W=0,H=0;
 // montgolfière aux couleurs du domaine : traverse le ciel de temps en temps, son ombre glisse sur le sol
 const balloon={on:false,next:performance.now()+25000,u:0,v:0,du:0,dv:0,sway:0};
 function drawBalloon(dt,now,P,sc){const B=balloon;if(!B.on){if(now<B.next||night>.6)return;const l2r=Math.random()<.5;Object.assign(B,{on:true,u:l2r?-.08:1.08,v:rnd(.25,.7),du:(l2r?1:-1)*rnd(.011,.016),dv:rnd(-.004,.004)})}
  B.u+=B.du*dt;B.v+=B.dv*dt;B.sway+=dt;if(B.u<-.12||B.u>1.12){B.on=false;B.next=now+rnd(90000,180000);return}
  const[x,y]=P(B.u,B.v),k=Math.max(.75,sc*2.3),R=34*k,by=y-R*2.6+Math.sin(B.sway*.8)*3*k;
  const[sx,sy]=P(B.u+.035,B.v+.09);ctx.globalAlpha=.18*(1-night);ctx.fillStyle='#0c1a0c';ctx.beginPath();ctx.ellipse(sx,sy,R*.9,R*.45,0,0,6.283);ctx.fill();ctx.globalAlpha=1;
  ctx.save();ctx.beginPath();ctx.moveTo(x-R,by);ctx.bezierCurveTo(x-R,by-R*1.35,x+R,by-R*1.35,x+R,by);ctx.bezierCurveTo(x+R,by+R*.55,x+R*.28,by+R*.95,x+R*.2,by+R*1.12);ctx.lineTo(x-R*.2,by+R*1.12);ctx.bezierCurveTo(x-R*.28,by+R*.95,x-R,by+R*.55,x-R,by);ctx.closePath();ctx.clip();
  for(let i=-3;i<3;i++){ctx.fillStyle=i%2?'#f3c64a':'#b81f2c';ctx.fillRect(x+i*R/3,by-R*1.4,R/3+.5,R*2.6)}
  const sh=ctx.createRadialGradient(x-R*.4,by-R*.5,R*.1,x,by,R*1.4);sh.addColorStop(0,'rgba(255,255,255,.35)');sh.addColorStop(.5,'rgba(255,255,255,0)');sh.addColorStop(1,'rgba(0,0,0,.35)');ctx.fillStyle=sh;ctx.fillRect(x-R,by-R*1.4,R*2,R*2.6);ctx.restore();
  ctx.strokeStyle='#5a3a1a';ctx.lineWidth=Math.max(.8,k);ctx.beginPath();ctx.moveTo(x-R*.2,by+R*1.12);ctx.lineTo(x-R*.13,by+R*1.45);ctx.moveTo(x+R*.2,by+R*1.12);ctx.lineTo(x+R*.13,by+R*1.45);ctx.stroke();
  ctx.fillStyle='#7a4a22';ctx.fillRect(x-R*.16,by+R*1.45,R*.32,R*.24);ctx.fillStyle='#ffb347';ctx.globalAlpha=.5+.5*Math.sin(now*.01);ctx.beginPath();ctx.arc(x,by+R*1.08,R*.07,0,6.283);ctx.fill();ctx.globalAlpha=1}
 function resize(){const d=Math.min(2,devicePixelRatio||1),r=world.getBoundingClientRect();if(W!==r.width||H!==r.height){W=r.width;H=r.height;cv.width=Math.round(W*d);cv.height=Math.round(H*d);ctx.setTransform(d,0,0,d,0,0);fall=[]}}
 function seasonal(dt,k){const S=season(),N=S==='automne'?26:S==='hiver'?70:S==='printemps'?30:22;
  while(fall.length<N)fall.push({x:rnd(-40,W),y:rnd(-H,H),vx:rnd(8,26),vy:S==='hiver'?rnd(18,42):S==='ete'?rnd(-4,4):rnd(16,34),r:S==='hiver'?rnd(1.2,3):S==='ete'?rnd(.8,1.8):rnd(3,5.5),a:Math.random()*6.28,s:rnd(-2,2),c:S==='automne'?['#d9731f','#b8421c','#e0a534','#8c4a1e'][Math.floor(Math.random()*4)]:S==='printemps'?['#ffd1e3','#ffb3cf','#fff0f6'][Math.floor(Math.random()*3)]:'#fff'});
  const gust=Math.sin(performance.now()*.0004)*10;
  for(const p of fall){p.x+=(p.vx+gust)*dt;p.y+=p.vy*dt+(S==='ete'?Math.sin(p.a)*6*dt:0);p.a+=p.s*dt;if(p.y>H+20||p.x>W+40){p.x=rnd(-40,W*.7);p.y=-20;if(S==='ete')p.y=rnd(0,H)}
   if(S==='ete'){ctx.globalAlpha=(.25+.25*Math.sin(p.a*2))*(1-k);ctx.fillStyle='#fff3c4';ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,6.283);ctx.fill()}
   else if(S==='hiver'){ctx.globalAlpha=.75;ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(p.x+Math.sin(p.a)*3,p.y,p.r,0,6.283);ctx.fill()}
   else{ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.a);ctx.scale(1,Math.abs(Math.cos(p.a*1.3))*.8+.2);ctx.globalAlpha=.85*(1-k*.6);ctx.fillStyle=p.c;ctx.beginPath();ctx.ellipse(0,0,p.r,p.r*.5,0,0,6.283);ctx.fill();ctx.restore()}}}
 function frame(now){requestAnimationFrame(frame);if($('#raceScreen').classList.contains('open')||document.hidden||document.body.classList.contains('no-anim')||reduce){last=now;if(W)ctx.clearRect(0,0,W,H);return}draw(now)}
 function draw(now){const dt=Math.max(0,Math.min(.05,(now-last)/1000));last=Math.max(last,now);
  resize();ctx.clearRect(0,0,W,H);const V=village.view;if(!V.vw)return;const T=document.body.dataset.tod;
  night+=((T==='nuit'?1:0)-night)*Math.min(1,dt*1.5);eve+=((T==='soir'?1:0)-eve)*Math.min(1,dt*1.5);
  const sc=V.w/3344,P=(u,v)=>[V.x+u*V.w,V.y+v*V.h],lit=Math.min(1,night+eve*.55),t=now/1000;
  ctx.globalCompositeOperation='lighter';
  // réverbères : halo de la lanterne + flaque de lumière au sol
  if(lit>.02)for(const[i,[u,v]]of LAMPS.entries()){const[x,y]=P(u,v);if(x<-80||y<-80||x>W+80||y>H+120)continue;const fl=.9+.1*Math.sin(t*7+i*2.1)*Math.sin(t*3.1+i),R=Math.max(20,64*sc);
   let g=ctx.createRadialGradient(x,y,0,x,y,R);g.addColorStop(0,`rgba(255,226,150,${.95*lit*fl})`);g.addColorStop(.25,`rgba(255,190,90,${.45*lit*fl})`);g.addColorStop(1,'rgba(255,160,60,0)');ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,y,R,0,6.283);ctx.fill();
   const gy=y+44*sc;ctx.save();ctx.translate(x,gy);ctx.scale(1,.38);g=ctx.createRadialGradient(0,0,0,0,0,R*1.9);g.addColorStop(0,`rgba(255,200,120,${.4*lit})`);g.addColorStop(1,'rgba(255,170,80,0)');ctx.fillStyle=g;ctx.beginPath();ctx.arc(0,0,R*1.9,0,6.283);ctx.fill();ctx.restore()}
  // lucioles, la nuit
  if(night>.05)for(const f of flies){f.a+=(Math.sin(t*.7+f.p)*.9)*dt;f.u+=Math.cos(f.a)*dt*.0022;f.v+=Math.sin(f.a)*dt*.0016;const b=Math.pow(Math.max(0,Math.sin(t*f.f+f.p)),5)*night;if(b<.03)continue;
   const[x,y]=P(f.u,f.v);if(x<-10||y<-10||x>W+10||y>H+10)continue;const r=Math.max(2.4,5*sc);const g=ctx.createRadialGradient(x,y,0,x,y,r*2.6);g.addColorStop(0,`rgba(230,255,140,${b})`);g.addColorStop(1,'rgba(180,255,90,0)');ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,y,r*2.6,0,6.283);ctx.fill()}
  ctx.globalCompositeOperation='source-over';
  // fontaine : jets et gouttes
  {const[x0,y0]=P(FOUNTAIN.u,FOUNTAIN.v);if(x0>-60&&y0>-60&&x0<W+60&&y0<H+60){if(drops.length<90)for(let k=0;k<3;k++){const a=Math.random()*6.28,s=rnd(8,16);drops.push({x:0,y:0,vx:Math.cos(a)*s,vy:-rnd(34,46),vz:Math.sin(a)*s*.45,life:0})}
    ctx.fillStyle=night>.5?'#9fb4d8':'#eaf6ff';for(const d of drops){d.life+=dt;d.vy+=78*dt;d.x+=d.vx*dt;d.y+=(d.vy+d.vz)*dt;const x=x0+d.x*sc,y=y0+d.y*sc;ctx.globalAlpha=Math.max(0,.75-d.life*.5)*(1-night*.4);ctx.fillRect(x,y,Math.max(1,1.4*sc),Math.max(1.2,2.4*sc))}
    drops=drops.filter(d=>d.y<(FOUNTAIN.bv-FOUNTAIN.v)*1882+4&&d.life<1.6);
    const[bx,by]=P(FOUNTAIN.bu,FOUNTAIN.bv),ph=(t*.9)%1;ctx.globalAlpha=(1-ph)*.35;ctx.strokeStyle='#ffffff';ctx.lineWidth=Math.max(1,1.2*sc);ctx.beginPath();ctx.ellipse(bx,by,(8+ph*34)*sc,(3+ph*12)*sc,0,0,6.283);ctx.stroke()}}
  // papillons, le jour (printemps / été)
  const S=season();if(night<.5&&eve<.6&&(S==='printemps'||S==='ete'))for(const b of butterflies){b.p+=dt;b.u+=Math.cos(b.p*.7)*dt*.004+Math.sin(b.p*2.3)*dt*.002;b.v+=Math.sin(b.p*.5)*dt*.003;if(b.u<.43||b.u>.54)b.u=rnd(.45,.52);if(b.v<.54||b.v>.71)b.v=rnd(.56,.69);
   const[x,y]=P(b.u,b.v);const s=Math.max(1.6,3.2*sc),fl=Math.abs(Math.sin(b.p*22));ctx.globalAlpha=.95;ctx.fillStyle=b.c;ctx.beginPath();ctx.ellipse(x-s*.6,y,s*fl,s*.7,-.4,0,6.283);ctx.ellipse(x+s*.6,y,s*fl,s*.7,.4,0,6.283);ctx.fill()}
  drawBalloon(dt,now,P,sc);seasonal(dt,night);ctx.globalAlpha=1}
 requestAnimationFrame(frame);
 // snap(ms) : dessine une image à l'instant voulu (vérification sur capture)
 return{season,snap:draw,balloon:()=>{balloon.next=0}}})();
