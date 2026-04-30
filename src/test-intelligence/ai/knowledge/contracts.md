# AI Agent System — Runtime Contracts

Reverse-engineered from the working implementation. Update this file whenever an agent
output schema, data source format, or AI prompt contract changes.

---

## 1. Agent Output Schemas

### 1.1 TrendPatternAgent → `ai-trend-report.json`

```typescript
interface TrendReport {
    // ── Computed locally (not from AI) ───────────────────────────────────────
    generatedAt: string; // ISO-8601 timestamp
    runsAnalysed: number; // after EXCLUDE_DAYS filter
    dateRange: { from: string; to: string }; // YYYY-MM-DD
    successRate: number; // 0–100  % of runs with 100% pass and no flaky
    flakyRate: number; // 0–100  % of runs with ≥1 flaky test

    // ── Filled by AI (default if AI fails) ───────────────────────────────────
    overallHealthScore: number; // 0–100  (default: 0)
    trendDirection: "Improving" | "Stable" | "Degrading"; // (default: "Stable")
    patterns: TrendPattern[]; // (default: [])
    riskPeriods: Array<{ period: string; description: string }>; // (default: [])
    actionItems: string[]; // (default: [])
    executiveSummary: string; // (default: "")
}

interface TrendPattern {
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
```

**Fields consumed by `ai:report`:**
`overallHealthScore`, `trendDirection`, `generatedAt`, `runsAnalysed`, `dateRange`,
`successRate`, `flakyRate`, `patterns`, `riskPeriods`, `actionItems`, `executiveSummary`

---

### 1.2 DeepFailurePatternAgent → `ai-deep-failure-report.json`

```typescript
interface DeepFailureReport {
    // ── Computed locally ─────────────────────────────────────────────────────
    generatedAt: string;
    runsAnalysed: number; // reports actually fetched from GitHub (≤ DEEP_MAX_RUNS)
    runsWithIssues: number; // consolidated runs with failures/flakiness
    reportBaseUrl: string; // "https://{owner}.github.io/{repo}/" or ""
    perTestProfiles: PerTestProfile[]; // aggregated from fetched test-results.json files
    coFailurePatterns: CoFailurePattern[]; // pairs + occurrences computed locally;
    // possibleCause filled by AI

    // ── Filled by AI (defaults if AI fails) ──────────────────────────────────
    perTestAnalyses: PerTestAnalysis[]; // (default: [])
    topUnstableTests: string[]; // (default: [])
    actionItems: string[]; // (default: [])
    executiveSummary: string; // (default: "")
}

interface PerTestProfile {
    testTitle: string;
    totalRuns: number;
    failureCount: number;
    flakyCount: number;
    passCount: number;
    failureRate: number; // 0–100
    flakyRate: number; // 0–100
    avgDurationMs: number;
    lastSeen: string; // timestamp of most recent run
    lastFailureTimestamp?: string; // most recent run where this test failed
    errorSamples: string[]; // up to 3 snippets, ≤150 chars each
    failuresByEnv: Record<string, number>; // env → failure count  e.g. { UAT: 5, TRAINING: 0 }
    runsByEnv: Record<string, number>; // env → run count      e.g. { UAT: 10, TRAINING: 2 }
}

interface CoFailurePattern {
    tests: string[]; // exactly 2 test titles
    occurrences: number; // ≥2 (pairs occurring only once are discarded)
    possibleCause: string; // AI-generated; "" if AI omits this pair
}

interface PerTestAnalysis {
    testTitle: string;
    stabilityLabel: "Unstable" | "Flaky" | "Stable";
    pattern: string;
    recommendation: string;
    priority: "High" | "Medium" | "Low";
}
```

**Fields consumed by `ai:report`:**
`reportBaseUrl`, `runsAnalysed`, `executiveSummary`, `perTestProfiles`,
`perTestAnalyses`, `coFailurePatterns`, `actionItems`

