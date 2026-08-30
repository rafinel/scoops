---
title: PDV order management — implementation plan
status: completed
spec: ./spec.md
spec_revision: 2
evaluation: ./evaluation.md
github_issue: https://github.com/rafinel/scoops/issues/24
updated_at: 2026-08-30
---

# Execution status

- **Spec:** [`./spec.md`](./spec.md), revision `2`, status `in_progress`.
- **Plan rationale:** Plan-backed execution is required because this delivery crosses Core, Validation, PDV/MRP persistence and transaction composition, a generated migration, three REST operations, protected responsive Web UI, concurrent cancellation risk and real server-backed visual/runtime validation.
- **Current phase:** F8 — Integrated validation complete; Plan is `completed` pending the normal `conclude-spec` delivery handoff.
- **Next action:** Route the ready Spec to `conclude-spec` for delivery publication and final PR CI.
- **Active blockers:** None. FND-005 was resolved by the shared serial Server fixture and Vitest worker-isolation fix. Unrelated governance edits remain inherited changes outside this feature and are not owned by a Builder.
- **Active risks:** Migration backfill/`pg_trgm` ordering, transaction-bound restoration under deletion and concurrency, SSR/local-calendar hydration, and the breadth of required responsive/visual/runtime evidence.
- **Active Builders:** All Builder phases are complete; Orchestrator owns the ready-to-conclude handoff.
- **Shared/generated ownership:** The Orchestrator owns this Plan and `evaluation.md`, the Drizzle migration plus journal/snapshot, generated `apps/web/src/routeTree.gen.ts`, root/package configuration or lockfile coordination if unexpectedly required, transient Playwright artifacts, integration, the path sensor, final sensors and the single Implementation Reviewer. The Server Builder owns the REST-client artifact during F5; Web consumes it as a read-only parity reference.

# Execution ledger

| Wave | Builder | Phase | Name | Depends on | Parallel with | Status | Exit condition |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | `Builder Core` | F1 | Core order lifecycle contracts and use cases | — | — | `completed` | Framework-free order snapshot, lifecycle, restoration, list, service and transaction contracts plus use cases and Core tests satisfy revision-2 RF/CA coverage. |
| 2 | `Builder Validation` | F2 | Shared order query, cancellation and URL schemas | F1 | F3 | `completed` | Root-exported schemas normalize the server query, cancellation reason and Web URL state without owning authorization or business rules. |
| 2 | `Builder Server` | F3 | PDV persistence and MRP restoration composition | F1 | F2 | `completed` | Models, mapper, repository, serializable database scope and transaction-bound restorer support immutable lifecycle persistence, skip/audit behavior and atomic stock restoration. |
| 3 | `Orchestrator` | F4 | Generate and review the order-management migration | F3 | — | `completed` | Migration SQL, journal and snapshot are generated, reviewed against the Spec’s ordered body, and ready to apply without resetting shared data. |
| 4 | `Builder Server` | F5 | Order REST operations and server integration evidence | F2, F3, F4 | F6 | `completed` | List, detail and cancellation controllers, DTOs, fixture-backed HTTP tests, registry wiring and complete `orders.rest` parity are ready. |
| 4 | `Builder Web` | F6 | Order history, detail and cancellation Web experience | F1, F2 | F5 | `completed` | Web adapter, protected routes, exact widget tree, mocked route suites and real-service scenario cover URL state, roles, responsive/accessibility states and recoverable mutation behavior; the final correction aligns item headers and values on shared grid tracks while preserving the desktop composition, no-channel omission, removed cancellation/restoration presentations and mobile summary-first layout. |
| 5 | `Orchestrator` | F7 | Synchronize generated routes and integrated path gate | F5, F6 | — | `completed` | The generated route tree is current and `pnpm check:spec-implementation -- <spec-path>` passes on the complete candidate before integrated sensors or review. |
| 6 | `Orchestrator` | F8 | Integrated validation, review and handoff | F7 | — | `completed` | All affected workspace sensors, database/runtime/manual/visual evidence and one read-only Implementation Reviewer are complete with no verified blocking finding. |

### F1 — Core order lifecycle contracts and use cases

#### F1-T1 — Publish snapshot, cancellation, restoration and list domain contracts

- **Status/owner:** `completed` — Builder Core
- **Depends/parallel:** No dependency. F1-T2 consumes these declarations; no path overlap with Validation or Server.
- **Paths:** `packages/core/src/pdv/domain/entities/order.ts`; `packages/core/src/pdv/domain/structures/{order-status,order-cancellation,order-stock-restoration,stock-restoration-target,stock-restoration-request}.ts`; `packages/core/src/pdv/domain/structures/order-list-params.ts`; `packages/core/src/mrp/domain/structures/stock-transaction-type.ts`; `packages/core/src/pdv/domain/entities/fakers/order-faker.ts`; `packages/core/src/pdv/domain/structures/index.ts`.
- **Contract:** `RF-01`, `RF-02`, `RF-03`, `RF-05`–`RF-09`; `CA-01`, `CA-02`, `CA-03`, `CA-06`–`CA-09`; Spec Technical Contract Core domain schemas and invariants.
- **Outcome:** Core represents immutable Operator snapshots, Registered/Canceled state, complete cancellation/restoration facts, tenant-scoped list parameters and `sale-cancellation` without framework, persistence or provider dependencies; fakers provide valid registered and canceled states.
- **Rules:** [`documentation/rules/code-conventions-rules.md`](../../rules/code-conventions-rules.md) (naming, declarations, barrels and known application failures); [`documentation/rules/core-package-rules.md`](../../rules/core-package-rules.md) (one exported type per file, domain faker conventions, business ownership and interfaces boundary); [`documentation/rules/use-case-testing-rules.md`](../../rules/use-case-testing-rules.md) (domain data and deterministic contracts where consumed).
- **Exit:** Run `pnpm --filter @scoops/core check:code` and `pnpm --filter @scoops/core check:types`; inspect public exports and entity/structure invariants against the revision-2 Contract, including optional brand snapshots, nullable channel semantics and cancellation completeness.

