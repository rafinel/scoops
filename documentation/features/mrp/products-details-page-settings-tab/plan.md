---
title: Product details Settings tab — implementation plan
status: completed
spec: ./spec.md
spec_revision: 3
evaluation: ./evaluation.md
github_issue: https://github.com/rafinel/scoops/issues/18
updated_at: 2026-08-25
---

## Execution status

- **Spec:** [`spec.md`](./spec.md) — revision `3`, `completed`.
- **Rationale:** Plan-backed execution is required because this delivery crosses Core, Validation, transactional Server persistence and generated migration artifacts, eight REST operations, protected Web routing, multiple ownership boundaries, nine saved design references and real authenticated browser evidence.
- **Current phase:** F1 shared contracts and boundary schemas (`completed`); Wave 2 F2/F3/F4 (`completed`); Wave 3 F5/F6 (`completed`); F7 integrated conformance and handoff (`completed`); F8 no-conversion unit semantics (`completed`); F9 accompaniment recovery correction (`completed`).
- **Next action:** Review PR #20; merge and deploy remain outside this conclusion task.
- **Active blockers:** None. Current head `d3acfda` passed Core, Server and Web CI (`EV-31`); FND-032 is resolved.
- **Builders:** Next dependency-ready Builder Core for F1; Wave 2 reuses Builder Core for F3 and activates Builder Server for F2 plus Builder Web for F4; Wave 3 reuses Builder Server for F5 and Builder Web for F6.
- **Coordination:** The Orchestrator owns this Plan, `evaluation.md`, package/lockfile or root configuration changes, generated `0011_<generated-tag>` migration/meta files, `apps/web/src/routeTree.gen.ts`, final integration, visual verdicts and official evidence. `apps/server/rest-client/mrp/products.rest` is synchronized by the REST owner because the REST Rule requires one example file for every MRP product route group.

## Execution ledger

| Wave | Builder | Phase | Name | Depends on | Parallel with | Status | Exit condition |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | `Builder Core` | F1 | Shared MRP settings contracts and boundary schemas | — | — | `completed` | Core and Validation checks pass and every revision-1 public structure, interface and schema is exported with the Spec precision and scope contract. |
| 2 | `Builder Server` | F2 | Transactional persistence and history-safe migration | F1 | F3, F4 | `completed` | Models, tenant-qualified repositories, serializable transaction scope and generated migration inputs satisfy the persistence Contract; migration `0011_deep_sinister_six` is applied. F5 supplies the integrated controller/history proof. |
| 2 | `Builder Core` | F3 | Semantic settings actions and Core coverage | F1 | F2, F4 | `completed` | Eight semantic use cases plus the inverse-accompaniment list filter pass deterministic success, authorization, tenant, conflict, precision and rollback coverage. |
| 2 | `Builder Web` | F4 | Web REST adapter, query/action boundaries and recovery routes | F1 | F2, F3 | `completed` | Eight Web service operations, query/action hooks and validated Settings/direct-action route contracts are wired without duplicated product truth or invalid search state. |
| 3 | `Builder Server` | F5 | REST composition and real controller integration | F2, F3 | F6 | `completed` | Eight Settings controllers plus the list-filter integration pass real HTTP, authorization, tenant, DTO, persistence, rollback and retained-history assertions. |
| 3 | `Builder Web` | F6 | Settings widgets, dialogs and browser route coverage | F4 | F5 | `completed` | The exact Settings widget tree, all stateful dialogs, mocked transport route matrix, responsive/keyboard behavior and fresh design comparisons pass; `FND-030` is resolved by `EV-26`. |
| 4 | `Orchestrator` | F7 | Integrated conformance and handoff | F5, F6 | Integrated Reviewer | `completed` | Revision-3 technical, runtime, visual and acceptance evidence is current; EV-26 passes the corrected exact route matrix at 145/145, EV-28/FND-031 are resolved as unrelated serial browser-harness instability, FND-032 is resolved by the MRP fixture correction, and current-head Core/Server/Web CI passes in EV-31. |
| 4 | `Builder Core`, `Builder Server`, `Builder Web` | F8 | No-conversion unit semantics correction | F7 | — | `completed` | Product unit changes update the product unit while all product-owned numeric values remain unchanged; no compatible/incompatible branch or conversion factor remains; Core, Server, Web and browser evidence are current in `EV-21`. |
| 4 | `Builder Web` | F9 | Accompaniment recovery filter correction | F7 | — | `completed` | The `Ver produtos` recovery link filters by the removed accompaniment product, while retaining the dependent product label; focused Web and browser evidence is current in `EV-22` and `EV-23`. |