**Stability label thresholds (computed in AI prompt, not validated locally):**

- `Unstable`: `failureRate > 20%`
- `Flaky`: `failureRate ≤ 20%` AND `flakyRate > 0%`
- `Stable`: `failureRate = 0%` AND `flakyRate = 0%`

---

### 1.3 RegressionDeltaAgent → `ai-regression-delta-report.json`

```typescript
interface RegressionDeltaReport {
    // ── Computed locally ─────────────────────────────────────────────────────
    generatedAt: string;
    pivotDate: string; // YYYY-MM-DD
    beforeWindow: { from: string; to: string; runsAnalysed: number };
    afterWindow: { from: string; to: string; runsAnalysed: number };
    regressions: TestDelta[]; // verdict === "Regressed"
    improvements: TestDelta[]; // verdict === "Improved"
    newFailures: TestDelta[]; // verdict === "New Failure"
    resolvedFailures: TestDelta[]; // verdict === "Resolved"

    // ── Filled by AI (defaults if AI fails) ──────────────────────────────────
    overallVerdict: "Regressed" | "Improved" | "Neutral"; // (default: "Neutral")
    actionItems: string[]; // (default: [])
    executiveSummary: string; // (default: "")
}

interface TestDelta {
    testTitle: string;
    beforeFailureRate: number; // 0–100
    afterFailureRate: number; // 0–100
    beforeFlakyRate: number; // 0–100
    afterFlakyRate: number; // 0–100
    failureDelta: number; // afterFailureRate - beforeFailureRate
    flakyDelta: number;
    verdict: "Regressed" | "Improved" | "New Failure" | "Resolved" | "Stable";
    riskLevel: "Critical" | "High" | "Medium" | "Low";
    errorSamplesBefore: string[];
    errorSamplesAfter: string[];
}
```

**Verdict thresholds (computed in code — NOT AI):**
| Condition | Verdict |
|---|---|
| Test absent before, present after with `aFail > 0` | `New Failure` |
| `bFail > 0` AND (`a` absent OR `aFail === 0`) | `Resolved` |
| `failureDelta > 5` | `Regressed` |
| `failureDelta < -5` | `Improved` |
| `bFlaky === 0` AND `aFlaky > 0` AND `failureDelta ≥ 0` (was Stable) | `Regressed` (race condition signal) |
| Otherwise | `Stable` |

**Risk level thresholds:**
| `afterFailureRate` | Risk |
|---|---|
| `> 50%` | `Critical` |
| `> 20%` OR (`Regressed` AND `failureDelta > 20`) | `High` |
| `> 5%` OR `New Failure` | `Medium` |
| Otherwise | `Low` |

**Fields consumed by `ai:report`:**
`overallVerdict`, `pivotDate`, `beforeWindow`, `afterWindow`,
`regressions`, `improvements`, `newFailures`, `resolvedFailures`,
`actionItems`, `executiveSummary`

---

### 1.4 DatabaseIntegrityAgent → `ai-db-integrity-report.json`

```typescript
interface DatabaseIntegrityReport {
    // ── Always present ────────────────────────────────────────────────────────
    generatedAt: string;
    mode: "check" | "pre" | "post";
    database: string; // from DB_DATABASE env var
    server: string; // from DB_SERVER env var
    environment: string; // from TEST_ENV env var (default: "Unknown")
    checksRun: number; // excludes "Skipped" checks
    totalViolations: number; // violations.length + rowLosses count
    criticalViolations: number;
    highViolations: number;
    riskLevel: "Critical" | "High" | "Medium" | "Low" | "Clean";
    checks: CheckResult[];

    // ── Mode-conditional ─────────────────────────────────────────────────────
    rowCountSnapshot?: TableSnapshot[]; // only populated in "pre" mode
    rowCountDeltas?: RowCountDelta[]; // only populated in "post" mode

    // ── From AI (skipped entirely if no violations/errors; defaults if AI fails)
    actionItems: string[]; // (default: [])
    executiveSummary: string; // (default: "")
}

interface CheckResult {
    id: string; // e.g. "ORP_001"
    name: string;
    description: string;
    severity: "Critical" | "High" | "Medium" | "Low";
    category: string;
    violationCount: number; // 0 when status ≠ "Fail"
    status: "Pass" | "Fail" | "Error" | "Skipped";
    errorMessage?: string; // present only when status === "Error"
    query: string; // exact SQL executed
}

interface RowCountDelta {
    tableName: string;
    before: number;
    after: number;
    delta: number;
    verdict: "Expected" | "Unexpected Loss" | "Unexpected Gain" | "No Change";
}
```

