# PAEP candidate icon set: authored for HOF-IB2-001 from geometric primitives on a 24x24 grid.
# Stroke model: 2px stroke at 24px, round caps/joins, no fill (except dots), currentColor.
ICONS = {
 'check':        ('<path d="M5 12.5l5 5L19 7"/>', False, 'Confirmation, checked state'),
 'close':        ('<path d="M6 6l12 12M18 6L6 18"/>', False, 'Dismiss, close overlay'),
 'chevron-start':('<path d="M15 5l-7 7 7 7"/>', True, 'Previous, back, collapse towards start'),
 'chevron-end':  ('<path d="M9 5l7 7-7 7"/>', True, 'Next, forward, breadcrumb separator'),
 'chevron-down': ('<path d="M5 9l7 7 7-7"/>', False, 'Expand, open select/menu'),
 'chevron-up':   ('<path d="M5 15l7-7 7 7"/>', False, 'Collapse'),
 'page-first':   ('<path d="M6 5v14M17 5l-7 7 7 7"/>', True, 'First page'),
 'page-last':    ('<path d="M18 5v14M7 5l7 7-7 7"/>', True, 'Last page'),
 'more':         ('<circle cx="5.5" cy="12" r="1.6" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none"/><circle cx="18.5" cy="12" r="1.6" fill="currentColor" stroke="none"/>', False, 'Overflow (more actions); always paired with visible text or accessible name'),
 'info':         ('<circle cx="12" cy="12" r="9"/><path d="M12 11v5.5"/><circle cx="12" cy="7.8" r="1.2" fill="currentColor" stroke="none"/>', False, 'Information status (circle shape)'),
 'success':      ('<circle cx="12" cy="12" r="9"/><path d="M8 12.5l3 3 5.5-6"/>', False, 'Success status (circle + tick)'),
 'warning':      ('<path d="M12 3.5L21.5 20h-19z"/><path d="M12 10v4"/><circle cx="12" cy="17.1" r="1.2" fill="currentColor" stroke="none"/>', False, 'Warning status (triangle shape)'),
 'error':        ('<path d="M8.3 3h7.4L21 8.3v7.4L15.7 21H8.3L3 15.7V8.3z"/><path d="M12 7.5V13"/><circle cx="12" cy="16.4" r="1.2" fill="currentColor" stroke="none"/>', False, 'Error status (octagon shape)'),
 'neutral':      ('<circle cx="12" cy="12" r="8"/><path d="M8.5 12h7"/>', False, 'Neutral / not started status'),
 'pending':      ('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/>', False, 'Pending / in progress status'),
 'minus':        ('<path d="M6 12h12"/>', False, 'Indeterminate checkbox'),
 'plus':         ('<path d="M12 6v12M6 12h12"/>', False, 'Add / create'),
 'delete':       ('<path d="M4 7h16M9.5 7V4.5h5V7M6.5 7l1 13h9l1-13M10 11v5.5M14 11v5.5"/>', False, 'Destructive delete (always with text)'),
 'search':       ('<circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5L20 20"/>', False, 'Search'),
 'no-results':   ('<circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5L20 20M8.3 8.3l4.4 4.4M12.7 8.3l-4.4 4.4"/>', False, 'Filtered, no results'),
 'empty':        ('<path d="M3 13h5l1.5 3h5l1.5-3h5"/><path d="M5.5 5h13L21 13v6H3v-6z"/>', False, 'Genuinely empty collection'),
 'retry':        ('<path d="M19.5 12a7.5 7.5 0 1 1-2.2-5.3"/><path d="M19.5 4.5V9H15"/>', False, 'Retry / reload (not mirrored: clockwise meaning)'),
 'external':     ('<path d="M14 4h6v6M20 4l-8.5 8.5M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>', True, 'Opens outside the current context'),
 'contents':     ('<path d="M4 7h16M4 12h16M4 17h10"/>', False, 'UI-lab contents disclosure (not an enterprise-shell menu)'),
 'spinner':      ('<path d="M12 3a9 9 0 1 1-9 9"/>', False, 'Busy indicator (rotates; static under reduced motion)'),
}
def symbol(name):
    body,_,_=ICONS[name]
    return f'<symbol id="paep-i-{name}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">{body}</symbol>'
def sprite():
    return '<svg xmlns="http://www.w3.org/2000/svg" style="display:none" aria-hidden="true">'+''.join(symbol(n) for n in ICONS)+'</svg>'
def standalone(name):
    body,_,_=ICONS[name]
    return f'<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><!-- PAEP candidate icon "{name}" - HOF-IB2-001 - independently authored, ProSEIT-owned --><title>{name}</title>{body}</svg>\n'
def ic(name, size='md', extra=''):
    mirror = ' paep-icon--mirror' if ICONS[name][1] else ''
    spin = ' paep-icon--spin' if name=='spinner' else ''
    return f'<svg class="paep-icon paep-icon--{size}{mirror}{spin}{(" "+extra) if extra else ""}" aria-hidden="true" focusable="false"><use href="#paep-i-{name}"/></svg>'