#### F1-T2 — Implement list, detail, cancellation and registration use cases

- **Status/owner:** `completed` — Builder Core
- **Depends/parallel:** Depends on F1-T1; sequential within Builder Core. F2 and F3 wait for the complete Core interfaces; no active path overlap with them.
- **Paths:** `packages/core/src/pdv/interfaces/orders-repository.ts`; `packages/core/src/pdv/interfaces/stock-restorer.ts`; `packages/core/src/pdv/interfaces/pdv-database.ts`; `packages/core/src/pdv/interfaces/pdv-service.ts`; `packages/core/src/pdv/interfaces/index.ts`; `packages/core/src/pdv/use-cases/list-orders-use-case.ts`; `packages/core/src/pdv/use-cases/get-order-use-case.ts`; `packages/core/src/pdv/use-cases/cancel-order-use-case.ts`; `packages/core/src/pdv/use-cases/register-order-use-case.ts`; `packages/core/src/pdv/use-cases/index.ts`; `packages/core/src/pdv/use-cases/tests/{list-orders-use-case,get-order-use-case,cancel-order-use-case,register-order-use-case}.test.ts`.
- **Contract:** `RF-01`–`RF-10`; `CA-01`–`CA-09`, `CA-11`, `CA-12`; Spec Technical Contract use-case, repository, restoration-port, transaction-scope and Web service declarations.
- **Outcome:** Use cases enforce Manager/Operator access, actor-owned tenancy, hidden cross-tenant not-found, bounded discovery, snapshot-only reads, deterministic time, one-way cancellation, consolidated restoration requests, atomic retry-safe transition and registration-time actor snapshot while preserving existing registration behavior.
- **Rules:** [`documentation/rules/code-conventions-rules.md`](../../rules/code-conventions-rules.md) (function/class ownership, declaration order and named failures); [`documentation/rules/core-package-rules.md`](../../rules/core-package-rules.md) (business rules in use cases and contracts in interfaces); [`documentation/rules/use-case-testing-rules.md`](../../rules/use-case-testing-rules.md) (one use-case test file, typed mocks, deterministic time, fakers and infrastructure-free tests); [`documentation/rules/rest-layer-rules.md`](../../rules/rest-layer-rules.md) (Core REST service contract).
- **Exit:** Run `pnpm --filter @scoops/core check:code`, `pnpm --filter @scoops/core check:types` and `pnpm --filter @scoops/core test:coverage`; verify role/tenant forwarding, exact filters, snapshot-only mapping, cancellation success/skip/rollback/conflict/race paths, fixed `DatetimeProvider` use and unchanged registration idempotency.

### F2 — Shared order query, cancellation and URL schemas

#### F2-T1 — Add and export the three order boundary schemas

- **Status/owner:** `completed` — Builder Validation
- **Depends/parallel:** Depends on F1-T1 for `OrderStatus`; runs in parallel with F3 after F1. Server and Web consumers wait for the root exports.
- **Paths:** `packages/validation/src/pdv/order-list-query-schema.ts`; `packages/validation/src/pdv/cancel-order-schema.ts`; `packages/validation/src/web/orders-search-schema.ts`; `packages/validation/src/index.ts`.
- **Contract:** `RF-02`, `RF-05`, `RF-07`, `RF-09`; `CA-02`, `CA-05`, `CA-08`, `CA-10`, `CA-11`; Spec Validation Contract query, reason and route-search schemas.
- **Outcome:** Shared Zod schemas trim and bound searches/reasons, derive lifecycle values from Core, normalize `none` to the server boundary, enforce paired ISO instants, and deterministically recover malformed or partial custom URL dates to the documented preset/page state without embedding authorization or persistence decisions.
- **Rules:** [`documentation/rules/validation-package-rules.md`](../../rules/validation-package-rules.md) (schema ownership, one schema per file, Core-derived enums, root exports and consumer boundaries); [`documentation/rules/code-conventions-rules.md`](../../rules/code-conventions-rules.md) (naming and explicit source-backed imports).
- **Exit:** Run `pnpm --filter @scoops/validation check:code`, `pnpm --filter @scoops/validation check:types` and inspect root exports, defaults, trim/length boundaries, date relationship behavior, canonical values and localized consumer error mapping targets.

### F3 — PDV persistence and MRP restoration composition

#### F3-T1 — Persist and hydrate the complete PDV lifecycle aggregate

