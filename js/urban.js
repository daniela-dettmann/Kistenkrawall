/* Kistenkrawall: Flughafen und Stadt (Auftrag „Zwei neue Karten“). Die Grundrisse stehen als Daten in core.js (URB);
   hier entstehen daraus:
   - Wegfindung: ein Raster aus 1-Meter-Feldern über die Karte, ein Feld ist frei, wenn ein Blechling (bzw. ein
     Fahrzeug, eigenes Raster mit mehr Abstand) dort neben keinem Gebäude und keinem Baum steht. Gesucht wird mit A*,
     danach wird der Weg geglättet (nur Punkte, an denen die Sicht abbricht). navWaypoint() liefert den nächsten
     Punkt; moveToward (combat.js) und der Kampf (ai.js) benutzen ihn.
   - Gebäude als Modelle: Häuser mit Fenstern und Dachkante, Terminal, Gate-Gebäude mit Fluggastbrücken, Hangars,
     Flugzeuge, Tower, Zaun, Deko (Brunnen, Marktstände, Bäume im Park, Gepäckwagen, Tankwagen, Lampen).
   - Ein Haus zwischen Kamera und eigener Figur wird durchscheinend, damit man sich nie aus den Augen verliert.
   - Weihnachtsedition: Lichterketten an den Dachkanten, ein geschmückter Baum statt des Brunnens.
   Auf den bisherigen Karten tut diese Datei nichts. */
'use strict';
/* ---------- Wegfindung ---------- */
const NAV={N:108,O:-54,grid:[null,null],searches:0};
function navGrid(k){
  if(NAV.grid[k])return NAV.grid[k];
  const N=NAV.N,g=new Uint8Array(N*N),m=k?1.55:0.7;
  for(let j=0;j<N;j++)for(let i=0;i<N;i++){
    const x=NAV.O+i+0.5,z=NAV.O+j+0.5;
    let b=Math.abs(x)>LIM-0.5||Math.abs(z)>LIM-0.5||!urbanFree(x,z,m);
    if(!b)for(const o of obstacles)if(!o.low&&Math.hypot(o.x-x,o.z-z)<o.r+m-0.15){b=true;break;}
    g[j*N+i]=b?1:0;
  }
  return NAV.grid[k]=g;
}
const navCell=v=>clamp(Math.floor(v-NAV.O),0,NAV.N-1);
function navFree(g,x,z){return !g[navCell(z)*NAV.N+navCell(x)];}
function navLine(g,ax,az,bx,bz){const n=Math.ceil(Math.hypot(bx-ax,bz-az)/0.35);for(let i=1;i<=n;i++){const t=i/n;if(!navFree(g,ax+(bx-ax)*t,az+(bz-az)*t))return false;}return true;}
// the nearest free field (rings outward), for goals in a corner and units pressed against a wall
function navNearest(g,i,j){
  const N=NAV.N;if(!g[j*N+i])return [i,j];
  for(let r=1;r<16;r++)for(let a=-r;a<=r;a++)for(const [di,dj] of [[a,-r],[a,r],[-r,a],[r,a]]){
    const ii=i+di,jj=j+dj;if(ii>=0&&jj>=0&&ii<N&&jj<N&&!g[jj*N+ii])return [ii,jj];}
  return null;
}
function navPath(g,sx,sz,gx,gz){
  const N=NAV.N,s=navNearest(g,navCell(sx),navCell(sz)),e=navNearest(g,navCell(gx),navCell(gz));if(!s||!e)return null;
  NAV.searches++;
  const S=s[1]*N+s[0],E=e[1]*N+e[0],G=new Float32Array(N*N).fill(1e9),from=new Int32Array(N*N).fill(-1),done=new Uint8Array(N*N);
  const heap=[],f=new Float32Array(N*N);
  const h=k=>{const dx=Math.abs(k%N-e[0]),dz=Math.abs(((k/N)|0)-e[1]);return Math.max(dx,dz)+0.414*Math.min(dx,dz);};
  const push=k=>{heap.push(k);let c=heap.length-1;while(c>0){const p=(c-1)>>1;if(f[heap[p]]<=f[heap[c]])break;[heap[p],heap[c]]=[heap[c],heap[p]];c=p;}};
  const pop=()=>{const top=heap[0],last=heap.pop();if(heap.length){heap[0]=last;let c=0;for(;;){const l=2*c+1,r=l+1;let m=c;if(l<heap.length&&f[heap[l]]<f[heap[m]])m=l;if(r<heap.length&&f[heap[r]]<f[heap[m]])m=r;if(m===c)break;[heap[m],heap[c]]=[heap[c],heap[m]];c=m;}}return top;};
  G[S]=0;f[S]=h(S);push(S);
  while(heap.length){
    const k=pop();if(done[k])continue;done[k]=1;if(k===E)break;
    const i=k%N,j=(k/N)|0;
    for(let dj=-1;dj<=1;dj++)for(let di=-1;di<=1;di++){
      if(!di&&!dj)continue;const ii=i+di,jj=j+dj;if(ii<0||jj<0||ii>=N||jj>=N)continue;
      const n=jj*N+ii;if(g[n]||done[n])continue;
      if(di&&dj&&(g[j*N+ii]||g[jj*N+i]))continue;   // no cutting corners
      const c=G[k]+(di&&dj?1.414:1);if(c<G[n]){G[n]=c;from[n]=k;f[n]=c+h(n);push(n);}
    }
  }
  if(from[E]<0&&E!==S)return null;
  const cells=[];for(let k=E;k>=0;k=from[k]){cells.push(k);if(k===S)break;}
  cells.reverse();
  const pts=cells.map(k=>({x:NAV.O+k%N+0.5,z:NAV.O+((k/N)|0)+0.5}));
  // keep only the corners: a point stays if the one after it cannot be seen from the last kept point
  const out=[pts[0]];
  for(let i=1;i<pts.length-1;i++){const a=out[out.length-1];if(!navLine(g,a.x,a.z,pts[i+1].x,pts[i+1].z))out.push(pts[i]);}
  out.push(pts[pts.length-1]);
  return out;
}
// the next point to walk to, or null if the goal is in plain sight
function navWaypoint(u,gx,gz){
  if(!URBAN)return null;
  const g=navGrid((u.r||0.45)>0.8?1:0);
  if(navLine(g,u.x,u.z,gx,gz))return null;
  let n=u.nav;
  if(!n||Math.hypot(n.gx-gx,n.gz-gz)>2||gameT-n.t>3||n.i>=n.pts.length){
    n=u.nav={gx,gz,t:gameT,pts:navPath(g,u.x,u.z,gx,gz)||[],i:0};
  }
  if(!n.pts.length)return null;
  while(n.i<n.pts.length-1&&navLine(g,u.x,u.z,n.pts[n.i+1].x,n.pts[n.i+1].z))n.i++;
  const p=n.pts[n.i];
  if(Math.hypot(p.x-u.x,p.z-u.z)<0.7&&n.i<n.pts.length-1)n.i++;
  return n.pts[n.i];
}

