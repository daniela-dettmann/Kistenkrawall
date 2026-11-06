/* Kistenkrawall: HUD, Sprechblasen, Atmosphäre */
'use strict';
/* ---------- HUD ---------- */
const toastEl=$('#toast');let toastT=0;
function toast(t,dur){toastEl.textContent=t;toastEl.classList.add('on');toastT=dur||1.8;}
let hurtT=0;function hurtFlash(){hurtT=.35;$('#hurt').style.opacity=.55;}
const hud={pips:[$('#pips0'),$('#pips1')],hq:[$('#hq0'),$('#hq1')],sub:[$('#sub0'),$('#sub1')],wpn:$('#wpn'),carry:$('#carryPill'),act:$('#bAction'),actIco:$('#actIco'),actLbl:$('#actLbl'),swap:$('#bSwap'),swapBadge:$('#swapBadge')};
$('#swapIco').innerHTML=IC.swap;
function updateHud(){
  for(let t=0;t<2;t++){
    const n=teamUnits(t).length;
    hud.pips[t].textContent='●'.repeat(Math.min(n,7))||'–';
    hud.hq[t].style.width=(hqs[t].hp/hqs[t].max*100)+'%';
    hud.sub[t].textContent=`Stapel ${pads[t].stack.length}/8${pads[t].stack.length?(stackSort(pads[t])==='gelb'?' Gelb':' Blau'):''}${pads[t].stack.some(c=>c.gold)?' ★':''} · ${n} Blechling${n===1?'':'e'}`;
  }
  const pp=$('#peacePill'),mmss=t=>{const q=Math.ceil(t);return `${Math.floor(q/60)}:${String(q%60).padStart(2,'0')}`;};
  if(peaceT>0){pp.hidden=false;pp.className='pill peace'+(peaceT<=15?' soon':'');pp.textContent=`Bauruhe · Welle ${waveNo+1} in ${mmss(peaceT)}`;}
  else if(waveT>0){pp.hidden=false;pp.className='pill wave';pp.textContent=`Welle ${waveNo} · noch ${mmss(waveT)}`;}
  else pp.hidden=true;
  if(!player)return;
  const W=WEAPONS[player.weapon];
  hud.wpn.textContent=`${player.name} · ${W.name} · ${player.ammo===Infinity?'∞':player.ammo}`;
  hud.carry.hidden=!player.carry;
  const pad=pads[0],near=dist(player,pad)<3.2,n=pad.stack.length,rw=rewardFor(n,stackSort(pad));
  const ctx=contextFor(player);
  if(ctx.m!==actMode){actMode=ctx.m;hud.actIco.innerHTML=IC[ctx.m];hud.actLbl.textContent=ACT_LABEL[ctx.m];hud.act.setAttribute('aria-label',ACT_LABEL[ctx.m]);}
  hud.act.classList.toggle('go',ctx.m!=='none');
  hud.act.classList.toggle('gold',!!ctx.gold);
  hud.act.disabled=isVeh(player)&&ctx.m!=='place';
  if(ctx.m==='open')hud.actLbl.textContent=(ctx.gold?'★ ':'')+REWARD_LABEL[rewardFor(pads[0].stack.length,stackSort(pads[0]))];
  if(ctx.m==='place'&&placeQueue.length>1)hud.actLbl.textContent='Bauen ×'+placeQueue.length;
  const nMine=teamUnits(0).length;
  hud.swap.disabled=nMine<2;hud.swapBadge.textContent=nMine;hud.swapBadge.hidden=nMine<2;
}
const mm=$('#mm'),mctx=mm.getContext('2d');
function drawMap(){
  const S=mm.width,sc=S/(LIM*2+6),X=x=>(x+LIM+3)*sc,Z=z=>(z+LIM+3)*sc;
  mctx.clearRect(0,0,S,S);
  mctx.fillStyle=MOUNTAIN?'rgba(225,232,242,.35)':'rgba(120,170,90,.35)';mctx.fillRect(X(-LIM),Z(-LIM),LIM*2*sc,LIM*2*sc);
  mctx.fillStyle=MOUNTAIN?'rgba(40,52,70,.9)':'rgba(70,160,210,.85)';mctx.fillRect(X(-LIM),Z(-8.4),LIM*2*sc,16.8*sc);
  if(MOUNTAIN){mctx.fillStyle='rgba(150,155,165,.9)';mctx.fillRect(X(BRIDGES[1]-10),Z(-6),20*sc,12*sc);}
  for(const D of DROPS){mctx.fillStyle=MOUNTAIN?'#e8eef5':'#e2cf95';mctx.beginPath();mctx.ellipse(X(D.x),Z(0),ISL_RX*sc,ISL_RZ*sc,0,0,TAU);mctx.fill();mctx.strokeStyle=D.sort==='blau'?'#5aa0ff':'#ffc928';mctx.lineWidth=2.5;mctx.stroke();mctx.fillStyle='#b98a52';mctx.fillRect(X(D.x)-4,Z(-9),8,18*sc);}
  mctx.fillStyle=MOUNTAIN?'#d8dde4':'#b98a52';for(const bx of BRIDGES)mctx.fillRect(X(bx)-crossW(bx)*sc,Z(-8.4),crossW(bx)*2*sc,16.8*sc);
  for(const h of hqs){mctx.fillStyle=h.dead?'#555':(h.team?'#1fb5a8':'#ff8a1f');mctx.fillRect(X(h.x)-7,Z(h.z)-6,14,12);}
  for(const p of pads){mctx.strokeStyle=p.team?'#1fb5a8':'#ff8a1f';mctx.lineWidth=2;mctx.strokeRect(X(p.x)-6,Z(p.z)-6,12,12);}
  mctx.fillStyle='#e9b46a';
  for(const c of crates){if(c.state==='ground'||c.state==='fall'){mctx.fillStyle=c.gold?'#fff3a0':c.sort==='gelb'?'#ffc928':'#5aa0ff';const r=c.gold?4.5:3;mctx.fillRect(X(c.x)-r,Z(c.z)-r,r*2,r*2);}}
  for(const u of units){if(!u.alive)continue;mctx.fillStyle=u.team?'#3ee0d1':'#ff9a3c';mctx.beginPath();if(u.kind==='turm'){mctx.moveTo(X(u.x),Z(u.z)-6);mctx.lineTo(X(u.x)+6,Z(u.z));mctx.lineTo(X(u.x),Z(u.z)+6);mctx.lineTo(X(u.x)-6,Z(u.z));mctx.closePath();}else if(isVeh(u))mctx.rect(X(u.x)-6,Z(u.z)-6,12,12);else mctx.arc(X(u.x),Z(u.z),u===player?6:4.5,0,TAU);mctx.fill();
    if(u.attacker&&u.go){mctx.strokeStyle='#ff5a4f';mctx.lineWidth=2;mctx.stroke();}
    if(u===player){mctx.strokeStyle='#fff';mctx.lineWidth=2;mctx.stroke();mctx.beginPath();mctx.moveTo(X(u.x),Z(u.z));mctx.lineTo(X(u.x+Math.sin(camYaw)*5),Z(u.z+Math.cos(camYaw)*5));mctx.stroke();}}
}

