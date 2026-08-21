---
title: Global Products-page KPIs
status: in_progress
revision: 1
source:
  type: direct-request
  ref: codex-task
scope:
  - documentation/prds/mrp.md
  - documentation/features/mrp/products-page/changes/global-kpis
  - packages/core/src/mrp
  - apps/server/src/mrp
  - apps/web/tests/routes/mrp/products.index.test.ts
last_updated_at: 2026-08-20
---

# Global Products-page KPIs

## 1. Context and scope

### Objective and source

Keep the Products-page KPI cards stable while the manager searches, filters, sorts, or
paginates the product list. The direct request and supplied current-state screenshot clarify
that Products, Brands, and Low Stock are establishment-wide operational totals.

### Current behavior and product gap

`GET /products` currently calculates rows, pagination totals, and KPI totals from the same
filtered relation. Consequently, list filters incorrectly change the overview cards. The MRP
PRD previously required filter-aware KPIs; the user explicitly replaced that rule and the PRD
was amended before this Contract.

### Scope and product alignment

| Area | In scope | Out of scope |
| --- | --- | --- |
| Catalog query | Global tenant-scoped KPI aggregation with filtered rows and pagination | New endpoints, client-side aggregation, caching redesign |
| Products UI | Stable KPI values throughout list query changes | KPI labels, card layout, additional metrics |
| Validation | Core normalization, real repository/controller behavior, browser-visible stability | Product registration and product-detail workflows |

### Product decisions and assumptions

- “Global” means all products belonging to the authenticated manager's establishment.
- Search, categories, status, stock situation, sorting, and pagination continue to affect the
  list and its pagination metadata only.
- Products counts all establishment products, Brands counts all attached establishment-product
  brands, and Low Stock applies the existing ideal-stock comparison across the establishment.
- The existing `GET /products` response shape remains unchanged; the backend remains
  authoritative and no second browser request is introduced.

## 2. Implementation Contract

| ID | REQ/source coverage | Required behavior |
| --- | --- | --- |
| `RF-01` | MRP PRD REQ-04 KPI rule; direct request | `GET /products` returns establishment-wide Products, Brands, and Low Stock KPIs independently of list search, filters, sorting, and pagination. |
| `RF-02` | MRP PRD REQ-04 list behavior | Rows, `totalItems`, and `totalPages` continue to reflect the active list query without weakening tenant isolation or filter semantics. |
| `RF-03` | Direct request and supplied current-state screenshot | The Products page keeps the same KPI values while filtered rows update, including filtered-empty results. |

| ID | RF coverage | Requirement | Given | When | Then | Expected evidence |
| --- | --- | --- | --- | --- | --- | --- |
| `CA-01` | `RF-01`, `RF-02` | Global server aggregation | An establishment has products both inside and outside an active filter | The manager requests the filtered catalog | Rows and pagination describe the filtered set while all KPI values describe the complete establishment catalog | Repository-backed controller/integration assertion |
| `CA-02` | `RF-01` | Tenant isolation | Another establishment has products, brands, or low stock | The manager requests any catalog query | Foreign records contribute to neither rows nor KPIs | Existing tenant test plus focused aggregation assertion |
| `CA-03` | `RF-03` | Browser-visible KPI stability | The populated Products page shows global KPIs | Search or filters narrow the list | The list changes and the three KPI values remain unchanged | Focused Playwright route scenario and fresh screenshot |

## 3. Technical Contract

| Surface | Required delta |
| --- | --- |
| `apps/server/src/mrp/database/drizzle/repositories/drizzle-products-repository.ts` | Keep the establishment predicate in both query families, apply search/filter predicates only to rows and pagination, and compute KPI aggregation with the establishment predicate alone. |
| Server integration fixture/test owning `GET /products` | Prove filtered list metadata and global KPI totals in one response, including tenant exclusion. |
| `apps/web/tests/routes/mrp/products.index.test.ts` | Return different filtered rows with unchanged KPI totals and assert the cards remain stable after query-state changes. |

The Core `ProductCatalogPage`, repository interface, REST route, and web adapter signatures do
not change. This is one server-owned read-model correction, not a new client query.

## 4. Validation Contract

| Evidence | Command or scenario | Coverage |
| --- | --- | --- |
| Core/static | `pnpm --filter @scoops/core check:types` and focused list use-case test | Contract and normalization remain compatible |
| Server | Focused repository-backed `GET /products` test, server types, and Biome | `CA-01`, `CA-02` |
| Web | `pnpm --filter web check:types` and focused Products Playwright test | `CA-03` |
| Manual `MV-01` | At 1481px, note KPI values, apply a narrowing search/filter, verify changed rows/request and unchanged cards; inspect console and failed requests | `CA-03` |

Capture the fresh browser state through Playwright into `test-results/` or a CI artifact and
record the exact viewport, comparison result and artifact identifier in `evaluation.md`.

## 5. Documentation alignment and revision history

| Authority | Alignment |
| --- | --- |
| `documentation/prds/mrp.md` | REQ-04 now defines establishment-wide KPI totals. |
| `documentation/architecture.md` | Backend authority and tenant scoping remain unchanged. |
| `documentation/modules.md` | MRP continues to own catalog and stock summaries. |
| `documentation/rules/code-conventions-rules.md` | Applies to changed TypeScript. |
| `documentation/rules/core-package-rules.md` and `use-case-testing-rules.md` | Apply if Core list behavior/tests change. |
| `documentation/rules/database-layer-rules.md` | Applies to the Drizzle read-model correction. |
| `documentation/rules/rest-layer-rules.md` and `controllers-testing-rules.md` | Apply to repository-backed REST evidence. |
| `documentation/rules/ui-layer-rules.md` and `widget-testing-rules.md` | Apply to browser regression coverage. |
| `documentation/tooling.md` | Existing pnpm, Vitest, and Playwright CLI commands apply; no tooling change. |

| Revision | Date | Change |
| --- | --- | --- |
| `1` | `2026-08-20` | Created from the explicit global-KPI request after updating the contradictory MRP PRD rule. |
