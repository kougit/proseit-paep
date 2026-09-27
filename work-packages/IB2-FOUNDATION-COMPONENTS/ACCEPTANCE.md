# IB2-FOUNDATION-COMPONENTS — Acceptance Criteria

All criteria are mandatory. PASS is technical; ACCEPTED is the PO/SA's decision. Visual captures are CANDIDATE evidence until the PO/SA accepts them.

| ID | Criterion | Verification |
| --- | --- | --- |
| IB2-AC01 | Pre-flight on `origin/main`: generation 3 ACCEPTED and active, no candidate, IB0/IB1 gates green, main CI green, lockfile and CLAUDE.md match the registry fingerprints | `evidence/IB2-FOUNDATION-COMPONENTS/reports/preflight.md` |
| IB2-AC02 | HOF-IB2-001 v1.1 APPROVED_FOR_IMPLEMENTATION is retained in the DCH evidence structure and referenced by exact version and manifest hash; design classification recorded | `evidence/design-handoff/HOF-IB2-001/`; `qa:design-system` S01 |
| IB2-AC03 | Foundation implements every token category of HOF-IB2-001 with the approved values: reference, semantic, status, brand, typography, spacing, size, density, radius, elevation, motion, breakpoints, grid, layout, focus | `qa:design-system` token conformance (stylesheet vs `token-values.candidate.json`); foundation unit tests |
| IB2-AC04 | Only the seven brand keys can be overridden; protected semantic tokens cannot; the validator rules 1–7 fail closed (Navy/Gold pass, synthetic petrol passes, rejected yellow and each rule violation fail) | foundation unit tests; `qa:design-system:negative` |
| IB2-AC05 | Every approved text/non-text token pair meets its WCAG 2.2 AA contrast target | foundation contrast tests |
| IB2-AC06 | Reduced motion sets every motion duration to 0 and stops every loop, verified in a browser | component tests; `qa:accessibility` reduced-motion pass |
| IB2-AC07 | The 25 components of IR-01 §6.4 exist and are exported only through `@proseit/paep-components`; no deep, Frappe, domain or app import; components depend only on foundation and Angular | `qa:design-system` API census; `qa:architecture` |
| IB2-AC08 | Component behaviour tests in a real browser cover keyboard, focus entry/trap/restore, states, events, semantics and error association for every component; a run with zero tests fails | `npm run test:components` (Vitest browser, Chromium) |
| IB2-AC09 | Component CSS uses only `var(--paep-*)` tokens (no raw colour, length or shadow literals outside the documented structural allowlist) and only logical properties | `qa:design-system` static checks; negative fixtures |
| IB2-AC10 | axe-core reports zero violations on every UI-lab page at 1440, 834 and 320 CSS px, in LTR and RTL, and under reduced motion | `qa:accessibility` |
| IB2-AC11 | 320 px reflow: no page-level horizontal overflow on any UI-lab page; touch/compact density keeps 40 px targets under `pointer: coarse` | `qa:accessibility` |
| IB2-AC12 | Computed styles of rendered components match the approved token values (brand, surfaces, focus ring, control heights per density) | `qa:accessibility` computed-style checks |
| IB2-AC13 | UI lab: one specimen page per component (purpose, variants, states, accessibility, responsive, RTL, evidence) plus token catalogue and foundation pages; the coverage check fails when a component or page is missing | `qa:design-system` coverage; negative fixture |
| IB2-AC14 | Visual captures at 1440/834/320 for every UI-lab page are retained as CANDIDATE evidence and compared with the approved handoff renders; nothing is self-approved | `evidence/IB2-FOUNDATION-COMPONENTS/visual/`; design conformance report |
| IB2-AC15 | Clean-room: no Ultima, PrimeNG, SAP Fiori or commercial theme names, classes, assets or code; icons are PAEP-owned; the Angular favicon is replaced | `qa:design-system` clean-room scan; provenance register |
| IB2-AC16 | Dependencies exactly the four approved dev packages at exact pins; registry + sha512 provenance, install scripts denied, licences reviewed (axe-core L5) | W06, W16, W22; licence review |
| IB2-AC17 | `PAEP / components` and `PAEP / accessibility` run in parallel and are mandatory in `PAEP / gate`, whose context and logic are unchanged; `PAEP / negative-ci` timeout stays 20 minutes with no IB2 workload | W11, W12; WP05 negatives |
| IB2-AC18 | IB0/IB1 regressions: `qa:ib0-wp05` full with only the bounds in `WORK_PACKAGE.md` §7; WP05 negatives; `qa:ib1`; `qa:ib1:negative`; `qa:baseline`; `qa:baseline:negative` | logs under `evidence/IB2-FOUNDATION-COMPONENTS/logs/` |
| IB2-AC19 | Strict typecheck, both production builds and `qa:architecture` pass; no Nx; Angular 22.1.8 / TypeScript 6.0.3 unchanged | `qa:types`; builds; W04 |
| IB2-AC20 | Generation 4 CANDIDATE with exact scope; every change in scope; generation 3 unchanged; no self-promotion | `qa:baseline` B01–B13 |
| IB2-AC21 | Independent QA lanes Q1–Q11: High 0, Medium 0 | `evidence/IB2-FOUNDATION-COMPONENTS/reports/independent-qa.md` |
| IB2-AC22 | Complete, untracked PO/SA governance diff for `.github/**` and `tooling/verification/**` | `evidence/IB2-FOUNDATION-COMPONENTS/review/PO-SA-GOVERNANCE-DIFF.txt` (not committed) |
| IB2-AC23 | Exact-head GitHub Actions run green including `PAEP / gate`; PR mergeable | CI report |
| IB2-AC24 | No secret in source, fixtures, logs or evidence; controlled sources and CLAUDE.md unchanged | W02, W08 |
