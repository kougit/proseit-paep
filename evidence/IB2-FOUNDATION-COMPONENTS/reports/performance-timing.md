# IB2-FOUNDATION-COMPONENTS — Performance and Timing

Status: PENDING the GitHub Actions job durations (completed after CI on the pull request head).

## Local full verification (`logs/verification-6dc71cc/summary.txt`)

Fresh clone of `6dc71cc`, clean `npm ci`, Node 24.21.0, npm 11.19.0, one container running other work at the same time (durations are indicative only).

| Suite | Duration |
| --- | --- |
| `npm ci` | 7 s |
| `test:components` (254 tests) | 20 s |
| `qa:design-system` / `:negative` (47 cases) | 0 s / 2 s |
| `build:ui-lab` | 7 s |
| `qa:accessibility` (240 page audits + 8 global checks) | 152 s |
| `qa:accessibility:negative` (16 cases) | 26 s |
| `qa:ib2:ci-negative` (16 cases) | 198 s |
| `qa:ib0-wp05` full | 273 s |
| `qa:ib0-wp05:negative` (100 cases; the `PAEP / negative-ci` workload, unchanged by IB2) | 947 s |
