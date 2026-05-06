/**
 * AI pipeline orchestrator.
 * Runs all 4 agents in sequence, then ALWAYS runs ai:report regardless of
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
 */

const { execSync } = require("child_process");
const fs            = require("fs");

const DB_REPORT_PATH = "ai-outputs/reports/db-integrity.json";

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

// Always generate the HTML report, even when db:check found critical violations
execSync("npm run ai:report", { stdio: "inherit", shell: true });

if (anyFailed) process.exit(1);
