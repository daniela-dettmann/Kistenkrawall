/* Kistenkrawall: Weihnachtsedition.
   Jedes Jahr automatisch vom 1. November bis 10. Januar (Datum des Geräts). Im Menü abschaltbar
   (kk-xmas=off). Zum Testen: ?weihnachten erzwingt sie, ?normal schaltet sie aus.

   Die Datei legt sich über das fertig geladene Spiel, ohne den übrigen Code zu verändern:
   - Funktionen, die Figuren, Fahrzeuge, Kisten und Schüsse bauen, werden umhüllt und schmücken ihr Ergebnis.
   - Die beim Laden gebaute Welt (Bäume, Gelände, Wasser, Brücken, Hauptquartiere) wird nachträglich dekoriert.
   Viele gleiche Kleinteile (Christbaumkugeln, Schneehauben, Lichter) sind InstancedMeshes: ein Zeichenaufruf statt hunderte. */
'use strict';
const XMAS=(function(){
  const q=location.search+location.hash;
  if(/weihnachten/i.test(q))return true;
  if(/\bnormal\b/i.test(q))return false;
  try{if(localStorage.getItem('kk-xmas')==='off')return false;}catch(e){}
  return xmasSeason();
})();
function xmasSeason(d){d=d||new Date();const m=d.getMonth(),day=d.getDate();return m===10||m===11||(m===0&&day<=10);}
const XMAS_FORCED=/weihnachten/i.test(location.search+location.hash);

/* ----- menu: toggle (only in season or when forced) ----- */
(function(){
  const btn=$('#xmasToggle');if(!btn)return;
  if(!xmasSeason()&&!XMAS_FORCED)return;
  btn.hidden=false;btn.textContent='Weihnachtsedition: '+(XMAS?'an':'aus');btn.setAttribute('aria-pressed',XMAS?'true':'false');
  btn.addEventListener('click',()=>{
    try{localStorage.setItem('kk-xmas',XMAS?'off':'on');}catch(e){}
    if(state==='play')writeSave();
    const u=new URL(location.href);u.search='';u.hash='';location.replace(u.href);
  });
})();