### F1 — Shared MRP settings contracts and boundary schemas

#### F1-T1 — Freeze Core structures, repository/service ports and shared Validation schemas

- **Status/owner:** `completed` — Builder Core (activated in Evaluation `EV-01`)
- **Depends/parallel:** Starts only after the Orchestrator records Spec revision 1, this task, its exact paths, `RF-01`–`RF-07`, `CA-01`–`CA-15`, selected Rules, design references and exits; no parallel task in F1.
- **Paths:** `packages/core/src/mrp/domain/structures/{product-settings-details.ts,update-product-settings-input.ts,product-category-dependency.ts,product-category-removal-impact.ts,change-product-categories-input.ts,preview-product-unit-change-input.ts,product-unit-change-preview.ts,change-product-unit-input.ts,product-removal-impact.ts,product-update.ts,product-list-params.ts,index.ts}`; `packages/core/src/mrp/interfaces/{products-repository.ts,brands-repository.ts,stock-balances-repository.ts,recipes-repository.ts,recipe-ingredients-repository.ts,product-sizes-repository.ts,product-accompaniments-repository.ts,resale-configurations-repository.ts,stock-transactions-repository.ts,productions-repository.ts,mrp-database.ts,mrp-service.ts,index.ts}`; `packages/validation/src/mrp/{update-product-settings-schema.ts,change-product-categories-schema.ts,product-category-removal-query-schema.ts,product-unit-change-schema.ts,list-products-query-schema.ts}`; `packages/validation/src/web/{product-settings-form-schema.ts,product-settings-search-schema.ts,product-pricing-search-schema.ts,products-search-schema.ts}`; `packages/validation/src/index.ts`.
- **Contract:** `RF-01`–`RF-07`; public foundations for `CA-01`–`CA-15`; HTTP boundary and structure tables in the Spec.
- **Outcome:** Core exposes one-file-per-declaration, establishment-aware ports for settings, unit-impact preview, numeric-preserving unit relabeling, removal and recovery filtering; Validation exposes strict REST, form and search schemas with ISO-date mapping, exact precision, null-clearing and mutual-exclusion behavior while leaving authorization and business policy to Core/Server.
- **Rules:** `documentation/rules/code-conventions-rules.md` (Naming, Function declarations, Declaration/destructuring order, File naming, Barrel files); `documentation/rules/core-package-rules.md` (One exported type per file, Business rules belong to use cases, Contracts belong to interfaces directories, Only entities have identity); `documentation/rules/validation-package-rules.md` (Ownership and dependency direction, Schema placement and naming, Core structures and enums, Consumer boundaries). No selected Rule file contains an `Antipatterns to Avoid` subsection.
- **Exit:** Run `pnpm --filter @scoops/core check:code`, `pnpm --filter @scoops/core check:types`, `pnpm --filter @scoops/validation check:code` and `pnpm --filter @scoops/validation check:types`; inspect root exports, inferred inputs, nullable clears, category/unit precision, route-search defaults and the absence of tenant/authorization/business decisions in schemas.

### F2 — Transactional persistence and history-safe migration

#### F2-T1 — Update history FKs and reverse-dependency indexes, then generate migration 0011

- **Status/owner:** `completed` — Builder Server; generated files remain Orchestrator-owned. Generated migration: `0011_deep_sinister_six`.
- **Depends/parallel:** Depends on F1; safe in parallel with F3 and F4 because paths do not overlap. The Orchestrator records the actual generator tag before implementation proceeds past migration review.
- **Paths:** `apps/server/src/mrp/database/drizzle/models/{stock-transaction-model.ts,production-model.ts,recipe-ingredient-model.ts,product-accompaniment-model.ts,index.ts}`; generated `apps/server/src/shared/database/drizzle/migrations/0011_<generated-tag>.sql`, `meta/0011_snapshot.json` and `meta/_journal.json`.
- **Contract:** `RF-04`–`RF-06`; `CA-07`–`CA-13`; modified stock transaction, production, recipe ingredient and accompaniment model contracts.
- **Outcome:** Current product deletion no longer cascades into retained stock/production history, and tenant-scoped reverse dependency indexes exist without backfill, row rewrite or unrelated PDV schema changes.
- **Rules:** `documentation/rules/database-layer-rules.md` (Database code belongs to the owning module, Drizzle models are declarations, generated migration ownership); `documentation/architecture.md` (Persistence and consistency, Historical records); `documentation/tooling.md` (Database tooling and migration workflow). No selected Rule file contains an `Antipatterns to Avoid` subsection.
- **Exit:** Run `pnpm --filter server db:migration:generate`, review the generated SQL/snapshot/journal against the Spec—not hand-edited metadata—apply it to a clean database and an upgrade from migration `0010`, and verify seeded transaction/production history remains queryable after product removal in the real Server integration fixture. Record the actual migration tag in `evaluation.md` and this Plan's execution log when implementation starts.

