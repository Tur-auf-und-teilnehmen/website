"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { loadEvents } = require("./events.cjs");
const dist = path.resolve(__dirname, "../dist");
for (const rel of ["index.html","pulseline-qr.html","favicon.ico",
  "assets/toni-renner-portrait-wide.png","archiv/index.html"]) {
  assert.ok(fs.existsSync(path.join(dist,rel)), "Missing output: " + rel);
}
const home = fs.readFileSync(path.join(dist,"index.html"),"utf8");
// Both desktop navigation and mobile-accessible hero link must lead to the archive.
assert.ok((home.match(/href="archiv\/"/g) || []).length >= 2,
  "Homepage must link the archive in navigation and hero");
const archive = fs.readFileSync(path.join(dist,"archiv/index.html"),"utf8");
assert.ok(archive.includes("kickoff"), "Archive must list the past kickoff");
const eventTitle = fs.readFileSync(path.join(dist,"events/2026-10-23_kickoff/index.html"),"utf8");
for (const generated of [archive, eventTitle]) {
  assert.ok(generated.includes(".archive-breadcrumb { display:flex"),
    "Archive breadcrumb must start a separate block row");
  assert.ok(generated.includes(".archive-intro .eyebrow { display:flex"),
    "Section eyebrow must render on its own row");
  assert.ok(generated.includes("text-wrap: balance;") &&
            generated.includes("overflow-wrap: anywhere;"),
    "Archive heading must wrap instead of overflowing");
}
assert.ok(archive.indexOf("← Zur Startseite") < archive.indexOf("Unsere Veranstaltungen"),
  "Breadcrumb must precede section label");
for (const value of ["Tür auf.","Teilnehmen.","Event-Archiv ansehen"]) {
  assert.ok(home.includes(value), "Missing homepage content: " + value);
}
const events = loadEvents();
if (events.featured) {
  assert.ok(home.includes("Nächster Termin"), "Upcoming event navigation missing");
  assert.ok(home.includes(events.featured.displayDate), "Next event date not rendered");
  assert.ok(home.includes(events.featured.locationFull), "Next event location missing");
  assert.ok(home.includes('id="event-details-dialog"'), "Next event detail dialog missing");
  assert.ok(!home.includes("Das nächste Event ist in Planung."), "Unexpected no-events fallback");
} else {
  assert.ok(home.includes("Das nächste Event ist in Planung."), "No-events fallback missing");
  assert.ok(!home.includes('id="event-details-dialog"'), "Past event dialog still present");
  assert.ok(!home.includes(">Jetzt anmelden</a>"), "No future event must not show signup");
  assert.ok(!home.includes(">Auf Meetup anmelden</a>"), "Old kickoff signup must not appear");
  assert.ok(!home.includes("events/2026-10-23_kickoff/anreise.mp4"), "Old arrival promo must be hidden");
  assert.ok(!home.includes("events/2026-10-23_kickoff/kickoff.mp4"), "Old video promo must be hidden");
  if (events.latestPast) {
    assert.ok(home.includes(events.latestPast.displayDate), "Latest archived date missing");
    assert.ok(home.includes("events/" + events.latestPast.folder + "/"),
      "Latest event recap link missing");
  }
}
for (const event of loadEvents().all) {
  for (const rel of ["events/" + event.folder + "/index.html",
    "events/" + event.folder + "/event.ics",...Object.values(event.assetUrls)]) {
    assert.ok(fs.existsSync(path.join(dist,rel)), "Missing output: " + rel);
  }
  const detail = fs.readFileSync(path.join(dist,"events/" + event.folder + "/index.html"),"utf8");
  for (const media of event.archiveMedia) {
    assert.ok(detail.includes("../../" + media.url), "Detail missing media: " + media.url);
    assert.ok(detail.includes(media.title), "Detail missing media title: " + media.title);
  }
  for (const link of event.archiveLinks) {
    assert.ok(detail.includes(link.url.replace(/&/g,"&amp;")) || detail.includes(link.url),
      "Detail missing archive link: " + link.url);
  }
  if (event.isPast && event.archiveMedia.length) {
    assert.ok(detail.includes("Schon mal bis zur Tür."), "Missing arrival-video feature");
    assert.ok(detail.includes("So haben wir den Abend angekündigt."), "Missing historical gallery");
    assert.ok(!detail.includes(">Jetzt anmelden</a>"), "Past event must not show signup CTA");
  }
  if (event.assetUrls.teaserImage && event.isPast) {
    assert.ok(archive.includes("../" + event.assetUrls.teaserImage),
      "Archive listing missing teaser image");
  }
  if (event.legacyIcsPath) {
    const canonical = fs.readFileSync(path.join(dist, "events/" + event.folder + "/event.ics"));
    const legacy = fs.readFileSync(path.join(dist,event.legacyIcsPath));
    assert.deepEqual(legacy,canonical,"Legacy calendar must match generated event calendar");
  }
  for (const rel of ["events/" + event.folder + "/event.json",
    "events/" + event.folder + "/content.md"]) {
    assert.ok(!fs.existsSync(path.join(dist,rel)), "Source content exposed: " + rel);
  }
}
console.log("PASS: generated pages, assets and calendar files");
