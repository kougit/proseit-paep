#!/usr/bin/env node
/**
 * IB2 CI-governance negative suite (npm run qa:ib2:ci-negative), run in PAEP / components so that
 * PAEP / negative-ci keeps its accepted workload and 20-minute timeout (RR14).
 *
 * Proves that the IB2 jobs are mandatory and that the IB2 bounds in verify-ib0-wp05.mjs are narrow. Each case
 * mutates a disposable scratch copy of the repository (with .git; node_modules hard-linked read-only, as in
 * negative-ib0-wp05.mjs), commits nothing in the real tree, and runs the provenance gate, expecting the stated
 * failure. P00 is the positive control on the unmutated copy. I16–I26 cover the PAEP / negative-ci split (PO/SA,
 * 2026-09-28); I23 and I26 run the WP05 negative harness itself with an invalid --part, and I24/I25 run a
 * weakened copy of it (part b only).
 *   node tooling/design-system/ci-governance-negative.mjs            every case (CI)
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const WORKFLOW = '.github/workflows/paep-ci.yml';
const POLICY = 'tooling/verification/ib0-wp05-ci-policy.json';
const REVIEW = 'docs/licences/THIRD-PARTY-LICENCE-REVIEW.md';
const env = { ...process.env, NO_COLOR: '1', FORCE_COLOR: '0', NG_CLI_ANALYTICS: 'false' };
delete env.PAEP_EVIDENCE_DIR;
delete env.GITHUB_STEP_SUMMARY;

const scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'paep-ib2-ci-negative-'));
const copy = path.join(scratch, 'repo');
const SKIP = new Set(['node_modules', 'dist', '.angular', 'tmp', '.vitest-attachments']);
fs.cpSync(root, copy, { recursive: true, filter: (src) => !(SKIP.has(path.basename(src)) && path.dirname(src) === root) });
if (spawnSync('cp', ['-al', path.join(root, 'node_modules'), path.join(copy, 'node_modules')]).status !== 0) {
  fs.symlinkSync(path.join(root, 'node_modules'), path.join(copy, 'node_modules'), 'dir');
}
fs.appendFileSync(path.join(copy, '.git', 'info', 'exclude'), '\n/node_modules\n');
const git = (...a) => spawnSync('git', a, { cwd: copy, encoding: 'utf8', env });
const snapshot = () => {
  git('add', '-A');
  git('-c', 'user.name=paep-negative', '-c', 'user.email=paep-negative@invalid', 'commit', '-q', '--no-verify', '-m', 'scratch snapshot', '--allow-empty');
};
snapshot();

const WP05_HARNESS = 'tooling/verification/negative-ib0-wp05.mjs';
const replace = (from, to) => (t) => { if (!t.includes(from)) throw new Error(`mutation anchor not found: ${from.slice(0, 60)}`); return t.replace(from, to); };
const ONLY_G01_IN_B = (t) => replace('  declared.push(id);\n', "  declared.push(id);\n  if (PART === 'b' && id !== 'G01') { delegated.push(id); return false; }\n")(t);
const jsonEdit = (fn) => (t) => { const o = JSON.parse(t); fn(o); return `${JSON.stringify(o, null, 2)}\n`; };
const gate = (g) => {
  const HARNESS = { 'part-x': ['--part', 'x'], 'part-twice': ['--part', 'a', '--part', 'b'], 'wp05-part-b': ['--part', 'b'] };
  const cmd = HARNESS[g] ? ['tooling/verification/negative-ib0-wp05.mjs', ...HARNESS[g]] : ['tooling/verification/verify-ib0-wp05.mjs', '--gate', g];
  const r = spawnSync(process.execPath, cmd, { cwd: copy, encoding: 'utf8', env, maxBuffer: 256 * 1024 * 1024 });
  return { status: r.status, out: `${r.stdout || ''}${r.stderr || ''}` };
};

function angularJsonInCandidateScope() {
  const reg = JSON.parse(fs.readFileSync(path.join(copy, 'tooling/governance/baseline-registry.json'), 'utf8'));
  return reg.generations.some((g) => g.status === 'CANDIDATE' && (g.authorisedScope || []).includes('angular.json'));
}

const cases = [
  ['P00', 'positive control: unmutated copy passes the provenance gate', [], 'provenance', null],
  ['I01', 'components job dropped from the gate needs', [[WORKFLOW, replace('      - components\n      - accessibility\n', '      - accessibility\n')]], 'provenance', [/FAIL W12/]],
  ['I02', 'accessibility job dropped from the gate needs and MANDATORY_JOBS', [[WORKFLOW, (t) => replace('      - accessibility\n      - negative-ci-b\n', '      - negative-ci-b\n')(t).replace(' accessibility negative-ci-b', ' negative-ci-b')]], 'provenance', [/FAIL W12/]],
  ['I03', 'component tests replaced by a no-op in the workflow', [[WORKFLOW, replace('          npm run test:components 2>&1', '          echo skipped 2>&1')]], 'provenance', [/FAIL W11/]],
  ['I04', 'axe-core browser gate removed from the accessibility job', [[WORKFLOW, replace('          npm run qa:accessibility 2>&1', '          echo skipped 2>&1')]], 'provenance', [/FAIL W11/]],
  ['I05', 'PAEP / negative-ci timeout raised from 20 to 30 minutes (RR14)', [[WORKFLOW, (t) => { const i = t.indexOf('  negative-ci:\n'); const j = t.indexOf('timeout-minutes: 20', i); if (i < 0 || j < 0) throw new Error('negative-ci timeout anchor not found'); return `${t.slice(0, j)}timeout-minutes: 30${t.slice(j + 'timeout-minutes: 20'.length)}`; }]], 'provenance', [/FAIL W11/, /negative-ci timeout-minutes 30/]],
  ['I06', 'axe-core licence review row L5 removed (V15 bound requires it)', [[REVIEW, replace('| L5 | axe-core |', '| LX | axe-core |')]], 'provenance', [/FAIL W16/, /V15 outside the bound/]],
  ['I07', 'a second MPL-2.0 package outside the reviewed set (V15 bound is axe-core only)', [['package-lock.json', jsonEdit((o) => { o.packages['node_modules/pngjs'].license = 'MPL-2.0'; })]], 'provenance', [/FAIL W16/, /V15 outside the bound/]],
  ['I08', 'axe-core moved to runtime scope (V15 bound is dev scope only)', [['package-lock.json', jsonEdit((o) => { delete o.packages['node_modules/axe-core'].dev; })]], 'provenance', [/FAIL W16/]],
  ['I10', 'an unapproved dev dependency added with package.json and the lockfile (V13 bound is the four approved packages only)', [['package.json', jsonEdit((o) => { o.devDependencies['left-pad'] = '1.3.0'; })], ['package-lock.json', jsonEdit((o) => { o.packages[''].devDependencies['left-pad'] = '1.3.0'; })]], 'provenance', [/FAIL W16/, /V13 outside the bound/]],
  ['I11', 'an approved package declared as a runtime dependency (V13 bound is dev scope only)', [['package.json', jsonEdit((o) => { o.dependencies['axe-core'] = o.devDependencies['axe-core']; delete o.devDependencies['axe-core']; })], ['package-lock.json', jsonEdit((o) => { const r = o.packages['']; r.dependencies['axe-core'] = r.devDependencies['axe-core']; delete r.devDependencies['axe-core']; })]], 'provenance', [/FAIL W16/, /V13 outside the bound/]],
  ['I12', 'accessibility job silently skipped (if: false on the job)', [[WORKFLOW, replace('    name: PAEP / accessibility\n', '    name: PAEP / accessibility\n    if: ${{ false }}\n')]], 'provenance', [/FAIL W11/, /FAIL W13/]],
  ['I13', 'responsive/visual browser gate removed from the policy and the workflow together', [[POLICY, jsonEdit((o) => { o.requiredCommands.accessibility = o.requiredCommands.accessibility.filter((c) => c !== 'npm run qa:accessibility'); })], [WORKFLOW, (t) => { const a = t.indexOf('      - name: IB2 axe-core'); const b = t.indexOf('      - name: IB2 accessibility negative suite'); if (a < 0 || b < 0) throw new Error('anchor not found'); return t.slice(0, a) + t.slice(b); }]], 'provenance', [/FAIL W11/, /IB2 command "npm run qa:accessibility" dropped from accessibility/]],
  ['I14', 'component test command removed from the policy and the workflow together', [[POLICY, jsonEdit((o) => { o.requiredCommands.components = o.requiredCommands.components.filter((c) => c !== 'npm run test:components'); })], [WORKFLOW, (t) => { const a = t.indexOf('      - name: IB2 foundation and component behaviour tests'); const b = t.indexOf('      - name: ', a + 10); if (a < 0 || b < 0) throw new Error('anchor not found'); return t.slice(0, a) + t.slice(b); }]], 'provenance', [/FAIL W11/, /IB2 command "npm run test:components" dropped from components/]],
  // IB2 CI-performance split (PO/SA, 2026-09-28): either half of the WP05 negative suite removed, skipped, weakened or
  // left out of PAEP / gate fails; the harness refuses any part other than a, b or c (three-way split, PO/SA 2026-10-07).
  ['I16', 'negative-ci-b dropped from the gate needs and MANDATORY_JOBS', [[WORKFLOW, (t) => replace('      - accessibility\n      - negative-ci-b\n', '      - accessibility\n')(t).replace(' accessibility negative-ci-b build-reference-app', ' accessibility build-reference-app')]], 'provenance', [/FAIL W12/]],
  ['I17', 'negative-ci-b removed from the policy, the workflow and the gate together', [[POLICY, jsonEdit((o) => { o.mandatoryJobs = o.mandatoryJobs.filter((j) => j.id !== 'negative-ci-b'); delete o.requiredCommands['negative-ci-b']; })], [WORKFLOW, (t) => { const a = t.indexOf('  # IB2 CI-performance split'); const b = t.indexOf('  regression:\n', a); if (a < 0 || b < 0) throw new Error('negative-ci-b anchor not found'); return replace('      - accessibility\n      - negative-ci-b\n', '      - accessibility\n')(t.slice(0, a) + t.slice(b)).replace(' accessibility negative-ci-b build-reference-app', ' accessibility build-reference-app'); }]], 'provenance', [/FAIL W11/, /IB2 mandatory job negative-ci-b removed or renamed/, /accepted commands of negative-ci changed|accepted mandatory job negative-ci-b removed or renamed/]],
  ['I18', 'negative-ci-b silently skipped (if: false on the job)', [[WORKFLOW, replace('    name: PAEP / negative-ci-b\n', '    name: PAEP / negative-ci-b\n    if: ${{ false }}\n')]], 'provenance', [/FAIL W11/, /FAIL W13/]],
  ['I19', 'both halves run part a (part b never runs), in the policy and the workflow together', [[POLICY, jsonEdit((o) => { o.requiredCommands['negative-ci-b'] = ['npm run qa:ib0-wp05:negative -- --part a']; })], [WORKFLOW, replace('npm run qa:ib0-wp05:negative -- --part b 2>&1', 'npm run qa:ib0-wp05:negative -- --part a 2>&1')]], 'provenance', [/FAIL W11/, /IB2 command "npm run qa:ib0-wp05:negative -- --part b" dropped from negative-ci-b/]],
  ['I20', 'PAEP / negative-ci-b timeout raised from 20 to 30 minutes (RR14)', [[WORKFLOW, (t) => { const i = t.indexOf('  negative-ci-b:\n'); const j = t.indexOf('timeout-minutes: 20', i); if (i < 0 || j < 0) throw new Error('negative-ci-b timeout anchor not found'); return `${t.slice(0, j)}timeout-minutes: 30${t.slice(j + 'timeout-minutes: 20'.length)}`; }]], 'provenance', [/FAIL W11/, /negative-ci-b timeout-minutes 30/]],
  ['I21', 'part a dropped from negative-ci in the policy and the workflow together', [[POLICY, jsonEdit((o) => { o.requiredCommands['negative-ci'] = o.requiredCommands['negative-ci'].filter((c) => !c.includes('--part a')); })], [WORKFLOW, (t) => { const a = t.indexOf('      - name: CI-control negative tests, part a of 3'); const b = t.indexOf('      - name: ', a + 10); if (a < 0 || b < 0) throw new Error('part a anchor not found'); return t.slice(0, a) + t.slice(b); }]], 'provenance', [/FAIL W11/, /accepted commands of negative-ci changed/]],
  ['I22', 'part b replaced by a no-op in the workflow', [[WORKFLOW, replace('          npm run qa:ib0-wp05:negative -- --part b 2>&1', '          echo skipped 2>&1')]], 'provenance', [/FAIL W11/]],
  ['I23', 'the WP05 negative harness run with an unknown part (fails closed before any case)', [], 'part-x', [/FAIL --part must be a, b or c/]],
  // The harness itself weakened: part b silently delegating its own cases (I24), or a declaration dropped or renamed
  // (I25), fails the pinned-coverage check. Both mutations keep part b to one cheap case so the case stays fast.
  ['I24', 'WP05 harness part b delegates its own cases (runs only G01)', [[WP05_HARNESS, ONLY_G01_IN_B]], 'wp05-part-b', [/FAIL part b ran 1 of 105 declared cases; expected exactly its 32/]],
  ['I25', 'WP05 harness case K07 renamed (declared list differs from the pinned list)', [[WP05_HARNESS, (t) => replace("caseRun('K07',", "caseRun('K07x',")(ONLY_G01_IN_B(t))]], 'wp05-part-b', [/FAIL declared case list differs from the pinned list: missing K07; extra K07x/]],
  ['I26', 'the WP05 negative harness run with --part given twice (fails closed before any case)', [], 'part-twice', [/FAIL --part given more than once/]],
  ['I15', 'candidate scope bypass: a governed file outside the generation 4 scope changed', [['tooling/architecture-boundaries/check-boundaries.mjs', (t) => `${t}// drift\n`]], 'governance', [/FAIL W07/, /FAIL W26/, /unauthorised change: tooling\/architecture-boundaries/]],
  // While a CANDIDATE holds angular.json in its scope, WP02's protected-path finding (V17) is bounded and only W20/W21
  // fail; once no open CANDIDATE scope holds it (after promotion, or a later work package without it), W22 fails too.
  ['I09', 'angular.json changed beyond the ui-lab test target (WP03 V06 bound)', [['angular.json', jsonEdit((o) => { o.projects['ui-lab'].architect.build.options.sourceMap = true; })]], 'regression', [/FAIL W20/, /FAIL W21/, ...(angularJsonInCandidateScope() ? [] : [/FAIL W22/]), /V06 outside/]],
];

const results = [];
for (const [id, name, edits, g, expect] of cases) {
  const saved = new Map();
  let r;
  let snapped = false;
  try {
    for (const [f, fn] of edits) {
      const p = path.join(copy, f);
      saved.set(p, fs.readFileSync(p));
      fs.writeFileSync(p, fn(fs.readFileSync(p, 'utf8')));
    }
    if (edits.length) { snapshot(); snapped = true; }
    r = gate(g);
  } catch (e) {
    r = { status: null, out: `harness error: ${e.stack || e}` };
  } finally {
    if (edits.length) {
      for (const [p, c] of saved) fs.writeFileSync(p, c);
      // Drop only this case's own snapshot: a mutation that throws before its snapshot must not reset the base copy.
      if (snapped) git('reset', '-q', '--hard', 'HEAD~1');
    }
  }
  // A failure case passes only when exactly the expected W checks fail (nothing else is broken) with the expected text.
  const failedW = [...new Set([...r.out.matchAll(/^FAIL (W\d+)/gm)].map((m) => m[1]))].sort();
  const wantW = expect ? [...new Set(expect.map((re) => /FAIL (W\d+)/.exec(re.source)?.[1]).filter(Boolean))].sort() : [];
  const pass = expect
    ? r.status !== 0 && r.status !== null && expect.every((re) => re.test(r.out)) && JSON.stringify(failedW) === JSON.stringify(wantW)
    : r.status === 0 && failedW.length === 0;
  results.push({ id, name, gate: g, expected: expect ? `exit != 0 matching ${expect.map(String).join(', ')}` : 'exit 0', exit: r.status, pass });
  const fails = r.out.split('\n').filter((l) => /^FAIL W/.test(l) || /^harness error/.test(l)).map((l) => (process.argv.includes('--verbose') ? l : l.slice(0, 220)));
  console.log(`${pass ? 'PASS' : 'FAIL'} ${id} ${name} (gate ${g}, exit ${r.status})${fails.length ? `\n    ${fails.join('\n    ')}` : ''}`);
}
fs.rmSync(scratch, { recursive: true, force: true });
const failed = results.filter((x) => !x.pass).length;
console.log(`\nPAEP IB2 CI-governance negative suite: ${failed ? 'FAIL' : 'PASS'} (${results.length - failed}/${results.length})`);
process.exit(failed ? 1 : 0);
