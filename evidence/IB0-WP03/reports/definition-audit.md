# IB0-WP03 Definition Audit (Lane A, consolidated with Lanes B–D)

**Date:** 2026-09-24. **Baseline:** `main` at `de13629` (IB0-WP02 merge). **Method:** read-only review of the controlled sources in priority order, the IB0-WP01/WP02 acceptance records, and the repository. **Result: PASS** — every WP03 criterion traces to a controlled requirement; none pulls in WP04, WP05 or IB1+ scope; no architecture conflict. Two ambiguities and one scope fork were resolved by recorded defaults (§4).

Line references (`IR l.249`) are to `.paep-control/text/*.md`.

## 1. Controlled requirements attributable to IB0-WP03

| Req | Controlled text | Source |
| --- | --- | --- |
| R-STRICT | "\| TypeScript \| 6.0.x for Angular 22 compatibility. \| strict=true; strictTemplates=true; no implicit any; production build treats type errors as failures. \|" | IB-01 §4.1 (IB l.259) |
| R-STRICT | "\| IB0-WP3 \| Configure strict TypeScript/template settings and package path aliases/public entry points. \| Compiler configuration; package API checks. \|" | IR-01 §4.4 (IR l.249) |
| R-STRICT | "\| Type safety \| Strict TypeScript and strict Angular template checks pass. \|" | IR-01 §4.5 (IR l.267) |
| R-STRICT | "Production builds shall use AOT compilation, strict TypeScript/template checking and approved lint/static-analysis rules." | PAEP v1.1 §5.4 (l.439); App. G "Compilation" row (l.1592) |
| R-STRICT | "(iii) strict type checking and compilation pass"; "\| qa:types \| Strict TS/template checking \|" | EQP §13, §15 (l.546, l.610) |
| R-DEFER | "Explicit `strict: true` and `strictTemplates: true` \| IB0-WP03" | IB0-WP01 ACCEPTANCE_REPORT deferred actions (accepted by PO/SA) |
| R-NOWEAKEN | "(vi) suppressing TypeScript, Angular, accessibility, security or lint errors without approved rationale" (prohibited); "NO TEST LAUNDERING ... suppressing compiler diagnostics ..." | EQP §8.2(vi) (l.410), §23 (l.794) |
| R-ALIAS | "(iv) Cross-package imports shall use public entry points." | IR-01 §4.3(iv) |
| R-ALIAS | "(ii) packages/*. Expose versioned public APIs ... consuming packages import only the package entry point"; "(ii) ... Shared code is consumed only from public entry points." | IB-01 §5.2(ii), §6.2(ii) |
| R-ALIAS | "(v) Require public package entry points and prohibit consumers from importing implementation-private paths." | EQP §16(v) |
| R-API | IB0-WP3 required evidence "package API checks"; IB0 gate "Public API discipline" | IR-01 §4.4, §4.5 |
| R-BASE | Clean install, build, reproducibility gates; pinned toolchain; lockfile | IR-01 §4.5; IB-01 §4.1–4.2; IB0-WP01/WP02 acceptance |
| R-SCOPE | IB0-WP4 "architecture tags/boundaries, circular-dependency detection and deep-import restrictions"; IB0-WP5 CI; IB0–IB2 non-goals | IR-01 §4.4, §2.3; CLAUDE.md; PO/SA instruction |
| R-EVID | Objective evidence; acceptance report fields; status vocabulary | SOURCE_OF_TRUTH (vi); EQP §24, §32, App. C |

## 2. Criterion trace

