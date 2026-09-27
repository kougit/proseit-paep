# IB2 Design-Preparation Artifact (UNCOMMITTED, NOT APPROVED)

| Field | Value |
| --- | --- |
| Status | DRAFT design-preparation input. Not a handoff, not an approval, not production design. |
| Prepared for | Product Owner / Solutions Architect (Kouga) |
| Prepared by | Claude Code, IB2 authorisation of 2026-09-26 (thread "PAEP IB2") |
| Repository base | `origin/main` = `d33ab919f3f23d6a198db01db478ed60e7cf2fbc` (tree `791541bfc8ed7fb7feea24a7e380eba02ee8c951`) |
| Accepted baseline | Generation 3 ACCEPTED at `b6ae8427e4d54840f71dadd5fedcce99d50f4584`; no CANDIDATE |
| Location | `tmp/IB2-design-preparation/` (git-ignored, per the WP05 local-evidence convention) and project files `ib2/design-preparation/` |
| Governing standard | PAEP-DCH-01 v1.0 (design classification, DWP, handoff manifest, review gate) |

Every statement below cites the controlled source it comes from. Where this document says **DESIGN DECISION**, the value or appearance is deliberately left open for the approved design stage.

---

## 1. IB2 design objective

IB2 shall make PAEP "visibly tangible by implementing the design-system foundation and a deliberately small, high-value component set", proving that "consistency, accessibility, responsiveness and state completeness can be delivered once at platform level" (IR-01 §6.1). At the end of IB2 a developer can "launch the UI lab, inspect tokens/components" (IR-01 §8, Practical checkpoint).

The design stage must decide the **visual and interaction language** of that kernel: the foundation values, the anatomy of the first components, the narrow-screen behaviour of the composite patterns and the UI-lab specimen presentation. Claude Code then implements that approved intent (DCH §18).

## 1a. Design-system principles (controlled)

(i) Product-neutral enterprise kernel; products express identity only through the approved brand-accent group, logos and navigation composition (PAEP §6, §1.1).
(ii) Semantic tokens first; raw values live only in controlled foundation code (PAEP §6.1; IR-01 Code Blocks 6-7).
(iii) Status, focus and accessibility meaning are protected from branding (IR-01 §6.2(i), §7.3).
(iv) Adaptive, not desktop-shrunk: 320 CSS px is a design target, not an afterthought (DCH §3(iv); PAEP §6.2).
(v) Accessible by design: WCAG 2.2 AA, native semantics first (PAEP §16; DCH §3(v)).
(vi) States are part of the design (DCH §3(iii); IR-01 §6.5).
(vii) Elevation communicates hierarchy, not decoration; motion is bounded (PAEP §6).
(viii) Small, high-value first tranche; expand only through reuse demand (IR-01 §7.3).
(ix) Clean-room: independently composed; no commercial template or proprietary product imitation (PAEP §3, §19; DCH §23).

## 2. Why a design handoff is required (classification basis)

| Source | Rule |
| --- | --- |
| DCH §5 | Every UI work package is classified D1 / D2 / D3 before implementation. |
| DCH §5.1(ii) | A task becomes D1 if it "introduces a new reusable pattern". |
| DCH §26 (IB2 row) | "Use Claude Code directly for bounded primitives; **use design review for new foundational visual/interaction patterns**." |
| DCH §25(ii) | Claude Design is onboarded to the *accepted* PAEP design system after IB2 acceptance, so IB2's own foundation must be approved by design review, not inferred. |
| EQP §5.2(iii), §12 DoR (xi)-(xii) | Design-significant work needs an approved DWP and handoff manifest before implementation. |
| User authorisation §4-§5 | Implementation is not the design-approval step. Do not invent final visual values. |

PAEP has **no existing design system**: no colour, type, spacing, radius, elevation, motion, breakpoint, density, focus or icon values exist in any controlled source (searched PAEP v1.1 §6, IB-01, IR-01, EQP, DCH, the reference baseline zip and the repository). Every foundation value is therefore a new foundational visual pattern.

