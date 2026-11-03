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

const BASES=[{x:0,z:44},{x:0,z:-44}];
const LIM=52;
const BRIDGES=[-18,18],BANK=6.2,ISL_RX=6.2,ISL_RZ=3.4;
function islandE(x,z){let e=9;for(const bx of BRIDGES)e=Math.min(e,Math.hypot((x-bx)/ISL_RX,z/ISL_RZ));return e;}
function hgtRaw(x,z){
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
function segDist(px,pz,ax,az,bx,bz){const vx=bx-ax,vz=bz-az,t=clamp(((px-ax)*vx+(pz-az)*vz)/(vx*vx+vz*vz),0,1);return Math.hypot(px-ax-vx*t,pz-az-vz*t);}
function pathDist(x,z){let d=1e9;for(const s of [1,-1]){for(const bx of BRIDGES)d=Math.min(d,segDist(x,z,bx*0.2,s*37,bx,s*9.5));}return d;}
const DROPS=[{x:-18,sort:'blau'},{x:18,sort:'gelb'}];
function onPlatform(x,z){return islandE(x,z)<0.95;}
function onBridge(x,z){return Math.abs(z)<9.4&&BRIDGES.some(bx=>Math.abs(x-bx)<2.3);}
function hgt(x,z){
  let h=hgtRaw(x,z);
  if(onBridge(x,z)||onPlatform(x,z))h=Math.max(h,0.38);
  return Math.max(h,-1.3);
}
