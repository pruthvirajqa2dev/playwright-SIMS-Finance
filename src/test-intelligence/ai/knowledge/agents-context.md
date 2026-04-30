# AI Agents Context — SIMS Finance Playwright Suite

> This document is the canonical context summary for the AI agents in this repository.
> It is intended to be passed to other AI systems as grounding context.

---

## Application Under Test

**SIMS Finance** — an enterprise school finance management web application.
Key functional areas covered by the test suite:

- Purchase orders and invoices
- VAT and XQuery reports
- Crystal Reports generation and download
- Email distribution workflows
- File uploads and PDF validation

---

## Repository Layout (AI layer)

```
src/ai/
  AzureOpenAIClient.ts          — Singleton Azure OpenAI SDK wrapper
  agents/
    TrendPatternAgent.ts        — Macro trend analysis across all historical runs
    DeepFailurePatternAgent.ts  — Per-test failure profiling for runs with issues
    RegressionDeltaAgent.ts     — Before/after pivot-date regression comparison
    DatabaseIntegrityAgent.ts   — SQL integrity checks against SIMS Finance DB
  utils/
    GitHubReportsClient.ts      — Fetches per-run test-results.json from gh-pages
  config/
    db-integrity-checks.json    — Configurable SQL check definitions
  knowledge/
    uiGraph.json                — UI element knowledge graph
    agents-context.md           — THIS FILE
```

---

## npm Scripts

| Script          | Purpose                                                                      |
| --------------- | ---------------------------------------------------------------------------- |
| `ai:trends`     | Macro trend report → `ai-trend-report.json`                                  |
| `ai:deep`       | Per-test deep failure analysis → `ai-deep-failure-report.json`               |
| `ai:regression` | Before/after regression delta → `ai-regression-delta-report.json`            |
| `ai:db:check`   | Ad-hoc DB integrity check (no pre/post diff) → `ai-db-integrity-report.json` |
| `ai:db:pre`     | Snapshot table row counts before test run → `db-snapshot-before.json`        |
| `ai:db:post`    | Diff + integrity check after test run → `ai-db-integrity-report.json`        |
| `ai:db:dry-run` | List what DB checks would run (no DB connection needed)                      |
| `ai:report`     | Combine all JSON reports → `ai-report.html`                                  |
| `ai:full`       | `ai:trends && ai:deep && ai:regression && ai:db:check && ai:report`          |

---

## Agent 1 — TrendPatternAgent

### Purpose

Macro-level, run-aggregate view. Reads the local `test-results-history/consolidated.json`
(no GitHub API calls needed). Identifies patterns across **all** historical runs in seconds.

### Input

`consolidated.json` — array of `ConsolidatedRun` objects:

```ts
{
  timestamp: string;          // "YYYY-MM-DD_HH-MM"
  environment?: string;
  counts: { executed, passed, failed, flaky };
  executionTimeSec: number;
}
```

### Pre-processing (local, before AI call)

- Enriches each run with: `date`, `time`, `dayOfWeek`, `hourUTC`, `successRate`,
  `isCompleteFailure`, `hasFailures`, `hasFlakiness`, `execTimeLabel`
  (`fast` / `normal` / `slow` / `very slow` relative to median)
- Computes aggregate stats: fully-passed count, failure/flaky/outage rates,
  day-of-week breakdown, execution-time outliers, consecutive failure clusters,
  and a trend signal (last 7 runs vs previous 7 runs)

### AI Call

- **Model**: Azure OpenAI (`gpt-4o` by default, env `AZURE_OPENAI_DEPLOYMENT`)
- **Temperature**: 0.15 | **Max tokens**: 2500
- **Response format**: `json_object`
- Returns `TrendReport` (health score, trend direction, patterns, risk periods,
  action items, executive summary)

### Output Schema (`TrendReport`)

```ts
{
  generatedAt: string;
  runsAnalysed: number;
  dateRange: { from: string; to: string };
  overallHealthScore: number;       // 0–100
  trendDirection: "Improving" | "Stable" | "Degrading";
  successRate: number;              // % of runs fully passed
  flakyRate: number;                // % of runs with ≥1 flaky test
  patterns: TrendPattern[];
  riskPeriods: Array<{ period, description }>;
  actionItems: string[];
  executiveSummary: string;
}
```

### Pattern Types

`Recurring Outage` | `Chronic Flakiness` | `Execution Time Anomaly` |
`Time-of-Day Risk` | `Day-of-Week Risk` | `Improving Trend` | `Degrading Trend` |
`Isolated Incident` | `Other`

### Severity Rules (embedded in system prompt)

- Complete outage (all tests fail) → always **High**
- Flaky tests (eventually pass) → **less critical** than hard failures
- Execution time > 3× median → indicates retries firing

---

## Agent 2 — DeepFailurePatternAgent

### Purpose

