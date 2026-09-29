import tokens as T, icons as I, specs as S, html
def esc(s): return html.escape(str(s))
ic=I.ic

def root_css():
    v='\n  '.join(T.css_vars())
    comf='\n  '.join(T.density_vars(0)); comp='\n  '.join(T.density_vars(1))
    syn='\n  '.join(f'--paep-brand-{k}: {x};' for k,x in T.BRAND_SYNTHETIC.items())
    bc = "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M9 5l7 7-7 7'/%3E%3C/svg%3E\")"
    return f""":root{{
  {v}
  --paep-bc-sep: {bc};
  {comf}
}}
[data-paep-density=compact]{{
  {comp}
}}
@media (pointer: coarse){{ [data-paep-density=compact]{{ --paep-density-control-height: 40px; --paep-density-tab-height: 40px; }} }}
/* brand layer: products may set ONLY --paep-brand-* (protected tokens are rejected by the brand-profile validator) */
[data-paep-brand=synthetic-demo-petrol]{{
  {syn}
}}
"""
CSS = None
def all_css():
    global CSS
    if CSS is None:
        CSS = root_css()+open('components.css').read()+open('lab.css').read()
    return CSS

SCREENS = [  # id, file, title, group
 ('SCR-IB2-L01','L01-ui-lab-home.html','UI lab home and information architecture','UI lab'),
 ('SCR-IB2-L02','L02-ui-lab-specimen-button.html','Component specimen template (Button)','UI lab'),
 ('SCR-IB2-F01','F01-colour.html','Colour','Foundations'),
 ('SCR-IB2-F02','F02-typography.html','Typography','Foundations'),
 ('SCR-IB2-F03','F03-spacing-size-radius.html','Spacing, size and radius','Foundations'),
 ('SCR-IB2-F04','F04-surfaces-elevation.html','Surfaces and elevation','Foundations'),
 ('SCR-IB2-F05','F05-motion.html','Motion and reduced motion','Foundations'),
 ('SCR-IB2-F06','F06-density.html','Density','Foundations'),
 ('SCR-IB2-F07','F07-focus-states.html','Focus and interaction states','Foundations'),
 ('SCR-IB2-F08','F08-icons.html','Icons','Foundations'),
 ('SCR-IB2-C01','C01-actions.html','Actions','Components'),
 ('SCR-IB2-C02','C02-forms.html','Forms','Components'),
 ('SCR-IB2-C03','C03-table-shell.html','Table shell','Components'),
 ('SCR-IB2-C03N','C03N-table-narrow-strategies.html','Table narrow strategies (D1 decision)','Components'),
 ('SCR-IB2-C04','C04-list-pagination-empty.html','List, pagination, empty state','Components'),
 ('SCR-IB2-C05','C05-feedback.html','Feedback','Components'),
 ('SCR-IB2-C06A','C06A-dialog-destructive.html','Dialog: destructive confirmation','Overlays'),
 ('SCR-IB2-C06B','C06B-dialog-long-content.html','Dialog: long content','Overlays'),
 ('SCR-IB2-C06C','C06C-dialog-form-large.html','Dialog: large form','Overlays'),
 ('SCR-IB2-C06D','C06D-drawer.html','Drawer','Overlays'),
 ('SCR-IB2-C06E','C06E-popover.html','Popover','Overlays'),
 ('SCR-IB2-C07','C07-navigation.html','Navigation','Components'),
 ('SCR-IB2-C08','C08-structure.html','Structure','Components'),
 ('SCR-IB2-F09','F09-brand-override.html','Brand override demonstration','Proofs'),
 ('SCR-IB2-R01','R01-long-content.html','Long-content proof','Proofs'),
 ('SCR-IB2-R02','R02-rtl.html','RTL proof','Proofs'),
 ('SCR-IB2-R02D','R02D-drawer-rtl.html','RTL drawer','Proofs'),
 ('SCR-IB2-R03','R03-reflow-320.html','320 CSS px reflow board','Proofs'),
]
BYID={s[0]:s for s in SCREENS}

