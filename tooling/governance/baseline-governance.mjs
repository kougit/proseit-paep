#!/usr/bin/env node
/**
 * PAEP controlled baseline governance (IB1-PREFLIGHT-R7).
 *
 * Replaces the fixed IB0 baseline that verify-ib0-wp05.mjs used to hard-code
 * (residual risk R7) with one versioned, append-only registry:
 * tooling/governance/baseline-registry.json. The registry records baseline
 * generations. An ACCEPTED generation is bound to git history: a merge commit
 * on the first-parent mainline whose own tree carries the PO/SA acceptance
 * record. A CANDIDATE generation declares the change a work package is
 * authorised to make; it is never used as the comparison baseline.
 *
 * The current repository state is compared with the newest ACCEPTED
 * generation. Every changed path must be inside the candidate's authorised
 * scope; immutable controlled sources and accepted records must be unchanged.
 * Verification never writes the registry. Promotion is a separate command that
 * only succeeds for a mainline merge that already carries an ACCEPTED record.
 *
 * Usage (repository root):
 *   node tooling/governance/baseline-governance.mjs verify     B01-B13, exit 0/1
 *   node tooling/governance/baseline-governance.mjs status     active/candidate summary (JSON)
 *   node tooling/governance/baseline-governance.mjs promote --generation <n> --commit <sha>
 *
 * Node.js built-ins only. Design: work-packages/IB1-PREFLIGHT-R7/BASELINE_GOVERNANCE_DESIGN.md;
 * procedure: docs/architecture/BASELINE-ROLLOVER.md.
 */

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

export const REGISTRY_PATH = 'tooling/governance/baseline-registry.json';
const SCHEMA_ID = 'paep-baseline-registry';
const SCHEMA_VERSION = 1;
const TOP_KEYS = ['schema', 'schemaVersion', 'policy', 'generations'];
const POLICY_KEYS = ['acceptanceAuthorities', 'mainlineRef', 'immutablePaths', 'governedPaths'];
const GEN_KEYS = ['generation', 'name', 'milestone', 'workPackages', 'status', 'predecessorGeneration', 'authorisation',
  'policyChange', 'authorisedScope', 'protectedRecords', 'acceptedCommit', 'acceptedTree', 'acceptance', 'fingerprints', 'notes'];
const AUTH_KEYS = ['authority', 'date', 'reference'];
const ACCEPTANCE_KEYS = ['authority', 'date', 'evidence'];
const EVIDENCE_KEYS = ['path', 'blob'];
const STATES = ['ACCEPTED', 'CANDIDATE'];
// Floors taken from the controlled sources; the registry policy may tighten but never loosen them.
// PAEP-EQP-01 App. C: ACCEPTED is set by the Product Owner / Solutions Architect (a delegated reviewer needs a
// recorded delegation, which does not exist, so it is not listed). PACK_MANIFEST.json fingerprints .gitignore and .paep-control.
const CONTROLLED_AUTHORITIES = ['Product Owner / Solutions Architect'];
const IMMUTABLE_FLOOR = ['.gitignore', '.paep-control/', 'PACK_MANIFEST.json'];
// Paths that hold the rules deciding acceptance (CI workflow, verifiers, this module, CLAUDE.md). A CANDIDATE whose
// scope touches them (other than the registry file) must declare policyChange=true, so a governance change is explicit.
const GOVERNANCE_CRITICAL = ['.github/', 'CLAUDE.md', 'tooling/governance/', 'tooling/verification/'];
// One path segment: ASCII letters, digits, '.', '_' and '-', never '.' or '..'.
const SEGMENT = /^[A-Za-z0-9._-]+$/;
const WP_ID = /^[A-Z0-9]+(?:-[A-Z0-9]+)+$/;
const SHA = /^[0-9a-f]{40}$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;

// ---- helpers -------------------------------------------------------------------------------------
function makeGit(root) {
  return (...args) => {
    const r = spawnSync('git', ['-c', 'core.quotepath=off', ...args], { cwd: root, encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 });
    return { status: r.status, out: (r.stdout || '').trim(), raw: r.stdout || '', err: (r.stderr || '').trim() };
  };
}
const zlist = (raw) => raw.split('\0').filter(Boolean);
const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const keysEqual = (o, keys) => isObj(o) && JSON.stringify(Object.keys(o)) === JSON.stringify(keys);
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const validDate = (d) => typeof d === 'string' && DATE.test(d) && new Date(`${d}T00:00:00Z`).toISOString().slice(0, 10) === d;

/** Canonical repository-relative path: '/'-separated ASCII segments; a trailing '/' marks a directory subtree. */
export function canonicalPath(p) {
  if (typeof p !== 'string' || p.length === 0 || p.length > 200) return false;
  const body = p.endsWith('/') ? p.slice(0, -1) : p;
  if (!body) return false;
  return body.split('/').every((s) => SEGMENT.test(s) && s !== '.' && s !== '..');
}
export const covers = (entry, f) => (entry.endsWith('/') ? f.startsWith(entry) : f === entry);
export function overlaps(a, b, fold = false) {
  const x = fold ? a.toLowerCase() : a;
  const y = fold ? b.toLowerCase() : b;
  return x === y || (x.endsWith('/') && y.startsWith(x)) || (y.endsWith('/') && x.startsWith(y));
}
/** Raw text policy: printable ASCII and LF only (no BOM, CR, tab, NEL, LS/PS or other control characters). */
function asciiProblems(text) {
  for (let i = 0; i < text.length; i += 1) {
    const c = text.charCodeAt(i);
    if (c !== 0x0a && (c < 0x20 || c > 0x7e)) return `character U+${c.toString(16).toUpperCase().padStart(4, '0')} at offset ${i}`;
  }
  return null;
}

