# HOF-IB3-001 shell composition for review renders. Reference only (DCH §9.2(v)); non-authoritative prototype logic.
import html, os
AD = ' aria-disabled="true"'
AC = ' aria-current="page"'
import icons as I, content as C
from keys import k
ic = I.ic
def esc(s): return html.escape(str(s))
HERE = os.path.dirname(os.path.abspath(__file__))
PROTO = os.environ.get('IB2_PROTO_CSS', '/mnt/project-files/ib2/handoff/HOF-IB2-001/foundation/prototype-reference.css')
CSS = open(PROTO).read() + '\n' + open(os.path.join(HERE, 'shell.css')).read()

def doc(title, body, lang='en', dirv='ltr', body_class='shell-body', density=None, extra=''):
    d = f' data-paep-density="{density}"' if density else ''
    return (f'<!doctype html>\n<html lang="{lang}" dir="{dirv}"{d}><head><meta charset="utf-8">'
            f'<meta name="viewport" content="width=device-width, initial-scale=1"><title>{esc(title)}</title>'
            f'<meta name="paep-handoff" content="HOF-IB3-001 v1.0 REVIEW CANDIDATE - reference only, not production code">'
            f'<style>{CSS}{extra}</style></head><body class="{body_class}">{I.sprite()}{body}</body></html>\n')

MARK_INLINE = I.MARK.replace('<svg ', '<svg class="shell-product__mark" aria-hidden="true" focusable="false" ', 1)

def L(o):
    return o.get('lang', 'en')

def label_for(o, gid=None, iid=None, default=''):
    lang = L(o)
    if lang in ('ar', 'he'):
        D = C.AR if lang == 'ar' else C.HE
        if iid: return D['items'].get(iid, default)
        if gid: return D['groups'].get(gid, default)
    return default

