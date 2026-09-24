// QA round 7 probes: same-category allowlist (D2). Runs in the scratch copy ./repo; restores with git after each case.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const repo = path.join(path.dirname(new URL(import.meta.url).pathname), 'repo');
const MODEL = 'tooling/architecture-boundaries/architecture-model.json';
const entry = (d) => `packages/${d}/src/index.ts`;
const APP_TS = 'apps/reference-app/src/app/app.ts';
const P = (n) => (n.startsWith('@') || n.includes('app') || n === 'ui-lab' ? n : `@proseit/paep-${n}`);
const pair = (a, b, x = {}) => ({ source: P(a), target: P(b), rationale: 'qa7 probe', approval: 'qa7', ...x });
const allow = (...edges) => [MODEL, (t) => { const m = JSON.parse(t); m.sameCategoryAllowlist.edges = edges; return JSON.stringify(m, null, 2); }];
const app = (line) => (t) => `${t}\n${line}\n`;
const pkgJson = (dir, fn) => [`packages/${dir}/package.json`, (t) => { const p = JSON.parse(t); fn(p); return JSON.stringify(p, null, 2); }];

const cases = [
  ['A01 allowlist names the same pair twice', [allow(pair('domain-quality', 'domain-fiscal'), pair('domain-quality', 'domain-fiscal')), [entry('domain-quality'), app("import '@proseit/paep-domain-fiscal';")]], 'FAIL'],
  ['A02 self edge in allowlist', [allow(pair('domain-quality', 'domain-quality'))], 'FAIL'],
  ['A03 unknown project names in allowlist', [allow(pair('domain-nope', 'domain-fiscal'))], 'FAIL'],
  ['A03b name with trailing space', [allow({ ...pair('domain-quality', 'domain-fiscal'), source: '@proseit/paep-domain-quality ' }), [entry('domain-quality'), app("import '@proseit/paep-domain-fiscal';")]], 'FAIL'],
  ['A03c entry is null / edges not array', [[MODEL, (t) => { const m = JSON.parse(t); m.sameCategoryAllowlist.edges = { 0: pair('domain-quality', 'domain-fiscal') }; return JSON.stringify(m); }], [entry('domain-quality'), app("import '@proseit/paep-domain-fiscal';")]], 'FAIL'],
  ['A03d allowlist removed entirely', [[MODEL, (t) => { const m = JSON.parse(t); delete m.sameCategoryAllowlist; return JSON.stringify(m); }]], 'FAIL'],
  ['A03e approval is whitespace', [allow(pair('domain-quality', 'domain-fiscal', { approval: '  ' }))], 'FAIL'],
  ['A04 chain via other category back to same: domain-quality -> enterprise(Optional) -> domain-fiscal', [[entry('domain-quality'), app("import '@proseit/paep-enterprise';")], [entry('enterprise'), app("import '@proseit/paep-domain-fiscal';")]], 'FAIL'],
  ['A04b same chain with domain-quality->domain-fiscal NOT listed but enterprise edge only transitive', [allow(pair('domain-fiscal', 'domain-iot')), [entry('domain-quality'), app("import '@proseit/paep-enterprise';")], [entry('enterprise'), app("import '@proseit/paep-domain-fiscal';")]], 'FAIL'],
  ['A04c chain listed pairs A->B, B->C, and A->C listed: passes (expected)', [allow(pair('domain-quality', 'domain-fiscal'), pair('domain-fiscal', 'domain-iot'), pair('domain-quality', 'domain-iot')), [entry('domain-quality'), app("import '@proseit/paep-domain-fiscal';")], [entry('domain-fiscal'), app("import '@proseit/paep-domain-iot';")]], 'PASS'],
  ['A04d reversed direction of listed pair', [allow(pair('domain-quality', 'domain-fiscal')), [entry('domain-fiscal'), app("import '@proseit/paep-domain-quality';")]], 'FAIL'],
  ['A05 app -> app unlisted, relative', [[APP_TS, app("import '../../../ui-lab/src/app/app';")]], 'FAIL'],
  ['A05b app -> app allowlisted, relative', [allow(pair('reference-app', 'ui-lab')), [APP_TS, app("import '../../../ui-lab/src/app/app';")]], 'FAIL'],
  ['A05c app -> app allowlisted, rooted import', [allow(pair('reference-app', 'ui-lab')), [APP_TS, app("import 'apps/ui-lab/src/app/app';")]], 'FAIL'],
  ['A05d app allowlist entry alone (no edge)', [allow(pair('reference-app', 'ui-lab'))], 'INFO'],
  ['A06 allowlisted edge via relative path into other package', [allow(pair('domain-quality', 'domain-fiscal')), [entry('domain-quality'), app("import '../../domain-fiscal/src/index';")]], 'FAIL'],
  ['A07 allowlisted edge via manifest dependency', [allow(pair('domain-quality', 'domain-fiscal')), pkgJson('domain-quality', (p) => { p.dependencies = { '@proseit/paep-domain-fiscal': '0.0.0' }; })], 'INFO'],
  ['A07b unlisted edge via manifest peerDependency', [pkgJson('domain-quality', (p) => { p.peerDependencies = { '@proseit/paep-domain-fiscal': '0.0.0' }; })], 'FAIL'],
  ['A08 allowlisted edge via # import to relative file in other package', [allow(pair('domain-quality', 'domain-fiscal')), pkgJson('domain-quality', (p) => { p.imports = { '#f': '../domain-fiscal/src/index.ts' }; }), [entry('domain-quality'), app("import '#f';")]], 'FAIL'],
  ['A08b allowlisted edge via # import to bare public name', [allow(pair('domain-quality', 'domain-fiscal')), pkgJson('domain-quality', (p) => { p.imports = { '#f': '@proseit/paep-domain-fiscal' }; }), [entry('domain-quality'), app("import '#f';")]], 'INFO'],
  ['A08c unlisted edge via # import to bare name', [pkgJson('domain-quality', (p) => { p.imports = { '#f': '@proseit/paep-domain-fiscal' }; }), [entry('domain-quality'), app("import '#f';")]], 'FAIL'],
  ['A09 allowlisted edge + target forbidden downstream (domain-fiscal -> frappe-sdk No)', [allow(pair('domain-quality', 'domain-fiscal')), [entry('domain-quality'), app("import '@proseit/paep-domain-fiscal';")], [entry('domain-fiscal'), app("import '@proseit/frappe-sdk';")]], 'FAIL'],
  ['A10 allowlisted edge by /// reference path', [allow(pair('domain-quality', 'domain-fiscal')), [entry('domain-quality'), (t) => `/// <reference path="../../domain-fiscal/src/index.ts" />\n${t}`]], 'FAIL'],
  ['A11 duplicate sameCategoryAllowlist key in raw JSON (last wins)', [[MODEL, (t) => t.replace('"sameCategoryAllowlist": {', '"sameCategoryAllowlist": {"edges": [{"source":"@proseit/paep-domain-quality","target":"@proseit/paep-domain-fiscal","rationale":"x","approval":"y"}]},\n  "sameCategoryAllowlist": {')], [entry('domain-quality'), app("import '@proseit/paep-domain-fiscal';")]], 'FAIL'],
];

