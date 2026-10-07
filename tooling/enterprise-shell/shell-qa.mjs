#!/usr/bin/env node
/**
 * IB3 enterprise-shell browser gate (npm run qa:shell), run against the production reference-app build
 * (dist/reference-app/browser) in an installed Chrome/Chromium (nothing is downloaded).
 *
 * Every shell state (workspace, locked, error, not found, command palette, navigation sheet, context dialog,
 * notification panel, account menu, language menu at 600 px and wider) at
 * 1440, 1024, 834, 640, 375, 320 and 320×256 CSS px, in LTR and RTL:
 *   H1 no page-wide horizontal scroll        H2 no console error (only the allowlisted one-line error report)
 *   H3 one h1 and one main landmark          H4 axe-core: zero WCAG 2.x A/AA violations (at 1440, 834, 640, 320)
 *   H5 no CSP or Trusted Types violation under the strict policy (C1)
 * and once per run:
 *   N1 the never-hidden set (navigation, product, search, notifications with count, account, page h1) is present and
 *      inside the viewport at 320 and 320×256, and the account menu reaches Sign out there; the current tenant
 *      context shows whole in the page-header context line and in the sheet header; the offline and unknown
 *      connectivity rows show first in the status strip (degraded is host-reported and has no reference-app source)
 *   T1 shell targets are at least 24 × 24 CSS px (WCAG 2.5.8) at 1440 and 320
 *   A1 label in name (WCAG 2.5.3): a control named by aria-label has a name containing its visible text
 *   K1 the skip link is the first Tab stop, is visible when focused, and moves focus to main
 *   K2 Ctrl+K opens the palette with focus in the combobox; Escape closes it and focus returns to its opener
 *   K3 the navigation sheet takes focus when opened and returns it to Open navigation on Escape (834)
 *   K4 a route change focuses the new page h1
 *   K5 no keyboard trap over the shell chrome (1440)
 *   F1 every focused chrome control shows a focus indicator of at least 2 px
 *   M1 under reduced motion the motion tokens are 0 ms and opening the sheet and the palette runs no animation
 *   R1 RTL mirroring: the persistent navigation sits at the inline start (right), the sheet attaches to the right
 *      edge, and the directional panel icon is mirrored
 *   L1 200 % text and 400 % zoom (320 px) keep the workspace free of horizontal scroll
 *   K6 menus (HOF-IB2-001 v1.2 §2.2): Enter on the account button opens on the first item, End reaches Sign out,
 *      Escape closes and returns focus to the button; the menu is inside the viewport with a 16 px margin (1440, 320)
 *   K7 the notification panel: Enter on the bell opens it with focus on its heading; it is at most 24 rem wide and
 *      16 px inside the viewport; Escape closes it and focus returns to the bell (1440, 320)
 *   C1 strict CSP (AC-IB3-12; PO/SA decision 2026-10-07): every page in this gate is served the way the deployment
 *      profile `apps/reference-app/deployment/csp-strict.json` requires (a fresh nonce per HTML response, put into the
 *      policy header and the page's ngCspNonce placeholders), so every state above runs under the enforced policy, and
 *      H5 reports any CSP or Trusted Types violation. C1 also checks: the built index.html has no inline handler, style
 *      attribute or javascript: URL, and every inline script and style carries the placeholder; the emitted header is
 *      the profile with a nonce of at least 16 random bytes that differs per response and matches the page; the policy
 *      (directive names case-insensitive, no repeated directive) lets scripts and styles come only from 'self' or the
 *      nonce in every directive that decides them (incl. the -elem and -attr overrides), has no wildcard, scheme-only
 *      source, 'strict-dynamic' or unsafe keyword anywhere, keeps object-src, base-uri, form-action and frame-ancestors
 *      closed, requires Trusted Types and allows only the `angular` policy (the AOT build needs no angular#bundler; never
 *      angular#unsafe-bypass or -jit); every Angular
 *      style element carries the response nonce and the component styles apply, also after following a navigation
 *      link to a lazily loaded route; and on a probe page an inline script
 *      without a nonce or with a wrong nonce, an inline style without a nonce, eval and an HTML string sink are blocked
 *      while a nonced script and style run.
 * and first, on the build itself:
 *   B1 initial bundle budget (AC-IB3-15, DDR-IB3-07 ACCEPTED 2026-10-07): the initial files (named by index.html
 *      and every script they import statically, followed recursively), raw
 *      bytes at most 525 000 and Brotli bytes (the CLI's estimated transfer size) at most 150 000, fail-closed on the
 *      exact byte counts, never rounded. 500 kB raw stays the engineering target and is reported, not enforced here
 *      (the Angular budget warns above it).
 *   node tooling/enterprise-shell/shell-qa.mjs [--capture <dir>] [--json <file>]
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import zlib from 'node:zlib';
import { AXE, axeViolations, launch } from '../design-system/browser-qa.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
export const DIST = path.join(ROOT, 'dist/reference-app/browser');
export const VIEWPORTS = [
  { name: '1440', width: 1440, height: 900 },
  { name: '1024', width: 1024, height: 768 },
  { name: '834', width: 834, height: 1112 },
  { name: '640', width: 640, height: 900 },
  { name: '375', width: 375, height: 812 },
  { name: '320', width: 320, height: 720 },
  { name: '320x256', width: 320, height: 256 },
];
const AXE_AT = new Set(['1440', '834', '640', '320']);
/** The one console line the default reporter writes (kind and reference only). */
const REPORT_LINE = /^PAEP error (render|route-load|version|unknown) \(ERR-[A-Z0-9]{12}\)$/;

/** The strict CSP deployment profile: the policy with `{nonce}` standing for the per-response nonce. */
export const CSP_PROFILE_FILE = path.join(ROOT, 'apps/reference-app/deployment/csp-strict.json');
export const cspProfile = () => JSON.parse(fs.readFileSync(CSP_PROFILE_FILE, 'utf8'));
export const cspHeader = (directives, nonce) => Object.entries(directives).map(([k, v]) => [k, ...v].join(' ').replaceAll('{nonce}', nonce)).join('; ');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.json': 'application/json', '.ico': 'image/x-icon', '.txt': 'text/plain' };
/** Inline probes added to the page for `?paep-csp-probe` (this harness only). The placeholder gets the response nonce. */
const PROBES = (ph) => `<script nonce="${ph}">window.__paepProbe={ok:true};try{eval('1');window.__paepProbe.eval='allowed'}catch(e){window.__paepProbe.eval=e.name}try{document.createElement('div').innerHTML='<b></b>';window.__paepProbe.html='allowed'}catch(e){window.__paepProbe.html=e.name}</script>`
  + `<script>window.__paepProbe.noNonce=true</script><script nonce="AAAAAAAAAAAAAAAAAAAAAA==">window.__paepProbe.wrongNonce=true</script>`
  + `<style>.paep-csp-probe-bare{inline-size:123px}</style><style nonce="${ph}">.paep-csp-probe-nonced{inline-size:77px}</style>`;
const freshNonce = () => crypto.randomBytes(16).toString('base64');

/**
 * Static server for the built app with SPA fallback, serving HTML the way the strict CSP profile requires: a fresh
 * nonce per HTML response in the policy header and in place of every placeholder. Resolves to { url, dir, close }.
 * The options seed the C1 negatives: `nonce` 'static' (one nonce for every response), 'mismatch' (the page gets a
 * different nonce than the header), 'unsubstituted' (placeholders left in the page); `policy(directives)` and
 * `html(text)` edit the served policy and page.
 */
