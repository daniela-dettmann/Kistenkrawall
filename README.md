# Kistenkrawall

3D-Kistenschlacht im Browser: Deine Blechbande Orange gegen die Blechbande Petrol. Kisten sammeln, stapeln, auspacken – und das gegnerische Hauptquartier sprengen.

**Spielen:** https://daniela-dettmann.github.io/Kistenkrawall/
**Tonstudio** (alle Töne zum Anhören): https://daniela-dettmann.github.io/Kistenkrawall/tonstudio.html

## Als App installieren

Kistenkrawall ist eine Progressive Web App: Auf dem Handy im Browser-Menü „Zum Startbildschirm hinzufügen“ (iOS: Teilen → „Zum Home-Bildschirm“) wählen, am Rechner in Chrome/Edge auf das Installieren-Symbol in der Adressleiste klicken. Nach dem ersten Start läuft das Spiel komplett offline.

## Aufbau

Kein Build-Tool nötig: Die Dateien werden genau so ausgeliefert, wie sie im Repo liegen.

| Datei / Ordner | Inhalt |
| --- | --- |
| `index.html` | Seitengerüst: Menüs, HUD, Knöpfe, Fehlerbildschirm |
| `css/style.css` | Aussehen von Menüs und HUD |
| `js/core.js` | Hilfsfunktionen, Form der Spielwelt (Höhenkarte, Brücken, Inseln) |
| `js/render.js` | Three.js-Renderer, Licht, Himmel, Texturen |
| `js/world.js` | Gelände, Wasser, Gras, Deko, Basen |
| `js/content.js` | Waffen, Kistenbelohnungen, Schwierigkeitsgrade, Spielzustand |
| `js/sounds.js` | Alle Töne (synthetisiert), gemeinsam für Spiel und Tonstudio |
| `js/audio.js` | Audio im Spiel: Start, Aufwecken nach Unterbrechung, Lautstärke |
| `js/units.js` | Blechlinge, Kisten, Schilde, Geschütztürme |
| `js/combat.js` | Effekte, Luftschlag, Kampf, Bewegung |
| `js/ai.js` | KI von Gegnern und Mitstreitern |
| `js/input.js` | Touch-, Maus- und Tastatursteuerung |
| `js/hud.js` | HUD, Sprechblasen, Atmosphäre |
| `js/game.js` | Spielablauf (Start, Wellen, Pause, Ende) und Hauptschleife |
| `js/rays.js` | Lichtstrahlen durch Wolkenlücken und Baumkronen (nur „Hoch“) |
| `js/moon.js` | Mond: Himmel, Erde, Sternschnuppen, Meteoritenschauer |
| `js/urban.js` | Karten Flughafen, Stadt, Wüste, Mond und Dschungel: Wegfindung, Gebäude, Flugzeuge, Pyramide, Oasen, Sphinx, Deko, Durchsicht |
| `js/jungle.js` | Dschungel: Tempel, Stege, Hängebrücken, Ruinen, Regenwald, Papageien, Schmetterlinge |
| `js/market.js` | Weihnachtsmarkt: Buden, Baum, Lebkuchenhäuser, Riesenrad, Karussell, Besucher |
| `js/mountain.js`, `js/volcano.js` | Karten Gebirge und Vulkan: Licht, Wetter, Krater und Ausbruch |
| `js/gfx.js` | Grafik: Qualitätsschalter, Bildausgabe, Uferschaum, Lavaglut, runde Kanten, Schattierung, Zusammenfassen |
| `js/weather.js` | Wetter: Plan, Regen, Pfützen, Gewitter mit Einschlägen, Schneesturm, Wind |
| `js/menu.js` | Menü: Hauptmenü, Spielstart, Einstellungen (Spiel, Grafik, Ton, Steuerung), Pause; Mehrspieler-Pause als Ebene |
| `js/snow.js` | Schnee: Spurenkarte, Verwehungen (bremsen), Schneehauben, Schneestaub |
| `js/water.js` | Wasser: Tiefenfarbe aus Küstenabstand, Uferschaum, Wellen, Himmelsspiegelung, Sonnenglitzern, Spritzer |
| `js/look.js` | Aussehen: Wind, Wolkenschatten, Morgennebel, Wasserspiegelung, Metallglanz, Lichtsaum, Spuren, Explosionen, Mündungsfeuer |
| `js/daynight.js` | Tag, Nacht und Wetter |
| `js/save.js` | Spielstand speichern und fortsetzen |
| `js/xmas.js` | Weihnachtsedition (1. November bis 10. Januar) |
| `js/update.js` | Hinweis auf neue Versionen, Versionsanzeige |
| `js/music.js` | Hintergrundmusik (Sequenzer, Instrumente, Kompositionen) |
| `vendor/` | three.js r128 (lokal, kein CDN) |
| `fonts/` | Schriften Bowlby One SC und Atkinson Hyperlegible (lokal) |
| `icons/` | App-Icon (`icon.svg`) und alle PNG-Größen |
| `sw.js`, `manifest.webmanifest` | Offline-Speicher und App-Einstellungen |
| `tonstudio.html` | Alle Töne zum Durchhören |
| `tests/smoke.cjs` | Automatischer Test im echten Browser |

