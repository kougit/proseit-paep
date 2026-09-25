# IB0-WP05 Definition Audit

**Date:** 2026-09-24 · **Auditor:** Claude Code (drafting agent; not an approver) · **Baseline:** `c5c0eb0`

The controlled pack contains no IB0-WP05 definition. `work-packages/IB0-WP05/` was created from the controlled sources and the PO/SA brief. Each criterion traces to (a) a controlled requirement, (b) an accepted WP01–WP04 deferral, or (c) a control WP05 needs to verify itself.

| Criterion | Basis | Type |
| --- | --- | --- |
| AC01 plan first | EQP §11; CLAUDE.md discipline 2 | (a) |
| AC02 triggers | IR-01 §4.4 IB0-WP5 (CI); PO/SA brief §7, §11 | (a) + brief |
| AC03 concurrency | PO/SA brief §7, §5H | brief |
| AC04 parallel jobs | IR-01 §4.5 (each gate); brief §16 | (a) + brief |
| AC05 aggregate gate | brief §15, §17 | (c) |
| AC06 toolchain | IB-01 §4.1; WP02 pins (deferred "CI" to WP05) | (a) + (b) |
| AC07 deterministic install | IB-01 §4.1 "CI uses npm ci; lockfile drift is release-blocking"; IR-01 App. A(i) | (a) |
| AC08 cache | brief §9 | (c) |
| AC09 builds | IR-01 §4.5 Build | (a) |
| AC10 architecture | IR-01 §4.3, §4.5; EQP §16 | (a) |
| AC11 type-check | IR-01 §4.4 "type-check", §4.5 Type safety; EQP §15 `qa:types` | (a) |
| AC12 negative suites | IR-01 §4.6(iii); App. A(ii) | (a) |
| AC13 regression | IR-01 §4.6; WP03/WP04 bounded-exception decisions | (a) + (b) |
| AC14 governance | CLAUDE.md; EQP §22; IR-01 §4.2 | (a) |
| AC15 no dependency change | EQP §22(iii); brief §14(xiv) | (a) |
| AC16 security/provenance | EQP §22; IB-01 §18.1; WP02 deferred `npm audit signatures` to WP05 | (a) + (b) |
| AC17 permissions | brief §11 | brief |
| AC18 secrets/injection | brief §11; EQP §17(ii) | (a) + brief |
| AC19 action provenance | EQP §22(iii) (every new dependency recorded); brief §12 | (a) |
| AC20 evidence artifacts | IR-01 §4.6(iv) "retains build/test evidence"; §7.2(i) | (a) |
| AC21 negative CI tests | brief §17 | (c) |
| AC22 real run | IR-01 §4.4 IB0-WP5 required evidence | (a) |
| AC23 real failure propagation | brief §21 QA lanes 4–5 | (c) |
| AC24 enforcement design | brief §5G, §22 | brief |
| AC25 lint/unit disposition | IR-01 §4.4 IB0-WP5; EQP §29.1(iii), (vi); WP03 PO/SA lint deferral | (a) + (b) |
| AC26 independent QA | EQP §5; brief §21 | (a) |
| AC27 evidence/traceability | EQP §24, §25, §32 | (a) |

## Conflicts and gaps found

1. **Lint and unit-test stages (IR-01 §4.4) vs. no tooling and the WP03 lint deferral.** Not an architecture conflict: the PO/SA already deferred lint/format to an owning work package with dependency and licence review, and no unit-test runner exists. Adding ESLint or Vitest would add dependencies the brief says not to add without need. Default taken: DEFERRED; decision card posted to the PO/SA; recorded as AC25 and as an open IB0 exit item (IR-01 §4.6(ii) and EQP §29.1(vi) still require lint before IB0 exit).
2. **Branch protection and rulesets unavailable** on the current GitHub plan for this private repository (API 403). Enforcement is prepared, not applied (AC24).
3. **Older verifiers flag WP05 by design** (WP04 V16/V17/V22/V23, WP04 negative C3, WP03 negative crash). Handled by bounded re-evaluation in `verify-ib0-wp05.mjs`, not by editing them (WORK_PACKAGE §6).

No material architecture or governance conflict requires BLOCKED.

## Excluded

SBOM, vulnerability-scan gating, release licence approval (release gate), macOS/Windows runners, CODEOWNERS (no second reviewer exists), Nx, IB1.
