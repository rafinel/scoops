# Notification center design manifest

The implementation reference is `design/onoreo.pen`. The saved PNGs are the durable
Builder and visual-validation bundle for Issue
[`rafinel/scoops#30`](https://github.com/rafinel/scoops/issues/30). The two mapped Pencil
nodes were inspected in the active editor, reported no layout problems, exported at scale 1,
verified as non-empty PNG files in the repository, and visually inspected after export.

## Frame inventory

| Reference | Pencil file/node | State | Viewport | Screenshot | Implementation surface | Tokens/components | Validation |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `NotificationDropdown` | `design/onoreo.pen`, `n5xnGg` | Header dropdown, populated | Native node `403 × 381`; PNG `464 × 442` because the exported shadow extends 30–31 px beyond each edge | [`n5xnGg.png`](./n5xnGg.png) | `NotificationDropdown` opened from the authenticated `AppLayout` Header | Existing card/background/border/muted/primary/destructive tokens; shared `Button`, `Icon`, and dropdown primitives | `CA-09`, `CA-10`, `MV-01`; compare desktop placement, hierarchy, rows, close control, and footer link |
| `Tela de notificações` | `design/onoreo.pen`, `K3Vu9o` | Full page, populated, default period | `1560 × 1020` | [`K3Vu9o.png`](./K3Vu9o.png) | `/notifications`, `NotificationsPage` | Existing App shell, `BackLink`, card/background/border/muted/primary/destructive tokens, shared `Select`, `Button`, and `Icon` | `CA-11`, `CA-12`, `MV-02`; compare desktop page geometry, hierarchy, date sections, rows, period control, and load-more action |

## Visual implementation inventory

| Reference | Route/surface/state | Viewport | Required visible inventory | Interaction/state coverage | Ambiguities or exclusions | Validation target |
| --- | --- | --- | --- | --- | --- | --- |
| [`n5xnGg.png`](./n5xnGg.png) | Authenticated Header; dropdown open with three notifications | Validate at `1560 × 1020`; keep within `390 × 844` | White rounded elevated panel; `Notificações` heading; icon-only close button; three divided rows with circular semantic icons, bold titles, muted context and receipt time; centered primary `Ver todas as notificações` footer action | Bell opens; close button, Escape, outside interaction, and footer navigation close it; closing restores bell focus; only rows intersecting the open panel by at least 50% become read | The visible Billing row is an adjacent visual exemplar and must not be implemented. The screenshot does not define loading, error, empty, unread-indicator, or narrow states. Export bounds intentionally include shadow outside the native node. | `CA-09`, `CA-10`, `CA-13`, `MV-01`, `VA-DROPDOWN-DESKTOP`, `VA-DROPDOWN-NARROW` |
| [`K3Vu9o.png`](./K3Vu9o.png) | `/notifications`; populated default-period page | `1560 × 1020` | Existing authenticated sidebar and Header; reusable `Voltar` control; `Notificações` heading and operational subtitle; closed `Últimos 30 dias` select; large bordered notification card; `Todas as notificações` heading; date headings; divided notification rows; centered `Ver mais` button | Period selection resets progressive history; `Ver mais` appends the next stable cursor page; intersecting rows become read; responsive layout must avoid horizontal overflow | Replace the coarse `HOJE`/`ANTERIORES` grouping with one browser-local calendar-date section (`HOJE` for today, localized full date otherwise). Billing, invitation-sent, and NFS-e examples are excluded. The screenshot does not define non-populated or narrow states. | `CA-11`, `CA-12`, `CA-13`, `MV-02`, `VA-PAGE-DESKTOP`, `VA-PAGE-NARROW` |

## Accepted visual assumptions and supplemental coverage

The user explicitly accepted implementation from the existing design system without additional
Pencil frames. These states are required implementation and validation states, not optional design
work.

| Surface/state | Role or fixture | Viewport | Required treatment | Why the supplied references are insufficient | Coverage | Capture status |
| --- | --- | --- | --- | --- | --- | --- |
| Dropdown loading | Manager and Operator | `1560 × 1020`, `390 × 844` | Row-shaped skeletons inside the same bounded panel; close and footer remain operable where navigation is available | `n5xnGg` contains only populated data | `CA-10`, `MV-01`, `VA-DROPDOWN-LOADING` | Accepted visual assumption; capture fresh runtime evidence during implementation |
| Dropdown empty | Manager and Operator with no history | `1560 × 1020`, `390 × 844` | Concise no-notifications message with no invented action; footer still opens the full page | No empty dropdown frame exists | `CA-10`, `MV-01`, `VA-DROPDOWN-EMPTY` | Accepted visual assumption; capture fresh runtime evidence during implementation |
| Dropdown error/retry | Recoverable list failure | `1560 × 1020`, `390 × 844` | Semantic alert, concise failure text, and `Tentar novamente`; panel remains dismissible | No failure frame exists | `CA-10`, `MV-01`, `VA-DROPDOWN-ERROR` | Accepted visual assumption; capture fresh runtime evidence during implementation |
| Page loading | Manager and Operator | `1560 × 1020`, `390 × 844` | Preserve page heading/filter geometry and show row-shaped skeletons in the history card | `K3Vu9o` contains only populated data | `CA-11`, `MV-02`, `VA-PAGE-LOADING` | Accepted visual assumption; capture fresh runtime evidence during implementation |
| Page no history | Manager and Operator with no permanent history | `1560 × 1020`, `390 × 844` | Distinct no-history heading/body with no unrelated call to action | No empty page frame exists | `CA-11`, `MV-02`, `VA-PAGE-EMPTY` | Accepted visual assumption; capture fresh runtime evidence during implementation |
| Page filtered empty | User has history but none in selected period | `1560 × 1020`, `390 × 844` | Explain that the period contains no notifications and offer reset to `Últimos 30 dias` | No filtered-empty frame exists | `CA-12`, `MV-02`, `VA-PAGE-FILTERED-EMPTY` | Accepted visual assumption; capture fresh runtime evidence during implementation |
| Page error/retry | Recoverable list failure | `1560 × 1020`, `390 × 844` | Semantic alert with `Tentar novamente`; retain selected period and already loaded rows when only a next-page request fails | No failure frame exists | `CA-11`, `CA-12`, `MV-02`, `VA-PAGE-ERROR` | Accepted visual assumption; capture fresh runtime evidence during implementation |
| Narrow dropdown/page | Manager and Operator | `390 × 844` | Dropdown remains within viewport with outer gutters and bounded vertical scrolling; page stacks controls, uses full-width card, keeps readable rows and has no horizontal overflow | Pencil supplies desktop references only | `CA-10`, `CA-11`, `CA-13`, `MV-01`, `MV-02` | Accepted visual assumption; capture fresh runtime evidence during implementation |

## Layout inspection record

| Pencil node | Inspection result | Implementation consequence |
| --- | --- | --- |
| `n5xnGg` | No layout problems reported; native size `403 × 381` | Preserve the panel's hierarchy and approximate desktop width while allowing viewport gutters and vertical containment on narrow screens. Treat the larger PNG dimensions as deliberate shadow export bounds, not panel dimensions. |
| `K3Vu9o` | No layout problems reported; frame and export both `1560 × 1020` | Preserve the desktop shell, main-column rhythm, card hierarchy, and control placement. Apply the accepted per-date grouping and responsive assumptions instead of reproducing excluded example rows or the coarse `ANTERIORES` label. |

## Design exclusions

- Billing, invitation-sent, NFS-e, onboarding-confirmation, email-change-confirmation,
  invitation/resend, password-recovery, and establishment-exclusion rows are not in-product
  notification types in this delivery.
- The Pencil rows do not authorize row navigation, per-row menus, deletion, read/unread filtering,
  channel preferences, delivery monitoring, or a custom date range.
- Visual validation must use fresh Playwright CLI screenshots. These reference exports are never
  reused as runtime evidence.
