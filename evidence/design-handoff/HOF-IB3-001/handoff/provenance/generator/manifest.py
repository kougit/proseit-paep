# Writes handoff.manifest.yaml for HOF-IB3-001 (E11 §2 minimum). Run last: it hashes every other file.
import os, sys, json, hashlib, collections, yaml, re
import icons as I
O = sys.argv[1]; HERE = os.path.dirname(os.path.abspath(__file__))
def sha(p): return hashlib.sha256(open(p, 'rb').read()).hexdigest()
C2PA = re.compile(r' xmlns:c2pa="http://c2pa.org/manifest"|<metadata><c2pa:manifest>.*?</c2pa:manifest></metadata>', re.S)
def authored(p): return hashlib.sha256(C2PA.sub('', open(p, encoding='utf-8').read()).encode()).hexdigest()
def snapshot():
    out = {}
    for root, _, fs in os.walk(O):
        for f in fs:
            p = os.path.join(root, f)
            if not p.endswith('handoff.manifest.yaml'): out[p] = sha(p)
    return out
# The project file store adds content-credential (C2PA) metadata to SVG and PNG files a few seconds after they are written.
# Wait until every file is stable (and every SVG carries it) before hashing, so the manifest records the files as stored.
import time
prev = None
while True:
    cur = snapshot()
    svgs = [p for p in cur if p.endswith('.svg')]
    if cur == prev and all('c2pa' in open(p, encoding='utf-8').read() for p in svgs): break
    prev = cur; time.sleep(15)
plan = json.load(open(O + '/screens/plan.json'))
scr = collections.OrderedDict()
for p in plan:
    s = scr.setdefault(p['sid'], {'id': p['sid'], 'states': []})
    s['states'].append({'state': p['state'], 'title': p['title'], 'html': f'screens/{p["file"]}', 'htmlSha256': sha(f'{O}/screens/{p["file"]}'),
        'viewports': p['viewports'], 'renders': [f'screens/renders/{p["sid"]}--{p["state"]}--{v}.png' for v in p['viewports']]})
VP = {'desktop': '1440x900', 'tablet': '834x1112', 'zoom200': '640x900 (200% of 1280)', 'narrow320': '320x640 (400% of 1280)', 'narrow375': '375x812', 'desktop1024': '1024x768 (audit)', 'short320x256': '320x256 (audit)'}
rc = json.load(open(O + '/screens/render-check.json'))['summary']
RES = [('Q-01', 'Topbar surface', 'A: light topbar'),
     ('Q-02', 'Governed menu/positioning base', 'A: extend PaepPopover with inline-start/inline-end alignment, keeping the governed flip/shift positioning and the accepted 16 px viewport edge margin (RD-01); PaepMenu is the reusable menu interaction component composed on that base, not a second positioning engine; rebuild the action-group overflow on that base where technically compatible. Changes accepted IB2 design intent: HOF-IB2-001 v1.2 must incorporate it before affected component code lands'),
     ('Q-03', 'Collapsed navigation form', 'A: 5.5 rem collapsed rail with visible authored short labels and link flyouts'),
     ('Q-04', 'Notifications container', 'A, governed by RD-02: non-modal inset panel anchored from the notification control, max inline size 24 rem, constrained to the viewport with the normal 16 px shell edge margin; not full screen'),
     ('Q-05', 'Palette grouping / empty query / locked results', 'A: Go to / Actions / Records groups; explanatory locked results may be shown; truly denied results omitted'),
     ('Q-06', 'Connectivity at narrow widths', 'A: non-online states always visible; ordinary Online may be hidden below 600 px'),
     ('Q-07', 'Tenant name below 600 px', 'A: page-header context line and navigation sheet'),
     ('Q-08', 'Toast', 'A: no Toast component in IB3; announcer/live region + inline alert'),
     ('Q-09', 'Mobile navigation container', 'A: inline-start modal navigation sheet, 20 rem maximum and viewport-constrained (effectively full width where the narrow viewport requires it); paep-drawer is not used as application navigation'),
     ('Q-10', 'Permission-denied navigation items', 'A: hidden; a direct link shows the explanatory locked/unavailable experience'),
     ('Q-11', 'Context presentation / switcher', 'A: context always visible; switch affordance only with multiple contexts; switching is an explicit request'),
     ('Q-12', 'Palette keyboard shortcut', 'A: Ctrl/Cmd+K plus the always-available visible trigger'),
     ('Q-13', 'Locked-state tones', 'A: existing neutral/info semantic tones; no new tone'),
     ('Q-14', 'Chrome density', 'A: comfortable shell chrome; content density independent'),
     ('X-01', 'Rail short label', 'APPROVED: optional authored shortLabel; a label is never automatically truncated or hyphenated into a short label; the full label remains the accessible name'),
     ('X-02', 'Narrow status stack', 'APPROVED: top status + "n more"; the summary exposes an accessible, obvious mechanism to inspect the remaining statuses and never conceals a critical state permanently'),
     ('X-03', 'Status ordering', 'APPROVED: 1 impersonation, 2 connectivity, 3 session, 4 environment'),
     ('X-04', 'RTL fixtures', 'APPROVED: Arabic/Hebrew design fixtures are valid for mechanical RTL qualification; native-language copy review mandatory BEFORE IB3 ACCEPTANCE'),
     ('X-05', 'Active language location (REQ-IB3-SHELL-07)', 'OPTION B: with more than one locale, an explicit language (globe) control in the topbar; it may move into an account/overflow surface at narrow widths (design: account menu below 600 px); its accessible and visible labelling communicates the active locale; the direction (LTR/RTL) is not required as ordinary topbar text'),
     ('RD-01', 'PaepPopover viewport edge margin', 'APPROVED: retain the accepted 16 px margin; not 8 px'),
     ('RD-02', 'Notification panel form and width', 'APPROVED: non-modal inset panel, max inline size 24 rem, viewport-constrained with the normal shell edge margin; not a full-screen experience'),
     ('RD-03', 'Official similarity record', 'APPROVED: the region-by-region human similarity-review form (provenance/similarity-review.md) is the official record')]
