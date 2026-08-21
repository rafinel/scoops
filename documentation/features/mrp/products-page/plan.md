---
title: MRP product catalog and registration — implementation plan
status: completed
spec: ./spec.md
spec_revision: 16
evaluation: ./evaluation.md
github_issue: https://github.com/rafinel/scoops/issues/8
updated_at: 2026-08-18
---

# Execution status

- **Spec:** [`./spec.md`](./spec.md), revision 16, `open`.
- **Rationale:** Plan-backed `implement-spec` is required because the feature crosses Core, server persistence/REST, web transport/UI, generated artifacts, database-backed fixtures, and manual/visual validation.
- **Current phase:** F4 completed.
- **Next action:** No remaining implementation action; PR CI passed and delivery is ready for review.
- **Active blockers:** None. `bi8Au.png` is preserved as the explicitly excluded product-detail reference; it is not an implementation or comparison target for this Spec revision.
- **Coordination:** F2-T1 owns the shared Drizzle schema, generated migration/journal artifacts, and MRP repository tokens. F3-T2 owns `apps/web/src/routeTree.gen.ts` through route generation. No package or lockfile change is planned; any dependency change is coordinated before parallel application work.

# Execution ledger

| Wave | Lane | Phase | Name | Depends on | Parallel with | Status | Exit condition |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Core | F1 | Establish the authoritative MRP catalog and registration contracts | — | — | `completed` | Core contracts, use cases, and unit tests cover RF-01–RF-07 and pass Core checks. |
| 2 | Server DB | F2 | Deliver tenant-scoped MRP persistence and migration | F1 | F2 Web Transport | `completed` | Models, generated migrations 0004/0005, repositories, and database wiring pass server checks. |
| 2 | Web Transport | F2 | Deliver the browser MRP service and REST context composition | F1 | F2 Server DB | `completed` | Service/context tests prove exact list and registration transport mapping and shared error preservation. |
| 3 | Server REST | F3 | Expose manager-guarded catalog and registration endpoints | F1, F2 Server DB | F3 Web UI | `completed` | Real server-backed Playwright flows prove HTTP, authorization, persistence, error, and event contracts. |
| 3 | Web UI | F3 | Implement the authenticated catalog, filters, registration dialogs, and route | F1, F2 Web Transport | F3 Server REST | `completed` | Web unit/component tests, generated route metadata, focused Playwright coverage, and supplied-reference comparisons prove the UI contract. |
| 4 | Orchestrator | F4 | Integrate, validate, capture evidence, and hand off | F3 Server REST, F3 Web UI | — | `completed` | All checks, MV scenarios, reference comparisons, generated artifacts, and handoff conditions are complete with no blocking finding. |

### F1 — Authoritative Core contracts and use cases

#### F1-T1 — Implement catalog and registration domain contracts

- **Status/owner:** `completed` — Builder F1-T1
- **Depends/parallel:** No dependencies; all F2 work waits for these stable Core contracts.
- **Paths:** `packages/core/src/mrp/domain/structures/**` (existing structure boundary for the Spec’s catalog/actor/input types), `packages/core/src/mrp/interfaces/**`, `packages/core/src/mrp/use-cases/**`, `packages/core/src/mrp/domain/entities/fakers/**`, and colocated Core use-case tests.
- **Contract:** RF-01, RF-02, RF-03, RF-04, RF-05, RF-06, RF-07; CA-01, CA-03, CA-04, CA-06–CA-09; authoritative type and use-case details in Spec §3.
- **Outcome:** `ListProductsUseCase` normalizes and validates tenant-scoped catalog queries; `RegisterProductUseCase` validates registration, initializes single or by-brand stock from the requested initial quantities, distinguishes duplicate conflicts, and publishes `ProductCreatedEvent._NAME` only after persistence succeeds. Existing product contracts remain authoritative and no detail-page behavior is added.
- **Rules:** `documentation/rules/code-conventions-rules.md` (naming, declarations, errors, factories); `documentation/rules/core-package-rules.md` (one exported type per file, business rules in use cases, contracts in interfaces, entity identity); `documentation/rules/use-case-testing-rules.md` (standard use-case shape, one test per use case, typed mocks, infrastructure-free tests). No dedicated `Antipatterns to Avoid` subsection exists in these rules.
- **Exit:** Run `pnpm --filter @scoops/core check:code`, `pnpm --filter @scoops/core check:types`, and `pnpm --filter @scoops/core test`; retain evidence for every registration and list rule in `./evaluation.md` at implementation kickoff. **Result:** passed on candidate working tree; focused use-case tests passed (2 files, 4 tests), full suite passed (23 files, 57 tests).

### F2 — Cross-layer foundations

#### F2-T1 — Deliver MRP persistence, migration, and seed support

