/**
 * TrendPatternAgent.ts
 *
 * Reads the consolidated.json run-history and uses gpt-4o to identify
 * patterns, anomalies, and actionable insights across ALL historical runs.
 *
 * Works entirely from the local consolidated.json (no GitHub API needed).
 * Run this first — it gives the macro view in seconds.
 *
 * Usage:
 *   npx ts-node src/ai/agents/TrendPatternAgent.ts [consolidated.json] [output.json]
 *   npm run ai:trends
 */

import fs from "fs";
import { getAzureOpenAIClient, getDeployment } from "../AzureOpenAIClient";
import type { TestRun } from "../../contracts/TestRun";
import { mapSummaryToTestRun } from "../../adapters/playwrightAdapter";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface EnrichedRun extends TestRun {
    date: string; // YYYY-MM-DD
    time: string; // HH:MM
    dayOfWeek: string; // Monday … Sunday
    isWeekend: boolean; // auto-detected Sat/Sun from UTC timestamp — excluded from health metrics
    hourUTC: number;
    successRate: number; // 0–100
    isCompleteFailure: boolean; // every test failed
    hasFailures: boolean;
    hasFlakiness: boolean;
    execTimeLabel: string; // "fast" | "normal" | "slow" | "very slow"
    execTimeSec: number; // suite execution time in seconds, derived from durationMs
}

export interface TrendPattern {
    patternType:
        | "Recurring Outage"
        | "Chronic Flakiness"
        | "Execution Time Anomaly"
        | "Time-of-Day Risk"
        | "Day-of-Week Risk"
        | "Improving Trend"
        | "Degrading Trend"
        | "Isolated Incident"
        | "Other";
    description: string;
    affectedRuns: number;
    severity: "High" | "Medium" | "Low";
    recommendation: string;
}

export interface TrendReport {
    generatedAt: string;
    runsAnalysed: number; // business-day runs only
    weekendExcluded: number; // Sat/Sun runs auto-detected from timestamp
    dateRange: { from: string; to: string };
    overallHealthScore: number; // 0–100
    trendDirection: "Improving" | "Stable" | "Degrading";
    successRate: number; // % of business-day runs fully passed (no failures, no flakiness)
    avgTestPassRate: number; // avg % of individual tests passing per run
    flakyRate: number; // % of runs with at least one flaky test
    byEnvironment: Record<
        string,
        {
            total: number;
            failures: number;
            flaky: number;
            avgSuccess: number;
            /** All weekday runs for this env (timestamp + successRate) */
            runs: Array<{
                timestamp: string;
                successRate: number;
                flaky: boolean;
            }>;
            /** Subset of runs where successRate < 100 */
            failureRuns: Array<{
                timestamp: string;
                successRate: number;
                flaky: boolean;
            }>;
            /** Subset of runs with at least one flaky test */
            flakyRuns: Array<{
                timestamp: string;
                successRate: number;
                flaky: boolean;
            }>;
        }
    >;
    patterns: TrendPattern[];
    riskPeriods: Array<{ period: string; description: string }>;
    actionItems: string[];
    executiveSummary: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Pre-processing — derive signals before sending to AI (fewer tokens, better analysis)
// ─────────────────────────────────────────────────────────────────────────────

const DAYS = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday"
];

function enrichRuns(runs: TestRun[]): EnrichedRun[] {
    // Compute median execTime to classify "fast" / "normal" / "slow"
    const times = runs
        .map((r) => (r.durationMs ?? 0) / 1000)
        .filter((t) => t > 0)
        .sort((a, b) => a - b);
    const medianTime = times[Math.floor(times.length / 2)] ?? 300;

    return runs.map((r) => {
        const [datePart, timePart] = r.timestamp.split("_");
        const [h, m] = (timePart ?? "00-00").split("-").map(Number);
        const dt = new Date(
            `${datePart}T${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00Z`
        );

        const successRate =
            r.summary.total > 0
                ? Math.round((r.summary.passed / r.summary.total) * 100)
                : 0;

        const execTimeSec = (r.durationMs ?? 0) / 1000;
        const execTimeLabel =
            execTimeSec === 0
                ? "unknown"
                : execTimeSec < medianTime * 0.5
                  ? "fast"
                  : execTimeSec < medianTime * 1.5
                    ? "normal"
                    : execTimeSec < medianTime * 3
                      ? "slow"
                      : "very slow";

        const utcDay = dt.getUTCDay(); // 0=Sun, 6=Sat — UTC matches the date stamp
        const dayOfWeek = DAYS[utcDay];

        return {
            ...r,
            date: datePart,
            time: `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`,
            dayOfWeek,
            isWeekend: utcDay === 0 || utcDay === 6,
            hourUTC: h,
            successRate,
            execTimeSec,
            // A zero-execution run is a scheduled environment shutdown — NOT a failure
            isCompleteFailure: successRate === 0 && r.summary.total > 0,
            hasFailures: successRate < 100 && r.summary.total > 0,
            hasFlakiness: r.summary.flaky > 0,
            execTimeLabel
        };
    });
}

