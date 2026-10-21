// Loads config/project.json and deep-merges the personal overlay config/local.json (git-ignored).
// Every agent / script must use the MERGED config.
import fs from 'node:fs';
import path from 'node:path';

const isObj = (v) => v && typeof v === 'object' && !Array.isArray(v);
export function deepMerge(a, b) {
  const out = { ...a };
  for (const [k, v] of Object.entries(b || {})) out[k] = isObj(v) && isObj(a?.[k]) ? deepMerge(a[k], v) : v;
  return out;
}

export function loadConfig(root) {
  const base = JSON.parse(fs.readFileSync(path.join(root, 'config', 'project.json'), 'utf8'));
  const localFile = path.join(root, 'config', 'local.json');
  const local = fs.existsSync(localFile) ? JSON.parse(fs.readFileSync(localFile, 'utf8')) : {};
  return deepMerge(base, local);
}
