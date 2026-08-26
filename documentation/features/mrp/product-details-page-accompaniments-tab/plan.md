---
title: MRP product details Accompaniments tab and type management — implementation plan
status: completed
spec: ./spec.md
spec_revision: 7
evaluation: ./evaluation.md
github_issue: https://github.com/rafinel/scoops/issues/14
updated_at: 2026-08-23
---

## Execution status

- **Spec:** [`spec.md`](./spec.md) — revision `7`, `completed`.
- **Rationale:** Plan-backed execution is required because the Contract crosses Core, Validation, transactional Server persistence and migration generation, REST composition, generated routing, design-backed Web surfaces, concurrency/security checks and real full-stack validation.
- **Current phase:** F7-C1 — completed current-head Web CI correction for browser-suite topology and deterministic loading-state evidence.
- **Next action:** Post-merge monitoring and normal PR review.
- **Active blockers:** None. The local foreign Manager browser fixture remains unavailable and is covered by the documented HTTP isolation evidence. Revision 2 moved the real browser/server/database suite to `apps/web/tests/integration/mrp` so mocked route suites remain compliant with the Web Routing Rule.
- **Builders:** F1 Builder Core `01a02b41-b899-7dc3-8463-136f7815f994` is complete. Wave 2 activates Builder Server for F2, reuses Builder Core for F3, and activates Builder Web for F4; Builder Web is reused for F6 after the Server boundary is integrated.
- **Coordination:** The Orchestrator owns this Plan, `evaluation.md`, package/lockfile changes, generated Drizzle migration/meta, `apps/web/src/routeTree.gen.ts`, final integration and evidence verdicts. No dependency or lockfile change is planned.

## Execution ledger

| Wave | Builder | Phase | Name | Depends on | Parallel with | Status | Exit condition |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | `Builder Core` | F1 | Shared domain and validation contracts | — | — | `completed` | Core/Validation checks pass and all public contracts match Spec revision 2. |
| 2 | `Builder Server` | F2 | Transactional accompaniment persistence | F1 | F3, F4 | `completed` | Models, tenant-qualified repositories, transaction scope and generated migration inputs satisfy the persistence Contract. |
| 2 | `Builder Core` | F3 | Accompaniment/type use cases and unit coverage | F1 | F2, F4 | `completed` | Eight deterministic Core use-case suites prove policy, tenancy, projection, conflict and atomicity branches. |
| 2 | `Builder Web` | F4 | Product and Types Web workflow | F1 | F2, F3 | `completed` | Widget, route and mocked-browser paths plus six supplied design-state captures satisfy the current UI implementation exit; supplemental state evidence continues in F7. |
| 3 | `Builder Server` | F5 | REST composition and controller integration | F2, F3 | — | `completed` | All eight real HTTP operations pass mapping, authorization, tenant, persistence, constraint and no-stock-side-effect evidence. |
| 4 | `Builder Web` | F6 | Real authenticated browser integration | F4, F5 | — | `completed` | Serial Playwright flow proves the committed Web → REST → PostgreSQL lifecycle, security and stock invariance; foreign-tenant HTTP isolation remains in F5 because the local stack has no prepared foreign browser account. |
| 5 | `Orchestrator` | F7 | Integrated conformance and readiness | F6 | Integrated Reviewer | `completed` | Revision-7 compact neutral shared back-link styling, focused validation, fresh screenshots and same-Reviewer recheck are complete; delivery publication remains explicit. |
| 6 | `Builder Web` / `Orchestrator` | F7-C1 | Current-head Web CI correction | F7 | — | `completed` | Generic Web CI runs only mocked route coverage with one worker, candidate/Recipe loading tests are deterministic, the serial route suite passes 108/108, and Evaluation evidence is refreshed. |

### F1 — Shared domain and validation contracts

#### F1-T1 — Establish canonical MRP contracts and reusable schemas

