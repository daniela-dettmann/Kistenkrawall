/* Kistenkrawall: Menü (Auftrag „Menü aufräumen und Einstellungen im Spiel“).
   - Hauptmenü mit drei Knöpfen: Spielen, Mehrspieler, Einstellungen; darunter „Zuletzt: Karte, Schwierigkeit“.
   - Spielstart: Karte als Bildkarten, Schwierigkeit, „Los geht's“ (und „Weiterspielen“, wenn ein Spielstand da ist).
     Eine andere Karte lädt die Seite neu (die Welt wird beim Laden gebaut); danach ist der Spielstart wieder offen.
   - Einstellungen: vier Bereiche (Spiel, Grafik, Ton, Steuerung), alles wird sofort gespeichert und wirkt sofort.
     Derselbe Bildschirm öffnet sich aus der Pause, der Zurück-Knopf heißt dort „Zurück zur Pause“.
   - Pause: Weiter, Einstellungen, Neu starten, Hauptmenü. Im Mehrspieler ist die Pause nur eine Ebene über dem
     Spiel, das Spiel läuft weiter (state bleibt 'play'); nur ein Verbindungsabbruch hält beide Geräte an.
   Die Schalter selbst sitzen in den Dateien, die sie betreffen (gfx.js, daynight.js, game.js, xmas.js); hier
   stehen die Navigation und die Schalter ohne eigene Datei: Tipps, Spuren, Kamera umkehren, Vibration. */
