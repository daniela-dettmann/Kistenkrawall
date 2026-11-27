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
    case 'wx':return e.length===3&&int(e[1],0,5)&&int(e[2],0,1);
    case 'vp':return e.length===4&&int(e[1],0,2)&&num(e[2],-90,90)&&int(e[3],-1,1);
    case 'vb':return e.length===3&&num(e[1],-90,90)&&num(e[2],-90,90);
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
  expireTimer:null,stats:{invalid:0,dropped:0,conns:0,opened:0,hellos:0,rejected:0,got:0},gate:null,pendingEv:[],input:{mx:0,mz:0,a:null,f:false,t:0},
  sendT:0,inT:0,lastIn:'',seq:0,crateSeq:0,shotSeq:0,guestDownT:0};
window.NET=NET;   // for tests
const peerOpts=()=>Object.assign({},NET_CFG.peer,{debug:0,config:{iceServers:NET_CFG.stun.concat(NET_CFG.turn)}});
function send(m){try{if(NET.conn&&NET.conn.open)NET.conn.send(m);}catch(e){}}

function netStatus(t){const el=$('#netStatus');if(el)el.textContent=t;}
function netOverlay(text,showLeave){const o=$('#netOverlay');if(!o)return;if(!text){o.hidden=true;return;}$('#netOverlayText').textContent=text;$('#netLeave').hidden=!showLeave;o.hidden=false;}

function closeNet(later){
  clearTimeout(NET.expireTimer);
  // forget the connection before closing it, so its close event is not taken for a drop
  const c=NET.conn,p=NET.peer;NET.conn=null;NET.peer=null;
  // later: the state is reset at once, the connection itself only goes after a few seconds, so a last message
  // still reaches a busy device (closing tears down the whole peer connection, including what is on its way)
  const shut=()=>{try{if(c)c.close();}catch(e){}try{if(p)p.destroy();}catch(e){}};
  if(later)setTimeout(shut,later);else shut();
  Object.assign(NET,{peer:null,conn:null,role:null,code:null,tok:null,joined:false,started:false,lostAt:0,pendingEv:[]});
}
// leave multiplayer completely and go back to the single-player menu
function leaveMultiplayer(msg){
  if(NET.conn&&NET.conn.open){send(NET.role==='host'?{t:'end',c:'left'}:{t:'bye'});}
  // the goodbye needs time to arrive: on a busy device even waiting for the send buffer was not always enough, so the
  // other side reads it and leaves by itself; this side forgets the connection now and closes it after 8 s
  closeNet(8000);
  MP=null;player2=null;TAC_YAW=Math.PI;document.documentElement.classList.remove('mp');
  netOverlay(null);toMenu();
  if(msg)toast(msg,3);
}

/* ---------- Diagnosis: steps with ticks, plain messages, a log to copy ----------
   Shows how far the connection got: signalling server reached, other side found, connection open, which way it runs
   (directly in the same WLAN, directly over the internet, or through a TURN relay), round running. The log that
   „Details kopieren“ puts on the clipboard holds times, states, candidate types and errors, but no IP addresses,
   no room code and no peer ids. */