# ---------------- topbar ----------------
def topbar(o):
    lang = L(o)
    D = C.AR if lang == 'ar' else C.HE if lang == 'he' else None
    product = (D['product'] if D else (C.EN['product_long'] if o.get('long') else C.EN['product']))
    tenant = (D['tenant'] if D else (C.EN['tenant_long'] if o.get('long') else C.EN['tenant']))
    site = (D['site'] if D else (C.EN['site_long'] if o.get('long') else C.EN['site']))
    user = (D['user'] if D else (C.EN['user_long'] if o.get('long') else C.EN['user']))
    env = (D['env'] if D else C.EN['env'])
    exp = o.get('expanded')  # which topbar surface is open
    unread = o.get('unread', '3')
    navy = ' is-navy' if o.get('navy') else ''
    parts = [f'<a class="paep-skip-link{" is-shown" if o.get("skip_shown") else ""}" href="#main">{esc(k("paep.shell.skipLink.main", lang))}</a>',
             f'<header class="shell-topbar{navy}" data-region="SHELL-REGION-BANNER">']
    parts.append(f'<button type="button" class="shell-tb-btn show-below-desktop" aria-label="{esc(k("paep.shell.nav.open", lang))}" aria-expanded="{"true" if exp=="nav" else "false"}" aria-controls="nav-sheet">{ic("menu")}</button>')
    parts.append(f'<a class="shell-product" href="#home" aria-label="{esc(k("paep.shell.banner.product.home", lang, product=product))}" data-region="SHELL-REGION-PRODUCT">{MARK_INLINE}<span class="shell-product__name">{esc(product)}</span></a>')
    if o.get('env', True):
        parts.append(f'<span class="paep-badge paep-badge--warning shell-env hide-narrow">{ic("environment","sm")}{esc(env)}</span>')
    multi = o.get('multi_context', True)
    ctx_inner = f'{ic("building")}<span class="shell-context__text"><span class="shell-context__tenant">{esc(tenant)}</span><span class="shell-context__site">{esc(site)}</span></span>'
    if multi:
        parts.append(f'<button type="button" class="shell-context hide-below-desktop-no" data-region="SHELL-REGION-CONTEXT" aria-haspopup="dialog" aria-label="{esc(k("paep.shell.context.label", lang))}: {esc(tenant)}, {esc(site)}. {esc(k("paep.shell.context.switch", lang))}">{ctx_inner}{ic("chevron-down","sm")}</button>')
    else:
        parts.append(f'<div class="shell-context" role="group" aria-label="{esc(k("paep.shell.context.label", lang))}" data-region="SHELL-REGION-CONTEXT">{ctx_inner}</div>')
    parts.append(f'<search class="shell-search" data-region="SHELL-REGION-SEARCH">'
                 f'<button type="button" class="shell-search-trigger hide-below-desktop" aria-haspopup="dialog" aria-keyshortcuts="Control+K Meta+K">{ic("search")}<span class="shell-search-trigger__label">{esc(k("paep.shell.search.trigger", lang))}</span><kbd class="shell-kbd" aria-hidden="true">{esc(k("paep.shell.search.shortcut", lang))}</kbd></button>'
                 f'<button type="button" class="shell-tb-btn show-below-desktop" aria-haspopup="dialog" aria-label="{esc(k("paep.shell.search.trigger", lang))}" aria-keyshortcuts="Control+K Meta+K">{ic("search")}</button></search>')
    parts.append('<span class="shell-spacer"></span><div class="shell-actions" data-region="SHELL-REGION-GLOBAL-ACTIONS">')
    conn = o.get('conn', 'online')
    if conn == 'online':
        parts.append(f'<span class="shell-conn hide-narrow" role="img" aria-label="{esc(k("paep.shell.connectivity.online", lang))}">{ic("signal","sm")}<span class="hide-below-desktop" aria-hidden="true">{esc(k("paep.shell.connectivity.online", lang))}</span></span>')
    if o.get('multi_locale', True):
        lname, lcode = {'ar': ('العربية', 'AR'), 'he': ('עברית', 'HE')}.get(lang, ('English', 'EN'))
        parts.append(f'<button type="button" class="shell-tb-btn hide-narrow" aria-label="{esc(k("paep.shell.locale.button", lang, language=lname))}" aria-haspopup="menu" aria-expanded="{"true" if exp=="locale" else "false"}">{ic("globe")}<span class="shell-lang__code" dir="ltr" aria-hidden="true">{lcode}</span></button>')
    parts.append(f'<button type="button" class="shell-tb-btn hide-narrow" aria-label="{esc(k("paep.shell.help.button", lang))}" aria-haspopup="menu" aria-expanded="{"true" if exp=="help" else "false"}">{ic("help")}</button>')
    nlabel = k('paep.shell.notifications.button', lang)
    badge = ''
    if unread and unread not in ('0', 'loading', 'error', 'none'):
        nlabel += ', ' + k('paep.shell.notifications.unread', lang, count=unread)
        badge = f'<span class="paep-count-badge" aria-hidden="true" dir="ltr">{esc(unread)}</span>'
    elif unread == 'loading':
        badge = f'<span class="paep-count-badge paep-count-badge--neutral" aria-hidden="true">…</span>'
    elif unread == 'error':
        nlabel += ', count not available'
        badge = f'<span class="paep-count-badge paep-count-badge--neutral" aria-hidden="true">?</span>'
    if unread != 'none':
        parts.append(f'<span data-region="SHELL-REGION-NOTIFICATIONS"><button type="button" class="shell-tb-btn" aria-label="{esc(nlabel)}" aria-haspopup="dialog" aria-expanded="{"true" if exp=="notif" else "false"}">{ic("bell")}{badge}</button></span>')
    acct_label = k('paep.shell.account.button', lang) + ': ' + user
    parts.append(f'<span data-region="SHELL-REGION-ACCOUNT"><button type="button" class="shell-tb-btn" aria-label="{esc(acct_label)}" aria-haspopup="menu" aria-expanded="{"true" if exp=="account" else "false"}">{ic("user")}<span class="shell-account__name hide-below-desktop" aria-hidden="true">{esc(user)}</span>{ic("chevron-down","sm","hide-below-desktop")}</button></span>')
    parts.append('</div></header>')
    return ''.join(parts)

