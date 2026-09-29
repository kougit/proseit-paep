# Accessibility intent

> HOF-IB2-001 v1.1 (brand revision) · READY_FOR_FINAL_PO_SA_APPROVAL. Target: WCAG 2.2 Level AA (PAEP §16). No exception is proposed; any exception would go to a PO/SA-approved exception register.

## 1. Names, roles, values
| Component | Role / element | Accessible name | State exposure |
| --- | --- | --- | --- |
| Button | button | Visible label | disabled / aria-disabled, aria-busy |
| Icon button | button | aria-label (mandatory input) | as button |
| Action group | group; More = button aria-haspopup=menu; menu/menuitem | aria-label on group; "More actions" | aria-expanded |
| Field wrapper | label for control | Label text | aria-describedby (error, help, affixes), aria-invalid, required |
| Input / Textarea / Select | native | via label | readonly, disabled |
| Checkbox / Radio group | native; fieldset/legend | label / legend | checked, indeterminate, aria-invalid, aria-readonly |
| Table shell | table, caption/aria-labelledby, th scope | Caption | Details: aria-expanded + aria-controls; region aria-busy while loading |
| List | list | optional aria-label | — |
| Pagination | navigation | "Pagination" | aria-current="page"; ends aria-disabled |
| Empty state | heading + text | Heading | — |
| Alert | none (static) / alert / status | Hidden status word + title | — |
| Status badge | text | Visible text | — |
| Progress | progress + label | Label | value/max; indeterminate = no value |
| Skeleton | aria-hidden | — | host aria-busy + hidden "Loading…" |
| Dialog / Drawer | dialog (modal) | aria-labelledby title | open |
| Popover | popover panel; trigger button | Trigger name | aria-expanded, aria-controls |
| Tabs | tablist / tab / tabpanel | tablist aria-label; tab text | aria-selected, aria-disabled |
| Breadcrumb | navigation + ordered list | "Breadcrumb" | aria-current="page"; "…" aria-expanded |
| Card / Panel | section aria-labelledby | Title | Panel toggle aria-expanded |
| Divider | hr / separator or aria-hidden | — | aria-orientation |

## 2. Non-colour cues (REQ-IB2-A11Y-03)
| Meaning | Colour | Non-colour cue |
| --- | --- | --- |
| Status (alert, badge) | status tint + fg | Distinct icon shape + text (+ hidden status word in alerts) |
| Invalid field | error border | 2 px thickness + error icon + message text |
| Disabled | disabled palette | Dashed border + native disabled + optional reason text |
| Read-only | read-only surface | Dashed border; "(read only)" meta text where helpful |
| Selected tab | indicator colour | 3 px indicator bar + weight 600 |
| Current page (pagination) | selected tint | 2 px border + bold + aria-current |
| Current breadcrumb | — | Not a link, weight 600 |
| Checked / indeterminate | brand-primary fill | Tick vs dash glyph |
| Destructive action | error-strong fill | Explicit outcome text + delete icon; separated in groups |
| Focus | focus blue | 2 px ring outline shape |

## 3. Contrast summary
59 foreground/background pairs evaluated in `foundation/token-values.md` §1.7 (v1.1): 54 required pairs, 54 PASS, 0 FAIL; 2 exempt pairs meet their targets; 1 informational. Minimums: body/secondary text 5.95:1 (worst surface), status text on tint 5.66:1, control boundary 4.28:1 (≥ 3:1), focus ring 5.93:1 (worst light surface). Brand: on-brand-primary (white on Navy `#24364B`) 12.32:1, hover 14.57:1, active 16.85:1; Navy as link text 10.97:1 on the page background; selected text on primary-subtle 10.37:1; progress fill vs track 8.67:1; on-brand-accent (`#1A1F26` on Gold `#D4A62A`) 7.32:1; Gold text on Navy 5.45:1. **Prohibited by rule:** white on Gold (2.26:1) and Gold as text or indicator on light surfaces (2.26:1); neither appears in any specimen. The focus ring is kept visible on Navy fills by the 2 px white halo. Brand overrides re-run the gate (token-values §1.6); status, focus, invalid and disabled colours are identical in every profile (SCR-IB2-F09).

## 4. Target size (WCAG 2.5.8)
All interactive targets ≥ 24 × 24 CSS px in both densities; comfortable controls 40 px; compact controls 32 px, rising to 40 px on coarse pointers. Checkbox/radio hit area via the label (≥ 24 px tall). Automated check over all 28 specimens at 4 viewports: 0 undersized targets (inline text links excluded per the WCAG inline exception) — `screens/render-check.json`.

## 5. Keyboard, focus visibility and obscuring
Key maps and focus entry/return: interaction-notes.md §3-4. Focus visible on every interactive element in both densities and both brand profiles (SCR-IB2-F07, F09). Focus not obscured (2.4.11): overlays are top-layer and modal; sticky elements are limited to dialog/drawer header/footer, whose bodies scroll the focused element into view.

## 6. Forms and errors
Visible labels always; placeholder never a label (3.3.2). Errors identified in text and associated (3.3.1, aria-describedby error-first). Failed submit: focus to an error summary alert with links to fields (consumer composition using Alert). Required: asterisk (aria-hidden) + native required.

## 7. Reflow, zoom, text spacing
320 CSS px and 640 CSS px (200 % zoom of 1280) checked for every specimen: no page-wide horizontal scroll, no interactive element off-screen (render-check.json). 400 % zoom of 1280 = the 320 px profile. rem sizing supports user font scaling; no fixed block sizes on text supports 1.4.12. The only horizontal scroll regions are bounded, named and keyboard-reachable (table fallback, tab list, lab code tables).

## 8. Motion
2.3.3 intent and 2.2.2: no loop runs under reduced motion; indeterminate progress and skeleton have static renderings; nothing flashes.

## 9. Language and direction
`lang` and `dir` set at root; identifiers `dir="ltr"`; `dir="auto"` for user-entered free text. RTL proof SCR-IB2-R02/R02D.

## 10. Forced colours
Borders on every layer; focus uses `Highlight`; icons use currentColor; state cues rely on border style/thickness, which survive forced colours.
