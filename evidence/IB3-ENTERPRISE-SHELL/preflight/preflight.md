# IB3-ENTERPRISE-SHELL pre-flight (authorising instruction §4)

Date: 2026-10-06. Result: **PASS**, no baseline drift.

| # | Check | Result |
| --- | --- | --- |
| i | `origin/main` | `929387b4dc33c1ee66fad3a54a4366f871ad5a47` (merge of PR #11, generation 4 promotion) |
| ii | Active accepted baseline | Generation 4 ACCEPTED at `81c223c84c98d6bae80dd45044489e777931049b`, tree `10de9789c39a0930142bf3f065902c0c6100f9c4` |
| iii | Active candidate before this work | NONE |
| iv | `npm run qa:baseline` on `929387b` | PASS 13/13 |
| v | Main CI | run 36635182687 on `929387b`: all mandatory jobs and `PAEP / gate` success |
| vi | Working tree | clean before work began |
| vii | `package-lock.json` | SHA-256 `fc31123bea83fa64273b34af32248707430650998bce6ad1b0057de06adfa600`, unchanged |
| viii | Nx | not installed, no Nx configuration |
| ix | Toolchain | Node 24.21.0; Angular 22.1.8; TypeScript 6.0.x (as accepted in generation 4) |
| x | `packages/enterprise` | placeholder entry point only (`export {};`) |
| xi | HOF-IB3-001 | APPROVED_FOR_IMPLEMENTATION; manifest `645dd2e9bb4274c9b787bbbcc52cf53eb4f08dc21d733b5985aa3ab572f4fce5`, 577/577 hashes PASS, no unmanifested or missing file; earlier manifests `7cc8…` and `b2056…` retained in its history |
| xii | Open findings | HIGH 0, MEDIUM 0 |

After generation 5 was recorded: `qa:baseline` PASS 13/13, "candidate G5 IB3-ENTERPRISE-SHELL (NOT ACCEPTED)", every changed path inside the G5 scope.
