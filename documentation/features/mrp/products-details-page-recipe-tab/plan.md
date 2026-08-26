---
title: Product details Recipe tab — implementation plan
status: completed
spec: ./spec.md
spec_revision: 1
evaluation: ./evaluation.md
github_issue: https://github.com/rafinel/scoops/issues/13
updated_at: 2026-08-22
---

## Execution status

- **Spec:** [`spec.md`](./spec.md) — revision `1`, `completed`; implementation evaluation is complete.
- **Rationale:** Plan-backed execution is required for the dependency chain across shared Core/Validation contracts, transactional Server persistence and REST, and the design-backed Web workflow.
- **Current phase:** Conclusion complete; final PR quality gate passed.
- **Next action:** None. Await reviewer approval on the draft PR.
- **Active blockers:** None. The recheck has no remaining finding; FND-006 remains accepted non-blocking and FND-019 is rejected as contrary to the approved empty-Recipe contract.
- **Builders:** F1–F5 are complete. No Builder is active.
- **Coordination:** The Orchestrator exclusively reviews generated Drizzle migration artifacts and `routeTree.gen.ts`; no package or lockfile change is planned.

## Execution ledger

| Wave | Builder | Phase | Name | Depends on | Parallel with | Status | Exit condition |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | `Builder Core` | F1 | Shared contracts and validation | — | — | `completed` | Core and Validation declarations/schema checks pass and public contracts match Spec revision 1. |
| 2 | `Builder Server` | F2 | Transactional persistence | F1 | F3, F4 | `completed` | Generated migration, repository mapping/constraint and rollback evidence pass against the contracted ports. |
| 2 | `Builder Core` | F3 | Recipe and production use cases | F1 | F2, F4 | `completed` | Deterministic use-case tests prove policy, tenancy, precision, preview and atomic orchestration. |
| 2 | `Builder Web` | F4 | Recipe and cost UI workflow | F1 | F2, F3 | `completed` | Widget and mocked-route evidence proves the complete accessible Recipe, Produce and cost-field workflow. |
| 3 | `Builder Server` | F5 | REST composition and controller integration | F2, F3 | — | `completed` | Real Nest HTTP tests prove method/path/schema/status/authorization and persisted results. |
| 4 | `Orchestrator` | F6 | Integrated conformance and readiness | F4, F5 | Integrated Reviewer | `completed` | All Spec sensors, manual scenarios, visual comparisons and verified review findings are current on one integrated candidate. |

### F1 — Shared contracts and validation

#### F1-T1 — Establish canonical MRP recipe, production and cost contracts

- **Status/owner:** `completed` — Builder Core
- **Depends/parallel:** Starts after the Orchestrator records revision 1 and this card; no parallel task in F1.
- **Paths:** `packages/core/src/mrp/domain/{entities,structures,events}/**`, `packages/core/src/mrp/interfaces/**`, `packages/core/src/mrp/use-cases/tests/**`, `packages/core/src/mrp/use-cases/{create-product,register-product,update-product,adjust-product-stock}-use-case.ts`, `packages/validation/src/{mrp,web}/**`, `packages/validation/src/index.ts`
- **Contract:** `RF-03`–`RF-11`; `CA-02`, `CA-04`–`CA-13`
- **Outcome:** Core exposes the one-file-per-declaration entities, structures, tenant-qualified ports and cost vocabulary, while Validation exposes the reusable input and route-search schemas needed unchanged by Server and Web.
- **Rules:** `documentation/rules/code-conventions-rules.md`; `documentation/rules/core-package-rules.md`; `documentation/rules/validation-package-rules.md`; `documentation/rules/use-case-testing-rules.md`; `documentation/rules/provision-layer-rules.md`.
- **Exit:** `pnpm --filter core check:code && pnpm --filter core check:types && pnpm --filter validation check:code && pnpm --filter validation check:types`; focused Core test evidence covers fakers and registration/entry cost validation; confirm Core has no Validation/framework import and schemas carry no authorization/business rule.

### F2 — Transactional persistence

#### F2-T1 — Persist Recipes, production snapshots and correlated stock facts

