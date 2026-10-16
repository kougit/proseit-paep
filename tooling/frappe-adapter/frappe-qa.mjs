#!/usr/bin/env node
/**
 * IB4 Frappe adapter static gate (part of npm run qa:frappe): package and import rules, the public-API census, who may
 * import the adapter, no browser storage / cookie / bearer / console use, one place for each Frappe wire detail, the
 * versioned credential-free fixture set, a secret scan of the adapter, its fixtures and tests, the CSP connect-src
 * profile and the runtime-config example (ACCEPTANCE AC-IB4-03, -05, -06, -10, -11, -14, -18, -20).
 * Read-only.
 *   node tooling/frappe-adapter/frappe-qa.mjs [--root <dir>] [--json]
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const args = process.argv.slice(2);
const root = args.includes('--root') ? path.resolve(args[args.indexOf('--root') + 1]) : path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const SDK = 'packages/frappe-sdk/src';
const QA = 'tooling/frappe-adapter';
const FIXTURES = `${QA}/fixtures`;

/** Packages the adapter may import (architecture matrix row frappe-sdk: contracts and observability Yes, platform Optional). */
const SDK_IMPORTS = ['@proseit/paep-contracts', '@proseit/paep-observability', '@proseit/paep-platform'];
/** The adapter's approved public value exports (ADR-011 §2.2: the factory, the resource-map compiler, the freshness poller and the error guard). */
export const SDK_VALUES = ['createFrappeAdapter', 'compileResourceMap', 'createFreshnessPoller', 'isPaepError'];
/** Wire details that may appear in exactly one adapter file each (single point of control). */
const ONE_PLACE = [
  [/\/api\/resource\//, 'lib/resources.ts'],
  [/_server_messages|\bexc_type\b|['"]exception['"]|['"]exc['"]/, 'lib/errors.ts'],
  [/X-Frappe-CSRF-Token/, 'lib/session.ts'],
  [/\blocation\b/, 'lib/login-redirect.ts'],
  [/pmra\.api\.v1\.apply_transition/, 'lib/methods.ts'],
];
/** Wire details the adapter may never use: stock apply_workflow does not check the caller's version (ADR-011 §8, M1). */
const NOWHERE = [/apply_workflow/];
/** Fixture-set policy (D2). */
const FIXTURE_SET_VERSION = /^\d+\.\d+\.\d+$/;

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
const stripComments = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`\\])\/\/[^\n]*/g, '$1');
const importsOf = (s) => [...s.matchAll(/(?:^|\n)\s*(?:import|export)\s[^'"`;]*?from\s*['"]([^'"]+)['"]|(?:^|\n)\s*import\s*['"]([^'"]+)['"]|import\(\s*['"`]([^'"`]+)['"`]\s*\)/g)].map((m) => m[1] || m[2] || m[3]);

const checks = [];
const check = (id, name, findings, detail = '') => checks.push({ id, name, pass: findings.length === 0, detail: findings.length ? findings.slice(0, 12).join('; ') + (findings.length > 12 ? `; … ${findings.length - 12} more` : '') : detail });

const sdkFiles = walk(SDK);
const sdkTs = sdkFiles.filter((f) => f.endsWith('.ts'));

// F01 adapter imports (AC-IB4-11): only permitted packages through their entry points; relative imports stay inside.
{
  const f = [];
  if (!exists(`${SDK}/index.ts`)) f.push(`${SDK}/index.ts missing`);
  for (const file of sdkFiles) if (!file.endsWith('.ts')) f.push(`${file}: non-TypeScript file in the adapter source`);
  for (const file of sdkTs) {
    if (/\.(spec|test)\.ts$/.test(file)) f.push(`${file}: test file in the adapter source (tests live in ${QA}/)`);
    const s = stripComments(read(file));
    if (/\bimport\s*\(\s*(?!['"][^'"]+['"]\s*\))/.test(s)) f.push(`${file}: dynamic import() with a non-literal specifier`);
    for (const spec of importsOf(s)) {
      if (spec.startsWith('.')) {
        const target = path.posix.normalize(path.posix.join(path.posix.dirname(file), spec));
        if (!target.startsWith(`${SDK}/`)) f.push(`${file}: relative import leaves the package (${spec})`);
        continue;
      }
      if (!SDK_IMPORTS.includes(spec)) f.push(`${file}: ${spec} not permitted`);
    }
  }
  check('F01', 'The adapter imports only @proseit/paep-contracts, @proseit/paep-observability and @proseit/paep-platform through their entry points (no UI package, no framework, no third-party client); no test file in its source', f, `${sdkTs.length} adapter files`);
}

// F02 public-API census (AC-IB4-11): exactly the approved value exports; no export *, no declaration in the entry point.
{
  const f = [];
  const index = exists(`${SDK}/index.ts`) ? stripComments(read(`${SDK}/index.ts`)) : '';
  const values = [];
  for (const m of index.matchAll(/export\s+(type\s+)?\{([^}]*)\}\s*from\s*['"][^'"]+['"]/g)) {
    if (m[1]) continue;
    for (const part of m[2].split(',')) {
      const t = part.trim();
      if (t && !/^type\s/.test(t)) values.push(t.split(/\s+as\s+/).pop().trim());
    }
  }
  if (/export\s+\*/.test(index)) f.push('export * in the entry point');
  if (/export\s+(const|function|class|let|var|enum|interface|type\s+[A-Za-z0-9_$]+\s*=)\s*/.test(index)) f.push('declaration in the entry point');
  for (const s of SDK_VALUES) if (!values.includes(s)) f.push(`missing ${s}`);
  for (const s of values) if (!SDK_VALUES.includes(s)) f.push(`unapproved export ${s}`);
  if (new Set(values).size !== values.length) f.push('duplicate export');
  check('F02', `Public-API census: the adapter entry point exports exactly the ${SDK_VALUES.length} approved values`, f, `${values.length} value exports`);
}

// F03 who imports the adapter (AC-IB4-11, D7): only applications; no package and not the UI laboratory.
{
  const f = [];
  const importers = [...walk('packages'), ...walk('apps/ui-lab')].filter((x) => /\.(ts|mts|mjs|js)$/.test(x) && !x.startsWith('packages/frappe-sdk/') && !x.includes('/node_modules/'));
  for (const file of importers) {
    const s = stripComments(read(file));
    if (/@proseit\/frappe-sdk|packages\/frappe-sdk/.test(s)) f.push(`${file}: imports or names @proseit/frappe-sdk (only applications compose the adapter)`);
  }
  check('F03', 'Only applications compose @proseit/frappe-sdk: no PAEP package and not the UI laboratory imports it', f, `${importers.length} files scanned`);
}

// F04 browser credential and storage rules (D3, AC-IB4-02): no storage, cookie, cache or service-worker API; no bearer
// token; no console output.
{
  const f = [];
  const banned = [/\blocalStorage\b/, /\bsessionStorage\b/, /\bindexedDB\b/, /document\.cookie/, /\bcookieStore\b|\bCookieStore\b/, /Set-Cookie/i, /\bcaches\./, /serviceWorker/, /\bAuthorization\b/, /\bBearer\b/i, /\bconsole\./, /\bwindow\.open\s*\(/, /\beval\s*\(/, /new\s+Function\s*\(/];
  for (const file of sdkTs) {
    const s = stripComments(read(file));
    for (const re of banned) if (re.test(s)) f.push(`${file}: ${re.source}`);
  }
  check('F04', 'No browser storage, cookie, cache-storage or service-worker API, no Authorization / bearer header, no console output, no window.open or script evaluation in the adapter', f);
}

// F05 single point of control for each Frappe wire detail (AC-IB4-03, -06, -02).
{
  const f = [];
  for (const [re, home] of ONE_PLACE) {
    for (const file of sdkTs) {
      if (file === `${SDK}/${home}`) continue;
      if (re.test(stripComments(read(file)))) f.push(`${file}: ${re.source} outside ${home}`);
    }
  }
  for (const re of NOWHERE) for (const file of sdkTs) if (re.test(read(file))) f.push(`${file}: ${re.source} is not permitted in the adapter (no unchecked workflow write, no fallback)`);
  check('F05', 'Each Frappe wire detail lives in one adapter file: resource paths (resources.ts), server error fields (errors.ts), the CSRF header (session.ts), the login redirect (login-redirect.ts), the atomic transition method (methods.ts); stock apply_workflow nowhere', f);
}

// F06 versioned, credential-free fixture set (D2, AC-IB4-01, -18).
let fixtureFiles = [];
{
  const f = [];
  const manifestPath = `${FIXTURES}/manifest.json`;
  fixtureFiles = walk(FIXTURES).filter((x) => x !== manifestPath);
  if (!exists(manifestPath)) f.push(`${manifestPath} missing`);
  else {
    let m = null;
    try { m = JSON.parse(read(manifestPath)); } catch (e) { f.push(`manifest unreadable: ${e.message}`); }
    if (m) {
      if (!FIXTURE_SET_VERSION.test(m.fixtureSetVersion || '')) f.push('fixtureSetVersion missing or not x.y.z');
      if (m.provenance?.source !== 'synthetic') f.push('provenance.source is not "synthetic"');
      if (!m.provenance?.authoredBy || !m.provenance?.basis) f.push('provenance authoredBy / basis missing');
      if (m.compatibilityContract !== 'pmra-api-v1') f.push('compatibilityContract is not pmra-api-v1');
      if (!Array.isArray(m.profiles) || !m.profiles.length) f.push('no compatibility profile declared');
      const listed = new Map((m.files || []).map((x) => [`${FIXTURES}/${x.path}`, x.sha256]));
      for (const [file, want] of listed) {
        if (!exists(file)) { f.push(`listed fixture ${file} missing`); continue; }
        const got = crypto.createHash('sha256').update(fs.readFileSync(path.join(root, file))).digest('hex');
        if (got !== want) f.push(`fixture ${file} sha256 ${got.slice(0, 12)}… != manifest ${String(want).slice(0, 12)}…`);
        try { JSON.parse(read(file)); } catch { f.push(`fixture ${file} is not JSON`); }
      }
      for (const file of fixtureFiles) if (!listed.has(file)) f.push(`unlisted fixture ${file}`);
    }
  }
  check('F06', 'Fixture set: versioned manifest with synthetic provenance, the pmra-api-v1 compatibility profile, every fixture listed with its sha256, no unlisted file', f, `${fixtureFiles.length} fixtures`);
}

// F07 secret scan (AC-IB4-18): adapter source, fixtures and adapter tests carry no credential, cookie value or token.
{
  const f = [];
  const patterns = [
    /-----BEGIN [A-Z ]*PRIVATE KEY-----/, /\bAKIA[0-9A-Z]{16}\b/, /\bgh[pousr]_[A-Za-z0-9]{20,}\b/, /\bgithub_pat_[A-Za-z0-9_]{20,}\b/, /\bnpm_[A-Za-z0-9]{30,}\b/,
    /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\./, /\bBearer\s+[A-Za-z0-9._~+/-]{12,}/i, /\bsid=(?!synthetic)[A-Za-z0-9]{12,}/, /X-Frappe-CSRF-Token['"]?\s*[:=]\s*['"]?(?!synthetic)[A-Za-z0-9]{16,}/i,
    /\btoken\s+[a-f0-9]{15}:[a-f0-9]{15}\b/, /\b(api_key|api_secret|password|passwd)\s*['"]?\s*[:=]\s*['"][^'"\s]{6,}['"]/i, /\b[a-f0-9]{56}\b/,
  ];
  const files = [...sdkFiles, ...walk(QA).filter((x) => !x.endsWith('frappe-qa.mjs') && !x.endsWith('frappe-qa-negative.mjs'))];
  for (const file of files) {
    const s = read(file);
    for (const re of patterns) if (re.test(s)) f.push(`${file}: secret signature ${re.source.slice(0, 40)}`);
  }
  check('F07', 'Secret scan: no private key, cloud or registry token, JWT, bearer value, session cookie value, CSRF token, API key pair or password in the adapter, its fixtures or its tests', f, `${files.length} files scanned`);
}

// F08 deployment profile (AC-IB4-18, D3): CSP connect-src without wildcards; runtime-config example over HTTPS with no
// secret-named key.
{
  const f = [];
  for (const file of walk('apps/reference-app/deployment').filter((x) => x.endsWith('.json'))) {
    let doc = null;
    try { doc = JSON.parse(read(file)); } catch { f.push(`${file}: not JSON`); continue; }
    const sources = [];
    const visit = (o) => {
      if (Array.isArray(o)) o.forEach(visit);
      else if (o && typeof o === 'object') for (const [k, v] of Object.entries(o)) {
        if (k === 'connect-src') sources.push(...(Array.isArray(v) ? v : String(v).split(/\s+/)));
        else visit(v);
      } else if (typeof o === 'string') for (const m of o.matchAll(/connect-src\s+([^;"]*)/g)) sources.push(...m[1].split(/\s+/));
    };
    visit(doc);
    {
      for (const src of sources.map((x) => String(x).trim()).filter(Boolean)) {
        if (src === '*' || /\*/.test(src) || /^(https?|wss?):$/.test(src) || /^http:\/\/(?!localhost|127\.0\.0\.1)/.test(src)) f.push(`${file}: connect-src ${src} (wildcard, scheme-only or insecure source)`);
      }
    }
  }
  const cfgFile = 'apps/reference-app/public/config/runtime-config.json';
  if (exists(cfgFile)) {
    const cfg = JSON.parse(read(cfgFile));
    const visit = (o, at) => {
      if (o && typeof o === 'object') for (const [k, v] of Object.entries(o)) {
        if (/token|secret|password|passwd|cookie|csrf|credential|apikey|api_key|bearer/i.test(k)) f.push(`${cfgFile}: secret-named key ${at}${k}`);
        visit(v, `${at}${k}.`);
      } else if (typeof o === 'string' && /^http:\/\//.test(o) && !/^http:\/\/(localhost|127\.0\.0\.1)(:|\/|$)/.test(o)) f.push(`${cfgFile}: insecure endpoint ${at.slice(0, -1)} ${o}`);
    };
    visit(cfg, '');
    if (cfg.identity?.mode !== 'frappe-session') f.push(`${cfgFile}: identity.mode is not frappe-session`);
    if (cfg.backend?.compatibility?.apiContract !== 'pmra-api-v1') f.push(`${cfgFile}: backend.compatibility.apiContract is not pmra-api-v1`);
  } else f.push(`${cfgFile} missing`);
  check('F08', 'Deployment profile: CSP connect-src has no wildcard, scheme-only or insecure source; the runtime-config example uses HTTPS (loopback HTTP only), frappe-session identity, pmra-api-v1, and no secret-named key', f);
}

// F09 no new user-visible copy or interaction (D6, AC-IB4-20): the adapter carries no DOM access or markup, no shell message
// key and no styling (the reference app's route set stays fixed by E08).
{
  const f = [];
  for (const file of sdkTs) {
    const s = stripComments(read(file));
    // Markup is looked for inside each template literal (a type argument such as Map<string, …> between two literals is not markup).
    const templates = [...s.matchAll(/`(?:\\[\s\S]|[^`\\])*`/g)].map((m) => m[0]);
    if (/\bdocument\.|\bcreateElement\b|\binnerHTML\b|\btextContent\b|\binsertAdjacentHTML\b/.test(s) || templates.some((t) => /<\/?[a-z][a-z0-9-]*[\s>/]/i.test(t))) f.push(`${file}: DOM or markup in the adapter`);
    if (/'paep\.shell\./.test(s)) f.push(`${file}: shell message key in the adapter`);
    if (/@angular\//.test(s)) f.push(`${file}: Angular in the adapter`);
  }
  for (const file of walk(SDK).filter((x) => /\.(html|css|scss)$/.test(x))) f.push(`${file}: UI asset in the adapter`);
  check('F09', 'No user-visible surface in the adapter: no DOM access or markup, no styling, no shell message key, no Angular', f);
}

const failed = checks.filter((c) => !c.pass);
if (process.env.PAEP_EVIDENCE_DIR) fs.writeFileSync(path.join(process.env.PAEP_EVIDENCE_DIR, 'frappe-qa.json'), JSON.stringify({ ok: failed.length === 0, checks }, null, 2));
if (args.includes('--json')) console.log(JSON.stringify({ ok: failed.length === 0, checks }, null, 2));
else {
  for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'} ${c.id} ${c.name}${c.detail ? ` — ${c.detail}` : ''}`);
  console.log(`\nPAEP Frappe adapter static QA: ${failed.length ? 'FAIL' : 'PASS'} (${checks.length - failed.length}/${checks.length})`);
}
process.exit(failed.length ? 1 : 0);