Micro-level, per-test view. Filters the consolidated history to runs with failures
or flakiness, fetches the raw `test-results.json` for each from GitHub's `gh-pages`
branch, aggregates per-test reliability profiles, detects co-failure pairs, then asks
the AI to identify which specific tests are unreliable and why.

### Input

Same `consolidated.json` as TrendPatternAgent **plus** live data fetched from:

```
https://raw.githubusercontent.com/{OWNER}/{REPO}/gh-pages/published-reports/{timestamp}/test-results.json
```

### Filtering

Only fetches runs where `counts.failed > 0 || counts.flaky > 0` (up to `DEEP_MAX_RUNS`,
default 15). Rate-limited to 250 ms between GitHub API calls.

### Per-Test Profile (`PerTestProfile`)

Built by `GitHubReportsClient.extractTestOutcomes()`, then aggregated across all fetched runs:

```ts
{
  testTitle: string;
  totalRuns: number;
  failureCount: number;    flakyCount: number;    passCount: number;
  failureRate: number;     flakyRate: number;      // 0–100
  avgDurationMs: number;
  lastSeen: string;
  errorSamples: string[];  // up to 3 distinct 150-char error snippets
}
```

Profiles are sorted by `failureRate + flakyRate * 0.5` descending.

### Co-Failure Detection

Pairs of tests that fail hard (status `failed` / `timedOut`) **in the same run** across
≥ 2 runs. Top 5 pairs returned, with AI-generated `possibleCause` hypothesis.

### AI Call

- **Model**: Same Azure OpenAI deployment
- **Temperature**: 0.15 | **Max tokens**: 3000
- **Response format**: `json_object`

### Output Schema (`DeepFailureReport`)

```ts
{
  generatedAt: string;
  runsAnalysed: number;
  runsWithIssues: number;
  perTestProfiles: PerTestProfile[];
  perTestAnalyses: PerTestAnalysis[];     // AI-generated per-test label + recommendation
  coFailurePatterns: CoFailurePattern[];  // pairs that fail together
  topUnstableTests: string[];            // top 3 requiring immediate attention
  actionItems: string[];                 // 3–5 prioritised team actions
  executiveSummary: string;
}
```

### Stability Labels (AI-assigned, rule-based in system prompt)

| Label      | Condition                                |
| ---------- | ---------------------------------------- |
| `Unstable` | `failureRate > 20%`                      |
| `Flaky`    | `failureRate ≤ 20%` and `flakyRate > 0%` |
| `Stable`   | `failureRate = 0%` and `flakyRate = 0%`  |

### Domain Hints in System Prompt

- Timeout errors → flag as timing issue
- Content / PDF assertion failures → environment or data drift
- Co-failing tests sharing shard → possible session or environment conflict

---

## Agent 3 — RegressionDeltaAgent

### Purpose

Detects regressions introduced by a fix, deployment, or code change. Splits
`consolidated.json` into a **before** window and an **after** window around a
pivot date, fetches per-run `test-results.json` for both windows via
`GitHubReportsClient`, computes per-test failure-rate deltas, then asks AI to
classify each changed test and provide root-cause hypotheses.

Directly addresses:

- _"Fixes were given but one of the fixes introduced a race condition"_
- _"Issues repeated on Product"_ (compare UAT window vs post-deploy window)

### Input

`consolidated.json` + pivot date supplied as `--since YYYY-MM-DD` CLI flag
(or `PIVOT_DATE` env var; auto-defaults to 7 days ago if neither is set).

### Verdict Classification

| Verdict       | Condition                                              |
| ------------- | ------------------------------------------------------ |
| `Regressed`   | `failureDelta > 0` (failure rate worsened after pivot) |
| `New Failure` | Test only appears in after-window with failures        |
| `Improved`    | `failureDelta < 0` (failure rate improved)             |
| `Resolved`    | Test had failures before, zero after                   |
| `Stable`      | No meaningful change in either window                  |

### Risk Levels (AI-assigned)

`Critical` → `High` → `Medium` → `Low`

### Output Schema (`RegressionDeltaReport`)

```ts
{
  generatedAt: string;
  pivotDate: string;
  beforeWindow: { from: string; to: string; runsAnalysed: number };
  afterWindow:  { from: string; to: string; runsAnalysed: number };
  overallVerdict: "Regressed" | "Improved" | "Neutral";
  regressions:       TestDelta[];
  improvements:      TestDelta[];
  newFailures:       TestDelta[];
  resolvedFailures:  TestDelta[];
  actionItems:       string[];
  executiveSummary:  string;
}
```

### AI Call

- **Temperature**: 0.15 | **Max tokens**: 3000 | **Response format**: `json_object`

---

## Agent 4 — DatabaseIntegrityAgent

### Purpose