- **Status/owner:** `completed` — Builder F2-T1
- **Depends/parallel:** Depends on F1-T1’s Core repository contracts; runs in parallel with F2-T2; owns all shared Drizzle schema and migration-generated files.
- **Paths:** `apps/server/src/mrp/database/**`, `apps/server/src/mrp/constants/**`, `apps/server/src/shared/database/drizzle/schema.ts`, `apps/server/src/shared/database/drizzle/migrations/0004_mrp_products.sql` or the generated equivalent, and generated migration metadata/journal owned by Drizzle tooling.
- **Contract:** RF-01, RF-03, RF-06, RF-07; CA-01, CA-03, CA-04, CA-07–CA-09; Spec §3 data model and repository/persistence contract.
- **Outcome:** MRP-owned product, brand-read, and stock-balance models, mappers, tenant-scoped repository, atomic initial-balance registration, module database provider, migration, and deterministic module seeder are available without importing Identity persistence models.
- **Rules:** `documentation/rules/code-conventions-rules.md` (aliases, naming, error handling); `documentation/rules/database-layer-rules.md` (module ownership, model declarations, persistence types, mappers, Core repository contracts, symbol tokens, seeders, generated migrations). No dedicated `Antipatterns to Avoid` subsection exists in these rules.
- **Exit:** Generate the migration with the documented Drizzle command, review the SQL and journal/snapshots against the Spec’s columns, indexes, constraints, relationships, and numeric/date types, then run `pnpm --filter server check:code` and `pnpm --filter server check:types`. **Result:** generated migrations 0004/0005 reviewed; server checks and server test suite passed.

#### F2-T2 — Compose the browser MRP service and REST context

- **Status/owner:** `completed` — Builder F2-T2
- **Depends/parallel:** Depends on F1-T1’s `MrpService` and catalog contracts; runs in parallel with F2-T1; does not edit feature UI widgets or the generated route tree.
- **Paths:** `apps/web/src/rest/services/mrp-service.ts`, `apps/web/src/rest/services/tests/mrp-service.test.ts`, `apps/web/src/ui/shared/contexts/rest-context/types/**`, `apps/web/src/ui/shared/contexts/rest-context/use-rest-context-provider.ts`, and the owning REST context test only where its public value changes.
- **Contract:** RF-02, RF-03, RF-05, RF-07; CA-03, CA-04, CA-08; Spec §3 Web transport and route contract.
- **Outcome:** The service factory implements exactly `listProducts` and `registerProduct`, serializes repeated category query values, sends only allowed registration fields, maps dates and successful responses, preserves the shared error envelope, and is composed as `mrpService` through the existing context/client boundary.
- **Rules:** `documentation/rules/code-conventions-rules.md` (factory and declaration conventions); `documentation/rules/rest-layer-rules.md` (service contracts, factories, session-header boundary, shared errors); `documentation/rules/ui-layer-rules.md` (REST adapter factories and context composition); `documentation/rules/widget-testing-rules.md` only for the changed context boundary test. No dedicated `Antipatterns to Avoid` subsection exists in these rules.
- **Exit:** Run focused service/context Vitest tests, then `pnpm --filter web check:code` and `pnpm --filter web check:types`; verify no service creates a second client or implements business rules. **Result:** focused service tests passed (2 tests); web checks passed with four pre-existing global.css warnings.

### F3 — Application surfaces

#### F3-T1 — Wire manager-guarded MRP REST actions and integration fixtures

- **Status/owner:** `completed` — Builder F3-T1
- **Depends/parallel:** Depends on F1-T1 and F2-T1; runs in parallel with F3-T2; owns MRP REST composition and server fixture paths, not the shared database foundation.
- **Paths:** `apps/server/src/mrp/rest/**`, `apps/server/src/mrp/decorators/**`, `apps/server/src/mrp/fixtures/**`, `apps/server/src/mrp/mrp.module.ts`, `apps/server/rest-client/mrp/products.rest`, and the two MRP controller integration test files under `apps/server/src/mrp/rest/controllers/tests/**`.
- **Contract:** RF-01, RF-02, RF-03, RF-04, RF-05, RF-06, RF-07; CA-01–CA-04, CA-06–CA-09; Spec §3 Server REST contract and Tests and fixtures matrix.
- **Outcome:** `GET /products` and `POST /products` use the existing authentication/profile guards, derive request types from Core use cases, map shared errors and Swagger responses, bind MRP dependencies through module tokens, publish the required event after successful registration, and expose executable REST examples. Real fixtures cover two establishments and the required stock/category/status combinations.
- **Rules:** `documentation/rules/code-conventions-rules.md` (server aliases, handlers, errors); `documentation/rules/rest-layer-rules.md` (group decorators, one controller per action, request types, Swagger statuses, REST examples, global error boundary); `documentation/rules/controllers-testing-rules.md` (real Nest/Supertest path, `RestFixture`/`DatabaseFixture`, isolation, persistence assertions); `documentation/rules/server-app-layer-rules.md` (feature module composition boundaries). No dedicated `Antipatterns to Avoid` subsection exists in these rules.
- **Exit:** Run the focused controller integration tests with Docker-backed PostgreSQL, `pnpm --filter server check:code`, `pnpm --filter server check:types`, `pnpm --filter server test`, and `pnpm --filter server build`; retain HTTP, persistence, authorization, and event evidence. **Result:** real Playwright manager flows passed for catalog, registration, and repeated category filters; final operator/unauthenticated authorization evidence is recorded in `evaluation.md`.