- **Status/owner:** `completed` — Builder Server
- **Depends/parallel:** Depends on F1; safe in parallel with F3 and F4 because paths do not overlap.
- **Paths:** `apps/server/src/mrp/database/**`, `apps/server/src/mrp/constants/mrp-repositories.ts`, `apps/server/src/mrp/mrp.module.ts`, `apps/server/src/mrp/fixtures/mrp-module-fixture.ts` (import-only F1 type relocation), `apps/server/src/shared/database/drizzle/migrations/0008_product_recipe_production.sql`, `apps/server/src/shared/database/drizzle/migrations/meta/{0008_snapshot.json,_journal.json}`
- **Contract:** `RF-04`–`RF-07`, `RF-10`, `RF-11`; `CA-05`, `CA-08`, `CA-11`–`CA-13`
- **Outcome:** Drizzle models, generated migration, tenant-scoped repositories and transaction scope preserve exact numeric, uniqueness, snapshot, correlation and rollback guarantees.
- **Rules:** `documentation/rules/code-conventions-rules.md`; `documentation/rules/database-layer-rules.md`; `documentation/rules/core-package-rules.md`; `documentation/rules/use-case-testing-rules.md`.
- **Exit:** Generate rather than hand-author the migration with `pnpm --filter server db:migration:generate`, inspect model/migration/meta consistency, then run `pnpm --filter server check:code && pnpm --filter server check:types && pnpm --filter server test`; database evidence proves tenant isolation, constraints, numeric mappings, one serialization retry and all-or-nothing production rollback.

### F3 — Recipe and production use cases

#### F3-T1 — Implement authoritative Recipe lifecycle, preview and atomic production policy

- **Status/owner:** `completed` — Builder Core
- **Depends/parallel:** Depends on F1; safe in parallel with F2 and F4. Reuses Builder Core and must not change F1 public contracts without an approved Spec amendment.
- **Paths:** `packages/core/src/mrp/use-cases/{get-product-recipe,save-recipe-yield,add-recipe-ingredient,update-recipe-ingredient,remove-recipe-ingredient,preview-production,register-production}-use-case.ts`, `packages/core/src/mrp/use-cases/{index.ts,tests/**}`, `packages/core/src/mrp/domain/entities/fakers/**` (F3 test-data compliance)
- **Contract:** `RF-02`–`RF-11`; `CA-01`–`CA-14`
- **Outcome:** Manager- and tenant-bound Core actions own recipe reads/mutations, source/cost/capacity projections, read-only preview, revalidated serializable commit, `DatetimeProvider` time and no unreliable broker publication.
- **Rules:** `documentation/rules/code-conventions-rules.md`; `documentation/rules/core-package-rules.md`; `documentation/rules/use-case-testing-rules.md`; `documentation/rules/provision-layer-rules.md`.
- **Exit:** Focused deterministic use-case tests prove absent versus empty Recipe, invalid/duplicate/self/foreign input, source changes, shortages/negative-stock policy, Manager denial, retry conflict and zero partial facts; run Core code/type checks and record mocked-provider boundaries separately from Server persistence evidence.

### F4 — Recipe and cost UI workflow

#### F4-T1 — Deliver the route-backed, accessible Manager workflow and mocked browser contract

- **Status/owner:** `completed` — Builder Web
- **Depends/parallel:** Depends on F1; safe in parallel with F2 and F3. It uses the specified REST contract and mocked transport only until F5 is integrated.
- **Paths:** `apps/web/src/routes/_authenticated/products/$productId.tsx`, `apps/web/src/constants/routes.ts`, `apps/web/src/routeTree.gen.ts`, `apps/web/src/rest/services/mrp-service.ts`, `apps/web/src/ui/mrp/{hooks/**,widgets/components/product-details-tabs/**,widgets/pages/product-recipe-slot/**,widgets/pages/product-stock-slot/**,widgets/pages/products-page/product-registration-dialog/**}`, `apps/web/src/ui/shared/widgets/{components/icon/**,layouts/app-layout/**}`, `apps/web/tests/{fixtures/mrp-module-fixture.ts,routes/mrp/products.$productId.test.ts}`
- **Contract:** `RF-01`–`RF-09`, `RF-12`; `CA-01`–`CA-10`, `CA-13`–`CA-15`
- **Outcome:** The thin validated route, tabs, cards, dialogs, service/hook invalidation and conditional cost controls implement the Spec widget tree, URL persistence, recovery, keyboard and responsive behavior using existing tokens/primitives.
- **Rules:** `documentation/rules/code-conventions-rules.md`; `documentation/rules/validation-package-rules.md`; `documentation/rules/ui-layer-rules.md`; `documentation/rules/web-app-routing-rules.md`; `documentation/rules/widget-testing-rules.md`.
- **Exit:** Run `pnpm --filter web generate-routes`, inspect generated-tree diff, then `pnpm --filter web check:code && pnpm --filter web check:types && pnpm --filter web test && pnpm --filter web test:integration tests/routes/mrp/products.$productId.test.ts`; test the exact widget tree against each supplied reference, keyboard and 320 × 900 states, inspect console/failed mocked requests, and capture fresh Playwright CLI screenshots for every affected reference/supplemental state. Mark the browser result explicitly as mocked transport, not Server/persistence proof.

