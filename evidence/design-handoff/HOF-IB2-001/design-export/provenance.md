# Provenance

> HOF-IB2-001 v1.1 (brand revision, 2026-09-27) · DWP-IB2-001 v1.0 · READY_FOR_FINAL_PO_SA_APPROVAL.

## 1. Identity
| Item | Value |
| --- | --- |
| Design brief version | DWP-IB2-001 v1.0 (design-brief.md), 2026-09-26 |
| Design-preparation input | `ib2/design-preparation/01-DESIGN-PREPARATION.md` (UNCOMMITTED preparation pack, 2026-09-26) |
| Prompt of record | `provenance/design-prompt.txt`: the PO/SA's controlled design-stage prompt, verbatim (project thread, 2026-09-26T20:40:40Z) |
| Revision instruction (v1.1) | PO/SA design review decision on HOF-IB2-001 v1.0, "CHANGES REQUESTED — NARROW BRAND REVISION ONLY" (project chat, 2026-09-27T09:08Z), relayed to this thread by the project coordinator session. |
| Coordination note | The project coordinator session asked for the bundle at `/mnt/project-files/ib2/handoff/HOF-IB2-001/`, self-contained HTML/SVG specimens, one browsable page, no repository commit, and no change to `ib2/design-preparation/`. All followed. |
| Design tool / model | Claude Code cloud session (Anthropic Claude, Opus-class model, configured id `claude-opus-5-5`), acting in the "Claude Design" role of PAEP-DCH-01. Specimens authored as HTML/CSS/SVG by generator scripts (`provenance/generator/`); renders captured with headless Chromium via Playwright. |
| Repository base read | `kougit/proseit-paep` main `d33ab91` (Generation 3 ACCEPTED). Read-only; nothing committed. |

## 2. Controlled sources consulted (sha-256 of the files read)
| sha-256 | File |
| --- | --- |
| `8bc9aee796b07644dedc240cba661c0c1c5b20b2bd99a233a6224a1153f48a75` | `.paep-control/text/PAEP_DCH_01_v1.0_text.md` |
| `920d12e28e7cb4e9a96af28ec4803bab892c1032d1d94a0ac0452825b8a4bb09` | `.paep-control/text/PAEP_EQP_01_v1.1_text.md` |
| `bfdc1dbd1b73bc26f3893b2d8db1a327ec362b628137aa8270aacf2b66bbbf28` | `.paep-control/text/PAEP_IB_01_v1.0_text.md` |
| `5cd5f01ab5a036296711a83768757b39338a5b28b5e57e2baed9b87b12731586` | `.paep-control/text/PAEP_IR_01_v1.0_text.md` |
| `7abebe5fa09c6f903423734164f2fdbb7618711267190b10ade1423cd70b2c4f` | `.paep-control/text/PAEP_v1.1_text.md` |
| `cbae92bae66d58d8ea5ef5e90ae9df127098f6777711179e9d13b685dd8f5262` | `.paep-control/SOURCE_OF_TRUTH.md` |
| `5d09509b185c2e24528f4a782f02255dec1296b16986f40d7728101e59765f4a` | `ib2/design-preparation/00-README.md` |
| `4f0a065e7c99fd523cf45989f5023522461ce5394bff2021e94d4b7884b4596f` | `ib2/design-preparation/01-DESIGN-PREPARATION.md` |
| `372bc96b8ced04f339ae03191313f5b02d6595b697e29724c676473aeabf659f` | `ib2/design-preparation/02-TECHNICAL-ANALYSIS.md` |
| `599433e6703f7026ea61f8bd3d8082d7acd070576e9b59230c2911cd81898ab7` | `ib2/design-preparation/03-DEPENDENCY-DECISION.md` |
| `a8a019f20e0d99db50825c8ed2443a23f830a4f0331a59d071bc2199e836721e` | `ib2/design-preparation/04-NEXT-STAGE-PROMPTS.md` |
| `f556e774426a64cc15a6f36372c092a8029650f9859702acf03d286458fd6c3e` | `ib2/design-preparation/05-WORK-PACKAGE-DRAFT.md` |
| `77c7040083a3ae1b0c526217a95dd164d8582ce068126316d25101622dbd01cd` | `ib2/design-preparation/06-LANE-H-CI-IMPACT.md` |
| `90b2a9c7e777c9cfb5dd6ceb7cc97d741f25b9e2e400e7a0ae760243fca6bf9a` | `ib2/design-preparation/07-LANE-GJ-CLEANROOM-RISK.md` |

