/* Kistenkrawall: Mehrspieler 1 gegen 1.
   Direkte, verschlüsselte WebRTC-Verbindung zwischen zwei Geräten. Den Verbindungsaufbau vermittelt PeerJS
   über den kostenlosen öffentlichen Server (er sieht dabei die IP-Adressen, nicht das Spiel).

   Rollen: Das Gerät, das den Raum erstellt (Host), rechnet das ganze Spiel und schickt etwa zehnmal pro Sekunde
   den Stand. Der Gast schickt nur seine Eingaben und zeigt den Stand an. Der Host spielt Orange, der Gast Petrol;
   beide Teams haben KI-Mitstreiter mit gleichem Verhalten, automatische Wellen gibt es im Mehrspieler nicht.

   Sicherheit: Raumcodes aus kryptografisch sicherem Zufall (8 Zeichen ohne 0/O/1/I/L, ~40 Bit), Raum läuft nach
   10 Minuten ohne Beitritt ab, nur ein Gast, Versionsvergleich, jede eingehende Nachricht wird auf Format,
   erlaubte Werte, Größe und Häufigkeit geprüft. Texte werden nur als Text angezeigt, nie als HTML oder Code.
   Kein Chat, keine persönlichen Daten. */
'use strict';
const NET_CFG={
  // signalling server: the public PeerJS cloud by default; tests may point to a local one, but only on localhost
  peer:{},
  // STUN finds the public address. A TURN relay (e.g. Metered) can be added later: put its entries in turn.
  stun:[{urls:'stun:stun.l.google.com:19302'}],
  turn:[],
  roomTTL:10*60*1000,      // a room without a guest expires after 10 minutes
  reconnectWindow:60000,   // after a dropped connection both wait this long for the other side
  stateEvery:0.1,          // seconds between state updates from host to guest
  idPrefix:'kistenkrawall-'
};
(function(){
  const m=/[?&]peerserver=(localhost|127\.0\.0\.1):(\d{2,5})/i.exec(location.search);
  if(m&&/^(localhost|127\.0\.0\.1)$/.test(location.hostname))NET_CFG.peer={host:m[1],port:+m[2],path:'/',secure:false};
})();

/* ---------- Room codes ---------- */
const CODE_ALPHA='ABCDEFGHJKMNPQRSTUVWXYZ23456789';   // no 0/O, 1/I/L
function makeRoomCode(){
  const out=[],buf=new Uint8Array(32);
  while(out.length<8){crypto.getRandomValues(buf);for(const b of buf){if(b<CODE_ALPHA.length*8&&out.length<8)out.push(CODE_ALPHA[b%CODE_ALPHA.length]);}}
  return out.join('');
}
const prettyCode=c=>c.slice(0,4)+'-'+c.slice(4);
const cleanCode=s=>String(s||'').toUpperCase().replace(/[\s-]/g,'');
const validCode=c=>c.length===8&&[...c].every(ch=>CODE_ALPHA.includes(ch));
const appVersion=()=>{const m=document.querySelector('meta[name="kk-version"]');return m?m.content:'dev';};
const token=()=>{const b=new Uint8Array(16);crypto.getRandomValues(b);return [...b].map(x=>x.toString(16).padStart(2,'0')).join('');};

/* ---------- Message checks ---------- */
const num=(v,a,b)=>typeof v==='number'&&isFinite(v)&&v>=a&&v<=b;
const int=(v,a,b)=>Number.isInteger(v)&&v>=a&&v<=b;
const str=(v,max,re)=>typeof v==='string'&&v.length<=max&&(!re||re.test(v));
const WEAPON_IDX=['knipser','spritzer','streuer','krachrohr','kanone','mg','moerser','turm'];
const KIND_IDX=['bot','tank','buggy','moerser','turm'];
const CRATE_STATE=['ground','fall','carry','stack'];
const ACTS=['action','swap','collect'];
const END_CODES=['host-won','guest-won','left','lost'];
const TOAST_RE=/^[^<>]*$/;   // toasts are plain text and only ever shown via textContent