QUAL = {'P-09': 'APPROVED only as design / reference-app / ui-lab test content; not a public foundation API (PO/SA 2026-10-05)',
        'E-11': 'APPROVED DESIGN INTENT; the reviewed split is kept: two symbols, PaepErrorBoundary and PaepNotFound (PO/SA 2026-10-05)'}
reqs = json.load(open(HERE + '/out/reqs.json'))
m = collections.OrderedDict()
m['handoffId'] = 'HOF-IB3-001'; m['version'] = '1.0'; m['status'] = 'APPROVED_FOR_IMPLEMENTATION'; m['dchStatus'] = 'APPROVED FOR IMPLEMENTATION'
m['candidateRevision'] = {'revision': 3, 'reason': 'Human similarity review PASS and PO/SA design approval recorded', 'previousManifestSha256': 'b2056fe27e180ecfecc9d9881a59cfe8cd0aeb5289fd3c27620d86b6188ec9be', 'previousIntegrity': '576/576 PASS', 'delta': 'provenance/candidate-delta-r3.md',
    'history': [{'revision': 1, 'manifestSha256': '7cc8d8c9cedc9115eacb9a25168fbd60ec953d3b82a5c08cc76eaf1f0ff2f3bd', 'integrity': '575/575 PASS', 'note': 'original review candidate'}, {'revision': 2, 'manifestSha256': 'b2056fe27e180ecfecc9d9881a59cfe8cd0aeb5289fd3c27620d86b6188ec9be', 'integrity': '576/576 PASS', 'note': 'PO/SA decisions recorded 2026-10-05', 'delta': 'provenance/candidate-delta-r2.md'}]}
m['dwpId'] = 'DWP-IB3-001'; m['dwpVersion'] = '1.0'; m['dwpStatus'] = 'APPROVED FOR DESIGN (2026-09-30; not implementation acceptance)'
m['title'] = 'PAEP Enterprise Application Shell'; m['created'] = '2026-09-30'
m['designSystemBaseline'] = {'description': 'HOF-IB2-001 v1.1 + accepted DDR-IB2-01/02/04/05/07/08 @ Gen 4 81c223c', 'hofIb2ManifestSha256': '24e7049dd675e2025ae75c099637fd3f0a9eb9f24ff2958d1ce88607d040ac53',
    'closedDdrs': ['DDR-IB2-03', 'DDR-IB2-06'], 'generation4Commit': '81c223c', 'registryCommit': '929387b'}
m['repositoryBase'] = {'repo': 'kougit/proseit-paep', 'commit': '929387b', 'changed': False, 'generation5': 'NOT CREATED'}
m['requirements'] = reqs
m['viewportProfiles'] = VP
m['screens'] = list(scr.values())
m['renderCheck'] = {'file': 'screens/render-check.json', **rc, 'pageWideHorizontalScroll': 0, 'offscreenControls': 0, 'targetsUnder24px': 0,
    'notRun': 'axe-core or equivalent (implementation-stage gate: AC-IB3-07 of the IB3 acceptance-criteria draft, pre-flight file 14)'}