#### F2-T2 — Implement scoped repositories and serializable MRP transaction scope

- **Status/owner:** `completed` — Builder Server
- **Depends/parallel:** Depends on F1 and F2-T1; safe in parallel with F3 and F4 until REST integration. No active Builder may edit these Server database paths concurrently.
- **Paths:** `apps/server/src/mrp/database/drizzle/repositories/{drizzle-products-repository.ts,drizzle-brands-repository.ts,drizzle-stock-balances-repository.ts,drizzle-recipes-repository.ts,drizzle-recipe-ingredients-repository.ts,drizzle-product-sizes-repository.ts,drizzle-product-accompaniments-repository.ts,drizzle-resale-configurations-repository.ts,drizzle-stock-transactions-repository.ts,drizzle-productions-repository.ts,drizzle-mrp-database.ts}`.
- **Contract:** `RF-01`, `RF-03`–`RF-06`; `CA-04`–`CA-13`; all repository relationships and numeric-preserving unit/removal semantics in the Spec.
- **Outcome:** Every settings read, reverse-dependency query, unit-impact count, retained-history count, inverse-link removal and optimistic-version replacement is establishment/product scoped and available inside `MrpDatabase.run` at serializable isolation with the existing retry policy.
- **Rules:** `documentation/rules/database-layer-rules.md` (Repository contracts belong to core, Drizzle repositories implement core contracts, Repositories do not receive tests, Repository injection uses module tokens); `documentation/rules/code-conventions-rules.md` (Known application failures, naming and aliases); `documentation/architecture.md` (Identity/tenancy and Persistence/consistency). No selected Rule file contains an `Antipatterns to Avoid` subsection.
- **Exit:** Run focused Server code/type checks; inspect every tenant/product predicate, mapper/null/number conversion, exact-precision guard, affected-row assertion and transaction binding; then exercise the real Testcontainers controller suite in F5 to verify request/response, persisted current rows, rollback and retained history rather than accepting mocked repository evidence.

### F3 — Semantic settings actions and Core coverage

#### F3-T1 — Replace generic product update with eight semantic use cases and inverse filtering

- **Status/owner:** `completed` — Builder Core
- **Depends/parallel:** Depends on F1; safe in parallel with F2 and F4. Freeze the revision-1 Core ports and keep all business decisions in use-case `execute` methods.
- **Paths:** `packages/core/src/mrp/use-cases/{get-product-settings-use-case.ts,update-product-settings-use-case.ts,preview-product-category-removal-use-case.ts,change-product-categories-use-case.ts,preview-product-unit-change-use-case.ts,change-product-unit-use-case.ts,get-product-removal-impact-use-case.ts,remove-product-use-case.ts,list-products-use-case.ts,update-product-use-case.ts,index.ts}`.
- **Contract:** `RF-01`–`RF-06`; `CA-01`–`CA-13`; list-filter portion of `CA-06` and direct recovery navigation contract.
- **Outcome:** Manager-only, tenant-safe semantic actions implement field/version behavior, category blocker mapping and recheck, numeric-preserving unit relabeling for any changed valid unit, atomic removal and retained history, post-commit existing event behavior, and inverse-accompaniment filtering without a generic update path.
- **Rules:** `documentation/rules/core-package-rules.md` (Business rules belong to use cases, Contracts belong to interfaces directories); `documentation/rules/use-case-testing-rules.md` (Use cases follow one standard shape, only use cases receive unit tests, infrastructure-free tests); `documentation/rules/code-conventions-rules.md` (Class/functions, error conventions and declaration order). No selected Rule file contains an `Antipatterns to Avoid` subsection.
- **Exit:** Review each use case against the actor/tenant/error matrix, serializable mutation boundary, stale-preview re-read, precision-before-write and post-commit event rule; run the focused Core suites in F3-T2 and confirm no repository, HTTP, database or validation-library dependency enters Core.

#### F3-T2 — Prove Core success, authorization, concurrency, precision and rollback branches