function computeStatistics(enriched: EnrichedRun[]) {
    // Auto-detect weekend runs from UTC timestamp — excluded from health metrics
    const weekendExcluded = enriched.filter((r) => r.isWeekend).length;
    const weekdayRuns = enriched.filter((r) => !r.isWeekend);
    const total = weekdayRuns.length;
    if (total === 0) return null;

    const fullyPassed = weekdayRuns.filter(
        (r) => r.successRate === 100 && !r.hasFlakiness
    ).length;
    const withFailures = weekdayRuns.filter((r) => r.hasFailures).length;
    const completeOutages = weekdayRuns.filter(
        (r) => r.isCompleteFailure
    ).length;
    const withFlakiness = weekdayRuns.filter((r) => r.hasFlakiness).length;

    // Day-of-week failure rates
    const byDay: Record<
        string,
        { total: number; failures: number; flaky: number }
    > = {};
    for (const r of weekdayRuns) {
        if (!byDay[r.dayOfWeek])
            byDay[r.dayOfWeek] = { total: 0, failures: 0, flaky: 0 };
        byDay[r.dayOfWeek].total++;
        if (r.hasFailures) byDay[r.dayOfWeek].failures++;
        if (r.hasFlakiness) byDay[r.dayOfWeek].flaky++;
    }

    // Execution-time outliers (very slow runs)
    const slowRuns = weekdayRuns
        .filter((r) => r.execTimeLabel === "very slow")
        .map((r) => ({
            timestamp: r.timestamp,
            execTimeSec: r.execTimeSec,
            successRate: r.successRate
        }));

    // Consecutive failure clusters
    const clusters: Array<{ start: string; end: string; length: number }> = [];
    let clusterStart: string | null = null,
        clusterLen = 0;
    for (const r of [...weekdayRuns].reverse()) {
        // oldest first
        if (r.hasFailures) {
            if (!clusterStart) {
                clusterStart = r.timestamp;
                clusterLen = 0;
            }
            clusterLen++;
        } else if (clusterStart) {
            clusters.push({
                start: clusterStart,
                end: r.timestamp,
                length: clusterLen
            });
            clusterStart = null;
            clusterLen = 0;
        }
    }
    if (clusterStart)
        clusters.push({
            start: clusterStart,
            end: weekdayRuns[0].timestamp,
            length: clusterLen
        });

    // Average test-level pass rate across all runs (more nuanced than binary fullyPassed)
    const avgTestPassRate =
        total > 0
            ? Math.round(
                  enriched.reduce((s, r) => s + r.successRate, 0) / total
              )
            : 0;

    // Severity distribution: how bad are the runs that aren't perfect?
    const runsExecuted = enriched.filter((r) => r.summary.total > 0);
    const nearPerfect = runsExecuted.filter((r) => r.successRate >= 95).length; // ≥95% tests pass
    const partialFailure = runsExecuted.filter(
        (r) => r.successRate >= 50 && r.successRate < 95
    ).length; // 50–94%
    const majorFailure = runsExecuted.filter((r) => r.successRate < 50).length; // <50% (true outages)
    const zeroExecution = enriched.filter((r) => r.summary.total === 0).length; // environment was down

    // Recent 7 runs vs previous 7 runs (trend direction signals)
    const recent = enriched.slice(0, 7);
    const previous = enriched.slice(7, 14);
    const avgSuccessRecent =
        recent.reduce((s, r) => s + r.successRate, 0) / (recent.length || 1);
    const avgSuccessPrevious =
        previous.reduce((s, r) => s + r.successRate, 0) /
        (previous.length || 1);

    // Per-environment breakdown (weekday runs only)
    const byEnvironment: Record<
        string,
        {
            total: number;
            failures: number;
            flaky: number;
            avgSuccess: number;
            runs: Array<{
                timestamp: string;
                successRate: number;
                flaky: boolean;
            }>;
            failureRuns: Array<{
                timestamp: string;
                successRate: number;
                flaky: boolean;
            }>;
            flakyRuns: Array<{
                timestamp: string;
                successRate: number;
                flaky: boolean;
            }>;
        }
    > = {};
    for (const r of weekdayRuns) {
        // Normalise missing/blank env — CI defaults "Unknown" when TEST_ENV not set in .env
        const env =
            r.environment && r.environment.trim()
                ? r.environment.trim().toUpperCase()
                : "UNKNOWN";
        if (!byEnvironment[env])
            byEnvironment[env] = {
                total: 0,
                failures: 0,
                flaky: 0,
                avgSuccess: 0,
                runs: [],
                failureRuns: [],
                flakyRuns: []
            };
        const entry = {
            timestamp: r.timestamp,
            successRate: r.successRate,
            flaky: r.hasFlakiness
        };
        byEnvironment[env].total++;
        byEnvironment[env].runs.push(entry);
        if (r.hasFailures) {
            byEnvironment[env].failures++;
            byEnvironment[env].failureRuns.push(entry);
        }
        if (r.hasFlakiness) {
            byEnvironment[env].flaky++;
            byEnvironment[env].flakyRuns.push(entry);
        }
        byEnvironment[env].avgSuccess += r.successRate;
    }
    for (const e of Object.values(byEnvironment)) {
        e.avgSuccess = e.total > 0 ? Math.round(e.avgSuccess / e.total) : 0;
    }

    return {
        total,
        weekendExcluded,
        fullyPassed,
        withFailures,
        completeOutages,
        withFlakiness,
        avgTestPassRate,
        nearPerfect,
        partialFailure,
        majorFailure,
        zeroExecution,
        successRateOverall: Math.round((fullyPassed / total) * 100),
        flakyRateOverall: Math.round((withFlakiness / total) * 100),
        outageRateOverall: Math.round((completeOutages / total) * 100),
        dayOfWeekStats: byDay,
        slowRuns,
        failureClusters: clusters,
        trendSignal: {
            avgSuccessRecent: Math.round(avgSuccessRecent),
            avgSuccessPrevious: Math.round(avgSuccessPrevious),
            delta: Math.round(avgSuccessRecent - avgSuccessPrevious)
        },
        byEnvironment
    };
}

