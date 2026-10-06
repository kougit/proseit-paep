# Generates HOF-IB3-001 derived documents: assets, content keys, requirement coverage, catalogue, provenance copies.
import os, re, sys, json, shutil, hashlib
import icons as I, keys as K, screens
O = sys.argv[1]
HERE = os.path.dirname(os.path.abspath(__file__))
def w(p, s):
    os.makedirs(os.path.dirname(O + '/' + p), exist_ok=True); open(O + '/' + p, 'w').write(s)
def sha(p): return hashlib.sha256(open(p, 'rb').read()).hexdigest()

# assets
for n in I.SHELL: w(f'assets/icons/paep-icon-{n}.svg', I.standalone(n))
w('assets/placeholder-mark.svg', I.MARK)
w('assets/shell-sprite.svg', '<svg xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' + ''.join(I.symbol(n) for n in I.SHELL) + '</svg>\n')
rows = []
for n, (body, mirror, meaning) in I.SHELL.items():
    f = f'assets/icons/paep-icon-{n}.svg'
    rows.append(f'| ICON-SHELL-{n} | `{f}` | `{hashlib.sha256(I.standalone(n).encode()).hexdigest()[:16]}…` | {meaning} | {"yes" if mirror else "no"} | decorative (`aria-hidden`); the control carries the name |')
reg = ['# Asset register: HOF-IB3-001 v1.0', '',
 '> APPROVED_FOR_IMPLEMENTATION (PO/SA, 2026-10-05). Every asset was authored in this handoff (provenance `authored-in-HOF-IB3-001`). Owner: ProSEIT. Licence: ProSEIT proprietary (same terms as the PAEP icon set). They are drawn on the PAEP 24 px grid with a 2 px round stroke in `currentColor`, matching the accepted 25 icons. There are no web fonts, no CDN assets, and no third-party or template glyphs. The full SHA-256 of each file is in `handoff.manifest.yaml` → `assets` / `files`.', '', '**Content credentials.** The project file store adds Anthropic content-credential (C2PA) metadata (an `xmlns:c2pa` attribute and a `<metadata>` block) to every SVG after it is written. It is not part of the authored design. The manifest records both the stored hash (`sha256`) and the authored hash with that metadata removed (`authoredSha256`). An implementation imports the authored form; the prefixes below are of the authored form.', '',
 '## Shell icons (`@proseit/paep-foundation#PAEP_ICONS`, P-08; design intent approved by the PO/SA 2026-10-05)', '',
 '| ID | File | SHA-256 (prefix) | Meaning | Mirrors in RTL | Alt-text intent |', '| --- | --- | --- | --- | --- | --- |'] + rows + ['',
 '## Other assets', '',
 '| ID | File | Provenance | Notes |', '| --- | --- | --- | --- |',
 '| MARK-PLACEHOLDER | `assets/placeholder-mark.svg` | authored-in-HOF-IB3-001 | Neutral placeholder product mark (Navy square, white chevron, Gold bar). Decorative next to the product name. **Approved only as design / reference-app / ui-lab test content (PO/SA 2026-10-05); not a public foundation API.** Each product supplies its own approved brand asset |',
 '| SPRITE-SHELL | `assets/shell-sprite.svg` | authored-in-HOF-IB3-001 | `<symbol>` sprite of the 24 shell icons, for the reference screens only |', '',
 'The accepted 25 IB2 icons are reused unchanged from HOF-IB2-001 v1.1 and are not copied here.']
w('assets/asset-register.md', '\n'.join(reg) + '\n')

# content keys
screens.build()  # populates K.USED
used = K.USED
lines = ['# Content keys: HOF-IB3-001 v1.0', '',
 f'> APPROVED_FOR_IMPLEMENTATION (PO/SA, 2026-10-05). {len(K.KEYS)} keys in the controlled `paep.shell.*` namespace (DWP §12), each with a typed English default and provider override per locale. The shell text in the reference screens comes from these keys. Sample app content (navigation labels, page titles, table rows, help menu items) is supplied by the app manifest or by the host, not by the shell. Placeholders use `{{name}}` and plural forms go through the i18n seam; there is no dictionary loading and no date/number formatting subsystem.', '',
 '**Long text:** every string is tested at 2× English length on SCR-SHELL-018. **RTL:** Arabic and Hebrew overrides exist for the RTL board only. They are **design fixtures that need native-speaker review** before they are used as evidence. Identifiers inside messages render `dir="ltr"`.', '',
 '| Key | English default | Note | Used in renders | ar/he fixture |', '| --- | --- | --- | --- | --- |']
for key, (en, note) in K.KEYS.items():
    fx = '/'.join(l for l in ('ar', 'he') if key in K.FIXTURES.get(l, {})) or '—'
    lines.append(f'| `{key}` | {en.replace("|", "&#124;")} | {note.replace("|", "&#124;")} | {"yes" if key in used else "spec only"} | {fx} |')
w('content-keys.md', '\n'.join(lines) + '\n')

