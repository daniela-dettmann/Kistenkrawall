# Hinweise für Claude

## Projektstand in Google Drive pflegen

Nach jeder Änderung, die auf `main` landet (also nach jedem Merge), den Projektstand aktualisieren, ohne dass Daniela extra darum bitten muss:

1. `docs/PROJEKTSTAND.md` fortschreiben: Stand-Datum und Live-Version (kurzer Commit von `main`), neue Zeile in der Tabelle „Verlauf“, betroffene Abschnitte unter „Was umgesetzt ist“, „Automatischer Test“, „Projektstruktur“ und „Grenzen und offene Punkte“.
2. Diese Änderung im selben Pull Request wie die eigentliche Änderung mitliefern.
3. Nach dem Merge den Inhalt von `docs/PROJEKTSTAND.md` unverändert in die Google-Drive-Datei übertragen (Google-Drive-Connector, Inhalt der bestehenden Datei ersetzen, keine neue Datei anlegen):
   - Datei: `Kistenkrawall-Projektstand.md`, ID `1iK73ByI-wWM7UrpLpRmUMM22mguwtaZA`, als `text/markdown` ohne Umwandlung in ein Google Doc
   - Ordner: „Danielas Spieleprojekte“, ID `1P9aHmrMzXODKiTbNUoLDEWKd77wW3cbB`
4. In der Antwort an Daniela kurz sagen, dass der Projektstand in Drive aktualisiert wurde, oder warum nicht (zum Beispiel, wenn der Drive-Connector in der Sitzung fehlt).

Kein Artifact für den Projektstand anlegen; Daniela möchte ihn nur in Google Drive.

## Arbeitsweise in diesem Repo

- Änderungen als Pull Request; Daniela entscheidet, ob gemergt wird. Gemergt wird erst, wenn der Browser-Test auf GitHub grün ist.
- Vor dem Pushen `node tests/smoke.cjs` laufen lassen (siehe README).
- Kommunikation mit Daniela auf Deutsch.
