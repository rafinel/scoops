---
title: Sales channel management — implementation plan
status: completed
spec: ./spec.md
spec_revision: 1
evaluation: ./evaluation.md
github_issue: https://github.com/rafinel/scoops/issues/21
updated_at: 2026-08-25
---

# Sales channel management — implementation plan

## Execution status

- **Spec:** [`./spec.md`](./spec.md), revision `1`, status `in_progress`.
- **Plan rationale:** Plan-backed execution is required because the delivery crosses Core, Validation, transactional persistence and migration generation, REST composition, protected Web routing, design-backed UI, concurrent uniqueness, tenant authorization and real full-stack validation.
- **Current phase:** F6 completed — integrated conformance and handoff, including URL-synchronized adjustment filters.
- **Next action:** Route directly to `conclude-spec`.
- **Active blockers:** None. All acceptance, runtime, visual and review evidence is current; the transient full-route session failure is isolated and resolved in Evaluation.
- **Active Builders:** No implementation Builder is active. F1 Core through F5 Web are completed and verified; Orchestrator owns F6.
- **Shared/generated ownership:** `Builder Server` owns the PDV model/schema change and generated migration artifacts, with Orchestrator review of the shared schema barrel, migration journal and central seed wiring. `Builder Web` owns REST-context composition and route generation coordination; `apps/web/src/routeTree.gen.ts` is generated only by `pnpm --filter web generate-routes`. The Orchestrator owns package/lockfile changes, unexpected root/shared-file conflicts and final integration.

## Execution ledger

| Wave | Builder | Phase | Name | Depends on | Parallel with | Status | Exit condition |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | `Builder Core` | F1 | Core contracts and use cases | — | — | `completed` | Core domain, ports, seven use cases and one test file per use case pass Core code, type and unit sensors. |
| 2 | `Builder Validation` | F2 | Shared runtime validation | F1 | F3 | `completed` | Shared status, transport and Web-form schemas are exported and Validation code/type sensors pass. |
| 2 | `Builder Server` | F3 | Transactional persistence and migration | F1 | F2 | `completed` | Tenant-scoped Drizzle models, constraints, repository, seeder and reviewed generated migration are ready for REST consumption. |
| 3 | `Builder Server` | F4 | REST operations and server integration | F1, F2, F3 | F5 | `completed` | All seven HTTP actions are composed and real controller tests prove response, authorization, persistence, tenant isolation and race behavior. |
| 3 | `Builder Web` | F5 | Protected Web experience and browser contract | F1, F2 | F4 | `completed` | Route, service, hooks, widgets and browser suite satisfy the Spec tree, responsive/accessibility states and mocked UI-to-REST contract. |
| 4 | `Orchestrator` | F6 | Integrated conformance and handoff | F4, F5 | — | `completed` | Integrated sensors, real runtime scenarios, visual comparisons and exactly one Integrated Reviewer are current with no blocking finding. |

### F1 — Core contracts and use cases

#### F1-T1 — Freeze sales-channel domain structures and application ports

- **Status/owner:** `completed` — Builder Core (`builder_core`); correction verified by `EV-F1-04`
- **Depends/parallel:** No dependency; F1-T2 waits for these domain and interface contracts.
- **Paths:** `packages/core/src/pdv/domain/entities/sales-channel.ts`; `packages/core/src/pdv/domain/entities/fakers/sales-channel-faker.ts`; `packages/core/src/pdv/domain/entities/fakers/index.ts`; `packages/core/src/pdv/domain/entities/index.ts`; `packages/core/src/pdv/domain/structures/sales-channel-create.ts`; `packages/core/src/pdv/domain/structures/sales-channel-update.ts`; `packages/core/src/pdv/domain/structures/sales-channel-actor.ts`; `packages/core/src/pdv/domain/structures/index.ts`; `packages/core/src/pdv/interfaces/sales-channels-repository.ts`; `packages/core/src/pdv/interfaces/pdv-service.ts`; `packages/core/src/pdv/interfaces/index.ts`.
- **Contract:** `RF-01`–`RF-07`; `CA-01`–`CA-07`, `CA-09`; Technical Contract Core domain, repository and `PdvService` interfaces.
- **Outcome:** Core publishes identity-free create/update structures, trusted actor projection, valid faker, normalized tenant-qualified repository capabilities, active-list semantics and the browser-facing `PdvService` contract without framework or transport implementation.
- **Rules:** [`documentation/rules/code-conventions-rules.md`](../../../rules/code-conventions-rules.md) (naming, declarations, files and barrels); [`documentation/rules/core-package-rules.md`](../../../rules/core-package-rules.md) (one exported type per file, fakers, entity identity and interface ownership); [`documentation/rules/database-layer-rules.md`](../../../rules/database-layer-rules.md) (repository vocabulary and persistence-contract direction); [`documentation/rules/rest-layer-rules.md`](../../../rules/rest-layer-rules.md) (core service contract and `RestResponse`).
- **Exit:** Run `pnpm exec biome check packages/core/src/pdv/domain packages/core/src/pdv/interfaces`, `pnpm --filter @scoops/core check:types`, and inspect every public export/signature against the Spec schemas, actor restrictions, exact percentage representation and no-status-update contract.

