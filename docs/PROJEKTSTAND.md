# Kistenkrawall – Projektstand

Stand: 20. November 2026 · Live-Version auf `main`: `bc930db` (PR #42: glänzenderes Metall)

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
| #34 | Auftrag „Zwei neue Karten“: Flughafen (Terminal mit drei Fluggastbrücken gegen vier Hangars mit drei Toren, Vorfeld mit zwei Flugzeugen, Rollfeld hinter Zaun über eine Rollbahn, Goldkisten meist dort) und Stadt (3 × 3 Häuserblöcke, Basen in gegenüberliegenden Ecken, Marktplatz, Park, Gasse); eckige Gebäude blockieren Laufen, Sicht und Schüsse, nur der Mörser schießt darüber; Wegfindung mit Raster und A*; Kisten nie auf Dächern; Häuser zwischen Kamera und Figur werden durchscheinend; Weihnachtsedition mit Lichterketten und Baum auf dem Marktplatz; Mehrspieler: Verbindung schließt erst, wenn die Abschiedsnachricht gesendet ist (der Gast blieb sonst manchmal im Spiel) | gemergt |
| #35 | Auftrag „Wüste“: neue Karte mit zwei Oasen (Teiche, Palmen), großer Pyramide mit kreuzförmigem Tunnel (auch für Panzer), Ruinen, vier Dünen mit Felsen, Obelisken an den Eingängen, Sphinx und ferne Pyramiden am Rand, Kamele statt Möwen; Sandsturm mit Vorwarnung, Sandschleier, Heulen und verwehten Kisten (nie in die Pyramide); KI sieht im Sturm weniger weit, wartet mit dem Angriff und sucht Deckung; Weihnachtsedition ohne Schnee mit Lichterketten an Pyramide, Obelisken und Palmen, Kamele und Sphinx mit Mützen | gemergt |
| #36 | Auftrag „Mond“: siebte Karte mit zwei Kuppelbasen (große und kleine Kuppel), großem Krater in der Mitte, zwei kleinen Kratern, Felsbrocken und einem Schlauchgang von Basis zu Basis (vor Beschuss geschützt, aber ein Umweg); Erde groß am schwarzen Sternenhimmel, Mondlandefähre, Mondautos, Flagge, Satellitenschüssel, Sternschnuppen; geringe Schwerkraft (Kisten schweben langsam herab, Blechlinge hüpfen, Staub hängt in der Luft, Mörser schießt weiter und flacher, Schüsse fliegen weiter); kein Wetter, stattdessen Meteoritenschauer; Weihnachtsedition mit Lebkuchenkuppeln, Lichterketten am Schlauchgang und Schlitten vor der Erde | gemergt |
| #37 | Kistenfarben auf Wüste und Mond wie auf den anderen Karten verteilt: Blau landet auf der Westseite, Gelb auf der Ostseite, beide auf beiden Spielhälften (vorher landete Blau nur bei Basis A, Gelb nur bei Basis B); Test prüft, dass jede Farbe für beide Basen gleich weit liegt | gemergt |
| #38 | Auftrag „Grafik und Atmosphäre“, Schritt 1: bunte Punkte in Sandsturm und Meteoritenschauer behoben. Ursache: In der Weihnachtsedition leuchteten die Lichterketten an Pyramide, Obelisken, Säulen, Kuppeln und Schlauchgang unverändert weiter, während die Gebäude im Dunst verschwanden, dazu schwebten helle Pollenpunkte um die Kamera. Jetzt versinken die Lichterketten im Sandsturm und Schneesturm mit im Dunst, Pollen gibt es dort und auf dem Mond (keine Luft) nicht mehr. Außerdem: Die Spielschleife startet erst, wenn alle Skripte geladen sind; vorher konnte die Menü-Schlacht auf Karten mit Gebäuden im ersten Bild mit „navWaypoint is not defined“ abbrechen (fiel im Test auf GitHub auf, steckte seit #34 drin) | gemergt |
| #39 | Auftrag „Grafik und Atmosphäre“, Schritt 2: Lichtstrahlen durch Wolkenlücken und unter Baumkronen, ohne zusätzlichen Bilddurchgang; folgen der Sonne, abends wärmer und länger, nachts, bei Regen, Sturm und auf dem Mond aus, auf „Niedrig“ aus. Außerdem: Der Host schließt die Verbindung nach „Raum voll“ oder „andere Version“ erst, wenn die Nachricht gesendet ist (vorher nach festen 0,2 s, auf ausgelasteten Geräten kam sie manchmal nicht an); ein fremdes Gerät wird abgewiesen, solange die Verbindung zum Gast offen ist und er sich in den letzten 20 s gemeldet hat (vorher 5 s: war das Gerät des Gasts kurz ausgelastet, bekam ein Fremder seinen Platz); der Test „Zufall: Wetter kommt und geht“ nutzt eine feste Zufallsfolge (vorher schlug er in etwa 3 % der Läufe fehl, wenn in 30 Minuten kein Gewitter kam) | gemergt |
| #40 | Auftrag „Grafik und Atmosphäre“, Schritt 3: Tiefe in der Ferne als Luftperspektive (mit Daniela abgestimmt: die günstige Variante reicht, keine echte Unschärfe). Ferne Dinge verlieren Farbe und Kontrast und gehen in den Dunst über, kurz bevor der Nebel einsetzt; Teil des Nebelschritts aller Materialien, kein Bilddurchgang; nur auf „Hoch“ | gemergt |
| #41 | Auftrag „Grafik und Atmosphäre“, Schritt 4: Gras und Büsche geben nach, wo Blechlinge und Fahrzeuge laufen, und richten sich in etwa drei Sekunden wieder auf; nur „Hoch“. Außerdem Mehrspieler: Beim Beitreten wartet das Gerät nicht mehr endlos bei „Verbinde …“; ohne Antwort vom Raum versucht es nach 15 s erneut (bis zu viermal; frühere Versuche bleiben offen, die erste Antwort zählt, und der Host erkennt einen zweiten Versuch desselben Geräts an dessen Kennung) und meldet dann „Keine Antwort vom Raum“ (fiel im lokalen Test auf, wenn der Verbindungsaufbau auf dem überlasteten Testrechner verloren ging) | gemergt |
| #42 | Auftrag „Grafik und Atmosphäre“, Schritt 5: glänzenderes Metall bei den Blechlingen (Arme, Füße, Brustplatte und Kopf spiegeln stärker, schärfere Glanzlichter), Lack mit Klarlack (spiegelt an schrägen Kanten mehr), Spiegelung zeigt unten den Boden der Karte (Gras, Schnee, Sand, Asphalt, Mondstaub), auf dem Mond auch die Erde; auf „Niedrig“ schwächer Außerdem Mehrspieler: Der Beitritts-Wächter aus #41 schloss bei jedem neuen Versuch den alten, eine verspätete Antwort des Hosts ging dadurch verloren (bei einem vierten Gerät kam „Keine Antwort vom Raum“ statt „Raum voll“); jetzt bleiben frühere Versuche offen, die erste Antwort zählt, und der Host erkennt einen zweiten Versuch desselben Geräts. „Raum voll“ und „andere Version“ werden mehrmals gesendet (sofort, nach 1,5, 3, 5 und 8 s), die Verbindung wird erst nach 10 s abgebaut; beim Verlassen wird sie erst 8 s nach dem Abschied abgebaut. Test: Der Mehrspieler-Test startet Chrome ohne Hintergrund-Drosselung. Offen bleibt ein gelegentlicher Fehlschlag im lokalen Mehrspieler-Test (etwa jeder dritte Lauf auf dem Testrechner mit 4 Kernen, auch auf `main`): Beim dritten Gerät kommt „andere Version“ nicht an, und auf der Host-Seite laufen in dieser Zeit über 60 s lang keine Zeitgeber; die Zähler im Test (`NET.stats`) zeigen das. Der volle Test lief grün. | gemergt |
| #43 | Auftrag „Zwei neue Karten“, Karte 8: **Dschungel** mit Stufentempel auf einer Insel in der Mitte (kreuzförmiger Gang, auch für Panzer, Schrein oben, Treppen, Moos und Ranken), Fluss von West nach Ost, der sich um die Insel teilt (sperrt das Laufen, nicht Sicht und Schüsse), zwei Steinstege von den Basen auf die Insel, zwei Hängebrücken an den Seiten (x = −30 und +30). Dichter Regenwald mit hohen Bäumen (Brettwurzeln, Lianen), Palmen, Büschen, Farnen und Riesenblättern, Pfade und vier Lichtungen mit Ruinen, Steinköpfen und umgestürzten Statuen. Blaue Kisten im Westen, gelbe im Osten (je Lichtung und Brückenkopf auf beiden Seiten), Goldkisten neben dem Tempel. Feuchtes, grünes Licht, Papageien statt Möwen, Schmetterlinge, Lichtstrahlen unter dem Blätterdach. Weihnachtsedition: Lichterketten an Tempel, Stegen, Brücken und Bäumen, Mützen auf den Steinköpfen, kein Schnee. Skizze vorher mit Daniela abgestimmt | gemergt |

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
- Glänzenderes Metall (#42, `js/look.js`): Arme, Füße und Brustplatte (gemeinsames Metall) spiegeln stärker (Mischung 0,5 statt 0,3, Glanz 130), der Kopf ebenfalls (0,32, vorher wie Lack). Der Lack bekommt Klarlack: an Kanten, auf die man schräg schaut, spiegelt er deutlich mehr. Die Spiegelung ist ein kleiner Würfel aus Himmel und neu dem Boden der Karte (Wiese, Schnee in Gebirge und Weihnachtsedition, Sand, Asphalt, Asche, Mondstaub; halb zu Grau gemischt, damit es eine Andeutung bleibt, nachts dunkler), auf dem Mond mit der Erde. Er wird wie bisher alle 3 Sekunden neu gezeichnet. Materialien bleiben zusammengefasst. Auf „Niedrig“ schwächer.
- Gras biegt sich (#41, `js/gfx.js`, nur „Hoch“): Grashalme und Blumen biegen sich von Blechlingen (Radius 1,35) und Fahrzeugen (2,6) weg und legen sich etwas hin, Büsche neigen sich oben leicht. Hinter jeder Einheit bleibt eine Spur, die über etwa drei Sekunden verblasst, so richtet sich das Gras langsam wieder auf. Der Grafikchip bekommt dafür nur eine Liste von höchstens 24 „Drückern“ in Kameranähe (aktuelle Positionen und Spurpunkte), keine Textur, die jedes Bild neu hochgeladen werden müsste. Auf „Niedrig“ wird der Grasshader ohne die Biegung gebaut (schon die Schleife allein kostete ohne Grafikkarte spürbar Zeit, der lokale Mehrspieler-Test auf „Niedrig“ wurde dadurch rot); ein Wechsel der Grafikstufe wirkt deshalb erst nach dem nächsten Start.
- Tiefe in der Ferne (#40, `js/gfx.js`): Luftperspektive. Ab etwa einem Drittel der Nebel-Anfangsweite verlieren Dinge mit der Entfernung Farbe und Kontrast und nehmen den Ton des Dunsts an (der folgt Tageszeit und Wetter), bevor der eigentliche Nebel sie verschluckt. Steckt im Nebelschritt, den jedes Material ohnehin rechnet: kein Bilddurchgang, keine Unschärfe, also kein Krisseln. Nur auf „Hoch“ (Stärke 0,42); „Niedrig“ behält den einfachen Nebel und spart die Rechenarbeit auf schwächeren Handys. Wird beim Bauen der Shader festgelegt, ein Wechsel der Grafikstufe wirkt deshalb erst nach dem nächsten Start. Echte Tiefenunschärfe bräuchte einen eigenen Bilddurchgang (auf dem iPhone krisselte und überstrahlte das früher); laut Daniela reicht die günstige Variante.
- Lichtstrahlen (#39, `js/rays.js`, nur „Hoch“): Neben den Wolken in Kameranähe fallen schmale, weiche Lichtbahnen schräg zum Boden, genau aus Richtung der Sonne; sie wandern mit den Wolken und blenden langsam ein und aus. Unter den Baumkronen nahe der Kamera (Bäume, Tannen, Palmen) fallen kurze Strahlen bis zum Boden. Abends werden sie wärmer und länger, nachts, bei Regen, Schnee- und Sandsturm verschwinden sie, auf dem Mond gibt es keine (keine Luft). Gemischt wird wie bei „Bildschirm“ (screen): dunkle und mittlere Töne werden heller, was schon hell ist, kaum noch, damit nichts weiß ausbrennt (am Mittag 0,5 % ganz helle Bildpunkte, erlaubt sind 2 %). Zwei Zeichenvorgänge, kein zusätzlicher Bilddurchgang.
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

### Karten: Flughafen und Stadt (`js/urban.js`, Grundrisse als Daten in `js/core.js`)
- Kartenwahl im Spielstart mit Bildkarten für alle Karten (seit #36 sieben). Die Karte wird gemerkt und im Spielstand gespeichert; „Weiterspielen“ lädt sie.
- **Flughafen** (spiegelgleich, Team A oben, Team B unten): Terminal hinter der Basis von Team A, davor ein Gate-Gebäude mit drei Fluggastbrücken als 5 breite, überdachte Laufwege. Gegenüber vier Hangars mit Bogendach, zwischen ihnen drei gleich breite Tore. In der Mitte das Vorfeld mit zwei geparkten Flugzeugen (Rumpf und Tragflächen sind Deckung), Gepäckwagen, Tower am Westrand. Rechts das Rollfeld hinter einem Zaun, nur über die Rollbahn in der Mitte erreichbar; dort landen die meisten Goldkisten. Ab und zu startet ein Flugzeug am Himmel. Abweichung von der Skizze (mit Daniela abgestimmt): Terminal und Hangars liegen gegenüber statt nebeneinander, wie im Text des Auftrags.
- **Stadt** (punktsymmetrisch): 3 × 3 Blöcke aus je bis zu vier aneinandergebauten Häusern (5 bis 8 m hoch, Fenster, Dachkanten, Schornsteine) mit 8 breiten Straßen und einer Ringstraße. Basis A oben links, Basis B unten rechts, Marktplatz mit Brunnen und vier Marktständen in der Mitte, Park mit Bäumen oben rechts, gegenüber unten links zwei Häuser mit einer 6 breiten Gasse dazwischen, Skyline außerhalb. Kisten landen auf dem Marktplatz, an zwei Straßenstellen, im Park und in der Gasse.
- Gebäude blockieren Laufen, Sicht und direkte Schüsse vollständig; der Mörser schießt in hohem Bogen darüber. Die KI schießt nur bei freier Sicht und geht sonst um das Gebäude herum, auch der Turm am Hauptquartier zielt nur auf Sichtbares.
- Wegfindung: ein Raster aus 1-Meter-Feldern, eines für Blechlinge und eines mit mehr Abstand für Fahrzeuge; A* mit Glättung, neu gerechnet, wenn sich das Ziel bewegt oder nach 3 Sekunden. Ziele in Gebäuden werden auf das nächste freie Feld gelegt. Geprüft: Blechling und Panzer beider Teams erreichen jede Abwurfstelle, das Rollfeld, die Stapelplätze und das gegnerische Hauptquartier, ohne je in ein Gebäude zu geraten; in simulierten 7,5 Minuten hing niemand fest.
- Kisten landen nie auf Dächern; treibt der Wind eine Fallschirmkiste auf ein Gebäude zu, bleibt sie davor. Geschütztürme lassen sich nicht an Gebäuden, in Toren, Fluggastbrücken oder der Gasse bauen.
- Ein Haus zwischen Kamera und eigener Figur wird durchscheinend.
- Tageszeit und Wetter wie überall (Regen und Gewitter; in der Weihnachtsedition Schnee; in der Wüste Sandsturm). Pfützen und Schneeverwehungen liegen nur auf freiem Boden.
- Weihnachtsedition: Lichterketten an allen Dachkanten, ein großer geschmückter Baum statt des Brunnens auf dem Marktplatz, Schnee auf Straßen und Vorfeld, weiße Dächer; Lebkuchen-Hauptquartiere und Geschenkkisten wie auf allen Karten.

### Karte Wüste (Auftrag „Wüste“; Grundriss in `js/core.js`, Modelle in `js/urban.js`)
- Kartenwahl „Wüste“ im Spielstart, gemerkt und im Spielstand gespeichert. Technisch wie Flughafen und Stadt: Hindernisse als Kästen, Wegfindung mit Raster und A*, Hindernisse halten Sicht und direkte Schüsse auf, der Mörser schießt darüber.
- Aufbau (spiegelgleich, Oase A oben, Oase B unten; die Skizze ist um 90° gedreht, damit die Basen wie auf den anderen Karten liegen): zwei Oasen mit je zwei Teichen, Palmen, Schilf und grünem Rand hinter den Basen. In der Mitte eine Pyramide (28 × 28, 13 hoch, goldene Spitze), durch die ein kreuzförmiger Tunnel führt (6 breit, Nord–Süd und Ost–West, mit Eingängen, Sturz und Pfeilern); auch Panzer passen hindurch. Links und rechts Ruinen aus Mauerresten, Säulen und einer umgestürzten Säule, vier flache Dünen mit Felsen als Deckung, vor den Eingängen zu den Oasen je zwei Obelisken mit Hieroglyphen und Goldspitze.
- Deko (auf Danielas Wunsch, damit es weniger leer wirkt): Sphinx außerhalb des Spielfelds im Westen, die zur Pyramide schaut, drei ferne Pyramiden, Kakteen, lose Steinblöcke, trockene Büsche, eine Kamelkarawane am Horizont statt der Möwen.
- Kisten: vor den beiden Pyramideneingängen zu den Oasen, in allen vier Dünen, Goldkisten vor den Ruinen. Blaue Kisten landen in den beiden West-Dünen und auf der Westhälfte beider Eingänge, gelbe in den Ost-Dünen und auf der Osthälfte; so liegt jede Farbe für beide Oasen gleich weit (bis #36 landete Blau nur auf der Seite von Oase A). Nie in der Pyramide oder ihrem Tunnel, auch nicht durch Wind oder Sturm.
- Im Sandsturm (und im Schneesturm) versinken die Lichterketten der Weihnachtsedition mit Pyramide und Obelisken im Dunst, statt als bunte Punkte frei zwischen den Sandstreifen zu schweben; die hellen Pollenpunkte um die Kamera verschwinden (#38).
- Sandsturm (`js/weather.js`): Bei „Zufall“ kommt in der Wüste statt Regen meist ein Sandsturm, sonst leichter Flugsand. Vorwarnung: Meldung „Ein Sandsturm zieht auf – such Deckung!“, der Himmel wird gelblich, der Wind frischt auf; etwa 8 Sekunden später der volle Sturm mit gelbbraunem Nebel (Sicht stark eingeschränkt), waagerecht treibenden Sandstreifen, großen Sandschleiern vor der Kamera und heulendem Wind. Herumliegende Kisten werden bis etwa 3 Einheiten verweht, aber nur über freien Sand: nie in die Pyramide, ins Wasser, an eine Wand, auf einen Stapelplatz oder vom Feld. Der Wetterknopf „Schneesturm“ heißt in der Wüste „Sandsturm“.
- KI im Sturm: sieht nur noch gut halb so weit, Petrol wartet mit dem Angriff, solange der Sturm stark ist (höchstens 25 Sekunden länger), Angreifer rücken mit kurzen Pausen vor, Patrouillen warten hinter Felsen, Ruinen und der Pyramide.
- Weihnachtsedition: kein Schnee (die Wüste bleibt sandig), Lichterketten an den Kanten der Pyramide, an Obelisken, Säulen und Palmen, Weihnachtsmützen auf Kamelen und Sphinx, Lebkuchen-Hauptquartiere, Geschenkkisten und Schlitten wie überall.

### Karte Mond (Auftrag „Mond“; Grundriss in `js/core.js`, Modelle in `js/urban.js`, Himmel und Meteore in `js/moon.js`)
- Kartenwahl „Mond“ im Spielstart, gemerkt und im Spielstand gespeichert. Technisch wie Flughafen, Stadt und Wüste (Kästen für Felsbrocken und Röhrenwände, Wegfindung mit Raster und A*).
- Aufbau (spiegelgleich, Basis A oben, Basis B unten; die Skizze ist wie bei der Wüste um 90° gedreht): je Basis eine große und eine kleine Kuppel mit Verbindungsröhre hinter dem Hauptquartier. In der Mitte der große Krater (Radius 11, 1,5 tief, erhöhter Rand), auf der Westseite zwei kleinere Krater, auf der Ostseite je zwei Felsbrocken als Deckung. Ganz im Osten der Schlauchgang: eine weiße Röhre mit Rippen und Fensterband, innen 4,4 breit, von einem Eingang neben Basis A am Rand entlang bis zu Basis B. Die Wände halten Sicht und direkte Schüsse auf, die Röhre wird durchscheinend, wenn man drin ist; auch Panzer passen hindurch. Viele kleine Krater und Steine als Deko.
- Aussehen: graue, staubige Oberfläche, schwarzer Himmel mit Sternen (immer sichtbar), keine Wolken, harte weiße Sonne. Die Erde hängt groß am Himmel in Blickrichtung von Basis A (Ozeane, Kontinente, Wolken, blauer Lichtsaum) und dreht sich langsam. Deko: Mondlandefähre, zwei Mondautos, Flagge in Team-Farben am Kraterrand, Satellitenschüssel, Sternschnuppen alle paar Sekunden. Keine Vögel.
- Geringe Schwerkraft (`GRAV` = 0,3): Fallschirmkisten fallen aus größerer Höhe und deutlich langsamer (etwa 15 statt 5 Sekunden), Staubwolken bei Landungen und Explosionen hängen in der Luft und sinken langsam ab, Splitter fliegen weiter. Blechlinge laufen in langen, schwebenden Sprüngen. Alle Waffen reichen 12 % weiter, der Mörser 20 % weiter (43 statt 36) mit flacheren, langsameren Bögen; für beide Teams gleich.
- Kisten: im großen Krater (Goldkisten), in den beiden kleinen Kratern, zwischen Basis und Krater, bei den Felsbrocken. Blaue Kisten landen in den kleinen Kratern im Westen, gelbe bei den Felsbrocken im Osten, die Stellen zwischen Basis und Krater teilen sich beide Farben; jede Farbe liegt so für beide Basen gleich weit (bis #36 landete Blau nur bei Basis A, Gelb nur bei Basis B). Nie im Schlauchgang, nie auf einer Kuppel.
- Keine Pollenpunkte um die Kamera (die hellen Schwebeteilchen der anderen Karten), weil es keine Luft gibt (#38).
- Wetter: keines. „Regen“, „Gewitter“ und „Schneesturm“ sind auf dem Mond abgeschaltet. Bei „Zufall“ kommt alle 2,5 bis 4,5 Minuten (der erste nach gut einer Minute) ein Meteoritenschauer von 12 bis 16 Sekunden: glühende Brocken schlagen mit Blitz und Staubwolke ein und hinterlassen kleine dunkle Krater (nur Optik, kein Schaden, nicht in Basen und Röhre, auf jedem Gerät eigen).
- KI: findet Krater, Felsbrocken und den Schlauchgang über die Wegfindung; eine Patrouille geht durch den Schlauchgang. Mit der geringen Schwerkraft kommt sie zurecht, weil sich nur Optik, Reichweiten und Flugbahnen ändern, nicht das Laufen.
- Weihnachtsedition: Kuppeln als Lebkuchen mit Zuckerguss und bunten Kugeln, Lichterketten auf dem Schlauchgang und um die Kuppeln, Geschenkkisten, Lebkuchen-Hauptquartiere; der Weihnachtsmann fliegt mit Rentieren vor der Erde vorbei. Kein Schnee.

### Karte Dschungel (Auftrag „Zwei neue Karten“, Karte 8; Grundriss in `js/core.js`, Modelle und Stimmung in `js/jungle.js`)
- Kartenwahl „Dschungel“ im Spielstart, gemerkt und im Spielstand gespeichert. Technisch wie Wüste und Mond (Kästen, Wegfindung mit Raster und A*). Aufbau nach der mit Daniela abgestimmten Skizze (`Kistenkrawall-Skizze-Dschungel.png` in Drive): Basis A oben (Norden), Basis B unten, beide 76 m auseinander.
- Tempel: Stufentempel (18 × 18, vier Stufen, 8 hoch) aus vier Blöcken mit einem kreuzförmigen, 6 m breiten Gang (wie die Pyramide), oben ein Schrein über der Kreuzung, Treppen zum Wasser hin, Säulen am Nord- und Südeingang, Moos, Ranken und Blattbüschel. Der Gang von Nord nach Süd verbindet die beiden Stege, der Gang von West nach Ost führt zu den Goldkisten neben dem Tempel (an den Ecken zwischen Tempel und Wasser kommen nur Blechlinge vorbei, keine Panzer). Wird durchscheinend, wenn er zwischen Kamera und eigener Figur steht.
- Fluss: kommt von Westen, teilt sich um die Tempelinsel (Ring mit Radius 20) und fließt nach Osten ab. Das Wasser ist als flache Kästen hinterlegt (Höhe 0): Niemand läuft hinein, aber Sicht und Schüsse gehen darüber; der Mörser ohnehin. Gleiches Wasser wie auf der Insel (Tiefenfarbe, Uferschaum, Wellen), grünlicher. Die Ufer fallen flach zum Wasser ab, an den Brücken bleiben sie auf Höhe des Stegs.
- Übergänge: zwei Steinstege von den Basen auf die Insel (5 m breit), zwei Hängebrücken aus Planken und Seilen an den Seiten (x = −30 und +30). Alle vier tragen auch Panzer. Die KI-Wellen sammeln sich vor den Hängebrücken (`BX` = 30).
- Wald: 150 hohe Bäume (Brettwurzeln, Schirmkrone aus mehreren Blattbüscheln, Lianen) und 70 Palmen sind Hindernisse und Deckung; Büsche, Farne und Riesenblätter füllen den Boden (nur Optik). Blechlinge kommen zwischen den Bäumen durch, Fahrzeuge brauchen die Pfade. Pfade führen von jeder Basis zum Steg, zu beiden Hängebrücken und in die Lichtungen. Außerhalb des Spielfelds geht der Wald weiter, am Horizont dunstige Baumkronen.
- Lichtungen: vier, je mit Ruinenmauer, Steinkopf (Helm, Gesicht, Moos) und umgestürzter Statue.
- Kisten: Blau auf den Lichtungen und an den Brückenköpfen im Westen, Gelb im Osten, jeweils auf beiden Seiten des Flusses (für beide Basen gleich weit), Goldkisten neben dem Tempel auf der Insel. Nie im Wasser, im Tempel oder im dichten Wald.
- Stimmung: grünlich-goldener Dunst, etwas früher einsetzender Nebel, Papageien (rot, blau, gelb, grün) statt Möwen, Schmetterlinge über den Lichtungen (nicht nachts und nicht bei Regen), Lichtstrahlen fallen unter den hohen Kronen bis zum Boden. Wetter wie auf der Insel: Regen und Gewitter.
- Weihnachtsedition: Lichterketten an den Tempelstufen, um den Schrein, an Säulen, Stegen, Hängebrücken und an einem Teil der Bäume, Weihnachtsmützen auf den Steinköpfen, Geschenkkisten, Lebkuchen-Hauptquartiere. Kein Schnee.
- Leistung im Testbrowser: etwa 360 Zeichenvorgänge (Weihnachtsedition etwa 410) und knapp 470.000 Dreiecke pro Bild; Bäume, Palmen und Ruinen werden wie überall zusammengefasst, Büsche, Farne und Blätter sind je ein Zeichenvorgang.

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
- Flughafen und Stadt: Kartenwahl, Kisten nie auf Dächern (600 Abwurfstellen und Wind), Wegfindung für Blechling und Panzer beider Teams zu allen wichtigen Stellen, Runde läuft unter 500 Zeichenvorgängen, Gebäude halten direkte Schüsse auf und der Mörser schießt darüber, Flugzeuge und Tower, Spielstand mit Flughafen, Weihnachtsedition auf beiden Karten
- Wüste und Mond: blaue und gelbe Kisten landen auf beiden Spielhälften, für beide Basen gleich weit
- Sandsturm in der Weihnachtsedition: Lichterketten verschwinden im Dunst, keine Pollen; Mond: keine Pollenpunkte beim Meteoritenschauer
- Blechlinge: glänzenderes Metall, Klarlack, Spiegelung mit dem Boden der Karte (auf dem Mond mit der Erde)
- Gras biegt sich, wo Blechlinge laufen (das Bild ändert sich), auf „Niedrig“ aus
- Tiefe in der Ferne: Luftperspektive im Nebelschritt aktiv, ohne zusätzlichen Bilddurchgang
- Lichtstrahlen: am Tag durch Wolkenlücken und Bäume, auf „Niedrig“ aus, nachts und bei Regen aus, auf dem Mond keine; überstrahlt am Mittag nicht
- Dschungel: Kartenwahl, Kisten landen nie im Wasser, im Tempel oder zwischen den Bäumen (800 Abwurfstellen) und auf beiden Seiten gleich weit, Wegfindung für Blechling und Panzer beider Teams, Fluss sperrt das Laufen, aber nicht Sicht und Schüsse (ein Schuss fliegt über den Fluss), Stege, Hängebrücken und Tempelgänge auch für Panzer, Tempel hält Schüsse auf und der Mörser schießt darüber, Regenwald, Steinköpfe, Schmetterlinge, Regen statt Schnee, Spielstand mit Dschungel, Weihnachtsedition ohne Schnee mit Lichterketten
- Mond: Kartenwahl, Kisten nie im Schlauchgang und nie auf einer Kuppel (800 Abwurfstellen), Wegfindung für Blechling und Panzer beider Teams, Schlauchgang von Basis zu Basis begehbar und vor Beschuss geschützt, Felsbrocken halten Schüsse auf und der Mörser schießt darüber, geringe Schwerkraft (Kiste schwebt über 10 Sekunden, Mörser reicht weiter), kein Wetter, Meteoritenschauer mit Einschlägen, Erde, Sterne, keine Wolken, Spielstand mit Mond, Weihnachtsedition ohne Schnee mit Schlitten vor der Erde
- Wüste: Kartenwahl, Kisten nie in der Pyramide (800 Abwurfstellen, Wind an Fallschirmkisten, Sandsturm auf liegende Kisten von allen vier Seiten), Sandsturm verweht Kisten im Freien, Wegfindung für Blechling und Panzer beider Teams, Tunnel durch die Pyramide in beide Richtungen auch für Panzer, Pyramide hält Schüsse auf und der Mörser schießt darüber, Obelisken, Sphinx, Kamele, Sandsturm mit Vorwarnung, Sandschleier und KI in Deckung, Spielstand mit Wüste, Weihnachtsedition ohne Schnee mit Lichterketten und Mützen
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
| `js/urban.js` | Flughafen, Stadt, Wüste und Mond: Wegfindung (Raster, A*), Gebäude, Flugzeuge, Pyramide mit Tunnel, Ruinen, Oasen, Sphinx, Kamele, Deko, Durchsicht, Lichterketten |
| `js/jungle.js` | Dschungel: Stufentempel, Stege, Hängebrücken, Ruinen, Steinköpfe, Regenwald (Bäume, Palmen, Büsche, Farne), Papageien, Schmetterlinge, Licht, Lichterketten |
| `js/rays.js` | Lichtstrahlen durch Wolkenlücken und Baumkronen |
| `js/moon.js` | Mond: schwarzer Himmel, Erde, Sternschnuppen, Meteoritenschauer, Schlitten vor der Erde (Weihnachtsedition) |
| `js/weather.js` | Wetter: Plan bei „Zufall“, Regenstreifen, Tropfenringe, nasser Glanz, Pfützen, Blitzeinschläge, Schneesturm, Sandsturm (Vorwarnung, Schleier, Heulen, verwehte Kisten), Wind an den Fallschirmkisten |
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
- Flughafen und Stadt: nur im Browser ohne Grafikkarte und in simulierten Runden geprüft, nicht auf dem iPhone und nicht von Menschen gespielt. Die Ausgewogenheit (Wege, Kistenstellen, Wellen) kann Feinschliff brauchen. Die KI denkt bei Wellen und Verteidigung weiter in zwei „Spuren“ (x = −18 und +18); Ziele werden auf freie Felder gelegt. Im Mehrspieler nicht getestet.
- Mehrspieler-Test (#42): Auf dem lokalen Testrechner (4 Kerne, drei Browserseiten mit Grafik ohne Grafikkarte) scheitert der Schritt „andere Spielversion“ in etwa jedem dritten Lauf, auch auf `main`. Der Host empfängt die Begrüßung und sendet die Absage, auf seiner Seite laufen dann aber über 60 s lang keine Zeitgeber, und beim dritten Gerät kommt nichts an. Mit echten Geräten nicht beobachtet; die Ursache im Testaufbau ist noch nicht ganz geklärt.
- Gras (#41): nur im Browser ohne Grafikkarte geprüft. Die Schleife über 24 Drücker läuft für jeden Grashalm-Eckpunkt; auf älteren Handys kostet das etwas, deshalb nur auf „Hoch“. Die Schatten der Büsche neigen sich nicht mit (kaum sichtbar). Gras gibt es auf Insel, Gebirge, Vulkan, Stadt, Flughafen, im Dschungel und an den Oasen der Wüste, nicht auf dem Mond. Farne und Riesenblätter im Dschungel biegen sich nicht.
- Lichtstrahlen (#39): nur im Browser ohne Grafikkarte geprüft. Wie kräftig sie auf dem iPhone wirken, zeigt erst Danielas Blick; Stärke und Breite lassen sich leicht nachstellen. Im Dschungel fallen sie unter den hohen Kronen bis zum Boden (#43).
- Bunte Punkte (#38): Die Ursache ist aus dem Code und Testbildern im Browser hergeleitet (Lichterketten der Weihnachtsedition und Pollenpunkte); ob Daniela auf dem iPhone genau das gesehen hat, zeigt erst ihr Blick. Die farbigen Geschosse der Weihnachtsedition (Christbaumkugeln, Geschenke) bleiben bunt, das ist gewollt.
- Mond: nur im Browser ohne Grafikkarte und in simulierten Situationen geprüft, nicht auf dem iPhone und nicht von Menschen gespielt. Die Erde ist eine Kugel mit 40 × 24 Feldern und eine Leuchtscheibe, die Meteore einfache Kugeln; der Staub nutzt die vorhandenen Rauchwolken, hängt aber länger in der Luft und kann bei vielen Explosionen mehr Teilchen gleichzeitig bedeuten (Obergrenze wie überall 280). Die Erde sieht man vor allem aus der Schulteransicht von Basis A; aus der Taktik-Ansicht von oben kaum. Meteoritenschauer sind auf Host und Gast verschieden (nur Optik). „Springen“ ist eine Hüpf-Bewegung beim Laufen, eine eigene Sprungtaste gibt es im Spiel nicht. Im Mehrspieler nicht getestet.
- Wüste: nur im Browser ohne Grafikkarte und in simulierten Situationen geprüft, nicht auf dem iPhone und nicht von Menschen gespielt. Der Sandsturm zeichnet bis zu 14 große, halb durchsichtige Schleier (auf „Niedrig“ 6); ob das auf dem iPhone flüssig bleibt, zeigt erst die FPS-Anzeige dort. Den Wind konnte ich nicht anhören. Im Tunnel ist man von oben nicht zu sehen; die Pyramide wird durchscheinend, wenn sie zwischen Kamera und eigener Figur steht, gegnerische Blechlinge im Tunnel sieht man aber nicht (gewollt: geschützte Abkürzung). Im Mehrspieler nicht getestet.
- Dschungel: nur im Browser ohne Grafikkarte und in simulierten Situationen geprüft, nicht auf dem iPhone und nicht von Menschen gespielt. Mit knapp 470.000 Dreiecken zeichnet er mehr als die anderen Karten (dichter Wald); ob das iPhone flüssig bleibt, zeigt erst die FPS-Anzeige dort, sonst lassen sich Büsche und Farne verringern. Wie gut die KI die Waldpfade, die Hängebrücken und den Tempelgang nutzt, ist nur in Wegfindungs-Tests geprüft. Der Weihnachtsmarkt (Karte 9) folgt als eigener Pull Request. Im Mehrspieler nicht getestet.
- Wetter: nur im Browser ohne Grafikkarte geprüft (dort 1 bis 2 Bilder pro Sekunde mit und ohne Unwetter, also kein Maß). FPS auf dem iPhone mit und ohne Unwetter stehen noch aus. Pfützen gibt es nicht auf Schnee (Gebirge, Weihnachtsedition).
- Ein eigenes Bauruhe-Stück fürs Gebirge (im Auftrag optional) gibt es noch nicht.
- Bildfehler aus Danielas Screenshots vom 15. November: Die grünlich gesprenkelte Fläche mit gerader Kante war der Morgennebel (eine flache Ebene, die Hänge hart anschnitt und auf dem iPhone flimmerte); er dünnt jetzt über dem Boden aus. Im Testbrowser trat die Kante nicht auf, ob sie auf dem iPhone weg ist, zeigt erst Danielas Test. Der helle Halbkreis am Stapelplatz ist noch ungeklärt.
- Die Musik konnte ich nicht anhören, nur messen: keine Übersteuerung, keine Lücken, gleiche Lautstärke.
- iPhone: iOS kann Daten von Web-Apps löschen, die etwa eine Woche nicht geöffnet wurden. Das betrifft auch den Spielstand.
- Änderungen am ursprünglichen Claude-Artifact „Kistenkrawall“ kommen nicht automatisch ins Repo. Die Hauptversion ist das Repository.
