/**
 * TestRun
 *
 * Framework-agnostic representation of a single test suite execution.
 * This is the primary input contract for all agents.
 *
 * - `results` contains per-test outcomes when available (e.g. fetched from
 *   GitHub Pages). It is empty for summary-only runs (consolidated.json).
 * - `summary` always reflects the aggregate counts for that run.
 * - `durationMs` is the total suite wall-clock time in milliseconds.
 * - `apiContext` is an optional run-level API health summary. When present,
 *   agents can correlate UI instability with backend availability signals.
 *   Agents MUST NOT draw API-layer conclusions when this field is absent.
 *
 * Agents that only need summary statistics (TrendPatternAgent) use `summary`.
 * Agents that need per-test data (DeepFailurePatternAgent) use `results`.
 */
import type { TestResult } from "./TestResult";
import type { ApiRunContext } from "./ApiSignal";

export interface TestRun {
    /** UTC timestamp in YYYY-MM-DD_HH-MM-SS format */
    timestamp: string;

    /** Target environment, e.g. "UAT", "TRAINING". Optional — may be absent in older runs. */
    environment?: string;

    /**
     * Individual test outcomes for this run.
     * Empty array when only summary data is available (e.g. from consolidated.json).
     */
    results: TestResult[];

    /** Aggregate counts for the run */
    summary: {
        total: number;
        passed: number;
        failed: number;
        flaky: number;
    };

    /** Total suite wall-clock execution time in milliseconds */
    durationMs?: number;

    /**
     * Optional run-level API health context captured by ApiSignalCollector.
     * When present, provides environment availability and auth-layer signals
     * that help distinguish test code instability from infrastructure instability.
     * Absent for historical runs predating API signal collection.
     */
    apiContext?: ApiRunContext;
}