- **Status/owner:** `completed` — Builder Server
- **Depends/parallel:** Depends on F1; runs in parallel with F2. F3-T2 is sequential within Builder Server; F5 waits for all F3 work.
- **Paths:** `apps/server/src/pdv/database/drizzle/models/order-model.ts`; `apps/server/src/pdv/database/drizzle/models/order-status-model.ts`; `apps/server/src/pdv/database/drizzle/models/order-stock-restoration-model.ts`; `apps/server/src/pdv/database/drizzle/models/order-stock-restoration-outcome-model.ts`; `apps/server/src/pdv/database/drizzle/models/order-line-model.ts`; `apps/server/src/pdv/database/drizzle/types/entities/order.ts`; `apps/server/src/pdv/database/drizzle/types/entities/order-stock-restoration.ts`; `apps/server/src/pdv/database/drizzle/mappers/drizzle-order-mapper.ts`; `apps/server/src/pdv/database/drizzle/repositories/drizzle-orders-repository.ts`; `apps/server/src/pdv/database/drizzle/models/index.ts`; `apps/server/src/pdv/database/drizzle/types/entities/index.ts`; `apps/server/src/pdv/database/drizzle/repositories/index.ts`.
- **Contract:** `RF-01`, `RF-02`, `RF-03`, `RF-06`, `RF-08`, `RF-09`; `CA-01`–`CA-03`, `CA-06`–`CA-09`; Spec Technical Contract PDV models, restoration table, constraints, indexes, mapper and repository operations.
- **Outcome:** Drizzle persistence stores the registration actor snapshot and lifecycle fields, owns ordered restoration facts, maps nullable/ordered rows losslessly, supports tenant/status/date/search/channel pagination and locked/conditional cancellation operations on the supplied executor.
- **Rules:** [`documentation/rules/database-layer-rules.md`](../../rules/database-layer-rules.md) (owning module, declarations, persistence types, mappers, repository vocabulary/tokens and no repository tests); [`documentation/rules/code-conventions-rules.md`](../../rules/code-conventions-rules.md) (aliases, naming and barrels); [`documentation/rules/core-package-rules.md`](../../rules/core-package-rules.md) (persistence-independent Core contracts).
- **Exit:** Run Server code/type/architecture checks relevant to the changed database layer; inspect model indexes/checks/FKs, tenant-qualified query predicates, exact search semantics, aggregate batching, position ordering, `registered`/`canceled` completeness and conditional conflict mapping without adding repository-specific test files. F5-T2 must later confirm these persistence semantics through real controller requests and subsequent persisted reads before F3 is accepted.

#### F3-T2 — Bind serializable cancellation restoration to the MRP transaction

- **Status/owner:** `completed` — Builder Server
- **Depends/parallel:** Depends on F3-T1 for persistence wiring; sequential within Builder Server. F4 consumes the final model/schema shape.
- **Paths:** `apps/server/src/pdv/database/drizzle/repositories/drizzle-pdv-database.ts`; `apps/server/src/mrp/provision/pdv/transaction-bound-order-registration-dependencies-factory.ts`; `apps/server/src/mrp/database/drizzle/models/stock-transaction-model.ts`; `apps/server/src/mrp/database/drizzle/mappers/drizzle-stock-transaction-mapper.ts`; `apps/server/src/mrp/provision/pdv/tests/transaction-bound-order-cancellation-dependencies.test.ts`.
- **Contract:** `RF-05`, `RF-06`, `RF-08`; `CA-06`, `CA-07`, `CA-09`; Spec Technical Contract `PdvDatabaseScope`, `StockRestorer`, current-target skip behavior, positive `sale-cancellation` movement and serializable retry/rollback.
- **Outcome:** The same transaction executor supplies `StockRestorer`, restores exact current product/brand balances, skips only missing targets, writes positive correlated movements and returns ordered audit facts; eligible failures abort all status, balance, movement and audit writes.
- **Rules:** [`documentation/rules/provision-layer-rules.md`](../../rules/provision-layer-rules.md) (Core contracts, registration, infrastructure-only adapter and typed provider mocks); [`documentation/rules/database-layer-rules.md`](../../rules/database-layer-rules.md) (module ownership, Drizzle mapping and transaction composition); [`documentation/rules/code-conventions-rules.md`](../../rules/code-conventions-rules.md) (aliases and known failures).
- **Exit:** Run the focused transaction-bound adapter tests plus Server code/types/architecture checks; assert surviving, missing-product, missing-brand and injected-failure outcomes, exact quantities/labels, one movement per restored target, shared timestamp/order/actor data and retry-safe serializable composition. F5-T2 must later confirm the transaction boundary through real HTTP cancellation responses and persisted balances, movements, audit facts and conflicts before F3 is accepted.

### F4 — Generate and review the order-management migration

#### F4-T1 — Generate the reviewed migration, journal and snapshot

- **Status/owner:** `completed` — Orchestrator
- **Depends/parallel:** Depends on F3-T1 and F3-T2; blocks F5 database-backed controller tests. No Builder runs against an unreconciled generated schema.
- **Paths:** `apps/server/src/shared/database/drizzle/migrations/0016_pdv-order-management.sql`; `apps/server/src/shared/database/drizzle/migrations/meta/_journal.json`; `apps/server/src/shared/database/drizzle/migrations/meta/0016_snapshot.json`.
- **Contract:** `RF-01`, `RF-02`, `RF-05`, `RF-06`, `RF-08`, `RF-09`; `CA-01`, `CA-02`, `CA-06`, `CA-07`, `CA-09`; Spec Technical Contract expected SQL body and migration delivery contract.
- **Outcome:** Drizzle-generated artifacts include `pg_trgm`, enums, nullable-to-backfilled actor/lifecycle columns, legacy fallback names, lifecycle checks, restoration storage/indexes, product-name search index and updated MRP correlation checks in the required order while preserving existing data.
- **Rules:** [`documentation/rules/database-layer-rules.md`](../../rules/database-layer-rules.md) (shared schema/migration ownership and reviewed declarations); [`documentation/tooling.md`](../../tooling.md) (migration generation/application commands and no reset/push substitution).
- **Exit:** Run `pnpm --filter server db:migration:generate -- --name pdv-order-management`; review all three generated files against the Spec’s complete SQL body, then run `pnpm --filter server db:migration:apply` against the prepared PostgreSQL service and record generation, review and apply evidence in `./evaluation.md`.

