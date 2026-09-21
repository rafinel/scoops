---
title: Operational Analytics Dashboard — implementation plan
status: completed
spec: ./spec.md
spec_revision: 4
evaluation: ./evaluation.md
github_issue: https://github.com/rafinel/scoops/issues/40
updated_at: 2026-09-16
---

# Execution status

This Plan is completed. It retains the historical Builder Direct execution ledger and correction history for traceability; all contracted phases and final validation exits are complete for Spec revision 4.

- **Spec:** [`spec.md`](./spec.md), revision `4`, `completed` after the approved technical Contract amendment and final PR CI matrix passed.
- **Rationale:** Plan-backed execution is required because this delivery spans Core, Validation, Server, Database, Provision, Web, a migration, cross-module transactions, an external Billing prerequisite and complex manual/visual validation.
- **Current phase:** completed; revision 4 passed the integrated path sensor, local validation, browser evidence and final PR CI matrix.
- **Next action:** None; merge and deployment remain outside this task.
- **Active blockers:** None for Spec delivery. Analytics continues to fail closed for missing or non-full access as contracted.
- **Active Builders:** Builder Direct in the current context, explicitly authorized by the user on 2026-09-13. Previous Builder Core attempts remain historical evidence only.
- **Shared ownership:** The Orchestrator owns `plan.md`, `evaluation.md`, `apps/web/package.json`, `pnpm-lock.yaml`, `apps/web/src/routeTree.gen.ts`, and generated/reviewed migration artifacts. `Builder Server` owns the Analytics and Identity REST-client examples; active Builder paths do not overlap.

# Execution ledger

| Wave | Builder | Phase | Name | Depends on | Parallel with | Status | Exit condition |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | `Builder Direct` | F1 | Establish Analytics and Identity core contracts and actions | — | — | `completed` | Core contracts and Analytics/Identity use-case suites pass their focused checks. |
| 1 | `Builder Core` | F2 | Move PDV/MRP cost, allocation and stock behavior into Core boundaries | F1 | — | `completed` | PDV/MRP Core suites prove immutable costs, exact allocation, stock actions and shared-boundary behavior. |
| 2 | `Builder Validation` | F3 | Add shared transport, form and interaction schemas | F1, F2 | F4 | `completed` | Validation code, architecture and types checks pass and all schemas are exported from the package root. |
| 2 | `Builder Server` | F4 | Implement persistence, snapshots, indexes and transaction infrastructure | F2 | F3 | `completed` | Server static checks pass; models, mappers, repositories and transaction context implement the Core contracts without direct repository tests. |
| 3 | `Builder Server` | F5 | Wire provision, REST controllers, DTOs, fixtures and composition | F3, F4, Billing prerequisite | F6 | `completed` | Server checks/tests pass, both affected REST-client groups are route-complete, and authoritative Billing access is registered. |
| 3 | `Builder Web` | F6 | Implement Web transport, Dashboard, Settings, routes and browser coverage | F1, F2, F3 | F5 | `completed` | Web checks/tests pass with the complete widget tree, route/auth behavior, responsive states and fresh visual evidence. |
| 4 | `Orchestrator` | F7 | Generate shared artifacts and run the complete Spec path gate | F5, F6 | — | `completed` | Generated migration, lockfile and route tree are reviewed and `pnpm check:spec-implementation -- documentation/features/analytics/dashboard-page/spec.md` passes. |
| 5 | `Orchestrator` | F8 | Run integrated validation, one Implementation Reviewer and handoff | F7, Billing prerequisite | — | `completed` | All commands, runtime/manual/visual evidence and review findings are current and the final handoff condition is true. |

### F1 — Core Analytics and Identity foundations

#### F1-T1 — Establish Analytics projections, ports, access/time and Identity timezone actions

- **Status/owner:** `completed` — Builder Direct; the four historical Builder Core attempts were superseded after explicit user authorization and the direct Core exits now pass.
- **Depends/parallel:** First task; `F2-T1` follows in the same Builder Core boundary.
- **Paths:** `packages/core/src/analytics/**`; `packages/core/src/identity/domain/structures/{establishment-timezone.ts,establishment-audit-action.ts,establishment-settings.ts,index.ts}`; `packages/core/src/identity/domain/entities/{establishment.ts,establishment-create.ts,establishment-update.ts,index.ts,fakers/establishment-faker.ts}`; `packages/core/src/identity/use-cases/{change-establishment-timezone-use-case.ts,tests/change-establishment-timezone-use-case.test.ts,get-establishment-settings-use-case.ts,tests/get-establishment-settings-use-case.test.ts,register-ice-cream-shop-use-case.ts,tests/register-ice-cream-shop-use-case.test.ts,index.ts}`; `packages/core/src/identity/interfaces/{establishments-repository.ts,identity-service.ts}`; `packages/core/package.json`; `packages/core/tsconfig.json`.
- **Contract:** `FR-01`–`FR-04`, `FR-10`, `FR-14`; `AC-01`–`AC-03`, `AC-09`, `AC-15`; Analytics and Identity sections of the Spec Technical Contract.
- **Outcome:** Framework-independent Analytics structures, ports, sales/stock actions and Identity timezone behavior are exported with fail-closed access, deterministic intervals, nullable margin/cost semantics and atomic audited timezone changes.
- **Rules:** [`code-conventions-rules.md`](../../../rules/code-conventions-rules.md) (names, declarations, errors and barrels); [`core-package-rules.md`](../../../rules/core-package-rules.md) (one exported type per file, use-case ownership and interface placement); [`use-case-testing-rules.md`](../../../rules/use-case-testing-rules.md) (one use-case suite, typed mocks, deterministic time and infrastructure-free tests).
- **Exit:** Run the affected Core code, architecture, types and focused use-case suites; verify access, timezone, period, cancellation, stock-cap and failure branches with fixed clocks and typed provider mocks. No framework, database or repository implementation may enter Core.

