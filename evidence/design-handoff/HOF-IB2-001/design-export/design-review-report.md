# PAEP IB2 DESIGN REVISION — HOF-IB2-001 v1.1

```
PAEP IB2 DESIGN REVISION — HOF-IB2-001
Brand primary: #24364B
Brand accent: #D4A62A
On-primary contrast: 12.32:1 PASS
On-accent contrast: 7.32:1 PASS
Protected semantic tokens unchanged: PASS
Petrol-blue synthetic profile: PASS
Affected specimens regenerated: 28/28
Contrast checks: 54/54 PASS
Desktop / Tablet / 640px / 320px / RTL / Reduced motion: PASS
Token map updated: PASS
Component map affected: NO
Provenance updated: PASS
Clean-room declaration: PASS
Unresolved design decisions: NONE
Design deviations: NONE
PO/SA approval: PENDING
DESIGN STATUS: READY FOR FINAL PO/SA APPROVAL
```

Basis for each line:
- **On-primary:** white `#FFFFFF` on Navy `#24364B` 12.32:1 (hover 14.57:1, active 16.85:1). **On-accent:** dark `#1A1F26` on Gold `#D4A62A` 7.32:1. White on Gold (2.26:1) is prohibited and appears nowhere.
- **Protected semantic tokens:** status (success, warning, error, info, neutral), focus, invalid, disabled, read-only, text, surface and scrim values are byte-identical to v1.0 (`token-values.candidate.json` diff shows only version, brandProfiles and brandOverridableKeys changed). The profile validator rejects any key outside the seven brand keys.
- **Petrol-blue synthetic profile:** `synthetic-demo-petrol` (`#0B5E73`, on-primary 7.34:1; accent `#9ED6E0`, on-accent 10.37:1) is labelled SYNTHETIC, non-product, demonstration only in SCR-IB2-F09, the manifest and token-values §1.5. It is not described as the ProSEIT default anywhere.
- **Specimens:** the brand appears on every screen (header band, primary buttons, links, selected and checked states), so all 28 screens were regenerated; markup changed only in F01 (brand swatches, usage, contrast) and F09 (profiles, gold emphasis, rejections). 86 renders re-captured.
- **Contrast:** 54 required pairs in token-values §1.7, all PASS; 2 exempt pairs meet their targets; 2 prohibited combinations fail by design and are forbidden by rule; 1 informational. Brand-profile checks: 8/8 PASS for proseit-default and synthetic-demo-petrol; the yellow demo profile is rejected as intended.
- **Viewports and modes:** render-check.json: 114 checks (28 screens × 1440, 834, 640, 320 px + 2 reduced-motion runs), 0 page-wide horizontal scroll, 0 off-screen controls, 0 targets < 24 px, 0 page errors. RTL specimens R02/R02D re-rendered. Reduced motion (F05, C05): 0 running animations, slow duration 0 ms. Focus ring stays visible on Navy fills via the white halo (F07).
- **Component map:** inventory (25/25), targets, anatomy, states and behaviour unchanged; only brand token references in component-specs.md were renamed (`--paep-brand-accent*` → `--paep-brand-primary*`).
- **Retained unchanged:** system fonts, PAEP icons, comfortable default + compact option, table priority columns + Details row with bounded-scroll fallback, no dark mode, responsive/accessibility/interaction decisions, the 25 components, the clean-room position.

Recorded decision: **PO/SA review: CHANGES REQUESTED — BRAND REVISION** (2026-09-27), in approvals.md, decision-record.md, provenance.md and the manifest (`poSaReview`). Design approval fields remain empty. Not APPROVED_FOR_IMPLEMENTATION; no Angular code; Generation 4 not started; nothing committed.

---

## Superseded: v1.0 review candidate report (2026-09-26)


```
PAEP IB2 DESIGN REVIEW CANDIDATE

DWP: DWP-IB2-001
Handoff: HOF-IB2-001 v1.0
Status: READY FOR PO/SA REVIEW

Foundation decisions: 21/21 COMPLETE (recommended candidate recorded for each; PO/SA acceptance pending)
Components covered: 25/25
Desktop specimens: PASS   (28/28 screens rendered at 1440 px)
Tablet specimens: PASS    (28/28 at 834 px; 640 px / 200% zoom checked)
320px specimens: PASS     (28/28 at 320 px: no page-wide scroll, 0 off-screen controls, 0 targets < 24 px)
Long-content specimens: PASS (SCR-IB2-R01 + C01, C06B, C07)
RTL specimens: PASS       (SCR-IB2-R02, R02D)
Reduced-motion specimens: PASS (F05, C05; emulated reduce: 0 running animations, durations 0 ms)
Accessibility intent: PASS (56 contrast pairs, 0 failures; key maps, focus entry/return, non-colour cues)
Responsive intent: PASS
Token map: PASS
Component map: PASS
Content keys: PASS (48 keys)
Provenance: PASS
Clean-room declaration: PASS
Third-party dependency decisions: NONE (system fonts; PAEP-owned icons)
Open design decisions: NONE unresolved by the design. 21 recommended candidates
                       await PO/SA acceptance; proseit-default brand values are
                       CANDIDATE DESIGN VALUE - REQUIRES PO/SA APPROVAL (no
                       controlled ProSEIT brand specification exists).
Design deviations: NONE
PO/SA approval: PENDING

DESIGN STATUS:
READY FOR PO/SA REVIEW
```

PASS above is the author's self-check against the evidence in this bundle; the DCH §17 gate outcomes are recorded by the reviewer in approvals.md.

## Key recommendations for the reviewer
| Decision | Candidate |
| --- | --- |
| Brand accent (proseit-default) | v1.0: Petrol blue `#0B5E73`, white on-accent (7.34:1). **Superseded in v1.1** by Navy `#24364B` / Gold `#D4A62A`. |
| Fonts / icons | System font stack; 25 PAEP-owned SVG icons. No dependency. |
| Density default | Comfortable (40 px controls); compact opt-in (32 px) |
| Table narrow strategy | Priority columns + row detail; bounded scroll only for 2-D comparison |
| Tabs activation | Automatic (manual opt-in) |
| Drawer | Inline-end, 30 rem, full width below 600 px |
| Dialog on mobile | Inset 16 px with stacked actions; large dialogs full screen |
| Dark mode | Not in IB2 |

## Controlled-source check
No material conflict between controlled sources and the preparation artifact. Three non-blocking notes are recorded in approvals.md (status vocabulary, gate wording, Toast outside the IR-01 tranche).

## What happens next (not started)
On PO/SA approval: set `status: APPROVED_FOR_IMPLEMENTATION` and `designApproval` in the manifest (or request changes, which produce v1.1). Implementation, the test-tooling dependency decision (03-DEPENDENCY-DECISION) and Generation 4 remain separately authorised steps. No Angular code was written; nothing was committed.
