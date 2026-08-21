---
title: MRP product details Stock tab — implementation plan
status: completed
spec: ./spec.md
spec_revision: 6
evaluation: ./evaluation.md
github_issue: https://github.com/rafinel/scoops/issues/11
updated_at: 2026-08-18
---

# MRP product details Stock tab — implementation plan

## Execution status

- **Spec:** [`./spec.md`](./spec.md), revision `6`, status `in_progress`.
- **Plan rationale:** Plan-backed execution is required because the Contract crosses Core, Validation, transactional persistence and migration generation, REST composition, generated routing, design-backed UI, concurrency/security checks and real full-stack validation.
- **Current phase:** Complete — revision-6 implementation and evidence are ready for conclusion.
- **Next action:** Route the ready Spec and Evaluation through `conclude-spec` for publication/closure when authorized.
- **Active blockers:** None.
- **Shared/generated ownership:** Builder F3-T1 alone owns the generated Drizzle SQL, snapshot and journal; Builder F5-T1 alone owns generated `apps/web/src/routeTree.gen.ts`; F2-T2 alone owns the Validation root barrel; F4-T1 alone owns REST barrels; and F4-T3 alone owns server module wiring. The Orchestrator owns any unexpected package/lockfile coordination and must complete it before parallel application work; no dependency change is currently planned. F1's Core exports are frozen before downstream lanes begin.

## Execution ledger

| Wave | Lane | Phase | Name | Depends on | Parallel with | Status | Exit condition |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | MRP contracts | F1 | Core contracts and use cases | — | — | `completed` | Core code, type and use-case tests pass with RF/CA behavior and no framework or publication dependency |
| 2 | Boundary schemas | F2 | Shared runtime validation | F1 | F3 | `completed` | Validation code/type checks pass and all declared server/form schemas are exported |
| 2 | Transactional persistence | F3 | Drizzle transaction, repositories and migration | F1 | F2 | `completed` | Generated migration artifacts are current and reviewed; focused persistence sources pass static checks |
| 3 | Server API | F4 | REST operations and real controller integration | F1, F2, F3 | F5 | `completed` | Server code/types/tests/build pass, including real tenant, authorization, transaction and contention evidence |
| 3 | Product Stock web | F5 | Route, adapters, Stock UI and browser integration | F1, F2 | F4 | `completed` | Generated routes, web checks/tests and focused mocked-transport Playwright suite pass with fresh design/state captures |
| 4 | Integrated delivery | F6 | Full-stack conformance and evidence | F4, F5 | — | `completed` | All Spec commands, MV scenarios, real persistence flow and independent visual comparisons are current in `evaluation.md` |

### F1 — Core contracts and use cases

#### F1-T1 — Define stock projections and immutable ledger data

- **Status/owner:** `completed` — Builder F1-T1 (`/root/builder_f1_t1`)
- **Depends/parallel:** No dependency; safe in parallel with F1-T2 because the domain and interface paths do not overlap.
- **Paths:** `packages/core/src/mrp/domain/entities/**`, `packages/core/src/mrp/domain/structures/**`.
- **Contract:** `RF-02–RF-05`, `RF-11`; `CA-02–CA-09`, `CA-16`, `CA-18`.
- **Outcome:** Core exposes the declared stock projections, adjustment/history inputs, immutable transaction entity, runtime vocabulary, valid fakers and public domain barrels.
- **Rules:** `documentation/rules/code-conventions-rules.md` (naming, declarations, files/barrels); `documentation/rules/core-package-rules.md` (one exported type/file, fakers, business-rule exclusion and entity identity).
- **Exit:** Run `pnpm exec biome check packages/core/src/mrp/domain`; inspect every field, optional identity, snapshot, faker default and barrel export against the Spec schemas; record results in `evaluation.md`.

#### F1-T2 — Freeze repository, transaction and browser-service interfaces

- **Status/owner:** `completed` — Builder F1-T2 (`/root/builder_f1_t2`)
- **Depends/parallel:** No dependency; safe in parallel with F1-T1. F1-T3 waits for both tasks.
- **Paths:** `packages/core/src/mrp/interfaces/**`.
- **Contract:** `RF-02–RF-08`, `RF-10`, `RF-11`; `CA-02–CA-12`, `CA-16–CA-18`.
- **Outcome:** Core publishes establishment-qualified repositories, generic signed-delta addition, transaction paging, one serializable database scope and the typed `MrpService` boundary.
- **Rules:** `documentation/rules/code-conventions-rules.md` (naming, errors and barrels); `documentation/rules/core-package-rules.md` (interface ownership); `documentation/rules/database-layer-rules.md` (persistence vocabulary).
- **Exit:** Run `pnpm exec biome check packages/core/src/mrp/interfaces`; inspect signatures, semantic parameters, scope members and `RestResponse` results against the Boundary Contract; record results in `evaluation.md`.

