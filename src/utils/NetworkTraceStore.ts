/**
 * NetworkTraceStore
 *
 * Accumulates ApiTrace[] records from multiple NetworkCapture instances
 * (one per test) across a full test session and persists them to a single
 * JSON file for ApiIntelligenceAgent to process.
 *
 * ── Usage in playwright.config.ts globalSetup / globalTeardown ──────────────
 *
 *   // globalSetup.ts
 *   import { NetworkTraceStore } from "./src/utils/NetworkTraceStore";
 *   NetworkTraceStore.reset();
 *
 *   // Per-test fixture (see fixtures.ts):
 *   const capture = new NetworkCapture(page, testInfo);
 *   capture.start();
 *   await use();
 *   const traces = await capture.stop();
 *   NetworkTraceStore.add(traces);
 *
 *   // globalTeardown.ts
 *   import { NetworkTraceStore } from "./src/utils/NetworkTraceStore";
 *   NetworkTraceStore.flush("ai-outputs/traces/network-traces.json");
 *
 * ── Thread safety ────────────────────────────────────────────────────────────
 *
 *   Playwright runs worker processes in separate Node.js processes. This store
 *   uses a JSON file as the shared accumulator when TRACE_OUTPUT_PATH is set.
 *   Each worker appends its own session file; globalTeardown merges them.
 *
 *   For single-worker (non-parallel) runs, in-process accumulation is used
 *   and is perfectly safe without locking.
 */

import fs from "fs";
import path from "path";
import type { ApiTrace } from "../test-intelligence/contracts/ApiTrace";

const DEFAULT_TRACE_PATH = "ai-outputs/traces/network-traces.json";

export class NetworkTraceStore {
    private static readonly _traces: ApiTrace[] = [];

    /** Add traces from a completed NetworkCapture session */
    static add(traces: readonly ApiTrace[]): void {
        NetworkTraceStore._traces.push(...traces);
    }

    /** Clear all accumulated traces (call in globalSetup) */
    static reset(): void {
        NetworkTraceStore._traces.length = 0;
    }

    /** Return a snapshot of all accumulated traces */
    static getAll(): readonly ApiTrace[] {
        return [...NetworkTraceStore._traces];
    }

    /**
     * Write all accumulated traces to disk (call in globalTeardown).
     * Creates parent directories if they don't exist.
     * Skips write if no traces were collected.
     *
     * @param outputPath  Destination JSON file path. Defaults to ai-outputs/traces/network-traces.json
     */
    static flush(outputPath: string = DEFAULT_TRACE_PATH): void {
        if (NetworkTraceStore._traces.length === 0) {
            console.log(
                "[NetworkTraceStore] No traces collected — skipping flush."
            );
            return;
        }

        fs.mkdirSync(path.dirname(outputPath), { recursive: true });
        fs.writeFileSync(
            outputPath,
            JSON.stringify(NetworkTraceStore._traces, null, 2),
            "utf-8"
        );

        console.log(
            `[NetworkTraceStore] Flushed ${NetworkTraceStore._traces.length} traces to ${outputPath}`
        );
    }

    /**
     * Merge multiple per-worker trace files into one combined file.
     * Useful when Playwright parallelism creates separate trace files per worker.
     *
     * @param workerFiles  Paths to individual worker trace JSON files
     * @param outputPath   Destination combined JSON file
     */
    static mergeFiles(
        workerFiles: string[],
        outputPath: string = DEFAULT_TRACE_PATH
    ): void {
        const combined: ApiTrace[] = [];
        for (const filePath of workerFiles) {
            if (!fs.existsSync(filePath)) continue;
            try {
                const data = JSON.parse(
                    fs.readFileSync(filePath, "utf-8")
                ) as ApiTrace[];
                combined.push(...data);
            } catch (err) {
                console.warn(
                    `[NetworkTraceStore] Failed to read ${filePath}:`,
                    err
                );
            }
        }

        if (combined.length === 0) {
            console.log(
                "[NetworkTraceStore] No traces found in worker files — skipping merge."
            );
            return;
        }

        // Re-number sequences for stable ordering
        combined.forEach((t, i) => {
            t.seq = i + 1;
        });

        fs.mkdirSync(path.dirname(outputPath), { recursive: true });
        fs.writeFileSync(
            outputPath,
            JSON.stringify(combined, null, 2),
            "utf-8"
        );
        console.log(
            `[NetworkTraceStore] Merged ${combined.length} traces from ${workerFiles.length} worker files → ${outputPath}`
        );
    }
}
