/* Kistenkrawall: Grafik-Paket für alle Karten.
   - Qualitätsschalter „Schön / Schnell“ (Menü, gemerkt; ?grafik=schoen|schnell). Ruckelt es, schaltet das Spiel
     von selbst auf „Schnell“, solange man nichts fest gewählt hat.
   - Bildeffekte (nur „Schön“): weicher Schein um Helles, etwas mehr Kontrast und Farbe, warme Lichter,
     kühle Schatten, dunklere Bildecken.
   - Wasser und Lava: Schaum und helles Flachwasser am Ufer, Glut an den Lavaufern.
   - Boden: großflächige Helligkeitsunterschiede gegen das Kachelmuster, nasser Saum am Wasser.
   - Schattenflecken unter Bäumen und Felsen, damit nichts schwebt.
   - Effekte: Druckwelle und Funken bei Explosionen, Staub hinter Fahrzeugen.
   Alles hängt sich an Bestehendes an; fällt etwas aus, zeichnet das Spiel wie bisher. */
'use strict';
const GFX={
  mode:(function(){
    const q=/[?&#]grafik=(schoen|schnell)/i.exec(location.search+location.hash);if(q)return q[1].toLowerCase();
    try{const m=localStorage.getItem('kk-gfx');if(m==='schoen'||m==='schnell')return m;}catch(e){}
    return 'schoen';
  })(),
  chosen:(function(){try{return !!localStorage.getItem('kk-gfx');}catch(e){return false;}})()||/[?&#]grafik=/i.test(location.search+location.hash),
  post:null,ok:true
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
function gfxChain(mat,fn){const prev=mat.onBeforeCompile;mat.onBeforeCompile=sh=>{if(prev)prev(sh);fn(sh);};mat.needsUpdate=true;}

/* ---------- Water: shallow tint and foam along the shore ---------- */
scene.traverse(o=>{
  if(!o.isMesh||!o.material||o.position.y!==-1.65||!o.material.transparent)return;
  const shallow={value:o.material.color.clone().lerp(new THREE.Color(0xffffff),0.42)};
  GFX.water={mat:o.material,shallow};
  gfxChain(o.material,sh=>{
    sh.uniforms.uHgt={value:hgtTex};sh.uniforms.uShallow=shallow;sh.uniforms.uTime=timeU;
    sh.vertexShader='varying vec2 vKkW;\n'+sh.vertexShader.replace('#include <project_vertex>','vKkW=(modelMatrix*vec4(transformed,1.0)).xz;\n#include <project_vertex>');
    sh.fragmentShader='uniform sampler2D uHgt;uniform vec3 uShallow;varying vec2 vKkW;\n'+(/uniform float uTime/.test(sh.fragmentShader)?'':'uniform float uTime;\n')+HGT_GLSL+sh.fragmentShader.replace('#include <tonemapping_fragment>',
      `float kd=-1.65-kkHgt(vKkW);
      gl_FragColor.rgb=mix(gl_FragColor.rgb,uShallow,(1.0-smoothstep(0.0,1.5,kd))*0.5);
      // a soft, slow band of foam; hard stripes right at the edge flicker when the waves move
      float kf=smoothstep(0.6,0.08,kd)*(0.55+0.45*sin(kd*7.0-uTime*1.3+sin(vKkW.x*0.5+vKkW.y*0.45)*1.8));
      kf=clamp(kf,0.0,1.0)*smoothstep(-0.05,0.12,kd);
      gl_FragColor.rgb=mix(gl_FragColor.rgb,vec3(0.94,0.97,1.0),kf*0.6);gl_FragColor.a=max(gl_FragColor.a,kf*0.85);
      #include <tonemapping_fragment>`);
  });
});
/* ---------- Lava: brighter glow where it meets the banks ---------- */
if(lavaMat)gfxChain(lavaMat,sh=>{
  sh.uniforms.uHgt={value:hgtTex};
  sh.fragmentShader='uniform sampler2D uHgt;\n'+HGT_GLSL+sh.fragmentShader.replace('#include <tonemapping_fragment>',
    `float ld=-1.2-kkHgt(vLava);
    gl_FragColor.rgb+=vec3(0.42,0.2,0.03)*smoothstep(0.7,0.0,ld)*(0.75+0.25*sin(uTime*1.7+vLava.x*0.9+vLava.y*0.7));
    #include <tonemapping_fragment>`);
});
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
  });
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
    const m=new THREE.Mesh(g,new THREE.MeshLambertMaterial({vertexColors:true,fog:false}));m.matrixAutoUpdate=false;scene.add(m);made++;
  }
  GFX.merged={roots:gone.length,meshes:made};
})();
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
try{for(const q of hqs){if(!q.g)continue;const keep=new Set();for(const v of Object.values(q))for(const x of Array.isArray(v)?v:[v])if(x&&x.isObject3D)keep.add(x);gfxMergeParts(q.g,keep);}}catch(e){console.warn(e);}
{const _spawn=spawnUnit;
 spawnUnit=function(){
   const u=_spawn.apply(this,arguments);
   try{if(u&&u.bot&&u.bot.g){
     // parts the game moves or swaps on their own stay as they are
     const keep=new Set();for(const v of Object.values(u.bot))for(const x of Array.isArray(v)?v:[v])if(x&&x.isObject3D)keep.add(x);
     gfxMergeParts(u.bot.g,keep);
   }}catch(e){console.warn(e);}
   return u;
 };}
