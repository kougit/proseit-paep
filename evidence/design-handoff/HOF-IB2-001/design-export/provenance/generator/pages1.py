from parts import *
import tokens as T
from contrast import cr
P={}
def intro(t): return f'<p class="t-body-lg t-secondary" dir="auto">{t}</p>'

# ---------- L01 HOME ----------
ia=''.join(f'<div class="paep-card"><div class="paep-card__head"><h2 class="t-title-sm paep-card__title">{esc(g)}</h2></div><ul style="margin:0;padding-inline-start:1.2em">'+''.join(f'<li><a href="{BYID[s][1]}">{esc(l)}</a> <span class="lab-idline">{s}</span></li>' for s,l in items)+'</ul></div>' for g,items in NAV)
P['SCR-IB2-L01']=page('SCR-IB2-L01', f'''
<section class="specimen" aria-labelledby="h-ia"><header><h2 class="t-heading-2" id="h-ia">Information architecture</h2></header>
<div class="grid-2">{ia}</div></section>
<section class="specimen" aria-labelledby="h-lab"><header><h2 class="t-heading-2" id="h-lab">How the lab is organised</h2></header><div class="stage">
<ul style="margin:0;padding-inline-start:1.2em;display:flex;flex-direction:column;gap:var(--paep-space-2)">
<li><b>Contents</b> list at the inline-start from 1024 px; below that it becomes a "Contents" disclosure at the top of the page (native details/summary). No topbar, sidebar or app frame: the lab must not pre-empt the IB3 enterprise shell.</li>
<li><b>Specimen settings</b> (density, direction, brand profile, reduced-motion simulation) apply to the whole page through root attributes, which is exactly the mechanism products use.</li>
<li>Every component page follows the specimen template (SCR-IB2-L02): Purpose, Variants, States, Keyboard, Accessibility, Responsive, Localisation/RTL, Usage and an Evidence placeholder that the implementation replaces with links to retained test evidence.</li>
<li>Responsive / 320, Accessibility, RTL and Brand override are first-class sections, not appendices.</li></ul></div></section>
''', intro=intro('The permanent PAEP UI laboratory, designed as engineering documentation. This screen is the lab\'s home: a flat index of every foundation, component and proof page. Nothing here is a product workflow.'))

# ---------- L02 SPECIMEN TEMPLATE ----------
P['SCR-IB2-L02']=page('SCR-IB2-L02', specimen('Button', f'''
<div class="row">{btn("Save changes")}{btn("Cancel","secondary")}{btn("View history","tertiary")}{btn("Delete record","destructive","delete")}</div>
<div class="row">{btn("Saving…","primary",state="loading")}{btn("Save changes","primary",state="disabled")}{btn("Save changes","primary",state="is-focus")}</div>
''','button', sub='<span class="lab-idline">@proseit/paep-components · button[paepButton]</span>'), title='Specimen template: Button',
 intro=intro('The canonical specimen layout every component page repeats, based on IR-01 Code Block 8. The Evidence row is a placeholder that implementation replaces with real links.'))

# ---------- F01 COLOUR ----------
def sw(name,val,note=''):
    return f'<div class="sw"><b style="background:{val}"></b><span><strong>{esc(name)}</strong><br><code>{esc(val)}</code>{("<br>"+esc(note)) if note else ""}</span></div>'
neu=''.join(sw(f'neutral-{k}',v) for k,v in T.NEUTRAL.items())
brand=''.join(sw('brand-'+k,v) for k,v in T.BRAND_DEFAULT.items())
BRAND_USE='''<div class="grid-3">
<div class="cell"><span class="cap">Navy: dominant brand colour</span><div class="pair" style="background:var(--paep-brand-primary);color:var(--paep-brand-on-primary)">White on navy 12.32:1</div><span class="t-body-sm t-secondary">Primary buttons, links, checked controls, selected states, progress fill.</span></div>
<div class="cell"><span class="cap">Gold: restrained emphasis</span><div class="pair" style="background:var(--paep-brand-accent);color:var(--paep-brand-on-accent)">Dark on gold 7.32:1</div><div class="pair" style="background:var(--paep-brand-primary);color:var(--paep-brand-accent)">Gold on navy 5.45:1</div><span class="t-body-sm t-secondary">Brand band, emphasis fills with dark text, gold text only on navy.</span></div>
<div class="cell"><span class="cap">Prohibited</span><div class="pair" style="background:var(--paep-brand-accent);color:#fff;text-decoration:line-through">White on gold 2.26:1</div><div class="pair" style="background:var(--paep-color-surface);color:var(--paep-brand-accent);border:1px solid var(--paep-color-border-subtle);text-decoration:line-through">Gold on white 2.26:1</div><span class="t-body-sm t-secondary">Gold never carries text or state on light surfaces, never marks selection or status, and never replaces a protected colour.</span></div></div>
<p class="t-body-sm" style="margin:0">Only the seven <code>--paep-brand-*</code> tokens are overridable by a product. Navy and gold are the PO/SA brand direction; the hover, active and subtle tones are candidate derivations. Gold sits near the warning hue, so it is never used in status-like shapes (badges, alerts).</p>'''
stat=''.join(''.join(sw(f'{s}-{k}',v) for k,v in d.items() if k!='strong') for s,d in T.STATUS.items())
sem=''.join(sw(k,v) for k,v in T.SEMANTIC.items() if v.startswith('#'))
rows=''
for pid,fg,bg,kind,req in T.pairs():
    if not(fg.startswith('#') and bg.startswith('#')): continue
    r=cr(fg,bg); res='PROHIBITED combination (fails, not used)' if kind=='prohibited' else 'informational' if kind=='info' else ('exempt' if kind=='exempt' else ('PASS' if r>=req else 'FAIL'))
    rows+=f'<tr><td>{esc(pid)}</td><td><span class="pair" style="background:{bg};color:{fg};border:1px solid var(--paep-color-border-subtle);min-block-size:2rem">Aa</span></td><td class="paep-num">{r:.2f}:1</td><td>{("≥ "+str(req)+":1") if req else "n/a"}</td><td>{res}</td></tr>'