#### F1-T3 — Implement stock use cases and unit tests

- **Status/owner:** `completed` — Builder F1-T3 (`/root/builder_f1_t3`)
- **Depends/parallel:** Depends on F1-T1 and F1-T2; no same-phase parallel work because all use cases consume both frozen contracts.
- **Paths:** `packages/core/src/mrp/use-cases/**`.
- **Contract:** `RF-02–RF-08`, `RF-10`, `RF-11`; `CA-02–CA-12`, `CA-16–CA-18`.
- **Outcome:** New and amended use cases enforce role, tenant, stock mode, brand/Main, balance and immutable-ledger rules without stock publication.
- **Rules:** `documentation/rules/code-conventions-rules.md` (application errors and class helpers); `documentation/rules/core-package-rules.md` (use-case business rules); `documentation/rules/use-case-testing-rules.md` (shape, one test/use case, typed mocks and deterministic time).
- **Exit:** Run `pnpm --filter @scoops/core check:code`, `pnpm --filter @scoops/core check:types` and `pnpm --filter @scoops/core test`; inspect role/tenant failures, signed-delta mapping, transaction calls, snapshots and absence of publisher/outbox dependencies; record results.

### F2 — Shared runtime validation

#### F2-T1 — Implement MRP transport schemas

- **Status/owner:** `completed` — Builder F2-T1 (`/root/builder_f2_t1`)
- **Depends/parallel:** Depends on F1; safe in parallel with F2-T2 and F3. F2-T2 exclusively owns the shared root barrel.
- **Paths:** `packages/validation/src/mrp/product-brand-schema.ts`, `packages/validation/src/mrp/update-product-brand-schema.ts`, `packages/validation/src/mrp/adjust-product-stock-schema.ts`, `packages/validation/src/mrp/stock-transaction-list-schema.ts`.
- **Contract:** `RF-03`, `RF-05`, `RF-11`; `CA-04–CA-06`, `CA-09`, `CA-15`, `CA-16`.
- **Outcome:** Add/Edit/adjustment/history transport schemas enforce syntactic bounds, Core enums, inclusive dates and pagination without tenant or balance policy.
- **Rules:** `documentation/rules/code-conventions-rules.md` (naming/files); `documentation/rules/validation-package-rules.md` (ownership, one schema/file, enum derivation and consumer boundaries).
- **Exit:** Run `pnpm exec biome check packages/validation/src/mrp`; inspect valid/boundary/malformed bodies and queries, date ordering, page limits, no `isPrimary` and no Edit stock; record results.

#### F2-T2 — Implement web form schemas and publish Validation exports

- **Status/owner:** `completed` — Builder F2-T2 (`/root/builder_f2_t2`)
- **Depends/parallel:** Depends on F1; safe in parallel with F2-T1 and F3. Reconcile F2-T1 exports before completion.
- **Paths:** `packages/validation/src/web/product-brand-form-schema.ts`, `packages/validation/src/web/stock-adjustment-form-schema.ts`, `packages/validation/src/index.ts`.
- **Contract:** `RF-03`, `RF-05`, `RF-09`; `CA-04–CA-06`, `CA-09`, `CA-13–CA-15`.
- **Outcome:** RHF-compatible localized schemas cover Add/Edit and base/package input, and the root exports every revision-6 schema.
- **Rules:** `documentation/rules/code-conventions-rules.md` (naming/barrels); `documentation/rules/validation-package-rules.md` (web form boundary and root exports).
- **Exit:** After F2-T1, run `pnpm --filter @scoops/validation check:code` and `pnpm --filter @scoops/validation check:types`; inspect messages, numeric boundaries, preview prerequisites and complete exports; record results.

### F3 — Transactional persistence

#### F3-T1 — Define ledger/brand models and generate the migration

