#!/usr/bin/env node
// PAEP IB1: same-build deployment-portability and fail-safe startup proof (PAEP v1.1 QAC-PORT-01, QAC-CFG-01; PAEP-IB-01 §9, §19).
//
// Builds apps/reference-app ONCE (production configuration) into a temporary directory, then serves that exact output with a
// different /config/runtime-config.json per scenario and loads it in headless Chromium:
//   - cloud-saas, private-cloud and on-premise configurations  -> the application starts with that profile;
//   - invalid, incompatible, missing, HTML (SPA fallback) and secret-bearing configurations -> the fail-safe state, Angular never starts.
// The build output is hashed before and after: every scenario runs against byte-identical files (no rebuild, no source fork).
//
//   node tooling/config-validation/portability-proof.mjs     (npm run qa:runtime-config:portability)
// Chromium: $CHROME_BIN, else a Playwright Chromium under /opt/pw-browsers, else google-chrome/chromium on PATH. Missing browser = FAIL.
import { spawn, spawnSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const work = fs.mkdtempSync(path.join(os.tmpdir(), 'paep-ib1-portability-'));
const outDir = path.join(work, 'dist');
const results = [];
let failed = 0;
const record = (id, name, pass, detail) => { results.push({ id, name, pass, detail }); if (!pass) failed += 1; console.log(`${pass ? 'PASS' : 'FAIL'} ${id} ${name} - ${detail}`); };

function findChrome() {
  const candidates = [process.env.CHROME_BIN];
  const pw = '/opt/pw-browsers';
  if (fs.existsSync(pw)) for (const d of fs.readdirSync(pw).filter((x) => /^chromium-\d+$/.test(x)).sort().reverse()) candidates.push(path.join(pw, d, 'chrome-linux', 'chrome'));
  for (const name of ['google-chrome', 'google-chrome-stable', 'chromium', 'chromium-browser']) {
    const r = spawnSync('bash', ['-c', `command -v ${name}`], { encoding: 'utf8' });
    if (r.status === 0) candidates.push(r.stdout.trim());
  }
  return candidates.find((c) => c && fs.existsSync(c));
}

function hashTree(dir) {
  const h = crypto.createHash('sha256');
  const walk = (d) => { for (const e of fs.readdirSync(d, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) { const p = path.join(d, e.name); if (e.isDirectory()) walk(p); else { h.update(path.relative(dir, p)); h.update(fs.readFileSync(p)); } } };
  walk(dir);
  return h.digest('hex');
}

const base = JSON.parse(fs.readFileSync(path.join(root, 'config/runtime-config.example.json'), 'utf8'));
const variant = (fn) => { const c = structuredClone(base); fn(c); return JSON.stringify(c, null, 2); };
const profileConfig = (profile, environment, extra = () => {}) => variant((c) => {
  c.deployment.profile = profile;
  c.deployment.environment = environment;
  c.backend.apiBaseUrl = `https://api.${profile}.example.test`;
  extra(c);
});

// [id, name, served response for /config/runtime-config.json, expected]
const scenarios = [
  ['S1', 'cloud-saas production configuration starts the application', { type: 'application/json', body: profileConfig('cloud-saas', 'production') }, { ready: 'cloud-saas' }],
  ['S2', 'private-cloud staging configuration starts the same build', { type: 'application/json', body: profileConfig('private-cloud', 'staging', (c) => { c.identity = { mode: 'oidc', issuer: 'https://login.customer.example.test', clientId: 'paep-reference', scopes: ['openid', 'profile'] }; }) }, { ready: 'private-cloud' }],
  ['S3', 'on-premise production configuration (no external telemetry or analytics) starts the same build', { type: 'application/json', body: profileConfig('on-premise', 'production', (c) => { c.telemetry = { enabled: false }; c.analytics = { enabled: false }; c.identity = { mode: 'sso-proxy' }; }) }, { ready: 'on-premise' }],
  ['F1', 'malformed JSON fails safe', { type: 'application/json', body: '{"schemaVersion": "1.0",' }, { failed: 'CFG_PARSE_SYNTAX' }],
  ['F2', 'unsupported future schema version fails safe', { type: 'application/json', body: variant((c) => { c.schemaVersion = '2.0'; }) }, { failed: 'CFG_VERSION_UNSUPPORTED' }],
  ['F3', 'incompatible PAEP range fails safe', { type: 'application/json', body: variant((c) => { c.backend.compatibility.minimumPaep = '9.0'; }) }, { failed: 'CFG_COMPAT_PAEP' }],
  ['F4', 'configuration for another product fails safe', { type: 'application/json', body: variant((c) => { c.product.id = 'other-product'; }) }, { failed: 'CFG_COMPAT_PRODUCT' }],
  ['F5', 'secret-bearing configuration fails safe', { type: 'application/json', body: variant((c) => { c.identity.clientSecret = 'x'.repeat(4); }) }, { failed: 'CFG_CONTENT_SECRET' }],
  ['F6', 'unsafe endpoint scheme fails safe', { type: 'application/json', body: variant((c) => { c.backend.apiBaseUrl = 'javascript' + ':alert(1)'; }) }, { failed: 'CFG_CONTENT_MARKUP' }],
  ['F7', 'missing configuration (404) fails safe; no localhost or default fallback', { status: 404, type: 'text/plain', body: 'not found' }, { failed: 'CFG_LOAD_STATUS' }],
  ['F8', 'SPA fallback HTML instead of JSON fails safe', { type: 'text/html', body: '<!doctype html><html></html>' }, { failed: 'CFG_LOAD_CONTENT_TYPE' }],
  ['F9', 'insecure http endpoint in production fails safe', { type: 'application/json', body: variant((c) => { c.deployment.environment = 'production'; c.backend.apiBaseUrl = 'http://localhost:8000'; }) }, { failed: 'CFG_URL_INSECURE' }]
];

function serve(dir, config) {
  const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.ico': 'image/x-icon', '.json': 'application/json' };
  const server = http.createServer((req, res) => {
    const url = new URL(req.url, 'http://127.0.0.1');
    if (url.pathname === '/config/runtime-config.json') {
      res.writeHead(config.status ?? 200, { 'content-type': config.type, 'cache-control': 'no-store' });
      res.end(config.body);
      return;
    }
    const file = path.join(dir, path.normalize(url.pathname === '/' ? '/index.html' : url.pathname));
    if (file.startsWith(dir) && fs.existsSync(file) && fs.statSync(file).isFile()) {
      res.writeHead(200, { 'content-type': types[path.extname(file)] ?? 'application/octet-stream' });
      res.end(fs.readFileSync(file));
    } else { res.writeHead(404); res.end(); }
  });
  return new Promise((resolve) => server.listen(0, '127.0.0.1', () => resolve(server)));
}

function dumpDom(chrome, url) {
  return new Promise((resolve) => {
    const profile = fs.mkdtempSync(path.join(work, 'chrome-'));
    const p = spawn(chrome, ['--headless=new', '--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage', '--no-first-run', `--user-data-dir=${profile}`,
      '--virtual-time-budget=8000', '--dump-dom', url], { stdio: ['ignore', 'pipe', 'pipe'] });
    let out = '';
    p.stdout.on('data', (d) => { out += d; });
    const timer = setTimeout(() => p.kill('SIGKILL'), 60000);
    p.on('close', () => { clearTimeout(timer); resolve(out); });
  });
}

async function main() {
  const chrome = findChrome();
  if (!chrome) { record('B0', 'headless Chromium available', false, 'no browser found (set CHROME_BIN)'); return; }
  record('B0', 'headless Chromium available', true, chrome);
  const build = spawnSync(process.execPath, [path.join(root, 'node_modules/@angular/cli/bin/ng.js'), 'build', 'reference-app', '--configuration', 'production', '--output-path', outDir],
    { cwd: root, encoding: 'utf8', env: { ...process.env, NG_CLI_ANALYTICS: 'false', NO_COLOR: '1' } });
  if (build.status !== 0) { record('B1', 'reference-app production build', false, `exit ${build.status}: ${(build.stdout + build.stderr).slice(-600)}`); return; }
  const browserDir = path.join(outDir, 'browser');
  const before = hashTree(browserDir);
  record('B1', 'reference-app production build (built once)', true, `sha256 of build output ${before}`);

  // The bundle must not embed deployment endpoints or profile literals: they come only from runtime configuration.
  const bundle = fs.readdirSync(browserDir).filter((f) => f.endsWith('.js')).map((f) => fs.readFileSync(path.join(browserDir, f), 'utf8')).join('\n');
  const embedded = ['api.example.test', 'realtime.example.test', 'telemetry.example.test', 'reports.example.test'].filter((s) => bundle.includes(s));
  record('B2', 'build output embeds no environment endpoint', embedded.length === 0, embedded.length ? `found ${embedded.join(', ')}` : 'none of the example endpoints appear in the bundle');

  for (const [id, name, config, expected] of scenarios) {
    const server = await serve(browserDir, config);
    const dom = await dumpDom(chrome, `http://127.0.0.1:${server.address().port}/`);
    server.close();
    const status = /data-paep-config="(ready|failed)"/.exec(dom)?.[1] ?? 'none';
    const profile = /data-paep-profile="([a-z-]+)"/.exec(dom)?.[1] ?? '';
    const rendered = /<app-root[^>]*>\s*<[a-z]/i.test(dom);
    if (expected.ready) {
      const ok = status === 'ready' && profile === expected.ready && rendered && !dom.includes('paep-config-failure');
      record(id, name, ok, `status=${status} profile=${profile || '-'} appRendered=${rendered}`);
    } else {
      const diag = /<code>(PAEP-(CFG_[A-Z_]+)-[0-9a-f]{8}|PAEP-(CFG_[A-Z_]+)-nodoc)<\/code>/.exec(dom);
      const code = diag ? (diag[2] ?? diag[3]) : '';
      const leaks = config.body && config.body.length > 12 && dom.includes(config.body.slice(0, 40));
      const ok = status === 'failed' && code === expected.failed && !rendered && !dom.includes('<app-root') && !leaks;
      record(id, name, ok, `status=${status} code=${code || '-'} appRendered=${rendered} appRootPresent=${dom.includes('<app-root')} contentEchoed=${Boolean(leaks)}`);
    }
  }
  const after = hashTree(browserDir);
  record('B3', 'every scenario ran against the identical build output', after === before, `sha256 before ${before.slice(0, 16)} after ${after.slice(0, 16)}`);
}

await main().catch((e) => record('X', 'harness', false, String(e?.stack ?? e)));
fs.rmSync(work, { recursive: true, force: true });
const summary = { result: failed === 0 ? 'PASS' : 'FAIL', total: results.length, failed, results };
if (process.env.PAEP_EVIDENCE_DIR) fs.writeFileSync(path.join(process.env.PAEP_EVIDENCE_DIR, 'portability-proof.json'), JSON.stringify(summary, null, 2) + '\n');
console.log(`\nPAEP IB1 same-build portability and fail-safe startup proof: ${summary.result} (${results.length - failed}/${results.length})`);
process.exit(failed === 0 && results.length === scenarios.length + 4 ? 0 : 1);