### F5 — Order REST operations and server integration evidence

#### F5-T1 — Expose list, detail and cancellation REST operations

- **Status/owner:** `completed` — Builder Server
- **Depends/parallel:** Depends on F2, F3 and F4; runs in parallel with F6. F5-T2 is sequential within Builder Server.
- **Paths:** `apps/server/src/pdv/rest/controllers/list-orders.controller.ts`; `apps/server/src/pdv/rest/controllers/get-order.controller.ts`; `apps/server/src/pdv/rest/controllers/cancel-order.controller.ts`; `apps/server/src/pdv/rest/dtos/order-response.dto.ts`; `apps/server/src/pdv/rest/dtos/order-page-response.dto.ts`; `apps/server/src/pdv/rest/dtos/index.ts`; `apps/server/src/pdv/rest/controllers/index.ts`; `apps/server/rest-client/pdv/orders.rest`.
- **Contract:** `RF-01`–`RF-05`, `RF-09`, `RF-10`; `CA-01`–`CA-05`, `CA-11`, `CA-12`; Spec REST Contract for `GET /orders`, `GET /orders/:orderId` and `PATCH /orders/:orderId/cancel`.
- **Outcome:** Thin authenticated controllers instantiate the correct Core use case, derive request body types, apply shared query/body/UUID boundaries, serialize complete ISO DTOs, document every expected response and register the three actions without exposing prohibited operations; the existing order route group examples are extended.
- **Rules:** [`documentation/rules/rest-layer-rules.md`](../../rules/rest-layer-rules.md) (group decorator, semantic route parameters, one controller per action, request types, Swagger responses, service contract and REST-client parity); [`documentation/rules/code-conventions-rules.md`](../../rules/code-conventions-rules.md) (aliases and declaration order); [`documentation/rules/validation-package-rules.md`](../../rules/validation-package-rules.md) (shared boundary parsing).
- **Exit:** Run focused controller compilation checks and compare `apps/server/rest-client/pdv/orders.rest` with every current order-group operation: one clearly labeled request for each list/detail/cancel route plus existing catalog/preview/register routes, exact methods/paths/parameters/headers/bodies, reusable local variables, no credentials, and expected status/body shapes. Before accepting the route task, consume the real Nest/Supertest request/response, persistence and authorization results from F5-T2; compilation and artifact parity alone are insufficient. Record parity in `./evaluation.md`; this artifact check is separate from real HTTP evidence.

#### F5-T2 — Build real module fixtures and controller coverage

- **Status/owner:** `completed` — Builder Server
- **Depends/parallel:** Depends on F5-T1; no active path overlap with F6 because all paths remain under Server ownership.
- **Paths:** `apps/server/src/pdv/fixtures/pdv-module-fixture.ts`; `apps/server/src/pdv/rest/controllers/tests/list-orders.controller.test.ts`; `apps/server/src/pdv/rest/controllers/tests/get-order.controller.test.ts`; `apps/server/src/pdv/rest/controllers/tests/cancel-order.controller.test.ts`; `apps/server/src/pdv/rest/controllers/tests/register-order.controller.test.ts`.
- **Contract:** `RF-01`–`RF-09`; `CA-01`–`CA-11`; Spec Validation Contract controller integration suites and fixture seams.
- **Outcome:** Real Nest/Supertest/PostgreSQL tests cover actor propagation, query combinations, DTO dates, snapshot hydration, role/tenant boundaries, deleted-target skips, atomic rollback, concurrent conflict and registration snapshot regression without replacing Core/use cases/repositories with loose mocks.
- **Rules:** [`documentation/rules/controllers-testing-rules.md`](../../rules/controllers-testing-rules.md) (HTTP integration, real wiring, `DatabaseFixture`/module fixture, isolation and persistence assertions); [`documentation/rules/database-layer-rules.md`](../../rules/database-layer-rules.md) (fixture ownership and no direct repository-test subject); [`documentation/rules/rest-layer-rules.md`](../../rules/rest-layer-rules.md) (HTTP/error contract); [`documentation/rules/code-conventions-rules.md`](../../rules/code-conventions-rules.md) (test naming and aliases).
- **Exit:** Run the focused Server controller suites with the reviewed migration and Docker-backed fixture; assert real request/response status/body plus persisted reads/balances/movements/restoration facts for success and failure paths, Manager/Operator and foreign-tenant indistinguishability, reason bounds, no duplicate restoration and existing registration behavior. Include the `.rest` parity result from F5-T1 in `./evaluation.md` before marking F5 complete.

### F6 — Order history, detail and cancellation Web experience

#### F6-T1 — Implement the Web REST adapter, protected routes and behavior hooks

