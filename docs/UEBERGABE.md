# Kistenkrawall – Übergabe

Stand: 13. November 2026. Diese Datei sagt, wo das Projekt gerade steht und was als Nächstes zu tun ist. Den vollständigen Überblick gibt `docs/PROJEKTSTAND.md`.

## Wo wir stehen

| | Stand |
| --- | --- |
| Live auf GitHub Pages | `f2d1ca6` (PR #19, Vulkan-Karte) |
| `main` | `f2d1ca6` |
| Offener Pull Request | #20: Vulkan nachgebessert (Daniela fand auf dem Handy orange Flecken im Boden, ein hellblaues Meer in der Weihnachtsedition und Lava, die über die Küste hinausragte) |

Der Mehrspieler-Test läuft nur noch lokal. Auf GitHub läuft nur der schnelle Test (`CI=true`; `KK_MP_TEST=1` erzwingt den Mehrspieler-Teil).

## Was noch zu tun ist

1. **PR #20 (Vulkan nachgebessert):** Browser-Test auf GitHub muss grün sein, dann entscheidet Daniela über den Merge. Danach den Deploy auf `main` prüfen und den Projektstand in Google Drive erneuern.
2. **Tag, Nacht und Wetter** (beauftragt, kommt als eigener Pull Request nach dem Vulkan): Ein Tag dauert etwa 8 Minuten mit Morgen, Mittag, Abendrot und Nacht. Nachts Scheinwerfer an Blechlingen und Fahrzeugen, leuchtende Kisten, Hauptquartiere und Lava. Wetter je Karte: Insel Regen und Gewitter, Gebirge Schneesturm und Nebel, Vulkan Ascheregen. Nur Optik und Ton, keine Spielwirkung. Im Mehrspieler gibt der Host Uhrzeit und Wetter vor. Schalter im Menü zum Ausschalten.
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
- Nur mergen, wenn der Browser-Test grün ist und Daniela zugestimmt hat.
- Nach dem Merge immer den Deploy-Lauf auf `main` prüfen, bevor man sagt, dass etwas live ist.
- Mit Daniela auf Deutsch sprechen.
