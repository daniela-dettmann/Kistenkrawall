/* Kistenkrawall: Weihnachtsmarkt (Auftrag „Zwei neue Karten“, Karte 9). Nur aktiv, wenn MAP === 'weihnachtsmarkt';
   die Karte gibt es nur in der Weihnachtszeit (core.js: MARKET, MARKET_OFF). Grundriss und Kistenplätze stehen als
   Daten in core.js (URB.stalls), die Wegfindung macht urban.js. Hier entstehen:
   - Holzbuden mit Satteldach, Schnee auf dem Dach, Theke, Waren, Schild und Lichterkette; über Glühwein- und
     Würstchenbuden steigt Dampf auf.
   - Der große Weihnachtsbaum in der Mitte (Kugeln, Stern und Schneehauben kommen aus xmas.js), Lichterspirale.
   - Zwei Lebkuchenhäuser neben den Basen, ein Holzzaun ums Spielfeld, Fachwerkhäuser rundherum.
   - Riesenrad (dreht sich, Gondeln bleiben waagerecht) und Karussell (dreht sich, Pferde wippen) hinter dem Zaun:
     nur Kulisse.
   - Marktbesucher spazieren außen um den Zaun (nur Kulisse: nicht treffbar, kein Hindernis).
   - Außerhalb der Saison: Hinweis, dass diese Runde noch zu Ende gespielt wird. */
