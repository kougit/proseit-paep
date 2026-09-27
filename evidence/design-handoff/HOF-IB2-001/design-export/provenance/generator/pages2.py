from pages1 import *

# ---------- F05 MOTION ----------
dur=''.join(f'<tr><td><code>--paep-motion-duration-{k}</code></td><td class="paep-num">{v} ms</td><td>0 ms</td></tr>' for k,v in T.MOTION_DUR)
eas=''.join(f'<tr><td><code>--paep-motion-easing-{k}</code></td><td><code>{v}</code></td></tr>' for k,v in T.MOTION_EASE)
use='''<table class="lab-table"><thead><tr><th>Interaction</th><th>Motion</th><th>Reduced motion</th></tr></thead><tbody>
<tr><td>Hover/active colour change</td><td>fast 90 ms, standard</td><td>instant</td></tr>
<tr><td>Popover / overflow menu open</td><td>moderate 200 ms, opacity + 4 px block shift, enter easing; close 150 ms exit</td><td>instant appear/disappear</td></tr>
<tr><td>Dialog open</td><td>slow 250 ms, opacity + scale 0.98→1, enter; scrim fades 200 ms; close 150 ms exit</td><td>instant; scrim still appears (essential state change)</td></tr>
<tr><td>Drawer open</td><td>slow 250 ms slide from its logical edge, enter; close 200 ms exit</td><td>instant</td></tr>
<tr><td>Panel expand/collapse</td><td>none (content appears instantly; chevron rotates 150 ms)</td><td>chevron snaps</td></tr>
<tr><td>Tabs selection</td><td>none (indicator moves instantly)</td><td>none</td></tr>
<tr><td>Determinate progress</td><td>width transition 150 ms</td><td>instant update</td></tr>
<tr><td>Indeterminate progress</td><td>35% segment, 1.8 s loop</td><td>static hatched full bar + "In progress" text</td></tr>
<tr><td>Busy spinner (button, retry)</td><td>0.9 s rotation</td><td>static arc + busy text</td></tr>
<tr><td>Skeleton</td><td>opacity pulse 1 → 0.5, 1.6 s, alternate (no directional shimmer)</td><td>static blocks</td></tr>
<tr><td>Page/route transitions, decorative loops</td><td>none</td><td>none</td></tr></tbody></table>'''
def demo(rm):
    c='rm' if rm else ''
    return f'''<div class="frame {c}"><span class="cap">{"prefers-reduced-motion: reduce" if rm else "Default motion"}</span><div class="frame-body">
<div class="paep-progress"><div class="paep-progress__head"><span>Import records</span><span class="paep-num">45%</span></div><div class="paep-progress__track"><div class="paep-progress__fill" style="inline-size:45%"></div></div></div>
<div class="paep-progress paep-progress--indeterminate"><div class="paep-progress__head"><span>Preparing export</span><span>{"In progress" if rm else "Working…"}</span></div><div class="paep-progress__track"><div class="paep-progress__fill"></div></div></div>
<div class="paep-skeleton" aria-hidden="true"><div class="paep-skeleton__block"></div><div class="paep-skeleton__block"></div><div class="paep-skeleton__block" style="inline-size:60%"></div></div>
<div class="row">{btn("Saving…","primary",state="loading")}</div></div></div>'''
P['SCR-IB2-F05']=page('SCR-IB2-F05', f'''
{specimen('Durations and easing', '<div class="grid-2"><div class="lab-scroll"><table class="lab-table"><thead><tr><th>Token</th><th>Default</th><th>Reduced</th></tr></thead><tbody>'+dur+'</tbody></table></div><div class="lab-scroll"><table class="lab-table"><thead><tr><th>Token</th><th>Value</th></tr></thead><tbody>'+eas+'</tbody></table></div></div>')}
{specimen('Where motion is used', '<div class="lab-scroll">'+use+'</div>')}
{specimen('Loading motion: default vs reduced', '<div class="grid-2">'+demo(False)+demo(True)+'</div><p class="t-body-sm t-secondary" style="margin:0">Under reduced motion every duration token becomes 0 ms and loop animations stop at the foundation level, so components need no per-component media query. Busy and progress meaning stays available as text.</p>')}
''', intro=intro('Motion is bounded, purposeful and fully removable. The right-hand frame is the complete prefers-reduced-motion experience.'))