- **Status/owner:** `completed` — Builder Core `01a02b41-b899-7dc3-8463-136f7815f994`
- **Depends/parallel:** Starts after the Orchestrator records revision 2, this card and its exact paths; no parallel task in F1.
- **Paths:** `packages/core/src/mrp/domain/entities/{accompaniment-type.ts,product-accompaniment.ts,index.ts}`, `packages/core/src/mrp/domain/structures/{accompaniment-type-create.ts,accompaniment-type-update.ts,product-accompaniment-create.ts,product-accompaniment-update.ts,link-product-accompaniment-input.ts,update-product-accompaniment-input.ts,save-accompaniment-type-input.ts,product-accompaniment-details.ts,product-accompaniments-details.ts,accompaniment-type-list-item.ts,accompaniment-type-list-params.ts,accompaniment-type-page.ts,index.ts}`, `packages/core/src/mrp/interfaces/{accompaniment-types-repository.ts,product-accompaniments-repository.ts,mrp-database.ts,mrp-service.ts,index.ts}`, `packages/validation/src/mrp/{product-accompaniment-schema.ts,accompaniment-type-schema.ts,list-accompaniment-types-query-schema.ts}`, `packages/validation/src/web/{product-accompaniment-form-schema.ts,accompaniment-type-form-schema.ts,accompaniment-types-search-schema.ts}`, and `packages/validation/src/index.ts`.
- **Contract:** `RF-02`–`RF-04`, `RF-07`–`RF-11`; `CA-03`–`CA-12`.
- **Outcome:** Core exposes one-file-per-declaration entities, structures, tenant-qualified repository/database ports and eight service operations; Validation exposes the six reusable transport/form/search schemas with scale-3, name, pagination and localized form constraints, without authorization or business rules.
- **Rules:** `documentation/rules/code-conventions-rules.md` (Naming, Function declarations, Declaration/destructuring order, File naming, Barrel files, Factory functions); `documentation/rules/core-package-rules.md` (One exported type per file, Business rules belong to use cases, Contracts belong to interfaces directories, Only entities have identity); `documentation/rules/validation-package-rules.md` (Ownership and dependency direction, Schema placement and naming, Consumer boundaries, Change and validation workflow).
- **Exit:** Run `pnpm --filter @scoops/core check:code`, `pnpm --filter @scoops/core check:types`, `pnpm --filter @scoops/validation check:code` and `pnpm --filter @scoops/validation check:types`; inspect Core/Validation dependency direction, exports, inferred request shapes and the absence of tenant/authorization/business decisions in schemas.

### F2 — Transactional accompaniment persistence

#### F2-T1 — Persist shared types and Portion accompaniment links

- **Status/owner:** `completed` — Builder Server `01a02b49-f29f-7631-95dc-7be9f9a9e7c7`
- **Depends/parallel:** Depends on F1; safe in parallel with F3 and F4 because paths do not overlap. Generated migration/meta are Orchestrator-coordinated outputs, not Builder-owned paths.
- **Paths:** `apps/server/src/mrp/constants/mrp-repositories.ts`, `apps/server/src/mrp/database/drizzle/models/{accompaniment-type-model.ts,product-accompaniment-model.ts,index.ts}`, `apps/server/src/mrp/database/drizzle/types/entities/{accompaniment-type.ts,product-accompaniment.ts,index.ts}`, `apps/server/src/mrp/database/drizzle/types/index.ts`, `apps/server/src/mrp/database/drizzle/mappers/{drizzle-accompaniment-type-mapper.ts,drizzle-product-accompaniment-mapper.ts}`, `apps/server/src/mrp/database/drizzle/repositories/{drizzle-accompaniment-types-repository.ts,drizzle-product-accompaniments-repository.ts,drizzle-mrp-database.ts,index.ts}`, `apps/server/src/mrp/database/{mrp-database.module.ts,mrp-repositories.ts,index.ts}`, `apps/server/src/mrp/fixtures/mrp-module-fixture.ts`, and `apps/server/src/shared/database/drizzle/schema.ts`.
- **Contract:** `RF-02`–`RF-05`, `RF-07`–`RF-09`, `RF-11`; `CA-01`–`CA-07`, `CA-09`–`CA-12`.
- **Outcome:** Drizzle models, inferred row types, mappers, repository token bindings and transaction-bound adapters implement tenant-qualified reads/writes, current-source projections, stable type paging, one owner/target pair, positive numeric quantity, restrictive references, safe integrity conflicts and the existing serializable one-retry boundary without stock writes.
- **Rules:** `documentation/rules/code-conventions-rules.md` (naming, declarations and known failures); `documentation/rules/core-package-rules.md` (interface ownership and domain boundary); `documentation/rules/database-layer-rules.md` (Database code belongs to the owning module, Drizzle models, persistence types, mappers, repository contracts, Drizzle repositories, repository injection and generated migration ownership); `documentation/rules/server-app-layer-rules.md` (feature module registration where applicable).
- **Exit:** Run `pnpm --filter server db:migration:generate`, inspect the generated SQL/snapshot/journal against the Spec tables and constraints without hand-editing generated artifacts, then run focused Server code/type checks; inspect every repository predicate, transaction adapter, token binding and conflict translation. Defer authoritative database behavior to F5-T2 and F6.

