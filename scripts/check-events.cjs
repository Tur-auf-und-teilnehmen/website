"use strict";
const assert = require("node:assert/strict");
const { loadEvents } = require("./events.cjs");
const data = loadEvents();
assert.ok(data.all.length, "No events");
assert.ok(data.featured, "Missing featured event");
for (const event of data.all) {
  assert.ok(event.html.trim(), event.folder + ": missing Markdown content");
  assert.ok(event.timeRange, event.folder + ": missing hours");
}
console.log("PASS: " + data.all.length + " events, " + data.past.length +
            " archived, " + data.upcoming.length + " upcoming");