# ---------- F06 DENSITY ----------
def dens_demo(d):
    return f'''<div class="frame" data-paep-density="{d}"><span class="cap">{d.capitalize()}</span><div class="frame-body">
{field("Reference", value="REC-2026-000184")}
<div class="row">{btn("Save")}{btn("Cancel","secondary")}</div>
{table_shell("Records",rows=ROWS[:2],actions=False).replace('<div class="paep-table-shell__foot">','<div hidden class="paep-table-shell__foot">')}
</div></div>'''
P['SCR-IB2-F06']=page('SCR-IB2-F06', f'''
{specimen('Comfortable vs compact', '<div class="grid-2">'+dens_demo("comfortable")+dens_demo("compact")+'</div>')}
{specimen('Profiles', '<div class="lab-scroll"><table class="lab-table"><thead><tr><th></th><th>Comfortable (DEFAULT)</th><th>Compact</th></tr></thead><tbody><tr><td>Control height</td><td>40 px</td><td>32 px (40 px on coarse pointer)</td></tr><tr><td>Table row min-height</td><td>48 px</td><td>36 px</td></tr><tr><td>Cell padding</td><td>12 × 16 px</td><td>6 × 12 px</td></tr><tr><td>Card/panel padding</td><td>20 px</td><td>16 px</td></tr><tr><td>Icons in controls</td><td>20 px</td><td>16 px</td></tr><tr><td>Intended use</td><td>Default everywhere; touch, tablets, field and shared devices, forms</td><td>Opt-in per container for desktop data-heavy tables, lists and dense review screens</td></tr><tr><td>Never changes</td><td colspan="2">Focus ring, labels, text size (14 px body), 24 px minimum target, error text</td></tr></tbody></table></div>')}
''', intro=intro('Two density profiles switchable per container with data-paep-density. Comfortable is the candidate default.'))

