from shell import *
_n=[0]
DC=' data-paep-density="compact"'
AD=' aria-disabled="true"'
def uid(p='x'):
    _n[0]+=1; return f'{p}{_n[0]}'

def field(label, *, value='', placeholder='', help='', error='', required=False, state='', prefix='', suffix='', kind='input', options=None, meta='', rows=3, dirv=None):
    i=uid('f'); hid=f'{i}-h'; eid=f'{i}-e'
    desc=' '.join(x for x,c in ((eid,error),(hid,help)) if c)
    aff=[]; 
    if prefix: aff.append(f'{i}-p')
    if suffix: aff.append(f'{i}-s')
    describedby=' '.join(filter(None,[desc]+aff))
    a=f' id="{i}"'+(f' aria-describedby="{describedby}"' if describedby else '')+(' aria-invalid="true"' if error else '')+(' required' if required else '')
    if state=='disabled': a+=' disabled'
    if state=='readonly': a+=' readonly'
    if dirv: a+=f' dir="{dirv}"'
    ctl_cls='paep-control'+(' is-invalid' if error else '')+(f' is-{state}' if state in ('disabled','readonly','focus') else '')
    if kind=='select':
        opts=''.join(f'<option{" selected" if o==value else ""}>{esc(o)}</option>' for o in options)
        inner=f'<select{a}>{opts}</select>'+ic('chevron-down'); ctl_cls+=' paep-control--select'
    elif kind=='textarea':
        inner=f'<textarea rows="{rows}"{a} placeholder="{esc(placeholder)}">{esc(value)}</textarea>'
    else:
        inner=f'<input type="text"{a} value="{esc(value)}" placeholder="{esc(placeholder)}">'
    if prefix: inner=f'<span class="paep-control__affix" id="{i}-p">{esc(prefix)}</span>'+inner
    if suffix: inner=inner+f'<span class="paep-control__affix" id="{i}-s">{esc(suffix)}</span>'
    req='<span class="paep-field__req" aria-hidden="true">*</span>' if required else ''
    m=f' <span class="paep-field__meta">{esc(meta)}</span>' if meta else ''
    h=f'<span class="paep-field__help" id="{hid}">{esc(help)}</span>' if help else ''
    e=f'<span class="paep-field__error" id="{eid}">{ic("error","sm")}<span>{esc(error)}</span></span>' if error else ''
    return f'<div class="paep-field{" paep-field--disabled" if state=="disabled" else ""}"><label class="paep-field__label" for="{i}">{esc(label)}{req}{m}</label>{h}<div class="{ctl_cls}">{inner}</div>{e}</div>'

def choice(label, kind='checkbox', checked=False, state='', mixed=False, name='g'):
    i=uid('c'); a=' checked' if checked else ''
    if state=='disabled': a+=' disabled'
    if state=='readonly': a+=' aria-readonly="true" onclick="return false"'
    if state=='invalid': a+=' aria-invalid="true"'
    cls='is-mixed' if mixed else ''
    if state=='focus': cls+=' is-focus'
    return f'<label class="paep-choice{(" is-"+state) if state else ""}"><input type="{kind}" name="{name}" class="{cls}"{a}><span>{esc(label)}</span></label>'

ROWS=[('REC-2026-000184','Sample item Alpha','Site 3 · Store B','1,250.00','2026-09-21',('Approved','success')),
      ('REC-2026-000185','Sample item Beta with a longer descriptive name','Site 1 · Yard','87.50','2026-09-20',('Awaiting review','warning')),
      ('REC-2026-000186','Sample item Gamma','Site 2','0.00','2026-09-19',('Rejected','error')),
      ('REC-2026-000187','Sample item Delta','Site 3 · Store A','12,904.75','2026-09-18',('Draft','neutral'))]

