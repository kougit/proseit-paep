# IB1-CONTRACTS-CONFIG — Pre-flight

Run 2026-09-26 on a fresh clone of `origin/main` before any IB1 change. Node 24.21.0, npm 11.19.0. Logs: `../logs/preflight/`.

| # | Check | Result |
| --- | --- | --- |
| (i) | Local start equals latest `origin/main` | PASS: `035593b64ae15860d953a84325dceacb0d642014`, tree `ce4623980848db8faa0f45dd08cbf8a77382f4af` |
| (ii) | IB1-PREFLIGHT-R7 merged and closed; generation 2 promoted | PASS: PR #6 merged (`e795868`), PR #7 merged (`035593b`) |
| (iii) | Registry: active generation 2 ACCEPTED, no candidate | PASS: `qa:baseline` 13/13 "active G2 e795868; candidate none" |
| (iv) | Main CI green | PASS: push run 36245405570 success (`PAEP / gate`) |
| (v) | IB0-WP05 full verification | PASS 25/25 (`qa-ib0-wp05.log`) |
| (vi) | IB0-WP05 negative CI-control suite | PASS 87/87 (`qa-ib0-wp05-negative.log`) |
| (vii) | Baseline-governance tests | PASS 105/105 (`qa-baseline-negative.log`) |
| (viii) | Architecture check | PASS: 20 projects, 0 edges, 0 violations |
| (ix) | Strict typecheck | PASS (`qa-types.log`, no output) |
| (x) | Reference-app and ui-lab production builds | PASS |
| (xi) | Clean `npm ci`; lockfile unchanged | PASS: sha256 `be1154cb…6b69` |
| (xii) | No Nx | PASS (W04) |
| (xiii) | Controlled sources unchanged | PASS (W02, 13/13) |
| (xiv) | `packages/contracts` and `packages/platform` are IB0 placeholders; `config/` has no schema | PASS (W05) |
| (xv) | No open IB1 PR, no IB2 work | PASS |
| (xvi) | Controlled documents reconciled (analysis threads A–H) | PASS: no material conflict; decisions recorded in `docs/architecture/IB1-CONTRACTS-CONFIG-DESIGN.md` §4 |

Note: `npm run -s qa:ib0-wp05:negative` reports 84/87 because `-s` silences the npm error text that cases L01, T05 and T06 match. Run without `-s` (as CI does) it reports 87/87.

Outcome: no blocking condition; IB1 implementation started.
