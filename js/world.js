/* Kistenkrawall: Gelände, Wasser, Gras, Inseln, Wolken, Deko und Hindernisse, Basen */
'use strict';
/* ---------- Terrain ---------- */
// Mountain colours: snow on flat ground, grey-blue rock on steep slopes and in the chasm, trodden paths
function mountainColor(x,z,h){
  const sl=Math.hypot(hgtRaw(x+0.8,z)-hgtRaw(x-0.8,z),hgtRaw(x,z+0.8)-hgtRaw(x,z-0.8))/1.6;
  const snow=new THREE.Color(0xf3f6fb),rock=new THREE.Color(0x6f7680),deep=new THREE.Color(0x3a4456),ice=new THREE.Color(0xbcd6ea),trail=new THREE.Color(0xb6ab9c);
  const c=snow.clone().lerp(rock,clamp((sl-0.45)/0.6,0,1));
  if(h<-1)c.lerp(deep,clamp((-h-1)/8,0,1));
  if(h>9)c.lerp(snow,clamp((h-9)/6,0,0.8));
  const path=pathDist(x,z);if(path<2.2&&sl<0.5)c.lerp(trail,(1-path/2.2)*0.5);
  for(const b of BASES){const d=Math.hypot(x-b.x,z-b.z);if(d<10)c.lerp(trail,(1-d/10)*0.55);}
  if(sl<0.25&&Math.sin(x*0.7+z*0.3)*Math.cos(z*0.5-x*0.2)>0.75)c.lerp(ice,0.5);
  return c.multiplyScalar(1.02);
}
// Volcano colours: black basalt, grey ash, rusty rock on the cone, a glow where the ground meets the lava
function volcanoColor(x,z,h){
  const sl=Math.hypot(hgtRaw(x+0.8,z)-hgtRaw(x-0.8,z),hgtRaw(x,z+0.8)-hgtRaw(x,z-0.8))/1.6;
  const basalt=new THREE.Color(0x4a4543),ash=new THREE.Color(0x7d756c),rust=new THREE.Color(0x7a4a36),glow=new THREE.Color(0xff6a1c),sand=new THREE.Color(0x2e2b2c),trail=new THREE.Color(0x9a8d7c);
  const patch=Math.sin(x*0.31+z*0.17)*Math.cos(z*0.27-x*0.11);
  const c=basalt.clone().lerp(ash,clamp(0.35+patch*0.5,0,1)).lerp(sand,clamp((sl-0.5)/0.7,0,0.8));
  const path=pathDist(x,z);if(path<2.3)c.lerp(trail,(1-path/2.3)*0.5);
  for(const b of BASES){const d=Math.hypot(x-b.x,z-b.z);if(d<10)c.lerp(trail,(1-d/10)*0.6);}
  const d=Math.hypot(x,z);
  if(d<4.4)c.lerp(rust,clamp((4.4-d)/1.4,0,0.85));
  if(d<1.9)c.lerp(glow,clamp((1.9-d)/0.9,0,0.9));
  if(Math.abs(z)<BANK+3){if(h<-0.5)c.lerp(glow,clamp((-h-0.5)/1.6,0,0.85));}
  else if(h<-0.9)c.lerp(sand,clamp((-h-0.9)/1.2,0,1));
  return c.multiplyScalar(1.05);
}
let lavaMat=null;
(function(){
  const g=new THREE.PlaneGeometry(172,172,176,176);g.rotateX(-Math.PI/2);
  const p=g.attributes.position,cols=[];
  const cA=new THREE.Color(0x5f9e40),cB=new THREE.Color(0x93c45a),cS=new THREE.Color(0xe4d196),cD=new THREE.Color(0xa58f5c),cDirt=new THREE.Color(0xb39a6a);
  for(let i=0;i<p.count;i++){
    const x=p.getX(i),z=p.getZ(i),h=hgtRaw(x,z);p.setY(i,h);
    let c;
    if(MOUNTAIN||VOLCANO){c=MOUNTAIN?mountainColor(x,z,h):volcanoColor(x,z,h);c.offsetHSL(0,0,(srand()-.5)*0.04);cols.push(c.r,c.g,c.b);continue;}
    if(h<-0.9)c=cS.clone().lerp(cD,clamp((-h-1.4)/1.8,0,1));
    else{
      c=cA.clone().lerp(cB,clamp((h+0.8)/1.8,0,1));
      const patch=Math.sin(x*0.31+z*0.17)*Math.cos(z*0.27-x*0.11);
      c.lerp(new THREE.Color(0x4c8a36),clamp(patch,0,1)*0.45);
      const path=pathDist(x,z);
      if(path<2.3)c.lerp(cDirt,(1-path/2.3)*0.55);
      for(const b of BASES){const d=Math.hypot(x-b.x,z-b.z);if(d<10)c.lerp(cDirt,(1-d/10)*0.75);}
      if(h<-0.6)c.lerp(cS,clamp((-h-0.6)/0.3,0,1));
      {const ie=islandE(x,z);if(ie<1.35&&ie>0.6)c.lerp(cS,clamp((ie-0.6)/0.12,0,1));}
    }
    c.offsetHSL(0,0,(srand()-.5)*0.04);c.multiplyScalar(1.1);cols.push(c.r,c.g,c.b);
  }
  g.setAttribute('color',new THREE.Float32BufferAttribute(cols,3));g.computeVertexNormals();
  const m=new THREE.Mesh(g,new THREE.MeshPhongMaterial({vertexColors:true,map:TX.ground,bumpMap:TX.ground,bumpScale:0.35,specular:0x0b0b0b,shininess:6}));m.receiveShadow=true;scene.add(m);
  const wm=new THREE.MeshPhongMaterial({color:0x2f93c0,specular:0xffe2b8,shininess:90,transparent:true,opacity:.88});
  wm.onBeforeCompile=sh=>{
    sh.uniforms.uTime=timeU;
    sh.vertexShader='uniform float uTime;\n'+sh.vertexShader
      .replace('#include <beginnormal_vertex>','vec3 objectNormal=normalize(vec3(-cos(position.x*0.15+uTime)*0.11,sin(position.y*0.2+uTime*1.3)*0.12,1.0));')
      .replace('#include <begin_vertex>','vec3 transformed=vec3(position);transformed.z+=sin(position.x*0.15+uTime)*0.12+cos(position.y*0.2+uTime*1.3)*0.1;');
  };
  if(MOUNTAIN){
    // clouds drifting below the edges make the drop visible
    const cm=new THREE.MeshLambertMaterial({color:0xf2f5fa,emissive:0x8090a0,transparent:true,opacity:.55,depthWrite:false});
    for(const y of [-6,-8.5]){const cl=new THREE.Mesh(new THREE.PlaneGeometry(240,14,1,1),cm);cl.rotation.x=-Math.PI/2;cl.position.y=y;cl.userData.cloudLayer=true;scene.add(cl);}
    return;
  }
  if(VOLCANO){
    wm.color.set(0x1c4f6a);wm.opacity=0.94;   // a dark, deep sea, so the coast reads as a coast
    // lava: slow waves, bright veins drifting between dark crust; it lights itself, fog and shadows barely touch it
    lavaMat=new THREE.MeshPhongMaterial({color:0xe85a14,emissive:0xa02c06,specular:0x000000,shininess:1});
    lavaMat.onBeforeCompile=sh=>{
      sh.uniforms.uTime=timeU;
      sh.vertexShader='uniform float uTime;varying vec2 vLava;\n'+sh.vertexShader
        .replace('#include <begin_vertex>','vec3 transformed=vec3(position);transformed.z+=sin(position.x*0.3+uTime*0.5)*0.07+cos(position.y*0.4+uTime*0.6)*0.06;vLava=(modelMatrix*vec4(position,1.0)).xz;');
      sh.fragmentShader='uniform float uTime;varying vec2 vLava;\n'+sh.fragmentShader.replace('#include <tonemapping_fragment>',
        `float lv=sin(vLava.x*1.5+uTime*0.22+sin(vLava.y*1.1)*1.6)*sin(vLava.y*1.8-uTime*0.17+sin(vLava.x*0.8)*1.4)+0.45*sin(vLava.x*0.4+vLava.y*0.5+uTime*0.12);
        gl_FragColor.rgb=mix(vec3(0.16,0.05,0.03),gl_FragColor.rgb+vec3(0.22,0.1,0.0)*smoothstep(0.6,1.2,lv),smoothstep(-0.15,0.6,lv));
        #include <tonemapping_fragment>`);
    };
    // the stream ends at the coast on both sides; cooled rock marks the mouths (steam: volcano.js)
    const lava=new THREE.Mesh(new THREE.PlaneGeometry(LAVA_END*2,(BANK+3)*2,56,14),lavaMat);
    lava.rotation.x=-Math.PI/2;lava.position.y=-1.2;scene.add(lava);
    const cool=new THREE.MeshLambertMaterial({color:0x2a2625});
    for(const sx of [-1,1])for(let i=0;i<22;i++){
      const r=0.9+srand()*1.5,m=new THREE.Mesh(new THREE.DodecahedronGeometry(r,0),cool);
      m.position.set(sx*(LAVA_END-0.6+srand()*2.2),-1.75+srand()*0.35,(i/21*2-1)*(BANK+2.6)+(srand()-.5));m.rotation.set(srand()*3,srand()*3,srand()*3);m.scale.y=0.6;scene.add(m);
    }
  }
  const w=new THREE.Mesh(new THREE.PlaneGeometry(420,420,130,130),wm);
  w.rotation.x=-Math.PI/2;w.position.y=-1.65;w.receiveShadow=true;scene.add(w);
})();