// guest → host
function validFromGuest(m){
  if(!m||typeof m!=='object'||Array.isArray(m)||!str(m.t,8))return false;
  switch(m.t){
    case 'hello':return str(m.v,40,/^[\w.-]+$/)&&(m.tok===undefined||str(m.tok,32,/^[0-9a-f]{32}$/))&&Object.keys(m).length<=3;
    case 'in':return num(m.mx,-1.01,1.01)&&num(m.mz,-1.01,1.01)&&(m.a===null||num(m.a,-50,50))&&typeof m.f==='boolean'&&Object.keys(m).length===5;
    case 'act':return ACTS.includes(m.a)&&Object.keys(m).length===2;
    case 'pause':return typeof m.on==='boolean'&&Object.keys(m).length===2;
    case 'ping':case 'bye':return Object.keys(m).length===1;
  }
  return false;
}
// host → guest
function validUnitRow(r){return Array.isArray(r)&&r.length===13&&int(r[0],1,1e7)&&int(r[1],0,1)&&int(r[2],0,4)&&num(r[3],-90,90)&&num(r[4],-90,90)&&num(r[5],-1e4,1e4)&&num(r[6],-1e4,1e4)
  &&num(r[7],0,5000)&&num(r[8],1,5000)&&int(r[9],0,7)&&int(r[10],0,15)&&int(r[11],-1,1e7)&&str(r[12],24,TOAST_RE);}
function validCrateRow(r){return Array.isArray(r)&&r.length===7&&int(r[0],1,1e7)&&num(r[1],-90,90)&&num(r[2],-30,60)&&num(r[3],-90,90)&&int(r[4],0,3)&&int(r[5],0,2)&&int(r[6],0,1);}
function validEvent(e){
  if(!Array.isArray(e)||!str(e[0],6))return false;
  switch(e[0]){
    case 'b':return e.length===4&&num(e[1],-90,90)&&num(e[2],-90,90)&&num(e[3],0,10);
    case 'f':return e.length===4&&str(e[1],12,/^[a-z]+$/)&&typeof SND[e[1]]==='function'&&num(e[2],-200,200)&&num(e[3],-200,200);
    case 't':return e.length===3&&str(e[1],140,TOAST_RE)&&num(e[2],0.5,5);
    case 's':return e.length===9&&int(e[1],1,1e7)&&int(e[2],0,7)&&int(e[3],0,1)&&num(e[4],-90,90)&&num(e[5],-90,90)&&num(e[6],-60,60)&&num(e[7],-60,60)&&num(e[8],0,5);
    case 'a':return e.length===10&&int(e[1],1,1e7)&&int(e[2],0,1)&&[3,4,5,6,7,8,9].every(i=>num(e[i],-90,90));
  }
  return false;
}
function validFromHost(m){
  if(!m||typeof m!=='object'||Array.isArray(m)||!str(m.t,8))return false;
  switch(m.t){
    case 'welcome':return str(m.v,40,/^[\w.-]+$/)&&MAPS[m.map]&&str(m.tok,32,/^[0-9a-f]{32}$/)&&int(m.peace,5,7);
    case 'version':return str(m.v,40,/^[\w.-]+$/);
    case 'full':case 'ping':case 'start':case 'expired':return true;
    case 'pause':return typeof m.on==='boolean';
    case 'end':return END_CODES.includes(m.c);
    case 'st':{
      if(!Array.isArray(m.g)||m.g.length!==6||!num(m.g[0],0,1e5)||!num(m.g[1],0,1e4)||!num(m.g[2],0,1e4)||!int(m.g[3],0,1e4)||!int(m.g[4],0,1)||!int(m.g[5],0,1))return false;
      if(!Array.isArray(m.h)||m.h.length!==2||!m.h.every(v=>num(v,0,1e5)))return false;
      if(!Array.isArray(m.p)||m.p.length!==2||!m.p.every(v=>int(v,-1,1e7)))return false;
      if(!Array.isArray(m.u)||m.u.length>60||!m.u.every(validUnitRow))return false;
      if(!Array.isArray(m.c)||m.c.length>80||!m.c.every(validCrateRow))return false;
      if(!Array.isArray(m.s)||m.s.length>300||!m.s.every(v=>int(v,1,1e7)))return false;
      if(!Array.isArray(m.e)||m.e.length>200||!m.e.every(validEvent))return false;
      return true;
    }
  }
  return false;
}
// size and rate limits per direction
function makeGate(maxBytes,maxPerSec){
  let win=0,count=0;
  return {bad:0,check(m){
    const now=performance.now();if(now-win>1000){win=now;count=0;}
    if(++count>maxPerSec)return false;
    let n=0;try{n=JSON.stringify(m).length;}catch(e){return false;}
    return n<=maxBytes;
  }};
}

/* ---------- Connection state ---------- */
const NET={peer:null,conn:null,role:null,code:null,tok:null,lastHeard:0,lostAt:0,joined:false,started:false,
  expireTimer:null,stats:{invalid:0,dropped:0},gate:null,pendingEv:[],input:{mx:0,mz:0,a:null,f:false,t:0},
  sendT:0,inT:0,lastIn:'',seq:0,crateSeq:0,shotSeq:0,guestDownT:0};
