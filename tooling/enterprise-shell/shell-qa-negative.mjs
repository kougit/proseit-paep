#!/usr/bin/env node
/**
 * Seeded negatives for the IB3 enterprise-shell browser gate (npm run qa:shell:negative), against the production
 * reference-app build. Each case injects one defect into a served page and requires the matching shell-qa check to
 * report it; the positive controls require the unmutated pages to pass. The B1 budget cases mutate a copy of the build
 * instead (raw one byte over the hard maximum, transfer over its maximum at unchanged raw size; controls at exactly the
 * raw maximum and on the build as it is). The C1 strict-CSP cases serve the build (or an edited copy) through the
 * gate's strict server with one seeded weakness each: a weakened policy, a static, missing, unsubstituted or wrong
 * nonce, inline content in index.html, or a violation on a page (H5); the control is the strict server as it is.
 * The other cases inject defects with inline styles and scripts, so they use a server without a policy. The case
 * count is pinned.
 *   node tooling/enterprise-shell/shell-qa-negative.mjs
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { launch, serve } from '../design-system/browser-qa.mjs';
import {
  BUDGET,
  DIST,
  auditState,
  budgetProblems,
  cspProblems,
  measureInitial,
  focusVisibleProblems,
  labelInNameProblems,
  largeTextProblems,
  menuKeyboardProblems,
  narrowConnectivityProblems,
  narrowContextProblems,
  neverHiddenProblems,
  notificationPanelProblems,
  openApp,
  paletteKeyboardProblems,
  reducedMotionProblems,
  routeFocusProblems,
  rtlProblems,
  serveStrict,
  sheetKeyboardProblems,
  signOutReachableProblems,
  skipLinkProblems,
  targetSizeProblems,
  trapProblems,
} from './shell-qa.mjs';

const EXPECTED_NEGATIVES = 49;
const EXPECTED_CONTROLS = 7;
const css = (rule) => async (page) => page.addStyleTag({ content: rule });
const js = (fn) => async (page) => page.evaluate(fn);
/** A budget case: mutate(dir) edits a copy of the build; the check is B1 on that copy. */
const build = (mutate) => ({ build: mutate });
const largestInitial = (dir) => measureInitial(dir).files.filter((f) => f.endsWith('.js')).map((f) => path.join(dir, f)).sort((a, b) => fs.statSync(b).size - fs.statSync(a).size)[0];
/** Pads the largest initial script with a compressible comment until the raw total is exactly `target` bytes. */
const padRawTo = (target) => (dir) => {
  const n = target - measureInitial(dir).raw - 4;
  if (n < 0) throw new Error(`build already over ${target} bytes`);
  fs.appendFileSync(largestInitial(dir), `/*${'a'.repeat(n)}*/`);
};
/** Replaces the largest initial script with incompressible text of the same byte length (raw total unchanged). */
const incompressible = (dir) => {
  const f = largestInitial(dir);
  const size = fs.statSync(f).size;
  fs.writeFileSync(f, crypto.randomBytes(size).toString('base64').slice(0, size));
};
/** Removes every modulepreload hint from index.html (the CLI emits at most 10, and none without preloadInitial). */
const dropPreloads = (dir) => {
  const f = path.join(dir, 'index.html');
  const html = fs.readFileSync(f, 'utf8');
  if (!/rel="modulepreload"/.test(html)) throw new Error('no modulepreload hint to drop');
  fs.writeFileSync(f, html.replace(/<link rel="modulepreload"[^>]*>/g, ''));
};
/** Grows a statically imported, unhinted chunk until the raw total is one byte over the hard maximum. */
const growImported = (dir) => {
  const shared = measureInitial(dir).files.find((x) => x.startsWith('chunk-'));
  if (!shared) throw new Error('no statically imported chunk');
  dropPreloads(dir);
  const n = BUDGET.rawMax + 1 - measureInitial(dir).raw - 4;
  fs.appendFileSync(path.join(dir, shared), `/*${'a'.repeat(n)}*/`);
};
/** Adds a second-level chunk, imported only by another chunk and never hinted, that takes the raw total over. */
const nestedChunk = (dir) => {
  const shared = measureInitial(dir).files.find((x) => x.startsWith('chunk-'));
  dropPreloads(dir);
  const extra = 'chunk-PAEPNEG1.js';
  fs.writeFileSync(path.join(dir, extra), '');
  fs.appendFileSync(path.join(dir, shared), `\nimport"./${extra}";`);
  fs.writeFileSync(path.join(dir, extra), `/*${'a'.repeat(BUDGET.rawMax + 1 - measureInitial(dir).raw - 4)}*/`);
};
/** A strict-CSP case: `opts` for serveStrict, `edit(dir)` on a copy of the build; the check is C1 (or `page` on a served page). */
const strict = (opts = {}, edit = null, page = null) => ({ strict: { opts, edit, page } });
const addPolicy = (k, t) => (d) => ({ ...d, [k]: [...d[k], t] });
const editIndex = (fn) => (dir) => { const f = path.join(dir, 'index.html'); fs.writeFileSync(f, fn(fs.readFileSync(f, 'utf8'))); };
const blurOnClose = () => document.addEventListener('close', () => setTimeout(() => document.activeElement?.blur?.(), 0), true);

