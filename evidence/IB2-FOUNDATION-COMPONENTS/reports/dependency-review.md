# IB2-FOUNDATION-COMPONENTS — Dependency Review (IB2-AC16)

Measured on the final code commit (`logs/verification-6dc71cc/`) on 2026-09-27 against `origin/main` `d33ab91` (generation 3 accepted baseline), by comparing `package.json` and the `packages` map of `package-lock.json` at both commits (throwaway script outside the repository). Node 24.21.0, npm 11.19.0. Status: PASS (technical) for the figures below; the dependency approval is the PO/SA's (2026-09-27, WORK_PACKAGE.md l.5).

## 1. Approved dependencies and pins

| Package | `package.json` `devDependencies` | Lockfile entry | Installed (`npm ls`) | Licence |
| --- | --- | --- | --- | --- |
| `vitest` | `4.1.11` (exact) | 4.1.11, `dev: true` | 4.1.11 | MIT |
| `@vitest/browser-playwright` | `4.1.11` (exact) | 4.1.11, `dev: true` | 4.1.11 | MIT |
| `playwright` | `1.63.0` (exact) | 1.63.0, `dev: true` | 1.63.0 | Apache-2.0 |
| `axe-core` | `4.13.0` (exact) | 4.13.0, `dev: true` | 4.13.0 | MPL-2.0 (review L5) |

`package.json` diff vs `d33ab91`: only these four `devDependencies` and seven IB2 `scripts` (`tokens:generate`, `test:components`, `qa:design-system`, `qa:design-system:negative`, `qa:accessibility`, `qa:accessibility:negative`, `qa:ib2:ci-negative`). `dependencies` and `allowScripts` unchanged. `npm ls --omit=dev --all` lists none of `axe-core`, `playwright`, `vitest` (0 matches). The pins are also recorded in `docs/architecture/toolchain-version-manifest.json` (`devDependencies`, and the `amendments` entry dated 2026-09-27).

## 2. Lockfile delta vs `d33ab91`

| Measure | Value |
| --- | --- |
| `packages` entries | 471 → 511 (+40, 0 removed; the only changed existing entry is the root `""`, whose `devDependencies` gain the four pins; root `dependencies` unchanged) |
| Third-party (`node_modules/…`, non-link) entries | 434 → 474 |
| New entries `dev: true` | 40 / 40 |
| New entries `optional` / `devOptional` | 0 / 0 |
| New entries with `hasInstallScript` | 0 |
| New entries resolved from `https://registry.npmjs.org/` | 40 / 40 |
| New entries with `sha512-` integrity | 40 / 40 |
| Lockfile sha256 (final code commit) | `fc31123bea83fa64273b34af32248707430650998bce6ad1b0057de06adfa600` (equals `toolchain-version-manifest.json` `lockfile.sha256`) |
| Lockfile sha256 at `d33ab91` | `be1154cb514cd0522d6b5f382b2451cf6b52a73c9b943b13daa0542578d46b69` |
| Licence totals after (third-party) | MIT 407, ISC 24, MPL-2.0 13, Apache-2.0 11, BSD-2-Clause 11, BSD-3-Clause 5, CC-BY-4.0 1, BlueOak-1.0.0 1, 0BSD 1 (matches licence review §8) |

Install-script control: `.npmrc` has `strict-allow-scripts=true` and `engine-strict=true`; `package.json` `allowScripts` (unchanged) denies `@parcel/watcher`, `esbuild`, `fsevents`, `lmdb`, `msgpackr-extract`. No new entry declares an install script. Browsers are not downloaded: `playwright install` is never run; the runner's Chrome is used (`CHROME_BIN`, `tooling/design-system/browser.mjs`).

### New entries by licence (40)

| Licence | Count |
| --- | --- |
| MIT | 35 |
| Apache-2.0 | 3 |
| ISC | 1 |
| MPL-2.0 | 1 |

| Lockfile path | Version | Licence |
| --- | --- | --- |
| `node_modules/expect-type` | 1.4.0 | Apache-2.0 |
| `node_modules/playwright` | 1.63.0 | Apache-2.0 |
| `node_modules/playwright-core` | 1.63.0 | Apache-2.0 |
| `node_modules/siginfo` | 2.0.0 | ISC |
| `node_modules/@blazediff/core` | 1.9.1 | MIT |
| `node_modules/@polka/url` | 1.0.0-next.29 | MIT |
| `node_modules/@types/chai` | 5.2.3 | MIT |
| `node_modules/@types/deep-eql` | 4.0.2 | MIT |
| `node_modules/@types/estree` | 1.0.9 | MIT |
| `node_modules/@vitest/browser` | 4.1.11 | MIT |
| `node_modules/@vitest/browser-playwright` | 4.1.11 | MIT |
| `node_modules/@vitest/browser/node_modules/magic-string` | 0.30.21 | MIT |
| `node_modules/@vitest/expect` | 4.1.11 | MIT |
| `node_modules/@vitest/mocker` | 4.1.11 | MIT |
| `node_modules/@vitest/mocker/node_modules/magic-string` | 0.30.21 | MIT |
| `node_modules/@vitest/pretty-format` | 4.1.11 | MIT |
| `node_modules/@vitest/runner` | 4.1.11 | MIT |
| `node_modules/@vitest/snapshot` | 4.1.11 | MIT |
| `node_modules/@vitest/snapshot/node_modules/magic-string` | 0.30.21 | MIT |
| `node_modules/@vitest/spy` | 4.1.11 | MIT |
| `node_modules/@vitest/utils` | 4.1.11 | MIT |
| `node_modules/@vitest/utils/node_modules/convert-source-map` | 2.0.0 | MIT |
| `node_modules/assertion-error` | 2.0.1 | MIT |
| `node_modules/chai` | 6.2.2 | MIT |
| `node_modules/es-module-lexer` | 2.3.2 | MIT |
| `node_modules/estree-walker` | 3.0.3 | MIT |
| `node_modules/pathe` | 2.0.3 | MIT |
| `node_modules/pngjs` | 7.0.0 | MIT |
| `node_modules/sirv` | 3.0.2 | MIT |
| `node_modules/stackback` | 0.0.2 | MIT |
| `node_modules/std-env` | 4.2.0 | MIT |
| `node_modules/tinybench` | 2.9.0 | MIT |
| `node_modules/tinyexec` | 1.3.1 | MIT |
| `node_modules/tinyrainbow` | 3.1.1 | MIT |
| `node_modules/totalist` | 3.0.1 | MIT |
| `node_modules/vitest` | 4.1.11 | MIT |
| `node_modules/vitest/node_modules/magic-string` | 0.30.21 | MIT |
| `node_modules/why-is-node-running` | 2.3.0 | MIT |
| `node_modules/ws` | 8.22.0 | MIT |
| `node_modules/axe-core` | 4.13.0 | MPL-2.0 |