#### F1-T2 — Implement sales-channel use cases and unit coverage

- **Status/owner:** `completed` — Builder Core (`builder_core`); use-case exits verified by `EV-F1-01`–`EV-F1-04`
- **Depends/parallel:** Depends on F1-T1; no safe parallel work within the Core ownership boundary because all actions consume the frozen ports.
- **Paths:** `packages/core/src/pdv/use-cases/create-sales-channel-use-case.ts`; `list-sales-channels-use-case.ts`; `list-active-sales-channels-use-case.ts`; `update-sales-channel-use-case.ts`; `inactivate-sales-channel-use-case.ts`; `reactivate-sales-channel-use-case.ts`; `delete-sales-channel-use-case.ts`; `packages/core/src/pdv/use-cases/index.ts`; `packages/core/src/pdv/use-cases/tests/create-sales-channel-use-case.test.ts`; `list-sales-channels-use-case.test.ts`; `list-active-sales-channels-use-case.test.ts`; `update-sales-channel-use-case.test.ts`; `inactivate-sales-channel-use-case.test.ts`; `reactivate-sales-channel-use-case.test.ts`; `delete-sales-channel-use-case.test.ts`.
- **Contract:** `RF-01`–`RF-07`; `CA-01`–`CA-07`, `CA-09`; Technical Contract use-case signatures, role/tenant checks, lifecycle actions, normalization and no event publication.
- **Outcome:** Seven verb-led use cases enforce Manager versus Operator access, establishment scope, name/percentage bounds, duplicate conflict handling, alphabetical/active reads, idempotent lifecycle transitions and snapshot-independent deletion using typed repository mocks.
- **Rules:** [`documentation/rules/code-conventions-rules.md`](../../../rules/code-conventions-rules.md) (application errors, class-owned helpers and declaration order); [`documentation/rules/core-package-rules.md`](../../../rules/core-package-rules.md) (business rules belong in use cases); [`documentation/rules/use-case-testing-rules.md`](../../../rules/use-case-testing-rules.md) (one test file per use case, typed mocks, fakers and infrastructure-free tests).
- **Exit:** Run `pnpm --filter @scoops/core check:code`, `pnpm --filter @scoops/core check:types` and `pnpm --filter @scoops/core test`; inspect successful results and repository calls for role, tenant, bounds, conflict, active filtering, lifecycle and deletion behavior.

### F2 — Shared runtime validation

#### F2-T1 — Add PDV status, transport and Web-form schemas

- **Status/owner:** `completed` — Builder Validation (`builder_validation`); exits verified by `EV-F2-01`–`EV-F2-03`
- **Depends/parallel:** Depends on F1; safe in parallel with F3. Reconcile Core status exports before finalizing the root barrel.
- **Paths:** `packages/validation/src/pdv/sales-channel-status-schema.ts`; `packages/validation/src/pdv/save-channel-schema.ts`; `packages/validation/src/web/sales-channel-form-schema.ts`; `packages/validation/src/index.ts`.
- **Contract:** `RF-01`, `RF-02`, `RF-08`; `CA-02`, `CA-03`, `CA-08`; Technical Contract Validation schema fields, localized decimal parsing, explicit create status and update status omission.
- **Outcome:** Reusable Zod schemas provide shared REST/form syntax feedback for trimmed names, finite exact-scale bounded percentages and Core-derived statuses without encoding authorization, tenant ownership or persistence uniqueness.
- **Rules:** [`documentation/rules/code-conventions-rules.md`](../../../rules/code-conventions-rules.md) (file naming and exports); [`documentation/rules/validation-package-rules.md`](../../../rules/validation-package-rules.md) (schema ownership, one primary schema per file, Core enum derivation, consumer boundaries and root exports).
- **Exit:** Run `pnpm --filter @scoops/validation check:code` and `pnpm --filter @scoops/validation check:types`; inspect root exports and valid/boundary/malformed name, percentage, status and create/update cases, leaving duplicate and tenant decisions to Core/server.