'use strict';
if(MARKET)(function(){
  const lightPts=[];
  const add=(m,stat)=>{m.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});scene.add(m);if(stat!==false)STATIC_ROOTS.push(m);return m;};
  for(const b of birds)b.g.visible=false;   // no gulls over the market in winter
  MOOD.hor=[new THREE.Color(0xe8e6ee),new THREE.Color(0xeccfbf)];
  scene.fog.near=46;scene.fog.far=150;

  /* ---------- materials ---------- */
  const wood=texMat(0x9a6a3c,TX.plank,0.05,{shininess:6}),woodDark=texMat(0x6b4423,TX.plank,0.05,{shininess:6});
  const snowM=new THREE.MeshLambertMaterial({color:0xf6f9ff,emissive:0x1a2230});
  const roofCols=[0x8a2b22,0x2d5a3a,0x6b4423,0x8a2b22,0x7a3a2a,0x2d4a6a,0x8a6a22];
  const roofM=roofCols.map(c=>texMat(c,TX.plank,0.05,{shininess:5}));
  const ginger=new THREE.MeshPhongMaterial({color:0xa8642e,shininess:14}),icing=new THREE.MeshLambertMaterial({color:0xffffff});
  const candy=[0xd62828,0x3fa0ff,0x3fd46a,0xffd24a].map(c=>new THREE.MeshPhongMaterial({color:c,shininess:60}));
  // a gable roof: a triangular prism, ridge along x, w wide, d deep, h high
  function gable(w,d,h){
    const s=new THREE.Shape([new THREE.Vector2(-d/2,0),new THREE.Vector2(d/2,0),new THREE.Vector2(0,h)]);
    const g=new THREE.ExtrudeGeometry(s,{depth:w,bevelEnabled:false});g.translate(0,0,-w/2);g.rotateY(Math.PI/2);return g;
  }
  const SIGN={gluehwein:['Glühwein','#8a1f1f'],wurst:['Würstchen','#6b3a12'],lebkuchen:['Lebkuchen','#7a4a1e'],mandeln:['Gebr. Mandeln','#8a5a12'],
    crepes:['Crêpes','#9a3050'],handwerk:['Kunsthandwerk','#2f5a2a'],deko:['Weihnachtsdeko','#2a4a7a']};
  const signTex={},matCache={},lam=c=>matCache[c]||(matCache[c]=new THREE.MeshLambertMaterial({color:c}));
  for(const k in SIGN){const [t,c]=SIGN[k];signTex[k]=canvasTex(128,(g,S)=>{g.fillStyle=c;g.fillRect(0,0,S,S);g.strokeStyle='#f3d38a';g.lineWidth=6;g.strokeRect(4,4,S-8,S-8);
    g.fillStyle='#fff5dc';g.font='bold '+(t.length>10?17:22)+'px sans-serif';g.textAlign='center';g.textBaseline='middle';g.fillText(t,S/2,S/2);});signTex[k]=new THREE.MeshBasicMaterial({map:signTex[k]});}
  const goodsCols={gluehwein:[0xb02020,0xf0f0f0],wurst:[0x9a4a20,0xd8a050],lebkuchen:[0xa8642e,0xd62828],mandeln:[0xc08040,0xf2e0b0],crepes:[0xf2d090,0xff8fb1],handwerk:[0x8a6a44,0x3fa0ff],deko:[0xd62828,0xffd24a]};

  /* ---------- night look: lamp glass, stall interiors and house windows glow after dusk ---------- */
  const lampM=new THREE.MeshBasicMaterial({color:0xf2e6c8}),insideM=new THREE.MeshBasicMaterial({color:0x7a5a3a}),winM=new THREE.MeshBasicMaterial({color:0x5a6a80});
  const warmPts=[];   // glow halos (one Points object), only visible from dusk on
  // a box with UVs in metres, so the wood grain stays fine on long stalls
  function sBox(w,h,d,cell){
    const geo=new THREE.BoxGeometry(w,h,d),uv=geo.attributes.uv,dims=[[d,h],[d,h],[w,d],[w,d],[w,h],[w,h]];
    for(let f=0;f<6;f++)for(let v=0;v<4;v++){const i=f*4+v;uv.setXY(i,uv.getX(i)*dims[f][0]/cell,uv.getY(i)*dims[f][1]/cell);}
    return geo;
  }
  const garl=[],bows=[],stars=[],goods=[];   // instanced afterwards: fir garland, red bows, little stars
  const WARM=0xffe2a8;

  /* ---------- stalls ---------- */
  // All stalls are baked into a few meshes, one per material (the roofs share one with vertex colours): far fewer
  // draw calls than the generic merging per map quarter, which matters because the market is always lit at night.
  const bake=new Map(),roofAll=texMat(0xffffff,TX.plank,0.05,{shininess:5,vertexColors:true}),noShadow=new Set();
  function bakeStall(g){
    g.traverse(o=>{if(!o.isMesh)return;const rc=roofM.includes(o.material)?o.material.color:null,key=rc?roofAll:o.material;
      let B=bake.get(key);if(!B)bake.set(key,B={pos:[],nor:[],uv:[],col:[]});
      const geo=(o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone()).applyMatrix4(o.matrixWorld),n=geo.attributes.position.count;
      B.pos.push(...geo.attributes.position.array);B.nor.push(...geo.attributes.normal.array);
      if(geo.attributes.uv)B.uv.push(...geo.attributes.uv.array);else for(let i=0;i<n;i++)B.uv.push(0,0);
      if(rc)for(let i=0;i<n;i++)B.col.push(rc.r,rc.g,rc.b);geo.dispose();});
    scene.remove(g);
  }
  function bakeDone(){
    for(const [mat,B] of bake){const geo=new THREE.BufferGeometry();
      geo.setAttribute('position',new THREE.Float32BufferAttribute(B.pos,3));geo.setAttribute('normal',new THREE.Float32BufferAttribute(B.nor,3));geo.setAttribute('uv',new THREE.Float32BufferAttribute(B.uv,2));
      if(B.col.length)geo.setAttribute('color',new THREE.Float32BufferAttribute(B.col,3));
      const m=new THREE.Mesh(geo,mat);m.receiveShadow=true;m.castShadow=!noShadow.has(mat);m.matrixAutoUpdate=false;scene.add(m);}
    URB.stallMeshes=bake.size;
  }
  URB.steam=[];
  URB.stalls.forEach((t,si)=>{
    const along=Math.abs(t.face[1])>0,W=along?t.w:t.d,D=along?t.d:t.w,H=2.3+((si*37)%5)*0.1,rh=0.95+((si*13)%3)*0.22,g=new THREE.Group();
    t.eave=0.32+H;t.W=W;t.D=D;
    g.position.set(t.x,0.32,t.z);g.rotation.y=Math.atan2(t.face[0],t.face[1]);   // local +z faces the customers
    const back=new THREE.Mesh(sBox(W,H,0.18,1.2),woodDark);back.position.set(0,H/2,-D/2+0.09);g.add(back);
    for(const s of [-1,1]){const side=new THREE.Mesh(sBox(0.18,H,D,1.2),woodDark);side.position.set(s*(W/2-0.09),H/2,0);g.add(side);}
    const inside=new THREE.Mesh(new THREE.PlaneGeometry(W-0.6,1.3),insideM);inside.position.set(0,1.55,-D/2+0.19);g.add(inside);
    const counter=new THREE.Mesh(sBox(W-0.4,1.05,0.7,1.2),wood);counter.position.set(0,0.52,D/2-0.4);g.add(counter);
    const shelf=new THREE.Mesh(sBox(W-0.6,0.1,0.6,1.2),wood);shelf.position.set(0,1.5,-D/2+0.5);g.add(shelf);
    const rm=roofM[si%roofM.length],RD=D+0.9,RW=W+0.5;
    const roof=new THREE.Mesh(gable(RW,RD,rh),rm);roof.position.y=H;g.add(roof);
    // a thin layer of snow on both slopes of the roof (not a block)
    const a=Math.atan2(rh,RD/2),L=Math.hypot(RD/2,rh);
    for(const s of [-1,1]){const f=0.55,sn=new THREE.Mesh(new THREE.BoxGeometry(RW+0.04,0.07,L*f),snowM);sn.position.set(0,H+rh*(1-f/2)+0.06,s*RD/2*f/2);sn.rotation.x=s*a;g.add(sn);}   // snow on the upper half of each slope
    // decorated gable ends: a light board with a small wooden star at the tip
    const tri=new THREE.ShapeGeometry(new THREE.Shape([new THREE.Vector2(-RD/2+0.15,0),new THREE.Vector2(RD/2-0.15,0),new THREE.Vector2(0,rh-0.1)]));
    for(const s of [-1,1]){const gb=new THREE.Mesh(tri,wood);gb.position.set(s*(RW/2+0.01),H+0.02,0);gb.rotation.y=s*Math.PI/2;g.add(gb);}
    const fascia=new THREE.Mesh(sBox(RW,0.16,0.06,1.2),wood);fascia.position.set(0,H-0.02,RD/2);g.add(fascia);
    const sign=new THREE.Mesh(new THREE.PlaneGeometry(Math.min(W-0.6,3.2),0.8),signTex[t.kind]);sign.position.set(0,H+0.42,D/2+0.42);sign.rotation.x=-0.12;g.add(sign);
    const gc=goodsCols[t.kind];
    // lanterns on the front corners
    for(const s of [-1,1]){const ln=new THREE.Mesh(new THREE.BoxGeometry(0.22,0.3,0.22),lampM);ln.position.set(s*(W/2+0.02),H-0.42,D/2+0.3);g.add(ln);
      const hk=new THREE.Mesh(new THREE.BoxGeometry(0.04,0.3,0.04),woodDark);hk.position.set(s*(W/2+0.02),H-0.12,D/2+0.3);g.add(hk);}
    scene.add(g);g.updateMatrixWorld(true);bakeStall(g);   // before localToWorld: otherwise the lights land round the middle of the square
    const W2=v=>{g.localToWorld(v);return v;};
    // goods on the counter and the shelf (collected, drawn as two instanced meshes)
    for(let i=0;i<Math.round(W*1.6);i++)goods.push({p:W2(new THREE.Vector3(-W/2+0.5+(W-1)*(i+0.5)/Math.round(W*1.6),1.17+(i%2?0.11:0.13),D/2-0.4+((i%3)-1)*0.15)),box:i%2===1,s:i%2?0.22:0.26,c:gc[i%2],ry:g.rotation.y});
    for(let i=0;i<Math.round(W*1.2);i++)goods.push({p:W2(new THREE.Vector3(-W/2+0.6+(W-1.2)*i/Math.max(1,Math.round(W*1.2)-1),1.69,-D/2+0.5)),box:true,s:0.2,sy:1.4,c:gc[(i+1)%2],ry:g.rotation.y});
    // a fir garland along the front eave, hanging in loops between hooks, warm lights on it, a red bow in the middle
    const loops=Math.max(2,Math.round(W/1.3)),n=loops*7,z0=RD/2+0.02;
    for(let i=0;i<=n;i++){const u=i/n,lx=-RW/2+0.1+(RW-0.2)*u,sag=Math.abs(Math.sin(u*Math.PI*loops))*0.2,v=W2(new THREE.Vector3(lx,H-0.08-sag,z0));
      garl.push(v);if(i%2===0){const b=W2(new THREE.Vector3(lx,H-0.16-sag,z0+0.08));lightPts.push([b.x,b.y,b.z,WARM,0.55]);}}
    bows.push(W2(new THREE.Vector3(0,H-0.12,z0+0.1)));
    stars.push({p:W2(new THREE.Vector3(0,H+0.98,D/2+0.42)),ry:g.rotation.y});warmPts.push(stars[stars.length-1].p.clone());
    for(const s of [-1,1])warmPts.push(W2(new THREE.Vector3(s*(W/2+0.02),H-0.42,D/2+0.3)));
    if(t.kind==='gluehwein'||t.kind==='wurst'){const v=W2(new THREE.Vector3(0,1.4,D/2-0.4));URB.steam.push({x:v.x,y:v.y,z:v.z,t:Math.random(),c:t.kind==='wurst'?0xd8d2c8:0xf2f2f2});}
  });
  for(const m of [insideM,lampM,snowM,...Object.values(signTex)])noShadow.add(m);   // small or flat parts cast no shadow
  bakeDone();
  {const d=new THREE.Object3D();
   const gm=new THREE.InstancedMesh(new THREE.DodecahedronGeometry(0.09,0),new THREE.MeshLambertMaterial({color:0x2f6a32}),garl.length);
   garl.forEach((p,i)=>{d.position.copy(p);d.rotation.set(i*1.3,i*0.7,0);d.scale.set(1.3,1,1.3);d.updateMatrix();gm.setMatrixAt(i,d.matrix);});scene.add(gm);
   const bm=new THREE.InstancedMesh(new THREE.SphereGeometry(0.15,8,6),new THREE.MeshLambertMaterial({color:0xc8202a}),bows.length);
   bows.forEach((p,i)=>{d.rotation.set(0,0,0);d.scale.set(1.3,0.8,0.6);d.position.copy(p);d.updateMatrix();bm.setMatrixAt(i,d.matrix);});scene.add(bm);
   const sm=new THREE.InstancedMesh(new THREE.OctahedronGeometry(0.3,0),lampM,stars.length);
   stars.forEach((s,i)=>{d.position.copy(s.p);d.rotation.set(0,s.ry,0);d.scale.set(1,1,0.35);d.updateMatrix();sm.setMatrixAt(i,d.matrix);});scene.add(sm);
   URB.garland=gm;
   const c=new THREE.Color();
   for(const box of [true,false]){const list=goods.filter(o=>o.box===box),im=new THREE.InstancedMesh(box?new THREE.BoxGeometry(1,1,1):new THREE.SphereGeometry(0.5,8,6),new THREE.MeshLambertMaterial({color:0xffffff}),list.length);
     list.forEach((o,i)=>{d.position.copy(o.p);d.rotation.set(0,o.ry,0);d.scale.set(o.s,o.s*(o.sy||1),o.s);d.updateMatrix();im.setMatrixAt(i,d.matrix);im.setColorAt(i,c.set(o.c));});
     im.castShadow=true;im.receiveShadow=true;scene.add(im);}}

  /* ---------- lantern posts round the square, light strings from the tree top down to them and across the alleys ---------- */
  URB.strings=[];const stringPts=[];
  function string(a,b,sag,step){URB.strings.push({a:a.clone(),b:b.clone()});const n=Math.max(2,Math.round(a.distanceTo(b)/(step||0.45)));
    for(let k=1;k<n;k++){const u=k/n,p=a.clone().lerp(b,u);p.y-=Math.sin(u*Math.PI)*sag;stringPts.push(p);}}
  URB.posts=[];
  {const postM=new THREE.MeshLambertMaterial({color:0x26282c}),g=new THREE.Group(),top=new THREE.Vector3(0,11.2,0);
   for(let i=0;i<8;i++){const a=i/8*TAU+TAU/16,x=Math.cos(a)*12.5,z=Math.sin(a)*12.5;
     const post=new THREE.Mesh(new THREE.CylinderGeometry(0.08,0.13,3.7,8),postM);post.position.set(x,0.32+1.85,z);g.add(post);
     const foot=new THREE.Mesh(new THREE.CylinderGeometry(0.22,0.26,0.3,8),postM);foot.position.set(x,0.47,z);g.add(foot);
     const lamp=new THREE.Mesh(new THREE.BoxGeometry(0.38,0.48,0.38),lampM);lamp.position.set(x,0.32+3.95,z);g.add(lamp);
     const cap=new THREE.Mesh(new THREE.ConeGeometry(0.36,0.32,4),postM);cap.position.set(x,0.32+4.35,z);cap.rotation.y=Math.PI/4;g.add(cap);
     URB.posts.push({x,z,top:0.32+4.5});obstacles.push({x,z,r:0.25});warmPts.push(new THREE.Vector3(x,0.32+3.95,z));
     string(top,new THREE.Vector3(x,0.32+4.5,z),1.1);}
   add(g);}
  // between the two outer rows of stalls on each side: strings from eave to eave over the alley
  for(const sx of [-1,1])for(const sz of [-1,1]){
    const A=URB.stalls.find(t=>t.x===sx*30&&t.z===sz*20),B=URB.stalls.find(t=>t.x===sx*30&&t.z===sz*30);
    for(const x of [25.5,30,34.5])string(new THREE.Vector3(sx*x,A.eave-0.1,sz*(20+A.D/2+0.47)),new THREE.Vector3(sx*x,B.eave-0.1,sz*(30-B.D/2-0.47)),0.35,0.4);
  }
  {const im=new THREE.InstancedMesh(new THREE.SphereGeometry(0.06,6,4),new THREE.MeshBasicMaterial({color:WARM}),stringPts.length),d=new THREE.Object3D();
   stringPts.forEach((p,i)=>{d.position.copy(p);d.updateMatrix();im.setMatrixAt(i,d.matrix);});im.frustumCulled=false;scene.add(im);URB.stringLights=im;
   stringPts.forEach((p,i)=>{if(i%4===0)warmPts.push(p);});}

  /* ---------- the big tree ---------- */
  {const tr=new THREE.Group();tr.position.set(0,0.32,0);
   const trunk=new THREE.Mesh(new THREE.CylinderGeometry(0.45,0.6,1.6,10),trunkMat);trunk.position.y=0.8;tr.add(trunk);
   for(let i=0;i<5;i++){const c=new THREE.Mesh(new THREE.ConeGeometry(3.3-i*0.58,2.6,12),pineMat[i%2]);c.position.y=2.4+i*1.75;tr.add(c);}
   const star=new THREE.Mesh(new THREE.OctahedronGeometry(0.7,0),new THREE.MeshBasicMaterial({color:0xffe27a}));star.position.y=11.6;tr.add(star);URB.star=star;
   const base=new THREE.Mesh(new THREE.CylinderGeometry(2.6,2.8,0.5,20),woodDark);base.position.y=0.25;tr.add(base);
   add(tr);
   // the light spiral lies on the branches: at each height the radius of the widest tier there (the tiers are
   // cones 2.6 high), a little inside, so no bulb hangs in the air beside the tree
   const tierR=y=>{let r=0;for(let i=0;i<5;i++){const c=2.4+i*1.75,t=(c+1.3-y)/2.6;if(t>=0&&t<=1)r=Math.max(r,(3.3-i*0.58)*t);}return r;};
   for(let i=0;i<140;i++){const a=i*0.62,y=1.3+i/140*9.4,r=tierR(y)*0.94;if(r<0.25)continue;lightPts.push([Math.cos(a)*r,0.32+y,Math.sin(a)*r]);}
   // presents round the foot of the tree
   for(let i=0;i<10;i++){const a=i/10*TAU+0.2,r=2.9,s=0.4+(i%3)*0.12,p=new THREE.Mesh(new THREE.BoxGeometry(s,s,s),candy[i%4]);p.position.set(Math.cos(a)*r,0.32+s/2,Math.sin(a)*r);p.rotation.y=a;add(p);}}

  /* ---------- gingerbread houses ---------- */
  for(const b of URB.boxes){if(b.k!=='ginger')continue;
    const cx=(b.x0+b.x1)/2,cz=(b.z0+b.z1)/2,w=b.x1-b.x0,d=b.z1-b.z0,g=new THREE.Group();g.position.set(cx,0.32,cz);g.rotation.y=cz>0?Math.PI:0;
    const body=new THREE.Mesh(new THREE.BoxGeometry(w,3.4,d),ginger);body.position.y=1.7;g.add(body);
    const roof=new THREE.Mesh(gable(w+0.8,d+1.0,2.8),ginger);roof.position.y=3.4;g.add(roof);
    for(const s of [-1,1]){const sn=new THREE.Mesh(new THREE.BoxGeometry(w+0.9,0.2,Math.hypot(d/2+0.5,2.8)+0.1),icing);sn.position.set(0,3.4+1.5,s*(d/4+0.25));sn.rotation.x=s*Math.atan2(2.8,d/2+0.5);g.add(sn);}
    const door=new THREE.Mesh(new THREE.BoxGeometry(1.3,2.0,0.1),new THREE.MeshLambertMaterial({color:0x5a3010}));door.position.set(0,1.0,d/2+0.03);g.add(door);
    for(const s of [-1,1]){const win=new THREE.Mesh(new THREE.BoxGeometry(1.0,1.0,0.08),new THREE.MeshBasicMaterial({color:0xffd27a}));win.position.set(s*2,2.0,d/2+0.04);g.add(win);
      const fr=new THREE.Mesh(new THREE.BoxGeometry(1.2,0.12,0.12),icing);fr.position.set(s*2,2.55,d/2+0.06);g.add(fr);}
    for(let i=0;i<12;i++){const c=new THREE.Mesh(new THREE.SphereGeometry(0.2,8,6),candy[i%4]);c.position.set(-w/2+0.4+(w-0.8)*i/11,3.25,d/2+0.12);g.add(c);}
    const band=new THREE.Mesh(new THREE.BoxGeometry(w+0.1,0.18,d+0.1),icing);band.position.y=3.38;g.add(band);
    const chim=new THREE.Mesh(new THREE.BoxGeometry(0.8,1.6,0.8),ginger);chim.position.set(w/4,5.2,-0.6);g.add(chim);
    add(g);
    for(let i=0;i<=12;i++){const v=new THREE.Vector3(-w/2-0.3+(w+0.6)*i/12,3.5,d/2+0.55);g.updateMatrixWorld(true);g.localToWorld(v);lightPts.push([v.x,v.y,v.z]);}
  }

  /* ---------- fence round the field, half-timbered houses beyond ---------- */
  {const L=LIM+1.2,g=new THREE.Group();
   for(const [ax,az,bx,bz] of [[-L,-L,L,-L],[L,-L,L,L],[L,L,-L,L],[-L,L,-L,-L]]){
     const len=Math.hypot(bx-ax,bz-az),n=Math.round(len/2.4),ang=Math.atan2(bx-ax,bz-az);
     for(let i=0;i<=n;i++){const t=i/n,p=new THREE.Mesh(new THREE.BoxGeometry(0.16,1.1,0.16),woodDark);p.position.set(ax+(bx-ax)*t,0.87,az+(bz-az)*t);g.add(p);}
     for(const y of [0.6,1.05]){const r=new THREE.Mesh(new THREE.BoxGeometry(0.08,0.1,len),wood);r.position.set((ax+bx)/2,0.32+y,(az+bz)/2);r.rotation.y=ang;g.add(r);}}
   add(g);
   // half-timbered houses all round, facing the market: coloured plaster, dark beams with braces, windows that
   // light up in the evening, a gable with a little window, snow on the roof; a church tower in the north
   const walls=[0xe8c9a0,0xd9a9a0,0xc9d2b0,0xeadfc8,0xb9c8d8,0xe0b890].map(c=>({c}));
   const beam={c:0x4a3020},tile={c:0x8a3a2a},door={c:0x5a3010},snowC={c:0xf6f9ff},winC={win:true};
   const hParts=[],hWins=[],hRoots=[];   // all houses are baked into two meshes: a vertex-coloured body and the windows
   for(let i=0;i<40;i++){const a=i/40*TAU,r=84+((i*7)%4)*3,x=Math.cos(a)*r,z=Math.sin(a)*r;if(Math.abs(x)<9&&z<-80)continue;   // room for the church
     const w=8+(i%3)*2,h=7+((i*5)%4)*1.5,hs=new THREE.Group(),F=3.52,wm=walls[(i*5)%walls.length];hs.position.set(x,0.3,z);hs.rotation.y=-a-Math.PI/2;   // local +z faces the market
     const b2=new THREE.Mesh(new THREE.BoxGeometry(w,h,7),wm);b2.position.y=h/2;hs.add(b2);
     for(const k of [-0.5,-1/6,1/6,0.5]){const bm=new THREE.Mesh(new THREE.BoxGeometry(0.28,h,0.1),beam);bm.position.set(k*(w-0.28),h/2,F);hs.add(bm);}
     for(const y of [0.15,h*0.5,h-0.15]){const hb=new THREE.Mesh(new THREE.BoxGeometry(w,0.26,0.1),beam);hb.position.set(0,y,F);hs.add(hb);}
     for(const k of [-1,1]){const L2=Math.hypot(w/3,h*0.5-0.3),br=new THREE.Mesh(new THREE.BoxGeometry(0.2,L2,0.08),beam);br.position.set(k*w/3,h*0.75,F+0.01);br.rotation.z=k*Math.atan2(w/3,h*0.5-0.3);hs.add(br);}
     for(const s2 of [-1,0,1])for(const y of [h*0.3,h*0.75]){if(s2===0&&y<h*0.5)continue;const wi=new THREE.Mesh(new THREE.BoxGeometry(1,1.1,0.1),winC);wi.position.set(s2*w/3,y,F+0.03);hs.add(wi);}
     const dr=new THREE.Mesh(new THREE.BoxGeometry(1.3,2.2,0.1),door);dr.position.set(0,1.1,F+0.03);hs.add(dr);
     const RW2=w+0.6,ra=Math.atan2(4,RW2/2),RL=Math.hypot(RW2/2,4);
     const rf=new THREE.Mesh(gable(7.6,RW2,4),tile);rf.rotation.y=Math.PI/2;rf.position.y=h;hs.add(rf);
     const gt=new THREE.Mesh(new THREE.ShapeGeometry(new THREE.Shape([new THREE.Vector2(-w/2,0),new THREE.Vector2(w/2,0),new THREE.Vector2(0,4*w/RW2)])),wm);gt.position.set(0,h,3.81);hs.add(gt);
     const gw=new THREE.Mesh(new THREE.BoxGeometry(0.8,0.9,0.1),winC);gw.position.set(0,h+1.2,3.83);hs.add(gw);
     for(const s2 of [-1,1]){const sn=new THREE.Mesh(new THREE.BoxGeometry(RL*0.9,0.12,7.8),snowC);sn.position.set(s2*RW2/4*1.02,h+2.08,0);sn.rotation.z=-s2*ra;hs.add(sn);}
     hRoots.push(hs);}
   {const pos=[],nor=[],col=[],wpos=[],wnor=[],c=new THREE.Color();
    for(const hs of hRoots){hs.updateMatrixWorld(true);hs.traverse(o=>{if(!o.isMesh)return;const g=(o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone()).applyMatrix4(o.matrixWorld);
      if(o.material.win){wpos.push(...g.attributes.position.array);wnor.push(...g.attributes.normal.array);}
      else{pos.push(...g.attributes.position.array);nor.push(...g.attributes.normal.array);c.set(o.material.c);for(let i=0;i<g.attributes.position.count;i++)col.push(c.r,c.g,c.b);}g.dispose();});}
    const body=new THREE.BufferGeometry();body.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));body.setAttribute('normal',new THREE.Float32BufferAttribute(nor,3));body.setAttribute('color',new THREE.Float32BufferAttribute(col,3));
    const bm=new THREE.Mesh(body,new THREE.MeshLambertMaterial({vertexColors:true}));bm.receiveShadow=true;scene.add(bm);
    const wg=new THREE.BufferGeometry();wg.setAttribute('position',new THREE.Float32BufferAttribute(wpos,3));wg.setAttribute('normal',new THREE.Float32BufferAttribute(wnor,3));
    scene.add(new THREE.Mesh(wg,winM));URB.houses=bm;}
   {const ch=new THREE.Group(),stone=new THREE.MeshLambertMaterial({color:0xd8d0c0});ch.position.set(0,0.3,-92);
    const tw=new THREE.Mesh(new THREE.BoxGeometry(7,24,7),stone);tw.position.y=12;ch.add(tw);
    const sp=new THREE.Mesh(new THREE.ConeGeometry(5.2,12,4),new THREE.MeshLambertMaterial({color:0x3a5a4a}));sp.position.y=30;sp.rotation.y=Math.PI/4;ch.add(sp);
    const clock=new THREE.Mesh(new THREE.CircleGeometry(1.5,20),new THREE.MeshLambertMaterial({color:0xf2e8c8}));clock.position.set(0,19,3.52);ch.add(clock);
    for(const y of [6,12])for(const s2 of [-1,1]){const wi=new THREE.Mesh(new THREE.BoxGeometry(1.2,2.6,0.1),winM);wi.position.set(s2*1.6,y,3.53);ch.add(wi);}
    const cr=new THREE.Mesh(new THREE.BoxGeometry(0.3,2.4,0.3),lampM);cr.position.y=37;ch.add(cr);const cb=new THREE.Mesh(new THREE.BoxGeometry(1.4,0.3,0.3),lampM);cb.position.y=37.5;ch.add(cb);
    scene.add(ch);STATIC_ROOTS.push(ch);}}

  /* ---------- Ferris wheel (east) and carousel (west), outside the fence ---------- */
  // merge the meshes inside a group into one mesh per material (in the group's own space): the rides keep turning,
  // but cost a handful of draw calls instead of over a hundred
  function mergeLocal(root){
    root.updateMatrixWorld(true);const inv=new THREE.Matrix4().copy(root.matrixWorld).invert(),by=new Map(),gone=[];
    root.traverse(o=>{if(!o.isMesh||o.isInstancedMesh||o===root)return;let B=by.get(o.material);if(!B)by.set(o.material,B=[]);
      B.push((o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone()).applyMatrix4(new THREE.Matrix4().multiplyMatrices(inv,o.matrixWorld)));gone.push(o);});
    for(const o of gone)o.parent.remove(o);
    for(const [mat,list] of by){const pos=[],nor=[],uv=[];for(const g of list){pos.push(...g.attributes.position.array);nor.push(...g.attributes.normal.array);
        if(g.attributes.uv)uv.push(...g.attributes.uv.array);else for(let i=0;i<g.attributes.position.count;i++)uv.push(0,0);g.dispose();}
      const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));geo.setAttribute('normal',new THREE.Float32BufferAttribute(nor,3));geo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));
      const m=new THREE.Mesh(geo,mat);m.castShadow=true;m.receiveShadow=true;root.add(m);}
  }
  const wheel={g:new THREE.Group(),rim:new THREE.Group(),gond:[],R:9};
  {const R=9,cx=63,cy=R+2.4,red=new THREE.MeshPhongMaterial({color:0xd03a30,shininess:40}),steel=M.metal;
   wheel.g.position.set(cx,0.32,0);wheel.cy=cy;
   for(const s of [-1,1])for(const t of [-1,1]){const leg=new THREE.Mesh(new THREE.CylinderGeometry(0.25,0.3,Math.hypot(cy,4.5),8),steel);leg.position.set(s*1.4,cy/2,t*2.25);leg.rotation.x=-t*Math.atan2(4.5,cy);wheel.g.add(leg);}
   const hub=new THREE.Mesh(new THREE.CylinderGeometry(0.7,0.7,3.2,12),steel);hub.rotation.z=Math.PI/2;hub.position.y=cy;wheel.g.add(hub);
   for(const s of [-1,1]){const t=new THREE.Mesh(new THREE.TorusGeometry(R,0.16,8,48),red);t.rotation.y=Math.PI/2;t.position.x=s*0.9;wheel.rim.add(t);}
   const N=12;
   for(let i=0;i<N;i++){const a=i/N*TAU;wheel.gond.push(a);for(const s of [-1,1]){const sp=new THREE.Mesh(new THREE.CylinderGeometry(0.07,0.07,R,5),steel);sp.position.set(s*0.9,Math.cos(a)*R/2,Math.sin(a)*R/2);sp.rotation.x=a;wheel.rim.add(sp);}}
   mergeLocal(wheel.g);mergeLocal(wheel.rim);wheel.rim.position.y=cy;wheel.g.add(wheel.rim);
   // the cabins: two instanced meshes (coloured cabin, white roof with the hanger), placed every frame so they hang level
   const cabG=new THREE.CylinderGeometry(0.85,0.95,1.2,10).translate(0,-1.25,0);
   const topG=new THREE.ConeGeometry(1.0,0.6,10).translate(0,-0.35,0);
   wheel.cabins=new THREE.InstancedMesh(cabG,new THREE.MeshPhongMaterial({color:0xffffff,shininess:60}),N);wheel.tops=new THREE.InstancedMesh(topG,icing,N);
   {const c=new THREE.Color();for(let i=0;i<N;i++)wheel.cabins.setColorAt(i,c.set([0xd62828,0x3fa0ff,0x3fd46a,0xffd24a][i%4]));}
   for(const m of [wheel.cabins,wheel.tops]){m.castShadow=true;m.frustumCulled=false;wheel.g.add(m);}
   add(wheel.g,false);URB.wheel=wheel;
   // lights on the rim turn with it: their own small instanced mesh inside the rim group
   const n=64,lm=new THREE.InstancedMesh(new THREE.SphereGeometry(0.16,6,4),new THREE.MeshBasicMaterial({color:0xffffff}),n*2),d=new THREE.Object3D(),c=new THREE.Color();
   for(let i=0;i<n;i++)for(const s of [0,1]){const a=i/n*TAU;d.position.set(s?0.9:-0.9,Math.cos(a)*(R+0.25),Math.sin(a)*(R+0.25));d.updateMatrix();lm.setMatrixAt(i*2+s,d.matrix);lm.setColorAt(i*2+s,c.set([0xffd24a,0xff3b3b,0xffffff,0x4ad7ff][i%4]));}
   lm.frustumCulled=false;wheel.rim.add(lm);wheel.lights=lm;}
  const wd=new THREE.Object3D();
  function placeCabins(){const th=wheel.rim.rotation.x;wheel.gond.forEach((a,i)=>{wd.position.set(0,wheel.cy+Math.cos(a+th)*wheel.R,Math.sin(a+th)*wheel.R);wd.updateMatrix();
    wheel.cabins.setMatrixAt(i,wd.matrix);wheel.tops.setMatrixAt(i,wd.matrix);});wheel.cabins.instanceMatrix.needsUpdate=wheel.tops.instanceMatrix.needsUpdate=true;}
  placeCabins();
  const carousel={g:new THREE.Group(),rot:new THREE.Group(),horses:[],R:5.2};
  {const cx=-62,R=5.2;carousel.g.position.set(cx,0.32,0);
   const plat=new THREE.Mesh(new THREE.CylinderGeometry(R+0.3,R+0.5,0.5,28),woodDark);plat.position.y=0.25;carousel.g.add(plat);
   const brass=new THREE.MeshPhongMaterial({color:0xf2d070,shininess:60});
   const floor=new THREE.Mesh(new THREE.CylinderGeometry(R,R,0.1,28),new THREE.MeshLambertMaterial({color:0xd8b070}));floor.position.y=0.55;carousel.rot.add(floor);
   const pole=new THREE.Mesh(new THREE.CylinderGeometry(0.5,0.5,4.6,14),brass);pole.position.y=2.8;carousel.rot.add(pole);
   const roofTex=canvasTex(64,(g,S)=>{for(let i=0;i<8;i++){g.fillStyle=i%2?'#ffffff':'#d03a30';g.fillRect(i*S/8,0,S/8,S);}});
   const roof=new THREE.Mesh(new THREE.ConeGeometry(R+0.8,2.4,24,1,true),new THREE.MeshLambertMaterial({map:roofTex,side:THREE.DoubleSide}));roof.position.y=6.1;carousel.rot.add(roof);
   const rim=new THREE.Mesh(new THREE.CylinderGeometry(R+0.8,R+0.8,0.6,24,1,true),new THREE.MeshLambertMaterial({color:0xf2d070,side:THREE.DoubleSide}));rim.position.y=4.6;carousel.rot.add(rim);
   const top=new THREE.Mesh(new THREE.SphereGeometry(0.4,10,8),brass);top.position.y=7.4;carousel.rot.add(top);
   for(let i=0;i<8;i++){const a=i/8*TAU,rod=new THREE.Mesh(new THREE.CylinderGeometry(0.05,0.05,4,5),brass);rod.position.set(Math.cos(a)*(R-1),2.6,Math.sin(a)*(R-1));carousel.rot.add(rod);}
   mergeLocal(carousel.g);mergeLocal(carousel.rot);carousel.g.add(carousel.rot);
   // the horses: one geometry (body, neck, head, legs) drawn eight times, saddles extra; they bob up and down
   const parts=[[0.45,0.5,1.3,0,0,0,0],[0.3,0.7,0.35,0,0.4,0.55,-0.4],[0.3,0.3,0.55,0,0.75,0.8,0]];
   for(const [lx,lz] of [[-0.15,0.45],[0.15,0.45],[-0.15,-0.45],[0.15,-0.45]])parts.push([0.1,0.6,0.1,lx,-0.5,lz,0]);
   const hg=[];for(const [w,h,d,x,y,z,rx] of parts){const b=new THREE.BoxGeometry(w,h,d);b.rotateX(rx);b.translate(x,y,z);hg.push(b.toNonIndexed());}
   const pos=[],nor=[];for(const b of hg){pos.push(...b.attributes.position.array);nor.push(...b.attributes.normal.array);}
   const horseG=new THREE.BufferGeometry();horseG.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));horseG.setAttribute('normal',new THREE.Float32BufferAttribute(nor,3));
   carousel.horseMesh=new THREE.InstancedMesh(horseG,new THREE.MeshLambertMaterial({color:0xffffff}),8);
   carousel.saddles=new THREE.InstancedMesh(new THREE.BoxGeometry(0.5,0.12,0.45).translate(0,0.3,0),new THREE.MeshLambertMaterial({color:0xffffff}),8);
   {const c=new THREE.Color(),hc=[0xffffff,0x5a3a22,0xe0c090,0x404040],sc=[0xd62828,0x3fa0ff,0x3fd46a,0xffd24a];
    for(let i=0;i<8;i++){carousel.horseMesh.setColorAt(i,c.set(hc[i%4]));carousel.saddles.setColorAt(i,c.set(sc[i%4]));carousel.horses.push(i/8*TAU);}}
   for(const m of [carousel.horseMesh,carousel.saddles]){m.castShadow=true;m.frustumCulled=false;carousel.rot.add(m);}
   add(carousel.g,false);URB.carousel=carousel;
   for(let i=0;i<36;i++){const a=i/36*TAU;lightPts.push([cx+Math.cos(a)*(R+0.85),0.32+4.95,Math.sin(a)*(R+0.85)]);}}
  const hd=new THREE.Object3D();
  function placeHorses(){carousel.horses.forEach((a,i)=>{hd.position.set(Math.cos(a)*(carousel.R-1),1.7+Math.sin(gameT*2.2+i*1.3)*0.35,Math.sin(a)*(carousel.R-1));hd.rotation.set(0,-a+Math.PI/2,0);hd.updateMatrix();
    carousel.horseMesh.setMatrixAt(i,hd.matrix);carousel.saddles.setMatrixAt(i,hd.matrix);});carousel.horseMesh.instanceMatrix.needsUpdate=carousel.saddles.instanceMatrix.needsUpdate=true;}
  placeHorses();

  /* ---------- visitors walking round outside the fence (instanced: coats, heads, hats) ---------- */
  const VN=44,vb=new THREE.InstancedMesh(new THREE.CylinderGeometry(0.28,0.38,1.25,8),new THREE.MeshLambertMaterial({color:0xffffff}),VN),
    vh=new THREE.InstancedMesh(new THREE.SphereGeometry(0.22,8,6),new THREE.MeshLambertMaterial({color:0xf0c8a0}),VN),
    vc=new THREE.InstancedMesh(new THREE.ConeGeometry(0.22,0.45,8),new THREE.MeshLambertMaterial({color:0xffffff}),VN);
  const VIS=[],coat=[0x8a2b22,0x2d4a6a,0x3a5a3a,0x6a4a2a,0x404048,0x7a3a6a,0xb0803a],hat=[0xd62828,0xffffff,0x2d4a6a,0x3fa0ff,0x3a5a3a];
  {const c=new THREE.Color();for(let i=0;i<VN;i++){VIS.push({p:i/VN*4+Math.random()*0.05,v:(i%2?1:-1)*(0.006+Math.random()*0.004),off:(i%3-1)*0.9,ph:Math.random()*TAU});
    vb.setColorAt(i,c.set(coat[i%coat.length]));vc.setColorAt(i,c.set(hat[i%hat.length]));}}
  for(const m of [vb,vh,vc]){m.castShadow=true;m.frustumCulled=false;scene.add(m);}
  URB.visitors={n:VN,body:vb};
  const vd=new THREE.Object3D(),RW=LIM+5.5;
  // position on the square path round the fence: p in [0,4), one unit per side
  const onPath=(p,off)=>{p=((p%4)+4)%4;const s=Math.floor(p),t=p-s,r=RW+off,a=-r+2*r*t;
    return s===0?[a,-r,0]:s===1?[r,a,Math.PI/2]:s===2?[-a,r,Math.PI]:[-r,-a,-Math.PI/2];};

  /* ---------- lights (one instanced mesh) ---------- */
  {const ORNC=[0xff3b3b,0xffd24a,0x4ad7ff,0x7dff7a,0xffffff],pts=lightPts;
   const lm=new THREE.InstancedMesh(new THREE.SphereGeometry(0.12,6,4),new THREE.MeshBasicMaterial({color:0xffffff}),pts.length),d=new THREE.Object3D(),c=new THREE.Color();
   pts.forEach((p,i)=>{d.position.set(p[0],p[1],p[2]);d.scale.setScalar(p[4]||1);d.updateMatrix();lm.setMatrixAt(i,d.matrix);lm.setColorAt(i,c.set(p[3]||ORNC[i%ORNC.length]));});
   scene.add(lm);URB.lights=lm;}
  /* ---------- glow halos round lanterns, stars and the light strings (one draw call), only from dusk on ---------- */
  {const gc=document.createElement('canvas');gc.width=gc.height=64;{const g=gc.getContext('2d'),r=g.createRadialGradient(32,32,0,32,32,32);
     r.addColorStop(0,'rgba(255,226,160,1)');r.addColorStop(0.3,'rgba(255,196,110,.45)');r.addColorStop(1,'rgba(255,170,80,0)');g.fillStyle=r;g.fillRect(0,0,64,64);}
   const geo=new THREE.BufferGeometry().setFromPoints(warmPts);
   const pm=new THREE.PointsMaterial({map:new THREE.CanvasTexture(gc),size:0.75,sizeAttenuation:true,transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false,fog:true});
   const halo=new THREE.Points(geo,pm);halo.frustumCulled=false;scene.add(halo);URB.halo=halo;}

  /* ---------- animation: wheel, carousel, visitors, steam ---------- */
  let steamT=0;
  const dayLamp=new THREE.Color(0xf2e6c8),nightLamp=new THREE.Color(0xffd27a),dayIn=new THREE.Color(0x7a5a3a),nightIn=new THREE.Color(0xffb860),dayWin=new THREE.Color(0x5a6a80),nightWin=new THREE.Color(0xffd890);
  const _mood=updateMood;updateMood=function(dt){_mood(dt);
    {const dn=typeof DN!=='undefined'?DN:null,k=dn?clamp(Math.max(dn.night,dn.dusk*0.7),0,1):0,haze=dn?dn.wx.s*(dn.wx.storm?1:0.6):0;
     lampM.color.copy(dayLamp).lerp(nightLamp,k);insideM.color.copy(dayIn).lerp(nightIn,k);winM.color.copy(dayWin).lerp(nightWin,k);
     URB.halo.material.opacity=smooth((k-0.15)/0.5)*(1-haze*0.7);URB.halo.visible=URB.halo.material.opacity>0.01;}
    wheel.rim.rotation.x+=dt*0.12;placeCabins();   // the cabins hang level
    carousel.rot.rotation.y+=dt*0.55;placeHorses();
    VIS.forEach((v,i)=>{v.p+=v.v*dt*4;const [x,z,ry]=onPath(v.p,v.off),dir=v.v>0?0:Math.PI,bob=Math.abs(Math.sin(gameT*5+v.ph))*0.06,y=hgt(x,z);
      vd.rotation.set(0,ry+dir+Math.PI/2,0);vd.position.set(x,y+0.62+bob,z);vd.updateMatrix();vb.setMatrixAt(i,vd.matrix);
      vd.position.y=y+1.47+bob;vd.updateMatrix();vh.setMatrixAt(i,vd.matrix);vd.position.y=y+1.8+bob;vd.updateMatrix();vc.setMatrixAt(i,vd.matrix);});
    vb.instanceMatrix.needsUpdate=vh.instanceMatrix.needsUpdate=vc.instanceMatrix.needsUpdate=true;
    steamT-=dt;if(steamT<=0&&state!=='menu'){steamT=0.45;for(const s of URB.steam)if(Math.random()<0.7)puffs(s.x+rand(-0.3,0.3),s.y,s.z,1,s.c,{size:0.35,grow:0.9,life:2.2,spread:0.2,up:0.7,op:0.35});}
  };

  /* ---------- outside the season: this round is played to the end ---------- */
  if(MARKET_OFF)setTimeout(()=>toast('Der Weihnachtsmarkt hat nur in der Weihnachtszeit geöffnet. Diese Runde spielst du noch zu Ende.',4.5),1200);
})();
