/* Kistenkrawall: Vulkan-Karte (nur aktiv, wenn MAP === 'vulkan').
   Grundriss und Höhenprofil stehen in core.js, Gelände, Lava und Brücken in world.js, die Wegführung in combat.js.
   Hier kommen Himmel und Licht, Krater, Rauchsäule und der Ausbruch dazu: Der Vulkan grollt, eine der vier
   Brücken wird markiert und nach kurzer Warnung einige Sekunden lang mit Lavabrocken beworfen. */
'use strict';
// true while the given bridge (lane x, bank side 1 / -1) is warned or under fire; used by routing and the minimap
let bridgeClosed=()=>false;
if(VOLCANO)(function(){
  // hazy, warm light under an ash sky; a wave turns it darker and redder
  MOOD.hor=[new THREE.Color(0xe9c9a4),new THREE.Color(0xd98a5c)];
  MOOD.top=[new THREE.Color(0x6f7f9c),new THREE.Color(0x58495f)];
  MOOD.sun=[new THREE.Color(0xffe2c0),new THREE.Color(0xffb690)];
  MOOD.sky=[new THREE.Color(0xf0dccb),new THREE.Color(0xdcb8a8)];
  scene.fog.near=50;scene.fog.far=160;

  /* Crater: a lava lake, a glow above it and a column of smoke */
  const topY=hgtRaw(0,0);
  const lake=new THREE.Mesh(new THREE.CircleGeometry(1.75,20),lavaMat);lake.rotation.x=-Math.PI/2;lake.position.set(0,topY+1.1,0);scene.add(lake);
  const glowTex=(function(){const c=document.createElement('canvas');c.width=c.height=64;const g=c.getContext('2d'),r=g.createRadialGradient(32,32,2,32,32,32);
    r.addColorStop(0,'rgba(255,190,90,.95)');r.addColorStop(.4,'rgba(255,110,30,.45)');r.addColorStop(1,'rgba(255,80,10,0)');g.fillStyle=r;g.fillRect(0,0,64,64);return new THREE.CanvasTexture(c);})();
  const glow=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTex,blending:THREE.AdditiveBlending,depthWrite:false,transparent:true,fog:false}));
  glow.position.set(0,topY+2.8,0);glow.scale.setScalar(9);scene.add(glow);
  const smokeG=new THREE.IcosahedronGeometry(1,1),smoke=[];
  for(let i=0;i<12;i++){
    const m=new THREE.Mesh(smokeG,new THREE.MeshLambertMaterial({color:0x4a4543,transparent:true,opacity:0.5,depthWrite:false}));
    scene.add(m);smoke.push({m,t:i/12});
  }

  /* Eruption */
  const E={phase:0,t:0,next:rand(45,65),bx:BRIDGES[0],side:1,bombT:0,lastT:0};
  const WARN=3.5,FIRE=6,FLY=1.5;
  bridgeClosed=(bx,side)=>E.phase>0&&E.bx===bx&&E.side===side;
  const ringG=new THREE.RingGeometry(0.9,1.25,20).rotateX(-Math.PI/2);
  const marks=[0,1,2].map(()=>{const m=new THREE.Mesh(ringG,new THREE.MeshBasicMaterial({color:0xffd23a,transparent:true,opacity:0.9,depthWrite:false}));m.visible=false;scene.add(m);return m;});
  const bombG=new THREE.IcosahedronGeometry(0.42,0),bombs=[];
  function setPhase(phase,bx,side){
    E.phase=phase;E.t=0;E.bombT=0;
    if(phase){E.bx=bx;E.side=side;}
    marks.forEach((m,i)=>{m.visible=phase>0;if(phase)m.position.set(bx,0.52,side*(6.2+i*3.1));});
    if(phase===1){toast('Der Vulkan grollt! Runter von der markierten Brücke!',3);if(MP!=='guest')sfx('grollen');}   // the host's sound reaches the guest by itself
    if(MP==='host')NET.pendingEv.push(['vp',phase,bx||0,side||0]);
  }
  function launch(x,z){
    const m=new THREE.Mesh(bombG,new THREE.MeshBasicMaterial({color:0xff7a1e}));scene.add(m);
    bombs.push({m,x,z,t:0});
    if(MP==='host')NET.pendingEv.push(['vb',Math.round(x*100)/100,Math.round(z*100)/100]);
  }
  // for a multiplayer guest: the host announces phases and bombs, damage arrives with the game state
  window.volcanoEvent=e=>{if(e[0]==='vp')setPhase(e[1],e[2],e[3]);else launch(e[1],e[2]);};

  let last=performance.now(),tt=0,emberT=0,steamT=0;
  (function tick(now){
    requestAnimationFrame(tick);
    const dt=Math.min(0.05,(now-last)/1000);last=now;
    if(state==='pause'||document.hidden)return;
    step(dt);
  })(last);
  function step(dt){
    tt+=dt;
    for(const s of smoke){
      s.t=(s.t+dt*0.055)%1;const k=s.t;
      s.m.position.set(Math.sin(k*5+tt*0.2)*1.2+k*k*9,topY+1.5+k*26,Math.cos(k*4)*1.0+k*3);
      s.m.scale.setScalar(1.1+k*5.5);s.m.material.opacity=0.55*Math.min(1,k*8)*(1-k);
    }
    glow.material.opacity=0.75+Math.sin(tt*2.3)*0.12+(E.phase?0.2:0);glow.scale.setScalar(E.phase?12+Math.sin(tt*14):9);
    emberT-=dt;if(emberT<=0&&state==='play'){emberT=E.phase?0.15:0.9;puffs(rand(-0.8,0.8),topY+1.6,rand(-0.8,0.8),1,0xff8a3a,{size:0.5,up:2.2,life:1.3,spread:1.2});}
    // steam where the lava runs into the sea
    steamT-=dt;if(steamT<=0&&state==='play'){steamT=0.35;puffs((Math.random()<.5?-1:1)*(LAVA_END+rand(0,1.5)),-1,rand(-BANK-2,BANK+2),1,0xf2f2f2,{size:1.6,up:1.3,life:2.4,spread:0.8,grow:1.5,op:0.6});}
    for(const m of marks)if(m.visible){m.material.opacity=E.phase===1?0.45+0.45*Math.abs(Math.sin(tt*7)):0.9;m.material.color.set(E.phase===2?0xff4a1a:0xffd23a);}
    // bombs fly in a high arc from the crater to the bridge
    const sim=MP!=='guest';
    for(let i=bombs.length-1;i>=0;i--){
      const b=bombs[i];b.t+=dt;const k=Math.min(1,b.t/FLY),y0=topY+2,y1=0.6;
      b.m.position.set(b.x*k,y0+(y1-y0)*k+Math.sin(k*Math.PI)*11,b.z*k);b.m.rotation.x+=dt*6;
      if(k>=1){scene.remove(b.m);bombs.splice(i,1);if(sim&&state==='play'){explode(b.x,b.z,2.6,38,-1,null);sfx('boom',b.x,b.z);}}
    }
    if(state!=='play'){if(E.phase&&state==='menu')setPhase(0);return;}
    if(!sim)return;
    if(gameT<E.lastT){E.phase&&setPhase(0);E.next=rand(45,65);}   // a new round started
    E.lastT=gameT;E.t+=dt;
    if(E.phase===0){E.next-=dt;if(E.next<=0){
      // never the same bank twice in a row, so both teams are hit equally often
      setPhase(1,pick(BRIDGES),-E.side);}}
    else if(E.phase===1){if(E.t>=WARN)setPhase(2,E.bx,E.side);}
    else{
      E.bombT-=dt;
      if(E.bombT<=0&&E.t<FIRE-FLY){E.bombT=0.42;launch(E.bx+rand(-1,1)*(crossW(E.bx)-0.4),E.side*rand(5.4,BANK+2));}
      if(E.t>=FIRE){setPhase(0);E.next=rand(55,85);}
    }
  }
  window.volcano={E,erupt:(bx,side)=>setPhase(1,bx,side),step,bombs,smoke};   // for tests
})();
