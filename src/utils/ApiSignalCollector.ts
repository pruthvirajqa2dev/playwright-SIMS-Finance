/**
 * ApiSignalCollector
 *
 * Lightweight Playwright API probe utility for collecting deterministic
 * API-layer signals during test execution.
 *
 * Signals enrich the AI QA intelligence platform's root-cause analysis by
 * distinguishing UI-layer instability from backend infrastructure problems.
 * They are NOT a separate API testing framework — they augment existing UI
 * tests with targeted HTTP observations at high-value investigation points.
 *
 * ── Usage in a Playwright test ───────────────────────────────────────────────
 *
 *   import { ApiSignalCollector } from "../utils/ApiSignalCollector";
 *
 *   test("Create purchase order", async ({ page, request }, testInfo) => {
 *     const api = new ApiSignalCollector(request, testInfo);
 *
 *     // 1. Verify the auth layer is healthy before the UI test begins
 *     await api.probeAuth("/api/auth/status");
 *
 *     // 2. Perform the UI test actions as normal
 *     await createPurchaseOrderViaUI(page, poData);
 *
 *     // 3. Verify the created record was persisted at the API layer
 *     await api.probePersistence("/api/purchase-orders", "reference", poData.ref);
 *
 *     // 4. Flush signals so Playwright captures them in the test report
 *     await api.flush();
 *   });
 *
 * ── Design constraints ───────────────────────────────────────────────────────
 *
 *   - Signal classification uses ONLY observable HTTP facts (status codes,
 *     latency, response body matching). Never speculative.
 *   - All thresholds are configurable at construction time.
 *   - Probe failures NEVER throw — they emit a "backendUnavailable" signal
 *     and execution continues, preserving existing test integrity.
 *   - No credentials, tokens, or PII are included in signal notes.
 *   - This utility is test-time only. Agents consume signals through the
 *     contracts layer (TestResult.apiSignals, TestRun.apiContext).
 *
 * ── Safe initial probe targets for SIMS Finance ─────────────────────────────
 *
 *   probeAuth("/api/auth/status")
 *     → Classifies: apiStable | authFailureDetected | backendUnavailable
 *     → Value: Explains why login-dependent tests fail without deep UI parsing.
 *
 *   probePersistence("/api/purchase-orders?ref=PO-001", "reference", "PO-001")
 *     → Classifies: apiStable | persistenceMismatch | backendUnavailable
 *     → Value: Confirms transaction actually persisted (vs UI showing false success).
 *
 *   probeEndpoint("/api/health")
 *     → Classifies: apiStable | apiLatencySpike | backendUnavailable
 *     → Value: Detects environment instability before attributing failures to test code.
 */

import type { APIRequestContext, TestInfo } from "@playwright/test";
import type {
    ApiSignal,
    ApiSignalType
} from "../test-intelligence/contracts/ApiSignal";

// ─────────────────────────────────────────────────────────────────────────────
// Configuration
// ─────────────────────────────────────────────────────────────────────────────

export interface ApiSignalCollectorOptions {
    /**
     * Latency above this value (ms) is classified as apiLatencySpike.
     * Default: 3 000 ms — calibrated to SIMS Finance's observed baseline.
     */
    latencySpikeThresholdMs?: number;

    /** Request timeout in ms. Default: 10 000 ms. */
    timeoutMs?: number;

    /**
     * If true, each probe logs a one-line summary to stdout.
     * Useful for local investigation; disable in CI to keep output clean.
     * Default: false.
     */
    verbose?: boolean;
}

const DEFAULTS: Required<ApiSignalCollectorOptions> = {
    latencySpikeThresholdMs: 3_000,
    timeoutMs: 10_000,
    verbose: false
};

/**
 * Playwright attachment name used to store collected signals in the test report.
 * The playwrightAdapter looks for this name when extracting ApiSignal[] from
 * a test result's attachments.
 */
export const API_SIGNALS_ATTACHMENT_NAME = "api-signals";

// ─────────────────────────────────────────────────────────────────────────────
// Collector
// ─────────────────────────────────────────────────────────────────────────────

export class ApiSignalCollector {
    private readonly request: APIRequestContext;
    private readonly testInfo: TestInfo;
    private readonly opts: Required<ApiSignalCollectorOptions>;
    private readonly signals: ApiSignal[] = [];

