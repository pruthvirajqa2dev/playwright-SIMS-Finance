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
 *
 * API Signal enrichment (optional, progressive):
 *
 *   [Test execution] → ApiSignalCollector.flush() → testInfo attachment
 *       ↓ (future: extracted by playwrightAdapter from test-results.json)
 *   TestResult.apiSignals + TestRun.apiContext
 *       ↓
 *   Agent prompts receive API signal context as optional enrichment
 */

// ── Contracts ─────────────────────────────────────────────────────────────────
export type { TestResult } from "./contracts/TestResult";
export type { TestRun } from "./contracts/TestRun";
export type {
    ApiSignal,
    ApiSignalType,
    ApiRunContext
} from "./contracts/ApiSignal";
export type {
    ApiTrace,
    EndpointProfile,
    WorkflowSequence,
    ApiIntelligenceReport,
    ApiInsight,
    SIMSDomain,
    ApiCategory
} from "./contracts/ApiTrace";

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
export { runApiIntelligence } from "./ai/agents/ApiIntelligenceAgent";

// ── API traffic analysis (pre-AI, deterministic) ──────────────────────────────
export { ApiTrafficAnalyzer } from "./ai/utils/ApiTrafficAnalyzer";
export {
    generatePostmanCollection,
    generateOpenApiPaths
} from "./ai/utils/ApiExporters";
