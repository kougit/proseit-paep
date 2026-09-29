# Decision record (open design decisions OD-01..OD-21)

> HOF-IB2-001 v1.1 (brand revision) · **APPROVED_FOR_IMPLEMENTATION**. **PO/SA design approval of v1.1 (2026-09-27): GRANTED.** All 21 decisions below are APPROVED as recorded; open design decisions: NONE; design deviations: NONE. **PO/SA review of v1.0 (2026-09-27): CHANGES REQUESTED — BRAND REVISION.** The overall design was accepted subject to a narrow brand revision; OD-03 is revised below and OD-01, OD-02, OD-04..OD-21 are retained unchanged. Each decision lists the options actually compared in this design stage and the **RECOMMENDED CANDIDATE**. PO/SA approval was recorded on 2026-09-27. "Compared" means evaluated in writing against the criteria given; options B/C were rendered as specimens only where stated.

| # | Decision | Recommended candidate | Dependency? |
| --- | --- | --- | --- |
| OD-01 | Font strategy | System font stack | None |
| OD-02 | Icon strategy | PAEP-owned SVG set (25 glyphs, authored here) | None |
| OD-03 | Neutral / brand / status palettes | Cool-grey neutrals; ProSEIT Navy brand-primary + ProSEIT Gold brand-accent (PO/SA direction, v1.1); petrol blue only as synthetic demo profile; protected status set | None |
| OD-04 | Dark mode in IB2 | Out of IB2 (architecture ready) | None |
| OD-05 | Type scale | 12/13/14/16/18/20/24/30 px, body 14/20 | None |
| OD-06 | Spacing scale | 4 px base, 12 steps | None |
| OD-07 | Radius | 0/2/4/6/8/full | None |
| OD-08 | Elevation | Border on every layer + 5 restrained shadow levels | None |
| OD-09 | Motion | 90-250 ms, 3 easings, 3 loops; all removable | None |
| OD-10 | Breakpoints | 600 / 1024 / 1440 px (em queries) | None |
| OD-11 | Container / grid | 4/8/12 cols; 90 rem max; container queries | None |
| OD-12 | Density values / default | Comfortable default; compact opt-in | None |
| OD-13 | Focus style | 2 px #2D4FD1 ring, 2 px offset, white halo | None |
| OD-14 | Table narrow strategy | Priority columns + row detail; bounded scroll as fallback | None |
| OD-15 | Action overflow | Rule-based "More" menu below 30 rem container | None |
| OD-16 | Tabs overflow | Bounded horizontal scroll inside the tab list | None |
| OD-17 | Breadcrumb collapse | first · … · parent · current; inline expansion | None |
| OD-18 | Drawer side / mobile | inline-end; 30/40 rem; full width < 600 px | None |
| OD-19 | Dialog mobile sizing | Inset 16 px (sm/md); full screen (lg) | None |
| OD-20 | Tabs activation | Automatic default; manual opt-in | None |
| OD-21 | UI-lab IA | Contents list + flat sections; disclosure at narrow | None |

Third-party dependency decisions required by this design: **NONE**. (The engineering test-tooling decision in `ib2/design-preparation/03-DEPENDENCY-DECISION.md` — Vitest/Playwright/axe-core — is separate and still open; it is not created or changed by this design.)

---

### OD-01 Font strategy
- **A. System font stack** (`system-ui, -apple-system, "Segoe UI", Roboto, "Noto Sans", …`). Zero bytes, zero licence, native script coverage (Arabic, Ethiopic via installed Noto), native hinting on low-DPI screens. Minor cross-OS variation in metrics.
- B. Self-hosted open-licence sans (e.g. an OFL-1.1 family). Identical rendering everywhere; adds ~100-300 KB per weight set, a licence record, subsetting and Arabic coverage work.
- C. Hosted web font (CDN). Rejected: violates IB-01 §19.1(iv).
- **RECOMMENDED: A.** No controlled reason justifies an asset dependency; DCH §21(iv) already tolerates font-rendering variation in visual evidence. B stays available later through a DEPENDENCY / ASSET DECISION if brand identity requires it.