### F5 — REST composition and controller integration

#### F5-T1 — Expose the Manager-only Recipe and production HTTP boundary

- **Status/owner:** `completed` — Builder Server
- **Depends/parallel:** Depends on F2 and F3; no overlapping Builder path is active. Reuses Builder Server to retain persistence and wiring context.
- **Paths:** `apps/server/src/mrp/rest/{controllers/**,dtos/**}`, `apps/server/src/mrp/mrp.module.ts`, `apps/server/src/mrp/database/mrp-repositories.ts`, `apps/server/src/mrp/constants/mrp-repositories.ts`
- **Contract:** `RF-01`–`RF-11`; `CA-01`, `CA-02`, `CA-05`, `CA-08`, `CA-11`–`CA-14`
- **Outcome:** Nest controllers and DTOs map all seven specified operations through shared Zod boundaries to real Core/persistence wiring, with authoritative authentication, Manager authorization, tenant hiding and error semantics.
- **Rules:** `documentation/rules/code-conventions-rules.md`; `documentation/rules/rest-layer-rules.md`; `documentation/rules/controllers-testing-rules.md`; `documentation/rules/database-layer-rules.md`; `documentation/rules/validation-package-rules.md`; `documentation/rules/provision-layer-rules.md`.
- **Exit:** `pnpm --filter server check:code && pnpm --filter server check:types && pnpm --filter server test`; real Nest/Supertest evidence covers exact methods/paths/bodies/statuses, Swagger serialization, 403/404 tenant-profile cases and real persisted Recipe/Production/balance/movement effects. Confirm malformed input is 422, business validation 400 and exhausted retry 409.

### F6 — Integrated conformance and readiness

#### F6-T1 — Verify one integrated candidate against the full Spec

