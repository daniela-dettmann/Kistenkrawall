/* Kistenkrawall: Blechlinge, Kisten, Schilde, Geschütztürme */
'use strict';
/* ---------- Units ---------- */
function weaponMesh(type){
  const g=new THREE.Group();
  if(type==='knipser'){const m=new THREE.Mesh(new THREE.BoxGeometry(0.12,0.14,0.42),M.dark);m.position.z=0.12;g.add(m);}
  else if(type==='spritzer'){const t=new THREE.Mesh(new THREE.CylinderGeometry(0.1,0.1,0.32,8),new THREE.MeshLambertMaterial({color:0x59c9ff}));t.position.set(0,0.12,-0.02);g.add(t);const m=new THREE.Mesh(new THREE.BoxGeometry(0.12,0.12,0.5),M.dark);m.position.z=0.16;g.add(m);}
  else if(type==='streuer'){for(const s of [-1,1]){const m=new THREE.Mesh(new THREE.CylinderGeometry(0.06,0.06,0.62,8),M.dark);m.rotation.x=Math.PI/2;m.position.set(s*0.06,0,0.2);g.add(m);}const st=new THREE.Mesh(new THREE.BoxGeometry(0.14,0.16,0.26),trunkMat);st.position.z=-0.12;g.add(st);}
  else if(type==='krachrohr'){const m=new THREE.Mesh(new THREE.CylinderGeometry(0.14,0.14,1.05,10),new THREE.MeshLambertMaterial({color:0x6b7a3a}));m.rotation.x=Math.PI/2;m.position.set(0,0.45,0.05);g.add(m);const tip=new THREE.Mesh(new THREE.CylinderGeometry(0.17,0.14,0.14,10),M.dark);tip.rotation.x=Math.PI/2;tip.position.set(0,0.45,0.6);g.add(tip);}
  g.traverse(o=>{if(o.isMesh)o.castShadow=true;});
  return g;
}
function makeBot(team){
  const g=new THREE.Group();
  const paint=texMat(TEAMC[team],TX.paint,0.015,{specular:0x777777,shininess:60,emissive:0x000000});
  const head=texMat(0xc6cdd2,TX.panel,0.015,{specular:0xffffff,shininess:100,emissive:0x000000});
  const add=(geo,mat,x,y,z,parent)=>{const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);m.castShadow=true;(parent||g).add(m);return m;};
  add(G.body,paint,0,0.82,0);
  add(G.belt,M.dark,0,0.5,0);
  add(G.plate,M.metal,0,0.88,0.44);
  add(G.head,head,0,1.47,0);
  add(G.visor,M.visor[team],0,1.5,0.29);
  add(G.ear,M.dark,0.35,1.47,0);add(G.ear,M.dark,-0.35,1.47,0);
  const antP=new THREE.Group();antP.position.set(0.2,1.7,0);g.add(antP);
  add(G.ant,M.dark,0,0.18,0,antP);
  const bulb=add(G.bulb,M.visor[team],0,0.38,0,antP);
  for(const s of [-1,1]){const sp=add(G.shoulder,paint,s*0.5,1.12,0);sp.rotation.z=s*0.35;}
  const legs=[],arms=[];
  for(const s of [-1,1]){
    const lp=new THREE.Group();lp.position.set(s*0.18,0.45,0);g.add(lp);
    add(G.leg,M.dark,0,-0.22,0,lp);add(G.foot,M.metal,0,-0.4,0.05,lp);legs.push(lp);
    const ap=new THREE.Group();ap.position.set(s*0.52,1.08,0);g.add(ap);
    add(G.arm,M.metal,0,-0.22,0,ap);add(G.hand,paint,0,-0.48,0,ap);arms.push(ap);
  }
  const gun=new THREE.Group();gun.position.set(0.42,0.82,0.32);g.add(gun);
  scene.add(g);
  const blob=new THREE.Mesh(G.blob,M.blob);blob.renderOrder=1;scene.add(blob);
  return {g,legs,arms,gun,paint,head,bulb,blob,antP};
}
function makeTag(){
  const el=document.createElement('div');el.className='tag';
  el.innerHTML='<div class="say" hidden></div><div class="hpb" hidden><i></i></div>';
  tagsEl.appendChild(el);
  return {el,say:el.children[0],hpb:el.children[1],fill:el.children[1].firstChild};
}
function freshName(){
  const free=NAMES.filter(n=>!usedNames.has(n));const n=free.length?pick(free):pick(NAMES)+' II';usedNames.add(n);return n;
}
function makeTank(team){
  const g=new THREE.Group();
  const paint=texMat(TEAMC[team],TX.paint,0.02,{specular:0x555555,shininess:45,emissive:0x000000});
  const head=texMat(new THREE.Color(TEAMC[team]).multiplyScalar(.75),TX.panel,0.025,{specular:0x444444,shininess:40,emissive:0x000000});
  const trackMat=texMat(0x4a4a48,TX.tread,0.08,{shininess:20});
  const add=(geo,mat,x,y,z,parent)=>{const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;(parent||g).add(m);return m;};
  add(new THREE.BoxGeometry(2.0,0.6,2.7),paint,0,0.78,0);
  add(new THREE.BoxGeometry(1.7,0.22,2.1),head,0,1.18,-0.1);
  add(new THREE.BoxGeometry(1.9,0.35,0.5),head,0,0.72,1.45).rotation.x=0.5;
  const wheelG=new THREE.CylinderGeometry(0.3,0.3,0.42,12).rotateZ(Math.PI/2);
  for(const s of [-1,1]){
    add(new THREE.BoxGeometry(0.55,0.7,3.0),trackMat,s*1.2,0.42,0);
    for(let i=0;i<4;i++)add(wheelG,M.metal,s*1.27,0.36,-1.05+i*0.7);
    add(new THREE.BoxGeometry(0.6,0.08,3.1),head,s*1.2,0.82,0);
  }
  const turret=new THREE.Group();turret.position.y=1.32;g.add(turret);
  add(new THREE.CylinderGeometry(0.78,0.9,0.55,16),paint,0,0.22,-0.1,turret);
  add(new THREE.CylinderGeometry(0.28,0.28,0.14,12),M.metal,0.25,0.56,-0.35,turret);
  const barrel=add(new THREE.CylinderGeometry(0.11,0.14,1.9,10),M.dark,0,0.3,1.35,turret);barrel.rotation.x=Math.PI/2;
  const muzzle=add(new THREE.CylinderGeometry(0.17,0.17,0.24,10),M.metal,0,0.3,2.28,turret);muzzle.rotation.x=Math.PI/2;
  add(new THREE.BoxGeometry(0.6,0.1,0.06),M.visor[team],0,0.32,0.62,turret);
  add(G.ant,M.dark,-0.45,0.75,-0.5,turret).scale.y=2.2;
  const bulb=add(G.bulb,M.visor[team],-0.45,1.18,-0.5,turret);
  const gun=new THREE.Group();turret.add(gun);
  scene.add(g);
  const blob=new THREE.Mesh(G.blob,M.blob);blob.scale.set(2.3,1,2.8);blob.renderOrder=1;scene.add(blob);
  return {g,legs:[],arms:[],gun,paint,head,bulb,blob,turret};
}
const VEH={
  tank:{label:'Panzer',hp:420,r:1.35,speed:4.8,turn:3.2,weapon:'kanone',cam:1.6,camUp:4.2,tag:3.1,muzzle:2.4},
  buggy:{label:'Buggy',hp:170,r:1.0,speed:10.5,turn:5,weapon:'mg',cam:1.25,camUp:3.4,tag:2.4,muzzle:1.4},
  moerser:{label:'Mörser',hp:300,r:1.25,speed:3.6,turn:2.6,weapon:'moerser',cam:1.5,camUp:4.0,tag:3.0,muzzle:1.8},
  turm:{label:'Geschützturm',hp:260,r:1.0,speed:0,turn:4,weapon:'turm',cam:1.3,camUp:3.6,tag:2.9,muzzle:1.4}
};
function isVeh(u){return !!(u&&VEH[u.kind]);}