export function serveStrict(dir = DIST, { nonce = 'fresh', policy = (d) => d, html = (t) => t } = {}) {
  if (!fs.existsSync(path.join(dir, 'index.html'))) throw new Error(`${dir}/index.html missing: run npm run build:reference-app first`);
  const profile = cspProfile();
  const fixed = freshNonce();
  const server = http.createServer((req, res) => {
    const url = new URL(req.url, 'http://x');
    let f = path.normalize(path.join(dir, decodeURIComponent(url.pathname)));
    if (!f.startsWith(dir) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) f = path.join(dir, 'index.html');
    const headers = { 'content-type': TYPES[path.extname(f)] || 'application/octet-stream', 'cache-control': 'no-store' };
    let body = fs.readFileSync(f);
    if (f === path.join(dir, 'index.html')) {
      const n = nonce === 'static' ? fixed : freshNonce();
      headers['content-security-policy'] = cspHeader(policy(structuredClone(profile.directives)), n);
      let text = html(body.toString('utf8'));
      if (url.searchParams.has('paep-csp-probe')) text = text.replace('</head>', `${PROBES(profile.noncePlaceholder)}</head>`);
      if (nonce !== 'unsubstituted') text = text.replaceAll(profile.noncePlaceholder, nonce === 'mismatch' ? freshNonce() : n);
      body = text;
    }
    res.writeHead(200, headers);
    res.end(body);
  });
  return new Promise((resolve) => server.listen(0, '127.0.0.1', () => resolve({ url: `http://127.0.0.1:${server.address().port}`, dir, close: () => new Promise((r) => server.close(r)) })));
}

const settle = (page, ms = 250) => page.waitForTimeout(ms);
const openPalette = async (page) => {
  await page.keyboard.press('Control+k');
  await page.waitForSelector('dialog.paep-palette[open]');
  await page.keyboard.type('sample');
  await settle(page, 700);
};
const openSheet = async (page) => {
  const toggle = page.locator('.paep-shell-topbar__nav-toggle');
  if (!(await toggle.count())) return false;
  await toggle.click();
  await page.waitForSelector('dialog.paep-shell-sheet[open]');
  await settle(page);
  return true;
};
const openContext = async (page) => {
  const b = page.locator('paep-shell-topbar .paep-context-switcher__button');
  if (!(await b.count()) || !(await b.isVisible())) return false;
  await b.click();
  await page.waitForSelector('paep-shell-topbar paep-context-switcher dialog[open]');
  await settle(page);
  return true;
};
const openNotifications = async (page) => {
  await page.locator('.paep-notification-panel__bell').click();
  await page.waitForSelector('.paep-notification-panel__popover:popover-open');
  await settle(page);
  return true;
};
const openAccount = async (page) => {
  await page.locator('.paep-account-menu__button').click();
  await page.waitForSelector('paep-account-menu [role="menu"]:popover-open');
  await settle(page);
  return true;
};
const openLanguage = async (page) => {
  const b = page.locator('.paep-shell-topbar__language');
  if (!(await b.count())) return false;
  await b.click();
  await page.waitForSelector('paep-shell-topbar [role="menu"][aria-label="Language"]:popover-open');
  await settle(page);
  return true;
};
export const STATES = [
  { id: 'workspace', path: '/workspace' },
  { id: 'locked', path: '/locked/edition' },
  { id: 'error', path: '/error-demo', report: true },
  { id: 'not-found', path: '/no-such-page' },
  { id: 'palette', path: '/workspace', act: openPalette },
  { id: 'sheet', path: '/workspace', act: openSheet },
  { id: 'context', path: '/workspace', act: openContext },
  { id: 'notifications', path: '/workspace', act: openNotifications },
  { id: 'account', path: '/workspace', act: openAccount },
  { id: 'language', path: '/workspace', act: openLanguage },
];

/** Opens a reference-app page, collecting console and page errors; waits for the page h1. */
export async function openApp(context, url, dir = 'ltr') {
  const page = await context.newPage();
  const errors = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.addInitScript(() => {
    window.__paepCspViolations = [];
    document.addEventListener('securitypolicyviolation', (e) => window.__paepCspViolations.push(`${e.effectiveDirective} blocked ${e.blockedURI || 'inline'}${e.sample ? ` (${e.sample.slice(0, 40)})` : ''}`));
  });
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForSelector('main h1', { timeout: 15000 });
  if (dir === 'rtl') await page.evaluate(() => { document.documentElement.setAttribute('dir', 'rtl'); document.documentElement.setAttribute('lang', 'ar'); });
  await settle(page);
  return { page, errors };
}

/** H1-H5 on an open page. `report` allows the default reporter's one console line. */
export async function auditState(page, errors, { axe = true, report = false } = {}) {
  const p = [];
  const layout = await page.evaluate(() => ({
    scroll: document.documentElement.scrollWidth,
    client: document.documentElement.clientWidth,
    h1: document.querySelectorAll('h1').length,
    main: document.querySelectorAll('main, [role="main"]').length,
  }));
  if (layout.scroll > layout.client + 1) p.push(`H1 horizontal scroll: scrollWidth ${layout.scroll} > ${layout.client}`);
  for (const e of errors) if (!(report && REPORT_LINE.test(e))) p.push(`H2 console: ${e.slice(0, 200)}`);
  if (layout.h1 !== 1) p.push(`H3 ${layout.h1} h1 elements`);
  if (layout.main !== 1) p.push(`H3 ${layout.main} main landmarks`);
  for (const v of await page.evaluate(() => window.__paepCspViolations ?? [])) p.push(`H5 CSP violation: ${v}`);
  if (axe) {
    // Loaded through the DevTools protocol: a script tag would be (correctly) blocked by the strict policy.
    if (!(await page.evaluate(() => 'axe' in window))) await page.evaluate(fs.readFileSync(AXE, 'utf8'));
    for (const v of await axeViolations(page)) p.push(`H4 axe ${v}`);
  }
  return p;
}

/** Directives that decide what script or style may run: only 'self', 'none' and the response nonce are allowed. */
const SCRIPT_STYLE = ['default-src', 'script-src', 'script-src-elem', 'script-src-attr', 'style-src', 'style-src-elem', 'style-src-attr', 'worker-src', 'child-src', 'frame-src'];
/** Other fetch directives: no wildcard, scheme-only source or unsafe keyword. */
const FETCH = ['connect-src', 'font-src', 'img-src', 'manifest-src', 'media-src', 'object-src', 'prefetch-src', 'fenced-frame-src'];
/**
 * C1 policy rules on one emitted header; returns { problems, nonce }. Directive names are case-insensitive and a
 * repeated directive is a problem (browsers enforce the first copy). Rules: every script- or style-deciding directive
 * (including the -elem and -attr overrides, workers and frames) holds only 'self', 'none' or the one response nonce
 * (-attr and default-src no nonce); no other fetch directive has a wildcard, a scheme-only source or an unsafe
 * keyword; 'strict-dynamic' and every unsafe keyword are absent everywhere; object-src 'none'; base-uri, form-action
 * and frame-ancestors are 'self' or 'none'; Trusted Types are required for scripts with only the `angular` policy.
 */