window.NET=NET;   // for tests
const peerOpts=()=>Object.assign({},NET_CFG.peer,{debug:0,config:{iceServers:NET_CFG.stun.concat(NET_CFG.turn)}});
function send(m){try{if(NET.conn&&NET.conn.open)NET.conn.send(m);}catch(e){}}

function netStatus(t){const el=$('#netStatus');if(el)el.textContent=t;}
function netOverlay(text,showLeave){const o=$('#netOverlay');if(!o)return;if(!text){o.hidden=true;return;}$('#netOverlayText').textContent=text;$('#netLeave').hidden=!showLeave;o.hidden=false;}

function closeNet(){
  clearTimeout(NET.expireTimer);
  // forget the connection before closing it, so its close event is not taken for a drop
  const c=NET.conn,p=NET.peer;NET.conn=null;NET.peer=null;
  try{if(c)c.close();}catch(e){}
  try{if(p)p.destroy();}catch(e){}
  Object.assign(NET,{peer:null,conn:null,role:null,code:null,tok:null,joined:false,started:false,lostAt:0,pendingEv:[]});
}
// leave multiplayer completely and go back to the single-player menu
function leaveMultiplayer(msg){
  if(NET.conn&&NET.conn.open){send(NET.role==='host'?{t:'end',c:'left'}:{t:'bye'});}
  setTimeout(closeNet,1000);   // give the goodbye time to arrive before the connection closes
  MP=null;player2=null;TAC_YAW=Math.PI;document.documentElement.classList.remove('mp');
  netOverlay(null);toMenu();
  if(msg)toast(msg,3);
}

