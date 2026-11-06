/* Kistenkrawall: Steuerung (Touch, Maus, Tastatur), Zielmarkierung, Aktionsknopf */
'use strict';
/* ---------- Input ---------- */
const keys={};
/* No page zoom: on iPhones a quick double tap or two fingers at once (stick + fire) used to zoom the whole page,
   and only rotating the phone reset it. Safari partly ignores user-scalable=no, so block the gestures as well. */
for(const ev of ['gesturestart','gesturechange','gestureend'])document.addEventListener(ev,e=>e.preventDefault(),{passive:false});
document.addEventListener('dblclick',e=>e.preventDefault(),{passive:false});
{let lastEnd=0;document.addEventListener('touchend',e=>{const now=performance.now();if(now-lastEnd<350&&e.cancelable&&!(e.target.closest&&e.target.closest('input,textarea')))e.preventDefault();lastEnd=now;},{passive:false});}
document.addEventListener('touchmove',e=>{if(e.touches.length>1&&e.cancelable&&e.scale!==undefined&&e.scale!==1)e.preventDefault();},{passive:false});
const joy={x:0,y:0,id:null};
const aimStick={x:0,y:0,id:null};
let fireHeld=false,mouseAim=null,mouseFire=false,portraitOk=false;
function bindStick(el,st){
  const knob=el.querySelector('.knob');
  const set=e=>{const r=el.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2,R=r.width/2-14;
    let dx=e.clientX-cx,dy=e.clientY-cy;const d=Math.hypot(dx,dy);if(d>R){dx*=R/d;dy*=R/d;}
    st.x=dx/R;st.y=dy/R;knob.style.transform=`translate(${dx}px,${dy}px)`;};
  el.addEventListener('pointerdown',e=>{e.preventDefault();initAudio();st.id=e.pointerId;try{el.setPointerCapture(e.pointerId);}catch(_){}set(e);});
  el.addEventListener('pointermove',e=>{if(e.pointerId===st.id)set(e);});
  const end=e=>{if(e.pointerId!==st.id)return;st.id=null;st.x=st.y=0;knob.style.transform='';el.classList.remove('firing');};
  el.addEventListener('pointerup',end);el.addEventListener('pointercancel',end);
}
bindStick($('#stickL'),joy);bindStick($('#stickR'),aimStick);