def table_shell(title='Records', state='ready', rows=ROWS, caption_extra='', compact=False, long=False, actions=True):
    tid=uid('t')
    head=f'<div class="paep-table-shell__head"><div><h3 class="t-title-sm" id="{tid}-c">{esc(title)}</h3><span class="t-body-sm t-secondary">{len(rows) if state=="ready" else 0} of 184 records</span></div>'
    if actions: head+=f'<div>{btn("Create record","primary","plus")}</div>'
    head+='</div>'
    th=('<thead><tr><th scope="col">Record</th><th scope="col" class="p3">Location</th><th scope="col" class="num p2">Quantity</th><th scope="col" class="p3">Updated</th><th scope="col">Status</th><th scope="col" class="col-detail"><span class="vh">Details</span></th></tr></thead>')
    body=''
    if state=='ready':
        for k,(ref,name,loc,qty,upd,(st,tone)) in enumerate(rows):
            did=f'{tid}-d{k}'
            body+=(f'<tr><th scope="row" style="font-weight:400"><span style="display:block;font-weight:600">{esc(name)}</span><span class="id t-secondary" dir="ltr">{esc(ref)}</span></th><td class="p3">{esc(loc)}</td><td class="num p2">{esc(qty)}</td><td class="p3 paep-num" style="text-align:start">{esc(upd)}</td><td>{badge(st,tone)}</td>'
                   f'<td class="col-detail"><button type="button" class="paep-button paep-button--tertiary detail-toggle" data-toggle="row" aria-expanded="{str(k==1).lower()}" aria-controls="{did}">{ic("chevron-down","sm")}<span class="dt-text">Details<span class="vh"> for {esc(ref)}</span></span></button></td></tr>'
                   f'<tr class="row-detail{" is-open" if k==1 else ""}" id="{did}"><td colspan="6"><dl class="paep-dl"><dt>Location</dt><dd>{esc(loc)}</dd><dt>Quantity</dt><dd class="paep-num" style="text-align:start">{esc(qty)}</dd><dt>Updated</dt><dd>{esc(upd)}</dd></dl></td></tr>')
    elif state=='loading':
        for k in range(4):
            body+='<tr aria-hidden="true">'+''.join(f'<td class="{c}"><div class="paep-skeleton"><div class="paep-skeleton__block" style="inline-size:{w}%"></div></div></td>' for c,w in (('',80),('p3',60),('p2',50),('p3',60),('',55),('col-detail',0)))+'</tr>'
    else:
        if state=='empty': inner=f'<div class="paep-empty">{ic("empty")}<h4 class="t-title-sm">No records yet</h4><p>Records you create will appear here.</p>{btn("Create record","secondary","plus")}</div>'
        elif state=='no-results': inner=f'<div class="paep-empty">{ic("no-results")}<h4 class="t-title-sm">No records match the current filters</h4><p>Try removing a filter or changing the search text.</p>{btn("Clear filters","secondary")}</div>'
        else: inner='<div style="padding:var(--paep-space-4)">'+alert('error','Records could not be loaded','The service did not respond. Nothing was changed. Reference: 7F3A-22C1.',btn('Retry','secondary','retry'))+'</div>'
        body=f'<tr><td colspan="6" style="padding:0;border:0">{inner}</td></tr>'
    busy=' aria-busy="true"' if state=='loading' else ''
    live=f'<p class="vh" role="status">{"Loading records" if state=="loading" else ""}</p>'
    foot=f'<div class="paep-table-shell__foot">{pagination(8,20)}</div>' if state=='ready' else ''
    return f'<div class="paep-table-shell"{DC if compact else ""}>{head}<div{busy}><table class="paep-table" aria-labelledby="{tid}-c">{th}<tbody>{body}</tbody></table>{live}</div>{foot}</div>'

def pagination(cur, total, label='Pagination'):
    def pg(n):
        if n==cur: return f'<li class="pg-num"><a class="pg" aria-current="page" aria-label="Page {n}, current page">{n}</a></li>'
        return f'<li class="pg-num"><a class="pg" href="#p{n}" aria-label="Page {n}">{n}</a></li>'
    nums=[1]+([None] if cur-1>2 else [])+[n for n in (cur-1,cur,cur+1) if 1<n<total]+([None] if cur+1<total-1 else [])+[total]
    seen=[]; 
    for n in nums:
        if n is None or n not in seen: seen.append(n)
    items=''.join(pg(n) if n else '<li class="pg-gap" aria-hidden="true"><span class="pg">…</span></li>' for n in seen)
    prev_dis = cur==1; next_dis = cur==total
    def pn(txt, icon, dis, first):
        a=' aria-disabled="true"' if dis else f' href="#p{cur-1 if first else cur+1}"'
        inner=(ic(icon,'sm')+f'<span class="pg-text">{txt}</span>') if first else (f'<span class="pg-text">{txt}</span>'+ic(icon,'sm'))
        return f'<li><a class="pg" aria-label="{txt} page"{a}>{inner}</a></li>'
    return (f'<nav class="paep-pagination" aria-label="{label}"><ul>{pn("Previous","chevron-start",prev_dis,True)}{items}'
            f'<li class="pg-status" aria-hidden="true">{cur} / {total}</li>{pn("Next","chevron-end",next_dis,False)}<li class="pg-summary">Page {cur} of {total}</li></ul></nav>')

