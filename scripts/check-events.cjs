"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { loadEvents } = require("./events.cjs");

const data = loadEvents();
const before = loadEvents({ now: "2026-10-22T12:00:00Z" });
const after = loadEvents({ now: "2026-10-25T12:00:00Z" });
assert.equal(before.featured?.id, "kickoff-2026",
  "Before kickoff, the upcoming event should be selected automatically");
assert.ok(!after.upcoming.some(e => e.id === "kickoff-2026"),
  "Kickoff must not be upcoming after its end");
assert.ok(after.past.some(e => e.id === "kickoff-2026"),
  "Kickoff must move into archive after its end");
assert.ok(!after.featured || after.featured.isUpcoming,
  "An expired event must never be featured");
assert.ok(!data.featured || data.featured.isUpcoming,
  "Live selection must not feature an expired event");
for (const event of data.all) {
  assert.ok(event.html.trim(), event.folder + ": missing Markdown content");
  assert.ok(event.timeRange, event.folder + ": missing hours");
}

// Temporary fixtures verify multiple upcoming events, the explicit marker,
// selection fallback, running-event handling and the fully empty state.
const dir = fs.mkdtempSync(path.join(os.tmpdir(), "website-events-"));
function fakeEvent(folder, id, start, end, featured) {
  const folderPath = path.join(dir, folder);
  fs.mkdirSync(folderPath, { recursive: true });
  const data = {
    id, title: "Testevent " + id, start, end,
    timezone: "Europe/Berlin", venue: "Testort", address: "Teststraße 1",
    status: "published", featured, assets: {}
  };
  fs.writeFileSync(path.join(folderPath, "event.json"), JSON.stringify(data));
  fs.writeFileSync(path.join(folderPath, "content.md"), "Testbeschreibung");
  return { folderPath, data };
}
try {
  const first = fakeEvent("2026-11-10_first", "first",
    "2026-11-10T18:00:00+01:00", "2026-11-10T20:00:00+01:00", false);
  const second = fakeEvent("2026-11-12_second", "second",
    "2026-11-12T18:00:00+01:00", "2026-11-12T20:00:00+01:00", true);

  const selected = loadEvents({ now: "2026-11-01T12:00:00Z", eventsDir: dir });
  assert.equal(selected.featured.id, "second",
    "Featured marker must override chronological fallback");
  assert.equal(selected.upcoming.length, 2);

  first.data.featured = true;
  fs.writeFileSync(path.join(first.folderPath,"event.json"),JSON.stringify(first.data));
  assert.throws(() => loadEvents({ now: "2026-11-01T12:00:00Z", eventsDir: dir }),
    /Only one upcoming/,"Two explicitly featured events must fail");

  first.data.featured = false;
  second.data.featured = false;
  fs.writeFileSync(path.join(first.folderPath,"event.json"),JSON.stringify(first.data));
  fs.writeFileSync(path.join(second.folderPath,"event.json"),JSON.stringify(second.data));
  assert.equal(loadEvents({ now: "2026-11-01T12:00:00Z", eventsDir: dir }).featured.id,
    "first","Without marker the earliest event must be selected");
  assert.equal(loadEvents({ now: "2026-11-10T18:30:00Z", eventsDir: dir }).featured.id,
    "first","An ongoing event must remain featured until it ends");
  const done = loadEvents({ now: "2026-11-13T12:00:00Z", eventsDir: dir });
  assert.equal(done.featured, null,"No future events means no featured event");
  assert.equal(done.past.length, 2,"Both completed events must be archived");
} finally {
  fs.rmSync(dir,{recursive:true,force:true});
}

console.log("PASS: " + data.all.length + " event(s), " + data.past.length +
  " archived, " + data.upcoming.length + " upcoming, next " +
  (data.featured ? data.featured.id : "none"));
