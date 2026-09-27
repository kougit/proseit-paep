from pages4 import *
# ---------- F09 BRAND ----------
def bframe(profile, label):
    return f'''<div class="frame" data-paep-brand="{profile}"><span class="cap">{label}</span><div class="frame-body">
<div class="row">{btn("Save changes")}{btn("Cancel","secondary")}{btn("View history","tertiary")}</div>
<div class="row">{choice("Checked option",checked=True)}{choice("Selected","radio",True,name="b"+profile)}</div>
{tabs(["Summary","History"])}{pagination(2,5)}
<div class="paep-progress"><div class="paep-progress__head"><span>Import</span><span>60%</span></div><div class="paep-progress__track"><div class="paep-progress__fill" style="inline-size:60%"></div></div></div>
{alert("error","","Status colours stay identical under every brand profile.")}{btn("Delete record","destructive","delete")}{btn("Focus is protected",state="is-focus")}
<div class="pair" style="background:var(--paep-brand-accent);color:var(--paep-brand-on-accent)">Brand emphasis (accent + on-accent)</div></div></div>'''
rej=f'''<div class="lab-scroll"><table class="lab-table"><thead><tr><th>Profile attempt</th><th>Check</th><th>Result</th></tr></thead><tbody>
<tr><td><code>proseit-default</code>: primary #24364B / on-primary #FFFFFF, accent #D4A62A / on-accent #1A1F26</td><td>on-primary/primary 12.32:1 · primary/surface 12.32:1 · primary/page 10.97:1 · on-accent/accent 7.32:1</td><td>{badge("Accepted","success")}</td></tr>
<tr><td><code>synthetic-demo-petrol</code> (non-product): primary #0B5E73 / #FFFFFF, accent #9ED6E0 / #1A1F26</td><td>on-primary/primary 7.34:1 · primary/surface 7.34:1 · primary/page 6.53:1 · on-accent/accent 10.37:1 · hue distance from error ≥ 30°</td><td>{badge("Accepted","success")}</td></tr>
<tr><td><code>rejected-demo-yellow</code>: primary #E9B308 / on-primary #FFFFFF</td><td>on-primary/primary 1.92:1 · primary/surface 1.92:1 · primary/page 1.71:1</td><td>{badge("Rejected: contrast gate","error")}</td></tr>
<tr><td>Any profile pairing white text with gold <code>#D4A62A</code></td><td>on-accent/accent 2.26:1</td><td>{badge("Rejected: contrast gate","error")}</td></tr>
<tr><td>Any profile setting <code>--paep-color-status-error-fg</code></td><td>Key is outside the brand group (protected)</td><td>{badge("Rejected: protected token","error")}</td></tr>
<tr><td>Any profile setting <code>--paep-color-focus-ring</code>, <code>--paep-color-disabled-*</code>, <code>--paep-color-text-*</code>, <code>--paep-color-invalid-*</code></td><td>Protected</td><td>{badge("Rejected: protected token","error")}</td></tr></tbody></table></div>'''
P['SCR-IB2-F09']=page('SCR-IB2-F09', f'''
{specimen('Same components, two brand profiles', '<div class="grid-2">'+bframe("proseit-default","proseit-default (CANDIDATE)")+bframe("synthetic-demo-petrol","synthetic-demo-petrol (SYNTHETIC, non-product, demonstration only)")+'</div>')}
{specimen('Override boundary and fail-closed validation', '<p style="margin:0">A brand profile may set only: <code>primary, primary-hover, primary-active, primary-subtle, on-primary, accent, on-accent</code>. Selected, link and progress fill derive from brand-primary; brand-accent is emphasis only. Everything else is rejected.</p>'+rej)}
''', intro=intro('Products express identity through the brand group only (brand-primary and brand-accent). Status, focus, disabled, validation and text contrast never change.'))