Runs configurable SQL integrity checks directly against the SIMS Finance SQL
Server database to detect data corruption, orphaned records, transaction loss,
and reference-data drift that UI tests cannot catch.

Directly addresses:

- _"Transactions went missing — data integrity issues"_
- _"No database testing was done"_
- _"Years are maintained with IDs in production and testing"_
- _"Input fields needing to be repopulated/emptied randomly"_ (often caused by
  orphaned cost-centre / inactive reference data)

### Modes

| Mode        | When to run                    | What it does                                       |
| ----------- | ------------------------------ | -------------------------------------------------- |
| `check`     | Ad-hoc / `ai:full`             | Runs all integrity checks; no row-count diff       |
| `pre`       | **Before** Playwright test run | Snapshots row counts → `db-snapshot-before.json`   |
| `post`      | **After** Playwright test run  | Diffs row counts vs pre-snapshot + runs all checks |
| `--dry-run` | Config validation              | Prints what would run; no DB connection needed     |

### Check Categories (from `db-integrity-checks.json`)

| Category                | Examples                                                                                                                  |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `orphaned_records`      | Invoice lines without header, PO lines without PO, journal entries without header, budget virements without authorisation |
| `transaction_integrity` | Transactions with invalid financial year, unbalanced journal entries, invoices with zero/negative amounts                 |
| `reference_data`        | Inactive nominal codes used on live transactions, financial years with no active period                                   |
| `balance_integrity`     | Unposted bank reconciliation entries older than 90 days                                                                   |

### Row Count Tables Monitored

`invoices`, `invoice_lines`, `purchase_orders`, `purchase_order_lines`,
`transactions`, `journal_headers`, `journal_entries`, `financial_years`,
`nominal_codes`, `budget_virements`, `bank_reconciliation_entries`

### Output Schema (`DatabaseIntegrityReport`)

```ts
{
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
  checks: CheckResult[];            // each includes the SQL query that ran
  rowCountSnapshot?: TableSnapshot[];
  rowCountDeltas?:   RowCountDelta[];
  actionItems:       string[];
  executiveSummary:  string;
}
```

### Required env vars

`DB_SERVER`, `DB_DATABASE`, `DB_USER`, `DB_PASSWORD`

### Optional env vars

`DB_PORT` (default 1433) · `DB_ENCRYPT` · `DB_TRUST_SERVER_CERT` ·
`DB_CONNECT_TIMEOUT_MS` (default 15000) · `DB_CHECKS_CONFIG`

### AI Call

- Sends all failing check results + row-count deltas (post mode) to Azure OpenAI
- **Temperature**: 0.1 | **Max tokens**: 2000 | **Response format**: `json_object`
- Returns enriched check results with AI root-cause analysis, action items, executive summary
- Also writes a GitHub Actions step summary via `GITHUB_STEP_SUMMARY` if set

---

## Shared Infrastructure

### AzureOpenAIClient

- Singleton via `getAzureOpenAIClient()` / `getDeployment()`
- **Required env vars**: `AZURE_OPENAI_ENDPOINT`, `AZURE_OPENAI_API_KEY`
- **Optional**: `AZURE_OPENAI_DEPLOYMENT` (default `gpt-4o`)
- API version: `2024-10-21`

### GitHubReportsClient

- **Required env vars**: `GITHUB_REPO_OWNER`, `GITHUB_REPO_NAME`
- **Optional**: `GITHUB_TOKEN` (raises rate limit from 60 → 5000 req/hr)
- Reads `test-results.json` from `gh-pages` branch under `published-reports/{timestamp}/`
- Uses Node.js built-in `https` — no extra dependencies
- `extractTestOutcomes(report, env)` → resolves final status per test after retries:
  if any retry passed after earlier failures → `flaky`; if all retries failed → `failed`/`timedOut`

### Final-Status Resolution Logic

```
retries > 0 && last result is passed  →  "flaky"
last result is "failed"               →  "failed"
last result is "timedOut"             →  "timedOut"
otherwise                             →  result status as-is
```

---

## Environment Variables Summary

| Variable                  | Used By                 | Required               |
| ------------------------- | ----------------------- | ---------------------- |
| `AZURE_OPENAI_ENDPOINT`   | Both agents             | Yes                    |
| `AZURE_OPENAI_API_KEY`    | Both agents             | Yes                    |
| `AZURE_OPENAI_DEPLOYMENT` | Both agents             | No (default: `gpt-4o`) |
| `GITHUB_REPO_OWNER`       | DeepFailurePatternAgent | Yes                    |
| `GITHUB_REPO_NAME`        | DeepFailurePatternAgent | Yes                    |
| `GITHUB_TOKEN`            | DeepFailurePatternAgent | No                     |
| `DEEP_MAX_RUNS`           | DeepFailurePatternAgent | No (default: `15`)     |
| `GITHUB_STEP_SUMMARY`     | Both agents (CI)        | No                     |
