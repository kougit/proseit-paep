# tooling/architecture-boundaries

Development/CI tooling for package-boundary tags, dependency-direction rules and cycle/deep-import detection (IB0-WP04). Not part of any production bundle. No third-party dependency: Node.js built-ins plus the pinned `typescript` parser.

| File | Purpose |
| --- | --- |
| `architecture-model.json` | Machine-readable PAEP architecture: layers L0–L4 and categories (PAEP-IB-01 §6.1), the package dependency matrix (Appendix B, transcribed exactly), the same-category allowlist (`sameCategoryAllowlist`, empty: PO/SA decision 2026-09-24), Nx-style project tags (`layer:*`, `type:*`) and the classification of every project |
| `check-boundaries.mjs` | Builds the project graph and fails on any unclassified project, model drift from the controlled text, alias inconsistency, forbidden edge (direct, or reached through a chain whose end pair Appendix B does not allow), unlisted same-category edge, cycle, deep import, workspace package imported under another name, nested `package.json` or symlink inside a project, entry-point bypass, contracts neutrality breach, analytics vendor re-export or app copy of package code |

```text
npm run arch:check                                   # exit 0 = PASS, 1 = violations, 2 = checker error
npm run qa:architecture                              # same command, PAEP-EQP-01 Appendix B name
node tooling/architecture-boundaries/check-boundaries.mjs --graph <file> --json
```

`--graph` writes the graph in the Nx `ProjectGraph` JSON shape (`nodes`, `dependencies`) with the edge list, each edge's Appendix B verdict and the Nx-form `depConstraints`. Nx is not installed; see `docs/architecture/IB0-WP04-IMPLEMENTATION-PLAN.md`.

Rules are controlled architecture. Changing the model or a rule needs an approved ADR (PAEP-IB-01 §6.2(viii); PAEP-IR-01 §4.3(vi)); the checker rejects a matrix that differs from `.paep-control/text/PAEP_IB_01_v1.0_text.md`.

**Status:** implemented by IB0-WP04.