/* Grass tufts and flowers, instanced; the grass sways in the wind */
(function(){
  const pos=[],col=[];
  for(let i=0;i<5;i++){
    const a=i/5*TAU+srand()*0.6,ox=Math.cos(a)*0.08,oz=Math.sin(a)*0.08,px=-Math.sin(a)*0.05,pz=Math.cos(a)*0.05,h=0.32+srand()*0.25,l=0.16;
    pos.push(ox-px,0,oz-pz, ox+px,0,oz+pz, ox+Math.cos(a)*l,h,oz+Math.sin(a)*l);
    col.push(.55,.62,.45, .55,.62,.45, 1.15,1.2,.9);
  }
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));
  g.setAttribute('color',new THREE.Float32BufferAttribute(col,3));
  const nrm=[];for(let i=0;i<pos.length/3;i++)nrm.push(0,1,0);g.setAttribute('normal',new THREE.Float32BufferAttribute(nrm,3));
  const mat=new THREE.MeshLambertMaterial({vertexColors:true,side:THREE.DoubleSide});
  mat.onBeforeCompile=sh=>{
    sh.uniforms.uTime=timeU;
    sh.vertexShader='uniform float uTime;\n'+sh.vertexShader.replace('#include <begin_vertex>',
      '#include <begin_vertex>\nfloat sway=sin(uTime*1.8+instanceMatrix[3].x*0.35+instanceMatrix[3].z*0.22);transformed.x+=sway*0.09*position.y;transformed.z+=cos(uTime*1.3+instanceMatrix[3].x*0.2)*0.05*position.y;');
  };
  const N=MOUNTAIN?2200:VOLCANO?1500:6500,NF=MOUNTAIN||VOLCANO?0:760,im=new THREE.InstancedMesh(g,mat,N),fl=new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.075,0),new THREE.MeshLambertMaterial({color:0xffffff}),NF);
  const d=new THREE.Object3D(),c=new THREE.Color();let n=0,f=0,tries=0;
  const FLC=[0xfff7e0,0xffd84a,0xff8fb1,0xb9a7ff];
  while((n<N||f<NF)&&tries<70000){
    tries++;const x=(srand()*2-1)*53,z=(srand()*2-1)*53,h=hgtRaw(x,z);
    if(h<-0.7||onBridge(x,z)||(VOLCANO&&Math.abs(z)<BANK+1.5))continue;
    if(BASES.some(b=>Math.hypot(x-b.x,z-b.z)<7.5))continue;
    if(pathDist(x,z)<1.4)continue;
    if(n<N){
      d.position.set(x,h-0.02,z);d.rotation.set(0,srand()*TAU,0);const s=0.7+srand()*0.8;d.scale.set(s,s*(0.8+srand()*0.6),s);d.updateMatrix();
      im.setMatrixAt(n,d.matrix);if(MOUNTAIN)c.setHSL(0.2+srand()*0.06,0.18,0.62+srand()*0.15);else if(VOLCANO)c.setHSL(0.1+srand()*0.05,0.35,0.3+srand()*0.14);else c.setHSL(0.24+srand()*0.07,0.5+srand()*0.2,0.33+srand()*0.12);im.setColorAt(n,c);n++;
    }else if(f<NF){
      d.position.set(x,h+0.24,z);d.rotation.set(0,0,0);d.scale.setScalar(0.8+srand()*0.6);d.updateMatrix();
      fl.setMatrixAt(f,d.matrix);fl.setColorAt(f,c.set(FLC[Math.floor(srand()*FLC.length)]));f++;
    }
  }
  im.count=n;fl.count=f;im.receiveShadow=true;scene.add(im);scene.add(fl);
})();

