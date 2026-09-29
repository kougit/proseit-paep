import specs as S, tokens as T, shell, icons as I, json
from contrast import cr
OUT='out/HOF-IB2-001'
H='> HOF-IB2-001 v1.1 (brand revision) · DWP-IB2-001 v1.0 · status **READY_FOR_FINAL_PO_SA_APPROVAL** (DCH §17.1 "REVIEW"). Not APPROVED_FOR_IMPLEMENTATION. Candidate values require PO/SA approval.\n\n'
# component-specs.md
o=['# Component specifications (DWP-IB2-001)\n\n'+H+'25 components across 7 families (IR-01 §6.4). Each entry gives the 15 fields required by the design stage. "Not applicable" states are stated, not manufactured.\n']
for fam in S.FAMILIES:
    o.append(f'\n## {fam}\n')
    for c in [x for x in S.C if x['family']==fam]:
        o.append(f"\n### {c['name']}\n\n| Field | Specification |\n| --- | --- |\n")
        rows=[('Production target',c['target']),('Requirements',c['reqs']),('Specimen screens',', '.join(c['screens'])),('Purpose',c['purpose']),('Anatomy',c['anatomy']),('Visual hierarchy',c['hierarchy']),('Variants',c['variants']),
              ('States',' <br>'.join(f"**{k}**: {v}" for k,v in c['states'].items())),('Keyboard intent',c['keyboard']),('Focus intent',c['focus']),('Semantics intent',c['semantics']),
              ('Responsive behaviour',c['responsive']),('Long-content behaviour',c['long_content']),('RTL behaviour',c['rtl']),('Density behaviour',c['density']),('Token usage',c['tokens']),('Prohibited usage',c['prohibited']),('Accessibility notes',c['a11y'])]
        for k,v in rows: o.append(f"| {k} | {str(v).replace('|','/')} |\n")
open(OUT+'/component-specs.md','w').write(''.join(o))
# component-map.md
o=['# Component map\n\n'+H+'Maps every design element to its PAEP production target (DCH §10). IB2 creates these targets, so every row is a **new IB2 tranche component** authorised by IR-01 §6.4, not a PROPOSED NEW PATTERN beyond the tranche. No component outside the 25 is introduced.\n\n| # | Family | Design element | PAEP target | Screens | Primary tokens |\n| --- | --- | --- | --- | --- | --- |\n']
for i,c in enumerate(S.C,1): o.append(f"| {i} | {c['family']} | {c['name']} | `{c['target'].split(': ',1)[1]}` | {', '.join(c['screens'])} | {c['tokens'].split(',')[0]} … |\n")
o.append('''
## Sub-elements that are part of a tranche component (not new public components)

| Sub-element | Belongs to | Note |
| --- | --- | --- |
| Overflow ("More") menu | Action group | Built on Popover (menu variant); role=menu. Not a general Menu component. |
| Row-detail disclosure | Table shell | Button + detail row + `<dl>`. |
| Scroll buttons in tab list | Tabs | Pointer affordance, aria-hidden. |
| "Show full path" button | Breadcrumb | Inline expansion, no popover. |
| Error summary alert | Alert | Focus target after failed submit. |
| Visually hidden live-region announcer | Foundation / platform utility | For transient messages; not a Toast. See interaction-notes §Transient. |

## Items deliberately NOT created

| Item | Reason |
| --- | --- |
| Toast | Not in IR-01 §6.4 tranche (PAEP §8 lists it for later). Transient messages use the live-region announcer. |
| Tooltip | Not in tranche. Icon-only buttons therefore restricted to conventional meanings. |
| Menu / menubar (general) | Not in tranche; overflow menu is internal to Action group. |
| Toggle switch, date/time, autocomplete, multi-select | Not in tranche. |
| Row selection, sort, filter UI | Out of IB2 scope (02-TECHNICAL-ANALYSIS §D). |
| Raised card usage | Token level 2 defined, no controlled use case. |
| Lab navigation shell | Lab uses a plain contents list; enterprise shell is IB3. |
''')
open(OUT+'/component-map.md','w').write(''.join(o))
# contrast table text
rows=[]
for pid,fg,bg,kind,req in T.pairs():
    if not(fg.startswith('#') and bg.startswith('#')): continue
    r=cr(fg,bg); res='informational' if kind=='info' else ('PROHIBITED combination (fails; never used, enforced by rule)' if kind=='prohibited' else ('exempt (legibility target met)' if kind=='exempt' and (req is None or r>=req) else ('exempt' if kind=='exempt' else ('PASS' if r>=req else 'FAIL'))))
    rows.append(f'| {pid} | `{fg}` | `{bg}` | {r:.2f}:1 | {("≥ "+str(req)+":1") if req else "n/a"} | {res} |')