**Risk level derivation (computed in code):**
| Condition | riskLevel |
|---|---|
| `criticalViolations > 0` | `Critical` |
| `highViolations > 0` | `High` |
| Any violations | `Medium` |
| No violations, no row losses, no errors | `Clean` |

**AI is NOT called** when `violations.length === 0 && rowLosses === 0 && errors.length === 0`.

**`pre` mode** returns a minimal report immediately with no AI call and no `checks` array.

**Fields consumed by `ai:report`:**
`riskLevel`, `checksRun`, `totalViolations`, `criticalViolations`, `highViolations`,
`checks` (each check's `id`, `name`, `status`, `violationCount`, `severity`, `query`),
`rowCountDeltas`, `actionItems`, `executiveSummary`

---

## 2. Execution Flow Contract

```
npm run ai:full
  └─ node scripts/run-ai-full.js
       │
       ├─ [1] npm run ai:trends    (TrendPatternAgent.ts)
       │        reads:  test-results-history/consolidated.json
       │        writes: ai-trend-report.json
       │        fails:  if consolidated.json missing/empty → throws
       │        exit 1: never (errors throw, caught by orchestrator)
       │
       ├─ [2] npm run ai:deep     (DeepFailurePatternAgent.ts)
       │        reads:  test-results-history/consolidated.json
       │                + test-results.json files from GitHub gh-pages
       │        writes: ai-deep-failure-report.json
       │        fails:  if GITHUB_REPO_OWNER/NAME not set → throws at constructor
       │        exit 1: never (errors throw, caught by orchestrator)
       │
       ├─ [3] npm run ai:regression  (RegressionDeltaAgent.ts)
       │        reads:  test-results-history/consolidated.json
       │                + test-results.json files from GitHub gh-pages
       │        writes: ai-regression-delta-report.json
       │        arg:    --since YYYY-MM-DD (optional; defaults to 7 days ago)
       │        fails:  if no runs before or after pivot → throws
       │        exit 1: never (errors throw, caught by orchestrator)
       │
       ├─ [4] npm run ai:db:check  (DatabaseIntegrityAgent.ts --mode check)
       │        reads:  src/ai/config/db-integrity-checks.json
       │                + SQL Server (DB_SERVER, DB_DATABASE required)
       │        writes: ai-db-integrity-report.json
       │        exit 1: on Critical/High violations (process.exit(1) in CLI)
       │                on missing DB_SERVER/DB_DATABASE (throws before connecting)
       │        NOTE:   orchestrator catches exit 1 — continues to [5]
       │
       └─ [5] npm run ai:report   (scripts/generate-ai-report.js)
                reads:  ai-trend-report.json
                        ai-deep-failure-report.json
                        ai-regression-delta-report.json
                        ai-db-integrity-report.json
                writes: ai-report.html
                NOTE:   always runs regardless of [1]–[4] exit codes
                        missing JSON files → uses empty fallback (no crash)
```

**Orchestrator failure semantics** (`scripts/run-ai-full.js`):

- Each agent is wrapped in `try/catch` around `execSync`.
- `anyFailed = true` is set if any agent exits non-zero.
- `ai:report` always runs unconditionally after all agents.
- Final `process.exit(1)` only fires if `anyFailed === true`.
- This means the HTML report is always regenerated, even when DB is unconfigured.

---

## 3. Data Contracts

### 3.1 `consolidated.json`

```typescript
interface ConsolidatedFile {
    runs: ConsolidatedRun[]; // REQUIRED. Missing/null → agents return empty/error.
}

interface ConsolidatedRun {
    timestamp: string; // REQUIRED. Format: "YYYY-MM-DD_HH-MM-SS"
    environment?: string; // OPTIONAL. Used in ai:deep for RunOutcome.environment
    counts: {
        executed: number; // REQUIRED
        passed: number; // REQUIRED
        failed: number; // REQUIRED
        flaky: number; // REQUIRED
    };
    executionTimeSec: number; // REQUIRED. 0 treated as "unknown" in execTimeLabel
}
```

**Ordering**: TrendPatternAgent expects newest-first (uses `enriched.slice(0,7)` as "recent").
RegressionDeltaAgent re-sorts internally with `sort((a,b) => b.timestamp.localeCompare(a.timestamp))`.

**Assumptions not validated in code:**

- Timestamp format is exactly `YYYY-MM-DD_HH-MM-SS`. Date splitting uses `r.timestamp.split("_")[0]`.
  If the format changes, pivot date comparison in RegressionDeltaAgent breaks silently.
- `counts.executed > 0` — if `0`, successRate is computed as `0` (safe).
- `environment` field existence — optional, defaults to `"?"` in trend prompt, `"Unknown"` in deep/regression.

---

### 3.2 `test-results.json` (Playwright JSON reporter format)

```typescript
interface PlaywrightRunReport {
    suites: TestSuite[]; // REQUIRED. Root-level suite array.
    stats: {
        duration: number; // Used by consolidated.json builder, NOT by agents directly
        expected: number;
        unexpected: number;
        flaky: number;
        skipped: number;
    };
    // timestamp: string        // NOT in native format — injected by GitHubReportsClient
}

interface TestSuite {
    title: string;
    specs: TestSpec[];
    suites?: TestSuite[]; // recursive — walkSuites recurses into this
}

interface TestSpec {
    title: string; // Used as testTitle in profiles — must be unique per test
    tests: Array<{
        results: TestResult[]; // Each retry = one entry. Last entry = final status.
    }>;
}

interface TestResult {
    status: "passed" | "failed" | "timedOut" | "skipped" | "interrupted";
    duration: number; // ms
    retry: number;
    error?: { message?: string }; // up to 300 chars captured
}
```

**Flaky detection logic** (`extractTestOutcomes`):
A test is `flaky` if `last.status === "passed"` AND any prior retry had `status === "failed"` or `"timedOut"`.

**`timestamp` injection**: `GitHubReportsClient.fetchRunReport()` sets `parsed.timestamp = timestamp`
(the folder name from gh-pages path). Any pre-existing `timestamp` field in the JSON file is overwritten.

**Assumptions not validated in code:**

- `spec.title` is the human-readable test name (not a path or ID). Displayed in reports and used as
  the Map key for co-failure matching. Duplicate titles across suites will be merged into one profile.
- `test.results` has at least 1 entry — guarded with `if (results.length === 0) continue`.
- The gh-pages path is `published-reports/{timestamp}/test-results.json`. Changing this path
  breaks all three agents that call `GitHubReportsClient`.

---

### 3.3 DB query results (`db-integrity-checks.json`)

Each check query **must** return a single row. Violation count is read as:

```typescript
const raw = parseInt(
    String(row["violation_count"] ?? row[Object.keys(row)[0]] ?? "0"),
    10
);
```

**Column name contract:**

- Preferred: first column named `violation_count` (all 13 built-in checks use this).
- Fallback: first column of any name, coerced to integer.
- NaN result → `status: "Error"`, `violationCount: 0`.

**Row count snapshot** (`captureRowCounts`): Uses `COUNT(*) ... WITH (NOLOCK)`.
Returns `rowCount: -1` if the table does not exist; those rows are excluded from delta computation.

---

## 4. AI Interaction Contracts

All 4 agents use these shared settings:

```typescript
response_format: {
    type: "json_object";
} // enforced by Azure OpenAI
temperature: 0.15;
model: process.env.AZURE_OPENAI_DEPLOYMENT ?? "gpt-4o";
```

---

### 4.1 TrendPatternAgent AI Contract

**Input sent to AI:**

- System: Senior QA engineer specialising in enterprise financial apps (SIMS Finance).
  Rule added: _"If multiple environments are present (e.g. UAT and TRAINING), compare their
  failure rates — an environment-specific pattern is a different root cause than a universal one."_
- User: Aggregate stats table + trend signal (last 7 vs previous 7) + failure clusters +
  execution time outliers + day-of-week breakdown + **environment breakdown** (total runs,
  failures, flakiness count, avg success rate per env; omitted when only one env is present)
    - per-run detail (most recent 15, `env` column already included).
- `max_tokens: 2500`

**Expected response schema:**

```json
{
    "overallHealthScore": 55,
    "trendDirection": "Degrading",
    "patterns": [
        {
            "patternType": "Recurring Outage",
            "description": "...",
            "affectedRuns": 2,
            "severity": "High",
            "recommendation": "..."
        }
    ],
    "riskPeriods": [{ "period": "2026-04-18", "description": "..." }],
    "actionItems": ["..."],
    "executiveSummary": "..."
}
```

**Malformed response handling:**

- `JSON.parse` failure → `console.warn` + `parsed = {}`.
- Missing fields → `?? 0`, `?? "Stable"`, `?? []`, `?? ""` defaults applied.

---

### 4.2 DeepFailurePatternAgent AI Contract

**Input sent to AI:**

- System: Senior QA automation expert, SIMS Finance per-test analysis.
  Rule added: _"If a test's failures are concentrated in ONE environment (e.g. UAT only, not
  TRAINING), flag this — it suggests environment-specific config, data, or credentials rather
  than a code bug."_