/* Distant islands out at sea; colours are pre-hazed toward the horizon instead of using fog */
if(!MOUNTAIN)(function(){
  const hz=new THREE.Color(HORIZON);
  const haze=(c,k)=>new THREE.Color(c).lerp(hz,k);
  const spots=[[0.3,120,1],[1.1,150,1.4],[1.75,135,0.8],[2.5,175,1.8],[3.2,128,1.1],[3.9,160,1.5],[4.6,118,0.7],[5.35,190,2.1],[5.9,140,1.0],[2.05,200,1.2]];
  for(const [ang,r,size] of spots){
    const k=clamp((r-105)/110,0.25,0.75);
    const x=Math.cos(ang)*r,z=Math.sin(ang)*r,g=new THREE.Group();g.position.set(x,-1.65,z);g.rotation.y=srand()*3;
    const w=10*size,mat=c=>new THREE.MeshLambertMaterial({color:haze(c,k),fog:false});
    const sand=new THREE.Mesh(new THREE.CylinderGeometry(w*1.15,w*1.3,0.8,18),mat(0xe2cf95));sand.position.y=0.2;g.add(sand);
    const hill=new THREE.Mesh(new THREE.SphereGeometry(w,14,8,0,TAU,0,Math.PI/2),mat(0x5f9a45));hill.scale.y=0.28+srand()*0.35;hill.position.y=0.5;g.add(hill);
    if(size>1.3){const peak=new THREE.Mesh(new THREE.ConeGeometry(w*0.45,w*0.8,7),mat(0x7d8a78));peak.position.set(w*0.15,w*0.4+0.5,-w*0.1);g.add(peak);}
    const nT=Math.round(4+size*5);
    for(let i=0;i<nT;i++){
      const a2=srand()*TAU,rr=srand()*w*0.75,tx=Math.cos(a2)*rr,tz=Math.sin(a2)*rr,th=1.6+srand()*1.4;
      const tr=new THREE.Mesh(new THREE.CylinderGeometry(0.12,0.18,th,5),mat(0x7a5532));tr.position.set(tx,hill.scale.y*w*0.9*(1-rr/w)+th/2,tz);tr.rotation.z=(srand()-.5)*0.4;g.add(tr);
      const cr=new THREE.Mesh(new THREE.IcosahedronGeometry(0.9+srand()*0.6,0),mat(srand()<.5?0x3f8a3a:0x4f9c3e));cr.position.set(tx,tr.position.y+th/2+0.4,tz);g.add(cr);
    }
    if(size>1.6){const lh=new THREE.Group();lh.position.set(-w*0.85,0.6,w*0.3);
      const t=new THREE.Mesh(new THREE.CylinderGeometry(0.6,0.85,5,10),mat(0xf2f2ee));t.position.y=2.5;lh.add(t);
      const band=new THREE.Mesh(new THREE.CylinderGeometry(0.66,0.72,0.9,10),mat(0xd2483c));band.position.y=3;lh.add(band);
      const top=new THREE.Mesh(new THREE.ConeGeometry(0.8,0.9,10),mat(0xd2483c));top.position.y=5.5;lh.add(top);
      g.add(lh);}
    scene.add(g);
  }
})();

/* Drifting clouds that cast moving shadows */
const clouds=[];
(function(){
  const mat=new THREE.MeshLambertMaterial({color:0xffffff,emissive:0x8a9aa8});
  for(let i=0;i<18;i++){
    const g=new THREE.Group();const k=3+Math.floor(srand()*4);
    for(let j=0;j<k;j++){const m=new THREE.Mesh(new THREE.IcosahedronGeometry(2+srand()*2.4,1),mat);m.position.set((j-k/2)*2.6+srand(),srand()*1.2,srand()*2.4-1.2);m.scale.y=0.62;m.castShadow=true;g.add(m);}
    g.position.set((srand()*2-1)*120,32+srand()*8,(srand()*2-1)*100);scene.add(g);clouds.push(g);
  }
})();

