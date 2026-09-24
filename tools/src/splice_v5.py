import re
SRC = '/home/claude/the-royal-race/index.html'
s = open(SRC, encoding='utf-8').read()
def rep(old, new, count=1):
    global s
    assert s.count(old) == count, (old[:100], s.count(old))
    s = s.replace(old, new)
W = lambda f: open('/home/claude/work/' + f, encoding='utf-8').read()
# ---------- CSS / HTML ----------
rep("  </style>", W('stableui.css') + "  </style>")
rep('<p>Tous les chevaux ont franchi le poteau</p><table>', '<p>Tous les chevaux ont franchi le poteau</p><table>')
rep('</tbody></table><button class="action green" id="showPodium">', '</tbody></table><p class="fb-gain" id="fbGain"></p><button class="action green" id="showPodium">')
rep('<button class="sprint-btn" id="sprintBtn"', '<button class="go-btn" id="goBtn" hidden>PARTEZ !</button>\n    <button class="sprint-btn" id="sprintBtn"')
# ---------- modules : écurie + 3D après les livrées, interface après l’atelier ----------
rep("const raceFX=(()=>{", W('stable.js') + "{const s0=sync;sync=function(){s0();stable.save()}}sync();\n" + W('horse3d.js') + "let racePlayer=null;\nconst raceFX=(()=>{")
rep("if(document.modelContext?.registerTool){", W('stableui.js') + "if(document.modelContext?.registerTool){")
# panels routing
rep("function openPanel(key){", "function openPanel(key){if(key==='chevaux'||key==='ecurie')return openStable();if(key==='courses')return openCourses();$('#panel .card').classList.remove('wide');")
# village buildings -> training
rep("$('#infoBtn').onclick=()=>openPanel(state.building||'Domaine');",
    "const TRAIN_AT={carriere:['train','carriere'],paddocks:['train','paddocks'],clinique:['care','clinique'],moulin:['care','moulin']};\n$('#infoBtn').onclick=()=>{const t=TRAIN_AT[state.buildingId];if(t){village.deselect();return openStable({tab:t[0],filter:t[1]})}openPanel(state.building||'Domaine')};")
rep("$('#selection').classList.add('open')}\nvillage.onSelect=selectBuilding;", "$('#infoBtn').textContent=TRAIN_AT_LABEL[id]||'INFOS';$('#selection').classList.add('open')}\nconst TRAIN_AT_LABEL={carriere:'ENTRAÎNER',paddocks:'ENTRAÎNER',clinique:'SOINS',moulin:'RATION'};\nvillage.onSelect=selectBuilding;")
# ---------- race: 3D models + liveries from the declared field ----------
m = re.search(r"function liveries\(q\)\{if\(!fx\)return;.*?fx\.liv=list;", s, re.S); assert m
s = s[:m.start()] + """function liveries(q){if(!fx)return;LIVERY.ready.then(()=>{const me=champion.get(),F=currentField||buildField(),list=[me,...F.rivals.map(r=>r.livery)];fx.liv=list;
  (fx.h3d||[]).forEach(m=>{q.scene.remove(m);HORSE3D.dispose(m)});fx.h3d=list.map(l=>{const m=HORSE3D.build(l);m.scale.setScalar(4.4);m.visible=false;q.scene.add(m);return m});""" + s[m.end():]
rep("  if(h.material.map!==fx.gallop[i])h.material.map=fx.gallop[i];",
    """  if(h.material.map!==fx.gallop[i])h.material.map=fx.gallop[i];
  {const m=fx.h3d&&fx.h3d[i];if(m){const c=q.camera.position,dx=c.x-p.p.x,dz=c.z-p.p.z,L=Math.hypot(dx,dz)||1,behind=-(dx*p.f.x+dz*p.f.z)/L,three=behind<.72||(c.y-5)/L>.42;m.visible=three;h.visible=!three;fx.use3d=fx.use3d||[];fx.use3d[i]=three;
   if(three){m.position.set(p.p.x,0,p.p.z);m.rotation.y=Math.atan2(-p.f.z,p.f.x);HORSE3D.pose(m,((fx.phase[i]/8)%1+1)%1,running?1:.12)}}}""")
rep("const s=fx.horseShadows[i];s.visible=h.visible;", "const s=fx.horseShadows[i];s.visible=h.visible&&!(fx.use3d&&fx.use3d[i]);")
rep("function podium(q,i){fx&&(fx.horseShadows[i].visible=false)}", "function podium(q,i){if(!fx)return;fx.horseShadows[i].visible=false;if(fx.h3d&&fx.h3d[i])fx.h3d[i].visible=false}")
# ---------- simulation driven by the horse statistics ----------
rep("function startRace(){if(state.feed<500)return toast('Fourrage insuffisant');",
    "function startRace(){const RH=stable.active();if(RH.injury)return toast(`${RH.name} est blessé`);if(RH.fatigue>=90)return toast(`${RH.name} est trop fatigué pour courir`);if(!currentField)buildField();racePlayer=stable.racePerf(RH.stats,RH,1600,RH.dist,state.strategy);$('#goBtn').hidden=true;if(state.feed<500)return toast('Fourrage insuffisant');")
