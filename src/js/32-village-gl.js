/* ===== Domaine en rendu UHD (WebGL2) =====
   La peinture n'est plus affichée telle quelle : un shader la redessine à la résolution exacte de l'écran, quel que soit le zoom
   (interpolation Catmull-Rom + netteté + grain peint synthétique), et l'anime : vent dans les arbres, eau qui coule et scintille,
   ailes du moulin qui tournent, ombres de nuages, rais de soleil, lumière du matin / du soir / de la nuit avec fenêtres éclairées.
   Des masques (végétation, eau, lumières) sont calculés une fois à partir des couleurs de la peinture.
   Repli automatique sur l'image simple si WebGL2 manque, si la qualité est « basse » ou si le contexte est perdu. */
const villageGL=(()=>{
 const world=$('#world'),cv=document.createElement('canvas');cv.id='villageGL';cv.setAttribute('aria-hidden','true');world.prepend(cv);
 // moulin : moyeu (coordonnées carte), rayon des ailes en pixels de la peinture, écrasement horizontal dû à la perspective
 const MILL={u:.8485,v:.6376,R:174,sx:.78};
 const TOD={jour:[1,0,0,0],matin:[0,1,0,0],soir:[0,0,1,0],nuit:[0,0,0,1]};
 let gl=null,P=null,U={},tex=null,msk=null,ready=false,lost=false,w=[1,0,0,0],skip=0;
 const VS=`#version 300 es
uniform vec2 uView;out vec2 vPos;
void main(){vec2 p=vec2(float((gl_VertexID<<1)&2),float(gl_VertexID&2));gl_Position=vec4(p*2.-1.,0.,1.);vPos=vec2(p.x,1.-p.y)*uView;}`;
 const FS=`#version 300 es
precision highp float;
uniform sampler2D uTex,uMask;uniform vec4 uCam,uMill,uW;uniform vec2 uView,uTexSize;uniform float uTime,uMag;
in vec2 vPos;out vec4 o;
float h21(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}
float n2(vec2 p){vec2 i=floor(p),f=fract(p);vec2 u=f*f*(3.-2.*f);return mix(mix(h21(i),h21(i+vec2(1,0)),u.x),mix(h21(i+vec2(0,1)),h21(i+vec2(1,1)),u.x),u.y);}
float fbm(vec2 p){float s=0.,a=.5;for(int i=0;i<4;i++){s+=a*n2(p);p=p*2.03+17.1;a*=.5;}return s;}
// Catmull-Rom en 9 lectures (filtrage bilinéaire exploité) : agrandissement net, sans flou
vec3 catrom(vec2 uv){vec2 sp=uv*uTexSize,tp=floor(sp-.5)+.5,f=sp-tp;
 vec2 w0=f*(-.5+f*(1.-.5*f)),w1=1.+f*f*(-2.5+1.5*f),w2=f*(.5+f*(2.-1.5*f)),w3=f*f*(-.5+.5*f),w12=w1+w2;
 vec2 t0=(tp-1.)/uTexSize,t3=(tp+2.)/uTexSize,t12=(tp+w2/w12)/uTexSize;
 vec3 r=texture(uTex,vec2(t0.x,t0.y)).rgb*w0.x*w0.y+texture(uTex,vec2(t12.x,t0.y)).rgb*w12.x*w0.y+texture(uTex,vec2(t3.x,t0.y)).rgb*w3.x*w0.y
  +texture(uTex,vec2(t0.x,t12.y)).rgb*w0.x*w12.y+texture(uTex,vec2(t12.x,t12.y)).rgb*w12.x*w12.y+texture(uTex,vec2(t3.x,t12.y)).rgb*w3.x*w12.y
  +texture(uTex,vec2(t0.x,t3.y)).rgb*w0.x*w3.y+texture(uTex,vec2(t12.x,t3.y)).rgb*w12.x*w3.y+texture(uTex,vec2(t3.x,t3.y)).rgb*w3.x*w3.y;
 return clamp(r,0.,1.);}
float armD(float a){return abs(mod(a,1.5707963)-.7853982);}
void main(){
 vec2 uv=clamp((vPos-uCam.xy)/uCam.zw,vec2(0.),vec2(1.));float t=uTime;
 vec4 m=texture(uMask,uv);
 // vent : les frondaisons oscillent, par rafales qui traversent le domaine
 float gust=.45+.55*smoothstep(-.4,1.,sin(uv.x*7.-uv.y*4.+t*.8));
 vec2 suv=uv;if(m.r>.01)suv+=(vec2(n2(uv*60.+vec2(t*.8,0.)),n2(uv*60.+vec2(9.,t*.7)))-.5)*m.r*gust*2.6/uTexSize;
 // eau : le courant déforme la peinture
 if(m.g>.01)suv+=(vec2(fbm(uv*vec2(80.,120.)+vec2(t*.5,t*.18)),fbm(uv*vec2(100.,70.)-vec2(t*.22,t*.4)))-.5)*m.g*10./uTexSize;
 // moulin : les ailes peintes tournent ; là où elles étaient, on reprend le décor situé entre deux ailes
 vec2 d=(uv-uMill.xy)*uTexSize;vec2 q=vec2(d.x/uMill.w,d.y);float r=length(q);
 if(r<uMill.z&&r>6.){float a=atan(q.y,q.x),hw=mix(4.,15.,smoothstep(.2,.32,r/uMill.z));
  float th=t*.55;if(r*sin(armD(a-th))<hw){float c=cos(th),s=sin(th);vec2 q2=vec2(c*q.x+s*q.y,-s*q.x+c*q.y);suv=uMill.xy+vec2(q2.x*uMill.w,q2.y)/uTexSize;}
  else if(r*sin(armD(a))<hw+3.){// on recouvre l'aile peinte par le reflet de la bande de décor juste à côté
   float al=floor(a/1.5707963)*1.5707963+.7853982;vec2 ax=vec2(cos(al),sin(al)),nx=vec2(-ax.y,ax.x);float pd=dot(q,nx),W=hw+3.;
   vec2 q2=dot(q,ax)*ax+sign(pd+1e-4)*(2.*W-abs(pd)+2.)*nx;suv=uMill.xy+vec2(q2.x*uMill.w,q2.y)/uTexSize;}}
 // lecture : nette quand on zoome, filtrée quand on dézoome
 vec3 c=uMag>1.02?catrom(suv):texture(uTex,suv).rgb;
 vec3 soft=textureLod(uTex,suv,uMag>1.02?1.:1.+log2(1./uMag)).rgb;
 c=clamp(c+(c-soft)*.5,0.,1.);
 // grain peint : du détail là où la peinture n'en a plus (fort zoom)
 float dk=smoothstep(1.2,2.6,uMag);if(dk>0.){float g=fbm(suv*uTexSize*.85)-.5;c*=1.+g*.1*dk;}
 // eau : teinte, reflets du ciel, étincelles de soleil
 c=mix(c,c*vec3(.86,1.,1.1)+vec3(0.,.02,.05),m.g*.35);
 float glim=0.;if(m.g>.01){glim=pow(n2(uv*vec2(1150.,1800.)+vec2(t*1.4,-t*.9)),16.)*m.g;c+=smoothstep(.6,.72,fbm(uv*vec2(170.,250.)+vec2(t*.55,t*.22)))*m.g*.1;}
 // ombres de nuages qui glissent
 vec2 cp=uv*vec2(2.4,1.4)+vec2(t*.007,t*.003);float cl=smoothstep(.5,.8,n2(cp)*.62+n2(cp*2.1+5.)*.38);
 c*=1.-cl*.2*(1.-uW.w);
 // halo des hautes lumières
 vec3 bl=textureLod(uTex,uv,4.).rgb;c+=max(bl-.7,0.)*.4*(1.-uW.w);
 float l=dot(c,vec3(.299,.587,.114));
 // rais de soleil venus du coin haut gauche
 vec2 sp=vPos/uView.y,rp=vec2((sp.x*.75+sp.y*.66)*5.,t*.035);float ray=smoothstep(.5,.85,n2(rp)*.6+n2(rp*2.3+3.)*.4)*(1.-clamp(sp.y,0.,1.)*.7);
 // quatre éclairages, mélangés selon l'heure (uW = jour, matin, soir, nuit)
 vec3 day=mix(vec3(l),c,1.1)*1.02+vec3(1.,.9,.7)*ray*.07+glim*1.5;
 vec3 morn=c*vec3(1.07,.97,.93)+vec3(.04,.012,.035)*(1.-l)+vec3(1.,.8,.75)*ray*.1+glim;
 float e=m.b,glow=textureLod(uMask,uv,4.5).b;
 vec3 eve=mix(c*vec3(1.16,.9,.66),vec3(.3,.17,.33)*l*1.4,smoothstep(.45,.05,l)*.45)+vec3(1.,.62,.3)*ray*.12+c*e*.35+vec3(1.,.66,.3)*glow*.18+glim*.8;
 vec3 night=c*vec3(.2,.27,.5)+vec3(.006,.012,.035)+c*vec3(1.4,1.,.55)*e*1.6+vec3(1.,.66,.3)*glow*.7+glim*vec3(.4,.5,.8)*.5;
 vec3 g=day*uW.x+morn*uW.y+eve*uW.z+night*uW.w;
 // profondeur de champ : haut et bas de l'écran légèrement flous (effet maquette)
 float sy=vPos.y/uView.y,ts=smoothstep(.18,0.,sy)*.8+smoothstep(.86,1.05,sy)*.5;
 if(ts>0.){vec3 bb=textureLod(uTex,uv,2.2).rgb;g=mix(g,g/max(c,vec3(.03))*bb,ts*.5);}
 vec2 vd=vPos/uView-.5;g*=1.-dot(vd,vd)*.32;
 o=vec4(clamp(g,0.,1.),1.);}`;
 function compile(){const sh=(t,s)=>{const x=gl.createShader(t);gl.shaderSource(x,s);gl.compileShader(x);if(!gl.getShaderParameter(x,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(x));return x};
  P=gl.createProgram();gl.attachShader(P,sh(gl.VERTEX_SHADER,VS));gl.attachShader(P,sh(gl.FRAGMENT_SHADER,FS));gl.linkProgram(P);if(!gl.getProgramParameter(P,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(P));
  gl.useProgram(P);for(const k of['uTex','uMask','uCam','uMill','uW','uView','uTexSize','uTime','uMag'])U[k]=gl.getUniformLocation(P,k);gl.uniform1i(U.uTex,0);gl.uniform1i(U.uMask,1)}
 function texture(src,unit){const t=gl.createTexture();gl.activeTexture(gl.TEXTURE0+unit);gl.bindTexture(gl.TEXTURE_2D,t);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,src);gl.generateMipmap(gl.TEXTURE_2D);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR_MIPMAP_LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);return t}
 // masques tirés des couleurs de la peinture : R = frondaisons, G = eau, B = fenêtres et lanternes (bâtiments seulement)
 function masks(img){const W=1672,H=941,c=document.createElement('canvas');c.width=W;c.height=H;const x=c.getContext('2d',{willReadFrequently:true});x.drawImage(img,0,0,W,H);
  const p=x.getImageData(0,0,W,H).data,out=x.createImageData(W,H),q=out.data,GW=168,GH=95,near=new Float32Array(GW*GH),B=Object.values(VILLAGE.buildings);
  for(let j=0;j<GH;j++)for(let i=0;i<GW;i++){let mn=9;const u=(i+.5)/GW,v=(j+.5)/GH;for(const[a,b]of VILLAGE.water){const dd=Math.hypot((u-a)*1.78,v-b);if(dd<mn)mn=dd}near[j*GW+i]=mn}
  const inB=(u,v)=>B.some(b=>u>b.x&&u<b.x+b.w&&v>b.y+b.h*.12&&v<b.y+b.h);
  // luminosité moyenne du voisinage (image réduite 1/8) : une lumière est un petit point bien plus clair que ce qui l'entoure
  const SW=209,SH=118,sc=document.createElement('canvas');sc.width=SW;sc.height=SH;const sx=sc.getContext('2d',{willReadFrequently:true});sx.drawImage(img,0,0,SW,SH);const sd=sx.getImageData(0,0,SW,SH).data;
  const around=(u,v)=>{const k=(Math.min(SH-1,Math.floor(v*SH))*SW+Math.min(SW-1,Math.floor(u*SW)))*4;return(sd[k]*.299+sd[k+1]*.587+sd[k+2]*.114)/255};
  for(let y=0;y<H;y++){const v=y/H;for(let X=0;X<W;X++){const i=(y*W+X)*4,r=p[i]/255,g=p[i+1]/255,b=p[i+2]/255,mx=Math.max(r,g,b),mn=Math.min(r,g,b),s=mx?(mx-mn)/mx:0,u=X/W;let veg=0,wat=0,em=0;
   if(g>r*1.02&&g>b*1.12&&mx<.62&&s>.22)veg=Math.min(1,(g-Math.max(r,b))*6);
   const nw=near[Math.floor(v*GH)*GW+Math.floor(u*GW)];if(nw<.06){if(b>r*1.12&&b>=g*.92&&mx>.3)wat=1;else if(mn>.74&&s<.2)wat=.6;wat*=1-Math.max(0,(nw-.04)/.02)}
   if(mx>.78&&r>=g&&(r-b)/r>.42&&inB(u,v)){const lum=r*.299+g*.587+b*.114,k=lum-around(u,v);if(k>.16)em=Math.min(1,(k-.16)*5)}
   q[i]=veg*255;q[i+1]=wat*255;q[i+2]=em*255;q[i+3]=255}}
  x.putImageData(out,0,0);return c}
 function init(){if(gl||lost)return;try{gl=cv.getContext('webgl2',{antialias:false,alpha:false,premultipliedAlpha:false,powerPreference:'high-performance'});if(!gl)return;compile();
   const img=new Image();img.decoding='async';img.onload=()=>{try{tex=texture(img,0);gl.uniform2f(U.uTexSize,img.naturalWidth,img.naturalHeight);
     const run=()=>{msk=texture(masks(img),1);ready=true};window.requestIdleCallback?requestIdleCallback(run,{timeout:1500}):setTimeout(run,60)}catch(e){fail(e)}};img.src=$('.map-base').src}catch(e){fail(e)}}
 function fail(e){console.warn('rendu du domaine : repli sur l’image',e);ready=false;world.classList.remove('gl-on')}
 cv.addEventListener('webglcontextlost',e=>{e.preventDefault();lost=true;fail('contexte perdu')});
 let off=false;// villageGL.off = true : revient à l'image simple (comparaison avant / après)
 function frame(now){requestAnimationFrame(frame);const on=settings.level()!=='basse'&&!off;if(!on){world.classList.remove('gl-on');return}if(!gl&&!lost)init();if(!ready)return;
  if($('#raceScreen').classList.contains('open')||document.hidden)return;if(settings.level()==='moyenne'&&(skip^=1))return;
  draw(now/1000)}
 function draw(time,W4){const V=village.view;if(!V.vw||!ready)return;const dpr=Math.min(settings.level()==='haute'?2:1.25,devicePixelRatio||1),W=Math.round(V.vw*dpr),H=Math.round(V.vh*dpr);if(cv.width!==W||cv.height!==H){cv.width=W;cv.height=H}
  const T=TOD[document.body.dataset.tod]||TOD.jour;w=W4||w.map((x,i)=>x+(T[i]-x)*.03);
  gl.viewport(0,0,W,H);gl.uniform2f(U.uView,V.vw,V.vh);gl.uniform4f(U.uCam,V.x,V.y,V.w,V.h);gl.uniform1f(U.uTime,time);gl.uniform1f(U.uMag,V.w*dpr/3344);
  gl.uniform4f(U.uMill,MILL.u,MILL.v,MILL.R,MILL.sx);gl.uniform4f(U.uW,...w);gl.drawArrays(gl.TRIANGLES,0,3);world.classList.add('gl-on')}// l'image simple ne disparaît qu'une fois la première image dessinée
 requestAnimationFrame(frame);
 // snap(t, 'nuit') : dessine une image à l'instant t (s) et à l'heure voulue — pour les captures de vérification
 return{get ready(){return ready},set off(v){off=!!v},snap:(t,k)=>draw(t,k&&TOD[k])}})();
