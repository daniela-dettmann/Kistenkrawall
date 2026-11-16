/* Kistenkrawall: Hilfsfunktionen und Form der Spielwelt (Höhenkarte, Brücken, Inseln) */
'use strict';
const $=s=>document.querySelector(s);
const rand=(a,b)=>a+Math.random()*(b-a);
const pick=a=>a[Math.floor(Math.random()*a.length)];
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const smooth=t=>{t=clamp(t,0,1);return t*t*(3-2*t);};
let seed=12345;const srand=()=>{seed=(seed*16807)%2147483647;return (seed-1)/2147483646;};
const TAU=Math.PI*2;
function angDiff(a,b){let d=(a-b)%TAU;if(d>Math.PI)d-=TAU;if(d<-Math.PI)d+=TAU;return d;}
const dist=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);

/* Map: 'insel' (river with two bridges) or 'gebirge' (chasm with a wide bridge and a narrow pass).
   Both share the same layout rule: an impassable band around z=0, crossed at x=-18 and x=+18, each with a
   plateau in the middle where crates land. That keeps movement, AI routes and fairness identical.
   'vulkan' breaks that rule a little: the band is a lava stream, wider, with one big island in its middle.
   Two bridges lead onto the island from either bank (x=-8 and x=+8), a crater in its centre is impassable,
   and all crates land on the island. The band is still crossed along two lanes, so waves and defence work alike.
   'flughafen' and 'stadt' have no band at all: flat paved ground with buildings (URB.boxes) that block movement,
   sight and direct shots; units find their way with a grid search (js/urban.js). BANK is set far out of reach there,
   so every band rule (bridges, islands, the river as a wall) simply never applies.
   The world is built once at load, so changing the map reloads the page. ?karte=gebirge|insel overrides. */