- **Status/owner:** `completed` — Orchestrator
- **Depends/parallel:** Depends on F4 and F5; runs integrated sensors in parallel with exactly one read-only Integrated Reviewer after Builder diffs are integrated.
- **Paths:** Integrated candidate only; `documentation/features/mrp/products-details-page-recipe-tab/{plan.md,evaluation.md}` are Orchestrator-owned, and no Builder owns shared/generated-file corrections.
- **Contract:** `RF-01`–`RF-12`; `CA-01`–`CA-15`; `MV-01`–`MV-04`
- **Outcome:** Current evidence demonstrates the real server-backed workflow, the design-backed browser surface and complete final Spec-tree conformance on one integrated commit.
- **Rules:** `documentation/sdd.md`; all Rule-Pack paths recorded in [`spec.md`](./spec.md#5-documentation-alignment-and-revision-history); `documentation/architecture.md`; `documentation/modules.md`; `documentation/design.md`; `documentation/tooling.md`.
- **Exit:** Re-run affected workspace checks and the Spec validation commands on the integrated candidate; execute all `MV-*` with required services/accounts/fixtures, compare each saved visual reference independently, inspect generated artifacts, and validate review findings before routing to `conclude-spec`.

## Validation and handoff

| Type | Scenario/surface | Criteria | Reference | Evidence target | Status |
| --- | --- | --- | --- | --- | --- |
| Automated | Core contract and use-case suite | `CA-01`–`CA-14` | Technical Contract / F1, F3 | `./evaluation.md` | `passed` |
| Runtime | Drizzle mapping, constraints, rollback and retry | `CA-05`, `CA-08`, `CA-11`–`CA-13` | Persistence Contract / F2 | `./evaluation.md` | `passed` |
| Runtime | Real Nest REST request/response, authorization and persistence | `CA-01`, `CA-02`, `CA-05`, `CA-08`, `CA-11`–`CA-14` | Integration Contract / F5 | `./evaluation.md` | `passed` |
| Browser (mocked transport) | Product-detail route, URL and UI-to-REST mapping | `CA-01`–`CA-10`, `CA-13`–`CA-15` | F4 route suite | `./evaluation.md` | `passed` |
| Manual | `MV-01` — Recipe lifecycle and recovery at 1560 × 1200 | `CA-01`–`CA-08`, `CA-15` | Spec `MV-01` | `./evaluation.md` | `passed` |
| Manual | `MV-02` — Production preview, commit, rollback and refresh | `CA-09`–`CA-12`, `CA-14`, `CA-15` | Spec `MV-02` | `./evaluation.md` | `passed` |
| Manual | `MV-03` — keyboard-only Recipe and Produce paths at 320 × 900 | `CA-15` | Spec `MV-03` | `./evaluation.md` | `passed` |
| Manual | `MV-04` — registration/Entry current-cost behavior at desktop and 320 × 900 | `CA-08`, `CA-13`, `CA-15` | Spec `MV-04` | `./evaluation.md` | `passed` |
| Visual | Populated Recipe card at 1560 × 1200 | `CA-01`–`CA-08`, `CA-15` | `./design/Hd4wz.png` | Playwright `test-results/` screenshot and comparison ID | `passed` |
| Visual | Add Ingredient modal, nominal 520 × 524 / export 676 × 682 | `CA-04`, `CA-05`, `CA-15` | `./design/a3zfgk.png` | Playwright `test-results/` screenshot and comparison ID | `passed` |
| Visual | Edit Ingredient modal, nominal 520 × 524 / export 676 × 684 | `CA-06`, `CA-15` | `./design/im6ld.png` | Playwright `test-results/` screenshot and comparison ID | `passed` |
| Visual | Produce modal, nominal 640 × 640 / export 796 × 790 | `CA-09`–`CA-12`, `CA-15` | `./design/toFi2.png` | Playwright `test-results/` screenshot and comparison ID | `passed` |
| Visual | Remove confirmation, nominal 440 × 179 / export 596 × 335 | `CA-07`, `CA-15` | `./design/FpJbN.png` | Playwright `test-results/` screenshot and comparison ID | `passed` |
| Visual | Empty Recipe card at 1200 × 537 / export 1201 × 538 | `CA-02`, `CA-03`, `CA-15` | `./design/H2x0f.png` | Playwright `test-results/` screenshot and comparison ID | `passed` |
| Visual | Loading/error/retry and unsaved-yield state at 1560 × 1200 | `CA-01`–`CA-03`, `CA-15` | Manifest supplemental decision / `MV-01` | Playwright `test-results/` screenshot and comparison notes | `passed` |
| Visual | Shortage, no-main-brand, pending and failed-confirm production states at 640 × 760 | `CA-09`–`CA-12`, `CA-15` | Manifest supplemental decision / `MV-02` | Playwright `test-results/` screenshot and comparison notes | `passed` |
| Visual | Recipe page and Produce dialog at 320 × 900 | `CA-15` | Manifest supplemental decision / `MV-03` | Playwright `test-results/` screenshot and comparison notes | `passed` |
| Visual | Current-unit-cost registration and Entry fields at 1560 × 1200 and 320 × 900 | `CA-13`, `CA-15` | Manifest supplemental decision / `MV-04` | Playwright `test-results/` screenshot and comparison notes | `passed` |
| Review | One complete integrated candidate, cross-Builder contracts and all affected surfaces | `RF-01`–`RF-12`, `CA-01`–`CA-15` | [`implementation-reviewer-agent.md`](../../../agents/implementation-reviewer-agent.md) | Integrated Reviewer report + verified findings in `./evaluation.md` | `passed` |

The Integrated Reviewer is scheduled exactly once after F4/F5 integration and before readiness. It independently inspects the complete diff, generated migration/route tree, every final visual comparison, high-risk Playwright CLI keyboard/responsive interactions, real Server-backed authorization/persistence behavior and current evidence. Its report is advisory; the Orchestrator verifies every finding, invalidates stale evidence, resumes the responsible Builder for in-Contract corrections, and resumes the same Reviewer after corrections.

Handoff requires every task and phase completed; current integrated `core`, `validation`, `server` and `web` validation commands; reviewed migration/generated artifacts; healthy required services and Manager fixtures; executable `MV-01`–`MV-04`; recorded transient screenshot identifiers; passed final Spec-tree and visual conformance comparison; resolved supplemental decisions; completed Integrated Reviewer recheck; every verified finding resolved; and no active blocker. The next route is `conclude-spec`.
