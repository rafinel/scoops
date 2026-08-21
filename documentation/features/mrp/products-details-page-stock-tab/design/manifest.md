# Product details Stock tab design manifest

Source: `design/onoreo.pen`. Exported at 1× on 2026-08-18 through Pencil into this repository directory. Every PNG is non-empty, valid and visually inspected from the shared workspace.

| Reference | Pencil file/node | State | Viewport | Screenshot | Implementation surface | Tokens/components | Validation |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Product details | `design/onoreo.pen` / `bi8Au`, history card `LHrAy` | By-brand Stock page, populated/Normal/history | 1560 × 1320 | [`bi8Au.png`](./bi8Au.png) | `/products/$productId`; page, summary, brands and transaction-history card | Shell, metrics, brand actions, history filters/table/pagination, responsible-user initials avatars | Compare Stock content and stable same-name avatar colors for `CA-01`, `CA-02`, `CA-07`, `CA-16`, `CA-18`, `MV-01`, `MV-03`; exclude every adjacent tab |
| Add brand | `design/onoreo.pen` / `p72QC` | Add dialog | 676 × 771 | [`p72QC.png`](./p72QC.png) | `ProductBrandDialog` Add variant | Modal, product/unit context, inputs with suffix/prefix, price preview, outline/primary actions | Compare Add structure, initial stock and preview for `CA-08`, `CA-09`, `MV-03` |
| Edit brand | `design/onoreo.pen` / `Jo3va` | Edit dialog | 676 × 771 | [`Jo3va.png`](./Jo3va.png) | `ProductBrandDialog` Edit variant | Same modal/form primitives as Add | Compare shared hierarchy for `CA-09`, `MV-03`; intentionally omit the visible initial-stock field because stock changes only through Entry/Write-off |
| Brand actions | `design/onoreo.pen` / `yUkPJ` | Row overflow menu open | 293 × 188 | [`yUkPJ.png`](./yUkPJ.png) | `ProductBrandActionsMenu` | Menu items, pencil/star/trash icons, destructive separator | Compare item order, focus/keyboard and destructive treatment for `CA-08–CA-10`, `MV-03` |
| Delete brand | `design/onoreo.pen` / `K48XWv` | Destructive confirmation | 596 × 353 | [`K48XWv.png`](./K48XWv.png) | `RemoveProductBrandDialog` | Modal, danger icon, cancel/destructive actions | Compare hierarchy for `CA-10`, `CA-18`, `MV-03`; clarify current-balance removal while transaction history remains preserved |

## Visual inventory

| Reference | Route/surface/state | Viewport | Required visible inventory | Interaction/state coverage | Ambiguities or exclusions | Validation target |
| --- | --- | --- | --- | --- | --- | --- |
| `bi8Au.png` | Product details / populated By brand / Stock active | 1560 × 1320 | Application shell; product identity; metrics; Brands card/actions; Movement history with filters, signed rows, responsible-user name plus initials avatar, and pagination | Current stock and newest committed history are visible together; equal normalized author names use equal semantic colors | Incompatible category fixture and adjacent tabs are non-normative; adjacent tabs/content remain excluded. Product Edit/Remove are absent. History is normative; exact data follows the ledger contract. Avatar color supports identification but never replaces the name. | `CA-01`, `CA-02`, `CA-07`, `CA-14`, `CA-16`, `CA-18`; `MV-01`, `MV-03`, `MV-05` |
| `p72QC.png` | Add brand dialog | 676 × 771 | Dark overlay; centered rounded modal; tag icon/title/subtitle/close; product and unit context panel; name, package quantity with unit suffix, package value with currency prefix, initial stock with unit suffix; unit-price calculation panel; Cancel/Confirm footer | Add inputs, preview and cancel/confirm | Does not show validation, package-count mode, pending or server failure. Those follow Design/Spec state contracts. | `CA-08`, `CA-09`, `CA-15`; `MV-03`, `MV-05` |
| `Jo3va.png` | Edit brand dialog | 676 × 771 | Same composition as Add with Edit title and current configuration preview | Edit/cancel/confirm | Visible `Estoque inicial` conflicts with explicit user decision. Omit it; balance remains read-only outside Entry/Write-off. Close icon is not visible in this frame but dialog primitive retains accessible close/cancel. | `CA-09`; `MV-03` |
| `yUkPJ.png` | Brand action menu | 293 × 188 | White rounded popup; Edit, Set as Main, separator, destructive Delete; pencil/star/trash icons | Arrow-key navigation, activation and focus return; current Main does not offer an active set-main mutation | Trigger/anchor row is not present. Implementation positions through existing menu primitive and keeps viewport collision handling. | `CA-08–CA-10`, `CA-14`; `MV-03`, `MV-05` |
| `K48XWv.png` | Delete brand confirmation | 596 × 353 | Dark overlay; centered danger dialog; trash icon, title, explanatory copy, close; Cancel and red Delete brand action | Cancel, confirm, pending/disabled and focus restoration | History-preservation copy is authoritative after the PRD amendment. Clarify that current balance/dependency links are removed while immutable snapshots remain. Main-with-siblings rejection is additional. | `CA-10`, `CA-13`, `CA-14`, `CA-18`; `MV-03`, `MV-05` |

