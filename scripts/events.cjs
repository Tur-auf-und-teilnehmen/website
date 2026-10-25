"use strict";
const fs = require("node:fs");
const path = require("node:path");
const MarkdownIt = require("markdown-it");

const root = path.resolve(__dirname, "..");
const eventRoot = path.join(root, "events");
const markdown = new MarkdownIt({ html: true, linkify: true });
const folderPattern = /^\d{4}-\d{2}-\d{2}_[a-z0-9]+(?:-[a-z0-9]+)*$/;
const required = ["id", "title", "start", "end", "timezone", "venue", "address", "registrationUrl"];
const fmt = (date, opts) => new Intl.DateTimeFormat("de-DE", {
  timeZone: "Europe/Berlin", ...opts
}).format(date);
const safeAsset = /^(?:[a-z0-9][-a-z0-9]*\/)*[a-z0-9][-a-z0-9]*\.(?:png|webp|jpe?g|svg|mp4|webm|gif)$/i;

function loadEvents() {
  const now = new Date();
  const ids = new Set();
  const dirs = fs.readdirSync(eventRoot, { withFileTypes: true })
    .filter(d => d.isDirectory() && folderPattern.test(d.name))
    .map(d => d.name).sort();

  const all = dirs.map(folder => {
    const base = path.join(eventRoot, folder);
    const configPath = path.join(base, "event.json");
    if (!fs.existsSync(configPath)) throw Error("Missing " + configPath);
    const data = JSON.parse(fs.readFileSync(configPath, "utf8"));
    for (const key of required) {
      if (typeof data[key] !== "string" || !data[key].trim()) {
        throw Error(folder + ": missing " + key);
      }
    }
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(data.id) || ids.has(data.id)) {
      throw Error(folder + ": invalid or duplicate event id");
    }
    ids.add(data.id);
    if (data.timezone !== "Europe/Berlin") throw Error(folder + ": unsupported timezone");
    for (const key of ["start", "end"]) {
      if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}[+-]\d{2}:\d{2}$/.test(data[key])) {
        throw Error(folder + ": " + key + " requires ISO 8601 with UTC offset");
      }
    }
    const start = new Date(data.start), end = new Date(data.end);
    if (!Number.isFinite(start.valueOf()) || !Number.isFinite(end.valueOf()) || start >= end) {
      throw Error(folder + ": invalid date interval");
    }
    if (!["published", "draft", "cancelled"].includes(data.status)) {
      throw Error(folder + ": unsupported status");
    }
    if (!/^https:\/\//.test(data.registrationUrl)) {
      throw Error(folder + ": registrationUrl must use HTTPS");
    }
    if (!data.assets || typeof data.assets !== "object" || Array.isArray(data.assets)) {
      throw Error(folder + ": assets must be an object");
    }
    for (const [label, filename] of Object.entries(data.assets)) {
      if (typeof filename !== "string" || !safeAsset.test(filename) ||
          !fs.existsSync(path.join(base, filename))) {
        throw Error(folder + ": missing/unsafe asset " + label + ": " + filename);
      }
    }
    const day = fmt(start, { day: "2-digit" });
    const month = fmt(start, { month: "2-digit" });
    const year = fmt(start, { year: "numeric" });
    const folderDate = year + "-" + month + "-" + day;
    if (!folder.startsWith(folderDate + "_")) {
      throw Error(folder + ": folder prefix disagrees with local start date");
    }
    const mdPath = path.join(base, "content.md");
    const text = fs.existsSync(mdPath) ? fs.readFileSync(mdPath, "utf8") : "";
    const context = {
      ...data, folder, day, month,
      displayDate: day + "." + month + "." + year,
      dateLong: Number(day) + ". " + fmt(start, {month:"long"}),
      dateLongYear: Number(day) + ". " + fmt(start, {month:"long"}) + " " + year,
      weekday: fmt(start, {weekday:"long"}),
      startTime: fmt(start, {hour:"2-digit",minute:"2-digit",hourCycle:"h23"}),
      endTime: fmt(end, {hour:"2-digit",minute:"2-digit",hourCycle:"h23"}),
      locationFull: data.venue + " · " + data.address,
      mapUrl: data.mapUrl || "",
      assetUrls: Object.fromEntries(Object.entries(data.assets).map(([label, filename]) =>
        [label, "events/" + folder + "/" + filename]))
    };
    context.timeRange = context.startTime + "-" + context.endTime + " Uhr";
    let dynamicMd = text;
    for (const key of ["dateLong","dateLongYear","displayDate","weekday","startTime","endTime","venue","title"]) {
      dynamicMd = dynamicMd.replaceAll("{{" + key + "}}", String(context[key] || ""));
    }
    context.html = markdown.render(dynamicMd);
    context.isPast = end <= now;
    context.isUpcoming = start > now && data.status === "published";
    return context;
  }).filter(e => e.status !== "draft");

  all.sort((a,b) => new Date(a.start) - new Date(b.start));
  const featured = all.find(e => e.featured) || all.find(e => e.isUpcoming) || all[0];
  if (!featured) throw Error("At least one published preview event is required");
  return {
    all, featured,
    upcoming: all.filter(e => e.isUpcoming),
    past: all.filter(e => e.isPast).sort((a,b) => new Date(b.end) - new Date(a.end))
  };
}
module.exports = { loadEvents };