function vehMats(team){
  return {paint:texMat(TEAMC[team],TX.paint,0.02,{specular:0x555555,shininess:45,emissive:0x000000}),
    head:texMat(new THREE.Color(TEAMC[team]).multiplyScalar(.75),TX.panel,0.025,{specular:0x444444,shininess:40,emissive:0x000000})};
}
function finishVeh(g,turret,team,blobX,blobZ,extra){
  const gun=new THREE.Group();turret.add(gun);scene.add(g);
  const blob=new THREE.Mesh(G.blob,M.blob);blob.scale.set(blobX,1,blobZ);blob.renderOrder=1;scene.add(blob);
  return Object.assign({g,legs:[],arms:[],gun,blob,turret},extra);
}
function makeBuggy(team){
  const g=new THREE.Group(),{paint,head}=vehMats(team);
  const add=(geo,mat,x,y,z,parent)=>{const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;(parent||g).add(m);return m;};
  add(new THREE.BoxGeometry(1.3,0.32,2.1),paint,0,0.62,0);
  add(new THREE.BoxGeometry(1.1,0.22,0.7),head,0,0.84,0.75).rotation.x=-0.25;
  add(new THREE.BoxGeometry(0.7,0.3,0.6),M.dark,0,0.92,-0.35);
  for(const sx of [-0.55,0.55]){const bar=add(new THREE.CylinderGeometry(0.05,0.05,1.0,6),M.metal,sx,1.25,-0.1);bar.rotation.x=0.2;}
  add(new THREE.BoxGeometry(1.2,0.07,0.07),M.metal,0,1.72,-0.2);
  const wheels=[],wg=new THREE.CylinderGeometry(0.42,0.42,0.34,14).rotateZ(Math.PI/2),tread=texMat(0x2a2a2a,TX.tread,0.06,{shininess:10});
  for(const [sx,sz] of [[-0.82,0.72],[0.82,0.72],[-0.82,-0.72],[0.82,-0.72]])wheels.push(add(wg,tread,sx,0.42,sz));
  const turret=new THREE.Group();turret.position.y=1.75;turret.position.z=-0.2;g.add(turret);
  add(new THREE.CylinderGeometry(0.16,0.2,0.18,10),M.metal,0,0.05,0,turret);
  for(const sx of [-0.08,0.08]){const b=add(new THREE.CylinderGeometry(0.045,0.045,0.8,8),M.dark,sx,0.14,0.42,turret);b.rotation.x=Math.PI/2;}
  const bulb=add(G.bulb,M.visor[team],0.5,1.95,-0.55);
  add(new THREE.BoxGeometry(0.5,0.08,0.05),M.visor[team],0,0.75,1.06);
  return finishVeh(g,turret,team,1.7,2.2,{paint,head,bulb,wheels});
}
function makeMortar(team){
  const g=new THREE.Group(),{paint,head}=vehMats(team),trackMat=texMat(0x4a4a48,TX.tread,0.08,{shininess:20});
  const add=(geo,mat,x,y,z,parent)=>{const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;(parent||g).add(m);return m;};
  add(new THREE.BoxGeometry(1.8,0.55,2.2),paint,0,0.72,0);
  const wheelG=new THREE.CylinderGeometry(0.28,0.28,0.4,12).rotateZ(Math.PI/2);
  for(const sx of [-1,1]){add(new THREE.BoxGeometry(0.5,0.62,2.5),trackMat,sx*1.08,0.4,0);for(let i=0;i<3;i++)add(wheelG,M.metal,sx*1.14,0.34,-0.75+i*0.75);}
  const turret=new THREE.Group();turret.position.y=1.0;g.add(turret);
  add(new THREE.CylinderGeometry(0.7,0.8,0.35,14),head,0,0.18,0,turret);
  const tube=new THREE.Group();tube.position.set(0,0.4,0.05);tube.rotation.x=-0.85;turret.add(tube);
  add(new THREE.CylinderGeometry(0.26,0.3,1.3,12),M.dark,0,0.6,0,tube);
  add(new THREE.CylinderGeometry(0.32,0.32,0.18,12),M.metal,0,1.22,0,tube);
  for(const sx of [-0.35,0.35])add(new THREE.BoxGeometry(0.12,0.5,0.4),M.metal,sx,0.45,-0.05,turret);
  add(G.ant,M.dark,-0.6,0.6,-0.6,turret).scale.y=1.8;
  const bulb=add(G.bulb,M.visor[team],-0.6,0.95,-0.6,turret);
  return finishVeh(g,turret,team,2.0,2.4,{paint,head,bulb});
}
function makeTurm(team){
  const g=new THREE.Group(),{paint,head}=vehMats(team);
  const add=(geo,mat,x,y,z,parent)=>{const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;(parent||g).add(m);return m;};
  add(new THREE.CylinderGeometry(1.0,1.15,0.5,8),M.dark,0,0.25,0);
  for(let i=0;i<8;i++){const a=i/8*TAU;const sb=add(new THREE.BoxGeometry(0.7,0.36,0.4),bagMat,Math.sin(a)*1.25,0.2,Math.cos(a)*1.25);sb.rotation.y=a;}
  add(new THREE.CylinderGeometry(0.35,0.5,0.9,10),M.metal,0,0.95,0);
  const turret=new THREE.Group();turret.position.y=1.45;g.add(turret);
  add(new THREE.BoxGeometry(0.85,0.55,0.9),paint,0,0.15,0,turret);
  add(new THREE.BoxGeometry(0.6,0.12,0.06),M.visor[team],0,0.22,0.46,turret);
  for(const sx of [-0.17,0.17]){const b=add(new THREE.CylinderGeometry(0.07,0.07,1.1,8),M.dark,sx,0.12,0.95,turret);b.rotation.x=Math.PI/2;}
  const bulb=add(G.bulb,M.visor[team],0,0.55,-0.3,turret);
  return finishVeh(g,turret,team,1.8,1.8,{paint,head,bulb});
}
function spawnUnit(team,x,z,role,kind){
  const vk=VEH[kind]?kind:null,V=vk?VEH[vk]:null;
  const bot=vk==='tank'?makeTank(team):vk==='buggy'?makeBuggy(team):vk==='moerser'?makeMortar(team):vk==='turm'?makeTurm(team):makeBot(team);
  const nm=freshName();
  const u={id:nextId++,team,kind:vk||'bot',name:vk?(vk==='turm'?'Turm':V.label+' '+nm):nm,x,z,h:team?0:Math.PI,hull:team?0:Math.PI,
    hp:V?V.hp:100,maxHp:V?V.hp:100,r:V?V.r:0.45,alive:true,dying:0,lastFire:-9,
    weapon:'knipser',ammo:Infinity,cd:0,carry:null,role:vk?'fahrzeug':role,bot,tag:makeTag(),sayT:0,sayCd:rand(2,6),flash:0,
    walk:0,moving:false,plan:'patrol',thinkT:rand(0,.4),target:null,planCrate:null,goal:null,strafe:1,strafeT:0};
  setWeapon(u,V?V.weapon:'knipser');
  units.push(u);return u;
}
function setWeapon(u,type,boost){
  u.weapon=type;u.ammo=WEAPONS[type].ammo;
  if(boost){if(u.ammo!==Infinity)u.ammo=Math.round(u.ammo*1.6);u.weaponMul=1.6;}else u.weaponMul=1;
  if(!isVeh(u)&&!u.permGold)makeGolden(u,!!boost);
  if(isVeh(u))return;
  while(u.bot.gun.children.length)u.bot.gun.remove(u.bot.gun.children[0]);
  const m=weaponMesh(type);u.bot.gun.add(m);
  u.bot.gun.position.set(type==='krachrohr'?0.32:0.42,type==='krachrohr'?1.0:0.82,type==='krachrohr'?0.05:0.32);
}
function teamUnits(t){return units.filter(u=>u.alive&&u.team===t&&u.kind!=='turm');}
function makeGolden(u,on){
  u.golden=on;
  const e=on?0x5a3a00:0x000000;
  if(u.bot.paint)u.bot.paint.emissive.setHex(e);
  if(u.bot.head)u.bot.head.emissive.setHex(on?0x3a2a00:0);
  u.goldEmissive=on?0.18:0;
}
function say(u,key,force){
  if(!u.alive)return;
  if(!force&&(u.sayCd>0||Math.random()<0.35))return;
  if(player&&Math.hypot(u.x-player.x,u.z-player.z)>30&&u!==player)return;
  if(!force&&units.filter(o=>o.sayT>0).length>=3)return;
  u.tag.say.textContent=pick(LINES[key]);u.tag.say.hidden=false;u.sayT=5;u.sayCd=7;
}

