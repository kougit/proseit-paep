#!/usr/bin/env node
/**
 * PAEP IB0-WP03 negative tests.
 * Proves in a disposable scratch copy (never in the working tree) that:
 *   (i)  a TypeScript strict violation fails the production build, and builds
 *        only when strict/noImplicitAny are switched off (AC09);
 *   (ii) an Angular template strict violation fails the production build, and
 *        builds only when strictTemplates is switched off (AC10);
 *   (iii) the WP03 verifier (static checks) fails, naming the expected check,
 *        when any explicit control is removed or weakened (AC11).
 * The scratch copy includes .git (the verifier compares against the baseline)
 * and links node_modules from the repository. It is deleted afterwards.
 * Writes evidence/IB0-WP03/logs/negative-strictness.log,
 * evidence/IB0-WP03/logs/negative-verifier-mutations.log and
 * evidence/IB0-WP03/reports/negative-tests.json.
 */

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { spawnSync } from 'node:child_process';
import ts from 'typescript';

const root = process.cwd();
const logsDir = path.join(root, 'evidence', 'IB0-WP03', 'logs');
const reportsDir = path.join(root, 'evidence', 'IB0-WP03', 'reports');
fs.mkdirSync(logsDir, { recursive: true });
fs.mkdirSync(reportsDir, { recursive: true });

const scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'paep-wp03-negative-'));
const copy = path.join(scratch, 'repo');
const SKIP = new Set(['node_modules', 'dist', '.angular']);
fs.cpSync(root, copy, { recursive: true, filter: (src) => !SKIP.has(path.basename(src)) || path.dirname(src) !== root });
fs.symlinkSync(path.join(root, 'node_modules'), path.join(copy, 'node_modules'), process.platform === 'win32' ? 'junction' : 'dir');
// The linked node_modules is a symlink, which the repository's `/node_modules/` ignore rule does not match; exclude it locally in the copy.
fs.appendFileSync(path.join(copy, '.git', 'info', 'exclude'), '\n/node_modules\n');

const ngBin = path.join(root, 'node_modules', '@angular', 'cli', 'bin', 'ng.js');
const env = { ...process.env, NO_COLOR: '1', FORCE_COLOR: '0', NG_CLI_ANALYTICS: 'false' };
const exec = (args) => {
  const r = spawnSync(process.execPath, args, { cwd: copy, encoding: 'utf8', env, maxBuffer: 64 * 1024 * 1024 });
  return { status: r.status, out: `${r.stdout || ''}${r.stderr || ''}` };
};
const build = () => exec([ngBin, 'build', 'reference-app', '--configuration', 'production']);
const verify = () => exec([path.join(copy, 'tooling', 'verification', 'verify-ib0-wp03.mjs'), '--static-only']);

// Applies file edits for one case and returns a function restoring every touched file.
function mutate(edits) {
  const saved = new Map();
  for (const [file, fn] of edits) {
    const p = path.join(copy, file);
    if (!saved.has(p)) saved.set(p, fs.existsSync(p) ? fs.readFileSync(p) : null);
    const next = fn(fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : null);
    if (next === null) fs.rmSync(p); else fs.writeFileSync(p, next);
  }
  return () => { for (const [p, c] of saved) { if (c === null) fs.rmSync(p, { force: true }); else fs.writeFileSync(p, c); } };
}
const json = (fn) => (text) => {
  const r = ts.parseConfigFileTextToJson('config.json', text);
  const o = r.config;
  fn(o);
  return JSON.stringify(o, null, 2) + '\n';
};

const APP_TS = 'apps/reference-app/src/app/app.ts';
const APP_HTML = 'apps/reference-app/src/app/app.html';
const APP_TSCONFIG = 'apps/reference-app/tsconfig.app.json';
const TS_VIOLATION = (t) => `${t}\nexport function wp03NegativeTs(value) { const s: string = null; return s + value; }\n`;
const TEMPLATE_METHOD = (t) => t.replace(/\n}\s*$/, '\n  protected wp03Take(value: number): number { return value; }\n}\n');
const TEMPLATE_VIOLATION = (t) => t.replace('</main>', '  <button type="button" (click)="wp03Take($event)">x</button>\n</main>');

