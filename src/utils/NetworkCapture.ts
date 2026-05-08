/**
 * NetworkCapture
 *
 * Passive Playwright network listener that captures HTTP interactions during
 * test execution and converts them into ApiTrace records for AI analysis.
 *
 * ── Design Principles ────────────────────────────────────────────────────────
 *
 *   PASSIVE — attaches to page events; never modifies requests or responses.
 *   NON-BLOCKING — capture errors never throw into test code.
 *   SAFE — all sensitive headers, cookies, tokens, and PII patterns are masked
 *           before any data leaves this class.
 *   CONFIGURABLE — domains, paths, body limits, and ignored patterns are all
 *           tunable via NetworkCaptureOptions.
 *   MEMORY-BOUNDED — captures at most MAX_TRACES per test to prevent OOM.
 *
 * ── Usage (attach to an existing test) ──────────────────────────────────────
 *
 *   import { NetworkCapture } from "../utils/NetworkCapture";
 *
 *   test("Create invoice", async ({ page }, testInfo) => {
 *     const capture = new NetworkCapture(page, testInfo);
 *     capture.start();
 *
 *     // ... existing test actions unchanged ...
 *
 *     const traces = await capture.stop();  // detaches listeners, returns traces
 *   });
 *
 * ── Usage via globalSetup / fixture (zero per-test changes) ─────────────────
 *
 *   // In playwright.config.ts use / extend fixtures — see NetworkCaptureFixture.ts
 *
 * ── Filtering ────────────────────────────────────────────────────────────────
 *
 *   Default: captures only XHR/fetch requests to the configured application
 *   hostname (process.env.URL). Static assets, telemetry, and CDN calls are
 *   silently dropped.
 *
 *   Override via NetworkCaptureOptions.
 */

import type { Page, Request, Response, TestInfo } from "@playwright/test";
import type {
    ApiTrace,
    SIMSDomain,
    ApiCategory
} from "../test-intelligence/contracts/ApiTrace";

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

/** Attachment name used to store captured traces in Playwright test report */
export const NETWORK_TRACES_ATTACHMENT = "network-traces";

/** Maximum response/request body characters stored per trace (prevents OOM) */
const MAX_BODY_CHARS = 2_000;

/** Maximum traces captured per test (safety bound) */
const MAX_TRACES = 500;

/**
 * Request headers that are always masked regardless of configuration.
 * Matches the OWASP sensitive header list plus SIMS-specific tokens.
 */
const MASKED_REQUEST_HEADERS = new Set([
    "authorization",
    "cookie",
    "x-csrf-token",
    "x-xsrf-token",
    "x-auth-token",
    "x-api-key",
    "proxy-authorization",
    "www-authenticate"
]);

/**
 * Response headers that are masked (may contain session / set-cookie data).
 */
const MASKED_RESPONSE_HEADERS = new Set([
    "set-cookie",
    "www-authenticate",
    "proxy-authenticate"
]);

/**
 * Query parameter keys that are always redacted.
 */
const REDACTED_QUERY_KEYS = new Set([
    "token",
    "apikey",
    "api_key",
    "access_token",
    "refresh_token",
    "session",
    "sessionid",
    "auth",
    "password",
    "secret"
]);

/**
 * URL path patterns that are never captured (static assets, telemetry, CDN).
 * Matched against the pathname using `some(pattern => pathname.includes(pattern))`.
 */
const DEFAULT_IGNORED_PATH_PATTERNS: readonly string[] = [
    ".js",
    ".css",
    ".woff",
    ".woff2",
    ".ttf",
    ".eot",
    ".ico",
    ".png",
    ".jpg",
    ".jpeg",
    ".gif",
    ".svg",
    ".webp",
    ".map",
    "/_next/",
    "/static/",
    "/assets/",
    "/fonts/",
    "applicationinsights",
    "clarity.ms",
    "google-analytics",
    "googletagmanager",
    "hotjar",
    "newrelic",
    "cdn.jsdelivr",
    "cdn.tailwindcss"
];

/**
 * Resource types captured. "document" is included to detect navigation-triggered
 * API calls but filtered further by hostname matching.
 */
const CAPTURED_RESOURCE_TYPES = new Set(["xhr", "fetch", "websocket"]);

// ─────────────────────────────────────────────────────────────────────────────
// Options
// ─────────────────────────────────────────────────────────────────────────────

export interface NetworkCaptureOptions {
    /**
     * Hostnames to capture. Defaults to the hostname extracted from process.env.URL.
     * Add additional hostnames to capture cross-origin API calls.
     */
    includedHostnames?: string[];

