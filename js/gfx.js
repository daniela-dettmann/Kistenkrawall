/* Kistenkrawall: Grafik-Paket für alle Karten.
   - Qualitätsschalter „Grafik: Hoch / Niedrig“ (Menü, gemerkt; ?grafik=hoch|niedrig, alt auch schoen|schnell).
     Intern heißen die Stufen weiter 'schoen' und 'schnell', damit gespeicherte Einstellungen gültig bleiben. Ruckelt es, schaltet das Spiel
     von selbst auf „Niedrig“, solange man nichts fest gewählt hat.
   - Direkt auf den Bildschirm gezeichnet; helle Stellen werden in jedem Material weich abgefangen (render.js).
   - Abgerundete Kanten, Schattierung in Senken, Gras blendet in der Ferne aus, Schatten rasten auf ganze Schattenpixel ein.
   - Weiteres Aussehen (Wind, Wolkenschatten, Spuren, Explosionen, Metallglanz, Lichtsaum, Wasserspiegelung): look.js.
   - Lava: Glut an den Ufern (das Wasser steht in water.js).
   - Boden: großflächige Helligkeitsunterschiede gegen das Kachelmuster, nasser Saum am Wasser.
   - Schattenflecken unter Bäumen und Felsen, damit nichts schwebt.
   - Effekte: Druckwelle und Funken bei Explosionen, Staub hinter Fahrzeugen.
   Alles hängt sich an Bestehendes an; fällt etwas aus, zeichnet das Spiel wie bisher. */
