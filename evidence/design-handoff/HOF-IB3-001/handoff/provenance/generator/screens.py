import os
# HOF-IB3-001 screen and state catalogue (DWP-IB3-001 §5.2). Each state is a standalone HTML review render.
import compose as S, content as C, icons as I
from compose import esc, ic, doc, shell, standard_page, page_header, topbar, status, records_table
from keys import k
from compose import AD, AC

ALL4 = ['desktop', 'tablet', 'zoom200', 'narrow320']
KEY2 = ['desktop', 'narrow320']
STATES = []  # dicts: sid, state, file, html, viewports, full, title, reduced

def add(sid, state, title, html, viewports=KEY2, full=True, reduced=False, note=''):
    f = f'{sid.replace("SCR-SHELL-", "SCR-SHELL-")}--{state}.html'
    STATES.append(dict(sid=sid, state=state, file=f, html=html, viewports=viewports, full=full, title=title, reduced=reduced, note=note))

def page(o, inner, overlay='', title='All records'):
    lang = o.get('lang', 'en'); dirv = 'rtl' if lang in ('ar', 'he') else 'ltr'
    return doc(f'{title} — HOF-IB3-001', shell(o, inner, overlay), lang=lang, dirv=dirv, density=o.get('density'))

# ---------------- overlays ----------------
def nav_sheet(o):
    lang = o.get('lang', 'en')
    D = C.AR if lang == 'ar' else C.HE if lang == 'he' else None
    tenant = D['tenant'] if D else (C.EN['tenant_long'] if o.get('long') else C.EN['tenant'])
    site = D['site'] if D else C.EN['site']
    return (f'<div class="ov-scrim" aria-hidden="true"></div><div class="ov-sheet" id="nav-sheet" role="dialog" aria-modal="true" aria-labelledby="sheet-h">'
            f'<div class="ov-sheet__head"><h2 id="sheet-h">{esc(k("paep.shell.nav.sheet.title", lang))}</h2>'
            f'<button type="button" class="shell-tb-btn" aria-label="{esc(k("paep.shell.nav.close", lang))}">{ic("close")}</button></div>'
            f'<div class="ov-sheet__ctx"><span class="t-body-sm t-secondary">{esc(k("paep.shell.context.label", lang))}</span><div style="display:flex;gap:var(--paep-space-2);align-items:center">{ic("building")}<strong style="overflow-wrap:anywhere">{esc(tenant)} · {esc(site)}</strong></div><span class="paep-badge paep-badge--warning" style="align-self:flex-start">{ic("environment","sm")}{esc({"ar": C.AR, "he": C.HE}.get(lang, C.EN)["env"])}</span>' + (f'<button type="button" class="paep-button paep-button--secondary" style="align-self:flex-start">{esc(k("paep.shell.context.switch", lang))}</button>' if o.get("multi_context", True) else '') + '</div>'
            f'<nav class="ov-sheet__body shell-nav" style="display:block;position:static;border:0;min-block-size:0;max-block-size:none" aria-label="{esc(k("paep.shell.nav.label", lang))}"><ul>{S.nav_items(o, in_sheet=True)}</ul></nav></div>')