export function cspPolicyProblems(header) {
  const p = [];
  const d = new Map();
  for (const [k, ...v] of header.split(';').map((x) => x.trim().split(/\s+/)).filter((x) => x[0])) {
    const name = k.toLowerCase();
    if (d.has(name)) p.push(`C1 directive ${name} is repeated (the first copy is enforced)`);
    else d.set(name, v);
  }
  const nonces = [];
  for (const k of SCRIPT_STYLE) {
    const v = d.get(k);
    if (!v) continue;
    for (const t of v) {
      const m = /^'nonce-([^']*)'$/i.exec(t);
      if (m) { if (k === 'default-src' || k.endsWith('-attr') || !/^(script|style)-src/.test(k)) p.push(`C1 ${k} carries a nonce`); else nonces.push(m[1]); continue; }
      if (!["'self'", "'none'"].includes(t.toLowerCase())) p.push(`C1 ${k} allows ${t}`);
    }
  }
  for (const k of FETCH) for (const t of d.get(k) ?? []) if (/\*|^[a-z][a-z0-9+.-]*:$|^'unsafe-|^'strict-dynamic'$/i.test(t)) p.push(`C1 ${k} allows ${t}`);
  for (const k of ['default-src', 'script-src', 'style-src']) if (!d.get(k)) p.push(`C1 policy has no ${k}`);
  if (!["'self'", "'none'"].includes(d.get('default-src')?.join(' '))) p.push(`C1 default-src is ${d.get('default-src')?.join(' ')}`);
  if (d.get('object-src')?.join(' ') !== "'none'") p.push("C1 object-src is not 'none'");
  for (const k of ['base-uri', 'form-action', 'frame-ancestors']) if (!["'self'", "'none'"].includes(d.get(k)?.join(' '))) p.push(`C1 ${k} is not 'self' or 'none'`);
  if (d.get('require-trusted-types-for')?.join(' ') !== "'script'") p.push('C1 Trusted Types are not required for scripts');
  const tt = d.get('trusted-types') ?? [];
  if (!tt.length) p.push('C1 no trusted-types allowlist');
  for (const t of tt) if (t !== 'angular') p.push(`C1 trusted-types allows ${t}`);
  for (const [k, v] of d) { const bad = v.find((t) => /unsafe-|^'strict-dynamic'$/i.test(t)); if (bad) p.push(`C1 ${k} allows ${bad}`); }
  const nonce = d.get('script-src')?.map((t) => /^'nonce-([^']*)'$/i.exec(t)?.[1]).find(Boolean);
  const styleNonce = d.get('style-src')?.map((t) => /^'nonce-([^']*)'$/i.exec(t)?.[1]).find(Boolean);
  if (!nonce || styleNonce !== nonce || nonces.some((n) => n !== nonce)) p.push(`C1 script-src and style-src do not carry one nonce (${nonces.length} found)`);
  else if (!/^[A-Za-z0-9+/_-]+={0,2}$/.test(nonce) || Buffer.from(nonce, 'base64').length < 16) p.push(`C1 nonce "${nonce}" is not base64 of at least 16 bytes`);
  return { problems: [...new Set(p)], nonce };
}

/** C1 inventory of a built index.html: no inline handler, style attribute or javascript: URL; inline scripts and styles carry the placeholder. */
export function cspInventoryProblems(html, placeholder) {
  const p = [];
  for (const m of html.matchAll(/<([a-zA-Z][^\s>/]*)([^>]*)>/g)) {
    const [, tag, attrs] = m;
    const on = /\s(on[a-z]+)\s*=/i.exec(attrs);
    if (on) p.push(`C1 index.html <${tag}> has an inline ${on[1]} handler`);
    if (/\sstyle\s*=/i.test(attrs)) p.push(`C1 index.html <${tag}> has a style attribute`);
    if (/^(script|style)$/i.test(tag) && !attrs.includes(`nonce="${placeholder}"`)) p.push(`C1 index.html <${tag}> without the nonce placeholder`);
    const n = /\snonce\s*=\s*"([^"]*)"/i.exec(attrs);
    if (n && n[1] !== placeholder) p.push(`C1 index.html has a fixed nonce "${n[1]}"`);
  }
  if (/javascript:/i.test(html)) p.push('C1 index.html has a javascript: URL');
  if (/<app-root[^>]*\sngcspnonce="([^"]*)"/i.exec(html)?.[1] !== placeholder) p.push('C1 index.html root element has no ngCspNonce placeholder');
  return p;
}

/** C1: the strict CSP as served and as enforced (see the header). `server` is a serveStrict server. */
export async function cspProblems(context, server) {
  const profile = cspProfile();
  const p = cspInventoryProblems(fs.readFileSync(path.join(server.dir, 'index.html'), 'utf8'), profile.noncePlaceholder);
  const seen = [];
  for (let i = 0; i < 2; i++) {
    const r = await fetch(`${server.url}/workspace`);
    const header = r.headers.get('content-security-policy');
    const body = await r.text();
    if (!header) { p.push('C1 no Content-Security-Policy header on the HTML response'); continue; }
    const { problems, nonce } = cspPolicyProblems(header);
    p.push(...problems);
    if (header !== cspHeader(profile.directives, nonce)) p.push('C1 the emitted policy is not the deployment profile');
    if (!/no-store/.test(r.headers.get('cache-control') ?? '')) p.push('C1 index.html is cacheable');
    if (body.includes(profile.noncePlaceholder)) p.push('C1 the page still holds the nonce placeholder');
    const inPage = [...body.matchAll(/\s(?:nonce|ngcspnonce)="([^"]*)"/gi)].map((m) => m[1]);
    if (!inPage.length || inPage.some((x) => x !== nonce)) p.push('C1 the page nonce does not match the header nonce');
    seen.push(nonce);
  }
  if (seen.length === 2 && seen[0] === seen[1]) p.push('C1 the nonce is repeated across responses');

  const page = await context.newPage();
  try {
    await page.addInitScript(() => {
      window.__paepCspViolations = [];
      document.addEventListener('securitypolicyviolation', (e) => window.__paepCspViolations.push(`${e.effectiveDirective} blocked ${e.blockedURI || 'inline'}`));
    });
    await page.goto(`${server.url}/workspace`, { waitUntil: 'networkidle' });
    await page.waitForSelector('main h1', { timeout: 15000 }).catch(() => p.push('C1 the shell did not render under the policy'));
    const link = page.locator('paep-shell-nav a[href]:not([aria-current="page"])').filter({ visible: true }).first();
    const target = await link.getAttribute('href').catch(() => null);
    if (!target) p.push('C1 no navigation link to follow');
    else {
      await link.click();
      await page.waitForURL((u) => u.pathname === new URL(target, server.url).pathname, { timeout: 5000 }).catch(() => p.push(`C1 navigation to ${target} did not happen`));
      await settle(page, 600);
    }
    const r = await page.evaluate(() => {
      const nonce = document.querySelector('[ngcspnonce]')?.getAttribute('ngcspnonce') ?? '';
      const styles = [...document.querySelectorAll('style')];
      return {
        violations: window.__paepCspViolations,
        styles: styles.length,
        bare: styles.filter((s) => !nonce || s.nonce !== nonce).length,
        media: [...document.querySelectorAll('link[rel="stylesheet"]')].map((l) => l.media),
        componentCss: getComputedStyle(document.querySelector('.paep-shell-topbar__bar') ?? document.body).containerType,
        h1: document.querySelectorAll('main h1').length,
      };
    });
    for (const v of r.violations) p.push(`C1 violation during normal operation: ${v}`);
    if (r.styles < 2) p.push(`C1 only ${r.styles} style element(s): component styles were not inserted`);
    if (r.bare) p.push(`C1 ${r.bare} style element(s) without the response nonce`);
    if (!r.media.length || r.media.some((m) => m && m !== 'all')) p.push(`C1 global stylesheet not applied (media ${r.media.join(', ') || 'none'})`);
    if (r.componentCss !== 'inline-size') p.push('C1 component styles do not apply (topbar container type)');
    if (r.h1 !== 1) p.push('C1 navigation to another route did not render its page');

    await page.goto(`${server.url}/workspace?paep-csp-probe=1`, { waitUntil: 'networkidle' });
    const probe = await page.evaluate(() => {
      const size = (c) => { const e = document.createElement('div'); e.className = c; document.body.append(e); const w = e.getBoundingClientRect().width; e.remove(); return Math.round(w); };
      return { ...(window.__paepProbe ?? {}), bare: size('paep-csp-probe-bare'), nonced: size('paep-csp-probe-nonced') };
    });
    if (!probe.ok) p.push('C1 probe: a script with the response nonce did not run');
    if (probe.noNonce) p.push('C1 probe: an inline script without a nonce ran');
    if (probe.wrongNonce) p.push('C1 probe: an inline script with a wrong nonce ran');
    if (probe.eval !== 'EvalError') p.push(`C1 probe: eval is ${probe.eval ?? 'not tested'}`);
    if (probe.html !== 'TypeError') p.push(`C1 probe: an HTML string sink is ${probe.html ?? 'not tested'} (Trusted Types not enforced)`);
    if (probe.bare === 123) p.push('C1 probe: an inline style without a nonce applied');
    if (probe.nonced !== 77) p.push('C1 probe: a style with the response nonce did not apply');
  } finally {
    await page.close();
  }
  return [...new Set(p)];
}