- **Status/owner:** `completed` — Builder Core
- **Depends/parallel:** Depends on F3-T1; safe in parallel with F2 and F4. Extend only existing entity fakers where a related record state is missing.
- **Paths:** `packages/core/src/mrp/use-cases/tests/{get-product-settings-use-case.test.ts,update-product-settings-use-case.test.ts,preview-product-category-removal-use-case.test.ts,change-product-categories-use-case.test.ts,preview-product-unit-change-use-case.test.ts,change-product-unit-use-case.test.ts,get-product-removal-impact-use-case.test.ts,remove-product-use-case.test.ts,list-products-use-case.test.ts}`; relevant existing fakers under `packages/core/src/mrp/domain/entities/fakers/{product-faker.ts,brand-faker.ts,product-size-faker.ts,production-faker.ts,stock-transaction-faker.ts,recipe-faker.ts,recipe-ingredient-faker.ts,product-accompaniment-faker.ts,resale-configuration-faker.ts,index.ts}` only when required by valid test data.
- **Contract:** `RF-01`–`RF-06`; `CA-01`–`CA-13` and every automated Core row in the Validation Contract.
- **Outcome:** Tests cover Manager success, Operator/foreign-product denial, every simple-field clear/validation/stale path, exact blocker mapping, category races, unchanged numeric values across all unit-dependent rows, preserved brand-unit configuration, cross-dimension success, stale/rollback behavior, complete removal and retained history, and filtered product listing.
- **Rules:** `documentation/rules/use-case-testing-rules.md` (One test file per use case, meaningful behavior, typed mocks, deterministic time and infrastructure-free tests); `documentation/rules/core-package-rules.md` (Domain faker conventions); `documentation/rules/widget-testing-rules.md` is not applicable. No selected Rule file contains an `Antipatterns to Avoid` subsection.
- **Exit:** Run `pnpm --filter @scoops/core check:code`, `pnpm --filter @scoops/core check:types` and `pnpm --filter @scoops/core test`; inspect typed `vitest-mock-extended` contracts, assertions on dependency calls and results, and absence of HTTP/database/Testcontainer setup.

### F4 — Web REST adapter, query/action boundaries and recovery routes

#### F4-T1 — Wire eight Web service operations, state adapters and validated navigation contracts

- **Status/owner:** `completed` — Builder Web
- **Depends/parallel:** Depends on F1; safe in parallel with F2 and F3. F6 owns the rendered widget tree, while this task owns the transport/search contract and its consuming route assertions.
- **Paths:** `apps/web/src/rest/services/mrp-service.ts`; remove `apps/web/src/rest/services/tests/mrp-service.test.ts`; `apps/web/src/ui/mrp/hooks/{use-product-settings-query.ts,use-update-product-settings-action.ts,use-product-category-removal-impact-query.ts,use-change-product-categories-action.ts,use-product-unit-change-preview-action.ts,use-change-product-unit-action.ts,use-product-removal-impact-query.ts,use-remove-product-action.ts,use-products-query.ts}`; `apps/web/src/routes/_authenticated/products/$productId/{settings.tsx,prices.tsx}`; `apps/web/src/routes/_authenticated/products/index.tsx`.
- **Contract:** `RF-01`–`RF-07`; `CA-01`–`CA-15`; HTTP boundary, URL recovery and invalidation rules.
- **Outcome:** Web uses `RestResponse`/ISO mapping, stable product query keys, field-local ordered mutations, server-state invalidation, 204-gated removal redirect, validated retry/focus/filter search and canonical internal navigation without a second product source or service unit-test boundary.
- **Rules:** `documentation/rules/ui-layer-rules.md` (Action hooks, shared HTTP status constants, REST adapters as factories, route constants and application wrappers); `documentation/rules/web-app-routing-rules.md` (Canonical paths, search parameters, internal navigation, route protection and generated route tree); `documentation/rules/rest-layer-rules.md` (Services implement REST contracts, Web transport owns session headers). No selected Rule file contains an `Antipatterns to Avoid` subsection.
- **Exit:** Run the consuming Web unit/route checks for exact method/path/query/body, response/error mapping, invalid-search clearing, recovery URL/history and post-success invalidation; inspect the exact Spec widget-tree ownership, keyboard/narrow-viewport states, console messages and failed requests, and capture fresh Playwright CLI screenshots for each affected design state before F4 can be marked complete. Mocked transport remains UI contract evidence only.

### F5 — REST composition and real controller integration

#### F5-T1 — Expose the Settings HTTP boundary and synchronize the MRP REST examples

