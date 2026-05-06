/**
 * generate-ai-report.js
 *
 * Combines ai-outputs/reports/trend.json and ai-outputs/reports/deep-failure.json into a
 * self-contained HTML report that matches the SIMS Finance dashboard
 * visual language (React 18 + Tailwind CDN + Chart.js, emerald brand).
 *
 * Usage:
 *   node scripts/generate-ai-report.js [trendJson] [deepJson] [output.html]
 *
 * Defaults:
 *   node scripts/generate-ai-report.js \
 *     ai-outputs/reports/trend.json \
 *     ai-outputs/reports/deep-failure.json \
 *     ai-outputs/ai-report.html
 */

'use strict';

const fs   = require('fs');
const path = require('path');

const trendPath      = process.argv[2] ?? 'ai-outputs/reports/trend.json';
const deepPath       = process.argv[3] ?? 'ai-outputs/reports/deep-failure.json';
const outPath        = process.argv[4] ?? 'ai-outputs/ai-report.html';
const regressionPath = process.argv[5] ?? 'ai-outputs/reports/regression-delta.json';
const dbIntegPath    = process.argv[6] ?? 'ai-outputs/reports/db-integrity.json';

function readJson(p, fallback) {
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); }
  catch { console.warn(`Warning: could not read ${p} – using empty fallback.`); return fallback; }
}

const trend      = readJson(trendPath, {});
const deep       = readJson(deepPath,  {});
const regression = readJson(regressionPath, null);
const dbInteg    = readJson(dbIntegPath, null);