// ─────────────────────────────────────────────────────────────────────────────
// Prompt engineering
// ─────────────────────────────────────────────────────────────────────────────

import { TREND_SYSTEM_PROMPT } from "../prompts/trend.prompt";

const SYSTEM_PROMPT = TREND_SYSTEM_PROMPT;

function buildUserPrompt(
    enriched: EnrichedRun[],
    stats: ReturnType<typeof computeStatistics>
): string {
    const dateRange = `${enriched[enriched.length - 1]?.date ?? "?"} → ${enriched[0]?.date ?? "?"}`;

    return `
Analyse ${stats!.total} historical Playwright test runs (${dateRange}).

── SCHEDULE CONTEXT ────────────────────────────────────────────
Test runs occur on BUSINESS DAYS only. Saturday/Sunday runs are auto-detected from the
UTC timestamp and tagged [WKND] — they are EXCLUDED from all health metrics below.
Runs with 0 executed tests = environment intentionally offline. NOT an outage.

── AGGREGATE STATISTICS (business-day runs only) ────────────────────────────────────────
Business-day runs:       ${stats!.total}
Weekend runs excluded:   ${stats!.weekendExcluded} (Saturday/Sunday auto-detected from UTC timestamp — not counted below)
Fully passed (no flaky): ${stats!.fullyPassed} (${stats!.successRateOverall}%)  ← strict: zero failures AND zero flakiness
Avg test pass rate:      ${stats!.avgTestPassRate}%  ← avg % of tests passing per run (primary health signal)
Runs with failures:      ${stats!.withFailures}
Environment shutdowns:   ${stats!.zeroExecution} runs with 0 executed tests (expected downtime)
Complete outages:        ${stats!.completeOutages} (${stats!.outageRateOverall}%)
Runs with flaky tests:   ${stats!.withFlakiness} (${stats!.flakyRateOverall}%)

── FAILURE SEVERITY DISTRIBUTION ────────────────────────────────────
Near-perfect  (≥95% tests pass): ${stats!.nearPerfect} runs
Partial fail  (50–94% pass):     ${stats!.partialFailure} runs
Major failure (<50% pass):       ${stats!.majorFailure} runs

── TREND (last 7 vs previous 7 runs) ────────────────────
Recent 7 avg success rate:   ${stats!.trendSignal.avgSuccessRecent}%
Previous 7 avg success rate: ${stats!.trendSignal.avgSuccessPrevious}%
Delta:                       ${stats!.trendSignal.delta > 0 ? "+" : ""}${stats!.trendSignal.delta}%

── FAILURE CLUSTERS (consecutive failure runs) ──────────
${
    stats!.failureClusters.length === 0
        ? "No consecutive failure clusters detected."
        : stats!.failureClusters
              .map(
                  (c) =>
                      `  ${c.start} → ${c.end} (${c.length} consecutive run(s) with failures)`
              )
              .join("\n")
}

── EXECUTION TIME OUTLIERS (very slow = >3× median) ─────
${
    stats!.slowRuns.length === 0
        ? "None."
        : stats!.slowRuns
              .map(
                  (s) =>
                      `  ${s.timestamp}: ${s.execTimeSec}s — success rate ${s.successRate}%`
              )
              .join("\n")
}

── DAY-OF-WEEK BREAKDOWN ────────────────────────────────
${Object.entries(stats!.dayOfWeekStats)
    .sort((a, b) => b[1].failures - a[1].failures)
    .map(
        ([day, s]) =>
            `  ${day.padEnd(10)}: ${s.total} runs, ${s.failures} with failures, ${s.flaky} with flakiness`
    )
    .join("\n")}

── ENVIRONMENT BREAKDOWN ─────────────────────────────────
${
    Object.keys(stats!.byEnvironment).length <= 1
        ? "  Single environment — no cross-environment comparison possible."
        : Object.entries(stats!.byEnvironment)
              .sort((a, b) => b[1].total - a[1].total)
              .map(
                  ([env, s]) =>
                      `  ${env.padEnd(12)}: ${s.total} runs, ${s.failures} with failures, ${s.flaky} with flakiness, avg success ${s.avgSuccess}%`
              )
              .join("\n")
}

── PER-RUN DETAIL (most recent 20 runs, newest first; [WKND] rows excluded from metrics) ───
timestamp                 | env  | executed | passed | failed | flaky | successRate | execTimeSec | execLabel
${enriched
    .slice(0, 20)
    .map((r) => {
        const tag = r.isWeekend ? " [WKND]" : "";
        return `${r.timestamp.padEnd(26)}| ${(r.environment ?? "?").padEnd(5)}| ${String(r.summary.total).padEnd(9)}| ${String(r.summary.passed).padEnd(7)}| ${String(r.summary.failed).padEnd(7)}| ${String(r.summary.flaky).padEnd(6)}| ${String(r.successRate + "%").padEnd(12)}| ${String(r.execTimeSec).padEnd(12)}| ${r.execTimeLabel}${tag}`;
    })
    .join("\n")}
`.trim();
}

