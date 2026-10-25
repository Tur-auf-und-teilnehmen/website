"use strict";
const fs = require("node:fs");
const path = require("node:path");
const { loadEvents } = require("./events.cjs");
const root = path.resolve(__dirname, "..");
function escapeIcs(text) {
  return String(text || "").replace(/\\/g, "\\\\").replace(/\r?\n/g, "\\n")
    .replace(/,/g, "\\,").replace(/;/g, "\\;");
}
function toUtc(iso) {
  return new Date(iso).toISOString().replace(/[-:]/g,"").replace(/\.\d{3}Z$/,"Z");
}
function writeCalendars() {
  for (const event of loadEvents().all) {
    const lines = [
      "BEGIN:VCALENDAR","VERSION:2.0",
      "PRODID:-//Tuer auf und teilnehmen//Website//DE",
      "CALSCALE:GREGORIAN","METHOD:PUBLISH","BEGIN:VEVENT",
      "UID:" + escapeIcs(event.uid || event.id + "@tur-auf-und-teilnehmen.github.io"),
      "DTSTAMP:" + toUtc(event.start),
      "DTSTART:" + toUtc(event.start),
      "DTEND:" + toUtc(event.end),
      "SUMMARY:" + escapeIcs(event.title),
      "LOCATION:" + escapeIcs(event.locationFull),
      "DESCRIPTION:" + escapeIcs(event.summary || event.title),
      "STATUS:CONFIRMED","TRANSP:OPAQUE","END:VEVENT","END:VCALENDAR",""
    ];
    const directory = path.join(root,"dist","events",event.folder);
    fs.mkdirSync(directory,{recursive:true});
    const calendar = lines.join("\r\n");
    fs.writeFileSync(path.join(directory,"event.ics"),calendar,"utf8");
    if (event.legacyIcsPath) {
      if (!/^events\/[a-z0-9_-]+\.ics$/.test(event.legacyIcsPath)) {
        throw Error("Unsafe legacy ICS path: " + event.legacyIcsPath);
      }
      const alias = path.join(root,"dist",event.legacyIcsPath);
      fs.mkdirSync(path.dirname(alias),{recursive:true});
      fs.writeFileSync(alias,calendar,"utf8");
    }
  }
}
module.exports = { writeCalendars };
