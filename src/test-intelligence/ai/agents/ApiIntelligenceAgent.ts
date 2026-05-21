/**
 * ApiIntelligenceAgent.ts
 *
 * Loads captured network traces from a session trace file (written by
 * NetworkCapture), runs deterministic pre-analysis via ApiTrafficAnalyzer,
 * then calls Azure OpenAI to generate named workflow descriptions, engineering
 * insights, and an executive summary.
 *
 * Optionally generates:
 *   - Postman collection JSON  (--postman flag or GENERATE_POSTMAN=true)
 *   - OpenAPI paths stub JSON  (--openapi flag or GENERATE_OPENAPI=true)
 *
 * This agent follows the same architectural pattern as the existing agents:
 *   deterministic pre-processing → compact AI call → typed report output
 *
 * Required env vars (shared with existing agents):
 *   AZURE_OPENAI_ENDPOINT
 *   AZURE_OPENAI_API_KEY
 *   AZURE_OPENAI_DEPLOYMENT
 *
 * Optional env vars:
 *   GENERATE_POSTMAN   — "true" to include Postman collection in output
 *   GENERATE_OPENAPI   — "true" to include OpenAPI paths stub in output
 *   API_MAX_ENDPOINTS  — max endpoints sent to AI (default: 60)
 *
 * Usage:
 *   npx ts-node src/test-intelligence/ai/agents/ApiIntelligenceAgent.ts \
 *     ai-outputs/traces/network-traces.json \
 *     ai-outputs/reports/api-intelligence.json
 *   npm run ai:api
 */

import fs from "fs";
import path from "path";
import { getAzureOpenAIClient, getDeployment } from "../AzureOpenAIClient";
import {
    ApiTrafficAnalyzer,
    type TrafficAnalysis
} from "../utils/ApiTrafficAnalyzer";
import { API_INTELLIGENCE_SYSTEM_PROMPT } from "../prompts/api-intelligence.prompt";
import {
    generatePostmanCollection,
    generateOpenApiPaths
} from "../utils/ApiExporters";
import type {
    ApiTrace,
    ApiIntelligenceReport,
    ApiInsight,
    WorkflowSequence
} from "../../contracts/ApiTrace";

// ─────────────────────────────────────────────────────────────────────────────
// User prompt builder
// ─────────────────────────────────────────────────────────────────────────────

const MAX_ENDPOINTS = parseInt(process.env.API_MAX_ENDPOINTS ?? "60", 10);