# ---------------- status strip ----------------
def status(o):
    lang = L(o); rows = []
    conn = o.get('conn', 'online')
    if o.get('impersonation'):
        rows.append(('info', 'impersonate', k('paep.shell.impersonation', lang, agent=C.EN['impersonator'], user=C.EN['user']), None, k('paep.shell.impersonation.end', lang)))
    if conn == 'offline':
        rows.append(('warning', 'cloud-off', k('paep.shell.connectivity.offline', lang), k('paep.shell.connectivity.offline.body', lang), None))
    elif conn == 'degraded':
        rows.append(('warning', 'signal-low', k('paep.shell.connectivity.degraded', lang), k('paep.shell.connectivity.degraded.body', lang), None))
    elif conn == 'unknown':
        rows.append(('neutral', 'unknown', k('paep.shell.connectivity.unknown', lang), k('paep.shell.connectivity.unknown.body', lang), None))
    if o.get('session_expiring'):
        rows.append(('warning', 'pending', k('paep.shell.session.expiring', lang, minutes=5), None, k('paep.shell.session.continue', lang)))
    if o.get('env_notice'):
        rows.append(('neutral', 'environment', k('paep.shell.env.notice', lang, environment=C.EN['env']), None, None))
    if not rows: return ''
    out = [f'<div class="shell-status" role="region" aria-label="{esc(k("paep.shell.status.label", lang))}" data-region="SHELL-REGION-STATUS"><div role="status">']
    shown = rows
    if o.get('stack_collapsed') and len(rows) > 1:
        shown = rows[:1]
    for tone, icon, title, body, action in shown:
        b = f' <span>{esc(body)}</span>' if body else ''
        a = f'<button type="button" class="paep-button paep-button--secondary">{esc(action)}</button>' if action else ''
        out.append(f'<div class="shell-status__row shell-status__row--{tone}">{ic(icon)}<strong>{esc(title)}</strong>{b}{a}</div>')
    if shown is not rows:
        out.append(f'<div class="shell-status__row shell-status__row--neutral shell-status__row--more"><button type="button" class="paep-button paep-button--tertiary" aria-expanded="false">{ic("chevron-down","sm")}{esc(k("paep.shell.status.more", lang, count=len(rows)-1))}</button></div>')
    out.append('</div></div>')
    return ''.join(out)

# ---------------- navigation ----------------
def reason_label(r, lang='en'): return k('paep.shell.locked.' + r, lang)

