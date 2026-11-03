/* Kistenkrawall: Audio im Spiel: Ausgabe starten/aufwecken, Lautstärke, sfx() */
'use strict';
/* ---------- Audio ---------- */
let AC=null,noiseBuf=null,master=null;
let soundOn=true,soundVol=0.8;
try{const v=localStorage.getItem('kk-snd');if(v==='0')soundOn=false;const l=parseFloat(localStorage.getItem('kk-vol'));if(l>=0&&l<=1)soundVol=l;}catch(e){}
// iOS Safari: treat game audio as real playback so the ring/silent switch does not mute it
try{if(navigator.audioSession)navigator.audioSession.type='playback';}catch(e){}
function applyVolume(){if(master)master.gain.setTargetAtTime(soundOn?soundVol:0,AC.currentTime,0.02);}
// Called on every user gesture: creates the context once, and wakes it up again whenever the
// browser suspended or interrupted it (screen lock, app switch, phone call).
function initAudio(){
  if(!AC){
    try{AC=new (window.AudioContext||window.webkitAudioContext)();
      noiseBuf=AC.createBuffer(1,AC.sampleRate*0.5,AC.sampleRate);const d=noiseBuf.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;
      master=AC.createGain();master.gain.value=soundOn?soundVol:0;master.connect(AC.destination);
    }catch(e){AC=null;return;}
  }
  if(AC.state!=='running'){const r=AC.resume();if(r&&r.catch)r.catch(()=>{});}
}
for(const ev of ['pointerdown','touchend','keydown','click'])window.addEventListener(ev,initAudio,{capture:true,passive:true});
document.addEventListener('visibilitychange',()=>{
  if(!AC)return;
  if(document.hidden){if(AC.state==='running')AC.suspend().catch(()=>{});}
  else AC.resume().catch(()=>{});
});
function sfx(kind,x,z){
  if(!AC||state!=='play')return;
  let vol=1;if(x!==undefined&&player){const d=Math.hypot(x-player.x,z-player.z);if(d>28)return;vol=1-d/32;}
  if(AC.state!=='running'){AC.resume().catch(()=>{});return;}
  if(!soundOn)return;
  playSound(AC,noiseBuf,kind,vol,master);
}
