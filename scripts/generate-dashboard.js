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

'use strict';

const fs   = require('fs');
const path = require('path');

// ---------------------------------------------------------------------------
// Argument handling
// ---------------------------------------------------------------------------
const [,, consolidatedJsonPath, rowsJsonPath, outputHtmlPath] = process.argv;

if (!consolidatedJsonPath || !rowsJsonPath || !outputHtmlPath) {
  console.error(
    'Usage: node generate-dashboard.js <consolidated_json> <rows_json> <output_html>'
  );
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Read inputs
// ---------------------------------------------------------------------------
function readJson(filePath, fallback) {
  try {
    let raw = fs.readFileSync(filePath, 'utf8').trim();

    // Bash JSON builders often append a trailing comma before the closing
    // bracket/brace, producing invalid JSON (e.g. [{...},{...},]).  Strip it.
    raw = raw
      .replace(/,\s*]/g, ']')   // trailing comma before ]
      .replace(/,\s*}/g, '}');  // trailing comma before }

    JSON.parse(raw); // validate — throws if still malformed
    return raw;
  } catch (err) {
    console.warn(`Warning: could not read/parse ${filePath} – using fallback. (${err.message})`);
    return JSON.stringify(fallback);
  }
}

const historyJson = readJson(consolidatedJsonPath, { runs: [] });
const rowsJson    = readJson(rowsJsonPath, []);

// ---------------------------------------------------------------------------
// HTML template — React 18 + Tailwind CSS CDN + Chart.js
// ---------------------------------------------------------------------------
const template = /* html */`<!DOCTYPE html>
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

  <script type="text/babel">
    const { useState, useEffect, useRef, useMemo } = React;
    const { testHistory, reportsData } = window.__APP_DATA__;

    // -----------------------------------------------------------------------
    // Normalise raw data — guards against legacy records missing fields and
    // against bash xargs leaving stray whitespace on string values.
    // -----------------------------------------------------------------------
    const normalisedData = (Array.isArray(reportsData) ? reportsData : []).map(r => ({
      date:        (r.date        || '').trim(),
      time:        (r.time        || '').trim(),
      link:        (r.link        || '#').trim(),
      status:      (r.status      || 'Unknown').trim(),
      environment: (r.environment || '').trim(),
      execTime:    (r.execTime    || 'N/A').trim(),
      shardTimes:  Array.isArray(r.shardTimes) ? r.shardTimes : [],
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
    function SummaryCards() {
      const latest = normalisedData[0];
      if (!latest) return null;

      const successRate = useMemo(() => {
        const run = (testHistory.runs || []).find(r =>
          r.timestamp && r.timestamp.startsWith(latest.date)
        );
        if (!run || !run.counts || !run.counts.executed) return null;
        return Math.round((run.counts.passed / run.counts.executed) * 100);
      }, [latest]);

      const statusColor = latest.status === 'Passed'
        ? 'bg-emerald-500 text-white'
        : latest.status === 'Failed'
          ? 'bg-rose-500 text-white'
          : 'bg-slate-400 text-white';

      const statusIcon = latest.status === 'Passed' ? '✓' : latest.status === 'Failed' ? '✕' : '?';

      return (
        <section className="px-6 py-5">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">Latest Run — {latest.date} {latest.time}</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">

            {/* Status */}
            <div className="bg-white rounded-xl shadow-md p-5 flex flex-col gap-1">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Status</span>
              <div className={\`mt-2 inline-flex items-center gap-2 self-start px-4 py-2 rounded-lg text-lg font-bold \${statusColor}\`}>
                <span>{statusIcon}</span>
                <span>{latest.status}</span>
              </div>
            </div>

            {/* Success Rate */}
            <div className="bg-white rounded-xl shadow-md p-5 flex flex-col gap-1">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Success Rate</span>
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

            {/* Wall-Clock Time */}
            <div className="bg-white rounded-xl shadow-md p-5 flex flex-col gap-1">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Wall-Clock Time</span>
              <span className="text-3xl font-extrabold mt-1 text-violet-600">{latest.execTime || 'N/A'}</span>
              {latest.shardTimes && latest.shardTimes.length > 0 && (
                <div className="shard-tooltip mt-2 self-start">
                  <span className="text-xs text-slate-400 underline decoration-dotted cursor-help">
                    View shard details ▾
                  </span>
                  <div className="tooltip-box">
                    {latest.shardTimes.map(s => (
                      <div key={s.shard} className="flex gap-3 justify-between">
                        <span className="font-semibold">Shard {s.shard}</span>
                        <span>{s.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Environment */}
            <div className="bg-white rounded-xl shadow-md p-5 flex flex-col gap-1">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Environment</span>
              <div className="mt-2">{envBadge(latest.environment)}</div>
              <span className="text-xs text-slate-400 mt-1">Target under test</span>
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
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {paginated.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="text-center py-10 text-slate-400 text-sm">
                            No reports match the current filters.
                          </td>
                        </tr>
                      ) : paginated.map((r, i) => (
                        <tr key={i} className="hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-3 font-mono text-xs text-slate-600 whitespace-nowrap">{r.date}</td>
                          <td className="px-4 py-3 font-mono text-xs text-slate-500 whitespace-nowrap">{r.time}</td>
                          <td className="px-4 py-3">
                            <a href={r.link} target="_blank" rel="noreferrer"
                               className="inline-flex items-center gap-1 text-emerald-600 hover:text-emerald-800 font-medium text-xs transition">
                              ↗ View
                            </a>
                          </td>
                          <td className="px-4 py-3">{statusPill(r.status)}</td>
                          <td className="px-4 py-3">{envBadge(r.environment)}</td>
                          <td className="px-4 py-3 text-xs">
                            <span className="font-semibold text-slate-700">{r.execTime}</span>
                            {r.shardTimes && r.shardTimes.length > 0 && (
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
                        </tr>
                      ))}
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

    ReactDOM.createRoot(document.getElementById('root')).render(<App />);
  </script>
</body>
</html>`;

// ---------------------------------------------------------------------------
// Inject data and write output
// ---------------------------------------------------------------------------
const output = template
  .replace('__HISTORY_PLACEHOLDER__', historyJson)
  .replace('__ROWS_PLACEHOLDER__',    rowsJson);

const outputDir = path.dirname(outputHtmlPath);
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

fs.writeFileSync(outputHtmlPath, output, 'utf8');
console.log(`Dashboard written to: ${outputHtmlPath}`);
