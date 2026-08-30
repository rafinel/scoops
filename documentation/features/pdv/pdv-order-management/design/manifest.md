# PDV order management design manifest

## Source and handoff

- Pencil document: `design/onoreo.pen`
- Source issue: <https://github.com/rafinel/scoops/issues/24>
- Inspection and export date: 2026-08-28
- Reference mode: supplied Pencil frames plus repository-authoritative behavior and the
  approved deviations below. Production maps the reference hierarchy to existing Scoops
  tokens and shared components.

## Frame inventory

| Reference | Pencil file/node | State | Viewport | Screenshot | Implementation surface | Tokens/components | Validation |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Orders list | `design/onoreo.pen`, `UltbT` | Populated history | 1481 × 1050 | [UltbT.png](./UltbT.png) | `/orders`, `OrdersPage` filters/table/pagination | App shell, Input, Select, date-period control, Table, Badge, Button, pagination | Compare desktop hierarchy, filters, rows, status and actions in `CA-02`, `MV-01`; add the PRD-required Operator column. |
| Registered details | `design/onoreo.pen`, `I2Kra` | Registered order | 1481 × 1050 | [I2Kra.png](./I2Kra.png) | `/orders/$orderId`, `OrderDetailsPage` | Anchor, cards, Table, Badge, destructive Button | Compare snapshots, totals, actor/channel facts and Manager-only action in `CA-03`, `MV-02`. |
| Cancellation dialog | `design/onoreo.pen`, `c52HsC` | Confirmation | 657 × 602 export; 500 × 437 dialog | [c52HsC.png](./c52HsC.png) | `CancelOrderDialog` | Dialog, left semantic icon tile, Textarea, inline error, alert, Buttons | Compare copy hierarchy, focus, optional reason and destructive action in `CA-05`, `MV-03`. |
| Canceled details | `design/onoreo.pen`, `dPHci` | Canceled order | 1481 × 1050 | [dPHci.png](./dPHci.png) | `/orders/$orderId`, canceled `OrderDetailsPage` | App shell, cards, Table, Badge, semantic notice | Compare cancellation metadata, preserved snapshots and absent cancellation action in `CA-06`, `MV-03`. |
| Orders empty | `design/onoreo.pen`, `Uhw53` | No orders exist | 1481 × 1050 | [Uhw53.png](./Uhw53.png) | `/orders`, `OrdersEmptyState` | Empty-state icon tile, heading, copy, primary action | Compare distinct first-order action in `CA-08`, `MV-01`. |
| Filtered empty | `design/onoreo.pen`, `pSlGt` | No matching orders | 1481 × 1050 | [pSlGt.png](./pSlGt.png) | `/orders`, `OrdersFilteredEmptyState` | Active filters, empty-state icon, clear-filters Button | Compare retained filters and reset action in `CA-08`, `MV-01`. |

## Implementation-facing visual inventory

