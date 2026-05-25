/**
 * GitHubReportsClient.ts
 *
 * Fetches Playwright test-results.json files stored on the gh-pages branch
 * under published-reports/{timestamp}/test-results.json.
 *
 * Required environment variables:
 *   GH_REPO_OWNER  — e.g. pruthvirajqa2dev
 *   GH_REPO_NAME   — e.g. playwright-SIMS-Finance
 *
 * Optional:
 *   GITHUB_TOKEN       — Personal Access Token for private repos or higher
 *                        rate limits (5000 req/hr vs 60 req/hr unauthenticated)
 */

import https from "https";
import { execSync } from "child_process";

// ─────────────────────────────────────────────────────────────────────────────
// Types re-exported so agents don't need to import from Playwright directly
// ─────────────────────────────────────────────────────────────────────────────

export interface TestResult {
    status: "passed" | "failed" | "timedOut" | "skipped" | "interrupted";
    duration: number;
    retry: number;
    error?: { message?: string };
}

export interface TestSpec {
    title: string;
    tests: Array<{ results: TestResult[] }>;
}

export interface TestSuite {
    title: string;
    specs: TestSpec[];
    suites?: TestSuite[];
}

export interface PlaywrightRunReport {
    timestamp: string;
    suites: TestSuite[];
    stats: {
        duration: number;
        expected: number;
        unexpected: number;
        flaky: number;
        skipped: number;
    };
}

// ─────────────────────────────────────────────────────────────────────────────
// Per-test outcome extracted from a run report
// ─────────────────────────────────────────────────────────────────────────────

export interface PerTestOutcome {
    testTitle: string;
    /** Final status after all retries */
    finalStatus: "passed" | "failed" | "timedOut" | "skipped" | "flaky";
    retries: number;
    durationMs: number;
    errorMessage?: string;
}

export interface RunOutcome {
    timestamp: string;
    environment: string;
    tests: PerTestOutcome[];
}

// ─────────────────────────────────────────────────────────────────────────────
// HTTP helper (uses built-in https — no extra deps)
// ─────────────────────────────────────────────────────────────────────────────

function httpGet(url: string, token?: string): Promise<string> {
    return new Promise((resolve, reject) => {
        const parsed = new URL(url);
        // Allow disabling TLS verification for corporate SSL-inspection proxies.
        // Set NODE_TLS_REJECT_UNAUTHORIZED=0 in src/config/.env for local use only.
        // Never set this in CI — use NODE_EXTRA_CA_CERTS with the corporate CA bundle instead.
        const rejectUnauthorized =
            process.env.NODE_TLS_REJECT_UNAUTHORIZED !== "0";
        const options: https.RequestOptions = {
            hostname: parsed.hostname,
            path: parsed.pathname + parsed.search,
            rejectUnauthorized,
            headers: {
                "User-Agent": "SIMS-Finance-AI-Agent/1.0",
                Accept: "application/vnd.github.v3.raw",
                ...(token ? { Authorization: `Bearer ${token}` } : {})
            }
        };
        const req = https.get(options, (res) => {
            if (res.statusCode === 404) {
                resolve("");
                return;
            }
            if (res.statusCode && res.statusCode >= 400) {
                reject(new Error(`HTTP ${res.statusCode} for ${url}`));
                return;
            }
            const chunks: Buffer[] = [];
            res.on("data", (c: Buffer) => chunks.push(c));
            res.on("end", () =>
                resolve(Buffer.concat(chunks).toString("utf-8"))
            );
        });
        req.on("error", reject);
        req.setTimeout(15_000, () => {
            req.destroy();
            reject(new Error(`Timeout fetching ${url}`));
        });
    });
}

// ─────────────────────────────────────────────────────────────────────────────
// Client class
// ─────────────────────────────────────────────────────────────────────────────

export class GitHubReportsClient {
    private readonly owner: string;
    private readonly repo: string;
    private readonly token: string | undefined;
    private readonly branch = "gh-pages";

    constructor() {
        this.owner = process.env.GH_REPO_OWNER ?? "";
        this.repo = process.env.GH_REPO_NAME ?? "";
        this.token = process.env.GITHUB_TOKEN;

        if (!this.owner || !this.repo) {
            throw new Error(
                "Set GH_REPO_OWNER and GH_REPO_NAME in your .env file.\n" +
                    "Example: GH_REPO_OWNER=pruthvirajqa2dev"
            );
        }
    }