Also read: `CLAUDE.md` (engineering contract), `docs/adr/ADR-REGISTER.md` listing, `packages/contracts/src/lib/config/runtime-config.ts` (brandProfile field) by reference from the preparation pack. Sections used most: PAEP v1.1 §6, §6.1, §6.2, §8, §16; IR-01 §6.1-§6.7; IB-01 §9.3, §12.1, §14, §19; DCH §5-§26 and Appendix B; EQP §5.2, §29.3.

**Branding sources:** v1.0 found no authoritative ProSEIT brand specification and proposed petrol blue `#0B5E73` as a CANDIDATE. In v1.1 the brand colours come from the **PO/SA review decision of 2026-09-27**: ProSEIT Navy `#24364B` (brand-primary) and ProSEIT Gold `#D4A62A` (brand-accent). The on-brand tokens (`#FFFFFF` on Navy, `#1A1F26` on Gold) were computed in this session from WCAG contrast; the tonal variants (`#1B2A3B`, `#121E2B`, `#E7ECF2`) were derived in this session and remain CANDIDATE DESIGN VALUES. No logo, brand guide or external brand asset was supplied or used. Petrol blue is retained only as the synthetic, non-product demonstration profile `synthetic-demo-petrol`.

## 3. External references
No external visual reference was used. No screenshots, templates, UI kits, themes or design-system sites were opened or consulted. No web access was used in this design stage. Interaction conventions come from public, non-proprietary standards: WCAG 2.2 and the W3C WAI-ARIA Authoring Practices patterns (tabs, menu button, dialog, disclosure), and native HTML behaviour (`<dialog>`, `popover`, `<progress>`). These are capability/behaviour references, not visual sources.

## 4. Assets
| Asset | Source | Licence | Self-hostable | Status |
| --- | --- | --- | --- | --- |
| 25 icons (`assets/icons/paep-icon-*.svg`, sprite) | Authored in this design stage from geometric primitives (lines, arcs, circles, polygons) on a 24 px grid | ProSEIT-owned (no third-party licence) | Yes (inline SVG) | CANDIDATE, requires PO/SA approval |
| Fonts | None shipped: system font stack only | n/a | n/a | No asset |
| Illustrations / logos / images | None | n/a | n/a | No asset |

Third-party dependency or asset decisions required by this design: **NONE**.

## 5. Alternatives
Candidate and rejected alternatives for all 21 material decisions: `decision-record.md`. Rejected with material reasons: hosted/self-hosted web font (OD-01), third-party and Material icon sets (OD-02), green/blue/warm accents (OD-03), dark mode in IB2 (OD-04), card transformation as table mode (OD-14), measured overflow (OD-15), tabs-to-select (OD-16), inline-start drawer and bottom sheets (OD-18/19), app-shell UI lab (OD-21). Only OD-14's three strategies were rendered side by side as specimens (SCR-IB2-C03N); the other alternatives were compared in writing.

## 6. Statement of independent composition
The PAEP visual and interaction language in this bundle was composed independently from the PAEP controlled requirements, WCAG 2.2, general enterprise-UX principles and the constraints of the target operating environments. It does not use, trace, adapt or recreate Ultima, PrimeNG/PrimeFlex/PrimeIcons, SAP Fiori, Material themes, or any commercial template, dashboard kit, design-system screenshot or proprietary product screen. No proprietary source, theme file, class-naming scheme, asset or distinctive layout was inserted. Colour values, scales, anatomy and icon geometry were chosen and computed in this session (contrast by the WCAG relative-luminance formula, `provenance/generator/contrast.py`). Class names in the prototype use the PAEP `paep-` prefix and describe PAEP's own anatomy.

## 7. Revision history
| Version | Date | Change | Source |
| --- | --- | --- | --- |
| 1.0 | 2026-09-26 | Initial review candidate | PO/SA design-stage prompt |
| 1.1 | 2026-09-27 | Brand revision only: brand group split into primary/accent (7 keys); Navy/Gold defaults; dark on-gold; petrol moved to `synthetic-demo-petrol` (replaces `synthetic-demo-plum`); 28 specimens and 86 renders regenerated; token values, manifest, specs, decisions, accessibility, approvals updated. No other decision, component, layout or behaviour changed. | PO/SA review: CHANGES REQUESTED — BRAND REVISION |

## 8. Prototype code status
`screens/*.html` and `foundation/prototype-reference.css` are **reference material only** (DCH §9.2(v)). They are not PAEP-conforming production code and must be reconstructed by Claude Code under the Angular package, token and test rules after approval.