'use strict';
const GFX={
  mode:(function(){
    const q=/[?&#]grafik=(schoen|schnell|hoch|niedrig)/i.exec(location.search+location.hash);if(q)return /schoen|hoch/i.test(q[1])?'schoen':'schnell';
    try{const m=localStorage.getItem('kk-gfx');if(m==='schoen'||m==='schnell')return m;}catch(e){}
    // first start: phones and tablets with little memory or few cores begin on „Niedrig“, everything else on „Hoch“;
    // after that the frame rate decides (see the slow-device check at the end of this file)
    const touch=matchMedia('(pointer: coarse)').matches,mem=navigator.deviceMemory||8,cores=navigator.hardwareConcurrency||8;
    return touch&&(mem<=3||cores<=4)?'schnell':'schoen';
  })(),
  chosen:(function(){try{return !!localStorage.getItem('kk-gfx');}catch(e){return false;}})()||/[?&#]grafik=/i.test(location.search+location.hash),
  ok:true
};
const gfxFine=()=>GFX.mode==='schoen';

/* ---------- Height map of the terrain as a texture (for shore foam, lava glow, wet ground) ---------- */
const hgtTex=(function(){
  // One texel per terrain vertex (the ground mesh has 177 x 177 of them), so the shore in the texture is exactly
  // the shore of the mesh. A coarser, shifted grid gave a jagged, flickering foam line. Heights between -3.2 and
  // 0.8 are all the water and lava shaders need, which keeps 8 bits precise enough (1.6 cm a step).
  const S=177,d=new Uint8Array(S*S*4);
  for(let j=0;j<S;j++)for(let i=0;i<S;i++){
    const h=hgtRaw(i/(S-1)*172-86,j/(S-1)*172-86),v=Math.round(clamp((h+3.2)/4,0,1)*255),k=(j*S+i)*4;
    d[k]=d[k+1]=d[k+2]=v;d[k+3]=255;
  }
  const t=new THREE.DataTexture(d,S,S,THREE.RGBAFormat);t.magFilter=t.minFilter=THREE.LinearFilter;t.needsUpdate=true;return t;
})();
const HGT_GLSL='float kkHgt(vec2 p){vec2 u=p/172.0+0.5;if(u.x<0.0||u.x>1.0||u.y<0.0||u.y>1.0)return -3.2;return texture2D(uHgt,u*(176.0/177.0)+0.5/177.0).r*4.0-3.2;}\n';
// add to a material's shader without losing what other files already hooked in (mountain.js, world.js)
// Each chained change gets a tag. three.js reuses compiled shaders between materials whose settings match; the
// tags (and the material's own original hook) keep a changed shader from being handed to a material without it.
function gfxChain(mat,fn,tag){
  const prev=mat.onBeforeCompile;
  if(!mat.userData.kkBase)mat.userData.kkBase=String(prev);
  mat.onBeforeCompile=function(sh,r){if(prev)prev.call(this,sh,r);fn(sh);};
  mat.userData.kkTags=(mat.userData.kkTags||[]).concat(tag||'x');
  const key=mat.userData.kkTags.join(',')+'|'+mat.userData.kkBase;mat.customProgramCacheKey=()=>key;
  mat.needsUpdate=true;
}

/* ---------- Lava: brighter glow where it meets the banks ---------- */
if(lavaMat)gfxChain(lavaMat,sh=>{
  sh.uniforms.uHgt={value:hgtTex};
  sh.fragmentShader='uniform sampler2D uHgt;\n'+HGT_GLSL+sh.fragmentShader.replace('#include <tonemapping_fragment>',
    `float ld=-1.2-kkHgt(vLava);
    gl_FragColor.rgb+=vec3(0.42,0.2,0.03)*smoothstep(0.7,0.0,ld)*(0.75+0.25*sin(uTime*1.7+vLava.x*0.9+vLava.y*0.7));
    #include <tonemapping_fragment>`);
},'lavaglow');
/* ---------- Ground: large-scale variation against the tiling, a wet seam along the water ---------- */
scene.traverse(o=>{
  if(!o.isMesh||!o.material||o.material.map!==TX.ground||!o.geometry.attributes.color)return;
  const wet={value:MOUNTAIN?0:1};
  gfxChain(o.material,sh=>{
    sh.uniforms.uWet=wet;
    sh.vertexShader='varying vec3 vKkG;\n'+sh.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvKkG=(modelMatrix*vec4(transformed,1.0)).xyz;');
    sh.fragmentShader='uniform float uWet;varying vec3 vKkG;\n'+sh.fragmentShader.replace('#include <map_fragment>',
      `#include <map_fragment>
      float kg=texture2D(map,vKkG.xz*0.021).g;float kg2=texture2D(map,vKkG.xz*0.006+0.37).r;
      diffuseColor.rgb*=0.8+0.13*kg+0.07*kg2;   // only ever darkens: bright ground (snow, sand) must not burn out
      diffuseColor.rgb*=1.0-0.3*uWet*smoothstep(-0.95,-1.5,vKkG.y)*step(-1.75,vKkG.y);`);
  },'ground');
});

/* ---------- Merge static scenery: far fewer draw calls ----------
   Every tree, rock, sandbag and bridge plank used to be drawn on its own, twice (picture and shadow).
   Their triangles are baked into world space and joined per material and map quarter. */
(function(){
  const groups=new Map(),gone=[];
  for(const root of STATIC_ROOTS){
    if(!root.parent)continue;
    root.updateMatrixWorld(true);
    let ok=true;root.traverse(o=>{if(o.isInstancedMesh||o.isPoints||o.isSprite||o.isLine)ok=false;});
    if(!ok)continue;
    // a 3 x 3 grid: the camera and the shadow only ever see a few cells, the rest is skipped entirely
    const ci=v=>Math.max(0,Math.min(2,Math.floor((v+54)/36))),cell=ci(root.position.x)+3*ci(root.position.z);
    root.traverse(o=>{
      if(!o.isMesh)return;
      let vis=true;for(let q=o;q;q=q.parent)if(!q.visible)vis=false;
      if(!vis||Array.isArray(o.material))return;
      const src=o.geometry,at=src.attributes;if(!at.position||!at.normal)return;
      const key=[o.material.uuid,cell,o.castShadow?1:0,o.receiveShadow?1:0,at.uv?1:0].join('|');
      let G=groups.get(key);if(!G)groups.set(key,G={mat:o.material,cast:o.castShadow,recv:o.receiveShadow,uv:!!at.uv,pos:[],nor:[],uvs:[]});
      const g=(src.index?src.toNonIndexed():src.clone()).applyMatrix4(o.matrixWorld);
      G.pos.push(g.attributes.position.array);G.nor.push(g.attributes.normal.array);if(G.uv)G.uvs.push(g.attributes.uv.array);
      g.dispose();
    });
    gone.push(root);
  }
  const join=(list,n)=>{const a=new Float32Array(n);let k=0;for(const x of list){a.set(x,k);k+=x.length;}return a;};
  let made=0;
  for(const G of groups.values()){
    const n=G.pos.reduce((s,x)=>s+x.length,0),g=new THREE.BufferGeometry();
    g.setAttribute('position',new THREE.BufferAttribute(join(G.pos,n),3));
    g.setAttribute('normal',new THREE.BufferAttribute(join(G.nor,n),3));
    if(G.uv)g.setAttribute('uv',new THREE.BufferAttribute(join(G.uvs,n/3*2),2));
    const m=new THREE.Mesh(g,G.mat);m.castShadow=G.cast;m.receiveShadow=G.recv;m.matrixAutoUpdate=false;scene.add(m);made++;
  }
  for(const r of gone){r.parent.remove(r);r.traverse(o=>{if(o.isMesh)o.geometry.dispose();});}
  // islands on the horizon: every part had a material of its own; their colours move into the vertices
  if(FAR_ROOTS.length){
    const pos=[],nor=[],col=[];
    for(const root of FAR_ROOTS){
      root.updateMatrixWorld(true);
      root.traverse(o=>{
        if(!o.isMesh||!o.geometry.attributes.normal)return;
        const g=(o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone()).applyMatrix4(o.matrixWorld),n=g.attributes.position.count,c=new Float32Array(n*3);
        for(let i=0;i<n;i++){c[i*3]=o.material.color.r;c[i*3+1]=o.material.color.g;c[i*3+2]=o.material.color.b;}
        pos.push(g.attributes.position.array);nor.push(g.attributes.normal.array);col.push(c);g.dispose();
      });
      root.parent.remove(root);
    }
    const n=pos.reduce((s,x)=>s+x.length,0),g=new THREE.BufferGeometry();
    g.setAttribute('position',new THREE.BufferAttribute(join(pos,n),3));g.setAttribute('normal',new THREE.BufferAttribute(join(nor,n),3));g.setAttribute('color',new THREE.BufferAttribute(join(col,n),3));
    const m=new THREE.Mesh(g,new THREE.MeshLambertMaterial({vertexColors:true,fog:false}));m.matrixAutoUpdate=false;m.userData.kkFar=true;scene.add(m);made++;
  }
  GFX.merged={roots:gone.length,meshes:made};
})();
/* ---------- Soft contact shadows under trees and rocks ---------- */
(function(){
  const list=obstacles.filter(o=>!o.low&&o.r<3);if(!list.length)return;
  const c=document.createElement('canvas');c.width=c.height=64;const g=c.getContext('2d'),r=g.createRadialGradient(32,32,2,32,32,32);
  r.addColorStop(0,'rgba(0,0,0,.55)');r.addColorStop(.55,'rgba(0,0,0,.28)');r.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=r;g.fillRect(0,0,64,64);
  const mat=new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(c),transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2});
  const im=new THREE.InstancedMesh(new THREE.PlaneGeometry(1,1).rotateX(-Math.PI/2),mat,list.length),d=new THREE.Object3D();
  list.forEach((o,i)=>{const s=o.r*3.4+0.6;d.position.set(o.x,hgt(o.x,o.z)+0.05,o.z);d.scale.set(s,1,s);d.updateMatrix();im.setMatrixAt(i,d.matrix);});
  im.renderOrder=1;scene.add(im);GFX.contact=im;
})();

