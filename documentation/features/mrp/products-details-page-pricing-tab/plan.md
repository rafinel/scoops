---
title: Product details pricing tab — implementation plan
status: completed
spec: ./spec.md
spec_revision: 1
evaluation: ./evaluation.md
github_issue: https://github.com/rafinel/scoops/issues/17
updated_at: 2026-08-24
---

## Execution status

- **Spec:** [`spec.md`](./spec.md) — revision `1`, `completed`.
- **Rationale:** Plan-backed execution is required because the feature spans Core, Validation, transactional Server persistence and migration generation, REST composition, generated routing, design-backed Web surfaces, concurrency/security checks and complex manual/runtime validation.
- **Current phase:** F6 integrated conformance and conclusion (`completed`); all source, generated-artifact, automated, runtime, manual, visual and PR CI evidence is complete.
- **Next action:** No further implementation action; draft PR #19 is ready for human review and merge authorization.
- **Active blockers:** None. The existing malformed local `.env` parser error remains a non-blocking environment finding (`FND-005`); healthy service probes and an isolated `:3337` Server replay supplied the required live evidence.
- **Builders:** Wave 2 assignments completed with `Builder Server` agent `01a02ff0-c404-7842-8544-47a154b51b2e` for F2/F5, the reused `Builder Core` agent `01a02fe8-e1f0-79f0-9e0b-59774d45c186` for F3, and the reused `Builder Web` agent `01a02ff0-b12a-7492-929c-0d39c8eab361` for F4. The single `Integrated Reviewer` agent `01a03020-4c4a-7f50-a82d-ab1b0fec6ae9` completed the final read-only recheck with no source findings.
- **Coordination:** The Orchestrator owns this Plan, `evaluation.md`, package/lockfile or root-configuration changes, generated migration `0010` and Drizzle metadata, `apps/web/src/routeTree.gen.ts`, final integration and official evidence verdicts. No dependency installation is planned.

## Execution ledger

| Wave | Builder | Phase | Name | Depends on | Parallel with | Status | Exit condition |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | `Builder Core` | F1 | Shared domain and validation contracts | — | — | `completed` | Core and Validation checks pass; all public pricing contracts and boundary schemas match Spec revision 1. |
| 2 | `Builder Server` | F2 | Transactional pricing persistence | F1 | F3, F4 | `completed` | Models, mappers, tenant-qualified repositories, transaction scope and migration inputs satisfy the persistence Contract. |
| 2 | `Builder Core` | F3 | Pricing use cases and unit coverage | F1 | F2, F4 | `completed` | Five deterministic Core use-case suites prove authorization, projection, validation, final-active concurrency and future-only behavior. |
| 2 | `Builder Web` | F4 | Pricing route and Manager experience | F1 | F2, F3 | `completed` | The exact pricing widget tree, mocked REST/browser matrix, responsive states, supplied design comparisons and all Reviewer corrections are implemented and exercised. |
| 3 | `Builder Server` | F5 | REST composition and controller integration | F2, F3 | — | `completed` | Six controllers and their real HTTP integration suites pass mapping, authorization, tenant, persistence, constraint and no-PDV-side-effect checks. |
| 4 | `Orchestrator` | F6 | Integrated conformance and handoff | F4, F5 | Integrated Reviewer | `completed` | Current revision-1 candidate passes final Core/Validation/Server/Web checks, migration generation/apply, builds, focused Playwright, MV-01, MV-02 and all supplied/supplemental visual comparisons; Evaluation is ready for conclusion. |

### F1 — Shared domain and validation contracts

#### F1-T1 — Establish canonical pricing entities, structures, interfaces and schemas

