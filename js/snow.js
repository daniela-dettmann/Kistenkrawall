/* Kistenkrawall: Schnee (Gebirge und Weihnachtsedition auf Insel). Auftrag Grafik-Upgrade, Schritt 2.
   - Spurenkarte: eine 512er-Textur über das Spielfeld (256 auf „Niedrig“). Blechlinge stempeln bei jedem Schritt einen
     Fußabdruck hinein, Fahrzeuge zwei durchgehende Rillen. Alle 0,2 Sekunden wird die Karte ein wenig aufgehellt,
     nach gut 25 Sekunden ist eine Spur wieder zugeschneit.
   - Der Boden liest die Karte: Abdrücke sind dunkler und bläulich, haben einen hellen Rand und kippen das Licht wie
     eine Mulde (über die Normalen; das Gelände ist für echtes Absenken zu grob).
   - Schneeverwehungen an Bäumen, Felsen, Sandsäcken, am Hauptquartier, in Senken und auf tiefen Schneefeldern
     (snowCover in xmas.js: mal liegt viel Schnee, mal nur eine dünne Schicht, durch die das Gras schaut). Wer hindurchläuft oder fährt,
     wird leicht gebremst (auf 82 %), und es staubt.
   - Schneehauben auf Kisten, Felsen und Sandsäcken. Leichter Schneestaub an den Füßen beim Laufen. */
