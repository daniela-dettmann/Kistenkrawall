/* Kistenkrawall: Effekte, Luftschlag, Kampf und Bewegung */
'use strict';
/* ---------- Effects ---------- */
function puffs(x,y,z,n,color,opts){
  opts=opts||{};
  for(let i=0;i<n;i++){
    if(parts.length>280)return;
    const m=new THREE.Mesh(G.puff,new THREE.MeshLambertMaterial({color,transparent:true,opacity:opts.op||.9,depthWrite:false}));
    m.position.set(x,y,z);const s=rand(.4,.9)*(opts.size||1);m.scale.setScalar(s);m.rotation.set(rand(0,3),rand(0,3),0);scene.add(m);
    const sp=opts.spread||2;
    parts.push({m,vx:rand(-sp,sp),vy:rand(1,3.5)*(opts.up||1),vz:rand(-sp,sp),life:rand(.5,.9)*(opts.life||1),max:.9*(opts.life||1),grav:2,grow:opts.grow||1,op:opts.op||.9});
  }
}
const scorchTex=(function(){const c=document.createElement('canvas');c.width=c.height=64;const g=c.getContext('2d');const r=g.createRadialGradient(32,32,2,32,32,32);r.addColorStop(0,'rgba(20,16,12,.9)');r.addColorStop(.6,'rgba(30,24,16,.55)');r.addColorStop(1,'rgba(30,24,16,0)');g.fillStyle=r;g.fillRect(0,0,64,64);return new THREE.CanvasTexture(c);})();
let flashT=0;
function boom(x,z,size){
  const gy=hgt(x,z),y=gy+0.8;
  const m=new THREE.Mesh(G.boom,new THREE.MeshBasicMaterial({color:0xffd27a,transparent:true,opacity:1,blending:THREE.AdditiveBlending,depthWrite:false}));
  m.position.set(x,y,z);m.scale.setScalar(.3);scene.add(m);
  parts.push({m,vx:0,vy:0,vz:0,life:.5,max:.5,boom:size});
  const core=new THREE.Mesh(G.boom,new THREE.MeshBasicMaterial({color:0xff6a2a,transparent:true,opacity:.9,depthWrite:false}));
  core.position.set(x,y,z);core.scale.setScalar(.2);scene.add(core);
  parts.push({m:core,vx:0,vy:1.5,vz:0,life:.4,max:.4,boom:size*0.6});
  puffs(x,y,z,Math.round(5+size*2),0x5e5c58,{size:1.2,grow:1.4,life:1.6,spread:1.6,up:.8,op:.75});
  for(let i=0;i<Math.round(4+size*2)&&parts.length<280;i++){
    const d=new THREE.Mesh(G.debris,M.dark);d.position.set(x,y,z);scene.add(d);
    parts.push({m:d,vx:rand(-5,5),vy:rand(4,9),vz:rand(-5,5),life:rand(.7,1.1),max:1.1,grav:22,grow:0,debris:true,solid:true});
  }
  const sc=new THREE.Mesh(G.scorch,new THREE.MeshBasicMaterial({map:scorchTex,transparent:true,opacity:.8,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2}));
  sc.position.set(x,gy+0.05,z);sc.scale.setScalar(size*0.7);sc.rotation.y=rand(0,TAU);scene.add(sc);
  parts.push({m:sc,vx:0,vy:0,vz:0,life:9,max:9,grav:0,grow:0,op:.8,decal:true});
  flashLight.position.set(x,y+1,z);flashLight.intensity=3+size;flashT=.25;
  sfx('boom',x,z);
}

