# Candidate token values for HOF-IB2-001 (DWP-IB2-001 v1.0). Single source for CSS, JSON and contrast evidence.
from contrast import cr

NEUTRAL = {  # cool-grey ramp, independently tuned for legibility on low-quality/bright-ambient displays
 '0':'#FFFFFF','25':'#F7F8FA','50':'#EFF2F5','100':'#E3E7EC','200':'#D3D9E0','300':'#B6BCC4',
 '400':'#8C949E','500':'#6A737E','600':'#545D68','700':'#3E4650','800':'#2A3038','900':'#1A1F26'}

BRAND_DEFAULT = {  # proseit-default: ProSEIT Navy + ProSEIT Gold (PO/SA brand direction 2026-09-27); tonal variants are CANDIDATE values
 'primary':'#24364B','primary-hover':'#1B2A3B','primary-active':'#121E2B','primary-subtle':'#E7ECF2','on-primary':'#FFFFFF',
 'accent':'#D4A62A','on-accent':'#1A1F26'}

BRAND_SYNTHETIC = {  # synthetic-demo-petrol: clearly synthetic, non-product; demonstrates the override path only
 'primary':'#0B5E73','primary-hover':'#094C5E','primary-active':'#073C4A','primary-subtle':'#E4F1F4','on-primary':'#FFFFFF',
 'accent':'#9ED6E0','on-accent':'#1A1F26'}

BRAND_REJECTED = {  # deliberately failing override used by the lab to show fail-closed rejection
 'primary':'#E9B308','on-primary':'#FFFFFF','accent':'#E9B308','on-accent':'#FFFFFF'}

STATUS = {  # PROTECTED - never brand-overridable
 'success':{'fg':'#16693A','bg':'#E6F3EA','border':'#6BAF83','strong':'#16693A'},
 'warning':{'fg':'#8A4B00','bg':'#FDF1DC','border':'#D9A441','strong':'#8A4B00'},
 'error':  {'fg':'#B3261E','bg':'#FCEBE9','border':'#E08A83','strong':'#B3261E'},
 'info':   {'fg':'#1F5AA8','bg':'#E7EFFA','border':'#7FA3D6','strong':'#1F5AA8'},
 'neutral':{'fg':'#3E4650','bg':'#EFF2F5','border':'#B6BCC4','strong':'#3E4650'},
}

N=NEUTRAL
SEMANTIC = {  # PROTECTED neutral/text/state layer
 'bg-page':N['50'],'surface':N['0'],'surface-subtle':N['25'],'surface-sunken':N['50'],'surface-raised':N['0'],
 'surface-overlay':N['0'],'scrim':'rgb(26 31 38 / 0.56)',
 'text-primary':N['900'],'text-secondary':N['600'],'text-placeholder':N['600'],'text-disabled':N['500'],
 'text-inverse':N['0'],'icon-default':N['600'],
 'border-subtle':N['200'],'border-default':N['500'],'border-strong':N['700'],
 'hover-neutral':N['50'],'active-neutral':N['100'],
 'disabled-bg':N['100'],'disabled-border':N['300'],'disabled-fg':N['500'],
 'readonly-bg':N['25'],'readonly-border':N['400'],
 'invalid-border':STATUS['error']['fg'],'invalid-fg':STATUS['error']['fg'],
 'focus-ring':'#2D4FD1','focus-halo':N['0'],
}

TYPE = [  # role, size px, line-height px, weight, letter-spacing
 ('caption',12,16,400,'0'),('body-sm',13,18,400,'0'),('body',14,20,400,'0'),('body-lg',16,24,400,'0'),
 ('label',14,20,600,'0'),('title-sm',16,24,600,'0'),('title',18,26,600,'0'),('heading-3',20,28,600,'0'),
 ('heading-2',24,32,600,'-0.01em'),('heading-1',30,38,600,'-0.01em'),('data',14,20,400,'0'),('code',13,20,400,'0'),
]
FONT_SANS = 'system-ui, -apple-system, "Segoe UI", Roboto, "Noto Sans", "Noto Sans Arabic", "Noto Sans Ethiopic", "Helvetica Neue", Arial, sans-serif'
FONT_MONO = 'ui-monospace, "SFMono-Regular", "Cascadia Mono", "Segoe UI Mono", "Roboto Mono", "Noto Sans Mono", Menlo, Consolas, "Liberation Mono", monospace'

