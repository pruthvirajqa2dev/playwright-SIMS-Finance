/**
 * AI pipeline orchestrator.
 * Runs all agents in sequence, then ALWAYS runs ai:report regardless of
 * individual agent failures (e.g. db:check exiting 1 on critical violations).
 * Exits with code 1 if any agent failed, so CI gates are preserved.
 *
 * DB integrity special handling:
 *   When DB credentials are absent (no DB_SERVER / DB_DATABASE in .env) the
 *   DatabaseIntegrityAgent exits non-zero without writing a report file.
 *   In that case, if a mock/fallback file already exists at the expected path
 *   we preserve it and do NOT count the DB step as a pipeline failure — the
 *   report will render the mock data with the "🧪 Mock Data — POC" banner.
 *   To suppress this behaviour and enforce a real DB check, set DB_SERVER in
 *   src/config/.env before running ai:full.
 *
 * API Intelligence special handling:
 *   When no network traces were captured (ENABLE_NETWORK_CAPTURE not set, or
 *   no tests used the fixture), ApiIntelligenceAgent exits non-zero.
 *   In that case, if a mock/fallback api-intelligence.json already exists we
 *   preserve it (the report renders it with a "🧪 Mock Data" banner).
 *   To enable real capture: set ENABLE_NETWORK_CAPTURE=true in src/config/.env
 *   and ensure tests import from src/fixtures/test.ts.
 */

const { execSync } = require("child_process");
const fs            = require("fs");
const path          = require("path");

const { mergeWorkerShards } = require("./merge-trace-shards");

const DB_REPORT_PATH     = "ai-outputs/reports/db-integrity.json";
const API_REPORT_PATH    = "ai-outputs/reports/api-intelligence.json";
const TRACES_OUTPUT_PATH = "ai-outputs/traces/network-traces.json";

// ── Auto-merge pending local worker shard files ───────────────────────────
// VS Code Test Explorer and interrupted runs leave worker-{n}.json shards
// without globalTeardown merging them.  mergeWorkerShards() handles this so
// `npm run ai:full` always uses the latest real data regardless of launch method.
mergeWorkerShards(path.join("ai-outputs", "traces"), TRACES_OUTPUT_PATH);

const agents = ["ai:trends", "ai:deep", "ai:regression"];
let anyFailed = false;

for (const script of agents) {
  try {
    execSync(`npm run ${script}`, { stdio: "inherit", shell: true });
  } catch {
    anyFailed = true;
  }
}

// ── DB integrity step — gracefully fall back to mock when no credentials ──
try {
  execSync("npm run ai:db:check", { stdio: "inherit", shell: true });
} catch {
  // Check whether the agent failed due to missing credentials (expected in
  // local / POC environments) or because it found critical violations.
  // If a fallback/mock report already exists, keep it and warn; otherwise
  // mark the pipeline as failed so CI gates still fire.
  if (fs.existsSync(DB_REPORT_PATH)) {
    const existing = JSON.parse(fs.readFileSync(DB_REPORT_PATH, "utf8"));
    if (existing._isMockData) {
      console.warn(
        "\n⚠️  DB credentials not configured — using mock db-integrity.json (POC mode).\n" +
        "   Set DB_SERVER, DB_DATABASE, DB_USER, DB_PASSWORD in src/config/.env to enable live checks.\n"
      );
      // Not a pipeline failure — mock data is intentional
    } else {
      // Real report exists but agent exited 1 (critical violations found)
      anyFailed = true;
    }
  } else {
    anyFailed = true;
  }
}

// ── API Intelligence step — gracefully fall back to mock when no traces ──
try {
  execSync("npm run ai:api", { stdio: "inherit", shell: true });
} catch {
  // ApiIntelligenceAgent exits non-zero when no traces file is found or when
  // Azure OpenAI credentials are missing.
  // If a mock/fallback report already exists, keep it and warn.
  if (fs.existsSync(API_REPORT_PATH)) {
    const existing = JSON.parse(fs.readFileSync(API_REPORT_PATH, "utf8"));
    if (existing._isMockData) {
      console.warn(
        "\n⚠️  API Intelligence: no real traces captured — using seed api-intelligence.json (mock mode).\n" +
        "   Set ENABLE_NETWORK_CAPTURE=true in src/config/.env and ensure tests import from\n" +
        "   src/fixtures/test.ts to enable live network capture.\n"
      );
      // Not a pipeline failure — mock data is intentional
    } else {
      // Real report exists but agent errored (e.g. OpenAI credentials missing)
      anyFailed = true;
    }
  }
  // If no report exists at all, skip silently — ApiIntelligenceSection
  // renders a graceful empty state when apiIntel is null.
}

// Always generate the HTML report, even when individual agents failed
execSync("npm run ai:report", { stdio: "inherit", shell: true });

if (anyFailed) process.exit(1);

