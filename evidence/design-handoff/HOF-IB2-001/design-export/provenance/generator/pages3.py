from pages2 import *
LONG_BTN='Save changes and notify every reviewer'  # ~2x "Save changes"
# ---------- C01 ACTIONS ----------
var=f'<div class="row">{btn("Save changes")}{btn("Cancel","secondary")}{btn("View history","tertiary")}{btn("Delete supplier record","destructive","delete")}</div>'
states='<div class="lab-scroll"><table class="lab-table"><thead><tr><th>State</th><th>Primary</th><th>Secondary</th><th>Tertiary</th><th>Destructive</th></tr></thead><tbody>'
for nm,s in (('Default',''),('Hover','is-hover'),('Focus-visible','is-focus'),('Active','is-active'),('Disabled','disabled'),('Loading','loading')):
    lbl='Saving…' if s=='loading' else 'Save'
    states+=f'<tr><th scope="row">{nm}</th><td>{btn(lbl,"primary",state=s)}</td><td>{btn("Cancel" if s!="loading" else "Checking…","secondary",state=s)}</td><td>{btn("View history" if s!="loading" else "Loading…","tertiary",state=s)}</td><td>{btn("Delete record" if s!="loading" else "Deleting…","destructive","delete" if s!="loading" else None,state=s)}</td></tr>'
states+='</tbody></table></div>'
longn=f'<div class="grid-2"><div class="cell">{cap("~2× label")}{btn(LONG_BTN)}</div><div class="cell frame--320">{cap("Narrow width (block)")}{btn(LONG_BTN,block=True)}</div></div>'
icb=f'<div class="row row--center">{ibtn("Close","close")}{ibtn("More actions","more")}{ibtn("Previous page","chevron-start","tertiary")}{ibtn("Next page","chevron-end","tertiary")}{ibtn("Close","close",state="is-focus")}{ibtn("Close","close",state="disabled")}</div>'
agw=f'<div class="cell">{cap("Wide container: all actions visible")}{action_group("Approve",("Edit","Duplicate","Export"),"Delete record")}</div>'
agn=f'<div class="frame frame--320"><span class="cap">Container &lt; 30 rem (320 px): primary + More</span><div class="frame-body">{action_group("Approve",("Edit","Duplicate","Export"),"Delete record")}</div></div>'
agm=f'<div class="frame frame--320" style="min-block-size:22rem"><span class="cap">Overflow menu open (destructive last, separated, explicit)</span><div class="frame-body">{action_group("Approve",("Edit","Duplicate","Export"),"Delete record",force_menu_open=True)}</div></div>'
P['SCR-IB2-C01']=page('SCR-IB2-C01', f'''
{specimen('Button', var+states+longn, 'button')}
{specimen('Icon button', icb, 'icon-button')}
{specimen('Action group', agw+'<div class="grid-2">'+agn+agm+'</div>', 'action-group')}
''', intro=intro('Actions family: button, icon button, action group.'))

