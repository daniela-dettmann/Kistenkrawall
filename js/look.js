/* Kistenkrawall: mehr Tiefe und mehr Leben, auf allen Karten (lädt nach gfx.js und daynight.js).
   - Lichtsaum an Blechlingen und Fahrzeugen (nur „Hoch“), Metallglanz mit Spiegelung des Himmels.
   - Wind in Bäumen und Büschen (bei Sturm stärker), Wolkenschatten über der Karte, Morgennebel in Senken.
   - Spuren in Schnee und Asche, Spritzer im Wasser, Mündungsfeuer, Explosionen mit Feuerball, Rauch und Glut.
   Alles nur Optik; im Mehrspieler zeichnet jedes Gerät die Effekte selbst. */
'use strict';
const LOOK={rim:{value:0.36},rimC:{value:new THREE.Color(0xffd9a8)},wind:{value:1},day:{value:1},cloud:{value:0.2},prints:0};
(function(){
  const glowTex=(function(){const c=document.createElement('canvas');c.width=c.height=64;const g=c.getContext('2d'),r=g.createRadialGradient(32,32,1,32,32,32);
    r.addColorStop(0,'rgba(255,255,255,1)');r.addColorStop(.3,'rgba(255,255,255,.55)');r.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=r;g.fillRect(0,0,64,64);return new THREE.CanvasTexture(c);})();
  const noiseTex=(function(){const S=128,n=fbm(S,[64,32,16]),c=document.createElement('canvas');c.width=c.height=S;const g=c.getContext('2d'),id=g.createImageData(S,S);
    for(let i=0;i<S*S;i++){const v=Math.round(n[i]*255);id.data[i*4]=id.data[i*4+1]=id.data[i*4+2]=v;id.data[i*4+3]=255;}g.putImageData(id,0,0);
    const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;return t;})();

  /* ---------- Metal and paint reflect the sky; the reflection follows the time of day ---------- */
  const envRT=new THREE.WebGLCubeRenderTarget(64,{generateMipmaps:true,minFilter:THREE.LinearMipmapLinearFilter});
  const cubeCam=new THREE.CubeCamera(1,1000,envRT),envScene=new THREE.Scene();
  envScene.add(new THREE.Mesh(sky.geometry,sky.material));
  let envT=0;const envUpdate=()=>{try{cubeCam.update(renderer,envScene);}catch(e){}};envUpdate();
  const shine=(m,how)=>{
    if(!m||!m.isMeshPhongMaterial||m.userData.kkEnv)return;m.userData.kkEnv=true;
    m.envMap=envRT.texture;
    if(how==='metal'){m.combine=THREE.MixOperation;m.reflectivity=0.3;}else{m.combine=THREE.AddOperation;m.reflectivity=0.1;}
    m.needsUpdate=true;
  };
  shine(M.metal,'metal');
  /* ---------- Rim light: units stand out from the ground ---------- */
  const rim=m=>{
    if(!m||!m.isMeshPhongMaterial||m.userData.kkRim)return;m.userData.kkRim=true;
    gfxChain(m,sh=>{
      sh.uniforms.uRim=LOOK.rim;sh.uniforms.uRimC=LOOK.rimC;
      sh.fragmentShader='uniform float uRim;uniform vec3 uRimC;\n'+sh.fragmentShader.replace('#include <tonemapping_fragment>',
        `{float kkR=pow(1.0-clamp(dot(normalize(normal),normalize(vViewPosition)),0.0,1.0),2.6);gl_FragColor.rgb+=uRimC*kkR*uRim;}
        #include <tonemapping_fragment>`);
    },'rim');
  };
  const dress=u=>{
    if(!u||!u.bot||!u.bot.g)return;
    shine(u.bot.paint,'paint');shine(u.bot.head,'paint');
    u.bot.g.traverse(o=>{if(o.isMesh&&!Array.isArray(o.material))rim(o.material);});
  };
  {const _spawn=spawnUnit;spawnUnit=function(){const u=_spawn.apply(this,arguments);try{dress(u);}catch(e){console.warn(e);}return u;};}
  for(const u of units)dress(u);

  /* ---------- Wind: trees, bushes and palms sway; the trunk stays put, the crown moves ---------- */
  const swayMats=new Set([...leafPal,...pineMat,trunkMat,charMat]);
  scene.traverse(o=>{if(o.isInstancedMesh&&o.material&&o.material.userData&&o.material.userData.sway)swayMats.add(o.material);});
  for(const m of swayMats)gfxChain(m,sh=>{
    sh.uniforms.uHgt={value:hgtTex};sh.uniforms.uWind=LOOK.wind;sh.uniforms.uTime=timeU;
    sh.vertexShader='uniform sampler2D uHgt;uniform float uWind;\n'+(/uniform float uTime/.test(sh.vertexShader)?'':'uniform float uTime;\n')+HGT_GLSL+
      sh.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
      {vec4 kkW=modelMatrix*vec4(transformed,1.0);
       #ifdef USE_INSTANCING
       kkW=modelMatrix*instanceMatrix*vec4(transformed,1.0);
       #endif
       float kkA=clamp((kkW.y-kkHgt(kkW.xz)-0.8)/3.0,0.0,1.0)*0.055*uWind;
       float kkP=uTime*1.5+kkW.x*0.35+kkW.z*0.28;
       transformed.x+=sin(kkP)*kkA;transformed.z+=cos(kkP*0.8)*kkA*0.6;}`);
  },'sway');

  /* ---------- Cloud shadows drift over the map ---------- */
  // The cloud meshes in the sky used to cast real shadows: hard dark blots that looked like stains on the water and
  // cost about 80 extra draw calls in every shadow pass. The soft shadows below replace them.
  if(typeof clouds!=='undefined')for(const c of clouds)c.traverse(o=>{if(o.isMesh)o.castShadow=false;});
  scene.traverse(o=>{
    if(!o.isMesh||!o.material||o.material.map!==TX.ground||!o.geometry.attributes.color)return;
    gfxChain(o.material,sh=>{
      sh.uniforms.uCloud={value:noiseTex};sh.uniforms.uCloudK=LOOK.cloud;sh.uniforms.uTime=timeU;
      sh.fragmentShader='uniform sampler2D uCloud;uniform float uCloudK;\n'+(/uniform float uTime/.test(sh.fragmentShader)?'':'uniform float uTime;\n')+
        sh.fragmentShader.replace('#include <map_fragment>',`#include <map_fragment>
        {float kkC=texture2D(uCloud,vKkG.xz*0.007+vec2(uTime*0.004,uTime*0.0025)).r;diffuseColor.rgb*=1.0-uCloudK*smoothstep(0.45,0.72,kkC);}`);
    },'clouds');
  });

  /* ---------- Morning mist in low places (island and mountain) ---------- */
  let mist=null;
  if(!VOLCANO){
    const m=new THREE.MeshBasicMaterial({map:noiseTex,color:0xffffff,transparent:true,opacity:0,depthWrite:false,fog:true});
    noiseTex.repeat.set(1,1);
    mist=new THREE.Mesh(new THREE.PlaneGeometry(172,172,1,1).rotateX(-Math.PI/2),m);mist.position.y=MOUNTAIN?0.45:-1.0;mist.renderOrder=3;mist.visible=false;scene.add(mist);
    // The mist is a flat sheet. Where a slope cuts through it, it used to end in a hard straight edge (seen on the
    // iPhone as a speckled patch). It now thins out over the last 0.8 units above the ground, so it only lies in the
    // low places, with soft edges.
    const mY=mist.position.y;
    gfxChain(m,sh=>{
      sh.uniforms.uHgt={value:hgtTex};
      sh.vertexShader='varying vec2 vKkM;\n'+sh.vertexShader.replace('#include <project_vertex>','vKkM=(modelMatrix*vec4(transformed,1.0)).xz;\n#include <project_vertex>');
      sh.fragmentShader='uniform sampler2D uHgt;varying vec2 vKkM;\n'+HGT_GLSL+sh.fragmentShader.replace('#include <fog_fragment>',
        'gl_FragColor.a*=smoothstep(0.0,0.8,'+mY.toFixed(2)+'-kkHgt(vKkM));\n#include <fog_fragment>');
    },'mistEdge');
  }

  /* ---------- Footprints in snow and ash, tracks behind vehicles ---------- */
  const snowy=VOLCANO;   // ash only: snow maps press their tracks into the snow itself (snow.js)
  const PN=260,printMat=new THREE.MeshBasicMaterial({color:VOLCANO?0x1e1817:0x6e7f99,transparent:true,opacity:VOLCANO?0.4:0.3,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-3,polygonOffsetUnits:-3});
  const prints=new THREE.InstancedMesh(new THREE.CircleGeometry(0.11,8).rotateX(-Math.PI/2),printMat,PN),pd=new THREE.Object3D(),plife=new Float32Array(PN),pscale=new Float32Array(PN);
  prints.frustumCulled=false;prints.renderOrder=1;let pi=0;
  for(let i=0;i<PN;i++){pd.scale.setScalar(0);pd.updateMatrix();prints.setMatrixAt(i,pd.matrix);}
  scene.add(prints);prints.visible=snowy;
  const ppos=new Float32Array(PN*3),prot=new Float32Array(PN);
  function stamp(x,z,rot,sx,sz){
    const h=hgtRaw(x,z);if(h<-0.5||onBridge(x,z)||onPlatform(x,z))return;
    const i=pi=(pi+1)%PN;plife[i]=9;pscale[i]=sx;ppos[i*3]=x;ppos[i*3+1]=hgt(x,z)+0.03;ppos[i*3+2]=z;prot[i]=rot;
    pd.position.set(x,ppos[i*3+1],z);pd.rotation.set(0,rot,0);pd.scale.set(sx,1,sz);pd.updateMatrix();prints.setMatrixAt(i,pd.matrix);prints.instanceMatrix.needsUpdate=true;LOOK.prints++;
  }
  let stepT=0;
  function printStep(dt){
    if(!snowy||!gfxFine()||state!=='play'||SNOW.trails===false)return;
    stepT-=dt;if(stepT>0)return;stepT=0.16;
    const cx=camera.position.x,cz=camera.position.z;
    for(const u of units){
      if(!u.alive||u.kind==='turm')continue;
      const mv=u._lpx!==undefined&&Math.hypot(u.x-u._lpx,u.z-u._lpz)>0.02;u._lpx=u.x;u._lpz=u.z;   // u.moving is reset every frame
      if(!mv||Math.hypot(u.x-cx,u.z-cz)>45)continue;
      u._pT=(u._pT||0)-0.16;if(u._pT>0)continue;
      const a=isVeh(u)?(u.hull||0):u.h,rx=Math.cos(a),rz=-Math.sin(a);
      if(isVeh(u)){u._pT=0.2;const w=(u.r||1)*0.75;for(const s of [-1,1])stamp(u.x+rx*w*s,u.z+rz*w*s,a,2.4,3.2);}
      else{u._pT=0.32;u._pS=-(u._pS||1);stamp(u.x+rx*0.16*u._pS,u.z+rz*0.16*u._pS,a,1.6,2.4);}
    }
    // fade by shrinking; the whole buffer is rewritten at most once per step
    let dirty=false;
    for(let i=0;i<PN;i++){if(plife[i]<=0)continue;plife[i]-=0.16;const k=Math.max(0,Math.min(1,plife[i]/3));
      if(plife[i]<3){pd.position.set(ppos[i*3],ppos[i*3+1],ppos[i*3+2]);pd.rotation.set(0,prot[i],0);pd.scale.set(pscale[i]*k,1,pscale[i]*(pscale[i]>2?1.33:1.5)*k);pd.updateMatrix();prints.setMatrixAt(i,pd.matrix);dirty=true;}}
    if(dirty)prints.instanceMatrix.needsUpdate=true;
  }

  /* ---------- Sprites for flashes, fireballs and splashes ---------- */
  const flashMat=c=>new THREE.SpriteMaterial({map:glowTex,color:c,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,opacity:1});
  function glowAt(x,y,z,color,size,life){
    if(parts.length>240)return;
    const s=new THREE.Sprite(flashMat(color));s.position.set(x,y,z);s.scale.setScalar(0.3);scene.add(s);
    parts.push({m:s,vx:0,vy:0,vz:0,life,max:life,boom:size});
  }
  // splashes: water.js
  /* muzzle flash */
  {const _fire=fire;
   fire=function(u,ang){
     const ok=_fire.apply(this,arguments);
     if(ok&&gfxFine()&&u&&u.alive&&Math.hypot(u.x-camera.position.x,u.z-camera.position.z)<50){
       const V=isVeh(u)?VEH[u.kind]:null,f=V?(V.muzzle||1.6):0.75,y=hgt(u.x,u.z)+(V?1.3:1.05);
       glowAt(u.x+Math.sin(ang)*f,y,u.z+Math.cos(ang)*f,u.team?0x9ff2ff:0xffd27a,V?1.4:0.7,0.07);
     }
     return ok;
   };}
  /* explosions: a fireball, a rising column of smoke, glowing embers */
  const emberG=new THREE.BoxGeometry(0.09,0.09,0.09),emberM=new THREE.MeshBasicMaterial({color:0xffa040});
  {const _boom=boom;
   boom=function(x,z,size){
     _boom(x,z,size);
     if(!gfxFine()||parts.length>230)return;
     const gy=hgt(x,z);
     glowAt(x,gy+1.1,z,0xff9a3a,2.2+size*1.1,0.32);
     puffs(x,gy+1.2,z,Math.min(6,2+Math.round(size)),0x3c3836,{size:1.3,grow:1.3,life:2.6,spread:0.7,up:1.1,op:0.5});
     for(let i=0;i<Math.min(7,3+Math.round(size));i++){
       const m=new THREE.Mesh(emberG,emberM);m.position.set(x,gy+0.6,z);scene.add(m);
       const a=Math.random()*TAU,v=rand(2.5,5.5);
       parts.push({m,vx:Math.cos(a)*v,vy:rand(4,8),vz:Math.sin(a)*v,life:rand(0.9,1.5),max:1.5,debris:true,grav:12,solid:true});
     }
   };}

  /* ---------- Contact shadows: soft dark blobs under units, vehicles and crates ----------
     Units and vehicles already had a flat black disc. It now has a soft edge, is a little larger and darker in the
     middle, so everything stands on the ground instead of hovering. Crates get the same, smaller when they fall. */
  const blobTex=(function(){const c=document.createElement('canvas');c.width=c.height=64;const g=c.getContext('2d'),r=g.createRadialGradient(32,32,1,32,32,32);
    r.addColorStop(0,'rgba(0,0,0,1)');r.addColorStop(.45,'rgba(0,0,0,.75)');r.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=r;g.fillRect(0,0,64,64);return new THREE.CanvasTexture(c);})();
  Object.assign(M.blob,{map:blobTex,opacity:0.55,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2});M.blob.needsUpdate=true;
  G.blob.scale(1.35,1,1.35);
  const CB=160,cblob=new THREE.InstancedMesh(new THREE.CircleGeometry(0.85,20).rotateX(-Math.PI/2),M.blob,CB),cbd=new THREE.Object3D();
  cblob.frustumCulled=false;cblob.renderOrder=1;cblob.count=0;scene.add(cblob);LOOK.crateBlobs=cblob;
  function crateShadows(){
    let n=0;
    for(const c of crates){
      if(n>=CB)break;if(c.state!=='ground'&&c.state!=='fall')continue;
      const gy=hgt(c.x,c.z),up=Math.max(0,c.y-gy-0.5),k=Math.max(0.25,1-up/14);
      cbd.position.set(c.x,gy+0.035,c.z);cbd.rotation.set(0,0,0);cbd.scale.set(k,1,k);cbd.updateMatrix();cblob.setMatrixAt(n++,cbd.matrix);
    }
    cblob.count=n;cblob.instanceMatrix.needsUpdate=true;
  }

  /* ---------- Per frame: time of day, weather and the switch ---------- */
  const _mood=updateMood;
  updateMood=function(dt){
    _mood(dt);
    const fine=gfxFine(),dn=typeof DN!=='undefined'?DN:null,night=dn?dn.night:0,W=dn?dn.wx:{s:0,kind:'klar',storm:false};
    LOOK.day.value=1-night;
    // warm rim light on units and vehicles (Auftrag Grafik-Upgrade, Schritt 3); a little softer on „Niedrig“, a little cooler at night
    LOOK.rim.value=fine?0.36:0.22;LOOK.rimC.value.setRGB(1-night*0.3,0.85-night*0.12,0.62+night*0.25);
    LOOK.wind.value=1+W.s*(W.storm?1.8:W.kind==='schnee'?1.4:W.kind==='regen'?0.8:0.4);
    LOOK.cloud.value=(0.15+W.s*0.08)*(1-night);
    // morning mist: strongest around sunrise, gone by mid-morning
    const ph=dn?dn.phase:0.4,dawn=dn&&dn.on?Math.max(0,1-Math.abs(ph-0.26)/0.07):0;
    if(mist){mist.visible=dawn>0.01;mist.material.opacity=dawn*(MOUNTAIN?0.4:0.65);mist.material.color.copy(scene.fog.color);}
    if(dawn>0){scene.fog.near*=1-0.35*dawn;scene.fog.far*=1-0.3*dawn;}
    envT-=dt;if(envT<=0){envT=3;envUpdate();}
    printStep(dt);
    crateShadows();
  };
})();
