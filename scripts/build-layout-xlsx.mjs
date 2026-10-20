#!/usr/bin/env node
/**
 * Build the end-user layout proposition (D1) from a design.json (D2).
 * Usage: node scripts/build-layout-xlsx.mjs output/<KEY>/<KEY>_design.json [--out file.xlsx]
 */
import ExcelJS from 'exceljs';
import fs from 'node:fs';
import path from 'node:path';
import { addTable, fill, COLORS } from './lib/xlsx-style.mjs';

const args = process.argv.slice(2);
const designFile = args.find((a) => a.endsWith('.json'));
if (!designFile) { console.error('Usage: build-layout-xlsx.mjs <design.json> [--out file.xlsx]'); process.exit(1); }
const oi = args.indexOf('--out');
const d = JSON.parse(fs.readFileSync(designFile, 'utf8'));
const out = oi >= 0 ? args[oi + 1] : path.join(path.dirname(designFile), `${d.profileKey}_Layout.xlsx`);

const tileByRef = Object.fromEntries((d.tiles || []).map((t) => [t.ref, t]));
const wb = new ExcelJS.Workbook();
wb.creator = 'be-sap-authorisation-builder';
wb.created = new Date();

// 1. Overview
{
  const ws = wb.addWorksheet('Overview');
  const placed = new Set(d.pages.flatMap((p) => p.sections.flatMap((s) => s.tiles)));
  const rows = [
    ['Business Profile', d.businessProfile],
    ['Profile key', d.profileKey],
    ['Domain (BPML L1)', d.domain],
    ['Derivation by (matrix)', d.derivationBy],
    ['Matrix comment', d.matrixComment],
    ['Source matrix', d.source?.matrixFile],
    ['Target system', d.source?.system],
    ['Design status', d.status],
    ['Space', `${d.space.title}  [${d.space.technicalName}]`],
    ['Pages', d.pages.length],
    ['Tiles (matrix entries)', d.tiles.length],
    ['Tiles placed on pages', placed.size],
    ['Fiori tiles', d.tiles.filter((t) => t.tileType === 'FIORI').length],
    ['WebGUI tiles', d.tiles.filter((t) => t.tileType === 'WEBGUI').length],
    ['Roles', d.roles.map((r) => r.name).join(', ')],
    ['Open gaps / questions', (d.gaps || []).length],
    ['Generated', new Date().toISOString()],
  ];
  ws.columns = [{ width: 28 }, { width: 100 }];
  ws.addRow(['End-user layout proposition', '']).font = { bold: true, size: 14 };
  ws.addRow([]);
  for (const r of rows) { const row = ws.addRow(r); row.getCell(1).font = { bold: true }; row.alignment = { wrapText: true, vertical: 'top' }; }
}

// 2. Spaces & Pages
{
  const ws = wb.addWorksheet('Spaces & Pages');
  const rows = [];
  for (const p of [...d.pages].sort((a, b) => a.order - b.order)) {
    p.sections.forEach((s, si) => rows.push({
      spaceTech: d.space.technicalName, spaceTitle: d.space.title,
      order: p.order, pageTech: p.technicalName, pageTitle: p.title, bpml: p.bpmlL2,
      section: s.title, sectionOrder: si + 1, tiles: s.tiles.length,
    }));
  }
  addTable(ws, [
    { header: 'Space – technical name', key: 'spaceTech', width: 28 },
    { header: 'Space – end-user name', key: 'spaceTitle', width: 26 },
    { header: 'Page order', key: 'order', width: 8 },
    { header: 'Page – technical name', key: 'pageTech', width: 32 },
    { header: 'Page – end-user name', key: 'pageTitle', width: 34 },
    { header: 'Process area (BPML L2)', key: 'bpml', width: 40 },
    { header: 'Section (end-user)', key: 'section', width: 22 },
    { header: 'Section order', key: 'sectionOrder', width: 9 },
    { header: '# Tiles', key: 'tiles', width: 8 },
  ], rows);
}