def palette(state, lang='en'):
    q = {'idle': '', 'typing': 'aud', 'loading': 'audit', 'results': 'audit', 'none': 'qzx-unknown', 'error': 'audit', 'partial': 'rec', 'locked': 'arch', 'narrow': 'audit'}[state]
    head = (f'<div class="ov-palette__input">{ic("search")}<input type="text" role="combobox" aria-expanded="{"true" if state not in ("idle","none","error","loading") else "false"}" '
            f'aria-controls="pal-list" aria-autocomplete="list" aria-label="{esc(k("paep.shell.search.input", lang))}" value="{esc(q)}" placeholder="{esc(k("paep.shell.search.trigger", lang))}" '
            f'aria-activedescendant="{"opt-1" if state in ("results","typing","partial","locked","narrow") else ""}">'
            f'<button type="button" class="paep-button paep-button--tertiary" aria-label="{esc(k("paep.shell.search.close"))}">Esc</button></div>')
    def opt(i, icon, main, sub='', sel=False, locked=False):
        cls = ' is-locked' if locked else ''
        lk = f'<span class="locked__reason reason--edition">{ic("edition","sm")}{esc(k("paep.shell.search.locked.edition", lang))}</span>' if locked else ''
        s = f'<span class="ov-option__sub">{esc(sub)}</span>' if sub else ''
        return f'<li class="ov-option{cls}" role="option" id="opt-{i}" aria-selected="{"true" if sel else "false"}">{ic(icon)}<span class="ov-option__main">{esc(main)}{s}</span>{lk}</li>'
    def grp(gid, label, items):
        return f'<li role="presentation"><div class="ov-palette__group" id="grp-{gid}">{esc(label)}</div><ul role="group" aria-labelledby="grp-{gid}" style="list-style:none;margin:0;padding:0">{"".join(items)}</ul></li>'
    body = ''
    if state == 'idle':
        body = (f'<ul class="ov-palette__list" id="pal-list" role="listbox" aria-label="{esc(k("paep.shell.search.suggestions", lang))}">'
                + grp('g', k('paep.shell.search.group.goto', lang), [opt(1, 'home', 'Home'), opt(2, 'list', 'All records', 'Records'), opt(3, 'tasks', 'Work items', 'Operations')])
                + grp('a', k('paep.shell.search.group.actions', lang), [opt(4, 'plus', 'New record')]) + '</ul>')
    elif state == 'loading':
        body = f'<div class="ov-palette__state" role="status">{ic("spinner")} {esc(k("paep.shell.search.loading", lang))}</div>'
    elif state in ('results', 'typing', 'narrow'):
        body = (f'<ul class="ov-palette__list" id="pal-list" role="listbox" aria-label="{esc(k("paep.shell.search.results", lang))}">'
                + grp('g', k('paep.shell.search.group.goto', lang), [opt(1, 'shield', 'Audit log', 'Administration', sel=True)])
                + grp('a', k('paep.shell.search.group.actions', lang), [opt(2, 'document', 'Export audit summary', 'Action on this page')])
                + grp('r', k('paep.shell.search.group.records', lang), [opt(3, 'document', 'REC-000181 Access review for Site 04', 'Record · Approved'), opt(4, 'document', 'REC-000163 Audit preparation checklist', 'Record · Draft')])
                + '</ul><div class="shell-sr" role="status">4 results</div>')
    elif state == 'none':
        body = f'<div class="ov-palette__state paep-empty" role="status">{ic("no-results","lg")}<p class="t-title-sm" style="margin:0">{esc(k("paep.shell.search.empty", lang, query=q))}</p><p style="margin:0">{esc(k("paep.shell.search.empty.hint", lang))}</p></div>'
    elif state == 'error':
        body = (f'<div class="ov-palette__state"><div class="paep-alert paep-alert--error" role="alert">{ic("error","md","paep-alert__icon")}<div class="paep-alert__body"><p style="margin:0;font-weight:700">{esc(k("paep.shell.search.error", lang))}</p><p style="margin:0">{esc(k("paep.shell.search.error.hint", lang, ref="7d21-a9c4"))}</p></div></div></div>'
                f'<ul class="ov-palette__list" id="pal-list" role="listbox" aria-label="{esc(k("paep.shell.search.results", lang))}">' + grp('g', k('paep.shell.search.group.goto', lang), [opt(1, 'shield', 'Audit log', 'Administration')]) + '</ul>')
    elif state == 'partial':
        body = (f'<div style="padding:var(--paep-space-2) var(--paep-space-3)"><div class="paep-alert paep-alert--warning" role="status">{ic("warning","md","paep-alert__icon")}<div class="paep-alert__body"><p style="margin:0">{esc(k("paep.shell.search.partial", lang))}</p></div></div></div>'
                f'<ul class="ov-palette__list" id="pal-list" role="listbox" aria-label="{esc(k("paep.shell.search.results", lang))}">' + grp('g', k('paep.shell.search.group.goto', lang), [opt(1, 'list', 'Recently viewed', 'Records', sel=True)])
                + grp('r', k('paep.shell.search.group.records', lang), [opt(2, 'document', 'REC-000184 Quarterly inspection summary', 'Record · In review')]) + '</ul>')
    elif state == 'locked':
        body = (f'<ul class="ov-palette__list" id="pal-list" role="listbox" aria-label="{esc(k("paep.shell.search.results", lang))}">'
                + grp('g', k('paep.shell.search.group.goto', lang), [opt(1, 'document', 'Archive', 'Reports · opens an explanation, not the page', sel=True, locked=True)])
                + '</ul><p class="review-note" style="margin:var(--paep-space-2) var(--paep-space-4)">Q-05 recommendation: edition-locked destinations stay findable, marked with the edition reason; activating one opens the edition explanation. Permission-denied results are never shown.</p>')
    foot = f'<div class="ov-palette__foot"><span>{esc(k("paep.shell.search.help.keys", lang))}</span></div>'
    return f'<div class="ov-scrim" aria-hidden="true"></div><div class="ov-palette" role="dialog" aria-modal="true" aria-label="{esc(k("paep.shell.search.dialog", lang))}">{head}{body}{foot}</div>'

def notif_panel(state, lang='en'):
    items = [('3 records need your review', 'Records · 5 min ago', True, None), ('Document DOC-2291 is ready', 'Documents · 1 h ago', True, None),
             ('Schedule “Weekly checks” was updated', 'Operations · yesterday', True, None),
             ('Access review assigned to you', 'Northwind Holdings — Site 07 · yesterday', False, 'Site 07')]
    def item(t, m, unread, other):
        od = f' <span class="paep-badge paep-badge--neutral">{esc(k("paep.shell.notifications.otherContext", lang, tenant=other))}</span>' if other else ''
        dot = '<span class="ntf-unread-dot" aria-hidden="true"></span>' if unread else '<span style="inline-size:.5rem"></span>'
        u = '<span class="shell-sr">Unread: </span>' if unread else ''
        return f'<li class="ntf-item{" is-unread" if unread else ""}">{dot}<div class="ntf-item__main">{u}<a href="#n">{esc(t)}</a>{od}<span class="ntf-item__meta">{esc(m)}</span></div></li>'
    if state == 'populated': body = '<ul style="list-style:none;margin:0;padding:0">' + ''.join(item(*x) for x in items) + '</ul>'
    elif state == 'empty': body = f'<div class="paep-empty">{ic("empty","lg")}<p style="margin:0">{esc(k("paep.shell.notifications.empty", lang))}</p></div>'
    elif state == 'loading': body = f'<div class="paep-empty" role="status">{ic("spinner","lg")}<p style="margin:0">{esc(k("paep.shell.notifications.loading", lang))}</p></div>'
    elif state == 'error': body = f'<div style="padding:var(--paep-space-3)"><div class="paep-alert paep-alert--error" role="alert">{ic("error","md","paep-alert__icon")}<div class="paep-alert__body"><p style="margin:0">{esc(k("paep.shell.notifications.error", lang))}</p></div><div class="paep-alert__actions"><button type="button" class="paep-button paep-button--secondary">{ic("retry")}Try again</button></div></div></div>'
    elif state == 'stale': body = f'<div style="padding:var(--paep-space-3)"><div class="paep-alert paep-alert--warning" role="status">{ic("warning","md","paep-alert__icon")}<div class="paep-alert__body"><p style="margin:0">{esc(k("paep.shell.notifications.stale", lang, time="09:40"))}</p></div></div></div><ul style="list-style:none;margin:0;padding:0">' + ''.join(item(*x) for x in items[:2]) + '</ul>'
    elif state == 'unavailable': body = f'<div class="paep-empty">{ic("info","lg")}<p style="margin:0">{esc(k("paep.shell.notifications.unavailable", lang))}</p></div>'
    mark = f'<button type="button" class="paep-button paep-button--tertiary">{esc(k("paep.shell.notifications.markAll", lang))}</button>' if state in ('populated', 'stale') else ''
    return (f'<section class="ov-pop ov-pop--end" role="dialog" aria-modal="false" aria-labelledby="ntf-h"><div class="ov-pop__head"><h2 id="ntf-h">{esc(k("paep.shell.notifications.title", lang))}</h2>{mark}'
            f'<button type="button" class="shell-tb-btn" aria-label="{esc(k("paep.shell.notifications.close", lang))}">{ic("close")}</button></div><div class="ov-pop__body">{body}</div></section>')

