---
title: Sale prices and sizes on product registration
status: in_progress
revision: 4
source:
  type: issue
  ref: https://github.com/rafinel/scoops/issues/66
scope:
  - packages/core MRP registration, Resale price and Portion size validation
  - packages/validation registration, Resale price, size and telemetry schemas
  - apps/server MRP product registration REST and persistence
  - apps/web MRP product registration page
last_updated_at: 2026-10-20
---

# Sale prices and sizes on product registration

**Outcome:** delivered in PR [#68](https://github.com/rafinel/scoops/pull/68): a Manager can set Resale and Accompaniment prices and a Portion's sizes at registration, saved atomically, with shared Resale and size rules on the Prices page. All FR-01..FR-15 and AC-01..AC-21 passed; PRQ-01, PRQ-05, PRQ-08, PRQ-09 and PRQ-10 are partially delivered as stated below. See the [Evaluation](./evaluation.md).

## 1. Context and scope

**Objective:** a Manager can set a Single-stock product's Resale price and Accompaniment price,
and a Portion's sizes with their prices, while registering it, without a second trip to the
product's Prices page or a Link dialog.

**Source and depth:** [Issue #66](https://github.com/rafinel/scoops/issues/66), amended on
2026-10-19 to drop the Resale-price suggestion and on 2026-10-20 (revision 4) to add Portion
sizes and their prices at registration, together with the PRD (PRQ-01, PRQ-09, Journey B). Depth is `complete`: Core, Validation, Server
REST/persistence and Web UI change, with several UI states and an atomic multi-record write.
This is a change to the completed
[product registration feature](../../spec.md), so it lives under that feature's `changes/`.

**Baseline and gap:** `POST /products` (`RegisterProductUseCase`) accepts name, unit, categories,
stock control, negative-stock policy, ideal/initial stock, Ingredient unit cost and brands. It
has no price input and no size input. A Manager must open the Prices page for a Resale price or
for a Portion's sizes (`RegisterProductSizeUseCase`, one size per request), or a Link dialog for
an Accompaniment price, before the product can appear in PDV. Revisions 1 to 3 delivered the
Resale and Accompaniment prices; revision 4 adds the Portion sizes.

**Scope:**

- optional `Preço de revenda` and `Preço como acompanhamento` fields in the registration page's
  Catálogo card for Single-stock Resale and/or Accompaniment products;
- a `Tamanhos e preços` section for Portion products, between the Catálogo and Estoque cards,
  with add/remove size rows (name, quantity, price);
- hidden-field retention and conditional client validation, for prices and for size rows;
- registration-time creation of the available Single-stock Resale configuration, the
  product-owned Accompaniment price and a Portion's active sizes, in the existing registration
  transaction;
- a shared Resale price rule for registration and the existing Prices-page save, and a shared
  Portion size rule for registration and the existing add-size save;
- server rejection of prices and sizes that do not apply, Manager-only access and establishment
  scoping;
- saved desktop and narrow design references.

**Exclusions:**

- By-brand Resale prices (owned by the Prices page, PRQ-09), and editing, activating, deactivating
  or removing sizes after registration (Prices → Sizes);
- an Accompaniment price for By-brand Accompaniment products (PRQ-01: By-brand receives no
  registration sale price);
- Resale availability at registration (always available when priced; toggled later on Prices);
- editing or removing prices or sizes after registration (Prices page; Link/Edit dialogs);
- making Fabricável and Revenda mutually exclusive: requested on 2026-10-20 and tracked as its
  own Issue. Revision 4 only stops promising that the combination works (AC-01);
- a registration-only cap on the number of size rows (none: the Prices page has no cap either);
- any suggestion, copy or synchronization between the two prices at registration;
- any change to Portion + Accompaniment categories, link eligibility or global accompaniments,
  including the registration picker and guidance copy, and any change to PDV stock validation.
  Both were discussed during clarification (Q12–Q25) and removed from this Spec at the user's
  request on 2026-10-19 (revision 3). Core keeps rejecting Portion + Accompaniment, and the
  Resale/Accompaniment price fields stay hidden for every Portion product (Portions get the sizes
  section instead). The forced-Single behavior of Manufacturable on the price fields is unchanged
  and no longer verified by AC-01 in this revision;
- PDV behavior beyond reading the facts MRP already exposes;
- field-level mapping of server errors.

**Resolved decisions** (clarification ledger, 2026-10-19):

| Question | Decision |
| --- | --- |
| Q1 Body shape | Two flat optional numbers, `resalePrice` and `accompanimentPrice`, on `RegisterProductInput` and `POST /products`. |
| Q2 Prices that do not apply | Reject with 400 and persist nothing. A By-brand Resale product registers normally without a price. |
| Q3 Resale rule ownership | New `ResalePriceValidationStrategy`, shared by registration and `SaveProductResaleConfigurationUseCase`; registration reuses `AccompanimentPriceValidationStrategy`. |
| Q4 Suggestion behavior | Superseded by Q10. |
| Q5 Hidden fields | Keep the typed value while hidden and restore it when shown; a hidden field is neither validated nor sent. |
| Q6 Narrow layout | Price fields stack full width on narrow screens; required narrow frame `n1BjGx`. |
| Q7 Reference cleanup | Hide `Custo unitário` in non-Ingredient variants; export five frames; error and restore states are runtime captures. |
| Q8 Labels | Design labels, `R$` prefix, `0,00` placeholder and hint `Opcional. Sem preço, o produto fica indisponível no PDV.` |
| Q9 Sales-configuration event | Not published at registration. |
| Q10 Suggestion | Removed. Both prices are entered independently. PRD and Issue amended first. |
| Q11 Server price rejection display | Existing page-level alert with entered values preserved. |
| Q12–Q25 Portion + Accompaniment and PDV stock consolidation | Removed from this Spec at the user's request (revision 3); no decision from those rounds applies here. |
| Amendment Q4 Vehicle | Portion sizes are added to this Spec (revision 4), not a separate Issue; the PRD and Issue #66 are amended first. |
| Amendment Q5 Sizes optional | A Portion may be registered with 0 to many sizes; without sizes it is saved and stays out of PDV until an active size exists. |
| Amendment Q6 Row contents | Each row has name, quantity (product unit shown) and price, with the Prices-page rules; rows can be added and removed; sizes are created active. |
| Amendment Q7 Placement | A new `Tamanhos e preços` card between Catálogo and Estoque, shown when Porção is selected. |
| Amendment Q8 Saving | Optional `sizes` array on `POST /products`; the product and its sizes are created in the same transaction; any invalid size rejects the registration. |
| Amendment Q9 Row states | One empty row at start; a fully empty row is ignored; a partly filled row needs name, quantity and price and blocks submit. |
| Amendment Q10 Row limit | No limit beyond per-row rules and name uniqueness. |
| Amendment Q11 Hidden rows | Typed rows stay in form state while Porção is unselected, are neither validated nor sent, and return when it is selected again. |
| Amendment Q12 Fabricável + Revenda | Not part of this revision; AC-01 stops promising the combination. |
| Amendment Q13 Authority | PRD, then Issue #66, then this Spec and the design, in that order (done for the PRD and the Issue). |

**Accepted assumption:** a Single-stock Resale configuration created at registration is
`isActive: true`, but PDV still lists the product only when it is active and has at least one
stock unit (`MrpSalesCatalogProvider`). A Resale product registered with zero initial stock
therefore stays out of PDV until stock exists; this is existing PDV availability behavior. Likewise a
Portion registered with sizes is offered in PDV only while a size is available, which requires
stock covering it (`MrpSalesCatalogProvider`); a Portion with zero initial stock stays out of the
default PDV list until stock exists.

| Source requirement | Coverage | Boundary |
| --- | --- | --- |
| MRP PRQ-01 Product Registration and Categories | partial | Registration-time Resale/Accompaniment prices and Portion sizes (Capabilities, Experience, Provides). Other PRQ-01 behavior is unchanged. |
| MRP PRQ-09 Integrated Commercial Settings | partial | Registration-time creation, availability, independence, the shared Resale price rule and registration-created sizes following the size rules. Size editing, By-brand Resale and Prices-page editing are unchanged. |
| MRP PRQ-10 Navigation, States, and High-Impact Changes | partial | Visible states, feedback and accessibility of the new fields and size rows only. |
| MRP PRQ-08 Accompaniments and Accompaniment Types | partial | Product-owned Accompaniment price may originate at registration; Link/Edit and tables consume it unchanged. |
| MRP PRQ-05 Dedicated Product Page | partial | Prices—Resale shows the registration-created configuration; tabs unchanged. |
| Journey B — Manager registers a product | partial | Step 2 optional price and size entry and step 4 validation. |
| Journey G — Manager configures accompaniments | partial | Step 3 shows a registration-saved price as the saved product-owned price. |

## 2. Behavior Contract

| ID | PRQ/source coverage | Required behavior |
| --- | --- | --- |
| FR-01 | PRQ-01 Capabilities/Experience; Journey B | On `/products/new`, the Catálogo card shows `Preço de revenda` when the effective stock control is Single and Resale is selected, and `Preço como acompanhamento` when it is Single and Accompaniment is selected; both appear when both categories are selected. Neither appears for a product with Portion or with By-brand stock control; a Portion shows the sizes section instead (FR-10). The fields sit after the Categorias section, at the end of the Catálogo card, and appear or disappear as categories and stock control change, without discarding other entered values. |
| FR-02 | PRQ-01 Experience | A price typed into a field that becomes hidden stays in form state and reappears when the field is shown again. A hidden price is not validated, cannot block submit and is not sent. |
| FR-03 | PRQ-01, PRQ-09 Capabilities | Each price is optional. A filled price must be a finite number ≥ 0 with at most two decimal places and below 10^16; `,` or `.` is accepted as the decimal separator. Zero is valid for both prices; an empty field means no price. Invalid input is reported beside its field, blocks submit without a request and preserves all entered values. |
| FR-04 | PRQ-01 Capabilities; PRQ-09 Capabilities; PRQ-05 | A valid Resale price registers the product together with one Single-stock Resale configuration (no brand) at that price, available (`isActive: true`). Without a Resale price no Resale configuration exists and the Prices—Resale page shows it as not configured. |
| FR-05 | PRQ-01 Capabilities; PRQ-08; PRQ-09 | A valid Accompaniment price, including zero, registers the product with that product-owned Accompaniment price. Link/Edit dialogs prefill it, linked Accompaniment tables display it and PDV uses it for every link and size; zero shows as `Grátis`. Without it, the product has no Accompaniment price and the existing Link-dialog proposal/required-entry rules apply later. |
| FR-06 | PRQ-01 Experience; PRQ-09 registration paragraph | For a product with both categories, both fields start empty and are entered and saved independently. Registration never copies, proposes or synchronizes one price into the other; later changes to one never change the other. |
| FR-07 | PRQ-01 Capabilities; Architecture invariants 1, 2, 5 | `POST /products` accepts optional `resalePrice` and `accompanimentPrice`. The server rejects a malformed or invalid price and a price the product cannot receive (no matching category, Portion, or By-brand) without persisting anything. Only Managers may register; the product and its prices belong to the Manager's establishment and are never visible or usable from another establishment. The product, its prices, stock records and existing registration events commit atomically or not at all. |
| FR-08 | PRQ-09 Capabilities | The server-side Resale price rule is the same at registration and on the Prices page: the existing Single and By-brand Resale saves use the same bounds and two-decimal check, so they reject a price of 10^16 or more instead of failing in persistence. The Prices page's Web form schema is unchanged; such a value reaches the server and is shown through the page's existing save-error feedback. |
| FR-09 | PRQ-01 Experience; PRQ-10 Experience | The fields use the saved design: labels `Preço de revenda` and `Preço como acompanhamento`, an `R$` prefix, a `0,00` placeholder and the hint `Opcional. Sem preço, o produto fica indisponível no PDV.` They have programmatic labels, hint/error descriptions, one visible focus ring and a logical keyboard order; they share one row on desktop and stack on narrow screens without overflow. A server rejection shows the page-level alert and keeps entered values. |
| FR-10 | PRQ-01 Experience; Journey B | When Porção is selected (with any stock control), a `Tamanhos e preços` section appears between the Catálogo and Estoque cards. It starts with one empty row and an `Adicionar tamanho` action. Each row has `Nome`, `Quantidade` (with the product unit shown) and `Preço`, and can be removed; there is no limit on rows. The section is absent from the page when Porção is not selected and never appears for a non-Portion product. |
| FR-11 | PRQ-01 Capabilities; PRQ-09 Capabilities | A completely empty row is ignored on submit. A row with any field filled needs name (trimmed, 1–120 characters), quantity (positive, at most three decimals, below 10^15, `,` or `.` accepted) and price (finite, ≥ 0, at most two decimals, below 10^16); otherwise its errors show beside the field, submit is blocked without a request and every entered value is preserved. Size row errors appear only after a submit attempt, never while the Manager is still typing; once shown they update as the row changes. Size names must be unique within the registration, trimmed and case-insensitive; a duplicate is reported on the later row. |
| FR-12 | PRQ-01 Experience | Rows typed while Porção is selected stay in form state when Porção is unselected and return unchanged when it is selected again. While hidden they are neither validated nor sent and cannot block submit. |
| FR-13 | PRQ-01 Capabilities; PRQ-09 Capabilities | A Portion registered with valid sizes is created together with one active size per row (name trimmed, typed quantity and price) in the same registration transaction. A Portion registered without sizes is created with none and stays out of PDV until an active size exists. No size is created for a non-Portion product. |
| FR-14 | PRQ-01 Capabilities; PRQ-09 Capabilities; Architecture invariants 1, 2, 5 | `POST /products` accepts an optional `sizes` array. The server rejects a malformed size, an invalid name/quantity/price, duplicate names, and sizes on a product without the Portion category, persisting nothing. The size rules are the same at registration and on the Prices-page add-size save, including rejection of a price of 10^16 or more and of a quantity of 10^15 or more instead of failing in persistence. Only Managers may register; sizes belong to the Manager's establishment. The product, its sizes, prices, stock records and events commit atomically or not at all. |
| FR-15 | PRQ-01 Experience; PRQ-10 Experience | The section uses the saved design: heading `Tamanhos e preços`, hint text, `R$` prefix on price, the product unit beside quantity, and an `Adicionar tamanho` action; rows have programmatic labels, hint/error descriptions, one visible focus ring per affixed field and a logical keyboard order (rows top to bottom; Nome → Quantidade → Preço → Remover); fields stack on narrow screens without overflow. A server rejection shows the page-level alert and keeps entered values. |

| ID | FR coverage | Requirement | Given | When | Then | Expected evidence |
| --- | --- | --- | --- | --- | --- | --- |
| AC-01 | FR-01 | Field visibility matrix | Manager on `/products/new` | Selects Resale; Accompaniment; both; Portion; Resale with By brand; Accompaniment with By brand; Ingredient only | Resale shows only `Preço de revenda`; Accompaniment only `Preço como acompanhamento`; both shows both; Portion, By brand and Ingredient show neither price field (Portion shows the sizes section, AC-13); Nome, Unidade, categories and stock values stay as entered across changes | Page hook test; form component test; route suite; MV-01 |
| AC-02 | FR-02 | Hidden value retention | Manager typed `12,50` in Resale and `-1` in Accompaniment | Unticks both categories, submits an otherwise valid form, then (in a fresh form) unticks and re-ticks Resale | The submit succeeds with no price keys and no price errors; re-ticking shows `12,50` again | Page hook test; route suite request body |
| AC-03 | FR-03 | Client price validation | Both fields visible | Enters `-1`, `1,234`, `abc` and `10000000000000000`; then `0`, `12,5` and `12.50` | Each invalid value shows a field error with `aria-invalid` and `aria-describedby`, sends no request and keeps all values; valid values submit `0`, `12.5` and `12.5` as numbers | Page hook test; form component test; route suite (no POST); MV-01 |
| AC-04 | FR-04, FR-07 | Resale price persisted as available | Manager; Single-stock Resale product, `resalePrice: 12.5`, initial stock 10 | Registers | 201; one `resale_configurations` row with the product, the actor's establishment, null brand, price 12.5 and `isActive: true`; `GET /products/:productId/pricing` reports it available; PDV catalog lists the product at 12.5 | Core use-case test; controller test; MV-01 |
| AC-05 | FR-05, FR-07 | Accompaniment price persisted, zero allowed | Manager; Single-stock Accompaniment product | Registers with `accompanimentPrice` 0 and, separately, 2.9 | 201; `products.accompaniment_price` is 0 or 2.9; the Link dialog prefills it; the linked table shows it; PDV shows `Grátis` for 0 | Core use-case test; controller test; MV-01 |
| AC-06 | FR-04, FR-05 | Empty prices save nothing | Manager; Resale + Accompaniment product without prices | Registers | 201; no `resale_configurations` row and a null `accompaniment_price`; the product is not offered in PDV; the Link dialog proposes or requires a price as before | Core use-case test; controller test; route suite payload |
| AC-07 | FR-06 | Independent prices | Manager; both categories | Types Resale `12,00` and leaves Accompaniment empty; registers another product with Resale 12 and Accompaniment 9; then saves a new Resale price on the Prices page | No suggestion control renders and the Accompaniment field stays empty; the request carries only the values typed; stored prices are 12 and 9; the later Resale save leaves `accompanimentPrice` 9 | Form component test; page hook test; controller test; MV-01 |
| AC-08 | FR-07, FR-09 | Server rejection | Manager | Posts `resalePrice` or `accompanimentPrice` that is negative, has three decimals, is ≥ 10^16 or is not a number; posts `resalePrice` for Portion, By-brand or a non-Resale product, or `accompanimentPrice` for Portion, By-brand or a non-Accompaniment product | Malformed or invalid numbers get 422 from the schema; prices that do not apply get 400 from the use case; no product, Resale configuration, balance, transaction or event is persisted; the Web page shows the page-level alert and keeps entered values | Core use-case test (400 rules and no `database.run`); controller test; route suite mocked 400 |
| AC-09 | FR-07 | Authorization and isolation | Anonymous user, Operator and a Manager of another establishment | Anonymous and Operator post a priced registration; the foreign Manager reads the new product's pricing and registers the same name with prices | 401 and 403 with nothing persisted; the foreign Manager gets 404 for the other establishment's product and can register its own same-name product, whose prices are stored under its own establishment only | Controller test; Core use-case test (Operator) |
| AC-10 | FR-07 | Atomic registration | Valid priced registration | The Resale configuration insert fails after the product insert | The request fails; no product, Resale configuration, Accompaniment price, balance, transaction or event remains | Core use-case test (inside `database.run`); controller test with a fixture-installed failure |
| AC-11 | FR-08 | Shared Resale rule on Prices page | Existing Single-stock and By-brand Resale products with saved configurations | Manager saves a Single or By-brand Resale price of 10^16, then `1234567.89` | 10^16 is rejected (422 by schema; Core rejects 400) and the existing configuration is unchanged; `1234567.89` and other valid prices save | Core use-case test; save-single and save-brand resale controller tests |
| AC-12 | FR-09 | Design, accessibility and responsiveness | Manager at 1440 × 900 and 390 × 844 | Opens each variant, navigates with keyboard only, enters values and triggers a client error | Labels, prefix, placeholder and hint match the references; fields have accessible names and descriptions; Tab order is Nome → Unidade → categories → Preço de revenda → Preço como acompanhamento; one focus ring per affixed field; narrow stacks without horizontal overflow | Form component test; MV-01 visual comparison against all five references |
| AC-13 | FR-10 | Sizes section visibility and rows | Manager on `/products/new` | Selects Porção (Single stock, then By brand); unselects it; selects Ingredient only; on Porção clicks `Adicionar tamanho` twice and removes the first row | The section appears with one empty row for Porção under either stock control, grows and shrinks with the actions, shows the product unit beside Quantidade, and is absent without Porção and for any non-Portion product | Page hook test; page and form component tests; size-section direct-prop test; route suite; MV-02 |
| AC-14 | FR-11 | Size row validation | Porção selected | Leaves a row empty; fills only Nome; enters quantity `0`, `1,2345`, `abc`, `1000000000000000`; price `-1`, `1,234`, `10000000000000000`; a name of 121 characters; two rows named `Médio` and ` médio `; then valid `1,5` quantity and `12.50` price | The empty row is ignored and does not block; each invalid row shows its errors beside the fields with `aria-invalid` and `aria-describedby`, sends no request and keeps every value; the duplicate is reported on the later row; valid rows submit `1.5` and `12.5` as numbers | Page hook test; form and size-section component tests; route suite (no POST); MV-02 |
| AC-15 | FR-12 | Hidden size rows retained | Porção selected, an invalid partly filled row and a valid row typed | Unselects Porção and submits an otherwise valid Ingredient form; then in a fresh form unselects and re-selects Porção | The submit succeeds with no `sizes` key and no size errors; re-selecting shows the rows unchanged | Page hook test; route suite request body |
| AC-16 | FR-13, FR-14 | Portion registered with sizes | Manager; Portion product | Registers with sizes `Pequeno` (0.3, 9.9) and `Grande` (0.5, 14.5) under Single stock, and a Portion with no sizes | 201; one active `product_sizes` row per size with the actor's establishment, trimmed name, quantity and price; `GET /products/:productId/pricing` lists them; the Portion without sizes has none; the same works under By-brand stock | Core use-case test; controller test; MV-02 |
| AC-17 | FR-14 | Server rejection of sizes | Manager | Posts `sizes` for a non-Portion product; duplicate names (`Médio`, ` MÉDIO `); an empty name, a name over 120 characters, quantity `0`, quantity with four decimals, quantity 10^15, price `-1`, price with three decimals, price 10^16, an unknown key | Malformed or out-of-range values get 422 from the schema; sizes on a product without Portion and duplicate names get 400 from the use case; no product, size, balance, transaction or event is persisted; the Web page shows the page-level alert and keeps entered values | Core use-case test (400 rules, no `database.run`); controller test (422/400 matrix); route suite mocked 400 |
| AC-18 | FR-14 | Authorization and isolation for sizes | Anonymous user, Operator and a Manager of another establishment | Anonymous and Operator post a Portion with sizes; the foreign Manager registers a Portion with the same name and sizes | 401 and 403 with nothing persisted; the foreign Manager's sizes are stored under its own establishment only and do not conflict with the first Manager's | Controller test; Core use-case test (Operator) |
| AC-19 | FR-13, FR-14 | Atomic registration with sizes | Valid Portion with two sizes | The second size insert fails after the product and the first size were written | The request fails; no product, size, global accompaniment row, balance, transaction or event remains | Core use-case test (inside `database.run`); controller test with a fixture-installed failure on `product_sizes` |
| AC-20 | FR-14 | Shared size rule on the Prices page | Existing Portion with a saved size | Manager adds, then edits, a size with price 10^16 or quantity 10^15, then saves a size with price `1234567.89` and quantity `0.001` | The out-of-range sizes are rejected (422 by schema; Core rejects 400) and the existing sizes are unchanged; the valid size saves | Core use-case test (`register-product-size`); controller test for add size |
| AC-21 | FR-15 | Sizes section design, accessibility and responsiveness | Manager at 1440 × 900 and 390 × 844 | Selects Porção, fills rows, triggers a client error, navigates by keyboard | Heading, hints, prefix, unit label and actions match the references; fields have accessible names and descriptions; Tab order follows rows and fields; one focus ring per affixed field; narrow stacks without horizontal overflow | Size-section component test; MV-02 visual comparison against the new references |

### Design Contract

Use [design/handoff.md](./design/handoff.md) and its five saved, visually inspected references:
`k4tYU` (fields hidden), `o5ZnH` (Resale), `SvYqt` (Accompaniment), `IYhx0` (both) at
1440 × 900, and `n1BjGx` (both, narrow) at 390 × 844. By-brand hidden states reuse the parent
bundle's `lZGJu`, `g9l12m` and `z41Sbx`.

Revision 4 adds the Portion `Tamanhos e preços` section with three saved, visually inspected
references (see the handoff's revision 4 tables): `z4KT5` (one empty row, 1440 × 960 frame),
`U8PLRt` (filled rows with a row error, 1440 × 1160 frame) and `SJ0wZ` (narrow, rows stacked,
390 × 1444 frame); they are full-height frames validated at 1440 × 900 and 390 × 844 with vertical
scroll. The section card sits between Catálogo and Estoque; the price row for
Resale/Accompaniment is absent for Portion, as in the Ingredient reference `k4tYU`.

Required runtime comparisons use 1440 × 900 and 390 × 844. Field-error, hidden-then-restored
and By-brand-hidden states are recommended runtime captures defined in the handoff. Allowed
deviations: the `R$` text is a prefix segment rather than part of the placeholder; label type
uses the repository's existing Nome/Unidade label classes; the original 4px actions overlap
is not reproduced. `SvYqt` shows Porção disabled with Acompanhamento selected, reflecting the
PRQ-01 Portion + Accompaniment rejection; the current Web picker does not enforce that, and the
picker is outside this Spec, so compare only the price row, hint and layout.

## 3. Technical Contract

Proposed internal names are adjustable under the Rules. Public names, payload fields, error
statuses, persistence semantics and atomicity are contractual. Snippets are illustrative and
partial; preserve all omitted existing code.

### packages/core

#### Domain

`RegisterProductInput` (`mrp/domain/structures/register-product-input.ts`) gains three optional
fields. The existing `RegisterProductSizeInput` (`{ name; quantity; price }`) types the rows. `Product.accompanimentPrice`, `ProductCreate`, `ResaleConfiguration` and
`ResaleConfigurationCreate` already carry the needed data and do not change.

```ts
// Existing type; new members marked.
export type RegisterProductInput = {
  readonly name: string
  readonly unit: ProductUnit
  readonly categories: readonly ProductCategory[]
  readonly stockControl: ProductStockControl
  readonly allowNegativeStock?: boolean
  readonly idealStock: number
  readonly currentUnitCost?: number
  readonly initialStock?: number
  readonly brands?: readonly ProductRegistrationBrandInput[]
  readonly resalePrice?: number // new
  readonly accompanimentPrice?: number // new
  readonly sizes?: readonly RegisterProductSizeInput[] // new
}
```

A new pure Strategy (proposed `mrp/domain/strategies/resale-price-validation-strategy.ts`)
implements `BusinessRuleStrategy<number, boolean>` (or an equivalent explicit result) with the
same checks as `AccompanimentPriceValidationStrategy`: finite, ≥ 0, below 10^16 and
`Number(price.toFixed(2)) === price`. It is exported from `mrp/domain/strategies/index.ts`. It is
not a mutation target and receives no direct test; its behavior is proven through the two
consuming use-case suites. `AccompanimentPriceValidationStrategy` is reused unchanged.

A new pure Strategy (proposed `mrp/domain/strategies/product-size-validation-strategy.ts`)
implements the shared size rule currently duplicated inside `RegisterProductSizeUseCase`
(name trimmed, 1–120 characters; quantity finite, positive, at most three decimals, below 10^15;
price finite, ≥ 0, at most two decimals, below 10^16) with an explicit result per field. It is
not a mutation target and receives no direct test; its behavior is proven through the two
consuming use-case suites. The decimal checks use the exact rule of the Resale and Accompaniment price
Strategies (`Number(v.toFixed(n)) === v`) instead of the earlier size tolerance
(`|v·10^n − round(v·10^n)| < 1e-8`), which rejected valid two-decimal prices such as
`1234567.89` that AC-20 requires to save; the two upper bounds are new. Any exported input or
result type of the Strategy lives in its own file under `structures/`; the input row type is the
existing `RegisterProductSizeInput`.

`ProductTelemetryFieldName<'product_creation'>`
(`shared/interfaces/product-telemetry-field-name.ts`) adds `'resalePrice' | 'accompanimentPrice' | 'sizes' | 'sizes.*.name' | 'sizes.*.quantity' | 'sizes.*.price'`
so invalid-submit telemetry can name the fields. Only field names are emitted, never values.

No new entity, error class or event. Errors reuse `BadRequestError` and `AuthorizationError`.
`ProductSalesConfigurationChangedEvent` is not produced by registration (decision Q9: its only
consumer revalidates combos, and a new product cannot belong to a combo or link).

#### Use cases

| Path | Change |
| --- | --- |
| `packages/core/src/mrp/use-cases/register-product-use-case.ts` | Modify |
| `packages/core/src/mrp/use-cases/save-product-resale-configuration-use-case.ts` | Modify |
| `packages/core/src/mrp/use-cases/register-product-size-use-case.ts` | Modify |
| `packages/core/src/mrp/use-cases/update-product-size-use-case.ts` | Modify |

**`RegisterProductUseCase`.** Order stays: `validateActor` → `validateInput` →
`database.run(register)`. Additions:

1. In `validateInput`, after categories and stock checks, validate each supplied price before
   any persistence:
   - `resalePrice` requires `stockControl === Single`, the Resale category and no Portion;
     otherwise `BadRequestError('O preço de revenda é permitido apenas para produtos de revenda com estoque único.')`.
     It must then pass `ResalePriceValidationStrategy`, otherwise
     `BadRequestError('O preço de revenda deve ser maior ou igual a zero e ter até duas casas decimais.')`.
   - `accompanimentPrice` requires `stockControl === Single`, the Accompaniment category and no
     Portion; otherwise
     `BadRequestError('O preço como acompanhamento é permitido apenas para acompanhamentos de estoque único.')`.
     It must pass `AccompanimentPriceValidationStrategy` (result is the number), otherwise the
     existing message `'O preço deve ser maior ou igual a zero e ter até duas casas decimais.'`.
   - `undefined` means "not supplied". Never use truthiness: zero is valid.
   - `sizes` requires the Portion category, otherwise
     `BadRequestError('Tamanhos são permitidos apenas para porções.')`. Each size must pass
     `ProductSizeValidationStrategy` (the existing size messages are kept) and names must be
     unique after trim and lower-casing, otherwise `BadRequestError('Já existe um tamanho com esse nome para o produto.')`.
     `sizes: []` and `undefined` both mean no sizes.
2. In `createProduct`, spread `accompanimentPrice` into `productsRepository.add` only when
   supplied, mirroring `currentUnitCost`.
3. In `register`, after `createProduct` and inside the same scope, when `resalePrice` is
   supplied call `scope.resaleConfigurationsRepository.add({ establishmentId: actor.establishmentId, productId: created.id, price: resalePrice, isActive: true })`
   with no `brandId`. When `sizes` is supplied, call `scope.productSizesRepository.add({ establishmentId, productId, name: trimmed, quantity, price, isActive: true })`
   for each size, in input order, inside the same scope (one insert per row, following the brand
   precedent; AC-19 fixes this order). Global rows, stock recording, stock
   alert and `ProductCreatedEvent` publication are unchanged, and no
   `ProductSalesConfigurationChangedEvent` is published (a new product cannot belong to a combo
   or link).

```ts
// Illustrative excerpt inside RegisterProductUseCase; private class members, not loose functions.
private async addResaleConfiguration(
  scope: MrpDatabaseRepositories,
  request: Request,
  product: Product,
): Promise<void> {
  if (request.resalePrice === undefined) return

  await scope.resaleConfigurationsRepository.add({
    establishmentId: request.actor.establishmentId,
    productId: product.id,
    price: request.resalePrice,
    isActive: true,
  })
}
```

The returned value remains the created `Product`, which now includes `accompanimentPrice` when
supplied. Any repository failure inside `database.run` rolls back the product, Resale row,
stock rows and outbox events; no second transaction is opened.

**`RegisterProductSizeUseCase`.** Replace the private name/quantity/price checks in
`validateInput` with `ProductSizeValidationStrategy`, keeping the existing messages, the
duplicate-name `ConflictError` and the rest of the flow. Intentional change: a price of 10^16 or
more and a quantity of 10^15 or more are rejected with 400 instead of failing in persistence.

**`UpdateProductSizeUseCase`.** Replace its private quantity and price checks with the same
Strategy (messages and flow unchanged), so edit and add agree. `updateProductSizeSchema` extends
`registerProductSizeSchema`, so the edit-size body inherits the new bounds and returns 422 for
them; this is an intentional, named effect, covered by AC-20. The decimal check of both the add
and the edit save also changes from the earlier tolerance to the exact `toFixed` rule: floating
point artifacts such as `0.30000000000000004` are now rejected, while Web always sends values
parsed from at most three (quantity) or two (price) typed decimals, so ordinary input is
unaffected.

**`SaveProductResaleConfigurationUseCase`.** Replace the private
`hasAtMostTwoDecimalPlaces`-based price check in `validateInput` with
`ResalePriceValidationStrategy`. Keep the existing message
`'O preço deve ser não negativo e possuir até duas casas decimais.'`, the `isActive` check, the
add/replace flow and sales-configuration publication. Two behaviors change, both intentional:

- prices of 10^16 or more are rejected instead of failing in persistence;
- the decimal check is unified with the Accompaniment rule (`Number(v.toFixed(2)) === v`)
  instead of the current `|v·100 − round(v·100)| < 1e-8` tolerance. Valid two-decimal prices
  whose floating-point product misses the tolerance, such as `1234567.89`, become accepted;
  floating-point artifacts such as `0.30000000000000004` become rejected. Web always sends
  values parsed from at most two typed decimals, so ordinary input is unaffected.

**Tests.** `register-product-use-case.test.ts` replaces the test asserting that
`accompanimentPrice` is ignored and adds `resaleConfigurationsRepository` to its scope mock.
Both suites follow Use Case Testing Rules (`vitest-mock-extended`, fakers such as
`ResaleConfigurationFaker`, fixed datetime).

#### Interfaces

`ProductSizesRepository.add` is reused without a signature change.
`MrpService.registerProduct(input: RegisterProductInput)` keeps its signature; the widened input
is consumed by Web. `ResaleConfigurationsRepository.add`, `ProductsRepository.add` and
`MrpDatabase.run` are reused without signature changes.

### packages/validation

| Path | Change |
| --- | --- |
| `packages/validation/src/mrp/register-product-schema.ts` | Modify |
| `packages/validation/src/mrp/register-product-size-schema.ts` | Modify |
| `packages/validation/src/mrp/save-product-resale-configuration-schema.ts` | Modify |
| `packages/validation/src/web/product-registration-form-schema.ts` | Modify |
| `packages/validation/src/web/product-creation-telemetry-payload-schema.ts` | Modify |
| `packages/validation/src/index.ts` | Modify |

- `resalePriceSchema` (new primitive; proposed file `packages/validation/src/mrp/resale-price-schema.ts`):
  a bounded schema mirroring `accompanimentPriceSchema`
  (`z.number().finite().nonnegative().lt(10^16).refine(two decimals)`), exported from the root.
- `registerProductSizeSchema` (add-size body) gains the same bounds as Core: quantity below 10^15
  and price below 10^16, so the Prices-page add-size save and registration agree.
- `registerProductSchema` adds `resalePrice: resalePriceSchema.optional()`,
  `accompanimentPrice: accompanimentPriceSchema.optional()` and
  `sizes: z.array(registerProductSizeSchema).optional()` (no maximum length). Schema rejection maps to 422 through
  the existing `ZodValidationPipe`. Category/stock eligibility stays in Core (400).
- `saveProductResaleConfigurationSchema` reuses `resalePriceSchema` for `price`.
- `productRegistrationFormSchema` adds string fields `resalePrice` and `accompanimentPrice`
  (default `''`). Its `superRefine` validates each only when its field is visible under the FR-01
  rule (Single stock, or forced Single by Manufacturable, with the category and without Portion).
  After checking the decimal syntax and normalizing `,` to `.`, it composes the parsed number with
  `resalePriceSchema` and `accompanimentPriceSchema` (as `product-accompaniment-form-schema.ts`
  already composes `accompanimentPriceSchema`) instead of repeating the bounds. Messages:
  `Informe um preço de revenda maior ou igual a zero, com até duas casas decimais.` and
  `Informe um preço maior ou igual a zero, com até duas casas decimais.` (the existing
  Accompaniment form message).
- `productRegistrationFormSchema` also adds `sizes`: an array of `{ id, name, quantity, price }`
  strings (default `[]`). Its `superRefine` validates the rows only while Porção is selected:
  fully empty rows are skipped; any other row needs name (1–120 characters), quantity (positive, ≤ three decimals, below
  10^15, `,` or `.`) and price (≥ 0, ≤ two decimals, below 10^16), composed from
  `registerProductSizeSchema.shape.quantity` and `.shape.price` (no new public primitives); duplicate
  names (trim, case-insensitive) are reported on the later row. Messages reuse the Prices-page
  size form messages (`Informe o nome do tamanho.`, `Informe uma quantidade maior que zero, com até três casas decimais.`,
  `Informe um preço válido, com até duas casas decimais.`) plus `Já existe um tamanho com esse nome.`
- `productCreationFieldsSchema` adds `'resalePrice'`, `'accompanimentPrice'`, `'sizes'`,
  `'sizes.*.name'`, `'sizes.*.quantity'` and `'sizes.*.price'`.

Schemas improve feedback only; Core remains authoritative.

### apps/server

#### REST

`POST /products` (`RegisterProductController`) keeps its route, `@RequiredProfiles([Manager])`,
`ZodValidationPipe(registerProductSchema)` and `RequestBody` derived from the use case. The
documented statuses stay 201, 400, 401, 403, 409 and 422. `ProductResponseDto` adds
`@ApiPropertyOptional() accompanimentPrice?: number` so Swagger matches the returned Product.

```http
POST /products
{ "name": "Paçoca", "unit": "un", "categories": ["resale", "accompaniment"],
  "stockControl": "single", "initialStock": 10, "idealStock": 20,
  "resalePrice": 2.5, "accompanimentPrice": 0 }
```

`apps/server/rest-client/mrp/products.rest` adds this example (or extends the Single-stock
example) and a Portion example with `sizes` (`[{ "name": "Pequeno", "quantity": 0.3, "price": 9.9 }]`)
so every registration body field is represented.

**Compatibility and rollout.** `registerProductSchema` is `.strict()`, so a server without this
change answers 422 to a body containing `resalePrice`, `accompanimentPrice` or `sizes` (the
nested size schema is strict as well). Deploy the Server before (or together with) the Web build.
Older Web clients keep working because the new fields are optional.

#### Database

No schema change and no migration. Existing persistence covers the contract:

- `products.accompaniment_price numeric(18,2)` nullable, check `>= 0`; written by
  `DrizzleProductsRepository.add` through `withNumericAccompanimentPrice`.
- `resale_configurations` (`establishment_id`, `product_id` FK cascade, nullable `brand_id`,
  `price numeric(18,2)` check `>= 0`, `is_active`), with partial unique index
  `mrp_resale_configurations_single_unique` on `(establishment_id, product_id) WHERE brand_id IS NULL`.
- `product_sizes` (`establishment_id`, `product_id`, `name`, `quantity numeric(18,3)`,
  `price numeric(18,2)`, `is_active`) with the unique index
  `mrp_product_sizes_product_name_unique` as a backstop; Core validates duplicates first.
- `DrizzleMrpDatabase.run` executes the registration in one serializable transaction; its
  existing retry-once-then-`ConflictError` behavior is unchanged.

PDV reads both values through `MrpSalesCatalogProvider` without change.

### apps/web

#### UI

| Path | Change |
| --- | --- |
| `apps/web/src/ui/mrp/widgets/pages/product-registration-page/use-product-registration-page.ts` | Modify |
| `apps/web/src/ui/mrp/widgets/pages/product-registration-page/use-product-registration-telemetry.ts` | Modify |
| `apps/web/src/ui/mrp/widgets/pages/product-registration-page/index.tsx` | Modify |
| `apps/web/src/ui/mrp/widgets/pages/product-registration-page/product-registration-form/index.tsx` | Modify |

- **State ownership.** `useProductRegistrationPage` owns the two string values (default `''`),
  their change handlers (`setFormValue` with validation and form-error clearing, like the other
  fields) and derived booleans for each field's visibility under FR-01. It never clears a value
  when a field hides (FR-02) and never copies one value into the other (FR-06).
- **Payload.** `buildProductRegistrationInput` adds `resalePrice` and `accompanimentPrice` only
  when the field is visible and non-empty, parsed with the existing `parseBrazilianDecimal`.
  `PRODUCT_REGISTRATION_ERROR_FIELDS`, `ProductRegistrationFieldErrors` and
  `PRODUCT_CREATION_SCALAR_FIELDS` add both fields.
- **Rendering.** The Catálogo card renders the price row after the Categorias fieldset, as its
  last element. A child widget (proposed `product-registration-form/product-sale-price-fields/`,
  `ProductSalePriceFields`, a pure prop renderer with an exported props type and no hook) renders
  one or two affixed inputs using the `CurrentUnitCostField` pattern from the handoff: label,
  `R$` prefix, `Input` with `inputMode='decimal'`, `placeholder='0,00'` and
  `data-focus-ring='delegated'`, the hint, and an error with ids such as
  `resale-price-error`/`accompaniment-price-error`. `aria-describedby` references the hint and,
  when present, the error. The grid is `grid gap-3 sm:grid-cols-2`. Use `type='text'` (matching
  the Accompaniment dialog's `PriceInput`) so a comma is preserved.
- **Sizes state.** The same hook owns `sizes` (a `SizeDraft` list with stable ids, like brands),
  `isSizesSectionVisible` (Porção selected, any stock control) and the handlers to add, change and
  remove rows (`handleAddSize`, `handleSizeChange`, `handleRemoveSize`). It starts with one empty
  row, never clears rows when the section hides (FR-12) and keeps the rows when Porção toggles.
  `buildProductRegistrationInput` adds `sizes` only when the section is visible and at least one
  row is not completely empty, parsed with `parseBrazilianDecimal`; fully empty rows are
  omitted. `PRODUCT_REGISTRATION_ERROR_FIELDS` and the row error mapping add the size fields.
- **Sizes rendering.** A new section widget (proposed `product-registration-page/product-size-fields/`
  with a nested row widget) is rendered by `ProductRegistrationPage` as a child of
  `ProductRegistrationForm`, before `ProductStockControlCard`, so it sits between the Catálogo and
  Estoque cards inside the same `<form>`; it receives rows, errors, the product unit and
  callbacks. Rows reuse the affixed-input pattern (`R$` price prefix), show the unit beside
  Quantidade, expose `Adicionar tamanho` and `Remover tamanho <n>` buttons and stack on narrow
  screens (`grid gap-3 sm:grid-cols-…`).
- **Feedback.** Client errors render beside each field. Server failures keep the current
  page-level `role='alert'` and entered values (Q11). No toast or navigation changes; success
  still opens the product page.

#### REST

`MrpService.registerProduct` (`apps/web/src/rest/services/mrp-service.ts`) is reused; it posts
the widened `RegisterProductInput` to `/products`. No route or REST service change.

### Cross-layer flow and decisions

```text
Web form (visible, valid strings) → buildProductRegistrationInput (numbers, visible only)
  → POST /products → ZodValidationPipe(registerProductSchema)  [422 on malformed]
  → RegisterProductUseCase.validateActor/validateInput         [403/400, nothing persisted]
  → MrpDatabase.run: products.add(+accompanimentPrice)
      → resale_configurations.add(isActive true)               [same transaction]
      → product_sizes.add × n (isActive true, input order)     [same transaction]
      → global rows → stock → stock alert + ProductCreatedEvent outbox
  → 201 Product → Web navigates to the product page
PDV: MrpSalesCatalogProvider reads resale_configurations, product_sizes and products.accompaniment_price
```

| Decision | Chosen approach | Alternative | Reason and accepted trade-off |
| --- | --- | --- | --- |
| Body shape | Flat optional `resalePrice`, `accompanimentPrice` | Nested `resaleConfiguration` object | Matches existing field names; availability is fixed at registration. |
| Prices that do not apply | 400, nothing persisted | Silently ignore | Backend stays authoritative and never drops data; Web never sends hidden prices. |
| Resale rule | Shared `ResalePriceValidationStrategy` | Private check only in registration | Core Rule for reused rules; also bounds the Prices page below 10^16. Expands mutation scope to the Resale save use case. |
| Sales-configuration event | Not published at registration | Publish for uniformity | Only consumer is combo revalidation, which cannot involve a new product. |
| Hidden values | Kept, restored, not validated or sent | Clear on hide | Satisfies "without discarding entered values"; hidden fields cannot block submit. |
| Sizes at registration | Optional `sizes` array in the registration transaction | Separate calls per size after registration | Atomic (invariant 5) and backend-authoritative; Web never composes a partial result. |
| Shared size rule | `ProductSizeValidationStrategy` for registration, add-size and edit-size, with upper bounds | Duplicate private checks | Core Rule for reused rules; also bounds the Prices-page add and edit below the numeric limits. Accepted trade-off: those saves now reject 10^15/10^16 and floating point artifacts with 400 (422 by schema) instead of a persistence failure or acceptance; the Prices-page size form is unchanged and shows such a value through its existing save-error feedback. |
| Duplicate size names in one request | 400 before the transaction | 409 from the unique index | A request defect, not a conflict with stored data; Core validates the unique-name rule first and the index remains a backstop. |
| Server error display | Page-level alert | Field-level mapping | No shared REST error-contract change; client validation uses identical rules. |

## 4. Verification Contract

| Acceptance | Checker and permitted boundary | Expected assertion | Evidence target |
| --- | --- | --- | --- |
| AC-01 | `use-product-registration-page.test.ts` (owning hook); `product-registration-page.test.tsx` (page with mocked hook, new props and handlers wired); `product-registration-form.test.tsx` (form with mocked props); `apps/web/tests/mrp/new-product-page.test.tsx` (mocked route); MV-01 | Visibility booleans for every matrix row; labels render or are absent by accessible name; other values preserved | evaluation.md |
| AC-02 | Page hook test; page component test (retained value rendered when shown); route suite request body | Hidden invalid value yields no error and no payload key; re-shown field returns the typed value | evaluation.md |
| AC-03 | Page hook test; page component test (field errors passed through); form component test; route suite (asserts no POST); MV-01 | Field error text, `aria-invalid`, `aria-describedby`; parsed numbers for valid inputs | evaluation.md |
| AC-04 | `register-product-use-case.test.ts`; `register-product.controller.test.ts`; MV-01 | `resaleConfigurationsRepository.add` called with null brand, price and `isActive: true`; persisted row via fixture; pricing read reports available | evaluation.md |
| AC-05 | Core use-case test; controller test; MV-01 | `productsRepository.add` receives `accompanimentPrice` 0 or 2.9; persisted value; Link dialog prefill and `Grátis` in PDV | evaluation.md |
| AC-06 | Core use-case test; controller test; route suite payload | No Resale `add` call or row; no `accompanimentPrice` key; null persisted price | evaluation.md |
| AC-07 | Form component test; page hook test; controller test; MV-01 | No `Usar preço de revenda` control; payload carries typed values only; stored values unchanged by a later Resale save | evaluation.md |
| AC-08 | Core use-case test (`it.each` rejection table asserting no `database.run`); controller test (422/400 matrix with no persisted product, balance, transaction or Resale row); page component test (page-level alert); route suite with mocked 400 | Exact statuses and no side effects; alert visible and values preserved in Web | evaluation.md |
| AC-09 | Controller test (anonymous 401, Operator 403, foreign Manager 404 on `GET /products/:productId/pricing` and its own same-name registration); Core use-case test (Operator `AuthorizationError`) | No persisted product for rejected actors; establishment-scoped rows | evaluation.md |
| AC-10 | Core use-case test (rejected `resaleConfigurationsRepository.add` propagates inside `database.run`); controller test with a fixture-installed failure on `resale_configurations` insert, following the `mrp-controller-test-helpers.ts` trigger pattern | No product, row, balance, transaction or outbox event after failure | evaluation.md |
| AC-11 | `save-product-resale-configuration-use-case.test.ts`; `save-single-resale-configuration.controller.test.ts`; `save-brand-resale-configuration.controller.test.ts` | 10^16 rejected (Core 400, HTTP 422) with each configuration unchanged; `1234567.89` saves on both routes | evaluation.md |
| AC-12 | Form component test (accessible names, descriptions, prefix, hint); MV-01 Playwright CLI captures compared with `k4tYU`, `o5ZnH`, `SvYqt`, `IYhx0`, `n1BjGx` | Visual match per handoff checklist; keyboard order; no overflow at 390px | evaluation.md (`EV-*`, Type visual) |
| AC-13 | Page hook test (section visibility under both stock controls, add/remove rows); page component test (composition with the real section); sizes-section direct-prop test (rows, unit label, actions); route suite; MV-02 | Section present with one empty row for Porção, absent otherwise; row count follows the actions | evaluation.md |
| AC-14 | Page hook test; page and size-section component tests (field errors, `aria-invalid`, `aria-describedby`); route suite (asserts no POST); MV-02 | Empty row ignored; each invalid row reports its fields and blocks submit with values kept; duplicate reported on the later row; valid rows parsed as numbers | evaluation.md |
| AC-15 | Page hook test; route suite request body | No `sizes` key and no size errors after unselecting Porção; rows restored when re-selected | evaluation.md |
| AC-16 | Core use-case test (`productSizesRepository.add` per size, `isActive: true`, trimmed name, same `database.run`); controller test (persisted rows via fixture, pricing read); MV-02 | Rows persisted for both stock controls; none without `sizes` | evaluation.md |
| AC-17 | Core use-case test (`it.each` rejection table asserting no `database.run`); controller test (422/400 matrix with no persisted product, size, balance, transaction or event); page component test (page-level alert); route suite with mocked 400 | Exact statuses and no side effects; alert visible and values preserved in Web | evaluation.md |
| AC-18 | Controller test (anonymous 401, Operator 403, foreign Manager's own-establishment sizes and same names); Core use-case test (Operator `AuthorizationError`) | No persisted rows for rejected actors; establishment-scoped rows | evaluation.md |
| AC-19 | Core use-case test (rejected second `productSizesRepository.add` propagates inside `database.run`); controller test with a fixture-installed failure on the second `product_sizes` insert, following `mrp-controller-test-helpers.ts` | No product, size, accompaniment row, balance, transaction or event after failure | evaluation.md |
| AC-20 | `register-product-size-use-case.test.ts`; `update-product-size-use-case.test.ts`; add-size and edit-size controller tests | 10^16 price and 10^15 quantity rejected (Core 400, HTTP 422) with sizes unchanged; valid size saves; boundary values just below each limit save and 3/2 decimal places pass while 4/3 fail | evaluation.md |
| AC-21 | Size-section component test (accessible names, descriptions, prefix, unit, actions, row order); MV-02 Playwright CLI captures compared with the new references | Visual match per handoff checklist; keyboard order; no overflow at 390px | evaluation.md (`EV-*`, Type visual) |

Web component tests mock the owning page hook per Widget Testing Rules. The page component test
(`product-registration-page/tests/product-registration-page.test.tsx`) covers the new values and
handlers it passes down. Because the new price-fields child exposes its own public controls,
it receives a focused direct-prop test in its own `tests/` directory (for example
`product-sale-price-fields/tests/product-sale-price-fields.test.tsx`) covering each visibility
combination, labels, prefix, hint, error descriptions and change delegation, in addition to
the real composition rendered by `product-registration-form.test.tsx`. The sizes section gets the
same treatment (for example `product-size-fields/tests/product-size-fields.test.tsx`: rows, unit
label, add/remove, per-field errors and change delegation), and its owning page hook test covers
visibility, retention and payload building. Query/action hooks, REST
services, repositories, schemas and Strategies get no direct tests. Route-suite coverage uses
mocked transport and is not real integration evidence.

**Mutation testing.** Targets: `src/mrp/use-cases/register-product-use-case.ts` and
`src/mrp/use-cases/save-product-resale-configuration-use-case.ts` (ACs 04, 05, 06, 08, 10, 11) and
`src/mrp/use-cases/register-product-size-use-case.ts` and `src/mrp/use-cases/update-product-size-use-case.ts` (AC-20), plus the new size branches of
`register-product-use-case.ts` (ACs 16–19).
Pass conditions:

- each target scores at least 70%;
- no surviving or uncovered mutant remains in the use-case-side new branches: price eligibility,
  price validation, conditional `accompanimentPrice` spread, Resale `add`, size eligibility,
  size result handling, duplicate-name and size `add`, unless Evaluation records it as
  equivalent with a reason. The bounds and decimal rules live in Strategies, which Stryker does
  not mutate; their semantic evidence is the boundary assertions of the consuming suites (just
  below and at 10^15 and 10^16, and 3 versus 4 and 2 versus 3 decimals), recorded in Evaluation;
- an execution error or `RuntimeError` is not counted as killed and must be resolved or
  recorded as a blocker;
- Core CI's hybrid gate (module ≥ 70%, unchanged files not below their target-branch score) passes.

| Command | Purpose and prerequisites |
| --- | --- |
| `pnpm --filter @scoops/core check:code`, `check:architecture`, `check:types`, `test:coverage` | Core static checks and use-case suites with coverage floors |
| `pnpm --filter @scoops/core test:mutation --files src/mrp/use-cases/register-product-use-case.ts src/mrp/use-cases/save-product-resale-configuration-use-case.ts src/mrp/use-cases/register-product-size-use-case.ts src/mrp/use-cases/update-product-size-use-case.ts` | Targeted mutation evidence; Node.js ≥ 22.18 |
| `pnpm --filter @scoops/validation check:code`, `check:architecture`, `check:types` | Validation schemas |
| `pnpm --filter server check:code`, `check:architecture`, `check:types`, `test:coverage`, `build` | Server checks; controller tests need a Docker-compatible runtime |
| `pnpm --filter web check:code`, `check:architecture`, `check:types`, `test:coverage`, `build` | Web checks and widget suites |
| `pnpm --filter web exec playwright test tests/mrp/new-product-page.test.tsx --workers=1` then `pnpm --filter web test:integration` | Mocked route suite (default port 4001) |
| `pnpm check:test-integrity` | Test ownership boundaries |
| `pnpm check:architecture` | Dependency direction across workspaces |
| `pnpm --filter @scoops/core check:complexity`, `pnpm --filter @scoops/validation check:complexity`, `pnpm --filter server check:complexity`, `pnpm --filter web check:complexity` | CodeMultiVitals baseline gate run by each workspace's CI `Complexity` job; `RegisterProductUseCase` gains branches |
| `pnpm check:spec-implementation -- documentation/features/mrp/product-registration-and-stock-brand-controls/changes/registration-sale-prices/spec.md` | Structural check of the `Modify` path rows only; proposed new files are described in prose and are not classified |

REST parity: `products.rest` must include `resalePrice` and `accompanimentPrice` in a
registration example; record route/example parity separately in Evaluation.

### MV-01 — Manager registers priced products

- **Acceptance:** AC-01, AC-03, AC-04, AC-05, AC-07, AC-12.
- **Prerequisites:** Docker PostgreSQL healthy; `pnpm --filter server dev` on `http://localhost:3336`
  and `pnpm --filter web dev` on `http://localhost:4000`; seeded Manager account and its stored
  Playwright state (run `pnpm --filter server db:seed` explicitly only if accounts are missing,
  then `pnpm --filter web test:auth:setup`); at least one Portion product with an active size;
  unique product names per run.
- **Viewport and reference:** 1440 × 900 (`k4tYU`, `o5ZnH`, `SvYqt`, `IYhx0`) and 390 × 844 (`n1BjGx`).

1. Open `/products/new` as Manager.
2. With only Ingrediente selected, confirm no price field; capture and compare with `k4tYU`.
3. Select Revenda only; confirm `Preço de revenda` with prefix, placeholder and hint; compare with `o5ZnH`.
4. Switch to Acompanhamento only; compare with `SvYqt` (price row, hint and layout).
5. Select both; type `12,00` in Resale; confirm the Accompaniment field stays empty and no suggestion exists; compare with `IYhx0`.
6. Type `-1` in Accompaniment and submit; confirm the field error, no `POST /products`, and preserved values; capture the error state.
7. Untick and re-tick Revenda; confirm `12,00` returns (capture). Select Por marca; confirm both fields disappear; return to Estoque único.
8. Using keyboard only from Nome, Tab through Unidade, the categories and both prices; fix Accompaniment to `0`, set initial stock `10`, submit with Enter on `Criar produto`.
9. Confirm navigation to the new product page and a 201 `POST /products` whose body contains `resalePrice: 12` and `accompanimentPrice: 0`.
10. Open Preços and confirm the Resale configuration at R$ 12,00 is available.
11. Open the Portion's Acompanhamentos tab, start `Vincular acompanhamento`, select the new product and confirm the price prefilled as `0,00`; cancel without saving.
12. Open `/sales/new` and confirm the Resale product is offered at R$ 12,00.
13. Repeat steps 1, 3–5 and 8 at 390 × 844; confirm stacked fields, no horizontal scroll, and compare with `n1BjGx`.

**Expected proof:** visible states above, final URL `/products/<id>`, request bodies and 201
responses, Prices and PDV reads; no console errors, hydration warnings or unexpected 4xx/5xx
(classify any as fixed, pre-existing or blocking).

**Capture and comparison:** fresh Playwright CLI screenshots under
`apps/web/.playwright-cli/screenshots/`, compared with the mapped references using the handoff
checklist; record paths and results as `EV-*` rows (Type visual) in Evaluation.

**Cleanup:** stop the dev servers started for the run; leave Docker services running; restore any
task-modified tracked Playwright auth state. Test products remain as ordinary local data.

### MV-02 — Manager registers a Portion with sizes

- **Acceptance:** AC-13, AC-14, AC-16, AC-21.
- **Prerequisites:** as `MV-01`; unique product names per run.
- **Viewport and reference:** 1440 × 900 and 390 × 844 against the new Portion references.

1. Open `/products/new` as Manager and select Porção; confirm the `Tamanhos e preços` card appears
   between Catálogo and Estoque with one empty row; capture and compare.
2. Click `Adicionar tamanho`; fill `Pequeno` / `0,3` / `9,90`, then fill only the Nome of a third
   row and submit; confirm the row errors, no `POST /products` and preserved values; capture the
   error state.
3. Use the same names `Médio` and ` médio ` in two rows; confirm the duplicate error; fix it, remove
   the partly filled row and leave one empty row.
4. Unselect and re-select Porção; confirm the rows return. Switch to `Por marca` and confirm the
   section stays for the Portion.
5. Enter an initial stock of at least the largest size quantity. Using the keyboard only, Tab
   through Nome, Quantidade, Preço and `Remover` of each row and submit with Enter on
   `Criar produto`.
6. Confirm a 201 `POST /products` whose body contains the `sizes` array with numbers, the
   navigation to the new product, and `Preços` → `Tamanhos` listing the sizes as active.
7. With an initial stock of at least the largest size quantity, open `/sales/new` and confirm the
   Portion is offered with `A partir de R$ 9,90` and its sizes available.
8. Repeat steps 1–3 at 390 × 844; confirm stacked fields, no horizontal scroll and compare with the
   narrow reference.

**Expected proof, capture and cleanup:** as `MV-01`.

## 5. Documentation alignment and revision history

| Authority | Applies to | Alignment |
| --- | --- | --- |
| `documentation/prds/mrp.md` PRQ-01, PRQ-05, PRQ-08, PRQ-09, Journeys B and G | Product behavior | PRQ-01 Experience and the PRQ-09 registration paragraph amended on 2026-10-19 (approved Q10) to remove the suggestion. Amended again on 2026-10-20 (approved amendment Q13) for Portion sizes at registration: PRQ-01 Provides, Capabilities and Experience, PRQ-09 Capabilities, Journey B and the "Portion without sizes" exception. Other statements confirmed. |
| Issue #66 | Source scope and acceptance | Amended on 2026-10-19 (approved Q10) to remove the suggestion; amended on 2026-10-20 (approved amendment Q13): new title `Implement sale prices and sizes on product registration`, size scope and acceptance criteria. |
| `documentation/architecture.md` §2, §7, §8, §12, §13 | Authority, tenancy, atomicity, form validation | Confirmed. |
| `documentation/modules.md` | MRP owns prices; PDV consumes | Confirmed; no PDV change. |
| `documentation/design.md` | Inputs with prefix, tokens, focus | Confirmed; mapped in the handoff. |
| `documentation/tooling.md` | Commands, mutation, coverage, Playwright | Confirmed. |
| `documentation/rules/core-package-rules.md` | Strategies for the reused Resale and size rules; one type per file | Confirmed. |
| `documentation/rules/use-case-testing-rules.md` | Core test placement and mocks | Confirmed. |
| `documentation/rules/validation-package-rules.md` | Schema placement and exports | Confirmed. |
| `documentation/rules/rest-layer-rules.md` | Controller, DTO documentation, `.rest` parity | Confirmed. |
| `documentation/rules/controllers-testing-rules.md` | Controller integration tests and fixtures | Confirmed. |
| `documentation/rules/database-layer-rules.md` | Repositories reused; no repository tests | Confirmed; no migration. |
| `documentation/rules/ui-layer-rules.md` | Widget structure, hooks, pt-BR labels, focus | Confirmed. |
| `documentation/rules/widget-testing-rules.md` | Hook/component/route test boundaries | Confirmed. |
| `documentation/rules/code-conventions-rules.md` | Naming, class-owned helpers, `AppError` | Confirmed. |

Contract baseline: branch `feat/new-product-price-field` at `3ecf49f2`. The PRD amendment,
this Spec and its design bundle are uncommitted working-tree changes until the delivery commit.
The Issue #66 amendments are already published on GitHub. Revision 4 reopens a delivery whose
revision 3 Evaluation was `ready`; evidence for behavior the amendment does not touch (prices,
Resale rule, hidden-price retention) stays reusable, and evidence for visibility, Core, schemas,
the registration page and the design is reassessed.

| Revision | Date | Material change and reason |
| --- | --- | --- |
| 4 | 2026-10-20 | Added Portion sizes and their prices at registration (PRD, Issue #66, Spec): `Tamanhos e preços` section, optional `sizes` array saved atomically, shared size rule with bounds, `RegisterProductSizeUseCase` reuse, new design references. AC-01 stops promising Fabricável + Revenda, which is tracked as a separate Issue. |
| 3 | 2026-10-19 | Scope reduced back to the registration price fields at the user's request: Portion + Accompaniment products and PDV stock consolidation removed, with their PRD, Issue and design changes reverted. Contract content matches the reviewed revision 1. |
| 2 | 2026-10-19 | Added Portion + Accompaniment products and PDV stock consolidation (withdrawn in revision 3). |
| 1 | 2026-10-19 | Initial contract from Issue #66 after clarification Q1–Q12; suggestion removed with PRD and Issue amendments. Independent review corrections applied (complexity and spec-path checks, unified Resale decimal check, page/child widget and By-brand checkers, rollout order). |