const MAPS={insel:'Insel',gebirge:'Gebirge',vulkan:'Vulkan',flughafen:'Flughafen',stadt:'Stadt'};
const MAP=(function(){
  const q=/[?&#]karte=(insel|gebirge|vulkan|flughafen|stadt)/i.exec(location.search+location.hash);if(q)return q[1].toLowerCase();
  try{const m=localStorage.getItem('kk-map');if(MAPS[m])return m;}catch(e){}
  return 'insel';
})();
// Christmas edition (xmas.js): every year from 1 November to 10 January; ?weihnachten forces it, ?normal switches it off
function xmasSeason(d){d=d||new Date();const m=d.getMonth(),day=d.getDate();return m===10||m===11||(m===0&&day<=10);}
const XMAS=(function(){
  const q=location.search+location.hash;
  if(/weihnachten/i.test(q))return true;
  if(/\bnormal\b/i.test(q))return false;
  try{if(localStorage.getItem('kk-xmas')==='off')return false;}catch(e){}
  return xmasSeason();
})();
const MOUNTAIN=MAP==='gebirge',VOLCANO=MAP==='vulkan',AIRPORT=MAP==='flughafen',CITY=MAP==='stadt',URBAN=AIRPORT||CITY;
// the city is point-symmetric (bases in opposite corners), all other maps mirror along z
const BASES=CITY?[{x:-34,z:34},{x:34,z:-34}]:AIRPORT?[{x:0,z:38},{x:0,z:-38}]:[{x:0,z:44},{x:0,z:-44}];
const LIM=52;
// BX: the two lanes the waves and defenders think in (bridges on the band maps, streets and gates on the new ones)
const BX=VOLCANO?8:18,BRIDGES=[-BX,BX],BANK=URBAN?-100:VOLCANO?12:6.2,ISL_RX=VOLCANO?15:6.2,ISL_RZ=VOLCANO?7:3.4;
// ZS: how much further from the middle the banks lie than on the island map; shifts everything placed along them
const ZS=URBAN?0:BANK-6.2,CRATER={x:0,z:0,r:3.3},LAVA_END=55.5;

/* ----- Airport and city: buildings and drop zones as plain data (js/urban.js builds and draws them) -----
   box: x0..x1, z0..z1 on the ground, h high. Every box blocks walking, sight and direct shots; only the mortar
   lobs over it. Drop zones: rectangles on open ground, never on a roof. */
const URB={boxes:[],zones:[[],[]],gold:[],routes:null,kind:MAP};
(function(){
  if(!URBAN)return;
  const B=(x0,x1,z0,z1,h,k)=>URB.boxes.push({x0,x1,z0,z1,h,k});
  if(CITY){
    // 3 x 3 blocks of 24 between 8-wide streets, a ring road outside. Top left: base A, top right: park,
    // centre: market place, bottom right: base B, bottom left: two houses with a 6-wide alley between them.
    const C=[[-46,-22],[-14,14],[22,46]];
    const block=(x0,x1,z0,z1)=>{   // a block of several houses of different height, flush, so there are no traps between them
      const nx=x1-x0>20?2:1,nz=z1-z0>20?2:1;
      for(let i=0;i<nx;i++)for(let j=0;j<nz;j++){const a=x0+(x1-x0)*i/nx,b=x0+(x1-x0)*(i+1)/nx,c=z0+(z1-z0)*j/nz,d=z0+(z1-z0)*(j+1)/nz;
        B(a,b,c,d,5+((i*3+j*5+Math.round(x0+z0))%4+4)%4*0.9,'house');}
    };
    block(C[1][0],C[1][1],C[2][0],C[2][1]);   // top middle
    block(C[0][0],C[0][1],C[1][0],C[1][1]);   // middle left
    block(C[2][0],C[2][1],C[1][0],C[1][1]);   // middle right
    block(C[1][0],C[1][1],-C[2][1],-C[2][0]); // bottom middle
    B(-46,-37,-46,-22,6.2,'house');B(-31,-22,-46,-22,7.0,'house');   // the alley x -37..-31
    URB.zones[0]=[{x0:-11,x1:-3,z0:-10,z1:10,w:3},{x0:-21,x1:-15,z0:-12,z1:0,w:2},{x0:-36,x1:-32,z0:-43,z1:-26,w:1.5}];
    URB.zones[1]=[{x0:3,x1:11,z0:-10,z1:10,w:3},{x0:15,x1:21,z0:0,z1:12,w:2},{x0:26,x1:42,z0:26,z1:42,w:1.5}];
    URB.gold=[{x0:-4,x1:4,z0:-4,z1:4,w:1}];
    // patrol routes for team A (team B: mirrored through the centre)
    URB.routes=[[[-18,40],[-18,26],[-18,10]],[[-40,18],[-26,18],[-10,18]],[[-28,28],[-40,40],[-28,40],[-40,28]]];
    URB.defend=[{x:-18,z:12},{x:-12,z:18}];
  }else{
    // Team A (z>0): terminal at the back, the gate building with three jet bridges (5 wide walkways) in front.
    // Team B (z<0): four hangars with three gates of the same width between them. Apron in the middle with two
    // parked planes, the runway behind a fence on the east side, reached over one taxiway.
    B(-32,32,44,52,7,'terminal');
    for(const s of [1,-1]){
      const k=s>0?'gate':'hangar',h=s>0?5:8;
      B(-52,-20.5,s>0?20:-30,s>0?30:-20,h,k);B(-15.5,-2.5,s>0?20:-30,s>0?30:-20,h,k);B(2.5,15.5,s>0?20:-30,s>0?30:-20,h,k);B(20.5,52,s>0?20:-30,s>0?30:-20,h,k);
    }
    B(36,40,-20,-3,1.6,'fence');B(36,40,3,20,1.6,'fence');   // runway fence, the taxiway is the gap
    for(const cx of [-12,12]){   // planes: fuselage along z, wings and tailplane across
      B(cx-1.3,cx+1.3,-8,8,3.2,'plane');B(cx-8,cx+8,-1.8,0.6,1.7,'wing');B(cx-3.2,cx+3.2,5.6,7.2,2.4,'wing');
    }
    B(-48,-42,-4,4,14,'tower');
    URB.zones[0]=[{x0:-9,x1:-3,z0:-12,z1:12,w:2},{x0:-34,x1:-24,z0:-14,z1:14,w:2},{x0:42,x1:50,z0:4,z1:18,w:1}];
    URB.zones[1]=[{x0:3,x1:9,z0:-12,z1:12,w:2},{x0:22,x1:32,z0:-14,z1:14,w:2},{x0:42,x1:50,z0:-18,z1:-4,w:1}];
    URB.gold=[{x0:42,x1:50,z0:-14,z1:14,w:3},{x0:-2,x1:2,z0:-10,z1:10,w:1}];   // valuable crates mostly on the runway
    URB.routes=[[[-18,32],[-18,24],[-24,14]],[[18,32],[18,24],[24,14]],[[-8,34],[8,34],[10,42],[-10,42]]];
  }
})();
// is (x, z) on open ground, at least m away from every building?
function urbanFree(x,z,m){m=m||0;for(const b of URB.boxes)if(x>b.x0-m&&x<b.x1+m&&z>b.z0-m&&z<b.z1+m)return false;return true;}
// push a circle of radius r out of the buildings (the shortest way out)
function urbanPush(u,r){
  for(const b of URB.boxes){
    const cx=clamp(u.x,b.x0,b.x1),cz=clamp(u.z,b.z0,b.z1),dx=u.x-cx,dz=u.z-cz,d=Math.hypot(dx,dz);
    if(d>=r)continue;
    if(d>1e-4){u.x=cx+dx/d*r;u.z=cz+dz/d*r;continue;}
    const l=u.x-b.x0,rr=b.x1-u.x,t=u.z-b.z0,bb=b.z1-u.z,mn=Math.min(l,rr,t,bb);   // inside: out over the nearest side
    if(mn===l)u.x=b.x0-r;else if(mn===rr)u.x=b.x1+r;else if(mn===t)u.z=b.z0-r;else u.z=b.z1+r;
  }
}
// does the straight line a -> b pass through a building (at height y)?
function urbanBlocked(ax,az,bx,bz,y){
  y=y===undefined?1.1:y;const dx=bx-ax,dz=bz-az;
  for(const b of URB.boxes){
    if(b.h<y)continue;
    let t0=0,t1=1;
    for(const [p,d,lo,hi] of [[ax,dx,b.x0,b.x1],[az,dz,b.z0,b.z1]]){
      if(Math.abs(d)<1e-9){if(p<=lo||p>=hi){t0=2;break;}continue;}
      let ta=(lo-p)/d,tb=(hi-p)/d;if(ta>tb){const q=ta;ta=tb;tb=q;}
      t0=Math.max(t0,ta);t1=Math.min(t1,tb);if(t0>=t1)break;
    }
    if(t0<t1)return true;
  }
  return false;
}
// centre of the island a point belongs to: the volcano has a single one, the other maps one under each crossing
const islCx=x=>VOLCANO?0:(x<0?BRIDGES[0]:BRIDGES[1]);
// half width of each crossing: on the mountain the bridge (left) is wide, the pass (right) narrower but still fits tanks
const CW=MOUNTAIN?[3.1,2.4]:VOLCANO?[2.5,2.5]:[2.3,2.3];
const crossW=x=>CW[x<0?0:1];
function islandE(x,z){if(URBAN)return 9;if(VOLCANO)return Math.hypot(x/ISL_RX,z/ISL_RZ);let e=9;for(const bx of BRIDGES)e=Math.min(e,Math.hypot((x-bx)/ISL_RX,z/ISL_RZ));return e;}
function hgtRaw(x,z){
  if(URBAN)return 0.32;   // paved and flat
  if(MOUNTAIN)return hgtMountain(x,z);
  if(VOLCANO)return hgtVolcano(x,z);
  const raw=Math.sin(x*0.11+1.3)*Math.cos(z*0.09)*1.6+Math.sin(x*0.045-z*0.06+0.5)*1.3+Math.cos(z*0.19+x*0.03)*0.45;
  let f=1;for(const b of BASES)f=Math.min(f,smooth((Math.hypot(x-b.x,z-b.z)-11)/8));
  for(const bx of BRIDGES)f=Math.min(f,smooth((Math.hypot(x-bx,z)-7)/5));
  const e=smooth((Math.max(Math.abs(x),Math.abs(z))-54)/6);
  let h=raw*0.6*f*(1-e)-e*3.2;
  const r=smooth((8.6-Math.abs(z))/4);
  h=h*(1-r)-r*2.5;
  // sandy islands in the river under each bridge
  const ie=islandE(x,z),k=smooth((1.3-ie)/0.4);
  h=h*(1-k)+(0.42-1.5*Math.max(0,ie-0.5))*k;
  // the banks rise to deck height where the bridges land, then slope gently back into the meadow
  for(const bx of BRIDGES){const w=smooth((3.4-Math.abs(x-bx))/1.4)*smooth((Math.abs(z)-7.6)/1.0)*smooth((18-Math.abs(z))/6);h=h*(1-w)+0.3*w;}
  return h;
}
function hgtMountain(x,z){
  const raw=Math.sin(x*0.11+1.3)*Math.cos(z*0.09)*1.8+Math.sin(x*0.045-z*0.06+0.5)*1.5+Math.cos(z*0.19+x*0.03)*0.5;
  let f=1;for(const b of BASES)f=Math.min(f,smooth((Math.hypot(x-b.x,z-b.z)-11)/8));
  for(const bx of BRIDGES)f=Math.min(f,smooth((Math.hypot(x-bx,z)-7)/5));
  let h=raw*0.7*f;
  // valleys: the playing field is ringed by high, jagged peaks
  const ring=Math.max(Math.abs(x)*1.02,Math.abs(z)),e=smooth((ring-47)/11);
  h+=e*(13+15*Math.abs(Math.sin(x*0.09+1)*Math.cos(z*0.08+0.4))+6*Math.sin(x*0.21+z*0.17)+3*Math.cos(x*0.37-z*0.29));
  // the chasm: steep walls dropping far below the edge
  const rr=smooth((BANK+0.3-Math.abs(z))/2.2);
  h=h*(1-rr)-rr*(13+1.5*Math.sin(x*0.3));
  // rock massif around the pass on the right; the path and its plateau are cut through it
  const rock=smooth((10.5-Math.abs(x-BRIDGES[1]))/3)*smooth((BANK-0.2-Math.abs(z))/1.2);
  h=h*(1-rock)+(6.5+1.5*Math.sin(z*0.9+x*0.4))*rock;
  const corr=smooth((CW[1]+0.5-Math.abs(x-BRIDGES[1]))/0.6)*smooth((BANK+2-Math.abs(z))/1);
  h=h*(1-corr)+0.38*corr;
  // flat plateaus in the middle of both crossings (crates land here)
  const k=smooth((1.12-islandE(x,z))/0.14);
  h=h*(1-k)+0.42*k;
  // the banks rise to deck height where the crossings land
  for(const bx of BRIDGES){const w=smooth((crossW(bx)+1.1-Math.abs(x-bx))/1.4)*smooth((Math.abs(z)-5.6)/0.8)*smooth((18-Math.abs(z))/6);h=h*(1-w)+0.3*w;}
  return h;
}
function hgtVolcano(x,z){
  const raw=Math.sin(x*0.13+0.7)*Math.cos(z*0.11)*1.5+Math.sin(x*0.05-z*0.07+0.5)*1.2+Math.cos(z*0.23+x*0.04)*0.5;
  let f=1;for(const b of BASES)f=Math.min(f,smooth((Math.hypot(x-b.x,z-b.z)-11)/8));
  for(const bx of BRIDGES)for(const s of [1,-1])f=Math.min(f,smooth((Math.hypot(x-bx,z-s*(BANK+3))-4)/5));
  const e=smooth((Math.max(Math.abs(x),Math.abs(z))-54)/6);
  let h=raw*0.6*f*(1-e)-e*3.2;
  // the lava channel
  const r=smooth((BANK+2.4-Math.abs(z))/4);
  h=h*(1-r)-r*2.5;
  // the volcano island: flat ground around a steep cone with a crater
  const ie=islandE(x,z),k=smooth((1.22-ie)/0.3),d=Math.hypot(x,z);
  const top=0.42+4.4*smooth((3.7-d)/2.0)-2.4*smooth((1.7-d)/1.1)+0.25*smooth((0.8-ie)/0.5)*Math.sin(x*0.9)*Math.cos(z*1.1);
  h=h*(1-k)+(top-1.5*Math.max(0,ie-0.75))*k;
  // the banks rise to deck height where the bridges land
  for(const bx of BRIDGES){const w=smooth((crossW(bx)+1.1-Math.abs(x-bx))/1.4)*smooth((Math.abs(z)-BANK-1.4)/1.0)*smooth((BANK+11.8-Math.abs(z))/6);h=h*(1-w)+0.3*w;}
  return h;
}
function segDist(px,pz,ax,az,bx,bz){const vx=bx-ax,vz=bz-az,t=clamp(((px-ax)*vx+(pz-az)*vz)/(vx*vx+vz*vz),0,1);return Math.hypot(px-ax-vx*t,pz-az-vz*t);}
function pathDist(x,z){if(URBAN)return 1e9;let d=1e9;for(const s of [1,-1]){for(const bx of BRIDGES)d=Math.min(d,segDist(x,z,bx*0.2,s*37,bx,s*(9.5+ZS)));}return d;}
const DROPS=[{x:-BX,sort:'blau'},{x:BX,sort:'gelb'}];
// A landing spot for a crate on drop zone d: off the bridge lane, inside the island; gold on the volcano lands at the crater rim
function dropSpot(d,side,gold){
  if(URBAN)return urbanSpot(gold?URB.gold:URB.zones[d===DROPS[0]?0:1]);
  let x=d.x+(Math.random()<.5?-1:1)*rand(1.8,4.4);
  if(VOLCANO){const o=d.x<0?-1:1;x=gold?o*rand(4.6,5.6):o*Math.max(5.2,Math.abs(x));}
  const zm=ISL_RZ*0.72*Math.sqrt(Math.max(0,1-((x-islCx(x))/ISL_RX)**2));
  return {x,z:side*rand(0.1,1)*(VOLCANO?Math.min(zm,gold?1.6:4.2):zm)};
}
function onDeck(d,c){if(URBAN)return URB.zones[d===DROPS[0]?0:1].some(r=>c.x>r.x0-1&&c.x<r.x1+1&&c.z>r.z0-1&&c.z<r.z1+1);return VOLCANO?onPlatform(c.x,c.z)&&(c.x<0)===(d.x<0):Math.abs(c.x-d.x)<ISL_RX+0.5&&Math.abs(c.z)<ISL_RZ+0.5;}
function onPlatform(x,z){return islandE(x,z)<0.95;}
// a random free spot in one of the zones (weighted), never in or next to a building or a tree
function urbanSpot(zs){
  const tot=zs.reduce((a,r)=>a+r.w,0);
  for(let k=0;k<60;k++){
    let q=Math.random()*tot,r=zs[0];for(const z of zs){q-=z.w;if(q<=0){r=z;break;}}
    const x=rand(r.x0,r.x1),z=rand(r.z0,r.z1);
    if(urbanFree(x,z,1.2)&&!(typeof obstacles!=='undefined'&&obstacles.some(o=>Math.hypot(o.x-x,o.z-z)<o.r+1.2)))return {x,z};
  }
  const r=zs[0];return {x:(r.x0+r.x1)/2,z:(r.z0+r.z1)/2};
}
function onBridge(x,z){if(URBAN)return false;return Math.abs(z)<9.4+ZS&&BRIDGES.some(bx=>Math.abs(x-bx)<crossW(bx));}
function hgt(x,z){
  let h=hgtRaw(x,z);
  if(onBridge(x,z)||onPlatform(x,z))h=Math.max(h,0.38);
  return Math.max(h,-1.3);
}
