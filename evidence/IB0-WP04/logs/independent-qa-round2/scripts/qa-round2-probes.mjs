#!/usr/bin/env node
// Independent QA mutation harness for IB0-WP04. Run with cwd = a scratch copy of the clone (never the author tree).
// Each case writes/appends files, runs `node tooling/architecture-boundaries/check-boundaries.mjs --json`,
// records exit code and rules, then restores with `git checkout -- . && git clean -fdq`.
import fs from 'node:fs'; import path from 'node:path'; import { spawnSync } from 'node:child_process'; import { createRequire } from 'node:module';
const ts = createRequire(path.join(process.cwd(), 'package.json'))('typescript');
const root = process.cwd();
const E = (d) => `packages/${d}/src/index.ts`;
const APP = 'apps/reference-app/src/app/app.ts';
const A = (s) => ({ append: s });
const W = (s) => ({ write: s });
const J = (fn) => ({ json: fn });
const cases = [
  // ---- new-false-positive probes (legitimate code; expect exit 0)
  ['FP01', 'components: nested intra-project relative imports', { 'packages/components/src/lib/c/y.ts': W('export const y = 1;\n'), 'packages/components/src/lib/a/b/x.ts': W("import { y } from '../../c/y';\nexport const x = y;\n") }, 0, []],
  ['FP02', 'app imports its own nested files', { 'apps/reference-app/src/app/feature/deep/f.ts': W("import { App } from '../../app';\nexport const F = App;\n"), 'apps/reference-app/src/app/app.ts': A("export { F } from './feature/deep/f';") }, 0, []],
  ['FP03', 'app main.ts /// <reference types="@angular/localize" />', { 'apps/reference-app/src/main.ts': { prepend: '/// <reference types="@angular/localize" />\n' } }, 0, []],
  ['FP04', "app typings.d.ts declare module '*.svg'", { 'apps/reference-app/src/typings.d.ts': W("declare module '*.svg' {\n  const c: string;\n  export default c;\n}\n") }, 0, []],
  ['FP05', 'components /// <reference path="./local.d.ts" /> within own project', { 'packages/components/src/local.d.ts': W('interface QaLocal { a: string }\n'), 'packages/components/src/lib/r.ts': W('/// <reference path="../local.d.ts" />\nexport const r: QaLocal = { a: "x" };\n') }, 0, []],
  ['FP06', 'components package.json imports pattern "#lib/*" -> ./src/lib/*', { 'packages/components/package.json': J((p) => { p.imports = { '#lib/*': './src/lib/*' }; }), 'packages/components/src/lib/x.ts': W('export const x = 1;\n'), 'packages/components/src/lib/u.ts': W("import { x } from '#lib/x';\nexport const u = x;\n") }, 0, []],
  ['FP07', 'components package.json imports exact "#lib" -> ./src/lib/index.ts', { 'packages/components/package.json': J((p) => { p.imports = { '#lib': './src/lib/index.ts' }; }), 'packages/components/src/lib/index.ts': W('export const x = 1;\n'), 'packages/components/src/u.ts': W("import { x } from '#lib';\nexport const u = x;\n") }, 0, []],
  ['FP08', 'components package.json imports conditional "#lib" -> {default: ./src/lib/index.ts}', { 'packages/components/package.json': J((p) => { p.imports = { '#lib': { types: './src/lib/index.ts', default: './src/lib/index.ts' } }; }), 'packages/components/src/lib/index.ts': W('export const x = 1;\n'), 'packages/components/src/u.ts': W("import { x } from '#lib';\nexport const u = x;\n") }, 0, []],
  ['FP09', 'analytics uses Angular (Injectable, signal) without re-exporting', { [E('analytics')]: A("import { Injectable, signal } from '@angular/core';\n@Injectable({ providedIn: 'root' })\nexport class QaSvc { readonly s = signal(1); }\nexport const qaSig = signal(2);") }, 0, []],
  ['FP10', 'analytics: parameter shadows an imported vendor name; exported function', { [E('analytics')]: A("import * as echarts from 'echarts';\nexport function render(echarts: unknown): unknown { return echarts; }\nexport const ver = typeof echarts;") }, 0, []],
  ['FP11', 'app imports Angular/rxjs subpaths', { 'apps/ui-lab/src/app/app.ts': A("import { HttpClient } from '@angular/common/http';\nimport { map } from 'rxjs/operators';\nexport const qa = [HttpClient, map];") }, 0, []],
  ['FP12', 'contracts: plain types incl. Promise, .d.ts interface, declare global, and checked .js', { 'packages/contracts/src/lib/reporting/g.ts': W('export interface Gw { run(q: string): Promise<readonly string[]>; }\n'), 'packages/contracts/src/lib/core/t.d.ts': W('export interface Page { cursor?: string }\n'), 'packages/contracts/src/lib/core/glob.ts': W('declare global { interface QaGlobal { a: 1 } }\nexport {};\n'), 'packages/contracts/src/lib/core/v.js': W('/** @param {number} a */\nexport const inc = (a) => a + 1;\n') }, 0, []],
  ['FP13', "components declare module '*.html' ambient", { 'packages/components/src/lib/html.d.ts': W("declare module '*.html' { const t: string; export default t; }\n") }, 0, []],
  ['FP14', 'nested dist/ and .angular/ folders with legitimate intra-project code (app)', { 'apps/reference-app/src/app/dist/x.ts': W("import { App } from '../app';\nexport const X = App;\n"), 'apps/reference-app/src/app/.angular/y.ts': W("export const Y = 1;\n") }, 0, []],
  ['FP15', "bare specifiers that look rooted but are npm subpaths: 'config/raw', 'docs/x'", { [E('components')]: A("import 'config/raw';\nimport 'docs/x';") }, 0, []],
  ['FP16', 'require.resolve with a non-literal argument', { 'packages/components/src/lib/rr.cjs': W("const n = 'x';\nmodule.exports = require.resolve(n);\n") }, 0, []],
  ['FP17', 'package-root node_modules with foreign code is skipped (legit install folder)', { 'packages/components/node_modules/foo/index.js': W("require('@proseit/paep-enterprise');\n") }, 0, []],
  // ---- further negative probes of the new rules
  ['NN01', '#ent imports alias to a bare workspace package name', { 'packages/components/package.json': J((p) => { p.imports = { '#ent': '@proseit/paep-enterprise' }; }), 'packages/components/src/lib/sub.ts': W("import '#ent';\nexport {};\n") }, 1, ['DIRECTION']],
  ['NN02', '#ent conditional imports object into another package', { 'packages/components/package.json': J((p) => { p.imports = { '#ent': { default: '../enterprise/src/index.ts' } }; }), 'packages/components/src/lib/sub.ts': W("import '#ent';\nexport {};\n") }, 1, ['ENTRY_BYPASS']],
  ['NN03', '#ent/* pattern imports into another package', { 'packages/components/package.json': J((p) => { p.imports = { '#ent/*': '../enterprise/src/*' }; }), 'packages/components/src/lib/sub.ts': W("import '#ent/index';\nexport {};\n") }, 1, ['ENTRY_BYPASS']],
  ['NN04', '/// <reference types="@proseit/paep-enterprise" /> in components', { 'packages/components/src/lib/t.ts': W('/// <reference types="@proseit/paep-enterprise" />\nexport {};\n') }, 1, ['DIRECTION']],
  ['NN05', 'analytics: import then export default', { [E('analytics')]: A("import echarts from 'echarts';\nexport default echarts;") }, 1, ['ANALYTICS_VENDOR_EXPORT']],
  ['NN06', 'analytics: export import x = require()', { 'packages/analytics/src/lib/v.cts': W("export import echarts = require('echarts');\n") }, 1, ['ANALYTICS_VENDOR_EXPORT']],
  ['NN07', 'analytics: exported const aliasing an imported vendor binding', { [E('analytics')]: A("import * as echarts from 'echarts';\nexport const charts = echarts;") }, 1, ['ANALYTICS_VENDOR_EXPORT']],
  ['NN08', 'forbidden import in a nested .angular/ folder in a package', { 'packages/components/src/.angular/x.ts': W("import '@proseit/paep-enterprise';\nexport {};\n") }, 1, ['DIRECTION']],
  ['NN09', 'forbidden import in a nested node_modules/ folder below src', { 'packages/components/src/node_modules/x.ts': W("import '@proseit/paep-enterprise';\nexport {};\n") }, 1, ['DIRECTION']],
  ['NN10', 'contracts: /// <reference lib="dom" /> in a .d.ts', { 'packages/contracts/src/lib/g.d.ts': W('/// <reference lib="dom" />\nexport type T = Document;\n') }, 1, ['CONTRACTS_NEUTRAL']],
  ['NN11', 'contracts: .tsx using window', { 'packages/contracts/src/lib/w.tsx': W('export const w = window.location.href;\n') }, 1, ['CONTRACTS_NEUTRAL']],
  ['NN12', 'contracts: .mjs using document', { 'packages/contracts/src/lib/w.mjs': W('export const w = document.title;\n') }, 1, ['CONTRACTS_NEUTRAL']],
  ['NN13', 'contracts: /// <reference path> to typescript lib.dom.d.ts in node_modules', { 'packages/contracts/src/lib/p.ts': W('/// <reference path="../../../../node_modules/typescript/lib/lib.dom.d.ts" />\nexport const t = document.title;\n') }, 1, ['OUTSIDE_PROJECT']],
  ['NN14', 'category check: packages/i18n model entry recategorised as platform', { 'tooling/architecture-boundaries/architecture-model.json': J((m) => { const p = m.projects.find((x) => x.name === '@proseit/paep-i18n'); p.category = 'platform'; p.tags = ['layer:L1', 'type:platform']; }) }, 1, ['CLASSIFICATION']],
  ['NN15', 'rooted specifier to an existing file in another package', { [E('enterprise')]: A("import 'packages/components/src/index.ts';") }, 1, ['ENTRY_BYPASS']],
  ['NN16', 'components: reference path to its own nested node_modules code that imports enterprise', { 'packages/components/node_modules/evil/index.ts': W("import '@proseit/paep-enterprise';\nexport const e = 1;\n"), 'packages/components/src/lib/e.ts': W("import { e } from '../../node_modules/evil/index';\nexport const ee = e;\n") }, 1, ['DIRECTION']]
];