## 3. Handoff audit result (Thread B)

| Item | Found | Status |
| --- | --- | --- |
| Design Work Package (DWP) for IB2 | None (`grep -ri "DWP-\|HOF-"` over repo: only the standard's own templates) | MISSING |
| Handoff manifest `handoff.manifest.yaml` | None | MISSING |
| Screens / viewport variants | None | MISSING |
| Component map / token map | None | MISSING |
| Accessibility intent / interaction notes | None | MISSING |
| Content keys | None | MISSING |
| Provenance / approvals record | None | MISSING |
| Design deviations | Not applicable (no baseline) | n/a |
| PO/SA design approval | None | MISSING |

**Result: DESIGN HANDOFF REQUIRED.** Required artifact: `HOF-IB2-001` v1.0 at status APPROVED FOR IMPLEMENTATION (DCH §17.1(iii), §24), with the bundle content in §15 below.

## 4. Classification of every IB2 deliverable

Source of the deliverable list: IR-01 §6.2 (token model), §6.3 (responsive baseline), §6.4 (initial component set), §6.6 (UI lab), §6.7 (IB2-WP1..WP6); IB-01 §23 (IB2 row); EQP §29.3.

| ID | Deliverable | Class | Reason | Route |
| --- | --- | --- | --- | --- |
| F-ARCH | Token architecture: naming, raw vs semantic layers, CSS custom-property model, typed TS exports, override points, protected set, reduced-motion switch, density switch | D3 (technical) | No visual decision; derived from PAEP v1.1 §6.1, IR-01 §6.2 | Claude Code; ready once values exist (see 04-TECHNICAL-ANALYSIS §C) |
| F-VAL | Foundation values: colour (neutral, brand accent, status), typography (family, scale, weights, line heights, truncation), spacing, size, radius, elevation, motion (durations, easing), breakpoints, layout grid/containers, density profiles, focus appearance, interaction-state appearance | **D1** | New foundational visual pattern (DCH §26) | Design review, HOF-IB2-001 |
| F-ICON | Governed icon vocabulary (PAEP v1.1 §6 "Iconography") | **D1** + dependency/provenance decision | Choice of icon set is visual and a third-party asset decision (DCH §23(iii), §9.2(iv)) | Design review; asset provenance record |
| F-BRAND | Brand/theme override model: which tokens a product may override; default `proseit-default` profile (IB-01 §9.3) | D1 for the default brand values; D3 for the enforcement mechanism | Values are visual; protection of status/a11y tokens is controlled (IR-01 §6.2(i), PAEP §6.1) | Design review for values |
| C-PRIM | Bounded primitives: button, icon button, input, textarea, select (native), checkbox, radio, field wrapper, alert, status badge, progress, skeleton, card, panel, divider, breadcrumb, list, empty state | D3 route per DCH §26 **for behaviour and semantics**; visual anatomy **BLOCKED on F-VAL** | Behaviour follows native HTML and WAI-ARIA; appearance of the first instance of each is part of the foundational visual pattern | Anatomy specimens included in HOF-IB2-001; code by Claude Code after approval |
| C-PAT | Composite interaction patterns: action group (overflow at narrow width), tabs (overflow), pagination (narrow behaviour), dialog, drawer (mobile sizing), popover | **D2** | New responsive composition and focus behaviour for reusable patterns (DCH §10 Overlays row, §11(iv), §12(ii)) | Light design review within HOF-IB2-001 |
| C-TABLE | Table shell | **D1** | Data-heavy pattern; narrow-screen strategy is an explicit design decision (DCH §11(iii), PAEP §6.2, IB-01 §12.1(ii)) | Design review within HOF-IB2-001 |
| L-LAYOUT | Responsive layout primitives (IB2-WP2) | **D1** (values) / D3 (mechanism) | Breakpoints and grid are foundation values | In HOF-IB2-001 |
| LAB | UI laboratory information architecture and specimen template | **D2** | New app composition; the specimen structure is already controlled by IR-01 §6.6 Code Block 8 | Light review within HOF-IB2-001 |
| Q-* | Test runner, a11y/responsive/visual tooling, verifiers, CI jobs, evidence, baseline Generation 4 | Not design-significant | Engineering/governance | Claude Code, subject to the dependency decision (03-DEPENDENCY-DECISION) |

## 5. Controlled requirements the design must satisfy

| Req ID (proposed) | Requirement | Source |
| --- | --- | --- |
| REQ-IB2-TOK-01 | Colour tokens separate semantic meaning (success, warning, error, info) from brand accents; product branding cannot override status or accessibility semantics. | IR-01 §6.2(i); PAEP §6, §6.1; IR-01 §7.3 last row |
| REQ-IB2-TOK-02 | Typography: controlled scale, weights, line heights, truncation/wrapping rules; no ad-hoc per-screen sizing. | IR-01 §6.2(ii); PAEP §6 |
| REQ-IB2-TOK-03 | Spacing, size, radius, elevation and density tokens replace per-screen literals. | IR-01 §6.2(iii) |
| REQ-IB2-TOK-04 | Surfaces/elevation: page, panel, card, modal and raised-layer semantics; elevation communicates hierarchy, not decoration. | PAEP §6 |
| REQ-IB2-TOK-05 | Motion is bounded and respects reduced-motion preferences. | IR-01 §6.2(iv); PAEP §6 |
| REQ-IB2-TOK-06 | Breakpoint and layout tokens define adaptive behaviour; no fixed desktop canvas. | IR-01 §6.2(v); PAEP §6 |
| REQ-IB2-TOK-07 | Focus and interaction-state tokens keep focus and states consistent and testable. | IR-01 §6.2(vi) |
| REQ-IB2-TOK-08 | Density: compact and comfortable modes without sacrificing touch targets or accessibility. | PAEP §6; IB-01 §12.1(iv) |
| REQ-IB2-TOK-09 | One governed icon vocabulary; accessible labels where meaning is not obvious. | PAEP §6 |
| REQ-IB2-TOK-10 | Tokens are versioned; semantic meaning changes need release notes. Dark mode/extra themes optional but must pass the same gates. | PAEP §6.1 |
| REQ-IB2-RSP-01 | Profiles: wide desktop, tablet/constrained desktop, mobile/narrow web, 320 CSS-pixel reflow, zoom/long translation/RTL. | IR-01 §6.3 |
| REQ-IB2-RSP-02 | Hover never the only way to expose an essential action; touch targets usable. | IR-01 §6.3(i)-(ii); DCH §11(v) |
| REQ-IB2-RSP-03 | Data-heavy patterns adapt via priority columns, row detail, cards or bounded inner scrolling; no page-wide horizontal scroll. | IR-01 §6.3(iii); IB-01 §12.1(ii) |
| REQ-IB2-RSP-04 | Primary actions keep stable placement; overflow menus only for secondary actions. | IB-01 §12.1(v) |
| REQ-IB2-A11Y-01 | WCAG 2.2 Level AA target. | PAEP §16 |
| REQ-IB2-A11Y-02 | Keyboard/focus, semantics, contrast, errors/status as part of every component's definition of done. | PAEP §3, App. C |
| REQ-IB2-A11Y-03 | No colour-only status, selection, validation or risk. | DCH §12(iii) |
| REQ-IB2-A11Y-04 | Target-size profile controlled; exceptions only where WCAG permits. | PAEP §16.1 |
| REQ-IB2-CMP-01 | Initial component set exactly as IR-01 §6.4 (25 components, 7 families). | IR-01 §6.4 |
| REQ-IB2-CMP-02 | State completeness per IR-01 §6.5 and PAEP §8.1. | IR-01 §6.5 |
| REQ-IB2-LAB-01 | Each component shown with purpose, variants, states, accessibility notes, responsive behaviour, localisation/RTL notes and evidence links. | IR-01 §6.6, Code Block 8; PAEP §21 |
| REQ-IB2-LAB-02 | Token catalogue: semantic names, values, override rules, deprecation history. | PAEP §21 |
| REQ-IB2-I18N-01 | Reusable strings use stable keys; layouts tolerate expansion; RTL verified where activated (runtime config lists `ar` as an RTL locale). | IB-01 §14; DCH §16 |
| REQ-IB2-SEC-01 | Designs may hide/disable unavailable actions but never imply client-side authorisation. | DCH §13(i) |
| REQ-IB2-CR-01 | Clean-room: no proprietary template source, theme files, assets or distinctive implementation artefacts. | PAEP §3, §19; DCH §23 |
| REQ-IB2-ASSET-01 | Core assets self-hostable; no mandatory external font/icon CDN. | IB-01 §19 (on-premise row, §19.1(iv)) |

## 6. Intended foundation areas (what the design must provide values for)

For each area: the design supplies the values and rationale; Claude Code supplies the token names and mechanism.

| Area | Design must decide | Fixed by controlled sources / WCAG (not a design choice) |
| --- | --- | --- |
| Colour: neutrals and surfaces | Palette, surface/background/border/text roles, hover/active/selected tints | Text contrast ≥ 4.5:1 (≥ 3:1 large text); non-text and UI component contrast ≥ 3:1 (WCAG 1.4.3, 1.4.11) |
| Colour: brand accent | `proseit-default` accent and its on-accent colour; allowed override range for products | Product accent cannot redefine status or focus tokens (IR-01 §6.2(i)) |
| Colour: status | success, warning, error, info foreground/background/border, each paired with a non-colour cue (icon or text) | Protected, non-overridable (IR-01 §7.3) |
| Typography | Font family strategy (system stack vs self-hosted font with licence), scale steps, weights, line heights, truncation rules, numeric (tabular) figures for data | Text resizable to 200% without loss (WCAG 1.4.4); text spacing overrides tolerated (WCAG 1.4.12) |
| Spacing | Base unit and scale steps | none |
| Size | Control heights per density; icon sizes | Pointer target ≥ 24×24 CSS px or spacing exception (WCAG 2.5.8) |
| Radius | Scale | none |
| Elevation | Levels for page, panel, card, popover, modal; shadow and/or border strategy | Must communicate hierarchy, not decoration (PAEP §6) |
| Motion | Durations, easing, which transitions exist at all | Reduced-motion: non-essential motion removed (WCAG 2.3.3 intent, PAEP §6) |
| Breakpoints / layout | Breakpoint values, container widths, grid columns, gutters | Must work at 320 CSS px (WCAG 1.4.10) |
| Density | Compact and comfortable values | Target-size rule above still holds in compact |
| Focus | Focus indicator style (width, offset, colour, shape) | Visible (WCAG 2.4.7), not obscured (2.4.11), ≥ 3:1 against adjacent colours |
| Interaction states | Hover, active, selected, disabled, read-only, invalid, loading appearance | Disabled/invalid not colour-only |
| Iconography | Icon vocabulary and source (in-house drawn SVG or a licensed open-source set) | Self-hostable; licence recorded; accessible label where meaning not obvious |

## 7. Intended component families (IR-01 §6.4) and states

| Family | Component | Required states for the design to show (as applicable) |
| --- | --- | --- |
| Actions | Button | default, hover, focus-visible, active, disabled, loading; variants primary / secondary / tertiary / destructive; long label; narrow width |
| Actions | Icon button | default, hover, focus-visible, active, disabled, loading; visible tooltip-free name strategy (accessible name required) |
| Actions | Action group | wide (all visible), narrow (secondary actions to overflow; primary stays visible), disabled item, destructive item |
| Forms | Field wrapper | label, required marker, help text, error text, read-only, disabled, dirty indicator (if shown), long label/help |
| Forms | Input | empty, filled, placeholder (never as label), focus, invalid, disabled, read-only, prefix/suffix |
| Forms | Select (native) | as input, plus open state rendered by the platform |
| Forms | Textarea | as input, plus long content |
| Forms | Checkbox | unchecked, checked, indeterminate, focus, disabled, invalid, read-only |
| Forms | Radio group | unselected, selected, focus, disabled, invalid, read-only; group label |
| Data | Table shell | loading, empty, populated, filtered-no-results, error with retry, narrow-screen strategy (DESIGN DECISION), bounded data volume |
| Data | List | loading, empty, populated, error, long item text |
| Data | Pagination | first/middle/last page, disabled prev/next, narrow width, current-page semantics |
| Data | Empty state | genuinely empty vs filtered-no-results (must be distinguishable, IR-01 §6.5(ii)), optional action |
| Feedback | Alert | info, success, warning, error; persistent vs dismissible; with action |
| Feedback | Status badge | each status with non-colour cue; long text |
| Feedback | Progress | determinate, indeterminate, reduced-motion rendering |
| Feedback | Skeleton | loading placeholder; reduced-motion rendering |
| Overlay | Dialog | open, focus entry, destructive confirm, long content scroll, narrow/mobile sizing |
| Overlay | Drawer | open from inline-end (RTL mirrored), mobile full-width behaviour |
| Overlay | Popover | anchored, flipped near viewport edge, narrow viewport |
| Navigation | Tabs | selected, focus, disabled tab, overflow at narrow width |
| Navigation | Breadcrumb | current page, overflow/collapse at narrow width |
| Structure | Card | default, with header/actions, long content |
| Structure | Panel | default, with header/actions, collapsible (if designed) |
| Structure | Divider | horizontal, vertical |

Permission, edition, offline/queued and conflict states apply only where the component participates in those flows (IR-01 §6.5(iv)); for IB2 primitives they are represented as `disabled` plus an explanatory text slot, never as client-side authority (DCH §13(i)).

## 8. Interaction requirements

(i) Native HTML elements first (`<button>`, `<input>`, `<select>`, `<textarea>`, `<fieldset>/<legend>`, `<dialog>`, `<nav>`, `<table>`); custom ARIA only where no native element exists (tabs, popover anchoring).
(ii) Loading buttons stay focusable, announce busy state, and prevent repeated activation.
(iii) Destructive actions are visually distinct **and** textually explicit.
(iv) Dialog: focus moves into the dialog on open; Tab cycles inside; Escape closes when dismissible; focus returns to the invoking control.
(v) Drawer: same as dialog when modal; mobile sizing is a DESIGN DECISION.
(vi) Popover: Escape closes; focus returns to trigger; not used for essential-only content on hover.
(vii) Tabs: WAI-ARIA tabs pattern (arrow keys between tabs, Tab into panel), selection model (automatic vs manual activation) is a DESIGN DECISION.
(viii) Pagination and breadcrumb: `aria-current` for the current item.
(ix) Table shell: sort/filter UI is **out of IB2 scope** unless the design includes it; data comes from inputs only (no backend coupling).

## 9. Responsive requirements

| Profile | Minimum the design must show |
| --- | --- |
| Wide desktop | Full layout, efficient keyboard operation (IR-01 §6.3) |
| Tablet / constrained desktop | Priority behaviour for tables and action groups; touch-safe controls |
| Mobile / narrow web | Summary/drill-down alternative for table shell; primary action discoverable; no page-wide horizontal scroll |
| **320 CSS pixels** | Every component specimen usable without loss of information or function; the only permitted exception is genuinely two-dimensional content with an accessible alternative (PAEP §6.2, IB-01 §12.1(i)) |
| Zoom 200% and 400% | No clipping of labels, errors or actions |
| Long translation | Labels ~2× English length; no truncation into ambiguity (IB-01 §14(iv)) |
| RTL (`ar`) | Mirrored layout, directional icons, drawer side, form flow |

## 9a. Long-content cases (the design must show)

Button and tab labels at ~2x English length; field label, help and error each wrapping over three lines; table cells with unbroken long tokens (IDs, URLs) wrapping or truncating with full text available to assistive technology; alert and dialog bodies longer than the viewport (scroll inside, actions reachable); breadcrumb with many long segments; status badge with long text; card/panel titles of two lines.

## 9b. Density requirements

Two profiles, compact (data-heavy enterprise screens) and comfortable (touch/default), switchable per container. Compact may reduce padding and control height but never below the 24x24 CSS px target rule (WCAG 2.5.8) and never removes focus visibility or labels. The design supplies values for both and names the default (IB-01 §12.1(iv); PAEP §6).

## 10. Keyboard and focus intent

Every interactive specimen must state: how focus enters, the key map, how focus leaves or returns, and what is announced. Minimum key maps: Button/Icon button Enter and Space; Checkbox Space; Radio arrows; Select native; Tabs arrows + Home/End; Dialog/Drawer Tab trap + Escape; Popover Escape; Pagination and breadcrumb Tab + Enter. Focus indicator must be visible on every interactive element in every theme and density.

## 11. Accessibility intent

WCAG 2.2 AA (PAEP §16). Name/role/value for every control; label/help/error programmatically associated (`aria-describedby`, `aria-invalid`); status and alert semantics chosen by persistence (persistent inline alert vs transient announcement); no colour-only meaning; contrast targets in §6; reduced motion; reflow; target size; RTL. Any exception must go to a controlled exception register with PO/SA approval (none is proposed).

## 12. Reduced-motion requirement

All foundation motion tokens collapse to no motion (or an opacity-only equivalent) under `prefers-reduced-motion: reduce`. Progress (indeterminate) and skeleton shimmer must have a static reduced-motion rendering. No animation may be unbounded or looping except indeterminate progress, which must stop under reduced motion. The design shows both renderings.

## 13. Product-theme / brand override rules

(i) Products override only the brand-accent group (and approved logo/imagery, which are not IB2 assets) through a named brand profile (`product.brandProfile`, IB-01 §9.3; contract field `brandProfile?: string` in `packages/contracts/src/lib/config/runtime-config.ts:37`).
(ii) Status, focus, disabled, error and text-contrast tokens are protected: a brand profile that sets them is rejected (enforced by test).
(iii) Every override must still pass the contrast gates; the design supplies the allowed accent range or rule (DESIGN DECISION).
(iv) The UI lab shows `proseit-default` plus one synthetic, obviously non-product demonstration profile to prove the override path. No real product brand is used.

## 14. UI-lab demonstration requirements

Per component: purpose, variants, applicable states, keyboard guidance, accessibility notes, responsive behaviour (desktop, tablet, 320 px), RTL note, usage guidance, evidence links (IR-01 §6.6 Code Block 8). Plus: token catalogue page (names, values, override rules, deprecation history), responsive/reflow page, brand-override demonstration, density toggle, reduced-motion demonstration. No product workflows, no backend calls, no domain data; sample content is neutral and synthetic.

## 15. Required handoff outputs (HOF-IB2-001 bundle)

Following DCH §9.1 and §22, the approved bundle should contain:

```
handoff/HOF-IB2-001/
├── handoff.manifest.yaml     # handoffId, version, status APPROVED_FOR_IMPLEMENTATION, dwpId DWP-IB2-001,
│                             # requirements[], screens[] (one per specimen/page), componentMap[], tokenMap,
│                             # assets[] with provenance, designApproval{approvedBy, approvedDate}, openDecisions: []
├── design-brief.md           # the approved DWP-IB2-001
├── foundation/token-values.md   # every value with semantic role, contrast pairs and rationale
├── screens/                  # specimens at desktop, tablet, 320px (+ RTL and reduced-motion where relevant)
├── interaction-notes.md      # state transitions, key maps, focus entry/return per component
├── component-map.md          # design element -> PAEP component/token; PROPOSED NEW PATTERN marked
├── accessibility-intent.md   # names, roles, announcements, non-colour cues, contrast table
├── responsive-rules.md       # breakpoints, table narrow strategy, action overflow, drawer sizing
├── content-keys.md           # message keys for reusable strings (empty, error, loading, pagination, etc.)
├── assets/                   # icons/fonts only if licensed and self-hostable
├── provenance.md             # prompts, brief version, tool, sources consulted, statement of independent composition
├── approvals.md              # DCH §17 gate table with PASS per gate, PO/SA approval
└── deviations/               # empty at approval
```

Prototype HTML/CSS/JS may be included as reference only (DCH §9.2(v)).

**Manifest must let Claude Code verify, per item:** design work-package identity (DWP-IB2-001 + version), approved status and approver, scope, token definitions (every value + semantic role), component mapping, state definitions, interaction intent, responsive intent, 320 CSS-pixel intent, accessibility intent, long-content behaviour, reduced-motion intent, product-brand override intent, provenance, and an empty unresolved-deviation list.

## 16. Prohibited clean-room inputs

No Ultima source, layouts, SCSS/themes or assets; no SAP Fiori implementation, theme or distinctive layouts; no PrimeNG/PrimeFlex/PrimeIcons theme files, class naming schemes or distinctive component structures copied or adapted; no other commercial template or UI kit; no screenshots of proprietary products translated into code or used as the design target; no unlicensed fonts or icons; no hosted-CDN-only assets. Open-source assets are allowed only with source, licence and approval recorded (DCH §23; PAEP §3, §19; CLAUDE.md mandatory rules).

## 17. Design provenance requirements

Record: DWP version used, the exact Claude Design prompt(s), the selected candidate and rejected alternatives where material, any external references consulted (capabilities only, never proprietary screens), asset sources and licences, reviewer names/roles and dates (DCH §7(vii), §8(x)-(xi), §23).

## 18. Acceptance checklist for the handoff (DCH §17 and Appendix E)

| Gate | Evidence needed | Result |
| --- | --- | --- |
| Requirement coverage | Every specimen/state maps to a REQ-IB2-* id | pending |
| Design-system conformity | Token map and component map complete; new patterns isolated | pending |
| Responsive intent | Desktop, tablet, 320 px variants; adaptation rules | pending |
| Accessibility intent | Key maps, focus, announcements, non-colour cues, contrast table | pending |
| Security/trust | No client-authority implication; no secrets or sensitive sample data | pending |
| State completeness | All applicable states in §7 | pending |
| Content/i18n | Content keys; long-text and RTL variants | pending |
| Provenance | Prompts, sources, assets, licences recorded | pending |
| Open decisions | None blocking implementation (§19 list closed) | pending |
| PO/SA approval | Recorded in approvals.md and manifest | pending |

## 19. Open design decisions the design stage must close

1. Font strategy: system font stack (no asset) or a self-hosted open-licence font.
2. Icon source: in-house SVG set or a named open-licence set (dependency/asset review).
3. Neutral, accent and status palettes; dark theme in or out of IB2 (default proposal: out, light theme only).
4. Type scale, spacing scale, radius, elevation strategy.
5. Motion: which transitions exist; durations and easing.
6. Breakpoint values and container widths.
7. Density values; which density is default.
8. Focus indicator style.
9. Table shell narrow-screen strategy (cards, priority columns, or bounded inner scroll).
10. Action-group overflow pattern; tabs overflow pattern; breadcrumb collapse.
11. Drawer side and mobile sizing; dialog mobile sizing.
12. Tabs activation model (automatic vs manual).
13. UI-lab information architecture (navigation between specimens).
