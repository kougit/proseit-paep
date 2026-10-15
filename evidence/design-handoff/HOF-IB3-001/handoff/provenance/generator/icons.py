# HOF-IB3-001 icon set.
# 1) The 25 accepted PAEP icons are loaded unchanged from the approved HOF-IB2-001 v1.1 generator (ProSEIT-owned).
# 2) SHELL icons below are PROPOSED for @proseit/paep-foundation, authored in HOF-IB3-001 from geometric
#    primitives on the same 24x24 grid: 2px stroke, round caps/joins, no fill except dots, currentColor.
import os
IB2_ICONS_PY = os.environ.get('IB2_ICONS_PY', '/mnt/project-files/ib2/handoff/HOF-IB2-001/provenance/generator/icons.py')
_ns = {}
exec(compile(open(IB2_ICONS_PY).read(), IB2_ICONS_PY, 'exec'), _ns)
ACCEPTED = dict(_ns['ICONS'])

SHELL = {
 # name: (body, mirrorsInRtl, meaning)
 'menu':          ('<path d="M4 6.5h16M4 12h16M4 17.5h16"/>', False, 'Open the mobile navigation container (always with an accessible name)'),
 'panel-start':   ('<rect x="3.5" y="4.5" width="17" height="15" rx="2"/><path d="M9.5 4.5v15M15.5 10l-2 2 2 2"/>', True, 'Collapse / expand the persistent navigation (points toward inline-start)'),
 'bell':          ('<path d="M6.5 16.5V11a5.5 5.5 0 0 1 11 0v5.5l1.5 2h-14z"/><path d="M10 21h4"/>', False, 'Notifications'),
 'user':          ('<circle cx="12" cy="8.5" r="3.5"/><path d="M5 20a7 7 0 0 1 14 0"/>', False, 'Account'),
 'help':          ('<circle cx="12" cy="12" r="9"/><path d="M9.6 9.4a2.5 2.5 0 1 1 3.4 2.4c-.6.3-1 .8-1 1.4v.6"/><circle cx="12" cy="16.9" r="1.2" fill="currentColor" stroke="none"/>', False, 'Help (app-configured hook)'),
 'globe':         ('<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.6 2.6 3.8 5.6 3.8 9s-1.2 6.4-3.8 9M12 3c-2.6 2.6-3.8 5.6-3.8 9s1.2 6.4 3.8 9"/>', False, 'Locale and direction'),
 'building':      ('<path d="M3 21h18M5 21V5.5L12 3.5V21M12 8.5h7V21"/><path d="M8 8.5h1M8 12h1M8 15.5h1M15 12h1M15 15.5h1"/>', False, 'Tenant / site context'),
 'lock':          ('<rect x="5" y="10.5" width="14" height="10" rx="1.5"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/><path d="M12 14.5v2.5"/>', False, 'Locked: permission'),
 'edition':       ('<path d="M12 3.5l8.5 4.5L12 12.5 3.5 8z"/><path d="M3.5 12L12 16.5 20.5 12M3.5 16l8.5 4.5 8.5-4.5"/>', False, 'Locked: edition / plan'),
 'sliders':       ('<path d="M4 7h8M17 7h3M4 17h3M12 17h8"/><circle cx="14.5" cy="7" r="2.5"/><circle cx="9.5" cy="17" r="2.5"/>', False, 'Locked: configuration'),
 'device':        ('<rect x="6.5" y="3" width="11" height="18" rx="2"/><path d="M10.5 17.5h3"/>', False, 'Locked: environment / capability'),
 'signal':        ('<path d="M5 19.5v-3M10 19.5v-6.5M15 19.5v-10M20 19.5v-14"/>', False, 'Connectivity: online'),
 'signal-low':    ('<path d="M5 19.5v-3M10 19.5v-6.5"/><circle cx="15" cy="19" r="1.1" fill="currentColor" stroke="none"/><circle cx="20" cy="19" r="1.1" fill="currentColor" stroke="none"/>', False, 'Connectivity: degraded'),
 'cloud-off':     ('<path d="M7.5 18.5h9.8a3.7 3.7 0 0 0 1.3-7.2A6 6 0 0 0 7.3 9 4.8 4.8 0 0 0 7.5 18.5z"/><path d="M4 4l16 16"/>', False, 'Connectivity: offline'),
 'unknown':       ('<rect x="3.5" y="3.5" width="17" height="17" rx="3"/><path d="M9.8 9.6a2.3 2.3 0 1 1 3.1 2.2c-.6.3-.9.7-.9 1.3v.4"/><circle cx="12" cy="16.6" r="1.1" fill="currentColor" stroke="none"/>', False, 'Connectivity: unknown'),
 'impersonate':   ('<circle cx="9" cy="8" r="3.2"/><path d="M3 19.5a6 6 0 0 1 10.5-4"/><path d="M16 13.5l3 3-3 3M19 16.5h-6"/>', True, 'Support impersonation in effect'),
 'environment':   ('<path d="M4 20V5.5M4 5.5h12l-2 3.5 2 3.5H4"/>', False, 'Non-production environment'),
 'home':          ('<path d="M3.5 11L12 4l8.5 7M6 9v11h12V9"/><path d="M10 20v-5h4v5"/>', False, 'Navigation group sample: Overview'),
 'list':          ('<path d="M9 6.5h11M9 12h11M9 17.5h11"/><circle cx="4.8" cy="6.5" r="1.2" fill="currentColor" stroke="none"/><circle cx="4.8" cy="12" r="1.2" fill="currentColor" stroke="none"/><circle cx="4.8" cy="17.5" r="1.2" fill="currentColor" stroke="none"/>', False, 'Navigation group sample: Records'),
 'tasks':         ('<rect x="4" y="4" width="16" height="16" rx="2"/><path d="M8 12l2.5 2.5L16 9"/>', False, 'Navigation group sample: Operations'),
 'document':      ('<path d="M6 3.5h8l4 4V20.5H6z"/><path d="M14 3.5V8h4M9 12.5h6M9 16h6"/>', False, 'Navigation group sample: Reports (neutral label only)'),
 'shield':        ('<path d="M12 3l7.5 3v5.5c0 4.4-3.2 8-7.5 9.5-4.3-1.5-7.5-5.1-7.5-9.5V6z"/>', False, 'Navigation group sample: Administration'),
 'sign-out':      ('<path d="M10 4.5H5.5v15H10"/><path d="M15 8l4 4-4 4M19 12H9.5"/>', True, 'Sign out'),
 'keyboard':      ('<rect x="2.5" y="6" width="19" height="12" rx="2"/><path d="M6 10h1M9.5 10h1M13 10h1M16.5 10h1M8 14h8"/>', False, 'Keyboard shortcut hint'),
}
ICONS = {**ACCEPTED, **SHELL}