### F2 — PDV/MRP Core transaction foundations

#### F2-T1 — Refactor PDV/MRP Core contracts for immutable cost, exact allocation and stock ownership

- **Status/owner:** `completed` — Builder Core
- **Depends/parallel:** Depends on `F1-T1`; sequential within Builder Core. No parallel edit may touch the listed Core paths.
- **Paths:** `packages/core/src/pdv/domain/structures/{order-cost-component-snapshot.ts,order-line.ts,index.ts}`; `packages/core/src/pdv/use-cases/{register-order-use-case.ts,tests/register-order-use-case.test.ts,cancel-order-use-case.ts,tests/cancel-order-use-case.test.ts}`; `packages/core/src/pdv/interfaces/{order-cost-provider.ts,orders-repository.ts,pdv-database.ts,index.ts}`; `packages/core/src/mrp/domain/structures/{order-stock-consumption.ts,order-stock-restoration-request.ts,order-stock-restoration.ts,stock-attention-source-fact.ts,stock-attention-fact.ts,index.ts}`; `packages/core/src/mrp/use-cases/{consume-order-stock-use-case.ts,tests/consume-order-stock-use-case.test.ts,restore-order-stock-use-case.ts,tests/restore-order-stock-use-case.test.ts,list-stock-attention-use-case.ts,tests/list-stock-attention-use-case.test.ts,index.ts}`; `packages/core/src/mrp/interfaces/{stock-attention-facts-repository.ts,products-repository.ts,mrp-database.ts,index.ts}`.
- **Contract:** `FR-05`, `FR-08`, `FR-10`; `AC-04`, `AC-07`, `AC-09`; PDV/MRP Core and transaction contracts in the Spec.
- **Outcome:** PDV owns registration-time cost snapshots and cent allocation, MRP owns stock consumption/restoration/attention classification, and database scopes carry only repository/event contracts while independently injected ports preserve atomicity.
- **Rules:** [`code-conventions-rules.md`](../../../rules/code-conventions-rules.md) (business errors, declarations and naming); [`core-package-rules.md`](../../../rules/core-package-rules.md) (business rules in use cases and contracts under interfaces); [`use-case-testing-rules.md`](../../../rules/use-case-testing-rules.md) (use-case-only tests, typed mocks, deterministic time and rollback assertions).
- **Exit:** Run all affected Core checks and suites; prove known/zero/unknown costs, Combo residual allocation, idempotent replay, foreign-tenant rejection, MRP ordering/conflicts, restored/skipped targets and no partial Core result on failure. Persistence and HTTP proof remains scheduled for `F5` and `F8`.

### F3 — Shared Validation schemas

#### F3-T1 — Add Analytics, Identity and Web boundary schemas

- **Status/owner:** `completed` — Builder Validation
- **Depends/parallel:** Depends on `F1` and `F2` Core literals/contracts; runs in parallel with `F4` on disjoint `packages/validation` paths.
- **Paths:** `packages/validation/src/analytics/{analytics-period-query-schema.ts,analytics-interaction-schema.ts}`; `packages/validation/src/identity/establishment-timezone-schema.ts`; `packages/validation/src/web/shop-timezone-form-schema.ts`; `packages/validation/src/index.ts`.
- **Contract:** `FR-02`, `FR-14`, `FR-15`; `AC-02`, `AC-15`, `AC-16`; Validation Contract schemas and consumer boundaries.
- **Outcome:** The package-root API exposes strict period, supported-timezone, form and privacy-safe interaction schemas without encoding authorization, tenancy or business rules.
- **Rules:** [`validation-package-rules.md`](../../../rules/validation-package-rules.md) (Core-derived enums, one schema per file, root exports and consumer boundaries); [`code-conventions-rules.md`](../../../rules/code-conventions-rules.md) (TypeScript naming and declarations).
- **Exit:** Run `pnpm --filter @scoops/validation check:code`, `check:architecture` and `check:types`; verify Core-derived enum values, default period, strict bounded interaction payloads and localized form validation through later consumers rather than adding forbidden schema-local business decisions.

