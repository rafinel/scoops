---
title: Product registration and stock brand controls — implementation plan
status: in_progress
spec: ./spec.md
spec_revision: 4
evaluation: ./evaluation.md
github_issue: https://github.com/rafinel/scoops/issues/31
updated_at: 2026-09-05
---

# Product registration and stock brand controls — implementation plan

## Execution status

- **Spec:** [`./spec.md`](./spec.md), revision `4`, status `in_progress`.
- **Plan rationale:** Plan-backed execution is required because the Contract spans Core, shared Validation, transactional Drizzle migration, REST and tenant/auth integration, a generated route tree, a design-backed Web migration, and real full-stack Playwright CLI evidence.
- **Current phase:** F6 — Integrated conformance and handoff.
- **Next action:** Route directly to `conclude-spec` after the final publication preflight.
- **Active blockers:** None. Every `MV-*` scenario is required to run through the Playwright CLI; the committed Web route suite supplies mocked browser coverage, while authenticated server-backed Playwright scenarios supply runtime/persistence evidence. The full Web integration invocation was interrupted by the runner during unrelated Identity tests; the affected MRP route boundaries passed 35/35. No database seed reset is required for the recipe-line migration/tests.
- **Active Builders:** None. All Builder and Builder Fix scopes are complete; the Orchestrator finalized integrated evidence.

## Execution ledger

| Wave | Builder | Phase | Name | Depends on | Parallel with | Status | Exit condition |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | `Builder Core` | F1 | Core contracts and use cases | — | — | `completed` | Core contracts, invariants, atomic inputs and use-case tests pass focused checks. |
| 2 | `Builder Validation` | F2 | Shared runtime schemas | F1 | F3 | `completed` | MRP transport and Web form schemas are exported and consumer checks pass. |
| 2 | `Builder Server` | F3 | Stock persistence and migration | F1 | F2 | `completed` | Nullable justification persistence and generated migration artifacts are current and reviewed. |
| 3 | `Builder Server` | F4 | REST boundary and integration | F2, F3 | F5 | `completed` | Controllers, DTOs, REST examples and real integration suites prove HTTP, authorization, tenant and persistence contracts. |
| 3 | `Builder Web` | F5 | Registration and stock Web experience | F1, F2 | F4 | `completed` | Web adapters, route/page migration, adjustment/history widgets and mocked browser coverage pass with fresh visual evidence. |
| 4 | `Builder Direct` | F7 | Recipe ingredient brand selection | F1, F2, F3, F4, F5, F6 | — | `completed` | Recipe-line brand selection is persisted, defaults to primary/fallback, and drives recipe metrics, production preview and consumption in focused Core/Server/Web and mocked route evidence. |
| 4 | `Orchestrator` | F6 | Integrated conformance and handoff | F4, F5, F7 | — | `completed` | Revision-4 path, architecture, test ownership, Playwright CLI runtime and visual evidence are reconciled before conclusion. |

### F1 — Core contracts and use cases

#### F1-T1 — Extend MRP domain input and transaction contracts

- **Status/owner:** `completed` — Builder Core
- **Depends/parallel:** No dependency; F1-T2 waits for these domain declarations. No same-path parallel work.
- **Paths:** `packages/core/src/mrp/domain/structures/product-registration-brand-input.ts`; `packages/core/src/mrp/domain/structures/register-product-input.ts`; `packages/core/src/mrp/domain/structures/adjust-product-stock-input.ts`; `packages/core/src/mrp/domain/entities/stock-transaction.ts`; `packages/core/src/mrp/domain/structures/index.ts`.
- **Contract:** `RF-03`, `RF-04`, `RF-06`, `RF-07`; `CA-03`–`CA-08`.
- **Outcome:** Core exposes registration-only explicit `isPrimary`, preserves the existing add-brand input without `isPrimary`, exports the new registration structure, exposes optional normalized-compatible justification, and adds an immutable optional transaction justification snapshot without moving business decisions into structures/entities.
- **Rules:** `documentation/rules/code-conventions-rules.md` (declarations, naming, barrels); `documentation/rules/core-package-rules.md` (one exported type/file, entity identity and business rules only in use cases).
- **Exit:** Completed: focused/full Core checks passed; fields, optionality, barrels and identity boundaries match Spec revision 3; result recorded in `evaluation.md`.

