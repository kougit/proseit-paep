# IB3-ENTERPRISE-SHELL: DDR-IB3-01, -03, -04 and -05 decision table

This table was prepared for the PO/SA under the pre-acceptance disposition of 2026-10-07 (section 5). It is taken from the controlled records:
- `evidence/design-handoff/HOF-IB3-001/conformance-report.md`, sections B and D;
- the retained HOF-IB3-001 handoff;
- the code at the candidate head.

None of these four records is disposed of here. No implementation change is made for them until the PO/SA returns a disposition.

## Summary

| DDR | Question | Claude recommendation | Code implemented | New code if accepted |
| --- | --- | --- | --- | --- |
| DDR-IB3-01 | Locked palette result: reason icon and reason in the description line, instead of the render's destination icon, sub-line and trailing marker | Accept as built | Yes | None |
| DDR-IB3-03 | Switch dialog: current context shown as the checked radio, without a "· current" text marker | Accept as built | Yes | None |
| DDR-IB3-04 | Shell test doubles live package-locally in `packages/enterprise/src/lib/testing/`, not in `tooling/test-utils` | Accept the package-local location | Yes | None |
| DDR-IB3-05 | Command palette (and notification panel, account menu) stay in the main chunk despite `@defer` | Accept (budget handled by DDR-IB3-07) | Yes | None |

## Decision cards

### DDR-IB3-01: locked command-palette result

| Field | Content |
| --- | --- |
| Exact deviation / question | The implementation replaces the destination icon with the reason icon and puts the reason in the option's description line (for example "Not included in your edition"). The HOF render keeps the destination icon, adds the sub-line "… · opens an explanation, not the page" and shows a separate trailing reason marker. Accept the implementation, or approve the option field and the message key the render needs? |
| HOF requirement | Q-05 and SCR-SHELL-008 locked state: a locked result stays findable with its reason and opens the explanation, never the capability. The render shows the destination icon, the explanatory sub-line and a trailing reason marker. |
| Actual implementation | `command-palette.ts` `groups()`: `icon` is `PAEP_SHELL_LOCK_ICONS[reason]` and `description` is "{description} · {reason text}" from catalogued keys (`paep.shell.search.locked.edition`, `paep.shell.locked.*`). `choose()` routes to the internal locked page, or to the host's `explainLock`, and never runs the capability. palette.spec covers this in "filters Go to from the presented manifest: …" and "runs an action; a locked action opens its explanation and never runs". |
| Claude recommendation | Accept as built. Q-05's text and behaviour are met. |
| Alternatives | (a) Add a trailing-marker field to the `PaepComboboxOption` API (P-03) and a new key for the sub-line, then build the render exactly. (b) Add only the sub-line key and keep the reason icon. |
| Affected screen / state | SCR-SHELL-008 locked (conformance Table B row 008); command palette results in all widths. |
| Affected component / API | `PaepCommandPalette` (E-06) on `PaepCombobox` (P-03). Alternative (a) changes the public `PaepComboboxOption` type in `@proseit/paep-components`. |
| Accessibility effect | As built: each option has one name (label) and one description (with the reason), and the icon is decorative. The reason is announced with the option, and nothing is conveyed by the icon alone. Alternative (a) adds another announced element per option. |
| Responsive / 320 effect | As built: one description line that wraps in the full-screen palette at narrow widths. The alternatives add a trailing marker that competes for width at 320 px. |
| RTL effect | None as built: the description and icon mirror with the option. A trailing marker would need its own mirroring rule. |
| Security / trust effect | None. A locked result never opens the capability either way; the lock is presentation, not authorization. |
| Public API compatibility | Accepting: no change. Alternative (a): additive change to the P-03 public option type, which is a governed component API change. |
| Changes accepted HOF design intent | No. The intent (findable, reason shown, explanation only) is met; only the visual composition differs. |
| Code already implemented | Yes. |
| Accepting requires new code | No. |

### DDR-IB3-03: "· current" marker in the context switch dialog

