/* Kistenkrawall: Tag, Nacht und Wetter auf allen Karten. Nur Optik und Ton, keine Wirkung aufs Spiel.
   - Die Tageszeit folgt der Spielzeit (gameT): ein Tag dauert 8 Minuten, davon etwa ein Drittel Nacht.
     Im Mehrspieler kennt der Gast die Spielzeit des Hosts, beide sehen also dieselbe Tageszeit.
   - Nachts: Mondlicht, Sterne, eine Laterne am eigenen Blechling, Lichtkegel vor allen Einheiten,
     leuchtende Kisten und Hauptquartiere. Die Lava leuchtet von selbst.
   - Wetter je Karte: Insel Regen und Gewitter, Gebirge Schneesturm mit Nebel, Vulkan Ascheregen.
     Wer rechnet (Einzelspieler, Host), würfelt das Wetter; der Gast bekommt es gemeldet.
   - Schalter im Menü: „Tag, Nacht & Wetter: an/aus“ (gemerkt; ?tagnacht=an|aus). */
'use strict';
const DN={
  on:(function(){
    const q=/[?&#]tagnacht=(an|aus)/i.exec(location.search+location.hash);if(q)return q[1].toLowerCase()==='an';
    try{return localStorage.getItem('kk-dn')!=='0';}catch(e){return true;}
  })(),
  DAY:480,START:0.36,           // seconds per day; a round begins in the morning
  phase:0.36,night:0,dusk:0,    // phase: 0 midnight, 0.25 sunrise, 0.5 noon, 0.75 sunset
  fixed:null,                   // tests: a fixed phase instead of the game clock
  wx:{kind:'klar',s:0,want:'klar',next:rand(70,110),storm:false,flash:0,boltT:0}
};
(function(){
  const C=h=>new THREE.Color(h);
  const N_HOR=C(0x1b2743),N_TOP=C(0x050a1c),N_SUN=C(0x93b2ff),N_HEMI=C(VOLCANO?0x7a4a3c:0x3a4a78);   // the lava lights the volcano's night from below
  const D_HOR=C(0xff9c5e),D_TOP=C(0x54508f),D_SUN=C(0xff8748);
  const GREY=C(0x8b929a),ASH=C(0x5a4a44),tmp=C(0);

  /* ----- Stars ----- */
  const starG=new THREE.BufferGeometry(),sp=[];
  for(let i=0;i<420;i++){const a=srand()*TAU,y=0.08+srand()*0.9,r=Math.sqrt(1-y*y);sp.push(Math.cos(a)*r*270,y*270,Math.sin(a)*r*270);}
  starG.setAttribute('position',new THREE.Float32BufferAttribute(sp,3));
  const stars=new THREE.Points(starG,new THREE.PointsMaterial({color:0xffffff,size:1.6,sizeAttenuation:false,transparent:true,opacity:0,depthWrite:false,fog:false}));
  stars.frustumCulled=false;stars.visible=false;scene.add(stars);

  /* ----- Lights that only show at night. One real lamp (the player's lantern); everything else is a painted glow,
     so the number of lights never changes and nothing has to be recompiled. ----- */
  const lantern=new THREE.PointLight(0xffd9a0,0,17,1.6);scene.add(lantern);
  const glowTex=(function(){const c=document.createElement('canvas');c.width=c.height=64;const g=c.getContext('2d'),r=g.createRadialGradient(32,32,1,32,32,32);
    r.addColorStop(0,'rgba(255,255,255,1)');r.addColorStop(.35,'rgba(255,255,255,.45)');r.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=r;g.fillRect(0,0,64,64);return new THREE.CanvasTexture(c);})();
  const flatG=new THREE.PlaneGeometry(1,1).rotateX(-Math.PI/2);
  const pool=(n,color,flat)=>{const a=[];for(let i=0;i<n;i++){
    const mat=flat?new THREE.MeshBasicMaterial({map:glowTex,color,transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false})
      :new THREE.SpriteMaterial({map:glowTex,color,transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false});
    const m=flat?new THREE.Mesh(flatG,mat):new THREE.Sprite(mat);m.visible=false;m.renderOrder=2;scene.add(m);a.push(m);}return a;};
  const beams=pool(22,0xffe2b0,true),crateGlow=pool(26,0xffffff,false),hqGlow=pool(2,0xffc880,false);
  const COL={blau:C(0x6aa8ff),gelb:C(0xffd24a),gold:C(0xfff0a0)};

  /* ----- Weather particles: one cloud of points that follows the camera ----- */
  const KIND=VOLCANO?'asche':MOUNTAIN?'schnee':(typeof XMAS!=='undefined'&&XMAS)?'dunst':'regen';
  const WN=KIND==='regen'?900:KIND==='asche'?500:0,wGeo=new THREE.BufferGeometry(),wp=new Float32Array(WN*3);
  for(let i=0;i<WN;i++){wp[i*3]=rand(-30,30);wp[i*3+1]=rand(0,26);wp[i*3+2]=rand(-30,30);}
  wGeo.setAttribute('position',new THREE.BufferAttribute(wp,3));
  const wPts=new THREE.Points(wGeo,new THREE.PointsMaterial(KIND==='regen'
    ?{color:0xd6e6f8,size:0.17,transparent:true,opacity:0,depthWrite:false}
    :{color:0x3a3432,size:0.2,transparent:true,opacity:0,depthWrite:false}));
  wPts.frustumCulled=false;wPts.visible=false;scene.add(wPts);
  const baseFog={near:scene.fog.near,far:scene.fog.far};

  function sound(kind,vol){
    if(!AC||!soundOn||state!=='play'||AC.state!=='running'||typeof SND[kind]!=='function')return;
    try{playSound(AC,noiseBuf,kind,vol,master);}catch(e){}
  }
  function setWeather(kind,storm){
    const W=DN.wx;W.want=kind;W.storm=!!storm;
    if(kind!=='klar')W.kind=kind;
    if(DN.on&&state==='play'&&kind!=='klar')toast(storm?'Ein Gewitter zieht auf':kind==='regen'?'Es fängt an zu regnen':kind==='schnee'?'Ein Schneesturm zieht auf':kind==='asche'?'Asche regnet vom Himmel':'Nebel zieht auf',2.4);
  }
  window.dayNightEvent=e=>{if(e[0]==='wx'){const k=['klar','regen','schnee','asche','dunst'][e[1]]||'klar';if(DN.wx.want!==k||DN.wx.storm!==!!e[2])setWeather(k,e[2]);}};

  let lastNight=false,sendT=0,rainT=0,lastT=0;
  function step(dt){
    const W=DN.wx,sim=MP!=='guest',playing=state==='play';
    /* time of day */
    const want=DN.fixed!==null?DN.fixed:(DN.on&&state!=='menu'?(gameT/DN.DAY+DN.START)%1:DN.START);
    let d=want-DN.phase;if(d>0.5)d-=1;if(d<-0.5)d+=1;
    DN.phase=(DN.phase+d*Math.min(1,dt*1.5)+1)%1;
    const p=DN.phase,el=Math.sin((p-0.25)*TAU)+0.38;      // sun height; the offset makes the day longer than the night
    const night=DN.night=smooth((0.02-el)/0.34),dusk=DN.dusk=Math.max(0,1-Math.abs(el-0.12)/0.4)*(1-night*0.6);
    if(playing&&DN.on&&DN.fixed===null){if(night>0.5&&!lastNight)toast('Die Nacht bricht an',2.2);if(night<0.5&&lastNight)toast('Der Morgen dämmert',2.2);}
    lastNight=night>0.5;

    /* weather: who computes the game rolls it, the guest is told */
    if(gameT<lastT){W.want='klar';W.storm=false;W.next=rand(70,110);}   // a new round
    lastT=gameT;
    if(sim&&playing&&DN.fixed===null){
      W.next-=dt;
      if(W.next<=0){
        if(W.want==='klar'){setWeather(KIND,KIND==='regen'&&Math.random()<0.5);W.next=rand(45,75);}
        else{setWeather('klar',false);W.next=rand(80,130);}
      }
      sendT-=dt;if(MP==='host'&&sendT<=0){sendT=4;NET.pendingEv.push(['wx',Math.max(0,['klar','regen','schnee','asche','dunst'].indexOf(W.want)),W.storm?1:0]);}
    }
    const target=DN.on&&W.want!=='klar'?1:0;
    W.s+=(target-W.s)*Math.min(1,dt*0.25);if(W.s<0.01&&target===0)W.s=0;
    const s=W.s,kind=W.kind;

    /* lightning */
    W.flash=Math.max(0,W.flash-dt*3.2);
    if(W.storm&&s>0.6&&playing){W.boltT-=dt;if(W.boltT<=0){W.boltT=rand(5,12);W.flash=1;setTimeout(()=>sound('donner',0.9),rand(250,1100));}}
    if(kind==='regen'&&s>0.3&&playing){rainT-=dt;if(rainT<=0){rainT=1.05;sound('regen',0.5*s);}}

    /* sun or moon: direction, colour, strength */
    // The light moves in small steps (every 2.5 s of game time), not every frame: a light that turns
    // continuously makes every shadow edge crawl and flicker.
    const day=1-night,ps=DN.fixed!==null?p:Math.round(p*192)/192,els=Math.sin((ps-0.25)*TAU)+0.38,
      az=(ps-0.5)*2.6+0.63,h=night>0.5?0.72:Math.max(0.32,Math.min(1,els));
    SUN_OFF.set(Math.cos(az)*38*(1.25-h*0.5),16+h*26,Math.sin(az)*38*(1.25-h*0.5));
    sky.material.uniforms.sunDir.value.copy(SUN_OFF).normalize();
    const dim=1-0.3*s*(kind==='dunst'?0.5:1);
    sun.color.lerp(D_SUN,dusk*0.75).lerp(N_SUN,night);sun.intensity=sun.intensity*(day+night*0.34)*dim+W.flash*1.4;
    hemi.color.lerp(N_HEMI,night*0.85);hemi.intensity=hemi.intensity*(day+night*(VOLCANO?0.8:0.6))*dim+W.flash*0.9;
    /* sky and haze */
    tmp.copy(scene.fog.color).lerp(D_HOR,dusk*0.6).lerp(N_HOR,night);
    if(s>0)tmp.lerp(kind==='asche'?ASH:GREY,s*0.55*(1-night*0.5));
    if(W.flash>0)tmp.lerp(C(0xdfe8ff),W.flash*0.7);
    scene.fog.color.copy(tmp);scene.background.copy(tmp);sky.material.uniforms.hor.value.copy(tmp);
    const top=sky.material.uniforms.top.value;top.lerp(D_TOP,dusk*0.55).lerp(N_TOP,night);if(s>0)top.lerp(kind==='asche'?ASH:GREY,s*0.6*(1-night*0.6));
    const fogK=kind==='schnee'||kind==='dunst'?0.72:kind==='asche'?0.5:0.4;
    scene.fog.near=baseFog.near*(1-s*fogK);scene.fog.far=baseFog.far*(1-s*fogK*0.75);
    stars.visible=night>0.02;stars.material.opacity=night*(1-s*0.8);
    window.wxWind=1+(kind==='schnee'?s*2.4:0);            // mountain.js blows its snow harder

    /* weather particles */
    wPts.visible=s>0.02&&WN>0&&(kind==='regen'||kind==='asche');
    if(wPts.visible){
      wPts.material.opacity=(kind==='regen'?0.75:0.8)*s;
      const A=wp,cx=camera.position.x,cy=camera.position.y,cz=camera.position.z,n=typeof gfxFine==='function'&&!gfxFine()?WN>>1:WN,rain=kind==='regen';
      wGeo.setDrawRange(0,n);
      for(let i=0;i<n;i++){
        if(rain){A[i*3+1]-=dt*(26+(i%6));A[i*3]+=dt*4;}
        else{A[i*3+1]-=dt*(1.6+(i%5)*0.25);A[i*3]+=dt*(1.2+Math.sin(i+gameT)*0.8);A[i*3+2]+=dt*Math.cos(i*1.7+gameT*0.6)*0.7;}
        if(A[i*3+1]<cy-12||Math.abs(A[i*3]-cx)>30||Math.abs(A[i*3+2]-cz)>30){A[i*3]=cx+rand(-30,30);A[i*3+1]=cy+rand(2,16);A[i*3+2]=cz+rand(-30,30);}
      }
      wGeo.attributes.position.needsUpdate=true;
    }

    /* night lights */
    const lit=night>0.05&&state!=='menu';
    lantern.intensity=lit&&player&&player.alive?night*(MOUNTAIN||(typeof XMAS!=='undefined'&&XMAS&&!VOLCANO)?0.5:0.85):0;   // snow reflects far more light than grass
    if(lit&&player)lantern.position.set(player.x,hgt(player.x,player.z)+2.4,player.z);
    let bi=0,ci=0;
    if(lit){
      for(const u of units){if(bi>=beams.length)break;if(!u.alive||u.kind==='turm')continue;
        const b=beams[bi++],r=isVeh(u)?2.6:1.5,fx=u.x+Math.sin(u.h)*r,fz=u.z+Math.cos(u.h)*r;
        b.visible=true;b.position.set(fx,hgt(fx,fz)+0.09,fz);b.scale.set(r*2.4,1,r*2.4);b.material.opacity=night*(u===player?0.5:0.3);}
      for(const c of crates){if(ci>=crateGlow.length)break;if(c.state!=='ground'&&c.state!=='fall')continue;
        const g=crateGlow[ci++];g.visible=true;g.position.set(c.x,c.y+0.7,c.z);g.scale.setScalar(c.gold?3.4:2.4);g.material.color.copy(c.gold?COL.gold:COL[c.sort]||COL.blau);g.material.opacity=night*(c.gold?0.75:0.5);}
      hqs.forEach((q,i)=>{const g=hqGlow[i];g.visible=!q.dead;g.position.set(q.x,hgt(q.x,q.z)+2.6,q.z);g.scale.setScalar(9);g.material.opacity=night*0.45;});
    }else hqGlow.forEach(g=>g.visible=false);
    for(;bi<beams.length;bi++)beams[bi].visible=false;
    for(;ci<crateGlow.length;ci++)crateGlow[ci].visible=false;
  }
  // runs right after the map's own light mood, every frame the game updates
  const _mood=updateMood;
  updateMood=function(dt){_mood(dt);step(dt);};

  /* ----- Menu switch ----- */
  const btn=$('#dnToggle');
  const label=()=>{if(btn){btn.textContent='Tag, Nacht & Wetter: '+(DN.on?'an':'aus');btn.setAttribute('aria-pressed',DN.on?'true':'false');}};
  if(btn)btn.addEventListener('click',()=>{DN.on=!DN.on;try{localStorage.setItem('kk-dn',DN.on?'1':'0');}catch(e){}label();});
  label();
  DN.step=step;DN.setWeather=setWeather;DN.lights={lantern,beams,crateGlow,hqGlow,stars,wPts};DN.kind=KIND;
})();
