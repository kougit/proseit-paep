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
 * and once per run:
 *   N1 the never-hidden set (navigation, product, search, notifications with count, account, page h1) is present and
 *      inside the viewport at 320 and 320×256, and the account menu reaches Sign out there
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
 * and first, on the build itself:
 *   B1 initial bundle budget (AC-IB3-15, DDR-IB3-07 ACCEPTED 2026-10-07): the initial files (named by index.html
 *      and every script they import statically, followed recursively), raw
 *      bytes at most 525 000 and Brotli bytes (the CLI's estimated transfer size) at most 150 000, fail-closed on the
 *      exact byte counts, never rounded. 500 kB raw stays the engineering target and is reported, not enforced here
 *      (the Angular budget warns above it).
 *   node tooling/enterprise-shell/shell-qa.mjs [--capture <dir>] [--json <file>]
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import zlib from 'node:zlib';
import { axeViolations, launch, serve } from '../design-system/browser-qa.mjs';

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
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForSelector('main h1', { timeout: 15000 });
  if (dir === 'rtl') await page.evaluate(() => { document.documentElement.setAttribute('dir', 'rtl'); document.documentElement.setAttribute('lang', 'ar'); });
  await settle(page);
  return { page, errors };
}

/** H1-H4 on an open page. `report` allows the default reporter's one console line. */
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
  if (axe) for (const v of await axeViolations(page)) p.push(`H4 axe ${v}`);
  return p;
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
  const server = await serve(DIST);
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
    results.push({ id: 'H', name: `H1-H4 shell states: ${ran.length} state × viewport × direction combinations (axe at 1440, 834, 640 and 320)`, problems: ran.flatMap((s) => s.problems.map((x) => `${s.id}: ${x}`)) });

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
        await ctx.close();
      }
    }
    results.push({ id: 'N1', name: 'Never-hidden set (incl. notifications with count and account with sign-out) present and inside the viewport at 320 and 320×256 (LTR and RTL)', problems: n1 });
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
          if (act && !(await act(page))) continue;
          a1.push(...(await labelInNameProblems(page)).map((x) => `${vp[0]}${act ? `/${act.name}` : ''}: ${x}`));
        } finally {
          await ctx.close();
        }
      }
    }
    results.push({ id: 'A1', name: 'Label in name (WCAG 2.5.3): controls named by aria-label include their visible text (1440, 834, 320; chrome, sheet, notifications, account and language menus)', problems: [...new Set(a1)] });
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