# requirement coverage
E02 = '/mnt/project-files/ib3/design-input/extracts/'
e02 = [f for f in os.listdir(E02) if f.startswith('E02')][0]
MAP = {'SHELL': 'SCR-SHELL-001, -003, -004, -005, -007, -010, -013; shell-information-architecture.md',
 'NAV': 'SCR-SHELL-002, -003, -004, -006, -012; interaction-notes §3',
 'WORKSPACE': 'SCR-SHELL-011, -015; shell-information-architecture §5',
 'CMD': 'SCR-SHELL-008; decision-record Q-05, Q-12',
 'NOTIFY': 'SCR-SHELL-009; decision-record Q-04, Q-08',
 'ERROR': 'SCR-SHELL-013; interaction-notes §1, §4',
 'LOCKED': 'SCR-SHELL-006, -012; decision-record Q-10, Q-13',
 'CONNECTIVITY': 'SCR-SHELL-014; decision-record Q-06',
 'RESP': 'SCR-SHELL-003, -004, -005, -018, -019; responsive-rules.md',
 'A11Y': 'SCR-SHELL-020, -021; accessibility-intent.md; interaction-notes §3-§5',
 'I18N': 'SCR-SHELL-017, -018; content-keys.md',
 'SEC': 'interaction-notes §1; SCR-SHELL-007, -009, -012, -013; component-map §3',
 'STATE': 'state lists per screen (design-brief §4); SCR-SHELL-001, -008, -009, -011, -015',
 'TEST': 'implementation stage (targets: region IDs, state IDs, accessibility-intent §7)',
 'PROV': 'provenance.md; provenance/; assets/asset-register.md',
 'REPORT': 'SCR-SHELL-015 (generic frame only; no analytics behaviour)',
 'PREF': 'SCR-SHELL-016, -022 (session only)'}
cov = ['| Requirement | Class | Summary | Design coverage |', '| --- | --- | --- | --- |']
reqs = []; header = None
for line in open(E02 + e02):
    if line.startswith('| ID |'):
        header = [c.strip() for c in line.strip().strip('|').split('|')]; continue
    if not line.startswith('| REQ-IB3-') or not header: continue
    cells = [c.strip() for c in line.strip().strip('|').split('|')]
    extra = len(cells) - len(header)
    if extra > 0: cells = [cells[0], '|'.join(cells[1:2 + extra])] + cells[2 + extra:]
    rid = cells[0]; ns = rid.split('-')[2]; text = cells[1]
    cls = cells[header.index('Class')] if 'Class' in header else {'PROV': 'M (provenance)', 'SEC': 'M (security)'}.get(ns, 'M (traced)')
    if rid in [r[0] for r in reqs]: continue
    t = re.sub(r'`', '', text).replace('|', '/').replace('**', ''); t = (t[:140] + '…') if len(t) > 140 else t
    cov.append(f'| {rid} | {cls} | {t} | {MAP.get(ns, "see DWP")} |'); reqs.append((rid, ns))
brief = open(O + '/design-brief.md').read()
brief = re.sub(r'<!-- COVERAGE -->.*', '<!-- COVERAGE -->\n' + f'{len(reqs)} requirements.\n\n' + '\n'.join(cov) + '\n', brief, flags=re.S)
open(O + '/design-brief.md', 'w').write(brief)
json.dump([r[0] for r in reqs], open(HERE + '/out/reqs.json', 'w'))

# catalogue
plan = json.load(open(O + '/screens/plan.json'))
items = []
for p in plan:
    rs = ' · '.join(f'<a href="renders/{p["sid"]}--{p["state"]}--{v}.png">{v}</a>' for v in p['viewports'])
    items.append(f'<tr><td>{p["sid"]}</td><td><a href="{p["file"]}">{p["state"]}</a></td><td>{p["title"]}</td><td>{rs}</td></tr>')
idx = ('<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>HOF-IB3-001 screen catalogue</title>'
 '<style>body{font:14px/1.45 system-ui,sans-serif;margin:16px;color:#1A1F26;background:#FFFFFF}table{border-collapse:collapse;inline-size:100%}th,td{border:1px solid #D5DAE0;padding:6px;text-align:start;vertical-align:top}a{color:#24364B}.wrap{overflow-x:auto}</style></head><body>'
 f'<h1>HOF-IB3-001 v1.0: screen catalogue</h1><p>APPROVED_FOR_IMPLEMENTATION (PO/SA, 2026-10-05) · {len(plan)} states · {sum(len(p["viewports"]) for p in plan)} renders · reference HTML only, not production code.</p>'
 '<div class="wrap" role="region" aria-label="Screens" tabindex="0"><table><thead><tr><th scope="col">Screen</th><th scope="col">State (HTML)</th><th scope="col">Description</th><th scope="col">Renders</th></tr></thead><tbody>' + ''.join(items) + '</tbody></table></div></body></html>\n')
w('screens/index.html', idx)

# provenance copies
src = open([f'/mnt/project-files/ib3/preflight/{f}' for f in os.listdir('/mnt/project-files/ib3/preflight') if f.startswith('12-')][0]).read()
m = re.search(r'```text\n(.*?)\n```', src, re.S)
w('provenance/design-prompt.txt', m.group(1) + '\n')
gd = O + '/provenance/generator'
if os.path.exists(gd): shutil.rmtree(gd)
os.makedirs(gd)
for f in sorted(os.listdir(HERE)):
    if f.endswith(('.py', '.js', '.css', '.sh')): shutil.copy(HERE + '/' + f, gd + '/' + f)
print('assets', len(I.SHELL), 'keys', len(K.KEYS), 'used', len(used & set(K.KEYS)), 'reqs', len(reqs), 'states', len(plan))
