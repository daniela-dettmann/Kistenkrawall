// Smoke test: starts the game in a real browser and fails if anything is broken.
// Usage: node tests/smoke.cjs [folder]   (default: repository root)
// Runs in GitHub Actions before every deploy; a failure stops the deploy.
// The multiplayer part runs only locally, see 'Mehrspieler' below.
'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
// Note: CI machines have no GPU, so WebGL is software-rendered at only a few frames per second.
// Clicks therefore use force (no waiting for 'stable' elements) and waits are generous.

const ROOT = path.resolve(process.argv[2] || path.join(__dirname, '..'));
// The browser test runs on a temporary copy, so it can pretend that a new version was deployed.
const SERVE = fs.mkdtempSync(path.join(require('os').tmpdir(), 'kk-smoke-'));
function setVersion(v) {
  const edit = (f, re, to) => { const p = path.join(SERVE, f); fs.writeFileSync(p, fs.readFileSync(p, 'utf8').replace(re, to)); };
  edit('index.html', /<meta name="kk-version" content="[^"]*" data-date="[^"]*">/, `<meta name="kk-version" content="${v}" data-date="2026-01-02">`);
  edit('sw.js', /const VERSION = '[^']*';/, `const VERSION = 'kk-${v}';`);
  fs.writeFileSync(path.join(SERVE, 'version.json'), JSON.stringify({ version: v, date: '2026-01-02' }));
}
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json',
  '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' };

let failed = 0;
const ok = msg => console.log('  ok   ' + msg);
const bad = msg => { failed++; console.log('  FAIL ' + msg); };
const check = (cond, msg) => (cond ? ok(msg) : bad(msg));
// On GitHub the browser test runs in four parts at the same time (KK_PART=1..4, see .github/workflows/pages.yml).
// Without KK_PART (locally) everything runs. Part 1: game, offline, save; 2: sound studio, Christmas, mountain;
// 3: graphics, day/night and weather, airport, city, jungle; 4: desert, Christmas market, volcano, update notice. The multiplayer part only runs locally.
const PART = +process.env.KK_PART || 0;
const part = n => !PART || PART === n;

function serve() {
  const server = http.createServer((req, res) => {
    let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    if (p.endsWith('/')) p += 'index.html';
    const file = path.join(SERVE, p);
    if (!file.startsWith(SERVE) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); return res.end('not found'); }
    res.writeHead(200, { 'content-type': TYPES[path.extname(file)] || 'application/octet-stream' });
    fs.createReadStream(file).pipe(res);
  });
  return new Promise(r => server.listen(0, '127.0.0.1', () => r(server)));
}