- **Status/owner:** `completed` — Builder Web
- **Depends/parallel:** Depends on F1 and F2; runs in parallel with F5. F6-T2 and F6-T3 consume these route/service contracts. The Server-owned `.rest` artifact is a read-only parity reference.
- **Paths:** `apps/web/src/rest/services/pdv-service.ts`; `apps/web/src/constants/routes.ts`; `apps/web/src/routes/_authenticated/orders/index.tsx`; `apps/web/src/routes/_authenticated/orders/$orderId.tsx`; `apps/web/src/ui/pdv/hooks/order-query-keys.ts`; `apps/web/src/ui/pdv/hooks/use-orders-query.ts`; `apps/web/src/ui/pdv/hooks/use-order-query.ts`; `apps/web/src/ui/pdv/hooks/use-cancel-order-action.ts`.
- **Contract:** `RF-02`–`RF-05`, `RF-07`, `RF-09`; `CA-02`–`CA-05`, `CA-08`, `CA-10`, `CA-11`; Spec Web adapter, route, URL-readiness and query/action hook contracts.
- **Outcome:** The Web adapter maps list/detail/cancel to the Core service contract and recursively maps ISO dates; protected thin routes use canonical paths, shared auth middleware and `ordersSearchSchema`; domain hooks preserve bounded SSR/hydration readiness, semantic loading/error/refetch state, tenant-safe keys and post-cancel invalidation.
- **Rules:** [`documentation/rules/ui-layer-rules.md`](../../rules/ui-layer-rules.md) (feature boundaries, stateful widget hooks, shared wrappers, action/query semantics, status constants, route constants, REST factories, focus, design system and relevant **Antipatterns to Avoid**); [`documentation/rules/web-app-routing-rules.md`](../../rules/web-app-routing-rules.md) (canonical/dynamic paths, thin protected routes, search validation, generated tree and route coverage); [`documentation/rules/rest-layer-rules.md`](../../rules/rest-layer-rules.md) (service contract/factory and transport boundary); [`documentation/rules/validation-package-rules.md`](../../rules/validation-package-rules.md) (shared route/form schemas); [`documentation/rules/code-conventions-rules.md`](../../rules/code-conventions-rules.md) (function and handler conventions).
- **Exit:** Run the route-generation prerequisite when route files are ready, then verify adapter method/path/query/body mapping against the Server-owned `orders.rest` artifact and the Core service contract; the real-service browser scenario in F6-T3 must later confirm the mapped requests and persisted response before this server-backed adapter task is accepted. Route/widget exits must also compare the exact manifest widget tree, cover SSR/client readiness and error recovery, use canonical navigation, inspect console/failed requests, and preserve keyboard/narrow-viewport validation targets for F6-T2/F6-T3.

#### F6-T2 — Build the order history page, filters, list states and mocked route coverage

- **Status/owner:** `completed` — Builder Web
- **Depends/parallel:** Depends on F6-T1; sequential within Builder Web. F6-T3 may proceed only on disjoint detail/MRP paths after the shared Web contracts are stable.
- **Paths:** `apps/web/src/ui/pdv/widgets/pages/orders-page/index.tsx`; `apps/web/src/ui/pdv/widgets/pages/orders-page/use-orders-page.ts`; `apps/web/src/ui/pdv/widgets/pages/orders-page/orders-filters/{index.tsx,use-orders-filters.ts}`; `apps/web/src/ui/pdv/widgets/pages/orders-page/orders-list/{index.tsx,use-orders-list.ts}`; `apps/web/src/ui/pdv/widgets/pages/orders-page/{orders-loading,orders-empty-state,orders-filtered-empty-state,orders-error}/index.tsx`; `apps/web/src/ui/pdv/widgets/pages/orders-page/tests/{orders-page.test.tsx,use-orders-page.test.ts}`; `apps/web/src/ui/pdv/widgets/pages/orders-page/orders-filters/tests/{orders-filters.test.tsx,use-orders-filters.test.ts}`; `apps/web/src/ui/pdv/widgets/pages/orders-page/orders-list/tests/{orders-list.test.tsx,use-orders-list.test.ts}`; `apps/web/tests/fixtures/pdv-module-fixture.ts`; `apps/web/tests/routes/pdv/orders.index.test.tsx`.
- **Contract:** `RF-02`, `RF-07`, `RF-09`, `RF-10`; `CA-02`, `CA-08`, `CA-10`, `CA-12`; manifest references `UltbT`, `Uhw53`, `pSlGt` and supplemental populated/loading/error list states.
- **Outcome:** `/orders` renders the exact history hierarchy with URL-backed search/period/channel/no-channel/status/page behavior, Operator column, distinct loading/initial-empty/filtered-empty/error/success states, accessible pagination and new-sale/clear/retry actions while preserving the narrow viewport hierarchy and hydration contract.
- **Rules:** [`documentation/rules/ui-layer-rules.md`](../../rules/ui-layer-rules.md) (stateful/nested widget ownership, pt-BR labels, shadcn/wrappers, shared formatters, focus treatment, responsive design and relevant **Antipatterns to Avoid**); [`documentation/rules/web-app-routing-rules.md`](../../rules/web-app-routing-rules.md) (search synchronization, route failure boundaries, route integration matrix and shared Playwright fixture); [`documentation/rules/widget-testing-rules.md`](../../rules/widget-testing-rules.md) (owning-boundary component/hook tests, state/action matrix, accessible queries and no query-hook tests); [`documentation/rules/code-conventions-rules.md`](../../rules/code-conventions-rules.md) (hook declaration/order conventions).
- **Exit:** Run the page/widget Vitest suites and mocked `orders.index` Playwright route suite with stateful transport; assert exact URL/query/response/visible-state transitions, page reset/exhaustion, role/status action matrix, keyboard path, 390×844 overflow/focus, console and failed-request inspection, and fresh Playwright screenshots for `UltbT`, `Uhw53`, `pSlGt`, populated/loading/error states at each affected viewport compared with the manifest widget tree. MV-01 in F6-T3 must later confirm the list request and response against the real authenticated server flow before the server-backed page task is accepted.

#### F6-T3 — Build snapshot details, cancellation dialog, MRP labels and browser scenarios

