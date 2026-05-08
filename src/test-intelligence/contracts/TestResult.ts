/**
 * TestResult
 *
 * Framework-agnostic representation of a single test outcome within a run.
 * This contract is the unit of data that agents reason about at the per-test level.
 *
 * Playwright adapter: maps PerTestOutcome → TestResult
 * Future adapters: map Cypress/TestCafe/etc. → TestResult
 */
import type { ApiSignal } from "./ApiSignal";

export interface TestResult {
    /** Full test name / title as reported by the framework */
    name: string;

    /**
     * Final status after all retries.
     * "flaky" means the test passed on a retry (non-deterministic result).
     */
    status: "passed" | "failed" | "flaky" | "timedOut";

    /** How long this test took in milliseconds */
    durationMs: number;

    /** First error message snippet, if any (≤ 200 chars) */
    errorMessage?: string;

    /**
     * Optional API-layer signals captured during this test via ApiSignalCollector.
     * Absent when no API probes were performed — agents must not draw API-layer
     * conclusions when this field is missing.
     *
     * Signals are deterministically classified (never AI-inferred) and serve as
     * enrichment context to distinguish UI instability from backend instability.
     */
    apiSignals?: ApiSignal[];
}
