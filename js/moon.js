/* Kistenkrawall: Mond (Auftrag „Mond“). Grundriss in core.js (URB, hgtMoon), Kuppeln, Schlauchgang und Deko in urban.js.
   Hier: schwarzer Himmel mit Sternen, die große Erde am Himmel, Sternschnuppen und ab und zu ein Meteoritenschauer
   (bei Wetter „Zufall“; nur zum Anschauen: Meteore schlagen dunkle kleine Krater, ohne Schaden, auf jedem Gerät eigen).
   Weihnachtsedition: der Weihnachtsmann fliegt mit seinen Rentieren vor der Erde vorbei.
   Die geringe Schwerkraft steckt in GRAV (core.js): Kisten, Staub, Splitter und Mörser (combat.js, game.js, content.js). */
'use strict';
const MOONFX={earth:null,meteors:[],showers:0,impacts:0,shooting:0,next:0,on:0};
if(MOON)(function(){
  const X=typeof XMAS!=='undefined'&&XMAS;
  if(typeof clouds!=='undefined')for(const c of clouds)c.visible=false;   // no clouds without air
  /* ---------- the Earth: oceans, continents, clouds, a thin blue glow ---------- */
  const tex=(function(){
    const W=512,H=256,c=document.createElement('canvas');c.width=W;c.height=H;const g=c.getContext('2d');
    const sea=g.createLinearGradient(0,0,0,H);sea.addColorStop(0,'#1d4f8f');sea.addColorStop(0.5,'#2a6fb8');sea.addColorStop(1,'#1d4f8f');g.fillStyle=sea;g.fillRect(0,0,W,H);
    const blob=(x,y,r,col)=>{g.fillStyle=col;g.beginPath();for(let i=0;i<=18;i++){const a=i/18*TAU,rr=r*(0.7+0.3*Math.sin(i*2.3+x));g.lineTo(x+Math.cos(a)*rr*1.4,y+Math.sin(a)*rr);}g.fill();};
    for(const [x,y,r] of [[90,80,34],[120,140,26],[260,90,44],[300,150,30],[230,170,20],[400,100,36],[430,170,22],[160,60,18]]){blob(x,y,r,'#4f8a3a');blob(x+8,y+4,r*0.6,'#8f7a4a');}
    g.fillStyle='#f4f8ff';g.fillRect(0,0,W,12);g.fillRect(0,H-14,W,14);
    g.globalAlpha=0.75;for(let i=0;i<70;i++){const x=(i*97)%W,y=20+(i*53)%(H-40);g.fillStyle='#ffffff';g.beginPath();g.ellipse(x,y,18+(i%5)*6,4+(i%3)*2,0.2,0,TAU);g.fill();}
    g.globalAlpha=1;return new THREE.CanvasTexture(c);
  })();
  const E=new THREE.Group(),R=30;
  const earth=new THREE.Mesh(new THREE.SphereGeometry(R,40,24),new THREE.MeshPhongMaterial({map:tex,specular:0x335577,shininess:18,emissive:0x0a1830,fog:false}));E.add(earth);
  const glowT=(function(){const c=document.createElement('canvas');c.width=c.height=128;const g=c.getContext('2d'),r=g.createRadialGradient(64,64,40,64,64,64);
    r.addColorStop(0,'rgba(120,180,255,.55)');r.addColorStop(0.72,'rgba(120,180,255,.25)');r.addColorStop(1,'rgba(120,180,255,0)');g.fillStyle=r;g.fillRect(0,0,128,128);return new THREE.CanvasTexture(c);})();
  const glow=new THREE.Sprite(new THREE.SpriteMaterial({map:glowT,transparent:true,depthWrite:false,fog:false,blending:THREE.AdditiveBlending}));glow.scale.setScalar(R*2.6);E.add(glow);
  const dir=new THREE.Vector3(-0.38,0.36,-0.85).normalize();E.position.copy(dir).multiplyScalar(255);earth.rotation.z=0.4;
  earth.renderOrder=-1;scene.add(E);MOONFX.earth=E;

  /* ---------- Christmas: the sleigh with its reindeer crosses in front of the Earth ---------- */
  let sleigh=null,sT=6;
  if(X){
    sleigh=new THREE.Group();const dark=new THREE.MeshBasicMaterial({color:0x1a1410,fog:false}),red=new THREE.MeshBasicMaterial({color:0xff3030,fog:false});
    const body=new THREE.Mesh(new THREE.BoxGeometry(3,1.4,1.4),dark);sleigh.add(body);
    const santa=new THREE.Mesh(new THREE.SphereGeometry(0.6,8,6),new THREE.MeshBasicMaterial({color:0xc81e1e,fog:false}));santa.position.set(-0.4,1.1,0);sleigh.add(santa);
    for(let i=0;i<4;i++){const r=new THREE.Mesh(new THREE.BoxGeometry(1.5,0.6,0.5),dark);r.position.set(3+i*2,0.4+Math.sin(i)*0.2,0);sleigh.add(r);
      const h=new THREE.Mesh(new THREE.BoxGeometry(0.15,0.8,0.15),dark);h.position.set(3.6+i*2,1,0);sleigh.add(h);}
    const nose=new THREE.Mesh(new THREE.SphereGeometry(0.22,6,4),red);nose.position.set(9.9,0.55,0);sleigh.add(nose);
    sleigh.visible=false;scene.add(sleigh);MOONFX.sleigh=sleigh;
  }

  /* ---------- shooting stars, meteors ---------- */
  const lineM=new THREE.LineBasicMaterial({color:0xffffff,transparent:true,opacity:0,fog:false});
  const star=new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(),new THREE.Vector3()]),lineM);star.frustumCulled=false;scene.add(star);
  let starT=rand(3,8),starLife=0;const sA=new THREE.Vector3(),sB=new THREE.Vector3();
  const rockM=new THREE.MeshBasicMaterial({color:0xffc070}),trailM=new THREE.MeshBasicMaterial({color:0xffa040,transparent:true,opacity:0.6,blending:THREE.AdditiveBlending,depthWrite:false});
  const crTex=(function(){const c=document.createElement('canvas');c.width=c.height=64;const g=c.getContext('2d'),r=g.createRadialGradient(32,32,2,32,32,32);
    r.addColorStop(0,'rgba(30,30,32,.85)');r.addColorStop(0.55,'rgba(50,50,52,.6)');r.addColorStop(0.75,'rgba(200,198,190,.5)');r.addColorStop(1,'rgba(200,198,190,0)');g.fillStyle=r;g.fillRect(0,0,64,64);return new THREE.CanvasTexture(c);})();
  const crMat=new THREE.MeshBasicMaterial({map:crTex,transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2});
  const decals=[];
  function okSpot(x,z){return urbanFree(x,z,1.5)&&!inTube(x,z,2)&&!BASES.some(b=>Math.hypot(b.x-x,b.z-z)<12)&&!obstacles.some(o=>Math.hypot(o.x-x,o.z-z)<o.r+1);}
  function meteor(){
    let x=0,z=0;for(let k=0;k<20;k++){x=rand(-46,46);z=rand(-30,30);if(okSpot(x,z))break;}
    const m=new THREE.Mesh(new THREE.SphereGeometry(0.35,8,6),rockM),tr=new THREE.Mesh(new THREE.ConeGeometry(0.35,5,8,1,true),trailM);
    tr.position.y=2.6;m.add(tr);const from=new THREE.Vector3(x+rand(-25,25),70,z+rand(-25,25)),to=new THREE.Vector3(x,hgt(x,z),z);
    m.position.copy(from);m.lookAt(to);tr.rotation.x=-Math.PI/2;tr.position.set(0,0,-2.6);scene.add(m);
    MOONFX.meteors.push({m,from,to,t:0,T:rand(1.1,1.6)});
  }
  function impact(p){
    MOONFX.impacts++;
    if(typeof boom==='function')boom(p.x,p.z,1.6);
    puffs(p.x,p.y+0.3,p.z,8,0xa8a6a0,{size:1,grow:.5,life:3,spread:2.6,up:.6,op:.6});
    let d=decals.length<24?null:decals.shift();
    if(!d){d=new THREE.Mesh(new THREE.CircleGeometry(1,20).rotateX(-Math.PI/2),crMat);scene.add(d);}
    d.position.set(p.x,p.y+0.04,p.z);d.scale.setScalar(rand(1.2,2));decals.push(d);
  }
  MOONFX.shower=function(){MOONFX.on=rand(12,16);MOONFX.showers++;if(state==='play')toast('Meteoritenschauer!',2.2);};
  MOONFX.next=rand(70,140);let spawnT=0,lastT=0;

  const _mood=updateMood;
  updateMood=function(dt){_mood(dt);
    /* black sky, stars always, a dark horizon; the sun stays white and hard */
    scene.background.setRGB(0.01,0.012,0.02);scene.fog.color.setRGB(0.03,0.035,0.05);
    if(sky&&sky.material.uniforms){sky.material.uniforms.top.value.setRGB(0.0,0.0,0.01);sky.material.uniforms.hor.value.setRGB(0.04,0.045,0.06);}
    if(DN.lights){DN.lights.stars.visible=true;DN.lights.stars.material.opacity=1;}
    sun.color.lerp(new THREE.Color(0xffffff),0.6);hemi.intensity*=0.55;
    if(typeof LOOK!=='undefined')LOOK.cloud.value=0;   // no cloud shadows either
    earth.rotation.y+=dt*0.01;
    /* the sleigh crosses the Earth every 40 s or so */
    if(sleigh){sT-=dt;if(sT<0){const k=Math.min(1,-sT/9);sleigh.visible=true;
      const side=new THREE.Vector3(-dir.z,0,dir.x).normalize(),up=new THREE.Vector3(0,1,0);
      sleigh.position.copy(dir).multiplyScalar(215).addScaledVector(side,(k-0.5)*90).addScaledVector(up,Math.sin(k*Math.PI)*8-4);
      sleigh.lookAt(sleigh.position.clone().addScaledVector(side,-1));sleigh.rotateY(Math.PI/2);
      if(k>=1){sT=rand(30,50);sleigh.visible=false;}}}
    /* shooting stars */
    starT-=dt;
    if(starT<=0){starT=rand(4,12);starLife=0.7;MOONFX.shooting++;const a=Math.random()*TAU,el=rand(0.35,0.8);
      sA.set(Math.cos(a)*Math.cos(el),Math.sin(el),Math.sin(a)*Math.cos(el)).multiplyScalar(220);sB.copy(sA).add(new THREE.Vector3(rand(-1,1),-0.4,rand(-1,1)).normalize().multiplyScalar(30));}
    if(starLife>0){starLife-=dt;const k=1-starLife/0.7,p=star.geometry.attributes.position;
      p.setXYZ(0,sA.x+(sB.x-sA.x)*k,sA.y+(sB.y-sA.y)*k,sA.z+(sB.z-sA.z)*k);p.setXYZ(1,sA.x+(sB.x-sA.x)*Math.max(0,k-0.25),sA.y+(sB.y-sA.y)*Math.max(0,k-0.25),sA.z+(sB.z-sA.z)*Math.max(0,k-0.25));
      p.needsUpdate=true;lineM.opacity=Math.sin(k*Math.PI);}else lineM.opacity=0;
    /* meteor showers: only with weather „Zufall“, during the round */
    if(gameT<lastT){MOONFX.next=rand(70,140);MOONFX.on=0;}lastT=gameT;
    if(state==='play'&&DN.wsel==='zufall'){
      if(MOONFX.on>0){MOONFX.on-=dt;spawnT-=dt;if(spawnT<=0){spawnT=rand(0.5,1.2);meteor();}if(MOONFX.on<=0)MOONFX.next=rand(150,260);}
      else{MOONFX.next-=dt;if(MOONFX.next<=0)MOONFX.shower();}
    }
    for(let i=MOONFX.meteors.length-1;i>=0;i--){const f=MOONFX.meteors[i];f.t+=dt/f.T;
      if(f.t>=1){impact(f.to);scene.remove(f.m);MOONFX.meteors.splice(i,1);continue;}
      f.m.position.lerpVectors(f.from,f.to,f.t);}
  };
})();