## Layout inspection

| Node | Inspection result |
| --- | --- |
| `bi8Au` / `LHrAy` | Export is complete at 1560 × 1320; history filters/table/pagination and responsible-user avatars are included. Pencil layout inspection after the author-column width correction reports no clipped descendants. |
| `p72QC` | 676 × 771 export is complete; modal, field rows, preview and footer fit with no visible overlap or truncation. |
| `Jo3va` | 676 × 771 export is complete; shared Edit layout fits with no visible overlap; the stock field is a contract deviation, not a layout defect. |
| `yUkPJ` | 293 × 188 export is complete; all three menu actions and divider fit without clipping. |
| `K48XWv` | 596 × 353 export is complete; title/copy/actions fit without clipping; copy changes are required by product authority. |

## Supplemental coverage decision

| Proposed state | Role/fixture | Viewport | Why references are insufficient | RF/CA/MV coverage | Decision |
| --- | --- | --- | --- | --- | --- |
| Single-stock page and Entry/Write-off dialog | Manager; Single product | 1280 × 900 | Main page shows only By brand; no adjustment modal supplied | `RF-03`, `CA-04–CA-06`, `MV-02` | Recommended supplemental; defer capture to implementation because behavior/tokens are fully governed by PRD, Spec and Design |
| By-brand package/base-unit adjustment | Manager; brand with package size | 676 × 771 | No supplied mode/insufficiency state | `RF-03`, `RF-04`, `CA-05`, `CA-15`, `MV-03` | Recommended supplemental; capture success and insufficient variants in `evaluation.md` |
| Loading, GET error/retry and empty brands | Manager; controlled transport/fixtures | 1280 × 900 | Supplied page is populated success only | `RF-09`, `CA-13`, `MV-05` | Recommended supplemental; capture each implemented state in `evaluation.md` |
| History loading, empty, error and filtered-empty | Manager; controlled transport/fixtures | 1280 × 900 | Supplied history is populated success only | `RF-11`, `CA-16`, `MV-03`, `MV-05` | Recommended supplemental; capture independent history states in `evaluation.md` |
| Narrow page/dialog/menu | Manager; populated By brand | 320 × 900 | No mobile Pencil frame | `RF-09`, `CA-14`, `MV-05` | Recommended supplemental; responsive behavior is explicitly defined in Spec/Design and must be captured/inspected during implementation |
| Unauthorized/foreign resource | Anonymous, non-manager and foreign tenant | 1280 × 900 | Security states are not design frames | `RF-08`, `CA-11`, `CA-12`, `MV-04` | Behavioral evidence required; screenshot is optional because no protected detail may render |

No additional screenshot is required before implementation. Missing states introduce no unresolved product choice: their behavior is established by the PRD, Issue acceptance, explicit user decisions, repository Design rules and the Spec. Their fresh implementation screenshots remain required evaluation evidence where indicated.
