# IB2-FOUNDATION-COMPONENTS — Pre-flight (IB2-AC01)

Run on `origin/main` `d33ab919f3f23d6a198db01db478ed60e7cf2fbc` (tree `791541bfc8ed7fb7feea24a7e380eba02ee8c951`) on 2026-09-26, before any IB2 change, with Node 24.21.0 and npm 11.19.0. Raw output: `../logs/preflight/`.

| # | Check | Result | Evidence |
| --- | --- | --- | --- |
| 1 | Generation 3 ACCEPTED and active | PASS: `qa:baseline` 13/13, "active G3 b6ae842…; candidate none" | `qa-baseline.log` |
| 2 | No CANDIDATE generation | PASS | `qa-baseline.log` |
| 3 | IB1 CLOSED | PASS: G3 = IB1-CONTRACTS-CONFIG ACCEPTED in the registry | registry |
| 4 | Main `PAEP / gate` green | PASS: run 36265678233 on `d33ab91`, success | GitHub Actions |
| 5 | Registry valid, governance negatives | PASS: B01–B13; 105/105 negatives | `qa-baseline.log`, `qa-baseline-negative.log` |
| 6 | Controlled sources intact | PASS: B10 immutable paths unchanged | `qa-baseline.log` |
| 7 | Lockfile equals the accepted fingerprint | PASS: blob `9e38a0292e13e15a57d873992ba3921d0e1d8b85`; clean `npm ci` | registry G3 fingerprints |
| 8 | CLAUDE.md governed and unchanged | PASS: blob `904ef5251fb50305f070d01c41d5458f12036a8b` | registry G3 fingerprints |
| 9 | Pins | PASS: Node 24.21.0 / npm 11.19.0 (devEngines), Angular 22.1.8, TypeScript 6.0.3 | `qa-ib0-wp05.log` W01 |
| 10 | No Nx | PASS | `qa-ib0-wp05.log` W04 |
| 11 | IB1 contracts green | PASS: 148/148 | `qa-ib1.log` |
| 12 | IB1 runtime configuration green | PASS: 24/24 + 187 tests; mutations 40/40; portability 17/17 | `qa-ib1.log`, `qa-ib1-negative.log` |
| 13 | No shell or later-milestone leak | PASS: foundation, components and later packages were 3-file placeholders; ui-lab was the IB0 placeholder | `qa-ib0-wp05.log` W05 |
| 14 | Regressions | PASS: WP05 25/25 (WP01–WP04 through W-checks), architecture, `qa:types`, both production builds | `qa-ib0-wp05.log`, `qa-architecture.log`, `qa-types.log`, `build-*.log` |
| 15 | Clean tree | PASS: `git status` empty | — |

Design gate (DCH-01): the first pass on 2026-09-26 stopped at **IB2 STATUS: DESIGN HANDOFF REQUIRED** because no approved handoff existed. HOF-IB2-001 was produced, revised (v1.1 brand revision) and approved by the PO/SA on 2026-09-27 (APPROVED_FOR_IMPLEMENTATION); the PO/SA then approved the four test-tooling dev dependencies. Implementation started only after both approvals.

Controlled-source observations recorded at pre-flight (none a conflict stop): (1) primitive route: EQP §5.2(iv) and DCH §26 were both satisfied by putting primitive anatomy in HOF-IB2-001; (2) CLAUDE.md's priority list omits DCH while `.paep-control/SOURCE_OF_TRUTH.md` includes it, and the IB2 authorisation invokes DCH, so it was applied; (3) the DCH and EQP activation records are blank ("Review-ready") and were treated as controlled, as in every prior work package.