### F4 — Persistence and transaction infrastructure

#### F4-T1 — Persist timezone, immutable order facts, stock attention facts and bounded read snapshots

- **Status/owner:** `completed` — Builder Server
- **Depends/parallel:** Depends on `F2`; runs in parallel with `F3` and remains independent of Web paths. Generated migration files are Orchestrator-owned in `F7`.
- **Paths:** `apps/server/src/identity/database/drizzle/{models/establishment-model.ts,models/establishment-audit-action-model.ts,types/entities/drizzle-establishment.ts,mappers/drizzle-establishment-mapper.ts,repositories/drizzle-establishments-repository.ts}`; `apps/server/src/identity/database/{identity-seeder.ts}`; `apps/server/src/shared/database/seed.ts`; `apps/server/src/pdv/database/drizzle/{models/order-line-model.ts,models/order-model.ts,models/order-line-cost-component-model.ts,models/index.ts,types/entities/order-line-cost-component.ts,types/entities/order-line.ts,types/entities/index.ts,mappers/drizzle-order-mapper.ts,repositories/drizzle-orders-repository.ts,repositories/drizzle-pdv-database.ts}`; `apps/server/src/pdv/database/pdv-database.module.ts`; `apps/server/src/mrp/database/drizzle/{mappers/drizzle-stock-attention-source-fact-mapper.ts,repositories/drizzle-stock-attention-facts-repository.ts,repositories/drizzle-products-repository.ts,repositories/drizzle-mrp-database.ts,repositories/index.ts}`; `apps/server/src/mrp/database/{mrp-database.module.ts}`; `apps/server/src/mrp/constants/mrp-repositories.ts`; `apps/server/src/shared/database/drizzle/schema.ts`.
- **Contract:** `FR-03`–`FR-05`, `FR-08`–`FR-10`, `FR-14`; `AC-03`–`AC-05`, `AC-07`–`AC-09`, `AC-15`; Database Contract migration, tenant, keyset and transaction rules.
- **Outcome:** Tenant-qualified Drizzle models, mappers and repositories support immutable cost/allocation history, cancellation activity batches, MRP bulk attention facts, current-link lookups and repeatable read snapshots while reusing the shared transaction context.
- **Rules:** [`database-layer-rules.md`](../../../rules/database-layer-rules.md) (owning-module persistence, models/types/mappers, repository contracts, transaction context, tokens and seeders); [`code-conventions-rules.md`](../../../rules/code-conventions-rules.md) (known failures and declarations).
- **Exit:** Run Server code, architecture and types checks; inspect every tenant predicate, keyset limit, nullable cost mapping, numeric conversion, repository token and transaction-context reuse. Do not add repository/mapper/model direct tests; controller and complete-flow tests in `F5`/`F8` must exercise these paths.

### F5 — Server provision, REST and composition

#### F5-T1 — Replace executor-bound MRP registration wiring with narrow provision adapters

- **Status/owner:** `completed` — Builder Server
- **Depends/parallel:** Depends on `F3` and `F4`; sequential before `F5-T2`. The external Billing prerequisite must expose authoritative access before this task can complete.
- **Paths:** `apps/server/src/shared/provision/analytics/{identity-billing-analytics-context-provider.ts,pdv-analytics-sales-facts-provider.ts,mrp-analytics-stock-facts-provider.ts,system-analytics-clock.ts,analytics-provision.module.ts}`; `apps/server/src/shared/provision/pdv-order-registration/{mrp-sales-catalog-provider.ts,mrp-order-cost-provider.ts,mrp-stock-provider.ts,pdv-order-registration-provision.module.ts}`; `apps/server/src/mrp/provision/pdv/{transaction-bound-sales-catalog-provider.ts,transaction-bound-order-registration-dependencies-factory.ts}`; `apps/server/src/mrp/provision/mrp-provision.module.ts`; `apps/server/src/mrp/constants/mrp-providers.ts`; `apps/server/src/pdv/provision/mrp/{mrp-sales-catalog-provider.ts,index.ts}`; `apps/server/src/pdv/provision/{index.ts}`; `apps/server/src/pdv/constants/pdv-providers.ts`; `apps/server/src/pdv/provision/pdv-provision.module.ts`; `apps/server/src/analytics/{analytics.module.ts,constants/analytics-providers.ts,constants/index.ts}`; `apps/server/src/identity/identity.module.ts`; `apps/server/src/app.module.ts`.
- **Contract:** `FR-01`, `FR-05`, `FR-09`, `FR-10`, `FR-15`; `AC-01`, `AC-04`, `AC-08`, `AC-09`, `AC-16`; Provision and Composition Contracts.
- **Outcome:** Analytics consumes mapped Identity/Billing/PDV/MRP contracts, PDV registration/cancellation uses narrow independently injected ports, MRP stock rules stay in MRP Core actions, and module bootstrap exposes no executor or permissive Billing fallback.
- **Rules:** [`provision-layer-rules.md`](../../../rules/provision-layer-rules.md) (Core contracts, registration, provider boundaries and consumer tests); [`database-layer-rules.md`](../../../rules/database-layer-rules.md) (shared transaction context and no infrastructure leakage); [`code-conventions-rules.md`](../../../rules/code-conventions-rules.md) (aliases, errors and declaration order).
- **Exit:** Run Server code, architecture and types checks plus the focused PDV/MRP/Analytics integration suites when available; verify no removed factory/adapter remains, MRP action tokens expose behavior only, Billing absence/non-full access fails closed, and nested MRP calls reuse the active transaction without exposing a Drizzle executor.

