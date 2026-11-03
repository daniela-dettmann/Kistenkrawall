/* Kistenkrawall: Spielablauf (Start, Wellen, Pause, Ende) und Hauptschleife */
'use strict';
/* ---------- Game flow ---------- */
function clearWorld(){
  for(const u of units){scene.remove(u.bot.g);scene.remove(u.bot.blob);u.tag.el.remove();}
  units=[];for(const c of crates.slice())removeCrate(c);crates=[];
  for(const s of shots)scene.remove(s.m);shots=[];
  for(const p of parts)scene.remove(p.m);parts=[];
  for(const p of planes)scene.remove(p.g);planes=[];
  for(const b of bombs)scene.remove(b.m);bombs=[];
  for(const p of pads)p.stack=[];
  for(const h of hqs){h.hp=h.max;h.dead=false;h.g.scale.y=1;h.bodyMat.color.set(TEAMC[h.team]).multiplyScalar(.72);}
  usedNames.clear();player=null;
}
function newGame(attract){
  clearWorld();
  gameT=0;spawnT=2;peaceT=0;queuedStrikes=[];respawns=[];placeQueue=[];teams[0].tempoT=teams[1].tempoT=0;teams[0].collect='blau';teams[1].collect=null;if(typeof syncCollect==='function')syncCollect();teams[1].wave={phase:'idle',t:0,groups:[]};waveT=0;waveNo=0;Object.assign(stats,{kills:0,stacked:0,stolen:0,opened:0});
  const b0=BASES[0],b1=BASES[1];
  const nE=attract?3:D.units;
  const roles=['sammler','kaempfer','sammler','kaempfer'];
  for(let i=0;i<3;i++)spawnUnit(0,b0.x-2+i*2,b0.z-3,roles[i]);
  for(let i=0;i<nE;i++)spawnUnit(1,b1.x-3+i*2,b1.z+3,roles[i]);
  for(let i=0;i<6;i++){const d=DROPS[i%2],ox=(i%4<2?-1:1)*rand(1.8,4),zm=ISL_RZ*0.7*Math.sqrt(Math.max(0,1-(ox/ISL_RX)**2));spawnCrate(d.x+ox,(i%3?1:-1)*rand(0.1,1)*zm,false,false,d.sort);}
  teams[0].openTarget=pickTarget(0);teams[1].openTarget=pickTarget(1);
  if(!attract){setPlayer(units[0]);units[0].role='sammler';camYaw=Math.PI;}
}
function endGame(win,why){
  state='end';fireHeld=false;
  $('#hud').hidden=true;$('#menu').hidden=false;
  $('#panelStart').hidden=true;$('#panelPause').hidden=true;$('#panelEnd').hidden=false;
  const t=$('#resultTitle');t.textContent=win?'Sieg!':'Verschrottet';t.className='result '+(win?'win':'lose');
  const m=Math.floor(gameT/60),s=String(Math.floor(gameT%60)).padStart(2,'0');
  $('#resultText').textContent=`${why} Spielzeit ${m}:${s}. Von dir: ${stats.kills} Abschüsse, ${stats.stacked} Kisten gestapelt, ${stats.stolen} geklaut, ${stats.opened} Stapel ausgepackt. Überstandene Wellen: ${Math.max(0,waveNo-(waveT>0?1:0))}.`;
}
function startAttack(){
  peaceT=0;waveNo++;waveT=D.waveLen;
  toast(`Welle ${waveNo}! Die Bauruhe ist vorbei`,2.6);
  sfx('drum');
  for(const q of queuedStrikes)callAirstrike(q.team,q.owner&&q.owner.alive?q.owner:null,q.boost);
  queuedStrikes=[];
  for(const u of units)u.thinkT=0;
  $('#attackNowBtn').hidden=true;
}
function startRest(){
  peaceT=peaceMin*60;
  for(const sh of shots)scene.remove(sh.m);shots=[];
  for(const b of bombs)scene.remove(b.m);bombs=[];
  for(const u of units){u.attacker=false;u.go=false;u.thinkT=0;if(u.plan==='fight'||u.plan==='assault'||u.plan==='defend')u.plan='patrol';}
  toast(`Welle ${waveNo} überstanden! ${peaceMin} Minuten Bauruhe`,2.8);
  sfx('repair');
}
function startGame(){
  initAudio();if(AC&&AC.state==='suspended')AC.resume();
  tryLandscape();
  newGame(false);state='play';
  $('#menu').hidden=true;$('#hud').hidden=false;
  peaceT=peaceMin*60;queuedStrikes=[];
  toast(`Bauruhe: ${peaceMin} Minuten aufbauen, dann kommt Welle 1`,2.8);
  const jh=$('#joyHint');jh.hidden=false;clearTimeout(window.__jh);window.__jh=setTimeout(()=>{jh.hidden=true;},6000);
}
function pause(on){
  if(on&&state==='play'){state='pause';fireHeld=false;$('#attackNowBtn').hidden=!(peaceT>0);$('#menu').hidden=false;$('#panelStart').hidden=true;$('#panelEnd').hidden=true;$('#panelPause').hidden=false;}
  else if(!on&&state==='pause'){state='play';$('#menu').hidden=true;}
}
function toMenu(){
  state='menu';$('#hud').hidden=true;$('#menu').hidden=false;
  $('#panelStart').hidden=false;$('#panelEnd').hidden=true;$('#panelPause').hidden=true;
  newGame(true);
}
$('#startBtn').addEventListener('click',startGame);
function syncSoundUI(){
  for(const b of document.querySelectorAll('.sndBtn')){b.setAttribute('aria-pressed',soundOn?'true':'false');b.textContent=soundOn?'Ton an':'Ton aus';}
  for(const r of document.querySelectorAll('.sndVol input')){r.value=soundVol;r.disabled=!soundOn;}
}
for(const b of document.querySelectorAll('.sndBtn'))b.addEventListener('click',()=>{
  soundOn=!soundOn;try{localStorage.setItem('kk-snd',soundOn?'1':'0');}catch(e){}
  initAudio();applyVolume();syncSoundUI();
  if(soundOn&&AC)playSound(AC,noiseBuf,'pick',1,master);
});
for(const r of document.querySelectorAll('.sndVol input')){
  r.addEventListener('input',()=>{soundVol=+r.value;try{localStorage.setItem('kk-vol',String(soundVol));}catch(e){}initAudio();applyVolume();syncSoundUI();});
  r.addEventListener('change',()=>{if(AC&&soundOn)playSound(AC,noiseBuf,'hit',1,master);});
}
syncSoundUI();
$('#helpBtn').addEventListener('click',()=>{$('#panelStart').hidden=true;$('#panelHelp').hidden=false;$('#menu').scrollTop=0;});
$('#helpBack').addEventListener('click',()=>{$('#panelHelp').hidden=true;$('#panelStart').hidden=false;});
$('#againBtn').addEventListener('click',startGame);
$('#toMenuBtn').addEventListener('click',toMenu);
$('#resumeBtn').addEventListener('click',()=>pause(false));
$('#restartBtn').addEventListener('click',startGame);
$('#quitBtn').addEventListener('click',toMenu);
$('#pauseBtn').addEventListener('click',()=>pause(true));
$('#attackNowBtn').addEventListener('click',()=>{pause(false);startAttack();});
for(const b of document.querySelectorAll('#peaceSeg button')){
  b.setAttribute('aria-pressed',+b.dataset.p===peaceMin?'true':'false');
  b.addEventListener('click',()=>{peaceMin=+b.dataset.p;try{localStorage.setItem('kk-rest',String(peaceMin));}catch(e){}
    for(const o of document.querySelectorAll('#peaceSeg button'))o.setAttribute('aria-pressed',o===b?'true':'false');});
}
for(const b of document.querySelectorAll('#diffSeg button')){
  b.setAttribute('aria-pressed',b.dataset.d===diffKey?'true':'false');
  b.addEventListener('click',()=>{diffKey=b.dataset.d;D=DIFFS[diffKey];try{localStorage.setItem('kk-diff',diffKey);}catch(e){}
    for(const o of document.querySelectorAll('#diffSeg button'))o.setAttribute('aria-pressed',o===b?'true':'false');});
}