#### F1-T2 — Enforce primary-brand and justification use-case behavior

- **Status/owner:** `completed` — Builder Core
- **Depends/parallel:** Depends on F1-T1; no parallel work because both use cases consume the revised domain contracts.
- **Paths:** `packages/core/src/mrp/use-cases/register-product-use-case.ts`; `packages/core/src/mrp/use-cases/adjust-product-stock-use-case.ts`; `packages/core/src/mrp/use-cases/tests/register-product-use-case.test.ts`; `packages/core/src/mrp/use-cases/tests/adjust-product-stock-use-case.test.ts`.
- **Contract:** `RF-03`–`RF-08`; `CA-02`–`CA-09`.
- **Outcome:** Registration rejects zero/multiple primary brands and persists the selected flag in one transaction; manual adjustments normalize justification, preserve existing stock rules, and write balance/cost/ledger atomically with no new event.
- **Rules:** `documentation/rules/code-conventions-rules.md` (application errors and class-owned helpers); `documentation/rules/core-package-rules.md` (business rules in use cases); `documentation/rules/use-case-testing-rules.md` (one test file/use case, typed mocks, deterministic time and infrastructure-free tests).
- **Exit:** Completed: `check:code`, `check:types`, focused tests, full Core tests and architecture checks passed; selected non-first brand, invalid cardinality/rollback, absent/blank/trimmed justification, authorization and event timing are covered; results recorded in `evaluation.md`.

### F2 — Shared runtime schemas

#### F2-T1 — Update MRP transport and Web form schemas

- **Status/owner:** `completed` — Builder Validation
- **Depends/parallel:** Depends on F1; safe in parallel with F3. Reconcile the F1 public structure/export names before completion.
- **Paths:** `packages/validation/src/mrp/product-registration-brand-schema.ts`; `packages/validation/src/mrp/register-product-schema.ts`; `packages/validation/src/mrp/adjust-product-stock-schema.ts`; `packages/validation/src/web/product-registration-form-schema.ts`; `packages/validation/src/web/stock-adjustment-form-schema.ts`; `packages/validation/src/index.ts`.
- **Contract:** `RF-02`–`RF-04`, `RF-06`, `RF-07`; `CA-02`, `CA-04`, `CA-05`, `CA-07`, `CA-08`.
- **Outcome:** Registration uses a dedicated schema extending the unchanged add-brand shape with required `isPrimary`; REST schemas enforce registration mode/brand cardinality and adjustment shape; the Web schema preserves localized form validation and selected-brand state; optional justification trims to absence; all public schemas are exported from the package root.
- **Rules:** `documentation/rules/code-conventions-rules.md` (files and barrels); `documentation/rules/validation-package-rules.md` (schema ownership, core enum derivation, consumer boundaries, root exports and no authorization/business rules).
- **Exit:** Run `pnpm --filter @scoops/validation check:code`, `pnpm --filter @scoops/validation check:types` and applicable tests; inspect valid, malformed, conflicting, empty and boundary inputs plus complete exports; record results.

### F3 — Stock persistence and migration

#### F3-T1 — Persist immutable stock justification and generate migration

