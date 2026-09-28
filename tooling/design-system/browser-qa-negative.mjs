#!/usr/bin/env node
/**
 * Negative suite for the IB2 browser gate (npm run qa:accessibility:negative). Each case injects one defect into
 * a served ui-lab page and requires auditPage() or the protected-token check to report it; a positive control
 * requires the unmutated page to pass. Proves the gate can fail: axe violations, overflow, console errors,
 * heading/landmark structure, a brand override of a protected token, and O1: a defect inside an open overlay,
 * and an overlay that fails to open; K1: a keyboard trap; M1: a motion duration left running under reduced motion.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { auditOverlay, auditPage, keyboardTrapProblems, launch, open, reducedMotionProblems, serve } from './browser-qa.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const tokens = [...fs.readFileSync(path.join(ROOT, 'packages/foundation/src/lib/tokens/token-catalogue.generated.ts'), 'utf8').matchAll(/^ {2}(\{.*\})/gm)].map((m) => JSON.parse(m[1]));

const inject = (fn) => async (page) => page.evaluate(fn);
const cases = [
  ['B00', 'positive control: unmutated button page', null, null],
  ['B01', 'image without a text alternative', inject(() => document.querySelector('main').insertAdjacentHTML('beforeend', '<img src="favicon.svg">')), /A1 axe image-alt/],
  ['B02', 'button without an accessible name', inject(() => document.querySelector('main').insertAdjacentHTML('beforeend', '<button type="button"></button>')), /A1 axe button-name/],
  ['B03', 'text below contrast minimum', inject(() => document.querySelector('main').insertAdjacentHTML('beforeend', '<p style="color: rgb(200 200 200)">Low contrast text</p>')), /A1 axe color-contrast/],
  ['B04', 'form control without a label', inject(() => document.querySelector('main').insertAdjacentHTML('beforeend', '<input type="text">')), /A1 axe label/],
  ['B05', 'fixed-width element forcing page overflow at 320 px', inject(() => document.querySelector('main').insertAdjacentHTML('beforeend', '<div style="inline-size: 900px">Wide</div>')), /A2 horizontal overflow/],
  ['B06', 'runtime console error', inject(() => console.error('injected failure')), /A3 console: injected failure/],
  ['B07', 'second h1', inject(() => document.querySelector('main').insertAdjacentHTML('beforeend', '<h1>Second</h1>')), /A4 2 h1 elements/],
  ['B08', 'brand profile overriding a protected status token', 'protected', /--paep-color-status-error-fg/],
  ['B09', 'O1: unnamed button inside an open dialog', ['/components/dialog', 'Delete Record 1', () => document.querySelector('dialog[open]').insertAdjacentHTML('beforeend', '<button type="button"></button>')], /button-name/],
  ['B10', 'O1: overlay trigger that opens nothing', ['/components/dialog', 'Delete Record 1', null, true], /nothing opened/],
  ['B11', 'K1: control that swallows Tab (keyboard trap)', 'trap', /K1 keyboard trap/],
  ['B12', 'M1: motion duration left at 150 ms under reduced motion', 'motion', /--paep-motion-duration-base = 150ms/],
];

const server = await serve();
const browser = await launch();
let failures = 0;
try {
  for (const [id, label, mutate, expect] of cases) {
    const ctx = await browser.newContext({ viewport: { width: 320, height: 720 } });
    try {
      const overlay = Array.isArray(mutate) ? mutate : null;
      const { page, errors } = await open(ctx, `${server.url}${overlay ? overlay[0] : '/components/button'}`);
      let problems;
      if (mutate === 'trap') {
        await page.evaluate(() => {
          document.querySelector('main').insertAdjacentHTML('afterbegin', '<button type="button" id="k1-trap">Trap</button>');
          document.getElementById('k1-trap').addEventListener('keydown', (e) => { if (e.key === 'Tab') e.preventDefault(); });
        });
        problems = await keyboardTrapProblems(page);
      } else if (mutate === 'motion') {
        await page.emulateMedia({ reducedMotion: 'reduce' });
        await page.goto(`${server.url}/foundations/motion`, { waitUntil: 'networkidle' });
        await page.addStyleTag({ content: ':root { --paep-motion-duration-base: 150ms !important; }' });
        problems = await reducedMotionProblems(page, tokens);
      } else if (overlay) {
        // B10 removes the dialog element first, so pressing its trigger can open nothing.
        if (overlay[3]) await page.evaluate(() => document.querySelectorAll('paep-dialog').forEach((d) => d.remove()));
        problems = await auditOverlay(page, overlay[1], overlay[2]);
      } else if (mutate === 'protected') {
        await page.evaluate(() => document.documentElement.style.setProperty('--paep-color-status-error-fg', '#FF0000'));
        problems = [];
        for (const t of tokens.filter((x) => x.protected)) {
          const v = await page.evaluate((n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim(), t.name);
          if (v.replace(/\s+/g, ' ').toLowerCase() !== t.value.toLowerCase()) problems.push(`${t.name} = ${v}`);
        }
      } else {
        if (mutate) await mutate(page);
        await page.waitForTimeout(50);
        problems = await auditPage(page, errors);
      }
      const ok = expect ? problems.some((p) => expect.test(p)) : problems.length === 0;
      if (!ok) failures++;
      console.log(`${ok ? 'PASS' : 'FAIL'} ${id} ${label}${ok ? '' : ` — reported: ${problems.join(' | ').slice(0, 300) || 'nothing'}`}`);
    } finally { await ctx.close(); }
  }
} finally {
  await browser.close();
  await server.close();
}
console.log(`\nPAEP accessibility negative suite: ${failures ? 'FAIL' : 'PASS'} (${cases.length - failures}/${cases.length})`);
process.exit(failures ? 1 : 0);
