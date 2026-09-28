# DDR-IB2-01: Table shell below 40 rem breaks long words mid-word at extreme narrow widths

| Field (DCH Appendix F) | Value |
| --- | --- |
| DDR ID | DDR-IB2-01 |
| Handoff | HOF-IB2-001 v1.1 |
| Screen/flow | SCR-IB2-C03, SCR-IB2-C03N, SCR-IB2-R01, SCR-IB2-R03 (also the F06 density comparison) |
| Implementing work package | IB2-FOUNDATION-COMPONENTS (working tree after `80bbb8d`) |
| Detected during | QA (accessibility/responsive QA; visual conformance review 2026-09-27) |
| Classification (DCH §19.2(iii)) | **Acceptable adaptation: proposed, pending PO/SA decision** |
| Reason | Responsive adaptation / technical constraint |

## Description

`packages/components/src/lib/table/table.css:177-182` applies `overflow-wrap: anywhere` to **every** `th`/`td` when the shell's container is narrower than 40 rem. Above 40 rem, cells use `overflow-wrap: break-word` (`table.css:61`); identifiers always use `anywhere` (`.paep-table__id`, `table.css:100-104`).

The handoff asks for:
- "unbroken IDs and URLs break anywhere" (component-specs, Table shell, long-label);
- "Known trade-off: at 320 px with extreme values, words in a narrow key column may break mid-word rather than overflow" (responsive-rules §6);
- "never page-wide horizontal scroll", with the key and status columns never hiding (responsive-rules §4).

The implementation applies `anywhere` to all cells below 40 rem, not only to identifiers and the key column. That is broader than the handoff's wording.

## Measured facts

Measured by the implementation team with a Range-per-word line-count script over every `th`/`td` on the current build. The reviewer did not re-run it; the captures agree with it.

- **375 px:** no ordinary word breaks mid-word on `/proofs/responsive`, `/proofs/table-strategies` or `/components/table`. Only the long identifiers (`REC-2026-000187-ATTACHMENT-…`) break, by design, as in render C03.
- **320 px:** words of up to 10 characters stay whole. The earlier QA examples "Recor|d", "Samp|le", "Gam|ma" and "longe|r" no longer break. Two longer bold words in the key column still break: "descriptive" and "exceptionally".
  - The table is 262 px wide inside the lab card.
  - The status column's minimum is 122 px, because the badge breaks only between words ("Awaiting review").
  - The Details column is 40 px.
  - That leaves about 94 px for the key cell.
- **Alternative tried:** `overflow-wrap: break-word` on the key text keeps whole words, but makes the table 4 to 21 px wider than its shell (266/262, 283/262). That means horizontal scrolling, which responsive-rules §4 prohibits.

## Visual evidence

- Captures `components--table--narrow320.png`, `proofs--long-content--narrow320.png`, `proofs--responsive--narrow320.png` and `proofs--table-strategies--narrow320.png` show "descripti|ve" and "exception|ally" in the key column.
- The approved renders break **more** words: `C03-table-shell--narrow320.png` "descrip|tive"; `C03N-table-narrow-strategies--narrow320.png` "Sampl|e", "descri|ptive", "Gamm|a".

## Impact

- **User impact:** at 320 px (400 % zoom), a long word in the key column can wrap mid-word. All text stays visible and readable, and nothing is clipped or scrolled. No effect at ≥ 375 px except identifiers.
- **Architecture/security impact:** none. CSS only, token-based, no data or authority change.

## Proposed treatment

Accept the adaptation. It stays within the responsive-rules §6 trade-off, and the only alternative found breaks the higher-priority "never page-wide horizontal scroll" rule. Optionally, a later handoff version can widen the §6 wording from "narrow key column" to "any cell below 40 rem at extreme widths".

| Decision authority | Product Owner / Solutions Architect |
| --- | --- |
| Decision | PENDING (not APPROVED, REJECTED or BLOCKED) |
| Resulting handoff version | unchanged (v1.1) if accepted as within §6; otherwise per PO/SA |
