from pages3 import *
def dialog(did, title, body, foot, size='', initial=None, desc=None):
    d=f' aria-describedby="{desc}"' if desc else ''
    return (f'<dialog class="paep-dialog {size}" data-open-modal aria-labelledby="{did}-t"{d} id="{did}"><div class="paep-dialog__head"><h2 class="t-title" id="{did}-t" tabindex="-1"{" data-initial-focus" if initial=="title" else ""}>{esc(title)}</h2>'
            f'{ibtn("Close","close","tertiary")}</div><div class="paep-dialog__body">{body}</div><div class="paep-dialog__foot">{foot}</div></dialog>')
EXA=' aria-expanded="true" aria-controls="pop1"'
EXB=' aria-expanded="true"'
ov_notes=lambda cid: notes(cid)
ctx=lambda t: f'<div class="stage"><p style="margin:0">{t}</p><div class="row">{btn("Open again","secondary")}</div></div>'

d1=dialog('dlg1','Delete supplier record REC-2026-000184?',
 '<p id="dlg1-d">This permanently deletes the record and its 3 attachments. This cannot be undone.</p>',
 btn('Cancel','secondary',extra=' data-initial-focus data-close')+btn('Delete record','destructive','delete'),'paep-dialog--sm',desc='dlg1-d')
P['SCR-IB2-C06A']=page('SCR-IB2-C06A', ctx('Invoking context: the "Delete record" action. Focus returns here when the dialog closes.')+ov_notes('dialog'), extra_after=d1,
  intro=intro('Destructive confirmation: small dialog, explicit outcome in the title and button, initial focus on Cancel, Escape = Cancel.'))
long_body=''.join(f'<h3 class="t-title-sm" style="margin-block:var(--paep-space-3) var(--paep-space-2)">Section {k}</h3><p>Terms paragraph {k}. This sample text is long enough to exceed the viewport height so that the dialog body scrolls while the header and the actions stay visible. Use neutral wording only; no production content is shown.</p><p>Additional detail for section {k}, including an unbroken identifier <span class="paep-mono" dir="ltr">REC-2026-000184-ATTACHMENT-ARCHIVE-{k:04d}</span> that must wrap.</p>' for k in range(1,9))
d2=dialog('dlg2','Review the data-handling terms before you continue', long_body, btn('Decline','secondary')+btn('Accept and continue'), initial='title')
P['SCR-IB2-C06B']=page('SCR-IB2-C06B', ctx('Invoking context.')+ov_notes('dialog'), extra_after=d2,
  intro=intro('Long content: max-height is the viewport minus 48 px (32 px narrow); body scrolls; header gains a divider; focus enters on the title.'))
formb=f'<div class="grid-2">{field("Reference", value="REC-2026-000190", required=True)}{field("Name", value="", required=True, error="Enter a name.")}{field("Site", kind="select", options=["Site 1","Site 2","Site 3"], value="Site 2")}{field("Quantity", value="10", suffix="units")}</div>{field("Notes", kind="textarea")}'
d3=dialog('dlg3','Create record', formb, btn('Cancel','secondary')+btn('Create record'), 'paep-dialog--lg')
P['SCR-IB2-C06C']=page('SCR-IB2-C06C', ctx('Invoking context.')+ov_notes('dialog'), extra_after=d3,
  intro=intro('Large form dialog (50 rem). Below 600 px it becomes full screen, because a form needs the whole viewport at that size.'))
drw=(f'<dialog class="paep-drawer" data-open-modal aria-labelledby="drw-t"><div class="paep-drawer__head"><h2 class="t-title" id="drw-t" tabindex="-1" data-initial-focus>Record REC-2026-000185</h2>{ibtn("Close","close","tertiary")}</div>'
     f'<div class="paep-drawer__body"><div class="row">{badge("Awaiting review","warning")}</div><dl class="paep-dl"><dt>Name</dt><dd>Sample item Beta with a longer descriptive name</dd><dt>Location</dt><dd>Site 1 · Yard</dd><dt>Quantity</dt><dd class="paep-num" style="text-align:start">87.50</dd><dt>Updated</dt><dd>2026-09-20</dd></dl>'
     f'{tabs(["Summary","History","Attachments (3)"],label="Record detail views")}</div><div class="paep-drawer__foot">{btn("Close","secondary")}{btn("Open full record")}</div></dialog>')
P['SCR-IB2-C06D']=page('SCR-IB2-C06D', ctx('Invoking context: a table row\'s "Open" action.')+ov_notes('drawer'), extra_after=drw,
  intro=intro('Drawer opens from the inline-end edge: 30 rem on desktop, leaves a context strip on tablet, full width below 600 px.'))
pop_a=(f'<div style="position:relative;display:inline-block">{btn("Column help","secondary","info",extra=EXA)}'
       f'<div class="paep-popover" id="pop1" style="inset-block-start:calc(100% + 8px);inset-inline-start:0"><span class="paep-popover__arrow" style="inset-block-start:-6px;inset-inline-start:18px"></span><p class="t-title-sm" style="margin:0 0 4px">Quantity</p><p class="t-body-sm" style="margin:0">Net quantity after returns. Values are rounded to two decimals.</p></div></div>')
pop_b=(f'<div style="position:relative;display:inline-block">'
       f'<div class="paep-popover" style="inset-block-end:calc(100% + 8px);inset-inline-end:0"><span class="paep-popover__arrow" style="inset-block-end:-6px;inset-inline-end:18px;rotate:225deg"></span><p class="t-body-sm" style="margin:0">Flipped above: not enough space below the trigger, and shifted to stay 16 px inside the viewport edge.</p></div>'
       f'{btn("Status help","secondary","info",extra=EXB)}</div>')