def tabs(labels, sel=0, disabled=(), activation='auto', label='Record views', panel_text=None):
    t=uid('tb')
    btns=''.join(f'<button type="button" role="tab" class="paep-tab" id="{t}-{k}" aria-controls="{t}-p{k}" aria-selected="{str(k==sel).lower()}" tabindex="{0 if k==sel else -1}"{AD if k in disabled else ""}>{l}</button>' for k,l in enumerate(labels))
    panels=''.join(f'<div role="tabpanel" class="paep-tabs__panel" id="{t}-p{k}" aria-labelledby="{t}-{k}" tabindex="0"{"" if k==sel else " hidden"}><p style="margin:0">{esc(panel_text or "Panel content for the selected view.")}</p></div>' for k in range(len(labels)))
    return (f'<div class="paep-tabs"><div class="paep-tabs__wrap"><div class="paep-tabs__scroll paep-tabs__scroll--start" aria-hidden="true"><button type="button" tabindex="-1" data-dir="start">{ic("chevron-start","sm")}</button></div>'
            f'<div role="tablist" aria-label="{esc(label)}" class="paep-tabs__list" data-activation="{activation}">{btns}</div>'
            f'<div class="paep-tabs__scroll paep-tabs__scroll--end" aria-hidden="true"><button type="button" tabindex="-1" data-dir="end">{ic("chevron-end","sm")}</button></div></div>{panels}</div>')

def breadcrumb(segs, collapse=False, label='Breadcrumb'):
    items=[]
    n=len(segs)
    for k,s in enumerate(segs):
        if k==n-1: items.append(f'<li><span aria-current="page">{esc(s)}</span></li>')
        else:
            coll = ' class="is-collapsible"' if (0<k<n-2) else ''
            items.append(f'<li{coll}><a href="#b{k}">{esc(s)}</a></li>')
            if k==0: items.append('<li class="bc-more"><button type="button" aria-expanded="false" aria-label="Show full path">…</button></li>')
    return f'<nav class="paep-breadcrumb{" is-collapsed" if collapse else ""}" aria-label="{label}"><ol>{"".join(items)}</ol></nav>'

def action_group(primary, secondary=(), destructive=None, label='Record actions', force_menu_open=False):
    g=uid('ag')
    sec=''.join(btn(s,'secondary',extra='').replace('class="paep-button','class="is-secondary paep-button') for s in secondary)
    des=''
    if destructive:
        des='<span class="paep-action-group__sep" aria-hidden="true"></span>'+btn(destructive,'destructive','delete').replace('class="paep-button','class="is-destructive paep-button')
    menu_items=''.join(f'<li role="none"><button type="button" role="menuitem">{esc(s)}</button></li>' for s in secondary)
    if destructive: menu_items+=f'<li role="none"><hr></li><li role="none"><button type="button" role="menuitem" class="is-destructive">{ic("delete","sm")}{esc(destructive)}</button></li>'
    more=(f'<span class="paep-action-group__overflow" style="position:relative"><button type="button" class="paep-button paep-button--secondary" aria-haspopup="menu" aria-expanded="{str(force_menu_open).lower()}" aria-controls="{g}-m">{ic("more")}<span>More<span class="vh"> actions</span></span></button>'
          f'<ul class="paep-menu" role="menu" id="{g}-m" aria-label="More actions" style="position:absolute;inset-block-start:calc(100% + 4px);inset-inline-end:0;z-index:5"{"" if force_menu_open else " hidden"}>{menu_items}</ul></span>') if (secondary or destructive) else ''
    prim=btn(primary,'primary').replace('class="paep-button','class="is-primary paep-button')
    return f'<div class="paep-action-group"><div class="paep-action-group__row" role="group" aria-label="{esc(label)}">{sec}{des}{more}{prim}</div></div>'