/* ---------- Atmosphere & life ---------- */
/* Light mood: warm golden afternoon during the rest phase, a deeper orange evening glow while a wave rolls in */
const MOOD={hor:[new THREE.Color(0xf2dfbf),new THREE.Color(0xf0b98f)],top:[new THREE.Color(0x4b8fcf),new THREE.Color(0x5874b4)],
  sun:[new THREE.Color(0xffdcaa),new THREE.Color(0xffad72)],sky:[new THREE.Color(0xfff0d8),new THREE.Color(0xffd3b8)]};
let mood=0;const moodC=new THREE.Color();
function updateMood(dt){
  const want=state!=='menu'&&waveT>0&&peaceT<=0?1:0;mood+=(want-mood)*Math.min(1,dt*0.5);
  moodC.copy(MOOD.hor[0]).lerp(MOOD.hor[1],mood);
  scene.fog.color.copy(moodC);scene.background.copy(moodC);sky.material.uniforms.hor.value.copy(moodC);
  sky.material.uniforms.top.value.copy(MOOD.top[0]).lerp(MOOD.top[1],mood);
  sun.color.copy(MOOD.sun[0]).lerp(MOOD.sun[1],mood);sun.intensity=1.05-mood*0.12;
  hemi.color.copy(MOOD.sky[0]).lerp(MOOD.sky[1],mood);hemi.intensity=0.62-mood*0.06;
}

