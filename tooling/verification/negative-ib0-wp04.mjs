#!/usr/bin/env node
/**
 * PAEP IB0-WP04 negative architecture tests.
 * Proves in a disposable scratch copy (never in the working tree) that the
 * boundary checker behind `npm run arch:check` passes the unmutated
 * workspace and allowed edges, and exits non-zero naming the expected rule
 * for each forbidden dependency, cycle, deep import, entry-point bypass,
 * classification, alias and neutrality violation (AC16). Two further cases
 * prove the WP04 verifier rejects an Nx installation (AC17).
 * The scratch copy includes .git (the verifier compares against the baseline)
 * and links node_modules from the repository. It is deleted afterwards.
 * Writes evidence/IB0-WP04/logs/negative-architecture-tests.log and
 * evidence/IB0-WP04/reports/negative-tests.json.
 */

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { spawnSync } from 'node:child_process';
import ts from 'typescript';

const root = process.cwd();
const logsDir = path.join(root, 'evidence', 'IB0-WP04', 'logs');
const reportsDir = path.join(root, 'evidence', 'IB0-WP04', 'reports');
fs.mkdirSync(logsDir, { recursive: true });
fs.mkdirSync(reportsDir, { recursive: true });

const scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'paep-wp04-negative-'));
const copy = path.join(scratch, 'repo');
const SKIP = new Set(['node_modules', 'dist', '.angular']);
fs.cpSync(root, copy, { recursive: true, filter: (src) => !SKIP.has(path.basename(src)) || path.dirname(src) !== root });
fs.symlinkSync(path.join(root, 'node_modules'), path.join(copy, 'node_modules'), process.platform === 'win32' ? 'junction' : 'dir');
// The linked node_modules is a symlink, which the repository's `/node_modules/` ignore rule does not match; exclude it locally in the copy.
fs.appendFileSync(path.join(copy, '.git', 'info', 'exclude'), '\n/node_modules\n');

const env = { ...process.env, NO_COLOR: '1', FORCE_COLOR: '0', NG_CLI_ANALYTICS: 'false' };
const exec = (args) => {
  const r = spawnSync(process.execPath, args, { cwd: copy, encoding: 'utf8', env, maxBuffer: 64 * 1024 * 1024 });
  return { status: r.status, out: `${r.stdout || ''}${r.stderr || ''}`, stdout: r.stdout || '' };
};
const archCheck = () => exec([path.join(copy, 'tooling', 'architecture-boundaries', 'check-boundaries.mjs'), '--json']);
const verify = () => exec([path.join(copy, 'tooling', 'verification', 'verify-ib0-wp04.mjs'), '--static-only']);
const ngBin = path.join(root, 'node_modules', '@angular', 'cli', 'bin', 'ng.js');
const build = () => exec([ngBin, 'build', 'reference-app', '--configuration', 'production']);

// Applies file edits for one case and returns a function restoring every touched file.
function mutate(edits) {
  const saved = new Map();
  for (const [file, fn] of edits) {
    const p = path.join(copy, file);
    if (!saved.has(p)) saved.set(p, fs.existsSync(p) ? fs.readFileSync(p) : null);
    const next = fn(fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : null);
    fs.mkdirSync(path.dirname(p), { recursive: true });
    if (next === null) fs.rmSync(p); else fs.writeFileSync(p, next);
  }
  return () => {
    for (const [p, c] of saved) { if (c === null) fs.rmSync(p, { force: true }); else fs.writeFileSync(p, c); }
    // Remove directories a case created (they are empty once their files are gone).
    for (const d of ['packages/rogue/src', 'packages/rogue', 'packages/components/src/lib']) {
      const dp = path.join(copy, d);
      if (fs.existsSync(dp) && fs.readdirSync(dp).length === 0) fs.rmdirSync(dp);
    }
  };
}
const json = (fn) => (text) => {
  const o = ts.parseConfigFileTextToJson('config.json', text).config;
  fn(o);
  return JSON.stringify(o, null, 2) + '\n';
};
const append = (line) => (t) => `${t}${line}\n`;
const entry = (dir) => `packages/${dir}/src/index.ts`;
const MODEL = 'tooling/architecture-boundaries/architecture-model.json';
const APP_TS = 'apps/reference-app/src/app/app.ts';
const COPIED = `// Shared helper body used only to prove that apps may not copy package source (IB0-WP04 negative test).\nexport function wp04SharedFormatter(value: number): string {\n  const rounded = Math.round(value * 100) / 100;\n  return rounded.toFixed(2).padStart(12, ' ');\n}\n`;