'use strict';
const MENU={from:'start',overlay:false};
(function(){
  const PANELS=['#panelStart','#panelPlay','#panelSettings','#panelHelp','#panelNet','#panelEnd','#panelPause'];
  function show(id){for(const p of PANELS){const el=$(p);if(el)el.hidden=p!==id;}$('#menu').scrollTop=0;
    $('#menu').classList.toggle('ingame',state!=='menu');}
  MENU.show=show;
  const store=(k,v)=>{try{localStorage.setItem(k,v);}catch(e){}};
  const read=k=>{try{return localStorage.getItem(k);}catch(e){return null;}};
  const sw=(id,on)=>{const b=$(id);if(b)b.setAttribute('aria-checked',on?'true':'false');};

  /* ---------- Main menu ---------- */
  const DL={leicht:'leicht',normal:'normal',schwer:'schwer'};
  function lastLine(){const el=$('#lastLine');if(!el)return;
    // a saved round waits behind „Spielen“; the line says so, so it is not overlooked
    const saved=$('#continueBtn')&&!$('#continueBtn').hidden;
    el.textContent='Zuletzt: '+(MAPS[MAP]||'Insel')+', '+DL[diffKey]+(saved?' · gespeicherte Runde wartet':'');}
  {const _rr=refreshResume;refreshResume=function(){_rr();lastLine();};}
  MENU.lastLine=lastLine;lastLine();
  for(const b of document.querySelectorAll('.diffSeg button'))b.addEventListener('click',lastLine);
  $('#playBtn').addEventListener('click',()=>{initAudio();show('#panelPlay');});
  $('#playBack').addEventListener('click',()=>show('#panelStart'));
  // a different map reloads the page; the start screen opens again afterwards, so it is still two taps to play
  for(const b of document.querySelectorAll('#mapSeg button'))b.addEventListener('click',()=>{if(b.dataset.m!==MAP)try{sessionStorage.setItem('kk-open','play');}catch(e){}},true);
  {let open=null;try{open=sessionStorage.getItem('kk-open');sessionStorage.removeItem('kk-open');}catch(e){}if(open==='play'&&state==='menu')show('#panelPlay');}

  /* ---------- Settings ---------- */
  function openSettings(from){
    MENU.from=from;
    $('#setBack').textContent=from==='pause'?'Zurück zur Pause':'Zurück';
    show('#panelSettings');
  }
  MENU.openSettings=openSettings;
  $('#settingsBtn').addEventListener('click',()=>openSettings('start'));
  $('#pauseSetBtn').addEventListener('click',()=>openSettings('pause'));
  function back(){show(MENU.from==='pause'&&(state==='pause'||MENU.overlay)?'#panelPause':'#panelStart');}
  $('#setBack').addEventListener('click',back);
  // the help opens from the settings and goes back there (game.js); the four areas as tabs
  let tab=read('kk-settab')||'spiel';
  function setTab(t){tab=t;store('kk-settab',t);
    for(const b of document.querySelectorAll('#panelSettings .tile'))b.setAttribute('aria-selected',b.dataset.s===t?'true':'false');
    for(const p of document.querySelectorAll('#panelSettings .pane'))p.hidden=p.dataset.s!==t;}
  for(const b of document.querySelectorAll('#panelSettings .tile'))b.addEventListener('click',()=>setTab(b.dataset.s));
  if(!document.querySelector(`#panelSettings .tile[data-s="${tab}"]`))tab='spiel';
  setTab(tab);

  // Tipps anzeigen: the key line on the desktop, the swipe hint and the stick labels on the phone
  let tips=read('kk-tips')!=='0';
  const applyTips=()=>{document.documentElement.classList.toggle('notips',!tips);sw('#tipsToggle',tips);};
  $('#tipsToggle').addEventListener('click',()=>{tips=!tips;store('kk-tips',tips?'1':'0');applyTips();});
  applyTips();
  // Spuren im Schnee (snow.js, ash prints in look.js)
  sw('#trailToggle',SNOW.trails);
  $('#trailToggle').addEventListener('click',()=>{SNOW.trails=!SNOW.trails;store('kk-trails',SNOW.trails?'1':'0');sw('#trailToggle',SNOW.trails);
    if(!SNOW.trails&&SNOW.clearTrails)SNOW.clearTrails();});
  // Kamera umkehren (input.js)
  sw('#invertToggle',lookInv<0);
  $('#invertToggle').addEventListener('click',()=>{lookInv=-lookInv;store('kk-inv',lookInv<0?'1':'0');sw('#invertToggle',lookInv<0);});
  // Vibration: a short buzz when your Blechling is hit. Safari on the iPhone has no vibration for web pages.
  const canVib=typeof navigator.vibrate==='function';
  MENU.vib=canVib&&read('kk-vib')!=='0';
  sw('#vibToggle',MENU.vib);
  if(!canVib){$('#vibToggle').disabled=true;$('#vibNote').textContent='Dieses Gerät oder dieser Browser kann nicht vibrieren (Safari auf dem iPhone)';}
  $('#vibToggle').addEventListener('click',()=>{if(!canVib)return;MENU.vib=!MENU.vib;store('kk-vib',MENU.vib?'1':'0');sw('#vibToggle',MENU.vib);if(MENU.vib)navigator.vibrate(30);});
  {const _hf=hurtFlash;hurtFlash=function(){_hf();if(MENU.vib&&state==='play'&&!MENU.overlay)try{navigator.vibrate(35);}catch(e){}};}

  /* ---------- Pause ---------- */
  // Main menu and pause lead to the same settings; the pause gets „Einstellungen“ and „Hauptmenü“
  const _pause=pause;
  pause=function(on,fromNet){
    // multiplayer: the pause is only a layer over the running game
    if(MP&&!fromNet){
      if(on&&state==='play'&&!MENU.overlay){MENU.overlay=true;fireHeld=false;for(const k in keys)keys[k]=false;
        $('#menu').hidden=false;show('#panelPause');return;}
      if(!on&&MENU.overlay){MENU.overlay=false;$('#menu').hidden=true;return;}
      if(MENU.overlay)return;
    }
    if(MENU.overlay&&fromNet&&on){MENU.overlay=false;}   // connection lost: a real pause on top
    _pause(on,fromNet);
    if(state==='pause')show('#panelPause');
  };
  // what the pause menu offers depends on the game: no restart and no early wave in multiplayer
  setInterval(()=>{
    if($('#panelPause').hidden)return;
    $('#mpPauseNote').hidden=!MP;$('#restartBtn').hidden=!!MP;
    if(MP)$('#attackNowBtn').hidden=true;
  },200);
  const _toMenu=toMenu;toMenu=function(){MENU.overlay=false;_toMenu();show('#panelStart');lastLine();};
  const _end=endGame;endGame=function(win,why){MENU.overlay=false;_end(win,why);show('#panelEnd');};
  const _start=startGame;startGame=function(){MENU.overlay=false;_start.apply(this,arguments);lastLine();};
  // Escape: in the settings or the help during a pause, one step back; in a multiplayer overlay, close it
  document.addEventListener('keydown',e=>{
    if(e.key!=='Escape'&&e.key.toLowerCase()!=='p')return;
    if(e.repeat)return;
    const inSet=!$('#panelSettings').hidden,inHelp=!$('#panelHelp').hidden;
    if((state==='pause'||MENU.overlay)&&(inSet||inHelp)){e.stopPropagation();if(inHelp){$('#panelHelp').hidden=true;$('#panelSettings').hidden=false;}else back();return;}
    if(MENU.overlay){e.stopPropagation();pause(false);}
  },true);
  // no game input reaches the game while the multiplayer overlay is open
  for(const t of ['keydown','keyup'])document.addEventListener(t,e=>{if(MENU.overlay&&e.key!=='Escape')e.stopPropagation();},true);
  $('#menu').classList.toggle('ingame',state!=='menu');
})();