#### F5-T2 — Expose Analytics and timezone REST actions with integration fixtures and route examples

- **Status/owner:** `completed` — Builder Server
- **Depends/parallel:** Depends on `F5-T1`; may run in parallel with `F6` after the stable Core/Validation contracts. Web does not edit these paths.
- **Paths:** `apps/server/src/analytics/{decorators/analytics-controller.ts,rest/controllers/get-sales-analytics.controller.ts,rest/controllers/tests/get-sales-analytics.controller.test.ts,rest/controllers/get-stock-attention.controller.ts,rest/controllers/tests/get-stock-attention.controller.test.ts,rest/controllers/index.ts,rest/dtos/**,fixtures/analytics-module-fixture.ts}`; `apps/server/rest-client/analytics/analytics.rest`; `apps/server/src/identity/rest/controllers/{change-establishment-timezone.controller.ts,tests/change-establishment-timezone.controller.test.ts,index.ts}`; `apps/server/src/identity/fixtures/identity-module-fixture.ts`; `apps/server/src/identity/rest/dtos/establishment-settings-response.dto.ts`; `apps/server/rest-client/identity/establishments.rest`; `apps/server/src/pdv/rest/controllers/{register-order.controller.ts,cancel-order.controller.ts,tests/register-order.controller.test.ts,tests/cancel-order.controller.test.ts}`; `apps/server/src/pdv/fixtures/pdv-module-fixture.ts`.
- **Contract:** `FR-01`–`FR-10`, `FR-14`; `AC-01`–`AC-09`, `AC-15`; REST, DTO, integration-fixture and error contracts.
- **Outcome:** The two Analytics reads and timezone mutation are authenticated, Manager-only, tenant-safe, serialized through DTOs and globally translated errors; PDV registration/cancellation proves persisted immutable facts and atomic MRP participation.
- **Rules:** [`rest-layer-rules.md`](../../../rules/rest-layer-rules.md) (group decorators, one controller/action, DTOs, HTTP responses, services and REST-client parity); [`controllers-testing-rules.md`](../../../rules/controllers-testing-rules.md) (real Nest/HTTP/database path, fixture lifecycle and persistence assertions); [`code-conventions-rules.md`](../../../rules/code-conventions-rules.md) (handler/type conventions).
- **Exit:** Run focused Server integration tests and Server code/architecture/types checks; verify `GET /analytics/sales?period=`, `GET /analytics/stock-attention` and `PATCH /establishments/current/timezone` with real request/response, auth, tenant, persistence and rollback evidence. Compare `apps/server/rest-client/analytics/analytics.rest` and the complete `apps/server/rest-client/identity/establishments.rest` route groups against controllers/schemas: one labeled request per route, current methods/paths/parameters/headers/bodies, reusable local variables and no credentials. Record parity in `evaluation.md`.

### F6 — Web transport, UI and routes

#### F6-T1 — Wire Web REST adapters, contexts, protected root route and Manager navigation