/* ---------- Update ---------- */
const v3=new THREE.Vector3();
function update(dt){
  const playing=state==='play';
  gameT+=dt;
  // crate drops
  spawnT-=dt;
  const loose=crates.filter(c=>c.state!=='stack').length;
  peaceWarnT-=dt;
  // rhythm: rest phase for building, then an attack wave, then rest again
  if(state==='play'){
    if(peaceT>0){peaceT-=dt;if(peaceT<=0){peaceT=0;startAttack();}}
    else if(waveT>0){waveT-=dt;if(waveT<=0){waveT=0;startRest();}}
  }
  if(spawnT<=0){const pc=inPeace();spawnT=pc?rand(2.4,4):rand(3.5,6.5);if(loose<(pc?16:13)){spawnSide=-spawnSide;
      const goldLoose=crates.some(c=>c.gold&&c.state!=='stack'),isGold=!goldLoose&&Math.random()<(pc?0.08:0.14);
      // pick the deck with fewer crates on it so neither runs over; gold lands on either deck
      const onDeck=d=>crates.filter(c=>c.state!=='stack'&&Math.abs(c.x-d.x)<ISL_RX+0.5&&Math.abs(c.z)<ISL_RZ+0.5).length;
      const cand=DROPS.filter(d=>onDeck(d)<7);
      if(cand.length){const d=cand.length>1&&!isGold?(onDeck(cand[0])<=onDeck(cand[1])?(Math.random()<0.65?cand[0]:cand[1]):(Math.random()<0.65?cand[1]:cand[0])):pick(cand);
        const ox=(Math.random()<.5?-1:1)*rand(1.7,4.4),zm=ISL_RZ*0.72*Math.sqrt(Math.max(0,1-(ox/ISL_RX)**2));spawnCrate(d.x+ox,spawnSide*rand(0.1,1)*zm,true,isGold,d.sort);}}}

  // player control
  if(!(playing&&player&&player.alive))updateLockMarker(null);
  if(playing&&player&&player.alive){
    let ix=joy.x,iz=-joy.y;
    if(keys['w']||keys['arrowup'])iz+=1;if(keys['s']||keys['arrowdown'])iz-=1;
    if(keys['a'])ix-=1;if(keys['d'])ix+=1;
    const il=Math.hypot(ix,iz);if(il>1){ix/=il;iz/=il;}
    let aimDir=null;
    if(camMode==='taktik'){
      // fixed camera: stick up always means "toward the enemy base"
      const fx=Math.sin(TAC_YAW),fz=Math.cos(TAC_YAW),rx=-Math.cos(TAC_YAW),rz=Math.sin(TAC_YAW);
      moveUnit(player,fx*iz+rx*ix,fz*iz+rz*ix,dt,1);
      if(performance.now()-swipeT<1500)aimDir=swipeAim;
      else if(mouseAim&&performance.now()-mouseAim.t<4000)aimDir=Math.atan2(mouseAim.x-player.x,mouseAim.z-player.z);
      if(keys['arrowleft'])aimDir=(aimDir??player.h)+2.5*dt;if(keys['arrowright'])aimDir=(aimDir??player.h)-2.5*dt;
      if(aimDir!==null&&!isVeh(player))player.h=aimDir;else if(aimDir!==null)player.h+=clamp(angDiff(aimDir,player.h),-4*dt,4*dt);
      camYaw=TAC_YAW;
    }else{
      // shoulder view: right stick fine-tunes, otherwise the view swings into the walking direction
      let turn=aimStick.id!==null?aimStick.x:0;
      if(Math.abs(turn)<0.15)turn=0;
      if(keys['arrowleft'])turn-=1;if(keys['arrowright'])turn+=1;
      if(turn!==0){camYaw-=Math.sign(turn)*Math.pow(Math.abs(turn),1.5)*1.7*dt;camManualT=1.2;}
      const fx=Math.sin(camYaw),fz=Math.cos(camYaw),rx=-Math.cos(camYaw),rz=Math.sin(camYaw);
      const mx=fx*iz+rx*ix,mz=fz*iz+rz*ix,ml=Math.hypot(mx,mz);
      moveUnit(player,mx,mz,dt,1);
      camManualT-=dt;
      if(ml>0.25&&camManualT<=0&&iz>-0.5){const want=isVeh(player)?player.hull:player.h;camYaw+=angDiff(want,camYaw)*Math.min(1,dt*2.2*ml);}
      if(ml<0.1&&turn!==0&&!isVeh(player))player.h+=clamp(angDiff(camYaw,player.h),-8*dt,8*dt);
      aimDir=camYaw;
    }
    const dir=camMode==='taktik'?(aimDir??player.h):camYaw;
    const lock=(!player.carry&&!inPeace())?findLock(player,dir,WEAPONS[player.weapon].range+3,.55):(player.lock=null);
    const lockAng=lock?Math.atan2(lock.x-player.x,lock.z-player.z):dir;
    const wantFire=fireHeld||(camMode==='taktik'&&mouseFire);
    if(isVeh(player)&&(wantFire||lock)){
      // turret swings smoothly onto the locked target and only fires once it lines up
      player.h+=clamp(angDiff(wantFire||lock?lockAng:dir,player.h),-3.6*dt,3.6*dt);player.aimHold=gameT;
    }
    if(wantFire){
      if(player.carry){if(!player._warn){toast('Mit Kiste kein Feuer. Erst abstellen!',1.4);player._warn=1.5;}}
      else if(isVeh(player)){if(Math.abs(angDiff(lockAng,player.h))<0.12)fire(player,player.h,1,lock);}
      else fire(player,lockAng,1,lock);
    }
    updateLockMarker(lock);
    if(player._warn)player._warn=Math.max(0,player._warn-dt);
  }

  // units
  for(const u of units){
    if(u.cd>0)u.cd-=dt;
    if(u.sayCd>0)u.sayCd-=dt;
    if(u.sayT>0){u.sayT-=dt;if(u.sayT<=0)u.tag.say.hidden=true;}
    if(u.alive&&u.kind==='turm')turretUpdate(u,dt);
    else if(u.alive&&u!==player)aiUpdate(u,dt);
    if(u.alive&&u.hp<u.maxHp){const h=hqs[u.team];if(!h.dead&&Math.hypot(u.x-h.x,u.z-h.z)<9){const was=u.hp;u.hp=Math.min(u.maxHp,u.hp+(isVeh(u)?14:9)*dt);if(u===player&&was<u.maxHp&&u.hp>=u.maxHp)toast('Repariert!',1);}}
  }
  for(let i=0;i<units.length;i++){const a=units[i];if(!a.alive)continue;
    for(let j=i+1;j<units.length;j++){const b=units[j];if(!b.alive)continue;const dx=b.x-a.x,dz=b.z-a.z,d=Math.hypot(dx,dz),md=a.r+b.r;if(d<md&&d>1e-4){const p=(md-d)/2,fa=a.kind==='turm'?0:b.kind==='turm'?2:1,fb=b.kind==='turm'?0:a.kind==='turm'?2:1;a.x-=dx/d*p*fa;a.z-=dz/d*p*fa;b.x+=dx/d*p*fb;b.z+=dz/d*p*fb;}}}
  for(const u of units){
    if(u.alive&&u.kind!=='turm')resolve(u);
    const g=u.bot.g,gy=hgt(u.x,u.z);
    if(u.moving)u.walk+=dt*11;else u.walk*=0.85;
    const sw=Math.sin(u.walk)*0.6*(u.moving?1:0.2);
    if(isVeh(u)){
      g.position.set(u.x,gy+(u.moving?Math.sin(u.walk*2)*(u.kind==='buggy'?0.05:0.02):0),u.z);g.rotation.y=u.hull;u.bot.turret.rotation.y=u.h-u.hull;
      if(u.bot.wheels&&u.moving)for(const w of u.bot.wheels)w.rotation.x+=dt*14;
    }else{
      u.bot.legs[0].rotation.x=sw;u.bot.legs[1].rotation.x=-sw;
      if(u.carry){u.bot.arms[0].rotation.x=u.bot.arms[1].rotation.x=-Math.PI*0.95;}
      else{u.bot.arms[0].rotation.x=-sw*0.8;u.bot.arms[1].rotation.x=-0.9;}
      u.bot.gun.visible=!u.carry;
      g.position.set(u.x,gy+Math.abs(Math.sin(u.walk))*0.05,u.z);g.rotation.y=u.h;
    }
    u.bot.blob.position.set(u.x,gy+0.04,u.z);u.bot.blob.visible=u.alive;
    u.bot.bulb.scale.setScalar(1+Math.sin(gameT*6+u.id)*0.25);
    if(u.golden&&u.alive){u.sparkT=(u.sparkT||0)-dt;if(u.sparkT<=0){u.sparkT=.28;if(!player||Math.hypot(u.x-player.x,u.z-player.z)<28)puffs(u.x+rand(-.4,.4),gy+rand(.8,2),u.z+rand(-.4,.4),1,0xffd257,{size:.3,spread:.3,up:.6,life:.6,op:.9,grow:.2});}}
    if(u.moving&&u.alive){u.dustT=(u.dustT||0)-dt;if(u.dustT<=0){u.dustT=.22;if(!player||Math.hypot(u.x-player.x,u.z-player.z)<22)puffs(u.x,gy+0.1,u.z,1,0xcdb88f,{size:.45,spread:.5,up:.25,life:.7,op:.5,grow:1.2});}}
    updateDamageLook(u,dt,gy);
    if(u.flash>0){u.flash-=dt;if(u.flash>0){u.bot.paint.emissive.setScalar(0.7);u.bot.head.emissive.setScalar(0.7);}else makeGolden(u,!!u.golden);}
    if(!u.alive&&u.dying>0){u.dying-=dt;if(isVeh(u)){g.rotation.z=(0.9-u.dying)*0.35;u.bot.turret.position.y+=dt*1.6;}else g.rotation.x=Math.min(Math.PI/2,(0.9-u.dying)*3);g.position.y=gy-(0.9-u.dying)*0.4;if(u.dying<=0){scene.remove(g);scene.remove(u.bot.blob);u.tag.el.remove();}}
    if(u.carry){const c=u.carry;c.x=u.x;c.z=u.z;c.y=gy+2.45;c.m.position.set(c.x,c.y,c.z);c.m.rotation.set(0,u.h,0);}
    u.moving=false;
  }
  units=units.filter(u=>u.alive||u.dying>0);

  // crates
  for(const c of crates.slice()){
    if(c.state==='fall'){
      if(c.chute){c.y+=c.vy*dt;c.m.rotation.y+=dt*0.6;c.chute.position.set(c.x,c.y+1.3,c.z);c.ring.scale.setScalar(1+Math.max(0,(c.y-hgt(c.x,c.z))/12));}
      else{c.vy-=22*dt;c.x+=c.vx*dt;c.z+=c.vz*dt;c.y+=c.vy*dt;c.m.rotation.x+=dt*3;
        c.x=clamp(c.x,-LIM,LIM);c.z=clamp(c.z,-LIM,LIM);}
      const gy=hgt(c.x,c.z)+0.5;
      if(c.y<=gy){
        c.y=gy;c.vx=c.vz=0;
        if(c.chute){scene.remove(c.chute);c.chute=null;}if(c.ring){scene.remove(c.ring);c.ring=null;}
        c.m.rotation.x=0;c.m.rotation.z=0;
        if(Math.abs(c.z)<BANK+1&&!onBridge(c.x,c.z)&&!onPlatform(c.x,c.z)){puffs(c.x,-1.5,c.z,4,0xdff4ff,{size:.6});removeCrate(c);continue;}
        const pad=pads.find(p=>Math.hypot(p.x-c.x,p.z-c.z)<1.8&&p.stack.length<8);
        if(pad)addToPad(c,pad,null);else{c.state='ground';puffs(c.x,c.y-0.3,c.z,2,0xc9b48a);}
      }
      c.m.position.set(c.x,c.y,c.z);
    }
  }

  // shots
  for(let i=shots.length-1;i>=0;i--){
    const s=shots[i];
    if(s.arc){
      s.t+=dt;const k=Math.min(1,s.t/s.T);s.x=s.x0+(s.x1-s.x0)*k;s.z=s.z0+(s.z1-s.z0)*k;
      const gy=hgt(s.x,s.z),y=s.y0+(hgt(s.x1,s.z1)+0.3-s.y0)*k+4*s.peak*k*(1-k);s.m.position.set(s.x,y,s.z);
      s.trail-=dt;if(s.trail<=0){s.trail=.06;puffs(s.x,y,s.z,1,0xdedad0,{size:.4,life:.6});}
      if(k>=1||y<gy+0.2){explode(s.x,s.z,s.splash,s.dmg,s.team,s.owner&&s.owner.alive?s.owner:null);scene.remove(s.m);shots.splice(i,1);}
      continue;
    }
    s.x+=s.vx*dt;s.z+=s.vz*dt;s.life-=dt;
    const y=hgt(s.x,s.z)+1.1;s.m.position.set(s.x,y,s.z);
    if(s.rocket){s.trail-=dt;if(s.trail<=0){s.trail=.04;puffs(s.x,y,s.z,1,0xdedad0);}}
    let hit=s.life<=0||Math.abs(s.x)>LIM+2||Math.abs(s.z)>LIM+2;
    if(!hit)for(const o of obstacles){if(Math.hypot(o.x-s.x,o.z-s.z)<o.r*0.8){hit=true;break;}}
    if(!hit)for(const u of units){if(!u.alive||u.team===s.team)continue;if(Math.hypot(u.x-s.x,u.z-s.z)<u.r+0.17){hit=true;if(!s.rocket){damageUnit(u,s.dmg,s.owner);sparks(s.x,y,s.z,u.shield>0?3:5,u.shield>0?0x9fe6ff:null);s.sparked=true;}break;}}
    if(!hit){const h=hqs[1-s.team];if(!h.dead&&Math.hypot(h.x-s.x,h.z-s.z)<h.r){hit=true;if(!s.rocket){damageHQ(h,s.dmg);sparks(s.x,y+0.4,s.z,5);s.sparked=true;}}}
    if(hit){
      if(s.rocket)explode(s.x,s.z,s.splash,s.dmg,s.team,s.owner);
      else if(s.life>0&&!s.sparked)puffs(s.x,y,s.z,1,0xfff2b0);
      scene.remove(s.m);shots.splice(i,1);
    }
  }

  // particles
  for(let i=parts.length-1;i>=0;i--){
    const p=parts[i];p.life-=dt;
    if(p.boom){const k=1-p.life/p.max;p.m.scale.setScalar(0.3+Math.sqrt(k)*p.boom);p.m.position.y+=p.vy*dt;p.m.material.opacity=Math.max(0,1-k*k);}
    else if(p.debris){
      p.m.position.x+=p.vx*dt;p.m.position.y+=p.vy*dt;p.m.position.z+=p.vz*dt;p.vy-=p.grav*dt;p.m.rotation.x+=dt*9;p.m.rotation.z+=dt*7;
      const gy=hgt(p.m.position.x,p.m.position.z)+0.08;if(p.m.position.y<gy){p.m.position.y=gy;p.vx*=.5;p.vz*=.5;p.vy=Math.abs(p.vy)*.3;}
    }
    else if(p.spark){p.m.position.x+=p.vx*dt;p.m.position.y+=p.vy*dt;p.m.position.z+=p.vz*dt;p.vy-=16*dt;p.m.scale.setScalar(Math.max(0.05,p.life/p.max));}
    else if(p.decal){p.m.material.opacity=Math.min(p.op,p.life/3*p.op);}
    else{p.m.position.x+=p.vx*dt;p.m.position.y+=p.vy*dt;p.m.position.z+=p.vz*dt;p.vx*=1-dt*1.5;p.vz*=1-dt*1.5;p.vy-=(p.grav===undefined?2:p.grav)*dt;p.m.scale.multiplyScalar(1+dt*(p.grow===undefined?1:p.grow));p.m.material.opacity=Math.max(0,p.life/p.max)*(p.op||1);}
    if(p.life<=0){scene.remove(p.m);if(!p.solid)p.m.material.dispose();parts.splice(i,1);}
  }

  updateAir(dt);

  // world ambience
  timeU.value=gameT;
  for(const f of dropFx){f.beacon.visible=Math.sin(gameT*5+f.phase)>0;f.flag.rotation.y=Math.sin(gameT*1.6+f.phase)*0.3;}
  for(const c of crates)if(c.halo){c.halo.material.opacity=0.22+0.16*Math.sin(gameT*5);if(c.state==='ground')c.m.rotation.y+=dt*0.8;}
  for(const c of clouds){c.position.x+=dt*1.4;if(c.position.x>130)c.position.x=-130;}
  updateMood(dt);updateBirds(dt);updateFoam(dt);updateMotes(dt);
  for(const p of pads){p.glow.material.opacity=p.stack.length?0.22+0.18*Math.sin(gameT*4)+p.stack.length*0.03:0;}
  if(flashT>0){flashT-=dt;flashLight.intensity=Math.max(0,flashT/.25)*4;}else flashLight.intensity=0;

  updateWaves(dt);
  for(const T of teams){if(T.tempoT>0){T.tempoT-=dt;if(T.tempoT<=0&&T===teams[0]&&state==='play')toast('Tempo-Schub vorbei',1.2);}}
  updateGhost();
  // respawns at the HQ
  for(let i=respawns.length-1;i>=0;i--){
    const r=respawns[i];r.t-=dt;
    if(r.t>0)continue;
    respawns.splice(i,1);
    const h=hqs[r.team];if(h.dead||teamUnits(r.team).length>=8)continue;
    const b=BASES[r.team];const nu=spawnUnit(r.team,b.x+rand(-2.5,2.5),b.z+(r.team?3.5:-3.5),r.role);
    puffs(nu.x,hgt(nu.x,nu.z)+1,nu.z,8,0xffffff);say(nu,'recruit',true);
    if(r.team===0&&state==='play'){if(!player||!player.alive)setPlayer(nu);else toast(nu.name+' ist wieder da',1.6);}
  }
  // HQs
  for(const h of hqs){
    if(!h.dead&&!inPeace()){
      let best=null,bd=15;
      for(const e of units){if(!e.alive||e.team===h.team)continue;const d=Math.hypot(e.x-h.x,e.z-h.z);if(d<bd){bd=d;best=e;}}
      h.turCd-=dt;
      if(best){
        const a=Math.atan2(best.x-h.x,best.z-h.z);h.tur.rotation.y=a-h.g.rotation.y;
        if(h.turCd<=0){h.turCd=0.55;
          const sx=h.x+Math.sin(a)*2.8,sz=h.z+Math.cos(a)*2.8;
          const m=new THREE.Mesh(G.tracer,M.bullet[h.team]);m.rotation.y=a;m.position.set(sx,hgt(sx,sz)+1.1,sz);scene.add(m);
          shots.push({m,x:sx,z:sz,vx:Math.sin(a)*26,vz:Math.cos(a)*26,life:16/26,team:h.team,dmg:9,rocket:false,splash:0,owner:null,trail:0});
          sfx('shot',h.x,h.z);
        }
      }else h.tur.rotation.y+=dt*0.4;
    }
    if(!h.dead&&inPeace()&&h.hp<h.max){h.hp=Math.min(h.max,h.hp+h.max*0.0012*dt);h.healT=(h.healT||0)-dt;if(h.healT<=0){h.healT=1.4;puffs(h.x+rand(-1.6,1.6),hgt(h.x,h.z)+2.8,h.z+rand(-1,1),1,0x7ddc5a,{size:.4,spread:.3,up:.5,life:.8,op:.8,grow:.3});}}
    h.flag.rotation.y=Math.sin(gameT*3+h.team)*0.25;
    if(h.flashT>0){h.flashT-=dt;h.bodyMat.emissive.setScalar(h.flashT>0?0.35:0);}
    if(h.hp<h.max*0.5){h.smokeT-=dt;if(h.smokeT<=0){h.smokeT=h.dead?.12:.4;puffs(h.x+rand(-1.5,1.5),hgt(h.x,h.z)+2.6,h.z+rand(-1,1),1,0x4a4a48);}}
  }

  // end conditions
  if(playing){
    const a=teamUnits(0).length+respawns.filter(r=>r.team===0).length,b=teamUnits(1).length+respawns.filter(r=>r.team===1).length;
    if(hqs[1].dead)endGame(true,'Das Hauptquartier der Petrol-Bande liegt in Trümmern.');
    else if(hqs[0].dead)endGame(false,'Dein Hauptquartier ist eingestürzt.');
    else if(b===0)endGame(true,'Alle Petrol-Blechlinge sind verschrottet.');
    else if(a===0)endGame(false,'Deine ganze Bande liegt auf dem Schrottplatz.');
  }else if(state==='menu'){
    if(hqs[0].dead||hqs[1].dead||gameT>300)newGame(true);
  }

  // toast + hurt
  if(toastT>0){toastT-=dt;if(toastT<=0)toastEl.classList.remove('on');}
  if(hurtT>0){hurtT-=dt;if(hurtT<=0)$('#hurt').style.opacity=0;}
}