- User: Per-test profiles table (all tests) + co-failure pairs.
  Prompt header now names the actual environments detected (e.g. `environments: UAT, TRAINING`).
  When **multiple environments** are present, each test profile gains a line:
  `Failures by env: UAT: 5/10 failures, TRAINING: 0/2 failures`
  (omitted when only one env is present — no noise for single-env setups).
- `max_tokens: 3000`

**Expected response schema:**

```json
{
    "perTestAnalyses": [
        {
            "testTitle": "NML510 - Trial Balance Report @shard1",
            "stabilityLabel": "Unstable",
            "pattern": "...",
            "recommendation": "...",
            "priority": "High"
        }
    ],
    "coFailurePatterns": [
        {
            "tests": ["Test A", "Test B"],
            "occurrences": 3,
            "possibleCause": "..."
        }
    ],
    "topUnstableTests": ["NML510 - Trial Balance Report @shard1"],
    "actionItems": ["..."],
    "executiveSummary": "..."
}
```

**Malformed response handling:**

- `JSON.parse` failure → empty fallback.
- `coFailurePatterns` merge uses sorted title-key Map — AI ordering/omission is safe.
- If AI omits a co-failure pair, that pair's `possibleCause` is `""` in output.

---

### 4.3 RegressionDeltaAgent AI Contract