/* ---------- Host ---------- */
function hostRoom(){
  if(typeof Peer==='undefined'){netStatus('Mehrspieler ist gerade nicht verfügbar. Lade die Seite neu.');return;}
  closeNet();
  NET.role='host';NET.code=makeRoomCode();NET.tok=token();
  $('#netCode').textContent=prettyCode(NET.code);$('#netStartBtn').disabled=true;
  $('#netHostInfo').textContent='Karte: '+MAPS[MAP]+' · Bauruhe '+peaceMin+' Min. Karte und Bauruhe stellst du vorher im Startmenü ein.';
  netStatus('Raum wird geöffnet …');
  const peer=NET.peer=new Peer(NET_CFG.idPrefix+NET.code,peerOpts());
  peer.on('open',()=>netStatus('Warte auf deinen Gegner …'));
  peer.on('error',e=>{
    if(e.type==='unavailable-id'){netStatus('Code schon vergeben, neuer Code wird erstellt …');setTimeout(hostRoom,300);return;}
    if(e.type==='network'||e.type==='server-error'||e.type==='socket-error')netStatus('Keine Verbindung zum Vermittlungsserver. Prüfe das Internet.');
  });
  peer.on('disconnected',()=>{if(NET.peer===peer&&!peer.destroyed)setTimeout(()=>{try{peer.reconnect();}catch(e){}},2000);});
  peer.on('connection',conn=>hostAccept(conn));
  clearTimeout(NET.expireTimer);
  NET.expireTimer=setTimeout(()=>{if(!NET.joined&&NET.role==='host'){closeNet();netStatus('Der Raum ist abgelaufen. Erstelle einen neuen.');$('#netCode').textContent='–';}},NET_CFG.roomTTL);
}
function hostAccept(conn){
  // only one guest: a second device is turned away; after a drop the same guest may come back with its token
  const busy=NET.conn&&NET.conn.open&&performance.now()-NET.lastHeard<5000;
  let greeted=false;
  conn.on('open',()=>{
    const t=setTimeout(()=>{if(!greeted)try{conn.close();}catch(e){}},5000);
    conn.on('data',m=>{
      if(!greeted){
        clearTimeout(t);
        if(!m||m.t!=='hello'||!validFromGuest(m)){try{conn.close();}catch(e){}return;}
        greeted=true;
        if(busy||(NET.started&&m.tok!==NET.tok)){conn.send({t:'full'});setTimeout(()=>conn.close(),200);return;}
        if(m.v!==appVersion()){conn.send({t:'version',v:appVersion()});setTimeout(()=>conn.close(),200);netStatus('Dein Gegner hat eine andere Spielversion. Ihr braucht beide die neueste.');return;}
        if(NET.conn&&NET.conn!==conn)try{NET.conn.close();}catch(e){}
        NET.conn=conn;NET.joined=true;NET.lastHeard=performance.now();NET.gate=makeGate(300,80);clearTimeout(NET.expireTimer);
        conn.send({t:'welcome',v:appVersion(),map:MAP,tok:NET.tok,peace:peaceMin});
        if(NET.started){NET.lostAt=0;netOverlay(null);toast('Verbindung wieder da',1.6);conn.send({t:'start'});if(state==='pause')conn.send({t:'pause',on:true});}
        else{netStatus('Dein Gegner ist da!');$('#netStartBtn').disabled=false;}
        return;
      }
      if(conn!==NET.conn)return;
      hostReceive(m);
    });
    conn.on('close',()=>{if(conn===NET.conn)connectionLost();});
    conn.on('error',()=>{if(conn===NET.conn)connectionLost();});
  });
}
function hostReceive(m){
  NET.lastHeard=performance.now();
  if(!NET.gate.check(m)){NET.stats.dropped++;return;}
  if(!validFromGuest(m)){NET.stats.invalid++;if(NET.stats.invalid>200)leaveMultiplayer('Die Verbindung wurde wegen fehlerhafter Daten beendet.');return;}
  if(m.t==='in'){Object.assign(NET.input,{mx:m.mx,mz:m.mz,a:m.a,f:m.f,t:performance.now()});return;}
  if(m.t==='act'){hostGuestAct(m.a);return;}
  if(m.t==='pause'){if(m.on)pause(true,true);else{pause(false,true);}return;}
  if(m.t==='bye'){NET.conn=null;leaveMultiplayer('Dein Gegner hat das Spiel verlassen.');return;}
}
function hostStart(){
  if(!NET.conn||!NET.conn.open)return;
  MP='host';NET.started=true;document.documentElement.classList.add('mp');
  startGame();
  player2=null;netSetGuestPilot(teamUnits(1).find(u=>u.kind==='bot'));
  send({t:'start'});
}
function netSetGuestPilot(u){
  if(!u)return;
  player2=u;u.plan='patrol';u.goal=null;u.thinkT=0;
  NET.pendingEv.push(['t','Du steuerst '+u.name,1.3]);
}
// the host applies the guest's input to the guest's Blechling, like its own player control
function netControlGuest(dt){
  const p=player2;
  if(!p||!p.alive){
    NET.guestDownT+=dt;
    if(NET.guestDownT>0.7){NET.guestDownT=0;const m=teamUnits(1).filter(u=>u.kind!=='turm');if(m.length)netSetGuestPilot(m[0]);}
    return;
  }
  NET.guestDownT=0;
  const inp=NET.input,fresh=performance.now()-inp.t<400;
  if(fresh&&(inp.mx||inp.mz))moveUnit(p,inp.mx,inp.mz,dt,1);
  if(fresh&&inp.a!==null){if(!isVeh(p))p.h=inp.a;else p.h+=clamp(angDiff(inp.a,p.h),-3.6*dt,3.6*dt);}
  const dir=inp.a===null?p.h:inp.a;
  const lock=(!p.carry&&!inPeace())?findLock(p,dir,WEAPONS[p.weapon].range+3,.55):null;p.lock=lock;
  if(fresh&&inp.f&&!p.carry){
    if(isVeh(p)){if(Math.abs(angDiff(dir,p.h))<0.12)fire(p,p.h,1,lock);}
    else fire(p,dir,1,lock);
  }
}
// actions run with the guest's Blechling as "player"; its messages go to the guest instead of the host's screen
function hostGuestAct(a){
  if(state!=='play'||!player2||!player2.alive)return;
  const keepP=player,keepQ=placeQueue,keepToast=toast;
  player=player2;placeQueue=[];toast=(t,d)=>NET.pendingEv.push(['t',String(t).replace(/[<>]/g,'').slice(0,140),clamp(+d||1.6,0.5,5)]);
  try{
    if(a==='action')contextAction();
    else if(a==='swap'){const mine=teamUnits(1);if(mine.length>1)netSetGuestPilot(mine[(mine.indexOf(player2)+1)%mine.length]);}
    else if(a==='collect'){const c=teams[1].collect==='gelb'?'blau':'gelb';teams[1].collect=c;for(const u of units)if(u.team===1&&u.plan==='fetch')u.thinkT=0;toast(c==='gelb'?'Team sammelt jetzt gelbe Kisten':'Team sammelt jetzt blaue Kisten',1.4);}
  }finally{player=keepP;placeQueue=keepQ;toast=keepToast;}
}
const r2=v=>Math.round(v*100)/100,wrapA=a=>((a%TAU)+TAU)%TAU;
function hostSendState(){
  // give every new shot an id and announce it once; the guest moves it on its own until it disappears
  for(const s of shots){if(s.nid)continue;s.nid=++NET.shotSeq;
    if(s.arc)NET.pendingEv.push(['a',s.nid,s.team,r2(s.x0),r2(s.z0),r2(s.y0),r2(s.x1),r2(s.z1),r2(Math.min(s.T,9)),r2(Math.min(s.peak,80))]);
    else NET.pendingEv.push(['s',s.nid,Math.max(0,WEAPON_IDX.indexOf(s.owner&&s.owner.weapon||'turm')),s.team,r2(s.x),r2(s.z),r2(s.vx),r2(s.vz),r2(Math.min(s.life,5))]);}
  for(const c of crates)if(!c.nid)c.nid=++NET.crateSeq;
  const ev=NET.pendingEv.splice(0,200);
  send({t:'st',
    g:[r2(gameT),r2(peaceT),r2(waveT),waveNo,teams[0].collect==='gelb'?1:0,teams[1].collect==='gelb'?1:0],
    h:hqs.map(h=>r2(h.hp)),
    p:[player&&player.alive?player.id:-1,player2&&player2.alive?player2.id:-1],
    u:units.filter(u=>u.alive).slice(0,60).map(u=>[u.id,u.team,Math.max(0,KIND_IDX.indexOf(u.kind)),r2(u.x),r2(u.z),r2(wrapA(u.h)),r2(wrapA(u.hull)),r2(Math.max(0,u.hp)),r2(u.maxHp),Math.max(0,WEAPON_IDX.indexOf(u.weapon)),
      (u.golden?1:0)|(u.shield>0?2:0)|(u.moving?4:0)|(u.weaponMul>1?8:0),u.carry&&u.carry.nid?u.carry.nid:-1,String(u.name).slice(0,24)]),
    c:crates.slice(0,80).map(c=>[c.nid,r2(c.x),r2(c.y),r2(c.z),Math.max(0,CRATE_STATE.indexOf(c.state)),c.gold?2:c.sort==='gelb'?1:0,c.chute?1:0]),
    s:shots.slice(0,300).map(s=>s.nid),
    e:ev});
}