'use strict';
const SNOW={on:MOUNTAIN||(typeof XMAS!=='undefined'&&XMAS&&!VOLCANO),drifts:[],stamps:0,slow:0.82};
// settings › Grafik › „Spuren im Schnee“ (also the ash prints on the volcano, look.js)
SNOW.trails=(function(){try{return localStorage.getItem('kk-trails')!=='0';}catch(e){return true;}})();
if(SNOW.on)(function(){
  const H=56;   // the trail map covers -56..56 in x and z
  const snowCol=new THREE.Color(MOUNTAIN?0xf3f6fb:0xffffff);

  /* ---------- Trail map ---------- */
  const trailScene=new THREE.Scene(),trailCam=new THREE.OrthographicCamera(-H,H,H,-H,-1,1);
  let rt=null,R=0;
  const U={uTrail:{value:null},uTrailH:{value:H},uTrailPx:{value:1/512}};
  function makeRT(){
    const want=gfxFine()?512:256;if(rt&&R===want)return;
    if(rt)rt.dispose();R=want;
    rt=new THREE.WebGLRenderTarget(R,R,{minFilter:THREE.LinearFilter,magFilter:THREE.LinearFilter,format:THREE.RGBAFormat,depthBuffer:false,stencilBuffer:false});
    U.uTrail.value=rt.texture;U.uTrailPx.value=1/R;
    const prev=renderer.getRenderTarget(),cc=renderer.getClearColor(new THREE.Color()),ca=renderer.getClearAlpha();
    renderer.setRenderTarget(rt);renderer.setClearColor(0x000000,1);renderer.clear(true,false,false);
    renderer.setClearColor(cc,ca);renderer.setRenderTarget(prev);
  }
  makeRT();SNOW.target=()=>rt;
  SNOW.clearTrails=()=>{if(rt){rt.dispose();rt=null;R=0;makeRT();}};
  // fading: subtract a little from every texel (dst - src)
  const fade=new THREE.Mesh(new THREE.PlaneGeometry(2*H,2*H),new THREE.MeshBasicMaterial({color:new THREE.Color(2/255,2/255,2/255),
    blending:THREE.CustomBlending,blendEquation:THREE.ReverseSubtractEquation,blendSrc:THREE.OneFactor,blendDst:THREE.OneFactor,depthTest:false,depthWrite:false,toneMapped:false}));
  fade.frustumCulled=false;
  // stamps: the deeper value wins (max), so overlapping steps do not add up
  const footTex=(function(){const c=document.createElement('canvas');c.width=c.height=32;const g=c.getContext('2d'),r=g.createRadialGradient(16,16,2,16,16,16);
    r.addColorStop(0,'rgb(255,255,255)');r.addColorStop(.55,'rgb(220,220,220)');r.addColorStop(1,'rgb(0,0,0)');g.fillStyle=r;g.fillRect(0,0,32,32);return new THREE.CanvasTexture(c);})();
  const SN=96,stampMesh=new THREE.InstancedMesh(new THREE.PlaneGeometry(1,1),new THREE.MeshBasicMaterial({map:footTex,
    blending:THREE.CustomBlending,blendEquation:THREE.MaxEquation,blendSrc:THREE.OneFactor,blendDst:THREE.OneFactor,depthTest:false,depthWrite:false,toneMapped:false}),SN);
  stampMesh.frustumCulled=false;trailScene.add(stampMesh);
  const fadeScene=new THREE.Scene();fadeScene.add(fade);
  const sd=new THREE.Object3D();let sn=0;
  // the trail scene lies in the x/y plane: x = world x, y = world z
  function stamp(x,z,rot,w,l){
    if(!SNOW.trails||sn>=SN||Math.abs(x)>H||Math.abs(z)>H)return;
    if(onBridge(x,z)||onPlatform(x,z)||hgtRaw(x,z)<-0.6)return;
    sd.position.set(x,z,0);sd.rotation.set(0,0,-rot);sd.scale.set(w,l,1);sd.updateMatrix();stampMesh.setMatrixAt(sn++,sd.matrix);SNOW.stamps++;
  }
  let fadeT=0;
  function drawTrail(dt){
    const prev=renderer.getRenderTarget(),ac=renderer.autoClear;renderer.autoClear=false;renderer.setRenderTarget(rt);
    fadeT+=dt;if(fadeT>=0.2){fadeT=0;renderer.render(fadeScene,trailCam);}
    if(sn){stampMesh.count=sn;stampMesh.instanceMatrix.needsUpdate=true;renderer.render(trailScene,trailCam);sn=0;}
    renderer.setRenderTarget(prev);renderer.autoClear=ac;
  }

  /* ---------- The ground reads the trail map ---------- */
  scene.traverse(o=>{
    if(!o.isMesh||!o.material||o.material.map!==TX.ground||!o.geometry.attributes.color)return;
    gfxChain(o.material,sh=>{
      Object.assign(sh.uniforms,U);
      sh.fragmentShader='uniform sampler2D uTrail;uniform float uTrailH;uniform float uTrailPx;\n'+sh.fragmentShader
        .replace('#include <map_fragment>',`#include <map_fragment>
          vec2 kkTU=vKkG.xz/(2.0*uTrailH)+0.5;
          float kkT=texture2D(uTrail,kkTU).r;
          float kkTb=(texture2D(uTrail,kkTU+vec2(uTrailPx*2.5,0.0)).r+texture2D(uTrail,kkTU-vec2(uTrailPx*2.5,0.0)).r
                     +texture2D(uTrail,kkTU+vec2(0.0,uTrailPx*2.5)).r+texture2D(uTrail,kkTU-vec2(0.0,uTrailPx*2.5)).r)*0.25;
          diffuseColor.rgb=mix(diffuseColor.rgb,diffuseColor.rgb*vec3(0.42,0.52,0.72),clamp(kkT*1.6,0.0,1.0)*0.9);
          diffuseColor.rgb+=vec3(0.14,0.14,0.15)*clamp((kkTb-kkT)*2.0,0.0,1.0);`)
        .replace('#include <normal_fragment_maps>',`#include <normal_fragment_maps>
          {float kkX=texture2D(uTrail,kkTU+vec2(uTrailPx,0.0)).r-texture2D(uTrail,kkTU-vec2(uTrailPx,0.0)).r;
           float kkZ=texture2D(uTrail,kkTU+vec2(0.0,uTrailPx)).r-texture2D(uTrail,kkTU-vec2(0.0,uTrailPx)).r;
           normal=normalize(normal+(viewMatrix*vec4(kkX*4.0,0.0,kkZ*4.0,0.0)).xyz);}`);
    },'trail');
  });

  /* ---------- Drifts and caps: one instanced mesh of snow domes ---------- */
  // a soft hump instead of a half sphere: it meets the ground flat, so there is no hard white rim that reads as a disc
  const domeG=new THREE.LatheGeometry([...Array(9)].map((_,i)=>{const r=1-i/8;return new THREE.Vector2(Math.max(r,0.0001),(1-r*r)*(1-r*r));}),18);
  domeG.computeVertexNormals();
  const snowMat2=new THREE.MeshPhongMaterial({color:snowCol,map:TX.ground,specular:0x111111,shininess:8});
  const domes=[],add=(x,y,z,sx,sy,sz,ry,drift)=>{domes.push({x,y,z,sx,sy,sz,ry});if(drift)SNOW.drifts.push({x,z,r:Math.max(sx,sz)*0.85});};
  const ok=(x,z)=>Math.abs(x)<LIM&&Math.abs(z)<LIM&&hgtRaw(x,z)>-0.6&&!onBridge(x,z)&&!onPlatform(x,z)&&pathDist(x,z)>1.6&&!pads.some(p=>Math.hypot(p.x-x,p.z-z)<2.6);
  for(const b of obstacles){
    if(b.low){
      // sandbags: a cap on top, every second bag a drift on the lee side
      const top=hgt(b.x,b.z)+0.62;add(b.x+0.2,top,b.z,0.62,0.13,0.42,0,false);
      if(Math.round(b.x/0.85)%2===0&&ok(b.x+0.2,b.z+0.6))add(b.x+0.2,hgt(b.x+0.2,b.z+0.6)-0.04,b.z+0.6,0.9,0.24,0.6,0,true);
    }else if(b.r<3){
      const lee={x:b.x+(b.r+0.45),z:b.z+0.3};
      if(ok(lee.x,lee.z))add(lee.x,hgt(lee.x,lee.z)-0.05,lee.z,b.r*1.1+0.6,0.4,b.r*0.9+0.5,0.4,true);
      if(Math.abs(b.r-0.6)>0.01){const s=b.r/0.95,top=hgt(b.x,b.z)+s*1.02;add(b.x,top,b.z,s*0.72,s*0.2,s*0.72,0,false);}   // a rock (trees have r 0.6)
    }
  }
  for(const q of hqs)for(const [dx,dz] of [[2.6,2.2],[-2.6,2.2],[2.6,-2.2],[-2.6,-2.2]]){const x=q.x+dx,z=q.z+dz;add(x,hgt(x,z)-0.05,z,1.5,0.42,1.2,0,true);}
  // deep snow fields (snowCover, xmas.js): soft wind-blown humps, so the snow is visibly thicker there
  let deepN=0;
  for(let x=-50;x<=50&&deepN<46;x+=4.5)for(let z=-50;z<=50&&deepN<46;z+=4.5){
    const jx=x+((x*13+z*7)%5+5)%5*0.4-1,jz=z+((x*5+z*11)%5+5)%5*0.4-1;
    if(snowCover(jx,jz)<0.72||!ok(jx,jz)||BASES.some(B=>Math.hypot(B.x-jx,B.z-jz)<9)||obstacles.some(o=>Math.hypot(o.x-jx,o.z-jz)<o.r+1.2))continue;
    const r=1.3+snowCover(jx,jz)*1.2;add(jx,hgt(jx,jz)-0.07,jz,r,0.22+0.12*snowCover(jx,jz),r*0.75,(jx*0.7+jz)*0.5,true);deepN++;
  }
  SNOW.deep=deepN;
  // hollows: where the ground around lies higher
  let hollow=0;
  for(let x=-48;x<=48&&hollow<24;x+=3)for(let z=-48;z<=48&&hollow<24;z+=3){
    const h=hgtRaw(x,z),around=(hgtRaw(x+3,z)+hgtRaw(x-3,z)+hgtRaw(x,z+3)+hgtRaw(x,z-3))/4;
    if(around-h>0.22&&ok(x,z)&&BASES.every(B=>Math.hypot(B.x-x,B.z-z)>10)&&obstacles.every(o=>Math.hypot(o.x-x,o.z-z)>o.r+1.5)){
      const r=1.6+((x*7+z*13)%7+7)%7*0.12;add(x,h-0.06,z,r,0.36,r*0.8,(x+z)*0.3,true);hollow++;}
  }
  const dm=new THREE.InstancedMesh(domeG,snowMat2,domes.length),dd=new THREE.Object3D();
  domes.forEach((d,i)=>{dd.position.set(d.x,d.y,d.z);dd.rotation.set(0,d.ry,0);dd.scale.set(d.sx,d.sy,d.sz);dd.updateMatrix();dm.setMatrixAt(i,dd.matrix);});
  dm.receiveShadow=true;dm.castShadow=false;scene.add(dm);SNOW.domes=dm;
  // crates: a snow cap, only on the top layer of a stack
  const capG=new THREE.SphereGeometry(0.62,14,6,0,TAU,0,Math.PI/2).scale(1,0.24,1);
  const capOn=c=>{if(!c||!c.m||c.snowCap)return;const m=new THREE.Mesh(capG,snowMat2);m.position.y=0.49;m.receiveShadow=true;c.m.add(m);c.snowCap=m;};
  {const _sc=spawnCrate;spawnCrate=function(){const c=_sc.apply(this,arguments);capOn(c);return c;};}
  for(const c of crates)capOn(c);

  /* ---------- Drifts slow you down a little ---------- */
  const cells=new Map(),key=(i,j)=>i*1000+j;
  for(const d of SNOW.drifts){const i0=Math.floor((d.x-d.r)/4),i1=Math.floor((d.x+d.r)/4),j0=Math.floor((d.z-d.r)/4),j1=Math.floor((d.z+d.r)/4);
    for(let i=i0;i<=i1;i++)for(let j=j0;j<=j1;j++){const k=key(i,j);(cells.get(k)||cells.set(k,[]).get(k)).push(d);}}
  SNOW.inDrift=(x,z)=>{const l=cells.get(key(Math.floor(x/4),Math.floor(z/4)));if(!l)return false;for(const d of l)if(Math.hypot(x-d.x,z-d.z)<d.r)return true;return false;};
  {const _mu=moveUnit;moveUnit=function(u,mx,mz,dt,spd){
    if(u&&SNOW.inDrift(u.x,u.z)){spd*=SNOW.slow;u._inDrift=true;}else if(u)u._inDrift=false;
    return _mu.call(this,u,mx,mz,dt,spd);};}

  /* ---------- Every frame: steps, ruts, dust, caps ---------- */
  const dustCol=MOUNTAIN?0xf4f7fb:0xffffff;
  function step(dt){
    if(state!=='play')return;
    const fine=gfxFine(),cx=camera.position.x,cz=camera.position.z;
    for(const u of units){
      if(!u.alive||u.kind==='turm')continue;
      // moving or not is read from the position: the game's own flag is already reset when the frame gets here
      const mv=u._spx!==undefined&&Math.hypot(u.x-u._spx,u.z-u._spz)>0.002;u._spx=u.x;u._spz=u.z;if(!mv)continue;
      const veh=isVeh(u),a=veh?(u.hull||0):u.h,rx=Math.cos(a),rz=-Math.sin(a),near=Math.hypot(u.x-cx,u.z-cz)<40;
      if(veh){
        // two continuous ruts: stretch each stamp from the last wheel position to the current one
        const w=(u.r||1)*0.72,px=u._rx,pz=u._rz;u._rx=u.x;u._rz=u.z;
        if(px!==undefined){const dx=u.x-px,dz=u.z-pz,l=Math.hypot(dx,dz);if(l>0.01&&l<3){const ang=Math.atan2(dx,dz);
          for(const s of [-1,1])stamp((u.x+px)/2+rx*w*s,(u.z+pz)/2+rz*w*s,ang,0.7,l+0.5);}}
      }else{
        // a step every 0.6 units walked, left and right in turn
        if(u._sx===undefined||Math.hypot(u.x-u._sx,u.z-u._sz)>3){u._sx=u.x;u._sz=u.z;}
        if(Math.hypot(u.x-u._sx,u.z-u._sz)>=0.6){u._sx=u.x;u._sz=u.z;u._foot=-(u._foot||1);const fx=u.x+rx*0.2*u._foot,fz=u.z+rz*0.2*u._foot;stamp(fx,fz,a,0.62,0.9);
          if(fine&&near&&parts.length<220)puffs(fx,hgt(fx,fz)+0.08,fz,1,dustCol,{size:u._inDrift?0.5:0.3,up:0.4,life:0.45,spread:0.5,op:0.55});}
      }
      if(veh&&fine&&near&&u._inDrift&&parts.length<220&&Math.random()<dt*8)puffs(u.x-Math.sin(a)*1.2,hgt(u.x,u.z)+0.2,u.z-Math.cos(a)*1.2,1,dustCol,{size:0.8,up:0.6,life:0.7,spread:0.8,op:0.6});
    }
    drawTrail(dt);
    for(const c of crates)if(c.snowCap)c.snowCap.visible=c.state!=='stack';
    for(const p of pads){const top=Math.floor((p.stack.length-1)/4)*4;p.stack.forEach((c,i)=>{if(c.snowCap)c.snowCap.visible=i>=top;});}
  }
  const _mood=updateMood;updateMood=function(dt){_mood(dt);try{step(dt);}catch(e){console.warn(e);}};
  const _ga=gfxApply;gfxApply=function(){_ga();makeRT();};
  SNOW.U=U;
})();