Die `js/`-Dateien sind normale Skripte, die in der Reihenfolge aus `index.html` geladen werden und sich einen gemeinsamen Gültigkeitsbereich teilen. Eine neue Datei muss deshalb an der richtigen Stelle in `index.html` und zusätzlich in `sw.js` (Liste `PRECACHE`) eingetragen werden. Fehlt der Eintrag in `sw.js`, schlägt der Test fehl.

## Veröffentlichen

`.github/workflows/pages.yml`: Bei Pull Requests läuft der Browser-Test, aufgeteilt in vier Teile, die gleichzeitig laufen (`KK_PART=1..4`: 1 Spiel, offline, Spielstand; 2 Tonstudio, Weihnachten, Gebirge, Mond; 3 Grafik, Tag/Nacht/Wetter, Flughafen, Stadt, Dschungel; 4 Wüste, Weihnachtsmarkt, Vulkan, Update-Hinweis). Ein Push auf `main` (der Merge) stellt die Seite nur zusammen und veröffentlicht sie, ohne erneut zu testen; gemergt wird deshalb erst bei grünem Test. Den Mehrspieler-Test (lokaler PeerServer, drei Browserseiten) überspringt GitHub; er läuft nur lokal, mit `KK_MP_TEST=1` auch auf GitHub. Die Offline-Version in `sw.js` setzt der Workflow automatisch auf den Commit, installierte Apps bekommen Updates also ohne Handarbeit.

Lokal testen:

```sh
npm install
npx playwright install chromium
npm test
```

## Spielstand

Eine laufende Partie wird automatisch gespeichert, sobald das Spiel pausiert (auch wenn die App in den Hintergrund geht) und alle 30 Sekunden. Im Spielstart erscheint dann „Weiterspielen“ mit Welle, Schwierigkeit und Zeitpunkt; fortgesetzt wird im Pausenmenü. Sieg, Niederlage oder „Neues Spiel“ löschen den Spielstand. Kugeln, Explosionen und Flieger im Anflug werden nicht gespeichert. Ändert sich das Format so, dass alte Spielstände nicht mehr passen, wird `SAVE_FORMAT` in `js/save.js` erhöht; alte Spielstände werden dann mit einem Hinweis verworfen.

## Karten

