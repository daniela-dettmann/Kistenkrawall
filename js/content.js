/* Kistenkrawall: Spielinhalte (Waffen, Kistenbelohnungen, Schwierigkeit) und Spielzustand */
'use strict';
/* ---------- Content ---------- */
const WEAPONS={
  knipser:{name:'Knipser',dmg:10,cd:.42,speed:26,ammo:Infinity,pellets:1,spread:.03,range:19},
  spritzer:{name:'Spritzer',dmg:8,cd:.13,speed:30,ammo:70,pellets:1,spread:.08,range:19},
  streuer:{name:'Streuer',dmg:7,cd:.75,speed:24,ammo:14,pellets:7,spread:.24,range:11},
  krachrohr:{name:'Krachrohr',dmg:65,cd:1.15,speed:16,ammo:8,pellets:1,spread:.01,range:24,rocket:true,splash:3.3}
};
WEAPONS.kanone={name:'Kanone',dmg:85,cd:1.5,speed:20,ammo:Infinity,pellets:1,spread:.015,range:26,rocket:true,splash:4};
WEAPONS.mg={name:'MG',dmg:6,cd:.11,speed:32,ammo:Infinity,pellets:1,spread:.07,range:20};
WEAPONS.moerser={name:'Mörser',dmg:70,cd:2.4,speed:15,ammo:Infinity,pellets:1,spread:.02,range:36,minRange:6,arc:true,splash:3.6};
WEAPONS.turm={name:'Geschütz',dmg:10,cd:.45,speed:30,ammo:Infinity,pellets:1,spread:.03,range:17};
/* Two crate sorts: blue = combat line, yellow = workshop line. The sort that dominates the stack decides. */
const REWARDS={
  blau:[null,'spritzer','streuer','krachrohr','rekrut','rekrut_spritzer','luftschlag','doppel','panzer'],
  gelb:[null,'munition','reparatur','tempo','turm','buggy','schild','doppelturm','moerser']
};
function rewardFor(n,sort){return n>=1?REWARDS[sort||'blau'][Math.min(8,n)]:null;}
function stackSort(pad){
  let b=0,y=0,last='blau';
  for(const c of pad.stack){if(c.sort==='blau'){b++;last='blau';}else if(c.sort==='gelb'){y++;last='gelb';}}
  return b>y?'blau':y>b?'gelb':last;
}
const REWARD_LABEL={rekrut_spritzer:'Blechling+Spritzer',doppel:'2 Blechlinge',munition:'Munition',reparatur:'Reparatur',tempo:'Tempo',turm:'Geschützturm',buggy:'Buggy',schild:'Schutzschild',doppelturm:'2 Geschütztürme',moerser:'Mörser',panzer:'Panzer',luftschlag:'Luftschlag',rekrut:'Blechling',krachrohr:'Krachrohr',streuer:'Streuer',spritzer:'Spritzer'};
const NAMES=['Bolzen','Kurbel','Mutter','Flansch','Ritzel','Zahnrad','Spule','Niete','Dübel','Ventil','Lötzinn','Kolben','Schräubchen','Feder','Kabel','Sicherung'];
const LINES={
  pick:['Hab sie!','Schwer, aber meins.','Kiste ist Kiste.','Nicht schubsen!','Was da wohl drin ist?'],
  stack:['Stapel wächst!','Ordentlich gestapelt.','Noch eine fürs Türmchen.','Schön gerade, bitte.'],
  open:['Ooh, glänzt!','Endlich was Richtiges!','Jetzt wird es laut.','Auspacken ist das Beste.'],
  recruit:['Frisch aus der Kiste!','Wo bin ich? Egal, los!','Bin noch eingeschweißt.'],
  hit:['Au, mein Lack!','Das gibt Beulen!','Rost an Bord!','Mein Antennchen!','He, ich bin frisch poliert!'],
  kill:['Ab zum Schrottplatz!','Recyclinghof für dich!','Tschüss, Blechdose!','Das war Altmetall.'],
  steal:['Eure Kiste? Jetzt meine.','Nur geliehen. Für immer.','Danke fürs Stapeln!'],
  empty:['Leer! Zurück zum Knipser.','Klick. Klick. Mist.'],
  idle:['Riecht nach Öl hier.','Wer hat die Kisten bestellt?','Meine Gelenke quietschen.','Ich hör da was ticken.']
};
const DIFFS={
  // jitter = aim spread (rad), turn = swing speed (rad/s), react = delay before the first shot on a new target (s), strafe = sidestepping in a fight
  // waveLen = length of an attack wave (s); waveMax/waveGrow/waveCap = attackers in wave 1, growth per wave, upper limit
  // pincer = split over both bridges (pinning group + flankers), sync = both groups strike at once, hunter = one bot hunts your vehicle
  // flankWeak = flankers pick the weaker defended bridge, smart = weigh targets by value, focus = concentrate fire, hesitate = dithering (easy)
  // repush = new push inside the same wave if at least this many seconds are left, hold = how long the pinning group holds the bridgehead
  leicht:{waveLen:120,waveMax:2,waveGrow:.5,waveCap:4,pincer:false,roles:false,sync:false,hunter:false,flankWeak:false,smart:.15,focus:false,hesitate:.35,retreatAt:.45,gatherT:30,repush:0,hold:0,strafe:.35,spread:2.4,warn:true,speed:.85,jitter:.34,turn:2.0,react:1.0,cdMul:1.9,collect:.65,steal:false,units:3,aggro:11,targets:[1,2,3,4]},
  normal:{waveLen:150,waveMax:3,waveGrow:.5,waveCap:6,pincer:true,roles:true,sync:false,hunter:false,flankWeak:true,smart:.6,focus:false,hesitate:0,retreatAt:.3,gatherT:22,repush:60,hold:32,strafe:.7,spread:3,warn:true,speed:.95,jitter:.2,turn:3.2,react:.55,cdMul:1.4,collect:.5,steal:false,units:3,aggro:14,targets:[2,3,4,4,6]},
  schwer:{waveLen:180,waveMax:4,waveGrow:1,waveCap:9,pincer:true,roles:true,sync:true,hunter:true,flankWeak:true,smart:1,focus:true,hesitate:0,retreatAt:.22,gatherT:18,repush:35,hold:40,strafe:.95,spread:3.4,warn:false,speed:1.05,jitter:.09,turn:5.5,react:.25,cdMul:1.05,collect:.4,steal:true,units:4,aggro:17,targets:[4,6,8,8]}
};
const ALLY={speed:1,jitter:.12,turn:4.5,react:.4,cdMul:1.2,collect:.5,steal:false,aggro:14,targets:[1,2,3,4,6,8],smart:.8,focus:true,retreatAt:.3,strafe:.7,spread:3};