- **Status/owner:** `completed` — Builder Server
- **Depends/parallel:** Depends on F1; safe in parallel with F2. Builder Server exclusively owns the model, mapper and generated migration/journal/snapshot paths.
- **Paths:** `apps/server/src/mrp/database/drizzle/models/stock-transaction-model.ts`; `apps/server/src/mrp/database/drizzle/mappers/drizzle-stock-transaction-mapper.ts`; `apps/server/src/shared/database/drizzle/migrations/0019_product-stock-justification.sql`; `apps/server/src/shared/database/drizzle/migrations/meta/_journal.json`; `apps/server/src/shared/database/drizzle/migrations/meta/0019_snapshot.json`.
- **Contract:** `RF-03`, `RF-06`, `RF-07`; `CA-03`, `CA-04`, `CA-07`, `CA-08`.
- **Outcome:** The Drizzle model and mapper round-trip nullable `justification` as an optional domain field while preserving existing indexes, constraints, snapshots and transaction boundaries; the additive migration is generated after `0018` with no backfill.
- **Rules:** `documentation/rules/code-conventions-rules.md` (naming and barrels); `documentation/rules/database-layer-rules.md` (module ownership, model/type/mapper boundary, generated migrations and no repository-direct tests).
- **Exit:** Run `pnpm --filter server db:migration:generate -- --name product-stock-justification` once and focused Biome checks; review SQL, journal ordering and snapshot/model parity without hand-editing generated files; record the migration review in `evaluation.md`.

### F4 — REST boundary and integration

#### F4-T1 — Wire registration, adjustment and history REST contracts

- **Status/owner:** `completed` — Builder Server
- **Depends/parallel:** Depends on F2 and F3; safe in parallel with F5 because Server REST paths and Web source paths do not overlap. F4-T2 waits for the controller/DTO contract.
- **Paths:** `apps/server/src/mrp/rest/controllers/register-product.controller.ts`; `apps/server/src/mrp/rest/dtos/stock-transaction-response.dto.ts`; `apps/server/rest-client/mrp/products.rest`.
- **Contract:** `RF-03`–`RF-08`; `CA-02`–`CA-09`.
- **Outcome:** Manager guards, authenticated actor/tenant context, revised request mapping, optional justification serialization and existing primary-brand replacement remain aligned; the MRP REST artifact documents every route once by method/path, with the required Single/By-brand request variants, reusable local variables, representative headers/bodies and no credentials.
- **Rules:** `documentation/rules/code-conventions-rules.md` (aliases and declarations); `documentation/rules/rest-layer-rules.md` (one action/controller, semantic parameters, use-case-derived bodies, response documentation, service/REST parity and global errors); `documentation/rules/validation-package-rules.md` (shared schema consumption); `documentation/rules/database-layer-rules.md` (token injection).
- **Exit:** Run focused REST checks; compare `apps/server/rest-client/mrp/products.rest` against all `@MrpController()` routes and revised schemas, verifying one labeled request per route for `POST /products`, `POST /products/:productId/stock-adjustments`, `GET /products/:productId/stock-transactions` and every other route in the group, plus the required Single/By-brand variants, current methods/paths/parameters/headers/bodies, reusable variables and no secrets; record parity in `evaluation.md`.

#### F4-T2 — Prove real HTTP, authorization, tenant and persistence behavior

- **Status/owner:** `completed` — Builder Server
- **Depends/parallel:** Depends on F3-T1 and F4-T1; safe in parallel with F5-T1–F5-T3 because test paths do not overlap Web implementation paths.
- **Paths:** `apps/server/src/mrp/rest/controllers/tests/register-product.controller.test.ts`; `apps/server/src/mrp/rest/controllers/tests/adjust-product-stock.controller.test.ts`.
- **Contract:** `RF-02`–`RF-08`; `CA-02`–`CA-09`.
- **Outcome:** Real Nest/Drizzle controller suites prove valid Single/By-brand registration, exact primary selection, initial balances/transactions, justification round-trip, rejection/rollback, Manager-only mutation, Operator history access, foreign-tenant isolation and idempotent primary replacement.
- **Rules:** `documentation/rules/code-conventions-rules.md` (test naming and aliases); `documentation/rules/controllers-testing-rules.md` (real Nest/Supertest path, shared fixture lifecycle, isolation and HTTP-plus-persistence assertions); `documentation/rules/rest-layer-rules.md` (route contract); `documentation/rules/database-layer-rules.md` (indirect persistence validation).
- **Exit:** With the approved Docker PostgreSQL runtime available, run the focused controller suites and then `pnpm --filter server test`; record real request/response, persisted-state, authorization/tenant and rollback results. Mocked transport is not accepted as server evidence.