- **Status/owner:** `completed` — Builder Web
- **Depends/parallel:** Depends on `F1`, `F2` and `F3`; runs in parallel with `F5-T2` on disjoint Web paths.
- **Paths:** `apps/web/src/rest/services/{analytics-service.ts,identity-service.ts}`; `apps/web/src/rest/mappers/{analytics/sales-analytics-mapper.ts,analytics/stock-attention-mapper.ts,analytics/index.ts,identity/establishment-settings-mapper.ts}`; `apps/web/src/ui/shared/contexts/rest-context/{types/rest-context-value.ts,use-rest-context-provider.ts}`; `apps/web/src/routes/{index.tsx,_authenticated/index.tsx}`; `apps/web/src/constants/sidebar-items.ts`; `apps/web/src/ui/analytics/hooks/{use-sales-analytics-query.ts,use-stock-attention-query.ts}`; `apps/web/src/ui/identity/hooks/use-change-establishment-timezone-action.ts`; `apps/web/src/server/analytics/log-analytics-interaction.ts`; `apps/web/src/server/analytics/tests/log-analytics-interaction.test.ts`.
- **Contract:** `FR-01`, `FR-02`, `FR-14`, `FR-15`; `AC-01`, `AC-02`, `AC-10`, `AC-12`, `AC-15`, `AC-16`; Web REST, route, context and server-function contracts.
- **Outcome:** Browser and SSR use the existing credentialed transport, typed Analytics/Identity services and mapped dates/cents/nulls; the protected root route renders only for the authorized Manager and interaction logs remain bounded and non-persistent.
- **Rules:** [`ui-layer-rules.md`](../../../rules/ui-layer-rules.md) (feature/shared boundaries, service composition, HTTP constants and server-function boundary); [`web-app-routing-rules.md`](../../../rules/web-app-routing-rules.md) (canonical route, middleware, search and generated-tree lifecycle); [`rest-layer-rules.md`](../../../rules/rest-layer-rules.md) (web service factories and cookie transport); [`validation-package-rules.md`](../../../rules/validation-package-rules.md) (shared schema consumers); [`code-conventions-rules.md`](../../../rules/code-conventions-rules.md) (factory, hook and handler conventions).
- **Exit:** Run Web code, architecture and types checks plus the focused route/server-function tests; assert Manager/Operator/anonymous route outcomes, outgoing methods/paths/query/body and mapped response behavior. Exercise the route keyboard path and narrow viewport, inspect console and failed requests, and capture fresh root/settings route screenshots for each affected state.

#### F6-T2 — Build the Dashboard and Shop Settings widget trees, states and browser fixtures

- **Status/owner:** `completed` — Builder Web
- **Depends/parallel:** Depends on `F6-T1`; sequential within Builder Web. The complete route suite and visual evidence are required before `F7`.
- **Paths:** `apps/web/src/ui/analytics/widgets/pages/dashboard-page/**`; `apps/web/src/ui/identity/widgets/pages/shop-settings-page/{index.tsx,use-shop-settings-page.ts,tests/shop-settings-page.test.tsx,tests/use-shop-settings-page.test.ts,timezone-dialog/**}`; `apps/web/src/ui/shared/widgets/layouts/app-layout/tests/app-layout.test.tsx`; `apps/web/tests/{analytics/dashboard-page.test.ts,fixtures/analytics-module-fixture.ts,identity/shop-settings-page.test.ts,fixtures/identity-data-fixtures.ts}`; `apps/web/tests/identity/index.test.ts`.
- **Contract:** `FR-01`–`FR-03`, `FR-06`–`FR-15`; `AC-01`–`AC-17`; the complete Design Contract and manifest widget tree.
- **Outcome:** `/` contains the Manager-only period controls, KPI/margin/cancellation/evolution/table/ranking/channel/stock widgets, independent loading/error/stale/empty recovery, accepted dialogs and responsive Settings timezone management with accessible keyboard behavior.
- **Rules:** [`ui-layer-rules.md`](../../../rules/ui-layer-rules.md) (stateful/nested widget ownership, pt-BR labels, shared wrappers, focus, responsive design and **Antipatterns to Avoid**); [`web-app-routing-rules.md`](../../../rules/web-app-routing-rules.md) (protected route, route integration and failure boundaries); [`widget-testing-rules.md`](../../../rules/widget-testing-rules.md) (owning-hook tests, state/action matrix, accessible assertions and route boundaries); [`validation-package-rules.md`](../../../rules/validation-package-rules.md) (RHF/Zod consumer boundary); [`rest-layer-rules.md`](../../../rules/rest-layer-rules.md) (transport behavior through consumers); [`code-conventions-rules.md`](../../../rules/code-conventions-rules.md) (hooks, handlers and declaration order).
- **Exit:** Run focused Vitest and mocked Playwright route suites; compare the exact Spec widget tree against `design/R1X3j.png`, `design/m88n4.png`, `design/cmnYV.png` and `design/T1jMu.png`, plus every required supplemental state at its declared viewport. Exercise keyboard/focus/Escape, 390px and 320px overflow, reduced motion, independent source resolution/retry/stale behavior, console and failed-request inspection, and capture a fresh Playwright screenshot for each affected design state. Record every comparison in `evaluation.md`.

### F7 — Generated artifacts and path gate

#### F7-T1 — Generate migration, lockfile and route metadata and reconcile every contracted path

