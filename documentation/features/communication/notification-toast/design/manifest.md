# Notification toast design manifest

The implementation reference is `design/onoreo.pen`. The mapped nodes were inspected in the
active Pencil editor, exported at scale 1, verified as non-empty PNG files in the repository,
and visually inspected after export.

## Frame inventory

| Reference | Pencil file/node | State | Viewport | Screenshot | Implementation surface | Tokens/components | Validation |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `Realtime Notification Toast` | `design/onoreo.pen`, `nfjNn` | Stock-below-ideal toast | Native content approximately `337 × 90`; PNG `397 × 149` because shadow extends beyond the node | [`nfjNn.png`](./nfjNn.png) | Authenticated application shell; Communication realtime toast | Card, border, foreground, muted, warning and warning-soft tokens; shared `Icon`, `Button`, Sonner mount | `AC-06`–`AC-09`, `MV-01`; compare hierarchy, semantic icon, copy, close control and elevation |
| `NotificationDropdown` | `design/onoreo.pen`, `n5xnGg` | Header dropdown, populated | Native `403 × 381`; PNG `464 × 442` because shadow extends beyond the node | [`n5xnGg.png`](./n5xnGg.png) | Header dropdown opened from a selected realtime toast | Existing `NotificationDropdown`, list and row widgets | `AC-05`, `AC-10`, `MV-01`; verify selected notification exposure without redesigning the panel |

## Visual implementation inventory

| Reference | Route/surface/state | Viewport | Required visible inventory | Interaction/state coverage | Ambiguities or exclusions | Validation target |
| --- | --- | --- | --- | --- | --- | --- |
| [`nfjNn.png`](./nfjNn.png) | Any authenticated route; one stock-below-ideal toast at top right | `1560 × 1020`; adapt within `390 × 844` | White elevated rounded card; warning-soft circular icon tile with package icon; bold title; muted contextual message; subdued icon-only close control; no timestamp | Polite announcement; no focus theft; separate open and close controls; 5 seconds active time; hover/focus pause | Reference does not define focus, hover, long copy, stacked, narrow or non-warning variants; transparent export bounds include shadow | `AC-06`–`AC-09`, `MV-01`, `EV-TOAST-DESKTOP`, `EV-TOAST-NARROW` |
| [`n5xnGg.png`](./n5xnGg.png) | Authenticated Header; dropdown opened by toast selection | `1560 × 1020`; keep within `390 × 844` | Existing white rounded panel, title/close control, three notification rows and footer | Selected notification is temporarily pinned at top, becomes read only through existing visibility behavior, and is removed from pinning after successful read or close | This is a destination reference, not the toast reference; no new dropdown visual design is authorized | `AC-05`, `AC-10`, `MV-01`, `EV-DROPDOWN-SELECTION` |

## Accepted visual assumptions and supplemental coverage

The user accepted implementation from the finalized component and design system without more
Pencil frames. These states are required runtime validation, not optional design work.

| Surface/state | Fixture | Viewport | Required treatment | Reference gap | Coverage | Status |
| --- | --- | --- | --- | --- | --- | --- |
| Single toast, keyboard focus | Any supported kind | `1560 × 1020`, `390 × 844` | Visible design-system focus; Enter/Space opens; close remains a sibling control; no focus theft | `nfjNn` shows rest state only | `AC-07`, `AC-08`, `MV-01` | Accepted assumption |
| Three-toast stack | Three unique notifications | `1560 × 1020`, `390 × 844` | At most three visible, newest visually first, within viewport; later items queue FIFO | No stack frame | `AC-04`, `AC-09`, `MV-01` | Accepted assumption |
| Long content | Long pt-BR title/message | `1560 × 1020`, `390 × 844` | Title clamps to two lines and message to three; full combined text remains announced | Reference copy is short | `AC-08`, `AC-09`, `MV-01` | Accepted assumption |
| Semantic variants | Stock below ideal, zero stock, one Identity kind | `1560 × 1020`, `390 × 844` | Reuse the typed per-kind presentation map and named semantic style constants | Reference shows warning only | `AC-06`, `MV-01` | Accepted assumption |
| Hidden/offline suppression | Hidden tab or offline browser | `1560 × 1020` | No toast is queued or replayed; history/cache recovery remains available | No lifecycle frame | `AC-03`, `AC-11`, `MV-02` | Accepted assumption |

## Layout inspection record

| Pencil node | Inspection result | Implementation consequence |
| --- | --- | --- |
| `nfjNn` | Visual inspection found no collapsed, clipped or overflowing content; PNG includes deliberate shadow bounds | Preserve the compact horizontal hierarchy and semantic treatment; constrain runtime width to viewport gutters and validate clamped long copy |
| `n5xnGg` | Existing notification-center manifest records no layout problems; fresh export visually matches that reference | Preserve the implemented dropdown and change only external open/selected-notification behavior |

## Design exclusions

- No timestamp, progress meter, delivery status, action menu, channel preference, read toggle,
  per-toast navigation target other than the Header dropdown, or custom notification-history UI.
- No second `Toaster`, custom portal system, new icon library or arbitrary visual tokens.
- The sample content does not authorize new notification kinds or originating-module behavior.
- Runtime screenshots belong in ignored Playwright output and are recorded in `evaluation.md`;
  these reference PNGs are not runtime evidence.