- **Status/owner:** `pending` — Builder Core
- **Depends/parallel:** Starts after the Orchestrator records Spec revision 1, this task, its exact paths, criteria, Rules, design references and exits; no parallel task in F1.
- **Paths:** `packages/core/src/mrp/domain/entities/{product-size.ts,resale-configuration.ts,index.ts}`, `packages/core/src/mrp/domain/structures/{product-size-create.ts,product-size-update.ts,resale-configuration-create.ts,resale-configuration-update.ts,register-product-size-input.ts,update-product-size-input.ts,save-product-resale-configuration-input.ts,product-size-pricing.ts,resale-pricing.ts,product-pricing-details.ts,index.ts}`, `packages/core/src/mrp/interfaces/{product-sizes-repository.ts,resale-configurations-repository.ts,mrp-database.ts,mrp-service.ts,index.ts}`, `packages/validation/src/mrp/{register-product-size-schema.ts,update-product-size-schema.ts,save-product-resale-configuration-schema.ts}`, `packages/validation/src/web/{product-size-form-schema.ts,resale-configuration-form-schema.ts}`, and `packages/validation/src/index.ts`.
- **Contract:** `RF-01`–`RF-08`; contract foundations for `CA-01`–`CA-12`.
- **Outcome:** Core exposes one-file-per-declaration tenant-qualified entities, request/projection structures, repository/database ports and six Web service operations; Validation exposes the five shared schemas with the Spec precision, trimming, currency, status and localized form constraints without authorization or business policy.
- **Rules:** `documentation/rules/code-conventions-rules.md` (Naming, Function declarations, Declaration/destructuring order, File naming, Barrel files, Factory functions); `documentation/rules/core-package-rules.md` (One exported type per file, Contracts belong to interfaces directories, Only entities have identity); `documentation/rules/validation-package-rules.md` (Ownership and dependency direction, Schema placement and naming, Consumer boundaries, Change and validation workflow). No selected Rule file contains an `Antipatterns to Avoid` subsection.
- **Exit:** Run `pnpm --filter @scoops/core check:code`, `pnpm --filter @scoops/core check:types`, `pnpm --filter @scoops/validation check:code` and `pnpm --filter @scoops/validation check:types`; inspect exports, inferred request shapes, numeric precision, optional projections, Core/Validation dependency direction and the absence of tenant/authorization/business decisions in schemas.

### F2 — Transactional pricing persistence

#### F2-T1 — Persist Portion sizes and Resale configurations behind MRP transaction scope

- **Status/owner:** `completed` — Builder Server agent `01a02ff0-c404-7842-8544-47a154b51b2e`
- **Depends/parallel:** Depends on F1; safe in parallel with F3 and F4 because paths do not overlap. Generated migration/meta and shared generated-schema coordination remain Orchestrator-owned.
- **Paths:** `apps/server/src/mrp/constants/mrp-repositories.ts`, `apps/server/src/mrp/database/drizzle/models/{product-size-model.ts,resale-configuration-model.ts,index.ts}`, `apps/server/src/mrp/database/drizzle/types/entities/{product-size.ts,resale-configuration.ts,index.ts}`, `apps/server/src/mrp/database/drizzle/types/index.ts`, `apps/server/src/mrp/database/drizzle/mappers/{drizzle-product-size-mapper.ts,drizzle-resale-configuration-mapper.ts}`, `apps/server/src/mrp/database/drizzle/repositories/{drizzle-product-sizes-repository.ts,drizzle-resale-configurations-repository.ts,drizzle-mrp-database.ts,index.ts}`, `apps/server/src/mrp/database/{mrp-database.module.ts,mrp-repositories.ts,index.ts}`, and `apps/server/src/mrp/fixtures/mrp-module-fixture.ts`.
- **Contract:** `RF-01`, `RF-02`, `RF-04`–`RF-06`, `RF-08`; `CA-01`, `CA-02`, `CA-05`–`CA-09`, `CA-12`.
- **Outcome:** Drizzle models, inferred row types, mappers, token bindings and transaction-bound adapters implement the `0010` tables, numeric precision, tenant/product/brand filters, case-insensitive size uniqueness, Single/brand uniqueness, active counts and existing serializable one-retry semantics without touching PDV tables or events.
- **Rules:** `documentation/rules/code-conventions-rules.md` (Naming, declarations and known application failures); `documentation/rules/core-package-rules.md` (Contracts belong to interfaces directories); `documentation/rules/database-layer-rules.md` (Database code belongs to the owning module, Drizzle models, persistence types, mappers, repository contracts, Drizzle repositories, repository injection and generated migration ownership); `documentation/architecture.md` (Persistence and consistency, Historical records). No selected Rule file contains an `Antipatterns to Avoid` subsection.
- **Exit:** After model exports are integrated, the Orchestrator runs `pnpm --filter server db:migration:generate -- --name product_pricing` and reviews `0010_product_pricing.sql`, `0010_snapshot.json` and `_journal.json` against the Spec tables, indexes, constraints and no-backfill/no-PDV-change boundary; run focused Server code/type checks and inspect every repository predicate, mapper null/number conversion, token binding and transaction adapter. Defer authoritative persistence behavior to F5-T2.