/** N1: the never-hidden set is present, rendered and inside the viewport. */
export async function neverHiddenProblems(page) {
  return page.evaluate(() => {
    const p = [];
    const want = [
      ['navigation', '.paep-shell-topbar__nav-toggle'],
      ['product', '.paep-shell-topbar__product'],
      ['search', 'paep-shell-topbar button[aria-keyshortcuts]'],
      ['notifications', '.paep-notification-panel__bell'],
      ['account', '.paep-account-menu__button'],
      ['page h1', 'main h1'],
    ];
    const bell = document.querySelector('.paep-notification-panel__bell');
    if (bell && !/^Notifications, \S/.test(bell.getAttribute('aria-label') ?? '')) p.push(`N1 notifications without its count in the name ("${bell.getAttribute('aria-label')}")`);
    for (const [name, sel] of want) {
      const el = document.querySelector(sel);
      if (!el) { p.push(`N1 ${name} missing (${sel})`); continue; }
      const r = el.getBoundingClientRect();
      const s = getComputedStyle(el);
      if (r.width < 1 || r.height < 1 || s.visibility === 'hidden' || s.display === 'none') { p.push(`N1 ${name} not rendered`); continue; }
      if (r.left < -0.5 || r.right > innerWidth + 0.5) p.push(`N1 ${name} outside the viewport horizontally (${Math.round(r.left)}..${Math.round(r.right)} of ${innerWidth})`);
      if (name !== 'page h1' && (r.top < -0.5 || r.bottom > innerHeight + 0.5)) p.push(`N1 ${name} outside the viewport vertically`);
    }
    return p;
  });
}

/** N1 (sign-out): the account menu opens and reaches a visible Sign out item inside the viewport. */
export async function signOutReachableProblems(page) {
  const b = page.locator('.paep-account-menu__button');
  if (!(await b.count())) return ['N1 account missing'];
  await b.focus();
  await page.keyboard.press('Enter');
  await settle(page, 200);
  await page.keyboard.press('End');
  await settle(page, 100);
  return page.evaluate(() => {
    const e = document.activeElement;
    if (!e || !/^Sign out/.test((e.textContent ?? '').trim())) return [`N1 End in the account menu does not reach Sign out (${(e?.textContent ?? '').trim().slice(0, 30)})`];
    const r = e.getBoundingClientRect();
    return r.top < -0.5 || r.bottom > innerHeight + 0.5 || r.left < -0.5 || r.right > innerWidth + 0.5 ? ['N1 Sign out outside the viewport'] : [];
  });
}

/** English default text of a shell message key, read from the catalogue (no copy of the wording here). */
function shellMessage(key) {
  const src = fs.readFileSync('packages/enterprise/src/lib/messages/shell-messages.ts', 'utf8');
  const m = new RegExp(`'${key.replace(/\./g, '\\.')}':\\s*'([^']*)'`).exec(src);
  if (!m) throw new Error(`no shell message ${key}`);
  return m[1];
}

/** The reference app's current context (sample: the first context), as the page-header context line shows it. */
export const NARROW_CONTEXT = 'Sample Organisation A · Site 01';

/**
 * N1 (context, HOF responsive-rules: never hidden at 320): the current tenant context is shown in the page-header
 * context line, whole (it wraps, never truncates) and inside the viewport, and the navigation sheet header names it.
 */
export async function narrowContextProblems(page) {
  const p = await page.evaluate((want) => {
    const out = [];
    const line = document.querySelector('.paep-page-frame__tenant');
    if (!line) return ['N1 context line missing (.paep-page-frame__tenant)'];
    const r = line.getBoundingClientRect();
    const s = getComputedStyle(line);
    if (r.width < 1 || r.height < 1 || s.visibility === 'hidden' || s.display === 'none') return ['N1 context line not rendered'];
    if (!(line.textContent ?? '').replace(/\s+/g, ' ').includes(want)) out.push(`N1 context line does not show "${want}" ("${(line.textContent ?? '').trim().slice(0, 60)}")`);
    if (r.left < -0.5 || r.right > innerWidth + 0.5) out.push('N1 context line outside the viewport horizontally');
    for (const e of [line, ...line.querySelectorAll('*')]) {
      if (e.closest('.paep-visually-hidden') || e.closest('svg')) continue;
      const c = getComputedStyle(e);
      if (e.scrollWidth > e.clientWidth + 1 && (c.overflowX !== 'visible' || c.textOverflow === 'ellipsis')) { out.push('N1 context line truncated'); break; }
    }
    return out;
  }, NARROW_CONTEXT);
  const toggle = page.locator('.paep-shell-topbar__nav-toggle');
  if (!(await toggle.count())) return [...p, 'N1 navigation toggle missing (sheet context not checked)'];
  await toggle.click();
  await settle(page, 300);
  const sheet = await page.evaluate((want) => {
    const c = document.querySelector('.paep-shell__sheet-context');
    if (!c || !c.getClientRects().length) return ['N1 navigation sheet has no context header'];
    return (c.textContent ?? '').replace(/\s+/g, ' ').includes(want.split(' · ')[0]) ? [] : [`N1 navigation sheet context does not name "${want.split(' · ')[0]}"`];
  }, NARROW_CONTEXT);
  await page.keyboard.press('Escape');
  await settle(page, 200);
  return [...p, ...sheet];
}

/**
 * N1 (connectivity, HOF responsive-rules: never hidden at 320): a non-online state shows its status row, with its
 * catalogued title, first in the status strip and inside the viewport. `offline` is driven here (the browser goes
 * offline); `unknown` needs the page opened with `navigator.onLine` unavailable (see `UNKNOWN_CONNECTIVITY`).
 */
