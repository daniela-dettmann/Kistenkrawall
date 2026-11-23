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

  /* ---------- stalls ---------- */
  URB.steam=[];
  for(const t of URB.stalls){
    const along=Math.abs(t.face[1])>0,W=along?t.w:t.d,D=along?t.d:t.w,H=2.4,g=new THREE.Group();
    g.position.set(t.x,0.32,t.z);g.rotation.y=Math.atan2(t.face[0],t.face[1]);   // local +z faces the customers
    const back=new THREE.Mesh(new THREE.BoxGeometry(W,H,0.18),woodDark);back.position.set(0,H/2,-D/2+0.09);g.add(back);
    for(const s of [-1,1]){const side=new THREE.Mesh(new THREE.BoxGeometry(0.18,H,D),woodDark);side.position.set(s*(W/2-0.09),H/2,0);g.add(side);}
    const counter=new THREE.Mesh(new THREE.BoxGeometry(W-0.4,1.05,0.7),wood);counter.position.set(0,0.52,D/2-0.4);g.add(counter);
    const shelf=new THREE.Mesh(new THREE.BoxGeometry(W-0.6,0.1,0.6),wood);shelf.position.set(0,1.5,-D/2+0.5);g.add(shelf);
    const rm=roofM[URB.stalls.indexOf(t)%roofM.length];
    const roof=new THREE.Mesh(gable(W+0.5,D+0.9,1.1),rm);roof.position.y=H;g.add(roof);
    const snow=new THREE.Mesh(gable(W+0.6,D+1.0,1.16),snowM);snow.scale.set(1,0.5,0.5);snow.position.y=H+0.56;g.add(snow);
    const sign=new THREE.Mesh(new THREE.PlaneGeometry(Math.min(W-0.6,3.2),0.8),signTex[t.kind]);sign.position.set(0,H+0.55,D/2+0.46);sign.rotation.x=-0.1;g.add(sign);
    const gc=goodsCols[t.kind];
    for(let i=0;i<Math.round(W*1.6);i++){const m=new THREE.Mesh(i%2?new THREE.BoxGeometry(0.22,0.22,0.22):new THREE.SphereGeometry(0.13,8,6),lam(gc[i%2]));
      m.position.set(-W/2+0.5+(W-1)*(i+0.5)/Math.round(W*1.6),1.17,D/2-0.4+((i%3)-1)*0.15);g.add(m);}
    for(let i=0;i<Math.round(W*1.2);i++){const m=new THREE.Mesh(new THREE.BoxGeometry(0.2,0.28,0.2),lam(gc[(i+1)%2]));m.position.set(-W/2+0.6+(W-1.2)*i/Math.max(1,Math.round(W*1.2)-1),1.69,-D/2+0.5);g.add(m);}
    add(g);g.updateMatrixWorld(true);   // before localToWorld: otherwise the lights land round the middle of the square
    for(let i=0;i<=Math.round(W/0.5);i++){const lx=-W/2-0.2+(W+0.4)*i/Math.round(W/0.5),v=new THREE.Vector3(lx,H-0.05-Math.sin(i/Math.round(W/0.5)*Math.PI)*0.15,D/2+0.5);g.localToWorld(v);lightPts.push([v.x,v.y,v.z]);}
    if(t.kind==='gluehwein'||t.kind==='wurst'){const v=new THREE.Vector3(0,1.4,D/2-0.4);g.localToWorld(v);URB.steam.push({x:v.x,y:v.y,z:v.z,t:Math.random(),c:t.kind==='wurst'?0xd8d2c8:0xf2f2f2});}
  }

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
   const wall=new THREE.MeshLambertMaterial({color:0xf2e8d8}),beam=new THREE.MeshLambertMaterial({color:0x5a3a22}),tile=new THREE.MeshLambertMaterial({color:0x8a3a2a}),winM=new THREE.MeshBasicMaterial({color:0xffd890});
   for(let i=0;i<40;i++){const a=i/40*TAU,r=84+((i*7)%4)*3,x=Math.cos(a)*r,z=Math.sin(a)*r,w=8+(i%3)*2,h=7+((i*5)%4)*1.5,hs=new THREE.Group();hs.position.set(x,0.3,z);hs.rotation.y=-a+Math.PI/2;
     const b2=new THREE.Mesh(new THREE.BoxGeometry(w,h,7),wall);b2.position.y=h/2;hs.add(b2);
     for(let k=-1;k<=1;k++){const bm=new THREE.Mesh(new THREE.BoxGeometry(0.3,h,0.1),beam);bm.position.set(k*w/3,h/2,3.52);hs.add(bm);}
     const hb=new THREE.Mesh(new THREE.BoxGeometry(w,0.3,0.1),beam);hb.position.set(0,h*0.55,3.52);hs.add(hb);
     for(const s of [-1,1])for(const y of [h*0.3,h*0.75]){const wi=new THREE.Mesh(new THREE.BoxGeometry(1,1.1,0.1),winM);wi.position.set(s*w/5,y,3.55);hs.add(wi);}
     const rf=new THREE.Mesh(gable(7.6,w+0.6,4),tile);rf.rotation.y=Math.PI/2;rf.position.y=h;hs.add(rf);
     const sn=new THREE.Mesh(gable(7.8,w+0.8,4.1),snowM);sn.rotation.y=Math.PI/2;sn.position.y=h+0.12;sn.scale.set(1,0.5,0.5);sn.position.y=h+2.0;hs.add(sn);
     scene.add(hs);STATIC_ROOTS.push(hs);}}

  /* ---------- Ferris wheel (east) and carousel (west), outside the fence ---------- */
  const wheel={g:new THREE.Group(),rim:new THREE.Group(),gond:[]};
  {const R=9,cx=63,cy=R+2.4,red=new THREE.MeshPhongMaterial({color:0xd03a30,shininess:40}),steel=M.metal;
   wheel.g.position.set(cx,0.32,0);
   for(const s of [-1,1])for(const t of [-1,1]){const leg=new THREE.Mesh(new THREE.CylinderGeometry(0.25,0.3,Math.hypot(cy,4.5),8),steel);leg.position.set(s*1.4,cy/2,t*2.25);leg.rotation.x=-t*Math.atan2(4.5,cy);wheel.g.add(leg);}
   const hub=new THREE.Mesh(new THREE.CylinderGeometry(0.7,0.7,3.2,12),steel);hub.rotation.z=Math.PI/2;hub.position.y=cy;wheel.g.add(hub);
   wheel.rim.position.y=cy;wheel.g.add(wheel.rim);
   for(const s of [-1,1]){const t=new THREE.Mesh(new THREE.TorusGeometry(R,0.16,8,48),red);t.rotation.y=Math.PI/2;t.position.x=s*0.9;wheel.rim.add(t);}
   const N=12;
   for(let i=0;i<N;i++){const a=i/N*TAU;for(const s of [-1,1]){const sp=new THREE.Mesh(new THREE.CylinderGeometry(0.07,0.07,R,5),steel);sp.position.set(s*0.9,Math.cos(a)*R/2,Math.sin(a)*R/2);sp.rotation.x=a;wheel.rim.add(sp);}
     const piv=new THREE.Group();piv.position.set(0,Math.cos(a)*R,Math.sin(a)*R);wheel.rim.add(piv);
     const cab=new THREE.Group();piv.add(cab);
     const c=new THREE.Mesh(new THREE.CylinderGeometry(0.85,0.95,1.2,10),candy[i%4]);c.position.y=-1.25;cab.add(c);
     const top=new THREE.Mesh(new THREE.ConeGeometry(1.0,0.6,10),icing);top.position.y=-0.35;cab.add(top);
     const rod=new THREE.Mesh(new THREE.CylinderGeometry(0.05,0.05,0.7,4),steel);rod.position.y=-0.1;cab.add(rod);
     wheel.gond.push(piv);
   }
   add(wheel.g,false);URB.wheel=wheel;
   // lights on the rim turn with it: their own small instanced mesh inside the rim group
   const n=64,lm=new THREE.InstancedMesh(new THREE.SphereGeometry(0.16,6,4),new THREE.MeshBasicMaterial({color:0xffffff}),n*2),d=new THREE.Object3D(),c=new THREE.Color();
   for(let i=0;i<n;i++)for(const s of [0,1]){const a=i/n*TAU;d.position.set(s?0.9:-0.9,Math.cos(a)*(R+0.25),Math.sin(a)*(R+0.25));d.updateMatrix();lm.setMatrixAt(i*2+s,d.matrix);lm.setColorAt(i*2+s,c.set([0xffd24a,0xff3b3b,0xffffff,0x4ad7ff][i%4]));}
   lm.frustumCulled=false;wheel.rim.add(lm);wheel.lights=lm;}
  const carousel={g:new THREE.Group(),rot:new THREE.Group(),horses:[]};
  {const cx=-62,R=5.2;carousel.g.position.set(cx,0.32,0);
   const plat=new THREE.Mesh(new THREE.CylinderGeometry(R+0.3,R+0.5,0.5,28),woodDark);plat.position.y=0.25;carousel.g.add(plat);
   carousel.g.add(carousel.rot);
   const floor=new THREE.Mesh(new THREE.CylinderGeometry(R,R,0.1,28),new THREE.MeshLambertMaterial({color:0xd8b070}));floor.position.y=0.55;carousel.rot.add(floor);
   const pole=new THREE.Mesh(new THREE.CylinderGeometry(0.5,0.5,4.6,14),new THREE.MeshPhongMaterial({color:0xf2d070,shininess:60}));pole.position.y=2.8;carousel.rot.add(pole);
   const roofTex=canvasTex(64,(g,S)=>{for(let i=0;i<8;i++){g.fillStyle=i%2?'#ffffff':'#d03a30';g.fillRect(i*S/8,0,S/8,S);}});
   const roof=new THREE.Mesh(new THREE.ConeGeometry(R+0.8,2.4,24,1,true),new THREE.MeshLambertMaterial({map:roofTex,side:THREE.DoubleSide}));roof.position.y=6.1;carousel.rot.add(roof);
   const rim=new THREE.Mesh(new THREE.CylinderGeometry(R+0.8,R+0.8,0.6,24,1,true),new THREE.MeshLambertMaterial({color:0xf2d070,side:THREE.DoubleSide}));rim.position.y=4.6;carousel.rot.add(rim);
   const top=new THREE.Mesh(new THREE.SphereGeometry(0.4,10,8),new THREE.MeshPhongMaterial({color:0xf2d070,shininess:80}));top.position.y=7.4;carousel.rot.add(top);
   const hc=[0xffffff,0x5a3a22,0xe0c090,0x404040];
   for(let i=0;i<8;i++){const a=i/8*TAU,h=new THREE.Group();h.position.set(Math.cos(a)*(R-1),0,Math.sin(a)*(R-1));h.rotation.y=-a;carousel.rot.add(h);
     const rod=new THREE.Mesh(new THREE.CylinderGeometry(0.05,0.05,4,5),new THREE.MeshPhongMaterial({color:0xf2d070}));rod.position.y=2.6;h.add(rod);
     const horse=new THREE.Group(),hm=new THREE.MeshLambertMaterial({color:hc[i%4]});
     const body=new THREE.Mesh(new THREE.BoxGeometry(0.45,0.5,1.3),hm);horse.add(body);
     const neck=new THREE.Mesh(new THREE.BoxGeometry(0.3,0.7,0.35),hm);neck.position.set(0,0.4,0.55);neck.rotation.x=-0.4;horse.add(neck);
     const head=new THREE.Mesh(new THREE.BoxGeometry(0.3,0.3,0.55),hm);head.position.set(0,0.75,0.8);horse.add(head);
     for(const [lx,lz] of [[-0.15,0.45],[0.15,0.45],[-0.15,-0.45],[0.15,-0.45]]){const l=new THREE.Mesh(new THREE.BoxGeometry(0.1,0.6,0.1),hm);l.position.set(lx,-0.5,lz);horse.add(l);}
     const saddle=new THREE.Mesh(new THREE.BoxGeometry(0.5,0.12,0.45),candy[i%4]);saddle.position.y=0.3;horse.add(saddle);
     horse.position.y=1.7;horse.rotation.y=Math.PI/2;h.add(horse);carousel.horses.push(horse);}
   add(carousel.g,false);URB.carousel=carousel;
   for(let i=0;i<36;i++){const a=i/36*TAU;lightPts.push([cx+Math.cos(a)*(R+0.85),0.32+4.95,Math.sin(a)*(R+0.85)]);}}

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
   pts.forEach((p,i)=>{d.position.set(p[0],p[1],p[2]);d.updateMatrix();lm.setMatrixAt(i,d.matrix);lm.setColorAt(i,c.set(ORNC[i%ORNC.length]));});
   scene.add(lm);URB.lights=lm;}

  /* ---------- animation: wheel, carousel, visitors, steam ---------- */
  let steamT=0;
  const _mood=updateMood;updateMood=function(dt){_mood(dt);
    wheel.rim.rotation.x+=dt*0.12;for(const p of wheel.gond)p.rotation.x=-wheel.rim.rotation.x;   // the cabins hang level
    carousel.rot.rotation.y+=dt*0.55;carousel.horses.forEach((h,i)=>{h.position.y=1.7+Math.sin(gameT*2.2+i*1.3)*0.35;});
    VIS.forEach((v,i)=>{v.p+=v.v*dt*4;const [x,z,ry]=onPath(v.p,v.off),dir=v.v>0?0:Math.PI,bob=Math.abs(Math.sin(gameT*5+v.ph))*0.06,y=hgt(x,z);
      vd.rotation.set(0,ry+dir+Math.PI/2,0);vd.position.set(x,y+0.62+bob,z);vd.updateMatrix();vb.setMatrixAt(i,vd.matrix);
      vd.position.y=y+1.47+bob;vd.updateMatrix();vh.setMatrixAt(i,vd.matrix);vd.position.y=y+1.8+bob;vd.updateMatrix();vc.setMatrixAt(i,vd.matrix);});
    vb.instanceMatrix.needsUpdate=vh.instanceMatrix.needsUpdate=vc.instanceMatrix.needsUpdate=true;
    steamT-=dt;if(steamT<=0&&state!=='menu'){steamT=0.45;for(const s of URB.steam)if(Math.random()<0.7)puffs(s.x+rand(-0.3,0.3),s.y,s.z,1,s.c,{size:0.35,grow:0.9,life:2.2,spread:0.2,up:0.7,op:0.35});}
  };

  /* ---------- outside the season: this round is played to the end ---------- */
  if(MARKET_OFF)setTimeout(()=>toast('Der Weihnachtsmarkt hat nur in der Weihnachtszeit geöffnet. Diese Runde spielst du noch zu Ende.',4.5),1200);
})();
