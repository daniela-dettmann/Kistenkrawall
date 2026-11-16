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