// ─────────────────────────────────────────────────────────────────────────────
// Main agent function
// ─────────────────────────────────────────────────────────────────────────────

export async function analyseTrends(
    consolidatedPath: string
): Promise<TrendReport> {
    const raw: { runs: unknown[] } = JSON.parse(
        fs.readFileSync(consolidatedPath, "utf-8")
    );

    const enriched = enrichRuns((raw.runs ?? []).map(mapSummaryToTestRun));
    const stats = computeStatistics(enriched);

    if (!stats || stats.total === 0) {
        throw new Error("consolidated.json contains no run data.");
    }

    console.log(
        `\n\uD83D\uDCCA Analysing ${stats.total} business-day runs` +
            (stats.weekendExcluded > 0
                ? ` (+${stats.weekendExcluded} weekend runs auto-excluded)`
                : "") +
            ` (${enriched[enriched.length - 1]?.date} \u2192 ${enriched[0]?.date})...`
    );

    const client = getAzureOpenAIClient();
    const deployment = getDeployment();

    const response = await client.chat.completions.create({
        model: deployment,
        messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: buildUserPrompt(enriched, stats) }
        ],
        response_format: { type: "json_object" },
        temperature: 0.15,
        max_tokens: 2500
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
        runsAnalysed: stats.total,
        weekendExcluded: stats.weekendExcluded,
        dateRange: {
            // Use weekday-run boundaries so the range doesn't show a weekend date
            from:
                enriched.filter((r) => !r.isWeekend).at(-1)?.date ??
                enriched[enriched.length - 1]?.date ??
                "",
            to:
                enriched.filter((r) => !r.isWeekend)[0]?.date ??
                enriched[0]?.date ??
                ""
        },
        overallHealthScore: parsed.overallHealthScore ?? 0,
        trendDirection: parsed.trendDirection ?? "Stable",
        successRate: stats.successRateOverall,
        avgTestPassRate: stats.avgTestPassRate,
        flakyRate: stats.flakyRateOverall,
        byEnvironment: stats.byEnvironment,
        patterns: parsed.patterns ?? [],
        riskPeriods: parsed.riskPeriods ?? [],
        actionItems: parsed.actionItems ?? [],
        executiveSummary: parsed.executiveSummary ?? ""
    };
}