// ---- acceptance records ----------------------------------------------------------------------------
/** Checks work-package.json text as a well-formed ACCEPTED record by `authority`; returns { ok, date?, why? }. */
function wpAcceptance(raw, wp, label, authority) {
  let j;
  try { j = JSON.parse(raw); } catch { return { ok: false, why: `${label} is not JSON` }; }
  if (j?.id !== wp) return { ok: false, why: `${label} id is ${j?.id}` };
  if (j.status !== 'ACCEPTED' || j.acceptance?.status !== 'ACCEPTED') return { ok: false, why: `${label} is not ACCEPTED (status ${j.status}, acceptance ${j.acceptance?.status})` };
  if (j.acceptance?.authority !== authority) return { ok: false, why: `${label} acceptance authority "${j.acceptance?.authority}" != "${authority}"` };
  if (!validDate(j.acceptance?.date)) return { ok: false, why: `${label} acceptance date ${j.acceptance?.date} invalid` };
  return { ok: true, date: j.acceptance.date };
}
/** True when work-package.json text claims acceptance in any form (well formed or not, any case or padding). */
function claimsAccepted(raw) {
  let j;
  try { j = JSON.parse(raw); } catch { return /accepted/i.test(raw); }
  const is = (v) => typeof v === 'string' && v.trim().toLowerCase() === 'accepted';
  return is(j?.status) || is(j?.acceptance?.status);
}
/** A markdown "| Acceptance Status | ACCEPTED |" row in any case or emphasis (the IB0 report form). */
const REPORT_ACCEPTED = /Acceptance Status[^\n|]*\|\s*[*_`]*\s*accepted/i;
/** True when a work package's record folder at `ref` (a commit, or null for the working tree) claims acceptance in any form. */
function wpClaimsAccepted(git, ref, wp, root) {
  const dir = `work-packages/${wp}`;
  const files = ref
    ? git('ls-tree', '-r', '--name-only', '-z', ref, '--', `${dir}/`).raw.split('\0').filter(Boolean)
    : (fs.existsSync(path.join(root, dir)) ? fs.readdirSync(path.join(root, dir), { recursive: true }).map((n) => `${dir}/${String(n).split(path.sep).join('/')}`) : []);
  const text = (f) => {
    if (ref) { const r = git('show', `${ref}:${f}`); return r.status === 0 ? r.raw : null; }
    try { return fs.readFileSync(path.join(root, f), 'utf8'); } catch { return null; }
  };
  for (const f of files) {
    const t = text(f);
    if (t === null) continue;
    if (f === `${dir}/work-package.json` && claimsAccepted(t)) return true;
    if (/\.md$/i.test(f) && REPORT_ACCEPTED.test(t)) return true;
  }
  return false;
}
/** Reads an acceptance record at a commit; returns { ok, date?, why? }. */
function acceptanceRecord(git, commit, wp, file, authority) {
  const shown = git('show', `${commit}:${file}`);
  if (shown.status !== 0) return { ok: false, why: `${file} does not exist at ${commit.slice(0, 7)}` };
  if (file === `work-packages/${wp}/work-package.json`) return wpAcceptance(shown.raw, wp, `${file} at ${commit.slice(0, 7)}`, authority);
  if (file === `work-packages/${wp}/ACCEPTANCE_REPORT.md`) {
    // Accepted only for records written before work-package.json carried the acceptance (IB0-WP01).
    if (/^\| Acceptance Status \| \*{0,2}ACCEPTED\*{0,2} \|/m.test(shown.raw)) return { ok: true, date: null };
    return { ok: false, why: `${file} at ${commit.slice(0, 7)} has no "| Acceptance Status | ACCEPTED |" row` };
  }
  return { ok: false, why: `${file} is not an acceptance record of ${wp}` };
}

/**
 * Earliest first-parent mainline merge after `since` whose own registry carries CANDIDATE `generation` and whose tree
 * records ANY of that candidate's work packages as ACCEPTED in any form (a malformed claim freezes too). Returns
 * { commit, candidate } where `candidate` is the generation as merged (read from the mainline, never from HEAD), or null.
 */
function acceptedMergeOf(git, generation, since, mainline) {
  const list = git('rev-list', '--first-parent', '--merges', '--reverse', `${since}..${mainline}`).out.split('\n').filter(Boolean);
  for (const c of list) {
    let r = null;
    try { r = JSON.parse(git('show', `${c}:${REGISTRY_PATH}`).raw); } catch { continue; }
    const g = Array.isArray(r?.generations) ? r.generations.find((x) => x?.generation === generation && x.status === 'CANDIDATE') : null;
    const wps = Array.isArray(g?.workPackages) ? g.workPackages : [];
    const hit = wps.some((wp) => typeof wp === 'string' && wpClaimsAccepted(git, c, wp, null));
    if (hit) return { commit: c, candidate: g };
  }
  return null;
}

// ---- PAEP-G6-PRR-01: Generation 6 promotion-readiness remediation -------------------------------------
// PO/SA decisions of 2026-10-17 (Option B, fix first; M1: add pin record): the Generation 6 promotion may also carry
// the fix of the enterprise-shell negative harness, this rule and its tests. The controlled record names the exact
// files and their pinned content; this rule pins the record and validates it. While generation 6, accepted at the
// recorded commit, is the active baseline, exactly the recorded files and the record itself may also differ from it,
// each only with its pinned content. Any other path or content, and every other active generation, gets no exception.
export const G6_PROMOTION_REMEDIATION = Object.freeze({
  id: 'PAEP-G6-PRR-01',
  generation: 6,
  acceptedCommit: '0d2f05e2202e6f5757d82966d299d99ece96c7de',
  record: 'tooling/governance/g6-promotion-remediation.json',
  recordBlob: 'da98ee7714c4293d793583c0f2f85b0bf91a229d',
  files: Object.freeze([
    ['tooling/enterprise-shell/enterprise-qa-negative.mjs', 'git-blob'],
    ['tooling/governance/baseline-governance.mjs', 'sha256-self'],
    ['tooling/governance/negative-baseline-governance.mjs', 'git-blob']
  ])
});
const PRR_KEYS = ['id', 'purpose', 'generation', 'activeBaseline', 'expiry', 'authorisation', 'notAuthorised', 'files'];
/** SHA-256 of this module's text with its pin of the record blanked (the record pins this module by it). */
export const g6RemediationSelfHash = (text) => crypto.createHash('sha256').update(text.replace(/(recordBlob: ')[0-9a-f]{40}(')/, '$1$2')).digest('hex');
const readFile = (root, f) => { try { return fs.lstatSync(path.join(root, f)).isFile() ? fs.readFileSync(path.join(root, f), 'utf8') : null; } catch { return null; } };
/** The PAEP-G6-PRR-01 record's pins by path, or null when the record is absent, altered or not exactly as required. */
function g6RemediationRecord(root) {
  const R = G6_PROMOTION_REMEDIATION;
  const text = readFile(root, R.record);
  if (text === null || makeGit(root)('hash-object', '--', R.record).out !== R.recordBlob || asciiProblems(text)) return null;
  let rec = null;
  try { rec = JSON.parse(text); } catch { return null; }
  const ok = text === `${JSON.stringify(rec, null, 2)}\n` && keysEqual(rec, PRR_KEYS) && rec.id === R.id && rec.generation === R.generation && rec.activeBaseline === R.acceptedCommit
    && ['purpose', 'expiry', 'notAuthorised'].every((k) => typeof rec[k] === 'string' && rec[k].length > 0)
    && keysEqual(rec.authorisation, AUTH_KEYS) && CONTROLLED_AUTHORITIES.includes(rec.authorisation.authority) && validDate(rec.authorisation.date) && typeof rec.authorisation.reference === 'string'
    && Array.isArray(rec.files) && rec.files.length === R.files.length
    && rec.files.every((e, i) => keysEqual(e, ['path', 'pin', 'value']) && e.path === R.files[i][0] && e.pin === R.files[i][1] && typeof e.value === 'string');
  return ok ? new Map(rec.files.map((e) => [e.path, e])) : null;
}
/** True when f, changed since the active baseline, is exactly the recorded Generation 6 remediation. */
export function g6RemediationAdmits(root, active, f) {
  const R = G6_PROMOTION_REMEDIATION;
  if (active?.generation !== R.generation || active.acceptedCommit !== R.acceptedCommit) return false;
  const pins = g6RemediationRecord(root);
  if (!pins) return false;
  if (f === R.record) return true;
  const e = pins.get(f);
  const text = e ? readFile(root, f) : null;
  if (text === null) return false;
  return e.pin === 'sha256-self' ? g6RemediationSelfHash(text) === e.value : makeGit(root)('hash-object', '--', f).out === e.value;
}

// ---- core evaluation --------------------------------------------------------------------------------
/**
 * Evaluates the registry and the working tree. Returns
 * { results: [{id,name,pass,details}], ok, registry, active, candidate, base, changedPaths, inScope, authorisedSince, packageProblems }.
 * `base` is the active accepted commit, or null when no valid accepted generation exists (fail closed).
 */
export function evaluate(root = process.cwd(), { registryText = null } = {}) {
  const git = makeGit(root);
  const results = [];
  const add = (id, name, problems, okDetail) => results.push({ id, name, pass: problems.length === 0, details: problems.length ? problems.join('; ') : okDetail });
  const abs = (p) => path.join(root, p);
  const fatal = []; // structural failures that make later rules meaningless

  // B01: raw file
  const p01 = [];
  let text = registryText;
  let reg = null;
  if (text === null) {
    let st = null;
    try { st = fs.lstatSync(abs(REGISTRY_PATH)); } catch { p01.push(`${REGISTRY_PATH} missing`); }
    if (st && !st.isFile()) p01.push(`${REGISTRY_PATH} is not a regular file${st.isSymbolicLink() ? ' (symlink)' : ''}`);
    if (st && st.isFile()) text = fs.readFileSync(abs(REGISTRY_PATH), 'utf8');
  }
  if (text !== null) {
    const bad = asciiProblems(text);
    if (bad) p01.push(`registry contains ${bad}`);
    try { reg = JSON.parse(text); } catch (e) { p01.push(`registry is not JSON: ${e.message}`); }
    // Canonical form rejects duplicate keys (JSON.parse keeps only the last), escapes, comments-by-whitespace and trailing data.
    if (reg && text !== `${JSON.stringify(reg, null, 2)}\n`) p01.push('registry is not in canonical form (JSON.stringify(value, null, 2) + LF): duplicate keys, escapes or non-canonical layout');
  }
  add('B01', 'Registry is one regular file of printable ASCII and LF in canonical JSON (no duplicate keys, escapes, BOM, CR or control/line-separator characters)', p01, REGISTRY_PATH);
  if (p01.length) fatal.push('B01');

  // B02: schema
  const p02 = [];
  if (reg && !fatal.length) {
    if (!keysEqual(reg, TOP_KEYS)) p02.push(`top-level keys ${JSON.stringify(Object.keys(reg || {}))} != ${JSON.stringify(TOP_KEYS)}`);
    if (reg.schema !== SCHEMA_ID) p02.push(`schema "${reg.schema}" != "${SCHEMA_ID}"`);
    if (reg.schemaVersion !== SCHEMA_VERSION) p02.push(`unknown schemaVersion ${JSON.stringify(reg.schemaVersion)}`);
    const pol = reg.policy;
    if (!keysEqual(pol, POLICY_KEYS)) p02.push(`policy keys ${JSON.stringify(Object.keys(pol || {}))} != ${JSON.stringify(POLICY_KEYS)}`);
    else {
      for (const k of ['acceptanceAuthorities', 'immutablePaths', 'governedPaths']) if (!Array.isArray(pol[k]) || !pol[k].length || !pol[k].every((x) => typeof x === 'string')) p02.push(`policy.${k} is not a non-empty string array`);
      if (pol.mainlineRef !== 'refs/remotes/origin/main') p02.push(`policy.mainlineRef "${pol.mainlineRef}" != "refs/remotes/origin/main"`);
    }
    if (!Array.isArray(reg.generations) || !reg.generations.length) p02.push('generations is not a non-empty array');
    else for (const [i, g] of reg.generations.entries()) {
      const at = `generations[${i}]`;
      if (!keysEqual(g, GEN_KEYS)) { p02.push(`${at} keys ${JSON.stringify(Object.keys(g || {}))} != ${JSON.stringify(GEN_KEYS)}`); continue; }
      if (!Number.isInteger(g.generation)) p02.push(`${at}.generation is not an integer`);
      for (const k of ['name', 'milestone', 'notes']) if (typeof g[k] !== 'string' || !g[k]) p02.push(`${at}.${k} is not a non-empty string`);
      if (!Array.isArray(g.workPackages) || !g.workPackages.length || !g.workPackages.every((w) => typeof w === 'string' && WP_ID.test(w))) p02.push(`${at}.workPackages is not a non-empty list of work-package IDs`);
      if (!STATES.includes(g.status)) p02.push(`${at}.status ${JSON.stringify(g.status)} is not one of ${STATES.join(', ')} (unknown state fails closed)`);
      if (!(g.predecessorGeneration === null || Number.isInteger(g.predecessorGeneration))) p02.push(`${at}.predecessorGeneration is not an integer or null`);
      if (typeof g.policyChange !== 'boolean') p02.push(`${at}.policyChange is not boolean`);
      if (!Array.isArray(g.protectedRecords) || !g.protectedRecords.every((x) => typeof x === 'string')) p02.push(`${at}.protectedRecords is not a string array`);
      if (!(g.authorisedScope === null || (Array.isArray(g.authorisedScope) && g.authorisedScope.every((x) => typeof x === 'string')))) p02.push(`${at}.authorisedScope is not a string array or null`);
      if (!(g.authorisation === null || (keysEqual(g.authorisation, AUTH_KEYS) && AUTH_KEYS.every((k) => typeof g.authorisation[k] === 'string')))) p02.push(`${at}.authorisation is not null or {${AUTH_KEYS.join(', ')}}`);
      if (g.status === 'ACCEPTED') {
        if (typeof g.acceptedCommit !== 'string' || !SHA.test(g.acceptedCommit)) p02.push(`${at}.acceptedCommit is not a full 40-hex commit id`);
        if (typeof g.acceptedTree !== 'string' || !SHA.test(g.acceptedTree)) p02.push(`${at}.acceptedTree is not a full 40-hex tree id`);
        if (!keysEqual(g.acceptance, ACCEPTANCE_KEYS) || typeof g.acceptance.authority !== 'string' || typeof g.acceptance.date !== 'string' || !Array.isArray(g.acceptance.evidence) || !g.acceptance.evidence.length
          || !g.acceptance.evidence.every((e) => keysEqual(e, EVIDENCE_KEYS) && typeof e.path === 'string' && typeof e.blob === 'string')) p02.push(`${at}.acceptance is not {authority, date, evidence: [{path, blob}, ...]} (acceptance authority and evidence are mandatory)`);
        if (!isObj(g.fingerprints) || !Object.values(g.fingerprints).every((v) => typeof v === 'string')) p02.push(`${at}.fingerprints is not an object of strings`);
      }
      if (g.status === 'CANDIDATE') {
        for (const k of ['acceptedCommit', 'acceptedTree', 'acceptance', 'fingerprints']) if (g[k] !== null) p02.push(`${at}.${k} must be null while CANDIDATE (a candidate carries no acceptance)`);
        if (g.authorisation === null) p02.push(`${at}.authorisation is required for a CANDIDATE`);
        if (!Array.isArray(g.authorisedScope) || !g.authorisedScope.length) p02.push(`${at}.authorisedScope must list the authorised paths`);
      }
    }
  } else if (!fatal.length) p02.push('no registry');
  add('B02', `Schema ${SCHEMA_ID} v${SCHEMA_VERSION}: exact keys and types; known state; ACCEPTED carries commit, tree, authority, evidence and fingerprints; CANDIDATE carries authorisation and scope and no acceptance`, p02, `schemaVersion ${SCHEMA_VERSION}; ${reg?.generations?.length ?? 0} generations`);
  if (p02.length) fatal.push('B02');

  const gens = !fatal.length ? reg.generations : [];
  const accepted = gens.filter((g) => g.status === 'ACCEPTED');
  const candidates = gens.filter((g) => g.status === 'CANDIDATE');
  const candidate = candidates[0] || null;
  let active = accepted[accepted.length - 1] || null;

  // B03: sequence
  const p03 = [];
  if (!fatal.length) {
    gens.forEach((g, i) => {
      if (g.generation !== i + 1) p03.push(`generation at index ${i} is ${g.generation}; generations must be 1, 2, 3, ... with no gap, duplicate or rollback`);
      if (g.predecessorGeneration !== (i === 0 ? null : i)) p03.push(`generation ${g.generation} predecessor ${g.predecessorGeneration} != ${i === 0 ? null : i}`);
    });
    if (!accepted.length) p03.push('no ACCEPTED generation (there is no accepted baseline to compare with)');
    if (candidates.length > 1) p03.push(`${candidates.length} CANDIDATE generations; at most one is allowed`);
    if (candidate && gens[gens.length - 1] !== candidate) p03.push(`CANDIDATE generation ${candidate.generation} is not the last generation`);
    if (gens[0] && gens[0].status !== 'ACCEPTED') p03.push('generation 1 is not ACCEPTED');
    const seen = new Set();
    for (const g of gens) for (const w of g.workPackages) { if (seen.has(w)) p03.push(`work package ${w} appears in more than one generation`); seen.add(w); }
  }
  add('B03', 'Generations are numbered 1..n with predecessor n-1; ACCEPTED generations come first; at most one CANDIDATE and it is last; each work package belongs to one generation', p03,
    `${accepted.length} ACCEPTED (active generation ${active?.generation}); CANDIDATE ${candidate ? candidate.generation : 'none'}`);
  if (p03.length) fatal.push('B03');

  // B04: paths
  const p04 = [];
  const pol = !fatal.length ? reg.policy : null;
  if (pol) {
    const lists = [['policy.acceptanceAuthorities', null], ['policy.immutablePaths', pol.immutablePaths], ['policy.governedPaths', pol.governedPaths],
      ...gens.flatMap((g) => [[`generation ${g.generation} protectedRecords`, g.protectedRecords], [`generation ${g.generation} authorisedScope`, g.authorisedScope || []]])];
    for (const [where, list] of lists) {
      if (!list) continue;
      for (const p of list) if (!canonicalPath(p)) p04.push(`${where}: non-canonical path ${JSON.stringify(p)} (no '..', '.', '\\', leading '/', empty segment or non-ASCII)`);
      const folded = list.map((p) => p.toLowerCase());
      if (new Set(folded).size !== folded.length) p04.push(`${where}: duplicate entry (case-insensitive)`);
      if (!same(list, [...list].sort())) p04.push(`${where}: entries not sorted`);
    }
    if (new Set(pol.acceptanceAuthorities).size !== pol.acceptanceAuthorities.length) p04.push('policy.acceptanceAuthorities: duplicate entry');
    for (const a of pol.acceptanceAuthorities) if (!CONTROLLED_AUTHORITIES.includes(a)) p04.push(`policy.acceptanceAuthorities: "${a}" is not a controlled acceptance authority (PAEP-EQP-01 App. C)`);
    for (const i of IMMUTABLE_FLOOR) if (!pol.immutablePaths.includes(i)) p04.push(`policy.immutablePaths lacks controlled source ${i}`);
    for (const i of pol.immutablePaths) for (const g of pol.governedPaths) if (overlaps(i, g, true)) p04.push(`immutable ${i} overlaps governed ${g}`);
    for (const g of gens) {
      // Each generation protects exactly the work-package and evidence folders of its own work packages.
      const want = g.workPackages.flatMap((w) => [`evidence/${w}/`, `work-packages/${w}/`]).sort();
      if (!same(g.protectedRecords, want)) p04.push(`generation ${g.generation} protectedRecords ${JSON.stringify(g.protectedRecords)} != ${JSON.stringify(want)}`);
    }
  }
  add('B04', 'Every registry path is canonical (no traversal, backslash, absolute, empty or non-ASCII segment), sorted and unique ignoring case; protected records are the generation\'s own work-package and evidence folders', p04, 'all paths canonical');
  if (p04.length) fatal.push('B04');

  // Mainline facts.
  let mainline = null;
  let firstParent = new Set();
  if (!fatal.length) {
    const m = git('rev-parse', '--verify', '--quiet', `${pol.mainlineRef}^{commit}`);
    if (m.status === 0) { mainline = m.out; firstParent = new Set(git('rev-list', '--first-parent', mainline).out.split('\n').filter(Boolean)); }
  }
  const head = git('rev-parse', '--verify', 'HEAD^{commit}').out;

  // B05: accepted generations bound to mainline history
  const p05 = [];
  if (!fatal.length) {
    if (!mainline) p05.push(`${pol.mainlineRef} not found (fetch the mainline; verification fails closed without it)`);
    let prev = null;
    for (const g of accepted) {
      const c = g.acceptedCommit;
      const at = `generation ${g.generation}`;
      if (git('cat-file', '-t', c).out !== 'commit') { p05.push(`${at}: acceptedCommit ${c} does not exist (nonexistent predecessor baseline)`); prev = null; continue; }
      const parents = git('rev-list', '--parents', '-n', '1', c).out.split(' ').slice(1);
      if (parents.length < 2) p05.push(`${at}: ${c.slice(0, 7)} is not a merge commit (accepted baselines are PO/SA-authorised merges)`);
      if (mainline && !firstParent.has(c)) p05.push(`${at}: ${c.slice(0, 7)} is not on the first-parent history of ${pol.mainlineRef}`);
      if (git('merge-base', '--is-ancestor', c, 'HEAD').status !== 0) p05.push(`${at}: ${c.slice(0, 7)} is not an ancestor of HEAD`);
      const tree = git('rev-parse', `${c}^{tree}`).out;
      if (tree !== g.acceptedTree) p05.push(`${at}: acceptedTree ${g.acceptedTree.slice(0, 7)} != tree of ${c.slice(0, 7)} (${tree.slice(0, 7)})`);
      if (prev && (prev === c || git('merge-base', '--is-ancestor', prev, c).status !== 0)) p05.push(`${at}: ${c.slice(0, 7)} does not descend from the previous accepted commit ${prev.slice(0, 7)}`);
      prev = c;
    }
  }
  add('B05', 'Each ACCEPTED generation names an existing merge commit on the first-parent mainline, an ancestor of HEAD, with the recorded tree; accepted commits descend from one another', p05,
    accepted.map((g) => `G${g.generation} ${g.acceptedCommit.slice(0, 7)} tree ${g.acceptedTree.slice(0, 7)}`).join('; '));

  // B06: acceptance authority and evidence
  const p06 = [];
  if (!fatal.length) {
    let prevDate = '';
    for (const g of accepted) {
      const at = `generation ${g.generation}`;
      const a = g.acceptance;
      if (!pol.acceptanceAuthorities.includes(a.authority)) p06.push(`${at}: acceptance authority "${a.authority}" is not a controlled acceptance authority`);
      if (!validDate(a.date)) p06.push(`${at}: acceptance date ${a.date} invalid`);
      if (a.date < prevDate) p06.push(`${at}: acceptance date ${a.date} precedes the previous generation (${prevDate})`);
      prevDate = a.date;
      if (git('cat-file', '-t', g.acceptedCommit).out !== 'commit') continue;
      const paths = a.evidence.map((e) => e.path);
      if (!same(paths, [...paths].sort()) || new Set(paths).size !== paths.length) p06.push(`${at}: evidence paths not sorted/unique`);
      const dates = [];
      for (const wp of g.workPackages) {
        const mine = a.evidence.filter((e) => e.path.startsWith(`work-packages/${wp}/`));
        if (!mine.length) { p06.push(`${at}: no acceptance evidence for ${wp} (unaccepted milestone)`); continue; }
        if (g.generation > 1 && !mine.some((e) => e.path === `work-packages/${wp}/work-package.json`)) p06.push(`${at}: ${wp} evidence must include work-packages/${wp}/work-package.json`);
        for (const e of mine) {
          const r = acceptanceRecord(git, g.acceptedCommit, wp, e.path, a.authority);
          if (!r.ok) p06.push(`${at}: ${r.why}`);
          else if (r.date) dates.push(r.date);
        }
      }
      for (const e of a.evidence) {
        if (!g.workPackages.some((wp) => e.path.startsWith(`work-packages/${wp}/`))) p06.push(`${at}: evidence ${e.path} is not a record of the generation's work packages`);
        const blob = git('rev-parse', '--verify', '--quiet', `${g.acceptedCommit}:${e.path}`).out;
        if (blob !== e.blob) p06.push(`${at}: evidence ${e.path} blob ${e.blob.slice(0, 7)} != ${blob ? blob.slice(0, 7) : 'absent'} at ${g.acceptedCommit.slice(0, 7)}`);
      }
      if (dates.length && a.date !== dates.sort().pop()) p06.push(`${at}: acceptance date ${a.date} != latest recorded acceptance date ${dates.sort().pop()}`);
    }
  }
  add('B06', 'Each ACCEPTED generation names a controlled acceptance authority and, for every work package, an acceptance record that says ACCEPTED inside the accepted commit itself (blob-pinned)', p06,
    accepted.map((g) => `G${g.generation}: ${g.acceptance.authority}, ${g.acceptance.date}, ${g.acceptance.evidence.length} records`).join('; '));

  // B07: fingerprints
  const p07 = [];
  if (!fatal.length) {
    // Each generation keeps the fingerprint set of the policy it was accepted under. The active generation must
    // cover the current policy exactly, except while a CANDIDATE with policyChange changes an existing registry's policy.
    const bootstrap = git('cat-file', '-e', `${active.acceptedCommit}:${REGISTRY_PATH}`).status !== 0;
    const policyInChange = Boolean(candidate && candidate.policyChange && !bootstrap);
    for (const g of accepted) {
      const got = Object.keys(g.fingerprints);
      const floor = [...IMMUTABLE_FLOOR, ...g.protectedRecords];
      const exact = g === active && !policyInChange ? [...pol.immutablePaths, ...pol.governedPaths, ...g.protectedRecords].sort() : null;
      const missing = (exact || floor).filter((k) => !got.includes(k));
      const extra = exact ? got.filter((k) => !exact.includes(k)) : [];
      if (missing.length || extra.length) p07.push(`generation ${g.generation}: fingerprint keys differ from ${exact ? 'immutable + governed + protected paths' : 'the immutable floor + protected records'} (missing: ${missing.join(', ') || 'none'}; extra: ${extra.join(', ') || 'none'})`);
      if (!same(got, [...got].sort()) || !got.every(canonicalPath)) p07.push(`generation ${g.generation}: fingerprint keys not sorted canonical paths`);
      if (git('cat-file', '-t', g.acceptedCommit).out !== 'commit') continue;
      for (const k of got.filter(canonicalPath)) {
        const obj = git('rev-parse', '--verify', '--quiet', `${g.acceptedCommit}:${k.replace(/\/$/, '')}`).out || 'absent';
        if (g.fingerprints[k] !== obj) p07.push(`generation ${g.generation}: fingerprint ${k} ${g.fingerprints[k].slice(0, 12)} != git object ${obj.slice(0, 12)} at ${g.acceptedCommit.slice(0, 7)}`);
      }
      for (const k of [...pol.immutablePaths, ...g.protectedRecords]) if (g.fingerprints[k] === 'absent') p07.push(`generation ${g.generation}: protected ${k} is absent at the accepted commit`);
    }
  }
  add('B07', 'Fingerprints cover exactly the immutable, governed and protected paths and equal the git objects at the accepted commit (recomputed from history, never from the working tree)', p07,
    accepted.map((g) => `G${g.generation}: ${Object.keys(g.fingerprints).length} fingerprints`).join('; '));

  // Scope helpers (valid only after B01-B04; an invalid candidate authorises nothing, see B08).
  let scope = candidate ? candidate.authorisedScope : [];
  const inScope = (f) => scope.some((e) => covers(e, f));
  const protectedAll = !fatal.length ? gens.filter((g) => g.status === 'ACCEPTED').flatMap((g) => g.protectedRecords) : [];

  // B08: candidate
  const p08 = [];
  if (!fatal.length && candidate) {
    const c = candidate;
    if (!pol.acceptanceAuthorities.includes(c.authorisation.authority)) p08.push(`authorisation authority "${c.authorisation.authority}" is not a controlled authority`);
    if (!validDate(c.authorisation.date)) p08.push(`authorisation date ${c.authorisation.date} invalid`);
    else if (active && c.authorisation.date < active.acceptance.date) p08.push(`authorisation date ${c.authorisation.date} precedes the accepted predecessor (${active.acceptance.date})`);
    if (!canonicalPath(c.authorisation.reference) || !c.protectedRecords.some((r) => covers(r, c.authorisation.reference)) || !fs.existsSync(abs(c.authorisation.reference))) p08.push(`authorisation reference ${c.authorisation.reference} is not an existing file in the candidate's own records`);
    for (const wp of c.workPackages) for (const d of ['work-packages', 'evidence']) if (!c.protectedRecords.includes(`${d}/${wp}/`)) p08.push(`protectedRecords lacks ${d}/${wp}/`);
    for (const r of c.protectedRecords) if (!inScope(r)) p08.push(`own record ${r} is not in authorisedScope`);
    for (const e of c.authorisedScope) {
      if (/^[^/]+\/$/.test(e)) p08.push(`scope entry ${e} authorises a whole top-level directory (too broad)`);
      for (const i of pol.immutablePaths) if (overlaps(e, i, true)) p08.push(`scope entry ${e} overlaps immutable ${i}`);
      for (const r of protectedAll) if (overlaps(e, r, true)) p08.push(`scope entry ${e} overlaps accepted record ${r}`);
    }
    if (!inScope(REGISTRY_PATH)) p08.push(`authorisedScope must list ${REGISTRY_PATH} (declaring a candidate changes the registry)`);
    if (c.policyChange !== true) for (const e of c.authorisedScope) if (e !== REGISTRY_PATH && GOVERNANCE_CRITICAL.some((k) => overlaps(e, k, true))) p08.push(`scope entry ${e} changes governance rules; it requires policyChange=true (an explicit, PO/SA-authorised governance change)`);
  }
  if (p08.length) scope = [];
  add('B08', 'The CANDIDATE (if any) carries PO/SA authorisation with a reference in its own records, lists its own records and the registry, never overlaps immutable sources, accepted records or a whole top-level directory, and declares policyChange when it touches governance rules', p08,
    candidate ? `G${candidate.generation} ${candidate.workPackages.join(', ')}: ${candidate.authorisedScope.length} scope entries${candidate.policyChange ? '; GOVERNANCE CHANGE (policyChange=true)' : ''}` : 'no candidate');

  // B09: registry history (append-only; policy fixed unless the candidate declares policyChange)
  const p09 = [];
  if (!fatal.length && active && git('cat-file', '-t', active.acceptedCommit).out === 'commit') {
    const baseShow = git('show', `${active.acceptedCommit}:${REGISTRY_PATH}`);
    if (baseShow.status !== 0) {
      // Bootstrap: the registry did not exist at the active accepted commit.
      if (!candidate || candidate.policyChange !== true) p09.push(`registry absent at ${active.acceptedCommit.slice(0, 7)}: only a CANDIDATE with policyChange=true may bootstrap it`);
      if (accepted.length !== 1) p09.push(`bootstrap may record exactly one pre-existing accepted generation, found ${accepted.length}`);
    } else {
      let baseReg = null;
      try { baseReg = JSON.parse(baseShow.raw); } catch { p09.push(`registry at ${active.acceptedCommit.slice(0, 7)} is not JSON`); }
      if (baseReg) {
        if (!same(reg.policy, baseReg.policy) && !(candidate && candidate.policyChange === true)) p09.push(`policy differs from the accepted registry at ${active.acceptedCommit.slice(0, 7)} and no CANDIDATE declares policyChange`);
        for (const bg of baseReg.generations || []) {
          const cur = gens.find((g) => g.generation === bg.generation);
          if (bg.status === 'ACCEPTED' && !same(cur, bg)) p09.push(`accepted generation ${bg.generation} was rewritten or removed`);
          if (bg.status === 'CANDIDATE') {
            if (bg.generation !== active.generation) p09.push(`the candidate merged in ${active.acceptedCommit.slice(0, 7)} was generation ${bg.generation}, but the active generation is ${active.generation}`);
            const decl = (g) => g && { ...g, status: null, acceptedCommit: null, acceptedTree: null, acceptance: null, fingerprints: null };
            if (!same(decl(cur), decl(bg))) p09.push(`generation ${bg.generation} was changed while being promoted (only status, commit, tree, acceptance and fingerprints may be filled in)`);
          }
        }
      }
    }
    // Every ACCEPTED generation in the mainline registry, and in any committed version of the registry in HEAD's
    // history, must survive unchanged. --full-history: a merge that keeps one side's registry must not hide the other.
    if (mainline) {
      const ms = git('show', `${mainline}:${REGISTRY_PATH}`);
      if (ms.status === 0) {
        let mreg = null;
        try { mreg = JSON.parse(ms.raw); } catch { p09.push(`registry at ${pol.mainlineRef} is not JSON`); }
        for (const og of (mreg?.generations || []).filter((g) => g.status === 'ACCEPTED')) if (!same(gens.find((g) => g.generation === og.generation), og)) p09.push(`accepted generation ${og.generation} recorded on ${pol.mainlineRef} is missing or different here (stale or rolled-back baseline)`);
      }
    }
    const commits = git('log', '--full-history', '--format=%H', 'HEAD', '--', REGISTRY_PATH).out.split('\n').filter(Boolean);
    for (const c of commits) {
      const s = git('show', `${c}:${REGISTRY_PATH}`);
      if (s.status !== 0) continue; // deletion commit
      let old = null;
      try { old = JSON.parse(s.raw); } catch { p09.push(`registry at ${c.slice(0, 7)} is not JSON`); continue; }
      for (const og of (old.generations || []).filter((g) => g.status === 'ACCEPTED')) if (!same(gens.find((g) => g.generation === og.generation), og)) p09.push(`accepted generation ${og.generation} recorded at ${c.slice(0, 7)} was rewritten or removed`);
    }
  }
  add('B09', 'Registry is append-only: accepted generations recorded at the active accepted commit or anywhere in HEAD\'s history are unchanged; a promotion only fills acceptance fields; policy changes only under a CANDIDATE that declares policyChange', p09,
    'append-only history holds');

  // Working-tree facts relative to the active accepted commit.
  const base = !fatal.length && !p05.length && !p06.length && !p07.length && !p09.length && active ? active.acceptedCommit : null;
  let changedPaths = [];
  const p11 = [];
  if (base) {
    const d = git('diff', '--name-only', '--no-renames', '-z', base);
    const u = git('ls-files', '--others', '--exclude-standard', '-z');
    if (d.status !== 0) p11.push(`git diff ${base} failed (full history required): ${d.err}`);
    changedPaths = [...new Set([...zlist(d.raw), ...zlist(u.raw)])].sort();
  }

  // B10: immutable sources and accepted records unchanged since their accepted commits
  const p10 = [];
  if (base) {
    for (const g of accepted) for (const k of [...pol.immutablePaths, ...g.protectedRecords]) {
      const spec = k.replace(/\/$/, '');
      const d = git('diff', '--name-only', '--no-renames', '-z', g.acceptedCommit, '--', spec);
      const u = git('ls-files', '--others', '--exclude-standard', '-z', '--', spec);
      const hits = [...zlist(d.raw), ...zlist(u.raw)];
      if (d.status !== 0 || hits.length) p10.push(`${k} differs from generation ${g.generation} (${g.acceptedCommit.slice(0, 7)}): ${hits.join(', ') || d.err}`);
    }
  } else p10.push('no valid accepted baseline (see B01-B09)');
  add('B10', 'Immutable controlled sources and every accepted work-package and evidence record are unchanged since their accepted commit (no rewrite, removal or addition)', p10,
    `${pol ? pol.immutablePaths.length : 0} immutable paths and ${protectedAll.length} accepted records unchanged`);

  // B11: change authorisation
  const remediation = [];
  if (base) {
    const all = [...new Set([...zlist(git('ls-files', '-z').raw), ...changedPaths])];
    const folded = new Map();
    for (const f of all) { const k = f.toLowerCase(); if (folded.has(k) && folded.get(k) !== f) p11.push(`case-variant paths ${folded.get(k)} and ${f}`); folded.set(k, f); }
    for (const f of changedPaths) {
      if (!canonicalPath(f) || f.endsWith('/')) { p11.push(`non-canonical changed path ${JSON.stringify(f)}`); continue; }
      for (const k of [...pol.immutablePaths, ...protectedAll]) if (!covers(k, f) && covers(k.toLowerCase(), f.toLowerCase())) p11.push(`${f} is a case variant of protected ${k}`);
      let st = null;
      try { st = fs.lstatSync(abs(f)); } catch { /* deleted */ }
      if (st && st.isSymbolicLink()) p11.push(`${f} is a symlink`);
      if (g6RemediationAdmits(root, active, f)) { remediation.push(f); continue; }
      if (candidate ? !inScope(f) : f !== REGISTRY_PATH) p11.push(`unauthorised change: ${f}`);
    }
    for (const l of git('ls-files', '-s', '-z').raw.split('\0').filter(Boolean)) if (l.startsWith('120000 ')) p11.push(`tracked symlink ${l.split('\t')[1]}`);
  } else p11.push('no valid accepted baseline (see B01-B09)');
  add('B11', 'Every path changed since the active accepted baseline is canonical, not a symlink or case variant, and inside the CANDIDATE\'s authorised scope (without a candidate only a promotion of the registry may change)', p11,
    base ? `${changedPaths.length} changed paths since ${base.slice(0, 7)}, all ${candidate ? `in the G${candidate.generation} scope` : 'registry promotion'}${remediation.length ? `; ${G6_PROMOTION_REMEDIATION.id} pinned remediation: ${remediation.join(', ')}` : ''}` : '');

  // B12: acceptance completeness
  const p12 = [];
  if (!fatal.length) {
    for (const d of fs.existsSync(abs('work-packages')) ? fs.readdirSync(abs('work-packages')) : []) {
      if (!wpClaimsAccepted(git, null, d, root)) continue;
      const owner = gens.find((g) => g.workPackages.includes(d));
      if (!owner) { p12.push(`${d} records ACCEPTED but belongs to no generation`); continue; }
      if (owner.status === 'ACCEPTED') continue; // validated at its accepted commit (B06) and immutable since (B10)
      let raw = null;
      try { raw = fs.readFileSync(abs(`work-packages/${d}/work-package.json`), 'utf8'); } catch { /* reported below */ }
      const authority = CONTROLLED_AUTHORITIES.includes(owner.authorisation?.authority) ? owner.authorisation.authority : CONTROLLED_AUTHORITIES[0];
      const r = raw === null ? { ok: false, why: `work-packages/${d}/work-package.json is missing` } : wpAcceptance(raw, d, `work-packages/${d}/work-package.json`, authority);
      if (!r.ok) p12.push(`${r.why}: a work package that claims ACCEPTED anywhere in its records needs a well-formed controlled-authority acceptance in work-package.json`);
    }
  }
  add('B12', 'Every work package whose record claims ACCEPTED belongs to a registry generation and is a well-formed controlled-authority acceptance', p12, 'complete');

  // B13: promotion pending. Once the CANDIDATE's ACCEPTED record is merged on the mainline, the candidate is frozen
  // to that earliest merge and nothing but its promotion may follow.
  const p13 = [];
  let pendingAt = null;
  if (!fatal.length && mainline && active) {
    // The frozen CANDIDATE comes from the mainline merge, not from HEAD: adding, removing or editing work packages,
    // scope or authorisation on a later branch cannot move or lift the freeze.
    const nextGen = active.generation + 1;
    const frozen = acceptedMergeOf(git, nextGen, active.acceptedCommit, mainline);
    pendingAt = frozen?.commit || null;
    if (frozen) {
      if (!candidate || candidate.generation !== nextGen || !same(frozen.candidate, candidate)) p13.push(`generation ${nextGen} here differs from the CANDIDATE merged and accepted at ${pendingAt.slice(0, 7)} (it is frozen until promoted)`);
      if (git('merge-base', '--is-ancestor', pendingAt, 'HEAD').status === 0) {
        const d = git('diff', '--name-only', '--no-renames', '-z', pendingAt);
        const u = git('ls-files', '--others', '--exclude-standard', '-z');
        const after = [...new Set([...zlist(d.raw), ...zlist(u.raw)])];
        if (after.length) p13.push(`generation ${nextGen} was accepted and merged at ${pendingAt.slice(0, 7)}; the only permitted next change is promote --generation ${nextGen} --commit ${pendingAt} (changed since: ${after.join(', ')})`);
      }
    }
  }
  add('B13', 'A CANDIDATE whose ACCEPTED record is already merged on the mainline is frozen to its earliest accepted merge and must be promoted before any other change', p13,
    pendingAt ? `promotion pending at ${pendingAt.slice(0, 7)} (no other change)` : 'no promotion pending');

  const packageProblems = [];
  let authorisedSince = () => () => false;
  if (base) {
    // package.json/package-lock.json relative to the active accepted baseline.
    try {
      const cur = JSON.parse(fs.readFileSync(abs('package.json'), 'utf8'));
      const old = JSON.parse(git('show', `${base}:package.json`).raw);
      const { scripts: s1 = {}, ...r1 } = cur;
      const { scripts: s0 = {}, ...r0 } = old;
      const depsOk = inScope('package-lock.json');
      if (git('diff', '--quiet', base, '--', 'package-lock.json').status !== 0 && !depsOk) packageProblems.push('package-lock.json differs from the active accepted baseline and is not in the authorised scope');
      if (!same(r1, r0) && !depsOk) packageProblems.push('package.json fields other than scripts differ from the active accepted baseline (dependency change requires package-lock.json in the authorised scope)');
      if (!same(s1, s0) && !inScope('package.json')) packageProblems.push('package.json scripts differ from the active accepted baseline and package.json is not in the authorised scope');
      for (const [k, v] of Object.entries(s0)) if (s1[k] !== v) packageProblems.push(`accepted script ${k} changed or removed`);
    } catch (e) { packageProblems.push(`package.json: ${e.message}`); }
    // A path reported by an older verifier is authorised when it changed in accepted history after that verifier's
    // baseline (everything up to the active accepted commit was accepted), or is an in-scope change now.
    const cache = new Map();
    authorisedSince = (oldBase) => {
      if (!cache.has(oldBase)) {
        const d = git('diff', '--name-only', '--no-renames', '-z', oldBase, base);
        cache.set(oldBase, d.status === 0 ? new Set(zlist(d.raw)) : null);
      }
      const hist = cache.get(oldBase);
      const present = new Set(zlist(git('ls-tree', '-r', '--name-only', '-z', base).raw));
      return (f, { presence = false } = {}) => {
        if (!hist) return false;
        // A change since the active baseline: inside the CANDIDATE scope, or (no CANDIDATE) only the registry
        // promotion that B11 permits; and the pinned Generation 6 remediation that B11 admits.
        if (changedPaths.includes(f)) return !p11.length && ((candidate ? inScope(f) : f === REGISTRY_PATH) || g6RemediationAdmits(root, active, f));
        return hist.has(f) || (presence && present.has(f));
      };
    };
  } else packageProblems.push('no valid accepted baseline (see B01-B09)');

  return {
    results, ok: results.every((r) => r.pass), registry: reg, active: base ? accepted[accepted.length - 1] : null, candidate: fatal.length ? null : candidate,
    base, head, changedPaths, inScope, authorisedSince, packageProblems, policy: pol
  };
}