/* ---------- Effects: shock wave and sparks on explosions, dust behind vehicles ---------- */
const gfxRingG=new THREE.RingGeometry(0.78,1,28).rotateX(-Math.PI/2);
{const _boom=boom;
 boom=function(x,z,size){
   _boom(x,z,size);
   if(!gfxFine()||parts.length>230)return;
   const m=new THREE.Mesh(gfxRingG,new THREE.MeshBasicMaterial({color:0xfff0d0,transparent:true,opacity:0.8,depthWrite:false}));
   m.position.set(x,hgt(x,z)+0.12,z);m.scale.setScalar(0.3);scene.add(m);
   parts.push({m,vx:0,vy:0,vz:0,life:0.45,max:0.45,boom:size*1.9});
   sparks(x,hgt(x,z)+0.7,z,Math.min(10,4+Math.round(size*1.5)),0xffc66a);
 };}
const gfxDust=MOUNTAIN?0xf4f7fb:VOLCANO?0x6f665f:0xcdb78c;
setInterval(()=>{
  if(!gfxFine()||state!=='play'||document.hidden||parts.length>200)return;
  for(const u of units){
    if(!u.alive||!isVeh(u)||u.kind==='turm')continue;
    const mv=u._dpx!==undefined&&Math.hypot(u.x-u._dpx,u.z-u._dpz)>0.05;u._dpx=u.x;u._dpz=u.z;if(!mv)continue;   // u.moving is reset every frame
    const a=u.hull||0;puffs(u.x-Math.sin(a)*1.3+rand(-0.4,0.4),hgt(u.x,u.z)+0.2,u.z-Math.cos(a)*1.3+rand(-0.4,0.4),1,gfxDust,{size:0.75,up:0.35,life:0.9,spread:0.6,op:0.42});
  }
},140);

