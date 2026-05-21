'use strict';
const fs = require('fs');

// ── Load report ──────────────────────────────────────────────────────────────
let jsonReport;
try {
  jsonReport = JSON.parse(fs.readFileSync('test-results.json', 'utf-8'));
} catch (err) {
  console.error('[parse-json-report] Failed to parse test-results.json:', err.message);
  process.exit(1);
}

// ── Count tests by walking the suite tree ────────────────────────────────────
//
// We use test.status (the final outcome after all retry attempts) rather than
// iterating test.results[].  This avoids double-counting retries — previously
// the loop over results[], combined with a broken `||'timedOut'` expression
// (truthy string — always true), inflated failedTests on every run.
//
// Playwright test.status values:
//   'expected'   — passed on final attempt
//   'unexpected' — failed on all attempts
//   'flaky'      — failed initially, passed on a later retry (counted in stats.flaky)
//   'skipped'    — skipped via test.skip / test.fixme

let executedTests = 0;
let passedTests   = 0;
let failedTests   = 0;

function walkSuites(suites) {
  for (const suite of (suites || [])) {
    for (const spec of (suite.specs || [])) {
      for (const test of (spec.tests || [])) {
        if (test.status === 'skipped') continue;
        executedTests++;
        if (test.status === 'expected' || test.status === 'flaky') {
          passedTests++;
        } else if (test.status === 'unexpected') {
          failedTests++;
        }
        console.log(`[parse-json-report] spec="${spec.title}" status=${test.status}`);
      }
    }
    walkSuites(suite.suites);
  }
}

walkSuites(jsonReport.suites);

const flakyTests = jsonReport.stats?.flaky ?? 0;

// ── Output ───────────────────────────────────────────────────────────────────
console.log(`[parse-json-report] Executed : ${executedTests}`);
console.log(`[parse-json-report] Passed   : ${passedTests}`);
console.log(`[parse-json-report] Failed   : ${failedTests}`);
console.log(`[parse-json-report] Flaky    : ${flakyTests}`);

const envFilePath = process.env.GITHUB_ENV;
if (envFilePath) {
  fs.appendFileSync(envFilePath, `EXECUTED_TESTS=${executedTests}\n`);
  fs.appendFileSync(envFilePath, `PASSED_TESTS=${passedTests}\n`);
  fs.appendFileSync(envFilePath, `FAILED_TESTS=${failedTests}\n`);
  fs.appendFileSync(envFilePath, `FLAKY_TESTS=${flakyTests}\n`);
}
