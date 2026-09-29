# DWP-IB2-001 — PAEP Design Foundations, Core Components and UI Laboratory

| Field (DCH §6.1) | Content |
| --- | --- |
| DWP ID / version | DWP-IB2-001 v1.0 (2026-09-26) |
| Handoff | HOF-IB2-001 v1.1 (brand revision, 2026-09-27), status READY_FOR_FINAL_PO_SA_APPROVAL (DCH §17.1 REVIEW). Not approved for implementation. v1.0 received *PO/SA review: CHANGES REQUESTED — BRAND REVISION*; the overall design was accepted subject to that revision. |
| Related requirement IDs | REQ-IB2-TOK-01..10, RSP-01..04, A11Y-01..04, CMP-01..02, LAB-01..02, I18N-01, SEC-01, CR-01, ASSET-01 (defined in `ib2/design-preparation/01-DESIGN-PREPARATION.md` §5 from PAEP v1.1 §6/§8/§16/§21, IR-01 §6, IB-01 §12/§14/§19, DCH §11-§13, §23) |
| User / primary task | (1) Product engineers building ProSEIT products need one consistent, accessible set of tokens and components so screens are not re-invented per product. (2) End users in data-heavy enterprise work (operations, stores, finance, field supervision) on desktops, shared tablets and phones need legible, predictable, keyboard- and touch-operable controls. (3) Reviewers need the UI lab as evidence that the design system exists independently of any product screen. |
| Context | Product-neutral platform kernel: `@proseit/paep-foundation`, the first `@proseit/paep-components` tranche and `apps/ui-lab`. No product, tenant, backend, shell or domain workflow. |
| Screen / workflow IDs | SCR-IB2-L01..L02 (UI lab), F01..F09 (foundations, brand), C01..C08 incl. C03N and C06A..E (components), R01..R03 incl. R02D (long content, RTL, 320 px). Inventory: `handoff.manifest.yaml` → `screens`. |
| PAEP design-system baseline | None exists (this handoff creates it). Token architecture: 02-TECHNICAL-ANALYSIS §C. Accepted engineering baseline: Generation 3 (main `d33ab91`). |
| Viewport profiles | Wide desktop (≥ 1440), constrained desktop (1024-1439), tablet (600-1023), narrow (< 600), 320 CSS px reflow; conceptual checks at 200 % and 400 % zoom, ~2× text, RTL. |
| Required states | Per component (component-specs.md): default, hover, focus-visible, active, selected, disabled, read-only, invalid, loading; collections: loading, empty, filtered/no-results, populated, error + retry. Permission/edition/offline/conflict: represented only as disabled + explanatory text (IR-01 §6.5(iv), DCH §13(i)). |
| Data assumptions | Neutral synthetic sample content only ("Sample item Alpha", `REC-2026-000184`, "Site 3"). No schema, no backend, no real product or customer data. |
| Accessibility intent | WCAG 2.2 AA. See accessibility-intent.md. |
| Content / i18n | Stable message keys (content-keys.md); ~2× expansion; RTL (`ar`) verified in SCR-IB2-R02/R02D. |
| Acceptance criteria | approvals.md gate table (DCH §17) plus the review report. |

## Design objective

Establish the first independent PAEP visual and interaction language: calm, legible, dense-when-needed, and unmistakably consistent across manufacturing, agriculture, construction and future ProSEIT products.

## Design principles applied

1. **Legibility over ornament.** High-contrast neutrals, borders on every layer, no decorative gradients, no illustration. Suits uneven display quality, bright ambient light and shared devices common in African enterprise operating environments.
2. **Low weight, self-hosted.** Zero font files, inline SVG icons, no CDN: works on constrained bandwidth, on-premise and offline hosts (IB-01 §19).
3. **Touch-first default, desktop-dense by choice.** Comfortable density by default; compact opt-in per container for desktop data work.
4. **Meaning never by colour alone.** Every state carries shape, text, border style or thickness.
5. **Adaptive by container, not by shrinking.** Components decide their own narrow behaviour with container queries.
6. **Brand identifies, it never signals.** ProSEIT Navy `#24364B` is the dominant brand colour (`brand-primary`) and ProSEIT Gold `#D4A62A` a restrained accent (`brand-accent`, always with dark `on-brand-accent` text, never white). Products change only seven brand tokens (primary, primary-hover, primary-active, primary-subtle, on-primary, accent, on-accent); everything that carries safety, status or accessibility meaning is fixed.
7. **Small tranche, complete states.** Exactly the 25 components of IR-01 §6.4.

## Mandatory vs exploratory (DCH §6.2(v))

Mandatory: everything in the controlled requirements above, 25/25 components, 320 px, RTL, reduced motion, protected tokens, clean-room provenance.
Brand primary and accent colours are PO/SA-directed (2026-09-27), not exploratory. Exploratory preferences (recorded as recommendations, not requirements): brand tonal variants (hover, active, subtle), 14 px body size, specific easing curves. These are listed in `decision-record.md` with alternatives.

## Out of scope

Enterprise shell (IB3), Frappe/SDK (IB4), analytics (IB5), offline queue (IB7), i18n runtime, domain kits, product screens, toast/tooltip/menu/date pickers, row selection/sort/filter, dark theme.

## Bundle contents

| File | Purpose |
| --- | --- |
| handoff.manifest.yaml | Authoritative inventory (DCH §9) |
| design-brief.md | This DWP |
| decision-record.md | 21 open decisions with options A/B/C and the recommended candidate |
| foundation/token-values.md | Every candidate value, rationale, contrast evidence |
| foundation/token-values.candidate.json | Machine-readable values |
| foundation/prototype-reference.css | Prototype CSS used by the specimens (reference only, DCH §9.2(v)) |
| component-specs.md | 25 × 15-field component specifications |
| component-map.md | Design element → PAEP target |
| interaction-notes.md | Key maps, focus entry/return, state transitions, motion |
| accessibility-intent.md | Names/roles/announcements, non-colour cues, targets, contrast summary |
| responsive-rules.md | Breakpoints, containers, per-component narrow rules, 320/zoom/RTL |
| content-keys.md | Message keys for reusable strings |
| screens/ | 28 self-contained HTML specimens + 86 PNG renders + render-check.json |
| assets/icons/ | 25 PAEP icons (SVG) + sprite |
| provenance.md | Prompt, sources, tool, independent-composition statement |
| approvals.md | DCH §17 gate table; PO/SA PENDING |
| deviations/ | Empty (no deviations) |
| design-review-report.md | The review candidate report |
