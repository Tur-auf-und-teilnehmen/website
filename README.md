# Tür auf und teilnehmen – Website

## Draft: Markdown + Events + Eleventy

Der **produktive** Stand bleibt auf `main`. Auf
[`feature/2-website-refresh`](https://github.com/Tur-auf-und-teilnehmen/website/tree/feature/2-website-refresh)
liegt die erste Vorschau mit dem bisherigen Startseiten-Design.
Die neue Generierung ersetzt das vorhandene Live-Deployment **noch nicht**.

### Lokal starten (Node.js 20 oder neuer)

```bash
git clone https://github.com/Tur-auf-und-teilnehmen/website.git
cd website
git switch feature/2-website-refresh
npm install
npm run build
npm run dev
```

Danach im Browser **http://localhost:8080/** öffnen.
Alternativ: `npx @11ty/eleventy --serve`.

Weitere generierte Seiten:
- `http://localhost:8080/archiv/` – Archiv (Kickoff von Oktober 2026)
- `http://localhost:8080/events/2026-10-23_kickoff/` – Eventdetail

`npm run build` erzeugt HTML, Medien und automatisch die `.ics`-Dateien
in `dist/`. `npm run dev` beobachtet Änderungen an Vorlagen und Events.

### Struktur

- `site/index.njk` – bisheriges Design **weitgehend 1:1** als Nunjucks-Template.
- `events/YYYY-MM-DD_slug/event.json` – Titel, Zeiten, Ort, Links, Medien.
- `events/YYYY-MM-DD_slug/content.md` – ausführliche Eventbeschreibung.
- `events/YYYY-MM-DD_slug/*` – Medien des Events.
- `site/event.njk`, `site/archiv.njk` – generierte Zusatzseiten.
- `scripts/events.cjs` – laden, validieren, vergangene/kommende Events erkennen.
- `scripts/ics.cjs` – pro Event Kalenderdatei generieren.

**Hinweis zur Vorschau:** Der abgelaufene Kickoff bleibt absichtlich auf der
Startseite hervorgehoben, damit man das ursprüngliche Layout vergleichen kann.
Er erscheint zusätzlich bereits im generierten Archiv. Die endgültige
Startseitenlogik „nächster Termin oder Leermeldung“ folgt nach dem Designreview.
Alte Medien-URLs bleiben erhalten; die alte ICS-URL wird beim Build aus derselben JSON erneut erzeugt.

`npm run check` validiert Eventdaten. `npm run build` prüft anschließend
auch die generierten Seiten und Medien. Das Build-Workflow-Artefakt kann über
GitHub Actions heruntergeladen werden, ohne auf `main` zu deployen.

**Noch kein produktives Deployment aus diesem Feature-Branch.**
