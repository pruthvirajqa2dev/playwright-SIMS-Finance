/**
 * DatabaseIntegrityAgent.ts
 *
 * Runs SQL integrity checks against the SIMS Finance database before and
 * after a Playwright test run to detect data corruption, orphaned records,
 * transaction loss, and reference data drift that UI tests cannot catch.
 *
 * This addresses:
 *   ▸ "Transactions went missing — data integrity issues"
 *   ▸ "No database testing was done"
 *   ▸ "Years are maintained with IDs in production and testing"
 *   ▸ "Input fields needing to be repopulated/emptied randomly"
 *      (often caused by orphaned cost centre / inactive reference data)
 *
 * Modes:
 *   pre   — Snapshot row counts for key tables before the test run.
 *            Saves to db-snapshot-before.json. Run this in CI BEFORE playwright test.
 *   post  — Diff row counts against the pre-snapshot, run all integrity checks,
 *            send violations to AI for root-cause analysis.
 *            Run this in CI AFTER playwright test.
 *   check — Run all integrity checks without pre/post comparison.
 *            Useful for ad-hoc investigation of a known issue.
 *
 * Required env vars:
 *   DB_SERVER     — SQL Server hostname or IP (e.g. sql-sims-uat.contoso.local)
 *   DB_DATABASE   — Database name (e.g. SIMSFinance_UAT)
 *   DB_USER       — SQL login username
 *   DB_PASSWORD   — SQL login password
 *
 * Optional env vars:
 *   DB_PORT                — default 1433
 *   DB_ENCRYPT             — "false" to disable TLS (insecure — local only); default "true"
 *   DB_TRUST_SERVER_CERT   — "true" for self-signed certs in dev/UAT; default "false"
 *   DB_CONNECT_TIMEOUT_MS  — default 15000
 *   DB_CHECKS_CONFIG       — path to checks JSON; default src/ai/config/db-integrity-checks.json
 *
 * Usage:
 *   npx ts-node src/ai/agents/DatabaseIntegrityAgent.ts --mode check ai-db-integrity-report.json
 *   npx ts-node src/ai/agents/DatabaseIntegrityAgent.ts --mode pre
 *   npx ts-node src/ai/agents/DatabaseIntegrityAgent.ts --mode post ai-db-integrity-report.json
 *   npx ts-node src/ai/agents/DatabaseIntegrityAgent.ts --dry-run
 *
 *   npm run ai:db:check
 *   npm run ai:db:pre   (before playwright test)
 *   npm run ai:db:post  (after playwright test)
 */

import fs from "fs";
import path from "path";
import * as sql from "mssql";
import { getAzureOpenAIClient, getDeployment } from "../AzureOpenAIClient";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface IntegrityCheckConfig {
    id: string;
    name: string;
    description: string;
    severity: "Critical" | "High" | "Medium" | "Low";
    category: string;
    enabled: boolean;
    query: string;
}

interface ChecksConfig {
    rowCountTables: string[];
    checks: IntegrityCheckConfig[];
}

export interface CheckResult {
    id: string;
    name: string;
    description: string;
    severity: "Critical" | "High" | "Medium" | "Low";
    category: string;
    violationCount: number;
    status: "Pass" | "Fail" | "Error" | "Skipped";
    errorMessage?: string;
    query: string;
}

export interface TableSnapshot {
    tableName: string;
    rowCount: number;
    capturedAt: string;
}

export interface RowCountDelta {
    tableName: string;
    before: number;
    after: number;
    delta: number;
    verdict: "Expected" | "Unexpected Loss" | "Unexpected Gain" | "No Change";
}

