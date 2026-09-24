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
  // ---- (iii) direction, own cases
  ['D01', 'offline -> foundation ("No")', { [E('offline')]: A("import '@proseit/paep-foundation';") }, 1, ['DIRECTION']],
  ['D02', 'observability -> i18n ("No")', { [E('observability')]: A("import '@proseit/paep-i18n';") }, 1, ['DIRECTION']],
  ['D03', 'i18n -> platform (Optional, allowed)', { [E('i18n')]: A("import '@proseit/paep-platform';") }, 0, []],
  ['D04', 'analytics -> enterprise (Optional, allowed)', { [E('analytics')]: A("import '@proseit/paep-enterprise';") }, 0, []],
  ['D05', 'enterprise -> frappe-sdk ("No")', { [E('enterprise')]: A("import '@proseit/frappe-sdk';") }, 1, ['DIRECTION']],
  ['D06', 'domain-ai -> analytics (Optional, allowed)', { [E('domain-ai')]: A("import '@proseit/paep-analytics';") }, 0, []],
  ['D07', 'platform -> components (upward "-")', { [E('platform')]: A("import '@proseit/paep-components';") }, 1, ['DIRECTION']],
  ['D08', 'foundation -> contracts ("No")', { [E('foundation')]: A("import '@proseit/paep-contracts';") }, 1, ['DIRECTION']],
  ['D09', 'components -> contracts (Optional, allowed)', { [E('components')]: A("import '@proseit/paep-contracts';") }, 0, []],
  ['D10', 'ui-lab -> frappe-sdk (Yes, allowed)', { 'apps/ui-lab/src/app/app.ts': A("import '@proseit/frappe-sdk';") }, 0, []],
  ['D11', 'contracts -> foundation (upward "-")', { [E('contracts')]: A("import '@proseit/paep-foundation';") }, 1, ['DIRECTION']],
  ['D12', 'domain-iot -> frappe-sdk ("No")', { [E('domain-iot')]: A("import '@proseit/frappe-sdk';") }, 1, ['DIRECTION']],
  ['D13', 'offline -> components ("No")', { [E('offline')]: A("import '@proseit/paep-components';") }, 1, ['DIRECTION']],
  ['D14', 'frappe-sdk peerDependencies -> i18n ("No") via manifest', { 'packages/frappe-sdk/package.json': J((p) => { p.peerDependencies = { '@proseit/paep-i18n': '*' }; }) }, 1, ['DIRECTION']],
  ['D15', 'offline optionalDependencies -> platform (Yes) via manifest', { 'packages/offline/package.json': J((p) => { p.optionalDependencies = { '@proseit/paep-platform': '*' }; }) }, 0, []],
  // ---- (iii) import forms, forbidden components -> enterprise
  ['F01', "export { x } from (nested folder)", { 'packages/components/src/lib/a/b/c/reexp.ts': W("export { type Foo } from '@proseit/paep-enterprise';\n") }, 1, ['DIRECTION']],
  ['F02', 'export * as ns from', { 'packages/components/src/lib/ns.ts': W("export * as ent from '@proseit/paep-enterprise';\n") }, 1, ['DIRECTION']],
  ['F03', 'import x = require() in .cts', { 'packages/components/src/lib/req.cts': W("import ent = require('@proseit/paep-enterprise');\nexport = ent;\n") }, 1, ['DIRECTION']],
  ['F04', "import('...') type in type alias", { 'packages/components/src/lib/t.ts': W("export type T = typeof import('@proseit/paep-enterprise');\n") }, 1, ['DIRECTION']],
  ['F05', 'dynamic import with no-substitution template literal', { 'packages/components/src/lib/dyn.ts': W('export const l = () => import(`@proseit/paep-enterprise`);\n') }, 1, ['DIRECTION']],
  ['F06', 'dynamic import with computed specifier (string concat)', { 'packages/components/src/lib/dyn2.ts': W("const scope = '@proseit/';\nexport const l = () => import(scope + 'paep-enterprise');\n") }, 1, ['DIRECTION']],
  ['F07', 'dynamic import with substitution template literal', { 'packages/components/src/lib/dyn3.ts': W("const n = 'paep-enterprise';\nexport const l = () => import(`@proseit/${n}`);\n") }, 1, ['DIRECTION']],
  ['F08', '.mts file static import', { 'packages/components/src/lib/m.mts': W("import '@proseit/paep-enterprise';\nexport {};\n") }, 1, ['DIRECTION']],
  ['F09', '.js file require()', { 'packages/components/src/lib/legacy.js': W("const e = require('@proseit/paep-enterprise');\nmodule.exports = e;\n") }, 1, ['DIRECTION']],
  ['F10', '.mjs file import', { 'packages/components/src/lib/x.mjs': W("import '@proseit/paep-enterprise';\n") }, 1, ['DIRECTION']],
  ['F11', '.cjs file require()', { 'packages/components/src/lib/x.cjs': W("require('@proseit/paep-enterprise');\n") }, 1, ['DIRECTION']],
  ['F12', '.tsx file import', { 'packages/components/src/lib/x.tsx': W("import '@proseit/paep-enterprise';\nexport {};\n") }, 1, ['DIRECTION']],
  ['F13', 'hand-written .d.ts with import type', { 'packages/components/src/lib/ambient.d.ts': W("import type * as Ent from '@proseit/paep-enterprise';\nexport type EntNs = typeof Ent;\n") }, 1, ['DIRECTION']],
  ['F14', 'source under a nested directory named dist', { 'packages/components/src/dist/impl.ts': W("import '@proseit/paep-enterprise';\nexport const x = 1;\n"), [E('components')]: A("export * from './dist/impl';") }, 1, ['DIRECTION']],
  ['F15', 'triple-slash reference path into another package', { 'packages/components/src/lib/ref.ts': W('/// <reference path="../../../enterprise/src/index.ts" />\nexport const r = 1;\n') }, 1, ['ENTRY_BYPASS']],
  ['F16', 'module augmentation declare module of another package', { 'packages/components/src/lib/aug.ts': W("export {};\ndeclare module '@proseit/paep-enterprise' { interface Aug { a: string } }\n") }, 1, ['DIRECTION']],
  ['F17', 'JSDoc import() type in a .js file', { 'packages/components/src/lib/doc.js': W("/** @type {import('@proseit/paep-enterprise').X} */\nexport const x = null;\n") }, 1, ['DIRECTION']],
  ['F18', 'require.resolve()', { 'packages/components/src/lib/rr.js': W("export const p = require.resolve('@proseit/paep-enterprise');\n") }, 1, ['DIRECTION']],
  ['F19', 'package.json "imports" subpath alias #ent -> enterprise', { 'packages/components/package.json': J((p) => { p.imports = { '#ent': '@proseit/paep-enterprise' }; }), 'packages/components/src/lib/sub.ts': W("import '#ent';\nexport {};\n") }, 1, ['DIRECTION']],
  // ---- deep imports / entry point / bypass
  ['P01', 'deep import via dynamic import()', { [E('enterprise')]: A("export const l = () => import('@proseit/paep-components/src/lib/x');") }, 1, ['DEEP_IMPORT']],
  ['P02', "deep import via import('...') type", { [E('enterprise')]: A("export type X = typeof import('@proseit/paep-components/src/index');") }, 1, ['DEEP_IMPORT']],
  ['P03', 'deep import of package.json', { [E('enterprise')]: A("import '@proseit/paep-components/package.json';") }, 1, ['DEEP_IMPORT']],
  ['P04', 'deep import in app file', { 'apps/ui-lab/src/app/app.ts': A("import '@proseit/paep-components/src/index';") }, 1, ['DEEP_IMPORT']],
  ['P05', 'relative directory import of another package (no /index)', { [E('enterprise')]: A("import '../../components/src';") }, 1, ['ENTRY_BYPASS']],
  ['P06', 'rooted packages/... import', { [E('enterprise')]: A("import 'packages/components/src/index';") }, 1, ['ENTRY_BYPASS']],
  ['P07', 'absolute path import', { [E('enterprise')]: A(`import '${root}/packages/components/src/index';`) }, 1, ['ENTRY_BYPASS']],
  ['P08', 'app relative import of package source', { 'apps/reference-app/src/app/app.ts': A("import '../../../../packages/components/src/index';") }, 1, ['ENTRY_BYPASS']],
  ['P09', 'relative import via node_modules workspace symlink', { [E('enterprise')]: A("import '../../../node_modules/@proseit/paep-components';") }, 1, ['OUTSIDE_PROJECT']],
  ['P10', 'relative import of config/', { [E('enterprise')]: A("import '../../../config/runtime-config.schema.json';") }, 1, ['OUTSIDE_PROJECT']],
  ['P11', 'unknown @proseit/* via require()', { 'packages/components/src/lib/u.cjs': W("require('@proseit/paep-nope');\n") }, 1, ['UNKNOWN_PACKAGE']],
  ['P12', 'public entry point deleted (offline)', { [E('offline')]: null }, 1, ['ENTRY_POINT']],
  ['P13', 'alias with two targets', { 'tsconfig.base.json': J((o) => { o.compilerOptions.paths['@proseit/paep-offline'].push('./packages/offline/src/internal.ts'); }) }, 1, ['ALIAS']],
  ['P14', 'baseUrl added to tsconfig.base.json', { 'tsconfig.base.json': J((o) => { o.compilerOptions.baseUrl = '.'; }) }, 1, ['ALIAS']],
  ['P15', 'alias for an app added', { 'tsconfig.base.json': J((o) => { o.compilerOptions.paths['reference-app'] = ['./apps/reference-app/src/main.ts']; }) }, 1, ['ALIAS']],
  ['P16', 'non-@proseit alias to package internals in a non-tsconfig-named file in the app extends chain', {
    'apps/reference-app/paths.json': W(JSON.stringify({ extends: '../../tsconfig.json', compilerOptions: { paths: { ...Object.fromEntries(ts.parseConfigFileTextToJson('b', fs.readFileSync('tsconfig.base.json','utf8')).config.compilerOptions.paths ? Object.entries(ts.parseConfigFileTextToJson('b', fs.readFileSync('tsconfig.base.json','utf8')).config.compilerOptions.paths).map(([k,v]) => [k, v.map((t) => '../.' + t)]) : []), '~ent/*': ['../../packages/enterprise/src/*'] } } }, null, 2)),
    'apps/reference-app/tsconfig.app.json': J((o) => { o.extends = './paths.json'; }),
    [E('components')]: A("import '~ent/index';") }, 1, ['DIRECTION']],
  // ---- cycles
  ['Y01', '3-package cycle i18n->platform (Opt) -> observability (Opt) -> i18n ("No")', { [E('i18n')]: A("import '@proseit/paep-platform';"), [E('platform')]: A("import '@proseit/paep-observability';"), [E('observability')]: A("import '@proseit/paep-i18n';") }, 1, ['CYCLE', 'DIRECTION']],
  ['Y02', '3-package domain cycle ai -> iot -> fiscal -> ai', { [E('domain-ai')]: A("import '@proseit/paep-domain-iot';"), [E('domain-iot')]: A("import '@proseit/paep-domain-fiscal';"), [E('domain-fiscal')]: A("import '@proseit/paep-domain-ai';") }, 1, ['CYCLE', 'DIRECTION']],
  ['Y03', '2-cycle platform <-> observability mixing manifest dependency and type import', { 'packages/platform/package.json': J((p) => { p.dependencies = { '@proseit/paep-observability': '0.0.0' }; }), [E('observability')]: A("export type P = typeof import('@proseit/paep-platform');") }, 1, ['CYCLE'], ['DIRECTION']],
  ['Y04', 'allowed chain i18n->platform->observability (no cycle)', { [E('i18n')]: A("import '@proseit/paep-platform';"), [E('platform')]: A("import '@proseit/paep-observability';") }, 0, []],
  ['Y05', '4-node cycle through app edge: components -> ... -> app (package -> app bypass) ', { 'apps/reference-app/src/app/app.ts': A("import '@proseit/paep-components';"), [E('components')]: A("import '../../../apps/reference-app/src/app/app';") }, 1, ['CYCLE', 'DIRECTION']],
  // ---- contracts neutrality
  ['C01', 'contracts: /// <reference lib="dom" /> then document', { [E('contracts')]: A('/// <reference lib="dom" />\nexport const t = document.title;') }, 1, ['CONTRACTS_NEUTRAL']],
  ['C02', 'contracts: DOM global in a separate file under lib/', { 'packages/contracts/src/lib/core/w.ts': W('export const w = window.location.href;\n') }, 1, ['CONTRACTS_NEUTRAL']],
  ['C03', 'contracts: DOM global in .tsx file', { 'packages/contracts/src/lib/w.tsx': W('export const w = window.location.href;\n') }, 1, ['CONTRACTS_NEUTRAL']],
  ['C04', 'contracts: DOM global in .js file', { 'packages/contracts/src/lib/w.js': W('export const w = window.location.href;\n') }, 1, ['CONTRACTS_NEUTRAL']],
  ['C05', 'contracts: import type from rxjs', { [E('contracts')]: A("import type { Observable } from 'rxjs';\nexport type O = Observable<number>;") }, 1, ['CONTRACTS_NEUTRAL']],
  ['C06', 'contracts: manifest dependency on @angular/core', { 'packages/contracts/package.json': J((p) => { p.dependencies = { '@angular/core': '22.1.8' }; }) }, 1, ['CONTRACTS_NEUTRAL']],
  ['C07', 'contracts: node: builtin import', { [E('contracts')]: A("import 'node:fs';") }, 1, ['CONTRACTS_NEUTRAL']],
  ['C08', 'contracts: import of frappe (external)', { [E('contracts')]: A("import 'frappe-js-sdk';") }, 1, ['CONTRACTS_NEUTRAL']],
  // ---- analytics vendor / copied code
  ['V01', 'analytics: export type {} from vendor', { [E('analytics')]: A("export type { EChartsOption } from 'echarts';") }, 1, ['ANALYTICS_VENDOR_EXPORT']],
  ['V02', 'analytics: import-then-export of vendor namespace', { [E('analytics')]: A("import * as echarts from 'echarts';\nexport { echarts };") }, 1, ['ANALYTICS_VENDOR_EXPORT']],
  ['V03', 'app copies package source with changed comment only', {
    'packages/components/src/lib/fmt.ts': W('// original\nexport function wp04QaFormatter(value: number): string {\n  const rounded = Math.round(value * 100) / 100;\n  const padded = rounded.toFixed(2).padStart(12, " ");\n  return padded.length > 20 ? padded.slice(0, 20) : padded;\n}\n'),
    'apps/reference-app/src/app/fmt.ts': W('// copied\nexport function wp04QaFormatter(value: number): string {\n  const rounded = Math.round(value * 100) / 100;\n  const padded = rounded.toFixed(2).padStart(12, " ");\n  return padded.length > 20 ? padded.slice(0, 20) : padded;\n}\n') }, 1, ['COPIED_CODE']],
  ['V04', 'app copies package source with reformatted whitespace', {
    'packages/components/src/lib/fmt.ts': W('export function wp04QaFormatter(value: number): string {\n  const rounded = Math.round(value * 100) / 100;\n  const padded = rounded.toFixed(2).padStart(12, " ");\n  return padded.length > 20 ? padded.slice(0, 20) : padded;\n}\n'),
    'apps/reference-app/src/app/fmt.ts': W('export function wp04QaFormatter(value: number): string { const rounded = Math.round(value * 100) / 100;\n const padded = rounded.toFixed(2).padStart(12, " "); return padded.length > 20 ? padded.slice(0, 20) : padded; }\n') }, 1, ['COPIED_CODE']],
  // ---- classification / model
  ['K01', 'package directory without package.json', { 'packages/stray/src/index.ts': W('export {};\n') }, 1, ['CLASSIFICATION']],
  ['K02', 'extra angular.json project', { 'angular.json': J((a) => { a.projects['admin-app'] = { ...a.projects['ui-lab'], root: 'apps/admin-app', sourceRoot: 'apps/admin-app/src' }; }) }, 1, ['CLASSIFICATION']],
  ['K03', 'extra directory under apps/', { 'apps/scratch-app/src/main.ts': W('export {};\n') }, 1, ['CLASSIFICATION']],
  ['K04', 'tags reordered', { 'tooling/architecture-boundaries/architecture-model.json': J((m) => { m.projects[0].tags.reverse(); }) }, 1, ['CLASSIFICATION']],
  ['K05', 'layer of observability changed to L2 in model', { 'tooling/architecture-boundaries/architecture-model.json': J((m) => { m.categories.observability.layer = 'L2'; }) }, 1, ['MODEL']],
  ['K06', 'model matrix: observability -> i18n flipped to Optional', { 'tooling/architecture-boundaries/architecture-model.json': J((m) => { m.matrix.rows.observability[3] = 'Optional'; }) }, 1, ['MODEL']],
  ['K07', 'model: domain package recategorised as enterprise', { 'tooling/architecture-boundaries/architecture-model.json': J((m) => { const p = m.projects.find((x) => x.name === '@proseit/paep-domain-ai'); p.category = 'enterprise'; p.tags = ['layer:L3', 'type:enterprise']; }) }, 1, ['CLASSIFICATION']],
  ['K08', 'extra workspace pattern tooling/*', { 'package.json': J((p) => { p.workspaces.push('tooling/*'); }) }, 1, ['CLASSIFICATION']],
  ['K09', 'package.json name differs from model', { 'packages/i18n/package.json': J((p) => { p.name = '@proseit/paep-i18n-x'; }) }, 1, ['CLASSIFICATION']]
];

const results = [];
const run = () => spawnSync(process.execPath, ['tooling/architecture-boundaries/check-boundaries.mjs', '--json'], { cwd: root, encoding: 'utf8' });
const restore = () => { spawnSync('git', ['checkout', '--', '.'], { cwd: root }); spawnSync('git', ['clean', '-fdq'], { cwd: root }); };
const parseJ = (t) => ts.parseConfigFileTextToJson('x.json', t).config;
for (const [id, name, edits, wantExit, wantRules, absent = []] of cases) {
  restore();
  for (const [f, op] of Object.entries(edits)) {
    const p = path.join(root, f); fs.mkdirSync(path.dirname(p), { recursive: true });
    if (op === null) fs.rmSync(p);
    else if (op.write !== undefined) fs.writeFileSync(p, op.write);
    else if (op.append !== undefined) fs.appendFileSync(p, `${op.append}\n`);
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