/* ---------- Shared geometry / materials ---------- */
const G={
  crate:new THREE.BoxGeometry(1,1,1),
  chute:new THREE.SphereGeometry(1.1,12,6,0,TAU,0,Math.PI/2),
  ring:new THREE.RingGeometry(0.35,0.6,20),
  bullet:new THREE.SphereGeometry(0.11,6,5),
  puff:new THREE.IcosahedronGeometry(0.35,0),
  boom:new THREE.SphereGeometry(1,14,10),
  body:new THREE.CylinderGeometry(0.4,0.48,0.78,14),
  head:new THREE.BoxGeometry(0.66,0.5,0.56),
  visor:new THREE.BoxGeometry(0.52,0.15,0.06),
  plate:new THREE.BoxGeometry(0.4,0.28,0.06),
  ant:new THREE.CylinderGeometry(0.025,0.025,0.36,5),
  bulb:new THREE.SphereGeometry(0.085,8,6),
  leg:new THREE.BoxGeometry(0.2,0.45,0.24),
  foot:new THREE.BoxGeometry(0.24,0.1,0.34),
  arm:new THREE.CylinderGeometry(0.075,0.075,0.5,6),
  hand:new THREE.SphereGeometry(0.1,8,6),
  marker:new THREE.RingGeometry(0.62,0.78,28),
  belt:new THREE.CylinderGeometry(0.49,0.49,0.1,14),
  ear:new THREE.CylinderGeometry(0.11,0.11,0.06,10).rotateZ(Math.PI/2),
  shoulder:new THREE.SphereGeometry(0.17,10,6,0,TAU,0,Math.PI/2),
  blob:new THREE.CircleGeometry(0.62,20).rotateX(-Math.PI/2),
  tracer:new THREE.SphereGeometry(0.08,6,4).scale(1,1,4.5),
  flash:new THREE.SphereGeometry(0.22,8,6),
  debris:new THREE.BoxGeometry(0.16,0.16,0.16),
  scorch:new THREE.CircleGeometry(1,20).rotateX(-Math.PI/2),
  bomb:new THREE.SphereGeometry(0.24,8,6).scale(1,1.7,1)
};
function crateTexture(){
  const c=document.createElement('canvas');c.width=c.height=128;const g=c.getContext('2d');
  for(let i=0;i<4;i++){g.fillStyle=i%2?'#b97d3c':'#cf9552';g.fillRect(0,i*32,128,32);g.fillStyle='rgba(70,35,10,.35)';g.fillRect(0,i*32,128,2);}
  g.strokeStyle='#6d4421';g.lineWidth=12;g.strokeRect(6,6,116,116);
  g.beginPath();g.moveTo(12,12);g.lineTo(116,116);g.stroke();
  g.fillStyle='#6d4421';for(const [x,y] of [[12,12],[116,12],[12,116],[116,116]]){g.beginPath();g.arc(x,y,3,0,TAU);g.fill();}
  const t=new THREE.CanvasTexture(c);return t;
}
const TEAMC=[0xff8a1f,0x1fb5a8];
const M={
  crate:texMat(0xffffff,TX.wood,0.045,{shininess:8}),
  gold:texMat(0xffd257,TX.wood,0.05,{emissive:0x6a4200,specular:0xfff2b0,shininess:70}),
  blau:texMat(0xffffff,(function(){return canvasTex(128,(g,S)=>{
    const n=fbm(S,[32,8]);paintPixels(g,S,(x,y)=>{const k=0.86+n[y*S+x]*0.2;return [c8(58*k),c8(118*k),c8(210*k)];});
    g.strokeStyle='#1d3f78';g.lineWidth=12;g.strokeRect(6,6,S-12,S-12);
    g.strokeStyle='#eef4ff';g.lineWidth=7;g.beginPath();g.arc(64,64,24,0,TAU);g.stroke();
    g.fillStyle='#eef4ff';g.fillRect(61,30,6,68);g.fillRect(30,61,68,6);
    g.fillStyle='#16305c';for(const [x,y] of [[6,6],[S-6,6],[6,S-6],[S-6,S-6]]){g.beginPath();g.arc(x,y,4,0,TAU);g.fill();}
  });})(),0.04,{shininess:30,specular:0x335577}),
  gelb:texMat(0xffffff,(function(){return canvasTex(128,(g,S)=>{
    const n=fbm(S,[32,8]);paintPixels(g,S,(x,y)=>{const k=0.86+n[y*S+x]*0.2;return [c8(236*k),c8(178*k),c8(40*k)];});
    g.save();g.beginPath();g.rect(0,44,S,40);g.clip();g.fillStyle='#262626';
    for(let i=-4;i<12;i++){g.beginPath();g.moveTo(i*20,44);g.lineTo(i*20+10,44);g.lineTo(i*20+30,84);g.lineTo(i*20+20,84);g.fill();}g.restore();
    g.strokeStyle='#5c4300';g.lineWidth=12;g.strokeRect(6,6,S-12,S-12);
    g.fillStyle='#3a2a00';g.beginPath();g.arc(64,24,9,0,TAU);g.fill();g.fillStyle='#e9b02a';g.beginPath();g.arc(64,24,4,0,TAU);g.fill();
  });})(),0.04,{shininess:24,specular:0x554422}),
  goldGlow:new THREE.MeshBasicMaterial({color:0xffd257,transparent:true,opacity:.35,blending:THREE.AdditiveBlending,depthWrite:false}),
  chute:new THREE.MeshLambertMaterial({color:0xfff6e6,side:THREE.DoubleSide}),
  ring:new THREE.MeshBasicMaterial({color:0x000000,transparent:true,opacity:.3,side:THREE.DoubleSide,depthWrite:false}),
  metal:texMat(0xc4cbd0,TX.panel,0.02,{specular:0xdddddd,shininess:80}),
  dark:texMat(0x3a4045,TX.panel,0.02,{specular:0x444444,shininess:35}),
  visor:[new THREE.MeshBasicMaterial({color:0xffe08a}),new THREE.MeshBasicMaterial({color:0xa6fff5})],
  bullet:[new THREE.MeshBasicMaterial({color:0xffd27a,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false}),new THREE.MeshBasicMaterial({color:0x7ffff0,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false})],
  blob:new THREE.MeshBasicMaterial({color:0x000000,transparent:true,opacity:.3,depthWrite:false}),
  glow:[new THREE.MeshBasicMaterial({color:0xff9a3c,transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide}),new THREE.MeshBasicMaterial({color:0x3ee0d1,transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide})],
  pick:new THREE.MeshBasicMaterial({color:0xffe08a,transparent:true,opacity:.8,depthWrite:false,side:THREE.DoubleSide}),
  marker:new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.75,side:THREE.DoubleSide,depthWrite:false})
};