### F5 — Registration and stock Web experience

#### F5-T1 — Compose Web REST adapters and canonical registration navigation

- **Status/owner:** `completed` — Builder Web
- **Depends/parallel:** Depends on F1 and F2; safe in parallel with F4. The REST artifact is a read-only parity reference owned by Builder Server; F5-T1 must not edit it.
- **Paths:** `apps/web/src/constants/routes.ts`; `apps/web/src/routes/_authenticated/products/new.tsx`; `apps/web/src/routeTree.gen.ts`; `apps/web/src/ui/mrp/widgets/pages/products-page/index.tsx`; `apps/web/src/ui/mrp/widgets/pages/products-page/use-products-page.ts`; `apps/web/src/ui/mrp/widgets/pages/products-page/products-list-card/index.tsx`; parity reference `apps/server/rest-client/mrp/products.rest` (Builder Server-owned, no edits).
- **Contract:** `RF-01`, `RF-06`, `RF-08`, `RF-09`; `CA-01`, `CA-07`, `CA-09`, `CA-10`.
- **Outcome:** Web service/action contracts send the revised registration and adjustment payloads and preserve history justification; `ROUTES.newProduct`, the protected thin `/products/new` route, generated route tree and `Novo produto` navigation replace modal opening while list behavior remains intact.
- **Rules:** `documentation/rules/code-conventions-rules.md` (factories, naming and declaration order); `documentation/rules/ui-layer-rules.md` (REST factories, action hooks, application navigation, feature boundaries, visible feedback and raw-value antipattern); `documentation/rules/rest-layer-rules.md` (service mapping and cookie transport); `documentation/rules/web-app-routing-rules.md` (canonical paths, middleware, thin routes, generated tree and route integration); `documentation/tooling.md` (route generation and Playwright CLI).
- **Exit:** Run `pnpm --filter web generate-routes`, focused Web code/type checks and the products route test; inspect route middleware, final URL, exact service method/path/body/response mapping against the Server-owned `.rest` artifact, the applicable Spec widget tree, keyboard navigation, console/failed requests and a fresh transient route screenshot. Do not claim server persistence.

#### F5-T2 — Implement the dedicated registration page and migrate modal coverage

- **Status/owner:** `completed` — Builder Web
- **Depends/parallel:** Depends on F5-T1; safe in parallel with F5-T3 because page and stock-adjustment/history paths are disjoint. Remove legacy modal files only after equivalent page widget coverage exists.
- **Paths:** `apps/web/src/ui/mrp/widgets/pages/products-page/product-registration-dialog/**` (remove); `apps/web/src/ui/mrp/widgets/pages/product-registration-page/**` (create); `apps/web/tests/routes/mrp/products.index.test.ts` (remove); `apps/web/tests/routes/mrp/products.index.test.tsx` (create).
- **Contract:** `RF-01`, `RF-02`, `RF-03`, `RF-04`, `RF-09`; `CA-01`–`CA-05`, `CA-10`.
- **Outcome:** Page-owned RHF state and widgets render Product and Stock Control cards with mode/category coupling, conditional cost, numbered brand drafts and exactly one accessible primary selector; cancel/back preserve no mutation, success navigates to the created product, failures preserve values, and old modal/test paths are fully migrated.
- **Rules:** `documentation/rules/code-conventions-rules.md` (handlers and declarations); `documentation/rules/ui-layer-rules.md` (widget/hook boundaries, nested widgets, shared shadcn wrappers, focus treatment, design tokens and raw technical-value antipattern); `documentation/rules/web-app-routing-rules.md` (canonical navigation, thin route and route coverage); `documentation/rules/widget-testing-rules.md` (owning-boundary component/hook tests, state matrix, accessible queries and no structural-only completion); `documentation/design.md` (tokens, typography, card hierarchy, responsive layout and accessibility).
- **Exit:** Run focused Vitest widget tests and the route suite with mocked transport; compare the exact Spec widget tree and each affected state against `k4tYU.png` at 1440×900, `lZGJu.png` at its 1440×972 source/full frame with runtime scroll at 1440×900, and the relevant narrow state; exercise keyboard/focus, validation, pending/error/recovery, no horizontal clipping, console/failed-request inspection and save a fresh Playwright CLI screenshot for every affected design state.

