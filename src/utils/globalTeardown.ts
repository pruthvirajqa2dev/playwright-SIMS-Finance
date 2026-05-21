/**
 * globalTeardown.ts
 *
 * Runs once after all Playwright workers have finished.
 *
 * Responsibilities:
 *   1. Collect per-worker trace shard files written by the networkCapture fixture.
 *   2. Merge and renumber them into the consolidated network-traces.json.
 *   3. Remove the shard files after a successful merge.
 *
 * When ENABLE_NETWORK_CAPTURE is absent or not "true" this is a complete
 * no-op — the existing network-traces.json (real or seed/mock) is untouched.
 *
 * When traces are captured but Azure OpenAI credentials are missing,
 * network-traces.json is still written so that ai:api can be run later once
 * credentials are available.
 */

import fs from "fs";
import path from "path";
import { NetworkTraceStore } from "./NetworkTraceStore";

export default async function globalTeardown(): Promise<void> {
    if (process.env.ENABLE_NETWORK_CAPTURE !== "true") {
        console.log(
            "[globalTeardown] ENABLE_NETWORK_CAPTURE not set — skipping trace merge."
        );
        return;
    }

    const tracesDir = path.join(process.cwd(), "ai-outputs", "traces");
    const outputPath = path.join(tracesDir, "network-traces.json");

    if (!fs.existsSync(tracesDir)) {
        console.log(
            "[globalTeardown] Traces directory not found — no traces to merge."
        );
        return;
    }

    const workerFiles = fs
        .readdirSync(tracesDir)
        .filter((f) => /^worker-\d+\.json$/.test(f))
        .sort() // stable ordering: worker-0.json, worker-1.json, …
        .map((f) => path.join(tracesDir, f));

    if (workerFiles.length === 0) {
        console.log(
            "[globalTeardown] No worker trace shard files found.\n" +
                "  Possible reasons:\n" +
                "    • No tests imported from src/fixtures/test.ts\n" +
                "    • All tests were skipped or failed before capture could run\n" +
                "  The existing network-traces.json is unchanged."
        );
        return;
    }

    console.log(
        `[globalTeardown] Merging ${workerFiles.length} worker trace shard file(s) → ${outputPath}`
    );

    NetworkTraceStore.mergeFiles(workerFiles, outputPath);

    // Clean up shard files after successful merge
    for (const f of workerFiles) {
        try {
            fs.unlinkSync(f);
        } catch {
            // Non-fatal — leave the shard file if deletion fails
        }
    }

    console.log("[globalTeardown] Trace merge complete.");
}