export async function narrowConnectivityProblems(page, state) {
  if (state === 'offline') {
    await page.context().setOffline(true);
    await settle(page, 300);
  }
  const want = shellMessage(`paep.shell.connectivity.${state}`);
  const p = await page.evaluate((title) => {
    const row = document.querySelector('.paep-shell-status__row[data-status="connectivity"]');
    if (!row) return ['row missing'];
    const r = row.getBoundingClientRect();
    const s = getComputedStyle(row);
    if (r.width < 1 || r.height < 1 || s.visibility === 'hidden' || s.display === 'none') return ['row not rendered'];
    const out = [];
    if (!(row.textContent ?? '').includes(title)) out.push(`row does not say "${title}"`);
    if (r.left < -0.5 || r.right > innerWidth + 0.5 || r.top < -0.5 || r.bottom > innerHeight + 0.5) out.push('row outside the viewport');
    return out;
  }, want);
  if (state === 'offline') await page.context().setOffline(false);
  return p.map((x) => `N1 ${state} connectivity ${x}`);
}

/** Init script: `navigator.onLine` unavailable, so the browser connectivity source starts as `unknown`. */
export const UNKNOWN_CONNECTIVITY = () => Object.defineProperty(Navigator.prototype, 'onLine', { get: () => undefined, configurable: true });

/** K6: the account menu follows the menu key map and stays 16 px inside the viewport. */
export async function menuKeyboardProblems(page) {
  const p = [];
  const button = '.paep-account-menu__button';
  if (!(await page.$(button))) return ['K6 no account menu button'];
  await page.focus(button);
  await page.keyboard.press('Enter');
  await settle(page, 200);
  const first = await active(page);
  if (first?.role !== 'menuitem' || !/Display preferences/.test(first.text)) p.push(`K6 Enter did not open the menu on its first item (${first?.role} ${first?.text})`);
  const box = await page.evaluate(() => {
    const m = document.querySelector('paep-account-menu [role="menu"]');
    const r = m?.getBoundingClientRect();
    return r ? { l: r.left, r: r.right, w: innerWidth, open: m.matches(':popover-open') } : null;
  });
  if (!box?.open) p.push('K6 the account menu is not open');
  else if (box.l < 15.5 || box.r > box.w - 15.5) p.push(`K6 menu not 16 px inside the viewport (${Math.round(box.l)}..${Math.round(box.r)} of ${box.w})`);
  await page.keyboard.press('End');
  if (!/^Sign out/.test((await active(page))?.text ?? '')) p.push('K6 End did not reach Sign out');
  await page.keyboard.press('Escape');
  await settle(page, 150);
  if (await page.$('paep-account-menu [role="menu"]:popover-open')) p.push('K6 Escape did not close the menu');
  if (!String((await active(page))?.cls).includes('paep-account-menu__button')) p.push('K6 focus did not return to the account button');
  return p;
}

/** K7: the notification panel opens on its heading, is an inset panel and returns focus to the bell. */
export async function notificationPanelProblems(page) {
  const p = [];
  const bell = '.paep-notification-panel__bell';
  if (!(await page.$(bell))) return ['K7 no notification bell'];
  await page.focus(bell);
  await page.keyboard.press('Enter');
  await settle(page, 200);
  const a = await active(page);
  if (a?.tag !== 'h2' || !/Notifications/.test(a.text)) p.push(`K7 focus is not on the panel heading (${a?.tag} ${a?.text})`);
  const box = await page.evaluate(() => {
    const el = document.querySelector('.paep-notification-panel__popover');
    const r = el?.getBoundingClientRect();
    const rem = parseFloat(getComputedStyle(document.documentElement).fontSize);
    return r ? { l: r.left, r: r.right, wd: r.width, w: innerWidth, max: 24 * rem, open: el.matches(':popover-open') } : null;
  });
  if (!box?.open) p.push('K7 the panel is not open');
  else {
    if (box.wd > box.max + 0.5) p.push(`K7 panel wider than 24 rem (${Math.round(box.wd)})`);
    if (box.l < 15.5 || box.r > box.w - 15.5) p.push(`K7 panel not 16 px inside the viewport (${Math.round(box.l)}..${Math.round(box.r)} of ${box.w})`);
  }
  await page.keyboard.press('Escape');
  await settle(page, 150);
  if (await page.$('.paep-notification-panel__popover:popover-open')) p.push('K7 Escape did not close the panel');
  if (!String((await active(page))?.cls).includes('paep-notification-panel__bell')) p.push('K7 focus did not return to the bell');
  return p;
}

/** T1: every visible shell target (topbar, navigation, status strip, open overlays) is at least 24 × 24 CSS px. */
export async function targetSizeProblems(page) {
  return page.evaluate(() => {
    const p = [];
    const scope = 'paep-shell-topbar, paep-shell-nav, paep-shell-status-strip, dialog[open], :popover-open';
    for (const host of document.querySelectorAll(scope)) {
      for (const el of host.querySelectorAll('a[href], button, input, [role="option"], [tabindex="0"]')) {
        const r = el.getBoundingClientRect();
        if (r.width === 0 && r.height === 0) continue;
        if (getComputedStyle(el).visibility === 'hidden') continue;
        if (r.width < 23.5 || r.height < 23.5) p.push(`T1 ${el.tagName.toLowerCase()} "${(el.getAttribute('aria-label') || el.textContent || '').trim().slice(0, 30)}" ${Math.round(r.width)}×${Math.round(r.height)}`);
      }
    }
    return p;
  });
}

/**
 * A1 (WCAG 2.5.3 label in name): a shell control named by aria-label has a name that contains its visible text
 * (text nodes that render, outside visually hidden text), compared case-insensitively with punctuation ignored (the
 * visible words must appear whole and in order; WCAG 2.5.3 Understanding: punctuation and symbols in a label are not spoken).
 */
export async function labelInNameProblems(page) {
  return page.evaluate(() => {
    const p = [];
    const norm = (t) => t.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
    const scope = 'paep-shell-topbar, paep-shell-nav, paep-shell-status-strip, dialog[open], :popover-open';
    for (const host of document.querySelectorAll(scope)) {
      for (const el of host.querySelectorAll('a[href][aria-label], button[aria-label], [role^="menuitem"][aria-label]')) {
        const r = el.getBoundingClientRect();
        if (r.width === 0 && r.height === 0) continue;
        const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
        let visible = '';
        for (let n = walker.nextNode(); n; n = walker.nextNode()) {
          const parent = n.parentElement;
          if (!parent || parent.closest('.paep-visually-hidden')) continue;
          const pr = parent.getBoundingClientRect();
          if (pr.width < 2 || pr.height < 2 || getComputedStyle(parent).visibility === 'hidden') continue;
          visible += ` ${n.textContent}`;
        }
        const v = norm(visible);
        if (v && !` ${norm(el.getAttribute('aria-label'))} `.includes(` ${v} `)) p.push(`A1 ${el.tagName.toLowerCase()} shows "${v}" but is named "${el.getAttribute('aria-label')}"`);
      }
    }
    return p;
  });
}

const active = (page) => page.evaluate(() => {
  const e = document.activeElement;
  return e ? { tag: e.tagName.toLowerCase(), cls: e.className?.baseVal ?? e.className ?? '', label: e.getAttribute('aria-label') || '', text: (e.textContent || '').trim().slice(0, 40), role: e.getAttribute('role') || '' } : null;
});