# ---------- R01 LONG CONTENT ----------
LBL3='Registered business address used for statutory correspondence, including the building, street and district as they appear on the registration certificate'
HELP3='Use the address exactly as it is written on the certificate issued by the registering authority. If the certificate lists more than one address, use the one marked as the principal place of business for the current period.'
ERR3='The address could not be matched to the address on the registration certificate. Check the building name and district, correct any abbreviations, and make sure the district is one of the districts recognised for the selected region.'
LONG_ALERT='The scheduled synchronisation with the upstream service did not complete for 14 of 220 records. The affected records remain editable, but their totals may not include changes made in the last 30 minutes. Open each affected record to check its values, or wait for the next scheduled synchronisation, which retries automatically. If the problem continues, contact your administrator and quote the reference below. Reference: SYNC-2026-09-26-7F3A22C1-0000000000014.'
longrows=[('REC-2026-000184-ATTACHMENT-ARCHIVE-000000000001','https://files.example.invalid/tenant-000017/records/REC-2026-000184/attachments/original-scan-without-spaces.pdf','Site 3','1,250.00','2026-09-21',('Awaiting second-level review by regional controller','warning'))]+ROWS[1:3]
P['SCR-IB2-R01']=page('SCR-IB2-R01', f'''
{specimen('Buttons and tabs at ~2× length', '<div class="row">'+btn(LONG_BTN)+btn("Discard every unsaved change on this page","secondary")+'</div>'+tabs(["Summary","Supporting documents and attachments","Change history and approvals"]))}
{specimen('Three-line label, help and error', '<div style="max-inline-size:40rem">'+field(LBL3, value="Plot 14, Industrial Road", help=HELP3, error=ERR3, required=True)+'</div>')}
{specimen('Long IDs, URLs and status labels in a table', table_shell("Records with long values", rows=longrows))}
{specimen('Long alert content', alert("warning","Some records were not synchronised",LONG_ALERT,btn("View affected records","secondary")))}
{specimen('Many breadcrumb segments', breadcrumb(["Home","Operations and logistics","Records and registers","Region Central and surrounding districts","Site 3 · Store B · Receiving bay","REC-2026-000184-ATTACHMENT-ARCHIVE"])+breadcrumb(["Home","Operations and logistics","Records and registers","Region Central and surrounding districts","Site 3 · Store B · Receiving bay","REC-2026-000184-ATTACHMENT-ARCHIVE"],collapse=True))}
{specimen('Two-line card and panel titles', '<div class="grid-2"><section class="paep-card"><div class="paep-card__head"><h3 class="t-title-sm paep-card__title">Stock position for the current reporting period across all participating sites</h3>'+action_group("Refresh",("Export",),label="Card actions")+'</div><p style="margin:0">Body.</p></section><section class="paep-panel"><div class="paep-panel__head"><h3 class="t-title-sm">Delivery and collection details for records awaiting confirmation</h3>'+btn("Edit","secondary")+'</div><div class="paep-panel__body">Body.</div></section></div>')}
{specimen('Dialog content taller than the viewport', '<p style="margin:0">See <a href="C06B-dialog-long-content.html">SCR-IB2-C06B</a>: the body scrolls between a fixed header and fixed actions.</p>')}
''', intro=intro('Nothing essential truncates. Text wraps, unbroken tokens break, and containers grow.'))

# ---------- R02 RTL ----------
def ar(s):
    return (s.replace('>Previous<','>السابق<').replace('>Next<','>التالي<').replace('Page 8 of 20','الصفحة 8 من 20').replace('aria-label="Pagination"','aria-label="ترقيم الصفحات"')
             .replace('aria-label="Previous page"','aria-label="الصفحة السابقة"').replace('aria-label="Next page"','aria-label="الصفحة التالية"')
             .replace('>Record<','>السجل<').replace('>Location<','>الموقع<').replace('>Quantity<','>الكمية<').replace('>Updated<','>آخر تحديث<').replace('>Status<','>الحالة<')
             .replace('2 of 184 records','2 من 184 سجلًا').replace('Details<span class="vh"> for','التفاصيل<span class="vh"> لـ').replace('>Approved<','>معتمد<').replace('>Awaiting review<','>بانتظار المراجعة<'))
