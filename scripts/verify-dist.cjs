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
for (const value of ["Tür auf.","Teilnehmen.","event-details-dialog",
  "23.10.2026","Konnektiv62","events/2026-10-23_kickoff/event.ics"]) {
  assert.ok(home.includes(value), "Missing homepage content: " + value);
}
for (const event of loadEvents().all) {
  for (const rel of ["events/" + event.folder + "/index.html",
    "events/" + event.folder + "/event.ics",...Object.values(event.assetUrls)]) {
    assert.ok(fs.existsSync(path.join(dist,rel)), "Missing output: " + rel);
  }
  for (const rel of ["events/" + event.folder + "/event.json",
    "events/" + event.folder + "/content.md"]) {
    assert.ok(!fs.existsSync(path.join(dist,rel)), "Source content exposed: " + rel);
  }
}
console.log("PASS: generated pages, assets and calendar files");
