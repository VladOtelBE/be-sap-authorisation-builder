#!/usr/bin/env node
/**
 * Parse an S/4HANA authorisation matrix workbook (read-only).
 *
 * Usage:
 *   node scripts/parse-matrix.mjs <matrix.xlsx> --list
 *   node scripts/parse-matrix.mjs <matrix.xlsx> --profile "<Business Profile>" [--out file.json]
 *
 * Columns are located by header text (trimmed, case-insensitive), not fixed positions.
 * The workbook is copied to a temp file first, so it can be parsed while open in Excel.
 */
import ExcelJS from 'exceljs';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const args = process.argv.slice(2);
const file = args.find((a) => !a.startsWith('--') && /\.xlsx$/i.test(a));
const flag = (n) => args.includes(`--${n}`);
const opt = (n) => { const i = args.indexOf(`--${n}`); return i >= 0 ? args[i + 1] : undefined; };

if (!file) {
  console.error('Usage: parse-matrix.mjs <matrix.xlsx> (--list | --profile "<name>" [--out f.json])');
  process.exit(1);
}

const norm = (v) => String(v ?? '').replace(/\s+/g, ' ').trim();
const key = (v) => norm(v).toLowerCase();

function cellText(cell) {
  const v = cell?.value;
  if (v == null) return '';
  if (typeof v === 'object') {
    if (v.richText) return v.richText.map((r) => r.text).join('');
    if (v.text != null) return String(v.text);
    if (v.result != null) return String(v.result);
    if (v instanceof Date) return v.toISOString().slice(0, 10);
  }
  return String(v);
}

async function load(f) {
  const tmp = path.join(os.tmpdir(), `matrix-${process.pid}-${Date.now()}.xlsx`);
  fs.copyFileSync(f, tmp);
  const wb = new ExcelJS.Workbook();
  try { await wb.xlsx.readFile(tmp); } finally { fs.rmSync(tmp, { force: true }); }
  return wb;
}

function findSheet(wb, ...names) {
  for (const n of names) {
    const ws = wb.worksheets.find((w) => key(w.name) === key(n));
    if (ws) return ws;
  }
  for (const n of names) {
    const ws = wb.worksheets.find((w) => key(w.name).includes(key(n)));
    if (ws) return ws;
  }
  return undefined;
}

/** Find the header row containing all required labels (matched as "startsWith"). */
function findHeader(ws, required, maxScan = 15) {
  for (let r = 1; r <= Math.min(maxScan, ws.rowCount); r++) {
    const row = ws.getRow(r);
    const cols = {};
    row.eachCell({ includeEmpty: false }, (c, col) => { cols[col] = norm(cellText(c)); });
    const found = {};
    for (const req of required) {
      const hit = Object.entries(cols).find(([, t]) => key(t).startsWith(key(req)));
      if (hit) found[req] = Number(hit[0]);
    }
    if (Object.keys(found).length === required.length) return { rowNumber: r, cols, found };
  }
  return undefined;
}

function readProfiles(wb) {
  const ws = findSheet(wb, 'Business Profile List');
  if (!ws) throw new Error('Sheet "Business Profile List" not found');
  const h = findHeader(ws, ['Business Profile', 'Derivation by']);
  if (!h) throw new Error('Header row with "Business Profile" / "Derivation by" not found');
  const colOf = (label) => {
    const e = Object.entries(h.cols).find(([, t]) => key(t).startsWith(key(label)));
    return e ? Number(e[0]) : undefined;
  };
  const c = {
    pilot: colOf('Pilot'), domain: colOf('Domain'), profile: colOf('Business Profile'),
    derivation: colOf('Derivation by'), comments: colOf('Comments'),
  };
  const out = [];
  for (let r = h.rowNumber + 1; r <= ws.rowCount; r++) {
    const row = ws.getRow(r);
    const name = norm(cellText(row.getCell(c.profile)));
    if (!name) continue;
    out.push({
      sheetRow: r,
      pilot: c.pilot ? norm(cellText(row.getCell(c.pilot))) : '',
      domain: c.domain ? norm(cellText(row.getCell(c.domain))) : '',
      businessProfile: name,
      derivationBy: c.derivation ? cellText(row.getCell(c.derivation)).trim() : '',
      comments: c.comments ? cellText(row.getCell(c.comments)).trim() : '',
    });
  }
  return out;
}