### F3 — Accompaniment/type use cases and unit coverage

#### F3-T1 — Implement the eight authoritative Core actions

- **Status/owner:** `completed` — Builder Core `01a02b49-d651-7383-808f-cbf796d568eb`
- **Depends/parallel:** Depends on F1; safe in parallel with F2 and F4. Reuses Builder Core and must not alter the frozen public contracts without a Spec amendment.
- **Paths:** `packages/core/src/mrp/domain/entities/fakers/{accompaniment-type-faker.ts,product-accompaniment-faker.ts,index.ts}`, `packages/core/src/mrp/use-cases/{get-product-accompaniments-use-case.ts,link-product-accompaniment-use-case.ts,update-product-accompaniment-use-case.ts,remove-product-accompaniment-use-case.ts,list-accompaniment-types-use-case.ts,create-accompaniment-type-use-case.ts,rename-accompaniment-type-use-case.ts,remove-accompaniment-type-use-case.ts,index.ts}`, and the eight corresponding files under `packages/core/src/mrp/use-cases/tests/`.
- **Contract:** `RF-02`–`RF-11`; `CA-01`–`CA-13`.
- **Outcome:** Core owns Manager authorization, establishment scope, Portion/Accompaniment eligibility, current Main/cost projection, normalized names, pagination, immutable link target, in-use protection, serializable mutation orchestration, safe conflict semantics and no stock/event/PDV side effects.
- **Rules:** `documentation/rules/code-conventions-rules.md` (function/declaration order and AppError); `documentation/rules/core-package-rules.md` (Business rules belong to use cases, domain fakers and contracts); `documentation/rules/use-case-testing-rules.md` (one use-case class/test file, typed mocks, deterministic time, colocated fakers and infrastructure-free tests).
- **Exit:** Run the eight focused Core test files, `pnpm --filter @scoops/core check:code` and `pnpm --filter @scoops/core check:types`; prove success and rejection matrices, tenant/role branches, current-source/unavailable projections, duplicate/precision behavior, in-use/race conflict handling, exact collaborator calls and zero partial writes. Do not present mocked ports as persistence proof.

### F4 — Product and Types Web workflow

#### F4-T1 — Deliver the route-backed, accessible Manager experience

- **Status/owner:** `completed` — Builder Web `01a02b49-e868-7512-b06b-2f96c6b88b24` (supplied design-state captures current; supplemental evidence continues in F7)
- **Depends/parallel:** Depends on F1; safe in parallel with F2 and F3. The Web lane uses the frozen Core/Validation contracts and mocked transport; the real service-backed suite is deferred to F6 after F5.
- **Paths:** `apps/web/src/constants/{routes.ts,sidebar-items.ts}`, `apps/web/src/rest/services/mrp-service.ts`, `apps/web/src/routes/_authenticated/products/$productId/accompaniments.tsx`, `apps/web/src/routes/_authenticated/accompaniment-types/index.tsx`, `apps/web/src/ui/mrp/hooks/**`, `apps/web/src/ui/mrp/widgets/slots/product-accompaniments-slot/**`, `apps/web/src/ui/mrp/widgets/pages/accompaniment-types-page/**`, `apps/web/src/ui/shared/widgets/layouts/app-layout/{index.tsx,use-app-layout.ts,app-layout.test.tsx}`, `apps/web/tests/fixtures/mrp-module-fixture.ts`, and `apps/web/tests/routes/mrp/{products.$productId.accompaniments.test.ts,accompaniment-types.index.test.ts,products.$productId.placeholders.test.ts}`. `apps/web/src/routeTree.gen.ts` is generated and Orchestrator-owned.
- **Contract:** `RF-01`–`RF-10`, `RF-12`; `CA-01`–`CA-14`.
- **Outcome:** Thin authenticated routes, profile-driven Manager/Operator navigation, query/action hooks, REST mapping, Product Accompaniments and Types widgets/dialogs, lifecycle states, retained mutation failures, query invalidation, accessible focus/keyboard behavior and contained 320 px tables/dialogs implement the exact Spec widget tree and approved design deviations.
- **Rules:** `documentation/rules/code-conventions-rules.md` (naming, handlers and declaration order); `documentation/rules/validation-package-rules.md` (shared form/search schemas); `documentation/rules/rest-layer-rules.md` (service factory, session transport and no service tests); `documentation/rules/ui-layer-rules.md` (stateful widget/hooks, nested widgets, action/query ownership, sidebar configuration, canonical routes, REST adapters, design tokens, composite focus and dialog headers); `documentation/rules/web-app-routing-rules.md` (canonical paths, thin routes, search validation, generated route tree, mocked route suites and failure boundaries); `documentation/rules/widget-testing-rules.md` (owning widget boundary, behavior matrix, accessible queries and route integration); `documentation/design.md` and `documentation/features/mrp/product-details-page-accompaniments-tab/design/manifest.md` (tokens, six references, responsive and supplemental states).
- **Exit:** Run `pnpm --filter web generate-routes` and have the Orchestrator review the generated diff, then run `pnpm --filter web check:code`, `pnpm --filter web check:types`, `pnpm --filter web test` and the focused mocked suite `pnpm --filter web test:integration -- 'tests/routes/mrp/products.$productId.accompaniments.test.ts' 'tests/routes/mrp/accompaniment-types.index.test.ts' 'tests/routes/mrp/products.$productId.placeholders.test.ts'`. Compare each exact Spec widget tree to its supplied reference, exercise keyboard and 320 × 900 states, inspect console and failed requests, and capture fresh Playwright CLI screenshots for every affected supplied and supplemental design state. Label mocked transport as UI/REST-contract evidence only; real persistence belongs to F5-T2/F6.

