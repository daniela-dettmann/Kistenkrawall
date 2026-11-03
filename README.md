# Kistenkrawall

3D-Kistenschlacht im Browser: Deine Blechbande Orange gegen die Blechbande Petrol. Kisten sammeln, stapeln, auspacken – und das gegnerische Hauptquartier sprengen.

**Spielen:** https://daniela-dettmann.github.io/Kistenkrawall/

Das ganze Spiel steckt in einer einzigen Datei (`index.html`, Three.js r128 vom CDN). Bereitgestellt wird es per GitHub Actions über GitHub Pages (`.github/workflows/pages.yml`), sobald Änderungen auf `main` landen.

## Als App installieren

Kistenkrawall ist eine Progressive Web App: Auf dem Handy im Browser-Menü „Zum Startbildschirm hinzufügen“ (iOS: Teilen → „Zum Home-Bildschirm“) wählen, am Rechner in Chrome/Edge auf das Installieren-Symbol in der Adressleiste klicken. Nach dem ersten Start läuft das Spiel auch offline.

Das Icon liegt als Vektorgrafik in `icons/icon.svg`. Wenn sich `index.html` oder die Icons ändern, in `sw.js` die `VERSION` hochzählen, damit installierte Apps das Update bekommen.
