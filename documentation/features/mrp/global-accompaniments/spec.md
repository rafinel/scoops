---
title: Global accompaniments
status: open
revision: 1
source:
  type: issue
  ref: https://github.com/rafinel/scoops/issues/61
scope:
  - MRP global accompaniments, Portion accompaniment links, category and product lifecycle, persistence, REST and Web
  - Accompaniment types page usage presentation
  - PDV catalog, order registration and Combo consumption of materialized accompaniment rows
last_updated_at: 2026-10-17
---

# Global accompaniments

## 1. Context and scope

**Objective:** A Manager makes an Accompaniment product available to every Portion of the
establishment with one configuration. Operators find it in every Portion in New Sale and in Combo
components exactly as if it were linked to each Portion.

**Source/depth:** [Issue #61](https://github.com/rafinel/scoops/issues/61), `complete`. The change
spans a new persistent aggregate, MRP use cases on four lifecycle paths, REST, Web dialogs and PDV
consumption, with concurrency and data-preservation risk on existing links.

**Baseline and gap:** Each Portion↔Accompaniment pairing is one `product_accompaniments` row with
type and quantity; brand is the target's current main brand resolved on read; the sale price is
product-owned (`products.accompaniment_price`). PDV identifies an accompaniment by that row's id
in the catalog (`accompanimentId`), carts, Combo components, preview tokens, order snapshots and
the cost provider. No global concept exists: a Manager must link the same product to every Portion
individually, and new Portions start empty.

**Included:** global creation from Link and Edit, in-place conversion of individual links,
shared editing, locked switch, one-Portion and all-Portion removal, linking again, Portion
coverage on registration and category changes, Link candidates, table badge/order/description,
types page status without counts, product lifecycle rules, seed data, PDV proof.

**Exclusions:** per-Portion overrides of type, quantity or price for a global; accompaniment type
management beyond removing the usage count (approved exception below); accompaniment price rules
(PRQ-09); PDV pricing, Combo discount rules, order snapshots or any PDV code/visual change;
historical order rewrites; PDV production code (PDV tests and fixtures change only); telemetry; removal/unit-change impact copy; migration of the existing
hand-rolled PDV switches.

**Approved exception to the Issue:** Issue #61 lists "Changes to accompaniment types and their
management page" as out of scope. Q43 removes the `N vínculos` usage text from the types table
for every type (status badge only). This aligns with the amended PRD ("usage status without link
counts"). Per Q51, a type used by a global (even one with no Portion rows) counts as in use: it shows `Em uso` and cannot be removed.

**Resolved decisions (clarification ledger Q1–Q50, confirmed 2026-10-17):**

- Q1 materialized rows: a `global_accompaniments` record holds the shared type and quantity; every
  Portion has an ordinary `product_accompaniments` row referencing it.
- Q2 every product with the Portion category receives globals, whatever its status, including
  products registered later or gaining the category later. Q3a losing the Portion category drops
  its global rows without blocking; Q3b losing the Accompaniment category stays blocked by rows.
- Q4 Edit of an individual row can turn global on. Q5 linking a removed global again uses the
  locked global presentation and edits apply everywhere. Q6 the Link list excludes products
  already present on the Portion. Q10 conversion keeps existing row ids. Q49 Link starts with
  empty Type/Quantity; Edit keeps the row values.
- Q7/Q46/Q47 required design states were added before authoring. Q8/Q18/Q19/Q28/Q29 REST
  contract. Q11–Q17 Core shape, errors and republishing. Q20 globals listed first. Q21/Q22
  last-write-wins under the serializable runner. Q23–Q25 persistence. Q26/Q43 types page without
  counts; Q27/Q44 impact counts unchanged. Q30–Q36 Web. Q37 no PDV visual change. Q9/Q38/Q45 seed.
  Q39–Q42 verification. Q48 `hasOtherPortionLinks`. Q50 a global with no rows is deleted with its
  product or when the product loses the Accompaniment category. Q51 a global's type counts as
  type usage even when the global has no Portion rows.
- Seed: Granola is the seeded global; Granola R$ 3,00, Banana fatiada R$ 2,00, Morango R$ 2,50 and
  Creme de avelã R$ 4,00 receive accompaniment prices. The existing seed link to the
  Ingredient-only `Calda de chocolate` stays unpriced and unchanged.

| Source requirement | Coverage | Boundary |
| --- | --- | --- |
| MRP PRQ-08 | full (global accompaniments) | Every global-accompaniment Capability and Experience statement, including the 2026-10-17 amendment. Non-global link and type behavior is retained, except the types usage count. |
| MRP PRQ-09 | partial | Product-owned price stays shared for globals; no price-rule change. |
| MRP PRQ-01 / PRQ-05 | partial | Portion/Accompaniment category changes and product deletion with globals. |
| MRP PRQ-10 | partial | Accessible, keyboard-operable, responsive dialogs and table states. |
| PDV PRQ-03 | partial (consumer proof) | Globals appear with product price and identical stock consumption; no PDV code change. |
| PDV PRQ-13 | partial (consumer proof) | Combo components accept globals; revalidation unchanged. |

Journeys: MRP Journey G (Manager configures accompaniments) supplies MV-01; PDV Journey F
(Operator adds a Portion) and Journey C (Manager creates a Combo) supply MV-03.

## 2. Behavior Contract

| ID | PRQ/source coverage | Required behavior |
| --- | --- | --- |
| FR-01 | MRP PRQ-08 | In Link, a Manager can turn on `Disponível para todas as porções` for an eligible candidate. Saving creates one global with the confirmed type and quantity, and every Portion of the establishment shows the accompaniment. Eligibility, price and main-brand rules are those of a link. |
| FR-02 | MRP PRQ-08 | An Accompaniment product is either global or individually linked, never both. Making a product global converts its existing individual rows in place (same row ids, shared type/quantity) and adds rows for every other Portion. Before saving, Link/Edit state the replacement when the product has individual links on other Portions. |
| FR-03 | MRP PRQ-08 | Edit of an individual row shows the switch off and enabled; turning it on and saving behaves as FR-02 with the edited values. |
| FR-04 | MRP PRQ-08, PRQ-09 | A global has one shared type, quantity and product-owned price, and the brand context is the product's current main brand. Saving Edit from any Portion changes every Portion. Edit shows the switch on and locked with help pointing to `Remover`; no Edit request can end global status. |
| FR-05 | MRP PRQ-08, PRQ-01 | Every product with the Portion category has a row for every global, regardless of status, including products registered later and products that gain the Portion category. Losing the Portion category removes that product's global rows and is not blocked by them; the global continues elsewhere. |
| FR-06 | MRP PRQ-08 | Removing a global row offers `Remover de todas as porções`. Off: only this Portion's row is removed; other and new Portions keep it. On: every row and the global are removed, and new Portions do not receive it. Stock balances never change. A global whose last row is removed with the switch off still applies to new Portions. |
| FR-07 | MRP PRQ-08 | On a Portion where a global was removed, the Link list offers it; choosing it shows the locked global state with shared values. Saving restores exactly one row there and applies any shared edits to every Portion. |
| FR-08 | MRP PRQ-08 | The Link list contains only eligible Accompaniment products not already present on this Portion, individually or globally, with the facts needed for FR-01/02/07. |
| FR-09 | MRP PRQ-08, PRQ-05 | The Portion table lists global rows first, then individual rows, each by name; global rows show a `Global` badge; the description always states that global items appear in all Portions. No Portion count appears in the global notice, table description or removal dialogs. Operators see the badge and description without actions. |
| FR-10 | PDV PRQ-03, PRQ-13, MRP PRQ-08, PRQ-09 | New Sale and Combo components offer a Portion's global accompaniments exactly like individual ones: same product-owned price (`Grátis` when zero), quantity-per-portion consumption from the current main brand when By brand, Combo matching and revalidation, and snapshots. Registered orders are unchanged. |
| FR-11 | MRP PRQ-08, PRQ-01, PRQ-05 | Inactivated and deleted Accompaniment products behave for globals as for links. Removing the Accompaniment category is blocked while global rows exist (existing per-Portion dependency list). A global with no rows is deleted when its product is deleted or loses the Accompaniment category. Removal and unit-change impact counts treat global rows as links. |
| FR-12 | MRP PRQ-08 | Only Managers create, edit, remove globals and read Link candidates; Operators read Portion accompaniments. Every read/write is establishment-scoped, and each operation commits atomically or not at all. |
| FR-13 | MRP PRQ-08 (types page, amended) | The accompaniment types table shows `Em uso`/`Disponível` without any link count. A type referenced by an individual row, a global row or a global record (including one with no rows) is in use: it shows `Em uso` and removal is rejected with the existing in-use conflict. |
| FR-14 | MRP PRQ-08, PRQ-10 | Dialogs and tables work on desktop and narrow screens and by keyboard. The switch state, the locked state (with reason), the replacement notice and the removal scope/consequence are announced to assistive technology. |

| ID | FR coverage | Requirement | Given | When | Then | Expected evidence |
| --- | --- | --- | --- | --- | --- | --- |
| AC-01 | FR-01, FR-05, FR-09 | Enable a new global | Three Portions (one inactive) and an eligible priced candidate without links | Manager links it on Portion A with the switch on | One global and one row per Portion with the shared type/quantity; A's table shows it first with `Global`; B and the inactive C show it; response `isGlobal: true` | Core Link test; `link-product-accompaniment` + `get-product-accompaniments` controllers; Web dialog/table tests; MV-01 |
| AC-02 | FR-01, FR-14 | Switch and global notice | Link dialog for a non-global candidate | Manager toggles the switch by mouse and Space | Switch `role="switch"` reflects `aria-checked`; global notice appears as polite status; payload carries `isGlobal: true` | Web dialog tests; route suite body assertion; MV-01 keyboard |
| AC-03 | FR-02, FR-14 | Replacement in place | Candidate linked individually to Portions B and C with differing type/quantity, referenced by an active Combo | Manager enables global on A with new type/quantity | Notice shown before save; B and C rows keep their ids with shared values and `globalAccompanimentId`; A gets a row; Combo stays active; no product is both global and individual | Core Link test; Link + PDV Combo/revalidate controller tests; Web dialog test; MV-01 |
| AC-04 | FR-03 | Convert from Edit | Individual row on A; product also linked individually on B (`hasOtherPortionLinks: true`) | Manager turns the switch on in Edit and saves | Replacement notice shown; same conversion as AC-03; when `hasOtherPortionLinks` is false only the global notice shows | Core Update test; update controller; Web dialog test |
| AC-05 | FR-04, FR-14 | Shared edit and locked switch | Global present on A and B | Manager edits type, quantity and price from A | B shows the new values; switch is on, focusable, `aria-disabled`, described by the locked help; PATCH `isGlobal: false` returns 400 with no change | Core Update test; update + get controllers; Web dialog test; MV-01 |
| AC-06 | FR-06, FR-14 | Removal scopes | Global on A, B; balances recorded | Remove from A with switch off; later remove from B with switch on | Off: only A's row removed, B and a newly registered Portion keep it; On: all rows and the global removed, new Portions do not receive it; balances unchanged; DELETE without scope removes only this Portion; `scope=all` on an individual row returns 400 | Core Remove test; remove controller; Web removal dialog tests; route suite query assertion; MV-01 |
| AC-07 | FR-07, FR-08 | Link again | Global removed from A only | Manager opens Link on A and selects it | Candidate is offered with `isGlobal` and shared values; dialog locked; save creates exactly one row on A and applies edited values everywhere; POST `isGlobal: false` for a global returns 409 | Core Link + Candidates tests; candidates + link controllers; Web dialog test; MV-01 |
| AC-08 | FR-08, FR-12 | Candidates | Products: eligible, already individual on A, global present on A, global removed from A, inactive, Portion, other tenant | Manager reads candidates for A; Operator reads them | Only eligible absent products returned, ordered by name, with `isGlobal`, `hasPortionLinks`, price and shared values; Operator 403; foreign Portion 404 | Core Candidates test; candidates controller |
| AC-09 | FR-05, FR-11 | Category and registration coverage | Globals exist | Register a Portion; add Portion to an Ingredient; remove Portion from a Portion that has only global rows; try removing Accompaniment from a global product with rows; remove it from a row-less global's product | New/added Portions receive rows; Portion removal succeeds and drops its global rows; Accompaniment removal is blocked by rows; the row-less global is deleted with the category change; preview reports the same dependencies | Core Register/ChangeCategories/Preview tests; register-product + change-product-categories controllers; MV-01 |
| AC-10 | FR-09, FR-12 | Table and Operator | Portion with two globals and three individual rows | Manager and Operator open the tab | Globals first then by name; `Global` badges; description line; Operator sees no Link/Edit/Remove; no Portion counts | Get controller (order, `isGlobal`); Web table/card tests; MV-02 |
| AC-11 | FR-10 | PDV consumption | Portion with a global and an individual accompaniment, priced; By-brand global target | Read order catalog, preview and register an order; create a Combo with the global | Both appear with product price; consumption = quantity × units from the main brand; snapshot stores the row id; Combo saved active and later revalidated after a global edit | PDV `list-order-catalog`, `register-order`, `create-combo`, `update-combo`, revalidate job tests; MV-03 |
| AC-12 | FR-13 | Types page status | Types unused, used by an individual row, and used only by a global with no Portion rows | Manager opens Accompaniment types and tries to remove the global-only type | Only `Em uso`/`Disponível`, no `Uso` column or count; the global-only type shows `Em uso`; its removal returns 409 "O tipo de acompanhamento está em uso." with no change | Core `remove-accompaniment-type-use-case.test.ts` and `list-accompaniment-types-use-case.test.ts`; `remove-accompaniment-type` and `list-accompaniment-types` controllers; Web types table test; route test; MV-01 capture |
| AC-13 | FR-11 | Product lifecycle | Global whose product is inactivated, then deleted | Read Portion tables, catalog and Link candidates | Inactive: rows kept, PDV shows it unavailable, not a candidate; deleted: rows and global removed, Portions republished, historical orders unchanged | Core RemoveProduct test; remove-product + order catalog controllers |
| AC-14 | FR-12 | Authorization, tenancy, atomicity | Operator, foreign-tenant ids, or a failure after partial work | POST/PATCH/DELETE/GET candidates | 403/404 with no change; a failing step rolls back global, rows and events together | Core tests (forbidden/not found/no repository writes after failure); controller tests asserting persisted state |
| AC-15 | FR-14 | Accessibility and responsive | Desktop 1560 × 1178 and narrow 390 × 844 | Operate Link/Edit/Remove by keyboard | Focus order reaches switch, notices are announced, locked reason announced, removal consequence updates as status, focus returns to trigger; no overflow; captures match references | Web tests (roles/ARIA); MV-01 at both viewports; Visual Reviewer |

### Design Contract

Use [design/handoff.md](./design/handoff.md) and its ten saved, visually inspected references:
populated table `b1dyL`; Link off `iSdux`; Link global `zN1rE`; Link replacement `ymvAn`; Edit
individual `DT6Vc`; Edit global locked `DyrWo`; Link again locked `y7dXvq`; removal dialogs
`q2gZuS`/`C8la0H`; types page `A5c2Q`. Node IDs are provenance only; implementation and review
use the saved bundle without Pencil.

Runtime comparisons use 1560 × 1178 desktop and 390 × 844 narrow viewports. Narrow, Operator,
loading and error states have no dedicated frames; existing Scoops patterns govern them and MV
captures record their comparison. Required tokens and measurements, the destructive switch tone,
the 60% locked row and notice placements are in the handoff. Preserve visible focus, readable
wrapping, contrast, dialog focus return and reduced motion.

## 3. Technical Contract

This section lists expected changes, not completed work. Existing paths were verified on
2026-10-17; `[create]` names are proposed and may be adjusted within the Rules. Public fields,
routes, table/constraint semantics, atomicity and the generated migration location are contract.
Snippets are illustrative partial deltas based on current types.

### Cross-layer flow

```text
Web Link/Edit/Remove ──REST──▶ MRP controllers ──▶ Core use case (database.run, serializable, 1 retry)
                                                     ├─ GlobalAccompanimentsRepository (record)
                                                     ├─ ProductAccompanimentsRepository (rows)
                                                     ├─ GlobalAccompanimentRowsStrategy (Portions × globals)
                                                     └─ publishAffectedProductSalesConfigurations
                                                          └─ outbox: mrp/product.sales-configuration-changed (per Portion)
                                                                └─ PDV revalidate-combos job (unchanged)
PDV catalog / preview / register / cost provider ──▶ product_accompaniments rows (unchanged readers)
```

| Decision | Chosen approach | Alternative | Reason and accepted trade-off |
| --- | --- | --- | --- |
| Persistence | Materialized rows referencing a global record (Q1) | Derived links ∪ globals − exclusions | PDV, Combos, costs and type usage keep reading row ids unchanged; every Portion-creating path must materialize rows. |
| Conversion | In place, keeping row ids (Q10) | Delete and recreate | Combos and carts referencing the rows stay valid; consumed quantity may change. |
| Republishing | Existing per-Portion `sales-configuration-changed` events, skipped for no-op edits (Q17) | New global event and PDV job | No new messaging; N outbox rows per global change. |
| Concurrency | Serializable runner with one retry, last write wins (Q21/Q22) | Optimistic version or explicit locks | Matches existing links; a conflict that still fails after the retry returns the generic error. |
| Deletion | RESTRICT FKs with explicit removal by use cases (Q23) | Cascades | Every deletion is explicit and auditable in use cases. |

### packages/core

```text
packages/core/src/mrp/
├── domain/
│   ├── entities/
│   │   ├── global-accompaniment.ts                          [create]
│   │   ├── product-accompaniment.ts                         [modify] + globalAccompanimentId?
│   │   ├── index.ts                                         [modify]
│   │   └── fakers/{global-accompaniment-faker.ts [create], product-accompaniment-faker.ts [modify], index.ts [modify]}
│   ├── structures/
│   │   ├── accompaniment-removal-scope.ts                   [create]
│   │   ├── product-accompaniment-candidate.ts               [create]
│   │   ├── global-accompaniment-create.ts                   [create]
│   │   ├── global-accompaniment-update.ts                   [create]
│   │   ├── link-product-accompaniment-input.ts              [modify]
│   │   ├── update-product-accompaniment-input.ts            [modify]
│   │   ├── product-accompaniment-details.ts                 [modify]
│   │   └── index.ts                                         [modify]
│   └── strategies/{global-accompaniment-rows-strategy.ts [create], index.ts [modify]}
├── interfaces/
│   ├── global-accompaniments-repository.ts                  [create]
│   ├── product-accompaniments-repository.ts                 [modify]
│   ├── products-repository.ts                               [modify] unpaginated read by category
│   ├── mrp-database.ts                                      [modify]
│   ├── mrp-service.ts                                       [modify]
│   └── index.ts                                             [modify]
└── use-cases/
    ├── link-product-accompaniment-use-case.ts               [modify]
    ├── update-product-accompaniment-use-case.ts             [modify]
    ├── remove-product-accompaniment-use-case.ts             [modify]
    ├── get-product-accompaniments-use-case.ts               [modify]
    ├── list-product-accompaniment-candidates-use-case.ts    [create]
    ├── list-accompaniment-types-use-case.ts                 [modify]
    ├── remove-accompaniment-type-use-case.ts                [modify]
    ├── register-product-use-case.ts                         [modify]
    ├── change-product-categories-use-case.ts                [modify]
    ├── preview-product-category-removal-use-case.ts         [modify]
    ├── remove-product-use-case.ts                           [modify]
    ├── index.ts                                             [modify]
    └── tests/<one test per use case above>                  [modify; create for candidates]
```

PDV Core (`pdv/**`) and PDV providers (`MrpSalesCatalogProvider`, `MrpOrderCostProvider`, `MrpStockProvider`) are unchanged and keep reading rows by id. PDV test-only changes: `apps/server/src/pdv/fixtures/pdv-module-fixture.ts` [modify] (global accessor), `list-order-catalog`, `register-order`, `create-combo`, `update-combo` controller tests and `revalidate-combos-for-product-job.test.ts` [modify].

#### Domain

**Entities.** `GlobalAccompaniment` is an entity because it is referenced, edited and removed
independently. `ProductAccompaniment` gains an optional reference.

```ts
// global-accompaniment.ts [create] — illustrative
export type GlobalAccompaniment = Entity & {
  establishmentId: string
  accompanimentProductId: string
  accompanimentTypeId: string
  quantityPerPortion: number
  createdAt: Date
  updatedAt: Date
}

// product-accompaniment.ts [modify] — existing fields omitted
export type ProductAccompaniment = Entity & {
  // ...establishmentId, productId, accompanimentProductId, accompanimentTypeId, quantityPerPortion, timestamps
  globalAccompanimentId?: string
}
```

`ProductAccompanimentCreate` remains derived from the entity and therefore accepts
`globalAccompanimentId`. `GlobalAccompanimentCreate`/`GlobalAccompanimentUpdate` mirror the
existing create/update structure pattern. `GlobalAccompanimentFaker` follows the `fake`/`fakeMany`
convention; `ProductAccompanimentFaker` keeps individual rows by default.

**Structures.**

```ts
export const AccompanimentRemovalScope = { Portion: 'portion', All: 'all' } as const
export type AccompanimentRemovalScope =
  (typeof AccompanimentRemovalScope)[keyof typeof AccompanimentRemovalScope]

// link/update inputs [modify]
isGlobal?: boolean // POST: omitted = false; PATCH: omitted = keep

// product-accompaniment-details.ts [modify] — existing fields kept
isGlobal: boolean
hasOtherPortionLinks: boolean // individual rows of the same product on other Portions; false for global rows

// product-accompaniment-candidate.ts [create]
export type ProductAccompanimentCandidate = {
  productId: string
  name: string
  unit: ProductUnit
  stockControl: ProductStockControl
  accompanimentPrice: number | null
  isGlobal: boolean
  hasPortionLinks: boolean
  global?: { accompanimentTypeId: string; quantityPerPortion: number }
}
```

**Strategy.** `GlobalAccompanimentRowsStrategy implements BusinessRuleStrategy<Input, Output>` is a
pure function: given globals, Portion product ids and existing `(productId, accompanimentProductId)`
pairs, it returns the `ProductAccompanimentCreate[]` still missing (shared type and quantity, the
global id). It never loads or persists data and is tested through the Link, Update,
RegisterProduct and ChangeProductCategories use cases.

**Errors and events.** No new error classes or events. New messages use existing shared errors:

| Case | Error | Message |
| --- | --- | --- |
| PATCH `isGlobal: false` on a global row | `BadRequestError` | Um acompanhamento global só deixa de ser global pela remoção de todas as porções. |
| POST without `isGlobal: true` for a global product | `ConflictError` | Este acompanhamento é global. Ative “Disponível para todas as porções” para vinculá-lo a esta porção. |
| POST for a product already present on the Portion | `ConflictError` (existing) | O acompanhamento já está vinculado a esta porção. |
| DELETE `scope=all` on an individual row | `BadRequestError` | Somente acompanhamentos globais podem ser removidos de todas as porções. |
| Ineligible target, missing price/main brand, foreign tenant, Operator | existing | existing |

The existing `mrp/product.sales-configuration-changed` event is reused.

#### Use cases

All writes run inside one `database.run` (serializable, one retry). Every request is checked for
Manager profile (reads: Manager or Operator where already allowed) and establishment ownership of
the Portion, target, type, row and global.

| Use case | Action | Contract |
| --- | --- | --- |
| `LinkProductAccompanimentUseCase` | Modify | `isGlobal` false/omitted: today's individual link, plus 409 when the target is global. `isGlobal: true` and target not global: validate as a link, save price, create the global, convert the target's individual rows (none may be on this Portion; that is the existing 409), add missing rows for every Portion via the Strategy, republish all affected Portions. `isGlobal: true` and target global: 409 if this Portion has its row; otherwise update the global and all rows when type/quantity changed, add this Portion's row, republish. Returns this Portion's row details. |
| `UpdateProductAccompanimentUseCase` | Modify | Global row: `isGlobal: false` → 400; otherwise update global + every row (and price) and republish only on change. Individual row with `isGlobal: true`: convert as in Link using the edited values. Individual row otherwise: unchanged behavior. |
| `RemoveProductAccompanimentUseCase` | Modify | Accepts optional `scope`. Individual row: `all` → 400; else unchanged. Global row: `portion`/omitted removes only this row; `all` removes every row of the global, then the global. Republishes affected Portions. Never touches stock. |
| `GetProductAccompanimentsUseCase` | Modify | Adds `isGlobal` and `hasOtherPortionLinks`; orders global rows first, then by name, then id. |
| `ListProductAccompanimentCandidatesUseCase` | Create | Manager only; owner must be a Portion in the establishment. Returns active, Accompaniment, non-Portion products of the establishment except the owner and products with a row on this Portion, ordered by name, unpaginated, with candidate facts. |
| `RegisterProductUseCase` | Modify | When the new product has the Portion category, add a row for every global of the establishment (Strategy + `addMany`) in the same transaction. |
| `ChangeProductCategoriesUseCase` | Modify | Gaining Portion: add global rows. Losing Portion: global rows are not dependencies and are removed; individual rows still block. Losing Accompaniment: rows (global or individual) still block with the existing dependency list; a global with no rows is deleted. |
| `ListAccompanimentTypesUseCase` | Modify | Usage (`usageCount` > 0 ⇒ in use) includes rows and global records referencing the type; the API field is kept. |
| `RemoveAccompanimentTypeUseCase` | Modify | Rejects with the existing `ConflictError('O tipo de acompanhamento está em uso.')` when rows or a global reference the type, before any delete. |
| `PreviewProductCategoryRemovalUseCase` | Modify | Reports the same dependencies as `ChangeProductCategoriesUseCase` (global rows excluded from `portion-accompaniment`). |
| `RemoveProductUseCase` | Modify | Deleting an Accompaniment product removes its rows (existing) and its global; deleting a Portion removes its rows (existing) and leaves globals. Republishing unchanged. |

Accepted existing deviation: MRP use cases already instantiate `GetAffectedProductSalesConfigurationsUseCase` and call `publishAffectedProductSalesConfigurations`; no new caller is added beyond use cases already using it (RegisterProduct does not republish). Republishing reuses `GetAffectedProductSalesConfigurationsUseCase` with the accompaniment product
inverse lookup so every affected Portion emits one event; no event is published when a PATCH
changes nothing.

#### Interfaces

```ts
// global-accompaniments-repository.ts [create]
export interface GlobalAccompanimentsRepository {
  add(input: GlobalAccompanimentCreate): Promise<GlobalAccompaniment>
  addMany(inputs: readonly GlobalAccompanimentCreate[]): Promise<GlobalAccompaniment[]>
  findById(establishmentId: string, globalAccompanimentId: string): Promise<GlobalAccompaniment | undefined>
  findByAccompanimentProductId(establishmentId: string, accompanimentProductId: string): Promise<GlobalAccompaniment | undefined>
  findManyByEstablishmentId(establishmentId: string): Promise<readonly GlobalAccompaniment[]>
  replace(establishmentId: string, globalAccompanimentId: string, changes: GlobalAccompanimentUpdate): Promise<GlobalAccompaniment>
  remove(establishmentId: string, globalAccompanimentId: string): Promise<void>
  removeAll(): Promise<void>
}

// product-accompaniments-repository.ts [modify] — additions; names adjustable under the Rules
addMany(inputs: readonly ProductAccompanimentCreate[]): Promise<ProductAccompaniment[]>
replaceManyByGlobalAccompanimentId(establishmentId: string, globalAccompanimentId: string, changes: ProductAccompanimentUpdate): Promise<void>
replaceManyByAccompanimentProductId(establishmentId: string, accompanimentProductId: string, changes: ProductAccompanimentUpdate & { globalAccompanimentId: string }): Promise<void> // in-place conversion
removeByGlobalAccompanimentId(establishmentId: string, globalAccompanimentId: string): Promise<void>

// global-accompaniments-repository.ts — also
countByTypeId(establishmentId: string, typeId: string): Promise<number>
```

`DrizzleAccompanimentTypesRepository.findPage` counts global records in `usageCount` alongside rows.

`ProductsRepository` [modify] gains an unpaginated, establishment-scoped read by category (e.g. `findManyByCategory(establishmentId, category)`); Core applies status filters. The paginated `findMany(ProductListParams)` must not be used to enumerate Portions or candidates. Counting and listing used for dependencies may need a global/individual distinction; the
implementer may add a narrowly named method rather than filtering in adapters. `MrpDatabaseRepositories`
gains a required `globalAccompanimentsRepository`; use cases that build their scope by hand (e.g. `ChangeProductUnitUseCase`) pass it. The exported but unused `CreateProductUseCase` is out of scope and does not materialize globals. `MrpService` gains
`listProductAccompanimentCandidates(productId)` and `removeProductAccompaniment(productId, linkId, scope?)`;
link/update inputs carry `isGlobal`.

### packages/validation

```text
packages/validation/src/
├── mrp/link-product-accompaniment-schema.ts                 [modify] isGlobal: z.boolean().optional()
├── mrp/update-product-accompaniment-schema.ts               [modify] isGlobal: z.boolean().optional()
├── mrp/remove-product-accompaniment-query-schema.ts         [create] { scope?: z.enum(AccompanimentRemovalScope) }
├── web/product-accompaniment-form-schema.ts                 [modify] isGlobal: z.boolean()
└── index.ts                                                 [modify]
```

All schemas stay `.strict()`. They validate syntax only; eligibility, exclusivity and scope rules
remain in Core.

### apps/server

#### REST

```text
apps/server/
├── rest-client/mrp/products.rest                            [modify]
└── src/mrp/
    ├── rest/controllers/
    │   ├── list-product-accompaniment-candidates.controller.ts [create]
    │   ├── link-product-accompaniment.controller.ts          [modify]
    │   ├── update-product-accompaniment.controller.ts        [modify]
    │   ├── remove-product-accompaniment.controller.ts        [modify]
    │   ├── get-product-accompaniments.controller.ts          [modify]
    │   └── tests/                                            [modify; create candidates test]
    ├── rest/dtos/
    │   ├── product-accompaniment-candidate-response.dto.ts   [create]
    │   ├── product-accompaniment-candidate-global-response.dto.ts [create] nested `global`
    │   └── product-accompaniments-response.dto.ts            [modify]
    ├── rest/schemas/product-schemas.ts                       [modify]
    ├── database/drizzle/repositories/drizzle-products-repository.ts [modify] unpaginated read by category
    ├── fixtures/mrp-module-fixture.ts                        [modify]
    └── mrp.module.ts                                         [modify]
```

| Method and path | Auth | Request | Success | Errors |
| --- | --- | --- | --- | --- |
| `GET /products/:productId/accompaniments` | Manager, Operator | — | 200 rows + `isGlobal`, `hasOtherPortionLinks`, globals first | existing |
| `GET /products/:productId/accompaniments/candidates` | Manager | — | 200 `ProductAccompanimentCandidate[]` | 403, 404 owner, 400 non-Portion |
| `POST /products/:productId/accompaniments` | Manager | existing body + `isGlobal?` | 201 this Portion's row details | 400, 403, 404, 409 (present / global without `isGlobal`), 422 |
| `PATCH /products/:productId/accompaniments/:linkId` | Manager | existing body + `isGlobal?` | 200 row details | 400 (incl. `isGlobal: false` on global), 403, 404, 422 |
| `DELETE /products/:productId/accompaniments/:linkId?scope=portion\|all` | Manager | query `scope?` | 204 | 400 (`all` on individual), 403, 404, 422 |

Controllers keep one use case each, extract `scope` with the shared query schema through
`ZodValidationPipe`, document every status with `@ApiResponse`, and use response DTOs with
`static from`. `products.rest` gains examples for `isGlobal` on POST/PATCH, both DELETE scopes and
candidates. Deployed web builds remain compatible: omitted `isGlobal`/`scope` keep today's
behavior.

#### Database

```text
apps/server/src/
├── mrp/database/
│   ├── drizzle/models/{global-accompaniment-model.ts [create], product-accompaniment-model.ts [modify], index.ts [modify]}
│   ├── drizzle/types/entities/{global-accompaniment.ts [create], index.ts [modify]}
│   ├── drizzle/mappers/{drizzle-global-accompaniment-mapper.ts [create], drizzle-product-accompaniment-mapper.ts [modify], index.ts [modify]}
│   ├── drizzle/repositories/{drizzle-global-accompaniments-repository.ts [create], drizzle-product-accompaniments-repository.ts [modify], drizzle-accompaniment-types-repository.ts [modify], drizzle-mrp-database.ts [modify], index.ts [modify]}
│   ├── mrp-repositories.ts, mrp-database.module.ts          [modify]
│   └── mrp-seeder.ts                                        [modify]
├── mrp/constants/mrp-repositories.ts                        [modify] globalAccompaniments Symbol token
└── shared/database/
    ├── seed.ts                                              [modify]
    └── drizzle/migrations/<next>_global_accompaniments.sql + meta/*  [generate]
```

**`global_accompaniments` [create]**

| Column | Type | Constraint |
| --- | --- | --- |
| `id` | uuid | PK |
| `establishment_id` | uuid | not null |
| `accompaniment_product_id` | uuid | not null, FK `products.id` ON DELETE RESTRICT |
| `accompaniment_type_id` | uuid | not null, FK `accompaniment_types.id` ON DELETE RESTRICT |
| `quantity_per_portion` | numeric(18,3) | not null, check `> 0` |
| `created_at`, `updated_at` | timestamptz | not null |

Indexes: unique `(establishment_id, accompaniment_product_id)`; unique `(id, accompaniment_product_id)`
as the composite FK target; index `(establishment_id, accompaniment_type_id)`.

**`product_accompaniments` [modify]**

- add `global_accompaniment_id uuid null`;
- composite FK `(global_accompaniment_id, accompaniment_product_id)` →
  `global_accompaniments(id, accompaniment_product_id)` ON DELETE RESTRICT, so a row cannot point to
  another product's global;
- index `(establishment_id, global_accompaniment_id)`;
- existing unique `(establishment_id, product_id, accompaniment_product_id)`, checks and FKs kept.

Global rows carry the shared `accompaniment_type_id` and `quantity_per_portion`, updated with the
global in the same transaction. Mutual exclusivity (global xor individual) is enforced by the use
cases inside the serializable transaction. Repositories filter every query by
`establishment_id`, map rows through mappers (`null` → `undefined`), implement `addMany` as one
batch insert (empty input returns `[]` without a query), and translate constraint violations to
`ConflictError` as today.

**Migration:** `pnpm --filter server db:migration:generate --name global_accompaniments`. Additive
only; no backfill because no globals exist; existing rows get `null`. The generator assigns the
number and snapshot.

**Seed:** `SEED_PRODUCTS` adds accompaniment prices (Granola 3, Banana fatiada 2, Morango 2.5,
Creme de avelã 4). Granola moves from the individual seed links to a seeded global (type
`Granolas`, quantity 0.05) materialized for every seeded Portion through repository `addMany`.
`MrpSeeder.clear()` removes `product_accompaniments` before `global_accompaniments` and both before
products and types.

### apps/web

#### UI

```text
apps/web/src/ui/
├── shadcn/switch.tsx                                        [create]
├── shared/widgets/components/icon/{types/icon-name.ts, lucide-icon/icons.ts}  [modify] + 'globe'
└── mrp/
    ├── hooks/{mrp-query-keys.ts, use-accompaniment-candidates-query.ts, use-remove-product-accompaniment-action.ts,
    │          use-link-product-accompaniment-action.ts, use-update-product-accompaniment-action.ts} [modify]
    └── widgets/
        ├── pages/accompaniment-types-page/accompaniment-types-table/{index.tsx, tests/*} [modify]
        └── slots/product-accompaniments-slot/
            ├── action-dialogs/index.tsx                     [modify]
            ├── product-accompaniments-card/{index.tsx, tests/*} [modify]
            ├── product-accompaniments-table/
            │   ├── accompaniment-row/{index.tsx [modify], global-badge/index.tsx [create]}
            │   └── tests/*                                  [modify]
            ├── product-accompaniment-dialog/
            │   ├── product-accompaniment-dialog-fields/
            │   │   ├── global-field/{index.tsx, use-global-field.ts}       [create]
            │   │   ├── global-scope-notice/index.tsx                       [create]
            │   │   ├── global-replacement-notice/index.tsx                 [create]
            │   │   ├── candidate-select/                                   [modify]
            │   │   └── index.tsx                                           [modify]
            │   ├── use-product-accompaniment-{form,derived-state,submit,queries}.ts [modify]
            │   └── tests/*                                  [modify]
            └── remove-global-accompaniment-dialog/
                ├── index.tsx, use-remove-global-accompaniment-dialog.ts    [create]
                └── tests/*                                  [create]
```

- **Switch primitive:** `ui/shadcn/switch.tsx` wraps `@base-ui/react/switch` (`role="switch"`,
  `aria-checked`, keyboard Space), default `border`/`primary` tone and a destructive tone, shared
  focus ring, reduced-motion safe. The PDV hand-rolled switches are not migrated.
- **Link/Edit dialog state** (owned by the dialog hooks):
  - `isGlobal` form value defaults: Link `false`; Link with a global candidate `true` (locked) with
    shared Type/Quantity/price prefilled; Edit of a global row `true` (locked); Edit of an individual
    row `false` (enabled).
  - Locked: switch focusable with `aria-disabled="true"`, `aria-describedby` → locked help "Aparece
    em todas as porções, incluindo as novas. Para deixar de ser global, use Remover na tabela.";
    row at 60% opacity. Unlocked help: "Aparece em todas as porções, incluindo as novas. Tipo,
    quantidade e preço são compartilhados."
  - Global notice "Acompanhamento global: as alterações valem para todas as porções." at the top
    of the body whenever the switch is on (`role="status"`).
  - Replacement notice (copy in the handoff) below the switch row when the switch is on, not
    locked, and `candidate.hasPortionLinks` (Link) or `item.hasOtherPortionLinks` (Edit) is true;
    `role="status"` and referenced by the switch `aria-describedby`.
  - Link with a non-global candidate keeps Type/Quantity empty when the switch is turned on (Q49).
  - Submit: POST sends `isGlobal` only when on; PATCH sends `isGlobal: true` when on and omits it
    otherwise. Server errors stay inline (`role="alert"`) and preserve entered values.
- **Candidates:** the Link select uses the candidates query (key includes the Portion id); it no
  longer filters the generic product list client-side.
- **Table/card:** rows render in server order; `GlobalBadge` (`Badge` `bg-accent
  text-accent-foreground`, `Icon globe`, text `Global`) beside the name; description line always
  includes "Itens globais aparecem em todas as porções."; Operator view unchanged (no actions).
- **Removal:** `ActionDialogs` routes global rows to `RemoveGlobalAccompanimentDialog` (copy and
  states per handoff; switch off on every open; consequence `role="status"`; labels `Remover desta
  porção`/`Remover de todas`, pending `Removendo…`; inline `role="alert"` error preserving the switch;
  focus returns to the row's Remove button). Individual rows keep `RemoveProductAccompanimentDialog`.
- **Types table:** remove the `Uso` header and cell; status badge derives from `usageCount > 0`.
- **Cache:** Link, Update and both Remove scopes invalidate `mrpQueryKeys.products()` (all Portion
  accompaniments and candidates).
- No telemetry is added. No route or route constant changes.

#### REST

```text
apps/web/src/rest/services/mrp-service.ts                    [modify]
apps/web/tests/fixtures/mrp-module-fixture.ts                [modify]
apps/web/tests/mrp/{product-accompaniments-page.test.ts, accompaniment-types-page.test.ts} [modify]
```

`MrpService` implements the Core contract: `listProductAccompanimentCandidates(productId)` →
`GET /products/${productId}/accompaniments/candidates`; link/update bodies pass `isGlobal`
through; `removeProductAccompaniment(productId, linkId, scope?)` →
`DELETE /products/${productId}/accompaniments/${linkId}` with `?scope=` only when provided. No
service test files.

## 4. Verification Contract

| Acceptance | Checker and boundary | Expected assertion | Evidence target |
| --- | --- | --- | --- |
| AC-01 | Core `link-product-accompaniment-use-case.test.ts`; Server `link-product-accompaniment` and `get-product-accompaniments` controller tests; Web dialog/table tests; MV-01 | Global + one row per Portion (incl. inactive), shared values, `isGlobal`, ordering; events per Portion | `evaluation.md` |
| AC-02 | Web `product-accompaniment-dialog` tests; route suite `product-accompaniments-page.test.ts` body; MV-01 | Switch role/state, notice status, `isGlobal: true` payload | `evaluation.md` |
| AC-03 | Core Link test; Server link controller + PDV `create-combo`/revalidate job tests; Web dialog test; MV-01 | Rows keep ids with shared values; Combo stays active; replacement notice condition | `evaluation.md` |
| AC-04 | Core `update-product-accompaniment-use-case.test.ts`; update controller; Web dialog test | Conversion from Edit; notice only when `hasOtherPortionLinks` | `evaluation.md` |
| AC-05 | Core Update test; update/get controllers; Web dialog test; MV-01 | Shared propagation; 400 on `isGlobal: false` with no change; locked ARIA | `evaluation.md` |
| AC-06 | Core `remove-product-accompaniment-use-case.test.ts`; remove controller (+ register-product after removal); Web removal dialog tests; route suite `?scope`; MV-01 | Scope semantics, default scope, 400 on individual `all`, balances unchanged | `evaluation.md` |
| AC-07 | Core Link + Candidates tests; candidates/link controllers; Web dialog test; MV-01 | Single restored row; locked prefill; 409 without `isGlobal` | `evaluation.md` |
| AC-08 | Core `list-product-accompaniment-candidates-use-case.test.ts`; candidates controller | Eligibility/exclusion matrix, order, facts, 403/404 | `evaluation.md` |
| AC-09 | Core Register/ChangeCategories/Preview tests; register-product and change-product-categories controllers; MV-01 | Rows on new/added Portions; Portion removal unblocked; Accompaniment removal blocked; row-less global deleted | `evaluation.md` |
| AC-10 | Get controller; Web table/card/slot tests; MV-02 | Order, badge, description, Operator actions hidden, no counts | `evaluation.md` |
| AC-11 | PDV `list-order-catalog`, `register-order`, `create-combo`, `update-combo` controller tests and `revalidate-combos-for-product-job.test.ts`; MV-03 | Price, consumption from main brand, snapshot ids, Combo active after a global edit | `evaluation.md` |
| AC-12 | Core list/remove accompaniment type tests; `list-accompaniment-types` and `remove-accompaniment-type` controllers; Web `accompaniment-types-table` test; route `accompaniment-types-page.test.ts`; MV-01 capture | No `Uso` column or count; global-only type in use and not removable | `evaluation.md` |
| AC-13 | Core `remove-product-use-case.test.ts`; remove-product and order-catalog controllers | Inactive and deleted behavior; global removed with product | `evaluation.md` |
| AC-14 | Core tests (AuthorizationError/NotFoundError); link/update controller tests forcing a mid-transaction constraint failure and asserting no global, rows or outbox events persisted; controllers asserting no change for 403/404 | Rejections leave no partial global/rows/events | `evaluation.md` |
| AC-15 | Web tests (roles, `aria-*`); MV-01 at 1560 × 1178 and 390 × 844; Visual Reviewer | Focus, announcements, no overflow, reference match | `evaluation.md` |

Tests assert behavior through the owning boundaries: Core use-case tests with `vitest-mock-extended`
and fakers (no Strategy, repository, mapper, provider or service tests); Server controller tests
through Supertest, real wiring and Testcontainers; Web widget tests mocking the owning hook plus
hook tests for the dialog hooks; the mocked Playwright route suite for request method/path/body/query.
PDV Web UI does not change and gets no new tests.

**Mutation (Core):** run targeted Stryker for these use cases (AC-01, AC-03–AC-09, AC-12–AC-14):

```bash
pnpm --filter @scoops/core test:mutation --files \
  src/mrp/use-cases/link-product-accompaniment-use-case.ts \
  src/mrp/use-cases/update-product-accompaniment-use-case.ts \
  src/mrp/use-cases/remove-product-accompaniment-use-case.ts \
  src/mrp/use-cases/get-product-accompaniments-use-case.ts \
  src/mrp/use-cases/list-product-accompaniment-candidates-use-case.ts \
  src/mrp/use-cases/register-product-use-case.ts \
  src/mrp/use-cases/change-product-categories-use-case.ts \
  src/mrp/use-cases/preview-product-category-removal-use-case.ts \
  src/mrp/use-cases/remove-product-use-case.ts \
  src/mrp/use-cases/list-accompaniment-types-use-case.ts \
  src/mrp/use-cases/remove-accompaniment-type-use-case.ts
```

Pass conditions: each file ≥ 70% and every unchanged eligible MRP use case preserves its target
score in Core CI; survivors on exclusivity, scope, conversion, materialization and authorization
branches require a test or a recorded equivalent-mutant justification in Evaluation (`EV-*`/`FND-*`).

**Manual validation** (Playwright CLI, real services, seeded Manager/Operator; prerequisites per
AGENTS.md: `docker compose ps`, PostgreSQL, `pnpm --filter server dev`, `pnpm --filter web dev`,
`pnpm --filter server db:seed` only when seed accounts are missing, then
`pnpm --filter web test:auth:setup`; artifacts under `apps/web/.playwright-cli/`):

| ID | ACs | Start | Steps and assertions | Viewports |
| --- | --- | --- | --- | --- |
| MV-01 | AC-01–AC-07, AC-09, AC-12, AC-15 | Manager, `/products/<Açaí tradicional>/accompaniments` | 1) Granola shows `Global`, first, description line. 2) Link Banana fatiada with switch on: replacement notice, save; Banana is global on every Portion with preserved row ids (DB). 3) Edit a global: locked switch; change quantity; another Portion shows it. 4) Remove Granola here (off); other Portions keep it. 5) Link Granola again: locked state; one row returns. 6) Remove Banana from all (on): gone everywhere. 7) Register a Portion; its tab lists Granola. 8) Repeat 2–4 by keyboard (Tab, Space/Enter, Esc) checking focus return and announcements. 9) Open Accompaniment types: no counts. Check network bodies/queries, console and failed requests; capture and compare every referenced state. Cleanup: restore by reseeding only with explicit approval. | 1560 × 1178, 390 × 844 |
| MV-02 | AC-10, AC-14 | Operator, same tab | Badge and description visible; no Link/Edit/Remove; direct PATCH returns 403 with no change. | 1560 × 1178, 390 × 844 |
| MV-03 | AC-11 | Operator `Nova venda`; Manager `Descontos` | Configure Açaí tradicional with Granola (global) and an individual accompaniment; prices include each product price; register; stock history shows Granola quantity × units from its main brand when By brand. Create a Combo including Granola; it saves active. | 1560 × 1178, 390 × 844 |

