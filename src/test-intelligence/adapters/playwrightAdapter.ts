/**
 * playwrightAdapter.ts
 *
 * The ONLY file that knows about Playwright-specific data structures.
 * All agents receive TestRun[] — they never import from Playwright directly.
 *
 * Two conversion paths:
 *
 *   1. mapSummaryToTestRun(entry)
 *      Converts a consolidated.json summary entry (counts-only, no per-test
 *      detail) to a TestRun. The `results` array is empty — only `summary`
 *      is populated. Used by TrendPatternAgent and RegressionDeltaAgent.
 *
 *   2. mapRunOutcomeToTestRun(outcome)
 *      Converts a RunOutcome fetched from GitHub Pages (full per-test data)
 *      to a TestRun with a populated `results` array. Used internally by
 *      DeepFailurePatternAgent and RegressionDeltaAgent.
 *
 * Adding a new framework (Cypress, TestCafe, k6…) means adding a new
 * mapXxxToTestRun function here — no changes to any agent.
 */

import type { TestRun } from "../contracts/TestRun";
import type { TestResult } from "../contracts/TestResult";
import type {
    RunOutcome,
    PerTestOutcome
} from "../ai/utils/GitHubReportsClient";

// ── Consolidated.json entry format (SIMS-specific summary format) ─────────────
// Defined locally so no agent imports this shape — it stays isolated here.
interface RawConsolidatedEntry {
    timestamp: string;
    environment?: string;
    counts: {
        executed: number;
        passed: number;
        failed: number;
        flaky: number;
    };
    executionTimeSec: number;
}

/**
 * Convert a raw consolidated.json entry to a framework-agnostic TestRun.
 * Results array is empty — only summary counts are available in this format.
 */
export function mapSummaryToTestRun(raw: unknown): TestRun {
    const entry = raw as RawConsolidatedEntry;
    return {
        timestamp: entry.timestamp,
        environment: entry.environment,
        results: [],
        summary: {
            total: entry.counts?.executed ?? 0,
            passed: entry.counts?.passed ?? 0,
            failed: entry.counts?.failed ?? 0,
            flaky: entry.counts?.flaky ?? 0
        },
        durationMs: (entry.executionTimeSec ?? 0) * 1000
    };
}

/**
 * Convert a Playwright RunOutcome (fetched from GitHub Pages) to a TestRun
 * with a fully populated results array.
 */
export function mapRunOutcomeToTestRun(outcome: RunOutcome): TestRun {
    const results: TestResult[] = outcome.tests.map(
        (t: PerTestOutcome): TestResult => ({
            name: t.testTitle,
            status: mapPlaywrightStatus(t.finalStatus),
            durationMs: t.durationMs,
            errorMessage: t.errorMessage
        })
    );

    const passed = results.filter((r) => r.status === "passed").length;
    const failed = results.filter(
        (r) => r.status === "failed" || r.status === "timedOut"
    ).length;
    const flaky = results.filter((r) => r.status === "flaky").length;

    return {
        timestamp: outcome.timestamp,
        environment: outcome.environment,
        results,
        summary: {
            total: results.length,
            passed,
            failed,
            flaky
        }
    };
}

function mapPlaywrightStatus(
    s: PerTestOutcome["finalStatus"]
): TestResult["status"] {
    if (s === "timedOut") return "timedOut";
    if (s === "flaky") return "flaky";
    if (s === "failed") return "failed";
    return "passed";
}