function readTiles(wb, profiles) {
  const ws = findSheet(wb, 'Fiori Tile List');
  if (!ws) throw new Error('Sheet "Fiori Tile List" not found');
  const h = findHeader(ws, ['BPML L1', 'BPML L2', 'Fiori Tile ID']);
  if (!h) throw new Error('Header row with BPML L1 / BPML L2 / Fiori Tile ID not found');
  const colOf = (label) => {
    const e = Object.entries(h.cols).find(([, t]) => key(t).startsWith(key(label)));
    return e ? Number(e[0]) : undefined;
  };
  const c = {
    num: colOf('#'), l1: colOf('BPML L1'), l2: colOf('BPML L2'),
    id: colOf('Fiori Tile ID'), comment: colOf('Comment'),
  };
  const profileCols = {};
  for (const p of profiles) {
    const e = Object.entries(h.cols).find(([, t]) => key(t) === key(p.businessProfile));
    if (e) profileCols[p.businessProfile] = Number(e[0]);
  }
  const rows = [];
  for (let r = h.rowNumber + 1; r <= ws.rowCount; r++) {
    const row = ws.getRow(r);
    const id = norm(cellText(row.getCell(c.id)));
    if (!id) continue;
    const access = {};
    for (const [p, col] of Object.entries(profileCols)) {
      const v = norm(cellText(row.getCell(col)));
      if (v) access[p] = v;
    }
    rows.push({
      sheetRow: r,
      num: c.num ? norm(cellText(row.getCell(c.num))) : '',
      bpmlL1: norm(cellText(row.getCell(c.l1))),
      bpmlL2: norm(cellText(row.getCell(c.l2))),
      entryId: id,
      comment: c.comment ? cellText(row.getCell(c.comment)).replace(/\s+/g, ' ').trim() : '',
      access,
    });
  }
  return { rows, profileCols, headerRow: h.rowNumber };
}

function classify(entryId) {
  if (/^F\d{3,5}[A-Z0-9_]*$/i.test(entryId)) return 'FIORI_APP_ID';
  if (/^[ZY]/i.test(entryId)) return 'CUSTOM';
  if (/^[A-Z0-9_/]{2,20}$/i.test(entryId)) return 'TCODE';
  return 'UNKNOWN';
}

const wb = await load(file);
const profiles = readProfiles(wb);
const tiles = readTiles(wb, profiles);

if (flag('list')) {
  const missing = profiles.filter((p) => !tiles.profileCols[p.businessProfile]);
  console.log(`Matrix: ${path.basename(file)} – ${profiles.length} profiles, ${tiles.rows.length} tile rows\n`);
  for (const p of profiles) {
    const n = tiles.rows.filter((r) => r.access[p.businessProfile]).length;
    console.log(`${String(p.sheetRow).padStart(3)} | ${p.domain.padEnd(28)} | ${p.businessProfile.padEnd(45)} | ${String(n).padStart(3)} entries`);
  }
  if (missing.length) console.log(`\nWARNING – profiles without a column in "Fiori Tile List": ${missing.map((m) => m.businessProfile).join(', ')}`);
  process.exit(0);
}

const wanted = opt('profile');
if (!wanted) { console.error('Missing --profile or --list'); process.exit(1); }
const prof = profiles.find((p) => key(p.businessProfile) === key(wanted));
if (!prof) {
  console.error(`Profile "${wanted}" not found. Available:\n- ${profiles.map((p) => p.businessProfile).join('\n- ')}`);
  process.exit(2);
}
const entries = tiles.rows
  .filter((r) => r.access[prof.businessProfile])
  .map((r) => ({
    matrixRow: r.sheetRow, num: r.num, bpmlL1: r.bpmlL1, bpmlL2: r.bpmlL2,
    entryId: r.entryId, entryType: classify(r.entryId), matrixComment: r.comment,
    accessType: r.access[prof.businessProfile],
  }));

const counts = entries.reduce((a, e) => { a[e.accessType] = (a[e.accessType] || 0) + 1; return a; }, {});
const result = {
  source: { file: path.basename(file), parsedAt: new Date().toISOString(), totalTileRows: tiles.rows.length },
  profile: prof,
  summary: { entries: entries.length, byAccessType: counts,
    byArea: entries.reduce((a, e) => { a[e.bpmlL2] = (a[e.bpmlL2] || 0) + 1; return a; }, {}) },
  entries,
};
const out = opt('out');
if (out) {
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, JSON.stringify(result, null, 2));
  console.log(`Written ${out}: ${entries.length} entries`, counts);
} else {
  console.log(JSON.stringify(result, null, 2));
}