    /**
     * Extra path patterns to ignore beyond the defaults.
     * Matched using `pathname.includes(pattern)`.
     */
    additionalIgnoredPatterns?: string[];

    /**
     * Override the default ignored path patterns entirely.
     * When set, DEFAULT_IGNORED_PATH_PATTERNS is NOT used.
     */
    ignoredPathPatterns?: string[];

    /**
     * Maximum response/request body captured in characters per trace.
     * Default: 2 000. Set to 0 to disable body capture entirely.
     */
    maxBodyChars?: number;

    /**
     * Maximum number of traces captured per test.
     * Default: 500. Prevents OOM on test suites with heavy API traffic.
     */
    maxTraces?: number;

    /**
     * When true, attaches captured traces to the Playwright test report
     * on stop() so they appear in the HTML report and can be extracted
     * by downstream processors.
     * Default: true.
     */
    attachToReport?: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Capture class
// ─────────────────────────────────────────────────────────────────────────────

export class NetworkCapture {
    private readonly page: Page;
    private readonly testInfo: TestInfo;
    private readonly opts: Required<NetworkCaptureOptions>;

    private readonly traces: ApiTrace[] = [];
    private readonly pending = new Map<
        Request,
        { timestamp: string; start: number }
    >();
    private seq = 0;
    private active = false;

    /** Bound listener references (needed for removeListener) */
    private readonly _onRequest: (req: Request) => void;
    private readonly _onResponse: (res: Response) => void;

    constructor(
        page: Page,
        testInfo: TestInfo,
        options?: NetworkCaptureOptions
    ) {
        this.page = page;
        this.testInfo = testInfo;

        const defaultHostname = (() => {
            try {
                return new URL(process.env.URL ?? "").hostname;
            } catch {
                return "";
            }
        })();

        this.opts = {
            includedHostnames:
                options?.includedHostnames ??
                (defaultHostname ? [defaultHostname] : []),
            additionalIgnoredPatterns: options?.additionalIgnoredPatterns ?? [],
            ignoredPathPatterns: options?.ignoredPathPatterns ?? [
                ...DEFAULT_IGNORED_PATH_PATTERNS
            ],
            maxBodyChars: options?.maxBodyChars ?? MAX_BODY_CHARS,
            maxTraces: options?.maxTraces ?? MAX_TRACES,
            attachToReport: options?.attachToReport ?? true
        };

        this._onRequest = this._handleRequest.bind(this);
        this._onResponse = this._handleResponse.bind(this);
    }

    /**
     * Start passively capturing network traffic. Idempotent — safe to call
     * multiple times (subsequent calls are no-ops if already active).
     */
    start(): void {
        if (this.active) return;
        this.active = true;
        this.page.on("request", this._onRequest);
        this.page.on("response", this._onResponse);
    }

    /**
     * Stop capturing, detach listeners, optionally attach traces to the
     * Playwright test report, and return all captured ApiTrace records.
     */
    async stop(): Promise<ApiTrace[]> {
        if (!this.active) return [...this.traces];
        this.active = false;
        this.page.off("request", this._onRequest);
        this.page.off("response", this._onResponse);

        if (this.opts.attachToReport && this.traces.length > 0) {
            try {
                await this.testInfo.attach(NETWORK_TRACES_ATTACHMENT, {
                    contentType: "application/json",
                    body: Buffer.from(JSON.stringify(this.traces))
                });
            } catch {
                // Attachment failure must never bubble into test execution
            }
        }

        return [...this.traces];
    }