m['regions'] = ['SHELL-REGION-' + r for r in 'SKIPLINK BANNER PRODUCT CONTEXT SEARCH GLOBAL-ACTIONS NOTIFICATIONS ACCOUNT NAV STATUS MAIN PAGE-HEADER PAGE-TOOLBAR CONTENT ASIDE OVERLAY LIVE'.split()]
cmap = []
for line in open(O + '/component-map.md'):
    mm = re.match(r'\| (P-\d+|E-\d+) \| (.*?[^\\]) \| (.*?[^\\]) \|', line)
    if mm:
        tg = re.findall(r'`([^`]+)`', mm.group(3))
        full = [t if t.startswith('@') else tg[0].split('#')[0] + t for t in tg if t.startswith(('@', '#'))]
        cmap.append({'id': mm.group(1), 'designElement': re.sub(r'`', '', mm.group(2)).replace('\\|', '|'), 'paepTarget': full[0], 'additionalTargets': full[1:], 'status': 'NEW PATTERN (design intent approved 2026-10-05)'})
reuse = [('Page actions', '@proseit/paep-components#PaepButton'), ('Page overflow', '@proseit/paep-components#PaepActionGroup'), ('Icon controls', '@proseit/paep-components#PaepIconButton'),
         ('Breadcrumbs', '@proseit/paep-components#PaepBreadcrumb'), ('Page status', '@proseit/paep-components#PaepStatusBadge'), ('Tables in examples', '@proseit/paep-components#PaepTable'),
         ('Filter fields', '@proseit/paep-components#PaepField'), ('Dialogs', '@proseit/paep-components#PaepDialog'), ('Dialog footer', '@proseit/paep-components#PaepDialogFooter'),
         ('Radio choices', '@proseit/paep-components#PaepRadioGroup'), ('Checkbox', '@proseit/paep-components#PaepCheckbox'), ('Alerts', '@proseit/paep-components#PaepAlert'),
         ('Skeleton', '@proseit/paep-components#PaepSkeleton'), ('Empty state', '@proseit/paep-components#PaepEmptyState'), ('Cards', '@proseit/paep-components#PaepCard'),
         ('Help popover', '@proseit/paep-components#PaepPopover'), ('Modal base', '@proseit/paep-components#PaepModalBase'), ('Announcer', '@proseit/paep-foundation#PaepAnnouncer'),
         ('Accepted icons', '@proseit/paep-foundation#PAEP_ICONS')]
m['componentMap'] = [{'designElement': a, 'paepTarget': b, 'status': 'REUSE'} for a, b in reuse] + cmap
m['proposedPatterns'] = [{'id': c['id'], 'pattern': c['designElement'], 'target': c['paepTarget'], 'additionalTargets': c['additionalTargets'],
    'package': c['paepTarget'].split('#')[0], 'class': ('D2' if c['id'] in ('P-01', 'P-04', 'P-05', 'P-06', 'P-07', 'P-08', 'P-09') else 'D1'), 'rationale': 'see component-map.md §2', 'disposition': QUAL.get(c['id'], 'APPROVED DESIGN INTENT (PO/SA 2026-10-05)')} for c in cmap]
m['approvedTokens'] = [{'name': n, 'value': v, 'rationale': r, 'status': 'APPROVED (design intent, PO/SA 2026-10-05)'} for n, v, r in [
    ('--paep-shell-topbar-block-size', '3.5rem', '40 px target + padding; sticky chrome height'), ('--paep-shell-sidebar-inline-size', '16rem', 'expanded navigation'),
    ('--paep-shell-rail-inline-size', '5.5rem', 'collapsed rail with visible labels (Q-03)'), ('--paep-shell-sheet-inline-size', '20rem', 'mobile navigation container 600-1023 px (Q-09)'),
    ('--paep-shell-status-block-size', '2.5rem', 'status row minimum'), ('--paep-shell-sticky-offset', 'calc(topbar + --paep-space-2)', 'scroll-padding for WCAG 2.4.11'),
    ('--paep-layer-sticky', '30', 'sticky topbar; collapsed rail column'), ('--paep-layer-flyout', '40', 'collapsed-rail group flyout'),
    ('--paep-layer-popup', '45', 'topbar menus and panels; implementation uses the top layer, this is the fallback value'), ('--paep-layer-overlay-scrim', '60', 'scrim behind modal overlays'),
    ('--paep-layer-overlay', '61', 'navigation sheet, command palette, dialogs'), ('--paep-layer-skip-link', '80', 'skip link when focused')]]
