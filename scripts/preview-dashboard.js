/**
 * preview-dashboard.js
 * Run:  node scripts/preview-dashboard.js
 * Generates scripts/preview.html with mock data and opens it in the browser.
 */
'use strict';
const fs   = require('fs');
const path = require('path');
const { execSync, exec } = require('child_process');

function daysAgo(n, hh='08', mm='00', ss='00') {
  const d = new Date();
  d.setDate(d.getDate() - n);
  const yyyy = d.getFullYear();
  const mo   = String(d.getMonth()+1).padStart(2,'0');
  const dd   = String(d.getDate()).padStart(2,'0');
  return `${yyyy}-${mo}-${dd}_${hh}-${mm}-${ss}`;
}

function humanTime(s) {
  const h = Math.floor(s/3600), m = Math.floor((s%3600)/60), sec = s%60;
  const p = [];
  if (h)            p.push(`${h} hr${h>1?'s':''}`);
  if (m)            p.push(`${m} min${m>1?'s':''}`);
  if (sec||!p.length) p.push(`${sec} sec${sec!==1?'s':''}`);
  return p.join(' ');
}

const historySeeds = [
  { n:28, executed:42, passed:42, failed:0, flaky:0, sec:540, env:'UAT'     },
  { n:26, executed:42, passed:40, failed:2, flaky:0, sec:570, env:'UAT'     },
  { n:24, executed:43, passed:41, failed:1, flaky:1, sec:610, env:'STAGING' },
  { n:21, executed:43, passed:43, failed:0, flaky:0, sec:490, env:'UAT'     },
  { n:18, executed:44, passed:42, failed:2, flaky:0, sec:620, env:'UAT'     },
  { n:15, executed:44, passed:44, failed:0, flaky:0, sec:505, env:'UAT'     },
  { n:12, executed:45, passed:43, failed:1, flaky:1, sec:590, env:'STAGING' },
  { n: 9, executed:45, passed:45, failed:0, flaky:0, sec:480, env:'UAT'     },
  { n: 7, executed:46, passed:44, failed:2, flaky:0, sec:640, env:'UAT'     },
  { n: 5, executed:46, passed:46, failed:0, flaky:0, sec:500, env:'UAT'     },
  { n: 4, executed:47, passed:45, failed:1, flaky:1, sec:605, env:'STAGING' },
  { n: 3, executed:47, passed:47, failed:0, flaky:0, sec:492, env:'UAT'     },
  { n: 1, executed:48, passed:46, failed:2, flaky:0, sec:655, env:'UAT'     },
  { n: 0, executed:48, passed:48, failed:0, flaky:0, sec:510, env:'UAT'     },
];

const consolidated = {
  runs: historySeeds.map(r => ({
    timestamp: daysAgo(r.n,'08','00','00'), environment: r.env,
    counts: { executed:r.executed, passed:r.passed, failed:r.failed, flaky:r.flaky },
    executionTimeSec: r.sec,
  })),
};

const rowSeeds = [
  { n: 0, hh:'08',mm:'15',ss:'22', status:'Passed', env:'UAT',     totalSec:510, s1:492, s2:510 },
  { n: 1, hh:'08',mm:'10',ss:'05', status:'Failed', env:'UAT',     totalSec:655, s1:620, s2:655 },
  { n: 3, hh:'08',mm:'12',ss:'44', status:'Passed', env:'UAT',     totalSec:492, s1:470, s2:492 },
  { n: 4, hh:'08',mm:'09',ss:'17', status:'Failed', env:'STAGING', totalSec:605, s1:590, s2:605 },
  { n: 5, hh:'08',mm:'14',ss:'33', status:'Passed', env:'UAT',     totalSec:500, s1:488, s2:500 },
  { n: 7, hh:'08',mm:'11',ss:'58', status:'Failed', env:'UAT',     totalSec:640, s1:615, s2:640 },
  { n: 9, hh:'08',mm:'08',ss:'02', status:'Passed', env:'UAT',     totalSec:480, s1:465, s2:480 },
  { n:12, hh:'08',mm:'16',ss:'41', status:'Failed', env:'STAGING', totalSec:590, s1:572, s2:590 },
  { n:15, hh:'08',mm:'07',ss:'29', status:'Passed', env:'UAT',     totalSec:505, s1:490, s2:505 },
  { n:18, hh:'08',mm:'13',ss:'11', status:'Failed', env:'UAT',     totalSec:620, s1:600, s2:620 },
  { n:21, hh:'08',mm:'10',ss:'55', status:'Passed', env:'UAT',     totalSec:490, s1:478, s2:490 },
  { n:24, hh:'08',mm:'09',ss:'37', status:'Failed', env:'STAGING', totalSec:610, s1:598, s2:610 },
  { n:26, hh:'08',mm:'08',ss:'50', status:'Failed', env:'UAT',     totalSec:570, s1:555, s2:570 },
  { n:28, hh:'08',mm:'11',ss:'03', status:'Passed', env:'UAT',     totalSec:540, s1:525, s2:540 },
];

const rows = rowSeeds.map(r => {
  const ts = daysAgo(r.n, r.hh, r.mm, r.ss);
  return {
    date: ts.split('_')[0], time: ts.split('_')[1].replace(/-/g,':'),
    link: '#', status: r.status, environment: r.env,
    execTime: humanTime(r.totalSec),
    shardTimes: [{ shard:1, label:humanTime(r.s1) }, { shard:2, label:humanTime(r.s2) }],
  };
});

const tmpDir  = path.join(__dirname, '.preview-tmp');
const conPath = path.join(tmpDir, 'consolidated.json');
const rowPath = path.join(tmpDir, 'rows.json');
const outPath = path.join(__dirname, 'preview.html');
const genPath = path.join(__dirname, 'generate-dashboard.js');

fs.mkdirSync(tmpDir, { recursive: true });
fs.writeFileSync(conPath, JSON.stringify(consolidated, null, 2));
fs.writeFileSync(rowPath, JSON.stringify(rows, null, 2));

console.log('Generating dashboard...');
try {
  execSync(`node "${genPath}" "${conPath}" "${rowPath}" "${outPath}"`, { stdio: 'inherit' });
} catch(e) { console.error('Generator failed:', e.message); process.exit(1); }

console.log(`\nPreview ready: ${outPath}`);
const openCmd = process.platform === 'win32'
  ? `start "" "${outPath}"`
  : process.platform === 'darwin' ? `open "${outPath}"` : `xdg-open "${outPath}"`;
exec(openCmd, err => { if (err) console.warn('Open manually:', outPath); });