#### F3-T2 — Implement the authenticated products catalog and registration UI

- **Status/owner:** `completed` — Builder F3-T2
- **Depends/parallel:** Depends on F1-T1 and F2-T2; runs in parallel with F3-T1; owns the generated route tree and all MRP web UI/test paths.
- **Paths:** `apps/web/src/routes/_authenticated/products/index.tsx`, `apps/web/src/ui/mrp/**`, `apps/web/tests/routes/mrp/**`, and generated `apps/web/src/routeTree.gen.ts` produced by the route generator.
- **Contract:** RF-01, RF-02, RF-03, RF-04, RF-05, RF-06, RF-07, RF-08; CA-01–CA-08, CA-10, CA-11; MV-01–MV-05; Spec §3 Web widget contract, Tests and fixtures, and design manifest.
- **Outcome:** The protected `/products` route renders the catalog with URL-owned search/filter/sort/page state, query/action hooks, KPI/list/empty/error/loading states, accessible filter and registration dialogs for both stock variants, initial-stock and negative-stock registration semantics, retry and focus restoration, and the intentional omission of inline brand management. The implementation maps existing design tokens and treats `bi8Au.png` as out of scope.
- **Rules:** `documentation/rules/code-conventions-rules.md` (hooks, handlers, declaration order); `documentation/rules/ui-layer-rules.md` (stateful widget directories, hook ownership, action/query hooks, semantic controls, shared wrappers, REST context, design tokens); `documentation/rules/web-app-routing-rules.md` (thin protected route, search validation, canonical route, generated tree, route integration); `documentation/rules/widget-testing-rules.md` (real owning composition, state matrix, accessible assertions, hook/component boundaries); `apps/web/AGENTS.md` (run the matching TanStack Intent guidance before editing TanStack route/search/auth files); `documentation/design.md` (tokens, typography, responsive/focus/reduced-motion behavior). No dedicated `Antipatterns to Avoid` subsection exists in these rules.
- **Exit:** Before web edits, run the matching TanStack Intent command from `apps/web/AGENTS.md`. Then run `pnpm --filter web generate-routes`, focused Vitest tests for hooks/widgets, `pnpm --filter web check:code`, `pnpm --filter web check:types`, and `pnpm --filter web exec playwright test tests/routes/mrp/products.index.test.ts` for route/UI evidence. **Result:** route generation, web checks, full web Vitest suite, and focused Playwright CLI coverage passed; desktop and 320×900 screenshots were captured in transient Playwright output.

### F4 — Integrated validation and handoff

#### F4-T1 — Execute full validation and capture implementation evidence

- **Status/owner:** `completed` — Orchestrator F4-T1
- **Depends/parallel:** Depends on F3-T1 and F3-T2; runs as the final integrated activity after all generated artifacts and fixtures are reviewed.
- **Paths:** `documentation/features/mrp/products-page/evaluation.md` and no production source paths unless a finding requires the owning task to reopen. Implementation screenshots remain transient Playwright or CI artifacts.
- **Contract:** RF-01–RF-08, CA-01–CA-11, MV-01–MV-05, and the completion gate in Spec §4.
- **Outcome:** Integrated Core/server/web validation, real manager/tenant fixtures, browser behavior, console/network review, keyboard and 320px responsive evidence, and four supplied-reference comparisons are recorded. The 320px target is a supplemental implementation state at 320×900 based on the manifest’s width-only requirement; the exact captured viewport is recorded in `evaluation.md`.
- **Rules:** `documentation/tooling.md` (workspace commands, Docker, Drizzle, Playwright, generated routes); `documentation/rules/web-app-routing-rules.md` (focused route integration and middleware/URL/request evidence); repository `AGENTS.md` Playwright workflow (health checks, persistent app processes, console/network inspection, teardown). No dedicated `Antipatterns to Avoid` subsection exists in these rules.
- **Exit:** Run `pnpm --filter @scoops/core check:code`, `pnpm --filter @scoops/core check:types`, `pnpm --filter @scoops/core test`, `pnpm --filter server check:code`, `pnpm --filter server check:types`, `pnpm --filter server test`, `pnpm --filter server build`, `pnpm --filter web generate-routes`, `pnpm --filter web check:code`, `pnpm --filter web check:types`, `pnpm --filter web test`, and `pnpm --filter web test:integration -- tests/routes/mrp/products.index.test.ts` on the integrated commit; inspect `docker compose ps` and required health endpoints; start and stop server/web processes for full-stack evidence; execute every MV scenario; capture every required screenshot; review migration/journal and generated route artifacts; resolve all findings; then route directly to `conclude-spec`.