- **Status/owner:** `completed` — Orchestrator
- **Depends/parallel:** Depends on `F5-T2` and `F6-T2`; runs only after the external Billing prerequisite is available for the integrated candidate.
- **Paths:** `apps/server/src/shared/database/drizzle/migrations/0025_special_famine.sql`; `apps/server/src/shared/database/drizzle/migrations/meta/{0025_snapshot.json,_journal.json}`; `apps/web/package.json`; `pnpm-lock.yaml`; `apps/web/src/routeTree.gen.ts`.
- **Contract:** All Spec `Create`, `Modify`, `Remove` and `Generate` paths; `FR-01`–`FR-15`; `AC-01`–`AC-16`; migration, generated-file and route-tree contracts.
- **Outcome:** Generated artifacts reflect the integrated Core/Validation/Server/Web candidate; the reviewed migration backfills only deterministic commercial allocations/timezone, leaves historical cost unknown, enforces final constraints and preserves the generated journal; route metadata and lockfile are current.
- **Rules:** [`documentation/sdd.md`](../../../sdd.md) (path gate, generated ownership and evidence freshness); [`database-layer-rules.md`](../../../rules/database-layer-rules.md) (shared schema, migration generation and no direct schema copy); [`web-app-routing-rules.md`](../../../rules/web-app-routing-rules.md) (generated route tree is not hand-edited); [`tooling.md`](../../../tooling.md) (pnpm generation and migration commands).
- **Exit:** Run `pnpm --filter web generate-routes`, inspect the route diff, run `pnpm --filter server db:migration:generate --name analytics-dashboard`, record the actual generated `0025_special_famine` tag in this ledger before amendment, review/amend only the generated SQL per the Spec migration sequence, and run `pnpm check:spec-implementation -- documentation/features/analytics/dashboard-page/spec.md`. If any path is missing, unchanged, stale or misclassified, keep `F7` in progress, invalidate downstream evidence and resume the responsible Builder.

### F8 — Integrated validation, review and handoff

#### F8-T1 — Execute all integrated sensors, manual/runtime/visual scenarios and the single Implementation Reviewer

- **Status/owner:** `completed` — Orchestrator
- **Depends/parallel:** Depends on `F7-T1` passing and Billing access registration being available. Integrated sensors and the Reviewer start only after the path gate; corrections resume the responsible Builder and the same Reviewer.
- **Paths:** Complete revision-3 candidate across the Spec scope; `./evaluation.md`; transient Playwright `test-results/` artifacts.
- **Contract:** All `FR-01`–`FR-15`, `AC-01`–`AC-17`, `MV-01`–`MV-08`, Design Contract and Validation Contract.
- **Outcome:** The Orchestrator records current Core/Validation/Server/Web quality, migration application, REST parity, real authenticated persistence/authorization, all manual scenarios, every required visual comparison, privacy-safe logs and one read-only integrated review before routing to `conclude-spec`.
- **Rules:** [`sdd.md`](../../../sdd.md) (evaluation lifecycle, stale evidence, correction routing, Reviewer sequencing and handoff); [`code-conventions-rules.md`](../../../rules/code-conventions-rules.md); [`core-package-rules.md`](../../../rules/core-package-rules.md); [`use-case-testing-rules.md`](../../../rules/use-case-testing-rules.md); [`validation-package-rules.md`](../../../rules/validation-package-rules.md); [`rest-layer-rules.md`](../../../rules/rest-layer-rules.md); [`controllers-testing-rules.md`](../../../rules/controllers-testing-rules.md); [`database-layer-rules.md`](../../../rules/database-layer-rules.md); [`provision-layer-rules.md`](../../../rules/provision-layer-rules.md); [`ui-layer-rules.md`](../../../rules/ui-layer-rules.md) (including **Antipatterns to Avoid**); [`web-app-routing-rules.md`](../../../rules/web-app-routing-rules.md); [`widget-testing-rules.md`](../../../rules/widget-testing-rules.md).
- **Exit:** Apply and inspect the reviewed migration without deleting shared volumes; verify Docker health and explicit Manager/Operator fixtures; run the scheduled checks below, all `MV-*` scenarios with Playwright CLI, real request/response and persistence/authorization evidence where required, fresh screenshots at every manifest viewport/state, console/failed-request/log inspection, and exactly one read-only [`Implementation Reviewer`](../../../agents/implementation-reviewer-agent.md) over Core, Validation, Server, Database, Provision, Web, migration, REST parity and visual surfaces. Resolve every verified finding through the responsible Builder, rerun the path gate after each contracted-path correction, and route directly to [`conclude-spec`](../../../prompts/conclude-spec-prompt.md) only when the final handoff condition is true.

# Validation and handoff

The Orchestrator creates `./evaluation.md` at implementation kickoff. The rows below schedule
evidence without duplicating the scenario steps in the authoritative Spec.

