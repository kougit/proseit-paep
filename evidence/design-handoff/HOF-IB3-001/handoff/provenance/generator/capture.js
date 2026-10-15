// HOF-IB3-001 render capture + structural checks (Playwright from the environment's global install; no project dependency).
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const fs = require('fs'), path = require('path');
const dir = process.argv[2], out = process.argv[3], plan = JSON.parse(fs.readFileSync(process.argv[4]));
const VP = {desktop:[1440,900], desktop1024:[1024,768], tablet:[834,1112], zoom200:[640,900], narrow375:[375,740], narrow320:[320,640], short320x256:[320,256]};
(async () => {
  const b = await chromium.launch({executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});
  const res = [];
  for (const s of plan) {
    for (const vp of s.viewports) {
      const [w, h] = VP[vp];
      const ctx = await b.newContext({viewport: {width: w, height: h}, reducedMotion: s.reduced ? 'reduce' : 'no-preference'});
      const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(String(e)));
      await p.goto('file://' + path.resolve(dir, s.file)); await p.waitForTimeout(120);
      const m = await p.evaluate(() => {
        const de = document.documentElement, vw = de.clientWidth;
        const vis = el => { const r = el.getBoundingClientRect(); const cs = getComputedStyle(el); return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none'; };
        const inert = el => !!el.closest('.shell-sr,.vh,[aria-hidden=true]');
        const offscreen = [], small = [], unnamed = [];
        document.querySelectorAll('button,a[href],input,select,textarea,[role=option],[tabindex]:not([tabindex="-1"])').forEach(el => {
          if (!vis(el) || inert(el)) return; const r = el.getBoundingClientRect();
          let n = el, clipped = false; while (n && n !== document.body) { const cs = getComputedStyle(n); if (/(auto|scroll|hidden)/.test(cs.overflowX) && n.scrollWidth > n.clientWidth) { clipped = true; break } n = n.parentElement }
          if (!clipped && (r.right > vw + 1 || r.left < -1)) offscreen.push((el.getAttribute('aria-label') || el.textContent || el.tagName).trim().slice(0, 40));
          let t = el; if (el.matches('input[type=checkbox],input[type=radio]')) t = el.closest('label') || el;
          const rr = t.getBoundingClientRect(); const inlineLink = el.tagName === 'A' && getComputedStyle(el).display === 'inline';
          if ((rr.height < 23.5 || rr.width < 23.5) && !inlineLink && !el.closest('.board table')) small.push((el.getAttribute('aria-label') || el.textContent || el.tagName).trim().slice(0, 30) + ' ' + Math.round(rr.width) + 'x' + Math.round(rr.height));
          const name = (el.getAttribute('aria-label') || el.getAttribute('aria-labelledby') || el.textContent || el.getAttribute('value') || el.getAttribute('placeholder') || (el.closest('label') ? el.closest('label').textContent : '') || '').trim();
          if (!name && !el.id) unnamed.push(el.outerHTML.slice(0, 60));
        });
        const landmarks = {banner: document.querySelectorAll('header.shell-topbar,[role=banner]').length, main: document.querySelectorAll('main').length,
          nav: [...document.querySelectorAll('nav[aria-label]')].filter(vis).length, search: document.querySelectorAll('search').length};
        const h1 = [...document.querySelectorAll('h1')].filter(vis).length;
        return {scrollWidth: de.scrollWidth, clientWidth: vw, offscreen: offscreen.slice(0, 5), nOffscreen: offscreen.length, smallTargets: small.slice(0, 5), nSmall: small.length, unnamed: unnamed.slice(0,3), landmarks, visibleH1: h1};
      });
      const shot = `${out}/${s.file.replace('.html', '')}--${vp}.png`;
      await p.screenshot({path: shot, fullPage: !!s.full});
      res.push({screen: s.sid, state: s.state, file: s.file, viewport: vp, width: w, height: h, reducedMotion: !!s.reduced, ...m, pageErrors: errs, hScroll: m.scrollWidth > m.clientWidth, render: path.basename(shot)});
      await ctx.close();
    }
  }
  fs.writeFileSync(process.argv[5], JSON.stringify(res, null, 1));
  await b.close();
})();
