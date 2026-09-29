# Global search design reference manifest

Source: `design/onoreo.pen`. The Pencil source is saved in this worktree. Each PNG is a verified, nonempty, visually inspected export at scale 1. Exported dimensions include the dropdown shadow's outer bleed; the logical design widths are 480 px for desktop dropdowns and 320 px for narrow dropdowns. The source uses the existing Header, input, panel, row, icon, Manrope, neutral and purple design primitives; implementation maps their values to Scoops tokens in `documentation/design.md`.

| Reference | Pencil file/node | State | Viewport / export | Screenshot | Implementation surface | Tokens/components | Validation |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Desktop Header | `design/onoreo.pen` / `vCsG7` | Header with search | 1280 × 560 / 1280 × 560 | [vCsG7.png](./vCsG7.png) | Authenticated AppLayout Header | Existing Header, search input, shell tokens | AC-01, MV-01, desktop Header comparison |
| Results dropdown | `design/onoreo.pen` / `sqqJg` | Grouped results | 480 logical width / 541 × 523 | [sqqJg.png](./sqqJg.png) | GlobalSearch panel | Surface, border, shadow, group labels, row spacing | AC-03, MV-01, desktop result comparison |
| Result row | `design/onoreo.pen` / `iUxIp` | Record row | 456 logical width / 456 × 64 | [iUxIp.png](./iUxIp.png) | GlobalSearch record result | Type icon, primary label, type-specific context | AC-03, MV-01, row comparison |
| Narrow dropdown | `design/onoreo.pen` / `j9VUB` | Grouped results | 320 logical width / 381 × 523 | [j9VUB.png](./j9VUB.png) | GlobalSearch narrow panel | Same panel and row primitives with wrapping | AC-09, MV-01, narrow panel comparison |
| Loading | `design/onoreo.pen` / `htlE8` | Pending query | 480 logical width / 541 × 218 | [htlE8.png](./htlE8.png) | GlobalSearch loading state | Panel, progress indicator, text hierarchy | AC-07, automated account-route state and `gs-loading` artifact |
| No results | `design/onoreo.pen` / `Ef8y4` | Query with no matches | 480 logical width / 541 × 218 | [Ef8y4.png](./Ef8y4.png) | GlobalSearch empty state | Panel, icon, guidance copy | AC-07, automated account-route state and `gs-empty` artifact |
| Error | `design/onoreo.pen` / `qRMgq` | Failed query and retry | 480 logical width / 541 × 218 | [qRMgq.png](./qRMgq.png) | GlobalSearch error state | Panel, error copy, retry action | AC-07, automated account-route state and `gs-error` artifact |
| Full narrow Header | `design/onoreo.pen` / `IzLCK` | Header and open results | 320 × 680 logical / 381 × 681 | [IzLCK.png](./IzLCK.png) | AppLayout Header and GlobalSearch | Shared shell, input and panel tokens | AC-09, MV-01, full 320 px composition comparison |
| Keyboard focus | `design/onoreo.pen` / `w3kxj` | Focused result | 480 logical width / 541 × 523 | [w3kxj.png](./w3kxj.png) | GlobalSearch option focus | Visible focus/selection treatment | AC-08, MV-01, keyboard comparison |

## Visual inventory and decisions

- `vCsG7` places search in the authenticated Header; its input has an explicit search affordance and the surrounding shell retains navigation and account controls. `IzLCK` shows the whole 320 px Header with the dropdown fitting the available width, retaining access to the shell controls and avoiding horizontal overflow.
- `sqqJg` and `j9VUB` group page and record rows under distinct headings. Each row has an icon/type cue, a primary name or number, and type-specific context. The edited `iUxIp` and both dropdowns intentionally avoid mandating stock quantity, order price, or discount percentage. Status is still required where relevant by PRQ-13.
- `htlE8`, `Ef8y4`, and `qRMgq` use the same bounded panel, with distinct progress, guidance, and retry content. Their interaction is defined by the Spec: no-results is query-specific; retry repeats the current valid query; an empty input closes the panel.
- `w3kxj` shows one visually focused option. The Spec owns arrow, Enter, Escape, Tab and announcement behavior; the drawing does not imply a custom keybinding beyond that contract.
- The source does not show separate Manager and Operator dropdowns or every record type. The same row component adapts to returned type-specific data. Role filtering and destination behavior are specified by PRQ-13 and validated with both accounts; further static screenshots are not required before implementation.
- No screenshot implies editable values, notification records, detail-page destinations, create-page destinations other than New Sale, or additional product actions. Those are excluded from this feature.

Pencil layout inspection was performed for all nine mapped nodes; no unresolved layout problem prevents use as a reference. Successful states receive fresh Playwright CLI comparison captures at 1280 × 720 and 320 × 700. Loading, empty and error states receive automated route assertions and captured artifacts; they are not manual validation scenarios.

At integrated validation, the Visual Reviewer receives all nine saved references and their current implementation captures as one read-only audit. The Orchestrator verifies the report and owns the official per-reference `EV-*` visual rows in `evaluation.md`; `MV-01` remains the sole manual scenario.