### F3 — Transactional persistence and migration

#### F3-T1 — Define PDV persistence models and generate the migration

- **Status/owner:** `completed` — Builder Server (`builder_server`); exits verified by `EV-F3-01`–`EV-F3-04`
- **Depends/parallel:** Depends on F1; safe in parallel with F2. F3-T2 waits for the model, mapper and generated schema contract.
- **Paths:** `apps/server/src/pdv/database/drizzle/models/sales-channel-status-model.ts`; `sales-channel-model.ts`; `apps/server/src/pdv/database/drizzle/types/entities/sales-channel.ts`; `apps/server/src/pdv/database/drizzle/mappers/drizzle-sales-channel-mapper.ts`; declaration `index.ts` barrels in the affected model/type/mapper directories; `apps/server/src/shared/database/drizzle/schema.ts`; generated `apps/server/src/shared/database/drizzle/migrations/0013_sales_channel_management.sql`; generated `apps/server/src/shared/database/drizzle/migrations/meta/0013_snapshot.json`; generated `apps/server/src/shared/database/drizzle/migrations/meta/_journal.json`.
- **Contract:** `RF-01`, `RF-03`–`RF-07`; `CA-01`–`CA-07`, `CA-09`; Technical Contract `pdv_sales_channels` model, normalized unique index, status/name/percentage constraints and no snapshot FK/cascade.
- **Outcome:** PDV owns the enum/table declarations, Drizzle row type and mapper; PostgreSQL persists `numeric(5,2)`, enforces race-safe normalized uniqueness and bounds, indexes tenant/status/name ordering and remains independent from historical snapshots.
- **Rules:** [`documentation/rules/code-conventions-rules.md`](../../../rules/code-conventions-rules.md) (naming and barrels); [`documentation/rules/database-layer-rules.md`](../../../rules/database-layer-rules.md) (module-owned models/types/mappers and generated migrations); [`documentation/architecture.md`](../../../architecture.md) (tenant isolation, persistence authority and history preservation).
- **Exit:** Run `pnpm --filter server exec drizzle-kit generate --config drizzle.config.ts --name sales_channel_management`; review the generated SQL, snapshot and journal for additive transactional ordering, exact constraints/indexes, prior journal preservation, no default seed and no order/snapshot foreign key; run focused Biome checks on the model/type/mapper paths.

#### F3-T2 — Implement the repository, database binding and PDV seeder

- **Status/owner:** `completed` — Builder Server (`builder_server`); exits verified by `EV-F3-01`–`EV-F3-05`
- **Depends/parallel:** Depends on F3-T1 and F1-T1; safe in parallel with F2. F4 waits for repository tokens, transaction scope and seeder exports.
- **Paths:** `apps/server/src/pdv/database/drizzle/repositories/drizzle-sales-channels-repository.ts`; `apps/server/src/pdv/database/drizzle/repositories/drizzle-pdv-database.ts`; `apps/server/src/pdv/database/pdv-database.module.ts`; `apps/server/src/pdv/database/pdv-seeder.ts`; required PDV database/repository barrels and `apps/server/src/pdv/constants/pdv-repositories.ts` bindings.
- **Contract:** `RF-01`, `RF-03`–`RF-07`; `CA-01`, `CA-04`, `CA-06`, `CA-07`, `CA-09`; Technical Contract repository semantics, transaction scope/token binding and seed reset.
- **Outcome:** The Drizzle adapter maps exact numeric values, qualifies every read/write by establishment, supports normalized lookup, sorted/active reads, replace/remove/removeAll and binds the repository through Symbol tokens; the seeder clears channels and inserts no default.
- **Rules:** [`documentation/rules/code-conventions-rules.md`](../../../rules/code-conventions-rules.md) (known application errors and class helpers); [`documentation/rules/database-layer-rules.md`](../../../rules/database-layer-rules.md) (repository vocabulary, mapper boundary, Symbol tokens, `useExisting`, seeder contract and no repository tests).
- **Exit:** Run focused Biome checks on PDV database paths; inspect all predicates, ordering, numeric conversion, integrity-error translation, transaction usage, module exports and seeder contract wiring. Defer real persistence proof to F4-T2.

### F4 — REST operations and server integration

