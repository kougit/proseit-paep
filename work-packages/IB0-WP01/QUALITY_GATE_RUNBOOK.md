# IB0-WP01 Quality Gate Runbook

Run these gates from the repository root. Capture stdout/stderr into the named evidence files.

## Gate sequence

(i) Clean-install gate

```text
npm ci
```

Evidence: `evidence/IB0-WP01/logs/npm-ci.log`

(ii) Reference-application build gate

```text
npm run build:reference-app
```

Evidence: `evidence/IB0-WP01/logs/build-reference-app.log`

(iii) UI-laboratory build gate

```text
npm run build:ui-lab
```

Evidence: `evidence/IB0-WP01/logs/build-ui-lab.log`

(iv) Repository verifier

```text
node tooling/verification/verify-ib0-wp01.mjs
```

Evidence: `evidence/IB0-WP01/reports/ib0-wp01-verification.json`

## Windows PowerShell evidence examples

```powershell
npm ci *>&1 | Tee-Object -FilePath evidence/IB0-WP01/logs/npm-ci.log
npm run build:reference-app *>&1 | Tee-Object -FilePath evidence/IB0-WP01/logs/build-reference-app.log
npm run build:ui-lab *>&1 | Tee-Object -FilePath evidence/IB0-WP01/logs/build-ui-lab.log
node tooling/verification/verify-ib0-wp01.mjs
```

## Bash evidence examples

```bash
npm ci 2>&1 | tee evidence/IB0-WP01/logs/npm-ci.log
npm run build:reference-app 2>&1 | tee evidence/IB0-WP01/logs/build-reference-app.log
npm run build:ui-lab 2>&1 | tee evidence/IB0-WP01/logs/build-ui-lab.log
node tooling/verification/verify-ib0-wp01.mjs
```

## Failure rule

Any non-zero exit code is a technical FAIL. Diagnose and repair the cause, rerun the failed gate, and rerun affected downstream gates. Do not replace a failed command with a weaker command.
