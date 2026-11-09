# Hinweise für Claude

## Projektstand in Google Drive pflegen

Nach jeder Änderung, die auf `main` landet (also nach jedem Merge), den Projektstand aktualisieren, ohne dass Daniela extra darum bitten muss:

1. `docs/PROJEKTSTAND.md` fortschreiben: Stand-Datum und Live-Version (kurzer Commit von `main` nach dem Merge), neue Zeile in der Tabelle „Verlauf“, betroffene Abschnitte unter „Was umgesetzt ist“, „Automatischer Test“, „Projektstruktur“ und „Grenzen und offene Punkte“. Die eigene Zeile im Verlauf gleich mit Status „gemergt“ eintragen, weil sie ja erst mit dem Merge auf `main` landet.
2. Diese Änderung im selben Pull Request wie die eigentliche Änderung mitliefern.
3. Nach dem Merge die Datei in Google Drive erneuern. Der Google-Drive-Connector kann den Inhalt einer bestehenden Datei nicht ersetzen, deshalb:
   - Im Ordner „Danielas Spieleprojekte“ (ID `1P9aHmrMzXODKiTbNUoLDEWKd77wW3cbB`) die vorhandene `Kistenkrawall-Projektstand.md` suchen (`parentId = '1P9aHmrMzXODKiTbNUoLDEWKd77wW3cbB' and title = 'Kistenkrawall-Projektstand.md' and trashed = false`) und ihre ID merken.
   - Den Inhalt von `docs/PROJEKTSTAND.md` als neue Datei `Kistenkrawall-Projektstand.md` in diesen Ordner hochladen (`text/markdown`, Umwandlung in ein Google Doc ausschalten).
   - Erst wenn das geklappt hat, die alte Datei in den Papierkorb legen. Im Ordner liegt danach genau eine Projektstand-Datei.
   - Kurze Live-Version und Datum in Drive müssen zu `main` passen. Ergibt sich die Live-Version erst durch den Merge, sie in der Drive-Fassung eintragen und im nächsten Pull Request auch in `docs/PROJEKTSTAND.md` nachziehen.
4. In der Antwort an Daniela kurz sagen, dass der Projektstand in Drive aktualisiert wurde, oder warum nicht (zum Beispiel, wenn der Drive-Connector in der Sitzung fehlt).

Kein Artifact für den Projektstand anlegen; Daniela möchte ihn nur in Google Drive.

## Arbeitsweise in diesem Repo

- Änderungen als Pull Request; Daniela entscheidet, ob gemergt wird. Gemergt wird erst, wenn der Browser-Test auf GitHub grün ist.
- Vor dem Pushen `node tests/smoke.cjs` laufen lassen (siehe README). Der Mehrspieler-Test läuft nur lokal, GitHub überspringt ihn; deshalb lokal immer mit Mehrspieler-Test (Paket `peer`) prüfen.
- Kommunikation mit Daniela auf Deutsch.