if(URBAN)(function(){
  const X=typeof XMAS!=='undefined'&&XMAS;
  /* ---------- Textures ---------- */
  // a façade: one window per 3 x 3 m, the wall colour comes from the material
  const facade=canvasTex(64,(g,S)=>{g.fillStyle='#ffffff';g.fillRect(0,0,S,S);g.fillStyle='#e9e4dc';g.fillRect(0,S*0.86,S,S*0.14);
    g.fillStyle='#2c3e52';g.fillRect(S*0.25,S*0.22,S*0.5,S*0.46);g.fillStyle='#4f6f8f';g.fillRect(S*0.27,S*0.24,S*0.22,S*0.2);
    g.fillStyle='#d6d0c6';g.fillRect(S*0.22,S*0.68,S*0.56,S*0.06);});
  const glass=canvasTex(64,(g,S)=>{g.fillStyle='#5f8fb3';g.fillRect(0,0,S,S);g.fillStyle='#86b4d4';g.fillRect(0,0,S,S*0.45);
    g.fillStyle='#d9dde2';for(let i=0;i<=4;i++)g.fillRect(i*S/4-1,0,3,S);g.fillRect(0,S-4,S,4);g.fillRect(0,S*0.5,S,2);});
  const hangarTex=canvasTex(64,(g,S)=>{g.fillStyle='#b9bec4';g.fillRect(0,0,S,S);g.fillStyle='#a5abb2';for(let i=0;i<S;i+=8)g.fillRect(i,0,3,S);});
  // UVs scaled to the real size, so a window stays 3 m wide on every wall
  function sizedBox(w,h,d,cell){
    const geo=new THREE.BoxGeometry(w,h,d),uv=geo.attributes.uv,dims=[[d,h],[d,h],[w,d],[w,d],[w,h],[w,h]];
    for(let f=0;f<6;f++)for(let v=0;v<4;v++){const i=f*4+v;uv.setXY(i,uv.getX(i)*dims[f][0]/cell,uv.getY(i)*dims[f][1]/cell);}
    return geo;
  }
  const fadeable=[];   // building parts that turn see-through between camera and player
  function building(b,mat,cell,roofCol){
    mat=mat.clone();   // its own material, so it can fade on its own
    const w=b.x1-b.x0,d=b.z1-b.z0,cx=(b.x0+b.x1)/2,cz=(b.z0+b.z1)/2,y0=hgt(cx,cz);
    const m=new THREE.Mesh(sizedBox(w,b.h,d,cell),mat);m.position.set(cx,y0+b.h/2,cz);m.castShadow=m.receiveShadow=true;scene.add(m);
    const roof=new THREE.Mesh(new THREE.BoxGeometry(w+0.5,0.35,d+0.5),new THREE.MeshLambertMaterial({color:X?0xf4f7fb:roofCol}));
    roof.position.set(cx,y0+b.h+0.17,cz);roof.castShadow=true;roof.receiveShadow=true;scene.add(roof);
    fadeable.push({b,mats:[mat,roof.material]});
    return {m,roof,cx,cz,y:y0+b.h};
  }
  /* ---------- Xmas: lights along the roof edges ---------- */
  const lightPts=[];
  function edgeLights(b,y){
    if(!X)return;
    const corners=[[b.x0,b.z0],[b.x1,b.z0],[b.x1,b.z1],[b.x0,b.z1]];
    for(let k=0;k<4;k++){const [ax,az]=corners[k],[bx,bz]=corners[(k+1)%4],n=Math.max(2,Math.round(Math.hypot(bx-ax,bz-az)/1.3));
      for(let i=0;i<n;i++){const t=i/n;lightPts.push([ax+(bx-ax)*t,y+0.42,az+(bz-az)*t]);}}
  }

  if(CITY){
    const cols=[0xd9b48f,0xc98e72,0xe2d3b6,0xa9b9c4,0xd7c58c,0xb7a7c9,0xc7cfb5];
    URB.boxes.forEach((b,i)=>{
      const mat=new THREE.MeshLambertMaterial({color:cols[i%cols.length],map:facade});
      const r=building(b,mat,3,[0x8a5a48,0x6d6a6a,0x7c4b3a][i%3]);edgeLights(b,r.y);
      // small things on the roofs: chimneys, air conditioning
      for(let k=0;k<2;k++){const cx=b.x0+1.5+(b.x1-b.x0-3)*((i*37+k*53)%10)/10,cz=b.z0+1.5+(b.z1-b.z0-3)*((i*23+k*71)%10)/10;
        const ch=new THREE.Mesh(new THREE.BoxGeometry(0.9,1.1,0.9),M.metal);ch.position.set(cx,r.y+0.7,cz);ch.castShadow=true;scene.add(ch);STATIC_ROOTS.push(ch);}
    });
    // the skyline outside the ring road (beyond reach, no walls needed)
    const far=new THREE.MeshLambertMaterial({color:0xb7b0a6,map:facade});
    // the taktik camera floats up to about 75 m out over the corners, so the skyline starts beyond that
    for(let i=0;i<48;i++){const a=i/48*TAU,r=86+((i*7)%5)*4,cx=Math.cos(a)*r,cz=Math.sin(a)*r,w=10+(i%3)*3,h=10+((i*5)%7)*3;
      const m=new THREE.Mesh(sizedBox(w,h,w,3),far);m.position.set(cx,h/2,cz);m.rotation.y=a;m.receiveShadow=true;scene.add(m);STATIC_ROOTS.push(m);}
    // market place: a fountain (Christmas: a big decorated tree), four stalls with awnings, benches
    if(!X){
      const basin=new THREE.Mesh(new THREE.CylinderGeometry(1.9,2.1,0.6,20),M.metal);basin.position.set(0,0.62,0);scene.add(basin);STATIC_ROOTS.push(basin);
      const water=new THREE.Mesh(new THREE.CylinderGeometry(1.7,1.7,0.1,20),new THREE.MeshPhongMaterial({color:0x4f9fc9,shininess:80}));water.position.set(0,0.88,0);scene.add(water);
      const col=new THREE.Mesh(new THREE.CylinderGeometry(0.25,0.35,1.8,10),M.metal);col.position.set(0,1.5,0);scene.add(col);STATIC_ROOTS.push(col);
    }else{
      const tr=new THREE.Group();tr.position.set(0,0.32,0);
      const trunk=new THREE.Mesh(new THREE.CylinderGeometry(0.3,0.4,1.2,8),trunkMat);trunk.position.y=0.6;tr.add(trunk);
      for(let i=0;i<4;i++){const c=new THREE.Mesh(new THREE.ConeGeometry(2.4-i*0.5,2.2,10),pineMat[0]);c.position.y=1.8+i*1.4;tr.add(c);}
      const star=new THREE.Mesh(new THREE.OctahedronGeometry(0.45,0),new THREE.MeshBasicMaterial({color:0xffe27a}));star.position.y=7.6;tr.add(star);
      for(let i=0;i<40;i++){const a=i*2.4,y=1.6+(i%20)/20*5.2,r=2.3-(y-1.6)*0.36;lightPts.push([Math.cos(a)*r,0.32+y,Math.sin(a)*r]);}
      tr.traverse(o=>{if(o.isMesh)o.castShadow=true;});scene.add(tr);
    }
    obstacles.push({x:0,z:0,r:2.1});
    const awn=[0xc8423a,0x3a76d2,0x3d9a5a,0xe0a43a];
    [[-7,7],[7,-7],[-7,-7],[7,7]].forEach(([x,z],i)=>{
      const g=new THREE.Group();g.position.set(x,0.32,z);
      const table=new THREE.Mesh(new THREE.BoxGeometry(1.8,0.9,1.0),texMat(0x9a6a3c,TX.plank,0.05,{shininess:6}));table.position.y=0.45;g.add(table);
      for(const sx of [-0.85,0.85])for(const sz of [-0.45,0.45]){const p=new THREE.Mesh(new THREE.CylinderGeometry(0.05,0.05,2.2,5),M.metal);p.position.set(sx,1.1,sz);g.add(p);}
      const roof=new THREE.Mesh(new THREE.BoxGeometry(2.1,0.12,1.4),new THREE.MeshLambertMaterial({color:awn[i]}));roof.position.y=2.2;roof.rotation.x=0.12;g.add(roof);
      g.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});scene.add(g);STATIC_ROOTS.push(g);obstacles.push({x,z,r:1.1});
    });
    // park: trees, a few benches; Christmas: they become decorated firs (xmas.js)
    [[27,29],[33,25],[40,30],[44,40],[29,41],[37,37],[24,36],[41,24]].forEach(([x,z])=>addTree(x,z,true));
    // street lamps at the crossings
    for(const x of [-18,18])for(const z of [-18,18]){for(const [dx,dz] of [[3.6,3.6],[-3.6,-3.6]]){
      const p=new THREE.Mesh(new THREE.CylinderGeometry(0.08,0.1,4.2,6),M.metal);p.position.set(x+dx,2.4,z+dz);scene.add(p);STATIC_ROOTS.push(p);
      const l=new THREE.Mesh(new THREE.SphereGeometry(0.25,8,6),new THREE.MeshBasicMaterial({color:0xfff1c8}));l.position.set(x+dx,4.55,z+dz);scene.add(l);STATIC_ROOTS.push(l);}}
  }

  if(AIRPORT){
    const term=new THREE.MeshLambertMaterial({color:0xffffff,map:glass}),gate=new THREE.MeshLambertMaterial({color:0xe9eef3,map:glass}),
      hang=new THREE.MeshLambertMaterial({color:0xd8dde2,map:hangarTex}),fence=new THREE.MeshLambertMaterial({color:0x7f8a80,transparent:true,opacity:0.55});
    for(const b of URB.boxes){
      if(b.k==='terminal'){const r=building(b,term,4,0x8c949c);edgeLights(b,r.y);
        const sign=canvasTex(256,(g,S)=>{g.fillStyle='#1f3c66';g.fillRect(0,0,S,S);g.fillStyle='#fff';g.font='bold 54px sans-serif';g.textAlign='center';g.fillText('TERMINAL',S/2,S*0.62);});
        const sm=new THREE.Mesh(new THREE.PlaneGeometry(10,2.4),new THREE.MeshBasicMaterial({map:sign}));sm.position.set(0,b.h+1.3,b.z0-0.05);sm.rotation.y=Math.PI;scene.add(sm);}
      else if(b.k==='gate'){const r=building(b,gate,4,0x9aa3ab);edgeLights(b,r.y);}
      else if(b.k==='hangar'){const r=building(b,hang,3,0x7b8188);edgeLights(b,r.y);
        // an arched roof and big door panels facing the apron
        const w=b.x1-b.x0,arch=new THREE.Mesh(new THREE.CylinderGeometry((b.z1-b.z0)/2,(b.z1-b.z0)/2,w,16,1,false,0,Math.PI),hang);
        arch.rotation.z=Math.PI/2;arch.rotation.y=Math.PI/2;arch.scale.set(1,1,0.35);arch.position.set((b.x0+b.x1)/2,r.y,(b.z0+b.z1)/2);arch.castShadow=true;scene.add(arch);
        const door=new THREE.Mesh(new THREE.PlaneGeometry(Math.min(w-2,14),b.h-1.2),new THREE.MeshLambertMaterial({color:0x6c7680}));door.position.set((b.x0+b.x1)/2,hgt(0,0)+(b.h-1.2)/2,b.z1+0.04);scene.add(door);}
      else if(b.k==='tower'){const r=building(b,gate,3,0x8c949c);
        const cab=new THREE.Mesh(new THREE.CylinderGeometry(4,3.4,2.6,10),term);cab.position.set((b.x0+b.x1)/2,r.y+1.6,(b.z0+b.z1)/2);cab.castShadow=true;scene.add(cab);}
      else if(b.k==='fence'){const m=new THREE.Mesh(new THREE.BoxGeometry(0.12,b.h,b.z1-b.z0),fence);m.position.set(38,hgt(38,0)+b.h/2,(b.z0+b.z1)/2);scene.add(m);
        for(let z=b.z0;z<=b.z1;z+=2.5){const p=new THREE.Mesh(new THREE.CylinderGeometry(0.06,0.06,b.h+0.3,5),M.metal);p.position.set(38,hgt(38,z)+(b.h+0.3)/2,z);scene.add(p);STATIC_ROOTS.push(p);}
        const strip=new THREE.Mesh(new THREE.BoxGeometry(4,0.06,b.z1-b.z0),new THREE.MeshLambertMaterial({color:0x5d9a43}));strip.position.set(38,0.35,(b.z0+b.z1)/2);scene.add(strip);STATIC_ROOTS.push(strip);}
    }
    // jet bridges: a covered walkway over each of the three passages through the gate building
    for(const x of [-18,0,18]){
      const tube=new THREE.Mesh(new THREE.BoxGeometry(5,1.1,10.4),gate);tube.position.set(x,4.2,25);tube.castShadow=true;scene.add(tube);
      const arm=new THREE.Mesh(new THREE.BoxGeometry(2.4,1.6,6),gate);arm.position.set(x,4.0,17.2);arm.castShadow=true;scene.add(arm);
      const leg=new THREE.Mesh(new THREE.CylinderGeometry(0.2,0.25,3.2,8),M.metal);leg.position.set(x,1.9,15.2);scene.add(leg);obstacles.push({x,z:15.2,r:0.35});
    }
    // hangar gates: door frames over the three passages between the hangars
    for(const x of [-18,0,18]){const fr=new THREE.Mesh(new THREE.BoxGeometry(5.6,0.8,1),M.metal);fr.position.set(x,6.6,-20.4);scene.add(fr);STATIC_ROOTS.push(fr);}
    // the planes: white with an orange stripe, fuselage along z, nose towards the terminal
    const white=new THREE.MeshPhongMaterial({color:0xf3f5f8,specular:0x777777,shininess:60}),stripe=new THREE.MeshLambertMaterial({color:0xff8a1f}),win=new THREE.MeshLambertMaterial({color:0x2c3e52});
    for(const cx of [-12,12]){
      const g=new THREE.Group();g.position.set(cx,0.32,0);
      const body=new THREE.Mesh(new THREE.CylinderGeometry(1.35,1.35,15,16),white);body.rotation.x=Math.PI/2;body.position.y=2.0;g.add(body);
      const nose=new THREE.Mesh(new THREE.SphereGeometry(1.35,16,10,0,TAU,0,Math.PI/2),white);nose.rotation.x=Math.PI/2;nose.position.set(0,2.0,7.5);nose.scale.set(1,1.4,1);g.add(nose);
      const tail=new THREE.Mesh(new THREE.ConeGeometry(1.35,3,16),white);tail.rotation.x=-Math.PI/2;tail.position.set(0,2.2,-8.9);g.add(tail);
      const fin=new THREE.Mesh(new THREE.BoxGeometry(0.25,3,2.6),stripe);fin.position.set(0,4.2,-8.2);g.add(fin);
      const wing=new THREE.Mesh(new THREE.BoxGeometry(16,0.3,2.4),white);wing.position.set(0,1.5,-0.6);g.add(wing);
      const tw=new THREE.Mesh(new THREE.BoxGeometry(6.4,0.2,1.4),white);tw.position.set(0,2.6,-7.6);g.add(tw);
      for(const s of [-1,1]){
        const eng=new THREE.Mesh(new THREE.CylinderGeometry(0.6,0.6,2.2,12),M.metal);eng.rotation.x=Math.PI/2;eng.position.set(s*3.6,0.95,0.4);g.add(eng);
        const wins=new THREE.Mesh(new THREE.BoxGeometry(0.05,0.35,11),win);wins.position.set(s*1.36,2.5,0.6);g.add(wins);
        const st=new THREE.Mesh(new THREE.BoxGeometry(0.06,0.3,13),stripe);st.position.set(s*1.33,1.7,0);g.add(st);}
      for(const [gx,gz] of [[0,6],[-3.6,-0.6],[3.6,-0.6]]){const wh=new THREE.Mesh(new THREE.CylinderGeometry(0.35,0.35,0.3,10),M.dark);wh.rotation.z=Math.PI/2;wh.position.set(gx,0.35,gz);g.add(wh);}
      g.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});scene.add(g);
    }
    // apron life: baggage carts, a fuel truck, a stair truck, runway lights
    const cartM=new THREE.MeshLambertMaterial({color:0x3a76d2}),truckM=new THREE.MeshLambertMaterial({color:0xe6b93a});
    [[-22,9],[22,-9],[-22,-9],[22,9]].forEach(([x,z],i)=>{
      const g=new THREE.Group();g.position.set(x,0.32,z);
      for(let k=0;k<2;k++){const c=new THREE.Mesh(new THREE.BoxGeometry(1.3,0.9,1.8),i%2?truckM:cartM);c.position.set(0,0.65,(k-0.5)*2);g.add(c);}
      g.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});scene.add(g);STATIC_ROOTS.push(g);obstacles.push({x,z,r:1.5});
    });
    for(let z=-19;z<=19;z+=3)for(const x of [41.2,50.8]){const l=new THREE.Mesh(new THREE.BoxGeometry(0.25,0.15,0.25),new THREE.MeshBasicMaterial({color:z%2?0xffe08a:0xfafafa}));l.position.set(x,0.4,z);scene.add(l);STATIC_ROOTS.push(l);}
    // a plane now and then crossing the sky, taking off from the far runway
    const fly=new THREE.Group();
    {const b=new THREE.Mesh(new THREE.CylinderGeometry(0.9,0.9,10,12),white);b.rotation.x=Math.PI/2;fly.add(b);
     const w=new THREE.Mesh(new THREE.BoxGeometry(11,0.2,1.8),white);fly.add(w);const f=new THREE.Mesh(new THREE.BoxGeometry(0.2,2,1.6),stripe);f.position.set(0,1.2,-4.4);fly.add(f);}
    fly.visible=false;scene.add(fly);
    let flyT=rand(20,40),flyP=-1;
    URB.flyer=fly;
    const _mood=updateMood;updateMood=function(dt){_mood(dt);
      if(flyP<0){flyT-=dt;if(flyT<=0){flyP=0;fly.visible=true;}}
      else{flyP+=dt/22;const z=-120+flyP*240,y=4+Math.max(0,flyP-0.25)*60;fly.position.set(70,y,z);fly.rotation.x=-Math.min(0.25,Math.max(0,flyP-0.2)*0.6);
        if(flyP>=1){flyP=-1;fly.visible=false;flyT=rand(45,80);}}
    };
  }

  if(DESERT){
    /* ----- sandstone: rows of blocks; v follows the height, so the courses stay level on every face ----- */
    const stoneTex=canvasTex(128,(g,S)=>{g.fillStyle='#ffffff';g.fillRect(0,0,S,S);
      for(let r=0;r<4;r++){const y=r*S/4;g.fillStyle='rgba(120,90,50,.38)';g.fillRect(0,y,S,2);
        for(let k=0;k<3;k++){const x=((k+(r%2)*0.5)*S/3)%S;g.fillRect(x,y,2,S/4);}
        for(let i=0;i<40;i++){g.fillStyle=`rgba(${100+(i*37)%60},${80+(i*23)%40},50,.08)`;g.fillRect((i*53+r*17)%S,y+(i*29)%(S/4),5,3);}}});
    const sandstone=new THREE.MeshLambertMaterial({color:0xe0c08a,map:stoneTex,side:THREE.DoubleSide});
    const ruinMat=new THREE.MeshLambertMaterial({color:0xd2b27c,map:stoneTex});
    const P=URB.pyr,base=hgt(P.r+1,0)-0.05,plinth=1.2,H=t=>plinth+(P.h-plinth)*(1-t/P.r);
    // The pyramid: four faces rising to the apex, a plinth all round. The cross-shaped passage runs through it as a
    // tunnel (ceiling at CEIL); where the face is lower than that, near the edge, it is cut open as an entrance.
    const w=P.w,r=P.r,CUT=11,CEIL=3.2,pyrMat=sandstone.clone(),darkMat=new THREE.MeshLambertMaterial({color:0x6d5636,map:stoneTex,side:THREE.DoubleSide});
    const pos=[],uv=[],dpos=[],duv=[];
    const tri=(A,a,b,c)=>{for(const v of [a,b,c]){(A===pos?pos:dpos).push(v[0],v[1],v[2]);(A===pos?uv:duv).push((v[0]+v[2])/3,v[1]/1.2);}};
    const quad=(A,a,b,c,d)=>{tri(A,a,b,c);tri(A,a,c,d);};
    // rot: turn a point of the +x face to the other three faces
    const rots=[(x,y,z)=>[x,y,z],(x,y,z)=>[-z,y,x],(x,y,z)=>[-x,y,-z],(x,y,z)=>[z,y,-x]];
    const face=new THREE.Shape([[0,0],[r,-r],[r,-w],[CUT,-w],[CUT,w],[r,w],[r,r]].map(([x,z])=>new THREE.Vector2(x,z)));
    const fg=new THREE.ShapeGeometry(face),fp=fg.attributes.position,fi=fg.index.array;
    for(const R of rots){
      for(let i=0;i<fi.length;i+=3){const v=[fi[i],fi[i+1],fi[i+2]].map(k=>{const x=fp.getX(k),z=fp.getY(k);return R(x,H(x),z);});tri(pos,v[0],v[1],v[2]);}
      for(const [z0,z1] of [[-r,-w],[w,r]])quad(pos,R(r,0,z0),R(r,0,z1),R(r,plinth,z1),R(r,plinth,z0));   // plinth outside
      for(const s of [-1,1]){quad(pos,R(CUT,0,s*w),R(r,0,s*w),R(r,H(r),s*w),R(CUT,H(CUT),s*w));             // sides of the entrance cut
        quad(dpos,R(w,0,s*w),R(CUT,0,s*w),R(CUT,CEIL,s*w),R(w,CEIL,s*w));}                                   // tunnel walls
      quad(pos,R(CUT,CEIL,-w),R(CUT,CEIL,w),R(CUT,H(CUT),w),R(CUT,H(CUT),-w));                               // face above the tunnel mouth
      quad(dpos,R(w,CEIL,-w),R(CUT,CEIL,-w),R(CUT,CEIL,w),R(w,CEIL,w));                                      // tunnel ceiling
    }
    quad(dpos,[-w,CEIL,-w],[w,CEIL,-w],[w,CEIL,w],[-w,CEIL,w]);   // ceiling over the crossing
    const mk=(p,u,m)=>{const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(u,2));g.computeVertexNormals();
      const o=new THREE.Mesh(g,m);o.position.y=base;o.castShadow=o.receiveShadow=true;scene.add(o);return o;};
    mk(pos,uv,pyrMat);mk(dpos,duv,darkMat);
    fadeable.push({b:{x0:-r,x1:r,z0:-r,z1:r,h:P.h-1},mats:[pyrMat]});
    const cap=new THREE.Mesh(new THREE.ConeGeometry(1.15,1.3,4),new THREE.MeshPhongMaterial({color:0xf2c64a,specular:0xfff0b0,shininess:90}));cap.rotation.y=Math.PI/4;cap.position.set(0,base+P.h-0.4,0);scene.add(cap);URB.cap=cap;
    if(X){   // lights along the four ridges and round the plinth
      for(const R of rots){for(let i=1;i<=14;i++){const t=r*i/14,q=R(t,H(t)+0.15,t);lightPts.push([q[0],base+q[1],q[2]]);}
        for(let i=0;i<=9;i++){const t=-r+(r-w)*i/9;for(const z of [t,-t]){const q=R(r+0.05,plinth+0.12,z);lightPts.push([q[0],base+q[1],q[2]]);}}}
    }
    // a lintel of big blocks over each of the four tunnel mouths, pillars beside them
    for(const [x,z,ry] of [[0,CUT+0.4,0],[0,-CUT-0.4,0],[CUT+0.4,0,Math.PI/2],[-CUT-0.4,0,Math.PI/2]]){
      const l=new THREE.Mesh(sizedBox(w*2+1.6,0.9,1.0,1.2),ruinMat);l.position.set(x,base+CEIL+0.35,z);l.rotation.y=ry;l.castShadow=true;scene.add(l);STATIC_ROOTS.push(l);
      for(const s of [-1,1]){const pl=new THREE.Mesh(sizedBox(0.7,CEIL,0.9,1.2),ruinMat);pl.position.set(x+(ry?0:s*(w-0.35)),base+CEIL/2,z+(ry?s*(w-0.35):0));pl.castShadow=true;scene.add(pl);STATIC_ROOTS.push(pl);}
    }
    /* ----- ruins, rocks ----- */
    const rockMat2=new THREE.MeshPhongMaterial({color:0xb48a5c,flatShading:true,shininess:4});
    for(const b of URB.boxes){
      const w=b.x1-b.x0,d=b.z1-b.z0,cx=(b.x0+b.x1)/2,cz=(b.z0+b.z1)/2,y=hgt(cx,cz);
      if(b.k==='wall'){const m=new THREE.Mesh(sizedBox(w,b.h,d,1.2),ruinMat);m.position.set(cx,y+b.h/2-0.1,cz);m.castShadow=m.receiveShadow=true;scene.add(m);STATIC_ROOTS.push(m);
        for(let i=0;i<3;i++){const t=(i+0.5)/3,bb=new THREE.Mesh(sizedBox(w>d?w/4:w,0.5,w>d?d:d/4,1.2),ruinMat);bb.position.set(w>d?b.x0+w*t:cx,y+b.h+0.15,w>d?cz:b.z0+d*t);bb.rotation.y=(i-1)*0.12;bb.castShadow=true;if(i!==1){scene.add(bb);STATIC_ROOTS.push(bb);}}}
      else if(b.k==='col'){const m=new THREE.Mesh(new THREE.CylinderGeometry(0.5,0.55,b.h,12),ruinMat);m.position.set(cx,y+b.h/2,cz);m.castShadow=true;scene.add(m);STATIC_ROOTS.push(m);
        const cap=new THREE.Mesh(sizedBox(1.3,0.4,1.3,1.2),ruinMat);cap.position.set(cx,y+b.h+0.1,cz);cap.castShadow=true;scene.add(cap);STATIC_ROOTS.push(cap);
        if(X)for(let i=0;i<14;i++){const a=i*0.9,yy=0.4+i*(b.h-0.6)/14;lightPts.push([cx+Math.cos(a)*0.58,y+yy,cz+Math.sin(a)*0.58]);}}
      else if(b.k==='fallen'){for(let i=0;i<3;i++){const seg=new THREE.Mesh(new THREE.CylinderGeometry(0.55,0.55,d/3-0.1,12),ruinMat);seg.rotation.x=Math.PI/2;seg.rotation.z=(i-1)*0.05;
        seg.position.set(cx+(i-1)*0.08,y+0.55,b.z0+d*(i+0.5)/3);seg.castShadow=true;scene.add(seg);STATIC_ROOTS.push(seg);}}
      else if(b.k==='rock'){for(let i=0;i<3;i++){const s=Math.max(w,d)/3.2,m=new THREE.Mesh(new THREE.DodecahedronGeometry(s*(0.9+i*0.15),0),rockMat2);
        const t=(i+0.5)/3;m.position.set(w>d?b.x0+w*t:cx,y+s*0.55,w>d?cz:b.z0+d*t);m.scale.set(w>d?1:Math.min(1,w/s/1.8),b.h/s/1.6,w>d?Math.min(1,d/s/1.8):1);m.rotation.y=i*1.3;m.castShadow=m.receiveShadow=true;scene.add(m);STATIC_ROOTS.push(m);}}
    }
    // loose blocks in the sand near the ruins (low, only something to look at)
    for(const s of [1,-1])for(const [x,z,k] of [[39,7,0.7],[47,-3,0.5],[34,-6,0.6],[40,-11,0.45]]){const m=new THREE.Mesh(sizedBox(k*2,k,k*1.4,1.2),ruinMat);m.position.set(s*x,hgt(s*x,s*z)+k/2-0.1,s*z);m.rotation.y=x*0.3;m.castShadow=true;scene.add(m);STATIC_ROOTS.push(m);}
    /* ----- oases: ponds, palms, reeds ----- */
    const waterM=new THREE.MeshPhongMaterial({color:0x3f9fc0,specular:0xfff2d0,shininess:110,transparent:true,opacity:0.9});
    const trunkM=new THREE.MeshLambertMaterial({color:0x8a6a44}),frondM=new THREE.MeshLambertMaterial({color:0x4f8f3a,side:THREE.DoubleSide});
    const frondG=new THREE.PlaneGeometry(0.7,2.6,1,3);{const p=frondG.attributes.position;for(let i=0;i<p.count;i++){const yy=p.getY(i)+1.3;p.setZ(i,-0.08*yy*yy);p.setX(i,p.getX(i)*(1-yy/3.2));}frondG.translate(0,1.3,0);frondG.rotateX(-Math.PI/2+0.35);frondG.computeVertexNormals();}
    function palm(x,z,s){
      const g=new THREE.Group(),y=hgt(x,z),lean=srand()*TAU,tilt=0.12+srand()*0.12;g.position.set(x,y-0.05,z);
      let px=0,py=0,pz=0;
      for(let i=0;i<5;i++){const seg=new THREE.Mesh(new THREE.CylinderGeometry(0.17-i*0.015,0.21-i*0.015,1.0*s,7),trunkM);
        const k=tilt*(i+1)*0.5;seg.position.set(px+Math.cos(lean)*k*0.5,py+0.5*s,pz+Math.sin(lean)*k*0.5);seg.rotation.set(Math.sin(lean)*k,0,-Math.cos(lean)*k);g.add(seg);
        px+=Math.cos(lean)*Math.sin(k)*s;pz+=Math.sin(lean)*Math.sin(k)*s;py+=Math.cos(k)*s;
        if(X)for(let j=0;j<3;j++){const a=(i*3+j)*2.1;lightPts.push([x+px+Math.cos(a)*0.24,y+py-0.3*j,z+pz+Math.sin(a)*0.24]);}}
      for(let i=0;i<8;i++){const f=new THREE.Mesh(frondG,frondM);f.position.set(px,py,pz);f.rotation.y=i/8*TAU+srand()*0.3;f.scale.setScalar(s*(0.9+srand()*0.25));g.add(f);}
      const nut=new THREE.Mesh(new THREE.SphereGeometry(0.16,6,4),trunkM);nut.position.set(px,py-0.2,pz);g.add(nut);
      g.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});scene.add(g);STATIC_ROOTS.push(g);
      TREES.push({x,z,g});obstacles.push({x,z,r:0.45});
    }
    for(const p of URB.ponds){
      const y=hgt(p.x,p.z);
      const wm=new THREE.Mesh(new THREE.CircleGeometry(p.r,28).rotateX(-Math.PI/2),waterM);wm.position.set(p.x,y+0.06,p.z);wm.receiveShadow=true;scene.add(wm);
      const rim=new THREE.Mesh(new THREE.RingGeometry(p.r-0.1,p.r+0.5,28).rotateX(-Math.PI/2),new THREE.MeshLambertMaterial({color:0xb9a171}));rim.position.set(p.x,y+0.05,p.z);scene.add(rim);STATIC_ROOTS.push(rim);
      obstacles.push({x:p.x,z:p.z,r:p.r+0.2,pond:true});
      const n=Math.round(p.r*1.6);
      for(let i=0;i<n;i++){const a=i/n*TAU+p.x*0.1,rr=p.r+1.4+srand()*1.6;palm(p.x+Math.cos(a)*rr,p.z+Math.sin(a)*rr,0.95+srand()*0.4);}
      for(let i=0;i<10;i++){const a=srand()*TAU,rr=p.r+0.2,m=new THREE.Mesh(new THREE.ConeGeometry(0.08,0.9+srand()*0.5,4),frondM);m.position.set(p.x+Math.cos(a)*rr,y+0.45,p.z+Math.sin(a)*rr);scene.add(m);STATIC_ROOTS.push(m);}
    }
    for(const s of [1,-1])for(const [x,z] of [[-12,34],[12,33]])palm(x,s*z,1.1);   // a palm on each side of the base
    /* ----- cacti and stones out on the sand ----- */
    const cactM=new THREE.MeshLambertMaterial({color:0x5f8f4a});
    for(const s of [1,-1])for(const [x,z] of [[47,18],[-47,20],[24,47],[-30,47],[47,33],[-45,-30]]){
      const cx=s*x,cz=s*z,g=new THREE.Group(),y=hgt(cx,cz);g.position.set(cx,y,cz);
      const t=new THREE.Mesh(new THREE.CylinderGeometry(0.28,0.32,2.2,8),cactM);t.position.y=1.1;g.add(t);
      for(const k of [-1,1]){const a=new THREE.Mesh(new THREE.CylinderGeometry(0.16,0.18,0.9,7),cactM);a.position.set(k*0.55,1.25+k*0.2,0);g.add(a);
        const h=new THREE.Mesh(new THREE.CylinderGeometry(0.16,0.16,0.5,7),cactM);h.rotation.z=Math.PI/2;h.position.set(k*0.38,0.85+k*0.2,0);g.add(h);}
      g.rotation.y=x;g.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});scene.add(g);STATIC_ROOTS.push(g);obstacles.push({x:cx,z:cz,r:0.6});
    }
    /* ----- obelisks with gold tips, a sphinx and two far pyramids on the horizon, dry shrubs ----- */
    const goldM=new THREE.MeshPhongMaterial({color:0xf2c64a,specular:0xfff0b0,shininess:90});
    const glyph=canvasTex(64,(g,S)=>{g.fillStyle='#ffffff';g.fillRect(0,0,S,S);g.fillStyle='rgba(110,80,40,.55)';
      for(let i=0;i<6;i++){const y=4+i*10;g.fillRect(24,y,16,2);if(i%2)g.fillRect(28,y+3,8,5);else{g.beginPath();g.arc(32,y+6,3,0,TAU);g.fill();}}});
    for(const b of URB.boxes){if(b.k!=='obelisk')continue;
      const cx=(b.x0+b.x1)/2,cz=(b.z0+b.z1)/2,y=hgt(cx,cz),g=new THREE.Group();g.position.set(cx,y,cz);
      const foot=new THREE.Mesh(sizedBox(2,0.6,2,1.2),ruinMat);foot.position.y=0.3;g.add(foot);
      const shaft=new THREE.Mesh(new THREE.CylinderGeometry(0.5,0.75,b.h-0.6,4,1),new THREE.MeshLambertMaterial({color:0xd8b884,map:glyph}));shaft.rotation.y=Math.PI/4;shaft.position.y=0.6+(b.h-0.6)/2-0.3;g.add(shaft);
      const tip=new THREE.Mesh(new THREE.ConeGeometry(0.71,0.9,4),goldM);tip.rotation.y=Math.PI/4;tip.position.y=b.h+0.15;g.add(tip);
      g.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});scene.add(g);STATIC_ROOTS.push(g);
      if(X)for(let i=0;i<16;i++){const a=i*1.1,yy=0.8+i*(b.h-1.2)/16,rr=0.72-yy/b.h*0.22;lightPts.push([cx+Math.cos(a)*rr,y+yy,cz+Math.sin(a)*rr]);}
    }
    {  // the sphinx lies outside the field on the west side and looks across at the pyramid
      const g=new THREE.Group(),sm=new THREE.MeshLambertMaterial({color:0xd4b07a,map:stoneTex}),k=2.2,y=hgt(-68,0);
      const add=(geo,x,yy,z,rx,ry,rz)=>{const m=new THREE.Mesh(geo,sm);m.position.set(x*k,yy*k,z*k);m.rotation.set(rx||0,ry||0,rz||0);g.add(m);return m;};
      add(sizedBox(3.2*k,1.6*k,7*k,1.2),0,0.8,-0.6);                         // body
      add(new THREE.CylinderGeometry(1.6*k,1.6*k,3.2*k,14,1,false,0,Math.PI),0,1.6,-3.9,0,0,Math.PI/2).scale.set(1,1,0.6);   // haunch
      for(const s of [-1,1])add(sizedBox(0.9*k,0.7*k,3.6*k,1.2),s*1.05,0.35,4.2);   // front paws
      add(sizedBox(2.4*k,2.4*k,1.8*k,1.2),0,2.4,2.4);                         // chest
      const head=add(sizedBox(1.5*k,1.7*k,1.6*k,1.2),0,4.2,2.9);
      const nemes=add(new THREE.CylinderGeometry(0.9*k,1.6*k,2.0*k,4,1),0,4.0,2.5,0,Math.PI/4,0);nemes.scale.set(1,1,0.75);
      add(sizedBox(0.5*k,0.9*k,0.3*k,1.2),0,3.0,3.7);                         // beard
      const face=new THREE.Mesh(new THREE.PlaneGeometry(1.3*k,1.4*k),new THREE.MeshLambertMaterial({map:canvasTex(64,(c,S)=>{c.fillStyle='#d4b07a';c.fillRect(0,0,S,S);c.fillStyle='#5a4326';
        c.fillRect(14,22,12,4);c.fillRect(38,22,12,4);c.fillRect(30,30,4,14);c.fillRect(24,48,16,3);})}));face.position.set(0,4.2*k,3.71*k);g.add(face);
      if(X){const hat=new THREE.Mesh(new THREE.ConeGeometry(1.0*k,2.4*k,14),new THREE.MeshLambertMaterial({color:0xd62828}));hat.position.set(0,6.1*k,2.6*k);hat.rotation.x=-0.35;g.add(hat);
        const rim=new THREE.Mesh(new THREE.TorusGeometry(0.95*k,0.22*k,8,18),new THREE.MeshLambertMaterial({color:0xffffff}));rim.rotation.x=Math.PI/2;rim.position.set(0,5.05*k,2.75*k);g.add(rim);
        const pom=new THREE.Mesh(new THREE.SphereGeometry(0.35*k,8,6),rim.material);pom.position.set(0,7.25*k,2.05*k);g.add(pom);}
      g.position.set(-68,y-0.2,0);g.rotation.y=Math.PI/2;g.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});scene.add(g);URB.sphinx=g;
    }
    for(const [x,z,s] of [[-72,-70,22],[76,68,28],[58,-80,16]]){   // far pyramids, beyond reach
      const m=new THREE.Mesh(new THREE.ConeGeometry(s*0.72,s*0.62,4),new THREE.MeshLambertMaterial({color:0xd9bc86,map:stoneTex}));m.rotation.y=Math.PI/4;m.position.set(x,hgt(x,z)+s*0.31-0.3,z);m.receiveShadow=true;scene.add(m);STATIC_ROOTS.push(m);
    }
    {const shrub=new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.42,0),new THREE.MeshPhongMaterial({color:0xffffff,flatShading:true,shininess:3}),90),d=new THREE.Object3D(),c=new THREE.Color();let n=0;
     for(let k=0;k<900&&n<90;k++){const x=(srand()*2-1)*50,z=(srand()*2-1)*50;
       if(!urbanFree(x,z,1.5)||inPyramid(x,z,2)||BASES.some(b=>Math.hypot(b.x-x,b.z-z)<10)||obstacles.some(o=>Math.hypot(o.x-x,o.z-z)<o.r+1.5)||URB.zones.flat().concat(URB.gold).some(r=>x>r.x0-2&&x<r.x1+2&&z>r.z0-2&&z<r.z1+2))continue;
       d.position.set(x,hgt(x,z)+0.18,z);d.rotation.set(srand(),srand()*3,srand());const s=0.6+srand()*0.9;d.scale.set(s*1.3,s*0.7,s*1.3);d.updateMatrix();shrub.setMatrixAt(n,d.matrix);
       shrub.setColorAt(n,c.setHSL(0.11+srand()*0.06,0.32,0.32+srand()*0.14));n++;}
     shrub.count=n;shrub.castShadow=true;shrub.receiveShadow=true;scene.add(shrub);}
    /* ----- a camel caravan walking along the horizon (instead of the seagulls) ----- */
    for(const b of birds)b.g.visible=false;
    const camM=new THREE.MeshLambertMaterial({color:0xb98b55}),camD=new THREE.MeshLambertMaterial({color:0x8a6236});
    const camels=[];
    function camel(){
      const g=new THREE.Group(),legs=[];
      const body=new THREE.Mesh(new THREE.SphereGeometry(0.9,10,8),camM);body.scale.set(0.75,0.65,1.35);body.position.y=2.2;g.add(body);
      const hump=new THREE.Mesh(new THREE.SphereGeometry(0.55,10,8),camM);hump.position.set(0,2.85,-0.1);hump.scale.set(0.9,0.9,1.1);g.add(hump);
      const neck=new THREE.Mesh(new THREE.CylinderGeometry(0.18,0.26,1.4,7),camM);neck.position.set(0,2.65,1.3);neck.rotation.x=0.7;g.add(neck);
      const head=new THREE.Mesh(new THREE.BoxGeometry(0.34,0.36,0.75),camM);head.position.set(0,3.2,1.85);g.add(head);
      for(const [lx,lz] of [[-0.35,0.75],[0.35,0.75],[-0.35,-0.75],[0.35,-0.75]]){const lg=new THREE.Group();lg.position.set(lx,1.75,lz);
        const l=new THREE.Mesh(new THREE.CylinderGeometry(0.1,0.08,1.75,6),camD);l.position.y=-0.87;lg.add(l);g.add(lg);legs.push(lg);}
      if(X){const hat=new THREE.Mesh(new THREE.ConeGeometry(0.24,0.55,10),new THREE.MeshLambertMaterial({color:0xd62828}));hat.position.set(0,3.6,1.8);hat.rotation.x=-0.4;g.add(hat);
        const rim=new THREE.Mesh(new THREE.TorusGeometry(0.22,0.07,6,12),new THREE.MeshLambertMaterial({color:0xffffff}));rim.rotation.x=Math.PI/2;rim.position.set(0,3.38,1.82);g.add(rim);
        const pom=new THREE.Mesh(new THREE.SphereGeometry(0.09,6,4),rim.material);pom.position.set(0,3.85,1.68);g.add(pom);}
      g.traverse(o=>{if(o.isMesh)o.castShadow=true;});scene.add(g);return {g,legs};
    }
    for(let i=0;i<4;i++)camels.push(camel());
    URB.camels=camels;
    let cp=0;
    const _mood=updateMood;updateMood=function(dt){_mood(dt);
      cp+=dt*0.9;const L=180;
      camels.forEach((c,i)=>{const z=((cp-i*4.2)%L+L)%L-L/2,x=66+Math.sin(z*0.05)*3;c.g.position.set(x,hgt(x,z),z);c.g.rotation.y=-Math.atan(Math.cos(z*0.05)*0.15);
        c.legs.forEach((l,k)=>{l.rotation.x=Math.sin(cp*3+k*1.6+i)*0.35;});});
    };
  }

  if(MOON){
    const panelTex=canvasTex(64,(g,S)=>{g.fillStyle='#ffffff';g.fillRect(0,0,S,S);g.strokeStyle='rgba(90,100,120,.45)';g.lineWidth=2;
      for(let i=0;i<=4;i++){g.beginPath();g.moveTo(0,i*S/4);g.lineTo(S,i*S/4);g.stroke();g.beginPath();g.moveTo(i*S/4+(i%2)*4,0);g.lineTo(i*S/4+(i%2)*4,S);g.stroke();}});
    /* ----- domes: a big one and a small one per base, joined by a short tube. Christmas: gingerbread with icing ----- */
    const domeM=X?new THREE.MeshPhongMaterial({color:0xa8642e,shininess:12}):new THREE.MeshPhongMaterial({color:0xe9ecf2,map:panelTex,specular:0x8899aa,shininess:40});
    const icing=new THREE.MeshLambertMaterial({color:0xffffff}),ringM=new THREE.MeshPhongMaterial({color:0x8d939c,shininess:30});
    for(const d of URB.domes){
      const y=hgt(d.x,d.z),g=new THREE.Group();g.position.set(d.x,y-0.05,d.z);
      const dome=new THREE.Mesh(new THREE.SphereGeometry(d.r,28,14,0,TAU,0,Math.PI/2),domeM);dome.scale.y=0.82;g.add(dome);
      const ring=new THREE.Mesh(new THREE.CylinderGeometry(d.r+0.15,d.r+0.25,0.6,28),X?icing:ringM);ring.position.y=0.3;g.add(ring);
      const door=new THREE.Mesh(new THREE.BoxGeometry(1.4,1.9,1.2),ringM);const a=Math.atan2(-d.x,-d.z);   // the door faces the middle of the mapdoor.position.set(Math.sin(a)*d.r,0.95,Math.cos(a)*d.r);door.rotation.y=a;g.add(door);
      if(d.main){const ant=new THREE.Mesh(new THREE.CylinderGeometry(0.06,0.06,3,6),ringM);ant.position.y=d.r*0.82+1.4;g.add(ant);
        const tip=new THREE.Mesh(new THREE.SphereGeometry(0.18,8,6),new THREE.MeshBasicMaterial({color:0xff5040}));tip.position.y=d.r*0.82+2.95;g.add(tip);}
      if(X){for(let i=0;i<10;i++){const b=new THREE.Mesh(new THREE.SphereGeometry(0.28,8,6),new THREE.MeshLambertMaterial({color:[0xd62828,0x3fa0ff,0x3fd46a,0xffd24a][i%4]}));
          const aa=i/10*TAU,yy=d.r*0.82*0.55;b.position.set(Math.cos(aa)*d.r*0.84,yy,Math.sin(aa)*d.r*0.84);g.add(b);}
        const top=new THREE.Mesh(new THREE.SphereGeometry(d.r*0.38,14,8,0,TAU,0,Math.PI/2),icing);top.position.y=d.r*0.82-d.r*0.2;top.scale.y=0.55;g.add(top);
        for(let i=0;i<24;i++){const aa=i/24*TAU;lightPts.push([d.x+Math.cos(aa)*(d.r+0.3),y+0.75,d.z+Math.sin(aa)*(d.r+0.3)]);}}
      g.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});scene.add(g);STATIC_ROOTS.push(g);
      obstacles.push({x:d.x,z:d.z,r:d.r+0.3});
    }
    for(const s of [1,-1]){const a=URB.domes.find(d=>d.main&&Math.sign(d.z)===s),b=URB.domes.find(d=>!d.main&&Math.sign(d.z)===s);
      const dx=b.x-a.x,dz=b.z-a.z,L=Math.hypot(dx,dz),c=new THREE.Mesh(new THREE.CylinderGeometry(1,1,L,12),domeM);
      c.rotation.z=Math.PI/2;c.rotation.y=-Math.atan2(dz,dx);c.position.set((a.x+b.x)/2,hgt(a.x,a.z)+1,(a.z+b.z)/2);c.castShadow=true;scene.add(c);STATIC_ROOTS.push(c);
      // the walkway between the domes is part of the base: nobody walks through it
      for(let k=0.3;k<0.75;k+=0.15)obstacles.push({x:a.x+dx*k,z:a.z+dz*k,r:1.2});}
    /* ----- the tube: a white half pipe with ribs and a row of small windows over its walls ----- */
    const tubeM=new THREE.MeshPhongMaterial({color:0xdfe1e4,specular:0x667788,shininess:30,side:THREE.DoubleSide}),ribM=new THREE.MeshPhongMaterial({color:0x9aa1aa,shininess:20});
    const winM=new THREE.MeshBasicMaterial({color:0x6fb6ff});
    function pipe(ax,az,bx,bz,b){
      const L=Math.hypot(bx-ax,bz-az),ang=Math.atan2(bx-ax,bz-az),cx=(ax+bx)/2,cz=(az+bz)/2,R=3.4,y=hgt(cx,cz)-0.05,mat=tubeM.clone();
      const g=new THREE.Group();g.position.set(cx,y,cz);g.rotation.y=ang;
      const half=new THREE.Mesh(new THREE.CylinderGeometry(R,R,L,20,1,true,Math.PI/2,Math.PI),mat);half.rotation.x=Math.PI/2;g.add(half);   // the upper half after turning the axis along the tube
      for(let t=-L/2+1;t<=L/2-1;t+=4){const r=new THREE.Mesh(new THREE.TorusGeometry(R+0.05,0.12,6,20,Math.PI),ribM);r.position.z=t;g.add(r);}
      for(const sd of [-1,1]){const w=new THREE.Mesh(new THREE.BoxGeometry(0.06,0.35,L-2),winM);w.position.set(sd*R*0.93,1.3,0);g.add(w);}
      g.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});scene.add(g);
      fadeable.push({b,mats:[mat]});
      if(X){const n=Math.round(L/1.4);for(let i=0;i<=n;i++){const t=-L/2+L*i/n;lightPts.push([cx+Math.sin(ang)*t,y+R*0.95+0.12,cz+Math.cos(ang)*t]);}}
      return g;
    }
    pipe(44.2,-39.6,44.2,39.6,{x0:40.8,x1:47.6,z0:-39.6,z1:39.6,h:3.4});
    for(const s of [1,-1]){   // closed ends of the long part
      const cap=new THREE.Mesh(new THREE.CircleGeometry(3.4,20,0,Math.PI),tubeM);cap.position.set(44.2,hgt(44.2,s*39.6)-0.05,s*39.6);scene.add(cap);STATIC_ROOTS.push(cap);}
    for(const s of [1,-1]){pipe(16,s*36.2,44.2,s*36.2,{x0:16,x1:42,z0:s>0?32.8:-39.6,z1:s>0?39.6:-32.8,h:3.4});
      const fr=new THREE.Mesh(new THREE.TorusGeometry(3.5,0.35,8,20,Math.PI),ribM);fr.rotation.y=Math.PI/2;fr.position.set(16,hgt(16,s*36.2),s*36.2);scene.add(fr);STATIC_ROOTS.push(fr);
      const sign=new THREE.Mesh(new THREE.BoxGeometry(0.2,0.6,2.4),new THREE.MeshBasicMaterial({color:0xffc928}));sign.position.set(15.8,hgt(16,s*36.2)+3.2,s*36.2);scene.add(sign);STATIC_ROOTS.push(sign);}
    /* ----- boulders ----- */
    const rockM=new THREE.MeshPhongMaterial({color:0x8a8884,flatShading:true,shininess:4});
    for(const b of URB.boxes){if(b.k!=='boulder')continue;
      const w=b.x1-b.x0,cx=(b.x0+b.x1)/2,cz=(b.z0+b.z1)/2,m=new THREE.Mesh(new THREE.DodecahedronGeometry(w*0.62,1),rockM);
      m.position.set(cx,hgt(cx,cz)+b.h*0.38,cz);m.scale.set(1,b.h/(w*1.1),0.95);m.rotation.y=cx;m.castShadow=m.receiveShadow=true;scene.add(m);STATIC_ROOTS.push(m);}
    // loose stones everywhere (low, only to look at)
    {const st=new THREE.InstancedMesh(new THREE.DodecahedronGeometry(0.35,0),rockM,140),d=new THREE.Object3D();let n=0;
     for(let k=0;k<1200&&n<140;k++){const x=(srand()*2-1)*50,z=(srand()*2-1)*50;
       if(!urbanFree(x,z,1.5)||inTube(x,z,1.5)||BASES.some(b=>Math.hypot(b.x-x,b.z-z)<9)||obstacles.some(o=>Math.hypot(o.x-x,o.z-z)<o.r+1)||URB.zones.flat().concat(URB.gold).some(r=>x>r.x0-2&&x<r.x1+2&&z>r.z0-2&&z<r.z1+2))continue;
       d.position.set(x,hgt(x,z)+0.1,z);d.rotation.set(srand()*3,srand()*3,srand()*3);d.scale.setScalar(0.4+srand()*1.4);d.updateMatrix();st.setMatrixAt(n++,d.matrix);}
     st.count=n;st.castShadow=true;st.receiveShadow=true;scene.add(st);}
    /* ----- deco: a lander, two rovers, a flag on the crater rim, a satellite dish ----- */
    const gold=new THREE.MeshPhongMaterial({color:0xd9a93a,specular:0xffe9a0,shininess:80}),white=new THREE.MeshPhongMaterial({color:0xf2f2f0,shininess:30}),darkM=new THREE.MeshLambertMaterial({color:0x2a2c30});
    {const g=new THREE.Group(),x=-44,z=0;g.position.set(x,hgt(x,z),z);
     const body=new THREE.Mesh(new THREE.CylinderGeometry(1.5,1.7,1.4,8),gold);body.position.y=1.6;g.add(body);
     const cab=new THREE.Mesh(new THREE.CylinderGeometry(1.1,1.4,1.3,8),white);cab.position.y=2.95;g.add(cab);
     const win=new THREE.Mesh(new THREE.BoxGeometry(0.5,0.4,0.1),darkM);win.position.set(0,3.1,1.25);g.add(win);
     for(let i=0;i<4;i++){const a=i/4*TAU+Math.PI/4,l=new THREE.Mesh(new THREE.CylinderGeometry(0.07,0.07,2.2,6),ribM);l.position.set(Math.cos(a)*1.8,0.9,Math.sin(a)*1.8);l.rotation.set(Math.sin(a)*0.45,0,-Math.cos(a)*0.45);g.add(l);
       const f=new THREE.Mesh(new THREE.CylinderGeometry(0.35,0.4,0.1,10),ribM);f.position.set(Math.cos(a)*2.3,0.05,Math.sin(a)*2.3);g.add(f);}
     g.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});scene.add(g);STATIC_ROOTS.push(g);obstacles.push({x,z,r:2.2});URB.lander=g;}
    URB.rovers=[];
    for(const s of [1,-1]){const g=new THREE.Group(),x=-38,z=s*27;g.position.set(x,hgt(x,z),z);g.rotation.y=s*0.6;
      const deck=new THREE.Mesh(new THREE.BoxGeometry(1.8,0.25,2.8),white);deck.position.y=0.8;g.add(deck);
      for(const [wx,wz] of [[-1,-1],[1,-1],[-1,1],[1,1]]){const w=new THREE.Mesh(new THREE.CylinderGeometry(0.45,0.45,0.3,12),darkM);w.rotation.z=Math.PI/2;w.position.set(wx*1.05,0.45,wz*1.0);g.add(w);}
      const seat=new THREE.Mesh(new THREE.BoxGeometry(1.2,0.5,0.5),ribM);seat.position.set(0,1.15,-0.3);g.add(seat);
      const dish=new THREE.Mesh(new THREE.SphereGeometry(0.45,12,6,0,TAU,0,Math.PI/2.5),white);dish.position.set(0.5,1.7,0.9);dish.rotation.x=-0.8;g.add(dish);
      g.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});scene.add(g);STATIC_ROOTS.push(g);obstacles.push({x,z,r:1.7});URB.rovers.push(g);}
    {const x=-11.6,z=0,y=hgt(x,z),pole=new THREE.Mesh(new THREE.CylinderGeometry(0.05,0.05,3.2,6),ribM);pole.position.set(x,y+1.6,z);scene.add(pole);STATIC_ROOTS.push(pole);
     const ft=canvasTex(64,(g,S)=>{g.fillStyle='#ff8a1f';g.fillRect(0,0,S,S/2);g.fillStyle='#1fb5a8';g.fillRect(0,S/2,S,S/2);g.fillStyle='#ffffff';g.fillRect(S*0.36,S*0.3,S*0.28,S*0.4);g.fillStyle='#9a6a3c';g.fillRect(S*0.4,S*0.36,S*0.2,S*0.28);});
     const flag=new THREE.Mesh(new THREE.PlaneGeometry(1.6,1),new THREE.MeshLambertMaterial({map:ft,side:THREE.DoubleSide}));flag.position.set(x,y+2.7,z+0.8);flag.rotation.y=Math.PI/2;scene.add(flag);STATIC_ROOTS.push(flag);
     const bar=new THREE.Mesh(new THREE.CylinderGeometry(0.03,0.03,1.6,5),ribM);bar.rotation.x=Math.PI/2;bar.position.set(x,y+3.2,z+0.8);scene.add(bar);STATIC_ROOTS.push(bar);obstacles.push({x,z,r:0.3,low:true});}
    {const x=34,z=0,y=hgt(x,z),g=new THREE.Group();g.position.set(x,y,z);
     const post=new THREE.Mesh(new THREE.CylinderGeometry(0.15,0.25,2.4,8),ribM);post.position.y=1.2;g.add(post);
     const d=new THREE.Mesh(new THREE.SphereGeometry(1.6,18,8,0,TAU,0,Math.PI/2.6),white);d.position.y=2.7;d.rotation.z=-0.7;d.rotation.x=0.3;g.add(d);
     const hornM=new THREE.Mesh(new THREE.CylinderGeometry(0.04,0.04,1.4,5),ribM);hornM.position.set(-0.6,3.1,0);hornM.rotation.z=-0.7;g.add(hornM);
     g.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});scene.add(g);STATIC_ROOTS.push(g);obstacles.push({x,z,r:1});URB.dish=d;}
    for(const b of birds)b.g.visible=false;   // no birds in a vacuum
  }

  /* ---------- Xmas lights: one instanced mesh, colours cycle ---------- */
  if(X&&lightPts.length){
    const ORNC=[0xff3b3b,0xffd24a,0x4ad7ff,0x7dff7a,0xffffff];
    const lm=new THREE.InstancedMesh(new THREE.SphereGeometry(0.12,6,4),new THREE.MeshBasicMaterial({color:0xffffff}),lightPts.length),d=new THREE.Object3D(),c=new THREE.Color();
    lightPts.forEach((p,i)=>{d.position.set(p[0],p[1],p[2]);d.updateMatrix();lm.setMatrixAt(i,d.matrix);lm.setColorAt(i,c.set(ORNC[i%ORNC.length]));});
    scene.add(lm);URB.lights=lm;
  }

  /* ---------- See-through: a building between the camera and the own Blechling fades ---------- */
  for(const f of fadeable)for(const m of f.mats){m.transparent=true;m.userData.kkFade=1;}
  const _uc=updateCamera;
  updateCamera=function(dt){
    _uc(dt);
    const p=player||{x:camLook.x,z:camLook.z},cx=camera.position.x,cy=camera.position.y,cz=camera.position.z,py=hgt(p.x,p.z)+1.2;
    for(const f of fadeable){
      const b=f.b,hit=state!=='menu'&&(function(){
        // the line from the camera to the player (in 3D) passes through this building
        let t0=0,t1=1;const dx=p.x-cx,dy=py-cy,dz=p.z-cz;
        for(const [a,d,lo,hi] of [[cx,dx,b.x0-0.4,b.x1+0.4],[cy,dy,-1,b.h+0.8],[cz,dz,b.z0-0.4,b.z1+0.4]]){
          if(Math.abs(d)<1e-9){if(a<lo||a>hi)return false;continue;}
          let ta=(lo-a)/d,tb=(hi-a)/d;if(ta>tb){const q=ta;ta=tb;tb=q;}t0=Math.max(t0,ta);t1=Math.min(t1,tb);if(t0>=t1)return false;}
        return t0<0.98;
      })();
      for(const m of f.mats){const want=hit?0.28:1;m.userData.kkFade+=(want-m.userData.kkFade)*Math.min(1,dt*8);m.opacity=m.userData.kkFade;m.depthWrite=m.opacity>0.95;}
    }
  };
  URB.fadeable=fadeable;
})();
