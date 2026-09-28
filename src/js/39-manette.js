/* ===== Manette (standard) =====
   Course multijoueur : il n'y a pas de pause. La course avance à l'horloge, même si le jeu passe en arrière-plan (appel,
   notification, autre onglet) : au retour, elle a continué sans toi, comme pour les autres partants.
   A = sprint / valider, croix ou stick = se décaler, X / Y = choix des temps forts, ↑ / ↓ (haies) = élan, LB / RB = regarder sur les côtés. */
const manette=(()=>{
 const open=()=>$('#raceScreen').classList.contains('open');
 let prev=[],nextSteer=0,announced=false;
 addEventListener('gamepadconnected',()=>{if(announced)return;announced=true;toast('Manette connectée : A = sprint · croix = se décaler · X / Y = temps forts')});
 function poll(now){requestAnimationFrame(poll);const gp=[...(navigator.getGamepads?.()||[])].find(Boolean);if(!gp)return;
  const P=gp.buttons.map(b=>b.pressed),E=P.map((p,i)=>p&&!prev[i]);prev=P;const vis=s=>{const x=$(s);return x&&x.offsetParent&&!x.hidden?x:null};
  if(!open()){if(E[0])(vis('.coach:not([hidden]) button')||vis('#panel.open #raceJoin')||vis('#playBtn'))?.click();return}
  if(E[0]){const c=vis('.coach:not([hidden]) button');if(c)c.click();else if(raceLoop)sprint();else(vis('#raceResult.show #raceAgain')||vis('#finishBoard.show #showPodium')||vis('#raceResult.show #returnDomain'))?.click()}
  if(moments.active){if(E[2])moments.choose('a');if(E[3])moments.choose('b')}
  if(haies.active&&raceLoop){const S=haies.state;if(E[12])haies.choose(S.choice==='f'?'n':'f');if(E[13])haies.choose(S.choice==='p'?'n':'p')}
  const ax=gp.axes[0]||0,left=P[14]||ax<-.55,right=P[15]||ax>.55;if((left||right)&&now>nextSteer){steer(left?-1:1);nextSteer=now+220}if(!left&&!right)nextSteer=0;
  if(E[4])look(-1);if(E[5])look(1)}
 requestAnimationFrame(poll);
 return{get connected(){return !!prev.length}}})();