/* ---------- Drawing: straight to the screen ----------
   An earlier version drew into an off-screen buffer and added glow, colour grading and dark corners in three extra
   passes. On the iPhone that made the picture shimmer at edges (the device's own edge smoothing did not apply) and
   look washed out. Now the exposure curve sits in every material (render.js), glow only comes from real lights
   (explosions, muzzle flashes, lava, gold crates) and the dark corners are a simple overlay on the page. */
(function(){
  const v=document.createElement('div');v.id='vignette';v.setAttribute('aria-hidden','true');
  v.style.cssText='position:fixed;inset:0;pointer-events:none;background:radial-gradient(ellipse at center,rgba(0,0,0,0) 58%,rgba(12,10,24,.3) 100%)';
  canvas.insertAdjacentElement('afterend',v);GFX.vignette=v;
  renderer.info.autoReset=false;   // count the whole frame
  // The shadow map is redrawn every second frame only: it costs about as much as the picture itself.
  renderer.shadowMap.autoUpdate=false;let frameNo=0;
  window.gfxRender=function(){
    renderer.info.reset();
    renderer.shadowMap.needsUpdate=(frameNo++&1)===0||state==='menu';
    renderer.render(scene,camera);
  };
})();

/* ---------- Shadow: follows the view and snaps to whole shadow pixels ----------
   Moving the shadow area by fractions of a shadow pixel makes every shadow edge crawl and flicker. The centre is
   therefore rounded to the shadow map's own grid, seen from the sun. */
{const _uc=updateCamera,UP=new THREE.Vector3(0,1,0),ax=new THREE.Vector3(),ay=new THREE.Vector3(),d=new THREE.Vector3(),c=new THREE.Vector3();
 updateCamera=function(dt){
   _uc(dt);
   const half=30;
   if(player&&state!=='menu'){const yaw=camMode==='taktik'?TAC_YAW:camYaw;c.set(player.x+Math.sin(yaw)*6,0,player.z+Math.cos(yaw)*6);}else c.set(camLook.x,0,camLook.z);
   d.copy(SUN_OFF).normalize();ax.crossVectors(UP,d).normalize();ay.crossVectors(d,ax);
   const t=2*half/sun.shadow.mapSize.x,px=c.dot(ax),py=c.dot(ay);
   c.addScaledVector(ax,Math.round(px/t)*t-px).addScaledVector(ay,Math.round(py/t)*t-py);
   sun.target.position.copy(c);sun.position.copy(c).add(SUN_OFF);
 };}

