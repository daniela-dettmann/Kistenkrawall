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
   The world is built once at load, so changing the map reloads the page. ?karte=gebirge|insel overrides. */
const MAPS={insel:'Insel',gebirge:'Gebirge',vulkan:'Vulkan'};
const MAP=(function(){
  const q=/[?&#]karte=(insel|gebirge|vulkan)/i.exec(location.search+location.hash);if(q)return q[1].toLowerCase();
  try{const m=localStorage.getItem('kk-map');if(MAPS[m])return m;}catch(e){}
  return 'insel';
})();
const MOUNTAIN=MAP==='gebirge',VOLCANO=MAP==='vulkan';
const BASES=[{x:0,z:44},{x:0,z:-44}];
const LIM=52;
const BX=VOLCANO?8:18,BRIDGES=[-BX,BX],BANK=VOLCANO?12:6.2,ISL_RX=VOLCANO?15:6.2,ISL_RZ=VOLCANO?7:3.4;
// ZS: how much further from the middle the banks lie than on the island map; shifts everything placed along them
const ZS=BANK-6.2,CRATER={x:0,z:0,r:3.3};
// centre of the island a point belongs to: the volcano has a single one, the other maps one under each crossing
const islCx=x=>VOLCANO?0:(x<0?BRIDGES[0]:BRIDGES[1]);
// half width of each crossing: on the mountain the bridge (left) is wide, the pass (right) narrower but still fits tanks
const CW=MOUNTAIN?[3.1,2.4]:VOLCANO?[2.5,2.5]:[2.3,2.3];
const crossW=x=>CW[x<0?0:1];
function islandE(x,z){if(VOLCANO)return Math.hypot(x/ISL_RX,z/ISL_RZ);let e=9;for(const bx of BRIDGES)e=Math.min(e,Math.hypot((x-bx)/ISL_RX,z/ISL_RZ));return e;}
function hgtRaw(x,z){
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
function pathDist(x,z){let d=1e9;for(const s of [1,-1]){for(const bx of BRIDGES)d=Math.min(d,segDist(x,z,bx*0.2,s*37,bx,s*(9.5+ZS)));}return d;}
const DROPS=[{x:-BX,sort:'blau'},{x:BX,sort:'gelb'}];
// A landing spot for a crate on drop zone d: off the bridge lane, inside the island; gold on the volcano lands at the crater rim
function dropSpot(d,side,gold){
  let x=d.x+(Math.random()<.5?-1:1)*rand(1.8,4.4);
  if(VOLCANO){const o=d.x<0?-1:1;x=gold?o*rand(4.6,5.6):o*Math.max(5.2,Math.abs(x));}
  const zm=ISL_RZ*0.72*Math.sqrt(Math.max(0,1-((x-islCx(x))/ISL_RX)**2));
  return {x,z:side*rand(0.1,1)*(VOLCANO?Math.min(zm,gold?1.6:4.2):zm)};
}
function onDeck(d,c){return VOLCANO?onPlatform(c.x,c.z)&&(c.x<0)===(d.x<0):Math.abs(c.x-d.x)<ISL_RX+0.5&&Math.abs(c.z)<ISL_RZ+0.5;}
function onPlatform(x,z){return islandE(x,z)<0.95;}
function onBridge(x,z){return Math.abs(z)<9.4+ZS&&BRIDGES.some(bx=>Math.abs(x-bx)<crossW(bx));}
function hgt(x,z){
  let h=hgtRaw(x,z);
  if(onBridge(x,z)||onPlatform(x,z))h=Math.max(h,0.38);
  return Math.max(h,-1.3);
}