const DIAG={t0:performance.now(),log:[],kind:null,cands:{host:0,srflx:0,prflx:0,relay:0},err:null,ice:null,slowT:0,pcs:new WeakSet()};
window.DIAG=DIAG;
function netLog(ev){DIAG.log.push([Math.round((performance.now()-DIAG.t0)/100)/10,String(ev).slice(0,120)]);if(DIAG.log.length>150)DIAG.log.shift();netDiagRender();}
function diagReset(){Object.assign(DIAG,{log:[],kind:null,cands:{host:0,srflx:0,prflx:0,relay:0},err:null,ice:null,slowT:0,t0:performance.now()});}
function diagError(t){DIAG.err=t;netLog('Fehler: '+t);}
const hasTurn=()=>NET_CFG.turn.length>0;
// which way the connection runs: from the candidate pair the browser picked
function diagKind(pc){
  pc.getStats().then(st=>{
    let pair=null;const by=new Map();st.forEach(r=>by.set(r.id,r));
    st.forEach(r=>{if(r.type==='transport'&&r.selectedCandidatePairId)pair=by.get(r.selectedCandidatePairId);});
    if(!pair)st.forEach(r=>{if(r.type==='candidate-pair'&&r.state==='succeeded'&&(r.nominated||!pair))pair=r;});
    if(!pair)return;
    const l=by.get(pair.localCandidateId),r=by.get(pair.remoteCandidateId),lt=l&&l.candidateType,rt=r&&r.candidateType;
    DIAG.kind=lt==='relay'||rt==='relay'?'turn':lt==='host'&&rt==='host'?'lan':'internet';
    netLog('Weg: '+(lt||'?')+' → '+(rt||'?'));
  }).catch(()=>{});
}
function watchPc(conn){
  const pc=conn&&conn.peerConnection;if(!pc||DIAG.pcs.has(pc))return;DIAG.pcs.add(pc);
  pc.addEventListener('icecandidate',e=>{const t=e.candidate&&e.candidate.type;if(t&&t in DIAG.cands)DIAG.cands[t]++;});
  pc.addEventListener('iceconnectionstatechange',()=>{
    const st=pc.iceConnectionState;DIAG.ice=st;netLog('ICE: '+st);
    if(st==='checking')DIAG.slowT=performance.now();
    if(st==='connected'||st==='completed'){DIAG.err=null;diagKind(pc);}
    if(st==='failed')diagError(hasTurn()?'Verbindung gescheitert, auch der Umweg über TURN klappt nicht.':'Direktverbindung gescheitert. Einen Umweg über TURN gibt es noch nicht.');
    if(st==='disconnected')netLog('Verbindung wackelt');
  });
}
const DIAG_STEPS=['Vermittlungsserver erreicht','Gegenüber gefunden','Verbindung steht','Art der Verbindung','Spiel läuft'];
function diagState(){
  const p=NET.peer,c=NET.conn,live=!!(c&&c.open&&NET.joined);
  const found=live||DIAG.ice==='checking'||DIAG.ice==='connected'||DIAG.ice==='completed'||(NET.role==='host'&&NET.stats.conns>0);
  const kind=DIAG.kind==='lan'?'direkt im WLAN':DIAG.kind==='internet'?'direkt übers Internet':DIAG.kind==='turn'?'über TURN':'';
  return [!!(p&&p.open)||live,found,live,live&&!!DIAG.kind,!!NET.started].map((d,i)=>({t:i===3&&kind?DIAG_STEPS[3]+': '+kind:DIAG_STEPS[i],d}));
}
function netDiagRender(){
  const ol=$('#netSteps');if(!ol)return;
  // a direct connection that takes long: with TURN the browser tries the relay next
  if(DIAG.ice==='checking'&&DIAG.slowT&&performance.now()-DIAG.slowT>6000&&!DIAG.err)DIAG.err=hasTurn()?'Direktverbindung dauert, versuche Umweg über TURN …':'Direktverbindung dauert …';
  const st=diagState();
  ol.textContent='';for(const s of st){const li=document.createElement('li');li.className=s.d?'ok':'';li.textContent=(s.d?'✓ ':'○ ')+s.t;ol.appendChild(li);}
  const n=st.filter(s=>s.d).length;
  $('#netDiagSum').textContent=NET.role?n+' von 5':'–';
  $('#netDiagErr').textContent=DIAG.err||'';$('#netDiagErr').hidden=!DIAG.err;
}
function diagDevice(){
  const u=navigator.userAgent||'',dev=/iPhone/.test(u)?'iPhone':/iPad/.test(u)||(/Macintosh/.test(u)&&navigator.maxTouchPoints>1)?'iPad':/Android/.test(u)?'Android':/Mac/.test(u)?'Mac':/Windows/.test(u)?'Windows':/Linux/.test(u)?'Linux':'anderes Gerät';
  const ios=(u.match(/OS (\d+)_(\d+)/)||[]).slice(1).join('.'),br=/CriOS|Chrome\//.test(u)&&!/Edg/.test(u)?'Chrome':/Edg/.test(u)?'Edge':/Firefox|FxiOS/.test(u)?'Firefox':/Safari/.test(u)?'Safari':'anderer Browser';
  const app=(window.matchMedia&&matchMedia('(display-mode: standalone)').matches)||navigator.standalone?'installierte App':'im Browser';
  return dev+(ios?' (iOS '+ios+')':'')+' · '+br+' · '+app;
}
function netDiagText(){
  const st=diagState(),s=NET.stats,c=DIAG.cands;
  const lines=['Kistenkrawall Verbindungsprotokoll','Version: '+appVersion()+' · '+diagDevice(),'Rolle: '+(NET.role==='host'?'Host':NET.role==='guest'?'Gast':'keine')+' · TURN: '+(hasTurn()?'eingerichtet':'nicht eingerichtet'),
    'Schritte: '+st.map(x=>(x.d?'✓ ':'○ ')+x.t).join(' | '),
    'ICE: '+(DIAG.ice||'–')+' · Kandidaten: host '+c.host+', srflx '+c.srflx+', prflx '+c.prflx+', relay '+c.relay,
    'Zähler: Verbindungen '+s.conns+', geöffnet '+s.opened+', Begrüßungen '+s.hellos+', abgelehnt '+s.rejected+', empfangen '+s.got+', verworfen '+s.dropped+', ungültig '+s.invalid+', Neuanmeldungen '+(NET.resumes||0),
    'Fehler: '+(DIAG.err||'keiner'),'Protokoll:'];
  for(const [t,e] of DIAG.log)lines.push(t.toFixed(1)+' s  '+e);
  // never anything that looks like an address
  return lines.join('\n').replace(/\b\d{1,3}(\.\d{1,3}){3}\b/g,'[Adresse]').replace(/\b[0-9a-f]{0,4}(:[0-9a-f]{0,4}){2,7}\b/gi,'[Adresse]');
}
function netDiagCopy(){
  const t=netDiagText();
  if(navigator.clipboard)navigator.clipboard.writeText(t).then(()=>toast('Details kopiert. Schick sie Claude.',2),()=>toast('Kopieren ging nicht.',2));
}
setInterval(()=>{if(NET.role){if(NET.conn)watchPc(NET.conn);netDiagRender();}},1000);

