/**
 * RegressionDeltaAgent.ts
 *
 * Compares per-test reliability BEFORE and AFTER a pivot date to detect
 * regressions introduced by a fix, deployment, or code change.
 *
 * The agent splits consolidated.json into two windows (before / after the
 * pivot date), fetches the per-run test-results.json for both windows via
 * GitHubReportsClient, then sends the per-test delta table to GPT for
 * root-cause hypotheses and risk classification.
 *
 * This directly addresses:
 *   ▸ "Fixes were given but one of the fixes introduced a race condition"
 *   ▸ "Issues repeated on Product" (compare UAT window vs post-deploy window)
 *
 * Required env vars:
 *   GH_REPO_OWNER, GH_REPO_NAME
 *   AZURE_OPENAI_ENDPOINT, AZURE_OPENAI_API_KEY, AZURE_OPENAI_DEPLOYMENT
 *
 * Optional:
 *   PIVOT_DATE      — YYYY-MM-DD fallback when --since is not provided
 *   DEEP_MAX_RUNS   — max runs to fetch per window (default: 10)
 *
 * Usage:
 *   npx ts-node src/ai/agents/RegressionDeltaAgent.ts \
 *     test-results-history/consolidated.json ai-regression-delta-report.json \
 *     --since 2026-04-22
 *   npm run ai:regression -- --since 2026-04-22
 */

import fs from "fs";
import { getAzureOpenAIClient, getDeployment } from "../AzureOpenAIClient";
import { GitHubReportsClient, RunOutcome } from "../utils/GitHubReportsClient";
import { filterByExcludedDays } from "../utils/runFilters";
import type { TestRun } from "../../contracts/TestRun";
import { mapSummaryToTestRun } from "../../adapters/playwrightAdapter";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface WindowProfile {
    testTitle: string;
    totalRuns: number;
    failureCount: number;
    flakyCount: number;
    failureRate: number; // 0–100
    flakyRate: number; // 0–100
    errorSamples: string[];
}

export interface TestDelta {
    testTitle: string;
    beforeFailureRate: number;
    afterFailureRate: number;
    beforeFlakyRate: number;
    afterFlakyRate: number;
    failureDelta: number; // afterFailureRate - beforeFailureRate (+ve = worse)
    flakyDelta: number;
    verdict: "Regressed" | "Improved" | "New Failure" | "Resolved" | "Stable";
    riskLevel: "Critical" | "High" | "Medium" | "Low";
    errorSamplesBefore: string[];
    errorSamplesAfter: string[];
}