#### F5-T3 — Add justification lifecycle and history presentation

- **Status/owner:** `completed` — Builder Web
- **Depends/parallel:** Depends on F5-T1; safe in parallel with F5-T2. F5-T4 waits for both page and stock-slot behavior.
- **Paths:** `apps/web/src/ui/mrp/widgets/slots/product-stock-slot/stock-adjustment-dialog/index.tsx`; `apps/web/src/ui/mrp/widgets/slots/product-stock-slot/stock-adjustment-dialog/use-stock-adjustment-dialog.ts`; `apps/web/src/ui/mrp/widgets/slots/product-stock-slot/stock-adjustment-dialog/stock-adjustment-dialog.test.tsx` (remove); `apps/web/src/ui/mrp/widgets/slots/product-stock-slot/stock-adjustment-dialog/tests/stock-adjustment-dialog.test.tsx` (create); `apps/web/src/ui/mrp/widgets/slots/product-stock-slot/stock-adjustment-dialog/tests/use-stock-adjustment-dialog.test.ts` (create); `apps/web/src/ui/mrp/widgets/slots/product-stock-slot/stock-transaction-history-card/index.tsx`; `apps/web/src/ui/mrp/widgets/slots/product-stock-slot/stock-transaction-history-card/stock-transaction-history-card.test.tsx` (remove); `apps/web/src/ui/mrp/widgets/slots/product-stock-slot/stock-transaction-history-card/tests/stock-transaction-history-card.test.tsx` (create).
- **Contract:** `RF-06`, `RF-07`, `RF-08`; `CA-07`–`CA-09`.
- **Outcome:** Entry and Write-off dialogs accept optional labelled justification, preserve input through pending/failure and reset only on success/close, while history conditionally displays trimmed justification with attribution and retains existing loading/empty/error/retry behavior.
- **Rules:** `documentation/rules/code-conventions-rules.md` (handlers and declaration order); `documentation/rules/ui-layer-rules.md` (behavior-owning hooks, shared dialog structure, focus, visible errors and design tokens); `documentation/rules/widget-testing-rules.md` (hook/component state matrix, accessible interaction and recovery assertions); `documentation/rules/rest-layer-rules.md` (consumer-owned service behavior through widgets, no service test).
- **Exit:** Run focused Web unit tests; exercise empty/whitespace/padded justification, pending, failure/retry, success/close reset and history round-trip at the widget boundary, then use Playwright CLI for the applicable MV-04 flow with keyboard/focus, console/failed-request inspection and a fresh screenshot for each affected visual state. Mocked transport remains insufficient for persistence proof.

#### F5-T4 — Complete mocked browser route coverage

- **Status/owner:** `completed` — Builder Web
- **Depends/parallel:** Depends on F5-T1, F5-T2 and F5-T3; no parallel work because this is the integrated Web route boundary.
- **Paths:** `apps/web/tests/routes/mrp/products.index.test.tsx`; `apps/web/tests/routes/mrp/products.new.test.tsx`.
- **Contract:** `RF-01`–`RF-04`, `RF-09`; `CA-01`–`CA-05`, `CA-10`; Validation Contract `MV-01` and `MV-02` browser coverage.
- **Outcome:** Shared Playwright route tests cover authenticated Manager navigation, mocked validation/server failure and recovery, Single/By-brand selection and payloads, cancel/browser Back, duplicate-submit prevention, keyboard paths, 1440×900 and 390×844 overflow behavior, final URLs and visible outcomes.
- **Rules:** `documentation/rules/web-app-routing-rules.md` (mandatory route matrix, mocked transport boundary, request/response plus visible outcome, keyboard/responsive coverage and route failure states); `documentation/rules/widget-testing-rules.md` (route/widget boundaries and accessible behavior); `documentation/rules/ui-layer-rules.md` (visible feedback, navigation and raw technical-value antipattern); `documentation/tooling.md` (shared Playwright factory, CLI and ephemeral screenshots).
- **Exit:** Run `pnpm --filter web test:integration tests/routes/mrp/products.index.test.tsx tests/routes/mrp/products.new.test.tsx`; assert exact mocked methods/paths/bodies/responses, final URLs and visible results, compare the exact Spec widget tree, exercise keyboard/focus/narrow states, inspect console messages and failed requests, and save fresh screenshots for each affected supplied design state. Label this as mocked browser evidence, not server persistence or authorization evidence.