/* Desktop: drag with the mouse to turn the view */
let drag=null;
canvas.addEventListener('pointerdown',e=>{initAudio();if(e.pointerType==='mouse')drag={id:e.pointerId,x:e.clientX,y:e.clientY};});
window.addEventListener('pointermove',e=>{if(drag&&e.pointerId===drag.id&&camMode==='schulter'){camYaw-=(e.clientX-drag.x)*0.0065;camManualT=1.5;drag.x=e.clientX;drag.y=e.clientY;}});
const ray=new THREE.Raycaster(),ndc=new THREE.Vector2(),gplane=new THREE.Plane(new THREE.Vector3(0,1,0),0),hitP=new THREE.Vector3();
canvas.addEventListener('pointermove',e=>{
  if(e.pointerType!=='mouse'||camMode!=='taktik'||!player)return;
  ndc.set(e.clientX/innerWidth*2-1,-(e.clientY/innerHeight)*2+1);ray.setFromCamera(ndc,camera);
  gplane.constant=-(hgt(player.x,player.z)+1);
  if(ray.ray.intersectPlane(gplane,hitP))mouseAim={x:hitP.x,z:hitP.z,t:performance.now()};
});
canvas.addEventListener('pointerdown',e=>{if(e.pointerType==='mouse'&&e.button===0&&camMode==='taktik')mouseFire=true;});
window.addEventListener('pointerup',e=>{if(e.pointerType==='mouse')mouseFire=false;});
window.addEventListener('pointerup',e=>{if(drag&&e.pointerId===drag.id)drag=null;});
const bFire=$('#bFire');
bFire.addEventListener('pointerdown',e=>{e.preventDefault();initAudio();fireHeld=true;bFire.classList.add('held');flashBtn(bFire);});
const fireUp=()=>{fireHeld=false;bFire.classList.remove('held');};
bFire.addEventListener('pointerup',fireUp);bFire.addEventListener('pointercancel',fireUp);bFire.addEventListener('pointerleave',fireUp);
function syncCam(){$('#camIco').innerHTML=camMode==='taktik'?'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l9 5-9 5-9-5z"/><path d="M3 12l9 5 9-5" class="line"/><path d="M3 16l9 5 9-5" class="line"/></svg>':'<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="15" cy="8" r="3.4"/><path d="M8.5 21c0-4 2.8-7 6.5-7s6.5 3 6.5 7z"/><path d="M2 8l5 2.5-5 2.5z" opacity=".7"/></svg>';$('#camLbl').textContent=camMode==='taktik'?'Taktik':'Schulter';$('#stickR .stickLbl').textContent=camMode==='taktik'?'Zielen':'Blick';}
function toggleCam(){
  camMode=camMode==='taktik'?'schulter':'taktik';
  try{localStorage.setItem('kk-cam',camMode);}catch(e){}
  if(camMode==='schulter'&&player)camYaw=player.h;
  camManualT=0;syncCam();toast(camMode==='taktik'?'Taktik-Ansicht':'Schulterblick',1);
}
$('#zoomBtn').addEventListener('click',toggleCam);
function syncCollect(){const c=teams[player?player.team:0].collect||'blau';const b=$('#bCollect');b.dataset.c=c;$('#collectLbl').textContent=c==='gelb'?'Team: Gelb':'Team: Blau';}
function setCollect(c,quiet){if(MP==='guest'){netSendAct('collect');return;}teams[0].collect=c;syncCollect();for(const u of units)if(u.team===0&&u.plan==='fetch')u.thinkT=0;if(!quiet)toast(c==='gelb'?'Team sammelt jetzt gelbe Kisten':'Team sammelt jetzt blaue Kisten',1.5);}
$('#bCollect').addEventListener('pointerdown',e=>{e.preventDefault();flashBtn(e.currentTarget);setCollect(teams[0].collect==='gelb'?'blau':'gelb');});
/* Swipe anywhere on the right half to turn the view (shoulder) or the aim (tactical) */
let look={id:null,x:0},swipeAim=null,swipeT=-1e9;
const lz=$('#lookZone');
lz.addEventListener('pointerdown',e=>{e.preventDefault();initAudio();look.id=e.pointerId;look.x=e.clientX;try{lz.setPointerCapture(e.pointerId);}catch(_){}});
lz.addEventListener('pointermove',e=>{
  if(e.pointerId!==look.id)return;const dx=e.clientX-look.x;look.x=e.clientX;
  if(camMode==='taktik'){if(player){if(performance.now()-swipeT>1500)swipeAim=player.h;swipeAim-=dx*0.012;swipeT=performance.now();}}
  else{camYaw-=dx*0.0085;camManualT=1.2;}
});
const lookEnd=e=>{if(e.pointerId===look.id)look.id=null;};
lz.addEventListener('pointerup',lookEnd);lz.addEventListener('pointercancel',lookEnd);
syncCam();

/* Portrait hint on touch phones */
const coarse=window.matchMedia&&matchMedia('(pointer:coarse)').matches;
function checkOrientation(){
  const show=coarse&&!portraitOk&&state==='play'&&innerHeight>innerWidth;
  $('#rotate').hidden=!show;
}
$('#portraitBtn').addEventListener('click',()=>{portraitOk=true;checkOrientation();});
window.addEventListener('resize',checkOrientation);
function tryLandscape(){
  try{if(coarse&&screen.orientation&&screen.orientation.lock){
    const go=()=>screen.orientation.lock('landscape').catch(()=>{});
    if(document.documentElement.requestFullscreen&&!document.fullscreenElement)document.documentElement.requestFullscreen().then(go).catch(()=>{});else go();
  }}catch(e){}
}

$('#bAction').addEventListener('pointerdown',e=>{e.preventDefault();initAudio();flashBtn(e.currentTarget);contextAction();});
$('#bSwap').addEventListener('pointerdown',e=>{e.preventDefault();flashBtn(e.currentTarget);swapUnit();});
for(const b of document.querySelectorAll('.act'))b.addEventListener('click',e=>{if(e.detail===0){if(b.id==='bCollect'){setCollect(teams[0].collect==='gelb'?'blau':'gelb');}else if(b.id==='bFire'){if(player){const l=findLock(player,player.h,WEAPONS[player.weapon].range+3,.55);fire(player,l?Math.atan2(l.x-player.x,l.z-player.z):player.h);}}else if(b.id==='bAction')contextAction();else swapUnit();}});