HV = ' class="is-hover"'
FO_SCRIPT = '<script>' + open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'fo.js')).read() + '</script>'
def locale_group(lang='en', narrow_only=False):
    # Locales and their autonyms come from the host (runtime config supportedLocales + i18n seam); choosing one is a request to the app.
    locs = [('en', 'English', 'LTR', True), ('ar', 'العربية', 'RTL', False), ('he', 'עברית', 'RTL', False), ('fr', 'Français', 'LTR', False)]
    items = ''.join(f'<li role="none"><button type="button" role="menuitemradio" aria-checked="{"true" if cur else "false"}"{HV if cur else ""}>'
                    f'<span style="inline-size:1.25rem;display:inline-flex">{ic("check") if cur else ""}</span><span lang="{code}" dir="{d.lower()}">{esc(name)}</span>'
                    f'<span class="t-body-sm t-secondary" style="margin-inline-start:auto" dir="ltr">{d}</span></button></li>' for code, name, d, cur in locs)
    if narrow_only: return (f'<li role="none" class="menu-head show-narrow" style="display:none;border:0;padding-block-end:0"><span id="lang-gn" class="t-body-sm t-secondary">{esc(k("paep.shell.locale.label", lang))}</span></li>'
            f'<li role="none" class="show-narrow" style="display:none"><ul role="group" aria-labelledby="lang-gn" style="list-style:none;margin:0;padding:0">{items}</ul></li>')
    return (f'<li role="none" class="menu-head" style="border:0;padding-block-end:0"><span id="lang-g" class="t-body-sm t-secondary">{esc(k("paep.shell.locale.label", lang))}</span></li>'
            f'<li role="none"><ul role="group" aria-labelledby="lang-g" style="list-style:none;margin:0;padding:0">{items}</ul></li>')

def account_menu(lang='en', long=False, signing_out=False, multi_locale=True, locale_open=False):
    user = C.EN['user_long'] if long else C.EN['user']
    loc = (f'<li role="none" class="show-narrow" style="display:none"><button type="button" role="menuitem">{ic("globe")}<span>{esc(k("paep.shell.locale.request", lang))}</span><span class="t-body-sm t-secondary" style="margin-inline-start:auto">English (LTR)</span></button></li>' if multi_locale
           else f'<li role="none" class="menu-head" style="border:0"><span>{esc(k("paep.shell.locale.label", lang))}: English (LTR)</span></li>')
    if locale_open: loc = f'<li role="separator" class="show-narrow" style="display:none"><hr></li>' + locale_group(lang, narrow_only=True)
    so = (f'<li role="none"><button type="button" role="menuitem" aria-disabled="true">{ic("spinner")}<span>{esc(k("paep.shell.account.signingOut", lang))}</span></button></li>' if signing_out
          else f'<li role="none"><button type="button" role="menuitem">{ic("sign-out")}<span>{esc(k("paep.shell.account.signOut", lang))}</span></button></li>')
    return (f'<div class="ov-menu"><ul class="paep-menu" role="menu" aria-label="{esc(k("paep.shell.account.button", lang))}">'
            f'<li role="none" class="menu-head"><strong>{esc(user)}</strong><span dir="ltr">alex.morgan@example.test</span></li>'
            f'<li role="none"><button type="button" role="menuitem">{ic("sliders")}<span>{esc(k("paep.shell.account.preferences", lang))}</span></button></li>{loc}'
            f'<li role="none" class="show-narrow" style="display:none"><button type="button" role="menuitem">{ic("help")}<span>{esc(k("paep.shell.account.help", lang))}</span></button></li>'
            f'<li role="separator"><hr></li>{so}</ul></div>')

def lang_menu(lang='en'):
    # X-05 B: the topbar language control (>= 600 px) opens a menu on the governed base with the menuitemradio group.
    return (f'<div class="ov-menu ov-menu--lang hide-narrow"><ul class="paep-menu" role="menu" aria-label="{esc(k("paep.shell.locale.label", lang))}">' + locale_group(lang) + '</ul></div>')

def ctx_dialog(state):
    rows = ''.join(f'<li><label class="paep-choice" style="padding:var(--paep-space-2) 0"><input type="radio" name="ctx"{" checked" if i==0 else ""}><span><strong>{esc(t)}</strong><br><span class="t-body-sm t-secondary">{esc(s)}</span></span></label></li>'
                   for i, (t, s) in enumerate([('Northwind Holdings', 'Site 04 · current'), ('Northwind Holdings', 'Site 07'), ('Northwind Holdings International Group (Southern Africa Regional Operations)', 'Site 11: Distribution Campus North-East Extension')]))
    msg = ''
    if state == 'pending':
        msg = f'<div class="paep-alert paep-alert--info" role="status">{ic("spinner","md","paep-alert__icon")}<div class="paep-alert__body"><p style="margin:0">{esc(k("paep.shell.context.switch.pending", tenant="Northwind Holdings · Site 07"))}</p></div></div>'
    if state == 'rejected':
        msg = f'<div class="paep-alert paep-alert--error" role="alert">{ic("error","md","paep-alert__icon")}<div class="paep-alert__body"><p style="margin:0">{esc(k("paep.shell.context.switch.rejected", tenant="Site 07", current="Northwind Holdings · Site 04"))}</p><p style="margin:0" class="t-body-sm">Reference <code dir="ltr">5b1e-02aa</code></p></div></div>'
    return (f'<div class="ov-scrim" aria-hidden="true"></div><div class="paep-dialog" role="dialog" aria-modal="true" aria-labelledby="ctx-h" style="z-index:61">'
            f'<div class="paep-dialog__head"><h2 id="ctx-h" class="t-title" style="margin:0">{esc(k("paep.shell.context.switch.title"))}</h2><button type="button" class="paep-button paep-button--tertiary paep-icon-button" aria-label="{esc(k("paep.shell.dialog.close"))}">{ic("close")}</button></div>'
            f'<div class="paep-dialog__body"><p style="margin-block-start:0">{esc(k("paep.shell.context.switch.intro"))}</p>{msg}<fieldset style="border:0;padding:0;margin:0"><legend class="vh">{esc(k("paep.shell.context.switch.legend"))}</legend><ul style="list-style:none;margin:0;padding:0">{rows}</ul></fieldset></div>'
            f'<div class="paep-dialog__foot"><button type="button" class="paep-button paep-button--secondary">{esc(k("paep.shell.dialog.cancel"))}</button><button type="button" class="paep-button paep-button--primary"{AD if state=="pending" else ""}>{esc(k("paep.shell.context.switch.submit"))}</button></div></div>')