### F6 — Integrated conformance and handoff

#### F6-T1 — Integrate, review, validate and route to conclusion

- **Status/owner:** `completed` — Orchestrator
- **Depends/parallel:** Depends on all F1–F5 task diffs and generated artifacts being integrated. Run the path sensor before integrated sensors and activate exactly one read-only [`Implementation Reviewer`](../../../agents/implementation-reviewer-agent.md) after the path sensor passes and before readiness; resume that same Reviewer after any correction.
- **Paths:** Integrated candidate; `./evaluation.md`; `./plan.md`; generated migration/journal/snapshot and `apps/web/src/routeTree.gen.ts`; `apps/server/rest-client/mrp/products.rest`; any shared composition or package/lockfile coordination discovered during integration.
- **Contract:** All `RF-01`–`RF-10`, `CA-01`–`CA-11`, `MV-01`–`MV-05`, Design Contract and final handoff condition.
- **Outcome:** The complete candidate is checked for Spec-path conformance, cross-Builder contract parity, generated artifacts, atomicity, tenant/security/history invariants, responsive/accessibility behavior, Playwright CLI server-backed evidence for every `MV-*` scenario and all required visual comparisons before direct routing to `conclude-spec`.
- **Rules:** `documentation/sdd.md` (Plan lifecycle, evidence authority, integrated Reviewer and conclusion routing); `documentation/architecture.md` (module boundaries, backend authority, tenant scope, atomic persistence and immutable history); `documentation/tooling.md` (workspace sensors, Docker prerequisites, services/accounts and Playwright CLI); all selected layer Rules listed in the Spec Rule Pack.
- **Exit:** Revision-4 path/architecture, test-integrity, affected package, route, Docker-backed `MV-05`, visual and resumed Implementation Reviewer checks pass. No blocking finding remains; final PR publication and CI are routed to `conclude-spec`.

### F7 — Recipe ingredient brand selection

#### F7-T1 — Persist and consume recipe-line brand selection

- **Status/owner:** `completed` — Builder Direct
- **Depends/parallel:** Depends on the completed revision-3 foundation; implementation is cohesive across Core, Validation, Server persistence/REST, and Web recipe widgets.
- **Paths:** `packages/core/src/mrp/domain/entities/recipe-ingredient.ts`; `packages/core/src/mrp/domain/structures/add-recipe-ingredient-input.ts`; `packages/core/src/mrp/domain/structures/recipe-ingredient-update.ts`; recipe add/update/details/pricing/preview/production use cases and tests; `packages/validation/src/mrp/recipe-ingredient-schema.ts`; recipe controllers/tests; `apps/server/src/mrp/database/drizzle/models/recipe-ingredient-model.ts`; mapper; generated `0020` migration artifacts; `apps/web/src/ui/mrp/widgets/slots/product-recipe-slot/recipe-ingredient-dialog/**`; `apps/server/rest-client/mrp/products.rest`.
- **Contract:** `RF-10`, `CA-11`, PRD `REQ-06`.
- **Outcome:** Managers can choose an active product-owned brand for a By-brand recipe ingredient; the primary or persisted brand is selected by default, the choice survives refresh, and all recipe/production projections use it. Single-stock ingredients remain unbranded.
- **Rules:** Core, Validation, REST, Database, UI, widget-testing, code-conventions and tooling rules selected by the revised Spec.
- **Exit:** Focused Core/Validation/Server/Web tests, migration application, architecture and Spec-path sensors, mocked route coverage, fresh recipe-dialog screenshot inspection, and Docker-backed `MV-05` pass. The product-ID stock query correction also proves edit-mode brand loading for ingredients outside the first catalog page.

