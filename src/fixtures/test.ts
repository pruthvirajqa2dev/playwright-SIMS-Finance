/**
 * test.ts — Extended Playwright test fixture with automatic NetworkCapture.
 *
 * Usage
 * ─────
 * Replace the standard Playwright import in any test file:
 *
 *   // Before
 *   import test, { expect, Page, TestInfo } from "@playwright/test";
 *
 *   // After
 *   import { test, expect } from "../../fixtures/test";
 *   import type { Page, TestInfo } from "@playwright/test";
 *
 * Behaviour
 * ─────────
 * When ENABLE_NETWORK_CAPTURE=true (in src/config/.env or CI env):
 *   • Every test automatically has its HTTP XHR/fetch traffic captured.
 *   • Traces are accumulated per-worker and flushed by the worker-scoped
 *     fixture to ai-outputs/traces/worker-{workerIndex}.json.
 *   • globalTeardown merges all shard files into network-traces.json.
 *   • npm run ai:api then produces ai-outputs/reports/api-intelligence.json.
 *
 * When ENABLE_NETWORK_CAPTURE is absent or not "true":
 *   • The fixture is a transparent pass-through — zero overhead.
 *   • The existing network-traces.json (real or seed) is left untouched.
 *
 * Environment variables (all optional)
 * ─────────────────────────────────────
 *   ENABLE_NETWORK_CAPTURE  "true" activates capture (default: off)
 *   MAX_TRACES_PER_TEST     Max traces stored per test (default: 200)
 *   CAPTURE_HOSTNAMES       Comma-separated extra hostnames beyond process.env.URL
 *                           e.g. "api.example.com,cdn.example.com"
 */

import path from "path";
import { test as base, expect } from "@playwright/test";
import { NetworkCapture } from "../utils/NetworkCapture";
import { NetworkTraceStore } from "../utils/NetworkTraceStore";

// ─────────────────────────────────────────────────────────────────────────────
// Configuration — resolved once at module load
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Lazily evaluated so dotenv load order in Playwright workers never silently
 * disables capture. Each fixture invocation re-reads from process.env.
 */
function isCaptureEnabled(): boolean {
    return process.env.ENABLE_NETWORK_CAPTURE === "true";
}

function getMaxTracesPerTest(): number {
    return Math.max(1, parseInt(process.env.MAX_TRACES_PER_TEST ?? "200", 10));
}

/**
 * Additional hostnames to capture beyond the primary app URL.
 * Useful when tests make cross-origin API calls (e.g. a separate auth service).
 */
function getExtraHostnames(): string[] {
    return (process.env.CAPTURE_HOSTNAMES ?? "")
        .split(",")
        .map((h) => h.trim())
        .filter(Boolean);
}

// ─────────────────────────────────────────────────────────────────────────────
// Extended test object
// ─────────────────────────────────────────────────────────────────────────────

export const test = base.extend<
    { _captureActive: void },
    { _captureWorker: void }
>({
    /**
     * Worker-scoped fixture — auto-use, runs once per worker process.
     *
     * Setup:  Resets the in-process NetworkTraceStore for this worker.
     * Teardown: Flushes accumulated traces to a per-worker shard file
     *           (ai-outputs/traces/worker-{workerIndex}.json).
     *           globalTeardown merges all shard files once all workers finish.
     */
    _captureWorker: [
        async ({}, use, workerInfo) => {
            const captureEnabled = isCaptureEnabled();
            console.log(
                `[NetworkCapture fixture] worker-${workerInfo.workerIndex} | ENABLE_NETWORK_CAPTURE=${process.env.ENABLE_NETWORK_CAPTURE ?? "(not set)"} | capture=${captureEnabled}`
            );
            if (captureEnabled) {
                NetworkTraceStore.reset();
            }
            await use();
            if (captureEnabled) {
                const shardPath = path.join(
                    process.cwd(),
                    "ai-outputs",
                    "traces",
                    `worker-${workerInfo.workerIndex}.json`
                );
                console.log(
                    `[NetworkCapture fixture] worker-${workerInfo.workerIndex} teardown — store size: ${NetworkTraceStore.getAll().length} traces`
                );
                NetworkTraceStore.flush(shardPath);
            }
        },
        { scope: "worker", auto: true }
    ],

    /**
     * Test-scoped fixture — auto-use, runs for every test.
     *
     * Attaches NetworkCapture to the test's page instance. On teardown,
     * adds the collected traces to the worker's NetworkTraceStore.
     * When capture is disabled this is a transparent no-op.
     */
    _captureActive: [
        async ({ page }, use, testInfo) => {
            if (!isCaptureEnabled()) {
                await use();
                return;
            }

            // Resolve included hostnames: primary app URL + any extras
            const primaryHostname = (() => {
                try {
                    return new URL(process.env.URL ?? "").hostname;
                } catch {
                    return "";
                }
            })();

            if (!primaryHostname) {
                console.warn(
                    "[NetworkCapture fixture] process.env.URL is not set or invalid — hostname filter will be empty (all hosts captured)."
                );
            }

            const includedHostnames = [
                ...(primaryHostname ? [primaryHostname] : []),
                ...getExtraHostnames()
            ].filter((h, i, arr) => arr.indexOf(h) === i); // deduplicate

            const capture = new NetworkCapture(page, testInfo, {
                includedHostnames,
                maxTraces: getMaxTracesPerTest(),
                // Disable per-test attachment — traces are persisted via
                // the worker shard file and merged in globalTeardown instead.
                attachToReport: false
            });

            capture.start();
            await use();
            const traces = await capture.stop();
            console.log(
                `[NetworkCapture fixture] "${testInfo.title}" → added ${traces.length} traces to store (store total: ${NetworkTraceStore.getAll().length})`
            );
            NetworkTraceStore.add(traces);
        },
        { auto: true }
    ]
});

export { expect } from "@playwright/test";
export type { Page, TestInfo, BrowserContext, Locator } from "@playwright/test";