Im Spielstart (nach „Spielen“) lässt sich zwischen **Insel**, **Gebirge**, **Vulkan**, **Flughafen**, **Stadt**, **Wüste**, **Mond** und **Dschungel** wählen, in der Weihnachtszeit auch den **Weihnachtsmarkt**. Insel und Gebirge folgen demselben Grundriss: Eine unpassierbare Mitte (Fluss bzw. Schlucht) wird bei x = −18 und x = +18 überquert, in der Mitte jedes Übergangs liegt ein Plateau, auf dem die Kisten landen. Deshalb funktionieren Bewegung und KI auf beiden Karten gleich. Auf dem Gebirge ist links eine breite Brücke, rechts ein enger Pass. Das Höhenprofil steht in `js/core.js` (`hgtMountain`), Licht, Horizont, Schneetreiben und Adler in `js/mountain.js`. Die Welt wird beim Laden gebaut, ein Kartenwechsel lädt die Seite neu. Zum Testen: `?karte=gebirge`, `?karte=vulkan` oder `?karte=insel`.

Der **Vulkan** weicht davon ab: Der Lavastrom in der Mitte ist breiter, darin liegt eine einzige große Insel mit dem Vulkankegel. Von jedem Ufer führen zwei Brücken (x = −8 und x = +8) auf die Insel, alle Kisten landen dort. Die Maße stehen in `js/core.js` (`BX`, `BANK`, `ISL_RX`, `ISL_RZ`, `ZS` verschiebt alles, was am Ufer steht), das Höhenprofil in `hgtVolcano`, die Wegführung in `volcanoWaypoint` (`js/combat.js`), Krater, Rauch und Ausbruch in `js/volcano.js`. Beim Ausbruch wird eine Brücke nach kurzer Warnung mit Lavabrocken beworfen; `bridgeClosed(bx, seite)` sagt der Wegführung und der Minikarte, welche.

**Flughafen** und **Stadt** haben kein Band in der Mitte (`URBAN`; `BANK` liegt dort außer Reichweite, damit keine Band-Regel greift). Ihre Grundrisse stehen als Daten in `js/core.js` (`URB.boxes`: Gebäude als Rechtecke mit Höhe, `URB.zones`: Abwurfzonen je Kistenfarbe, `URB.gold`, `URB.routes`); `urbanFree`, `urbanPush` und `urbanBlocked` prüfen Platz, schieben aus Gebäuden und testen Sicht- und Schusslinien. `js/urban.js` baut die Modelle und die Wegfindung (`navGrid`, `navPath`, `navWaypoint`: Raster mit 1-Meter-Feldern, A*, geglättet), die `moveToward` und der Kampf in `js/ai.js` benutzen. Die Stadt ist punktsymmetrisch (Team B spiegelt x und z), der Flughafen spiegelt nur z. Die **Wüste** (`DESERT`) nutzt dasselbe System: Die Pyramide besteht aus vier Kästen, zwischen denen der kreuzförmige Tunnel frei bleibt (`URB.pyr`, `inPyramid` hält Kisten fern), dazu Ruinen, Dünen-Felsen und Obelisken; Dünenhöhen in `hgtDesert`. Der Sandsturm steckt in `js/weather.js` und `js/daynight.js` (Wetterart `sand`), das Verhalten der KI im Sturm in `js/ai.js` (`sandK`). Zum Testen: `?karte=wueste`. Der **Mond** (`MOON`) ebenso: Felsbrocken und die Wände des Schlauchgangs sind Kästen (`URB.tube`, `inTube` hält Kisten fern), Kuppeln sind runde Hindernisse, Krater stecken in `hgtMoon`. Die geringe Schwerkraft ist ein Faktor `GRAV` (core.js) für Kisten, Staub und Splitter; Reichweiten und Mörser in `js/content.js` und `js/combat.js`. Himmel, Erde und Meteoritenschauer in `js/moon.js`. Zum Testen: `?karte=mond`. Der **Dschungel** (`JUNGLE`) ebenso: Tempelhälften, Säulen, Ruinen und Steinköpfe sind Kästen; der Fluss liegt als flache Kästen (Höhe 0) darunter, die das Laufen sperren, aber nicht Sicht und Schüsse (`urbanFree(x, z, m, minH)` mit Mindesthöhe für Geschosse). Flussverlauf in `riverDepth`, Brücken in `URB.bridges` (`onJBridge`), Pfade in `URB.trails` (`pathDist`), Gelände in `hgtJungle`. Modelle, Wald und Stimmung in `js/jungle.js`. Zum Testen: `?karte=dschungel`. Den **Weihnachtsmarkt** (`MARKET`) gibt es nur in der Weihnachtsedition (`xmasOn()`); außerhalb lädt `MAP` ihn nur für einen gespeicherten Spielstand oder beim Beitritt zu einem Host (`MARKET_OFF`, Hinweis in `js/market.js`, „Neues Spiel“ geht dann auf die Insel, `js/save.js`). Buden, Baum und Lebkuchenhäuser sind Kästen (`URB.stalls`), Riesenrad, Karussell und Besucher stehen als Kulisse hinter dem Zaun. Zum Testen: `?weihnachten&karte=weihnachtsmarkt`.