/* ---------- Rounded edges: boxes get a small bevel that catches the light ---------- */
const gfxRoundCache=new Map();
function gfxRoundBox(w,h,d){
  const key=[w,h,d].map(v=>v.toFixed(3)).join(',');if(gfxRoundCache.has(key))return gfxRoundCache.get(key);
  const r=Math.min(0.1,Math.min(w,h,d)*0.14),hs=[w/2,h/2,d/2],g=new THREE.BoxGeometry(1,1,1,3,3,3),p=g.attributes.position,n=g.attributes.normal;
  const map=(v,hw)=>v<-0.16?-hw+(v+0.5)*3*r:v>0.16?hw-(0.5-v)*3*r:v*6*(hw-r);
  const q=[0,0,0],inn=[0,0,0];
  for(let i=0;i<p.count;i++){
    q[0]=map(p.getX(i),hs[0]);q[1]=map(p.getY(i),hs[1]);q[2]=map(p.getZ(i),hs[2]);
    let l=0;for(let k=0;k<3;k++){inn[k]=Math.max(-(hs[k]-r),Math.min(hs[k]-r,q[k]));l+=(q[k]-inn[k])**2;}
    l=Math.sqrt(l);
    if(l>1e-6){for(let k=0;k<3;k++)q[k]=inn[k]+(q[k]-inn[k])/l*r;n.setXYZ(i,(q[0]-inn[0])/r,(q[1]-inn[1])/r,(q[2]-inn[2])/r);}
    p.setXYZ(i,q[0],q[1],q[2]);
  }
  g.userData.kkRound=true;g.computeBoundingSphere();gfxRoundCache.set(key,g);return g;
}
function gfxRoundParts(root){
  root.traverse(o=>{
    if(!o.isMesh||o.isInstancedMesh||!o.geometry||o.geometry.type!=='BoxGeometry'||o.geometry.userData.kkRound)return;
    const P=o.geometry.parameters;if(Math.min(P.width,P.height,P.depth)<0.12)return;
    o.geometry=gfxRoundBox(P.width,P.height,P.depth);
  });
}
G.crate=gfxRoundBox(1,1,1);for(const c of crates)c.m.geometry=G.crate;

/* Blechlinge and vehicles: each one was about 20 separate parts, drawn twice a frame. Parts that sit in the same
   joint and share a material are joined into one mesh; joints (legs, arms, turret, weapon, wheels) stay movable.
   Small joined parts no longer draw into the shadow map. */
function gfxMergeParts(root,keep){
  const visit=node=>{
    const kids=node.children.slice(),groups=new Map();
    for(const c of kids){
      if(c.children.length){visit(c);continue;}
      if(!c.isMesh||c.isInstancedMesh||!c.visible||keep.has(c)||Array.isArray(c.material)||!c.geometry.attributes.normal)continue;
      const key=c.material.uuid+(c.geometry.attributes.uv?'u':'-');
      (groups.get(key)||groups.set(key,[]).get(key)).push(c);
    }
    for(const list of groups.values()){
      if(list.length<2)continue;
      const pos=[],nor=[],uvs=[],uv=!!list[0].geometry.attributes.uv;let n=0;
      for(const c of list){
        c.updateMatrix();
        const g=(c.geometry.index?c.geometry.toNonIndexed():c.geometry.clone()).applyMatrix4(c.matrix);
        pos.push(g.attributes.position.array);nor.push(g.attributes.normal.array);if(uv)uvs.push(g.attributes.uv.array);n+=g.attributes.position.array.length;g.dispose();
        node.remove(c);
      }
      const join=(l,len)=>{const a=new Float32Array(len);let k=0;for(const x of l){a.set(x,k);k+=x.length;}return a;},g=new THREE.BufferGeometry();
      g.setAttribute('position',new THREE.BufferAttribute(join(pos,n),3));g.setAttribute('normal',new THREE.BufferAttribute(join(nor,n),3));
      if(uv)g.setAttribute('uv',new THREE.BufferAttribute(join(uvs,n/3*2),2));
      const m=new THREE.Mesh(g,list[0].material);m.castShadow=list.some(c=>c.castShadow);m.receiveShadow=list[0].receiveShadow;node.add(m);
    }
  };
  visit(root);
  root.traverse(o=>{
    if(!o.isMesh||!o.castShadow)return;
    if(!o.geometry.boundingSphere)o.geometry.computeBoundingSphere();
    if(o.geometry.boundingSphere.radius*Math.max(o.scale.x,o.scale.y,o.scale.z)<0.4)o.castShadow=false;
  });
}
// the two headquarters: about 60 parts each (more with Christmas decoration)
try{for(const q of hqs){if(!q.g)continue;gfxRoundParts(q.g);const keep=new Set();for(const v of Object.values(q))for(const x of Array.isArray(v)?v:[v])if(x&&x.isObject3D)keep.add(x);gfxMergeParts(q.g,keep);}}catch(e){console.warn(e);}
{const _spawn=spawnUnit;
 spawnUnit=function(){
   const u=_spawn.apply(this,arguments);
   try{if(u&&u.bot&&u.bot.g){
     // parts the game moves or swaps on their own stay as they are
     const keep=new Set();for(const v of Object.values(u.bot))for(const x of Array.isArray(v)?v:[v])if(x&&x.isObject3D)keep.add(x);
     gfxRoundParts(u.bot.g);gfxMergeParts(u.bot.g,keep);
   }}catch(e){console.warn(e);}
   return u;
 };}

