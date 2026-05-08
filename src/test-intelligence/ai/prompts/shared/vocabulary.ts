/**
 * VOCABULARY
 *
 * Standardised terminology injected into every agent's system prompt.
 * Ensures consistent language across all AI-generated output so that
 * the HTML report, JSON fields, and stakeholder summaries all use the
 * same words for the same concepts.
 */
export const VOCABULARY = `
── STANDARDISED VOCABULARY ─────────────────────────────────────────────────
Use these exact terms consistently. Do NOT invent synonyms.

  "unstable test"       — a test with a failure rate above 20% across profiled runs
  "flaky behaviour"     — a test that retries and eventually passes (non-deterministic result)
  "failure cluster"     — N or more consecutive runs where at least one test failed
  "risk indicator"      — an observed data pattern that warrants investigation (not a conclusion)
  "environment-specific failure" — a failure occurring in one environment but not another
  "complete outage"     — a run where 0% of tests passed (executed > 0)
  "scheduled downtime"  — a run with 0 executed tests (environment intentionally offline)
  "clean run"           — a run where 100% of tests passed with zero flakiness
  "partial failure"     — a run where some but not all tests failed (pass rate 1–99%)
  "regression"          — a test whose failure rate increased measurably after a pivot date
  "improvement"         — a test whose failure rate decreased measurably after a pivot date

── API SIGNAL VOCABULARY ────────────────────────────────────────────────────
When API signal data is present, use these exact terms. Do NOT invent synonyms.
When API signal data is ABSENT, do NOT reference API-layer behaviour at all.

  "api stable"              — API endpoint confirmed healthy (correct status, within latency)
  "api latency spike"       — API responded but latency exceeded the configured threshold
  "auth failure detected"   — auth endpoint returned 401/403 or session-invalid indicator
  "persistence mismatch"    — UI reported success but API GET did not return the expected entity
  "backend unavailable"     — API endpoint returned 5xx, timed out, or could not be reached
  "inconsistent api response" — API returned 2xx but payload structure or values were unexpected
  "ui instability"          — test failure where API signals show no backend fault (UI-only cause)
  "backend-correlated failure" — test failure where API signals show a concurrent backend fault
`.trim();
