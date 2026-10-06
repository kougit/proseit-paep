# HOF-IB3-001 review boards: SCR-SHELL-019 (built after capture), 020, 021, 023.
import json, os
import compose as S, icons as I
from compose import esc, ic, doc
from contrast import cr
from keys import k

def tbl(head, rows, cap):
    th = ''.join(f'<th scope="col">{esc(h)}</th>' for h in head)
    tr = ''.join('<tr>' + ''.join(f'<td>{c}</td>' for c in r) + '</tr>' for r in rows)
    return f'<div class="tbl" tabindex="0" role="region" aria-label="{esc(cap)}"><table><caption class="vh">{esc(cap)}</caption><thead><tr>{th}</tr></thead><tbody>{tr}</tbody></table></div>'

def board(title, intro, body, lang='en', dirv='ltr'):
    return doc(title + ' — HOF-IB3-001', f'<main class="board" id="main"><h1>{esc(title)}</h1><p>{intro}</p>{body}</main>', lang=lang, dirv=dirv, body_class='shell-body')

RING, HALO = '#2D4FD1', '#FFFFFF'
SURF = [('Topbar (light, recommended Q-01)', '#FFFFFF'), ('Navigation surface', '#FFFFFF'), ('Current navigation item (selected-bg)', '#E7ECF2'),
        ('Page background', '#EFF2F5'), ('Search trigger / context button (surface-subtle)', '#F7F8FA'), ('Status strip: warning', '#FDF1DC'),
        ('Status strip: info (impersonation)', '#E7EFFA'), ('Status strip: neutral', '#EFF2F5'), ('Status strip: error', '#FCEBE9'), ('Palette option selected', '#E7ECF2'),
        ('Q-01 alternative: Navy topbar (#24364B)', '#24364B')]

def contrast_rows():
    rows = []
    for name, bg in SURF:
        r = cr(RING, bg); h = cr(HALO, bg)
        ok = r >= 3 or (h >= 3 and cr(RING, HALO) >= 3)
        rows.append([esc(name), f'<code>{bg}</code>', f'{r:.2f}:1', f'{h:.2f}:1', 'PASS (ring)' if r >= 3 else (f'PASS via white halo only (ring-to-halo {cr(RING, HALO):.2f}:1); ring itself below 3:1' if ok else 'FAIL')])
    return rows