open('contrast_rows.md','w').write('\n'.join(rows))
print('pairs',len(rows), 'required',sum(r.endswith('| PASS |') or r.endswith('| FAIL |') for r in rows),'pass',sum(r.endswith('| PASS |') for r in rows),'fails', sum(r.endswith('| FAIL |') for r in rows),'exempt',sum('exempt' in r for r in rows),'prohib',sum('PROHIBITED combination (fails' in r for r in rows))
brand_rows=[]
for name,b in (('proseit-default',T.BRAND_DEFAULT),('synthetic-demo-petrol',T.BRAND_SYNTHETIC),('rejected-demo-yellow',T.BRAND_REJECTED)):
    for pid,fg,bg,req in T.brand_pairs(b):
        r=cr(fg,bg); brand_rows.append(f'| {name} | {pid} | {r:.2f}:1 | ≥ {req}:1 | {"PASS" if r>=req else "FAIL → profile rejected"} |')
open('brand_rows.md','w').write('\n'.join(brand_rows))
# token JSON (reference)
tok={'handoffId':'HOF-IB2-001','version':'1.1','handoffStatus':'READY_FOR_FINAL_PO_SA_APPROVAL','note':'Candidate values; reference data for the token catalogue. Names follow 02-TECHNICAL-ANALYSIS §C.',
 'neutral':T.NEUTRAL,'semantic':T.SEMANTIC,'status':T.STATUS,'brandProfiles':{'proseit-default':T.BRAND_DEFAULT,'synthetic-demo-petrol':T.BRAND_SYNTHETIC},
 'brandOverridableKeys':list(T.BRAND_DEFAULT.keys()),'protected':['--paep-color-status-*','--paep-color-focus-*','--paep-color-disabled-*','--paep-color-text-*','--paep-color-invalid-*','--paep-color-readonly-*','--paep-color-border-default','--paep-color-scrim','--paep-color-surface*','--paep-color-bg-page'],
 'typography':{'sans':T.FONT_SANS,'mono':T.FONT_MONO,'scale':[dict(role=r,sizePx=s,lineHeightPx=l,weight=w,letterSpacing=ls) for r,s,l,w,ls in T.TYPE]},
 'space':dict(T.SPACE),'radius':dict(T.RADIUS),'icon':dict(T.ICON),'density':{k:{'comfortable':a,'compact':b} for k,(a,b) in T.DENSITY.items()},
 'elevation':[dict(level=e,role=r,shadow=s,border=b) for e,r,s,b in T.ELEVATION],'motion':{'duration':dict(T.MOTION_DUR),'easing':dict(T.MOTION_EASE),'loop':dict(T.MOTION_LOOP)},
 'breakpoints':[dict(name=n,minPx=a,maxPx=b) for n,a,b in T.BREAKPOINTS],'focus':{'color':T.SEMANTIC['focus-ring'],'widthPx':2,'offsetPx':2,'halo':T.SEMANTIC['focus-halo']}}
json.dump(tok,open(OUT+'/foundation/token-values.candidate.json','w'),indent=1)
open(OUT+'/foundation/prototype-reference.css','w').write('/* HOF-IB2-001 prototype reference CSS (DCH §9.2(v)): reference only, NOT production code. Claude Code reconstructs production tokens/components under PAEP rules. */\n'+shell.all_css())