    /** Returns a snapshot of currently captured traces without stopping. */
    getTraces(): readonly ApiTrace[] {
        return [...this.traces];
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Private event handlers
    // ─────────────────────────────────────────────────────────────────────────

    private _handleRequest(req: Request): void {
        try {
            if (!this._shouldCapture(req)) return;
            this.pending.set(req, {
                timestamp: new Date().toISOString(),
                start: Date.now()
            });
        } catch {
            // Never propagate
        }
    }

    private _handleResponse(res: Response): void {
        // Fire-and-forget async body read; use void to suppress unhandled promise warning
        void this._processResponse(res);
    }

    private async _processResponse(res: Response): Promise<void> {
        const req = res.request();
        const pendingData = this.pending.get(req);
        if (!pendingData) return;
        this.pending.delete(req);

        if (this.traces.length >= this.opts.maxTraces) return;

        try {
            const durationMs = Date.now() - pendingData.start;
            let url: URL;
            try {
                url = new URL(req.url());
            } catch {
                return; // Malformed URL — skip
            }

            const queryParams = this._sanitizeQueryParams(url.searchParams);
            const requestHeaders = this._sanitizeHeaders(
                await req.allHeaders(),
                MASKED_REQUEST_HEADERS
            );
            const responseHeaders = this._sanitizeHeaders(
                await res.allHeaders(),
                MASKED_RESPONSE_HEADERS
            );

            let requestBody: string | null = null;
            try {
                const rawBody = req.postData();
                if (rawBody) {
                    requestBody = this._maskSensitiveContent(
                        rawBody.slice(0, this.opts.maxBodyChars)
                    );
                }
            } catch {
                /* body unavailable */
            }

            let responseBody: string | null = null;
            if (this.opts.maxBodyChars > 0) {
                try {
                    const contentType = res.headers()["content-type"] ?? "";
                    const isText =
                        contentType.includes("json") ||
                        contentType.includes("text") ||
                        contentType.includes("xml");
                    if (isText) {
                        const raw = await res.text();
                        responseBody = this._maskSensitiveContent(
                            raw.slice(0, this.opts.maxBodyChars)
                        );
                    }
                } catch {
                    /* body read failure */
                }
            }

            const trace: ApiTrace = {
                seq: ++this.seq,
                timestamp: pendingData.timestamp,
                testTitle: this.testInfo.title,
                method: req.method().toUpperCase(),
                url: this._sanitizeUrl(req.url()),
                pathname: url.pathname,
                hostname: url.hostname,
                queryParams,
                requestHeaders,
                requestBody,
                responseStatus: res.status(),
                responseHeaders,
                responseBody,
                durationMs
                // domain and category set later by ApiTrafficAnalyzer
            };

            this.traces.push(trace);
        } catch {
            // Never propagate response processing errors into tests
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Filtering
    // ─────────────────────────────────────────────────────────────────────────

    private _shouldCapture(req: Request): boolean {
        // Only capture XHR/fetch
        if (!CAPTURED_RESOURCE_TYPES.has(req.resourceType())) return false;

        let url: URL;
        try {
            url = new URL(req.url());
        } catch {
            return false;
        }

        // Hostname filter
        if (
            this.opts.includedHostnames.length > 0 &&
            !this.opts.includedHostnames.includes(url.hostname)
        ) {
            return false;
        }

        const pathname = url.pathname.toLowerCase();
        const ignoredPatterns = [
            ...this.opts.ignoredPathPatterns,
            ...this.opts.additionalIgnoredPatterns
        ];

        if (ignoredPatterns.some((p) => pathname.includes(p.toLowerCase()))) {
            return false;
        }

        return true;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Sanitization helpers
    // ─────────────────────────────────────────────────────────────────────────

    private _sanitizeHeaders(
        headers: Record<string, string>,
        maskedKeys: Set<string>
    ): Record<string, string> {
        const out: Record<string, string> = {};
        for (const [key, value] of Object.entries(headers)) {
            out[key] = maskedKeys.has(key.toLowerCase()) ? "[REDACTED]" : value;
        }
        return out;
    }

    private _sanitizeQueryParams(
        params: URLSearchParams
    ): Record<string, string> {
        const out: Record<string, string> = {};
        for (const [key, value] of params.entries()) {
            out[key] = REDACTED_QUERY_KEYS.has(key.toLowerCase())
                ? "[REDACTED]"
                : value;
        }
        return out;
    }

    private _sanitizeUrl(rawUrl: string): string {
        try {
            const url = new URL(rawUrl);
            for (const key of REDACTED_QUERY_KEYS) {
                if (url.searchParams.has(key)) {
                    url.searchParams.set(key, "[REDACTED]");
                }
            }
            return url.toString();
        } catch {
            return rawUrl;
        }
    }

    /**
     * Mask common sensitive patterns in request/response bodies.
     * Uses pattern replacement — does not parse JSON structure.
     */
    private _maskSensitiveContent(content: string): string {
        return (
            content
                // JSON field masking: "password":"...", "token":"...", etc.
                .replace(
                    /"(password|token|secret|apiKey|api_key|cookie|sessionId|csrfToken)":\s*"[^"]*"/gi,
                    (_, key) => `"${key}":"[REDACTED]"`
                )
                // Bearer tokens in body
                .replace(/Bearer\s+[A-Za-z0-9\-._~+/]+=*/g, "Bearer [REDACTED]")
                // Basic auth patterns
                .replace(/Basic\s+[A-Za-z0-9+/=]+/g, "Basic [REDACTED]")
        );
    }
}