def b020():
    lm = tbl(['Region', 'Landmark / role', 'Accessible name'], [
        ['SHELL-REGION-SKIPLINK', 'link, first in tab order', '“Skip to main content” (paep.shell.skipLink.main)'],
        ['SHELL-REGION-BANNER', '<code>header</code> → banner (one)', '—'],
        ['SHELL-REGION-SEARCH', '<code>search</code>', 'trigger “Search or go to…”'],
        ['SHELL-REGION-NAV', '<code>nav</code>', '“Primary”'],
        ['SHELL-REGION-STATUS', 'region + <code>role=status</code>', '“Status”'],
        ['SHELL-REGION-MAIN', '<code>main</code> (one, projected from the app), tabindex −1', '—'],
        ['Breadcrumb', '<code>nav</code>', '“Breadcrumb”'],
        ['SHELL-REGION-ASIDE', '<code>aside</code>', 'labelled by its heading'],
        ['SHELL-REGION-LIVE', 'two visually hidden live regions (polite, assertive)', '—']], 'Landmark map')
    order = tbl(['#', 'Stop (≥ 1024 px)', 'Stop (< 600 px)'], [
        ['1', 'Skip to main content', 'Skip to main content'], ['2', 'Product home link', 'Open navigation'], ['3', 'Context button (switch, when offered)', 'Product home link (mark)'],
        ['4', 'Search trigger (Ctrl/⌘ K, Q-12)', 'Search'], ['5', 'Language (only with more than one locale, X-05)', 'Notifications'], ['6', 'Help', 'Account (help and language move into this menu)'],
        ['7', 'Notifications', 'Status strip action (if any)'], ['8', 'Account', 'main: breadcrumb, page actions, content'], ['9', 'Status strip action (if any)', '—'],
        ['10', 'Collapse navigation', '—'], ['11…', 'Navigation groups and links, in manifest order', '—'], ['then', 'main: breadcrumb, page actions, toolbar, content, aside', '—']], 'Focus order')
    rest = tbl(['Surface', 'Focus on open', 'Focus on close / completion'], [
        ['Mobile navigation container (modal, Q-09)', 'current item link, else first link', 'the Open navigation button; after following a link: the new page <code>h1</code>'],
        ['Command palette (modal)', 'combobox input', 'the trigger that opened it; after choosing a destination: new page <code>h1</code>; after an action: the element the action names'],
        ['Menus (account, help, page “More”)', 'first menu item (Enter/Space/↓) or last (↑)', 'the menu button (Escape, selection); Tab closes and continues'],
        ['Notification panel (non-modal dialog, Q-04)', 'panel heading', 'the bell button (Escape, close); following a link: new page <code>h1</code>'],
        ['Context switch dialog', 'first radio (current context)', 'context button; after a successful switch: <code>h1</code> of the re-loaded page'],
        ['Collapsed-rail flyout (disclosure of links)', 'stays on the group button; Tab enters the links', 'group button (Escape); following a link: new page <code>h1</code>'],
        ['Route change', '—', '<code>h1</code> (tabindex −1) + polite “{title} page” announcement'],
        ['Error boundary', '—', 'error heading (<code>h1</code>, role alert once); Try again returns focus to the re-rendered <code>h1</code>'],
        ['Collapse / expand navigation', '—', 'stays on the same toggle (name flips)']], 'Focus restoration')
    keys = tbl(['Area', 'Keys'], [
        ['Navigation', 'Tab / Shift+Tab between links and group buttons; Enter/Space toggles a group (<code>aria-expanded</code>); links follow on Enter. No roving arrow keys (links stay links).'],
        ['Collapsed rail', 'Tab to a group button (disclosure, <code>aria-expanded</code>); Enter/Space opens its flyout of links, positioned on the governed base; Tab moves into the links; Escape closes and returns focus to the group button.'],
        ['Menus (governed base, SCR-SHELL-023)', 'Enter/Space/↓ open on first item, ↑ on last; ↑/↓ move, Home/End first/last, type-ahead; Enter activates; Escape closes → button; Tab closes and continues.'],
        ['Language (X-05 B)', 'At ≥ 600 px the topbar language button (name “Language: {language}”) is a menu button on the governed base; below 600 px the same <code>menuitemradio</code> group is inside the account menu. ↑/↓ move; Enter/Space chooses one (request to the app), the menu closes, focus returns to the button that opened it; polite “Language changed to {language}”.'],
        ['Command palette', 'Ctrl/⌘ K or the visible trigger opens; typing filters; ↑/↓ move the active option (<code>aria-activedescendant</code>); Enter opens; Escape clears, then closes. No single-character shortcuts (WCAG 2.1.4).'],
        ['Mobile navigation container', 'Tab cycles inside (modal); Escape closes; scrim click closes.'],
        ['Notification panel', 'Tab into the list; links are ordinary links; Escape closes → bell.']], 'Key maps')
    live = tbl(['Event', 'Region', 'Rule'], [
        ['Route change', 'polite', '“{title} page”, once'], ['Palette result count', 'polite', 'after typing pauses; not per keystroke'],
        ['Notification count change', 'polite', 'only when it increases; batched'], ['Connectivity change', 'polite (status strip role=status)', 'on state change only'],
        ['Blocking error (error boundary)', 'assertive (role=alert)', 'once per error'], ['Session expiring', 'polite', 'once, at the threshold the host gives']], 'Live-region plan')
    spec = ''.join(f'<div class="specimen-card" style="background:{bg}"><h3 style="color:{"#FFFFFF" if bg=="#24364B" else "inherit"}">{esc(n)}</h3><button type="button" class="paep-button paep-button--secondary is-focus">Focused control</button></div>' for n, bg in SURF)
    body = ('<h2>Landmarks</h2>' + lm + '<h2>Focus order</h2>' + order + '<h2>Focus restoration</h2>' + rest + '<h2>Key maps</h2>' + keys + '<h2>Live regions</h2>' + live +
            '<h2>Focus visible on every chrome surface</h2><p>The accepted ring is 2 px <code>--paep-color-focus-ring</code> (#2D4FD1) with a 2 px white halo. Contrast of the ring and the halo against each surface:</p>' +
            tbl(['Surface', 'Background', 'Ring : surface', 'Halo : surface', 'Result (≥ 3:1)'], contrast_rows(), 'Focus contrast') + '<div class="specimens" style="margin-block-start:var(--paep-space-4)">' + spec + '</div>')
    return board('SCR-SHELL-020 Keyboard and focus maps', 'Landmarks, focus order, focus restoration, key maps, live regions and focus visibility for every interactive shell area. Behaviour follows WAI-ARIA APG patterns as specifications, not as visual references.', body)

