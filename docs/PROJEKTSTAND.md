# Kistenkrawall – Projektstand

Stand: 5. November 2026 · Live-Version auf `main`: `3c27d49` (PR #12)

## Links

- **Spiel:** https://daniela-dettmann.github.io/Kistenkrawall/
- **Tonstudio (im Spiel):** https://daniela-dettmann.github.io/Kistenkrawall/tonstudio.html
- **Tonstudio (Claude-Artifact):** https://claude.ai/artifact/EyDV8ZfZRF1kVqB9HL2NFP
- **Repository:** https://github.com/daniela-dettmann/Kistenkrawall
- **Weihnachtsedition außerhalb der Saison ansehen:** `…/Kistenkrawall/?weihnachten` (`?normal` erzwingt die normale Version)

## Verlauf

| PR | Inhalt | Status |
| --- | --- | --- |
| #1 | Spiel aus dem Claude-Artifact ins Repo übernommen, Veröffentlichung über GitHub Pages | gemergt |
| #2 | App-Icon und Progressive Web App (installierbar, offline) | gemergt |
| #3 | Ton repariert: Audio nach Unterbrechung, iPhone-Stummschalter | gemergt |
| #4 | Projekt aufgeteilt, three.js und Schriften lokal, Fehlerschutz, automatischer Test vor jedem Deploy | gemergt |
| #5 | Hintergrundmusik (fünf Stücke) im Tonstudio | gemergt |
| #6 | Hinweis „Neue Version verfügbar“ und Versionsanzeige | gemergt |
| #7 | Hintergrundmusik im Spiel | gemergt |
| #8 | Standardlautstärke: Musik 10 %, Effekte 70 % | gemergt |
| #9 | Spielstand speichern und fortsetzen | gemergt |
| #10 | Weihnachtsedition: Look | gemergt |
| #11 | Weihnachtsedition: Musik, Töne, Namen und Sprüche | gemergt |
| #12 | Starthinweis bleibt nach „Weiterspielen“ nicht mehr stehen | gemergt |
| #13 | Projektstand im Repo (`docs/PROJEKTSTAND.md`), Anleitung zur Pflege in Google Drive (`CLAUDE.md`) | offen |

## Was umgesetzt ist

### Bereitstellung und App
- Das Spiel läuft auf GitHub Pages. Jeder Push auf `main` wird zusammengestellt, im Browser getestet und nur bei Erfolg veröffentlicht. Pull Requests werden ebenfalls getestet.
- Eigenes App-Icon: orangefarbener Blechling springt aus einer aufgesprengten Kiste, vor einer Explosion auf Petrol. Als SVG und in allen PNG-Größen, inklusive Android-Variante mit Rand zum Zuschneiden, iPhone-Icon und Favicons.
- Progressive Web App: auf Handy und Rechner installierbar, startet im Vollbild und Querformat und läuft nach dem ersten Start komplett offline.
- three.js r128 und die Schriften liegen im Repo, das Spiel lädt nichts von fremden Servern.

### Updates
- Jeder Deploy bekommt automatisch eine eigene Version, ein Hochzählen von Hand ist nicht nötig.
- Die App prüft beim Start, bei Rückkehr aus dem Hintergrund und alle 30 Minuten auf neue Versionen. Erst wenn eine neue Version komplett geladen ist, kommt der Hinweis: im Menü als Banner „Neue Version verfügbar“, während einer Runde nur als Abzeichen plus Knopf im Pausenmenü, am Rundenende als Knopf.
- Unten im Startmenü steht die laufende Version mit Datum und Kennung.

### Ton und Musik
- Alle Töne werden live im Browser erzeugt, es gibt keine Audiodateien.
- Ton kommt nach Bildschirmsperre, App-Wechsel oder Anruf zurück. Auf dem iPhone ist er auch bei eingeschaltetem Stummschalter hörbar (Safari 16.4+).
- Getrennte Regler für Effekte und Musik im Start- und Pausenmenü, dazu „Ton aus“. Standard: Effekte 70 %, Musik 10 %.
- Eigene Hintergrundmusik im Stil funkiger Konsolenspiele der späten 90er, mit Slap-Bass, Orgel, Clavinet, Bläsern, Vibraphon und Schlagzeug:
  - Titelthema im Menü (Funk in E, 104 BPM)
  - Bauruhe (Groove in D, 90 BPM)
  - Angriffswelle (Breakbeat in E-Moll, 124 BPM); beim Wellenstart Trommelwirbel und Wechsel am nächsten Taktanfang
  - Sieg-Fanfare und Niederlage-Posaune
- Im Pausenmenü ist die Musik leiser, bei viel Geballer wird sie etwas zurückgenommen.
- Tonstudio: alle Musikstücke und Effekte zum Anhören, mit Taktanzeige und Übergangstest Bauruhe ↔ Angriff.

### Stabilität
- Code aufgeteilt in Stil und einzelne Skripte (Welt, Einheiten, Kampf, KI, Steuerung, HUD, Audio, Musik, Spielstand, Updates, Weihnachten).
- Ein einzelner Fehler hält das Spiel nicht mehr an. Erst bei vielen Fehlern hintereinander oder einer fehlenden Datei erscheint ein Fehlerbildschirm mit „Neu laden“.
- Automatische Pause, wenn die App in den Hintergrund geht.
- Setzt das Gerät die 3D-Grafik zurück, pausiert das Spiel mit einem Hinweis.

### Spielstand
- Ein Spielstand wird automatisch gespeichert: beim Pausieren (auch beim Wegwischen der App), beim Schließen und alle 30 Sekunden.
- Gespeichert werden Welle und Bauruhe, Schwierigkeit, Hauptquartiere, alle Blechlinge, Fahrzeuge und Türme mit Position, Leben, Waffe, Munition, Schild und Gold-Status, Kisten am Boden, auf den Stapeln und in den Armen, Wellenplanung, wartende Luftschläge, Statistik und Kamera. Ein Spielstand ist etwa 5 KB groß.
- Im Startmenü steht oben „Weiterspielen“ mit Stand und Zeitpunkt. Fortgesetzt wird im Pausenmenü.
- Sieg, Niederlage oder „Neues Spiel“ löschen den Spielstand. Unpassende oder kaputte Spielstände werden mit Hinweis verworfen.

### Weihnachtsedition (jedes Jahr 1. November bis 10. Januar)
- Startbildschirm: schräge rot-weiße Banderole „Weihnachtsedition“, Weihnachtsmütze auf dem K, Schneehaube auf „KISTEN“, Schneefall. Schalter zum Abschalten.
- Blechlinge reihum als Weihnachtsmann, Elf und Schneemann, mit Mützenrand bzw. Hutband in Teamfarbe.
- Waffen: Christbaumkugeln (Knipser, MG, Turm), Schneeflocken (Spritzer), Sterne (Streuer), Feuerwerksraketen (Krachrohr).
- Fahrzeuge: Schlitten statt Panzer, der Geschenkpakete verschießt, Motorschlitten, Schneeball-Katapult, Nussknacker-Türme.
- Kisten in Geschenkpapier mit Schleife (Farbcode bleibt), goldenes Sonderpaket, rot-weiße Fallschirme.
- Welt: verschneite Landschaft, geschmückte Tannen mit Stern, Schneehauben, Schneewälle, Lichterketten an den Brücken, Eisschollen im Fluss, Lebkuchenhäuser als Hauptquartiere, Schneefall.
- Statt der Möwen fliegt alle ein bis zwei Minuten der Weihnachtsmann mit sechs Rentieren vorbei, Rudolphs Nase leuchtet.
- Musik (gemeinfreie Melodien, eigene Arrangements): Titelthema als Jingle-Bells-Funk, Bauruhe als O-Tannenbaum-Walzer im 3/4-Takt, Angriffswelle als Jingle-Bells-Breakbeat, Sieg-Fanfare „Jingle all the way“.
- Treffer klingen nach Glöckchen, der Schlitten bringt Schlittenglocken mit, die Blechlinge haben weihnachtliche Namen und Sprüche.

## Automatischer Test

Vor jedem Deploy startet GitHub das Spiel in einem echten Browser und prüft unter anderem:
- Dateien: alles verlinkt, offline gespeichert, nichts von fremden Servern
- Spiel: Start, 3D-Grafik, Pause, Wellen, Ton, Ton nach Unterbrechung, automatische Pause
- App: Service Worker, Spiel startet offline
- Spielstand: Runde speichern, neu laden, fortsetzen, alles identisch, Löschen am Rundenende
- Musik: richtige Stücke in Menü, Bauruhe, Welle und am Rundenende, Standardlautstärken
- Weihnachtsedition: Saisongrenzen, Kostüme, Geschenkkisten, Geschosse, Schlitten, Musik, Namen
- Tonstudio und Update-Hinweis

## Projektstruktur

| Datei / Ordner | Inhalt |
| --- | --- |
| `index.html` | Seitengerüst: Menüs, HUD, Knöpfe, Fehlerbildschirm |
| `css/style.css` | Aussehen von Menüs, HUD und Weihnachts-Startbildschirm |
| `js/core.js` … `js/game.js` | Spiel: Welt, Inhalte, Einheiten, Kampf, KI, Steuerung, HUD, Ablauf |
| `js/sounds.js`, `js/audio.js`, `js/music.js` | Effekte, Audio-Steuerung, Musik-Sequenzer und Kompositionen |
| `js/save.js` | Spielstand |
| `js/xmas.js` | Weihnachtsedition |
| `js/update.js` | Update-Hinweis und Versionsanzeige |
| `vendor/`, `fonts/`, `icons/` | three.js, Schriften, App-Icons |
| `sw.js`, `manifest.webmanifest` | Offline-Speicher und App-Einstellungen |
| `tonstudio.html` | Tonstudio |
| `tests/smoke.cjs` | Automatischer Browser-Test |
| `.github/workflows/pages.yml` | Testen und Veröffentlichen |
| `docs/PROJEKTSTAND.md` | Dieser Projektstand (wird nach jedem Merge auch in Google Drive aktualisiert) |
| `CLAUDE.md` | Hinweise für Claude, unter anderem zur Pflege des Projektstands |

## Grenzen und offene Punkte

- Auf echten Handys habe ich nichts ausprobiert, getestet wurde in Chromium ohne Grafikkarte. Wie flüssig die Weihnachtsedition auf älteren Geräten läuft, ist offen.
- Die Musik konnte ich nicht anhören, nur messen: keine Übersteuerung, keine Lücken, gleiche Lautstärke.
- iPhone: iOS kann Daten von Web-Apps löschen, die etwa eine Woche nicht geöffnet wurden. Das betrifft auch den Spielstand.
- Änderungen am ursprünglichen Claude-Artifact „Kistenkrawall“ kommen nicht automatisch ins Repo. Die Hauptversion ist das Repository.
