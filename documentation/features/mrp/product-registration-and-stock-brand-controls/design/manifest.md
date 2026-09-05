# Product registration design manifest

Source design: `design/onoreo.pen`. All exported nodes were inspected in Pencil for layout problems and then verified as non-empty workspace PNGs at the declared dimensions.

| Reference | Pencil file/node | State | Viewport | Screenshot | Implementation surface | Tokens/components | Validation |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Single stock desktop | `design/onoreo.pen` / `k4tYU` | Manager registration; Ingredient selected; Single stock; negative disabled; initial/ideal/cost visible | 1440 × 900 | [k4tYU.png](./k4tYU.png) | `/products/new`; `ProductRegistrationPage`, form, stock card | Sidebar, Header, BackLink, cards, inputs, category controls, segmented stock mode, switch, primary/outline buttons; semantic Scoops tokens | `CA-01`, `CA-02`, `CA-03`, `CA-10`; compare in `MV-01` |
| By brand desktop | `design/onoreo.pen` / `lZGJu` | Manager registration; Ingredient selected; By brand; first numbered brand selected main | 1440 × 972 full frame; validate at 1440 × 900 with vertical scroll | [lZGJu.png](./lZGJu.png) | `/products/new`; stock card and `ProductBrandEditor` | Same shell; Stock Control card below Product card; numbered brand card; mutually exclusive main switch; add-brand outline action | `CA-04`, `CA-05`, `CA-10`; compare in `MV-02` |
| Single stock narrow | `design/onoreo.pen` / `g9l12m` | Narrow Manager registration; Single stock; full product and stock controls | 390 × 844 | [g9l12m.png](./g9l12m.png) | `/products/new` responsive layout | Compact Header, BackLink, stacked card fields/actions, established controls; vertical document scrolling | `CA-01`, `CA-03`, `CA-10`; compare in `MV-01` |
| By brand narrow, scrolled | `design/onoreo.pen` / `z41Sbx` | Narrow scrolled Stock Control region; By brand; brand 1 selected main | 390 × 844 | [z41Sbx.png](./z41Sbx.png) | `/products/new` responsive stock/brand region | Stacked brand inputs, indexed card, mutually exclusive main switch, add-brand/cancel/create actions | `CA-04`, `CA-05`, `CA-10`; compare in `MV-02` |

## Visual inventory and interpretation

| Reference | Required visible inventory | Interaction/state coverage | Ambiguities or exclusions | Validation target |
| --- | --- | --- | --- | --- |
| `k4tYU.png` | Desktop sidebar/header; BackLink and title; Product card with two-column Name/Unit and category cards; separate lower Stock Control card with mode, negative-stock setting, initial/ideal stock, conditional cost; bottom actions | Selected Ingredient, selected Single mode, disabled negative switch, Create/Cancel | No image upload; zero values are valid; field errors/loading are runtime states | `MV-01` desktop visual and keyboard artifact |
| `lZGJu.png` | Same desktop shell/product card; lower By-brand card; negative setting; numbered brand card with selected main switch, brand/package/value/initial fields, add-brand control and actions | Selected By-brand and exactly one main control | Switch styling expresses mutually exclusive group semantics, not independent booleans; no reorder control | `MV-02` desktop selector/payload visual artifact |
| `g9l12m.png` | Compact header; title/description/BackLink; stacked Product and Single-stock cards; two-column fields where width permits; actions | Narrow focus/order and document scrolling | Screenshot is a complete narrow state; no desktop sidebar | `MV-01` narrow screenshot and no-horizontal-overflow record |
| `z41Sbx.png` | Compact header plus scrolled stock region; By-brand segmented control, negative switch, numbered main brand card, stacked inputs, add/cancel/create actions | Narrow selector and scroll state | Product card is above the captured scroll position; absence here is deliberate, not removal | `MV-02` narrow screenshot and scroll/focus record |

## Supplemental-state decision

No additional static capture is required before implementation. Field validation, pending/disabled submit, recoverable server error, and successful navigation are behavior-driven states whose layout is governed by existing shared components and `CA-02`/`CA-10`; they require fresh transient Playwright screenshots during `MV-01` and `MV-02`. Authorization is server/route behavior rather than a distinct registration visual. Manual-adjustment justification and history reuse existing dialogs/cards and are validated under `MV-04`; the issue did not supply or require a new visual treatment for those otherwise unchanged surfaces.