SPACE = [('0',0),('0-5',2),('1',4),('2',8),('3',12),('4',16),('5',20),('6',24),('7',32),('8',40),('9',48),('10',64)]
RADIUS = [('none',0),('xs',2),('sm',4),('md',6),('lg',8),('full',9999)]
ICON = [('sm',16),('md',20),('lg',24)]
DENSITY = {  # token: (comfortable, compact)
 'control-height':(40,32),'control-padding-inline':(12,8),'button-padding-inline':(16,12),
 'row-height':(48,36),'cell-padding-block':(12,6),'cell-padding-inline':(16,12),
 'card-padding':(20,16),'stack-gap':(16,12),'field-gap':(4,4),'choice-size':(18,16),'icon-size':(20,16),
 'tab-height':(44,36),'list-item-min-height':(48,36),
}
ELEVATION = [
 ('0','page','none','none'),
 ('1','panel, card','none','1px border-subtle'),
 ('2','raised card (reserved, not used by IB2 components)','0 1px 2px rgb(26 31 38 / 0.08), 0 2px 6px rgb(26 31 38 / 0.06)','1px border-subtle'),
 ('3','popover, overflow menu','0 4px 16px rgb(26 31 38 / 0.16)','1px border-subtle'),
 ('4','drawer','0 8px 28px rgb(26 31 38 / 0.22)','1px border-subtle (leading edge)'),
 ('5','dialog','0 16px 40px rgb(26 31 38 / 0.26)','1px border-subtle'),
]
MOTION_DUR = [('instant',0),('fast',90),('base',150),('moderate',200),('slow',250)]
MOTION_EASE = [('standard','cubic-bezier(0.25, 0.1, 0.25, 1)'),('enter','cubic-bezier(0.1, 0.6, 0.3, 1)'),('exit','cubic-bezier(0.5, 0, 0.8, 0.4)'),('linear','linear')]
MOTION_LOOP = [('spinner',900),('indeterminate',1800),('skeleton-pulse',1600)]
BREAKPOINTS = [('narrow',0,599),('tablet',600,1023),('desktop',1024,1439),('wide',1440,None)]

def css_vars(brand=BRAND_DEFAULT):
    out=[]
    for k,v in NEUTRAL.items(): out.append(f'--paep-ref-color-neutral-{k}: {v};')
    for k,v in SEMANTIC.items(): out.append(f'--paep-color-{k}: {v};')
    for s,d in STATUS.items():
        for k,v in d.items(): out.append(f'--paep-color-status-{s}-{k}: {v};')
    for k,v in brand.items(): out.append(f'--paep-brand-{k}: {v};')
    out += ['--paep-color-selected-bg: var(--paep-brand-primary-subtle);','--paep-color-selected-fg: var(--paep-brand-primary);',
            '--paep-color-selected-indicator: var(--paep-brand-primary);','--paep-color-link: var(--paep-brand-primary);']
    out += [f'--paep-font-family-sans: {FONT_SANS};', f'--paep-font-family-mono: {FONT_MONO};']
    for r,s,lh,w,ls in TYPE:
        out += [f'--paep-font-size-{r}: {s/16:g}rem;',f'--paep-line-height-{r}: {lh/16:g}rem;',f'--paep-font-weight-{r}: {w};',f'--paep-letter-spacing-{r}: {ls};']
    for k,v in SPACE: out.append(f'--paep-space-{k}: {v/16:g}rem;')
    for k,v in RADIUS: out.append(f'--paep-radius-{k}: {v}px;')
    for k,v in ICON: out.append(f'--paep-size-icon-{k}: {v}px;')
    out += ['--paep-size-target-min: 24px;','--paep-size-target-touch: 40px;']
    for e,_,sh,_b in ELEVATION: out.append(f'--paep-elevation-{e}: {sh};')
    for k,v in MOTION_DUR: out.append(f'--paep-motion-duration-{k}: {v}ms;')
    for k,v in MOTION_EASE: out.append(f'--paep-motion-easing-{k}: {v};')
    for k,v in MOTION_LOOP: out.append(f'--paep-motion-loop-{k}: {v}ms;')
    out += ['--paep-motion-loop-state: running;','--paep-focus-ring-width: 2px;','--paep-focus-ring-offset: 2px;']
    out += ['--paep-layout-page-margin: 1rem;','--paep-layout-gutter: 1rem;','--paep-layout-content-max: 90rem;','--paep-layout-form-max: 40rem;','--paep-layout-reading-max: 45rem;']
    return out

def density_vars(i):
    return [f'--paep-density-{k}: {v[i]}px;' for k,v in DENSITY.items()]