## Execution log

- **2026-09-04 — F1-T2 Core typecheck finding**
  - **Finding/result:** `FND-001`: required registration `isPrimary` leaks into the existing post-registration add-brand input/test contract.
  - **Next action:** Pause dependent waves and route the material boundary conflict through `create-spec`; resume only after the revised Spec is `open` and the Plan is reconciled.

- **2026-09-04 — F6 integrated validation and handoff**
  - **Finding/result:** Revision-3 path sensor passed (63 contracted paths; 12 unrelated paths ignored); architecture and test-integrity sensors passed; Core, Validation, Server and Web checks passed, including full Server 86 files/219 tests and full Web 167 files/378 tests. Migration `0019_product-stock-justification` was applied to the local PostgreSQL runtime.
- **Runtime/visual result:** Authenticated Manager Playwright CLI proved single and By-brand registration, primary replacement, optional justification normalization/history, protected overdraw recovery, console/network health and fresh 1440×900/390×844 screenshots. Same Implementation Reviewer recheck passed with no findings.

- **2026-09-05 — F7 correction and final integrated recheck**
  - **Finding/result:** The recipe ingredient edit hook now loads stock and brands by the persisted ingredient product ID, so By-brand ingredients outside the first catalog page still expose the primary/default brand and selectable alternatives. Focused recipe-dialog tests passed 7/7; affected MRP route tests passed 22/22; test-integrity passed with the browser environment source explicitly classified; Docker-backed `MV-05` passed with PostgreSQL read-back; auth storage states were restored to their clean baseline.
  - **Reviewer result:** The same Implementation Reviewer was resumed after the correction and reported no remaining blocking implementation findings. The only stale record was this Plan, now reconciled; the candidate is ready for `conclude-spec`.

## Validation and handoff