def b021():
    rows = [['Mobile navigation container open/close', 'inline slide, <code>--paep-motion-duration-moderate</code> 200 ms, easing enter/exit', 'appears/disappears instantly; scrim fades 0 ms'],
            ['Navigation collapse / expand', 'grid column change, <code>--paep-motion-duration-base</code> 150 ms', 'instant'],
            ['Group disclosure', 'height reveal 150 ms', 'instant'],
            ['Menus, flyouts, notification panel', 'fade + 4 px offset, <code>--paep-motion-duration-fast</code> 90 ms', 'instant; no offset'],
            ['Command palette', 'fade + scale 0.98→1, 150 ms', 'instant'],
            ['Busy spinner', 'rotation <code>--paep-motion-loop-spinner</code>', 'static glyph (<code>--paep-motion-loop-state: paused</code>) + text'],
            ['Skeleton', 'pulse <code>--paep-motion-loop-skeleton-pulse</code>', 'static'],
            ['Status strip appearance', 'none (layout change only)', 'none'],
            ['Route change', 'no page transition animation', 'none']]
    body = tbl(['Transition', 'Default', 'prefers-reduced-motion: reduce'], rows, 'Motion') + '<p class="review-note">The renders SCR-SHELL-021--nav-open-reduced and --palette-reduced are captured with reduced motion on. Motion tokens are the accepted IB2 tokens; no new motion token is proposed.</p>'
    return board('SCR-SHELL-021 Reduced-motion board', 'Every shell transition and its reduced-motion behaviour.', body)

HV = ' class="is-hover"'
def menu(items, extra_style='', rtl=False):
    li = ''.join(f'<li role="none"><button type="button" role="menuitem"{HV if i==0 else ""}>{esc(t)}</button></li>' for i, t in enumerate(items))
    return f'<ul class="paep-menu" role="menu" style="position:absolute;{extra_style}">{li}</ul>'

