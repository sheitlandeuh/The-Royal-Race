/* ===== Musique de course adaptative (synthétisée, aucun fichier) =====
   Couches ajoutées selon la tension : pulsation grave dès le départ, charleston à mi-course, nappe et tempo plus vif
   dans la dernière ligne droite, doubles croches pendant le sprint. Accent sonore à chaque temps fort.
   Planification sur l'horloge audio (anticipation de 150 ms) : aucun décalage, même si l'affichage ralentit.
   Volume : curseur « Musique » des réglages. */
const raceMusic=(()=>{let timer=0,next=0,step=0,nb=null;
 const A=()=>sound.ctx,bus=()=>sound.musicBus;
 const BASS=[55,55,65.4,49];              // la, la, do, sol (grave) : une mesure par note
 const PAD=[[220,261.6,329.6],[220,261.6,329.6],[261.6,329.6,392],[196,246.9,293.7]];
 function noiseBuf(){if(nb)return nb;const a=A(),b=a.createBuffer(1,a.sampleRate*.5,a.sampleRate),d=b.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;return nb=b}
 function kick(t,v){const a=A(),o=a.createOscillator(),g=a.createGain();o.frequency.setValueAtTime(110,t);o.frequency.exponentialRampToValueAtTime(42,t+.12);g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(.001,t+.2);o.connect(g).connect(bus());o.start(t);o.stop(t+.22)}
 function hat(t,v){const a=A(),s=a.createBufferSource(),f=a.createBiquadFilter(),g=a.createGain();s.buffer=noiseBuf();f.type='highpass';f.frequency.value=7000;g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(.001,t+.05);s.connect(f).connect(g).connect(bus());s.start(t,Math.random()*.4);s.stop(t+.06)}
 function bass(t,fq,v,d){const a=A(),o=a.createOscillator(),f=a.createBiquadFilter(),g=a.createGain();o.type='sawtooth';o.frequency.value=fq;f.type='lowpass';f.frequency.value=420;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(v,t+.02);g.gain.exponentialRampToValueAtTime(.001,t+d);o.connect(f).connect(g).connect(bus());o.start(t);o.stop(t+d+.02)}
 function pad(t,ch,v,d){const a=A();ch.forEach(fq=>{const o=a.createOscillator(),g=a.createGain();o.type='triangle';o.frequency.value=fq;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(v,t+d*.4);g.gain.linearRampToValueAtTime(0,t+d);o.connect(g).connect(bus());o.start(t);o.stop(t+d+.05)})}
 // tension de 0 (départ) à 3 (sprint)
 const level=()=>playerFinal&&playerEnergy>0?3:(progress[0]||0)>72?2:(progress[0]||0)>38?1:0;
 function schedule(){const a=A();if(!a||a.state!=='running')return;
  while(next<a.currentTime+.15){const L=level(),bpm=[112,118,132,146][L],s16=60/bpm/4,t=next,pos=step%16,bar=Math.floor(step/16)%4;
   if(pos%4===0)kick(t,pos===0?.2:.13);
   if(L>=1&&pos%2===0)hat(t,pos%4===2?.05:.025);
   if(L>=3&&pos%2===1)hat(t,.022);
   if(pos%8===0)bass(t,BASS[bar]*(L>=2&&pos===8?2:1),.09,s16*6);
   if(L>=2&&pos===0)pad(t,PAD[bar],.028,s16*16);
   next+=s16;step++}}
 function start(){if(timer||!A())return;next=A().currentTime+.05;step=0;timer=setInterval(schedule,50)}
 function stop(){clearInterval(timer);timer=0}
 hooks.on('race:go',start);hooks.on('race:end',stop);hooks.on('race:leave',stop);
 // accent sur un temps fort : montée rapide de deux notes
 hooks.on('moment:open',k=>{const a=A();if(!a||!timer)return;const t=a.currentTime+.02,f=k==='attaque'?[330,494]:k==='breche'?[392,587]:[294,440];f.forEach((fq,i)=>{const o=a.createOscillator(),g=a.createGain();o.type='square';o.frequency.value=fq;g.gain.setValueAtTime(0,t+i*.09);g.gain.linearRampToValueAtTime(.05,t+i*.09+.01);g.gain.exponentialRampToValueAtTime(.001,t+i*.09+.16);o.connect(g).connect(bus());o.start(t+i*.09);o.stop(t+i*.09+.18)})});
 return{start,stop,level}})();