### F3 — Pricing use cases and unit coverage

#### F3-T1 — Implement the five authoritative pricing actions and Core tests

- **Status/owner:** `completed` — Builder Core agent `01a02fe8-e1f0-79f0-9e0b-59774d45c186` (reused from F1)
- **Depends/parallel:** Depends on F1; safe in parallel with F2 and F4. The Builder must keep the frozen revision-1 public contracts and use typed mocked interfaces only.
- **Paths:** `packages/core/src/mrp/domain/entities/fakers/{product-size-faker.ts,resale-configuration-faker.ts,index.ts}`, `packages/core/src/mrp/use-cases/{get-product-pricing-use-case.ts,register-product-size-use-case.ts,update-product-size-use-case.ts,remove-product-size-use-case.ts,save-product-resale-configuration-use-case.ts,index.ts}`, and the five corresponding files under `packages/core/src/mrp/use-cases/tests/`.
- **Contract:** `RF-01`–`RF-08`; `CA-01`–`CA-10` and `CA-12`.
- **Outcome:** Core owns Manager authorization, establishment/category/child/brand qualification, current Portion/Single/By-brand projections, optional cost/profit/margin calculations, normalized size registration, final-active protection inside the transaction, confirmed-removal semantics, idempotent resale upsert and the no-history/no-PDV side-effect boundary.
- **Rules:** `documentation/rules/code-conventions-rules.md` (Function declarations, Declaration/destructuring order, Known application failures); `documentation/rules/core-package-rules.md` (Domain faker conventions, Business rules belong to use cases, Only entities have identity); `documentation/rules/use-case-testing-rules.md` (One standard use-case shape, One test file per use case, typed mocks, deterministic time, colocated fakers and infrastructure-free tests). No selected Rule file contains an `Antipatterns to Avoid` subsection.
- **Exit:** Run the five focused Core test files plus `pnpm --filter @scoops/core check:code`, `pnpm --filter @scoops/core check:types` and `pnpm --filter @scoops/core test`; prove success/rejection matrices, role and tenant branches, category/stock-control/brand checks, projections and unavailable metrics, duplicate handling, final-active `ConflictError`, exact collaborator calls, no partial writes and no PDV/history dependency.

### F4 — Pricing route and Manager experience

#### F4-T1 — Deliver the route-backed, accessible Portion/Resale workflow