#### F4-T1 — Implement seven PDV REST actions and route documentation

- **Status/owner:** `completed` — Builder Server (`builder_server`); verified by `EV-F4-01`–`EV-F4-04`
- **Depends/parallel:** Depends on F2 and F3-T2; safe in parallel with F5 after the Core/Validation contracts are stable. F4-T2 and F4-T3 consume the controller/export contract.
- **Paths:** `apps/server/src/pdv/decorators/sales-channels-controller.ts`; `apps/server/src/pdv/rest/dtos/sales-channel-response.dto.ts`; `apps/server/src/pdv/rest/controllers/create-sales-channel.controller.ts`; `list-sales-channels.controller.ts`; `list-active-sales-channels.controller.ts`; `update-sales-channel.controller.ts`; `inactivate-sales-channel.controller.ts`; `reactivate-sales-channel.controller.ts`; `delete-sales-channel.controller.ts`; `apps/server/src/pdv/rest/controllers/index.ts`.
- **Contract:** `RF-01`–`RF-07`; `CA-01`–`CA-07`, `CA-09`; Technical Contract controller routes, semantic `:salesChannelId`, shared Zod pipes, typed responses and HTTP status/error mapping.
- **Outcome:** Each REST class receives HTTP input, derives its use-case request, executes one use case and documents success plus expected `401/403/404/409/422` errors; Manager mutations/list and Manager+Operator active read expose the exact seven operations and REST examples.
- **Rules:** [`documentation/rules/code-conventions-rules.md`](../../../rules/code-conventions-rules.md) (naming, errors and aliases); [`documentation/rules/rest-layer-rules.md`](../../../rules/rest-layer-rules.md) (route decorator, one action/controller, constructor use-case wiring, semantic params, body derivation, Swagger and `.rest` coverage); [`documentation/rules/validation-package-rules.md`](../../../rules/validation-package-rules.md) (shared schema consumption); [`documentation/rules/database-layer-rules.md`](../../../rules/database-layer-rules.md) (interface-token injection).
- **Exit:** Run focused Biome checks on PDV REST paths and inspect every method/path/body/status/DTO mapping against the Contract; do not treat controller compilation or mocked transport as persistence/authorization evidence.

#### F4-T2 — Build real PDV fixtures and controller integration suites

- **Status/owner:** `completed` — Builder Server (`builder_server`); verified by `EV-F4-01`–`EV-F4-04`
- **Depends/parallel:** Depends on F4-T1 and F3; safe in parallel with F4-T3 because fixture/test paths do not overlap composition paths.
- **Paths:** `apps/server/src/pdv/fixtures/pdv-module-fixture.ts`; `apps/server/src/pdv/rest/controllers/tests/create-sales-channel.controller.test.ts`; `list-sales-channels.controller.test.ts`; `list-active-sales-channels.controller.test.ts`; `update-sales-channel.controller.test.ts`; `inactivate-sales-channel.controller.test.ts`; `reactivate-sales-channel.controller.test.ts`; `delete-sales-channel.controller.test.ts`.
- **Contract:** `RF-01`–`RF-07`; `CA-01`–`CA-07`, `CA-09`; Validation Contract server integration matrix.
- **Outcome:** Real Nest/Supertest/Drizzle tests exercise every action’s HTTP response and persisted effect, Manager/Operator/anonymous access, foreign-tenant concealment, normalized uniqueness race, numeric/name constraints and snapshot independence through the shared fixture lifecycle.
- **Rules:** [`documentation/rules/code-conventions-rules.md`](../../../rules/code-conventions-rules.md) (aliases and naming); [`documentation/rules/controllers-testing-rules.md`](../../../rules/controllers-testing-rules.md) (real route wiring, fixture lifecycle, isolation and persistence assertions); [`documentation/rules/rest-layer-rules.md`](../../../rules/rest-layer-rules.md) (route contract); [`documentation/rules/database-layer-rules.md`](../../../rules/database-layer-rules.md) (indirect database validation and no repository tests).
- **Exit:** With the project-approved Docker PostgreSQL runtime available, run `pnpm --filter server test -- src/pdv/rest/controllers/tests` and then `pnpm --filter server test`; record real request/response, authorization and persistence evidence, including one-success/one-conflict same-tenant race and same-name different-tenant success.

#### F4-T3 — Complete PDV module composition and central seed wiring

