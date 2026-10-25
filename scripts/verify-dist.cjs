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
assert.equal((home.match(/href="archiv\/"/g) || []).length, 2,
  "Homepage must link the archive in navigation and hero");
const archive = fs.readFileSync(path.join(dist,"archiv/index.html"),"utf8");
assert.ok(archive.includes("kickoff"), "Archive must list the past kickoff");
for (const value of ["Tür auf.","Teilnehmen.","event-details-dialog",
  "23.10.2026","Konnektiv62","events/2026-10-23_kickoff/event.ics"]) {
  assert.ok(home.includes(value), "Missing homepage content: " + value);
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
