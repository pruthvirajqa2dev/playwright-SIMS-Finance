#!/usr/bin/env node
/**
 * verify-report.js
 *
 * Verifies that a Playwright HTML report directory is a real, complete report
 * and not the placeholder stub injected when merge-reports fails.
 *
 * Usage:
 *   node scripts/verify-report.js <report-dir>
 *   node scripts/verify-report.js playwright-report
 *   node scripts/verify-report.js published-reports/2026-06-11_12-00-00
 *
 * Exit codes:
 *   0  — report is valid and complete
 *   1  — report is missing, is the placeholder, or is incomplete
 */

"use strict";

const fs = require("fs");
const path = require("path");

// ---------------------------------------------------------------------------
// Argument handling
// ---------------------------------------------------------------------------
const reportDir = process.argv[2];

if (!reportDir) {
    console.error("Usage: node scripts/verify-report.js <report-dir>");
    process.exit(1);
}

const absDir = path.resolve(reportDir);

// ---------------------------------------------------------------------------
// Helper: collect all results, print summary, exit
// ---------------------------------------------------------------------------
const checks = [];

function pass(label, detail) {
    checks.push({ ok: true, label, detail });
}

function fail(label, detail) {
    checks.push({ ok: false, label, detail });
}

function printResults() {
    const width = 80;
    console.log("─".repeat(width));
    console.log(`Playwright Report Verification: ${absDir}`);
    console.log("─".repeat(width));

    for (const c of checks) {
        const icon = c.ok ? "✅" : "❌";
        const detail = c.detail ? `  (${c.detail})` : "";
        console.log(`  ${icon}  ${c.label}${detail}`);
    }

    const failures = checks.filter((c) => !c.ok);
    console.log("─".repeat(width));
    if (failures.length === 0) {
        console.log("RESULT: VALID — report is a real Playwright HTML report");
        console.log("─".repeat(width));
        process.exit(0);
    } else {
        console.log(`RESULT: INVALID — ${failures.length} check(s) failed`);
        for (const f of failures) {
            console.log(`  ✖  ${f.label}: ${f.detail || "see above"}`);
        }
        console.log("─".repeat(width));
        process.exit(1);
    }
}

// ---------------------------------------------------------------------------
// CHECK 1 — Directory exists
// ---------------------------------------------------------------------------
if (!fs.existsSync(absDir)) {
    fail("Directory exists", `path not found: ${absDir}`);
    printResults();
    process.exit(1); // no point continuing
}
const stat = fs.statSync(absDir);
if (!stat.isDirectory()) {
    fail("Directory exists", `path exists but is not a directory: ${absDir}`);
    printResults();
    process.exit(1);
}
pass("Directory exists", absDir);

// ---------------------------------------------------------------------------
// CHECK 2 — index.html exists
// ---------------------------------------------------------------------------
const indexPath = path.join(absDir, "index.html");
if (!fs.existsSync(indexPath)) {
    fail("index.html exists", "file not found");
    printResults();
    process.exit(1);
}
pass("index.html exists");

// ---------------------------------------------------------------------------
// CHECK 3 — index.html is NOT the placeholder stub
// ---------------------------------------------------------------------------
const indexContent = fs.readFileSync(indexPath, "utf8");
const PLACEHOLDER_MARKERS = [
    "Report unavailable",
    "No Playwright HTML report was produced for this run"
];
const foundPlaceholder = PLACEHOLDER_MARKERS.find((m) =>
    indexContent.includes(m)
);
if (foundPlaceholder) {
    fail(
        "index.html is a real report",
        `placeholder text found: "${foundPlaceholder}"`
    );
    printResults();
    process.exit(1);
}
pass("index.html is a real report", "no placeholder markers detected");

// ---------------------------------------------------------------------------
// CHECK 4 — index.html is large enough to be a real Playwright report
// Playwright's HTML reporter produces an index.html that is typically >5 KB.
// The placeholder is <500 bytes.
// ---------------------------------------------------------------------------
const indexSize = fs.statSync(indexPath).size;
const MIN_REAL_REPORT_BYTES = 5 * 1024; // 5 KB
if (indexSize < MIN_REAL_REPORT_BYTES) {
    fail(
        "index.html is adequately sized",
        `file is only ${indexSize} bytes — expected >${MIN_REAL_REPORT_BYTES} for a real Playwright report`
    );
} else {
    pass(
        "index.html is adequately sized",
        `${(indexSize / 1024).toFixed(1)} KB`
    );
}

// ---------------------------------------------------------------------------
// CHECK 5 — data/ directory exists
// Playwright stores screenshots, videos, traces and .zip attachments inside data/.
// ---------------------------------------------------------------------------
const dataDir = path.join(absDir, "data");
if (!fs.existsSync(dataDir) || !fs.statSync(dataDir).isDirectory()) {
    fail(
        "data/ directory exists",
        "missing — report may be partial or auth-only"
    );
} else {
    const dataFiles = fs.readdirSync(dataDir);
    pass("data/ directory exists", `${dataFiles.length} file(s)`);

    // CHECK 5a — data/ contains at least one media/attachment file.
    // Playwright stores hashed screenshots (.png), videos (.webm), traces (.zip)
    // in data/. An auth-only report with zero test attachments may have an empty
    // data/ dir — that is still a structurally valid report.
    if (dataFiles.length === 0) {
        fail(
            "data/ is not empty",
            "data/ directory exists but contains zero files — report may be auth-only or empty"
        );
    } else {
        pass("data/ is not empty", `${dataFiles.length} attachment(s)`);
    }
}

// ---------------------------------------------------------------------------
// CHECK 6 — index.html references Playwright assets (title or script tags)
// A real Playwright report always includes a <title> referencing Playwright.
// ---------------------------------------------------------------------------
const hasPWTitle = /playwright/i.test(indexContent);
const hasScriptTag = /<script/i.test(indexContent);
if (!hasPWTitle && !hasScriptTag) {
    fail(
        "index.html references Playwright assets",
        "no <script> tags or 'playwright' in content"
    );
} else {
    pass("index.html references Playwright assets");
}

// ---------------------------------------------------------------------------
// CHECK 7 — Total file count sanity check
// A real merged Playwright report has significantly more than 1 file.
// ---------------------------------------------------------------------------
function countFiles(dir) {
    let count = 0;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        if (entry.isDirectory()) {
            count += countFiles(path.join(dir, entry.name));
        } else {
            count++;
        }
    }
    return count;
}
const totalFiles = countFiles(absDir);
const MIN_FILES = 3; // index.html + at least index.js-like + data file
if (totalFiles < MIN_FILES) {
    fail(
        "Report has sufficient files",
        `only ${totalFiles} file(s) — expected >= ${MIN_FILES}`
    );
} else {
    pass("Report has sufficient files", `${totalFiles} total`);
}

// ---------------------------------------------------------------------------
// Print final results
// ---------------------------------------------------------------------------
printResults();
