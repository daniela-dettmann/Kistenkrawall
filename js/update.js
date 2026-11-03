/* Kistenkrawall: Hinweis auf neue Versionen der installierten App.
   Die laufende Version steht in <meta name="kk-version">, die neueste auf dem Server in version.json
   (beides trägt der Deploy-Workflow ein). Gibt es eine neuere, wartet die Seite, bis der Service Worker
   sie komplett heruntergeladen hat, und bietet erst dann das Aktualisieren an:
   im Menü als Banner, während einer Runde nur als kleines Abzeichen plus Knopf im Pausenmenü. */
'use strict';
(function(){
  const meta=document.querySelector('meta[name="kk-version"]');
  const APP=meta.content,APP_DATE=meta.dataset.date;
  const sw='serviceWorker' in navigator?navigator.serviceWorker:null;
  let ready=false,dismissed=false,checking=false;

  {const line=$('#verLine');
    if(APP==='dev')line.textContent='Entwicklungsversion';
    else{const d=APP_DATE?new Date(APP_DATE+'T12:00:00Z').toLocaleDateString('de-DE',{day:'2-digit',month:'2-digit',year:'numeric'}):'';
      line.textContent=(d?'Version vom '+d+' · ':'Version ')+APP.slice(0,7);}}

  // Which cache version the active service worker holds ('kk-<commit>'), or null if it does not answer.
  function swVersion(){
    return new Promise(res=>{
      if(!sw||!sw.controller)return res(null);
      const ch=new MessageChannel(),t=setTimeout(()=>res(null),1500);
      ch.port1.onmessage=e=>{clearTimeout(t);res(e.data);};
      sw.controller.postMessage('version',[ch.port2]);
    });
  }
  async function check(){
    if(ready||checking||APP==='dev'||!navigator.onLine)return;
    checking=true;
    try{
      const r=await fetch('version.json',{cache:'no-store'});if(!r.ok)return;
      const latest=(await r.json()).version;
      if(!latest||latest===APP)return;
      if(sw){
        const reg=await sw.getRegistration();
        if(reg){
          await reg.update().catch(()=>{});
          // only offer the update once the new version is fully downloaded and in charge
          for(let i=0;i<90&&await swVersion()!=='kk-'+latest;i++)await new Promise(r=>setTimeout(r,1000));
          if(await swVersion()!=='kk-'+latest)return;
        }
      }
      ready=true;show();
    }catch(e){/* offline or server hiccup: try again later */}
    finally{checking=false;}
  }
  function show(){
    const inRound=state==='play'||state==='pause';
    $('#updBar').hidden=!ready||dismissed||inRound;
    $('#updPill').hidden=!ready||state!=='play';
    $('#updPauseBtn').hidden=!ready||state!=='pause';
    $('#updEndBtn').hidden=!ready||state!=='end';
  }
  const reload=()=>location.reload();
  $('#updNow').addEventListener('click',reload);
  $('#updPauseBtn').addEventListener('click',reload);
  $('#updEndBtn').addEventListener('click',reload);
  $('#updLater').addEventListener('click',()=>{dismissed=true;show();});
  // keep the hint in step with menu/round/pause/end without touching the game code
  setInterval(()=>{if(ready)show();},400);

  setTimeout(check,3000);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)check();});
  window.addEventListener('online',check);
  setInterval(check,30*60*1000);
  window.kkCheckUpdate=check;   // used by tests/smoke.cjs
})();