const results = [];
const log = [];
const header = `# date: ${new Date().toISOString()} node: ${process.version} scratch: ${copy}\n# checker: node tooling/architecture-boundaries/check-boundaries.mjs --json (the command behind npm run arch:check)`;

function checkerCase(id, name, edits, expectedRule, extra = {}) {
  const restore = mutate(edits);
  const r = archCheck();
  restore();
  let parsed = null;
  try { parsed = JSON.parse(r.stdout); } catch { /* reported below */ }
  const rules = parsed ? [...new Set(parsed.violations.map((v) => v.rule))].sort() : [];
  let pass;
  if (!expectedRule) pass = r.status === 0 && parsed?.ok === true && (extra.edges === undefined || parsed.summary.edges === extra.edges) && (extra.optional === undefined || parsed.summary.optionalEdges === extra.optional);
  else pass = r.status === 1 && rules.includes(expectedRule) && !(extra.absent || []).some((x) => rules.includes(x));
  const expected = expectedRule ? `exit 1, ${expectedRule}${extra.absent ? `, no ${extra.absent.join('/')}` : ''}` : `exit 0, no violations${extra.edges !== undefined ? `, ${extra.edges} edges (${extra.optional} optional)` : ''}`;
  results.push({ id, name, tool: 'arch:check', expected, exit: r.status, rules, pass });
  const detail = parsed ? parsed.violations.map((v) => `  ${v.rule} ${v.message}${v.where ? ` [${v.where}]` : ''}`) : [r.out.slice(0, 2000)];
  log.push(`## ${id} ${name}\nexpected: ${expected}\nsummary: ${parsed ? JSON.stringify({ edges: parsed.summary.edges, optionalEdges: parsed.summary.optionalEdges, cycles: parsed.summary.cycles, violations: parsed.summary.violations }) : 'n/a'}\n${detail.join('\n')}\nEXIT_CODE=${r.status}\nRESULT=${pass ? 'PASS' : 'FAIL'}\n`);
}

function verifierCase(id, name, edits, expectedCheck) {
  const restore = mutate(edits);
  const r = verify();
  restore();
  const failed = [...r.out.matchAll(/^FAIL (V\d+)/gm)].map((m) => m[1]);
  const pass = expectedCheck ? r.status === 1 && failed.includes(expectedCheck) : r.status === 0 && failed.length === 0;
  const expected = expectedCheck ? `exit 1, ${expectedCheck} FAIL` : 'exit 0, all PASS';
  results.push({ id, name, tool: 'qa:ib0-wp04 --static-only', expected, exit: r.status, failedChecks: failed, pass });
  log.push(`## ${id} ${name}\nexpected: ${expected}\n${r.out.split(/\r?\n/).filter((l) => /^FAIL|verification/.test(l)).join('\n')}\nEXIT_CODE=${r.status}\nRESULT=${pass ? 'PASS' : 'FAIL'}\n`);
}

function buildCase(id, name, edits) {
  const restore = mutate(edits);
  const r = build();
  restore();
  const pass = r.status === 0;
  results.push({ id, name, tool: 'ng build reference-app --configuration production', expected: 'exit 0', exit: r.status, pass });
  log.push(`## ${id} ${name}\nexpected: exit 0\n${r.out.split(/\r?\n/).filter((l) => /ERROR|TS\d{4}|Output location|Application bundle generation/.test(l)).join('\n')}\nEXIT_CODE=${r.status}\nRESULT=${pass ? 'PASS' : 'FAIL'}\n`);
}

const ALLOWED_EDGES = [
  [entry('enterprise'), append("import '@proseit/paep-components';")],
  [entry('frappe-sdk'), append("import '@proseit/paep-offline';")],
  [APP_TS, append("import '@proseit/paep-enterprise';")]
];