function updateCamera(dt){
  let tx,tz,ty,fx,fz;
  if(player&&state!=='menu'){
    tx=player.x;tz=player.z;ty=hgt(tx,tz);
    if(camMode==='taktik'){
      // fixed isometric angle from behind your own base, follows without rotating
      fx=Math.sin(TAC_YAW);fz=Math.cos(TAC_YAW);
      const ox=Math.cos(TAC_YAW)*7;
      v3.set(tx-fx*17+ox,ty+23,tz-fz*17);camPos.lerp(v3,1-Math.exp(-dt*6));
      v3.set(tx+fx*2,ty+0.8,tz+fz*2);camLook.lerp(v3,1-Math.exp(-dt*8));
    }else{
      // close over-the-shoulder view, robot stays just left of centre
      fx=Math.sin(camYaw);fz=Math.cos(camYaw);
      const rx=-Math.cos(camYaw),rz=Math.sin(camYaw),big=isVeh(player)?VEH[player.kind].cam:1,sh=0.75*big;
      v3.set(tx-fx*5.2*big+rx*sh,ty+(isVeh(player)?VEH[player.kind].camUp:2.9),tz-fz*5.2*big+rz*sh);
      v3.y=Math.max(v3.y,hgt(v3.x,v3.z)+0.8,-1.0);
      camPos.lerp(v3,1-Math.exp(-dt*9));
      v3.set(tx+fx*6+rx*sh*0.6,ty+1.6*big,tz+fz*6+rz*sh*0.6);camLook.lerp(v3,1-Math.exp(-dt*11));
    }
    marker.visible=player.alive;marker.position.set(player.x,ty+0.06,player.z);
  }else{
    const a=gameT*0.05;v3.set(Math.sin(a)*58,36,Math.cos(a)*58);camPos.lerp(v3,1-Math.exp(-dt*2));
    camLook.lerp(v3.set(0,0,0),1-Math.exp(-dt*2));marker.visible=false;
  }
  camera.position.copy(camPos);camera.lookAt(camLook);
  sky.position.copy(camPos);
  const sx=Math.round(player&&state!=='menu'?player.x:camLook.x),sz=Math.round(player&&state!=='menu'?player.z:camLook.z);
  sun.target.position.set(sx,0,sz);sun.position.set(sx+SUN_OFF.x,SUN_OFF.y,sz+SUN_OFF.z);
  pickRing.visible=false;
  if(player&&player.alive&&!player.carry&&state==='play'){
    let best=null,bd=2.0;
    for(const c of crates){if(c.state!=='ground')continue;const d=Math.hypot(c.x-player.x,c.z-player.z);if(d<bd){bd=d;best=c;}}
    if(best){pickRing.visible=true;pickRing.position.set(best.x,hgt(best.x,best.z)+0.06,best.z);pickRing.rotation.z=gameT*2;pickRing.scale.setScalar(1+Math.sin(gameT*8)*0.08);}
  }
}
const pickRing=new THREE.Mesh(new THREE.RingGeometry(0.78,0.95,4),M.pick);pickRing.rotation.x=-Math.PI/2;pickRing.visible=false;scene.add(pickRing);
function updateTags(){
  const w=innerWidth,h=innerHeight;
  for(const u of units){
    const t=u.tag;if(!u.alive){t.el.style.display='none';continue;}
    v3.set(u.x,hgt(u.x,u.z)+(isVeh(u)?VEH[u.kind].tag:2.45)+(u.carry?1:0),u.z).project(camera);
    if(v3.z>1||Math.abs(v3.x)>1.2||Math.abs(v3.y)>1.2||state==='menu'){t.el.style.display='none';continue;}
    t.el.style.display='';
    t.el.style.transform=`translate(${((v3.x*.5+.5)*w).toFixed(1)}px,${((-v3.y*.5+.5)*h).toFixed(1)}px)`;
    const show=u.hp<u.maxHp||u===player||isVeh(u),pct=u.hp/u.maxHp*100;
    t.hpb.hidden=!show;if(show){t.fill.style.width=pct+'%';t.fill.style.background=u.team?'#3ee0d1':(pct<35?'#ff5a4f':'#7ddc5a');}
  }
}