(function(){
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
    if(!u.alive||!isVeh(u)||!u.moving||u.kind==='turm')continue;
    const a=u.hull||0;puffs(u.x-Math.sin(a)*1.3+rand(-0.4,0.4),hgt(u.x,u.z)+0.2,u.z-Math.cos(a)*1.3+rand(-0.4,0.4),1,gfxDust,{size:0.75,up:0.35,life:0.9,spread:0.6,op:0.42});
  }
},140);

/* ---------- Post-processing: glow, colour grade, vignette ---------- */
(function(){
  const QUAD=new THREE.Mesh(new THREE.PlaneGeometry(2,2)),qScene=new THREE.Scene(),qCam=new THREE.OrthographicCamera(-1,1,1,-1,0,1);qScene.add(QUAD);
  const VS='varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.0,1.0);}';
  // snow is nearly white everywhere: only real lights may glow there
  const THR=MOUNTAIN||(typeof XMAS!=='undefined'&&XMAS&&!VOLCANO)?0.97:0.96;   // only real lights glow: sand, sky and snow are bright but must not bloom
  const bright=new THREE.ShaderMaterial({depthTest:false,depthWrite:false,uniforms:{t:{value:null},px:{value:new THREE.Vector2()},thr:{value:THR}},vertexShader:VS,
    fragmentShader:`uniform sampler2D t;uniform vec2 px;uniform float thr;varying vec2 vUv;
      vec3 b(vec2 o){vec3 c=texture2D(t,vUv+o*px).rgb;float l=max(c.r,max(c.g,c.b));return c*smoothstep(thr,thr+0.14,l);}
      void main(){gl_FragColor=vec4(b(vec2(0.0))*0.3+(b(vec2(-3.2,0.0))+b(vec2(3.2,0.0)))*0.12+(b(vec2(-1.4,0.0))+b(vec2(1.4,0.0)))*0.23,1.0);}`});
  const blur=new THREE.ShaderMaterial({depthTest:false,depthWrite:false,uniforms:{t:{value:null},px:{value:new THREE.Vector2()}},vertexShader:VS,
    fragmentShader:`uniform sampler2D t;uniform vec2 px;varying vec2 vUv;
      void main(){vec3 c=texture2D(t,vUv).rgb*0.3+(texture2D(t,vUv+vec2(0.0,-3.2)*px).rgb+texture2D(t,vUv+vec2(0.0,3.2)*px).rgb)*0.12+(texture2D(t,vUv+vec2(0.0,-1.4)*px).rgb+texture2D(t,vUv+vec2(0.0,1.4)*px).rgb)*0.23;gl_FragColor=vec4(c,1.0);}`});
  const final=new THREE.ShaderMaterial({depthTest:false,depthWrite:false,uniforms:{t:{value:null},b:{value:null},glow:{value:0.4}},vertexShader:VS,
    fragmentShader:`uniform sampler2D t;uniform sampler2D b;uniform float glow;varying vec2 vUv;
      void main(){
        vec3 c=texture2D(t,vUv).rgb+texture2D(b,vUv).rgb*glow;
        float l=dot(c,vec3(0.299,0.587,0.114));
        c=mix(vec3(l),c,1.09);c=(c-0.5)*1.05+0.47;
        c-=max(c-0.7,0.0)*0.6;   // soft shoulder: highlights keep their detail instead of clipping
        c+=vec3(0.014,0.005,-0.012)*smoothstep(0.5,1.0,l)+vec3(-0.012,0.0,0.022)*(1.0-smoothstep(0.0,0.45,l));
        c*=mix(0.8,1.0,smoothstep(0.92,0.3,length(vUv-0.5)));
        gl_FragColor=vec4(clamp(c,0.0,1.0),1.0);
      }`});
  let rt=null,ba=null,bb=null,W=0,H=0;
  const size=new THREE.Vector2();
  function ensure(){
    renderer.getDrawingBufferSize(size);
    if(rt&&size.x===W&&size.y===H)return;
    W=size.x;H=size.y;[rt,ba,bb].forEach(x=>x&&x.dispose());
    const opt={minFilter:THREE.LinearFilter,magFilter:THREE.LinearFilter,format:THREE.RGBAFormat};
    rt=renderer.capabilities.isWebGL2?new THREE.WebGLMultisampleRenderTarget(W,H,opt):new THREE.WebGLRenderTarget(W,H,opt);
    if(rt.samples!==undefined)rt.samples=4;
    const w=Math.max(2,W>>2),h=Math.max(2,H>>2);
    ba=new THREE.WebGLRenderTarget(w,h,Object.assign({depthBuffer:false},opt));bb=new THREE.WebGLRenderTarget(w,h,Object.assign({depthBuffer:false},opt));
    bright.uniforms.px.value.set(1/w,1/h);blur.uniforms.px.value.set(1/w,1/h);
  }
  const pass=(mat,target)=>{QUAD.material=mat;renderer.setRenderTarget(target);renderer.render(qScene,qCam);};
  GFX.post={final,bright};
  // called by the main loop instead of renderer.render
  renderer.info.autoReset=false;   // count the whole frame, not just the last small pass
  // The shadow map is redrawn every second frame only. It costs about as much as the picture itself,
  // and at 30 updates a second nobody sees the difference.
  renderer.shadowMap.autoUpdate=false;let frameNo=0;
  window.gfxRender=function(){
    renderer.info.reset();
    renderer.shadowMap.needsUpdate=(frameNo++&1)===0||state==='menu';
    if(!gfxFine()||!GFX.ok){renderer.render(scene,camera);return;}
    try{
      ensure();
      renderer.setRenderTarget(rt);renderer.render(scene,camera);
      bright.uniforms.t.value=rt.texture;pass(bright,ba);
      blur.uniforms.t.value=ba.texture;pass(blur,bb);
      final.uniforms.t.value=rt.texture;final.uniforms.b.value=bb.texture;pass(final,null);
    }catch(e){
      // never leave a black screen: fall back to plain drawing for good
      console.warn('Bildeffekte abgeschaltet',e);GFX.ok=false;renderer.setRenderTarget(null);renderer.render(scene,camera);
    }
  };
})();

