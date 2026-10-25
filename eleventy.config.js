const { loadEvents } = require("./scripts/events.cjs");
const { writeCalendars } = require("./scripts/ics.cjs");

module.exports = function(eleventyConfig) {
  eleventyConfig.addGlobalData("eventData", () => loadEvents());
  eleventyConfig.addGlobalData("featuredEvent", () => loadEvents().featured);

  eleventyConfig.addPassthroughCopy("assets");
  eleventyConfig.addPassthroughCopy("favicon.ico");
  eleventyConfig.addPassthroughCopy("pulseline-qr.html");
  eleventyConfig.addPassthroughCopy("events/**/*.{mp4,webm,png,jpg,jpeg,webp,svg,gif}");
  eleventyConfig.addPassthroughCopy("events/tuer-auf-und-teilnehmen-kickoff-2026-10-23.ics");

  eleventyConfig.addWatchTarget("events/");
  eleventyConfig.on("eleventy.after", () => writeCalendars());

  return {
    dir: { input: "site", output: "dist" },
    templateFormats: ["njk", "md"],
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk"
  };
};