# Foreground/background pairs requiring evidence: (id, fg, bg, kind, requirement)
def pairs():
    P=[]; S=SEMANTIC; B=BRAND_DEFAULT
    for bgk in ('surface','bg-page','surface-subtle'):
        bg=S[bgk]
        P.append((f'text-primary / {bgk}',S['text-primary'],bg,'text',4.5))
        P.append((f'text-secondary / {bgk}',S['text-secondary'],bg,'text',4.5))
        P.append((f'text-placeholder / {bgk}',S['text-placeholder'],bg,'text',4.5))
        P.append((f'border-default (control boundary) / {bgk}',S['border-default'],bg,'non-text',3))
        P.append((f'icon-default / {bgk}',S['icon-default'],bg,'non-text',3))
        P.append((f'focus-ring / {bgk}',S['focus-ring'],bg,'non-text',3))
        P.append((f'link, brand-primary as text / {bgk}',B['primary'],bg,'text',4.5))
        P.append((f'brand-primary (checked control, indicator) / {bgk}',B['primary'],bg,'non-text',3))
    P.append(('text-primary / readonly-bg',S['text-primary'],S['readonly-bg'],'text',4.5))
    P.append(('readonly-border (dashed) / surface',S['readonly-border'],S['surface'],'non-text',3))
    P.append(('text-primary / surface-sunken (prefix/suffix)',S['text-primary'],S['surface-sunken'],'text',4.5))
    P.append(('disabled-fg / disabled-bg (exempt, legibility target 3:1)',S['disabled-fg'],S['disabled-bg'],'exempt',3))
    P.append(('on-brand-primary / brand-primary (primary button)',B['on-primary'],B['primary'],'text',4.5))
    P.append(('on-brand-primary / brand-primary-hover',B['on-primary'],B['primary-hover'],'text',4.5))
    P.append(('on-brand-primary / brand-primary-active',B['on-primary'],B['primary-active'],'text',4.5))
    P.append(('selected-fg (brand-primary) / selected-bg (brand-primary-subtle)',B['primary'],B['primary-subtle'],'text',4.5))
    P.append(('selected indicator (brand-primary) / brand-primary-subtle',B['primary'],B['primary-subtle'],'non-text',3))
    P.append(('on-brand-accent / brand-accent (gold emphasis fill)',B['on-accent'],B['accent'],'text',4.5))
    P.append(('brand-accent (gold) as text on brand-primary (navy)',B['accent'],B['primary'],'text',4.5))
    P.append(('white text / brand-accent (PROHIBITED combination)','#FFFFFF',B['accent'],'prohibited',4.5))
    P.append(('brand-accent (gold) as text or indicator on surface (PROHIBITED)',B['accent'],S['surface'],'prohibited',3))
    P.append(('text-inverse / status-error-strong (destructive button)',S['text-inverse'],STATUS['error']['strong'],'text',4.5))
    P.append(('text-inverse / destructive hover #93201A','#FFFFFF','#93201A','text',4.5))
    P.append(('status-error-fg (invalid border, error text) / surface',STATUS['error']['fg'],S['surface'],'text',4.5))
    for s,d in STATUS.items():
        P.append((f'status-{s}-fg / status-{s}-bg',d['fg'],d['bg'],'text',4.5))
        P.append((f'text-primary / status-{s}-bg',S['text-primary'],d['bg'],'text',4.5))
        P.append((f'status-{s}-fg (icon) / surface',d['fg'],S['surface'],'non-text',3))
    P.append(('focus-ring / brand-primary (ring never touches the fill; halo governs)',S['focus-ring'],B['primary'],'info',None))
    P.append(('focus-ring / focus-halo (two-tone guarantee)',S['focus-ring'],S['focus-halo'],'non-text',3))
    P.append(('progress fill brand-primary / track neutral-200',B['primary'],NEUTRAL['200'],'non-text',3))
    P.append(('skeleton block neutral-100 / surface (decorative, aria-hidden)',NEUTRAL['100'],S['surface'],'exempt',None))
    return P

def brand_pairs(b):
    return [('on-brand-primary / brand-primary',b['on-primary'],b['primary'],4.5),('brand-primary as text / surface',b['primary'],SEMANTIC['surface'],4.5),
            ('brand-primary / bg-page (non-text)',b['primary'],SEMANTIC['bg-page'],3),('on-brand-accent / brand-accent',b['on-accent'],b['accent'],4.5)]

if __name__=='__main__':
    bad=0
    for pid,fg,bg,kind,req in pairs():
        if fg.startswith('#') and bg.startswith('#'):
            r=cr(fg,bg); ok = (req is None) or r>=req
            if not ok and kind not in ('info','prohibited'): bad+=1
            print(f'{r:5.2f} {kind:8} {"PASS" if ok else "FAIL"} {pid}')
    for name,b in (('synthetic',BRAND_SYNTHETIC),('rejected',BRAND_REJECTED)):
        for pid,fg,bg,req in brand_pairs(b): print(name, f'{cr(fg,bg):.2f}', pid, 'PASS' if cr(fg,bg)>=req else 'FAIL')
    print('FAILS',bad)