- **Status/owner:** `completed` — Builder Server (`builder_server`); verified by `EV-F4-01`–`EV-F4-04`
- **Depends/parallel:** Depends on F3-T2 and F4-T1; safe in parallel with F4-T2. Orchestrator reviews the shared central seed and generated-file diff during integration.
- **Paths:** `apps/server/src/pdv/pdv.module.ts`; `apps/server/src/shared/database/seed.ts`; `apps/server/rest-client/pdv/sales-channels.rest` if not completed by F4-T1.
- **Contract:** `RF-01`, `RF-03`–`RF-07`; `CA-01`, `CA-04`, `CA-06`, `CA-07`, `CA-09`; Technical Contract composition and seed ordering.
- **Outcome:** `PdvModule` registers database providers and all controllers, central seed clears/runs PDV in dependency order and REST examples remain synchronized without adding events, order coupling or default channels.
- **Rules:** [`documentation/rules/code-conventions-rules.md`](../../../rules/code-conventions-rules.md) (composition naming); [`documentation/rules/database-layer-rules.md`](../../../rules/database-layer-rules.md) (module seeder and central orchestration); [`documentation/rules/rest-layer-rules.md`](../../../rules/rest-layer-rules.md) (complete route-group examples); [`documentation/architecture.md`](../../../architecture.md) (root composition and module ownership).
- **Exit:** Run `pnpm --filter server check:code`, `pnpm --filter server check:types` and `pnpm --filter server build`; inspect provider reuse, controller registration, seed mode/order guards and no cross-module model/repository imports.

### F5 — Protected Web experience and browser contract

#### F5-T1 — Compose PDV REST service, query/action hooks and protected route

- **Status/owner:** `completed` — Builder Web (`builder_web`); exits verified by `EV-F5-01`–`EV-F5-04`, `EV-F5-09`
- **Depends/parallel:** Depends on F1 and F2; safe in parallel with F4. F5-T2/F5-T3 consume the frozen service and hook contracts; generated route metadata remains Orchestrator-reviewed.
- **Paths:** `apps/web/src/rest/services/pdv-service.ts`; `apps/web/src/ui/pdv/hooks/sales-channel-query-keys.ts`; `use-sales-channels-query.ts`; `use-active-sales-channels-query.ts`; create/update/inactivate/reactivate/delete action hook files; `apps/web/src/ui/shared/contexts/rest-context/**`; `apps/web/src/ui/shared/widgets/layouts/app-layout/tests/app-layout.test.tsx`; `apps/web/src/routes/_authenticated/sales-channels/index.tsx`; `apps/web/src/constants/sidebar-items.ts`; generated `apps/web/src/routeTree.gen.ts`.
- **Contract:** `RF-06`, `RF-07`, `RF-09`; `CA-05`, `CA-07`, `CA-10`; Technical Contract `PdvService` mappings, Manager middleware, Manager-only navigation and active-read composition.
- **Outcome:** The Web adapter maps all seven HTTP operations through the shared Bearer transport, successful mutations invalidate management/active keys, the route is client-rendered under authenticated Manager authorization, and Operators have neither nav visibility nor management access while retaining active reads.
- **Rules:** [`documentation/rules/code-conventions-rules.md`](../../../rules/code-conventions-rules.md) (factories, naming and declaration order); [`documentation/rules/ui-layer-rules.md`](../../../rules/ui-layer-rules.md) (feature boundaries, query/action hooks, REST context and shared wrappers); [`documentation/rules/web-app-routing-rules.md`](../../../rules/web-app-routing-rules.md) (canonical route, middleware, thin route and generated tree); [`documentation/rules/rest-layer-rules.md`](../../../rules/rest-layer-rules.md) (service factory, exact mapping and session-header ownership).
- **Exit:** Run `pnpm --filter web generate-routes`, `pnpm --filter web check:code` and `pnpm --filter web check:types`; inspect the generated tree, Manager/Operator route contract, exact service paths/bodies and no browser secret/auth-header assembly outside Axios transport.

#### F5-T2 — Implement the page, list and recoverable list states

