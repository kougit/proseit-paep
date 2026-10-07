#!/usr/bin/env node
/**
 * PAEP IB2 browser quality gate (npm run qa:accessibility), run against the production ui-lab build.
 *
 * Serves dist/ui-lab/browser locally, discovers every laboratory page from its contents list, and in an
 * installed Chrome/Chromium (browser.mjs; nothing is downloaded) checks at 1440, 834 and 320 CSS px, in LTR
 * and RTL:
 *   A1 axe-core: zero WCAG 2.0/2.1/2.2 A and AA violations, framed  A2 no page-level horizontal overflow
 *      shell-showcase previews included
 *   A3 no console error or page error                              A4 one h1 and one main landmark
 * and, once per run:
 *   M1 reduced motion (media emulation and the lab simulation) zeroes motion tokens and stops loops
 *   D1 density: compact controls 32 px on a fine pointer, 40 px on a coarse pointer; comfortable 40 px
 *   C1 computed styles match the approved tokens (brand primary, surfaces, focus ring)
 *   B1 a brand profile changes only the brand layer: every protected token keeps its approved value
 *   F1 keyboard focus shows the 2 px focus ring
 *   U1 status never by colour alone: badges, alerts and field errors carry an icon and text
 *   K1 no keyboard trap: Tab keeps moving focus on every component page
 *   O1 every overlay specimen (dialogs, drawers, popovers, the action-group More menu) is opened and its open
 *      content passes axe-core, at 1440 and 320 CSS px; Escape then closes it and focus returns to its trigger
 *
 *   node tooling/design-system/browser-qa.mjs [--capture <dir>] [--json <file>] [--pages <regex>]
 * --capture writes full-page screenshots of every page and viewport captures of every open overlay (CANDIDATE
 * visual evidence; never self-approved).
 */
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { findChrome } from './browser.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
export const DIST = path.join(ROOT, 'dist/ui-lab/browser');
export const AXE = path.join(ROOT, 'node_modules/axe-core/axe.min.js');
export const VIEWPORTS = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'tablet', width: 834, height: 1112 },
  { name: 'narrow320', width: 320, height: 720 },
];
export const AXE_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.json': 'application/json', '.ico': 'image/x-icon', '.txt': 'text/plain' };

/** Static server for the built lab with SPA fallback to index.html. Resolves to { url, close }. */
export function serve(dir = DIST) {
  if (!fs.existsSync(path.join(dir, 'index.html'))) throw new Error(`${dir}/index.html missing: run npm run build:ui-lab first`);
  const server = http.createServer((req, res) => {
    const u = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    let f = path.normalize(path.join(dir, u));
    if (!f.startsWith(dir) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) f = path.join(dir, 'index.html');
    res.writeHead(200, { 'content-type': TYPES[path.extname(f)] || 'application/octet-stream', 'cache-control': 'no-store' });
    fs.createReadStream(f).pipe(res);
  });
  return new Promise((resolve) => server.listen(0, '127.0.0.1', () => resolve({ url: `http://127.0.0.1:${server.address().port}`, close: () => new Promise((r) => server.close(r)) })));
}

export async function launch() {
  return chromium.launch({ executablePath: findChrome(), headless: true, args: ['--no-sandbox'] });
}

/**
 * Opens a page, collecting console errors and page errors; waits for Angular to render the h1. `trace`, when given,
 * is called with the phase name as each phase begins (diagnostics only; it does not change any wait or timeout).
 */
export async function open(context, url, trace = null) {
  const page = await context.newPage();
  const errors = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push(String(e)));
  trace?.('navigation-start');
  await page.goto(url, { waitUntil: 'networkidle' });
  trace?.('navigation-end; waiting for main h1');
  await page.waitForSelector('main h1', { timeout: 15000 });
  trace?.('h1-rendered');
  return { page, errors };
}

/**
 * Per-audit diagnostics on stderr (PO/SA pre-acceptance disposition 2026-10-07, section 8): one line per phase with
 * the audit number, route, viewport and direction, so a stalled or failed CI run shows where it stopped.
 */