- **Status/owner:** `completed` — Builder Web
- **Depends/parallel:** Depends on F6-T1; can run in parallel with F6-T2 only for disjoint detail/MRP paths, but the final route suite consumes the complete page contract.
- **Paths:** `apps/web/src/ui/pdv/widgets/pages/order-details-page/index.tsx`; `apps/web/src/ui/pdv/widgets/pages/order-details-page/use-order-details-page.ts`; `apps/web/src/ui/pdv/widgets/pages/order-details-page/order-items/index.tsx`; `apps/web/src/ui/pdv/widgets/pages/order-details-page/order-summary/index.tsx`; `apps/web/src/ui/pdv/widgets/pages/order-details-page/order-details-loading/index.tsx`; `apps/web/src/ui/pdv/widgets/pages/order-details-page/order-details-error/index.tsx`; `apps/web/src/ui/pdv/widgets/pages/order-details-page/cancel-order-dialog/{index.tsx,use-cancel-order-dialog.ts}`; `apps/web/src/ui/pdv/widgets/pages/order-details-page/tests/{order-details-page.test.tsx,use-order-details-page.test.ts}`; `apps/web/src/ui/pdv/widgets/pages/order-details-page/cancel-order-dialog/tests/{cancel-order-dialog.test.tsx,use-cancel-order-dialog.test.ts}`; `apps/web/src/ui/mrp/widgets/slots/product-stock-slot/stock-transaction-history-card/{index.tsx,use-stock-transaction-history-card.ts,stock-transaction-history-card.test.tsx,use-stock-transaction-history-card.test.ts}`; `apps/web/tests/routes/pdv/orders.$orderId.test.tsx`; `apps/web/tests/integration/pdv/order-management.real.integration.test.ts`.
- **Contract:** `RF-03`–`RF-10`; `CA-03`–`CA-07`, `CA-09`–`CA-12`; manifest references `I2Kra`, `c52HsC`, `dPHci` and supplemental narrow/loading/error/skipped-restoration states.
- **Outcome:** Both roles read complete immutable snapshot details at `/orders/<id>`; only Managers can cancel Registered orders; the dialog validates/trims reason, traps/returns focus and exposes pending/failure/retry/success states; canceled details distinguish restored/skipped targets; MRP history renders positive `sale-cancellation` semantics without unsafe casts; mocked and real-service browser scenarios cover the complete route contract.
- **Rules:** [`documentation/rules/ui-layer-rules.md`](../../rules/ui-layer-rules.md) (nested widget boundaries, form/RHF/Zod ownership, pt-BR labels, shared wrappers/icons, HTTP constants, focus, two-column dialog header, design system and relevant **Antipatterns to Avoid**); [`documentation/rules/web-app-routing-rules.md`](../../rules/web-app-routing-rules.md) (dynamic canonical navigation, protected route behavior, mocked route matrix and mutation recovery); [`documentation/rules/widget-testing-rules.md`](../../rules/widget-testing-rules.md) (owning hook mocks, public behavior, role/status/pending/error matrix and accessible assertions); [`documentation/rules/validation-package-rules.md`](../../rules/validation-package-rules.md) (shared cancellation schema); [`documentation/rules/code-conventions-rules.md`](../../rules/code-conventions-rules.md) (handlers and hook declarations).
- **Exit:** Run detail/widget Vitest suites and the focused mocked route suite; then run the real-service Playwright scenario without transport mocks. Verify exact GET/PATCH method/path/query/body/response and visible outcomes, persisted status/balance/movement/audit results, Manager/Operator and unknown/cross-tenant states, 501-character blocking, pending duplicate guard, focus/keyboard/narrow viewports, console/failed-request inspection, and fresh screenshots independently for `I2Kra`, `c52HsC`, `dPHci`, registered/canceled narrow details, dialog, loading/error details and skipped-restoration detail.

### F7 — Synchronize generated routes and integrated path gate

#### F7-T1 — Generate route metadata and run the complete Spec path sensor

- **Status/owner:** `completed` — Orchestrator
- **Depends/parallel:** Depends on F5 and F6; runs only after all Builder diffs and Orchestrator-owned migration artifacts are integrated.
- **Paths:** `apps/web/src/routeTree.gen.ts`.
- **Contract:** `RF-02`, `RF-03`, `RF-04`, `RF-07`; `CA-02`, `CA-03`, `CA-04`, `CA-08`, `CA-10`; Spec route-generation and affected-path Contract.
- **Outcome:** TanStack route metadata reflects the protected list and dynamic detail routes, and the complete candidate’s Create/Modify/Generate path map is structurally reconciled before semantic validation or review.
- **Rules:** [`documentation/rules/web-app-routing-rules.md`](../../rules/web-app-routing-rules.md) (generated tree is read-only and route generation is mandatory); [`documentation/tooling.md`](../../tooling.md) (route-generation and Spec path-check commands).
- **Exit:** Run `pnpm --filter web generate-routes`, review the generated diff, then run `pnpm check:spec-implementation -- documentation/features/pdv/pdv-order-management/spec.md`; record the exact result in `./evaluation.md`. If any contracted path is missing or stale, keep F7 in progress, invalidate dependent evidence and resume the responsible Builder before continuing.

### F8 — Integrated validation, review and handoff

#### F8-T1 — Run integrated sensors, real scenarios and the single Implementation Reviewer