export interface DatabaseIntegrityReport {
    generatedAt: string;
    mode: "check" | "pre" | "post";
    database: string;
    server: string;
    environment: string;
    checksRun: number;
    totalViolations: number;
    criticalViolations: number;
    highViolations: number;
    riskLevel: "Critical" | "High" | "Medium" | "Low" | "Clean";
    checks: CheckResult[];
    rowCountSnapshot?: TableSnapshot[];
    rowCountDeltas?: RowCountDelta[];
    actionItems: string[];
    executiveSummary: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// DB connection config from environment
// ─────────────────────────────────────────────────────────────────────────────

function buildDbConfig(): sql.config {
    const server = process.env.DB_SERVER ?? "";
    const database = process.env.DB_DATABASE ?? "";
    const user = process.env.DB_USER;
    const password = process.env.DB_PASSWORD;

    if (!server || !database) {
        throw new Error(
            "DB_SERVER and DB_DATABASE must be set in src/config/.env\n" +
                "Example:\n" +
                "  DB_SERVER=sql-sims-uat.contoso.local\n" +
                "  DB_DATABASE=SIMSFinance_UAT\n" +
                "  DB_USER=sims_agent\n" +
                "  DB_PASSWORD=<password>"
        );
    }

    return {
        server,
        database,
        user,
        password,
        port: parseInt(process.env.DB_PORT ?? "1433", 10),
        connectionTimeout: parseInt(
            process.env.DB_CONNECT_TIMEOUT_MS ?? "15000",
            10
        ),
        options: {
            encrypt: process.env.DB_ENCRYPT !== "false",
            trustServerCertificate: process.env.DB_TRUST_SERVER_CERT === "true"
        }
    };
}

// ─────────────────────────────────────────────────────────────────────────────
// Load checks config
// ─────────────────────────────────────────────────────────────────────────────

function loadChecksConfig(): ChecksConfig {
    const configPath =
        process.env.DB_CHECKS_CONFIG ??
        path.resolve(__dirname, "../../ai/config/db-integrity-checks.json");

    if (!fs.existsSync(configPath)) {
        throw new Error(
            `Checks config not found: ${configPath}\n` +
                "Expected at src/ai/config/db-integrity-checks.json"
        );
    }
    return JSON.parse(fs.readFileSync(configPath, "utf-8")) as ChecksConfig;
}

// ─────────────────────────────────────────────────────────────────────────────
// Database operations
// ─────────────────────────────────────────────────────────────────────────────

async function runCheck(
    pool: sql.ConnectionPool,
    check: IntegrityCheckConfig
): Promise<CheckResult> {
    if (!check.enabled) {
        return {
            id: check.id,
            name: check.name,
            description: check.description,
            severity: check.severity,
            category: check.category,
            violationCount: 0,
            status: "Skipped",
            query: check.query
        };
    }

    try {
        const result = await pool.request().query(check.query);
        const row = result.recordset[0] ?? {};
        // Accept violation_count or the first numeric column
        const raw = parseInt(
            String(row["violation_count"] ?? row[Object.keys(row)[0]] ?? "0"),
            10
        );
        const violationCount = Number.isNaN(raw) ? 0 : raw;
        return {
            id: check.id,
            name: check.name,
            description: check.description,
            severity: check.severity,
            category: check.category,
            violationCount,
            status: Number.isNaN(raw)
                ? "Error"
                : violationCount > 0
                  ? "Fail"
                  : "Pass",
            errorMessage: Number.isNaN(raw)
                ? `Query returned non-numeric result: ${JSON.stringify(row)}`
                : undefined,
            query: check.query
        };
    } catch (err: any) {
        return {
            id: check.id,
            name: check.name,
            description: check.description,
            severity: check.severity,
            category: check.category,
            violationCount: 0,
            status: "Error",
            errorMessage: err.message,
            query: check.query
        };
    }
}

async function captureRowCounts(
    pool: sql.ConnectionPool,
    tables: string[]
): Promise<TableSnapshot[]> {
    const snapshots: TableSnapshot[] = [];
    const capturedAt = new Date().toISOString();

    for (const tableName of tables) {
        try {
            // Use NOLOCK hint for non-blocking snapshot reads
            const result = await pool
                .request()
                .query(
                    `SELECT COUNT(*) AS row_count FROM ${tableName} WITH (NOLOCK)`
                );
            const rowCount = parseInt(
                String(result.recordset[0]?.row_count ?? "0"),
                10
            );
            snapshots.push({ tableName, rowCount, capturedAt });
        } catch {
            // Table may not exist in this schema variant — skip silently
            snapshots.push({ tableName, rowCount: -1, capturedAt });
        }
    }

    return snapshots;
}

function computeRowCountDeltas(
    before: TableSnapshot[],
    after: TableSnapshot[]
): RowCountDelta[] {
    const beforeMap = new Map(before.map((s) => [s.tableName, s.rowCount]));
    return after
        .filter((s) => s.rowCount >= 0) // skip tables that errored
        .map((a) => {
            const b = beforeMap.get(a.tableName) ?? 0;
            const delta = a.rowCount - b;
            // Unexpected Loss: rows disappeared during a test run (data integrity red flag)
            const verdict: RowCountDelta["verdict"] =
                delta === 0
                    ? "No Change"
                    : delta > 0
                      ? "Unexpected Gain"
                      : "Unexpected Loss";
            return {
                tableName: a.tableName,
                before: b,
                after: a.rowCount,
                delta,
                verdict
            };
        })
        .filter((d) => d.delta !== 0); // only report changes
}

// ─────────────────────────────────────────────────────────────────────────────
// Dry-run mode — show what would be executed without a real DB
// ─────────────────────────────────────────────────────────────────────────────

function dryRun(config: ChecksConfig) {
    console.log(
        "\n🧪 DRY RUN — showing queries without connecting to database\n"
    );
    console.log(
        `📋 Row count snapshot tables (${config.rowCountTables.length}):`
    );
    config.rowCountTables.forEach((t) => console.log(`  • ${t}`));

    console.log(`\n🔍 Integrity checks (${config.checks.length}):`);
    for (const c of config.checks) {
        const status = c.enabled ? "✓" : "⊘ disabled";
        console.log(`\n  [${c.id}] ${c.name} (${c.severity}) [${status}]`);
        console.log(`  ${c.description}`);
        console.log(`  SQL: ${c.query}`);
    }
    console.log(
        "\n💡 To run for real, set DB_SERVER, DB_DATABASE, DB_USER, DB_PASSWORD in src/config/.env"
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Prompt engineering
// ─────────────────────────────────────────────────────────────────────────────

import { DB_INTEGRITY_SYSTEM_PROMPT } from "../prompts/db-integrity.prompt";

const SYSTEM_PROMPT = DB_INTEGRITY_SYSTEM_PROMPT;

function buildUserPrompt(
    mode: string,
    database: string,
    checks: CheckResult[],
    deltas?: RowCountDelta[]
): string {
    const violations = checks.filter((c) => c.status === "Fail");
    const errors = checks.filter((c) => c.status === "Error");
    const passed = checks.filter((c) => c.status === "Pass");

    const checkTable = violations
        .map(
            (c) =>
                `  [${c.id}] ${c.name} — ${c.violationCount} violation(s)
    Severity: ${c.severity} | Category: ${c.category}
    Description: ${c.description}
    SQL executed: ${c.query}`
        )
        .join("\n\n");

    const errorTable =
        errors.length > 0
            ? `── QUERY ERRORS (check could not execute — possible schema mismatch or permission issue) ──\n` +
              errors
                  .map(
                      (e) =>
                          `  [${e.id}] ${e.name} (${e.severity})\n    Error: ${e.errorMessage}\n    SQL attempted: ${e.query}`
                  )
                  .join("\n\n")
            : "";

    const deltaSection =
        deltas && deltas.length > 0
            ? `── ROW COUNT DELTAS (pre vs post test run) ─────────────────────────────────\n` +
              deltas
                  .map(
                      (d) =>
                          `  ${d.tableName}: ${d.before} → ${d.after} (${d.delta > 0 ? "+" : ""}${d.delta} rows) — ${d.verdict}`
                  )
                  .join("\n")
            : deltas !== undefined
              ? "No row count changes detected between pre and post snapshots."
              : "";

    return `
Database: ${database} | Mode: ${mode}

Integrity check summary:
  Total checks run : ${checks.filter((c) => c.status !== "Skipped").length}
  Violations found : ${violations.length}
  Errors (query failed): ${errors.length}
  Passed           : ${passed.length}

── VIOLATIONS ───────────────────────────────────────────────────────────────

${violations.length === 0 ? "No violations detected." : checkTable}

${errorTable}

${deltaSection}
`.trim();
}

// ─────────────────────────────────────────────────────────────────────────────
// Main agent function
// ─────────────────────────────────────────────────────────────────────────────

export async function runDatabaseIntegrityCheck(
    mode: "check" | "pre" | "post",
    snapshotPath: string = "db-snapshot-before.json"
): Promise<DatabaseIntegrityReport> {
    const config = loadChecksConfig();
    const dbConfig = buildDbConfig();

    console.log(
        `\n🔌 Connecting to ${dbConfig.server}/${dbConfig.database}...`
    );
    const pool = await sql.connect(dbConfig);
    console.log("✅ Connected.\n");

    let checks: CheckResult[] = [];
    let snapshot: TableSnapshot[] | undefined;
    let deltas: RowCountDelta[] | undefined;

    // ── PRE mode: just snapshot row counts ──────────────────────────────────
    if (mode === "pre") {
        console.log(
            `📸 Snapshotting row counts for ${config.rowCountTables.length} tables...`
        );
        snapshot = await captureRowCounts(pool, config.rowCountTables);
        fs.mkdirSync(require("path").dirname(snapshotPath), {
            recursive: true
        });
        fs.writeFileSync(snapshotPath, JSON.stringify(snapshot, null, 2));
        await pool.close();

        console.log(`✅ Snapshot saved to ${snapshotPath}`);
        snapshot.forEach((s) =>
            console.log(`  ${s.tableName.padEnd(36)} ${s.rowCount} rows`)
        );

        // Return a minimal report for pre-mode (no AI call needed)
        return {
            generatedAt: new Date().toISOString(),
            mode: "pre",
            database: dbConfig.database!,
            server: dbConfig.server!,
            environment: process.env.TEST_ENV ?? "Unknown",
            checksRun: 0,
            totalViolations: 0,
            criticalViolations: 0,
            highViolations: 0,
            riskLevel: "Clean",
            checks: [],
            rowCountSnapshot: snapshot,
            actionItems: [],
            executiveSummary: `Pre-run snapshot captured for ${config.rowCountTables.length} tables. Run ai:db:post after the test suite to compare.`
        };
    }

    // ── POST mode: diff + run checks ────────────────────────────────────────
    if (mode === "post") {
        if (!fs.existsSync(snapshotPath)) {
            console.warn(
                `⚠️  Pre-run snapshot not found at ${snapshotPath}. Running checks only (no row count diff).`
            );
        } else {
            console.log(`📊 Loading pre-run snapshot from ${snapshotPath}...`);
            const before: TableSnapshot[] = JSON.parse(
                fs.readFileSync(snapshotPath, "utf-8")
            );
            const after = await captureRowCounts(pool, config.rowCountTables);
            deltas = computeRowCountDeltas(before, after);

            if (deltas.length === 0) {
                console.log("  ✓ Row counts unchanged.\n");
            } else {
                console.log(`  ⚠️  Row count changes detected:`);
                deltas.forEach((d) =>
                    console.log(
                        `    ${d.tableName}: ${d.before} → ${d.after} (${d.delta > 0 ? "+" : ""}${d.delta}) [${d.verdict}]`
                    )
                );
            }
        }
    }

    // ── Run all integrity checks (both 'check' and 'post' modes) ────────────
    console.log(
        `🔍 Running ${config.checks.filter((c) => c.enabled).length} integrity checks...`
    );
    for (const check of config.checks) {
        process.stdout.write(`  [${check.id}] ${check.name} ...`);
        const result = await runCheck(pool, check);
        checks.push(result);
        if (result.status === "Pass") process.stdout.write(" ✓\n");
        else if (result.status === "Skipped")
            process.stdout.write(" (skipped)\n");
        else if (result.status === "Error")
            process.stdout.write(` ❌ ERROR: ${result.errorMessage}\n`);
        else
            process.stdout.write(
                ` ⚠️  ${result.violationCount} violation(s)\n`
            );
    }

    await pool.close();

    const violations = checks.filter((c) => c.status === "Fail");
    const criticalViolations = violations.filter(
        (c) => c.severity === "Critical"
    ).length;
    const highViolations = violations.filter(
        (c) => c.severity === "High"
    ).length;

    const riskLevel: DatabaseIntegrityReport["riskLevel"] =
        criticalViolations > 0
            ? "Critical"
            : highViolations > 0
              ? "High"
              : violations.length > 0
                ? "Medium"
                : "Clean";

    // Add row count losses to violations count
    const rowLosses = (deltas ?? []).filter(
        (d) => d.verdict === "Unexpected Loss"
    ).length;
    const errors = checks.filter((c) => c.status === "Error");

    console.log(
        `\n📊 Results: ${violations.length} violation(s) found | Risk Level: ${riskLevel}`
    );
    if (rowLosses > 0)
        console.log(
            `  ⚠️  ${rowLosses} table(s) lost rows during the test run!`
        );

    if (violations.length === 0 && rowLosses === 0 && errors.length === 0) {
        console.log("  ✅ All checks passed — database is clean.");
        return {
            generatedAt: new Date().toISOString(),
            mode,
            database: dbConfig.database!,
            server: dbConfig.server!,
            environment: process.env.TEST_ENV ?? "Unknown",
            checksRun: checks.filter((c) => c.status !== "Skipped").length,
            totalViolations: 0,
            criticalViolations: 0,
            highViolations: 0,
            riskLevel: "Clean",
            checks,
            rowCountDeltas: deltas,
            actionItems: [
                "No action required — all database integrity checks passed."
            ],
            executiveSummary:
                "All database integrity checks passed with no violations detected. The SIMS Finance database is consistent and clean."
        };
    }

    console.log(`\n🤖 Sending violations to AI for root-cause analysis...`);

    const ai = getAzureOpenAIClient();
    const deployment = getDeployment();

    const response = await ai.chat.completions.create({
        model: deployment,
        messages: [
            { role: "system", content: SYSTEM_PROMPT },
            {
                role: "user",
                content: buildUserPrompt(
                    mode,
                    dbConfig.database!,
                    checks,
                    deltas
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
        mode,
        database: dbConfig.database!,
        server: dbConfig.server!,
        environment: process.env.TEST_ENV ?? "Unknown",
        checksRun: checks.filter((c) => c.status !== "Skipped").length,
        totalViolations: violations.length + rowLosses,
        criticalViolations,
        highViolations,
        riskLevel,
        checks,
        rowCountDeltas: deltas,
        actionItems: parsed.actionItems ?? [],
        executiveSummary: parsed.executiveSummary ?? ""
    };
}

// ─────────────────────────────────────────────────────────────────────────────
// CLI
// ─────────────────────────────────────────────────────────────────────────────

async function main() {
    const args = process.argv.slice(2);
    const isDryRun = args.includes("--dry-run");

    if (isDryRun) {
        const config = loadChecksConfig();
        dryRun(config);
        return;
    }

    const modeIdx = args.indexOf("--mode");
    const modeArg = modeIdx !== -1 ? args[modeIdx + 1] : "check";

    if (!["check", "pre", "post"].includes(modeArg)) {
        console.error(
            `❌ Invalid mode: ${modeArg}. Use --mode check | pre | post`
        );
        process.exit(1);
    }
    const mode = modeArg as "check" | "pre" | "post";

    const positional = args.filter((a) => !a.startsWith("--") && a !== modeArg);
    const outputPath =
        mode === "pre"
            ? (positional[0] ?? "ai-outputs/reports/db-snapshot.json")
            : (positional[0] ?? "ai-outputs/reports/db-integrity.json");

    const snapshotPath = "ai-outputs/reports/db-snapshot.json";

    try {
        const report = await runDatabaseIntegrityCheck(mode, snapshotPath);

        if (mode !== "pre") {
            fs.mkdirSync(require("path").dirname(outputPath), {
                recursive: true
            });
            fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));
            console.log(`\n✅ DB integrity report written to ${outputPath}`);
            console.log(
                `\n🛡️  Risk Level: ${report.riskLevel} | Violations: ${report.totalViolations} (${report.criticalViolations} critical)`
            );

            if (report.actionItems.length > 0) {
                console.log(`\n🎯 Action Items:`);
                report.actionItems.forEach((item, i) =>
                    console.log(`  ${i + 1}. ${item}`)
                );
            }

            console.log(`\n📌 Executive Summary:\n${report.executiveSummary}`);

            const summaryPath = process.env.GITHUB_STEP_SUMMARY;
            if (summaryPath) {
                fs.appendFileSync(summaryPath, buildMarkdownSummary(report));
            }

            // Non-zero exit code when critical violations are found (useful for CI gates)
            if (report.criticalViolations > 0) {
                console.error(
                    `\n❌ ${report.criticalViolations} critical violation(s) found. Failing CI step.`
                );
                process.exit(1);
            }
        }
    } catch (err: any) {
        console.error("❌ Database integrity check failed:", err.message);
        if (err.message.includes("DB_SERVER")) {
            console.error(
                "\n💡 Tip: Add DB_SERVER, DB_DATABASE, DB_USER, DB_PASSWORD to src/config/.env"
            );
            console.error(
                "   Or run with --dry-run to preview queries without a DB connection."
            );
        }
        process.exit(1);
    }
}

function buildMarkdownSummary(report: DatabaseIntegrityReport): string {
    const emoji =
        report.riskLevel === "Critical" || report.riskLevel === "High"
            ? "🔴"
            : report.riskLevel === "Medium"
              ? "🟡"
              : "🟢";

    const lines = [
        `## ${emoji} AI Database Integrity Report`,
        `**Database:** ${report.database} | **Mode:** ${report.mode} | **Risk:** ${report.riskLevel}`,
        `**Violations:** ${report.totalViolations} (${report.criticalViolations} critical, ${report.highViolations} high)`,
        ``,
        `### Executive Summary`,
        report.executiveSummary,
        ``
    ];

    const violations = report.checks.filter((c) => c.status === "Fail");
    if (violations.length > 0) {
        lines.push(`### Violations`);
        lines.push(`| Check | Severity | Violations | Description |`);
        lines.push(`|-------|----------|------------|-------------|`);
        for (const c of violations) {
            lines.push(
                `| ${c.name} | ${c.severity} | ${c.violationCount} | ${c.description} |`
            );
        }
    }

    if (report.rowCountDeltas && report.rowCountDeltas.length > 0) {
        lines.push(``, `### Row Count Changes`);
        lines.push(`| Table | Before | After | Delta | Verdict |`);
        lines.push(`|-------|--------|-------|-------|---------|`);
        for (const d of report.rowCountDeltas) {
            lines.push(
                `| ${d.tableName} | ${d.before} | ${d.after} | ${d.delta > 0 ? "+" : ""}${d.delta} | ${d.verdict} |`
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