## 3. npm audit

Not run for this report: `npm audit` queries the registry's advisory service over the network, so it is not an offline-safe read. Licence review §8 states "`npm audit` 0 vulnerabilities"; no audit log is retained under `evidence/IB2-FOUNDATION-COMPONENTS/logs/` at the time of writing (see §6).

## 4. Approved-delta control (WP05 W06 and the V13/V15 bounds)

`tooling/verification/verify-ib0-wp05.mjs`:

| Check | Rule (as coded) | Negatives (`qa:ib2:ci-negative`, `tooling/design-system/ci-governance-negative.mjs`) |
| --- | --- | --- |
| W06 | When `package-lock.json` differs from the accepted baseline, `approvedDependencyDelta()` must hold: `dependencies` equal to the baseline; `devDependencies` equal to the baseline plus exactly `IB2_APPROVED_DEV_DEPENDENCIES` (`@vitest/browser-playwright` 4.1.11, `axe-core` 4.13.0, `playwright` 1.63.0, `vitest` 4.1.11); lockfile root `dependencies`/`devDependencies` equal to `package.json`; every lockfile entry not in the baseline lockfile `dev: true` and not `optional`/`devOptional`. And the lockfile sha256 must equal `toolchain-version-manifest.json` `lockfile.sha256` | Covered through the V13 bound below, which calls the same `approvedDependencyDelta()` |
| WP02 V13 bound (in W22/W16) | The historical "lockfile differs from the IB0-WP01 baseline" finding is accepted only with the exact detail "working tree vs HEAD: clean; lockfile vs … different", no governance package problems, `package-lock.json` changed since the WP02 baseline, and `approvedDependencyDelta()` true | I10 (unapproved dev dependency `left-pad` added to `package.json` and the lockfile root → expects "FAIL W16" and "V13 outside the bound"); I11 (`axe-core` moved to runtime `dependencies`) |
| WP02 V15 bound | The MPL-2.0 finding is accepted only for `node_modules/axe-core` at dev scope with the `\| L5 \| axe-core \|` row present in the licence review | I06 (L5 row removed), I07 (a second MPL-2.0 package), I08 (`axe-core` moved out of dev scope) |

Bounds are described in `WORK_PACKAGE.md` §7. The negatives are cited from the case list in the file; they were not re-run for this report.

## 5. Licence records

| Record | Content |
| --- | --- |
| `docs/licences/THIRD-PARTY-LICENCE-REVIEW.md` §8 | IB2 amendment: trigger, delta (40 dev entries, registry + sha512, no install script), new totals, Apache-2.0 NOTICE note for `playwright`/`playwright-core`, row **L5** `axe-core` MPL-2.0 "APPROVED DEV DEPENDENCY" with conditions (no vendoring; never imported from `apps/` or `packages/`, enforced by S05; re-review on version change, runtime path or distribution) |
| `docs/licences/THIRD-PARTY-NOTICES.md` N3 | `axe-core` 4.13.0: MPL-2.0 notice text, upstream `https://github.com/dequelabs/axe-core` tag `v4.13.0`, registry artefact, use (injected unmodified into the locally served lab by `tooling/design-system/`), no current obligation while not distributed |
| `docs/provenance/PROVENANCE-REGISTER.md` | "Test tooling (IB2)" and "axe-core (IB2)" rows, both "Approved 2026-09-27, Product Owner / Solutions Architect" |

Use of `axe-core` in code: `tooling/design-system/browser-qa.mjs` adds `node_modules/axe-core/axe.min.js` as a script tag in the test browser; S05 fails any `axe-core`, `playwright` or `@vitest/browser-playwright` import from `apps/` or `packages/` (negative N17).

## 6. Observations

| # | Finding |
| --- | --- |
| DR-1 | The "`npm audit` 0 vulnerabilities" statement in licence review §8 has no retained log in the evidence set. Open, Low. |
| DR-2 | The provenance register counts "36 transitive dev entries" for the test tooling: 40 new entries − 4 direct = 36, of which `axe-core` has none, so the 36 belong to vitest/playwright. Consistent; no action. |
| DR-3 | No IB2 CI-governance case isolates W06's "lockfile sha256 equals the manifest" rule; I10 and I11 change the lockfile together with other fields, so they would fail on the delta rule in any case (inferred from the case list I01–I15; I12–I15 do not touch the lockfile). Open, Low. |
