# IB0-WP02 Quality Gate Runbook

Run these gates from the repository root of a **fresh `git clone`** of the commit under test, on the pinned toolchain. Capture stdout and stderr into the named evidence files, and end each log with its exit code. Every log header records the date, `node --version`, `npm --version` and `git rev-parse HEAD`.

## Gate sequence

(i) Toolchain conformance

```text
node --version      # must equal .nvmrc
npm --version       # must equal packageManager / devEngines.packageManager
```

Evidence: `evidence/IB0-WP02/logs/toolchain-versions.log`

(ii) Clean-install gate

```text
npm ci
```

Evidence: `evidence/IB0-WP02/logs/npm-ci.log`. It must show exit 0 and no "not yet covered by allowScripts" warning.

(iii) Lockfile-unchanged gate

```text
git diff --exit-code -- package.json package-lock.json
```

Evidence: `evidence/IB0-WP02/logs/lockfile-unchanged.log` (exit 0)

(iv) Install-script coverage

```text
npm install-scripts ls
```

Evidence: `evidence/IB0-WP02/logs/install-scripts-ls.log`. It must report no uncovered package.

(v) Build gates

```text
npm run build:reference-app
npm run build:ui-lab
npx ng version
```

Evidence: `logs/build-reference-app.log`, `logs/build-ui-lab.log`, `logs/ng-version.log`

(vi) WP02 verifier

```text
node tooling/verification/verify-ib0-wp02.mjs
```

Evidence: `reports/ib0-wp02-verification.json`, `logs/verify-ib0-wp02.log`

(vii) IB0-WP01 regression (evidence-preserving)

```text
node tooling/verification/verify-ib0-wp01.mjs > <wp02-evidence>/logs/verify-ib0-wp01-regression.log 2>&1
cp evidence/IB0-WP01/reports/ib0-wp01-verification.json evidence/IB0-WP02/logs/ib0-wp01-verification.regression.json
git checkout -- evidence/IB0-WP01/reports/ib0-wp01-verification.json
git diff --exit-code b6b023f -- work-packages/IB0-WP01 evidence/IB0-WP01
```

The IB0-WP01 verifier rewrites its tracked JSON. The accepted IB0-WP01 evidence shall not be modified by WP02.

(viii) Controlled-source integrity

```text
git diff --stat 8259317 HEAD -- .paep-control .gitignore   # must be empty
```

The SHA-256 comparison against `PACK_MANIFEST.json` is performed by verify-ib0-wp02. Do **not** use `validate-pack.mjs` as a gate: it fails by design on the 9 templates that IB0-WP01 populated.

Evidence: `logs/controlled-source-integrity.log`

## Negative checks (scratch copy only; never commit the mutation)

(i) Node pin: in a copy of the clone, run `npm ci` with a non-pinned Node (for example Node 22.x). Expected: non-zero exit with `EBADDEVENGINES` (or `EBADENGINE`). Evidence: `logs/negative-node-version.log`.

(ii) Lockfile drift: in a copy, change one direct dependency version in `package.json` without updating the lockfile, then run `npm ci`. Expected: non-zero exit ("package.json and package-lock.json ... are not in sync"). Evidence: `logs/negative-lockfile-drift.log`.

## Bash evidence example

```bash
{ echo "# date: $(date -u +%FT%TZ) node: $(node -v) npm: $(npm -v) commit: $(git rev-parse HEAD)"; npm ci; echo "EXIT_CODE=$?"; } > evidence/IB0-WP02/logs/npm-ci.log 2>&1
```

## Windows PowerShell evidence example

```powershell
npm ci *>&1 | Tee-Object -FilePath evidence/IB0-WP02/logs/npm-ci.log; "EXIT_CODE=$LASTEXITCODE" | Add-Content evidence/IB0-WP02/logs/npm-ci.log
```

## Failure rule

Any non-zero exit on a positive gate, or a zero exit on a negative check, is a technical FAIL. Diagnose and repair the cause, rerun the failed gate, and rerun the affected downstream gates. Do not replace a failed command with a weaker command. Do not bypass the pin with `--force`, `--engine-strict=false`, `--dangerously-allow-all-scripts` or `--ignore-scripts` to obtain PASS.
