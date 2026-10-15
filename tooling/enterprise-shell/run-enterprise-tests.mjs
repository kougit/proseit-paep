#!/usr/bin/env node
/**
 * npm run test:enterprise: behaviour tests of the IB3 enterprise shell and its seams (platform connectivity, i18n,
 * observability) in real Chromium through the Angular unit-test builder (`ng test ui-lab` with these includes, the
 * same Vitest browser setup as test:components). Fails when no test ran or any test is skipped, and removes the
 * failure screenshots Vitest writes into the source tree.
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { findChrome } from '../design-system/browser.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
export const PACKAGES = ['packages/enterprise/src', 'packages/platform/src', 'packages/i18n/src', 'packages/observability/src'];
const chrome = findChrome();
console.log(`browser: ${chrome}`);
const ng = path.join(root, 'node_modules', '@angular', 'cli', 'bin', 'ng.js');
const include = PACKAGES.flatMap((d) => ['--include', `../../../${d}/**/*.spec.ts`]);
const r = spawnSync(process.execPath, [ng, 'test', 'ui-lab', ...include, ...process.argv.slice(2)], {
  cwd: root,
  env: { ...process.env, CHROME_BIN: chrome, CI: '1', NG_CLI_ANALYTICS: 'false' },
  encoding: 'utf8',
  maxBuffer: 256 * 1024 * 1024,
});
const out = `${r.stdout || ''}${r.stderr || ''}`;
process.stdout.write(out);

const clean = (dir) => {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) (e.name === '__screenshots__' ? fs.rmSync(p, { recursive: true, force: true }) : clean(p));
  }
};
for (const d of PACKAGES) if (fs.existsSync(path.join(root, d))) clean(path.join(root, d));
fs.rmSync(path.join(root, '.vitest-attachments'), { recursive: true, force: true });

const plain = out.replace(/\u001b\[[0-9;]*m/g, '');
const tests = /Tests\s+(\d+) passed(?: \((\d+)\))?/.exec(plain);
const failed = /Tests\s+.*?(\d+) failed/.exec(plain);
const files = /Test Files\s+(\d+) passed/.exec(plain);
if (r.status !== 0 || failed || !tests || Number(tests[1]) === 0) {
  console.error(`enterprise tests: FAIL (exit ${r.status}${failed ? `, ${failed[1]} failed` : ''}${!tests ? ', no passing test summary' : ''})`);
  process.exit(1);
}
if (/\b(skipped|todo)\b/.test(/Tests\s+[^\n]*/.exec(plain)?.[0] || '')) {
  console.error('enterprise tests: FAIL (skipped or todo tests reported)');
  process.exit(1);
}
if (/packages\/(foundation|components)\//.test(plain.split('\n').filter((l) => /✓|PASS|\.spec\.ts/.test(l)).join('\n'))) {
  console.error('enterprise tests: FAIL (foundation or component specs ran; they belong to test:components)');
  process.exit(1);
}
console.log(`enterprise tests: PASS (${tests[1]} tests in ${files ? files[1] : '?'} files)`);
