#!/usr/bin/env node
/**
 * Preflight check for the guided session ("let's work").
 * Prints ONE JSON object the orchestrator reads to decide what to ask the user next.
 * Read-only except: creates state/ folder if missing. Never reads or prints secrets.
 *
 * Usage: node scripts/preflight.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { loadConfig } from './lib/config.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const p = (...x) => path.join(root, ...x);
const sh = (cmd) => { try { return execSync(cmd, { cwd: root, stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim(); } catch { return null; } };

const out = { ok: true, checks: {}, todo: [] };
const fail = (key, msg) => { out.ok = false; out.todo.push({ key, msg }); };

// Node + dependencies
const major = Number(process.versions.node.split('.')[0]);
out.checks.node = { version: process.versions.node, ok: major >= 20 };
if (major < 20) fail('node', 'Node.js >= 20 required');
out.checks.dependencies = { ok: fs.existsSync(p('node_modules', 'exceljs')) };
if (!out.checks.dependencies.ok) fail('dependencies', 'Run: npm.cmd install (Windows) / npm install');

// Git
out.checks.git = {
  branch: sh('git rev-parse --abbrev-ref HEAD'),
  behind: (() => { sh('git fetch -q'); const b = sh('git rev-list --count HEAD..@{u}'); return b == null ? null : Number(b); })(),
  dirtyFiles: (sh('git status --porcelain') || '').split('\n').filter(Boolean).length,
  userName: sh('git config user.name'),
};
if (out.checks.git.behind > 0) out.todo.push({ key: 'git', msg: `Repository is ${out.checks.git.behind} commit(s) behind origin -> git pull` });

// Matrix files
fs.mkdirSync(p('input'), { recursive: true });
const matrices = fs.readdirSync(p('input')).filter((f) => /\.xlsx$/i.test(f) && !f.startsWith('~$'));
out.checks.matrix = { files: matrices, ok: matrices.length > 0 };
if (!matrices.length) fail('matrix', 'Copy the authorisation matrix (.xlsx) into the input/ folder');

// Config (base + personal overlay)
let cfg;
try { cfg = loadConfig(root); } catch (e) { fail('config', 'config/project.json invalid: ' + e.message); }
const localExists = fs.existsSync(p('config', 'local.json'));
out.checks.config = cfg ? {
  localOverlay: localExists,
  operator: cfg.operator || null,
  system: `${cfg.system.sid}/${cfg.system.client}`,
  flpUrl: cfg.system.flpUrl,
  adtPrefix: cfg.system.adtMcpServerPrefix,
  namingPrefix: cfg.naming.prefix,
  testUser: cfg.testUser.id,
  flpRole: cfg.testUser.flpRole,
  workbenchRequest: cfg.transport.workbenchRequest || null,
  customizingRequest: cfg.transport.customizingRequest || null,
} : null;
if (cfg && !localExists) out.todo.push({ key: 'onboarding', msg: 'No personal settings yet (config/local.json) -> run onboarding' });

// Existing runs
const outDir = p('output');
out.checks.runs = fs.existsSync(outDir) ? fs.readdirSync(outDir).filter((d) => fs.statSync(path.join(outDir, d)).isDirectory()).map((d) => {
  const f = (s) => fs.existsSync(path.join(outDir, d, `${d}_${s}`));
  let status = null;
  try { status = JSON.parse(fs.readFileSync(path.join(outDir, d, `${d}_design.json`), 'utf8')).status; } catch { /* none */ }
  return { key: d, layout: f('Layout.xlsx'), design: f('design.json'), buildLog: f('build-log.md'), testReport: f('TestReport.xlsx'), status };
}) : [];

// Session state (resume)
fs.mkdirSync(p('state'), { recursive: true });
const sessFile = p('state', 'session.json');
out.checks.session = fs.existsSync(sessFile) ? JSON.parse(fs.readFileSync(sessFile, 'utf8')) : null;

console.log(JSON.stringify(out, null, 2));
