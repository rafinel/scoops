---
title: Authenticated global search
status: in_progress
revision: 12
source:
  type: issue
  ref: https://github.com/rafinel/scoops/issues/47
scope:
  - .dependency-cruiser.mjs
  - .code-multivitals-baseline.json
  - packages/core/src/identity
  - packages/core/src/mrp/use-cases
  - packages/core/src/pdv/interfaces
  - packages/validation/src
  - apps/server/src/identity
  - apps/server/src/shared/provision/global-search
  - apps/server/src/pdv/database/drizzle/repositories
  - apps/server/rest-client/identity
  - apps/web
  - design/onoreo.pen
  - documentation/features/identity/global-search
last_updated_at: 2026-09-29
---

# 1. Context and scope

## Objective and source

Deliver Issue [#47](https://github.com/rafinel/scoops/issues/47) and Identity PRD PRQ-13's authenticated global search. A Manager finds authorized pages and establishment records across Identity, MRP and PDV. An Operator can find New Sale, Orders, Products, Sales Channels and Discounts, plus scoped product, order, channel and discount records; Products, Sales Channels and Discounts are read-only for Operators. This is a **complete** Spec because it spans three runtime applications, cross-module providers, role and tenant boundaries, route changes and several design-backed states.

## Current behavior and product gap

The authenticated Header renders a search input without search behavior. Each owning module already has list/read contracts, but no grouped global-search contract, no cross-module coordinator and no result navigation. The sales-channel page has an adjustment filter but no name filter. Existing role boundaries also deny Operators access to read-only product, sales-channel and discount surfaces; this Spec aligns navigation, page controls and server authorization with the amended Identity, MRP and PDV PRDs. Manager-only mutations and other administration remain protected.

| Area | In scope | Out of scope |
| --- | --- | --- |
| Search surface | Input in the shared authenticated Header on every page that renders that Header; grouped dropdown, loading, empty, error, retry and keyboard states | Search on public/authentication/onboarding pages without that Header; recent searches and suggestions |
| Page results | Manager: Dashboard, Products, New Sale, Orders, Sales Channels, Discounts, Users, Ice Cream Parlor Settings, Subscription, My Account and Accompaniment Types; Operator: New Sale, Orders, Products, Sales Channels and Discounts | Notifications, record detail pages and creation pages as page results, even where their Header includes search |
| Record results | Manager: products, orders, users, sales channels and discounts; Operator: products, orders, sales channels and discounts | Notifications, Billing and Communication records; user records; cross-establishment or unauthorized records |
| Navigation | Existing product, order and discount detail routes; sales-channel list with matched name filter; normal destination authorization | New record-detail route for sales channels; editing directly from search; Operator access to Manager-only mutations |

| Source requirement | Delivery | Notes |
| --- | --- | --- |
| Identity PRD PRQ-04 and PRQ-13 | Full role-aware global-search and authorization capability | Operators get read-only Products, Sales Channels and Discounts access plus New Sale and Orders; other Identity state flows remain under their existing Specs |
| MRP PRD PRQ-03, PRQ-04, PRQ-05 and PRQ-10 | Operator product browse and detail access | Product, stock-history and detail facts are read-only for Operators; MRP administration and production remain Manager-only |
| PDV PRD PRQ-01, PRQ-11 and PRQ-13 | Operator channel and discount read access | Operators can view scoped channel and Combo discount records; management actions remain Manager-only |
| GitHub Issue #47 | Full | Grouped, responsive, accessible search with saved Pencil references |

The explicit New Sale page result is the sole creation-page exception. “My Account” remains in the user menu for both roles, but is an Operator search exclusion under PRQ-13. The search bar remains usable on Notifications and detail/creation pages without making those pages searchable destinations. An Operator may open Products and product details, Sales Channels, Discounts and Combo details in view-only mode; product registration, channel/discount management, product administration, production and all other Manager-only destinations remain excluded.

**Product decision (confirmed 2026-09-28):** Operator read-only access applies to Products, Sales Channels and Discounts, including their authorized establishment-scoped records and global-search matches. Operators may continue the existing New Sale and Orders workflows; they cannot perform Manager-only management actions.

# 2. Implementation Contract

## Functional requirements

| ID | PRQ/source coverage | Required behavior |
| --- | --- | --- |
| FR-01 | PRQ-13; Issue #47 | The authenticated Header accepts a query from every page displaying it, with no query sent for blank/whitespace input; search begins after one non-space character. |
| FR-02 | PRQ-04, PRQ-13; MRP PRQ-04/05/10; PDV PRQ-01/11/13 | A Manager sees the named authorized page destinations and scoped product, order, user, sales-channel and discount matches. An Operator sees New Sale, Orders, Products, Sales Channels and Discounts, plus establishment-scoped product, order, sales-channel and discount matches. User records and other excluded destinations never appear. |
| FR-03 | PRQ-13; Issue #47 | Matches are grouped by page/record type and each row identifies its type and matching name/number, with type-specific distinguishing context and status where relevant. No pictured stock count, price or discount percentage is mandatory. |
| FR-04 | PRQ-04, PRQ-13; MRP PRQ-03/05/10; PDV PRQ-01/11/13 | Product, order, user and discount results open their authorized detail page; sales-channel results open Sales Channels filtered by the matched name. Page results open their authorized page. Operators can read product details, including stock history, sales-channel and discount pages/details but cannot use Manager-only actions. Direct addresses and server operations enforce the same role and establishment restrictions; an Operator opening the Dashboard root reaches New Sale, their authorized default after sign-in. |
| FR-05 | PRQ-13 | Search uses case-insensitive substring matching for names and email, exact numeric order-sequence matching with optional `#`, and snapshotted order-product-name substring matching otherwise. Each type returns at most five matches in a stable order. |
| FR-06 | PRQ-13 | Search shows distinct pending, no-results and failed states. A failure in any record provider fails the entire query; retry uses the current query and no partial results masquerade as complete. |
| FR-07 | PRQ-13 | The dropdown supports arrow-key traversal, Enter activation, Escape dismissal, visible focus, accessible result names and announcements for loading, empty, error and result count. It works at 320 px without mandatory horizontal scrolling and meets relevant WCAG 2.2 AA requirements. |
| FR-08 | PRQ-13 | A query longer than 100 characters is rejected; browser requests are delayed about 250 ms after typing and outdated responses cannot replace a newer query. Search is read-only and does not persist query history. |

## Acceptance criteria

| ID | FR coverage | Requirement | Given | When | Then | Expected evidence |
| --- | --- | --- | --- | --- | --- | --- |
| AC-01 | FR-01, FR-08 | Header availability and query boundary | Signed-in Manager or Operator on each protected page category | They type, clear or exceed the query limit | The control is present, blank input sends no request, a non-space character starts one debounced request, and overlong input cannot reach search | Widget test; MV-01 |
| AC-02 | FR-02, FR-05 | Manager results | Manager with two establishments' similarly named fixtures | They search each record type and page label | Only current-establishment authorized matches and listed Manager destinations appear; matching and five-per-type cap are stable | Core/controller tests; MV-01 |
| AC-03 | FR-02, FR-05 | Operator results | Operator with accessible product, order, sales-channel and discount fixtures | They search names, email, number and page labels | Only New Sale, Orders, Products, Sales Channels and Discounts destinations plus scoped product/order/channel/discount matches appear; user records and Manager-only destinations are absent | Core/controller tests; MV-01 |
| AC-04 | FR-03 | Distinguishable grouped rows | A query matches multiple types or similar names | Results render | Page and record groups are distinct; each row has type, primary label, relevant context/status and accessible name | Widget test; MV-01 |
| AC-05 | FR-04 | Result navigation and direct protection | Authorized result or guessed record address | User activates result or enters address directly | Correct canonical detail/list route opens with filtered sales channel; unauthorized role/foreign tenant is rejected | Route/controller tests; MV-01 for authorized navigation |
| AC-06 | FR-05, FR-08 | Match limits and races | Queries change rapidly; orders have current names and immutable snapshots | User types number with/without `#`, text, then another query | Exact sequence and snapshot-name rules hold, order is stable, each group has ≤5 results, and stale response never replaces latest | Core/widget tests; MV-01 for a successful match |
| AC-07 | FR-06 | State and failure recovery | Pending, no-match and failing provider fixtures | Query settles or retry is activated | Distinct design states appear; any provider failure yields one error with retry and no partial group | Core/controller/widget/account-route automated tests |
| AC-08 | FR-07 | Keyboard and accessibility | Dropdown has several results | User uses ArrowDown/ArrowUp, Enter, Escape and Tab | Active item/focus is visible and announced, Enter navigates, Escape closes and returns focus, Tab preserves normal focus order | Widget test; MV-01 for successful keyboard navigation |
| AC-09 | FR-07 | Responsive design | 1280 × 720 and 320 × 700 viewports | Header and each dropdown state open | Relevant saved Pencil hierarchy is preserved with no horizontal overflow, clipping, hidden action or contrast/focus failure | MV-01 success screenshots; automated state artifacts |
| AC-10 | FR-02, FR-04 | Authorization cannot be bypassed | Operator or foreign-establishment account | They call search API or navigate directly to restricted Manager-only destinations/records | Server/route deny unauthorized data; Dashboard root redirects Operator to New Sale; UI navigation cannot expand access beyond the explicitly permitted read pages | Core/authenticated-controller/route automated tests |
| AC-11 | FR-02, FR-04, FR-08 | Operator read-only pages and records | Operator and Manager with same-establishment Product, Order, Sales Channel and Discount fixtures | Operator opens each permitted page/detail and attempts a Manager-only mutation | Operator can read scoped product, stock-history, order, channel and discount records and search matches; management controls, Order cancellation and product-registration empty-state CTA are unavailable; direct write attempts are rejected without changing data; Manager actions still work | Core/controller authorization tests, Web route/page tests and MV-01 |

## Design Contract

The implementation follows [the nine-frame design manifest](./design/manifest.md) and the saved `design/onoreo.pen` nodes. The dropdown is anchored to the shared Header search input, bounded by the viewport, and uses existing design tokens and UI primitives. At narrow width, the full Header and panel preserve controls and readable wrapped rows. Visual references define treatment and hierarchy; the FR/AC contract defines behavior, role variation and row data. No exact pictured stock quantity, price or discount percentage is required. The manifest records all supplied and newly drawn states and their validation identifiers.

Operator read-only pages reuse the established Products, Sales Channels and Discounts layouts and design tokens. Their role variation removes management controls while preserving readable product/stock-history/channel/discount facts, page filtering, details navigation, and responsive hierarchy. Capture fresh desktop screenshots for all three read-only pages and inspect them against their owning page designs during MV-01; no new page layout or Pencil frame is introduced.

# 3. Technical Contract

## Current technical state

| Evidence | Current responsibility | Gap |
| --- | --- | --- |
| `apps/web/src/ui/shared/widgets/layouts/app-layout/header/index.tsx` | Renders Header input | No state, request, dropdown or keyboard behavior |
| `apps/web/src/constants/routes.ts` and `sidebar-items.ts` | Canonical paths and profile-filtered navigation | Navigation and direct route guards must expose only the approved Operator destinations; global search applies the same allowlist |
| `apps/web/src/ui/identity/widgets/pages/login-page/use-login-page.ts` | Sends successful sign-in to `/` by default | Dashboard is Manager-only; root must redirect Operators to New Sale to preserve normal sign-in |
| `apps/web/src/routes/_authenticated/sales-channels/index.tsx` and `discounts/index.tsx` | Parse page filters and resolve authorized destinations | Read-only views need Operator access while mutations stay Manager-only |
| Identity/MRP/PDV list repositories | Scoped paginated reads for each owning domain | No unified, bounded global-search provider contract |
| `apps/server/src/identity/identity.module.ts` | Composes Identity REST/use cases | No cross-module search coordinator/provider registration |
| MRP/PDV read controllers and use cases | Serve scoped Products, Sales Channels and Discounts reads | Operator read access must be separated from Manager-only mutations |

## Solution and boundary flow

`GET /global-search?q=<trimmed query>` is authenticated. Identity owns the use case, query validation, role/page policy and response grouping. The server derives profile and establishment from the authenticated request; client IDs never select either. The use case calls focused Identity, MRP and PDV read-only provider ports. Providers reuse each module's repository/query semantics and return only scoped hits. Manager invokes all three; Operator invokes MRP product search and PDV order, sales-channel and discount search, never Identity user search. Calls may run concurrently, but one rejection rejects the whole search response. No transaction, mutation, event or new persistence table is involved; the response reflects current committed records and historical order-line names. Stable group and row order and per-type caps are server guarantees. REST maps validation/auth/provider failures to existing error handling. The browser debounces and keys/cancels queries so stale responses are ignored, then maps typed page keys and record IDs to canonical routes. Sales-channel navigation serializes the name into the list route's `search` parameter. The Dashboard root resolves the server-authenticated profile and redirects an Operator to New Sale, including after the existing login default navigation; other Manager-only routes use the existing Access Denied guard. Operators may use the user-facing GET/read endpoints for Products, Sales Channels, Discounts and their records. Administrative impact previews, production endpoints, the Combo editor catalog, every mutation and other Manager-only routes remain restricted to Managers.

| Boundary | Producer | Consumer | Canonical contract | Mapping/guarantees | Failure ownership |
| --- | --- | --- | --- | --- | --- |
| Browser → HTTP | GlobalSearch query hook | GlobalSearchController | `globalSearchQuerySchema`, `GlobalSearchResults` | Trimmed 1–100 characters; no tenant/profile input | REST validation/auth guards |
| Identity → providers | SearchGlobalUseCase | Identity/MRP/PDV provider ports | `GlobalSearchProviderInput` and typed hits | Manager invokes all; Operator invokes MRP products and PDV orders/channels/discounts; server account scope; ≤5 per type; no partial success | Use case propagates failure |
| Provider → repository | Focused provider adapter | Owning module repository | Existing scoped list/read contracts plus bounded channel-name lookup | Existing domain ownership and tenant predicates | Provider rejects; no cross-module DB access in Core |
| HTTP → UI | GlobalSearchController | IdentityService and query hook | `GlobalSearchResults` | Explicit group arrays, type discriminants, IDs and status/context | Web error state and retry |

### packages/core — Domain

| Declaration | Kind | Ownership/identity | Contract summary | Consumers |
| --- | --- | --- | --- | --- |
| `GlobalSearchHit` | Structure | Identity projection; no independent lifecycle | Discriminated page/product/order/user/sales-channel/discount result, each with typed destination data | Providers, use case, REST, Web |
| `GlobalSearchResults` | Structure | Identity projection | Explicit page, product, order, user, salesChannel and discount arrays | Use case, REST, Web |
| `GlobalSearchProviderInput` | Structure | Identity request value | Authenticated establishment, query and limit; role policy remains in use case | Provider ports |

| Path | Change | Declaration and resulting field schema | Runtime guarantee |
| --- | --- | --- | --- |
| `packages/core/src/identity/domain/structures/global-search-hit.ts` | Create | `GlobalSearchHit`: union `{kind:'page'; pageKey: GlobalSearchPageKey; label:string}` or `{kind:'product'; productId:string; label:string; status?:string}` or `{kind:'order'; orderId:string; label:string; context:string; status:string}` or `{kind:'user'; userId:string; label:string; context:string; status:string}` or `{kind:'salesChannel'; salesChannelId:string; label:string; status:string}` or `{kind:'discount'; discountId:string; label:string; status:string}`. | ID fields are type-specific; no generic identity field on this value structure. Context fields carry safe display text only. |
| `packages/core/src/identity/domain/structures/global-search-page-key.ts` | Create | `GlobalSearchPageKey`: string union of `dashboard`, `products`, `newSale`, `orders`, `salesChannels`, `discounts`, `users`, `shopSettings`, `subscription`, `account`, `accompanimentTypes`. | Only server-defined keys can become page results; no arbitrary URL. |
| `packages/core/src/identity/domain/structures/global-search-results.ts` | Create | `GlobalSearchResults`: `{pages: Extract<GlobalSearchHit,{kind:'page'}>[]; products: Extract<GlobalSearchHit,{kind:'product'}>[]; orders: Extract<GlobalSearchHit,{kind:'order'}>[]; users: Extract<GlobalSearchHit,{kind:'user'}>[]; salesChannels: Extract<GlobalSearchHit,{kind:'salesChannel'}>[]; discounts: Extract<GlobalSearchHit,{kind:'discount'}>[]}`. | Every group is present and contains only its discriminant; empty arrays express no match. |
| `packages/core/src/identity/domain/structures/global-search-provider-input.ts` | Create | `GlobalSearchProviderInput`: `{establishmentId:string; currentUserId:string; query:string; limit:number}`. | Account and tenant values come from authenticated server context, never the browser. |
| `packages/core/src/identity/domain/structures/index.ts` | Modify | Export the four structures. | Public Core structure path resolves. |

The type declarations above are the complete resulting schemas. Implementers may make group arrays narrow to their discriminants without changing serialized fields. Labels/context/status are safe, current display data; order product text comes from the persisted snapshot. No auth secrets, payment fields or provider identifiers appear.

### packages/core — Interfaces

| Declaration | Role | Direct collaborator |
| --- | --- | --- |
| `IdentityGlobalSearchProvider` | Scoped user hits | `SearchGlobalUseCase` |
| `MrpGlobalSearchProvider` | Scoped product hits | `SearchGlobalUseCase` |
| `PdvGlobalSearchProvider` | Scoped order, sales-channel and discount hits | `SearchGlobalUseCase` |
| `IdentityService.searchGlobal` | Browser-facing service contract | Web REST implementation |

| Path | Change | Declaration | Runtime guarantee |
| --- | --- | --- | --- |
| `packages/core/src/identity/interfaces/identity-global-search-provider.ts` | Create | `IdentityGlobalSearchProvider.searchUsers(input): Promise<GlobalSearchHit[]>` | Read-only, scoped and bounded user matches; excludes current user if its detail route is unavailable. |
| `packages/core/src/identity/interfaces/mrp-global-search-provider.ts` | Create | `MrpGlobalSearchProvider.searchProducts(input): Promise<GlobalSearchHit[]>` | Read-only, scoped and bounded product matches. |
| `packages/core/src/identity/interfaces/pdv-global-search-provider.ts` | Create | `PdvGlobalSearchProvider.searchOrders/searchSalesChannels/searchDiscounts(input): Promise<GlobalSearchHit[]>` | Read-only, scoped and bounded owning-domain matches. |
| `packages/core/src/identity/interfaces/identity-service.ts` | Modify | Add `searchGlobal(query): Promise<RestResponse<GlobalSearchResults>>` using the existing service response convention. | Browser and provider implementation agree on response shape. |
| `packages/core/src/identity/interfaces/index.ts` | Modify | Export the three provider ports. | Core use case imports public interfaces. |
| `packages/core/src/pdv/interfaces/sales-channels-repository.ts` | Modify | `SalesChannelsRepository.searchByName(establishmentId, query, limit)` | PDV owns the bounded channel read contract; Identity never imports Drizzle. |

### packages/core — Use cases

| Path | Change | Declaration | Runtime guarantee |
| --- | --- | --- | --- |
| `packages/core/src/identity/use-cases/search-global-use-case.ts` | Create | `SearchGlobalUseCase.execute(request: {actor: Account; query: string}): Promise<GlobalSearchResults>` | Checks Manager/Operator profile, derives tenant/profile from the account already resolved as active by AuthenticationGuard, filters pages, calls only the role-permitted providers, enforces caps/order and fails atomically. Operators receive product/order/channel/discount hits but never user hits. |
| `packages/core/src/identity/use-cases/index.ts` | Modify | Export `SearchGlobalUseCase`. | REST controller resolves canonical declaration. |
| `packages/core/src/identity/use-cases/tests/search-global-use-case.test.ts` | Create | Use-case behavior tests. | Prove role/tenant argument propagation, grouping, limits, exclusions and all-or-error behavior through provider fakes. |
| `packages/core/src/mrp/use-cases/list-stock-transactions-use-case.ts` | Modify | `ListStockTransactionsUseCase` | Allows a same-establishment Operator to inspect immutable product stock history while retaining actor checks, product lookup and tenant scope. |
| `packages/core/src/mrp/use-cases/tests/list-stock-transactions-use-case.test.ts` | Modify | Use-case behavior tests. | Prove scoped Operator history access and retain invalid actor, missing product and invalid-filter rejection. |

### packages/validation — Validation

| Path | Change | Declaration | Runtime guarantee |
| --- | --- | --- | --- |
| `packages/validation/src/identity/global-search-query-schema.ts` | Create | `globalSearchQuerySchema`: object `{q: trimmed string, min 1, max 100}`. | Server rejects empty/overlong query; browser cannot widen the boundary. |
| `packages/validation/src/index.ts` | Modify | Export query schema. | Server uses the shared public validation entry. |
| `packages/validation/src/web/sales-channels-search-schema.ts` | Modify | Add optional trimmed `search` name filter beside `adjustment`. | URL round-trip preserves both filters; invalid input normalizes under existing route convention. |

### apps/server — Database

| Path | Change | Declaration | Runtime guarantee |
| --- | --- | --- | --- |
| `apps/server/src/pdv/database/drizzle/repositories/drizzle-sales-channels-repository.ts` | Modify | Implement `searchByName` as an establishment-scoped case-insensitive substring query. | Stable name/ID ordering, ≤5 hits and no cross-tenant reads. |

Existing Identity users, MRP products, PDV orders and discounts read contracts are reused with `page: 1` and `pageSize: 5`, and their current scoped query/order semantics. Providers must not filter an arbitrary unsearched page. No schema migration or generated SQL is required.

### apps/server — Provision

| Declaration | Role | Direct collaborator |
| --- | --- | --- |
| `IdentityGlobalSearchProviderAdapter` | Maps Identity user repository rows to user hits | Identity repository token |
| `MrpGlobalSearchProviderAdapter` | Maps MRP product repository rows to product hits | MRP repository token |
| `PdvGlobalSearchProviderAdapter` | Maps PDV order/channel/discount repository rows to PDV hits | PDV repository tokens |

| Path | Change | Declaration | Runtime guarantee |
| --- | --- | --- | --- |
| `apps/server/src/shared/provision/global-search/identity-global-search-provider.ts` | Create | `IdentityGlobalSearchProviderAdapter` | Scope by account establishment; omit unopenable current-user detail. |
| `apps/server/src/shared/provision/global-search/mrp-global-search-provider.ts` | Create | `MrpGlobalSearchProviderAdapter` | Query owning MRP repository with stable, bounded name match. |
| `apps/server/src/shared/provision/global-search/pdv-global-search-provider.ts` | Create | `PdvGlobalSearchProviderAdapter` | Query owning PDV repositories; sequence/snapshot rules and stable bounded matches. |

### apps/server — REST

| Path | Change | Declaration | Runtime guarantee |
| --- | --- | --- | --- |
| `apps/server/src/identity/decorators/global-search-controller.ts` | Create | `GlobalSearchController()` route decorator for `/global-search`. | Same authentication and profile guard pattern as other Identity controllers. |
| `apps/server/src/identity/decorators/index.ts` | Modify | Export decorator. | REST registration uses public decorator. |
| `apps/server/src/identity/rest/controllers/search-global.controller.ts` | Create | `SearchGlobalController` with one `GET /global-search?q=` operation; constructor injects three `IDENTITY_PROVIDERS.globalSearch*` tokens typed as Core ports and creates `SearchGlobalUseCase` once. | Authenticated account comes from server guard, Zod validates query, response serializes every group; no tenant/profile request field. |
| `apps/server/src/identity/rest/controllers/index.ts` | Modify | Export controller. | Identity module registers it. |
| `apps/server/src/identity/rest/dtos/global-search-hit-response.dto.ts` | Create | `GlobalSearchHitResponseDto` with type discriminant, page key or type-specific record ID, label, optional context/status and Swagger metadata. | Explicit transport shape; maps safe Core hits without leaking identity/provider fields. |
| `apps/server/src/identity/rest/dtos/global-search-response.dto.ts` | Create | `GlobalSearchResponseDto` with six typed hit arrays and `from` projection. | Every group appears in JSON and Swagger; nested arrays reference hit DTO. |
| `apps/server/src/identity/rest/dtos/index.ts` | Modify | Export both search DTOs. | Controller can declare successful response type. |
| `apps/server/src/identity/rest/controllers/tests/search-global.controller.test.ts` | Create | Controller tests. | Validate 422/401/403 and mapped response/failure with actual controller boundary. |
| `apps/server/rest-client/identity/global-search.rest` | Create | One Manager/Operator request example for the sole route. | Method, path and query match controller exactly; no scope token in URL/body. |

### apps/server — Existing read authorization

| Path | Change | Runtime guarantee |
| --- | --- | --- |
| `apps/server/src/mrp/rest/controllers/list-products.controller.ts` | Confirm | Preserve the existing scoped Manager/Operator product list authorization; Operator results must remain tenant-scoped. |
| `apps/server/src/mrp/rest/controllers/get-product-settings.controller.ts`, `get-product-stock.controller.ts`, `list-stock-transactions.controller.ts`, `get-product-recipe.controller.ts`, `get-product-accompaniments.controller.ts`, `get-product-pricing.controller.ts` and their Core read use cases | Modify | Authenticated Manager and Operator can read only current-establishment product and stock-history data; product writes, stock adjustments, production and management previews remain Manager-only. |
| `apps/server/src/pdv/rest/controllers/list-sales-channels.controller.ts`, `list-combos.controller.ts`, and `get-combo.controller.ts` with their core read use cases | Modify | Authenticated Manager and Operator can read only current-establishment channels and discounts; channel and discount mutations remain Manager-only. |
| `packages/core/src/mrp/use-cases/get-product-settings-use-case.ts`, `get-product-stock-use-case.ts`, `get-product-recipe-use-case.ts`, `get-product-accompaniments-use-case.ts`, `get-product-pricing-use-case.ts` | Modify | Allow authenticated Operators through the read-only use-case boundary while preserving authenticated actor, establishment scope, and Manager-only write use cases. |
| `packages/core/src/pdv/use-cases/list-sales-channels-use-case.ts`, `list-combos-use-case.ts`, `get-combo-use-case.ts` | Modify | Allow authenticated Operators through channel/discount read boundaries while preserving establishment scope and Manager-only mutation use cases. |

### Revision 6 — server Operator authorization test paths

| Path | Change | Required test coverage |
| --- | --- | --- |
| `apps/server/src/mrp/rest/controllers/tests/list-products.controller.test.ts` | Modify | Operator product-list reads succeed for current establishment and reject foreign records. |
| `apps/server/src/mrp/rest/controllers/tests/get-product-settings.controller.test.ts` | Modify | Operator product settings response is scoped; foreign records remain unavailable. |
| `apps/server/src/mrp/rest/controllers/tests/get-product-stock.controller.test.ts` | Modify | Operator stock facts read; stock adjustments remain Manager-only. |
| `apps/server/src/mrp/rest/controllers/tests/list-stock-transactions.controller.test.ts` | Modify | Operator reads scoped immutable stock history; foreign product history remains unavailable. |
| `apps/server/src/mrp/rest/controllers/tests/get-product-recipe.controller.test.ts` | Modify | Operator recipe facts read; recipe mutations remain Manager-only. |
| `apps/server/src/mrp/rest/controllers/tests/get-product-accompaniments.controller.test.ts` | Modify | Operator accompaniment facts read; accompaniment management remains Manager-only. |
| `apps/server/src/mrp/rest/controllers/tests/get-product-pricing.controller.test.ts` | Modify | Operator product pricing facts read; price configuration writes remain Manager-only. |
| `apps/server/src/pdv/rest/controllers/tests/list-sales-channels.controller.test.ts` | Modify | Operator reads establishment channels; foreign channels remain unavailable. |
| `apps/server/src/pdv/rest/controllers/tests/list-combos.controller.test.ts` | Modify | Operator reads establishment discounts; foreign discounts remain unavailable. |
| `apps/server/src/pdv/rest/controllers/tests/get-combo.controller.test.ts` | Modify | Operator reads Combo details; foreign discounts remain unavailable. |
| `packages/core/src/mrp/use-cases/tests/get-product-settings-use-case.test.ts` | Modify | Operator authorization reaches scoped product settings; invalid actors and foreign-establishment products remain rejected. |
| `packages/core/src/mrp/use-cases/tests/get-product-stock-use-case.test.ts` | Modify | Operator authorization reaches scoped stock facts; write authorization remains Manager-only. |
| `packages/core/src/mrp/use-cases/tests/get-product-recipe-use-case.test.ts` | Modify | Operator authorization reaches scoped recipe facts; mutation use cases remain Manager-only. |
| `packages/core/src/mrp/use-cases/tests/get-product-accompaniments-use-case.test.ts` | Modify | Operator authorization reaches scoped accompaniment facts; management use cases remain Manager-only. |
| `packages/core/src/mrp/use-cases/tests/get-product-pricing-use-case.test.ts` | Modify | Operator authorization reaches scoped product pricing facts; pricing configuration remains Manager-only. |
| `packages/core/src/pdv/use-cases/tests/list-sales-channels-use-case.test.ts` | Modify | Operator authorization reaches establishment-scoped channel reads; foreign scope remains rejected. |
| `packages/core/src/pdv/use-cases/tests/list-combos-use-case.test.ts` | Modify | Operator authorization reaches establishment-scoped discount reads; foreign scope remains rejected. |
| `packages/core/src/pdv/use-cases/tests/get-combo-use-case.test.ts` | Modify | Operator authorization reaches establishment-scoped discount details; foreign scope remains rejected. |
| `apps/server/src/mrp/rest/controllers/tests/add-recipe-ingredient.controller.test.ts` | Modify | Operator write is denied without state change; Manager behavior remains allowed. |
| `apps/server/src/mrp/rest/controllers/tests/adjust-product-stock.controller.test.ts` | Confirm | Operator write is denied without state change; Manager behavior remains allowed. |
| `apps/server/src/mrp/rest/controllers/tests/change-product-categories.controller.test.ts` | Confirm | Operator write is denied without state change; Manager behavior remains allowed. |
| `apps/server/src/mrp/rest/controllers/tests/change-product-unit.controller.test.ts` | Confirm | Operator write is denied without state change; Manager behavior remains allowed. |
| `apps/server/src/mrp/rest/controllers/tests/create-accompaniment-type.controller.test.ts` | Confirm | Operator write is denied without state change; Manager behavior remains allowed. |
| `apps/server/src/mrp/rest/controllers/tests/link-product-accompaniment.controller.test.ts` | Confirm | Operator write is denied without state change; Manager behavior remains allowed. |
| `apps/server/src/mrp/rest/controllers/tests/register-product-brand.controller.test.ts` | Modify | Operator write is denied without state change; Manager behavior remains allowed. |
| `apps/server/src/mrp/rest/controllers/tests/register-product-size.controller.test.ts` | Confirm | Operator write is denied without state change; Manager behavior remains allowed. |
| `apps/server/src/mrp/rest/controllers/tests/register-product.controller.test.ts` | Confirm | Operator write is denied without state change; Manager behavior remains allowed. |
| `apps/server/src/mrp/rest/controllers/tests/register-production.controller.test.ts` | Modify | Operator write is denied without state change; Manager behavior remains allowed. |
| `apps/server/src/mrp/rest/controllers/tests/remove-accompaniment-type.controller.test.ts` | Confirm | Operator write is denied without state change; Manager behavior remains allowed. |
| `apps/server/src/mrp/rest/controllers/tests/remove-product-accompaniment.controller.test.ts` | Confirm | Operator write is denied without state change; Manager behavior remains allowed. |
| `apps/server/src/mrp/rest/controllers/tests/remove-product-brand.controller.test.ts` | Modify | Operator write is denied without state change; Manager behavior remains allowed. |
| `apps/server/src/mrp/rest/controllers/tests/remove-product-size.controller.test.ts` | Confirm | Operator write is denied without state change; Manager behavior remains allowed. |
| `apps/server/src/mrp/rest/controllers/tests/remove-product.controller.test.ts` | Confirm | Operator write is denied without state change; Manager behavior remains allowed. |
| `apps/server/src/mrp/rest/controllers/tests/remove-recipe-ingredient.controller.test.ts` | Modify | Operator write is denied without state change; Manager behavior remains allowed. |
| `apps/server/src/mrp/rest/controllers/tests/rename-accompaniment-type.controller.test.ts` | Confirm | Operator write is denied without state change; Manager behavior remains allowed. |
| `apps/server/src/mrp/rest/controllers/tests/save-brand-resale-configuration.controller.test.ts` | Confirm | Operator write is denied without state change; Manager behavior remains allowed. |
| `apps/server/src/mrp/rest/controllers/tests/save-recipe-yield.controller.test.ts` | Modify | Operator write is denied without state change; Manager behavior remains allowed. |
| `apps/server/src/mrp/rest/controllers/tests/save-single-resale-configuration.controller.test.ts` | Confirm | Operator write is denied without state change; Manager behavior remains allowed. |
| `apps/server/src/mrp/rest/controllers/tests/set-primary-product-brand.controller.test.ts` | Modify | Operator write is denied without state change; Manager behavior remains allowed. |
| `apps/server/src/mrp/rest/controllers/tests/update-product-accompaniment.controller.test.ts` | Confirm | Operator write is denied without state change; Manager behavior remains allowed. |
| `apps/server/src/mrp/rest/controllers/tests/update-product-brand.controller.test.ts` | Modify | Operator write is denied without state change; Manager behavior remains allowed. |
| `apps/server/src/mrp/rest/controllers/tests/update-product-settings.controller.test.ts` | Confirm | Operator write is denied without state change; Manager behavior remains allowed. |
| `apps/server/src/mrp/rest/controllers/tests/update-product-size.controller.test.ts` | Confirm | Operator write is denied without state change; Manager behavior remains allowed. |
| `apps/server/src/mrp/rest/controllers/tests/update-recipe-ingredient.controller.test.ts` | Modify | Operator write is denied without state change; Manager behavior remains allowed. |
| `apps/server/src/pdv/rest/controllers/tests/cancel-order.controller.test.ts` | Modify | Operator write is denied without state change; Manager behavior remains allowed. |
| `apps/server/src/pdv/rest/controllers/tests/create-combo.controller.test.ts` | Confirm | Operator write is denied without state change; Manager behavior remains allowed. |
| `apps/server/src/pdv/rest/controllers/tests/create-sales-channel.controller.test.ts` | Confirm | Operator write is denied without state change; Manager behavior remains allowed. |
| `apps/server/src/pdv/rest/controllers/tests/delete-combo.controller.test.ts` | Modify | Operator write is denied without state change; Manager behavior remains allowed. |
| `apps/server/src/pdv/rest/controllers/tests/delete-sales-channel.controller.test.ts` | Confirm | Operator write is denied without state change; Manager behavior remains allowed. |
| `apps/server/src/pdv/rest/controllers/tests/inactivate-combo.controller.test.ts` | Modify | Operator write is denied without state change; Manager behavior remains allowed. |
| `apps/server/src/pdv/rest/controllers/tests/inactivate-sales-channel.controller.test.ts` | Confirm | Operator write is denied without state change; Manager behavior remains allowed. |
| `apps/server/src/pdv/rest/controllers/tests/reactivate-combo.controller.test.ts` | Modify | Operator write is denied without state change; Manager behavior remains allowed. |
| `apps/server/src/pdv/rest/controllers/tests/reactivate-sales-channel.controller.test.ts` | Confirm | Operator write is denied without state change; Manager behavior remains allowed. |
| `apps/server/src/pdv/rest/controllers/tests/update-combo.controller.test.ts` | Modify | Operator write is denied without state change; Manager behavior remains allowed. |
| `apps/server/src/pdv/rest/controllers/tests/update-sales-channel.controller.test.ts` | Confirm | Operator write is denied without state change; Manager behavior remains allowed. |
| `apps/server/src/mrp/rest/controllers/tests/get-product-removal-impact.controller.test.ts` | Confirm | Operator is denied from Manager-only impact/production previews. |
| `apps/server/src/mrp/rest/controllers/tests/get-product-category-removal-impact.controller.test.ts` | Confirm | Operator is denied from Manager-only impact/production previews. |
| `apps/server/src/mrp/rest/controllers/tests/preview-product-unit-change.controller.test.ts` | Confirm | Operator is denied from Manager-only impact/production previews. |
| `apps/server/src/mrp/rest/controllers/tests/preview-production.controller.test.ts` | Modify | Operator is denied from Manager-only impact/production previews. |
| `apps/server/src/mrp/rest/controllers/tests/list-accompaniment-types.controller.test.ts` | Confirm | Operator is denied from Manager-only Accompaniment Types administration. |
| `apps/server/src/pdv/rest/controllers/tests/list-combo-products.controller.test.ts` | Modify | Operator is denied from the Manager-only Combo editor catalog endpoint. |

### apps/server — Composition

| Composition boundary | Kind/scope | Imports/dependencies | Provides/exports | Consumers | Lifecycle/order |
| --- | --- | --- | --- | --- | --- |
| `GlobalSearchProvisionModule` | Focused shared provision module | Identity, MRP and PDV database modules | Three `IDENTITY_PROVIDERS.globalSearch*` tokens/adapters | IdentityModule | Singleton read adapters; no job or event lifecycle |
| `IdentityModule` | Feature module | GlobalSearchProvisionModule | Controller and provider imports | Server application | Existing auth guards before controller-created use case |

| Path | Change | Declaration | Wiring/configuration | Lifecycle/order | Connected contracts | Generation/consumers |
| --- | --- | --- | --- | --- | --- | --- |
| `apps/server/src/identity/constants/identity-providers.ts` | Modify | `IDENTITY_PROVIDERS.globalSearchIdentity`, `.globalSearchMrp`, `.globalSearchPdv` | Stable runtime symbols for erased Core interfaces | Module bootstrap | Controller ↔ provider ports | Focused provision module |
| `apps/server/src/shared/provision/global-search/global-search-provision.module.ts` | Create | `GlobalSearchProvisionModule` | Import owning database modules, bind/export those three runtime tokens to the focused adapters | Singleton; no side effects | Provision adapters → Core ports | IdentityModule |
| `apps/server/src/identity/identity.module.ts` | Modify | Identity module registration | Import provider module and register controller; controller constructs the use case | Guarded HTTP lifecycle | REST → Core → providers | Server root already imports Identity |

### Repository architecture dependency rules

The global-search adapters are shared providers that intentionally compose the owning Identity, MRP and PDV database modules. Keep the repository's shared-to-feature dependency rule restrictive: permit only this named composition and its owning repository-token imports. Do not exempt the entire `shared/provision` tree or weaken feature-module boundaries.

| Path | Change | Declaration | Wiring/configuration | Lifecycle/order | Connected contracts | Generation/consumers |
| --- | --- | --- | --- | --- | --- | --- |
| `.dependency-cruiser.mjs` | Modify | Add source-specific `server-shared-global-search-*` boundary rules. | Exclude only the three global-search adapters and `global-search-provision.module.ts` from the generic `server-shared-boundary`. Add a separate focused rule for each source below; do not apply a combined constants allowlist across all adapters. | Static architecture validation only; no runtime effect. | Shared providers → owning database modules and repository tokens | `pnpm --filter server check:architecture` and root architecture check |

### Complexity baseline

The complexity correction extracts private helpers and presentation widgets from existing over-threshold functions. Preserve the repository's configured thresholds; regenerate and review the committed baseline only for the accepted findings introduced by this intentional refactor. Do not baseline unrelated user-owned changes.

| Path | Change | Declaration | Runtime guarantee | Validation |
| --- | --- | --- | --- | --- |
| `.code-multivitals-baseline.json` | Modify | Generated CodeMultiVitals exception baseline for accepted legacy/new warning-level findings after the refactor. | No runtime effect; error-level complexity violations remain reduced and the configured thresholds remain unchanged. | `pnpm update:complexity-baseline`, review baseline diff, then root and affected workspace complexity checks |

| Shared source file | Permitted feature imports |
| --- | --- |
| `apps/server/src/shared/provision/global-search/global-search-provision.module.ts` | `apps/server/src/identity/constants`; `apps/server/src/identity/database/identity-database.module.ts`; `apps/server/src/mrp/database/mrp-database.module.ts`; `apps/server/src/pdv/database/pdv-database.module.ts` |
| `apps/server/src/shared/provision/global-search/identity-global-search-provider.ts` | `apps/server/src/identity/constants` only |
| `apps/server/src/shared/provision/global-search/mrp-global-search-provider.ts` | `apps/server/src/mrp/constants` only |
| `apps/server/src/shared/provision/global-search/pdv-global-search-provider.ts` | `apps/server/src/pdv/constants` only |

### apps/web — UI

| Declaration | Role | Direct collaborator |
| --- | --- | --- |
| `GlobalSearch` | Feature component widget rendering input/panel/rows | Header and `useGlobalSearch` |
| `useGlobalSearch` | Input, focus, active option, debounce, navigation and state owner | `useGlobalSearchQuery`, router |
| `useGlobalSearchQuery` | Server query state/cache/cancellation | `IdentityService.searchGlobal` |
| `SalesChannelsPage` | Existing PDV page with name-filter entry | Route search schema |

| Path | Change | Declaration | Runtime guarantee |
| --- | --- | --- | --- |
| `apps/web/src/ui/identity/widgets/components/global-search/index.tsx` | Create | `GlobalSearch` widget: combobox input and live announcement, composed with mapped child panel/group widgets. | Owns input wiring, focus and listbox state; preserves the accessible name, query announcement and design. |
| `apps/web/src/ui/identity/widgets/components/global-search/search-results-panel/index.tsx`, `apps/web/src/ui/identity/widgets/components/global-search/search-result-state/index.tsx`, and `apps/web/src/ui/identity/widgets/components/global-search/search-result-groups/index.tsx` | Create | Private `SearchResultsPanel`, `SearchResultState`, and `SearchResultGroups` prop-rendering child widgets. | Preserve the listbox shell/count, loading/empty/error copy and retry control, grouped headings, result row names/icons/context, selected option semantics and keyboard navigation. Existing hooks retain state and callbacks. |
| `apps/web/src/ui/mrp/widgets/slots/product-accompaniments-slot/product-accompaniments-content/index.tsx`, `apps/web/src/ui/mrp/widgets/slots/product-accompaniments-slot/action-dialogs/index.tsx`, and `apps/web/src/ui/mrp/widgets/slots/product-accompaniments-slot/product-accompaniments-table/accompaniment-row/index.tsx` | Create | Private read-only/content, action-dialog composition and accompaniment-row child widgets. | Preserve Manager actions, Operator view-only/empty states and populated accompaniment facts; parent hooks retain action state and callbacks. |
| `apps/web/src/ui/mrp/widgets/slots/product-pricing-slot/action-dialogs/index.tsx`, `apps/web/src/ui/mrp/widgets/slots/product-pricing-slot/product-resale-settings-card/read-only-resale-list/index.tsx`, and `apps/web/src/ui/mrp/widgets/slots/product-pricing-slot/product-resale-settings-card/resale-settings-row/index.tsx` | Create | Private size-dialog, read-only resale-list and controlled resale-row child widgets. | Preserve pricing and availability values, role-dependent controls, validation messages and save callbacks; existing slot/card hooks remain state owners. |
| `apps/web/src/ui/mrp/widgets/slots/product-recipe-slot/action-dialogs/index.tsx`, `apps/web/src/ui/mrp/widgets/slots/product-recipe-slot/product-recipe-card/recipe-yield-editor/index.tsx`, `apps/web/src/ui/mrp/widgets/slots/product-recipe-slot/product-recipe-card/recipe-summary/index.tsx`, and `apps/web/src/ui/mrp/widgets/slots/product-recipe-slot/recipe-ingredients-table/recipe-ingredient-row/index.tsx` | Create | Private recipe-dialog, yield-editor, summary and ingredient-row child widgets. | Preserve recipe facts, Manager-only ingredient/production controls, yield validation and save behavior, and the Operator read-only surface; existing slot/card hooks retain state and callbacks. |
| `apps/web/src/ui/mrp/widgets/slots/product-settings-slot/read-only-settings-card/index.tsx` and `apps/web/src/ui/mrp/widgets/slots/product-stock-slot/product-brands-card/product-brand-row/index.tsx` | Create | Private read-only settings and product-brand row child widgets. | Preserve displayed product/brand facts, responsive layout and Manager-only brand actions; existing hooks retain role/state and callbacks. |
| `apps/web/src/ui/mrp/widgets/slots/product-pricing-slot/product-sizes-card/product-sizes-table/product-size-row/index.tsx` | Create | Private product-size row widget. | Preserve size/pricing fields, validation, keyboard interaction and Manager-only mutation controls; parent hook retains behavior. |
| `apps/web/src/ui/pdv/widgets/pages/combo-discount-page/read-only-combo-details/index.tsx` and `apps/web/src/ui/pdv/widgets/pages/combo-discount-page/edit-load-error/index.tsx` | Create | Private read-only details and edit-load-error child widgets. | Preserve authorized Combo details, Manager edit behavior, retry and error copy. |
| `apps/web/src/ui/pdv/widgets/pages/sales-channels-page/channel-search/index.tsx`, `apps/web/src/ui/pdv/widgets/pages/sales-channels-page/sales-channels-results/index.tsx`, `apps/web/src/ui/pdv/widgets/pages/sales-channels-page/action-dialogs/index.tsx`, `apps/web/src/ui/pdv/widgets/pages/sales-channels-page/sales-channels-list/sales-channels-desktop-table/index.tsx`, `apps/web/src/ui/pdv/widgets/pages/sales-channels-page/sales-channels-list/sales-channels-mobile-list/index.tsx`, and `apps/web/src/ui/pdv/widgets/pages/sales-channels-page/sales-channels-list/sales-channel-row-actions/index.tsx` | Create | Private filter, result-state, action-dialog, responsive-list and row-action child widgets. | Preserve URL-backed search, adjustment-filter composition, responsive channel facts, empty/error/loading states, and Manager-only create/edit/status/delete actions; existing hooks retain state and callbacks. |
| `apps/web/src/ui/identity/widgets/components/global-search/use-global-search.ts` | Create | `useGlobalSearch` hook. | Owns input/selection/open state, 250 ms debounce, keyboard/focus, query lifecycle and canonical navigation; ignores stale results. |
| `apps/web/src/ui/identity/widgets/components/global-search/tests/global-search.test.tsx` | Create | Widget tests. | Prove groups, all visual states, accessible labels, keyboard and retry. |
| `apps/web/src/ui/identity/widgets/components/global-search/tests/use-global-search.test.ts` | Create | Hook tests. | Prove debounce, clear/cancel, stale response isolation and typed navigation. |
| `apps/web/src/ui/identity/hooks/use-global-search-query.ts` | Create | TanStack query hook calling `IdentityService.searchGlobal`. | Enabled only for valid debounced query; key includes authenticated scope; retry is explicit after failure. Tested indirectly by widget tests. |
| `apps/web/src/ui/identity/hooks/identity-query-keys.ts` | Modify | Search key builder. | Cache cannot be reused across account/establishment change. |
| `apps/web/src/ui/shared/widgets/layouts/app-layout/header/index.tsx` | Modify | Compose `GlobalSearch` in the existing search slot. | Present on all authenticated routes with Header; no duplicate state owner. |
| `apps/web/src/ui/shared/widgets/layouts/app-layout/tests/app-layout.test.tsx` | Modify | Layout composition assertions. | Prove Header search exists for both roles and notifications/detail routes. |
| `apps/web/src/ui/pdv/widgets/pages/sales-channels-page/index.tsx` | Modify | Filter input and filtered result display. | URL `search` term is visible and matched channel is reachable. |
| `apps/web/src/ui/pdv/widgets/pages/sales-channels-page/use-sales-channels-page.ts` | Modify | Name-filter state derived from route search. | Existing adjustment filter composes with name filter; no hidden local-only filter. |
| `apps/web/src/ui/pdv/widgets/pages/sales-channels-page/tests/sales-channels-page.test.tsx` | Modify | Page behavior cases. | Search URL produces visible matched channel and clearable empty state. |
| `apps/web/src/ui/mrp/widgets/slots/product-stock-slot/index.tsx`, `apps/web/src/ui/mrp/widgets/slots/product-stock-slot/product-stock-dialogs/index.tsx`, `apps/web/src/ui/mrp/widgets/slots/product-stock-slot/product-stock-controls/index.tsx`, and `apps/web/src/ui/mrp/widgets/slots/product-stock-slot/product-brands-card/index.tsx` | Modify | Product stock, history and brands view policy. | Preserve stock facts and immutable transaction history for Operators; hide stock adjustment and brand management actions. |
| `apps/web/src/ui/mrp/widgets/slots/product-recipe-slot/index.tsx`, `apps/web/src/ui/mrp/widgets/slots/product-recipe-slot/product-recipe-card/index.tsx`, and `apps/web/src/ui/mrp/widgets/slots/product-recipe-slot/recipe-ingredients-table/index.tsx` | Modify | Product recipe view policy. | Preserve recipe facts; hide ingredient mutation and production actions for Operators. |
| `apps/web/src/ui/mrp/widgets/slots/product-accompaniments-slot/index.tsx`, `apps/web/src/ui/mrp/widgets/slots/product-accompaniments-slot/product-accompaniments-card/index.tsx`, and `apps/web/src/ui/mrp/widgets/slots/product-accompaniments-slot/product-accompaniments-table/index.tsx` | Modify | Product accompaniment view policy. | Preserve accompaniment facts; hide accompaniment management actions for Operators. |
| `apps/web/src/ui/mrp/widgets/slots/product-pricing-slot/index.tsx`, `apps/web/src/ui/mrp/widgets/slots/product-pricing-slot/product-sizes-card/index.tsx`, `apps/web/src/ui/mrp/widgets/slots/product-pricing-slot/product-sizes-card/product-sizes-table/index.tsx`, and `apps/web/src/ui/mrp/widgets/slots/product-pricing-slot/product-resale-settings-card/index.tsx` | Modify | Product pricing view policy. | Preserve pricing facts; hide price, size and resale configuration actions for Operators. |
| `apps/web/src/ui/mrp/widgets/slots/product-settings-slot/index.tsx` | Modify | Product settings view policy. | Preserve readable settings; hide settings mutation and destructive actions for Operators. |
| `apps/web/src/ui/pdv/widgets/pages/sales-channels-page/use-sales-channels-page.ts` and `sales-channels-list/index.tsx` | Modify | Sales-channel view policy. | Operator reads scoped channels; create/edit/status/delete controls are absent. |
| `apps/web/src/ui/pdv/widgets/pages/discounts-page/use-discounts-page.ts` and `combo-discount-page/use-combo-discount-page.ts` | Modify | Discount list and detail view policy. | Operator reads scoped Combo data; create/edit/status/delete controls are absent. |
| `apps/web/src/ui/pdv/widgets/pages/combo-discount-page/index.tsx` | Modify | Combo detail view policy. | Render authorized discount facts in a view-only surface for Operators; preserve Manager editing. |
| `apps/web/src/ui/mrp/widgets/slots/product-stock-slot/tests/product-stock-slot.test.tsx` | Modify | Product stock-related widget role test. | Prove Operators can read stock/history/brand UI while Manager controls remain available only to Managers. |
| `apps/web/src/ui/mrp/widgets/slots/product-recipe-slot/tests/product-recipe-slot.test.tsx` | Modify | Product recipe widget role test. | Prove Operators read recipe facts without ingredient/production controls; preserve Manager behavior. |
| `apps/web/src/ui/mrp/widgets/slots/product-accompaniments-slot/tests/product-accompaniments-slot.test.tsx` | Modify | Product accompaniment widget role test. | Prove Operators read accompaniment facts without management controls; preserve Manager behavior. |
| `apps/web/src/ui/mrp/widgets/slots/product-pricing-slot/tests/product-pricing-slot.test.tsx` | Modify | Product pricing widget role test. | Prove Operators read pricing facts without configuration controls; preserve Manager behavior. |
| `apps/web/src/ui/mrp/widgets/slots/product-settings-slot/tests/product-settings-slot.test.tsx` | Modify | Product settings widget role test. | Prove Operators read settings without mutation/destructive controls; preserve Manager behavior. |
| `apps/web/src/ui/mrp/widgets/slots/product-recipe-slot/product-recipe-card/tests/product-recipe-card.test.tsx` | Modify | Product recipe card role test. | With a populated recipe, prove Operators see recipe/yield facts without ingredient, yield, or production controls; Manager controls remain available. |
| `apps/web/src/ui/mrp/widgets/slots/product-stock-slot/product-brands-card/tests/product-brands-card.test.tsx` | Modify | Populated product brand card role test. | Prove Operators read brand stock details without brand add/edit/remove actions; Manager actions remain available. |
| `apps/web/src/ui/mrp/widgets/slots/product-pricing-slot/product-sizes-card/tests/product-sizes-card.test.tsx` and `apps/web/src/ui/mrp/widgets/slots/product-pricing-slot/product-sizes-card/product-sizes-table/tests/product-sizes-table.test.tsx` | Modify | Populated product-size role tests. | Prove Operators read size/pricing facts without size add/edit/remove controls; Manager controls remain available. |
| `apps/web/src/ui/mrp/widgets/slots/product-pricing-slot/product-resale-settings-card/tests/product-resale-settings-card.test.tsx` | Modify | Product resale settings role test. | Prove Operators read resale pricing facts without editable configuration controls; Manager controls remain available. |
| `apps/web/src/ui/mrp/widgets/slots/product-accompaniments-slot/product-accompaniments-table/tests/product-accompaniments-table.test.tsx` | Modify | Populated product accompaniment table role test. | Prove Operators see accompaniment rows without row edit/remove actions; Manager actions remain available. |
| `apps/web/src/ui/mrp/widgets/pages/products-page/tests/products-page.test.tsx` | Modify | Products page role test. | Prove the Operator list is readable and the product-registration empty-state CTA is absent while Manager actions remain available. |
| `apps/web/src/ui/pdv/widgets/pages/sales-channels-page/tests/sales-channels-page.test.tsx`, `apps/web/src/ui/pdv/widgets/pages/sales-channels-page/tests/use-sales-channels-page.test.ts`, and `apps/web/src/ui/pdv/widgets/pages/sales-channels-page/sales-channels-list/tests/sales-channels-list.test.tsx`; `apps/web/src/ui/pdv/widgets/pages/discounts-page/tests/discounts-page.test.tsx` and `apps/web/src/ui/pdv/widgets/pages/discounts-page/tests/use-discounts-page.test.ts`; `apps/web/src/ui/pdv/widgets/pages/combo-discount-page/tests/combo-discount-page.test.tsx` and `apps/web/src/ui/pdv/widgets/pages/combo-discount-page/tests/use-combo-discount-page.test.ts` | Modify | Operator Sales Channel and Discount widget role tests. | Prove scoped reads, matched filtering, view-only Combo detail and absence of management controls while Manager behavior remains available. |

Expected changed UI tree (each line is an affected path already mapped above):

```text
apps/web/src/ui/shared/widgets/layouts/app-layout/header/index.tsx
apps/web/src/ui/identity/widgets/components/global-search/index.tsx
apps/web/src/ui/identity/widgets/components/global-search/search-results-panel/index.tsx
apps/web/src/ui/identity/widgets/components/global-search/search-result-state/index.tsx
apps/web/src/ui/identity/widgets/components/global-search/search-result-groups/index.tsx
apps/web/src/ui/identity/widgets/components/global-search/use-global-search.ts
apps/web/src/ui/identity/widgets/components/global-search/tests/global-search.test.tsx
apps/web/src/ui/identity/widgets/components/global-search/tests/use-global-search.test.ts
apps/web/src/ui/identity/hooks/use-global-search-query.ts
apps/web/src/ui/identity/hooks/identity-query-keys.ts
apps/web/src/ui/pdv/widgets/pages/sales-channels-page/index.tsx
apps/web/src/ui/pdv/widgets/pages/sales-channels-page/use-sales-channels-page.ts
apps/web/src/ui/pdv/widgets/pages/sales-channels-page/tests/sales-channels-page.test.tsx
apps/web/src/ui/pdv/widgets/pages/sales-channels-page/sales-channels-list/index.tsx
apps/web/src/ui/pdv/widgets/pages/discounts-page/use-discounts-page.ts
apps/web/src/ui/pdv/widgets/pages/combo-discount-page/use-combo-discount-page.ts
apps/web/src/ui/mrp/widgets/slots/product-accompaniments-slot/product-accompaniments-content/index.tsx
apps/web/src/ui/mrp/widgets/slots/product-accompaniments-slot/action-dialogs/index.tsx
apps/web/src/ui/mrp/widgets/slots/product-accompaniments-slot/product-accompaniments-table/accompaniment-row/index.tsx
apps/web/src/ui/mrp/widgets/slots/product-pricing-slot/action-dialogs/index.tsx
apps/web/src/ui/mrp/widgets/slots/product-pricing-slot/product-resale-settings-card/read-only-resale-list/index.tsx
apps/web/src/ui/mrp/widgets/slots/product-pricing-slot/product-resale-settings-card/resale-settings-row/index.tsx
apps/web/src/ui/mrp/widgets/slots/product-recipe-slot/action-dialogs/index.tsx
apps/web/src/ui/mrp/widgets/slots/product-recipe-slot/product-recipe-card/recipe-yield-editor/index.tsx
apps/web/src/ui/mrp/widgets/slots/product-recipe-slot/product-recipe-card/recipe-summary/index.tsx
apps/web/src/ui/mrp/widgets/slots/product-recipe-slot/recipe-ingredients-table/recipe-ingredient-row/index.tsx
apps/web/src/ui/mrp/widgets/slots/product-settings-slot/read-only-settings-card/index.tsx
apps/web/src/ui/mrp/widgets/slots/product-stock-slot/product-brands-card/product-brand-row/index.tsx
apps/web/src/ui/mrp/widgets/slots/product-pricing-slot/product-sizes-card/product-sizes-table/product-size-row/index.tsx
apps/web/src/ui/pdv/widgets/pages/combo-discount-page/read-only-combo-details/index.tsx
apps/web/src/ui/pdv/widgets/pages/combo-discount-page/edit-load-error/index.tsx
apps/web/src/ui/pdv/widgets/pages/sales-channels-page/channel-search/index.tsx
apps/web/src/ui/pdv/widgets/pages/sales-channels-page/sales-channels-results/index.tsx
apps/web/src/ui/pdv/widgets/pages/sales-channels-page/action-dialogs/index.tsx
apps/web/src/ui/pdv/widgets/pages/sales-channels-page/sales-channels-list/sales-channels-desktop-table/index.tsx
apps/web/src/ui/pdv/widgets/pages/sales-channels-page/sales-channels-list/sales-channels-mobile-list/index.tsx
apps/web/src/ui/pdv/widgets/pages/sales-channels-page/sales-channels-list/sales-channel-row-actions/index.tsx
```

### apps/web — REST

| Path | Change | Declaration | Runtime guarantee |
| --- | --- | --- | --- |
| `apps/web/src/rest/services/identity-service.ts` | Modify | `IdentityService.searchGlobal(query)` implementation. | Calls only authenticated `GET /global-search`, URL-encodes query, maps existing REST errors. |

### apps/web — Composition

| Path | Change | Declaration | Wiring/configuration | Lifecycle/order | Connected contracts | Generation/consumers |
| --- | --- | --- | --- | --- | --- | --- |
| `apps/web/src/constants/routes.ts` | Modify | Typed page-key/record destination mapping, including sales-channel query route. | Maps known keys and typed IDs to existing routes | Navigation after selection | Core hit → canonical route | Web widgets |
| `apps/web/src/constants/sidebar-items.ts` | Modify | Profile visibility for Products, Sales Channels, Discounts and Manager-only destinations. | Operator sees New Sale, Orders, Products, Sales Channels and Discounts; management routes remain hidden | Authenticated render | Role policy → UI | AppLayout sidebar |
| `apps/web/src/routes/_authenticated/sales-channels/index.tsx` | Modify | Search schema and route access. | Accept `search` alongside `adjustment`; Manager and Operator may read | Route parse before page render | URL/profile → SalesChannelsPage | Route tree remains generated if route metadata changes |
| `apps/web/src/routes/_authenticated/products/index.tsx`, `products/$productId/route.tsx`, nested product routes and `products/new.tsx` | Modify | Profile-aware product list/detail access. | Operator can read list/details; registration and Manager-only mutations remain unavailable | Before page render | Identity/MRP role contract → route | Generated route tree from TanStack source |
| `apps/web/src/routes/_authenticated/discounts/index.tsx`, `discounts/$discountId.tsx`, and `discounts/new.tsx` | Modify | Profile-aware discount list/detail access. | Operator may read scoped discounts/details; creation and all management routes remain Manager-only | Before page render | Identity/PDV role contract → route | Generated route tree from TanStack source |
| `apps/web/src/routes/_authenticated/subscription/index.tsx` | Modify | Manager route guard. | Direct Operator navigation denied | Before page render | PRQ-13 role → route | Generated route tree from TanStack source |
| `apps/web/src/middlewares/require-dashboard-or-redirect-operator-middleware.ts` | Create | `requireDashboardOrRedirectOperatorMiddleware` | Resolve authenticated account; Manager proceeds, Operator redirects to `ROUTES.newSale`, anonymous follows login route convention | Before page render | Auth profile → Dashboard/New Sale | Dashboard route |
| `apps/web/src/routes/_authenticated/index.tsx` | Modify | Dashboard route `beforeLoad`. | Invoke the focused profile-aware middleware so normal Operator login and direct `/` navigation reach New Sale without rendering Dashboard | Before page render | PRQ-13 role → route | Generated route tree from TanStack source |
| `apps/web/tests/analytics/dashboard-page.test.ts` | Modify | Dashboard route role cases. | Exercise Manager-only route guard with account fixtures | Route navigation | PRQ-13 role → Dashboard | Validation Contract |
| `apps/web/tests/mrp/products-page.test.tsx`, `apps/web/tests/mrp/new-product-page.test.tsx`, `apps/web/tests/mrp/product-settings-page.test.ts`, `apps/web/tests/mrp/product-prices-page.test.ts`, `apps/web/tests/mrp/product-stock-page.test.ts`, `apps/web/tests/mrp/product-recipe-page.test.ts`, and `apps/web/tests/mrp/product-accompaniments-page.test.ts` | Modify | Products list/detail/creation role cases. | Exercise Operator read access and Manager-only action denial across product, stock, recipe, accompaniment and price pages; deny registration route | Route navigation | Identity/MRP role → Products | Validation Contract |
| `apps/web/tests/pdv/sales-channels-page.test.ts`, `apps/web/tests/pdv/discounts-page.test.tsx`, `apps/web/tests/pdv/discount-page.test.tsx`, and `apps/web/tests/pdv/new-discount-page.test.tsx` | Modify | PDV read-only list/detail and creation role cases. | Exercise Operator list/detail access and hidden management controls; deny discount creation route | Route navigation | Identity/PDV role → PDV pages | Validation Contract |
| `apps/web/tests/pdv/order-page.test.tsx` | Modify | Operator Order detail read-only case. | Prove Operator can read an authorized Order and cannot use the Manager-only Cancel action. | Route navigation | Identity/PDV role → Order detail | Validation Contract |
| `apps/web/tests/billing/subscription-page.test.tsx` | Create | Subscription route role cases. | Exercise Manager-only route guard with account fixtures | Route navigation | PRQ-13 role → Subscription | Validation Contract |
| `apps/web/tests/identity/account-page.test.ts` | Modify | Shared Header global-search state cases on an authenticated route. | Route/mock search response through the real Header widget; capture loading, no-results and error artifacts | Authenticated render | Header → query hook and state panel | Validation Contract |
| `apps/web/tests/pdv/sales-channels-page.test.ts` | Modify | Sales-channel route search cases. | Carry `search` and `adjustment` through URL validation | Route navigation | URL → page filter | Validation Contract |
| `apps/web/tests/mrp/new-product-page.test.tsx` | Modify | Product creation route role case. | Operator is denied from registration route. | Route navigation | Identity/MRP role → product registration | Validation Contract |
| `apps/web/tests/mrp/product-settings-page.test.ts` | Modify | Product detail route role case. | Operator can read settings; Manager-only actions remain unavailable. | Route navigation | Identity/MRP role → product details | Validation Contract |
| `apps/web/tests/mrp/product-prices-page.test.ts` | Modify | Product detail route role case. | Operator can read pricing; Manager-only actions remain unavailable. | Route navigation | Identity/MRP role → product details | Validation Contract |
| `apps/web/tests/mrp/product-stock-page.test.ts` | Modify | Product detail route role case. | Operator can read stock facts; stock management remains unavailable. | Route navigation | Identity/MRP role → product details | Validation Contract |
| `apps/web/tests/mrp/product-recipe-page.test.ts` | Modify | Product detail route role case. | Operator can read recipe facts; recipe management remains unavailable. | Route navigation | Identity/MRP role → product details | Validation Contract |
| `apps/web/tests/mrp/product-accompaniments-page.test.ts` | Modify | Product detail route role case. | Operator can read accompaniment facts; management remains unavailable. | Route navigation | Identity/MRP role → product details | Validation Contract |
| `apps/web/tests/pdv/discounts-page.test.tsx` | Modify | Discount list route role case. | Operator can read scoped Discounts with no management controls. | Route navigation | Identity/PDV role → Discounts | Validation Contract |
| `apps/web/tests/pdv/discount-page.test.tsx` | Modify | Discount detail route role case. | Operator can read Combo details with no management controls. | Route navigation | Identity/PDV role → discount details | Validation Contract |
| `apps/web/tests/pdv/new-discount-page.test.tsx` | Modify | Discount creation route role case. | Operator is denied from discount creation. | Route navigation | Identity/PDV role → discount creation | Validation Contract |

No manual edit to `apps/web/src/routeTree.gen.ts` is permitted. If route metadata changes its generated output, run `pnpm --filter web generate-routes` and include the derived diff as a generated artifact. No new route path is introduced.

## Technical decisions

| Decision | Chosen approach | Alternative considered | Reason | Accepted trade-off |
| --- | --- | --- | --- | --- |
| Aggregation | One authenticated Identity-owned endpoint using focused cross-module provider ports | Browser aggregation of module endpoints | Central server role/tenant policy and complete groups | More server composition wiring |
| Failure | Reject whole response on any invoked provider error | Return partial groups with warning | No incomplete result represented as complete | A healthy provider's hits are temporarily unavailable |
| Operator read access | Reuse module-owned GET/read use cases for Products, Sales Channels and Discounts; keep every mutation and Manager-only destination guarded | Grant blanket PDV/MRP access or introduce a second permission profile | Implements the fixed-profile PRD without granular permissions or cross-module policy | More role cases are required in controller, page and route tests |
| Sales-channel opening | Existing list with name filter | New detail route or edit dialog | Matches selected product behavior without new detail workflow | List filter must be URL addressable |
| Result limit | Five per type, stable ordering | Unlimited or first arbitrary page | Bounded dropdown and predictable keyboard path | A specific match may require a narrower query |
| Internal Web composition | Keep state, request and interaction ownership in the existing parent hooks; split JSX renderers into the exact private child widgets mapped in section 3 | Local JSX helpers or moving state into child renderers | `ui-layer-rules.md` requires one entry-point widget per nested component; this preserves established module and state ownership | More private render files, with behavior still tested at owning widget/page boundaries |
| Complexity baseline | Regenerate and review the existing CodeMultiVitals baseline for the intentional complexity refactor while preserving its configured thresholds | Leave newly extracted warning-level findings unaccepted or weaken the thresholds | Repository Tooling directs intentional refactors to regenerate and review the baseline; the change removes error-level functions while recording the new private helper/widget findings | Baseline records reviewed warning-level findings; future code still uses unchanged thresholds |

# 4. Validation Contract

## Testing strategy

| Test file | Test type | Target | Coverage goal |
| --- | --- | --- | --- |
| `packages/core/src/identity/use-cases/tests/search-global-use-case.test.ts` | Unit | SearchGlobalUseCase | Role, grouping, tenant inputs, cap, ordering and provider failure |
| `packages/core/src/mrp/use-cases/tests/list-stock-transactions-use-case.test.ts` | Unit | ListStockTransactionsUseCase | Operator history reads remain product/tenant-scoped; write privileges are not added |
| `apps/server/src/identity/rest/controllers/tests/search-global.controller.test.ts` | HTTP integration | SearchGlobalController | Authenticated Manager/Operator, real scoped providers, validation, serialization and tenant rejection |
| `apps/server/src/mrp/rest/controllers/tests/list-stock-transactions.controller.test.ts` | HTTP integration | Product stock history | Operator can read scoped history; foreign records remain unavailable |
| `apps/server/src/mrp/rest/controllers/tests/list-accompaniment-types.controller.test.ts` | HTTP integration | Manager-only MRP administration | Operator is denied from Accompaniment Types |
| `apps/web/src/ui/identity/widgets/components/global-search/tests/global-search.test.tsx` | Widget | GlobalSearch | Grouped rows and visible/a11y states |
| `apps/web/src/ui/identity/widgets/components/global-search/tests/use-global-search.test.ts` | Widget hook | useGlobalSearch | Debounce, keyboard, races, navigation |
| `apps/web/src/ui/shared/widgets/layouts/app-layout/tests/app-layout.test.tsx` | Layout widget | AppLayout | Shared Header and profile visibility |
| `apps/web/src/ui/pdv/widgets/pages/sales-channels-page/tests/sales-channels-page.test.tsx` | Page widget | SalesChannelsPage | URL name filter and adjustment coexistence |
| `apps/web/src/ui/mrp/widgets/pages/products-page/tests/products-page.test.tsx` | Page widget | ProductsPage | Operator read access, filters and no management controls |
| `apps/web/src/ui/pdv/widgets/pages/discounts-page/tests/discounts-page.test.tsx` | Page widget | DiscountsPage | Operator read access and no management controls |
| `apps/web/src/ui/pdv/widgets/pages/combo-discount-page/tests/combo-discount-page.test.tsx` | Page widget | ComboDiscountPage | Operator detail read access and no management controls |
| `apps/web/tests/analytics/dashboard-page.test.ts` | Route integration | Dashboard guard/default | Manager success and Operator redirect to New Sale |
| `apps/web/tests/mrp/products-page.test.tsx`, `apps/web/tests/mrp/new-product-page.test.tsx`, `apps/web/tests/mrp/product-settings-page.test.ts`, `apps/web/tests/mrp/product-prices-page.test.ts`, `apps/web/tests/mrp/product-stock-page.test.ts`, `apps/web/tests/mrp/product-recipe-page.test.ts`, and `apps/web/tests/mrp/product-accompaniments-page.test.ts` | Route/page integration | Operator read-only access | Product list and details render; management actions and product registration route remain unavailable |
| `apps/web/tests/pdv/sales-channels-page.test.ts`, `apps/web/tests/pdv/discounts-page.test.tsx`, `apps/web/tests/pdv/discount-page.test.tsx`, and `apps/web/tests/pdv/new-discount-page.test.tsx` | Route/page integration | Operator read-only access | Sales-channel and discount pages/details render; management actions and discount creation route remain unavailable |
| `apps/web/tests/pdv/order-page.test.tsx` | Route/page integration | Operator Order detail | Order detail remains readable; cancellation is unavailable |
| `apps/web/tests/billing/subscription-page.test.tsx` | Route integration | Subscription guard | Manager success and Operator denial |
| `apps/web/tests/identity/account-page.test.ts` | Route integration | Shared Header search states | Loading, no-results and error with mocked transport, including state artifacts |
| `apps/web/tests/pdv/sales-channels-page.test.ts` | Route integration | Sales-channel list URL | Name and adjustment query round-trip |

Revision 11's private prop-to-markup child widgets have no independent interaction or state. Their output, role differences, keyboard actions, responsive layout and visible states are exercised by the owning widget/page tests listed above; do not add isolated child-widget test boundaries.

| Test file | Test case | Description | Assertions |
| --- | --- | --- | --- |
| `search-global-use-case.test.ts` | Manager scope and grouping | Mixed records/tenants and page labels | Only allowed scoped groups, five max, stable order, no current-user unusable hit |
| `search-global-use-case.test.ts` | Operator scope | Mixed Manager-only and read-only fixtures | Five permitted page destinations and scoped product/order/channel/discount hits; no user results or unpermitted provider calls |
| `search-global-use-case.test.ts` | Match semantics | `#` sequence, numeric sequence, snapshot name | Exact numeric and case-insensitive text results; no current-product substitution |
| `search-global-use-case.test.ts` | Provider rejection | One adapter rejects | Entire use case rejects; no partial DTO |
| `search-global.controller.test.ts` | Query and auth | Blank, >100, unauthenticated and authorized requests | Repository-standard 422/401/403 response; correct grouped JSON only on success |
| `search-global.controller.test.ts` | Tenant and provider failure | Two establishments plus one provider rejection | Foreign records omitted and any provider failure rejects whole HTTP response |
| `global-search.test.tsx` | Panel states | Pending, success, none, failure and retry | Distinct visible content, live announcement, type/context/status and no partial results |
| `use-global-search.test.ts` | Interaction | Debounce, stale result, arrow/Enter/Escape/Tab | One latest request, selected route, focus return and natural Tab |
| `app-layout.test.tsx` | Header coverage | Both roles and representative protected routes | Search present; administrative links hidden for Operator |
| `sales-channels-page.test.tsx` | Addressed filter | Name and adjustment in URL | Matched row shown, both filters retained, clear state works |
| Server read, write and Manager-only preview controller test paths listed in Technical Contract section 3 | HTTP integration | Operator authorization matrix | Same-establishment GET reads succeed only for allowed data; all scoped mutations, foreign-tenant reads and Manager-only previews are denied; Manager behavior remains available |
| `apps/web/tests/analytics/dashboard-page.test.ts`, the Product and PDV route tests listed above, and `apps/web/tests/billing/subscription-page.test.tsx` | Direct route guards | Operator opens permitted read pages and restricted routes | Products, Sales Channels, Discounts and read details render; creation and other Manager-only routes deny Operator; Dashboard root redirects to New Sale |
| `account-page.test.ts` | Header states | Mock pending, empty and failed search transports | Correct visible/announced state; deterministic `gs-loading`, `gs-empty`, `gs-error` screenshots for design reference coverage |
| `sales-channels-page.test.ts` | Channel result destination | Search URL with matched name | Route search parsed and page displays matching channel |
| Product/Discount route and page tests | Operator read-only details | Operator opens a search result | Correct detail displays; management controls do not render |

| Acceptance | Automated boundary | Manual scenario | Evidence target |
| --- | --- | --- | --- |
| AC-01 | GlobalSearch hook/widget and AppLayout tests | MV-01 | `evaluation.md` successful query trace |
| AC-02 | Core and authenticated controller integration tests | MV-01 | `evaluation.md` Manager success and automated tenant matrix |
| AC-03 | Core and authenticated controller integration tests | MV-01 | `evaluation.md` Operator success and automated role matrix |
| AC-04 | GlobalSearch widget tests | MV-01 | `gs-desktop-results` |
| AC-05 | Hook, page, route guard and controller tests | MV-01 | `evaluation.md` successful URLs and automated access matrix |
| AC-06 | Core and hook tests | MV-01 | `evaluation.md` successful matching and automated race/limit cases |
| AC-07 | Core, controller, widget and account-route tests | — | Automated `gs-loading`, `gs-empty`, `gs-error` artifacts; no manual failure flow |
| AC-08 | Widget and hook tests | MV-01 | `gs-keyboard-focus`; focus trace |
| AC-09 | AppLayout/widget tests | MV-01 | `gs-desktop-header`, `gs-mobile-header`, `gs-mobile-results` |
| AC-10 | Authenticated controller integration and route guard tests | — | `evaluation.md` automated auth/tenant evidence |
| AC-11 | MRP/PDV read and mutation controller tests plus route/page tests | MV-01 | `evaluation.md` Operator read-only pages, rejected writes and fresh page screenshots |

Manual validation covers successful Manager/Operator search and navigation plus Operator read-only page access. Automated Core, authenticated Server HTTP, widget and browser route suites own invalid input, absent matches, loading/error/retry, stale responses, provider failure, mutation denial and tenant isolation. Mocked Web transport coverage does not stand in for the authenticated Server integration tests.

The integrated UI candidate requires one read-only [Visual Reviewer](../../../agents/visual-reviewer-agent.md) audit after current captures exist for all nine [manifest references](./design/manifest.md). Give the Reviewer each exact reference/state/viewport pair and its current transient capture, including automated loading, empty and error artifacts. The Reviewer reports visual discrepancies; the Orchestrator verifies findings and records official `EV-*` visual evidence in `evaluation.md`. This audit adds no manual `MV-*` scenario and does not replace the applicable Implementation Reviewer.

### MV-01 — Successful search smoke check

Confirm `docker compose ps`, `http://localhost:3336/health` and `http://localhost:4000`; seed Manager/Operator accounts explicitly if absent. With matching current-establishment records, use Playwright CLI on `/orders`:

1. At 1280 × 720, search as Manager, keyboard-select one record and open a sales channel; then search as Operator and open product, order, sales-channel and discount records plus Products, Orders and New Sale destinations. Check grouped labels/context, focus, HTTP 200 responses, final URLs and the channel's `search` filter.
2. As Operator, open Products and a product detail, read its stock history, Sales Channels, Discounts and a Combo detail. Confirm establishment data loads, no create/edit/status/delete/cancel controls appear, and the relevant direct write requests are rejected without changing data. Confirm Manager-only MRP administration, Billing and Identity routes remain inaccessible.
3. At 320 × 700, search as Manager and use arrow keys plus Enter to open a result. Check accessible name, focus, announcement, final URL and no horizontal overflow.

Save fresh `gs-desktop-header`, `gs-desktop-results`, `gs-keyboard-focus`, `gs-mobile-header`, `gs-mobile-results`, `operator-products-readonly`, `operator-sales-channels-readonly` and `operator-discounts-readonly` screenshots; compare search captures with their manifest frames and inspect page captures for preserved hierarchy and absent management controls. Record DOM, URL, network and console checks in `evaluation.md`. Stop task-started app processes and leave shared Docker services running.

| Command | Purpose/coverage |
| --- | --- |
| `pnpm check:test-integrity` | Verify allowed direct test boundaries. |
| `pnpm check:architecture` | Verify module/layer dependency direction. |
| `pnpm update:complexity-baseline` | Regenerate the accepted baseline after the intentional complexity refactor; review the generated diff and exclude unrelated user-owned changes. |
| `pnpm --filter @scoops/core test:coverage` | Core use-case behavior and coverage policy. |
| `pnpm --filter server test:coverage` | Server controller behavior and coverage policy. |
| `pnpm --filter web test:coverage` | Web widget/layout/page behavior and coverage policy. |
| `pnpm --filter web test:integration` | Committed Playwright route flows. |
| `pnpm --filter web generate-routes` | Regenerate route metadata if changed by route source; never edit generated file manually. |
| `pnpm --filter web test` | Route-rule test gate after generation, code and type checks. |
| `pnpm check:code` and `pnpm check:types` | Workspace code and type validation. |
| `pnpm --filter server build` and `pnpm --filter web build` | Production compile. |

Implementation records command outputs, screenshot paths and MV observations in `./evaluation.md`. REST-client parity check: `apps/server/rest-client/identity/global-search.rest` must exist, represent the sole `GET /global-search` operation exactly once and use the current `q` query contract. No direct tests of provision adapters, repositories, query hooks, REST service, or generated route tree: prove them through permitted use-case/controller/widget/route and real browser boundaries.

For changed route files, run `pnpm --filter web generate-routes`, `pnpm --filter web check:code`, `pnpm --filter web check:types`, then `pnpm --filter web test` in that order before focused route suites and Playwright CLI manual flows.

# 5. Documentation alignment and revision history

| Document | Authority for | State | Required change/confirmation |
| --- | --- | --- | --- |
| `documentation/prds/identity.md` | PRQ-04 fixed role access and PRQ-13 navigation/search | changed | Operators can read Products, Sales Channels and Discounts and receive their authorized search matches; affected PRQs remain unchecked until conclusion. |
| `documentation/prds/mrp.md` | PRQ-04 product list, PRQ-05 product details and PRQ-10 navigation | changed | Operators can browse the scoped product list and details read-only; MRP administration and production stay Manager-only; affected PRQs remain unchecked. |
| `documentation/prds/pdv.md` | PRQ-01 Sales Channels, PRQ-11 permissions/navigation and PRQ-13 Combo discounts | changed | Operators can read channel and Combo details; mutations remain Manager-only; affected PRQs remain unchecked. |
| `documentation/architecture.md` | Module dependency and applications | confirmed | Identity coordinates through ports; owning modules keep record queries. The shared provider exception is confined to one composition module and its owning repository-token imports in `.dependency-cruiser.mjs`. |
| `documentation/modules.md` | Identity/MRP/PDV fact ownership | confirmed | No cross-module repository import in Core. |
| `documentation/design.md` | Shared tokens, responsive and accessibility rules | confirmed | Pencil reference values map to existing tokens. |
| `documentation/tooling.md` | pnpm, tests, Playwright, local services and CodeMultiVitals | confirmed | Use documented commands and service lifecycle; regenerate and review the baseline only after an intentional refactor, without changing configured thresholds. |
| `documentation/sdd.md` | Review roles and official visual evidence ownership | changed | Visual Reviewer is a supplemental read-only audit; Orchestrator retains the verdict. |
| `documentation/agents/visual-reviewer-agent.md` | Visual audit scope and restrictions | changed | One audit covers all nine mapped references after current captures exist. |
| `documentation/prompts/create-plan-prompt.md` | Plan scheduling of Spec-required review | changed | A future Plan schedules the visual audit without expanding `MV-01`. |
| `documentation/prompts/implement-spec-prompt.md` | Implementation activation and correction loop | changed | Visual Reviewer runs when required by this Spec. |
| `design/onoreo.pen`; `design/manifest.md` | Saved design states and local screenshots | changed | Nine mapped frames, including loading, empty, error, focus and full 320 px Header. |

| Rule | Applies to | Evaluated revision |
| --- | --- | --- |
| `documentation/rules/code-conventions-rules.md` | TypeScript implementation and repository architecture checker configuration | 11 |
| `documentation/rules/core-package-rules.md` | Domain structures, interfaces and use case | 6 |
| `documentation/rules/use-case-testing-rules.md` | Core direct tests | 6 |
| `documentation/rules/validation-package-rules.md` | Shared query/search schemas | 6 |
| `documentation/rules/rest-layer-rules.md` | Controller, DTO shape and REST examples | 6 |
| `documentation/rules/controllers-testing-rules.md` | Controller tests | 6 |
| `documentation/rules/provision-layer-rules.md` | Cross-module provider composition | 6 |
| `documentation/rules/database-layer-rules.md` | Scoped repository reads | 6 |
| `documentation/rules/ui-layer-rules.md` | Widgets, hooks and design tokens | 11 |
| `documentation/rules/widget-testing-rules.md` | Widget and hook test paths | 11 |
| `documentation/rules/web-app-routing-rules.md` | Guards, search params and generated routes | 6 |

| Revision | Date | Material change | Reason |
| --- | --- | --- | --- |
| 1 | 2026-09-27 | Initial complete global-search contract and nine-frame design bundle | Issue #47, PRQ-13 and confirmed product/technical decisions |
| 2 | 2026-09-27 | Limit manual validation to successful search, navigation, keyboard and responsive flows; assign failure, empty, race and access cases to automated tests | User-directed validation scope reduction |
| 3 | 2026-09-27 | Consolidate manual validation into one concise successful smoke check | User requested a shorter manual validation contract |
| 4 | 2026-09-27 | Require one independent visual audit of the nine design-backed states without expanding manual validation | Visual Reviewer role added to the SDD workflow |
| 5 | 2026-09-27 | Add the exact dependency-checker path and a narrow boundary for the shared global-search providers | User confirmed that search adapters must be shared providers; the Spec's required composition otherwise failed the existing shared-to-feature architecture rule |
| 6 | 2026-09-28 | Expand Operators to read Products, Sales Channels and Discounts and include those records in global search while preserving Manager-only mutations | User confirmed the read-only role scope and approved search result coverage |
| 7 | 2026-09-28 | Map the exact Core authorization, Product detail child-widget, and role-test paths required to enforce revision 6 read-only access end to end | Implementation discovery found nested Core and Web guards beyond the initially mapped controller and route paths; the approved behavior is unchanged |
| 8 | 2026-09-28 | Add populated leaf-widget role tests for recipe, brand, size, resale and accompaniment controls | Review of the actual composed slot tests found mocked/empty child fixtures that did not assert those specific Operator control boundaries; product behavior is unchanged |
| 9 | 2026-09-28 | Separate the Operator-visible stock-history reader from Manager-only stock mutation dialogs | Route validation found that hiding the mutation composite also hid the explicitly required read-only stock history; the UI now preserves history while restricting writes |
| 10 | 2026-09-28 | Mark 27 existing Manager-only controller tests as confirmed instead of modified | The integrated path sensor showed those tests were unchanged from baseline; source inspection verified each already asserts Operator authorization failure, so their contract is confirmation evidence |
| 11 | 2026-09-29 | Map private presentational child widgets for the complexity correction without changing product behavior, route/API contracts, state ownership or the design bundle | Conclusion preflight found complexity-threshold regressions in feature-owned UI components. The existing UI Rule requires every nested JSX renderer to be its own widget. Revision 10's inline-renderer path description conflicted with that rule; revision 11 adds the exact composition paths and preserves parent hook ownership and parent-level tests. |
| 12 | 2026-09-29 | Add the generated complexity baseline to the exact technical path map for the intentional refactor | Baseline comparison confirmed that the refactor removes error-level findings while introducing warning-level findings for extracted helpers/widgets. Repository Tooling requires an explicit reviewed baseline refresh after an intentional refactor; thresholds and runtime behavior remain unchanged. |
