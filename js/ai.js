/* Kistenkrawall: Gegner- und Mitstreiter-KI */
'use strict';
/* ---------- AI ---------- */
function nearestFoe(u,range){
  if(inPeace())return null;
  let best=null,bd=range;
  for(const e of units){if(!e.alive||e.team===u.team)continue;const d=dist(u,e);if(d<bd){bd=d;best=e;}}
  return best;
}
function pileCount(pad){return crates.filter(c=>c.state==='ground'&&Math.hypot(c.x-pad.x,c.z-pad.z)<6.5).length;}
function nearestFreeCrate(u){
  let best=null,bd=1e9,alt=null,ad=1e9;
  const pd=pads[u.team],want=(u.team===0||MP)?(teams[u.team].collect||'blau'):(stackColor(pd)||null);
  for(const c of crates){
    if(c.state!=='ground')continue;
    if(inPeace()&&(u.team?c.z>2:c.z<-2))continue;
    if(c.claim&&c.claim!==u.id){const o=units.find(x=>x.id===c.claim);if(o&&o.alive&&o.plan==='fetch'&&o.planCrate===c&&o!==player)continue;}
    const nearPad=Math.hypot(c.x-pd.x,c.z-pd.z)<7;
    if(nearPad&&!stackAccepts(pd,c))continue; // already on our pile, waiting for the next stack
    const d=Math.hypot(c.x-u.x,c.z-u.z)+(u.team?c.z+50:50-c.z)*0.15;
    if(c.gold||!want||c.sort===want){if(d<bd){bd=d;best=c;}}
    else if(d<ad){ad=d;alt=c;}
  }
  // nothing of the wanted colour around: bring something else for the pile instead of standing idle
  return best||(pileCount(pd)<6?alt:null);
}
function setFight(u,f){if(u.plan!=='fight'||u.target!==f){u.plan='fight';u.target=f;u.strafe=Math.random()<.5?1:-1;}}
function threatAt(team,range){
  if(inPeace())return null;const h=hqs[team];let best=null,bd=range;
  for(const e of units){if(!e.alive||e.team===team)continue;const d=Math.hypot(e.x-h.x,e.z-h.z);if(d<bd){bd=d;best=e;}}
  return best;
}
/* Target choice: easy bots mostly shoot whatever is closest, smarter ones weigh value (you, vehicles, turrets,
   wounded units, crate carriers), and on hard they concentrate fire on what their mates already shoot at.
   A current target is kept unless a clearly better one shows up, so they don't flick between targets. */
function foeScore(u,e,P){
  let s=dist(u,e);const k=P.smart||0;
  if(k){
    const heavy=isVeh(u)||u.weapon==='krachrohr';
    let v=(1-e.hp/e.maxHp)*5+(e.carry?3:0);
    if(e===player)v+=2.5;
    if(isVeh(e))v+=heavy?6:2;
    if(e.kind==='turm')v+=(u.wrole==='flanke'||heavy)?5:1;
    {const pl=pilotOf(u.team);if(pl&&pl.lock===e)v+=5;} // your mates help with the target you have locked
    s-=v*k;
  }
  if(P.focus){let n=0;for(const o of units)if(o!==u&&o.alive&&o.team===u.team&&o.plan==='fight'&&o.target===e)n++;s-=Math.min(n,3)*2.2;}
  return s;
}
function pickFoe(u,range,P){
  if(inPeace())return null;
  let best=null,bs=1e9;
  for(const e of units){if(!e.alive||e.team===u.team||dist(u,e)>range)continue;const s=foeScore(u,e,P);if(s<bs){bs=s;best=e;}}
  const cur=u.target;
  if(cur&&cur.alive&&cur!==best&&u.plan==='fight'&&dist(u,cur)<range*1.15&&foeScore(u,cur,P)<bs+3)return cur;
  return best;
}
/* Defensive strength of a team around one of its own bridgeheads, used to find the weaker flank */
function sideStrength(team,bx){
  const s=team?-1:1;let v=0;
  for(const u of units){if(!u.alive||u.team!==team)continue;if(Math.hypot(u.x-bx,u.z-s*(17+ZS))>15)continue;
    v+=(u.kind==='tank'?3:u.kind==='turm'?2.5:u.kind==='moerser'?2:u.kind==='buggy'?1.5:u.weapon!=='knipser'?1.4:1)*(0.5+0.5*u.hp/u.maxHp);}
  return v;
}
/* Where defenders are needed: wave groups heading for a bridge, plus intruders already in the own half.
   Defenders split across both bridgeheads in proportion to the pressure on each. */