/* ---------- State ---------- */
let units=[],crates=[],shots=[],parts=[];
let player=null,state='menu',diffKey='normal',D=DIFFS.normal;
/* Multiplayer: MP is null (single player), 'host' or 'guest'. On the host, player is the host's own Blechling
   (Orange) and player2 the guest's (Petrol). On the guest, player is the guest's own Blechling. */
let MP=null,player2=null;
const pilotOf=t=>t===0?player:(MP==='host'?player2:null);
// In single player Petrol is the opponent with its own difficulty; in multiplayer both teams play like your mates.
const aiParams=t=>(MP||t===0)?ALLY:D;
try{const s=localStorage.getItem('kk-diff');if(s&&DIFFS[s])diffKey=s;}catch(e){}
D=DIFFS[diffKey];
let gameT=0,spawnT=3,nextId=1,usedNames=new Set();
let peaceMin=6,peaceT=0,waveT=0,waveNo=0,queuedStrikes=[],spawnSide=1,peaceWarnT=0;
try{const p=+localStorage.getItem('kk-rest');if([5,6,7].includes(p))peaceMin=p;}catch(e){}
const inPeace=()=>peaceT>0&&state!=='menu';
const teams=[{openTarget:4},{openTarget:4,wave:{phase:'idle',t:0,groups:[]}}];
let respawns=[];
const stats={kills:0,stacked:0,stolen:0,opened:0};
let camYaw=Math.PI,camManualT=0,camMode='schulter';
try{const m=localStorage.getItem('kk-cam');if(m==='taktik'||m==='schulter')camMode=m;}catch(e){}
let TAC_YAW=Math.PI;   // tactical camera looks toward the enemy base (the guest plays from the other side)
const camPos=new THREE.Vector3(0,20,40),camLook=new THREE.Vector3();
const tagsEl=$('#tags');
const marker=new THREE.Mesh(G.marker,M.marker);marker.rotation.x=-Math.PI/2;scene.add(marker);