NAV = [
 ('Overview',[('SCR-IB2-L01','Lab home'),('SCR-IB2-L02','Specimen template')]),
 ('Foundations',[('SCR-IB2-F01','Colour'),('SCR-IB2-F02','Typography'),('SCR-IB2-F03','Spacing, size, radius'),('SCR-IB2-F04','Surfaces, elevation'),('SCR-IB2-F05','Motion'),('SCR-IB2-F06','Density'),('SCR-IB2-F07','Focus, states'),('SCR-IB2-F08','Icons')]),
 ('Components',[('SCR-IB2-C01','Actions'),('SCR-IB2-C02','Forms'),('SCR-IB2-C03','Data: table shell'),('SCR-IB2-C04','Data: list, pagination'),('SCR-IB2-C05','Feedback'),('SCR-IB2-C06A','Overlays'),('SCR-IB2-C07','Navigation'),('SCR-IB2-C08','Structure')]),
 ('Proofs',[('SCR-IB2-R03','Responsive / 320'),('SCR-IB2-R01','Long content'),('SCR-IB2-R02','RTL'),('SCR-IB2-F09','Brand override'),('SCR-IB2-C03N','Table strategies')]),
]

LAB_JS = r"""
(function(){
 var h=document.documentElement;
 var lc=document.getElementById('lab-contents'); if(lc&&window.matchMedia('(max-width: 63.9375em)').matches) lc.removeAttribute('open');
 function q(s,r){return (r||document).querySelector(s)} function qa(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s))}
 var d=q('#lab-density'); if(d){d.value=h.getAttribute('data-paep-density')||'comfortable'; d.onchange=function(){h.setAttribute('data-paep-density',d.value)}}
 var r=q('#lab-dir'); if(r){r.value=h.getAttribute('dir')||'ltr'; r.onchange=function(){h.setAttribute('dir',r.value); tabsCheck()}}
 var b=q('#lab-brand'); if(b){b.value=h.getAttribute('data-paep-brand')||'proseit-default'; b.onchange=function(){h.setAttribute('data-paep-brand',b.value)}}
 var m=q('#lab-rm'); if(m){m.checked=h.classList.contains('rm'); m.onchange=function(){h.classList.toggle('rm',m.checked)}}
 // tabs: roving tabindex, automatic activation, overflow affordance
 qa('[role=tablist]').forEach(function(list){
  var manual=list.getAttribute('data-activation')==='manual';
  var tabs=qa('[role=tab]',list);
  function sel(t){tabs.forEach(function(x){var on=x===t;x.setAttribute('aria-selected',on);x.tabIndex=on?0:-1;var p=document.getElementById(x.getAttribute('aria-controls'));if(p)p.hidden=!on});}
  tabs.forEach(function(t,i){
   t.addEventListener('click',function(){if(t.getAttribute('aria-disabled')!=='true')sel(t)});
   t.addEventListener('keydown',function(e){
    var rtl=getComputedStyle(list).direction==='rtl',k=e.key,n=null;
    if(k==='ArrowRight')n=rtl?i-1:i+1; else if(k==='ArrowLeft')n=rtl?i+1:i-1; else if(k==='Home')n=0; else if(k==='End')n=tabs.length-1;
    else if((k==='Enter'||k===' ')&&manual&&t.getAttribute('aria-disabled')!=='true'){e.preventDefault();sel(t);return}
    if(n===null)return; e.preventDefault(); n=(n+tabs.length)%tabs.length; var tt=tabs[n];
    tabs.forEach(function(x){x.tabIndex=-1}); tt.tabIndex=0; tt.focus(); tt.scrollIntoView({block:'nearest',inline:'nearest'});
    if(!manual&&tt.getAttribute('aria-disabled')!=='true')sel(tt);
   });
  });
 });
 function tabsCheck(){qa('.paep-tabs__wrap').forEach(function(w){var l=q('[role=tablist]',w);w.classList.toggle('has-overflow',l.scrollWidth>l.clientWidth+1);w.classList.toggle('scrolled',Math.abs(l.scrollLeft)>2)})}
 qa('.paep-tabs__wrap').forEach(function(w){var l=q('[role=tablist]',w);l.addEventListener('scroll',tabsCheck);qa('.paep-tabs__scroll button',w).forEach(function(bt){bt.onclick=function(){var dir=bt.getAttribute('data-dir')==='end'?1:-1;if(getComputedStyle(l).direction==='rtl')dir=-dir;l.scrollBy({left:dir*160})}})});
 window.addEventListener('resize',tabsCheck); tabsCheck();
 // disclosure (row detail, panel)
 qa('[data-toggle]').forEach(function(btn){btn.addEventListener('click',function(){var t=document.getElementById(btn.getAttribute('aria-controls'));var open=btn.getAttribute('aria-expanded')!=='true';btn.setAttribute('aria-expanded',open);if(btn.getAttribute('data-toggle')==='row'){t.classList.toggle('is-open',open)}else{t.hidden=!open;var p=btn.closest('.paep-panel');if(p)p.classList.toggle('is-collapsed',!open)}})});
 // breadcrumb expand
 qa('.bc-more button').forEach(function(bt){bt.onclick=function(){var nav=bt.closest('.paep-breadcrumb');nav.classList.remove('is-collapsed');bt.setAttribute('aria-expanded','true');var f=q('.is-collapsible a',nav);if(f)f.focus()}});
 // action-group overflow menu
 qa('[aria-haspopup=menu]').forEach(function(bt){var menu=document.getElementById(bt.getAttribute('aria-controls'));if(!menu)return;
  function items(){return qa('[role=menuitem]:not([aria-disabled=true])',menu)}
  function open(last){menu.hidden=false;bt.setAttribute('aria-expanded','true');var it=items();(last?it[it.length-1]:it[0]).focus()}
  function close(ret){menu.hidden=true;bt.setAttribute('aria-expanded','false');if(ret)bt.focus()}
  bt.addEventListener('click',function(){menu.hidden?open():close(true)});
  bt.addEventListener('keydown',function(e){if(e.key==='ArrowDown'){e.preventDefault();open()}if(e.key==='ArrowUp'){e.preventDefault();open(true)}});
  menu.addEventListener('keydown',function(e){var it=items(),i=it.indexOf(document.activeElement);
   if(e.key==='Escape'){e.preventDefault();close(true)}else if(e.key==='ArrowDown'){e.preventDefault();it[(i+1)%it.length].focus()}else if(e.key==='ArrowUp'){e.preventDefault();it[(i-1+it.length)%it.length].focus()}else if(e.key==='Home'){e.preventDefault();it[0].focus()}else if(e.key==='End'){e.preventDefault();it[it.length-1].focus()}else if(e.key==='Tab'){close(false)}});
  qa('[role=menuitem]',menu).forEach(function(mi){mi.addEventListener('click',function(){close(true)})});
 });
 // modal overlays that should be open for the specimen
 qa('dialog[data-open-modal]').forEach(function(dl){try{dl.showModal()}catch(e){dl.setAttribute('open','')} var f=dl.querySelector('[data-initial-focus]'); if(f)f.focus()});
 qa('[data-close]').forEach(function(b){b.addEventListener('click',function(){var dl=b.closest('dialog');if(dl)dl.close()})});
 qa('.paep-dialog__body').forEach(function(bd){var dl=bd.closest('.paep-dialog');function u(){dl.classList.toggle('is-scrolling',bd.scrollHeight>bd.clientHeight+1)}u();window.addEventListener('resize',u)});
})();
"""