# ---------- C02 FORMS ----------
f1=f'''<div class="grid-2">
{field("Reference number", value="REC-2026-000184", help="Shown on printed documents.", required=True)}
{field("Contact email", placeholder="name@example.org", help="Example format shown as placeholder; the label stays visible.")}
{field("Unit price", value="1,250.00", prefix="KES", required=True)}
{field("Net weight", value="87.5", suffix="kg")}
{field("Quantity", value="-4", error="Quantity must be 0 or more.", required=True)}
{field("Site", value="Site 2", state="readonly", help="Set by the record owner.", meta="(read only)")}
{field("Approval route", value="Standard", state="disabled", help="Unavailable while the record is locked for review.")}
{field("Batch code", value="B-7781", state="focus")}
{field("Region", kind="select", options=["Choose a region","North","Central","South"], value="Central")}
{field("Priority", kind="select", options=["Normal","High"], error="Choose a priority for this record.")}
</div>
{field("Notes", kind="textarea", value="Delivered in two parts. The second part is expected next week.", help="Up to 500 characters.", meta="Unsaved change")}'''
f2=f'''<div class="grid-2"><fieldset class="paep-fieldset"><legend class="paep-field__label">Checkbox states</legend>
{choice("Unchecked")}{choice("Checked",checked=True)}{choice("Indeterminate (some items selected)",mixed=True)}{choice("Focus",state="focus")}{choice("Disabled",state="disabled")}{choice("Disabled and checked",checked=True,state="disabled")}{choice("Read-only and checked",checked=True,state="readonly")}{choice("Invalid: confirm the declaration",state="invalid")}
<span class="paep-field__error">{ic("error","sm")}<span>Confirm the declaration to continue.</span></span></fieldset>
<fieldset class="paep-fieldset" aria-describedby="rg-h rg-e"><legend class="paep-field__label">Delivery method<span class="paep-field__req" aria-hidden="true">*</span></legend>
<span class="paep-field__help" id="rg-h">Choose how the items will arrive.</span>
{choice("Collection from site","radio",name="rg1",state="invalid")}{choice("Standard delivery","radio",name="rg1",state="invalid")}{choice("Scheduled delivery (not available for this site)","radio",name="rg1",state="disabled")}
<span class="paep-field__error" id="rg-e">{ic("error","sm")}<span>Choose a delivery method.</span></span></fieldset>
<fieldset class="paep-fieldset"><legend class="paep-field__label">Radio states</legend>{choice("Selected","radio",True,name="rg2")}{choice("Unselected","radio",name="rg2")}{choice("Focus","radio",name="rg2",state="focus")}{choice("Read-only selected","radio",True,name="rg3",state="readonly")}</fieldset></div>'''
P['SCR-IB2-C02']=page('SCR-IB2-C02', f'''
{specimen('Field wrapper, input, native select, textarea', f1, 'field')}
<section class="specimen"><div class="grid-2">{notes("input")}{notes("select")}</div>{notes("textarea")}</section>
{specimen('Checkbox and radio group', f2, 'checkbox')}
{notes("radio-group")}
''', intro=intro('Forms family. Labels are always visible; errors are text + icon + 2 px border and are programmatically associated.'))

# ---------- C03 TABLE ----------
P['SCR-IB2-C03']=page('SCR-IB2-C03', f'''
{specimen('Table shell: populated (primary strategy: priority columns + row detail)', table_shell(), 'table-shell')}
<section class="specimen"><h2 class="t-heading-2">States</h2><div class="grid-2">
<div class="cell">{cap("Loading")}{table_shell("Records",state="loading",actions=False)}</div>
<div class="cell">{cap("Empty (genuinely no data)")}{table_shell("Records",state="empty",actions=False)}</div>
<div class="cell">{cap("Filtered / no results (distinct icon, text and action)")}{table_shell("Records",state="no-results",actions=False)}</div>
<div class="cell">{cap("Error with retry")}{table_shell("Records",state="error",actions=False)}</div></div></section>
{specimen('Compact density (desktop data-heavy)', table_shell("Records",compact=True))}
''', intro=intro('Backend-neutral table shell. Resize the window or view the 320 px render: columns move into row detail, never into page-wide scrolling.'))

