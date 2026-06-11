/**
 * globalSetup.ts
 *
 * Runs once before all Playwright workers start.
 *
 * Responsibilities:
 *   1. Create ai-outputs/traces/ directory if it does not exist.
 *   2. Remove any leftover per-worker trace shard files (worker-{n}.json) from
 *      a previous run so that globalTeardown's merge step starts from a clean slate.
 *
 * The merged output file (network-traces.json) and the seed mock file are
 * intentionally NOT removed here — if ENABLE_NETWORK_CAPTURE is not set, the
 * existing file (real or seed) continues to be used as the data source for
 * ApiIntelligenceAgent.
 */

import fs from "fs";
import path from "path";

export default async function globalSetup(): Promise<void> {
    const tracesDir = path.join(process.cwd(), "ai-outputs", "traces");

    // Ensure directory exists (async, non-blocking)
    await fs.promises.mkdir(tracesDir, { recursive: true });

    // Find stale per-worker shard files — network-traces.json is preserved
    const entries = await fs.promises.readdir(tracesDir);
    const staleFiles = entries.filter((f) => /^worker-\d+\.json$/.test(f));

    if (staleFiles.length === 0) return;

    // Delete all stale files in parallel
    await Promise.all(
        staleFiles.map((f) =>
            fs.promises.unlink(path.join(tracesDir, f)).catch(() => {
                // Non-fatal — file may have been cleaned up already
            })
        )
    );

    console.log(
        `[globalSetup] Removed ${staleFiles.length} stale worker trace shard file(s).`
    );
}