window.addEventListener('keydown',e=>{
  const k=e.key.toLowerCase();keys[k]=true;initAudio();
  if(state==='play'){
    if(k===' '){fireHeld=true;e.preventDefault();}
    if((k==='c'||k==='z')&&!e.repeat)toggleCam();
    if(k==='x'&&!e.repeat)setCollect(teams[0].collect==='gelb'?'blau':'gelb');
    if((k==='e')&&!e.repeat)contextAction();
    if(k==='f'&&!e.repeat)crateAction();
    if(k==='r'&&!e.repeat)openAction();
    if((k==='q'||k==='tab')&&!e.repeat){swapUnit();e.preventDefault();}
    if((k==='escape'||k==='p')&&!e.repeat)pause(true);
  }else if(state==='pause'&&(k==='escape'||k==='p'))pause(false);
});
window.addEventListener('keyup',e=>{const k=e.key.toLowerCase();keys[k]=false;if(k===' ')fireHeld=false;});
window.addEventListener('blur',()=>{for(const k in keys)keys[k]=false;fireHeld=false;});

function crateAction(){
  const u=player;if(!u||!u.alive||state!=='play')return;
  if(isVeh(u)){toast('Fahrzeuge tragen keine Kisten',1.3);return;}
  const pad=pads[u.team],ep=pads[1-u.team];
  if(u.carry){
    if(dist(u,pad)<2.7&&pad.stack.length<8){const c=u.carry;u.carry=null;addToPad(c,pad,u);}
    else dropCrate(u,true);
    return;
  }
  let best=null,bd=2.0;
  for(const c of crates){if(c.state!=='ground')continue;const d=Math.hypot(c.x-u.x,c.z-u.z);if(d<bd){bd=d;best=c;}}
  if(best){pickCrate(u,best);return;}
  if(dist(u,ep)<2.8&&ep.stack.length){if(inPeace()){toast('Klauen geht nur während einer Welle',1.4);return;}stealCrate(u,ep);return;}
  toast('Keine Kiste in Reichweite',1.2);
}
function openAction(){
  const u=player;if(!u||!u.alive||state!=='play')return;
  if(isVeh(u)){toast('Das muss ein Blechling machen',1.3);return;}
  const pad=pads[u.team];
  if(dist(u,pad)>3.2){toast('Geh zu deiner Plattform',1.2);return;}
  if(!pad.stack.length){toast('Stapel ist leer',1.2);return;}
  openStack(u);
}
function swapUnit(){
  if(state!=='play'||!player)return;
  if(MP==='guest'){netSendAct('swap');return;}
  const mine=teamUnits(0);if(mine.length<2)return;
  const i=mine.indexOf(player);setPlayer(mine[(i+1)%mine.length]);
}
function setPlayer(u){
  if(player)player.lock=null;updateLockMarker(null);
  if(player&&player.tag)player.tag.el.classList.remove('me');
  player=u;u.plan='patrol';u.goal=null;u.tag.el.classList.add('me');
  camYaw=u.kind==='tank'?u.h:u.h;
  toast('Du steuerst '+u.name,1.3);
}
function onPlayerDown(){
  const mine=teamUnits(0);
  if(!mine.length&&respawns.some(r=>r.team===0))toast('Neuer Blechling in 20 Sekunden',2.2);
  if(mine.length){setTimeout(()=>{if(state==='play'&&(!player||!player.alive)){const m=teamUnits(0);if(m.length)setPlayer(m[0]);}},700);}
}


/* ---------- Lock-on marker ---------- */
const lockMarker=(function(){
  const c=document.createElement('canvas');c.width=c.height=128;const g=c.getContext('2d');
  g.strokeStyle='#ffffff';g.lineWidth=7;g.beginPath();g.arc(64,64,40,0,TAU);g.stroke();
  g.strokeStyle='#ff5a4f';g.lineWidth=5;g.beginPath();g.arc(64,64,40,0,TAU);g.stroke();
  g.fillStyle='#ff5a4f';for(let i=0;i<4;i++){g.save();g.translate(64,64);g.rotate(i*Math.PI/2);g.beginPath();g.moveTo(0,-30);g.lineTo(-9,-54);g.lineTo(9,-54);g.closePath();g.fill();g.restore();}
  g.beginPath();g.arc(64,64,5,0,TAU);g.fill();
  const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(c),transparent:true,depthTest:false,depthWrite:false}));
  sp.renderOrder=10;sp.visible=false;scene.add(sp);return sp;
})();
let lockShown=null,lockPop=0;
function updateLockMarker(t){
  if(!t||state!=='play'){lockMarker.visible=false;lockShown=null;return;}
  if(t!==lockShown){lockShown=t;lockPop=0.25;}
  const isHq=t.max!==undefined&&t.r>2,big=isVeh(t)?1.5:isHq?2.4:1;
  lockMarker.visible=true;
  lockMarker.position.set(t.x,hgt(t.x,t.z)+(isHq?2:isVeh(t)?1.5:1.1),t.z);
  lockPop=Math.max(0,lockPop-1/60);
  const sc=(1.5+lockPop*3)*big;lockMarker.scale.set(sc,sc,1);
  lockMarker.material.rotation+=0.03;
}

