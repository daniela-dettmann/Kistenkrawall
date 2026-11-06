// Smoke test: starts the game in a real browser and fails if anything is broken.
// Usage: node tests/smoke.cjs [folder]   (default: repository root)
// Runs in GitHub Actions before every deploy; a failure stops the deploy.
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

  console.log('Spiel');
  await page.goto(base);
  await page.waitForSelector('#startBtn', { state: 'visible' });
  check(await page.evaluate(() => typeof THREE === 'object' && THREE.REVISION === '128'), 'three.js r128 geladen');
  check(await page.evaluate(() => document.fonts.check("20px 'Bowlby One SC'")), 'Schrift Bowlby One SC geladen');
  // software rendering makes the start slow, so record whether the hint ever appeared instead of looking at one moment
  await page.evaluate(() => { const el = document.querySelector('#joyHint'); new MutationObserver(() => { if (!el.hidden) window.__jhShown = true; }).observe(el, { attributes: true }); });
  await page.click('#startBtn', { force: true });
  await page.waitForSelector('#hud', { state: 'visible' });
  check(await page.evaluate(() => window.__jhShown === true), 'Starthinweis erscheint bei neuem Spiel');
  await page.waitForTimeout(1500);
  check(await page.evaluate(() => renderer.info.render.calls > 50), '3D-Szene wird gezeichnet');
  check(await page.evaluate(() => state === 'play' && units.length >= 6), 'Runde läuft mit beiden Teams');
  check(await page.evaluate(() => music && /^ruhe(_x)?$/.test(music.playing || '')), 'Musik: Bauruhe läuft beim Rundenstart');
  check(await page.evaluate(() => soundVol === 0.7 && musicVol === 0.1), 'Standardlautstärke: Effekte 70 %, Musik 10 %');
  await page.click('#pauseBtn', { force: true });
  check(await page.evaluate(() => state === 'pause'), 'Pause funktioniert');
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
  await page.evaluate(() => endGame(true, 'Test.'));
  await page.waitForTimeout(400);
  check(await page.evaluate(() => /^sieg(_x)?$/.test(music.playing || '')), 'Musik: Sieg-Jingle am Rundenende');

  console.log('App / offline');
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.waitForTimeout(500);
  const cached = await page.evaluate(async () => { const k = await caches.keys(); return k.length ? (await (await caches.open(k[0])).keys()).length : 0; });
  check(cached >= 25, 'Service Worker hat ' + cached + ' Dateien gespeichert');
  await ctx.setOffline(true);
  await page.reload();
  await page.waitForSelector('#startBtn', { state: 'visible' });
  await page.click('#startBtn', { force: true });
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

  console.log('Weihnachtsedition');
  await page.goto(base + '?weihnachten');
  await page.waitForSelector('#startBtn', { state: 'visible' });
  check(await page.evaluate(() => XMAS && document.documentElement.classList.contains('xmas')), 'mit ?weihnachten aktiv');
  check(await page.evaluate(() => [new Date(2026, 9, 31), new Date(2026, 10, 1), new Date(2026, 11, 31), new Date(2027, 0, 10), new Date(2027, 0, 11)].map(d => xmasSeason(d)).join() === 'false,true,true,true,false'),
    'Saison: 1. November bis 10. Januar');
  check(await page.isVisible('.xribbon') && await page.isVisible('#xmasToggle'), 'Banderole „Weihnachtsedition“ und Schalter im Menü');
  await page.click('#startBtn', { force: true });
  await page.waitForTimeout(1200);
  check(await page.evaluate(() => { const b = units.filter(u => u.kind === 'bot'); return b.length > 0 && b.every(u => ['santa', 'elf', 'snowman'].includes(u.bot.costume)) && new Set(b.map(u => u.bot.costume)).size >= 2; }), 'Blechlinge als Weihnachtsmänner, Elfen und Schneemänner');
  check(await page.evaluate(() => crates.length > 0 && crates.every(c => c.bow)), 'Kisten mit Geschenkschleife');
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
  await page.waitForSelector('#startBtn', { state: 'visible' });
  check(await page.evaluate(() => !XMAS && !document.documentElement.classList.contains('xmas') && units.every(u => !u.bot.costume)) && !(await page.isVisible('.xribbon')), 'mit ?normal die normale Version');

  console.log('Gebirge');
  await page.goto(base + '?normal');
  await page.waitForSelector('#startBtn', { state: 'visible' });
  check(await page.evaluate(() => MAP === 'insel' && document.querySelector('#mapSeg [data-m="insel"]').getAttribute('aria-pressed') === 'true'), 'Standardkarte ist die Insel');
  await Promise.all([page.waitForNavigation(), page.click('#mapSeg [data-m="gebirge"]', { force: true })]);
  await page.waitForSelector('#startBtn', { state: 'visible' });
  check(await page.evaluate(() => MAP === 'gebirge' && localStorage.getItem('kk-map') === 'gebirge' && document.querySelector('#mapSeg [data-m="gebirge"]').getAttribute('aria-pressed') === 'true'), 'Kartenwahl: Gebirge gewählt und gemerkt');
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
  await page.click('#startBtn', { force: true });
  await page.waitForTimeout(1500);
  check(await page.evaluate(() => state === 'play' && renderer.info.render.calls > 50 && !!window.mountainDrift), 'Runde auf dem Gebirge läuft, mit Schneetreiben');
  await page.evaluate(() => pause(true));
  await page.goto(base + '?normal&karte=insel');
  await page.waitForSelector('#continueBtn', { state: 'visible' });
  check((await page.textContent('#continueInfo')).startsWith('Gebirge · '), 'Spielstand merkt die Karte: ' + await page.textContent('#continueInfo'));
  await Promise.all([page.waitForNavigation(), page.click('#continueBtn', { force: true })]);
  await page.waitForFunction(() => typeof state !== 'undefined' && state === 'pause', null, { timeout: 60000 }).catch(() => {});
  check(await page.evaluate(() => MAP === 'gebirge' && state === 'pause'), 'Weiterspielen lädt das Gebirge und setzt fort');
  await page.goto(base + '?weihnachten&karte=gebirge');
  await page.waitForSelector('#startBtn', { state: 'visible' });
  await page.click('#startBtn', { force: true });
  await page.waitForTimeout(1200);
  check(await page.evaluate(() => XMAS && MOUNTAIN && units.filter(u => u.kind === 'bot').every(u => u.bot.costume) && crates.every(c => c.bow) && !!window.xmasSleigh), 'Weihnachtsedition auf dem Gebirge');
  await page.evaluate(() => { endGame(true, 'Test.'); localStorage.setItem('kk-map', 'insel'); });

  console.log('Mehrspieler');
  await page.goto('about:blank');   // free the CPU: software rendering of several pages at once is slow
  {
    // local signalling server instead of the public PeerJS cloud
    const { PeerServer } = require('peer');
    const pport = 9124, ps = PeerServer({ port: pport, host: '127.0.0.1', path: '/' });
    await new Promise(r => setTimeout(r, 500));
    const q = '?normal&peerserver=127.0.0.1:' + pport;
    const mkPage = async name => { const c = await browser.newContext({ viewport: { width: 640, height: 360 } }); const p = await c.newPage(); p.setDefaultTimeout(60000);
      p.on('pageerror', e => errors.push(name + ': ' + e.message)); await p.goto(base + q, { waitUntil: 'domcontentloaded', timeout: 120000 }); await p.waitForSelector('#startBtn', { state: 'visible', timeout: 120000 }); return p; };
    const host = await mkPage('Host'), guest = await mkPage('Gast');
    await host.evaluate(() => localStorage.setItem('kk-save', '{"format":1,"marker":"einzelspieler"}'));
    await host.click('#netBtn', { force: true }); await host.click('#netHostBtn', { force: true });
    await host.waitForFunction(() => /Warte/.test(document.querySelector('#netStatus').textContent));
    const code = await host.textContent('#netCode');
    check(/^[A-HJKMNP-Z2-9]{4}-[A-HJKMNP-Z2-9]{4}$/.test(code), 'Raumcode gut lesbar, ohne 0/O/1/I/L: ' + code);
    const join = async (p, c) => { await p.click('#netBtn', { force: true }); await p.click('#netJoinBtn', { force: true }); await p.fill('#netCodeIn', c); await p.click('#netJoinGo', { force: true }); };
    const third = await mkPage('Dritter');
    await third.evaluate(() => document.querySelector('meta[name="kk-version"]').content = 'andere-version');
    await join(third, code);
    await third.waitForFunction(() => /Version/.test(document.querySelector('#netStatus').textContent)).catch(() => {});
    check(/aktualisier/.test(await third.textContent('#netStatus')), 'andere Spielversion: Hinweis „bitte aktualisieren“');
    await third.evaluate(() => document.querySelector('meta[name="kk-version"]').content = 'aaa111');
    await join(guest, code);
    await host.waitForFunction(() => !document.querySelector('#netStartBtn').disabled);
    ok('Gast ist dem Raum beigetreten');
    await third.fill('#netCodeIn', code); await third.click('#netJoinGo', { force: true });
    await third.waitForFunction(() => /voll/.test(document.querySelector('#netStatus').textContent)).catch(() => {});
    { const t = await third.textContent('#netStatus'); check(/voll/.test(t), 'ein weiterer Beitritt wird abgelehnt (' + t + ')'); }
    await third.context().close();
    await host.click('#netStartBtn', { force: true });
    await guest.waitForFunction(() => MP === 'guest' && player && player.team === 1 && units.length >= 6);
    check(await host.evaluate(() => MP === 'host' && player.team === 0 && player2 && player2.team === 1), 'Spiel läuft: Host spielt Orange, Gast Petrol');
    check(await host.evaluate(() => teams[1].wave.phase === 'idle' && aiParams(1) === ALLY), 'faire KI: beide Teams wie Mitstreiter, keine Petrol-Wellen');
    const z0 = await host.evaluate(() => player2.z);
    await guest.keyboard.down('w'); await guest.waitForTimeout(2500); await guest.keyboard.up('w');
    check(await host.evaluate(z => Math.abs(player2.z - z) > 0.5, z0), 'Eingaben des Gasts bewegen seinen Blechling beim Host');
    check(await guest.evaluate(() => crates.length > 0 && units.every(u => !u.alive || u.tx !== undefined)), 'Gast zeigt Blechlinge und Kisten des Hosts');
    await guest.evaluate(() => { netDebug.send({ t: 'in', mx: 9, mz: 0, a: null, f: true }); netDebug.send({ t: 'act', a: 'eval(1)' }); netDebug.send({ t: 'x', html: '<img src=x onerror=alert(1)>' }); netDebug.send('<b>hi</b>'); });
    await host.waitForTimeout(800);
    check(await host.evaluate(() => NET.stats.invalid >= 4 && MP === 'host'), 'ungültige Nachrichten werden verworfen');
    await host.click('#pauseBtn', { force: true }); await guest.waitForTimeout(1000);
    check(await guest.evaluate(() => state === 'pause'), 'Pause gilt für beide');
    await host.click('#resumeBtn', { force: true }); await guest.waitForTimeout(1000);
    check(await guest.evaluate(() => state === 'play'), 'Weiter gilt für beide');
    await guest.evaluate(() => netDebug.drop());
    await host.waitForFunction(() => !document.querySelector('#netOverlay').hidden, null, { timeout: 15000 }).catch(() => {});
    check(await host.evaluate(() => !document.querySelector('#netOverlay').hidden && state === 'pause'), 'Abbruch: pausiert und zeigt „Verbindung verloren“');
    await host.waitForFunction(() => document.querySelector('#netOverlay').hidden, null, { timeout: 30000 }).catch(() => {});
    check(await host.evaluate(() => document.querySelector('#netOverlay').hidden && NET.conn && NET.conn.open), 'Gast verbindet sich von selbst wieder');
    check(await host.evaluate(() => JSON.parse(localStorage.getItem('kk-save')).marker === 'einzelspieler'), 'Einzelspieler-Spielstand bleibt unberührt');
    await host.click('#pauseBtn', { force: true }).catch(() => {});
    await host.evaluate(() => toMenu());
    await guest.waitForFunction(() => MP === null, null, { timeout: 15000 }).catch(() => {});
    check(await guest.evaluate(() => MP === null && state === 'menu'), 'Host verlässt das Spiel: endet auch für den Gast');
    await host.evaluate(() => localStorage.removeItem('kk-save'));
    await host.context().close(); await guest.context().close();
  }

  console.log('Update-Hinweis');
  await page.goto(base);
  await page.waitForSelector('#startBtn', { state: 'visible' });
  check((await page.textContent('#verLine')) === 'Version vom 02.01.2026 · aaa111', 'Versionsanzeige im Startmenü');
  await page.mouse.click(8, 300);
  await page.waitForTimeout(1200);
  check(await page.evaluate(() => music && /^menu(_x)?$/.test(music.playing || '')), 'Musik: Titelthema im Menü');
  setVersion('bbb222');                       // "deploy" a new version
  await page.evaluate(() => window.kkCheckUpdate());
  await page.waitForSelector('#updBar', { state: 'visible', timeout: 60000 }).catch(() => {});
  check(await page.isVisible('#updBar'), 'Hinweis „Neue Version verfügbar“ erscheint im Menü');
  await page.click('#startBtn', { force: true });
  await page.waitForTimeout(1000);
  check(!(await page.isVisible('#updBar')) && await page.isVisible('#updPill'), 'während der Runde nur das Abzeichen');
  await page.click('#pauseBtn', { force: true });
  await page.waitForTimeout(600);
  check(await page.isVisible('#updPauseBtn'), 'Aktualisieren-Knopf im Pausenmenü');
  await Promise.all([page.waitForNavigation(), page.click('#updPauseBtn', { force: true })]);
  await page.waitForSelector('#startBtn', { state: 'visible' });
  check((await page.textContent('#verLine')).endsWith('bbb222'), 'nach dem Aktualisieren läuft die neue Version');
  await page.waitForTimeout(3500);
  check(!(await page.isVisible('#updBar')), 'danach kein Hinweis mehr');

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
