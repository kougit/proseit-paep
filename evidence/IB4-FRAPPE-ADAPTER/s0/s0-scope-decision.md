# IB4-FRAPPE-ADAPTER — S0 scope decision (PO/SA)

| Field | Value |
| --- | --- |
| Decision | **APPROVED WITH BOUNDARY** |
| Decided by | Product Owner / Solutions Architect, project thread, 2026-10-15T13:06Z |
| Path | `tooling/design-system/ci-governance-negative.mjs` |
| Authorised change | Case I24 only: the expected WP05 declared-case total 104 → 105 |
| Reason | S0 adds exactly one mandatory CI job, `PAEP / frappe-adapter`; the WP05 negative harness declares one gate case per mandatory job (GJ19) |

Permitted delta (no other change in the file is authorised):

```
OLD: /FAIL part b ran 1 of 104 declared cases; expected exactly its 32/
NEW: /FAIL part b ran 1 of 105 declared cases; expected exactly its 32/
```

The PO/SA recorded that the negative-test rule is unchanged and that this is maintenance of the existing fail-closed
assertion, not a weakening of the design-system gate. With this addition the Generation 6 S0 `authorisedScope`
(21 paths, `tooling/governance/baseline-registry.json`) is frozen; any further path is a stop condition requiring a
new PO/SA decision. The required pre-push verification is retained in `s0-verification.md` in this folder.