P['SCR-IB2-C06E']=page('SCR-IB2-C06E', f'''<section class="specimen"><h2 class="t-heading-2">Popover</h2><div class="stage" style="min-block-size:22rem;justify-content:space-between">
<div class="row">{pop_a}</div><div style="block-size:6rem"></div><div class="row" style="justify-content:flex-end;margin-block-start:7rem">{pop_b}</div></div>{notes("popover")}</section>''',
  intro=intro('Anchored, opened by click/Enter only, flips and shifts at edges; min(20 rem, 100vw − 32 px) wide at narrow sizes.'))
P['SCR-IB2-C06E']=P['SCR-IB2-C06E'].replace('aria-expanded=\\"true\\"','aria-expanded="true"').replace('aria-controls=\\"pop1\\"','aria-controls="pop1"')

# ---------- C07 NAVIGATION ----------
LONG_TAB='Supporting documents and attachments'
nav_tabs=f'''<div class="cell">{cap("Selected, unselected, disabled (automatic activation)")}{tabs(["Summary","History","Attachments (3)","Audit (unavailable)"],disabled=(3,))}</div>
<div class="cell">{cap("Focus-visible (inset ring) and ~2× label")}{tabs(["Summary",LONG_TAB,"History"],sel=1).replace('class="paep-tab" id','class="paep-tab is-focus" id',1)}</div>
<div class="frame frame--320"><span class="cap">Narrow: bounded scroll inside the tab list</span><div class="frame-body">{tabs(["Summary","History",LONG_TAB,"Audit"])}</div></div>
<div class="cell">{cap("Manual activation (opt-in for expensive panels)")}{tabs(["Current","Archived"],activation="manual")}</div>'''
segs=['Home','Operations','Records','Region Central','Site 3 · Store B','REC-2026-000184']
nav_bc=f'''<div class="cell">{cap("Normal path")}{breadcrumb(["Home","Records","REC-2026-000184"])}</div>
<div class="cell">{cap("Long hierarchy, full (wraps)")}{breadcrumb(segs)}</div>
<div class="cell">{cap("Collapsed (> 4 segments): first · … · parent · current")}{breadcrumb(segs,collapse=True)}</div>
<div class="frame frame--320"><span class="cap">320 px collapsed</span><div class="frame-body">{breadcrumb(segs,collapse=True)}</div></div>'''
P['SCR-IB2-C07']=page('SCR-IB2-C07', f'''{specimen('Tabs', nav_tabs, 'tabs')}{specimen('Breadcrumb', nav_bc, 'breadcrumb')}''',
  intro=intro('Navigation family: tabs and breadcrumb (pagination is on the Data page). Try arrow keys on the tabs and the … button.'))

# ---------- C08 STRUCTURE ----------
cardA=f'<section class="paep-card" aria-labelledby="cd1"><div class="paep-card__head"><h3 class="t-title-sm paep-card__title" id="cd1">Record summary</h3></div><p style="margin:0">Default card: title and body.</p></section>'
cardB=f'<section class="paep-card" aria-labelledby="cd2"><div class="paep-card__head"><div class="paep-card__title"><h3 class="t-title-sm" id="cd2">Stock position for the current reporting period across all sites</h3><span class="t-body-sm t-secondary">Two-line title wraps; actions wrap below under 30 rem.</span></div>{action_group("Refresh",("Export",),label="Card actions")}</div><p style="margin:0">Body content grows with its content. Cards are not click targets in IB2.</p><div class="paep-card__foot">{btn("View details","tertiary")}</div></section>'
pid=uid('pn')
panelA=f'<section class="paep-panel" aria-labelledby="{pid}-t"><div class="paep-panel__head"><h3 class="t-title-sm" id="{pid}-t">Delivery details</h3>{btn("Edit","secondary")}</div><div class="paep-panel__body"><p style="margin:0">Static panel with header actions.</p></div></section>'
pb=uid('pn')
panelB=f'<section class="paep-panel"><div class="paep-panel__head"><h3 style="margin:0"><button type="button" class="paep-panel__toggle" aria-expanded="true" aria-controls="{pb}-b" data-toggle="panel">{ic("chevron-down")}<span>Additional information</span></button></h3></div><div class="paep-panel__body" id="{pb}-b">{field("Internal reference", value="INT-4471")}</div></section>'
pc=uid('pn')
panelC=f'<section class="paep-panel is-collapsed"><div class="paep-panel__head"><h3 style="margin:0"><button type="button" class="paep-panel__toggle" aria-expanded="false" aria-controls="{pc}-b" data-toggle="panel">{ic("chevron-down")}<span>Line items</span></button></h3><span class="paep-field__error">{ic("error","sm")}<span>Contains 2 errors</span></span></div><div class="paep-panel__body" id="{pc}-b" hidden><p>Hidden content</p></div></section>'
div=f'<div class="cell"><p style="margin:0">Above</p><hr class="paep-divider"><p style="margin:0">Below (full)</p><hr class="paep-divider paep-divider--inset"><p style="margin:0">Below (inset)</p><div class="row row--center">Left group<span class="paep-divider paep-divider--vertical" role="separator" aria-orientation="vertical"></span>Right group</div></div>'
P['SCR-IB2-C08']=page('SCR-IB2-C08', f'''{specimen('Card', '<div class="grid-2">'+cardA+cardB+'</div>', 'card')}{specimen('Panel', panelA+panelB+panelC, 'panel')}{specimen('Divider', div, 'divider')}''',
  intro=intro('Structure family: restrained primitives with token-only styling.'))