// ---- promotion ----------------------------------------------------------------------------------------
/**
 * Promotes CANDIDATE generation n to ACCEPTED at a mainline merge commit that already carries the PO/SA
 * ACCEPTED record. Everything written is recomputed from git; nothing is taken from the working tree.
 */
export function promote(root, generation, commit) {
  const git = makeGit(root);
  const pre = evaluate(root);
  const problems = [];
  const reg = pre.registry;
  if (!reg || pre.results.some((r) => ['B01', 'B02', 'B03', 'B04'].includes(r.id) && !r.pass)) return { ok: false, problems: ['registry invalid; run verify'] };
  const g = reg.generations.find((x) => x.generation === generation);
  if (!g || g.status !== 'CANDIDATE') return { ok: false, problems: [`generation ${generation} is not a CANDIDATE`] };
  const full = git('rev-parse', '--verify', '--quiet', `${commit}^{commit}`).out;
  if (!full) return { ok: false, problems: [`commit ${commit} not found`] };
  const mainline = git('rev-parse', '--verify', '--quiet', `${reg.policy.mainlineRef}^{commit}`).out;
  if (!mainline) problems.push(`${reg.policy.mainlineRef} not found`);
  else if (!git('rev-list', '--first-parent', mainline).out.split('\n').includes(full)) problems.push(`${full.slice(0, 7)} is not on the first-parent history of ${reg.policy.mainlineRef} (only a merged, PO/SA-authorised change can be promoted)`);
  if (git('rev-list', '--parents', '-n', '1', full).out.split(' ').length < 3) problems.push(`${full.slice(0, 7)} is not a merge commit`);
  const active = reg.generations.filter((x) => x.status === 'ACCEPTED').pop();
  const earliest = mainline && active ? acceptedMergeOf(git, generation, active.acceptedCommit, mainline) : null;
  if (active && generation !== active.generation + 1) problems.push(`only generation ${active.generation + 1} can be promoted next`);
  if (!earliest) problems.push(`no mainline merge after ${active?.acceptedCommit?.slice(0, 7)} carries generation ${generation} as CANDIDATE with an ACCEPTED work-package record`);
  else if (earliest.commit !== full) problems.push(`the CANDIDATE was first accepted and merged at ${earliest.commit.slice(0, 7)}; only that merge can be promoted`);
  const merged = git('show', `${full}:${REGISTRY_PATH}`);
  let mergedReg = null;
  try { mergedReg = JSON.parse(merged.raw); } catch { problems.push(`${full.slice(0, 7)} carries no readable registry`); }
  const mg = mergedReg?.generations?.find((x) => x.generation === generation);
  if (mergedReg && (!mg || mg.status !== 'CANDIDATE' || !same(mg, g))) problems.push(`generation ${generation} in the working registry differs from the CANDIDATE merged in ${full.slice(0, 7)}`);
  const authority = g.authorisation.authority;
  const evidence = [];
  const dates = [];
  for (const wp of g.workPackages) {
    const file = `work-packages/${wp}/work-package.json`;
    const r = acceptanceRecord(git, full, wp, file, authority);
    if (!r.ok) { problems.push(`${r.why}: promotion needs the PO/SA ACCEPTED record inside the merged commit`); continue; }
    dates.push(r.date);
    evidence.push({ path: file, blob: git('rev-parse', `${full}:${file}`).out });
  }
  if (problems.length) return { ok: false, problems };
  const fingerprints = {};
  for (const k of [...reg.policy.immutablePaths, ...reg.policy.governedPaths, ...g.protectedRecords].sort()) fingerprints[k] = git('rev-parse', '--verify', '--quiet', `${full}:${k.replace(/\/$/, '')}`).out || 'absent';
  Object.assign(g, {
    status: 'ACCEPTED', acceptedCommit: full, acceptedTree: git('rev-parse', `${full}^{tree}`).out,
    acceptance: { authority, date: dates.sort().pop(), evidence: evidence.sort((a, b) => a.path.localeCompare(b.path)) }, fingerprints
  });
  const text = `${JSON.stringify(reg, null, 2)}\n`;
  const post = evaluate(root, { registryText: text });
  const bad = post.results.filter((r) => !r.pass && r.id !== 'B11');
  if (bad.length) return { ok: false, problems: bad.map((r) => `${r.id}: ${r.details}`) };
  fs.writeFileSync(path.join(root, REGISTRY_PATH), text, 'utf8');
  return { ok: true, problems: [], generation: g };
}