- **Status/owner:** `completed` — Builder Server
- **Depends/parallel:** Depends on F2 and F3; safe in parallel with F6 after the shared HTTP contract is frozen. Controllers remain thin and one-action-per-class.
- **Paths:** `apps/server/src/mrp/rest/controllers/{get-product-settings.controller.ts,update-product-settings.controller.ts,get-product-category-removal-impact.controller.ts,change-product-categories.controller.ts,preview-product-unit-change.controller.ts,change-product-unit.controller.ts,get-product-removal-impact.controller.ts,remove-product.controller.ts,list-products.controller.ts,index.ts}`; `apps/server/src/mrp/rest/dtos/{product-settings-response.dto.ts,product-category-removal-impact-response.dto.ts,product-unit-change-preview-response.dto.ts,product-removal-impact-response.dto.ts,index.ts}`; `apps/server/src/mrp/rest/schemas/product-schemas.ts`; `apps/server/src/mrp/mrp.module.ts`; `apps/server/rest-client/mrp/products.rest`.
- **Contract:** `RF-01`–`RF-06`; `CA-01`–`CA-13`; all eight HTTP operations plus the `usedAsAccompanimentId` list contract.
- **Outcome:** Manager guards/current-account establishment, shared schemas, semantic path/query/body mapping, dedicated DTOs, expected REST errors, module providers and representative `.rest` requests are aligned with Core and no controller owns domain decisions.
- **Rules:** `documentation/rules/rest-layer-rules.md` (Grouped routes, semantic params, one controller per action, manual use-case instantiation, request-body types, documented responses, REST client examples, global errors); `documentation/rules/controllers-testing-rules.md` (Real HTTP boundary); `documentation/rules/code-conventions-rules.md` (Aliases, declarations and known errors). No selected Rule file contains an `Antipatterns to Avoid` subsection.
- **Exit:** Run focused Server code/type checks and inspect Swagger statuses, DTO field allowlists, schema registration, Manager guard, route params, REST examples and provider tokens; the task cannot exit until F5-T2 demonstrates real request/response and persistence/authorization outcomes for every affected server-backed operation.

#### F5-T2 — Prove real HTTP, tenant isolation, transaction rollback and retained history

- **Status/owner:** `completed` — Builder Server
- **Depends/parallel:** Depends on F5-T1; safe in parallel with F6. Reuse the existing MRP fixture and shared Database/Rest fixtures; do not add repository-direct tests.
- **Paths:** `apps/server/src/mrp/fixtures/mrp-module-fixture.ts`; `apps/server/src/mrp/rest/controllers/tests/{get-product-settings.controller.test.ts,update-product-settings.controller.test.ts,get-product-category-removal-impact.controller.test.ts,change-product-categories.controller.test.ts,preview-product-unit-change.controller.test.ts,change-product-unit.controller.test.ts,get-product-removal-impact.controller.test.ts,remove-product.controller.test.ts,list-products.controller.test.ts,mrp-controller-test-helpers.ts}`.
- **Contract:** `RF-01`–`RF-06`; `CA-01`–`CA-13`; every Server controller/persistence row in the Validation Contract.
- **Outcome:** Testcontainers-backed route suites assert status/body/date/null serialization, Manager/Operator/anonymous/foreign tenant behavior, strict inputs, preview/confirm races, current-row numeric preservation/removal, injected rollback and readable historical transactions/productions with other products intact.
- **Rules:** `documentation/rules/controllers-testing-rules.md` (Controller tests are integration tests, real infrastructure, fixtures, isolation and HTTP/persistence assertions); `documentation/rules/database-layer-rules.md` (Repositories do not receive tests, generated migration and module ownership); `documentation/rules/rest-layer-rules.md` (Documented route/error contract). No selected Rule file contains an `Antipatterns to Avoid` subsection.
- **Exit:** Run `pnpm --filter server check:code`, `pnpm --filter server check:types`, `pnpm --filter server test` and the migration clean/upgrade validation; inspect real HTTP response, database state, authorization result, rollback state and retained-history queries for every relevant endpoint. Mocked transport is not accepted for this exit.

### F6 — Settings widgets, dialogs and browser route coverage

#### F6-T1 — Compose the Settings slot and all accessible cards/dialogs

