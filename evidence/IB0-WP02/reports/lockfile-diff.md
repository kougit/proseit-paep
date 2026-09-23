# IB0-WP02 Lockfile Diff

Commit under test: `916cb9dde3b1502441c346c06e9aaba9ab097ea7`. Baseline: IB0-WP01 merge commit `b6b023f`.

| Check | Result | Evidence |
| --- | --- | --- |
| `git diff b6b023f 916cb9d -- package-lock.json` | Empty: the lockfile is byte-identical to the baseline | `logs/lockfile-unchanged.log`; verifier V13 |
| sha256 of `package-lock.json` before and after fresh-clone `npm ci` | `be1154cb514cd0522d6b5f382b2451cf6b52a73c9b943b13daa0542578d46b69` both times | `logs/lockfile-unchanged.log` |
| `npm install --package-lock-only` with the new `package.json` | Lockfile unchanged: `devEngines` and `allowScripts` are not recorded in the lockfile | `logs/lockfile-regenerate-check.log` |
| Third-party entries whose `version`, `resolved` or `integrity` changed | 0 | Lockfile unchanged |
| Lockfile integrity | lockfileVersion 3; 434 third-party entries, all from `https://registry.npmjs.org/` with sha512 integrity; 36 workspace entries | Verifier V12 |
| Drift is rejected | Changing `rxjs` to 7.8.1 in `package.json` without a lockfile update makes `npm ci` exit 1: "lock file's rxjs@7.8.2 does not satisfy rxjs@7.8.1" | `logs/negative-lockfile-drift.log` |

A root `engines` field was deliberately not added: npm would write it into the root entry of the lockfile, changing it without adding enforcement beyond `devEngines`.