### F5 — REST composition and controller integration

#### F5-T1 — Expose all eight MRP REST operations

- **Status/owner:** `completed` — Builder Server `01a02b49-f29f-7631-95dc-7be9f9a9e7c7`
- **Depends/parallel:** Depends on F2, F3 and the F1 Validation contracts; starts after F2 is accepted and reuses Builder Server. F5-T2 is sequential because it depends on the completed composition.
- **Paths:** `apps/server/src/mrp/decorators/{accompaniment-types-controller.ts,index.ts}`, `apps/server/src/mrp/rest/dtos/{product-accompaniments-response.dto.ts,accompaniment-types-response.dto.ts,index.ts}`, `apps/server/src/mrp/rest/schemas/product-schemas.ts`, `apps/server/src/mrp/rest/controllers/{get-product-accompaniments.controller.ts,link-product-accompaniment.controller.ts,update-product-accompaniment.controller.ts,remove-product-accompaniment.controller.ts,list-accompaniment-types.controller.ts,create-accompaniment-type.controller.ts,rename-accompaniment-type.controller.ts,remove-accompaniment-type.controller.ts,index.ts}`, `apps/server/src/mrp/mrp.module.ts`, and `apps/server/rest-client/mrp/{products.rest,accompaniment-types.rest}`.
- **Contract:** `RF-01`–`RF-11`; `CA-01`–`CA-12`.
- **Outcome:** One thin controller per action maps semantic UUID params, CurrentAccount tenant/profile, shared schemas, Core use cases, DTO dates/optional projections, Swagger statuses and safe errors; `MrpModule`, decorator/DTO/controller barrels and REST examples register/document the exact GET/POST/PATCH/DELETE contracts.
- **Rules:** `documentation/rules/code-conventions-rules.md` (naming/imports and known failures); `documentation/rules/server-app-layer-rules.md` (feature-owned composition); `documentation/rules/rest-layer-rules.md` (one controller/action, semantic params, derived requests, Swagger responses, route ownership, REST examples, service alignment and global errors); `documentation/rules/validation-package-rules.md` (shared schema consumer boundary); `documentation/rules/database-layer-rules.md` (token-based repository injection).
- **Exit:** Run focused Server code/type checks and inspect every method/path/param/body/status/DTO/guard/module registration and REST example against the Spec. Controllers must contain no business decisions or persistence access; F5-T2 supplies real HTTP/persistence evidence.

#### F5-T2 — Prove real controller persistence, authorization and isolation

