# Interaction notes

> HOF-IB2-001 v1.1 (brand revision; this document unchanged from v1.0) · READY_FOR_FINAL_PO_SA_APPROVAL. Per-component detail is in component-specs.md; this file collects the cross-cutting interaction rules and the complex key maps.

## 1. General rules
1. Native elements first: `<button>`, `<a>`, `<input>`, `<select>`, `<textarea>`, `<fieldset>/<legend>`, `<table>`, `<dialog>`, `<nav>`, `<progress>`, HTML `popover`. Custom ARIA only for tabs and the action-group menu.
2. Hover never carries essential information or reveals essential actions (REQ-IB2-RSP-02). Hover styles are feedback only.
3. Disabled vs aria-disabled: native `disabled` for unavailable controls; `aria-disabled="true"` (focusable) for loading buttons, disabled tabs and disabled pagination ends so they stay discoverable.
4. Hiding or disabling an action is a usability affordance, never the authorisation control (DCH §13(i)); the server decides.

## 2. State transitions
| From → To | Rule |
| --- | --- |
| default → loading (button) | Label may change to a progressive verb ("Saving…"); width locked to avoid layout shift; aria-busy + aria-disabled; further activations ignored; focus stays. |
| loading → success | Consumer shows result (status message or alert). Button returns to default. |
| loading → error | Button returns to default; error alert inserted (role=alert) near the action; focus stays on the button. |
| field valid → invalid | On blur or submit (not on every keystroke); border 2 px error + icon + text; aria-invalid. |
| invalid → valid | Error removed as soon as the value becomes valid (on input). |
| collection loading → empty / no-results / populated / error | Swap body content; polite live-region message; focus not moved. |
| error → retry | Retry shows loading state; on success focus moves to the collection caption/heading. |
| panel expanded ↔ collapsed | Instant; chevron rotates; aria-expanded. |

## 3. Key maps
| Component | Keys |
| --- | --- |
| Button / Icon button | Enter, Space |
| Link-button | Enter |
| Checkbox | Space |
| Radio group | Tab into group (selected or first) · Arrow keys move + select · Tab leaves |
| Native select | Platform (Alt+↓ / Space opens, arrows) |
| Action group "More" | Enter / Space / ↓ open → first item · ↑ open → last item · ↑↓ move · Home/End · Enter/Space run · Esc close → focus More · Tab close and continue |
| Tabs | Tab into list (selected tab) · ←/→ move (mirrored in RTL) · Home/End · automatic: arrow selects; manual: Enter/Space selects · Tab into panel |
| Table shell | Tab to links, Details buttons and actions · Enter/Space toggles detail · fallback scroll region: Tab stop, ←/→ scroll |
| Pagination | Tab between links · Enter |
| Breadcrumb | Tab between links and "…" · Enter |
| Dialog / Drawer | Tab/Shift+Tab contained (native modal) · Esc = cancel/close (suppressed while an irreversible action is busy) |
| Popover | Enter/Space on trigger toggles · Esc closes → trigger · Tab past last element closes (non-modal) |
| Panel (collapsible) | Enter/Space on header toggle |

## 4. Focus entry and return
| Pattern | Entry | Return |
| --- | --- | --- |
| Form dialog | First field (first invalid field when reopened with errors) | Invoker |
| Destructive confirmation | Cancel (least destructive) | Invoker; if the item was deleted, the collection heading |
| Informational / long dialog | Dialog title (tabindex=-1) | Invoker |
| Drawer | Title (tabindex=-1) or first field | Invoker |
| Popover (informational) | Stays on trigger (short content via aria-describedby) or panel if interactive | Trigger |
| Overflow menu | First (or last) menu item | More button |
| Breadcrumb expand | First revealed link | — |
| Pagination change | Paged region heading/caption | — |
| Failed form submit | Error summary alert (tabindex=-1) | — |

Focus is never moved on page load except by the consumer's routing rules (IB3).

## 5. Transient vs persistent feedback
Persistent inline: Alert (static if present at load; role=alert for inserted errors, role=status for inserted info/success/warning). Transient: a visually hidden polite live region provided by the foundation/platform utility for short confirmations ("Saved"); nothing visual has to time out, which avoids WCAG 2.2.1 timing issues. A visible Toast is outside the IB2 tranche.

## 6. Motion
| Interaction | Default | Reduced motion (`prefers-reduced-motion: reduce`) |
| --- | --- | --- |
| Colour changes (hover/active) | 90 ms standard | instant |
| Popover/menu | enter 200 ms (opacity + 4 px), exit 150 ms | instant |
| Dialog | enter 250 ms (opacity + scale 0.98→1), exit 150 ms; scrim 200 ms | instant; scrim still shown |
| Drawer | enter 250 ms slide from its logical edge, exit 200 ms | instant |
| Chevron rotate | 150 ms | instant |
| Determinate progress | 150 ms width | instant |
| Indeterminate progress | 1.8 s travelling segment | static hatched full bar + "In progress" text |
| Spinner | 0.9 s rotation | static arc + busy label |
| Skeleton | 1.6 s opacity pulse | static blocks |
| Route/page transitions, decorative loops | none | none |

Mechanism: foundation sets all duration tokens to 0 ms and `--paep-motion-loop-state: paused` under the media query; loops use `animation: none`. The UI lab offers "Simulate reduced motion" (class on the root) for review. Evidence: `screens/renders/F05-motion--desktop-reduced-motion.png`, `C05-feedback--desktop-reduced-motion.png`; render-check.json records 0 running animations and `--paep-motion-duration-slow: 0ms` under emulated reduced motion.