| Type | Scenario/surface | Criteria | Reference | Evidence target | Status |
| --- | --- | --- | --- | --- | --- |
| Automated | Complete affected-path map | All Spec `Create`, `Modify`, `Remove`, `Generate` paths | Spec Technical Contract | `./evaluation.md` — `pnpm check:spec-implementation -- documentation/features/analytics/dashboard-page/spec.md` after F7 integration and after every contracted-path correction | `pending` |
| Automated | Test ownership and placement | All direct/indirect test paths | Tooling and test-integrity configuration | `./evaluation.md` — `pnpm check:test-integrity` | `pending` |
| Automated | Core contracts and use cases | `AC-01`–`AC-09`, `AC-15`, `AC-16` | Spec Core Technical Contract | `./evaluation.md` — Core code/architecture/types and `pnpm --filter @scoops/core test:coverage` | `pending` |
| Automated | Shared Validation package | `AC-02`, `AC-15`, `AC-16` | Spec Validation Contract | `./evaluation.md` — Validation code/architecture/types checks and consumer assertions | `pending` |
| Automated | Server persistence, provision and REST | `AC-01`–`AC-09`, `AC-15`, `AC-16` | Spec Server/Database/Provision Contracts | `./evaluation.md` — Server code/architecture/types, build, coverage and focused HTTP integration suites | `pending` |
| Automated | Web widgets, routes and server function | `AC-01`, `AC-05`–`AC-07`, `AC-10`–`AC-16` | Spec Web widget tree and UI Contract | `./evaluation.md` — Web code/architecture/types, coverage, build and mocked route integration suite | `pending` |
| REST client | Analytics route group | `AC-01`–`AC-10` | `apps/server/rest-client/analytics/analytics.rest` | `./evaluation.md` — complete `/analytics` group parity: one labeled request for each Analytics route, current method/path/query/headers/body, reusable variables and no credentials | `pending` |
| REST client | Identity establishments route group | `AC-15` | `apps/server/rest-client/identity/establishments.rest` | `./evaluation.md` — complete existing group parity plus the timezone PATCH request and shared schema comparison | `pending` |
| Runtime | Populated authenticated dashboard | `AC-01`–`AC-03`, `AC-06`–`AC-10`, `AC-12`, `AC-16`, `AC-17` | `MV-01` | `./evaluation.md` — healthy services, real Analytics requests/responses, exact reconciliation, tenant/auth results, persistence-independent current stock and sanitized logs | `pending` |
| Runtime | Immutable cost coverage and history | `AC-04`, `AC-05`, `AC-11`, `AC-12` | `MV-05` | `./evaluation.md` — real PDV registration, migrated component/allocation rows, post-cost-change unchanged history, coverage dialog and rollback evidence | `pending` |
| Runtime | Authorization, tenant isolation and Billing prerequisite | `AC-01`, `AC-10`, `AC-16` | `MV-06` | `./evaluation.md` — anonymous/Operator/cross-tenant/inactive/restricted/missing-access request results with no existence leakage | `pending` |
| Runtime | Timezone mutation and audit | `AC-02`, `AC-15` | `MV-08` | `./evaluation.md` — real PATCH response, persisted timezone, audit previous/new/actor/instant and next Analytics-boundary result | `pending` |
| Manual | `MV-01` — Populated Manager dashboard and comprehension | `AC-01`–`AC-03`, `AC-06`–`AC-10`, `AC-12`, `AC-13`, `AC-16`, `AC-17` | Spec `MV-01` | `./evaluation.md` — 1481px keyboard/URL/network/console/log/reconciliation evidence and fresh screenshot | `pending` |
| Manual | `MV-02` — 390px responsive dashboard | `AC-06`, `AC-13` | Spec `MV-02` | `./evaluation.md` — selector, order, overflow, focus, DOM reading order, network/console and fresh screenshot | `pending` |
| Manual | `MV-03` — 320px minimum layout | `AC-06`, `AC-07`, `AC-13` | Spec `MV-03` | `./evaluation.md` — margin/ranking wrapping, keyboard toggle, scroll-width measurement, network/console and fresh screenshot | `pending` |
| Manual | `MV-04` — Independent loading, stale focus and recovery | `AC-09`, `AC-10`, `AC-14`, `AC-16` | Spec `MV-04` and `design/T1jMu.png` | `./evaluation.md` — independent skeleton/status/retry/stale/reduced-motion behavior at desktop and narrow viewport, logs and screenshots | `pending` |
| Manual | `MV-05` — Missing cost and immutable history | `AC-04`, `AC-05`, `AC-11`, `AC-12` | Spec `MV-05` | `./evaluation.md` — dialog focus/links/copy/calculations, persistence and fresh 1481px/320px screenshots | `pending` |
| Manual | `MV-06` — Authorization and commercial prerequisite | `AC-01`, `AC-10`, `AC-16` | Spec `MV-06` | `./evaluation.md` — redirect/403/503 matrix, navigation absence, response/log privacy and failed-request inspection | `pending` |
| Manual | `MV-07` — Empty sales and healthy stock | `AC-11`, `AC-14` | Spec `MV-07` and `design/T1jMu.png` | `./evaluation.md` — distinct states, CTA destination, unavailable values, keyboard path and fresh state captures | `pending` |
| Manual | `MV-08` — Establishment timezone management | `AC-02`, `AC-15` | Spec `MV-08` | `./evaluation.md` — 1481px/320px settings flow, PATCH body, audit, focus return, overflow and Operator denial | `pending` |
| Visual | Populated Dashboard — 1481 × 1232 | `AC-01`–`AC-09`, `AC-12`, `AC-13` | `./design/R1X3j.png` / manifest `R1X3j` | Fresh Playwright screenshot and independent widget-tree/token/hierarchy comparison for the desktop populated state | `pending` |
| Visual | Populated Dashboard — 390 × 2222 | `AC-06`, `AC-13` | `./design/m88n4.png` / manifest `m88n4` | Fresh narrow screenshot and independent responsive/order/focus/overflow comparison | `pending` |
| Visual | Populated Dashboard — 320 × 2222 | `AC-06`, `AC-07`, `AC-13` | `./design/cmnYV.png` / manifest `cmnYV` | Fresh minimum-width screenshot and independent label wrapping/ranking-toggle/overflow comparison | `pending` |
| Visual | Dashboard state library — 1481 × 1254 | `AC-10`, `AC-11`, `AC-14` | `./design/T1jMu.png` / manifest `T1jMu` | Fresh fixture-backed state captures compared independently with the supplied state vocabulary | `pending` |
| Visual | Cost coverage dialog — 1481px | `AC-05`, `AC-12` | Manifest accepted cost-coverage assumption / `MV-05` | Fresh open-dialog screenshot with totals, links, copy, focus trap, Escape/return and scroll containment | `pending` |
| Visual | Cost coverage dialog — 320px | `AC-05`, `AC-12`, `AC-13` | Manifest accepted cost-coverage assumption / `MV-05` | Independent fresh narrow dialog screenshot with no clipping or horizontal overflow | `pending` |
| Visual | Desktop sales table disclosure — 1481px | `AC-06`, `AC-12`, `AC-13` | Manifest accepted Desktop table-action assumption / `MV-01` | Fresh open-table screenshot plus semantic table and keyboard evidence | `pending` |
| Visual | Shop Settings timezone — 1481px | `AC-15` | Manifest accepted timezone-settings assumption / `MV-08` | Fresh settings screenshot with readable Brazilian label, IANA value and dialog state | `pending` |
| Visual | Shop Settings timezone — 320px | `AC-15` | Manifest accepted timezone-settings assumption / `MV-08` | Independent fresh narrow settings/dialog screenshot with focus, announcement and no overflow | `pending` |
| Visual | Independent loading geometry — 1481px | `AC-10`, `AC-14` | Manifest accepted component-skeleton assumption / `MV-04` | Fresh sales and stock loading/mixed-resolution captures with final-shape skeletons, one status per source and reduced-motion evidence | `pending` |
| Visual | Independent loading geometry — 390px | `AC-10`, `AC-13`, `AC-14` | Manifest accepted component-skeleton assumption / `MV-04` | Independent fresh narrow loading/mixed-resolution capture with stable geometry and no overflow | `pending` |
| Visual | Sales stale/error and targeted recovery — 1481px | `AC-10`, `AC-14` | `T1jMu` state vocabulary / `MV-04` | Fresh fixture-backed screenshot of retained stale content, error/retry and recovered state | `pending` |
| Visual | Stock failure/empty and targeted recovery — 390px | `AC-09`–`AC-11`, `AC-14` | `T1jMu` state vocabulary / `MV-04`, `MV-07` | Fresh narrow fixture-backed screenshot of stock failure/healthy empty state and recovery, with no page blockage | `pending` |
| Review | Complete integrated candidate | All affected FR/AC, design, REST and validation surfaces | [`Implementation Reviewer`](../../../agents/implementation-reviewer-agent.md) | One read-only report in `./evaluation.md` after the passing path gate; every verified finding is resolved through the responsible Builder | `pending` |

