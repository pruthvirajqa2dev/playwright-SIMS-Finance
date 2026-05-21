/**
 * merge-trace-shards.js
 *
 * Merges per-shard network-traces.json files into a single consolidated
 * network-traces.json for ApiIntelligenceAgent to process.
 *
 * ── CI usage (downstream ai-intelligence job) ────────────────────────────────
 *
 *   Artifacts are downloaded with merge-multiple: false, producing:
 *
 *     <source-dir>/
 *       network-traces-shard-1/
 *         network-traces.json
 *       network-traces-shard-2/
 *         network-traces.json
 *
 *   Run:
 *     node scripts/merge-trace-shards.js /tmp/shard-traces \
 *       ai-outputs/traces/network-traces.json
 *
 * ── Local usage (run-ai-full.js) ─────────────────────────────────────────────
 *
 *   run-ai-full.js calls mergeWorkerShards() directly (imported function below)
 *   to merge worker-{n}.json files written by the NetworkCapture fixture.
 *
 * ── Failure behaviour ────────────────────────────────────────────────────────
 *
 *   All errors are warnings — the script exits 0 even when no traces are found
 *   so that an empty capture run does not break the CI pipeline.
 */

"use strict";

const fs = require("fs");
const path = require("path");
const glob = require("glob");

// ─────────────────────────────────────────────────────────────────────────────
// Governance: sensitive pattern scan
// ─────────────────────────────────────────────────────────────────────────────

const SENSITIVE_PATTERNS = [
    // Negative lookahead (?!\[REDACTED\]) prevents false positives on already-masked values
    {
        re: /password["']?\s*[:=]\s*["']?(?!\[REDACTED\])[^\s"',}{]{4,}/i,
        label: "password"
    },
    {
        re: /api[_-]?key["']?\s*[:=]\s*["']?(?!\[REDACTED\])[^\s"',}{]{8,}/i,
        label: "api-key"
    },
    {
        re: /bearer\s+(?!\[REDACTED\])[a-zA-Z0-9\-._~+/]+=*/i,
        label: "bearer-token"
    },
    {
        re: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/,
        label: "email-address"
    }
];

/**
 * Scan a JSON string for known sensitive patterns.
 * Returns an array of { label } for each match found.
 */