| Field | Content |
| --- | --- |
| Exact deviation / question | The HOF render marks the current option in the switch dialog with the text "· current". The implementation shows the current context as the checked radio and has no text marker, because no approved key exists for it. Accept as built, or approve a key? |
| HOF requirement | SCR-SHELL-007 switch-dialog render: the current option carries a "· current" marker. Two sites of one tenant are separate options. |
| Actual implementation | `PaepContextSwitcher` (E-08) on `PaepDialog` with a radio group: the current context is the checked radio, and two sites of one tenant are separate options. context.spec covers this in "offers a switch button …" and "treats two sites of one tenant as different contexts …"; QA-H:context checks the dialog. |
| Claude recommendation | Accept as built. |
| Alternatives | Approve a new key (for example `paep.shell.context.current`, "current") and render the marker. This makes E04 124 keys and needs ar/he copy. |
| Affected screen / state | SCR-SHELL-007 switch-dialog (Table B row 007), at 600 px and wider (the switcher is removed from the topbar below 600 px, Q-07). |
| Affected component / API | `PaepContextSwitcher` (enterprise, not a public option API); the message catalogue if a key is added. |
| Accessibility effect | As built: screen readers announce the checked state ("checked"), so the current option is conveyed by state, not only visually. A text marker would add a redundant spoken "current". |
| Responsive / 320 effect | None. The dialog is not offered below 600 px. |
| RTL effect | None as built. A marker would follow the option text direction. |
| Security / trust effect | None. |
| Public API compatibility | None either way (an added key is additive). |
| Changes accepted HOF design intent | No. The current context stays identifiable; only the visible text cue is absent. |
| Code already implemented | Yes. |
| Accepting requires new code | No. |

### DDR-IB3-04: location of the shell test doubles

| Field | Content |
| --- | --- |
| Exact deviation / question | WORK_PACKAGE §5 names `tooling/test-utils` for the shell test doubles. They are in `packages/enterprise/src/lib/testing/` and are not exported, because package code may not import `tooling/` (`qa:contracts` S10). Accept the package-local location? |
| HOF requirement | None (not a design element). The requirement comes from WORK_PACKAGE §5. |
| Actual implementation | `packages/enterprise/src/lib/testing/shell-testing.ts` (`provideTestShell`, `testSession`, `testNotifications`, …) is used only by the `*.spec.ts` files. It is not in the entry point's census (`qa:enterprise` E02) and not in the production bundle. |
| Claude recommendation | Accept the package-local location. |
| Alternatives | Move the doubles to `tooling/test-utils`. This requires relaxing `qa:contracts` S10 for spec files (a gate change) or duplicating the shell types in tooling. |
| Affected screen / state | None. |
| Affected component / API | Test code only; there is no public API. |
| Accessibility effect | None. |
| Responsive / 320 effect | None. |
| RTL effect | None. |
| Security / trust effect | None. The doubles are not exported or shipped. |
| Public API compatibility | None. |
| Changes accepted HOF design intent | No. |
| Code already implemented | Yes. |
| Accepting requires new code | No. A WORK_PACKAGE / traceability note records the location. |

### DDR-IB3-05: command palette lazy split

| Field | Content |
| --- | --- |
| Exact deviation / question | The shell template declares the palette with `@defer (when layout.paletteOpen())`. Because the single entry point also exports `PaepCommandPalette` (§12 census), the palette stays in the main chunk. The same holds for the notification panel and the account menu, which the topbar loads directly. Accept? |
| HOF requirement | None for the drawing. The lazy palette is a performance intent of the design document / WORK_PACKAGE, and the size result is governed by DDR-IB3-07 (ACCEPTED). |
| Actual implementation | `shell.ts` uses `@defer`, and `packages/enterprise/src/index.ts` exports every shell part. Reference-app initial bundle: 517 564 B raw, 121 463 B Brotli, within the accepted hard maximums of 525 000 B raw and 150 000 B compressed (`qa:shell` B1; `evidence/IB3-ENTERPRISE-SHELL/gates/bundle-composition.json`). |
| Claude recommendation | Accept. The budget is a separate, accepted decision (DDR-IB3-07). |
| Alternatives | Remove the palette, panel and menu from the public entry point (or add a secondary entry point) so they can load lazily. That changes the §12 census and the public API, and a secondary entry point changes the package topology, which needs an ADR. |
| Affected screen / state | All screens: initial load only. Palette, notifications and account open without a chunk request. |
| Affected component / API | `@proseit/paep-enterprise` entry point (`PaepCommandPalette`, `PaepNotificationPanel`, `PaepAccountMenu`). |
| Accessibility effect | None. As built there is no loading delay when the palette opens. |
| Responsive / 320 effect | None in layout. The initial download is the same at every width. |
| RTL effect | None. |
| Security / trust effect | None. |
| Public API compatibility | Accepting: none. The alternative removes or relocates public exports (a breaking change for hosts). |
| Changes accepted HOF design intent | No. |
| Code already implemented | Yes. |
| Accepting requires new code | No. |