### OD-02 Icon strategy
- **A. PAEP-owned icon set** authored in this design stage on a 24 px grid (2 px stroke, round joins, currentColor), 25 glyphs sized exactly to the tranche, delivered as an inline sprite. ProSEIT owns it; no licence, no package.
- B. A named open-source set (e.g. an ISC- or MIT-licensed outline set) as an npm dependency. Broad vocabulary; requires a dependency/asset decision, licence notice and provenance; brings far more glyphs than governed.
- C. Material Symbols (Apache-2.0). Strong visual association with a specific commercial design language, which conflicts with the independence goal.
- **RECOMMENDED: A.** Satisfies "one governed icon vocabulary" (PAEP §6) with zero dependency. Growth path: add glyphs to the PAEP set by design review; B only by a future DEPENDENCY / ASSET DECISION.

### OD-03 Palettes
- Neutral: **A. cool grey (chosen)** vs B. warm grey (read as beige/dated on low-quality panels, lower perceived contrast) vs C. pure grey (flat, harsh).
- Brand (v1.1, **PO/SA direction 2026-09-27**): **ProSEIT Navy `#24364B` = brand-primary** (dominant: primary button, links, selected state, checked controls, progress) and **ProSEIT Gold `#D4A62A` = brand-accent** (restrained emphasis only). on-brand-primary `#FFFFFF` (12.32:1); on-brand-accent `#1A1F26` (7.32:1); white on gold is prohibited (2.26:1); gold is never text or an indicator on light surfaces and never in status-like shapes (its hue is near warning). Navy's low chroma (OKLCH C 0.044) keeps it reading as a dark neutral, not as information. Tonal variants hover `#1B2A3B`, active `#121E2B`, subtle `#E7ECF2` are CANDIDATE. The public brand model is kept at seven keys.
- Superseded (v1.0): accent petrol blue `#0B5E73` was the v1.0 candidate default. It is **no longer the ProSEIT default** and survives only as the obviously synthetic, non-product profile `synthetic-demo-petrol` that proves brand override (SCR-IB2-F09). v1.0 alternatives considered were: B. mid blue (collides with info and focus) vs C. green (collides with success; confuses status) vs D. warm ochre/terracotta (collides with warning/error).
- Status: fixed protected set, hues chosen for maximum mutual distinction and ≥ 5.66:1 text on tint.
- **RECOMMENDED (v1.1): cool grey + ProSEIT Navy/Gold brand per PO/SA direction + protected status.** Protected semantics (success, warning, error, information, focus, invalid, disabled, accessibility contrast) are identical to v1.0 and cannot be overridden by any profile.

### OD-04 Dark mode
- A. Include in IB2. Doubles contrast, visual-regression and review scope before any product demand.
- **B. Exclude from IB2; keep tokens layered and a `data-paep-theme` hook so a later WP can add it under the same gates (PAEP §6.1).**
- **RECOMMENDED: B.**

### OD-05 Type scale
- **A. 14 px body, 1.125-1.25 steps to 30 px (chosen).** Data-dense but readable.
- B. 16 px body. More readable prose; tables and forms lose ~15 % density.
- C. 13 px body. Too small for shared, low-DPI devices.
- **RECOMMENDED: A**, with body-lg 16 px available for reading passages.

### OD-06 Spacing
- **A. 4 px base, 12 steps (0-64).** B. 8 px base (too coarse for compact tables). C. 5/10 base (does not align with 16 px root / icon sizes).
- **RECOMMENDED: A.**

### OD-07 Radius
- **A. Restrained 2/4/6/8** (chosen). B. Zero radius (harsh, poorer grouping cue). C. Large 12-16 (decorative, wastes space in dense UIs).
- **RECOMMENDED: A.**

### OD-08 Elevation
- **A. Border on every layer + restrained shadows only for overlays (chosen).** B. Shadow-only (fails in forced colours and on poor screens). C. Border-only everywhere (overlays lose separation from content).
- **RECOMMENDED: A.** Raised card level defined but unused.

### OD-09 Motion
- **A. Short (90-250 ms), opacity/position only, overlays and feedback only; everything removable (chosen).** B. No motion at all (loses useful continuity for overlays). C. Expressive motion (springs, route transitions) — decorative, rejected.
- **RECOMMENDED: A.**

### OD-10 Breakpoints
- **A. 600 / 1024 / 1440 (chosen)**: phones < 600, tablets portrait/landscape 600-1023, laptops 1024-1439, wide ≥ 1440; expressed in em so text zoom triggers them.
- B. 480 / 768 / 1280: 768 splits common 800-834 px tablets awkwardly.
- C. Container queries only (no viewport breakpoints): insufficient for page-level layout and overlays.
- **RECOMMENDED: A + container queries for components.**

