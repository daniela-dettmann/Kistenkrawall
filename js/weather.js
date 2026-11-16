/* Kistenkrawall: dynamisches Wetter (Auftrag „Dynamisches Wetter“). Baut auf daynight.js auf (DN.wx: Art, Stärke s,
   Gewitter-Flag, Blitzhelligkeit) und bringt das Wetter ins Bild und ins Spiel:
   - Plan bei „Zufall“: klar und Wetter wechseln sich zufällig ab, unabhängig von Bauruhe und Welle: 60 bis 150 s klar
     (zu Rundenbeginn nur 40 bis 80 s), dann 40 bis 90 s Schauer bzw. Schneefall (60 %) oder Unwetter (40 %). Gewählt in Einstellungen › Spiel › Wetter; eine feste Wahl
     gilt sofort, auch aus der Pause.
   - Regen: Streifen um die Kamera, Tropfenringe auf dem Wasser, nasser Glanz auf Kisten, Blechlingen und Fahrzeugen,
     Pfützen an flachen Stellen, die den Himmel spiegeln; Fahrzeuge spritzen beim Durchfahren.
   - Gewitter: Blitz über der ganzen Szene (daynight.js), ab und zu ein sichtbarer Einschlag in einen Baum, der kurz
     brennt und danach angekohlt ist.
   - Schneesturm: waagerecht treibende Streifen, dichter Nebel (daynight.js), Spuren schneien schneller zu (snow.js).
   - Wind: Fallschirmkisten schwanken und landen etwas versetzt (höchstens gut eine Einheit, nie im Wasser).
   - Sandsturm (Wüste): erst eine Vorwarnung (Himmel wird gelblich, Wind frischt auf, Meldung), etwa 8 s später der
     volle Sturm: Sandschleier, kaum Sicht, heulender Wind; herumliegende Kisten werden ein Stück verweht, aber nie in
     die Pyramide, ins Wasser oder an eine Wand. Bei „Schneesturm“ in den Einstellungen gibt es in der Wüste Sandsturm.
   Auf „Grafik: Niedrig“ weniger als halb so viele Streifen, keine Tropfenringe. */
