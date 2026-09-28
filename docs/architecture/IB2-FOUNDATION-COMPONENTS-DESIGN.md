# IB2 Design Foundations, Core Components and UI Laboratory — Implementation Design

**Work package:** `IB2-FOUNDATION-COMPONENTS` (registry generation 4, CANDIDATE)  
**Design source:** HOF-IB2-001 v1.1, APPROVED_FOR_IMPLEMENTATION (PO/SA, 2026-09-27), retained in `evidence/design-handoff/HOF-IB2-001/`  
**Controlling text:** PAEP-IR-01 §6 (IB2-WP1..WP6), PAEP-IB-01 §23, PAEP-EQP-01 §29.3, PAEP-DCH-01

## 1. Packages and dependency direction

| Package / app | Layer | May import | Delivers |
| --- | --- | --- | --- |
| `@proseit/paep-foundation` | L0 | `@angular/core` only | Token stylesheet and typed catalogue, brand-profile validator, colour maths, breakpoints, PAEP icons (`svg[paepIcon]`), live-region announcer |
| `@proseit/paep-components` | L2 | Angular (`core`, `common`, `forms`, `router`, `platform-browser`) and `@proseit/paep-foundation` | The 25 components of IR-01 §6.4 and the message catalogue |
| `apps/ui-lab` | app | every package through its public entry point | The permanent UI laboratory |

Enforced by `qa:architecture` (TypeScript graph, unchanged) and `qa:design-system` S05 (the stricter IB2 rules the architecture checker does not apply: test-tooling imports, later-milestone imports, template-literal dynamic imports (computed dynamic-import specifiers are rejected), and CSS `@import`, where only the UI laboratory may import the foundation stylesheet `@proseit/paep-foundation/src/styles/paep-foundation.css`). No package imports a later-milestone package (enterprise, Frappe SDK, offline, analytics, domain kits).

## 2. Tokens

* **Single source.** `tooling/design-system/generate-tokens.mjs` renders `packages/foundation/src/styles/paep-tokens.css` and `packages/foundation/src/lib/tokens/token-catalogue.generated.ts` from the approved `token-values.candidate.json` in the handoff evidence. `qa:design-system` S02 fails on any hand edit or drift.
* **Layers.** Reference (`--paep-ref-*`, foundation-internal), semantic (`--paep-color-*`, typography, space, radius, size, elevation, motion, focus, layout, density), derived (`--paep-color-selected-*`, `--paep-color-link`, computed from the brand) and brand (`--paep-brand-*`, seven keys, the only overridable group). Every token has `since: 1.0.0`; the catalogue carries protected and overridable flags.
* **Density** is a subtree attribute (`data-paep-density="compact"`), comfortable by default; compact restores 40 px controls under `pointer: coarse`.
* **Reduced motion.** Under `prefers-reduced-motion: reduce` (or the lab's `data-paep-motion="reduce"` simulation) every duration token is `0ms`, `--paep-motion-loop-state` is `paused` and the base stylesheet stops all animation.
* **Breakpoints** are em-based (37.5/64/90 em) so they follow zoom; component adaptation uses container queries at the handoff thresholds (30, 36, 40, 60 rem).
* **Protected tokens.** `applyBrandProfile()` validates first (rules 1–7 of token-values §1.6: key allowlist, four contrast rules, white-on-gold prohibition, error-hue separation) and applies nothing when a rule fails. The browser gate B1 proves that the synthetic petrol profile leaves every protected token at its approved value.

## 3. Components

Components are standalone, `OnPush`, signal-based (`input`, `output`, `model`, `computed`) and enhance native elements where the specification says so (`button[paepButton]`, `input[paepInput]`, `select[paepSelect]`, `input[type=checkbox][paepCheckbox]`, `hr[paepDivider]`, native `<dialog>` with `showModal()`, the `popover` attribute), so native semantics, form participation and keyboard behaviour are kept. Styling uses only `var(--paep-*)` tokens and logical properties (S04). User-facing strings come from `PAEP_MESSAGES` (the 48 approved content keys, English defaults, replaceable with `providePaepMessages()`), formatted with `paepFormat()` (placeholders, ICU plurals, `Intl` numbers); product nouns are parameters. The public API is the list exported by `packages/components/src/index.ts`; `evidence/IB2-FOUNDATION-COMPONENTS/reports/component-api.md` records every selector, input and output.

Excluded by the handoff's component map and not built: toast, tooltip, general menu, toggle, date/time, autocomplete, multi-select, row selection/sort/filter UI.

## 4. UI laboratory

Contents list (inline start from 64 em, a Contents disclosure below), lab-wide settings (density, direction, brand profile, reduced-motion simulation) applied through root attributes and mirrored in the URL, a home page, the token catalogue, eight foundation pages, one specimen page per component (IR-01 Code Block 8: purpose, examples, variants and states, keyboard, accessibility, responsive, RTL, content keys, evidence) and proof pages (responsive/320, long content, RTL, brand override, table strategies). It is not an application shell: the enterprise shell is IB3. Focus moves to the page heading after each navigation.

## 5. Quality gates

| Command | CI job | What it proves |
| --- | --- | --- |
| `npm run test:components` | `PAEP / components` | Foundation and component behaviour in real Chrome (Angular `@angular/build:unit-test`, Vitest browser mode): keyboard, focus entry/trap/restore, states, events, ARIA, error association, responsive container behaviour |
| `npm run qa:design-system` (+ `:negative`) | `PAEP / components` | S01–S10: approved handoff (manifest hash and every retained handoff file pinned), token drift and breakpoints, 25-component census and exports, token-only logical CSS (every `styles` element in any quote style, host and template `[style.x]` bindings and `.style` assignments in code, with unchecked style channels banned; reference tokens only where the handoff names them), import boundaries, clean-room terms, lab coverage, content keys, test hygiene, click handlers only on interactive elements, every applicable handoff state documented in the lab; 46 negative cases and a positive control |
| `npm run qa:accessibility` (+ `:negative`) | `PAEP / accessibility` | Every lab page at 1440/834/320 px in LTR and RTL: axe-core WCAG 2.0/2.1/2.2 A+AA zero violations, no page overflow, no console error, one h1 and main; reduced motion, density, computed token conformance, brand isolation, focus ring, every overlay opened, audited and dismissed with focus returned to its trigger (O1), status never by colour alone (U1), and no keyboard trap on any component page (K1); 15 negative cases and a positive control |

The browser is the runner's installed Chrome (`CHROME_BIN`, `tooling/design-system/browser.mjs`); nothing is downloaded. The new jobs run in parallel and feed `PAEP / gate`; `PAEP / negative-ci` is unchanged (RR14).

## 6. Test runner configuration

`angular.json` gains only a `test` target on `ui-lab` (`@angular/build:unit-test`, runner `vitest`, `browsers: ["chromiumHeadless"]`, includes the foundation and component specs) and `apps/ui-lab/tsconfig.spec.json`. No `vitest.config.*` exists (W07). The WP03 V06 finding this causes is bounded in the WP05 regression to exactly that target.

## 7. Known limits (see the residual-risk report)

Automated checks run in Chromium only; Firefox and Safari are not installed in CI (IB2-WP6 records representative Chromium device profiles). Visual captures are CANDIDATE evidence, not approved baselines. Screen-reader output is verified through the accessibility tree, roles and live regions, not with a physical screen reader.