    constructor(
        request: APIRequestContext,
        testInfo: TestInfo,
        options?: ApiSignalCollectorOptions
    ) {
        this.request = request;
        this.testInfo = testInfo;
        this.opts = { ...DEFAULTS, ...options };
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Probe methods — high-value investigation points for SIMS Finance
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Probe an authentication or session-validation endpoint.
     *
     * Emits:
     *   apiStable           — endpoint confirmed healthy
     *   authFailureDetected — HTTP 401 or 403 (session invalid / expired)
     *   apiLatencySpike     — responded but slowly (may indicate load / cold start)
     *   backendUnavailable  — HTTP 5xx, network timeout, or connection refused
     *
     * Recommended targets: "/api/auth/status", "/api/session/validate",
     *   or any lightweight endpoint that requires a valid session.
     */
    async probeAuth(endpoint: string): Promise<ApiSignal> {
        const signal = await this._probe(endpoint, (status, latencyMs) => {
            if (status === 401 || status === 403) {
                return this._make(
                    "authFailureDetected",
                    endpoint,
                    status,
                    latencyMs,
                    `Session rejected with HTTP ${status}`
                );
            }
            if (status >= 500 || status === 0) {
                return this._make(
                    "backendUnavailable",
                    endpoint,
                    status,
                    latencyMs
                );
            }
            if (latencyMs > this.opts.latencySpikeThresholdMs) {
                return this._make(
                    "apiLatencySpike",
                    endpoint,
                    status,
                    latencyMs
                );
            }
            return this._make("apiStable", endpoint, status, latencyMs);
        });
        this._collect(signal);
        return signal;
    }

    /**
     * Probe an entity GET endpoint to verify a UI-created record was persisted.
     *
     * Emits:
     *   apiStable          — entity found in API response
     *   persistenceMismatch — HTTP 404 or expected field/value not in response
     *   apiLatencySpike    — entity found but response was slow
     *   backendUnavailable — HTTP 5xx or timeout
     *
     * Recommended use: call AFTER a UI create/submit action to confirm the
     * record exists at the API layer before the test asserts UI feedback.
     *
     * @param endpoint      API endpoint to query (relative path + query params).
     *                      E.g. "/api/invoices?invoiceNumber=INV-042"
     * @param fieldName     JSON field name to search for in the response.
     * @param expectedValue Expected value of that field. Matched as JSON string.
     */
    async probePersistence(
        endpoint: string,
        fieldName: string,
        expectedValue: string
    ): Promise<ApiSignal> {
        const signal = await this._probe(
            endpoint,
            (status, latencyMs, body) => {
                if (status >= 500 || status === 0) {
                    return this._make(
                        "backendUnavailable",
                        endpoint,
                        status,
                        latencyMs
                    );
                }
                if (
                    status === 404 ||
                    !this._bodyContains(body, fieldName, expectedValue)
                ) {
                    return this._make(
                        "persistenceMismatch",
                        endpoint,
                        status,
                        latencyMs,
                        `Expected ${fieldName}=${expectedValue} not found in response`
                    );
                }
                if (latencyMs > this.opts.latencySpikeThresholdMs) {
                    return this._make(
                        "apiLatencySpike",
                        endpoint,
                        status,
                        latencyMs
                    );
                }
                return this._make("apiStable", endpoint, status, latencyMs);
            }
        );
        this._collect(signal);
        return signal;
    }

    /**
     * Probe a general endpoint for availability and latency.
     * Use for environment health checks, backend status pages, or any
     * endpoint where only availability and response time matter.
     *
     * Emits:
     *   apiStable          — available within latency threshold
     *   apiLatencySpike    — available but slow
     *   backendUnavailable — HTTP 5xx or timeout
     */
    async probeEndpoint(endpoint: string): Promise<ApiSignal> {
        const signal = await this._probe(endpoint, (status, latencyMs) => {
            if (status >= 500 || status === 0) {
                return this._make(
                    "backendUnavailable",
                    endpoint,
                    status,
                    latencyMs
                );
            }
            if (latencyMs > this.opts.latencySpikeThresholdMs) {
                return this._make(
                    "apiLatencySpike",
                    endpoint,
                    status,
                    latencyMs
                );
            }
            return this._make("apiStable", endpoint, status, latencyMs);
        });
        this._collect(signal);
        return signal;
    }

    /**
     * Probe an endpoint and assert that the response body matches an expected
     * structure. Use when a UI operation should return specific field values
     * (e.g. amount, status, reference) to catch silent data corruption.
     *
     * Emits:
     *   apiStable               — response matches all expected fields
     *   inconsistentApiResponse — response received but field values mismatched
     *   backendUnavailable      — HTTP 5xx or timeout
     */
    async probeResponseConsistency(
        endpoint: string,
        expectedFields: Record<string, string>
    ): Promise<ApiSignal> {
        const signal = await this._probe(
            endpoint,
            (status, latencyMs, body) => {
                if (status >= 500 || status === 0) {
                    return this._make(
                        "backendUnavailable",
                        endpoint,
                        status,
                        latencyMs
                    );
                }
                const mismatchedField = Object.entries(expectedFields).find(
                    ([field, value]) => !this._bodyContains(body, field, value)
                );
                if (mismatchedField) {
                    const [field, value] = mismatchedField;
                    return this._make(
                        "inconsistentApiResponse",
                        endpoint,
                        status,
                        latencyMs,
                        `Field ${field} did not match expected value ${value}`
                    );
                }
                if (latencyMs > this.opts.latencySpikeThresholdMs) {
                    return this._make(
                        "apiLatencySpike",
                        endpoint,
                        status,
                        latencyMs
                    );
                }
                return this._make("apiStable", endpoint, status, latencyMs);
            }
        );
        this._collect(signal);
        return signal;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Signal access
    // ─────────────────────────────────────────────────────────────────────────

    /** Returns all collected signals as a read-only snapshot. */
    getSignals(): readonly ApiSignal[] {
        return [...this.signals];
    }

    /**
     * Attach all collected signals to the Playwright test report as JSON.
     *
     * The attachment is named "api-signals" so the playwrightAdapter can
     * locate and extract it when building TestResult.apiSignals.
     *
     * Call at the end of each test, or in a fixture afterEach hook.
     * Skips silently if no signals were collected.
     */
    async flush(): Promise<void> {
        if (this.signals.length === 0) return;
        await this.testInfo.attach(API_SIGNALS_ATTACHMENT_NAME, {
            contentType: "application/json",
            body: Buffer.from(JSON.stringify(this.signals))
        });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Private helpers
    // ─────────────────────────────────────────────────────────────────────────

    private async _probe(
        endpoint: string,
        classify: (
            status: number,
            latencyMs: number,
            body?: unknown
        ) => ApiSignal
    ): Promise<ApiSignal> {
        const start = Date.now();
        try {
            const response = await this.request.get(endpoint, {
                timeout: this.opts.timeoutMs
            });
            const latencyMs = Date.now() - start;

            let body: unknown;
            try {
                body = await response.json();
            } catch {
                // Non-JSON response — body remains undefined; probes that need
                // body matching will treat this as a mismatch
            }

            return classify(response.status(), latencyMs, body);
        } catch (err: unknown) {
            const latencyMs = Date.now() - start;
            const note =
                err instanceof Error
                    ? err.message
                          .slice(0, 80)
                          .replace(/https?:\/\/\S+/g, "[url]")
                    : "Network error";
            return this._make(
                "backendUnavailable",
                endpoint,
                0,
                latencyMs,
                note
            );
        }
    }

    private _make(
        signal: ApiSignalType,
        endpoint: string,
        httpStatus: number,
        latencyMs: number,
        note?: string
    ): ApiSignal {
        return {
            signal,
            endpoint,
            ...(httpStatus > 0 ? { httpStatus } : {}),
            latencyMs,
            ...(note ? { note } : {})
        };
    }

    private _bodyContains(
        body: unknown,
        fieldName: string,
        expectedValue: string
    ): boolean {
        if (body === null || body === undefined) return false;
        try {
            const str = JSON.stringify(body);
            // Search for the field-value pair in serialized JSON (handles nested objects)
            return (
                str.includes(`"${fieldName}":`) &&
                str.includes(JSON.stringify(expectedValue))
            );
        } catch {
            return false;
        }
    }

    private _collect(signal: ApiSignal): void {
        this.signals.push(signal);
        if (this.opts.verbose) {
            const latency =
                signal.latencyMs != null ? `${signal.latencyMs}ms` : "—";
            const status =
                signal.httpStatus != null ? ` HTTP ${signal.httpStatus}` : "";
            console.log(
                `[ApiSignalCollector] ${signal.signal}${status} — ${signal.endpoint} — ${latency}`
            );
        }
    }
}
