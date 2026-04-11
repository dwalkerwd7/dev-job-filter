const fs = require("fs");
const path = require("path");

const cfg = JSON.parse(fs.readFileSync(path.join(__dirname, "../pipeline.cfg"), "utf8"));

const REQUIRED = {
    "scraper.concurrency":              "number",
    "scraper.jobKeywords":              "array",
    "scraper.jobDescSelectors":         "array",
    "filter.batchSize":                 "number",
    "filter.batchDelayMs":              "number",
    "filter.infoBatchDelayMs":          "number",
    "filter.stackMaxTokens":            "number",
    "filter.locationMaxTokens":         "number",
    "filter.workArrangementMaxTokens":  "number",
    "filter.minDescriptionLength":      "number",
    "filter.targetStack":               "array",
    "filter.windowKeywords":            "array",
};

for (const [keyPath, expectedType] of Object.entries(REQUIRED)) {
    const [section, key] = keyPath.split(".");
    const val = cfg[section]?.[key];
    const actualType = Array.isArray(val) ? "array" : typeof val;
    if (actualType !== expectedType) {
        throw new Error(`pipeline.cfg: "${keyPath}" must be a ${expectedType} (got ${actualType})`);
    }
}

module.exports = cfg;
