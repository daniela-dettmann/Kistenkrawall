/* Kistenkrawall: Dschungel-Karte (Auftrag „Zwei neue Karten“, Karte 8). Nur aktiv, wenn MAP === 'dschungel'.
   Grundriss, Fluss, Brücken und Kistenplätze stehen als Daten in core.js (URB.jungle, URB.bridges, URB.trails),
   die Wegfindung macht urban.js. Hier entstehen die Modelle und die Stimmung:
   - Stufentempel aus vier Blöcken mit kreuzförmigem Gang, Treppen, Schrein oben über der Kreuzung, Säulen am Nord- und Südeingang,
     überwuchert mit Moos, Ranken und Blattbüscheln. Wird durchscheinend, wenn er zwischen Kamera und Figur steht.
   - Steinstege auf die Tempelinsel, Hängebrücken aus Planken und Seilen.
   - Ruinen, Steinköpfe, umgestürzte Statuen.
   - Dichter Regenwald: hohe Bäume mit Brettwurzeln, Schirmkronen und Lianen (Hindernisse, Deckung), Farne und
     Riesenblätter am Boden, Baumkronen am Horizont.
   - Feuchtes, grünes Licht, Dunst; Papageien statt Möwen, Schmetterlinge über den Lichtungen.
   - Weihnachtsedition: Lichterketten an Tempel, Stegen und Bäumen, kein Schnee. */
