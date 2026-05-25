# SIMS Finance — Framework Architecture & Recreation Blueprint

> **Audience:** Senior QA Automation Engineers rebuilding this framework in a new repository.  
> **Approach:** Reverse-engineered from the live codebase. Every section references actual files.

---

## Table of Contents

1. [Tech Stack](#1-tech-stack)
2. [Folder Structure](#2-folder-structure)
3. [Framework Architecture](#3-framework-architecture)
4. [Execution Flow](#4-execution-flow)
5. [Configuration Analysis](#5-configuration-analysis)
6. [Reporting Framework](#6-reporting-framework)
7. [Utilities & Custom Helpers](#7-utilities--custom-helpers)
8. [Test Design Standards](#8-test-design-standards)
9. [CI/CD & Execution Strategy](#9-cicd--execution-strategy)
10. [Dependency Mapping](#10-dependency-mapping)
11. [Framework Recreation Guide](#11-framework-recreation-guide)
12. [Improvements & Modernisation](#12-improvements--modernisation)

---

## 1. Tech Stack

| Concern           | Technology                                 | Version              | Why                                                                 |
| ----------------- | ------------------------------------------ | -------------------- | ------------------------------------------------------------------- |
| Automation tool   | **Playwright**                             | `^1.58.0`            | Cross-browser, fast, built-in assertions, network interception      |
| Language          | **TypeScript**                             | `^5.7.2`             | Strict type safety, IDE IntelliSense, prevents runtime surprises    |
| Test runner       | **Playwright Test** (`@playwright/test`)   | same                 | Native Playwright test orchestration, sharding, retries             |
| Assertion library | **Playwright `expect`**                    | built-in             | Auto-retry assertions, clear error messages                         |
| BDD               | None (plain `test.describe` / `test.step`) | —                    | Lightweight; test steps provide narrative without Cucumber overhead |
| Logging           | **Winston**                                | `^3.17.0`            | Structured logs, dual transport (console + file)                    |
| Environment vars  | **dotenv**                                 | `^16.4.5`            | Cascading `.env` → `.env.<ENV>` pattern                             |
| Excel I/O         | **xlsx**                                   | `^0.18.5`            | Read/write GL code spreadsheets, test data files                    |
| PDF parsing       | **pdf-parse**                              | `^1.1.1`             | Extract text from downloaded Crystal/XQuery reports                 |
| Email integration | **googleapis**                             | `^149.0.0`           | Gmail OAuth2 — verify distributed XQuery report emails              |
| Encryption        | Node.js `crypto` (built-in)                | —                    | AES-256-CBC credential encryption at rest                           |
| Database          | **mssql**                                  | `^12.5.0`            | SQL Server access for `DatabaseIntegrityAgent`                      |
| AI analysis       | **Azure OpenAI / openai**                  | `^2.0.0` / `^6.34.0` | GPT-4o agents for trend/failure/regression analysis                 |
| Report merging    | **playwright-merge-html-reports**          | `^0.2.8`             | Merge blob reports from parallel shards                             |
| CI/CD             | **GitHub Actions**                         | —                    | Multi-job pipeline: auth-gate → shards → merge → deploy             |
| Package manager   | **npm**                                    | —                    | `package-lock.json` present; `npm ci` in CI                         |
| Linter/formatter  | **Prettier**                               | `.prettierrc.json`   | Consistent code style                                               |
| Cross-env         | **cross-env**                              | `^7.0.3`             | Windows-safe env variable injection in npm scripts                  |

---

## 2. Folder Structure

```
playwright-SIMS-Finance/
├── .github/
│   └── workflows/
│       └── playwright.yml          # 3-job CI pipeline
├── src/
│   ├── config/
│   │   ├── .env                    # Shared defaults (gitignored)
│   │   ├── .env.TRAINING           # TRAINING env overrides (gitignored)
│   │   ├── .env.UAT                # UAT env overrides (gitignored)
│   │   ├── env.ts                  # Static env wrapper class
│   │   └── parse-json-report.js    # CI: parses test-results.json → consolidated history
│   ├── data/
│   │   ├── elementAttributes.json  # Locator attribute constants
│   │   ├── expectedTexts.json      # All expected UI strings, tenant/school keys
│   │   ├── labels.json             # UI label strings
│   │   ├── paths.json              # Navigation paths
│   │   ├── playwrightHTMLRoles.json # ARIA role constants
│   │   ├── users.training.json     # Encrypted credential store — TRAINING
│   │   └── users.uat.json          # Encrypted credential store — UAT
│   ├── logging/
│   │   └── logger.ts               # Winston singleton logger
│   ├── pages/                      # Page Object Model layer
│   │   ├── BasePage.ts             # Abstract base — all shared locators + actions
│   │   ├── HomePage.ts             # Home page POM
│   │   ├── LoginPage.ts            # Login page POM
│   │   ├── NML/
│   │   │   └── NML510.ts           # Trial Balance Report page
│   │   ├── RSS/
│   │   │   ├── RSS310Q.ts          # Attachments page
│   │   │   └── RSS570.ts           # Crystal Report page
│   │   ├── SPC/
│   │   │   └── SPC420.ts           # File upload page
│   │   ├── XQUERY/
│   │   │   └── XQuerySIMS_TB_SCHOOL.ts
│   │   ├── CMS/
│   │   └── PRL/
│   ├── test-intelligence/          # AI layer (framework-within-framework)
│   │   ├── index.ts                # Public API surface
│   │   ├── contracts/              # TypeScript interfaces (TestRun, TestResult, ApiTrace…)
│   │   ├── adapters/
│   │   │   └── playwrightAdapter.ts # Converts Playwright JSON → normalised TestRun[]
│   │   ├── ai/
│   │   │   ├── AzureOpenAIClient.ts # Singleton Azure OpenAI wrapper
│   │   │   ├── agents/
│   │   │   │   ├── TrendPatternAgent.ts         # Health score, trend direction, env breakdown
│   │   │   │   ├── DeepFailurePatternAgent.ts   # Per-test failure profiles, co-failure patterns
│   │   │   │   ├── RegressionDeltaAgent.ts      # Before/after pivot-date regression detection
│   │   │   │   ├── DatabaseIntegrityAgent.ts    # Pre/post-deploy DB snapshot diff
│   │   │   │   └── ApiIntelligenceAgent.ts      # Network trace analysis → Postman/OpenAPI
│   │   │   ├── config/             # Agent-specific config (thresholds, pivot dates…)
│   │   │   ├── knowledge/          # Domain knowledge injected into AI prompts
│   │   │   ├── prompts/            # System + user prompt templates
│   │   │   └── utils/
│   │   │       ├── ApiTrafficAnalyzer.ts
│   │   │       └── ApiExporters.ts  # Postman collection + OpenAPI path generators
│   │   └── utils/
│   │       └── helpers.ts           # filterByExcludedDays, date utilities
│   ├── tests/
│   │   ├── Auth/
│   │   │   └── auth.spec.ts         # Authentication gate — runs first, blocks pipeline on fail
│   │   ├── Post-Deployment-Tests/
│   │   │   └── PostChecksTests.spec.ts # Main test suite (sharded)
│   │   ├── Email-Tests/
│   │   ├── PRL300QInvoicesCreditNote/
│   │   ├── Purchase Order/
│   │   ├── BACSRun.spec.ts
│   │   ├── glCodeExtractor.spec.ts
│   │   └── IdentifyPaymentMethods.spec.ts
│   ├── fixtures/
│   │   └── test.ts                  # Extended test fixture with auto NetworkCapture
│   └── utils/
│       ├── ApiSignalCollector.ts    # Passive network signal accumulator
│       ├── credentials.ts           # Credential resolver (env → JSON → decrypt)
│       ├── encryptor.ts             # AES-256-CBC encrypt/decrypt
│       ├── encrypt-cli.ts           # CLI tool to encrypt new passwords
│       ├── ExcelHandler.ts          # XLSX read/write utility
│       ├── FileManager.ts           # File I/O (exists, delete, move…)
│       ├── FileUtils.ts             # Glob, unzip, latest-file lookup
│       ├── GmailUtils.ts            # Gmail OAuth2 email verification
│       ├── globalSetup.ts           # Playwright globalSetup — cleans trace shards
│       ├── globalTeardown.ts        # Playwright globalTeardown — merges worker traces
│       ├── glcodehelper.ts          # GL code extraction from SIMS data
│       ├── InvoiceCalc.ts           # Invoice arithmetic validation helpers
│       ├── NetworkCapture.ts        # Passive Playwright network listener → ApiTrace
│       ├── NetworkTraceStore.ts     # In-process trace accumulator (singleton)
│       ├── parsers/                 # Response body parsers
│       ├── PDFUtils.ts              # PDF download, unzip, text extract
│       ├── sessionGuard.ts          # Detects mid-test session expiry
│       ├── SetupGmail.ts            # Gmail OAuth2 token refresh
│       └── models/                  # Shared TypeScript interfaces for utilities
├── scripts/
│   ├── ai-server.js                 # Local Express server — serves ai-report.html
│   ├── generate-ai-report.js        # Stitches agent JSON outputs → ai-report.html
│   ├── generate-dashboard.js        # Generates the run-history HTML dashboard
│   ├── preview-dashboard.js         # Opens dashboard in browser
│   ├── preview.html                 # Dashboard preview template
│   └── run-ai-full.js               # Orchestrates all AI agents sequentially
├── ai-outputs/
│   ├── ai-report.html               # Final AI analysis report (self-contained React app)
│   ├── reports/                     # Agent JSON outputs (trend, deep-failure, regression…)
│   └── traces/
│       ├── network-traces.json      # Seed (mock) or real captured HTTP traces
│       └── worker-{n}.json          # Per-worker trace shards (transient, gitignored)
├── test-results-history/
│   └── consolidated.json            # Append-only run history fed to AI agents
├── playwright.config.ts
├── tsconfig.json
├── package.json
└── .prettierrc.json
```

### Folder Purpose Summary

| Folder                   | Core?       | Purpose                                        |
| ------------------------ | ----------- | ---------------------------------------------- |
| `src/pages/`             | ✅ Core     | Page Object Model — one class per screen       |
| `src/tests/`             | ✅ Core     | Test specs — consume POMs and utilities        |
| `src/config/`            | ✅ Core     | Environment variable loading and typed wrapper |
| `src/data/`              | ✅ Core     | Test data JSON files, credential stores        |
| `src/utils/`             | ✅ Core     | All cross-cutting utilities                    |
| `src/logging/`           | ✅ Core     | Winston logger singleton                       |
| `src/test-intelligence/` | ⭐ Advanced | AI agent layer — can be added later            |
| `scripts/`               | ⭐ Advanced | Report generation orchestration                |
| `ai-outputs/`            | ⭐ Advanced | AI report artefacts                            |
| `.github/workflows/`     | ✅ Core     | CI pipeline                                    |

---

## 3. Framework Architecture

### 3.1 Overall Design

```
┌─────────────────────────────────────────────────────────────────┐
│                        TEST LAYER                               │
│  auth.spec.ts          PostChecksTests.spec.ts                  │
│  (auth gate)           (functional post-deploy checks)          │
└──────────────┬─────────────────────────────────────────────────┘
               │ imports
┌──────────────▼─────────────────────────────────────────────────┐
│                      PAGE OBJECT LAYER                          │
│  BasePage (abstract)  LoginPage  HomePage  NML510  RSS570 …    │
│  Common locators + actions inherited by all page classes        │
└──────────────┬─────────────────────────────────────────────────┘
               │ imports
┌──────────────▼─────────────────────────────────────────────────┐
│                      UTILITY LAYER                              │
│  credentials  PDFUtils  ExcelHandler  GmailUtils  FileUtils     │
│  NetworkCapture  sessionGuard  encryptor  InvoiceCalc           │
└──────────────┬─────────────────────────────────────────────────┘
               │ reads from
┌──────────────▼─────────────────────────────────────────────────┐
│                      DATA / CONFIG LAYER                        │
│  .env / .env.UAT / .env.TRAINING  →  env.ts                    │
│  users.uat.json / users.training.json  (encrypted passwords)   │
│  expectedTexts.json  labels.json  paths.json                   │
└─────────────────────────────────────────────────────────────────┘
               │ feeds
┌──────────────▼─────────────────────────────────────────────────┐
│                    AI INTELLIGENCE LAYER                        │
│  consolidated.json  →  Adapters  →  Agents  →  ai-report.html  │
│  TrendPattern  DeepFailure  RegressionDelta  DbIntegrity  Api  │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 Page Object Model (POM)

**Pattern:** Abstract base class + concrete page classes.

- `BasePage.ts` — abstract class with `protected page: Page` and `testInfo`. Exposes all shared locators as typed getters and all shared actions (`click`, `fill`, `navigateTo`, `expectElementToContainText`, etc.) as `async` methods.
- Every module screen (NML510, RSS570, SPC420…) extends `BasePage` and adds only its own locators and actions.
- `LoginPage` returns a `HomePage` instance on successful login — typed chain preventing misuse.

**Why abstract base:** Avoids duplicating 40+ shared UI patterns (dialogs, breadcrumbs, submit buttons, sort grids) across every page.

### 3.3 Credential Architecture

```
users.uat.json
  { "sfdemosite4": { "school001": { "ADMIN": "username123" } } }
                                    ↓
credentials.ts → loadUsers() → getCredentials(tenant, school, role)
                                    ↓
                          encryptor.ts → decryptPassword()
                                    ↓
                          [username, password] tuple
```

Passwords are AES-256-CBC encrypted in the JSON store. The encryption key lives in `.env.ENCRYPTION_KEY`. This avoids plain-text credentials in source control while keeping the JSON files auditable.

### 3.4 Sharding Strategy

The test suite is split into **two logical shards** via Playwright tag annotations (`@shard1`, `@shard2`). Each shard is a separate Playwright _project_ in `playwright.config.ts` with a `grep` filter. This means:

- Shards run in parallel in CI (two GitHub Actions matrix jobs).
- Each shard performs its own fresh login — no shared `storageState` — to avoid UAT's single-session enforcement killing the other shard mid-test.
- `sessionGuard.ts` detects mid-test session expiry and throws a clear error instead of a confusing element-not-found failure deep in the test.

### 3.5 Retry Mechanism

| Context           | Retries     | Why                                                                         |
| ----------------- | ----------- | --------------------------------------------------------------------------- |
| Auth gate         | 2 (CI only) | Transient login blips should not abort the whole pipeline                   |
| Postchecks shards | 2 (CI only) | UAT environment flakiness; retries are classified separately in AI analysis |
| Local dev         | 0           | Fail fast locally for quick feedback                                        |

### 3.6 Test Isolation

- Each test calls a local `login()` helper at its start — no shared browser state.
- `test.step()` wraps every logical operation, giving the Playwright report a readable narrative trace.
- `assertUserStillLoggedIn()` is called at critical steps to detect session invalidation early.

---

## 4. Execution Flow

```
npm run test:uat
        │
        ▼
playwright.config.ts loads
        │
        ├─ dotenv.config({ path: 'src/config/.env' })           # shared defaults
        ├─ resolves TEST_ENV = "uat"
        ├─ dotenv.config({ path: 'src/config/.env.uat', override:true })   # env overrides
        └─ validates process.env.URL exists  →  throws if missing
        │
        ▼
Project: "auth" runs first
        │
        ├─ auth.spec.ts → LoginPage.login() → getCredentials() → decryptPassword()
        ├─ navigateTo("/") → fillUsernameAndPassword() → clickLoginBtn()
        ├─ HomePage.expectPageElementsVisibilityOnLoad()
        └─ PASS: pipeline continues │ FAIL: pipeline aborts
        │
        ▼
Projects: "chromium-shard1" ‖ "chromium-shard2" (parallel)
        │
        ├─ Each test:
        │   ├─ login() fresh session
        │   ├─ sessionGuard.assertUserStillLoggedIn()
        │   ├─ Page interactions via POM methods
        │   ├─ PDF download → PDFUtils.unzipDownloadedZip() → readLatestPDFFromLatestUnzipDir()
        │   ├─ Email verification → GmailUtils.waitForEmailWithPreciseTime()
        │   └─ Assertions via expect()
        │
        ├─ Playwright captures: video (always) + screenshot (always) + trace (on-first-retry)
        └─ Outputs: blob-report/  +  test-results.json
        │
        ▼
CI merge-reports job (if: always())
        │
        ├─ Merges blob-report-auth + blob-report-1 + blob-report-2
        ├─ parse-json-report.js → appends to test-results-history/consolidated.json
        └─ Publishes HTML report + dashboard to GitHub Pages
        │
        ▼
        │  [When ENABLE_NETWORK_CAPTURE=true AND tests use src/fixtures/test.ts]
        │   ├─ globalSetup.ts cleans ai-outputs/traces/worker-{n}.json shards
        │   ├─ _captureWorker fixture resets NetworkTraceStore per worker
        │   ├─ _captureActive fixture attaches NetworkCapture to each test's page
        │   ├─ On test teardown: traces added to NetworkTraceStore (in-process)
        │   ├─ On worker teardown: NetworkTraceStore flushes to worker-{n}.json
        │   └─ globalTeardown.ts merges all worker-{n}.json → network-traces.json
        │
        ▼
AI Analysis (triggered separately: npm run ai:full)
        │
        ├─ TrendPatternAgent     → ai-outputs/reports/trend.json
        ├─ DeepFailurePatternAgent → ai-outputs/reports/deep-failure.json
        ├─ RegressionDeltaAgent  → ai-outputs/reports/regression-delta.json
        ├─ DatabaseIntegrityAgent → ai-outputs/reports/db-integrity.json
        ├─ ApiIntelligenceAgent  reads network-traces.json
        │     ├─ { _isMockData: true, traces: [...] }  → seed file → report._isMockData = true
        │     └─ ApiTrace[]  (plain array)              → real file → no mock flag
        │                     → ai-outputs/reports/api-intelligence.json
        └─ generate-ai-report.js → ai-outputs/ai-report.html  (self-contained React app)
```

---

## 5. Configuration Analysis

### 5.1 `playwright.config.ts`

| Parameter        | Value                                    | Why                                                                                   |
| ---------------- | ---------------------------------------- | ------------------------------------------------------------------------------------- |
| `timeout`        | `120_000 ms`                             | SIMS Finance generates heavyweight Crystal/XQuery reports — needs 2 min               |
| `expect.timeout` | `35_000 ms`                              | Allows slow server-side renders to settle                                             |
| `fullyParallel`  | `false` (root)                           | Shard parallelism is managed at project level                                         |
| `retries`        | `0` (root), overridden per-project in CI | Avoids masking real failures locally                                                  |
| `workers`        | `1` in CI, `undefined` locally           | CI VMs are single-core; local devs get auto-detected CPUs                             |
| `reporter`       | `[blob, json]`                           | blob for merging; JSON for AI consumption                                             |
| `video`          | `on`                                     | Always capture — essential for debugging flaky UI                                     |
| `screenshot`     | `on`                                     | Attached to every test result                                                         |
| `trace`          | `on-first-retry`                         | Keeps artefact size manageable; captures the retry context                            |
| `maxFailures`    | `2` in CI                                | Stop-early — prevents running 40 min of tests after the environment is clearly broken |
| `outputDir`      | `C:/temp/playwright-test-results`        | Avoids filling the repo root with video artefacts                                     |
| `globalSetup`    | `src/utils/globalSetup.ts`               | Cleans stale per-worker trace shards before each run                                  |
| `globalTeardown` | `src/utils/globalTeardown.ts`            | Merges per-worker trace shards into `network-traces.json` after all workers finish    |

**Projects block pattern:**

```
auth  →  chromium-shard1 (grep: @shard1)  ‖  chromium-shard2 (grep: @shard2)
```

Auth blocks shards via CI `needs:` dependency. Shards run in parallel within CI matrix.

### 5.2 Environment Config Cascade

```
src/config/.env           # ENCRYPTION_KEY, fallback values
src/config/.env.training  # URL, USERID, PASSWORD for TRAINING
src/config/.env.uat       # URL, USERID, PASSWORD for UAT
```

`env.ts` wraps `process.env.*` into a typed static class — prevents typos and enables IDE completion.

**Rule:** Never read `process.env` directly in test code. Always go through `ENV.URL`, `ENV.USERID`, etc.

### 5.3 `tsconfig.json`

| Option              | Value      | Why                                                    |
| ------------------- | ---------- | ------------------------------------------------------ |
| `target`            | `ESNext`   | Use modern JS features                                 |
| `module`            | `commonjs` | Node.js compatibility                                  |
| `strict`            | `true`     | Catches null-reference and type errors at compile time |
| `resolveJsonModule` | `true`     | Allows `import data from './data.json'`                |
| `isolatedModules`   | `true`     | Required for `ts-node` transpile-only mode             |

### 5.4 GitHub Actions (`playwright.yml`)

Three jobs:

| Job             | `needs`     | `if`        | Purpose                                             |
| --------------- | ----------- | ----------- | --------------------------------------------------- |
| `auth-gate`     | —           | always      | Validate login; fail fast before 60-min shard run   |
| `postchecks`    | `auth-gate` | `success()` | Run 2 shards in matrix; `fail-fast: true`           |
| `merge-reports` | both        | `always()`  | Merge, publish dashboard; runs even on auth failure |

**Playwright browser caching:**

```yaml
uses: actions/cache@v4
key: playwright-${{ runner.os }}-${{ hashFiles('package-lock.json') }}
```

Browser cache is keyed to `package-lock.json` — automatically invalidated when Playwright version changes.

**Scheduled runs:** Daily at 08:00 UTC + ad-hoc release day crons (specific dates/times for deployment windows).

---

## 6. Reporting Framework

### 6.1 Layer 1 — Playwright Native

| Artefact    | How                                             | When                  |
| ----------- | ----------------------------------------------- | --------------------- |
| HTML report | `playwright-merge-html-reports` merges blobs    | Always (CI merge job) |
| JSON report | `["json", { outputFile: "test-results.json" }]` | Every run             |
| Video       | `video: "on"`                                   | Every test            |
| Screenshot  | `screenshot: "on"`                              | Every test            |
| Trace       | `trace: "on-first-retry"`                       | On retry              |

### 6.2 Layer 2 — Run History Dashboard

`parse-json-report.js` in CI:

1. Reads `test-results.json` from each shard.
2. Appends a normalised summary entry to `test-results-history/consolidated.json`.
3. `generate-dashboard.js` reads consolidated history and generates the HTML dashboard deployed to GitHub Pages.

The `consolidated.json` is the single source of truth that feeds all AI agents.

### 6.3 Layer 3 — AI Intelligence Report (`ai-report.html`)

A self-contained **React + Chart.js** single-file report generated by `generate-ai-report.js`. Contains:

- All agent JSON outputs embedded as JS data objects.
- 5 KPI tiles: Health Score, Avg Test Pass Rate, Last Execution Age (per env), Unstable Tests, Last Failure Age (per env).
- Executive summaries from TrendPatternAgent and DeepFailurePatternAgent.
- Per-test stability table with lifecycle badges (Newly Observed, Recurring, Reappeared, Increasing, Improving).
- Co-failure pattern analysis.
- Regression delta: before/after pivot date with Regressed/Improved verdicts.
- API intelligence summary (endpoint profiles, latency, error rates).

**To serve locally:**

```bash
npm run ai:serve    # starts Express server on port 3000
```

### 6.4 Recreating the Reporting Stack

```bash
# 1. Run tests → produces test-results.json + blob-report/
npx playwright test

# 2. Append to consolidated history
node src/config/parse-json-report.js test-results.json test-results-history/consolidated.json

# 3. Run all AI agents (needs AZURE_OPENAI_* env vars)
npm run ai:full

# 4. Generate the HTML report
npm run ai:report

# 5. Preview
npm run ai:serve
```

---

## 7. Utilities & Custom Helpers

### 7.1 `credentials.ts`

**Role:** Single point for credential resolution.  
**Pattern:** `getCredentials(tenant, school, userRole)` → reads environment-specific JSON → decrypts password → returns `[username, password]` tuple.  
**Why tuple?** `LoginPage.login([username, password], testInfo)` destructures directly — avoids separate variables.

### 7.2 `encryptor.ts` / `encrypt-cli.ts`

AES-256-CBC encrypt/decrypt. `encrypt-cli.ts` is a runnable CLI for onboarding new credentials without storing them plain-text.

> ⚠️ **Security note:** The hard-coded `ENCRYPTION_KEY` in `encryptor.ts` should be replaced by `process.env.ENCRYPTION_KEY` in a production-grade implementation.

### 7.3 `sessionGuard.ts`

**Role:** Mid-test session expiry detector.  
Checks `page.url()` for UAT's login redirect pattern. Called before critical steps.  
**Why it exists:** UAT enforces single-session — if a second login invalidates the first, the test gets a confusing `element not found` 10 steps in. `sessionGuard` converts that to an explicit `❌ Session expired` error.

### 7.4 `PDFUtils.ts`

**Role:** Full download-to-text pipeline for report verification.  
Flow: `Download` event → `saveAs(zip)` → `FileUtils.unzipFile()` → `latestFileNameLookup(*.PDF)` → `pdf-parse` → text string for `expect().toContain()`.

### 7.5 `ExcelHandler.ts`

**Role:** Read GL code spreadsheets and test data files.  
Methods: `readSheet`, `writeSheet`, `readCell`, `writeCell` with safe validation.

### 7.6 `NetworkCapture.ts`

**Role:** Passive network listener that converts Playwright request/response events into `ApiTrace` records.  
**Design principles (from file header):**

- PASSIVE — never modifies requests.
- NON-BLOCKING — capture errors never propagate to test code.
- SAFE — see PII masking layers below.
- MEMORY-BOUNDED — max 500 traces per test (configurable via `MAX_TRACES_PER_TEST`).

**PII masking layers (applied to all request/response bodies):**

| Layer          | What is masked                                                                                                                                       |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Auth fields    | `password`, `token`, `secret`, `apiKey`, `accessToken`, `refreshToken`, `jwt`, `bearerToken`                                                         |
| Finance fields | `accountNumber`, `sortCode`, `bankAccount`, `iban`, `bic`, `cardNumber`, `cvv`, `niNumber`, `nationalInsurance`, `payrollNumber`, `utr`, `vatNumber` |
| Auth patterns  | `Bearer <token>`, `Basic <credentials>`                                                                                                              |
| UK NI numbers  | Regex: `[A-CEGHJ-PR-TW-Z][ABCEGHJ-NPR-TW-Z]\d{6}[A-D]`                                                                                               |
| UK sort codes  | Pattern: `nn-nn-nn`                                                                                                                                  |
| Card numbers   | Visa / Mastercard / Amex patterns                                                                                                                    |

Feeds `ApiIntelligenceAgent` for API contract inference.

### 7.7a `src/fixtures/test.ts` _(new)_

**Role:** Extended Playwright test object that auto-attaches `NetworkCapture` to every test page with zero per-test code changes.  
**Activation:** Set `ENABLE_NETWORK_CAPTURE=true` in `src/config/.env`. Off by default.

| Fixture          | Scope         | Behaviour                                                                    |
| ---------------- | ------------- | ---------------------------------------------------------------------------- |
| `_captureWorker` | Worker (auto) | Resets `NetworkTraceStore` at worker start; flushes shard file at worker end |
| `_captureActive` | Test (auto)   | Starts `NetworkCapture` on page; adds traces to store on teardown            |

**Import change required in test files:**

```typescript
// Before
import test, { expect } from "@playwright/test";

// After
import { test, expect } from "../../fixtures/test";
```

### 7.7b `src/utils/globalSetup.ts` _(new)_

**Role:** Runs once before all Playwright workers. Removes stale `worker-{n}.json` trace shard files from previous runs. Creates `ai-outputs/traces/` if missing.

### 7.7c `src/utils/globalTeardown.ts` _(new)_

**Role:** Runs once after all Playwright workers finish. Merges all `worker-{n}.json` shard files into the consolidated `network-traces.json` using `NetworkTraceStore.mergeFiles()`. No-op when `ENABLE_NETWORK_CAPTURE` is not set.

### 7.7 `GmailUtils.ts`

**Role:** OAuth2 Gmail polling — verifies that SIMS Finance correctly dispatched report emails.  
Uses `googleapis` with a stored `gmail-token.json`. `waitForEmailWithPreciseTime()` polls with a time-based filter to avoid picking up older emails.

### 7.8 `InvoiceCalc.ts`

**Role:** Business logic validation helpers for invoice arithmetic.  
Validates net + VAT = gross calculations in the Finance module — pure TypeScript math, no UI interaction.

### 7.9 `glcodehelper.ts`

**Role:** Extracts GL codes from SIMS data structures for comparison assertions.

---

## 8. Test Design Standards

### 8.1 Naming

| Entity           | Convention                                          | Example                                   |
| ---------------- | --------------------------------------------------- | ----------------------------------------- |
| Spec files       | `<FeatureName>.spec.ts`                             | `PostChecksTests.spec.ts`                 |
| Page classes     | `<ScreenCode>.ts` (PascalCase)                      | `NML510.ts`, `RSS570.ts`                  |
| Test names       | `"<Action> @shard<N>"`                              | `"NML510 - Trial Balance Report @shard1"` |
| Helper functions | camelCase, verb-first                               | `getCredentials()`, `decryptPassword()`   |
| Locators         | `private readonly _<name>Locator` with typed getter | `private readonly _submitBtnLocator`      |

### 8.2 Tagging Strategy

| Tag       | Purpose                                          |
| --------- | ------------------------------------------------ |
| `@shard1` | Runs on chromium-shard1 project (matrix index 1) |
| `@shard2` | Runs on chromium-shard2 project (matrix index 2) |
| `@auth`   | Auth gate test — runs on `auth` project only     |

Tags are Playwright `grep` filters, not BDD tags. They control which project runs which tests.

### 8.3 Locator Strategy

Priority order (most to least preferred):

1. **ID selectors** (`#submit`, `#btn_ok`) — stable, unique.
2. **Class + attribute combo** (`.username`, `input#company_id`) — descriptive.
3. **CSS positional** (`td:right-of(td[axes='COMP_DESC'])>button`) — for complex grid layouts.
4. **Text-based** (`text="Background"`) — only when no structural selector exists.
5. **Dynamic ID prefix** (`*[id^=ui-id]`) — for jQuery UI dialogs with auto-incremented IDs.

All locators are private `readonly` fields on page classes — never inline strings in tests.

### 8.4 Assertion Strategy

- Use Playwright's auto-retrying `expect(locator).toBeVisible()` over manual `waitFor`.
- `expect.timeout` is set to 35 s globally — sufficient for server-side renders.
- For PDF content: `expect(pdfText).toContain(expectedString)`.
- For navigation: `expect(page).toHaveURL(/pattern/)`.

### 8.5 Data Management

| Data type          | Storage                        | Access                                                      |
| ------------------ | ------------------------------ | ----------------------------------------------------------- |
| Credentials        | `users.<env>.json` (encrypted) | `getCredentials(tenant, school, role)`                      |
| UI strings         | `data/expectedTexts.json`      | `import expectedTexts from '../../data/expectedTexts.json'` |
| Labels             | `data/labels.json`             | same pattern                                                |
| Navigation paths   | `data/paths.json`              | same pattern                                                |
| Locator attributes | `data/elementAttributes.json`  | same pattern                                                |

**No magic strings in tests.** All string literals are externalised to JSON files.

### 8.6 Wait Strategy

- Playwright's built-in auto-waiting covers most cases (click waits for actionability).
- `expect(locator).toBeVisible({ timeout: 35000 })` for slow renders.
- `page.waitForLoadState('networkidle')` avoided — use specific element visibility assertions instead.
- Gmail polling uses time-based retry loops in `GmailUtils`.

---

## 9. CI/CD & Execution Strategy

### 9.1 Pipeline Architecture

```
Trigger: push/PR to Main, workflow_dispatch, scheduled cron
         │
         ▼
┌────────────────┐       fails → pipeline stops
│   auth-gate    │ ──────────────────────────────────► ✗ Pipeline aborted
│  (1 worker)    │
└───────┬────────┘
        │ success
        ▼
┌────────────────┐  ┌────────────────┐   fail-fast: true
│  postchecks    │  │  postchecks    │   (one fails → other cancelled)
│   shard 1      │  │   shard 2      │
└───────┬────────┘  └───────┬────────┘
        └──────────┬─────────┘
                   │ always()
                   ▼
        ┌──────────────────┐
        │  merge-reports   │   merges blobs, appends history,
        │  + publish       │   deploys to GitHub Pages
        └──────────────────┘
```

### 9.2 Environment Selection

```bash
# Local — TRAINING
cross-env TEST_ENV=training npx playwright test

# Local — UAT
cross-env TEST_ENV=uat npx playwright test

# CI — set via GitHub Actions secret / env var
TEST_ENV=uat npx playwright test --project=auth
```

### 9.3 Parallelism

| Level                   | Mechanism                                          |
| ----------------------- | -------------------------------------------------- |
| Shard-level             | GitHub Actions matrix (`shardIndex: [1, 2]`)       |
| Test-level within shard | `workers: 1` in CI (single-session UAT constraint) |
| Local                   | `workers: undefined` (auto CPU detection)          |

**Why workers=1 in CI?** UAT enforces one active session per user. Multiple workers = multiple simultaneous logins = session invalidation. Each test does its own fresh login sequentially within a shard.

### 9.4 Artefact Publishing

| Artefact           | Published to             | Retention |
| ------------------ | ------------------------ | --------- |
| Blob reports       | GitHub Actions artifacts | 30 days   |
| Merged HTML report | GitHub Pages             | Permanent |
| test-results.json  | GitHub Actions artifacts | 30 days   |
| consolidated.json  | Committed to repo        | Permanent |

---

## 10. Dependency Mapping

### Critical Dependencies

| Package            | Role                             | Removable?                             |
| ------------------ | -------------------------------- | -------------------------------------- |
| `@playwright/test` | Test runner + browser automation | ❌ Core                                |
| `typescript`       | Language                         | ❌ Core                                |
| `dotenv`           | Env var loading                  | ❌ Core                                |
| `winston`          | Structured logging               | ⚠️ Replace with `pino` for better perf |
| `cross-env`        | Windows env var injection        | ❌ Core (Windows dev)                  |

### Feature Dependencies

| Package                         | Role                      | Removable?                |
| ------------------------------- | ------------------------- | ------------------------- |
| `pdf-parse`                     | PDF text extraction       | ✅ Only if no PDF reports |
| `xlsx`                          | Excel GL code files       | ✅ Only if no Excel data  |
| `googleapis`                    | Gmail OAuth2 verification | ✅ Only if no email tests |
| `mssql`                         | DB integrity checks       | ✅ Only if no DB agent    |
| `@azure/openai` + `openai`      | AI agents                 | ✅ Only if no AI layer    |
| `playwright-merge-html-reports` | Shard report merging      | ✅ Only if single shard   |
| `decompress`                    | Unzip PDF downloads       | ✅ Only if no ZIP reports |
| `postmark`                      | Alternative email sending | ✅ Currently unused       |

### Suggested Modern Replacements

| Current                   | Suggested                                            | Reason                                   |
| ------------------------- | ---------------------------------------------------- | ---------------------------------------- |
| `xlsx` (deprecated)       | `exceljs`                                            | Actively maintained, better streaming    |
| `pdf-parse`               | `pdfjs-dist`                                         | Official Mozilla, better text extraction |
| `crypto` (hard-coded key) | `@aws-sdk/client-secrets-manager` or Azure Key Vault | Proper secrets management                |
| Winston file transport    | Datadog / Sentry SDK                                 | Centralised log aggregation for teams    |

---

## 11. Framework Recreation Guide

### Phase 1 — Minimal Viable Framework

```bash
# 1. Init project
mkdir my-playwright-framework && cd my-playwright-framework
npm init -y
npm install -D @playwright/test typescript @types/node cross-env dotenv
npx playwright install chromium
npx tsc --init
```

```bash
# 2. Create folder structure
mkdir -p src/{config,data,logging,pages,tests/{Auth,Post-Deployment-Tests},utils}
mkdir .github/workflows
```

```bash
# 3. Create tsconfig.json (match the framework's settings)
# target: ESNext, module: commonjs, strict: true, resolveJsonModule: true
```

**Base files to create first (in order):**

| Order | File                                             | Why first                               |
| ----- | ------------------------------------------------ | --------------------------------------- |
| 1     | `src/config/.env` + `.env.UAT` + `.env.TRAINING` | Everything depends on env vars          |
| 2     | `src/config/env.ts`                              | Typed env wrapper used everywhere       |
| 3     | `src/logging/logger.ts`                          | Used by playwright.config.ts            |
| 4     | `playwright.config.ts`                           | Framework entry point                   |
| 5     | `src/data/expectedTexts.json`                    | Test data referenced by pages + tests   |
| 6     | `src/utils/encryptor.ts`                         | Needed by credentials                   |
| 7     | `src/data/users.uat.json`                        | Credential store                        |
| 8     | `src/utils/credentials.ts`                       | Used by all tests                       |
| 9     | `src/pages/BasePage.ts`                          | All page classes extend this            |
| 10    | `src/pages/LoginPage.ts` + `HomePage.ts`         | Every test starts here                  |
| 11    | `src/utils/sessionGuard.ts`                      | Add immediately for UAT resilience      |
| 12    | `src/tests/Auth/auth.spec.ts`                    | Verify login works before anything else |
| 13    | First feature page (e.g. `RSS570.ts`) + its spec | First real test                         |

### Phase 2 — Add Utilities

```bash
# PDF reports
npm install -D pdf-parse decompress @types/pdf-parse

# Excel data files
npm install -D xlsx

# Structured logging
npm install winston
```

Add: `PDFUtils.ts`, `FileUtils.ts`, `FileManager.ts`, `ExcelHandler.ts`

### Phase 3 — Add CI Pipeline

Create `.github/workflows/playwright.yml` with the 3-job pattern:

```yaml
jobs:
    auth-gate: { timeout-minutes: 15 }
    postchecks:
        {
            needs: auth-gate,
            strategy: { matrix: { shardIndex: [1, 2] }, fail-fast: true }
        }
    merge-reports: { needs: [auth-gate, postchecks], if: always() }
```

Add browser caching:

```yaml
- uses: actions/cache@v4
  with:
      path: ~/.cache/ms-playwright
      key: playwright-${{ runner.os }}-${{ hashFiles('package-lock.json') }}
```

### Phase 4 — Add Run History

```bash
# Create parse-json-report.js to append to consolidated.json
# Create generate-dashboard.js to build HTML dashboard
mkdir test-results-history
echo '[]' > test-results-history/consolidated.json
```

### Phase 5 — Add AI Intelligence Layer (Optional)

```bash
npm install -D @azure/openai openai

mkdir -p src/test-intelligence/{contracts,adapters,ai/{agents,config,prompts,utils},utils}
```

**Required env vars for AI agents:**

```env
AZURE_OPENAI_ENDPOINT=https://<resource>.openai.azure.com
AZURE_OPENAI_API_KEY=<key>
AZURE_OPENAI_DEPLOYMENT=gpt-4o
```

Implement agents in this order:

1. `playwrightAdapter.ts` — normalise test results first
2. `TrendPatternAgent.ts` — macro health view
3. `DeepFailurePatternAgent.ts` — per-test profiles
4. `RegressionDeltaAgent.ts` — before/after comparison
5. `DatabaseIntegrityAgent.ts` — DB snapshot diff
6. `ApiIntelligenceAgent.ts` — network trace analysis

### npm Script Setup

```json
{
    "scripts": {
        "test:uat": "cross-env TEST_ENV=uat npx playwright test",
        "test:training": "cross-env TEST_ENV=training npx playwright test",
        "test:auth": "cross-env TEST_ENV=uat npx playwright test --project=auth",
        "ai:trends": "npx ts-node src/test-intelligence/ai/agents/TrendPatternAgent.ts ...",
        "ai:deep": "npx ts-node src/test-intelligence/ai/agents/DeepFailurePatternAgent.ts ...",
        "ai:full": "node scripts/run-ai-full.js",
        "ai:report": "node scripts/generate-ai-report.js ...",
        "ai:serve": "node scripts/ai-server.js"
    }
}
```

---

## 12. Improvements & Modernisation

### 12.1 Security

| Issue              | Current                             | Recommended                                        |
| ------------------ | ----------------------------------- | -------------------------------------------------- |
| Encryption key     | Hard-coded string in `encryptor.ts` | Read from `process.env.ENCRYPTION_KEY` exclusively |
| Secrets in `.env`  | Git-ignored locally                 | Use GitHub Actions Secrets + Azure Key Vault in CI |
| `gmail-token.json` | Committed?                          | Add to `.gitignore`, store in CI secret            |

### 12.2 Architecture

| Area                    | Current                                 | Improvement                                                                                       |
| ----------------------- | --------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Login helper            | Local function repeated in spec files   | Extract to a **shared Playwright fixture** (`src/fixtures/auth.fixture.ts`) — cleaner, composable |
| `outputDir`             | Hard-coded `C:/temp/`                   | Use `path.join(process.cwd(), '.playwright-results')` — OS-agnostic                               |
| `workers: 1` in CI      | Forced single-worker due to UAT session | Implement **per-user credential pools** in `users.uat.json` — one user per worker                 |
| Global `maxFailures: 2` | Stops entire run on 2 failures          | Consider per-project `maxFailures` — allow auth to fail independently                             |

### 12.3 Reporting

| Current                      | Improvement                                           |
| ---------------------------- | ----------------------------------------------------- |
| Static HTML dashboard        | Add WebSocket push for live run status                |
| AI report generated post-run | Stream agent outputs progressively as tests complete  |
| GitHub Pages only            | Add Slack/Teams webhook notification with run summary |

### 12.4 Test Design

| Current                               | Improvement                                                                         |
| ------------------------------------- | ----------------------------------------------------------------------------------- |
| `test.step()` wrapping is manual      | Create a custom `step()` fixture that auto-logs entry/exit and attaches screenshots |
| PDF assertion via `toContain(string)` | Add structured PDF parser that extracts table rows — more resilient assertions      |
| Email polling is time-based           | Add retry with exponential backoff in `GmailUtils`                                  |

### 12.5 AI Layer

| Current                                      | Status  | Improvement                                                          |
| -------------------------------------------- | ------- | -------------------------------------------------------------------- |
| Agents run sequentially in `run-ai-full.js`  | Open    | Run agents concurrently with `Promise.all()` — 5× faster             |
| AI model hard-coded to `gpt-4o`              | Open    | Support model fallback chain: `gpt-4o` → `gpt-4o-mini` on rate limit |
| `consolidated.json` is unbounded             | Open    | Add rolling window (e.g. last 90 days) to prevent token limit issues |
| `NetworkCapture` as global fixture           | ✅ Done | `src/fixtures/test.ts` with auto-use worker + test scoped fixtures   |
| `ai:full` doesn't run `ApiIntelligenceAgent` | ✅ Done | `run-ai-full.js` now includes `ai:api` step with mock fallback       |
| Mock data in API Intelligence section        | ✅ Done | `_isMockData` propagated from trace file through agent to dashboard  |

### 12.6 Developer Experience

```bash
# Add Prettier pre-commit hook
npm install -D husky lint-staged
npx husky init

# Add TypeScript path aliases (avoid ../../../../utils)
# tsconfig.json: "paths": { "@utils/*": ["src/utils/*"], "@pages/*": ["src/pages/*"] }
npm install -D tsconfig-paths

# Add test result notifications
npm install -D @slack/webhook
```

### 12.7 Enterprise-Grade Additions

| Feature                   | Implementation                                                                 |
| ------------------------- | ------------------------------------------------------------------------------ |
| Test tagging taxonomy     | Add `@smoke`, `@regression`, `@critical` tags alongside shard tags             |
| Environment parity checks | Add a `EnvironmentDriftAgent` that compares API responses across envs          |
| Visual regression         | Add `@playwright/experimental-ct-react` or Percy for screenshot diffing        |
| Accessibility             | Add `axe-playwright` — run accessibility scans as part of post-deploy checks   |
| Performance budget        | Capture `timing.domContentLoaded` per page — alert if exceeds threshold        |
| Multi-tenant matrix       | Extend `strategy.matrix` in CI to include `tenant: [sfdemosite4, sfdemosite5]` |

---

---

## 13. API Intelligence — Real Capture Integration _(May 2026)_

This section documents the end-to-end implementation connecting live Playwright test traffic to the API Intelligence dashboard section.

### 13.1 Architecture Overview

```
[Playwright test run]
    src/fixtures/test.ts (_captureWorker + _captureActive auto-use fixtures)
        │
        ├─ per test: NetworkCapture attaches to page → collects ApiTrace[]
        └─ per worker teardown: NetworkTraceStore.flush("worker-{n}.json")
                │
                ▼
    globalTeardown.ts
        NetworkTraceStore.mergeFiles([worker-0.json, worker-1.json, …])
            → ai-outputs/traces/network-traces.json  (plain ApiTrace[])
                │
                ▼
    npm run ai:api
        ApiIntelligenceAgent
            ├─ Detects format: plain array = real, {_isMockData,traces} = seed
            ├─ ApiTrafficAnalyzer (deterministic: profiles, latency, domains)
            ├─ Azure OpenAI (workflow names, insights, executive summary)
            └─ ai-outputs/reports/api-intelligence.json
                │  (_isMockData: true when seed input; omitted when real)
                ▼
    npm run ai:report
        generate-ai-report.js embeds api-intelligence.json into ai-report.html
            └─ ApiIntelligenceSection renders 🧪 Mock Data banner when _isMockData
```

### 13.2 Trace File Formats

| File                         | Format                                          | Written by               | Indicates                                        |
| ---------------------------- | ----------------------------------------------- | ------------------------ | ------------------------------------------------ |
| `network-traces.json` (seed) | `{ "_isMockData": true, "traces": ApiTrace[] }` | Committed to repo        | Seed/demo data — mock banner shows               |
| `network-traces.json` (real) | `ApiTrace[]` (plain array)                      | `globalTeardown.ts`      | Real captured traffic — no mock banner           |
| `worker-{n}.json`            | `ApiTrace[]`                                    | `_captureWorker` fixture | Transient shard — merged and deleted by teardown |

### 13.3 Environment Variables

| Variable                 | Default        | Purpose                                                                                                           |
| ------------------------ | -------------- | ----------------------------------------------------------------------------------------------------------------- |
| `ENABLE_NETWORK_CAPTURE` | `false`        | Set to `"true"` to activate capture. When absent, all fixtures are no-ops and `network-traces.json` is untouched. |
| `MAX_TRACES_PER_TEST`    | `200`          | Maximum traces stored per test. Reduce for very large suites.                                                     |
| `CAPTURE_HOSTNAMES`      | _(from `URL`)_ | Comma-separated extra hostnames to capture beyond the primary app URL.                                            |

Add to `src/config/.env`:

```env
ENABLE_NETWORK_CAPTURE=true
MAX_TRACES_PER_TEST=200
# CAPTURE_HOSTNAMES=api2.example.com,auth.example.com
```

### 13.4 Activation Checklist

| Step | Action                            | File                                         |
| ---- | --------------------------------- | -------------------------------------------- |
| 1    | Set `ENABLE_NETWORK_CAPTURE=true` | `src/config/.env`                            |
| 2    | Change test import                | `src/tests/*/YourTest.spec.ts`               |
| 3    | Run Playwright tests              | `npm run test:uat`                           |
| 4    | Run AI analysis                   | `npm run ai:full`                            |
| 5    | View report                       | `npm run ai:serve` → `http://localhost:3001` |

**Test import change (step 2):**

```typescript
// Before
import test, { expect, Page, TestInfo } from "@playwright/test";

// After
import { test, expect } from "../../fixtures/test";
import type { Page, TestInfo } from "@playwright/test";
```

### 13.5 Mock vs Real Mode

| Mode            | Trigger                                                                     | Dashboard indicator                                                   |
| --------------- | --------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| **Mock / Seed** | `network-traces.json` has `_isMockData: true` wrapper                       | `🧪 Mock Data — POC Demonstration` purple banner + section label pill |
| **Real**        | `network-traces.json` is a plain `ApiTrace[]` (written by `globalTeardown`) | No banner                                                             |

The `_isMockData` flag is propagated from the input trace file through `ApiIntelligenceAgent` into `api-intelligence.json`. The HTML report checks `report._isMockData === true` to conditionally render the banner — no manual intervention required.

### 13.6 Fallback / Resilience

`run-ai-full.js` handles three `ai:api` failure scenarios:

| Scenario                           | Behaviour                                                                                                             |
| ---------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `network-traces.json` missing      | `ai:api` exits 1 → pipeline preserves existing `api-intelligence.json` (if present); silently skips if neither exists |
| Seed `network-traces.json` present | Agent runs, writes report with `_isMockData: true`; not counted as pipeline failure                                   |
| Azure OpenAI credentials missing   | `ai:api` exits 1 → existing `api-intelligence.json` preserved; pipeline marked failed only if no fallback exists      |

### 13.7 `ApiTrace` Contract

All captured HTTP interactions conform to `src/test-intelligence/contracts/ApiTrace.ts`:

```typescript
interface ApiTrace {
    seq: number; // monotonically increasing per test run
    timestamp: string; // UTC ISO-8601
    testTitle: string; // Playwright test title (e.g. "PRL300Q - Add Invoice @shard1")
    method: string; // GET | POST | PUT | PATCH | DELETE
    url: string; // sanitised URL (sensitive query params redacted)
    pathname: string; // e.g. "/api/invoices"
    hostname: string; // e.g. "sims-uat.capita.com"
    queryParams: Record<string, string>; // sensitive keys → "[REDACTED]"
    requestHeaders: Record<string, string>; // auth headers → "[REDACTED]"
    requestBody: string | null; // truncated, PII-masked
    responseStatus: number;
    responseHeaders: Record<string, string>;
    responseBody: string | null; // truncated, PII-masked
    durationMs: number;
    domain?: SIMSDomain; // set by ApiTrafficAnalyzer
    category?: ApiCategory; // set by ApiTrafficAnalyzer
}
```

---

_Generated from live codebase analysis — May 2026. Updated with API Intelligence real capture integration._
