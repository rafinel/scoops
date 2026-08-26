# Sales channel management design manifest

Source: `design/onoreo.pen`. All nodes were inspected through Pencil, exported at scale 1,
opened from the repository workspace, and checked with Pencil layout-problem inspection.
No mapped node reported clipping or overflow. Dialog exports include transparent shadow
bounds, so their PNG dimensions exceed the declared component viewport.

| Reference | Pencil file/node | State | Viewport | Screenshot | Implementation surface | Tokens/components | Validation |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Sales channels page | `design/onoreo.pen` / `truKC` | Populated Manager list | 1481 × 1050 | [sales-channels-page.png](./sales-channels-page.png) | `/sales-channels`; `SalesChannelsPage`, information banner, responsive list and action trigger | App shell, cards, table, badges, buttons, `$primary`, semantic status/adjustment tokens | `CA-05`, `CA-10`, `MV-01`; compare `VIS-01` at 1481 × 1050 |
| Create dialog | `design/onoreo.pen` / `fHg5a` | Create, neutral percentage | 520 × 447; PNG 676 × 597 with shadow | [create-channel-dialog.png](./create-channel-dialog.png) | `SalesChannelDialog` create mode | Dialog, Input, Switch, preview card, primary/outline buttons | `CA-01`, `CA-02`, `CA-08`, `MV-01`; compare `VIS-02` |
| Edit dialog | `design/onoreo.pen` / `w9Lra` | Edit active positive channel | 520 × 447; PNG 676 × 602 with shadow | [edit-channel-dialog.png](./edit-channel-dialog.png) | `SalesChannelDialog` edit mode | Dialog, Input, Switch, preview card, primary/outline buttons | `CA-03`, `CA-04`, `CA-08`, `MV-01`; compare `VIS-03` |
| Action menu | `design/onoreo.pen` / `wysrP` | Active-channel actions | 232 × 168; PNG 293 × 229 with shadow | [channel-actions-menu.png](./channel-actions-menu.png) | `SalesChannelsList` row menu | DropdownMenu, Icon, separators, destructive treatment | `CA-03`, `CA-04`, `CA-06`, `MV-01`; compare `VIS-04` with documented exclusions |
| Inactivate dialog | `design/onoreo.pen` / `L5eUNa` | Inactivation confirmation | 440 × 196; PNG 596 × 353 with shadow | [deactivate-channel-dialog.png](./deactivate-channel-dialog.png) | `ChangeSalesChannelStatusDialog` inactivate mode | AlertDialog, danger icon tile, outline/destructive buttons | `CA-04`, `CA-08`, `MV-01`; compare `VIS-05` |
| Delete dialog | `design/onoreo.pen` / `hNvBr` | Deletion confirmation | 440 × 196; PNG 596 × 346 with shadow | [delete-channel-dialog.png](./delete-channel-dialog.png) | `DeleteSalesChannelDialog` | AlertDialog, danger icon tile, outline/destructive buttons | `CA-06`, `CA-08`, `MV-01`; compare `VIS-06` |

## Implementation-facing visual inventory

| Reference | Required visible inventory | Interaction/state coverage | Ambiguities or exclusions |
| --- | --- | --- | --- |
| Sales channels page | Manager app shell; title and explanatory copy; `Novo canal`; optional-channel calculation banner; list count; adjustment legend; columns for name, adjustment, type, status and actions; positive, negative and neutral rows; active/inactive badges; history-preservation note | Open create dialog and each row menu; preserve readable name, percentage and actions; table becomes stacked channel cards at 768 × 1024 | Header search is app-shell-only and non-functional in this feature. Row subtitles are not domain data and are omitted. No pagination. |
| Create dialog | Name, percentage with `%` suffix, adjustment type and R$20 preview, status control, Cancel, Create, close | Default active status; comma or dot decimal input; live preview; field errors; pending disabled controls; recoverable server failure | Pencil omits status, but PRD/Issue require it; implementation adds the same status control used by Edit. |
| Edit dialog | Current name, percentage, status, type/price preview, Cancel, Save, close | Save name/percentage; switching active to inactive opens confirmation; failed save preserves values | Status lifecycle remains a distinct confirmed action even though the switch is visually colocated. |
| Action menu | Edit, status transition and delete actions | Active channel shows Inactivate; inactive channel shows Reactivate | `Ver pedidos` is excluded until REQ-10. Reactivate uses the same menu geometry and success treatment without a confirmation dialog. |
| Confirmation dialogs | Semantic icon, title, historical-preservation explanation, close, Cancel and explicit destructive confirmation | Initial focus inside dialog; Escape/Cancel returns focus; pending disables duplicate submission; inline/live error preserves dialog | Dialog hierarchy follows current UI Rule where it conflicts with older Design prose. |

## Supplemental coverage decision

The supplied bundle has no narrow, loading, empty, error, validation, pending, success or
reactivate frame. The user explicitly accepted documented visual assumptions on 2026-08-25:

| Proposed state | Viewport | Coverage | Decision |
| --- | --- | --- | --- |
| Populated narrow list/cards and open action menu | 768 × 1024 | `CA-05`, `CA-10`, `MV-02`, `VIS-07` | Required implementation comparison; derive from tokens and card/table patterns without a new Pencil frame. |
| Empty, loading and retryable list error | 1481 × 1050 and 768 × 1024 | `CA-05`, `CA-08`, `MV-02`, `VIS-08` | Accepted visual assumption; reuse established shared loading, empty and error widgets. |
| Create/edit validation, pending, failure and success | 520px dialog within both page viewports | `CA-01`–`CA-04`, `CA-08`, `MV-01` | Accepted visual assumption; preserve form state and use field alerts plus application notifications/live regions. |
| Inactive row reactivate action | 1481 × 1050 and 768 × 1024 | `CA-04`, `MV-01`, `VIS-09` | Accepted visual assumption; inverse active-menu action, no confirmation. |
