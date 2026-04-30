/**
 * runFilters.ts
 *
 * Shared run-filtering utilities used by TrendPatternAgent and DeepFailurePatternAgent.
 * Keep this file free of any AI or HTTP dependencies.
 */

const FULL_DAYS = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday"
];

/**
 * Filter runs by day of week.
 * Defaults to excluding Saturday and Sunday — test runs are business-days-only.
 * Override by setting EXCLUDE_DAYS env var (comma-separated day names or 3-letter abbrevs).
 * Set EXCLUDE_DAYS= (empty string) to disable filtering entirely.
 * Examples: EXCLUDE_DAYS=Saturday,Sunday  |  EXCLUDE_DAYS=Sat,Sun  |  EXCLUDE_DAYS=
 */
export function filterByExcludedDays<T extends { timestamp: string }>(
    runs: T[]
): T[] {
    // Default to weekends; empty string explicitly disables filtering
    const raw = process.env.EXCLUDE_DAYS ?? "Saturday,Sunday";
    if (!raw.trim()) return runs;

    const excluded = new Set(
        raw
            .split(",")
            .map((d) => d.trim().toLowerCase())
            .flatMap((d) =>
                FULL_DAYS.filter((fd) => fd.toLowerCase().startsWith(d))
            )
    );

    if (excluded.size === 0) return runs;

    const before = runs.length;
    const filtered = runs.filter((r) => {
        const datePart = r.timestamp.split("_")[0];
        const day = FULL_DAYS[new Date(`${datePart}T00:00:00Z`).getUTCDay()];
        return !excluded.has(day);
    });

    console.log(
        `\n\uD83D\uDCC5 Weekend filter (${process.env.EXCLUDE_DAYS === undefined ? "default: Sat/Sun" : "EXCLUDE_DAYS=" + process.env.EXCLUDE_DAYS}): removed ${before - filtered.length} run(s), ${filtered.length} remain.`
    );
    return filtered;
}