/* ---------- Guest ---------- */
function joinRoom(raw){
  const code=cleanCode(raw);
  if(!validCode(code)){netStatus('Der Code hat 8 Zeichen, zum Beispiel ABCD-EF23.');return;}
  if(typeof Peer==='undefined'){netStatus('Mehrspieler ist gerade nicht verfügbar. Lade die Seite neu.');return;}
  closeNet();
  NET.role='guest';NET.code=code;
  netStatus('Verbinde …');
  const peer=NET.peer=new Peer(peerOpts());
  peer.on('open',()=>guestConnect());
  peer.on('error',e=>{
    if(e.type==='peer-unavailable'){if(NET.started&&NET.lostAt)return;netStatus('Kein Raum mit diesem Code gefunden.');return;}
    if(e.type==='network'||e.type==='server-error'||e.type==='socket-error')netStatus('Keine Verbindung zum Vermittlungsserver. Prüfe das Internet.');
  });
  peer.on('disconnected',()=>{if(NET.peer===peer&&!peer.destroyed)setTimeout(()=>{try{peer.reconnect();}catch(e){}},2000);});
}
function guestConnect(){
  if(!NET.peer||NET.peer.destroyed)return;
  const conn=NET.peer.connect(NET_CFG.idPrefix+NET.code,{serialization:'json',reliable:true});
  conn.on('open',()=>{
    NET.conn=conn;NET.gate=makeGate(120000,60);NET.lastHeard=performance.now();
    conn.send(NET.tok?{t:'hello',v:appVersion(),tok:NET.tok}:{t:'hello',v:appVersion()});
  });
  conn.on('data',m=>{if(conn===NET.conn)guestReceive(m);});
  conn.on('close',()=>{if(conn===NET.conn)connectionLost();});
  conn.on('error',()=>{if(conn===NET.conn)connectionLost();});
}
function guestReceive(m){
  NET.lastHeard=performance.now();
  if(!NET.gate.check(m)){NET.stats.dropped++;return;}
  if(!validFromHost(m)){NET.stats.invalid++;if(NET.stats.invalid>200)leaveMultiplayer('Die Verbindung wurde wegen fehlerhafter Daten beendet.');return;}
  switch(m.t){
    case 'welcome':
      NET.tok=m.tok;NET.joined=true;peaceMin=m.peace;
      if(m.map!==MAP&&!NET.started){
        // the world is built for one map: reload on the host's map and join again automatically
        try{sessionStorage.setItem('kk-rejoin',NET.code);}catch(e){}
        closeNet();netStatus('Lade die Karte '+MAPS[m.map]+' …');reloadOnMap(m.map);return;
      }
      if(NET.started){NET.lostAt=0;netOverlay(null);toast('Verbindung wieder da',1.6);}
      else netStatus('Verbunden! Warte, bis dein Gegner das Spiel startet …');
      return;
    case 'version':netStatus('Ihr habt verschiedene Spielversionen. Bitte aktualisiere die App.');if(window.kkCheckUpdate)window.kkCheckUpdate();closeNet();return;
    case 'full':netStatus('Dieser Raum ist schon voll.');closeNet();return;
    case 'start':if(!NET.started)guestStart();return;
    case 'pause':if(m.on)pause(true,true);else pause(false,true);return;
    case 'end':
      if(m.c==='left'){NET.conn=null;leaveMultiplayer('Dein Gegner hat das Spiel verlassen.');return;}
      endGame(m.c==='guest-won',m.c==='guest-won'?'Ihr habt die Orange-Bande besiegt.':'Die Orange-Bande hat gewonnen.');return;
    case 'st':if(NET.started)guestApply(m);return;
  }
}
function guestStart(){
  MP='guest';NET.started=true;document.documentElement.classList.add('mp');
  initAudio();tryLandscape();
  clearWorld();player=null;
  TAC_YAW=0;camYaw=0;
  state='play';$('#menu').hidden=true;$('#hud').hidden=false;
  peaceT=peaceMin*60;
}
const guestUnits=new Map(),guestCrates=new Map(),guestShots=new Map();
function guestApply(m){
  const [gT,pT,wT,wN,c0,c1]=m.g;
  const wasPeace=peaceT>0;peaceT=pT;waveT=wT;waveNo=wN;
  if(wasPeace&&pT<=0&&state==='play'){toast('Die Bauruhe ist vorbei. Kampf!',2.4);sfx('drum');}
  teams[0].collect=c0?'gelb':'blau';teams[1].collect=c1?'gelb':'blau';
  m.h.forEach((hp,i)=>{const h=hqs[i];if(hp<h.hp-0.5){h.flashT=.12;}h.hp=hp;if(hp<=0&&!h.dead){h.dead=true;h.g.scale.y=.45;h.bodyMat.color.multiplyScalar(.35);}});
  // crates first, units may carry them
  const seenC=new Set();
  for(const [id,x,y,z,st,so,ch] of m.c){
    seenC.add(id);let c=guestCrates.get(id);
    if(!c){c=spawnCrate(x,z,st===1&&ch===1,so===2,so===1?'gelb':'blau');c.nid=id;guestCrates.set(id,c);}
    c.state=CRATE_STATE[st];
    if(c.chute&&!(st===1&&ch)){scene.remove(c.chute);c.chute=null;if(c.ring){scene.remove(c.ring);c.ring=null;}}
    c.x=x;c.y=y;c.z=z;if(c.state!=='carry')c.m.position.set(x,y,z);if(c.chute)c.chute.position.set(x,y+1.3,z);
  }
  for(const [id,c] of guestCrates)if(!seenC.has(id)){removeCrate(c);guestCrates.delete(id);}
  for(const p of pads){p.stack=crates.filter(c=>c.state==='stack'&&Math.hypot(c.x-p.x,c.z-p.z)<1.6).sort((a,b)=>a.y-b.y);}
  // units
  const seenU=new Set();
  for(const [id,team,ki,x,z,h,hull,hp,maxHp,wi,fl,carry,name] of m.u){
    seenU.add(id);let u=guestUnits.get(id);
    if(!u){const kind=KIND_IDX[ki];u=spawnUnit(team,x,z,'kaempfer',kind==='bot'?undefined:kind);u.id=id;u.name=name;u.plan='net';guestUnits.set(id,u);}
    u.tx=x;u.tz=z;u.th=h;u.thull=hull;u.hp=hp;u.maxHp=maxHp;u.netMoving=!!(fl&4);
    const w=WEAPON_IDX[wi];if(u.weapon!==w&&!isVeh(u))setWeapon(u,w,!!(fl&8));else u.weapon=w;
    if(!!(fl&1)!==!!u.golden)makeGolden(u,!!(fl&1));
    if(fl&2){if(!u.shieldMesh)giveShield(u,1);u.shield=1;}else if(u.shieldMesh)dropShield(u);
    u.carry=carry>0?(guestCrates.get(carry)||null):null;
  }
  for(const [id,u] of guestUnits)if(!seenU.has(id)){if(u.alive){u.alive=false;u.dying=.9;u.hp=0;u.tag.say.hidden=true;u.tag.hpb.hidden=true;u.carry=null;if(u===player)player=null;}guestUnits.delete(id);}
  // our own Blechling
  const mine=guestUnits.get(m.p[1]);
  if(mine&&mine!==player){if(player&&player.tag)player.tag.el.classList.remove('me');player=mine;mine.tag.el.classList.add('me');mine.x=mine.tx;mine.z=mine.tz;syncCollect();}
  // shots: drop the ones the host no longer has
  const alive=new Set(m.s);
  for(const [id,s] of guestShots)if(!alive.has(id)){scene.remove(s.m);guestShots.delete(id);const i=shots.indexOf(s);if(i>=0)shots.splice(i,1);}
  for(const e of m.e)guestEvent(e);
}
function guestShotMesh(w,team){
  let m;
  if(w==='krachrohr'||w==='kanone'){m=new THREE.Group();const r=new THREE.Mesh(new THREE.CylinderGeometry(0.1,0.1,0.55,8),M.dark);r.rotation.x=Math.PI/2;m.add(r);}
  else if(w==='moerser'){m=new THREE.Mesh(G.bomb,M.dark);}
  else m=new THREE.Mesh(G.tracer,M.bullet[team]);
  if(window.xmasShotMesh){const x=window.xmasShotMesh(w,m);if(x)return x;}
  return m;
}
function guestEvent(e){
  switch(e[0]){
    case 'b':boom(e[1],e[2],e[3]);break;
    case 'f':sfx(e[1],e[2],e[3]);break;
    case 't':toast(e[1],e[2]);break;
    case 's':{const [,id,wi,team,x,z,vx,vz,life]=e;if(guestShots.has(id))break;const w=WEAPON_IDX[wi],m=guestShotMesh(w,team);m.rotation.y=Math.atan2(vx,vz);m.position.set(x,hgt(x,z)+1.1,z);scene.add(m);
      const s={m,x,z,vx,vz,life,team,nid:id};shots.push(s);guestShots.set(id,s);break;}
    case 'a':{const [,id,team,x0,z0,y0,x1,z1,T,peak]=e;if(guestShots.has(id))break;const m=guestShotMesh('moerser',team);scene.add(m);
      const s={m,arc:true,x0,z0,y0,x1,z1,T,peak,t:0,x:x0,z:z0,team,nid:id};shots.push(s);guestShots.set(id,s);break;}
  }
}
// guest: move shots on their own between updates (the host decides hits)
function netGuestShots(dt){
  for(const s of shots){
    if(s.arc){s.t+=dt;const k=Math.min(1,s.t/s.T);s.x=s.x0+(s.x1-s.x0)*k;s.z=s.z0+(s.z1-s.z0)*k;s.m.position.set(s.x,s.y0+(hgt(s.x1,s.z1)+0.3-s.y0)*k+4*s.peak*k*(1-k),s.z);continue;}
    s.x+=s.vx*dt;s.z+=s.vz*dt;s.life-=dt;s.m.position.set(s.x,hgt(s.x,s.z)+1.1,s.z);s.m.visible=s.life>-0.3;
  }
}
// guest: glide everything toward the last known positions; our own Blechling moves at once and is corrected gently
function netGuestTick(dt){
  const k=Math.min(1,dt*10);
  for(const u of units){
    if(!u.alive||u.tx===undefined)continue;
    if(u===player){
      const d=Math.hypot(u.tx-u.x,u.tz-u.z);
      if(d>3){u.x=u.tx;u.z=u.tz;}else if(d>0.05){u.x+=(u.tx-u.x)*Math.min(1,dt*3);u.z+=(u.tz-u.z)*Math.min(1,dt*3);}
      if(isVeh(u))u.hull+=angDiff(u.thull,u.hull)*k;
      continue;
    }
    u.x+=(u.tx-u.x)*k;u.z+=(u.tz-u.z)*k;u.h+=angDiff(u.th,u.h)*k;u.hull+=angDiff(u.thull,u.hull)*k;
    if(u.netMoving)u.moving=true;
  }
}
let lastInSent=0;
function netSendInput(mx,mz,a,f){
  const now=performance.now();
  const key=[mx.toFixed(2),mz.toFixed(2),a===null?'n':a.toFixed(2),f].join();
  if(key===NET.lastIn&&now-lastInSent<250)return;   // only on change, plus a keep-alive
  if(now-lastInSent<45)return;                        // at most ~20 per second
  NET.lastIn=key;lastInSent=now;
  send({t:'in',mx:clamp(mx,-1,1),mz:clamp(mz,-1,1),a:a===null||!isFinite(a)?null:clamp(a,-50,50),f:!!f});
}
function netSendAct(a){if(ACTS.includes(a))send({t:'act',a});}