const sh = (cmd, args) => spawnSync(cmd, args, { cwd: repo, encoding: 'utf8', maxBuffer: 1 << 26 });
const out = [];
for (const [name, edits, want] of cases) {
  for (const [f, fn] of edits) { const p = path.join(repo, f); fs.writeFileSync(p, fn(fs.readFileSync(p, 'utf8'))); }
  const r = sh(process.execPath, ['tooling/architecture-boundaries/check-boundaries.mjs', '--json']);
  let j = null; try { j = JSON.parse(r.stdout); } catch {}
  const rules = j ? [...new Set(j.violations.map((v) => v.rule))].join(',') : 'n/a';
  const msgs = j ? j.violations.map((v) => `    ${v.rule}: ${v.message}`).join('\n') : r.stdout + r.stderr;
  const got = r.status === 0 ? 'PASS' : 'FAIL';
  const verdict = want === 'INFO' ? 'INFO' : got === want ? 'OK' : 'UNEXPECTED';
  out.push(`${verdict} ${name}: exit ${r.status} (${got}) rules=[${rules}]\n${msgs}`);
  sh('git', ['checkout', '--', '.']);
  sh('git', ['clean', '-fdq', '-e', 'node_modules']);
}
const txt = out.join('\n');
fs.writeFileSync(path.join(path.dirname(repo), 'probe-allowlist.log'), txt + '\n');
console.log(txt);