An independent Visual Reviewer is required after current captures exist, covering all handoff
references at both viewports.

| Command | Purpose and prerequisites |
| --- | --- |
| `pnpm --filter @scoops/core test` | Core use-case tests |
| `pnpm --filter @scoops/core check:code` / `check:types` / `check:architecture` | Core static gates |
| `pnpm --filter @scoops/validation check:code` / `check:types` / `check:architecture` | Validation schemas |
| `pnpm --filter server db:migration:generate --name global_accompaniments` | Generate migration (once) |
| `pnpm --filter server test` | Server controller and job integration (Docker/Testcontainers) |
| `pnpm --filter server check:code` / `check:types` / `check:architecture` / `build` | Server gates |
| `pnpm --filter web test` | Web widget tests |
| `pnpm --filter web exec playwright test tests --workers=1` | Mocked route suite (CI form of `test:integration`) |
| `pnpm --filter web check:code` / `check:types` / `check:architecture` / `build` | Web gates |
| `pnpm check:test-integrity` / `pnpm check:complexity` | Test ownership and complexity baselines |
| `pnpm check:spec-implementation -- documentation/features/mrp/global-accompaniments/spec.md` | Optional structural check of declared artifacts |

REST route/example parity: `apps/server/rest-client/mrp/products.rest` covers every changed or new
route (parity is not integration proof).

