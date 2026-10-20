#!/usr/bin/env node
/**
 * Build the test report (D4) from test-results.json (schema: flp-tile-testing skill).
 * Usage: node scripts/build-test-report.mjs output/<KEY>/<KEY>_test-results.json
 * Writes <KEY>_TestReport.xlsx and <KEY>_TestReport.md next to the input.
 */
import ExcelJS from 'exceljs';
import fs from 'node:fs';
import path from 'node:path';
import { addTable, fill, COLORS } from './lib/xlsx-style.mjs';

const file = process.argv[2];
if (!file) { console.error('Usage: build-test-report.mjs <test-results.json>'); process.exit(1); }
const t = JSON.parse(fs.readFileSync(file, 'utf8'));
const dir = path.dirname(file);
const base = path.join(dir, `${t.profileKey}_TestReport`);
const res = t.results || [];
const count = (s) => res.filter((r) => r.status === s).length;
const summary = { total: res.length, pass: count('PASS'), partial: count('PARTIAL'), fail: count('FAIL') };

// Excel
const wb = new ExcelJS.Workbook();
const ov = wb.addWorksheet('Summary');
ov.columns = [{ width: 24 }, { width: 70 }];
[['Profile', t.profileKey], ['Role(s)', t.role], ['Test user', t.user], ['System', t.system],
  ['Started', t.startedAt], ['Finished', t.finishedAt], ['Tiles tested', summary.total],
  ['PASS', summary.pass], ['PARTIAL', summary.partial], ['FAIL', summary.fail]]
  .forEach((r) => { const row = ov.addRow(r); row.getCell(1).font = { bold: true }; });

const ws = wb.addWorksheet('Results');
addTable(ws, [
  { header: 'Page', key: 'page', width: 24 }, { header: 'Section', key: 'section', width: 18 },
  { header: 'Tile', key: 'tileTitle', width: 32 }, { header: 'Matrix ID', key: 'entryId', width: 10 },
  { header: 'Type', key: 'tileType', width: 9 }, { header: 'Presence', key: 'presence', width: 9 },
  { header: 'Opens', key: 'open', width: 9 }, { header: 'Navigation checks', key: 'nav', width: 50 },
  { header: 'Status', key: 'status', width: 9 }, { header: 'Error', key: 'error', width: 50 },
  { header: 'Evidence', key: 'evidence', width: 30 }, { header: 'Proposed fix', key: 'proposedFix', width: 50 },
], res.map((r) => ({ ...r, nav: (r.navigation || []).map((n) => `${n.result} – ${n.control}${n.note ? ' (' + n.note + ')' : ''}`).join('\n') })));
ws.eachRow((row, i) => {
  if (i === 1) return;
  for (const k of ['presence', 'open', 'status']) {
    const v = row.getCell(k).value;
    if (v === 'PASS') fill(row.getCell(k), COLORS.pass);
    else if (v === 'FAIL') fill(row.getCell(k), COLORS.fail);
    else if (v === 'PARTIAL' || v === 'SKIPPED') fill(row.getCell(k), COLORS.warn);
  }
});
await wb.xlsx.writeFile(`${base}.xlsx`);

// Markdown
const md = [
  `# Test report – ${t.profileKey}`, '',
  `Role(s): \`${t.role}\` · User: \`${t.user}\` · System: ${t.system} · ${t.startedAt} → ${t.finishedAt}`, '',
  `**${summary.total} tiles – ${summary.pass} PASS / ${summary.partial} PARTIAL / ${summary.fail} FAIL**`, '',
  '| Page | Tile | ID | Type | Opens | Nav | Status | Error / fix |', '|---|---|---|---|---|---|---|---|',
  ...res.map((r) => {
    const nav = (r.navigation || []);
    const navTxt = nav.length ? `${nav.filter((n) => n.result === 'PASS').length}/${nav.length}` : '-';
    return `| ${r.page} | ${r.tileTitle} | ${r.entryId} | ${r.tileType} | ${r.open} | ${navTxt} | ${r.status} | ${[r.error, r.proposedFix].filter(Boolean).join(' → ').replace(/\|/g, '/')} |`;
  }),
].join('\n');
fs.writeFileSync(`${base}.md`, md);
console.log(`Report written: ${base}.xlsx / .md`, summary);
