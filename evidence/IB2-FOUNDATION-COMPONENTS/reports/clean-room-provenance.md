# IB2-FOUNDATION-COMPONENTS — Clean-Room and Provenance (IB2-AC15)

Measured on the final code commit (`logs/verification-6dc71cc/`) on 2026-09-27. Status: PASS (technical) for S06 (`qa:design-system` 10/10 and `qa:design-system:negative` 49/49). Provenance approvals are the PO/SA's and are quoted from the register, not made here.

## 1. Rules applied

| Rule | Source |
| --- | --- |
| No copied proprietary template source, theme files, assets or distinctive implementation artefacts | CLAUDE.md "Mandatory rules"; PAEP v1.1 §19 "Prohibited inputs"; DCH §23(ii) |
| No Ultima, PrimeNG template, SAP Fiori, commercial theme, proprietary CSS/assets or screenshot translation | WORK_PACKAGE.md R-CLEAN |
| Design prompts describe capabilities, not replication of commercial screens; generated output reviewed before adoption | PAEP v1.1 §19 "Generated design/code assistance"; DCH §23(i), (iv) |
| Prototype HTML/CSS in the handoff is reference only, reconstructed under PAEP rules | DCH §9.2(v); `design-export/provenance.md` §8 |
| Assets without clear ownership do not move into production | DCH §9.2(iv) |

## 2. What S06 scans

`tooling/design-system/design-system-qa.mjs` S06:

| Item | Value |
| --- | --- |
| Folders | `packages/components`, `packages/foundation`, `apps/ui-lab` |
| File types | `.ts`, `.css`, `.html`, `.json`, `.svg`, `.md` (every file in those folders has one of these types) |
| Files scanned | 138 |
| Forbidden terms (11 case-insensitive patterns, `FORBIDDEN_TERMS`) | `\bultima\b`; `primeng`; `primeicons`; `primeflex`; `\bp-(button\|table\|dialog\|inputtext\|dropdown)\b`; `\bfiori\b`; `\bui5\b`; `\bsapui`; `\bmat-(button\|form-field\|table\|dialog)\b`; `@angular/material`; `@angular/cdk` |
| Favicon rule | fails if `apps/ui-lab/public/favicon.ico` (Angular logo) exists |
| Result | `PASS S06 … 138 files scanned` |
| Negatives | N18 (`primeng` and `class="p-button"` added to `card.ts` → S06 fails); N19 (`favicon.ico` restored → S06 fails) |

An independent `grep -rliE` with the same patterns over all of `apps/`, `packages/` and `tooling/design-system/` found only the two files that define the pattern list (`design-system-qa.mjs`, `design-system-negative.mjs`).

S06 does not scan `apps/reference-app`, `tooling/`, `docs/` or `evidence/` (out of its folder list). S05 separately fails any import of `@angular/*` other than `core`, `common`, `forms`, `router`, `platform-browser` from components, and anything but `@angular/core` from the foundation, in single- or double-quoted specifiers (N26). S05 also checks CSS `@import`: the only package path allowed is `@proseit/paep-foundation/src/styles/paep-foundation.css`, and only from `apps/` (used once, `apps/ui-lab/src/styles.css`); N31 proves a component stylesheet importing a package path fails.

## 3. Icons

| Item | Finding | Evidence |
| --- | --- | --- |
| Source | 25 icons authored in HOF-IB2-001 (all 26 icon files, including the sprite, are pinned by sha256 in `HANDOFF-FILES.sha256` and checked by S01) "from geometric primitives … on a 24 px grid", ProSEIT-owned, no third-party licence; manifest `assets` rows `provenance: authored-in-HOF-IB2-001`, `owner: ProSEIT` | `design-export/provenance.md` §4; `handoff.manifest.yaml` `assets` |
| Implementation | `PAEP_ICONS` in `packages/foundation/src/lib/icons/icons.ts`: 25 entries of drawing data only (path `d`, circle `cx/cy/r`, filled flag); header states "metadata and titles were stripped" | `icons.ts` |
| Equality with the handoff | For each of the 25 `design-export/assets/icons/paep-icon-*.svg` files, the path and circle data equal the `PAEP_ICONS` entry of the same name: 25/25 identical, no extra or missing icon (throwaway comparison script, outside the repository) | this report |
| Stripped metadata | The handoff SVGs carry a `<metadata>` C2PA content-credential block, a comment and a `<title>`; none of it is in `icons.ts` | handoff SVG files; `icons.ts` |
| Rendering | `svg[paepIcon]` (`icon.ts`) renders inline `<svg:path>`/`<svg:circle>`, `aria-hidden="true"`, `focusable="false"`; no external reference; the sprite file is not used by any code | `icon.ts`; grep for `sprite` in `apps/`, `packages/` |