/* ---------- Both: heartbeat, drops, pause, end ---------- */
function connectionLost(){
  if(!NET.started){
    if(NET.role==='host'){NET.conn=null;NET.joined=false;$('#netStartBtn').disabled=true;netStatus('Dein Gegner ist weg. Warte auf ihn …');}
    else netStatus('Die Verbindung ist abgebrochen.');
    return;
  }
  if(NET.lostAt)return;
  NET.lostAt=performance.now();
  if(state==='play')pause(true,true);
  netOverlay('Verbindung verloren – warte auf deinen Gegner …',true);
}
setInterval(()=>{
  if(!NET.role)return;
  if(NET.conn&&NET.conn.open)send({t:'ping'});
  if(NET.started&&!NET.lostAt&&performance.now()-NET.lastHeard>5000)connectionLost();
  if(NET.lostAt){
    const left=Math.ceil((NET_CFG.reconnectWindow-(performance.now()-NET.lostAt))/1000);
    if(left<=0){leaveMultiplayer('Die Verbindung kam nicht zurück. Das Spiel ist beendet.');return;}
    $('#netOverlayText').textContent='Verbindung verloren – warte auf deinen Gegner … ('+left+' s)';
    if(NET.role==='guest'&&left%3===0){try{if(NET.peer&&NET.peer.disconnected)NET.peer.reconnect();guestConnect();}catch(e){}}
  }
},1000);
// host: send the state regularly while a round runs (also while paused, so the guest stays in sync)
setInterval(()=>{if(MP==='host'&&NET.conn&&NET.conn.open&&!NET.lostAt&&(state==='play'||state==='pause'))hostSendState();},NET_CFG.stateEvery*1000);