def nav_items(o, in_sheet=False):
    lang = L(o); current = o.get('current', 'all'); out = []
    q10 = o.get('q10', 'hide')  # recommended: hide permission-denied items
    open_groups = o.get('open_groups', {'records', 'operations', 'reports', 'admin', 'overview'})
    badges = o.get('badges', {})
    for gid, glabel, gicon, items in C.NAV:
        gl = label_for(o, gid=gid, default=glabel)
        is_open = gid in open_groups
        out.append(f'<li class="shell-nav__group"><button type="button" class="shell-nav__group-btn" aria-expanded="{"true" if is_open else "false"}" aria-controls="g-{gid}{"-s" if in_sheet else ""}">{ic(gicon)}<span>{esc(gl)}</span>{ic("chevron-up" if is_open else "chevron-down","sm","shell-nav__chev")}</button>')
        if is_open:
            out.append(f'<ul class="shell-nav__items" id="g-{gid}{"-s" if in_sheet else ""}">')
            for iid, ilabel, avail, badge in items:
                il = label_for(o, iid=iid, default=ilabel)
                badge = badges.get(iid, badge)
                if avail == 'denied':
                    if q10 == 'hide': continue
                    avail = ('locked', 'permission')
                cur = ' aria-current="page"' if iid == current else ''
                meta = ''
                if isinstance(avail, tuple):
                    r = avail[1]; ricon = C.REASONS[r][0]
                    rl = reason_label(r, lang)
                    out.append(f'<li><a class="shell-nav__link is-locked" href="#locked-{iid}"{cur} aria-label="{esc(k("paep.shell.nav.locked", lang, label=il, reason=rl))}"><span class="shell-nav__label">{esc(il)}</span><span class="shell-nav__meta" aria-hidden="true">{ic(ricon,"sm")}</span></a></li>')
                    continue
                if badge == 'loading':
                    meta = f'<span class="shell-nav__meta">{ic("spinner","sm")}<span class="shell-sr">{esc(k("paep.shell.nav.count.loading", lang))}</span></span>'
                elif badge == 'unknown':
                    meta = f'<span class="shell-nav__meta"><span class="paep-count-badge paep-count-badge--neutral" aria-hidden="true">–</span><span class="shell-sr">{esc(k("paep.shell.nav.count.unknown", lang))}</span></span>'
                elif badge:
                    meta = f'<span class="shell-nav__meta"><span class="paep-count-badge paep-count-badge--neutral" aria-hidden="true" dir="ltr">{esc(badge)}</span><span class="shell-sr">, {esc(k("paep.shell.nav.count", lang, count=badge))}</span></span>'
                out.append(f'<li><a class="shell-nav__link" href="#{iid}"{cur}><span class="shell-nav__label">{esc(il)}</span>{meta}</a></li>')
                if iid == 'all' and o.get('nested'):
                    out.append(f'<li><a class="shell-nav__link shell-nav__child" href="#all-archived"{AC if current=="archived" else ""}><span class="shell-nav__label">Archived records</span></a></li>')
            out.append('</ul>')
        out.append('</li>')
    return ''.join(out)

def sidebar(o):
    lang = L(o)
    if o.get('collapsed'):
        cur_group = o.get('current_group', 'records'); btns = []
        for gid, glabel, gicon, items in C.NAV:
            gl = C.SHORT.get(gid, glabel) if lang == 'en' else label_for(o, gid=gid, default=glabel)
            is_cur = ' aria-current="true"' if gid == cur_group else ''
            exp = 'true' if o.get('flyout') == gid else 'false'
            btns.append(f'<li><button type="button" class="shell-rail__btn"{is_cur} aria-expanded="{exp}">{ic(gicon)}<span>{esc(gl)}</span></button></li>')
        fly = ''
        if o.get('flyout'):
            g = [x for x in C.NAV if x[0] == o['flyout']][0]
            items = ''.join(f'<li><a class="shell-nav__link" href="#{iid}"{AC if iid==o.get("current","all") else ""}><span class="shell-nav__label">{esc(il)}</span></a></li>' for iid, il, av, b in g[3] if av == 'available')
            fly = f'<div class="shell-flyout" style="inset-block-start:{3 + 3.75*[x[0] for x in C.NAV].index(o["flyout"])}rem"><h2>{esc(g[1])}</h2><ul>{items}</ul></div>'
        return (f'<nav class="shell-nav" aria-label="{esc(k("paep.shell.nav.label", lang))}" data-region="SHELL-REGION-NAV">'
                f'<div class="shell-nav__head"><button type="button" class="shell-tb-btn shell-collapse" aria-label="{esc(k("paep.shell.nav.expand", lang))}" aria-expanded="false">{ic("panel-start")}</button></div>'
                f'<ul class="shell-rail">{"".join(btns)}</ul>{fly}</nav>')
    return (f'<nav class="shell-nav" aria-label="{esc(k("paep.shell.nav.label", lang))}" data-region="SHELL-REGION-NAV">'
            f'<div class="shell-nav__head"><button type="button" class="shell-tb-btn shell-collapse" aria-label="{esc(k("paep.shell.nav.collapse", lang))}" aria-expanded="true">{ic("panel-start")}</button></div>'
            f'<ul>{nav_items(o)}</ul></nav>')