- **Status/owner:** `completed` — Builder Web agent `01a02ff0-b12a-7492-929c-0d39c8eab361` (reused through Reviewer corrections)
- **Depends/parallel:** Depends on F1; safe in parallel with F2 and F3 using mocked transport. The Web lane must consume the frozen Core/Validation contracts and must not move orchestration into the route, shared shell or REST adapter.
- **Paths:** `apps/web/src/routes/_authenticated/products/$productId/prices.tsx`, `apps/web/src/rest/services/mrp-service.ts`, `apps/web/src/ui/mrp/hooks/{mrp-query-keys.ts,use-product-pricing-query.ts,use-register-product-size-action.ts,use-update-product-size-action.ts,use-remove-product-size-action.ts,use-save-product-resale-configuration-action.ts}`, `apps/web/src/ui/mrp/widgets/slots/product-pricing-slot/**`, `apps/web/tests/fixtures/mrp-module-fixture.ts`, `apps/web/tests/routes/mrp/products.$productId.prices.test.ts`, and `apps/web/tests/routes/mrp/products.$productId.placeholders.test.ts`.
- **Contract:** `RF-01`–`RF-08`; `CA-01`–`CA-05`, `CA-07`–`CA-11`.
- **Outcome:** The thin protected route renders the exact allowed pricing widget tree; REST mapping preserves dates, optional metrics and failed responses; query/action hooks own refresh and pending/error lifecycle; widgets implement Portion tables/empty state, add/edit/removal dialogs, Single/By-brand cards, no-brands guidance, validation retention, focus return, keyboard use, narrow layout and accessible state feedback.
- **Rules:** `documentation/rules/code-conventions-rules.md` (Naming, handlers and declaration order); `documentation/rules/rest-layer-rules.md` (Service factory, session transport, no dedicated service test); `documentation/rules/ui-layer-rules.md` (Stateful widget/hooks, nested widgets, action/query ownership, canonical routes, REST adapters, design tokens, composite focus, dialog headers and error feedback); `documentation/rules/web-app-routing-rules.md` (Thin protected route, generated route tree, mocked route suite and failure boundaries); `documentation/rules/widget-testing-rules.md` (Owning widget boundary, behavior matrix, accessible queries and route integration); `documentation/design.md`; `documentation/features/mrp/products-details-page-pricing-tab/design/manifest.md`. No selected Rule file contains an `Antipatterns to Avoid` subsection.
- **Exit:** Run `pnpm --filter web generate-routes` with the generated diff reviewed by the Orchestrator, then `pnpm --filter web check:code`, `pnpm --filter web check:types`, `pnpm --filter web test`, `pnpm --filter web build` and `pnpm --filter web exec playwright test 'tests/routes/mrp/products.$productId.prices.test.ts' --workers=1`; exercise the exact Spec widget tree, desktop and `390×844` keyboard paths, loading/error/empty/validation/pending/mutation-error/unavailable states, console and failed-request inspection, and fresh Playwright CLI screenshots for every supplied reference and every supplemental state scheduled below. Mocked browser evidence must remain labeled UI/REST-contract evidence, not persistence or authorization proof.

### F5 — REST composition and controller integration

#### F5-T1 — Expose the six pricing REST operations

- **Status/owner:** `completed` — Builder Server agent `01a02ff0-c404-7842-8544-47a154b51b2e` (reused from F2)
- **Depends/parallel:** Depends on F2, F3 and the F1 Validation contracts; no parallel Server implementation path. Starts only after the Orchestrator accepts the persistence and Core exits.
- **Paths:** `apps/server/src/mrp/rest/dtos/{product-pricing-response.dto.ts,index.ts}`, `apps/server/src/mrp/rest/schemas/product-schemas.ts`, `apps/server/src/mrp/rest/controllers/{get-product-pricing.controller.ts,register-product-size.controller.ts,update-product-size.controller.ts,remove-product-size.controller.ts,save-single-resale-configuration.controller.ts,save-brand-resale-configuration.controller.ts,index.ts}`, `apps/server/src/mrp/mrp.module.ts`, and `apps/server/rest-client/mrp/products.rest`.
- **Contract:** `RF-01`–`RF-08`; `CA-01`–`CA-10` and `CA-12`.
- **Outcome:** One thin controller per GET/POST/PATCH/DELETE/PUT action maps semantic UUID parameters, the current Manager actor, shared schemas, Core use cases, response DTO dates/optional projections, Swagger success/error statuses and safe REST errors; module registration and `.rest` examples match the canonical paths and bodies.
- **Rules:** `documentation/rules/code-conventions-rules.md` (Naming, declarations and known failures); `documentation/rules/rest-layer-rules.md` (One controller/action, semantic parameters, derived request body, Swagger responses, route ownership, REST examples, service alignment and global errors); `documentation/rules/validation-package-rules.md` (Shared schema consumer boundary); `documentation/rules/database-layer-rules.md` (Token-based repository injection). No selected Rule file contains an `Antipatterns to Avoid` subsection.
- **Exit:** Run focused Server code/type checks and inspect every method, path, parameter, body, response status, DTO, guard, use-case construction, module registration and REST example against the Spec; controllers contain no business decisions or persistence access. F5-T2 supplies the real HTTP/persistence evidence.

#### F5-T2 — Prove real HTTP, authorization, persistence and future-only history