function scanForSensitiveData(jsonString) {
    return SENSITIVE_PATTERNS.filter(({ re }) => re.test(jsonString)).map(
        ({ label }) => label
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Core merge logic
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Merge per-CI-shard trace files from a source directory into outputPath.
 *
 * Source directory structure (from download-artifact, merge-multiple: false):
 *   <sourceDir>/<artifact-name>/network-traces.json
 *
 * @param {string} sourceDir   Directory containing per-shard subdirectories.
 * @param {string} outputPath  Destination consolidated JSON file.
 * @returns {number}           Number of traces merged (0 = nothing to do).
 */
function mergeCIShards(sourceDir, outputPath) {
    if (!fs.existsSync(sourceDir)) {
        console.warn(
            `[merge-shards] Source directory not found: ${sourceDir} — skipping`
        );
        return 0;
    }

    const shardFiles = glob.sync("*/network-traces.json", {
        cwd: sourceDir,
        absolute: true
    });

    if (shardFiles.length === 0) {
        console.warn(
            `[merge-shards] No network-traces.json files found under ${sourceDir}`
        );
        console.warn(
            `[merge-shards]   Expected: ${sourceDir}/<shard>/network-traces.json`
        );
        return 0;
    }

    console.log(`[merge-shards] Found ${shardFiles.length} CI shard file(s):`);

    const combined = [];
    let skippedFiles = 0;

    for (const filePath of shardFiles) {
        const shardName = path.basename(path.dirname(filePath));
        try {
            const raw = fs.readFileSync(filePath, "utf-8");
            const data = JSON.parse(raw);

            if (!Array.isArray(data)) {
                // Seed/mock placeholder has { _isMockData: true, traces: [...] } — skip gracefully
                console.warn(
                    `[merge-shards]   ⚠  ${shardName}/network-traces.json: not a plain array — skipping`
                );
                skippedFiles++;
                continue;
            }

            console.log(
                `[merge-shards]   ✓  ${shardName}: ${data.length} trace(s)`
            );
            combined.push(...data);
        } catch (err) {
            console.warn(
                `[merge-shards]   ✗  ${shardName}: parse error — ${err.message} — skipping`
            );
            skippedFiles++;
        }
    }

    if (combined.length === 0) {
        console.warn(
            `[merge-shards] No valid traces found (${skippedFiles} shard(s) skipped)`
        );
        return 0;
    }

    // Governance scan before writing
    const jsonOut = JSON.stringify(combined, null, 2);
    const hits = scanForSensitiveData(jsonOut);
    if (hits.length > 0) {
        console.warn(
            `[merge-shards] ⚠  Governance: potential sensitive patterns detected: ${hits.join(", ")}`
        );
        console.warn(
            `[merge-shards]    Review NetworkCapture masking. Proceeding — verify output before publishing.`
        );
    }

    // Re-number sequences for stable global ordering
    combined.forEach((trace, i) => {
        trace.seq = i + 1;
    });

    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, jsonOut, "utf-8");

    console.log(
        `[merge-shards] ✅ Merged ${combined.length} trace(s) from ${shardFiles.length - skippedFiles} shard(s) → ${outputPath}`
    );
    if (skippedFiles > 0) {
        console.warn(`[merge-shards] ⚠  ${skippedFiles} shard(s) skipped`);
    }
    return combined.length;
}

/**
 * Merge local worker-{n}.json shard files (produced by NetworkCapture fixture)
 * into outputPath.  Used by run-ai-full.js for local developer runs.
 *
 * @param {string} tracesDir   Directory containing worker-{n}.json files.
 * @param {string} outputPath  Destination consolidated JSON file.
 * @returns {number}           Number of traces merged.
 */
function mergeWorkerShards(tracesDir, outputPath) {
    const shardPaths = glob.sync(path.join(tracesDir, "worker-*.json"));

    if (shardPaths.length === 0) return 0;

    const combined = [];
    let skipped = 0;

    for (const filePath of shardPaths) {
        try {
            const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
            if (!Array.isArray(data)) {
                skipped++;
                continue;
            }
            combined.push(...data);
        } catch {
            console.warn(
                `[merge-shards] Could not read ${filePath} — skipping`
            );
            skipped++;
        }
    }

    if (combined.length === 0) {
        console.log(
            "[merge-shards] Worker shards found but contained no valid traces."
        );
        return 0;
    }

    combined.forEach((t, i) => {
        t.seq = i + 1;
    });
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, JSON.stringify(combined, null, 2), "utf-8");

    console.log(
        `[merge-shards] Merged ${combined.length} trace(s) from ${shardPaths.length} worker shard(s) → ${outputPath}`
    );

    // Clean up shard files so the next run starts fresh
    for (const filePath of shardPaths) {
        try {
            fs.unlinkSync(filePath);
        } catch {
            /* non-fatal */
        }
    }

    return combined.length;
}

// ─────────────────────────────────────────────────────────────────────────────
// CLI entry point (CI usage)
// ─────────────────────────────────────────────────────────────────────────────

if (require.main === module) {
    const [, , sourceDir, outputPath] = process.argv;

    if (!sourceDir || !outputPath) {
        console.error(
            "Usage: node scripts/merge-trace-shards.js <source-dir> <output-path>"
        );
        console.error(
            "  <source-dir>  Directory with per-shard subdirectories (CI artifact layout)"
        );
        console.error("  <output-path> Destination network-traces.json");
        process.exit(1);
    }

    mergeCIShards(sourceDir, outputPath);
    // Always exit 0 — trace capture failures must never block the CI pipeline
    process.exit(0);
}

module.exports = { mergeCIShards, mergeWorkerShards, scanForSensitiveData };
