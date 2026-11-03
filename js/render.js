/* Kistenkrawall: Three.js-Renderer, Licht, Himmel und prozedurale Texturen */
'use strict';
/* ---------- Renderer ---------- */
const canvas=$('#c');
const renderer=new THREE.WebGLRenderer({canvas,antialias:true});
renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));
renderer.shadowMap.enabled=true;
renderer.shadowMap.type=THREE.PCFSoftShadowMap;
// If the device resets the GPU (low memory, long time in background), three.js restores the
// context by itself; meanwhile the game pauses and shows a hint instead of a frozen picture.
let glLost=false;
canvas.addEventListener('webglcontextlost',e=>{
  e.preventDefault();glLost=true;
  if(typeof state!=='undefined'&&state==='play')pause(true);
  if(window.kkNotice)window.kkNotice('Die 3D-Grafik wird gerade wiederhergestellt …');
},false);
canvas.addEventListener('webglcontextrestored',()=>{glLost=false;if(window.kkNotice)window.kkNotice(null);},false);
const scene=new THREE.Scene();
const HORIZON=0xf2dfbf;
scene.background=new THREE.Color(HORIZON);
scene.fog=new THREE.Fog(HORIZON,62,170);
const camera=new THREE.PerspectiveCamera(55,1,0.1,400);
const hemi=new THREE.HemisphereLight(0xfff0d8,0x5b6a3e,0.62);scene.add(hemi);
{const fill=new THREE.DirectionalLight(0x9fc4ff,0.26);fill.position.set(-30,18,-26);scene.add(fill);}
const SUN_OFF=new THREE.Vector3(30,34,22);
const sun=new THREE.DirectionalLight(0xffdcaa,1.05);
sun.position.copy(SUN_OFF);sun.castShadow=true;
sun.shadow.mapSize.set(2048,2048);
Object.assign(sun.shadow.camera,{left:-30,right:30,top:30,bottom:-30,near:1,far:140});
sun.shadow.bias=-0.0006;sun.shadow.normalBias=0.02;
scene.add(sun);scene.add(sun.target);
const flashLight=new THREE.PointLight(0xffa65a,0,14,2);scene.add(flashLight);

/* Sky dome with sun glow, also used to build the reflection map for metal parts */
function makeSky(){
  return new THREE.Mesh(new THREE.SphereGeometry(300,32,16),new THREE.ShaderMaterial({
    side:THREE.BackSide,depthWrite:false,fog:false,
    uniforms:{top:{value:new THREE.Color(0x4b8fcf)},hor:{value:new THREE.Color(HORIZON)},sunDir:{value:SUN_OFF.clone().normalize()}},
    vertexShader:'varying vec3 vP;void main(){vP=normalize(position);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
    fragmentShader:'uniform vec3 top;uniform vec3 hor;uniform vec3 sunDir;varying vec3 vP;void main(){float h=clamp(vP.y,0.0,1.0);vec3 c=mix(hor,top,pow(h,0.6));float s=max(dot(vP,sunDir),0.0);c+=vec3(1.0,0.93,0.75)*(pow(s,900.0)*1.6+pow(s,10.0)*0.22);if(vP.y<0.0)c=mix(hor,vec3(0.55,0.68,0.6),clamp(-vP.y*3.0,0.0,1.0));gl_FragColor=vec4(c,1.0);}'
  }));
}
const sky=makeSky();scene.add(sky);
const timeU={value:0};