# Validation and handoff

| Type | Scenario/surface | Criteria | Reference | Evidence target | Status |
| --- | --- | --- | --- | --- | --- |
| Runtime | Tenant-scoped manager catalog and registration | CA-01 | Core/server contracts; MV-04 | `./evaluation.md` | `passed` |
| Runtime | Authentication and manager authorization | CA-02 | REST guards; MV-04 | `./evaluation.md` | `passed` |
| Runtime | Filter composition and URL/request synchronization | CA-03 | Spec CA-03; MV-02 | `./evaluation.md` | `passed` |
| Runtime | Deterministic sorting, pagination, and filtered KPIs | CA-04 | Spec CA-04; MV-01/MV-02 | `./evaluation.md` | `passed` |
| Manual | Populated catalog state | MV-01 | Spec MV-01; `AXNGh` | `./evaluation.md` | `passed` |
| Runtime | Empty catalog versus filtered-empty state | CA-05 | Spec CA-05; MV-02 | `./evaluation.md` | `passed` |
| Manual | Query states, retry, clear filters, and focus order | MV-02 | Spec MV-02 | `./evaluation.md` | `passed` |
| Runtime | Required registration fields and inline feedback | CA-06 | Spec CA-06; MV-03 | `./evaluation.md` | `passed` |
| Runtime | Duplicate/category/stock/ideal-stock validation | CA-07 | Core and database contracts; MV-03 | `./evaluation.md` | `passed` |
| Runtime | Active initial-stock registration and event timing | CA-08 | Spec CA-08; MV-03 | `./evaluation.md` | `passed` |
| Runtime | Cross-establishment isolation | CA-09 | Database fixture; MV-04 | `./evaluation.md` | `passed` |
| Manual | Authorization and tenant isolation | MV-04 | Spec MV-04 | `./evaluation.md` | `passed` |
| Runtime | Responsive, keyboard, focus, and overflow behavior | CA-10 | Spec CA-10; MV-05 | `./evaluation.md` | `passed — focused Playwright CLI` |
| Runtime | Transport failure, retry, and pending recovery | CA-11 | Spec CA-11; MV-02/MV-04 | `./evaluation.md` | `passed — focused Playwright CLI` |
| Manual | Registration variants and initial-stock/by-brand sum | MV-03 | Spec MV-03; `XzPz2`/`LPdBK` | `./evaluation.md` | `passed` |
| Manual | Responsive and keyboard path at 320×900 | MV-05 | Spec MV-05; manifest supplemental responsive requirement | `./evaluation.md` | `passed — focused Playwright CLI; screenshot captured` |
| Visual | Populated products catalog — 1481×1450 | CA-04, CA-10 | `./design/AXNGh.png` | Playwright `test-results/` artifact, not retained in feature docs | `passed; shadcn Table and KPI hierarchy aligned` |
| Visual | Product filters dialog — 677×601 | CA-03, CA-10 | `./design/DsR63.png` | Playwright `test-results/` artifact, not retained in feature docs | `passed; grouped pills, summary, clear, cancel/apply aligned` |
| Visual | New product by brand — 727×1240 | CA-06, CA-07, CA-10 | `./design/XzPz2.png` | Playwright `test-results/` artifact, not retained in feature docs | `passed; registration-time brand rows and calculated initial stock visible` |
| Visual | New product single stock — 708×826 | CA-06, CA-07, CA-10 | `./design/LPdBK.png` | Playwright `test-results/` artifact, not retained in feature docs | `passed; initial-stock input visible` |
| Visual | Responsive catalog/dialogs — 320×900 | CA-10 | Manifest supplemental responsive requirement | Playwright `test-results/` artifact, not retained in feature docs | `passed; no page-level horizontal overflow` |

Final handoff requires every task and phase to be `completed`, the Spec validation commands to be current on the integrated commit, migration/journal and generated route artifacts reviewed, real manager/tenant fixtures and required services available, every `MV-*` executable, every supplied reference comparison recorded with its transient artifact identifier, the 320px supplemental decision resolved, and no blocking finding active. Route the completed Spec directly to `conclude-spec`.