- **Status/owner:** `completed` — Builder Server agent `01a02ff0-c404-7842-8544-47a154b51b2e` (reused from F5-T1)
- **Depends/parallel:** Depends on F5-T1 and F2/F3; no parallel implementation. Reuses the real `RestFixture`, `DatabaseFixture` and `MrpModuleFixture` lifecycle and module wiring.
- **Paths:** `apps/server/src/mrp/rest/controllers/tests/{get-product-pricing.controller.test.ts,register-product-size.controller.test.ts,update-product-size.controller.test.ts,remove-product-size.controller.test.ts,save-single-resale-configuration.controller.test.ts,save-brand-resale-configuration.controller.test.ts}`, plus the pricing helpers and real fixture additions in `apps/server/src/mrp/fixtures/mrp-module-fixture.ts`.
- **Contract:** `RF-01`–`RF-08`; `CA-01`–`CA-10` and `CA-12`.
- **Outcome:** Six Supertest integration suites exercise the real Nest → Core → token-bound Drizzle → PostgreSQL path, exact response serialization, Manager/Operator/anonymous behavior, foreign-tenant safe `404`, category/brand ownership, malformed input, unique/check constraints, final-active `409`, removal, idempotent Single/brand upsert, subsequent read state and unchanged PDV/history boundary.
- **Rules:** `documentation/rules/code-conventions-rules.md` (Test naming and declarations); `documentation/rules/controllers-testing-rules.md` (One real integration file per controller, RestFixture/DatabaseFixture, isolation, HTTP plus persistence assertions); `documentation/rules/rest-layer-rules.md` (HTTP contract and error/status synchronization); `documentation/rules/database-layer-rules.md` (Indirect repository validation and real module tokens). No selected Rule file contains an `Antipatterns to Avoid` subsection.
- **Exit:** With Docker Compose/Supabase prerequisites healthy, run the six focused controller suites and `pnpm --filter server test`; assert real request/response status/body, persisted rows or subsequent GET state, authorization and tenant results, transaction conflict/rollback behavior, and unchanged historical/PDV records. Mocked transport is not sufficient evidence.

### F6 — Integrated conformance and handoff

#### F6-T1 — Validate one integrated revision-1 candidate and route to conclusion

- **Status/owner:** `completed` — Orchestrator; Integrated Reviewer agent `01a03020-4c4a-7f50-a82d-ab1b0fec6ae9` completed the final read-only recheck with no source findings
- **Depends/parallel:** Depends on F4 and F5; no implementation parallelism. After all Builder diffs are integrated, run the required sensors in parallel with exactly one read-only [`Integrated Reviewer`](../../../agents/reviewer-agent.md); any discrepancy keeps the responsible item `in_progress`, invalidates affected evidence and resumes the responsible Builder through `implement-spec`.
- **Paths:** `documentation/features/mrp/products-details-page-pricing-tab/{plan.md,evaluation.md}`, Orchestrator-owned generated `apps/server/src/shared/database/drizzle/migrations/**`, `apps/server/src/shared/database/drizzle/migrations/meta/**` and `apps/web/src/routeTree.gen.ts`; read-only conformance review covers all Spec-owned Core, Validation, Server, REST, Web, test and saved design paths.
- **Contract:** `RF-01`–`RF-08`; `CA-01`–`CA-12`; `MV-01`–`MV-02`.
- **Outcome:** One integrated candidate has current Core, Validation, Server, Web, migration, build, mocked-browser, real HTTP/database, manual, responsive and visual evidence; the single Reviewer checks cross-Builder contracts and all affected surfaces, and every verified finding is resolved before direct routing to `conclude-spec`.
- **Rules:** `documentation/sdd-rules.md` (Plan ownership, living evidence, Reviewer lifecycle and handoff); the complete Rule Pack recorded in [`spec.md`](./spec.md); `documentation/architecture.md`; `documentation/modules.md`; `documentation/design.md`; `documentation/tooling.md`; [`documentation/agents/reviewer-agent.md`](../../../agents/reviewer-agent.md); `AGENTS.md` (service health, Playwright CLI, screenshots, console/network inspection and process cleanup). No selected Rule file contains an `Antipatterns to Avoid` subsection.
- **Exit:** Run every Spec command on the integrated candidate, including migration apply, Server build and Web route generation; inspect `docker compose ps`, Supabase `:54321`, Server `GET :3336/health` and Web `:4000`; execute `MV-01` and `MV-02` with Manager, Operator, foreign-tenant and disposable pricing fixtures; record exact URL/DOM/request/response/persistence/authorization evidence, keyboard and `390×844` behavior, console and failed-request classifications, generated SQL/meta/route review, every fresh visual comparison and the Reviewer report in `evaluation.md`. Resume the same Reviewer after any correction. Handoff is allowed only when all tasks/phases/scenarios and coverage rows are complete, transient artifact identifiers are recorded, no verified finding is active and the next route is `conclude-spec`.