# ---------- C03N STRATEGIES ----------
cards='<ul class="paep-cards">'+''.join(f'<li><div class="row" style="justify-content:space-between"><b class="paep-mono" dir="ltr">{r[0]}</b>{badge(r[5][0],r[5][1])}</div><div>{esc(r[1])}</div><dl class="paep-dl t-body-sm"><dt>Location</dt><dd>{esc(r[2])}</dd><dt>Quantity</dt><dd>{r[3]}</dd><dt>Updated</dt><dd>{r[4]}</dd></dl></li>' for r in ROWS[:2])+'</ul>'
scroll=f'<div class="paep-table-scroll" role="region" aria-label="Records, scrollable" tabindex="0"><table class="paep-table" style="min-inline-size:44rem"><thead><tr><th scope="col">Reference</th><th scope="col">Name</th><th scope="col">Location</th><th scope="col" class="num">Quantity</th><th scope="col">Updated</th><th scope="col">Status</th></tr></thead><tbody>'+''.join(f'<tr><th scope="row" class="id" style="font-weight:400">{r[0]}</th><td>{esc(r[1])}</td><td>{esc(r[2])}</td><td class="num">{r[3]}</td><td>{r[4]}</td><td>{badge(r[5][0],r[5][1])}</td></tr>' for r in ROWS[:3])+'</tbody></table></div>'
def fr(t,body): return f'<div class="frame frame--320"><span class="cap">{t}</span><div class="frame-body" style="padding:var(--paep-space-2)">{body}</div></div>'
cmp='''<div class="lab-scroll"><table class="lab-table"><thead><tr><th>Criterion</th><th>A. Priority columns + row detail</th><th>B. Card / summary transformation</th><th>C. Bounded internal horizontal scroll</th></tr></thead><tbody>
<tr><th scope="row">Enterprise usability</th><td>High: rows stay scannable and comparable on key columns; detail one tap away</td><td>Medium: good for browsing, poor for comparing values across rows</td><td>Medium on tablet; poor at 320 (2-3 columns visible at once)</td></tr>
<tr><th scope="row">320 px reflow</th><td>Pass: no horizontal scroll</td><td>Pass</td><td>Region scrolls; page does not. Allowed by WCAG 1.4.10 only for genuinely 2-D content</td></tr>
<tr><th scope="row">Information loss</th><td>None: hidden columns are in the detail row with their header names</td><td>None, but column order/alignment is lost</td><td>None, but off-screen columns are easy to miss</td></tr>
<tr><th scope="row">Keyboard</th><td>Tab to Details, Enter/Space</td><td>Tab through card content</td><td>Region must be a tab stop; arrow keys scroll</td></tr>
<tr><th scope="row">Accessibility</th><td>Keeps native table semantics; dl repeats header names; aria-expanded</td><td>Loses th/td association unless rebuilt as dl; two DOM representations risk divergence</td><td>Keeps table semantics; sticky first column keeps row identity</td></tr>
<tr><th scope="row">Implementation complexity</th><td>Low-medium: priority per column + container queries + one disclosure row</td><td>Medium-high: second template per consumer, state parity tests</td><td>Low</td></tr>
<tr><th scope="row">Scales to data-heavy products</th><td>Yes: consumers only declare column priority</td><td>Weak beyond 6-8 fields per record</td><td>Yes for matrices/timesheets; wrong default for record lists</td></tr>
<tr><th scope="row">Decision</th><td><b>RECOMMENDED PRIMARY</b></td><td>Rejected as a table-shell mode (products may use List or Card for browse views)</td><td><b>CONTROLLED FALLBACK</b> for genuinely two-dimensional comparison only, with sticky key column and focusable region</td></tr></tbody></table></div>'''
P['SCR-IB2-C03N']=page('SCR-IB2-C03N', f'''
{specimen('Three strategies at 320 CSS px', '<div class="grid-3">'+fr("A · Priority columns + row detail", table_shell("Records",rows=ROWS[:3],actions=False).replace('<div class="paep-table-shell__foot">','<div hidden class="paep-table-shell__foot">'))+fr("B · Card / summary transformation", '<div class="paep-table-shell">'+cards+'</div>')+fr("C · Bounded inner horizontal scroll", '<div class="paep-table-shell">'+scroll+'</div>')+'</div>')}
{specimen('Evaluation', cmp)}
''', intro=intro('D1 design decision for the table shell. Each frame is a 320 CSS px column.'))

# ---------- C04 LIST / PAGINATION / EMPTY ----------
li=lambda n,s,m: f'<li>{ic("neutral","md")}<div class="paep-list__main"><a href="#">{esc(n)}</a><span class="t-body-sm t-secondary">{esc(s)}</span></div><div class="paep-list__meta">{m}</div></li>'
lst='<ul class="paep-list">'+li('Sample item Alpha','Site 3 · Updated 2026-09-21',badge('Approved','success'))+li('Sample item Beta with a longer descriptive name that wraps onto a second line','Reference REC-2026-000185-ATTACHMENT-ARCHIVE-0001',badge('Awaiting review','warning'))+li('Sample item Gamma','Site 2',f'<span class="paep-num">12,904.75</span>')+'</ul>'
lload='<ul class="paep-list" aria-hidden="true">'+''.join('<li><div class="paep-list__main"><div class="paep-skeleton"><div class="paep-skeleton__block" style="inline-size:60%"></div><div class="paep-skeleton__block" style="inline-size:40%"></div></div></div></li>' for _ in range(3))+'</ul>'
P['SCR-IB2-C04']=page('SCR-IB2-C04', f'''
{specimen('List', '<div class="grid-2"><div class="cell">'+cap("Populated, long text")+lst+'</div><div class="cell">'+cap("Loading")+lload+cap("Error")+alert("error","","Items could not be loaded.",btn("Retry","secondary","retry"))+'</div></div>', 'list')}
{specimen('Pagination', '<div class="cell">'+cap("Middle page")+pagination(8,20)+cap("First page (Previous disabled, not removed)")+pagination(1,20)+cap("Last page")+pagination(20,20)+'</div><div class="frame frame--320"><span class="cap">Container &lt; 36 rem</span><div class="frame-body">'+pagination(8,20)+'</div></div>', 'pagination')}
{specimen('Empty state', '<div class="grid-2"><div class="stage">'+f'<div class="paep-empty">{ic("empty")}<h3 class="t-title-sm">No records yet</h3><p>Records you create will appear here.</p>{btn("Create record","secondary","plus")}</div>'+'</div><div class="stage">'+f'<div class="paep-empty">{ic("no-results")}<h3 class="t-title-sm">No records match the current filters</h3><p>Try removing a filter or changing the search text.</p>{btn("Clear filters","secondary")}</div>'+'</div></div>', 'empty-state')}
''', intro=intro('Data family: list, pagination and empty state.'))