// ── Escape helper (also strips ANSI codes from error samples) ────────────────
function escJson(obj) {
  return JSON.stringify(obj)
    .replace(/\x1b\[[0-9;]*m/g, '')   // strip ANSI
    .replace(/</g, '\\u003c')          // safe for inline <script>
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026');
}

// ── HTML ─────────────────────────────────────────────────────────────────────

const html = `<!DOCTYPE html>
<html lang="en" class="h-full">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>SIMS Finance – AI Analysis Report</title>

  <!-- Tailwind CSS (Play CDN — same as dashboard) -->
  <script src="https://cdn.tailwindcss.com"><\/script>
  <script>
    tailwind.config = {
      theme: { extend: { colors: { brand: { DEFAULT: '#10b981', dark: '#059669' } } } }
    };
  <\/script>

  <!-- React 18 -->
  <script src="https://cdn.jsdelivr.net/npm/react@18/umd/react.production.min.js"><\/script>
  <script src="https://cdn.jsdelivr.net/npm/react-dom@18/umd/react-dom.production.min.js"><\/script>
  <script src="https://cdn.jsdelivr.net/npm/@babel/standalone/babel.min.js"><\/script>

  <!-- Chart.js -->
  <script src="https://cdn.jsdelivr.net/npm/chart.js"><\/script>

  <style>
    /* ─────────────────────────────────────────────────────────────────────────
     * Design Tokens — single source of truth for all visual properties.
     * Update a token here and every rule that references it updates automatically.
     * Do NOT hard-code these values elsewhere in this stylesheet.
     * ───────────────────────────────────────────────────────────────────── */
    :root {
      /* Brand colour ramp */
      --c-brand:       #10b981;
      --c-brand-dark:  #059669;
      --c-brand-deep:  #047857;

      /* Semantic status colours */
      --c-danger:  #ef4444;
      --c-warning: #f59e0b;
      --c-info:    #3b82f6;

      /* Surface / background scale */
      --c-surface:     #ffffff;
      --c-surface-2:   #f8fafc;
      --c-surface-3:   #f1f5f9;
      --c-bg:          #f1f5f9;

      /* Border colours */
      --c-border:      #e2e8f0;
      --c-border-soft: #f1f5f9;

      /* Text colour ramp (darkest → muted) */
      --c-text:        #1e293b;
      --c-text-2:      #475569;
      --c-text-3:      #64748b;
      --c-text-muted:  #94a3b8;

      /* Elevation shadow scale */
      --shadow-sm:    0 1px 3px rgba(0,0,0,0.05), 0 4px 16px rgba(0,0,0,0.05);
      --shadow-md:    0 6px 16px rgba(0,0,0,0.09), 0 16px 32px rgba(0,0,0,0.06);
      --shadow-lg:    0 20px 60px rgba(0,0,0,0.25);
      --shadow-brand: 0 4px 14px rgba(16,185,129,0.45);

      /* Border radius scale */
      --r-sm:   6px;   /* nav pills, small UI */
      --r-md:   10px;  /* alerts, tooltips, inner panels */
      --r-lg:   14px;  /* cards, modals, KPI tiles */
      --r-pill: 999px; /* badges, tags */

      /* Transition presets */
      --t-fast: 0.15s ease;  /* hover colour changes */
      --t-base: 0.2s ease;   /* lift / shadow */
      --t-slow: 0.3s ease;   /* fade-in / slide */
    }

    /* ── Base ── */
    html { scroll-behavior:smooth; }
    *, *::before, *::after { box-sizing:border-box; }
    tbody tr { transition:background var(--t-fast); }

    /* ── Shell ── */
    .dash { min-height:100vh; display:flex; flex-direction:column; background:var(--c-bg); font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif; color:var(--c-text); font-size:14px; line-height:1.5; }

    /* ── Header ── */
    .dash-header {
      background: linear-gradient(135deg, var(--c-brand-deep) 0%, var(--c-brand-dark) 40%, var(--c-brand) 100%);
      color:white; padding:1.75rem 2rem;
      box-shadow:0 4px 18px rgba(5,150,105,0.35);
      position:relative; overflow:hidden;
    }
    /* Subtle dot-grid texture overlay */
    .dash-header::before {
      content:''; position:absolute; inset:0; pointer-events:none;
      background-image: radial-gradient(circle, rgba(255,255,255,0.08) 1px, transparent 1px);
      background-size: 22px 22px;
    }
    .dash-header-inner { max-width:1400px; margin:0 auto; display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:1rem; position:relative; }
    .dash-title { font-size:1.6rem; font-weight:900; letter-spacing:-0.035em; line-height:1.15; text-shadow:0 1px 3px rgba(0,0,0,0.15); }
    .dash-subtitle { font-size:0.8rem; font-weight:400; opacity:0.78; margin-top:0.4rem; letter-spacing:0.01em; }
    .dash-header-right { display:flex; flex-direction:column; align-items:flex-end; gap:0.5rem; }
    .dash-meta { font-size:0.7rem; font-family:monospace; background:rgba(255,255,255,0.18); padding:0.25rem 0.85rem; border-radius:var(--r-pill); backdrop-filter:blur(4px); }

    /* ── Sticky nav ── */
    .dash-nav { background:rgba(255,255,255,0.95); backdrop-filter:blur(8px); border-bottom:1px solid var(--c-border); position:sticky; top:0; z-index:20; box-shadow:0 1px 8px rgba(0,0,0,0.07); }
    .dash-nav-inner { max-width:1400px; margin:0 auto; display:flex; padding:0 1.5rem; overflow-x:auto; gap:0.1rem; align-items:center; }
    .dash-nav a { display:inline-flex; align-items:center; gap:0.35rem; padding:0.45rem 0.9rem; margin:0.3rem 0.1rem; font-size:0.74rem; font-weight:600; color:var(--c-text-3); text-decoration:none; border-radius:var(--r-sm); white-space:nowrap; letter-spacing:0.01em; transition:color var(--t-fast), background var(--t-fast), box-shadow var(--t-fast); }
    .dash-nav a:hover  { color:var(--c-brand-dark); background:#f0fdf4; }
    /* Active tab: solid brand fill + white text — unmissable */
    .dash-nav a.active { color:#fff; background:var(--c-brand-dark); font-weight:700;
      box-shadow:0 2px 8px rgba(5,150,105,0.35); }

    /* ── Scroll progress bar ── */
    #scroll-progress { position:fixed; top:0; left:0; height:3px; width:0%; background:var(--c-brand);
      z-index:9999; transition:width 0.1s linear; pointer-events:none; }

    /* ── Back to top button ── */
    #back-to-top { position:fixed; bottom:1.75rem; right:1.75rem; z-index:9998;
      width:42px; height:42px; border-radius:50%; border:none; cursor:pointer;
      background:var(--c-brand); color:white; font-size:1.1rem; line-height:1;
      box-shadow:var(--shadow-brand);
      display:flex; align-items:center; justify-content:center;
      opacity:0; transform:translateY(12px);
      transition:opacity var(--t-slow),transform var(--t-slow),background var(--t-fast); pointer-events:none; }
    #back-to-top.visible { opacity:1; transform:translateY(0); pointer-events:auto; }
    #back-to-top:hover   { background:var(--c-brand-dark); }

    /* ── Sections ── */
    /* scroll-margin-top set on the animation rule below; section boundary separator handled by + selector */

    /* ── Main ── */
    .dash-main { flex:1; max-width:1400px; margin:0 auto; width:100%; padding:2rem; }

    /* ── Section divider label ── */
    /* Acts as a visible section heading while scrolling */
    .section-label {
      font-size:0.72rem; font-weight:800; text-transform:uppercase;
      letter-spacing:0.12em; color:var(--c-text-2);
      margin-bottom:1.1rem;
      display:flex; align-items:center; gap:0.65rem;
      padding-bottom:0.6rem;
      border-bottom:2px solid var(--c-border-soft);
    }
    /* Thick left accent bar — far more visible than a tiny dot */
    .section-label::before { content:''; width:4px; height:1em; border-radius:2px; background:var(--c-brand); flex-shrink:0; }
    .section-label::after  { display:none; }

    /* ── Section fade-in ── */
    @keyframes fadeUp { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }
    /* scroll-margin accounts for sticky nav + extra breathing room */
    .dash-section { animation: fadeUp 0.4s ease both; scroll-margin-top:60px; }
    /* Top rule makes section transitions visually obvious while scrolling */
    .dash-section + .dash-section { border-top:2px solid var(--c-border); margin-top:0.5rem; padding-top:2rem; }
    .dash-section:nth-child(2) { animation-delay:0.05s; }
    .dash-section:nth-child(3) { animation-delay:0.1s; }
    .dash-section:nth-child(4) { animation-delay:0.15s; }
    .dash-section:nth-child(5) { animation-delay:0.2s; }
    .dash-section:nth-child(6) { animation-delay:0.25s; }
    .dash-section:nth-child(7) { animation-delay:0.3s; }

    /* ── Card ── */
    .card { background:var(--c-surface); border-radius:var(--r-lg); box-shadow:var(--shadow-sm); margin-bottom:1.25rem; overflow:hidden; transition:box-shadow var(--t-base), transform var(--t-base); border:1px solid var(--c-border-soft); }
    .card:hover { box-shadow:var(--shadow-md); transform:translateY(-2px); border-color:var(--c-border); }
    .card-head { padding:1rem 1.5rem; border-bottom:1px solid var(--c-border-soft); display:flex; justify-content:space-between; align-items:center; gap:1rem; flex-wrap:wrap; background:linear-gradient(to right,var(--c-surface-2),var(--c-surface)); }
    .card-head h2 { font-size:0.7rem; font-weight:700; text-transform:uppercase; letter-spacing:0.08em; color:var(--c-text-2); margin:0; }
    .card-head p { font-size:0.72rem; color:var(--c-text-muted); margin:0.2rem 0 0; font-weight:400; }
    .card-body { padding:1.5rem; }

    /* ── KPI strip ── */
    .kpi-row { display:grid; grid-template-columns:repeat(auto-fit,minmax(180px,1fr)); gap:1rem; margin-bottom:1.25rem; }
    .kpi-tile { background:var(--c-surface); border-radius:var(--r-lg); padding:1.25rem 1.5rem; box-shadow:var(--shadow-sm); transition:box-shadow var(--t-base), transform var(--t-base); border:1px solid var(--c-border-soft); }
    .kpi-tile:hover { box-shadow:var(--shadow-md); transform:translateY(-2px); border-color:var(--c-border); }
    .kpi-label { font-size:0.65rem; font-weight:700; text-transform:uppercase; letter-spacing:0.08em; color:var(--c-text-muted); margin-bottom:0.5rem; }
    .kpi-value { font-size:2.4rem; font-weight:900; line-height:1; margin-bottom:0.5rem; letter-spacing:-0.03em; font-variant-numeric:tabular-nums; }
    .kpi-sub { font-size:0.7rem; color:var(--c-text-muted); margin-top:0.3rem; }

    /* ── Alert block ── */
    .alert-amber { display:flex; gap:0.75rem; padding:0.9rem 1rem; background:linear-gradient(to right,#fffbeb,#fefce8); border-left:3px solid var(--c-warning); border-radius:0 var(--r-md) var(--r-md) 0; box-shadow:0 1px 4px rgba(245,158,11,0.1); }
    .alert-amber-title { font-size:0.78rem; font-weight:700; color:#92400e; }
    .alert-amber-body  { font-size:0.74rem; color:#b45309; margin-top:0.2rem; line-height:1.55; }

    /* ── Table typography ── */
    th { font-size:0.65rem !important; letter-spacing:0.07em; }
    td { font-size:0.8rem; }

    /* ── Footer ── */
    .dash-footer { text-align:center; padding:1.75rem 1.5rem; font-size:0.7rem; color:var(--c-text-muted); border-top:1px solid var(--c-border); letter-spacing:0.02em;
      background:linear-gradient(to bottom,var(--c-surface-2),var(--c-surface-3)); }

    /* ── Global Info Tooltip System ── */
    /* Trigger: any element with class "info-trigger" + data-tooltip attribute */
    .info-trigger { display:inline-flex; align-items:center; justify-content:center;
                    width:15px; height:15px; border-radius:50%;
                    background:var(--c-border); color:var(--c-text-3);
                    font-size:0.6rem; font-weight:800; font-style:normal;
                    cursor:default; flex-shrink:0; user-select:none;
                    transition:background var(--t-fast), color var(--t-fast); }
    .info-trigger:hover { background:var(--c-brand); color:white; }
    /* Single global tooltip — lives on <body>, never clipped by any ancestor */
    #global-tooltip { position:fixed; z-index:99999; max-width:250px; width:max-content;
                      background:#1e293b; color:#e2e8f0;
                      font-size:0.72rem; line-height:1.65;
                      padding:0.65rem 0.85rem; border-radius:var(--r-md);
                      box-shadow:0 8px 28px rgba(0,0,0,0.22), 0 2px 6px rgba(0,0,0,0.12);
                      pointer-events:none; white-space:normal;
                      opacity:0; transition:opacity 0.16s ease;
                      display:none; }
    #global-tooltip.tt-visible { display:block; }
    #global-tooltip.tt-show    { opacity:1; }
    #global-tooltip::after { content:''; position:absolute; border:5px solid transparent; }
    #global-tooltip.tt-above::after { top:100%; left:var(--ax,50%); transform:translateX(-50%); border-top-color:#1e293b; }
    #global-tooltip.tt-below::after { bottom:100%; left:var(--ax,50%); transform:translateX(-50%); border-bottom-color:#1e293b; }
  </style>
</head>
<body class="bg-slate-50 text-slate-800 min-h-full font-sans">

  <div id="root"></div>

  <script id="app-data">
    window.__AI_DATA__ = {
      trend:      ${escJson(trend)},
      deep:       ${escJson(deep)},
      regression: ${escJson(regression)},
      dbInteg:    ${escJson(dbInteg)}
    };
  <\/script>

  <script type="text/babel">
    const { useState, useEffect, useRef } = React;
    const { trend, deep, regression, dbInteg } = window.__AI_DATA__;

    // ── Colour helpers (mirrors dashboard palette) ──────────────────────────

    function severityPill(s) {
      const map = {
        High:   'bg-rose-100 text-rose-700 border-rose-200',
        Medium: 'bg-amber-100 text-amber-700 border-amber-200',
        Low:    'bg-emerald-100 text-emerald-800 border-emerald-200',
      };
      const cls = map[s] || 'bg-slate-100 text-slate-600 border-slate-200';
      return <span className={\`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold border \${cls}\`}>{s}</span>;
    }

    function stabilityPill(l) {
      const map = {
        Unstable: 'bg-rose-100 text-rose-700 border-rose-200',
        Flaky:    'bg-amber-100 text-amber-700 border-amber-200',
        Stable:   'bg-emerald-100 text-emerald-800 border-emerald-200',
      };
      const cls = map[l] || 'bg-slate-100 text-slate-600 border-slate-200';
      return <span className={\`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold border \${cls}\`}>{l}</span>;
    }

    function patternPill(t) {
      return <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-violet-100 text-violet-700 border border-violet-200">{t}</span>;
    }

    function trendBadge(d) {
      const styles = {
        Improving: { bg:'#ecfdf5', color:'#065f46', border:'#6ee7b7', dot:'#10b981' },
        Degrading: { bg:'#fff1f2', color:'#9f1239', border:'#fda4af', dot:'#f43f5e' },
        Stable:    { bg:'#f8fafc', color:'#475569', border:'#cbd5e1', dot:'#94a3b8' },
      };
      const icon = d === 'Improving' ? '📈' : d === 'Degrading' ? '📉' : '📊';
      const s = styles[d] || styles.Stable;
      return (
        <span style={{display:'inline-flex',alignItems:'center',gap:'0.4rem',padding:'0.3rem 0.85rem',borderRadius:'999px',fontSize:'0.78rem',fontWeight:700,background:s.bg,color:s.color,border:'1px solid ' + s.border}}>
          <span style={{width:'7px',height:'7px',borderRadius:'50%',background:s.dot,flexShrink:0}} />
          {icon} {d}
        </span>
      );
    }

    // ── Agent colour registry (single source of truth) ─────────────────────
    var AGENTS = {
      trend:      { key:'trend',      icon:'📊', label:'Trend Analysis Agent',    bg:'#eff6ff', border:'#bfdbfe', text:'#1d4ed8', tip:'Analyses run history to detect macro patterns — degrading trends, flaky spikes, recurring failure windows, and overall health trajectory.' },
      deep:       { key:'deep',       icon:'🔍', label:'Deep Failure Agent',       bg:'#fdf4ff', border:'#e9d5ff', text:'#7e22ce', tip:'Profiles each test individually — calculates per-test fail rate, flaky rate, last failure timestamp, and links to the Playwright HTML report for that run.' },
      regression: { key:'regression', icon:'📈', label:'Regression Delta Agent',  bg:'#f0fdf4', border:'#bbf7d0', text:'#15803d', tip:'Compares test reliability before and after a pivot date to surface regressions and improvements.' },
      db:         { key:'db',         icon:'🗄',  label:'DB Integrity Agent',       bg:'#fff7ed', border:'#fed7aa', text:'#c2410c', tip:'Runs SQL integrity checks against the SIMS Finance database — orphaned records, transaction anomalies, workflow stalls, and row count deltas between pre/post test run snapshots.' },
    };

    // Small reusable agent badge pill
    function AgentBadge({ agentKey, style }) {
      var a = AGENTS[agentKey]; if (!a) return null;
      return (
        <span style={Object.assign({}, {
          display:'inline-flex', alignItems:'center', gap:'0.3rem',
          padding:'0.18rem 0.6rem', borderRadius:'999px',
          fontSize:'0.65rem', fontWeight:700,
          background:a.bg, border:'1px solid '+a.border, color:a.text,
          letterSpacing:'0.02em', flexShrink:0
        }, style||{})}>
          {a.icon} {a.label}
        </span>
      );
    }

    function healthColor(score) {
      return score >= 75 ? '#10b981' : score >= 50 ? '#f59e0b' : '#f43f5e';
    }

    // ── Health Ring ─────────────────────────────────────────────────────────

    function HealthRing({ score }) {
      const canvasRef = useRef(null);
      const chartRef  = useRef(null);
      const color = healthColor(score);
      useEffect(() => {
        if (!canvasRef.current) return;
        if (chartRef.current) chartRef.current.destroy();
        chartRef.current = new Chart(canvasRef.current, {
          type: 'doughnut',
          data: {
            datasets: [{
              data: [score, 100 - score],
              backgroundColor: [color, '#e2e8f0'],
              borderWidth: 0,
              circumference: 270,
              rotation: 225,
            }]
          },
          options: {
            cutout: '72%',
            responsive: true,
            maintainAspectRatio: true,
            plugins: { legend: { display: false }, tooltip: { enabled: false } }
          }
        });
        return () => { if (chartRef.current) chartRef.current.destroy(); };
      }, [score]);
      return (
        <div className="relative w-32 h-32 mx-auto">
          <canvas ref={canvasRef} />
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-extrabold" style={{color}}>{score}</span>
            <span className="text-xs text-slate-400 font-medium">/100</span>
          </div>
        </div>
      );
    }

    // ── Failure Rate Bar ─────────────────────────────────────────────────────

    function RateBar({ value, colorClass }) {
      return (
        <div className="flex items-center gap-2">
          <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
            <div className={\`h-2 rounded-full \${colorClass}\`} style={{width: value + '%'}} />
          </div>
          <span className="text-xs font-bold text-slate-600 w-8 text-right">{value}%</span>
        </div>
      );
    }

    // ── Executive Summary Panel ─────────────────────────────────────────────
    // Accepts summary as string[] or newline-delimited string.
    // Heuristically buckets bullets into 3 sections for visual hierarchy.
    // NOTE: all regex literals here use only plain ASCII — no \\u / \\b / \\s escapes
    // that would be mangled by the outer Node.js template literal.

    function ExecSummaryPanel({ summary, label, agentKey }) {
      var RISK_WORDS = ['flak','fail','instabilit','drop','consecutive','cluster','timeout',
        'regress','lost','missing','orphan','duplicate','violation','critical','outage',
        'decline','disappear','major','unstable'];
      var IMPACT_WORDS = ['may affect','could lead','could cause','may cause','further analysis',
        'priorit','recommend','investigat','monitor ','should be','focus area','stabiliz',
        'investigate','review','comparing','analysis'];

      function matchesAny(str, words) {
        var lower = str.toLowerCase();
        for (var w = 0; w < words.length; w++) { if (lower.indexOf(words[w]) !== -1) return true; }
        return false;
      }

      var raw = Array.isArray(summary)
        ? summary
        : String(summary || '').split('\\n');

      var bullets = [];
      for (var r = 0; r < raw.length; r++) {
        var line = raw[r];
        if (!line) continue;
        // Strip leading bullet chars: • - * and whitespace
        var first = line.charCodeAt(0);
        if (first === 8226 || first === 45 || first === 42) line = line.slice(1);
        line = line.trim();
        if (line) bullets.push(line);
      }

      var obs = [], risks = [], impacts = [];
      for (var bi = 0; bi < bullets.length; bi++) {
        var b = bullets[bi];
        if (matchesAny(b, IMPACT_WORDS))     impacts.push(b);
        else if (matchesAny(b, RISK_WORDS))  risks.push(b);
        else                                 obs.push(b);
      }

      // Highlight numbers/%, ISO dates, "Month DD" phrases, Title-case number words,
      // ALL-CAPS env/test identifiers (e.g. UAT, TRAINING, NML510, SIMS_TB_SCHOOL),
      // quoted names, and severity keywords.
      // IMPORTANT: no \d \b \s inside the template literal — they get mangled to plain chars.
      // Use [0-9] for digits, explicit spaces for whitespace, and no word-boundary assertions.
      // No /i flag — [A-Z][A-Z0-9_]{2,} must stay uppercase-only.
      var BOLD_PATTERN = /([0-9]{4}-[0-9]{2}-[0-9]{2}|(?:January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sep|Oct|Nov|Dec) +[0-9]{1,2}(?:st|nd|rd|th)?(?:,? *[0-9]{4})?|[0-9]+(?:[.,][0-9]+)?%?|"[^"]{1,60}"|[A-Z][A-Z0-9_]{2,}|One|Two|Three|Four|Five|Six|Seven|Eight|Nine|Ten|Eleven|Twelve|Thirteen|Fourteen|Fifteen|Sixteen|Seventeen|Eighteen|Nineteen|Twenty|Thirty|Forty|Fifty|Sixty|Seventy|Eighty|Ninety|Hundred|Thousand|[Cc]ritical|[Hh]igh|[Mm]edium|[Ll]ow|[Zz]ero|[Nn]one|[Aa]ll|[Ff]ailed|[Pp]assing|[Uu]nstable|[Ss]table|[Ff]laky|[Rr]egressed|[Ii]mproved)/;
      function highlightItem(text) {
        var parts = text.split(BOLD_PATTERN);
        return parts.map(function(part, pi) {
          if (!part) return null;
          if (BOLD_PATTERN.test(part)) {
            return React.createElement('strong', {
              key: pi,
              style: { fontWeight: 700, color: 'inherit' }
            }, part);
          }
          return part;
        });
      }

      function Section({ title, items, bg, borderColor, titleColor, dotColor, prefix }) {
        if (!items.length) return null;
        return (
          <div style={{background:bg, border:'1px solid '+borderColor, borderRadius:'8px', padding:'0.5rem 0.85rem', marginBottom:'0.4rem'}}>
            <div style={{fontWeight:700, fontSize:'0.67rem', color:titleColor, marginBottom:'0.35rem', display:'flex', alignItems:'center', gap:'0.35rem', textTransform:'uppercase', letterSpacing:'0.07em'}}>
              <span>{prefix}</span>
              <span>{title}</span>
              <span style={{marginLeft:'auto', fontWeight:600, fontSize:'0.62rem', color:titleColor, opacity:0.7}}>{items.length}</span>
            </div>
            <ul style={{margin:0, padding:0, listStyle:'none', display:'flex', flexDirection:'column', gap:'0.13rem'}}>
              {items.map(function(item, i) {
                return (
                  <li key={i} style={{display:'flex', alignItems:'flex-start', gap:'0.4rem', fontSize:'0.775rem', color:'#374151', lineHeight:1.42}}>
                    <span style={{color:dotColor, flexShrink:0, fontWeight:800, marginTop:'0.06rem', fontSize:'0.68rem'}}>&rsaquo;</span>
                    <span>{highlightItem(item)}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      }

      return (
        <div>
          {label && (() => {
            var a = agentKey && AGENTS[agentKey];
            return a
              ? <div style={{marginBottom:'0.6rem'}}><AgentBadge agentKey={agentKey} /></div>
              : <div style={{fontSize:'0.65rem', fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:'0.55rem'}}>{label}</div>;
          })()}
          <Section prefix="&#128202;" title="Key Observations" items={obs}
            bg="#f8fafc" borderColor="#e2e8f0" titleColor="#475569" dotColor="#64748b" />
          <Section prefix="&#9888;" title="Risk Indicators" items={risks}
            bg="#fffbeb" borderColor="#fde68a" titleColor="#b45309" dotColor="#d97706" />
          <Section prefix="&#128203;" title="Impact &amp; Considerations" items={impacts}
            bg="#eff6ff" borderColor="#bfdbfe" titleColor="#1d4ed8" dotColor="#3b82f6" />
        </div>
      );
    }

    // ── Environment Runs Modal ───────────────────────────────────────────────
    // Shown when a user clicks a count in the Environment Breakdown table.
    // runs: Array<{timestamp, successRate, flaky}>, title: string, reportBaseUrl: string, onClose: fn

    function EnvRunsModal({ runs, title, reportBaseUrl: baseUrl, onClose }) {
      if (!runs) return null;

      // Parse "YYYY-MM-DD_HH-MM-SS" → friendly display
      function fmtTs(ts) {
        const [datePart, timePart] = (ts || '').split('_');
        if (!datePart) return ts;
        const t = (timePart || '').replace(/-/g, ':');
        return datePart + (t ? '  ' + t : '');
      }

      // Click-outside to close
      function handleBackdrop(e) { if (e.target === e.currentTarget) onClose(); }

      return (
        <div
          onClick={handleBackdrop}
          style={{
            position:'fixed', inset:0, background:'rgba(15,23,42,0.55)',
            zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center',
            padding:'1rem'
          }}
        >
          <div style={{
            background:'#fff', borderRadius:'14px', width:'100%', maxWidth:'640px',
            maxHeight:'80vh', display:'flex', flexDirection:'column',
            boxShadow:'0 20px 60px rgba(0,0,0,0.25)'
          }}>
            {/* Header */}
            <div style={{
              padding:'1rem 1.25rem', borderBottom:'1px solid #e2e8f0',
              display:'flex', justifyContent:'space-between', alignItems:'center', flexShrink:0
            }}>
              <h3 style={{fontWeight:700, fontSize:'0.95rem', color:'#1e293b', margin:0}}>{title}</h3>
              <button
                onClick={onClose}
                style={{
                  background:'none', border:'none', cursor:'pointer', color:'#64748b',
                  fontSize:'1.25rem', lineHeight:1, padding:'0.1rem 0.3rem', borderRadius:'4px'
                }}
                aria-label="Close"
              >×</button>
            </div>

            {/* Body */}
            <div style={{overflowY:'auto', flex:1}}>
              {(!runs || runs.length === 0)
                ? <p style={{padding:'1.5rem', color:'#64748b', fontSize:'0.85rem'}}>No runs in this category.</p>
                : (
                  <table style={{width:'100%', borderCollapse:'collapse', fontSize:'0.82rem'}}>
                    <thead>
                      <tr style={{background:'#334155', color:'#fff'}}>
                        <th style={{padding:'0.6rem 1rem', textAlign:'left', fontWeight:600, letterSpacing:'0.04em', fontSize:'0.72rem', textTransform:'uppercase'}}>#</th>
                        <th style={{padding:'0.6rem 1rem', textAlign:'left', fontWeight:600, letterSpacing:'0.04em', fontSize:'0.72rem', textTransform:'uppercase'}}>
                          <span style={{display:'inline-flex',alignItems:'center',gap:'0.35rem'}}>
                            Run Timestamp
                            <i className="info-trigger" style={{background:'rgba(255,255,255,0.15)',color:'#cbd5e1'}}
                               data-tooltip="UTC timestamp in YYYY-MM-DD_HH-MM-SS format from the CI run that produced this result. Click the link (when available) to open the full Playwright HTML report for that run.">i</i>
                          </span>
                        </th>
                        <th style={{padding:'0.6rem 1rem', textAlign:'center', fontWeight:600, letterSpacing:'0.04em', fontSize:'0.72rem', textTransform:'uppercase'}}>
                          <span style={{display:'inline-flex',alignItems:'center',gap:'0.35rem',justifyContent:'center'}}>
                            Pass Rate
                            <i className="info-trigger" style={{background:'rgba(255,255,255,0.15)',color:'#cbd5e1'}}
                               data-tooltip="passed ÷ executed × 100 for this specific run. 100% = all tests passed. Values below 100% indicate at least one test failed (not counting flaky retries).">i</i>
                          </span>
                        </th>
                        <th style={{padding:'0.6rem 1rem', textAlign:'center', fontWeight:600, letterSpacing:'0.04em', fontSize:'0.72rem', textTransform:'uppercase'}}>
                          <span style={{display:'inline-flex',alignItems:'center',gap:'0.35rem',justifyContent:'center'}}>
                            Status
                            <i className="info-trigger" style={{background:'rgba(255,255,255,0.15)',color:'#cbd5e1'}}
                               data-tooltip="Clean = 100% pass, no flakiness · Partial failure = some tests failed (pass rate 1–99%) · Complete failure = 0% pass rate · Flaky = at least one test retried and eventually passed.">i</i>
                          </span>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {runs.map((r, idx) => {
                        const rate = r.successRate ?? 0;
                        const rateColor = rate >= 95 ? '#059669' : rate >= 50 ? '#d97706' : '#dc2626';
                        const badges = [];
                        if (rate < 100) badges.push({ label: rate === 0 ? 'Complete failure' : 'Partial failure', bg:'#fee2e2', fg:'#b91c1c' });
                        if (r.flaky)    badges.push({ label: 'Flaky', bg:'#fef3c7', fg:'#92400e' });
                        if (rate === 100 && !r.flaky) badges.push({ label: 'Clean', bg:'#d1fae5', fg:'#065f46' });
                        return (
                          <tr key={idx} style={{borderBottom:'1px solid #f1f5f9', background: idx % 2 === 0 ? '#fff' : '#f8fafc'}}>
                            <td style={{padding:'0.55rem 1rem', color:'#94a3b8', fontFamily:'monospace'}}>{idx + 1}</td>
                            <td style={{padding:'0.55rem 1rem', fontFamily:'monospace', fontWeight:500}}>
                              {baseUrl
                                ? (
                                  <a
                                    href={baseUrl + r.timestamp + '/index.html'}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{color:'#4f46e5', textDecoration:'underline', textUnderlineOffset:'3px'}}
                                    title="Open Playwright report for this run"
                                  >{fmtTs(r.timestamp)}</a>
                                )
                                : <span style={{color:'#1e293b'}}>{fmtTs(r.timestamp)}</span>
                              }
                            </td>
                            <td style={{padding:'0.55rem 1rem', textAlign:'center', fontWeight:700, color: rateColor}}>{rate}%</td>
                            <td style={{padding:'0.55rem 1rem', textAlign:'center'}}>
                              <span style={{display:'inline-flex', gap:'0.3rem', flexWrap:'wrap', justifyContent:'center'}}>
                                {badges.map((b, bi) => (
                                  <span key={bi} style={{padding:'0.15rem 0.5rem', borderRadius:'999px', fontSize:'0.7rem', fontWeight:700, background:b.bg, color:b.fg}}>{b.label}</span>
                                ))}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )
              }
            </div>

            {/* Footer */}
            <div style={{
              padding:'0.65rem 1.25rem', borderTop:'1px solid #e2e8f0',
              fontSize:'0.75rem', color:'#94a3b8', textAlign:'right', flexShrink:0
            }}>
              {runs.length} run{runs.length !== 1 ? 's' : ''} · click outside or × to close
            </div>
          </div>
        </div>
      );
    }

    // ── Patterns Table ───────────────────────────────────────────────────────

    function PatternsTable({ patterns }) {
      if (!patterns || patterns.length === 0)
        return <p className="text-sm text-slate-400 py-4">No patterns detected.</p>;
      return (
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-700 text-white text-xs uppercase tracking-wide">
              <tr>
                <th className="px-4 py-3">
                  <span style={{display:'inline-flex',alignItems:'center',gap:'0.3rem'}}>
                    Pattern
                    <i className="info-trigger" style={{background:'rgba(255,255,255,0.15)',color:'#cbd5e1'}}
                       data-tooltip="Category of recurring behaviour detected by the AI — e.g. 'Consistent Failure', 'Flaky Spike', 'Day-of-week Cluster', 'Execution Time Anomaly'.">i</i>
                  </span>
                </th>
                <th className="px-4 py-3">Description</th>
                <th className="px-4 py-3">
                  <span style={{display:'inline-flex',alignItems:'center',gap:'0.3rem'}}>
                    Severity
                    <i className="info-trigger" style={{background:'rgba(255,255,255,0.15)',color:'#cbd5e1'}}
                       data-tooltip="Impact rating: Critical = blocking / data-loss risk · High = repeated failures affecting confidence · Medium = intermittent / watch list · Low = cosmetic or rare.">i</i>
                  </span>
                </th>
                <th className="px-4 py-3 text-center">
                  <span style={{display:'inline-flex',alignItems:'center',gap:'0.3rem',justifyContent:'center'}}>
                    Runs
                    <i className="info-trigger" style={{background:'rgba(255,255,255,0.15)',color:'#cbd5e1'}}
                       data-tooltip="Number of individual CI runs in which this pattern was observed. Higher = more persistent and reliable signal.">i</i>
                  </span>
                </th>
                <th className="px-4 py-3">Recommendation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {patterns.map((p, i) => (
                <tr key={i} className="hover:bg-slate-50">
                  <td className="px-4 py-3 whitespace-nowrap">{patternPill(p.patternType)}</td>
                  <td className="px-4 py-3 text-slate-600 text-xs max-w-xs">{p.description}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{severityPill(p.severity)}</td>
                  <td className="px-4 py-3 text-center font-mono font-semibold text-slate-700">{p.affectedRuns ?? '—'}</td>
                  <td className="px-4 py-3 text-slate-600 text-xs max-w-xs">{p.recommendation}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    // ── Per-Test Table ───────────────────────────────────────────────────────

    function PerTestTable({ analyses, profiles, reportBaseUrl }) {
      const profileMap = Object.fromEntries((profiles || []).map(p => [p.testTitle, p]));
      if (!analyses || analyses.length === 0)
        return <p className="text-sm text-slate-400 py-4">No per-test data available.</p>;

      // Detect whether multi-env breakdown is present
      const allEnvs = [...new Set(
        (profiles || []).flatMap(p => Object.keys(p.failuresByEnv || {}))
      )].sort();
      const isMultiEnv = allEnvs.length > 1;

      return (
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-700 text-white text-xs uppercase tracking-wide">
              <tr>
                <th className="px-4 py-3">Test</th>
                <th className="px-4 py-3 text-center">
                  <span style={{display:'inline-flex',alignItems:'center',gap:'0.3rem',justifyContent:'center'}}>
                    Stability
                    <i className="info-trigger" style={{background:'rgba(255,255,255,0.15)',color:'#cbd5e1'}}
                       data-tooltip="AI-assigned label: Stable (rare/no failures) · Flaky (passes and fails inconsistently) · Consistently Failing (fails in most runs) · Intermittent (occasional failures without a clear flakiness pattern).">i</i>
                  </span>
                </th>
                <th className="px-4 py-3">
                  <span style={{display:'inline-flex',alignItems:'center',gap:'0.3rem'}}>
                    Fail Rate
                    <i className="info-trigger" style={{background:'rgba(255,255,255,0.15)',color:'#cbd5e1'}}
                       data-tooltip="failedRuns ÷ totalRuns × 100. A run counts as a failure for this test if the test did not pass (excluding flaky retries that eventually passed).">i</i>
                  </span>
                </th>
                <th className="px-4 py-3">
                  <span style={{display:'inline-flex',alignItems:'center',gap:'0.3rem'}}>
                    Flaky Rate
                    <i className="info-trigger" style={{background:'rgba(255,255,255,0.15)',color:'#cbd5e1'}}
                       data-tooltip="flakyRuns ÷ totalRuns × 100. A run counts as flaky for this test if it was retried and passed on a subsequent attempt — indicating a non-deterministic result.">i</i>
                  </span>
                </th>
                {isMultiEnv && (
                  <th className="px-4 py-3">
                    <span style={{display:'inline-flex',alignItems:'center',gap:'0.3rem'}}>
                      Failures by Env
                      <i className="info-trigger"
                         data-tooltip="Failures/runs in each environment. Red = >20% failure rate in that env. A test failing only in one env points to environment-specific config or data.">i</i>
                    </span>
                  </th>
                )}
                <th className="px-4 py-3 text-center">
                  <span style={{display:'inline-flex',alignItems:'center',gap:'0.3rem',justifyContent:'center'}}>
                    Priority
                    <i className="info-trigger" style={{background:'rgba(255,255,255,0.15)',color:'#cbd5e1'}}
                       data-tooltip="AI-ranked urgency to investigate this test: P1 (Critical) · P2 (High) · P3 (Medium) · P4 (Low). Factors: fail rate, recency, environment spread, and co-failure frequency.">i</i>
                  </span>
                </th>
                <th className="px-4 py-3">Recommendation</th>
                <th className="px-4 py-3 text-center">
                  <span style={{display:'inline-flex',alignItems:'center',gap:'0.3rem',justifyContent:'center'}}>
                    Report
                    <i className="info-trigger" style={{background:'rgba(255,255,255,0.15)',color:'#cbd5e1'}}
                       data-tooltip="Links to the Playwright HTML report for the run in which this test last failed. Published to GitHub Pages at {baseUrl}/{timestamp}/index.html.">i</i>
                  </span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {analyses.map((a, i) => {
                const p = profileMap[a.testTitle] || {};
                const reportUrl = reportBaseUrl && p.lastFailureTimestamp
                  ? \`\${reportBaseUrl}\${p.lastFailureTimestamp}/index.html\`
                  : null;
                return (
                  <tr key={i} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-800 text-xs max-w-xs">
                      <div>{a.testTitle}</div>
                      {(p.errorSamples || []).map((e, j) => (
                        <div key={j} className="mt-1 font-mono text-slate-400 text-xs truncate max-w-xs" title={e}>{e}</div>
                      ))}
                    </td>
                    <td className="px-4 py-3 text-center whitespace-nowrap">{stabilityPill(a.stabilityLabel)}</td>
                    <td className="px-4 py-3 min-w-[100px]">
                      <RateBar value={p.failureRate ?? 0}
                        colorClass={(p.failureRate ?? 0) > 20 ? 'bg-rose-500' : 'bg-emerald-500'} />
                    </td>
                    <td className="px-4 py-3 min-w-[100px]">
                      <RateBar value={p.flakyRate ?? 0} colorClass="bg-amber-400" />
                    </td>
                    {isMultiEnv && (
                      <td className="px-4 py-3 text-xs">
                        {allEnvs.map(env => {
                          const fails = (p.failuresByEnv || {})[env] ?? 0;
                          const runs  = (p.runsByEnv   || {})[env] ?? 0;
                          const isHot = runs > 0 && fails / runs > 0.2;
                          return (
                            <span key={env} className="inline-flex items-center gap-0.5 mr-2 whitespace-nowrap">
                              <span className="text-slate-400">{env}:</span>
                              <span className={isHot ? 'font-bold text-rose-600' : 'text-slate-500'}>
                                {fails}/{runs}
                              </span>
                            </span>
                          );
                        })}
                      </td>
                    )}
                    <td className="px-4 py-3 text-center whitespace-nowrap">{severityPill(a.priority)}</td>
                    <td className="px-4 py-3 text-slate-600 text-xs max-w-xs">{a.recommendation}</td>
                    <td className="px-4 py-3 text-center">
                      {reportUrl
                        ? <a href={reportUrl} target="_blank" rel="noreferrer"
                             className="inline-flex items-center gap-1 text-emerald-600 hover:text-emerald-800 font-semibold text-xs transition">
                            ↗ View Report
                          </a>
                        : <span className="text-slate-300 text-xs">—</span>
                      }
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      );
    }

    // ── Co-Failure Table ─────────────────────────────────────────────────────

    function CoFailureTable({ patterns }) {
      if (!patterns || patterns.length === 0) return null;
      return (
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-700 text-white text-xs uppercase tracking-wide">
              <tr>
                <th className="px-4 py-3">
                  <span style={{display:'inline-flex',alignItems:'center',gap:'0.3rem'}}>
                    Test Pair
                    <i className="info-trigger" style={{background:'rgba(255,255,255,0.15)',color:'#cbd5e1'}}
                       data-tooltip="Two or more tests that failed in the same CI run. Ranked by the number of runs where ALL listed tests failed together.">i</i>
                  </span>
                </th>
                <th className="px-4 py-3 text-center">
                  <span style={{display:'inline-flex',alignItems:'center',gap:'0.3rem',justifyContent:'center'}}>
                    Co-failures
                    <i className="info-trigger" style={{background:'rgba(255,255,255,0.15)',color:'#cbd5e1'}}
                       data-tooltip="Number of runs in which every test in this pair failed simultaneously. Higher co-failure count = stronger signal of a shared root cause.">i</i>
                  </span>
                </th>
                <th className="px-4 py-3">Hypothesis</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {patterns.map((c, i) => (
                <tr key={i} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-xs">
                    {(c.tests || []).map((t, j) => (
                      <div key={j}>
                        <span className="font-medium text-slate-800">{t}</span>
                        {j < c.tests.length - 1 && <span className="block text-slate-300 text-xs">+ with</span>}
                      </div>
                    ))}
                  </td>
                  <td className="px-4 py-3 text-center font-extrabold text-violet-600 text-lg">{c.occurrences}×</td>
                  <td className="px-4 py-3 text-slate-600 text-xs max-w-xs">{c.possibleCause}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    // ── Shared AI job log modal ──────────────────────────────────────────────
    // Rendered by both AnalyseButton and PivotDatePicker while a job is live.

    function AiJobModal({ phase, logs, onClose }) {
      var logsRef = useRef(null);
      useEffect(function() {
        if (logsRef.current) logsRef.current.scrollTop = logsRef.current.scrollHeight;
      }, [logs]);
      if (phase === 'idle') return null;
      var isRunning = phase === 'running';
      var isDone    = phase === 'done';
      return (
        <div style={{position:'fixed',inset:0,background:'rgba(15,23,42,0.72)',zIndex:99998,
          display:'flex',alignItems:'center',justifyContent:'center',padding:'1rem'}}>
          <div style={{background:'#0f172a',borderRadius:'14px',width:'100%',maxWidth:'820px',
            maxHeight:'78vh',display:'flex',flexDirection:'column',
            boxShadow:'0 25px 60px rgba(0,0,0,0.55)',border:'1px solid #1e293b'}}>
            {/* Header */}
            <div style={{display:'flex',alignItems:'center',gap:'0.75rem',
              padding:'0.85rem 1.25rem',borderBottom:'1px solid #1e293b',flexShrink:0}}>
              {isRunning && (
                <span style={{width:'9px',height:'9px',borderRadius:'50%',background:'#10b981',
                  boxShadow:'0 0 0 3px rgba(16,185,129,0.25)',flexShrink:0}} />
              )}
              {isDone          && <span style={{fontSize:'1rem'}}>\u2705</span>}
              {phase==='error' && <span style={{fontSize:'1rem'}}>\u274c</span>}
              <span style={{fontSize:'0.82rem',fontWeight:700,color:'#e2e8f0',flex:1}}>
                {isRunning ? 'Running AI analysis \u2014 do not close this panel\u2026'
                  : isDone  ? 'Analysis complete \u2014 reloading report\u2026'
                  :           'Analysis failed \u2014 check logs below'}
              </span>
              {!isRunning && (
                <button onClick={onClose}
                  style={{background:'none',border:'none',color:'#475569',cursor:'pointer',
                    fontSize:'1.4rem',lineHeight:1,padding:'0 0.3rem',borderRadius:'4px'}}>\u00d7</button>
              )}
            </div>
            {/* Log stream */}
            <div ref={logsRef} style={{flex:1,overflowY:'auto',padding:'0.75rem 1rem',
              fontFamily:'monospace',fontSize:'0.7rem',color:'#94a3b8',
              lineHeight:1.65,whiteSpace:'pre-wrap',wordBreak:'break-all'}}>
              {logs.length === 0
                ? <span style={{color:'#334155'}}>Waiting for output\u2026</span>
                : logs.map(function(line, i) {
                    var clean = line.replace(/[\x1b]\[[0-9;]*m/g, '');
                    var col = /\u2705|\u2713/.test(clean)              ? '#4ade80'
                            : /\u274c|Error|failed|FAIL/.test(clean)  ? '#f87171'
                            : /\u26a0|Warning/.test(clean)            ? '#fbbf24'
                            :                                           '#94a3b8';
                    return <div key={i} style={{color:col}}>{clean}</div>;
                  })
              }
            </div>
            {/* Footer */}
            <div style={{padding:'0.5rem 1rem',borderTop:'1px solid #1e293b',
              fontSize:'0.67rem',color:'#334155',flexShrink:0,fontFamily:'monospace'}}>
              {isRunning ? '\u25cf Running\u2026'
                : isDone  ? '\u2713 Done \u2014 page reloads in 2\u202fs'
                :           '\u2717 Failed \u2014 see logs above'}
            </div>
          </div>
        </div>
      );
    }

    // ── Analyse Button ───────────────────────────────────────────────────────
    // POST /api/ai/analyse → streams live output via SSE (requires npm run ai:serve).
    // Falls back to copying the CLI command to clipboard when no server is running.

    function AnalyseButton() {
      var [phase, setPhase] = useState('idle'); // idle | running | done | error | copied
      var [logs,  setLogs]  = useState([]);
      var esRef = useRef(null);
      var cmd = 'npm run ai:full';

      function connectSSE() {
        if (esRef.current) { esRef.current.close(); esRef.current = null; }
        var es = new EventSource('/api/ai/stream');
        esRef.current = es;
        es.onmessage = function(evt) {
          var d = JSON.parse(evt.data);
          if (d.type === 'log')  { setLogs(function(p) { return p.concat(d.text); }); }
          if (d.type === 'idle') { es.close(); esRef.current = null; }
          if (d.type === 'done') {
            es.close(); esRef.current = null;
            setPhase(d.exitCode === 0 ? 'done' : 'error');
            if (d.exitCode === 0) setTimeout(function() { window.location.reload(); }, 2000);
          }
        };
        es.onerror = function() {
          if (esRef.current) { esRef.current.close(); esRef.current = null; }
          setPhase('error');
        };
      }

      async function handleClick() {
        setPhase('running'); setLogs([]);
        try {
          var res = await fetch('/api/ai/analyse', { method: 'POST' });
          if (res.status === 409 || res.ok) { connectSSE(); return; } // join live stream
          throw new Error('server_error');
        } catch(_) {
          // No server — fall back to clipboard
          try { await navigator.clipboard.writeText(cmd); setPhase('copied'); }
          catch(_) { setPhase('error'); }
          setTimeout(function() { setPhase('idle'); }, 3000);
        }
      }

      var btnLabel = phase === 'running' ? '\u23f3 Running\u2026'
                   : phase === 'done'    ? '\u2713 Done!'
                   : phase === 'error'   ? '\u26a0 Failed'
                   : phase === 'copied'  ? '\u2713 Command copied!'
                   : '\ud83e\udd16 Analyse with AI Now';

      return (
        <>
          <AiJobModal phase={phase} logs={logs}
            onClose={function(){ setPhase('idle'); setLogs([]); }} />
          <div className="flex flex-col items-end gap-1">
            <button onClick={handleClick} disabled={phase === 'running'}
              className={\`px-4 py-2 rounded-lg text-sm font-bold transition shadow-sm \${
                phase === 'done' || phase === 'copied' ? 'bg-emerald-500 text-white' :
                phase === 'error'                      ? 'bg-rose-500 text-white'    :
                'bg-white text-emerald-700 border-2 border-emerald-400 hover:bg-emerald-50'
              } disabled:opacity-50 disabled:cursor-not-allowed\`}>
              {btnLabel}
            </button>
            <span className="text-xs text-emerald-100 opacity-70 font-mono">{cmd}<\/span>
          </div>
        </>
      );
    }

    // ── Database Integrity Section ───────────────────────────────────────────

    function DatabaseIntegritySection({ report }) {
      const isMock = report?._isMockData === true;

      if (!report) return (
        <div className="bg-white rounded-xl shadow-md p-6 mb-5">
          <div className="flex items-center gap-3 mb-2">
            <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Database Integrity</h2>
          </div>
          <p className="text-sm text-slate-400">
            No DB integrity data yet. Run:&nbsp;
            <code className="font-mono text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
              npm run ai:db:post
            </code>
            &nbsp;after setting DB credentials in <code className="font-mono text-xs bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">src/config/.env</code>
          </p>
        </div>
      );

      const riskColour =
        report.riskLevel === 'Critical' ? 'bg-rose-100 text-rose-700 border-rose-200' :
        report.riskLevel === 'High'     ? 'bg-amber-100 text-amber-700 border-amber-200' :
        report.riskLevel === 'Medium'   ? 'bg-yellow-100 text-yellow-700 border-yellow-200' :
        report.riskLevel === 'Clean'    ? 'bg-emerald-100 text-emerald-800 border-emerald-200' :
                                          'bg-slate-100 text-slate-600 border-slate-200';
      const riskEmoji =
        report.riskLevel === 'Critical' ? '🔴' :
        report.riskLevel === 'High'     ? '🟠' :
        report.riskLevel === 'Medium'   ? '🟡' : '🟢';

      const sevColour = (s) =>
        s === 'Critical' ? 'bg-rose-100 text-rose-700 border-rose-200' :
        s === 'High'     ? 'bg-amber-100 text-amber-700 border-amber-200' :
        s === 'Medium'   ? 'bg-yellow-100 text-yellow-700 border-yellow-200' :
                           'bg-slate-100 text-slate-600 border-slate-200';

      const [expandedSql, setExpandedSql] = useState(null);
      const [showAllChecks, setShowAllChecks] = useState(false);

      const violations = (report.checks || []).filter(c => c.status === 'Fail');
      const passed     = (report.checks || []).filter(c => c.status === 'Pass').length;
      const rowLosses  = (report.rowCountDeltas || []).filter(d => d.verdict === 'Unexpected Loss');

      return (
        <div className="bg-white rounded-xl shadow-md overflow-hidden mb-5">
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-3">
              <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Database Integrity</h2>
              {isMock && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-violet-100 text-violet-700 border border-violet-200">
                  🧪 Mock Data — POC
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-400">
                {report.database} · {report.environment} · {report.checksRun} checks
              </span>
              <span className={\`inline-block px-3 py-1 rounded-full text-xs font-bold border \${riskColour}\`}>
                {riskEmoji} {report.riskLevel}
              </span>
            </div>
          </div>

          {/* Mock data notice banner */}
          {isMock && (
            <div className="px-6 py-3 bg-violet-50 border-b border-violet-100 flex items-start gap-2 text-xs text-violet-700">
              <span className="mt-0.5">🧪</span>
              <span>
                <strong>Representative mock data for POC demonstration.</strong> Violations and row-count deltas are illustrative — they reflect the types of issues this agent catches in real environments.
                To run against your database: add <code className="font-mono bg-violet-100 px-1 rounded">DB_SERVER</code>, <code className="font-mono bg-violet-100 px-1 rounded">DB_DATABASE</code>, <code className="font-mono bg-violet-100 px-1 rounded">DB_USER</code>, <code className="font-mono bg-violet-100 px-1 rounded">DB_PASSWORD</code> to <code className="font-mono bg-violet-100 px-1 rounded">src/config/.env</code> then run <code className="font-mono bg-violet-100 px-1 rounded">npm run ai:db:post</code>.
              </span>
            </div>
          )}

          {/* KPI bar */}
          <div className="px-6 py-3 bg-slate-50 border-b border-slate-100 flex flex-wrap gap-6 text-xs">
            <span className="text-rose-600 font-semibold">⚠ {report.totalViolations} violation{report.totalViolations !== 1 ? 's' : ''} ({report.criticalViolations} critical)</span>
            <span className="text-emerald-600 font-semibold">✓ {passed} passed</span>
            {rowLosses.length > 0 && (
              <span className="text-rose-700 font-bold">🚨 {rowLosses.length} table{rowLosses.length !== 1 ? 's' : ''} lost rows during test run</span>
            )}
          </div>

          {/* Executive summary */}
          {report.executiveSummary && (
            <div className="px-6 py-4 border-b border-slate-100">
              <ExecSummaryPanel summary={report.executiveSummary} />
            </div>
          )}

          {/* Violations table */}
          {violations.length > 0 && (
            <div className="overflow-x-auto border-b border-slate-100">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-700 text-white text-xs uppercase tracking-wide">
                  <tr>
                    <th className="px-4 py-3">
                      <span style={{display:'inline-flex',alignItems:'center',gap:'0.3rem'}}>
                        Check
                        <i className="info-trigger" style={{background:'rgba(255,255,255,0.15)',color:'#cbd5e1'}}
                           data-tooltip="Named SQL integrity check (e.g. F1: Orphaned Ledger Entries). Each check targets a specific relational constraint or business rule in the SIMS Finance database schema.">i</i>
                      </span>
                    </th>
                    <th className="px-4 py-3 text-center">
                      <span style={{display:'inline-flex',alignItems:'center',gap:'0.3rem',justifyContent:'center'}}>
                        Severity
                        <i className="info-trigger" style={{background:'rgba(255,255,255,0.15)',color:'#cbd5e1'}}
                           data-tooltip="Critical = data loss / financial integrity risk · High = broken referential integrity or workflow stall · Medium = anomaly that warrants investigation · Low = informational.">i</i>
                      </span>
                    </th>
                    <th className="px-4 py-3 text-center">
                      <span style={{display:'inline-flex',alignItems:'center',gap:'0.3rem',justifyContent:'center'}}>
                        Violations
                        <i className="info-trigger" style={{background:'rgba(255,255,255,0.15)',color:'#cbd5e1'}}
                           data-tooltip="Row count returned by the SQL check query. Each row represents one record that violates the integrity rule — e.g. one orphaned ledger entry.">i</i>
                      </span>
                    </th>
                    <th className="px-4 py-3">Description</th>
                    <th className="px-4 py-3 text-center w-16">
                      <span style={{display:'inline-flex',alignItems:'center',gap:'0.3rem',justifyContent:'center'}}>
                        SQL
                        <i className="info-trigger" style={{background:'rgba(255,255,255,0.15)',color:'#cbd5e1'}}
                           data-tooltip="Click to expand the exact SQL query that was executed for this check. Queries run as READ-ONLY against the SIMS Finance database.">i</i>
                      </span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {violations.map((c, i) => (
                    <React.Fragment key={i}>
                      <tr className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-semibold text-slate-800 text-xs">[{c.id}] {c.name}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={\`inline-block px-2 py-0.5 rounded-full text-xs font-semibold border \${sevColour(c.severity)}\`}>{c.severity}</span>
                        </td>
                        <td className="px-4 py-3 text-center font-bold text-rose-600 text-sm">{c.violationCount}</td>
                        <td className="px-4 py-3 text-xs text-slate-500">{c.description}</td>
                        <td className="px-4 py-3 text-center w-16">
                          {c.query && (
                            <button
                              onClick={() => setExpandedSql(expandedSql === c.id ? null : c.id)}
                              className={\`px-2 py-0.5 rounded text-xs font-mono font-semibold border transition-colors \${expandedSql === c.id ? 'bg-slate-700 text-white border-slate-700' : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'}\`}
                            >
                              {expandedSql === c.id ? '▲ SQL' : '▶ SQL'}
                            </button>
                          )}
                        </td>
                      </tr>
                      {expandedSql === c.id && c.query && (
                        <tr className="bg-slate-800">
                          <td colSpan={5} className="px-4 py-3">
                            <pre className="text-xs text-emerald-300 font-mono whitespace-pre-wrap break-all leading-relaxed">{c.query}</pre>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Row count deltas */}
          {(report.rowCountDeltas || []).length > 0 && (
            <div className="overflow-x-auto border-b border-slate-100">
              <div className="px-6 pt-4 pb-2">
                <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-400" style={{display:'inline-flex',alignItems:'center',gap:'0.4rem'}}>
                  Row Count Changes (pre → post test run)
                  <i className="info-trigger"
                     data-tooltip="Snapshot of row counts in key tables taken before and after the test run. An Unexpected Loss means tests deleted or corrupted data. An Unexpected Gain means tests left behind orphaned records.">i</i>
                </h3>
              </div>
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-600 text-white text-xs uppercase tracking-wide">
                  <tr>
                    <th className="px-4 py-2">Table</th>
                    <th className="px-4 py-2 text-center">
                      <span style={{display:'inline-flex',alignItems:'center',gap:'0.3rem',justifyContent:'center'}}>
                        Before
                        <i className="info-trigger" style={{background:'rgba(255,255,255,0.15)',color:'#cbd5e1'}}
                           data-tooltip="Row count captured immediately before the test suite started. Used as the baseline for detecting data changes.">i</i>
                      </span>
                    </th>
                    <th className="px-4 py-2 text-center">
                      <span style={{display:'inline-flex',alignItems:'center',gap:'0.3rem',justifyContent:'center'}}>
                        After
                        <i className="info-trigger" style={{background:'rgba(255,255,255,0.15)',color:'#cbd5e1'}}
                           data-tooltip="Row count captured immediately after the test suite completed. Compared against Before to detect unexpected inserts or deletes.">i</i>
                      </span>
                    </th>
                    <th className="px-4 py-2 text-center">
                      <span style={{display:'inline-flex',alignItems:'center',gap:'0.3rem',justifyContent:'center'}}>
                        Δ
                        <i className="info-trigger" style={{background:'rgba(255,255,255,0.15)',color:'#cbd5e1'}}
                           data-tooltip="After − Before. Positive = rows added, Negative = rows removed. Zero = no change (expected for most tables in a well-isolated test run).">i</i>
                      </span>
                    </th>
                    <th className="px-4 py-2 text-center">
                      <span style={{display:'inline-flex',alignItems:'center',gap:'0.3rem',justifyContent:'center'}}>
                        Verdict
                        <i className="info-trigger" style={{background:'rgba(255,255,255,0.15)',color:'#cbd5e1'}}
                           data-tooltip="Expected Change = delta matches what tests are designed to produce · Unexpected Loss = rows were deleted that shouldn't have been · Unexpected Gain = rows were inserted that weren't cleaned up.">i</i>
                      </span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {report.rowCountDeltas.map((d, i) => {
                    const sign = d.delta >= 0 ? '+' : '';
                    const deltaColour =
                      d.verdict === 'Unexpected Loss' ? 'text-rose-600 font-bold' :
                      d.verdict === 'Unexpected Gain' ? 'text-amber-600 font-semibold' : 'text-slate-400';
                    const verdictCls =
                      d.verdict === 'Unexpected Loss' ? 'bg-rose-100 text-rose-700 border-rose-200' :
                      d.verdict === 'Unexpected Gain' ? 'bg-amber-100 text-amber-700 border-amber-200' :
                                                        'bg-emerald-100 text-emerald-800 border-emerald-200';
                    return (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="px-4 py-2 font-mono text-xs text-slate-700">{d.tableName}</td>
                        <td className="px-4 py-2 text-center text-xs text-slate-500">{d.before.toLocaleString()}</td>
                        <td className="px-4 py-2 text-center text-xs text-slate-700 font-medium">{d.after.toLocaleString()}</td>
                        <td className={\`px-4 py-2 text-center text-xs \${deltaColour}\`}>{sign}{d.delta}</td>
                        <td className="px-4 py-2 text-center">
                          <span className={\`inline-block px-2 py-0.5 rounded-full text-xs font-semibold border \${verdictCls}\`}>{d.verdict}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Action items */}
          {(report.actionItems || []).length > 0 && (
            <div className="px-6 py-4">
              <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3" style={{display:'inline-flex',alignItems:'center',gap:'0.4rem'}}>
                DB Remediation Actions
                <i className="info-trigger"
                   data-tooltip="Prioritised fix steps generated by the AI based on the violations found. Each action targets a specific check failure and includes the recommended SQL or process change.">i</i>
              </h3>
              <ul className="space-y-2">
                {report.actionItems.map((item, i) => (
                  <li key={i} className="flex gap-3 items-start py-1.5 border-b border-slate-50 last:border-0">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-violet-500 text-white text-xs font-bold flex items-center justify-center">{i+1}</span>
                    <span className="text-sm text-slate-600">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* All executed checks & SQL */}
          {(report.checks || []).length > 0 && (
            <div className="border-t border-slate-100">
              <button
                onClick={() => setShowAllChecks(!showAllChecks)}
                className="w-full px-6 py-3 flex items-center justify-between text-xs font-semibold uppercase tracking-widest text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors"
              >
                <span>🔍 All Executed SQL Scripts ({(report.checks || []).length} checks)</span>
                <span className="font-mono text-base leading-none">{showAllChecks ? '▲' : '▼'}</span>
              </button>
              {showAllChecks && (
                <div className="divide-y divide-slate-100">
                  {(report.checks || []).map((c, i) => {
                    const statusCls =
                      c.status === 'Fail'    ? 'bg-rose-100 text-rose-700 border-rose-200' :
                      c.status === 'Pass'    ? 'bg-emerald-100 text-emerald-700 border-emerald-200' :
                      c.status === 'Skipped' ? 'bg-slate-100 text-slate-400 border-slate-200' :
                                               'bg-amber-100 text-amber-700 border-amber-200';
                    return (
                      <details key={i} className="group px-6 py-3 hover:bg-slate-50">
                        <summary className="flex items-center gap-3 cursor-pointer list-none">
                          <span className={\`inline-block px-2 py-0.5 rounded-full text-xs font-semibold border \${statusCls}\`}>{c.status}</span>
                          <span className={\`inline-block px-2 py-0.5 rounded-full text-xs font-semibold border \${sevColour(c.severity)}\`}>{c.severity}</span>
                          <span className="text-xs font-semibold text-slate-700 font-mono">[{c.id}]</span>
                          <span className="text-xs text-slate-600">{c.name}</span>
                          {c.status === 'Fail' && c.violationCount > 0 && (
                            <span className="ml-auto text-xs font-bold text-rose-600">{c.violationCount} violation{c.violationCount !== 1 ? 's' : ''}</span>
                          )}
                        </summary>
                        {c.query && (
                          <div className="mt-2 rounded-lg bg-slate-800 overflow-hidden">
                            <pre className="px-4 py-3 text-xs text-emerald-300 font-mono whitespace-pre-wrap break-all leading-relaxed">{c.query}</pre>
                          </div>
                        )}
                      </details>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      );
    }

    // ── Regression Delta Section ─────────────────────────────────────────────

    // ── Pivot Date Picker ────────────────────────────────────────────────────
    // Lets the user pick a new pivot date and run the regression agent live.
    // Falls back to clipboard when no server is running (npm run ai:serve).

    function PivotDatePicker({ currentPivot }) {
      var [date,  setDate]  = useState(currentPivot || '');
      var [phase, setPhase] = useState('idle'); // idle | running | done | error | copied
      var [logs,  setLogs]  = useState([]);
      var esRef = useRef(null);

      var dateRange = trend.dateRange || {};
      var minDate   = dateRange.from  || '';
      var maxDate   = dateRange.to    || '';

      function connectSSE() {
        if (esRef.current) { esRef.current.close(); esRef.current = null; }
        var es = new EventSource('/api/ai/stream');
        esRef.current = es;
        es.onmessage = function(evt) {
          var d = JSON.parse(evt.data);
          if (d.type === 'log')  { setLogs(function(p) { return p.concat(d.text); }); }
          if (d.type === 'done') {
            es.close(); esRef.current = null;
            setPhase(d.exitCode === 0 ? 'done' : 'error');
            if (d.exitCode === 0) setTimeout(function() { window.location.reload(); }, 2000);
          }
        };
        es.onerror = function() {
          if (esRef.current) { esRef.current.close(); esRef.current = null; }
          setPhase('error');
        };
      }

      async function handleReanalyse() {
        if (!date) return;
        var cmd = 'npm run ai:regression -- --since ' + date + ' && npm run ai:report';
        setPhase('running'); setLogs([]);
        try {
          var res = await fetch('/api/ai/analyse', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pivotDate: date })
          });
          if (res.status === 409 || res.ok) { connectSSE(); return; }
          throw new Error('server_error');
        } catch(_) {
          try { await navigator.clipboard.writeText(cmd); setPhase('copied'); }
          catch(_) { setPhase('error'); }
          setTimeout(function() { setPhase('idle'); }, 3000);
        }
      }

      var isChanged = date && date !== currentPivot;
      var btnLabel  = phase === 'running' ? '\u23f3 Running\u2026'
                    : phase === 'done'    ? '\u2713 Done!'
                    : phase === 'error'   ? '\u26a0 Failed'
                    : phase === 'copied'  ? '\u2713 Copied!'
                    : '\u21ba Re-analyse';
      var btnBg = phase === 'running' ? '#6366f1'
                : phase === 'done'    ? '#10b981'
                : phase === 'error'   ? '#ef4444'
                : phase === 'copied'  ? '#10b981' : '#4f46e5';

      return (
        <>
          <AiJobModal phase={phase} logs={logs}
            onClose={function(){ setPhase('idle'); setLogs([]); }} />
          <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', flexWrap:'wrap' }}>
            <span style={{ fontSize:'0.72rem', color:'#94a3b8', whiteSpace:'nowrap' }}>Pivot date:</span>
            <input
              type="date"
              value={date}
              min={minDate}
              max={maxDate}
              onChange={function(e){ setDate(e.target.value); setPhase('idle'); }}
              style={{
                fontSize:'0.75rem', fontFamily:'monospace', fontWeight:600,
                color:'#1e293b', background: isChanged ? '#eff6ff' : '#f8fafc',
                border: isChanged ? '1.5px solid #93c5fd' : '1px solid #e2e8f0',
                borderRadius:'6px', padding:'0.2rem 0.5rem', cursor:'pointer',
                outline:'none', transition:'border-color 0.15s, background 0.15s'
              }}
            />
            {isChanged && (
              <button
                onClick={handleReanalyse}
                disabled={phase === 'running'}
                style={{
                  fontSize:'0.72rem', fontWeight:700, padding:'0.25rem 0.75rem',
                  borderRadius:'6px', border:'none',
                  cursor: phase === 'running' ? 'not-allowed' : 'pointer',
                  background: btnBg, color:'white',
                  transition:'background 0.15s', whiteSpace:'nowrap',
                  opacity: phase === 'running' ? 0.75 : 1
                }}
              >{btnLabel}</button>
            )}
            {isChanged && phase === 'idle' && (
              <span style={{ fontSize:'0.65rem', color:'#94a3b8', fontFamily:'monospace' }}>
                npm run ai:regression -- --since {date}
              </span>
            )}
          </div>
        </>
      );
    }

    function RegressionDeltaSection({ report }) {
      if (!report) return (
        <div className="bg-white rounded-xl shadow-md p-6 mb-5">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Regression Delta</h2>
          </div>
          <p className="text-sm text-slate-400">
            No regression data yet. Run:
            <code className="ml-2 font-mono text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
              npm run ai:regression -- --since YYYY-MM-DD
            </code>
          </p>
        </div>
      );

      const verdictColour =
        report.overallVerdict === 'Regressed' ? 'bg-rose-100 text-rose-700 border-rose-200' :
        report.overallVerdict === 'Improved'  ? 'bg-emerald-100 text-emerald-800 border-emerald-200' :
                                                'bg-slate-100 text-slate-600 border-slate-200';
      const verdictEmoji =
        report.overallVerdict === 'Regressed' ? '🔴' :
        report.overallVerdict === 'Improved'  ? '🟢' : '🟡';

      const changed = [
        ...(report.regressions  || []),
        ...(report.newFailures  || []),
        ...(report.improvements || []),
        ...(report.resolvedFailures || [])
      ];

      function deltaRow(d, i) {
        const sign = d.failureDelta >= 0 ? '+' : '';
        const deltaColour =
          d.failureDelta > 10 ? 'text-rose-600 font-bold' :
          d.failureDelta > 0  ? 'text-amber-600 font-semibold' :
          d.failureDelta < 0  ? 'text-emerald-600 font-semibold' : 'text-slate-400';
        const verdictPillCls =
          d.verdict === 'Regressed'   ? 'bg-rose-100 text-rose-700 border-rose-200' :
          d.verdict === 'New Failure' ? 'bg-rose-100 text-rose-700 border-rose-200' :
          d.verdict === 'Improved'    ? 'bg-emerald-100 text-emerald-800 border-emerald-200' :
          d.verdict === 'Resolved'    ? 'bg-emerald-100 text-emerald-800 border-emerald-200' :
                                        'bg-slate-100 text-slate-500 border-slate-200';
        return (
          <tr key={i} className="hover:bg-slate-50">
            <td className="px-4 py-3 font-medium text-slate-800 text-xs max-w-xs">{d.testTitle}</td>
            <td className="px-4 py-3 text-center">
              <span className={\`inline-block px-2 py-0.5 rounded-full text-xs font-semibold border \${verdictPillCls}\`}>{d.verdict}</span>
            </td>
            <td className="px-4 py-3 text-xs text-slate-500 text-center">{d.beforeFailureRate}%</td>
            <td className="px-4 py-3 text-xs text-slate-700 font-medium text-center">{d.afterFailureRate}%</td>
            <td className={\`px-4 py-3 text-xs text-center \${deltaColour}\`}>{sign}{d.failureDelta}%</td>
            <td className="px-4 py-3 text-xs text-slate-500 text-center">{d.riskLevel}</td>
          </tr>
        );
      }

      return (
        <div className="bg-white rounded-xl shadow-md overflow-hidden mb-5">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between flex-wrap gap-2">
            <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
              Regression Delta
            </h2>
            <div className="flex items-center gap-3 flex-wrap">
              <PivotDatePicker currentPivot={report.pivotDate} />
              <span className="text-xs text-slate-400">
                Before: {report.beforeWindow?.runsAnalysed ?? 0} runs ({report.beforeWindow?.from} → {report.beforeWindow?.to})
                {(report.beforeEnvs || []).length > 0 && (
                  <span className="ml-1">
                    {(report.beforeEnvs).map((e, i) => (
                      <span key={i} className="inline-block ml-1 px-1.5 py-0 rounded text-xs font-bold bg-indigo-100 text-indigo-600 border border-indigo-200">{e}</span>
                    ))}
                  </span>
                )}
                &nbsp;·&nbsp;
                After: {report.afterWindow?.runsAnalysed ?? 0} runs ({report.afterWindow?.from} → {report.afterWindow?.to})
                {(report.afterEnvs || []).length > 0 && (
                  <span className="ml-1">
                    {(report.afterEnvs).map((e, i) => (
                      <span key={i} className="inline-block ml-1 px-1.5 py-0 rounded text-xs font-bold bg-indigo-100 text-indigo-600 border border-indigo-200">{e}</span>
                    ))}
                  </span>
                )}
              </span>
              <span className={\`inline-block px-3 py-1 rounded-full text-xs font-bold border \${verdictColour}\`}>
                {verdictEmoji} {report.overallVerdict}
              </span>
            </div>
          </div>

          {/* Summary bar */}
          <div className="px-6 py-3 bg-slate-50 border-b border-slate-100 flex flex-wrap gap-6 text-xs">
            <span className="text-rose-600 font-semibold">
              ⚠ {(report.regressions?.length ?? 0) + (report.newFailures?.length ?? 0)} regressed / new
            </span>
            <span className="text-emerald-600 font-semibold">
              ✓ {(report.improvements?.length ?? 0) + (report.resolvedFailures?.length ?? 0)} improved / resolved
            </span>
          </div>

          {/* Executive summary */}
          {report.executiveSummary && (
            <div className="px-6 py-4 border-b border-slate-100">
              <ExecSummaryPanel summary={report.executiveSummary} />
            </div>
          )}

          {/* Delta table */}
          {changed.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-700 text-white text-xs uppercase tracking-wide">
                  <tr>
                    <th className="px-4 py-3">Test</th>
                    <th className="px-4 py-3 text-center">
                      <span style={{display:'inline-flex',alignItems:'center',gap:'0.3rem',justifyContent:'center'}}>
                        Verdict
                        <i className="info-trigger" style={{background:'rgba(255,255,255,0.15)',color:'#cbd5e1'}}
                           data-tooltip="Regressed = was passing before, now failing · Improved = was failing before, now passing · New Failure = only present in After window · Resolved = only present in Before window.">i</i>
                      </span>
                    </th>
                    <th className="px-4 py-3 text-center">
                      <span style={{display:'inline-flex',alignItems:'center',gap:'0.3rem',justifyContent:'center'}}>
                        Before
                        <i className="info-trigger" style={{background:'rgba(255,255,255,0.15)',color:'#cbd5e1'}}
                           data-tooltip="Pass rate for this test in the Before window (runs prior to the pivot date). Calculated as passedRuns ÷ totalRuns × 100 within that window.">i</i>
                      </span>
                    </th>
                    <th className="px-4 py-3 text-center">
                      <span style={{display:'inline-flex',alignItems:'center',gap:'0.3rem',justifyContent:'center'}}>
                        After
                        <i className="info-trigger" style={{background:'rgba(255,255,255,0.15)',color:'#cbd5e1'}}
                           data-tooltip="Pass rate for this test in the After window (runs on or after the pivot date). Compared against Before to determine the direction and magnitude of change.">i</i>
                      </span>
                    </th>
                    <th className="px-4 py-3 text-center">
                      <span style={{display:'inline-flex',alignItems:'center',gap:'0.3rem',justifyContent:'center'}}>
                        Δ
                        <i className="info-trigger" style={{background:'rgba(255,255,255,0.15)',color:'#cbd5e1'}}
                           data-tooltip="After − Before pass rate. Positive (green) = improvement. Negative (red) = regression. The larger the absolute value, the more significant the change.">i</i>
                      </span>
                    </th>
                    <th className="px-4 py-3 text-center">
                      <span style={{display:'inline-flex',alignItems:'center',gap:'0.3rem',justifyContent:'center'}}>
                        Risk
                        <i className="info-trigger" style={{background:'rgba(255,255,255,0.15)',color:'#cbd5e1'}}
                           data-tooltip="AI-assessed risk level of the delta: Critical = large regression in a core workflow · High = consistent drop · Medium = moderate or recent change · Low = minor or improving.">i</i>
                      </span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {changed.map((d, i) => deltaRow(d, i))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="px-6 py-4 text-sm text-slate-400">No test deltas — all tests stable across the pivot date.</p>
          )}

          {/* Action items from regression agent */}
          {(report.actionItems || []).length > 0 && (
            <div className="px-6 py-4 border-t border-slate-100">
              <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3" style={{display:'inline-flex',alignItems:'center',gap:'0.4rem'}}>
                Regression Action Items
                <i className="info-trigger"
                   data-tooltip="Prioritised follow-up steps generated by the AI from the delta analysis — e.g. bisect the commit range, re-run in isolation, check shared fixtures.">i</i>
              </h3>
              <ul className="space-y-2">
                {report.actionItems.map((item, i) => (
                  <li key={i} className="flex gap-3 items-start py-1.5 border-b border-slate-50 last:border-0">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-rose-500 text-white text-xs font-bold flex items-center justify-center">{i+1}</span>
                    <span className="text-sm text-slate-600">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      );
    }

    // ── Action Items ─────────────────────────────────────────────────────────

    function ActionList({ items, title }) {
      if (!items || items.length === 0) return null;
      const tips = {
        'Trend-Level': 'Macro recommendations from the Trend Pattern Agent based on the full run history — e.g. schedule changes, alerting thresholds, investigation priorities.',
        'Per-Test':    'Test-level recommendations from the Deep Failure Agent based on per-test fail and flaky rates — e.g. quarantine a flaky test, fix a shared fixture, add a retry guard.'
      };
      return (
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3" style={{display:'inline-flex',alignItems:'center',gap:'0.4rem'}}>
            {title}
            {tips[title] && (
              <i className="info-trigger" data-tooltip={tips[title]}>i</i>
            )}
          </h3>
          <ul className="space-y-2">
            {items.map((item, i) => (
              <li key={i} className="flex gap-3 items-start py-2 border-b border-slate-100 last:border-0">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-500 text-white text-xs font-bold flex items-center justify-center">{i+1}</span>
                <span className="text-sm text-slate-600">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      );
    }

    // ── Top Risks — deterministic risk derivation ────────────────────────────

    function deriveTopRisks() {
      var risks = [];
      var SEV_ORDER = { Critical: 0, High: 1, Medium: 2, Low: 3 };

      // R1: Most-failing test
      var failingTests = (deep.perTestProfiles || [])
        .filter(function(p) { return (p.failureRate || 0) > 0; })
        .sort(function(a, b) { return (b.failureRate || 0) - (a.failureRate || 0); });
      if (failingTests.length > 0) {
        var t = failingTests[0];
        var envs = Object.keys(t.failuresByEnv || {});
        var sev = t.failureRate > 40 ? 'Critical' : t.failureRate > 20 ? 'High' : 'Medium';
        var conf = t.failureCount >= 4 ? 'High' : t.failureCount >= 2 ? 'Medium' : 'Low';
        risks.push({
          title: 'Persistent test failures \u2014 ' + t.testTitle.replace(/ @shard\d+/, ''),
          explanation: t.failureRate + '% failure rate across ' + t.totalRuns + ' runs' + (envs.length > 0 ? ' \u00b7 env-specific: ' + envs.join(', ') : ''),
          severity: sev, confidence: conf,
          evidence: t.failureCount + ' failures in ' + t.totalRuns + ' runs' + (t.timeoutSuspected ? ' \u00b7 timeout suspected' : '') + (envs.length > 0 ? ' \u00b7 ' + envs.join(', ') + ' only' : ''),
          _sev: SEV_ORDER[sev]
        });
      }

      // R2: Chronic flakiness
      var flakyTests = (deep.perTestProfiles || [])
        .filter(function(p) { return (p.flakyRate || 0) >= 20; })
        .sort(function(a, b) { return (b.flakyRate || 0) - (a.flakyRate || 0); });
      if (flakyTests.length > 0) {
        var topF = flakyTests[0];
        var sevF = topF.flakyRate >= 40 ? 'High' : 'Medium';
        var confF = flakyTests.length >= 2 ? 'High' : 'Medium';
        risks.push({
          title: flakyTests.length > 1 ? flakyTests.length + ' tests with chronic flakiness' : 'Chronic flakiness \u2014 ' + topF.testTitle.replace(/ @shard\d+/, ''),
          explanation: 'Non-deterministic results in ' + flakyTests.length + ' test(s) \u2014 unreliable CI signal',
          severity: sevF, confidence: confF,
          evidence: topF.testTitle.replace(/ @shard\d+/, '') + ': ' + topF.flakyRate + '% flaky over ' + topF.totalRuns + ' runs',
          _sev: SEV_ORDER[sevF]
        });
      }

      // R3: Degrading health trend
      if (trend.trendDirection === 'Degrading') {
        var degradingPat = (trend.patterns || []).filter(function(p) { return p.patternType === 'Degrading Trend'; })[0] || null;
        risks.push({
          title: 'Overall health trend degrading',
          explanation: 'Test suite health is declining \u2014 clean run rate ' + trend.successRate + '%, avg pass rate ' + trend.avgTestPassRate + '%',
          severity: 'High', confidence: 'High',
          evidence: degradingPat ? degradingPat.description : 'Health score: ' + trend.overallHealthScore + ' \u00b7 ' + trend.runsAnalysed + ' runs analysed',
          _sev: SEV_ORDER['High']
        });
      }

      // R4: Post-pivot regression
      if (regression && regression.overallVerdict === 'Regressed' && (regression.regressions || []).length > 0) {
        var regCount = regression.regressions.length;
        var topReg = regression.regressions.slice().sort(function(a, b) { return (b.flakyDelta || 0) - (a.flakyDelta || 0); })[0];
        var confR = (topReg.flakyDelta || 0) > 20 ? 'High' : 'Medium';
        risks.push({
          title: regCount > 1 ? regCount + ' tests regressed since ' + regression.pivotDate : 'Regression detected since ' + regression.pivotDate,
          explanation: 'New flaky or failing behaviour confirmed post-pivot \u00b7 verdict: ' + regression.overallVerdict,
          severity: 'Medium', confidence: confR,
          evidence: topReg.testTitle.replace(/ @shard\d+/, '') + ': flaky rate +' + (topReg.flakyDelta || 0) + '% post ' + regression.pivotDate,
          _sev: SEV_ORDER['Medium']
        });
      }

      // R5: Failure cluster / risk period
      if ((trend.riskPeriods || []).length > 0) {
        var rp = trend.riskPeriods[0];
        risks.push({
          title: 'Failure cluster identified',
          explanation: 'Consecutive failures concentrated in a specific time window \u2014 ' + rp.period,
          severity: 'Medium', confidence: 'High',
          evidence: rp.description,
          _sev: SEV_ORDER['Medium']
        });
      }

      // R6: DB integrity violations
      if (dbInteg && (dbInteg.totalViolations || 0) > 0) {
        var critV = dbInteg.criticalViolations || 0;
        var sevDB = critV > 0 ? 'Critical' : dbInteg.riskLevel === 'High' ? 'High' : 'Medium';
        risks.push({
          title: 'Database integrity violations detected',
          explanation: dbInteg.totalViolations + ' check(s) failed against ' + (dbInteg.database || 'DB') + ' \u2014 data consistency risk',
          severity: sevDB, confidence: 'High',
          evidence: critV + ' critical + ' + (dbInteg.totalViolations - critV) + ' other violation(s) \u00b7 env: ' + (dbInteg.environment || '?'),
          _sev: SEV_ORDER[sevDB]
        });
      }

      risks.sort(function(a, b) { return a._sev - b._sev; });
      return risks.slice(0, 5);
    }

    // ── Top Risks Section Component ──────────────────────────────────────────

    function TopRisksSection() {
      var risks = deriveTopRisks();
      if (!risks.length) return null;

      var SEV_STYLES = {
        Critical: { bg:'#fff1f2', color:'#be123c', border:'#fda4af', icon:'\ud83d\udd34', bar:'#f43f5e' },
        High:     { bg:'#fff7ed', color:'#c2410c', border:'#fed7aa', icon:'\ud83d\udfe0', bar:'#f97316' },
        Medium:   { bg:'#fefce8', color:'#854d0e', border:'#fde68a', icon:'\ud83d\udfe1', bar:'#eab308' },
        Low:      { bg:'#f0fdf4', color:'#166534', border:'#bbf7d0', icon:'\ud83d\udfe2', bar:'#22c55e' },
      };
      var CONF_STYLES = {
        High:   { bg:'#eff6ff', color:'#1e40af', border:'#bfdbfe', label:'\u2191 High confidence' },
        Medium: { bg:'#fdf4ff', color:'#7e22ce', border:'#e9d5ff', label:'\u007e Medium confidence' },
        Low:    { bg:'#f8fafc', color:'#64748b', border:'#e2e8f0', label:'\u00b7 Low confidence'  },
      };

      function SevBadge({ level }) {
        var s = SEV_STYLES[level] || SEV_STYLES.Low;
        return (
          <span style={{ display:'inline-flex', alignItems:'center', gap:'0.25rem',
            padding:'0.2rem 0.6rem', borderRadius:'999px', fontSize:'0.68rem', fontWeight:700,
            background:s.bg, color:s.color, border:'1px solid '+s.border, flexShrink:0 }}>
            <span>{s.icon}</span><span>{level}</span>
          </span>
        );
      }

      function ConfBadge({ level }) {
        var s = CONF_STYLES[level] || CONF_STYLES.Low;
        return (
          <span style={{ display:'inline-flex', alignItems:'center',
            padding:'0.15rem 0.55rem', borderRadius:'999px', fontSize:'0.65rem', fontWeight:600,
            background:s.bg, color:s.color, border:'1px solid '+s.border, flexShrink:0,
            whiteSpace:'nowrap' }}>
            {s.label}
          </span>
        );
      }

      return (
        <div id="s-top-risks" className="dash-section" style={{ marginBottom:'1.5rem' }}>

          {/* Section header */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between',
            flexWrap:'wrap', gap:'0.5rem', marginBottom:'0.85rem' }}>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', marginBottom:'0.2rem' }}>
                <span style={{ fontSize:'0.65rem', fontWeight:700, textTransform:'uppercase',
                  letterSpacing:'0.1em', color:'#ef4444', whiteSpace:'nowrap' }}>
                  \u26a0 Top Risks Detected
                </span>
                <span style={{ flex:1, height:'1px', background:'#fecaca', display:'inline-block' }} />
              </div>
              <div style={{ fontSize:'0.72rem', color:'#64748b' }}>
                Highest-impact instability and regression signals identified from recent analysis
              </div>
            </div>
            <span style={{ fontSize:'0.7rem', fontWeight:700, padding:'0.25rem 0.8rem',
              borderRadius:'999px', background:'#fff1f2', color:'#be123c',
              border:'1px solid #fda4af', whiteSpace:'nowrap', flexShrink:0 }}>
              {risks.length} risk{risks.length !== 1 ? 's' : ''} detected
            </span>
          </div>

          {/* Risk cards grid */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(275px, 1fr))', gap:'0.75rem' }}>
            {risks.map(function(risk, idx) {
              var s = SEV_STYLES[risk.severity] || SEV_STYLES.Low;
              return (
                <div key={idx}
                  style={{ background:'white', borderRadius:'10px', borderLeft:'4px solid '+s.bar,
                    boxShadow:'0 1px 3px rgba(0,0,0,0.05),0 4px 12px rgba(0,0,0,0.04)',
                    padding:'0.9rem 1.1rem', display:'flex', flexDirection:'column', gap:'0.5rem',
                    transition:'box-shadow 0.18s ease,transform 0.18s ease' }}
                  onMouseEnter={function(e) {
                    e.currentTarget.style.boxShadow = '0 4px 10px rgba(0,0,0,0.08),0 12px 24px rgba(0,0,0,0.06)';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={function(e) {
                    e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05),0 4px 12px rgba(0,0,0,0.04)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  {/* Row 1: number + title + severity badge */}
                  <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:'0.5rem' }}>
                    <div style={{ display:'flex', alignItems:'flex-start', gap:'0.45rem', flex:1, minWidth:0 }}>
                      <span style={{ flexShrink:0, width:'18px', height:'18px', borderRadius:'50%',
                        background:s.bar, color:'white', fontSize:'0.6rem', fontWeight:800,
                        display:'inline-flex', alignItems:'center', justifyContent:'center', marginTop:'0.12rem' }}>
                        {idx + 1}
                      </span>
                      <span style={{ fontSize:'0.82rem', fontWeight:700, color:'#1e293b', lineHeight:1.35 }}>
                        {risk.title}
                      </span>
                    </div>
                    <SevBadge level={risk.severity} />
                  </div>

                  {/* Row 2: one-line explanation */}
                  <div style={{ fontSize:'0.77rem', color:'#475569', lineHeight:1.55, paddingLeft:'1.55rem' }}>
                    {risk.explanation}
                  </div>

                  {/* Row 3: evidence + confidence badge */}
                  <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between',
                    gap:'0.5rem', paddingLeft:'1.55rem' }}>
                    <div style={{ fontSize:'0.68rem', color:'#94a3b8', lineHeight:1.5, background:'#f8fafc',
                      borderRadius:'6px', padding:'0.2rem 0.55rem', flex:1, minWidth:0,
                      fontFamily:'monospace', wordBreak:'break-word' }}>
                      {risk.evidence}
                    </div>
                    <ConfBadge level={risk.confidence} />
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      );
    }

    // ── App ──────────────────────────────────────────────────────────────────

    // ── Scroll utilities (progress bar + active nav + back-to-top) ──────────
    // Active-tab strategy: on every scroll event, walk the sections array in
    // order and find the LAST one whose top edge is at or above the nav bottom
    // (64px). This is O(n) on scroll but n=7 — and it is 100% reliable
    // regardless of section height, unlike IntersectionObserver rootMargin.
    function useScrollEffects() {
      useEffect(function() {
        // Order MUST match the visual DOM order on the page.
        var sections = ['s-overview','s-top-risks','s-trends','s-regression','s-unstable','s-db','s-actions'];
        var navLinks = {};
        sections.forEach(function(id) {
          var a = document.querySelector('.dash-nav a[href="#' + id + '"]');
          if (a) navLinks[id] = a;
        });

        var bar = document.getElementById('scroll-progress');
        var btn = document.getElementById('back-to-top');
        var NAV_H = 64; // px — nav bar height + small buffer

        function setActive(id) {
          Object.values(navLinks).forEach(function(a) { a.classList.remove('active'); });
          if (id && navLinks[id]) navLinks[id].classList.add('active');
        }

        function onScroll() {
          var scrolled = window.scrollY;

          // Progress bar
          var total = document.documentElement.scrollHeight - window.innerHeight;
          if (bar) bar.style.width = (total > 0 ? (scrolled / total * 100) : 0) + '%';

          // Back-to-top button
          if (btn) {
            if (scrolled > 300) btn.classList.add('visible');
            else                btn.classList.remove('visible');
          }

          // Active nav: last section whose top is <= NAV_H from viewport top.
          // Special case: if scrolled near the bottom, force the last section active
          // (the final section may never reach the nav threshold if content is short).
          var nearBottom = (window.innerHeight + scrolled) >= (document.documentElement.scrollHeight - 80);
          var active = sections[0]; // default to first
          sections.forEach(function(id) {
            var el = document.getElementById(id);
            if (el && el.getBoundingClientRect().top <= NAV_H) active = id;
          });
          if (nearBottom) active = sections[sections.length - 1];
          setActive(active);
        }

        window.addEventListener('scroll', onScroll, { passive: true });
        onScroll(); // run once on mount to set initial state

        return function() {
          window.removeEventListener('scroll', onScroll);
        };
      }, []);
    }

    function App() {
      const score       = trend.overallHealthScore ?? 0;
      const trendDir    = trend.trendDirection ?? 'Unknown';
      const generatedAt = trend.generatedAt
        ? new Date(trend.generatedAt).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC' }) + ' UTC'
        : '—';
      const reportBaseUrl = deep.reportBaseUrl || '';

      // ── Env runs modal state ───────────────────────────────────────────────
      const [envModal, setEnvModal] = useState(null); // { title, runs } | null

      useScrollEffects();

      return (
        <div className="dash">

          {/* ── Scroll progress bar (fixed, top of page) ── */}
          <div id="scroll-progress" />

          {/* ── Back to top button (fixed, bottom-right) ── */}
          <button id="back-to-top" onClick={function(){ window.scrollTo({top:0,behavior:'smooth'}); }}
            title="Back to top" aria-label="Back to top">
            &#8679;
          </button>

          {/* ── Env runs modal (portal-style, rendered at top of tree) ── */}
          {envModal && (
            <EnvRunsModal
              runs={envModal.runs}
              title={envModal.title}
              reportBaseUrl={reportBaseUrl}
              onClose={() => setEnvModal(null)}
            />
          )}

          {/* ── Header ── */}
          <header className="dash-header">
            <div className="dash-header-inner">
              <div>
                <div style={{display:'flex',alignItems:'center',gap:'0.5rem',marginBottom:'0.4rem'}}>
                  <span style={{fontSize:'0.65rem',fontWeight:700,letterSpacing:'0.1em',textTransform:'uppercase',opacity:0.6}}>✦ AI Powered Analysis</span>
                </div>
                <div className="dash-title">SIMS Finance — AI Analysis</div>
                <div className="dash-subtitle">
                  Playwright Test Intelligence · {trend.runsAnalysed ?? 0} business-day runs
                  {(trend.weekendExcluded ?? 0) > 0 && (
                    <span style={{opacity:0.7}}> (+{trend.weekendExcluded} weekend auto-excluded)</span>
                  )}
                  · {trend.dateRange?.from ?? '?'} → {trend.dateRange?.to ?? '?'}
                </div>
                {/* ── Detected environments strip ── */}
                {(() => {
                  const envEntries = Object.entries(trend.byEnvironment || {});
                  if (envEntries.length === 0) return null;
                  return (
                    <div style={{display:'flex',gap:'0.35rem',flexWrap:'wrap',marginTop:'0.55rem'}}>
                      <span style={{fontSize:'0.65rem',fontWeight:600,opacity:0.7,alignSelf:'center'}}>Environments:</span>
                      {envEntries.map(([env, d], i) => (
                        <span key={i} style={{display:'inline-block',padding:'0.15rem 0.6rem',borderRadius:'999px',fontSize:'0.65rem',fontWeight:700,background:'rgba(255,255,255,0.22)',border:'1px solid rgba(255,255,255,0.35)',letterSpacing:'0.02em'}}>
                          {env} <span style={{opacity:0.75}}>({d.total} runs)</span>
                        </span>
                      ))}
                    </div>
                  );
                })()}
                <div style={{display:'flex',gap:'0.4rem',flexWrap:'wrap',marginTop:'0.75rem'}}>
                  {[
                    { label:'📊 Trend Analysis',       color:'rgba(255,255,255,0.18)' },
                    { label:'🔍 Failure Analysis',      color:'rgba(255,255,255,0.18)' },
                    { label:'📈 Reliability Insights',  color:'rgba(255,255,255,0.18)' },
                  ].map((b,i) => (
                    <span key={i} style={{display:'inline-block',padding:'0.2rem 0.65rem',borderRadius:'999px',fontSize:'0.68rem',fontWeight:600,background:b.color,border:'1px solid rgba(255,255,255,0.25)',letterSpacing:'0.01em',whiteSpace:'nowrap'}}>
                      {b.label}
                    </span>
                  ))}
                </div>
              </div>
              <div className="dash-header-right">
                {trendBadge(trendDir)}
                <AnalyseButton />
                <span className="dash-meta">Generated {generatedAt}</span>
              </div>
            </div>
          </header>

          {/* ── Sticky nav ── */}
          <nav className="dash-nav">
            <div className="dash-nav-inner">
              <a href="#s-overview">📊 Overview</a>
              <a href="#s-top-risks">⚠️ Top Risks</a>
              <a href="#s-trends">📈 Trends</a>
              <a href="#s-regression">🔁 Regression</a>
              <a href="#s-unstable">🔴 Unstable Tests</a>
              <a href="#s-db">🗄️ DB Integrity</a>
              <a href="#s-actions">✅ Action Items</a>
            </div>
          </nav>

          <main className="dash-main">

            {/* ══ 1. OVERVIEW ══ */}
            <div id="s-overview" className="dash-section">

              <p className="section-label">Overview</p>

              {/* KPI tiles */}
              <div className="kpi-row">

                {/* ── 1. Health Score + Trend Direction ── */}
                <div className="kpi-tile" style={{display:'flex',flexDirection:'column',alignItems:'center',gap:'0.5rem',borderTop:'3px solid ' + healthColor(score)}}>
                  <div style={{display:'flex',alignItems:'center',gap:'0.4rem'}}>
                    <div className="kpi-label" style={{margin:0}}>Health Score</div>
                    <i className="info-trigger"
                       data-tooltip="Composite 0–100 score from four signals: Pass rate (% runs with zero failures) · Flaky rate (tests with inconsistent outcomes) · Failure frequency (recurrent test failures) · Execution trend (improving vs degrading). 75+ = Healthy · 50–74 = Warning · <50 = Critical">i</i>
                  </div>
                  <HealthRing score={score} />
                  <span style={{fontSize:'0.7rem',fontWeight:700,color:healthColor(score),letterSpacing:'0.05em',textTransform:'uppercase'}}>
                    {score>=75?'● Healthy':score>=50?'● Warning':'● Critical'}
                  </span>
                  <span style={{
                    fontSize:'0.72rem', fontWeight:700, letterSpacing:'0.04em',
                    color: trendDir==='Improving' ? '#059669' : trendDir==='Degrading' ? '#dc2626' : '#64748b'
                  }}>
                    {trendDir==='Improving' ? '↑ Improving' : trendDir==='Degrading' ? '↓ Degrading' : '→ Stable'}
                  </span>
                </div>

                {/* ── 2. Avg Test Pass Rate ── */}
                <div className="kpi-tile">
                  <div style={{display:'flex',alignItems:'center',gap:'0.4rem',marginBottom:'0.5rem'}}>
                    <div className="kpi-label" style={{margin:0}}>Avg Test Pass Rate</div>
                    <i className="info-trigger"
                       data-tooltip="Average percentage of tests that pass per CI run. Calculated as mean(passed ÷ executed × 100) across all business-day runs. Gives partial credit for near-perfect runs — a run where 41/42 tests pass scores 97%, not 0%. Primary health signal.">i</i>
                  </div>
                  <div className="kpi-value" style={{color:healthColor(trend.avgTestPassRate??0)}}>{trend.avgTestPassRate??0}%</div>
                  <RateBar value={trend.avgTestPassRate??0} colorClass={(trend.avgTestPassRate??0)>=95?'bg-emerald-500':(trend.avgTestPassRate??0)>=80?'bg-amber-400':'bg-rose-500'} />
                  {(trend.weekendExcluded ?? 0) > 0 && (
                    <div className="kpi-sub" style={{marginTop:'0.4rem'}}>
                      <span style={{color:'#94a3b8'}}>{trend.weekendExcluded} wknd run{trend.weekendExcluded !== 1 ? 's' : ''} auto-excluded</span>
                    </div>
                  )}
                </div>

                {/* ── 3. Clean Runs — promoted from sub-metric ── */}
                <div className="kpi-tile">
                  <div style={{display:'flex',alignItems:'center',gap:'0.4rem',marginBottom:'0.5rem'}}>
                    <div className="kpi-label" style={{margin:0}}>Clean Runs</div>
                    <i className="info-trigger"
                       data-tooltip="Strict metric: % of business-day runs where 100% of tests passed with zero flakiness. Even a single flaky retry disqualifies a run. The gap between this and Avg Test Pass Rate reveals how often minor issues creep in.">i</i>
                  </div>
                  <div className="kpi-value" style={{color:healthColor(trend.successRate??0)}}>{trend.successRate??0}%</div>
                  <RateBar value={trend.successRate??0} colorClass={(trend.successRate??0)>=75?'bg-emerald-500':(trend.successRate??0)>=40?'bg-amber-400':'bg-rose-500'} />
                  <div className="kpi-sub" style={{marginTop:'0.5rem',borderTop:'1px solid #f1f5f9',paddingTop:'0.4rem',fontSize:'0.72rem'}}>
                    <span style={{color:'#94a3b8'}}>Avg pass rate: </span>
                    <span style={{fontWeight:700,color:healthColor(trend.avgTestPassRate??0)}}>{trend.avgTestPassRate??0}%</span>
                    <span style={{color:'#cbd5e1',margin:'0 0.25rem'}}>·</span>
                    <span style={{color:'#94a3b8'}}>gap: </span>
                    <span style={{fontWeight:700,color:(trend.avgTestPassRate??0)-(trend.successRate??0)>30?'#dc2626':'#64748b'}}>
                      {(trend.avgTestPassRate??0)-(trend.successRate??0)}pp
                    </span>
                  </div>
                </div>

                {/* ── 4. Unstable Tests — replaces run-level Flaky Rate ── */}
                {(() => {
                  const profiles = deep.perTestProfiles || [];
                  const total    = profiles.length;
                  if (total === 0) return (
                    <div className="kpi-tile">
                      <div className="kpi-label">Unstable Tests</div>
                      <div className="kpi-value" style={{color:'#94a3b8'}}>—</div>
                      <div className="kpi-sub">no profile data</div>
                    </div>
                  );
                  const failing  = profiles.filter(p => (p.failureRate ?? 0) > 0).length;
                  const flaky    = profiles.filter(p => (p.flakyRate  ?? 0) > 0).length;
                  const unstable = profiles.filter(p => (p.failureRate ?? 0) > 0 || (p.flakyRate ?? 0) > 0).length;
                  const pct      = Math.round(unstable / total * 100);
                  const valColor = pct === 0 ? '#059669' : pct <= 33 ? '#d97706' : '#dc2626';
                  return (
                    <div className="kpi-tile">
                      <div style={{display:'flex',alignItems:'center',gap:'0.4rem',marginBottom:'0.5rem'}}>
                        <div className="kpi-label" style={{margin:0}}>Unstable Tests</div>
                        <i className="info-trigger"
                           data-tooltip="Tests that have at least one failure or flaky result across the profiled runs. Calculated per-test — a single flaky test causing 10 runs to be flagged still counts as 1 unstable test. A test can be both failing and flaky.">i</i>
                      </div>
                      <div className="kpi-value" style={{color:valColor}}>
                        {unstable}
                        <span style={{fontSize:'1rem',color:'#94a3b8',fontWeight:500}}>/{total}</span>
                      </div>
                      <RateBar value={pct} colorClass={pct===0?'bg-emerald-500':pct<=33?'bg-amber-400':'bg-rose-500'} />
                      <div className="kpi-sub" style={{marginTop:'0.5rem',borderTop:'1px solid #f1f5f9',paddingTop:'0.4rem',display:'flex',gap:'0.4rem',flexWrap:'wrap'}}>
                        <span style={{padding:'0.1rem 0.5rem',borderRadius:'999px',fontSize:'0.68rem',fontWeight:700,background:'#fee2e2',color:'#b91c1c'}}>{failing} failing</span>
                        <span style={{padding:'0.1rem 0.5rem',borderRadius:'999px',fontSize:'0.68rem',fontWeight:700,background:'#fef3c7',color:'#92400e'}}>{flaky} flaky</span>
                      </div>
                    </div>
                  );
                })()}

                {/* ── 5. Suite Reliability — replaces Tests Profiled ── */}
                {(() => {
                  const profiles = deep.perTestProfiles || [];
                  const total    = profiles.length;
                  if (total === 0) return (
                    <div className="kpi-tile">
                      <div className="kpi-label">Suite Reliability</div>
                      <div className="kpi-value" style={{color:'#94a3b8'}}>—</div>
                      <div className="kpi-sub">no profile data</div>
                    </div>
                  );
                  const clean = profiles.filter(p => (p.failureRate ?? 0) === 0 && (p.flakyRate ?? 0) === 0).length;
                  const pct   = Math.round(clean / total * 100);
                  const valColor = pct >= 80 ? '#059669' : pct >= 50 ? '#d97706' : '#dc2626';
                  return (
                    <div className="kpi-tile">
                      <div style={{display:'flex',alignItems:'center',gap:'0.4rem',marginBottom:'0.5rem'}}>
                        <div className="kpi-label" style={{margin:0}}>Suite Reliability</div>
                        <i className="info-trigger"
                           data-tooltip="Percentage of profiled tests that are completely clean — zero failures and zero flakiness across all scanned runs. The inverse of Unstable Tests. 100% means every test passes every time, consistently.">i</i>
                      </div>
                      <div className="kpi-value" style={{color:valColor}}>{pct}%</div>
                      <RateBar value={pct} colorClass={pct>=80?'bg-emerald-500':pct>=50?'bg-amber-400':'bg-rose-500'} />
                      <div className="kpi-sub" style={{marginTop:'0.5rem',borderTop:'1px solid #f1f5f9',paddingTop:'0.4rem'}}>
                        <span style={{color:'#94a3b8'}}>{clean}/{total} tests clean</span>
                        <span style={{color:'#cbd5e1',margin:'0 0.25rem'}}>·</span>
                        <span style={{color:'#94a3b8'}}>{deep.runsAnalysed??0} runs scanned</span>
                      </div>
                    </div>
                  );
                })()}

              </div>

              {/* Top Risks moved to its own top-level section below */}

              {/* Executive Summary */}
              <div className="card">
                <div className="card-head"><h2>Executive Summary</h2></div>
                <div className="card-body" style={{display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))', gap:'1rem', alignItems:'start'}}>
                  <ExecSummaryPanel summary={trend.executiveSummary} label="Trend Analysis" agentKey="trend" />
                  {deep.executiveSummary && (
                    <ExecSummaryPanel summary={deep.executiveSummary} label="Per-Test Analysis" agentKey="deep" />
                  )}
                </div>
              </div>

              {/* Database Integrity has its own dedicated tab — not duplicated here */}

              {/* AI Agents Used */}
              <div className="card">
                <div className="card-head"><h2>AI Agents Used</h2></div>
                <div className="card-body" style={{display:'flex',flexWrap:'wrap',gap:'0.6rem'}}>
                  {Object.values(AGENTS).map(function(a) {
                    return (
                      <span key={a.key} style={{display:'inline-flex',alignItems:'center',gap:'0.35rem',padding:'0.3rem 0.85rem',borderRadius:'999px',fontSize:'0.72rem',fontWeight:600,background:a.bg,border:'1px solid '+a.border,color:a.text}}>
                        {a.icon} {a.label}
                        <i className="info-trigger"
                           data-tooltip={a.tip}
                           style={{background:a.border, color:a.text}}>i</i>
                      </span>
                    );
                  })}
                </div>
              </div>

            </div>

            {/* TopRisksSection renders id="s-top-risks" on its own root div */}
            <TopRisksSection />

            {/* ══ 2. TRENDS ══ */}
            <div id="s-trends" className="dash-section">

              <p className="section-label">Trends <AgentBadge agentKey="trend" style={{marginLeft:'0.5rem'}} /></p>

              {/* Environment Breakdown */}
              {(() => {
                const envEntries = Object.entries(trend.byEnvironment || {});
                if (envEntries.length < 2) return null;
                return (
                  <div className="card">
                    <div className="card-head">
                      <div style={{display:'flex',alignItems:'center',gap:'0.5rem'}}>
                        <h2>Environment Breakdown</h2>
                        <i className="info-trigger"
                           data-tooltip="Failure rates and average success split by environment. A test failing only in UAT but not TRAINING (or vice-versa) points to environment-specific config or data rather than a code defect.">i</i>
                      </div>
                      <p>Run stats per environment across the full history</p>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm text-left">
                        <thead className="bg-slate-700 text-white text-xs uppercase tracking-wide">
                          <tr>
                            <th className="px-4 py-3">Environment</th>
                            <th className="px-4 py-3 text-center">
                              <span style={{display:'inline-flex',alignItems:'center',gap:'0.3rem',justifyContent:'center'}}>
                                Total Runs
                                <i className="info-trigger"
                                   style={{background:'rgba(255,255,255,0.15)',color:'#cbd5e1'}}
                                   data-tooltip="Count of business-day (Mon–Fri) runs recorded for this environment. Weekend runs are automatically excluded from all metrics.">i</i>
                              </span>
                            </th>
                            <th className="px-4 py-3 text-center">
                              <span style={{display:'inline-flex',alignItems:'center',gap:'0.3rem',justifyContent:'center'}}>
                                Runs w/ Failures
                                <i className="info-trigger"
                                   style={{background:'rgba(255,255,255,0.15)',color:'#cbd5e1'}}
                                   data-tooltip="Runs where at least one test did not pass (pass rate &lt; 100%). Derived from successRate, not raw failure count — the raw count is corrupted by the CI script when flakiness is present.">i</i>
                              </span>
                            </th>
                            <th className="px-4 py-3 text-center">
                              <span style={{display:'inline-flex',alignItems:'center',gap:'0.3rem',justifyContent:'center'}}>
                                Runs w/ Flakiness
                                <i className="info-trigger"
                                   style={{background:'rgba(255,255,255,0.15)',color:'#cbd5e1'}}
                                   data-tooltip="Runs where at least one test was marked flaky — it retried and eventually passed, meaning the result is non-deterministic. A run can appear in both this column and Runs w/ Failures.">i</i>
                              </span>
                            </th>
                            <th className="px-4 py-3">
                              <span style={{display:'inline-flex',alignItems:'center',gap:'0.3rem'}}>
                                Avg Success Rate
                                <i className="info-trigger"
                                   style={{background:'rgba(255,255,255,0.15)',color:'#cbd5e1'}}
                                   data-tooltip="Average percentage of tests passing per run for this environment — calculated as mean(passed ÷ executed × 100) across all weekday runs. Gives partial credit for near-perfect runs, unlike a binary pass/fail count.">i</i>
                              </span>
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {envEntries.map(([env, d], i) => (
                            <tr key={i} className="hover:bg-slate-50">
                              <td className="px-4 py-3 font-semibold text-slate-800">
                                <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-700 border border-indigo-200">{env}</span>
                              </td>
                              <td className="px-4 py-3 text-center">
                                <button
                                  onClick={() => setEnvModal({ title: env + ' \u2014 All Runs (' + d.total + ')', runs: d.runs || [] })}
                                  title="View all runs for this environment"
                                  style={{fontFamily:'monospace',fontWeight:700,color:'#334155',background:'none',border:'none',cursor:'pointer',padding:'0.1rem 0.3rem',borderRadius:'4px',textDecoration:'underline dotted',textUnderlineOffset:'3px'}}
                                  onMouseEnter={e=>e.currentTarget.style.color='#4f46e5'}
                                  onMouseLeave={e=>e.currentTarget.style.color='#334155'}
                                >{d.total}</button>
                              </td>
                              <td className="px-4 py-3 text-center">
                                <button
                                  onClick={() => d.failures > 0 && setEnvModal({ title: env + ' \u2014 Runs with Failures (' + d.failures + ')', runs: d.failureRuns || [] })}
                                  title={d.failures > 0 ? 'View runs with failures' : 'No failures'}
                                  style={{
                                    fontWeight:700, background:'none', border:'none',
                                    cursor: d.failures > 0 ? 'pointer' : 'default',
                                    padding:'0.1rem 0.3rem', borderRadius:'4px',
                                    color: d.failures > 0 ? '#dc2626' : '#059669',
                                    textDecoration: d.failures > 0 ? 'underline dotted' : 'none',
                                    textUnderlineOffset:'3px'
                                  }}
                                  onMouseEnter={e=>{ if(d.failures>0) e.currentTarget.style.color='#991b1b'; }}
                                  onMouseLeave={e=>{ if(d.failures>0) e.currentTarget.style.color='#dc2626'; }}
                                >{d.failures}</button>
                                <span className="text-slate-400 text-xs ml-1">({d.total > 0 ? Math.round(d.failures/d.total*100) : 0}%)</span>
                              </td>
                              <td className="px-4 py-3 text-center">
                                <button
                                  onClick={() => d.flaky > 0 && setEnvModal({ title: env + ' \u2014 Runs with Flakiness (' + d.flaky + ')', runs: d.flakyRuns || [] })}
                                  title={d.flaky > 0 ? 'View runs with flakiness' : 'No flakiness'}
                                  style={{
                                    fontWeight:700, background:'none', border:'none',
                                    cursor: d.flaky > 0 ? 'pointer' : 'default',
                                    padding:'0.1rem 0.3rem', borderRadius:'4px',
                                    color: d.flaky > 0 ? '#d97706' : '#059669',
                                    textDecoration: d.flaky > 0 ? 'underline dotted' : 'none',
                                    textUnderlineOffset:'3px'
                                  }}
                                  onMouseEnter={e=>{ if(d.flaky>0) e.currentTarget.style.color='#92400e'; }}
                                  onMouseLeave={e=>{ if(d.flaky>0) e.currentTarget.style.color='#d97706'; }}
                                >{d.flaky}</button>
                                <span className="text-slate-400 text-xs ml-1">({d.total > 0 ? Math.round(d.flaky/d.total*100) : 0}%)</span>
                              </td>
                              <td className="px-4 py-3 min-w-[140px]">
                                <RateBar value={Math.round(d.avgSuccess ?? 0)}
                                  colorClass={(d.avgSuccess ?? 0) >= 75 ? 'bg-emerald-500' : (d.avgSuccess ?? 0) >= 50 ? 'bg-amber-400' : 'bg-rose-500'} />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })()}

              <div className="card">
                <div className="card-head">
                  <div style={{display:'flex',alignItems:'center',gap:'0.5rem'}}>
                    <h2>Trend Patterns</h2>
                    <i className="info-trigger"
                       data-tooltip="Recurring behaviours detected by the AI across the full run history — e.g. consistent failure clusters, flaky spikes, or time-of-day patterns. Each pattern has a severity rating and a recommendation.">i</i>
                  </div>
                </div>
                <PatternsTable patterns={trend.patterns} />
              </div>

              {(trend.riskPeriods||[]).length > 0 && (
                <div className="card">
                  <div className="card-head">
                    <div style={{display:'flex',alignItems:'center',gap:'0.5rem'}}>
                      <h2>Risk Periods</h2>
                      <i className="info-trigger"
                         data-tooltip="Calendar windows (day-of-week, time-of-day, or date ranges) where failures are disproportionately clustered. Identified by the AI analysing the per-run history — not manually tagged.">i</i>
                    </div>
                  </div>
                  <div className="card-body" style={{display:'flex',flexDirection:'column',gap:'0.75rem'}}>
                    {trend.riskPeriods.map((r,i) => (
                      <div key={i} className="alert-amber">
                        <span style={{fontSize:'1rem'}}>⚠️</span>
                        <div>
                          <div className="alert-amber-title">{r.period}</div>
                          <div className="alert-amber-body">{r.description}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>

            {/* ══ 3. REGRESSION DELTA ══ */}
            <div id="s-regression" className="dash-section">
              <p className="section-label">Regression Delta <AgentBadge agentKey="regression" style={{marginLeft:'0.5rem'}} /></p>
              <RegressionDeltaSection report={regression} />
            </div>

            {/* ══ 4. UNSTABLE TESTS ══ */}
            <div id="s-unstable" className="dash-section">

              {(() => {
                const unstable = (deep.perTestAnalyses||[]).filter(a=>a.stabilityLabel==='Unstable').length;
                const flaky    = (deep.perTestAnalyses||[]).filter(a=>a.stabilityLabel==='Flaky').length;
                const dotColor = unstable > 0 ? '#f43f5e' : flaky > 0 ? '#f59e0b' : '#10b981';
                const statusText = unstable > 0 ? unstable + ' Unstable' : flaky > 0 ? flaky + ' Flaky' : 'All Stable';
                return (
                  <p className="section-label" style={{display:'flex',alignItems:'center',gap:'0.5rem'}}>
                    <span style={{width:'8px',height:'8px',borderRadius:'50%',background:dotColor,flexShrink:0,boxShadow:'0 0 0 3px ' + dotColor + '22'}} />
                    Unstable Tests
                    <span style={{fontSize:'0.65rem',fontWeight:700,color:dotColor,marginLeft:'0.25rem'}}>{statusText}</span>
                    <AgentBadge agentKey="deep" style={{marginLeft:'0.5rem'}} />
                  </p>
                );
              })()}

              <div className="card">
                <div className="card-head"><h2>Per-Test Stability Analysis</h2></div>
                <PerTestTable analyses={deep.perTestAnalyses} profiles={deep.perTestProfiles} reportBaseUrl={reportBaseUrl} />
              </div>

              {(deep.coFailurePatterns||[]).length > 0 && (
                <div className="card">
                  <div className="card-head">
                    <div style={{display:'flex',alignItems:'center',gap:'0.5rem'}}>
                      <h2>Co-Failure Patterns</h2>
                      <i className="info-trigger"
                         data-tooltip="Tests that fail together in the same run. A high co-failure count suggests a shared root cause — e.g. a common fixture, shared database state, or an upstream service dependency.">i</i>
                    </div>
                    <p>Tests that fail together — shared root cause likely.</p>
                  </div>
                  <CoFailureTable patterns={deep.coFailurePatterns} />
                </div>
              )}

            </div>

            {/* ══ 6. DB INTEGRITY ══ */}
            <div id="s-db" className="dash-section">
              <p className="section-label">DB Integrity <AgentBadge agentKey="db" style={{marginLeft:'0.5rem'}} /></p>
              <DatabaseIntegritySection report={dbInteg} />
            </div>

            {/* ══ 7. ACTION ITEMS ══ */}
            <div id="s-actions" className="dash-section">

              <p className="section-label">Action Items <AgentBadge agentKey="trend" style={{marginLeft:'0.5rem'}} /><AgentBadge agentKey="deep" style={{marginLeft:'0.25rem'}} /></p>

              <div className="card">
                <div className="card-body" style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(300px,1fr))',gap:'2.5rem'}}>
                  <ActionList items={trend.actionItems} title="Trend-Level" />
                  <ActionList items={deep.actionItems}  title="Per-Test" />
                </div>
              </div>

            </div>

          </main>

          <footer className="dash-footer">
            <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:'0.4rem'}}>
              <div style={{display:'flex',alignItems:'center',gap:'0.5rem'}}>
                <span style={{display:'inline-block',width:'8px',height:'8px',borderRadius:'50%',background:'#10b981'}} />
                <span style={{fontWeight:700,color:'#475569',letterSpacing:'0.03em'}}>SIMS Finance AI Dashboard</span>
              </div>
              <div>Playwright Test Suite &nbsp;&middot;&nbsp; AI Analysis Report &nbsp;&middot;&nbsp; &copy; {new Date().getFullYear()}</div>
              <div style={{marginTop:'0.2rem',fontSize:'0.62rem',color:'#cbd5e1'}}>Generated {generatedAt} &nbsp;&middot;&nbsp; Powered by Azure AI Foundry</div>
            </div>
          </footer>

        </div>
      );
    }

    ReactDOM.createRoot(document.getElementById('root')).render(<App />);

    // ── Close env modal on Escape key ────────────────────────────────────────
    // (handled inside EnvRunsModal via backdrop click; keyboard escape is a nice extra)
  <\/script>

  <script>
    /* ── Global Info Tooltip Engine ──────────────────────────────────────────
       Trigger: any element with class="info-trigger" and data-tooltip="..."
       One global <div id="global-tooltip"> is created at <body> level.
       Uses getBoundingClientRect() + position:fixed — immune to all
       overflow:hidden, transform, or stacking-context ancestors.        */
    (function () {
      var MAX_W   = 250;
      var MARGIN  = 10;
      var GAP     = 7;
      var DELAY   = 150;   /* ms before showing */
      var tt      = document.createElement('div');
      tt.id = 'global-tooltip';
      document.body.appendChild(tt);

      var showTimer, hideTimer;

      function position(trigger) {
        var r   = trigger.getBoundingClientRect();
        var iCx = r.left + r.width / 2;
        var vw  = window.innerWidth;
        var vh  = window.innerHeight;

        /* Clamp width to avoid overflow near edges */
        var w = Math.min(MAX_W, vw - MARGIN * 2);
        tt.style.maxWidth = w + 'px';

        /* Measure tooltip height after content set */
        tt.style.left = '-9999px'; tt.style.top = '-9999px';
        var th = tt.offsetHeight;

        /* Prefer below; flip above if no room below */
        var below = (r.bottom + GAP + th) <= (vh - MARGIN);
        var topPx = below ? r.bottom + GAP : r.top - th - GAP;

        /* Clamp left */
        var leftPx = iCx - w / 2;
        leftPx = Math.max(MARGIN, Math.min(leftPx, vw - w - MARGIN));

        /* Arrow x relative to box */
        var ax = Math.max(10, Math.min(iCx - leftPx, w - 10));

        tt.style.setProperty('--ax', ax + 'px');
        tt.style.left = leftPx + 'px';
        tt.style.top  = topPx  + 'px';
        tt.className  = 'tt-visible ' + (below ? 'tt-below' : 'tt-above');
      }

      function show(trigger) {
        clearTimeout(hideTimer);
        tt.textContent = '';   /* clear first */
        tt.textContent = trigger.dataset.tooltip || '';
        position(trigger);
        requestAnimationFrame(function () { tt.classList.add('tt-show'); });
      }

      function hide() {
        tt.classList.remove('tt-show');
        hideTimer = setTimeout(function () { tt.className = ''; }, 200);
      }

      document.addEventListener('mouseover', function (e) {
        var trigger = e.target.closest('.info-trigger');
        if (!trigger || !trigger.dataset.tooltip) return;
        clearTimeout(hideTimer);
        clearTimeout(showTimer);
        showTimer = setTimeout(function () { show(trigger); }, DELAY);
      });

      document.addEventListener('mouseout', function (e) {
        var trigger = e.target.closest('.info-trigger');
        if (trigger && !trigger.contains(e.relatedTarget)) {
          clearTimeout(showTimer);
          hide();
        }
      });

      /* Reposition on scroll / resize without flicker */
      var lastTrigger = null;
      document.addEventListener('mouseover', function (e) {
        var t = e.target.closest('.info-trigger');
        lastTrigger = t || lastTrigger;
      });
      window.addEventListener('scroll', function () {
        if (tt.classList.contains('tt-show') && lastTrigger) position(lastTrigger);
      }, { passive:true });
    })();
  <\/script>

</body>
</html>`;

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, html, 'utf8');
console.log(`✅ AI report written to ${outPath}`);