- **Status/owner:** `completed` — Builder Web
- **Depends/parallel:** Depends on F4; safe in parallel with F5. Reuse Builder Web context across F4 and F6; no path overlap with the Web adapter/routes owned by F4.
- **Paths:** Remove placeholder files `apps/web/src/ui/mrp/widgets/slots/product-details-placeholder-slot/{index.tsx,use-product-details-placeholder-slot.ts,tests/product-details-placeholder-slot.test.tsx,tests/use-product-details-placeholder-slot.test.ts}`; create `apps/web/src/ui/mrp/widgets/slots/product-settings-slot/{index.tsx,use-product-settings-slot.ts,product-settings-loading/index.tsx,product-settings-error/index.tsx,basic-information-card/{index.tsx,use-basic-information-card.ts},stock-control-card/{index.tsx,use-stock-control-card.ts},product-categories-card/{index.tsx,use-product-categories-card.ts},internal-notes-card/{index.tsx,use-internal-notes-card.ts},category-dependency-dialog/{index.tsx,use-category-dependency-dialog.ts},unit-change-dialog/{index.tsx,use-unit-change-dialog.ts},product-danger-zone/index.tsx,remove-product-dialog/{index.tsx,use-remove-product-dialog.ts}}`; modify `apps/web/src/ui/shared/widgets/components/icon/{types/icon-name.ts,lucide-icon/icons.ts}` and the registration `BrandEditor` with the approved per-brand Unit field.
- **Contract:** `RF-01`–`RF-07`; `CA-01`–`CA-15`; all nine manifest references and approved design deviations.
- **Outcome:** The shared product shell renders the Settings widget tree with immutable stock control, field-appropriate saves, category exclusivity/blockers/retry intent, numeric-preserving unit relabel flow for every valid target, retained-history removal impact and explicit loading/pending/error/focus states using existing tokens, primitives and Lucide wrappers; product registration persists an independently configured unit per brand.
- **Rules:** `documentation/rules/ui-layer-rules.md` (Stateful widgets, nested widget structure, owning hooks, shared wrappers, status constants and design-system implementation); `documentation/design.md` (Tokens, Modal/Blocking/Destructive dialogs, Category card, Danger Zone, responsive/focus/reduced-motion rules). No selected Rule file contains an `Antipatterns to Avoid` subsection.
- **Exit:** Compare the exact Spec widget tree against `Fa5wO`, `qIePb`, `sATbF`, `C0bvNK`, `YsyKL`, `uT6Rn`, `x4MQHd`, `XzPz2` and `O11tq`, including approved deviations; exercise keyboard and 390×844 behavior, focus return, pending/error states, console and failed-request inspection, and capture a fresh Playwright CLI screenshot for every affected reference and supplemental state. Do not use `design/onoreo.pen` or introduce parallel tokens/components.

#### F6-T2 — Cover public widget behavior and mocked browser transport

- **Status/owner:** `completed` — Builder Web
- **Depends/parallel:** Depends on F6-T1; safe in parallel with F5-T2. Route suites use the shared Playwright fixture and mocked transport only; they do not claim server persistence/auth evidence.
- **Paths:** `apps/web/src/ui/mrp/widgets/slots/product-settings-slot/tests/{product-settings-slot.test.tsx,use-product-settings-slot.test.ts,basic-information-card/tests/basic-information-card.test.tsx,stock-control-card/tests/stock-control-card.test.tsx,product-categories-card/tests/product-categories-card.test.tsx,internal-notes-card/tests/internal-notes-card.test.tsx,category-dependency-dialog/tests/category-dependency-dialog.test.tsx,unit-change-dialog/tests/unit-change-dialog.test.tsx,remove-product-dialog/tests/remove-product-dialog.test.tsx}`; `apps/web/tests/routes/mrp/{products.$productId.settings.test.ts,products.index.test.ts,products.$productId.prices.test.ts,products.$productId.placeholders.test.ts}`.
- **Contract:** `RF-01`–`RF-07`; `CA-01`–`CA-15`; `MV-01`–`MV-03` browser-visible portions and every Web test inventory row.
- **Outcome:** Component tests cover owning-hook public state, dialogs, focus and recovery; hook tests cover slot orchestration; route tests cover mocked methods/paths/bodies, search/redirect/history, protected shell, loading/error/pending/validation and narrow screenshot checkpoints.
- **Rules:** `documentation/rules/widget-testing-rules.md` (Public owning-widget boundary, state matrix, accessible queries, hook mocks, canonical constants, route integration boundary); `documentation/rules/web-app-routing-rules.md` (Mandatory route coverage matrix, shared Playwright fixture, failure boundaries); `documentation/rules/ui-layer-rules.md` (Query/action hooks and no Web service tests). No selected Rule file contains an `Antipatterns to Avoid` subsection.
- **Exit:** Run `pnpm --filter web generate-routes`, `pnpm --filter web check:code`, `pnpm --filter web check:types`, `pnpm --filter web test` and the focused Playwright route suite; inspect final URL, accessible roles/names, request method/path/query/body, response state, keyboard/narrow viewport, console and failed network requests, with fresh screenshot paths recorded for each design state. Generated route metadata is reviewed by the Orchestrator and never hand-edited.