## 5. Documentation alignment and revision history

| Authority | Applies to | Alignment |
| --- | --- | --- |
| `documentation/prds/mrp.md` PRQ-08 | Global behavior, Edit lock, replacement notice, linking again, candidates, order, Portion coverage, types usage status | Approved amendment applied 2026-10-17 before this Spec |
| `documentation/prds/mrp.md` PRQ-01/05/09/10 | Categories, product deletion, shared price, states | Confirmed |
| `documentation/prds/pdv.md` PRQ-03/13 | Consumption, Combo components | Confirmed (no change) |
| [Issue #61](https://github.com/rafinel/scoops/issues/61) | Source | Confirmed, with the approved types-page exception |
| `documentation/architecture.md`, `documentation/modules.md` | MRP ownership, atomic writes, tenant scope, events | Confirmed |
| `documentation/design.md` + `design/onoreo.pen` | Tokens, dialogs, switch, badges | Four Link/Edit frames added and `A5c2Q` updated 2026-10-17 (Q46/Q47) |
| `documentation/tooling.md` | Commands, mutation, test integrity | Confirmed |
| Rules: `code-conventions`, `core-package`, `use-case-testing`, `validation-package`, `rest-layer`, `controllers-testing`, `database-layer`, `provision-layer`, `messaging-layer`, `ui-layer`, `widget-testing` | Respective layers | Confirmed |

| Revision | Date | Material change and reason |
| --- | --- | --- |
| 1 | 2026-10-17 | Initial contract from Issue #61, clarification Q1–Q51, independent review corrections and the approved PRQ-08 amendment. |