function defendSpot(u){
  const t=u.team,s=t?-1:1;let wL=0,wR=0;
  for(const e of units){
    if(!e.alive||e.team===t||e.kind==='turm')continue;
    const inMine=t?e.z<2:e.z>-2,coming=e.attacker&&e.waveBx!==undefined;
    if(!inMine&&!coming)continue;
    const bx=coming&&!inMine?e.waveBx:(e.x<0?-BX:BX),w=isVeh(e)?2:1;
    if(bx<0)wL+=w;else wR+=w;
  }
  if(wL+wR===0)return null;
  const side=((u.id*0.618)%1)<wL/(wL+wR)?-BX:BX;
  return {x:side+((u.id%3)-1)*2.6,z:s*(13.5+ZS+(u.id%3)*1.4)};
}
function homeGoal(t){return {x:rand(-24,24),z:BASES[t].z+(t?1:-1)*rand(7,24)};}
/* Fixed patrol routes (for team 0; mirrored for Petrol): west bridgehead, east bridgehead, ring around the base */
const ROUTES=[[[-BX,12+ZS],[-BX-7,20+ZS],[-BX+5,25+ZS]],[[BX,12+ZS],[BX+7,20+ZS],[BX-5,25+ZS]],[[-9,31+ZS*0.4],[9,31+ZS*0.4],[12,40],[-12,40]]];
function setPatrol(u){
  if(u.routeId===undefined)u.routeId=u.id%3;
  const rid=inPeace()&&u.role!=='sammler'?2:u.routeId,r=ROUTES[rid];
  u.routeIdx=(u.routeIdx||0)%r.length;
  const pt=r[u.routeIdx],s=u.team?-1:1;
  u.plan='patrol';u.waitT=0;u.goal={x:pt[0]+rand(-1.5,1.5),z:s*pt[1]+rand(-1.5,1.5)};
}
/* Prey for the hunter on hard: the vehicle you drive, any other vehicle, otherwise you */
function huntTarget(u){
  if(player&&player.alive&&player.team!==u.team&&isVeh(player))return player;
  let best=null,bd=1e9;
  for(const e of units)if(e.alive&&e.team!==u.team&&isVeh(e)&&e.kind!=='turm'){const d=dist(u,e);if(d<bd){bd=d;best=e;}}
  if(best)return best;
  return player&&player.alive&&player.team!==u.team?player:null;
}
function decide(u,P){
  const pad=pads[u.team],ep=pads[1-u.team],myHq=hqs[u.team],ehq=hqs[1-u.team],wave=teams[1].wave;
  if(u.carry){u.plan='deliver';return;}
  // badly damaged: fall back to the own HQ and repair there (in the rest phase already from 60 %)
  if(!myHq.dead&&(u.retreating||u.hp<u.maxHp*(inPeace()?0.6:(P.retreatAt||.3)))){
    if(u.hp>=u.maxHp*0.85)u.retreating=false;else{u.retreating=true;u.plan='retreat';return;}
  }
  const tank=isVeh(u),weak=u.weapon==='knipser',raid=u.team===1&&u.attacker&&u.go;
  let range=u.kind==='moerser'?WEAPONS.moerser.range:tank?P.aggro*1.4:(u.role==='kaempfer'||u.attacker?P.aggro:P.aggro*0.7);
  // flankers slip past distant fights and only answer what gets close; the hunter goes for its prey
  if(raid&&u.wrole==='flanke')range=Math.min(range,9);
  if(raid&&u.wrole==='jaeger'){const h=huntTarget(u);if(h&&dist(u,h)<P.aggro*1.6){setFight(u,h);return;}range=Math.min(range,8);}
  const foe=pickFoe(u,range,P);
  const n=pad.stack.length;
  const starved=n>=2&&!crates.some(c=>c.state==='ground'&&(c.gold||c.sort===stackColor(pad))&&Math.hypot(c.x-pad.x,c.z-pad.z)>6.5);
  if(!tank&&!raid&&u.team===1&&!MP&&n>0&&(n>=teams[1].openTarget||starved)&&(weak||n>=4)&&dist(u,pad)<20&&!(foe&&dist(u,foe)<6)){u.plan='open';return;}
  if(foe){setFight(u,foe);return;}
  if(u.team===1&&u.attacker){
    if(!u.go){u.plan='rally';return;}
    if(u.go&&!ehq.dead){u.plan='assault';return;}
  }
  const threat=threatAt(u.team,26);
  if(threat&&(tank||u.role!=='sammler'||!weak)){setFight(u,threat);return;}
  // in the rest phase everybody on foot helps building; during a wave only the collectors keep at it
  if(!tank&&(inPeace()||u.role==='sammler'||(weak&&Math.random()<.5))&&!((u.team===0||MP)&&n>=8)){
    const c=nearestFreeCrate(u);
    if(c){u.plan='fetch';u.planCrate=c;c.claim=u.id;return;}
    if(!inPeace()&&P.steal&&ep.stack.length>0&&Math.random()<.5){u.plan='steal';return;}
  }
  // escort the player when they push across the river
  {const pl=pilotOf(u.team),s=u.team?-1:1;if((u.team===0||MP)&&!inPeace()&&pl&&pl.alive&&pl!==u&&s*pl.z<-2&&(tank||!weak||u.role==='kaempfer')){u.plan='escort';return;}}
  // during a wave the fighters take position at the bridgehead that is under pressure
  if(!inPeace()&&(tank||u.role!=='sammler'||!weak)){const g=defendSpot(u);if(g){u.plan='defend';u.goal=g;return;}}
  if(u.plan!=='patrol'||!u.goal)setPatrol(u);
}
/* Petrol attack waves. plan: pick attackers, find the weaker flank, hand out roles. gather: walk to the rally points.
   attack: easy trickles in over one bridge; normal sends a small pinning group first and the flankers a few seconds later
   over the other bridge; hard strikes over both bridges at the same moment and adds a hunter. */