# ---------------- page frame ----------------
def page_header(o, title, crumbs=None, status_badge=None, actions=True, context=True):
    lang = L(o)
    D = C.AR if lang == 'ar' else C.HE if lang == 'he' else None
    tenant = D['tenant'] if D else (C.EN['tenant_long'] if o.get('long') else C.EN['tenant'])
    site = D['site'] if D else C.EN['site']
    bc = ''
    if crumbs:
        lis = ''.join(f'<li><a href="#c{i}">{esc(c)}</a></li>' for i, c in enumerate(crumbs))
        bc = f'<nav class="paep-breadcrumb" aria-label="{esc(k("paep.shell.breadcrumb.label", lang))}"><ol>{lis}</ol></nav>'
    ctx = ''
    if context:
        sb = f'<span class="paep-badge paep-badge--{status_badge[0]}">{esc(C.t(status_badge[1], lang))}</span>' if status_badge else ''
        ctx = (f'<div class="pf-context"><span class="pf-context__tenant" style="gap:var(--paep-space-1);align-items:center">{ic("building","sm")}'
               f'<span><span class="shell-sr">{esc(k("paep.shell.context.label", lang))}: </span>{esc(tenant)} · {esc(site)}</span></span>{sb}'
               f'<span>{esc(C.t("Sorted by reference", lang))}</span></div>')
    act = ''
    if actions:
        more = k('paep.shell.page.more', lang)
        act = (f'<div class="pf-actions"><button type="button" class="paep-button paep-button--secondary">{esc(C.t("Assign owner", lang))}</button>'
               f'<button type="button" class="paep-button paep-button--primary">{ic("plus")}{esc(C.t("New record", lang))}</button>'
               f'<button type="button" class="paep-button paep-button--tertiary paep-icon-button" aria-label="{esc(more)}" aria-haspopup="menu" aria-expanded="false">{ic("more")}</button></div>')
    return f'<div data-region="SHELL-REGION-PAGE-HEADER">{bc}<div class="pf-header"><div class="pf-titles"><h1 id="page-title" tabindex="-1">{esc(title)}</h1>{ctx}</div>{act}</div></div>'

def records_table(rows=6, lang='en'):
    data = [('REC-000184', 'Quarterly inspection summary', 'In review', 'warning'), ('REC-000183', 'Supplier onboarding pack', 'Approved', 'success'),
            ('REC-000182', 'Maintenance window notice', 'Draft', 'neutral'), ('REC-000181', 'Access review for Site 04', 'Approved', 'success'),
            ('REC-000180', 'Incident follow-up actions', 'Rejected', 'error'), ('REC-000179', 'Training attendance list', 'In review', 'warning')][:rows]
    trs = ''.join(f'<tr><td><a href="#{r}" dir="ltr">{r}</a></td><td>{esc(C.t(t, lang))}</td><td><span class="paep-badge paep-badge--{tone}">{esc(C.t(s, lang))}</span></td></tr>' for r, t, s, tone in data)
    return (f'<div class="paep-table-shell"><div class="paep-table-scroll"><table class="paep-table"><caption class="vh">{esc(C.t("Records", lang))}</caption>'
            f'<thead><tr><th scope="col">{esc(C.t("Reference", lang))}</th><th scope="col">{esc(C.t("Title", lang))}</th><th scope="col">{esc(C.t("Status", lang))}</th></tr></thead><tbody>{trs}</tbody></table></div></div>')