- **Status/owner:** `completed` — Builder Server `01a02b49-f29f-7631-95dc-7be9f9a9e7c7`
- **Depends/parallel:** Depends on F5-T1 and F2/F3; no parallel Server implementation path. Reuses the existing `MrpModuleFixture`/`RestFixture` lifecycle and real module wiring.
- **Paths:** `apps/server/src/mrp/rest/controllers/tests/{get-product-accompaniments.controller.test.ts,link-product-accompaniment.controller.test.ts,update-product-accompaniment.controller.test.ts,remove-product-accompaniment.controller.test.ts,list-accompaniment-types.controller.test.ts,create-accompaniment-type.controller.test.ts,rename-accompaniment-type.controller.test.ts,remove-accompaniment-type.controller.test.ts}`.
- **Contract:** `RF-01`–`RF-11`; `CA-01`–`CA-12`.
- **Outcome:** Eight Supertest suites exercise real Nest/Core/Drizzle wiring, exact HTTP responses and persistence, Manager authorization, Operator/anonymous denial, uniform foreign/missing not-found behavior, constraints, pagination/order/count, type rename propagation, in-use/racing removal conflict, rollback and unchanged stock/history.
- **Rules:** `documentation/rules/code-conventions-rules.md` (test naming and declarations); `documentation/rules/rest-layer-rules.md` (HTTP contract and error/status synchronization); `documentation/rules/controllers-testing-rules.md` (one real integration file per controller, RestFixture/DatabaseFixture, isolation, HTTP plus persistence assertions); `documentation/rules/database-layer-rules.md` (indirect repository validation and real module tokens).
- **Exit:** With the required Docker/Supabase services available, run the focused controller suites and then `pnpm --filter server test`; assert real request/response, persisted rows, authorization/tenant results, contention/constraint conflicts, rollback and stock/history invariance. Mocked transport is not sufficient evidence.

### F6 — Real authenticated browser integration

#### F6-T1 — Prove the committed Web → REST → PostgreSQL lifecycle

- **Status/owner:** `completed` — Builder Web `01a02b49-e868-7512-b06b-2f96c6b88b24`
- **Depends/parallel:** Depends on F4 and F5; no parallel implementation. Reuses Builder Web after the Server REST/controller boundary is integrated.
- **Paths:** `apps/web/tests/integration/mrp/products.$productId.accompaniments.real.integration.test.ts`.
- **Contract:** `RF-01`–`RF-12`; `CA-03`–`CA-14`.
- **Outcome:** A serial real-service Playwright suite uses the shared browser fixture and prepared local Manager/Operator accounts to prove Manager link/type lifecycle, reload persistence, dynamic primary-brand source/cost, unchanged stock/history, Operator/anonymous denial and safe missing-product behavior without route mocks. Foreign-tenant HTTP isolation is proven in F5's real controller suites because this local stack has no prepared foreign browser account.
- **Rules:** `documentation/rules/web-app-routing-rules.md` (shared Playwright fixture boundary; this is intentionally outside `apps/web/tests/routes`); `documentation/rules/widget-testing-rules.md` (browser integration must assert URL, transport and visible outcome); `documentation/rules/rest-layer-rules.md` (observable HTTP contract); `documentation/tooling.md` (Playwright CLI and local services); `AGENTS.md` (health checks, persistent server/Web processes, console/network inspection and process cleanup).
- **Exit:** With Docker/Supabase, Server `:3336` and Web `:4000` healthy, the direct Playwright CLI equivalent passed 1/1 through the shared fixture. It asserts exact request/response/status, final URL, visible refresh, reload persistence, primary-brand source/cost, authorization outcomes, stock/history invariance, console and failed-request classification, keyboard/narrow behavior and real-flow artifacts. The package wrapper's `--` forwarding quirk is recorded in Evaluation; mocked transport is not claimed as persistence proof.

### F7 — Integrated conformance and readiness

#### F7-T1 — Validate one integrated revision-2 candidate and prepare handoff

- **Status/owner:** `completed` — Orchestrator
- **Depends/parallel:** Depends on F6; no parallel implementation. Run integrated sensors in parallel with exactly one read-only Integrated Reviewer after all Builder diffs are integrated and before readiness. Any discrepancy remains `in_progress`, invalidates affected evidence and routes to the responsible Builder through `implement-spec`.
- **Paths:** `documentation/features/mrp/product-details-page-accompaniments-tab/{plan.md,evaluation.md}`, Orchestrator-owned generated `apps/server/src/shared/database/drizzle/migrations/**` and `apps/server/src/shared/database/drizzle/migrations/meta/**`, and generated `apps/web/src/routeTree.gen.ts`; read-only conformance review covers every Spec-owned implementation path and the saved `design/` references.
- **Contract:** `RF-01`–`RF-12`; `CA-01`–`CA-14`; `MV-01`–`MV-04`.
- **Outcome:** One integrated candidate has current static, Core, Validation, Server, Web, mocked-route, real authenticated browser/server/database, manual and independent visual evidence with generated artifacts reviewed and no blocking finding.
- **Rules:** `documentation/sdd.md` (living evidence, Plan ownership and Reviewer lifecycle); the complete Rule Pack recorded in [`spec.md`](./spec.md); `documentation/architecture.md`; `documentation/modules.md`; `documentation/design.md`; `documentation/tooling.md`; [`documentation/agents/implementation-reviewer-agent.md`](../../../agents/implementation-reviewer-agent.md).
- **Exit:** Run every Spec command on the integrated candidate, including migration apply, Server build and Web route generation; inspect `docker compose ps`, Supabase `:54321`, Server `GET :3336/health` and Web `:4000`; execute `MV-01`–`MV-04` with prepared Manager/Operator/foreign-tenant fixtures. Run the mocked route command and confirm F6's serial real suite; record exact URLs/DOM/network/response/persistence/authorization, keyboard/narrow behavior, console and failed-request classifications, generated SQL/meta/route review and every fresh `EV-VIS-01`–`EV-VIS-06` comparison in `evaluation.md`. After the single Integrated Reviewer completes, verify every finding, resume the same Reviewer after any correction, and route directly to `conclude-spec` only when all tasks, phases, scenarios, evidence and findings are complete.