def help_pop():
    return (f'<div class="ov-pop ov-pop--end" style="inline-size:min(20rem,calc(100vw - 2 * var(--paep-space-4)));inset-inline-end:9rem"><div class="ov-pop__head"><h2 id="help-h">{esc(k("paep.shell.help.button"))}</h2></div>'
            f'<ul class="paep-menu" role="menu" aria-labelledby="help-h"><li role="none"><button type="button" role="menuitem">Help for this page</button></li><li role="none"><button type="button" role="menuitem">Keyboard shortcuts</button></li><li role="none"><button type="button" role="menuitem">{ic("external")}Support site</button></li></ul></div>')

def locked_block(reason, level='page', heading='h1', lang='en'):
    icon = C.REASONS[reason][0]
    rk = k('paep.shell.locked.' + reason, lang)
    act = 'paep-button--primary' if reason == 'edition' else 'paep-button--secondary'
    iid = {'permission': 'users', 'edition': 'archive', 'configuration': 'templates', 'environment': 'integrations'}[reason]
    name = {'ar': C.AR, 'he': C.HE}[lang]['items'][iid] if lang in ('ar', 'he') else {'permission': 'Users and access', 'edition': 'Archive', 'configuration': 'Templates', 'environment': 'Integrations'}[reason]
    ti = ' tabindex="-1"' if heading == 'h1' else ''
    return (f'<section class="locked locked--{reason}" aria-labelledby="lk-{reason}-{level}"><span class="locked__reason reason--{reason}">{ic(icon,"sm")}{esc(rk)}</span>'
            f'<{heading} id="lk-{reason}-{level}"{ti}>{esc(name)}</{heading}>'
            f'<p>{esc(k("paep.shell.locked." + reason + ".body", lang))}</p><p class="locked__ref">{esc(k("paep.shell.locked.server", lang))}</p>'
            f'<div style="display:flex;gap:var(--paep-space-2);flex-wrap:wrap"><button type="button" class="paep-button {act}">{esc(k("paep.shell.locked." + reason + ".action", lang))}</button><a class="paep-button paep-button--tertiary" href="#home">{esc(k("paep.shell.error.home", lang))}</a></div></section>')

