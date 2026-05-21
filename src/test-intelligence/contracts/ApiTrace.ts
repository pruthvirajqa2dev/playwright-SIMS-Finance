/**
 * ApiTrace
 *
 * Framework-agnostic contract for a single captured HTTP interaction observed
 * during a Playwright test execution.
 *
 * Captured passively via NetworkCapture (page event listeners) — no test
 * code modification required. All sensitive values are masked before storage.
 *
 * This is the raw unit of API intelligence data. ApiTrafficAnalyzer aggregates
 * multiple traces into EndpointProfile and WorkflowSequence structures, which
 * the ApiIntelligenceAgent then reasons about.
 */

// ─────────────────────────────────────────────────────────────────────────────
// Core captured interaction
// ─────────────────────────────────────────────────────────────────────────────

export interface ApiTrace {
    /** Monotonically increasing sequence number within a test run */
    seq: number;

    /** UTC ISO-8601 timestamp when the request was initiated */
    timestamp: string;

    /** Test title this trace was captured within */
    testTitle: string;

    /** HTTP method: GET, POST, PUT, PATCH, DELETE, etc. */
    method: string;

    /**
     * Fully-qualified URL with sensitive query params redacted.
     * E.g. "https://sims.example.com/api/invoices?year=2026&school=001"
     */
    url: string;

    /** URL path only, without hostname or query string. E.g. "/api/invoices" */
    pathname: string;

    /** Hostname. E.g. "sims.example.com" */
    hostname: string;

    /** Parsed query parameters (sensitive keys masked to "[REDACTED]") */
    queryParams: Record<string, string>;

    /** Sanitized request headers (auth/cookie/token headers masked) */
    requestHeaders: Record<string, string>;

    /** Request body as a string, truncated to MAX_BODY_CHARS, or null if no body */
    requestBody: string | null;

    /** HTTP response status code */
    responseStatus: number;

    /** Sanitized response headers */
    responseHeaders: Record<string, string>;

    /**
     * Response body as a string, truncated to MAX_BODY_CHARS.
     * Null when the response was binary, empty, or body capture was disabled.
     */
    responseBody: string | null;

    /** Round-trip duration in milliseconds (request start → response end) */
    durationMs: number;

    /**
     * SIMS Finance business domain inferred by ApiTrafficAnalyzer.
     * Set during analysis phase, not capture phase.
     */
    domain?: SIMSDomain;

    /**
     * Functional category inferred by ApiTrafficAnalyzer.
     * Set during analysis phase, not capture phase.
     */
    category?: ApiCategory;
}

// ─────────────────────────────────────────────────────────────────────────────
// SIMS Finance business domain taxonomy
// ─────────────────────────────────────────────────────────────────────────────

export type SIMSDomain =
    | "AccountsPayable" // invoice processing, payment runs, creditors
    | "PurchaseLedger" // purchase orders, supplier invoices, GRN
    | "SalesLedger" // debtor invoices, receipts, statements
    | "Requisitioning" // requisitions, supplies catalogue, approvals
    | "VATHandling" // VAT returns, tax codes, reclaim
    | "FinancialPeriods" // year-end, period open/close, financial years
    | "SupplierWorkflow" // supplier master, bank details, approval chains
    | "BudgetManagement" // budget virements, cost centres, budget monitoring
    | "Reporting" // Crystal Reports, XQuery, nominal reports
    | "Authentication" // login, session, roles, permissions
    | "FileOperations" // upload, download, PDF, attachments
    | "EmailDistribution" // email report dispatch, notifications
    | "ReferenceData" // nominal codes, cost centres, financial periods
    | "SystemAdmin" // configuration, audit, system settings
    | "Unknown"; // unclassified — requires manual review

// ─────────────────────────────────────────────────────────────────────────────
// Functional API category
// ─────────────────────────────────────────────────────────────────────────────

export type ApiCategory =
    | "DataFetch" // GET — reading lists or single entities
    | "DataMutation" // POST/PUT/PATCH/DELETE — writes
    | "Validation" // validation calls (usually POST returning errors/warnings)
    | "Authentication" // auth/session/token endpoints
    | "FileTransfer" // uploads and downloads
    | "Navigation" // page-load HTML/SPA routing requests
    | "Telemetry" // analytics, health-check, monitoring pings
    | "StaticAsset" // images, fonts, CSS, JS bundles
    | "Unknown";

// ─────────────────────────────────────────────────────────────────────────────
// Aggregated endpoint profile (built by ApiTrafficAnalyzer)
// ─────────────────────────────────────────────────────────────────────────────

export interface EndpointProfile {
    /** Normalized pathname (path params replaced with {param}) */
    normalizedPath: string;

    method: string;
    domain: SIMSDomain;
    category: ApiCategory;

    /** Total number of times this endpoint was called across all captured traces */
    callCount: number;

    /** Number of distinct tests that called this endpoint */
    testCount: number;