P['SCR-IB2-F01']=page('SCR-IB2-F01', f'''
{specimen('Neutral ramp','<div class="swatches">'+neu+'</div>')}
{specimen('Semantic neutral and state tokens (protected)','<div class="swatches">'+sem+'</div><p class="t-body-sm t-secondary" style="margin:0">Page background neutral-50, surfaces white, read-only and prefix surfaces neutral-25/50. Scrim rgb(26 31 38 / 0.56).</p>')}
{specimen('Brand group: proseit-default (ProSEIT Navy + ProSEIT Gold)','<div class="swatches">'+brand+'</div>'+BRAND_USE)}
{specimen('Status (protected, never brand-overridable)','<div class="swatches">'+stat+'</div>')}
{specimen('Contrast evidence (WCAG 2.2 AA)','<div class="lab-scroll"><table class="lab-table"><caption class="vh">Contrast of foreground and background pairs</caption><thead><tr><th>Pair</th><th>Sample</th><th>Ratio</th><th>Needed</th><th>Result</th></tr></thead><tbody>'+rows+'</tbody></table></div>')}
''', intro=intro('Candidate palette. Brand tokens and semantic state tokens are separate layers; status, focus, disabled, validation and text tokens are protected from brand profiles.'))

# ---------- F02 TYPOGRAPHY ----------
ts=''.join(f'<tr><td><code>{r}</code></td><td style="font-size:{s/16}rem;line-height:{lh/16}rem;font-weight:{w};letter-spacing:{ls}">Record summary 1,250.00</td><td class="paep-num">{s}/{lh}</td><td class="paep-num">{w}</td><td>{ls}</td></tr>' for r,s,lh,w,ls in T.TYPE)
P['SCR-IB2-F02']=page('SCR-IB2-F02', f'''
{specimen('Font strategy', f'<p style="margin:0"><b>System font stack (zero dependency).</b> <code>{esc(T.FONT_SANS)}</code></p><p style="margin:0">Monospace for identifiers and code: <code>{esc(T.FONT_MONO)}</code></p><p class="t-body-sm t-secondary" style="margin:0">No font file is shipped or fetched. Named families are only used when already installed on the device, so there is no licence or CDN dependency (IB-01 §19.1(iv)).</p>')}
{specimen('Type scale', '<div class="lab-scroll"><table class="lab-table"><thead><tr><th>Role</th><th>Specimen</th><th>Size/line px</th><th>Weight</th><th>Tracking</th></tr></thead><tbody>'+ts+'</tbody></table></div>')}
{specimen('Numeric and data presentation', '<table class="paep-table" style="max-inline-size:28rem"><thead><tr><th scope="col">Proportional (prose)</th><th scope="col" class="num">Tabular (data)</th></tr></thead><tbody><tr><td style="font-variant-numeric:proportional-nums">1,111.11</td><td class="num">1,111.11</td></tr><tr><td style="font-variant-numeric:proportional-nums">88,888.80</td><td class="num">88,888.80</td></tr><tr><td style="font-variant-numeric:proportional-nums">107.00</td><td class="num">107.00</td></tr></tbody></table><p class="t-body-sm t-secondary" style="margin:0">Data cells, pagination and progress values use <code>font-variant-numeric: tabular-nums lining-nums</code> and align to the inline-end. Formatting (separators, currency) belongs to the i18n layer, not the component.</p>')}
{specimen('Wrapping and truncation rules', '<ul style="margin:0;padding-inline-start:1.2em"><li>Default: wrap. Text is never truncated when truncation would hide meaning (labels, errors, statuses, titles, buttons, tabs, breadcrumbs).</li><li><code>overflow-wrap: anywhere</code> on body so unbroken IDs/URLs cannot force horizontal scroll: <span class="paep-mono" dir="ltr">https://example.invalid/records/REC-2026-000184/attachments/very-long-file-name-without-spaces.pdf</span></li><li>Single-line truncation with ellipsis is allowed only where the full value is available elsewhere on the same view (closed native select, a detail row) and exposed to assistive technology.</li><li>No uppercase transforms (translation- and Arabic-hostile). Negative tracking only on heading-1/2 in Latin scripts; reset to 0 for RTL/Arabic.</li><li>Minimum body text 14 px; 12 px caption only for non-essential metadata.</li></ul>')}
''', intro=intro('Controlled type scale on a zero-dependency system font stack, with tabular numerals for data.'))

