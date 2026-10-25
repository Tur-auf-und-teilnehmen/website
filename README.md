# Tür auf und teilnehmen – Website

## Markdown + Events + Eleventy

Der Quellcode liegt auf `main`. Die statische Website wird per Eleventy aus
Nunjucks, Markdown und `event.json` nach `dist/` gebaut. Das
Deployment läuft über `.github/workflows/pages-publish.yml` auf Push und
stündlich (UTC-Minute 17); GitHub Pages muss dafür unter **Settings → Pages →
Build and deployment → Source → GitHub Actions** stehen. Bis zur Umstellung
wird weiterhin die bisherige `index.html` aus dem Repository veröffentlicht.

### Lokal starten (Node.js 20 oder neuer)

```bash
git clone https://github.com/Tur-auf-und-teilnehmen/website.git
cd website
git switch main
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

**Vorschau-Logik (aktuell):** Da der Kickoff am 23.10.2026 bereits vorbei ist
und noch kein weiterer veröffentlichter Termin erfasst wurde, zeigt die
Startseite **„Das nächste Event ist in Planung.“** mit Archiv- und Rückblick-Links.
Vergangene Werbevideos und Anmeldelinks verschwinden von der Startseite;
sie bleiben im Archiv erhalten. Die alte ICS-URL wird beim Build aus derselben
JSON generiert.

`npm run check` validiert Eventdaten. `npm run build` prüft anschließend
auch die generierten Seiten und Medien. Das Build-Workflow-Artefakt kann über
GitHub Actions heruntergeladen werden, als CI-Vorschau bereithalten.

**Die neue Live-Veröffentlichung setzt die GitHub-Pages-Quelle „GitHub Actions“ voraus.**


### Event-Rückblick und Medienarchiv

Das Archiv unter `/archiv/` zeigt vergangene Events mit Bildkarte.
Eine Eventdetailseite übernimmt die normale Kopfzeile und das Dark-Theme.
Für den Kickoff sind **alle vier vorhandenen Eventmedien** integriert:

- `anreise.mp4` im Block „Schon mal bis zur Tür“ wie auf der Startseite.
- `kickoff.mp4` und `announcement.mp4` in der Mediengalerie.
- `teaser.png` als Archiv-Kachel und in der Galerie.
- Externe Links: ursprüngliche Meetup-Seite sowie die allgemeinen Community-Profile auf Instagram und TikTok (keine Behauptung, dass diese Profilseiten einzelne Eventbeiträge enthalten).

Die Medien und Links werden in `event.json` über `archiveMedia` bzw. `archiveLinks` gepflegt.
`content.md` dokumentiert das **vorab angekündigte Programm**, keinen nachträglich
behaupteten tatsächlichen Ablauf. Für einen authentischen Nachbericht kann optional
`recap.md` im selben Eventordner angelegt werden. Fotos vom Abend sind noch
nicht im Repository vorhanden und werden deshalb nicht erfunden.

Die Styles der Startseite sind jetzt in der gemeinsamen Nunjucks-Datei
`site/_includes/site-styles.njk` abgelegt. Zusätzliche Archiv-Styles
liegen in `site/_includes/archive-styles.njk`.


### Nächsten Termin bestimmen

Jeder Eventordner `events/YYYY-MM-DD_slug/` enthält eine `event.json`.
Für die **Startseite** werden nur veröffentlichte Events berücksichtigt,
deren `end` noch nicht überschritten ist. Events bleiben während des
laufenden Abends sichtbar und wandern nach der Endzeit automatisch ins Archiv.

- `"status": "published"`: öffentlich sichtbar (`draft` nicht sichtbar).
- `"featured": true`: **dieses noch laufende/künftige Event** als
  nächsten Termin auf der Startseite hervorheben.
- Nur **ein** zukünftiges veröffentlichtes Event darf `featured: true` haben;
  mehrere Markierungen sind ein Validierungsfehler.
- Ist kein Event markiert, wird der **chronologisch früheste** kommende
  Termin automatisch verwendet.
- Wenn kein Event mehr ansteht, wird die Seite mit „Das nächste Event ist in
  Planung.“ und einem Link auf Archiv und letzten Rückblick erzeugt.
- Das Feld `featured` einer alten Veranstaltung wird automatisch ignoriert;
  der Kickoff hat jetzt `"featured": false`.

Ein zukünftiges Event mit einem lokalen Startdatum entsprechend dem
Verzeichnisnamen genügt; `registrationUrl` darf bis zur Anmeldung fehlen.
Datum/Uhrzeit sind ISO 8601 inklusive Zeitzonenoffset; `timezone` lautet
`Europe/Berlin`.

**Automatische Aktualisierung:** Die vorbereitete
`.github/workflows/pages-publish.yml` führt nach Übernahme in `main`
bei jedem Push und zusätzlich stündlich (UTC Minute 17) `npm run build`
aus, prüft die Ausgabe und kann sie über GitHub Pages veröffentlichen.
GitHub Actions `schedule` läuft ausschließlich auf dem Default-Branch. Vor dem Wechsel muss in
**Settings → Pages → Build and deployment → Source → GitHub Actions**
als Veröffentlichungsquelle eingestellt werden. Bis zur Umstellung liefert die bestehende Branch-Veröffentlichung weiterhin
nur die ursprüngliche statische Startseite. GitHub-Zeitpläne können sich verzögern und sind nicht
minutengenau garantiert; für sekundengenaue Umschaltungen wäre später eine
zusätzliche Client-Lösung erforderlich.