// ---- CLI ----------------------------------------------------------------------------------------------
function main() {
  const root = process.cwd();
  const [cmd, ...rest] = process.argv.slice(2);
  const arg = (f) => { const i = rest.indexOf(f); return i >= 0 ? rest[i + 1] : undefined; };
  if (cmd === 'verify') {
    const r = evaluate(root);
    for (const x of r.results) console.log(`${x.pass ? 'PASS' : 'FAIL'} ${x.id} ${x.name}${x.details ? ` — ${x.details}` : ''}`);
    console.log(`\nPAEP baseline governance: ${r.ok ? 'PASS' : 'FAIL'} (${r.results.filter((x) => x.pass).length}/${r.results.length}); active ${r.active ? `G${r.active.generation} ${r.base}` : 'NONE'}; candidate ${r.candidate ? `G${r.candidate.generation} ${r.candidate.workPackages.join(', ')} (NOT ACCEPTED)` : 'none'}`);
    process.exit(r.ok ? 0 : 1);
  }
  if (cmd === 'status') {
    const r = evaluate(root);
    console.log(JSON.stringify({ result: r.ok ? 'PASS' : 'FAIL', active: r.active && { generation: r.active.generation, name: r.active.name, commit: r.active.acceptedCommit, tree: r.active.acceptedTree }, candidate: r.candidate && { generation: r.candidate.generation, workPackages: r.candidate.workPackages, status: r.candidate.status }, changedPaths: r.changedPaths.length }, null, 2));
    process.exit(r.ok ? 0 : 1);
  }
  if (cmd === 'promote') {
    const n = Number(arg('--generation'));
    const c = arg('--commit');
    if (!Number.isInteger(n) || !c) { console.error('usage: promote --generation <n> --commit <merge-sha>'); process.exit(2); }
    const r = promote(root, n, c);
    if (!r.ok) { console.error(`PROMOTION REFUSED:\n- ${r.problems.join('\n- ')}`); process.exit(1); }
    console.log(`generation ${n} promoted to ACCEPTED at ${r.generation.acceptedCommit} (${r.generation.acceptance.authority}, ${r.generation.acceptance.date}); commit the registry and re-run PAEP / gate`);
    process.exit(0);
  }
  console.error('usage: baseline-governance.mjs verify | status | promote --generation <n> --commit <sha>');
  process.exit(2);
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