- **Status/owner:** `completed` — Builder Web (`builder_web`); URL correction verified by `EV-F5-17`–`EV-F5-21`
- **Depends/parallel:** Depends on F5-T1; safe in parallel with F5-T3 because page/list paths are disjoint from dialog paths.
- **Paths:** `apps/web/src/ui/pdv/widgets/pages/sales-channels-page/index.tsx`; `use-sales-channels-page.ts`; `tests/sales-channels-page.test.tsx`; `tests/use-sales-channels-page.test.ts`; page-local `sales-channels-loading/index.tsx`; `sales-channels-error/index.tsx`; `sales-channels-empty-state/index.tsx`; `sales-channels-list/index.tsx`; required colocated list/loading/error/empty tests under their widget directories.
- **Contract:** `RF-05`, `RF-08`, `RF-09`; `CA-05`, `CA-08`, `CA-10`; Design Contract `VIS-01`, `VIS-07`, `VIS-08` and Spec widget tree.
- **Outcome:** `SalesChannelsPage` owns orchestration and composes explicit loading, error/retry, empty, populated list and action boundaries; the Manager desktop table and 768×1024 stacked cards show name, exact adjustment/type, status and actions with accessible non-color semantics.
- **Rules:** [`documentation/rules/code-conventions-rules.md`](../../../rules/code-conventions-rules.md) (handlers, declaration order and names); [`documentation/rules/ui-layer-rules.md`](../../../rules/ui-layer-rules.md) (widget directories/hooks, nested widgets, shadcn/shared wrappers, focus and design tokens); [`documentation/rules/widget-testing-rules.md`](../../../rules/widget-testing-rules.md) (owning-boundary tests, state matrix, accessible queries and hook mocks); [`documentation/design.md`](../../../design.md) (tokens, table/card hierarchy, responsive and accessibility behavior).
- **Exit:** Run focused Web unit checks and use the Playwright CLI at `1481×1050` and `768×1024` to compare the exact Spec widget tree and `VIS-01`/`VIS-07`/each required `VIS-08` state, exercise keyboard/focus and narrow overflow, inspect console and failed requests, and save a fresh screenshot for every affected state.

#### F5-T3 — Implement channel form, lifecycle and deletion dialogs

- **Status/owner:** `completed` — Builder Web (`builder_web`); exits verified by `EV-F5-01`–`EV-F5-04`, `EV-F5-09`
- **Depends/parallel:** Depends on F5-T1; safe in parallel with F5-T2. The page integration and route flow consume the explicit dialog callbacks.
- **Paths:** `apps/web/src/ui/pdv/widgets/pages/sales-channels-page/sales-channel-dialog/{index.tsx,use-sales-channel-dialog.ts}`; `change-sales-channel-status-dialog/{index.tsx,use-change-sales-channel-status-dialog.ts}`; `delete-sales-channel-dialog/{index.tsx,use-delete-sales-channel-dialog.ts}`; each behavior-owning widget’s `tests/` files.
- **Contract:** `RF-01`–`RF-04`, `RF-08`; `CA-01`–`CA-04`, `CA-06`, `CA-08`; Design Contract `VIS-02`–`VIS-06`, `VIS-09` and accepted dialog/state assumptions.
- **Outcome:** Create/edit use RHF plus shared schemas with live exact preview, explicit status, recoverable validation/server failures and duplicate-submit guards; inactivation/delete confirm history preservation while reactivation is direct and all dialogs preserve focus and accessible feedback.
- **Rules:** [`documentation/rules/code-conventions-rules.md`](../../../rules/code-conventions-rules.md) (handler declarations and value-before-handler order); [`documentation/rules/ui-layer-rules.md`](../../../rules/ui-layer-rules.md) (behavior-owning hooks, shared form/dialog primitives, focus rings, dialog header hierarchy, icons and design tokens); [`documentation/rules/widget-testing-rules.md`](../../../rules/widget-testing-rules.md) (component/hook boundary, pending/error/success matrix and accessible interaction assertions); [`documentation/rules/validation-package-rules.md`](../../../rules/validation-package-rules.md) (RHF `zodResolver` and shared form schema).
- **Exit:** Run focused Web unit tests and use the Playwright CLI to compare the exact Spec widget tree at the supplied dialog dimensions (`VIS-02`–`VIS-06`) plus accepted `VIS-09` desktop/narrow states; exercise keyboard open/cancel/confirm/Escape/focus return, invalid/pending/failure/success states, console and failed-request inspection, and save fresh screenshots per state.

#### F5-T4 — Add stateful mocked browser route coverage

