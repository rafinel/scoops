---
title: Search-only unavailable products in the sale catalog
status: in_progress
revision: 1
source:
  type: issue
  ref: https://github.com/rafinel/scoops/issues/60
scope:
  - packages/core/src/pdv
  - apps/server/src/shared/provision/pdv-order-registration
  - apps/server/src/pdv/rest
  - apps/server/rest-client/pdv
  - apps/web/src/ui/pdv
  - apps/web/src/ui/shared
  - apps/web/src/rest/services
  - apps/web/tests/pdv
last_updated_at: 2026-10-18
---

# Search-only unavailable products in the sale catalog

**Outcome:** delivered in [PR #65](https://github.com/rafinel/scoops/pull/65); PRQ-02 fully and PRQ-11/12/13 partially delivered as scoped. Evidence: [evaluation.md](./evaluation.md).

## 1. Context and scope

**Objective:** by default, Operators see only sellable products in the New Sale catalog, and
Managers see only sellable products in the Combo "Adicionar produto" picker. Active products with
no price or no stock stay findable through a name search, where they appear disabled and labelled
with the reason they cannot be sold.

**Source:** [rafinel/scoops#60](https://github.com/rafinel/scoops/issues/60). This is a change to
the concluded [`new-order-workflow`](../../spec.md) feature. It also changes the picker owned by
the concluded [`combo-discount-management`](../../../combo-discount-management/spec.md) feature.

**Depth:** `complete`. The change crosses Core, Server and Web, moves a business rule into Core,
changes a public REST response and adds several UI states.

**Baseline:**
- Both list endpoints, `GET /orders/catalog` and `GET /discounts/catalog`, call the same
  provision adapter, `MrpSalesCatalogReader.findMany` in
  `apps/server/src/shared/provision/pdv-order-registration/mrp-sales-catalog-provider.ts`.
- That adapter loads every matching active product, drops unpriced ones in a private `isEligible`,
  keeps out-of-stock ones with `isAvailable: false`, and paginates in memory.
- The Core use cases `ListOrderCatalogUseCase` and `ListComboProductsUseCase` only validate and
  delegate.
- **New Sale card:** shows `Sem estoque` behind a natively disabled `Adicionar` button that the
  keyboard cannot reach. It shows "Preço sob consulta" for out-of-stock products.
- **Combo picker:** never disables a row.
- **Debounce:** New Sale has no search debounce; the Combo picker debounces for 250 ms.

**Gap:** unavailable products clutter the default lists. Unpriced products cannot be found at all.
The eligibility rule lives in an adapter instead of Core. The disabled reason is not announced to
assistive technology.

**Scope:**
- Core classification and the hide/reveal/paginate decision for both list use cases.
- An additive response field.
- New Sale card states and the Combo row states.
- A shared 250 ms search debounce for both screens.
- PRD alignment.

**Exclusions:**
- MRP price or stock rules.
- Category icons and colors.
- Combo composition, validation, activation and automatic-inactivation rules, which stay
  unchanged. A Combo whose component is out of stock can still be registered or revised.
- Order registration and revalidation paths.
- Global search.
- The pre-existing design differences listed in [the handoff](./design/handoff.md#allowed-deviations).
- Moving the catalog query or paging into SQL.
- Changing any PRD `Implemented` checkbox.

**Resolved decisions** (user-approved during clarification, 2026-10-18):

| # | Decision |
| --- | --- |
| Q1 | Classification moves to Core. A pure PDV Strategy is consumed by both list use cases. The provider returns unfiltered facts, and the use cases hide/reveal, count and paginate in memory. |
| Q2/Q14 | New enum `SalesCatalogAvailability` (`available`, `out_of_stock`, `missing_price`); `missing_price` wins when both apply. New list type `SalesCatalogListItem = SalesCatalogProduct & { availability }`, returned only by the two list operations. `isAvailable` is kept and is `true` only for `available`. |
| Q3 | Only the picker hides or disables. Register, revise and revalidation logic stay unchanged. This supersedes the line in the `combo-discount-management` manifest that "stock availability does not disable a commercially valid configuration", but only for the picker list. |
| Q4 | Disabled controls use `aria-disabled="true"`, stay focusable, and announce their reason through `aria-describedby`. Click, Enter and Space do nothing. |
| Q5/Q13 | The PDV PRD was updated first: PRQ-02 Outcome/Capabilities/Experience, Journey E step 5, and a new PRQ-13 Experience bullet. |
| Q6 | Manual validation creates its fixture products through the MRP UI/API and deletes them afterwards. The seeder is unchanged. |
| Q7 | The count reads `N produtos encontrados · M adicionados` while the debounced trimmed search is non-empty, and `N produtos elegíveis · M adicionados` otherwise. |
| Q8 | The price line ignores stock (see FR-07). "Preço sob consulta" is removed. |
| Q9/Q10 | Only the new states are implemented on the current card and row structures. Pre-existing design differences and the "Disponível para venda" label are allowed deviations. |
| Q11 | A shared `useDebouncedValue` hook with a 250 ms delay, used by both screens. Under the UI Rule (a hook used by several widgets of one module lives in `ui/<module>/hooks/`), it lives under `apps/web/src/ui/pdv/hooks/`, not `ui/shared/hooks/`. |
| Q12 | Narrow-screen behavior is a recorded assumption, validated manually at 390 × 844. |

| Source requirement | Coverage | Boundary |
| --- | --- | --- |
| PDV PRQ-02 New Sale Product Catalog (as amended) | full | Eligibility, Product without price, Product out of stock, Search-only reveal, Multi-tenancy; Experience: Search, Filters, Identification, Unavailable products, Action blocked, Responsiveness, Accessibility |
| PDV PRQ-13 Combo Discount Management | partial | Only the Experience bullet "Unavailable products in Add product". Combo capabilities stay unchanged. |
| PDV PRQ-11 Permissions, Navigation and Isolation | partial | Isolation and unchanged profile authorization of both list routes |
| PDV PRQ-12 Performance, Responsiveness and Accessibility | partial | Search within 1 second, Keyboard, Focus, Screen readers, unavailability not conveyed by color alone, Narrow screens |
| Journey E (Operator starts a new sale), step 5 | full | End-to-end scenario MV-01 |
| Journey C (Manager creates a Combo), step 4 | partial | Product choice in the picker only; scenario MV-02 |

## 2. Behavior Contract

| ID | PRQ/source coverage | Required behavior |
| --- | --- | --- |
| FR-01 | PRQ-02 Eligibility, Product without price, Product out of stock; PRQ-13 Exp. Unavailable products in Add product | When the trimmed search is empty, the New Sale catalog and the Combo picker return only active Portion/Resale products of the current establishment whose availability is `available`. |
| FR-02 | PRQ-02 Search-only reveal, Exp. Search; PRQ-13 new bullet; Journey E step 5 | When the trimmed search is non-empty, both lists return every active Portion/Resale product whose name matches, whatever its availability, ordered by name and then product id. Clearing the search returns to FR-01. |
| FR-03 | PRQ-02 Search-only reveal, Exp. Filters | The `Porções` and `Revendas` filters narrow the result to that kind but never reveal unavailable products without a non-empty search. |
| FR-04 | PRQ-02 Product without price, Product out of stock, Portion/Resale Category | Each listed product gets exactly one availability, decided by the backend. **`missing_price`**: no active option with a finite price ≥ 0, meaning a Portion has no active size, a single-stock Resale has no resale price, or a by-brand Resale has no active brand price. A price of `0` is valid. **`out_of_stock`**: otherwise, when no active option can be sold from current stock. **`available`**: otherwise. `missing_price` takes precedence over `out_of_stock`. |
| FR-05 | PRQ-02 Search-only reveal (counts and pagination) | `total`, `totalPages` and the page items reflect the filtered set returned by the current default list or search, using the existing page and page-size validation. |
| FR-06 | PRQ-02 Multi-tenancy; PRQ-11 Isolation, Authorization | Only products of the actor's establishment are returned, including when searched. Profile authorization is unchanged: Manager and Operator for `/orders/catalog`, Manager only for `/discounts/catalog`. |
| FR-07 | PRQ-02 Exp. Identification, Unavailable products | A revealed New Sale card is visibly disabled and shows a reason pill: `Sem estoque` for `out_of_stock`, and `Sem preço` with the price line `Preço não definido` for `missing_price`. **Price line for other cards**, from active priced options regardless of stock: Portions and by-brand Resales show `A partir de <lowest price>`, and single-stock Resales show the plain price. When a card is both added and unavailable, the unavailable pill wins. |
| FR-08 | PRQ-02 Exp. Action blocked; PRQ-13 new bullet | A product whose availability is not `available` cannot open the New Sale configuration dialog. It cannot be selected or added in the Combo picker, by mouse or keyboard. |
| FR-09 | PRQ-13 new bullet | A revealed Combo picker row is visibly disabled and shows the same reason pill as FR-07. Available rows keep their current behavior. |
| FR-10 | PRQ-02 Exp. Accessibility, Responsiveness; PRQ-12 Keyboard, Focus, Screen readers, Semantics, Narrow screens | Disabled New Sale `Adicionar` buttons and disabled Combo rows stay in the Tab order with visible focus. They expose `aria-disabled="true"` and an accessible description containing the reason. Reasons are text plus icon, not color only. At 390 × 844, pills stay whole and there is no horizontal overflow. |
| FR-11 | PRQ-12 Search; PRQ-02 Exp. Search | Both screens update the search field immediately and request the catalog with the trimmed search after 250 ms without typing. The New Sale page resets to 1 when the debounced value changes. Clearing search or filters applies immediately. |
| FR-12 | PRQ-02 Exp. Identification; Q7 | The New Sale count reads `N produtos encontrados · M adicionados` while the debounced trimmed search is non-empty, and `N produtos elegíveis · M adicionados` otherwise. `N` is the response `total`. |
| FR-13 | PRQ-13 Capabilities (unchanged); issue out-of-scope | Combo register, revise, list evaluation and product revalidation, order registration and the provider's lookups by product id behave exactly as before. |
| FR-14 | PRQ-02 Search-only reveal; architecture §11 API compatibility | Both list responses add `availability` to each item. All existing fields keep their names and meanings, except that `isAvailable` equals `availability === 'available'`. A whitespace-only search is treated as no search on both routes. The Web tolerates a response item without `availability` by presenting it from `isAvailable` (see Compatibility). |

| ID | FR coverage | Requirement | Given | When | Then | Expected evidence |
| --- | --- | --- | --- | --- | --- | --- |
| AC-01 | FR-01 | Default list hides unavailable products | An establishment with available, out-of-stock, unpriced, both-states and price-`0`-in-stock products | Either list is requested without search, or with a whitespace-only search | Only available products are returned, including the price-`0` product, each with `availability: 'available'` and `isAvailable: true` | Core tests for both use cases; both controller tests; MV-01/MV-02 |
| AC-02 | FR-02 | Search reveals matches in name order | The same data, with names sharing a substring | A non-empty search is sent, then cleared | The search returns matching available, out-of-stock and unpriced products together, ordered by name then id. The cleared request returns AC-01's set. | Core tests; controller tests; route suites; MV-01/MV-02 |
| AC-03 | FR-03 | Kind filter alone does not reveal | The same data across both kinds | `kind=portion` or `kind=resale` without search, then with a search | Without search, only available products of that kind. With search, matching products of that kind in every availability. | Core tests; controller tests |
| AC-04 | FR-04, FR-07 | States, precedence and card presentation | Out-of-stock, unpriced, both-states, price-`0` and added-then-unavailable products | They are listed under a search and rendered on New Sale | `availability` is `out_of_stock`, `missing_price`, `missing_price` and `available` respectively, for every Portion, single-stock Resale and by-brand Resale variant. **Cards:** out-of-stock shows `Sem estoque` (`circle-off`) and its muted price; unpriced shows `Sem preço` (`circle-dollar-sign`) and `Preço não definido`; both-states shows only `Sem preço`; added-and-unavailable shows the unavailable pill. "Preço sob consulta" never appears. | Core tests; controller tests; `new-sale-catalog.test.tsx`; MV-01 |
| AC-05 | FR-09, FR-01, FR-02 | Combo picker rows | A Manager opens "Adicionar produto" | First with no search, then with a search matching unavailable products | The default list has only available rows. The search adds disabled rows with muted content and the matching reason pill. | `combo-product-dialog.test.tsx`; `new-discount-page.test.tsx`; MV-02 |
| AC-06 | FR-08, FR-10 | Combo disabled row cannot be selected | A disabled row is shown | It is clicked, or focused and Enter or Space is pressed | No product becomes selected, the configuration pane does not load it, and `Adicionar ao combo` cannot add it. The row keeps focus with `aria-disabled="true"` and a description naming the reason. | Combo dialog component and hook tests; `new-discount-page.test.tsx`; MV-02 |
| AC-07 | FR-08, FR-10 | New Sale disabled card cannot open configuration | A disabled card is shown | Its `Adicionar` button is clicked, or tabbed to and activated with Enter or Space | No configuration dialog opens and nothing is added to the cart. The button is reachable by Tab, keeps visible focus, has `aria-disabled="true"` and no native `disabled`, and its description names the reason. | `new-sale-catalog.test.tsx`; `use-new-sale-catalog.test.ts`; `new-sale-page.test.ts`; MV-01 |
| AC-08 | FR-05 | Counts and pagination | More products than one page across states | Pages 1 and 2 are requested, with and without search | `total` and `totalPages` count only the returned set (available-only by default, all matches when searching). Each page has at most `pageSize` items, in the same order. Invalid page or pageSize gives the existing 400/422 responses. | Core tests; controller tests |
| AC-09 | FR-06 | Tenant isolation and permissions | A same-named product in another establishment | Both lists are searched by that name; then called as Operator (combo route) and anonymously | Foreign products never appear. The combo route returns 403 for Operator; both routes return 401 anonymously; `/orders/catalog` returns 200 for Manager and Operator. | Controller tests |
| AC-10 | FR-14 | Additive response contract | Any listed product | The response is serialized | Each item carries `availability` with a Swagger-documented enum, and `isAvailable === (availability === 'available')`. Existing fields are unchanged. The `.rest` examples cover default and searched requests. A Web item lacking `availability` renders as available when `isAvailable` is true, and as disabled `Sem estoque` otherwise. | Controller tests; REST parity check; `new-sale-catalog` and `combo-product-dialog` hook/component tests |
| AC-11 | FR-12 | Count copy | New Sale with 2 products added | The debounced search is empty, then non-empty | The count reads `N produtos elegíveis · 2 adicionados`, then `N produtos encontrados · 2 adicionados`, with `N` equal to the response total | `new-sale-catalog.test.tsx`; `use-new-sale-catalog.test.ts`; MV-01 |
| AC-12 | FR-10, FR-07, FR-09 | Responsive and visual fidelity | Searched states with unavailable products | Rendered at 1481 × 1050 and 390 × 844 | Captures match the saved references `VEtyb`/`cUFG9` except the handoff's allowed deviations. At narrow width, pills stay whole and nothing overflows horizontally. | MV-01/MV-02 visual EV; Visual Reviewer |
| AC-13 | FR-11 | Shared debounce | Either screen | The user types quickly, waits 250 ms, then clears | Only the trimmed final value is requested after 250 ms. The New Sale page resets to 1. Clearing requests the default list immediately. | `use-new-sale-catalog.test.ts`; `use-combo-product-dialog.test.ts`; route suites |
| AC-14 | FR-13 | Combo and order behavior unchanged | A Combo with an out-of-stock component, and the existing order and revalidation flows | The existing register/revise/list/revalidation and order use cases and controllers run | Their outcomes are unchanged. Registering an active Combo with an out-of-stock but priced component still succeeds. | Existing Core and controller suites green; new register-combo controller assertion |

**Cross-cutting restrictions:**

| Concern | Contract |
| --- | --- |
| Authority | Only the backend decides availability. The Web reads `availability` and never recomputes it. |
| Search semantics | The search matches product name only (the existing case-insensitive substring match), is trimmed, and is at most 120 characters (existing errors). Empty after trimming means no search. |
| Performance | The existing in-memory load-then-paginate approach is kept. Search results must still show within 1 second under normal conditions (PRQ-12). Moving this into SQL is out of scope and an accepted risk. |
| Compatibility | The response change is additive and safe in both deployment orders (Web and Server deploy separately; `documentation/infrastructure.md`). **Old Web, new Server:** a revealed unpriced product shows as disabled `Sem estoque`. **New Web, old Server:** an item without `availability` is presented from the server-provided `isAvailable`: `true` is treated as `available`, and `false` as `out_of_stock`. This reads a server fact and does not recompute the rule. Carts stored in the browser may carry the extra `availability` field from a selected list item. It is tolerated and never read from stored products; stored products keep the `SalesCatalogProduct` contract. |

### Design Contract

**Saved references:** [Design handoff](./design/handoff.md), [VEtyb.png](./design/VEtyb.png),
[cUFG9.png](./design/cUFG9.png).

**Required states and viewports:**
- New Sale searched state, with out-of-stock, unpriced and added cards, at desktop 1481 × 1050 and narrow 390 × 844 (AC-04, AC-07, AC-11, AC-12).
- Combo picker searched state, with disabled rows, at desktop and narrow (AC-05, AC-06, AC-12).
- Default states are validated behaviorally against the existing references `jKmSB` and `zBoAn` of the concluded features.

**Permitted deviations:** the handoff's [Allowed deviations](./design/handoff.md#allowed-deviations), items 1–6. The Visual Reviewer compares only the new states.

## 3. Technical Contract

### Cross-layer flow

```text
Web catalog hook (debounced trimmed search, kind, page)
  → PdvService.listOrderCatalog | listComboProducts   (GET /orders/catalog | /discounts/catalog, unchanged query)
  → controller → ListOrderCatalogUseCase | ListComboProductsUseCase
      → SalesCatalogProvider.findMany({ establishmentId, search, kind })   unfiltered, name-ordered, active only
      → SalesCatalogAvailabilityStrategy per product
      → hide non-available unless search; count; slice page
  ← PaginationResponse<SalesCatalogListItem>
  → SalesCatalogProductPageResponseDto (adds availability)
  → New Sale card / Combo row presentation and selection guard
```

| Decision | Chosen approach | Alternative | Reason and accepted trade-off |
| --- | --- | --- | --- |
| Rule ownership | Core Strategy plus the two use cases | A reveal flag on the provider | Follows architecture §2/§7 and the Provision Rules (adapters do not implement business rules), and puts the hide/reveal/paging decisions inside the two existing mutation-target use cases. Cost: an interface change and moving the logic. The Strategy file is not a mutation target, so FR-04 correctness rests on the enumerated AC-04 use-case test matrix. |
| Result type | New `SalesCatalogListItem` | Optional `availability?` on `SalesCatalogProduct` | Keeps order, Combo and stored-cart paths unchanged and typed. Cost: one new structure and type updates in Web consumers. |
| Paging location | In memory, in the use case | SQL-level filtering | The provider already loads every page today. SQL would duplicate the MRP-derived rule in queries. Accepted risk: large catalogs. |
| Disabled semantics | `aria-disabled`, focusable | Native `disabled` | Keyboard and screen-reader users can discover the reason (PRQ-12). Cost: explicit activation guards. |

### packages/core

#### Domain

**Structures** (proposed files, one exported type each, under `pdv/domain/structures/`, exported
from its barrel):

```ts
// sales-catalog-availability.ts (proposed)
export const SalesCatalogAvailability = {
  Available: 'available',
  OutOfStock: 'out_of_stock',
  MissingPrice: 'missing_price',
} as const

export type SalesCatalogAvailability =
  (typeof SalesCatalogAvailability)[keyof typeof SalesCatalogAvailability]

// sales-catalog-list-item.ts (proposed)
export type SalesCatalogListItem = SalesCatalogProduct & {
  readonly availability: SalesCatalogAvailability
}
```

The existing `SalesCatalogProduct`, `SalesCatalogSize` and `SalesCatalogBrand` are unchanged.

**Strategy** (proposed `pdv/domain/strategies/sales-catalog-availability-strategy.ts`, exported
from the strategies barrel):
- It is a pure `BusinessRuleStrategy<SalesCatalogProduct, SalesCatalogAvailability>`.
- It is constructed as a private readonly field by both use cases, following the existing
  `preview-order-use-case.ts` pattern.
- It implements FR-04 using the facts the provider already maps:
  - **Priced:**
    - Portion: `sizes.some(size => size.isActive && finite(size.basePrice) && size.basePrice >= 0)`.
    - Single-stock Resale: `resalePrice` is defined, finite and ≥ 0.
    - By-brand Resale: `resaleBrands.some(brand => brand.isActive && finite(brand.basePrice) && brand.basePrice >= 0)`.
  - **In stock:** the product-level `isAvailable` already computed by the provider (an active option sellable from current stock).
  - **Result:** `!priced` → `MissingPrice`; `!inStock` → `OutOfStock`; otherwise `Available`.

The Strategy has no I/O and no authorization. It is tested through both use cases.

#### Use cases

`ListOrderCatalogUseCase` and `ListComboProductsUseCase` (both existing):
- **Unchanged:** actor checks, page/pageSize defaults and bounds, kind check, 120-character search
  limit, error messages, and the `ServiceUnavailableError` wrapping.
- **Changed result type:** `PaginationResponse<SalesCatalogListItem>`.
- **Combo fix:** normalize whitespace-only search to `undefined` in `ListComboProductsUseCase`
  (FR-14).

Partial, illustrative flow:

```ts
const products = await this.catalog.findMany({ establishmentId, search, kind: request.kind })
const items = products
  .filter((product) => product.isActive)
  .map((product): SalesCatalogListItem => {
    const availability = this.availability.execute(product)
    return { ...product, availability, isAvailable: availability === SalesCatalogAvailability.Available }
  })
  .filter((item) => search !== undefined || item.availability === SalesCatalogAvailability.Available)
const start = (page - 1) * pageSize
return new PaginationResponse(items.slice(start, start + pageSize), page, pageSize, items.length, Math.ceil(items.length / pageSize))
```

The provider's order (name ascending, then product id) is preserved. A thrown provider error keeps
the existing translation.

#### Interfaces

| Action | Path | Contract |
| --- | --- | --- |
| Modify | `packages/core/src/pdv/interfaces/sales-catalog-provider.ts` | `findMany` takes `{ establishmentId, search?, kind? }` without `page`/`pageSize` and returns `Promise<readonly SalesCatalogProduct[]>`. This is every active Portion/Resale product of the establishment matching the optional name search and kind, ordered by name then id, with **no** eligibility filtering. The method name may change under the Rules; a name that signals the unbounded result (for example `findAllMatching`) is preferred. `findProductIdsByName`, `findByProductIds` and `findByProductId` are unchanged. |
| Modify | `packages/core/src/pdv/interfaces/pdv-service.ts` | `listOrderCatalog` and `listComboProducts` return `RestResponse<PaginationResponse<SalesCatalogListItem>>`. Inputs are unchanged. |

**Expected Core tree:**

```text
packages/core/src/pdv/
├── domain/structures/{sales-catalog-availability.ts, sales-catalog-list-item.ts}  [create]  index.ts [modify]
├── domain/strategies/sales-catalog-availability-strategy.ts                         [create]  index.ts [modify]
├── interfaces/{sales-catalog-provider.ts, pdv-service.ts}                           [modify]
└── use-cases/{list-order-catalog-use-case.ts, list-combo-products-use-case.ts}      [modify]
    └── tests/{list-order-catalog-use-case.test.ts, list-combo-products-use-case.test.ts} [modify]
```

### apps/server

#### Provision

`apps/server/src/shared/provision/pdv-order-registration/mrp-sales-catalog-provider.ts` [modify]:
- **Removed:** `MrpSalesCatalogReader.findMany` stops applying `isEligible`, which is deleted
  together with the in-memory slice and `PaginationResponse` construction.
- **Kept:**
  - the existing query (establishment, `status: Active`, categories from `kind` or both, optional
    search, name-ascending sort);
  - loading of all repository pages, using an internal batch size;
  - per-product mapping;
  - dropping products the mapper rejects (establishment mismatch, or no Portion/Resale kind).
- **It returns** the mapped array.
- **Unchanged:** the size, brand and accompaniment `isActive`/`isAvailable` facts, product-level
  `isAvailable`, the other provider methods, and the `ServiceUnavailableError` wrapping.
- **No business filtering** remains in the adapter.

#### REST

**Routes are unchanged:**
- `GET /orders/catalog`: Manager and Operator.
- `GET /discounts/catalog`: Manager only.
- Query `search`, `kind`, `page`, `pageSize` through the existing `orderCatalogQuerySchema` and
  `comboCatalogQuerySchema`, which already trim the search and turn an empty one into `undefined`.
- Status codes 200/400/401/403/422/503 are unchanged.

**Response:**
- `SalesCatalogProductResponseDto` gains `@ApiProperty({ enum: Object.values(SalesCatalogAvailability) }) availability`.
- Its `static from` accepts `SalesCatalogListItem` and copies `availability`.
- `SalesCatalogProductPageResponseDto.from` accepts `PaginationResponse<SalesCatalogListItem>`.
- Swagger schema names stay stable.

**DTO file split:** the existing DTO file declares five classes, which the REST Rule ("one
primary declaration per file") forbids. Touching it requires splitting it.

| Action | Path |
| --- | --- |
| Modify | `apps/server/src/pdv/rest/dtos/sales-catalog-product-response.dto.ts` (keeps only `SalesCatalogProductResponseDto`, adds `availability`, and declares the already-serialized optional `unit` with `@ApiPropertyOptional`, following the file's existing convention for optional fields) |
| Create | `apps/server/src/pdv/rest/dtos/sales-catalog-product-page-response.dto.ts` (proposed) |
| Create | `apps/server/src/pdv/rest/dtos/sales-catalog-size-response.dto.ts` (proposed) |
| Create | `apps/server/src/pdv/rest/dtos/sales-catalog-brand-response.dto.ts` (proposed) |
| Create | `apps/server/src/pdv/rest/dtos/sales-catalog-accompaniment-response.dto.ts` (proposed) |
| Modify | `apps/server/src/pdv/rest/dtos/index.ts` |
| Modify | `apps/server/src/pdv/rest/controllers/tests/list-order-catalog.controller.test.ts` |
| Modify | `apps/server/src/pdv/rest/controllers/tests/list-combo-products.controller.test.ts` |
| Modify | `apps/server/rest-client/pdv/orders.rest`: a default and a searched `/orders/catalog` example whose described response includes `availability` |
| Modify | `apps/server/rest-client/pdv/discounts.rest`: the same for `/discounts/catalog`, plus an unfiltered-kind search example |

Nested DTOs are imported directly from their own files, as the REST Rule requires. Controllers keep their imports through the `@/pdv/rest/dtos` barrel. The Swagger `type` stays
`SalesCatalogProductPageResponseDto`.

### apps/web

#### REST

`apps/web/src/rest/services/pdv-service.ts` [modify]:
- `listOrderCatalog`/`listComboProducts` and `mapSalesCatalogPage` type their items as
  `SalesCatalogListItem`.
- Method, path and query building are unchanged.

`apps/web/src/ui/pdv/hooks/use-order-catalog-query.ts` and `use-combo-products-query.ts`
[modify]:
- Result types change.
- Query keys still include `{ search, kind, page, pageSize }`, now receiving the debounced trimmed
  search.

#### UI

**Shared PDV debounce hook and consumer rules.** Create `apps/web/src/ui/pdv/hooks/use-debounced-value.ts`:
- `useDebouncedValue<Value>(value, delayMs)` returns the latest value after `delayMs` without
  changes, and clears its timer on change and unmount.
- It is consumed by `useNewSaleCatalog` and `useComboProductDialog` at 250 ms. Under
  `ui-layer-rules.md` ("feature-level shared hook"), its two PDV consumers place it in
  `ui/pdv/hooks/`.
- It has no dedicated test, under `ui-layer-rules.md` and the test-integrity policy (no
  `ui/**/hooks/tests`); the consumer hook tests cover it.
- **Effective availability**, used by both consumers for presentation, pills and selection
  guards: `item.availability ?? (item.isAvailable ? 'available' : 'out_of_stock')`. This
  implements the Compatibility fallback and only reads server facts.
- **Effective search** sent by each consumer is `undefined` immediately when the trimmed input is
  empty, and otherwise the debounced trimmed value. So clearing, and `Limpar filtros`, request
  the default list without waiting (AC-13), while typing waits 250 ms.

**Icons.** Modify `apps/web/src/ui/shared/widgets/components/icon/types/icon-name.ts` and
`lucide-icon/icons.ts` to register `circle-off` and `circle-dollar-sign`.

**Reason pill.** Create a pure prop-to-markup widget under
`apps/web/src/ui/pdv/widgets/components/` (proposed name `sales-catalog-availability-pill/`):
- It is built on the shadcn `Badge` and takes an `availability` that is not `available` plus an
  `id` for `aria-describedby`.
- It renders the localized label and icon from a typed map: `out_of_stock` → `Sem estoque` /
  `circle-off`; `missing_price` → `Sem preço` / `circle-dollar-sign`.
- Styling follows the handoff.

**New Sale catalog.** `new-sale-page/new-sale-catalog/{index.tsx, use-new-sale-catalog.ts}`
[modify]. The hook owns:
- `search` (immediate input value) and the effective search defined above; page reset to 1 when
  the effective search changes;
- `handleClearFilters` resetting search, kind and page; the effective search becomes `undefined`
  immediately;
- `hasSearch` and the count label (FR-12);
- per-card derived presentation: unavailable flag from the effective availability defined above,
  price label (FR-07), pill/description id;
- `handleSelectProduct`, which ignores any product whose effective availability is not
  `available`.

The entry renders:
- the unavailable card with `bg-muted` and 0.7 opacity;
- the pill instead of the `Disponível`/`Adicionado` badge when the product is unavailable;
- the `Adicionar` `Button` with `aria-disabled="true"` and `aria-describedby` pointing to the pill
  when unavailable, with no native `disabled`, and activation delegated to the guarded handler.

Extracting the card into a child widget is allowed under the UI Rules; the name is
implementer-owned.

**Combo picker.** `combo-discount-page/combo-product-dialog/{index.tsx, use-combo-product-dialog.ts}`
[modify]. The hook:
- replaces its local `setTimeout` debounce with `useDebouncedValue` and the effective-search rule
  above;
- keeps the existing `isActive` and already-added filters;
- presents rows and pills from the effective availability, and has `handleSelectProduct` ignore
  any product whose effective availability is not `available`.

Disabled rows render:
- `aria-disabled="true"` and no `aria-pressed` selection;
- muted icon and text (`opacity-55`);
- the shared pill instead of the trailing `arrow` icon;
- an `aria-describedby` reason.

**Unchanged:**
- New Sale configuration dialogs, cart, `new-sale-cart-storage.ts` and `use-new-sale-page.ts`
  still receive `SalesCatalogProduct`. A `SalesCatalogListItem` is assignable to it.
- Loading, empty and error states.

**Expected Web tree:**

```text
apps/web/
├── src/rest/services/pdv-service.ts                                              [modify]
├── src/ui/shared/widgets/components/icon/{types/icon-name.ts, lucide-icon/icons.ts} [modify]
├── src/ui/pdv/hooks/{use-order-catalog-query.ts, use-combo-products-query.ts}    [modify]
├── src/ui/pdv/hooks/use-debounced-value.ts                                       [create]
├── src/ui/pdv/widgets/components/sales-catalog-availability-pill/index.tsx       [create, proposed]
├── src/ui/pdv/widgets/pages/new-sale-page/new-sale-catalog/
│   ├── index.tsx, use-new-sale-catalog.ts                                        [modify]
│   └── tests/{new-sale-catalog.test.tsx, use-new-sale-catalog.test.ts}           [modify]
├── src/ui/pdv/widgets/pages/combo-discount-page/
│   ├── combo-product-dialog/{index.tsx, use-combo-product-dialog.ts}             [modify]
│   │   └── tests/{combo-product-dialog.test.tsx, use-combo-product-dialog.test.ts} [modify]
│   └── tests/combo-test-fixtures.ts                                              [modify]
└── tests/pdv/{new-sale-page.test.ts, new-discount-page.test.tsx}                 [modify]
```

## 4. Verification Contract

| Acceptance | Checker and permitted boundary | Expected assertion | Evidence target |
| --- | --- | --- | --- |
| AC-01 | Core: `list-order-catalog-use-case.test.ts`, `list-combo-products-use-case.test.ts` (mocked `SalesCatalogProvider`). Server: both controller tests (real DB fixture). MV-01/MV-02. | Without search or with whitespace, only `available` items are returned, including price `0` with stock. The provider receives `search: undefined`. | `evaluation.md` |
| AC-02 | Same Core and controller tests; route suites `new-sale-page.test.ts`, `new-discount-page.test.tsx` (mocked transport: outgoing `search` query); MV-01/MV-02 | Mixed-availability matches in name/id order; clearing returns the default set | `evaluation.md` |
| AC-03 | Core tests; controller tests | The kind filter alone hides unavailable products; kind plus search reveals them within that kind | `evaluation.md` |
| AC-04 | Core tests in both use-case files (each availability for Portion, single-stock Resale and by-brand Resale; both-states precedence; price `0`; non-finite price; inactive-only priced option); controller tests (seeded through `PdvModuleFixture`: no size, no resale configuration, brand without configuration, zero stock, price `0`); `new-sale-catalog.test.tsx` (pills, icons, price lines, added-and-unavailable precedence, no "Preço sob consulta"); MV-01 | Exact `availability` values and visible pt-BR copy | `evaluation.md` |
| AC-05 | `combo-product-dialog.test.tsx` (hook mocked); `new-discount-page.test.tsx`; MV-02 | Default has no disabled rows; search shows disabled rows with the correct pill | `evaluation.md` |
| AC-06 | `combo-product-dialog.test.tsx`, `use-combo-product-dialog.test.ts`, `new-discount-page.test.tsx` (click, Enter, Space); MV-02 keyboard path | No selection and no pane change; `aria-disabled` and description present; focus retained | `evaluation.md` |
| AC-07 | `new-sale-catalog.test.tsx`, `use-new-sale-catalog.test.ts`, `new-sale-page.test.ts` (Tab, Enter, Space, click; no dialog); MV-01 keyboard path | No dialog and no cart change; `aria-disabled="true"`, not `disabled`, description contains the reason | `evaluation.md` |
| AC-08 | Core tests (page slicing, `total`, `totalPages`, page beyond range); controller tests (`pageSize=1`, pages 1 and 2, `pageSize=51` → 422) | Counts reflect the filtered set; validation errors unchanged | `evaluation.md` |
| AC-09 | Controller tests (foreign establishment product with a matching name; Operator → 403 on `/discounts/catalog`; anonymous → 401 on both; Manager/Operator → 200 on `/orders/catalog`) | No foreign items; unchanged statuses | `evaluation.md` |
| AC-10 | Controller tests (response body includes `availability`; `isAvailable` consistent); REST parity inspection of `orders.rest`/`discounts.rest` against the controllers; `use-new-sale-catalog.test.ts` and `use-combo-product-dialog.test.ts` (missing-`availability` fallback) | Additive field present; examples cover the routes; fallback presentation and selection guard | `evaluation.md` |
| AC-11 | `new-sale-catalog.test.tsx` (hook mocked with both labels); `use-new-sale-catalog.test.ts` (label follows the debounced value); MV-01 | Exact copy for both states | `evaluation.md` |
| AC-12 | MV-01, MV-02 at 1481 × 1050 and 390 × 844; independent Visual Reviewer against `VEtyb.png`/`cUFG9.png` | Matches the references except the allowed deviations; no horizontal overflow; pills intact | `evaluation.md` (visual EV) |
| AC-13 | `use-new-sale-catalog.test.ts`, `use-combo-product-dialog.test.ts` (fake timers: no query before 250 ms, trimmed value after, page reset, immediate clear); route suites assert the final outgoing query | Debounce timing and request contents | `evaluation.md` |
| AC-14 | Existing suites: `register-combo-use-case.test.ts`, `revise-combo-use-case.test.ts`, `list-combos-use-case.test.ts`, `revalidate-combos-for-product-use-case.test.ts`, `register-order-use-case.test.ts`; existing combo and order controller tests; one added assertion in `create-combo.controller.test.ts` that an active Combo with an out-of-stock priced component is still created | No behavior change | `evaluation.md` |

**Mutation (targeted Stryker):**
- **Scope:** `src/pdv/use-cases/list-order-catalog-use-case.ts` and
  `src/pdv/use-cases/list-combo-products-use-case.ts`. They consume
  `SalesCatalogAvailabilityStrategy`, which is not a mutation target.
- **Mapped ACs:** AC-01–AC-04, AC-08, AC-10.
- **Pass conditions:**
  - Each file scores at least 70%.
  - No `NoCoverage` mutant on the changed lines.
  - Every surviving mutant in what the use cases own is either killed by a strengthened behavior
    assertion or recorded in Evaluation as an equivalent mutant with a reason. That means: setting
    `availability` and `isAvailable` from the Strategy result, excluding inactive products, the
    search-dependent reveal filter, whitespace normalization, and the slice/`total`/`totalPages`
    arithmetic.
  - **FR-04 classification** lives in the non-mutated Strategy, so it is proved only by the AC-04
    matrix executed through **both** use cases. For each of Portion, single-stock Resale and
    by-brand Resale, the matrix covers: available; out of stock; missing price; both (precedence);
    price `0`; a non-finite price; and an inactive-only priced option.
  - Execution errors are corrected, not waived.
  - Core CI's `--all` comparison gate must also pass.

| Command | Purpose and prerequisites |
| --- | --- |
| `pnpm --filter @scoops/core test` | Core use-case tests |
| `pnpm --filter @scoops/core test:mutation --files src/pdv/use-cases/list-order-catalog-use-case.ts src/pdv/use-cases/list-combo-products-use-case.ts` | Targeted mutation; Node.js ≥ 22.18 |
| `pnpm --filter @scoops/core check:code`, `check:architecture`, `check:types`, `test:coverage` | Core static checks and coverage floor |
| `pnpm --filter server test` / `test:coverage` | Controller integration; requires a Docker-compatible runtime for Testcontainers |
| `pnpm --filter server check:code`, `check:architecture`, `check:types`, `build` | Server static checks and build |
| `pnpm --filter web test` / `test:coverage` | Widget and hook tests |
| `pnpm --filter web test:integration` | Mocked Playwright route suites (port 4001); not real-service proof |
| `pnpm --filter web check:code`, `check:architecture`, `check:types`, `build` | Web static checks and build |
| `pnpm --filter @scoops/core check:complexity`, `pnpm --filter server check:complexity`, `pnpm --filter web check:complexity` | CodeMultiVitals gate run by each CI `Complexity` job. New or worsened violations must be fixed. Do not regenerate `.code-multivitals-baseline.json` to absorb them. The DTO split must not introduce new violations. |
| `pnpm check:test-integrity` | Test-ownership policy (no direct tests for the provider, REST service, query hooks or the PDV feature hook `useDebouncedValue`) |

Mocked route suites and widget tests prove UI and transport mapping only. MV-01 and MV-02 provide
the real authenticated, server-backed proof.

### MV-01: New Sale, default and search, desktop, narrow and keyboard

- **Acceptance:** AC-01, AC-02, AC-04, AC-07, AC-11, AC-12, AC-13.
- **Prerequisites:**
  - `docker compose ps` shows PostgreSQL healthy.
  - `pnpm --filter server dev` (`http://localhost:3336`) and `pnpm --filter web dev`
    (`http://localhost:4000`) are running.
  - The seeded Manager and Operator exist. If not, run `pnpm --filter server db:seed` explicitly,
    then `pnpm --filter web test:auth:setup`, preserving the tracked state files.
- **Fixtures:** as Manager, through the MRP UI/API, create resale products in the seeded
  establishment, all sharing the substring `zzteste`:
  - `zzteste disponível` with an active price and stock;
  - `zzteste sem estoque` with an active price and zero stock;
  - `zzteste sem preço` with stock and no active price configuration;
  - `zzteste ambos` with neither;
  - `zzteste grátis` with price `0` and stock.

  Record their ids.
- **Viewport and reference:** 1481 × 1050, then 390 × 844; [VEtyb.png](./design/VEtyb.png).

1. As Operator, open `/sales/new`. Confirm that no `zzteste sem estoque`, `zzteste sem preço` or
   `zzteste ambos` card appears on any page of the default list, and that `zzteste grátis` and
   `zzteste disponível` do (they can be found with the `Revendas` filter). The count reads
   `elegíveis`.
2. Select `Revendas` without search. The unavailable products are still absent.
3. Type `  zzteste  ` in "Buscar produto por nome". After about 250 ms, the request carries
   `search=zzteste`, the five cards appear in name order, the count reads `encontrados`, and the
   pills and price lines match AC-04.
4. Press Tab to the `Adicionar` button of `zzteste sem preço`. Confirm the visible focus and that
   the accessible description includes `Sem preço` (check the accessibility snapshot). Press Enter
   and Space. No dialog opens. Click it. No dialog opens.
5. Clear the search. The unavailable cards disappear immediately.
6. Repeat steps 3–4 at 390 × 844.

**Expected proof:**
- The final URL stays `/sales/new`.
- `GET /orders/catalog` responses include `availability`.
- The cart is unchanged by the disabled actions.
- No console errors or failed requests, other than ones classified as pre-existing.

**Capture and comparison:** fresh screenshots of the searched state at both viewports under
`apps/web/.playwright-cli/screenshots/`, compared with `VEtyb.png` except the allowed deviations.
Record paths and results in Evaluation.

**Cleanup:** delete the `zzteste` products as Manager, stop the dev servers started for the run,
and restore any changed tracked auth state.

### MV-02: Combo picker, default and search, desktop, narrow and keyboard

- **Acceptance:** AC-01, AC-02, AC-05, AC-06, AC-12, AC-13.
- **Prerequisites and fixtures:** as MV-01, signed in as Manager.
- **Viewport and reference:** 1481 × 1050, then 390 × 844; [cUFG9.png](./design/cUFG9.png).

1. Open `/discounts/new`, choose the Combo type, and click `Adicionar produto`. The default list
   has no `zzteste sem estoque`/`sem preço`/`ambos` rows.
2. Type `zzteste`. After about 250 ms, `GET /discounts/catalog?search=zzteste…` returns all five.
   Disabled rows show muted content and the correct pill.
3. Click `zzteste sem estoque`. Then Tab to `zzteste sem preço` and press Enter and Space. No row
   becomes selected and the configuration pane is unchanged. The description announces the reason.
4. Select `zzteste disponível` and add it. This path is unchanged.
5. Repeat steps 2–3 at 390 × 844.

**Expected proof:** no persisted Combo is created unless one is explicitly saved; if one is
created, delete it at cleanup. Check console and failed requests.

**Capture and comparison:** the searched dialog at both viewports, compared with `cUFG9.png`
except the allowed deviations.

**Cleanup:** as MV-01.

**Visual review:** an independent Visual Reviewer inspects the MV-01/MV-02 captures against the
saved references after they exist. The Orchestrator owns the official EV verdict.

## 5. Documentation alignment and revision history

| Authority | Applies to | Alignment |
| --- | --- | --- |
| `documentation/prds/pdv.md` PRQ-02, PRQ-11, PRQ-12, PRQ-13, Journeys C/E | Product behavior | **Approved change applied before this Spec** (Q13): PRQ-02 Outcome/Eligibility/Category/Product without price/Product out of stock/Search-only reveal/Unavailable products/Accessibility; Journey E step 5; new PRQ-13 Experience bullet. No `Implemented` checkbox changed. |
| `documentation/modules.md` | MRP is authoritative for stock and production facts; PDV consumes MRP's product and availability boundaries | Confirmed. Option-level and product-level `isAvailable` stay unchanged facts translated by the shared provision adapter. The PDV Strategy only combines those facts with the price rule to classify sale availability (in stock = `product.isAvailable`). |
| `documentation/architecture.md` §2, §7, §10, §11, §17 | Backend authority, Core business rules, API compatibility, quality boundaries | Confirmed; the business filter moves out of a server adapter; both deployment orders are compatible |
| `documentation/architecture.md` §18 | Paginate unbounded collections; avoid N+1 provider calls | **Recorded, accepted deviation.** The existing adapter already loads every matching product with per-product lookups. This change exposes that unbounded load in the provider contract instead of hiding it behind a paginated signature. Revisit with a SQL-level catalog query when catalog search approaches the PRQ-12 1-second target or an establishment's active Portion/Resale catalog grows into the hundreds. |
| `documentation/rules/core-package-rules.md` | One exported type per file; reusable rules as Strategies; Strategy tested via use cases | Confirmed |
| `documentation/rules/use-case-testing-rules.md` | One test file per use case; mocked contracts | Confirmed |
| `documentation/rules/provision-layer-rules.md`, `database-layer-rules.md` | Adapters perform no business filtering; no repository tests | Confirmed |
| `documentation/rules/rest-layer-rules.md` | One DTO per file, Swagger responses, `.rest` parity, web services via `RestClient` | Confirmed; the DTO file split is a repository-fixed correction |
| `documentation/rules/controllers-testing-rules.md` | Real-DB controller tests per controller | Confirmed |
| `documentation/rules/ui-layer-rules.md`, `widget-testing-rules.md`, `code-conventions-rules.md` | Widget/hook boundaries, shared hooks, shadcn `Badge`, `Icon` registry, pt-BR labels, hook-mocked component tests, feature-level hook placement in `ui/pdv/hooks` without a dedicated test (UI-layer hook rules plus the test-integrity policy) | Confirmed |
| `documentation/rules/validation-package-rules.md` | Existing catalog query schemas | Confirmed unchanged |
| `documentation/design.md` | Tokens, Lucide icons, non-color semantics | Confirmed; the `border-soft` utility gap is recorded as handoff deviation 6 |
| `documentation/tooling.md` | Commands, mutation, coverage, Playwright CLI | Confirmed |
| `documentation/features/pdv/combo-discount-management/design/manifest.md` | "Stock availability does not disable a commercially valid configuration" | Superseded for the picker list only (Q3). Combo validation semantics are unchanged. |

| Revision | Date | Material change and reason |
| --- | --- | --- |
| 1 | 2026-10-18 | Initial contract from issue #60 and clarification Q1–Q14 |
