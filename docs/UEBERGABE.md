# Kistenkrawall – Übergabe

Stand: 16. November 2026. Diese Datei sagt, wo das Projekt gerade steht und was als Nächstes zu tun ist. Den vollständigen Überblick gibt `docs/PROJEKTSTAND.md`.

## Wo wir stehen

| | Stand |
| --- | --- |
| Live auf GitHub Pages | `f737e1a` (PR #33) |
| `main` | `f737e1a` |
| Offener Pull Request | #34: Karten Flughafen und Stadt (Drive: `Kistenkrawall-Auftrag-Flughafen-Stadt.md`). Offen bei Daniela: „Require status checks“ für `main`; FPS auf dem iPhone |

Der Mehrspieler-Test läuft nur noch lokal. Auf GitHub läuft nur der schnelle Test (`CI=true`; `KK_MP_TEST=1` erzwingt den Mehrspieler-Teil).

## Was noch zu tun ist

1. **Auftrag „Grafik-Upgrade Wasser, Schnee und Plastizität“** (Drive: `Kistenkrawall-Auftrag-Grafik-Wasser-Schnee.md`), je Schritt ein Pull Request: #25 Wasser (gemergt), #26 Schnee (gemergt), #27 Kontaktschatten und Randlicht (gemergt, live erst mit #28). Danielas Rückmeldung vom 15. November: Fußspuren fehlten, Schnee zu gleichmäßig, Bildfehler: grüne gesprenkelte Fläche = Morgennebel (verschwindet beim Weiterlaufen und kurz danach), in #28 mit weichen Rändern; heller Halbkreis am Stapelplatz noch ungeklärt. iPhone-Messung danach: 59 FPS bei 76 Aufrufen, 26 FPS bei 567 Aufrufen (Schulter, viel im Bild). FPS vorher/nachher nur auf dem iPhone messbar, Daniela schickt Werte.
2. **Erste Messung vom iPhone 15 Pro Max (vor #23):** 33 FPS, längstes Bild 34 ms, 815 Zeichenvorgänge, 685.000 Dreiecke, „Schön“, Weihnachtsedition, Nacht, 18 Blechlinge. Dazu Flimmern an Kanten und am Ufer, einige Stellen überhellt. Nach #23 neu messen lassen. Zweiter Test nach #23: „Schön“ krisselte weiter und überstrahlte; im Testbrowser war es umgekehrt, der Test bildet das iPhone also nicht ab. Deshalb #24 ohne Nachbearbeitung. Nach #24 erbeten: zwei Screenshots derselben Stelle in „Schnell“ und „Schön“ plus FPS-Zeile. Wenn 60 FPS nicht erreicht werden: Materialien der Blechlinge vereinheitlichen (jeder hat 5 bis 10), einfachere Schattenfilter, geringere Auflösung.
3. **Frühere Notiz:** FPS-Anzeige im Menü einschalten und die Werte nennen lassen (FPS, Zeichenvorgänge), normal und in der Weihnachtsedition, „Schön“ und „Schnell“. Ziel 60 FPS. Weitere Stellschrauben, falls nötig: Schatten nur jedes zweite Bild, Einheiten zusammenfassen, Kugeln der Weihnachtsdeko gröber, Auflösung.
3. **Bereits bekannt:** Daniela prüft Grafik-Paket sowie Tag, Nacht und Wetter auf dem iPhone (flüssig? Schein und Farben zu stark? Nacht gut lesbar?). Aus dem Grafik-Paket noch offen: feinere Bodenübergänge, mehr Leben in der Welt (Wind, Tiere), Fußspuren.
3. **Hosting zieht später zu AWS um.** Nur die Veröffentlichung, der Code bleibt auf GitHub. Der GitLab-Umzug ist vom Tisch (Entscheidung vom 9. November 2026). Einzelheiten zu AWS sind noch nicht besprochen. Zu beachten: Bei einer neuen Adresse muss die App neu installiert werden, Spielstand und Einstellungen fangen neu an.
4. **Sicherung.** Eine ZIP-Datei und ein Git-Bundle vom Stand `0112df1` liegen in Google Drive.

## Offene Punkte ohne Auftrag

Aus `docs/PROJEKTSTAND.md`, „Grenzen und offene Punkte“:

- Kein TURN-Server: Mehrspieler übers Mobilfunknetz kann scheitern. Zwei echte Geräte in verschiedenen Netzen sind nicht getestet. Eintragen in `js/net.js` unter `NET_CFG.turn`.
- Nichts auf echten Handys getestet, nur in Chromium ohne Grafikkarte (Leistung von Weihnachtsedition und Gebirge auf älteren Geräten offen).
- Kein eigenes Bauruhe-Musikstück fürs Gebirge.
- Die Weihnachtsedition läuft gerade (1. November bis 10. Januar).

## Hinweise für die nächste Sitzung

- Vor jedem Push `node tests/smoke.cjs`, mit Mehrspieler-Test (läuft nur lokal, braucht das Paket `peer` aus `npm install`). Besonders wichtig bei Änderungen an `js/net.js`, weil GitHub diesen Teil nicht mehr prüft.
- Nur mergen, wenn der Browser-Test grün ist und Daniela zugestimmt hat. Seit #32 wird nach dem Merge nicht mehr getestet: alle vier Testteile im Pull Request müssen grün sein.
- Nach dem Merge immer den Deploy-Lauf auf `main` prüfen, bevor man sagt, dass etwas live ist.
- Mit Daniela auf Deutsch sprechen.