const results = [];
const run = () => spawnSync(process.execPath, ['tooling/architecture-boundaries/check-boundaries.mjs', '--json'], { cwd: root, encoding: 'utf8' });
const restore = () => { spawnSync('git', ['checkout', '--', '.'], { cwd: root }); spawnSync('git', ['clean', '-fdq'], { cwd: root }); spawnSync('git', ['clean', '-fdqx', '--', 'packages', 'apps'], { cwd: root }); };
const parseJ = (t) => ts.parseConfigFileTextToJson('x.json', t).config;
for (const [id, name, edits, wantExit, wantRules, absent = []] of cases) {
  restore();
  for (const [f, op] of Object.entries(edits)) {
    const p = path.join(root, f); fs.mkdirSync(path.dirname(p), { recursive: true });
    if (op === null) fs.rmSync(p);
    else if (op.write !== undefined) fs.writeFileSync(p, op.write);
    else if (op.append !== undefined) fs.appendFileSync(p, `${op.append}\n`);
    else if (op.prepend !== undefined) fs.writeFileSync(p, op.prepend + fs.readFileSync(p, 'utf8'));
    else if (op.json) { const o = parseJ(fs.readFileSync(p, 'utf8')); op.json(o); fs.writeFileSync(p, JSON.stringify(o, null, 2) + '\n'); }
  }
  const r = run();
  let parsed = null; try { parsed = JSON.parse(r.stdout); } catch {}
  const rules = parsed ? [...new Set(parsed.violations.map((v) => v.rule))].sort() : ['<unparsable>'];
  const ok = r.status === wantExit && wantRules.every((x) => rules.includes(x)) && !absent.some((x) => rules.includes(x));
  results.push({ id, name, wantExit, wantRules, absent, exit: r.status, rules, ok, violations: parsed ? parsed.violations.map((v) => `${v.rule}: ${v.message}${v.where ? ` [${v.where}]` : ''}`) : [r.stderr.slice(0, 400)] });
}
restore();
for (const x of results) {
  console.log(`${x.ok ? 'AS-EXPECTED' : 'UNEXPECTED '} ${x.id} ${x.name} — expected exit ${x.wantExit}${x.wantRules.length ? ` with ${x.wantRules.join('+')}` : ''}${x.absent.length ? ` without ${x.absent.join('+')}` : ''}; got exit ${x.exit} rules [${x.rules.join(', ')}]`);
  for (const v of x.violations) console.log(`      ${v}`);
}
const unexpected = results.filter((x) => !x.ok).map((x) => x.id);
console.log(`\nQA mutations: ${results.length} cases; as expected ${results.length - unexpected.length}; unexpected: ${unexpected.join(', ') || 'none'}`);
fs.writeFileSync(process.env.QA_JSON || '/dev/null', JSON.stringify(results, null, 2));
process.exit(0);