#### F7-T2 — Implement revision-3 contextual Types navigation

- **Status/owner:** `completed` — Orchestrator with Builder Web `01a02b49-e868-7512-b06b-2f96c6b88b24`
- **Scope:** Remove the global Manager sidebar item, add the Manager-visible contextual Types link to the Products page, update affected tests and fresh visual/browser evidence, and preserve the direct Manager-only Types route and dialog shortcut.
- **Exit:** Affected Web checks, route coverage, fresh screenshots and same-Reviewer recheck are recorded in `evaluation.md`; all revision-3 findings are resolved.

#### F7-T3 — Implement Types-page return navigation

- **Status/owner:** `completed` — Orchestrator
- **Scope:** Add the accessible `Voltar` link with a left-arrow icon to the Types page, targeting Products; update the shared icon map, route coverage and fresh desktop/narrow screenshots.
- **Exit:** Web generation, code/types, focused unit and six-test Types route suite pass; the fresh screenshots show the link without responsive overflow.

#### F7-T4 — Correct action colors and history-aware return navigation

- **Status/owner:** `completed` — Orchestrator
- **Scope:** Amend the Spec/PRD contract, style enabled unused-type removal as a readable destructive outline and in-use removal as a readable neutral disabled action, and make `Voltar` return to the exact previously visited URL with a direct-entry Products fallback.
- **Exit:** Focused Types route coverage passes 7/7 with explicit color, canonical-history and direct-entry fallback assertions; fresh desktop/narrow screenshots are inspected; Web code/types checks and the integrated Reviewer recheck are current.

#### F7-T5 — Extract and reuse the shared BackLink widget

- **Status/owner:** `completed` — Builder Web `01a02ebf-cb87-7400-b7fe-9d424e63f166`
- **Scope:** Create the shared `BackLink` widget, replace the local Types-page markup and Product Details button with it, and preserve existing callback/history/fallback behavior across both surfaces.
- **Exit:** Shared widget and Product Details focused route/component coverage pass; Types route remains 7/7; fresh Product Details and Types screenshots are inspected; Web code/types and the same Reviewer recheck are current.

#### F7-T6 — Restore the compact neutral BackLink style

- **Status/owner:** `completed` — Builder Web `01a02ebf-cb87-7400-b7fe-9d424e63f166`
- **Depends/parallel:** Depends on F7-T5; no parallel Web implementation path because the shared widget is the sole style boundary.
- **Paths:** `apps/web/src/ui/shared/widgets/components/back-link/index.tsx`, plus the focused Product Details and Types route assertions/screenshots when required.
- **Contract:** `RF-13`; `CA-15`.
- **Outcome:** The shared `BackLink` matches the supplied old-style reference through compact neutral token styling, dark foreground/icon treatment and medium-weight label typography while preserving Anchor semantics and consumer-owned navigation.
- **Rules:** `documentation/rules/ui-layer-rules.md`; `documentation/rules/widget-testing-rules.md`; `documentation/design.md`.
- **Exit:** Focused Types and Product Details route scenarios pass, fresh desktop/narrow screenshots are captured and inspected, Web code/type checks pass, and the same Integrated Reviewer recheck reports no actionable findings.

#### F7-C1 — Correct Web CI browser-suite topology and loading-state determinism

