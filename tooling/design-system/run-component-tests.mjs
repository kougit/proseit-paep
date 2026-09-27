#!/usr/bin/env node
/**
 * npm run test:components: foundation and component behaviour tests in real Chromium through the Angular
 * unit-test builder (Vitest browser mode, `ng test ui-lab`). Uses the installed browser (browser.mjs), fails
 * when no test ran, and removes the failure screenshots Vitest writes into the source tree.
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { findChrome } from './browser.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const chrome = findChrome();
console.log(`browser: ${chrome}`);
const ng = path.join(root, 'node_modules', '@angular', 'cli', 'bin', 'ng.js');
const r = spawnSync(process.execPath, [ng, 'test', 'ui-lab', ...process.argv.slice(2)], {
  cwd: root,
  env: { ...process.env, CHROME_BIN: chrome, CI: '1', NG_CLI_ANALYTICS: 'false' },
  encoding: 'utf8',
  maxBuffer: 256 * 1024 * 1024,
});
const out = `${r.stdout || ''}${r.stderr || ''}`;
process.stdout.write(out);

// Vitest browser mode writes failure screenshots next to specs and attachments at the root; they are never evidence.
const clean = (dir) => {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) (e.name === '__screenshots__' ? fs.rmSync(p, { recursive: true, force: true }) : clean(p));
  }
};
for (const d of ['packages/foundation/src', 'packages/components/src']) if (fs.existsSync(path.join(root, d))) clean(path.join(root, d));
fs.rmSync(path.join(root, '.vitest-attachments'), { recursive: true, force: true });

const plain = out.replace(/\u001b\[[0-9;]*m/g, '');
const tests = /Tests\s+(\d+) passed(?: \((\d+)\))?/.exec(plain);
const failed = /Tests\s+.*?(\d+) failed/.exec(plain);
if (r.status !== 0 || failed || !tests || Number(tests[1]) === 0) {
  console.error(`component tests: FAIL (exit ${r.status}${failed ? `, ${failed[1]} failed` : ''}${!tests ? ', no passing test summary' : ''})`);
  process.exit(1);
}
if (/\b(skipped|todo)\b/.test(/Tests\s+[^\n]*/.exec(plain)?.[0] || '')) {
  console.error('component tests: FAIL (skipped or todo tests reported)');
  process.exit(1);
}
console.log(`component tests: PASS (${tests[1]} tests)`);
