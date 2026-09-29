/**
 * Locates an already-installed Chrome/Chromium for tests (no browser is ever downloaded; IB2 dependency
 * approval). Order: CHROME_BIN, the GitHub runner's Chrome, common system paths, a pre-provisioned
 * Playwright Chromium (PLAYWRIGHT_BROWSERS_PATH/chromium).
 */
import fs from 'node:fs';
import path from 'node:path';

export function findChrome() {
  const candidates = [
    process.env.CHROME_BIN,
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
    process.env.PLAYWRIGHT_BROWSERS_PATH && path.join(process.env.PLAYWRIGHT_BROWSERS_PATH, 'chromium'),
    '/opt/pw-browsers/chromium',
  ].filter(Boolean);
  for (const c of candidates) {
    try {
      if (fs.statSync(c).isFile()) return c;
    } catch {
      /* try the next candidate */
    }
  }
  throw new Error(`no installed Chrome/Chromium found (set CHROME_BIN); tried: ${candidates.join(', ')}`);
}