// 3. Tiles
{
  const ws = wb.addWorksheet('Tiles');
  const rows = [];
  for (const p of [...d.pages].sort((a, b) => a.order - b.order)) {
    p.sections.forEach((s) => s.tiles.forEach((ref, i) => {
      const t = tileByRef[ref] || { ref, title: `!! unknown ref ${ref}` };
      rows.push({
        page: p.title, pageTech: p.technicalName, section: s.title, pos: i + 1,
        title: t.title, entryId: t.entryId, tileType: t.tileType,
        intent: t.semanticObject ? `${t.semanticObject}-${t.semanticAction}` : '',
        appType: t.appType, techCat: t.technicalCatalog ? `${t.technicalCatalog}${t.scope ? ' (' + t.scope + ')' : ''}` : '',
        busCat: t.businessCatalog || (t.needsCustomCatalog ? '→ custom catalog' : ''),
        access: t.accessType, actvt: (t.actvt || []).join(', '),
        matrixRow: t.matrixRow, comment: t.matrixComment, rationale: t.mappingRationale, source: t.source,
      });
    }));
  }
  addTable(ws, [
    { header: 'Page (end-user)', key: 'page', width: 24 },
    { header: 'Page – technical', key: 'pageTech', width: 30 },
    { header: 'Section', key: 'section', width: 18 },
    { header: 'Pos', key: 'pos', width: 5 },
    { header: 'Tile title (end-user)', key: 'title', width: 32 },
    { header: 'Matrix ID', key: 'entryId', width: 10 },
    { header: 'Tile type', key: 'tileType', width: 10 },
    { header: 'Intent (SemObj-Action)', key: 'intent', width: 30 },
    { header: 'App type', key: 'appType', width: 9 },
    { header: 'Technical catalog (scope)', key: 'techCat', width: 34 },
    { header: 'Business catalog', key: 'busCat', width: 28 },
    { header: 'Access type (matrix)', key: 'access', width: 22 },
    { header: 'ACTVT', key: 'actvt', width: 14 },
    { header: 'Matrix row', key: 'matrixRow', width: 8 },
    { header: 'Matrix comment', key: 'comment', width: 50 },
    { header: 'Mapping rationale', key: 'rationale', width: 50 },
    { header: 'Source (system)', key: 'source', width: 50 },
  ], rows);
  ws.eachRow((row, i) => {
    if (i === 1) return;
    const type = row.getCell('tileType').value;
    fill(row.getCell('tileType'), type === 'FIORI' ? COLORS.fiori : COLORS.webgui);
  });
}

// 4. Roles
{
  const ws = wb.addWorksheet('Roles');
  const rows = d.roles.map((r) => ({
    name: r.name, type: r.type, parent: r.parent || '', perimeter: r.perimeter || 'All (*)',
    org: Object.entries(r.orgLevels || {}).map(([k, v]) => `${k} = ${v.join(', ')}`).join('\n'),
    desc: r.description || '', just: r.justification || '',
  }));
  addTable(ws, [
    { header: 'Role', key: 'name', width: 30 }, { header: 'Type', key: 'type', width: 10 },
    { header: 'Parent (master)', key: 'parent', width: 28 }, { header: 'Perimeter', key: 'perimeter', width: 24 },
    { header: 'Org levels', key: 'org', width: 50 }, { header: 'Description', key: 'desc', width: 40 },
    { header: 'Justification', key: 'just', width: 60 },
  ], rows);
}

// 5. Gaps & Open Points
{
  const ws = wb.addWorksheet('Gaps & Open Points');
  addTable(ws, [
    { header: '#', key: 'n', width: 5 }, { header: 'Entry', key: 'entryId', width: 12 },
    { header: 'Type', key: 'type', width: 14 }, { header: 'Detail', key: 'detail', width: 70 },
    { header: 'Question / decision needed', key: 'question', width: 60 },
  ], (d.gaps || []).map((g, i) => ({ n: i + 1, ...g })));
  ws.eachRow((row, i) => { if (i > 1) fill(row.getCell('type'), COLORS.warn); });
}

fs.mkdirSync(path.dirname(out), { recursive: true });
await wb.xlsx.writeFile(out);
console.log(`Layout written: ${out}`);
