/**
 * test-intelligence/index.ts
 *
 * Public API surface for the test-intelligence layer.
 *
 * External consumers (scripts, CI runners, future standalone packages) should
 * import from here — not from the individual agent or adapter files.
 *
 * Layered architecture:
 *
 *   [Raw Input]  →  [Adapter]  →  [TestRun[]]  →  [Agent]  →  [Report JSON]
 *
 *   Playwright consolidated.json  ──────────────────────────────────────────┐
 *   Playwright test-results.json (GitHub Pages)  ──────────────────────────┤
 *   (future: Cypress, TestCafe, k6…)                                        │
 *                                                           playwrightAdapter│
 *                                                                            ↓
 *                                                                    TestRun[]
 *                                                                            │
 *                                     ┌──────────────────────────────────── ↓
 *                                     │   TrendPatternAgent  →  TrendReport
 *                                     │   DeepFailurePatternAgent → DeepFailureReport
 *                                     │   RegressionDeltaAgent → RegressionDeltaReport
 *                                     └──────────────────────────────────────
 */

// ── Contracts ─────────────────────────────────────────────────────────────────
export type { TestResult } from "./contracts/TestResult";
export type { TestRun } from "./contracts/TestRun";

// ── Adapters ──────────────────────────────────────────────────────────────────
export {
    mapSummaryToTestRun,
    mapRunOutcomeToTestRun
} from "./adapters/playwrightAdapter";

// ── Utilities ─────────────────────────────────────────────────────────────────
export { filterByExcludedDays } from "./utils/helpers";

// ── Agents (re-exported for programmatic use) ─────────────────────────────────
export { analyseTrends } from "./ai/agents/TrendPatternAgent";
export { runDeepAnalysis } from "./ai/agents/DeepFailurePatternAgent";
export { runRegressionDelta } from "./ai/agents/RegressionDeltaAgent";
export { runDatabaseIntegrityCheck } from "./ai/agents/DatabaseIntegrityAgent";