### F7 — Integrated conformance and handoff

#### F7-T1 — Validate one integrated revision-1 candidate and prepare conclusion

- **Status/owner:** `completed` — Orchestrator
- **Depends/parallel:** Starts only after F5 and F6 diffs are integrated; runs required sensors in parallel with exactly one read-only [`Integrated Reviewer`](../../../agents/implementation-reviewer-agent.md), who checks the complete candidate and all affected Core, Validation, Server, database, Web, route, migration, visual and recovery surfaces.
- **Paths:** `documentation/features/mrp/products-details-page-settings-tab/plan.md`; `documentation/features/mrp/products-details-page-settings-tab/evaluation.md`; generated migration/meta files and `apps/web/src/routeTree.gen.ts` under Orchestrator ownership; no new product source path.
- **Contract:** All `RF-01`–`RF-07`, `CA-01`–`CA-15`, `MV-01`–`MV-03`, supplied design references, supplemental-state decisions and final handoff condition.
- **Outcome:** The integrated candidate has current command evidence, real services/accounts/fixtures, migration review, exact Spec tree/conformance comparisons, current screenshot identifiers and complete acceptance mapping. EV-26 is the accepted exact route gate; EV-28 documents unrelated serial browser-harness instability and EV-29 independently rechecks the affected Pricing route. FND-032 was corrected by Builder Server, and current-head Core/Server/Web CI passes in EV-31.
- **Rules:** `documentation/sdd.md` (Plan ledger, living Evaluation, integrated validation, Reviewer and conclusion lifecycle); `documentation/tooling.md` (workspace checks, migration/build/browser workflow); `documentation/design.md` and all selected layer/testing Rules for final conformance. No selected Rule file contains an `Antipatterns to Avoid` subsection.
- **Exit:** Run the full Spec command list, `docker compose ps` and required health checks, explicit auth setup only when seed accounts are absent, persistent Server/Web validation with Playwright CLI, MV-01 desktop simple saves and both unit paths, MV-02 390×844 keyboard category recovery, MV-03 removal rollback/access isolation, every supplied/supplemental visual comparison, console/network classification and final reviewer recheck. Keep F7 `in_progress` through corrections; route to `conclude-spec` only when every task/phase is complete, all transient artifact identifiers are recorded, all verified findings are resolved and no blocker remains.

### F9 — Accompaniment recovery correction

#### F9-T1 — Correct reverse-dependency navigation and focused coverage

- **Status/owner:** `completed` — Builder Web
- **Depends/parallel:** Resumed after the user-reported F7/F6 recovery discrepancy; no cross-layer contract change was required.
- **Paths:** `apps/web/src/ui/mrp/widgets/slots/product-settings-slot/category-dependency-dialog/use-category-dependency-dialog.ts`; colocated hook test.
- **Contract:** `CA-06`, `CA-14`; existing `usedAsAccompanimentId` list-filter contract.
- **Outcome:** `Ver produtos` keeps the dependent product as the visible context but sends the removed accompaniment product ID to the products list filter.
- **Exit:** Focused hook tests, Web type check, targeted Biome check and the Products route Playwright filter test pass; no visual state changed.

## Validation and handoff