/* ---------- Airstrike ---------- */
let planes=[],bombs=[];
function makePlane(team){
  const g=new THREE.Group();
  const paint=texMat(TEAMC[team],TX.paint,0.015,{specular:0x666666,shininess:60});
  const add=(geo,mat,x,y,z)=>{const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);m.castShadow=true;g.add(m);return m;};
  add(new THREE.CylinderGeometry(0.36,0.22,3.4,12).rotateX(Math.PI/2),paint,0,0,0);
  add(new THREE.CylinderGeometry(0.36,0.36,0.3,12).rotateX(Math.PI/2),M.metal,0,0,1.8);
  add(new THREE.BoxGeometry(5.6,0.12,0.95),paint,0,0.05,0.35);
  add(new THREE.BoxGeometry(5.6,0.12,0.95),paint,0,0.95,0.35);
  for(const s of [-1,1])for(const z of [0.05,0.65])add(new THREE.CylinderGeometry(0.03,0.03,0.9,5),M.dark,s*1.8,0.5,z);
  add(new THREE.BoxGeometry(1.9,0.1,0.55),paint,0,0.1,-1.45);
  add(new THREE.BoxGeometry(0.1,0.75,0.65),paint,0,0.45,-1.45);
  add(new THREE.SphereGeometry(0.26,10,6,0,TAU,0,Math.PI/2),M.visor[team],0,0.3,0.2);
  const prop=add(new THREE.BoxGeometry(1.6,0.14,0.05),M.dark,0,0,1.98);
  g.scale.setScalar(1.25);scene.add(g);
  return {g,prop};
}
function strikeTarget(team){
  const foes=teamUnits(1-team),h=hqs[1-team];let best=null,bs=-1;
  for(const e of foes){let s=0;for(const o of foes)if(dist(e,o)<5)s+=o.kind==='tank'?2:1;if(s>bs){bs=s;best={x:e.x,z:e.z};}}
  if(!h.dead&&bs<2.5)best={x:h.x,z:h.z};
  return best||{x:h.x,z:h.z};
}
function callAirstrike(team,owner,boost){
  const t=strikeTarget(team),s=team?-1:1;
  const p=makePlane(team);
  const pl={...p,team,owner,boost:!!boost,x:t.x,z:t.z+95*s,y:16,vz:-30*s,tz:t.z,dropT:0,dropped:0};
  if(boost)p.g.traverse(o=>{if(o.isMesh&&o.material.emissive)o.material=o.material.clone(),o.material.emissive.setHex(0x5a3a00);});
  p.g.rotation.y=s>0?Math.PI:0;
  p.g.position.set(pl.x,pl.y,pl.z);
  planes.push(pl);sfx('plane');
}
function updateAir(dt){
  for(let i=planes.length-1;i>=0;i--){
    const p=planes[i];p.z+=p.vz*dt;p.g.position.set(p.x,p.y+Math.sin(gameT*2)*0.2,p.z);p.prop.rotation.z+=dt*40;
    p.g.rotation.z=Math.sin(gameT*1.5)*0.06;
    if(!inPeace()&&p.dropped<(p.boost?10:6)&&Math.abs(p.z-p.tz)<(p.boost?11:7.5)){
      p.dropT-=dt;
      if(p.dropT<=0){p.dropT=.13;p.dropped++;if(p.dropped===1)sfx('whistle',p.x,p.z);
        const m=new THREE.Mesh(G.bomb,M.dark);m.castShadow=true;m.position.set(p.x,p.y-0.6,p.z);scene.add(m);
        bombs.push({m,x:p.x+rand(-1.2,1.2)*(p.boost?2:1),y:p.y-0.6,z:p.z,vz:p.vz*0.55,vy:0,team:p.team,owner:p.owner,big:p.boost});}
    }
    if(Math.abs(p.z)>115){scene.remove(p.g);planes.splice(i,1);}
  }
  for(let i=bombs.length-1;i>=0;i--){
    const b=bombs[i];b.vy-=22*dt;b.y+=b.vy*dt;b.z+=b.vz*dt;b.vz*=1-dt*0.8;
    b.m.position.set(b.x,b.y,b.z);b.m.rotation.x=clamp(b.vz*0.04,-0.6,0.6);
    if(b.y<=hgt(b.x,b.z)+0.2){explode(b.x,b.z,b.big?4.4:3.6,b.big?100:75,b.team,b.owner&&b.owner.alive?b.owner:null);scene.remove(b.m);bombs.splice(i,1);}
  }
}