try {
  // Controls.
  checkerCase('C0', 'positive control: unmutated workspace passes', [], null, { edges: 0, optional: 0 });
  checkerCase('C1', 'allowed-edge control: enterprise -> components (Yes), frappe-sdk -> offline (Optional), reference-app -> enterprise (Yes)', ALLOWED_EDGES, null, { edges: 3, optional: 1 });
  buildCase('C2', 'allowed-edge control: reference-app production build resolves @proseit/paep-enterprise through tsconfig.base.json', [[APP_TS, append("import '@proseit/paep-enterprise';")]]);
  verifierCase('C3', 'positive control: WP04 verifier static checks pass unmutated', [], null);

  // Mandatory negative cases (AC16).
  checkerCase('N01', 'forbidden upward import: components -> enterprise', [[entry('components'), append("import '@proseit/paep-enterprise';")]], 'DIRECTION');
  checkerCase('N02', 'contracts -> @angular/core', [[entry('contracts'), append("import { Injectable } from '@angular/core';\nexport const wp04Marker = Injectable;")]], 'CONTRACTS_NEUTRAL');
  checkerCase('N03', 'foundation -> enterprise', [[entry('foundation'), append("import '@proseit/paep-enterprise';")]], 'DIRECTION');
  checkerCase('N04', 'deep import: enterprise -> @proseit/paep-components/src/internal/button', [[entry('enterprise'), append("import '@proseit/paep-components/src/internal/button';")]], 'DEEP_IMPORT');
  checkerCase('N05', 'circular dependency over allowed Optional edges: platform <-> observability (caught by the cycle rule alone)', [
    [entry('platform'), append("import '@proseit/paep-observability';")],
    [entry('observability'), append("import '@proseit/paep-platform';")]
  ], 'CYCLE', { absent: ['DIRECTION'] });
  checkerCase('N06', 'public-entry-point bypass by relative path: enterprise -> ../../components/src/index', [[entry('enterprise'), append("import '../../components/src/index';")]], 'ENTRY_BYPASS');
  checkerCase('N07', 'unknown project category ("widgets")', [[MODEL, (t) => { const m = JSON.parse(t); m.projects.find((p) => p.name === '@proseit/paep-components').category = 'widgets'; return JSON.stringify(m, null, 2) + '\n'; }]], 'CLASSIFICATION');
  checkerCase('N08', 'unclassified package packages/rogue', [
    ['packages/rogue/package.json', () => '{\n  "name": "@proseit/paep-rogue",\n  "version": "0.0.0",\n  "private": true\n}\n'],
    ['packages/rogue/src/index.ts', () => 'export {};\n']
  ], 'CLASSIFICATION');
  checkerCase('N09', 'app -> app: reference-app imports ui-lab source', [[APP_TS, append("import '../../../ui-lab/src/app/app';")]], 'ENTRY_BYPASS');
  checkerCase('N10', 'package -> app: components imports reference-app source', [[entry('components'), append("import '../../../apps/reference-app/src/app/app';")]], 'DIRECTION');
  checkerCase('N11', 'contracts uses a DOM global (document)', [[entry('contracts'), append('export const wp04Title = document.title;')]], 'CONTRACTS_NEUTRAL');
  checkerCase('N12', 'frappe-sdk -> components (UI)', [[entry('frappe-sdk'), append("import '@proseit/paep-components';")]], 'DIRECTION');
  checkerCase('N13', 'analytics -> frappe-sdk', [[entry('analytics'), append("import '@proseit/frappe-sdk';")]], 'DIRECTION');
  checkerCase('N14', 'domain -> domain: domain-quality -> domain-fiscal', [[entry('domain-quality'), append("import '@proseit/paep-domain-fiscal';")]], 'DIRECTION');
  checkerCase('N15', 'forbidden manifest dependency: foundation package.json depends on enterprise', [['packages/foundation/package.json', (t) => { const p = JSON.parse(t); p.dependencies = { '@proseit/paep-enterprise': '0.0.0' }; return JSON.stringify(p, null, 2) + '\n'; }]], 'DIRECTION');
  checkerCase('N16', 'forbidden edge by dynamic import(): foundation -> enterprise', [[entry('foundation'), append("export const wp04Load = () => import('@proseit/paep-enterprise');")]], 'DIRECTION');
  checkerCase('N17', 'forbidden edge by type-only import: platform -> enterprise', [[entry('platform'), append("import type * as Wp04 from '@proseit/paep-enterprise';\nexport type Wp04Ns = typeof Wp04;")]], 'DIRECTION');
  checkerCase('N18', 'forbidden edge by re-export: components re-exports analytics', [[entry('components'), append("export * from '@proseit/paep-analytics';")]], 'DIRECTION');
  checkerCase('N19', 'analytics re-exports a visualization vendor module', [[entry('analytics'), append("export * from 'echarts';")]], 'ANALYTICS_VENDOR_EXPORT');
  checkerCase('N20', 'app copies package source', [
    ['packages/components/src/lib/formatter.ts', () => COPIED],
    ['apps/reference-app/src/app/formatter.ts', () => COPIED]
  ], 'COPIED_CODE');
  checkerCase('N21', 'model matrix tampered: platform -> frappe-sdk set to "Yes"', [[MODEL, (t) => { const m = JSON.parse(t); m.matrix.rows.platform[m.matrix.matrixColumns.indexOf('frappe-sdk')] = 'Yes'; return JSON.stringify(m, null, 2) + '\n'; }]], 'MODEL');
  checkerCase('N22', 'wildcard deep alias added to tsconfig.base.json', [['tsconfig.base.json', json((o) => { o.compilerOptions.paths['@proseit/paep-components/*'] = ['./packages/components/src/*']; })]], 'ALIAS');
  checkerCase('N23', 'alias retargeted below the entry point', [['tsconfig.base.json', json((o) => { o.compilerOptions.paths['@proseit/paep-components'] = ['./packages/components/src/lib/internal.ts']; })]], 'ALIAS');
  checkerCase('N24', 'paths re-added to tsconfig.json (second alias registry)', [['tsconfig.json', json((o) => { o.compilerOptions.paths = { '@proseit/paep-components': ['./packages/components/src/index.ts'] }; })]], 'ALIAS');
  checkerCase('N25', 'unknown @proseit/* package imported', [[entry('enterprise'), append("import '@proseit/paep-unknown';")]], 'UNKNOWN_PACKAGE');
  checkerCase('N26', 'import from tooling/ (outside every project)', [[entry('enterprise'), append("import '../../../tooling/test-utils/helpers';")]], 'OUTSIDE_PROJECT');
  checkerCase('N27', 'forbidden edge by import = require(): foundation -> enterprise', [[entry('foundation'), append("import wp04 = require('@proseit/paep-enterprise');\nexport const wp04Ref = wp04;")]], 'DIRECTION');

  // No Nx (AC17).
  verifierCase('N28', 'nx added to devDependencies', [['package.json', (t) => { const p = JSON.parse(t); p.devDependencies.nx = '22.0.0'; return JSON.stringify(p, null, 2) + '\n'; }]], 'V15');
  verifierCase('N29', 'nx.json created', [['nx.json', () => '{}\n']], 'V15');
} finally {
  fs.rmSync(scratch, { recursive: true, force: true });
}

const passed = results.every((r) => r.pass);
fs.writeFileSync(path.join(logsDir, 'negative-architecture-tests.log'), `${header}\n\n${log.join('\n')}`, 'utf8');
const head = spawnSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).stdout.trim();
fs.writeFileSync(path.join(reportsDir, 'negative-tests.json'), JSON.stringify({
  workPackage: 'IB0-WP04', generatedAt: new Date().toISOString(), commit: head, node: process.versions.node,
  result: passed ? 'PASS' : 'FAIL',
  controls: results.filter((r) => r.id.startsWith('C')).length,
  negatives: results.filter((r) => r.id.startsWith('N')).length,
  cases: results
}, null, 2) + '\n', 'utf8');

for (const r of results) console.log(`${r.pass ? 'PASS' : 'FAIL'} ${r.id} ${r.name} — exit ${r.exit}${r.rules ? `; rules: ${r.rules.join(', ') || 'none'}` : ''}${r.failedChecks ? `; failed checks: ${r.failedChecks.join(', ') || 'none'}` : ''}`);
console.log(`\nIB0-WP04 negative tests: ${passed ? 'PASS' : 'FAIL'} (${results.filter((r) => r.pass).length}/${results.length})`);
process.exit(passed ? 0 : 1);