// pause and resume reach both devices; leaving the round ends it for both
const _pause=pause;
pause=function(on,fromNet){
  const before=state;_pause(on);
  if(MP&&!fromNet&&state!==before)send({t:'pause',on:state==='pause'});
};
const _endGame=endGame;
endGame=function(win,why){
  _endGame(win,why);
  if(MP==='host')send({t:'end',c:win?'host-won':'guest-won'});
};
const _toMenu=toMenu;
toMenu=function(){
  if(MP&&state!=='menu'){leaveMultiplayer();return;}
  _toMenu();
};
// the host records explosions and sounds for the guest (explosions bring their own sound)
const _boom=boom;
boom=function(x,z,size){_boom(x,z,size);if(MP==='host')NET.pendingEv.push(['b',r2(x),r2(z),r2(clamp(size,0,10))]);};
const _sfx=sfx;
sfx=function(kind,x,z){_sfx(kind,x,z);if(MP==='host'&&kind!=='boom'&&NET.pendingEv.length<180)NET.pendingEv.push(['f',kind,r2(x===undefined?0:x),r2(z===undefined?0:z)]);};

/* ---------- Menu ---------- */
(function(){
  const show=id=>{for(const p of ['#netChoose','#netHostBox','#netJoinBox'])$(p).hidden=p!==id;};
  $('#netBtn').addEventListener('click',()=>{$('#panelStart').hidden=true;$('#panelNet').hidden=false;show('#netChoose');netStatus('');$('#menu').scrollTop=0;});
  $('#netBack').addEventListener('click',()=>{closeNet();$('#panelNet').hidden=true;$('#panelStart').hidden=false;});
  $('#netHostBtn').addEventListener('click',()=>{show('#netHostBox');hostRoom();});
  $('#netJoinBtn').addEventListener('click',()=>{show('#netJoinBox');netStatus('');$('#netCodeIn').focus();});
  $('#netJoinGo').addEventListener('click',()=>joinRoom($('#netCodeIn').value));
  $('#netCodeIn').addEventListener('keydown',e=>{if(e.key==='Enter')joinRoom($('#netCodeIn').value);});
  $('#netStartBtn').addEventListener('click',hostStart);
  $('#netCopy').addEventListener('click',()=>{
    const t=$('#netCode').textContent;
    navigator.clipboard&&navigator.clipboard.writeText(t).then(()=>netStatus('Code kopiert. Warte auf deinen Gegner …'),()=>netStatus('Kopieren ging nicht, lies den Code einfach vor.'));
  });
  if(navigator.share)$('#netShare').hidden=false;
  $('#netShare').addEventListener('click',()=>{navigator.share({title:'Kistenkrawall',text:'Spiel mit mir Kistenkrawall! Raumcode: '+$('#netCode').textContent,url:location.origin+location.pathname}).catch(()=>{});});
  $('#netLeave').addEventListener('click',()=>leaveMultiplayer());
  // after a reload onto the host's map, join the same room again
  let code=null;try{code=sessionStorage.getItem('kk-rejoin');sessionStorage.removeItem('kk-rejoin');}catch(e){}
  if(code&&validCode(code)){$('#panelStart').hidden=true;$('#panelNet').hidden=false;show('#netJoinBox');$('#netCodeIn').value=prettyCode(code);setTimeout(()=>joinRoom(code),300);}
})();

// for tests: inspect and misuse the connection on purpose
window.netDebug={send:m=>{try{NET.conn.send(m);}catch(e){}},drop:()=>{try{NET.conn.close();}catch(e){}}};