- **Status/owner:** `completed` — Builder F3-T1 (`/root/builder_f3_t1`)
- **Depends/parallel:** Depends on F1-T1; safe in parallel with F2. F3-T1 exclusively owns models, mappers and generated artifacts.
- **Paths:** `apps/server/src/mrp/database/drizzle/models/**`, `apps/server/src/mrp/database/drizzle/types/**`, `apps/server/src/mrp/database/drizzle/mappers/**`, `apps/server/src/shared/database/drizzle/migrations/0007_product_stock_history.sql`, `apps/server/src/shared/database/drizzle/migrations/meta/0007_snapshot.json`, `apps/server/src/shared/database/drizzle/migrations/meta/_journal.json`.
- **Contract:** `RF-04–RF-07`, `RF-10`, `RF-11`; `CA-07–CA-10`, `CA-16–CA-18`.
- **Outcome:** Brand constraints and append-only ledger schema/mapping represent snapshots, precision, checks, indexes and deletion semantics.
- **Rules:** `documentation/rules/code-conventions-rules.md` (naming/barrels); `documentation/rules/database-layer-rules.md` (model/type/mapper boundaries and generated migrations).
- **Exit:** Run `pnpm --filter server db:migration:generate -- --name product_stock_history` once and `pnpm exec biome check apps/server/src/mrp/database/drizzle/models apps/server/src/mrp/database/drizzle/types apps/server/src/mrp/database/drizzle/mappers`; review SQL/snapshot/journal for preflight, checks, indexes, FKs, prior journal preservation and ordering; never hand-edit generated files.

#### F3-T2 — Implement repositories and serializable transaction scope

- **Status/owner:** `completed` — Builder F3-T2 (`/root/builder_f3_t2`)
- **Depends/parallel:** Depends on F1-T2 and F3-T1; F3-T3 waits for repository exports.
- **Paths:** `apps/server/src/mrp/database/drizzle/repositories/**`.
- **Contract:** `RF-02–RF-08`, `RF-10`, `RF-11`; `CA-02–CA-08`, `CA-10`, `CA-12`, `CA-16–CA-18`.
- **Outcome:** Repositories provide tenant-safe reads, product-qualified brand changes, guarded signed addition, stable paging and one retrying serializable scope.
- **Rules:** `documentation/rules/code-conventions-rules.md` (errors/class helpers); `documentation/rules/database-layer-rules.md` (repository vocabulary, implementation and no direct tests).
- **Exit:** Run `pnpm exec biome check apps/server/src/mrp/database/drizzle/repositories`; inspect predicates, atomic arithmetic/minimum guard, filter reuse/order, transaction executors and conflict retry translation; defer real persistence proof to F4-T2.

#### F3-T3 — Wire database tokens, exports and seeding

- **Status/owner:** `completed` — Builder F3-T3 (`/root/builder_f3_t3`)
- **Depends/parallel:** Depends on F3-T2; no task overlaps database composition paths.
- **Paths:** `apps/server/src/mrp/database/mrp-repositories.ts`, `apps/server/src/mrp/database/mrp-database.module.ts`, `apps/server/src/mrp/database/mrp-seeder.ts`.
- **Contract:** `RF-02`, `RF-04`, `RF-08`, `RF-10`, `RF-11`; `CA-02`, `CA-07`, `CA-12`, `CA-16–CA-18`.
- **Outcome:** Symbol tokens expose all implementations and the seeder creates deterministic multi-tenant prerequisites through contracts.
- **Rules:** `documentation/rules/code-conventions-rules.md` (naming); `documentation/rules/database-layer-rules.md` (Symbol binding, exports, seeder and aliases).
- **Exit:** Run `pnpm exec biome check apps/server/src/mrp/database/mrp-repositories.ts apps/server/src/mrp/database/mrp-database.module.ts apps/server/src/mrp/database/mrp-seeder.ts`; inspect unique tokens, `useExisting`, exports, no concrete leakage and no raw SQL in seeding; record results.

### F4 — Server API and integration

#### F4-T1 — Implement controllers, DTOs and schema adapters