m['approvedTokensRule'] = 'Each --paep-layer-* value is attached to its reviewed semantic layer purpose; not an arbitrary numeric z-index ladder. No new colour or tone.'
m['approvedTokenCount'] = len(m['approvedTokens'])
m['rejectedTokens'] = [{'name': '--paep-shell-content-max-inline-size', 'value': '90rem', 'reason': 'duplicate alias; use the accepted --paep-layout-content-max', 'decidedBy': 'PO/SA 2026-10-05'}]
m['tokenContrastEvidence'] = 'token-use-map.md §2; SCR-SHELL-020'
m['assets'] = [{'id': f'ICON-SHELL-{n}', 'file': f'assets/icons/paep-icon-{n}.svg', 'sha256': sha(f'{O}/assets/icons/paep-icon-{n}.svg'), 'authoredSha256': authored(f'{O}/assets/icons/paep-icon-{n}.svg'), 'provenance': 'authored-in-HOF-IB3-001', 'licence': 'ProSEIT proprietary'} for n in I.SHELL] + [
    {'id': 'MARK-PLACEHOLDER', 'file': 'assets/placeholder-mark.svg', 'sha256': sha(O + '/assets/placeholder-mark.svg'), 'authoredSha256': authored(O + '/assets/placeholder-mark.svg'), 'provenance': 'authored-in-HOF-IB3-001', 'licence': 'ProSEIT proprietary'},
    {'id': 'SPRITE-SHELL', 'file': 'assets/shell-sprite.svg', 'sha256': sha(O + '/assets/shell-sprite.svg'), 'authoredSha256': authored(O + '/assets/shell-sprite.svg'), 'provenance': 'authored-in-HOF-IB3-001', 'licence': 'ProSEIT proprietary'}]
m['accessibility'] = {'intent': 'accessibility-intent.md', 'interaction': 'interaction-notes.md', 'keyboardFocusMaps': 'SCR-SHELL-020', 'reducedMotion': 'SCR-SHELL-021',
    'manualEvidenceAtImplementation': 'NVDA + current Chromium on Windows (15 journeys, mandatory); independent keyboard review; structured usability evaluation (8 tasks); HIGH 0 / MEDIUM 0'}
m['ddrConstraints'] = [{'ddr': d, 'respected': True, 'how': h} for d, h in [
    ('DDR-IB2-01', 'container-based table rule kept; sidebar narrows the container'), ('DDR-IB2-02', 'one governed base (P-01/P-02; Q-02 A); SCR-SHELL-023; no third popover="manual"; changes accepted IB2 intent: HOF-IB2-001 v1.2 must incorporate it before affected component code lands'),
    ('DDR-IB2-04', 'dialogs inherit focusable scroll body and html scroll lock; shell uses document scroll'), ('DDR-IB2-05', 'help popover kept short'),
    ('DDR-IB2-07', 'F07/R03 remain the references; S1a UI-lab completion is implementation work'), ('DDR-IB2-08', 'dialog footer as accepted; role="group" not proposed'),
    ('DDR-IB2-06 residual', 'checkbox error API not proposed'), ('component-specs v1.1', 'paep-drawer not used as application navigation')]]
m['deviations'] = []
m['outOfScope'] = ['backend search/notification/identity/permission/entitlement contracts and services', 'login and real session flows', 'offline queue, replay, service worker, conflict engine, sync authority',
    'analytics datasets, reporting gateways, metrics, drill-down, saved views, report persistence', 'preference persistence', 'runtime-config schema change', 'secondary entry points',
    'new dependencies', 'domain content', 'Angular production code', 'Toast (Q-08 decision)', 'Tooltip', 'paep-contracts changes']
