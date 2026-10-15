# Accompaniment price design handoff

The saved PNGs are the implementation references. Node IDs record provenance only; implementation and review use this handoff and the images without reopening Pencil. All captures were exported from `design/onoreo.pen` at scale 1 and visually inspected. Component exports include transparent shadow bounds, so PNG dimensions can exceed the measured node size.

| Reference | Pencil file/node | State | Measured node / PNG | Screenshot | Implementation surface | Tokens/components | Validation |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Portion Accompaniments table | `design/onoreo.pen` / `s3CfpB` | Manager, five links | 1229 × 430 / 1240 × 439 | [s3CfpB.png](./s3CfpB.png) | `/products/:productId/accompaniments`, table/card | Card, table, buttons, badges | AC-04, MV-01 desktop comparison |
| Link accompaniment | `design/onoreo.pen` / `iSdux` | Manager, configured selected product | 520 × 721 / 670 × 871 | [iSdux.png](./iSdux.png) | Link dialog on Accompaniments page | Modal, fields, cost preview | AC-04, AC-05, MV-01 desktop comparison |
| Edit accompaniment | `design/onoreo.pen` / `DyrWo` | Manager, editing linked product | 520 × 721 / 670 × 871 | [DyrWo.png](./DyrWo.png) | Edit dialog on Accompaniments page | Same modal and product-owned price field | AC-04, AC-05, MV-01 desktop comparison |
| Price review dialog | `design/onoreo.pen` / `AYpcB` | Operator, changed price before registration | 560 × 382 / 711 × 533 | [AYpcB.png](./AYpcB.png) | New Sale order conflict dialog | Existing conflict-dialog component, warning and action tokens | AC-09, MV-02 desktop comparison |
| Narrow price review dialog | `design/onoreo.pen` / `mouHc` | Same conflict | 350 × 435 / 501 × 586 | [mouHc.png](./mouHc.png) | New Sale order conflict dialog | Same component with wrapped text | AC-09, MV-02 390 × 844 comparison |

## Visual inventory and interaction coverage

| Reference | Route/surface/state | Required visible inventory | Interaction/state coverage | Ambiguities or exclusions | Validation target |
| --- | --- | --- | --- | --- | --- |
| `s3CfpB` | Portion Accompaniments card, populated, Manager | Count and PDV scope subtitle, purple `Vincular Acompanhamento` button, table columns Accompaniment, Type, Brand, Quantity per Portion, Product Price, Actions; five rows with BRL prices | Link, edit, remove entry points; price is read from the target product, not owned by a row | The reference does not define empty/loading/error, Operator action visibility, or a mobile table transformation. Existing Scoops page states and PRD permissions govern those states. | AC-04, AC-06, MV-01 |
| `iSdux`, `DyrWo` | Link/Edit dialog, selected `Granola` | Title/subtitle/close, Accompaniment and Type selectors with Manage types, current main Brand, visibly labeled `Preço do acompanhamento` BRL field, statement that price applies to every link and size, Quantity per Portion, separate Cost per Portion preview, Cancel/Link or Save actions | Product price may be edited during atomic link or edit save; first link requires price, invalid values retain context | Selector appearance is visual context: Brand follows the read-only current-main-brand contract; Edit cannot change the linked target. Cost preview is distinct from sale price. | AC-04, AC-05, MV-01 |
| `AYpcB`, `mouHc` | New Sale conflict dialog after an accompaniment price changes, Operator | Warning icon, `Revise os preços` title, changed Granola price R$ 3,00 → R$ 4,00, affected item R$ 18,00 → R$ 19,00, order total R$ 28,00 → R$ 29,00, unregistered-order statement, `Revisar valores` action | Return to updated cart, then require a new explicit registration confirmation; keyboard focus enters dialog and returns on close | Monetary values are illustrative fixture data, not fixed product copy. No order is registered from this dialog. | AC-09, MV-02 |

The user-supplied screenshot at `/home/petros/.codex/attachments/7f68fba5-2c55-42fb-b0e9-9be2eefdb4b2/codex-clipboard-0375a1db-8e2f-4dd6-8175-c3c01a5bc294.png` is a 1139 × 855 attachment crop (browser viewport unspecified) showing the former Accompaniment-only Prices page: Scoops sidebar/header, Granola product header, Stock/Prices/Settings tabs, one price card/input and future-sales note. It was visually inspected and is intentionally excluded after the approved removal of that page; it creates no implementation comparison obligation.

## Measured component specifications

| Element/source | Design value | Repository mapping | Responsive/state guidance |
| --- | --- | --- | --- |
| Accompaniments card/table `s3CfpB` | Card 1229 × 430, 24px padding, 16px gap/radius; table 1181 × 319, 12px radius; head 39px, rows 56px; header 11px uppercase | Existing card/table/badge/button primitives; `$bg-muted` header, `$border-soft` dividers, `$primary` CTA | Preserve readable price with product identity; narrow layout may scroll or reflow following existing table pattern without overlapping actions. |
| Link/Edit dialogs `iSdux` / `DyrWo` | Body width 520px, 24px horizontal padding, 16px field gap; price field label Manrope 13/600; BRL prefix and 43px control, 10px radius; cost preview 472 × 67, 12px radius; 78px footer | Existing modal, select, currency/quantity fields, `$bg-card`, `$bg-muted`, `$border`, `$radius-xl` | Limit dialog width to viewport and scroll body if necessary; keep actions reachable. Price is product-owned in both states. |
| Price review `AYpcB` / `mouHc` | Dialog 560 × 382 desktop or 350 × 435 narrow, 16px radius; 24px side padding; warning cards 512/302px wide, 12px radius, 10px gap; 78px action footer | Existing New Sale conflict dialog, `$warning-soft`, `$warning`, `$primary`, `$border` | At 390 × 844 use a 350px or narrower dialog with wrapped heading/support and visible action; announce updated prices/total and preserve focus path. |

The inspected mapped nodes have no reported clipping or overflow. The former Accompaniment-only Prices screen was removed from Pencil and the saved bundle after the approved product decision; an Accompaniment-only product has no Prices tab.

## Reference gaps and comparison plan

- **Required before implementation:** None. The dedicated PDV price-review desktop and narrow states requested during clarification are saved above.
- **Recommended supplemental coverage:** A Pencil frame for the unconfigured first-link price, Operator read-only table and narrow MRP dialog at 390 × 844. The PRD fixes required behavior, while existing Scoops form/read-only/responsive patterns supply visual assumptions. Defer new Pencil captures; implementation must capture these runtime states in `MV-01` and record comparisons or deviations in Evaluation.
- **Runtime comparisons:** Use Playwright CLI after implementation. Capture the populated table, Link/Edit dialogs and price-review dialog at the listed desktop/narrow states; also check unconfigured, invalid, Operator, loading and error behavior. Record paths and results as `EV-*` in `evaluation.md`. Route mocks cannot prove persisted or authenticated flows.