def nav(current):
    out=['<nav class="lab-nav" aria-label="UI lab contents"><details open id="lab-contents"><summary>'+ic('contents')+'Contents</summary><ul>']
    for g,items in NAV:
        out.append(f'<li><span class="grp" id="g-{esc(g)}">{esc(g)}</span><ul aria-labelledby="g-{esc(g)}">')
        for sid,label in items:
            f=BYID[sid][1]; cur=' aria-current="page"' if sid==current or (current.startswith('SCR-IB2-C06') and sid=='SCR-IB2-C06A' and current!='SCR-IB2-C06A' and False) else ''
            out.append(f'<li><a href="{f}"{cur}>{esc(label)}</a></li>')
        out.append('</ul></li>')
    out.append('</ul></details></nav>')
    return ''.join(out)

def page(sid, body, *, lang='en', dir='ltr', density='comfortable', brand='proseit-default', rm=False, extra_after='', chrome=True, title=None, intro=''):
    _id,fname,t,grp = BYID[sid]
    title = title or t
    top = f'''<header class="lab-top"><div class="lab-brand"><strong>PAEP UI lab</strong><span class="lab-tag">CANDIDATE · HOF-IB2-001 v1.1 · BRAND REVISION · FINAL PO/SA REVIEW</span></div>
<div class="lab-controls" role="group" aria-label="Specimen settings">
<label>Density<select id="lab-density"><option value="comfortable">Comfortable</option><option value="compact">Compact</option></select></label>
<label>Direction<select id="lab-dir"><option value="ltr">LTR</option><option value="rtl">RTL</option></select></label>
<label>Brand profile<select id="lab-brand"><option value="proseit-default">proseit-default</option><option value="synthetic-demo-petrol">synthetic-demo-petrol</option></select></label>
<label class="lab-check"><input type="checkbox" id="lab-rm"> Simulate reduced motion</label></div></header>''' if chrome else ''
    main = f'<main class="lab-main" id="main"><div class="lab-intro"><span class="lab-idline">{sid} · {esc(grp)} · DWP-IB2-001</span><h1 class="t-heading-1">{esc(title)}</h1>{intro}</div>{body}</main>'
    layout = f'<div class="lab-layout">{nav(sid)}{main}</div>' if chrome else body
    cls=' class="rm"' if rm else ''
    return f'''<!doctype html>
<html lang="{lang}" dir="{dir}" data-paep-density="{density}" data-paep-brand="{brand}"{cls}>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>{esc(sid)} {esc(title)} · PAEP UI lab candidate</title>
<!-- HOF-IB2-001 v1.1 (DWP-IB2-001) · status READY_FOR_FINAL_PO_SA_APPROVAL · prototype reference only (PAEP-DCH-01 §9.2(v)); not production code. Independently composed for ProSEIT; no third-party assets. -->
<style>{all_css()}</style></head>
<body>{I.sprite()}{top}{layout}{extra_after}<script>{LAB_JS}</script></body></html>'''