- **Status/owner:** `completed` — Orchestrator
- **Depends/parallel:** Depends on F7-T1 passing. Integrated workspace sensors and the one read-only Implementation Reviewer run after the path gate; any correction invalidates affected evidence and reopens the responsible Builder and the same Reviewer.
- **Paths:** Complete revision-2 candidate across the Spec scope; `./evaluation.md`; transient Playwright `test-results/` artifacts.
- **Contract:** All `RF-01`–`RF-10`, `CA-01`–`CA-12` and `MV-01`–`MV-04`; Spec Validation Contract and Design Contract.
- **Outcome:** The Orchestrator records current Core/Validation/Server/Web quality, migration, REST parity, mocked browser, real authenticated persistence, responsive/accessibility, visual and review evidence, verifies findings and reaches a handoff-ready candidate without lowering coverage floors.
- **Rules:** [`documentation/sdd.md`](../../sdd.md) (integrated path gate, evidence freshness, Reviewer sequencing, correction routing and conclusion handoff); [`documentation/rules/code-conventions-rules.md`](../../rules/code-conventions-rules.md); [`documentation/rules/core-package-rules.md`](../../rules/core-package-rules.md); [`documentation/rules/use-case-testing-rules.md`](../../rules/use-case-testing-rules.md); [`documentation/rules/validation-package-rules.md`](../../rules/validation-package-rules.md); [`documentation/rules/rest-layer-rules.md`](../../rules/rest-layer-rules.md); [`documentation/rules/controllers-testing-rules.md`](../../rules/controllers-testing-rules.md); [`documentation/rules/database-layer-rules.md`](../../rules/database-layer-rules.md); [`documentation/rules/provision-layer-rules.md`](../../rules/provision-layer-rules.md); [`documentation/rules/ui-layer-rules.md`](../../rules/ui-layer-rules.md) (including **Antipatterns to Avoid**); [`documentation/rules/web-app-routing-rules.md`](../../rules/web-app-routing-rules.md); [`documentation/rules/widget-testing-rules.md`](../../rules/widget-testing-rules.md).
- **Exit:** Run the scheduled coverage/build/architecture/type/code commands, `pnpm test:coverage`, focused mocked and real Playwright commands, inspect Docker health and seeded-account prerequisites before runtime, stop only processes started for validation, complete MV-01–MV-04 and every visual comparison, verify `orders.rest` route completeness, activate exactly one read-only [`Implementation Reviewer`](../../agents/implementation-reviewer-agent.md) after the path sensor, resolve every verified finding, and route directly to `conclude-spec` only when the final handoff condition below is true.

# Validation and handoff

The Orchestrator creates `./evaluation.md` at implementation kickoff. The rows below schedule
evidence without duplicating the scenario steps in the authoritative Spec.

