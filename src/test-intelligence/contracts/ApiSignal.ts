/**
 * ApiSignal
 *
 * Normalized, deterministic API-layer observation that can be attached to a
 * test outcome or a run-level context object.
 *
 * Signals are computed from observable HTTP facts — status codes, latency
 * thresholds, and response-body matching — never from AI inference.
 *
 * Design constraints:
 *   - ALL classification thresholds are defined in code (ApiSignalCollector),
 *     not inferred by the AI. Agents receive pre-classified labels only.
 *   - A signal is only emitted when an actual HTTP interaction occurred.
 *   - The signal catalogue is append-only: new types may be added without
 *     changing existing consumers.
 *   - Agents treat signals as enrichment context; they NEVER override the
 *     deterministic test outcome (passed / failed / flaky / timedOut).
 *
 * ── Signal Catalogue ──────────────────────────────────────────────────────
 *
 *   apiStable
 *     Endpoint responded within the latency threshold with an expected HTTP
 *     status code. No anomaly detected.
 *
 *   apiLatencySpike
 *     Endpoint responded, but round-trip latency exceeded the configured
 *     threshold (default: 3 000 ms). Correlates with UI timeout instability.
 *
 *   authFailureDetected
 *     The auth/session endpoint returned HTTP 401 or 403, or a session-
 *     invalid body indicator was present. Explains authentication-related
 *     UI failures without requiring UI-layer error parsing.
 *
 *   persistenceMismatch
 *     A UI operation completed successfully, but a follow-up GET to the API
 *     did not return the expected entity. Distinguishes "UI claimed success"
 *     from "data actually persisted".
 *
 *   backendUnavailable
 *     The endpoint returned HTTP 5xx, timed out, or could not be reached.
 *     Distinguishes environment instability from test code defects.
 *
 *   inconsistentApiResponse
 *     The endpoint returned HTTP 2xx but the payload structure or field
 *     values did not match expectations. Surfaces silent data corruption
 *     that UI tests cannot detect.
 */
export type ApiSignalType =
    | "apiStable"
    | "apiLatencySpike"
    | "authFailureDetected"
    | "persistenceMismatch"
    | "backendUnavailable"
    | "inconsistentApiResponse";

export interface ApiSignal {
    /**
     * The normalized signal label — deterministically classified by
     * ApiSignalCollector, never inferred by AI.
     */
    signal: ApiSignalType;

    /**
     * The probed endpoint path (relative, no credentials embedded).
     * E.g. "/api/auth/status" or "/api/purchase-orders?ref=PO-001"
     */
    endpoint: string;

    /** HTTP status code observed. Absent when the request timed out or failed at network level. */
    httpStatus?: number;

    /** Round-trip latency in milliseconds. */
    latencyMs?: number;

    /**
     * Short, structured note for investigation context. Max 120 chars.
     * E.g. "Expected invoiceNumber=INV-042, received 0 results"
     * MUST NOT contain credentials, tokens, or personal data.
     */
    note?: string;
}

/**
 * ApiRunContext
 *
 * Run-level API health summary. Captured once per test run via optional
 * environment probes. Feeds into TrendPatternAgent's environment health model
 * to distinguish "test code instability" from "environment instability".
 *
 * This field is OPTIONAL in TestRun. When absent, no API-layer signals
 * were collected and agents must not draw API-layer conclusions.
 */
export interface ApiRunContext {
    /** UTC ISO-8601 timestamp when the context snapshot was captured */
    capturedAt: string;

    /**
     * Whether the environment's health / status endpoint responded with
     * a non-error HTTP code before the test run began.
     * false = environment was unreachable or returning 5xx at run start.
     */
    environmentAvailable: boolean;

    /**
     * Auth-layer signal for the run.
     *   "apiStable"           — auth endpoint confirmed working before run
     *   "authFailureDetected" — auth returned 401 / 403
     *   "backendUnavailable"  — auth endpoint timed out or returned 5xx
     */
    authSignal: "apiStable" | "authFailureDetected" | "backendUnavailable";

    /** Average latency across all API probes in this run (milliseconds). */
    avgLatencyMs?: number;

    /**
     * Total number of individual API probes collected across all tests in this run.
     * Zero means no API signals were captured; agents must not reference API layer.
     */
    probeCount: number;
}
