/* Kistenkrawall: Gebirge-Karte (nur aktiv, wenn MAP === 'gebirge').
   Höhenprofil und Geländefarben stehen in core.js und world.js; hier kommen Himmel und Licht,
   Berge am Horizont, Schneetreiben und Adler statt Möwen dazu. */
'use strict';
if(MOUNTAIN)(function(){
  // colder light: pale winter sky, bluish shadows; a wave turns it into a stormy dusk
  MOOD.hor=[new THREE.Color(0xdfe6ee),new THREE.Color(0xc9c3cf)];
  MOOD.top=[new THREE.Color(0x5b8cc4),new THREE.Color(0x4d5d86)];
  MOOD.sun=[new THREE.Color(0xfff3e2),new THREE.Color(0xffd2b0)];
  MOOD.sky=[new THREE.Color(0xeef4ff),new THREE.Color(0xd8d6ec)];
  scene.fog.near=45;scene.fog.far=150;

  /* Peaks on the horizon, pre-hazed so they fade into the distance */
  const hz=new THREE.Color(0xdfe6ee),haze=(c,k)=>new THREE.Color(c).lerp(hz,k);
  const peakG=new THREE.ConeGeometry(1,1,7),capG=new THREE.ConeGeometry(1,1,7);
  for(let i=0;i<26;i++){
    const a=i/26*TAU+srand()*0.2,r=105+srand()*70,k=clamp((r-95)/90,0.3,0.75),s=18+srand()*22,hgt2=s*(1.1+srand()*0.9);
    const g=new THREE.Group();g.position.set(Math.cos(a)*r,-2,Math.sin(a)*r);g.rotation.y=srand()*3;
    const m=new THREE.Mesh(peakG,new THREE.MeshLambertMaterial({color:haze(0x6d7685,k),fog:false}));m.scale.set(s,hgt2,s);m.position.y=hgt2/2;g.add(m);
    const cap=new THREE.Mesh(capG,new THREE.MeshLambertMaterial({color:haze(0xf6f9fc,k*0.7),fog:false}));cap.scale.set(s*0.42,hgt2*0.42,s*0.42);cap.position.y=hgt2*0.79;g.add(cap);
    scene.add(g);
  }

  /* Eagles circle high above instead of seagulls: bigger, brown, slower, gliding */
  {const brown=new THREE.MeshLambertMaterial({color:0x5a4330,side:THREE.DoubleSide}),pale=new THREE.MeshLambertMaterial({color:0xf2efe6,side:THREE.DoubleSide});
   birds.forEach((b,i)=>{
     if(i%3)b.g.visible=false;   // fewer of them: eagles fly alone or in pairs
     b.g.traverse(o=>{if(o.isMesh)o.material=brown;});b.g.children[0].material=pale;
     b.g.scale.setScalar(2.6);b.y+=10;b.r*=1.4;b.sp*=0.6;
   });}

  /* Snow drift: flakes blown sideways by the wind, following the camera.
     A modest count keeps it smooth on phones; the Christmas edition reuses this instead of its own snowfall. */
  const N=900,geo=new THREE.BufferGeometry(),p=new Float32Array(N*3);
  for(let i=0;i<N;i++){p[i*3]=rand(-36,36);p[i*3+1]=rand(0,26);p[i*3+2]=rand(-36,36);}
  geo.setAttribute('position',new THREE.BufferAttribute(p,3));
  const drift=new THREE.Points(geo,new THREE.PointsMaterial({color:0xffffff,size:0.14,transparent:true,opacity:0.85,depthWrite:false}));
  drift.frustumCulled=false;scene.add(drift);
  const clouds=[];scene.traverse(o=>{if(o.userData&&o.userData.cloudLayer)clouds.push(o);});
  let last=performance.now(),t=0;
  (function tick(now){
    requestAnimationFrame(tick);
    const dt=Math.min(0.05,(now-last)/1000);last=now;
    if(state==='pause'||document.hidden)return;
    t+=dt;
    const gust=1+Math.sin(t*0.35)*0.6,A=geo.attributes.position.array,cx=camera.position.x,cy=camera.position.y,cz=camera.position.z;
    for(let i=0;i<N;i++){
      A[i*3]+=dt*(5.5*gust+(i%5))*(window.wxWind||1);A[i*3+1]-=dt*(1.4+(i%7)*0.15);A[i*3+2]+=Math.sin(t+i)*dt*0.6;
      if(A[i*3]>cx+36||A[i*3+1]<cy-14){A[i*3]=cx-36+rand(0,10);A[i*3+1]=cy+rand(-6,14);A[i*3+2]=cz+rand(-36,36);}
      if(Math.abs(A[i*3+2]-cz)>36)A[i*3+2]=cz+rand(-36,36);
    }
    geo.attributes.position.needsUpdate=true;
    clouds.forEach((c,i)=>{c.position.x=Math.sin(t*0.05+i*2)*8;c.material.opacity=0.45+Math.sin(t*0.2+i)*0.1;});
  })(last);
  window.mountainDrift=drift;   // for tests

  /* See-through hole: the camera stays rigid. Terrain that lies between the camera and your Blechling is faded out
     in a soft circle around it (dithered, so it costs almost nothing), so a slope never hides you. */
  const cut={on:{value:0},p:{value:new THREE.Vector3()},cam:{value:new THREE.Vector3()},r:{value:4.2}};
  scene.traverse(o=>{
    if(!o.isMesh||!o.material||o.material.map!==TX.ground)return;
    o.material.onBeforeCompile=sh=>{
      sh.uniforms.uCutOn=cut.on;sh.uniforms.uCutP=cut.p;sh.uniforms.uCam=cut.cam;sh.uniforms.uCutR=cut.r;
      sh.vertexShader='varying vec3 vCutW;\n'+sh.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvCutW=(modelMatrix*vec4(transformed,1.0)).xyz;');
      sh.fragmentShader='uniform float uCutOn;uniform vec3 uCutP;uniform vec3 uCam;uniform float uCutR;varying vec3 vCutW;\n'+sh.fragmentShader.replace('#include <clipping_planes_fragment>',
        `#include <clipping_planes_fragment>
        if(uCutOn>0.5){
          vec3 cp=uCutP-uCam;float L=length(cp);vec3 dir=cp/L;vec3 fc=vCutW-uCam;float t=dot(fc,dir);
          if(t>0.0&&t<L-1.5){
            float d=length(fc-dir*t),r=uCutR*(0.3+0.7*t/L),k=1.0-smoothstep(r*0.6,r,d);
            float n=fract(sin(dot(gl_FragCoord.xy,vec2(12.9898,78.233)))*43758.5453);
            if(n<k)discard;
          }
        }`);
    };
    o.material.needsUpdate=true;
  });
  (function follow(){
    requestAnimationFrame(follow);
    const on=!!(player&&player.alive&&state!=='menu');
    cut.on.value=on?1:0;
    if(on){cut.p.value.set(player.x,hgt(player.x,player.z)+1,player.z);cut.cam.value.copy(camera.position);}
  })();
  window.mountainCut=cut;   // for tests
})();