if(XMAS)(function(){
  document.documentElement.classList.add('xmas');
  {const h=$('.logo');if(h)h.innerHTML='<span class="kis">Kisten</span><span>krawall</span>';}

  const RED=0xd42b2b,GREEN=0x1f8a3c,GOLD=0xffc93c,WHITE=0xf4f8ff;
  const ORN=[0xd42b2b,0xffc93c,0x2f6fd6,0x1f9a4a,0xe8e8f0,0xc23bd4];
  const shiny=c=>new THREE.MeshPhongMaterial({color:c,specular:0xffffff,shininess:110});
  const matte=c=>new THREE.MeshLambertMaterial({color:c});
  const snowMat=new THREE.MeshLambertMaterial({color:WHITE,emissive:0x1a2230});
  const add=(parent,geo,mat,x,y,z)=>{const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);m.castShadow=true;parent.add(m);return m;};
  function stripeTex(a,b,n){return canvasTex(64,(g,S)=>{g.fillStyle=a;g.fillRect(0,0,S,S);g.fillStyle=b;const w=S/n;for(let i=-n;i<n*2;i+=2){g.beginPath();g.moveTo(i*w,0);g.lineTo(i*w+w,0);g.lineTo(i*w+w+S,S);g.lineTo(i*w+S,S);g.fill();}});}
  const candy=new THREE.MeshPhongMaterial({map:stripeTex('#ffffff','#d42b2b',4),shininess:60,specular:0x666666});
  // collect instance placements, build one InstancedMesh per kind at the end
  function instanced(geo,mat,items){
    if(!items.length)return null;
    const im=new THREE.InstancedMesh(geo,mat,items.length),d=new THREE.Object3D(),c=new THREE.Color();
    items.forEach((it,i)=>{d.position.copy(it.p);d.rotation.set(it.rx||0,it.ry||0,it.rz||0);d.scale.copy(it.s||new THREE.Vector3(1,1,1));d.updateMatrix();im.setMatrixAt(i,d.matrix);if(it.c!=null)im.setColorAt(i,c.set(it.c));});
    im.castShadow=true;scene.add(im);return im;
  }
  const V=(x,y,z)=>new THREE.Vector3(x,y,z);

  /* ---------- Gelände, Wasser, Gras, Schneewälle ---------- */
  scene.traverse(o=>{
    if(!o.isMesh)return;
    if(!MOUNTAIN&&o.material&&o.material.map===TX.ground&&o.geometry.attributes.color){
      const p=o.geometry.attributes.position,col=o.geometry.attributes.color,snow=new THREE.Color(0xffffff),dirt=new THREE.Color(0xa99a86),c=new THREE.Color();
      for(let i=0;i<p.count;i++){
        const x=p.getX(i),z=p.getZ(i),h=p.getY(i);if(h<-1.05)continue;   // keep beach sand under water
        c.setRGB(col.getX(i),col.getY(i),col.getZ(i));
        const path=pathDist(x,z),k=h<-0.6?0.4:0.93;
        c.lerp(snow,k);if(path<2.0)c.lerp(dirt,(1-path/2)*0.45);
        col.setXYZ(i,c.r,c.g,c.b);
      }
      col.needsUpdate=true;
    }
    if(o.material&&o.position.y===-1.65&&o.material.transparent){o.material.color.set(0x4f9fc9);}
  });
  scene.traverse(o=>{if(o.isInstancedMesh&&o.count>2000){const c=new THREE.Color();for(let i=0;i<o.count;i++){o.getColorAt(i,c);c.lerp(new THREE.Color(0xeef4fa),0.85);o.setColorAt(i,c);}o.instanceColor.needsUpdate=true;}
    else if(o.isInstancedMesh&&o.count>200&&o.count<=2000&&o.geometry.type==='IcosahedronGeometry'){const c=new THREE.Color();for(let i=0;i<o.count;i++)o.setColorAt(i,c.set(ORN[i%ORN.length]));o.instanceColor.needsUpdate=true;}});
  bagMat.color.set(0xf2f6ff);bagMat.emissive=new THREE.Color(0x141c26);
  rockMat.color.set(0xc9ccd2);

  /* ---------- Bäume: geschmückte Tannen, Schneehauben ---------- */
  const balls=[],stars=[],caps=[],tmp=new THREE.Vector3();
  scene.updateMatrixWorld(true);
  scene.traverse(o=>{
    if(!o.isMesh)return;
    if(pineMat.includes(o.material)&&o.geometry.type==='ConeGeometry'){
      const pr=o.geometry.parameters,r=pr.radius,h=pr.height;
      const n=Math.max(4,Math.round(r*5));
      for(let i=0;i<n;i++){
        const a=i/n*TAU+srand()*0.4,dy=-0.32*h+srand()*0.12*h,rr=r*(0.5-dy/h)*1.02;
        tmp.set(Math.cos(a)*rr,dy,Math.sin(a)*rr);o.localToWorld(tmp);
        balls.push({p:tmp.clone(),c:ORN[Math.floor(srand()*ORN.length)],s:V(1,1,1).multiplyScalar(0.8+srand()*0.5)});
      }
      tmp.set(0,h*0.5+0.12,0);o.localToWorld(tmp);
      const above=o.parent.children.some(s=>s!==o&&s.geometry&&s.geometry.type==='ConeGeometry'&&s.position.y>o.position.y);
      if(!above)stars.push({p:tmp.clone(),s:V(1,1,1).multiplyScalar(r*0.42+0.12),ry:srand()*3});
      // a little snow on the branches
      tmp.set(0,-0.18*h,0);o.localToWorld(tmp);caps.push({p:tmp.clone(),s:V(r*0.9,0.12,r*0.9)});
    }
    if(leafPal.includes(o.material)){
      const r=o.geometry.parameters.radius;
      tmp.set(0,r*0.55,0);o.localToWorld(tmp);
      caps.push({p:tmp.clone(),s:V(r*0.86,r*0.34,r*0.86),ry:srand()*3});
    }
  });
  instanced(new THREE.SphereGeometry(0.11,10,8),new THREE.MeshPhongMaterial({color:0xffffff,specular:0xffffff,shininess:120}),balls);
  instanced(new THREE.OctahedronGeometry(1,0),new THREE.MeshBasicMaterial({color:GOLD}),stars);
  instanced(new THREE.IcosahedronGeometry(1,1),snowMat,caps);

  /* ---------- Lichterketten an den Brücken ---------- */
  {const lights=[];for(const bx of BRIDGES){if(MOUNTAIN&&bx>0)continue;const cw=crossW(bx)-0.05;for(const sx of [-cw,cw])for(const side of [-1,1])for(let k=0;k<9;k++)
     lights.push({p:V(bx+sx,1.12,side*(2.9+k*0.79)),c:[RED,GOLD,0x3fa0ff,0x3fd46a][(k+(sx>0?1:0))%4]});}
   const lm=instanced(new THREE.SphereGeometry(0.085,8,6),new THREE.MeshBasicMaterial({color:0xffffff}),lights);if(lm)lm.castShadow=false;}

  /* ---------- Hauptquartiere als Lebkuchenhäuser ---------- */
  const ginger=texMat(0xb86a32,canvasTex(128,(g,S)=>{
    const n=fbm(S,[32,8]);paintPixels(g,S,(x,y)=>{const k=0.85+n[y*S+x]*0.25;return [c8(190*k),c8(112*k),c8(58*k)];});
    g.fillStyle='rgba(255,255,255,.9)';for(let i=0;i<5;i++){g.beginPath();g.arc(16+i*24,10,7,0,Math.PI);g.fill();}
    g.strokeStyle='rgba(255,255,255,.8)';g.lineWidth=3;g.beginPath();for(let x=0;x<=S;x+=8)g.lineTo(x,S-10+Math.sin(x*0.4)*4);g.stroke();
  }),0.05,{shininess:8});
  for(const hq of hqs){
    const g=hq.g;
    const body=g.children.find(c=>c.isMesh&&c.geometry.type==='BoxGeometry'&&c.geometry.parameters.width===4.2);
    if(body)body.material=ginger;
    const icing=add(g,new THREE.BoxGeometry(4.9,0.28,4.1),snowMat,0,2.82,0);icing.receiveShadow=true;
    for(let i=0;i<14;i++){const a=i/14;const x=-2.35+a*4.7;add(g,new THREE.SphereGeometry(0.16,8,6),snowMat,x,2.66,2.05).scale.y=1.6;add(g,new THREE.SphereGeometry(0.16,8,6),snowMat,x,2.66,-2.05).scale.y=1.6;}
    for(let i=0;i<7;i++)add(g,new THREE.SphereGeometry(0.17,10,8),shiny(ORN[i%ORN.length]),-1.9+i*0.63,3.03,1.85);
    for(const sx of [-1,1])for(const sz of [-1,1]){const cc=add(g,new THREE.CylinderGeometry(0.2,0.2,2.55,10),candy,sx*2.05,1.27,sz*1.65);cc.material=candy;}
    // a team-coloured wreath on the door keeps both houses easy to tell apart
    const wreath=add(g,new THREE.TorusGeometry(0.42,0.13,8,18),matte(GREEN),0,1.15,1.82);
    add(g,new THREE.SphereGeometry(0.13,8,6),matte(TEAMC[hq.team]),0,0.75,1.86);
    wreath.add(new THREE.Mesh(new THREE.TorusGeometry(0.42,0.04,6,18),matte(TEAMC[hq.team])));
  }

  /* ---------- Kisten als Geschenke ---------- */
  function wrapTex(paper,dots,ribbon){
    return canvasTex(128,(g,S)=>{
      g.fillStyle=paper;g.fillRect(0,0,S,S);
      g.fillStyle=dots;for(let y=8;y<S;y+=20)for(let x=(y/20%2)*10+6;x<S;x+=20){g.beginPath();g.arc(x,y,3.2,0,TAU);g.fill();}
      g.fillStyle=ribbon;g.fillRect(S/2-11,0,22,S);g.fillRect(0,S/2-11,S,22);
      g.fillStyle='rgba(0,0,0,.18)';g.fillRect(S/2-11,0,3,S);g.fillRect(0,S/2-11,S,3);
      g.strokeStyle='rgba(0,0,0,.25)';g.lineWidth=4;g.strokeRect(2,2,S-4,S-4);
    });
  }
  const swap=(mat,tex)=>{mat.map=tex;mat.bumpMap=tex;mat.color.set(0xffffff);mat.needsUpdate=true;};
  swap(M.blau,wrapTex('#2f6fd6','#cfe2ff','#ffffff'));
  swap(M.gelb,wrapTex('#f2b51f','#fff4cc','#d42b2b'));
  M.gold.map=wrapTex('#ffcf4a','#fff6d0','#ffffff');M.gold.bumpMap=M.gold.map;M.gold.needsUpdate=true;
  M.chute.map=stripeTex('#ffffff','#d42b2b',6);M.chute.color.set(0xffffff);M.chute.needsUpdate=true;
  const bowMat={blau:matte(0xffffff),gelb:matte(RED),gold:shiny(0xffffff)};
  const loopG=new THREE.TorusGeometry(0.17,0.055,6,14),knotG=new THREE.SphereGeometry(0.09,8,6);
  function addBow(c){
    const mat=c.gold?bowMat.gold:bowMat[c.sort]||bowMat.blau,b=new THREE.Group();
    for(const s of [-1,1]){const l=new THREE.Mesh(loopG,mat);l.position.set(s*0.15,0.05,0);l.rotation.set(0,Math.PI/2,s*0.5);b.add(l);}
    b.add(new THREE.Mesh(knotG,mat));b.position.y=0.55;c.m.add(b);c.bow=b;
  }
  const _spawnCrate=spawnCrate;
  spawnCrate=function(x,z,sky,gold,sort){const c=_spawnCrate(x,z,sky,gold,sort);addBow(c);return c;};
  for(const c of crates)addBow(c);

  /* ---------- Kostüme ---------- */
  const COSTUMES=['santa','elf','snowman','elf','santa'];let costumeN=0;
  const hatRed=matte(RED),elfGreen=matte(GREEN),black=matte(0x1d1d22),beard=matte(0xfbfbff),carrot=matte(0xff7a1a),skin=matte(0xffd8b0),bell=shiny(GOLD);
  const coneG=new THREE.ConeGeometry(0.34,0.62,14),elfConeG=new THREE.ConeGeometry(0.3,0.78,12),brimG=new THREE.TorusGeometry(0.33,0.085,8,18),pomG=new THREE.SphereGeometry(0.11,10,8);
  function costume(b,team,kind){
    const g=b.g,trim=matte(TEAMC[team]);
    if(b.antP)b.antP.visible=false;
    if(kind==='santa'){
      const hat=new THREE.Group();hat.position.set(0,1.78,0);hat.rotation.z=0.18;g.add(hat);
      add(hat,coneG,hatRed,0,0.26,0);const br=add(hat,brimG,trim,0,0,0);br.rotation.x=Math.PI/2;
      add(hat,pomG,beard,0.05,0.6,0);
      const bd=add(g,new THREE.SphereGeometry(0.26,12,8,0,TAU,Math.PI*0.35,Math.PI*0.65),beard,0,1.42,0.2);bd.scale.set(1.15,1.1,0.7);
      add(g,new THREE.BoxGeometry(0.3,0.06,0.05),beard,0,1.42,0.31);   // moustache
    }else if(kind==='elf'){
      const hat=new THREE.Group();hat.position.set(0,1.76,0);hat.rotation.z=-0.35;g.add(hat);
      add(hat,elfConeG,elfGreen,0,0.36,0);const br=add(hat,brimG,trim,0,0,0);br.rotation.x=Math.PI/2;br.scale.setScalar(0.92);
      add(hat,pomG,bell,0,0.78,0).scale.setScalar(0.8);
      for(const s of [-1,1]){const e=add(g,new THREE.ConeGeometry(0.08,0.36,8),skin,s*0.44,1.55,0);e.rotation.z=-s*1.15;}
    }else{
      const hat=new THREE.Group();hat.position.set(0,1.74,0);g.add(hat);
      add(hat,new THREE.CylinderGeometry(0.42,0.42,0.04,16),black,0,0,0);
      add(hat,new THREE.CylinderGeometry(0.27,0.27,0.46,16),black,0,0.25,0);
      add(hat,new THREE.CylinderGeometry(0.275,0.275,0.09,16),trim,0,0.08,0);
      const n=add(g,new THREE.ConeGeometry(0.07,0.32,8),carrot,0,1.4,0.42);n.rotation.x=Math.PI/2;
      const sc=add(g,new THREE.TorusGeometry(0.36,0.08,8,18),matte(RED),0,1.2,0);sc.rotation.x=Math.PI/2;
      add(g,new THREE.BoxGeometry(0.12,0.4,0.05),matte(RED),0.22,1.0,0.36).rotation.z=0.2;
    }
    b.costume=kind;
  }
  const _makeBot=makeBot;
  makeBot=function(team){const b=_makeBot(team);costume(b,team,COSTUMES[costumeN++%COSTUMES.length]);return b;};

  /* ---------- Fahrzeuge ---------- */
  function hideOwn(b,keep){for(const c of b.g.children)if(c.isMesh&&!keep.includes(c))c.visible=false;}
  function runners(g,len,w,h){
    const gold=shiny(GOLD);
    for(const s of [-1,1]){
      add(g,new THREE.BoxGeometry(0.1,0.1,len),gold,s*w,0.08,0);
      const curl=add(g,new THREE.TorusGeometry(0.32,0.05,6,12,Math.PI*1.2),gold,s*w,0.4,len/2-0.05);curl.rotation.y=Math.PI/2;curl.rotation.z=-0.4;
      for(const z of [-len*0.3,len*0.25])add(g,new THREE.BoxGeometry(0.08,h,0.08),gold,s*w,h/2+0.08,z);
    }
  }
  const _makeTank=makeTank;
  makeTank=function(team){   // Schlitten, der Geschenke verschießt
    const b=_makeTank(team);hideOwn(b,[]);const g=b.g;
    const sled=texMat(RED,TX.paint,0.02,{specular:0x775555,shininess:50});
    add(g,new THREE.BoxGeometry(2.0,0.75,2.8),sled,0,0.95,-0.1);
    const front=add(g,new THREE.CylinderGeometry(0.75,0.75,2.0,16,1,false,0,Math.PI),sled,0,1.0,1.25);front.rotation.z=Math.PI/2;front.rotation.y=Math.PI/2;
    add(g,new THREE.BoxGeometry(2.1,0.16,2.9),b.paint,0,1.36,-0.1);           // team-coloured rim
    add(g,new THREE.BoxGeometry(1.9,0.9,0.25),sled,0,1.6,-1.45);               // high backrest
    runners(g,3.4,1.0,0.55);
    for(let i=0;i<4;i++){const p=add(g,new THREE.BoxGeometry(0.5,0.45,0.5),matte(ORN[i]),-0.6+(i%2)*1.1,1.6+Math.floor(i/2)*0.42,-0.95);p.rotation.y=i;}
    // the cannon becomes a striped present launcher
    for(const c of b.turret.children)if(c.isMesh&&c.geometry.type==='CylinderGeometry'&&c.geometry.parameters.height>1.5)c.material=candy;
    return b;
  };
  const _makeBuggy=makeBuggy;
  makeBuggy=function(team){   // Motorschlitten
    const b=_makeBuggy(team);for(const w of b.wheels)w.visible=false;
    for(const s of [-1,1]){const ski=add(b.g,new THREE.BoxGeometry(0.28,0.07,2.6),shiny(0xdedede),s*0.8,0.1,0.1);const tip=add(b.g,new THREE.BoxGeometry(0.28,0.07,0.4),shiny(0xdedede),s*0.8,0.22,1.45);tip.rotation.x=-0.6;ski.receiveShadow=true;}
    add(b.g,new THREE.BoxGeometry(1.4,0.42,0.5),matte(0x2a2a2a),0,0.3,-0.9);
    add(b.g,new THREE.SphereGeometry(0.13,10,8),bell,0.45,1.15,1.0);add(b.g,new THREE.SphereGeometry(0.13,10,8),bell,-0.45,1.15,1.0);
    return b;
  };
  const _makeMortar=makeMortar;
  makeMortar=function(team){   // Schneeball-Katapult
    const b=_makeMortar(team);
    const tube=b.turret.children.find(c=>c.isGroup);
    if(tube)add(tube,new THREE.SphereGeometry(0.34,12,10),snowMat,0,1.4,0);
    for(let i=0;i<5;i++)add(b.g,new THREE.SphereGeometry(0.24,10,8),snowMat,-0.5+(i%3)*0.5,1.12+Math.floor(i/3)*0.3,-0.85);
    add(b.g,new THREE.BoxGeometry(1.9,0.14,2.3),snowMat,0,1.03,0.1);
    return b;
  };
  const _makeTurm=makeTurm;
  makeTurm=function(team){   // Nussknacker-Turm
    const b=_makeTurm(team),t=b.turret;
    add(t,new THREE.BoxGeometry(0.62,0.42,0.5),skin,0,0.62,0.05);
    add(t,new THREE.CylinderGeometry(0.33,0.31,0.62,14),black,0,1.12,0.05);
    add(t,new THREE.CylinderGeometry(0.335,0.335,0.1,14),shiny(GOLD),0,0.88,0.05);
    add(t,new THREE.SphereGeometry(0.1,8,6),shiny(GOLD),0,1.25,0.36);
    const bd=add(t,new THREE.BoxGeometry(0.56,0.2,0.1),beard,0,0.45,0.32);bd.scale.y=1.2;
    for(const s of [-1,1])add(t,new THREE.BoxGeometry(0.09,0.06,0.04),black,s*0.14,0.7,0.31);
    add(t,new THREE.BoxGeometry(0.88,0.18,0.92),matte(RED),0,-0.1,0);
    return b;
  };

  /* ---------- Geschosse ---------- */
  const ballG=new THREE.SphereGeometry(0.15,10,8),capG=new THREE.CylinderGeometry(0.05,0.05,0.07,8);
  const ballMats=ORN.map(c=>new THREE.MeshPhongMaterial({color:c,specular:0xffffff,shininess:120,emissive:new THREE.Color(c).multiplyScalar(0.25)}));
  const flakeMat=new THREE.MeshBasicMaterial({color:0xeaf6ff}),flakeG=new THREE.OctahedronGeometry(0.13,0);
  const starMat=new THREE.MeshBasicMaterial({color:GOLD}),starG=new THREE.TetrahedronGeometry(0.12,0);
  const giftG=new THREE.BoxGeometry(0.46,0.46,0.46),ribG=new THREE.BoxGeometry(0.48,0.48,0.1),snowballG=new THREE.SphereGeometry(0.34,12,10);
  function shotMesh(weapon,old){
    let m;
    if(weapon==='spritzer'){m=new THREE.Mesh(flakeG,flakeMat);}
    else if(weapon==='streuer'){m=new THREE.Mesh(starG,starMat);}
    else if(weapon==='krachrohr'){   // Feuerwerksrakete
      m=new THREE.Group();const r=new THREE.Mesh(new THREE.CylinderGeometry(0.1,0.1,0.55,8),candy);r.rotation.x=Math.PI/2;m.add(r);
      const tip=new THREE.Mesh(new THREE.ConeGeometry(0.12,0.24,8),shiny(GOLD));tip.rotation.x=Math.PI/2;tip.position.z=0.38;m.add(tip);
    }else if(weapon==='kanone'){   // Geschenkpaket
      m=new THREE.Group();const c=ORN[Math.floor(Math.random()*ORN.length)];
      m.add(new THREE.Mesh(giftG,matte(c)));const r1=new THREE.Mesh(ribG,matte(c===0xffc93c?RED:GOLD));m.add(r1);const r2=r1.clone();r2.rotation.y=Math.PI/2;m.add(r2);
      m.userData.spin=true;
    }else if(weapon==='moerser'){m=new THREE.Mesh(snowballG,snowMat);}
    else{   // Christbaumkugel
      m=new THREE.Mesh(ballG,ballMats[Math.floor(Math.random()*ballMats.length)]);
      const cap=new THREE.Mesh(capG,shiny(GOLD));cap.position.y=0.15;m.add(cap);
    }
    m.position.copy(old.position);m.rotation.y=old.rotation.y;m.castShadow=true;m.userData.xmas=true;
    return m;
  }
  const _fire=fire;
  fire=function(u,ang,cdMul,tgt){
    const n=shots.length,ok=_fire(u,ang,cdMul,tgt);
    if(ok)for(let i=n;i<shots.length;i++){const s=shots[i];const m=shotMesh(u.weapon,s.m);scene.remove(s.m);scene.add(m);s.m=m;}
    return ok;
  };

  /* ---------- Schneefall, Eisschollen, Weihnachtsmann am Himmel ---------- */
  const SN=MOUNTAIN?0:1400,   // the mountain already has its own snow drift
  snowGeo=new THREE.BufferGeometry(),sp=new Float32Array(SN*3);
  for(let i=0;i<SN;i++){sp[i*3]=rand(-40,40);sp[i*3+1]=rand(0,30);sp[i*3+2]=rand(-40,40);}
  snowGeo.setAttribute('position',new THREE.BufferAttribute(sp,3));
  const flakes=new THREE.Points(snowGeo,new THREE.PointsMaterial({color:0xffffff,size:0.16,transparent:true,opacity:0.85,depthWrite:false}));
  flakes.frustumCulled=false;scene.add(flakes);

  const floes=[];
  for(let i=0;i<(MOUNTAIN?0:16);i++){
    const m=new THREE.Mesh(new THREE.CylinderGeometry(rand(0.6,1.4),rand(0.7,1.5),0.16,7),snowMat);
    m.position.set(rand(-60,60),-1.58,rand(-5.5,5.5));m.rotation.y=rand(0,3);m.receiveShadow=true;scene.add(m);floes.push({m,v:rand(0.5,1.1)});
  }

  for(const b of birds)b.g.visible=false;
  const sleigh=(function(){
    const g=new THREE.Group(),brown=matte(0x7a4a26),antl=matte(0xd9c29a);
    const s=new THREE.Group();g.add(s);
    add(s,new THREE.BoxGeometry(1.4,0.7,2.2),matte(RED),0,0.5,0);
    add(s,new THREE.BoxGeometry(1.4,0.8,0.25),matte(RED),0,0.95,-1.0);
    runners(s,2.6,0.6,0.3);
    add(s,new THREE.SphereGeometry(0.42,12,10),matte(RED),0,1.25,-0.35);                 // Weihnachtsmann
    add(s,new THREE.SphereGeometry(0.25,10,8),skin,0,1.78,-0.3);
    add(s,new THREE.ConeGeometry(0.24,0.5,10),hatRed,0,2.15,-0.3);
    add(s,new THREE.SphereGeometry(0.22,10,8),beard,0,1.65,-0.12).scale.set(1,0.9,0.6);
    for(let i=0;i<3;i++)add(s,new THREE.BoxGeometry(0.42,0.42,0.42),matte(ORN[i]),-0.35+i*0.35,1.0,-0.75).rotation.y=i;
    const deer=[];
    for(let i=0;i<6;i++){
      const d=new THREE.Group();d.position.set((i%2?0.55:-0.55),0.7,2.4+Math.floor(i/2)*1.7);g.add(d);
      add(d,new THREE.BoxGeometry(0.42,0.42,1.0),brown,0,0,0);
      const hd=add(d,new THREE.BoxGeometry(0.3,0.32,0.45),brown,0,0.38,0.6);
      for(const sx of [-1,1]){const a=add(hd,new THREE.CylinderGeometry(0.03,0.03,0.45,5),antl,sx*0.12,0.35,-0.05);a.rotation.z=sx*0.5;}
      const legs=[];for(const [lx,lz] of [[-0.14,0.35],[0.14,0.35],[-0.14,-0.35],[0.14,-0.35]]){const l=add(d,new THREE.BoxGeometry(0.1,0.5,0.1),brown,lx,-0.4,lz);legs.push(l);}
      if(i>=4){const nose=add(hd,new THREE.SphereGeometry(0.09,8,6),new THREE.MeshBasicMaterial({color:0xff2020}),0,-0.02,0.25);nose.userData.glow=true;}
      deer.push({d,legs});
    }
    const reinMat=new THREE.LineBasicMaterial({color:0xffd27a});
    const rein=new THREE.BufferGeometry().setFromPoints([V(-0.3,0.9,0.9),V(-0.55,0.8,5.8),V(0.3,0.9,0.9),V(0.55,0.8,5.8)]);
    g.add(new THREE.LineSegments(rein,reinMat));
    const glowLight=new THREE.PointLight(0xff3030,0,9,2);glowLight.position.set(0,0.7,6.1);g.add(glowLight);
    g.visible=false;g.scale.setScalar(1.15);scene.add(g);
    return {g,deer,glowLight,t:-1,wait:rand(12,25),dur:26,y:30,z:0,dir:1};
  })();

  let last=performance.now(),tAcc=0;
  (function tick(now){
    requestAnimationFrame(tick);
    const dt=Math.min(0.05,(now-last)/1000);last=now;tAcc+=dt;
    if(state==='pause'||document.hidden)return;
    // snow follows the camera
    const P=snowGeo.attributes.position,a=P.array,cx=camera.position.x,cz=camera.position.z,cy=camera.position.y;
    for(let i=0;i<SN;i++){
      a[i*3+1]-=dt*(1.6+(i%7)*0.18);a[i*3]+=Math.sin(tAcc*0.7+i)*dt*0.4;
      if(a[i*3+1]<cy-14){a[i*3+1]=cy+16;a[i*3]=cx+rand(-38,38);a[i*3+2]=cz+rand(-38,38);}
      if(Math.abs(a[i*3]-cx)>40)a[i*3]=cx+rand(-38,38);if(Math.abs(a[i*3+2]-cz)>40)a[i*3+2]=cz+rand(-38,38);
    }
    P.needsUpdate=true;
    for(const f of floes){f.m.position.x+=f.v*dt;f.m.rotation.y+=dt*0.05;if(f.m.position.x>62)f.m.position.x=-62;}
    // Santa's sleigh crosses the sky every couple of minutes
    const S=sleigh;
    if(S.t<0){S.wait-=dt;if(S.wait<=0){S.t=0;S.dir=Math.random()<.5?1:-1;S.z=rand(-30,30);S.y=rand(24,32);S.g.visible=true;S.g.rotation.y=S.dir>0?Math.PI/2:-Math.PI/2;if(typeof xmasJingle==='function')xmasJingle();}}
    else{
      S.t+=dt;const k=S.t/S.dur;
      S.g.position.set(S.dir*(-130+260*k),S.y+Math.sin(S.t*1.3)*1.2,S.z+Math.sin(S.t*0.4)*6);
      for(const [i,r] of S.deer.entries())r.legs.forEach((l,j)=>{l.rotation.x=Math.sin(S.t*9+i+j*Math.PI)*0.6;});
      S.glowLight.intensity=1.5+Math.sin(S.t*6)*0.6;
      if(k>=1){S.t=-1;S.wait=rand(70,140);S.g.visible=false;}
    }
    // present shells tumble, bows sit only on the top crate of a stack
    for(const s of shots)if(s.m.userData.spin){s.m.rotation.x+=dt*4;s.m.rotation.z+=dt*3;}
    for(const c of crates)if(c.bow&&c.state!=='stack')c.bow.visible=true;
    for(const p of pads){const top=Math.floor((p.stack.length-1)/4)*4;p.stack.forEach((c,i)=>{if(c.bow)c.bow.visible=i>=top;});}
  })(last);

  /* ---------- Musik, Töne, Namen, Sprüche ---------- */
  const _wanted=wantedMusic;
  wantedMusic=function(){const w=_wanted();return w&&MUSIC.tracks[w+'_x']?w+'_x':w;};
  musicJingle=function(win){if(music&&soundOn)music.play(win?'sieg_x':'niederlage',{now:true});};
  const _sfx=sfx;
  sfx=function(kind,x,z){return _sfx(kind==='hit'?'xhit':kind,x,z);};
  window.xmasJingle=function(){if(AC&&soundOn&&AC.state==='running'&&state!=='pause')playSound(AC,noiseBuf,'sleigh',0.55,master);};
  NAMES.splice(0,NAMES.length,'Flinki','Zimtstern','Lebkuchen','Rudi','Knecht Bolzen','Glöckchen','Lametta','Zuckerstange','Schneeflocke','Nussknacker','Stollen','Marzipan','Plätzchen','Tannenzapfen','Wichtel','Pfefferkuchen');
  Object.assign(LINES,{
    pick:['Ho ho ho, meins!','Ein Geschenk!','Gut eingepackt.','Was da wohl drin ist?','Nicht schütteln!'],
    stack:['Unterm Baum wird es voll!','Ordentlich gestapelt, wie in der Werkstatt.','Noch ein Päckchen!','Die Bescherung naht!'],
    open:['Bescherung!','Oh, was glänzt da?','Genau das wollte ich!','Auspacken ist das Beste.'],
    recruit:['Frisch vom Nordpol!','Bin noch in Geschenkpapier!','Wer hat mich bestellt?'],
    hit:['Au, meine Mütze!','Mein Bommel!','He, das war Lametta!','Kalt, kalt, kalt!','Das gibt Beulen im Lack!'],
    kill:['Ab in den Kamin!','Kein Geschenk für dich!','Fröhliche Verschrottung!','Rute statt Päckchen!'],
    steal:['Danke fürs Einpacken!','Das kommt unter meinen Baum.','Frühe Bescherung!'],
    empty:['Keine Kugeln mehr! Zurück zum Knipser.','Klingeling. Leer.'],
    idle:['Riecht nach Plätzchen hier.','Wer hat die Geschenke bestellt?','Mir ist kalt an den Schrauben.','Hörst du die Glöckchen?']
  });

  window.xmasSleigh=sleigh;   // for tests
  // the menu's demo round was built before the costumes existed: rebuild it
  if(state==='menu')newGame(true);
})();