## Mehrspieler (1 gegen 1)

„Mehrspieler“ im Hauptmenü: Eine Person erstellt einen Raum und gibt den 8-stelligen Code weiter („Teilen“ oder „Kopieren“ schickt eine Einladung mit Code und Beitrittslink `?raum=ABCD-EF23`), die andere tritt bei. Kommt eine App aus dem Hintergrund zurück, meldet sie sich sofort neu beim Vermittlungsserver an (`netResume` in `js/net.js`); der Raum bleibt gültig, seine Ablaufzeit steht im Hintergrund still. Die Geräte verbinden sich direkt und verschlüsselt per WebRTC; den Verbindungsaufbau vermittelt der kostenlose öffentliche PeerJS-Server (sieht die IP-Adressen, nicht das Spiel). Im gleichen WLAN läuft die Verbindung automatisch lokal.

- Der Host (Orange) rechnet das Spiel und schickt etwa zehnmal pro Sekunde den Stand, der Gast (Petrol) schickt nur seine Eingaben. Beide Teams haben gleich starke KI-Mitstreiter, automatische Wellen gibt es im Mehrspieler nicht.
- Raumcodes aus kryptografischem Zufall ohne 0/O/1/I/L, Ablauf nach 10 Minuten ohne Beitritt, nur ein Gast, Versionsvergleich, Prüfung jeder Nachricht (Format, Werte, Größe, Häufigkeit), kein Chat, keine persönlichen Daten.
- Abbruch: beide pausieren, 60 Sekunden lang verbindet sich der Gast selbst wieder. Verlässt der Host das Spiel, endet es für beide. Der Einzelspieler-Spielstand bleibt unberührt.
- TURN-Server: noch keiner. Er wird in `js/net.js` unter `NET_CFG.turn` eingetragen, falls Verbindungen übers Internet scheitern.
- Code: `js/net.js`, Bibliothek `vendor/peerjs-1.5.4.min.js` (eine Änderung: kommt ein Datenkanal für eine schon geschlossene Verbindung an, wird er ignoriert, statt einen Fehler zu werfen). Der Test nutzt einen lokalen PeerServer (`?peerserver=127.0.0.1:PORT`, nur auf localhost erlaubt) und läuft nur lokal, nicht auf GitHub.

## Grafik

`js/gfx.js` hängt sich an das Bestehende an und gilt auf allen Karten. In den Einstellungen (Bereich Grafik) steht „Qualität: Niedrig / Hoch“ (bis November 2026 „Schön / Schnell“) (gemerkt; zum Testen `?grafik=schoen` oder `?grafik=schnell`).

