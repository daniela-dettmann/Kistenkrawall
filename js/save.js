/* Kistenkrawall: Spielstand speichern und fortsetzen.
   Ein Spielstand im Browser-Speicher (localStorage). Gespeichert wird automatisch, sobald das Spiel
   pausiert (also auch, wenn die App in den Hintergrund geht) und alle 30 Sekunden während einer Runde.
   Nach Sieg oder Niederlage und beim Start eines neuen Spiels wird er gelöscht.
   Nicht gespeichert werden Dinge, die nur Sekunden leben: Kugeln, Explosionen, Flieger im Anflug.

   Einheiten werden allgemein gespeichert: alle Felder mit einfachen Werten (Zahlen, Texte, Wahrheitswerte)
   und kleine Objekte nur aus solchen Werten (z. B. Wegpunkte {x,z}). Verweise auf 3D-Modelle, andere
   Einheiten oder Kisten fallen dabei automatisch weg; die KI entscheidet nach dem Laden neu.
   Wer das Format so ändert, dass alte Spielstände nicht mehr passen, erhöht SAVE_FORMAT. */
'use strict';
const SAVE_KEY='kk-save',SAVE_FORMAT=1;
// Simple-valued unit fields that only drive visuals or short effects; they rebuild themselves after loading.
const SAVE_SKIP=new Set(['dmgLvl','smT','sparkT','dustT','flash','sayT','dying','moving','walk','lastMoveT','stuckClock','unstickT','reactT','aimHold']);

function plainValue(v){
  if(v===null||typeof v==='number'||typeof v==='string'||typeof v==='boolean')return true;
  if(typeof v==='object'&&!Array.isArray(v)&&Object.getPrototypeOf(v)===Object.prototype)
    return Object.values(v).every(x=>x===null||typeof x==='number'||typeof x==='string'||typeof x==='boolean');
  return false;
}
// JSON cannot hold Infinity (unlimited ammo) or NaN
const saveReplacer=(k,v)=>v===Infinity?'__inf':v===-Infinity?'__-inf':(typeof v==='number'&&isNaN(v))?null:v;
const saveReviver=(k,v)=>v==='__inf'?Infinity:v==='__-inf'?-Infinity:v;

function snapshot(){
  const alive=crates.filter(c=>c.state!=='fall'||c.y>-5);
  const cIdx=c=>alive.indexOf(c);
  return {
    format:SAVE_FORMAT,savedAt:Date.now(),map:MAP,
    app:(document.querySelector('meta[name="kk-version"]')||{}).content||'dev',
    diffKey,peaceMin,
    g:{gameT,spawnT,peaceT,waveT,waveNo,spawnSide,peaceWarnT,nextId},
    stats:Object.assign({},stats),
    respawns:respawns.map(r=>Object.assign({},r)),
    placeQueue:placeQueue.map(q=>Object.assign({},q)),
    queuedStrikes:queuedStrikes.map(q=>({team:q.team,ownerId:q.owner?q.owner.id:null,boost:!!q.boost})),
    teams:teams.map(T=>{
      const o={};for(const [k,v] of Object.entries(T))if(k!=='wave'&&plainValue(v))o[k]=v;
      if(T.wave)o.wave={phase:T.wave.phase,t:T.wave.t,announced:!!T.wave.announced,goT:T.wave.goT||0,
        groups:(T.wave.groups||[]).map(g=>({bx:g.bx,role:g.role,ids:g.ids.slice(),go:!!g.go}))};
      return o;
    }),
    hqs:hqs.map(h=>({hp:h.hp,turCd:h.turCd||0})),
    crates:alive.map(c=>({x:c.x,z:c.z,y:c.y,vx:c.vx,vy:c.vy,vz:c.vz,state:c.state,gold:c.gold,sort:c.sort,chute:!!c.chute})),
    pads:pads.map(p=>p.stack.map(cIdx).filter(i=>i>=0)),
    units:units.filter(u=>u.alive).map(u=>{
      const o={};for(const [k,v] of Object.entries(u))if(!SAVE_SKIP.has(k)&&plainValue(v))o[k]=v;
      o.carryIdx=u.carry?cIdx(u.carry):-1;
      return o;
    }),
    playerId:player&&player.alive?player.id:null,
    camYaw
  };
}