'use strict';
const WX={wet:0,wind:0,dir:Math.random()*TAU,strikes:0,charred:0,puddles:0,ringsLive:0,streaks:0,plan:null};
(function(){
  const FARS=[];scene.traverse(o=>{if(o.userData.kkFar)FARS.push(o);});
  const W=DN.wx,snowy=MOUNTAIN||XSNOW;

  /* ---------- Plan ---------- */
  // Zufall: clear and weather take turns at random, the same in the building phase and during a wave and in
  // multiplayer. A clear spell lasts 60 to 150 s (the first one only 40 to 80 s, so every round gets weather early),
  // then 40 to 90 s of weather: a shower or snowfall (60 %) or a storm (40 %), and it clears up again.
  const R={next:rand(40,80),on:false,lastT:0,had:false,warn:0};
  WX.plan=R;
  // the desert: a warning first (a light haze, the wind picks up), the full storm about 8 s later
  function sandStorm(){DN.setWeather('sand',true,0.3);R.warn=8;}
  WX.sandStorm=sandStorm;
  function storm(){if(DESERT){sandStorm();return;}if(snowy)DN.setWeather('schnee',true,1);else if(VOLCANO&&Math.random()<0.4)DN.setWeather('asche',true,1);else DN.setWeather('regen',Math.random()<0.75,1);}
  function shower(){if(DESERT)DN.setWeather('sand',false,0.5);else if(snowy)DN.setWeather('schnee',false,0.6);else if(VOLCANO)DN.setWeather('asche',false,0.7);else DN.setWeather('regen',false,0.7);}
  const SEL={regen:['regen',false,0.85],gewitter:['regen',true,1],schnee:DESERT?['sand',true,1]:['schnee',true,1]};
  // a fixed choice from the settings: applied at once, also in the menu and the pause
  function applySel(){
    if(MOON){if(W.want!=='klar')DN.setWeather('klar',false);return;}   // no air, no weather (moon.js plans the meteor showers)
    const s=DN.wsel;
    if(s==='zufall'){if(!R.on)DN.setWeather('klar',false);return;}
    if(s==='klar'){if(W.want!=='klar')DN.setWeather('klar',false);return;}
    const [k,st,l]=SEL[s];if(W.want!==k||W.storm!==st)DN.setWeather(k,st,l);
  }
  DN.applySel=applySel;
  DN.roll=function(dt,playing){
    if(MOON){applySel();return;}
    if(gameT<R.lastT){R.next=rand(40,80);R.on=false;R.had=false;WX.dir=Math.random()*TAU;}   // a new round
    R.lastT=gameT;
    if(R.warn>0){R.warn-=dt;if(R.warn<=0&&W.want==='sand')W.lvl=1;}
    if(DN.wsel!=='zufall'){applySel();return;}
    if(!playing)return;
    R.next-=dt;if(R.next>0)return;
    if(!R.on){if(Math.random()<(DESERT?0.65:0.4))storm();else shower();R.on=true;R.had=true;R.next=rand(40,90);}
    else{DN.setWeather('klar',false);R.on=false;R.next=rand(60,150);}
  };
  applySel();

  /* ---------- Streaks: rain falls, a blizzard drives sideways ---------- */
  const SN=1400,sp=new Float32Array(SN*3),line=new Float32Array(SN*6);
  for(let i=0;i<SN;i++){sp[i*3]=rand(-26,26);sp[i*3+1]=rand(-2,18);sp[i*3+2]=rand(-26,26);}
  const sGeo=new THREE.BufferGeometry();sGeo.setAttribute('position',new THREE.BufferAttribute(line,3));
  const sMat=new THREE.LineBasicMaterial({color:0xd4e2f2,transparent:true,opacity:0,depthWrite:false});
  const streaks=new THREE.LineSegments(sGeo,sMat);streaks.frustumCulled=false;streaks.visible=false;streaks.renderOrder=3;scene.add(streaks);
  WX.streakMesh=streaks;

  /* ---------- Rings on the water (and in puddles) ---------- */
  const RN=60,ringM=new THREE.InstancedMesh(new THREE.RingGeometry(0.55,0.72,18).rotateX(-Math.PI/2),
    new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending}),RN);
  ringM.instanceMatrix.setUsage(THREE.DynamicDrawUsage);ringM.frustumCulled=false;ringM.count=0;scene.add(ringM);
  const rings=[],rd=new THREE.Object3D(),rc=new THREE.Color();
  for(let i=0;i<RN;i++){rings.push({x:0,y:0,z:0,t:1});ringM.setColorAt(i,rc.setRGB(0,0,0));}
  const isWater=(x,z)=>!!WATER.dist&&hgtRaw(x,z)<-1.8&&!(VOLCANO&&Math.abs(z)<BANK+3);

  /* ---------- Wet shine: the shared materials of crates, Blechlinge and vehicles ---------- */
  const shiny=Object.values(M).filter(m=>m&&m.isMeshPhongMaterial).map(m=>({m,sh:m.shininess,sp:m.specular.clone()}));
  const WET_SP=new THREE.Color(0x8a96a4);

  /* ---------- Puddles: flat spots on dry land, they fill in the rain and mirror the sky ---------- */
  const puddles=[];
  if(!snowy&&!MOON){
    for(let x=-48;x<=48&&puddles.length<26;x+=3)for(let z=-48;z<=48&&puddles.length<26;z+=3){
      const jx=x+(((x*7+z*3)%5+5)%5)*0.3,jz=z+(((x*3+z*11)%5+5)%5)*0.3,h=hgtRaw(jx,jz);
      if(h<-0.4||h>2.5||Math.abs(jx)>LIM-2||Math.abs(jz)>LIM-2||onBridge(jx,jz)||onPlatform(jx,jz))continue;
      if(VOLCANO&&Math.abs(jz)<BANK+4)continue;
      if(!urbanFree(jx,jz,2.4))continue;
      let flat=true;for(const [dx,dz] of [[1.6,0],[-1.6,0],[0,1.6],[0,-1.6],[1.1,1.1],[-1.1,-1.1]])if(Math.abs(hgtRaw(jx+dx,jz+dz)-h)>0.07){flat=false;break;}
      if(!flat)continue;
      if(obstacles.some(o=>Math.hypot(o.x-jx,o.z-jz)<o.r+1.6)||pads.some(p=>Math.hypot(p.x-jx,p.z-jz)<3.4)||hqs.some(q=>Math.hypot(q.x-jx,q.z-jz)<5))continue;
      if(pathDist(jx,jz)>3.5&&((jx*13+jz*7)%10+10)%10<6)continue;   // mostly on the paths, where the ground is trodden flat
      const r=1+((jx*5+jz*9)%7+7)%7*0.17;
      puddles.push({x:jx,z:jz,y:hgt(jx,jz)+0.045,r,rz:r*(0.6+((jx+jz)%4+4)%4*0.1),rot:(jx*0.7+jz*1.3)%TAU});
    }
  }
  WX.puddles=puddles.length;
  const alpha=(function(){const c=document.createElement('canvas');c.width=c.height=64;const g=c.getContext('2d'),r=g.createRadialGradient(32,32,8,32,32,32);
    r.addColorStop(0,'#fff');r.addColorStop(0.7,'#ddd');r.addColorStop(1,'#000');g.fillStyle=r;g.fillRect(0,0,64,64);return new THREE.CanvasTexture(c);})();
  const pMat=new THREE.MeshPhongMaterial({color:0x1a222b,specular:0x9fb2c4,shininess:160,transparent:true,opacity:0,depthWrite:false,alphaMap:alpha,
    envMap:(M.metal&&M.metal.envMap)||null,reflectivity:0.42,combine:THREE.MixOperation,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2});
  const pM=new THREE.InstancedMesh(new THREE.CircleGeometry(1,22).rotateX(-Math.PI/2),pMat,Math.max(1,puddles.length));
  pM.count=puddles.length;pM.receiveShadow=true;pM.visible=false;pM.frustumCulled=false;scene.add(pM);WX.puddleMesh=pM;
  const pd=new THREE.Object3D();let pScale=-1;
  function placePuddles(k){
    puddles.forEach((p,i)=>{pd.position.set(p.x,p.y,p.z);pd.rotation.set(0,p.rot,0);pd.scale.set(p.r*k,1,p.rz*k);pd.updateMatrix();pM.setMatrixAt(i,pd.matrix);});
    pM.instanceMatrix.needsUpdate=true;
  }
  WX.inPuddle=(x,z)=>{if(WX.wet<0.35)return null;for(const p of puddles){const k=0.4+0.6*WX.wet;if(Math.hypot((x-p.x)/(p.r*k),(z-p.z)/(p.rz*k))<1)return p;}return null;};

  /* ---------- Lightning into a tree: bolt, a short fire with smoke, then the tree stays charred ---------- */
  const charMat=new THREE.MeshLambertMaterial({color:0x221c18});
  const boltMat=new THREE.MeshBasicMaterial({color:0xf2f6ff,transparent:true,opacity:1,fog:false,depthWrite:false,blending:THREE.AdditiveBlending});
  const fires=[];
  DN.onBolt=function(){
    if(Math.random()>0.4||!player)return false;
    const cx=player.x,cz=player.z,cand=TREES.filter(t=>!t.burnt&&Math.hypot(t.x-cx,t.z-cz)<34&&Math.hypot(t.x-cx,t.z-cz)>5);
    if(!cand.length)return false;
    strike(cand[Math.floor(Math.random()*cand.length)]);return true;
  };
  // most flashes also show a bolt far away, in front of the camera, from the clouds down to the horizon
  const _onBolt=DN.onBolt;
  DN.onBolt=function(){
    const hit=_onBolt();
    if(!hit&&Math.random()<0.75){
      const d=new THREE.Vector3();camera.getWorldDirection(d);d.y=0;d.normalize();
      const a=rand(-0.6,0.6),dist=rand(45,75),x=camera.position.x+(d.x*Math.cos(a)-d.z*Math.sin(a))*dist,z=camera.position.z+(d.z*Math.cos(a)+d.x*Math.sin(a))*dist;
      fires.push({bolt:drawBolt(x,z,48,-1,0.22),life:0.3,fire:0,far:true});WX.farBolts=(WX.farBolts||0)+1;
    }
    return hit;
  };
  // A bolt from the clouds (height y0) down to (x, y1, z): the line is split again and again, every middle point
  // pushed sideways (less at each level), which gives the many short kinks of a real bolt; two to four thinner
  // branches fork off and fade out into the air.
  function jag(a,b,disp,depth,out){
    if(depth===0){out.push(b);return;}
    const m=a.clone().lerp(b,0.5);m.x+=rand(-disp,disp);m.z+=rand(-disp,disp);m.y+=rand(-disp,disp)*0.2;
    jag(a,m,disp*0.58,depth-1,out);jag(m,b,disp*0.58,depth-1,out);
  }
  function tube(pts,w,mat){
    const path=new THREE.CurvePath();for(let i=1;i<pts.length;i++)path.add(new THREE.LineCurve3(pts[i-1],pts[i]));
    const m=new THREE.Mesh(new THREE.TubeGeometry(path,(pts.length-1)*2,w,3,false),mat);m.renderOrder=5;return m;
  }
  function drawBolt(X,Z,y0,y1,w){
    const far=y0>40,W0=w*(far?2.6:1),mat=boltMat.clone(),g=new THREE.Group();
    const top=new THREE.Vector3(X+rand(-6,6),y0,Z+rand(-6,6)),bot=new THREE.Vector3(X,y1,Z),main=[top];
    jag(top,bot,top.distanceTo(bot)*0.3,7,main);
    g.add(tube(main,W0,mat));
    const nb=2+Math.floor(Math.random()*3);
    for(let k=0;k<nb;k++){
      const s0=main[Math.floor(rand(0.1,0.65)*main.length)],len=rand(5,12)*(far?1.4:1);
      const e=new THREE.Vector3(s0.x+rand(-1,1)*len*0.8,s0.y-len*rand(0.6,1),s0.z+rand(-1,1)*len*0.8),br=[s0.clone()];
      jag(s0,e,len*0.22,4,br);g.add(tube(br,W0*0.45,mat));
    }
    g.userData.mat=mat;scene.add(g);return g;
  }
  function dropBolt(b){scene.remove(b);b.traverse(o=>{if(o.isMesh)o.geometry.dispose();});}
  function strike(t){
    t.burnt=true;WX.strikes++;
    const bolt=drawBolt(t.x,t.z,36,hgt(t.x,t.z)+3.4,0.13);
    fires.push({t,bolt,life:0.32,fire:6.5,charAt:1.8,puffT:0});
    W.flash=1.15;
  }
  WX.strike=strike;
  function charTree(t){
    const c=t.g.clone();c.scale.multiplyScalar(1.035);
    c.traverse(o=>{if(o.isMesh){o.material=charMat;o.castShadow=false;o.receiveShadow=true;}});
    scene.add(c);t.charred=c;WX.charred++;
  }

  /* ---------- Wind on the parachute crates (game.js calls this while a crate hangs on its chute) ---------- */
  window.wxCrate=function(c,dt){
    if(WX.wind<0.05)return;
    const ph=(c.ph===undefined?(c.ph=Math.random()*TAU):c.ph),sw=Math.sin(gameT*1.9+ph)*0.28*WX.wind;
    c.m.rotation.z=sw;if(c.chute)c.chute.rotation.z=sw*0.6;
    // drift a little with the wind, at most about one unit, and never towards the water
    c.drift=c.drift||0;if(c.drift>1.2)return;
    const v=0.32*WX.wind*dt,nx=c.x+Math.cos(WX.dir)*v,nz=c.z+Math.sin(WX.dir)*v;
    if(Math.abs(nx)>LIM-1||Math.abs(nz)>LIM-1||hgtRaw(nx,nz)<-0.6||(Math.abs(nz)<BANK+1.6&&!onPlatform(nx,nz))||(VOLCANO&&Math.abs(nz)<BANK+3)||!urbanFree(nx,nz,1.2)||inPyramid(nx,nz,1))return;   // never onto a roof, never into the pyramid
    c.x=nx;c.z=nz;c.drift+=v;if(c.ring)c.ring.position.set(c.x,hgt(c.x,c.z)+0.05,c.z);
  };

  /* ---------- Sandstorm: big soft veils of sand drifting past the camera ---------- */
  const VN=14,veils=[];
  if(DESERT){
    const vt=(function(){const c=document.createElement('canvas');c.width=c.height=64;const g=c.getContext('2d'),r=g.createRadialGradient(32,32,2,32,32,32);
      r.addColorStop(0,'rgba(255,255,255,.9)');r.addColorStop(0.5,'rgba(255,255,255,.4)');r.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=r;g.fillRect(0,0,64,64);return new THREE.CanvasTexture(c);})();
    for(let i=0;i<VN;i++){const m=new THREE.Sprite(new THREE.SpriteMaterial({map:vt,color:0xc9a067,transparent:true,opacity:0,depthWrite:false,fog:false}));
      m.visible=false;m.renderOrder=4;scene.add(m);veils.push({m,x:rand(-30,30),y:rand(0,9),z:rand(-30,30),s:rand(14,24),ph:Math.random()*TAU});}
  }
  WX.veils=veils;
  // loose crates on the ground slide a little with the storm: at most about 3 units each, only over open sand,
  // never into the pyramid, the water, a wall, onto a stacking pad or off the field
  function sandOk(x,z){
    return Math.abs(x)<LIM-2&&Math.abs(z)<LIM-2&&urbanFree(x,z,1.2)&&!inPyramid(x,z,1)&&!obstacles.some(o=>Math.hypot(o.x-x,o.z-z)<o.r+0.9)&&!pads.some(p=>Math.hypot(p.x-x,p.z-z)<3.2)&&!hqs.some(q=>Math.hypot(q.x-x,q.z-z)<q.r+1.2);
  }
  WX.sandOk=sandOk;
  function blowCrates(dt){
    if(MP==='guest'||WX.wind<0.5||state!=='play')return;
    const v=0.42*WX.wind*dt,dx=Math.cos(WX.dir)*v,dz=Math.sin(WX.dir)*v;
    for(const c of crates){
      if(c.state!=='ground'||(c.blown||0)>3)continue;
      const nx=c.x+dx,nz=c.z+dz;if(!sandOk(nx,nz))continue;
      c.x=nx;c.z=nz;c.blown=(c.blown||0)+v;c.y=hgt(nx,nz)+0.5;c.m.position.set(c.x,c.y,c.z);WX.blown=(WX.blown||0)+v;
    }
  }

  /* ---------- Every frame ---------- */
  let splashT=0,acc=0;
  function step(dt){
    const s=W.s,kind=W.kind,fine=gfxFine(),rain=kind==='regen'&&s>0.02,sand=kind==='sand'&&s>0.02,blizzard=(kind==='schnee'&&W.storm||sand)&&s>0.02;
    // far islands and horizon mountains have no fog of their own; in thick weather they would float in the haze
    {const far=scene.fog.far>115;if(far!==WX.farShown){WX.farShown=far;for(const r of FARS)r.visible=far;}}
    WX.wind=(kind==='regen'||kind==='schnee'||kind==='asche'||kind==='sand')?s*(W.storm?1:0.45)*(kind==='sand'?1.3:1):0;
    if(DESERT)blowCrates(dt);
    // wet: rises with the rain, dries off slowly afterwards
    const wantWet=kind==='regen'?s:0;WX.wet+=(wantWet-WX.wet)*Math.min(1,dt*(wantWet>WX.wet?0.25:0.035));if(WX.wet<0.003)WX.wet=0;
    for(const o of shiny){o.m.shininess=o.sh+WX.wet*70;o.m.specular.copy(o.sp).lerp(WET_SP,WX.wet*0.75);}
    // puddles
    pM.visible=puddles.length>0&&WX.wet>0.02;
    if(pM.visible){pMat.opacity=Math.min(1,WX.wet*1.4)*0.72;const k=Math.round((0.4+0.6*WX.wet)*20)/20;if(k!==pScale){pScale=k;placePuddles(k);}}
    // streaks
    streaks.visible=rain||blizzard;WX.streaks=0;
    if(streaks.visible){
      const n=Math.floor((fine?SN:SN*0.42)*(blizzard?1:Math.min(1,0.45+s*0.6))),cx=camera.position.x,cz=camera.position.z,cy=Math.min(camera.position.y,22);
      const ux=Math.cos(WX.dir),uz=Math.sin(WX.dir);
      sMat.color.setHex(sand?0xe0bd82:blizzard?0xffffff:0xc9d8ea);sMat.opacity=(sand?0.7:blizzard?0.85:0.55)*Math.min(1,s*1.2);
      for(let i=0;i<n;i++){
        let vx,vy,vz,L;
        if(blizzard){const v=(sand?21:15)+(i%6)*2.2;vx=ux*v;vz=uz*v+Math.sin(gameT*2+i)*1.5;vy=-2.5-(i%4)*0.6;L=0.05;}
        else{const v=24+(i%7);vx=ux*(2+WX.wind*7);vz=uz*(2+WX.wind*7);vy=-v;L=0.03;}
        let x=sp[i*3]+vx*dt,y=sp[i*3+1]+vy*dt,z=sp[i*3+2]+vz*dt;
        if(y<-3||Math.abs(x-cx)>27||Math.abs(z-cz)>27){
          if(blizzard){x=cx+rand(-26,26);z=cz+rand(-26,26);y=rand(-1,cy+2);}
          else{x=cx+rand(-26,26);z=cz+rand(-26,26);y=rand(cy-2,cy+8);}
        }
        sp[i*3]=x;sp[i*3+1]=y;sp[i*3+2]=z;
        // a streak right in front of the lens would show as a huge straight line: those are left out
        const o=i*6,near=(x-cx)*(x-cx)+(z-cz)*(z-cz)<16&&Math.abs(y-camera.position.y)<6,k=near?0:L;
        line[o]=x;line[o+1]=y;line[o+2]=z;line[o+3]=x-vx*k;line[o+4]=y-vy*k;line[o+5]=z-vz*k;
      }
      sGeo.setDrawRange(0,n*2);sGeo.attributes.position.needsUpdate=true;WX.streaks=n;
    }
    // sand veils
    {const on=sand&&W.storm,n=fine?VN:6,cx=camera.position.x,cz=camera.position.z,cy=camera.position.y,ux=Math.cos(WX.dir),uz=Math.sin(WX.dir);
     for(let i=0;i<veils.length;i++){const q=veils[i],vis=on&&i<n;q.m.visible=vis;if(!vis)continue;
       q.x+=ux*12*dt;q.z+=uz*12*dt;
       if(Math.abs(q.x-cx)>32||Math.abs(q.z-cz)>32){q.x=cx-ux*28+rand(-20,20);q.z=cz-uz*28+rand(-20,20);}
       q.m.position.set(q.x,Math.min(cy-2,hgt(q.x,q.z)+2+q.y),q.z);q.m.scale.set(q.s*1.6,q.s*0.8,1);
       q.m.material.opacity=Math.min(1,s*1.2)*(0.22+0.1*Math.sin(gameT*0.8+q.ph));}}
    // rings on water and in puddles
    let live=0;
    if(rain&&fine&&player){
      acc+=dt*s*70;
      while(acc>=1){acc-=1;
        const free=rings.find(r=>r.t>=1);if(!free)break;
        let ok=false;
        for(let k=0;k<4&&!ok;k++){const x=player.x+rand(-22,22),z=player.z+rand(-22,22);
          if(isWater(x,z)){free.x=x;free.z=z;free.y=-1.62;ok=true;}
          else{const p=WX.inPuddle(x,z);if(p){free.x=x;free.z=z;free.y=p.y+0.015;ok=true;}}}
        if(ok)free.t=0;
      }
    }
    rings.forEach((r,i)=>{
      if(r.t<1){r.t+=dt/0.65;live++;}
      const on=r.t<1,k=on?0.25+r.t*1.1:0.001;
      rd.position.set(r.x,r.y,r.z);rd.scale.set(k,1,k);rd.updateMatrix();ringM.setMatrixAt(i,rd.matrix);
      const a=on?(1-r.t)*0.5:0;ringM.setColorAt(i,rc.setRGB(a,a,a*1.05));
    });
    ringM.count=RN;ringM.visible=live>0;ringM.instanceMatrix.needsUpdate=true;if(ringM.instanceColor)ringM.instanceColor.needsUpdate=true;WX.ringsLive=live;
    // vehicles splash through puddles
    splashT-=dt;
    if(splashT<=0&&WX.wet>0.35&&fine){splashT=0.12;
      for(const u of units){if(!u.alive||!isVeh(u)||u.kind==='turm')continue;
        const mv=u._wpx!==undefined&&Math.hypot(u.x-u._wpx,u.z-u._wpz)>0.05;u._wpx=u.x;u._wpz=u.z;
        if(mv&&parts.length<220){const p=WX.inPuddle(u.x,u.z);if(p){puffs(u.x,p.y+0.15,u.z,2,0xcfe0ee,{size:0.45,up:1.8,life:0.5,spread:1,op:0.65});WX.splashes=(WX.splashes||0)+1;}}}
    }
    // lightning bolts, fires and smoke
    for(let i=fires.length-1;i>=0;i--){const f=fires[i],t=f.t;
      if(f.far){f.life-=dt;f.bolt.userData.mat.opacity=f.life>0?(0.6+0.4*Math.sin(f.life*90)):0;if(f.life<=0){dropBolt(f.bolt);fires.splice(i,1);}continue;}
      const top=hgt(t.x,t.z)+2.2;
      if(f.bolt){f.life-=dt;f.bolt.userData.mat.opacity=f.life>0?(0.6+0.4*Math.sin(f.life*90)):0;if(f.life<=0){dropBolt(f.bolt);f.bolt=null;}}
      f.fire-=dt;f.charAt-=dt;if(f.charAt<=0&&!t.charred)charTree(t);
      f.puffT-=dt;
      if(f.fire>0&&f.puffT<=0&&parts.length<230){f.puffT=0.12;
        if(f.fire>1.5)puffs(t.x+rand(-0.4,0.4),top+rand(0,1),t.z+rand(-0.4,0.4),1,Math.random()<0.5?0xffa030:0xffd060,{size:0.55,up:1.6,life:0.5,spread:0.5,op:0.9});
        puffs(t.x,top+1.2,t.z,1,0x4a4642,{size:1.1,up:2.6,life:1.4,spread:0.6,op:0.55});}
      if(f.fire<=0&&!f.bolt)fires.splice(i,1);
    }
  }
  /* ---------- Sound: a steady rain bed, gusty wind in a blizzard, now and then distant thunder ---------- */
  let bed=null,bedT=0,rumbleT=rand(8,16);
  function mkBed(){
    const len=AC.sampleRate*3,buf=AC.createBuffer(1,len,AC.sampleRate),d=buf.getChannelData(0);
    for(let i=0;i<len;i++)d[i]=Math.random()*2-1;
    const mk=(type,f,q)=>{const src=AC.createBufferSource();src.buffer=buf;src.loop=true;const fl=AC.createBiquadFilter();fl.type=type;fl.frequency.value=f;fl.Q.value=q;
      const g=AC.createGain();g.gain.value=0;src.connect(fl);fl.connect(g);g.connect(natureOut||master);src.start(AC.currentTime,Math.random()*2.5);g._f=fl;return g;};
    const b={hiss:mk('bandpass',2400,0.3),patter:mk('lowpass',800,0.4),wind:mk('lowpass',380,0.9)};
    if(DESERT){b.howl=mk('bandpass',620,7);b.howlF=b.howl._f;}
    return b;
  }
  function sounds(dt){
    if(typeof AC==='undefined'||!AC||!master||AC.state!=='running')return;
    if(!bed)bed=mkBed();
    bedT-=dt;if(bedT>0)return;bedT=0.25;
    const on=(state==='play'||state==='pause')&&soundOn,k=state==='pause'?0.4:1,s=W.s,t=AC.currentTime;
    const rain=on&&W.kind==='regen'?s*k:0,blow=on&&(W.kind==='schnee'||W.kind==='sand'||W.storm)?s*k*(W.kind==='schnee'||W.kind==='sand'?(W.storm?1:0.45):0.5):0;
    const gust=0.7+0.3*Math.sin(gameT*0.9)*Math.sin(gameT*0.37+1);
    bed.hiss.gain.setTargetAtTime(rain*0.05,t,0.6);bed.patter.gain.setTargetAtTime(rain*0.07,t,0.6);bed.wind.gain.setTargetAtTime(blow*0.13*gust,t,0.8);
    // the sandstorm howls: a narrow band of wind noise that slides up and down with the gusts
    if(bed.howl){const h=on&&W.kind==='sand'?s*k:0;bed.howl.gain.setTargetAtTime(h*0.11*gust,t,0.7);bed.howlF.frequency.setTargetAtTime(480+320*gust+120*Math.sin(gameT*0.23),t,0.6);}
    // a thunderstorm grumbles in the distance now and then, not all the time
    if(state==='play'&&soundOn&&W.storm&&W.kind==='regen'&&s>0.5){rumbleT-=0.25;
      if(rumbleT<=0){rumbleT=rand(12,30);try{playSound(AC,noiseBuf,'grummeln',rand(0.35,0.6),natureOut||master);}catch(e){}WX.rumbles=(WX.rumbles||0)+1;}}
  }
  const _mood=updateMood;updateMood=function(dt){_mood(dt);try{step(dt);sounds(dt);}catch(e){console.warn(e);}};
})();
