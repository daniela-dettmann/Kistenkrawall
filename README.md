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
| `js/mountain.js`, `js/volcano.js` | Karten Gebirge und Vulkan: Licht, Wetter, Krater und Ausbruch |
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

Jeder Push auf `main` startet `.github/workflows/pages.yml`: Die Seite wird zusammengestellt, im Browser getestet (Spiel starten, Ton, Pause, offline, Tonstudio) und nur bei Erfolg auf GitHub Pages veröffentlicht. Pull Requests werden ebenfalls getestet, aber nicht veröffentlicht. Den Mehrspieler-Test (lokaler PeerServer, drei Browserseiten) überspringt GitHub; er läuft nur lokal, mit `KK_MP_TEST=1` auch auf GitHub. Die Offline-Version in `sw.js` setzt der Workflow automatisch auf den Commit, installierte Apps bekommen Updates also ohne Handarbeit.

Lokal testen:

```sh
npm install
npx playwright install chromium
npm test
```

## Spielstand

Eine laufende Partie wird automatisch gespeichert, sobald das Spiel pausiert (auch wenn die App in den Hintergrund geht) und alle 30 Sekunden. Im Startmenü erscheint dann „Weiterspielen“ mit Welle, Schwierigkeit und Zeitpunkt; fortgesetzt wird im Pausenmenü. Sieg, Niederlage oder „Neues Spiel“ löschen den Spielstand. Kugeln, Explosionen und Flieger im Anflug werden nicht gespeichert. Ändert sich das Format so, dass alte Spielstände nicht mehr passen, wird `SAVE_FORMAT` in `js/save.js` erhöht; alte Spielstände werden dann mit einem Hinweis verworfen.

## Karten

Im Startmenü lässt sich zwischen **Insel**, **Gebirge** und **Vulkan** wählen. Insel und Gebirge folgen demselben Grundriss: Eine unpassierbare Mitte (Fluss bzw. Schlucht) wird bei x = −18 und x = +18 überquert, in der Mitte jedes Übergangs liegt ein Plateau, auf dem die Kisten landen. Deshalb funktionieren Bewegung und KI auf beiden Karten gleich. Auf dem Gebirge ist links eine breite Brücke, rechts ein enger Pass. Das Höhenprofil steht in `js/core.js` (`hgtMountain`), Licht, Horizont, Schneetreiben und Adler in `js/mountain.js`. Die Welt wird beim Laden gebaut, ein Kartenwechsel lädt die Seite neu. Zum Testen: `?karte=gebirge`, `?karte=vulkan` oder `?karte=insel`.

Der **Vulkan** weicht davon ab: Der Lavastrom in der Mitte ist breiter, darin liegt eine einzige große Insel mit dem Vulkankegel. Von jedem Ufer führen zwei Brücken (x = −8 und x = +8) auf die Insel, alle Kisten landen dort. Die Maße stehen in `js/core.js` (`BX`, `BANK`, `ISL_RX`, `ISL_RZ`, `ZS` verschiebt alles, was am Ufer steht), das Höhenprofil in `hgtVolcano`, die Wegführung in `volcanoWaypoint` (`js/combat.js`), Krater, Rauch und Ausbruch in `js/volcano.js`. Beim Ausbruch wird eine Brücke nach kurzer Warnung mit Lavabrocken beworfen; `bridgeClosed(bx, seite)` sagt der Wegführung und der Minikarte, welche.

## Mehrspieler (1 gegen 1)

„Gegen Freund spielen“ im Startmenü: Eine Person erstellt einen Raum und gibt den 8-stelligen Code weiter, die andere tritt bei. Die Geräte verbinden sich direkt und verschlüsselt per WebRTC; den Verbindungsaufbau vermittelt der kostenlose öffentliche PeerJS-Server (sieht die IP-Adressen, nicht das Spiel). Im gleichen WLAN läuft die Verbindung automatisch lokal.

- Der Host (Orange) rechnet das Spiel und schickt etwa zehnmal pro Sekunde den Stand, der Gast (Petrol) schickt nur seine Eingaben. Beide Teams haben gleich starke KI-Mitstreiter, automatische Wellen gibt es im Mehrspieler nicht.
- Raumcodes aus kryptografischem Zufall ohne 0/O/1/I/L, Ablauf nach 10 Minuten ohne Beitritt, nur ein Gast, Versionsvergleich, Prüfung jeder Nachricht (Format, Werte, Größe, Häufigkeit), kein Chat, keine persönlichen Daten.
- Abbruch: beide pausieren, 60 Sekunden lang verbindet sich der Gast selbst wieder. Verlässt der Host das Spiel, endet es für beide. Der Einzelspieler-Spielstand bleibt unberührt.
- TURN-Server: noch keiner. Er wird in `js/net.js` unter `NET_CFG.turn` eingetragen, falls Verbindungen übers Internet scheitern.
- Code: `js/net.js`, Bibliothek `vendor/peerjs-1.5.4.min.js` (eine Änderung: kommt ein Datenkanal für eine schon geschlossene Verbindung an, wird er ignoriert, statt einen Fehler zu werfen). Der Test nutzt einen lokalen PeerServer (`?peerserver=127.0.0.1:PORT`, nur auf localhost erlaubt) und läuft nur lokal, nicht auf GitHub.

## Weihnachtsedition

Vom 1. November bis 10. Januar schaltet sich jedes Jahr automatisch die Weihnachtsedition ein (Datum des Geräts): Banderole im Startmenü, Blechlinge als Weihnachtsmänner, Elfen und Schneemänner, Christbaumkugeln statt Kugeln, Schlitten statt Panzer (verschießt Geschenke), Motorschlitten, Schneeball-Katapult, Nussknacker-Türme, Lebkuchenhäuser, Geschenkkisten mit Schleife, verschneite Landschaft mit geschmückten Tannen, Lichterketten, Eisschollen und Schneefall, und statt der Möwen fliegt ab und zu der Weihnachtsmann mit Rentieren vorbei. Dazu läuft weihnachtliche Musik (Jingle Bells als Funk und Breakbeat, O Tannenbaum als Jazzwalzer, beide gemeinfrei), Treffer klingen nach Glöckchen, der Schlitten bringt Schlittenglocken mit, und die Blechlinge haben weihnachtliche Namen und Sprüche. Im Menü lässt sie sich abschalten. Zum Ausprobieren außerhalb der Saison: `?weihnachten` an die Adresse hängen, `?normal` erzwingt die normale Version.

## Stabilität

- Ton läuft nach Bildschirmsperre, App-Wechsel oder Anruf beim nächsten Tippen wieder; am iPhone auch bei eingeschaltetem Stummschalter (Safari 16.4+).
- Das Spiel pausiert automatisch, wenn die App in den Hintergrund geht.
- Ein einzelner Fehler in einem Bild hält das Spiel nicht mehr an; erst bei vielen Fehlern hintereinander erscheint ein Fehlerbildschirm mit „Neu laden“. Das gilt auch, wenn eine Spieldatei nicht geladen werden kann.
- Setzt das Gerät die 3D-Grafik zurück, pausiert das Spiel und zeigt einen Hinweis, bis sie wiederhergestellt ist.

Die Hauptversion des Spiels ist dieses Repository. Änderungen im ursprünglichen Claude-Artifact kommen hier nicht automatisch an.