function writeSave(){
  if(state!=='play'&&state!=='pause')return false;
  try{
    localStorage.setItem(SAVE_KEY,JSON.stringify(snapshot(),saveReplacer));
    // ask the browser not to clear our data when space runs low (iPhone may still do so after a week unused)
    if(!writeSave.asked&&navigator.storage&&navigator.storage.persist){writeSave.asked=true;navigator.storage.persist().catch(()=>{});}
    return true;
  }catch(e){console.warn('Spielstand konnte nicht gespeichert werden',e);return false;}
}
function readSave(){
  try{
    const raw=localStorage.getItem(SAVE_KEY);if(!raw)return null;
    const s=JSON.parse(raw,saveReviver);
    if(!s||s.format!==SAVE_FORMAT){clearSave();toast('Dein alter Spielstand passt nicht zu dieser Version und wurde verworfen.',3);return null;}
    return s;
  }catch(e){clearSave();return null;}
}
function clearSave(){try{localStorage.removeItem(SAVE_KEY);}catch(e){}refreshResume();}

function restore(s){
  clearWorld();
  diffKey=DIFFS[s.diffKey]?s.diffKey:'normal';D=DIFFS[diffKey];peaceMin=s.peaceMin||peaceMin;
  ({gameT,spawnT,peaceT,waveT,waveNo,spawnSide,peaceWarnT}=s.g);
  Object.assign(stats,s.stats);
  respawns=s.respawns;placeQueue=s.placeQueue;
  s.teams.forEach((o,i)=>{const w=o.wave;delete o.wave;Object.assign(teams[i],o);if(w)teams[i].wave=w;});
  if(typeof syncCollect==='function')syncCollect();
  s.hqs.forEach((o,i)=>{hqs[i].hp=o.hp;hqs[i].turCd=o.turCd;});

  const made=s.crates.map(o=>{
    const c=spawnCrate(o.x,o.z,o.state==='fall'&&o.chute,o.gold,o.sort);
    Object.assign(c,{x:o.x,z:o.z,y:o.y,vx:o.vx||0,vy:o.vy||0,vz:o.vz||0,state:o.state,claim:0});
    c.m.position.set(c.x,c.y,c.z);return c;
  });
  s.pads.forEach((idx,i)=>{pads[i].stack=idx.map(j=>made[j]).filter(Boolean);placeStacked(pads[i]);});

  const names=[];
  for(const o of s.units){
    const u=spawnUnit(o.team,o.x,o.z,o.role,o.kind==='bot'?undefined:o.kind);
    if(!isVeh(u))setWeapon(u,o.weapon,o.weaponMul>1);
    const carryIdx=o.carryIdx;delete o.carryIdx;
    Object.assign(u,o);
    makeGolden(u,!!o.golden);
    if(o.shield>0){u.shield=0;giveShield(u,o.shield);}
    if(carryIdx>=0&&made[carryIdx]){u.carry=made[carryIdx];u.carry.state='carry';}
    // plans can point at crates or foes that no longer exist: let the AI decide afresh
    u.plan='patrol';u.goal=null;u.thinkT=0;u.target=null;u.planCrate=null;
    names.push(u.name);
  }
  // a crate marked as carried whose carrier was not saved lands on the ground
  for(const c of made)if(c.state==='carry'&&!units.some(u=>u.carry===c)){c.state='fall';c.chute=null;}
  usedNames.clear();for(const n of names)usedNames.add(n);
  nextId=Math.max(s.g.nextId||1,...units.map(u=>u.id+1));
  queuedStrikes=s.queuedStrikes.map(q=>({team:q.team,owner:units.find(u=>u.id===q.ownerId)||null,boost:q.boost}));
  const p=units.find(u=>u.id===s.playerId&&u.alive);
  if(p)setPlayer(p);else{const m=teamUnits(0);if(m.length)setPlayer(m[0]);}
  if(typeof s.camYaw==='number')camYaw=s.camYaw;
}