/* ---------- Ground: soft shading in hollows, at the foot of trees and rocks, under bridges ----------
   Computed once while loading and written into the ground's vertex colours, so it costs nothing while playing. */
scene.traverse(o=>{
  if(!o.isMesh||!o.material||o.material.map!==TX.ground||!o.geometry.attributes.color)return;
  const P=o.geometry.attributes.position,C=o.geometry.attributes.color,S=Math.round(Math.sqrt(P.count));if(S*S!==P.count)return;
  const H=i=>P.getY(i),trees=obstacles.filter(b=>!b.low&&b.r<3);
  let darkened=0;
  for(let j=0;j<S;j++)for(let k=0;k<S;k++){
    const i=j*S+k,h=H(i),x=P.getX(i),z=P.getZ(i);let sum=0,cnt=0;
    for(const st of [2,5])for(const [dj,dk] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]){
      const jj=j+dj*st,kk=k+dk*st;if(jj<0||kk<0||jj>=S||kk>=S)continue;sum+=H(jj*S+kk);cnt++;}
    let f=1-clamp(((sum/cnt)-h)*0.22,0,0.3);
    for(const b of trees){const dd=Math.hypot(x-b.x,z-b.z),R=b.r*1.9+0.7;if(dd<R)f*=1-0.32*(1-dd/R);}
    if(onBridge(x,z)&&h<0.25)f*=0.62;
    if(f<0.999){C.setXYZ(i,C.getX(i)*f,C.getY(i)*f,C.getZ(i)*f);darkened++;}
  }
  C.needsUpdate=true;GFX.ao=darkened;
});

/* ---------- Grass: fades out in the distance, where single blades are thinner than a pixel and flicker ---------- */
GFX.fade={a:{value:42},b:{value:58}};
scene.traverse(o=>{
  if(!o.isInstancedMesh||(o.name!=='kkGrass'&&o.name!=='kkFlowers'))return;
  gfxChain(o.material,sh=>{
    sh.uniforms.uFadeA=GFX.fade.a;sh.uniforms.uFadeB=GFX.fade.b;
    sh.vertexShader='uniform float uFadeA;uniform float uFadeB;\n'+sh.vertexShader.replace('#include <begin_vertex>',
      '#include <begin_vertex>\n{vec4 kkI=modelMatrix*instanceMatrix*vec4(0.0,0.0,0.0,1.0);transformed*=1.0-smoothstep(uFadeA,uFadeB,distance(kkI.xyz,cameraPosition));}');
  },'fade');
});