**Input sent to AI:**

- System: Senior QA engineer, regression delta analysis.
  Rule added: _"If both windows share the same environment, the regression is universal. If they
  differ, note the environment as a potential confound."_
- User: Pivot date, window summaries (each now includes `environments:` label, e.g.
  `BEFORE window: … (environments: UAT, TRAINING)`), per-test delta table (top 20 non-stable),
  race condition candidates, truncation note if > 20 non-stable tests.
- `max_tokens: 2000`

**Expected response schema:**

```json
{
    "overallVerdict": "Regressed",
    "actionItems": ["..."],
    "executiveSummary": "..."
}
```

**NOTE:** The AI receives only the top 20 non-stable deltas. The full delta list (all tests) is
always written to the JSON output regardless of what the AI sees. The truncation note warns
the AI when data has been trimmed.

**Malformed response handling:** Same safe-parse + `?? "Neutral"` / `?? []` / `?? ""` defaults.

---

### 4.4 DatabaseIntegrityAgent AI Contract

**Input sent to AI:**

- System: Senior DB engineer, SIMS Finance SQL Server.
- User: Database name, mode, check summary counts, violation details (check ID + name +
  violation count + severity + category + description + **exact SQL executed**),
  error table (checks that failed to execute + SQL attempted), row count deltas (post mode only).