def symbol(name):
    body = ICONS[name][0]
    return f'<symbol id="paep-i-{name}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">{body}</symbol>'

def sprite():
    return '<svg xmlns="http://www.w3.org/2000/svg" style="display:none" aria-hidden="true">' + ''.join(symbol(n) for n in ICONS) + '</svg>'

def standalone(name):
    body = ICONS[name][0]
    return (f'<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" '
            f'stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><!-- PAEP shell icon "{name}" - PROPOSED in HOF-IB3-001 - '
            f'independently authored, ProSEIT-owned --><title>{name}</title>{body}</svg>\n')

def ic(name, size='md', extra=''):
    mirror = ' paep-icon--mirror' if ICONS[name][1] else ''
    spin = ' paep-icon--spin' if name == 'spinner' else ''
    return f'<svg class="paep-icon paep-icon--{size}{mirror}{spin}{(" " + extra) if extra else ""}" aria-hidden="true" focusable="false"><use href="#paep-i-{name}"/></svg>'

MARK = ('<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">'
        '<!-- Neutral placeholder product mark - HOF-IB3-001 - authored-in-HOF-IB3-001; replaced by each product\'s approved brand asset -->'
        '<title>Placeholder product mark</title><rect width="32" height="32" rx="6" fill="#24364B"/>'
        '<path d="M9 22L16 9l7 13" fill="none" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>'
        '<path d="M12 18h8" stroke="#D4A62A" stroke-width="2.5" stroke-linecap="round"/></svg>\n')