/* ---------- Combat ---------- */
function fire(u,ang,cdMul,tgt){
  if(!u.alive||u.carry||u.cd>0)return false;
  if(inPeace()){if(u===player&&peaceWarnT<=0){toast('Bauruhe: kein Feuer bis zur nächsten Welle',1.3);peaceWarnT=1.6;}return false;}
  const W=WEAPONS[u.weapon];
  const off=isVeh(u)?VEH[u.kind].muzzle:0.75;
  if(W.arc){
    // mortar: lob a shell in a high arc to the target point (flies over walls and trees)
    let tx,tz;if(tgt&&!(tgt.dead||tgt.alive===false)){tx=tgt.x+rand(-1,1);tz=tgt.z+rand(-1,1);}else{tx=u.x+Math.sin(ang)*W.range*0.7;tz=u.z+Math.cos(ang)*W.range*0.7;}
    const d=Math.hypot(tx-u.x,tz-u.z);
    if(d<W.minRange){if(u===player&&peaceWarnT<=0){toast('Zu nah für den Mörser',1.2);peaceWarnT=1.2;}return false;}
    if(d>W.range){const k=W.range/d;tx=u.x+(tx-u.x)*k;tz=u.z+(tz-u.z)*k;}
    u.cd=W.cd*(cdMul||1);u.h=ang;u.lastFire=gameT;
    const sx=u.x+Math.sin(ang)*off,sz=u.z+Math.cos(ang)*off,m=new THREE.Mesh(G.bomb,M.dark);m.castShadow=true;scene.add(m);
    const D2=Math.hypot(tx-sx,tz-sz),T=Math.max(0.9,D2/W.speed);
    shots.push({m,arc:true,x0:sx,z0:sz,y0:hgt(sx,sz)+2,x1:tx,z1:tz,T,t:0,peak:5+D2*0.22,x:sx,z:sz,team:u.team,dmg:W.dmg*(u.weaponMul||1)*(u.dmgMul||1),splash:W.splash,owner:u,trail:0});
    sfx('moerser',u.x,u.z);puffs(sx,hgt(sx,sz)+2,sz,3,0xdedad0,{size:.6});
    return true;
  }
  u.cd=W.cd*(cdMul||1);u.h=ang;u.lastFire=gameT;
  const sx=u.x+Math.sin(ang)*off,sz=u.z+Math.cos(ang)*off;
  for(let i=0;i<W.pellets;i++){
    const a=ang+(Math.random()*2-1)*W.spread;
    let m;
    if(W.rocket){m=new THREE.Group();const r=new THREE.Mesh(new THREE.CylinderGeometry(0.1,0.1,0.55,8),M.dark);r.rotation.x=Math.PI/2;m.add(r);const tip=new THREE.Mesh(new THREE.ConeGeometry(0.1,0.2,8),new THREE.MeshLambertMaterial({color:0xff5a4f}));tip.rotation.x=Math.PI/2;tip.position.z=0.37;m.add(tip);m.rotation.y=a;}
    else{m=new THREE.Mesh(G.tracer,M.bullet[u.team]);m.rotation.y=a;}
    m.position.set(sx,hgt(sx,sz)+1.1,sz);scene.add(m);
    shots.push({m,x:sx,z:sz,vx:Math.sin(a)*W.speed,vz:Math.cos(a)*W.speed,life:W.range/W.speed,team:u.team,dmg:W.dmg*(u.weaponMul||1)*(u.dmgMul||1),rocket:!!W.rocket,splash:(W.splash||0)*((u.weaponMul||1)>1?1.25:1),owner:u,trail:0});
  }
  sfx(u.weapon==='kanone'?'kanone':u.weapon==='spritzer'?'spritz':u.weapon==='mg'?'mg':W.rocket?'rocket':W.pellets>1?'pellet':'shot',u.x,u.z);
  if(parts.length<260){
    const fm=new THREE.Mesh(G.flash,new THREE.MeshBasicMaterial({color:0xfff0b0,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false}));
    fm.position.set(sx,hgt(sx,sz)+1.05,sz);fm.scale.setScalar(W.rocket?2.2:W.pellets>1?1.6:1);scene.add(fm);
    parts.push({m:fm,vx:0,vy:0,vz:0,life:.06,max:.06,grav:0,grow:0});
  }
  if(u.ammo!==Infinity){u.ammo--;if(u.ammo<=0){setWeapon(u,'knipser');say(u,'empty',u===player);}}
  return true;
}
function damageUnit(u,dmg,by){
  if(!u.alive)return;
  if(u.shield>0){const a=Math.min(u.shield,dmg);u.shield-=a;dmg-=a;sfx('hit',u.x,u.z);if(u.shield<=0)dropShield(u);if(dmg<=0)return;}
  u.hp-=dmg;u.flash=.15;sfx('hit',u.x,u.z);
  if(u===player){hurtFlash();}
  if(u.hp<=0){
    u.alive=false;u.dying=.9;u.hp=0;
    if(u.carry)dropCrate(u,false);
    if(!isVeh(u)&&!hqs[u.team].dead){respawns.push({team:u.team,t:20,role:u.role==='panzer'?'kaempfer':u.role});}
    boom(u.x,u.z,isVeh(u)?3.2:1.4);
    u.tag.say.hidden=true;u.tag.hpb.hidden=true;
    if(by&&by.alive)say(by,'kill',by.team===0);
    if(by===player)stats.kills++;
    if(u===player)onPlayerDown();
  }else if(Math.random()<.3)say(u,'hit');
}
function damageHQ(hq,dmg){
  if(hq.dead)return;
  hq.hp-=dmg;hq.flashT=.12;
  if(hq.hp<=0){hq.hp=0;hq.dead=true;for(let i=0;i<4;i++)setTimeout(()=>boom(hq.x+rand(-2,2),hq.z+rand(-2,2),3),i*180);hq.g.scale.y=.45;hq.bodyMat.color.multiplyScalar(.35);}
}
function explode(x,z,radius,dmg,team,by){
  boom(x,z,radius);
  for(const u of units){if(!u.alive||u.team===team)continue;const d=Math.hypot(u.x-x,u.z-z);if(d<radius)damageUnit(u,dmg*(1-d/radius*0.6),by);}
  for(const h of hqs){if(h.team===team)continue;const d=Math.hypot(h.x-x,h.z-z)-h.r;if(d<radius)damageHQ(h,dmg*(1-Math.max(0,d)/radius*0.6));}
}
function scoreTarget(u,e,heading,range,cone){
  const isHq=e.max!==undefined&&e.r>2;
  const dx=e.x-u.x,dz=e.z-u.z,d=Math.hypot(dx,dz)-(isHq?e.r:0);
  if(d>range)return null;
  const a=Math.abs(angDiff(Math.atan2(dx,dz),heading));if(a>cone)return null;
  return d+a*9+(isHq?4:0);
}
/* Target with "stickiness": keep the current lock until it dies, leaves range or turns out of view,
   or a challenger scores at least ~28% better. Stops the barrel flicking between two similar targets. */