| Type | Scenario/surface | Criteria | Reference | Evidence target | Status |
| --- | --- | --- | --- | --- | --- |
| Automated | Complete affected-path map | All Spec `Create`, `Modify` and `Generate` paths | Spec Technical Contract | `./evaluation.md` — `pnpm check:spec-implementation -- documentation/features/pdv/pdv-order-management/spec.md` after F7 integration | `pending` |
| Automated | Core contracts and use cases | `CA-01`–`CA-09`, `CA-11` | Spec Core Technical/Validation Contracts | `./evaluation.md` — Core code, architecture, types and coverage commands | `pending` |
| Automated | Shared Validation schemas | `CA-02`, `CA-05`, `CA-08`, `CA-10`, `CA-11` | Spec Validation Contract | `./evaluation.md` — Validation code, architecture and types commands plus consumer assertions | `pending` |
| Automated | Server persistence, restoration and controllers | `CA-01`–`CA-07`, `CA-09`, `CA-11` | Spec Server/Database/Provision Contracts | `./evaluation.md` — Server focused integration tests, code, architecture, types, coverage and build | `pending` |
| Automated | Web widgets, hooks and MRP movement history | `CA-02`–`CA-05`, `CA-08`, `CA-10`–`CA-12` | Spec Web widget tree and UI Contract | `./evaluation.md` — Web Vitest, code, architecture, types, coverage and build | `pending` |
| REST client | `orders` route group | `CA-01`–`CA-05`, `CA-12` | `apps/server/rest-client/pdv/orders.rest` | Exact artifact path; record comparison with all current controller routes/shared request schemas, one labeled list/detail/cancel request and preserved catalog/preview/register examples, reusable variables and no credentials | `pending` |
| Runtime | Real authenticated history discovery | `CA-02`, `CA-08`, `CA-10` | `MV-01` and real-runtime setup in Spec | `./evaluation.md` — `pnpm --filter web exec playwright test tests/integration/pdv/order-management.real.integration.test.ts --workers=1`, URL/query/response, persistence and console/network evidence | `pending` |
| Runtime | Real snapshot detail and role boundary | `CA-01`, `CA-03`, `CA-04`, `CA-10`, `CA-12` | `MV-02` | `./evaluation.md` — Manager/Operator authenticated browser evidence, direct foreign/unknown ID result, REST response and fresh screenshots | `pending` |
| Runtime | Real cancellation, skip and duplicate | `CA-05`–`CA-07`, `CA-09`–`CA-11` | `MV-03` | `./evaluation.md` — PATCH response, balance/movement/audit reads, duplicate conflict, focus/pending/error evidence and fresh screenshots | `pending` |
| Manual | `MV-01` — History discovery and states | `CA-02`, `CA-08`, `CA-10` | Spec `MV-01` | `./evaluation.md` — desktop/narrow URL, filters, pagination, retry/clear and state evidence | `pending` |
| Manual | `MV-02` — Snapshot details and role boundary | `CA-01`, `CA-03`, `CA-04`, `CA-10`, `CA-12` | Spec `MV-02` | `./evaluation.md` — snapshot, role, not-found, navigation, network and console evidence | `pending` |
| Manual | `MV-03` — Atomic cancellation and duplicate | `CA-05`–`CA-07`, `CA-09`–`CA-11` | Spec `MV-03` | `./evaluation.md` — dialog, request, persistence, rollback fixture, duplicate and accessibility evidence | `pending` |
| Manual | `MV-04` — Responsive and accessibility sweep | `CA-10` | Spec `MV-04` | `./evaluation.md` — keyboard/focus/roles/overflow/console/network sweep at 1024×768 and 390×844 | `pending` |
| Visual | Populated Orders list — 1481×1050 | `CA-02`, `CA-08`, `CA-10` | `./design/UltbT.png` and manifest `UltbT` | Fresh Playwright screenshot and independent hierarchy/widget-tree comparison, including Operator column | `pending` |
| Visual | Registered order details — 1481×1050 | `CA-03`, `CA-04`, `CA-10` | `./design/I2Kra.png` and manifest `I2Kra` | Fresh screenshot and independent snapshot/action/layout comparison | `pending` |
| Visual | Cancellation dialog — 657×602 export around 500×437 dialog | `CA-05`, `CA-07`, `CA-10`, `CA-11` | `./design/c52HsC.png` and manifest `c52HsC` | Fresh dialog screenshot and independent icon/title/focus/form/error comparison | `pending` |
| Visual | Canceled order details — 1481×1050 | `CA-03`, `CA-06`, `CA-09`, `CA-10` | `./design/dPHci.png` and manifest `dPHci` | Fresh screenshot and independent canceled/restored/skipped/read-only comparison | `pending` |
| Visual | Initial empty Orders list — 1481×1050 | `CA-08`, `CA-10` | `./design/Uhw53.png` and manifest `Uhw53` | Fresh screenshot and independent first-order CTA/state comparison | `pending` |
| Visual | Filtered empty Orders list — 1481×1050 | `CA-02`, `CA-08`, `CA-10` | `./design/pSlGt.png` and manifest `pSlGt` | Fresh screenshot and independent retained-filter/clear-state comparison | `pending` |
| Visual | Populated Orders list — 390×844 | `CA-02`, `CA-10` | Manifest responsive supplemental state | Fresh narrow screenshot, exact widget-tree comparison, no page overflow, visible number/date/total, keyboard/focus and console/network record | `pending` |
| Visual | Registered and canceled detail — 390×844 | `CA-03`, `CA-06`, `CA-10` | Manifest responsive supplemental state | Independent fresh narrow screenshots for each status, stacked reading order, action reachability and console/network record | `pending` |
| Visual | List loading — 1481×1050 | `CA-08`, `CA-10` | Manifest missing-state contract | Fresh screenshot and independent loading widget-tree/state comparison | `pending` |
| Visual | List loading — 390×844 | `CA-08`, `CA-10` | Manifest missing-state contract | Fresh narrow screenshot and independent loading/focus/overflow comparison | `pending` |
| Visual | List retryable error — 1481×1050 | `CA-08`, `CA-10`, `CA-11` | Manifest missing-state contract | Fresh screenshot and independent error/retry/filter-preservation comparison | `pending` |
| Visual | List retryable error — 390×844 | `CA-08`, `CA-10`, `CA-11` | Manifest missing-state contract | Fresh narrow screenshot and independent error/retry/focus/overflow comparison | `pending` |
| Visual | Detail loading and retryable error — 1481×1050 | `CA-03`, `CA-10`, `CA-11` | Manifest missing-state contract | Independent fresh screenshots for loading and error states with retry/not-found semantics and console/network record | `pending` |
| Visual | Detail loading and retryable error — 390×844 | `CA-03`, `CA-10`, `CA-11` | Manifest missing-state contract | Independent fresh narrow screenshots for loading and error states with containment/focus record | `pending` |
| Visual | Canceled detail with skipped deleted target — 1481×1050 | `CA-06`, `CA-09`, `CA-10` | Manifest approved supplemental assumption | Fresh screenshot and independent warning-token, snapshot-label and restored/skipped-fact comparison without implying failure | `pending` |
| Review | Complete integrated candidate | All affected RF/CA, design, REST and validation surfaces | [`Implementation Reviewer`](../../agents/implementation-reviewer-agent.md) | Read-only report in `./evaluation.md`; exactly one reviewer after the path sensor, with every accepted finding verified and routed to the responsible Builder | `pending` |

Integrated validation runs in this order: apply the reviewed migration and prepare services and
fixtures; generate the route tree; run the complete Spec path sensor; only after it passes, run
the affected workspace sensors and activate the single read-only Implementation Reviewer; then
run mocked and real Playwright coverage, compare every fresh screenshot with its exact saved
reference/state/viewport, inspect console and failed requests, and record current evidence.
Mocked route tests prove browser/UI transport behavior only; real authenticated runtime and
server integration evidence prove persistence, authorization, restoration and concurrency.

The final handoff condition is: all tasks and phases are `completed`; Spec validation commands
are current on the integrated candidate; generated artifacts and migration outputs are reviewed;
services, Manager/Operator accounts and fixtures are ready; every `MV-*` is executable;
transient validation-artifact identifiers are recorded; final Spec tree/conformance comparison
passes; every additional-screenshot decision is resolved; the latest
`pnpm check:spec-implementation -- documentation/features/pdv/pdv-order-management/spec.md`
run passed after the last contracted-path correction; `apps/server/rest-client/pdv/orders.rest`
is present and route-complete; the Implementation Reviewer completed; every verified review
finding is resolved with no blocking finding active; and every affected workspace coverage
command passed without lowering its configured floor. Then route directly to
[`conclude-spec`](../../prompts/conclude-spec-prompt.md).