/* ---------- Decor & obstacles ---------- */
const obstacles=[];
const trunkMat=texMat(0x7a5532,TX.bark,0.08,{shininess:4});
const leafMats=[new THREE.MeshLambertMaterial({color:0x3f8a3a}),new THREE.MeshLambertMaterial({color:0x4f9c3e})];
const rockMat=texMat(0xa8a49c,TX.rock,0.12,{flatShading:true,shininess:6});
const bagMat=texMat(0xc8b07a,TX.fabric,0.05,{shininess:3});
const leafPal=[0x3f8a3a,0x4f9c3e,0x5fa845,0x6fae3c,0x8fb648].map(c=>texMat(c,TX.leaf,0.06,{flatShading:true,shininess:10,specular:0x1a2a10}));
const charMat=new THREE.MeshLambertMaterial({color:0x2a2422});
const pineMat=[0x2f6f3f,0x3a7d45].map(c=>texMat(c,TX.leaf,0.06,{flatShading:true,shininess:8}));
function addTree(x,z,block){
  const y=hgt(x,z),g=new THREE.Group();g.position.set(x,y-0.05,z);g.rotation.y=srand()*TAU;
  const s=0.85+srand()*0.55;
  if(VOLCANO&&srand()<0.6){
    // a charred trunk with bare branches
    const t=new THREE.Mesh(new THREE.CylinderGeometry(0.1,0.24,2.6*s,6),charMat);t.position.y=1.3*s;t.rotation.z=(srand()-.5)*0.2;g.add(t);
    for(let i=0;i<3;i++){const b=new THREE.Mesh(new THREE.CylinderGeometry(0.03,0.08,1.1*s,5),charMat);b.position.set(Math.cos(i*2.1)*0.35*s,(1.5+i*0.4)*s,Math.sin(i*2.1)*0.35*s);b.rotation.set(Math.sin(i*2.1)*0.9,0,-Math.cos(i*2.1)*0.9);g.add(b);}
  }else if(srand()<0.38||MOUNTAIN){
    const t=new THREE.Mesh(new THREE.CylinderGeometry(0.13,0.22,1.0*s,6),trunkMat);t.position.y=0.5*s;g.add(t);
    const pm=pineMat[srand()<.5?0:1];
    for(let i=0;i<3;i++){const c=new THREE.Mesh(new THREE.ConeGeometry((1.35-i*0.33)*s,1.5*s,7),pm);c.position.y=(1.25+i*0.85)*s;c.rotation.y=srand();g.add(c);}
  }else{
    const t=new THREE.Mesh(new THREE.CylinderGeometry(0.16,0.27,1.5*s,7),trunkMat);t.position.y=0.75*s;g.add(t);
    const br=new THREE.Mesh(new THREE.CylinderGeometry(0.06,0.1,0.8*s,5),trunkMat);br.position.set(0.25*s,1.35*s,0);br.rotation.z=-0.8;g.add(br);
    const lm=leafPal[Math.floor(srand()*leafPal.length)];
    const blobs=[[0,2.2,0,1.05],[0.65,1.85,0.2,0.72],[-0.55,1.95,-0.25,0.78],[0.1,2.8,0.1,0.7]];
    for(const [bx,by,bz,r] of blobs){const m=new THREE.Mesh(new THREE.IcosahedronGeometry(r*s,1),lm);m.position.set(bx*s,by*s,bz*s);m.scale.y=0.9;g.add(m);}
  }
  g.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});scene.add(g);
  if(block)obstacles.push({x,z,r:0.6});
}
function addRock(x,z,s){
  const m=new THREE.Mesh(new THREE.DodecahedronGeometry(s,0),rockMat);
  m.position.set(x,hgt(x,z)+s*0.35,z);m.rotation.set(srand()*3,srand()*3,srand()*3);m.scale.y=0.75;
  m.castShadow=m.receiveShadow=true;scene.add(m);obstacles.push({x,z,r:s*0.95});
}
const walls=[];
function addBags(x0,z,x1){
  walls.push({a:Math.min(x0,x1),b:Math.max(x0,x1)+0.45,z});
  const n=Math.round(Math.abs(x1-x0)/0.85);
  for(let i=0;i<=n;i++){
    const x=x0+(x1-x0)*i/n;
    for(let l=0;l<2;l++){
      const m=new THREE.Mesh(new THREE.BoxGeometry(0.8,0.34,0.55),bagMat);
      m.position.set(x+(l?0.4:0),hgt(x,z)+0.17+l*0.32,z);m.rotation.y=(srand()-.5)*0.2;
      m.castShadow=m.receiveShadow=true;scene.add(m);
    }
    obstacles.push({x,z,r:0.5,low:true});
  }
}
(function(){
  const placed=[];let tries=0,trees=0,rocks=0;
  while((trees<62||rocks<28)&&tries<5000){
    tries++;
    const x=(srand()*2-1)*50,z=(srand()*2-1)*50;
    if(BASES.some(b=>Math.hypot(x-b.x,z-b.z)<14))continue;
    if(Math.abs(z)<11.5+ZS||pathDist(x,z)<3)continue;
    if(placed.some(p=>Math.hypot(p.x-x,p.z-z)<3.6))continue;
    placed.push({x,z});
    if(trees<62){addTree(x,z,true);trees++;}else{addRock(x,z,0.7+srand()*0.8);rocks++;}
  }
  for(let i=0;i<80;i++){const a=srand()*TAU,r=58+srand()*8,x=Math.cos(a)*r,z=Math.sin(a)*r;if(VOLCANO&&hgtRaw(x,z)<-0.4)continue;addTree(x,z,false);}
  for(const s of [1,-1]){addBags(-10,s*35.5,-4);addBags(4,s*35.5,10);addBags(-26,s*(14+ZS),-21);addBags(21,s*(14+ZS),26);}
  // the river acts like a long wall with gaps at the two bridges
  if(VOLCANO)obstacles.push({x:CRATER.x,z:CRATER.z,r:CRATER.r});   // the cone; volcanoWaypoint in combat.js does the routing
  else walls.push({a:-LIM-4,b:BRIDGES[0]-CW[0],z:0,noA:true},{a:BRIDGES[0]+CW[0],b:BRIDGES[1]-CW[1],z:0},{a:BRIDGES[1]+CW[1],b:LIM+4,z:0,noB:true});
  // reed and stones along the banks
  if(!MOUNTAIN&&!VOLCANO)for(let i=0;i<60;i++){const x=(srand()*2-1)*50,s=srand()<.5?1:-1,z=s*(8.9+srand()*1.3);if(BRIDGES.some(bx=>Math.abs(x-bx)<4))continue;const m=new THREE.Mesh(new THREE.ConeGeometry(0.12,0.9+srand()*0.6,4),leafPal[0]);m.position.set(x,hgtRaw(x,z)+0.4,z);scene.add(m);}
  // bridges
  const plank=texMat(0x9a6a3c,TX.plank,0.05,{shininess:6}),dk=texMat(0x6b4423,TX.plank,0.05,{shininess:6});
  // volcano: four stone bridges, each from a bank over the lava onto the island
  if(VOLCANO){
    const stone=texMat(0x6a625c,TX.rock,0.1,{flatShading:true,shininess:5}),dark=texMat(0x4a4441,TX.rock,0.1,{flatShading:true,shininess:5});
    const z0=4.7,z1=BANK+2.6,len=z1-z0,mid=(z0+z1)/2;
    for(const bx of BRIDGES)for(const side of [-1,1]){
      const cw=crossW(bx),g=new THREE.Group();g.position.set(bx,0,side*mid);
      const n=Math.round(len/0.95);
      for(let i=0;i<n;i++){const p=new THREE.Mesh(new THREE.BoxGeometry(cw*2+0.1,0.5,len/n-0.04),i%2?stone:dark);p.position.set(0,0.15,-len/2+(i+0.5)*len/n);p.castShadow=p.receiveShadow=true;g.add(p);}
      for(const sx of [-cw,cw]){
        const wall=new THREE.Mesh(new THREE.BoxGeometry(0.3,0.5,len),dark);wall.position.set(sx,0.62,0);wall.castShadow=true;g.add(wall);
        for(let k=0;k<=4;k++){const post=new THREE.Mesh(new THREE.BoxGeometry(0.42,0.3,0.42),stone);post.position.set(sx,0.98,-len/2+0.3+k*(len-0.6)/4);post.castShadow=true;g.add(post);}
      }
      for(const pz of [-len*0.18,len*0.22]){const pil=new THREE.Mesh(new THREE.BoxGeometry(cw*2-0.6,4,1.3),dark);pil.position.set(0,-2.05,pz);g.add(pil);
        const arch=new THREE.Mesh(new THREE.BoxGeometry(cw*2-0.2,0.5,2.1),stone);arch.position.set(0,-0.3,pz);g.add(arch);}
      scene.add(g);
    }
  }
  for(const bx of BRIDGES){
    if((MOUNTAIN&&bx>0)||VOLCANO)continue;
    const cw=crossW(bx),pillarH=MOUNTAIN?16:3;
    const g=new THREE.Group();g.position.set(bx,0,0);
    for(const side of [-1,1]){
      for(let i=0;i<9;i++){const p=new THREE.Mesh(new THREE.BoxGeometry(cw*2,0.24,0.78),i%2?plank:dk);p.position.set(0,0.3,side*(2.9+i*0.785));p.castShadow=p.receiveShadow=true;g.add(p);}
      for(const sx of [-(cw-0.05),cw-0.05]){
        const rail=new THREE.Mesh(new THREE.BoxGeometry(0.14,0.14,6.6),dk);rail.position.set(sx,0.99,side*6.1);rail.castShadow=true;g.add(rail);
        for(let k=0;k<4;k++){const post=new THREE.Mesh(new THREE.BoxGeometry(0.16,0.75,0.16),dk);post.position.set(sx,0.64,side*(3.0+k*2.1));post.castShadow=true;g.add(post);}
        for(const sz of [3.3,4.8,6.2,7.6]){const pil=new THREE.Mesh(new THREE.CylinderGeometry(0.22,0.26,pillarH,8),dk);pil.position.set(sx*0.8,0.2-pillarH/2,side*sz);g.add(pil);}
      }
      // two stringers carry the planks, a stone abutment holds the deck where it meets the bank
      for(const sx of [-1.5,1.5]){const beam=new THREE.Mesh(new THREE.BoxGeometry(0.3,0.3,6.9),dk);beam.position.set(sx,0.05,side*6.05);beam.castShadow=true;g.add(beam);}
      const abut=new THREE.Mesh(new THREE.BoxGeometry(cw*2+0.6,2.6,1.3),rockMat);abut.position.set(0,-1.12,side*9.15);abut.castShadow=abut.receiveShadow=true;g.add(abut);
    }
    scene.add(g);
  }
})();


