/**
 * generate-dashboard.js
 *
 * Generates the published-reports/index.html dashboard by injecting
 * live test-history and report-row data into a React-based HTML template.
 *
 * Usage:
 *   node scripts/generate-dashboard.js <consolidated_json> <rows_json> <output_html>
 *
 * Example (as called by the CI workflow):
 *   node scripts/generate-dashboard.js \
 *     /tmp/consolidated_data.json \
 *     /tmp/rows_data.json \
 *     published-reports/index.html
 */

"use strict";

const fs = require("fs");
const path = require("path");

// ---------------------------------------------------------------------------
// Argument handling
// ---------------------------------------------------------------------------
const [, , consolidatedJsonPath, rowsJsonPath, outputHtmlPath] = process.argv;

if (!consolidatedJsonPath || !rowsJsonPath || !outputHtmlPath) {
    console.error(
        "Usage: node generate-dashboard.js <consolidated_json> <rows_json> <output_html>"
    );
    process.exit(1);
}

// ---------------------------------------------------------------------------
// Read inputs
// ---------------------------------------------------------------------------
function readJson(filePath, fallback) {
    try {
        let raw = fs.readFileSync(filePath, "utf8").trim();

        // Bash JSON builders often append a trailing comma before the closing
        // bracket/brace, producing invalid JSON (e.g. [{...},{...},]).  Strip it.
        raw = raw
            .replace(/,\s*]/g, "]") // trailing comma before ]
            .replace(/,\s*}/g, "}"); // trailing comma before }

        JSON.parse(raw); // validate — throws if still malformed
        return raw;
    } catch (err) {
        console.warn(
            `Warning: could not read/parse ${filePath} – using fallback. (${err.message})`
        );
        return JSON.stringify(fallback);
    }
}

const historyJson = readJson(consolidatedJsonPath, { runs: [] });
const rowsJson = readJson(rowsJsonPath, []);