| Criterion | Traces to | WP03? |
| --- | --- | --- |
| AC01 plan before change | EQP §11–§12 (definition of ready); CLAUDE.md execution discipline 1–2 | Y |
| AC02 explicit `strict`, `noImplicitAny` | R-STRICT (IB-01 §4.1 "strict=true", "no implicit any"); R-DEFER | Y |
| AC03 explicit `strictTemplates` | R-STRICT (IB-01 §4.1 "strictTemplates=true"); R-DEFER | Y |
| AC04 effective strictness, nothing turned off | R-STRICT; the PO/SA requirement that the configuration be "unambiguous when inspected by a future developer or automated verifier" | Y |
| AC05 no weakening, AOT kept | R-NOWEAKEN; PAEP v1.1 §5.4 AOT; PO/SA "Do not weaken any existing compiler option" | Y |
| AC06 no suppression directives | R-NOWEAKEN (EQP §8.2(vi)) | Y |
| AC07 path aliases | R-ALIAS (IR-01 IB0-WP3 "package path aliases") | Y |
| AC08 entry points + package API check | R-ALIAS; R-API | Y |
| AC09 TS negative test | R-STRICT "production build treats type errors as failures"; PO/SA gate (vi) | Y |
| AC10 template negative test | R-STRICT; PO/SA gate (vii) | Y |
| AC11 verifier detects weakening | R-STRICT; PO/SA gate (viii) | Y |
| AC12–AC14 clean install, builds | R-BASE (IR-01 §4.5) | Y (regression) |
| AC15 lockfile | R-BASE (IB-01 §4.1 lockfile drift release-blocking); PO/SA gate (xii) | Y (guard) |
| AC16 no Nx | PO/SA decision (plain Angular CLI, no Nx); PO/SA gate (xiii) | Y (guard) |
| AC17 no WP04/WP05/IB1+ | R-SCOPE; PO/SA gates (xv), (xvi) | Y (guard) |
| AC18 controlled integrity | CLAUDE.md; SOURCE_OF_TRUTH; PO/SA gate (xiv) | Y (guard) |
| AC19 no secrets | CLAUDE.md mandatory rules; EQP §8.2(iv) | Y (guard) |
| AC20 verifier | R-API; PO/SA gate (ix) | Y |
| AC21 WP02 regression | R-BASE; PO/SA gate (x) | Y (regression) |
| AC22 WP01 regression | R-BASE; PO/SA gate (xi) | Y (regression) |
| AC23–AC24 evidence, traceability | R-EVID | Y |

## 3. Scope analysis

(i) **WP04 not pulled forward.** No criterion adds Nx, `nx.json`, `project.json`, a project graph, architecture tags, dependency-direction rules, cycle detection or deep-import *enforcement* on consumers. AC07 forbids declaring deep aliases (the *configuration* half of IR-01 IB0-WP3); stopping consumers from writing deep relative imports stays with IB0-WP04 ("deep-import restrictions").

(ii) **WP05 not pulled forward.** No CI workflow, test runner or `qa:*` CI stage. The two added npm scripts run the WP03 verifier and negative runner only, following the WP01/WP02 `qa:ib0-wpNN` pattern.

(iii) **IB1+ not pulled forward.** Entry points contain `export {};` only; no contract, type, component or behaviour. AC08 checks this.

(iv) **Repository check (Lane D).** At `de13629`: no `nx.json`, `project.json`, `tsconfig.base.json`, lint/format/test config or `.github/`; 0 Nx entries in the lockfile; `tooling/architecture-boundaries/` holds only its README; WP01 verifier 15/15 and WP02 verifier 20/20 (when WP02 runs before WP01, see §5(ii)).

## 4. Conflicts, ambiguities and forks

(i) **No material architecture conflict.** The controlled sources agree that IB0 makes strict type and template checking explicit and gates it.

(ii) **Ambiguity: `tsconfig.base.json` owner.** IR-01 §4.2 shows the file in the target tree without assigning it. The accepted IB0-WP01 acceptance report assigns it (with `nx.json`) to IB0-WP04; the accepted IB0-WP02 ownership table lists it under IB0-WP03. Default: defer to IB0-WP04 with the project graph. It does not affect the strictness controls, which sit in the Angular CLI root `tsconfig.json` that both apps extend.

(iii) **Fork: lint and format tooling.** EQP §29.1(iii) puts "strict TypeScript/template checks, formatting and linting" in IB0, and the IB0-WP02 ownership table names WP03. IR-01's IB0-WP3 row does not mention lint; its IB0-WP5 row expects a lint stage in CI. Adding ESLint/Prettier needs new third-party dependencies, a lockfile change and a licence decision by the Engineering Governance / IP owner. Default: defer and keep the lockfile unchanged; a PO/SA decision was requested on 2026-09-24. Lint/format remains an open IB0 item either way.

(iv) **Fork: IB0-WP02 regression.** WP02 check V17 guards WP02's own change window and flags any change to `tsconfig.json` or `packages/**`, so no later work package can make it pass unchanged. Default: leave the accepted WP02 verifier untouched and require V17's only finding to be WP03-permitted paths (AC21). A PO/SA decision was requested on 2026-09-24.

## 5. Other findings

(i) Setting the flags explicitly does not change the build: both production outputs are byte-identical to the `de13629` build (`logs/build-output-vs-baseline.log`), because the defaults were already on.

(ii) Run order matters for regression. The WP01 verifier rewrites `evidence/IB0-WP01/reports/ib0-wp01-verification.json`, which WP02's V17 then reports as a protected-path change. The WP03 verifier therefore runs WP02 before WP01 and restores each verifier's rewritten evidence after it.

(iii) TypeScript 6.0 deprecates `baseUrl`; `paths` resolve relative to the tsconfig, so no `baseUrl` was added.