m['openDecisions'] = []
m['designDecisions'] = [{'id': i, 'question': q, 'status': 'RESOLVED', 'resolution': r, 'resolvedBy': 'PO/SA (Kouga)', 'resolvedDate': '2026-10-05', 'record': f'decision-record.md ({i})'} for i, q, r in RES]
m['followUps'] = [
    {'id': 'FU-01', 'item': 'HOF-IB2-001 v1.2 incorporates the approved PaepPopover alignment / governed menu-base intent (Q-02)', 'due': 'BEFORE the affected component implementation lands', 'note': 'HOF-IB2-001 v1.1 is not overwritten'},
    {'id': 'FU-02', 'item': 'HOF-IB2-001 v1.2 incorporates the other accepted DDR follow-ups (DDR-IB2-01, -04, -05, -07, -08; DDR-IB2-06 residual constraint)', 'due': 'BEFORE IB3 ACCEPTANCE (PD §3)'},
    {'id': 'FU-03', 'item': 'Arabic native-copy review', 'status': 'PENDING', 'due': 'BEFORE IB3 ACCEPTANCE'},
    {'id': 'FU-04', 'item': 'Hebrew native-copy review', 'status': 'PENDING', 'due': 'BEFORE IB3 ACCEPTANCE'},
    {'id': 'FU-05', 'item': 'Human similarity review on the official region-by-region form', 'status': 'CLOSED: PASS (Dr Kamulegeya Grace B (PhD), 2026-10-05)', 'due': 'BEFORE HOF APPROVAL'}]
m['rtl'] = {'mechanics': 'PASS', 'nativeCopyReview': {'ar': 'PENDING - REQUIRED BEFORE IB3 ACCEPTANCE', 'he': 'PENDING - REQUIRED BEFORE IB3 ACCEPTANCE'}}
m['similarityReview'] = {'record': 'provenance/similarity-review.md', 'form': 'region-by-region (RD-03)', 'status': 'PASS', 'reviewer': 'Dr Kamulegeya Grace B (PhD), Product Owner / Solutions Architect', 'independentOfDesignAuthor': True, 'date': '2026-10-05', 'manifestReviewed': 'b2056fe27e180ecfecc9d9881a59cfe8cd0aeb5289fd3c27620d86b6188ec9be', 'regions': {f'R-{i}': 'DISTINCT' for i in range(1, 13)}}
m['contentCredentials'] = 'SVG and PNG files carry Anthropic content-credential (C2PA) metadata added by the project file store after writing. It is not design content. sha256 = file as stored; authoredSha256 (SVG assets) = the file with that metadata removed, which is what an implementation would import.'
m['designApproval'] = {'approvedBy': 'Dr Kamulegeya Grace B (PhD), Product Owner / Solutions Architect', 'approvedDate': '2026-10-05', 'approvedVersion': '1.0',
    'decision': 'PO/SA APPROVAL: GRANTED - APPROVED_FOR_IMPLEMENTATION',
    'basis': ['DWP-IB3-001 APPROVED FOR DESIGN', '23 screens', '114 designed states', '402 renders', 'Q-01..Q-14 RESOLVED', 'X-01..X-05 RESOLVED', 'RD-01..RD-03 RESOLVED',
              'DDR constraints respected', 'RTL mechanics PASS', 'clean-room provenance PASS', 'human similarity review PASS', 'design review HIGH 0', 'design review MEDIUM 0'],
    'followUpsNotBlocking': 'Arabic/Hebrew native-copy validation remains an IB3 acceptance follow-up (FU-03, FU-04) and does not block implementation approval',
    'authority': 'PO/SA "PAEP IB3 - FINAL DESIGN APPROVAL + GENERATION 5 IMPLEMENTATION AUTHORIZATION" (project thread, 2026-10-06T09:48Z)'}
files = []
for root, _, fs in os.walk(O):
    for f in sorted(fs):
        p = os.path.join(root, f); rel = os.path.relpath(p, O)
        if rel == 'handoff.manifest.yaml': continue
        files.append({'path': rel, 'sha256': sha(p)})
m['files'] = sorted(files, key=lambda x: x['path'])
yaml.add_representer(collections.OrderedDict, lambda d, v: d.represent_mapping('tag:yaml.org,2002:map', v.items()))
hdr = '# PAEP handoff manifest (PAEP-DCH-01 §9; E11 §2). HOF-IB3-001 v1.0, revision 3 - APPROVED_FOR_IMPLEMENTATION (PO/SA, 2026-10-05).\n# Human similarity review PASS. Arabic/Hebrew native-copy review remains an IB3 acceptance follow-up.\n'
open(O + '/handoff.manifest.yaml', 'w').write(hdr + yaml.dump(m, sort_keys=False, allow_unicode=True, width=200))
print('screens', len(scr), 'states', len(plan), 'files', len(files), 'patterns', len(cmap), 'assets', len(m['assets']))
