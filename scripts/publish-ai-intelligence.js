/**
 * publish-ai-intelligence.js
 *
 * Publishes AI intelligence outputs to the gh-pages directory structure.
 *
 * ── Responsibilities ─────────────────────────────────────────────────────────
 *
 *   1. Governance scan — warn (do NOT abort CI) if sensitive patterns found
 *   2. Generate manifest.json
 *   3. Write published-reports/ai-intelligence/latest/  (overwrite each run)
 *   4. Append published-reports/ai-intelligence/history/$TIMESTAMP/
 *   5. Update published-reports/ai-intelligence/history/index.json (append-only)
 *
 * ── Usage ────────────────────────────────────────────────────────────────────
 *
 *   Call AFTER `git checkout gh-pages` and BEFORE `git add / commit / push`.
 *   The script only writes files — git operations are handled by the workflow.
 *
 *   node scripts/publish-ai-intelligence.js \
 *     --timestamp  2026-05-20_10-13-47   (required; matches published-reports run dir)
 *     --reports    ai-outputs/reports    (optional; default: ai-outputs/reports)
 *     --dest       published-reports     (optional; default: published-reports)
 *
 * ── Environment variables ────────────────────────────────────────────────────
 *
 *   GITHUB_RUN_ID   — embedded in manifest for traceability (optional)
 *   TIMESTAMP       — fallback if --timestamp not passed (optional)
 *
 * ── Failure policy ───────────────────────────────────────────────────────────
 *
 *   Governance warnings are printed but do NOT cause a non-zero exit.
 *   The script exits 0 in all cases so CI never blocks on AI publishing.
 *   Structural errors (missing dest directory) are logged and exit 0.
 */

'use strict';

const fs   = require('fs');
const path = require('path');

const { scanForSensitiveData } = require('./merge-trace-shards');

// ─────────────────────────────────────────────────────────────────────────────
// Argument parsing
// ─────────────────────────────────────────────────────────────────────────────

function parseArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i++) {
    if (argv[i].startsWith('--') && argv[i + 1]) {
      args[argv[i].slice(2)] = argv[++i];
    }
  }
  return args;
}

const args      = parseArgs(process.argv);
const TIMESTAMP = args.timestamp || process.env.TIMESTAMP || new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19).replace('T', '_');
const REPORTS   = args.reports   || 'ai-outputs/reports';
const DEST      = args.dest      || 'published-reports';
const RUN_ID    = process.env.GITHUB_RUN_ID || 'local';

// ─────────────────────────────────────────────────────────────────────────────
// AI output files to publish
// ─────────────────────────────────────────────────────────────────────────────

const AI_SECTIONS = [
  { id: 'api-intelligence',  file: 'api-intelligence.json'  },
  { id: 'trend',             file: 'trend.json'             },
  { id: 'deep-failure',      file: 'deep-failure.json'      },
  { id: 'regression-delta',  file: 'regression-delta.json'  },
  { id: 'db-integrity',      file: 'db-integrity.json'      },
];

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function safeReadJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch {
    return null;
  }
}

function writeJson(filePath, data) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

// ─────────────────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────────────────