- `max_tokens: 2000`

**Expected response schema:**

```json
{
    "actionItems": ["..."],
    "executiveSummary": "..."
}
```

**AI is skipped entirely** when no violations, no row losses, and no errors.
Hard-coded "All checks passed" strings are returned instead.

**Malformed response handling:** Same safe-parse + `?? []` / `?? ""` defaults.

---

## 5. Fragile Areas

| #       | Area                                            | Risk       | Notes                                                                                                                                                                                                                                                                     |
| ------- | ----------------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **F1**  | `timestamp` format                              | **High**   | All agents split on `_` to extract date. Any format change silently breaks pivot comparisons in RegressionDeltaAgent. No format validation exists.                                                                                                                        |
| **F2**  | `spec.title` uniqueness                         | **High**   | `testTitle` is the Map key for profiles, co-failure pairs, and AI merge. Duplicate titles (same test name across different suites) silently merge into one profile.                                                                                                       |
| **F3**  | `GITHUB_REPO_OWNER`/`GITHUB_REPO_NAME`          | **High**   | `GitHubReportsClient` constructor throws if either is unset. DeepFailurePatternAgent and RegressionDeltaAgent crash entirely — no graceful degradation at the constructor level.                                                                                          |
| **F4**  | gh-pages path convention                        | **High**   | Hardcoded as `published-reports/{timestamp}/test-results.json`. Any change to how CI publishes reports breaks all GitHub fetches.                                                                                                                                         |
| **F5**  | `filterByExcludedDays` scope                    | **Medium** | Applied in TrendPatternAgent and DeepFailurePatternAgent only. **Not** applied in RegressionDeltaAgent. If `EXCLUDE_DAYS=Saturday,Sunday`, trend/deep exclude weekends but regression includes them — window profiles are inconsistent with trend profiles.               |
| **F6**  | Pivot date default (7 days ago)                 | **Medium** | In `ai:full`, no `--since` arg is passed. Pivot is auto-derived as today minus 7 days. If no deployment happened exactly 7 days ago, the regression report's "before/after" split is arbitrary.                                                                           |
| **F7**  | DB table names in `db-integrity-checks.json`    | **Medium** | All 13 queries reference table names (`invoices`, `purchase_orders`, etc.) that must match the actual schema. No validation — wrong names → `Error` status on all checks.                                                                                                 |
| **F8**  | AI response field names                         | **Medium** | All agents assume exact field names (`overallHealthScore`, `perTestAnalyses`, etc.). Azure OpenAI JSON mode guarantees valid JSON but not field names. A prompt wording change can shift field names silently.                                                            |
| **F9**  | `test-results.json` format (Playwright version) | **Medium** | `extractTestOutcomes` walks `suite.specs[].tests[].results[]`. If Playwright changes its JSON reporter schema (e.g. removes `specs`, renames `results`), all per-test analysis breaks silently with empty profiles.                                                       |
| **F10** | HTML report CDN dependencies                    | **Low**    | React 18, Tailwind CDN, Chart.js all loaded from `cdn.jsdelivr.net` and `cdn.tailwindcss.com`. Air-gapped or CDN-blocked environments produce a blank page.                                                                                                               |
| **F11** | `violation_count` column naming                 | **Low**    | The NaN guard correctly catches non-numeric first columns and marks them as `Error`. But if a query returns zero rows (not one row), `result.recordset[0]` is `undefined` → falls back to `"0"` → `Pass`. A query returning no rows is treated as "no violations".        |
| **F12** | `consolidated.json` not validated               | **Low**    | `JSON.parse(fs.readFileSync(...))` with `raw.runs ?? []`. Missing `counts` fields inside a run → `NaN` in stats computations. No per-run schema validation.                                                                                                               |
| **F13** | `environment` field case/spelling               | **Low**    | `environment` is an optional free-text field in `consolidated.json`. `"UAT"` and `"uat"` are treated as different environments. No normalisation applied — inconsistent casing produces duplicate env buckets in `byEnvironment`, `failuresByEnv`, and window env labels. |

