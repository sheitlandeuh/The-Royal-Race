/* ===== Son : galop, foule, cloche de départ, fanfare, interface, musique douce, speaker (tout synthétisé, aucun fichier) ===== */
const sound=(()=>{let A=null,master,sfx,mus,crowd,crowdGain,noiseBuf,musicTimer=0,gallopT=0;
 function init(){if(A)return;const C=window.AudioContext||window.webkitAudioContext;if(!C)return;A=new C();master=A.createGain();master.connect(A.destination);sfx=A.createGain();mus=A.createGain();sfx.connect(master);mus.connect(master);volumes();
  noiseBuf=A.createBuffer(1,A.sampleRate*2,A.sampleRate);const d=noiseBuf.getChannelData(0);let b=0;for(let i=0;i<d.length;i++){b=(b+.02*(Math.random()*2-1))/1.02;d[i]=b*3.5}}
 function volumes(){if(!A)return;sfx.gain.value=settings.get('sfx');mus.gain.value=settings.get('music')*.5}
 addEventListener('pointerdown',()=>{init();if(A&&A.state==='suspended')A.resume();if(A&&!musicTimer&&!$('#raceScreen').classList.contains('open'))music(true)},{capture:true});
 const env=(g,t,a,peak,rel)=>{g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(peak,t+a);g.gain.exponentialRampToValueAtTime(.0001,t+a+rel)};
 function tone(f,dur=.2,type='sine',vol=.2,when=0,dest=sfx){if(!A)return;const t=A.currentTime+when,o=A.createOscillator(),g=A.createGain();o.type=type;o.frequency.value=f;env(g,t,.01,vol,dur);o.connect(g).connect(dest);o.start(t);o.stop(t+dur+.05)}
 function noise(dur=.2,freq=800,q=1,vol=.2,when=0,type='bandpass'){if(!A)return;const t=A.currentTime+when,s=A.createBufferSource(),f=A.createBiquadFilter(),g=A.createGain();s.buffer=noiseBuf;f.type=type;f.frequency.value=freq;f.Q.value=q;env(g,t,.005,vol,dur);s.connect(f).connect(g).connect(sfx);s.start(t,Math.random());s.stop(t+dur+.05)}
 function thud(when,vol){if(!A)return;const t=A.currentTime+when,o=A.createOscillator(),g=A.createGain();o.frequency.setValueAtTime(120,t);o.frequency.exponentialRampToValueAtTime(45,t+.09);env(g,t,.004,vol,.12);o.connect(g).connect(sfx);o.start(t);o.stop(t+.2);noise(.05,1800,.8,vol*.35,when)}
 function gallop(speed,dt){if(!A)return;gallopT-=dt;if(gallopT>0)return;const stride=.62-Math.min(.2,speed*.25);gallopT=stride;[0,.07,.15,.22].forEach((w,i)=>thud(w,[.35,.28,.3,.22][i]))}
 function crowdStart(){if(!A||crowd)return;crowd=A.createBufferSource();crowd.buffer=noiseBuf;crowd.loop=true;const f=A.createBiquadFilter();f.type='bandpass';f.frequency.value=900;f.Q.value=.6;crowdGain=A.createGain();crowdGain.gain.value=.04;crowd.connect(f).connect(crowdGain).connect(sfx);crowd.start()}
 function crowdLevel(v){if(crowdGain)crowdGain.gain.setTargetAtTime(.03+v*.22,A.currentTime,.4)}
 function crowdStop(){if(crowd){crowd.stop();crowd=null;crowdGain=null}}
 const bell=()=>{[880,1320,1760].forEach((f,i)=>tone(f,1.4,'sine',.18/(i+1)));tone(660,1.2,'triangle',.08)};
 const gates=()=>{noise(.25,500,.7,.5);noise(.12,2400,2,.25,.02)};
 const click=()=>tone(1400,.05,'triangle',.06);
 const coin=()=>{tone(1318,.12,'square',.05);tone(1760,.25,'square',.05,.08)};
 const fanfare=()=>{[[523,0],[659,.14],[784,.28],[1046,.44]].forEach(([f,w])=>{tone(f,.35,'sawtooth',.06,w);tone(f/2,.35,'triangle',.08,w)});tone(1046,1,'triangle',.1,.62);tone(784,1,'triangle',.07,.62)};
 // musique : progression d'accords douce en boucle (domaine uniquement)
 const PROG=[[261.6,329.6,392],[220,261.6,329.6],[174.6,220,261.6],[196,246.9,293.7]];let step=0;
 function music(on){if(!A)return;clearInterval(musicTimer);musicTimer=0;if(!on)return;const play=()=>{const ch=PROG[step++%4];ch.forEach((f,i)=>{const t=A.currentTime,o=A.createOscillator(),g=A.createGain();o.type='triangle';o.frequency.value=f/2;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.05,t+.8);g.gain.linearRampToValueAtTime(0,t+3.9);o.connect(g).connect(mus);o.start(t);o.stop(t+4)});tone(ch[2]*2,.6,'sine',.03,1.2,mus);tone(ch[1]*2,.6,'sine',.025,2.4,mus)};play();musicTimer=setInterval(play,4000)}
 let lastSay=0;function say(txt,force){if(!settings.get('voice')||!window.speechSynthesis)return;const now=performance.now();if(!force&&now-lastSay<2500)return;lastSay=now;try{speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(txt);u.lang='fr-FR';u.rate=1.12;u.pitch=1.05;u.volume=Math.min(1,settings.get('sfx')+.2);speechSynthesis.speak(u)}catch(e){}}
 document.addEventListener('click',e=>{if(e.target.closest('button'))click()});
 return{volumes,gallop,crowdStart,crowdLevel,crowdStop,bell,gates,coin,fanfare,music,say,init}})();
const buzz=p=>{try{navigator.vibrate?.(p)}catch(e){}};