- **Status/owner:** `completed` — Builder F4-T1 (`/root/builder_f4_t1`)
- **Depends/parallel:** Depends on F1–F3; safe in parallel with F5 and, after exports stabilize, with F4-T3. F4-T1 exclusively owns REST barrels.
- **Paths:** `apps/server/src/mrp/rest/controllers/*.ts`, `apps/server/src/mrp/rest/controllers/index.ts`, `apps/server/src/mrp/rest/dtos/**`, `apps/server/src/mrp/rest/schemas/product-schemas.ts`.
- **Contract:** `RF-02–RF-08`, `RF-10`, `RF-11`; `CA-02–CA-12`, `CA-16–CA-18`.
- **Outcome:** Seven manager-only actions use semantic params, shared schemas, typed DTOs, complete Swagger statuses and constructor-wired use cases without persistence/business logic.
- **Rules:** `documentation/rules/code-conventions-rules.md` (errors/class helpers/barrels); `documentation/rules/rest-layer-rules.md` (one action, semantic params, constructor wiring, body derivation and Swagger); `documentation/rules/validation-package-rules.md` (schema consumption); `documentation/rules/database-layer-rules.md` (token injection).
- **Exit:** Run `pnpm exec biome check apps/server/src/mrp/rest/controllers apps/server/src/mrp/rest/dtos apps/server/src/mrp/rest/schemas/product-schemas.ts`; inspect route/method/param/body mapping, status DTOs, actor wiring and serialization; real HTTP/persistence proof belongs to F4-T2.

#### F4-T2 — Build the fixture and real controller integration suites

- **Status/owner:** `completed` — Builder F4-T2 (`/root/builder_f4_t2`)
- **Depends/parallel:** Depends on F3 and F4-T1; safe in parallel with F4-T3 because paths do not overlap.
- **Paths:** `apps/server/src/mrp/fixtures/**`, `apps/server/src/mrp/rest/controllers/tests/**`.
- **Contract:** `RF-02–RF-08`, `RF-10`, `RF-11`; `CA-02–CA-12`, `CA-16–CA-18`.
- **Outcome:** One real fixture and one HTTP suite/controller prove mapping, auth/tenant behavior, constraints, contention, rollback, paging and snapshots.
- **Rules:** `documentation/rules/code-conventions-rules.md` (naming/aliases); `documentation/rules/controllers-testing-rules.md` (real wiring, fixture lifecycle, isolation and persistence assertions); `documentation/rules/database-layer-rules.md` (indirect persistence validation); `documentation/rules/rest-layer-rules.md` (route contract).
- **Exit:** With Docker available, run `pnpm --filter server test -- src/mrp/rest/controllers/tests` then `pnpm --filter server test`; record real request/response and persistence/authorization results, contention, rollback, snapshots and no publication. Mocked transport is insufficient.

#### F4-T3 — Complete server composition and REST examples

- **Status/owner:** `completed` — Builder F4-T3 (`/root/builder_f4_t3`)
- **Depends/parallel:** Depends on F3-T3 and stable F4-T1 exports; safe in parallel with F4-T2.
- **Paths:** `apps/server/src/mrp/mrp.module.ts`, `apps/server/rest-client/mrp/products.rest`.
- **Contract:** `RF-02–RF-08`, `RF-10`, `RF-11`; `CA-02–CA-12`, `CA-16–CA-18`.
- **Outcome:** `MrpModule` registers all product controllers and the REST file documents every exact operation.
- **Rules:** `documentation/rules/code-conventions-rules.md` (naming/aliases); `documentation/rules/rest-layer-rules.md` (composition and complete REST group file).
- **Exit:** After F4-T2, run `pnpm --filter server check:code`, `pnpm --filter server check:types` and `pnpm --filter server build`; inspect registration, provider reuse and exact examples; record results.

### F5 — Product Stock web experience

#### F5-T1 — Implement REST composition and canonical navigation