- **Bildausgabe:** Beide Stufen zeichnen direkt auf den Bildschirm, damit die Kantenglättung des Geräts greift. Helle Stellen fängt eine eigene Belichtungskurve weich ab (`CustomToneMapping` in `js/render.js`: unter 0,62 bleibt jede Farbe, darüber läuft sie weich gegen 0,95, nichts wird reinweiß). Eine frühere Fassung zeichnete „Schön“ über einen Zwischenspeicher mit Schein- und Farbdurchgängen; auf dem iPhone krisselten dort die Kanten und das Bild überstrahlte.
- **Beide Stufen:** Uferschaum und helles Flachwasser, Glut an den Lavaufern, unregelmäßiger Boden, nasser Saum am Wasser (Höhenprofil als Textur `hgtTex`), abgerundete Kanten an Kisten, Blechlingen, Fahrzeugen und Hauptquartieren (`gfxRoundBox`), Schattierung in Senken, an Baumfüßen und unter Brücken (beim Laden in die Bodenfarben gerechnet), Gras blendet in der Ferne aus, Schatten rasten auf ganze Schattenpixel ein (kein Kriechen der Schattenkanten), Wind in Bäumen, Wolkenschatten, Morgennebel, Wasserspiegelung, Metallglanz (`js/look.js`).
- **Nur Schön:** volle Auflösung (bis 2-fach), Schatten 2048, schärfere Texturen aus flachem Winkel, dunklere Bildecken (Überlagerung im Seitenrahmen), Lichtsaum an Einheiten, Schattenflecken unter Bäumen, Mündungsfeuer, Explosionen mit Feuerball, Rauch und Glut, Druckwelle und Funken, Fahrzeugstaub, Spuren in Schnee und Asche.
- **Schnell / Niedrig:** Auflösung bis 1,5-fach, Schatten 1024, ohne die Extras aus „Schön“; Randlicht schwächer.
- **Erster Start:** Touch-Geräte mit wenig Speicher (`deviceMemory` ≤ 3) oder höchstens vier Kernen beginnen auf „Niedrig“, sonst „Hoch“.
- **Kontaktschatten:** `M.blob` mit weichem Rand unter Figuren und Fahrzeugen, Kisten über ein Instanzen-Netz (`LOOK.crateBlobs`).
- Läuft das Spiel zweimal hintereinander unter 24 Bildern pro Sekunde und hat man nichts fest gewählt, stellt es von selbst auf „Schnell“.
- **Weniger Zeichenvorgänge:** Bäume, Felsen, Sandsäcke, Schilf und Brücken (`STATIC_ROOTS` in `js/world.js`) werden beim Laden je Material und Kartenviertel zu wenigen großen Netzen zusammengefasst, die Inseln am Horizont (`FAR_ROOTS`) zu einem einzigen. Kleinteile der Blechlinge werfen keinen Schatten mehr. Auf der Insel sinken die Zeichenvorgänge pro Bild von etwa 1400 auf 400. Wer neue feste Deko baut, hängt sie an `STATIC_ROOTS` an; alles, was sich später bewegt oder ändert, darf dort nicht hinein.
- **FPS-Anzeige:** Schalter in den Einstellungen, Bereich Grafik (`?fps` zum Testen). Zeigt Bilder pro Sekunde, das längste Bild der letzten halben Sekunde, Zeichenvorgänge und Dreiecke.
- Shader anderer Dateien bleiben erhalten: `gfxChain` hängt sich hinter vorhandene `onBeforeCompile`-Funktionen und gibt jeder Änderung ein Kennzeichen (`customProgramCacheKey`), damit three.js einen geänderten Shader nie einem Material ohne diese Änderung gibt (Wasser, Lava, Durchblick-Loch).

## Wasser

`js/water.js` hängt einen Shader an das Wassermaterial aus `js/world.js`. Beim Laden entsteht eine 256er-Textur über die Karte: Rot = Abstand zur Küste (Zweipass-Abstandsrechnung, bis 16 Einheiten), Grün = Wassertiefe. Daraus Tiefenfarbe (`uDeep`, `uShallow`, je Karte), Uferschaum und eine zweite, pulsierende Schaumlinie. Wellen aus zwei gegenläufigen Normalen-Texturen, Himmelsspiegelung über die Himmelsfarben aus `sky`, Glitzern über die Sonnenrichtung. `WATER.q` schaltet Glitzern und zweite Linie für „Niedrig“ ab. `gfxSplash(x, z, groß)` macht Schaumring, Tropfen und Gischt.