/* Crate islands: blue crates parachute onto the island under the left bridge, yellow onto the right one */
const dropFx=[];
for(const D of DROPS){
  const blue=D.sort==='blau',col=blue?0x3a76d2:0xecb228,out=D.x<0?-1:1,fx=D.x+out*5.1,g=new THREE.Group();
  const mast=new THREE.Mesh(new THREE.CylinderGeometry(0.1,0.13,6,8),M.metal);mast.position.set(fx,hgtRaw(fx,0)+3,0);g.add(mast);
  const flag=new THREE.Mesh(new THREE.PlaneGeometry(1.5,0.95),new THREE.MeshPhongMaterial({color:col,side:THREE.DoubleSide,shininess:10}));flag.position.set(fx+out*0.78,hgtRaw(fx,0)+5.4,0);g.add(flag);
  const beacon=new THREE.Mesh(new THREE.SphereGeometry(0.22,10,8),new THREE.MeshBasicMaterial({color:blue?0xa8d0ff:0xffe08a}));beacon.position.set(fx,hgtRaw(fx,0)+6.1,0);g.add(beacon);
  // a ring of painted stones marks the landing zone colour
  for(let i=0;i<14;i++){const a=i/14*TAU,x=D.x+Math.cos(a)*(VOLCANO?3.6:ISL_RX*0.82),z=Math.sin(a)*(VOLCANO?3.2:ISL_RZ*0.82);if(Math.abs(x-D.x)<1.6)continue;
    const st=new THREE.Mesh(new THREE.DodecahedronGeometry(0.22,0),new THREE.MeshPhongMaterial({color:col,flatShading:true,shininess:20}));st.position.set(x,hgtRaw(x,z)+0.08,z);st.scale.y=0.6;g.add(st);}
  const pal=new THREE.Group();pal.position.set(D.x-out*5.0,hgtRaw(D.x-out*5,0),0.6);
  const trunk=new THREE.Mesh(new THREE.CylinderGeometry(0.1,0.16,2.2,6),trunkMat);trunk.position.y=1.1;trunk.rotation.z=out*0.2;pal.add(trunk);
  const crown=new THREE.Mesh(new THREE.IcosahedronGeometry(0.75,0),leafPal[2]);crown.position.set(out*0.25,2.35,0);crown.scale.y=0.6;pal.add(crown);if(!MOUNTAIN&&!VOLCANO)g.add(pal);
  g.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});
  scene.add(g);dropFx.push({beacon,flag,phase:blue?0:Math.PI});
}
/* Bushes and pebbles scattered over the meadows */
(function(){
  const bush=new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.7,1),leafPal[1],220);
  const peb=new THREE.InstancedMesh(new THREE.DodecahedronGeometry(0.16,0),rockMat,900);
  const d=new THREE.Object3D(),c=new THREE.Color();let nb=0,np=0,tries=0;
  while((nb<220||np<900)&&tries<30000){
    tries++;const x=(srand()*2-1)*51,z=(srand()*2-1)*51,h=hgtRaw(x,z);
    if(h<-0.9||onBridge(x,z))continue;
    if(BASES.some(b=>Math.hypot(x-b.x,z-b.z)<9))continue;
    if(nb<220){
      if(Math.abs(z)<6.5+ZS||pathDist(x,z)<2.5||obstacles.some(o=>Math.hypot(o.x-x,o.z-z)<o.r+1.2))continue;
      d.position.set(x,h+0.25,z);d.rotation.set(srand(),srand()*3,0);const s=0.6+srand()*0.9;d.scale.set(s*1.2,s*0.75,s);d.updateMatrix();
      bush.setMatrixAt(nb,d.matrix);bush.setColorAt(nb,MOUNTAIN?c.setHSL(0.36+srand()*0.05,0.22,0.36+srand()*0.14):VOLCANO?c.setHSL(0.09+srand()*0.05,0.3,0.28+srand()*0.12):c.setHSL(0.27+srand()*0.06,0.45,0.5+srand()*0.2));nb++;
    }else{
      d.position.set(x,h+0.03,z);d.rotation.set(srand()*3,srand()*3,srand()*3);d.scale.setScalar(0.5+srand()*1.4);d.updateMatrix();
      peb.setMatrixAt(np,d.matrix);peb.setColorAt(np,c.setHSL(0.08,0.06,0.55+srand()*0.3));np++;
    }
  }
  bush.count=nb;peb.count=np;bush.castShadow=true;bush.receiveShadow=true;peb.receiveShadow=true;scene.add(bush);scene.add(peb);
})();