| Type | Scenario/surface | Criteria | Reference | Evidence target | Status |
| --- | --- | --- | --- | --- | --- |
| Automated | Complete affected-path map | All `RF-*`, `CA-*` | Spec Technical Contract | `./evaluation.md` — `pnpm check:spec-implementation -- documentation/features/mrp/product-registration-and-stock-brand-controls/spec.md` | `passed` |
| Automated | Architecture and test ownership | All affected boundaries | Spec Rule Pack and Architecture | `./evaluation.md` — `pnpm check:architecture` and `pnpm check:test-integrity` pass; the exact browser environment source is classified as an allowed direct-test boundary | `passed` |
| Automated | Core contracts/use cases | `CA-02`–`CA-09` | Spec Core Contract | `./evaluation.md` — Core code/types/tests/coverage | `passed` |
| Automated | Shared Validation schemas | `CA-02`, `CA-04`, `CA-05`, `CA-07`, `CA-08` | Spec Validation Contract | `./evaluation.md` — Validation code/types/tests/coverage | `passed` |
| Automated | Server REST/database build and coverage | `CA-02`–`CA-09` | Spec Server Contract | `./evaluation.md` — Server code/types/tests/build/coverage and migration checks | `passed` |
| Automated | Web source, route generation and coverage | `CA-01`–`CA-05`, `CA-07`, `CA-10` | Spec Web Contract | `./evaluation.md` — Web route generation/code/types/tests/build/coverage | `passed` |
| Automated | Recipe-line brand selection | `RF-10`, `CA-11` | Spec Core/Validation/REST/Database/Web contracts | `./evaluation.md` — focused tests, migration `0020`, exact mocked PATCH, and fresh dialog screenshot | `passed` |
| REST client | MRP products route group | `CA-03`, `CA-04`, `CA-06`, `CA-07` | `apps/server/rest-client/mrp/products.rest` and all `@MrpController()` routes | `./evaluation.md` — exact artifact path plus method/path/parameter/header/body parity record | `passed` |
| Runtime | Real registration and initial stock graph | `CA-02`–`CA-05`, `CA-09` | `MV-01`, `MV-02`; Server Integration Contract | `./evaluation.md` — authenticated Playwright CLI URL/request assertions plus real HTTP response and persisted product/brand/balance/transaction result | `passed` |
| Runtime | Real primary replacement and manual adjustment history | `CA-06`–`CA-09` | `MV-03`, `MV-04`; Server Integration Contract | `./evaluation.md` — authenticated Playwright CLI authorization/tenant, idempotency, rollback and justification round-trip result | `passed` |
| Playwright CLI | `MV-01` — Single-stock registration and cancellation | `CA-01`, `CA-02`, `CA-03`, `CA-10` | Spec `MV-01` | `./evaluation.md` — Playwright CLI URL, mutation/persistence, keyboard, viewport, console/network and cleanup record | `passed` |
| Playwright CLI | `MV-02` — By-brand registration and primary selection | `CA-04`, `CA-05`, `CA-10` | Spec `MV-02` | `./evaluation.md` — Playwright CLI selector accessibility/payload, persisted graph, keyboard, viewport and scroll record | `passed` |
| Playwright CLI | `MV-03` — Authorization, isolation and future-only replacement | `CA-06`, `CA-09` | Spec `MV-03` | `./evaluation.md` — Playwright CLI Manager/Operator/foreign-resource HTTP, persistence, history and console/network record | `passed` |
| Playwright CLI | `MV-04` — Adjustment justification and recovery | `CA-07`, `CA-08`, `CA-09` | Spec `MV-04` | `./evaluation.md` — Playwright CLI empty/trimmed history, rejection rollback, retry/focus and reload record | `passed` |
| Playwright CLI | `MV-05` — Recipe ingredient brand selection | `CA-11` | Spec `MV-05` | `./evaluation.md` — Playwright CLI source selector, persistence, recalculated metrics and production/preview consumption | `passed` |
| Visual | Single stock desktop, 1440×900 | `CA-01`, `CA-02`, `CA-03`, `CA-10` | [`k4tYU.png`](./design/k4tYU.png) | Fresh Playwright screenshot and independent comparison recorded in `./evaluation.md` | `passed` |
| Visual | By-brand desktop, 1440×972 source and 1440×900 runtime scroll | `CA-04`, `CA-05`, `CA-10` | [`lZGJu.png`](./design/lZGJu.png) | Fresh Playwright screenshot at runtime viewport plus scroll/comparison record in `./evaluation.md` | `passed` |
| Visual | Single stock narrow, 390×844 | `CA-01`, `CA-03`, `CA-10` | [`g9l12m.png`](./design/g9l12m.png) | Fresh Playwright screenshot, no-horizontal-overflow and comparison record in `./evaluation.md` | `passed` |
| Visual | By-brand narrow scrolled, 390×844 | `CA-04`, `CA-05`, `CA-10` | [`z41Sbx.png`](./design/z41Sbx.png) | Fresh Playwright screenshot, scroll/focus/overflow and comparison record in `./evaluation.md` | `passed` |
| Review | Complete integrated candidate and all affected surfaces | All `RF-*`, `CA-*`, `MV-*` | [`Implementation Reviewer`](../../../agents/implementation-reviewer-agent.md) | Reviewer report verified in `./evaluation.md`; same Reviewer recheck after corrections; no blocking finding | `passed` |

Final handoff requires every task and phase to be complete; the revision-4 Spec remains current; all current workspace commands and coverage floors pass; generated migration and route artifacts are reviewed; the REST artifact is route-complete; services, accounts and fixtures are ready; every `MV-*` is executable; each supplied design reference has independent fresh visual evidence; the final path/tree/conformance comparison passes; the single Implementation Reviewer is complete and all verified findings are resolved; no blocker remains. Then route directly to `conclude-spec`.