- **Status/owner:** `completed` — Builder Web (`builder_web`); filter URL scenarios verified by `EV-F5-21`
- **Depends/parallel:** Depends on F5-T1–F5-T3; no parallel work because this suite is the integrated Web boundary for all page and dialog behavior.
- **Paths:** `apps/web/tests/fixtures/pdv-module-fixture.ts`; `apps/web/tests/playwright.ts`; `apps/web/tests/routes/pdv/sales-channels.index.test.ts`.
- **Contract:** `RF-01`–`RF-09`; `CA-01`–`CA-08`, `CA-10`; Validation Contract `MV-01`, `MV-02` and browser matrix.
- **Outcome:** The shared Playwright factory and stateful PDV fixture prove anonymous/unauthorized/Manager access, exact REST method/path/body/response handling, list/empty/loading/error/retry, every mutation/status action, duplicate-submit prevention, keyboard paths, narrow cards and final canonical URL using mocked transport only.
- **Rules:** [`documentation/rules/web-app-routing-rules.md`](../../../rules/web-app-routing-rules.md) (route matrix, mocked transport boundary, response-plus-visible-outcome assertions, Playwright CLI and responsive/accessibility coverage); [`documentation/rules/widget-testing-rules.md`](../../../rules/widget-testing-rules.md) (shared fixture, accessible behavior and route/widget boundary); [`documentation/rules/ui-layer-rules.md`](../../../rules/ui-layer-rules.md) (shared wrappers and visible recovery feedback); [`documentation/tooling.md`](../../../tooling.md) (Playwright CLI and ephemeral screenshot output).
- **Exit:** Run `pnpm --filter web test:integration tests/routes/pdv/sales-channels.index.test.ts`; inspect final URL, every relevant request/response and visible result, focus/keyboard/narrow states, console messages and failed requests, and save fresh screenshots for each mapped `VIS-01`–`VIS-09` state without presenting mocked transport as server evidence.

### F6 — Integrated conformance and handoff

#### F6-T1 — Integrate, review, validate and route to conclusion

- **Status/owner:** `completed` — Orchestrator; exits verified by `EV-F6-01`–`EV-F6-03`
- **Depends/parallel:** Depends on all Builder diffs from F1–F5 being integrated; activate exactly one read-only [`Integrated Reviewer`](../../../agents/reviewer-agent.md) after integration and before readiness. The Reviewer may run alongside integrated sensors, but no per-Builder or per-phase Reviewer is created.
- **Paths:** Integrated candidate; `./evaluation.md`; `./plan.md` status/ledger; generated migration and route artifacts; `apps/server/src/shared/database/seed.ts` and other shared composition changes under Orchestrator review.
- **Contract:** All `RF-01`–`RF-09` and `CA-01`–`CA-10`; Validation Contract commands, `MV-01`, `MV-02`, `VIS-01`–`VIS-09` and final handoff condition.
- **Outcome:** The complete candidate is checked for cross-Builder contracts, exact Spec widget tree/conformance, tenant/security/history invariants, generated artifacts, real server persistence/authorization and current UI evidence before conclusion.
- **Rules:** [`documentation/rules/sdd-rules.md`](../../../rules/sdd-rules.md) (Plan lifecycle, evidence authority, integrated Reviewer and conclusion routing); [`documentation/architecture.md`](../../../architecture.md) (module boundaries, tenant authority, persistence/history and browser/server separation); [`documentation/tooling.md`](../../../tooling.md) (workspace sensors, Docker prerequisites, services and Playwright CLI); all selected layer Rules listed in the Spec’s Rule Pack.
- **Exit:** Run the current Spec commands: Core code/types/tests; Validation code/types; Drizzle migration generation review; Server code/types/tests/build; Web route generation/code/types/tests; focused mocked Playwright route suite. Start required services, verify health/accounts/fixtures, execute real `MV-01`/`MV-02` with request/response, persisted-state, console and failed-request evidence, compare every supplied reference and supplemental state at its exact viewport with fresh screenshots, verify every Reviewer finding, and route directly to `conclude-spec` only when all tasks/phases are complete and no blocking finding remains.

## Validation and handoff