## Validation and handoff

| Type | Scenario/surface | Criteria | Reference | Evidence target | Status |
| --- | --- | --- | --- | --- | --- |
| Automated | Core use cases and domain contracts | `CA-01`–`CA-10`, `CA-12` | F1-T1/F3-T1 Core boundaries | `./evaluation.md` | `passed` |
| Automated | Shared Validation schemas | `CA-03`, `CA-04`, `CA-08`, `CA-09` | F1-T1 Validation boundary | `./evaluation.md` | `passed` |
| Runtime | Drizzle models, constraints, transaction scope and migration 0010 | `CA-01`–`CA-09`, `CA-12` | Spec Technical Contract / F2-T1 | `./evaluation.md` | `passed` |
| Runtime | Real Nest HTTP, authorization, tenant isolation and persistence | `CA-01`–`CA-10`, `CA-12` | F5-T2 controller suites | `./evaluation.md` | `passed` |
| Browser (mocked transport) | Pricing route access, loading, success, empty, read error/retry and mode selection | `CA-01`, `CA-02`, `CA-08`–`CA-10` | `products.$productId.prices.test.ts` | Playwright `test-results/` plus `./evaluation.md` | `passed` |
| Browser (mocked transport) | Portion add/edit/deactivate/remove lifecycle and validation retention | `CA-03`–`CA-07`, `CA-10`, `CA-11` | `products.$productId.prices.test.ts` | Playwright `test-results/` plus `./evaluation.md` | `passed` |
| Browser (mocked transport) | Single/By-brand save, no-brands guidance and row failure recovery | `CA-08`–`CA-11` | `products.$productId.prices.test.ts` | Playwright `test-results/` plus `./evaluation.md` | `passed` |
| Manual | MV-01 — Portion sizes | `CA-01`–`CA-07`, `CA-10`, `CA-11` | Spec MV-01; `X1avQ.png`, `yX4RY.png`, `hqaUm.png`, `uQYUR.png` | `./evaluation.md` | `passed` |
| Manual | MV-02 — Resale modes and future-only history | `CA-01`, `CA-08`–`CA-12` | Spec MV-02; `X1avQ.png`, `JwtuK.png` | `./evaluation.md` | `passed` |
| Visual | Populated Pricing composite — 1560×1178 | `CA-02`, `CA-09`, `CA-11` | [`X1avQ.png`](./design/X1avQ.png) / Pencil `X1avQ` | Fresh Playwright artifact and independent comparison in `./evaluation.md` | `passed` |
| Visual | Add size dialog idle — component 520×447; PNG 676×597 | `CA-03`, `CA-04`, `CA-11` | [`yX4RY.png`](./design/yX4RY.png) / Pencil `yX4RY` | Fresh Playwright artifact and independent comparison in `./evaluation.md` | `passed` |
| Visual | Edit size dialog idle — component 520×548; PNG 676×698 | `CA-05`, `CA-06`, `CA-11` | [`hqaUm.png`](./design/hqaUm.png) / Pencil `hqaUm` | Fresh Playwright artifact and independent comparison in `./evaluation.md` | `passed` |
| Visual | Remove size confirmation — component 440×212; PNG 596×362 | `CA-07`, `CA-11` | [`uQYUR.png`](./design/uQYUR.png) / Pencil `uQYUR` | Fresh Playwright artifact and independent comparison in `./evaluation.md` | `passed` |
| Visual | Single-stock Resale card — component 1200×251; PNG 1209×251 | `CA-08`, `CA-11` | [`JwtuK.png`](./design/JwtuK.png) / Pencil `JwtuK` | Fresh Playwright artifact and independent comparison in `./evaluation.md` | `passed` |
| Visual | Portion loading — 1560×1178 | `CA-02`, `CA-10`, `CA-11` | Manifest supplemental decision | Fresh Playwright artifact and independent comparison in `./evaluation.md` | `passed` |
| Visual | Portion loading — 390×844 | `CA-02`, `CA-10`, `CA-11` | Manifest supplemental decision | Fresh Playwright artifact and independent comparison in `./evaluation.md` | `passed` |
| Visual | Portion read error/retry — 1560×1178 | `CA-02`, `CA-10`, `CA-11` | Manifest supplemental decision | Fresh Playwright artifact and independent comparison in `./evaluation.md` | `passed` |
| Visual | Portion read error/retry — 390×844 | `CA-02`, `CA-10`, `CA-11` | Manifest supplemental decision | Fresh Playwright artifact and independent comparison in `./evaluation.md` | `passed` |
| Visual | Portion empty — 1560×1178 | `CA-02`, `CA-11` | Manifest supplemental decision | Fresh Playwright artifact and independent comparison in `./evaluation.md` | `passed` |
| Visual | Portion empty — 390×844 | `CA-02`, `CA-11` | Manifest supplemental decision | Fresh Playwright artifact and independent comparison in `./evaluation.md` | `passed` |
| Visual | Size validation dialog — 390×844 | `CA-04`, `CA-11` | Manifest supplemental decision | Fresh Playwright artifact and independent comparison in `./evaluation.md` | `passed` |
| Visual | Size pending dialog — 390×844 | `CA-10`, `CA-11` | Manifest supplemental decision | Fresh Playwright artifact and independent comparison in `./evaluation.md` | `passed` |
| Visual | Size mutation-error/recovery dialog — 390×844 | `CA-10`, `CA-11` | Manifest supplemental decision | Fresh Playwright artifact and independent comparison in `./evaluation.md` | `passed` |
| Visual | By-brand no-brands guidance — 1560×1178 | `CA-09`, `CA-11` | Manifest supplemental decision | Fresh Playwright artifact and independent comparison in `./evaluation.md` | `passed` |
| Visual | By-brand no-brands guidance — 390×844 | `CA-09`, `CA-11` | Manifest supplemental decision | Fresh Playwright artifact and independent comparison in `./evaluation.md` | `passed` |
| Visual | By-brand failed row save/recovery — 1560×1178 | `CA-09`, `CA-10`, `CA-11` | Manifest supplemental decision | Fresh Playwright artifact and independent comparison in `./evaluation.md` | `passed` |
| Visual | By-brand failed row save/recovery — 390×844 | `CA-09`, `CA-10`, `CA-11` | Manifest supplemental decision | Fresh Playwright artifact and independent comparison in `./evaluation.md` | `passed` |
| Visual | Single-stock unavailable — 390×844 | `CA-08`, `CA-11` | Manifest supplemental decision | Fresh Playwright artifact and independent comparison in `./evaluation.md` | `passed` |
| Visual | Single-stock validation — 390×844 | `CA-10`, `CA-11` | Manifest supplemental decision | Fresh Playwright artifact and independent comparison in `./evaluation.md` | `passed` |
| Review | One complete integrated candidate, cross-Builder contracts and all affected surfaces | `RF-01`–`RF-08`, `CA-01`–`CA-12` | [`Integrated Reviewer`](../../../agents/reviewer-agent.md) | One Reviewer report plus Orchestrator-verified findings in `./evaluation.md` | `passed` |

The single read-only Integrated Reviewer is scheduled after F4/F5 diffs are integrated and before readiness. It checks the complete candidate, cross-Builder contracts, generated migration/meta and route artifacts, every supplied and supplemental visual comparison, and high-risk Playwright CLI keyboard, responsive, console, network, authorization and persistence paths. The report is advisory: the Orchestrator verifies each finding, records accepted findings in `evaluation.md`, invalidates stale evidence, resumes the responsible Builder for in-Contract corrections and resumes the same Reviewer after corrections.

Final delivery is complete: every task and phase is completed; current revision-1 Core, Validation, Server and Web commands pass; generated migration/meta and route tree are reviewed; healthy services and seeded accounts were verified; executable `MV-01`–`MV-02` pass; transient screenshot identifiers and independent final Spec-tree/visual comparisons are recorded; supplemental-state decisions are resolved; the Integrated Reviewer recheck is complete; every verified finding is resolved or accepted as non-blocking; and the three required PR CI workflows pass on the delivery head. Draft PR #19 is ready for human review and merge authorization.