function resize(){const w=innerWidth,h=innerHeight;renderer.setSize(w,h,false);camera.aspect=w/h;camera.fov=w<h?68:55;camera.updateProjectionMatrix();}
window.addEventListener('resize',resize);resize();

let last=performance.now(),hudT=0;
// A single faulty frame used to stop the whole game (the next frame was never requested).
// Now the next frame is always scheduled first; only a burst of errors shows the error screen.
let frameErrors=0,frameErrorT=0;
function loop(now){
  requestAnimationFrame(loop);
  const dt=Math.min(0.05,(now-last)/1000);last=now;
  try{
    checkOrientation();
    if((state==='play'&&$('#rotate').hidden)||state==='menu')update(dt);
    updateCamera(dt);
    if(!glLost)renderer.render(scene,camera);
    updateTags();
    hudT-=dt;if(hudT<=0&&state==='play'){hudT=.1;updateHud();drawMap();}
  }catch(err){
    console.error(err);
    if(now-frameErrorT>5000){frameErrors=0;frameErrorT=now;}
    if(++frameErrors>20&&window.kkFail)window.kkFail('Im Spiel ist ein Fehler aufgetreten.',err);
  }
}
// Pause automatically when the app goes to the background (screen lock, app switch, call)
document.addEventListener('visibilitychange',()=>{if(document.hidden&&state==='play')pause(true);});
window.addEventListener('pagehide',()=>{if(state==='play')pause(true);});
newGame(true);
requestAnimationFrame(loop);