| Type | Scenario/surface | Criteria | Reference | Evidence target | Status |
| --- | --- | --- | --- | --- | --- |
| Runtime | Core use cases and typed ports | `CA-01`–`CA-07`, `CA-09` | Spec Core Contract | `./evaluation.md` | `passed` |
| Runtime | Real REST/database/auth integration | `CA-01`–`CA-07`, `CA-09` | Spec Server Integration Contract | `./evaluation.md` | `passed` |
| Runtime | Web service/context/query-action composition | `CA-01`–`CA-08`, `CA-10` | Spec Web Technical Contract | `./evaluation.md` | `passed` |
| Browser | Manager desktop lifecycle and Operator access | `CA-01`–`CA-08`, `CA-10` | Spec `MV-01` | `./evaluation.md` | `passed` |
| Browser | Narrow states and recovery | `CA-05`, `CA-08`, `CA-10` | Spec `MV-02` | `./evaluation.md` | `passed` |
| Browser | Adjustment filters at desktop and narrow viewports | `CA-05`, `CA-08`, `CA-10` | User-requested filter behavior | `EV-F5-11`, `EV-F5-12`, `VIS-11a`, `VIS-11b` | `passed` |
| Browser | URL-synchronized adjustment filters and malformed-value fallback | `CA-05`, `CA-08`, `CA-10` | User-requested URL behavior | `EV-F5-17`–`EV-F5-21` | `passed` |
| Visual | Populated Manager list — 1481×1050 | `CA-05`, `CA-10` | `./design/sales-channels-page.png` (`VIS-01`) | Playwright `test-results` artifact | `passed` |
| Visual | Create dialog — 520×447 component viewport | `CA-01`, `CA-02`, `CA-08` | `./design/create-channel-dialog.png` (`VIS-02`) | Playwright `test-results` artifact | `passed` |
| Visual | Edit channel dialog — 520×447 component viewport | `CA-03`, `CA-04`, `CA-08` | `./design/edit-channel-dialog.png` (`VIS-03`) | Playwright `test-results` artifact | `passed` |
| Visual | Active action menu — 232×168 component viewport | `CA-03`, `CA-04`, `CA-06` | `./design/channel-actions-menu.png` (`VIS-04`) | Playwright `test-results` artifact | `passed` |
| Visual | Inactivation confirmation — 440×196 component viewport | `CA-04`, `CA-08` | `./design/deactivate-channel-dialog.png` (`VIS-05`) | Playwright `test-results` artifact | `passed` |
| Visual | Delete confirmation — 440×196 component viewport | `CA-06`, `CA-08` | `./design/delete-channel-dialog.png` (`VIS-06`) | Playwright `test-results` artifact | `passed` |
| Visual | Populated narrow cards and open menu — 768×1024 | `CA-05`, `CA-10` | `design/manifest.md` supplemental decision (`VIS-07`) | Playwright `test-results` artifact | `passed` |
| Visual | Empty list — 1481×1050 | `CA-05`, `CA-08` | `design/manifest.md` supplemental decision (`VIS-08`) | Playwright `test-results` artifact | `passed` |
| Visual | Empty list — 768×1024 | `CA-05`, `CA-08` | `design/manifest.md` supplemental decision (`VIS-08`) | Playwright `test-results` artifact | `passed` |
| Visual | Loading list — 1481×1050 | `CA-05`, `CA-08` | `design/manifest.md` supplemental decision (`VIS-08`) | Playwright `test-results` artifact | `passed` |
| Visual | Loading list — 768×1024 | `CA-05`, `CA-08` | `design/manifest.md` supplemental decision (`VIS-08`) | Playwright `test-results` artifact | `passed` |
| Visual | Retryable list error — 1481×1050 | `CA-05`, `CA-08` | `design/manifest.md` supplemental decision (`VIS-08`) | Playwright `test-results` artifact | `passed` |
| Visual | Retryable list error — 768×1024 | `CA-05`, `CA-08` | `design/manifest.md` supplemental decision (`VIS-08`) | Playwright `test-results` artifact | `passed` |
| Visual | Inactive row and direct Reactivate action — 1481×1050 | `CA-04` | `design/manifest.md` supplemental decision (`VIS-09`) | Playwright `test-results` artifact | `passed` |
| Visual | Inactive row and direct Reactivate action — 768×1024 | `CA-04` | `design/manifest.md` supplemental decision (`VIS-09`) | Playwright `test-results` artifact | `passed` |
| Review | Complete integrated candidate, cross-Builder contracts and affected UI/server surfaces | All `RF-*`, `CA-*`, `MV-*`, `VIS-*` | [`Integrated Reviewer`](../../../agents/reviewer-agent.md) | Reviewer report verified in `./evaluation.md`; no blocking findings | `passed` |

Final handoff requires all tasks and phases completed; current revision-1 Spec commands passing on the integrated candidate; generated migration, journal and route artifacts reviewed; services, Manager/Operator accounts and fixtures ready; every `MV-*` executable; each supplied reference and supplemental visual state independently compared at its declared viewport with fresh transient artifact identifiers; the exact Spec widget tree and conformance comparison passed; the single Integrated Reviewer completed; every verified finding resolved; and no blocking finding active. Then route directly to `conclude-spec`.