/** K1: skip link first, visible on focus, moves focus to main. */
export async function skipLinkProblems(page) {
  const p = [];
  await page.evaluate(() => { document.activeElement?.blur?.(); window.scrollTo(0, 0); });
  await page.keyboard.press('Tab');
  const a = await active(page);
  if (!a || !String(a.cls).includes('paep-skip-link')) return [`K1 first Tab stop is not the skip link (${a?.tag}.${a?.cls})`];
  const box = await page.evaluate(() => { const r = document.activeElement.getBoundingClientRect(); return { l: r.left, r: r.right, t: r.top, b: r.bottom, w: r.width, h: r.height }; });
  if (box.w < 1 || box.h < 1 || box.t < 0 || box.l < 0 || box.r > (await page.evaluate(() => innerWidth))) p.push('K1 skip link not visible when focused');
  await page.keyboard.press('Enter');
  await settle(page, 100);
  if ((await active(page))?.tag !== 'main') p.push('K1 skip link does not move focus to main');
  return p;
}

/** K2: Ctrl+K opens the palette from its trigger; Escape closes it and returns focus to the trigger. */
export async function paletteKeyboardProblems(page) {
  const p = [];
  await page.focus('paep-shell-topbar button[aria-keyshortcuts]');
  await page.keyboard.press('Control+k');
  await page.waitForSelector('dialog.paep-palette[open]', { timeout: 5000 }).catch(() => p.push('K2 Ctrl+K did not open the palette'));
  if (p.length) return p;
  await settle(page, 150);
  if ((await active(page))?.role !== 'combobox') p.push('K2 focus is not in the palette combobox');
  await page.keyboard.press('Escape');
  await settle(page, 150);
  if (await page.$('dialog.paep-palette[open]')) p.push('K2 Escape did not close the palette');
  const a = await active(page);
  if (!(a?.tag === 'button' && /Search or go to/.test(a.label + a.text))) p.push(`K2 focus did not return to the search trigger (${a?.tag} ${a?.label || a?.text})`);
  return p;
}

/** K3: the sheet takes focus and returns it to Open navigation on Escape. */
export async function sheetKeyboardProblems(page) {
  const p = [];
  if (!(await page.$('.paep-shell-topbar__nav-toggle'))) return ['K3 no Open navigation button'];
  await page.focus('.paep-shell-topbar__nav-toggle');
  await page.keyboard.press('Enter');
  await page.waitForSelector('dialog.paep-shell-sheet[open]', { timeout: 5000 }).catch(() => p.push('K3 Enter did not open the sheet'));
  if (p.length) return p;
  await settle(page, 150);
  if (!(await page.evaluate(() => document.querySelector('dialog.paep-shell-sheet')?.contains(document.activeElement)))) p.push('K3 focus is not inside the sheet');
  await page.keyboard.press('Escape');
  await settle(page, 200);
  if (await page.$('dialog.paep-shell-sheet[open]')) p.push('K3 Escape did not close the sheet');
  if (!String((await active(page))?.cls).includes('paep-shell-topbar__nav-toggle')) p.push('K3 focus did not return to Open navigation');
  return p;
}

/** K4: following a navigation link focuses the new page h1. */
export async function routeFocusProblems(page) {
  const link = page.locator('paep-shell-nav a', { hasText: 'Edition example' }).first();
  if (!(await link.count())) return ['K4 navigation link not found'];
  await link.focus();
  await page.keyboard.press('Enter');
  await page.waitForURL(/\/locked\/edition$/);
  await settle(page, 300);
  const a = await active(page);
  return a?.tag === 'h1' ? [] : [`K4 route change left focus on ${a?.tag} ${a?.text}`];
}

/** K5: Tab keeps moving focus through the chrome and the page. */
export async function trapProblems(page, presses = 40) {
  await page.evaluate(() => { document.activeElement?.blur?.(); window.scrollTo(0, 0); });
  let previous = null;
  for (let i = 0; i < presses; i++) {
    await page.keyboard.press('Tab');
    const now = await page.evaluate(() => {
      const e = document.activeElement;
      if (!e || e === document.body) return null;
      e.dataset.k5 ??= String(Math.random());
      return `${e.tagName.toLowerCase()} ${e.getAttribute('aria-label') || e.textContent?.trim().slice(0, 30) || ''}|${e.dataset.k5}`;
    });
    if (now && now === previous) return [`K5 keyboard trap at ${now.split('|')[0]}`];
    previous = now;
  }
  return [];
}

/** F1: the first `stops` Tab stops in the chrome show a focus indicator of at least 2 px. */
export async function focusVisibleProblems(page, stops = 12) {
  const p = [];
  await page.evaluate(() => { document.activeElement?.blur?.(); window.scrollTo(0, 0); });
  for (let i = 0; i < stops; i++) {
    await page.keyboard.press('Tab');
    const f = await page.evaluate(() => {
      const e = document.activeElement;
      if (!e || e === document.body || e.closest('main')) return null;
      const s = getComputedStyle(e);
      const outline = s.outlineStyle !== 'none' && parseFloat(s.outlineWidth) >= 2;
      const ring = s.boxShadow && s.boxShadow !== 'none' && /(\d+(\.\d+)?)px/.test(s.boxShadow);
      return { ok: outline || ring, what: `${e.tagName.toLowerCase()} ${e.getAttribute('aria-label') || e.textContent?.trim().slice(0, 30) || ''}` };
    });
    if (f && !f.ok) p.push(`F1 no visible focus indicator on ${f.what}`);
  }
  return p;
}

/** M1 under reduced motion: motion tokens 0 ms; opening the sheet and the palette runs no animation or transition. */
export async function reducedMotionProblems(page) {
  const p = [];
  const tokens = await page.evaluate(() => {
    const out = [];
    for (const s of document.styleSheets) {
      let rules;
      try { rules = s.cssRules; } catch { continue; }
      const scan = (list) => { for (const r of list) { if (r.style) for (const n of r.style) if (n.startsWith('--paep-motion-duration-')) out.push(n); if (r.cssRules) scan(r.cssRules); } };
      scan(rules);
    }
    return [...new Set(out)].map((n) => [n, getComputedStyle(document.documentElement).getPropertyValue(n).trim()]);
  });
  if (!tokens.length) p.push('M1 no motion tokens found');
  for (const [n, v] of tokens) if (!/^(0|0s|0ms|\.?0+m?s)$/.test(v)) p.push(`M1 ${n} = ${v}`);
  const running = () => page.evaluate(() => document.getAnimations().filter((a) => a.playState === 'running' && Number(a.effect?.getComputedTiming().duration) > 0 && !a.effect?.target?.closest?.('.paep-palette__spinner, .paep-icon--spin')).map((a) => `${a.effect?.target?.tagName?.toLowerCase()}.${String(a.effect?.target?.className?.baseVal ?? a.effect?.target?.className ?? '').split(' ')[0]} ${a.animationName || a.transitionProperty || ''}`));
  if (await openSheet(page)) {
    for (const a of await running()) p.push(`M1 sheet animates: ${a}`);
    await page.keyboard.press('Escape');
    await settle(page);
  }
  await page.keyboard.press('Control+k');
  await page.waitForSelector('dialog.paep-palette[open]');
  for (const a of await running()) p.push(`M1 palette animates: ${a}`);
  await page.keyboard.press('Escape');
  return p;
}