/* ---------- Host ---------- */
function hostRoom(){
  if(typeof Peer==='undefined'){netStatus('Mehrspieler ist gerade nicht verfügbar. Lade die Seite neu.');return;}
  closeNet();
  NET.role='host';NET.code=makeRoomCode();NET.tok=token();diagReset();netLog('Host: Raum wird geöffnet');
  $('#netCode').textContent=prettyCode(NET.code);$('#netStartBtn').disabled=true;
  $('#netHostInfo').textContent='Karte: '+MAPS[MAP]+' · Bauruhe '+peaceMin+' Min. Karte und Bauruhe stellst du vorher im Startmenü ein.';
  netStatus('Raum wird geöffnet …');
  const peer=NET.peer=new Peer(NET_CFG.idPrefix+NET.code,peerOpts());
  peer.on('open',()=>{netStatus('Warte auf deinen Gegner …');DIAG.err=null;netLog('Vermittlungsserver erreicht');});
  peer.on('disconnected',()=>netLog('Vermittlungsserver getrennt'));
  peer.on('error',e=>{
    netLog('PeerJS-Fehler: '+e.type);
    if(e.type==='unavailable-id'){netStatus('Code schon vergeben, neuer Code wird erstellt …');setTimeout(hostRoom,300);return;}
    if(e.type==='network'||e.type==='server-error'||e.type==='socket-error'){netStatus('Keine Verbindung zum Vermittlungsserver. Prüfe das Internet.');diagError('Vermittlungsserver nicht erreichbar');}
  });
  peer.on('disconnected',()=>{if(NET.peer===peer&&!peer.destroyed)setTimeout(()=>{try{if(peer.disconnected)peer.reconnect();}catch(e){}},2000);});
  peer.on('connection',conn=>hostAccept(conn));
  armExpire(NET_CFG.roomTTL);
}
// the room runs out after 10 minutes without a guest; the clock stops while the host's app is in the background
function armExpire(ms){
  clearTimeout(NET.expireTimer);NET.ttlEnd=Date.now()+ms;NET.ttlLeft=null;
  NET.expireTimer=setTimeout(()=>{if(!NET.joined&&NET.role==='host'){closeNet();netStatus('Der Raum ist abgelaufen. Erstelle einen neuen.');$('#netCode').textContent='–';}},ms);
}
// send a last message („room full“, „other version“) and leave the closing to the other side, which closes as soon
// as it has read it. Closing ourselves shortly after sending tore down the whole connection while the message could
// still be on its way; on a busy device it sometimes did not arrive at all. So it is sent again after 1.5, 3, 5 and
// 8 s (the other side acts on the first one), and after 10 s the host tidies up anyway.
function sendThenClose(conn,msg){
  const tell=()=>{try{if(conn.open){conn.send(msg);NET.stats.sent=(NET.stats.sent||0)+1;}else NET.stats.notOpen=(NET.stats.notOpen||0)+1;}catch(e){NET.stats.sendErr=String(e&&e.message||e).slice(0,80);}};
  tell();for(const t of [1500,3000,5000,8000])setTimeout(tell,t);
  setTimeout(()=>{try{if(conn.open)conn.close();}catch(e){}},10000);
}
function hostAccept(conn){
  NET.stats.conns++;netLog('Gegenüber meldet sich');watchPc(conn);
  conn.on('error',e=>{NET.stats.connErr=String(e&&(e.type||e.message)||e).slice(0,80);});
  // only one guest: a second device is turned away; after a drop the same guest may come back with its token
  let greeted=false;
  conn.on('open',()=>{
    NET.stats.opened++;netLog('Datenkanal offen');
    const t=setTimeout(()=>{if(!greeted)try{conn.close();}catch(e){}},5000);
    conn.on('data',m=>{
      if(!greeted){NET.stats.hellos++;
        clearTimeout(t);
        if(!m||m.t!=='hello'||!validFromGuest(m)){try{conn.close();}catch(e){}return;}
        greeted=true;
        // the room is taken while the guest's connection is open and was heard from in the last 20 s; only that same
        // guest (with its token) may come back. (Before: 5 s, and a guest whose device was busy for a moment lost
        // its place to a stranger.)
        // a second attempt of the same device (same peer id) is that device, not a stranger
        const other=m.tok!==NET.tok&&!(NET.conn&&NET.conn.peer===conn.peer),busy=NET.conn&&NET.conn!==conn&&NET.conn.open&&performance.now()-NET.lastHeard<20000;
        if(other&&(busy||NET.started)){NET.stats.rejected++;netLog('Weiterer Gast abgewiesen (Raum voll)');sendThenClose(conn,{t:'full'});return;}
        if(m.v!==appVersion()){NET.stats.rejected++;netLog('Gast abgewiesen: andere Version');sendThenClose(conn,{t:'version',v:appVersion()});netStatus('Dein Gegner hat eine andere Spielversion. Ihr braucht beide die neueste.');return;}
        if(NET.conn&&NET.conn!==conn)try{NET.conn.close();}catch(e){}
        NET.conn=conn;NET.guestPeer=conn.peer;NET.joined=true;NET.lastHeard=performance.now();NET.gate=makeGate(300,80);clearTimeout(NET.expireTimer);
        conn.send({t:'welcome',v:appVersion(),map:MAP,tok:NET.tok,peace:peaceMin});netLog('Gast begrüßt');
        if(NET.started){NET.lostAt=0;netOverlay(null);toast('Verbindung wieder da',1.6);conn.send({t:'start'});if(state==='pause')conn.send({t:'pause',on:true});}
        else{netStatus('Dein Gegner ist da!');$('#netStartBtn').disabled=false;}
        return;
      }
      if(conn!==NET.conn){
        // the guest came back on a newer connection while the older one still looks open (e.g. after the app was
        // in the background): follow the one it actually uses, otherwise its input and pings would be lost and the
        // room would look free to a stranger
        if(NET.joined&&conn.peer===NET.guestPeer&&conn.open){const old=NET.conn;NET.conn=conn;netLog('Gast nutzt neue Verbindung');try{if(old)old.close();}catch(e){}}
        else return;
      }
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
  netLog('Spiel startet');
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
  NET.role='guest';NET.code=code;diagReset();netLog('Gast: Beitritt');
  netStatus('Verbinde …');
  const peer=NET.peer=new Peer(peerOpts());
  peer.on('open',()=>{DIAG.err=null;netLog('Vermittlungsserver erreicht');guestConnect();});
  peer.on('disconnected',()=>netLog('Vermittlungsserver getrennt'));
  peer.on('error',e=>{
    netLog('PeerJS-Fehler: '+e.type);
    // the room is gone: during a round that means the host has left, so end it at once instead of waiting a minute
    if(e.type==='peer-unavailable'){if(NET.started){leaveMultiplayer('Dein Gegner hat das Spiel verlassen.');return;}netStatus('Kein Raum mit diesem Code gefunden.');diagError('Kein Raum mit diesem Code');return;}
    if(e.type==='network'||e.type==='server-error'||e.type==='socket-error'){netStatus('Keine Verbindung zum Vermittlungsserver. Prüfe das Internet.');diagError('Vermittlungsserver nicht erreichbar');}
  });
  peer.on('disconnected',()=>{if(NET.peer===peer&&!peer.destroyed)setTimeout(()=>{try{if(peer.disconnected)peer.reconnect();}catch(e){}},2000);});
  // a join that gets lost on the way (busy device, bad network) used to leave „Verbinde …“ on screen for ever:
  // without an answer from the room after 15 s the guest tries again, four times, then says so. Earlier attempts
  // stay open: a busy host may answer late, and that answer is taken from whichever attempt it arrives on.
  let tries=0;
  const watch=setInterval(()=>{
    if(NET.peer!==peer||NET.role!=='guest'||NET.joined||peer.destroyed){clearInterval(watch);return;}
    if(++tries>4){clearInterval(watch);netStatus('Keine Antwort vom Raum. Prüfe den Code und versuch es noch einmal.');diagError('Keine Antwort vom Raum');return;}
    netLog('Keine Antwort, neuer Versuch '+tries);
    if(!peer.open){try{peer.reconnect();}catch(e){}return;}
    guestConnect();
  },15000);
}
function guestConnect(){
  if(!NET.peer||NET.peer.destroyed)return;
  // two triggers at once (coming back to the app and the dropped connection) make one attempt, not two
  if(performance.now()-(NET.lastTry||0)<1500)return;NET.lastTry=performance.now();
  const conn=NET.peer.connect(NET_CFG.idPrefix+NET.code,{serialization:'json',reliable:true});
  netLog('Verbindung zum Raum wird aufgebaut');watchPc(conn);
  conn.on('open',()=>{netLog('Datenkanal offen');
    NET.conn=conn;NET.gate=makeGate(120000,60);NET.lastHeard=performance.now();
    conn.send(NET.tok?{t:'hello',v:appVersion(),tok:NET.tok}:{t:'hello',v:appVersion()});
  });
  conn.on('data',m=>{
    // all our connections lead to the host: the first answer counts on whichever attempt it comes, and later the
    // connection the host actually uses wins (after a reconnect an older one can still look open)
    if(NET.role!=='guest'||!NET.peer||conn.provider!==NET.peer)return;
    if(NET.conn!==conn){if(NET.joined)netLog('Host nutzt neue Verbindung');NET.conn=conn;}
    guestReceive(m);
  });
  conn.on('close',()=>{if(conn===NET.conn)connectionLost();});
  conn.on('error',()=>{if(conn===NET.conn)connectionLost();});
}
function guestReceive(m){
  NET.stats.got++;
  NET.lastHeard=performance.now();
  if(!NET.gate.check(m)){NET.stats.dropped++;return;}
  if(!validFromHost(m)){NET.stats.invalid++;if(NET.stats.invalid>200)leaveMultiplayer('Die Verbindung wurde wegen fehlerhafter Daten beendet.');return;}
  switch(m.t){
    case 'welcome':
      NET.tok=m.tok;NET.joined=true;peaceMin=m.peace;netLog('Vom Host begrüßt');
      if(m.map!==MAP&&!NET.started){
        // the world is built for one map: reload on the host's map and join again automatically
        try{sessionStorage.setItem('kk-rejoin',NET.code);}catch(e){}
        closeNet();netStatus('Lade die Karte '+MAPS[m.map]+' …');reloadOnMap(m.map);return;
      }
      if(NET.started){NET.lostAt=0;netOverlay(null);toast('Verbindung wieder da',1.6);}
      else netStatus('Verbunden! Warte, bis dein Gegner das Spiel startet …');
      return;
    case 'version':netLog('Abgewiesen: andere Version');netStatus('Ihr habt verschiedene Spielversionen. Bitte aktualisiere die App.');if(window.kkCheckUpdate)window.kkCheckUpdate();closeNet();return;
    case 'full':netLog('Abgewiesen: Raum voll');netStatus('Dieser Raum ist schon voll.');closeNet();return;
    case 'start':if(!NET.started)guestStart();return;
    case 'pause':if(m.on)pause(true,true);else pause(false,true);return;
    case 'end':
      if(m.c==='left'){NET.conn=null;leaveMultiplayer('Dein Gegner hat das Spiel verlassen.');return;}
      endGame(m.c==='guest-won',m.c==='guest-won'?'Ihr habt die Orange-Bande besiegt.':'Die Orange-Bande hat gewonnen.');return;
    case 'st':if(NET.started)guestApply(m);return;
  }
}
function guestStart(){
  netLog('Spiel startet');
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
    case 'vp':case 'vb':if(window.volcanoEvent)window.volcanoEvent(e);break;
    case 'wx':if(window.dayNightEvent)window.dayNightEvent(e);break;
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
  netLog('Verbindung verloren');
  if(!NET.started){
    if(NET.role==='host'){NET.conn=null;NET.joined=false;$('#netStartBtn').disabled=true;netStatus('Dein Gegner ist weg. Warte auf ihn …');}
    else if(NET.role==='guest'&&NET.joined&&NET.peer&&!NET.peer.destroyed){
      // still waiting for the start (e.g. the app was in the background): knock again with our token
      // not joined any more: the first answer counts again, on whichever attempt it comes (see guestConnect)
      netStatus('Verbindung unterbrochen, verbinde neu …');NET.conn=null;NET.joined=false;
      const p=NET.peer;setTimeout(()=>{if(NET.peer===p&&!NET.started){if(sigOpen(p))guestConnect();else{try{if(p.disconnected)p.reconnect();}catch(e){}p.once('open',guestConnect);}}},500);
    }
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

/* ---------- Coming back to the app ---------- */
// On the iPhone a short trip to another app (sharing the code via WhatsApp is enough) freezes the page: timers stop,
// and iOS may drop the connection to the signalling server without PeerJS noticing. So when the app is back in
// front, both sides check that connection at once and log in again under the same id: the room and its code stay
// valid. The host sees „Raum ist wieder bereit“, the guest knocks again straight away instead of waiting for a timer.
function sigOpen(p){
  if(!p||p.destroyed||p.disconnected||!p.open)return false;
  try{const ws=p.socket&&p.socket._socket;return !ws||ws.readyState===1;}catch(e){return true;}
}
NET.hiddenAt=0;NET.resumes=0;
// log in to the signalling server again under the same id. If a login is already under way (PeerJS reconnects by
// itself after a drop), wait for it instead of breaking it off; without an answer after 8 s try again, three times.
function relogin(p,n){
  if(NET.peer!==p||p.destroyed||sigOpen(p))return;
  try{
    if(p.disconnected)p.reconnect();
    else if(p.open||n>0){p.disconnect();p.reconnect();}   // looks open but the socket is gone, or the last try hung
  }catch(e){}
  if(n<3)setTimeout(()=>relogin(p,n+1),8000);
}
function netHidden(){
  if(!NET.role)return;
  netLog('App im Hintergrund');
  NET.hiddenAt=performance.now();
  if(NET.role==='host'&&!NET.joined&&NET.ttlEnd){NET.ttlLeft=Math.max(0,NET.ttlEnd-Date.now());clearTimeout(NET.expireTimer);}
}
function netResume(){
  if(!NET.role||!NET.peer||NET.peer.destroyed)return;
  const p=NET.peer;NET.hiddenAt=0;NET.resumes++;netLog('App wieder im Vordergrund');
  // the room's clock went on standing still in the background; afterwards it has at least two more minutes
  if(NET.role==='host'&&!NET.joined&&NET.ttlLeft!=null)armExpire(Math.max(NET.ttlLeft,120000));
  const fresh=sigOpen(p);
  if(!fresh)relogin(p,0);
  const when=f=>{if(fresh)f();else p.once('open',()=>{if(NET.peer===p)f();});};
  if(NET.role==='host'&&!NET.joined&&!NET.started)when(()=>netStatus('Raum ist wieder bereit. Warte auf deinen Gegner …'));
  if(NET.role==='guest'&&(!NET.conn||!NET.conn.open||NET.lostAt))when(()=>{if(NET.peer===p&&!p.destroyed)guestConnect();});
}
document.addEventListener('visibilitychange',()=>{if(document.hidden)netHidden();else netResume();});
window.addEventListener('pageshow',e=>{if(e.persisted)netResume();});
window.addEventListener('online',()=>netResume());
// the text that goes out with „Teilen“: the code plus a link that opens the game and joins the room at once
function netShareText(){return 'Spiel mit mir Kistenkrawall! Raumcode: '+prettyCode(NET.code||'')+'\n'+location.origin+location.pathname+'?raum='+prettyCode(NET.code||'');}

/* ---------- Menu ---------- */
(function(){
  const show=id=>{for(const p of ['#netChoose','#netHostBox','#netJoinBox'])$(p).hidden=p!==id;};
  $('#netBtn').addEventListener('click',()=>{$('#panelStart').hidden=true;$('#panelNet').hidden=false;show('#netChoose');netStatus('');if(!NET.role)diagReset();netDiagRender();$('#menu').scrollTop=0;});
  $('#netBack').addEventListener('click',()=>{closeNet();$('#panelNet').hidden=true;$('#panelStart').hidden=false;});
  $('#netHostBtn').addEventListener('click',()=>{show('#netHostBox');hostRoom();});
  $('#netJoinBtn').addEventListener('click',()=>{show('#netJoinBox');netStatus('');$('#netCodeIn').focus();});
  $('#netJoinGo').addEventListener('click',()=>joinRoom($('#netCodeIn').value));
  $('#netCodeIn').addEventListener('keydown',e=>{if(e.key==='Enter')joinRoom($('#netCodeIn').value);});
  $('#netStartBtn').addEventListener('click',hostStart);
  // copies the invitation (code and link), ready to paste into a message
  $('#netCopy').addEventListener('click',()=>{
    if(!NET.code)return;
    navigator.clipboard&&navigator.clipboard.writeText(netShareText()).then(()=>netStatus('Einladung mit Code und Link kopiert. Warte auf deinen Gegner …'),()=>netStatus('Kopieren ging nicht, lies den Code einfach vor.'));
  });
  if(navigator.share)$('#netShare').hidden=false;
  // „Teilen“ opens the share sheet (WhatsApp, Messages …); the room survives the trip to the other app (see above)
  $('#netShare').addEventListener('click',()=>{if(!NET.code)return;navigator.share({title:'Kistenkrawall',text:netShareText()}).then(()=>netResume(),()=>netResume());});
  $('#netLeave').addEventListener('click',()=>leaveMultiplayer());
  $('#netDiagCopy').addEventListener('click',netDiagCopy);$('#netOverlayCopy').addEventListener('click',netDiagCopy);
  // after a reload onto the host's map, join the same room again; a shared link (…?raum=ABCD-EF23) joins at once
  let code=null;try{code=sessionStorage.getItem('kk-rejoin');sessionStorage.removeItem('kk-rejoin');}catch(e){}
  {const m=/[?&]raum=([A-Za-z0-9-]{8,9})/.exec(location.search);
   if(m&&!code){code=cleanCode(m[1]);try{const u=new URL(location.href);u.searchParams.delete('raum');history.replaceState(null,'',u.pathname+u.search+u.hash);}catch(e){}}}
  if(code&&validCode(code)){$('#panelStart').hidden=true;$('#panelNet').hidden=false;show('#netJoinBox');$('#netCodeIn').value=prettyCode(code);setTimeout(()=>joinRoom(code),300);}
})();

// for tests: inspect and misuse the connection on purpose
window.netDebug={send:m=>{try{NET.conn.send(m);}catch(e){}},drop:()=>{try{NET.conn.close();}catch(e){}}};
