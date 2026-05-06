/**
 * ai-server.js
 *
 * Lightweight local development server for the SIMS Finance AI Analysis Report.
 *
 * Features:
 *   - Serves ai-outputs/ai-report.html at http://localhost:3001
 *   - POST /api/ai/analyse  — triggers npm run ai:full (or ai:regression with pivotDate)
 *   - GET  /api/ai/stream   — SSE; streams live stdout/stderr + a final "done" event
 *
 * No extra npm dependencies — uses only Node.js built-ins.
 *
 * Usage:
 *   npm run ai:serve
 *
 * Then open http://localhost:3001 in your browser.
 * The "Analyse with AI Now" and "↺ Re-analyse" buttons will trigger agents in
 * real-time and auto-refresh the report page when the run completes.
 *
 * Environment:
 *   AI_PORT  — override the default port 3001
 */

'use strict';

const http    = require('http');
const { spawn } = require('child_process');
const fs      = require('fs');
const path    = require('path');

const PORT        = parseInt(process.env.AI_PORT ?? '3001', 10);
const ROOT        = path.join(__dirname, '..');
const REPORT_HTML = path.join(ROOT, 'ai-outputs', 'ai-report.html');

// ── Active job state ──────────────────────────────────────────────────────────
// null when idle. While running:
//   clients  — Set of SSE response objects currently listening
//   logs     — buffered SSE payloads (so late-connecting clients see the full history)
//   done     — true once the child process has exited
let activeJob = null;

function broadcast(job, payload) {
  const msg = `data: ${JSON.stringify(payload)}\n\n`;
  job.logs.push(msg);
  job.clients.forEach(c => { try { c.write(msg); } catch (_) {} });
}

// ── Run a pipeline ────────────────────────────────────────────────────────────
function runPipeline(pivotDate) {
  const job = { clients: new Set(), logs: [], done: false };
  activeJob = job;

  broadcast(job, { type: 'start', pivotDate: pivotDate || null });

  // When pivotDate is provided, only re-run regression + report (not all agents).
  // When absent, run the full pipeline (ai:full already ends with ai:report).
  const args = pivotDate
    ? ['run', 'ai:regression', '--', '--since', pivotDate]
    : ['run', 'ai:full'];

  const proc = spawn('npm', args, {
    shell: true,
    cwd: ROOT,
    env: process.env,
  });

  function onData(chunk) {
    broadcast(job, { type: 'log', text: chunk.toString() });
  }

  proc.stdout.on('data', onData);
  proc.stderr.on('data', onData);

  proc.on('close', code => {
    if (pivotDate && code === 0) {
      // Pivot-only run: regenerate the HTML report afterwards
      const reportProc = spawn('npm', ['run', 'ai:report'], {
        shell: true, cwd: ROOT, env: process.env,
      });
      reportProc.stdout.on('data', onData);
      reportProc.stderr.on('data', onData);
      reportProc.on('close', rCode => {
        job.done = true;
        broadcast(job, { type: 'done', exitCode: rCode });
        activeJob = null;
      });
    } else {
      job.done = true;
      broadcast(job, { type: 'done', exitCode: code });
      activeJob = null;
    }
  });
}

// ── HTTP server ───────────────────────────────────────────────────────────────
const server = http.createServer((req, res) => {
  // CORS — allow the HTML to be opened from file:// or a different port
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

  const url = (req.url || '/').split('?')[0];

  // ── Serve report ──────────────────────────────────────────────────────────
  if (req.method === 'GET' && (url === '/' || url === '/index.html')) {
    try {
      const html = fs.readFileSync(REPORT_HTML, 'utf8');
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(html);
    } catch (_) {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end([
        '<html><body style="font-family:sans-serif;padding:2rem;color:#334155">',
        '<h2>Report not found</h2>',
        '<p>Run <code>npm run ai:full</code> first, then refresh this page.</p>',
        '</body></html>',
      ].join(''));
    }
    return;
  }

  // ── SSE stream ────────────────────────────────────────────────────────────
  if (req.method === 'GET' && url === '/api/ai/stream') {
    res.writeHead(200, {
      'Content-Type':  'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection':    'keep-alive',
    });

    // Keep-alive comment (prevents proxy timeouts)
    res.write(': connected\n\n');

    if (!activeJob) {
      res.write(`data: ${JSON.stringify({ type: 'idle' })}\n\n`);
      return;
    }

    // Replay buffered log lines for clients that connect after the job started
    activeJob.logs.forEach(l => { try { res.write(l); } catch (_) {} });

    if (activeJob.done) return;

    activeJob.clients.add(res);
    req.on('close', () => activeJob?.clients.delete(res));
    return;
  }

  // ── Trigger analysis ──────────────────────────────────────────────────────
  if (req.method === 'POST' && url === '/api/ai/analyse') {
    if (activeJob) {
      res.writeHead(409, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Analysis already running — connect to /api/ai/stream to follow progress' }));
      return;
    }

    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      let pivotDate = null;
      try { pivotDate = JSON.parse(body).pivotDate ?? null; } catch (_) {}

      // Respond immediately so the client can open the SSE connection
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true, pivotDate }));

      runPipeline(pivotDate);
    });
    return;
  }

  res.writeHead(404); res.end('Not found');
});

server.listen(PORT, () => {
  const url = `http://localhost:${PORT}`;
  console.log(`\n🚀  AI Report Server  →  ${url}`);
  console.log(`     Open ${url} in your browser to view the live dashboard.`);
  console.log(`     Click "Analyse with AI Now" to run agents in real-time.`);
  console.log(`     The page auto-reloads when analysis completes.\n`);
  console.log(`     Press Ctrl+C to stop.\n`);
});
