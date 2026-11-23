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
   'mond' too: domes, craters, boulders and a covered tube round the side; low gravity (GRAV).
   'wueste' works like them: a pyramid with a cross-shaped passage in the middle, ruins, dunes and two oases.
   'dschungel' too: a stepped temple on an island in the middle, a river round it and across the map (water blocks
   walking, not shots), two stone footbridges and two rope bridges, dense forest with trails and clearings.
   'weihnachtsmarkt' too, but only while the Christmas edition runs: the market square with the big tree in the
   middle, stalls in two rings, gingerbread houses at the bases; Ferris wheel and carousel stand outside the fence.
   The world is built once at load, so changing the map reloads the page. ?karte=gebirge|insel overrides. */
const MAPS={insel:'Insel',gebirge:'Gebirge',vulkan:'Vulkan',flughafen:'Flughafen',stadt:'Stadt',wueste:'Wüste',mond:'Mond',dschungel:'Dschungel',weihnachtsmarkt:'Weihnachtsmarkt'};
// Christmas edition (xmas.js): every year from 1 November to 10 January; ?weihnachten forces it, ?normal switches it off
function xmasSeason(d){d=d||new Date();const m=d.getMonth(),day=d.getDate();return m===10||m===11||(m===0&&day<=10);}
function xmasOn(){
  const q=location.search+location.hash;
  if(/weihnachten/i.test(q))return true;
  if(/\bnormal\b/i.test(q))return false;
  try{if(localStorage.getItem('kk-xmas')==='off')return false;}catch(e){}
  return xmasSeason();
}
const MAP=(function(){
  let m='insel';
  const q=/[?&#]karte=(insel|gebirge|vulkan|flughafen|stadt|wueste|mond|dschungel|weihnachtsmarkt)/i.exec(location.search+location.hash);
  if(q)m=q[1].toLowerCase();else try{const k=localStorage.getItem('kk-map');if(MAPS[k])m=k;}catch(e){}
  // the Christmas market is only open in the Christmas edition. Outside it, the map still loads for a saved round on
  // it (that round is played to the end, with a hint) and when joining a host who plays on it; otherwise the island.
  if(m==='weihnachtsmarkt'&&!xmasOn()){
    let keep=false;
    try{const sv=JSON.parse(localStorage.getItem('kk-save')||'null');keep=!!(sv&&sv.map==='weihnachtsmarkt')||!!sessionStorage.getItem('kk-rejoin');}catch(e){}
    if(!keep)m='insel';
  }
  return m;
})();
const MARKET=MAP==='weihnachtsmarkt',MARKET_OFF=MARKET&&!xmasOn();   // MARKET_OFF: on the market outside the season
const XMAS=MARKET||xmasOn();   // the market always wears its Christmas look
const MOUNTAIN=MAP==='gebirge',VOLCANO=MAP==='vulkan',AIRPORT=MAP==='flughafen',CITY=MAP==='stadt',DESERT=MAP==='wueste',MOON=MAP==='mond',JUNGLE=MAP==='dschungel',URBAN=AIRPORT||CITY||DESERT||MOON||JUNGLE||MARKET;
// gravity relative to the other maps: on the moon crates float down, dust hangs in the air, shells fly in flat arcs
const GRAV=MOON?0.3:1;
// winter in the Christmas edition: snow on the ground and snow as weather (not on the volcano, in the desert, on the moon, in the jungle)
const XSNOW=XMAS&&!VOLCANO&&!DESERT&&!MOON&&!JUNGLE;
// the city is point-symmetric (bases in opposite corners), all other maps mirror along z
const BASES=CITY?[{x:-34,z:34},{x:34,z:-34}]:AIRPORT||DESERT||MOON||JUNGLE||MARKET?[{x:0,z:38},{x:0,z:-38}]:[{x:0,z:44},{x:0,z:-44}];
const LIM=52;
// BX: the two lanes the waves and defenders think in (bridges on the band maps, streets and gates on the new ones)
const BX=VOLCANO?8:JUNGLE?30:MARKET?24:18,BRIDGES=[-BX,BX],BANK=URBAN?-100:VOLCANO?12:6.2,ISL_RX=VOLCANO?15:6.2,ISL_RZ=VOLCANO?7:3.4;
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
  }else if(AIRPORT){
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
  }else if(MOON){
    // Moon. Dome base A (z>0) and dome base B (z<0); the big crater in the middle, two smaller craters on the west
    // side, boulders on the east side, and beyond them a covered tube from one base round the east edge to the other:
    // safe from direct fire inside, but a long way round. Everything mirrored along z.
    const S=(x0,x1,z0,z1,h,k)=>B(Math.min(x0,x1),Math.max(x0,x1),Math.min(z0,z1),Math.max(z0,z1),h,k);
    // the tube: inside 4.4 wide. Long part along x = 42..46.4, a spur at each end towards the base (inside z 34..38.4)
    S(46.4,47.6,-39.6,39.6,3,'tube');S(40.8,42,-32.8,32.8,3,'tube');
    for(const s of [1,-1]){S(16,47.6,s*38.4,s*39.6,3,'tube');S(16,42,s*32.8,s*34,3,'tube');
      S(20.3,23.7,s*17.3,s*20.7,2.6,'boulder');S(24.6,26.4,s*12.6,s*14.4,1.6,'boulder');}
    URB.tube=[{x0:40.8,x1:47.6,z0:-39.6,z1:39.6},{x0:16,x1:47.6,z0:32.8,z1:39.6},{x0:16,x1:47.6,z0:-39.6,z1:-32.8}];
    URB.craters=[{x:0,z:0,r:11,d:1.5},{x:-30,z:16,r:6,d:1.1},{x:-30,z:-16,r:6,d:1.1}];
    URB.domes=[];for(const s of [1,-1])URB.domes.push({x:-16,z:s*45,r:5.5,main:true},{x:-27,z:s*37,r:3.2});
    const sq=(x,z,r,w)=>({x0:x-r,x1:x+r,z0:z-r,z1:z+r,w});
    // blue on the west side (small craters), yellow on the east side (boulders), both on both halves of the field,
    // so each colour is as close to one base as to the other; the spots between base and crater are shared
    URB.zones[0]=[{x0:-1.6,x1:-0.2,z0:18.5,z1:21.5,w:1},{x0:-1.6,x1:-0.2,z0:-21.5,z1:-18.5,w:1},sq(-30,16,2,1.5),sq(-30,-16,2,1.5)];
    URB.zones[1]=[{x0:0.2,x1:1.6,z0:18.5,z1:21.5,w:1},{x0:0.2,x1:1.6,z0:-21.5,z1:-18.5,w:1},sq(17.5,23.5,1.3,1.5),sq(17.5,-23.5,1.3,1.5)];
    URB.gold=[sq(0,0,3,1)];   // the big crater: the hotspot
    URB.routes=[[[-14,26],[-24,20],[-30,10]],[[14,28],[24,27],[44,22],[44,6]],[[-8,32],[8,32],[6,46],[-4,47]]];
  }else if(MARKET){
    // Christmas market. Base A (z>0) and base B (z<0), a gingerbread house beside each. In the middle the market
    // square with the big tree; crates land in a ring round it. Stalls stand in two rings: four round the square
    // (gaps on the axes), four rows outside them that make alleys on the west and east side. Mirrored along x and z.
    B(-2.6,2.6,-2.6,2.6,11,'tree');
    const S=(x,z,w,d,k)=>B(x-w/2,x+w/2,z-d/2,z+d/2,k==='ginger'?6:3.2,k||'stall');
    URB.stalls=[];
    for(const sx of [-1,1])for(const sz of [-1,1]){
      // each stall: centre, size, which way the counter faces
      URB.stalls.push({x:sx*18,z:sz*9,w:5,d:7,face:[-sx,0]},{x:sx*9,z:sz*19,w:7,d:5,face:[0,-sz]},
        {x:sx*30,z:sz*20,w:12,d:4,face:[0,sz]},{x:sx*30,z:sz*30,w:12,d:4,face:[0,-sz]});
    }
    URB.stalls.forEach((t,i)=>{t.kind=['gluehwein','wurst','lebkuchen','mandeln','crepes','handwerk','deko'][i%7];S(t.x,t.z,t.w,t.d);});
    for(const sz of [1,-1])S(-17,sz*41,7,7,'ginger');
    const sq=(x,z,r,w)=>({x0:x-r,x1:x+r,z0:z-r,z1:z+r,w});
    // blue on the west side, yellow on the east side: half of the ring round the tree, the alley, between the rows
    URB.zones[0]=[{x0:-9,x1:-4,z0:-6,z1:6,w:3},sq(-24,0,1.8,1),sq(-30,25,1.8,1),sq(-30,-25,1.8,1)];
    URB.zones[1]=[{x0:4,x1:9,z0:-6,z1:6,w:3},sq(24,0,1.8,1),sq(30,25,1.8,1),sq(30,-25,1.8,1)];
    URB.gold=[{x0:-2,x1:2,z0:4.5,z1:7.5,w:1},{x0:-2,x1:2,z0:-7.5,z1:-4.5,w:1}];   // in front of and behind the tree
    URB.routes=[[[-18,26],[-24,12],[-10,13]],[[18,26],[24,12],[10,13]],[[-8,32],[8,32],[10,44],[-10,44]]];
  }else if(JUNGLE){
    // Jungle. Base A (z>0) and base B (z<0); in the middle a stepped temple (four blocks, a cross-shaped passage
    // 6 wide between them, like the pyramid) on an island. The river runs from west to east and splits round the island. Crossings: a stone
    // footbridge onto the island from each base, a rope bridge on each side (x = -30 and +30). Ruins and stone heads
    // in four clearings; dense forest everywhere else, with trails for vehicles. Mirrored along x and z, the river
    // itself point-symmetric. Water blocks walking (low boxes, h = 0), but not sight and shots.
    const J=URB.jungle={th:9,pw:3,th_h:8,R:20,rw:2.2,sw:3};
    const S=(x0,x1,z0,z1,h,k)=>B(Math.min(x0,x1),Math.max(x0,x1),Math.min(z0,z1),Math.max(z0,z1),h,k);
    for(const sx of [-1,1])for(const sz of [-1,1])S(sx*J.pw,sx*J.th,sz*J.pw,sz*J.th,J.th_h,'temple');
    for(const sx of [1,-1])for(const sz of [1,-1]){
      S(sx*3.1,sx*4.1,sz*10.6,sz*11.6,3.4,'col');                   // columns at the passage mouths
      S(sx*39.4,sx*40.6,sz*18.5,sz*26.5,2.4,'wall');S(sx*41,sx*45,sz*27.6,sz*28.6,1.8,'wall');   // ruin by each clearing
      S(sx*26.6,sx*29.4,sz*29.6,sz*32.4,3.4,'head');                // a stone head looking at the clearing
      S(sx*36,sx*41,sz*31.6,sz*32.8,1.2,'fallen');                  // a fallen statue
    }
    // the bridges: footbridges over the ring north and south, rope bridges over the stream
    const rz=x=>-2.5*Math.sin(x*0.07);
    URB.bridges=[{x0:-2.6,x1:2.6,z0:16.4,z1:23.4,k:'steg'},{x0:-2.6,x1:2.6,z0:-23.4,z1:-16.4,k:'steg'}];
    for(const sx of [-1,1]){const c=rz(sx*30);URB.bridges.push({x0:sx*30-2.6,x1:sx*30+2.6,z0:c-4.6,z1:c+4.6,k:'rope'});}
    J.rz=rz;
    // the river as low boxes: 1 m cells, merged into runs along x
    for(let z=-60.5;z<60.5;z+=1){let a=null;
      for(let x=-60.5;x<=60.5;x+=1){const w=x<60.5&&riverDepth(x+0.5,z+0.5)>0.3&&!onJBridge(x+0.5,z+0.5);
        if(w&&a===null)a=x;else if(!w&&a!==null){B(a,x,z,z+1,0,'water');a=null;}}}
    const sq=(x,z,r,w)=>({x0:x-r,x1:x+r,z0:z-r,z1:z+r,w});
    // blue on the west side, yellow on the east side, each on both halves: the clearing and the rope bridge head
    URB.zones[0]=[sq(-34,23,2.4,1.5),sq(-34,-23,2.4,1.5),sq(-30,11,1.8,1),sq(-30,-11,1.8,1)];
    URB.zones[1]=[sq(34,23,2.4,1.5),sq(34,-23,2.4,1.5),sq(30,11,1.8,1),sq(30,-11,1.8,1)];
    URB.gold=[{x0:10.6,x1:13.4,z0:-3,z1:3,w:1},{x0:-13.4,x1:-10.6,z0:-3,z1:3,w:1}];   // beside the temple, on the island
    URB.routes=[[[-30,14],[-34,22],[-20,28]],[[30,14],[34,22],[20,28]],[[-8,32],[8,32],[10,44],[-10,44]]];
    // trails through the forest (team A; B mirrored along z): to the footbridge, to both rope bridges, into the clearings
    URB.trails=[];
    for(const sz of [1,-1]){
      URB.trails.push([[0,sz*40],[0,sz*14]]);
      for(const sx of [1,-1]){const c=rz(sx*30),end=sz>0?c+4.6:c-4.6;
        URB.trails.push([[sx*6,sz*36],[sx*18,sz*28],[sx*30,sz*16],[sx*30,end]],[[sx*30,sz*16],[sx*34,sz*23],[sx*44,sz*30]]);}}
    URB.clear=[];for(const sx of [1,-1])for(const sz of [1,-1])URB.clear.push({x:sx*34,z:sz*24,r:7.5},{x:sx*30,z:sz*11,r:5.5});
    for(const sz of [1,-1])URB.clear.push({x:0,z:sz*27,r:7});
  }else{
    // Desert. Oasis A (z>0) and oasis B (z<0) face each other across a pyramid (28 x 28, apex in the middle) that
    // a cross-shaped passage, 6 wide, cuts into four blocks: a sheltered short cut, wide enough for vehicles too.
    // Ruins left and right (x = -40 and +40, point-symmetric), four low dunes with a few rocks for cover.
    const P=URB.pyr={r:14,w:3,h:13};
    for(const sx of [-1,1])for(const sz of [-1,1]){const a=sx*P.w,b=sx*P.r,c=sz*P.w,d=sz*P.r;B(Math.min(a,b),Math.max(a,b),Math.min(c,d),Math.max(c,d),10,'pyr');}
    // ruins: wall remnants, standing columns, a fallen column; mirrored through the centre (S sorts the corners)
    const S=(x0,x1,z0,z1,h,k)=>B(Math.min(x0,x1),Math.max(x0,x1),Math.min(z0,z1),Math.max(z0,z1),h,k);
    for(const s of [1,-1]){
      S(s*37,s*38,s*-9,s*-3,2.4,'wall');S(s*41,s*46,s*3,s*4,1.9,'wall');
      S(s*34.8,s*36,s*4.8,s*6,4.6,'col');S(s*34.8,s*36,s*9.4,s*10.6,4.6,'col');S(s*44.9,s*46.1,s*-8.6,s*-7.4,3.2,'col');
      S(s*42.4,s*43.6,s*-7,s*-2,1.2,'fallen');
    }
    for(const s of [1,-1])for(const x of [-6,6])B(x-0.7,x+0.7,s*17.5-0.7,s*17.5+0.7,7.5,'obelisk');   // two obelisks before each oasis-side entrance
    URB.dunes=[];
    for(const sx of [-1,1])for(const sz of [-1,1]){const x=sx*30,z=sz*25;URB.dunes.push({x,z});
      B(x-1.6,x+1.6,z-sz*3.6-0.6,z-sz*3.6+0.6,1.4,'rock');   // towards the middle line
      B(x-sx*4.6-0.6,x-sx*4.6+0.6,z-1.2,z+1.2,1.4,'rock');}   // towards the pyramid
    const sq=(x,z,r,w)=>({x0:x-r,x1:x+r,z0:z-r,z1:z+r,w});
    // blue on the west side, yellow on the east side, each on both halves (as on the other maps): the two dunes of its
    // side and its half of both entrances
    URB.zones[0]=[{x0:-2.5,x1:-0.3,z0:17,z1:21,w:1},{x0:-2.5,x1:-0.3,z0:-21,z1:-17,w:1},sq(-30,25,1.3,1),sq(-30,-25,1.3,1)];
    URB.zones[1]=[{x0:0.3,x1:2.5,z0:17,z1:21,w:1},{x0:0.3,x1:2.5,z0:-21,z1:-17,w:1},sq(30,25,1.3,1),sq(30,-25,1.3,1)];
    URB.gold=[{x0:-32,x1:-28,z0:-3,z1:3,w:1},{x0:28,x1:32,z0:-3,z1:3,w:1}];   // in front of the ruins, as far from one oasis as from the other
    URB.routes=[[[-14,30],[-22,18],[-30,8]],[[14,30],[22,18],[30,8]],[[-8,32],[8,32],[10,44],[-10,44]]];
    URB.ponds=[];for(const s of [1,-1])URB.ponds.push({x:13,z:s*45,r:4.2},{x:-15,z:s*44,r:3.2});   // oasis ponds behind each base
    URB.cover=[{x:-30,z:19},{x:30,z:19},{x:-7,z:17},{x:7,z:17},{x:-33,z:7},{x:33,z:7}];   // behind rocks, the pyramid and the ruins (team A; B mirrored)
  }
})();
// is (x, z) on open ground, at least m away from every building?
// inside the pyramid's footprint (passages included): crates never land or drift there
// inside the moon tube or its walls
function inTube(x,z,m){m=m||0;return MOON&&URB.tube.some(r=>x>r.x0-m&&x<r.x1+m&&z>r.z0-m&&z<r.z1+m);}
// jungle river: how far inside the water a point lies (> 0 in the water, in metres from the bank)
function riverDepth(x,z){
  if(!JUNGLE)return -9;const J=URB.jungle;
  let d=J.rw-Math.abs(Math.hypot(x,z)-J.R);
  if(Math.abs(x)>=J.R-1)d=Math.max(d,J.sw-Math.abs(z-J.rz(x)));
  return d;
}
function onJBridge(x,z,m){m=m||0;return JUNGLE&&URB.bridges.some(b=>x>b.x0-m&&x<b.x1+m&&z>b.z0-m&&z<b.z1+m);}
function inPyramid(x,z,m){return DESERT&&Math.abs(x)<URB.pyr.r+(m||0)&&Math.abs(z)<URB.pyr.r+(m||0);}
function urbanFree(x,z,m,minH){m=m||0;for(const b of URB.boxes)if((!minH||b.h>=minH)&&x>b.x0-m&&x<b.x1+m&&z>b.z0-m&&z<b.z1+m)return false;return true;}
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
  if(DESERT)return hgtDesert(x,z);
  if(MOON)return hgtMoon(x,z);
  if(JUNGLE)return hgtJungle(x,z);
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
// sand: gentle ripples, four low dunes; flat at the oases, under the pyramid and the ruins
function hgtDesert(x,z){
  let h=0.32+0.14*Math.sin(x*0.21+z*0.07)*Math.cos(z*0.17-x*0.05);
  for(const b of BASES)h=0.32+(h-0.32)*smooth((Math.hypot(x-b.x,z-b.z)-9)/6);
  if(Math.abs(x)<17&&Math.abs(z)<17)h=0.32+(h-0.32)*smooth((Math.max(Math.abs(x),Math.abs(z))-14.5)/2.5);
  for(const d of URB.dunes){const e=Math.hypot((x-d.x)/7.5,(z-d.z)/5);h+=1.5*smooth((1-e)/0.75);}
  const e=smooth((Math.max(Math.abs(x),Math.abs(z))-55)/8);
  return h+e*(1.6+1.2*Math.sin(x*0.13)*Math.cos(z*0.11));
}
// moon: dusty plain with the three craters (bowl, raised rim), many small ones for the look; flat at the bases,
// under the tube and round the boulders
function hgtMoon(x,z){
  const bowl=(d,r,dep)=>{const t=d/r;return t<1?-dep*(1-t*t)+dep*0.75*smooth((t-0.55)/0.45):dep*0.75*(1-smooth((t-1)/0.45));};
  let h=0.32+0.08*Math.sin(x*0.31+z*0.17)*Math.cos(z*0.23-x*0.11);
  for(const c of LITTLE)h+=bowl(Math.hypot(x-c[0],z-c[1]),c[2],c[2]*0.12);
  let f=1;for(const b of BASES)f=Math.min(f,smooth((Math.hypot(x-b.x,z-b.z)-10)/6));
  for(const r of URB.tube)f=Math.min(f,smooth((Math.max(r.x0-x,x-r.x1,r.z0-z,z-r.z1))/3));
  for(const s of [1,-1])f=Math.min(f,smooth((Math.hypot(x-22,z-s*18)-4)/3),smooth((Math.hypot(x+16,z-s*45)-6)/3),smooth((Math.hypot(x+27,z-s*37)-3.5)/3));
  h=0.32+(h-0.32)*f;
  for(const c of URB.craters)h+=bowl(Math.hypot(x-c.x,z-c.z),c.r,c.d);
  const e=smooth((Math.max(Math.abs(x),Math.abs(z))-56)/10);
  return h+e*(1.5+1.5*Math.sin(x*0.09)*Math.cos(z*0.07));
}
// jungle: soft, uneven forest floor; flat at the bases, on the island and on the trails near the bridges; the river
// cut deep into it with sloping banks; hills beyond the edge of the field
function hgtJungle(x,z){
  let h=0.34+0.28*Math.sin(x*0.17+z*0.05)*Math.cos(z*0.13-x*0.07)+0.12*Math.sin(x*0.41-z*0.37);
  let f=1;for(const b of BASES)f=Math.min(f,smooth((Math.hypot(x-b.x,z-b.z)-11)/6));
  f=Math.min(f,smooth((Math.hypot(x,z)-15)/2));
  for(const b of URB.bridges)f=Math.min(f,smooth((Math.max(b.x0-x,x-b.x1,b.z0-z,z-b.z1)-1)/4));
  h=0.34+(h-0.34)*f;
  const e=smooth((Math.max(Math.abs(x),Math.abs(z))-55)/9);
  h+=e*(2.5+2*Math.sin(x*0.11)*Math.cos(z*0.09));
  // the banks slope down to just above the water; at the bridges they stay at deck height
  const r=riverDepth(x,z);
  if(r>-3-e*3){let nb=0;for(const b of URB.bridges)nb=Math.max(nb,1-smooth((Math.max(b.x0-x,x-b.x1,b.z0-z,z-b.z1)-0.3)/2.6));
    const k1=smooth((r+3+e*3)/(2.8+e*3));h=h*(1-k1)+(-1.15+1.55*nb)*k1;
    const k2=smooth((r+0.2)/1.4);h=h*(1-k2)-2.6*k2;}
  return h;
}
// small craters only for the look (x, z, radius), kept off the lanes and the drop zones
const LITTLE=[[-12,12,2.2],[12,-10,1.8],[-40,30,3],[-44,-4,2.6],[30,4,2.4],[-18,-26,2],[10,14,1.6],[-6,-14,1.5],[34,-24,2.2],[-38,-30,2.8],[28,30,1.8],[-22,4,1.7],[6,28,1.4],[-48,18,2.4],[50,48,3],[-50,-48,3]];
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
function pathDist(x,z){if(JUNGLE){let d=1e9;for(const t of URB.trails)for(let i=0;i<t.length-1;i++)d=Math.min(d,segDist(x,z,t[i][0],t[i][1],t[i+1][0],t[i+1][1]));return d;}if(URBAN)return 1e9;let d=1e9;for(const s of [1,-1]){for(const bx of BRIDGES)d=Math.min(d,segDist(x,z,bx*0.2,s*37,bx,s*(9.5+ZS)));}return d;}
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
    if(urbanFree(x,z,1.2)&&!inPyramid(x,z,1)&&!inTube(x,z,1.5)&&!(typeof obstacles!=='undefined'&&obstacles.some(o=>Math.hypot(o.x-x,o.z-z)<o.r+1.2)))return {x,z};
  }
  const r=zs[0];return {x:(r.x0+r.x1)/2,z:(r.z0+r.z1)/2};
}
function onBridge(x,z){if(URBAN)return false;return Math.abs(z)<9.4+ZS&&BRIDGES.some(bx=>Math.abs(x-bx)<crossW(bx));}
function hgt(x,z){
  let h=hgtRaw(x,z);
  if(JUNGLE&&onJBridge(x,z))h=Math.max(h,0.42);
  if(onBridge(x,z)||onPlatform(x,z))h=Math.max(h,0.38);
  return Math.max(h,-1.3);
}