def build():
    base = dict(current='all')
    SP = lambda o, **kw: standard_page(o, **kw)
    # 001 desktop expanded
    o = dict(base); add('SCR-SHELL-001', 'populated', 'Desktop expanded shell, populated', page(o, SP(o, toolbar=True)), ALL4)
    o = dict(base, content='loading', announce=''); add('SCR-SHELL-001', 'loading', 'Desktop expanded shell, loading after config', page(o, SP(o)), ALL4)
    o = dict(base); add('SCR-SHELL-001', 'default', 'Desktop expanded shell, default (Home)', page(dict(o, current='home'), page_header(dict(o), 'Home', None, None, actions=False) + '<div class="pf-grid">' + ''.join(f'<section class="paep-card"><h2 class="paep-card__title t-title-sm" style="margin:0">{t}</h2><p style="margin:0">{d}</p><a href="#x">Open {t.lower()}</a></section>' for t, d in [('Records', '6 records changed today.'), ('Work items', '12 items assigned to you.'), ('Tasks', 'Tasks due this week.')]) + '</div>', title='Home'), ALL4)
    # 002 collapsed
    o = dict(base, collapsed=True); add('SCR-SHELL-002', 'collapsed', 'Desktop collapsed navigation (rail with visible short labels, Q-03)', page(o, SP(o)), ['desktop', 'tablet'])
    o = dict(base, collapsed=True, flyout='records'); add('SCR-SHELL-002', 'group-flyout', 'Collapsed rail: group flyout on the governed menu base', page(o, SP(o)), ['desktop'], full=False)
    o = dict(base); add('SCR-SHELL-002', 're-expanded', 'Re-expanded: focus returns to the collapse toggle', page(o, SP(o), overlay='<p class="review-note" style="position:fixed;inset-block-end:1rem;inset-inline-end:1rem;background:var(--paep-color-surface);padding:var(--paep-space-2)">Focus return: after Expand, focus stays on the same toggle (now “Collapse navigation”), shown with the focus ring.</p><style>.shell-nav__head .shell-tb-btn{outline:2px solid var(--paep-color-focus-ring);outline-offset:2px;box-shadow:0 0 0 2px #fff}</style>'), ['desktop'])
    # 003 tablet / 640
    o = dict(base); add('SCR-SHELL-003', 'nav-closed', 'Tablet and 640 px shell, navigation closed', page(o, SP(o, toolbar=True)), ['tablet', 'zoom200'])
    o = dict(base, expanded='nav'); add('SCR-SHELL-003', 'nav-open', 'Tablet and 640 px shell, modal navigation open (Q-09)', page(o, SP(o), nav_sheet(o)), ['tablet', 'zoom200'], full=False)
    # 004 narrow
    o = dict(base); add('SCR-SHELL-004', 'nav-closed', 'Narrow shell, navigation closed', page(o, SP(o)), ['narrow375', 'narrow320'])
    o = dict(base, expanded='nav'); add('SCR-SHELL-004', 'nav-open', 'Narrow shell, navigation open (full width)', page(o, SP(o), nav_sheet(o)), ['narrow375', 'narrow320'], full=False)
    o = dict(base, expanded='nav', long=True); add('SCR-SHELL-004', 'long-labels', 'Narrow shell, navigation open with long names and labels', page(o, SP(o), nav_sheet(o)), ['narrow375', 'narrow320'], full=False)
    # 005 topbar overflow
    o = dict(base); add('SCR-SHELL-005', 'overflow-sequence', 'Topbar overflow sequence 1440 → 320 (never-hidden set)', page(o, SP(o)), ['desktop', 'desktop1024', 'tablet', 'zoom200', 'narrow375', 'narrow320'], full=False)
    o = dict(base, long=True); add('SCR-SHELL-005', 'long-names', 'Topbar with long product, tenant and user names', page(o, SP(o)), ['desktop', 'desktop1024', 'tablet', 'zoom200', 'narrow320'], full=False)
    # 006 navigation states
    o = dict(base, nested=True, current='archived'); add('SCR-SHELL-006', 'current-nested', 'Navigation: current item, nested child, counts', page(o, SP(o, title='Archived records', crumbs=('Home', 'Records', 'All records'))))
    o = dict(base, badges={'work': 'loading', 'tasks': 'unknown'}); add('SCR-SHELL-006', 'count-loading-unknown', 'Navigation: count badge loading and unknown', page(o, SP(o)), ['desktop'])
    o = dict(base, q10='hide'); add('SCR-SHELL-006', 'locked-hidden', 'Navigation: locked × 3 reasons shown; permission-denied hidden (Q-10 recommended)', page(o, SP(o)), ['desktop', 'narrow320'])
    o = dict(base, q10='show'); add('SCR-SHELL-006', 'locked-shown-alt', 'Navigation: Q-10 alternative, permission-denied shown locked', page(o, SP(o)), ['desktop'])
    o = dict(base, long=True, lang='en'); add('SCR-SHELL-006', 'long-labels', 'Navigation: long labels wrap (never truncate)', page(o, SP(o)), ['desktop', 'tablet'])
    for st, extra in [('current-nested', dict(nested=True, current='archived', open_groups={'records'})), ('count-loading-unknown', dict(badges={'work': 'loading', 'tasks': 'unknown'}, open_groups={'operations'})),
                      ('locked-hidden', dict(q10='hide', open_groups={'reports', 'admin'})), ('locked-shown-alt', dict(q10='show', open_groups={'reports', 'admin'})), ('long-labels', dict(long=True, open_groups={'records'}))]:
        o = dict(base, expanded='nav', **extra)
        add('SCR-SHELL-006', st + '-sheet', f'Navigation {st} inside the mobile navigation container (below 1024 px)', page(o, SP(o), nav_sheet(o)), ['tablet', 'zoom200', 'narrow320'], full=False)
    # 007 context
    o = dict(base, long=True); add('SCR-SHELL-007', 'long-names', 'Context: long tenant and site names', page(o, SP(o)), ALL4, full=False)
    o = dict(base, multi_context=False); add('SCR-SHELL-007', 'single-context', 'Context: one context only, no switcher (Q-11)', page(o, SP(o)), ['desktop'], full=False)
    o = dict(base); add('SCR-SHELL-007', 'switch-dialog', 'Context switch request dialog (Q-11)', page(o, SP(o), ctx_dialog('choose')), ['desktop', 'narrow320'], full=False)
    add('SCR-SHELL-007', 'switch-pending', 'Context switch request pending', page(o, SP(o), ctx_dialog('pending')), ['desktop'], full=False)
    add('SCR-SHELL-007', 'switch-rejected', 'Context switch request rejected', page(o, SP(o), ctx_dialog('rejected')), ['desktop', 'narrow320'], full=False)
    mm = (f'<div class="paep-alert paep-alert--warning" role="alert" style="margin-block-end:var(--paep-space-4)">{ic("warning","md","paep-alert__icon")}<div class="paep-alert__body"><p style="margin:0;font-weight:700">{esc(k("paep.shell.context.mismatch.title"))}</p>'
          f'<p style="margin:0">{esc(k("paep.shell.context.mismatch.body", target="Northwind Holdings · Site 07", current="Northwind Holdings · Site 04"))}</p>'
          f'<div style="display:flex;gap:var(--paep-space-2);flex-wrap:wrap;margin-block-start:var(--paep-space-2)"><button type="button" class="paep-button paep-button--primary">{esc(k("paep.shell.context.mismatch.action", target="Site 07"))}</button><button type="button" class="paep-button paep-button--secondary">{esc(k("paep.shell.context.mismatch.stay", current="Site 04"))}</button></div></div></div>')
    add('SCR-SHELL-007', 'deep-link-mismatch', 'Deep link to another tenant: never switches silently', page(o, page_header(o, 'Access review', ('Home', 'Administration'), None, actions=False) + mm), ['desktop', 'narrow320'])
    o = dict(base, impersonation=True); add('SCR-SHELL-007', 'impersonation', 'Support impersonation always visible', page(o, SP(o)), ['desktop', 'narrow320'])
    # 008 palette
    for st, vps in [('idle', ['desktop']), ('typing', ['desktop']), ('loading', ['desktop']), ('results', ['desktop', 'tablet']), ('none', ['desktop']), ('error', ['desktop']), ('partial', ['desktop']), ('locked', ['desktop']), ('narrow', ['narrow320', 'narrow375'])]:
        o = dict(base); add('SCR-SHELL-008', st if st != 'narrow' else 'full-screen-narrow', f'Command palette: {st}', page(o, SP(o), palette(st)), vps, full=False)
    # 009 notifications
    for st, unread in [('none', '0'), ('unread', '3'), ('99plus', '99+'), ('count-loading', 'loading'), ('count-error', 'error'), ('provider-unavailable', 'none')]:
        o = dict(base, unread=unread); add('SCR-SHELL-009', 'access-' + st, f'Notification access: {st}', page(o, SP(o)), ['desktop', 'narrow320'] if st in ('unread', '99plus') else ['desktop'], full=False)
    for st in ['populated', 'empty', 'loading', 'error', 'stale', 'unavailable']:
        o = dict(base, expanded='notif'); add('SCR-SHELL-009', 'panel-' + st, f'Notification panel: {st}', page(o, SP(o), notif_panel(st)), ['desktop', 'narrow320'] if st == 'populated' else ['desktop'], full=False)
    o = dict(base, announce='Record REC-000184 saved.')
    add('SCR-SHELL-009', 'transient-vs-persistent', 'Transient announcement vs persistent notification',
        page(o, page_header(o, 'Transient vs persistent', ('Home',), None, actions=False) + '<div class="pf-grid"><section class="paep-card"><h2 class="t-title-sm" style="margin:0">Transient (this session)</h2><p style="margin:0">Spoken through the polite live region and shown inline where the action happened. No toast (Q-08 recommendation). Not stored.</p><div class="paep-alert paep-alert--success" role="status">' + ic('success', 'md', 'paep-alert__icon') + '<div class="paep-alert__body"><p style="margin:0">Record REC-000184 saved.</p></div></div></section><section class="paep-card"><h2 class="t-title-sm" style="margin:0">Persistent (provider)</h2><p style="margin:0">Delivered by the host-supplied notification provider, listed in the panel and counted on the bell. Deep links keep tenant and product context.</p></section></div>'), ['desktop', 'narrow320'])
    # 010 account / locale / help
    o = dict(base, expanded='account'); add('SCR-SHELL-010', 'account-menu', 'Account menu with sign-out and language request', page(o, SP(o), account_menu()), ['desktop', 'narrow320'], full=False)
    o1 = dict(o, multi_locale=False); add('SCR-SHELL-010', 'single-locale', 'Account menu, one locale: language shown, no language control in the topbar', page(o1, SP(o1), account_menu(multi_locale=False)), ['desktop'], full=False)
    o2 = dict(base, expanded='locale'); add('SCR-SHELL-010', 'locale-selector', 'Language selector (host supplies more than one locale, X-05 B): topbar language control opens a menuitemradio group on the governed menu at >= 600 px; below 600 px the group is in the account menu; choosing sends a request to the app', page(o2, SP(o2), lang_menu() + account_menu(locale_open=True).replace('class="ov-menu"', 'class="ov-menu show-narrow-block"')), ['desktop', 'narrow320'], full=False)
    add('SCR-SHELL-010', 'signing-out', 'Sign-out in progress (state given by host)', page(o, SP(o), account_menu(signing_out=True)), ['desktop'], full=False)
    o = dict(base, expanded='help'); add('SCR-SHELL-010', 'help', 'Help surface (app-configured hook)', page(o, SP(o), help_pop()), ['desktop'], full=False)
    # 011 page frame variants
    o = dict(base)
    add('SCR-SHELL-011', 'title-only', 'Page frame: title only', page(o, page_header(o, 'Settings', None, None, actions=False, context=False) + '<div class="pf-slot">Page body</div>', title='Settings'), ALL4)
    add('SCR-SHELL-011', 'title-context-status', 'Page frame: title + context + status', page(o, page_header(o, 'All records', None, ('warning', '2 need review'), actions=False) + records_table()), ['desktop', 'narrow320'])
    add('SCR-SHELL-011', 'actions-overflow', 'Page frame: primary + secondary actions + overflow', page(o, SP(o)), ['desktop', 'zoom200', 'narrow320'])
    add('SCR-SHELL-011', 'breadcrumbs', 'Page frame: breadcrumbs (when justified)', page(dict(o, current='archived', nested=True), SP(o, title='REC-000184 Quarterly inspection summary', crumbs=('Home', 'Records', 'All records'))), ['desktop', 'narrow320'])
    add('SCR-SHELL-011', 'filter-region', 'Page frame: filter region', page(o, SP(o, toolbar=True)), ['desktop', 'tablet', 'narrow320'])
    add('SCR-SHELL-011', 'extension-regions', 'Page frame: generic extension and action regions', page(o, page_header(o, 'All records', ('Home', 'Records'), None) + '<div class="pf-region-label"><span>Page toolbar region</span><span>SHELL-REGION-PAGE-TOOLBAR</span></div><div class="pf-slot" style="margin-block-end:var(--paep-space-4)">Host-provided extension (filters, scope, view options)</div><div class="pf-region-label"><span>Content region</span><span>SHELL-REGION-CONTENT</span></div><div class="pf-slot">Page body</div>'), ['desktop', 'narrow320'])
    add('SCR-SHELL-011', 'aside', 'Page frame: aside (beside at ≥ 1440, below otherwise)', page(o, SP(o, aside=True)), ['desktop', 'desktop1024', 'narrow320'])
    add('SCR-SHELL-011', 'long-content', 'Page frame: long title and content', page(dict(o, long=True), SP(dict(o, long=True), title='Pending approvals awaiting second-level review for Northwind Holdings International Group — Site 04: Distribution Campus North-East Extension')), ['desktop', 'narrow320'])
    for st in ['loading', 'empty', 'error']:
        add('SCR-SHELL-011', 'content-' + st, f'Page frame: content {st}', page(dict(o, content=st), SP(dict(o, content=st))), ['desktop', 'narrow320'])
    # 012 locked
    for r in ['permission', 'edition', 'configuration', 'environment']:
        add('SCR-SHELL-012', 'page-' + r, f'Locked page: {r}', page(dict(o, current=''), locked_block(r, 'page', 'h1'), title='Locked'), ['desktop', 'narrow320'])
    acts = ''.join(f'<li style="display:flex;align-items:center;gap:var(--paep-space-3);flex-wrap:wrap;padding:var(--paep-space-2) 0"><button type="button" class="paep-button paep-button--secondary" aria-disabled="true" aria-describedby="ar-{r}">{ic(C.REASONS[r][0])}{esc(n)}</button><span id="ar-{r}" class="locked__reason reason--{r}">{esc(k("paep.shell.locked." + r))}</span></li>'
                   for r, n in [('permission', 'Delete record'), ('edition', 'Export archive'), ('configuration', 'Send to template'), ('environment', 'Scan with camera')])
    board = (page_header(o, 'Locked reasons at three levels', ('Home',), None, actions=False) +
             '<div class="pf-grid"><section class="paep-card"><h2 class="t-title-sm" style="margin:0">Navigation item level</h2><p style="margin:0" class="t-body-sm">Reason icon + accessible name “Archive, Not included in your edition”. Activation opens the explanation page.</p><ul style="list-style:none;margin:0;padding:0">'
             + ''.join(f'<li><a class="shell-nav__link is-locked" href="#x" aria-label="{n}, {esc(k("paep.shell.locked." + r))}"><span class="shell-nav__label">{n}</span><span class="shell-nav__meta">{ic(C.REASONS[r][0],"sm")}<span aria-hidden="true">{esc(k("paep.shell.locked." + r))}</span></span></a></li>' for r, n in [('permission', 'Users and access'), ('edition', 'Archive'), ('configuration', 'Templates'), ('environment', 'Integrations')])
             + '</ul></section><section class="paep-card"><h2 class="t-title-sm" style="margin:0">Action level</h2><p style="margin:0" class="t-body-sm">aria-disabled (still focusable) with the reason as its description; the server still decides.</p><ul style="list-style:none;margin:0;padding:0">' + acts + '</ul></section></div>'
             '<h2 class="t-title" style="margin:var(--paep-space-6) 0 var(--paep-space-3)">Page level</h2><div class="pf-grid">' + ''.join(locked_block(r, 'board', 'h3') for r in ['permission', 'edition', 'configuration', 'environment']) + '</div>')
    add('SCR-SHELL-012', 'three-levels', 'Locked × 4 reasons at page, navigation-item and action level', page(dict(o, q10='show'), board), ['desktop', 'tablet', 'narrow320'])
    # 013 error
    def errp(h, b, ref=True, retry=True, extra_btn=None):
        r = f'<p class="error-ref">{esc(k("paep.shell.error.reference"))}: <code dir="ltr">c0a8-7f3e-51d2</code></p>' if ref else ''
        bt = (f'<button type="button" class="paep-button paep-button--primary">{ic("retry")}{esc(k("paep.shell.error.retry"))}</button>' if retry else '') + (extra_btn or '') + f'<a class="paep-button paep-button--secondary" href="#home">{esc(k("paep.shell.error.home"))}</a>'
        return f'<section class="error-page" role="alert" aria-labelledby="err-h">{ic("error","lg")}<h1 id="err-h" tabindex="-1">{esc(h)}</h1><p>{esc(b)}</p>{r}<div style="display:flex;gap:var(--paep-space-2);flex-wrap:wrap">{bt}</div></section>'
    add('SCR-SHELL-013', 'recoverable', 'Error boundary: recoverable with correlation reference', page(o, errp(k('paep.shell.error.title'), k('paep.shell.error.body'))), ['desktop', 'narrow320'])
    add('SCR-SHELL-013', 'not-retryable', 'Error boundary: not retryable (safe navigation only)', page(o, errp(k('paep.shell.error.title'), k('paep.shell.error.body'), retry=False)), ['desktop'])
    add('SCR-SHELL-013', 'lazy-load-failure', 'Route / lazy-load failure', page(o, errp(k('paep.shell.error.chunk'), k('paep.shell.error.chunk.body'), retry=False, extra_btn=f'<button type="button" class="paep-button paep-button--primary">{ic("retry")}{esc(k("paep.shell.error.reload"))}</button>')), ['desktop', 'narrow320'])
    add('SCR-SHELL-013', 'incompatible-version', 'Incompatible version', page(o, errp(k('paep.shell.error.version'), k('paep.shell.error.version.body'), ref=False, retry=False, extra_btn=f'<button type="button" class="paep-button paep-button--primary">{ic("retry")}{esc(k("paep.shell.error.reload"))}</button>')), ['desktop'])
    add('SCR-SHELL-013', 'not-found', 'Not found', page(dict(o, current=''), f'<section class="error-page" aria-labelledby="nf-h">{ic("no-results","lg")}<h1 id="nf-h" tabindex="-1">{esc(k("paep.shell.notFound.title"))}</h1><p>{esc(k("paep.shell.notFound.body"))}</p><div style="display:flex;gap:var(--paep-space-2);flex-wrap:wrap"><a class="paep-button paep-button--primary" href="#home">{esc(k("paep.shell.error.home"))}</a><button type="button" class="paep-button paep-button--secondary">{ic("search")}{esc(k("paep.shell.search.trigger"))}</button></div></section>'), ['desktop', 'narrow320'])
    # 014 connectivity / status
    for st in ['online', 'offline', 'degraded', 'unknown']:
        add('SCR-SHELL-014', st, f'Connectivity: {st}', page(dict(o, conn=st), SP(o)), ['desktop', 'narrow320'], full=False)
    add('SCR-SHELL-014', 'non-production', 'Non-production environment notice', page(dict(o, env_notice=True), SP(o)), ['desktop'], full=False)
    add('SCR-SHELL-014', 'stacked', 'Stacked status: impersonation + degraded + session expiring + environment', page(dict(o, conn='degraded', impersonation=True, session_expiring=True, env_notice=True), SP(o)), ['desktop', 'narrow320'], full=False)
    add('SCR-SHELL-014', 'stacked-narrow-collapsed', 'Stacked status below 600 px (recommended): highest-priority message plus a disclosure for the rest', page(dict(o, conn='degraded', impersonation=True, session_expiring=True, env_notice=True, stack_collapsed=True), SP(o)), ['narrow320', 'short320x256'], full=False)
    # 015 generic hosting example (no analytics behaviour)
    def host(state):
        ph = {'default': 'Hosted experience placeholder<br><span class="t-body-sm">Any future experience renders its own content here. No data, metrics or reporting behaviour is designed in IB3.</span>',
              'loading': '<span role="status">' + ic('spinner') + ' Loading hosted content…</span>',
              'empty': 'Nothing to show yet for the hosted experience.',
              'error': 'The hosted content could not be loaded. Reference <code dir="ltr">44f1-0b3c</code>.'}[state]
        return (page_header(o, 'Hosted workspace example', ('Home',), None, actions=False) +
                '<div class="pf-region-label"><span>Filter region (generic)</span><span>SHELL-REGION-PAGE-TOOLBAR</span></div>'
                '<div class="pf-slot" style="margin-block-end:var(--paep-space-4)">Host-supplied controls, e.g. scope selector and Apply</div>'
                '<div class="pf-region-label"><span>Action region (generic)</span></div><div class="pf-slot" style="margin-block-end:var(--paep-space-4);display:flex;gap:var(--paep-space-2);flex-wrap:wrap"><button type="button" class="paep-button paep-button--secondary">Host action A</button><button type="button" class="paep-button paep-button--secondary">Host action B</button></div>'
                f'<div class="pf-region-label"><span>Extension / content region</span><span>SHELL-REGION-CONTENT</span></div><div class="pf-placeholder">{ph}</div>')
    for st in ['default', 'loading', 'empty', 'error']:
        add('SCR-SHELL-015', st, f'Generic hosting example: {st}', page(dict(o, current='documents'), host(st), title='Hosted workspace example'), ['desktop', 'tablet', 'narrow320'] if st == 'default' else ['desktop'])
    # 016 preferences (session only)
    pref = (page_header(o, k('paep.shell.preferences.title'), ('Home',), None, actions=False, context=False) +
            '<section class="paep-card" style="max-inline-size:36rem"><fieldset class="paep-fieldset" style="border:0;padding:0;margin:0"><legend class="t-title-sm">' + esc(k('paep.shell.preferences.density')) + '</legend>'
            '<label class="paep-choice"><input type="radio" name="d" checked><span>' + esc(k('paep.shell.preferences.density.comfortable')) + '</span></label><label class="paep-choice"><input type="radio" name="d"><span>' + esc(k('paep.shell.preferences.density.compact')) + '</span></label></fieldset>'
            '<label class="paep-choice"><input type="checkbox"><span>' + esc(k('paep.shell.preferences.navCollapsed')) + '</span></label>'
            '<p class="t-body-sm t-secondary" style="margin:0">' + esc(k('paep.shell.preferences.session')) + ' Preferences change presentation only. They never change what you can access, and they never turn off focus indicators, names or other accessibility semantics.</p></section>')
    add('SCR-SHELL-016', 'preferences', 'Shell-local preferences (session only)', page(dict(o, current=''), pref, title='Display preferences'), ['desktop', 'narrow320'])
    add('SCR-SHELL-016', 'applied-compact-collapsed', 'Preferences applied: collapsed navigation + compact content', page(dict(o, collapsed=True, density='compact'), SP(o, toolbar=True)), ['desktop'])
    # 017 RTL
    for lang in ['ar', 'he']:
        ob = dict(base, lang=lang)
        add('SCR-SHELL-017', f'{lang}-001-shell', f'RTL ({lang}): expanded shell', page(ob, SP(ob, toolbar=True)), ['desktop', 'tablet', 'narrow320'])
        add('SCR-SHELL-017', f'{lang}-004-nav-open', f'RTL ({lang}): mobile navigation open', page(dict(ob, expanded='nav'), SP(ob), nav_sheet(dict(ob))), ['narrow320'], full=False)
        add('SCR-SHELL-017', f'{lang}-008-palette', f'RTL ({lang}): command palette', page(ob, SP(ob), palette('results', lang)), ['desktop'], full=False)
    for lang in ['ar', 'he']:
        ob = dict(base, lang=lang, q10='show')
        add('SCR-SHELL-017', f'{lang}-006-nav-locked', f'RTL ({lang}): navigation states and locked items', page(ob, SP(ob)), ['desktop'])
        add('SCR-SHELL-017', f'{lang}-011-frame', f'RTL ({lang}): page frame with aside and mixed-direction identifiers', page(ob, SP(ob, aside=True)), ['desktop', 'narrow320'])
        add('SCR-SHELL-017', f'{lang}-012-locked', f'RTL ({lang}): locked page', page(dict(ob, current=''), locked_block('edition', 'rtl', 'h1', lang)), ['desktop', 'narrow320'])
    # 018 long text / zoom
    ol = dict(base, long=True)
    add('SCR-SHELL-018', 'long-text-2x', 'Long-text (2×) board: truncation vs wrap', page(ol, SP(ol, title='Pending approvals awaiting second-level review for Northwind Holdings International Group — Site 04', toolbar=True, aside=True)), ALL4)
    add('SCR-SHELL-018', 'zoom-400', '400 % zoom equivalent (1280 px at 400 % = 320 CSS px)', page(ol, SP(ol)), ['narrow320', 'short320x256'], full=False)
    # 020 keyboard / focus (order page)
    add('SCR-SHELL-020', 'focus-order', 'Focus order (numbered; stop 1 is the skip link, visible on focus as in SCR-SHELL-020 maps)', page(dict(base), SP(base), overlay=FO_SCRIPT), ['desktop', 'tablet', 'zoom200', 'narrow320'], full=False)
    # 022 density
    add('SCR-SHELL-022', 'comfortable', 'Density: comfortable content in shell chrome', page(dict(base), SP(base, toolbar=True)), ['desktop', 'narrow320'])
    add('SCR-SHELL-022', 'compact', 'Density: compact content, chrome unchanged (Q-14)', page(dict(base, density='compact'), SP(base, toolbar=True)), ['desktop', 'narrow320'])
    # 021 reduced motion (renders with reducedMotion=reduce)
    add('SCR-SHELL-021', 'nav-open-reduced', 'Reduced motion: navigation open without slide', page(dict(base, expanded='nav'), SP(base), nav_sheet(base)), ['tablet', 'narrow320'], full=False, reduced=True)
    add('SCR-SHELL-021', 'palette-reduced', 'Reduced motion: palette without animation; spinner static', page(base, SP(base), palette('loading')), ['desktop'], full=False, reduced=True)
    return STATES