export interface RegressionDeltaReport {
    generatedAt: string;
    pivotDate: string;
    beforeWindow: { from: string; to: string; runsAnalysed: number };
    afterWindow: { from: string; to: string; runsAnalysed: number };
    beforeEnvs: string[];
    afterEnvs: string[];
    overallVerdict: "Regressed" | "Improved" | "Neutral";
    regressions: TestDelta[];
    improvements: TestDelta[];
    newFailures: TestDelta[];
    resolvedFailures: TestDelta[];
    actionItems: string[];
    executiveSummary: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Profile building — per-test stats for a window of RunOutcomes
// ─────────────────────────────────────────────────────────────────────────────

function buildWindowProfiles(
    runOutcomes: RunOutcome[]
): Map<string, WindowProfile> {
    const map = new Map<string, WindowProfile>();

    for (const run of runOutcomes) {
        for (const t of run.tests) {
            let p = map.get(t.testTitle);
            if (!p) {
                p = {
                    testTitle: t.testTitle,
                    totalRuns: 0,
                    failureCount: 0,
                    flakyCount: 0,
                    failureRate: 0,
                    flakyRate: 0,
                    errorSamples: []
                };
                map.set(t.testTitle, p);
            }
            p.totalRuns++;
            if (t.finalStatus === "failed" || t.finalStatus === "timedOut") {
                p.failureCount++;
                if (t.errorMessage && p.errorSamples.length < 3) {
                    const snippet = t.errorMessage
                        .slice(0, 120)
                        .replace(/\n/g, " ");
                    if (!p.errorSamples.includes(snippet))
                        p.errorSamples.push(snippet);
                }
            } else if (t.finalStatus === "flaky") {
                p.flakyCount++;
            }
        }
    }

    for (const p of map.values()) {
        p.failureRate =
            p.totalRuns > 0
                ? Math.round((p.failureCount / p.totalRuns) * 100)
                : 0;
        p.flakyRate =
            p.totalRuns > 0
                ? Math.round((p.flakyCount / p.totalRuns) * 100)
                : 0;
    }

    return map;
}

// ─────────────────────────────────────────────────────────────────────────────
// Delta computation — compare before vs after per-test profiles
// ─────────────────────────────────────────────────────────────────────────────

function computeDeltas(
    before: Map<string, WindowProfile>,
    after: Map<string, WindowProfile>
): TestDelta[] {
    const allTitles = new Set([...before.keys(), ...after.keys()]);
    const deltas: TestDelta[] = [];

    for (const title of allTitles) {
        const b = before.get(title);
        const a = after.get(title);

        const bFail = b?.failureRate ?? 0;
        const aFail = a?.failureRate ?? 0;
        const bFlaky = b?.flakyRate ?? 0;
        const aFlaky = a?.flakyRate ?? 0;
        const failureDelta = aFail - bFail;
        const flakyDelta = aFlaky - bFlaky;

        let verdict: TestDelta["verdict"];
        if (!b && a && aFail > 0) verdict = "New Failure";
        else if (b && b.failureRate > 0 && (!a || aFail === 0))
            verdict = "Resolved";
        else if (failureDelta > 5) verdict = "Regressed";
        else if (failureDelta < -5) verdict = "Improved";
        else verdict = "Stable";

        // Race condition signal: was 0% flaky before, now >0% flaky after fix
        // Escalate to "Regressed" even if hard failure rate didn't spike
        if (
            verdict === "Stable" &&
            bFlaky === 0 &&
            aFlaky > 0 &&
            failureDelta >= 0
        ) {
            verdict = "Regressed";
        }

        const riskLevel: TestDelta["riskLevel"] =
            aFail > 50
                ? "Critical"
                : aFail > 20 || (verdict === "Regressed" && failureDelta > 20)
                  ? "High"
                  : aFail > 5 || verdict === "New Failure"
                    ? "Medium"
                    : "Low";

        deltas.push({
            testTitle: title,
            beforeFailureRate: bFail,
            afterFailureRate: aFail,
            beforeFlakyRate: bFlaky,
            afterFlakyRate: aFlaky,
            failureDelta,
            flakyDelta,
            verdict,
            riskLevel,
            errorSamplesBefore: b?.errorSamples ?? [],
            errorSamplesAfter: a?.errorSamples ?? []
        });
    }

    // Sort: worst regressions first
    return deltas.sort(
        (a, b) =>
            b.failureDelta +
            b.flakyDelta * 0.5 -
            (a.failureDelta + a.flakyDelta * 0.5)
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Prompt engineering
// ─────────────────────────────────────────────────────────────────────────────

import { REGRESSION_SYSTEM_PROMPT } from "../prompts/regression.prompt";

const SYSTEM_PROMPT = REGRESSION_SYSTEM_PROMPT;

function buildUserPrompt(
    pivotDate: string,
    beforeWindow: RegressionDeltaReport["beforeWindow"],
    afterWindow: RegressionDeltaReport["afterWindow"],
    deltas: TestDelta[],
    beforeEnvs: string[],
    afterEnvs: string[]
): string {
    const fmtEnvs = (envs: string[]) =>
        envs.length === 0 ? "Unknown" : envs.join(", ");
    const nonStable = deltas.filter((d) => d.verdict !== "Stable");
    const raceConditionCandidates = deltas.filter(
        (d) =>
            d.beforeFlakyRate === 0 &&
            d.afterFlakyRate > 0 &&
            d.afterFailureRate < 30
    );

    const deltaTable = nonStable
        .slice(0, 20)
        .map(
            (d) =>
                `  "${d.testTitle}"
    Verdict: ${d.verdict} | Risk: ${d.riskLevel}
    Failure rate : ${d.beforeFailureRate}% → ${d.afterFailureRate}%  (Δ${d.failureDelta >= 0 ? "+" : ""}${d.failureDelta}%)
    Flaky rate   : ${d.beforeFlakyRate}% → ${d.afterFlakyRate}%
    ${d.errorSamplesAfter.length > 0 ? `Post-pivot errors: ${d.errorSamplesAfter.join(" | ")}` : ""}
    ${d.errorSamplesBefore.length > 0 ? `Pre-pivot errors:  ${d.errorSamplesBefore.join(" | ")}` : ""}`
        )
        .join("\n\n");
    const truncationNote =
        nonStable.length > 20
            ? `\n(showing top 20 of ${nonStable.length} non-stable tests — full list in output JSON)`
            : "";

    const raceSection =
        raceConditionCandidates.length > 0
            ? `── RACE CONDITION CANDIDATES (0% flaky before, now flaky after fix) ──────
${raceConditionCandidates
    .map((d) => `  "${d.testTitle}" — flakyRate 0% → ${d.afterFlakyRate}%`)
    .join("\n")}`
            : "No race condition candidates detected.";

    return `
Regression analysis across pivot date: ${pivotDate}

BEFORE window: ${beforeWindow.from} → ${beforeWindow.to}  (${beforeWindow.runsAnalysed} runs with issues fetched, environments: ${fmtEnvs(beforeEnvs)})
AFTER  window: ${afterWindow.from} → ${afterWindow.to}  (${afterWindow.runsAnalysed} runs with issues fetched, environments: ${fmtEnvs(afterEnvs)})

Summary:
  Regressions / New Failures : ${deltas.filter((d) => d.verdict === "Regressed" || d.verdict === "New Failure").length}
  Improvements / Resolved    : ${deltas.filter((d) => d.verdict === "Improved" || d.verdict === "Resolved").length}
  Stable (no change)         : ${deltas.filter((d) => d.verdict === "Stable").length}

── PER-TEST DELTA TABLE ─────────────────────────────────────────────────────

${deltaTable || "No significant deltas — all tests stable across the pivot date."}${truncationNote}

${raceSection}
`.trim();
}

// ─────────────────────────────────────────────────────────────────────────────
// Main agent function
// ─────────────────────────────────────────────────────────────────────────────

export async function runRegressionDelta(
    consolidatedPath: string,
    pivotDate: string,
    maxRunsPerWindow: number = 10
): Promise<RegressionDeltaReport> {
    const raw: { runs: unknown[] } = JSON.parse(
        fs.readFileSync(consolidatedPath, "utf-8")
    );

    const sorted = [
        ...filterByExcludedDays((raw.runs ?? []).map(mapSummaryToTestRun))
    ].sort((a: TestRun, b: TestRun) => b.timestamp.localeCompare(a.timestamp));

    const beforeRuns = sorted.filter(
        (r) => r.timestamp.split("_")[0] < pivotDate
    );
    const afterRuns = sorted.filter(
        (r) => r.timestamp.split("_")[0] >= pivotDate
    );

    if (beforeRuns.length === 0)
        throw new Error(
            `No runs found BEFORE pivot date ${pivotDate}. Earliest run is ${sorted[sorted.length - 1]?.timestamp?.split("_")[0] ?? "unknown"}.`
        );
    if (afterRuns.length === 0)
        throw new Error(
            `No runs found ON/AFTER pivot date ${pivotDate}. Latest run is ${sorted[0]?.timestamp?.split("_")[0] ?? "unknown"}.`
        );

    const beforeFrom =
        beforeRuns[beforeRuns.length - 1].timestamp.split("_")[0];
    const beforeTo = beforeRuns[0].timestamp.split("_")[0];
    const afterFrom = afterRuns[afterRuns.length - 1].timestamp.split("_")[0];
    const afterTo = afterRuns[0].timestamp.split("_")[0];

    console.log(`\n📅 Pivot date: ${pivotDate}`);
    console.log(
        `   BEFORE: ${beforeRuns.length} runs (${beforeFrom} → ${beforeTo})`
    );
    console.log(
        `   AFTER:  ${afterRuns.length} runs (${afterFrom} → ${afterTo})`
    );

    // Fetch only runs with issues in each window
    const fetchBefore = beforeRuns
        .filter((r) => r.summary.failed > 0 || r.summary.flaky > 0)
        .slice(0, maxRunsPerWindow);
    const fetchAfter = afterRuns
        .filter((r) => r.summary.failed > 0 || r.summary.flaky > 0)
        .slice(0, maxRunsPerWindow);

    const client_gh = new GitHubReportsClient();

    console.log(
        `\n📥 Fetching BEFORE window (${fetchBefore.length} runs with issues)...`
    );
    const beforeReports = await client_gh.fetchRunReports(
        fetchBefore.map((r) => r.timestamp),
        { delayMs: 200 }
    );

    console.log(
        `\n📥 Fetching AFTER window (${fetchAfter.length} runs with issues)...`
    );
    const afterReports = await client_gh.fetchRunReports(
        fetchAfter.map((r) => r.timestamp),
        { delayMs: 200 }
    );

    const beforeOutcomes: RunOutcome[] = beforeReports.map((r) =>
        GitHubReportsClient.extractTestOutcomes(r, "before")
    );
    const afterOutcomes: RunOutcome[] = afterReports.map((r) =>
        GitHubReportsClient.extractTestOutcomes(r, "after")
    );

    const beforeProfiles = buildWindowProfiles(beforeOutcomes);
    const afterProfiles = buildWindowProfiles(afterOutcomes);
    const deltas = computeDeltas(beforeProfiles, afterProfiles);

    const regressions = deltas.filter((d) => d.verdict === "Regressed");
    const improvements = deltas.filter((d) => d.verdict === "Improved");
    const newFailures = deltas.filter((d) => d.verdict === "New Failure");
    const resolvedFailures = deltas.filter((d) => d.verdict === "Resolved");

    const windowBefore = {
        from: beforeFrom,
        to: beforeTo,
        runsAnalysed: beforeReports.length
    };
    const windowAfter = {
        from: afterFrom,
        to: afterTo,
        runsAnalysed: afterReports.length
    };

    // Collect distinct environments from each window
    const beforeEnvs = [
        ...new Set(beforeRuns.map((r) => r.environment ?? "Unknown"))
    ].filter(Boolean);
    const afterEnvs = [
        ...new Set(afterRuns.map((r) => r.environment ?? "Unknown"))
    ].filter(Boolean);

    console.log(
        `\n🤖 Sending ${deltas.length} test deltas to AI for analysis...`
    );

    const ai = getAzureOpenAIClient();
    const deployment = getDeployment();

    const response = await ai.chat.completions.create({
        model: deployment,
        messages: [
            { role: "system", content: SYSTEM_PROMPT },
            {
                role: "user",
                content: buildUserPrompt(
                    pivotDate,
                    windowBefore,
                    windowAfter,
                    deltas,
                    beforeEnvs,
                    afterEnvs
                )
            }
        ],
        response_format: { type: "json_object" },
        temperature: 0.15,
        max_tokens: 2000
    });

    const rawContent = response.choices[0]?.message?.content ?? "{}";
    let parsed: Record<string, any> = {};
    try {
        parsed = JSON.parse(rawContent);
    } catch {
        console.warn(
            "⚠️  AI returned non-JSON response — using empty fallback."
        );
    }

    return {
        generatedAt: new Date().toISOString(),
        pivotDate,
        beforeWindow: windowBefore,
        afterWindow: windowAfter,
        beforeEnvs,
        afterEnvs,
        overallVerdict: parsed.overallVerdict ?? "Neutral",
        regressions,
        improvements,
        newFailures,
        resolvedFailures,
        actionItems: parsed.actionItems ?? [],
        executiveSummary: parsed.executiveSummary ?? ""
    };
}

// ─────────────────────────────────────────────────────────────────────────────
// CLI
// ─────────────────────────────────────────────────────────────────────────────

async function main() {
    const args = process.argv.slice(2);
    const positional = args.filter((a) => !a.startsWith("--"));
    const inputPath = positional[0] ?? "test-results-history/consolidated.json";
    const outputPath =
        positional[1] ?? "ai-outputs/reports/regression-delta.json";

    const sinceIdx = args.indexOf("--since");

    // Auto-derive pivot: 7 days ago if not supplied via --since or PIVOT_DATE
    function sevenDaysAgo(): string {
        const d = new Date();
        d.setDate(d.getDate() - 7);
        return d.toISOString().slice(0, 10);
    }

    const pivotDate =
        sinceIdx !== -1
            ? args[sinceIdx + 1]
            : process.env.PIVOT_DATE || sevenDaysAgo();

    const maxRunsPerWindow = parseInt(process.env.DEEP_MAX_RUNS ?? "10", 10);

    if (!pivotDate || !/^\d{4}-\d{2}-\d{2}$/.test(pivotDate)) {
        console.error(
            "❌ Pivot date required. Use --since YYYY-MM-DD or set PIVOT_DATE in .env"
        );
        console.error(
            "   Example: npm run ai:regression -- --since 2026-04-22"
        );
        process.exit(1);
    }

    if (!fs.existsSync(inputPath)) {
        console.error(`❌ File not found: ${inputPath}`);
        process.exit(1);
    }

    try {
        const report = await runRegressionDelta(
            inputPath,
            pivotDate,
            maxRunsPerWindow
        );
        fs.mkdirSync(require("path").dirname(outputPath), { recursive: true });
        fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));

        const verdictEmoji =
            report.overallVerdict === "Regressed"
                ? "🔴"
                : report.overallVerdict === "Improved"
                  ? "🟢"
                  : "🟡";

        console.log(`\n✅ Regression delta report written to ${outputPath}`);
        console.log(
            `\n${verdictEmoji} Overall Verdict: ${report.overallVerdict}`
        );

        if (report.regressions.length > 0) {
            console.log(`\n⚠️  Regressions (${report.regressions.length}):`);
            for (const r of report.regressions.slice(0, 5)) {
                console.log(
                    `  • ${r.testTitle}: ${r.beforeFailureRate}% → ${r.afterFailureRate}% (Δ${r.failureDelta >= 0 ? "+" : ""}${r.failureDelta}%)`
                );
            }
        }

        if (report.newFailures.length > 0) {
            console.log(`\n🔴 New Failures (${report.newFailures.length}):`);
            for (const f of report.newFailures) {
                console.log(
                    `  • ${f.testTitle}: ${f.afterFailureRate}% failure rate (newly appeared)`
                );
            }
        }

        if (report.resolvedFailures.length > 0) {
            console.log(`\n✅ Resolved (${report.resolvedFailures.length}):`);
            for (const r of report.resolvedFailures.slice(0, 3)) {
                console.log(`  • ${r.testTitle}: ${r.beforeFailureRate}% → 0%`);
            }
        }

        console.log(`\n🎯 Action Items:`);
        report.actionItems.forEach((item, i) =>
            console.log(`  ${i + 1}. ${item}`)
        );

        console.log(`\n📌 Executive Summary:\n${report.executiveSummary}`);

        const summaryPath = process.env.GITHUB_STEP_SUMMARY;
        if (summaryPath) {
            fs.appendFileSync(summaryPath, buildMarkdownSummary(report));
        }
    } catch (err: any) {
        console.error("❌ Regression analysis failed:", err.message);
        process.exit(1);
    }
}

function buildMarkdownSummary(report: RegressionDeltaReport): string {
    const emoji =
        report.overallVerdict === "Regressed"
            ? "🔴"
            : report.overallVerdict === "Improved"
              ? "🟢"
              : "🟡";
    const lines = [
        `## ${emoji} AI Regression Delta — Pivot: ${report.pivotDate}`,
        `**Verdict:** ${report.overallVerdict} | **Before:** ${report.beforeWindow.runsAnalysed} runs | **After:** ${report.afterWindow.runsAnalysed} runs`,
        ``,
        `### Executive Summary`,
        report.executiveSummary,
        ``
    ];
    const changed = [
        ...report.regressions,
        ...report.newFailures,
        ...report.improvements,
        ...report.resolvedFailures
    ];
    if (changed.length > 0) {
        lines.push(`### Test Deltas`);
        lines.push(`| Test | Before | After | Δ | Verdict |`);
        lines.push(`|------|--------|-------|---|---------|`);
        for (const d of changed) {
            const sign = d.failureDelta >= 0 ? "+" : "";
            lines.push(
                `| ${d.testTitle} | ${d.beforeFailureRate}% | ${d.afterFailureRate}% | ${sign}${d.failureDelta}% | ${d.verdict} |`
            );
        }
    }
    if (report.actionItems.length > 0) {
        lines.push(``, `### Action Items`);
        report.actionItems.forEach((item, i) =>
            lines.push(`${i + 1}. ${item}`)
        );
    }
    return lines.join("\n") + "\n";
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
