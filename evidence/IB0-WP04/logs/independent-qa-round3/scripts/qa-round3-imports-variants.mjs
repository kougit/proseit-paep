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
const CP = (imports) => J((p) => { p.imports = imports; });
const USE = (spec, file = 'packages/components/src/lib/use.ts') => ({ [file]: W(`import '${spec}';\nexport {};\n`) });
const X = { 'packages/components/src/lib/x.ts': W('export const x = 1;\n') };
const cases = [
  // conditional objects
  ['M01', 'conditional {default: bare enterprise}', { 'packages/components/package.json': CP({ '#ent': { default: '@proseit/paep-enterprise' } }), ...USE('#ent') }, 1, ['DIRECTION']],
  ['M02', 'conditional {types: ./src/lib/x.ts, default: bare enterprise}', { 'packages/components/package.json': CP({ '#ent': { types: './src/lib/x.ts', default: '@proseit/paep-enterprise' } }), ...X, ...USE('#ent') }, 1, ['DIRECTION']],
  ['M03', 'conditional {import: bare enterprise, default: ./src/lib/x.ts} (bundlers take "import")', { 'packages/components/package.json': CP({ '#ent': { import: '@proseit/paep-enterprise', default: './src/lib/x.ts' } }), ...X, ...USE('#ent') }, 1, ['DIRECTION']],
  ['M04', 'conditional {browser: bare enterprise, default: ./src/lib/x.ts}', { 'packages/components/package.json': CP({ '#ent': { browser: '@proseit/paep-enterprise', default: './src/lib/x.ts' } }), ...X, ...USE('#ent') }, 1, ['DIRECTION']],
  ['M05', 'nested conditional {node: {import: ../enterprise/src/index.ts}}', { 'packages/components/package.json': CP({ '#ent': { node: { import: '../enterprise/src/index.ts' } } }), ...USE('#ent') }, 1, ['ENTRY_BYPASS']],
  ['M06', 'legit conditional pattern {types,default} -> ./src/lib/*.ts', { 'packages/components/package.json': CP({ '#lib/*': { types: './src/lib/*.ts', default: './src/lib/*.ts' } }), ...X, ...USE('#lib/x') }, 0, []],
  // patterns
  ['M07', 'nested pattern into another package #ent/* -> ../enterprise/src/*', { 'packages/components/package.json': CP({ '#ent/*': '../enterprise/src/*' }), ...USE('#ent/lib/deep/y') }, 1, ['ENTRY_BYPASS']],
  ['M08', 'pattern to bare package without * in target (#p/* -> @proseit/paep-enterprise)', { 'packages/components/package.json': CP({ '#p/*': '@proseit/paep-enterprise' }), ...USE('#p/anything') }, 1, ['DIRECTION']],
  ['M09', 'pattern to deep import of an allowed package from enterprise (#c/* -> @proseit/paep-components/*)', { 'packages/enterprise/package.json': J((p) => { p.imports = { '#c/*': '@proseit/paep-components/*' }; }), 'packages/enterprise/src/lib/use.ts': W("import '#c/src/internal';\nexport {};\n") }, 1, ['DEEP_IMPORT']],
  ['M10', 'more specific pattern listed second (#a/* -> ./src/lib/*.ts, #a/b/* -> bare enterprise); import #a/b/x (Node picks longest prefix)', { 'packages/components/package.json': CP({ '#a/*': './src/lib/*.ts', '#a/b/*': '@proseit/paep-enterprise' }), 'packages/components/src/lib/b/x.ts': W('export const bx = 1;\n'), ...USE('#a/b/x') }, 1, ['DIRECTION']],
  ['M11', 'exact key beats pattern (#a/* -> ./src/lib/*.ts, #a/x -> bare enterprise); import #a/x', { 'packages/components/package.json': CP({ '#a/*': './src/lib/*.ts', '#a/x': '@proseit/paep-enterprise' }), ...X, ...USE('#a/x') }, 1, ['DIRECTION']],
  // contracts externals via imports map
  ['M12', 'contracts pattern to external module (#rx/* -> rxjs/*)', { 'packages/contracts/package.json': J((p) => { p.imports = { '#rx/*': 'rxjs/*' }; }), 'packages/contracts/src/lib/use.ts': W("import '#rx/operators';\nexport {};\n") }, 1, ['CONTRACTS_NEUTRAL']],
  ['M13', 'contracts exact alias to @angular/core', { 'packages/contracts/package.json': J((p) => { p.imports = { '#ng': '@angular/core' }; }), 'packages/contracts/src/lib/use.ts': W("import '#ng';\nexport {};\n") }, 1, ['CONTRACTS_NEUTRAL']],
  ['M14', 'contracts legit pattern to own files', { 'packages/contracts/package.json': J((p) => { p.imports = { '#core/*': './src/lib/core/*.ts' }; }), 'packages/contracts/src/lib/core/id.ts': W('export type Id = string;\n'), 'packages/contracts/src/lib/use.ts': W("import type { Id } from '#core/id';\nexport type U = Id;\n") }, 0, []],
  // analytics vendor via imports map
  ['M15', 'analytics re-exports vendor through #ec alias', { 'packages/analytics/package.json': J((p) => { p.imports = { '#ec': 'echarts' }; }), 'packages/analytics/src/lib/v.ts': W("export * from '#ec';\n") }, 1, ['ANALYTICS_VENDOR_EXPORT']],
  // unresolvable
  ['M16', 'unresolvable #x (no imports map)', USE('#x'), 1, ['OUTSIDE_PROJECT']],
  ['M17', 'unresolvable #x (map without matching key)', { 'packages/components/package.json': CP({ '#y': './src/lib/x.ts' }), ...X, ...USE('#x') }, 1, ['OUTSIDE_PROJECT']],
  ['M18', '#x in an app (apps have no package.json)', { 'apps/ui-lab/src/app/app.ts': A("import '#x';") }, 1, ['OUTSIDE_PROJECT']],
  ['M19', 'null target (#x: null, Node "not exported")', { 'packages/components/package.json': CP({ '#x': null }), ...USE('#x') }, 1, ['OUTSIDE_PROJECT']],
  ['M20', 'array target (#ent: [bare enterprise])', { 'packages/components/package.json': CP({ '#ent': ['@proseit/paep-enterprise'] }), ...USE('#ent') }, 1, ['DIRECTION']]
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
