---
title: New Sale order workflow — implementation plan
status: completed
spec: ./spec.md
spec_revision: 3
evaluation: ./evaluation.md
github_issue: https://github.com/rafinel/scoops/issues/23
pull_request: https://github.com/rafinel/scoops/pull/27
updated_at: 2026-08-27
---

# Execution status

- **Spec:** [`./spec.md`](./spec.md), revision `3`, status `completed`.
- **Plan rationale:** Plan-backed execution is required because this delivery crosses Core, Validation, MRP and PDV persistence, a generated migration, a transaction-bound cross-module event, REST, protected Web UI, responsive visual states and real server-backed recovery validation.
- **Current phase:** F7 integrated validation and handoff completed.
- **Next action:** Await review and merge of [PR #27](https://github.com/rafinel/scoops/pull/27); no implementation action is pending.
- **Active blockers:** None within the feature candidate. User-owned governance edits remain preserved and explicitly excluded.
- **Active Builders:** None; all Builder phases and the Orchestrator handoff are complete. The Orchestrator retains the historical generated-artifact and evidence ownership record below.
- **Shared/generated ownership:** The Orchestrator generates and reviews the next Drizzle migration plus journal/snapshot outputs after F4; it also owns `evaluation.md`, transient Playwright evidence and final integration. Builders do not edit generated route metadata or unrelated shared configuration.

# Execution ledger

| Wave | Builder | Phase | Name | Depends on | Parallel with | Status | Exit condition |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | `Builder Core` | F1 | Core contracts and pricing | — | — | `completed` | Framework-free order contracts, pricing/Combo logic, preview-token contracts and Core tests satisfy the Spec revision-3 RF/CA contract and Core sensors. |
| 2 | `Builder Validation` | F2 | Shared transport schemas | F1 | F3 | `completed` | Strict catalog, preview, registration and MRP transaction schemas are root-exported and pass Validation sensors. |
| 2 | `Builder Server` | F3 | MRP catalog, event boundary and sale ledger | F1 | F2 | `completed` | Normal and transaction-bound MRP adapters, sale ledger persistence mapping and focused MRP coverage are ready for PDV transaction composition. |
| 3 | `Builder Server` | F4 | PDV persistence and transaction composition | F3 | — | `completed` | Immutable order snapshots, repositories, serializable retry/rollback composition, seeder and shared schema are ready; generated migration is handed to the Orchestrator. |
| 4 | `Builder Server` | F5 | Order REST operations and examples | F2, F4 | F6 | `completed` | All three order operations, dynamic envelopes, authorization, fixture-backed controller coverage and complete `orders.rest` examples are ready, including failure/contention/conflict tests and status/body parity. |
| 4 | `Builder Web` | F6 | New Sale browser experience | F1, F2 | F5 | `completed` | Web adapter, exact New Sale widget tree, route, tests and fresh visual/browser evidence satisfy the UI and route contracts, including isolated verification focus and state-specific assertions. |
| 5 | `Orchestrator` | F7 | Integrated validation and handoff | F5, F6 | — | `completed` | Generated artifacts, full sensors, real MV-01–MV-06 evidence, REST parity, final visual conformance and the single Implementation Reviewer are complete with no blocking finding. |

### F1 — Core contracts and pricing

#### F1-T1 — Publish order-registration contracts and transaction scope

- **Status/owner:** `completed` — Builder Core (`builder_core`)
- **Depends/parallel:** No dependency. F1-T2 and F2 consume these declarations; no active path overlap with Validation or Server.
- **Paths:** `packages/core/src/pdv/domain/events/order-registered-event.ts`; `packages/core/src/pdv/domain/events/index.ts`; `packages/core/src/pdv/interfaces/{order-preview-token-service,stock-consumer,pdv-database,pdv-service}.ts`; `packages/core/src/pdv/interfaces/index.ts`; `packages/core/src/pdv/domain/structures/{order-registration-input,order-registration-change,order-registration-shortage,order-registration-invalid-configuration,order-registration-result,order-details,order-preview}.ts`; `packages/core/src/pdv/domain/structures/index.ts`; `packages/core/src/mrp/domain/entities/stock-transaction.ts`; `packages/core/src/mrp/domain/structures/{stock-transaction-type,stock-transaction-list-params}.ts` and their affected Core barrels.
- **Contract:** `RF-01`, `RF-06`, `RF-08`–`RF-10`; `CA-01`, `CA-06`–`CA-10`; Spec revision-3 Technical Contract Core domain, preview-token, event, interface and service boundaries.
- **Outcome:** Core exposes typed, discriminated preview/registration inputs/results, immutable order projections, tenant/input-bound preview-token port, sale correlation, actor/occurrence event facts and transaction-bound collaborators without framework, Drizzle or provider types.
- **Rules:** [`code-conventions-rules.md`](../../../rules/code-conventions-rules.md) (naming, declarations, barrels and `AppError`); [`core-package-rules.md`](../../../rules/core-package-rules.md) (one exported type per file, domain ownership, entities and interfaces); [`rest-layer-rules.md`](../../../rules/rest-layer-rules.md) (Core REST service contract).
- **Exit:** Run `pnpm --filter @scoops/core check:code` and `pnpm --filter @scoops/core check:types`; inspect all public exports, discriminators, money/nullable fields, event payload and transaction scope against the Spec without importing application or persistence types.

#### F1-T2 — Implement authoritative pricing, catalog and registration use cases

- **Status/owner:** `completed` — Builder Core (`builder_core`)
- **Depends/parallel:** Depends on F1-T1; sequential within Builder Core. No path overlap with F2 or Server.
- **Paths:** `packages/core/src/pdv/use-cases/{list-order-catalog,preview-order,register-order,order-pricing}.ts`; `packages/core/src/pdv/use-cases/index.ts`; `packages/core/src/pdv/domain/entities/fakers/order-faker.ts`; `packages/core/src/pdv/domain/entities/fakers/index.ts`; `packages/core/src/pdv/domain/structures/sales-catalog-accompaniment.ts`; `packages/core/src/pdv/use-cases/tests/{list-order-catalog,preview-order,register-order,order-pricing}.test.ts`.
- **Contract:** `RF-01`–`RF-10`; `CA-01`–`CA-10`; Spec revision-3 Technical Contract catalog delegation, preview token issue/verification, revalidation, money, exact Combo allocation, idempotency and synchronous event dispatch.
- **Outcome:** Core validates actors and inputs, rebuilds current configurations/prices, selects deterministic maximum-saving non-overlapping Combos, dominates corrective envelopes correctly, supports replay and coordinates atomic registration through `PdvDatabaseScope`.
- **Rules:** [`code-conventions-rules.md`](../../../rules/code-conventions-rules.md) (function/class ownership and known failures); [`core-package-rules.md`](../../../rules/core-package-rules.md) (business rules in use cases and domain contracts); [`use-case-testing-rules.md`](../../../rules/use-case-testing-rules.md) (standard use-case shape, typed mocks, deterministic time, colocated fakers and infrastructure-free tests).
- **Exit:** Run `pnpm --filter @scoops/core check:code`, `pnpm --filter @scoops/core check:types` and `pnpm --filter @scoops/core test`; verify preview token issue/verification, eligibility, exact configuration, rounding, maximum savings, tie ordering, no token/Combo reuse, envelope dominance, replay and event-failure behavior.

### F2 — Shared transport schemas

#### F2-T1 — Add and export catalog, registration and sale-ledger schemas

- **Status/owner:** `completed` — Builder Validation (`builder_validation`)
- **Depends/parallel:** Depends on F1 Core enums and structures; runs in parallel with F3. Server and Web consumers wait for the root exports.
- **Paths:** `packages/validation/src/pdv/{order-catalog-query-schema,preview-order-schema,register-order-schema}.ts`; `packages/validation/src/mrp/stock-transaction-list-schema.ts`; `packages/validation/src/environment/server-env-schema.ts`; `packages/validation/src/index.ts`; `apps/server/.env.example`.
- **Contract:** `RF-01`–`RF-04`, `RF-06`, `RF-08`, `RF-09`, `RF-12`; `CA-01`–`CA-04`, `CA-06`–`CA-08`, `CA-11`; Spec Validation Contract strict HTTP query/body and MRP type boundaries.
- **Outcome:** Shared Zod schemas enforce UUID, pagination, kind, quantity, line-count, previewToken and sale-type syntax while leaving authorization, tenant ownership, current facts and pricing to Core/Server.
- **Rules:** [`validation-package-rules.md`](../../../rules/validation-package-rules.md) (schema ownership, one schema per file, Core-derived enums, consumer boundaries and root exports); [`code-conventions-rules.md`](../../../rules/code-conventions-rules.md) (names and source-backed exports).
- **Exit:** Run `pnpm --filter @scoops/validation check:code` and `pnpm --filter @scoops/validation check:types`; inspect strictness, defaults, root exports and absence of business/tenant refinements, then make the result available to F5/F6.

### F3 — MRP catalog, event boundary and sale ledger

#### F3-T1 — Build transaction-bound MRP catalog and stock-consumer adapters

- **Status/owner:** `completed` — Builder Server (`builder_server`)
- **Depends/parallel:** Depends on F1; runs in parallel with F2. F3-T2 is sequential within Builder Server.
- **Paths:** `apps/server/src/mrp/constants/{mrp-providers.ts,index.ts}`; `apps/server/src/mrp/provision/pdv/{transaction-bound-sales-catalog-provider.ts,transaction-bound-order-registration-dependencies-factory.ts}`; `apps/server/src/mrp/provision/mrp-provision.module.ts`; `apps/server/src/mrp/mrp.module.ts`; `apps/server/src/pdv/provision/mrp/mrp-sales-catalog-provider.ts`; `apps/server/src/pdv/provision/mrp/tests/mrp-sales-catalog-provider.test.ts`; `apps/server/src/pdv/provision/pdv-provision.module.ts`.
- **Contract:** `RF-02`, `RF-09`; `CA-02`, `CA-09`; Spec Technical Contract MRP-owned eligibility, transaction-bound revalidation and synchronous stock-consumer composition.
- **Outcome:** Normal and transaction-bound providers map the same MRP facts, apply eligibility before pagination, retain valid unavailable products, and expose an MRP-owned factory that binds catalog reads and stock writes to one executor.
- **Rules:** [`provision-layer-rules.md`](../../../rules/provision-layer-rules.md) (Core contracts, module registration, infrastructure-only providers and mock-based provider tests); [`database-layer-rules.md`](../../../rules/database-layer-rules.md) (module-owned persistence boundaries); [`code-conventions-rules.md`](../../../rules/code-conventions-rules.md) (aliases and declarations).
- **Exit:** Run the focused provider tests and Server code/type checks; assert raw-to-eligible totals/pages, tenant scope, exact mapping parity and factory executor binding, with no PDV import of MRP persistence internals.

#### F3-T2 — Extend MRP sale-ledger persistence and history read coverage

- **Status/owner:** `completed` — Builder Server (`builder_server`)
- **Depends/parallel:** Depends on F3-T1; no active path overlap with F4 or F5.
- **Paths:** `apps/server/src/mrp/database/drizzle/models/stock-transaction-model.ts`; `apps/server/src/mrp/database/drizzle/types/entities/stock-transaction.ts`; `apps/server/src/mrp/database/drizzle/mappers/drizzle-stock-transaction-mapper.ts`; `apps/server/src/mrp/rest/dtos/stock-transaction-response.dto.ts`; `apps/server/src/mrp/rest/controllers/tests/list-stock-transactions.controller.test.ts`.
- **Contract:** `RF-09`; `CA-09`; Spec Technical Contract nullable `order_id`, Sale type, non-FK order correlation, mapper/DTO preservation and history filtering.
- **Outcome:** MRP can record and read a sale movement correlated by order ID while preserving existing entry/write-off behavior, tenant isolation and module ownership.
- **Rules:** [`database-layer-rules.md`](../../../rules/database-layer-rules.md) (Drizzle declarations, persistence types, mappers and owning repositories); [`controllers-testing-rules.md`](../../../rules/controllers-testing-rules.md) (real infrastructure, module wiring, HTTP and persistence assertions); [`code-conventions-rules.md`](../../../rules/code-conventions-rules.md) (naming and barrels).
- **Exit:** Run focused MRP controller tests and Server code/type checks; verify Sale mapping, nullable correlation, filter behavior and no MRP-to-PDV foreign key, leaving migration generation to the Orchestrator after F4.

### F4 — PDV persistence and transaction composition

#### F4-T1 — Persist immutable PDV order snapshots and lossless mappings

- **Status/owner:** `completed` — Builder Server (`builder_server`)
- **Depends/parallel:** Depends on F3 because the PDV aggregate must compose with the finalized MRP transaction boundary; sequential within Builder Server.
- **Paths:** `apps/server/src/pdv/database/drizzle/models/{order-sequence-model,order-model,order-line-model,order-line-accompaniment-model,order-line-consumption-model,order-discount-model,order-discount-component-model,order-discount-component-accompaniment-model,order-discount-line-model}.ts`; `apps/server/src/pdv/database/drizzle/models/index.ts`; `apps/server/src/pdv/database/drizzle/types/entities/{order,order-line,order-discount,order-discount-component,order-discount-line}.ts`; `apps/server/src/pdv/database/drizzle/types/entities/index.ts`; `apps/server/src/pdv/database/drizzle/types/index.ts`; `apps/server/src/pdv/database/drizzle/mappers/drizzle-order-mapper.ts`; `apps/server/src/pdv/database/drizzle/mappers/index.ts`.
- **Contract:** `RF-07`, `RF-09`, `RF-10`; `CA-06`, `CA-09`, `CA-10`; Spec Technical Contract tenant-qualified idempotency/sequence constraints, normalized immutable snapshots and one lossless aggregate mapper.
- **Outcome:** PDV persistence round-trips orders, lines, configurations, accompaniments, discount components/links, numeric values and null snapshots while enforcing the declared sequence and idempotency constraints.
- **Rules:** [`database-layer-rules.md`](../../../rules/database-layer-rules.md) (owning module, Drizzle declarations, persistence types, mappers and repository vocabulary); [`core-package-rules.md`](../../../rules/core-package-rules.md) (Core contracts remain persistence-agnostic); [`code-conventions-rules.md`](../../../rules/code-conventions-rules.md) (aliases, barrels and file names).
- **Exit:** Run Server code/type checks and focused mapper/model tests where available; inspect generated model typing, constraints and a full aggregate round-trip against the Spec, including discount and accompaniment link fidelity.

#### F4-T2 — Compose repositories, serializable retry, seeding and shared schema

- **Status/owner:** `completed` — Builder Server (`builder_server`)
- **Depends/parallel:** Depends on F4-T1; F5 consumes the completed transaction composition. No path overlap with F3 or F5.
- **Paths:** `apps/server/src/pdv/database/drizzle/repositories/{drizzle-orders-repository,drizzle-order-sequences-repository}.ts`; `apps/server/src/pdv/database/drizzle/repositories/drizzle-pdv-database.ts`; `apps/server/src/pdv/database/drizzle/repositories/index.ts`; `apps/server/src/pdv/database/pdv-database.module.ts`; `apps/server/src/pdv/database/pdv-seeder.ts`; `apps/server/src/pdv/database/drizzle/repositories/drizzle-discounts-repository.ts`; `apps/server/src/shared/database/drizzle/schema.ts`.
- **Contract:** `RF-07`–`RF-10`; `CA-06`, `CA-09`, `CA-10`; Spec Technical Contract transaction-owned retry/rollback, sequence/idempotency repositories, MRP factory binding, seed cleanup and deterministic Combo ordering.
- **Outcome:** DrizzlePdvDatabase owns serializable transaction/retry behavior, binds Core repositories and the MRP-owned factory to one executor, seeds/clears child rows safely and removes the unsafe scope cast.
- **Rules:** [`database-layer-rules.md`](../../../rules/database-layer-rules.md) (repositories, tokens, seeders, complete cleanup and no repository tests); [`provision-layer-rules.md`](../../../rules/provision-layer-rules.md) (provider registration and infrastructure-only adapters); [`code-conventions-rules.md`](../../../rules/code-conventions-rules.md) (declarations and aliases).
- **Exit:** Run focused Server checks and inspect repository/transaction wiring, retry behavior, seed ordering and deterministic `createdAt`/ID ordering; hand the finalized schema to the Orchestrator for generated migration creation and review.

### F5 — Order REST operations and examples

#### F5-T1 — Expose catalog, preview and registration controllers with complete REST examples

- **Status/owner:** `completed` — Builder Server (`builder_server`)
- **Depends/parallel:** Depends on F2 and F4; runs in parallel with F6 after the Core, Validation and Server contracts are stable.
- **Paths:** `apps/server/.env.example`; `apps/server/src/pdv/constants/pdv-providers.ts`; `apps/server/src/pdv/decorators/orders-controller.ts`; `apps/server/src/pdv/rest/controllers/{list-order-catalog,preview-order,register-order}.controller.ts`; `apps/server/src/pdv/rest/dtos/{order-preview-response,order-response,order-registration-response}.dto.ts`; affected `apps/server/src/pdv/{constants,decorators,rest/controllers,rest/dtos}/index.ts`; `apps/server/src/pdv/provision/preview-token/node-preview-token-service.ts`; `apps/server/src/pdv/provision/pdv-provision.module.ts`; `apps/server/src/pdv/fixtures/pdv-module-fixture.ts`; `apps/server/src/pdv/pdv.module.ts`; `apps/server/src/pdv/rest/controllers/tests/{list-order-catalog,preview-order,register-order}.controller.test.ts`; `apps/server/rest-client/pdv/orders.rest`.
- **Contract:** `RF-01`, `RF-02`, `RF-08`–`RF-10`, `RF-12`; `CA-01`, `CA-02`, `CA-07`–`CA-11`; Spec revision-3 Technical Contract HTTP status/envelope mapping, CurrentAccount, preview token issue/verification, invalid-token no-disclosure, Swagger, fixture-backed persistence and route ownership.
- **Outcome:** GET `/orders/catalog`, POST `/orders/preview` and POST `/orders` are authorized for Manager/Operator, tenant-scoped, schema-validated, preview-token aware, dynamically status-mapped, Swagger-documented and covered by real module-fixture tests for preview, success, replay, no-write outcomes, rollback and contention.
- **Rules:** [`rest-layer-rules.md`](../../../rules/rest-layer-rules.md) (one controller per action, request mapping, responses, route ownership, REST-client parity, service contract and global errors); [`controllers-testing-rules.md`](../../../rules/controllers-testing-rules.md) (real infrastructure, module wiring and HTTP/persistence assertions); [`database-layer-rules.md`](../../../rules/database-layer-rules.md) (fixture/database ownership); [`code-conventions-rules.md`](../../../rules/code-conventions-rules.md) (aliases and declaration order).
- **Exit:** Run focused controller tests plus `pnpm --filter server check:code`, `pnpm --filter server check:types` and `pnpm --filter server build`. Verify `orders.rest` has reusable local variables, no credentials and one labeled request for each route/outcome; compare every method, path, query/body, header and expected response with all controllers and shared schemas, including preview-token issue/mismatch, and record parity in `./evaluation.md`. This artifact check is separate from real HTTP/persistence evidence.

### F6 — New Sale browser experience

#### F6-T1 — Implement the PDV web adapter and workflow state hooks

- **Status/owner:** `completed` — Builder Web (`builder_web`)
- **Depends/parallel:** Depends on F1 and F2; runs in parallel with F5. F6-T2 consumes the service and hook contracts.
- **Paths:** `apps/web/src/rest/services/pdv-service.ts`; `apps/web/src/ui/pdv/hooks/{sale-query-keys,use-order-catalog-query,use-preview-order-action,use-register-order-action}.ts`; `apps/web/src/ui/pdv/widgets/pages/new-sale-page/use-new-sale-page.ts`.
- **Contract:** `RF-02`, `RF-05`–`RF-08`, `RF-12`; `CA-02`, `CA-05`–`CA-08`, `CA-11`; Spec revision-3 Technical Contract web REST mapping, local cart/preview-token boundary, stale refresh, invalid-token recovery and same-key replay ownership.
- **Outcome:** Web transport preserves typed server envelopes, local cart input, idempotency key, previewToken and all preview/registration outcomes without calculating authoritative totals or moving replay decisions out of `use-new-sale-page.ts`.
- **Rules:** [`ui-layer-rules.md`](../../../rules/ui-layer-rules.md) (action hooks, visible feedback, status constants, REST adapters and owning widget logic); [`rest-layer-rules.md`](../../../rules/rest-layer-rules.md) (REST service contract, factory/adapters and session headers); [`code-conventions-rules.md`](../../../rules/code-conventions-rules.md) (names and declarations).
- **Exit:** Run Web code/type checks and the focused route suite once available; assert exact GET/POST methods, query/body/key/token preservation, preview refresh, invalid-token recovery, pending/error/envelope mapping and no authoritative client pricing. Browser checks must inspect visible outcome, outgoing request and console/failed requests.

#### F6-T2 — Build the exact New Sale widget tree, route and browser coverage

- **Status/owner:** `completed` — Builder Web (`builder_web`)
- **Depends/parallel:** Depends on F6-T1 and the F1/F2 contracts; sequential within Builder Web. No path overlap with F5.
- **Paths:** `apps/web/src/ui/pdv/widgets/pages/new-sale-page/index.tsx`; `apps/web/src/ui/pdv/widgets/pages/new-sale-page/use-new-sale-page.ts`; `apps/web/src/ui/pdv/widgets/pages/new-sale-page/tests/{new-sale-page.test.tsx,use-new-sale-page.test.ts}`; `apps/web/src/ui/pdv/widgets/pages/new-sale-page/new-sale-catalog/{index.tsx,use-new-sale-catalog.ts,tests/{new-sale-catalog.test.tsx,use-new-sale-catalog.test.ts}}`; `apps/web/src/ui/pdv/widgets/pages/new-sale-page/new-sale-cart/{index.tsx,use-new-sale-cart.ts,tests/{new-sale-cart.test.tsx,use-new-sale-cart.test.ts}}`; `apps/web/src/ui/pdv/widgets/pages/new-sale-page/portion-configuration-dialog/{index.tsx,use-portion-configuration-dialog.ts,tests/{portion-configuration-dialog.test.tsx,use-portion-configuration-dialog.test.ts}}`; `apps/web/src/ui/pdv/widgets/pages/new-sale-page/resale-configuration-dialog/{index.tsx,use-resale-configuration-dialog.ts,tests/{resale-configuration-dialog.test.tsx,use-resale-configuration-dialog.test.ts}}`; `apps/web/src/ui/pdv/widgets/pages/new-sale-page/order-registration-dialog/{index.tsx,tests/order-registration-dialog.test.tsx}`; `apps/web/src/ui/pdv/widgets/pages/new-sale-page/order-confirmation/{index.tsx,tests/order-confirmation.test.tsx}`; `apps/web/src/ui/pdv/widgets/pages/new-sale-page/order-verification-state/{index.tsx,tests/order-verification-state.test.tsx}`; `apps/web/src/routes/_authenticated/sales/new.tsx`; `apps/web/tests/routes/pdv/new-sale.test.ts`; `apps/web/src/ui/mrp/widgets/slots/product-stock-slot/stock-transaction-history-card/{index.tsx,stock-transaction-history-card.test.tsx}`.
- **Contract:** `RF-03`–`RF-08`, `RF-11`, `RF-12`; `CA-03`–`CA-08`, `CA-11`, `CA-12`; Spec Design Contract, exact widget/test tree and Validation Contract MV-01, MV-03–MV-06.
- **Outcome:** The authenticated route renders the catalog/cart/configurators/registration/recovery/success states with one owner hook, accessible labels/focus, pt-BR values, preserved selections and responsive total/action reachability; MRP sale history renders `Venda`.
- **Rules:** [`ui-layer-rules.md`](../../../rules/ui-layer-rules.md) (feature boundaries, stateful widget hooks, shadcn, pt-BR, focus, dialogs, design tokens and `Antipatterns to Avoid`); [`web-app-routing-rules.md`](../../../rules/web-app-routing-rules.md) (canonical route, middleware, search, generated tree, route matrix and required validation); [`widget-testing-rules.md`](../../../rules/widget-testing-rules.md) (owning boundaries, state matrix, accessible queries, hook mocks, route integration and completion criteria); [`code-conventions-rules.md`](../../../rules/code-conventions-rules.md) (naming and declarations).
- **Exit:** Run focused Vitest and Playwright CLI coverage plus Web code/type checks. Compare the exact Spec widget tree and every supplied reference—`jKmSB.png`, `QavkX.png`, `YKYIX.png`, `BWsuP.png`, `olIiS.png`, `e6D4f.png`, `o81IK.png`, `QuVaH.png`—at their manifest dimensions/states. Also capture the deferred 390×844 stacked state and desktop/390×844 neutral verification state. Exercise keyboard and narrow viewport paths, loading/empty/error/pending/recovery states, inspect console and failed requests, and save a fresh screenshot for every affected design state with paths and comparison results in `./evaluation.md`.

### F7 — Integrated validation and handoff

#### F7-T1 — Generate artifacts, run integrated evidence and complete the review gate

- **Status/owner:** `completed` — Orchestrator
- **Depends/parallel:** Depends on F5 and F6, with F4’s finalized schema; no parallel implementation work. The generated migration is created only after the persistence diff is integrated.
- **Paths:** `apps/server/src/shared/database/drizzle/migrations/` (generated SQL, journal and snapshot outputs only); `./evaluation.md` (created by `implement-spec` at kickoff and maintained as the evidence ledger); transient `apps/web/test-results/` artifacts (not committed).
- **Contract:** `RF-01`–`RF-12`; `CA-01`–`CA-12`; all Spec Validation Contract commands, MV scenarios, design manifest and REST parity requirements.
- **Outcome:** The integrated candidate has reviewed generated migration outputs, current full sensors, real server-backed order/stock/idempotency/authorization evidence, complete visual evidence and a ready Evaluation.
- **Rules:** [`database-layer-rules.md`](../../../rules/database-layer-rules.md) (generated migration review and schema ownership); [`rest-layer-rules.md`](../../../rules/rest-layer-rules.md) (final REST parity); [`web-app-routing-rules.md`](../../../rules/web-app-routing-rules.md) (route validation); [`widget-testing-rules.md`](../../../rules/widget-testing-rules.md) (browser evidence); [`code-conventions-rules.md`](../../../rules/code-conventions-rules.md) (integrated source quality).
- **Exit:** Generate and inspect the next migration with `pnpm --filter server db:migration:generate`; inspect `docker compose ps` and health endpoints for Supabase `http://127.0.0.1:54321`, Server `http://127.0.0.1:3336` and Web `http://127.0.0.1:4000`; seed explicitly only if accounts are absent. Run all Spec commands, real HTTP/persistence/authorization checks, and `pnpm --filter web test:integration tests/routes/pdv/new-sale.test.ts`; execute MV-01–MV-06 with fresh evidence and route-complete REST parity. After Builder diffs are integrated, schedule exactly one read-only [`Implementation Reviewer`](../../../agents/implementation-reviewer-agent.md) across Core, Validation, MRP/PDV Server, REST, Web route/widget tree, persistence/migration and all final visual comparisons. Verify every reviewer finding, record accepted findings in `./evaluation.md`, resume the responsible Builder for corrections, invalidate affected evidence, and rerun the same Reviewer before handoff. The final condition is all tasks/phases complete, generated artifacts reviewed, every MV executable, every RF/CA covered, visual/supplemental decisions resolved, REST artifact route-complete, no blocking finding active, then route directly to `conclude-spec`.

# Validation and handoff

| Type | Scenario/surface | Criteria | Reference | Evidence target | Status |
| --- | --- | --- | --- | --- | --- |
| Automated | Core contracts, pricing and registration | CA-01–CA-10 | Spec automated Core checks | `./evaluation.md` with command output and focused test evidence | `passed` |
| Automated | Shared request and sale-ledger schemas | CA-01–CA-04, CA-06–CA-08, CA-11 | Spec automated Validation checks | `./evaluation.md` | `passed` |
| Runtime | MRP provider, sale ledger and PDV transaction | CA-02, CA-09, CA-10 | Spec Technical Contract | `./evaluation.md` with real request/response and persistence counts | `passed` |
| Runtime | REST controllers and module fixture | CA-01, CA-02, CA-07–CA-10 | Spec controller tests | `./evaluation.md` with authorization, status, rollback, replay and contention evidence | `passed` |
| REST client | `apps/server/rest-client/pdv/orders.rest` | CA-01, CA-02, CA-07–CA-11 | Spec REST Contract and controllers | Exact artifact path plus parity record for GET `/orders/catalog`, POST `/orders/preview` and POST `/orders`, including preview issue/stale refresh/invalid-token outcomes, labeled methods, paths, headers, bodies, reusable variables and no credentials | `passed` |
| Visual | Populated New Sale desktop — 1481×1050 | CA-02, CA-05, CA-06, CA-12 | `./design/jKmSB.png` | Fresh Playwright screenshot path and comparison in `./evaluation.md` | `passed` |
| Visual | Portion configuration dialog — 756×966 | CA-03, CA-12 | `./design/QavkX.png` | Fresh Playwright screenshot path and comparison in `./evaluation.md` | `passed` |
| Visual | Resale configuration dialog — 756×866 | CA-04, CA-12 | `./design/YKYIX.png` | Fresh Playwright screenshot path and comparison in `./evaluation.md` | `passed` |
| Visual | Review-required conflict — 717×547 | CA-08, CA-12 | `./design/BWsuP.png` | Fresh Playwright screenshot path and comparison in `./evaluation.md` | `passed` |
| Visual | Repriced order — 717×546 | CA-07, CA-12 | `./design/olIiS.png` | Fresh Playwright screenshot path and comparison in `./evaluation.md` | `passed` |
| Visual | Correction-required order — 717×564 | CA-08, CA-12 | `./design/e6D4f.png` | Fresh Playwright screenshot path and comparison in `./evaluation.md` | `passed` |
| Visual | Confirmed rollback — 717×420 | CA-11, CA-12 | `./design/o81IK.png` | Fresh Playwright screenshot path and comparison in `./evaluation.md` | `passed` |
| Visual | Registered order — 1481×1050 | CA-09, CA-10, CA-12 | `./design/QuVaH.png` | Fresh Playwright screenshot path and comparison in `./evaluation.md` | `passed` |
| Visual | Responsive stacked workflow — 390×844 | CA-05, CA-12 | Manifest supplemental decision | Fresh narrow Playwright screenshot, keyboard/focus, overflow and console/network result in `./evaluation.md` | `passed` |
| Visual | Neutral verification — desktop | CA-11, CA-12 | Manifest supplemental decision | Fresh Playwright screenshot showing no rollback claim and same-key replay evidence in `./evaluation.md` | `passed` |
| Visual | Neutral verification — 390×844 | CA-11, CA-12 | Manifest supplemental decision | Fresh narrow Playwright screenshot showing no rollback claim and same-key replay evidence in `./evaluation.md` | `passed` |
| Manual | MV-01 — Manager success with Portion, by-brand Resale, channel and Combo | CA-02–CA-06, CA-09, CA-12 | Spec MV-01 | `./evaluation.md` with network result, fresh desktop success capture and fixture/database proof | `passed` |
| Manual | MV-02 — Operator and foreign-tenant access | CA-01, CA-12 | Spec MV-02 | `./evaluation.md` with role/tenant HTTP evidence and final URL | `passed` |
| Manual | MV-03 — Channel/Combo reprice | CA-07, CA-12 | Spec MV-03 | `./evaluation.md` with fresh reprice capture, changed total and no-write proof | `passed` |
| Manual | MV-04 — Invalidated configuration or depleted stock | CA-08, CA-12 | Spec MV-04 | `./evaluation.md` with correction/conflict capture, preserved cart and no-partial-row proof | `passed` |
| Manual | MV-05 — Unknown transport replay and confirmed rollback | CA-09–CA-11, CA-12 | Spec MV-05 | `./evaluation.md` with same-key outcome counts, neutral capture and separate confirmed rollback capture | `passed` |
| Manual | MV-06 — Narrow keyboard-only workflow | CA-03–CA-05, CA-11, CA-12 | Spec MV-06 | `./evaluation.md` with narrow screenshot, focus order, console/network inspection and no hydration/accessibility errors | `passed` |

Final handoff requires every task and phase to be `completed`, the Spec revision-3 commands to be current on the integrated candidate, generated migration/journal/snapshot outputs reviewed, services/accounts/fixtures ready, every `MV-*` executable, every RF/CA covered, all transient screenshot identifiers and comparisons recorded, all supplied and supplemental visual decisions resolved, `orders.rest` present and route-complete for all three order operations, the single Implementation Reviewer completed with verified findings resolved, and no blocking finding active. Then route directly to `conclude-spec`.