'use strict';
if(JUNGLE)(function(){
  const X=typeof XMAS!=='undefined'&&XMAS,J=URB.jungle;
  // humid green light: a pale green-gold horizon, a soft blue sky, warm sun; the haze closes in a little earlier
  MOOD.hor=[new THREE.Color(0xd6dfbf),new THREE.Color(0xdcc29a)];
  MOOD.top=[new THREE.Color(0x5f97b8),new THREE.Color(0x56688e)];
  MOOD.sun=[new THREE.Color(0xfff0d2),new THREE.Color(0xffcfa8)];
  MOOD.sky=[new THREE.Color(0xe2f2d4),new THREE.Color(0xd8d6c4)];
  scene.fog.near=48;scene.fog.far=150;

  /* ---------- helpers ---------- */
  const lightPts=[];
  // bake a list of [geometry, matrix] into one geometry (one draw call per material)
  function bake(list){
    const pos=[],nor=[],uv=[];
    for(const [geo,mtx] of list){
      const g=(geo.index?geo.toNonIndexed():geo.clone()).applyMatrix4(mtx);
      pos.push(...g.attributes.position.array);nor.push(...g.attributes.normal.array);
      if(g.attributes.uv)uv.push(...g.attributes.uv.array);else for(let i=0;i<g.attributes.position.count;i++)uv.push(0,0);
      g.dispose();
    }
    const out=new THREE.BufferGeometry();
    out.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));out.setAttribute('normal',new THREE.Float32BufferAttribute(nor,3));out.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));
    return out;
  }
  const M4=(x,y,z,ry,rx,rz,s)=>{const o=new THREE.Object3D();o.position.set(x,y,z);o.rotation.set(rx||0,ry||0,rz||0);if(s)o.scale.copy(s);o.updateMatrix();return o.matrix.clone();};
  // a box with UVs in metres (cell = size of one texture tile)
  function sBox(w,h,d,cell){
    const geo=new THREE.BoxGeometry(w,h,d),uv=geo.attributes.uv,dims=[[d,h],[d,h],[w,d],[w,d],[w,h],[w,h]];
    for(let f=0;f<6;f++)for(let v=0;v<4;v++){const i=f*4+v;uv.setXY(i,uv.getX(i)*dims[f][0]/cell,uv.getY(i)*dims[f][1]/cell);}
    return geo;
  }
  const add=(m,stat)=>{m.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});scene.add(m);if(stat!==false)STATIC_ROOTS.push(m);return m;};

  /* ---------- materials ---------- */
  // old stone: grey-green blocks, dark joints, moss creeping in from below
  const stoneTex=canvasTex(128,(g,S)=>{
    const n=fbm(S,[32,16,8]);paintPixels(g,S,(x,y)=>{const k=0.78+n[y*S+x]*0.32,m=clamp((y/S)*0.6+n[((y*3)%S)*S+((x*3)%S)]*0.8-0.55,0,1);
      return [c8((180-60*m)*k),c8((178-30*m)*k),c8((158-70*m)*k)];});
    g.fillStyle='rgba(40,44,30,.55)';
    for(let r=0;r<4;r++){const y=r*S/4;g.fillRect(0,y,S,3);for(let k=0;k<3;k++){const x=((k+(r%2)*0.5)*S/3)%S;g.fillRect(x,y,3,S/4);}}
    g.fillStyle='rgba(60,70,40,.25)';for(let i=0;i<30;i++){g.beginPath();g.arc((i*53)%S,(i*37)%S,2+(i%4),0,TAU);g.fill();}
  });
  const stone=new THREE.MeshLambertMaterial({color:0xc8c6ae,map:stoneTex});
  const stoneDark=new THREE.MeshLambertMaterial({color:0x8e8c78,map:stoneTex});
  const mossM=texMat(0x4f7a2e,TX.leaf,0.06,{shininess:4});
  const vineM=new THREE.MeshLambertMaterial({color:0x3f6a2a,side:THREE.DoubleSide});
  const barkM=texMat(0x8a7656,TX.bark,0.08,{shininess:4}),barkDark=texMat(0x5e4e38,TX.bark,0.08,{shininess:4});
  const crownM=[0x2f6a2c,0x3b7a30,0x467f2a,0x2a5e34].map(c=>texMat(c,TX.leaf,0.06,{flatShading:true,shininess:8,specular:0x1a2a10}));
  const lianaM=new THREE.MeshLambertMaterial({color:0x5a5a2e});
  const plankM=texMat(0x8a6038,TX.plank,0.05,{shininess:6}),ropeM=new THREE.MeshLambertMaterial({color:0xb89a64});

  /* ---------- the temple ---------- */
  {
    const y0=hgt(6,0)-0.05,TH=J.th,PW=J.pw,tierH=J.th_h/4,inset=1.3;
    const parts=[],dark=[],green=[];
    for(const sx of [-1,1])for(const sz of [-1,1]){   // four blocks round the cross-shaped passage
      for(let k=0;k<4;k++){const xo=TH-inset*k,w=xo-PW,c=PW+w/2;
        parts.push([sBox(w,tierH,w,2),M4(sx*c,y0+tierH*(k+0.5),sz*c)]);
        // a band of moss along the foot of each tier, leaf clumps on the ledges
        green.push([sBox(w+0.06,0.35,w+0.06,2),M4(sx*c,y0+tierH*k+0.15,sz*c)]);
        if(k<3)for(const t of [0.3,0.72]){const r=0.42+0.15*((k+(t>0.5?1:0))%3);
          green.push([new THREE.IcosahedronGeometry(r,0),M4(sx*(xo-0.62),y0+tierH*(k+1)+0.1,sz*(PW+(w-inset)*t),k,0,0,new THREE.Vector3(1.0,0.55,1.4))]);
          green.push([new THREE.IcosahedronGeometry(r,0),M4(sx*(PW+(w-inset)*(1-t)),y0+tierH*(k+1)+0.1,sz*(xo-0.62),k+1,0,0,new THREE.Vector3(1.4,0.55,1.0))]);}
      }
      // stairs up the outer face (towards the water), a darker stone
      for(let i=0;i<16;i++){const h=(i+1)*J.th_h/16;dark.push([sBox(0.34,h,2,2),M4(sx*(TH-0.17-i*0.326),y0+h/2,sz*(PW+1.15))]);}
      // the walls of the passages: carved panels
      for(const t of [4.6,7.4]){dark.push([sBox(0.12,1.6,2.0,2),M4(sx*(PW-0.04),y0+2.2,sz*t)]);dark.push([sBox(2.0,1.6,0.12,2),M4(sx*t,y0+2.2,sz*(PW-0.04))]);}
      // vines hanging down the outer faces
      for(let i=0;i<2;i++){const k=(i+(sx>0?1:0)+(sz>0?1:0))%3,e=TH-inset*k,t=PW+1.2+i*2.4+k*0.3,l=2.2+((i*7+k*3)%5)*0.7;
        green.push([new THREE.PlaneGeometry(0.6,l),M4(sx*(e+0.05),y0+tierH*(k+1)-l/2+0.2,sz*t,sx*Math.PI/2)]);
        green.push([new THREE.PlaneGeometry(0.6,l),M4(sx*t,y0+tierH*(k+1)-l/2+0.2,sz*(e+0.05),sz>0?0:Math.PI)]);}
    }
    // the shrine on top, bridging the passage: a little house with a doorway and a roof comb
    const top=y0+J.th_h,sw=TH-inset*3;
    parts.push([sBox(sw*2,0.5,sw*2-0.4,2),M4(0,top+0.25,0)]);   // the floor over the passage
    for(const sz of [-1,1]){parts.push([sBox(sw*2-1,2.6,0.6,2),M4(0,top+1.8,sz*(sw-1.2))]);}
    for(const s2 of [-1,1])parts.push([sBox(0.6,2.6,sw*2-3,2),M4(s2*(sw-0.8),top+1.8,0)]);
    parts.push([sBox(sw*2,0.6,sw*2-1.4,2),M4(0,top+3.4,0)]);
    for(let i=0;i<3;i++)dark.push([sBox(sw*2-1.6-i*1.2,0.55,1.0,2),M4(0,top+3.95+i*0.55,0)]);   // stepped roof comb
    dark.push([sBox(1.6,1.9,0.2,2),M4(0,top+1.45,-(sw-0.85))]);dark.push([sBox(1.6,1.9,0.2,2),M4(0,top+1.45,sw-0.85)]);   // doorways
    green.push([new THREE.IcosahedronGeometry(0.9,0),M4(sw-0.6,top+3.9,sw-1.2,0,0,0,new THREE.Vector3(1.4,0.6,1.2))],[new THREE.IcosahedronGeometry(0.7,0),M4(-sw+0.5,top+3.8,-sw+1.5,1,0,0,new THREE.Vector3(1.2,0.6,1.3))]);
    const mats=[stone.clone(),stoneDark.clone(),mossM.clone()];
    [[parts,mats[0]],[dark,mats[1]],[green,mats[2]]].forEach(([l,m])=>add(new THREE.Mesh(bake(l),m),false));
    mats[2].side=THREE.DoubleSide;
    URB.fadeable.push({b:{x0:-TH,x1:TH,z0:-TH,z1:TH,h:J.th_h+4},mats});
    for(const m of mats){m.transparent=true;m.userData.kkFade=1;}
    URB.temple=mats;
    if(X){   // lights along the tier edges and round the shrine
      for(let k=1;k<=4;k++){const e=TH-inset*(k-1),y=y0+tierH*k+0.12;
        for(const sx of [-1,1])for(const sz of [-1,1])for(let i=0;i<=4;i++){const t=PW+(e-PW)*i/4;lightPts.push([sx*(e+0.05),y,sz*t],[sx*t,y,sz*(e+0.05)]);}}
      for(let i=0;i<24;i++){const a=i/24*TAU;lightPts.push([Math.cos(a)*sw*1.05,top+3.75,Math.sin(a)*(sw-0.6)]);}
    }
  }

  /* ---------- columns, ruins, stone heads, fallen statues ---------- */
  for(const b of URB.boxes){
    const w=b.x1-b.x0,d=b.z1-b.z0,cx=(b.x0+b.x1)/2,cz=(b.z0+b.z1)/2,y=hgt(cx,cz)-0.05;
    if(b.k==='col'){const g=new THREE.Group();g.position.set(cx,y,cz);
      const shaft=new THREE.Mesh(sBox(w*0.86,b.h-0.4,d*0.86,1.2),stone);shaft.position.y=(b.h-0.4)/2;g.add(shaft);
      const cap=new THREE.Mesh(sBox(w+0.3,0.4,d+0.3,1.2),stoneDark);cap.position.y=b.h-0.2;g.add(cap);
      const moss=new THREE.Mesh(new THREE.IcosahedronGeometry(0.45,0),mossM);moss.position.set(0.2,b.h+0.05,0.1);moss.scale.set(1.3,0.5,1.2);g.add(moss);
      add(g);
      if(X)for(let i=0;i<12;i++){const a=i*1.2,yy=0.3+i*(b.h-0.6)/12;lightPts.push([cx+Math.cos(a)*0.55,y+yy,cz+Math.sin(a)*0.55]);}}
    else if(b.k==='wall'){const g=new THREE.Group();g.position.set(cx,y,cz);
      const m=new THREE.Mesh(sBox(w,b.h*0.8,d,1.2),stone);m.position.y=b.h*0.4;g.add(m);
      const n=Math.max(2,Math.round(Math.max(w,d)/1.4));
      for(let i=0;i<n;i++){if(i%3===1)continue;const t=(i+0.5)/n,bb=new THREE.Mesh(sBox(w>d?w/n-0.05:w,b.h*0.2+((i*7)%3)*0.15,w>d?d:d/n-0.05,1.2),stone);
        bb.position.set(w>d?-w/2+w*t:0,b.h*0.8+0.15,w>d?0:-d/2+d*t);g.add(bb);}
      for(let i=0;i<3;i++){const v=new THREE.Mesh(new THREE.IcosahedronGeometry(0.5,0),mossM);v.position.set(w>d?(i-1)*w/3:0.1,b.h*0.85,w>d?0.1:(i-1)*d/3);v.scale.set(1.2,0.5,1.2);g.add(v);}
      add(g);}
    else if(b.k==='head'){   // a giant stone head with a helmet, looking at the clearing
      const g=new THREE.Group();g.position.set(cx,y,cz);g.rotation.y=Math.atan2(Math.sign(cx)*6,-Math.sign(cz)*7);
      const hd=new THREE.Mesh(new THREE.SphereGeometry(1.5,14,10),stone);hd.scale.set(1,1.15,0.95);hd.position.y=1.6;g.add(hd);
      const helm=new THREE.Mesh(new THREE.SphereGeometry(1.56,14,8,0,TAU,0,Math.PI/2.2),stoneDark);helm.position.y=1.85;g.add(helm);
      const band=new THREE.Mesh(new THREE.TorusGeometry(1.45,0.14,6,18),stoneDark);band.rotation.x=Math.PI/2;band.position.y=2.05;g.add(band);
      for(const s of [-1,1]){const eye=new THREE.Mesh(new THREE.BoxGeometry(0.42,0.16,0.2),stoneDark);eye.position.set(s*0.5,1.95,1.36);g.add(eye);
        const ear=new THREE.Mesh(new THREE.BoxGeometry(0.25,0.7,0.5),stone);ear.position.set(s*1.5,1.6,0);g.add(ear);}
      const nose=new THREE.Mesh(new THREE.BoxGeometry(0.4,0.55,0.4),stone);nose.position.set(0,1.55,1.42);g.add(nose);
      const lips=new THREE.Mesh(new THREE.BoxGeometry(0.85,0.22,0.25),stoneDark);lips.position.set(0,1.0,1.36);g.add(lips);
      const moss=new THREE.Mesh(new THREE.IcosahedronGeometry(0.8,0),mossM);moss.position.set(0.3,3.15,-0.3);moss.scale.set(1.3,0.4,1.1);g.add(moss);
      add(g);
      if(X){const hat=new THREE.Mesh(new THREE.ConeGeometry(1.1,2.2,14),new THREE.MeshLambertMaterial({color:0xd62828}));hat.position.y=4.1;hat.rotation.x=-0.25;g.add(hat);
        const rim=new THREE.Mesh(new THREE.TorusGeometry(1.08,0.22,8,18),new THREE.MeshLambertMaterial({color:0xffffff}));rim.rotation.x=Math.PI/2;rim.position.y=3.05;g.add(rim);
        const pom=new THREE.Mesh(new THREE.SphereGeometry(0.3,8,6),rim.material);pom.position.set(0,5.2,-0.5);g.add(pom);}}
    else if(b.k==='fallen'){const g=new THREE.Group();g.position.set(cx,y,cz);
      const along=w>d,L=Math.max(w,d);
      const body=new THREE.Mesh(sBox(along?L-1.4:1.1,1.0,along?1.1:L-1.4,1.2),stone);body.position.set(along?0.6:0,0.5,along?0:0.6);body.rotation[along?'x':'z']=0.15;g.add(body);
      const head=new THREE.Mesh(new THREE.SphereGeometry(0.62,10,8),stone);head.position.set(along?-L/2+0.7:0,0.6,along?0:-L/2+0.7);g.add(head);
      add(g);}
  }

  /* ---------- bridges ---------- */
  for(const br of URB.bridges){
    const cx=(br.x0+br.x1)/2,cz=(br.z0+br.z1)/2,w=br.x1-br.x0,L=br.z1-br.z0,deck=0.42,g=new THREE.Group();g.position.set(cx,0,cz);
    if(br.k==='steg'){   // stone slabs on pillars, low parapets
      const n=Math.round(L/1.1);
      for(let i=0;i<n;i++){const s=new THREE.Mesh(sBox(w,0.45,L/n-0.05,1.2),i%2?stone:stoneDark);s.position.set(0,deck-0.22,-L/2+(i+0.5)*L/n);g.add(s);}
      for(const sx of [-1,1]){const p=new THREE.Mesh(sBox(0.35,0.55,L,1.2),stoneDark);p.position.set(sx*(w/2-0.17),deck+0.27,0);g.add(p);
        for(const z of [-L/2+0.3,L/2-0.3]){const post=new THREE.Mesh(sBox(0.55,0.9,0.55,1.2),stone);post.position.set(sx*(w/2-0.17),deck+0.45,z);g.add(post);
          if(X)for(let i=0;i<10;i++)lightPts.push([cx+sx*(w/2-0.17),deck+0.6,cz-L/2+0.3+i*(L-0.6)/9]);}}
      for(const z of [-L*0.22,L*0.22]){const pil=new THREE.Mesh(sBox(w-0.8,3,1.2,1.2),stoneDark);pil.position.set(0,deck-1.9,z);g.add(pil);}
    }else{   // rope bridge: planks on two beams, posts at the ends, sagging hand ropes
      const n=Math.round(L/0.55);
      for(let i=0;i<n;i++){const p=new THREE.Mesh(new THREE.BoxGeometry(w-0.3,0.14,0.48),plankM);p.position.set((i%3-1)*0.04,deck-0.07,-L/2+(i+0.5)*L/n);p.rotation.y=((i*7)%5-2)*0.012;g.add(p);}
      for(const sx of [-1,1]){
        const beam=new THREE.Mesh(new THREE.BoxGeometry(0.22,0.22,L),barkDark);beam.position.set(sx*(w/2-0.5),deck-0.25,0);g.add(beam);
        for(const sz of [-1,1]){const post=new THREE.Mesh(new THREE.CylinderGeometry(0.14,0.18,2.2,7),barkDark);post.position.set(sx*(w/2-0.15),deck+0.7,sz*(L/2-0.15));g.add(post);}
        const K=8;let prev=null;
        for(let i=0;i<=K;i++){const t=i/K,z=-L/2+0.15+(L-0.3)*t,yy=deck+1.65-Math.sin(t*Math.PI)*0.45,p=new THREE.Vector3(sx*(w/2-0.15),yy,z);
          if(prev){const seg=new THREE.Mesh(new THREE.CylinderGeometry(0.035,0.035,prev.distanceTo(p),4),ropeM);seg.position.copy(prev).add(p).multiplyScalar(0.5);seg.lookAt(p.x+g.position.x,p.y,p.z+g.position.z);seg.rotateX(Math.PI/2);g.add(seg);
            const v=new THREE.Mesh(new THREE.CylinderGeometry(0.02,0.02,yy-deck,3),ropeM);v.position.set(p.x,(yy+deck)/2,p.z);g.add(v);}
          prev=p;if(X)lightPts.push([cx+p.x,p.y+0.08,cz+p.z]);}
      }
    }
    add(g);
  }

  /* ---------- the rainforest ---------- */
  function jtree(x,z,s,block,simple){
    const g=new THREE.Group(),y=hgt(x,z);g.position.set(x,y-0.05,z);g.rotation.y=srand()*TAU;
    const H=(7.5+srand()*4)*s,cm=crownM[Math.floor(srand()*crownM.length)];
    const trunk=new THREE.Mesh(new THREE.CylinderGeometry(0.26*s,0.48*s,H,7),barkM);trunk.position.y=H/2;trunk.rotation.z=(srand()-.5)*0.06;g.add(trunk);
    if(!simple){const fl=new THREE.Mesh(new THREE.CylinderGeometry(0.47*s,1.05*s,1.6*s,7),barkM);fl.position.y=0.75*s;g.add(fl);   // flared foot (buttress roots)
      for(let i=0;i<5;i++){const a=i/5*TAU+srand()*0.4,r=new THREE.Mesh(new THREE.ConeGeometry(0.3*s,1.6*s,4),barkDark);r.position.set(Math.cos(a)*0.8*s,0.28*s,Math.sin(a)*0.8*s);r.rotation.set(Math.sin(a)*1.38,0,-Math.cos(a)*1.38);r.scale.set(1,1,0.4);g.add(r);}}
    // a crown of rounded leaf clumps in two layers
    const nC=simple?3:5;
    for(let i=0;i<nC;i++){const a=i/nC*TAU*1.7+srand(),rr=i?(1.3+srand()*1.1)*s:0,cr=(i?1.7:2.5)*s*(0.9+srand()*0.35);
      const c=new THREE.Mesh(new THREE.IcosahedronGeometry(cr,simple?0:1),i%2?cm:crownM[(crownM.indexOf(cm)+1)%crownM.length]);c.position.set(Math.cos(a)*rr,H+(i?(i%3-1)*0.6:0.5)*s,Math.sin(a)*rr);c.scale.y=0.62;c.rotation.y=srand()*3;g.add(c);}
    if(!simple){
      for(let i=0;i<2;i++){const a=srand()*TAU,b=new THREE.Mesh(new THREE.CylinderGeometry(0.06*s,0.12*s,2.2*s,5),barkM);b.position.set(Math.cos(a)*0.7*s,H*0.82,Math.sin(a)*0.7*s);b.rotation.set(Math.sin(a)*0.9,0,-Math.cos(a)*0.9);g.add(b);}
      const nl=1+Math.floor(srand()*3);
      for(let i=0;i<nl;i++){const a=srand()*TAU,rr=(1.6+srand()*1.2)*s,l=H*(0.45+srand()*0.35),li=new THREE.Mesh(new THREE.CylinderGeometry(0.035,0.035,l,3),lianaM);
        li.position.set(Math.cos(a)*rr,H-l/2-0.2,Math.sin(a)*rr);li.rotation.set((srand()-.5)*0.15,0,(srand()-.5)*0.15);g.add(li);}
    }
    add(g);
    if(block){TREES.push({x,z,g,h:H});obstacles.push({x,z,r:0.62*s});}
    if(X&&block&&srand()<0.35)for(let i=0;i<14;i++){const a=i*0.95,yy=0.6+i*(H*0.7)/14;lightPts.push([x+Math.cos(a)*0.42*s,y+yy,z+Math.sin(a)*0.42*s]);}
    return H;
  }
  const placed=[],clearOf=(x,z,m)=>!URB.clear.some(q=>Math.hypot(x-q.x,z-q.z)<q.r+m)&&!BASES.some(b=>Math.hypot(x-b.x,z-b.z)<15+m);
  let nt=0;
  for(let k=0;k<9000&&nt<150;k++){
    const x=(srand()*2-1)*(LIM-1.5),z=(srand()*2-1)*(LIM-1.5);
    if(!clearOf(x,z,1)||pathDist(x,z)<3.8||riverDepth(x,z)>-2.4||Math.hypot(x,z)<24||!urbanFree(x,z,2.6)||onJBridge(x,z,3))continue;
    if(URB.zones.flat().concat(URB.gold).some(r=>x>r.x0-3&&x<r.x1+3&&z>r.z0-3&&z<r.z1+3))continue;
    if(placed.some(p=>Math.hypot(p.x-x,p.z-z)<4.3))continue;
    placed.push({x,z});jtree(x,z,0.85+srand()*0.4,true);nt++;
  }
  URB.trees=nt;
  // small palms between the big trees (thin trunks, still something to walk round)
  {const frondM=new THREE.MeshLambertMaterial({color:0x3f7f34,side:THREE.DoubleSide}),pTrunk=texMat(0x7a6a4a,TX.bark,0.08,{shininess:4});
   const frondG=new THREE.PlaneGeometry(0.6,2.2,1,3);{const p=frondG.attributes.position;for(let i=0;i<p.count;i++){const yy=p.getY(i)+1.1;p.setZ(i,-0.1*yy*yy);p.setX(i,p.getX(i)*(1-yy/2.7));}frondG.translate(0,1.1,0);frondG.rotateX(-Math.PI/2+0.45);frondG.computeVertexNormals();}
   let np=0;
   for(let k=0;k<6000&&np<70;k++){const x=(srand()*2-1)*(LIM-1.5),z=(srand()*2-1)*(LIM-1.5);
     if(!clearOf(x,z,0)||pathDist(x,z)<3.4||riverDepth(x,z)>-2.2||Math.hypot(x,z)<23||!urbanFree(x,z,2)||onJBridge(x,z,3)||placed.some(p=>Math.hypot(p.x-x,p.z-z)<2.6))continue;
     if(URB.zones.flat().concat(URB.gold).some(r=>x>r.x0-3&&x<r.x1+3&&z>r.z0-3&&z<r.z1+3))continue;
     placed.push({x,z});const g=new THREE.Group(),s=0.8+srand()*0.5,H=(2.6+srand()*1.6)*s;g.position.set(x,hgt(x,z)-0.05,z);
     const t=new THREE.Mesh(new THREE.CylinderGeometry(0.1*s,0.16*s,H,6),pTrunk);t.position.y=H/2;t.rotation.z=(srand()-.5)*0.15;g.add(t);
     for(let i=0;i<7;i++){const f=new THREE.Mesh(frondG,frondM);f.position.y=H;f.rotation.y=i/7*TAU+srand()*0.4;f.scale.setScalar(s*(0.85+srand()*0.3));g.add(f);}
     add(g);obstacles.push({x,z,r:0.32});np++;}}
  // bushes fill the forest between the trunks (only to look at; the trunks are the obstacles)
  {const bush=new THREE.InstancedMesh(new THREE.DodecahedronGeometry(0.85,0),texMat(0xffffff,TX.leaf,0.06,{flatShading:true,shininess:6}),700);bush.name='kkJBush';
   const d=new THREE.Object3D(),c=new THREE.Color();let n=0;
   for(let k=0;k<20000&&n<700;k++){const x=(srand()*2-1)*(LIM+10),z=(srand()*2-1)*(LIM+10);
     if(!clearOf(x,z,-1)||pathDist(x,z)<2.8||riverDepth(x,z)>-1.2||Math.hypot(x,z)<22||!urbanFree(x,z,1.2)||onJBridge(x,z,2))continue;
     if(URB.zones.flat().concat(URB.gold).some(r=>x>r.x0-2.5&&x<r.x1+2.5&&z>r.z0-2.5&&z<r.z1+2.5))continue;
     d.position.set(x,hgt(x,z)+0.2,z);d.rotation.set(srand(),srand()*3,0);const s=0.7+srand()*1.1;d.scale.set(s*1.3,s*0.8,s*1.2);d.updateMatrix();
     bush.setMatrixAt(n,d.matrix);bush.setColorAt(n,c.setHSL(0.26+srand()*0.08,0.45,0.2+srand()*0.12));n++;}
   bush.count=n;bush.castShadow=true;bush.receiveShadow=true;scene.add(bush);}
  // beyond the edge of the field: more forest, simpler, nothing to bump into
  for(let k=0;k<4000&&placed.length<nt+130;k++){
    const a=srand()*TAU,r=LIM+2+srand()*30,x=Math.cos(a)*r*1.1,z=Math.sin(a)*r*1.1;
    if(Math.max(Math.abs(x),Math.abs(z))<LIM+1||Math.max(Math.abs(x),Math.abs(z))>84||riverDepth(x,z)>-2)continue;
    if(placed.some(p=>Math.hypot(p.x-x,p.z-z)<5))continue;
    placed.push({x,z});jtree(x,z,1+srand()*0.5,false,true);
  }
  // canopy on the horizon, pre-hazed (no fog of its own), so the forest seems to go on and on
  {const hz=new THREE.Color(0xd6dfbf),haze=(c,k)=>new THREE.Color(c).lerp(hz,k),geo=new THREE.IcosahedronGeometry(1,1);
   for(let i=0;i<44;i++){const a=i/44*TAU+srand()*0.1,r=100+srand()*50,k=clamp((r-90)/80,0.3,0.7),s=10+srand()*9;
     const m=new THREE.Mesh(geo,new THREE.MeshLambertMaterial({color:haze(i%2?0x2f5e2c:0x3b6a30,k),fog:false,flatShading:true}));
     m.scale.set(s*1.4,s*0.55,s);m.position.set(Math.cos(a)*r,-1+s*0.2,Math.sin(a)*r);m.rotation.y=a;m.userData.kkFar=true;scene.add(m);}}

  /* ---------- undergrowth: ferns and giant leaves (instanced) ---------- */
  {
    // a fern: eight arched fronds
    const fp=[],fn=[];
    for(let i=0;i<8;i++){const a=i/8*TAU+(i%2)*0.2,L=0.9+(i%3)*0.15;
      for(let k=0;k<4;k++){const t0=k/4,t1=(k+1)/4,w0=0.16*(1-t0*0.8),w1=0.16*(1-t1*0.8);
        const P=t=>[Math.cos(a)*L*t,0.55*Math.sin(t*2.4)*L,Math.sin(a)*L*t],p0=P(t0),p1=P(t1),sx=-Math.sin(a),sz=Math.cos(a);
        const A=[p0[0]-sx*w0,p0[1],p0[2]-sz*w0],B=[p0[0]+sx*w0,p0[1],p0[2]+sz*w0],C=[p1[0]+sx*w1,p1[1],p1[2]+sz*w1],D=[p1[0]-sx*w1,p1[1],p1[2]-sz*w1];
        fp.push(...A,...B,...C,...A,...C,...D);for(let j=0;j<6;j++)fn.push(0,1,0);}}
    const fg=new THREE.BufferGeometry();fg.setAttribute('position',new THREE.Float32BufferAttribute(fp,3));fg.setAttribute('normal',new THREE.Float32BufferAttribute(fn,3));
    // a giant leaf on a stalk: a long, slightly cupped blade
    const lg=new THREE.PlaneGeometry(0.9,2.0,2,4);{const p=lg.attributes.position;for(let i=0;i<p.count;i++){const yy=p.getY(i)+1,x=p.getX(i);p.setX(i,x*(1-Math.pow((yy-1)/1.05,2)*0.9));p.setZ(i,-0.12*yy*yy+Math.abs(x)*0.25);}
      lg.translate(0,1.0,0);lg.rotateX(-Math.PI/2+0.7);lg.translate(0,0.35,0);lg.computeVertexNormals();}
    const fm=new THREE.MeshLambertMaterial({color:0xffffff,side:THREE.DoubleSide}),lm=new THREE.MeshLambertMaterial({color:0xffffff,side:THREE.DoubleSide});
    const NF=520,NL=180,fern=new THREE.InstancedMesh(fg,fm,NF),leaf=new THREE.InstancedMesh(lg,lm,NL);fern.name='kkFern';leaf.name='kkLeaves';
    const d=new THREE.Object3D(),c=new THREE.Color();let a=0,b=0;
    for(let k=0;k<20000&&(a<NF||b<NL);k++){const x=(srand()*2-1)*(LIM+8),z=(srand()*2-1)*(LIM+8);
      if(riverDepth(x,z)>-0.9||Math.hypot(x,z)<16||onJBridge(x,z,1)||!urbanFree(x,z,0.8)||pathDist(x,z)<(a<NF?2.4:3)||!clearOf(x,z,-2))continue;
      if(URB.zones.flat().concat(URB.gold).some(r=>x>r.x0-1.5&&x<r.x1+1.5&&z>r.z0-1.5&&z<r.z1+1.5))continue;
      d.position.set(x,hgt(x,z)-0.03,z);d.rotation.set(0,srand()*TAU,0);
      if(a<NF){const s=0.8+srand()*0.9;d.scale.set(s,s*(0.8+srand()*0.5),s);d.updateMatrix();fern.setMatrixAt(a,d.matrix);fern.setColorAt(a,c.setHSL(0.27+srand()*0.07,0.5,0.28+srand()*0.12));a++;}
      else{for(let j=0;j<1;j++){const s=0.9+srand()*0.8;d.scale.set(s,s,s);d.updateMatrix();leaf.setMatrixAt(b,d.matrix);leaf.setColorAt(b,c.setHSL(0.28+srand()*0.05,0.55,0.25+srand()*0.1));b++;}}}
    fern.count=a;leaf.count=b;for(const m of [fern,leaf]){m.castShadow=true;m.receiveShadow=true;scene.add(m);}
    URB.undergrowth=[fern,leaf];
  }
  // stones and reeds along the banks
  {const reedM=new THREE.MeshLambertMaterial({color:0x6f8a3a});
   for(let k=0,n=0;k<3000&&n<90;k++){const x=(srand()*2-1)*58,z=(srand()*2-1)*58,r=riverDepth(x,z);
     if(r<-1.4||r>-0.6||onJBridge(x,z,1.5))continue;
     const m=new THREE.Mesh(new THREE.ConeGeometry(0.1,1+srand()*0.7,4),reedM);m.position.set(x,hgtRaw(x,z)+0.45,z);scene.add(m);STATIC_ROOTS.push(m);n++;}}

  /* ---------- parrots instead of seagulls, butterflies over the clearings ---------- */
  {const red=new THREE.MeshLambertMaterial({color:0xd8322a,side:THREE.DoubleSide}),blue=new THREE.MeshLambertMaterial({color:0x2a6ad8,side:THREE.DoubleSide}),yel=new THREE.MeshLambertMaterial({color:0xf2c230,side:THREE.DoubleSide}),grn=new THREE.MeshLambertMaterial({color:0x3aa848,side:THREE.DoubleSide});
   birds.forEach((b,i)=>{
     const body=i%3===2?grn:red,w=[blue,yel,red][i%3];
     b.g.traverse(o=>{if(o.isMesh)o.material=w;});b.g.children[0].material=body;
     b.g.scale.setScalar(1.15);b.y=Math.max(13,b.y-3);b.sp*=1.3;
   });}
  const BN=36,bg=new THREE.BufferGeometry();
  bg.setAttribute('position',new THREE.Float32BufferAttribute([0,0,0,-0.22,0,0.12,-0.2,0,-0.14, 0,0,0,0.22,0,0.12,0.2,0,-0.14],3));
  bg.setAttribute('normal',new THREE.Float32BufferAttribute([0,1,0,0,1,0,0,1,0,0,1,0,0,1,0,0,1,0],3));
  const bm=new THREE.MeshBasicMaterial({color:0xffffff,side:THREE.DoubleSide}),flies=new THREE.InstancedMesh(bg,bm,BN);flies.name='kkButterflies';
  const BF=[],BC=[0x3a8cff,0xff9a2a,0xffe04a,0xf0f0ff,0x47d0c8];
  {const c=new THREE.Color();for(let i=0;i<BN;i++){const q=URB.clear[i%URB.clear.length];BF.push({cx:q.x,cz:q.z,r:2+srand()*3,ph:srand()*TAU,sp:0.25+srand()*0.35,y:0.8+srand()*1.4,fl:srand()*TAU});flies.setColorAt(i,c.set(BC[i%BC.length]));}}
  flies.frustumCulled=false;scene.add(flies);URB.flies=flies;
  const fd=new THREE.Object3D();
  const _mood=updateMood;updateMood=function(dt){_mood(dt);
    const night=typeof DN!=='undefined'?DN.night:0,wet=typeof DN!=='undefined'?DN.wx.s:0;
    flies.visible=night<0.5&&wet<0.4;if(!flies.visible)return;
    BF.forEach((f,i)=>{f.ph+=f.sp*dt;f.fl+=dt*16;const x=f.cx+Math.cos(f.ph)*f.r+Math.sin(f.ph*2.3)*0.6,z=f.cz+Math.sin(f.ph*1.3)*f.r;
      fd.position.set(x,hgt(x,z)+f.y+Math.sin(f.ph*3)*0.35,z);fd.rotation.set(0,-f.ph,0);const w=0.25+Math.abs(Math.sin(f.fl));fd.scale.set(w,1,1);fd.updateMatrix();flies.setMatrixAt(i,fd.matrix);});
    flies.instanceMatrix.needsUpdate=true;
  };

  /* ---------- Xmas: lights (one instanced mesh) ---------- */
  if(X&&lightPts.length){
    const ORNC=[0xff3b3b,0xffd24a,0x4ad7ff,0x7dff7a,0xffffff];
    const lm=new THREE.InstancedMesh(new THREE.SphereGeometry(0.12,6,4),new THREE.MeshBasicMaterial({color:0xffffff}),lightPts.length),d=new THREE.Object3D(),c=new THREE.Color();
    lightPts.forEach((p,i)=>{d.position.set(p[0],p[1],p[2]);d.updateMatrix();lm.setMatrixAt(i,d.matrix);lm.setColorAt(i,c.set(ORNC[i%ORNC.length]));});
    scene.add(lm);URB.lights=lm;
  }
})();