- **Status/owner:** `completed` — Builder Web `01a02f14-5d39-7473-92c4-a4045ddcd233` (reused ownership assignment; exact activation recorded in Evaluation before source edits)
- **Depends/parallel:** Resumes after the current-head Web CI failure; no parallel Web implementation path.
- **Paths:** `.github/workflows/web-app-ci.yml`, `apps/web/tests/routes/mrp/products.$productId.accompaniments.test.ts`, `apps/web/tests/routes/mrp/products.$productId.recipe.test.ts`, and factual validation guidance under `documentation/tooling.md`.
- **Contract:** `RF-10`, `CA-13`, plus the validation boundary that mocked Web route CI is distinct from the real-service browser scenario.
- **Outcome:** Web CI runs only the mocked route suite with one worker and does not invoke the live-service integration without its required services; candidate and Recipe loading assertions hold requests explicitly, and the Recipe production-preview fixture supplies the Product Details stock response so the documented loading, retry and recovery behavior is deterministic.
- **Rules:** `documentation/rules/web-app-routing-rules.md`, `documentation/rules/widget-testing-rules.md`, `documentation/rules/code-conventions-rules.md`, `documentation/tooling.md`.
- **Exit:** `pnpm --filter web exec playwright test tests/routes --workers=1` passes 108/108; the focused correction scenarios, Web code/type checks and diff check pass; the real authenticated integration remains separately runnable with healthy Server/Supabase services; and Evaluation records fresh current-candidate evidence.

## Validation and handoff