function findLock(u,heading,range,cone){
  let best=null,bs=1e9;
  const cands=units.filter(e=>e.alive&&e.team!==u.team);const hq=hqs[1-u.team];if(!hq.dead)cands.push(hq);
  for(const e of cands){const sc=scoreTarget(u,e,heading,range,cone);if(sc!==null&&sc<bs){bs=sc;best=e;}}
  const cur=u.lock;
  if(cur&&!(cur.dead||cur.alive===false)){
    const keep=scoreTarget(u,cur,heading,range*1.15,cone*1.6);
    if(keep!==null&&!(best&&best!==cur&&bs<keep*0.72)){u.lock=cur;return cur;}
  }
  u.lock=best;return best;
}
function aimFor(u,range,cone){
  let best=null,bs=1e9;
  for(const e of units){
    if(!e.alive||e.team===u.team)continue;
    const dx=e.x-u.x,dz=e.z-u.z,d=Math.hypot(dx,dz);if(d>range)continue;
    const a=Math.abs(angDiff(Math.atan2(dx,dz),u.h));if(a>cone)continue;
    const s=d+a*9;if(s<bs){bs=s;best=e;}
  }
  const hq=hqs[1-u.team];
  if(!hq.dead){const dx=hq.x-u.x,dz=hq.z-u.z,d=Math.hypot(dx,dz)-hq.r;const a=Math.abs(angDiff(Math.atan2(dx,dz),u.h));if(d<range&&a<cone){const s=d+a*9+4;if(s<bs){bs=s;best=hq;}}}
  return best?Math.atan2(best.x-u.x,best.z-u.z):u.h;
}

