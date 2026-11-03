/* Kistenkrawall: Hintergrundmusik. Eigene Kompositionen im Stil funkiger Konsolenspiele der späten 90er,
   komplett live synthetisiert (keine Audiodateien). Wird vom Tonstudio und später vom Spiel genutzt.

   Notenschrift: Jeder Takt hat 16 Schritte (Sechzehntel), durch Leerzeichen getrennt.
     Melodie/Bass:  Notenname (E2, C#5, Bb3) = Ton anschlagen, "-" = Ton halten, "." = Pause
     Schlagzeug:    16 Zeichen, "X" = betont, "x" = normal, "g" = leise (Ghost Note), "." = nichts
     Akkord-Spuren: wie Schlagzeug, "-" hält den Akkord weiter; der Akkord kommt aus "chords"
     Akkorde:       ein Akkord pro Takt, "Em7|A7" = halber Takt Em7, halber Takt A7
   Eine Spur kann ein einzelner Takt (gilt für alle Takte) oder eine Liste von Takten sein (wird wiederholt). */
'use strict';
const MUSIC=(function(){
  const PITCH={C:0,D:2,E:4,F:5,G:7,A:9,B:11};
  function midi(name){
    const m=/^([A-G])([#b]?)(-?\d)$/.exec(name);
    if(!m)throw new Error('Unbekannte Note: '+name);
    return 12*(+m[3]+1)+PITCH[m[1]]+(m[2]==='#'?1:m[2]==='b'?-1:0);
  }
  const hz=n=>440*Math.pow(2,(n-69)/12);
  const CHORD={'':[0,4,7],m:[0,3,7],'7':[0,4,7,10],m7:[0,3,7,10],maj7:[0,4,7,11],m9:[0,3,7,10,14],'9':[0,4,7,10,14],
    '13':[0,4,10,14,21],'6':[0,4,7,9],dim:[0,3,6]};
  function chordNotes(name){
    const m=/^([A-G][#b]?)(.*)$/.exec(name);const iv=m&&CHORD[m[2]];
    if(!iv)throw new Error('Unbekannter Akkord: '+name);
    const root=midi(m[1]+'3'),out=[];
    for(const i of iv){let n=root+i;while(n<52)n+=12;while(n>74)n-=12;if(!out.includes(n))out.push(n);}
    return out.sort((a,b)=>a-b);
  }
  const VEL={X:1,x:0.75,g:0.35};
  function parseHits(str){
    if(str.length!==16)throw new Error('16 Schritte erwartet: "'+str+'"');
    const ev=[];let cur=null;
    for(let i=0;i<16;i++){const c=str[i];
      if(c==='-'){if(cur)cur.len++;}
      else if(VEL[c]){cur={step:i,v:VEL[c],len:1};ev.push(cur);}
      else if(c==='.')cur=null;
      else throw new Error('Unbekanntes Zeichen "'+c+'" in "'+str+'"');}
    return ev;
  }
  function parseLine(str){
    const t=str.trim().split(/\s+/);
    if(t.length!==16)throw new Error('16 Schritte erwartet, '+t.length+' gefunden: "'+str+'"');
    const ev=[];let cur=null;
    t.forEach((tok,i)=>{
      if(tok==='-'){if(cur)cur.len++;}
      else if(tok==='.')cur=null;
      else{cur={step:i,n:midi(tok),len:1,v:1};ev.push(cur);}
    });
    return ev;
  }

  /* ---------- Kompositionen ---------- */
  const DRUMS=['k','s','c','h','oh','cr'];   // Kick, Snare, Rimshot, Hi-Hat, offene Hi-Hat, Becken
  const LINES=['bass','lead','horn','vib'];  // einstimmige Spuren
  const COMPS=['organ','clav','brass'];      // Akkord-Spuren
  const TRACKS={
    menu:{
      title:'Titelthema',desc:'Läuft im Menü. Funk in E mit Slap-Bass, Clavinet und Bläsermelodie.',
      bpm:104,swing:0.09,loop:['A0','A','B','A'],
      sections:{
        A0:{chords:['Em9','Em9','A13','A13'],
          k:'X.....x...x.....',s:'....X..g.g..X..g',h:'x.x.x.x.x.x.x...',oh:'..............x.',
          bass:['E2 - . E3 . . E2 . . E2 G2 . A2 . B2 D3','E2 - . E3 . . E2 . . E2 G2 . A2 . B2 A2',
                'A1 - . A2 . . A1 . . A1 C#2 . E2 . G2 E2','A1 - . A2 . . A1 . E2 . G2 . G#2 . A2 B2'],
          clav:'x.g.x.gx.gx.x.g.',organ:'g---------------'},
        A:{chords:['Em9','Em9','A13','A13'],
          k:'X.....x...x.....',s:'....X..g.g..X..g',h:'x.x.x.x.x.x.x...',oh:'..............x.',
          cr:['X...............','................','................','................'],
          bass:['E2 - . E3 . . E2 . . E2 G2 . A2 . B2 D3','E2 - . E3 . . E2 . . E2 G2 . A2 . B2 A2',
                'A1 - . A2 . . A1 . . A1 C#2 . E2 . G2 E2','A1 - . A2 . . A1 . E2 . G2 . G#2 . A2 B2'],
          clav:'x.g.x.gx.gx.x.g.',organ:'g---------------',
          horn:['B4 - D5 E5 - . D5 . B4 . A4 - G4 . A4 .','B4 - - - . . . . . . E4 G4 A4 . B4 .',
                'C#5 - E5 F#5 - . E5 . C#5 . B4 - A4 . B4 .','C#5 - - - . . . . E5 . D5 . B4 . A4 .']},
        B:{chords:['Cmaj7','B7','Em9','A13'],
          k:'X.....x...x..x..',s:'....X..g.g..X..g',h:'x.x.x.x.x.x.x.x.',
          cr:['X...............','................','................','................'],
          bass:['C2 - . C3 . . C2 . . C2 E2 . G2 . B2 C3','B1 - . B2 . . B1 . . B1 D#2 . F#2 . A2 B2',
                'E2 - . E3 . . E2 . . E2 G2 . A2 . B2 D3','A1 - . A2 . . A1 . E2 . G2 . G#2 . A2 B2'],
          brass:'X.....x.....x...',organ:'g---------------',
          lead:['E5 - - . G5 - . . E5 . D5 . B4 - . .','D#5 - - . F#5 - . . A5 - . . F#5 . D#5 .',
                'E5 - - - - - - - . . . . . . . .','. . . . A4 . B4 . C#5 . E5 . F#5 . G5 .']}
      }
    },
    ruhe:{
      title:'Bauruhe',desc:'Locker zum Kistenschleppen: Orgel, Rimshot und Vibraphon in D, 90 BPM.',
      bpm:90,swing:0.15,loop:['A','A2','B','A2'],
      sections:{
        A:{chords:['Dm9','G13','Dm9','G13'],
          k:'X......x..x.....',c:'....x.......x...',h:'x.g.x.g.x.g.x.gg',
          bass:['D2 - . . D2 . A1 . C2 - . D2 . . F2 E2','G1 - . . G1 . D2 . F2 - . G2 . . B1 C2'],
          organ:'..x-..x-..x-.x-.'},
        A2:{chords:['Dm9','G13','Dm9','G13'],
          k:'X......x..x.....',c:'....x.......x...',h:'x.g.x.g.x.g.x.gg',
          bass:['D2 - . . D2 . A1 . C2 - . D2 . . F2 E2','G1 - . . G1 . D2 . F2 - . G2 . . B1 C2'],
          organ:'..x-..x-..x-.x-.',
          vib:['A4 - - . C5 - D5 . . . F5 - E5 - D5 -','B4 - - - - - . . . . . . . . . .',
               'A4 - - . C5 - D5 . . . F5 - A5 - G5 -','E5 - - - - - - - . . D5 . C5 . B4 .']},
        B:{chords:['Fmaj7','Em7|A7','Dm9','G13'],
          k:'X......x..x.....',c:'....x.......x...',h:'x.g.x.g.x.g.x.gg',oh:['................','..............x.'],
          bass:['F1 - . . F2 . C2 . E2 - . F2 . . A2 G2','E2 - . . E2 . B1 . A1 - . A1 . . C#2 E2',
                'D2 - . . D2 . A1 . C2 - . D2 . . F2 E2','G1 - . . G1 . D2 . F2 - . G2 . . B1 C#2'],
          organ:'..x-..x-..x-.x-.',clav:'x.....g.x.....g.',
          vib:['C5 - - - E5 - - - A5 - - - G5 - E5 -','G5 - - - - - - . C#5 - - - E5 - - -',
               'F5 - - - E5 - - - D5 - - - A4 - - -','B4 - - - - - - - . . . . . . . .']}
      }
    },
    angriff:{
      title:'Angriffswelle',desc:'Treibender Breakbeat in E-Moll mit Bläserstößen und Hook, 124 BPM.',
      bpm:124,swing:0.04,intro:['FILL'],loop:['A','A2','B','A2'],
      sections:{
        FILL:{chords:['Em7'],k:'X.......X.......',s:'....x.x.xxxxXXXX',brass:'X-..............',
          bass:'E2 - . . . . . . E2 - . . E2 . D#2 .'},
        A:{chords:['Em7','Em7','Cmaj7','D'],
          k:'X.....x.X.x.....',s:'....X.......X..g',h:'xgxgxgxgxgxgxgxg',
          cr:['X...............','................','................','................'],
          bass:['E2 . E3 E2 . E2 E3 . E2 . E3 E2 G2 . A2 B2','E2 . E3 E2 . E2 E3 . E2 . E3 E2 D3 . B2 G2',
                'C2 . C3 C2 . C2 C3 . C2 . C3 C2 E2 . F#2 G2','D2 . D3 D2 . D2 D3 . D2 . D3 D2 F#2 . A2 D#2'],
          brass:'X..x..x.......x.',organ:'g---------------'},
        A2:{chords:['Em7','Em7','Cmaj7','D'],
          k:'X.....x.X.x.....',s:'....X.......X..g',h:'xgxgxgxgxgxgxgxg',
          cr:['X...............','................','................','................'],
          bass:['E2 . E3 E2 . E2 E3 . E2 . E3 E2 G2 . A2 B2','E2 . E3 E2 . E2 E3 . E2 . E3 E2 D3 . B2 G2',
                'C2 . C3 C2 . C2 C3 . C2 . C3 C2 E2 . F#2 G2','D2 . D3 D2 . D2 D3 . D2 . D3 D2 F#2 . A2 D#2'],
          brass:'X..x..x.......x.',organ:'g---------------',
          lead:['E5 . E5 G5 - E5 . D5 . B4 . D5 - . E5 .','G5 - F#5 - E5 - D5 - B4 - - - . . . .',
                'E5 . E5 G5 - E5 . D5 . C5 . D5 - . E5 .','F#5 - - - A5 - - - F#5 . D5 . F#5 . A5 .']},
        B:{chords:['Am7','B7','Em7','Em7'],
          k:['X.....x.X.x.....','X.....x.X.x.....','X.....x.X.x.....','X.......X.X.X...'],
          s:['....X.......X..g','....X.......X..g','....X.......X..g','....X...xxxxXXXX'],
          h:['xgxgxgxgxgxgxgxg','xgxgxgxgxgxgxgxg','xgxgxgxgxgxgxgxg','xgxgxgxg........'],
          cr:['X...............','................','................','................'],
          bass:['A1 . A2 A1 . A1 A2 . A1 . A2 A1 C2 . D2 E2','B1 . B2 B1 . B1 B2 . B1 . B2 B1 D#2 . F#2 A2',
                'E2 . E3 E2 . E2 E3 . E2 . E3 E2 G2 . A2 B2','E2 - - - . . . . . . . . . . . .'],
          brass:['X.......X.......','X.......X.......','X...............','................'],
          horn:['A5 - G5 - E5 - C5 . A4 . C5 . E5 . G5 .','F#5 - - - D#5 - - - B4 . C5 . D#5 . F#5 .',
                'E5 - - - - - - - . . . . . . . .','. . . . . . . . . . . . . . . .']}
      }
    },
    sieg:{
      title:'Sieg',desc:'Kurze Fanfare, wenn das gegnerische Hauptquartier fällt.',
      bpm:132,swing:0,loop:['S'],once:true,
      sections:{
        S:{chords:['C|G','C'],
          k:['X...X...X...X...','X...............'],s:['..........x.xxxx','................'],cr:['................','X...............'],
          bass:['C2 . C2 . C2 . G1 - - . G1 . G1 - - -','C2 - - - - - - - - - - - . . . .'],
          brass:['X.x.x.X---x.X---','X-----------....'],
          horn:['G4 . C5 . E5 . G5 - - . E5 . G5 - - -','C6 - - - - - - - - - - - . . . .']}
      }
    },
    niederlage:{
      title:'Niederlage',desc:'Trauriger Posaunen-Abgang, wenn dein Hauptquartier fällt.',
      bpm:84,swing:0,loop:['L'],once:true,
      sections:{
        L:{chords:['Cm|G7','Cm'],
          k:['X...............','X...............'],cr:['................','x...............'],
          bass:['C2 - - . B1 - - . Bb1 - - . A1 - - -','C2 - - - - - - - . . . . . . . .'],
          brass:['................','X-----------....'],
          horn:['G4 - - . F#4 - - . F4 - - . E4 - - -','Eb4 - - - - - - - - - - - . . . .']}
      }
    }
  };

  // Compile every section once; a typo in the notes throws here with a clear message.
  for(const [tname,tr] of Object.entries(TRACKS)){
    for(const [sname,sec] of Object.entries(tr.sections)){
      const bars=sec.chords.length,list=v=>Array.isArray(v)?v:[v];
      try{
        sec.bars=[];
        for(let b=0;b<bars;b++){
          const bar={chords:sec.chords[b].split('|').map((c,i,a)=>({step:i*16/a.length,notes:chordNotes(c),root:c})),parts:{}};
          for(const k of DRUMS.concat(COMPS))if(sec[k]){const p=list(sec[k]);bar.parts[k]=parseHits(p[b%p.length]);}
          for(const k of LINES)if(sec[k]){const p=list(sec[k]);bar.parts[k]=parseLine(p[b%p.length]);}
          sec.bars.push(bar);
        }
      }catch(e){throw new Error('Musik '+tname+'/'+sname+': '+e.message);}
    }
  }

  /* ---------- Instrumente ---------- */
  function create(ctx,dest){
    const noise=ctx.createBuffer(1,ctx.sampleRate,ctx.sampleRate);
    {const d=noise.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;}
    // Organ tone: drawbar-like mix of harmonics
    const organWave=(()=>{const im=new Float32Array([0,1,.85,.5,.3,.3,0,.18,0,.1]);return ctx.createPeriodicWave(new Float32Array(im.length),im);})();

    // Master: soft saturation and a gentle lowpass give the slightly gritty late-90s console sound,
    // plus a short hall reverb like the console sound chips of that era had built in.
    const master=ctx.createGain();master.gain.value=0.5;master.connect(dest);
    const lp=ctx.createBiquadFilter();lp.type='lowpass';lp.frequency.value=10500;lp.Q.value=0.5;lp.connect(master);
    const sat=ctx.createWaveShaper();{const n=1024,c=new Float32Array(n);for(let i=0;i<n;i++){const x=i/(n-1)*2-1;c[i]=Math.tanh(1.6*x)/Math.tanh(1.6);}sat.curve=c;}
    sat.connect(lp);
    const mix=ctx.createGain();mix.gain.value=0.55;mix.connect(sat);
    const verb=ctx.createConvolver();{
      const len=Math.floor(ctx.sampleRate*1.7),ir=ctx.createBuffer(2,len,ctx.sampleRate);
      for(let ch=0;ch<2;ch++){const d=ir.getChannelData(ch);for(let i=0;i<len;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/len,3.2);}
      verb.buffer=ir;}
    const verbOut=ctx.createGain();verbOut.gain.value=0.5;verb.connect(verbOut);verbOut.connect(mix);

    function env(g,t,a,peak,hold,rel){
      g.gain.setValueAtTime(0.0001,t);g.gain.exponentialRampToValueAtTime(peak,t+a);
      g.gain.setValueAtTime(peak,t+Math.max(a,hold));g.gain.exponentialRampToValueAtTime(0.0001,t+Math.max(a,hold)+rel);
      return t+Math.max(a,hold)+rel;
    }
    function noiseHit(out,t,dur,peak,type,freq,q){
      const s=ctx.createBufferSource(),f=ctx.createBiquadFilter(),g=ctx.createGain();
      s.buffer=noise;f.type=type;f.frequency.value=freq;f.Q.value=q||0.7;
      g.gain.setValueAtTime(peak,t);g.gain.exponentialRampToValueAtTime(0.0001,t+dur);
      s.connect(f);f.connect(g);g.connect(out);s.start(t,Math.random()*0.5,dur+0.02);
    }
    function tone(out,type,f,t,a,peak,hold,rel,f1){
      const o=ctx.createOscillator(),g=ctx.createGain();o.type=type;o.frequency.setValueAtTime(f,t);
      if(f1)o.frequency.exponentialRampToValueAtTime(f1,t+hold+rel);
      const end=env(g,t,a,peak,hold,rel);o.connect(g);g.connect(out);o.start(t);o.stop(end+0.02);return o;
    }
    const INST={
      k(o,t,v){
        const os=ctx.createOscillator(),g=ctx.createGain();os.frequency.setValueAtTime(160,t);os.frequency.exponentialRampToValueAtTime(42,t+0.13);
        g.gain.setValueAtTime(v*0.95,t);g.gain.exponentialRampToValueAtTime(0.0001,t+0.34);os.connect(g);g.connect(o);os.start(t);os.stop(t+0.36);
        noiseHit(o,t,0.008,v*0.25,'highpass',3000);
      },
      s(o,t,v){noiseHit(o,t,0.17,v*0.5,'bandpass',1900,0.8);tone(o,'triangle',215,t,0.002,v*0.26,0.01,0.08,165);},
      c(o,t,v){tone(o,'triangle',1750,t,0.001,v*0.16,0.004,0.03);noiseHit(o,t,0.03,v*0.2,'bandpass',3200,4);},
      h(o,t,v){noiseHit(o,t,0.045,v*0.13,'highpass',7500);},
      oh(o,t,v){noiseHit(o,t,0.3,v*0.12,'highpass',7000);},
      cr(o,t,v){noiseHit(o,t,1.5,v*0.16,'highpass',5200);noiseHit(o,t,0.9,v*0.06,'bandpass',9000,1);},
      bass(o,t,n,d,v){
        const f=hz(n),flt=ctx.createBiquadFilter(),g=ctx.createGain();
        flt.type='lowpass';flt.Q.value=7;flt.frequency.setValueAtTime(2600,t);flt.frequency.exponentialRampToValueAtTime(380,t+0.18);
        const a=ctx.createOscillator(),b=ctx.createOscillator();a.type='sawtooth';b.type='square';a.frequency.value=f;b.frequency.value=f;b.detune.value=-6;
        const ga=ctx.createGain();ga.gain.value=0.6;b.connect(ga);a.connect(flt);ga.connect(flt);flt.connect(g);g.connect(o);
        const end=env(g,t,0.004,v*0.3,d,0.05);a.start(t);b.start(t);a.stop(end+0.02);b.stop(end+0.02);
        tone(o,'triangle',f*4,t,0.001,v*0.07,0.005,0.03);   // the slap "click"
      },
      organ(o,t,notes,d,v){
        const flt=ctx.createBiquadFilter();flt.type='lowpass';flt.frequency.value=4200;flt.connect(o);
        const lfo=ctx.createOscillator(),lg=ctx.createGain();lfo.frequency.value=6.2;lg.gain.value=7;lfo.connect(lg);
        let end=t;
        for(const n of notes){const os=ctx.createOscillator(),g=ctx.createGain();os.setPeriodicWave(organWave);os.frequency.value=hz(n);lg.connect(os.detune);
          end=env(g,t,0.008,v*0.045,d,0.06);os.connect(g);g.connect(flt);os.start(t);os.stop(end+0.02);}
        lfo.start(t);lfo.stop(end+0.02);
      },
      clav(o,t,notes,d,v){
        for(const n of notes){const os=ctx.createOscillator(),f=ctx.createBiquadFilter(),g=ctx.createGain();
          os.type='square';os.frequency.value=hz(n+12);f.type='bandpass';f.frequency.value=1500;f.Q.value=1.4;
          g.gain.setValueAtTime(v*0.07,t);g.gain.exponentialRampToValueAtTime(0.0001,t+Math.min(d,0.2)+0.04);
          os.connect(f);f.connect(g);g.connect(o);os.start(t);os.stop(t+Math.min(d,0.2)+0.06);}
      },
      brass(o,t,notes,d,v,mono){
        const flt=ctx.createBiquadFilter();flt.type='lowpass';flt.Q.value=1.2;
        flt.frequency.setValueAtTime(500,t);flt.frequency.exponentialRampToValueAtTime(3400,t+0.05);flt.frequency.exponentialRampToValueAtTime(1500,t+0.25);flt.connect(o);
        let end=t;
        for(const n of notes){for(const det of [-9,9]){
          const os=ctx.createOscillator(),g=ctx.createGain();os.type='sawtooth';os.detune.value=det;
          if(mono){os.frequency.setValueAtTime(hz(n)*0.97,t);os.frequency.exponentialRampToValueAtTime(hz(n),t+0.05);}else os.frequency.value=hz(n);
          end=env(g,t,0.025,v*(mono?0.06:0.03),d,0.09);os.connect(g);g.connect(flt);os.start(t);os.stop(end+0.02);}}
      },
      horn(o,t,n,d,v){INST.brass(o,t,[n],d,v,true);},
      lead(o,t,n,d,v){
        const f=hz(n),flt=ctx.createBiquadFilter();flt.type='lowpass';flt.frequency.value=3200;flt.connect(o);
        const lfo=ctx.createOscillator(),lg=ctx.createGain();lfo.frequency.value=5.5;lg.gain.setValueAtTime(0,t);lg.gain.linearRampToValueAtTime(14,t+Math.min(d,0.35));lfo.connect(lg);
        const a=tone(flt,'square',f,t,0.01,v*0.055,d,0.07),b=tone(flt,'triangle',f*2,t,0.01,v*0.025,d,0.07);
        lg.connect(a.detune);lg.connect(b.detune);lfo.start(t);lfo.stop(t+d+0.1);
      },
      vib(o,t,n,d,v){
        // bell-like: body, a quiet detuned partner for shimmer, and a short bright overtone
        const f=hz(n),ring=Math.max(0.6,d+0.3);
        tone(o,'sine',f,t,0.003,v*0.1,0.01,ring);tone(o,'sine',f*1.003,t,0.003,v*0.04,0.01,ring);tone(o,'sine',f*4,t,0.002,v*0.03,0.005,0.25);
      }
    };
    const GROUP={k:'drums',s:'drums',c:'drums',h:'drums',oh:'drums',cr:'drums',bass:'bass',organ:'keys',clav:'keys',vib:'keys',brass:'brass',horn:'brass',lead:'lead'};
    const SEND={drums:0.08,bass:0,keys:0.22,brass:0.18,lead:0.25};
    const LEVEL={drums:1,bass:1,keys:1,brass:1,lead:1};

    function makeBus(){
      const dry=ctx.createGain(),wet=ctx.createGain();dry.connect(mix);wet.connect(verb);
      const groups={};
      for(const [name,send] of Object.entries(SEND)){const g=ctx.createGain();g.gain.value=LEVEL[name];g.connect(dry);
        if(send){const s=ctx.createGain();s.gain.value=send;g.connect(s);s.connect(wet);}groups[name]=g;}
      return {dry,wet,groups};
    }
    function fadeBus(bus,t,to,dur){for(const g of [bus.dry,bus.wet]){g.gain.cancelScheduledValues(t);g.gain.setValueAtTime(g.gain.value,t);g.gain.linearRampToValueAtTime(to,t+dur);}}

    /* ---------- Sequenzer ---------- */
    let cur=null,pending=null,timer=null,listener=null;
    function startTrack(name,t){
      const tr=TRACKS[name];if(!tr)throw new Error('Unbekanntes Stück: '+name);
      if(cur)retire(cur.bus,t,0.05);
      cur={name,tr,seq:(tr.intro||[]).concat(tr.loop),pos:0,bar:0,next:t,bus:makeBus()};
    }
    function retire(bus,t,fade){fadeBus(bus,t,0,fade);setTimeout(()=>{try{bus.dry.disconnect();bus.wet.disconnect();}catch(e){}},(t-ctx.currentTime+fade+3)*1000);}
    function scheduleBar(){
      const tr=cur.tr,sname=cur.seq[cur.pos],sec=tr.sections[sname],bar=sec.bars[cur.bar];
      const sd=60/tr.bpm/4,t0=cur.next,G=cur.bus.groups;
      const at=step=>t0+step*sd+(step%2?tr.swing*sd:0);
      const chordAt=step=>{let c=bar.chords[0];for(const ch of bar.chords)if(ch.step<=step)c=ch;return c.notes;};
      for(const [k,ev] of Object.entries(bar.parts)){
        const out=G[GROUP[k]];
        for(const e of ev){
          const t=at(e.step),d=e.len*sd*0.92;
          if(DRUMS.includes(k))INST[k](out,t,e.v);
          else if(COMPS.includes(k))INST[k](out,t,chordAt(e.step),d,e.v);
          else INST[k](out,t,e.n,d,e.v);
        }
      }
      if(listener){const info={track:cur.name,section:sname,bar:cur.bar,bars:sec.bars.length};const delay=Math.max(0,(t0-ctx.currentTime)*1000);setTimeout(()=>listener(info),delay);}
      cur.next=t0+16*sd;
      if(++cur.bar>=sec.bars.length){cur.bar=0;cur.pos++;
        if(cur.pos>=cur.seq.length){
          if(tr.once){const end=cur.next;const bus=cur.bus;cur=null;setTimeout(()=>{try{bus.dry.disconnect();bus.wet.disconnect();}catch(e){}if(listener)listener(null);},(end-ctx.currentTime+3)*1000);return false;}
          cur.pos=(tr.intro||[]).length;
        }}
      return true;
    }
    function pump(until){
      while(cur&&cur.next<until){
        if(pending){const p=pending;pending=null;startTrack(p,cur.next);}
        if(!scheduleBar())break;
      }
      if(!cur&&timer){clearInterval(timer);timer=null;}
    }
    function ensureTimer(){if(!timer)timer=setInterval(()=>pump(ctx.currentTime+0.5),100);}

    return {
      tracks:TRACKS,
      /** Plays a piece. If music is already running, the switch happens cleanly at the next bar. */
      play(name,opts){
        opts=opts||{};
        if(cur&&!opts.now&&!TRACKS[name].once){pending=name;return;}
        startTrack(name,ctx.currentTime+0.08);ensureTimer();pump(ctx.currentTime+0.5);
      },
      stop(fade){
        if(!cur)return;fade=fade==null?0.8:fade;retire(cur.bus,ctx.currentTime,fade);cur=null;pending=null;
        if(timer){clearInterval(timer);timer=null;}if(listener)listener(null);
      },
      get playing(){return cur?cur.name:null;},
      set volume(v){master.gain.setTargetAtTime(v,ctx.currentTime,0.05);},
      get volume(){return master.gain.value;},
      onBar(fn){listener=fn;},
      /** For offline rendering and tests: schedule everything up to time `until` right now. */
      renderUntil(name,until){startTrack(name,0.05);pump(until);}
    };
  }
  return {create,tracks:TRACKS};
})();
