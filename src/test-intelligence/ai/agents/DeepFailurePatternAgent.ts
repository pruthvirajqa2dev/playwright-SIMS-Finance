/**
 * DeepFailurePatternAgent.ts
 *
 * Fetches the per-run test-results.json files from the gh-pages branch for
 * every run that had failures or flakiness, extracts per-test outcomes, then
 * asks gpt-4o to identify which individual tests are unreliable and why.
 *
 * This gives the micro-level view TrendPatternAgent cannot provide
 * (which SPECIFIC test is failing, how often, and what the error pattern is).
 *
 * Required env vars:
 *   GITHUB_REPO_OWNER         — e.g. pruthvirajqa2dev
 *   GITHUB_REPO_NAME          — e.g. playwright-SIMS-Finance
 *   AZURE_OPENAI_ENDPOINT
 *   AZURE_OPENAI_API_KEY
 *   AZURE_OPENAI_DEPLOYMENT
 *
 * Optional:
 *   GITHUB_TOKEN              — for private repos / higher rate limits
 *   DEEP_MAX_RUNS             — max number of runs to fetch (default: 15)
 *
 * Usage:
 *   npx ts-node src/ai/agents/DeepFailurePatternAgent.ts [consolidated.json] [output.json]
 *   npm run ai:deep
 */

import fs from "fs";
import { getAzureOpenAIClient, getDeployment } from "../AzureOpenAIClient";
import {
    GitHubReportsClient,
    RunOutcome,
    PerTestOutcome
} from "../utils/GitHubReportsClient";
import { filterByExcludedDays } from "../utils/runFilters";
import type { TestRun } from "../../contracts/TestRun";
import { mapSummaryToTestRun } from "../../adapters/playwrightAdapter";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface PerTestProfile {
    testTitle: string;
    totalRuns: number; // runs where this test appeared
    failureCount: number;
    flakyCount: number;
    passCount: number;
    failureRate: number; // 0–100
    flakyRate: number; // 0–100
    avgDurationMs: number;
    lastSeen: string; // timestamp of most recent run containing this test
    lastFailureTimestamp?: string; // timestamp of most recent failure run (for report linking)
    errorSamples: string[]; // up to 3 distinct error message snippets
    failuresByEnv: Record<string, number>; // env → failure count (e.g. { UAT: 5, TRAINING: 0 })
    runsByEnv: Record<string, number>; // env → runs seen in
}

export interface CoFailurePattern {
    tests: string[];
    occurrences: number;
    possibleCause: string;
}

export interface PerTestAnalysis {
    testTitle: string;
    stabilityLabel: "Unstable" | "Flaky" | "Stable";
    /** Legacy field name returned by older prompt versions — same meaning as stabilityLabel */
    stabilityCategory?: "Unstable" | "Flaky" | "Stable";
    priority: "High" | "Medium" | "Low";
    failureRate: number;
    flakyRate: number;
    mostFrequentError: string;
    timeoutSuspected: boolean;
    environmentSpecific: boolean;
    failureHypothesis: string;
    recommendation: string;
}