| Type | Scenario/surface | Criteria | Reference | Evidence target | Status |
| --- | --- | --- | --- | --- | --- |
| Automated | Core use cases and Validation contracts | `CA-01`–`CA-13` | F1/F3 test boundaries | `./evaluation.md` | `passed` |
| Runtime | Drizzle models, constraints, transaction scope and migration | `CA-01`–`CA-12` | Technical Contract / F2 | `./evaluation.md` | `passed` |
| Runtime | Real Nest HTTP, authorization, tenant isolation and persistence | `CA-01`–`CA-12` | F5-T2 controller suites | `./evaluation.md` | `passed` |
| Browser (mocked transport) | Product Accompaniments route workflow | `CA-01`–`CA-07`, `CA-13`, `CA-14` | `products.$productId.accompaniments.test.ts` | `./evaluation.md` | `passed` |
| Browser (mocked transport) | Accompaniment Types route workflow | `CA-08`–`CA-14` | `accompaniment-types.index.test.ts` | `./evaluation.md` | `passed` |
| Browser (real services) | Authenticated link/type lifecycle, reload persistence, stock invariance and tenant security | `CA-03`–`CA-12` | `apps/web/tests/integration/mrp/products.$productId.accompaniments.real.integration.test.ts` | `./evaluation.md` | `passed_with_authorized_difference` |
| Manual | MV-01 — product accompaniment lifecycle and stock invariance | `CA-01`–`CA-07`, `CA-13` | Spec MV-01; `b1dyL.png`, `iSdux.png`, `DyrWo.png` | `./evaluation.md` | `passed_with_authorized_difference` |
| Manual | MV-02 — shared type lifecycle, pagination and concurrent protection | `CA-08`–`CA-11`, `CA-13` | Spec MV-02; `A5c2Q.png`, `PUht1.png`, `l5ItL.png` | `./evaluation.md` | `passed` |
| Manual | MV-03 — keyboard and narrow responsive surfaces | `CA-13`, `CA-14` | Spec MV-03; EV-VIS-06 | `./evaluation.md` | `passed_with_authorized_difference` |
| Manual | MV-04 — authorization and tenant isolation | `CA-02`, `CA-05`, `CA-12`, `CA-14` | Spec MV-04 | `./evaluation.md` | `passed_with_authorized_difference` |
| Visual | Populated Accompaniments page — 1560 × 1097 | `CA-01`–`CA-04`, `CA-07` | `./design/b1dyL.png` / EV-VIS-01 | Playwright artifact and independent comparison in `./evaluation.md` | `passed_with_authorized_difference` |
| Visual | Link dialog idle — 676 × 843 | `CA-03`–`CA-05`, `CA-13` | `./design/iSdux.png` / EV-VIS-02 | Playwright artifact and independent comparison in `./evaluation.md` | `passed_with_authorized_difference` |
| Visual | Edit dialog idle — 676 × 843 | `CA-03`, `CA-06`, `CA-13` | `./design/DyrWo.png` / EV-VIS-02 | Playwright artifact and independent comparison in `./evaluation.md` | `passed_with_authorized_difference` |
| Visual | Populated Types page — 1560 × 956 | `CA-08`–`CA-11` | `./design/A5c2Q.png` / EV-VIS-03 | Playwright artifact and independent comparison in `./evaluation.md` | `passed_with_authorized_difference` |
| Visual | Create type dialog — 676 × 562 | `CA-09`, `CA-13` | `./design/PUht1.png` / EV-VIS-04 | Playwright artifact and independent comparison in `./evaluation.md` | `passed_with_authorized_difference` |
| Visual | Edit type dialog — 676 × 562 | `CA-10`, `CA-13` | `./design/l5ItL.png` / EV-VIS-04 | Playwright artifact and independent comparison in `./evaluation.md` | `passed_with_authorized_difference` |
| Visual | Accompaniments loading, empty, GET error/retry and unavailable source — 1560 × 1097 | `CA-01`–`CA-05`, `CA-13` | Manifest supplemental decision / EV-VIS-05 | Independent fresh Playwright captures and comparisons in `./evaluation.md` | `passed_with_authorized_difference` |
| Visual | Link-dialog validation, pending, duplicate and server failure — 676 × 843 | `CA-05`, `CA-13` | Manifest supplemental decision / EV-VIS-05 | Independent fresh Playwright captures and comparisons in `./evaluation.md` | `passed_with_authorized_difference` |
| Visual | Edit-dialog retained failure and pending state — 676 × 843 | `CA-06`, `CA-13` | Manifest supplemental decision / EV-VIS-05 | Independent fresh Playwright captures and comparisons in `./evaluation.md` | `passed_with_authorized_difference` |
| Visual | Remove-link confirmation — 596 × 353 | `CA-07`, `CA-13` | Manifest supplemental decision / EV-VIS-05 | Independent fresh Playwright capture and comparison in `./evaluation.md` | `passed_with_authorized_difference` |
| Visual | Remove-type confirmation — 596 × 353 | `CA-11`, `CA-13` | Manifest supplemental decision / EV-VIS-05 | Independent fresh Playwright capture and comparison in `./evaluation.md` | `passed_with_authorized_difference` |
| Visual | Types loading, empty, GET error/retry, in-use rejection and pagination — 1560 × 956 | `CA-08`–`CA-11`, `CA-13` | Manifest supplemental decision / EV-VIS-05 | Independent fresh Playwright captures and comparisons in `./evaluation.md` | `passed_with_authorized_difference` |
| Visual | Accompaniments page at 320 × 900 | `CA-13`, `CA-14` | Manifest supplemental decision / EV-VIS-06 | Fresh narrow Playwright screenshot and comparison in `./evaluation.md` | `passed_with_authorized_difference` |
| Visual | Types page at 320 × 900 | `CA-13`, `CA-14` | Manifest supplemental decision / EV-VIS-06 | Fresh narrow Playwright screenshot and comparison in `./evaluation.md` | `passed_with_authorized_difference` |
| Visual | Accompaniment dialogs at 320 × 900 | `CA-05`–`CA-07`, `CA-13`, `CA-14` | Manifest supplemental decision / EV-VIS-06 | Fresh narrow Playwright screenshots and comparisons in `./evaluation.md` | `passed_with_authorized_difference` |
| Visual | Type dialogs at 320 × 900 | `CA-09`–`CA-11`, `CA-13`, `CA-14` | Manifest supplemental decision / EV-VIS-06 | Fresh narrow Playwright screenshots and comparisons in `./evaluation.md` | `passed_with_authorized_difference` |
| Review | One complete integrated candidate, cross-Builder contracts and all affected surfaces | `RF-01`–`RF-12`, `CA-01`–`CA-14` | [`implementation-reviewer-agent.md`](../../../agents/implementation-reviewer-agent.md) | One Integrated Reviewer report plus Orchestrator-verified findings in `./evaluation.md` | `passed` |

The single read-only Integrated Reviewer is scheduled after F4/F5 diffs are integrated and
before readiness. It checks the complete candidate, cross-Builder contracts, generated
migration/route artifacts, every supplied and supplemental visual comparison, and high-risk
Playwright CLI keyboard, responsive, console, network, authorization and persistence paths.
Its report is advisory: the Orchestrator verifies each finding, records accepted findings in
`evaluation.md`, invalidates stale evidence, resumes the responsible Builder for in-Contract
corrections and resumes the same Reviewer after corrections.

Final handoff requires every task and phase completed; current revision-2 Core, Validation,
Server and Web commands; reviewed generated migration/meta and route tree; healthy services,
accounts and disposable fixtures; executable `MV-01`–`MV-04`; recorded transient screenshot
identifiers; independent final Spec-tree and visual comparisons; resolved supplemental-state
decisions; completed Integrated Reviewer recheck; every verified finding resolved; and no
blocking finding active. Then route directly to `conclude-spec`.
