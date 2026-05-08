/**
 * ApiTrafficAnalyzer
 *
 * Deterministic, pre-AI analysis layer that processes raw ApiTrace records
 * captured by NetworkCapture and produces structured intelligence:
 *
 *   ApiTrace[]  →  ApiTrafficAnalyzer  →  {
 *       endpointProfiles,
 *       workflowSequences,
 *       byDomain,
 *       failedEndpoints,
 *       repeatedCallEndpoints,
 *       latencyOutliers,
 *   }
 *
 * All classification here is deterministic (regex path rules, threshold
 * comparisons). The AI agent receives these pre-computed structures and adds
 * natural-language insight and hypothesis on top.
 *
 * ── Design constraints ───────────────────────────────────────────────────────
 *
 *   - Pure function — no I/O, no AI calls, no Playwright dependencies.
 *   - Idempotent — running twice on the same input produces identical output.
 *   - All classification thresholds defined as named constants here.
 *   - Domain/category classification uses ordered rule arrays —
 *     more specific rules MUST appear before general ones.
 */

import type {
    ApiTrace,
    EndpointProfile,
    WorkflowSequence,
    SIMSDomain,
    ApiCategory
} from "../../contracts/ApiTrace";

// ─────────────────────────────────────────────────────────────────────────────
// Thresholds
// ─────────────────────────────────────────────────────────────────────────────

/** Endpoint called more than this many times per test is flagged as repeated */
const REPEATED_CALL_THRESHOLD = 3;

/** P95 latency above this value (ms) is flagged as a latency outlier */
const LATENCY_OUTLIER_P95_MS = 3_000;

/** Minimum number of API calls in a test to extract a workflow sequence */
const MIN_WORKFLOW_STEPS = 2;

// ─────────────────────────────────────────────────────────────────────────────
// Domain classification rules
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Ordered list of path pattern rules → SIMSDomain.
 * Evaluated top-to-bottom; first match wins.
 * Case-insensitive match against the normalized pathname.
 */
const DOMAIN_RULES: Array<{ patterns: RegExp[]; domain: SIMSDomain }> = [
    {
        patterns: [
            /\/auth\//i,
            /\/login/i,
            /\/logout/i,
            /\/session/i,
            /\/token/i,
            /\/elogin/i
        ],
        domain: "Authentication"
    },
    {
        patterns: [/\/invoice/i, /\/creditor/i, /\/payment.run/i, /\/bacs/i],
        domain: "AccountsPayable"
    },
    {
        patterns: [
            /\/purchase.order/i,
            /\/po\//i,
            /\/grn/i,
            /\/purchase.ledger/i,
            /\/supplier.invoice/i
        ],
        domain: "PurchaseLedger"
    },
    {
        patterns: [
            /\/sales.ledger/i,
            /\/debtor/i,
            /\/receipt/i,
            /\/statement/i
        ],
        domain: "SalesLedger"
    },
    {
        patterns: [/\/requisition/i, /\/supplies/i, /\/catalogue/i, /\/spc/i],
        domain: "Requisitioning"
    },
    {
        patterns: [/\/vat/i, /\/tax.code/i, /\/reclaim/i],
        domain: "VATHandling"
    },
    {
        patterns: [
            /\/financial.year/i,
            /\/period/i,
            /\/year.end/i,
            /\/yearend/i
        ],
        domain: "FinancialPeriods"
    },
    {
        patterns: [/\/supplier/i, /\/vendor/i],
        domain: "SupplierWorkflow"
    },
    {
        patterns: [
            /\/budget/i,
            /\/virement/i,
            /\/cost.centre/i,
            /\/nominal/i,
            /\/nml/i
        ],
        domain: "BudgetManagement"
    },
    {
        patterns: [
            /\/report/i,
            /\/crystal/i,
            /\/xquery/i,
            /\/rss/i,
            /\/export/i
        ],
        domain: "Reporting"
    },
    {
        patterns: [
            /\/upload/i,
            /\/download/i,
            /\/attachment/i,
            /\/file/i,
            /\/pdf/i
        ],
        domain: "FileOperations"
    },
    {
        patterns: [/\/email/i, /\/mail/i, /\/notification/i, /\/distribute/i],
        domain: "EmailDistribution"
    },
    {
        patterns: [/\/reference/i, /\/lookup/i, /\/config/i, /\/setting/i],
        domain: "ReferenceData"
    },
    {
        patterns: [/\/admin/i, /\/audit/i, /\/system/i],
        domain: "SystemAdmin"
    }
];

// ─────────────────────────────────────────────────────────────────────────────
// Category classification rules
// ─────────────────────────────────────────────────────────────────────────────