## 4. Favicon, fonts, external assets

| Item | Finding |
| --- | --- |
| UI-lab favicon | `apps/ui-lab/public/favicon.svg`, PAEP-authored (Navy square `#24364B`, white stroke, gold `#D4A62A` rule); `index.html` links it; no `favicon.ico` in `apps/ui-lab/public/` |
| Reference-app favicon | `apps/reference-app/public/favicon.ico` (Angular default) is still present. `apps/reference-app/` is outside IB2's authorised scope and S06's folders; register row "Angular default favicon" keeps it "internal use only; replace … before any external release" |
| Fonts | None shipped: `--paep-font-family-sans` / `-mono` are system stacks; no `@font-face`, `.woff`/`.woff2`/`.ttf`/`.otf`, Google Fonts or font CDN anywhere in `apps/` or `packages/` (grep); manifest `fonts: none (system font stack)` |
| Images | Only `apps/ui-lab/public/favicon.svg` and `apps/reference-app/public/favicon.ico` exist as image files in `apps/` and `packages/` |
| CDN / external URLs | No `cdn.`, `unpkg`, `jsdelivr` or `cdnjs` reference. `http(s)://` occurrences in `apps/` and `packages/`: the SVG namespace `http://www.w3.org/2000/svg` in `favicon.svg`; two `https://records.example.org/…` strings shown as long sample text on `/proofs/long-content` (`proofs.ts` l.178, l.206; reserved example domain, not fetched or linked); documentation URLs in the comments of the two `tsconfig.app.json` files; IB1 runtime-config schema id and example-endpoint strings in `packages/platform` and `apps/reference-app/public/config/` (not IB2) |
| Third-party design dependencies | manifest `thirdPartyDependencies: []` |

## 5. Provenance register rows (`docs/provenance/PROVENANCE-REGISTER.md`)

| Row | Status as recorded |
| --- | --- |
| "PAEP design foundations and components (IB2)" | Approved 2026-09-27, PO/SA (design approval); evidence cited: `design-export/provenance.md` and `evidence/IB2-FOUNDATION-COMPONENTS/reports/clean-room-provenance.md` (this report) |
| "UI laboratory favicon (IB2)" | Proposed (IB2), pending PO/SA acceptance |
| "Test tooling (IB2)", "axe-core (IB2)" | Approved 2026-09-27, PO/SA (see `dependency-review.md`) |
| "Angular default favicon" | Proposed (IB0-WP02), pending human approval (reference-app) |

## 6. Discrepancies

| # | Finding | Status |
| --- | --- | --- |
| CR-1 | The register's IB2 design row cited `reports/clean-room.md`, which did not exist. | **Resolved**: the row now cites `reports/clean-room-provenance.md` |
| CR-2 | AC15 says "the Angular favicon is replaced". That holds for `apps/ui-lab`; `apps/reference-app/public/favicon.ico` remains. | Open, Low: the reference app is outside the IB2 scope; the IB0-WP02 register row keeps it internal-only |
| CR-3 | Several approved-bundle files carry pre-approval status text: `design-brief.md` ("READY_FOR_FINAL_PO_SA_APPROVAL … Not approved for implementation"), `provenance.md` header and §4 ("CANDIDATE, requires PO/SA approval"), `design-review-report.md` ("READY FOR FINAL PO/SA APPROVAL"). The manifest and `approvals.md` record APPROVED_FOR_IMPLEMENTATION. | Open, Low: kept as the history of the approved bundle; the files are pinned (S01), and changing them would need a version increment or deviation record (DCH §9.2(iii)) |