# ---------- C05 FEEDBACK ----------
al='<div class="cell">'+alert('info','','Figures are refreshed every 15 minutes.',dismiss=True)+alert('success','Record saved','The record was saved and is now awaiting review.',dismiss=True)+alert('warning','Review before submitting','Two lines have quantities above the usual range. Check them before you submit.',btn('Review lines','secondary'))+alert('error','The record could not be submitted','Correct the 2 errors below, then submit again.',f'<a href="#">Go to first error</a>')+'</div>'
bd='<div class="row row--center">'+badge('Draft','neutral')+badge('Scheduled','info')+badge('Approved','success')+badge('Awaiting review','warning')+badge('Rejected','error')+'</div>'
pr=f'''<div class="grid-2"><div class="cell">
<div class="paep-progress"><div class="paep-progress__head"><label>Import records</label><span class="paep-num">45%</span></div><div class="paep-progress__track"><div class="paep-progress__fill" style="inline-size:45%"></div></div></div>
<div class="paep-progress"><div class="paep-progress__head"><label>Step 3 of 7: validating lines</label><span class="paep-num">3 / 7</span></div><div class="paep-progress__track"><div class="paep-progress__fill" style="inline-size:43%"></div></div></div>
<div class="paep-progress paep-progress--indeterminate"><div class="paep-progress__head"><label>Preparing export</label><span>Working…</span></div><div class="paep-progress__track"><div class="paep-progress__fill"></div></div></div></div>
<div class="cell rm"><span class="cap">Reduced motion rendering</span>
<div class="paep-progress paep-progress--indeterminate"><div class="paep-progress__head"><label>Preparing export</label><span>In progress</span></div><div class="paep-progress__track"><div class="paep-progress__fill"></div></div></div>
<div class="paep-skeleton" aria-hidden="true"><div class="paep-skeleton__block"></div><div class="paep-skeleton__block" style="inline-size:60%"></div></div></div></div>'''
sk='<div class="grid-2"><div class="paep-card" aria-busy="true"><span class="vh">Loading…</span><div class="paep-skeleton" aria-hidden="true"><div class="paep-skeleton__block" style="block-size:1.25rem;inline-size:50%"></div><div class="paep-skeleton__block"></div><div class="paep-skeleton__block"></div><div class="paep-skeleton__block" style="inline-size:60%"></div></div></div><div class="paep-card rm" aria-busy="true"><span class="cap">Reduced motion: static</span><div class="paep-skeleton" aria-hidden="true"><div class="paep-skeleton__block"></div><div class="paep-skeleton__block" style="inline-size:60%"></div></div></div></div>'
tr='''<div class="lab-scroll"><table class="lab-table"><thead><tr><th>Feedback</th><th>Mechanism</th><th>Announcement</th></tr></thead><tbody>
<tr><td>Persistent inline (present at load)</td><td>Alert, static content</td><td>None: read in page order</td></tr>
<tr><td>Persistent inline (inserted after an action)</td><td>Alert with role=alert (error) or role=status (info/success/warning)</td><td>Assertive for error, polite otherwise</td></tr>
<tr><td>Form submit failure</td><td>Error summary Alert receives focus (tabindex=-1), links to fields</td><td>Via focus</td></tr>
<tr><td>Transient confirmation ("Saved")</td><td>Visually hidden platform live region (polite). No Toast in IB2</td><td>Polite; nothing visual is required to disappear</td></tr>
<tr><td>Collection state change</td><td>Host live region inside table/list shell</td><td>Polite ("Loading records", "No records match")</td></tr></tbody></table></div>'''
P['SCR-IB2-C05']=page('SCR-IB2-C05', f'''
{specimen('Alert', al, 'alert')}
{specimen('Persistent vs transient feedback', tr)}
{specimen('Status badge', bd, 'status-badge')}
{specimen('Progress', pr, 'progress')}
{specimen('Skeleton', sk, 'skeleton')}
''', intro=intro('Feedback family. Every status combines protected colour with a distinct icon shape and text.'))
