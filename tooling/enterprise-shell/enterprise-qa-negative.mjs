#!/usr/bin/env node
/**
 * Seeded negatives for the IB3 enterprise-shell static gate (npm run qa:enterprise:negative).
 *
 * One disposable copy of the repository (with .git, without node_modules) is made. P00 runs the gate on it unchanged
 * and must reproduce the gate's result on the repository exactly. Every other case applies one mutation, runs
 * enterprise-qa.mjs --root <copy> --json, restores the copy, and passes only when its target check FAILS with the
 * expected finding. P01 and P02 are E10 positives against synthetic baselines (see below). The case count is pinned.
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
const EXPECTED_CASES = 55;
/** P00, the IB3 E10 positives P01-P02 and the IB4 rescoping positives P03-P07 (E10, E09, E01). */
const CONTROLS = 8;
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

function negative(id, name, edits, target, finding, expectPass = false, { setup, teardown } = {}) {
  const saved = new Map();
  let r;
  try {
    setup?.();
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
    teardown?.();
  }
  const c = r.report?.checks.find((x) => x.id === target);
  const pass = expectPass ? Boolean(c) && c.pass : r.status === 1 && Boolean(c) && !c.pass && finding.test(c.detail);
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
// N26 (IB4 D9): the contracts source is admitted inside the Generation 6 scope, so the frozen-contracts case targets the
// contracts manifest, which stays frozen in every generation.
negative('N26', 'paep-contracts manifest changed', [['packages/contracts/package.json', (t) => t.replace(/\n$/, '\n\n')]], 'E09', /changed: packages\/contracts\/package\.json/);
negative('N27', 'CLAUDE.md widened beyond the one approved line', [['CLAUDE.md', append('- Claude may accept its own work packages.')]], 'E10', /differs from the baseline plus the one approved amendment/);
negative('N28', 'commercial-template term in an enterprise stylesheet', [[`${ENT}/lib/shell/shell.css`, append('/* adapted from primeng layout */')]], 'E11', /shell\.css: forbidden term \/primeng\/i/);
negative('N29', 'Angular favicon.ico back in the reference app', [['apps/reference-app/public/favicon.ico', () => 'ico']], 'E11', /favicon\.ico \(Angular logo\) still present/);
negative('N30', 'reference-app favicon is not the approved placeholder mark', [['apps/reference-app/public/favicon.svg', (t) => t.replace('M9 22L16 9l7 13', 'M8 24L16 8l8 16')]], 'E11', /not the approved placeholder mark/);
const HOF = 'evidence/design-handoff/HOF-IB3-001/handoff';
negative('N31', 'retained HOF manifest edited', [[`${HOF}/handoff.manifest.yaml`, (t) => t.replace('status: APPROVED_FOR_IMPLEMENTATION', 'status: READY_FOR_PO_SA_REVIEW')]], 'E12', /manifest sha256 [0-9a-f]+ != approved.*status is not APPROVED_FOR_IMPLEMENTATION/);
negative('N32', 'retained handoff file altered', [[`${HOF}/component-map.md`, append('| E-15 | an unapproved part |')]], 'E12', /handoff file component-map\.md sha256/);
negative('N33', 'unlisted file in the retained handoff', [[`${HOF}/screens/SCR-SHELL-099--extra.html`, () => '<p>extra</p>']], 'E12', /unlisted file .*SCR-SHELL-099--extra\.html/);

// E10 is baseline-aware (PO/SA authorisation 2026-10-15). Each case points the registry's active ACCEPTED generation at a
// synthetic baseline: a commit object equal to the copy's HEAD with CLAUDE.md replaced, made with a private index so
// neither HEAD nor the working tree moves. A baseline without the approved amendment (before promotion) and one that
// already carries it (after promotion) are both exercised, whatever the repository's own active baseline is.
const CLAUDE_OLD = '- Do not implement analytics/reporting UI, offline queues, the enterprise shell, or domain kits.';
const CLAUDE_NEW_PREFIX = '- Do not implement analytics/reporting UI, offline queues, or domain kits. Do not implement the enterprise shell, except under';
const REGISTRY = 'tooling/governance/baseline-registry.json';
const claudeNow = fs.readFileSync(path.join(copy, 'CLAUDE.md'), 'utf8');
const approvedLine = claudeNow.split('\n').find((l) => l.startsWith(CLAUDE_NEW_PREFIX));
if (!approvedLine) throw new Error('CLAUDE.md carries no approved IB3 amendment line');
const withoutAmendment = claudeNow.replace(approvedLine, CLAUDE_OLD);
const withNeither = claudeNow.replace(`${approvedLine}\n`, '');
const gitIn = (args, opts = {}) => spawnSync('git', ['-C', copy, ...args], { encoding: 'utf8', ...opts });
function baselineCommit(claudeText) {
  const env = { ...process.env, GIT_INDEX_FILE: path.join(scratch, 'baseline.index') };
  gitIn(['read-tree', 'HEAD'], { env });
  const blob = gitIn(['hash-object', '-w', '--stdin'], { input: claudeText }).stdout.trim();
  gitIn(['update-index', '--cacheinfo', `100644,${blob},CLAUDE.md`], { env });
  const tree = gitIn(['write-tree'], { env }).stdout.trim();
  const commit = gitIn(['-c', 'user.name=paep-negative', '-c', 'user.email=paep-negative@invalid', 'commit-tree', tree, '-p', 'HEAD', '-m', 'synthetic E10 baseline']).stdout.trim();
  fs.rmSync(env.GIT_INDEX_FILE, { force: true });
  if (!/^[0-9a-f]{40}$/.test(commit)) throw new Error('synthetic E10 baseline commit not created');
  return commit;
}
const atBaseline = (commit) => [REGISTRY, (t) => {
  const reg = JSON.parse(t);
  const active = [...reg.generations].reverse().find((g) => g.status === 'ACCEPTED');
  active.acceptedCommit = commit;
  return `${JSON.stringify(reg, null, 2)}\n`;
}];
const preBase = baselineCommit(withoutAmendment);
const postBase = baselineCommit(claudeNow);
const drift = append('- Claude may accept its own work packages.');
negative('P01', 'control: E10 passes when the baseline lacks the amendment and CLAUDE.md adds exactly the approved line', [atBaseline(preBase)], 'E10', null, true);
negative('N35', 'E10 baseline without the amendment: CLAUDE.md lacks the approved line', [atBaseline(preBase), ['CLAUDE.md', () => withoutAmendment]], 'E10', /differs from the baseline plus the one approved amendment/);
negative('N36', 'E10 baseline without the amendment: approved line plus unrelated drift', [atBaseline(preBase), ['CLAUDE.md', drift]], 'E10', /differs from the baseline plus the one approved amendment/);
negative('P02', 'control: E10 passes when the baseline already carries the amendment and CLAUDE.md equals it', [atBaseline(postBase)], 'E10', null, true);
negative('N37', 'E10 baseline with the amendment: CLAUDE.md differs from it', [atBaseline(postBase), ['CLAUDE.md', drift]], 'E10', /differs from the baseline plus the one approved amendment/);
negative('N38', 'E10 baseline with the amendment: CLAUDE.md reverts to the pre-amendment line', [atBaseline(postBase), ['CLAUDE.md', () => withoutAmendment]], 'E10', /differs from the baseline plus the one approved amendment/);
negative('N39', 'E10 fails closed when the baseline has neither the original nor the approved line', [atBaseline(baselineCommit(withNeither))], 'E10', /baseline CLAUDE\.md lacks the amended line/);

// IB4 rescoping (PO/SA authorisation 2026-10-15, D9). The same synthetic-baseline technique proves E10 for the IB4 line
// before and after Generation 6 promotion, and E09 / E01 for the admitted adapter and contracts sources.
const FRAPPE_OLD = '- Do not implement Frappe/ERPNext integration in this work package.';
const FRAPPE_NEW_PREFIX = '- Do not implement Frappe/ERPNext integration, except under';
const frappeLine = claudeNow.split('\n').find((l) => l.startsWith(FRAPPE_NEW_PREFIX));
if (!frappeLine) throw new Error('CLAUDE.md carries no approved IB4 amendment line');
const frappePending = claudeNow.replace(frappeLine, FRAPPE_OLD);
const frappePre = baselineCommit(frappePending);
const broadened = (t) => t.replace(frappeLine, frappeLine.replace('the PO/SA-authorised work package `IB4-FRAPPE-ADAPTER`', 'the PO/SA-authorised work packages `IB4-FRAPPE-ADAPTER` and its successors'));
negative('P03', 'control: E10 passes when the baseline lacks the IB4 amendment and CLAUDE.md adds exactly the approved IB4 line', [atBaseline(frappePre)], 'E10', null, true);
negative('N40', 'E10 before G6 promotion: CLAUDE.md lacks the approved IB4 line', [atBaseline(frappePre), ['CLAUDE.md', () => frappePending]], 'E10', /differs from the baseline plus the one approved amendment/);
negative('N41', 'E10 before G6 promotion: the IB4 line is broadened', [atBaseline(frappePre), ['CLAUDE.md', broadened]], 'E10', /differs from the baseline plus the one approved amendment/);
negative('N42', 'E10 before G6 promotion: the IB4 line is removed', [atBaseline(frappePre), ['CLAUDE.md', (t) => t.replace(`${frappeLine}\n`, '')]], 'E10', /differs from the baseline plus the one approved amendment/);
negative('P04', 'control: E10 passes after G6 promotion when CLAUDE.md equals the promoted baseline', [atBaseline(postBase)], 'E10', null, true);
negative('N43', 'E10 after G6 promotion: CLAUDE.md reverts to the pre-IB4 line', [atBaseline(postBase), ['CLAUDE.md', () => frappePending]], 'E10', /differs from the baseline plus the one approved amendment/);
negative('N44', 'E10 after G6 promotion: the IB4 line is broadened', [atBaseline(postBase), ['CLAUDE.md', broadened]], 'E10', /differs from the baseline plus the one approved amendment/);
negative('N45', 'E10 fails closed when two amendments are pending at once', [atBaseline(baselineCommit(withoutAmendment.replace(frappeLine, FRAPPE_OLD)))], 'E10', /2 pending amendments/);
negative('N46', 'E10 fails closed when the baseline has neither the original nor the approved IB4 line', [atBaseline(baselineCommit(claudeNow.replace(`${frappeLine}\n`, '')))], 'E10', /baseline CLAUDE\.md lacks the amended line/);

const SDK = 'packages/frappe-sdk/src/index.ts';
const regEdit = (fn) => [REGISTRY, (t) => { const reg = JSON.parse(t); fn(reg); return `${JSON.stringify(reg, null, 2)}\n`; }];
const candidateOf = (reg) => reg.generations.find((g) => g.status === 'CANDIDATE');
// "Promoted": the candidate becomes the active ACCEPTED generation at a synthetic commit equal to the copy's tree.
const promotedAt = (commit) => regEdit((reg) => { const c = candidateOf(reg); c.status = 'ACCEPTED'; c.acceptedCommit = commit; });
negative('N47', 'E09: frappe-sdk manifest changed (outside the admitted sources)', [['packages/frappe-sdk/package.json', (t) => t.replace(/\n$/, '\n\n')]], 'E09', /changed: packages\/frappe-sdk\/package\.json/);
negative('N48', 'E09: candidate scope widened to analytics, analytics source changed', [regEdit((reg) => { candidateOf(reg).authorisedScope.push('packages/analytics/src/'); }), ['packages/analytics/src/index.ts', append('// probe')]], 'E09', /changed: packages\/analytics\/src\/index\.ts/);
negative('N49', 'E09: contracts source changed with no candidate in the registry', [regEdit((reg) => { reg.generations = reg.generations.filter((g) => g.status !== 'CANDIDATE'); }), ['packages/contracts/src/index.ts', append('// probe')]], 'E09', /changed: packages\/contracts\/src\/index\.ts/);
negative('N50', 'E09: frappe-sdk source changed while the candidate scope omits it', [regEdit((reg) => { const c = candidateOf(reg); c.authorisedScope = c.authorisedScope.filter((e) => e !== 'packages/frappe-sdk/src/'); }), [SDK, append('// probe')]], 'E09', /changed: packages\/frappe-sdk\/src\/index\.ts/);
negative('N51', 'E09: a frozen file moved into the admitted adapter source (rename detection off)', [], 'E09', /changed: packages\/offline\/src\/index\.ts/, false, {
  setup: () => gitIn(['mv', 'packages/offline/src/index.ts', 'packages/frappe-sdk/src/moved.ts']),
  teardown: () => gitIn(['mv', 'packages/frappe-sdk/src/moved.ts', 'packages/offline/src/index.ts']),
});
negative('P05', 'control: E09 admits an in-scope frappe-sdk source change while the G6 candidate is open', [[SDK, append('// probe')]], 'E09', null, true);
const promotedBase = baselineCommit(claudeNow);
negative('P06', 'control: E09 passes after G6 promotion when nothing changed since the promoted baseline', [promotedAt(promotedBase)], 'E09', null, true);
negative('N52', 'E09 after G6 promotion: a frappe-sdk source change is frozen again (no candidate)', [promotedAt(promotedBase), [SDK, append('// probe')]], 'E09', /changed: packages\/frappe-sdk\/src\/index\.ts/);

const lazyApp = "import type { FrappeAdapter } from '@proseit/frappe-sdk';\nexport const loadAdapter = (): Promise<FrappeAdapter> => import('@proseit/frappe-sdk').then((m) => m.createFrappeAdapter);";
negative('N53', 'E01: reference app value-imports frappe-sdk statically (eager)', [[APP_TS, (t) => `import { createFrappeAdapter } from '@proseit/frappe-sdk';\n${t}`]], 'E01', /app\.ts: @proseit\/frappe-sdk must be imported lazily/);
negative('N54', 'E01: reference app dynamic import with a non-literal specifier', [[APP_TS, append("const sdk = '@proseit/frappe-sdk';\nexport const loadAny = () => import(sdk);")]], 'E01', /app\.ts: dynamic import\(\) with a non-literal specifier/);
negative('N56', 'E01: reference app deep-imports frappe-sdk lazily', [[APP_TS, append("export const loadDeep = () => import('@proseit/frappe-sdk/src/lib/transport');")]], 'E01', /app\.ts: @proseit\/frappe-sdk\/src\/lib\/transport/);
negative('P07', 'control: E01 passes when the reference app imports frappe-sdk only lazily and type-only', [[APP_TS, append(lazyApp)]], 'E01', null, true);

fs.rmSync(scratch, { recursive: true, force: true });
const coverage = [];
if (results.length !== EXPECTED_CASES + CONTROLS) coverage.push(`${results.length - CONTROLS} negative cases (expected ${EXPECTED_CASES})`);
for (const r of results) console.log(`${r.pass ? 'PASS' : 'FAIL'} ${r.id} ${r.name} — ${r.detail}`);
for (const c of coverage) console.log(`FAIL ${c}`);
const failed = results.filter((r) => !r.pass).length + coverage.length;
console.log(`\nPAEP enterprise-shell QA negatives: ${failed ? 'FAIL' : 'PASS'} (${results.filter((r) => r.pass).length}/${results.length}; ${EXPECTED_CASES} seeded negatives + ${CONTROLS} controls)`);
process.exit(failed ? 1 : 0);