### OD-11 Container / grid
- **A. 4/8/12 columns, 16/16/24 gutters, 16/24/32 margins, 90 rem max (chosen).** B. Fluid single column with max width only (weak for dashboards later). C. 16-column grid (unneeded complexity).
- **RECOMMENDED: A.**

### OD-12 Density default
- **A. Comfortable default, compact opt-in per container (chosen).** Safer for touch, shared devices and gloves; desktop data screens opt in.
- B. Compact default. Better first impression for desktop tables, but touch/tablet screens would need opt-out everywhere.
- C. Automatic by pointer type only. Unpredictable for users who move between devices.
- **RECOMMENDED: A** (compact still switches to 40 px controls under coarse pointer).

### OD-13 Focus style
- **A. 2 px coloured ring, 2 px offset, white halo (chosen).** B. Two-tone black/white ring (universal but visually heavy on every click). C. Brand-coloured ring (breaks the protected-focus rule; confused with selection).
- **RECOMMENDED: A.**

### OD-14 Table narrow strategy (D1)
Full comparison and 320 px specimens: SCR-IB2-C03N.
- **A. Priority columns + row detail.** B. Card/summary transformation. C. Bounded internal horizontal scroll.
- **RECOMMENDED: A as PRIMARY; C as CONTROLLED FALLBACK** only for genuinely two-dimensional comparison (matrix/timesheet-like), with sticky key column and a focusable, named scroll region. B rejected as a table mode (products may use List or Card for browse views).

### OD-15 Action overflow
- **A. Rule-based: container < 30 rem → primary + "More" menu (chosen).** Deterministic, testable, no measuring.
- B. Measured progressive overflow (ResizeObserver moves lowest-priority items as space shrinks). Smoother, but layout-dependent tests and thrash.
- C. Wrap only (no overflow). Long lists of actions stack into a tall block at 320 px.
- **RECOMMENDED: A**, with wrapping at medium widths before the rule triggers.

### OD-16 Tabs overflow
- **A. Bounded horizontal scroll inside the tab list with edge scroll buttons (chosen).** Tab order and semantics unchanged; arrow keys scroll the focused tab into view.
- B. "More" menu for overflowing tabs. Hides tabs behind a second pattern; mixed tab/menu semantics.
- C. Convert to a select at narrow. Loses tab semantics and panel association.
- **RECOMMENDED: A.** This is bounded inner scrolling of a single row, not page scroll.

### OD-17 Breadcrumb collapse
- **A. first · … · parent · current, "…" expands inline (chosen).** B. Only a "Back to parent" link at narrow (loses location context). C. Always wrap (long hierarchies consume 4-5 lines at 320 px).
- **RECOMMENDED: A** (collapse when > 4 segments or container < 36 rem).

### OD-18 Drawer side / sizing
- **A. inline-end default, 30 rem (lg 40 rem), tablet min(30 rem, 100vw − 48 px), full width < 600 px (chosen).** Detail sits beside content; the inline-start edge is reserved for IB3 navigation.
- B. inline-start default: conflicts with future navigation drawer.
- C. Bottom sheet on mobile: introduces a second overlay form and drag gestures.
- **RECOMMENDED: A**; mobile full width = yes.

### OD-19 Dialog mobile sizing
- **A. sm/md inset 16 px with stacked full-width actions; lg full screen (chosen).**
- B. All dialogs full screen on mobile: confirmations lose their "interruption" character and context.
- C. Bottom sheet: second pattern; rejected as in OD-18.
- **RECOMMENDED: A.**

### OD-20 Tabs activation
- **A. Automatic activation by default (chosen)**: IB2 panels render local content without latency (WAI-ARIA APG guidance).
- B. Manual activation always: extra keystroke for every switch.
- **RECOMMENDED: A**, with `activation="manual"` as a documented opt-in for panels that load expensive content.

### OD-21 UI-lab information architecture
- **A. Contents list at inline-start (≥ 1024) / disclosure at narrow, flat sections: Overview, Foundations, Components, Proofs (chosen).**
- B. Full app shell with topbar and sidebar: pre-empts IB3 shell and risks the lab becoming a shell prototype.
- C. Single very long page: poor for evidence links and deep-linking.
- **RECOMMENDED: A.**
