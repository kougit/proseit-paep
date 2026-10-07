#!/usr/bin/env node
/**
 * Seeded negatives for the IB3 enterprise-shell static gate (npm run qa:enterprise:negative).
 *
 * One disposable copy of the repository (with .git, without node_modules) is made. P00 runs the gate on it unchanged
 * and must reproduce the gate's result on the repository exactly. Every other case applies one mutation, runs
 * enterprise-qa.mjs --root <copy> --json, restores the copy, and passes only when its target check FAILS with the
 * expected finding. The case count is pinned.
 *   node tooling/enterprise-shell/enterprise-qa-negative.mjs
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const GATE = path.join(root, 'tooling/enterprise-shell/enterprise-qa.mjs');
const SKIP = new Set(['node_modules', 'dist', '.angular', 'tmp', '.vitest-attachments']);
const EXPECTED_CASES = 34;
const ENT = 'packages/enterprise/src';
const NAV = `${ENT}/lib/nav/nav.ts`;
const SHELL = `${ENT}/lib/shell/shell.ts`;
const INDEX = `${ENT}/index.ts`;
const MESSAGES = `${ENT}/lib/messages/shell-messages.ts`;
const ROUTES = 'apps/reference-app/src/app/app.routes.ts';
const APP_TS = 'apps/reference-app/src/app/app.ts';

const scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'paep-enterprise-negative-'));
const copy = path.join(scratch, 'repo');
fs.cpSync(root, copy, { recursive: true, filter: (src) => !(SKIP.has(path.basename(src)) && path.dirname(src) === root) });

const run = (dir) => {
  const r = spawnSync(process.execPath, [GATE, '--root', dir, '--json'], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  try {
    return { status: r.status, report: JSON.parse(r.stdout) };
  } catch {
    return { status: r.status, report: null, out: `${r.stdout}${r.stderr}` };
  }
};
const append = (line) => (t) => `${t}\n${line}\n`;
const replace = (from, to) => (t) => {
  if (!t.includes(from)) throw new Error(`seed text not found: ${from.slice(0, 60)}`);
  return t.replace(from, to);
};

const results = [];
const summary = (report) => (report?.checks || []).map((c) => `${c.id}:${c.pass ? 'PASS' : 'FAIL'}`).join(' ');

// P00: the unmutated copy reproduces the repository's result.
{
  const here = run(root);
  const there = run(copy);
  const pass = Boolean(here.report && there.report) && summary(here.report) === summary(there.report) && here.status === there.status;
  results.push({ id: 'P00', name: 'control: the unmutated copy reproduces the gate result on the repository', pass, detail: `${summary(there.report)} (exit ${there.status})` });
}

function negative(id, name, edits, target, finding) {
  const saved = new Map();
  let r;
  try {
    for (const [file, fn] of edits) {
      const p = path.join(copy, file);
      const before = fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : null;
      if (!saved.has(file)) saved.set(file, before);
      fs.mkdirSync(path.dirname(p), { recursive: true });
      fs.writeFileSync(p, fn(before ?? ''));
    }
    r = run(copy);
  } catch (e) {
    r = { status: null, report: null, out: `harness error: ${e.message}` };
  } finally {
    for (const [file, before] of saved) {
      const p = path.join(copy, file);
      if (before === null) fs.rmSync(p, { force: true });
      else fs.writeFileSync(p, before);
    }
  }
  const c = r.report?.checks.find((x) => x.id === target);
  const pass = r.status === 1 && Boolean(c) && !c.pass && finding.test(c.detail);
  results.push({ id, name, pass, detail: c ? `${target} ${c.pass ? 'PASS' : 'FAIL'}: ${c.detail}` : r.out || 'no report' });
}

const entImport = (pkg) => [[NAV, append(`import '${pkg}';`)]];
negative('N01', 'enterprise -> frappe-sdk import', entImport('@proseit/frappe-sdk'), 'E01', /nav\.ts: @proseit\/frappe-sdk/);
negative('N02', 'enterprise -> analytics import', entImport('@proseit/paep-analytics'), 'E01', /@proseit\/paep-analytics/);
negative('N03', 'enterprise -> domain package import', entImport('@proseit/paep-domain-quality'), 'E01', /@proseit\/paep-domain-quality/);
negative('N04', 'enterprise -> offline import', entImport('@proseit/paep-offline'), 'E01', /@proseit\/paep-offline/);
negative('N05', 'reference app -> frappe-sdk import', [[APP_TS, (t) => `import '@proseit/frappe-sdk';\n${t}`]], 'E01', /app\.ts: @proseit\/frappe-sdk/);
negative('N06', 'deep import into the components package', entImport('@proseit/paep-components/src/lib/button/button'), 'E01', /paep-components\/src\/lib/);
negative('N07', 'store framework in enterprise', entImport('@ngrx/store'), 'E01', /@ngrx\/store/);
negative('N08', 'relative import that leaves the enterprise package', entImport('../../../../components/src/index'), 'E01', /relative import leaves the package/);
negative('N09', 'unapproved public export', [[INDEX, append("export { PaepShellNavModel } from './lib/nav/nav-model';")]], 'E02', /unapproved export PaepShellNavModel/);
negative('N10', 'approved shell symbol removed from the entry point', [[INDEX, replace("export { PaepShell } from './lib/shell/shell';\n", '')]], 'E02', /missing PaepShell(;|$)/);
negative('N11', 'export * in the entry point', [[INDEX, append("export * from './lib/ports/ports';")]], 'E02', /export \*/);
negative('N12', 'generic primitive selector reimplemented in enterprise', [[`${ENT}/lib/extra/button.ts`, () => "import { Component } from '@angular/core';\n@Component({ selector: 'paep-button', template: '' })\nexport class PrivateButton {}\n"]], 'E03', /selector paep-button/);
negative('N13', 'popover="manual" in an enterprise template', [[SHELL, replace('<ng-content select="[paepShellOverlay]" />', '<div popover="manual"></div><ng-content select="[paepShellOverlay]" />')]], 'E03', /popover used directly/);
negative('N14', 'own <dialog> outside PaepModalBase', [[`${ENT}/lib/extra/panel.ts`, () => "import { Component } from '@angular/core';\n@Component({ selector: 'paep-shell-extra', template: '<dialog></dialog>' })\nexport class Extra {}\n"]], 'E03', /own <dialog> outside PaepModalBase/);
negative('N15', 'private anchor positioning in enterprise CSS', [[`${ENT}/lib/shell/shell.css`, append('.x { position-anchor: --paep-x; }')]], 'E03', /private anchor positioning/);
negative('N16', 'a shell message key removed', [[MESSAGES, (t) => t.replace(/^\s*'paep\.shell\.search\.count':[^\n]*\n/m, '')]], 'E04', /122 keys \(expected 123\)/);
negative('N17', 'an unknown shell key referenced', [[NAV, append("export const PROBE = 'paep.shell.not.approved';")]], 'E04', /unknown key paep\.shell\.not\.approved/);
negative('N34', 'a DDR-IB3-06 key renamed in the catalogue (count unchanged)', [[MESSAGES, (t) => t.replace("'paep.shell.account.button.named':", "'paep.shell.account.label':")]], 'E04', /DDR-IB3-06 key paep\.shell\.account\.button\.named missing/);
negative('N18', '[innerHTML] in an enterprise template', [[SHELL, replace('<ng-content select="[paepShellOverlay]" />', '<div [innerHTML]="x"></div><ng-content select="[paepShellOverlay]" />')]], 'E05', /innerHTML/);
negative('N19', 'window.open in the reference app', [[APP_TS, replace("protected readonly title", "protected readonly probe = () => window.open('https://example.test');\n  protected readonly title")]], 'E05', /window\\\.open/);
negative('N20', 'localStorage in enterprise', [[NAV, append("export const PROBE_STORE = () => localStorage.getItem('x');")]], 'E06', /localStorage/);
negative('N21', 'route guard in the reference app', [[ROUTES, replace("path: 'workspace',", "path: 'workspace', canActivate: [() => true],")]], 'E07', /route guard/);
negative('N22', 'permission guard exported by enterprise', [[NAV, append("import type { CanMatchFn } from '@angular/router';\nexport const probeGuard: CanMatchFn = () => true;")]], 'E07', /nav\.ts: route guard/);
negative('N23', '/login route in the reference app', [[ROUTES, replace("path: 'workspace',", "path: 'login',")]], 'E08', /unapproved route "login"/);
negative('N24', 'package-lock.json changed', [['package-lock.json', (t) => t.replace(/\n$/, '\n\n')]], 'E09', /changed: package-lock\.json/);
negative('N25', 'new devDependency', [['package.json', (t) => { const p = JSON.parse(t); p.devDependencies = { ...p.devDependencies, 'left-pad': '1.3.0' }; return JSON.stringify(p, null, 2) + '\n'; }]], 'E09', /package\.json devDependencies changed/);
negative('N26', 'paep-contracts changed', [['packages/contracts/src/index.ts', append('// probe')]], 'E09', /changed: packages\/contracts\/src\/index\.ts/);
negative('N27', 'CLAUDE.md widened beyond the one approved line', [['CLAUDE.md', append('- Claude may accept its own work packages.')]], 'E10', /differs from the baseline plus the one approved amendment/);
negative('N28', 'commercial-template term in an enterprise stylesheet', [[`${ENT}/lib/shell/shell.css`, append('/* adapted from primeng layout */')]], 'E11', /shell\.css: forbidden term \/primeng\/i/);
negative('N29', 'Angular favicon.ico back in the reference app', [['apps/reference-app/public/favicon.ico', () => 'ico']], 'E11', /favicon\.ico \(Angular logo\) still present/);
negative('N30', 'reference-app favicon is not the approved placeholder mark', [['apps/reference-app/public/favicon.svg', (t) => t.replace('M9 22L16 9l7 13', 'M8 24L16 8l8 16')]], 'E11', /not the approved placeholder mark/);
const HOF = 'evidence/design-handoff/HOF-IB3-001/handoff';
negative('N31', 'retained HOF manifest edited', [[`${HOF}/handoff.manifest.yaml`, (t) => t.replace('status: APPROVED_FOR_IMPLEMENTATION', 'status: READY_FOR_PO_SA_REVIEW')]], 'E12', /manifest sha256 [0-9a-f]+ != approved.*status is not APPROVED_FOR_IMPLEMENTATION/);
negative('N32', 'retained handoff file altered', [[`${HOF}/component-map.md`, append('| E-15 | an unapproved part |')]], 'E12', /handoff file component-map\.md sha256/);
negative('N33', 'unlisted file in the retained handoff', [[`${HOF}/screens/SCR-SHELL-099--extra.html`, () => '<p>extra</p>']], 'E12', /unlisted file .*SCR-SHELL-099--extra\.html/);

fs.rmSync(scratch, { recursive: true, force: true });
const coverage = [];
if (results.length !== EXPECTED_CASES + 1) coverage.push(`${results.length - 1} negative cases (expected ${EXPECTED_CASES})`);
for (const r of results) console.log(`${r.pass ? 'PASS' : 'FAIL'} ${r.id} ${r.name} — ${r.detail}`);
for (const c of coverage) console.log(`FAIL ${c}`);
const failed = results.filter((r) => !r.pass).length + coverage.length;
console.log(`\nPAEP enterprise-shell QA negatives: ${failed ? 'FAIL' : 'PASS'} (${results.filter((r) => r.pass).length}/${results.length}; ${EXPECTED_CASES} seeded negatives + control)`);
process.exit(failed ? 1 : 0);