    /** Status codes observed and their frequencies */
    statusCodes: Record<number, number>;

    /** Number of responses with status >= 400 */
    errorCount: number;

    /** Latency statistics in ms */
    latency: {
        min: number;
        max: number;
        avg: number;
        p95: number;
    };

    /**
     * Whether this endpoint is called repeatedly within a single test
     * (callCount / testCount > REPEATED_CALL_THRESHOLD).
     * Repeated calls may indicate polling, missing cache, or N+1 patterns.
     */
    isRepeatedCall: boolean;

    /** Example request body (sanitized, truncated). Null if no body captured. */
    sampleRequestBody: string | null;

    /** Example response body (sanitized, truncated). Null if no body captured. */
    sampleResponseBody: string | null;

    /** Unique query parameter keys observed across all calls */
    observedQueryParams: string[];

    /** Timestamps of first and last observed call */
    firstSeen: string;
    lastSeen: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Workflow sequence (built by ApiTrafficAnalyzer)
// ─────────────────────────────────────────────────────────────────────────────

export interface WorkflowSequence {
    /** Human-readable name inferred from the sequence (set by AI) */
    name: string;

    /** Test title this sequence was observed in */
    testTitle: string;

    /** Ordered list of API calls in the workflow */
    steps: Array<{
        seq: number;
        method: string;
        normalizedPath: string;
        responseStatus: number;
        durationMs: number;
        domain: SIMSDomain;
    }>;

    /** Total duration of the workflow (first step start → last step end) */
    totalDurationMs: number;

    /** Whether all steps succeeded (all status < 400) */
    allSucceeded: boolean;

    /**
     * AI-inferred description of the business workflow this sequence represents.
     * E.g. "Invoice submission flow: validate → create → send for approval"
     */
    description?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// API intelligence run report (output of ApiIntelligenceAgent)
// ─────────────────────────────────────────────────────────────────────────────

export interface ApiIntelligenceReport {
    /**
     * Set to true when no real network traces have been captured yet
     * (input file was the seed/mock placeholder). The HTML report renders
     * a "no data" activation prompt instead of any data tables.
     * Absent on reports generated from real captured traffic.
     */
    _captureNotRun?: true;

    generatedAt: string;

    /** Source test execution session identifier */
    sessionId: string;

    /** Total HTTP interactions captured */
    totalTraces: number;

    /** Traces retained after filtering (static assets, telemetry excluded) */
    filteredTraces: number;

    /** Number of unique normalized endpoints discovered */
    uniqueEndpoints: number;

    /** All endpoint profiles, sorted by callCount descending */
    endpointProfiles: EndpointProfile[];

    /** Detected workflow sequences */
    workflowSequences: WorkflowSequence[];

    /** Endpoints by SIMS Finance domain */
    byDomain: Record<SIMSDomain, string[]>;

    /** Endpoints with error rate > 0 */
    failedEndpoints: Array<{
        normalizedPath: string;
        method: string;
        errorCount: number;
        statusCodes: Record<number, number>;
    }>;

    /** Endpoints with high repeated-call rate (potential N+1 or polling) */
    repeatedCallEndpoints: Array<{
        normalizedPath: string;
        callCount: number;
        testCount: number;
        avgCallsPerTest: number;
    }>;

    /** Latency outliers: endpoints with p95 > LATENCY_SPIKE_MS */
    latencyOutliers: Array<{
        normalizedPath: string;
        method: string;
        p95Ms: number;
        avgMs: number;
    }>;

    /** AI-generated insights */
    insights: ApiInsight[];

    /** AI-generated executive summary (non-technical, business-readable) */
    executiveSummary: string;

    /** Draft Postman collection (JSON string) — null if not requested */
    postmanCollection: string | null;

    /** Draft OpenAPI paths block (JSON string) — null if not requested */
    openApiPaths: string | null;

    /**
     * When true, this report was loaded from a seed/mock file rather than
     * being generated from real captured network traces.
     * The HTML report renders a "🧪 Mock Data" banner when this is true.
     * Absent (undefined) on all agent-generated reports.
     */
    _isMockData?: true;
}

// ─────────────────────────────────────────────────────────────────────────────
// AI insight (produced by ApiIntelligenceAgent)
// ─────────────────────────────────────────────────────────────────────────────

export interface ApiInsight {
    type:
        | "WorkflowIdentified"
        | "RepeatedCallWarning"
        | "ProtectionDetected"
        | "ValidationChainFound"
        | "PerformanceBottleneck"
        | "UIAPIRelationship"
        | "DependencyMapping"
        | "SecurityObservation"
        | "Other";

    severity: "High" | "Medium" | "Low" | "Info";

    title: string;

    /**
     * Concise description (≤ 3 sentences, hedged language).
     * References specific endpoints, counts, or test titles from the data.
     */
    description: string;

    /** Endpoints involved in this insight */
    endpoints: string[];

    /** Concrete next step for the engineering team */
    recommendation: string;
}
