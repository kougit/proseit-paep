/* Reference-only annotation for SCR-SHELL-020: numbers every visible focusable element in DOM (Tab) order. */
(function () {
  var sel = 'a[href],button:not([disabled]),input,select,textarea,[tabindex]:not([tabindex="-1"])';
  var n = 0, placed = [];
  document.querySelectorAll(sel).forEach(function (el) {
    var r = el.getBoundingClientRect(), cs = getComputedStyle(el);
    if (!r.width || !r.height || cs.visibility === 'hidden') return;
    if (r.top > window.innerHeight * 3) return;
    n++;
    var b = document.createElement('span');
    b.className = 'fo'; b.setAttribute('aria-hidden', 'true'); b.textContent = n;
    // badge sits on the element's top inline-end corner so it does not cover the start of the label
    var x = Math.min(r.right + window.scrollX - 10, document.documentElement.clientWidth - 20), y = Math.max(r.top + window.scrollY - 16, 0);
    if (el.classList.contains('paep-skip-link')) { x = 0; y = 0; }
    while (placed.some(function (p) { return Math.abs(p[0] - x) < 20 && Math.abs(p[1] - y) < 20; })) x -= 20;
    placed.push([x, y]);
    b.style.position = 'absolute'; b.style.top = y + 'px'; b.style.left = x + 'px'; b.style.zIndex = 90; b.style.minInlineSize = '18px'; b.style.blockSize = '18px'; b.style.fontSize = '11px';
    document.body.appendChild(b);
  });
})();