/* ---------- Procedural textures (tileable noise painted into canvases) ---------- */
function noiseField(S,cell){
  const n=S/cell,g=new Float32Array(n*n);for(let i=0;i<g.length;i++)g[i]=Math.random();
  const f=new Float32Array(S*S);
  for(let y=0;y<S;y++)for(let x=0;x<S;x++){
    const gx=x/cell,gy=y/cell,x0=Math.floor(gx),y0=Math.floor(gy),tx=gx-x0,ty=gy-y0,sx=tx*tx*(3-2*tx),sy=ty*ty*(3-2*ty);
    const x1=(x0+1)%n,y1=(y0+1)%n,a=g[y0*n+x0],b=g[y0*n+x1],c=g[y1*n+x0],d=g[y1*n+x1];
    f[y*S+x]=a+(b-a)*sx+(c-a)*sy+(a-b-c+d)*sx*sy;
  }
  return f;
}
function fbm(S,cells){const o=new Float32Array(S*S);let tw=0;cells.forEach((c,i)=>{const w=1/(i+1);tw+=w;const f=noiseField(S,c);for(let k=0;k<o.length;k++)o[k]+=f[k]*w;});for(let k=0;k<o.length;k++)o[k]/=tw;return o;}
function canvasTex(S,draw,rep){
  const c=document.createElement('canvas');c.width=c.height=S;const g=c.getContext('2d');draw(g,S);
  const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;if(rep)t.repeat.set(rep[0],rep[1]);
  t.anisotropy=Math.min(4,renderer.capabilities.getMaxAnisotropy());return t;
}
function paintPixels(g,S,fn){const id=g.createImageData(S,S),d=id.data;for(let y=0;y<S;y++)for(let x=0;x<S;x++){const k=(y*S+x)*4,c=fn(x,y);d[k]=c[0];d[k+1]=c[1];d[k+2]=c[2];d[k+3]=255;}g.putImageData(id,0,0);}
const c8=v=>Math.max(0,Math.min(255,v|0));
function panelTex(soft){
  return canvasTex(256,(g,S)=>{
    const n=fbm(S,[64,16,4]),amp=soft?26:48,base=soft?236:214;
    paintPixels(g,S,(x,y)=>{const v=c8(base+(n[y*S+x]-0.5)*amp-(y%128)/128*(soft?6:12));return [v,v,v];});
    g.fillStyle=soft?'rgba(40,40,40,.35)':'rgba(30,30,30,.6)';
    for(const p of [0,128]){g.fillRect(p,0,2,S);g.fillRect(0,p,S,2);}
    g.fillStyle='rgba(255,255,255,.35)';for(const p of [2,130]){g.fillRect(p,0,1,S);g.fillRect(0,p,S,1);}
    for(let i=8;i<S;i+=24)for(const p of [8,120,136,248]){
      g.fillStyle='rgba(30,30,30,.55)';g.beginPath();g.arc(p,i,2.6,0,TAU);g.fill();g.beginPath();g.arc(i,p,2.6,0,TAU);g.fill();
      g.fillStyle='rgba(255,255,255,.6)';g.fillRect(p-1,i-1.5,1.2,1.2);g.fillRect(i-1,p-1.5,1.2,1.2);
    }
    for(let i=0;i<(soft?30:60);i++){const x=Math.random()*S,y=Math.random()*S,a=Math.random()*TAU,l=4+Math.random()*16;
      g.strokeStyle=Math.random()<.5?'rgba(255,255,255,.35)':'rgba(0,0,0,.18)';g.lineWidth=0.7;g.beginPath();g.moveTo(x,y);g.lineTo(x+Math.cos(a)*l,y+Math.sin(a)*l);g.stroke();}
    if(!soft)for(let i=0;i<14;i++){const x=Math.random()*S,y=Math.random()*S;const r=g.createLinearGradient(x,y,x,y+40);r.addColorStop(0,'rgba(90,70,50,.22)');r.addColorStop(1,'rgba(90,70,50,0)');g.fillStyle=r;g.fillRect(x,y,3+Math.random()*4,40);}
  });
}
const TX={};
TX.panel=panelTex(false);
TX.paint=panelTex(true);
TX.wood=canvasTex(256,(g,S)=>{
  const n=fbm(S,[32,8]);
  paintPixels(g,S,(x,y)=>{const row=Math.floor(y/64),grain=Math.sin((x*0.06+n[y*S+x]*7+row*3.1)*3.0)*0.5+0.5;const k=(row%2?0.9:1)*(0.82+grain*0.18)*(0.9+n[y*S+x]*0.2);return [c8(205*k),c8(146*k),c8(84*k)];});
  for(let i=0;i<4;i++){g.fillStyle='rgba(60,30,10,.55)';g.fillRect(0,i*64,S,3);g.fillStyle='rgba(255,230,190,.18)';g.fillRect(0,i*64+3,S,1);}
  g.strokeStyle='#6b4220';g.lineWidth=22;g.strokeRect(11,11,S-22,S-22);
  g.beginPath();g.moveTo(20,20);g.lineTo(S-20,S-20);g.stroke();
  g.strokeStyle='rgba(30,15,5,.5)';g.lineWidth=2;g.strokeRect(22,22,S-44,S-44);g.strokeRect(1,1,S-2,S-2);
  g.fillStyle='#3a3a3a';for(const [x,y] of [[11,11],[S-11,11],[11,S-11],[S-11,S-11],[S/2,11],[S/2,S-11],[11,S/2],[S-11,S/2]]){g.beginPath();g.arc(x,y,4,0,TAU);g.fill();}
  g.fillStyle='rgba(40,20,5,.55)';g.font='bold 40px sans-serif';g.textAlign='center';g.fillText('▲',S*0.3,S*0.72);
});
TX.plank=canvasTex(256,(g,S)=>{const n=fbm(S,[32,8]);paintPixels(g,S,(x,y)=>{const gr=Math.sin((y*0.08+n[y*S+x]*6)*3)*0.5+0.5,k=0.8+gr*0.2+n[y*S+x]*0.12;return [c8(240*k),c8(225*k),c8(210*k)];});});
TX.bark=canvasTex(128,(g,S)=>{const n=fbm(S,[16,4]);paintPixels(g,S,(x,y)=>{const st=Math.sin(x*0.45+n[y*S+x]*5)*0.5+0.5,k=0.62+st*0.3+n[y*S+x]*0.15;return [c8(255*k),c8(240*k),c8(225*k)];});},[1,2]);
TX.rock=canvasTex(256,(g,S)=>{
  const n=fbm(S,[64,32,8,4]);paintPixels(g,S,(x,y)=>{const v=n[y*S+x];const k=150+v*100;return [c8(k*1.02),c8(k),c8(k*0.95)];});
  g.strokeStyle='rgba(40,38,35,.5)';g.lineWidth=1.2;
  for(let i=0;i<14;i++){let x=Math.random()*S,y=Math.random()*S;g.beginPath();g.moveTo(x,y);for(let j=0;j<6;j++){x+=(Math.random()-.5)*30;y+=Math.random()*22;g.lineTo(x,y);}g.stroke();}
  for(let i=0;i<30;i++){g.fillStyle=`rgba(110,140,70,${Math.random()*.25})`;g.beginPath();g.arc(Math.random()*S,Math.random()*S,3+Math.random()*10,0,TAU);g.fill();}
});
TX.fabric=canvasTex(128,(g,S)=>{const n=fbm(S,[32,8]);paintPixels(g,S,(x,y)=>{const w=((x>>1)+(y>>1))%2?0.93:1,k=(0.8+n[y*S+x]*0.25)*w;return [c8(240*k),c8(228*k),c8(200*k)];});g.fillStyle='rgba(60,45,25,.35)';g.fillRect(0,0,S,3);g.fillRect(0,S/2,S,2);});
TX.diamond=canvasTex(128,(g,S)=>{const n=fbm(S,[32,8]);paintPixels(g,S,(x,y)=>{const v=c8(170+(n[y*S+x]-.5)*50);return [v,v,v];});
  for(let y=0;y<S;y+=16)for(let x=(y/16%2)*8;x<S;x+=16){g.save();g.translate(x+4,y+4);g.rotate(0.6);g.fillStyle='rgba(255,255,255,.5)';g.fillRect(-1,-5,3,10);g.fillStyle='rgba(0,0,0,.3)';g.fillRect(2,-5,1,10);g.restore();}});