| Type | Scenario/surface | Criteria | Reference | Evidence target | Status |
| --- | --- | --- | --- | --- | --- |
| Automated | Core semantic use-case suites and list filter | `CA-01`–`CA-13` | Spec Validation Contract / F3-T2 | `./evaluation.md` | `passed` |
| Automated | Server controller and Testcontainers persistence suites | `CA-01`–`CA-13` | Spec Validation Contract / F5-T2 | `./evaluation.md` | `passed` |
| Automated | Web widget and mocked route suites | `CA-01`–`CA-15` | Spec Validation Contract / F6-T2 | `./evaluation.md` | `passed` (EV-26; EV-28 environment-only rerun recorded) |
| Runtime | Manager desktop settings, simple saves and numeric-preserving unit paths | `CA-01`–`CA-03`, `CA-07`, `CA-08`, `CA-11`, `CA-13`, `CA-14` | Spec `MV-01` | `./evaluation.md` plus database assertions | `passed` |
| Manual | 390×844 keyboard category recovery and retry navigation | `CA-04`–`CA-06`, `CA-14`, `CA-15` | Spec `MV-02` | `./evaluation.md` plus URL/focus evidence | `passed` |
| Runtime | Product removal impact, rollback, success and access isolation | `CA-09`–`CA-12`, `CA-14`, `CA-15` | Spec `MV-03` | `./evaluation.md` plus database/access evidence | `passed` |
| Visual | Populated desktop settings | `CA-01`, `CA-02`, `CA-04`, `CA-14`, `CA-15` | `./design/Fa5wO.png` at 1560×1450 | Playwright `test-results/` screenshot + `./evaluation.md` | `passed_with_authorized_difference` |
| Visual | Ingredient dependency dialog | `CA-05`, `CA-06` | `./design/qIePb.png` at 684×489 export / 520×336 component | Playwright `test-results/` screenshot + `./evaluation.md` | `passed_with_authorized_difference` |
| Visual | Manufacturable dependency dialog | `CA-06` | `./design/sATbF.png` at 670×522 export / 520×372 component | Playwright `test-results/` screenshot + `./evaluation.md` | `passed_with_authorized_difference` |
| Visual | Accompaniment dependency dialog | `CA-06` | `./design/C0bvNK.png` at 684×489 export / 520×336 component | Playwright `test-results/` screenshot + `./evaluation.md` | `passed_with_authorized_difference` |
| Visual | Resale dependency dialog | `CA-06` | `./design/YsyKL.png` at 684×489 export / 520×329 component | Playwright `test-results/` screenshot + `./evaluation.md` | `passed_with_authorized_difference` |
| Visual | Portion dependency dialog | `CA-06` | `./design/uT6Rn.png` at 684×507 export / 520×353 component | Playwright `test-results/` screenshot + `./evaluation.md` | `passed_with_authorized_difference` |
| Visual | Unit change warning | `CA-07`, `CA-08` | `./design/x4MQHd.png` at 596×389 export / 440×230 component | Playwright `test-results/` screenshot + `./evaluation.md` | `superseded_by_contract_amendment` |
| Visual | Product removal confirmation | `CA-09`–`CA-11` | `./design/O11tq.png` at 710×535 export / 560×385 component | Playwright `test-results/` screenshot + `./evaluation.md` | `passed_with_authorized_difference` |
| Visual | Unit impact and numeric-preservation dialog | `CA-07`, `CA-08`, `CA-11` | `./design/x4MQHd.png` reference plus fresh desktop state | `apps/web/test-results/f8-unit-preservation-dialog-1560x1450.png` + `./evaluation.md` | `passed_with_authorized_difference` |
| Visual | Settings loading — desktop | `CA-02`, `CA-14`, `CA-15` | Manifest supplemental decision at 1560×1450 | Playwright `test-results/` screenshot + `./evaluation.md` | `passed_with_authorized_difference` |
| Visual | Save pending — desktop | `CA-02`, `CA-03`, `CA-14`, `CA-15` | Manifest supplemental decision at 1560×1450 | Playwright `test-results/` screenshot + `./evaluation.md` | `passed_with_authorized_difference` |
| Visual | Recoverable save error — desktop | `CA-03`, `CA-11`, `CA-14`, `CA-15` | Manifest supplemental decision at 1560×1450 | Playwright `test-results/` screenshot + `./evaluation.md` | `passed_with_authorized_difference` |
| Visual | Settings loading — narrow | `CA-14`, `CA-15` | Manifest supplemental decision at 390×844 | Playwright `test-results/` screenshot + `./evaluation.md` | `passed_with_authorized_difference` |
| Visual | Save pending — narrow | `CA-02`, `CA-14`, `CA-15` | Manifest supplemental decision at 390×844 | Playwright `test-results/` screenshot + `./evaluation.md` | `passed_with_authorized_difference` |
| Visual | Recoverable save error — narrow | `CA-03`, `CA-11`, `CA-14`, `CA-15` | Manifest supplemental decision at 390×844 | Playwright `test-results/` screenshot + `./evaluation.md` | `passed_with_authorized_difference` |
| Visual | Product-removal failure — narrow | `CA-11`, `CA-15` | Manifest supplemental decision at 390×844 | Playwright `test-results/` screenshot + `./evaluation.md` | `passed_with_authorized_difference` |
| Visual | Narrow Settings layout and keyboard focus sequence | `CA-15` | Manifest supplemental decision at 390×844 | Playwright `test-results/` screenshot + `./evaluation.md` | `passed_with_authorized_difference` |

The final handoff requires every task and phase to be `completed`; the Spec command list to be current on the integrated revision; generated migration/meta and route artifacts reviewed; services, Manager/Operator accounts and fixtures ready; every `MV-*` executable; all screenshot paths and comparison verdicts recorded; the exact Spec tree/conformance comparison passed; all supplemental-state decisions resolved; the single Integrated Reviewer completed and rechecked after any correction; every verified finding resolved; and no blocker active. Then route directly to `conclude-spec`.