function tracer(n, total, pth, vp, dir) {
  const t0 = Date.now();
  let phase = 'queued';
  const log = (next) => { phase = next; process.stderr.write(`[a11y-trace] audit ${n}/${total} ${pth} ${vp} ${dir} +${Date.now() - t0}ms ${next}\n`); };
  return { log, phase: () => phase };
}

/**
 * Runs axe-core on the document, or on the first element matching `selector`. Returns violation strings. On the
 * whole document, axe-core is also loaded into every child frame (the IB3 shell-showcase previews) once its h1 has
 * rendered, so the audit covers the framed documents too.
 */
export async function axeViolations(page, selector = null) {
  if (!selector) {
    for (const frame of page.frames().filter((f) => f !== page.mainFrame())) {
      await frame.waitForSelector('main h1', { timeout: 15000 });
      if (!(await frame.evaluate(() => 'axe' in window))) await frame.addScriptTag({ path: AXE });
    }
  }
  if (!(await page.evaluate(() => 'axe' in window))) await page.addScriptTag({ path: AXE });
  return page.evaluate(async ([tags, sel]) => {
    const target = sel ? document.querySelector(sel) : document;
    if (!target) return [`no element matches ${sel}`];
    // eslint-disable-next-line no-undef
    const r = await window.axe.run(target, { runOnly: { type: 'tag', values: tags }, resultTypes: ['violations'] });
    return r.violations.map((v) => `${v.id} (${v.impact}): ${v.nodes.slice(0, 3).map((n) => n.target.join(' ')).join(' | ')}`);
  }, [AXE_TAGS, selector]);
}

/** Overlay specimens opened by O1: [page, name of the button that opens it]. */
export const OVERLAYS = [
  ['/components/dialog', 'Delete Record 1'],
  ['/components/dialog', 'Read the retention rules'],
  ['/components/dialog', 'Rename depot'],
  ['/components/dialog', 'Open right-to-left dialog'],
  ['/components/drawer', 'Show Record 1 details'],
  ['/components/drawer', 'Edit Record 1'],
  ['/components/drawer', 'Open right-to-left drawer'],
  ['/components/popover', 'About the Pending status'],
  ['/components/popover', 'Related records'],
  ['/components/popover', 'More actions'],
  ['/components/popover', 'Retention details'],
  ['/components/action-group', 'More actions'],
];
const OPEN_OVERLAY = 'dialog[open], :popover-open';

/**
 * O1 for one overlay: presses the named button, requires an open dialog or popover, then runs axe-core on the
 * open overlay. `mutate` (negative suite only) runs after opening. Returns problems (strings).
 */
export async function auditOverlay(page, name, mutate = null) {
  const trigger = page.getByRole('button', { name, exact: true }).locator('visible=true').first();
  await trigger.evaluate((el) => { el.dataset.o1Trigger = ''; });
  await trigger.click();
  try {
    await page.waitForSelector(OPEN_OVERLAY, { timeout: 5000 });
  } catch {
    return ['nothing opened'];
  }
  await page.waitForTimeout(400);
  if (mutate) await page.evaluate(mutate);
  return axeViolations(page, OPEN_OVERLAY);
}

/**
 * O1 dismissal, after auditOverlay: Escape must close the overlay and return focus to the trigger that opened it
 * (focus is never lost to the page). `mutate` (negative suite only) runs before Escape. Returns problems (strings).
 */
export async function dismissOverlayProblems(page, mutate = null) {
  if (mutate) await page.evaluate(mutate);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(400);
  const state = await page.evaluate((sel) => ({
    open: !!document.querySelector(sel),
    onTrigger: document.activeElement?.hasAttribute('data-o1-trigger') ?? false,
    active: document.activeElement ? `${document.activeElement.tagName.toLowerCase()}${document.activeElement.className ? `.${String(document.activeElement.className).split(' ')[0]}` : ''}` : 'none',
  }), OPEN_OVERLAY);
  if (state.open) return ['still open after Escape'];
  return state.onTrigger ? [] : [`focus lost after dismissal: focus is on ${state.active}, not the trigger`];
}