- **Status/owner:** `completed` — Builder F5-T1 (`/root/builder_f5_t1`)
- **Depends/parallel:** Depends on F1 and F2; safe in parallel with F4. F5-T1 exclusively generates the route tree and freezes hook/action signatures.
- **Paths:** `apps/web/src/constants/routes.ts`, `apps/web/src/rest/services/mrp-service.ts`, `apps/web/src/ui/shared/contexts/rest-context/**`, `apps/web/src/ui/mrp/hooks/**`, `apps/web/src/routes/_authenticated/products/$productId.tsx`, `apps/web/src/routeTree.gen.ts`, `apps/web/src/ui/mrp/widgets/pages/products-page/products-list-card/index.tsx`, `apps/web/src/ui/mrp/widgets/pages/products-page/product-registration-dialog/use-product-registration-dialog.ts`.
- **Contract:** `RF-01`, `RF-08`, `RF-10`, `RF-11`; `CA-01`, `CA-04`, `CA-08`, `CA-11`, `CA-12`, `CA-16`, `CA-17`.
- **Outcome:** REST service/context/hooks map every operation, `Detalhes` navigates canonically, registration omits `isPrimary`, and the authenticated route is generated.
- **Rules:** `documentation/rules/code-conventions-rules.md` (factories/naming); `documentation/rules/ui-layer-rules.md` (REST composition, hooks, contexts and navigation); `documentation/rules/web-app-routing-rules.md` (dynamic paths, thin route, middleware and generation); `documentation/rules/rest-layer-rules.md` (service mapping/session headers).
- **Exit:** Run `pnpm --filter web generate-routes` and `pnpm exec biome check apps/web/src/constants/routes.ts apps/web/src/rest/services/mrp-service.ts apps/web/src/ui/mrp/hooks apps/web/src/routes/_authenticated/products`; inspect generated tree and transport mapping. Run `pnpm --filter web test:integration -- tests/routes/mrp/products.index.test.ts` with Playwright CLI to verify keyboard navigation, URL, exact tree, console/failed requests and a fresh affected screenshot; do not claim server persistence.

#### F5-T2 — Compose page loading, header, summary and brand list

- **Status/owner:** `completed` — Builder F5-T2 (`/root/builder_f5_t2`)
- **Depends/parallel:** Depends on F5-T1; safe in parallel with F5-T3 and F5-T4 because widget paths are disjoint.
- **Paths:** `apps/web/src/ui/mrp/widgets/pages/product-stock-page/index.tsx`, `apps/web/src/ui/mrp/widgets/pages/product-stock-page/use-product-stock-page.ts`, `apps/web/src/ui/mrp/widgets/pages/product-stock-page/product-stock-header/**`, `apps/web/src/ui/mrp/widgets/pages/product-stock-page/product-stock-summary/**`, `apps/web/src/ui/mrp/widgets/pages/product-stock-page/product-brands-card/index.tsx`, `apps/web/src/ui/mrp/widgets/pages/product-stock-page/product-brands-card/use-product-brands-card.ts`.
- **Contract:** `RF-01–RF-04`, `RF-08`, `RF-09`; `CA-01–CA-07`, `CA-11–CA-14`.
- **Outcome:** The Stock-only page renders identity, zero/ideal/situation semantics, Single actions, responsive brands/empty guidance and no forbidden controls/tabs.
- **Rules:** `documentation/rules/code-conventions-rules.md` (handlers/order); `documentation/rules/ui-layer-rules.md` (widget/hook ownership, nested structure and design); `documentation/design.md` (page, metrics, tables and states).
- **Exit:** Run `pnpm exec biome check apps/web/src/ui/mrp/widgets/pages/product-stock-page`; with Playwright CLI compare the exact tree to `bi8Au.png` and applicable 320 × 900 states, exercise keyboard/focus/overflow, inspect console/failed requests, and save fresh populated/loading/error/empty captures.

#### F5-T3 — Implement brand menus and lifecycle dialogs

- **Status/owner:** `completed` — Builder F5-T3 (`/root/builder_f5_t3`)
- **Depends/parallel:** Depends on F5-T1; safe in parallel with F5-T2 and F5-T4.
- **Paths:** `apps/web/src/ui/mrp/widgets/pages/product-stock-page/product-brands-card/product-brand-actions-menu/index.tsx`, `apps/web/src/ui/mrp/widgets/pages/product-stock-page/product-brand-dialog/index.tsx`, `apps/web/src/ui/mrp/widgets/pages/product-stock-page/product-brand-dialog/use-product-brand-dialog.ts`, `apps/web/src/ui/mrp/widgets/pages/product-stock-page/remove-product-brand-dialog/index.tsx`, `apps/web/src/ui/mrp/widgets/pages/product-stock-page/remove-product-brand-dialog/use-remove-product-brand-dialog.ts`.
- **Contract:** `RF-05–RF-07`, `RF-09`; `CA-08–CA-10`, `CA-13`, `CA-14`.
- **Outcome:** Add/Edit preview, action order/Main availability and destructive confirmation implement exact field, impact, pending/error and focus contracts.
- **Rules:** `documentation/rules/code-conventions-rules.md` (handlers/order); `documentation/rules/ui-layer-rules.md` (stateful hooks, forms, wrappers and focus); `documentation/rules/validation-package-rules.md` (form boundary); `documentation/design.md` (menus/forms/dialogs).
- **Exit:** Run `pnpm exec biome check apps/web/src/ui/mrp/widgets/pages/product-stock-page/product-brand-dialog apps/web/src/ui/mrp/widgets/pages/product-stock-page/remove-product-brand-dialog apps/web/src/ui/mrp/widgets/pages/product-stock-page/product-brands-card/product-brand-actions-menu`; with Playwright CLI compare exact trees independently to the four references, exercise keyboard/Escape/focus/pending/error/narrow states, inspect console/failed requests, and save each fresh capture.

