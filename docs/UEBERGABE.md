# Kistenkrawall – Übergabe

Stand: 9. November 2026. Diese Datei sagt, wo das Projekt gerade steht und was als Nächstes zu tun ist. Den vollständigen Überblick gibt `docs/PROJEKTSTAND.md`.

## Wo wir stehen

| | Stand |
| --- | --- |
| Live auf GitHub Pages | `2313272` (PR #16, Mehrspieler) |
| `main` | `8f9a123` (PR #17 gemergt: Zoom-Sperre und Durchblick-Loch im Gebirge) |
| Offener Pull Request | #18: Gast erkennt sofort, wenn der Host gegangen ist |

PR #17 ist zwar gemergt, aber nicht live: Beim Veröffentlichen ist der Test „Host verlässt das Spiel: endet auch für den Gast“ gescheitert. Er wackelte, weil der Gast nur über eine Verzögerung vom Abschied des Hosts erfuhr. PR #18 behebt das: Meldet der Vermittlungsserver während einer Runde, dass der Host nicht mehr da ist (`peer-unavailable`), beendet der Gast das Spiel sofort mit „Dein Gegner hat das Spiel verlassen.“ (`js/net.js`, `joinRoom`).

Der letzte Testlauf von #18 wurde abgebrochen, als der GitHub-Zugang weg war. Er läuft mit dem nächsten Push neu.

Neu in #18: Der Mehrspieler-Test läuft nur noch lokal. Auf GitHub läuft nur der schnelle Test (Dateien, Spiel, App, Spielstand, Musik, Weihnachten, Gebirge, Tonstudio, Update-Hinweis). GitHub setzt `CI=true`, daran erkennt `tests/smoke.cjs` das; `KK_MP_TEST=1` erzwingt den Mehrspieler-Test trotzdem.

## Was noch zu tun ist

1. **PR #18 fertig machen.** Browser-Test auf GitHub muss grün sein, dann entscheidet Daniela über den Merge. Danach gehen #17 und #18 zusammen live. Prüfen, dass der Deploy auf `main` wirklich durchgelaufen ist, nicht nur der PR-Test.
2. **Projektstand nachziehen** (nach dem Merge, siehe `CLAUDE.md`): Live-Version in `docs/PROJEKTSTAND.md` und in Google Drive eintragen. Die Drive-Fassung nennt im Moment fälschlich `8f9a123` als live; das wird dabei richtiggestellt.
3. **Umzug nach GitLab: entschieden, wir bleiben auf GitHub.** Daniela hatte den Umzug überlegt, als GitHub nicht erreichbar war. Am 9. November 2026 hat sie entschieden: erst einmal bleibt alles auf GitHub (Repository und GitHub Pages).
4. **Sicherung.** Eine ZIP-Datei und ein Git-Bundle vom Stand `0112df1` hat Daniela direkt bekommen. Hochladen nach Google Drive macht sie selbst.

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