// ---------------------------------------------------------------------------
// HTML template — React 18 + Tailwind CSS CDN + Chart.js
// ---------------------------------------------------------------------------
const template = /* html */ `<!DOCTYPE html>
<html lang="en" class="h-full">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>SIMS Finance – Test Health Monitor</title>

  <!-- Tailwind CSS (Play CDN — no build step required) -->
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      theme: {
        extend: {
          colors: {
            brand: { DEFAULT: '#10b981', dark: '#059669' }
          }
        }
      }
    };
  </script>

  <!-- React 18 -->
  <script src="https://cdn.jsdelivr.net/npm/react@18/umd/react.production.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/react-dom@18/umd/react-dom.production.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/@babel/standalone/babel.min.js"></script>

  <!-- Chart.js -->
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>

  <style>
    /* Tooltip for shard breakdown */
    .shard-tooltip { position: relative; display: inline-block; cursor: default; }
    .shard-tooltip .tooltip-box {
      visibility: hidden; opacity: 0;
      position: absolute; z-index: 50; bottom: 125%; left: 50%;
      transform: translateX(-50%);
      background: #1e293b; color: #f1f5f9;
      padding: 8px 12px; border-radius: 8px;
      font-size: 12px; white-space: nowrap;
      box-shadow: 0 4px 12px rgba(0,0,0,0.25);
      transition: opacity 0.15s ease;
      pointer-events: none;
    }
    .shard-tooltip:hover .tooltip-box { visibility: visible; opacity: 1; }
    .shard-tooltip .tooltip-box::after {
      content: '';
      position: absolute; top: 100%; left: 50%;
      transform: translateX(-50%);
      border: 6px solid transparent;
      border-top-color: #1e293b;
    }

    /* Sort icons on th */
    .sort-icon::after  { content: '\\2195'; margin-left: 4px; font-size: 11px; opacity: 0.7; }
    .sort-asc::after   { content: '\\2191'; margin-left: 4px; font-size: 11px; }
    .sort-desc::after  { content: '\\2193'; margin-left: 4px; font-size: 11px; }

    /* Smooth row hover */
    tbody tr { transition: background 0.12s ease; }
  </style>
</head>
<body class="bg-slate-50 text-slate-800 min-h-full font-sans">

  <div id="root"></div>

  <!-- Injected by generate-dashboard.js -->
  <script id="app-data">
    window.__APP_DATA__ = {
      testHistory: __HISTORY_PLACEHOLDER__,
      reportsData: __ROWS_PLACEHOLDER__
    };
  </script>

  <!-- AI Plugin Registry — Phase 3A PoC (one section; expand after validation) -->
  <script id="ai-plugin-registry">
    window.__AI_PLUGIN_REGISTRY__ = [
      {
        id:        "api-intelligence",
        label:     "API Intelligence",
        dataPath:  "./ai-intelligence/latest/api-intelligence.json",
        component: "ApiIntelligenceSection"
      }
    ];
  </script>

  <script type="text/babel">
    const { useState, useEffect, useRef, useMemo } = React;
    const { testHistory, reportsData } = window.__APP_DATA__;

    // -----------------------------------------------------------------------
    // Normalise raw data — guards against legacy records missing fields and
    // against bash xargs leaving stray whitespace on string values.
    // -----------------------------------------------------------------------
    const normalisedData = (Array.isArray(reportsData) ? reportsData : []).map(r => ({
      date:         (r.date         || '').trim(),
      time:         (r.time         || '').trim(),
      link:         (r.link         || '#').trim(),
      status:       (r.status       || 'Unknown').trim(),
      environment:  (r.environment  || '').trim(),
      execTime:     (r.execTime     || 'N/A').trim(),
      workflowTime: (r.workflowTime || 'N/A').trim(),
      failedStage:  (r.failedStage  || '').trim(),
      shardTimes:   Array.isArray(r.shardTimes) ? r.shardTimes : [],
    }));

    // -----------------------------------------------------------------------
    // Colour helpers
    // -----------------------------------------------------------------------
    function statusPill(status) {
      const s = (status || '').trim();
      if (s === 'Passed')
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">✓ Passed</span>;
      if (s === 'Failed')
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-700">✕ Failed</span>;
      return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-500">– {s || '?'}</span>;
    }

    const ENV_STYLES = {
      UAT:        'bg-blue-100 text-blue-800 border-blue-200',
      STAGING:    'bg-purple-100 text-purple-800 border-purple-200',
      PRODUCTION: 'bg-rose-100 text-rose-800 border-rose-200',
      DEV:        'bg-amber-100 text-amber-800 border-amber-200',
    };
    function envBadge(env) {
      const e = (env || '').trim();
      if (!e) return <span className="text-slate-400">—</span>;
      const cls = ENV_STYLES[e.toUpperCase()] || 'bg-slate-100 text-slate-700 border-slate-200';
      return (
        <span className={\`inline-block px-2 py-0.5 rounded-full text-xs font-bold border \${cls}\`}>
          {e}
        </span>
      );
    }

    // -----------------------------------------------------------------------
    // Summary Cards (latest run)
    // -----------------------------------------------------------------------
    // Detect if a date string (YYYY-MM-DD) falls on a weekend (UTC)
    // -----------------------------------------------------------------------
    function isWeekendDate(dateStr) {
      if (!dateStr) return false;
      const d = new Date(dateStr + 'T12:00:00Z'); // noon UTC avoids DST edge cases
      const day = d.getUTCDay();
      return day === 0 || day === 6; // 0=Sun, 6=Sat
    }

    // Returns the day-of-week label for a YYYY-MM-DD string
    function dayLabel(dateStr) {
      if (!dateStr) return '';
      const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
      return days[new Date(dateStr + 'T12:00:00Z').getUTCDay()] ?? '';
    }

    // -----------------------------------------------------------------------
    function SummaryCards() {
      // Most-recent run attempt (may be a weekend / auth-gate failure)
      const latest = normalisedData[0];
      if (!latest) return null;

      // Most-recent run that actually executed tests (not an auth-gate or pure weekend stub)
      const lastComplete = useMemo(
        () => normalisedData.find(r => r.failedStage !== 'auth' && r.status !== 'Unknown'),
        []
      );

      // Is the most recent entry a weekend auth-gate (env-down) attempt?
      const isWeekendAuthGate = latest.failedStage === 'auth' && isWeekendDate(latest.date);
      // Is it a weekday auth-gate (unexpected — env should be up)?
      const isWeekdayAuthGate = latest.failedStage === 'auth' && !isWeekendDate(latest.date);

      const successRate = useMemo(() => {
        const baseRow = lastComplete ?? latest;
        const run = (testHistory.runs || []).find(r =>
          r.timestamp && r.timestamp.startsWith(baseRow.date)
        );
        if (!run || !run.counts || !run.counts.executed) return null;
        return Math.round((run.counts.passed / run.counts.executed) * 100);
      }, [latest, lastComplete]);

      // Status card values: when the latest is a weekend auth-gate, describe it
      // differently to avoid a misleading "FAILED" impression on an expected event.
      const statusColor = isWeekendAuthGate
        ? 'bg-slate-500 text-white'
        : isWeekdayAuthGate
          ? 'bg-rose-600 text-white'
          : latest.status === 'Passed'
            ? 'bg-emerald-500 text-white'
            : latest.status === 'Failed'
              ? 'bg-rose-500 text-white'
              : 'bg-slate-400 text-white';

      const statusIcon  = isWeekendAuthGate ? '🔐' : isWeekdayAuthGate ? '🔐' : latest.status === 'Passed' ? '✓' : latest.status === 'Failed' ? '✕' : '?';
      const statusLabel = isWeekendAuthGate ? 'Env Offline' : isWeekdayAuthGate ? 'Auth Failed' : latest.status;

      // Header: show "Last Attempted" vs "Last Complete Run" when they differ
      const headerDate = latest.date;
      const headerTime = latest.time;
      const showCompleteSeparately = lastComplete && lastComplete.date !== latest.date;

      return (
        <section className="px-6 py-5">
          {/* Weekend auth-gate callout banner */}
          {isWeekendAuthGate && (
            <div className="mb-4 flex items-start gap-3 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
              <span className="text-xl mt-0.5">🔐</span>
              <div>
                <p className="text-sm font-semibold text-slate-700">
                  Monitoring active over the weekend — environment was offline as expected
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  The workflow ran on <strong>{dayLabel(latest.date)} {latest.date}</strong> and confirmed
                  the environment was down at the auth gate. This is <strong>expected planned downtime</strong>,
                  not a test failure. Last complete execution was on <strong>{lastComplete?.date ?? '—'}</strong>.
                </p>
              </div>
            </div>
          )}

          <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-1">
            Last Attempted — {dayLabel(headerDate)} {headerDate} {headerTime}
            {isWeekendAuthGate && <span className="ml-2 inline-block px-2 py-0.5 rounded-full bg-slate-200 text-slate-600 text-xs font-bold normal-case tracking-normal">Weekend</span>}
          </h2>
          {showCompleteSeparately && (
            <p className="text-xs text-slate-400 mb-3">
              Last complete execution: <strong className="text-slate-600">{dayLabel(lastComplete.date)} {lastComplete.date}</strong>
            </p>
          )}
          {!showCompleteSeparately && <div className="mb-3" />}

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">

            {/* Status */}
            <div className="bg-white rounded-xl shadow-md p-5 flex flex-col gap-1">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                {isWeekendAuthGate ? 'Last Attempt' : 'Status'}
              </span>
              <div className={\`mt-2 inline-flex items-center gap-2 self-start px-4 py-2 rounded-lg text-lg font-bold \${statusColor}\`}>
                <span>{statusIcon}</span>
                <span>{statusLabel}</span>
              </div>
              {isWeekendAuthGate && (
                <span className="text-xs text-slate-400 mt-1">Planned downtime · auth gate</span>
              )}
              {showCompleteSeparately && !isWeekendAuthGate && (
                <span className="text-xs text-slate-400 mt-1">
                  Last complete: <span className="font-semibold text-slate-600">{lastComplete.status}</span>
                </span>
              )}
            </div>

            {/* Success Rate — based on last complete run, not a weekend stub */}
            <div className="bg-white rounded-xl shadow-md p-5 flex flex-col gap-1">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Success Rate{showCompleteSeparately ? <span className="ml-1 font-normal text-slate-400 normal-case tracking-normal">(last complete)</span> : ''}
              </span>
              {successRate !== null
                ? <>
                    <span className={\`text-4xl font-extrabold mt-1 \${successRate === 100 ? 'text-emerald-500' : successRate >= 80 ? 'text-amber-500' : 'text-rose-500'}\`}>
                      {successRate}%
                    </span>
                    <div className="mt-2 h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={\`h-2 rounded-full \${successRate === 100 ? 'bg-emerald-500' : successRate >= 80 ? 'bg-amber-400' : 'bg-rose-500'}\`}
                        style={{width: successRate + '%'}}
                      />
                    </div>
                  </>
                : <span className="text-3xl font-extrabold mt-1 text-slate-400">N/A</span>
              }
            </div>

            {/* Wall-Clock Times — use last complete row when latest is a weekend stub */}
            {(() => {
              const timeRow = (isWeekendAuthGate && lastComplete) ? lastComplete : latest;
              return (
                <div className="bg-white rounded-xl shadow-md p-5 flex flex-col gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Execution Time{isWeekendAuthGate && lastComplete ? <span className="ml-1 font-normal text-slate-400 normal-case tracking-normal">(last complete)</span> : ''}
                  </span>
                  <div className="flex flex-col gap-1 mt-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-xs text-slate-500 font-medium">🧪 Playwright</span>
                      <span className="text-lg font-extrabold text-violet-600">{timeRow.execTime || 'N/A'}</span>
                    </div>
                    {timeRow.shardTimes && timeRow.shardTimes.length > 0 && (
                      <div className="shard-tooltip self-start ml-5 mb-1">
                        <span className="text-xs text-slate-400 underline decoration-dotted cursor-help">shard details ▾</span>
                        <div className="tooltip-box">
                          {timeRow.shardTimes.map(s => (
                            <div key={s.shard} className="flex gap-3 justify-between">
                              <span className="font-semibold">Shard {s.shard}</span>
                              <span>{s.label}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="flex items-baseline justify-between gap-2 border-t border-slate-100 pt-1">
                      <span className="text-xs text-slate-500 font-medium">⚙️ Workflow</span>
                      <span className="text-lg font-extrabold text-indigo-500">{timeRow.workflowTime || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Environment */}
            <div className="bg-white rounded-xl shadow-md p-5 flex flex-col gap-1">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Environment</span>
              <div className="mt-2">{envBadge(latest.environment)}</div>
              <span className="text-xs text-slate-400 mt-1">
                {isWeekendAuthGate ? 'Offline at auth gate (weekend)' : 'Target under test'}
              </span>
            </div>

          </div>
        </section>
      );
    }

    // -----------------------------------------------------------------------
    // TrendsChart  (modern palette + smooth curves)
    // -----------------------------------------------------------------------
    function TrendsChart({ runs }) {
      const canvasRef = useRef(null);
      const chartRef  = useRef(null);
      useEffect(() => {
        if (!canvasRef.current) return;
        if (chartRef.current) chartRef.current.destroy();
        chartRef.current = new Chart(canvasRef.current, {
          type: 'line',
          data: {
            labels: runs.map(r => r.timestamp.replace(/_/g, ' ')),
            datasets: [
              { label: 'Executed', data: runs.map(r => r.counts.executed), borderColor: '#6366f1', backgroundColor: 'rgba(99,102,241,0.1)',  borderWidth: 2, tension: 0.4, pointRadius: 4, pointHoverRadius: 6 },
              { label: 'Passed',   data: runs.map(r => r.counts.passed),   borderColor: '#10b981', backgroundColor: 'rgba(16,185,129,0.1)',  borderWidth: 2, tension: 0.4, pointRadius: 4, pointHoverRadius: 6 },
              { label: 'Failed',   data: runs.map(r => r.counts.failed),   borderColor: '#f43f5e', backgroundColor: 'rgba(244,63,94,0.1)',   borderWidth: 2, tension: 0.4, pointRadius: 4, pointHoverRadius: 6 },
              { label: 'Flaky',    data: runs.map(r => r.counts.flaky),    borderColor: '#f59e0b', backgroundColor: 'rgba(245,158,11,0.1)',  borderWidth: 2, tension: 0.4, pointRadius: 4, pointHoverRadius: 6, borderDash: [6,4] }
            ]
          },
          options: {
            responsive: true, maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false },
            plugins: {
              legend: { position: 'top', labels: { usePointStyle: true, padding: 20, font: { size: 12 } } },
              tooltip: { padding: 12, cornerRadius: 8 }
            },
            scales: {
              x: { grid: { display: false }, title: { display: true, text: 'Run Timestamp', font: { size: 11 } } },
              y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' }, title: { display: true, text: 'Tests', font: { size: 11 } } }
            }
          }
        });
        return () => { if (chartRef.current) chartRef.current.destroy(); };
      }, [runs]);
      return <canvas ref={canvasRef} />;
    }

    // -----------------------------------------------------------------------
    // ExecutionTimeChart  (smooth + modern purple)
    // -----------------------------------------------------------------------
    function ExecutionTimeChart({ runs }) {
      const canvasRef = useRef(null);
      const chartRef  = useRef(null);
      useEffect(() => {
        if (!canvasRef.current) return;
        if (chartRef.current) chartRef.current.destroy();
        chartRef.current = new Chart(canvasRef.current, {
          type: 'line',
          data: {
            labels: runs.map(r => r.timestamp.replace(/_/g, ' ')),
            datasets: [{
              label: 'Wall-Clock Time (mins)',
              data: runs.map(r => Math.round((r.executionTimeSec || 0) / 60)),
              borderColor: '#8b5cf6',
              backgroundColor: 'rgba(139,92,246,0.12)',
              borderWidth: 2.5,
              tension: 0.4,
              fill: true,
              pointRadius: 4,
              pointHoverRadius: 7,
              pointBackgroundColor: '#8b5cf6'
            }]
          },
          options: {
            responsive: true, maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false },
            plugins: {
              legend: { position: 'top', labels: { usePointStyle: true, padding: 20, font: { size: 12 } } },
              tooltip: { padding: 12, cornerRadius: 8 }
            },
            scales: {
              y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' }, title: { display: true, text: 'Minutes', font: { size: 11 } } },
              x: { grid: { display: false }, title: { display: true, text: 'Run Timestamp', font: { size: 11 } } }
            }
          }
        });
        return () => { if (chartRef.current) chartRef.current.destroy(); };
      }, [runs]);
      return <canvas ref={canvasRef} />;
    }

    // -----------------------------------------------------------------------
    // WeekendMonitoringSection
    // Shows a compact information row for every weekend (Sat/Sun) run recorded
    // in reportsData — particularly auth-gate failures that confirm the
    // environment was offline as per the planned schedule.
    // Visible only when at least one weekend run exists in the last 14 days.
    // -----------------------------------------------------------------------
    function WeekendMonitoringSection() {
      const cutoff = useMemo(() => {
        const d = new Date();
        d.setUTCDate(d.getUTCDate() - 14);
        return d.toISOString().slice(0, 10);
      }, []);

      const weekendRows = useMemo(() =>
        normalisedData.filter(r => r.date >= cutoff && isWeekendDate(r.date))
      , [cutoff]);

      if (weekendRows.length === 0) return null;

      return (
        <section className="px-6 pb-2 pt-0">
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            {/* Section header */}
            <div className="flex items-center gap-3 px-5 py-3 bg-slate-50 border-b border-slate-100">
              <span className="text-base">📡</span>
              <div>
                <h2 className="text-xs font-bold uppercase tracking-widest text-slate-600">Weekend Monitoring Activity</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  The CI workflow ran on the following weekend dates and recorded monitoring outcomes.
                  Auth-gate stops on weekends are <strong>expected planned downtime</strong> — not failures.
                </p>
              </div>
            </div>

            {/* Row per weekend run */}
            <div className="divide-y divide-slate-100">
              {weekendRows.map((r, i) => {
                const isAuth    = r.failedStage === 'auth';
                const dayName   = dayLabel(r.date);
                const outcome   = isAuth ? 'Auth gate — env offline' : r.status === 'Passed' ? 'Completed (unexpected)' : 'Failed (unexpected)';
                const outcomeColor = isAuth
                  ? 'text-slate-500'
                  : r.status === 'Passed'
                    ? 'text-emerald-600'
                    : 'text-rose-600';
                const badge = isAuth
                  ? <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">🔐 Planned Downtime</span>
                  : r.status === 'Passed'
                    ? <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 border border-emerald-200">✓ Ran (weekend)</span>
                    : <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 border border-amber-200">⚠ Unexpected failure</span>;
                return (
                  <div key={i} className="flex flex-wrap items-center gap-x-6 gap-y-1 px-5 py-2.5">
                    {/* Date + day */}
                    <div className="flex items-center gap-2 min-w-[120px]">
                      <span className="text-xs font-mono text-slate-700">{r.date}</span>
                      <span className="text-xs font-semibold text-slate-400">{dayName}</span>
                    </div>
                    {/* Time */}
                    <span className="text-xs font-mono text-slate-400">{r.time}</span>
                    {/* Environment */}
                    <span className="text-xs">{envBadge(r.environment)}</span>
                    {/* Outcome badge */}
                    {badge}
                    {/* Human-readable outcome */}
                    <span className={\`text-xs \${outcomeColor}\`}>{outcome}</span>
                    {/* Link */}
                    {r.link && r.link !== '#' && (
                      <a href={r.link} target="_blank" rel="noreferrer"
                         className="text-xs text-emerald-600 hover:text-emerald-800 underline decoration-dotted transition ml-auto">
                        View run ↗
                      </a>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Footer note */}
            <div className="px-5 py-2 bg-slate-50 border-t border-slate-100">
              <p className="text-xs text-slate-400">
                ✅ <strong>Monitoring coverage confirmed</strong> — the workflow is scheduled and running.
                Weekend downtime is a known environment constraint, not a test suite regression.
              </p>
            </div>
          </div>
        </section>
      );
    }

    // -----------------------------------------------------------------------
    // App
    // -----------------------------------------------------------------------
    function App() {
      const [dateFilter,   setDateFilter]   = useState('');
      const [statusFilter, setStatusFilter] = useState('');
      const [envFilter,    setEnvFilter]    = useState('');
      const [sortCol,      setSortCol]      = useState(null);
      const [sortDir,      setSortDir]      = useState('asc');
      const [currentPage,  setCurrentPage]  = useState(1);
      const [timeRange,    setTimeRange]    = useState('7');
      const rowsPerPage = 10;

      // Unique environment list derived from normalised data
      const environments = useMemo(() =>
        [...new Set(normalisedData.map(r => r.environment).filter(Boolean))].sort()
      , []);

      const filtered = useMemo(() =>
        normalisedData.filter(r => {
          // All comparisons use already-trimmed normalised values.
          // Empty filter string → match everything (no filter applied).
          const dateOk   = !dateFilter   || r.date        === dateFilter;
          const statusOk = !statusFilter || r.status      === statusFilter.trim();
          const envOk    = !envFilter    || r.environment === envFilter.trim();
          return dateOk && statusOk && envOk;
        }),
        [dateFilter, statusFilter, envFilter]
      );

      const sorted = useMemo(() => {
        if (!sortCol) return filtered;
        return [...filtered].sort((a, b) => {
          const aVal = (a[sortCol] || '').trim();
          const bVal = (b[sortCol] || '').trim();
          return sortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
        });
      }, [filtered, sortCol, sortDir]);

      const totalPages = Math.max(1, Math.ceil(sorted.length / rowsPerPage));
      const paginated  = sorted.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

      function handleSort(col) {
        if (sortCol === col) { setSortDir(d => d === 'asc' ? 'desc' : 'asc'); }
        else { setSortCol(col); setSortDir('asc'); }
        setCurrentPage(1);
      }
      function resetPage() { setCurrentPage(1); }

      const filteredRuns = useMemo(() => {
        const runs = [...(testHistory.runs || [])].sort((a, b) => a.timestamp.localeCompare(b.timestamp));
        if (timeRange === 'all') return runs;
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - parseInt(timeRange));
        return runs.filter(r => new Date(r.timestamp.split('_')[0]) >= cutoff);
      }, [timeRange]);

      function thClass(col) {
        if (sortCol !== col) return 'sort-icon';
        return sortDir === 'asc' ? 'sort-asc' : 'sort-desc';
      }

      const inputCls = "px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-400";
      const labelCls = "text-xs font-semibold uppercase tracking-wide text-slate-500";

      return (
        <div className="min-h-screen flex flex-col">

          {/* ---- Header ---- */}
          <header className="bg-gradient-to-r from-emerald-600 to-emerald-500 text-white px-8 py-6 shadow-md">
            <div className="max-w-screen-2xl mx-auto flex items-center justify-between flex-wrap gap-3">
              <div>
                <h1 className="text-2xl font-bold tracking-tight">SIMS Finance – Test Health Monitor</h1>
                <p className="text-emerald-100 text-sm mt-0.5">Playwright Execution Reports · GitHub Actions CI</p>
              </div>
              <div className="text-right">
                <span className="block text-xs bg-white/20 px-3 py-1 rounded-full font-mono">
                  Last updated: {new Date().toLocaleString('en-GB', {day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'})}
                </span>
              </div>
            </div>
          </header>

          <main className="flex-1 max-w-screen-2xl mx-auto w-full px-4 sm:px-6 pb-10">

            {/* ---- Summary Cards ---- */}
            <SummaryCards />

            {/* ---- Weekend Monitoring Activity ---- */}
            <WeekendMonitoringSection />

            {/* ---- AI Intelligence Strip (lazy, manifest-driven, fault-isolated) ---- */}
            <AiIntelligenceStrip />

            {/* ---- Filters ---- */}
            <section className="bg-white rounded-xl shadow-md px-6 py-4 mb-5 flex flex-wrap gap-5 items-end">
              <div className="flex flex-col gap-1">
                <label className={labelCls}>Date</label>
                <input type="date" className={inputCls} value={dateFilter}
                  onChange={e => { setDateFilter(e.target.value); resetPage(); }} />
              </div>
              <div className="flex flex-col gap-1">
                <label className={labelCls}>Status</label>
                <select className={inputCls} value={statusFilter} onChange={e => { setStatusFilter(e.target.value); resetPage(); }}>
                  <option value="">All Statuses</option>
                  <option value="Passed">Passed</option>
                  <option value="Failed">Failed</option>
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className={labelCls}>Environment</label>
                <select className={inputCls} value={envFilter} onChange={e => { setEnvFilter(e.target.value); resetPage(); }}>
                  <option value="">All Environments</option>
                  {environments.map(env => <option key={env} value={env}>{env}</option>)}
                </select>
              </div>
              {(dateFilter || statusFilter || envFilter) && (
                <button
                  className="self-end text-xs text-slate-400 hover:text-slate-600 underline transition"
                  onClick={() => { setDateFilter(''); setStatusFilter(''); setEnvFilter(''); resetPage(); }}>
                  Clear filters
                </button>
              )}
            </section>

            {/* ---- Table + Trends side-by-side ---- */}
            <div className="flex flex-col xl:flex-row gap-5 mb-5">

              {/* Table card */}
              <div className="bg-white rounded-xl shadow-md overflow-hidden flex-1 min-w-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-slate-700 text-white text-xs uppercase tracking-wide">
                      <tr>
                        <th className={\`px-4 py-3 cursor-pointer select-none \${thClass('date')}\`}      onClick={() => handleSort('date')}>Date</th>
                        <th className="px-4 py-3">Time</th>
                        <th className="px-4 py-3">Report</th>
                        <th className={\`px-4 py-3 cursor-pointer select-none \${thClass('status')}\`}    onClick={() => handleSort('status')}>Status</th>
                        <th className={\`px-4 py-3 cursor-pointer select-none \${thClass('environment')}\`} onClick={() => handleSort('environment')}>Environment</th>
                        <th className="px-4 py-3">Execution Time</th>
                        <th className="px-4 py-3">Stage</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {paginated.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="text-center py-10 text-slate-400 text-sm">
                            No reports match the current filters.
                          </td>
                        </tr>
                      ) : paginated.map((r, i) => {
                        const isWkndAuth = r.failedStage === 'auth' && isWeekendDate(r.date);
                        return (
                        <tr key={i} className={\`hover:bg-slate-50 transition-colors \${isWkndAuth ? 'bg-slate-50/70' : ''}\`}>
                          <td className="px-4 py-3 font-mono text-xs text-slate-600 whitespace-nowrap">
                            {r.date}
                            {isWkndAuth && <span className="ml-1.5 text-slate-400 text-xs font-medium">({dayLabel(r.date)})</span>}
                          </td>
                          <td className="px-4 py-3 font-mono text-xs text-slate-500 whitespace-nowrap">{r.time}</td>
                          <td className="px-4 py-3">
                            <a href={r.link} target="_blank" rel="noreferrer"
                               className="inline-flex items-center gap-1 text-emerald-600 hover:text-emerald-800 font-medium text-xs transition">
                              ↗ View
                            </a>
                          </td>
                          <td className="px-4 py-3">
                            {isWkndAuth
                              ? <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-500">⏸ Env Offline</span>
                              : statusPill(r.status)
                            }
                          </td>
                          <td className="px-4 py-3">{envBadge(r.environment)}</td>
                          <td className="px-4 py-3 text-xs">
                            <span className={\`font-semibold \${isWkndAuth ? 'text-slate-400' : 'text-slate-700'}\`}>{isWkndAuth ? '—' : r.execTime}</span>
                            {!isWkndAuth && r.shardTimes && r.shardTimes.length > 0 && (
                              <div className="shard-tooltip">
                                <span className="block text-slate-400 underline decoration-dotted cursor-help text-xs mt-0.5">
                                  shard details ▾
                                </span>
                                <div className="tooltip-box">
                                  {r.shardTimes.map(s => (
                                    <div key={s.shard} className="flex gap-4 justify-between">
                                      <span className="font-semibold">Shard {s.shard}</span>
                                      <span>{s.label}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3 text-xs">
                            {r.failedStage && r.failedStage !== 'None'
                              ? <span className={\`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border \${
                                  isWkndAuth
                                    ? 'bg-slate-100 text-slate-500 border-slate-200'
                                    : r.failedStage === 'auth'
                                      ? 'bg-rose-100 text-rose-700 border-rose-200'
                                      : 'bg-amber-100 text-amber-700 border-amber-200'
                                }\`}>
                                  {r.failedStage === 'auth' ? '🔐' : '🧪'} {isWkndAuth ? 'auth · planned downtime' : r.failedStage}
                                </span>
                              : <span className="text-slate-300">—</span>
                            }
                          </td>
                        </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-center gap-3 py-4 border-t border-slate-100">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(p => p - 1)}
                    className="px-4 py-1.5 text-sm rounded-lg bg-emerald-500 text-white font-medium disabled:opacity-30 disabled:cursor-not-allowed hover:bg-emerald-600 transition">
                    ← Prev
                  </button>
                  <span className="text-xs text-slate-500">Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong></span>
                  <button
                    disabled={currentPage >= totalPages}
                    onClick={() => setCurrentPage(p => p + 1)}
                    className="px-4 py-1.5 text-sm rounded-lg bg-emerald-500 text-white font-medium disabled:opacity-30 disabled:cursor-not-allowed hover:bg-emerald-600 transition">
                    Next →
                  </button>
                </div>
              </div>

              {/* Trends chart card */}
              <div className="bg-white rounded-xl shadow-md p-6 xl:w-[480px] flex-shrink-0">
                <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
                  <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Test Execution Trends</h2>
                  <select className="text-xs border border-slate-200 rounded-lg px-2 py-1 bg-white"
                    value={timeRange} onChange={e => setTimeRange(e.target.value)}>
                    <option value="7">Last 7 days</option>
                    <option value="14">Last 14 days</option>
                    <option value="30">Last 30 days</option>
                    <option value="all">All time</option>
                  </select>
                </div>
                <div className="h-80 relative">
                  <TrendsChart runs={filteredRuns} />
                </div>
              </div>
            </div>

            {/* ---- Execution Time Chart card (full width) ---- */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-4">Wall-Clock Execution Time Trend</h2>
              <div className="h-72 relative">
                <ExecutionTimeChart runs={filteredRuns} />
              </div>
            </div>

          </main>

          <footer className="text-center py-5 text-slate-400 text-xs border-t border-slate-200">
            &copy; {new Date().getFullYear()} SIMS Finance · Playwright Test Reports · All rights reserved.
          </footer>
        </div>
      );
    }

    // =========================================================================
    // AI Intelligence Strip — Phase 3A proof-of-concept
    //
    // Architecture:
    //   useManifest()          — async fetch, never blocks render
    //   AiErrorBoundary        — isolates crashes; deterministic dashboard unaffected
    //   ApiIntelligenceSection — fetches data only when user expands the strip
    //   AvailabilityBadge      — reflects manifest state (loading/available/stale/unavailable)
    //   AiIntelligenceStrip    — collapsed by default; drives the whole thing
    // =========================================================================

    const STALE_THRESHOLD_MS = 48 * 60 * 60 * 1000; // 48 h → data older than this is flagged stale

    // ── useManifest ──────────────────────────────────────────────────────────
    // Fetches manifest.json asynchronously on mount.
    // Never throws — always resolves to a state object.
    // Returns: { status: 'loading'|'available'|'stale'|'unavailable', manifest }
    function useManifest() {
      const [ms, setMs] = useState({ status: 'loading', manifest: null });
      useEffect(() => {
        const t0 = performance.now();
        fetch('./ai-intelligence/latest/manifest.json')
          .then(function(r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
          .then(function(m) {
            var age     = Date.now() - new Date(m.generatedAt).getTime();
            var isStale = age > STALE_THRESHOLD_MS;
            var elapsed = Math.round(performance.now() - t0);
            console.debug('[AI] manifest loaded ' + elapsed + 'ms — '
              + (m.sectionsAvailable || []).length + ' section(s)'
              + (isStale ? ' [STALE — ' + Math.round(age / 3600000) + 'h old]' : ''));
            setMs({ status: isStale ? 'stale' : 'available', manifest: m });
          })
          .catch(function(err) {
            console.debug('[AI] manifest unavailable —', err.message);
            setMs({ status: 'unavailable', manifest: null });
          });
      }, []);
      return ms;
    }

    // ── AiErrorBoundary ──────────────────────────────────────────────────────
    // Catches rendering errors in AI sections so they never propagate to the
    // deterministic dashboard.
    class AiErrorBoundary extends React.Component {
      constructor(props) { super(props); this.state = { crashed: false }; }
      static getDerivedStateFromError() { return { crashed: true }; }
      componentDidCatch(err) { console.error('[AI] Section error caught by boundary:', err.message); }
      render() {
        if (this.state.crashed) return (
          <div className="rounded-lg bg-rose-50 border border-rose-200 px-4 py-3 text-xs text-rose-700 flex items-center gap-2">
            <span>⚠</span>
            <span>AI section encountered an error and was isolated. Dashboard is unaffected.</span>
          </div>
        );
        return this.props.children;
      }
    }

    // ── AvailabilityBadge ────────────────────────────────────────────────────
    // Shows the manifest-derived availability status for a single section id.
    function AvailabilityBadge({ mStatus, manifest, id }) {
      if (mStatus === 'loading')
        return <span className="text-xs text-slate-400">…</span>;
      if (mStatus === 'unavailable')
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-slate-100 text-slate-500 border border-slate-200">Not available</span>;
      if (mStatus === 'stale')
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-amber-100 text-amber-700 border border-amber-200">⚠ Stale</span>;
      var avail = (manifest && manifest.sectionsAvailable || []).includes(id);
      return avail
        ? <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-emerald-100 text-emerald-700 border border-emerald-200">✓ Available</span>
        : <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-slate-100 text-slate-500 border border-slate-200">Not published</span>;
    }

    // ── ApiIntelligenceSection ───────────────────────────────────────────────
    // Lazy-loaded: mounts only when the strip is expanded.
    // Fetches plugin.dataPath once on mount; shows skeleton → data or error.
    function ApiIntelligenceSection({ plugin }) {
      const [phase, setPhase] = useState('loading');
      const [data, setData]   = useState(null);
      useEffect(function() {
        var t0 = performance.now();
        fetch(plugin.dataPath)
          .then(function(r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
          .then(function(json) {
            var ms = Math.round(performance.now() - t0);
            console.debug('[AI] api-intelligence loaded ' + ms + 'ms — '
              + (json.totalTraces || 0) + ' traces, '
              + (json.uniqueEndpoints || 0) + ' endpoints');
            setData(json);
            setPhase('loaded');
          })
          .catch(function(err) {
            console.warn('[AI] api-intelligence fetch failed:', err.message);
            setPhase('error:' + err.message);
          });
      }, [plugin.dataPath]);

      if (phase === 'loading') return (
        <div className="animate-pulse space-y-2 py-2">
          <div className="h-2.5 bg-slate-200 rounded w-1/3" />
          <div className="h-2.5 bg-slate-200 rounded w-1/2" />
          <div className="h-2.5 bg-slate-200 rounded w-2/5" />
        </div>
      );
      if (phase.startsWith('error')) return (
        <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-xs text-amber-700 flex items-center gap-2">
          <span>⚠</span>
          <span>Could not load data: {phase.slice(6)}</span>
        </div>
      );
      if (!data) return null;

      var totalTraces    = data.totalTraces    || 0;
      var uniqueEndpoints= data.uniqueEndpoints|| 0;
      var workflows      = data.workflows      || [];
      var insights       = data.insights       || [];

      return (
        <div className="space-y-4">

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-slate-50 rounded-lg px-4 py-3 text-center">
              <div className="text-2xl font-bold text-indigo-600">{totalTraces}</div>
              <div className="text-xs text-slate-500 mt-0.5">Requests</div>
            </div>
            <div className="bg-slate-50 rounded-lg px-4 py-3 text-center">
              <div className="text-2xl font-bold text-emerald-600">{uniqueEndpoints}</div>
              <div className="text-xs text-slate-500 mt-0.5">Endpoints</div>
            </div>
            <div className="bg-slate-50 rounded-lg px-4 py-3 text-center">
              <div className="text-2xl font-bold text-violet-600">{workflows.length}</div>
              <div className="text-xs text-slate-500 mt-0.5">Workflows</div>
            </div>
          </div>

          {/* Key insights */}
          {insights.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">Key Insights</p>
              <ul className="space-y-1.5">
                {insights.slice(0, 3).map(function(ins, i) {
                  return (
                    <li key={i} className="text-xs text-slate-600 flex items-start gap-2">
                      <span className="text-indigo-400 mt-0.5 shrink-0">•</span>
                      <span>{ins.summary || ins.finding || ins.description || JSON.stringify(ins)}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {/* Workflows */}
          {workflows.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">Workflows</p>
              <ul className="divide-y divide-slate-100">
                {workflows.slice(0, 5).map(function(w, i) {
                  return (
                    <li key={i} className="flex items-center justify-between text-xs py-1.5">
                      <span className="text-slate-600">{w.name || w.workflow || '-'}</span>
                      {w.requestCount !== undefined &&
                        <span className="text-slate-400 tabular-nums">{w.requestCount} req</span>
                      }
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

        </div>
      );
    }

    // ── AiIntelligenceStrip ──────────────────────────────────────────────────
    // Container for all AI sections.
    // Collapsed by default — manifest loads in background; sections load on expand.
    function AiIntelligenceStrip() {
      var manifestState = useManifest();
      var mStatus  = manifestState.status;
      var manifest = manifestState.manifest;
      var [expanded, setExpanded] = useState(true);
      var registry = window.__AI_PLUGIN_REGISTRY__ || [];

      return (
        <div className="bg-white rounded-xl shadow-md overflow-hidden mb-5">

          {/* Toggle header + Full Report link — always visible */}
          <div className="flex items-center border-b border-slate-100">
            <button
              className="flex-1 flex items-center justify-between px-6 py-4 text-left hover:bg-slate-50 transition-colors group"
              onClick={function() { setExpanded(function(e) { return !e; }); }}
              aria-expanded={expanded}
            >
              <div className="flex items-center gap-3">
                <span className="text-lg" aria-hidden="true">🤖</span>
                <div>
                  <h2 className="text-sm font-semibold text-slate-700">AI Intelligence</h2>
                  <p className="text-xs text-slate-400 mt-0.5">Automated analysis · trend · failures · API coverage</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {registry[0] && (
                  <AvailabilityBadge mStatus={mStatus} manifest={manifest} id={registry[0].id} />
                )}
                <span className="text-slate-400 text-xs select-none">{expanded ? '▲' : '▼'}</span>
              </div>
            </button>
            <a href="./ai-intelligence/latest/ai-report.html" target="_blank" rel="noreferrer"
               className="flex-shrink-0 flex items-center gap-1.5 px-5 py-4 text-xs font-semibold text-emerald-600 hover:text-emerald-800 border-l border-slate-100 hover:bg-emerald-50 transition-colors whitespace-nowrap">
              Full AI Report ↗
            </a>
          </div>

          {/* Expanded content — sections are mounted (and fetched) only here */}
          {expanded && (
            <div className="border-t border-slate-100">
              {registry.map(function(plugin) {
                return (
                  <div key={plugin.id} className="px-6 py-5">
                    {/* Section header */}
                    <div className="flex items-center gap-2 mb-4">
                      <h3 className="text-xs font-bold uppercase tracking-wide text-slate-600">{plugin.label}</h3>
                      <AvailabilityBadge mStatus={mStatus} manifest={manifest} id={plugin.id} />
                      {manifest && (
                        <span className="text-xs text-slate-400 ml-auto">
                          {'Run: ' + (manifest.timestamp || '—')}
                          {manifest.traceCount > 0 ? ' · ' + manifest.traceCount + ' traces' : ''}
                        </span>
                      )}
                    </div>

                    {/* Section body */}
                    {mStatus === 'unavailable'
                      ? <p className="text-xs text-slate-400">AI artifacts not yet available. Run the CI workflow to generate them.</p>
                      : (
                          <AiErrorBoundary>
                            <ApiIntelligenceSection plugin={plugin} />
                          </AiErrorBoundary>
                        )
                    }
                  </div>
                );
              })}
            </div>
          )}
        </div>
      );
    }

    ReactDOM.createRoot(document.getElementById('root')).render(<App />);
  </script>
</body>
</html>`;

// ---------------------------------------------------------------------------
// Inject data and write output
// ---------------------------------------------------------------------------
const output = template
    .replace("__HISTORY_PLACEHOLDER__", historyJson)
    .replace("__ROWS_PLACEHOLDER__", rowsJson);

const outputDir = path.dirname(outputHtmlPath);
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

fs.writeFileSync(outputHtmlPath, output, "utf8");
console.log(`Dashboard written to: ${outputHtmlPath}`);
