/**
 * AI pipeline orchestrator.
 * Runs all 4 agents in sequence, then ALWAYS runs ai:report regardless of
 * individual agent failures (e.g. db:check exiting 1 on critical violations).
 * Exits with code 1 if any agent failed, so CI gates are preserved.
 */

const { execSync } = require("child_process");

const agents = ["ai:trends", "ai:deep", "ai:regression", "ai:db:check"];
let anyFailed = false;

for (const script of agents) {
  try {
    execSync(`npm run ${script}`, { stdio: "inherit", shell: true });
  } catch {
    anyFailed = true;
  }
}

// Always generate the HTML report, even when db:check found critical violations
execSync("npm run ai:report", { stdio: "inherit", shell: true });

if (anyFailed) process.exit(1);