def b023():
    def stage(title, note, inner, dirv='ltr', h='15rem'):
        return f'<div class="specimen-card"><h3>{esc(title)}</h3><div class="stage-rel" dir="{dirv}" style="min-block-size:{h}">{inner}</div><p class="t-body-sm t-secondary" style="margin:var(--paep-space-2) 0 0">{note}</p></div>'
    btn = lambda label, style, exp=True: f'<button type="button" class="paep-button paep-button--secondary" aria-haspopup="menu" aria-expanded="{"true" if exp else "false"}" style="position:absolute;{style}">{esc(label)} {ic("chevron-down","sm")}</button>'
    items = ['Display preferences', 'Change language', 'Sign out']
    sp = [
        stage('Inline-start alignment (existing PaepPopover behaviour)', 'Menu edge aligns to the trigger’s inline-start edge; opens on the block-end side.',
              btn('Actions', 'inset-block-start:.75rem;inset-inline-start:.75rem') + menu(items, 'inset-block-start:3.5rem;inset-inline-start:.75rem')),
        stage('Inline-end alignment (extension; design intent approved, Q-02)', 'Topbar menus and page “More” align to the trigger’s inline-end edge so they stay inside the viewport at the end of a bar.',
              btn('Account', 'inset-block-start:.75rem;inset-inline-end:.75rem') + menu(items, 'inset-block-start:3.5rem;inset-inline-end:.75rem')),
        stage('Collision: flip to block-start', 'Not enough room below → opens above; alignment is kept.',
              btn('More', 'inset-block-end:.75rem;inset-inline-start:.75rem') + menu(items, 'inset-block-end:3.5rem;inset-inline-start:.75rem')),
        stage('Collision: shift along the inline axis', 'Start-aligned menu would cross the inline-end edge → shifted to keep the accepted 16 px viewport margin (RD-01); never clipped.',
              btn('Filter', 'inset-block-start:.75rem;inset-inline-end:2rem', True) + menu(items, 'inset-block-start:3.5rem;inset-inline-end:1rem')),
        stage('RTL: inline-start', 'Logical alignment: in RTL, “start” is the right edge.', btn('إجراءات', 'inset-block-start:.75rem;inset-inline-start:.75rem') + menu(['تفضيلات العرض', 'تغيير اللغة', 'تسجيل الخروج'], 'inset-block-start:3.5rem;inset-inline-start:.75rem'), 'rtl'),
        stage('RTL: inline-end', 'In RTL, “end” is the left edge; the account menu sits at the left end of the topbar.', btn('الحساب', 'inset-block-start:.75rem;inset-inline-end:.75rem') + menu(['تفضيلات العرض', 'تغيير اللغة', 'تسجيل الخروج'], 'inset-block-start:3.5rem;inset-inline-end:.75rem'), 'rtl'),
        stage('Mobile (< 600 px)', 'Same base; max inline size = viewport − 2 × 16 px (RD-01); long items wrap; target height ≥ 40 px. No bottom sheet (fewer patterns).',
              btn('Account', 'inset-block-start:.75rem;inset-inline-end:1rem') + menu(['Display preferences', 'Change language (English)', 'Help', 'Sign out'], 'inset-block-start:3.5rem;inset-inline-end:1rem;inset-inline-start:1rem;max-inline-size:none'), 'ltr', '17rem'),
        stage('Action-group overflow rebuilt on the base (Q-02)', 'Page “More” uses the same base with inline-end alignment, replacing the separate popover="manual" menu (DDR-02) with no behaviour loss (table below).',
              f'<div style="position:absolute;inset-block-start:.75rem;inset-inline-end:.75rem;display:flex;gap:.5rem"><button type="button" class="paep-button paep-button--primary">New record</button><button type="button" class="paep-button paep-button--tertiary paep-icon-button" aria-label="More actions" aria-haspopup="menu" aria-expanded="true">{ic("more")}</button></div>' + menu(['Assign owner', 'Duplicate', 'Archive'], 'inset-block-start:3.5rem;inset-inline-end:.75rem')),
    ]
    kb = tbl(['Key', 'On the menu button', 'In the menu'], [['Enter / Space', 'open, focus first item', 'activate item, close, focus returns to button (or moves per the action)'], ['↓ / ↑', 'open on first / last item', 'next / previous item (wraps)'],
         ['Home / End', '—', 'first / last item'], ['Printable character', '—', 'type-ahead to the next matching item'], ['Escape', '—', 'close, focus to the button'], ['Tab / Shift+Tab', '—', 'close and move focus in page order'], ['Enter / Space on a <code>menuitemradio</code>', '—', 'checks that item (<code>aria-checked</code>), unchecks the others in its group, closes the menu']], 'Menu keyboard map')
    dis = tbl(['Dismissal', 'Behaviour'], [['Escape', 'closes the top-most menu only'], ['Pointer down outside', 'closes (platform popover="auto" light dismiss); the outside target still receives the pointer event'],
          ['Focus leaves (Tab)', 'closes'], ['Opening another shell menu', 'closes the first (one open menu at a time)'], ['Route change', 'closes all menus'], ['Scroll / resize', 'repositions; closes only if the trigger leaves the viewport']], 'Dismissal')
    parity = tbl(['Action-group overflow today (DDR-02)', 'On the governed base', 'Parity'], [
        ['<code>popover="manual"</code> + document pointerdown listener', '<code>popover="auto"</code> light dismiss', 'same outcome; less custom code'],
        ['Items generated from projected buttons at open; activation runs the original button', 'unchanged (collection stays in the action group)', 'kept'],
        ['Menu aligned to More’s inline-end', 'base option <code>align="end"</code>', 'kept'],
        ['Key map: ↑ opens on last, Enter on first, Escape → More, Tab closes', 'base menu key map (same)', 'kept'],
        ['Divider before destructive item, elevation-3, radius-md', 'same tokens', 'kept']], 'Parity')
    api = tbl(['Option (components, D2; design intent approved, Q-02)', 'Values', 'Default'], [['align', '<code>start</code> | <code>end</code> (logical)', 'start (today’s behaviour)'], ['side', '<code>block-end</code>, auto-flip to <code>block-start</code>', 'block-end'],
          ['shift', 'keeps the accepted 16 px viewport margin on the inline axis (RD-01; Gen-4 behaviour unchanged)', 'on'], ['variant', '<code>info</code> | <code>menu</code> (both existing); PROPOSED for <code>menu</code>: type-ahead, Home/End, link items (<code>a role=menuitem</code>), <code>menuitemradio</code> groups and one open menu at a time', 'info'], ['maxInlineSize', 'min(20 rem, 100% − 2 × --paep-space-4) (accepted Gen-4 value)', '—']], 'Proposed options')
    body = '<div class="specimens">' + ''.join(sp) + '</div><h2>Keyboard</h2>' + kb + '<h2>Dismissal</h2>' + dis + '<h2>Action-group overflow parity</h2>' + parity + '<h2>PaepPopover options (approved design intent)</h2>' + api
    return board('SCR-SHELL-023 Governed menu / positioning base (DDR-02)', 'One reusable base for every shell menu: the extension of <code>PaepPopover</code> (design intent approved by the PO/SA, Q-02) with logical inline-end alignment. Used by the account, help and page “More” menus, the collapsed-rail flyout and (Q-02) the rebuilt action-group overflow. No third <code>popover="manual"</code> implementation exists in enterprise.', body)