def notes(comp_id, usage=None, extra=None):
    c=[x for x in S.C if x['id']==comp_id][0]
    st=[k for k,v in c['states'].items() if not str(v).startswith('Not applicable')]
    na=[k for k,v in c['states'].items() if str(v).startswith('Not applicable')]
    items=[('Purpose',c['purpose']),('Variants',c['variants']),('States',', '.join(st)+('. Not applicable: '+', '.join(na) if na else '')),('Keyboard',c['keyboard']),
           ('Accessibility',c['a11y']+' '+c['semantics']),('Responsive',c['responsive']),('Localisation / RTL',c['rtl']+' Long content: '+c['long_content']),
           ('Usage guidance',usage or ('Do not: '+c['prohibited'])),('Evidence','<span class="evidence">EVIDENCE-LINK-PENDING: unit · accessibility · visual · 320px (IB2 implementation)</span>')]
    return '<dl class="notes">'+''.join(f'<div><dt>{k}</dt><dd>{v if k=="Evidence" else esc(v)}</dd></div>' for k,v in items)+'</dl>'

def specimen(title, stage, comp_id=None, sub='', usage=None, stage_cls='stage'):
    hid='h-'+(comp_id or title.lower().replace(' ','-').replace('/','-'))
    return f'<section class="specimen" aria-labelledby="{hid}"><header><h2 class="t-heading-2" id="{hid}">{esc(title)}</h2>{sub}</header><div class="{stage_cls}">{stage}</div>{notes(comp_id,usage) if comp_id else ""}</section>'

def cap(t): return f'<span class="cap">{esc(t)}</span>'
def btn(label, v='primary', icon=None, state='', extra='', block=False):
    cls=f'paep-button paep-button--{v}'+(' paep-button--block' if block else '')+(' '+state if state and not state.startswith('attr:') else '')
    attrs=''
    if state=='disabled': attrs=' disabled'; cls=cls.replace(' disabled','')
    if state=='loading': attrs=' aria-busy="true" aria-disabled="true"'; cls=cls.replace(' loading',''); icon='spinner'
    return f'<button type="button" class="{cls}"{attrs}{extra}>{ic(icon) if icon else ""}<span>{esc(label)}</span></button>'
def ibtn(label, icon, v='secondary', state='', extra=''):
    attrs=' disabled' if state=='disabled' else ''
    return f'<button type="button" class="paep-button paep-button--{v} paep-icon-button {state if state!="disabled" else ""}" aria-label="{esc(label)}"{attrs}{extra}>{ic(icon)}</button>'
def badge(text, tone):
    icn={'success':'success','warning':'warning','error':'error','info':'info','neutral':'neutral'}[tone]
    return f'<span class="paep-badge paep-badge--{tone}">{ic(icn,"sm")}<span>{esc(text)}</span></span>'
def alert(status, title, body, actions='', dismiss=False, role=''):
    word={'info':'Information','success':'Success','warning':'Warning','error':'Error'}[status]
    d=ibtn('Dismiss','close','tertiary',extra='') .replace('paep-icon-button','paep-icon-button paep-alert__dismiss') if dismiss else '<span></span>'
    r=f' role="{role}"' if role else ''
    t=f'<p class="paep-alert__title" style="margin:0">{esc(title)}</p>' if title else ''
    a=f'<div class="paep-alert__actions">{actions}</div>' if actions else ''
    return f'<div class="paep-alert paep-alert--{status}"{r}>{ic(status,"md","paep-alert__icon")}<div class="paep-alert__body"><span class="vh">{word}:</span>{t}<p style="margin:0">{esc(body)}</p>{a}</div>{d}</div>'