#### F5-T4 — Implement adjustments and independent transaction history

- **Status/owner:** `completed` — Builder F5-T4 (`/root/builder_f5_t4`)
- **Depends/parallel:** Depends on F5-T1; safe in parallel with F5-T2 and F5-T3.
- **Paths:** `apps/web/src/ui/mrp/widgets/pages/product-stock-page/stock-adjustment-dialog/index.tsx`, `apps/web/src/ui/mrp/widgets/pages/product-stock-page/stock-adjustment-dialog/use-stock-adjustment-dialog.ts`, `apps/web/src/ui/mrp/widgets/pages/product-stock-page/stock-transaction-history-card/index.tsx`.
- **Contract:** `RF-03`, `RF-04`, `RF-09`, `RF-11`; `CA-04–CA-07`, `CA-13–CA-18`.
- **Outcome:** Single/base/package adjustments submit exact base quantities, while independent history filters/pages stable signed snapshots with deterministic visible authors.
- **Rules:** `documentation/rules/code-conventions-rules.md` (handlers/order); `documentation/rules/ui-layer-rules.md` (stateful hooks, forms, queries and focus); `documentation/rules/validation-package-rules.md` (form boundary); `documentation/design.md` (inputs, preview, tables, badges and pagination).
- **Exit:** Run `pnpm exec biome check apps/web/src/ui/mrp/widgets/pages/product-stock-page/stock-adjustment-dialog apps/web/src/ui/mrp/widgets/pages/product-stock-page/stock-transaction-history-card`; with Playwright CLI compare the history subtree to `bi8Au.png`, exercise success/insufficient/loading/empty/error/filtered-empty and narrow keyboard states, inspect console/failed requests, and save every independent fresh capture.

#### F5-T5 — Cover widget-owned behavior with colocated tests

- **Status/owner:** `completed` — Builder F5-T5 (`/root/builder_f5_t5`)
- **Depends/parallel:** Depends on F5-T2–F5-T4; no parallel widget edits because tests render the integrated owning composition.
- **Paths:** `apps/web/src/ui/mrp/widgets/pages/product-stock-page/product-stock-page.test.tsx`, `apps/web/src/ui/mrp/widgets/pages/product-stock-page/use-product-stock-page.test.ts`, `apps/web/src/ui/mrp/widgets/pages/product-stock-page/product-brand-dialog/product-brand-dialog.test.tsx`, `apps/web/src/ui/mrp/widgets/pages/product-stock-page/stock-adjustment-dialog/stock-adjustment-dialog.test.tsx`, `apps/web/src/ui/mrp/widgets/pages/product-stock-page/remove-product-brand-dialog/remove-product-brand-dialog.test.tsx`, `apps/web/src/ui/mrp/widgets/pages/product-stock-page/stock-transaction-history-card/stock-transaction-history-card.test.tsx`.
- **Contract:** `RF-01–RF-11`; `CA-01–CA-18`.
- **Outcome:** Colocated suites prove real composition, lifecycle matrices, form boundaries, refresh/focus, conversion, impacts and history without dedicated service/query/action tests.
- **Rules:** `documentation/rules/code-conventions-rules.md` (naming); `documentation/rules/widget-testing-rules.md` (owning boundary, real composition, lifecycle matrix and accessible queries); `documentation/rules/ui-layer-rules.md` (test placement).
- **Exit:** Run `pnpm --filter web test`, `pnpm --filter web check:code` and `pnpm --filter web check:types`; inspect observable outcomes and exact service inputs across every applicable CA. Any visual correction also requires Playwright CLI tree/keyboard/narrow/console inspection and a fresh screenshot.

#### F5-T6 — Verify route behavior with mocked-transport Playwright coverage