/**
 * U1 on an open page: every status badge, alert and field error shows a visible icon and visible text, so status is
 * never communicated by colour alone (WCAG 1.4.1). Returns { count, problems }.
 */
export async function statusCueProblems(page) {
  return page.evaluate(() => {
    const problems = [];
    const shown = (el) => { const r = el.getBoundingClientRect(); const s = getComputedStyle(el); return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none'; };
    const items = [...document.querySelectorAll('.paep-status-badge, .paep-alert, .paep-field__error')].filter(shown);
    for (const el of items) {
      const icon = [...el.querySelectorAll(':scope > svg, :scope > .paep-alert__icon')].some(shown);
      const text = (el.querySelector('.paep-status-badge__text, .paep-alert__body, span')?.textContent ?? '').trim();
      const what = `${el.className.split(' ')[0]} "${(el.textContent ?? '').trim().slice(0, 30)}"`;
      if (!icon) problems.push(`U1 ${what}: no visible icon (status by colour alone)`);
      if (!text) problems.push(`U1 ${what}: no text`);
    }
    return { count: items.length, problems };
  });
}

/** A1-A4 on an open page. Returns problems (strings). */
export async function auditPage(page, errors) {
  const p = [];
  for (const v of await axeViolations(page)) p.push(`A1 axe ${v}`);
  const layout = await page.evaluate(() => ({
    scroll: document.documentElement.scrollWidth,
    client: document.documentElement.clientWidth,
    h1: document.querySelectorAll('h1').length,
    main: document.querySelectorAll('main, [role="main"]').length,
  }));
  if (layout.scroll > layout.client + 1) p.push(`A2 horizontal overflow: scrollWidth ${layout.scroll} > ${layout.client}`);
  for (const e of errors) p.push(`A3 console: ${e.slice(0, 200)}`);
  if (layout.h1 !== 1) p.push(`A4 ${layout.h1} h1 elements`);
  if (layout.main !== 1) p.push(`A4 ${layout.main} main landmarks`);
  return p;
}

/** Discovers every laboratory page from the contents list. */
export async function discover(browser, base) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const { page } = await open(ctx, `${base}/`);
  const paths = await page.$$eval('nav[aria-label="Laboratory contents"] a[href]', (as) => [...new Set(as.map((a) => new URL(a.href).pathname))]);
  await ctx.close();
  return paths;
}

