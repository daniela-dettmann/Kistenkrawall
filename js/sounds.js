/* Kistenkrawall: alle Töne, komplett synthetisiert. Wird vom Spiel und von tonstudio.html genutzt. */
'use strict';
/* SOUND-START */
/* Playful retro sound set: everything is synthesized, cartoonish and tinny rather than threatening */
const SND=(function(){
  function osc(c,type,f0,f1,t0,dur,peak,att){
    const o=c.AC.createOscillator(),g=c.AC.createGain(),t=c.t+t0;
    o.type=type;o.frequency.setValueAtTime(f0,t);if(f1&&f1!==f0)o.frequency.exponentialRampToValueAtTime(f1,t+dur);
    g.gain.setValueAtTime(0.0001,t);g.gain.exponentialRampToValueAtTime(peak,t+(att||0.005));g.gain.exponentialRampToValueAtTime(0.0001,t+dur);
    o.connect(g);g.connect(c.out);o.start(t);o.stop(t+dur+0.02);return o;
  }
  function noise(c,t0,dur,peak,ftype,f0,f1,q){
    const s=c.AC.createBufferSource(),f=c.AC.createBiquadFilter(),g=c.AC.createGain(),t=c.t+t0;
    s.buffer=c.noise;f.type=ftype||'bandpass';f.frequency.setValueAtTime(f0,t);if(f1)f.frequency.exponentialRampToValueAtTime(f1,t+dur);f.Q.value=q||1;
    g.gain.setValueAtTime(0.0001,t);g.gain.exponentialRampToValueAtTime(peak,t+0.006);g.gain.exponentialRampToValueAtTime(0.0001,t+dur);
    s.connect(f);f.connect(g);g.connect(c.out);s.start(t,Math.random()*0.2,dur+0.05);
  }
  function wobble(o,c,t0,rate,depth,dur){
    const l=c.AC.createOscillator(),lg=c.AC.createGain(),t=c.t+t0;l.frequency.value=rate;lg.gain.value=depth;l.connect(lg);lg.connect(o.frequency);l.start(t);l.stop(t+dur+0.05);
  }
  const N={C5:523.25,D5:587.33,E5:659.25,G5:783.99,A5:880,C6:1046.5,E6:1318.5,G6:1568};
  return {
    shot(c){osc(c,'square',980,430,0,0.08,0.05);osc(c,'triangle',1960,860,0,0.05,0.025);},
    spritz(c){osc(c,'square',1500,1100,0,0.045,0.035);},
    pellet(c){noise(c,0,0.09,0.11,'bandpass',1400,500,1.2);osc(c,'square',260,140,0,0.1,0.06);osc(c,'triangle',520,300,0.03,0.08,0.03);},
    rocket(c){const o=osc(c,'sine',320,780,0,0.38,0.08,0.03);wobble(o,c,0,22,25,0.38);noise(c,0,0.32,0.05,'bandpass',900,2600,0.8);},
    kanone(c){osc(c,'sine',190,55,0,0.32,0.18);noise(c,0,0.12,0.09,'lowpass',1200,300,0.7);osc(c,'square',420,200,0.02,0.06,0.03);},
    hit(c){osc(c,'square',1250,1180,0,0.07,0.035);osc(c,'square',1790,1700,0,0.05,0.022);},
    boom(c){
      // cartoon "puff-bonk": rounded thump, a soft filtered poof and a tiny bubbly tail
      osc(c,'sine',150,42,0,0.38,0.2,0.008);
      noise(c,0,0.42,0.13,'lowpass',1400,180,0.6);
      osc(c,'triangle',640,330,0.08,0.09,0.03);osc(c,'triangle',540,280,0.15,0.09,0.025);
    },
    grollen(c){const o=osc(c,'sine',62,38,0,1.9,0.22,0.25);wobble(o,c,0,9,7,1.9);noise(c,0,2.0,0.16,'lowpass',320,70,0.7);osc(c,'triangle',96,50,0.5,1.2,0.07,0.2);},
    donner(c){noise(c,0,0.25,0.3,'lowpass',2400,300,0.5);noise(c,0.08,2.4,0.24,'lowpass',420,60,0.6);osc(c,'sine',70,34,0.05,2.2,0.2,0.12);},
    regen(c){noise(c,0,1.25,0.05,'bandpass',5200,4200,0.5);noise(c,0,1.25,0.03,'highpass',2600,2600,0.4);},
    pick(c){const o=osc(c,'triangle',330,760,0,0.14,0.11);wobble(o,c,0,28,18,0.14);},
    stack(c){osc(c,'sine',560,520,0,0.07,0.14);osc(c,'sine',410,380,0.075,0.09,0.12);noise(c,0,0.04,0.05,'bandpass',2200,1800,2);},
    open(c){[N.C5,N.E5,N.G5,N.C6].forEach((f,i)=>{osc(c,'square',f,f,i*0.075,0.12,0.04);osc(c,'triangle',f*2,f*2,i*0.075,0.1,0.02);});},
    gold(c){[N.E6,N.G6,N.C6,N.E6,N.G6].forEach((f,i)=>osc(c,'triangle',f,f*1.002,i*0.06,0.32,0.05,0.003));noise(c,0,0.5,0.025,'highpass',5000,7000,0.5);},
    recruit(c){osc(c,'square',440,440,0,0.07,0.04);osc(c,'square',660,660,0.08,0.07,0.04);const o=osc(c,'square',520,880,0.16,0.14,0.04);wobble(o,c,0.16,30,30,0.14);},
    plane(c){
      // cheerful toy plane: bright three-note honk, then a light, high buzzing motor that fades away (no low drone)
      [[N.C6,0],[N.E6,0.11],[N.G6,0.22]].forEach(([f,at])=>{osc(c,'triangle',f,f,at,0.13,0.05,0.004);osc(c,'square',f/2,f/2,at,0.1,0.012,0.004);});
      const AC=c.AC,t=c.t+0.4,dur=1.5,o=AC.createOscillator(),f=AC.createBiquadFilter(),g=AC.createGain(),am=AC.createGain(),l=AC.createOscillator(),lg=AC.createGain();
      o.type='triangle';o.frequency.setValueAtTime(300,t);o.frequency.linearRampToValueAtTime(360,t+dur*0.4);o.frequency.linearRampToValueAtTime(280,t+dur);
      f.type='lowpass';f.frequency.value=1800;
      l.frequency.value=26;lg.gain.value=0.35;am.gain.value=0.65;l.connect(lg);lg.connect(am.gain);
      g.gain.setValueAtTime(0.0001,t);g.gain.linearRampToValueAtTime(0.028,t+0.25);g.gain.linearRampToValueAtTime(0.0001,t+dur);
      o.connect(f);f.connect(am);am.connect(g);g.connect(c.out);o.start(t);l.start(t);o.stop(t+dur+0.05);l.stop(t+dur+0.05);
    },
    mg(c){osc(c,'square',720,520,0,0.045,0.03);noise(c,0,0.03,0.03,'bandpass',2400,1800,1.5);},
    moerser(c){osc(c,'sine',130,70,0,0.22,0.14);noise(c,0,0.1,0.06,'lowpass',900,300,0.7);const o=osc(c,'sine',600,1100,0.05,0.35,0.025,0.05);wobble(o,c,0.05,9,20,0.35);},
    build(c){for(let i=0;i<5;i++){osc(c,'square',300+i*60,280+i*60,i*0.07,0.05,0.04);noise(c,i*0.07,0.03,0.04,'bandpass',3000,2600,3);}osc(c,'triangle',N.C6,N.C6,0.4,0.18,0.04);},
    shield(c){const o=osc(c,'sine',300,900,0,0.35,0.07,0.02);wobble(o,c,0,14,40,0.35);osc(c,'triangle',N.E6,N.G6,0.2,0.3,0.03);},
    tempo(c){const o=osc(c,'square',220,1200,0,0.4,0.035,0.02);wobble(o,c,0,18,30,0.4);osc(c,'triangle',N.G5,N.C6,0.32,0.15,0.04);},
    repair(c){[N.C6,N.G5,N.C6,N.E6].forEach((f,i)=>osc(c,'triangle',f,f,i*0.09,0.2,0.045,0.004));},
    ammo(c){for(let i=0;i<3;i++){noise(c,i*0.09,0.05,0.07,'bandpass',2600-i*300,2000,2.5);osc(c,'square',900-i*120,700-i*120,i*0.09,0.04,0.03);}},
    whistle(c){const o=osc(c,'sine',1350,520,0,0.6,0.04,0.04);wobble(o,c,0,7,14,0.6);},
    xhit(c){[2093,3136,4186].forEach((f,i)=>osc(c,'sine',f,f,0,0.22-i*0.05,0.045-i*0.01,0.002));},
    sleigh(c){
      // a shaken string of sleigh bells, swelling in and fading out
      for(let i=0;i<14;i++){const t=i*0.11+Math.random()*0.02,v=Math.sin(Math.PI*(i+0.5)/14);
        noise(c,t,0.09,0.06*v,'bandpass',8200,7600,2.5);
        [3150,4370,5230].forEach(f=>osc(c,'sine',f*(1+Math.random()*0.01),f,t,0.1,0.012*v,0.001));}
    },
    drum(c){
      // gentle snare roll that swells, then a soft low tom
      const n=16,len=1.0;
      for(let i=0;i<n;i++)noise(c,i*(len/n)*(1-i*0.012),0.07,0.012+0.03*(i/n),'bandpass',1700,1700,0.9);
      osc(c,'sine',150,85,len+0.02,0.45,0.09,0.012);
    }
  };
})();
const SOUND_LIST=[
  ['Waffen',[['shot','Knipser'],['spritz','Spritzer'],['pellet','Streuer'],['rocket','Krachrohr'],['kanone','Panzerkanone'],['mg','Buggy-MG'],['moerser','Mörser']]],
  ['Treffer & Explosion',[['hit','Treffer'],['boom','Explosion']]],
  ['Kisten',[['pick','Kiste aufnehmen'],['stack','Kiste stapeln'],['open','Stapel öffnen'],['gold','Sonderkiste'],['recruit','Neuer Blechling']]],
  ['Werkstatt (gelbe Kisten)',[['ammo','Munition'],['repair','Reparatur'],['tempo','Tempo-Schub'],['shield','Schutzschild'],['build','Turm bauen']]],
  ['Signale & Luftschlag',[['drum','Angriffssignal'],['plane','Flieger im Anflug'],['whistle','Bombe fällt'],['grollen','Vulkan grollt']]],
  ['Wetter',[['regen','Regen'],['donner','Donner']]],
  ['Weihnachten',[['xhit','Treffer (Glöckchen)'],['sleigh','Schlittenglocken']]]
];
function playSound(AC,noiseBuf,kind,vol,dest){
  const f=SND[kind];if(!f||!AC)return;
  const out=AC.createGain();out.gain.value=vol==null?1:vol;out.connect(dest||AC.destination);
  f({AC,t:AC.currentTime+0.01,out,noise:noiseBuf});
  setTimeout(()=>{try{out.disconnect();}catch(e){}},4000);
}
/* SOUND-END */