/* ---------- Bases: HQ + stacking pads ---------- */
const hqs=[],pads=[];
function makeHQ(team){
  const b=BASES[team],dir=team?-1:1;
  const x=b.x-6,z=b.z+dir*2.2,y=hgt(x,z);
  const g=new THREE.Group();g.position.set(x,y,z);g.rotation.y=team?0:Math.PI;
  const bodyMat=texMat(new THREE.Color(TEAMC[team]).multiplyScalar(.72),TX.panel,0.03,{specular:0x333333,shininess:25,emissive:0x000000});
  const body=new THREE.Mesh(new THREE.BoxGeometry(4.2,2.4,3.4),bodyMat);body.position.y=1.2;g.add(body);
  for(const sx of [-1,1])for(const sz of [-1,1]){const p=new THREE.Mesh(new THREE.BoxGeometry(0.32,2.5,0.32),M.metal);p.position.set(sx*2.05,1.25,sz*1.65);g.add(p);}
  const stripe=new THREE.Mesh(new THREE.BoxGeometry(4.24,0.22,3.44),M.dark);stripe.position.y=0.3;g.add(stripe);
  const lamp=new THREE.Mesh(new THREE.BoxGeometry(0.5,0.18,0.18),M.visor[team]);lamp.position.set(0,1.82,1.76);g.add(lamp);
  const steps=new THREE.Mesh(new THREE.BoxGeometry(1.6,0.2,0.7),M.metal);steps.position.set(0,0.1,2.0);g.add(steps);
  const roof=new THREE.Mesh(new THREE.BoxGeometry(4.7,0.35,3.9),M.metal);roof.position.y=2.55;g.add(roof);
  const door=new THREE.Mesh(new THREE.BoxGeometry(1.2,1.6,0.12),M.dark);door.position.set(0,0.8,1.72);g.add(door);
  for(const s of [-1,1]){const w=new THREE.Mesh(new THREE.BoxGeometry(0.7,0.45,0.1),M.visor[team]);w.position.set(s*1.4,1.6,1.72);g.add(w);}
  const pole=new THREE.Mesh(new THREE.CylinderGeometry(0.06,0.06,3.2,6),M.metal);pole.position.set(1.7,4.2,-1.2);g.add(pole);
  const flag=new THREE.Mesh(new THREE.PlaneGeometry(1.3,0.8,6,1),new THREE.MeshLambertMaterial({color:TEAMC[team],side:THREE.DoubleSide}));
  flag.position.set(2.38,5.35,-1.2);g.add(flag);
  const dish=new THREE.Mesh(new THREE.SphereGeometry(0.55,12,6,0,TAU,0,Math.PI/2.4),M.metal);dish.position.set(-1.3,2.9,-0.6);dish.rotation.x=-0.7;g.add(dish);
  g.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});
  scene.add(g);
  const tur=new THREE.Group();tur.position.set(0,2.75,0.3);g.add(tur);
  const tb=new THREE.Mesh(new THREE.CylinderGeometry(0.55,0.65,0.4,12),M.metal);tb.position.y=0.2;tur.add(tb);
  const th=new THREE.Mesh(new THREE.BoxGeometry(0.7,0.4,0.8),bodyMat);th.position.y=0.55;tur.add(th);
  for(const sx of [-0.15,0.15]){const br=new THREE.Mesh(new THREE.CylinderGeometry(0.07,0.07,1.1,8),M.dark);br.rotation.x=Math.PI/2;br.position.set(sx,0.58,0.8);tur.add(br);}
  tur.traverse(o=>{if(o.isMesh)o.castShadow=true;});
  const hq={team,x,z,r:2.5,g,bodyMat,flag,tur,turCd:0,hp:1200,max:1200,dead:false,smokeT:0};
  hqs.push(hq);
}
function makePad(team){
  const b=BASES[team],x=b.x+5,z=b.z,y=hgt(x,z);
  const g=new THREE.Group();g.position.set(x,y,z);
  const base=new THREE.Mesh(new THREE.BoxGeometry(2.9,0.22,2.9),texMat(0x80878c,TX.diamond,0.04,{specular:0x666666,shininess:50}));base.position.y=0.11;g.add(base);
  const hc=document.createElement('canvas');hc.width=128;hc.height=16;const hx=hc.getContext('2d');
  hx.fillStyle='#22262a';hx.fillRect(0,0,128,16);hx.fillStyle='#'+new THREE.Color(TEAMC[team]).getHexString();
  for(let i=-2;i<10;i++){hx.beginPath();hx.moveTo(i*16,16);hx.lineTo(i*16+8,0);hx.lineTo(i*16+16,0);hx.lineTo(i*16+8,16);hx.fill();}
  const ht=new THREE.CanvasTexture(hc);ht.wrapS=THREE.RepeatWrapping;ht.repeat.set(2,1);
  const edge=new THREE.MeshLambertMaterial({map:ht});
  for(let i=0;i<4;i++){const e=new THREE.Mesh(new THREE.BoxGeometry(3.1,0.26,0.18),edge);e.position.y=0.13;const a=i*Math.PI/2;e.position.x=Math.sin(a)*1.47;e.position.z=Math.cos(a)*1.47;e.rotation.y=a;g.add(e);}
  for(const [sx,sz] of [[-1,-1],[1,-1],[-1,1],[1,1]]){const l=new THREE.Mesh(new THREE.CylinderGeometry(0.12,0.12,0.12,10),M.visor[team]);l.position.set(sx*1.47,0.3,sz*1.47);g.add(l);}
  g.traverse(o=>{if(o.isMesh){o.castShadow=false;o.receiveShadow=true;}});
  const glow=new THREE.Mesh(new THREE.RingGeometry(1.75,2.25,40),M.glow[team]);glow.rotation.x=-Math.PI/2;glow.position.y=0.06;g.add(glow);
  scene.add(g);
  pads.push({team,x,z,top:y+0.22,stack:[],glow});
}
makeHQ(0);makeHQ(1);makePad(0);makePad(1);
const SLOT=[[-0.52,-0.52],[0.52,-0.52],[-0.52,0.52],[0.52,0.52]];
