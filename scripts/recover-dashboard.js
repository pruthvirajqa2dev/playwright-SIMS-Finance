'use strict';
/**
 * recover-dashboard.js — manual gh-pages dashboard recovery.
 *
 * Reads the current consolidated history from Main, builds a rows JSON
 * from published-reports dirs on the gh-pages worktree, regenerates
 * published-reports/index.html and commits it.
 *
 * Usage:
 *   node scripts/recover-dashboard.js [--gh-pages-root C:\Temp\gh-pages-work]
 */

const fs   = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const args        = process.argv.slice(2);
const ghPagesIdx  = args.indexOf('--gh-pages-root');
const GH_PAGES    = ghPagesIdx !== -1 ? args[ghPagesIdx + 1] : 'C:\\Temp\\gh-pages-work';
const MAIN_ROOT   = path.resolve(__dirname, '..');
const SCRIPTS_DIR = path.join(MAIN_ROOT, 'scripts');

// ── Helpers ──────────────────────────────────────────────────────────────────
function readJsonFile(p, fallback = null) {
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); }
  catch (_) { return fallback; }
}

function readTextFile(p, fallback = 'N/A') {
  try { return fs.readFileSync(p, 'utf8').trim(); }
  catch (_) { return fallback; }
}

function formatDuration(secs) {
  if (!secs || secs <= 0) return 'N/A';
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  const parts = [];
  if (h > 0) parts.push(h + ' hr' + (h > 1 ? 's' : ''));
  if (m > 0) parts.push(m + ' min' + (m > 1 ? 's' : ''));
  if (s > 0 || parts.length === 0) parts.push(s + ' sec' + (s !== 1 ? 's' : ''));
  return parts.join(' ');
}

// ── Step 1: validate paths ────────────────────────────────────────────────────
console.log('\n  Phase 3A Dashboard Recovery');
console.log('  ──────────────────────────────');
console.log('  gh-pages root : ' + GH_PAGES);
console.log('  Main root     : ' + MAIN_ROOT);

if (!fs.existsSync(GH_PAGES)) {
  console.error('\n  ERROR: gh-pages worktree not found at ' + GH_PAGES);
  console.error('  Run: git worktree add --detach C:\\Temp\\gh-pages-work origin/gh-pages');
  process.exit(1);
}

const REPORTS_DIR   = path.join(GH_PAGES, 'published-reports');
const INDEX_FILE    = path.join(REPORTS_DIR, 'index.html');
const HISTORY_FILE  = path.join(MAIN_ROOT, 'test-results-history', 'consolidated.json');

if (!fs.existsSync(REPORTS_DIR)) {
  console.error('\n  ERROR: published-reports/ not found in gh-pages worktree.');
  process.exit(1);
}

// ── Step 2: Load consolidated history ────────────────────────────────────────
const history = readJsonFile(HISTORY_FILE, { runs: [] });
console.log('  history runs  : ' + history.runs.length + ' (from test-results-history/consolidated.json)');

// Write to temp file for generate-dashboard.js
const CONSOLIDATED_TMP = path.join(require('os').tmpdir(), 'consolidated_recovery.json');
fs.writeFileSync(CONSOLIDATED_TMP, JSON.stringify(history));

// ── Step 3: Build rows from gh-pages published-reports dirs ─────────────────
const TIMESTAMP_RE = /^\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}$/;

const dirs = fs.readdirSync(REPORTS_DIR)
  .filter(name => TIMESTAMP_RE.test(name))
  .filter(name => fs.existsSync(path.join(REPORTS_DIR, name, 'index.html')))
  .sort()
  .reverse();

console.log('  report dirs   : ' + dirs.length + ' timestamp directories found');

const rows = dirs.map(dir => {
  const base     = path.join(REPORTS_DIR, dir);
  const status   = readJsonFile(path.join(base, 'status.json'), {});
  const execTime = readTextFile(path.join(base, 'execution-time.txt'));
  const wfTime   = readTextFile(path.join(base, 'workflow-time.txt'));
  const shards   = readJsonFile(path.join(base, 'shard-times.json'), []);

  const [datePart, timePart] = dir.split('_');
  const timeFormatted = (timePart || '').replace(/-/g, ':');

  return {
    date:        datePart  || dir,
    time:        timeFormatted,
    link:        './' + dir + '/index.html',
    status:      status.status      || 'Unknown',
    environment: status.environment || '',
    failedStage: status.failedStage || '',
    execTime:    execTime,
    workflowTime:wfTime,
    shardTimes:  shards
  };
});

const ROWS_TMP = path.join(require('os').tmpdir(), 'rows_recovery.json');
fs.writeFileSync(ROWS_TMP, JSON.stringify(rows));
console.log('  rows built    : ' + rows.length + ' rows');

// ── Step 4: Run generate-dashboard.js ────────────────────────────────────────
const GEN_SCRIPT = path.join(SCRIPTS_DIR, 'generate-dashboard.js');
console.log('\n  Generating dashboard...');
try {
  execSync(
    'node "' + GEN_SCRIPT + '" "' + CONSOLIDATED_TMP + '" "' + ROWS_TMP + '" "' + INDEX_FILE + '"',
    { stdio: 'inherit', cwd: MAIN_ROOT }
  );
} catch (err) {
  console.error('\n  ERROR: generate-dashboard.js failed: ' + err.message);
  process.exit(1);
}

// ── Step 5: Verify the generated file ────────────────────────────────────────
const generated = fs.readFileSync(INDEX_FILE, 'utf8');
const hasReact  = generated.includes('ReactDOM.createRoot');
const hasAI     = generated.includes('AiIntelligenceStrip');
const hasRows   = generated.includes(rows[0]?.link || 'N/A');
console.log('  React shell   : ' + (hasReact ? '✅' : '❌'));
console.log('  AI strip      : ' + (hasAI ? '✅' : '❌'));
console.log('  Row 0 link    : ' + (hasRows ? '✅' : '⚠ (may be normal if no rows)'));
console.log('  File size     : ' + Math.round(generated.length / 1024) + ' KB');

if (!hasReact) {
  console.error('\n  ABORT: Generated HTML does not contain React. Refusing to commit garbage.');
  process.exit(1);
}

// ── Step 6: Commit and push ───────────────────────────────────────────────────
console.log('\n  Committing to gh-pages...');
try {
  execSync('git config user.email "154661815+pruthvirajqa2dev@users.noreply.github.com"', { cwd: GH_PAGES });
  execSync('git config user.name "pruthvirajqa2dev"', { cwd: GH_PAGES });
  execSync('git add published-reports/index.html', { cwd: GH_PAGES, stdio: 'inherit' });
  execSync('git diff --cached --quiet || git commit -m "fix: restore React dashboard (index.html was static table)"', { cwd: GH_PAGES, stdio: 'inherit' });
  execSync('git push origin HEAD:gh-pages', { cwd: GH_PAGES, stdio: 'inherit' });
  console.log('\n  ✅ Dashboard committed and pushed to gh-pages.');
  console.log('  GitHub Pages will reflect the update in ~1-2 minutes.');
} catch (err) {
  console.error('\n  ERROR during git operations: ' + err.message);
  process.exit(1);
}
