# M1 local regression on 1b1e5a1 (one suite at a time)

```text
baseline exit=0 secs=1 :: PAEP baseline governance: PASS (13/13); active G5 10462434ebb9d9dc1dfe0a3e89fb4f754b4b4473; candidate G6 IB4-FRAPPE-ADAPTER (NOT ACCEPTED)
baseline-neg exit=0 secs=57 :: PAEP baseline-governance tests: PASS (105/105; 13 positive, 92 negative)
contracts exit=0 secs=20 :: PAEP contracts QA: PASS - 200/200 checks, 10 sections, 21 node:test tests, 128 public exports
arch exit=0 secs=1 :: PAEP architecture check: PASS — 20 projects, 20 edges (1 optional), 0 cycles, 980 imports in 234 files, 0 violations
frappe-unit exit=0 secs=5 :: PAEP Frappe adapter unit tests: PASS (71/71 node:test tests in 8 files; adapter compiled strictly with 0 diagnostics)
frappe-int exit=0 secs=2 :: PAEP Frappe adapter integration tests: PASS (39/39 node:test tests in 1 files; adapter compiled strictly with 0 diagnostics)
frappe-qa exit=0 secs=0 :: PAEP Frappe adapter static QA: PASS (9/9)
frappe-neg exit=0 secs=6 :: PAEP Frappe adapter static QA negatives: PASS (38/38; 37 seeded negatives + 1 control)
ent exit=0 secs=0 :: PAEP enterprise-shell QA: PASS (12/12)
ent-neg exit=0 secs=27 :: PAEP enterprise-shell QA negatives: PASS (63/63; 55 seeded negatives + 8 controls)
ds-ext-neg exit=0 secs=10 :: PAEP design-system IB3 extension negative suite: PASS (34/34)
shell-qa exit=0 secs=141 :: PAEP enterprise-shell browser QA: PASS (22/22; 140s)
shell-neg exit=0 secs=103 :: PAEP enterprise-shell browser QA negatives: PASS (57/57; 50 seeded negatives + 7 controls)
ib2ci exit=0 secs=511 :: PAEP IB2 CI-governance negative suite: PASS (27/27)
ib3ci exit=0 secs=891 :: PAEP IB3 CI-governance negative suite: PASS (20/20; 19 seeded negatives + 1 control)
ib4ci exit=0 secs=170 :: PAEP IB4 CI-governance negative suite: PASS (9/9; 8 seeded negatives + 1 control)
wp05a exit=0 secs=630 :: IB0-WP05 negative CI-control tests (part a): PASS (26/26; 2 controls, 24 negatives)
wp05b exit=0 secs=715 :: IB0-WP05 negative CI-control tests (part b): PASS (32/32; 4 controls, 28 negatives)
wp05c exit=0 secs=703 :: IB0-WP05 negative CI-control tests (part c): PASS (47/47; 4 controls, 43 negatives)
wp05 exit=0 secs=646 :: IB0-WP05 verification (full): PASS (25/25)
types :: npm run qa:types exit 0 (no diagnostics)
build ::                     | Initial total   | 520.16 kB |               122.55 kB
bundle :: PAEP reference-app bundle composition: PASS (7/7)
```

Working tree clean after the run (no line after ALLDONE). Logs: one file per suite in this folder.