## Schnee

`js/snow.js`, nur auf dem Gebirge und in der Weihnachtsedition auf der Insel (`SNOW.on`). Eine eigene kleine Szene mit Kamera von oben zeichnet in eine Textur (`SNOW.target()`, 512 bzw. 256): Fußabdrücke und Reifenrillen mit Maximum-Mischung, alle 0,2 s eine Subtraktion von 2/255 zum Zuschneien. Ob eine Einheit läuft, liest der Schnee an der Positionsänderung ab, nicht an `u.moving` (das setzt `update` vor `updateMood` schon zurück). `snowCover(x, z)` in `js/xmas.js` (0 dünn bis 1 tief) steuert in der Weihnachtsedition Bodenfarbe, Gras und zusätzliche Verwehungen (`SNOW.deep`). Der Bodenshader liest sie (Kennzeichen `trail`). Verwehungen und Hauben sind ein einziges Instanzen-Netz; `SNOW.drifts` und `SNOW.inDrift(x, z)` liefern die Bremszonen, `moveUnit` ist umhüllt (`SNOW.slow` = 0,82).

## Tag, Nacht und Wetter

`js/daynight.js`, auf allen Karten, nur Optik und Ton. Einstellungen › Spiel: Tageszeit Auto / Tag / Nacht (`kk-tod`, `DN.tod`) und Wetter Zufall / Klar / Regen / Gewitter / Schneesturm (`kk-wx`, `DN.wsel`; `?tagnacht=aus` heißt Klar). Wetterzustand in `DN.wx` (`want`, `kind`, `storm`, Stärke `s` gegen `lvl`); den Plan bei „Zufall“, Regenstreifen, Tropfenringe, Nässe (`WX.wet`, Glanz der gemeinsamen Phong-Materialien), Pfützen, Blitzeinschläge (`TREES` aus `js/world.js`, `WX.strike`), Schneesturm-Streifen und Wind an Fallschirmkisten (`wxCrate`, aufgerufen in `js/game.js`) macht `js/weather.js`. Zufall: `WX.plan` (`next`, `on`), unabhängig von der Spielphase. Ton: `mainOut` (Gesamt, `kk-main`) mit `master` (Effekte, `kk-vol-v2`), Musik (`kk-mvol-v2`) und `natureOut` (Natur und Wetter, `kk-nat`; Regen, Wind, Donner, Grummeln) in `js/audio.js`. Objekte ohne Nebel am Horizont tragen `userData.kkFar` und werden bei dichtem Wetter ausgeblendet.

- **Tageszeit:** hängt an der Spielzeit `gameT`. Ein Tag dauert 8 Minuten (`DN.DAY`), die Runde beginnt am Vormittag, nach gut dreieinhalb Minuten wird es Abend, die Nacht dauert etwa drei Minuten. Weil der Gast im Mehrspieler die Spielzeit des Hosts kennt, sehen beide dieselbe Tageszeit. Der Spielstand speichert die Spielzeit und damit auch die Tageszeit.
- **Licht:** Das Modul läuft direkt nach `updateMood` und verändert dessen Ergebnis: Sonnenstand (`SUN_OFF`), Farben von Sonne, Himmel und Dunst, Abendrot, Mondlicht, Sterne.
- **Nachts:** eine echte Lampe (Laterne am eigenen Blechling); alles andere sind gemalte Lichtflecken (Lichtkegel vor Einheiten, Kisten, Hauptquartiere). So bleibt die Zahl der Lichter gleich und nichts ruckelt beim Umschalten.
- **Wetter:** Insel Regen und Gewitter (Blitz, Donner), Gebirge Schneesturm mit Nebel (das vorhandene Schneetreiben weht stärker, `window.wxWind`), Vulkan Ascheregen, Weihnachtsedition auf der Insel nur Dunst. Wer das Spiel rechnet, würfelt das Wetter; der Gast bekommt es alle paar Sekunden gemeldet (`wx`). Wettertöne spielt jedes Gerät selbst.
- Zum Testen: `DN.fixed = 0` (Mitternacht) bis `0.5` (Mittag), `DN.setWeather('regen', true)`.