rtl_body=f'''
{specimen('Form (نموذج)', '<div class="grid-2">'+field("رقم المرجع", value="REC-2026-000184", help="يظهر على المستندات المطبوعة.", required=True, dirv="ltr")+field("الكمية", value="-4", error="يجب أن تكون الكمية 0 أو أكثر.", suffix="كغ")+field("المنطقة", kind="select", options=["الوسطى","الشمالية"], value="الوسطى")+'<fieldset class="paep-fieldset"><legend class="paep-field__label">طريقة التسليم</legend>'+choice("الاستلام من الموقع","radio",True,name="ar1")+choice("التسليم العادي","radio",name="ar1")+choice("أوافق على الشروط",checked=True)+'</fieldset></div><div class="row">'+btn("حفظ التغييرات")+btn("إلغاء","secondary")+btn("حذف السجل","destructive","delete")+'</div>')}
{specimen('Tabs (علامات التبويب)', tabs(["الملخص","سجل التغييرات","المرفقات (3)"],label="طرق عرض السجل",panel_text="محتوى علامة التبويب المحددة."))}
{specimen('Breadcrumb (مسار التنقل)', breadcrumb(["الرئيسية","العمليات","السجلات","الموقع 3","REC-2026-000184"],label="مسار التنقل")+breadcrumb(["الرئيسية","العمليات","السجلات","الموقع 3","REC-2026-000184"],collapse=True,label="مسار التنقل"))}
{specimen('Pagination and directional icons', ar(pagination(8,20))+'<div class="row row--center">'+''.join(f'<span class="cell" style="align-items:center">{ic(n,"lg")}<code>{n}</code></span>' for n in ("chevron-start","chevron-end","page-first","page-last","external","retry","success"))+'</div>')}
{specimen('Alert and table', alert("success","","تم حفظ السجل.")+ar(table_shell("السجلات",rows=ROWS[:2],actions=False)))}
{specimen('Drawer', '<p style="margin:0">See <a href="R02D-drawer-rtl.html">SCR-IB2-R02D</a>: the default "end" drawer opens from the left in RTL.</p>')}
'''
P['SCR-IB2-R02']=page('SCR-IB2-R02', rtl_body, lang='ar', dir='rtl', intro=intro('Representative RTL rendering (dir="rtl", lang="ar"). Illustrative Arabic sample strings, pending translation review. Identifiers keep dir="ltr".'))
drw_ar=(f'<dialog class="paep-drawer" data-open-modal aria-labelledby="dra-t"><div class="paep-drawer__head"><h2 class="t-title" id="dra-t" tabindex="-1" data-initial-focus>السجل <span dir="ltr">REC-2026-000185</span></h2>{ibtn("إغلاق","close","tertiary")}</div>'
        f'<div class="paep-drawer__body">{badge("بانتظار المراجعة","warning")}<dl class="paep-dl"><dt>الموقع</dt><dd>الموقع 1</dd><dt>الكمية</dt><dd>87.50</dd></dl></div><div class="paep-drawer__foot">{btn("إغلاق","secondary")}{btn("فتح السجل كاملاً")}</div></dialog>')
P['SCR-IB2-R02D']=page('SCR-IB2-R02D', ctx('سياق الاستدعاء.'), lang='ar', dir='rtl', extra_after=drw_ar, intro=intro('Drawer side="end" in RTL: attaches to the left edge; close button at the inline-end.'))

# ---------- R03 REFLOW BOARD ----------
P['SCR-IB2-R03']=page('SCR-IB2-R03', f'''
{specimen('Action group', action_group("Approve",("Edit","Duplicate","Export"),"Delete record"))}
{specimen('Field with error', field("Quantity", value="-4", error="Quantity must be 0 or more.", help="Whole units only.", required=True))}
{specimen('Alert', alert("error","The record could not be submitted","Correct the 2 errors below, then submit again."))}
{specimen('Tabs', tabs(["Summary","History","Attachments (3)","Audit"]))}
{specimen('Breadcrumb', breadcrumb(["Home","Operations","Records","Site 3","REC-2026-000184"],collapse=True))}
{specimen('Table shell', table_shell())}
{specimen('Pagination', pagination(8,20))}
{specimen('Card and panel', cardB+panelA)}
{specimen('Overlays at 320', '<ul style="margin:0;padding-inline-start:1.2em"><li><a href="C06A-dialog-destructive.html">Dialog (inset 16 px, stacked actions)</a></li><li><a href="C06C-dialog-form-large.html">Large dialog (full screen)</a></li><li><a href="C06D-drawer.html">Drawer (full width)</a></li><li><a href="C06E-popover.html">Popover (viewport-bounded)</a></li></ul>')}
''', intro=intro('Every material pattern on one page, designed to be read at 320 CSS px (1280 px at 400% zoom). Nothing disappears; the page never scrolls horizontally.'))