const results = [];
const strictLog = [];
const mutationLog = [];
const header = `# date: ${new Date().toISOString()} node: ${process.version} scratch: ${copy}`;

function buildCase(id, name, edits, expectFail, codes) {
  const restore = mutate(edits);
  const r = build();
  restore();
  const found = codes.filter((c) => r.out.includes(c));
  const pass = expectFail ? r.status !== 0 && found.length === codes.length : r.status === 0;
  results.push({ id, name, expected: expectFail ? `non-zero exit with ${codes.join(', ')}` : 'exit 0', exit: r.status, codesFound: found, pass });
  const errors = r.out.split(/\r?\n/).filter((l) => /TS\d{4}|ERROR|Output location|Application bundle generation/.test(l));
  strictLog.push(`## ${id} ${name}\nexpected: ${expectFail ? `non-zero, ${codes.join(', ')}` : 'exit 0'}\n${errors.join('\n')}\nEXIT_CODE=${r.status}\nRESULT=${pass ? 'PASS' : 'FAIL'}\n`);
}

function verifierCase(id, name, edits, expectedCheck) {
  const restore = edits.length ? mutate(edits) : () => {};
  const r = verify();
  restore();
  const failed = [...r.out.matchAll(/^FAIL (V\d+)/gm)].map((m) => m[1]);
  const pass = expectedCheck ? r.status !== 0 && failed.includes(expectedCheck) : r.status === 0 && failed.length === 0;
  results.push({ id, name, expected: expectedCheck ? `exit 1, ${expectedCheck} FAIL` : 'exit 0, all PASS', exit: r.status, failedChecks: failed, pass });
  const summary = r.out.split(/\r?\n/).filter((l) => /^FAIL|verification/.test(l));
  mutationLog.push(`## ${id} ${name}\nexpected: ${expectedCheck ? `exit 1, ${expectedCheck} FAIL` : 'exit 0'}\n${summary.join('\n')}\nEXIT_CODE=${r.status}\nRESULT=${pass ? 'PASS' : 'FAIL'}\n`);
}