TX.tread=canvasTex(128,(g,S)=>{g.fillStyle='#8a8a8a';g.fillRect(0,0,S,S);for(let y=0;y<S;y+=16){g.fillStyle='#3a3a3a';g.fillRect(0,y,S,9);g.fillStyle='#b0b0b0';g.fillRect(0,y+9,S,2);}},[1,6]);
TX.leaf=canvasTex(128,(g,S)=>{const n=fbm(S,[16,8,4]);paintPixels(g,S,(x,y)=>{const v=n[y*S+x],k=0.72+v*0.5;return [c8(255*k*0.95),c8(255*k),c8(255*k*0.9)];});
  for(let i=0;i<260;i++){g.fillStyle=Math.random()<.5?'rgba(255,255,220,.25)':'rgba(0,30,0,.25)';g.beginPath();g.ellipse(Math.random()*S,Math.random()*S,2+Math.random()*3,1+Math.random()*1.5,Math.random()*3,0,TAU);g.fill();}});
TX.ground=canvasTex(512,(g,S)=>{
  const n=fbm(S,[128,32,8]);paintPixels(g,S,(x,y)=>{const v=c8(205+(n[y*S+x]-.5)*70);return [v,v,v];});
  for(let i=0;i<9000;i++){const x=Math.random()*S,y=Math.random()*S,l=3+Math.random()*7,a=-Math.PI/2+(Math.random()-.5)*1.1;
    g.strokeStyle=Math.random()<.6?`rgba(255,255,255,${.15+Math.random()*.25})`:`rgba(0,0,0,${.1+Math.random()*.2})`;g.lineWidth=0.8;g.beginPath();g.moveTo(x,y);g.lineTo(x+Math.cos(a)*l,y+Math.sin(a)*l);g.stroke();}
  for(let i=0;i<500;i++){g.fillStyle=`rgba(${Math.random()<.5?'255,250,235':'40,35,30'},${.2+Math.random()*.3})`;g.beginPath();g.arc(Math.random()*S,Math.random()*S,0.6+Math.random()*1.6,0,TAU);g.fill();}
},[44,44]);
const texMat=(color,tex,bump,opts)=>new THREE.MeshPhongMaterial(Object.assign({color,map:tex,bumpMap:tex,bumpScale:bump,specular:0x222222,shininess:12},opts||{}));