// ─────────────────────────────────────────────────────────────────────────────
// CLI
// ─────────────────────────────────────────────────────────────────────────────

async function main() {
    const inputPath =
        process.argv[2] ?? "test-results-history/consolidated.json";
    const outputPath = process.argv[3] ?? "ai-outputs/reports/trend.json";

    if (!fs.existsSync(inputPath)) {
        console.error(`❌ File not found: ${inputPath}`);
        process.exit(1);
    }

    try {
        const report = await analyseTrends(inputPath);
        fs.mkdirSync(require("path").dirname(outputPath), { recursive: true });
        fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));

        console.log(`\n✅ Trend report written to ${outputPath}`);
        console.log(`\n🏥 Health Score : ${report.overallHealthScore}/100`);
        console.log(`📈 Trend        : ${report.trendDirection}`);
        console.log(
            `✓  Success rate : ${report.successRate}% of runs fully passed`
        );
        console.log(
            `⚡ Flaky rate   : ${report.flakyRate}% of runs had flaky tests\n`
        );

        console.log("🔍 Patterns Found:");
        for (const p of report.patterns) {
            const icon =
                p.severity === "High"
                    ? "🔴"
                    : p.severity === "Medium"
                      ? "🟡"
                      : "🟢";
            console.log(`  ${icon} [${p.patternType}] ${p.description}`);
            console.log(`     → ${p.recommendation}\n`);
        }

        console.log("🎯 Action Items:");
        report.actionItems.forEach((item, i) =>
            console.log(`  ${i + 1}. ${item}`)
        );

        console.log(`\n📌 Executive Summary:\n${report.executiveSummary}`);

        // GitHub Actions step summary
        const summaryPath = process.env.GITHUB_STEP_SUMMARY;
        if (summaryPath) {
            fs.appendFileSync(summaryPath, buildMarkdownSummary(report));
        }
    } catch (err: any) {
        console.error("❌ Trend analysis failed:", err.message);
        process.exit(1);
    }
}

function buildMarkdownSummary(report: TrendReport): string {
    const trendIcon =
        report.trendDirection === "Improving"
            ? "📈"
            : report.trendDirection === "Degrading"
              ? "📉"
              : "📊";
    const lines = [
        `## ${trendIcon} AI Trend Analysis`,
        `**Health Score:** ${report.overallHealthScore}/100 | **Trend:** ${report.trendDirection} | **Runs Analysed:** ${report.runsAnalysed} (${report.dateRange.from} → ${report.dateRange.to})`,
        ``,
        `### Executive Summary`,
        report.executiveSummary,
        ``,
        `### Patterns`,
        `| Type | Severity | Affected Runs | Recommendation |`,
        `|------|----------|---------------|----------------|`
    ];
    for (const p of report.patterns) {
        lines.push(
            `| ${p.patternType} | ${p.severity} | ${p.affectedRuns} | ${p.recommendation} |`
        );
    }
    lines.push(``, `### Action Items`);
    report.actionItems.forEach((item, i) => lines.push(`${i + 1}. ${item}`));
    return lines.join("\n") + "\n";
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