def build():
    out = []
    for sid, st, title, html, vps in [('SCR-SHELL-020', 'maps', 'Keyboard / focus maps and focus visibility', b020(), ['desktop', 'narrow320']),
                                      ('SCR-SHELL-021', 'board', 'Reduced-motion board', b021(), ['desktop', 'narrow320']),
                                      ('SCR-SHELL-023', 'board', 'Governed menu/positioning base', b023(), ['desktop', 'tablet', 'zoom200', 'narrow320'])]:
        out.append(dict(sid=sid, state=st, file=f'{sid}--{st}.html', html=html, viewports=vps, full=True, title=title, reduced=False, note=''))
    return out

def board019(results, screens_dir):
    rows = [r for r in results if r['viewport'] == 'narrow320']
    cards = ''.join(f'<figure class="specimen-card" style="margin:0"><img src="renders/{esc(r["render"])}" alt="{esc(r["screen"])} {esc(r["state"])} at 320 CSS px" style="inline-size:100%;max-block-size:22rem;object-fit:cover;object-position:top;border:1px solid var(--paep-color-border-subtle)"><figcaption class="t-body-sm"><strong>{esc(r["screen"])}</strong> {esc(r["state"])}<br>scrollWidth {r["scrollWidth"]} / {r["clientWidth"]} · {"no page-wide scroll" if not r["hScroll"] else "PAGE-WIDE SCROLL"} · off-screen controls {r["nOffscreen"]}</figcaption></figure>' for r in rows)
    n_bad = sum(1 for r in rows if r['hScroll'] or r['nOffscreen'])
    body = f'<p><strong>{len(rows)} shell renders at 320 CSS px; {n_bad} with page-wide horizontal scroll or off-screen controls.</strong> Figures are cropped to their top; the full renders are in <code>screens/renders/</code>.</p><div class="specimens">{cards}</div>'
    return board('SCR-SHELL-019 320 px board', 'Every shell screen and state that has a 320 CSS px render (DWP §5.2; 400 % zoom at 1280 px equals 320 CSS px).', body)