const css = (page, sel, prop) => page.$eval(sel, (el, pr) => getComputedStyle(el).getPropertyValue(pr).trim(), prop);
const rootVar = (page, name) => page.evaluate((n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim(), name);
/**
 * Canonical form of a token value, so that the production CSS minifier's rewriting (".15s" for "150ms",
 * ".56" for "0.56", "#fff" for "#FFFFFF") is not mistaken for a changed value: colours are resolved by the
 * browser, times become milliseconds, and numbers lose redundant zeros.
 */
const canon = (page, value) => page.evaluate((v) => {
  const s = v.trim().replace(/\s+/g, ' ');
  if (CSS.supports('color', s)) { const e = document.createElement('i'); e.style.color = s; document.body.append(e); const c = getComputedStyle(e).color; e.remove(); return c; }
  const time = /^(-?[\d.]+)(ms|s)$/.exec(s);
  if (time) return `${Number(time[1]) * (time[2] === 's' ? 1000 : 1)}ms`;
  return s.replace(/-?\d*\.?\d+/g, (n) => String(Number(n))).toLowerCase();
}, value);

/** M1 on an open page under reduced motion: every motion duration token is 0 ms and the spinner loop is stopped. */
export async function reducedMotionProblems(page, tokens) {
  const p = [];
  for (const t of tokens.filter((x) => x.name.startsWith('--paep-motion-duration-'))) {
    const v = await rootVar(page, t.name);
    if ((await canon(page, v)) !== '0ms') p.push(`${t.name} = ${v}`);
  }
  const spin = await page.$eval('svg.paep-icon--spin', (el) => { const s = getComputedStyle(el); return `${s.animationName}|${s.animationDuration}|${s.animationPlayState}`; });
  if (!/^none\|/.test(spin) && !/\|0s\|/.test(spin) && !/paused$/.test(spin)) p.push(`spinner still animates (${spin})`);
  return p;
}

/**
 * K1 on an open page: presses Tab repeatedly from the top of the page and reports a keyboard trap, i.e. an element
 * that keeps focus when Tab is pressed (WCAG 2.1.2). Returns problems (strings).
 */
export async function keyboardTrapProblems(page, presses = 60) {
  await page.evaluate(() => { document.activeElement?.blur?.(); window.scrollTo(0, 0); });
  let previous = null;
  let moved = 0;
  for (let i = 0; i < presses; i++) {
    await page.keyboard.press('Tab');
    const now = await page.evaluate(() => {
      const e = document.activeElement;
      if (!e || e === document.body) return null;
      if (!e.dataset.k1) e.dataset.k1 = String(Math.random());
      return `${e.tagName.toLowerCase()}#${e.id || ''}.${e.getAttribute('aria-label') || e.textContent?.trim().slice(0, 30) || ''}|${e.dataset.k1}`;
    });
    if (now && now === previous) return [`K1 keyboard trap: Tab does not move focus from ${now.split('|')[0]}`];
    if (now) moved++;
    previous = now;
  }
  return moved ? [] : ['K1 Tab never focused anything'];
}

/** M1, D1, C1, B1, F1, O1, K1. Returns [{ id, name, problems }]. `paths` are the discovered lab pages (for K1). */
export async function globalChecks(browser, base, tokens, paths = []) {
  const out = [];
  const check = async (id, name, fn) => {
    const problems = [];
    try { await fn(problems); } catch (e) { problems.push(`error: ${e.message}`); }
    out.push({ id, name, problems });
  };
  const withPage = async (url, opts, fn) => {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, ...opts });
    try { const { page } = await open(ctx, url); await fn(page); } finally { await ctx.close(); }
  };

  await check('M1', 'Reduced motion zeroes every motion duration and stops loops (media emulation and lab simulation)', async (p) => {
    for (const [label, url, opts] of [['media', `${base}/foundations/motion`, { reducedMotion: 'reduce' }], ['simulation', `${base}/foundations/motion?motion=reduce`, {}]]) {
      await withPage(url, opts, async (page) => {
        for (const x of await reducedMotionProblems(page, tokens)) p.push(`${label}: ${x}`);
      });
    }
    await withPage(`${base}/foundations/motion`, {}, async (page) => {
      if ((await canon(page, await rootVar(page, '--paep-motion-duration-base'))) !== '150ms') p.push('default motion-duration-base is not 150ms');
    });
  });

  await check('D1', 'Density: comfortable 40 px controls; compact 32 px on a fine pointer and 40 px on a coarse pointer', async (p) => {
    const sel = 'main button[paepbutton]';
    const h = async (url, opts) => { let v = ''; await withPage(url, opts, async (page) => { v = await page.$eval(sel, (el) => el.getBoundingClientRect().height); }); return Math.round(Number(v)); };
    const comfortable = await h(`${base}/components/button`, {});
    const compact = await h(`${base}/components/button?density=compact`, {});
    const coarse = await h(`${base}/components/button?density=compact`, { hasTouch: true, isMobile: true, viewport: { width: 834, height: 1112 } });
    if (comfortable < 40) p.push(`comfortable button height ${comfortable}`);
    if (compact !== 32) p.push(`compact button height ${compact} (expected 32)`);
    if (coarse < 40) p.push(`compact on coarse pointer ${coarse} (expected 40)`);
  });

  await check('C1', 'Computed styles equal the approved tokens: page background, surface, primary button, focus-ring token', async (p) => {
    await withPage(`${base}/components/button`, {}, async (page) => {
      const bg = await css(page, 'body', 'background-color');
      if (bg !== 'rgb(239, 242, 245)') p.push(`body background ${bg}`);
      const btn = await page.$eval('main button[paepbutton]', (el) => getComputedStyle(el).backgroundColor);
      if (btn !== 'rgb(36, 54, 75)') p.push(`first (primary) button background ${btn}, expected Navy rgb(36, 54, 75)`);
      if ((await rootVar(page, '--paep-color-focus-ring')).toUpperCase() !== '#2D4FD1') p.push('focus ring token changed');
    });
  });

  await check('B1', 'Brand profile: synthetic petrol changes the brand layer only; every protected token keeps its approved value', async (p) => {
    await withPage(`${base}/components/button?brand=synthetic-demo-petrol`, {}, async (page) => {
      const btn = await page.$eval('main button[paepbutton]', (el) => getComputedStyle(el).backgroundColor);
      if (btn !== 'rgb(11, 94, 115)') p.push(`primary button under petrol ${btn}`);
      for (const t of tokens.filter((x) => x.protected)) {
        const v = await rootVar(page, t.name);
        if ((await canon(page, v)) !== (await canon(page, t.value))) p.push(`${t.name} = ${v}, approved ${t.value}`);
      }
    });
  });

  await check('F1', 'Keyboard focus shows the 2 px focus ring on a component', async (p) => {
    await withPage(`${base}/components/button`, {}, async (page) => {
      await page.focus('main h1');
      for (let i = 0; i < 40; i++) {
        await page.keyboard.press('Tab');
        const tag = await page.evaluate(() => document.activeElement?.hasAttribute('paepbutton'));
        if (tag) break;
      }
      const s = await page.evaluate(() => { const e = document.activeElement; const c = getComputedStyle(e); return { btn: e.hasAttribute('paepbutton'), style: c.outlineStyle, width: c.outlineWidth, color: c.outlineColor }; });
      if (!s.btn) p.push('Tab never reached a paepButton');
      else if (s.style === 'none' || s.width !== '2px' || s.color !== 'rgb(45, 79, 209)') p.push(`focus ring ${s.style} ${s.width} ${s.color}`);
    });
  });
  await check('O1', 'Open overlays (dialogs, drawers, popovers, the More menu) pass axe-core at 1440 and 320 CSS px; Escape closes each and returns focus to its trigger', async (p) => {
    for (const width of [1440, 320]) {
      for (const [pth, name] of OVERLAYS) {
        await withPage(`${base}${pth}`, { viewport: { width, height: width === 320 ? 720 : 900 } }, async (page) => {
          const found = await auditOverlay(page, name);
          if (!found.includes('nothing opened')) found.push(...(await dismissOverlayProblems(page)));
          for (const v of found) p.push(`${width}px ${pth} "${name}": ${v}`);
        });
      }
    }
  });
  await check('U1', 'Status is never colour alone: every visible status badge, alert and field error has an icon and text', async (p) => {
    const pages = ['/components/status-badge', '/components/alert', '/components/field', '/components/table'];
    let count = 0;
    for (const pth of pages) {
      await withPage(`${base}${pth}`, {}, async (page) => {
        const r = await statusCueProblems(page);
        count += r.count;
        if (!r.count) p.push(`${pth}: no status element found`);
        for (const x of r.problems) p.push(`${pth}: ${x}`);
      });
    }
    if (count < 10) p.push(`only ${count} status elements checked`);
  });
  await check('K1', 'No keyboard trap: Tab moves focus on every component page (60 presses from the top, 1440 px)', async (p) => {
    const pages = paths.filter((x) => x.startsWith('/components/'));
    if (!pages.length) p.push('no component pages to walk');
    await pool(pages, 4, async (pth) => {
      await withPage(`${base}${pth}`, {}, async (page) => {
        for (const x of await keyboardTrapProblems(page)) p.push(`${pth}: ${x}`);
      });
    });
  });
  return out;
}