try {
  // AC09 / AC10: strictness proven by production builds.
  buildCase('B0', 'positive control: unmodified reference-app builds', [], false, []);
  buildCase('B1', 'TypeScript strict violation fails the build', [[APP_TS, TS_VIOLATION]], true, ['TS7006', 'TS2322']);
  buildCase('B1c', 'control: same violation builds with strict and noImplicitAny false', [[APP_TS, TS_VIOLATION],
    ['tsconfig.json', json((o) => { o.compilerOptions.strict = false; o.compilerOptions.noImplicitAny = false; })]], false, []);
  buildCase('B2', 'Angular template strict violation fails the build', [[APP_TS, TEMPLATE_METHOD], [APP_HTML, TEMPLATE_VIOLATION]], true, ['TS2345']);
  buildCase('B2c', 'control: same violation builds with strictTemplates false', [[APP_TS, TEMPLATE_METHOD], [APP_HTML, TEMPLATE_VIOLATION],
    ['tsconfig.json', json((o) => { o.angularCompilerOptions.strictTemplates = false; })]], false, []);

  // AC11: the verifier detects removal or weakening of each explicit control.
  const root_ = (fn) => ['tsconfig.json', json(fn)];
  verifierCase('M0', 'positive control: unmutated copy passes', [], null);
  verifierCase('M1', '"strict" removed', [root_((o) => { delete o.compilerOptions.strict; })], 'V01');
  verifierCase('M2', '"strict" set to false', [root_((o) => { o.compilerOptions.strict = false; })], 'V01');
  verifierCase('M3', '"noImplicitAny" removed', [root_((o) => { delete o.compilerOptions.noImplicitAny; })], 'V01');
  verifierCase('M4', '"strictTemplates" removed', [root_((o) => { delete o.angularCompilerOptions.strictTemplates; })], 'V02');
  verifierCase('M5', '"strictTemplates" set to false', [root_((o) => { o.angularCompilerOptions.strictTemplates = false; })], 'V02');
  verifierCase('M6', 'app tsconfig sets strictNullChecks false', [[APP_TSCONFIG, json((o) => { o.compilerOptions.strictNullChecks = false; })]], 'V04');
  verifierCase('M7', 'app tsconfig sets strictDomEventTypes false', [[APP_TSCONFIG, json((o) => { o.angularCompilerOptions = { strictDomEventTypes: false }; })]], 'V04');
  verifierCase('M8', 'baseline option weakened (noImplicitReturns false)', [root_((o) => { o.compilerOptions.noImplicitReturns = false; })], 'V05');
  verifierCase('M9', 'aot false in the production configuration', [['angular.json', (t) => {
    const a = JSON.parse(t); a.projects['reference-app'].architect.build.configurations.production.aot = false; return JSON.stringify(a, null, 2) + '\n';
  }]], 'V06');
  verifierCase('M10', '@ts-ignore added to app source', [[APP_TS, (t) => `// @ts-ignore\n${t}`]], 'V07');
  verifierCase('M11', 'contracts alias removed', [root_((o) => { delete o.compilerOptions.paths['@proseit/paep-contracts']; })], 'V08');
  verifierCase('M12', 'wildcard deep alias added', [root_((o) => { o.compilerOptions.paths['@proseit/paep-contracts/*'] = ['./packages/contracts/src/*']; })], 'V08');
  verifierCase('M13', 'contracts entry point deleted', [['packages/contracts/src/index.ts', () => null]], 'V09');
  verifierCase('M14', 'type checking switched off ("noCheck": true added)', [root_((o) => { o.compilerOptions.noCheck = true; })], 'V04');
  verifierCase('M15', 'unlisted option added ("allowUnreachableCode": true)', [root_((o) => { o.compilerOptions.allowUnreachableCode = true; })], 'V05');
  verifierCase('M16', 'Angular extended diagnostics suppressed', [root_((o) => { o.angularCompilerOptions.extendedDiagnostics = { defaultCategory: 'suppress' }; })], 'V04');
  verifierCase('M17', 'uppercase // @TS-NOCHECK in an entry point', [['packages/contracts/src/index.ts', (t) => `// @TS-NOCHECK\n${t}`]], 'V07');
} finally {
  fs.rmSync(scratch, { recursive: true, force: true });
}

const passed = results.every((r) => r.pass);
fs.writeFileSync(path.join(logsDir, 'negative-strictness.log'), `${header}\n\n${strictLog.join('\n')}`, 'utf8');
fs.writeFileSync(path.join(logsDir, 'negative-verifier-mutations.log'), `${header}\n\n${mutationLog.join('\n')}`, 'utf8');
const head = spawnSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).stdout.trim();
fs.writeFileSync(path.join(reportsDir, 'negative-tests.json'), JSON.stringify({
  workPackage: 'IB0-WP03', generatedAt: new Date().toISOString(), commit: head, node: process.versions.node,
  result: passed ? 'PASS' : 'FAIL', cases: results
}, null, 2) + '\n', 'utf8');

for (const r of results) console.log(`${r.pass ? 'PASS' : 'FAIL'} ${r.id} ${r.name} — exit ${r.exit}${r.failedChecks ? `; failed checks: ${r.failedChecks.join(', ') || 'none'}` : ''}${r.codesFound?.length ? `; ${r.codesFound.join(', ')}` : ''}`);
console.log(`\nIB0-WP03 negative tests: ${passed ? 'PASS' : 'FAIL'} (${results.filter((r) => r.pass).length}/${results.length})`);
process.exit(passed ? 0 : 1);
