/* Kistenkrawall: Lichtstrahlen (Auftrag „Grafik und Atmosphäre“, Schritt 2).
   Ohne zusätzlichen Bilddurchgang: lange, halbdurchsichtige Lichtbahnen, die hell aufaddiert werden.
   - Durch Wolkenlücken: neben den Wolken in der Nähe fallen breite Lichtbahnen schräg zum Boden, genau in Richtung
     der Sonne; sie wandern mit den Wolken und blenden sanft ein und aus.
   - Durch Bäume: unter den Kronen in Kameranähe schmale Strahlen bis zum Boden (Gebirge: Tannen, Wüste: Palmen,
     im Dschungel unter dem hohen Blätterdach).
   - Die Richtung folgt der Sonne (Tageszeit), abends werden sie warm und lang, nachts sind sie aus. Bei Regen,
     Schnee- und Sandsturm verschwinden sie, auf dem Mond (keine Luft) gibt es keine.
   - Nur auf „Grafik: Hoch“; auf „Niedrig“ aus. Zwei Zeichenvorgänge (je ein InstancedMesh). */
'use strict';
const RAYS={sky:0,tree:0,k:0,mesh:null,treeMesh:null};
(function(){
  if(MOON)return;
  // a soft beam: bright in the middle across, fading at the sides; fading in at the top, out towards the ground
  const tex=(function(){const W=32,H=128,c=document.createElement('canvas');c.width=W;c.height=H;const g=c.getContext('2d'),id=g.createImageData(W,H);
    for(let y=0;y<H;y++)for(let x=0;x<W;x++){const u=(x+0.5)/W-0.5,v=(y+0.5)/H,a=Math.exp(-u*u*22)*smooth(v/0.15)*smooth((0.9-v)/0.6),k=(y*W+x)*4;
      id.data[k]=id.data[k+1]=id.data[k+2]=Math.round(255*a);id.data[k+3]=255;}
    g.putImageData(id,0,0);return new THREE.CanvasTexture(c);})();
  const geo=new THREE.PlaneGeometry(1,1).translate(0,-0.5,0);   // from the origin downwards: the origin is where the beam starts
  // „screen“ mixing instead of plain adding: the beams lighten dark and middle tones, but hardly touch what is already
  // bright (sky, sand, snow), so nothing burns out to white (the iPhone overexposed easily before #24)
  const mat=()=>new THREE.MeshBasicMaterial({map:tex,color:0xffffff,transparent:true,depthWrite:false,side:THREE.DoubleSide,
    blending:THREE.CustomBlending,blendEquation:THREE.AddEquation,blendSrc:THREE.OneMinusDstColorFactor,blendDst:THREE.OneFactor});
  const SN=12,TN=18;
  const sky=new THREE.InstancedMesh(geo,mat(),SN),tree=new THREE.InstancedMesh(geo,mat(),TN);
  for(const m of [sky,tree]){m.frustumCulled=false;m.renderOrder=3;m.visible=false;m.instanceMatrix.setUsage(THREE.DynamicDrawUsage);scene.add(m);}
  RAYS.mesh=sky;RAYS.treeMesh=tree;
  const c=new THREE.Color(),mtx=new THREE.Matrix4(),d=new THREE.Vector3(),toCam=new THREE.Vector3(),right=new THREE.Vector3(),nrm=new THREE.Vector3(),up=new THREE.Vector3(),pos=new THREE.Vector3();
  const zero=new THREE.Matrix4().makeScale(0,0,0);
  for(let i=0;i<SN;i++)sky.setMatrixAt(i,zero);for(let i=0;i<TN;i++)tree.setMatrixAt(i,zero);
  // every beam remembers what it lights and fades smoothly when that changes
  const skyB=[...Array(SN)].map((_,i)=>({cloud:null,a:0,ph:i*1.7,side:i%2?1:-1,w:1.6+(i%3)*0.8})),treeB=[...Array(TN)].map((_,i)=>({t:null,a:0,ph:i*2.3,w:0.9+(i%3)*0.35}));
  let pickT=0;
  function pick(){
    const cx=camLook.x,cz=camLook.z;
    // clouds near the view (on the sun side, so their light falls where we look)
    const cl=clouds.filter(g=>g.visible!==false).map(g=>({g,d:Math.hypot(g.position.x-cx+SUN_OFF.x*0.6,g.position.z-cz+SUN_OFF.z*0.6)})).sort((a,b)=>a.d-b.d).slice(0,SN).map(o=>o.g);
    skyB.forEach((b,i)=>{if(b.cloud!==cl[i]&&b.a<0.02)b.cloud=cl[i]||null;});
    const tr=TREES.filter(t=>!t.charred).map(t=>({t,d:Math.hypot(t.x-cx,t.z-cz)})).filter(o=>o.d<34).sort((a,b)=>a.d-b.d).slice(0,TN).map(o=>o.t);
    treeB.forEach((b,i)=>{if(b.t!==tr[i]&&b.a<0.02)b.t=tr[i]||null;});
  }
  // one beam: starts at p, runs along the sun direction d for length L, width w, turned to face the camera
  const seg=new THREE.Vector3(),cp=new THREE.Vector3();
  // a beam right in front of the lens would fill the screen with white: fade it out when the camera is close to it
  function nearFade(p,L,from,to){
    seg.copy(d).multiplyScalar(L);cp.copy(camera.position).sub(p);const t=clamp(cp.dot(seg)/seg.lengthSq(),0,1);
    cp.copy(p).addScaledVector(seg,t);return smooth((cp.distanceTo(camera.position)-from)/(to-from));
  }
  function place(m,i,p,L,w,bright){
    toCam.copy(camera.position).sub(p);right.crossVectors(d,toCam);
    if(right.lengthSq()<1e-6)right.set(1,0,0);right.normalize();nrm.crossVectors(right,d).normalize();
    up.copy(d).multiplyScalar(-L);
    mtx.makeBasis(right.multiplyScalar(w),up,nrm).setPosition(p);m.setMatrixAt(i,mtx);m.setColorAt(i,c.setRGB(bright,bright*0.93,bright*0.78));
  }
  const _mood=updateMood;
  updateMood=function(dt){_mood(dt);
    try{
      const dn=typeof DN!=='undefined'?DN:null,W=dn?dn.wx:{s:0,storm:false},night=dn?dn.night:0,dusk=dn?dn.dusk:0;
      // how strong: day only, gone in thick weather, a little more at dusk when the sun is low
      const k=gfxFine()?Math.max(0,1-night*1.6)*Math.max(0,1-W.s*1.4)*(1+dusk*0.3):0;
      RAYS.k=k;
      const on=k>0.02&&gfxFine();sky.visible=tree.visible=on;RAYS.sky=RAYS.tree=0;
      if(!on)return;
      pickT-=dt;if(pickT<=0){pickT=0.7;pick();}
      d.copy(SUN_OFF).normalize().negate();   // from the sun towards the ground
      const warm=dusk*0.5;
      for(let i=0;i<SN;i++){const b=skyB[i],g=b.cloud;
        const want=g?(0.55+0.45*Math.sin(gameT*0.11+b.ph))*0.045:0;b.a+=(want-b.a)*Math.min(1,dt*0.8);
        if(!g||b.a<0.004){sky.setMatrixAt(i,zero);continue;}
        pos.set(g.position.x+b.side*(5+b.w),g.position.y-1.5,g.position.z+b.side*2);
        const f=nearFade(pos,58,8,26);place(sky,i,pos,58,b.w*1.3,b.a*k*f*(1-warm*0.35));if(f>0.05)RAYS.sky++;}
      for(let i=0;i<TN;i++){const b=treeB[i],t=b.t;
        const want=t?(0.6+0.4*Math.sin(gameT*0.37+b.ph))*0.12:0;b.a+=(want-b.a)*Math.min(1,dt*1.2);
        if(!t||b.a<0.004){tree.setMatrixAt(i,zero);continue;}
        pos.set(t.x,hgt(t.x,t.z)+(t.h?t.h-1:DESERT?4.4:2.6),t.z);   // jungle trees: from under the high canopy
        const L=t.h?t.h+dusk*3:7.5+dusk*3,f=nearFade(pos,L,1.5,5);place(tree,i,pos,L,b.w,b.a*k*f);if(f>0.05)RAYS.tree++;}
      sky.instanceMatrix.needsUpdate=tree.instanceMatrix.needsUpdate=true;
      if(sky.instanceColor)sky.instanceColor.needsUpdate=true;if(tree.instanceColor)tree.instanceColor.needsUpdate=true;
      if(warm>0){sky.material.color.setRGB(1,0.86-warm*0.2,0.7-warm*0.3);tree.material.color.copy(sky.material.color);}
      else{sky.material.color.set(0xffffff);tree.material.color.set(0xffffff);}
    }catch(e){console.warn(e);}
  };
})();
