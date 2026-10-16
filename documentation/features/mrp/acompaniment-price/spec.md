---
title: Accompaniment product sale price
status: in_progress
revision: 3
source:
  type: issue
  ref: https://github.com/rafinel/scoops/issues/56
scope:
  - MRP categories, product-owned accompaniment price, links, persistence, REST and Web
  - PDV catalog consumption, cart price review and historical snapshots
last_updated_at: 2026-10-15
---

# Accompaniment product sale price

## 1. Context and scope

**Objective:** Managers configure one product-owned Accompaniment sale price through a Portion's Link/Edit dialogs. Every linked Portion and size uses that price for future sales; PDV requires renewed confirmation when it changes during cart assembly.

**Source/depth:** [Issue #56](https://github.com/rafinel/scoops/issues/56), `complete` because the change spans persistence, MRP, PDV, REST and Web. User-approved decisions in this chat supersede the Issue's dedicated Accompaniment Prices page and amend the MRP PRD before this Spec.

**Current behavior/gap:** Product and link response contracts expose no Accompaniment sale price. The table shows `Não disponível`, Link/Edit omit price, and PDV derives an accompaniment's commercial price from acquisition cost multiplied by consumption quantity. The existing PDV preview/registration handshake already rebuilds authoritative facts and can return a repriced cart.

**Included:** Link/Edit price entry, validation, Manager authorization, Operator table inspection, Resale suggestion before first save, shared price propagation, category compatibility, migration, PDV price review and snapshot preservation.

**Exclusions:** A dedicated Accompaniment Prices page/field; link-, type-, Portion- or size-specific prices; payment or inventory-consumption rule changes; order-history rewrites; automatic category remediation or rollout preflight. Existing categories and links remain registered.

**Decision ledger:** Q1 accepted Manager-reviewed first-price initialization; Q2 rejected new Portion+Accompaniment combinations; Q3 required a dedicated Pencil PDV review state; Q4 declined rollout preflight; Q5 removed the Accompaniment-only Prices tab; Q6 allowed shared-price edits in Link/Edit and Operator inspection in linked tables; Q7 limited Accompaniment pricing to Link/Edit even for Accompaniment+Resale. The user confirmed the consolidated contract. Unpriced legacy links are unavailable to future PDV selection until a Manager saves a price. A saved price remains on the product after its last link is removed and can be reused in a later Link action.

| Source requirement | Coverage | Boundary |
| --- | --- | --- |
| MRP PRQ-01 | partial | Reject Portion+Accompaniment on registration/category changes; retain existing rows. |
| MRP PRQ-05 | partial | Category-aware tabs and read-only Operator inspection in linked Portion tables. |
| MRP PRQ-08 | partial | Product-owned price in Link/Edit and table; atomic link/price saves. |
| MRP PRQ-09 | partial | Independent commercial price, initial Resale proposal and future-only consistency. |
| PDV PRQ-03 | partial | Correct Accompaniment price once per selected accompaniment per Portion. |
| PDV PRQ-07 | partial | Current-price revalidation, preserved cart and renewed confirmation. |
| PDV PRQ-09 | partial | Immutable registered-order price snapshots. |

Journey G supplies the end-to-end Manager scenario; PDV Journeys E/H/K and conflict/retry journeys supply assembly, editing and registration context. Partial delivery leaves PRD requirement checkboxes unchecked.

## 2. Behavior Contract

| ID | PRQ/source coverage | Required behavior |
| --- | --- | --- |
| FR-01 | MRP PRQ-01 | New link creation and category changes reject Portion+Accompaniment together. Accompaniment+Resale remains valid. An existing link remains editable when its retained target has both Portion and Accompaniment categories, provided Accompaniment is still present. Existing product categories are not automatically rewritten. |
| FR-02 | MRP PRQ-05, PRQ-09 | Accompaniment alone adds no Prices tab. Accompaniment+Resale retains its Resale Prices page without an Accompaniment price field. Managers configure Accompaniment price only through Link/Edit; Operators inspect it read-only in linked Portion tables. |
| FR-03 | MRP PRQ-08, PRQ-09 | One price belongs to the Accompaniment product, separate from acquisition cost and Resale price. It is finite, non-negative, has at most two decimal places, and is below `10^16` so it fits `numeric(18,2)` as a JavaScript number; the largest accepted value is `9_999_999_999_999_998`. Unset differs from zero; zero means free. |
| FR-04 | MRP PRQ-08, PRQ-09 | Link/Edit prefill the saved price. Before first save, propose the configured Single Resale price or current main brand's configured By-brand Resale price, if available. Otherwise require entry. Opening/closing a dialog writes nothing; after save, Resale/main-brand changes do not synchronize this price. |
| FR-05 | MRP PRQ-08, PRQ-09 | A first link requires a valid saved or entered price. Saving an entered/edited price and a new or edited link is atomic, including affected commercial publication. Failure/cancel preserves data and usable editing context. |
| FR-06 | MRP PRQ-08, PRQ-09 | Every table/link/Portion size uses the same current product price. Quantity, type and brand cost do not scale it. Cost preview stays separate. Either Link/Edit price change updates future commercial facts for every affected Portion. |
| FR-07 | MRP PRQ-09, PDV PRQ-03 | PDV uses the saved product price once per selected accompaniment per Portion, independent of stock consumption quantity or size. An unconfigured price cannot become zero or saleable. Zero displays `Grátis` and remains zero under channel adjustment. |
| FR-08 | PDV PRQ-07 | Registration revalidates current prices. A changed price preserves/recalculates the cart, displays affected item and total values, and requires review followed by new explicit confirmation. Another concurrent change requires review again. |
| FR-09 | MRP PRQ-09, PDV PRQ-09 | Price changes affect future sales. Registered order snapshots retain their captured accompaniment base/final prices, item values and total. |
| FR-10 | MRP PRQ-05, PRQ-08, PRQ-09 | Price reads/writes enforce establishment scope and current product eligibility. Only Managers mutate; Operators have no edit actions. Rejections and persistence/publication failures cannot partially update price, link, order or stock. |

| ID | FR coverage | Requirement | Given | When | Then | Expected evidence |
| --- | --- | --- | --- | --- | --- | --- |
| AC-01 | FR-01 | Category compatibility | New link or category change contains both categories, or an existing link targets a retained dual-category product | Manager submits | Reject new link/category change without category mutation; Accompaniment+Resale succeeds; existing rows are untouched by migration; Edit continues to work when the retained target still has Accompaniment | Core use cases; Server controllers |
| AC-02 | FR-02, FR-10 | Navigation and permissions | Accompaniment-only or Accompaniment+Resale product; Manager/Operator | Open details and linked table | Correct tabs/Resale fields, no dedicated Accompaniment field; Operator reads price without management actions and cannot mutate through HTTP | Web widget/route and Server tests; MV-01 |
| AC-03 | FR-03, FR-04 | Initialization and validation | Unpriced target with applicable Single/By-brand Resale price or no source | Open dialog, cancel, submit invalid or valid/zero amount | Proposal follows exact source without writes on read/cancel; invalid values retain context; saved zero differs from unset; subsequent Resale/main-brand change leaves price unchanged | Core/Server/Web tests; MV-01 |
| AC-04 | FR-05, FR-06, FR-10 | Atomic Link/Edit | Target linked to several Portions or unpriced target being linked | Manager saves price with Link/Edit | One product price and link changes commit together; all linked tables see it; invalid target/tenant/price, cancel or failed transaction commits neither | Core/Server/Web tests; MV-01 |
| AC-05 | FR-03, FR-06 | Cost and price separation | Cost, price, type and per-Portion quantity differ | View/Edit link and change type/quantity | Sale price stays product-owned and unscaled while cost preview reflects consumption | Web consumer and Server tests; MV-01 |
| AC-06 | FR-06, FR-07 | Catalog consistency | Same target linked to two Portions and several sizes | Save/change price or read an unpriced legacy link | Every eligible catalog entry uses saved price; unpriced links remain registered but unavailable; no acquisition-cost fallback | MRP use cases; PDV catalog controller; MV-02 |
| AC-07 | FR-07 | Paid/free calculation | Positive/zero accompaniment price and optional channel | Configure Portion with differing size/consumption quantity | Price adds once, channel rounding follows existing rules, zero displays `Grátis` | PDV use-case/Server and Web consumer tests; MV-02 |
| AC-08 | FR-08, FR-10 | Current price registration | Cart assembled before Manager changes price | Preview/register, then review and confirm again | Current cart/token returned before any order write; renewed confirmation creates one order at current price; retry/concurrent change cannot bypass review | PDV Core/Server tests; MV-02 |
| AC-09 | FR-08 | Accessible price review | Repriced response affects accompaniment/item and total | Review dialog opens at desktop/narrow viewport | Old/new values are readable and announced; keyboard reaches `Revisar valores`, returns to preserved cart and requires explicit confirmation | Web consumer/route tests; MV-02; saved references |
| AC-10 | FR-09 | Historical preservation | Registered order predates price update | Change price and read old/new orders | Existing snapshots/totals stay unchanged; future order captures new price | Server order integration; MV-02 |
| AC-11 | FR-05, FR-10 | Isolation and rollback | Wrong tenant/profile or a price/link/publication failure | Request mutation | Appropriate error and no partial price/link/event/stock/order state; recoverable UI preserves entered context | Core/Server/Web tests; MV-01 |

### Design Contract

Use [design/handoff.md](./design/handoff.md) and its five saved, visually inspected references: populated table, Link, Edit, desktop PDV review and narrow PDV review. The obsolete Accompaniment Prices frame was removed following the approved PRD amendment. Node IDs are provenance only; implementation and review must use saved inputs without Pencil MCP.

Runtime comparisons use 1560 × 1178 desktop and 390 × 844 narrow viewports. Dialog node sizes and PNG shadow bounds are recorded in the handoff. Existing Scoops patterns govern loading/empty/error, unconfigured first-link, Operator read-only and narrow MRP states; supplemental design captures are recommended and deferred with runtime proof required. Preserve visible focus, readable wrapping, contrast, dialog focus return and reduced motion.

## 3. Technical Contract

This section is organized by the actual Scoops workspaces and their owning layers. Unchanged packages/layers are omitted; retained reuse paths explain an affected contract. Action/Path tables list expected implementation changes, not completed work. File trees identify the expected feature footprint against the inspected checkout; they are not claims that implementation exists. Existing paths are evidence of ownership. Proposed internal names may be adjusted within repository Rules; public fields, routes, table semantics, atomicity and generated migration location are contractual. No production code or migration is created by this document.

Code examples are illustrative expected deltas, not drop-in implementations. Preserve omitted existing fields, constructors, authorization and error handling. Core is framework-independent; entities/structures describe data, errors/events belong to Domain, use cases own application actions, and reusable pure business-rule executions use module-owned Strategy classes. No dependency, new external service or new database is required.

### packages/core

**Ownership and execution boundary.** `@scoops/core` remains independent of NestJS, Drizzle, Zod, React, Inngest and browser state. MRP owns the editable Product price and its eligibility decisions. PDV consumes authoritative MRP commercial facts and owns order recalculation, confirmation and historical snapshots. No Core table or migration is introduced; persistence is implemented by Server adapters.

Reusable pure business-rule executions implement the shared domain contract `BusinessRuleStrategy<Input, Output>` from `shared/domain/strategies/business-rule-strategy.ts` and expose `execute(input)`. This is a domain contract, not an infrastructure port. Keep one class per distinct reusable calculation or validation, with explicit input/result boundaries and private helpers for each class's internal decomposition. Use cases compose these Strategies while retaining authorization, fact loading, transaction scope, persistence and event coordination. Strategies do not access repositories/providers or perform side effects; do not add a base class or inheritance hierarchy. In this PDV boundary, the intended classes are `OrderCartPricingStrategy`, `OrderLinePriceStrategy`, `OrderMoneyRoundingStrategy`, `ComboAllocationStrategy`, `OrderPreviewInputValidationStrategy` and `OrderPreviewAccompanimentPriceSnapshotStrategy`. This applies only to the current PDV calculations; MRP entities, structures and existing use cases are not being refactored.

**Expected source tree**

This is a feature impact map, not a requirement to create every listed file. `[change]` marks an existing file expected to change; `[reuse]` marks an existing boundary retained. The shown source paths exist today. Tests stay under the owning use-case `tests` directories. Reusable rule classes belong in the owning module's `domain/strategies` directory and implement the shared `BusinessRuleStrategy<Input, Output>` contract. Do not create `rules`, `policies`, or `services` directories or refactor entities and structures as part of this change.

```text
packages/core/src/
├── mrp/
│   ├── domain/
│   │   ├── entities/
│   │   │   ├── product.ts                                      [change]
│   │   │   ├── product-accompaniment.ts                        [reuse: no price]
│   │   │   └── fakers/product-faker.ts                         [change as needed]
│   │   ├── structures/
│   │   │   ├── product-update.ts                              [change]
│   │   │   ├── product-create.ts                              [reuse: derived from Product]
│   │   │   ├── link-product-accompaniment-input.ts             [change]
│   │   │   ├── update-product-accompaniment-input.ts           [change]
│   │   │   ├── product-pricing-details.ts                     [change]
│   │   │   ├── product-accompaniment-details.ts               [change]
│   │   │   ├── product-sales-configuration.ts                 [change semantics]
│   │   │   └── index.ts                                       [reuse/update only for exports]
│   │   └── events/product-sales-configuration-changed-event.ts [reuse]
│   ├── interfaces/
│   │   ├── mrp-database.ts                                    [reuse]
│   │   ├── products-repository.ts                             [reuse]
│   │   ├── product-accompaniments-repository.ts                [reuse]
│   │   └── mrp-service.ts                                    [reuse signatures; expanded types]
│   └── use-cases/
│       ├── register-product-use-case.ts                       [change]
│       ├── change-product-categories-use-case.ts               [change]
│       ├── get-product-pricing-use-case.ts                     [change]
│       ├── get-product-accompaniments-use-case.ts              [change]
│       ├── link-product-accompaniment-use-case.ts              [change]
│       ├── update-product-accompaniment-use-case.ts            [change]
│       ├── get-affected-product-sales-configurations-use-case.ts [change]
│       └── tests/                                            [change matching use-case suites]
├── pdv/
│   ├── domain/
│   │   ├── strategies/
│   │   │   ├── order-cart-pricing-strategy.ts                  [change: reusable cart pricing]
│   │   │   ├── order-line-price-strategy.ts                    [change: unit price and stock facts]
│   │   │   ├── order-money-rounding-strategy.ts                 [change: shared price rounding]
│   │   │   ├── combo-allocation-strategy.ts                    [change: reusable allocation]
│   │   │   ├── order-preview-input-validation-strategy.ts      [change: shared request validation]
│   │   │   ├── order-preview-accompaniment-price-snapshot-strategy.ts [change: accompaniment price snapshot]
│   │   │   └── index.ts                                        [change: Strategy exports]
│   │   ├── structures/
│   │   │   ├── sales-catalog-accompaniment.ts                 [reuse shape; saved-price meaning]
│   │   │   ├── order-preview.ts                              [change: compose preview facts]
│   │   │   ├── order-preview-accompaniment-price.ts           [create: named preview price fact]
│   │   │   └── index.ts                                       [change: export preview price fact]
│   ├── interfaces/sales-catalog-provider.ts                   [reuse]
│   └── use-cases/
│       ├── order-pricing.ts                                   [remove after moving its calculations]
│       ├── preview-order-use-case.ts                          [reuse/extend assertions]
│       ├── register-order-use-case.ts                         [reuse/extend assertions]
│       └── tests/                                            [change eligible consumer suites]
└── shared/
    ├── domain/
    │   ├── errors/                                            [reuse expected AppError subclasses]
    │   └── strategies/
    │       ├── business-rule-strategy.ts                      [change: shared domain execution contract]
    │       └── index.ts                                       [change: Strategy contract export]
    └── interfaces/
        └── events-repository.ts                               [reuse typed outbox contract]
```

#### Domain

**Expected file actions**

| Path | Change |
| --- | --- |
| `packages/core/src/mrp/domain/entities/product.ts` | Modify |
| `packages/core/src/mrp/domain/structures/product-update.ts` | Modify |
| `packages/core/src/mrp/domain/structures/link-product-accompaniment-input.ts` | Modify |
| `packages/core/src/mrp/domain/structures/update-product-accompaniment-input.ts` | Modify |
| `packages/core/src/mrp/domain/structures/product-pricing-details.ts` | Modify |
| `packages/core/src/mrp/domain/structures/product-accompaniment-details.ts` | Modify |

##### PDV Strategies

Replace the loose, reusable calculations in `pdv/use-cases/order-pricing.ts` with
module-owned Strategy classes. The cart Strategy composes line pricing and Combo
allocation; the use cases supply loaded facts and keep authorization, persistence,
transaction and event orchestration. Keep preview facts and input validation behind
their own Strategies because both preview and registration consume those rules.

| Path | Change |
| --- | --- |
| `packages/core/src/pdv/domain/strategies/order-cart-pricing-strategy.ts` | Create |
| `packages/core/src/pdv/domain/strategies/order-line-price-strategy.ts` | Create |
| `packages/core/src/pdv/domain/strategies/order-money-rounding-strategy.ts` | Create |
| `packages/core/src/pdv/domain/strategies/combo-allocation-strategy.ts` | Create |
| `packages/core/src/pdv/domain/strategies/order-preview-input-validation-strategy.ts` | Create |
| `packages/core/src/pdv/domain/strategies/order-preview-accompaniment-price-snapshot-strategy.ts` | Create |
| `packages/core/src/pdv/domain/strategies/index.ts` | Create |
| `packages/core/src/pdv/domain/structures/order-preview.ts` | Modify |
| `packages/core/src/pdv/domain/structures/order-preview-accompaniment-price.ts` | Create |
| `packages/core/src/pdv/domain/structures/index.ts` | Modify |
| `packages/core/src/shared/domain/strategies/business-rule-strategy.ts` | Create: shared domain execution contract |
| `packages/core/src/shared/domain/strategies/index.ts` | Create: shared Strategy contract export |
| `packages/core/src/pdv/use-cases/order-pricing.ts` | Remove after moving its calculations into Strategies |
| `packages/core/src/pdv/use-cases/index.ts` | Modify: remove loose helper exports |
| `packages/core/src/pdv/use-cases/tests/order-pricing.test.ts` | Remove: retain behavior proof through use cases |
| `packages/core/src/pdv/use-cases/tests/preview-order-use-case.test.ts` | Modify for preview pricing/validation behavior |
| `packages/core/src/pdv/use-cases/tests/register-order-use-case.test.ts` | Modify for registration/snapshot behavior |

Each class implements the shared `BusinessRuleStrategy<Input, Output>` interface and
exposes an `execute(input)` method. Strategy behavior is asserted through the preview
and registration use-case tests; do not add isolated Strategy unit tests. This change
does not convert unrelated Core rules or refactor entities and structures.


##### Entities

`Product` is a plain exported TypeScript type, not an entity class with setters/getters. Add an optional number field to that state type; retain `undefined` for an unsaved Core value, map PostgreSQL NULL to it, and expose explicit `null` in the pricing/detail response fields specified below. Zero is a stored price and must survive conditional spreads and mapping. `ProductAccompaniment` retains only relationship/type/consumption data: neither it nor `ProductSize` receives the global price. Removing links leaves the Product field intact.

Expected additive type deltas (partial declarations; retain all existing fields in their current files):

```ts
// mrp/domain/entities/product.ts — inside the existing Product type
accompanimentPrice?: number

// mrp/domain/structures/product-update.ts — extend the existing Pick<Product, ...>
// with 'accompanimentPrice'. The approved workflow supports numeric writes,
// not a public clear-to-null operation.
```

`ProductCreate` derives from Product, so its TypeScript shape inherits this field. That does not add a registration REST input: initial registration still leaves accompaniment price unset; only Link/Edit exposes its management workflow. Keep ProductFaker defaults valid; use explicit price overrides for unset/zero/paid cases instead of silently pricing every test fixture.

##### Structures

Each exported type remains in its existing individual file; barrels only re-export declarations. Extend both Link/Edit inputs with `readonly accompanimentPrice?: number`. Edit retains no `accompanimentProductId` field: the persisted link supplies its immutable target. Omission means reuse the latest Product value, never clear and never persist a Resale suggestion automatically.

Expected pricing read shape (complete shape after the additive extension):

```ts
// mrp/domain/structures/product-pricing-details.ts
import type { Product } from '#mrp/domain/entities/product.ts'
import type { ProductSizePricing } from '#mrp/domain/structures/product-size-pricing.ts'
import type { ResalePricing } from '#mrp/domain/structures/resale-pricing.ts'

export type ProductPricingDetails = {
  product: Product
  mode: 'portion' | 'resale-single' | 'resale-by-brand' | 'accompaniment'
  sizes: readonly ProductSizePricing[]
  resale: readonly ResalePricing[]
  accompanimentPrice: number | null
  suggestedAccompanimentPrice: number | null
}
```

The added fields are non-mutating projections. For non-Accompaniment products they are null; for Accompaniment-only, mode is `accompaniment` and sizes/resale remain empty. Accompaniment+Resale retains its current Resale mode/arrays. Return the saved price whenever set, including zero. Calculate a suggestion only when unset and a currently applicable Resale configuration exists (Single configuration or current primary brand configuration). No applicable price means null, not cost/zero; reads persist nothing. A saved value remains independent of subsequent Resale/main-brand changes.

`ProductAccompanimentDetails` adds `readonly salePrice: number | null`, leaving `quantityPerPortion`, `unitCost` and `estimatedCost` unchanged. Link/Edit successful results and list rows use the same projection. This allows retained legacy links to communicate unconfigured state without presenting it as Grátis.

`ProductSalesConfiguration` and PDV `SalesCatalogAccompaniment` retain their numeric `basePrice` contract for saleable selections. Its meaning changes from cost-derived data to the saved Product price, applied once per selected accompaniment irrespective of consumption quantity or Portion size. Unpriced targets must not become usable numeric-zero entries; preserve unavailable behavior at both published and live-catalog boundaries. Keep channel and Combo calculations in PDV. Cost projections remain independent MRP facts.

##### Errors

Reuse shared domain `AuthorizationError`, `NotFoundError`, `BadRequestError` and `ConflictError`; they carry no HTTP codes. Manager-only mutation failures occur before writes. Tenant-scoped identifiers fail as not found, including the target derived from an existing link. Reject a submitted price that is non-finite, negative or has more than two decimal places; accept zero. If price is omitted and the current Product has no saved price, reject Link/Edit with the established bad-input path rather than creating a saleable free link. Registration/category changes reject new Portion+Accompaniment combinations while allowing Accompaniment+Resale and preserving existing Portion+Resale restrictions. No rollout data rewrite is introduced. Transaction and current-state conflicts preserve the established conflict behavior.

##### Events

Retain `ProductSalesConfigurationChangedEvent`, `_NAME = 'mrp/product.sales-configuration-changed'`. The existing union payload remains establishment/product identity plus `state: 'available'` with a configuration or `state: 'deleted'` with null. Product changes update the fact timestamp through normal repository mapping. Emit corrected configurations for every affected Portion, not only the Portion whose dialog submitted the change. Use `findManyByAccompanimentProductId(establishmentId, targetProductId)` to discover inverse owners and deduplicate publication targets. Keep the established owner publication for type/quantity/link changes even when price is omitted. Persist events through the active `scope.eventsRepository.add(...)`; Core never calls Inngest directly and never reports a mutation successful before the surrounding database transaction commits.

#### Use cases

**Expected file actions**

| Path | Change |
| --- | --- |
| `packages/core/src/mrp/use-cases/register-product-use-case.ts` | Modify |
| `packages/core/src/mrp/use-cases/change-product-categories-use-case.ts` | Modify |
| `packages/core/src/mrp/use-cases/get-product-pricing-use-case.ts` | Modify |
| `packages/core/src/mrp/use-cases/get-product-accompaniments-use-case.ts` | Modify |
| `packages/core/src/mrp/use-cases/link-product-accompaniment-use-case.ts` | Modify |
| `packages/core/src/mrp/use-cases/update-product-accompaniment-use-case.ts` | Modify |
| `packages/core/src/mrp/use-cases/get-affected-product-sales-configurations-use-case.ts` | Modify |


| Existing use case | Required detailed responsibility |
| --- | --- |
| `RegisterProductUseCase` | Reject an input category list containing Portion and Accompaniment before persistence. Do not set the new price from cost, Resale or an implicit default. Preserve existing stock initialization and registration events. |
| `ChangeProductCategoriesUseCase` | Apply the same incompatibility to newly submitted category changes, retain existing expectedUpdatedAt/dependency/removal rules, and do not clear stored price simply because links/categories change. No automatic remediation of retained rows. |
| `GetProductPricingUseCase` | Add Accompaniment-only support without changing web navigation. Project saved/suggested fields; use tenant-owned Resale configurations and primary-brand selection, not acquisition-cost calculation. Preserve Portion/Resale fields/modes. |
| `GetProductAccompanimentsUseCase` | Join each existing target Product into `salePrice`, including null for unconfigured retained links. Keep unit cost and quantity-derived estimated cost separate. Managers and Operators may read. |
| `LinkProductAccompanimentUseCase` | Verify Manager, tenant owner/target/type, active Accompaniment eligibility, main-brand prerequisites, positive quantity and duplicate link rules. Inside one scope, validate and optionally replace target price, create link, build updated result, resolve all affected Portion facts and insert typed outbox events. |
| `UpdateProductAccompanimentUseCase` | Verify Manager, owner, persisted link and immutable target, then target/type/quantity/price validity. Atomically replace supplied Product price and link type/quantity, return fresh details and publish all affected Portion facts. An omitted price never writes a stale form price. |
| `GetAffectedProductSalesConfigurationsUseCase` | Resolve saved accompaniment price rather than currentUnitCost/package-cost; preserve zero, make unpriced targets unavailable, preserve tenant checks and inverse-owner discovery. Include current Product updatedAt in fact freshness. |
| PDV preview/registration consumers | Preserve existing current-price/token revalidation. A changed or now-unavailable selected accompaniment requires review/correction before an order write. Reconfirmation uses current facts; a further change requires review again. Preserve idempotence, stock atomicity and immutable snapshots. |

Illustrative **private method inside each owning Link/Edit use-case class**, after the caller has established target existence, tenancy and eligibility. This demonstrates the expected delta using real repository contracts; it is not a complete replacement use case. Keep all existing validations and link/outbox work inside the same `database.run` callback. The precision guard compares the supplied value with its two-decimal representation instead of rounding and accepting it. Validation must run before persistence can round input; zero and ordinary decimal values such as 0.29 remain valid.

```ts
// Imports used by the method in the existing use-case file:
import type { Product } from '#mrp/domain/entities/product.ts'
import type { MrpDatabaseRepositories } from '#mrp/interfaces/mrp-database.ts'
import { BadRequestError } from '#shared/domain/errors/index.ts'

// Class member; not a loose function and not a Product method.
private async saveAccompanimentPrice(
  scope: MrpDatabaseRepositories,
  target: Product,
  suppliedPrice: number | undefined,
): Promise<Product> {
  if (suppliedPrice === undefined) {
    if (target.accompanimentPrice === undefined) {
      throw new BadRequestError('Informe o preço de venda do acompanhamento.')
    }
    return target
  }

  if (
    !Number.isFinite(suppliedPrice) ||
    suppliedPrice < 0 ||
    Number(suppliedPrice.toFixed(2)) !== suppliedPrice
  ) {
    throw new BadRequestError(
      'O preço deve ser maior ou igual a zero e ter até duas casas decimais.',
    )
  }

  return scope.productsRepository.replace(target.establishmentId, target.id, {
    accompanimentPrice: suppliedPrice,
  })
}
```

The price method is invoked with the freshly loaded target and `request.input.accompanimentPrice`. Do not use truthiness (`if (price)`) because zero is intentional. Do not convert omitted input to zero or persist the displayed suggestion. Do not open a second transaction or invoke a broker. Repository `replace(establishmentId, productId, changes)` is the existing tenant-aware overload; include only the changed accompaniment field so price writes do not overwrite unrelated Product state.

Transactional order is: authorize and validate request → enter `MrpDatabase.run` → load/check owner/link/target/type/current price → optionally save target price → add/replace link → read fresh output and affected facts → add typed events → return from transaction. If any repository, fact-building or event insert fails, Product/link/outbox changes all roll back. Existing serializable MRP semantics govern competing intentional writes; no new CAS field, automatic application retry or lock-order protocol is introduced. For price changes discover inverse owners from the target ID, otherwise only publishing with owner ID misses other linked Portions.

Expected typed event insertion (excerpt inside the transaction; `configuration` is a resolved `ProductSalesConfiguration`, not a newly invented payload):

```ts
import { ProductSalesConfigurationChangedEvent } from '#mrp/domain/events/product-sales-configuration-changed-event.ts'

await scope.eventsRepository.add(
  new ProductSalesConfigurationChangedEvent({
    establishmentId: request.actor.establishmentId,
    productId: configuration.productId,
    state: 'available',
    configuration,
  }),
)
```

The current Link/Edit source has loose validation helpers and uses a use case as an internal fact-building helper. Implement single-use validations as private methods on the owning class; when a pure rule is intentionally shared, follow the Strategy contract above. Reconcile the affected fact-building composition with current Core Rules at the narrow changed boundary and do not broaden into an unrelated MRP refactor. Routine private decomposition remains an implementation choice; the externally observable pricing, atomicity and publication contract above remains mandatory.

#### Shared contracts

Repository/provider contracts and their method signatures remain reused. Add only the shared domain Strategy execution contract; it is not an integration port.

| Path | Change |
| --- | --- |
| `packages/core/src/shared/domain/strategies/business-rule-strategy.ts` | Create |
| `packages/core/src/shared/domain/strategies/index.ts` | Create |
| `packages/core/package.json` | Modify: export shared and PDV Strategy subpaths |


- **`ProductsRepository`**: retain existing find/replace contracts and tenant-scoped overloads. Extend the `ProductUpdate` data shape to allow the numeric price delta; no separate price repository or raw transaction object enters Core.
- **`ProductAccompanimentsRepository`**: reuse add/replace and inverse lookup. Keep saved sale price off link-create/link-update shapes. Retain target immutability.
- **`MrpDatabase` / `MrpDatabaseRepositories`**: reuse `run<Result>(operation)` and scope repositories, including typed `eventsRepository: Pick<EventsRepository, 'add'>`. The app implementation supplies serializable transactions; Core sees neither Drizzle nor isolation SQL.
- **`MrpService`**: existing get/link/update method signatures continue using expanded shared structures and `RestResponse<T>`. No new accompaniment price endpoint, new service, or exported mutation type is necessary.
- **`SalesCatalogProvider`**: preserve PDV-facing contract and provider-neutral types. MRP owns saved-price/eligibility interpretation; Server provision translates those facts without owning new business rules.
- **Exports**: reuse existing MRP and PDV contracts; add `@scoops/core/pdv/domain/strategies` and `@scoops/core/shared/domain/strategies`. Keep one exported type per file; no HTTP status, SDK/provider client or SQL types in Core.

**Verification ownership:** extend the matching Core use-case tests with typed `vitest-mock-extended` mocks and coherent Product/Accompaniment fixtures. Explicitly cover missing/zero/positive/invalid price, omission versus intentional update, correct target tenant, type/quantity price independence, applicable suggestion selection, no mutation on GET, every inverse owner published, event insertion failure propagation and repeated PDV repricing before an order write. Core mocks prove orchestration; real rollback, mapping and SQL constraints are verified through Server controller integration, not repository/entity tests. Retain the Verification Contract's mutation scope and evidence requirements.

### packages/validation

**Expected file actions**

| Path | Change |
| --- | --- |
| `packages/validation/src/mrp/accompaniment-price-schema.ts` | Create |
| `packages/validation/src/mrp/link-product-accompaniment-schema.ts` | Create |
| `packages/validation/src/mrp/update-product-accompaniment-schema.ts` | Create |
| `packages/validation/src/mrp/product-accompaniment-schema.ts` | Modify |
| `packages/validation/src/web/product-accompaniment-form-schema.ts` | Modify |
| `packages/validation/src/index.ts` | Modify |

Create paths are the proposed schema split already described below; their names may follow the final Rules-compliant implementation. Existing package exports and compatibility re-exports remain aligned.


**Ownership:** shared syntactic input validation for MRP REST and browser forms. Schemas do not authorize Managers, load Products, choose a main brand, decide whether omission is legal, or create prices. Those decisions remain in MRP use cases. Core must not import Zod or this package. No database tables are owned here.

**Expected affected file tree** (`existing` means extend an existing file; `proposed` names are recommended implementation locations, not already present):

```text
packages/validation/
├── package.json                                      [existing; preserve root export]
└── src/
    ├── index.ts                                      [existing; public schema exports]
    ├── mrp/
    │   ├── product-accompaniment-schema.ts            [existing compatibility import boundary]
    │   ├── accompaniment-price-schema.ts             [proposed shared numeric primitive]
    │   ├── link-product-accompaniment-schema.ts       [proposed one primary schema/file]
    │   ├── update-product-accompaniment-schema.ts     [proposed one primary schema/file]
    │   ├── register-product-schema.ts                [existing registration input]
    │   └── change-product-categories-schema.ts        [existing category-change input]
    └── web/
        └── product-accompaniment-form-schema.ts       [existing string-valued form schema]
```

The current `mrp/product-accompaniment-schema.ts` defines both Link and Update schemas and a private quantity schema. Follow the one-public-primary-schema-per-file rule when extending it: move Link and Update into the proposed modules, reuse/extract primitives when shared, preserve named exports from `src/index.ts`, and update internal consumers. A compatibility re-export may preserve the old module during the focused change; it must not duplicate definitions. Internal imports use `.ts`; applications import the package root.

| Input | Required syntax and behavior |
| --- | --- |
| REST `accompanimentPrice` | Optional JSON number; when supplied finite, nonnegative, below `10^16` (maximum accepted JavaScript number `9_999_999_999_999_998`) and at most two decimal places. `0` is valid. Reject strings, `null`, negatives, over-limit/non-finite values and excess precision rather than rounding. Omission means no requested price write; it does not mean zero or clear. |
| Browser price | Required valid decimal text before submitting Link/Edit, allowing the established pt-BR comma convention; normalize only valid input to the numeric REST field. Empty input cannot become `Number('') === 0`. Do not convert invalid punctuation/precision into a silently rounded amount. |
| Link identity | Preserve valid `accompanimentProductId`, `accompanimentTypeId` UUIDs and positive `quantityPerPortion` at current maximum three decimals. Price scale two and quantity scale three are independent. |
| Edit identity | Preserve immutable target by keeping it out of the editable request shape. Existing type/quantity and optional price are the only relevant extensions. |
| Categories | Preserve the shared input shape and derive category syntax from Core `ProductCategory` values. New Portion+Accompaniment rejection and existing Portion+Resale restrictions are authoritative use-case decisions, not new Zod business rules. Consume the resulting domain error in registration/category-change UI without rewriting retained rows; Accompaniment+Resale remains valid. |

Web `zodResolver(productAccompanimentFormSchema)` and server schema parsing must agree on the accepted price syntax after normalization. Form validation may require a displayed value while transport `accompanimentPrice` stays optional: a form showing an unchanged saved price submits type/quantity only. Missing persisted price at execution time is an authoritative use-case failure, not a schema lookup. Existing schema error mapping remains 422; domain/category/current-state outcomes retain the REST contract. Verify schema behavior through consuming controller/widget/route boundaries, not isolated schema tests. Core use-case tests prove the independent authoritative business checks without importing Zod.

### apps/server

#### REST

**Expected file actions**

| Path | Change |
| --- | --- |
| `apps/server/src/mrp/rest/controllers/get-product-pricing.controller.ts` | Modify |
| `apps/server/src/mrp/rest/controllers/get-product-accompaniments.controller.ts` | Modify |
| `apps/server/src/mrp/rest/controllers/link-product-accompaniment.controller.ts` | Modify |
| `apps/server/src/mrp/rest/controllers/update-product-accompaniment.controller.ts` | Modify |
| `apps/server/src/mrp/rest/dtos/product-pricing-response.dto.ts` | Modify |
| `apps/server/src/mrp/rest/dtos/product-accompaniments-response.dto.ts` | Modify |
| `apps/server/src/mrp/rest/schemas/product-schemas.ts` | Modify |
| `apps/server/rest-client/mrp/products.rest` | Modify |


**Ownership and expected files.** Reuse the existing `products` route group and its one-controller-per-action boundaries. `[M]` means an existing implementation expected to change, `[V]` an existing compatibility/verification surface. Trees describe the planned footprint; they do not claim implementation is complete.

```text
apps/server/
├── rest-client/mrp/products.rest                         [M] executable HTTP examples
└── src/
    ├── mrp/
    │   ├── decorators/mrp-controller.ts                  [V] existing products prefix
    │   ├── rest/controllers/
    │   │   ├── get-product-pricing.controller.ts         [M] saved/suggested price read
    │   │   ├── get-product-accompaniments.controller.ts  [M] linked salePrice
    │   │   ├── link-product-accompaniment.controller.ts  [M] optional explicit price
    │   │   ├── update-product-accompaniment.controller.ts[M] optional explicit price
    │   │   ├── register-product.controller.ts            [V] category rejection
    │   │   ├── change-product-categories.controller.ts   [V] category rejection
    │   │   └── tests/<matching-controller>.test.ts       [M] real HTTP + PostgreSQL
    │   ├── rest/dtos/product-pricing-response.dto.ts     [M] nullable price metadata
    │   ├── rest/dtos/product-accompaniments-response.dto.ts [M] existing row projection
    │   ├── rest/schemas/product-schemas.ts               [M] shared-schema consumption
    │   └── fixtures/mrp-module-fixture.ts                [V] tenant/account/domain setup
    ├── pdv/rest/controllers/tests/                      [V] catalog/preview/registration
    └── shared/rest/
        ├── filters/global-error-handler.ts              [V] stable error envelope
        └── tests/                                      [V] existing Nest test lifecycle
```

Controllers extract authenticated `Account`, semantic UUID route parameters and validated input, instantiate their use case once in the constructor, and delegate. Derive `RequestBody` from the use case rather than copying a request DTO. Inject `MrpDatabase` through `MRP_REPOSITORIES.database`; no controller imports concrete Drizzle repositories. Establishment comes from the authenticated actor and is never accepted as a caller-selected mutation scope.

| Boundary | Required extension/compatibility |
| --- | --- |
| GET /products/:productId/pricing | Manager/Operator read, 200. Add saved `accompanimentPrice: number or null` and `suggestedAccompanimentPrice: number or null`. Permit Accompaniment-only reads for dialog data; add mode `accompaniment` for accompaniment-only products while retaining existing Portion/Resale modes and fields. This API support does not add a Prices tab. Suggestion is derived from applicable current Resale config only while no price is saved, and is never persisted by GET. |
| POST /products/:productId/accompaniments | Existing Manager-only link body gains optional `accompanimentPrice: number`. Supplied price saves on target Product in the link transaction; omission reuses current saved price and rejects if absent. Preserve 201 detail response, with saved sale price included. |
| PATCH /products/:productId/accompaniments/:linkId | Existing Manager-only edit body gains optional `accompanimentPrice: number`. Target remains the existing immutable accompaniment product. Update type/quantity and supplied target price atomically; preserve 200 detail response. |
| GET /products/:productId/accompaniments | Existing Manager/Operator detail rows gain `salePrice: number or null`. Null identifies retained unconfigured links and must not render as free. Keep cost/quantity/brand fields separate. |
| Product registration/category change | Existing request shapes; reject newly submitted Portion+Accompaniment combinations. Existing Portion+Resale restriction remains. |


Unauthenticated requests return 401; forbidden profile 403; absent/cross-establishment identifiers 404; transactional/current-state conflicts 409. Keep Swagger DTOs and route-complete examples in `apps/server/rest-client/mrp/products.rest` aligned with Core REST interfaces and Web mapping. No standalone Accompaniment price write endpoint is required.

Existing PDV preview/registration routes and response shapes remain stable: current facts/token may produce `repriced` before order creation.

**Serialization and compatibility.** Nullable response fields are present as JSON `null` when unconfigured; explicit `0` stays numeric zero. A request price is optional but, when present, is a JSON number, not `null` or a localized currency string. Do not add a price to the link persistence entity merely to construct `salePrice`. Join/resolve target Product facts in the owning Core read/mutation response. Add Swagger descriptions for saved versus suggested values and nullable examples. A GET performs no initialization write. A submitted unchanged price is omitted by Web, while Server independently reloads the current target state before deciding whether an omitted price is permitted. An old client that omits price remains compatible when the target is configured; first setup without a current price is rejected.

**Boundary evidence.** Maintain current success statuses and the existing error envelope `{ statusCode, title, message, timestamp, path }`. Cover valid `0`, positive values, missing first price, excessive precision, negative/nonfinite input, immutable target, duplicate link, unauthorized/Operator writes, cross-establishment Product/type/link references and rollback. Schema-invalid input is 422, domain-invalid price/category is 400, absent or cross-establishment identifiers 404, and transaction/current-state conflict 409. Unexpected errors retain generic 500 handling. Controller tests use `MrpModuleFixture`/`RestFixture`/`DatabaseFixture` with real repositories and migrated PostgreSQL; do not replace repositories with mocks. Keep current PDV routes and `repriced` handshake unchanged, with assertions that a stale-price registration writes no order.

#### Database

**Expected file actions**

| Path | Change |
| --- | --- |
| `apps/server/src/mrp/database/drizzle/models/product-model.ts` | Modify |
| `apps/server/src/mrp/database/drizzle/mappers/drizzle-product-mapper.ts` | Modify |
| `apps/server/src/mrp/database/drizzle/repositories/drizzle-products-repository.ts` | Modify |
| `apps/server/src/shared/database/drizzle/migrations/0028_accompaniment_price.sql` | Generate |
| `apps/server/src/shared/database/drizzle/migrations/meta/0028_snapshot.json` | Generate |
| `apps/server/src/shared/database/drizzle/migrations/meta/_journal.json` | Modify |

Generate rows denote the named Drizzle migration and snapshot outputs; the generator also appends their tag to the existing journal.


**Expected files and generated outputs.** Price persistence belongs to the existing MRP Product model, mapper and repository, with the shared schema entrypoint collecting module models. `[G]` is generated during implementation, never a file to hand-author now.

```text
apps/server/
├── drizzle.config.ts                                    [V] shared schema/migration paths
└── src/
    ├── mrp/database/
    │   ├── drizzle/models/product-model.ts               [M] one nullable numeric column/check
    │   ├── drizzle/mappers/drizzle-product-mapper.ts      [M] numeric/null ↔ domain
    │   ├── drizzle/repositories/drizzle-products-repository.ts [M] add/addMany/replace mapping
    │   ├── drizzle/repositories/drizzle-mrp-database.ts   [V] serializable scoped repositories
    │   ├── drizzle/models/product-accompaniment-model.ts [V] relation, no sale-price column
    │   ├── drizzle/models/product-size-model.ts          [V] independent size price
    │   ├── drizzle/models/resale-configuration-model.ts  [V] independent Resale prices
    │   ├── mrp-database.module.ts                        [V] token/useExisting wiring
    │   └── mrp-seeder.ts                                 [V] nullable defaults preserved
    ├── shared/database/drizzle/
    │   ├── schema.ts                                    [V] canonical generation input
    │   ├── database-transaction-context.ts               [V] async transaction isolation
    │   ├── models/event-model.ts                        [V] existing physical outbox
    │   ├── repositories/drizzle-events-repository.ts     [V] transaction-bound event insert
    │   └── migrations/
    │       ├── 0028_accompaniment_price.sql            [G]
    │       └── meta/0028_snapshot.json                  [G]
    │       └── meta/_journal.json                      [M]
    └── pdv/database/drizzle/models/
        ├── order-model.ts                               [V] immutable totals/idempotency
        ├── order-line-model.ts                          [V] registered line price snapshots
        └── order-line-accompaniment-model.ts            [V] base/final sale-price snapshots
```

**Physical table contract.** Names below are actual PostgreSQL table names; directory/module names do not imply prefixes on tables.

| Table | Relevant existing columns/relationships | Required change or preservation |
| --- | --- | --- |
| `products` | `id` UUID PK; `establishment_id`, `categories` enum array, `stock_control`, `status`, `current_unit_cost numeric(18,6)`, `created_at`, `updated_at` | Add only `accompaniment_price numeric(18,2) NULL`, no default; proposed check `mrp_products_accompaniment_price_non_negative`: NULL or >= 0. One saved amount per target Product; advance Product `updated_at` on a deliberate price change. |
| `product_accompaniments` | `id` PK, `establishment_id`, `product_id` → Portion Product (cascade), `accompaniment_product_id` → target Product (restrict), `accompaniment_type_id` → `accompaniment_types` (restrict), `quantity_per_portion numeric(18,3)` | Keep relation/type/quantity; no price column. Preserve tenant+owner+target uniqueness and tenant+target inverse lookup index. |
| `accompaniment_types` | Existing tenant-owned type referenced by links | Preserve all rows; type does not own or multiply the price. |
| `product_sizes` | `id`, `establishment_id`, `product_id` → Product (cascade), `quantity numeric(18,3)`, `price numeric(18,2)`, `is_active` | Size base price stays independent; no accompaniment-price copy per size. |
| `resale_configurations` | `id`, `establishment_id`, `product_id` → Product (cascade), nullable `brand_id` → `product_brands` (cascade), `price numeric(18,2)`, `is_active` | Read applicable configuration for first-save suggestion only. Preserve Single partial uniqueness and per-brand uniqueness; no write-back from accompaniment edits. |
| `product_brands` | Existing tenant/Product identity, main-brand selection, package cost/quantity | Main brand selects a candidate Resale configuration and stock/cost source; changing it does not overwrite a saved accompaniment price. |
| `events` | `id`, `event_name`, `payload` JSONB, `status`, `occurred_at`, `available_at`, `published_at`, `attempts`, `reserved_by`, `reservation_expires_at`, `last_error_code`, timestamps | Insert complete existing MRP configuration events in the same transaction; no new event table or separate price-event type required. Preserve pending/failed/reservation indexes and acknowledgement guards. |
| `orders` | `establishment_id`, `idempotency_key`, sequence, channel snapshot, subtotal/discount/total | Preserve tenant+idempotency uniqueness and all historical amounts. |
| `order_lines` | `order_id` FK, Product/name/brand/size snapshots, `base_unit_price`, `final_unit_price`, `subtotal` | Existing registered snapshots remain stored facts; no catalog-price join replaces them. |
| `order_line_accompaniments` | `order_line_id` FK (cascade), `accompaniment_id`, position PK component, name/type/quantity snapshots, `base_price numeric(18,2)`, `final_price numeric(18,2)` | Future orders capture the saved accompaniment price through current pricing rules. Existing rows remain byte-for-byte unchanged by this migration or subsequent price edits. |

**Tenancy and indexes.** Preserve existing `establishment_id` predicates on reads/writes and explicit same-establishment checks for the owner Product, target Product, type and link. Current relation FKs reference UUID IDs rather than composite `(establishment_id,id)` keys; do not claim the database alone enforces tenancy. Keep existing `mrp_product_accompaniments_establishment_accompaniment_idx` for inverse fan-out and `mrp_product_accompaniments_product_target_unique` for duplicates. No new price index, table, tenancy redesign or category compatibility migration is required. Existing Portion+Resale DB constraint remains; new Portion+Accompaniment rejection belongs to submitted category workflows so retained legacy rows are not invalidated.

**Mapping.** PostgreSQL numeric values travel through Drizzle as strings; extend the existing Product mapper with explicit null handling (`null → undefined`, finite numeric string → number) and repository conversion in add, addMany and update paths. Domain `undefined` becomes HTTP `null` for the public pricing/row contracts. Never use a truthy check or `Number(null)` because that conflates unconfigured with zero. Link updates that omit a price must not overwrite the current Product field; unrelated Product updates must retain saved price. Keep cost at its existing precision and separate from sale price.

**Migration and preservation.** Generate from `apps/server/src/shared/database/drizzle/schema.ts` using `pnpm --filter server db:migration:generate`; `apps/server/drizzle.config.ts` already sets output to `src/shared/database/drizzle/migrations`. Commit the generated SQL, snapshot and journal together. The expected SQL effect is additive only:

```sql
-- Expected semantic effect; the generated migration owns exact ordering/naming.
ALTER TABLE "products" ADD COLUMN "accompaniment_price" numeric(18, 2);
ALTER TABLE "products" ADD CONSTRAINT "mrp_products_accompaniment_price_non_negative"
  CHECK ("accompaniment_price" IS NULL OR "accompaniment_price" >= 0);
```

No backfill from Resale, cost or zero. Preserve categories, links, stock balances and all order data. PostgreSQL numeric scale can round arbitrary SQL input, so the database check is defense in depth; shared input validation and Core must reject excess precision before a write. Do not run schema push, seeds or destructive database reset to author this Spec. Implementation verifies migration against fixtures containing legacy links and order snapshots and records preservation evidence.

**Atomicity and concurrency.** `DrizzleMrpDatabase.run` creates one serializable read/write transaction and constructs Products, accompaniment, lookup and Events repositories over the same executor. `DatabaseTransactionContext` reuses an active transaction without leaking Drizzle types into Core. An intentional Link/Edit save reloads current scoped entities, validates price/category/quantity, updates the target Product only if supplied, writes the link, computes affected sales configurations and inserts outbox rows before commit. Any failure in Product, link, configuration assembly or event insertion rolls back the whole operation; no partial price is visible. Existing infrastructure retries a PostgreSQL serialization/deadlock failure (`40001`/`40P01`) once and returns `ConflictError` on exhaustion. Preserve this behavior; no extra feature retry loop, CAS version or last-open-form overwrite. Last successful intentional committed price is authoritative. PDV's own serializable order/stock/idempotency transaction remains intact.

Durable outbox rows are the reliability boundary. The existing shared relay delivers committed outbox rows after commit without requiring broker/network acknowledgement for the business commit; its worker, recovery and reservation policies are reused without feature changes. The current checkout uses `shared/database/drizzle/models/event-model.ts` and `repositories/drizzle-events-repository.ts`, while Messaging Rules describe an outbox-directory adapter. These existing paths identify the transaction boundary; this feature does not introduce an infrastructure refactor.

#### Provision

**Expected file actions**

| Path | Change |
| --- | --- |
| `apps/server/src/shared/provision/pdv-order-registration/mrp-sales-catalog-provider.ts` | Modify |

Only the sales-catalog provider changes: it reads the saved Product price while preserving the existing shared provision boundary. The cost and stock providers and their module bindings are reused at their existing paths.


**Expected files and dependency direction.**

```text
apps/server/src/shared/provision/pdv-order-registration/
├── mrp-sales-catalog-provider.ts                      [M] live sale-price translation
├── mrp-order-cost-provider.ts                         [reuse] preserve cost behavior
├── mrp-stock-provider.ts                              [reuse] preserve stock behavior
└── pdv-order-registration-provision.module.ts         [reuse] preserve provider bindings
```

Keep all three providers in the existing shared provision directory. Preserve provider classes, consuming tokens, singleton registrations, exports and module imports. Only the sales-catalog provider gains the pricing behavior change. Verify the wiring through the existing catalog/preview/registration consumer tests, without dedicated provider tests.

`MrpSalesCatalogProvider` implements PDV's `SalesCatalogProvider` and receives the exported MRP database contract. Its scoped reader reloads current MRP facts through existing exported repositories; shared infrastructure translates facts and does not take ownership of MRP price/eligibility policy. Keep current focused provision module/token wiring; do not instantiate providers in controllers or create a new root composition tree.

Correct both independent consumption paths: (1) MRP's published `ProductSalesConfigurationChangedEvent` snapshots, and (2) the live `MrpSalesCatalogReader.mapAccompaniment` in this provider. The current live implementation computes rounded cost × `quantityPerPortion`; replace its sale-price source with the saved target Product amount and apply it once. Do not use `currentUnitCost`, package cost, link type, quantity or size to calculate the commercial addition. Keep `quantityPerPortion`, main-brand stock selection, available quantity and cost-provider facts for their existing consumption/cost purposes. A missing saved amount makes the target unavailable; zero is configured and available subject to existing status/stock/type conditions.

Preserve ServiceUnavailable translation for failed catalog loads, current active/category/stock checks, the same collection of accompaniments across Portion sizes and current channel/Combo calculations in PDV Core. New Sale preview and registration must observe fresh Product facts even if event delivery is pending. These two paths must agree on saved price and availability so event latency cannot authorize an obsolete price. Exercise the adapter through PDV catalog/preview/registration controllers and consumers; no dedicated provider/repository/mapper tests.

### apps/web

#### UI

**Expected file actions**

| Path | Change |
| --- | --- |
| `apps/web/src/ui/mrp/hooks/use-link-product-accompaniment-action.ts` | Modify |
| `apps/web/src/ui/mrp/hooks/use-update-product-accompaniment-action.ts` | Modify |
| `apps/web/src/ui/mrp/widgets/slots/product-accompaniments-slot/product-accompaniment-dialog/index.tsx` | Modify |
| `apps/web/src/ui/mrp/widgets/slots/product-accompaniments-slot/product-accompaniment-dialog/use-product-accompaniment-dialog.ts` | Modify |
| `apps/web/src/ui/mrp/widgets/slots/product-accompaniments-slot/product-accompaniments-table/accompaniment-row/index.tsx` | Modify |
| `apps/web/src/ui/pdv/widgets/pages/new-sale-page/index.tsx` | Modify |
| `apps/web/src/ui/pdv/widgets/pages/new-sale-page/repriced-order-review-dialog/index.tsx` | Create |
| `apps/web/src/ui/pdv/widgets/pages/new-sale-page/repriced-order-review-dialog/use-repriced-order-review-dialog.ts` | Create |

These rows identify changed owners, including the extracted price-review widget. Extend the corresponding permitted consumer suites described in the Verification Contract; unchanged navigation/transport infrastructure is omitted.

#### Browser Test Artifact Isolation

Playwright reports, traces, logs and screenshots live under `apps/web/.playwright-cli/`. Exclude that generated subtree from Vite's development watcher so test output cannot trigger application reloads while browser scenarios are running.

**Expected file actions**

| Path | Change |
| --- | --- |
| `apps/web/vite.config.ts` | Modify |


**Existing owners and expected affected tree:**

```text
apps/web/src/ui/
├── mrp/
│   ├── hooks/
│   │   ├── mrp-query-keys.ts
│   │   ├── use-product-pricing-query.ts
│   │   ├── use-product-accompaniments-query.ts
│   │   ├── use-link-product-accompaniment-action.ts
│   │   └── use-update-product-accompaniment-action.ts
│   └── widgets/
│       ├── components/product-details-tabs/index.tsx
│       ├── pages/product-details-page/index.tsx
│       └── slots/
│           ├── product-pricing-slot/
│           │   ├── index.tsx
│           │   └── use-product-pricing-slot.ts
│           └── product-accompaniments-slot/
│               ├── index.tsx
│               ├── use-product-accompaniments-slot.ts
│               ├── action-dialogs/index.tsx
│               ├── product-accompaniment-dialog/
│               │   ├── index.tsx
│               │   ├── use-product-accompaniment-dialog.ts
│               │   └── product-accompaniment-dialog-header/index.tsx
│               └── product-accompaniments-table/
│                   ├── index.tsx
│                   └── accompaniment-row/index.tsx
└── pdv/widgets/pages/new-sale-page/
    ├── index.tsx
    ├── use-new-sale-page.ts
    ├── new-sale-cart-storage.ts
    ├── portion-configuration-dialog/
    │   ├── index.tsx
    │   └── use-portion-configuration-dialog.ts
    ├── order-registration-dialog/index.tsx
    ├── repriced-order-review-dialog/
    │   ├── index.tsx
    │   └── use-repriced-order-review-dialog.ts
    └── new-sale-cart/
        ├── index.tsx
        └── use-new-sale-cart.ts
```

Existing paths identify owning boundaries; explicit Create rows record the extracted review widget. Any behavior-owning child follows `child-name/index.tsx` plus colocated `use-child-name.ts`. The existing repricing dialog was inline in `new-sale-page/index.tsx`; its focused extraction into `repriced-order-review-dialog/` satisfies the widget boundary rule while adding detailed rows. It does not create a route or new registration protocol.

**Dialog control and data flow:** `use-product-accompaniment-dialog.ts` owns React Hook Form, selected target, initial/current displayed price, dirty intent, errors and handlers. `index.tsx` renders shared Input/Label/Select/Dialog primitives and wires handlers. Link and Edit share this one dialog; Edit keeps the target disabled. Selecting a target/opening Edit reads its current saved/suggested price with the existing pricing query/service; that query uses the target Product ID, while the mutation route uses the owning Portion ID and immutable link ID. Do not accidentally query Portion pricing as the accompaniment price. Stock/brand reads remain cost-preview inputs only.

Initialize from saved price when non-null, otherwise the server suggestion if non-null, otherwise blank. Do not use truthiness to choose the price, because saved zero must win over a suggestion. A suggested value becomes saved only on explicit successful Link/Edit submit. Reset target-specific form state on a different target/open session; ignore previous-target/late responses and do not replace the Manager's dirty input during a background refetch. Keep the source price baseline associated with the selected target so changing only quantity/type omits the price write. A first configured value, including an unchanged-looking suggestion, must be sent because no saved baseline exists. An intentional change to zero is sent explicitly.

**Mutation/cache lifecycle:** action hooks use `useRestContext()` and the existing `mrpService` factory, call the corresponding REST method, throw failed responses through the existing response abstraction and expose status plus a domain-specific action. Keep orchestration/lifecycle in action hooks and form intent in the widget hook. Existing success invalidation covers only `mrpQueryKeys.productAccompaniments(portionId)` and is insufficient after a shared target price write. Invalidate/refetch the target pricing key and cached MRP product/accompaniment views that may display that target's price across Portions (the existing `mrpQueryKeys.products()` prefix can cover unknown inverse Portion IDs); do not invent a list of affected Portion IDs in the response. Active views show authoritative refreshed values; unopened links read them on next query. Keep pending controls disabled and close the dialog only after a successful save; error retains selected target/type/quantity/price and offers retry. Server repricing remains authoritative for an already-open PDV cart; cache freshness is not a sale guarantee.

| UI state/surface | Expected behavior |
| --- | --- |
| Initial/read pending | Announce loading; do not present a previous target's price as current or enable a save relying on unresolved price data. |
| No eligible candidates | Show the existing empty pattern; do not offer an invalid target or manufacture zero. |
| Price/source read failure | Visible error and retry; preserve current context; do not substitute cost/Resale/zero for an unavailable saved-price read. |
| Unconfigured target | Blank required price if no proposal; if a proposal exists, distinguish it from a saved value. No write on selection, GET, cancel or closing. |
| Invalid input | Visible associated field error, `aria-invalid`, keep data entered; reject negatives/excess precision/non-finite values; allow zero. |
| Saving | One in-flight submit, announced pending label; avoid duplicate requests. |
| Write failure | Keep dialog and values, expose failure using existing field/action feedback and required shared notifications where applicable; retry remains explicit. |
| Successful Link/Edit | Close, return focus to originating control, refresh table and shared target-price caches. Cost changes only with cost inputs. |
| Linked table | Positive saved price uses BRL formatting; zero is `Grátis`; null is visibly unconfigured and never free. Replace current placeholder claiming per-size commercial pricing. |
| Operator | Same readable saved-price/null/free distinctions in table; no Link/Edit/Remove controls. Hidden actions do not replace Server 403 enforcement. |
| Product navigation | Accompaniment-only has no Prices tab. Accompaniment+Resale has existing Prices tab for separate Resale fields only. Existing unsupported direct Prices-route recovery remains. |
| PDV repriced | Display changed accompaniment, item and total amounts using authoritative response values and dedicated saved design. Keep cart, do not register automatically; review then explicit new confirmation. Another change repeats the same process. |

`use-new-sale-page.ts` already handles `repriced` for conflict and successful result branches by adopting `recalculatedCart`/`previewToken` and resetting the registration request. Preserve both paths, transport-retry idempotence, insufficient/correction outcomes and historical read behavior. The existing generic dialog only says “valor recalculado” for each change; extend it to show the actual accompaniment/item/total values required by the dedicated Design Contract. `Revisar valores`, close and Escape must not call registration. Existing feedback transition may open the confirmation dialog, but the new request is issued only by a subsequent explicit confirmation. No fresh sale is inferred from restoring a cached cart.

**Accessibility/responsiveness/SSR:** reuse existing Scoops tokens and shared currency/quantity hooks; localized pt-BR labels do not change canonical payload values. Label price with its product-wide scope and keep cost preview separate. Trap dialog focus, restore its trigger after dismissal, provide visible focus and keyboard Select/submit/review paths. Keep narrow 390×844 dialogs usable and scrollable, tables contained within their responsive scroll region and control/price text readable. Compare the saved Link/Edit/table and desktop/narrow review references, not the obsolete accompaniment Prices screenshot. Respect reduced motion, existing themes and contrast. Browser storage/window/document access stays in guarded browser lifecycle; SSR does not access local storage or infer the actor. Clear/reload cart state on establishment change and keep persisted cart storage establishment-scoped.

Existing route topology remains unchanged. Keep inherited authentication/authorization middleware, category-aware tab gating and unsupported Prices-route recovery; queries and form behavior remain owned by the UI hooks.

#### REST

**Expected file actions**

| Path | Change |
| --- | --- |


```text
apps/web/src/
├── rest/
│   ├── axios/axios-rest-client.ts                       [existing HTTP/cookie transport]
│   └── services/
│       ├── mrp-service.ts                              [existing MRP typed factory/mappers]
│       └── pdv-service.ts                              [existing PDV typed factory/mappers]
└── ui/shared/
    ├── contexts/rest-context/
    │   ├── index.tsx
    │   ├── use-rest-context-provider.ts
    │   └── types/rest-context-value.ts
    └── hooks/use-rest-context.ts
```

The actual factories are `MrpService(restClient): MrpRestService` and `PdvService(restClient): PdvRestService`, composed once through the shared REST context with `AxiosRestClient(BROWSER_ENV.scoopsServerRestUrl)`. Preserve those public factory contracts; do not add a feature-local fetch client/context.

| Method on existing MRP service | Required mapping |
| --- | --- |
| `getProductPricing(targetId)` | Preserve date/entity mapping, mode/sizes/Resale fields; carry saved `accompanimentPrice` and read-only `suggestedAccompanimentPrice` as number or null without truthy/default coercion. |
| `getProductAccompaniments(portionId)` | Preserve Product date mapping and existing detail fields; carry each `salePrice` number or null. |
| `linkProductAccompaniment(portionId, input)` | Existing POST `/products/{portionId}/accompaniments`; pass optional numeric price only on first configuration/intentional change. Preserve 201 detail body and response headers/status. |
| `updateProductAccompaniment(portionId, linkId, input)` | Existing PATCH path; never include editable target; preserve omission exactly and 200 detail response. |

Do not merge a default `accompanimentPrice: 0` into transport input, serialize undefined as null, or re-derive the suggested price in the adapter. Date mapping remains a transport concern; price eligibility and calculations remain Core concerns. Preserve server 401/403/404/409/422 distinctions and error-body handling through the existing `RestResponse` boundary. PDV transport keeps existing catalog/preview/registration paths and discriminated result shape; a `repriced` body is preserved for UI review even when HTTP status is 409. Do not hide that result by throwing it away as a generic transport error. Use consuming widget/route tests for observable method/path/body, null/zero mapping, failure and resulting refreshed state; do not add dedicated Web REST-service/query/action tests.

### Cross-layer flow and decisions


Manager Link/Edit reads the saved price and applicable suggestion through MRP REST, then deliberately saves the target Product price with the link and outbox publication in one transaction. Affected Portion facts reach PDV through the existing publication and live catalog boundaries. New Sale consumes the saved price once, revalidates before registration and requires review/reconfirmation when repriced; registered snapshots remain unchanged.

| Decision | Chosen approach | Alternative | Reason and accepted trade-off |
| --- | --- | --- | --- |
| Price setup | Nullable until Manager confirms a Link/Edit save; suggest current applicable Resale price | Migration backfill | Explicit review before future sale prices change; legacy unpriced links cannot sell. |
| Management UI | Link/Edit only; Operator reads linked table | Dedicated Prices page | Approved simplification; unlinked products have no standalone price editor. |
| Save boundary | Existing Link/Edit transactions update product-owned price and link together | Separate price write then link write | Prevents partial saves and keeps the public workflow cohesive. |
| PDV review | Existing authoritative repricing/token protocol with dedicated saved visual state | Separate registration protocol | Preserves established idempotence and snapshot contracts. |


## 4. Verification Contract

| Acceptance | Checker and permitted boundary | Expected assertion | Evidence target |
| --- | --- | --- | --- |
| AC-01 | MRP registration/category-change use-case tests and database-backed controllers | Both rejection/no mutation and allowed category combinations | evaluation.md |
| AC-02–AC-05, AC-11 | MRP Core pricing/link/edit use cases, database-backed pricing/accompaniment controllers, consuming Web widgets and route suite | Correct proposal/validation, permissions, atomic writes, shared price and failure recovery | evaluation.md |
| AC-06–AC-07 | MRP affected-sales use case, PDV catalog controller, PDV pricing through eligible use cases, New Sale consumers | Same sale price across links/sizes, no cost fallback, free/channel calculation | evaluation.md |
| AC-08–AC-10 | PDV registration/preview use cases and Server controllers, New Sale consumers/route tests, MV-02 | Current-price review, new explicit confirmation, one order and immutable history | evaluation.md |

Extend established `apps/server/src/mrp/rest/controllers/tests` pricing/link/edit suites and `apps/server/src/pdv/rest/controllers/tests/list-order-catalog.controller.test.ts` plus order preview/registration suites. Web route coverage belongs in `apps/web/tests/mrp/product-accompaniments-page.test.ts`, relevant product prices/details route tests and existing New Sale route suites. Core tests target use cases only; persistence, mappers, schemas, helper pricing code and Web REST/query/action adapters are tested through permitted consumers. Do not add standalone repository/mapper/adapter/helper tests.

**Required mutation scope:** Run

`pnpm --filter @scoops/core test:mutation --files src/mrp/use-cases/register-product-use-case.ts src/mrp/use-cases/change-product-categories-use-case.ts src/mrp/use-cases/get-product-pricing-use-case.ts src/mrp/use-cases/link-product-accompaniment-use-case.ts src/mrp/use-cases/update-product-accompaniment-use-case.ts src/mrp/use-cases/get-affected-product-sales-configurations-use-case.ts`

Map results to AC-01, AC-03–AC-08 and AC-11. Add any further changed eligible use case explicitly; mutate only direct `src/**/use-cases/*-use-case.ts` targets. Assess surviving/uncovered mutants against those assertions; fix actionable gaps and document justified equivalents and execution errors. Success means semantic evidence is complete, not just a successful Stryker exit. Core CI independently runs all eligible use cases across four shards, enforces included-module and changed-file 70% floors and exact unchanged-file target-branch preservation, for Analytics, Communication, Identity, MRP and PDV; Billing retains its documented temporary exception. Missing/incomplete reports or unchanged-file baselines and unscoreable included modules fail closed. A file N/A on both revisions stays N/A; a score on only one revision requires the candidate to meet 70%. Reports and dispositions belong in Evaluation.

| Command | Purpose and prerequisites |
| --- | --- |
| `pnpm check:test-integrity` | Repository test-subject ownership and assertion-integrity policy. |
| `pnpm --filter @scoops/core check:code && pnpm --filter @scoops/core check:architecture && pnpm --filter @scoops/core check:types && pnpm --filter @scoops/core test:coverage` | Core gates; preserve configured coverage floors. |
| `pnpm --filter @scoops/validation check:code && pnpm --filter @scoops/validation check:architecture && pnpm --filter @scoops/validation check:types` | Reusable schema gates when affected. |
| `pnpm --filter server check:code && pnpm --filter server check:architecture && pnpm --filter server check:types && pnpm --filter server test:coverage && pnpm --filter server build` | Server gates and database-backed controller coverage. |
| `pnpm --filter web check:code && pnpm --filter web check:architecture && pnpm --filter web check:types && pnpm --filter web test:coverage && pnpm --filter web test:integration && pnpm --filter web build` | Web gates, widget coverage and committed mocked-transport Playwright suite. |
| `pnpm --filter server db:migration:generate` | Generate tracked migration/metadata from shared schema; inspect migration for data preservation. |

Run focused checks during implementation and applicable integrated suites after integration; classify actual results in Evaluation. No runtime proof is claimed by this Spec.

### MV-01 — Manager configures and edits shared price

- **Acceptance:** AC-02–AC-06, AC-11.
- **Prerequisites:** Inspect `docker compose ps`; PostgreSQL must be healthy. Require GET http://localhost:3336/health to return 200 with database UP, and verify the target page responds at http://localhost:4000. Verify seeded local Manager/Operator accounts; seed explicitly only if absent before `pnpm --filter web test:auth:setup`. Start Server/Web dev in persistent sessions and wait for Nest bootstrap. Prepare two Portions/sizes, an Accompaniment+Resale with Single or current-main-brand Resale price, an unpriced Accompaniment-only target, and a second-establishment target.
- **Start/viewports:** Portion `/products/:productId/accompaniments`, 1560 × 1178 and 390 × 844. Compare table and Link/Edit saved references.

1. Open Link using accessible role/name locators. Select the unpriced target and verify required entry; cancel and verify no persisted price/link. Select the Resale target, verify the applicable proposal and separate cost preview, then save by keyboard.
2. Edit the linked target price, validate negative/excess precision rejection and context retention, then save zero and a positive amount. Open the other Portion and verify the same shared price. Change quantity/type and verify price stays fixed while cost preview changes.
3. Change Resale price/main brand and verify saved Accompaniment price stays fixed. Inspect Accompaniment-only details without Prices, and Accompaniment+Resale Prices with Resale fields only.
4. As Operator, inspect the linked price without edit controls. Through the authenticated Playwright session, submit an otherwise valid link mutation and request the prepared second-establishment product; verify 403 and 404 respectively with no mutation. Transaction/publication failure injection belongs to the automated controller tests.

**Proof:** Verify visible result, final route, request method/body, persisted product/link and affected sale facts. Inspect console/hydration and failed requests, distinguishing expected denial from defects. Capture fresh desktop/narrow table and Link/Edit states in ignored `test-results/` and record paths/comparisons in Evaluation. Stop task-owned dev processes; leave shared Docker services running.

### MV-02 — Operator reviews changed price and preserves history

- **Acceptance:** AC-06–AC-10.
- **Prerequisites:** Same healthy full stack/accounts; sufficient stock, shared paid/free Accompaniments linked to different sizes/Portions, and a registered historical-order fixture.
- **Start/viewports:** `/sales/new`, 1560 × 1178 and 390 × 844; compare `AYpcB` and `mouHc` references.

1. Add paid/free Accompaniments, vary Portion size and consumption quantity, and apply an optional channel. Verify one sale-price addition and `Grátis`.
2. In a Manager session, change price via Edit accompaniment while the Operator cart remains unregistered. Attempt registration; verify changed accompaniment/item/total values, preserved cart and no order write.
3. Use keyboard to choose `Revisar valores`, then explicitly confirm again. Verify one persisted order with current price; retry the request and verify no duplicate.
4. Change price again and read the historical/new order snapshots; captured values remain unchanged. Verify restored cart facts also receive current-price revalidation.

**Proof:** Observe catalog/preview/registration responses, final URL, persisted order count and stored snapshots. Inspect console/hydration and failed requests. Capture fresh desktop/narrow review-dialog and updated-cart screenshots, recording comparisons and evidence limits in Evaluation. Stop task-owned dev processes.

## 5. Documentation alignment and revision history

| Authority | Applies to | Alignment |
| --- | --- | --- |
| documentation/prds/mrp.md PRQ-01, 05, 08, 09; Journey G | Category, navigation, dialog ownership and independent price | Approved amendments applied first; requirement checkboxes remain unchecked. |
| documentation/prds/pdv.md PRQ-03, 07, 09 | Sale price, current-price review and immutable snapshots | Existing authority retained. |
| documentation/architecture.md; documentation/modules.md | MRP facts, PDV consumption, transaction/event boundaries, and reusable module-owned Strategies | Revision 2 permits pure Strategies while use cases retain application actions; revision 3 places their shared contract in the shared domain boundary. No ownership transfer. |
| documentation/design.md; design/handoff.md | Tokens, saved references and responsive assumptions | Five current references; obsolete dedicated price page removed. |
| documentation/tooling.md; documentation/sdd.md | Generation, checkers, mutation and artifact lifecycle | Confirmed. |
| documentation/rules/code-conventions-rules.md; core-package-rules.md; use-case-testing-rules.md | Core code, reusable Strategy contract and allowed test subjects | Revision 2 adds the shared Strategy rule and requires behavior proof through consuming use-case tests; revision 3 aligns the contract location with the domain boundary. |
| documentation/rules/database-layer-rules.md; rest-layer-rules.md; controllers-testing-rules.md; validation-package-rules.md | Persistence, REST, controller integration and reusable schemas | Selected; no direct persistence tests. |
| documentation/rules/provision-layer-rules.md | Shared MRP-to-PDV adapter and indirect provider tests | Selected; rule execution stays in pure Core Strategies/use cases while the adapter translates facts. |
| documentation/rules/messaging-layer-rules.md | MRP authoritative event content, transactional outbox publication and existing post-commit relay participation | Selected; preserve existing relay policy and record the pre-existing infrastructure path discrepancy. |
| documentation/rules/ui-layer-rules.md; web-app-routing-rules.md; widget-testing-rules.md | Web presentation/routes and consumer test ownership | Selected; use Playwright CLI and saved design inputs. |

Independent read-only compatibility review of revision 1 completed on 2026-10-14. Verified Rule Pack and test-integrity command findings were corrected; the same Reviewer found no remaining compatibility blockers. Revision 2 passed independent compatibility review on 2026-10-15. Its non-blocking wording findings were corrected: the tree marks `order-pricing.ts` for removal after migration, and the Strategy owns the accompaniment price snapshot while token signing remains use-case orchestration. The first implementation architecture check showed the generic Strategy contract must reside inside the shared domain boundary rather than `shared/interfaces`; revision 3 moves its path and package export into that boundary. No product outcome or Strategy boundary changes; FR-01/AC-01 clarify that a retained legacy link remains editable while its target still has Accompaniment. Revision 3 passed independent compatibility review on 2026-10-15 with no blockers; implementation resumed under the corrected shared domain contract.

| Revision | Date | Material change and reason |
| --- | --- | --- |
| 1 | 2026-10-14 | Issue #56 contract incorporating confirmed Link/Edit-only management, first-save review, category restriction and dedicated PDV review design. Editorial enrichment adds source-backed package/layer trees, persistence details and illustrative Core snippets without changing FR/AC behavior or public contracts. |
| 2 | 2026-10-15 | Adopt a reusable pure business-rule Strategy contract in Core and apply it to PDV pricing, combo allocation, request validation and preview price facts. Use cases retain authorization, data loading, transaction and persistence orchestration; no product behavior, public REST contract, entities or structures change. |
| 3 | 2026-10-15 | Move `BusinessRuleStrategy` from the integration interfaces boundary into `shared/domain/strategies`, following the repository architecture check. Export it from the shared domain Strategy subpath. Clarify that Edit can retain a legacy dual-category target while it remains an Accompaniment. No product outcome or concrete Strategy boundary changes. |
