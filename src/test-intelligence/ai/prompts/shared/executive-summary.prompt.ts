/**
 * EXECUTIVE_SUMMARY_RULES
 *
 * Shared prompt block enforcing fact-based, risk-aware executive summary
 * generation. Imported by every agent that produces an executiveSummary field.
 *
 * Agents embed this at the end of their SYSTEM_PROMPT using template literal
 * interpolation:
 *
 *   import { EXECUTIVE_SUMMARY_RULES } from "../prompts/shared/executive-summary.prompt";
 *   const SYSTEM_PROMPT = `...agent rules...
 *
 *   ${EXECUTIVE_SUMMARY_RULES}`;
 */
export const EXECUTIVE_SUMMARY_RULES = `
── EXECUTIVE SUMMARY RULES ─────────────────────────────────────────────────
Write the executiveSummary as 5–8 bullet points ("• ...") readable by a non-technical stakeholder.
Do NOT use paragraph prose — use bullet points only.

Structure each summary in this exact order:

  A. OBSERVATIONS (facts only, directly supported by the data provided)
     • State what happened: percentages, counts, dates, specific names.
     • Examples: "X% of business-day runs had at least one test failure"
               "N consecutive runs recorded failures between [date] and [date]"
               "Y unstable tests were detected with failure rates above 20%"

  B. RISK INDICATORS (potential risks, no asserted root cause)
     • Use hedged language: "may indicate", "suggests", "observed pattern", "could reflect".
     • Examples: "This pattern may indicate instability in a shared dependency"
               "Repeated flaky behaviour in the same time window could reflect an environment issue"
               "Co-failing tests may suggest a shared data state or configuration dependency"

  C. IMPACT PERSPECTIVE (translate risk into user-facing or operational terms)
     • Examples: "May affect report generation consistency for finance staff"
               "Could lead to intermittent failures in invoice or purchase order processing"
               "May reduce confidence in automated checks during financial period close"

  D. RECOMMENDED FOCUS AREAS (where to investigate, NOT what to fix)
     • Suggest investigation directions only — no prescriptive fixes.
     • Examples: "Further analysis of retry patterns during peak hours may provide insight"
               "Comparing environment-specific failure rates could help isolate the cause"
               "Reviewing data state around failure timestamps may clarify the pattern"

STRICT TONE RULES:
  - NEVER use: "root cause is", "definitely", "clearly", "the problem is", "this is caused by"
  - ALWAYS prefer: "suggests", "may indicate", "observed", "pattern shows", "could reflect"
  - No technical jargon (avoid: "shard", "CI/CD pipeline", "fixture", "assertion", "test harness")
  - Maximum 8 bullet points total across all four sections
  - Each bullet ≤ 25 words
  - Base every bullet strictly on data provided — no generic boilerplate
`.trim();