/** R1 in RTL: navigation at the inline start (right), sheet on the right edge, directional icon mirrored. */
export async function rtlProblems(wide, medium) {
  const p = [];
  const w = await wide.evaluate(() => {
    const nav = document.querySelector('paep-shell-nav')?.getBoundingClientRect();
    const main = document.querySelector('main')?.getBoundingClientRect();
    const icon = document.querySelector('.paep-shell-nav__toggle svg');
    return { nav: nav && { l: nav.left, r: nav.right }, main: main && { l: main.left, r: main.right }, transform: icon ? getComputedStyle(icon).transform : null };
  });
  if (!w.nav || !w.main) p.push('R1 navigation or main missing at 1440');
  else if (!(w.nav.l >= w.main.r - 1)) p.push(`R1 persistent navigation is not at the inline start in RTL (nav ${Math.round(w.nav.l)}..${Math.round(w.nav.r)}, main ${Math.round(w.main.l)}..${Math.round(w.main.r)})`);
  if (!w.transform || w.transform === 'none') p.push('R1 the directional panel icon is not mirrored in RTL');
  if (await openSheet(medium)) {
    const s = await medium.evaluate(() => { const r = document.querySelector('dialog.paep-shell-sheet[open]').getBoundingClientRect(); return { r: r.right, w: innerWidth }; });
    if (Math.abs(s.r - s.w) > 1) p.push(`R1 the sheet does not attach to the right edge in RTL (right ${Math.round(s.r)} of ${s.w})`);
  } else p.push('R1 the sheet could not be opened at 834');
  return p;
}

/** L1: 200 % text on the workspace keeps the page free of horizontal scroll. */
export async function largeTextProblems(page) {
  await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
  await settle(page, 300);
  const l = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth }));
  return l.scroll > l.client + 1 ? [`L1 horizontal scroll at 200 % text: ${l.scroll} > ${l.client}`] : [];
}

async function pool(items, n, fn) {
  const out = [];
  let i = 0;
  await Promise.all(Array.from({ length: n }, async () => { while (i < items.length) { const k = i++; out[k] = await fn(items[k]); } }));
  return out;
}

/** DDR-IB3-07 (PO/SA, 2026-10-07): hard limits in bytes (1 kB = 1000 bytes, as the Angular CLI reports). */
export const BUDGET = { rawTarget: 500_000, rawMax: 525_000, transferMax: 150_000 };

/**
 * Exact sizes of the initial files: the scripts, stylesheets and module preloads index.html names, plus every
 * script they import statically, followed recursively (a preload hint can be missing, so it is never relied on).
 * Dynamic import() targets are lazy and not counted. Raw bytes and Brotli bytes (the CLI's transfer estimate).
 */
