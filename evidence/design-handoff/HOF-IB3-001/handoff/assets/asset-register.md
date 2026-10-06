# Asset register: HOF-IB3-001 v1.0

> APPROVED_FOR_IMPLEMENTATION (PO/SA, 2026-10-05). Every asset was authored in this handoff (provenance `authored-in-HOF-IB3-001`). Owner: ProSEIT. Licence: ProSEIT proprietary (same terms as the PAEP icon set). They are drawn on the PAEP 24 px grid with a 2 px round stroke in `currentColor`, matching the accepted 25 icons. There are no web fonts, no CDN assets, and no third-party or template glyphs. The full SHA-256 of each file is in `handoff.manifest.yaml` → `assets` / `files`.

**Content credentials.** The project file store adds Anthropic content-credential (C2PA) metadata (an `xmlns:c2pa` attribute and a `<metadata>` block) to every SVG after it is written. It is not part of the authored design. The manifest records both the stored hash (`sha256`) and the authored hash with that metadata removed (`authoredSha256`). An implementation imports the authored form; the prefixes below are of the authored form.

## Shell icons (`@proseit/paep-foundation#PAEP_ICONS`, P-08; design intent approved by the PO/SA 2026-10-05)

| ID | File | SHA-256 (prefix) | Meaning | Mirrors in RTL | Alt-text intent |
| --- | --- | --- | --- | --- | --- |
| ICON-SHELL-menu | `assets/icons/paep-icon-menu.svg` | `a71f1ea25de0bb72…` | Open the mobile navigation container (always with an accessible name) | no | decorative (`aria-hidden`); the control carries the name |
| ICON-SHELL-panel-start | `assets/icons/paep-icon-panel-start.svg` | `59467b85da0eb836…` | Collapse / expand the persistent navigation (points toward inline-start) | yes | decorative (`aria-hidden`); the control carries the name |
| ICON-SHELL-bell | `assets/icons/paep-icon-bell.svg` | `848c8d7e653549dd…` | Notifications | no | decorative (`aria-hidden`); the control carries the name |
| ICON-SHELL-user | `assets/icons/paep-icon-user.svg` | `68611058735fe8f9…` | Account | no | decorative (`aria-hidden`); the control carries the name |
| ICON-SHELL-help | `assets/icons/paep-icon-help.svg` | `d903d6883d602134…` | Help (app-configured hook) | no | decorative (`aria-hidden`); the control carries the name |
| ICON-SHELL-globe | `assets/icons/paep-icon-globe.svg` | `e68e127ea98d39cc…` | Locale and direction | no | decorative (`aria-hidden`); the control carries the name |
| ICON-SHELL-building | `assets/icons/paep-icon-building.svg` | `5ff006a6e987e6bd…` | Tenant / site context | no | decorative (`aria-hidden`); the control carries the name |
| ICON-SHELL-lock | `assets/icons/paep-icon-lock.svg` | `2b988caeb70352bf…` | Locked: permission | no | decorative (`aria-hidden`); the control carries the name |
| ICON-SHELL-edition | `assets/icons/paep-icon-edition.svg` | `a89aa664d5a981f3…` | Locked: edition / plan | no | decorative (`aria-hidden`); the control carries the name |
| ICON-SHELL-sliders | `assets/icons/paep-icon-sliders.svg` | `e221d6fc62aacdd9…` | Locked: configuration | no | decorative (`aria-hidden`); the control carries the name |
| ICON-SHELL-device | `assets/icons/paep-icon-device.svg` | `72d4921bbc728cbe…` | Locked: environment / capability | no | decorative (`aria-hidden`); the control carries the name |
| ICON-SHELL-signal | `assets/icons/paep-icon-signal.svg` | `4c53210686ea86c7…` | Connectivity: online | no | decorative (`aria-hidden`); the control carries the name |
| ICON-SHELL-signal-low | `assets/icons/paep-icon-signal-low.svg` | `ae0c25efafba2525…` | Connectivity: degraded | no | decorative (`aria-hidden`); the control carries the name |
| ICON-SHELL-cloud-off | `assets/icons/paep-icon-cloud-off.svg` | `0ee89c4fd59dd7ed…` | Connectivity: offline | no | decorative (`aria-hidden`); the control carries the name |
| ICON-SHELL-unknown | `assets/icons/paep-icon-unknown.svg` | `3aafdd892e2a32fa…` | Connectivity: unknown | no | decorative (`aria-hidden`); the control carries the name |
| ICON-SHELL-impersonate | `assets/icons/paep-icon-impersonate.svg` | `8319038088cedbaa…` | Support impersonation in effect | yes | decorative (`aria-hidden`); the control carries the name |
| ICON-SHELL-environment | `assets/icons/paep-icon-environment.svg` | `34c1f4fe16949b91…` | Non-production environment | no | decorative (`aria-hidden`); the control carries the name |
| ICON-SHELL-home | `assets/icons/paep-icon-home.svg` | `0205c39cd34afca3…` | Navigation group sample: Overview | no | decorative (`aria-hidden`); the control carries the name |
| ICON-SHELL-list | `assets/icons/paep-icon-list.svg` | `8b8b1d695ba64794…` | Navigation group sample: Records | no | decorative (`aria-hidden`); the control carries the name |
| ICON-SHELL-tasks | `assets/icons/paep-icon-tasks.svg` | `d53dc27f8e8a4897…` | Navigation group sample: Operations | no | decorative (`aria-hidden`); the control carries the name |
| ICON-SHELL-document | `assets/icons/paep-icon-document.svg` | `d263ec645947b8db…` | Navigation group sample: Reports (neutral label only) | no | decorative (`aria-hidden`); the control carries the name |
| ICON-SHELL-shield | `assets/icons/paep-icon-shield.svg` | `e0295afca5ecad98…` | Navigation group sample: Administration | no | decorative (`aria-hidden`); the control carries the name |
| ICON-SHELL-sign-out | `assets/icons/paep-icon-sign-out.svg` | `9b33dec97ed088ad…` | Sign out | yes | decorative (`aria-hidden`); the control carries the name |
| ICON-SHELL-keyboard | `assets/icons/paep-icon-keyboard.svg` | `86c9a1d777f88b43…` | Keyboard shortcut hint | no | decorative (`aria-hidden`); the control carries the name |

## Other assets

| ID | File | Provenance | Notes |
| --- | --- | --- | --- |
| MARK-PLACEHOLDER | `assets/placeholder-mark.svg` | authored-in-HOF-IB3-001 | Neutral placeholder product mark (Navy square, white chevron, Gold bar). Decorative next to the product name. **Approved only as design / reference-app / ui-lab test content (PO/SA 2026-10-05); not a public foundation API.** Each product supplies its own approved brand asset |
| SPRITE-SHELL | `assets/shell-sprite.svg` | authored-in-HOF-IB3-001 | `<symbol>` sprite of the 24 shell icons, for the reference screens only |

The accepted 25 IB2 icons are reused unchanged from HOF-IB2-001 v1.1 and are not copied here.