    /**
     * Fetch the raw test-results.json for a single run timestamp.
     * Tries the local git object store first (origin/gh-pages), then falls back
     * to the GitHub raw CDN. The local path avoids corporate proxy issues entirely.
     * Returns null if the file does not exist on gh-pages.
     */
    async fetchRunReport(
        timestamp: string
    ): Promise<PlaywrightRunReport | null> {
        const gitPath = `published-reports/${timestamp}/test-results.json`;

        // ── 1. Local git fallback (works offline / behind corporate proxies) ──
        try {
            const raw = execSync(`git show origin/${this.branch}:${gitPath}`, {
                encoding: "utf-8",
                stdio: ["pipe", "pipe", "pipe"]
            });
            if (raw) {
                const parsed = JSON.parse(raw);
                parsed.timestamp = timestamp;
                return parsed as PlaywrightRunReport;
            }
        } catch {
            // File not in local git — fall through to HTTP
        }

        // ── 2. HTTP fallback (CI or environments with direct GitHub access) ──
        const url =
            `https://raw.githubusercontent.com/${this.owner}/${this.repo}` +
            `/${this.branch}/${gitPath}`;

        try {
            const raw = await httpGet(url, this.token);
            if (!raw) return null;
            const parsed = JSON.parse(raw);
            parsed.timestamp = timestamp;
            return parsed as PlaywrightRunReport;
        } catch (err: any) {
            console.warn(`  ⚠  Could not fetch ${timestamp}: ${err.message}`);
            return null;
        }
    }

    /**
     * Fetch multiple run reports in sequence (avoids GitHub rate-limit bursts).
     * Only fetches the timestamps supplied — callers filter to interesting runs first.
     */
    async fetchRunReports(
        timestamps: string[],
        { delayMs = 200 } = {}
    ): Promise<PlaywrightRunReport[]> {
        // Refresh local git refs once so `git show origin/gh-pages:...` sees the
        // latest commits even if the working copy hasn't been fetched recently.
        // A failure here is non-fatal — cached refs may still be sufficient.
        try {
            execSync(`git fetch origin ${this.branch} --quiet`, {
                stdio: ["pipe", "pipe", "pipe"]
            });
        } catch {
            // No network or fetch failed — proceed with whatever is cached locally
        }

        const results: PlaywrightRunReport[] = [];

        for (const ts of timestamps) {
            process.stdout.write(`  ↓ Fetching ${ts} ...`);
            const report = await this.fetchRunReport(ts);
            if (report) {
                results.push(report);
                process.stdout.write(" ✓\n");
            } else {
                process.stdout.write(" (not found)\n");
            }
            if (delayMs > 0) await new Promise((r) => setTimeout(r, delayMs));
        }

        return results;
    }

    /**
     * Flatten a full Playwright run report into a simple per-test outcome list.
     * A test is "flaky" if it eventually passed but had at least one failed retry.
     */
    static extractTestOutcomes(
        report: PlaywrightRunReport,
        environment: string = "Unknown"
    ): RunOutcome {
        const tests: PerTestOutcome[] = [];

        function walkSuites(suites: TestSuite[] = []) {
            for (const suite of suites) {
                for (const spec of suite.specs ?? []) {
                    for (const test of spec.tests ?? []) {
                        const results = test.results ?? [];
                        if (results.length === 0) continue;

                        const last = results[results.length - 1];
                        const hadFailedRetry = results
                            .slice(0, -1)
                            .some(
                                (r) =>
                                    r.status === "failed" ||
                                    r.status === "timedOut"
                            );

                        const finalStatus: PerTestOutcome["finalStatus"] =
                            last.status === "passed" && hadFailedRetry
                                ? "flaky"
                                : last.status === "passed"
                                  ? "passed"
                                  : last.status === "failed"
                                    ? "failed"
                                    : last.status === "timedOut"
                                      ? "timedOut"
                                      : last.status === "skipped"
                                        ? "skipped"
                                        : "failed";

                        tests.push({
                            testTitle: spec.title,
                            finalStatus,
                            retries: results.length - 1,
                            durationMs: results.reduce(
                                (s, r) => s + (r.duration ?? 0),
                                0
                            ),
                            errorMessage: last.error?.message?.slice(0, 300)
                        });
                    }
                }
                walkSuites(suite.suites);
            }
        }

        walkSuites(report.suites);

        return { timestamp: report.timestamp, environment, tests };
    }
}
