#!/usr/bin/env node
/**
 * Seeded negatives for the IB3 enterprise-shell browser gate (npm run qa:shell:negative), against the production
 * reference-app build. Each case injects one defect into a served page and requires the matching shell-qa check to
 * report it; the positive controls require the unmutated pages to pass. The case count is pinned.
 *   node tooling/enterprise-shell/shell-qa-negative.mjs
 */
import { launch, serve } from '../design-system/browser-qa.mjs';
import {
  DIST,
  auditState,
  focusVisibleProblems,
  largeTextProblems,
  neverHiddenProblems,
  openApp,
  paletteKeyboardProblems,
  reducedMotionProblems,
  routeFocusProblems,
  rtlProblems,
  sheetKeyboardProblems,
  skipLinkProblems,
  targetSizeProblems,
  trapProblems,
} from './shell-qa.mjs';

const EXPECTED_NEGATIVES = 18;
const EXPECTED_CONTROLS = 3;
const css = (rule) => async (page) => page.addStyleTag({ content: rule });
const js = (fn) => async (page) => page.evaluate(fn);
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
];

const server = await serve(DIST);
const browser = await launch();
const results = [];
try {
  for (const [id, name, vp, url, mutate, check, expect] of CASES) {
    let problems = [];
    const ctxs = [];
    try {
      if (mutate === 'rtl-nav' || mutate === 'rtl-ok') {
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