export function measureInitial(dir) {
  const html = fs.readFileSync(path.join(dir, 'index.html'), 'utf8');
  const named = [...html.matchAll(/(?:src|href)="([^"?#]+\.(?:js|css))"/g)].map((m) => m[1]);
  const files = [];
  const queue = [...new Set(named)];
  while (queue.length) {
    const f = queue.shift();
    if (files.includes(f)) continue;
    files.push(f);
    if (!f.endsWith('.js')) continue;
    const code = fs.readFileSync(path.join(dir, f), 'utf8');
    for (const m of code.matchAll(/\b(?:import|export)\s*(?:[^"'();]*?\bfrom\s*)?["']\.\/([^"']+\.js)["']/g)) if (!files.includes(m[1])) queue.push(m[1]);
  }
  let raw = 0;
  let transfer = 0;
  for (const f of files) {
    const bytes = fs.readFileSync(path.join(dir, f));
    raw += bytes.length;
    transfer += zlib.brotliCompressSync(bytes).length;
  }
  return { files, raw, transfer };
}

export function budgetProblems(dir) {
  const m = measureInitial(dir);
  const p = [];
  if (!m.files.length) p.push('no initial files found in index.html');
  if (m.raw > BUDGET.rawMax) p.push(`raw ${m.raw} bytes > hard maximum ${BUDGET.rawMax}`);
  if (m.transfer > BUDGET.transferMax) p.push(`transfer ${m.transfer} bytes > hard maximum ${BUDGET.transferMax}`);
  return { m, problems: p };
}

async function main() {
  const args = process.argv.slice(2);
  const capture = args.includes('--capture') ? path.resolve(args[args.indexOf('--capture') + 1]) : null;
  const jsonOut = args.includes('--json') ? path.resolve(args[args.indexOf('--json') + 1]) : null;
  if (capture) fs.mkdirSync(capture, { recursive: true });
  const started = Date.now();
  const results = [];
  {
    const { m, problems } = budgetProblems(DIST);
    const kb = (n) => `${(n / 1000).toFixed(2)} kB`;
    results.push({
      id: 'B1',
      name: `Initial bundle budget: raw ${m.raw} bytes (${kb(m.raw)}; target ${kb(BUDGET.rawTarget)} ${m.raw > BUDGET.rawTarget ? 'exceeded' : 'met'}, hard maximum ${kb(BUDGET.rawMax)}), transfer ${m.transfer} bytes (${kb(m.transfer)}; hard maximum ${kb(BUDGET.transferMax)}) — ${m.files.join(', ')}`,
      problems,
    });
  }
  const server = await serveStrict(DIST);
  const browser = await launch();
  try {
    const combos = [];
    for (const vp of VIEWPORTS) for (const dir of ['ltr', 'rtl']) for (const st of STATES) combos.push({ vp, dir, st });
    const states = await pool(combos, 4, async ({ vp, dir, st }) => {
      const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
      try {
        const { page, errors } = await openApp(ctx, `${server.url}${st.path}`, dir);
        if (st.act && !(await st.act(page))) {
          if (st.act !== openPalette) return null;
        }
        const problems = await auditState(page, errors, { axe: AXE_AT.has(vp.name), report: Boolean(st.report) });
        if (capture) await page.screenshot({ path: path.join(capture, `${st.id}--${vp.name}--${dir}.png`) });
        return { id: `${st.id}@${vp.name}/${dir}`, problems };
      } catch (e) {
        return { id: `${st.id}@${vp.name}/${dir}`, problems: [`harness: ${String(e).slice(0, 200)}`] };
      } finally {
        await ctx.close();
      }
    });
    const ran = states.filter(Boolean);
    results.push({ id: 'H', name: `H1-H5 shell states: ${ran.length} state × viewport × direction combinations (axe at 1440, 834, 640 and 320)`, problems: ran.flatMap((s) => s.problems.map((x) => `${s.id}: ${x}`)) });

    const single = async (id, name, vp, url, fn, { dir = 'ltr', reduce = false } = {}) => {
      const ctx = await browser.newContext({ viewport: { width: vp[0], height: vp[1] }, reducedMotion: reduce ? 'reduce' : 'no-preference' });
      try {
        const { page } = await openApp(ctx, `${server.url}${url}`, dir);
        results.push({ id, name, problems: await fn(page) });
      } catch (e) {
        results.push({ id, name, problems: [`harness: ${String(e).slice(0, 200)}`] });
      } finally {
        await ctx.close();
      }
    };
    const n1 = [];
    for (const vp of [[320, 720], [320, 256]]) {
      for (const dir of ['ltr', 'rtl']) {
        const ctx = await browser.newContext({ viewport: { width: vp[0], height: vp[1] } });
        const { page } = await openApp(ctx, `${server.url}/workspace`, dir);
        n1.push(...(await neverHiddenProblems(page)).map((x) => `${vp.join('×')}/${dir}: ${x}`));
        n1.push(...(await signOutReachableProblems(page)).map((x) => `${vp.join('×')}/${dir}: ${x}`));
        await page.keyboard.press('Escape');
        await settle(page, 200);
        n1.push(...(await narrowContextProblems(page)).map((x) => `${vp.join('×')}/${dir}: ${x}`));
        n1.push(...(await narrowConnectivityProblems(page, 'offline')).map((x) => `${vp.join('×')}/${dir}: ${x}`));
        await ctx.close();
        const unknownCtx = await browser.newContext({ viewport: { width: vp[0], height: vp[1] } });
        await unknownCtx.addInitScript(UNKNOWN_CONNECTIVITY);
        const unknown = await openApp(unknownCtx, `${server.url}/workspace`, dir);
        n1.push(...(await narrowConnectivityProblems(unknown.page, 'unknown')).map((x) => `${vp.join('×')}/${dir}: ${x}`));
        await unknownCtx.close();
      }
    }
    results.push({ id: 'N1', name: 'Never-hidden set (incl. notifications with count, account with sign-out, the current tenant context and the offline and unknown connectivity rows) present and inside the viewport at 320 and 320×256 (LTR and RTL)', problems: n1 });
    const t1 = [];
    for (const vp of [[1440, 900], [320, 720]]) {
      for (const act of [null, openSheet, openPalette, openNotifications, openAccount]) {
        const ctx = await browser.newContext({ viewport: { width: vp[0], height: vp[1] } });
        const { page } = await openApp(ctx, `${server.url}/workspace`);
        if (act) await act(page);
        t1.push(...(await targetSizeProblems(page)).map((x) => `${vp[0]}${act ? `/${act.name}` : ''}: ${x}`));
        await ctx.close();
      }
    }
    results.push({ id: 'T1', name: 'Shell targets at least 24 × 24 CSS px at 1440 and 320 (chrome, sheet, palette, notification panel, account menu)', problems: [...new Set(t1)] });
    const a1 = [];
    for (const vp of [[1440, 900], [834, 1112], [320, 720]]) {
      for (const act of [null, openSheet, openNotifications, openAccount, openLanguage]) {
        const ctx = await browser.newContext({ viewport: { width: vp[0], height: vp[1] } });
        try {
          const { page } = await openApp(ctx, `${server.url}/workspace`);
          if (act && !(await act(page))) {
            // Only two controls are absent by design: the sheet at 1024 px and wider, the topbar language menu below 600 px.
            const absent = (act === openSheet && vp[0] >= 1024) || (act === openLanguage && vp[0] < 600);
            if (!absent) a1.push(`${vp[0]}/${act.name}: A1 could not open the control`);
            continue;
          }
          a1.push(...(await labelInNameProblems(page)).map((x) => `${vp[0]}${act ? `/${act.name}` : ''}: ${x}`));
        } finally {
          await ctx.close();
        }
      }
    }
    results.push({ id: 'A1', name: 'Label in name (WCAG 2.5.3): controls named by aria-label include their visible text (1440, 834, 320; chrome, sheet, notifications, account and language menus)', problems: [...new Set(a1)] });
    {
      const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
      try {
        results.push({ id: 'C1', name: 'Strict CSP: per-response nonce in header and page, profile policy, no inline content without the nonce, Angular styles nonced, blocked probes (inline script, wrong nonce, inline style, eval, HTML sink)', problems: await cspProblems(ctx, server) });
      } finally {
        await ctx.close();
      }
    }
    await single('K1', 'Skip link is the first Tab stop, visible when focused, and moves focus to main (1440, 320)', [1440, 900], '/workspace', skipLinkProblems);
    await single('K1b', 'Skip link at 320', [320, 720], '/workspace', skipLinkProblems);
    await single('K2', 'Ctrl+K opens the palette with focus in the combobox; Escape returns focus to the trigger', [1440, 900], '/workspace', paletteKeyboardProblems);
    await single('K3', 'Navigation sheet takes focus and returns it to Open navigation on Escape (834)', [834, 1112], '/workspace', sheetKeyboardProblems);
    await single('K4', 'A route change focuses the new page h1', [1440, 900], '/workspace', routeFocusProblems);
    await single('K5', 'No keyboard trap over the chrome and page (1440)', [1440, 900], '/workspace', trapProblems);
    await single('F1', 'Focused chrome controls show a focus indicator of at least 2 px (1440, 834)', [1440, 900], '/workspace', focusVisibleProblems);
    await single('F1b', 'Focus indicator at 834', [834, 1112], '/workspace', focusVisibleProblems);
    await single('M1', 'Reduced motion: motion tokens 0 ms; the sheet and the palette open without animation (834)', [834, 1112], '/workspace', reducedMotionProblems, { reduce: true });
    {
      const a = await browser.newContext({ viewport: { width: 1440, height: 900 } });
      const b = await browser.newContext({ viewport: { width: 834, height: 1112 } });
      try {
        const wide = (await openApp(a, `${server.url}/workspace`, 'rtl')).page;
        const medium = (await openApp(b, `${server.url}/workspace`, 'rtl')).page;
        results.push({ id: 'R1', name: 'RTL mirroring: navigation at the inline start, sheet on the right edge, directional icon mirrored', problems: await rtlProblems(wide, medium) });
      } finally {
        await a.close();
        await b.close();
      }
    }
    await single('K6', 'Account menu: Enter opens on the first item, End reaches Sign out, Escape returns to the button; 16 px inside the viewport (1440)', [1440, 900], '/workspace', menuKeyboardProblems);
    await single('K6b', 'Account menu at 320', [320, 720], '/workspace', menuKeyboardProblems);
    await single('K7', 'Notification panel: opens on its heading, at most 24 rem and 16 px inside the viewport, Escape returns to the bell (1440)', [1440, 900], '/workspace', notificationPanelProblems);
    await single('K7b', 'Notification panel at 320', [320, 720], '/workspace', notificationPanelProblems);
    await single('L1', '200 % text keeps the workspace free of horizontal scroll (1440)', [1440, 900], '/workspace', largeTextProblems);
    await single('L1b', '200 % text at 640 (400 % zoom is covered by the 320 px states)', [640, 900], '/workspace', largeTextProblems);
  } finally {
    await browser.close();
    await server.close();
  }
  const failed = results.filter((r) => r.problems.length);
  for (const r of results) {
    console.log(`${r.problems.length ? 'FAIL' : 'PASS'} ${r.id} ${r.name}${r.problems.length ? '' : ''}`);
    for (const x of r.problems.slice(0, 25)) console.log(`     ${x}`);
    if (r.problems.length > 25) console.log(`     … ${r.problems.length - 25} more`);
  }
  const seconds = Math.round((Date.now() - started) / 1000);
  if (jsonOut) fs.writeFileSync(jsonOut, JSON.stringify({ ok: failed.length === 0, seconds, results }, null, 2) + '\n');
  console.log(`\nPAEP enterprise-shell browser QA: ${failed.length ? 'FAIL' : 'PASS'} (${results.length - failed.length}/${results.length}; ${seconds}s)`);
  process.exit(failed.length ? 1 : 0);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();