function staticChecks() {
  console.log('Dateien');
  const sw = fs.readFileSync(path.join(ROOT, 'sw.js'), 'utf8');
  const pre = [...sw.match(/const PRECACHE = \[([\s\S]*?)\];/)[1].matchAll(/'\.\/([^']*)'/g)].map(m => m[1]).filter(Boolean);
  for (const f of pre) if (!fs.existsSync(path.join(ROOT, f))) bad('sw.js speichert ' + f + ', aber die Datei fehlt');
  const refs = new Set();
  for (const page of ['index.html', 'tonstudio.html', 'fonts/fonts.css', 'manifest.webmanifest']) {
    const txt = fs.readFileSync(path.join(ROOT, page), 'utf8'), dir = path.dirname(page);
    for (const m of txt.matchAll(/(?:src|href)="([^"#:]+)"|url\(([^):]+)\)|"src":\s*"([^"]+)"/g)) {
      const ref = (m[1] || m[2] || m[3]).replace(/^\.\//, '');
      if (/^https?:/.test(ref)) continue;
      const norm = path.posix.normalize(path.posix.join(dir, ref));
      refs.add(norm === '.' ? 'index.html' : norm);   // a link to ./ is the start page
    }
  }
  for (const r of refs) {
    if (!fs.existsSync(path.join(ROOT, r))) bad('verlinkt, aber fehlt: ' + r);
    else if (!pre.includes(r)) bad(r + ' wird geladen, steht aber nicht in sw.js (PRECACHE) – offline würde es fehlen');
  }
  check(!/https?:\/\/(?!threejs\.org)/.test(fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8')), 'index.html lädt nichts von fremden Servern');
  ok(refs.size + ' verlinkte Dateien geprüft, ' + pre.length + ' Einträge im Offline-Speicher');
}

async function main() {
  staticChecks();
  fs.cpSync(ROOT, SERVE, { recursive: true, filter: src => !/node_modules|\.git$/.test(src) });
  setVersion('aaa111');
  const server = await serve();
  const base = 'http://127.0.0.1:' + server.address().port + '/';
  const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const ctx = await browser.newContext({ viewport: { width: 960, height: 540 } });
  await ctx.addInitScript(() => {
    window.__osc = 0;
    const C = window.AudioContext;
    window.AudioContext = class extends C { createOscillator() { window.__osc++; return super.createOscillator(); } };
  });
  const page = await ctx.newPage();
  page.setDefaultTimeout(30000);
  const errors = [], foreign = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('response', r => { if (r.status() >= 400) errors.push(r.status() + ' ' + r.url()); });
  page.on('request', r => { if (!r.url().startsWith(base) && !r.url().startsWith('data:') && !r.url().startsWith('blob:')) foreign.push(r.url()); });

  // the new menu: „Spielen“ opens the start screen, „Los geht's“ starts the round
  const startRound = async p => { if (await p.isVisible('#playBtn')) await p.click('#playBtn', { force: true }); await p.click('#startBtn', { force: true }); };
  const openPlay = async p => { await p.waitForSelector('#playBtn', { state: 'visible' }); await p.click('#playBtn', { force: true }); };
  // shared checks for the maps with buildings (Stadt, Flughafen, Wüste): map choice, no crate on a roof, routes, round, shots
  async function urbanMapChecks(page, m, name, q) {
    await page.goto(base + (q || '?normal'));
    await openPlay(page);
    await Promise.all([page.waitForNavigation(), page.click('#mapSeg [data-m="' + m + '"]', { force: true })]);
    await page.waitForSelector('#startBtn', { state: 'visible' });
    check(await page.evaluate(m => MAP === m && URBAN && URB.boxes.length >= (m === 'mond' ? 10 : 17) && localStorage.getItem('kk-map') === m, m), name + ': Kartenwahl, Gebäude stehen');
    check(await page.evaluate(() => {
      // crates never land on a roof: 600 drop spots, and a crate the wind pushes towards a house stays on the ground
      for (let i = 0; i < 600; i++) { const sp = dropSpot(DROPS[i % 2], i % 3 ? 1 : -1, i % 7 === 0); if (!urbanFree(sp.x, sp.z, 1)) return false; }
      DN.setWeather('regen', true, 1); DN.wx.s = 1; updateMood(0.05); const b = URB.boxes[0];
      const c = spawnCrate(b.x0 - 1.4, (b.z0 + b.z1) / 2, true, false, 'blau'); WX.dir = 0;
      for (let i = 0; i < 200; i++) wxCrate(c, 0.1);
      const ok = urbanFree(c.x, c.z, 1); removeCrate(c); DN.setWeather('klar', false); DN.wx.s = 0; return ok;
    }), name + ': Kisten landen nie auf Dächern, auch nicht durch Wind');
  if (m === 'wueste' || m === 'mond' || m === 'dschungel' || m === 'weihnachtsmarkt') check(await page.evaluate(() => URB.zones.every(zs => {
    // each crate colour lands on both halves of the field: on average as close to one base as to the other
    const d = b => zs.reduce((a, r) => a + r.w * Math.hypot((r.x0 + r.x1) / 2 - b.x, (r.z0 + r.z1) / 2 - b.z), 0);
    return Math.abs(d(BASES[0]) - d(BASES[1])) < 0.5 && zs.some(r => r.z1 > 0) && zs.some(r => r.z0 < 0);
  })), name + ': blaue und gelbe Kisten landen auf beiden Seiten, für beide Basen gleich weit');
    check(await page.evaluate(() => {
      // every unit, on foot and in a tank, from both bases to every drop zone, the gold spot, the pads and the enemy HQ: arrives, never inside a building
      const goals = [];
      for (const zs of URB.zones.concat([URB.gold])) for (const z of zs) goals.push({ x: (z.x0 + z.x1) / 2, z: (z.z0 + z.z1) / 2 });
      goals.push({ x: hqs[1].x, z: hqs[1].z + 4 }, { x: pads[0].x, z: pads[0].z }, { x: pads[1].x, z: pads[1].z });
      for (const kind of [undefined, 'tank']) for (const team of [0, 1]) for (const g of goals) {
        const B = BASES[team], u = spawnUnit(team, B.x + 2, B.z + (team ? 3 : -3), 'kaempfer', kind); let i = 0, inside = 0;
        const gg = navNearest(navGrid(kind ? 1 : 0), navCell(g.x), navCell(g.z)), gx = NAV.O + gg[0] + 0.5, gz = NAV.O + gg[1] + 0.5;
        for (; i < 4000; i++) { if (moveToward(u, gx, gz, 0.05, ALLY, 1.6)) break; resolve(u); if (!urbanFree(u.x, u.z, (u.r || 0.45) - 0.05)) inside++; }
        u.alive = false; scene.remove(u.bot.g); scene.remove(u.bot.blob); u.tag.el.remove(); units.splice(units.indexOf(u), 1);
        if (i >= 4000 || inside) return false;
      }
      return true;
    }), name + ': Wegfindung: Blechling und Panzer beider Teams kommen überall hin, durch Gassen, Tore und um Gebäude');
    await startRound(page);
    await page.waitForTimeout(1500);
    check(await page.evaluate(() => state === 'play' && renderer.info.render.calls > 50 && renderer.info.render.calls < 500), name + ': Runde läuft, unter 500 Zeichenvorgänge pro Bild');
    check(await page.evaluate(() => {
      // a house stops direct shots; the mortar lobs over it (the shots themselves are followed, other units may join the fight)
      peaceT = 0; const b = URB.boxes.find(b => ['house', 'hangar', 'gate', 'pyr', 'boulder', 'temple', 'stall'].includes(b.k) && b.x0 > -40 && b.x1 < 40), cz = (b.z0 + b.z1) / 2;
      const a = spawnUnit(0, b.x0 - 2, cz, 'kaempfer'), e = spawnUnit(1, b.x1 + 2, cz, 'kaempfer');
      const pin = () => { a.x = b.x0 - 2; a.z = cz; e.x = b.x1 + 2; e.z = cz; };
      pin(); a.cd = 0; const before = new Set(shots); fire(a, Math.PI / 2); const mine = shots.filter(s => !before.has(s)); let maxX = -99;
      for (let i = 0; i < 60; i++) { update(0.02); pin(); for (const s of mine) if (shots.includes(s)) maxX = Math.max(maxX, s.x); }
      const direct = mine.length > 0 && mine.every(s => !shots.includes(s)) && maxX < b.x1 && urbanBlocked(a.x, a.z, e.x, e.z);
      a.alive = false; const mo = spawnUnit(0, b.x0 - 2, cz, 'fahrzeug', 'moerser'); e.hp = e.maxHp; const hp2 = e.hp;
      mo.cd = 0; mo.h = mo.hull = Math.PI / 2; const b2 = new Set(shots); fire(mo, Math.PI / 2, 1, e); const shell = shots.find(s => !b2.has(s));
      for (let i = 0; i < 200; i++) { update(0.02); mo.x = b.x0 - 2; mo.z = cz; e.x = b.x1 + 2; e.z = cz; }
      const lob = !!shell && shell.arc && shell.x1 > b.x1 && !shots.includes(shell) && e.hp < hp2;
      for (const u of [a, e, mo]) { u.alive = false; scene.remove(u.bot.g); scene.remove(u.bot.blob); u.tag.el.remove(); units.splice(units.indexOf(u), 1); }
      return direct && lob;
    }), name + ': Gebäude halten Schüsse auf, nur der Mörser schießt darüber');
  }
  const clickHidden = (p, sel) => p.evaluate(sel => document.querySelector(sel).click(), sel);
  if (part(1)) {   // Spiel
  console.log('Spiel');
  await page.goto(base);
  await page.waitForSelector('#playBtn', { state: 'visible' });
  check(await page.evaluate(() => typeof THREE === 'object' && THREE.REVISION === '128'), 'three.js r128 geladen');
  check(await page.evaluate(() => [...document.querySelectorAll('#panelStart button')].filter(b => b.offsetParent).map(b => b.id).join() === 'playBtn,netBtn,settingsBtn'), 'Hauptmenü: nur Spielen, Mehrspieler, Einstellungen');
  check(await page.evaluate(() => {
    // the multiplayer screen shows the connection steps and copies a log without addresses (#48)
    document.querySelector('#netBtn').click();
    const steps = [...document.querySelectorAll('#netSteps li')].map(li => li.textContent);
    netLog('Test 192.168.178.20 und fe80::1c2b:3a4d:5e6f:7a8b');
    const t = netDiagText(); diagReset(); document.querySelector('#netBack').click();
    return steps.length === 5 && /Vermittlungsserver erreicht/.test(steps[0]) && /Art der Verbindung/.test(steps[3]) && /Spiel läuft/.test(steps[4])
      && /^Kistenkrawall Verbindungsprotokoll/.test(t) && /Version: .* · /.test(t) && !/192\.168|fe80/.test(t) && /\[Adresse\]/.test(t)
      && !!document.querySelector('#netDiagCopy') && !!document.querySelector('#netOverlayCopy');
  }), 'Mehrspieler: Verbindungsdetails mit fünf Schritten, „Details kopieren“ ohne Adressen');
  check(/^Zuletzt: Insel, normal/.test(await page.textContent('#lastLine')), 'Hauptmenü zeigt die letzte Wahl');
  check(await page.evaluate(() => [...document.querySelectorAll('#menu button')].filter(b => b.offsetParent).every(b => b.getBoundingClientRect().height >= 44)), 'Tippflächen im Menü mindestens 44 px hoch');
  check(await page.evaluate(() => /user-scalable=no/.test(document.querySelector('meta[name=viewport]').content) && /maximum-scale=1/.test(document.querySelector('meta[name=viewport]').content)), 'Seite lässt sich nicht versehentlich zoomen');
  check(await page.evaluate(() => document.fonts.check("20px 'Bowlby One SC'")), 'Schrift Bowlby One SC geladen');
  // software rendering makes the start slow, so record whether the hint ever appeared instead of looking at one moment
  await page.evaluate(() => { const el = document.querySelector('#joyHint'); new MutationObserver(() => { if (!el.hidden) window.__jhShown = true; }).observe(el, { attributes: true }); });
  await startRound(page);
  await page.waitForSelector('#hud', { state: 'visible' });
  check(await page.evaluate(() => window.__jhShown === true), 'Starthinweis erscheint bei neuem Spiel');
  await page.waitForTimeout(1500);
  check(await page.evaluate(() => renderer.info.render.calls > 50), '3D-Szene wird gezeichnet');
  check(await page.evaluate(() => state === 'play' && units.length >= 6), 'Runde läuft mit beiden Teams');
  check(await page.evaluate(() => music && /^ruhe(_x)?$/.test(music.playing || '')), 'Musik: Bauruhe läuft beim Rundenstart');
  check(await page.evaluate(() => soundVol === 0.7 && musicVol === 0.1 && mainVol === 1 && natVol === 0.5 && natureOut && mainOut), 'Standardlautstärke: Gesamt 100 %, Musik 10 %, Effekte 70 %, Natur und Wetter 50 %');
  await page.click('#pauseBtn', { force: true });
  check(await page.evaluate(() => state === 'pause'), 'Pause funktioniert');
  check(await page.evaluate(() => ['resumeBtn', 'pauseSetBtn', 'restartBtn', 'quitBtn'].every(id => document.getElementById(id).offsetParent) && document.querySelector('#quitBtn').textContent === 'Hauptmenü'), 'Pausenmenü: Weiter, Einstellungen, Neu starten, Hauptmenü');
  await page.click('#pauseSetBtn', { force: true });
  check(await page.evaluate(() => document.querySelector('#setBack').textContent === 'Zurück zur Pause' && document.querySelector('.later').offsetParent !== null), 'Einstellungen aus der Pause: „Zurück zur Pause“ und Hinweis „Gilt ab der nächsten Runde“');
  check(await page.evaluate(() => {
    const c = sel => document.querySelector(sel).click(), r = [];
    c('#diffSegS [data-d=schwer]'); r.push(diffKey === 'schwer' && D === DIFFS.normal && localStorage.getItem('kk-diff') === 'schwer'); c('#diffSegS [data-d=normal]');
    c('.tile[data-s=grafik]'); c('#shadowToggle'); r.push(renderer.shadowMap.type === THREE.PCFShadowMap && localStorage.getItem('kk-soft') === '0'); c('#shadowToggle'); r.push(renderer.shadowMap.type === THREE.PCFSoftShadowMap);
    c('#trailToggle'); r.push(!SNOW.trails && localStorage.getItem('kk-trails') === '0'); c('#trailToggle');
    c('.tile[data-s=spiel]'); c('#tipsToggle'); r.push(document.documentElement.classList.contains('notips') && localStorage.getItem('kk-tips') === '0'); c('#tipsToggle');
    c('.tile[data-s=steuerung]'); c('#invertToggle'); r.push(lookInv === -1 && localStorage.getItem('kk-inv') === '1'); c('#invertToggle');
    c('.tile[data-s=ton]'); const m = document.querySelector('.musVol input'); m.value = 0.3; m.dispatchEvent(new Event('input')); const n = document.querySelector('.natVol input'), g = document.querySelector('.mainVol input'); n.value = 0.2; n.dispatchEvent(new Event('input')); g.value = 0.6; g.dispatchEvent(new Event('input'));
    r.push(musicVol === 0.3 && document.querySelector('#musNum').textContent === '30' && natVol === 0.2 && localStorage.getItem('kk-nat') === '0.2' && mainVol === 0.6 && document.querySelector('#mainNum').textContent === '60');
    m.value = 0.1; m.dispatchEvent(new Event('input')); n.value = 0.5; n.dispatchEvent(new Event('input')); g.value = 1; g.dispatchEvent(new Event('input')); localStorage.removeItem('kk-nat'); localStorage.removeItem('kk-main');
    c('.tile[data-s=spiel]');
    return r.join();
  }) === 'true,true,true,true,true,true,true', 'Einstellungen wirken sofort und werden gespeichert (Schwierigkeit erst nächste Runde)');
  await page.keyboard.press('Escape');
  check(await page.evaluate(() => state === 'pause' && !document.querySelector('#panelPause').hidden && document.querySelector('#panelSettings').hidden), 'Escape in den Einstellungen führt zurück zur Pause');
  await page.click('#attackNowBtn', { force: true });
  await page.waitForTimeout(800);
  check(await page.evaluate(() => window.__osc > 0 && AC && AC.state === 'running'), 'Ton: Angriffssignal wird abgespielt');
  await page.keyboard.down('Space'); await page.waitForTimeout(1500); await page.keyboard.up('Space');
  check(await page.evaluate(() => window.__osc > 1), 'Ton: Schüsse werden abgespielt');
  await page.evaluate(() => AC.suspend());
  await page.mouse.click(480, 300);
  await page.waitForTimeout(300);
  check(await page.evaluate(() => AC.state === 'running'), 'Ton kommt nach Unterbrechung beim nächsten Tippen zurück');
  await page.waitForTimeout(3000);
  check(await page.evaluate(() => state === 'play'), 'Spiel läuft nach 3 Sekunden Kampf weiter');
  check(await page.evaluate(() => /^angriff(_x)?$/.test(music.playing || '')), 'Musik: Angriffsmusik während der Welle');
  check(await page.$eval('#fail', el => el.hidden), 'kein Fehlerbildschirm');
  await page.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, get: () => true }); document.dispatchEvent(new Event('visibilitychange')); });
  check(await page.evaluate(() => state === 'pause'), 'pausiert automatisch, wenn die App in den Hintergrund geht');
  await page.evaluate(() => { delete document.hidden; document.dispatchEvent(new Event('visibilitychange')); });
  await page.click('#resumeBtn', { force: true });
  // the jingle lasts only about 3.6 s; on a busy test machine a later look can come after it has ended,
  // so record which piece the round end starts instead of sampling what is playing afterwards
  check(await page.evaluate(() => { const played = [], p = music.play; music.play = function (n, o) { played.push(n); return p.call(this, n, o); };
    try { endGame(true, 'Test.'); } finally { music.play = p; }
    return played.length > 0 && played.every(n => /^sieg(_x)?$/.test(n)) && /^sieg(_x)?$/.test(music.playing || ''); }), 'Musik: Sieg-Jingle am Rundenende');

  console.log('App / offline');
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.waitForTimeout(500);
  const cached = await page.evaluate(async () => { const k = await caches.keys(); return k.length ? (await (await caches.open(k[0])).keys()).length : 0; });
  check(cached >= 25, 'Service Worker hat ' + cached + ' Dateien gespeichert');
  await ctx.setOffline(true);
  await page.reload();
  await page.waitForSelector('#playBtn', { state: 'visible' });
  await startRound(page);
  await page.waitForTimeout(1500);
  check(await page.evaluate(() => state === 'play' && renderer.info.render.calls > 50), 'Spiel startet offline');
  await ctx.setOffline(false);

  console.log('Spielstand');
  await page.evaluate(() => { pause(true); });
  await page.click('#attackNowBtn', { force: true });
  await page.waitForTimeout(2500);
  // build up a richer situation: stacked crates, a turret, a buggy, a shield, damaged HQ, a carried crate
  await page.evaluate(() => {
    const free = crates.filter(c => c.state === 'ground');
    for (const c of free.slice(0, 3)) addToPad(c, pads[0], null);
    buildTurret(0, 8, 20, true);
    const b = spawnUnit(0, -6, 30, 'fahrzeug', 'buggy'); b.hp = 99;
    giveShield(player, 77);
    hqs[1].hp = hqs[1].max * 0.6;
    const loose = crates.find(c => c.state === 'ground');
    const carrier = units.find(u => u.alive && u.team === 0 && u !== player && u.kind === 'bot' && !u.carry);
    if (loose && carrier) { carrier.carry = loose; loose.state = 'carry'; }
    stats.kills = 4;
  });
  const sum = () => page.evaluate(() => ({
    wave: waveNo, peace: Math.round(peaceT), diff: diffKey, kills: stats.kills,
    hq: hqs.map(h => Math.round(h.hp)), stacks: pads.map(p => p.stack.length),
    player: player && player.id, shield: player && Math.round(player.shield || 0),
    carried: units.filter(u => u.alive && u.carry).map(u => u.id).sort(),
    units: units.filter(u => u.alive).map(u => [u.id, u.team, u.kind, u.weapon, Math.round(u.hp), Math.round(u.x * 10), Math.round(u.z * 10), u.name]).sort((a, b) => a[0] - b[0]),
  }));
  await page.click('#pauseBtn', { force: true });
  const saved = await sum();
  const size = await page.evaluate(() => (localStorage.getItem('kk-save') || '').length);
  check(size > 1000 && size < 400000, 'Spielstand gespeichert (' + Math.round(size / 1024) + ' KB)');
  await page.reload();
  await page.waitForSelector('#playBtn', { state: 'visible' });
  check(/gespeicherte Runde/.test(await page.textContent('#lastLine')), 'Hauptmenü weist auf die gespeicherte Runde hin');
  await openPlay(page);
  await page.waitForSelector('#continueBtn', { state: 'visible' });
  const info = await page.textContent('#continueInfo');
  check(/Welle 1 läuft · Normal · gespeichert (gerade eben|vor 1 Min\.)/.test(info), 'Menü zeigt „Weiterspielen“: ' + info);
  check((await page.textContent('#startBtn')) === 'Neues Spiel', 'Startknopf heißt jetzt „Neues Spiel“');
  await page.click('#continueBtn', { force: true });
  await page.waitForTimeout(500);
  check(await page.evaluate(() => state === 'pause'), 'Fortsetzen startet im Pausenmenü');
  check(await page.$eval('#joyHint', el => el.hidden), 'kein Starthinweis nach dem Fortsetzen');
  const after = await sum();
  for (const k of Object.keys(saved)) {
    const same = JSON.stringify(saved[k]) === JSON.stringify(after[k]);
    check(same, 'wiederhergestellt: ' + k + (same ? '' : ' (vorher ' + JSON.stringify(saved[k]).slice(0, 200) + ', nachher ' + JSON.stringify(after[k]).slice(0, 200) + ')'));
  }
  await page.click('#resumeBtn', { force: true });
  await page.keyboard.down('Space'); await page.waitForTimeout(2500); await page.keyboard.up('Space');
  check(await page.evaluate(() => state === 'play' && renderer.info.render.calls > 50), 'fortgesetzte Runde läuft weiter');
  await page.evaluate(() => endGame(false, 'Test.'));
  check(await page.evaluate(() => localStorage.getItem('kk-save') === null), 'Spielstand nach Rundenende gelöscht');
  await page.click('#toMenuBtn', { force: true });
  check(await page.$eval('#continueBtn', b => b.hidden), 'danach kein „Weiterspielen“ mehr');
  }

  if (part(2)) {   // Tonstudio
  console.log('Tonstudio');
  await page.goto(base + 'tonstudio.html');
  const before = await page.evaluate(() => window.__osc);
  await page.click('#snd-shot', { force: true });
  await page.waitForTimeout(200);
  check(await page.evaluate(() => document.querySelectorAll('.pad').length === SOUND_LIST.reduce((n, g) => n + g[1].length, 0) && SOUND_LIST.length >= 6), 'alle Töne im Tonstudio, auch Weihnachten');
  check(await page.evaluate(b => window.__osc > b, before), 'Tonstudio spielt Töne ab');
  check(await page.evaluate(() => document.querySelectorAll('.track').length === Object.keys(MUSIC.tracks).length && !!MUSIC.tracks.ruhe_x), 'alle Musikstücke im Tonstudio, auch Weihnachten');
  await page.click('#play-ruhe', { force: true });
  await page.waitForTimeout(2500);
  check(await page.evaluate(() => music && music.playing === 'ruhe'), 'Musik: Bauruhe spielt');
  check(await page.$eval('#play-ruhe', b => b.closest('.track').querySelector('.pos').textContent.startsWith('Teil')), 'Musik: Taktanzeige läuft');
  await page.click('#toAttack', { force: true });
  await page.waitForTimeout(6000);
  check(await page.evaluate(() => music.playing === 'angriff'), 'Musik: Wechsel Bauruhe → Angriff am Taktanfang');
  await page.click('#play-angriff', { force: true });
  await page.waitForTimeout(300);
  check(await page.evaluate(() => music.playing === null), 'Musik: Stopp funktioniert');
  }

  if (part(2)) {   // Weihnachtsedition
  console.log('Weihnachtsedition');
  await page.goto(base + '?weihnachten');
  await page.waitForSelector('#playBtn', { state: 'visible' });
  check(await page.evaluate(() => XMAS && document.documentElement.classList.contains('xmas')), 'mit ?weihnachten aktiv');
  check(await page.evaluate(() => [new Date(2026, 9, 31), new Date(2026, 10, 1), new Date(2026, 11, 31), new Date(2027, 0, 10), new Date(2027, 0, 11)].map(d => xmasSeason(d)).join() === 'false,true,true,true,false'),
    'Saison: 1. November bis 10. Januar');
  check(await page.isVisible('.xribbon') && await page.$eval('#xmasRow', e => !e.hidden), 'Banderole „Weihnachtsedition“ und Schalter in den Einstellungen');
  await startRound(page);
  await page.waitForTimeout(1200);
  check(await page.evaluate(() => { const b = units.filter(u => u.kind === 'bot'); return b.length > 0 && b.every(u => ['santa', 'elf', 'snowman'].includes(u.bot.costume)) && new Set(b.map(u => u.bot.costume)).size >= 2; }), 'Blechlinge als Weihnachtsmänner, Elfen und Schneemänner');
  check(await page.evaluate(() => crates.length > 0 && crates.every(c => c.bow)), 'Kisten mit Geschenkschleife');
  check(await page.evaluate(() => { const v = []; for (let x = -40; x <= 40; x += 4) for (let z = -40; z <= 40; z += 4) v.push(snowCover(x, z)); return SNOW.deep > 8 && v.some(a => a < 0.2) && v.some(a => a > 0.8); }),
    'Schnee liegt ungleich: dünne Stellen und tiefe Schneefelder mit Verwehungen');
  await page.evaluate(() => { const t = spawnUnit(0, player.x + 3, player.z, 'fahrzeug', 'tank'); pause(true); });
  await page.click('#attackNowBtn', { force: true });
  await page.waitForTimeout(400);
  check(await page.evaluate(() => { const t = units.find(u => u.kind === 'tank' && u.team === 0); const n = shots.length; t.cd = 0; fire(t, t.h, 1); const s = shots.slice(n); player.cd = 0; fire(player, player.h, 1); const all = shots.slice(n); return s.length > 0 && all.length >= 2 && all.every(x => x.m.userData.xmas) && s[0].m.userData.spin; }),
    'Schlitten verschießt Geschenke, Knipser Christbaumkugeln');
  check(await page.evaluate(() => !!(window.xmasSleigh && xmasSleigh.deer.length === 6)), 'Weihnachtsmann-Schlitten mit Rentieren bereit');
  check(await page.evaluate(() => /_x$/.test(music.playing || '') && wantedMusic() === 'angriff_x'), 'Weihnachtsmusik läuft: ' + await page.evaluate(() => music.playing));
  check(await page.evaluate(() => NAMES.includes('Zimtstern') && LINES.kill.includes('Ab in den Kamin!')), 'weihnachtliche Namen und Sprüche');
  await page.waitForTimeout(2000);
  check(await page.evaluate(() => state === 'play' && renderer.info.render.calls > 50), 'Weihnachtsrunde läuft');
  await page.goto(base + '?normal');
  await page.waitForSelector('#playBtn', { state: 'visible' });
  check(await page.evaluate(() => !XMAS && !document.documentElement.classList.contains('xmas') && units.every(u => !u.bot.costume)) && !(await page.isVisible('.xribbon')), 'mit ?normal die normale Version');
  }

  if (part(2)) {   // Gebirge
  console.log('Gebirge');
  await page.goto(base + '?normal');
  await page.waitForSelector('#playBtn', { state: 'visible' });
  check(await page.evaluate(() => MAP === 'insel' && document.querySelector('#mapSeg [data-m="insel"]').getAttribute('aria-pressed') === 'true'), 'Standardkarte ist die Insel');
  await openPlay(page);
  await Promise.all([page.waitForNavigation(), page.click('#mapSeg [data-m="gebirge"]', { force: true })]);
  await page.waitForSelector('#startBtn', { state: 'visible' });
  check(await page.evaluate(() => MAP === 'gebirge' && localStorage.getItem('kk-map') === 'gebirge' && document.querySelector('#mapSeg [data-m="gebirge"]').getAttribute('aria-pressed') === 'true'), 'Kartenwahl: Gebirge gewählt und gemerkt');
  check(await page.isVisible('#startBtn') && !await page.isVisible('#playBtn'), 'nach dem Kartenwechsel ist der Spielstart wieder offen');
  check(await page.evaluate(() => hgtRaw(0, 0) < -8 && Math.abs(hgt(-18, 5) - 0.38) < 0.05 && Math.abs(hgt(18, 4.5) - 0.4) < 0.1 && hgtRaw(21.5, 4.5) > 4 && hgt(0, 44) < 1.5),
    'Gebirge: tiefe Schlucht, Brücke und Pass auf Laufhöhe, Felswände am Pass, Basis im Tal');
  check(await page.evaluate(() => {
    const out = [];
    for (const kind of [undefined, 'tank']) for (const bx of BRIDGES) for (const team of [0, 1]) {
      const s = team ? -1 : 1, u = spawnUnit(team, bx * 0.6, s * 36, 'kaempfer', kind); let i = 0, via = false;
      for (; i < 6000; i++) { if (moveToward(u, bx * 0.6, -s * 36, 0.05, ALLY, 1.5)) break; if (Math.abs(u.z) < 1 && Math.abs(u.x - bx) < crossW(bx)) via = true; }
      out.push(i < 6000 && via);
      u.alive = false; scene.remove(u.bot.g); scene.remove(u.bot.blob); u.tag.el.remove(); units.splice(units.indexOf(u), 1);
    }
    return out.every(Boolean);
  }), 'Wegfindung: Blechling und Panzer beider Teams kommen über Brücke und Pass');
  await startRound(page);
  await page.waitForTimeout(1500);
  check(await page.evaluate(() => state === 'play' && renderer.info.render.calls > 50 && !!window.mountainDrift), 'Runde auf dem Gebirge läuft, mit Schneetreiben');
  { const s0 = await page.evaluate(() => SNOW.stamps); await page.waitForTimeout(2500);
    check(await page.evaluate(s0 => SNOW.stamps > s0, s0), 'Schnee: Blechlinge hinterlassen im laufenden Spiel Fußspuren (ohne Nachhilfe im Test)'); }
  check(await page.evaluate(() => {
    const rt = SNOW.target(), R = rt.width, px = new Uint8Array(4), x0 = player.x, z0 = player.z;
    for (let i = 0; i < 40; i++) { moveUnit(player, 1, 0, 0.05, 1); updateMood(0.05); }
    let mx = 0; for (let k = 0; k < 50; k++) { const x = x0 + k * 0.3, i = Math.floor((x / 112 + 0.5) * R), j = Math.floor((z0 / 112 + 0.5) * R); renderer.readRenderTargetPixels(rt, i, j, 1, 1, px); mx = Math.max(mx, px[0]); }
    player.x = x0; player.z = z0;
    const d = SNOW.drifts[0], u = spawnUnit(0, d.x, d.z, 'kaempfer'); const a = u.x; moveUnit(u, 1, 0, 0.1, 1); const slow = u.x - a; u.x = 30; u.z = 30; const b = u.x; moveUnit(u, 1, 0, 0.1, 1); const fast = u.x - b;
    u.alive = false; scene.remove(u.bot.g); scene.remove(u.bot.blob); u.tag.el.remove(); units.splice(units.indexOf(u), 1);
    return SNOW.on && mx > 60 && SNOW.domes.count > 50 && SNOW.drifts.length > 20 && Math.abs(slow / fast - SNOW.slow) < 0.01 && crates.every(c => c.snowCap);
  }), 'Schnee: Fußspuren in der Spurenkarte, Verwehungen bremsen leicht, Schneehauben auf Kisten');
  check(await page.evaluate(() => mountainCut.on.value === 1 && mountainCut.p.value.distanceTo(new THREE.Vector3(player.x, mountainCut.p.value.y, player.z)) < 0.5), 'Gebirge: Durchblick-Loch folgt der Figur');
  await page.evaluate(() => pause(true));
  await page.goto(base + '?normal&karte=insel');
  await openPlay(page);
  await page.waitForSelector('#continueBtn', { state: 'visible' });
  check((await page.textContent('#continueInfo')).startsWith('Gebirge · '), 'Spielstand merkt die Karte: ' + await page.textContent('#continueInfo'));
  await Promise.all([page.waitForNavigation(), page.click('#continueBtn', { force: true })]);
  await page.waitForFunction(() => typeof state !== 'undefined' && state === 'pause', null, { timeout: 60000 }).catch(() => {});
  check(await page.evaluate(() => MAP === 'gebirge' && state === 'pause'), 'Weiterspielen lädt das Gebirge und setzt fort');
  await page.goto(base + '?weihnachten&karte=gebirge');
  await page.waitForSelector('#playBtn', { state: 'visible' });
  await startRound(page);
  await page.waitForTimeout(1200);
  check(await page.evaluate(() => XMAS && MOUNTAIN && units.filter(u => u.kind === 'bot').every(u => u.bot.costume) && crates.every(c => c.bow) && !!window.xmasSleigh), 'Weihnachtsedition auf dem Gebirge');
  await page.evaluate(() => { endGame(true, 'Test.'); localStorage.setItem('kk-map', 'insel'); });
  }

  if (part(3)) {   // Grafik
  console.log('Grafik');
  await page.goto(base + '?normal&karte=insel');
  await page.waitForSelector('#playBtn', { state: 'visible' });
  check(await page.evaluate(() => GFX.mode === 'schoen' && document.querySelector('#gfxSeg [data-g=schoen]').getAttribute('aria-pressed') === 'true' && typeof gfxRender === 'function'), 'Grafik: Standard ist „Schön“');
  await startRound(page);
  await page.waitForTimeout(1500);
  const lit = () => page.evaluate(() => {
    gfxRender(); const gl = renderer.getContext(), w = gl.drawingBufferWidth, h = gl.drawingBufferHeight, px = new Uint8Array(4); let sum = 0;
    for (const [fx, fy] of [[0.5, 0.5], [0.25, 0.3], [0.75, 0.3], [0.5, 0.8]]) { gl.readPixels(Math.floor(w * fx), Math.floor(h * fy), 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px); sum += px[0] + px[1] + px[2]; }
    return sum;
  });
  check(await page.evaluate(() => GFX.ok && !!GFX.water && !!GFX.contact && GFX.contact.visible && sun.shadow.mapSize.x === 2048) && await lit() > 200, 'Grafik „Schön“: Bildeffekte zeichnen ein Bild, Uferschaum und Schattenflecken sind da');
  check(await page.evaluate(() => {
    DN.fixed = 0.5; for (let i = 0; i < 40; i++) updateMood(0.05); updateCamera(0.05); gfxRender();
    const gl = renderer.getContext(), w = gl.drawingBufferWidth, h = gl.drawingBufferHeight, px = new Uint8Array(w * h * 4); gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, px);
    let hot = 0; for (let i = 0; i < w * h; i++) if (Math.max(px[i * 4], px[i * 4 + 1], px[i * 4 + 2]) >= 250) hot++;
    DN.fixed = null; return hot / (w * h) < 0.02;
  }), 'Grafik „Hoch“ überstrahlt nicht: unter 2 % ganz helle Bildpunkte am Mittag');
  check(await page.evaluate(() => {
    // depth in the distance: far away colours fade into the haze (aerial perspective inside the fog step, no extra pass)
    const prog = renderer.info.programs.map(p => p.name).length > 0;
    return GFX.aerialOn && GFX.aerial > 0.3 && /kkAir/.test(THREE.ShaderChunk.fog_fragment) && prog;
  }), 'Tiefe in der Ferne: Luftperspektive im Nebel, ohne zusätzlichen Bilddurchgang');
  check(await page.evaluate(() => {
    // grass gives way: a pusher next to the camera bends the blades (the picture changes); on „Niedrig“ no pushers
    const keep = updateMood, cam = updateCamera, cx = -20, cz = 30; updateMood = () => {}; updateCamera = () => { camera.position.set(cx, 14, cz + 0.1); camera.lookAt(cx, 0, cz); }; updateCamera();
    const shot = () => { gfxRender(); const gl = renderer.getContext(), w = gl.drawingBufferWidth, h = gl.drawingBufferHeight, px = new Uint8Array(w * h * 4); gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, px); return px; };
    const n0 = GFX.bend.n.value; GFX.bend.n.value = 0; const a = shot(); GFX.bend.u.value[0].set(cx, cz, 8, 1); GFX.bend.n.value = 1; const b = shot();
    let diff = 0; for (let i = 0; i < a.length; i += 4) if (Math.abs(a[i] - b[i]) + Math.abs(a[i + 1] - b[i + 1]) > 40) diff++;
    GFX.bend.n.value = n0; updateMood = keep; updateCamera = cam;
    const m = GFX.mode; GFX.mode = 'schnell'; updateMood(0.05); const low = GFX.bend.n.value === 0; GFX.mode = m; updateMood(0.05);
    return diff > 300 && low;
  }), 'Gras biegt sich, wo Blechlinge laufen, auf „Niedrig“ aus');
  check(await page.evaluate(() => {
    // shinier metal: arms, feet and plates mirror more, the head too, the paint gets a clear coat; the lower half of the reflection is the map's ground
    const u = units.find(o => o.bot && o.bot.paint && o.kind !== 'turm');
    return M.metal.reflectivity >= 0.45 && M.metal.shininess >= 130 && !!u && u.bot.head.reflectivity > 0.25 && (u.bot.paint.userData.kkTags || []).includes('coat')
      && !!LOOK.envGround && LOOK.envScene.children.length >= 2;
  }), 'Blechlinge: glänzenderes Metall, Klarlack, Spiegelung mit dem Boden der Karte');
  check(await page.evaluate(() => {
    const u = spawnUnit(0, 0, 30, 'kaempfer'); let n = 0; u.bot.g.traverse(o => { if (o.isMesh && o.visible) n++; });
    u.alive = false; scene.remove(u.bot.g); scene.remove(u.bot.blob); u.tag.el.remove(); units.splice(units.indexOf(u), 1);
    return n <= 17 && renderer.shadowMap.autoUpdate === false;
  }), 'Blechlinge sind je Gelenk zusammengefasst, der Schatten wird nur jedes zweite Bild neu gezeichnet');
  check(await page.evaluate(() => { const n = parts.length; boom(0, 20, 3); return parts.length >= n + 8; }), 'Explosion mit Druckwelle, Funken, Feuerball, Rauch und Glut');
  check(await page.evaluate(() => {
    const W = GFX.water, d = WATER.dist;
    const shore = d.at(-18, 7.2), river = d.at(-30, 0), sea = d.at(0, 75);
    const n = parts.length; gfxSplash(-30, 0, true);
    return W && W.uniforms.uDeep && W.mat.userData.kkTags.includes('water') && shore < 1.5 && river > 1 && sea > 10 && parts.length >= n + 8 && WATER.q.value === 1;
  }), 'Wasser: Küstenabstand berechnet, Tiefenfarbe und Schaum im Shader, Spritzer mit Tropfen und Schaumring');
  check(await page.evaluate(() => renderer.toneMapping === THREE.CustomToneMapping && !document.querySelector('#vignette').hidden && GFX.ao > 1000 && G.crate.userData.kkRound
    && LOOK.wind.value >= 1 && LOOK.rim.value > 0 && LOOK.rimC.value.r > LOOK.rimC.value.b && !!M.blob.map && LOOK.crateBlobs.count > 0 && !!M.metal.envMap && GFX.fade.a.value > 30 && typeof gfxSplash === 'function'), 'Schön: Belichtungskurve, dunklere Ecken, Schattierung in Senken, runde Kanten, Wind, Lichtsaum, Metallglanz, Gras blendet aus');
  check(await page.evaluate(() => { const n = parts.length; const u = units.find(v => v.alive && v.team === 0 && v.kind === 'bot'); const pt = peaceT; peaceT = 0; u.cd = 0; u.carry = null;
    const ok = fire(u, u.h); peaceT = pt; return ok && parts.length > n; }), 'Mündungsfeuer beim Schießen');
  check(await page.evaluate(() => { gfxRender(); return GFX.merged.roots > 200 && GFX.merged.meshes < 160 && renderer.info.render.calls < 700 && obstacles.length > 80; }), 'Bäume, Felsen und Brücken sind zusammengefasst: unter 700 Zeichenvorgänge pro Bild');
  await page.evaluate(() => { pause(true); toMenu(); });
  await clickHidden(page, '#fpsToggle');
  await page.waitForTimeout(1300);
  check(await page.evaluate(() => !document.querySelector('#fps').hidden && /FPS/.test(document.querySelector('#fps').textContent) && localStorage.getItem('kk-fps') === '1'), 'FPS-Anzeige lässt sich einschalten');
  await page.evaluate(() => localStorage.removeItem('kk-fps'));
  await clickHidden(page, '#gfxSeg [data-g=schnell]');
  check(await page.evaluate(() => GFX.mode === 'schnell' && localStorage.getItem('kk-gfx') === 'schnell' && document.querySelector('#gfxSeg [data-g=schnell]').getAttribute('aria-pressed') === 'true' && !GFX.contact.visible && sun.shadow.mapSize.x === 1024) && await lit() > 200,
    'Grafik „Niedrig“: umschaltbar, gemerkt, zeichnet ohne Bildeffekte');
  check(await page.evaluate(() => { updateMood(0.05); return document.querySelector('#vignette').hidden && LOOK.rim.value > 0 && LOOK.rim.value < 0.3; }), 'Niedrig: ohne dunkle Ecken, Randlicht schwächer');
  await page.evaluate(() => localStorage.removeItem('kk-gfx'));
  }

  if (part(3)) {   // Tag, Nacht und Wetter
  console.log('Tag, Nacht und Wetter');
  await page.goto(base + '?normal&karte=insel');
  await page.waitForSelector('#playBtn', { state: 'visible' });
  check(await page.evaluate(() => DN.on && DN.tod === 'auto' && DN.wsel === 'zufall' && document.querySelector('#wxSeg [data-w=zufall]').getAttribute('aria-pressed') === 'true' && document.querySelector('#todSeg [data-t=auto]').getAttribute('aria-pressed') === 'true' && DN.kind === 'regen'), 'Tag und Nacht: Standard ist Tageszeit „Auto“, Wetter „Zufall“');
  await startRound(page);
  await page.waitForTimeout(1200);
  const mood = n => page.evaluate(n => { for (let i = 0; i < n; i++) updateMood(0.05); }, n);
  await mood(60);
  const dayI = await page.evaluate(() => sun.intensity);
  check(await page.evaluate(() => DN.night === 0 && !DN.lights.stars.visible && DN.lights.lantern.intensity === 0 && DN.lights.beams.every(b => !b.visible)), 'Rundenbeginn am Tag: keine Sterne, keine Lampen');
  check(await page.evaluate(() => { const on = RAYS.mesh.visible && RAYS.sky + RAYS.tree > 0 && RAYS.k > 0.5;
    const m = GFX.mode; GFX.mode = 'schnell'; updateMood(0.05); const low = !RAYS.mesh.visible && !RAYS.treeMesh.visible; GFX.mode = m; updateMood(0.05);
    return on && low; }), 'Lichtstrahlen am Tag durch Wolkenlücken und Bäume, auf „Niedrig“ aus');
  await page.evaluate(() => { gameT = 290; });   // the clock follows the game time: 290 s after the start it is night
  await mood(200);
  check(await page.evaluate(d => DN.night > 0.9 && DN.lights.stars.visible && DN.lights.lantern.intensity > 0.5 && DN.lights.beams.some(b => b.visible) && DN.lights.crateGlow.some(g => g.visible)
    && DN.lights.hqGlow.every(g => g.visible) && sun.intensity < d * 0.5 && sun.intensity > 0.2 && !RAYS.mesh.visible, dayI), 'Nacht folgt der Spielzeit: Sterne, Laterne, Lichtkegel, leuchtende Kisten und Hauptquartiere, Mondlicht, keine Lichtstrahlen');
  await page.evaluate(() => { DN.fixed = 0.5; DN.setWeather('regen', true); });
  await mood(400);
  check(await page.evaluate(() => DN.night === 0 && DN.wx.s > 0.8 && WX.streakMesh.visible && WX.streaks > 300 && WX.wet > 0.5 && WX.puddleMesh.visible && WX.puddles > 10 && scene.fog.far < 150 && DN.wx.storm && !RAYS.mesh.visible), 'Regen und Gewitter (ohne Lichtstrahlen): Regenstreifen, nasser Glanz, Pfützen, dichterer Dunst');
  await page.evaluate(() => DN.setWeather('klar', false));
  await mood(700);
  check(await page.evaluate(() => DN.wx.s === 0 && !WX.streakMesh.visible && Math.abs(scene.fog.far - 170) < 1), 'Wetter klart wieder auf (Pfützen trocknen langsam)');
  await page.evaluate(() => { DN.fixed = null; pause(true); toMenu(); });
  await clickHidden(page, '#todSeg [data-t=tag]');
  check(await page.evaluate(() => { state = 'play'; gameT = 290; for (let i = 0; i < 200; i++) updateMood(0.05); const ok = DN.tod === 'tag' && localStorage.getItem('kk-tod') === 'tag' && DN.night === 0 && !DN.lights.stars.visible; state = 'menu'; return ok; }),
    'Tageszeit „Tag“: es bleibt Tag, wird gemerkt');
  await clickHidden(page, '#todSeg [data-t=nacht]');
  check(await page.evaluate(() => { state = 'play'; gameT = 10; for (let i = 0; i < 200; i++) updateMood(0.05); const ok = DN.tod === 'nacht' && DN.night > 0.9 && DN.lights.stars.visible; state = 'menu'; return ok; }),
    'Tageszeit „Nacht“: sofort Nacht');
  // Auftrag Wetter: every weather can be chosen in the settings and shows at once
  check(await page.evaluate(() => {
    const r = [], sel = w => { document.querySelector('#wxSeg [data-w=' + w + ']').click(); state = 'play'; for (let i = 0; i < 300; i++) updateMood(0.05); state = 'menu'; };
    DN.tod = 'tag';
    sel('regen'); r.push(DN.wx.want === 'regen' && !DN.wx.storm && DN.wx.s > 0.7 && WX.streaks > 300 && WX.wet > 0.5 && localStorage.getItem('kk-wx') === 'regen');
    sel('gewitter'); r.push(DN.wx.want === 'regen' && DN.wx.storm && DN.wx.s > 0.9 && scene.fog.far < 120);
    const t = TREES.find(t => !t.burnt); WX.strike(t); state = 'play'; for (let i = 0; i < 60; i++) updateMood(0.05); state = 'menu';
    r.push(t.burnt && !!t.charred && WX.charred >= 1 && WX.strikes >= 1);
    sel('schnee'); r.push(DN.wx.want === 'schnee' && DN.wx.storm && DN.wx.s > 0.9 && WX.streaks > 300 && scene.fog.far < 100 && window.wxWind > 3);
    sel('klar'); r.push(DN.wx.want === 'klar' && DN.wx.s < 0.05 && !WX.streakMesh.visible);
    return r.join();
  }) === 'true,true,true,true,true', 'Wetterwahl: Regen, Gewitter mit Blitzeinschlag (Baum angekohlt), Schneesturm, Klar – wirkt sofort, wird gemerkt');
  check(await page.evaluate(() => {
    // Zufall: weather comes and goes at random, the same in the building phase and during a wave.
    // A fixed random sequence: with true chance about 3 % of runs saw no storm in the 30 minutes and failed.
    const rnd = Math.random; let sd = 7; Math.random = () => { sd = (sd * 16807) % 2147483647; return (sd - 1) / 2147483646; };
    document.querySelector('#wxSeg [data-w=zufall]').click(); state = 'play'; const R = WX.plan, r = [];
    for (const [pt, wt] of [[300, 0], [0, 60]]) {
      peaceT = pt; waveT = wt; R.next = rand(40, 80); R.on = false; DN.setWeather('klar', false);
      let changes = 0, last = DN.wx.want, kinds = new Set();
      for (let i = 0; i < 1800; i++) { DN.roll(1, true); if (DN.wx.want !== last) { changes++; last = DN.wx.want; kinds.add(DN.wx.want + (DN.wx.storm ? '!' : '')); } }
      r.push(changes >= 8 && kinds.has('klar') && kinds.size >= 3);   // in 30 minutes: several changes, showers and storms
    }
    R.next = 60; R.on = false; DN.setWeather('klar', false); let first = 0; while (DN.wx.want === 'klar' && first < 200) { DN.roll(1, true); first++; }
    r.push(first <= 61);
    peaceT = 300; waveT = 0; state = 'menu'; Math.random = rnd; return r.join();
  }) === 'true,true,true', 'Zufall: Wetter kommt und geht zufällig, in der Bauruhe wie in der Welle');
  check(await page.evaluate(() => {
    // wind: a parachute crate sways and lands a little off, never towards the water
    DN.setWeather('regen', true, 1); DN.wx.s = 1; updateMood(0.05);
    const pad = pads.find(q => q.team === 0), c = spawnCrate(pad.x + 4, pad.z + (pad.z > 0 ? 3 : -3), true, false, 'blau'), x0 = c.x, z0 = c.z;
    for (let i = 0; i < 80; i++) wxCrate(c, 0.1);
    const moved = Math.hypot(c.x - x0, c.z - z0), ok = WX.wind > 0.9 && moved > 0.3 && moved < 1.4 && Math.abs(c.z) > BANK + 1 && Math.abs(c.m.rotation.z) > 0;
    removeCrate(c); DN.setWeather('klar', false); DN.wx.s = 0; return ok;
  }), 'Wind: Fallschirmkisten schwanken und landen etwas versetzt, nie im Wasser');
  await page.evaluate(() => { localStorage.removeItem('kk-wx'); localStorage.removeItem('kk-tod'); DN.wsel = 'zufall'; DN.tod = 'auto'; });
  }

  if (part(2)) {   // Mond
  console.log('Mond');
  await urbanMapChecks(page, 'mond', 'Mond');
  check(await page.evaluate(() => {
    // no crate in the tube or on a dome: 800 drop spots
    for (let i = 0; i < 800; i++) { const sp = dropSpot(DROPS[i % 2], i % 3 ? 1 : -1, i % 5 === 0);
      if (inTube(sp.x, sp.z, 1) || URB.domes.some(d => Math.hypot(d.x - sp.x, d.z - sp.z) < d.r + 1) || !urbanFree(sp.x, sp.z, 1)) return false; }
    return true;
  }), 'Mond: Kisten landen nie im Schlauchgang und nie auf einer Kuppel');
  check(await page.evaluate(() => {
    // the tube: walkable from one base to the other, walls keep direct fire out
    const g0 = navGrid(0), p = navPath(g0, 14, 36.2, 14, -36.2);
    const len = p ? p.reduce((a, q, i) => i ? a + Math.hypot(q.x - p[i - 1].x, q.z - p[i - 1].z) : 0, 0) : 0;
    const inside = navFree(g0, 44.2, 0) && navFree(g0, 30, 36.2) && navFree(g0, 30, -36.2);
    const tubeWay = navPath(g0, 30, 36.2, 30, -36.2), viaTube = !!tubeWay && tubeWay.every(q => inTube(q.x, q.z) || q.x > 15);
    return !!p && len > 60 && inside && viaTube && urbanBlocked(30, 0, 44.2, 0) && URB.domes.length === 4 && URB.craters.length === 3 && hgtRaw(0, 0) < hgtRaw(0, 10) - 1.5;
  }), 'Mond: Schlauchgang von Basis zu Basis begehbar und vor Beschuss geschützt, Krater und Kuppeln');
  check(await page.evaluate(() => {
    // low gravity: crates float down slowly, the mortar reaches further in flatter arcs, dust hangs in the air
    const c = spawnCrate(0, 20, true, false, 'blau'); let t = 0; const was = state; state = 'play';
    for (; t < 40 && c.state === 'fall'; t += 0.1) update(0.1);
    state = was; const slow = c.state !== 'fall' && t > 10; removeCrate(c);
    return GRAV < 0.5 && slow && WEAPONS.moerser.range > 40 && WEAPONS.knipser.range > 20;
  }), 'Mond: geringe Schwerkraft, Kisten schweben langsam herab, Mörser schießt weiter');
  check(await page.evaluate(() => {
    // no weather; „Zufall“ brings meteor showers that leave small craters
    DN.wsel = 'regen'; DN.applySel(); updateMood(0.05);
    const noWx = DN.wx.want === 'klar' && [...document.querySelectorAll('#wxSeg button')].filter(b => b.disabled).length === 3;
    DN.wsel = 'zufall'; const was = state; state = 'play'; MOONFX.shower(); for (let i = 0; i < 300; i++) updateMood(0.05); state = was;
    return noWx && MOONFX.showers > 0 && MOONFX.impacts > 0 && !!MOONFX.earth && DN.lights.stars.visible && clouds.every(c => !c.visible);
  }), 'Mond: kein Wetter, Meteoritenschauer schlägt kleine Krater, Erde und Sterne am Himmel');
  await page.evaluate(() => pause(true));
  await page.goto(base + '?normal&karte=insel');
  await openPlay(page);
  await page.waitForSelector('#continueBtn', { state: 'visible' });
  check((await page.textContent('#continueInfo')).startsWith('Mond · '), 'Spielstand merkt den Mond');
  await Promise.all([page.waitForNavigation(), page.click('#continueBtn', { force: true })]);
  await page.waitForFunction(() => typeof state !== 'undefined' && state === 'pause', null, { timeout: 60000 }).catch(() => {});
  { const r = await page.evaluate(() => [MAP, state, units.length]); check(r[0] === 'mond' && r[1] === 'pause' && r[2] >= 3, 'Weiterspielen lädt den Mond und setzt fort (' + r.join(', ') + ')'); }
  await page.evaluate(() => { endGame(false, 'Test.'); });
  await page.goto(base + '?weihnachten&karte=mond');
  await page.waitForSelector('#playBtn', { state: 'visible' });
  await startRound(page);
  await page.waitForTimeout(1200);
  check(await page.evaluate(() => XMAS && !XSNOW && !SNOW.on && MAP === 'mond' && state === 'play' && !!URB.lights && URB.lights.count > 150 && crates.every(c => c.bow) && !!MOONFX.sleigh),
    'Weihnachtsedition: Mond ohne Schnee, Lebkuchenkuppeln, Lichterketten am Schlauchgang, Geschenkkisten, Schlitten vor der Erde');
  check(await page.evaluate(() => {
    // meteor shower: glowing rocks and grey dust only; no pollen motes in a vacuum
    const was = state; state = 'play'; MOONFX.shower(); for (let i = 0; i < 120; i++) updateMood(0.05); state = was;
    return !motes.visible && MOONFX.impacts > 0 && RAYS.mesh === null && LOOK.envScene.children.length >= 3;   // the Earth is mirrored in the metal too
  }), 'Meteoritenschauer: keine Pollenpunkte und keine Lichtstrahlen auf dem Mond');
  await page.evaluate(() => { endGame(false, 'Test.'); localStorage.setItem('kk-map', 'insel'); });
  }
  if (part(3)) {   // Flughafen und Stadt
  console.log('Flughafen und Stadt');
  for (const [m, name] of [['stadt', 'Stadt'], ['flughafen', 'Flughafen']]) await urbanMapChecks(page, m, name);
  check(await page.evaluate(() => URB.flyer && URB.boxes.filter(b => b.k === 'plane').length === 2 && URB.boxes.some(b => b.k === 'tower')), 'Flughafen: Flugzeuge, Tower, Flugzeug am Himmel');
  await page.evaluate(() => pause(true));
  await page.goto(base + '?normal&karte=insel');
  await openPlay(page);
  await page.waitForSelector('#continueBtn', { state: 'visible' });
  check((await page.textContent('#continueInfo')).startsWith('Flughafen · '), 'Spielstand merkt den Flughafen');
  await Promise.all([page.waitForNavigation(), page.click('#continueBtn', { force: true })]);
  await page.waitForFunction(() => typeof state !== 'undefined' && state === 'pause', null, { timeout: 60000 }).catch(() => {});
  { const r = await page.evaluate(() => [MAP, state, units.length]); check(r[0] === 'flughafen' && r[1] === 'pause' && r[2] >= 3, 'Weiterspielen lädt den Flughafen und setzt fort (' + r.join(', ') + ')'); }
  await page.evaluate(() => { endGame(false, 'Test.'); });
  for (const m of ['stadt', 'flughafen']) {
    await page.goto(base + '?weihnachten&karte=' + m);
    await page.waitForSelector('#playBtn', { state: 'visible' });
    await startRound(page);
    await page.waitForTimeout(1200);
    check(await page.evaluate(m => XMAS && MAP === m && state === 'play' && !!URB.lights && URB.lights.count > 60 && crates.every(c => c.bow) && (m !== 'stadt' || obstacles.some(o => o.x === 0 && o.z === 0)), m), 'Weihnachtsedition: ' + (m === 'stadt' ? 'Stadt mit Baum auf dem Marktplatz' : 'Flughafen') + ', Lichterketten, Geschenkkisten');
    await page.evaluate(() => { endGame(false, 'Test.'); localStorage.setItem('kk-map', 'insel'); });
  }
  }
  if (part(3)) {   // Dschungel
  console.log('Dschungel');
  await urbanMapChecks(page, 'dschungel', 'Dschungel');
  check(await page.evaluate(() => {
    // the river: nobody walks into it, but it stops neither sight nor shots; the bridges and the temple passage are open for tanks too
    const J = URB.jungle, g0 = navGrid(0), g1 = navGrid(1), rz = J.rz(-22);
    const water = !urbanFree(-22, rz) && !urbanFree(5, 20) && !urbanFree(20, 0) && urbanFree(0, 20) && urbanFree(-22, rz, 0, 0.5) && !urbanBlocked(-22, 12, -22, -12) && !urbanBlocked(0, 30, 0, 12);
    const bridges = URB.bridges.length === 4 && navLine(g1, 0, 27, 0, -27) && navLine(g1, 30, 9, 30, -11) && navLine(g1, -30, 11, -30, -9) && navLine(g0, 0, 27, 0, -27);
    const temple = URB.boxes.filter(b => b.k === 'temple').length === 4 && !urbanFree(6, 6) && urbanFree(0, 0) && urbanFree(6, 0) && navLine(g1, 0, 0, 14, 0) && URB.fadeable.some(f => f.mats === URB.temple);
    return water && bridges && temple && hgt(0, 20) > 0.3 && hgt(30, -2) > 0.3;
  }), 'Dschungel: Fluss sperrt nur das Laufen, Stege, Hängebrücken und Tempelgänge auch für Panzer');
  check(await page.evaluate(() => {
    // a shot across the river flies on; crates never land in the water, in the temple or in the dense forest
    peaceT = 0; const a = spawnUnit(0, -22, 11, 'kaempfer'); const e = spawnUnit(1, -22, -9, 'kaempfer');
    const pin = () => { a.x = -22; a.z = 11; e.x = -22; e.z = -9; };
    pin(); a.cd = 0; e.hp = e.maxHp; const before = new Set(shots); fire(a, Math.PI); const mine = shots.filter(s => !before.has(s)); let minZ = 99;
    for (let i = 0; i < 80; i++) { update(0.02); pin(); for (const s of mine) if (shots.includes(s)) minZ = Math.min(minZ, s.z); }
    const across = mine.length > 0 && minZ < -3;
    for (const u of [a, e]) { u.alive = false; scene.remove(u.bot.g); scene.remove(u.bot.blob); u.tag.el.remove(); units.splice(units.indexOf(u), 1); }
    for (let i = 0; i < 800; i++) { const sp = dropSpot(DROPS[i % 2], i % 3 ? 1 : -1, i % 5 === 0); if (riverDepth(sp.x, sp.z) > -1 || !urbanFree(sp.x, sp.z, 1) || obstacles.some(o => Math.hypot(o.x - sp.x, o.z - sp.z) < o.r + 1)) return false; }
    return across;
  }), 'Dschungel: Schüsse fliegen über den Fluss, Kisten landen nie im Wasser, im Tempel oder zwischen den Bäumen');
  check(await page.evaluate(() => URB.trees >= 120 && TREES.length >= 120 && obstacles.length > 150 && !!URB.flies && URB.flies.count > 20 && URB.undergrowth.every(m => m.count > 100)
    && URB.boxes.filter(b => b.k === 'head').length === 4 && !XSNOW && DN.kind === 'regen' && GFX.water && renderer.info.render.triangles < 700000),
    'Dschungel: Regenwald mit Bäumen, Farnen und Schmetterlingen, Steinköpfe, Wasser, Regen statt Schnee');
  await page.evaluate(() => pause(true));
  await page.goto(base + '?normal&karte=insel');
  await openPlay(page);
  await page.waitForSelector('#continueBtn', { state: 'visible' });
  check((await page.textContent('#continueInfo')).startsWith('Dschungel · '), 'Spielstand merkt den Dschungel');
  await Promise.all([page.waitForNavigation(), page.click('#continueBtn', { force: true })]);
  await page.waitForFunction(() => typeof state !== 'undefined' && state === 'pause', null, { timeout: 60000 }).catch(() => {});
  { const r = await page.evaluate(() => [MAP, state, units.length]); check(r[0] === 'dschungel' && r[1] === 'pause' && r[2] >= 3, 'Weiterspielen lädt den Dschungel und setzt fort (' + r.join(', ') + ')'); }
  await page.evaluate(() => { endGame(false, 'Test.'); });
  await page.goto(base + '?weihnachten&karte=dschungel');
  await page.waitForSelector('#playBtn', { state: 'visible' });
  await startRound(page);
  await page.waitForTimeout(1200);
  check(await page.evaluate(() => XMAS && !XSNOW && !SNOW.on && MAP === 'dschungel' && state === 'play' && !!URB.lights && URB.lights.count > 300 && crates.every(c => c.bow)
    && renderer.info.render.calls < 500), 'Weihnachtsedition: Dschungel ohne Schnee, Lichterketten an Tempel, Stegen und Bäumen, Geschenkkisten');
  await page.evaluate(() => { endGame(false, 'Test.'); localStorage.setItem('kk-map', 'insel'); });
  }
  if (part(4)) {   // Wüste
  console.log('Wüste');
  await urbanMapChecks(page, 'wueste', 'Wüste');
  check(await page.evaluate(() => {
    // the pyramid: four blocks, a cross-shaped passage straight through it, for Blechlinge and tanks alike
    const P = URB.pyr, g0 = navGrid(0), g1 = navGrid(1);
    const through = navLine(g0, 0, 18, 0, -18) && navLine(g0, 18, 0, -18, 0) && navLine(g1, 0, 18, 0, -18) && navLine(g1, 18, 0, -18, 0);
    const blocks = URB.boxes.filter(b => b.k === 'pyr').length === 4 && !urbanFree(8, 8) && urbanFree(0, 8) && urbanFree(8, 0) && urbanFree(0, 0);
    return through && blocks && P.r === 14 && URB.boxes.filter(b => b.k === 'obelisk').length === 4 && !!URB.sphinx && URB.camels.length === 4 && birds.every(b => !b.g.visible);
  }), 'Wüste: Pyramide mit Kreuzgang (auch für Panzer), Ruinen, Obelisken, Sphinx, Kamele statt Möwen');
  check(await page.evaluate(() => {
    // crates never land in the pyramid, not on a chute in the wind and not blown over the sand in a sandstorm
    for (let i = 0; i < 800; i++) { const sp = dropSpot(DROPS[i % 2], i % 3 ? 1 : -1, i % 5 === 0); if (inPyramid(sp.x, sp.z) || !urbanFree(sp.x, sp.z, 1)) return false; }
    DN.wsel = 'schnee'; DN.applySel(); DN.wx.s = 1; updateMood(0.05);   // „Schneesturm“ is a steady sandstorm in the desert
    const out = [];
    for (const [x, z, dir] of [[0, 17, -Math.PI / 2], [17, 0, Math.PI], [-17, 5, 0], [-10, -17, Math.PI / 2]]) {
      WX.dir = dir;   // the wind blows straight at the pyramid
      const c = spawnCrate(x, z, true, false, 'blau'); for (let i = 0; i < 200; i++) wxCrate(c, 0.1);
      const g = spawnCrate(x, z, true, false, 'gelb'); g.state = 'ground'; g.y = hgt(x, z) + 0.5; const g0 = { x: g.x, z: g.z };
      const was = state; state = 'play'; for (let i = 0; i < 300; i++) updateMood(0.05); state = was;
      out.push(!inPyramid(c.x, c.z) && !inPyramid(g.x, g.z) && urbanFree(g.x, g.z, 1) && Math.hypot(g.x - g0.x, g.z - g0.z) < 3.4);
      removeCrate(c); removeCrate(g);
    }
    // and in the open the storm really moves a crate
    WX.dir = 0; const f = spawnCrate(-30, -36, true, false, 'blau'); f.state = 'ground'; const fx = f.x;
    const was = state; state = 'play'; for (let i = 0; i < 300; i++) updateMood(0.05); state = was;
    const moved = f.x - fx > 1; removeCrate(f);
    DN.wsel = 'zufall'; DN.setWeather('klar', false); DN.wx.s = 0;
    return out.every(Boolean) && moved;
  }), 'Wüste: Kisten landen und verwehen nie in die Pyramide, der Sandsturm verweht sie ein Stück');
  check(await page.evaluate(() => {
    // the sandstorm comes with a warning: a light haze and wind first, the full storm about 8 s later
    DN.wsel = 'zufall'; const far0 = scene.fog.far; WX.sandStorm();
    const warn = DN.wx.want === 'sand' && DN.wx.storm && DN.wx.lvl < 0.5 && /Sandsturm/.test(document.querySelector('#toast') ? document.querySelector('#toast').textContent : 'Sandsturm');
    for (let i = 0; i < 100; i++) DN.roll(0.1, true);
    const full = DN.wx.lvl === 1;
    DN.wx.s = 1; updateMood(0.05);
    const look = scene.fog.far < far0 * 0.5 && WX.streakMesh.visible && WX.veils.some(v => v.m.visible) && WX.wind > 1;
    // the bots: shorter sight, patrols wait in cover
    const u = spawnUnit(0, 10, 30, 'kaempfer'); u.weapon = 'krachrohr'; u.role = 'kaempfer'; peaceT = 0; decide(u, aiParams(0));
    const cover = sandK() > 0.9 && (u.plan === 'cover' || u.plan === 'fight' || u.plan === 'defend');
    u.alive = false; scene.remove(u.bot.g); scene.remove(u.bot.blob); u.tag.el.remove(); units.splice(units.indexOf(u), 1);
    DN.setWeather('klar', false); DN.wx.s = 0; updateMood(0.05);
    return warn && full && look && cover && document.querySelector('#wxSeg [data-w="schnee"]').textContent === 'Sandsturm';
  }), 'Wüste: Sandsturm mit Vorwarnung, Sandschleier, kaum Sicht, KI sucht Deckung');
  await page.evaluate(() => pause(true));
  await page.goto(base + '?normal&karte=insel');
  await openPlay(page);
  await page.waitForSelector('#continueBtn', { state: 'visible' });
  check((await page.textContent('#continueInfo')).startsWith('Wüste · '), 'Spielstand merkt die Wüste');
  await Promise.all([page.waitForNavigation(), page.click('#continueBtn', { force: true })]);
  await page.waitForFunction(() => typeof state !== 'undefined' && state === 'pause', null, { timeout: 60000 }).catch(() => {});
  { const r = await page.evaluate(() => [MAP, state, units.length]); check(r[0] === 'wueste' && r[1] === 'pause' && r[2] >= 3, 'Weiterspielen lädt die Wüste und setzt fort (' + r.join(', ') + ')'); }
  await page.evaluate(() => { endGame(false, 'Test.'); });
  await page.goto(base + '?weihnachten&karte=wueste');
  await page.waitForSelector('#playBtn', { state: 'visible' });
  await startRound(page);
  await page.waitForTimeout(1200);
  check(await page.evaluate(() => XMAS && !XSNOW && !SNOW.on && MAP === 'wueste' && state === 'play' && !!URB.lights && URB.lights.count > 150 && crates.every(c => c.bow)
    && URB.camels.every(c => c.g.children.length > 9) && DN.kind === 'sand'), 'Weihnachtsedition: Wüste ohne Schnee, Lichterketten an Pyramide, Palmen und Obelisken, Geschenkkisten, Kamele mit Mützen');
  check(await page.evaluate(() => {
    // no loose coloured dots in the sandstorm: the Christmas lights fade into the haze with the pyramid, the pollen motes go
    const clear = URB.lights.material.color.getHex() === 0xffffff && motes.visible;
    DN.wsel = 'schnee'; DN.applySel(); DN.wx.s = 1; updateMood(0.05);
    const c = URB.lights.material.color, f = scene.fog.color, near = Math.abs(c.r - f.r) + Math.abs(c.g - f.g) + Math.abs(c.b - f.b) < 0.5;
    const storm = near && c.r < 0.95 && URB.lights.material.opacity < 0.3 && !motes.visible;
    DN.wsel = 'zufall'; DN.setWeather('klar', false); DN.wx.s = 0; updateMood(0.05);
    return clear && storm && URB.lights.material.color.getHex() === 0xffffff && URB.lights.material.opacity === 1 && motes.visible;
  }), 'Sandsturm: keine bunten Punkte, Lichterketten verschwinden im Dunst, keine Pollen');
  await page.evaluate(() => { endGame(false, 'Test.'); localStorage.setItem('kk-map', 'insel'); });
  }
  if (part(4)) {   // Weihnachtsmarkt
  console.log('Weihnachtsmarkt');
  await urbanMapChecks(page, 'weihnachtsmarkt', 'Weihnachtsmarkt', '?weihnachten');
  check(await page.evaluate(() => {
    // stalls are cover; crates land round the tree, never on it or on a stall roof; the Ferris wheel and carousel turn
    // outside the fence, visitors walk round it and are nobody's target
    for (let i = 0; i < 800; i++) { const sp = dropSpot(DROPS[i % 2], i % 3 ? 1 : -1, i % 5 === 0); if (!urbanFree(sp.x, sp.z, 1) || Math.hypot(sp.x, sp.z) < 3.5) return false; }
    const r0 = URB.wheel.rim.rotation.x, c0 = URB.carousel.rot.rotation.y, v0 = new THREE.Matrix4(); URB.visitors.body.getMatrixAt(0, v0);
    const p0 = new THREE.Vector3().setFromMatrixPosition(v0);
    for (let i = 0; i < 20; i++) updateMood(0.1);
    const v1 = new THREE.Matrix4(); URB.visitors.body.getMatrixAt(0, v1); const p1 = new THREE.Vector3().setFromMatrixPosition(v1);
    const cm = new THREE.Matrix4(); URB.wheel.cabins.getMatrixAt(3, cm); const e = cm.elements;   // a cabin hangs level: its up axis stays straight up
    const level = Math.abs(e[4]) < 0.01 && Math.abs(e[5] - 1) < 0.01 && Math.abs(e[6]) < 0.01;
    const outside = Math.abs(URB.wheel.g.position.x) > LIM + 5 && Math.abs(URB.carousel.g.position.x) > LIM + 5 && Math.max(Math.abs(p1.x), Math.abs(p1.z)) > LIM + 2;
    return URB.boxes.filter(b => b.k === 'stall').length === 16 && URB.boxes.filter(b => b.k === 'ginger').length === 2 && !urbanFree(0, 0)
      && URB.wheel.rim.rotation.x > r0 && URB.carousel.rot.rotation.y > c0 && p1.distanceTo(p0) > 0.1 && level && outside && URB.steam.length >= 4
      && XMAS && XSNOW && DN.kind === 'schnee' && !!URB.lights && URB.lights.count > 300 && units.every(u => Math.max(Math.abs(u.x), Math.abs(u.z)) < LIM + 1);
  }), 'Weihnachtsmarkt: Buden, Baum, Lebkuchenhäuser, Kisten um den Baum, Riesenrad mit waagerechten Gondeln, Karussell und Besucher hinter dem Zaun, Schnee');
  check(await page.evaluate(() => {
    // no light string hangs in the air: every bulb sits on the tree (inside its tiers), on a stall or gingerbread house, or on the carousel
    const tierR = y => { let r = 0; for (let i = 0; i < 5; i++) { const c = 2.4 + i * 1.75, t = (c + 1.3 - y) / 2.6; if (t >= 0 && t <= 1) r = Math.max(r, (3.3 - i * 0.58) * t); } return r; };
    const m = new THREE.Matrix4(), p = new THREE.Vector3(), L = URB.lights, bad = [];
    for (let i = 0; i < L.count; i++) {
      L.getMatrixAt(i, m); p.setFromMatrixPosition(m); const r = Math.hypot(p.x, p.z);
      const onTree = r < 3.6 && r <= tierR(p.y - 0.32) + 0.05;
      const onBox = URB.boxes.some(b => b.k !== 'tree' && p.x > b.x0 - 1.1 && p.x < b.x1 + 1.1 && p.z > b.z0 - 1.1 && p.z < b.z1 + 1.1 && p.y < b.h + 2.2);
      const onRide = Math.abs(p.x) > LIM + 2;   // carousel and Ferris wheel behind the fence
      if (!onTree && !onBox && !onRide) bad.push(p.toArray().map(v => +v.toFixed(1)));
    }
    if (bad.length) console.log('frei hängende Lichter: ' + bad.length + ' z. B. ' + JSON.stringify(bad.slice(0, 3)));
    // the light strings over the square and the alleys: both ends on the tree top, a lantern post or a stall's eave
    const anchored = v => (Math.hypot(v.x, v.z) < 0.5 && v.y > 10) || URB.posts.some(q => Math.hypot(q.x - v.x, q.z - v.z) < 0.3 && Math.abs(q.top - v.y) < 0.3)
      || URB.stalls.some(t => Math.abs(t.x - v.x) < t.w / 2 + 0.6 && Math.abs(t.z - v.z) < t.d / 2 + 0.6 && Math.abs(t.eave - v.y) < 0.4);
    const loose = URB.strings.filter(q => !anchored(q.a) || !anchored(q.b));
    if (loose.length) console.log('lose Ketten: ' + JSON.stringify(loose.slice(0, 2)));
    return L.count > 300 && !bad.length && URB.strings.length >= 20 && !loose.length && URB.stringLights.count > 200 && URB.posts.length === 8 && !!URB.halo && !!URB.garland;
  }), 'Weihnachtsmarkt: keine Lichterkette hängt frei in der Luft (Spirale auf den Zweigen, Ketten an Buden, Baumspitze und Laternen)');
  check(await page.evaluate(() => {
    // the look after dusk: lanterns, stall interiors and windows glow, the halos appear; the round starts at dusk; cobblestones, no snow mounds
    // updateMood runs the market before the day/night step, so step first, then let the market read the new light
    DN.fixed = 0.42; DN.phase = 0.42; for (let i = 0; i < 4; i++) { DN.step(0.05); updateMood(0.05); } const dayOp = URB.halo.material.opacity;
    DN.fixed = 0.9; DN.phase = 0.9; for (let i = 0; i < 4; i++) { DN.step(0.05); updateMood(0.05); } const nightOp = URB.halo.material.opacity;
    // without a fixed test phase the market stays in the evening, whatever the game clock or the time-of-day setting says
    DN.fixed = null; const tod = DN.tod, gt = gameT; DN.tod = 'tag'; gameT = 200; for (let i = 0; i < 80; i++) DN.step(0.1);
    const evening = Math.abs(DN.phase - DN.EVENING) < 0.01 && DN.night > 0.3 && document.querySelector('#todSeg [data-t="tag"]').disabled;
    DN.tod = tod; gameT = gt;
    return dayOp < 0.05 && nightOp > 0.6 && evening && !SNOW.domes.visible && !SNOW.drifts.length;
  }), 'Weihnachtsmarkt: immer Abend (Tageszeit nicht wählbar), Laternen und Fenster leuchten, Kopfsteinpflaster ohne Schneehügel');
  await page.evaluate(() => pause(true));
  // outside the season: no map card, a saved round on the market is still played to the end (with a hint), a new game goes to the island
  await page.goto(base + '?normal&karte=insel');
  await openPlay(page);
  check(await page.evaluate(() => document.querySelector('#mapSeg [data-m="weihnachtsmarkt"]').hidden && !XMAS), 'Außerhalb der Weihnachtszeit: keine Kartenkarte für den Weihnachtsmarkt');
  await page.waitForSelector('#continueBtn', { state: 'visible' });
  check((await page.textContent('#continueInfo')).startsWith('Weihnachtsmarkt · '), 'Spielstand merkt den Weihnachtsmarkt');
  await Promise.all([page.waitForNavigation(), page.click('#continueBtn', { force: true })]);
  await page.waitForFunction(() => typeof state !== 'undefined' && state === 'pause', null, { timeout: 60000 }).catch(() => {});
  await page.waitForTimeout(1500);
  { const r = await page.evaluate(() => [MAP, state, units.length, MARKET_OFF, XMAS, document.querySelector('#toast') ? document.querySelector('#toast').textContent : '']);
    check(r[0] === 'weihnachtsmarkt' && r[1] === 'pause' && r[2] >= 3 && r[3] && r[4] && /nur in der Weihnachtszeit/.test(r[5]), 'Außerhalb der Saison: gespeicherte Runde auf dem Weihnachtsmarkt geht mit Hinweis weiter (' + r.slice(0, 4).join(', ') + ')'); }
  await page.evaluate(() => { endGame(false, 'Test.'); });
  await page.goto(base + '?normal');
  await page.waitForSelector('#playBtn', { state: 'visible' });
  check(await page.evaluate(() => MAP === 'insel'), 'Außerhalb der Saison ohne Spielstand: zurück auf der Insel');
  await page.evaluate(() => localStorage.setItem('kk-map', 'insel'));
  }
  if (part(4)) {   // Vulkan
  console.log('Vulkan');
  await page.goto(base + '?normal');
  await page.waitForSelector('#playBtn', { state: 'visible' });
  await openPlay(page);
  await Promise.all([page.waitForNavigation(), page.click('#mapSeg [data-m="vulkan"]', { force: true })]);
  await page.waitForSelector('#startBtn', { state: 'visible' });
  check(await page.evaluate(() => MAP === 'vulkan' && localStorage.getItem('kk-map') === 'vulkan' && document.querySelector('#mapSeg [data-m="vulkan"]').getAttribute('aria-pressed') === 'true'), 'Kartenwahl: Vulkan gewählt und gemerkt');
  check(await page.evaluate(() => hgtRaw(30, 5) < -1.5 && hgtRaw(0, 9.5) < -1.5 && Math.abs(hgt(8, 9) - 0.38) < 0.05 && Math.abs(hgt(-8, -9) - 0.38) < 0.05 && hgt(9, 0) > 0.3 && hgtRaw(1.8, 0) > 4 && hgtRaw(0, 0) < hgtRaw(1.8, 0) - 1.5 && hgt(0, 44) < 1.5
    && onPlatform(-12, 0) && !onPlatform(0, 9) && obstacles.some(o => o.x === 0 && o.z === 0 && o.r > 3)),
    'Vulkan: Lavastrom, vier Brücken auf Laufhöhe, Insel mit Kegel und Krater');
  check(await page.evaluate(() => {
    const out = [];
    const run = (kind, team, x0, z0, x1, z1) => {
      const u = spawnUnit(team, x0, z0, 'kaempfer', kind); let i = 0, lava = 0, isl = false, minC = 99;
      for (; i < 6000; i++) {
        if (moveToward(u, x1, z1, 0.05, ALLY, 1.5)) break; resolve(u);
        const e = islandE(u.x, u.z); if (e < 0.9) isl = true; minC = Math.min(minC, Math.hypot(u.x, u.z));
        if (Math.abs(u.z) < BANK - 0.3 && e > 1.0 && !BRIDGES.some(b => Math.abs(u.x - b) < crossW(b) + 0.1)) lava++;
      }
      out.push(i < 6000 && isl && lava === 0 && minC > CRATER.r);
      u.alive = false; scene.remove(u.bot.g); scene.remove(u.bot.blob); u.tag.el.remove(); units.splice(units.indexOf(u), 1);
    };
    for (const kind of [undefined, 'tank']) {
      run(kind, 0, -5, 36, -5, -36); run(kind, 1, 5, -36, 5, 36);   // straight across, one lane each
      run(kind, 0, -25, 30, 25, -30);                               // diagonally, changing lanes on the island
      run(kind, 0, -11, 0.3, 11, 0.2);                              // across the island, around the crater
      run(kind, 0, -9, 2, 3, 40);                                   // from the island back to the bank
    }
    return out.every(Boolean);
  }), 'Wegfindung: Blechling und Panzer kommen über die Insel, um den Krater herum und nie durch die Lava');
  await startRound(page);
  await page.waitForTimeout(1500);
  check(await page.evaluate(() => state === 'play' && renderer.info.render.calls > 50 && !!window.volcano && crates.length >= 6
    && crates.every(c => onPlatform(c.x, c.z) && Math.hypot(c.x, c.z) > CRATER.r + 0.5)), 'Runde auf dem Vulkan läuft, Kisten liegen auf der Insel neben dem Krater');
  check(await page.evaluate(() => {
    const u = spawnUnit(0, 8, 9, 'kaempfer'), v = spawnUnit(0, 8, 30, 'kaempfer');
    volcano.erupt(8, 1);
    const closed = bridgeClosed(8, 1) && !bridgeClosed(-8, 1) && !bridgeClosed(8, -1), wp = volcanoWaypoint(v, 8, -30);
    let launched = 0; for (let i = 0; i < 240; i++) { volcano.step(0.05); launched = Math.max(launched, volcano.bombs.length); }
    const ok = closed && wp && wp.x === -8 && launched > 0 && (u.hp < u.maxHp || !u.alive) && v.hp === v.maxHp && volcano.E.phase === 0 && !bridgeClosed(8, 1);
    for (const w of [u, v]) if (w.alive) { w.alive = false; scene.remove(w.bot.g); scene.remove(w.bot.blob); w.tag.el.remove(); units.splice(units.indexOf(w), 1); }
    return ok;
  }), 'Ausbruch: Brücke wird gesperrt und umgangen, Lavabrocken treffen nur dort, danach ist sie wieder frei');
  await page.evaluate(() => pause(true));
  await page.goto(base + '?weihnachten&karte=vulkan');
  await page.waitForSelector('#playBtn', { state: 'visible' });
  await startRound(page);
  await page.waitForTimeout(1200);
  check(await page.evaluate(() => XMAS && VOLCANO && state === 'play' && units.filter(u => u.kind === 'bot').every(u => u.bot.costume) && crates.every(c => c.bow)), 'Weihnachtsedition auf dem Vulkan');
  await page.evaluate(() => { endGame(true, 'Test.'); localStorage.setItem('kk-map', 'insel'); });
  }

  // The multiplayer test starts its own PeerServer and three browser pages. It is slow and flaky on
  // CI machines without a GPU, so it only runs locally (CI sets CI=true); KK_MP_TEST=1 forces it.
  const runMp = !process.env.CI || process.env.KK_MP_TEST === '1';
  console.log(runMp ? 'Mehrspieler' : 'Mehrspieler: übersprungen (läuft nur lokal)');
  if (runMp) {
  await page.goto('about:blank');   // free the CPU: software rendering of several pages at once is slow
    // local signalling server instead of the public PeerJS cloud
    const { PeerServer } = require('peer');
    const pport = 9124, ps = PeerServer({ port: pport, host: '127.0.0.1', path: '/' });
    await new Promise(r => setTimeout(r, 500));
    // three game pages render at once without a GPU: plain graphics keep that fast enough to load in time
    const q = '?normal&grafik=schnell&peerserver=127.0.0.1:' + pport;
    // A browser of its own: the pages opened so far leave WebGL contexts behind, and Chromium drops the oldest
    // ones once there are too many. In a shared browser that can hit a multiplayer page in the middle of a round.
    // three pages share one browser and only one is in front: Chrome slows the others' timers down to about once a
    // minute after a few minutes in the background, and PeerJS sends through timers. A real player's page is in front.
    const mpBrowser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist',
      '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows', '--disable-features=IntensiveWakeUpThrottling'] });
    // Loading is slow here: the pages already open keep rendering in software and share one graphics process with
    // the page being loaded. Measured: 6 s for the first page, 31 s for the second, 126 s for the third.
    const mkPage = async (name, extra) => { const c = await mpBrowser.newContext({ viewport: { width: 640, height: 360 } }); const p = await c.newPage(); p.setDefaultTimeout(60000);
      p.on('pageerror', e => errors.push(name + ': ' + e.message)); await p.goto(base + q + (extra || ''), { waitUntil: 'domcontentloaded', timeout: 300000 }); await p.waitForSelector(extra && /raum=/.test(extra) ? '#netJoinBox' : '#playBtn', { state: 'visible', timeout: 300000 }); return p; };   // a join link opens the multiplayer screen straight away
    const host = await mkPage('Host');
    await host.evaluate(() => localStorage.setItem('kk-save', '{"format":1,"marker":"einzelspieler"}'));
    await host.click('#netBtn', { force: true }); await host.click('#netHostBtn', { force: true });
    await host.waitForFunction(() => /Warte/.test(document.querySelector('#netStatus').textContent));
    const code = await host.textContent('#netCode');
    check(/^[A-HJKMNP-Z2-9]{4}-[A-HJKMNP-Z2-9]{4}$/.test(code), 'Raumcode gut lesbar, ohne 0/O/1/I/L: ' + code);
    check(await host.evaluate(c => { const t = netShareText(); return t.includes(c) && t.includes('?raum=' + c) && !!document.querySelector('#netShare') && !!document.querySelector('#netCopy'); }, code),
      'Teilen und Kopieren: Einladung mit Raumcode und Beitrittslink');
    // the host's app goes to the background (e.g. to share the code) and iOS drops the connection to the signalling
    // server: back in front, the host logs in again under the same id, the room stays and its clock stood still
    await host.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, get: () => true }); document.dispatchEvent(new Event('visibilitychange'));
      window.__ttl = NET.ttlLeft; try { NET.peer.socket._socket.close(); } catch (e) {} });
    await host.waitForTimeout(2500);
    await host.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, get: () => false }); document.dispatchEvent(new Event('visibilitychange')); });
    await host.waitForFunction(() => /wieder bereit/.test(document.querySelector('#netStatus').textContent) && NET.peer && NET.peer.open, null, { timeout: 20000 }).catch(() => {});
    { const r = await host.evaluate(c => ({ st: document.querySelector('#netStatus').textContent, open: !!(NET.peer && NET.peer.open), id: NET.peer && NET.peer.id, ttl: window.__ttl, left: NET.ttlEnd - Date.now(), resumes: NET.resumes }), code);
      check(/wieder bereit/.test(r.st) && r.open && r.id === 'kistenkrawall-' + code.replace('-', '') && r.ttl > 5 * 60000 && r.left > 5 * 60000 && r.resumes === 1,
        'App kurz im Hintergrund: Raum und Code bleiben, Host meldet sich neu an, „Raum ist wieder bereit“, Ablaufzeit steht still (' + JSON.stringify(r) + ')'); }
    const join = async (p, c) => { await p.click('#netBtn', { force: true }); await p.click('#netJoinBtn', { force: true }); await p.fill('#netCodeIn', c); await p.click('#netJoinGo', { force: true }); };
    const third = await mkPage('Dritter');
    await third.evaluate(() => document.querySelector('meta[name="kk-version"]').content = 'andere-version');
    await join(third, code);
    await third.waitForFunction(() => /Version/.test(document.querySelector('#netStatus').textContent)).catch(() => {});
    { const st = await third.textContent('#netStatus');
      const why = /aktualisier/.test(st) ? '' : ' (angezeigt: ' + st + '; ' + await third.evaluate(() => JSON.stringify({ peerOpen: !!(NET.peer && NET.peer.open), id: NET.peer && NET.peer.id, disc: !!(NET.peer && NET.peer.disconnected), conn: !!NET.conn, connOpen: !!(NET.conn && NET.conn.open), role: NET.role, stats: NET.stats })) + '; Host: ' + await host.evaluate(() => JSON.stringify({ peerOpen: !!(NET.peer && NET.peer.open), disc: !!(NET.peer && NET.peer.disconnected), id: NET.peer && NET.peer.id, stats: NET.stats })) + ')';
      check(/aktualisier/.test(st), 'andere Spielversion: Hinweis „bitte aktualisieren“' + why); }
    await third.evaluate(() => document.querySelector('meta[name="kk-version"]').content = 'aaa111');
    // the guest opens the shared link (…?raum=CODE) and joins without typing anything
    const guest = await mkPage('Gast', '&raum=' + code);
    await host.waitForFunction(() => !document.querySelector('#netStartBtn').disabled).catch(async e => {
      const d = p => p.evaluate(() => netDiagText().split('\n').slice(-16).join(' / ') + ' · ' + document.querySelector('#netStatus').textContent).catch(x => String(x));
      throw new Error('Gast kommt nicht in den Raum (Host: ' + await d(host) + ' | Gast: ' + await d(guest) + ')'); });
    check(await guest.evaluate(() => NET.role === 'guest' && NET.joined && !/raum=/.test(location.search)), 'Gast ist über den Beitrittslink dem Raum beigetreten');
    await host.waitForFunction(() => !!DIAG.kind, null, { timeout: 15000 }).catch(() => {});
    { const r = await host.evaluate(c => { netDiagRender(); const li = [...document.querySelectorAll('#netSteps li')].map(l => l.className === 'ok'); const t = netDiagText();
        return { li, kind: DIAG.kind, step4: document.querySelectorAll('#netSteps li')[3].textContent, clean: !t.includes(c) && !t.includes(c.replace('-', '')) && !/\b\d{1,3}(\.\d{1,3}){3}\b/.test(t), ice: DIAG.ice }; }, code);
      check(r.li[0] && r.li[1] && r.li[2] && r.li[3] && !r.li[4] && /direkt im WLAN|direkt übers Internet|über TURN/.test(r.step4) && r.clean,
        'Verbindungsdetails beim Host: Vermittlungsserver, Gegenüber, Verbindung und Art der Verbindung abgehakt, Protokoll ohne Raumcode und Adressen (' + JSON.stringify(r) + ')'); }
    // the guest's app goes to the background while waiting for the start and loses both connections: back in
    // front it knocks again at once with its token and is let in again
    await guest.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, get: () => true }); document.dispatchEvent(new Event('visibilitychange'));
      try { NET.peer.socket._socket.close(); } catch (e) {} netDebug.drop(); });
    await guest.waitForTimeout(2000);
    await guest.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, get: () => false }); document.dispatchEvent(new Event('visibilitychange')); });
    await guest.waitForFunction(() => NET.conn && NET.conn.open && /Verbunden/.test(document.querySelector('#netStatus').textContent), null, { timeout: 30000 }).catch(() => {});
    await host.waitForFunction(() => !document.querySelector('#netStartBtn').disabled, null, { timeout: 30000 }).catch(() => {});
    { const r = await guest.evaluate(() => ({ st: document.querySelector('#netStatus').textContent, open: !!(NET.conn && NET.conn.open), resumes: NET.resumes }));
      check(r.open && /Verbunden/.test(r.st) && r.resumes === 1 && await host.evaluate(() => NET.joined && !document.querySelector('#netStartBtn').disabled),
        'Gast kurz im Hintergrund vor dem Start: verbindet sich sofort neu und ist wieder im Raum (' + JSON.stringify(r) + ')'); }
    await third.fill('#netCodeIn', code); await third.click('#netJoinGo', { force: true });
    await third.waitForFunction(() => /voll/.test(document.querySelector('#netStatus').textContent)).catch(() => {});
    { const t = await third.textContent('#netStatus'); check(/voll/.test(t), 'ein weiterer Beitritt wird abgelehnt (' + t + ')'); }
    await third.context().close();
    await host.click('#netStartBtn', { force: true });
    await guest.waitForFunction(() => MP === 'guest' && player && player.team === 1 && units.length >= 6);
    check(await host.evaluate(() => MP === 'host' && player.team === 0 && player2 && player2.team === 1), 'Spiel läuft: Host spielt Orange, Gast Petrol');
    check(await host.evaluate(() => diagState().every(x => x.d)) && await guest.evaluate(() => diagState()[4].d && diagState()[2].d), 'Verbindungsdetails: alle fünf Schritte abgehakt, sobald das Spiel läuft');
    check(await host.evaluate(() => teams[1].wave.phase === 'idle' && aiParams(1) === ALLY), 'faire KI: beide Teams wie Mitstreiter, keine Petrol-Wellen');
    const z0 = await host.evaluate(() => player2.z);
    await guest.keyboard.down('w'); await guest.waitForTimeout(2500); await guest.keyboard.up('w');
    { const moved = await host.evaluate(z => Math.abs(player2.z - z) > 0.5, z0);
      const why = moved ? '' : ' (Host: ' + await host.evaluate(() => netDiagText().split('\n').slice(-12).join(' / ') + ' · state ' + state) + ' | Gast: ' + await guest.evaluate(() => netDiagText().split('\n').slice(-12).join(' / ') + ' · state ' + state + ' · focus ' + document.hasFocus()) + ')';
      check(moved, 'Eingaben des Gasts bewegen seinen Blechling beim Host' + why); }
    check(await guest.evaluate(() => crates.length > 0 && units.every(u => !u.alive || u.tx !== undefined)), 'Gast zeigt Blechlinge und Kisten des Hosts');
    await guest.evaluate(() => { netDebug.send({ t: 'in', mx: 9, mz: 0, a: null, f: true }); netDebug.send({ t: 'act', a: 'eval(1)' }); netDebug.send({ t: 'x', html: '<img src=x onerror=alert(1)>' }); netDebug.send('<b>hi</b>'); });
    await host.waitForTimeout(800);
    check(await host.evaluate(() => NET.stats.invalid >= 4 && MP === 'host'), 'ungültige Nachrichten werden verworfen');
    const t0 = await host.evaluate(() => gameT);
    await host.click('#pauseBtn', { force: true }); await guest.waitForTimeout(1000);
    check(await host.evaluate(t => MENU.overlay && state === 'play' && !document.querySelector('#panelPause').hidden && document.querySelector('#restartBtn').hidden && gameT > t, t0)
      && await guest.evaluate(() => state === 'play'), 'Pause im Mehrspieler ist nur eine Ebene: das Spiel läuft bei beiden weiter');
    await host.click('#pauseSetBtn', { force: true });
    check(await host.evaluate(() => !document.querySelector('#panelSettings').hidden && document.querySelector('#setBack').textContent === 'Zurück zur Pause'), 'Einstellungen aus der Mehrspieler-Pause');
    await host.click('#setBack', { force: true });
    await host.click('#resumeBtn', { force: true }); await guest.waitForTimeout(500);
    check(await host.evaluate(() => !MENU.overlay && document.querySelector('#menu').hidden && state === 'play'), 'Weiter schließt die Ebene');
    await guest.evaluate(() => netDebug.drop());
    await host.waitForFunction(() => !document.querySelector('#netOverlay').hidden, null, { timeout: 15000 }).catch(() => {});
    check(await host.evaluate(() => !document.querySelector('#netOverlay').hidden && state === 'pause'), 'Abbruch: pausiert und zeigt „Verbindung verloren“');
    await host.waitForFunction(() => document.querySelector('#netOverlay').hidden, null, { timeout: 30000 }).catch(() => {});
    check(await host.evaluate(() => document.querySelector('#netOverlay').hidden && NET.conn && NET.conn.open), 'Gast verbindet sich von selbst wieder');
    check(await host.evaluate(() => JSON.parse(localStorage.getItem('kk-save')).marker === 'einzelspieler'), 'Einzelspieler-Spielstand bleibt unberührt');
    await host.click('#pauseBtn', { force: true }).catch(() => {});
    await host.evaluate(() => toMenu());
    await guest.waitForFunction(() => MP === null, null, { timeout: 30000 }).catch(() => {});
    check(await guest.evaluate(() => MP === null && state === 'menu'), 'Host verlässt das Spiel: endet auch für den Gast');
    await host.evaluate(() => localStorage.removeItem('kk-save'));
    await mpBrowser.close();
  }

  if (part(4)) {   // Update-Hinweis
  console.log('Update-Hinweis');
  await page.goto(base);
  await page.waitForSelector('#playBtn', { state: 'visible' });
  check((await page.textContent('#verLine')) === 'Version vom 02.01.2026 · aaa111', 'Versionsanzeige im Startmenü');
  await page.mouse.click(8, 300);
  await page.waitForTimeout(1200);
  check(await page.evaluate(() => music && /^menu(_x)?$/.test(music.playing || '')), 'Musik: Titelthema im Menü');
  setVersion('bbb222');                       // "deploy" a new version
  await page.evaluate(() => window.kkCheckUpdate());
  await page.waitForSelector('#updBar', { state: 'visible', timeout: 60000 }).catch(() => {});
  check(await page.isVisible('#updBar'), 'Hinweis „Neue Version verfügbar“ erscheint im Menü');
  await startRound(page);
  await page.waitForTimeout(1000);
  check(!(await page.isVisible('#updBar')) && await page.isVisible('#updPill'), 'während der Runde nur das Abzeichen');
  await page.click('#pauseBtn', { force: true });
  await page.waitForTimeout(600);
  check(await page.isVisible('#updPauseBtn'), 'Aktualisieren-Knopf im Pausenmenü');
  await Promise.all([page.waitForNavigation(), page.click('#updPauseBtn', { force: true })]);
  await page.waitForSelector('#playBtn', { state: 'visible' });
  check((await page.textContent('#verLine')).endsWith('bbb222'), 'nach dem Aktualisieren läuft die neue Version');
  await page.waitForTimeout(3500);
  check(!(await page.isVisible('#updBar')), 'danach kein Hinweis mehr');
  }

  const errs = errors.filter(e => !/net::ERR_INTERNET_DISCONNECTED|Failed to load resource/.test(e));
  check(errs.length === 0, 'keine JavaScript-Fehler' + (errs.length ? ': ' + errs.join(' | ') : ''));
  check(foreign.length === 0, 'keine Anfragen an fremde Server' + (foreign.length ? ': ' + foreign.join(', ') : ''));

  await browser.close();
  server.close();
  fs.rmSync(SERVE, { recursive: true, force: true });
  console.log(failed ? '\n' + failed + ' Prüfung(en) fehlgeschlagen' : '\nAlles in Ordnung');
  process.exit(failed ? 1 : 0);
}

main().catch(e => { console.log('  FAIL Test abgebrochen: ' + String(e.message || e).split('\n').slice(0, 6).join(' / ')); console.log('\nTest fehlgeschlagen'); process.exit(1); });