Integrated validation runs in this order: prepare the reviewed migration and required healthy
services/accounts/fixtures; generate route and migration artifacts; run the complete Spec path
sensor; only after it passes, run the affected workspace sensors and activate exactly one
read-only [`Implementation Reviewer`](../../../agents/implementation-reviewer-agent.md); then
execute mocked and real Playwright coverage, compare every fresh screenshot with its exact
reference/state/viewport, inspect console and failed requests, and record current evidence.
Mocked transport proves browser/UI behavior only; real authenticated runtime and Server/Core
integration evidence prove persistence, authorization, Billing fail-closed behavior, stock
isolation and transaction outcomes.

The final handoff condition is: all tasks and phases are `completed`; Spec revision `3` and its
validation commands are current on the integrated candidate; generated migration, snapshot,
journal, lockfile and route tree are reviewed; services, Manager/Operator accounts and fixtures
are ready; every `MV-01`–`MV-08` is executable; transient evidence identifiers are recorded; the
final Spec tree/conformance comparison passes; all additional-screenshot decisions are resolved;
the latest `pnpm check:spec-implementation -- documentation/features/analytics/dashboard-page/spec.md`
run passed after the last contracted-path correction; both affected REST-client artifacts are
present and route-complete; the Implementation Reviewer completed; every verified review finding
is resolved with no blocking finding active; and every affected workspace coverage command passed
without lowering its configured floor. Then route directly to
[`conclude-spec`](../../../prompts/conclude-spec-prompt.md).