function planWave(W){
  const mine=teamUnits(1);
  const val=u=>(isVeh(u)?3:0)+(u.weapon!=='knipser'?2:0)+(u.role==='kaempfer'?1:0)+u.hp/u.maxHp;
  const sorted=mine.slice().sort((p,q)=>val(q)-val(p));
  const keepHome=mine.length>=5?2:1;
  const cap=Math.min(D.waveCap,D.waveMax+Math.floor((Math.max(1,waveNo)-1)*D.waveGrow));
  const n=Math.min(cap,mine.length-keepHome);
  if(n<1){W.t=8;return;}
  const sel=sorted.slice(0,n);
  const sL=sideStrength(0,BRIDGES[0]),sR=sideStrength(0,BRIDGES[1]);
  const weak=D.flankWeak?(sL<=sR?BRIDGES[0]:BRIDGES[1]):pick(BRIDGES),strong=weak===BRIDGES[0]?BRIDGES[1]:BRIDGES[0];
  let groups;
  if(D.pincer&&n>=2){const pinN=n>=6?2:1;groups=[{bx:strong,role:'binden',units:sel.slice(0,pinN)},{bx:weak,role:'flanke',units:sel.slice(pinN)}];}
  else groups=[{bx:weak,role:'angriff',units:sel}];
  if(D.hunter&&n>=3){const fl=groups[groups.length-1].units;const hu=fl.find(u=>u.kind==='buggy')||(fl.length>=3?fl[fl.length-1]:null);if(hu)hu._hunt=true;}
  W.groups=[];
  groups.forEach((g,gi)=>{
    const len=g.units.length;
    g.units.forEach((u,i)=>{
      u.attacker=true;u.go=false;u.wrole=u._hunt?'jaeger':g.role;u._hunt=false;u.waveBx=g.bx;u.slot=i-(len-1)/2;u.grp=gi;u.pauseT=0;u.holdUntil=0;u.holdQuiet=0;
      u.rally={x:g.bx+u.slot*D.spread*0.8,z:-15-ZS-Math.abs(u.slot)*1.2};u.thinkT=0;
    });
    W.groups.push({bx:g.bx,role:g.role,ids:g.units.map(u=>u.id),go:false});
  });
  W.phase='gather';W.t=D.gatherT;W.goT=-99;
  if(state==='play'&&D.warn){
    const side=b=>b<0?'linken':'rechten';
    toast(W.groups.length>1?'Petrol sammelt sich an beiden Brücken':`Petrol sammelt sich vor der ${side(W.groups[0].bx)} Brücke`,2.2);
  }
}
function announceWave(W){
  if(W.announced)return;W.announced=true;W.phase='attack';
  if(state==='play'){toast(W.groups.length>1&&D.sync?'Achtung: Petrol greift über beide Brücken an!':'Achtung: Petrol greift an!',2.2);sfx('drum');}
}
function launchGroup(W,g){
  g.go=true;
  for(const u of units)if(u.alive&&u.attacker&&g.ids.includes(u.id)){u.go=true;u.thinkT=0;u.holdUntil=gameT+(g.role==='binden'?D.hold:0);u.holdQuiet=0;}
  announceWave(W);
}
function updateWaves(dt){
  const W=teams[1].wave;
  if(MP)return;   // no automatic Petrol waves in multiplayer: both humans lead their own attacks
  if(inPeace()){if(W.phase!=='idle'){W.phase='idle';W.groups=[];for(const u of units){u.attacker=false;u.go=false;}}return;}
  if(W.phase==='idle'){W.phase='plan';W.t=state==='menu'?rand(8,14):rand(3,5);W.announced=false;return;}
  W.t-=dt;
  const att=units.filter(u=>u.alive&&u.team===1&&u.attacker);
  if(W.phase==='plan'){if(W.t<=0){W.announced=false;planWave(W);}return;}
  if(W.phase==='done')return;
  const at=u=>u.rally&&Math.hypot(u.x-u.rally.x,u.z-u.rally.z)<4.5;
  const pending=W.groups.filter(g=>!g.go),timeUp=W.t<=0;
  if(pending.length){
    if(!D.roles){ // easy: each bot runs off as soon as it reaches its spot, so they arrive one by one
      for(const u of att)if(!u.go&&(at(u)||timeUp)){u.go=true;u.thinkT=0;u.holdUntil=0;announceWave(W);}
      if(att.length&&att.every(u=>u.go))for(const g of pending)g.go=true;
    }else{
      const ready=g=>{const m=att.filter(u=>g.ids.includes(u.id));return m.length>0&&m.filter(at).length>=Math.ceil(m.length*0.75);};
      if(D.sync){if(timeUp||pending.every(ready))for(const g of pending)launchGroup(W,g);}
      else{
        const pin=pending.find(g=>g.role==='binden');
        if(pin&&(timeUp||ready(pin))){launchGroup(W,pin);W.goT=gameT;}
        if(!pending.some(g=>g.role==='binden'&&!g.go))for(const g of pending)if(!g.go&&g.role!=='binden'&&(timeUp||(ready(g)&&gameT-W.goT>5)))launchGroup(W,g);
      }
    }
  }
  if(att.length===0){
    if(W.phase==='gather'){W.phase='plan';W.t=6;}
    else if(W.phase==='attack'){if(D.repush&&(state!=='play'||waveT>D.repush)){W.phase='plan';W.t=8;}else W.phase='done';}
  }
}
/* AI aiming: swing toward the target at a limited turn speed and only shoot after a short reaction time */
function aiAim(u,t,P,dt){
  if(u.aimAt!==t){u.aimAt=t;u.reactT=P.react*rand(0.8,1.3);}
  const want=Math.atan2(t.x-u.x,t.z-u.z);
  u.h+=clamp(angDiff(want,u.h),-P.turn*dt,P.turn*dt);
  if(u.reactT>0){u.reactT-=dt;return false;}
  return Math.abs(angDiff(want,u.h))<0.3;
}
function aiUpdate(u,dt){
  const P=aiParams(u.team);
  u.thinkT-=dt;
  // easy bots dither now and then on their way to the front
  if(u.pauseT>0){u.pauseT-=dt;u.h+=Math.sin(gameT*1.7+u.id)*dt*1.2;if(u.plan!=='fight')return;}
  else if(P.hesitate&&u.attacker&&(u.plan==='assault'||u.plan==='rally')&&Math.random()<P.hesitate*dt*0.4)u.pauseT=rand(1.2,2.8);
  if(u.thinkT<=0){u.thinkT=rand(.25,.45);decide(u,P);}
  const pad=pads[u.team],ep=pads[1-u.team];
  switch(u.plan){
    case 'fetch':{const c=u.planCrate;if(!c||c.state!=='ground'){u.thinkT=0;break;}if(moveToward(u,c.x,c.z,dt,P,1.0))pickCrate(u,c);break;}
    case 'deliver':{if(!u.carry){u.thinkT=0;break;}if(moveToward(u,pad.x,pad.z,dt,P,1.9)){const c=u.carry;u.carry=null;addToPad(c,pad,u);u.thinkT=0;}break;}
    case 'rally':{const r=u.rally;if(!r){u.thinkT=0;break;}if(moveToward(u,r.x,r.z,dt,P,1.5))u.h+=clamp(angDiff(u.team?0:Math.PI,u.h),-3*dt,3*dt);break;}
    case 'assault':{
      const h=hqs[1-u.team];if(h.dead){u.thinkT=0;break;}
      const s=u.team?1:-1,bx=u.waveBx===undefined?BRIDGES[0]:u.waveBx,sl=u.slot||0;
      // 1) cross at the group's own bridge, side by side rather than in single file
      if(s*u.z<BANK+1.5){moveToward(u,bx+clamp(sl,-1,1)*0.9,s*(BANK+3),dt,P,1.2);break;}
      // 2) the pinning group holds the far bridgehead and draws fire while the flankers go round
      if(u.wrole==='binden'&&gameT<u.holdUntil){
        if(moveToward(u,bx+sl*P.spread,s*(14+ZS+Math.abs(sl)*1.5),dt,P,1.8)){
          u.h+=clamp(angDiff(Math.atan2(h.x-u.x,h.z-u.z),u.h),-3*dt,3*dt);
          u.holdQuiet+=dt;if(u.holdQuiet>10)u.holdUntil=0; // nobody to bind: push on
        }
        break;}
      // 3) the hunter chases its prey
      if(u.wrole==='jaeger'){const t=huntTarget(u);if(t){moveToward(u,t.x,t.z,dt,P,5);break;}}
      // 4) everybody else storms the HQ and fans out around it
      const W=WEAPONS[u.weapon],d=dist(u,h)-h.r,a=sl*0.5+(bx<0?-0.4:0.4);
      const R=Math.min(W.range*0.6,11)+h.r,gx=h.x+Math.sin(a)*R,gz=h.z-s*Math.cos(a)*R;
      if(d>W.range*0.75)moveToward(u,gx,gz,dt,P,1.5);
      else if(aiAim(u,h,P,dt))fire(u,u.h+(Math.random()*2-1)*P.jitter*0.5,P.cdMul,h);
      break;}
    case 'defend':{const g=u.goal;if(!g){u.thinkT=0;break;}if(moveToward(u,g.x,g.z,dt,P,1.8))u.h+=clamp(angDiff(u.team?0:Math.PI,u.h),-3*dt,3*dt);break;}
    case 'retreat':{
      const h=hqs[u.team];if(h.dead){u.retreating=false;u.thinkT=0;break;}
      moveToward(u,h.x+(u.id%3-1)*1.8,h.z+(u.team?4.3:-4.3),dt,P,1.5);
      const f=nearestFoe(u,WEAPONS[u.weapon].range*0.8);
      if(f&&!u.carry){const aim=Math.atan2(f.x-u.x,f.z-u.z);fire(u,aim+(Math.random()*2-1)*P.jitter,P.cdMul*1.3);}
      break;}
    case 'open':{if(u.team!==1){u.thinkT=0;break;}if(moveToward(u,pad.x,pad.z,dt,P,2.1)){openStack(u);u.thinkT=0;}break;}
    case 'steal':{if(ep.stack.length===0){u.thinkT=0;break;}if(moveToward(u,ep.x,ep.z,dt,P,1.9)){stealCrate(u,ep);u.thinkT=0;}break;}
    case 'fight':{
      const e=u.target;if(!e||!e.alive){u.thinkT=0;break;}
      const W=WEAPONS[u.weapon],dx=e.x-u.x,dz=e.z-u.z,d=Math.hypot(dx,dz)||0.01,want=W.range*0.6,sf=P.strafe===undefined?0.7:P.strafe;
      u.strafeT-=dt;if(u.strafeT<=0){u.strafeT=rand(.8,2);u.strafe*=-1;}
      let mx=0,mz=0;
      const wp=d>want?wallWaypoint(u,e.x,e.z):null;
      if(wp){const wx=wp.x-u.x,wz=wp.z-u.z,wl=Math.hypot(wx,wz)||1;mx=wx/wl*1.5;mz=wz/wl*1.5;}
      else if(d>want){mx=dx/d;mz=dz/d;}else if(d<want*0.45){mx=-dx/d;mz=-dz/d;}
      mx+=-dz/d*u.strafe*sf;mz+=dx/d*u.strafe*sf;
      const len=Math.hypot(mx,mz)||1;aiMove(u,mx/len,mz/len,dt,P.speed*0.85);
      if(aiAim(u,e,P,dt)&&d<W.range*0.95)fire(u,u.h+(Math.random()*2-1)*P.jitter,P.cdMul,e);
      if(d>P.aggro*1.6)u.thinkT=0;
      break;}
    case 'siege':{
      const h=hqs[1-u.team];if(h.dead){u.thinkT=0;break;}
      const W=WEAPONS[u.weapon],d=dist(u,h)-h.r;
      if(d>W.range*0.7)moveToward(u,h.x,h.z,dt,P,0);
      else if(aiAim(u,h,P,dt))fire(u,u.h+(Math.random()*2-1)*P.jitter*0.5,P.cdMul,h);
      break;}
    case 'escort':{
      const p=player;if(!p||!p.alive||p.z>=-2){u.thinkT=0;break;}
      const a=u.id*2.1;moveToward(u,p.x+Math.sin(a)*4,p.z+Math.cos(a)*4,dt,P,2.5);break;}
    default:{
      const g=u.goal;if(!g){u.thinkT=0;break;}
      if(moveToward(u,g.x,g.z,dt,P,1.6)){
        if(!u.waitT){u.waitT=rand(1.5,3.5);if(Math.random()<.25)say(u,'idle');}
        u.waitT-=dt;u.h+=Math.sin(gameT*0.8+u.id)*dt*0.9;
        if(u.waitT<=0){u.waitT=0;u.routeIdx=(u.routeIdx||0)+1;u.goal=null;u.thinkT=0;}
      }
    }
  }
}