def page_content(o):
    kind = o.get('content', 'records'); lang = L(o)
    if kind == 'records':
        return records_table(lang=lang)
    if kind == 'loading':
        return (f'<div role="status" aria-live="polite"><span class="shell-sr">{esc(k("paep.shell.page.loading", lang))}</span></div>'
                '<div class="paep-skeleton" aria-hidden="true">' + ''.join('<div class="paep-skeleton__block" style="block-size:2.5rem"></div>' for _ in range(6)) + '</div>')
    if kind == 'empty':
        return f'<div class="paep-empty">{ic("empty","lg")}<p class="t-title-sm" style="margin:0">{esc(k("paep.shell.page.empty", lang))}</p><p style="margin:0">Records you create appear here.</p><button type="button" class="paep-button paep-button--primary">{ic("plus")}New record</button></div>'
    if kind == 'error':
        return (f'<div class="paep-alert paep-alert--error" role="alert">{ic("error","md","paep-alert__icon")}<div class="paep-alert__body"><p class="paep-alert__title" style="margin:0;font-weight:700">Records could not be loaded</p>'
                f'<p style="margin:0">The service did not respond. Reference <code dir="ltr">c0a8-7f3e-51d2</code>.</p></div><div class="paep-alert__actions"><button type="button" class="paep-button paep-button--secondary">{ic("retry")}Try again</button></div></div>')
    return o.get('html', '')

def main(o, inner):
    return f'<main id="main" class="shell-main" tabindex="-1" data-region="SHELL-REGION-MAIN">{inner}</main>'

def shell(o, inner, overlay=''):
    lang = L(o)
    live = f'<div class="shell-sr" aria-live="polite" data-region="SHELL-REGION-LIVE">{esc(o.get("announce",""))}</div><div class="shell-sr" aria-live="assertive"></div>'
    frame_cls = 'shell-frame' + (' is-collapsed' if o.get('collapsed') else '')
    return (topbar(o) + status(o) + f'<div class="{frame_cls}">' + sidebar(o) + main(o, inner) + '</div>' + live + overlay)

def standard_page(o, title='All records', crumbs=('Home', 'Records'), status_badge=('info', '6 records'), toolbar=False, aside=False):
    lang = L(o)
    if lang in ('ar', 'he'):
        D = C.AR if lang == 'ar' else C.HE; title = D['title']; crumbs = (D['items']['home'], D['groups']['records'])
    tb = ''
    if toolbar:
        tb = (f'<div class="pf-toolbar" data-region="SHELL-REGION-PAGE-TOOLBAR" role="group" aria-label="{esc(C.t("Filters", lang))}">'
              f'<div class="paep-field"><label class="paep-field__label" for="f-status">{esc(C.t("Status", lang))}</label><div class="paep-control paep-control--select"><select id="f-status"><option>{esc(C.t("Any status", lang))}</option></select>{ic("chevron-down")}</div></div>'
              f'<div class="paep-field"><label class="paep-field__label" for="f-owner">{esc(C.t("Owner", lang))}</label><div class="paep-control"><input id="f-owner" type="text" value=""></div></div>'
              f'<button type="button" class="paep-button paep-button--secondary">{esc(C.t("Apply", lang))}</button><button type="button" class="paep-button paep-button--tertiary">{esc(C.t("Reset", lang))}</button></div>')
    body = f'<div class="pf-body{" has-aside" if aside else ""}" data-region="SHELL-REGION-CONTENT"><div>{page_content(o)}</div>'
    if aside:
        body += f'<aside class="pf-aside" aria-labelledby="aside-h" data-region="SHELL-REGION-ASIDE"><h2 id="aside-h">{esc(k("paep.shell.page.aside", lang))}</h2><dl class="paep-dl"><dt>{esc(C.t("Owner", lang))}</dt><dd>{esc(C.AR["user"] if lang=="ar" else C.HE["user"] if lang=="he" else "Alex Morgan")}</dd><dt>{esc(C.t("Site", lang))}</dt><dd>{esc(C.t("Site", lang))} 04</dd><dt>{esc(C.t("Reference", lang))}</dt><dd dir="ltr">REC-000184</dd></dl></aside>'
    body += '</div>'
    return page_header(o, title, crumbs, status_badge) + tb + body