/* ---------- Crates ---------- */
function spawnCrate(x,z,sky,gold,sort){
  if(!gold&&!sort)sort=Math.abs(x)>26?'gelb':'blau';
  const m=new THREE.Mesh(G.crate,gold?M.gold:M[sort]);m.castShadow=true;m.receiveShadow=true;m.rotation.y=Math.random()*TAU;scene.add(m);
  const gy=hgt(x,z);
  const c={m,x,z,gold:!!gold,sort:gold?null:sort,y:sky?gy+18+rand(0,5):gy+0.5,vx:0,vz:0,vy:sky?-3.4:0,state:sky?'fall':'ground',chute:null,ring:null,claim:0};
  if(gold){const h=new THREE.Mesh(G.boom,M.goldGlow);h.scale.setScalar(0.95);m.add(h);c.halo=h;}
  if(sky){
    c.chute=new THREE.Mesh(G.chute,M.chute);scene.add(c.chute);
    c.ring=new THREE.Mesh(G.ring,M.ring);c.ring.rotation.x=-Math.PI/2;c.ring.position.set(x,gy+0.05,z);scene.add(c.ring);
  }
  m.position.set(x,c.y,z);crates.push(c);return c;
}
function removeCrate(c){
  scene.remove(c.m);if(c.chute)scene.remove(c.chute);if(c.ring)scene.remove(c.ring);
  const i=crates.indexOf(c);if(i>=0)crates.splice(i,1);
}
function placeStacked(pad){
  pad.stack.forEach((c,i)=>{const s=SLOT[i%4],l=Math.floor(i/4);c.x=pad.x+s[0];c.z=pad.z+s[1];c.y=pad.top+0.5+l*1.02;c.m.position.set(c.x,c.y,c.z);c.m.rotation.set(0,0,0);});
}
function stackColor(pad){const f=pad.stack.find(c=>c.sort);return f?f.sort:null;}
function stackAccepts(pad,c){if(pad.stack.length>=8)return false;if(c.gold||!c.sort)return true;const sc=stackColor(pad);return !sc||sc===c.sort;}
/* crates that don't fit go on a small pile beside the platform, ready for the next stack */
function placeBeside(c,pad){
  const side=pad.x>0?1:-1,i=crates.filter(o=>o.state==='ground'&&Math.hypot(o.x-pad.x,o.z-pad.z)<6).length;
  c.state='ground';c.vx=c.vz=c.vy=0;c.claim=0;
  c.x=pad.x+side*(3.4+(i%2)*1.15);c.z=pad.z+(pad.team?-1:1)*(-1.1+Math.floor(i/2)%3*1.15);c.y=hgt(c.x,c.z)+0.5;
  c.m.position.set(c.x,c.y,c.z);c.m.rotation.set(0,rand(-.3,.3),0);
}
function addToPad(c,pad,u){
  if(!stackAccepts(pad,c)){
    placeBeside(c,pad);
    if(u===player||(!u&&pad.team===0&&state==='play'))toast(pad.stack.length>=8?'Stapel ist voll, Kiste liegt daneben':`Passt nicht auf den ${stackColor(pad)==='gelb'?'gelben':'blauen'} Stapel, liegt daneben`,1.6);
    return false;
  }
  if(c.sort&&!stackColor(pad)){teams[pad.team].collect=c.sort;if(pad.team===0)syncCollect();}
  c.state='stack';c.claim=0;pad.stack.push(c);placeStacked(pad);
  sfx('stack',pad.x,pad.z);
  if(c.gold){sfx('gold',pad.x,pad.z);puffs(pad.x,pad.top+1,pad.z,6,0xffd257,{size:.7});
    if(pad.team===0)toast('Sonderkiste! Die nächste Öffnung wird verstärkt',2.4);else if(player)toast('Petrol hat eine Sonderkiste gestapelt',2);}
  if(u){say(u,'stack');if(u===player)stats.stacked++;}
  return true;
}
function pickCrate(u,c){c.state='carry';c.claim=0;u.carry=c;if(c.chute){scene.remove(c.chute);c.chute=null;}if(c.ring){scene.remove(c.ring);c.ring=null;}sfx('pick',u.x,u.z);say(u,'pick');}
function dropCrate(u,toss){
  const c=u.carry;if(!c)return;u.carry=null;
  c.state='fall';c.chute=null;
  const sp=toss?5.2:1.5;
  c.vx=Math.sin(u.h)*sp;c.vz=Math.cos(u.h)*sp;c.vy=toss?4.2:0;
  c.x=u.x+Math.sin(u.h)*0.6;c.z=u.z+Math.cos(u.h)*0.6;c.y=hgt(u.x,u.z)+2.45;
}
function stealCrate(u,pad){const c=pad.stack.pop();if(!c)return;if(c.gold&&pad.team===0&&player)toast('Petrol hat deine Sonderkiste geklaut!',2);c.state='carry';u.carry=c;placeStacked(pad);sfx('pick',u.x,u.z);say(u,'steal',u.team===1);if(u===player)stats.stolen++;}
function openStack(u){
  const pad=pads[u.team],n=pad.stack.length,sort=stackSort(pad),rw=rewardFor(n,sort);if(!rw)return;
  const boost=pad.stack.some(c=>c.gold);
  const gl=boost?'Goldener ':'',me=u.team===0;
  for(const c of pad.stack.slice()){puffs(c.x,c.y,c.z,3,c.sort==='gelb'?0xffc928:c.gold?0xffd257:0x5aa0ff);removeCrate(c);}
  pad.stack=[];
  sfx('open',pad.x,pad.z);
  if(u===player)stats.opened++;
  const sx=pad.x+rand(-1,1),sz=pad.z+(u.team?-4:4);
  const nKind=k=>units.filter(o=>o.alive&&o.team===u.team&&o.kind===k).length;
  let made=rw;
  if((made==='panzer'&&nKind('tank')>=2)||(made==='buggy'&&nKind('buggy')>=2)||(made==='moerser'&&nKind('moerser')>=2))made=sort==='blau'?'doppel':'turm';
  // only one airstrike per side can wait for the next wave; another one becomes reinforcements
  if(made==='luftschlag'&&inPeace()&&queuedStrikes.some(q=>q.team===u.team))made='doppel';
  if((made==='rekrut'||made==='rekrut_spritzer'||made==='doppel')&&teamUnits(u.team).length>=8)made='krachrohr';
  const say2=(t,d)=>{if(me)toast(t,d||2);};
  switch(made){
    case 'luftschlag':
      if(inPeace()){queuedStrikes.push({team:u.team,owner:u,boost});say2('Luftschlag startet, sobald die nächste Welle beginnt',2.2);}
      else{callAirstrike(u.team,u,boost);if(me)toast(boost?'Goldener Luftschlag im Anflug!':'Luftschlag im Anflug!',2);else if(player)toast('Feindflieger! In Deckung!',2);}
      break;
    case 'panzer':case 'buggy':case 'moerser':{
      const kind=made==='panzer'?'tank':made;
      const t=spawnUnit(u.team,sx,sz,'fahrzeug',kind);t.h=t.hull=u.team?0:Math.PI;
      if(boost){t.maxHp=t.hp=Math.round(t.maxHp*1.55);t.dmgMul=1.4;t.permGold=true;makeGolden(t,true);t.name='Gold-'+t.name;}
      puffs(t.x,hgt(t.x,t.z)+1,t.z,14,0xffffff,{size:1.4});sfx('build',t.x,t.z);
      if(me)toast(`${boost?'Gold-':''}${VEH[kind].label} bereit! Mit „Wechseln“ steigst du ein.`,2.4);
      else if(player)toast(`Achtung: Petrol hat ${kind==='tank'?'einen Panzer':kind==='buggy'?'einen Buggy':'einen Mörser'}!`,2);
      break;}
    case 'rekrut':case 'rekrut_spritzer':case 'doppel':{
      const cnt=made==='doppel'?2:1;const names=[];
      for(let i=0;i<cnt;i++){
        const b=BASES[u.team],r=spawnUnit(u.team,b.x+rand(-2.5,2.5),b.z+(u.team?-3:3),roleFor(u.team));
        if(boost){r.maxHp=r.hp=180;r.dmgMul=1.5;r.permGold=true;makeGolden(r,true);}
        if(made==='rekrut_spritzer')setWeapon(r,'spritzer',boost);
        puffs(r.x,hgt(r.x,r.z)+1,r.z,8,boost?0xffd257:0xffffff);say(r,'recruit',true);names.push(r.name);
      }
      sfx('recruit',sx,sz);
      say2(`${boost?'Goldene Verstärkung: ':''}${names.join(' und ')} ${cnt>1?'sind':'ist'} dabei!`);
      break;}
    case 'munition':{
      let k=0;
      for(const o of teamUnits(u.team)){if(isVeh(o))continue;
        if(o.ammo!==Infinity){o.ammo=Math.round(WEAPONS[o.weapon].ammo*(boost?1.6:1));k++;}
        else if(k<(boost?3:2)){setWeapon(o,'spritzer',boost);k++;}
        puffs(o.x,hgt(o.x,o.z)+1.2,o.z,2,0xffc928,{size:.5});}
      sfx('ammo',sx,sz);say2(boost?'Goldene Munition für das ganze Team!':'Munition für das Team aufgefüllt!');
      break;}
    case 'reparatur':{
      for(const o of units){if(!o.alive||o.team!==u.team)continue;o.hp=o.maxHp;puffs(o.x,hgt(o.x,o.z)+1.2,o.z,3,0x7ddc5a,{size:.6});}
      const hq=hqs[u.team];if(boost&&!hq.dead)hq.hp=Math.min(hq.max,hq.hp+hq.max*0.25);
      sfx('repair',sx,sz);say2(boost?'Alles repariert, auch das Hauptquartier!':'Alle Blechlinge repariert!');
      break;}
    case 'tempo':{
      const T=teams[u.team];T.tempoT=boost?35:20;T.tempoMul=boost?1.5:1.4;
      sfx('tempo',sx,sz);say2(`Tempo-Schub für ${T.tempoT} Sekunden!`);
      break;}
    case 'schild':{
      const pool=units.filter(o=>o.alive&&o.team===u.team&&o.kind!=='turm');const r=me&&player&&player.alive&&Math.random()<0.5?player:pick(pool);
      if(r){giveShield(r,boost?220:130);sfx('shield',r.x,r.z);say2(r===player?'Du hast einen Schutzschild!':`${r.name} hat einen Schutzschild!`);}
      break;}
    case 'turm':case 'doppelturm':{
      const cnt=made==='doppelturm'?2:1;
      if(me){for(let i=0;i<cnt;i++)placeQueue.push({boost});sfx('build',sx,sz);
        toast(cnt>1?'2 Geschütztürme: Lauf zu einem Bauplatz in deiner Hälfte und tippe „Bauen“':'Geschützturm: Lauf zu einem Bauplatz in deiner Hälfte und tippe „Bauen“',3.2);}
      else{for(let i=0;i<cnt;i++)autoPlaceTurret(u.team,boost);if(player)toast('Petrol hat einen Geschützturm gebaut',2);}
      break;}
    default:{
      let r=u;
      if(me){const pool=teamUnits(0).filter(o=>!isVeh(o));if(pool.length)r=pick(pool);}
      if(!isVeh(r)){
        setWeapon(r,made,boost);say(r,'open',true);puffs(r.x,hgt(r.x,r.z)+1.2,r.z,boost?10:4,0xffe08a,{size:.6});
        if(me)toast(r===player?`Du bekommst: ${gl}${REWARD_LABEL[made]}!`:`${r.name} bekommt: ${gl}${REWARD_LABEL[made]}`,2);
      }
    }
  }
  teams[u.team].openTarget=pickTarget(u.team);
}
/* ---------- Shields, turrets, placement ---------- */
function giveShield(u,amt){
  u.shield=amt;
  if(!u.shieldMesh){
    const r=isVeh(u)?2.0:1.15;
    u.shieldMesh=new THREE.Mesh(new THREE.SphereGeometry(r,20,14),new THREE.MeshPhongMaterial({color:0x7fd8ff,emissive:0x1a6a8a,transparent:true,opacity:.28,shininess:90,specular:0xffffff,depthWrite:false}));
    u.shieldMesh.position.y=isVeh(u)?1.1:1.05;u.bot.g.add(u.shieldMesh);
  }
}
function dropShield(u){u.shield=0;if(u.shieldMesh){u.bot.g.remove(u.shieldMesh);u.shieldMesh=null;}puffs(u.x,hgt(u.x,u.z)+1.2,u.z,4,0x7fd8ff,{size:.5});}
function buildTurret(team,x,z,boost){
  const t=spawnUnit(team,x,z,'fahrzeug','turm');t.h=t.hull=team?0:Math.PI;
  if(boost){t.maxHp=t.hp=420;t.dmgMul=1.5;t.permGold=true;makeGolden(t,true);t.name='Goldturm';}
  puffs(x,hgt(x,z)+1,z,10,0xdedad0,{size:1});sfx('build',x,z);return t;
}
function spotValid(x,z,team){
  if(team===0?(z<11||z>LIM-2):(z>-11||z<-LIM+2))return false;
  if(Math.abs(x)>LIM-2)return false;
  if(obstacles.some(o=>Math.hypot(o.x-x,o.z-z)<o.r+1.3))return false;
  if(hqs.some(h=>Math.hypot(h.x-x,h.z-z)<h.r+1.8))return false;
  if(pads.some(pd=>Math.hypot(pd.x-x,pd.z-z)<2.8))return false;
  if(units.some(o=>o.alive&&o.kind==='turm'&&Math.hypot(o.x-x,o.z-z)<2.6))return false;
  return true;
}
function autoPlaceTurret(team,boost){
  const s=team?-1:1,cands=[[-24,14],[24,14],[-12,14],[12,14],[-6,19],[6,19],[0,24]].map(([x,z])=>({x:x+rand(-1.5,1.5),z:s*(z+rand(-1,1))}));
  for(const c of cands.sort(()=>Math.random()-.5))if(spotValid(c.x,c.z,team)){buildTurret(team,c.x,c.z,boost);return;}
}
function turretUpdate(u,dt){
  const W=WEAPONS.turm;
  let best=u.aimAt&&u.aimAt.alive&&dist(u,u.aimAt)<W.range*1.05?u.aimAt:null;
  if(!best){let bd=W.range;for(const e of units){if(!e.alive||e.team===u.team)continue;const d=dist(u,e);if(d<bd){bd=d;best=e;}}}
  if(!best){u.aimAt=null;u.h+=dt*0.35;return;}
  u.aimAt=best;const want=Math.atan2(best.x-u.x,best.z-u.z);
  u.h+=clamp(angDiff(want,u.h),-4*dt,4*dt);
  if(Math.abs(angDiff(want,u.h))<0.15)fire(u,u.h+rand(-.05,.05),u.team===1?Math.max(1,D.cdMul*0.8):1,best);
}
let placeQueue=[];
const ghost=(function(){
  const g=new THREE.Group(),mat=new THREE.MeshBasicMaterial({color:0x7ddc5a,transparent:true,opacity:.45,depthWrite:false});
  const base=new THREE.Mesh(new THREE.CylinderGeometry(1.1,1.2,0.5,8),mat);base.position.y=0.25;g.add(base);
  const col=new THREE.Mesh(new THREE.CylinderGeometry(0.35,0.5,1.0,10),mat);col.position.y=0.95;g.add(col);
  const top=new THREE.Mesh(new THREE.BoxGeometry(0.85,0.55,0.9),mat);top.position.y=1.6;g.add(top);
  const ring=new THREE.Mesh(new THREE.RingGeometry(1.3,1.5,32),mat);ring.rotation.x=-Math.PI/2;ring.position.y=0.06;g.add(ring);
  g.visible=false;scene.add(g);g.userData.mat=mat;return g;
})();
function placeSpot(){const u=player,a=isVeh(u)?u.hull:u.h,o=isVeh(u)?VEH[u.kind].r+1.6:2.6;return {x:u.x+Math.sin(a)*o,z:u.z+Math.cos(a)*o};}
function updateGhost(){
  if(!placeQueue.length||state!=='play'||!player||!player.alive){ghost.visible=false;return;}
  const p=placeSpot(),ok=spotValid(p.x,p.z,0);
  ghost.visible=true;ghost.position.set(p.x,hgt(p.x,p.z),p.z);ghost.userData.mat.color.setHex(ok?0x7ddc5a:0xff5a4f);ghost.rotation.y+=0.02;
}
function tryPlace(){
  const p=placeSpot();
  if(!spotValid(p.x,p.z,0)){toast(p.z<11?'Nur in deiner Hälfte bauen (vor dem Fluss)':'Hier ist kein Platz',1.4);return;}
  const q=placeQueue.shift();buildTurret(0,p.x,p.z,q.boost);
  toast(placeQueue.length?'Turm steht! Noch einer zu bauen.':'Geschützturm steht!',1.6);
}
function roleFor(t){const us=teamUnits(t).filter(u=>u.kind==='bot');const s=us.filter(u=>u.role==='sammler').length;const share=t===1?D.collect:0.5;return s<(us.length+1)*share?'sammler':'kaempfer';}
function pickTarget(t){const n=teamUnits(t).length;const opts=(t===1?D:ALLY).targets;return n<3?4:pick(opts);}