# ---------- F03 SPACING / SIZE / RADIUS ----------
sp=''.join(f'<tr><td><code>--paep-space-{k}</code></td><td class="paep-num">{v}px</td><td><div class="bar" style="inline-size:{max(v,1)}px"></div></td></tr>' for k,v in T.SPACE)
rad=''.join(f'<div class="cell" style="align-items:center"><div style="inline-size:4rem;block-size:3rem;border:2px solid var(--paep-color-border-default);border-radius:{min(v,24)}px;background:var(--paep-color-surface-subtle)"></div>{cap(f"{k} · {v if v<999 else 9999}px")}</div>' for k,v in T.RADIUS)
dens=''.join(f'<tr><td><code>--paep-density-{k}</code></td><td class="paep-num">{a}px</td><td class="paep-num">{b}px</td></tr>' for k,(a,b) in T.DENSITY.items())
P['SCR-IB2-F03']=page('SCR-IB2-F03', f'''
{specimen('Spacing scale (4 px base)', '<div class="lab-scroll"><table class="lab-table"><thead><tr><th>Token</th><th>Value</th><th>Visual</th></tr></thead><tbody>'+sp+'</tbody></table></div><p class="t-body-sm t-secondary" style="margin:0">Inline gaps: space-1/2 inside controls, space-2/3 between related controls. Block rhythm: space-4 between fields, space-6/7 between sections. Page margins 16 (narrow) / 24 (tablet) / 32 px (desktop+). Values are rem so they scale with user font size.</p>')}
{specimen('Size', '<ul style="margin:0;padding-inline-start:1.2em"><li>Control height: 40 px comfortable, 32 px compact (40 px under pointer: coarse).</li><li>Icons: 16 (inline, compact), 20 (default), 24 (standalone / large).</li><li>Minimum target: 24 × 24 CSS px everywhere (WCAG 2.5.8); 40 × 40 in comfortable density and on touch.</li><li>Checkbox/radio visual 18/16 px; the label extends the hit area to ≥ 24 px tall.</li></ul><div class="lab-scroll"><table class="lab-table"><thead><tr><th>Density token</th><th>Comfortable</th><th>Compact</th></tr></thead><tbody>'+dens+'</tbody></table></div>')}
{specimen('Radius (restrained)', '<div class="row">'+rad+'</div><p class="t-body-sm t-secondary" style="margin:0">xs: checkbox · sm: buttons, inputs, badges, tabs · md: cards, panels, popovers, alerts · lg: dialogs · full: progress track only.</p>')}
''', intro=intro('One spacing scale, one size vocabulary and a restrained radius scale replace per-screen literals.'))

# ---------- F04 SURFACES ----------
lv=''.join(f'<div class="cell"><div style="background:var(--paep-color-surface);border:{"0" if e=="0" else "1px solid var(--paep-color-border-subtle)"};border-radius:var(--paep-radius-md);box-shadow:var(--paep-elevation-{e});min-block-size:6rem;padding:var(--paep-space-3)"><b>Level {e}</b><br><span class="t-body-sm t-secondary">{esc(role)}</span></div>{cap(sh if sh!="none" else "no shadow")}</div>' for e,role,sh,b in T.ELEVATION)
P['SCR-IB2-F04']=page('SCR-IB2-F04', f'''
{specimen('Semantic layers', '<div class="grid-3" style="background:var(--paep-color-bg-page);padding:var(--paep-space-4);border-radius:var(--paep-radius-md)">'+lv+'</div>')}
{specimen('Rules', '<ul style="margin:0;padding-inline-start:1.2em"><li>Every layer above the page keeps a 1 px subtle border, so hierarchy survives low-quality displays, bright ambient light and forced-colours mode where shadows disappear.</li><li>Shadows are vertical and symmetric (no x offset), so RTL needs no mirroring.</li><li>Page (neutral-50) → panel/card (white, level 1) → popover (level 3) → drawer (level 4) → dialog (level 5 + scrim).</li><li>Level 2 "raised card" is defined but not used by any IB2 component: no controlled use case justifies it yet.</li><li>Native &lt;dialog&gt; and popover use the browser top layer, so no z-index tokens are needed for them.</li></ul>')}
''', intro=intro('Elevation communicates hierarchy, not decoration.'))