function buildUserPrompt(analysis: TrafficAnalysis, sessionId: string): string {
    const topEndpoints = analysis.endpointProfiles.slice(0, MAX_ENDPOINTS);

    const endpointSummary = topEndpoints
        .map(
            (ep) =>
                `${ep.method} ${ep.normalizedPath} | domain=${ep.domain} | calls=${ep.callCount} | tests=${ep.testCount} | errors=${ep.errorCount} | p95=${ep.latency.p95}ms | repeated=${ep.isRepeatedCall}`
        )
        .join("\n");

    const workflowInput = analysis.workflowSequences
        .map((ws) => {
            const steps = ws.steps
                .map(
                    (s) =>
                        `  ${s.method} ${s.normalizedPath} → HTTP ${s.responseStatus} (${s.durationMs}ms, domain=${s.domain})`
                )
                .join("\n");
            return `Test: "${ws.testTitle}" | totalMs=${ws.totalDurationMs} | allSucceeded=${ws.allSucceeded}\nSteps:\n${steps}`;
        })
        .join("\n\n");

    const failedSummary =
        analysis.failedEndpoints.length > 0
            ? analysis.failedEndpoints
                  .map(
                      (f) =>
                          `${f.method} ${f.normalizedPath} — ${f.errorCount} errors — statuses: ${JSON.stringify(f.statusCodes)}`
                  )
                  .join("\n")
            : "None";

    const repeatedSummary =
        analysis.repeatedCallEndpoints.length > 0
            ? analysis.repeatedCallEndpoints
                  .map(
                      (r) =>
                          `${r.normalizedPath} — avg ${r.avgCallsPerTest}x per test (total ${r.callCount} calls, ${r.testCount} tests)`
                  )
                  .join("\n")
            : "None";

    const latencySummary =
        analysis.latencyOutliers.length > 0
            ? analysis.latencyOutliers
                  .map(
                      (l) =>
                          `${l.method} ${l.normalizedPath} — p95=${l.p95Ms}ms avg=${l.avgMs}ms`
                  )
                  .join("\n")
            : "None";

    const domainSummary = Object.entries(analysis.byDomain)
        .filter(([, endpoints]) => endpoints.length > 0)
        .map(
            ([domain, endpoints]) =>
                `${domain}: ${endpoints.slice(0, 5).join(", ")}${endpoints.length > 5 ? ` +${endpoints.length - 5} more` : ""}`
        )
        .join("\n");

    return `SESSION: ${sessionId}
Total traces captured: ${analysis.filteredTraces}
Unique endpoints: ${analysis.uniqueEndpoints}

── ENDPOINT INVENTORY (top ${topEndpoints.length}) ─────────────────────────
${endpointSummary}

── ENDPOINTS BY SIMS DOMAIN ────────────────────────────────────────────────
${domainSummary}

── FAILED ENDPOINTS ────────────────────────────────────────────────────────
${failedSummary}

── REPEATED CALL ENDPOINTS ─────────────────────────────────────────────────
${repeatedSummary}

── LATENCY OUTLIERS (p95 > 3000ms) ─────────────────────────────────────────
${latencySummary}

── WORKFLOW SEQUENCES (per test) ───────────────────────────────────────────
${workflowInput || "No workflow sequences detected (fewer than 2 API calls per test)."}

Generate workflow names and descriptions for every testTitle listed above.
Generate insights from the data patterns above.
Generate an executive summary suitable for non-technical finance stakeholders.`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Markdown summary for GitHub Actions step summary
// ─────────────────────────────────────────────────────────────────────────────

function buildMarkdownSummary(report: ApiIntelligenceReport): string {
    const lines: string[] = [
        "## 🔌 API Intelligence Report",
        "",
        `**Session:** ${report.sessionId}`,
        `**Generated:** ${report.generatedAt}`,
        `**Traces captured:** ${report.totalTraces} (${report.filteredTraces} after filtering)`,
        `**Unique endpoints:** ${report.uniqueEndpoints}`,
        "",
        "### 📋 Executive Summary",
        report.executiveSummary,
        ""
    ];

    if (report.insights.length > 0) {
        lines.push("### 💡 Key Insights", "");
        for (const insight of report.insights.slice(0, 5)) {
            const icon =
                insight.severity === "High"
                    ? "🔴"
                    : insight.severity === "Medium"
                      ? "🟡"
                      : insight.severity === "Low"
                        ? "🟢"
                        : "ℹ️";
            lines.push(`${icon} **${insight.title}** — ${insight.description}`);
        }
        lines.push("");
    }

    if (report.failedEndpoints.length > 0) {
        lines.push("### ❌ Failed Endpoints", "");
        for (const f of report.failedEndpoints.slice(0, 5)) {
            lines.push(
                `- \`${f.method} ${f.normalizedPath}\` — ${f.errorCount} errors`
            );
        }
        lines.push("");
    }

    return lines.join("\n");
}

// ─────────────────────────────────────────────────────────────────────────────
// Main agent function
// ─────────────────────────────────────────────────────────────────────────────

export async function runApiIntelligence(
    tracesPath: string,
    options: {
        generatePostman?: boolean;
        generateOpenApi?: boolean;
        sessionId?: string;
    } = {}
): Promise<ApiIntelligenceReport> {
    if (!fs.existsSync(tracesPath)) {
        throw new Error(`Traces file not found: ${tracesPath}`);
    }

    const raw: unknown = JSON.parse(fs.readFileSync(tracesPath, "utf-8"));

    // Support two input formats:
    //   1. Plain ApiTrace[] array  — written by NetworkTraceStore (real captures)
    //   2. { _isMockData: true, traces: ApiTrace[] } — seed/mock file
    // The _isMockData flag is propagated to the output report so the HTML
    // dashboard can render a "🧪 Mock Data" banner accordingly.
    let rawTraces: ApiTrace[];
    let isMockInput = false;

    if (Array.isArray(raw)) {
        rawTraces = raw as ApiTrace[];
    } else if (
        raw !== null &&
        typeof raw === "object" &&
        "_isMockData" in raw
    ) {
        isMockInput = (raw as Record<string, unknown>)._isMockData === true;
        rawTraces =
            ((raw as Record<string, unknown>).traces as ApiTrace[]) ?? [];
    } else {
        rawTraces = [];
    }

    const sessionId =
        options.sessionId ?? path.basename(path.dirname(tracesPath));

    // ── When input is the seed/mock placeholder — skip all analysis ──────
    // Write a minimal report flagged as _captureNotRun so the dashboard
    // renders a clean "no data" activation prompt instead of fake data.
    if (isMockInput) {
        return {
            _captureNotRun: true as const,
            generatedAt: new Date().toISOString(),
            sessionId,
            totalTraces: 0,
            filteredTraces: 0,
            uniqueEndpoints: 0,
            endpointProfiles: [],
            workflowSequences: [],
            byDomain: {} as Record<string, string[]>,
            failedEndpoints: [],
            repeatedCallEndpoints: [],
            latencyOutliers: [],
            insights: [],
            executiveSummary: "",
            postmanCollection: null,
            openApiPaths: null
        } as unknown as ApiIntelligenceReport;
    }

    // ── Deterministic pre-analysis (no AI) ───────────────────────────────
    const analysis = ApiTrafficAnalyzer.analyze(rawTraces);

    // ── AI call ──────────────────────────────────────────────────────────
    let parsedAI: Record<string, unknown> = {};

    if (analysis.filteredTraces > 0) {
        const client = getAzureOpenAIClient();
        const deployment = getDeployment();

        const response = await client.chat.completions.create({
            model: deployment,
            messages: [
                { role: "system", content: API_INTELLIGENCE_SYSTEM_PROMPT },
                { role: "user", content: buildUserPrompt(analysis, sessionId) }
            ],
            response_format: { type: "json_object" },
            temperature: 0.15,
            max_tokens: 3500
        });

        const raw = response.choices[0]?.message?.content ?? "{}";
        try {
            parsedAI = JSON.parse(raw);
        } catch {
            console.warn(
                "⚠️  AI returned non-JSON response — using empty fallback."
            );
        }
    }

    // ── Merge AI workflow names back into workflow sequences ──────────────
    const aiWorkflows: Array<{
        testTitle: string;
        name: string;
        description: string;
    }> =
        (parsedAI.workflowSequences as
            | Array<{ testTitle: string; name: string; description: string }>
            | undefined) ?? [];

    const aiWorkflowMap = new Map(aiWorkflows.map((w) => [w.testTitle, w]));

    const mergedWorkflows: WorkflowSequence[] = analysis.workflowSequences.map(
        (ws) => {
            const ai = aiWorkflowMap.get(ws.testTitle);
            return {
                ...ws,
                name: ai?.name ?? `Workflow: ${ws.testTitle.slice(0, 40)}`,
                description: ai?.description ?? ""
            };
        }
    );

    // ── Exports ──────────────────────────────────────────────────────────
    const generatePostman =
        options.generatePostman ?? process.env.GENERATE_POSTMAN === "true";
    const generateOpenApi =
        options.generateOpenApi ?? process.env.GENERATE_OPENAPI === "true";

    const postmanCollection = generatePostman
        ? JSON.stringify(
              generatePostmanCollection(analysis.endpointProfiles, sessionId),
              null,
              2
          )
        : null;

    const openApiPaths = generateOpenApi
        ? JSON.stringify(
              generateOpenApiPaths(analysis.endpointProfiles),
              null,
              2
          )
        : null;

    return {
        ...(isMockInput ? { _isMockData: true as const } : {}),
        generatedAt: new Date().toISOString(),
        sessionId,
        totalTraces: rawTraces.length,
        filteredTraces: analysis.filteredTraces,
        uniqueEndpoints: analysis.uniqueEndpoints,
        endpointProfiles: analysis.endpointProfiles,
        workflowSequences: mergedWorkflows,
        byDomain: analysis.byDomain,
        failedEndpoints: analysis.failedEndpoints,
        repeatedCallEndpoints: analysis.repeatedCallEndpoints,
        latencyOutliers: analysis.latencyOutliers,
        insights: (parsedAI.insights as ApiInsight[] | undefined) ?? [],
        executiveSummary:
            (parsedAI.executiveSummary as string | undefined) ?? "",
        postmanCollection,
        openApiPaths
    };
}

// ─────────────────────────────────────────────────────────────────────────────
// CLI
// ─────────────────────────────────────────────────────────────────────────────

async function main() {
    const inputPath =
        process.argv[2] ?? "ai-outputs/traces/network-traces.json";
    const outputPath =
        process.argv[3] ?? "ai-outputs/reports/api-intelligence.json";
    const generatePostman =
        process.argv.includes("--postman") ||
        process.env.GENERATE_POSTMAN === "true";
    const generateOpenApi =
        process.argv.includes("--openapi") ||
        process.env.GENERATE_OPENAPI === "true";

    if (!fs.existsSync(inputPath)) {
        console.error(`❌ Traces file not found: ${inputPath}`);
        console.error(
            `   Run a Playwright test with NetworkCapture enabled first.`
        );
        process.exit(1);
    }

    console.log(`\n🔌 ApiIntelligenceAgent starting`);
    console.log(`   Input : ${inputPath}`);
    console.log(`   Output: ${outputPath}`);
    if (generatePostman) console.log(`   Postman collection: enabled`);
    if (generateOpenApi) console.log(`   OpenAPI paths: enabled`);

    try {
        const report = await runApiIntelligence(inputPath, {
            generatePostman,
            generateOpenApi
        });

        fs.mkdirSync(path.dirname(outputPath), { recursive: true });
        fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));

        console.log(`\n✅ API intelligence report written to ${outputPath}`);
        console.log(
            `   Traces: ${report.totalTraces} captured, ${report.filteredTraces} after filtering`
        );
        console.log(`   Unique endpoints: ${report.uniqueEndpoints}`);
        console.log(
            `   Workflows detected: ${report.workflowSequences.length}`
        );
        console.log(`   Insights generated: ${report.insights.length}`);

        if (report.failedEndpoints.length > 0) {
            console.log(
                `\n⚠️  Failed endpoints (${report.failedEndpoints.length}):`
            );
            for (const f of report.failedEndpoints.slice(0, 5)) {
                console.log(
                    `   • ${f.method} ${f.normalizedPath} — ${f.errorCount} errors`
                );
            }
        }

        if (report.repeatedCallEndpoints.length > 0) {
            console.log(
                `\n🔁 Repeated call patterns (${report.repeatedCallEndpoints.length}):`
            );
            for (const r of report.repeatedCallEndpoints.slice(0, 3)) {
                console.log(
                    `   • ${r.normalizedPath} — avg ${r.avgCallsPerTest}x per test`
                );
            }
        }

        console.log(`\n📌 Executive Summary:\n${report.executiveSummary}`);

        if (generatePostman && report.postmanCollection) {
            const postmanPath = outputPath.replace(".json", "-postman.json");
            fs.writeFileSync(postmanPath, report.postmanCollection);
            console.log(`\n📬 Postman collection written to ${postmanPath}`);
        }

        if (generateOpenApi && report.openApiPaths) {
            const openApiPath = outputPath.replace(
                ".json",
                "-openapi-paths.json"
            );
            fs.writeFileSync(openApiPath, report.openApiPaths);
            console.log(`\n📄 OpenAPI paths written to ${openApiPath}`);
        }

        const summaryPath = process.env.GITHUB_STEP_SUMMARY;
        if (summaryPath) {
            fs.appendFileSync(summaryPath, buildMarkdownSummary(report));
        }
    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error("❌ API intelligence analysis failed:", msg);
        process.exit(1);
    }
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