- **Status/owner:** `completed` — Builder F5-T6 (`/root/builder_f5_t6`)
- **Depends/parallel:** Depends on F5-T1–F5-T5; no parallel UI implementation because this is F5's integrated browser boundary.
- **Paths:** `apps/web/tests/fixtures/mrp-module-fixture.ts`, `apps/web/tests/routes/mrp/products.index.test.ts`, `apps/web/tests/routes/mrp/products.$productId.test.ts`, `apps/web/tests/routes/mrp/products.real.integration.test.ts`.
- **Contract:** `RF-01–RF-11`; `CA-01–CA-18`.
- **Outcome:** Stateful route suites prove access, URL, requests/responses, visible lifecycle/actions, keyboard/focus and responsiveness; the real-flow suite is ready for F6.
- **Rules:** `documentation/rules/web-app-routing-rules.md` (route matrix, shared fixture and visible+transport outcomes); `documentation/rules/widget-testing-rules.md` (integration boundary); `documentation/design.md` (viewport/state comparison).
- **Exit:** Run `pnpm --filter web test:integration -- tests/routes/mrp/products.\$productId.test.ts`; assert exact URL/method/path/query/body plus visible outcomes, exact tree, keyboard and 320 × 900 behavior, console/failed requests and all fresh design/supplemental captures. Mark mocked evidence as non-authoritative for persistence.

### F6 — Integrated conformance and evidence

#### F6-T1 — Validate the integrated revision-6 implementation and prepare handoff

- **Status/owner:** `completed` — Orchestrator
- **Depends/parallel:** Depends on completed F4 and F5; no parallel implementation. Any discrepancy remains `in_progress`, becomes an Evaluation finding and routes to a scoped Builder Fix through `implement-spec` before affected evidence is rerun.
- **Paths:** `documentation/features/mrp/products-details-page-stock-tab/evaluation.md`, `documentation/features/mrp/products-details-page-stock-tab/evidence/screenshots/rev-6/**`; read-only conformance review of every Spec-owned implementation path and generated artifact.
- **Contract:** `RF-01–RF-11`; `CA-01–CA-18`.
- **Outcome:** One integrated commit has current automated, runtime, manual and visual evidence proving the complete Contract, with generated artifacts reviewed and no blocking finding.
- **Rules:** Entire revision-6 Rule Pack in `spec.md`, `documentation/sdd-rules.md` (living evidence and integrated validation), `documentation/tooling.md` (workspace, Docker and Playwright commands), and `documentation/design.md` (final conformance comparison).
- **Exit:** Run every command in the Spec Validation Contract on the integrated implementation; verify `docker compose ps`, Supabase/server/web health, execute `MV-01–MV-05`, and run `pnpm --filter web test:integration -- tests/routes/mrp/products.real.integration.test.ts` against real authenticated services. Record exact request/response, persisted balance/ledger/authorization outcomes, console and failed-request classification, keyboard/narrow behavior, generated migration/route review and every independent screenshot comparison in `evaluation.md`. Stop only application processes started for validation.

## Validation and handoff