---

## 6. Environment Variable Summary

| Variable                       | Used By                                        | Required? | Default                                  |
| ------------------------------ | ---------------------------------------------- | --------- | ---------------------------------------- |
| `AZURE_OPENAI_ENDPOINT`        | All 4 agents                                   | Yes       | —                                        |
| `AZURE_OPENAI_API_KEY`         | All 4 agents                                   | Yes       | —                                        |
| `AZURE_OPENAI_DEPLOYMENT`      | All 4 agents                                   | No        | `"gpt-4o"`                               |
| `GITHUB_REPO_OWNER`            | DeepFailurePatternAgent, RegressionDeltaAgent  | Yes\*     | —                                        |
| `GITHUB_REPO_NAME`             | DeepFailurePatternAgent, RegressionDeltaAgent  | Yes\*     | —                                        |
| `GITHUB_TOKEN`                 | DeepFailurePatternAgent, RegressionDeltaAgent  | No        | unauthenticated (60 req/hr)              |
| `DB_SERVER`                    | DatabaseIntegrityAgent                         | Yes\*\*   | —                                        |
| `DB_DATABASE`                  | DatabaseIntegrityAgent                         | Yes\*\*   | —                                        |
| `DB_USER`                      | DatabaseIntegrityAgent                         | No        | Windows auth                             |
| `DB_PASSWORD`                  | DatabaseIntegrityAgent                         | No        | Windows auth                             |
| `DB_PORT`                      | DatabaseIntegrityAgent                         | No        | `1433`                                   |
| `DB_ENCRYPT`                   | DatabaseIntegrityAgent                         | No        | `"true"`                                 |
| `DB_TRUST_SERVER_CERT`         | DatabaseIntegrityAgent                         | No        | `"false"`                                |
| `DB_CONNECT_TIMEOUT_MS`        | DatabaseIntegrityAgent                         | No        | `15000`                                  |
| `DB_CHECKS_CONFIG`             | DatabaseIntegrityAgent                         | No        | `src/ai/config/db-integrity-checks.json` |
| `DEEP_MAX_RUNS`                | DeepFailurePatternAgent, RegressionDeltaAgent  | No        | `15` / `10`                              |
| `PIVOT_DATE`                   | RegressionDeltaAgent                           | No        | today minus 7 days                       |
| `EXCLUDE_DAYS`                 | TrendPatternAgent, DeepFailurePatternAgent     | No        | `""` (no filtering)                      |
| `TEST_ENV`                     | DatabaseIntegrityAgent                         | No        | `"Unknown"`                              |
| `NODE_TLS_REJECT_UNAUTHORIZED` | GitHubReportsClient (https), AzureOpenAIClient | No        | `"1"` (secure)                           |

\*Throws at constructor if missing — agents crash with no output file written.
\*\*Throws before DB connection if missing — agent exits 1 with helpful message.
