#!/usr/bin/env node
/**
 * IB3 enterprise-shell static gate (npm run qa:enterprise): milestone scope, package and import rules, the public-API
 * census, the shell message catalogue, unsafe-HTML, storage, guard and route rules, the narrow CLAUDE.md amendment
 * the clean-room scan of enterprise and the reference app, and the retained approved HOF-IB3-001 handoff (ACCEPTANCE
 * AC-IB3-01, -02, -04, -11, -12, -15, -19, -22, -23).
 * Read-only.
 *   node tooling/enterprise-shell/enterprise-qa.mjs [--root <dir>] [--json]
 * The baseline is the active ACCEPTED generation of tooling/governance/baseline-registry.json.
 */
import { spawnSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { FORBIDDEN_TERMS } from '../design-system/design-system-qa.mjs';
import { covers } from '../governance/baseline-governance.mjs';

const args = process.argv.slice(2);
const root = args.includes('--root') ? path.resolve(args[args.indexOf('--root') + 1]) : path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const ENT = 'packages/enterprise/src';
const APP = 'apps/reference-app/src';

/** §12 / HOF-IB3-001 component map: the approved shell symbols of the one public entry point. */
export const SHELL_SYMBOLS = [
  'PaepShell', 'PaepShellTopbar', 'PaepShellNav', 'PaepShellNavSheet', 'PaepPageFrame', 'PaepCommandPalette', 'PaepNotificationPanel',
  'PaepContextSwitcher', 'PaepAccountMenu', 'PaepLockedState', 'PaepErrorBoundary', 'PaepNotFound', 'PaepStatusStrip', 'PaepShellPreferences',
  'PaepRouteFocus',
];
/** The provider function, the port tokens and the message defaults: the rest of the approved value exports. */
export const SUPPORT_VALUES = [
  'providePaepShell', 'PAEP_SHELL_DEFAULT_MESSAGES', 'PAEP_SHELL_LOCK_REASONS', 'PAEP_SHELL_ACCESS', 'PAEP_SHELL_COMMANDS', 'PAEP_SHELL_CONNECTIVITY',
  'PAEP_SHELL_CONTEXT', 'PAEP_SHELL_COUNTS', 'PAEP_SHELL_ERROR_REPORTER', 'PAEP_SHELL_HOOKS', 'PAEP_SHELL_LOCALE', 'PAEP_SHELL_NAVIGATION',
  'PAEP_SHELL_NOTIFICATIONS', 'PAEP_SHELL_RUNTIME_CONFIG', 'PAEP_SHELL_SESSION',
];
/** Packages the enterprise shell may depend on (HOF-IB3-001 package map; WORK_PACKAGE §5). */
const ENT_IMPORTS = ['@angular/core', '@angular/common', '@angular/router', '@proseit/paep-components', '@proseit/paep-foundation', '@proseit/paep-contracts', '@proseit/paep-i18n', '@proseit/paep-observability', '@proseit/paep-platform'];
const SPEC_IMPORTS = ['@angular/core/testing', 'vitest', 'vitest/browser'];
const APP_IMPORTS = ['@angular/core', '@angular/router', '@angular/platform-browser', '@proseit/paep-enterprise', '@proseit/paep-components', '@proseit/paep-foundation', '@proseit/paep-contracts', '@proseit/paep-platform'];
/** Packages the reference app may load only lazily, through a dynamic import() or a type-only import (IB4 D7, D9). */
const APP_LAZY_IMPORTS = ['@proseit/frappe-sdk'];
/** Reference-app routes (§15): workspace, the locked and error demonstrations, not found, and optional diagnostics. */
const APP_ROUTES = ['', 'workspace', 'locked/:reason', 'error-demo', 'diagnostics', '**'];
/** Paths IB3 may not change (§6, AC-IB3-22/23). */
const FROZEN = [/^packages\/(analytics|offline|frappe-sdk|contracts|domain-[^/]+)\//, /^config\/runtime-config\.schema\.json$/, /^package-lock\.json$/];
/**
 * Frozen paths a CANDIDATE may change, and only those its authorisedScope covers (IB4 D9): the adapter source and README
 * and the contracts source. Every other frozen path, and these outside the candidate scope, stay frozen.
 */
const ADMITTABLE = [/^packages\/frappe-sdk\/src\//, /^packages\/frappe-sdk\/README\.md$/, /^packages\/contracts\/src\//];
const CLAUDE_OLD = '- Do not implement analytics/reporting UI, offline queues, the enterprise shell, or domain kits.';
export const CLAUDE_NEW = '- Do not implement analytics/reporting UI, offline queues, or domain kits. Do not implement the enterprise shell, except under the PO/SA-authorised work package `IB3-ENTERPRISE-SHELL` (PO/SA authorisation 2026-10-06), within its `WORK_PACKAGE.md`, `ACCEPTANCE.md` and the Generation 5 `authorisedScope`; this exception grants no permission for any later milestone, for self-acceptance, or for baseline promotion.';
const FRAPPE_OLD = '- Do not implement Frappe/ERPNext integration in this work package.';
export const FRAPPE_NEW = '- Do not implement Frappe/ERPNext integration, except under the PO/SA-authorised work package `IB4-FRAPPE-ADAPTER` (PO/SA authorisation 2026-10-15), within its `WORK_PACKAGE.md`, `ACCEPTANCE.md` and the Generation 6 `authorisedScope`; this exception grants no permission for any later milestone, for self-acceptance, or for baseline promotion.';
/** The approved CLAUDE.md amendments, [baseline line, amended line], in the order they were authorised (IB3 §7, IB4 D1). */
const CLAUDE_AMENDMENTS = [[CLAUDE_OLD, CLAUDE_NEW], [FRAPPE_OLD, FRAPPE_NEW]];
/** 121 HOF-IB3-001 content keys plus the 2 the PO/SA added on 2026-10-07 (DDR-IB3-06, remediated to conformance). */
const MESSAGE_COUNT = 123;
const DDR06_KEYS = ['paep.shell.notifications.item.unread', 'paep.shell.account.button.named'];
/** The approved HOF-IB3-001 v1.0 handoff, retained verbatim (PO/SA approval 2026-10-06). */
const HOF_ROOT = 'evidence/design-handoff/HOF-IB3-001/handoff';
const HOF_MANIFEST_SHA256 = '645dd2e9bb4274c9b787bbbcc52cf53eb4f08dc21d733b5985aa3ab572f4fce5';
const HOF_FILE_COUNT = 577;
/** Drawing of the approved neutral placeholder mark (HOF-IB3-001 P-09, assets/placeholder-mark.svg), the reference-app favicon. */
const PLACEHOLDER_MARK = ['<rect width="32" height="32" rx="6" fill="#24364B"/>', '<path d="M9 22L16 9l7 13" fill="none" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>', '<path d="M12 18h8" stroke="#D4A62A" stroke-width="2.5" stroke-linecap="round"/>'];

const rel = (p) => path.relative(root, p).split(path.sep).join('/');
const read = (f) => fs.readFileSync(path.join(root, f), 'utf8');
const exists = (f) => fs.existsSync(path.join(root, f));
function walk(dir, out = []) {
  if (!fs.existsSync(path.join(root, dir))) return out;
  for (const e of fs.readdirSync(path.join(root, dir), { withFileTypes: true })) {
    const p = `${dir}/${e.name}`;
    if (e.isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}
const git = (...a) => spawnSync('git', a, { cwd: root, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
const isSpec = (f) => /\.spec\.ts$/.test(f) || f.includes('/lib/testing/');
const stripComments = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`])\/\/[^\n]*/g, '$1');
const importsOf = (s) => [...s.matchAll(/(?:^|\n)\s*(?:import|export)\s[^'"`;]*?from\s*['"]([^'"]+)['"]|(?:^|\n)\s*import\s*['"]([^'"]+)['"]|import\(\s*['"]([^'"]+)['"]\s*\)/g)].map((m) => m[1] || m[2] || m[3]);

/** Static imports and re-exports that bring in values (not `import type` / `export type`), including side-effect imports. */
const staticValueImportsOf = (s) => [...s.matchAll(/(?:^|\n)\s*(?:import|export)\s+(?!type\s)([^'"`;]*?)from\s*['"]([^'"]+)['"]|(?:^|\n)\s*import\s*['"]([^'"]+)['"]/g)]
  .filter((m) => m[3] || !/^\{\s*(?:type\s+[A-Za-z0-9_$]+(?:\s+as\s+[A-Za-z0-9_$]+)?\s*,?\s*)+\}\s*$/.test(m[1].trim()))
  .map((m) => m[2] || m[3]);

const checks = [];
const check = (id, name, findings, detail = '') => checks.push({ id, name, pass: findings.length === 0, detail: findings.length ? findings.slice(0, 12).join('; ') + (findings.length > 12 ? `; … ${findings.length - 12} more` : '') : detail });

const entFiles = walk(ENT).filter((f) => f.endsWith('.ts'));
const entTemplates = walk(ENT).filter((f) => /\.(ts|html|css)$/.test(f) && !isSpec(f));
const appFiles = walk(APP).filter((f) => /\.(ts|html)$/.test(f));

// E01 package and import rules (AC-IB3-01).
{
  const f = [];
  if (!exists(`${ENT}/index.ts`)) f.push('packages/enterprise/src/index.ts missing');
  const pkg = exists('packages/enterprise/package.json') ? JSON.parse(read('packages/enterprise/package.json')) : {};
  if (pkg.exports && typeof pkg.exports === 'object' && Object.keys(pkg.exports).some((k) => k !== '.')) f.push('secondary entry point in packages/enterprise/package.json');
  for (const file of entFiles) {
    for (const spec of importsOf(stripComments(read(file)))) {
      if (spec.startsWith('.')) {
        const target = path.posix.normalize(path.posix.join(path.posix.dirname(file), spec));
        if (!target.startsWith(`${ENT}/`)) f.push(`${file}: relative import leaves the package (${spec})`);
        continue;
      }
      const allowed = ENT_IMPORTS.includes(spec) || (isSpec(file) && SPEC_IMPORTS.includes(spec));
      if (!allowed) f.push(`${file}: ${spec}`);
    }
  }
  for (const file of appFiles.filter((x) => x.endsWith('.ts'))) {
    for (const spec of importsOf(stripComments(read(file)))) {
      if (spec.startsWith('.')) {
        const target = path.posix.normalize(path.posix.join(path.posix.dirname(file), spec));
        if (!target.startsWith(`${APP}/`)) f.push(`${file}: relative import leaves the app (${spec})`);
        continue;
      }
      if (APP_LAZY_IMPORTS.includes(spec)) continue;
      if (!APP_IMPORTS.includes(spec)) f.push(`${file}: ${spec}`);
    }
    const s = stripComments(read(file));
    for (const spec of staticValueImportsOf(s)) if (APP_LAZY_IMPORTS.includes(spec)) f.push(`${file}: ${spec} must be imported lazily (dynamic import() or import type only)`);
    if (/\bimport\s*\(\s*(?!['"][^'"]+['"]\s*\))/.test(s)) f.push(`${file}: dynamic import() with a non-literal specifier`);
  }
  check('E01', 'Enterprise imports only its permitted packages through their single public entry points (no store framework, no deep import); the reference app composes only permitted packages', f, `${entFiles.length} enterprise and ${appFiles.length} app files`);
}

// E02 public-API census (AC-IB3-04, §12).
{
  const f = [];
  const index = exists(`${ENT}/index.ts`) ? stripComments(read(`${ENT}/index.ts`)) : '';
  const values = [];
  for (const m of index.matchAll(/export\s+(type\s+)?\{([^}]*)\}\s*from\s*['"][^'"]+['"]/g)) {
    if (m[1]) continue;
    for (const part of m[2].split(',')) {
      const t = part.trim();
      if (!t) continue;
      if (/^type\s/.test(t)) continue;
      values.push(t.split(/\s+as\s+/).pop().trim());
    }
  }
  if (/export\s+\*/.test(index)) f.push('export * in the entry point');
  if (/export\s+(const|function|class|let|var|enum)\s/.test(index)) f.push('declaration in the entry point');
  const want = [...SHELL_SYMBOLS, ...SUPPORT_VALUES];
  for (const s of want) if (!values.includes(s)) f.push(`missing ${s}`);
  for (const s of values) if (!want.includes(s)) f.push(`unapproved export ${s}`);
  if (new Set(values).size !== values.length) f.push('duplicate export');
  check('E02', `Public-API census: the entry point exports exactly the ${SHELL_SYMBOLS.length} approved shell symbols and the ${SUPPORT_VALUES.length} provider, token and message values`, f, `${values.length} value exports`);
}

// E03 duplication rules (AC-IB3-04): selectors, own dialogs only on PaepModalBase, no popover.
{
  const f = [];
  for (const file of entTemplates.filter((x) => x.endsWith('.ts'))) {
    const s = stripComments(read(file));
    for (const m of s.matchAll(/selector:\s*'([^']+)'/g)) {
      if (!/^(paep-shell(-[a-z-]+)?|paep-page-frame|paep-command-palette|paep-notification-panel|paep-context-switcher|paep-account-menu|paep-locked-state|paep-error-boundary|paep-not-found|paep-status-strip|\[paepShell[A-Za-z]*\])$/.test(m[1])) f.push(`${file}: selector ${m[1]}`);
    }
    if (/<dialog\b/.test(s) && !/extends\s+PaepModalBase\b/.test(s)) f.push(`${file}: own <dialog> outside PaepModalBase`);
  }
  for (const file of entTemplates) {
    const s = read(file);
    if (/\bpopover\s*=|\.showPopover\(|\.togglePopover\(|\bpopovertarget\b/i.test(s)) f.push(`${file}: popover used directly (menus use the governed component base)`);
    if (/\banchor-name\b|\bposition-anchor\b/.test(s)) f.push(`${file}: private anchor positioning`);
  }
  check('E03', 'No generic primitive reimplemented in enterprise: shell selectors only, native dialogs only on PaepModalBase, no popover="manual" or private positioning', f);
}

// E04 shell message catalogue (content-keys.md, 121 keys, plus the 2 DDR-IB3-06 keys).
{
  const f = [];
  const file = `${ENT}/lib/messages/shell-messages.ts`;
  const s = exists(file) ? read(file) : '';
  const keys = [...s.matchAll(/^\s*'(paep\.[^']+)':\s*'/gm)].map((m) => m[1]);
  if (keys.length !== MESSAGE_COUNT) f.push(`${keys.length} keys (expected ${MESSAGE_COUNT})`);
  if (keys.some((k) => !/^paep\.shell\.[a-z0-9.]+$/i.test(k))) f.push('a key outside paep.shell.*');
  if (new Set(keys).size !== keys.length) f.push('duplicate key');
  for (const k of DDR06_KEYS) if (!keys.includes(k)) f.push(`DDR-IB3-06 key ${k} missing`);
  const known = new Set(keys);
  for (const src of entTemplates.filter((x) => x.endsWith('.ts') && x !== file)) {
    for (const m of stripComments(read(src)).matchAll(/'(paep\.shell\.[a-z0-9.]+)'/gi)) if (!known.has(m[1]) && !m[1].endsWith('.')) f.push(`${src}: unknown key ${m[1]}`);
  }
  check('E04', `Shell messages: exactly ${MESSAGE_COUNT} approved paep.shell.* keys (121 HOF + 2 DDR-IB3-06) with English defaults; every key the shell names exists`, f, `${keys.length} keys`);
}

// E05 security rules (AC-IB3-12): no unsafe HTML, script evaluation or open redirect primitives.
{
  const f = [];
  const unsafe = [/\[innerHTML\]/i, /\.innerHTML\s*=/, /\.outerHTML\s*=/, /insertAdjacentHTML/, /bypassSecurityTrust/, /\bDomSanitizer\b/, /\beval\s*\(/, /new\s+Function\s*\(/, /document\.write/, /window\.open\s*\(/, /location\.(href|assign|replace)\s*[=(]/];
  for (const file of [...entTemplates, ...appFiles]) {
    const s = stripComments(read(file));
    for (const re of unsafe) if (re.test(s)) f.push(`${file}: ${re.source}`);
  }
  check('E05', 'No unsafe HTML, script evaluation, window.open or location redirects in enterprise or the reference app', f);
}

// E06 no persistence (AC-IB3-23): preferences are session-only; no credentials in storage.
{
  const f = [];
  const store = [/\blocalStorage\b/, /\bsessionStorage\b/, /\bindexedDB\b/, /document\.cookie/, /\bcaches\./, /serviceWorker/];
  for (const file of [...entTemplates, ...appFiles]) {
    const s = stripComments(read(file));
    for (const re of store) if (re.test(s)) f.push(`${file}: ${re.source}`);
  }
  check('E06', 'No browser storage, cookies, cache storage or service worker in enterprise or the reference app (session-only preferences)', f);
}

// E07 backend authority (AC-IB3-11/15): no permission-granting guard exported or used.
{
  const f = [];
  for (const file of entTemplates.filter((x) => x.endsWith('.ts'))) {
    if (/\b(CanActivate|CanActivateChild|CanMatch|CanDeactivate|CanLoad)(Fn)?\b|\bcan(Activate|ActivateChild|Match|Load)\s*:/.test(stripComments(read(file)))) f.push(`${file}: route guard`);
  }
  for (const file of appFiles) if (/\bcan(Activate|ActivateChild|Match|Load)\s*:/.test(stripComments(read(file)))) f.push(`${file}: route guard`);
  check('E07', 'No permission-granting route guard in enterprise or the reference app (the server decides)', f);
}

// E08 reference-app routes (§15).
{
  const f = [];
  const file = `${APP}/app/app.routes.ts`;
  const s = exists(file) ? stripComments(read(file)) : '';
  const paths = [...s.matchAll(/path:\s*'([^']*)'/g)].map((m) => m[1]);
  if (!paths.length) f.push('no routes found');
  for (const p of paths) if (!APP_ROUTES.includes(p)) f.push(`unapproved route "${p}"`);
  for (const p of ['workspace', 'locked/:reason', 'error-demo', '**']) if (!paths.includes(p)) f.push(`missing route "${p}"`);
  for (const file2 of appFiles) if (/['"`]\/?(login|analytics[^'"`]*|offline-demo)['"`]/.test(read(file2))) f.push(`${file2}: excluded route named`);
  check('E08', 'Reference-app routes are exactly the approved set: workspace, locked and error demonstrations, not found (optional diagnostics); no /login, /analytics* or /offline-demo', f, paths.map((p) => `"${p}"`).join(', '));
}

// E09 milestone scope and dependencies against the accepted baseline (AC-IB3-22/23).
let base = null;
let candidateScope = [];
{
  const f = [];
  try {
    const reg = JSON.parse(read('tooling/governance/baseline-registry.json'));
    const active = [...reg.generations].reverse().find((g) => g.status === 'ACCEPTED');
    base = active?.acceptedCommit ?? null;
    // The one CANDIDATE that succeeds the active generation, with a well-formed scope; anything else admits nothing.
    const candidates = reg.generations.filter((g) => g.status === 'CANDIDATE');
    const c = candidates.length === 1 ? candidates[0] : null;
    if (c && active && c.predecessorGeneration === active.generation && Array.isArray(c.authorisedScope) && c.authorisedScope.every((e) => typeof e === 'string')) candidateScope = c.authorisedScope;
  } catch { /* reported below */ }
  const admitted = (p) => ADMITTABLE.some((re) => re.test(p)) && candidateScope.some((e) => covers(e, p));
  if (!base || git('cat-file', '-e', `${base}^{commit}`).status !== 0) f.push(`accepted baseline commit not available (${base})`);
  else {
    const changed = git('diff', '--name-only', '--no-renames', base, '--').stdout.split('\n').filter(Boolean);
    const untracked = git('ls-files', '--others', '--exclude-standard').stdout.split('\n').filter(Boolean);
    for (const p of [...changed, ...untracked]) if (FROZEN.some((re) => re.test(p)) && !admitted(p)) f.push(`changed: ${p}`);
    const was = JSON.parse(git('show', `${base}:package.json`).stdout || '{}');
    const now = JSON.parse(read('package.json'));
    for (const k of ['dependencies', 'devDependencies', 'optionalDependencies', 'peerDependencies', 'overrides', 'workspaces', 'engines', 'packageManager']) {
      if (JSON.stringify(was[k] ?? null) !== JSON.stringify(now[k] ?? null)) f.push(`package.json ${k} changed`);
    }
  }
  check('E09', 'Milestone scope: package-lock.json, dependencies, runtime-config schema, paep-contracts, analytics, offline, frappe-sdk and domain packages unchanged since the accepted baseline, except the frappe-sdk and contracts sources the CANDIDATE scope authorises', f, base ? `baseline ${base.slice(0, 12)}; ${candidateScope.length ? 'candidate scope admits frappe-sdk/contracts source in scope' : 'no candidate scope'}` : '');
}

// E10 narrow CLAUDE.md amendment (§7).
{
  const f = [];
  if (base && git('cat-file', '-e', `${base}^{commit}`).status === 0) {
    const was = git('show', `${base}:CLAUDE.md`).stdout.split('\n');
    const now = exists('CLAUDE.md') ? read('CLAUDE.md').split('\n') : [];
    // Baseline inspection decides each amendment's state: pending (the baseline still has its original line) or promoted
    // (the baseline already carries it). At most one amendment may be pending; CLAUDE.md must equal the baseline with the
    // pending one applied, or the baseline itself once every amendment is promoted.
    const pending = [];
    for (const [old, line] of CLAUDE_AMENDMENTS) {
      const i = was.indexOf(old);
      if (i >= 0 && !was.includes(line)) pending.push([i, line]);
      else if (i < 0 && !was.includes(line)) f.push('baseline CLAUDE.md lacks the amended line');
    }
    if (pending.length > 1) f.push(`baseline CLAUDE.md has ${pending.length} pending amendments (at most one may be pending)`);
    if (!f.length) {
      const expected = pending.length ? [...was.slice(0, pending[0][0]), pending[0][1], ...was.slice(pending[0][0] + 1)] : was;
      if (JSON.stringify(now) !== JSON.stringify(expected)) {
        const diff = now.findIndex((l, k) => l !== expected[k]);
        f.push(`CLAUDE.md differs from the baseline plus the one approved amendment (first difference at line ${diff < 0 ? Math.min(now.length, expected.length) + 1 : diff + 1})`);
      }
    }
  } else f.push('accepted baseline commit not available');
  check('E10', 'CLAUDE.md differs from the accepted baseline only by the one pending approved exception line (IB3-ENTERPRISE-SHELL, IB4-FRAPPE-ADAPTER), and equals it once that is promoted', f);
}

// E11 clean-room scan of enterprise and the reference app (AC-IB3-19), extending design-system S06.
{
  const f = [];
  const files = [...walk('packages/enterprise'), ...walk('apps/reference-app')].filter((x) => /\.(ts|css|html|json|svg|md)$/.test(x));
  for (const x of files) for (const re of FORBIDDEN_TERMS) if (re.test(read(x))) f.push(`${x}: forbidden term ${re}`);
  if (exists('apps/reference-app/public/favicon.ico')) f.push('apps/reference-app/public/favicon.ico (Angular logo) still present');
  const icon = exists('apps/reference-app/public/favicon.svg') ? read('apps/reference-app/public/favicon.svg') : '';
  if (!icon) f.push('apps/reference-app/public/favicon.svg missing');
  else {
    if (!PLACEHOLDER_MARK.every((d) => icon.includes(d))) f.push('favicon.svg is not the approved placeholder mark');
    if (/<metadata|c2pa|<script|<foreignObject|xlink:href|\bhref=/i.test(icon)) f.push('favicon.svg carries metadata, script or a reference');
  }
  if (exists(`${APP}/index.html`) && !/<link rel="icon" type="image\/svg\+xml" href="favicon\.svg">/.test(read(`${APP}/index.html`))) f.push(`${APP}/index.html does not link favicon.svg`);
  check('E11', 'Clean-room: no Ultima, PrimeNG, SAP Fiori/UI5, Angular Material/CDK or commercial-theme terms in enterprise or the reference app; the reference-app favicon is the approved placeholder mark', f, `${files.length} files scanned`);
}

// E12 retained approved handoff (AC-IB3-02, AC-IB3-19): exact manifest, every listed file intact, nothing unlisted.
{
  const f = [];
  let listed = [];
  const manifest = `${HOF_ROOT}/handoff.manifest.yaml`;
  if (!exists(manifest)) f.push(`${manifest} missing`);
  else {
    const bytes = fs.readFileSync(path.join(root, manifest));
    const sha = crypto.createHash('sha256').update(bytes).digest('hex');
    if (sha !== HOF_MANIFEST_SHA256) f.push(`manifest sha256 ${sha} != approved ${HOF_MANIFEST_SHA256}`);
    const t = bytes.toString('utf8');
    if (!/^status: APPROVED_FOR_IMPLEMENTATION$/m.test(t)) f.push('manifest status is not APPROVED_FOR_IMPLEMENTATION');
    const at = t.indexOf('\nfiles:\n');
    listed = at < 0 ? [] : [...t.slice(at).matchAll(/^- path: (\S+)\n\s+sha256: ([0-9a-f]{64})$/gm)].map((m) => [m[1], m[2]]);
    if (listed.length !== HOF_FILE_COUNT) f.push(`${listed.length} files listed, expected ${HOF_FILE_COUNT}`);
    for (const [file, want] of listed) {
      if (!exists(`${HOF_ROOT}/${file}`)) { f.push(`handoff file ${file} missing`); continue; }
      const got = crypto.createHash('sha256').update(fs.readFileSync(path.join(root, HOF_ROOT, file))).digest('hex');
      if (got !== want) f.push(`handoff file ${file} sha256 ${got.slice(0, 12)}… != manifest ${want.slice(0, 12)}…`);
    }
    const known = new Set([...listed.map(([x]) => `${HOF_ROOT}/${x}`), manifest]);
    for (const x of walk(HOF_ROOT)) if (!known.has(x)) f.push(`unlisted file ${x}`);
  }
  check('E12', 'The approved HOF-IB3-001 v1.0 handoff is retained verbatim: approved manifest hash and status, every listed file matches its sha256, no unlisted file', f, `manifest ${HOF_MANIFEST_SHA256.slice(0, 12)}…; ${listed.length}/${HOF_FILE_COUNT} files intact`);
}

const failed = checks.filter((c) => !c.pass);
if (args.includes('--json')) console.log(JSON.stringify({ ok: failed.length === 0, checks }, null, 2));
else {
  for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'} ${c.id} ${c.name}${c.detail ? ` — ${c.detail}` : ''}`);
  console.log(`\nPAEP enterprise-shell QA: ${failed.length ? 'FAIL' : 'PASS'} (${checks.length - failed.length}/${checks.length})`);
}
process.exit(failed.length ? 1 : 0);
