# Karussell Studio

Ein Browser-Editor zum Gestalten von Instagram-Karussell-Posts (mehrere aufeinanderfolgende Slides für einen Post). Alles läuft lokal im Browser — keine Uploads, kein Server, keine Anmeldung.

## Funktionen

- **Mehrere Slides**: Slides hinzufügen, duplizieren, löschen und per Drag & Drop neu anordnen.
- **Canvas-Editor**: Text, Rechtecke, Kreise und Linien hinzufügen, frei positionieren, skalieren und drehen.
- **Text-Styling**: Schriftart (Google Fonts), Größe, Farbe, Fett/Kursiv/Unterstrichen, Ausrichtung.
- **Formen**: Füllfarbe, Rahmenfarbe und -stärke.
- **Hintergrund**: Volltonfarbe, Farbverlauf oder eigenes Bild — pro Slide oder für alle Slides auf einmal.
- **Bilder**: Eigene Bilder hochladen und frei platzieren.
- **Ebenen**: Nach vorne/hinten, eine Ebene vor/zurück.
- **Seitenformate**: Quadratisch (1:1), Hochformat (4:5) oder Story (9:16) — Export in echter Instagram-Auflösung (1080 px Breite).
- **Seitenzahlen**: Optionale "1/5"-Anzeige, die in Editor, Vorschau und Export erscheint.
- **Vorschau**: Simuliert die Swipe-Ansicht eines echten Instagram-Posts inkl. Punkte-Indikator.
- **Export**: Einzelne Slide als PNG oder alle Slides als ZIP.
- **Projekt sichern/laden**: Projekt als `.json`-Datei exportieren und wieder importieren.
- **Autosave**: Der Fortschritt wird automatisch im Browser (localStorage) gespeichert.

## Entwicklung

```bash
npm install
npm run dev      # Entwicklungsserver
npm run build    # Produktions-Build nach dist/
npm run lint      # oxlint
```

## Deployment (GitHub Pages)

Bei jedem Push auf `main` baut ein GitHub-Actions-Workflow (`.github/workflows/deploy.yml`) die App und veröffentlicht sie automatisch unter:

**https://martinalibra1977-lab.github.io/insta-carousel-tool/**

Diese URL bleibt fest und ist auch vom Handy aus erreichbar — kein Server, kein eigenes Hosting nötig.

Einmalig muss in den Repo-Einstellungen unter **Settings → Pages** als Quelle **„GitHub Actions“** ausgewählt werden, danach läuft alles automatisch bei jedem Merge nach `main`.

## Tech-Stack

- React 19 + TypeScript + Vite
- [fabric.js](http://fabricjs.com/) für den Canvas-Editor
- [zustand](https://github.com/pmndrs/zustand) für den State (mit localStorage-Persistenz)
- [JSZip](https://stuk.github.io/jszip/) + [file-saver](https://github.com/eligrey/FileSaver.js) für den Export