(function main() {
  console.log(`\n[publish-ai] Starting AI intelligence publish`);
  console.log(`[publish-ai]   Timestamp : ${TIMESTAMP}`);
  console.log(`[publish-ai]   Run ID    : ${RUN_ID}`);
  console.log(`[publish-ai]   Reports   : ${REPORTS}`);
  console.log(`[publish-ai]   Dest      : ${DEST}`);

  // Verify destination exists (must be on gh-pages branch)
  if (!fs.existsSync(DEST)) {
    console.warn(`[publish-ai] ⚠  Destination directory not found: ${DEST}`);
    console.warn(`[publish-ai]    Ensure gh-pages is checked out before running this script.`);
    process.exit(0);
  }

  const latestDir  = path.join(DEST, 'ai-intelligence', 'latest');
  const historyDir = path.join(DEST, 'ai-intelligence', 'history', TIMESTAMP);
  const indexPath  = path.join(DEST, 'ai-intelligence', 'history', 'index.json');

  fs.mkdirSync(latestDir,  { recursive: true });
  fs.mkdirSync(historyDir, { recursive: true });

  // ── Step 1: Collect available sections ─────────────────────────────────
  const sectionsAvailable = [];
  const sectionsSkipped   = {};
  let   traceCount        = 0;
  let   endpointCount     = 0;

  for (const section of AI_SECTIONS) {
    const srcPath = path.join(REPORTS, section.file);

    if (!fs.existsSync(srcPath)) {
      sectionsSkipped[section.id] = 'output file not found';
      console.warn(`[publish-ai]   ⚠  ${section.id}: ${srcPath} not found — skipping`);
      continue;
    }

    const data = safeReadJson(srcPath);
    if (!data) {
      sectionsSkipped[section.id] = 'JSON parse error';
      console.warn(`[publish-ai]   ⚠  ${section.id}: parse error — skipping`);
      continue;
    }

    // Skip seed/mock placeholder outputs — not real intelligence
    if (data._isMockData === true) {
      sectionsSkipped[section.id] = 'mock/seed placeholder — no real data captured yet';
      console.warn(`[publish-ai]   ⚠  ${section.id}: mock data — skipping publish`);
      continue;
    }

    // Skip if explicitly marked as not yet run
    if (data._captureNotRun === true) {
      sectionsSkipped[section.id] = 'capture not run';
      console.warn(`[publish-ai]   ⚠  ${section.id}: capture not run — skipping publish`);
      continue;
    }

    // ── Governance scan ───────────────────────────────────────────────────
    const jsonStr = JSON.stringify(data);
    const hits    = scanForSensitiveData(jsonStr);
    if (hits.length > 0) {
      console.warn(`[publish-ai]   ⚠  Governance: sensitive patterns in ${section.file}: ${hits.join(', ')}`);
      console.warn(`[publish-ai]      Proceeding with publish — review NetworkCapture PII masking.`);
    }

    // ── Collect metadata for manifest ─────────────────────────────────────
    if (section.id === 'api-intelligence') {
      traceCount    = data.totalTraces   || 0;
      endpointCount = data.uniqueEndpoints || 0;
    }

    sectionsAvailable.push(section.id);
    console.log(`[publish-ai]   ✓  ${section.id}`);

    // Write to latest/ and history/
    const srcRaw = fs.readFileSync(srcPath, 'utf-8');
    fs.writeFileSync(path.join(latestDir,  section.file), srcRaw, 'utf-8');
    fs.writeFileSync(path.join(historyDir, section.file), srcRaw, 'utf-8');
  }

  if (sectionsAvailable.length === 0) {
    console.warn(`[publish-ai] ⚠  No sections available to publish. Check that ai:full ran successfully.`);
    process.exit(0);
  }

  // ── Step 2: Generate manifest.json ────────────────────────────────────
  const manifest = {
    generatedAt:       new Date().toISOString(),
    workflowRunId:     RUN_ID,
    timestamp:         TIMESTAMP,
    sectionsAvailable,
    sectionsSkipped,
    traceCount,
    endpointCount,
  };

  const manifestJson = JSON.stringify(manifest, null, 2);
  fs.writeFileSync(path.join(latestDir,  'manifest.json'), manifestJson, 'utf-8');
  fs.writeFileSync(path.join(historyDir, 'manifest.json'), manifestJson, 'utf-8');
  console.log(`[publish-ai] ✓  manifest.json — ${sectionsAvailable.length} section(s) available`);

  // ── Step 3: Append to history/index.json (append-only) ────────────────
  let historyIndex = { entries: [] };
  if (fs.existsSync(indexPath)) {
    try {
      historyIndex = JSON.parse(fs.readFileSync(indexPath, 'utf-8'));
      if (!Array.isArray(historyIndex.entries)) historyIndex.entries = [];
    } catch {
      historyIndex = { entries: [] };
    }
  }

  // Deduplicate: replace existing entry for the same timestamp (idempotent re-runs)
  historyIndex.entries = historyIndex.entries.filter(e => e.timestamp !== TIMESTAMP);
  historyIndex.entries.unshift({
    timestamp:         TIMESTAMP,
    runId:             RUN_ID,
    generatedAt:       manifest.generatedAt,
    sectionsAvailable,
    traceCount,
    endpointCount,
  });

  // Keep max 90 entries in the index (well within gh-pages size limits)
  if (historyIndex.entries.length > 90) {
    historyIndex.entries = historyIndex.entries.slice(0, 90);
  }

  writeJson(indexPath, historyIndex);
  console.log(`[publish-ai] ✓  history/index.json — ${historyIndex.entries.length} total entries`);

  // ── Summary ───────────────────────────────────────────────────────────
  console.log(`\n[publish-ai] ✅ Publish complete`);
  console.log(`[publish-ai]   latest/  → ${latestDir}`);
  console.log(`[publish-ai]   history/ → ${historyDir}`);
  if (Object.keys(sectionsSkipped).length > 0) {
    console.warn(`[publish-ai]   Skipped sections: ${Object.keys(sectionsSkipped).join(', ')}`);
  }
})();