/* ---------- FPS display: frames per second, time per frame, draw calls ---------- */
(function(){
  const el=document.createElement('div');el.id='fps';el.hidden=true;
  el.style.cssText='position:fixed;left:calc(12px + env(safe-area-inset-left));top:calc(122px + env(safe-area-inset-top));z-index:60;font:700 11px/1.2 ui-monospace,Menlo,monospace;color:#fff;background:rgba(10,20,26,.72);padding:4px 9px;border-radius:8px;pointer-events:none;white-space:nowrap';
  document.body.appendChild(el);
  let on=false;try{on=localStorage.getItem('kk-fps')==='1';}catch(e){}
  if(/[?&#]fps\b/i.test(location.search+location.hash))on=true;
  const btn=$('#fpsToggle'),label=()=>{if(btn){btn.textContent='FPS-Anzeige: '+(on?'an':'aus');btn.setAttribute('aria-pressed',on?'true':'false');}el.hidden=!on;};
  if(btn)btn.addEventListener('click',()=>{on=!on;try{localStorage.setItem('kk-fps',on?'1':'0');}catch(e){}label();});
  label();
  let n=0,t0=performance.now(),worst=0,prev=t0;
  (function tick(now){
    requestAnimationFrame(tick);
    worst=Math.max(worst,now-prev);prev=now;n++;
    if(now-t0<500)return;
    const fps=n*1000/(now-t0);GFX.fps=fps;
    if(on)el.textContent=Math.round(fps)+' FPS · längstes Bild '+Math.round(worst)+' ms · '+renderer.info.render.calls+' Aufrufe · '+Math.round(renderer.info.render.triangles/1000)+'k Dreiecke · '+(gfxFine()?'Schön':'Schnell');
    n=0;t0=now;worst=0;
  })(t0);
})();

/* ---------- Quality switch ---------- */
function gfxApply(){
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,gfxFine()?2:1.5));
  const s=gfxFine()?2048:1024;
  if(sun.shadow.mapSize.x!==s){sun.shadow.mapSize.set(s,s);if(sun.shadow.map){sun.shadow.map.dispose();sun.shadow.map=null;}}
  if(GFX.contact)GFX.contact.visible=gfxFine();
  if(typeof resize==='function')resize();
  const b=$('#gfxToggle');if(b){b.textContent='Grafik: '+(gfxFine()?'Schön':'Schnell');b.setAttribute('aria-pressed',gfxFine()?'true':'false');}
}
function gfxSet(mode,byUser){
  GFX.mode=mode==='schnell'?'schnell':'schoen';
  if(byUser){GFX.chosen=true;try{localStorage.setItem('kk-gfx',GFX.mode);}catch(e){}}
  gfxApply();
}
{const b=$('#gfxToggle');if(b)b.addEventListener('click',()=>gfxSet(gfxFine()?'schnell':'schoen',true));}
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
      if(slow>=2&&gfxFine()&&!GFX.chosen&&!navigator.webdriver){gfxSet('schnell',false);toast('Grafik auf „Schnell“ gestellt, damit es flüssig läuft. Ändern im Menü.',3.5);}
    }
  })(t0);
})();
