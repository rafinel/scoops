# Product details Recipe tab — design manifest

The authoritative Pencil source is `design/onoreo.pen`. Exports were captured at scale 1
from the named nodes. Modal exports include their outer shadow bounds, so their PNG dimensions
are larger than the nominal Pencil frames. Product copy and units are fixture data; runtime
content must use the persisted product and ingredient units.

## Reference inventory

| Reference | Pencil file/node | Route/surface/state | Viewport/export | Required visible inventory | Interaction/state coverage | Ambiguities, authority overrides and exclusions | Implementation surface | Tokens/components | Validation |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| [Hd4wz.png](./Hd4wz.png) | `design/onoreo.pen` / `Hd4wz` | `/products/:productId?tab=recipe`, populated recipe | 1560 × 1200 | Existing app shell, breadcrumb and product identity; category-aware tabs with Recipe selected; Recipe card with editable yield, Produce CTA, three metrics, ingredient table, limiting-row treatment and Add ingredient CTA | Select Recipe, save yield, open add/edit/remove/produce actions | The visible `ml` yield suffix conflicts with the product header and is fixture-only; use the Manufacturable product unit. Adjacent Accompaniments, Prices and Settings tabs are non-normative. | `ProductRecipeSlot`, `ProductDetailsTabs`, `ProductRecipeCard` | Existing page/card/table/button/input/icon primitives; `$bg-page`, `$bg-card`, `$bg-muted`, `$border`, `$text-*`, `$primary`, `$danger`, `$warning`, `$success`, `$font-body` | `CA-01`–`CA-08`, `MV-01`, desktop screenshot comparison |
| [a3zfgk.png](./a3zfgk.png) | `design/onoreo.pen` / `a3zfgk` | Add ingredient dialog | nominal 520 × 524; export 676 × 682 | Product picker, current source context, positive quantity with inherited-unit suffix and live cost/COGS/stock preview; Cancel and Add | Search/select eligible Ingredient, validate, submit, retain context on failure | The visible Brand dropdown is a read-only current-main-brand source, not a persisted recipe choice. Single-stock candidates without current unit cost are unavailable with an explanation. | `RecipeIngredientDialog` add mode | Existing Dialog, Select, form field, button and metric treatments | `CA-04`, `CA-05`, `MV-01` |
| [im6ld.png](./im6ld.png) | `design/onoreo.pen` / `im6ld` | Edit ingredient dialog | nominal 520 × 524; export 676 × 684 | Locked ingredient identity, current source, editable positive quantity, recalculated preview, Cancel and Save | Change quantity only; retry failed save without losing values | Product identity remains immutable; changing ingredient requires remove then add. Brand treatment follows the current main brand and is read-only. | `RecipeIngredientDialog` edit mode | Same primitives and tokens as add mode | `CA-06`, `MV-01` |
| [toFi2.png](./toFi2.png) | `design/onoreo.pen` / `toFi2` | Produce dialog, sufficient-stock Batch mode | nominal 640 × 640; export 796 × 790 | Product/yield context, Batch/Quantity segmented control, quantity input/stepper, equivalent quantity, ingredient projection, production cost, output-stock projection, Cancel and Confirm | Switch modes, synchronize values, preview server-authoritative projection, confirm | Whole positive batches are a presentation mode; the server receives product-unit quantity. Missing shortage, pending and failure variants are governed by the Spec. | `ProduceProductDialog` | Existing Dialog, pressed-button mode control, table, metric and alert patterns | `CA-09`–`CA-12`, `MV-02` |
| [FpJbN.png](./FpJbN.png) | `design/onoreo.pen` / `FpJbN` | Remove ingredient confirmation | nominal 440 × 179; export 596 × 335 | Named destructive target, recalculation consequence, Cancel and Remove | Confirm/cancel, pending lock, visible retryable error | Removal deletes only the recipe line and retains the recipe/yield. | `RemoveRecipeIngredientDialog` | Existing AlertDialog and danger-button patterns | `CA-07`, `MV-01` |
| [H2x0f.png](./H2x0f.png) | `design/onoreo.pen` / `H2x0f` | Recipe card with zero ingredients | nominal 1200 × 537; export 1201 × 538 | Recipe title, disabled Produce, visible positive-yield control, instructional empty state and Add first ingredient CTA | Save positive yield before enabling ingredient creation; retain yield after last-line removal | Visible `1000 ml` is fixture state, not a universal default. Opening the tab performs no write. The Add CTA remains disabled until yield persistence succeeds. | `ProductRecipeCard`, `RecipeEmptyState` | Existing card, input-affix, disabled button and empty-state patterns | `CA-02`, `CA-03`, `MV-01` |

## Layout inspection

| Node | Result |
| --- | --- |
| `Hd4wz` | No reported layout problem; all required regions are visible within the 1560 × 1200 frame. |
| `a3zfgk` | No reported layout problem; modal body and footer remain visible. |
| `im6ld` | No reported layout problem; modal body and footer remain visible. |
| `toFi2` | Four icon path children report partial clipping from glyph overshoot; the rendered icons are visually intact and the modal content is not clipped. |
| `FpJbN` | No reported layout problem. |
| `H2x0f` | No reported layout problem; the yield row and empty-state CTA remain visible. |

## Responsive contract

No narrow Pencil frame is supplied. At 320 × 900, the app layout and dialogs must preserve
one-column reading order, visible focus, and horizontal table access without page-level
overflow. Recipe metrics stack; the ingredient table uses its established responsive card or
contained horizontal-scroll treatment; dialog footer actions remain reachable; Batch/Quantity
mode and input stack when they cannot fit side by side. Desktop visual comparison uses the
saved references; narrow validation is behavioral and layout-based.

## Supplemental coverage decisions

| Proposed reference | Viewport and fixture | Gap and criteria clarified | Decision |
| --- | --- | --- | --- |
| Recipe loading, independent error/retry and unsaved-yield validation | 1560 × 1200, Manager, Manufacturable | Supplied frames do not show `CA-01`–`CA-03` recovery states. Existing Scoops loading/error/form patterns plus exact Spec behavior are sufficient. | Recommended supplemental; deferred to implementation screenshots and `MV-01`. |
| Produce shortage, no-main-brand, pending and failed-confirm states | 640 × 760 modal, Manager | `toFi2` shows only sufficient-stock Batch mode; `CA-09`–`CA-12` require red line-level shortage, blocked confirmation and retained retry context. Existing Stock-adjustment patterns plus exact Spec behavior are sufficient. | Recommended supplemental; deferred to implementation screenshots and `MV-02`. |
| Recipe page and Produce dialog at narrow width | 320 × 900, Manager | No mobile artboard exists; responsive and keyboard obligations need real-render proof. | Recommended supplemental; deferred to fresh Playwright CLI screenshots in `MV-03`. |
| Single-stock current-unit-cost fields | Existing registration and stock-entry dialogs, desktop and 320 × 900 | Approved PRD amendment adds a conditional field outside the Recipe reference bundle. Established form-field and affix patterns make the visual treatment deterministic. | Recommended supplemental; deferred to implementation screenshots in `MV-04`; Product Settings treatment remains outside this feature. |
