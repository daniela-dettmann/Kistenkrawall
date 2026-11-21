/* Kistenkrawall: Wasser (Insel, Vulkan-Meer, Weihnachtsedition). Ein Shader auf dem vorhandenen Wassermaterial,
   kein zweites Bild für Spiegelungen.
   - Tiefenfarbe: tief dunkelblau, flach türkis. Grundlage ist eine Karte, die beim Laden einmal berechnet wird:
     Rot = Abstand zur Küste (bis 16 Einheiten), Grün = Wassertiefe.
   - Uferschaum: weißer, wabernder Rand, wo der Abstand gegen null geht, dazu eine zweite, schwächere Linie, die pulsiert.
   - Wellen: zwei gegeneinander laufende, gekachelte Normalen-Texturen.
   - Himmelsspiegelung (Fresnel) und Sonnenglitzern folgen Himmelsfarbe und Sonnenstand der Tageszeit.
   - Spritzer: Tropfen und Schaumring, wenn etwas ins Wasser fällt.
   Auf „Grafik: Niedrig“ ohne Glitzern und ohne zweite Schaumlinie. */
'use strict';
const WATER={q:{value:1},dist:null};
(function(){
  const wm=(function(){let m=null;scene.traverse(o=>{if(o.isMesh&&o.position.y===-1.65&&o.material&&o.material.transparent)m=o.material;});return m;})();
  if(!wm)return;   // the mountain has no water

  /* Distance to the shore and depth, once at load: 256 x 256 cells over the 172 x 172 map */
  const N=256,cell=172/N,INF=1e9,d=new Float32Array(N*N),depth=new Float32Array(N*N);
  for(let j=0;j<N;j++)for(let i=0;i<N;i++){
    const x=(i+0.5)*cell-86,z=(j+0.5)*cell-86,h=hgtRaw(x,z),k=j*N+i;
    depth[k]=Math.max(0,-1.65-h);d[k]=h>=-1.62?0:INF;
  }
  // two-pass chamfer distance (3-4 weights, close to true distance)
  const A=1,B=Math.SQRT2;
  for(let j=0;j<N;j++)for(let i=0;i<N;i++){const k=j*N+i;if(!d[k])continue;let v=d[k];
    if(i>0)v=Math.min(v,d[k-1]+A);if(j>0){v=Math.min(v,d[k-N]+A);if(i>0)v=Math.min(v,d[k-N-1]+B);if(i<N-1)v=Math.min(v,d[k-N+1]+B);}d[k]=v;}
  for(let j=N-1;j>=0;j--)for(let i=N-1;i>=0;i--){const k=j*N+i;if(!d[k])continue;let v=d[k];
    if(i<N-1)v=Math.min(v,d[k+1]+A);if(j<N-1){v=Math.min(v,d[k+N]+A);if(i<N-1)v=Math.min(v,d[k+N+1]+B);if(i>0)v=Math.min(v,d[k+N-1]+B);}d[k]=v;}
  const px=new Uint8Array(N*N*4);
  for(let k=0;k<N*N;k++){px[k*4]=Math.round(clamp(d[k]*cell/16,0,1)*255);px[k*4+1]=Math.round(clamp(depth[k]/3.2,0,1)*255);px[k*4+3]=255;}
  const distTex=new THREE.DataTexture(px,N,N,THREE.RGBAFormat);distTex.magFilter=distTex.minFilter=THREE.LinearFilter;distTex.needsUpdate=true;
  WATER.dist={tex:distTex,at:(x,z)=>{const i=Math.floor((x+86)/cell),j=Math.floor((z+86)/cell);if(i<0||j<0||i>=N||j>=N)return 16;return d[j*N+i]*cell;}};

  /* Wave normals: a tileable height field, stored as normal (red, green) and height (blue, used for the foam) */
  const nrmTex=(function(){
    const S=128,h=fbm(S,[32,16,8]),c=document.createElement('canvas');c.width=c.height=S;const g=c.getContext('2d'),id=g.createImageData(S,S);
    const H=(x,y)=>h[((y+S)%S)*S+((x+S)%S)];
    for(let y=0;y<S;y++)for(let x=0;x<S;x++){
      const dx=(H(x+1,y)-H(x-1,y))*6,dy=(H(x,y+1)-H(x,y-1))*6,l=Math.hypot(dx,dy,1),k=(y*S+x)*4;
      id.data[k]=Math.round((-dx/l*0.5+0.5)*255);id.data[k+1]=Math.round((-dy/l*0.5+0.5)*255);id.data[k+2]=Math.round(H(x,y)*255);id.data[k+3]=255;
    }
    g.putImageData(id,0,0);const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;return t;
  })();

  const xm=typeof XMAS!=='undefined'&&XMAS;
  const U={
    uDist:{value:distTex},uNrm:{value:nrmTex},
    uDeep:{value:new THREE.Color(JUNGLE?0x14302a:VOLCANO?0x0a2234:xm?0x123f66:0x0d3a66)},
    uShallow:{value:new THREE.Color(JUNGLE?0x3f6e4c:VOLCANO?0x24606a:xm?0x5cc4d2:0x34c2b8)},
    uSkyHor:sky.material.uniforms.hor,uSkyTop:sky.material.uniforms.top,uSunDir:sky.material.uniforms.sunDir,
    uDay:typeof LOOK!=='undefined'?LOOK.day:{value:1},uQ:WATER.q
  };
  wm.specular.set(0x3a3a3a);wm.shininess=60;
  gfxChain(wm,sh=>{
    Object.assign(sh.uniforms,U);sh.uniforms.uTime=timeU;
    sh.vertexShader='varying vec2 vKkW;\n'+sh.vertexShader.replace('#include <project_vertex>','vKkW=(modelMatrix*vec4(transformed,1.0)).xz;\n#include <project_vertex>');
    sh.fragmentShader=`uniform sampler2D uDist;uniform sampler2D uNrm;uniform vec3 uDeep;uniform vec3 uShallow;uniform vec3 uSkyHor;uniform vec3 uSkyTop;uniform vec3 uSunDir;uniform float uDay;uniform float uQ;uniform float uTime;varying vec2 vKkW;\n`+sh.fragmentShader
      .replace('#include <color_fragment>',`#include <color_fragment>
        vec2 kkU=vKkW/172.0+0.5;
        vec4 kkT=(kkU.x<0.0||kkU.x>1.0||kkU.y<0.0||kkU.y>1.0)?vec4(1.0,1.0,0.0,1.0):texture2D(uDist,kkU);
        float kkDist=kkT.r*16.0,kkDepth=kkT.g*3.2;
        float kkDeepF=clamp(smoothstep(0.3,7.0,kkDist)*0.6+smoothstep(0.15,2.2,kkDepth)*0.4,0.0,1.0);
        diffuseColor.rgb=mix(uShallow,uDeep,kkDeepF);
        diffuseColor.a=mix(0.72,0.94,kkDeepF);`)
      .replace('#include <normal_fragment_maps>',`#include <normal_fragment_maps>
        {vec2 kkA=texture2D(uNrm,vKkW*0.09+vec2(uTime*0.020,uTime*0.013)).xy*2.0-1.0;
         vec2 kkB=texture2D(uNrm,vKkW*0.13+vec2(-uTime*0.017,uTime*0.022)).xy*2.0-1.0;
         vec2 kkP=(kkA+kkB)*0.32;
         normal=normalize((viewMatrix*vec4(normalize(vec3(-kkP.x,1.0,-kkP.y)),0.0)).xyz);}`)
      .replace('#include <tonemapping_fragment>',`
        {vec3 kkV=normalize(vViewPosition);
         float kkF=pow(1.0-clamp(dot(normal,kkV),0.0,1.0),3.0);
         gl_FragColor.rgb=mix(gl_FragColor.rgb,mix(uSkyHor,uSkyTop,0.35),kkF*0.6);
         vec3 kkS=normalize((viewMatrix*vec4(uSunDir,0.0)).xyz);
         float kkG=pow(max(dot(normal,normalize(kkS+kkV)),0.0),110.0);
         gl_FragColor.rgb+=vec3(1.0,0.93,0.78)*kkG*0.85*uDay*uQ;
         float kkN=texture2D(uNrm,vKkW*0.21+vec2(uTime*0.03,-uTime*0.02)).b;
         float kkFoam=1.0-smoothstep(0.15,0.85,kkDist+(kkN-0.5)*0.8+sin(uTime*1.4+vKkW.x*0.3+vKkW.y*0.2)*0.08);
         float kkL2=(1.0-smoothstep(0.0,0.22,abs(kkDist-(1.55+0.25*sin(uTime*0.9))-(kkN-0.5)*0.5)))*(0.45+0.25*sin(uTime*1.7))*uQ;
         float kkFo=clamp(kkFoam+kkL2*0.6,0.0,1.0);
         gl_FragColor.rgb=mix(gl_FragColor.rgb,vec3(0.95,0.98,1.0)*(0.55+0.45*uDay),kkFo*0.85);
         gl_FragColor.a=max(gl_FragColor.a,kkFo);}
        #include <tonemapping_fragment>`);
  },'water');
  GFX.water={mat:wm,uniforms:U};

  /* Splash: a ring of foam, a few drops that fly up and fall back, a little spray */
  const ringG=new THREE.RingGeometry(0.7,1,24).rotateX(-Math.PI/2),dropG=new THREE.BoxGeometry(0.08,0.08,0.08),dropM=new THREE.MeshBasicMaterial({color:0xf2f8ff});
  window.gfxSplash=function(x,z,big){
    if(parts.length>240)return;
    const lava=VOLCANO&&Math.abs(z)<BANK+3,y=lava?-1.15:-1.6;
    const m=new THREE.Mesh(ringG,new THREE.MeshBasicMaterial({color:lava?0xffb050:0xffffff,transparent:true,opacity:0.75,depthWrite:false}));
    m.position.set(x,y+0.03,z);m.scale.setScalar(0.3);scene.add(m);parts.push({m,vx:0,vy:0,vz:0,life:0.9,max:0.9,boom:big?2.8:1.5});
    const n=big?9:5;
    for(let i=0;i<n;i++){
      const dm=new THREE.Mesh(dropG,lava?new THREE.MeshBasicMaterial({color:0xff8a3a}):dropM);dm.position.set(x,y+0.1,z);scene.add(dm);
      const a=Math.random()*TAU,v=rand(0.6,2.2);
      parts.push({m:dm,vx:Math.cos(a)*v,vy:rand(3.5,6.5),vz:Math.sin(a)*v,life:rand(0.55,0.85),max:0.85,debris:true,grav:14,solid:!lava});
    }
    puffs(x,y+0.25,z,big?3:2,lava?0xff8a3a:0xeaf6ff,{size:0.45,up:1.4,life:0.6,spread:1.0,op:0.6});
  };

  /* Low / high */
  const _ga=gfxApply;gfxApply=function(){_ga();WATER.q.value=gfxFine()?1:0;};
  WATER.q.value=gfxFine()?1:0;
})();
