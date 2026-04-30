# test-intelligence

Framework-agnostic AI analytics layer for Playwright test results.

## Architecture

```
src/test-intelligence/
├── contracts/
│   ├── TestResult.ts        — single test outcome (name, status, duration, error)
│   └── TestRun.ts           — one suite execution (summary counts + optional per-test results)
├── adapters/
│   └── playwrightAdapter.ts — converts Playwright-specific formats → TestRun[]
├── utils/
│   └── helpers.ts           — shared utilities (run filtering, date helpers)
└── index.ts                 — public API surface
```

## Three Layers

### 1. Contracts (`contracts/`)

Plain TypeScript interfaces with no dependencies.  
`TestResult` and `TestRun` are the only types agents import.

```ts
interface TestRun {
    timestamp: string;
    environment?: string;
    results: TestResult[]; // empty for summary-only runs
    summary: { total; passed; failed; flaky };
    durationMs?: number;
}
```

### 2. Adapter (`adapters/playwrightAdapter.ts`)

The **only** file that knows about Playwright's JSON structure.

| Function                 | Input                          | Output                                  |
| ------------------------ | ------------------------------ | --------------------------------------- |
| `mapSummaryToTestRun`    | consolidated.json entry        | `TestRun` (summary only, `results: []`) |
| `mapRunOutcomeToTestRun` | `RunOutcome` from GitHub Pages | `TestRun` (with per-test `results`)     |

To add Cypress support: add `mapCypressRunToTestRun()` here. No agents change.

### 3. Agents (`../ai/agents/`)

Each agent receives `TestRun[]` and returns a typed report. Agents:

- Import only from `test-intelligence/contracts/`
- Never import Playwright-specific types directly
- Remain callable via CLI unchanged (npm scripts unaffected)

| Agent                     | Input                            | Output                    |
| ------------------------- | -------------------------------- | ------------------------- |
| `TrendPatternAgent`       | `TestRun[]` (summary)            | `TrendReport`             |
| `DeepFailurePatternAgent` | `TestRun[]` (per-test)           | `DeepFailureReport`       |
| `RegressionDeltaAgent`    | `TestRun[]` (summary + per-test) | `RegressionDeltaReport`   |
| `DatabaseIntegrityAgent`  | SQL connection                   | `DatabaseIntegrityReport` |

## Usage

```ts
import {
    mapSummaryToTestRun,
    analyseTrends,
    filterByExcludedDays,
    type TestRun
} from "src/test-intelligence";

const raw = JSON.parse(fs.readFileSync("consolidated.json", "utf-8"));
const runs: TestRun[] = raw.runs.map(mapSummaryToTestRun);
const filtered = filterByExcludedDays(runs);
const report = await analyseTrends("consolidated.json");
```

## Existing npm Scripts (unchanged)

```
npm run ai:trends      → TrendPatternAgent
npm run ai:deep        → DeepFailurePatternAgent
npm run ai:regression  → RegressionDeltaAgent
npm run ai:db:check    → DatabaseIntegrityAgent
npm run ai:full        → all agents + report generation
```
