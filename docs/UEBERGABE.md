# Kistenkrawall – Übergabe

Stand: 14. November 2026. Diese Datei sagt, wo das Projekt gerade steht und was als Nächstes zu tun ist. Den vollständigen Überblick gibt `docs/PROJEKTSTAND.md`.

## Wo wir stehen

| | Stand |
| --- | --- |
| Live auf GitHub Pages | `b6c2436` (PR #21, Grafik-Paket) |
| `main` | `b6c2436` |
| Offener Pull Request | #22: Tag, Nacht und Wetter |

Der Mehrspieler-Test läuft nur noch lokal. Auf GitHub läuft nur der schnelle Test (`CI=true`; `KK_MP_TEST=1` erzwingt den Mehrspieler-Teil).

## Was noch zu tun ist

1. **PR #22 (Tag, Nacht und Wetter):** Browser-Test auf GitHub muss grün sein, dann entscheidet Daniela über den Merge. Danach den Deploy auf `main` prüfen und den Projektstand in Google Drive erneuern.
2. **Rückmeldung vom Handy abwarten (iPhone 15 Pro Max):** FPS-Anzeige im Menü einschalten und die Werte nennen lassen (FPS, Zeichenvorgänge), normal und in der Weihnachtsedition, „Schön“ und „Schnell“. Ziel 60 FPS. Weitere Stellschrauben, falls nötig: Schatten nur jedes zweite Bild, Einheiten zusammenfassen, Kugeln der Weihnachtsdeko gröber, Auflösung.
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
- Nur mergen, wenn der Browser-Test grün ist und Daniela zugestimmt hat.
- Nach dem Merge immer den Deploy-Lauf auf `main` prüfen, bevor man sagt, dass etwas live ist.
- Mit Daniela auf Deutsch sprechen.