/** [id, name, viewport, url, mutation, check, expected] — a null mutation is a positive control. */
const CASES = [
  ['S00', 'positive control: workspace state at 320', [320, 720], '/workspace', null, (p, e) => auditState(p, e), null],
  ['S01', 'H1 element forcing horizontal scroll', [320, 720], '/workspace', js(() => document.querySelector('main').insertAdjacentHTML('beforeend', '<div style="inline-size: 900px">Wide</div>')), (p, e) => auditState(p, e, { axe: false }), /H1 horizontal scroll/],
  ['S02', 'H2 console error', [320, 720], '/workspace', js(() => console.error('injected failure')), (p, e) => auditState(p, e, { axe: false }), /H2 console: injected failure/],
  ['S03', 'H2 an error line carrying raw detail is not the allowlisted report', [1440, 900], '/error-demo', js(() => console.error('PAEP error render (ERR-ABCDEFGHJKLM) /api/tenants/42?token=abc')), (p, e) => auditState(p, e, { axe: false, report: true }), /H2 console: PAEP error render .*token/],
  ['S04', 'H3 second h1', [834, 1112], '/workspace', js(() => document.querySelector('main').insertAdjacentHTML('beforeend', '<h1>Second</h1>')), (p, e) => auditState(p, e, { axe: false }), /H3 2 h1 elements/],
  ['S05', 'H4 unnamed button in the topbar', [1440, 900], '/workspace', js(() => document.querySelector('.paep-shell-topbar__actions').insertAdjacentHTML('beforeend', '<button type="button"></button>')), (p, e) => auditState(p, e), /H4 axe button-name/],
  ['S06', 'N1 search hidden at 320', [320, 256], '/workspace', css('paep-shell-topbar button[aria-keyshortcuts] { display: none !important; }'), (p) => neverHiddenProblems(p), /N1 search not rendered/],
  ['S07', 'N1 product link pushed outside the viewport', [320, 720], '/workspace', css('.paep-shell-topbar__product { position: relative; inset-inline-start: 400px; }'), (p) => neverHiddenProblems(p), /N1 product outside the viewport horizontally/],
  ['S08', 'T1 navigation toggle below 24 px', [320, 720], '/workspace', css('.paep-shell-topbar__nav-toggle { min-inline-size: 0 !important; min-block-size: 0 !important; inline-size: 16px !important; block-size: 16px !important; padding: 0 !important; }'), (p) => targetSizeProblems(p), /T1 button "Open navigation" 16×16/],
  ['S09', 'K1 skip link removed', [1440, 900], '/workspace', js(() => document.querySelector('.paep-skip-link').remove()), (p) => skipLinkProblems(p), /K1 first Tab stop is not the skip link/],
  ['S10', 'K2 focus lost after the palette closes', [1440, 900], '/workspace', js(blurOnClose), (p) => paletteKeyboardProblems(p), /K2 focus did not return/],
  ['S11', 'K3 focus lost after the sheet closes', [834, 1112], '/workspace', js(blurOnClose), (p) => sheetKeyboardProblems(p), /K3 focus did not return/],
  ['S12', 'K4 focus not moved to the new h1 on a route change', [1440, 900], '/workspace', js(() => { const push = history.pushState.bind(history); history.pushState = (...a) => { push(...a); setTimeout(() => document.activeElement?.blur?.(), 150); }; }), (p) => routeFocusProblems(p), /K4 route change left focus on body/],
  ['S13', 'K5 keyboard trap in the topbar', [1440, 900], '/workspace', js(() => { document.querySelector('.paep-shell-topbar__actions').insertAdjacentHTML('afterbegin', '<button type="button" id="k5-trap">Trap</button>'); document.getElementById('k5-trap').addEventListener('keydown', (e) => { if (e.key === 'Tab') e.preventDefault(); }); }), (p) => trapProblems(p), /K5 keyboard trap at button Trap/],
  ['S14', 'F1 focus indicator removed from the chrome', [1440, 900], '/workspace', css('paep-shell-topbar *:focus, paep-shell-nav *:focus, .paep-skip-link:focus { outline: none !important; box-shadow: none !important; }'), (p) => focusVisibleProblems(p), /F1 no visible focus indicator/],
  ['S15', 'M1 sheet transition left running under reduced motion', [834, 1112], '/workspace', css('dialog.paep-shell-sheet[open] { animation: paep-negative-slide 2s linear !important; } @keyframes paep-negative-slide { from { translate: -10px 0; } to { translate: 0 0; } }'), (p) => reducedMotionProblems(p), /M1 sheet animates/],
  ['S16', 'M1 motion token left at 150 ms under reduced motion', [834, 1112], '/workspace', css(':root { --paep-motion-duration-base: 150ms !important; }'), (p) => reducedMotionProblems(p), /M1 --paep-motion-duration-base = 150ms/],
  ['S17', 'R1 navigation not mirrored in RTL', [1440, 900], '/workspace', 'rtl-nav', null, /R1 persistent navigation is not at the inline start/],
  ['S18', 'L1 fixed-width content at 200 % text', [1440, 900], '/workspace', js(() => document.querySelector('main').insertAdjacentHTML('beforeend', '<div style="inline-size: 60rem">Fixed</div>')), (p) => largeTextProblems(p), /L1 horizontal scroll at 200 % text/],
  ['S19', 'positive control: the navigation sheet keyboard path passes unmutated at 834', [834, 1112], '/workspace', null, (p) => sheetKeyboardProblems(p), null],
  ['S20', 'positive control: RTL mirroring passes unmutated', [1440, 900], '/workspace', 'rtl-ok', null, null],
  ['S21', 'N1 notification count dropped from the bell name at 320', [320, 256], '/workspace', js(() => document.querySelector('.paep-notification-panel__bell').setAttribute('aria-label', 'Notifications')), (p) => neverHiddenProblems(p), /N1 notifications without its count/],
  ['S22', 'N1 account hidden at 320', [320, 720], '/workspace', css('.paep-account-menu__button { display: none !important; }'), (p) => neverHiddenProblems(p), /N1 account not rendered/],
  ['S23', 'N1 Sign out removed from the account menu at 320', [320, 256], '/workspace', css('paep-account-menu [role="menu"] > button:last-child { display: none !important; }'), (p) => signOutReachableProblems(p), /N1 End in the account menu does not reach Sign out/],
  ['S24', 'K6 focus lost after Escape closes the account menu', [1440, 900], '/workspace', js(() => document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setTimeout(() => document.activeElement?.blur?.(), 50); }, true)), (p) => menuKeyboardProblems(p), /K6 focus did not return to the account button/],
  ['S25', 'K7 notification panel wider than 24 rem', [1440, 900], '/workspace', css('.paep-notification-panel__popover { inline-size: 40rem !important; max-inline-size: none !important; }'), (p) => notificationPanelProblems(p), /K7 panel wider than 24 rem/],
  ['S26', 'K7 focus not on the panel heading when it opens', [320, 720], '/workspace', js(() => document.addEventListener('focusin', (e) => { if (e.target.matches?.('.paep-notification-panel__title')) e.target.blur(); })), (p) => notificationPanelProblems(p), /K7 focus is not on the panel heading/],
  ['S27', 'positive control: the account menu and notification panel keyboard paths pass unmutated at 320', [320, 720], '/workspace', null, async (p) => [...(await menuKeyboardProblems(p)), ...(await notificationPanelProblems(p))], null],
  ['S28', 'B1 raw initial bundle one byte over the hard maximum (shown as 525.00 kB; never rounded)', null, null, build(padRawTo(BUDGET.rawMax + 1)), null, new RegExp(`raw ${BUDGET.rawMax + 1} bytes > hard maximum ${BUDGET.rawMax}`)],
  ['S29', 'B1 transfer over the hard maximum at unchanged raw size', null, null, build(incompressible), null, new RegExp(`transfer \\d+ bytes > hard maximum ${BUDGET.transferMax}`)],
  ['S32', 'B1 a statically imported chunk without its preload hint grows over the hard maximum (hints are never relied on)', null, null, build(growImported), null, new RegExp(`raw ${BUDGET.rawMax + 1} bytes > hard maximum ${BUDGET.rawMax}`)],
  ['S33', 'B1 a second-level chunk imported only by another chunk takes the raw total over the hard maximum', null, null, build(nestedChunk), null, new RegExp(`raw ${BUDGET.rawMax + 1} bytes > hard maximum ${BUDGET.rawMax}`)],
  ['S34', 'A1 the language button named "Language: English" while it shows "EN" (label not in name)', [1440, 900], '/workspace', js(() => document.querySelector('.paep-shell-topbar__language').setAttribute('aria-label', 'Language: English')), (p) => labelInNameProblems(p), /A1 button shows "en" but is named "Language: English"/],
  ['S35', "C1 'unsafe-inline' added to style-src", null, null, strict({ policy: addPolicy('style-src', "'unsafe-inline'") }), null, /C1 style-src allows 'unsafe-inline'/],
  ['S36', "C1 'unsafe-eval' added to script-src", null, null, strict({ policy: addPolicy('script-src', "'unsafe-eval'") }), null, /C1 script-src allows 'unsafe-eval'/],
  ['S37', 'C1 one static nonce for every response', null, null, strict({ nonce: 'static' }), null, /C1 the nonce is repeated across responses/],
  ['S38', 'C1 placeholders left unsubstituted (the page has no nonce)', null, null, strict({ nonce: 'unsubstituted' }), null, /C1 violation during normal operation/],
  ['S39', 'C1 a policy without the nonce', null, null, strict({ policy: (d) => ({ ...d, 'script-src': ["'self'"], 'style-src': ["'self'"] }) }), null, /C1 script-src and style-src do not carry one nonce/],
  ['S40', 'C1 the page gets a different nonce than the header (wrong nonce)', null, null, strict({ nonce: 'mismatch' }), null, /C1 the page nonce does not match the header nonce/],
  ['S41', 'C1 a build without the ngCspNonce placeholder', null, null, strict({}, editIndex((h) => h.replace(/\sngcspnonce="[^"]*"/gi, '').replace(/\snonce="[^"]*"/g, ''))), null, /C1 index.html root element has no ngCspNonce placeholder/],
  ['S42', 'C1 an inline onclick handler in index.html', null, null, strict({}, editIndex((h) => h.replace('<body>', '<body onclick="void 0">'))), null, /C1 index.html <body> has an inline onclick handler/],
  ['S43', 'C1 angular#unsafe-bypass added to trusted-types', null, null, strict({ policy: addPolicy('trusted-types', 'angular#unsafe-bypass') }), null, /C1 trusted-types allows angular#unsafe-bypass/],
  ['S44', 'C1 Trusted Types not required (the HTML sink probe then runs)', null, null, strict({ policy: (d) => { const { ['require-trusted-types-for']: _, ...rest } = d; return rest; } }), null, /C1 probe: an HTML string sink is allowed/],
  ['S45', 'C1 a wildcard script origin', null, null, strict({ policy: addPolicy('script-src', '*') }), null, /C1 script-src allows \*/],
  ['S46', 'H5 a style element inserted without the nonce is reported as a violation', [1440, 900], '/workspace', strict({}, null, js(() => { const e = document.createElement('style'); e.textContent = '.x{}'; document.head.append(e); })), null, /H5 CSP violation: style-src-elem/],
  ['S48', 'C1 a wildcard in the script-src-elem override', null, null, strict({ policy: (d) => ({ ...d, 'script-src-elem': ['*'] }) }), null, /C1 script-src-elem allows \*/],
  ['S49', 'C1 a repeated directive in other capitals placed first (browsers enforce the first copy)', null, null, strict({ policy: (d) => ({ 'Script-Src': ['*'], ...d }) }), null, /C1 directive script-src is repeated/],
  ['S50', 'C1 frame-ancestors dropped', null, null, strict({ policy: (d) => { const { ['frame-ancestors']: _, ...rest } = d; return rest; } }), null, /C1 frame-ancestors is not 'self' or 'none'/],
  ['S51', 'N1 current tenant context line hidden at 320', [320, 720], '/workspace', css('.paep-page-frame__tenant { display: none !important; }'), (p) => narrowContextProblems(p), /N1 context line not rendered/],
  ['S52', 'N1 current tenant context line truncated with an ellipsis at 320', [320, 256], '/workspace', css('.paep-page-frame__tenant > span:last-child { display: inline-block; max-width: 60px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }'), (p) => narrowContextProblems(p), /N1 context line truncated/],
  ['S53', 'N1 context line names another tenant at 320', [320, 720], '/workspace', js(() => { const s = document.querySelector('.paep-page-frame__tenant > span:last-child'); s.lastChild.textContent = 'Other Organisation'; }), (p) => narrowContextProblems(p), /N1 context line does not show "Sample Organisation A · Site 01"/],
  ['S54', 'N1 navigation sheet context header hidden at 320', [320, 720], '/workspace', css('.paep-shell__sheet-context { display: none !important; }'), (p) => narrowContextProblems(p), /N1 navigation sheet has no context header/],
  ['S55', 'N1 offline connectivity row hidden at 320', [320, 256], '/workspace', css('.paep-shell-status__row[data-status="connectivity"] { display: none !important; }'), (p) => narrowConnectivityProblems(p, 'offline'), /N1 offline connectivity row not rendered/],
  ['S47', 'positive control: the strict server as it is', null, null, strict(), null, null],
  ['S30', 'positive control: raw initial bundle exactly at the hard maximum', null, null, build(padRawTo(BUDGET.rawMax)), null, null],
  ['S31', 'positive control: the build as it is', null, null, build(() => {}), null, null],
];

