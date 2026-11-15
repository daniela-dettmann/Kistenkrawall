# Kistenkrawall – Projektstand

Stand: 15. November 2026 · Live-Version auf `main`: `8a06327` (PR #32: Tests nur im Pull Request, Gewitter-Ton neu)

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
| #13 | Projektstand im Repo (`docs/PROJEKTSTAND.md`), Anleitung zur Pflege in Google Drive (`CLAUDE.md`) | gemergt |
| #14 | Anleitung zur Drive-Pflege korrigiert (neue Datei hochladen, alte in den Papierkorb) | gemergt |
| #15 | Zweite Karte „Gebirge“ mit Kartenwahl, Schlucht, breiter Brücke, engem Pass und Schneetreiben | gemergt |
| #16 | Mehrspieler 1 gegen 1 über Raumcode (WebRTC/PeerJS), Host rechnet, faire KI für beide Teams | gemergt |
| #17 | Kein versehentliches Reinzoomen mehr auf dem Handy; Durchblick-Loch im Gebirge, damit Hänge die Figur nicht verdecken | gemergt |
| #18 | Mehrspieler: Gast erkennt sofort, wenn der Host den Raum geschlossen hat; Mehrspieler-Test läuft nur noch lokal, auf GitHub nur der schnelle Test; Übergabedatei `docs/UEBERGABE.md`; damit geht auch #17 live | gemergt |
| #19 | Dritte Karte „Vulkan“: Lavastrom mit großer Vulkaninsel, vier Brücken, Krater, Kisten auf der Insel, Ausbrüche sperren kurz eine Brücke | gemergt |
| #20 | Vulkan nachgebessert: keine orangen Flecken mehr im Boden, dunkles Meer (auch in der Weihnachtsedition), Lavastrom endet an der Küste mit erkaltetem Gestein und Dampf, Lava weniger grell | gemergt |
| #21 | Grafik-Paket für alle Karten: Schalter „Schön / Schnell“, Bildeffekte (Schein, Farbe, dunklere Ecken), Uferschaum und Flachwasser, Lavaglut am Ufer, Bodendetails, Schattenflecken, Druckwelle und Funken, Fahrzeugstaub | gemergt |
| #22 | Tag, Nacht und Wetter auf allen Karten: Tageslauf über 8 Minuten, Abendrot, Mondnacht mit Sternen, Laterne und Lichtkegeln, leuchtende Kisten; Regen und Gewitter, Schneesturm, Ascheregen; Schalter im Menü. Dazu: flüssiger (Zeichenvorgänge pro Bild auf unter ein Drittel), FPS-Anzeige, Helligkeit in „Schön“ gedämpft, Winterlicht in der Weihnachtsedition | gemergt |
| #23 | Nach Danielas Test auf dem iPhone 15 Pro Max (33 FPS, Flimmern am Ufer, überhellte Stellen): Schatten nur jedes zweite Bild, Blechlinge und Hauptquartiere zusammengefasst, Weihnachtsdeko mit halb so vielen Dreiecken, Schaumkante am Ufer neu, Sonne wandert in Schritten, Schein nur noch um echte Lichter | gemergt |
| #24 | Grafik neu: direkt auf den Bildschirm statt Nachbearbeitung (gegen Krisseln und Überstrahlen), Belichtungskurve; A: schärfere Texturen, Gras blendet aus, Schatten rasten ein, runde Kanten; B: Schattierung in Senken, Lichtsaum, Metallglanz, Wasserspiegelung; C: Wind, Wolkenschatten, Spuren, Spritzer, Mündungsfeuer, Explosionen, Morgennebel | gemergt |
| #25 | Auftrag „Grafik-Upgrade Wasser, Schnee und Plastizität“, Schritt 1: Wasser mit Tiefenfarbe aus Küstenabstand, zwei Schaumlinien, gegenläufigen Wellen, Himmelsspiegelung, Sonnenglitzern, Spritzern mit Tropfen; Wolken werfen keine harten Schatten mehr; Schalter heißt jetzt „Grafik: Hoch / Niedrig“ | gemergt |
| #26 | Auftrag Grafik-Upgrade, Schritt 2: Schnee mit Spurenkarte (Fußabdrücke, Reifenrillen, schneien nach gut 12 s zu), Verwehungen an Bäumen, Felsen, Sandsäcken, Hauptquartieren und in Senken (bremsen auf 82 %, es staubt), Schneehauben auf Kisten, Felsen, Sandsäcken, Schneestaub an den Füßen | gemergt |
| #27 | Auftrag Grafik-Upgrade, Schritt 3: weiche Kontaktschatten unter Figuren, Fahrzeugen und Kisten, warmes Randlicht auf Figuren und Fahrzeugen (auch auf „Niedrig“, dort schwächer), Grafikstufe beim ersten Start nach Gerät | gemergt |
| #28 | Schnee nachgebessert nach Danielas iPhone-Test: Fußspuren erschienen im echten Spiel nie (der Merker „läuft“ war schon zurückgesetzt, als der Schnee ihn las; gleicher Fehler bei Fahrzeugstaub und Aschespuren), jetzt größer, deutlicher und gut 25 s sichtbar; Schnee liegt ungleich (dünne Stellen mit Gras, tiefe Schneefelder mit Verwehungen); Verwehungen als weiche Hügel statt Halbkugeln; Morgennebel mit weichen Rändern (war die grünlich gesprenkelte Fläche mit gerader Kante); Deploy-Fehler von #27 (Sieg-Jingle) behoben | gemergt |
| #29 | Auftrag „Menü aufräumen und Einstellungen im Spiel“: Hauptmenü mit drei Knöpfen und „Zuletzt: …“, Spielstart mit Kartenbildern und Schwierigkeit, Einstellungen in vier Bereichen (Spiel, Grafik, Ton, Steuerung) mit neuen Schaltern (Tageszeit, Wetter, Tipps, weiche Schatten, Spuren im Schnee, Kamera umkehren, Vibration), aus Hauptmenü und Pause erreichbar; Pausenmenü neu, Pause-Knopf oben rechts; Mehrspieler-Pause nur als Ebene | gemergt |
| #30 | Test „Sieg-Jingle am Rundenende“ robust: Der Jingle dauert nur 3,6 s; auf ausgelasteten Testmaschinen schaute der Test erst nach dessen Ende nach (Deploys von #27 und #29 scheiterten daran). Jetzt hält er fest, welches Stück das Rundenende startet | gemergt |
| #31 | Auftrag „Dynamisches Wetter“: Wetterwahl Zufall/Klar/Regen/Gewitter/Schneesturm, Unwetter zu Beginn der Angriffswellen, Schauer in der Bauruhe, Weihnachtsedition mit Schneefall statt Dunst; Regenstreifen, Tropfenringe, nasser Glanz, Pfützen mit Spritzern; Gewitter mit dunklem Himmel, Blitzstrahlen und Einschlägen in Bäume (Feuer, angekohlt); Schneesturm waagerecht mit dichtem Nebel und schnell zuschneienden Spuren; Wind lässt Fallschirmkisten schwanken | gemergt |
| #32 | Browser-Test nur noch im Pull Request, in vier Teilen gleichzeitig, Testbrowser im Cache; Deploy ohne erneuten Test. Gewitter-Ton neu: Regenrauschen statt „tsch, tsch“, Donner nach Blitzkanal-Modell, leises Grummeln, Wind im Schneesturm; Vulkan-Grollen wieder eigenständig | gemergt |
| #33 | CLAUDE.md: Umfang des lokalen Tests (voll vor dem ersten Push, bei Korrekturen nur betroffene Teile, außer bei Spielcode für mehrere Teile), erst mergen, wenn alle vier Testteile grün sind. Wetter „Zufall“ unabhängig von Bauruhe und Welle. Ton in vier Reglern: Gesamt, Musik, Effekte, Natur und Wetter | gemergt |

## Was umgesetzt ist

### Bereitstellung und App
- Das Spiel läuft auf GitHub Pages. Der Browser-Test läuft nur im Pull Request, in vier Teilen gleichzeitig (je etwa 2 bis 5 Minuten statt gut 16 Minuten am Stück). Nach dem Merge wird die Seite ohne erneuten Test zusammengestellt und veröffentlicht. Deshalb erst mergen, wenn alle vier Testteile grün sind (empfohlen: in GitHub unter Settings › Branches für `main` „Require status checks to pass“ mit „test (Teil 1)“ bis „test (Teil 4)“).
- Eigenes App-Icon: orangefarbener Blechling springt aus einer aufgesprengten Kiste, vor einer Explosion auf Petrol. Als SVG und in allen PNG-Größen, inklusive Android-Variante mit Rand zum Zuschneiden, iPhone-Icon und Favicons.
- Progressive Web App: auf Handy und Rechner installierbar, startet im Vollbild und Querformat und läuft nach dem ersten Start komplett offline.
- three.js r128 und die Schriften liegen im Repo, das Spiel lädt nichts von fremden Servern.

### Updates
- Jeder Deploy bekommt automatisch eine eigene Version, ein Hochzählen von Hand ist nicht nötig.
- Die App prüft beim Start, bei Rückkehr aus dem Hintergrund und alle 30 Minuten auf neue Versionen. Erst wenn eine neue Version komplett geladen ist, kommt der Hinweis: im Menü als Banner „Neue Version verfügbar“, während einer Runde nur als Abzeichen plus Knopf im Pausenmenü, am Rundenende als Knopf.
- Unten im Hauptmenü steht die laufende Version mit Datum und Kennung.

### Menü und Einstellungen (Auftrag „Menü aufräumen“, `js/menu.js`)
- Hauptmenü mit nur drei Knöpfen: **Spielen** (groß), **Mehrspieler**, **Einstellungen**. Darunter „Zuletzt: Insel, normal“, bei einem Spielstand ergänzt um „gespeicherte Runde wartet“.
- Spielstart: Karten als Bildkarten (Insel, Gebirge, Vulkan, die gewählte orange umrandet), Schwierigkeit Leicht / Normal / Schwer, „Los geht's“, oben „Zurück“. Gibt es einen Spielstand, steht dort oben „Weiterspielen“. Karte und Schwierigkeit werden gemerkt: von „Spielen“ bis zum Start sind es zwei Tipps. Eine andere Karte lädt die Seite neu (die Welt wird beim Laden gebaut), danach ist der Spielstart wieder offen.
- Einstellungen in vier Bereichen als Kacheln (im Hochformat 2×2, auf dem Handy quer in einer Reihe), je höchstens fünf Zeilen, alles wird sofort gespeichert:
  - Spiel: Schwierigkeit, Bauruhe zwischen den Wellen, Tageszeit Auto / Tag / Nacht, Wetter, Tipps anzeigen (Tastenzeile, Wischhinweis, Beschriftung der Sticks); dazu „Wie wird gespielt?“
  - Grafik: Qualität Niedrig / Hoch, weiche Schatten, Spuren im Schnee (auch Aschespuren), FPS-Anzeige, Weihnachtsedition (nur in der Saison; lädt neu, eine laufende Runde geht pausiert weiter)
  - Ton: Ton an/aus, Musik und Effekte als Regler mit Zahl
  - Steuerung: Kamera umkehren (Wischen, Ziehen und rechter Stick drehen andersherum), Vibration bei Treffern. Safari auf dem iPhone kann Webseiten nicht vibrieren lassen; der Schalter ist dort ausgegraut und sagt das.
- Dieselben Einstellungen öffnen sich aus der Pause, der Zurück-Knopf heißt dort „Zurück zur Pause“. Alles wirkt sofort; Schwierigkeit („Gilt ab der nächsten Runde“) und Bauruhe („Gilt ab der nächsten Bauruhe“) sagen, dass sie später greifen. Die laufende Runde behält ihre Schwierigkeit, auch im Spielstand.
- Pause: Knopf oben rechts (46 px), am Rechner auch Escape oder P. Pausenmenü: **Weiter** (groß), Einstellungen, Neu starten, Hauptmenü, dazu wie bisher „Nächste Welle jetzt starten“ in der Bauruhe. Escape in den Einstellungen führt einen Schritt zurück.
- Mehrspieler: Die Pause ist nur eine Ebene über dem Spiel, das Spiel läuft bei beiden weiter, Eingaben gehen solange nicht ans Spiel. Ohne „Neu starten“ und ohne „Nächste Welle“. Nur ein Verbindungsabbruch hält beide Geräte an.
- Alle Knöpfe im Menü sind mindestens 44 px hoch.

### Ton und Musik
- Alle Töne werden live im Browser erzeugt, es gibt keine Audiodateien.
- Ton kommt nach Bildschirmsperre, App-Wechsel oder Anruf zurück. Auf dem iPhone ist er auch bei eingeschaltetem Stummschalter hörbar (Safari 16.4+).
- Einstellungen › Ton: Ton an/aus und vier Regler mit Zahl: **Gesamt** (alles), **Musik**, **Effekte** (Schüsse, Explosionen, Kisten, Signale, auch das Vulkan-Grollen als Warnung) und **Natur und Wetter** (Regen, Wind, Donner, Grummeln). Standard: Gesamt 100 %, Musik 10 %, Effekte 70 %, Natur und Wetter 50 %. Gemessen: Die Musik liegt damit gut 7 dB über dem Regen (vorher, als Natur über den Effekt-Regler lief, nur etwa 4 dB).
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
- Die Seite lässt sich nicht mehr versehentlich zoomen (Doppeltipp oder zwei Finger beim Steuern).
- Setzt das Gerät die 3D-Grafik zurück, pausiert das Spiel mit einem Hinweis.

### Spielstand
- Ein Spielstand wird automatisch gespeichert: beim Pausieren (auch beim Wegwischen der App), beim Schließen und alle 30 Sekunden.
- Gespeichert werden Welle und Bauruhe, Schwierigkeit, Hauptquartiere, alle Blechlinge, Fahrzeuge und Türme mit Position, Leben, Waffe, Munition, Schild und Gold-Status, Kisten am Boden, auf den Stapeln und in den Armen, Wellenplanung, wartende Luftschläge, Statistik und Kamera. Ein Spielstand ist etwa 5 KB groß.
- Im Spielstart steht oben „Weiterspielen“ mit Stand und Zeitpunkt, das Hauptmenü weist darauf hin. Fortgesetzt wird im Pausenmenü.
- Sieg, Niederlage oder „Neues Spiel“ löschen den Spielstand. Unpassende oder kaputte Spielstände werden mit Hinweis verworfen.

### Karten: Insel und Gebirge
- Im Spielstart steht vor der Schwierigkeit die Kartenwahl als Bildkarten. Die Wahl wird gemerkt, die Insel bleibt unverändert.
- Gebirge: Die Hauptquartiere liegen in Tälern auf gegenüberliegenden Seiten, ringsum verschneite Gipfel und Berge am Horizont. In der Mitte trennt eine tiefe Schlucht die beiden Hälften, mit Wolken unterhalb der Kanten.
- Zwei Wege führen über die Schlucht: links eine breite Holzbrücke, rechts ein enger Pass zwischen hohen Felswänden. Beide sind breit genug für Panzer und Fahrzeuge.
- Die Kisten landen auf offenen Plateaus in der Mitte beider Wege, gleich weit von beiden Basen entfernt (blau bei der Brücke, gelb am Pass).
- Felsen, Eis, bereifte Büsche, nur Tannen, ständiges Schneetreiben, kühleres Licht. Statt Möwen kreisen Adler.
- Durchblick-Loch: Die Kamera bleibt starr; Gelände zwischen Kamera und eigener Figur wird in einem weichen Kreis ausgeblendet, damit ein Hang am Rand die Figur nie verdeckt.
- Bewegung und KI-Wege funktionieren wie auf der Insel. Geprüft: Blechling, Panzer und Buggy beider Teams kommen über Brücke und Pass, keiner bleibt hängen.
- Der Spielstand merkt sich die Karte. „Weiterspielen“ lädt bei Bedarf zuerst die richtige Karte. Alte Spielstände ohne Kartenangabe gelten als Insel.
- Die Weihnachtsedition gilt auf beiden Karten. Auf dem Gebirge hängen die Lichterketten an der Brücke, statt eines zweiten Schneefalls läuft das Schneetreiben.
- Die Musik ist auf beiden Karten dieselbe.

### Karte Vulkan
- Dritte Karte in der Kartenwahl. Quer durch die Karte fließt ein Lavastrom, in seiner Mitte liegt eine große Vulkaninsel. Von jedem Ufer führen zwei Steinbrücken auf die Insel, zusammen vier. Alle Wege laufen über die Insel.
- In der Inselmitte steht der Vulkankegel mit Krater, Lavasee, Glut und Rauchsäule. Er ist nicht begehbar, man läuft links oder rechts daran vorbei.
- Alle Kisten landen auf der Insel: blaue links vom Krater, gelbe rechts, Goldkisten direkt am Kraterrand.
- Ausbruch: Etwa einmal pro Minute grollt der Vulkan. Eine der vier Brücken wird markiert (gelbe Ringe, Blinken auf der Minikarte) und nach 3,5 Sekunden Warnung einige Sekunden lang mit Lavabrocken beworfen, die allen dort Schaden machen. Die Ufer wechseln sich ab, damit es beide Teams gleich oft trifft. Die KI weicht in der Zeit auf die andere Brücke aus.
- Aussehen: schwarzer Basalt, Asche, verkohlte Bäume, warmes, dunstiges Licht, ringsum ein dunkles Meer. Der Lavastrom endet an beiden Küsten an erkaltetem Gestein, dort steigt Dampf auf.
- Technik: Der Grundriss ist in `js/core.js` verallgemeinert (Lage der Brücken, Breite des Stroms, Inselform). Der Vulkan hat eine eigene Wegführung (`volcanoWaypoint` in `js/combat.js`): Ufer → Brückenkopf → Insel → um den Krater → Brücke → Ufer.
- Funktioniert mit Spielstand, im Mehrspieler (der Host meldet Warnung und Lavabrocken an den Gast) und in der Weihnachtsedition (ohne Schneedecke und Eisschollen, die Lava bleibt).
- Geprüft im Test und in einer simulierten Runde über acht Minuten: Beide Teams sammeln Kisten, die Welle kommt über die Insel, niemand läuft durch die Lava.

### Grafik (alle Karten)
- Qualität „Niedrig / Hoch“ in den Einstellungen (Bereich Grafik), wird gemerkt. Ruckelt das Spiel, stellt es von selbst auf „Schnell“, solange nichts fest gewählt ist.
- Schön: weicher Schein um Explosionen, Lava, Goldkisten und Sonne, etwas kräftigere Farben und Kontraste, warme Lichter und kühle Schatten, dunklere Bildecken. Explosionen mit Druckwelle und Funken, Fahrzeuge ziehen Staub, Bäume und Felsen haben einen Schattenfleck am Boden.
- In beiden Stufen: Schaum und helles Flachwasser am Ufer, Glut dort, wo Lava auf Land trifft, unregelmäßigerer Boden, nasser Saum am Wasser.
- Schnell: ohne Nachbearbeitung, kleinere Schatten, geringere Auflösung.
- Fällt die Nachbearbeitung auf einem Gerät aus, zeichnet das Spiel wie vorher.
- Geschwindigkeit: Bäume, Felsen, Sandsäcke und Brücken werden beim Laden zu wenigen großen Netzen zusammengefasst. Vorher wurde jedes Teil einzeln gezeichnet, zweimal pro Bild (Bild und Schatten). Auf der Insel sinken die Zeichenvorgänge von etwa 1400 auf 400, in der Taktik-Ansicht von 890 auf 260.
- Nachbesserung nach dem ersten Test auf dem iPhone 15 Pro Max (33 FPS bei 815 Zeichenvorgängen und 685.000 Dreiecken in der Weihnachtsedition, spät in der Runde): Die Schattenkarte wird nur noch jedes zweite Bild neu gezeichnet. Blechlinge, Fahrzeuge und Hauptquartiere sind je Gelenk und Material zusammengefasst. Die feste Deko liegt in einem 3-mal-3-Raster, sodass nur die sichtbaren Felder gezeichnet werden. Kugeln, Lichter und Schneehauben der Weihnachtsdeko haben weniger Dreiecke und werfen keinen Schatten. In derselben nachgestellten Szene sinken die Dreiecke von 678.000 auf rund 360.000, die Zeichenvorgänge von 688 auf rund 570.
- Flimmern am Ufer behoben: Die Höhenkarte für Schaum und Lavaglut hat jetzt genau einen Punkt pro Geländepunkt. Vorher war sie gröber und versetzt, die Schaumkante war gezackt und flackerte. Der Schaum ist weicher und langsamer.
- Die Sonne wandert in kleinen Schritten alle 2,5 Sekunden statt in jedem Bild, damit Schattenkanten nicht ständig kriechen.
- Überhellte Stellen: Der Schein greift nur noch bei echten Lichtern (Schwelle 0,96), nicht mehr bei Sand, Himmel und Schnee. Helle Flächen werden stärker abgefangen. Die Laterne ist auf Schnee halb so stark. Gemessen in sieben Szenen: kein Bildpunkt über 250 von 255.
- FPS-Anzeige in den Einstellungen (Bereich Grafik) einschaltbar: Bilder pro Sekunde, längstes Bild, Zeichenvorgänge, Dreiecke.
- Helle Flächen fressen in „Schön“ nicht mehr aus (weiche Obergrenze für Lichter, Boden wird nicht mehr aufgehellt). Die Weihnachtsedition hat ein kühles Winterlicht mit bläulichen Schatten, damit der Schnee wie Schnee aussieht.

- Neu aufgebaut nach Danielas zweitem iPhone-Test („Schön“ krisselte an Kanten und überstrahlte stellenweise): Beide Stufen zeichnen jetzt direkt auf den Bildschirm, die Kantenglättung des iPhones greift also in beiden. Helle Stellen fängt eine Belichtungskurve in jedem Material weich ab, nichts wird mehr reinweiß. Schein gibt es nur noch an echten Lichtern (Explosionen, Mündungsfeuer, Lava, Goldkisten). Die dunkleren Ecken sind eine einfache Überlagerung.
- Ruhigeres Bild: Bodentexturen aus flachem Winkel schärfer, Gras blendet in der Ferne aus (dünne Halme flimmerten), Schatten rasten auf ganze Schattenpixel ein (Schattenkanten kriechen nicht mehr), Kisten, Blechlinge, Fahrzeuge und Hauptquartiere mit leicht abgerundeten Kanten.
- Mehr Tiefe: Senken, Baumfüße und der Boden unter Brücken sind etwas dunkler (beim Laden berechnet). Blechlinge und Fahrzeuge haben in „Schön“ einen Lichtsaum. Metall und Lack spiegeln den Himmel, morgens anders als abends. Wasser spiegelt flach angeschaut den Himmel, dazu ein weicher Glanz Richtung Sonne.
- Mehr Leben: Bäume, Büsche und Palmen wiegen sich im Wind, bei Sturm stärker. Wolkenschatten ziehen über die Karte. Morgens liegt Nebel in Senken und über dem Fluss. In Schnee und Asche bleiben Fußspuren und Fahrzeugspuren, die nach einigen Sekunden verblassen. Kisten, die ins Wasser fallen, spritzen. Beim Schießen blitzt das Mündungsfeuer, Explosionen haben Feuerball, Rauchsäule und Glut.
- Gemessen im Testbrowser (gleiche Auflösung): Insel am Tag in „Schön“ Helligkeit 155, kein Bildpunkt über 245; Weihnachten 180 statt vorher 184 bis 220 bei „Schnell“ mit 57 % fast weißen Punkten. Auf dem iPhone selbst ist das nicht geprüft.

### Wasser (Auftrag Grafik-Upgrade, Schritt 1)
- Ein Shader auf dem vorhandenen Wassermaterial (`js/water.js`), kein zweites Bild für Spiegelungen.
- Beim Laden wird einmal eine Karte berechnet: Abstand jedes Wasserpunkts zur Küste (bis 16 Einheiten) und Wassertiefe. Daraus: tief dunkelblau, flach türkis, am Ufer etwas durchsichtiger.
- Uferschaum: weißer, wabernder Rand an der Küste, dazu eine zweite, schwächere Linie etwa 1,5 Einheiten draußen, die pulsiert.
- Wellen: zwei gegeneinander laufende, gekachelte Normalen-Texturen.
- Himmelsspiegelung bei flachem Blick und Sonnenglitzern; beides folgt Himmelsfarbe und Sonnenstand der Tageszeit, nachts ohne Glitzern.
- Spritzer, wenn eine Kiste ins Wasser fällt: Schaumring, Tropfen, Gischt. Figuren können im Spiel nicht ins Wasser fallen, daher nur Kisten.
- Wolken werfen keine harten Schatten mehr (sie lagen als dunkle Flecken auf dem Wasser und kosteten etwa 80 Zeichenvorgänge im Schattendurchgang); die weichen Wolkenschatten auf dem Boden bleiben.
- Der Grafikschalter heißt jetzt „Grafik: Hoch / Niedrig“ (vorher „Schön / Schnell“). Auf „Niedrig“ ohne Glitzern und ohne zweite Schaumlinie.
- Gebirge hat kein Wasser; Vulkan-Meer und Weihnachtsedition haben eigene Wasserfarben.
- FPS vorher und nachher: noch nicht gemessen. Messbar nur auf dem iPhone, Daniela schickt die Werte.

### Schnee (Auftrag Grafik-Upgrade, Schritt 2; Gebirge und Weihnachtsedition auf der Insel)
- Spurenkarte (`js/snow.js`): eine 512er-Textur über das Spielfeld (256 auf „Niedrig“). Blechlinge drücken alle 0,6 Einheiten einen Fußabdruck hinein, abwechselnd links und rechts; Fahrzeuge ziehen zwei durchgehende Rillen. Alle 0,2 Sekunden wird die Karte etwas aufgehellt, nach gut 25 Sekunden ist eine Spur wieder zugeschneit. Ob eine Figur läuft, liest der Schnee an ihrer Position ab (bis #27 las er einen Merker, der zu diesem Zeitpunkt schon zurückgesetzt war, deshalb gab es im Spiel keine Spuren).
- Der Boden liest die Karte: Abdrücke sind dunkler und bläulich, haben einen hellen Rand und fangen das Licht wie eine Mulde. Echtes Absenken des Geländes geht nicht, das Gitter ist mit etwa einer Einheit zu grob für Fußabdrücke; deshalb nur über die Lichtrichtung (wie im Auftrag als Ausweichweg vorgesehen).
- Schnee liegt ungleich (Weihnachtsedition): eine weiche Rauschkarte (`snowCover` in `js/xmas.js`) bestimmt, wo eine dünne Schicht liegt (Gras schaut grünlich durch, Halme stehen höher) und wo tiefer Schnee (reinweiß, Halme halb eingeschneit, zusätzliche Verwehungen).
- Schneeverwehungen als weiche Hügel ohne harte Kante: an der windabgewandten Seite von Bäumen und Felsen, an jedem zweiten Sandsack, an den vier Ecken der Hauptquartiere, in bis zu 24 Senken und bis zu 46 auf tiefen Schneefeldern. Wer hindurchläuft oder fährt, ist auf 82 % gebremst; Fahrzeuge wirbeln dabei Schnee auf. Gilt für alle Einheiten gleich, auch für die KI und im Mehrspieler (der Host rechnet).
- Schneehauben auf Kisten (nur auf der obersten Lage eines Stapels), Felsen und Sandsäcken.
- Beim Laufen leichter Schneestaub an den Füßen, in Verwehungen mehr (nur „Hoch“).
- Die frühere Spur aus aufgelegten Flecken bleibt nur noch für die Asche am Vulkan.
- FPS vorher und nachher: nur auf dem iPhone messbar.

### Kontaktschatten und Randlicht (Auftrag Grafik-Upgrade, Schritt 3; alle Karten)
- Kontaktschatten: Der flache schwarze Kreis unter Figuren und Fahrzeugen hat jetzt einen weichen Rand, ist etwas größer und in der Mitte dunkler. Kisten bekommen denselben Schatten; beim Herunterfallen wird er kleiner, je höher die Kiste ist. Gestapelte und getragene Kisten haben keinen eigenen.
- Randlicht: warmes Licht an den Kanten von Figuren und Fahrzeugen (Fresnel im Material), nachts etwas kühler. Auf „Niedrig“ schwächer statt aus.
- Grafikstufe beim ersten Start: Touch-Geräte mit wenig Speicher oder höchstens vier Kernen beginnen auf „Niedrig“, alles andere auf „Hoch“. Danach entscheidet wie bisher die Bildrate (zweimal hintereinander unter 24 Bildern pro Sekunde, und man hat nichts fest gewählt: „Niedrig“). Ein iPhone 15 Pro Max beginnt auf „Hoch“.
- SSAO (im Auftrag optional, nur Desktop) nicht gebaut: Die Schattierung in Senken und die Kontaktschatten decken das ab, und ein zusätzlicher Bilddurchgang würde wieder genau den Weg gehen, der auf dem iPhone gekrisselt hat.
- FPS vorher und nachher für alle drei Schritte: nur auf dem iPhone messbar, Werte stehen noch aus.

### Tag, Nacht und Wetter (alle Karten)
- Ein Tag dauert 8 Minuten. Die Runde beginnt am Vormittag, nach gut dreieinhalb Minuten kommt das Abendrot, dann etwa drei Minuten Nacht, dann der Morgen. Die erste Welle fällt bei sechs Minuten Bauruhe in die Nacht.
- Nachts: Mondlicht, Sterne, eine Laterne am eigenen Blechling, Lichtkegel vor allen Blechlingen und Fahrzeugen, leuchtende Kisten und Hauptquartiere. Die Lava leuchtet von selbst und erhellt die Vulkannacht.
- Wetter (Auftrag „Dynamisches Wetter“, `js/weather.js`): Einstellungen › Spiel › Wetter: **Zufall / Klar / Regen / Gewitter / Schneesturm**, gemerkt, wirkt sofort, auch aus der Pause (bis #30 nur an/aus; wer es aus hatte, bekommt „Klar“).
- Warum man vorher kaum Wetter sah: In der Weihnachtsedition auf der Insel gab es nur „Dunst“ ohne Regen oder Partikel; sonst kam das erste Wetter frühestens nach 70 bis 110 Sekunden, Regen waren winzige Punkte, und der Schneesturm verstärkte nur das ohnehin laufende Schneetreiben.
- Zufall: Klar und Wetter wechseln sich zufällig ab, unabhängig von Bauruhe, Angriffswelle oder Mehrspieler: 60 bis 150 Sekunden klar (zu Rundenbeginn nur 40 bis 80 s, damit jede Runde früh Wetter hat), dann 40 bis 90 Sekunden Wetter, zu 60 % ein Schauer bzw. Schneefall, zu 40 % ein Unwetter, danach klart es auf. Weihnachtsedition und Gebirge: Schneefall bis Schneesturm; Insel: Regen und Gewitter; Vulkan: Ascheregen und Gewitter. (Bis #32 hing das Unwetter an der Angriffswelle.)
- Übergänge blenden über einige Sekunden; ein Unwetter macht Himmel und Licht deutlich dunkler, der Wind frischt auf (Bäume, Gras, Schnee).
- Regen: Regenstreifen um die Kamera (1400, auf „Niedrig“ unter der Hälfte), Tropfenringe auf dem Wasser und in Pfützen (nur „Hoch“), nasser Glanz auf Kisten, Blechlingen und Fahrzeugen, bis zu 26 Pfützen an flachen Stellen (meist auf den Wegen), die den Himmel spiegeln und nach dem Regen langsam trocknen; Fahrzeuge spritzen beim Durchfahren.
- Gewitter: dunkler Himmel, Blitz über der ganzen Szene (manchmal doppelt), Donner leicht verzögert; meist ist ein Blitzstrahl in der Ferne zu sehen, ab und zu schlägt einer in einen Baum in der Nähe ein, der brennt kurz mit Feuer und Rauch und ist danach angekohlt.
- Schneesturm: waagerecht treibende Schneestreifen in Windrichtung, Schneefall treibt seitlich, dichter Nebel, Spuren schneien drei- bis viermal schneller zu. Inseln und Berge am Horizont (ohne eigenen Nebel) werden bei dichtem Wetter ausgeblendet, damit sie nicht in der Luft schweben.
- Wind: Fallschirmkisten schwanken und landen bis gut eine Einheit versetzt, nie Richtung Wasser oder Lava. Sonst keine Wirkung aufs Spiel: Sichtweite, Zielen und KI bleiben gleich.
- Im Mehrspieler entscheidet der Host das Wetter, der Gast sieht dasselbe; Blitzeinschläge in Bäume sind nur Optik und können auf beiden Geräten verschieden sein.
- Töne: Regen als gleichmäßiges Rauschen, das mit der Stärke mitgeht (vorher ein Rauschstoß jede Sekunde: „tsch, tsch“), böiger Wind im Schneesturm. Donner nur nach einem Blitz: Für jeden Donner wird ein zufälliger, zickzackförmiger Blitzkanal berechnet; aus den Laufzeiten seiner Stücke ergibt sich, wann es lauter und leiser rollt, der Klang selbst ist weiches, tiefes Rauschen, bei nahem Einschlag mit kurzem Krachen, dazu Landschafts-Echos. Ferner Donner ist tiefer und weicher. Während eines Gewitters grummelt es alle 12 bis 30 Sekunden leise in der Ferne. Im Tonstudio: Regen, Donner, Donner (fern), Gewitter grummelt in der Ferne. Ein erster Versuch mit reinen Druckstößen klang übersteuert und wurde verworfen.

### Mehrspieler (1 gegen 1)
- Hauptmenü: „Mehrspieler“ mit „Raum erstellen“ (Code anzeigen, kopieren, teilen) und „Raum beitreten“ (Code eingeben). Karte (im Spielstart) und Bauruhe (Einstellungen) wählt der Host vorher.
- Direkte, verschlüsselte WebRTC-Verbindung, Vermittlung über den öffentlichen PeerJS-Server. Im gleichen WLAN läuft sie lokal. Noch kein TURN-Server, der Platz dafür ist vorbereitet (`NET_CFG.turn` in `js/net.js`).
- Der Host spielt Orange und rechnet das Spiel, der Gast spielt Petrol, schickt nur Eingaben und bekommt etwa zehnmal pro Sekunde den Stand. Seine eigene Figur bewegt sich sofort und wird sanft korrigiert.
- Faire Regeln: beide Teams mit gleich starken KI-Mitstreitern, keine automatischen Wellen.
- Sicherheit: Raumcode aus kryptografischem Zufall (8 Zeichen ohne 0/O/1/I/L), Ablauf nach 10 Minuten, nur ein Gast, Versionsvergleich mit Hinweis „bitte aktualisieren“, jede Nachricht geprüft (Format, Werte, Größe, Häufigkeit), Texte nur als Text angezeigt, kein Chat, keine persönlichen Daten.
- Die Pause ist im Mehrspieler nur eine Ebene, das Spiel läuft weiter (seit #29; vorher pausierte sie beide). Bei Abbruch „Verbindung verloren“, 60 Sekunden automatisches Wiederverbinden. Verlässt der Host das Spiel, endet es für beide, auch wenn seine Abschiedsnachricht verloren geht (der Gast merkt beim Wiederverbinden, dass der Raum weg ist). Der Einzelspieler-Spielstand wird nie überschrieben.
- Der Gast sieht Explosionen, Töne, Schüsse und seine Meldungen. Flieger beim Luftschlag sieht er nicht, nur die Einschläge.

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

Bei jedem Pull Request startet GitHub das Spiel in einem echten Browser (vier Teile gleichzeitig, `KK_PART=1..4`; lokal läuft alles am Stück) und prüft unter anderem:
- Dateien: alles verlinkt, offline gespeichert, nichts von fremden Servern
- Menü: Hauptmenü nur mit drei Knöpfen und „Zuletzt: …“, Tippflächen ab 44 px, Pausenmenü mit Weiter, Einstellungen, Neu starten, Hauptmenü, Einstellungen aus der Pause („Zurück zur Pause“, Hinweis „Gilt ab der nächsten Runde“), Schalter wirken sofort und werden gespeichert (Schwierigkeit erst nächste Runde, weiche Schatten, Spuren, Tipps, Kamera umkehren, Musik-Regler), Escape führt zurück, nach Kartenwechsel ist der Spielstart offen, Hinweis auf gespeicherte Runde
- Spiel: Start, 3D-Grafik, Pause, Wellen, Ton, Ton nach Unterbrechung, automatische Pause
- App: Service Worker, Spiel startet offline
- Spielstand: Runde speichern, neu laden, fortsetzen, alles identisch, Löschen am Rundenende
- Musik: richtige Stücke in Menü, Bauruhe, Welle und am Rundenende, Standardlautstärken
- Weihnachtsedition: Saisongrenzen, Kostüme, Geschenkkisten, Geschosse, Schlitten, Musik, Namen
- Gebirge: Kartenwahl, Höhen von Schlucht, Brücke, Pass und Tal, Wegfindung über beide Wege, Runde mit Schneetreiben, Spielstand mit Karte, Weihnachtsedition auf dem Gebirge
- Nur lokal (`node tests/smoke.cjs`, auf GitHub übersprungen): Mehrspieler mit zwei Browsern und lokalem Vermittlungsserver: Raumcode, Beitritt, voller Raum, Versionsunterschied, Rollen, faire KI, Steuerung des Gasts, ungültige Nachrichten, Pause, Abbruch und Wiederverbinden, Einzelspieler-Spielstand unberührt, Host verlässt das Spiel
- Vulkan: Kartenwahl, Höhen von Lavastrom, Brücken, Insel und Krater, Wegfindung über die Insel und um den Krater (nie durch die Lava), Runde mit Kisten auf der Insel, Ausbruch (Sperre, Ausweichen, Schaden nur auf der Brücke), Weihnachtsedition auf dem Vulkan
- Helligkeit: unter 2 % ganz helle Bildpunkte am Mittag in „Schön“; Blechlinge zusammengefasst, Schatten jedes zweite Bild
- Geschwindigkeit: feste Deko ist zusammengefasst, unter 700 Zeichenvorgänge pro Bild; FPS-Anzeige einschaltbar
- Kontaktschatten und warmes Randlicht vorhanden, Randlicht auf „Niedrig“ schwächer
- Schnee: Blechlinge hinterlassen im laufenden Spiel Fußspuren (ohne Nachhilfe im Test), Fußspuren in der Spurenkarte, Verwehungen bremsen leicht, Schneehauben auf Kisten; Weihnachtsedition: Schnee liegt ungleich
- Wasser: Küstenabstand berechnet, Tiefenfarbe und Schaum im Shader, Spritzer mit Tropfen und Schaumring
- Grafik neu: Belichtungskurve, dunklere Ecken nur in „Schön“, Schattierung in Senken, runde Kanten, Wind, Lichtsaum, Metallglanz, Gras blendet aus, Explosion mit Feuerball, Rauch und Glut, Mündungsfeuer
- Grafik: Standard „Schön“, Bild wird mit Bildeffekten gezeichnet (nicht schwarz), Uferschaum und Schattenflecken vorhanden, Explosion mit Druckwelle und Funken, Umschalten auf „Schnell“ wird gemerkt
- Tag, Nacht und Wetter: Beginn am Tag, Nacht folgt der Spielzeit (Sterne, Laterne, Lichtkegel, leuchtende Kisten und Hauptquartiere, Mondlicht), Regen und Gewitter, Aufklaren, Tageszeit „Tag“ und „Nacht“
- Wetter: Wetterwahl Regen (Streifen, nass, Pfützen), Gewitter mit Blitzeinschlag (Baum angekohlt), Schneesturm (waagerecht, Nebel, Wind), Klar; Zufall: Wetter kommt und geht zufällig, in der Bauruhe wie in der Welle; Wind versetzt Fallschirmkisten etwas, nie ins Wasser
- Tonstudio und Update-Hinweis

Der Mehrspieler-Teil ist auf GitHub zu langsam und wackelig (Grafik ohne Grafikkarte, drei Browserseiten gleichzeitig). Er läuft deshalb nur lokal vor dem Push; mit `KK_MP_TEST=1` lässt er sich auch auf GitHub erzwingen.

## Projektstruktur

| Datei / Ordner | Inhalt |
| --- | --- |
| `index.html` | Seitengerüst: Menüs, HUD, Knöpfe, Fehlerbildschirm |
| `css/style.css` | Aussehen von Menüs, HUD und Weihnachts-Startbildschirm |
| `js/core.js` … `js/game.js` | Spiel: Welt, Inhalte, Einheiten, Kampf, KI, Steuerung, HUD, Ablauf |
| `js/sounds.js`, `js/audio.js`, `js/music.js` | Effekte, Audio-Steuerung, Musik-Sequenzer und Kompositionen |
| `js/save.js` | Spielstand |
| `js/xmas.js` | Weihnachtsedition |
| `js/mountain.js` | Gebirge: Licht, Berge am Horizont, Schneetreiben, Adler (Höhenprofil in `js/core.js`) |
| `js/gfx.js` | Grafik-Paket: Qualitätsschalter, Bildeffekte, Uferschaum, Lavaglut, Bodendetails, Effekte |
| `js/daynight.js` | Tag, Nacht und Wetter |
| `js/weather.js` | Wetter: Plan bei „Zufall“, Regenstreifen, Tropfenringe, nasser Glanz, Pfützen, Blitzeinschläge, Schneesturm, Wind an den Fallschirmkisten |
| `js/menu.js` | Menü: Hauptmenü, Spielstart, Einstellungen mit vier Bereichen, Pause, Mehrspieler-Pause als Ebene, Schalter für Tipps, Spuren, Kamera umkehren, Vibration |
| `js/snow.js` | Schnee: Spurenkarte, Verwehungen mit Bremsen, Schneehauben, Schneestaub |
| `js/water.js` | Wasser: Tiefenfarbe, Uferschaum, Wellen, Himmelsspiegelung, Sonnenglitzern, Spritzer |
| `js/look.js` | Aussehen: Wind, Wolkenschatten, Morgennebel, Wasserspiegelung, Metallglanz, Lichtsaum, Spuren, Explosionen, Mündungsfeuer |
| `js/volcano.js` | Vulkan: Licht, Krater, Rauch, Ausbruch (Grundriss in `js/core.js`, Wegführung in `js/combat.js`) |
| `js/update.js` | Update-Hinweis und Versionsanzeige |
| `js/net.js` | Mehrspieler: Verbindung, Raumcode, Prüfung, Spielstand-Übertragung |
| `vendor/`, `fonts/`, `icons/` | three.js, PeerJS, Schriften, App-Icons |
| `sw.js`, `manifest.webmanifest` | Offline-Speicher und App-Einstellungen |
| `tonstudio.html` | Tonstudio |
| `tests/smoke.cjs` | Automatischer Browser-Test |
| `.github/workflows/pages.yml` | Testen und Veröffentlichen |
| `docs/PROJEKTSTAND.md` | Dieser Projektstand (wird nach jedem Merge auch in Google Drive aktualisiert) |
| `CLAUDE.md` | Hinweise für Claude, unter anderem zur Pflege des Projektstands |

## Grenzen und offene Punkte

- Auf echten Handys habe ich nichts ausprobiert, getestet wurde in Chromium ohne Grafikkarte. Wie flüssig die Weihnachtsedition auf älteren Geräten läuft, ist offen.
- Gebirge auf dem iPhone: Schneetreiben (900 Flocken) und Weihnachtsdeko sind sparsam gebaut, auf einem echten Gerät aber nicht gemessen.
- Mehrspieler übers Internet ohne TURN-Server: In manchen Netzen (vor allem Mobilfunk) kommt keine Verbindung zustande. Zwei echte Geräte über verschiedene Netze habe ich nicht getestet.
- Geschwindigkeit: Gemessen sind Zeichenvorgänge, nicht Bilder pro Sekunde auf einem echten Gerät. Ob das iPhone 15 Pro Max damit 60 FPS hält, zeigt erst die FPS-Anzeige dort. Im Stromsparmodus begrenzt iOS Webseiten auf 30 FPS. Die Weihnachtsedition zeichnet mit Kugeln und Lichtern gut doppelt so viele Dreiecke wie die normale Fassung.
- Grafik-Paket: nur im Browser ohne Grafikkarte geprüft. Wie flüssig „Schön“ auf echten Handys läuft und ob die Farben dort stimmen, ist offen; der Schalter und das automatische Herunterschalten sind die Absicherung.
- Tag, Nacht und Wetter: nur im Browser ohne Grafikkarte geprüft. Ob die Nacht auf einem Handy-Bildschirm im Hellen noch gut lesbar ist, ist offen. Der Regen besteht aus Punkten statt Strichen. Im Mehrspieler-Test wird die Wettermeldung an den Gast nicht eigens geprüft.
- Vulkan: Auf echten Handys nicht gemessen. Das Gleichgewicht (Brücken näher beieinander, Ausbrüche) ist nur in simulierten Runden geprüft, nicht von Menschen gespielt.
- Wetter: nur im Browser ohne Grafikkarte geprüft (dort 1 bis 2 Bilder pro Sekunde mit und ohne Unwetter, also kein Maß). FPS auf dem iPhone mit und ohne Unwetter stehen noch aus. Pfützen gibt es nicht auf Schnee (Gebirge, Weihnachtsedition).
- Ein eigenes Bauruhe-Stück fürs Gebirge (im Auftrag optional) gibt es noch nicht.
- Bildfehler aus Danielas Screenshots vom 15. November: Die grünlich gesprenkelte Fläche mit gerader Kante war der Morgennebel (eine flache Ebene, die Hänge hart anschnitt und auf dem iPhone flimmerte); er dünnt jetzt über dem Boden aus. Im Testbrowser trat die Kante nicht auf, ob sie auf dem iPhone weg ist, zeigt erst Danielas Test. Der helle Halbkreis am Stapelplatz ist noch ungeklärt.
- Die Musik konnte ich nicht anhören, nur messen: keine Übersteuerung, keine Lücken, gleiche Lautstärke.
- iPhone: iOS kann Daten von Web-Apps löschen, die etwa eine Woche nicht geöffnet wurden. Das betrifft auch den Spielstand.
- Änderungen am ursprünglichen Claude-Artifact „Kistenkrawall“ kommen nicht automatisch ins Repo. Die Hauptversion ist das Repository.