/* ---------- FPS display: frames per second, time per frame, draw calls ---------- */
(function(){
  const el=document.createElement('div');el.id='fps';el.hidden=true;
  el.style.cssText='position:fixed;left:calc(12px + env(safe-area-inset-left));top:calc(122px + env(safe-area-inset-top));z-index:60;font:700 11px/1.2 ui-monospace,Menlo,monospace;color:#fff;background:rgba(10,20,26,.72);padding:4px 9px;border-radius:8px;pointer-events:none;white-space:nowrap';
  document.body.appendChild(el);
  let on=false;try{on=localStorage.getItem('kk-fps')==='1';}catch(e){}
  if(/[?&#]fps\b/i.test(location.search+location.hash))on=true;
  const btn=$('#fpsToggle'),label=()=>{if(btn)btn.setAttribute('aria-checked',on?'true':'false');el.hidden=!on;};
  if(btn)btn.addEventListener('click',()=>{on=!on;try{localStorage.setItem('kk-fps',on?'1':'0');}catch(e){}label();});
  label();
  let n=0,t0=performance.now(),worst=0,prev=t0;
  (function tick(now){
    requestAnimationFrame(tick);
    worst=Math.max(worst,now-prev);prev=now;n++;
    if(now-t0<500)return;
    const fps=n*1000/(now-t0);GFX.fps=fps;
    if(on)el.textContent=Math.round(fps)+' FPS · längstes Bild '+Math.round(worst)+' ms · '+renderer.info.render.calls+' Aufrufe · '+Math.round(renderer.info.render.triangles/1000)+'k Dreiecke · '+(gfxFine()?'Hoch':'Niedrig');
    n=0;t0=now;worst=0;
  })(t0);
})();

/* ---------- Quality switch ---------- */
function gfxApply(){
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,gfxFine()?2:1.5));
  const s=gfxFine()?2048:1024;
  if(sun.shadow.mapSize.x!==s){sun.shadow.mapSize.set(s,s);if(sun.shadow.map){sun.shadow.map.dispose();sun.shadow.map=null;}}
  if(GFX.contact)GFX.contact.visible=gfxFine();
  if(GFX.vignette)GFX.vignette.hidden=!gfxFine();
  if(GFX.fade){GFX.fade.a.value=gfxFine()?42:34;GFX.fade.b.value=gfxFine()?58:46;}
  // sharper textures at shallow angles: the ground in the distance no longer shimmers
  const an=Math.min(gfxFine()?16:4,renderer.capabilities.getMaxAnisotropy());
  if(!GFX.texs){GFX.texs=new Set(Object.values(TX));scene.traverse(o=>{if(o.material&&o.material.map)GFX.texs.add(o.material.map);});}
  for(const t of GFX.texs)if(t&&t.isTexture&&t.anisotropy!==an){t.anisotropy=an;t.needsUpdate=true;}
  if(typeof resize==='function')resize();
  for(const b of document.querySelectorAll('#gfxSeg button'))b.setAttribute('aria-pressed',b.dataset.g===GFX.mode?'true':'false');
  // soft shadows (settings › Grafik): PCF soft or plain PCF; materials are rebuilt once when it changes
  const st=GFX.soft?THREE.PCFSoftShadowMap:THREE.PCFShadowMap;
  if(renderer.shadowMap.type!==st){renderer.shadowMap.type=st;scene.traverse(o=>{if(o.material)for(const m of [].concat(o.material))m.needsUpdate=true;});renderer.shadowMap.needsUpdate=true;}
  const sb=$('#shadowToggle');if(sb)sb.setAttribute('aria-checked',GFX.soft?'true':'false');
}
function gfxSet(mode,byUser){
  GFX.mode=mode==='schnell'?'schnell':'schoen';
  if(byUser){GFX.chosen=true;try{localStorage.setItem('kk-gfx',GFX.mode);}catch(e){}}
  gfxApply();
}
GFX.soft=(function(){try{return localStorage.getItem('kk-soft')!=='0';}catch(e){return true;}})();
for(const b of document.querySelectorAll('#gfxSeg button'))b.addEventListener('click',()=>gfxSet(b.dataset.g,true));
{const b=$('#shadowToggle');if(b)b.addEventListener('click',()=>{GFX.soft=!GFX.soft;try{localStorage.setItem('kk-soft',GFX.soft?'1':'0');}catch(e){}gfxApply();});}
gfxApply();
/* Slow device: after two slow stretches in a row, switch to "Schnell" unless the player chose a mode themselves */
(function(){
  let n=0,t0=performance.now(),slow=0;
  (function tick(now){
    requestAnimationFrame(tick);
    if(state!=='play'||document.hidden){n=0;t0=now;return;}
    n++;
    if(now-t0>=4000){
      const fps=n*1000/(now-t0);n=0;t0=now;
      slow=fps<24?slow+1:0;
      if(slow>=2&&gfxFine()&&!GFX.chosen&&!navigator.webdriver){gfxSet('schnell',false);toast('Grafik auf „Niedrig“ gestellt, damit es flüssig läuft. Ändern im Menü.',3.5);}
    }
  })(t0);
})();