## Weihnachtsedition

Vom 1. November bis 10. Januar schaltet sich jedes Jahr automatisch die Weihnachtsedition ein (Datum des Geräts): Banderole im Startmenü, Blechlinge als Weihnachtsmänner, Elfen und Schneemänner, Christbaumkugeln statt Kugeln, Schlitten statt Panzer (verschießt Geschenke), Motorschlitten, Schneeball-Katapult, Nussknacker-Türme, Lebkuchenhäuser, Geschenkkisten mit Schleife, verschneite Landschaft mit geschmückten Tannen, Lichterketten, Eisschollen und Schneefall, und statt der Möwen fliegt ab und zu der Weihnachtsmann mit Rentieren vorbei. Dazu läuft weihnachtliche Musik (Jingle Bells als Funk und Breakbeat, O Tannenbaum als Jazzwalzer, beide gemeinfrei), Treffer klingen nach Glöckchen, der Schlitten bringt Schlittenglocken mit, und die Blechlinge haben weihnachtliche Namen und Sprüche. Im Menü lässt sie sich abschalten. Zum Ausprobieren außerhalb der Saison: `?weihnachten` an die Adresse hängen, `?normal` erzwingt die normale Version.

## Stabilität

- Ton läuft nach Bildschirmsperre, App-Wechsel oder Anruf beim nächsten Tippen wieder; am iPhone auch bei eingeschaltetem Stummschalter (Safari 16.4+).
- Das Spiel pausiert automatisch, wenn die App in den Hintergrund geht.
- Ein einzelner Fehler in einem Bild hält das Spiel nicht mehr an; erst bei vielen Fehlern hintereinander erscheint ein Fehlerbildschirm mit „Neu laden“. Das gilt auch, wenn eine Spieldatei nicht geladen werden kann.
- Setzt das Gerät die 3D-Grafik zurück, pausiert das Spiel und zeigt einen Hinweis, bis sie wiederhergestellt ist.

Die Hauptversion des Spiels ist dieses Repository. Änderungen im ursprünglichen Claude-Artifact kommen hier nicht automatisch an.

## Menü und Einstellungen

`js/menu.js` (lädt nach `js/net.js`) steuert Hauptmenü (`#panelStart`: Spielen, Mehrspieler, Einstellungen), Spielstart (`#panelPlay`: Kartenbilder `#mapSeg`, Schwierigkeit `#diffSeg`, `#startBtn`, `#continueBtn`), Einstellungen (`#panelSettings`, vier Bereiche als Reiter, Bereich gemerkt in `kk-settab`) und Pause. Die Schalter sitzen in den Dateien, die sie betreffen: Qualität und weiche Schatten (`kk-soft`) in `js/gfx.js`, Tageszeit und Wetter in `js/daynight.js`, Ton und Schwierigkeit in `js/game.js` (beide Schwierigkeitsleisten tragen die Klasse `diffSeg`; während einer Runde gilt die Wahl erst für die nächste, `D` bleibt), Weihnachtsedition in `js/xmas.js`; Tipps (`kk-tips`, Klasse `notips`), Spuren (`kk-trails`, `SNOW.trails`), Kamera umkehren (`kk-inv`, `lookInv` in `js/input.js`) und Vibration (`kk-vib`) in `js/menu.js`. Im Mehrspieler ist die Pause eine Ebene (`MENU.overlay`), `state` bleibt `'play'`.