/* ---------- Touch button icons and context action ---------- */
const IC={
  pick:'<svg viewBox="0 0 32 32"><path d="M6 14h20v14H6z" opacity=".9"/><path d="M6 14h20v3H6z" opacity=".55"/><path d="M16 2l6 6h-4v4h-4V8h-4z"/></svg>',
  stack:'<svg viewBox="0 0 32 32"><path d="M5 20h10v9H5zM17 20h10v9H17zM11 10h10v9H11z" opacity=".9"/><path d="M16 9l4-4h-2.5V1h-3v4H12z"/></svg>',
  open:'<svg viewBox="0 0 32 32"><path d="M5 16h22v13H5z" opacity=".9"/><path d="M4 11l13-5 1.5 4-13 5z" opacity=".75"/><path d="M22 3l1 3 3 1-3 1-1 3-1-3-3-1 3-1zM27 11l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7z"/></svg>',
  toss:'<svg viewBox="0 0 32 32"><path d="M3 17h13v12H3z" opacity=".9"/><path d="M18 9c6 0 10 3 11 9l-3-1.5M18 9l3-3M18 9l3 3" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  steal:'<svg viewBox="0 0 32 32"><path d="M15 14h14v14H15z" opacity=".9"/><path d="M13 9c-6 0-9 4-9 10m9-10l-3-3m3 3l-3 3" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  place:'<svg viewBox="0 0 32 32"><path d="M7 24h18l-2 5H9z"/><path d="M12 14h8v10h-8z"/><path d="M10 9h12v6H10z"/><path d="M20 11h9v2.4h-9z"/><path d="M15 2h2v6h-2z" opacity=".6"/></svg>',
  none:'<svg viewBox="0 0 32 32"><path d="M6 10h20v18H6z" opacity=".55"/><path d="M6 10h20v3H6z" opacity=".35"/></svg>',
  swap:'<svg viewBox="0 0 32 32"><path d="M10 9h12v8H10z"/><path d="M13 12h2v2h-2zM17 12h2v2h-2z" fill="#0e1a16"/><path d="M15 5h2v4h-2z"/><path d="M6 21a10 10 0 0 0 18 3M26 15a10 10 0 0 0-1-3" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/><path d="M27 21l-3 4-3-3z"/></svg>'
};
let actMode='';
function contextFor(u){
  if(!u||!u.alive)return {m:'none'};
  if(placeQueue.length)return {m:'place',gold:placeQueue[0].boost};
  if(isVeh(u))return {m:'none',why:'Fahrzeuge tragen keine Kisten'};
  const pad=pads[u.team],ep=pads[1-u.team];
  if(u.carry)return (dist(u,pad)<2.7&&pad.stack.length<8)?{m:'stack'}:{m:'toss'};
  for(const c of crates){if(c.state==='ground'&&Math.hypot(c.x-u.x,c.z-u.z)<2.0)return {m:'pick',gold:c.gold};}
  if(dist(u,pad)<3.2&&rewardFor(pad.stack.length,stackSort(pad)))return {m:'open',gold:pad.stack.some(c=>c.gold)};
  if(dist(u,ep)<2.8&&ep.stack.length)return {m:'steal'};
  return {m:'none'};
}
const ACT_LABEL={place:'Bauen',pick:'Nehmen',stack:'Stapeln',toss:'Werfen',open:'Öffnen',steal:'Klauen',none:'Kiste'};
function contextAction(){
  const u=player;if(!u||!u.alive||state!=='play')return;
  if(MP==='guest'){netSendAct('action');return;}
  const c=contextFor(u);
  if(c.m==='place')tryPlace();
  else if(c.m==='open')openAction();
  else if(c.m==='none'){toast(c.why||'Keine Kiste in Reichweite',1.2);}
  else crateAction();
}
function flashBtn(el){el.classList.add('flash');clearTimeout(el._ft);el._ft=setTimeout(()=>el.classList.remove('flash'),160);}
