#!/usr/bin/env node
/**
 * Session state helper for the guided workflow (state/session.json, git-ignored).
 * Lets the orchestrator resume where the user stopped ("let's work" the next day).
 *
 *   node scripts/session.mjs show
 *   node scripts/session.mjs start  --profile "MDM Central - HQ Level" --key MDM_HQ --perimeter COM1
 *   node scripts/session.mjs phase  --phase ANALYSE|CHECKPOINT1|BUILD|CHECKPOINT2|TEST|CHECKPOINT3|DONE [--note "..."]
 *   node scripts/session.mjs note   --note "free text"
 *   node scripts/session.mjs config --set naming.prefix=Z_ABC_BEMIND --set testUser.id=Z_ABC_BM_T1
 *        (writes the personal overlay config/local.json - never passwords)
 *   node scripts/session.mjs reset
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const file = path.join(root, 'state', 'session.json');
const localFile = path.join(root, 'config', 'local.json');
const args = process.argv.slice(2);
const cmd = args[0];
const opt = (n) => { const i = args.indexOf(`--${n}`); return i >= 0 ? args[i + 1] : undefined; };
const opts = (n) => args.flatMap((a, i) => (a === `--${n}` ? [args[i + 1]] : []));
const PHASES = ['INTAKE', 'ANALYSE', 'CHECKPOINT1', 'BUILD', 'CHECKPOINT2', 'TEST', 'CHECKPOINT3', 'DONE'];

const load = () => (fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : null);
const save = (s) => { fs.mkdirSync(path.dirname(file), { recursive: true }); s.updatedAt = new Date().toISOString(); fs.writeFileSync(file, JSON.stringify(s, null, 2)); return s; };

let s = load();
switch (cmd) {
  case 'show': break;
  case 'start':
    s = save({ profile: opt('profile'), key: opt('key'), perimeter: opt('perimeter') || null, phase: 'INTAKE',
      startedAt: new Date().toISOString(), history: [{ at: new Date().toISOString(), phase: 'INTAKE' }], notes: [] });
    break;
  case 'phase': {
    if (!s) { console.error('No session. Run start first.'); process.exit(1); }
    const ph = opt('phase');
    if (!PHASES.includes(ph)) { console.error(`Unknown phase. Use one of ${PHASES.join(', ')}`); process.exit(1); }
    s.phase = ph; s.history.push({ at: new Date().toISOString(), phase: ph, note: opt('note') });
    save(s); break;
  }
  case 'note':
    if (!s) { console.error('No session.'); process.exit(1); }
    s.notes.push({ at: new Date().toISOString(), note: opt('note') }); save(s); break;
  case 'config': {
    const local = fs.existsSync(localFile) ? JSON.parse(fs.readFileSync(localFile, 'utf8')) : {};
    for (const kv of opts('set')) {
      const [k, ...rest] = kv.split('='); const v = rest.join('=');
      if (/pass|pwd|secret|token/i.test(k)) { console.error(`Refused: ${k} looks like a secret.`); process.exit(2); }
      const parts = k.split('.'); let o = local;
      parts.slice(0, -1).forEach((pp) => { o[pp] = o[pp] || {}; o = o[pp]; });
      o[parts.at(-1)] = v === '' ? '' : v;
    }
    fs.writeFileSync(localFile, JSON.stringify(local, null, 2));
    console.log(JSON.stringify({ localConfig: local }, null, 2));
    process.exit(0);
  }
  case 'reset':
    if (fs.existsSync(file)) fs.rmSync(file); s = null; break;
  default:
    console.error('Commands: show | start | phase | note | config | reset'); process.exit(1);
}
console.log(JSON.stringify({ session: s }, null, 2));