/* Hit sparks: small additive streaks that fly off and fall */
const SPARK_G=new THREE.BoxGeometry(0.045,0.045,0.24);
const SPARK_M=new THREE.MeshBasicMaterial({color:0xffe28a,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false});
const SPARK_MB=new THREE.MeshBasicMaterial({color:0x9fe6ff,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false});
function sparks(x,y,z,n,col){
  if(player&&Math.hypot(x-player.x,z-player.z)>30)return;
  for(let i=0;i<n&&parts.length<280;i++){
    const m=new THREE.Mesh(SPARK_G,col?SPARK_MB:SPARK_M),vx=rand(-4,4),vz=rand(-4,4),vy=rand(1.5,5);
    m.position.set(x,y,z);m.rotation.y=Math.atan2(vx,vz);m.rotation.x=-Math.atan2(vy,Math.hypot(vx,vz))*0.6;scene.add(m);
    parts.push({m,vx,vy,vz,life:rand(.18,.38),max:.38,spark:true,solid:true});
  }
}

/* Battle damage: dents and scratches on robots, scorched paint, a bent antenna, smoke and fizzing sparks.
   Everything goes away again once the unit is repaired. */
const DENT_G=new THREE.SphereGeometry(0.1,7,5),SCRATCH_G=new THREE.BoxGeometry(0.24,0.025,0.02);
const DENT_M=new THREE.MeshPhongMaterial({color:0x34373a,specular:0x777777,shininess:40});
const SCRATCH_M=new THREE.MeshBasicMaterial({color:0xdfe4e6});
const SCORCH_C=new THREE.Color(0x2e2620);
function addDent(u){
  const scratch=Math.random()<0.35,m=new THREE.Mesh(scratch?SCRATCH_G:DENT_G,scratch?SCRATCH_M:DENT_M);
  if(Math.random()<0.35){ // on the head, avoiding the visor in front
    const f=pick([[0.34,0],[-0.34,0],[0,-0.29]]);
    m.position.set(f[0]||rand(-.22,.22),1.47+rand(-.15,.15),f[1]||rand(-.2,.2));
    m.rotation.y=f[0]?Math.PI/2:0;
  }else{const a=rand(0,TAU);m.position.set(Math.sin(a)*0.45,rand(.6,1.1),Math.cos(a)*0.45);m.rotation.y=a;}
  if(scratch)m.rotation.z=rand(-.8,.8);else m.scale.set(1,1,0.4);
  u.bot.g.add(m);u.dents.push(m);
}
function updateDamageLook(u,dt,gy){
  if(!u.alive)return;
  const b=u.bot,f=1-u.hp/u.maxHp,lvl=Math.max(0,Math.min(3,Math.floor(f*4+0.15)));
  if(lvl!==(u.dmgLvl||0)){
    u.dmgLvl=lvl;
    if(!b.pb){b.pb=b.paint.color.clone();b.hb=b.head.color.clone();}
    b.paint.color.copy(b.pb).lerp(SCORCH_C,lvl*0.13);b.head.color.copy(b.hb).lerp(SCORCH_C,lvl*0.11);
    if(!isVeh(u)){
      u.dents=u.dents||[];
      while(u.dents.length>lvl*2){const d=u.dents.pop();b.g.remove(d);}
      while(u.dents.length<lvl*2)addDent(u);
      if(b.antP){b.antP.rotation.z=lvl>=2?0.75:0;b.antP.rotation.x=lvl>=3?-0.45:0;}
    }
  }
  if(lvl>=3&&b.bulb)b.bulb.visible=Math.sin(gameT*23+u.id)>-0.3; // flickering lamp
  else if(b.bulb)b.bulb.visible=true;
  if(lvl>=2){
    u.smT=(u.smT||0)-dt;
    if(u.smT<=0){u.smT=lvl>=3?.32:.75;
      if(!player||Math.hypot(u.x-player.x,u.z-player.z)<26){
        const top=isVeh(u)?VEH[u.kind].tag-0.6:1.9;
        puffs(u.x+rand(-.2,.2),gy+top,u.z+rand(-.2,.2),1,0x3d3a36,{size:.45,spread:.3,up:.6,life:1.1,op:.6,grow:1.3});
        if(Math.random()<.35)sparks(u.x,gy+top-0.4,u.z,2);
      }}
  }
}