/* ----- Menu: "Weiterspielen" ----- */
function agoText(ms){
  const min=Math.round(ms/60000);
  if(min<1)return 'gerade eben';if(min<60)return 'vor '+min+' Min.';
  const h=Math.round(min/60);if(h<24)return 'vor '+h+' Std.';
  const d=Math.round(h/24);return d===1?'gestern':'vor '+d+' Tagen';
}
function saveSummary(s){
  const mmss=t=>Math.floor(t/60)+':'+String(Math.floor(t%60)).padStart(2,'0');
  const where=s.g.peaceT>0?(s.g.waveNo?'Welle '+s.g.waveNo+' geschafft, Bauruhe noch '+mmss(s.g.peaceT):'Bauruhe noch '+mmss(s.g.peaceT)):'Welle '+s.g.waveNo+' läuft';
  const label={leicht:'Leicht',normal:'Normal',schwer:'Schwer'}[s.diffKey]||'';
  return (MAPS[s.map]||'Insel')+' · '+where+' · '+label+' · gespeichert '+agoText(Date.now()-s.savedAt);
}
function refreshResume(){
  let s=null;try{const raw=localStorage.getItem(SAVE_KEY);s=raw?JSON.parse(raw,saveReviver):null;}catch(e){}
  const ok=!!(s&&s.format===SAVE_FORMAT);
  const btn=$('#continueBtn');btn.hidden=!ok;
  if(ok)$('#continueInfo').textContent=saveSummary(s);
  const start=$('#startBtn');start.className=ok?'go2':'go';start.textContent=ok?'Neues Spiel':"Los geht's";
}
// The world is built for one map at load: a save from the other map reloads the page on that map first.
// Saves from before the mountain existed have no map and belong to the island.
function reloadOnMap(m){
  try{localStorage.setItem('kk-map',m);}catch(e){}
  const u=new URL(location.href);u.search=u.search.replace(/([?&])karte=[^&]*&?/i,'$1').replace(/[?&]$/,'');u.hash='';location.replace(u.href);
}
function resumeGame(){
  const s=readSave();if(!s){refreshResume();return;}
  if((s.map||'insel')!==MAP){try{sessionStorage.setItem('kk-autoresume','1');}catch(e){}reloadOnMap(s.map||'insel');return;}
  initAudio();tryLandscape();
  try{restore(s);}
  catch(e){console.error(e);clearSave();toast('Der Spielstand ließ sich nicht laden und wurde verworfen.',3);newGame(true);return;}
  for(const b of document.querySelectorAll('#diffSeg button'))b.setAttribute('aria-pressed',b.dataset.d===diffKey?'true':'false');
  state='play';$('#menu').hidden=true;$('#hud').hidden=false;
  pause(true);   // start paused, so the player can get their bearings first
  toast('Spielstand geladen',1.6);
}
$('#continueBtn').addEventListener('click',resumeGame);
refreshResume();
{let auto=false;try{auto=sessionStorage.getItem('kk-autoresume')==='1';sessionStorage.removeItem('kk-autoresume');}catch(e){}
 if(auto)setTimeout(resumeGame,50);}

/* ----- Map choice in the start menu ----- */
for(const b of document.querySelectorAll('#mapSeg button')){
  b.setAttribute('aria-pressed',b.dataset.m===MAP?'true':'false');
  b.addEventListener('click',()=>{if(b.dataset.m!==MAP)reloadOnMap(b.dataset.m);});
}
setInterval(()=>{if(state==='menu'&&!$('#menu').hidden)refreshResume();},30000);

/* ----- When to save ----- */
setInterval(()=>{if(state==='play')writeSave();},30000);
window.addEventListener('pagehide',()=>{if(state==='play'||state==='pause')writeSave();});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&(state==='play'||state==='pause'))writeSave();});