export interface DeepFailureReport {
    generatedAt: string;
    runsAnalysed: number;
    runsWithIssues: number;
    reportBaseUrl: string; // GitHub Pages base URL — e.g. https://owner.github.io/repo/published-reports/
    perTestProfiles: PerTestProfile[];
    perTestAnalyses: PerTestAnalysis[];
    coFailurePatterns: CoFailurePattern[];
    topUnstableTests: string[];
    actionItems: string[];
    executiveSummary: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Aggregate per-test profiles across multiple run outcomes
// ─────────────────────────────────────────────────────────────────────────────

function buildPerTestProfiles(runOutcomes: RunOutcome[]): PerTestProfile[] {
    const map = new Map<string, PerTestProfile>();

    for (const run of runOutcomes) {
        for (const t of run.tests) {
            let profile = map.get(t.testTitle);
            if (!profile) {
                profile = {
                    testTitle: t.testTitle,
                    totalRuns: 0,
                    failureCount: 0,
                    flakyCount: 0,
                    passCount: 0,
                    failureRate: 0,
                    flakyRate: 0,
                    avgDurationMs: 0,
                    lastSeen: run.timestamp,
                    errorSamples: [],
                    failuresByEnv: {},
                    runsByEnv: {}
                };
                map.set(t.testTitle, profile);
            }

            const env =
                run.environment && run.environment.trim()
                    ? run.environment.trim().toUpperCase()
                    : "UNKNOWN";
            profile.runsByEnv[env] = (profile.runsByEnv[env] ?? 0) + 1;
            profile.totalRuns++;
            profile.avgDurationMs += t.durationMs;

            if (t.finalStatus === "failed" || t.finalStatus === "timedOut") {
                profile.failureCount++;
                profile.failuresByEnv[env] =
                    (profile.failuresByEnv[env] ?? 0) + 1;
                if (
                    !profile.lastFailureTimestamp ||
                    run.timestamp > profile.lastFailureTimestamp
                ) {
                    profile.lastFailureTimestamp = run.timestamp;
                }
                if (t.errorMessage && profile.errorSamples.length < 3) {
                    const snippet = t.errorMessage
                        .slice(0, 150)
                        .replace(/\n/g, " ");
                    if (!profile.errorSamples.includes(snippet)) {
                        profile.errorSamples.push(snippet);
                    }
                }
            } else if (t.finalStatus === "flaky") {
                profile.flakyCount++;
            } else if (t.finalStatus === "passed") {
                profile.passCount++;
            }

            if (run.timestamp > profile.lastSeen) {
                profile.lastSeen = run.timestamp;
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
        p.avgDurationMs =
            p.totalRuns > 0 ? Math.round(p.avgDurationMs / p.totalRuns) : 0;
    }

    return [...map.values()].sort(
        (a, b) =>
            b.failureRate +
            b.flakyRate * 0.5 -
            (a.failureRate + a.flakyRate * 0.5)
    );
}

/**
 * Co-failure: tests that fail in the same runs more than once.
 * Only considers hard failures (not flaky).
 */
function detectCoFailures(runOutcomes: RunOutcome[]): CoFailurePattern[] {
    const pairCounts = new Map<string, number>();

    for (const run of runOutcomes) {
        const failedTitles = run.tests
            .filter(
                (t) =>
                    t.finalStatus === "failed" || t.finalStatus === "timedOut"
            )
            .map((t) => t.testTitle)
            .sort();

        if (failedTitles.length < 2) continue;

        // Record every pair
        for (let i = 0; i < failedTitles.length; i++) {
            for (let j = i + 1; j < failedTitles.length; j++) {
                const key = `${failedTitles[i]}|||${failedTitles[j]}`;
                pairCounts.set(key, (pairCounts.get(key) ?? 0) + 1);
            }
        }
    }

    return [...pairCounts.entries()]
        .filter(([, count]) => count >= 2)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([key, count]) => ({
            tests: key.split("|||"),
            occurrences: count,
            possibleCause: "" // filled in by AI
        }));
}

// ─────────────────────────────────────────────────────────────────────────────
// Prompt engineering
// ─────────────────────────────────────────────────────────────────────────────

import { FAILURE_SYSTEM_PROMPT } from "../prompts/failure.prompt";

const SYSTEM_PROMPT = FAILURE_SYSTEM_PROMPT;

function buildUserPrompt(
    profiles: PerTestProfile[],
    coFailures: CoFailurePattern[],
    runsAnalysed: number,
    environments: string[]
): string {
    const envSummary =
        environments.length > 0 ? environments.join(", ") : "Unknown";
    const multiEnv = environments.length > 1;

    const profileTable = profiles
        .map((p) => {
            const envBreakdown =
                multiEnv && Object.keys(p.failuresByEnv).length > 0
                    ? `\n  Failures by env   : ${Object.entries(p.runsByEnv)
                          .map(
                              ([e, runs]) =>
                                  `${e}: ${p.failuresByEnv[e] ?? 0}/${runs} failures`
                          )
                          .join(", ")}`
                    : "";
            return `Test: "${p.testTitle}"
  Runs appearing in : ${p.totalRuns} / ${runsAnalysed}
  Hard failures     : ${p.failureCount} (${p.failureRate}%)
  Flaky (pass after retry): ${p.flakyCount} (${p.flakyRate}%)
  Avg duration      : ${Math.round(p.avgDurationMs / 1000)}s
  Error samples     : ${p.errorSamples.length > 0 ? p.errorSamples.join(" | ") : "none"}${envBreakdown}`;
        })
        .join("\n\n");

    const coFailureSection =
        coFailures.length === 0
            ? "No co-failure pairs detected (tests that always fail together)."
            : coFailures
                  .map(
                      (c) =>
                          `  ${c.tests.join(" + ")} — co-failed in ${c.occurrences} run(s)`
                  )
                  .join("\n");

    return `
Analyse per-test reliability across ${runsAnalysed} historical Playwright CI runs on SIMS Finance (environments: ${envSummary}).

── PER-TEST PROFILES ─────────────────────────────────────────────────────────

${profileTable}

── CO-FAILURE PAIRS (tests failing together in the same run) ─────────────────

${coFailureSection}
`.trim();
}

// ─────────────────────────────────────────────────────────────────────────────
// Main agent function
// ─────────────────────────────────────────────────────────────────────────────

export async function runDeepAnalysis(
    consolidatedPath: string,
    maxRuns: number = 15
): Promise<DeepFailureReport> {
    const raw: { runs: unknown[] } = JSON.parse(
        fs.readFileSync(consolidatedPath, "utf-8")
    );

    const allRuns: TestRun[] = filterByExcludedDays(
        (raw.runs ?? []).map(mapSummaryToTestRun)
    );

    // Only fetch runs that actually had issues — saves API calls and tokens
    const interestingRuns = allRuns
        .filter((r) => r.summary.failed > 0 || r.summary.flaky > 0)
        .slice(0, maxRuns);

    console.log(
        `\n🔍 Found ${interestingRuns.length} runs with failures/flakiness out of ${allRuns.length} total.`
    );

    if (interestingRuns.length === 0) {
        return {
            generatedAt: new Date().toISOString(),
            runsAnalysed: 0,
            runsWithIssues: 0,
            reportBaseUrl: "",
            perTestProfiles: [],
            perTestAnalyses: [],
            coFailurePatterns: [],
            topUnstableTests: [],
            actionItems: [
                "All historical runs passed cleanly — no per-test analysis needed."
            ],
            executiveSummary:
                "No failures or flaky tests detected in the analysed history."
        };
    }

    console.log(
        `\n📥 Fetching per-run test-results.json from gh-pages (max ${maxRuns} runs)...`
    );

    const client_gh = new GitHubReportsClient();
    const reports = await client_gh.fetchRunReports(
        interestingRuns.map((r) => r.timestamp),
        { delayMs: 250 } // gentle rate limiting
    );

    if (reports.length === 0) {
        console.warn(
            "⚠️  Could not fetch any run reports from gh-pages.\n" +
                "Check GITHUB_REPO_OWNER, GITHUB_REPO_NAME, and optionally GITHUB_TOKEN.\n" +
                "Returning partial report with no per-test analysis."
        );
        return {
            generatedAt: new Date().toISOString(),
            runsAnalysed: 0,
            runsWithIssues: interestingRuns.length,
            reportBaseUrl: "",
            perTestProfiles: [],
            perTestAnalyses: [],
            coFailurePatterns: [],
            topUnstableTests: [],
            actionItems: [
                "GitHub fetch failed — per-test analysis unavailable. Check GITHUB_REPO_OWNER, GITHUB_REPO_NAME, and GITHUB_TOKEN."
            ],
            executiveSummary:
                "Per-test analysis could not be completed because test-results.json files could not be fetched from GitHub Pages. Trend and regression reports are unaffected."
        };
    }

    console.log(
        `\n✅ Fetched ${reports.length} reports. Extracting per-test outcomes...`
    );

    const runOutcomes: RunOutcome[] = reports.map((r) => {
        const rawEnv = interestingRuns.find(
            (i) => i.timestamp === r.timestamp
        )?.environment;
        const env =
            rawEnv && rawEnv.trim() ? rawEnv.trim().toUpperCase() : "UNKNOWN";
        return GitHubReportsClient.extractTestOutcomes(r, env);
    });

    const reportBaseUrl =
        process.env.GITHUB_REPO_OWNER && process.env.GITHUB_REPO_NAME
            ? `https://${process.env.GITHUB_REPO_OWNER}.github.io/${process.env.GITHUB_REPO_NAME}/published-reports/`
            : "";

    const profiles = buildPerTestProfiles(runOutcomes);
    const coFailures = detectCoFailures(runOutcomes);
    const environments = [
        ...new Set(runOutcomes.map((r) => r.environment))
    ].filter(Boolean);

    console.log(
        `\n🤖 Sending ${profiles.length} test profiles to AI Foundry for analysis...`
    );

    const ai_client = getAzureOpenAIClient();
    const deployment = getDeployment();

    const response = await ai_client.chat.completions.create({
        model: deployment,
        messages: [
            { role: "system", content: SYSTEM_PROMPT },
            {
                role: "user",
                content: buildUserPrompt(
                    profiles,
                    coFailures,
                    reports.length,
                    environments
                )
            }
        ],
        response_format: { type: "json_object" },
        temperature: 0.15,
        max_tokens: 3000
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

    // Merge AI-generated possible causes back into co-failure objects.
    // Match by sorted test-title key — NOT by array index, because the AI may
    // return entries in a different order or omit some entirely.
    const aiCauseMap = new Map<string, string>(
        (parsed.coFailurePatterns ?? []).map((c: any) => [
            [...(c.tests ?? [])].sort().join("|||"),
            c.possibleCause ?? ""
        ])
    );
    const mergedCoFailures: CoFailurePattern[] = coFailures.map((cf) => ({
        ...cf,
        possibleCause: aiCauseMap.get([...cf.tests].sort().join("|||")) ?? ""
    }));

    return {
        generatedAt: new Date().toISOString(),
        runsAnalysed: reports.length,
        runsWithIssues: interestingRuns.length,
        reportBaseUrl,
        perTestProfiles: profiles,
        perTestAnalyses: parsed.perTestAnalyses ?? [],
        coFailurePatterns: mergedCoFailures,
        topUnstableTests: parsed.topUnstableTests ?? [],
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
    const outputPath =
        process.argv[3] ?? "ai-outputs/reports/deep-failure.json";
    const maxRuns = parseInt(process.env.DEEP_MAX_RUNS ?? "15", 10);

    if (!fs.existsSync(inputPath)) {
        console.error(`❌ File not found: ${inputPath}`);
        process.exit(1);
    }

    try {
        const report = await runDeepAnalysis(inputPath, maxRuns);
        fs.mkdirSync(require("path").dirname(outputPath), { recursive: true });
        fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));

        console.log(`\n✅ Deep failure report written to ${outputPath}`);
        console.log(`\n🔬 Runs analysed: ${report.runsAnalysed}`);

        if (report.topUnstableTests.length > 0) {
            console.log(`\n⚠️  Top Unstable Tests:`);
            report.topUnstableTests.forEach((t, i) =>
                console.log(`  ${i + 1}. ${t}`)
            );
        }

        console.log(`\n🎯 Action Items:`);
        report.actionItems.forEach((item, i) =>
            console.log(`  ${i + 1}. ${item}`)
        );

        console.log(`\n📌 Executive Summary:\n${report.executiveSummary}`);

        if (report.coFailurePatterns.length > 0) {
            console.log(
                `\n🔗 Co-Failure Patterns (tests that break together):`
            );
            for (const c of report.coFailurePatterns) {
                console.log(
                    `  • ${c.tests.join(" + ")} (${c.occurrences}× — ${c.possibleCause})`
                );
            }
        }

        const summaryPath = process.env.GITHUB_STEP_SUMMARY;
        if (summaryPath) {
            fs.appendFileSync(summaryPath, buildMarkdownSummary(report));
        }
    } catch (err: any) {
        console.error("❌ Deep analysis failed:", err.message);
        process.exit(1);
    }
}

function buildMarkdownSummary(report: DeepFailureReport): string {
    const lines = [
        `## 🔬 AI Deep Failure Pattern Analysis`,
        `**Runs with issues fetched:** ${report.runsAnalysed} | **Generated:** ${report.generatedAt}`,
        ``,
        `### Executive Summary`,
        report.executiveSummary,
        ``,
        `### Per-Test Stability`
    ];
    if (report.perTestAnalyses.length > 0) {
        lines.push(`| Test | Stability | Priority | Recommendation |`);
        lines.push(`|------|-----------|----------|----------------|`);
        for (const a of report.perTestAnalyses) {
            lines.push(
                `| ${a.testTitle} | ${a.stabilityLabel} | ${a.priority} | ${a.recommendation} |`
            );
        }
    }
    if (report.coFailurePatterns.length > 0) {
        lines.push(``, `### Co-Failure Patterns`);
        for (const c of report.coFailurePatterns) {
            lines.push(
                `- **${c.tests.join(" + ")}** (${c.occurrences} occurrences): ${c.possibleCause}`
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