const server = await serve(DIST);
const browser = await launch();
const results = [];
try {
  for (const [id, name, vp, url, mutate, check, expect] of CASES) {
    let problems = [];
    const ctxs = [];
    try {
      if (mutate?.build) {
        const copy = fs.mkdtempSync(path.join(os.tmpdir(), 'paep-shell-budget-'));
        try {
          fs.cpSync(DIST, copy, { recursive: true });
          mutate.build(copy);
          problems = budgetProblems(copy).problems;
        } finally {
          fs.rmSync(copy, { recursive: true, force: true });
        }
      } else if (mutate?.strict) {
        const { opts, edit, page: act } = mutate.strict;
        const copy = edit ? fs.mkdtempSync(path.join(os.tmpdir(), 'paep-shell-csp-')) : null;
        if (copy) { fs.cpSync(DIST, copy, { recursive: true }); edit(copy); }
        const strictServer = await serveStrict(copy ?? DIST, opts);
        try {
          const ctx = await browser.newContext({ viewport: { width: vp?.[0] ?? 1440, height: vp?.[1] ?? 900 } });
          ctxs.push(ctx);
          if (act) {
            const { page, errors } = await openApp(ctx, `${strictServer.url}${url}`);
            await act(page);
            await page.waitForTimeout(150);
            problems = await auditState(page, errors, { axe: false });
          } else {
            problems = await cspProblems(ctx, strictServer);
          }
        } finally {
          await strictServer.close();
          if (copy) fs.rmSync(copy, { recursive: true, force: true });
        }
      } else if (mutate === 'rtl-nav' || mutate === 'rtl-ok') {
        const a = await browser.newContext({ viewport: { width: 1440, height: 900 } });
        const b = await browser.newContext({ viewport: { width: 834, height: 1112 } });
        ctxs.push(a, b);
        const wide = (await openApp(a, `${server.url}${url}`, 'rtl')).page;
        const medium = (await openApp(b, `${server.url}${url}`, 'rtl')).page;
        if (mutate === 'rtl-nav') await wide.addStyleTag({ content: '.paep-shell__frame { direction: ltr !important; }' });
        problems = await rtlProblems(wide, medium);
      } else {
        const reduce = /^M1/.test(name);
        const ctx = await browser.newContext({ viewport: { width: vp[0], height: vp[1] }, reducedMotion: reduce ? 'reduce' : 'no-preference' });
        ctxs.push(ctx);
        const { page, errors } = await openApp(ctx, `${server.url}${url}`);
        if (mutate) {
          await mutate(page);
          await page.waitForTimeout(150);
        }
        problems = await check(page, errors);
      }
    } catch (e) {
      problems = [`harness: ${String(e).slice(0, 200)}`];
    } finally {
      for (const c of ctxs) await c.close();
    }
    const pass = expect ? problems.some((x) => expect.test(x)) : problems.length === 0;
    results.push({ id, name, pass, problems });
    console.log(`${pass ? 'PASS' : 'FAIL'} ${id} ${name}${pass ? '' : ` — ${problems.slice(0, 4).join(' | ') || 'no problem reported'}`}`);
  }
} finally {
  await browser.close();
  await server.close();
}
const negatives = CASES.filter((c) => c[6]).length;
const coverage = negatives === EXPECTED_NEGATIVES && CASES.length - negatives === EXPECTED_CONTROLS ? [] : [`${negatives} negatives and ${CASES.length - negatives} controls; expected ${EXPECTED_NEGATIVES} and ${EXPECTED_CONTROLS}`];
for (const c of coverage) console.log(`FAIL ${c}`);
const failed = results.filter((r) => !r.pass).length + coverage.length;
console.log(`\nPAEP enterprise-shell browser QA negatives: ${failed ? 'FAIL' : 'PASS'} (${results.filter((r) => r.pass).length}/${results.length}; ${negatives} seeded negatives + ${results.length - negatives} controls)`);
process.exit(failed ? 1 : 0);