async function pool(items, n, fn) {
  const results = [];
  let i = 0;
  await Promise.all(Array.from({ length: n }, async () => { while (i < items.length) { const k = i++; results[k] = await fn(items[k]); } }));
  return results;
}

async function main() {
  const arg = (k) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
  const capture = arg('--capture');
  const only = arg('--pages') ? new RegExp(arg('--pages')) : null;
  const tokensTs = fs.readFileSync(path.join(ROOT, 'packages/foundation/src/lib/tokens/token-catalogue.generated.ts'), 'utf8');
  const tokens = [...tokensTs.matchAll(/^ {2}(\{.*\})/gm)].map((m) => JSON.parse(m[1]));
  const server = await serve();
  const browser = await launch();
  const started = Date.now();
  const report = { browser: `${browser.version()}`, axe: JSON.parse(fs.readFileSync(path.join(ROOT, 'node_modules/axe-core/package.json'), 'utf8')).version, pages: [], checks: [] };
  let failed = 0;
  try {
    let paths = await discover(browser, server.url);
    if (only) paths = paths.filter((x) => only.test(x));
    const jobs = paths.flatMap((pth) => VIEWPORTS.flatMap((vp) => ['ltr', 'rtl'].map((dir) => ({ pth, vp, dir }))));
    if (capture) fs.mkdirSync(capture, { recursive: true });
    const res = await pool(jobs.map((j, k) => ({ ...j, n: k + 1 })), 4, async ({ pth, vp, dir, n }) => {
      const tr = tracer(n, jobs.length, pth, vp.name, dir);
      tr.log('start');
      const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
      try {
        const { page, errors } = await open(ctx, `${server.url}${pth}${dir === 'rtl' ? '?dir=rtl' : ''}`, tr.log);
        tr.log('audit-start');
        const problems = await auditPage(page, errors);
        if (capture && dir === 'ltr') await page.screenshot({ path: path.join(capture, `${(pth.replace(/^\/|\/$/g, '') || 'home').replace(/\//g, '--')}--${vp.name}.png`), fullPage: true });
        tr.log(`end (${problems.length} problems)`);
        return { page: pth, viewport: vp.name, dir, problems };
      } catch (e) {
        const at = tr.phase();
        tr.log(`failed during ${at}: ${e.message.split('\n')[0]}`);
        return { page: pth, viewport: vp.name, dir, problems: [`error during ${at}: ${e.message}`] };
      } finally { await ctx.close(); }
    });
    report.pages = res;
    if (capture && !only) {
      // Open-overlay captures (viewport only) for comparison with the handoff's dialog, drawer and popover renders.
      for (const vp of VIEWPORTS) {
        for (const [pth, name] of OVERLAYS) {
          const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
          try {
            const { page } = await open(ctx, `${server.url}${pth}`);
            await auditOverlay(page, name);
            const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
            await page.screenshot({ path: path.join(capture, `overlay--${pth.split('/').pop()}--${slug}--${vp.name}.png`) });
          } finally { await ctx.close(); }
        }
      }
    }
    for (const r of res) {
      console.log(`${r.problems.length ? 'FAIL' : 'PASS'} ${r.page} ${r.viewport} ${r.dir}${r.problems.length ? `\n    ${r.problems.join('\n    ')}` : ''}`);
      if (r.problems.length) failed++;
    }
    console.log(`\npages: ${paths.length}; page audits: ${res.length}; failed: ${failed}`);
    if (!only) {
      process.stderr.write('[a11y-trace] global checks start\n');
      report.checks = await globalChecks(browser, server.url, tokens, paths);
      process.stderr.write('[a11y-trace] global checks end\n');
      for (const c of report.checks) {
        console.log(`${c.problems.length ? 'FAIL' : 'PASS'} ${c.id} ${c.name}${c.problems.length ? ` — ${c.problems.join('; ')}` : ''}`);
        if (c.problems.length) failed++;
      }
      if (paths.length < 40) { console.log(`FAIL coverage: only ${paths.length} laboratory pages discovered`); failed++; }
    }
  } finally {
    await browser.close();
    await server.close();
  }
  report.durationSeconds = Math.round((Date.now() - started) / 1000);
  report.result = failed ? 'FAIL' : 'PASS';
  if (arg('--json')) fs.writeFileSync(arg('--json'), `${JSON.stringify(report, null, 2)}\n`);
  console.log(`\nPAEP accessibility and responsive QA: ${report.result} (${report.durationSeconds}s, Chromium ${report.browser}, axe-core ${report.axe})`);
  process.exit(failed ? 1 : 0);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main().catch((e) => { console.error(e); process.exit(1); });