const CATEGORY_RULES: Array<{
    test: (t: ApiTrace) => boolean;
    category: ApiCategory;
}> = [
    {
        test: (t) =>
            t.method === "GET" &&
            /\/(upload|download|attachment|file|pdf)/i.test(t.pathname),
        category: "FileTransfer"
    },
    {
        test: (t) =>
            ["POST", "PUT"].includes(t.method) &&
            /\/(upload|attachment|file)/i.test(t.pathname),
        category: "FileTransfer"
    },
    {
        test: (t) =>
            /\/(auth|login|logout|session|token|elogin)/i.test(t.pathname),
        category: "Authentication"
    },
    {
        test: (t) =>
            ["POST", "PUT"].includes(t.method) &&
            /\/(validate|check|verify)/i.test(t.pathname),
        category: "Validation"
    },
    {
        test: (t) => t.method === "GET",
        category: "DataFetch"
    },
    {
        test: (t) => ["POST", "PUT", "PATCH", "DELETE"].includes(t.method),
        category: "DataMutation"
    }
];

// ─────────────────────────────────────────────────────────────────────────────
// Path normalization — replaces IDs/GUIDs/dates with {param}
// ─────────────────────────────────────────────────────────────────────────────

function normalizePath(pathname: string): string {
    return (
        pathname
            // UUID
            .replace(
                /\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi,
                "/{uuid}"
            )
            // Numeric segments (IDs, years, codes)
            .replace(/\/\d{4,}/g, "/{id}")
            .replace(/\/\d+/g, "/{id}")
            // Dates embedded in path (YYYY-MM-DD)
            .replace(/\/\d{4}-\d{2}-\d{2}/g, "/{date}")
            // Trailing slash normalization
            .replace(/\/$/, "")
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Classification helpers
// ─────────────────────────────────────────────────────────────────────────────

function classifyDomain(pathname: string): SIMSDomain {
    for (const rule of DOMAIN_RULES) {
        if (rule.patterns.some((p) => p.test(pathname))) return rule.domain;
    }
    return "Unknown";
}

function classifyCategory(trace: ApiTrace): ApiCategory {
    for (const rule of CATEGORY_RULES) {
        if (rule.test(trace)) return rule.category;
    }
    return "Unknown";
}

// ─────────────────────────────────────────────────────────────────────────────
// Latency statistics
// ─────────────────────────────────────────────────────────────────────────────

function computeLatencyStats(values: number[]): EndpointProfile["latency"] {
    if (values.length === 0) return { min: 0, max: 0, avg: 0, p95: 0 };
    const sorted = [...values].sort((a, b) => a - b);
    const p95Index = Math.ceil(sorted.length * 0.95) - 1;
    return {
        min: sorted[0],
        max: sorted[sorted.length - 1],
        avg: Math.round(values.reduce((s, v) => s + v, 0) / values.length),
        p95: sorted[Math.max(0, p95Index)]
    };
}

// ─────────────────────────────────────────────────────────────────────────────
// Public analysis result type
// ─────────────────────────────────────────────────────────────────────────────

export interface TrafficAnalysis {
    enrichedTraces: ApiTrace[];
    endpointProfiles: EndpointProfile[];
    workflowSequences: WorkflowSequence[];
    byDomain: Record<SIMSDomain, string[]>;
    failedEndpoints: Array<{
        normalizedPath: string;
        method: string;
        errorCount: number;
        statusCodes: Record<number, number>;
    }>;
    repeatedCallEndpoints: Array<{
        normalizedPath: string;
        callCount: number;
        testCount: number;
        avgCallsPerTest: number;
    }>;
    latencyOutliers: Array<{
        normalizedPath: string;
        method: string;
        p95Ms: number;
        avgMs: number;
    }>;
    uniqueEndpoints: number;
    filteredTraces: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Main export
// ─────────────────────────────────────────────────────────────────────────────

export class ApiTrafficAnalyzer {
    /**
     * Analyze raw captured traces and produce all pre-AI structured intelligence.
     * This is pure, synchronous, and has no external dependencies.
     */
    static analyze(traces: ApiTrace[]): TrafficAnalysis {
        // ── 1. Enrich traces with domain + category ───────────────────────
        const enriched: ApiTrace[] = traces.map((t) => ({
            ...t,
            domain: classifyDomain(t.pathname),
            category: classifyCategory(t)
        }));

        // ── 2. Build endpoint profiles ────────────────────────────────────
        type ProfileAccumulator = {
            calls: ApiTrace[];
            testTitles: Set<string>;
        };

        const profileMap = new Map<string, ProfileAccumulator>();

        for (const t of enriched) {
            const key = `${t.method}:${normalizePath(t.pathname)}`;
            if (!profileMap.has(key)) {
                profileMap.set(key, { calls: [], testTitles: new Set() });
            }
            const acc = profileMap.get(key)!;
            acc.calls.push(t);
            acc.testTitles.add(t.testTitle);
        }

        const endpointProfiles: EndpointProfile[] = [...profileMap.entries()]
            .map(([key, acc]) => {
                const [method, normalizedPath] = key.split(":", 2) as [
                    string,
                    string
                ];
                const calls = acc.calls;
                const testCount = acc.testTitles.size;
                const callCount = calls.length;

                const statusCodes: Record<number, number> = {};
                for (const c of calls) {
                    statusCodes[c.responseStatus] =
                        (statusCodes[c.responseStatus] ?? 0) + 1;
                }

                const errorCount = calls.filter(
                    (c) => c.responseStatus >= 400
                ).length;
                const latency = computeLatencyStats(
                    calls.map((c) => c.durationMs)
                );
                const isRepeatedCall =
                    callCount / Math.max(testCount, 1) >
                    REPEATED_CALL_THRESHOLD;

                const withBody = calls.find((c) => c.requestBody);
                const withRespBody = calls.find((c) => c.responseBody);
                const queryParamKeys = [
                    ...new Set(calls.flatMap((c) => Object.keys(c.queryParams)))
                ];

                return {
                    normalizedPath,
                    method,
                    domain: calls[0].domain ?? "Unknown",
                    category: calls[0].category ?? "Unknown",
                    callCount,
                    testCount,
                    statusCodes,
                    errorCount,
                    latency,
                    isRepeatedCall,
                    sampleRequestBody: withBody?.requestBody ?? null,
                    sampleResponseBody: withRespBody?.responseBody ?? null,
                    observedQueryParams: queryParamKeys,
                    firstSeen: calls[0].timestamp,
                    lastSeen: calls[calls.length - 1].timestamp
                } satisfies EndpointProfile;
            })
            .sort((a, b) => b.callCount - a.callCount);

        // ── 3. Extract workflow sequences (per test) ──────────────────────
        const byTest = new Map<string, ApiTrace[]>();
        for (const t of enriched) {
            if (!byTest.has(t.testTitle)) byTest.set(t.testTitle, []);
            byTest.get(t.testTitle)!.push(t);
        }

        const workflowSequences: WorkflowSequence[] = [];
        for (const [testTitle, testTraces] of byTest.entries()) {
            // Only API traces (exclude file transfers and auth preamble for workflow)
            const apiTraces = testTraces.filter(
                (t) =>
                    t.category !== "StaticAsset" && t.category !== "Telemetry"
            );
            if (apiTraces.length < MIN_WORKFLOW_STEPS) continue;

            const steps = apiTraces.map((t) => ({
                seq: t.seq,
                method: t.method,
                normalizedPath: normalizePath(t.pathname),
                responseStatus: t.responseStatus,
                durationMs: t.durationMs,
                domain: t.domain ?? ("Unknown" as SIMSDomain)
            }));

            const totalDurationMs = apiTraces.reduce(
                (s, t) => s + t.durationMs,
                0
            );
            const allSucceeded = apiTraces.every((t) => t.responseStatus < 400);

            workflowSequences.push({
                name: "", // set by AI
                testTitle,
                steps,
                totalDurationMs,
                allSucceeded,
                description: "" // set by AI
            });
        }

        // ── 4. byDomain index ─────────────────────────────────────────────
        const allDomains: SIMSDomain[] = [
            "AccountsPayable",
            "PurchaseLedger",
            "SalesLedger",
            "Requisitioning",
            "VATHandling",
            "FinancialPeriods",
            "SupplierWorkflow",
            "BudgetManagement",
            "Reporting",
            "Authentication",
            "FileOperations",
            "EmailDistribution",
            "ReferenceData",
            "SystemAdmin",
            "Unknown"
        ];

        const byDomain = Object.fromEntries(
            allDomains.map((d) => [d, [] as string[]])
        ) as Record<SIMSDomain, string[]>;

        for (const ep of endpointProfiles) {
            byDomain[ep.domain].push(`${ep.method} ${ep.normalizedPath}`);
        }

        // ── 5. Failed endpoints ───────────────────────────────────────────
        const failedEndpoints = endpointProfiles
            .filter((ep) => ep.errorCount > 0)
            .map((ep) => ({
                normalizedPath: ep.normalizedPath,
                method: ep.method,
                errorCount: ep.errorCount,
                statusCodes: ep.statusCodes
            }));

        // ── 6. Repeated call endpoints ────────────────────────────────────
        const repeatedCallEndpoints = endpointProfiles
            .filter((ep) => ep.isRepeatedCall)
            .map((ep) => ({
                normalizedPath: ep.normalizedPath,
                callCount: ep.callCount,
                testCount: ep.testCount,
                avgCallsPerTest: parseFloat(
                    (ep.callCount / Math.max(ep.testCount, 1)).toFixed(1)
                )
            }));

        // ── 7. Latency outliers ───────────────────────────────────────────
        const latencyOutliers = endpointProfiles
            .filter((ep) => ep.latency.p95 > LATENCY_OUTLIER_P95_MS)
            .sort((a, b) => b.latency.p95 - a.latency.p95)
            .map((ep) => ({
                normalizedPath: ep.normalizedPath,
                method: ep.method,
                p95Ms: ep.latency.p95,
                avgMs: ep.latency.avg
            }));

        return {
            enrichedTraces: enriched,
            endpointProfiles,
            workflowSequences,
            byDomain,
            failedEndpoints,
            repeatedCallEndpoints,
            latencyOutliers,
            uniqueEndpoints: endpointProfiles.length,
            filteredTraces: enriched.length
        };
    }
}