/* Seabirds circling over the island, gliding now and then */
const birds=[];
(function(){
  const bodyG=new THREE.ConeGeometry(0.09,0.5,5).rotateX(Math.PI/2);
  const wingG=new THREE.PlaneGeometry(0.62,0.2).translate(0.31,0,0).rotateX(-Math.PI/2);
  const white=new THREE.MeshLambertMaterial({color:0xf7f3ea,side:THREE.DoubleSide}),grey=new THREE.MeshLambertMaterial({color:0x8d939a,side:THREE.DoubleSide});
  for(let f=0;f<4;f++){
    const cx=(srand()*2-1)*38,cz=(srand()*2-1)*38,r=14+srand()*20,y=15+srand()*9,sp=(srand()<.5?-1:1)*(0.11+srand()*0.08),n=3+Math.floor(srand()*4);
    for(let i=0;i<n;i++){
      const g=new THREE.Group();g.add(new THREE.Mesh(bodyG,white));
      const wl=new THREE.Group(),wr=new THREE.Group(),mat=i%2?grey:white;
      wl.add(new THREE.Mesh(wingG,mat));const m2=new THREE.Mesh(wingG,mat);m2.scale.x=-1;wr.add(m2);g.add(wl);g.add(wr);
      g.scale.setScalar(1.4);scene.add(g);
      birds.push({g,wl,wr,cx,cz,r:r+(i%3)*1.5,y:y+(i%3)*0.7,sp,ph:srand()*0.3,lag:i*0.06,flap:srand()*TAU,bob:srand()*TAU});
    }
  }
})();
function updateBirds(dt){
  for(const b of birds){
    b.ph+=b.sp*dt;const a=b.ph-b.lag;
    b.g.position.set(b.cx+Math.cos(a)*b.r,b.y+Math.sin(gameT*0.7+b.bob)*0.8,b.cz+Math.sin(a)*b.r);
    b.g.rotation.set(0,Math.atan2(-Math.sin(a)*b.sp,Math.cos(a)*b.sp),-Math.sign(b.sp)*0.22);
    const glide=Math.sin(gameT*0.45+b.bob)>0.35;b.flap+=dt*(glide?2:8);
    const w=glide?0.1+Math.sin(b.flap)*0.04:Math.sin(b.flap)*0.6;b.wl.rotation.z=w;b.wr.rotation.z=-w;
  }
}

/* Foam rings and splashes where the river runs against the bridge pillars */
const foams=[];
(function(){
  const fg=new THREE.RingGeometry(0.28,0.5,18).rotateX(-Math.PI/2);
  if(!MOUNTAIN)for(const bx of BRIDGES)for(const side of [-1,1])for(const sx of [-2.25,2.25])for(const sz of [4.8,7.6]){
    const m=new THREE.Mesh(fg,new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.5,depthWrite:false}));
    const x=bx+sx*0.8,z=side*sz;m.position.set(x,-1.47,z);scene.add(m);foams.push({m,x,z,t:srand()*1.6});
  }
})();
let splashT=0;
function updateFoam(dt){
  for(const f of foams){f.t=(f.t+dt)%1.6;const k=f.t/1.6;f.m.scale.setScalar(1+k*1.6);f.m.material.opacity=0.55*(1-k);}
  splashT-=dt;
  if(splashT<=0&&foams.length){splashT=rand(.35,.7);const f=pick(foams);
    if(!player||Math.hypot(f.x-player.x,f.z-player.z)<34)puffs(f.x+rand(-.3,.3),-1.4,f.z+rand(-.3,.3),2,0xf4fbff,{size:.28,spread:.6,up:.9,life:.55,op:.85,grow:.4});}
}

/* Pollen and dust motes drifting in the sunlight around the camera */
const motes=(function(){
  const N=140,g=new THREE.BufferGeometry(),p=new Float32Array(N*3);
  for(let i=0;i<N;i++){p[i*3]=(Math.random()*2-1)*14;p[i*3+1]=Math.random()*5;p[i*3+2]=(Math.random()*2-1)*14;}
  g.setAttribute('position',new THREE.BufferAttribute(p,3));
  const m=new THREE.Points(g,new THREE.PointsMaterial({color:0xfff1c8,size:0.085,transparent:true,opacity:.75,depthWrite:false,blending:THREE.AdditiveBlending}));
  m.frustumCulled=false;scene.add(m);return m;
})();
function updateMotes(dt){
  const a=motes.geometry.attributes.position,arr=a.array,cx=camLook.x,cy=camLook.y+2.5,cz=camLook.z;
  for(let i=0;i<arr.length;i+=3){
    arr[i]+=(Math.sin(gameT*0.3+i)*0.3+0.25)*dt;arr[i+1]+=Math.cos(gameT*0.5+i*0.7)*0.15*dt;arr[i+2]+=Math.cos(gameT*0.27+i)*0.3*dt;
    if(arr[i]<cx-14)arr[i]+=28;else if(arr[i]>cx+14)arr[i]-=28;
    if(arr[i+1]<cy-2.5)arr[i+1]+=5;else if(arr[i+1]>cy+2.5)arr[i+1]-=5;
    if(arr[i+2]<cz-14)arr[i+2]+=28;else if(arr[i+2]>cz+14)arr[i+2]-=28;
  }
  a.needsUpdate=true;
}