/* ---------- Movement ---------- */
function moveUnit(u,mx,mz,dt,spd){
  const len=Math.hypot(mx,mz);if(len<0.05)return;
  const want=Math.atan2(mx,mz);
  const tempo=teams[u.team].tempoT>0?(teams[u.team].tempoMul||1.4):1;
  if(isVeh(u)){
    const V=VEH[u.kind];if(!V.speed)return;
    u.x+=mx*V.speed*spd*tempo*dt;u.z+=mz*V.speed*spd*tempo*dt;u.moving=true;
    u.hull+=clamp(angDiff(want,u.hull),-V.turn*dt,V.turn*dt);
    if(gameT-Math.max(u.lastFire,u.aimHold||-9)>1.2)u.h+=clamp(angDiff(u.hull,u.h),-4*dt,4*dt);
    return;
  }
  const sp=(u.carry?4.8:7.0)*spd*tempo;
  u.x+=mx*sp*dt;u.z+=mz*sp*dt;u.moving=true;
  u.h+=clamp(angDiff(want,u.h),-12*dt,12*dt);
}
function resolve(u){
  const ur=u.r||0.45;
  for(const o of obstacles){const dx=u.x-o.x,dz=u.z-o.z,d=Math.hypot(dx,dz),m=o.r+ur;if(d<m&&d>1e-4){u.x=o.x+dx/d*m;u.z=o.z+dz/d*m;}}
  for(const h of hqs){const dx=u.x-h.x,dz=u.z-h.z,d=Math.hypot(dx,dz),m=h.r+ur;if(d<m&&d>1e-4){u.x=h.x+dx/d*m;u.z=h.z+dz/d*m;}}
  if(Math.abs(u.z)<BANK&&islandE(u.x,u.z)>=0.9){ // on an island you can walk freely
    const bx=BRIDGES.find(b=>Math.abs(u.x-b)<crossW(b)+0.05);
    if(bx!==undefined){const lim=Math.max(0.15,crossW(bx)-0.25-ur);u.x=clamp(u.x,bx-lim,bx+lim);}
    else if(islandE(u.x,u.z)<1.25){const bx=BRIDGES.reduce((a,b)=>Math.abs(u.x-b)<Math.abs(u.x-a)?b:a);const dx=(u.x-bx)/ISL_RX,dz=u.z/ISL_RZ,e=Math.hypot(dx,dz),lim=0.9-ur/ISL_RZ;if(e>lim){u.x=bx+dx/e*lim*ISL_RX;u.z=dz/e*lim*ISL_RZ;}}
    else u.z=(u.z>=0?1:-1)*BANK;
  }
  u.x=clamp(u.x,-LIM,LIM);u.z=clamp(u.z,-LIM,LIM);
}
/* Route around sandbag walls: if the straight line to the goal crosses a wall, head for its nearer end first */
function wallWaypoint(u,gx,gz){
  const m=0.5+(u.r||0.45)+0.3;let first=null,ft=2;
  for(const w of walls){
    const du=u.z-w.z,dg=gz-w.z;
    if(du*dg>0||(Math.abs(du)<0.01&&Math.abs(dg)<0.01))continue;
    const t=du/(du-dg),xc=u.x+(gx-u.x)*t;
    if(xc<w.a-m||xc>w.b+m)continue;
    if(t<ft){ft=t;first=w;}
  }
  if(!first)return null;
  let best=null,bd=1e9;
  for(const ex of [first.noA?null:first.a-m-0.9,first.noB?null:first.b+m+0.9]){
    if(ex===null)continue;
    const c=Math.hypot(u.x-ex,u.z-first.z)+Math.hypot(gx-ex,gz-first.z);
    if(c<bd){bd=c;best={x:ex,z:first.z};}
  }
  return best;
}
/* Steer around trees, rocks and buildings that lie ahead */
function avoid(u,mx,mz){
  const ur=u.r||0.45,look=2.4+ur,rr=ur+0.35;let ax=0,az=0;
  const check=(ox,oz,r)=>{
    const dx=ox-u.x,dz=oz-u.z,proj=dx*mx+dz*mz;if(proj<=0||proj>look+r)return;
    const lat=-dx*mz+dz*mx,need=r+rr;if(Math.abs(lat)>=need)return;
    const w=(1-proj/(look+r))*(1-Math.abs(lat)/need)*2.4,s=lat>0?-1:1;
    ax+=-mz*s*w;az+=mx*s*w;
  };
  for(const o of obstacles)if(!o.low)check(o.x,o.z,o.r);
  for(const h of hqs)check(h.x,h.z,h.r);
  for(const o of units)if(o!==u&&o.alive&&(o.kind==='turm'||(isVeh(o)&&!o.moving)))check(o.x,o.z,o.r);
  const nx=mx+ax,nz=mz+az,l=Math.hypot(nx,nz)||1;return [nx/l,nz/l];
}
/* AI movement with avoidance and a stuck detector that sidesteps when no progress is made */
function aiMove(u,mx,mz,dt,spd){
  if(gameT-(u.lastMoveT||-9)>0.25){u.stuckClock=0;u.sx=u.x;u.sz=u.z;}
  u.lastMoveT=gameT;
  if(u.unstickT>0){u.unstickT-=dt;moveUnit(u,u.ux,u.uz,dt,spd);return;}
  const a=avoid(u,mx,mz);moveUnit(u,a[0],a[1],dt,spd);
  u.stuckClock+=dt;
  if(u.stuckClock>=0.9){
    if(Math.hypot(u.x-u.sx,u.z-u.sz)<0.8*spd){
      const s=Math.random()<.5?1:-1;let ux=-mz*s-mx*0.5,uz=mx*s-mz*0.5;const l=Math.hypot(ux,uz)||1;
      u.ux=ux/l;u.uz=uz/l;u.unstickT=rand(.6,1.1);if(u.plan==='patrol')u.goal=null;
    }
    u.stuckClock=0;u.sx=u.x;u.sz=u.z;
  }
}
function bandWaypoint(u,gx,gz){
  const inU=Math.abs(u.z)<BANK,inG=Math.abs(gz)<BANK;if(!inU&&!inG)return null;
  const bx=BRIDGES.reduce((a,b)=>Math.abs((inG?gx:u.x)-b)<Math.abs((inG?gx:u.x)-a)?b:a),onCor=Math.abs(u.x-bx)<1.3,su=u.z>=0?1:-1;
  if(inU&&!inG){if(!onCor&&Math.abs(u.z)<2.8)return {x:bx,z:clamp(u.z,-1.6,1.6)};if(!onCor)return {x:bx,z:su*1.4};
    // on a bridge with the goal off to the side: walk off the bridge first instead of pushing against the railing
    return Math.abs(gx-bx)>2.5?{x:bx,z:(gz>=0?1:-1)*(BANK+1.2)}:null;}
  if(!inU&&inG){return onCor?{x:bx,z:su*1.4}:{x:bx,z:su*(BANK+1.2)};}
  if(Math.abs(u.z)>2.8&&!onCor)return {x:bx,z:su*1.4};
  if(Math.abs(u.z)>2.8&&Math.abs(gx-bx)>1.3)return {x:bx,z:su*1.4};
  return null;
}
function moveToward(u,gx,gz,dt,P,arrive){
  const dx=gx-u.x,dz=gz-u.z,d=Math.hypot(dx,dz);
  if(d<arrive)return true;
  const wp=bandWaypoint(u,gx,gz)||wallWaypoint(u,gx,gz);
  const tx=wp?wp.x:gx,tz=wp?wp.z:gz,ex=tx-u.x,ez=tz-u.z,el=Math.hypot(ex,ez)||1;
  aiMove(u,ex/el,ez/el,dt,P.speed);return false;
}