| Type | Scenario/surface | Criteria | Reference | Evidence target | Status |
| --- | --- | --- | --- | --- | --- |
| Manual | MV-01 — navigation and product summary | CA-01–CA-03 | Spec MV-01 | `./evaluation.md` | `completed` |
| Manual | MV-02 — Single adjustment and concurrency | CA-04–CA-06, CA-17 | Spec MV-02 | `./evaluation.md` | `completed` |
| Manual | MV-03 — By-brand lifecycle, package input and history | CA-07–CA-10, CA-15, CA-16, CA-18 | Spec MV-03 | `./evaluation.md` | `completed` |
| Manual | MV-04 — authorization and tenant isolation | CA-11, CA-12, CA-16 | Spec MV-04 | `./evaluation.md` | `completed` |
| Manual | MV-05 — lifecycle states, keyboard and narrow layout | CA-13, CA-14 | Spec MV-05 | `./evaluation.md` | `completed` |
| Runtime | Serializable balance + ledger commit/rollback/contention | CA-04–CA-06, CA-10, CA-17 | Technical and Validation Contracts | `./evaluation.md` | `completed` |
| Runtime | Manager authorization and uniform tenant-safe not-found | CA-11, CA-12, CA-16 | Boundary Contract and MV-04 | `./evaluation.md` | `completed` |
| Runtime | Stable paginated/filterable transaction history after rename/delete | CA-16, CA-18 | HTTP history and persistence contracts | `./evaluation.md` | `completed` |
| Runtime | Real authenticated web → REST → PostgreSQL Stock flow | CA-04, CA-07, CA-08, CA-12, CA-16–CA-18 | `products.real.integration.test.ts` | `./evaluation.md` | `completed` |
| Visual | Populated By-brand Stock page — 1560 × 1320 | CA-01, CA-02, CA-07, CA-16, CA-18 | `./design/bi8Au.png` | `./evidence/screenshots/rev-6/by-brand-stock-1560x1320.png` | `completed` |
| Visual | Add brand dialog — 676 × 771 | CA-08, CA-09, CA-15 | `./design/p72QC.png` | `./evidence/screenshots/rev-6/add-brand-676x771.png` | `completed` |
| Visual | Edit brand dialog without stock field — 676 × 771 | CA-09 | `./design/Jo3va.png` plus documented deviation | `./evidence/screenshots/rev-6/edit-brand-676x771.png` | `completed` |
| Visual | Brand actions menu — 293 × 188 | CA-08–CA-10, CA-14 | `./design/yUkPJ.png` | `./evidence/screenshots/rev-6/brand-actions-293x188.png` | `completed` |
| Visual | Delete brand confirmation — 596 × 353 | CA-10, CA-13, CA-14, CA-18 | `./design/K48XWv.png` plus corrected copy | `./evidence/screenshots/rev-6/delete-brand-596x353.png` | `completed` |
| Visual | Single-stock page and adjustment success — 1280 × 900 | CA-04, CA-06 | Manifest supplemental decision | `./evidence/screenshots/rev-6/single-adjustment-1280x900.png` | `completed` |
| Visual | By-brand package adjustment success — 676 × 771 | CA-04, CA-15 | Manifest supplemental decision | `./evidence/screenshots/rev-6/package-adjustment-success-676x771.png` | `completed` |
| Visual | By-brand insufficient adjustment — 676 × 771 | CA-05, CA-13, CA-15 | Manifest supplemental decision | `./evidence/screenshots/rev-6/package-adjustment-insufficient-676x771.png` | `completed` |
| Visual | Detail loading — 1280 × 900 | CA-13 | Manifest supplemental decision | `./evidence/screenshots/rev-6/detail-loading-1280x900.png` | `completed` |
| Visual | Detail request error/retry — 1280 × 900 | CA-13 | Manifest supplemental decision | `./evidence/screenshots/rev-6/detail-error-1280x900.png` | `completed` |
| Visual | Empty brands — 1280 × 900 | CA-13 | Manifest supplemental decision | `./evidence/screenshots/rev-6/empty-brands-1280x900.png` | `completed` |
| Visual | History loading — 1280 × 900 | CA-13, CA-16 | Manifest supplemental decision | `./evidence/screenshots/rev-6/history-loading-1280x900.png` | `completed` |
| Visual | History empty — 1280 × 900 | CA-16 | Manifest supplemental decision | `./evidence/screenshots/rev-6/history-empty-1280x900.png` | `completed` |
| Visual | History request error — 1280 × 900 | CA-13, CA-16 | Manifest supplemental decision | `./evidence/screenshots/rev-6/history-error-1280x900.png` | `completed` |
| Visual | History filtered-empty — 1280 × 900 | CA-16 | Manifest supplemental decision | `./evidence/screenshots/rev-6/history-filtered-empty-1280x900.png` | `completed` |
| Visual | Narrow populated page — 320 × 900 | CA-14 | Manifest supplemental decision | `./evidence/screenshots/rev-6/narrow-page-320x900.png` | `completed` |
| Visual | Narrow dialog — 320 × 900 | CA-13, CA-14 | Manifest supplemental decision | `./evidence/screenshots/rev-6/narrow-dialog-320x900.png` | `completed` |
| Visual | Narrow action menu — 320 × 900 | CA-14 | Manifest supplemental decision | `./evidence/screenshots/rev-6/narrow-menu-320x900.png` | `completed` |

Final handoff requires every task and phase to be `completed`; all revision-6 Spec commands current on the integrated commit; generated migration and route artifacts reviewed; required Docker services, authenticated accounts and two-tenant fixtures ready; every `MV-*` executable with declared evidence present; the final exact Spec tree and conformance comparison passed; every supplied and supplemental screenshot decision resolved independently; and no blocking finding active. Route directly to `conclude-spec` when those conditions hold.