rep("const target=(boxed?.29:sprinting?.64:phase>72?.53:.465)*(1-wide*.105)*(playerEnergy<15?.82:1)+(inDraft?.015:0);",
    "const cr=racePlayer.cruise*(phase<55?racePlayer.tactic.c:1),target=(boxed?racePlayer.boxed:sprinting?cr+racePlayer.sprint:phase>72?cr+.045:cr)*(1-wide*.105)*(playerEnergy<15?.85:playerEnergy<30?.95:1)+(inDraft?racePlayer.draft:0)+(Math.random()-.5)*racePlayer.noise*6;")
rep("playerEnergy=clampRace(playerEnergy+(sprinting?-(inDraft?.24:.48):inDraft?.11:.065)-(wide*.035),0,100);",
    "playerEnergy=clampRace(playerEnergy-(sprinting?racePlayer.sprintDrain*(inDraft?.7:1):racePlayer.drain*(inDraft?.5:1)*(phase<55?racePlayer.tactic.d:1))-wide*.03,0,100);")
rep("ai.energy=clampRace(ai.energy+(attacking?-(shelter?.22:.4):shelter?.12:.07)-wide*.025,0,100);const target=(ai.cruise+(attacking?.12*clampRace(ai.energy/30,.55,1):0)+(own>74?.025:0)+(shelter?.014:0))*(1-wide*.125)*(ai.energy<13?.83:1);",
    "const P=ai.P,early=own<55;ai.energy=clampRace(ai.energy-(attacking?P.sprintDrain*(shelter?.7:1):P.drain*(shelter?.5:1)*(early?P.tactic.d:1))-wide*.03,0,100);const target=(P.cruise*(early?P.tactic.c:1)+(attacking?P.sprint*clampRace(ai.energy/30,.55,1):0)+(own>72?.045:0)+(shelter?P.draft:0))*(1-wide*.125)*(ai.energy<15?.85:ai.energy<30?.95:1)+(Math.random()-.5)*P.noise*6;")
rep("const wantsAttack=own>ai.sprintAt||gap>3&&Math.random()<.3;", "const wantsAttack=own>ai.sprintAt||gap>6&&own>35&&Math.random()<.15;")
rep("ai.sprintUntil=raceTime+16+Math.floor(Math.random()*26);", "ai.sprintUntil=raceTime+18+Math.floor(Math.random()*14);")
m = re.search(r"function initRivalAI\(\)\{.*?\}\)\)\}", s); assert m
s = s[:m.start()] + "function initRivalAI(){const F=currentField||buildField();rivalAI=F.rivals.map((r,i)=>{const P=stable.racePerf(r.stats,{form:52+Math.random()*18,fatigue:10,moral:65},1600,r.pref,['leader','stalker','finisher'][Math.floor(Math.random()*3)]);return{P,speed:P.cruise,cruise:P.cruise,targetLane:[12,28,56,72,88][i],nextDecision:6+Math.floor(Math.random()*13),sprintAt:60+Math.random()*24,sprintUntil:0,sprints:0,energy:100,temper:1}})}" + s[m.end():]
# start from the stalls: window depends on 'Départ', false start on 'Tempérament', touch button
rep("const reaction=now-q.goTime+(q.falseStartPenalty||0);", "const reaction=now-q.goTime+(q.falseStartPenalty||0),RW=racePlayer?racePlayer.window:180;$('#goBtn').hidden=true;")
rep("q.falseStartPenalty=450;", "q.falseStartPenalty=Math.round(300+(racePlayer?racePlayer.noise/.00008*8:150));")
s = s.replace("reaction<180", "reaction<RW").replace("reaction<320", "reaction<RW*1.78").replace("reaction<520", "reaction<RW*2.9")
rep("'PRÉPARE LA TOUCHE F'", "'PRÉPARE-TOI'")
rep("'APPUYE SUR F !'", "'PARTEZ !'")
rep("if(elapsed>=8200&&q.startPhase!=='waiting'){", "if(elapsed>=5200)$('#goBtn').hidden=false;if(elapsed>=8200&&q.startPhase!=='waiting'){")
rep("$('#sprintBtn').onclick=sprint;", "$('#sprintBtn').onclick=sprint;$('#goBtn').onclick=launchFromStalls;")
rep("function leaveRace(){", "function leaveRace(){$('#goBtn').hidden=true;")
# HUD rank after the line
rep("rank=ranked.findIndex(x=>x.i===0)+1;$('#racePosition').textContent=rank+(rank===1?'er':'e');$('#meters').textContent=fmt(Math.max(0,Math.round(1600*(1-Math.min(100,progress[0])/100))));",
    "rank=raceFinished[0]?finishOrder.indexOf(0)+1:ranked.findIndex(x=>x.i===0)+1;$('#racePosition').textContent=rank+(rank===1?'er':'e');$('#meters').textContent=fmt(Math.max(0,Math.round(1600*(1-Math.min(100,progress[0])/100))));")
# rewards, XP, condition after the race
rep("if(win){state.gold+=7000;state.trophies+=30}else{state.gold+=1800;state.trophies+=Math.max(3,18-rank*2)}sync();const first=",
    "const prize=win?7000:[0,3200,1800,1200,900,700][rank-1]||700;state.gold+=prize;state.trophies+=win?30:Math.max(3,18-rank*2);sync();const AR=stable.afterRace(stable.data.active,rank,6);$('#fbGain').textContent=`+${fmt(prize)} or · +${AR.xp} XP · Fatigue +24${AR.up?` · NIVEAU ${stable.active().level} ATTEINT !`:''}`;currentField=null;const first=")
open(SRC, 'w', encoding='utf-8').write(s); print('ok', len(s))
