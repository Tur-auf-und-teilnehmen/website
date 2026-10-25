"use strict";
const assert = require("node:assert/strict");
const { loadEvents } = require("./events.cjs");
const data = loadEvents();
const before = loadEvents({ now: "2026-10-22T12:00:00Z" });
const after = loadEvents({ now: "2026-10-25T12:00:00Z" });

assert.ok(before.featured && before.featured.id === "kickoff-2026",
  "Before kickoff, the upcoming kickoff should be selected automatically");
assert.ok(!after.upcoming.some(e => e.id === "kickoff-2026"),
  "Kickoff must not be upcoming after its end");
assert.ok(after.past.some(e => e.id === "kickoff-2026"),
  "Kickoff must move into archive after its end");
assert.ok(!after.featured || after.featured.isUpcoming,
  "Past events must never be selected as next event");
assert.ok(!data.featured || data.featured.isUpcoming,
  "Live selection must never feature an expired event");
for (const event of data.all) {
  assert.ok(event.html.trim(), event.folder + ": missing Markdown content");
  assert.ok(event.timeRange, event.folder + ": missing hours");
}
console.log("PASS: " + data.all.length + " events, " + data.past.length +
            " archived, " + data.upcoming.length + " upcoming, next " +
            (data.featured ? data.featured.id : "none"));