| Reference | Route/surface/state | Required visible inventory | Interaction/state coverage | Ambiguities or exclusions | Validation target |
| --- | --- | --- | --- | --- | --- |
| `UltbT` | `/orders`, Manager or Operator, populated | Authenticated shell; title/copy/new-sale action; search, channel, status and period controls; result count; number, date/time, Operator, channel, items, total, status, detail action and pagination | Initial last-30-days period; URL-backed combined filters restart page; keyboard-operable controls and rows; most-recent-first results | Pencil omits Operator although REQ-10 requires it. Add Operator while retaining number, date and total at 1024 px. Reports, export, edit and delete remain absent. | `RF-02`, `RF-07`; `CA-02`, `CA-08`; `MV-01` |
| `I2Kra` | `/orders/$orderId`, registered | Back navigation; sequence/date/channel; item configurations/prices; total composition; immutable order facts; status, actor and time; channel card; immutable notice | Manager sees Cancel order; Operator does not; focus returns after a dismissed dialog | Render the complete REQ-09 snapshot even where the frame abbreviates consumption and Combo facts. | `RF-03`, `RF-04`; `CA-03`, `CA-04`; `MV-02` |
| `c52HsC` | Registered detail, cancellation dialog | Left error icon beside title/description; close action; order summary; optional reason; destructive warning; back/cancel actions | Trim input, blank means absent, maximum 500 characters with inline error; pending disables duplicate submission; focus trap and return | Replace the frame's unconditional restoration promise with accurate current-target/skipped-target copy. Payment/refund controls remain absent. | `RF-05`, `RF-07`; `CA-05`, `CA-07`; `MV-03` |
| `dPHci` | `/orders/$orderId`, canceled | Preserved items/pricing; canceled badge; registered/canceled dates and actors; optional reason; channel facts; cancellation notice | Read-only for both roles; no repeat cancel, edit, reactivate or delete action | Distinguish restored and skipped quantities when a deleted target existed; no raw identifiers are user-facing. | `RF-03`, `RF-06`; `CA-06`, `CA-09`; `MV-03` |
| `Uhw53` | `/orders`, no establishment orders | Header/new-sale action; centered semantic icon, first-order message and start-sale action | New-sale actions navigate to `/sales/new`; no result pagination | Distinct from filtered empty. | `RF-07`; `CA-08`; `MV-01` |
| `pSlGt` | `/orders`, filters with no match | Full active filters, zero count, filtered-empty message and clear action | Clear resets search/channel/status/period/page and reloads the default last-30-days first page | Example values are fixtures, not defaults. | `RF-02`, `RF-07`; `CA-02`, `CA-08`; `MV-01` |

## Responsive and missing-state contract

| Proposed route/surface/state and fixture | Exact viewport | Why supplied references are insufficient | Criteria clarified | Decision |
| --- | --- | --- | --- | --- |
| `/orders`, populated Operator history | 390 × 844 | Supplied pages are desktop-only and do not define compact filter stacking or row adaptation. | `RF-02`, `RF-07`; `CA-02`, `CA-10`; `MV-04` | Recommended supplemental coverage deferred to implementation. Keep number, date and total visible; expose remaining facts without horizontal page overflow. Capture fresh Playwright CLI evidence. |
| `/orders/$orderId`, registered and canceled | 390 × 844 | Supplied detail pages are desktop-only and use two columns. | `RF-03`, `RF-07`; `CA-03`, `CA-06`, `CA-10`; `MV-04` | Recommended supplemental coverage deferred to implementation. Stack details after item/total content, preserve reading order and keep Manager action reachable. |
| Orders list/detail loading and retryable error | 1481 × 1050 and 390 × 844 | No Pencil frames define these PRD-required states. | `RF-07`; `CA-08`, `CA-10`; `MV-04` | Use established loading/error widgets and shared skeleton, alert and retry patterns. Capture runtime evidence; repository authority fixes the visual language. |
| Canceled detail with skipped deleted target | 1481 × 1050 | The approved frame predates the approved deleted-target exception. | `RF-05`, `RF-06`; `CA-06`, `CA-09`; `MV-03` | Required approved visual assumption: extend cancellation details with existing warning tokens, snapshotted labels and restored/skipped quantities without implying failure. |

## Inspection record

- Every mapped node was inspected in Pencil before export. Layout inspection reported no
  problems for `UltbT`, `I2Kra`, `c52HsC`, `dPHci`, `Uhw53` or `pSlGt`.
- All six screenshots were exported through the WSL shared path, verified as non-empty PNGs,
  reopened and visually inspected. Page exports are 1481 × 1050; the dialog export is
  657 × 602 around a 500 × 437 dialog.
- The Operator column, accurate best-effort restoration copy, skipped-restoration details and
  left-icon dialog header are approved deviations. The dialog convention is aligned in
  `documentation/rules/ui-layer-rules.md`.
