#!/usr/bin/env node
/**
 * PAEP baseline-governance tests (IB1-PREFLIGHT-R7): positive controls, adversarial negatives and the
 * candidate-promotion test.
 *
 * Works on a disposable scratch copy of the repository (with .git, without node_modules). The copy is reset to a
 * fixture (generation 1 plus the current generation 2 scope, generation 2 as CANDIDATE, see below) committed as one
 * snapshot commit; each case mutates the copy, runs the command CI runs and restores it.
 * A negative case passes only when the command exits non-zero AND its output names the expected rule (for
 * example "FAIL B11" with the offending path). A positive case passes only on exit 0 with the expected output.
 *
 * Section I rebuilds the Generation 6 promotion from its controlled record and checks the PAEP-G6-PRR-01 exception
 * admits exactly the remediation its pin record names, and nothing else.
 *
 * The promotion cases (section E) simulate, in the scratch copy only, what happens after PO/SA acceptance: the
 * acceptance record is committed, the branch is merged with --no-ff into a simulated mainline and the scratch
 * refs/remotes/origin/main is moved to that merge. Nothing outside the scratch copy is touched.
 *
 * Writes baseline-governance-tests.{log,json} to PAEP_EVIDENCE_DIR (CI) or tmp/paep-evidence/baseline/ locally.
 */

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { G6_PROMOTION_REMEDIATION, g6RemediationSelfHash } from './baseline-governance.mjs';

const root = process.cwd();
const REG = 'tooling/governance/baseline-registry.json';
const CLI = 'tooling/governance/baseline-governance.mjs';
const outDir = process.env.PAEP_EVIDENCE_DIR || path.join(root, 'tmp', 'paep-evidence', 'baseline');
const env = { ...process.env, NO_COLOR: '1', GIT_AUTHOR_NAME: 'paep-negative', GIT_AUTHOR_EMAIL: 'paep-negative@invalid', GIT_COMMITTER_NAME: 'paep-negative', GIT_COMMITTER_EMAIL: 'paep-negative@invalid' };
delete env.PAEP_EVIDENCE_DIR;
delete env.GITHUB_STEP_SUMMARY;

const scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'paep-baseline-tests-'));
const copy = path.join(scratch, 'repo');
const SKIP = new Set(['node_modules', 'dist', '.angular', 'tmp']);
fs.cpSync(root, copy, { recursive: true, verbatimSymlinks: true, filter: (src) => !(SKIP.has(path.basename(src)) && path.dirname(src) === root) });
const sh = (cmd, args, opts = {}) => {
  const r = spawnSync(cmd, args, { cwd: copy, encoding: 'utf8', env, maxBuffer: 64 * 1024 * 1024, ...opts });
  return { status: r.status, out: `${r.stdout || ''}${r.stderr || ''}` };
};
const git = (...a) => sh('git', a);
const gitOut = (...a) => git(...a).out.trim();
// Fixture: every case simulates the IB1-PREFLIGHT-R7 lifecycle from its start, whatever the repository's current
// generation. The snapshot is the generation 1 (IB0) commit plus the current files inside the generation 2 scope,
// with generation 2 returned to its CANDIDATE form and its work-package records to their pre-acceptance form (a
// promotion only fills acceptance fields, B09). The real current state is verified by qa:baseline (W26), not here.
const FIXTURE_ACCEPTANCE_ROW = /(Acceptance Status[^\n|]*\|\s*[*_`]*\s*)accepted[*_`]*/gi;
{
  const live = JSON.parse(fs.readFileSync(path.join(copy, REG), 'utf8'));
  const g1 = live.generations.find((x) => x.generation === 1);
  const g2 = live.generations.find((x) => x.generation === 2);
  const inScope = (f) => g2.authorisedScope.some((e) => (e.endsWith('/') ? f.startsWith(e) : f === e));
  const listed = (ref) => (ref ? git('ls-tree', '-r', '--name-only', '-z', ref) : git('ls-files', '-z', '--cached', '--others', '--exclude-standard')).out.split('\0').filter(Boolean);
  const keep = new Map(listed(null).filter(inScope).map((f) => [f, fs.readFileSync(path.join(copy, f))]));
  git('checkout', '-q', '-f', '--detach', g1.acceptedCommit);
  git('clean', '-q', '-f', '-d');
  for (const f of listed(g1.acceptedCommit).filter(inScope)) fs.rmSync(path.join(copy, f), { force: true });
  for (const [f, data] of keep) { fs.mkdirSync(path.dirname(path.join(copy, f)), { recursive: true }); fs.writeFileSync(path.join(copy, f), data); }
  // package.json is in the generation 2 scope for its scripts only. A later generation may change its dependency
  // fields together with package-lock.json (for example IB2's approved test tooling); the fixture keeps the current
  // scripts and restores every non-script field to its generation 2 form, so the lockfile of the generation 1
  // commit still matches.
  if (keep.has('package.json')) {
    const current = JSON.parse(fs.readFileSync(path.join(copy, 'package.json'), 'utf8'));
    const atG2 = JSON.parse(git('show', `${g2.acceptedCommit}:package.json`).out);
    fs.writeFileSync(path.join(copy, 'package.json'), `${JSON.stringify({ ...atG2, scripts: current.scripts }, null, 2)}\n`);
  }
  Object.assign(g2, { status: 'CANDIDATE', acceptedCommit: null, acceptedTree: null, acceptance: null, fingerprints: null });
  live.generations = live.generations.filter((x) => x.generation <= 2);
  fs.writeFileSync(path.join(copy, REG), `${JSON.stringify(live, null, 2)}\n`);
  for (const wp of g2.workPackages) {
    const wpj = path.join(copy, 'work-packages', wp, 'work-package.json');
    const j = JSON.parse(fs.readFileSync(wpj, 'utf8'));
    Object.assign(j, { status: 'READY FOR AUTHORIZATION', acceptance: { status: 'PENDING', authority: g2.authorisation.authority, date: null } });
    fs.writeFileSync(wpj, `${JSON.stringify(j, null, 2)}\n`);
    for (const f of listed(null).filter((x) => x.startsWith(`work-packages/${wp}/`) && /\.md$/i.test(x))) {
      const t = fs.readFileSync(path.join(copy, f), 'utf8');
      const u = t.replace(FIXTURE_ACCEPTANCE_ROW, '$1PENDING');
      if (u !== t) fs.writeFileSync(path.join(copy, f), u);
    }
  }
  git('update-ref', 'refs/remotes/origin/main', g1.acceptedCommit);
}
git('add', '-A');
git('commit', '-q', '--no-verify', '--allow-empty', '-m', 'scratch snapshot');
const SNAP = gitOut('rev-parse', 'HEAD');
const verify = () => sh(process.execPath, [CLI, 'verify']);
const gate = () => sh(process.execPath, ['tooling/verification/verify-ib0-wp05.mjs', '--gate', 'governance']);
const promote = (n, c) => sh(process.execPath, [CLI, 'promote', '--generation', String(n), '--commit', c]);

const P = (f) => path.join(copy, f);
const readText = (f) => fs.readFileSync(P(f), 'utf8');
const regObj = () => JSON.parse(readText(REG));
const canon = (o) => `${JSON.stringify(o, null, 2)}\n`;

const results = [];
const log = [];
function record(id, section, name, expected, r, pass) {
  results.push({ id, section, name, expected, exit: r.status, pass });
  const detail = r.out.split('\n').filter((l) => /^(FAIL|PASS) [BW]\d+|PAEP baseline|verification|REFUSED|^- |promoted|harness/.test(l)).map((l) => l.slice(0, 400)).slice(0, 20).join('\n');
  log.push(`## ${id} ${name}\nexpected: ${expected}\n${detail}\nEXIT_CODE=${r.status}\nRESULT=${pass ? 'PASS' : 'FAIL'}\n`);
}

/** Applies edits [file, fn(text|null) -> text|null|{symlink}], runs fn, restores every file exactly. */
function withEdits(edits, fn) {
  const saved = [];
  try {
    for (const [f, edit] of edits) {
      const p = P(f);
      let prev = null;
      try { const st = fs.lstatSync(p); prev = st.isSymbolicLink() ? { link: fs.readlinkSync(p) } : { data: fs.readFileSync(p) }; } catch { /* absent */ }
      saved.push([p, prev]);
      const next = edit(prev && prev.data ? prev.data.toString('utf8') : null);
      fs.rmSync(p, { force: true });
      if (next === null) continue;
      fs.mkdirSync(path.dirname(p), { recursive: true });
      if (typeof next === 'object' && next.symlink) fs.symlinkSync(next.symlink, p); else fs.writeFileSync(p, next);
    }
    return fn();
  } catch (e) {
    return { status: null, out: `harness error: ${e.stack || e}` };
  } finally {
    for (const [p, prev] of saved.reverse()) {
      fs.rmSync(p, { force: true });
      if (!prev) continue;
      if (prev.link) fs.symlinkSync(prev.link, p); else fs.writeFileSync(p, prev.data);
    }
  }
}
const regEdit = (fn) => [REG, (t) => { const o = JSON.parse(t); fn(o); return canon(o); }];
const rawEdit = (fn) => [REG, (t) => fn(t)];
const g = (o, n) => o.generations.find((x) => x.generation === n);

/** Negative: non-zero exit and every pattern matches. */
function neg(id, section, name, edits, patterns, runner = verify) {
  const r = withEdits(edits, runner);
  const pass = r.status !== 0 && r.status !== null && patterns.every((re) => re.test(r.out));
  record(id, section, name, `non-zero exit; output matches ${patterns.map(String).join(' and ')}`, r, pass);
}
/** Positive: exit 0 and every pattern matches. */
function pos(id, section, name, edits, patterns, runner = verify) {
  const r = withEdits(edits, runner);
  const pass = r.status === 0 && patterns.every((re) => re.test(r.out));
  record(id, section, name, `exit 0; output matches ${patterns.map(String).join(' and ')}`, r, pass);
}
/** Custom case: fn returns { r, pass }. */
function custom(id, section, name, expected, fn) {
  let res;
  try { res = fn(); } catch (e) { res = { r: { status: null, out: `harness error: ${e.stack || e}` }, pass: false }; }
  record(id, section, name, expected, res.r, res.pass);
}

const IB0 = regObj().generations[0].acceptedCommit;
const R7 = 'IB1-PREFLIGHT-R7';

try {
  // ---- A: positive controls --------------------------------------------------------------------------
  pos('A01', 'positive', 'current candidate state validates (active G1 = accepted IB0, G2 CANDIDATE)', [], [/PAEP baseline governance: PASS \(13\/13\)/, new RegExp(`active G1 ${IB0}`), /candidate G2 IB1-PREFLIGHT-R7 \(NOT ACCEPTED\)/]);
  pos('A02', 'positive', 'accepted IB0 baseline record is bound to git: merge on mainline, tree, ACCEPTED records, fingerprints', [], [/PASS B05 .*G1 5fbbedd tree fb10ab5/, /PASS B06 .*G1: Product Owner \/ Solutions Architect, 2026-09-25, 5 records/, /PASS B07 .*G1: 29 fingerprints/]);
  pos('A03', 'positive', 'authorised R7 changes are in scope (B11 names the G2 scope)', [], [/PASS B11 .*changed paths since 5fbbedd, all in the G2 scope/]);
  pos('A04', 'positive', 'the WP05 governance gate consumes the registry (W26 and W07 pass)', [], [/PASS W26 .*active G1 5fbbedd; candidate G2 IB1-PREFLIGHT-R7 \(CANDIDATE, not accepted\)/, /PASS W07/, /verification \(governance\): PASS/], gate);
  custom('A05', 'positive', 'verify is read-only: registry bytes and git status unchanged after verify', 'identical registry and status', () => {
    const before = [readText(REG), gitOut('status', '--porcelain')];
    const r = verify();
    return { r, pass: r.status === 0 && before[0] === readText(REG) && before[1] === gitOut('status', '--porcelain') };
  });
  custom('A06', 'positive', 'deterministic: two runs give identical output, and a fresh clone of the snapshot passes', 'identical output; clone exit 0', () => {
    const a = verify(); const b = verify();
    const clone = path.join(scratch, 'clone');
    sh('git', ['clone', '-q', '--no-local', copy, clone], { cwd: scratch });
    sh('git', ['fetch', '-q', 'origin', '+refs/remotes/origin/main:refs/remotes/origin/main'], { cwd: clone });
    const c = sh(process.execPath, [CLI, 'verify'], { cwd: clone });
    const strip = (o) => o.replace(/^.*B11.*$/m, '');
    return { r: c, pass: a.out === b.out && a.status === 0 && c.status === 0 && strip(c.out) === strip(a.out) };
  });
  custom('A07', 'positive', 'historical accepted evidence stays readable: every G1 record reads ACCEPTED at the accepted commit', 'every record ACCEPTED', () => {
    const ev = regObj().generations[0].acceptance.evidence;
    const bad = ev.filter((e) => { const t = gitOut('show', `${IB0}:${e.path}`); return !(/"status": "ACCEPTED"/.test(t) || /\| Acceptance Status \| ACCEPTED \|/.test(t)); });
    return { r: { status: bad.length ? 1 : 0, out: `records: ${ev.map((e) => e.path).join(', ')}; unreadable: ${bad.map((e) => e.path).join(', ') || 'none'}` }, pass: ev.length === 5 && bad.length === 0 };
  });

  // ---- B: drift and change authorisation ---------------------------------------------------------------
  neg('B01', 'drift', 'governed file outside the scope changed (architecture checker)', [['tooling/architecture-boundaries/check-boundaries.mjs', (t) => `${t}// drift\n`]], [/FAIL B11 .*unauthorised change: tooling\/architecture-boundaries\/check-boundaries\.mjs/]);
  neg('B02', 'drift', 'implementation file changed without authorisation (substantive IB1 attempt)', [['packages/contracts/src/index.ts', () => 'export interface Contract { id: string }\n']], [/FAIL B11 .*unauthorised change: packages\/contracts\/src\/index\.ts/]);
  neg('B03', 'drift', 'new governed artifact outside the scope (second action)', [['.github/actions/other/action.yml', () => 'name: other\n']], [/FAIL B11 .*unauthorised change: \.github\/actions\/other\/action\.yml/]);
  neg('B04', 'drift', 'unapproved additional changed path: package.json dropped from the scope while it is changed', [regEdit((o) => { g(o, 2).authorisedScope = g(o, 2).authorisedScope.filter((e) => e !== 'package.json'); })], [/FAIL B11 .*unauthorised change: package\.json/]);
  neg('B05', 'drift', 'accepted evidence record edited (evidence/IB0-WP04)', [['evidence/IB0-WP04/README.md', (t) => `${t}\nedited\n`]], [/FAIL B10 .*evidence\/IB0-WP04\//, /FAIL B11/]);
  neg('B06', 'drift', 'accepted record removed (work-packages/IB0-WP05/ACCEPTANCE.md)', [['work-packages/IB0-WP05/ACCEPTANCE.md', () => null]], [/FAIL B10 .*work-packages\/IB0-WP05\//]);
  neg('B07', 'drift', 'immutable controlled source changed', [['.paep-control/text/PAEP_IR_01_v1.0_text.md', (t) => `${t} `]], [/FAIL B10 .*\.paep-control\//]);
  neg('B08', 'drift', 'file added inside an accepted record folder', [['evidence/IB0-WP05/extra.md', () => 'x\n']], [/FAIL B10 .*evidence\/IB0-WP05\//]);
  neg('B09', 'drift', 'unauthorised drift reaches the governance gate (W07 and W26 fail)', [['tooling/architecture-boundaries/check-boundaries.mjs', (t) => `${t}// drift\n`]], [/FAIL W07/, /FAIL W26/, /verification \(governance\): FAIL/], gate);
  neg('B10', 'drift', 'CLAUDE.md changed without authorisation', [['CLAUDE.md', (t) => `${t}- extra rule\n`]], [/FAIL B11 .*unauthorised change: CLAUDE\.md/]);

  // ---- C: registry tampering ---------------------------------------------------------------------------
  neg('C01', 'tamper', 'fingerprint substitution: controlled source edited and its fingerprint replaced to hide it', [
    ['.paep-control/SOURCE_OF_TRUTH.md', (t) => `${t}x\n`],
    regEdit((o) => { g(o, 1).fingerprints['.paep-control/'] = '0000000000000000000000000000000000000000'; })], [/FAIL B07 .*fingerprint \.paep-control\//, /FAIL B10/]);
  neg('C02', 'tamper', 'expected fingerprint changed only to make verification green', [regEdit((o) => { g(o, 1).fingerprints['package-lock.json'] = 'a'.repeat(40); })], [/FAIL B07 .*fingerprint package-lock\.json/]);
  neg('C03', 'tamper', 'protected path removed from the fingerprints', [regEdit((o) => { delete g(o, 1).fingerprints['CLAUDE.md']; })], [/FAIL B07 .*missing: CLAUDE\.md/]);
  neg('C04', 'tamper', 'accepted record removed from protection and added to the candidate scope', [regEdit((o) => {
    g(o, 1).protectedRecords = g(o, 1).protectedRecords.filter((r) => r !== 'evidence/IB0-WP05/');
    delete g(o, 1).fingerprints['evidence/IB0-WP05/'];
    g(o, 2).authorisedScope = [...g(o, 2).authorisedScope, 'evidence/IB0-WP05/'].sort();
  })], [/FAIL B04 .*generation 1 protectedRecords/]);
  neg('C05', 'tamper', 'immutable controlled source removed from policy (and its fingerprint)', [regEdit((o) => { o.policy.immutablePaths = o.policy.immutablePaths.filter((x) => x !== '.gitignore'); delete g(o, 1).fingerprints['.gitignore']; })], [/FAIL B04 .*lacks controlled source \.gitignore/]);
  neg('C06', 'tamper', 'Claude added as an acceptance authority', [regEdit((o) => { o.policy.acceptanceAuthorities = ['Claude Code', 'Product Owner / Solutions Architect']; })], [/FAIL B04 .*"Claude Code" is not a controlled acceptance authority/]);
  neg('C07', 'tamper', 'accepted tree identity edited', [regEdit((o) => { g(o, 1).acceptedTree = 'b'.repeat(40); })], [/FAIL B05 .*acceptedTree/]);
  neg('C08', 'tamper', 'acceptance evidence blob edited', [regEdit((o) => { g(o, 1).acceptance.evidence[4].blob = 'c'.repeat(40); })], [/FAIL B06 .*evidence work-packages\/IB0-WP05\/work-package\.json blob/]);
  neg('C09', 'tamper', 'nested metadata: extra key inside a generation', [regEdit((o) => { g(o, 2).override = { status: 'ACCEPTED' }; })], [/FAIL B02 .*generations\[1\] keys/]);
  neg('C10', 'tamper', 'reordered generation fields', [regEdit((o) => { const x = g(o, 2); const { generation, name, ...rest } = x; o.generations[1] = { name, generation, ...rest }; })], [/FAIL B02 .*generations\[1\] keys/]);
  neg('C11', 'tamper', 'mainline reference redirected to another ref', [regEdit((o) => { o.policy.mainlineRef = 'refs/heads/sim-main'; })], [/FAIL B02 .*mainlineRef/]);
  neg('C12', 'tamper', 'accepted work package dropped from the baseline (IB0-WP05 still records ACCEPTED)', [regEdit((o) => {
    const x = g(o, 1); x.workPackages = x.workPackages.filter((w) => w !== 'IB0-WP05');
    x.protectedRecords = x.protectedRecords.filter((r) => !r.includes('IB0-WP05'));
    for (const k of Object.keys(x.fingerprints)) if (k.includes('IB0-WP05')) delete x.fingerprints[k];
    x.acceptance.evidence = x.acceptance.evidence.filter((e) => !e.path.includes('IB0-WP05'));
  })], [/FAIL B12 .*IB0-WP05 records ACCEPTED but belongs to no generation/]);

  // ---- D: structure, state and history -----------------------------------------------------------------
  neg('D01', 'schema', 'malformed JSON', [rawEdit((t) => t.replace('"generations": [', '"generations": [,'))], [/FAIL B01 .*not JSON/]);
  neg('D02', 'schema', 'duplicate key (a second "status": "ACCEPTED" in the candidate)', [rawEdit((t) => t.replace('"status": "CANDIDATE",', '"status": "CANDIDATE",\n      "status": "ACCEPTED",'))], [/FAIL B01 .*canonical form/]);
  neg('D03', 'schema', 'unknown acceptance state (APPROVED)', [regEdit((o) => { g(o, 2).status = 'APPROVED'; })], [/FAIL B02 .*"APPROVED" is not one of ACCEPTED, CANDIDATE/]);
  neg('D04', 'schema', 'unknown schemaVersion', [regEdit((o) => { o.schemaVersion = 2; })], [/FAIL B02 .*unknown schemaVersion 2/]);
  neg('D05', 'schema', 'acceptance authority missing', [regEdit((o) => { delete g(o, 1).acceptance.authority; })], [/FAIL B02 .*acceptance authority and evidence are mandatory/]);
  neg('D06', 'schema', 'acceptance evidence missing (empty list)', [regEdit((o) => { g(o, 1).acceptance.evidence = []; })], [/FAIL B02 .*acceptance authority and evidence are mandatory/]);
  neg('D07', 'schema', 'acceptance evidence for one work package removed', [regEdit((o) => { g(o, 1).acceptance.evidence = g(o, 1).acceptance.evidence.filter((e) => !e.path.includes('IB0-WP03')); })], [/FAIL B06 .*no acceptance evidence for IB0-WP03 \(unaccepted milestone\)/]);
  neg('D08', 'schema', 'acceptance authority not controlled (Claude Code)', [regEdit((o) => { g(o, 1).acceptance.authority = 'Claude Code'; })], [/FAIL B06 .*"Claude Code" is not a controlled acceptance authority/]);
  neg('D09', 'history', 'generation rollback: candidate renumbered to 1', [regEdit((o) => { g(o, 2).generation = 1; })], [/FAIL B03 .*no gap, duplicate or rollback/]);
  neg('D10', 'history', 'duplicate/reused generation number', [regEdit((o) => { o.generations.push({ ...g(o, 2) }); })], [/FAIL B03/]);
  neg('D11', 'history', 'two CANDIDATE generations', [regEdit((o) => { o.generations.push({ ...g(o, 2), generation: 3, predecessorGeneration: 2, workPackages: ['IB1-OTHER'], protectedRecords: ['evidence/IB1-OTHER/', 'work-packages/IB1-OTHER/'] }); })], [/FAIL B03 .*2 CANDIDATE generations/]);
  neg('D12', 'history', 'historical accepted baseline removed (no ACCEPTED generation left)', [regEdit((o) => { o.generations = [{ ...g(o, 2), generation: 1, predecessorGeneration: null }]; })], [/FAIL B03 .*no ACCEPTED generation/]);
  neg('D13', 'history', 'predecessor baseline does not exist', [regEdit((o) => { g(o, 1).acceptedCommit = 'd'.repeat(40); })], [/FAIL B05 .*does not exist \(nonexistent predecessor baseline\)/]);
  neg('D14', 'history', 'predecessor is an unmerged branch commit (IB0-WP05 acceptance commit, not the merge)', [regEdit((o) => {
    const c = gitOut('rev-parse', `${IB0}^2`); g(o, 1).acceptedCommit = c; g(o, 1).acceptedTree = gitOut('rev-parse', `${c}^{tree}`);
  })], [/FAIL B05 .*is not a merge commit/, /is not on the first-parent history/]);
  neg('D15', 'history', 'baseline rolled back to the IB0-WP04 merge (IB0-WP05 not accepted there)', [regEdit((o) => {
    const c = gitOut('rev-parse', `${IB0}^1`); g(o, 1).acceptedCommit = c; g(o, 1).acceptedTree = gitOut('rev-parse', `${c}^{tree}`);
  })], [/FAIL B06 .*work-packages\/IB0-WP05\/work-package\.json does not exist/, /FAIL B07/]);
  neg('D16', 'history', 'mainline reference missing (fails closed)', [], [/FAIL B05 .*refs\/remotes\/origin\/main not found/], () => {
    const m = gitOut('rev-parse', 'refs/remotes/origin/main');
    git('update-ref', '-d', 'refs/remotes/origin/main');
    try { return verify(); } finally { git('update-ref', 'refs/remotes/origin/main', m); }
  });
  neg('D17', 'history', 'candidate authorisation missing', [regEdit((o) => { g(o, 2).authorisation = null; })], [/FAIL B02 .*authorisation is required for a CANDIDATE/]);
  neg('D18', 'history', 'candidate authorised by a non-controlled authority', [regEdit((o) => { g(o, 2).authorisation.authority = 'Claude Code'; })], [/FAIL B08 .*"Claude Code" is not a controlled authority/]);
  neg('D19', 'history', 'candidate authorisation reference outside its own records', [regEdit((o) => { g(o, 2).authorisation.reference = 'CLAUDE.md'; })], [/FAIL B08 .*authorisation reference CLAUDE\.md/]);
  neg('D20', 'history', 'registry missing', [[REG, () => null]], [/FAIL B01 .*missing/]);
  neg('D21', 'history', 'invalid registry makes the governance gate fail closed (W02, W05-W08, W26)', [rawEdit((t) => t.replace('{', '{,'))], [/FAIL W02 .*no valid accepted baseline/, /FAIL W05/, /FAIL W06/, /FAIL W07/, /FAIL W08/, /FAIL W26/], gate);

  // ---- E: self-approval and candidate/accepted separation -------------------------------------------------
  neg('E01', 'promotion', 'candidate treated as accepted (status flipped, acceptance fields left empty)', [regEdit((o) => { g(o, 2).status = 'ACCEPTED'; })], [/FAIL B02 .*acceptedCommit is not a full 40-hex commit id/]);
  neg('E02', 'promotion', 'self-promotion by hand: candidate marked ACCEPTED at the current branch commit with PO/SA wording', [
    ['work-packages/IB1-PREFLIGHT-R7/work-package.json', (t) => { const j = JSON.parse(t); j.status = 'ACCEPTED'; j.acceptance = { status: 'ACCEPTED', authority: 'Product Owner / Solutions Architect', date: '2026-09-25' }; return `${JSON.stringify(j, null, 2)}\n`; }],
    regEdit((o) => {
      const x = g(o, 2); const r0 = g(o, 1);
      Object.assign(x, { status: 'ACCEPTED', acceptedCommit: SNAP, acceptedTree: gitOut('rev-parse', `${SNAP}^{tree}`),
        acceptance: { authority: 'Product Owner / Solutions Architect', date: '2026-09-25', evidence: [{ path: 'work-packages/IB1-PREFLIGHT-R7/work-package.json', blob: gitOut('rev-parse', `${SNAP}:work-packages/IB1-PREFLIGHT-R7/work-package.json`) }] },
        fingerprints: Object.fromEntries([...o.policy.immutablePaths, ...o.policy.governedPaths, ...x.protectedRecords].sort().map((k) => [k, gitOut('rev-parse', `${SNAP}:${k.replace(/\/$/, '')}`) || 'absent'])) });
      void r0;
    })], [/FAIL B05 .*is not a merge commit/, /is not on the first-parent history of refs\/remotes\/origin\/main/, /FAIL B06 .*is not ACCEPTED/]);
  neg('E03', 'promotion', 'automatic promotion of the current state without authority is refused (promote at HEAD)', [], [/PROMOTION REFUSED/, /is not on the first-parent history/, /is not a merge commit/, /is not ACCEPTED/], () => promote(2, 'HEAD'));
  neg('E04', 'promotion', 'promotion of a non-candidate generation is refused', [], [/PROMOTION REFUSED/, /generation 1 is not a CANDIDATE/], () => promote(1, IB0));

  // ---- F: path, symlink and character tricks -------------------------------------------------------------
  neg('F01', 'paths', "'..' traversal in a scope entry", [regEdit((o) => { g(o, 2).authorisedScope.push('tooling/../.paep-control/'); g(o, 2).authorisedScope.sort(); })], [/FAIL B04 .*non-canonical path "tooling\/..\/.paep-control\/"/]);
  neg('F02', 'paths', 'backslash separator in a scope entry', [regEdit((o) => { g(o, 2).authorisedScope.push('tooling\\governance\\x.mjs'); g(o, 2).authorisedScope.sort(); })], [/FAIL B04 .*non-canonical path/]);
  neg('F03', 'paths', 'absolute path in a scope entry', [regEdit((o) => { g(o, 2).authorisedScope.unshift('/etc/'); })], [/FAIL B04 .*non-canonical path "\/etc\/"/]);
  neg('F04', 'paths', 'case-variant scope entry aliasing an immutable source (.PAEP-CONTROL/text/)', [regEdit((o) => { g(o, 2).authorisedScope.unshift('.PAEP-CONTROL/text/'); g(o, 2).authorisedScope.sort(); })], [/FAIL B08 .*overlaps immutable \.paep-control\//]);
  neg('F05', 'paths', 'case-variant file beside an accepted record (Evidence/IB0-WP05/x.md)', [['Evidence/IB0-WP05/x.md', () => 'x\n']], [/FAIL B11 .*case variant of protected evidence\/IB0-WP05\//]);
  neg('F06', 'paths', 'duplicate scope entry (case-insensitive)', [regEdit((o) => { g(o, 2).authorisedScope.push('Package.json'); g(o, 2).authorisedScope.sort(); })], [/FAIL B04 .*duplicate entry/]);
  neg('F07', 'paths', 'scope widened to a whole top-level directory (tooling/)', [regEdit((o) => { g(o, 2).authorisedScope.push('tooling/'); g(o, 2).authorisedScope.sort(); })], [/FAIL B08 .*tooling\/ authorises a whole top-level directory/]);
  neg('F08', 'paths', 'scope overlapping an accepted record (evidence/IB0-WP05/)', [regEdit((o) => { g(o, 2).authorisedScope.push('evidence/IB0-WP05/'); g(o, 2).authorisedScope.sort(); })], [/FAIL B08 .*overlaps accepted record evidence\/IB0-WP05\//]);
  neg('F09', 'paths', 'symlink escaping the repository inside the authorised scope', [['tooling/governance/escape', () => ({ symlink: '/etc' })]], [/FAIL B11 .*tooling\/governance\/escape is a symlink/]);
  neg('F10', 'paths', 'symlink to an immutable source inside the authorised scope', [['tooling/governance/alias', () => ({ symlink: '../../.paep-control' })]], [/FAIL B11 .*tooling\/governance\/alias is a symlink/]);
  neg('F11', 'paths', 'registry replaced by a symlink', [[REG, () => ({ symlink: '../../work-packages/IB1-PREFLIGHT-R7/work-package.json' })]], [/FAIL B01 .*not a regular file \(symlink\)/]);
  neg('F12', 'chars', 'U+2028 LINE SEPARATOR in the registry', [rawEdit((t) => t.replace('"notes": "CANDIDATE only.', '"notes": "CANDIDATE only. '))], [/FAIL B01 .*U\+2028/]);
  neg('F13', 'chars', 'U+0085 NEL in the registry', [rawEdit((t) => t.replace('"notes": "CANDIDATE only.', '"notes": "CANDIDATE only.\u0085'))], [/FAIL B01 .*U\+0085/]);
  neg('F14', 'chars', 'byte-order mark before the registry', [rawEdit((t) => `﻿${t}`)], [/FAIL B01 .*U\+FEFF/]);
  neg('F15', 'chars', 'CRLF line endings in the registry', [rawEdit((t) => t.replace(/\n/g, '\r\n'))], [/FAIL B01 .*U\+000D/]);
  neg('F16', 'chars', 'escaped \\u002e in a scope path (dot hidden as an escape)', [rawEdit((t) => t.replace('"tooling/governance/"', '"tooling/governance\\u002e/"'))], [/FAIL B01 .*canonical form/]);
  neg('F17', 'chars', 'zero-width space inside a scope entry (escaped)', [regEdit((o) => { g(o, 2).authorisedScope.push('tooling/gov​ernance/'); g(o, 2).authorisedScope.sort(); })], [/FAIL B01 .*U\+200B/]);
  neg('F18', 'chars', 'non-ASCII changed file name inside the scope', [['tooling/governance/café.md', () => 'x\n']], [/FAIL B11 .*non-canonical changed path "tooling\/governance\/caf/]);
  neg('F19', 'chars', 'control character (TAB) in the registry', [rawEdit((t) => t.replace('"notes": "CANDIDATE only.', '"notes": "CANDIDATE only.\t'))], [/FAIL B01 .*U\+0009/]);

  // ---- G: special baseline-promotion test (simulated PO/SA acceptance and merge, scratch only) --------------
  // G01 before acceptance: the promote command refuses; the candidate stays CANDIDATE.
  const mainBefore = gitOut('rev-parse', 'refs/remotes/origin/main');
  git('checkout', '-q', '-b', 'sim-r7');
  // Simulated merge without an acceptance record (as if merged before acceptance).
  git('checkout', '-q', '-B', 'sim-main-unaccepted', IB0);
  git('merge', '-q', '--no-ff', '-m', 'simulated merge without acceptance', 'sim-r7');
  const unaccepted = gitOut('rev-parse', 'HEAD');
  git('update-ref', 'refs/remotes/origin/main', unaccepted);
  neg('G01', 'promotion', 'promotion refused at a mainline merge that carries no PO/SA ACCEPTED record', [], [/PROMOTION REFUSED/, /work-packages\/IB1-PREFLIGHT-R7\/work-package\.json at [0-9a-f]{7} is not ACCEPTED/], () => promote(2, unaccepted));
  git('update-ref', 'refs/remotes/origin/main', mainBefore);
  // Record acceptance on the branch (what the PO/SA-authorised acceptance commit does), then merge into a simulated mainline.
  git('checkout', '-q', 'sim-r7');
  const wpj = JSON.parse(readText('work-packages/IB1-PREFLIGHT-R7/work-package.json'));
  Object.assign(wpj, { status: 'ACCEPTED', acceptance: { status: 'ACCEPTED', authority: 'Product Owner / Solutions Architect', date: '2026-09-26' } });
  fs.writeFileSync(P('work-packages/IB1-PREFLIGHT-R7/work-package.json'), `${JSON.stringify(wpj, null, 2)}\n`);
  git('commit', '-q', '-am', 'SIMULATION: acceptance record');
  const acceptedBranchHead = gitOut('rev-parse', 'HEAD');
  pos('G02', 'promotion', 'before promotion: acceptance recorded on the branch, yet G2 is still CANDIDATE and G1 stays the active baseline', [], [new RegExp(`active G1 ${IB0}`), /candidate G2 IB1-PREFLIGHT-R7 \(NOT ACCEPTED\)/]);
  neg('G03', 'promotion', 'promotion refused at the accepted branch commit (not a mainline merge)', [], [/PROMOTION REFUSED/, /not on the first-parent history/], () => promote(2, acceptedBranchHead));
  const badAcc = (fn) => ['work-packages/IB1-PREFLIGHT-R7/work-package.json', (t) => { const o = JSON.parse(t); fn(o); return `${JSON.stringify(o, null, 2)}\n`; }];
  neg('H10', 'promotion', 'QA-N3: an ACCEPTED record with an invalid date fails', [badAcc((o) => { o.acceptance.date = '2026-09-31'; })], [/FAIL B12 .*acceptance date 2026-09-31 invalid/]);
  neg('H11', 'promotion', 'QA-N3: an ACCEPTED record with a near-miss authority fails', [badAcc((o) => { o.acceptance.authority = 'Product Owner / Solutions Architect '; })], [/FAIL B12 .*acceptance authority "Product Owner \/ Solutions Architect "/]);
  custom('H12', 'promotion', 'QA-N3: a merged malformed ACCEPTED claim still freezes the candidate; a later corrected merge cannot be promoted', 'B13 fails on a tamper branch; promote at the later merge refused', () => {
    git('checkout', '-q', '-b', 'sim-bad', 'sim-r7');
    const setDate = (d) => { const o = JSON.parse(readText('work-packages/IB1-PREFLIGHT-R7/work-package.json')); o.acceptance.date = d; fs.writeFileSync(P('work-packages/IB1-PREFLIGHT-R7/work-package.json'), `${JSON.stringify(o, null, 2)}\n`); };
    setDate('2026-09-31');
    git('commit', '-q', '-am', 'malformed acceptance');
    git('checkout', '-q', '-B', 'sim-bad-main', IB0);
    git('merge', '-q', '--no-ff', '-m', 'SIMULATION: merge with malformed acceptance', 'sim-bad');
    const Mx = gitOut('rev-parse', 'HEAD');
    git('update-ref', 'refs/remotes/origin/main', Mx);
    git('checkout', '-q', '-b', 'sim-bad-fix', Mx);
    fs.appendFileSync(P('evidence/IB1-PREFLIGHT-R7/README.md'), 'tamper\n');
    setDate('2026-09-26');
    git('commit', '-q', '-am', 'correct record and tamper');
    const v = verify();
    git('checkout', '-q', 'sim-bad-main');
    git('merge', '-q', '--no-ff', '-m', 'SIMULATION: corrected merge', 'sim-bad-fix');
    const My = gitOut('rev-parse', 'HEAD');
    git('update-ref', 'refs/remotes/origin/main', My);
    const p = promote(2, My);
    git('update-ref', 'refs/remotes/origin/main', mainBefore);
    git('checkout', '-q', '-f', 'sim-r7');
    const pass = v.status !== 0 && new RegExp(`FAIL B13 .*accepted and merged at ${Mx.slice(0, 7)}`).test(v.out) && p.status !== 0 && new RegExp(`first accepted and merged at ${Mx.slice(0, 7)}; only that merge can be promoted`).test(p.out);
    return { r: { status: pass ? 1 : 0, out: `${v.out}\n${p.out}` }, pass };
  });
  const REPORT = 'work-packages/IB1-PREFLIGHT-R7/ACCEPTANCE_REPORT.md';
  const pendingWp = (o) => { o.status = 'READY FOR AUTHORIZATION'; o.acceptance = { status: 'PENDING', authority: 'Product Owner / Solutions Architect', date: null }; };
  neg('H13', 'promotion', 'QA-N4: an acceptance recorded only as an ACCEPTANCE_REPORT.md row fails', [badAcc(pendingWp), [REPORT, (t) => `${t || ''}\n| Acceptance Status | **Accepted** |\n`]], [/FAIL B12 .*claims ACCEPTED anywhere in its records needs a well-formed/]);
  neg('H14', 'promotion', 'QA-N5: case and padding variants of ACCEPTED count as claims and fail', [badAcc((o) => { o.status = 'Accepted '; o.acceptance.status = 'accepted'; })], [/FAIL B12 .*is not ACCEPTED/]);
  custom('H15', 'promotion', 'QA-N4: a merged report-only acceptance still freezes the candidate; a later merge cannot be promoted', 'B13 fails on a tamper branch; promote at the later merge refused', () => {
    git('checkout', '-q', '-b', 'sim-rep', 'sim-r7');
    const o = JSON.parse(readText('work-packages/IB1-PREFLIGHT-R7/work-package.json')); pendingWp(o);
    fs.writeFileSync(P('work-packages/IB1-PREFLIGHT-R7/work-package.json'), `${JSON.stringify(o, null, 2)}\n`);
    fs.appendFileSync(P(REPORT), '\n| Acceptance Status | ACCEPTED |\n');
    git('add', '-A'); git('commit', '-q', '-m', 'report-only acceptance');
    git('checkout', '-q', '-B', 'sim-rep-main', IB0);
    git('merge', '-q', '--no-ff', '-m', 'SIMULATION: merge with report-only acceptance', 'sim-rep');
    const Mx = gitOut('rev-parse', 'HEAD');
    git('update-ref', 'refs/remotes/origin/main', Mx);
    git('checkout', '-q', '-b', 'sim-rep-fix', Mx);
    fs.appendFileSync(P('evidence/IB1-PREFLIGHT-R7/README.md'), 'tamper\n');
    git('checkout', '-q', 'sim-r7', '--', 'work-packages/IB1-PREFLIGHT-R7/work-package.json');
    git('commit', '-q', '-am', 'valid record and tamper');
    const v = verify();
    git('checkout', '-q', 'sim-rep-main');
    git('merge', '-q', '--no-ff', '-m', 'SIMULATION: later merge', 'sim-rep-fix');
    const My = gitOut('rev-parse', 'HEAD');
    git('update-ref', 'refs/remotes/origin/main', My);
    const p = promote(2, My);
    git('update-ref', 'refs/remotes/origin/main', mainBefore);
    git('checkout', '-q', '-f', 'sim-r7');
    const pass = v.status !== 0 && new RegExp(`FAIL B13 .*accepted and merged at ${Mx.slice(0, 7)}`).test(v.out) && p.status !== 0 && new RegExp(`first accepted and merged at ${Mx.slice(0, 7)}; only that merge can be promoted`).test(p.out);
    return { r: { status: pass ? 1 : 0, out: `${v.out}\n${p.out}` }, pass };
  });
  git('checkout', '-q', '-B', 'sim-main', IB0);
  git('merge', '-q', '--no-ff', '-m', 'SIMULATION: PO/SA-authorised merge', 'sim-r7');
  const M = gitOut('rev-parse', 'HEAD');
  git('update-ref', 'refs/remotes/origin/main', M);
  pos('G04', 'promotion', 'after the simulated merge, before promotion: G1 still active, G2 still CANDIDATE', [], [new RegExp(`active G1 ${IB0}`), /candidate G2 .*NOT ACCEPTED/]);
  neg('H02', 'promotion', 'QA-F2: after the accepted merge, before promotion, an edit to the candidate\'s records fails (promotion pending)', [['evidence/IB1-PREFLIGHT-R7/README.md', (t) => `${t}\ntampered\n`]], [/FAIL B13 .*the only permitted next change is promote --generation 2/]);
  neg('H03', 'promotion', 'QA-F2: after the accepted merge, widening the candidate scope fails (frozen to the accepted merge)', [regEdit((o) => { g(o, 2).authorisedScope.push('tooling/verification/yaml-subset.mjs'); g(o, 2).authorisedScope.sort(); })], [/FAIL B13 .*differs from the CANDIDATE merged and accepted/]);
  custom('H04', 'promotion', 'QA-F2: promotion at a later mainline merge (not the earliest accepted merge) is refused', 'non-zero promote exit naming the earliest merge', () => {
    git('checkout', '-q', '-b', 'sim-later', M);
    fs.appendFileSync(P('evidence/IB1-PREFLIGHT-R7/README.md'), 'later\n');
    git('commit', '-q', '-am', 'later change');
    git('checkout', '-q', 'sim-main');
    git('merge', '-q', '--no-ff', '-m', 'SIMULATION: later merge', 'sim-later');
    const M3 = gitOut('rev-parse', 'HEAD');
    git('update-ref', 'refs/remotes/origin/main', M3);
    const r = promote(2, M3);
    git('reset', '-q', '--hard', M);
    git('update-ref', 'refs/remotes/origin/main', M);
    return { r, pass: r.status !== 0 && new RegExp(`first accepted and merged at ${M.slice(0, 7)}; only that merge can be promoted`).test(r.out) };
  });
  const addWp = regEdit((o) => { const c = g(o, 2); c.workPackages = [...c.workPackages, 'IB1-X'].sort(); c.protectedRecords = [...c.protectedRecords, 'evidence/IB1-X/', 'work-packages/IB1-X/'].sort(); c.authorisedScope = [...c.authorisedScope, 'evidence/IB1-X/', 'tooling/verification/yaml-subset.mjs', 'work-packages/IB1-X/'].sort(); });
  neg('H07', 'promotion', 'QA-N1: after the accepted merge, adding a work package to the candidate does not lift the freeze', [
    addWp, ['work-packages/IB1-X/WORK_PACKAGE.md', () => '# simulated\n'], ['evidence/IB1-PREFLIGHT-R7/README.md', (t) => `${t}\ntamper\n`]], [/FAIL B13 .*generation 2 here differs from the CANDIDATE merged and accepted at/]);
  neg('H08', 'promotion', 'QA-N1: after the accepted merge, removing the candidate from the registry does not lift the freeze', [
    regEdit((o) => { o.generations = o.generations.filter((x) => x.generation !== 2); })], [/FAIL B13 .*generation 2 here differs from the CANDIDATE merged and accepted at/]);
  custom('H09', 'promotion', 'QA-N1: a later merge that adds an accepted work package to the candidate cannot be promoted', 'non-zero promote exit naming the earliest merge', () => {
    git('checkout', '-q', '-b', 'sim-addwp', M);
    const r0 = withEdits([addWp, ['work-packages/IB1-X/WORK_PACKAGE.md', () => '# simulated\n'], ['evidence/IB1-PREFLIGHT-R7/README.md', (t) => `${t}\ntamper\n`],
      ['work-packages/IB1-X/work-package.json', () => `${JSON.stringify({ status: 'ACCEPTED', acceptance: { status: 'ACCEPTED', authority: 'Product Owner / Solutions Architect', date: '2026-09-27' } }, null, 2)}\n`]], () => {
      git('add', '-A');
      git('commit', '-q', '-m', 'add accepted work package');
      return { status: 0, out: '' };
    });
    git('checkout', '-q', 'sim-main');
    git('merge', '-q', '--no-ff', '-m', 'SIMULATION: later merge adding a work package', 'sim-addwp');
    const M3 = gitOut('rev-parse', 'HEAD');
    git('update-ref', 'refs/remotes/origin/main', M3);
    const r = promote(2, M3);
    git('reset', '-q', '--hard', M);
    git('update-ref', 'refs/remotes/origin/main', M);
    return { r: { status: r.status, out: `${r0.out}${r.out}` }, pass: r0.status === 0 && r.status !== 0 && new RegExp(`first accepted and merged at ${M.slice(0, 7)}; only that merge can be promoted`).test(r.out) };
  });
  neg('G05', 'promotion', 'promotion refused when the working registry changed the candidate declaration (scope widened)', [regEdit((o) => { g(o, 2).authorisedScope.push('tooling/verification/verify-ib0-wp04.mjs'); g(o, 2).authorisedScope.sort(); })], [/PROMOTION REFUSED/, /differs from the CANDIDATE merged/], () => promote(2, M));
  custom('G06', 'promotion', 'deterministic promotion after explicit acceptance: promote --generation 2 --commit <merge> succeeds; verify then reports G2 ACCEPTED at the merge', 'promote exit 0; verify exit 0 with active G2', () => {
    const pr = promote(2, M);
    const v = verify();
    const reg = regObj();
    const pass = pr.status === 0 && v.status === 0 && new RegExp(`active G2 ${M}`).test(v.out) && /candidate none/.test(v.out) && g(reg, 2).status === 'ACCEPTED' && g(reg, 2).acceptance.date === '2026-09-26';
    return { r: { status: pass ? 0 : 1, out: `${pr.out}\n${v.out}` }, pass };
  });
  git('commit', '-q', '-am', 'SIMULATION: promote generation 2');
  pos('G07', 'promotion', 'promoted state validates; the IB0 generation stays identifiable and unchanged', [], [new RegExp(`PASS B05 .*G1 ${IB0.slice(0, 7)}.*G2 ${M.slice(0, 7)}`), /PASS B09/]);
  custom('G17', 'promotion', 'D-R7-02: after promotion (no CANDIDATE) the older-verifier bound accepts the promoted registry and accepted history, and nothing else', 'registry and accepted-history paths authorised; an unrelated path and a drifted path refused', () => {
    const probe = `import('./${CLI}').then((m) => { const e = m.evaluate(process.cwd()); const a = e.authorisedSince('${IB0}'); console.log(JSON.stringify({ reg: a('${REG}'), hist: a('tooling/governance/baseline-governance.mjs'), other: a('apps/reference-app/src/main.ts') })); })`;
    const clean = sh(process.execPath, ['--input-type=module', '-e', probe]);
    const drift = withEdits([['apps/reference-app/src/main.ts', (t) => `${t}// drift\n`]], () => sh(process.execPath, ['--input-type=module', '-e', probe]));
    let c = {}; let d = {};
    try { c = JSON.parse(clean.out.trim().split('\n').pop()); d = JSON.parse(drift.out.trim().split('\n').pop()); } catch { /* reported as fail */ }
    const pass = c.reg === true && c.hist === true && c.other === false && d.other === false && d.reg === false;
    return { r: { status: pass ? 1 : 0, out: `clean ${clean.out}\ndrift ${drift.out}` }, pass };
  });
  neg('G08', 'promotion', 'after promotion: historical IB0 generation rewritten', [regEdit((o) => { g(o, 1).notes = 'rewritten'; })], [/FAIL B09 .*accepted generation 1 .*rewritten or removed/]);
  neg('G09', 'promotion', 'after promotion: rollback by deleting the promoted generation', [regEdit((o) => { o.generations = o.generations.filter((x) => x.generation !== 2); })], [/FAIL B09/]);
  neg('G10', 'promotion', 'after promotion: policy loosened without a policyChange candidate', [regEdit((o) => { o.policy.governedPaths = o.policy.governedPaths.filter((x) => x !== 'CLAUDE.md'); })], [/FAIL B09 .*policy differs/]);
  neg('G11', 'promotion', 'after promotion: drift without a new candidate', [['tooling/governance/extra.md', () => 'x\n']], [/FAIL B11 .*unauthorised change: tooling\/governance\/extra\.md/]);
  pos('G12', 'promotion', 'rollover continues: a new CANDIDATE (G3) declared with its scope validates its in-scope change', [
    regEdit((o) => { o.generations.push({ generation: 3, name: 'next', milestone: 'IB1', workPackages: ['IB1-WP01'], status: 'CANDIDATE', predecessorGeneration: 2, authorisation: { authority: 'Product Owner / Solutions Architect', date: '2026-09-27', reference: 'work-packages/IB1-WP01/WORK_PACKAGE.md' }, policyChange: false, authorisedScope: ['evidence/IB1-WP01/', 'tooling/governance/baseline-registry.json', 'work-packages/IB1-WP01/'], protectedRecords: ['evidence/IB1-WP01/', 'work-packages/IB1-WP01/'], acceptedCommit: null, acceptedTree: null, acceptance: null, fingerprints: null, notes: 'simulation' }); }),
    ['work-packages/IB1-WP01/WORK_PACKAGE.md', () => '# simulated\n']], [new RegExp(`active G2 ${M}`), /candidate G3 IB1-WP01 \(NOT ACCEPTED\)/]);
  neg('G13', 'promotion', 'rollover: a change outside the new candidate scope fails', [
    regEdit((o) => { o.generations.push({ generation: 3, name: 'next', milestone: 'IB1', workPackages: ['IB1-WP01'], status: 'CANDIDATE', predecessorGeneration: 2, authorisation: { authority: 'Product Owner / Solutions Architect', date: '2026-09-27', reference: 'work-packages/IB1-WP01/WORK_PACKAGE.md' }, policyChange: false, authorisedScope: ['evidence/IB1-WP01/', 'tooling/governance/baseline-registry.json', 'work-packages/IB1-WP01/'], protectedRecords: ['evidence/IB1-WP01/', 'work-packages/IB1-WP01/'], acceptedCommit: null, acceptedTree: null, acceptance: null, fingerprints: null, notes: 'simulation' }); }),
    ['work-packages/IB1-WP01/WORK_PACKAGE.md', () => '# simulated\n'], ['tooling/verification/verify-ib0-wp05.mjs', (t) => `${t}// drift\n`]], [/FAIL B11 .*unauthorised change: tooling\/verification\/verify-ib0-wp05\.mjs/]);
  neg('G14', 'promotion', 'rollover: the promoted G2 records become immutable (work-packages/IB1-PREFLIGHT-R7 edited)', [['work-packages/IB1-PREFLIGHT-R7/WORK_PACKAGE.md', (t) => `${t}\nedited\n`]], [/FAIL B10 .*work-packages\/IB1-PREFLIGHT-R7\//]);
  const g3 = (extra) => regEdit((o) => { o.generations.push({ generation: 3, name: 'next', milestone: 'IB1', workPackages: ['IB1-WP01'], status: 'CANDIDATE', predecessorGeneration: 2, authorisation: { authority: 'Product Owner / Solutions Architect', date: '2026-09-27', reference: 'work-packages/IB1-WP01/WORK_PACKAGE.md' }, policyChange: false, authorisedScope: ['evidence/IB1-WP01/', 'tooling/governance/baseline-registry.json', 'work-packages/IB1-WP01/'], protectedRecords: ['evidence/IB1-WP01/', 'work-packages/IB1-WP01/'], acceptedCommit: null, acceptedTree: null, acceptance: null, fingerprints: null, notes: 'simulation' }); extra(o); });
  pos('G15', 'promotion', 'policy evolution: a CANDIDATE that declares policyChange may tighten the policy (README.md becomes governed)', [
    g3((o) => { g(o, 3).policyChange = true; o.policy.governedPaths = [...o.policy.governedPaths, 'README.md'].sort(); }), ['work-packages/IB1-WP01/WORK_PACKAGE.md', () => '# simulated\n']], [/PAEP baseline governance: PASS/, /candidate G3 IB1-WP01/]);
  neg('G16', 'promotion', 'policy change hidden in a CANDIDATE without policyChange fails', [
    g3((o) => { o.policy.governedPaths = [...o.policy.governedPaths, 'README.md'].sort(); }), ['work-packages/IB1-WP01/WORK_PACKAGE.md', () => '# simulated\n']], [/FAIL B09 .*policy differs/]);
  neg('H05', 'promotion', 'QA-F3: a CANDIDATE without policyChange may not change the governance verifier', [
    g3((o) => { g(o, 3).authorisedScope = [...g(o, 3).authorisedScope, 'tooling/governance/baseline-governance.mjs'].sort(); }), ['work-packages/IB1-WP01/WORK_PACKAGE.md', () => '# simulated\n']], [/FAIL B08 .*tooling\/governance\/baseline-governance\.mjs changes governance rules; it requires policyChange=true/]);
  neg('H06', 'promotion', 'QA-F3: a CANDIDATE without policyChange may not change the CI workflow or CLAUDE.md', [
    g3((o) => { g(o, 3).authorisedScope = [...g(o, 3).authorisedScope, '.github/workflows/paep-ci.yml', 'CLAUDE.md'].sort(); }), ['work-packages/IB1-WP01/WORK_PACKAGE.md', () => '# simulated\n']], [/FAIL B08 .*\.github\/workflows\/paep-ci\.yml changes governance rules/, /CLAUDE\.md changes governance rules/]);
  custom('H01', 'promotion', 'QA-F1: a merge that keeps the pre-promotion registry (git merge -s ours) cannot hide the promoted generation', 'verify fails B09', () => {
    const Pm = gitOut('rev-parse', 'HEAD');
    git('update-ref', 'refs/remotes/origin/main', Pm);
    git('checkout', '-q', '-b', 'atk', M);
    fs.appendFileSync(P('evidence/IB1-PREFLIGHT-R7/README.md'), 'tamper\n');
    git('commit', '-q', '-am', 'tamper');
    git('merge', '-q', '-s', 'ours', '-m', 'hide promotion', Pm);
    const r = verify();
    git('checkout', '-q', '-f', 'sim-main');
    return { r, pass: r.status !== 0 && /FAIL B09 .*accepted generation 2 recorded on refs\/remotes\/origin\/main is missing or different here/.test(r.out) && /FAIL B09 .*recorded at [0-9a-f]{7} was rewritten or removed/.test(r.out) };
  });
  git('update-ref', 'refs/remotes/origin/main', mainBefore);
  git('checkout', '-q', '--detach', SNAP);

  // ---- I: PAEP-G6-PRR-01, the Generation 6 promotion-readiness remediation ---------------------------------------
  // Rebuilt in the copy from the controlled G6 record: the G6 accepted merge, its registry with generation 6 as
  // promoted, the PAEP-G6-PRR-01 record and the files it pins (the rule: the version whose self-hash matches).
  {
    const R = G6_PROMOTION_REMEDIATION;
    const rootGit = (...a) => spawnSync('git', a, { cwd: root, encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 });
    const pinned = (f, blob) => {
      const s = rootGit('cat-file', 'blob', blob);
      if (s.status === 0) return s.stdout;
      if (rootGit('hash-object', '--', f).stdout.trim() !== blob) throw new Error(`${f}: pinned blob ${blob} not found`);
      return fs.readFileSync(path.join(root, f), 'utf8');
    };
    const record = JSON.parse(pinned(R.record, R.recordBlob));
    const SELF = 'tooling/governance/baseline-governance.mjs';
    const selfPin = record.files.find((e) => e.path === SELF).value;
    const selfText = [fs.readFileSync(path.join(root, SELF), 'utf8'), ...rootGit('log', '--format=%H', '--', SELF).stdout.split('\n').filter(Boolean).map((c) => rootGit('show', `${c}:${SELF}`).stdout)]
      .find((t) => g6RemediationSelfHash(t) === selfPin);
    if (selfText === undefined) throw new Error(`no version of ${SELF} matches the ${R.id} record`);
    const atG6 = JSON.parse(git('show', `${R.acceptedCommit}:${REG}`).out);
    const promotedG6 = JSON.parse(fs.readFileSync(path.join(root, REG), 'utf8')).generations.find((x) => x.generation === R.generation);
    git('checkout', '-q', '-f', '--detach', R.acceptedCommit);
    git('clean', '-q', '-f', '-d');
    git('update-ref', 'refs/remotes/origin/main', R.acceptedCommit);
    fs.writeFileSync(P(REG), canon({ ...atG6, generations: atG6.generations.map((x) => (x.generation === R.generation ? promotedG6 : x)) }));
    fs.writeFileSync(P(R.record), pinned(R.record, R.recordBlob));
    for (const e of record.files) fs.writeFileSync(P(e.path), e.path === SELF ? selfText : pinned(e.path, e.value));
    const HARNESS = 'tooling/enterprise-shell/enterprise-qa-negative.mjs';
    const NEGBG = 'tooling/governance/negative-baseline-governance.mjs';
    const atBase = (f) => [f, () => (f === R.record ? null : git('show', `${R.acceptedCommit}:${f}`).out)];
    const extra = (f) => [f, (t) => `${t}// unrelated\n`];
    pos('I01', 'g6-remediation', 'G6 promotion with the exact pinned remediation validates (B11 names it)', [], [/PAEP baseline governance: PASS \(13\/13\); active G6 0d2f05e/, /PASS B11 .*all registry promotion; PAEP-G6-PRR-01 pinned remediation: tooling\/enterprise-shell\/enterprise-qa-negative\.mjs, tooling\/governance\/baseline-governance\.mjs, tooling\/governance\/g6-promotion-remediation\.json, tooling\/governance\/negative-baseline-governance\.mjs/]);
    pos('I02', 'g6-remediation', 'registry-only G6 promotion still validates (no remediation, original rule)', [atBase(HARNESS), atBase(NEGBG), atBase(SELF), atBase(R.record)], [/PAEP baseline governance: PASS \(13\/13\); active G6/, /PASS B11 .* — 1 changed paths since 0d2f05e, all registry promotion$/m]);
    pos('I03', 'g6-remediation', 'registry promotion with the rule and its record alone validates (harness and tests unchanged)', [atBase(HARNESS), atBase(NEGBG)], [/PAEP baseline governance: PASS \(13\/13\)/, /PAEP-G6-PRR-01 pinned remediation: tooling\/governance\/baseline-governance\.mjs, tooling\/governance\/g6-promotion-remediation\.json$/m]);
    neg('I04', 'g6-remediation', 'another enterprise-shell tooling file changed', [extra('tooling/enterprise-shell/enterprise-qa.mjs')], [/FAIL B11 .*unauthorised change: tooling\/enterprise-shell\/enterprise-qa\.mjs/]);
    neg('I05', 'g6-remediation', 'an unrelated change in the authorised harness file', [extra(HARNESS)], [/FAIL B11 .*unauthorised change: tooling\/enterprise-shell\/enterprise-qa-negative\.mjs/]);
    neg('I06', 'g6-remediation', 'an unrelated change in the governance tests', [extra(NEGBG)], [/FAIL B11 .*unauthorised change: tooling\/governance\/negative-baseline-governance\.mjs/]);
    neg('I07', 'g6-remediation', 'an unrelated change in the governance rule itself', [extra(SELF)], [/FAIL B11 .*unauthorised change: tooling\/governance\/baseline-governance\.mjs/]);
    neg('I08', 'g6-remediation', 'a production-code change', [extra('packages/frappe-sdk/src/index.ts')], [/FAIL B11 .*unauthorised change: packages\/frappe-sdk\/src\/index\.ts/]);
    neg('I09', 'g6-remediation', 'a dependency and lockfile change', [['package-lock.json', (t) => `${t}\n`], ['package.json', (t) => t.replace('"devDependencies": {', '"devDependencies": {\n    "left-pad": "1.3.0",')]], [/FAIL B11 .*unauthorised change: package-lock\.json/, /unauthorised change: package\.json/]);
    neg('I10', 'g6-remediation', 'scope widening: a new tooling file beside the remediation', [['tooling/governance/extra-rule.mjs', () => 'export {};\n']], [/FAIL B11 .*unauthorised change: tooling\/governance\/extra-rule\.mjs/]);
    neg('I11', 'g6-remediation', 'scope widening: the promoted G6 record gains a scope entry', [regEdit((o) => { g(o, 6).authorisedScope = [...g(o, 6).authorisedScope, 'packages/analytics/src/'].sort(); })], [/FAIL B09 .*generation 6 was changed while being promoted/]);
    const g7 = regEdit((o) => { o.generations.push({ generation: 7, name: 'next', milestone: 'IB5', workPackages: ['IB5-SIM'], status: 'CANDIDATE', predecessorGeneration: 6, authorisation: { authority: 'Product Owner / Solutions Architect', date: '2026-10-18', reference: 'work-packages/IB5-SIM/WORK_PACKAGE.md' }, policyChange: false, authorisedScope: ['evidence/IB5-SIM/', REG, 'work-packages/IB5-SIM/'], protectedRecords: ['evidence/IB5-SIM/', 'work-packages/IB5-SIM/'], acceptedCommit: null, acceptedTree: null, acceptance: null, fingerprints: null, notes: 'simulation' }); });
    const g7Record = ['work-packages/IB5-SIM/WORK_PACKAGE.md', () => '# simulated\n'];
    pos('I12', 'g6-remediation', 'a later CANDIDATE sees the remediation only as the pinned G6 delta', [g7, g7Record], [/PAEP baseline governance: PASS \(13\/13\)/, /candidate G7 IB5-SIM/]);
    neg('I13', 'g6-remediation', 'a later CANDIDATE gets no exception: a further harness change outside its scope fails', [g7, g7Record, extra(HARNESS)], [/FAIL B11 .*unauthorised change: tooling\/enterprise-shell\/enterprise-qa-negative\.mjs/]);
    const recEdit = (fn) => [R.record, (t) => { const o = JSON.parse(t); fn(o); return canon(o); }];
    const SDK = 'packages/frappe-sdk/src/index.ts';
    neg('I15', 'g6-remediation', 'the record is required: without it the remediation is not admitted', [[R.record, () => null]], [/FAIL B11 .*unauthorised change: tooling\/enterprise-shell\/enterprise-qa-negative\.mjs/, /unauthorised change: tooling\/governance\/baseline-governance\.mjs/]);
    neg('I16', 'g6-remediation', 'the record cannot be widened: an extra file in the record alone fails', [recEdit((o) => { o.files.push({ path: SDK, pin: 'git-blob', value: '0'.repeat(40) }); }), extra(SDK)], [/FAIL B11 .*unauthorised change: packages\/frappe-sdk\/src\/index\.ts/, /unauthorised change: tooling\/governance\/g6-promotion-remediation\.json/]);
    neg('I17', 'g6-remediation', 'the record cannot be re-pinned: a changed pin in the record alone fails', [recEdit((o) => { o.files[0].value = '0'.repeat(40); })], [/FAIL B11 .*unauthorised change: tooling\/governance\/g6-promotion-remediation\.json/]);
    neg('I18', 'g6-remediation', 'M1: widening the rule and re-pinning it in the record, without the record pin, fails', [
      [SELF, (t) => t.replace("['tooling/governance/negative-baseline-governance.mjs', 'git-blob']", `['tooling/governance/negative-baseline-governance.mjs', 'git-blob'],\n    ['${SDK}', 'git-blob']`)],
      extra(SDK),
      recEdit((o) => { o.files.find((e) => e.path === SELF).value = g6RemediationSelfHash(readText(SELF)); o.files.push({ path: SDK, pin: 'git-blob', value: gitOut('hash-object', '--', SDK) }); })
    ], [/FAIL B11 .*unauthorised change: packages\/frappe-sdk\/src\/index\.ts/, /unauthorised change: tooling\/governance\/g6-promotion-remediation\.json/]);
    neg('I19', 'g6-remediation', 'the record expires with generation 6: a record naming another baseline fails', [recEdit((o) => { o.activeBaseline = atG6.generations[4].acceptedCommit; })], [/FAIL B11 .*unauthorised change: tooling\/governance\/g6-promotion-remediation\.json/]);
    const mod = await import(pathToFileURL(P(SELF)).href);
    custom('I14', 'g6-remediation', 'future generations do not inherit: another active generation or accepted commit admits nothing', 'admitted only for active G6 at its accepted commit', () => {
      const paths = [HARNESS, NEGBG, SELF, R.record];
      const asG6 = paths.filter((f) => mod.g6RemediationAdmits(copy, { generation: 6, acceptedCommit: R.acceptedCommit }, f));
      const other = [{ generation: 7, acceptedCommit: R.acceptedCommit }, { generation: 7, acceptedCommit: gitOut('rev-parse', 'HEAD') }, { generation: 6, acceptedCommit: atG6.generations[4].acceptedCommit }, null]
        .flatMap((a) => paths.filter((f) => mod.g6RemediationAdmits(copy, a, f)));
      return { r: { status: other.length ? 1 : 0, out: `admitted for G6: ${asG6.join(', ')}; admitted otherwise: ${other.join(', ') || 'none'}` }, pass: asG6.length === 4 && other.length === 0 };
    });
    git('checkout', '-q', '-f', '--detach', SNAP);
    git('clean', '-q', '-f', '-d');
  }
} finally {
  fs.rmSync(scratch, { recursive: true, force: true });
}

const passed = results.length > 0 && results.every((r) => r.pass);
const head = spawnSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).stdout.trim();
const report = {
  workPackage: 'IB1-PREFLIGHT-R7', generatedAt: new Date().toISOString(), commit: head, node: process.versions.node, result: passed ? 'PASS' : 'FAIL',
  positives: results.filter((r) => r.expected.startsWith('exit 0') || r.expected.startsWith('identical') || r.expected.startsWith('every') || r.expected.startsWith('promote')).length,
  total: results.length, cases: results
};
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, 'baseline-governance-tests.log'), `# date: ${report.generatedAt} node: ${process.version} commit: ${head}\n\n${log.join('\n')}`, 'utf8');
fs.writeFileSync(path.join(outDir, 'baseline-governance-tests.json'), `${JSON.stringify(report, null, 2)}\n`, 'utf8');
for (const r of results) console.log(`${r.pass ? 'PASS' : 'FAIL'} ${r.id} [${r.section}] ${r.name} (exit ${r.exit})`);
console.log(`\nPAEP baseline-governance tests: ${passed ? 'PASS' : 'FAIL'} (${results.filter((r) => r.pass).length}/${results.length}; ${report.positives} positive, ${results.length - report.positives} negative)`);
process.exit(passed ? 0 : 1);