# ---------- F07 FOCUS & STATES ----------
def strow(name, cells): return f'<tr><th scope="row">{esc(name)}</th>'+''.join(f'<td>{c}</td>' for c in cells)+'</tr>'
st_tbl='<div class="lab-scroll"><table class="lab-table"><thead><tr><th>State</th><th>Primary</th><th>Secondary</th><th>Input</th><th>Checkbox</th><th>Non-colour cue</th></tr></thead><tbody>'
st_tbl+=strow('Default',[btn('Save'),btn('Cancel','secondary'),field('Label',value='Value'),choice('Option'),'—'])
st_tbl+=strow('Hover',[btn('Save',state='is-hover'),btn('Cancel','secondary',state='is-hover'),'<span class="t-body-sm">Border strong</span>','<span class="t-body-sm">Border strong</span>','pointer only, never essential'])
st_tbl+=strow('Focus-visible',[btn('Save',state='is-focus'),btn('Cancel','secondary',state='is-focus'),field('Label',value='Value',state='focus'),choice('Option',state='focus'),'2 px ring + 2 px halo gap'])
st_tbl+=strow('Active / pressed',[btn('Save',state='is-active'),btn('Cancel','secondary',state='is-active'),'n/a','n/a','darker step'])
st_tbl+=strow('Selected',['n/a','n/a','n/a',choice('Option',checked=True),'check glyph / indicator bar / aria-selected'])
st_tbl+=strow('Disabled',[btn('Save',state='disabled'),btn('Cancel','secondary',state='disabled'),field('Label',value='Value',state='disabled'),choice('Option',state='disabled'),'dashed border + native disabled'])
st_tbl+=strow('Read-only',['n/a','n/a',field('Label',value='Value',state='readonly'),choice('Option',checked=True,state='readonly'),'dashed border, full-contrast value'])
st_tbl+=strow('Invalid',['n/a','n/a',field('Label',value='Value',error='Enter a valid value.'),choice('Option',state='invalid'),'2 px border + icon + text'])
st_tbl+=strow('Loading',[btn('Saving…',state='loading'),btn('Checking…','secondary',state='loading'),'n/a','n/a','spinner + busy label, aria-busy'])
st_tbl+='</tbody></table></div>'
focus_demo=f'''<div class="grid-3">
<div class="frame"><span class="cap">On white surface</span><div class="frame-body">{btn("Save",state="is-focus")}</div></div>
<div class="frame"><span class="cap">On page background</span><div class="frame-body" style="background:var(--paep-color-bg-page)">{btn("Cancel","secondary",state="is-focus")}</div></div>
<div class="frame"><span class="cap">On status tint</span><div class="frame-body" style="background:var(--paep-color-status-warning-bg)">{btn("Review","tertiary",state="is-focus")}</div></div>
<div class="frame"><span class="cap">On dark surface (halo guarantees ≥ 3:1)</span><div class="frame-body" style="background:#1A1F26">{btn("Continue",state="is-focus")}</div></div>
<div class="frame"><span class="cap">Inside a tab list (inset)</span><div class="frame-body">{tabs(["Summary","History"]).replace('class="paep-tab" id','class="paep-tab is-focus" id',1)}</div></div>
<div class="frame"><span class="cap">Compact density</span><div class="frame-body" data-paep-density="compact">{btn("Save",state="is-focus")}</div></div></div>'''
P['SCR-IB2-F07']=page('SCR-IB2-F07', f'''
{specimen('Focus system', focus_demo+'<p class="t-body-sm" style="margin:0">Colour <code>#2D4FD1</code> (protected, 6.67:1 on white, ≥ 5.9:1 on every light surface), 2 px solid outline, 2 px offset, white 2 px halo filling the gap, geometry follows the element radius + offset. Inset (−2 px) only inside scroll containers that would clip it (tabs). Forced-colours: system Highlight.</p>')}
{specimen('Interaction state matrix', st_tbl)}
''', intro=intro('One visible focus system and one interaction-state vocabulary, each with a non-colour cue.'))

# ---------- F08 ICONS ----------
ic_rows=''.join(f'<tr><td>{ic(n,"lg")}</td><td>{ic(n,"md")}</td><td>{ic(n,"sm")}</td><td><code>{n}</code></td><td>{"yes" if m else "no"}</td><td>{esc(d)}</td></tr>' for n,(b,m,d) in I.ICONS.items())
P['SCR-IB2-F08']=page('SCR-IB2-F08', f'''
{specimen('PAEP candidate icon set (independently authored)', '<div class="lab-scroll"><table class="lab-table"><thead><tr><th>24</th><th>20</th><th>16</th><th>Name</th><th>Mirrors in RTL</th><th>Semantic use</th></tr></thead><tbody>'+ic_rows+'</tbody></table></div>')}
{specimen('Rules', '<ul style="margin:0;padding-inline-start:1.2em"><li>24 × 24 grid, 2 px live area margin, 2 px stroke, round caps and joins, outline model; fills only for small dots. Optical weight is one step lighter than 600-weight text.</li><li>Sizes 16/20/24; aligned to the first text line with <code>align-items: flex-start</code> for wrapping labels.</li><li>Colour is <code>currentColor</code>; status icons take the protected status foreground.</li><li>Decorative icons are <code>aria-hidden</code>. An icon that carries meaning alone (icon button) gets its name from the control, never from the SVG title.</li><li>Status icons differ by shape (circle-i, circle-tick, triangle, octagon, circle-dash, clock), not only by colour.</li><li>Directional icons mirror under <code>dir=rtl</code>; clocks, ticks, retry (clockwise) and search do not.</li><li>Delivered as an inline SVG sprite inside the foundation package: self-hosted, no font, no CDN, no third-party licence.</li></ul>')}
''', intro=intro('A small, governed icon vocabulary sized exactly to the IB2 tranche. No third-party icon dependency.'))
