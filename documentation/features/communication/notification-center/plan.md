---
title: In-product notification center — implementation plan
status: in_progress
spec: ./spec.md
spec_revision: 4
evaluation: ./evaluation.md
github_issue: https://github.com/rafinel/scoops/issues/30
updated_at: 2026-09-06
---

# Execution status

- **Spec:** [`spec.md`](./spec.md), revision `4`, `in_progress`.
- **Rationale:** Plan-backed execution is required because the Spec crosses Core, Validation, MRP, Identity, PDV, Communication persistence and messaging, authenticated REST, Composition, Web routing/UI, generated artifacts, migration risk, and complex full-stack/visual validation.
- **Current phase:** `F4` — mainline EventsRepository integration correction.
- **Next action:** Complete the merge adaptation, refresh affected Core/Server evidence, and return Evaluation to `ready` before conclusion.
- **Active blockers:** Mainline integration correction is in progress; no product or authority blocker remains.
- **Builders:** `Builder Core`, `Builder Server`, and `Builder Web` completed their assigned phases. The Orchestrator owns integrated validation and evidence freshness.
- **Shared coordination:** The Orchestrator owns root/generated artifacts and integration: the Drizzle shared-schema export and generated `0021` migration metadata, `AppModule` registration, generated `apps/web/src/routeTree.gen.ts`, shared Playwright fixture registration, package/lockfile changes, and final cross-Builder validation. Builders do not edit overlapping paths.
- **Visual evidence:** Fresh Playwright captures are stored in ignored `apps/web/test-results/communication/` output and linked from `evaluation.md` by artifact path; feature-local `evidence/` is not part of the delivery artifact.

# Execution ledger

| Wave | Builder | Phase | Name | Depends on | Parallel with | Status | Exit condition |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | `Builder Core` | F1 | Deliver Core domain, use-case, event, and validation contracts | — | — | `completed` | Core and Validation checks/tests pass; all RF/CA contract paths and direct tests exist. |
| 2 | `Builder Server` | F2 | Deliver Communication persistence, migration inputs, seed, and server fixture foundations | F1 | F2 Web | `completed` | Notification schema/repository/seed foundations, Identity audience lookup method, and fixture compile and pass focused database checks; migration inputs are ready for Orchestrator generation. |
| 2 | `Builder Web` | F2 | Deliver browser REST service, mapping, and context transport | F1 | F2 Server | `completed` | Communication service/context tests prove exact GET/PATCH transport, date/cursor mapping, cookie transport, and shared error preservation. |
| 3 | `Builder Server` | F3 | Deliver source transactions, messaging, Composition, authenticated REST, and REST examples | F1, F2 Server | F3 Web | `completed` | Real server/controller/source tests prove atomic outbox behavior, typed job routing, isolation, and route-complete `.rest` parity. |
| 3 | `Builder Web` | F3 | Deliver notification dropdown, page, route, fixtures, and browser coverage | F1, F2 Web | F3 Server | `in_progress` | Widget and mocked Playwright route tests prove lifecycle, keyboard, responsive, URL/request/read behavior; fresh screenshots are captured for required states. |
| 4 | `Orchestrator` | F4 | Integrate generated artifacts, run complete validation, review, and hand off | F3 Server, F3 Web | — | `completed` | Path sensor, all Spec evidence, MVs, screenshots, integrated checks, history-aware back navigation, and one Implementation Reviewer are complete with no blocking finding. |

### F1 — Authoritative Core and transport contracts

#### F1-T1 — Implement notification, stock-transition, Identity-event, and use-case contracts

- **Status/owner:** `completed` — Builder Core
- **Depends/parallel:** No dependencies; F2 Server and F2 Web wait for these public Core contracts. F1-T2 may follow within the same ownership boundary once the event/data names are stable.
- **Paths:** `packages/core/src/communication/**` for notification entities, structures, interfaces, and three use cases/tests; `packages/core/src/mrp/domain/events/**`; `packages/core/src/mrp/domain/structures/**`; `packages/core/src/mrp/use-cases/publish-product-stock-alert-use-case.ts` and its test; affected MRP source use cases/tests; affected Identity event/use-case files/tests; `packages/core/package.json` exports.
- **Contract:** Spec §2 `RF-01`–`RF-07`, `RF-13`; `CA-01`–`CA-08`, `CA-14`; Spec §3 Core domain/use-case/interface tables and immutable content/transition contracts.
- **Outcome:** Core owns the seven-kind notification vocabulary, immutable notification/read lifecycle, audience/fact/repository/list contracts, private cursor/read use cases, authoritative stock transition publisher, and enriched Identity event payloads without moving source policy into Communication.
- **Rules:** `documentation/rules/core-package-rules.md` (one exported type per file, fakers, business rules in use cases, contracts in interfaces); `documentation/rules/use-case-testing-rules.md` (one direct test per use case, typed mocks, deterministic time, infrastructure-free tests); `documentation/rules/code-conventions-rules.md` (naming, declarations, errors, barrels). No dedicated `Antipatterns to Avoid` subsection exists in these rule documents.
- **Exit:** Run `pnpm --filter @scoops/core check:code`, `pnpm --filter @scoops/core check:types`, focused Core tests, and `pnpm --filter @scoops/core test`; verify exhaustive stock transition/recovery cases, recipient-independent contracts, immutable snapshot fields, enriched event payloads, and no excluded notification kinds.

#### F1-T2 — Add strict transport and route-search schemas

- **Status/owner:** `completed` — Builder Core
- **Depends/parallel:** Depends on F1-T1’s public Core names; remains within Builder Core and is a prerequisite for F2/F3 Server and Web boundaries.
- **Paths:** `packages/validation/src/communication/**`; `packages/validation/src/mrp/product-stock-alert-state-entered-event-schema.ts`; `packages/validation/src/web/notifications-search-schema.ts`; `packages/validation/src/index.ts`.
- **Contract:** Spec §3 Validation table; `RF-02`, `RF-03`, `RF-06`, `RF-07`, `RF-10`; `CA-03`, `CA-04`, `CA-06`, `CA-07`, `CA-12`, `CA-14`.
- **Outcome:** Event schemas preserve strict serialized payload parity for the five triggers; REST query/body schemas enforce cursor/bound/limit and 1–50 UUID rules; route search normalizes to the four approved periods with a deterministic 30-day default.
- **Rules:** `documentation/rules/validation-package-rules.md` (schema ownership, one primary schema per file, root barrel, consumer boundaries); `documentation/rules/code-conventions-rules.md` (naming and explicit exports). No dedicated `Antipatterns to Avoid` subsection exists in these rule documents.
- **Exit:** Run `pnpm --filter @scoops/validation check:code`, `pnpm --filter @scoops/validation check:types`, and the focused schema consumers/tests available in Core/Server/Web; verify strict malformed/unknown values, paired cursor/bound refinements, ISO conversion, duplicate normalization, and route default behavior.

### F2 — Cross-layer foundations

#### F2-T1 — Deliver Communication persistence, migration inputs, seed, and server fixture foundations

- **Status/owner:** `completed` — Builder Server
- **Depends/parallel:** Depends on F1; runs in parallel with F2-T2. The Orchestrator owns the shared schema export and generated migration files after this task provides the feature models.
- **Paths:** `apps/server/src/communication/constants/communication-repositories.ts` and its owning barrel; `apps/server/src/communication/database/**`; `apps/server/src/communication/fixtures/communication-module-fixture.ts`; `apps/server/src/identity/database/drizzle/repositories/drizzle-users-repository.ts` and its focused repository coverage; Communication model/repository/mapper/seeder tests and supporting server database paths. Do not edit generated migration files or root shared schema wiring in this task.
- **Contract:** Spec §3 database table/index/constraint/repository/seeder/fixture contracts; `RF-03`, `RF-05`, `RF-06`, `RF-07`; `CA-04`–`CA-07`, `CA-14`.
- **Outcome:** The additive seven-kind notification table model, tokenized repository, mapper, idempotent batch insert, stable private cursor/unread query, neutral read mutation, module seeder, real controller-test fixture, and active Identity-directory repository method required by Composition are available without cross-module persistence imports or retention/deletion behavior.
- **Rules:** `documentation/rules/database-layer-rules.md` (module ownership, Drizzle declarations, persistence types/mappers, Core repository implementations, transaction context, tokens, seeders); `documentation/rules/server-app-layer-rules.md` (technical-layer module ownership); `documentation/rules/code-conventions-rules.md`; `documentation/tooling.md` for Drizzle generation/application. No dedicated `Antipatterns to Avoid` subsection exists in these rule documents.
- **Exit:** Run focused server database/fixture tests, `pnpm --filter server check:code`, `pnpm --filter server check:types`, and inspect feature schema output against the Spec’s enum, table, indexes, constraints, nullable/read semantics, and no-FK boundary. Record migration generation as an Orchestrator handoff, not as completed evidence here.

#### F2-T2 — Compose the browser Communication REST transport

- **Status/owner:** `completed` — Builder Web
- **Depends/parallel:** Depends on F1 Core interfaces and validation schemas; runs in parallel with F2-T1 and does not edit notification widgets or generated route metadata.
- **Paths:** `apps/web/src/rest/mappers/communication/**`; `apps/web/src/rest/services/communication-service.ts`; `apps/web/src/ui/shared/contexts/rest-context/types/rest-context-value.ts`; `apps/web/src/ui/shared/contexts/rest-context/use-rest-context-provider.ts`; focused context tests only where the public context changes.
- **Contract:** Spec §3 Web REST and Composition tables; `RF-06`, `RF-07`, `RF-08`, `RF-10`; `CA-07`–`CA-09`, `CA-11`, `CA-12`.
- **Outcome:** The Web adapter maps ISO notification pages/cursors/read timestamps to Core dates, serializes bounds/cursors and read batches exactly, uses the shared cookie-authenticated client, and exposes one memoized `communicationService` through the existing REST context while preserving shared errors.
- **Rules:** `documentation/rules/rest-layer-rules.md` (service contracts, factories, cookie transport, shared errors); `documentation/rules/ui-layer-rules.md` (REST adapters and context composition); `documentation/rules/code-conventions-rules.md`. No dedicated `Antipatterns to Avoid` subsection exists in these rule documents.
- **Exit:** Run focused Web service/context tests, `pnpm --filter web check:code`, and `pnpm --filter web check:types`; verify exact method/path/query/body mappings, date/cursor response mapping, no credentials or tenant/user parameters, and error identity preservation.

### F3 — Runtime delivery and user surfaces

#### F3-T1 — Integrate source transactions, messaging, Composition, REST, and REST-client parity

- **Status/owner:** `completed` — Builder Server
- **Depends/parallel:** Depends on F1 and F2-T1; runs in parallel with F3-T2. All changes remain under Server ownership except Orchestrator-owned root/generated wiring.
- **Paths:** `apps/server/src/communication/constants/communication-providers.ts`; `apps/server/src/communication/communication.module.ts`; `apps/server/src/communication/messaging/**`; `apps/server/src/communication/rest/**`; `apps/server/src/composition/communication-identity/**`; MRP/PDV transaction-bound stock adapter and source controller/use-case tests; Identity source use-case/controller tests; `apps/server/src/shared/messaging/outbox/event-validation.ts` and its test; `apps/server/rest-client/communication/notifications.rest`; validation-only parity checks for `apps/server/rest-client/mrp/products.rest`, `apps/server/rest-client/pdv/orders.rest`, and `apps/server/rest-client/identity/users.rest`. `apps/server/src/app.module.ts` remains Orchestrator-owned root wiring.
- **Contract:** Spec §3 runtime boundary, Composition, REST, Messaging, MRP/PDV provision, and source-controller tables; `RF-01`–`RF-07`, `RF-13`; `CA-01`–`CA-07`, `CA-14`; `MV-03`–`MV-05`.
- **Outcome:** Source transactions lock/order products and enqueue authoritative facts atomically; the typed five-trigger job validates/maps and materializes retry-safely through the Composition audience bridge; authenticated GET/PATCH controllers enforce account-derived tenant/recipient isolation; the Communication route group is wired and all affected `.rest` artifacts are route-complete.
- **Rules:** `documentation/rules/messaging-layer-rules.md` (Core events, authoritative publishers, typed schemas, Inngest jobs, transaction-bound Broker/outbox); `documentation/rules/provision-layer-rules.md` (Core contracts, composition adapters, transaction-bound providers); `documentation/rules/rest-layer-rules.md` (group decorator, one controller per action, request types, Swagger/error boundary, REST client); `documentation/rules/server-app-layer-rules.md` (feature modules, provision/messaging ownership, Composition); `documentation/rules/controllers-testing-rules.md` (real HTTP/database fixture, one file per controller, persistence/security assertions); `documentation/rules/code-conventions-rules.md`. No dedicated `Antipatterns to Avoid` subsection exists in these rule documents.
- **Exit:** Run focused Core/server source, messaging, validation, controller, and fixture suites plus `pnpm --filter server check:code`, `pnpm --filter server check:types`, and `pnpm --filter server build`. Verify real request/response, persisted notification/read state, authorization/tenant isolation, broker rollback, outbox event IDs, job retry/idempotency, and all `.rest` examples against both current controller routes and shared request schemas: one labeled request per GET/PATCH operation/variant, reusable local `@baseUrl`, no credentials, and no stale method/path/query/body/header.

#### F3-T2 — Implement notification dropdown, page, route, fixtures, and browser coverage

- **Status/owner:** `completed` — Builder Web
- **Depends/parallel:** Depends on F2-T2’s service/context and F1 route schema; runs in parallel with F3-T1 using the Spec’s REST contract and mocked browser transport. Generated route metadata and shared Playwright registration are Orchestrator-coordinated.
- **Paths:** `apps/web/src/constants/routes.ts`; `apps/web/src/routes/_authenticated/notifications/index.tsx`; `apps/web/src/ui/communication/**`; `apps/web/src/ui/shared/widgets/layouts/app-layout/**` and its focused test; `apps/web/tests/fixtures/communication-module-fixture.ts`; `apps/web/tests/routes/communication/notifications.index.test.tsx`; `apps/web/tests/playwright.ts` through Orchestrator coordination.
- **Contract:** Spec §2 `RF-08`–`RF-13`, `CA-08`–`CA-14`, `MV-01`–`MV-02`; Design Contract and [`design/manifest.md`](./design/manifest.md), including widget tree, desktop references, accepted supplemental states, and exclusions.
- **Outcome:** The authenticated Header dropdown and `/notifications` page use the seven scoped kinds, local date grouping, 50%-visibility read batching, four URL periods, stable cursor loading/retry, focus restoration, accessible status/list semantics, responsive containment, reduced motion, and existing tokens/primitives.
- **Rules:** `documentation/design.md`; `documentation/rules/ui-layer-rules.md` (stateful widget directories/hooks, shared primitives, pt-BR labels, query/action boundaries, focus/error feedback); `documentation/rules/web-app-routing-rules.md` (protected route, search schema, generated tree, mocked route integration); `documentation/rules/widget-testing-rules.md` (owning widget behavior matrix, accessible assertions, route boundary, loading/empty/error/filter/pagination coverage); `documentation/rules/code-conventions-rules.md`. No dedicated `Antipatterns to Avoid` subsection exists in these rule documents.
- **Exit:** Run `pnpm --filter web generate-routes` through the Orchestrator handoff, focused widget tests, `pnpm --filter web check:code`, `pnpm --filter web check:types`, and `pnpm --filter web test:integration tests/routes/communication/notifications.index.test.tsx`. Compare the exact Spec widget tree; exercise keyboard open/filter/load/close/navigation, Manager and Operator, `390 × 844`, focus return, reduced motion, no overflow, console/failure-network inspection, and fresh Playwright screenshots for every required visual state. Mocked browser evidence must remain explicitly separate from real server evidence.

### F4 — Integrated validation and handoff

#### F4-T1 — Integrate generated artifacts, validate the complete candidate, and route to conclusion

- **Status/owner:** `completed` — Orchestrator
- **Depends/parallel:** Depends on F3-T1 and F3-T2; no implementation Builder runs in parallel. Reopen the responsible Builder through `implement-spec` for any contracted-path discrepancy; reuse the same Implementation Reviewer after corrections.
- **Paths:** Orchestrator-owned `apps/server/src/shared/database/drizzle/schema.ts`, generated `apps/server/src/shared/database/drizzle/migrations/0021_notification-center.sql` plus snapshot/journal, `apps/server/src/app.module.ts`, generated `apps/web/src/routeTree.gen.ts`, `apps/web/tests/playwright.ts` registration, and `documentation/features/communication/notification-center/evaluation.md`. Fresh captures remain in ignored `apps/web/test-results/communication/` output.
- **Contract:** Spec §4 EV-01–EV-05, MV-01–MV-05, Evaluation ledger contract, final completion gate; all RF/CA and Design Contract references.
- **Outcome:** Generated artifacts are reviewed, all implementation paths are integrated at Spec revision 4, evidence is recorded without overstating mocked transport, and one read-only Implementation Reviewer checks the complete candidate across Core, Server, Composition, REST, MRP/PDV/Identity source transactions, Web, accessibility, responsive behavior, and visual comparisons.
- **Rules:** `documentation/tooling.md` (workspace checks, Drizzle, Playwright CLI, generated artifacts); `documentation/rules/web-app-routing-rules.md` (route generation/integration); `documentation/design.md`; repository `AGENTS.md` Playwright workflow (service health, accounts, screenshots, console/network review, teardown). No dedicated `Antipatterns to Avoid` subsection exists in these rule documents.
- **Exit:** Run `pnpm check:spec-implementation -- documentation/features/communication/notification-center/spec.md` after all Builder diffs and before integrated sensors/Reviewer; run EV-01 through EV-05, apply migration safely, inspect `docker compose ps` and required health endpoints, seed required Manager/Operator accounts explicitly if absent, execute every MV scenario with real server/database evidence where required, record REST parity, capture/inspect every desktop/narrow visual state, classify console/4xx/5xx findings, run exactly one Implementation Reviewer, resolve findings through the responsible Builder, rerun stale evidence and the path sensor after each contracted-path correction, then route directly to `conclude-spec`.

# Validation and handoff

| Type | Scenario/surface | Criteria | Reference | Evidence target | Status |
| --- | --- | --- | --- | --- | --- |
| Automated | Complete affected-path map | All RF/CA paths | Spec Technical Contract | `./evaluation.md` — `pnpm check:spec-implementation -- documentation/features/communication/notification-center/spec.md` | `passed` |
| Automated | Test-integrity policy | `CA-01`–`CA-14` | Spec EV-01 | `./evaluation.md` — `pnpm check:test-integrity` (unrelated pre-existing failures classified) | `passed` |
| Automated | Core domain, source transitions, and Identity event behavior | `CA-01`–`CA-08`, `CA-14` | Spec EV-02 | `./evaluation.md` — `pnpm --filter @scoops/core test:coverage` | `passed` |
| Automated | Server database, REST, jobs, source transactions, and outbox | `CA-01`–`CA-08`, `CA-14` | Spec EV-03 | `./evaluation.md` — `pnpm --filter server test:coverage` | `passed` |
| Automated | Web widgets, hooks, route mocks, accessibility, and responsive behavior | `CA-08`–`CA-14` | Spec EV-04 | `./evaluation.md` — `pnpm --filter web test:coverage` | `passed` |
| Runtime | Real source mutation → outbox → Communication materialization | `CA-01`–`CA-05`, `CA-14` | `MV-03`, `MV-04`; Integration Contract | `./evaluation.md` with persisted source/outbox/notification records | `passed` |
| Runtime | Real private list/read HTTP and tenant/user isolation | `CA-06`–`CA-08` | `MV-05`; REST Contract | `./evaluation.md` with response bodies and persisted read timestamps | `passed` |
| REST client | Communication route-group parity | `CA-07`, `CA-08` | `apps/server/rest-client/communication/notifications.rest` compared with both controllers and shared schemas | Exact artifact path plus labeled GET/PATCH parity record in `./evaluation.md` | `passed` |
| REST client | MRP stock-source route parity | `CA-01`, `CA-02` | `apps/server/rest-client/mrp/products.rest` compared with product, brand, adjustment, and production routes and request schemas | Existing labeled requests verified current; parity record in `./evaluation.md` | `passed` |
| REST client | PDV stock-source route parity | `CA-01`, `CA-02` | `apps/server/rest-client/pdv/orders.rest` compared with order registration/cancellation routes and request schemas | Existing labeled requests verified current; parity record in `./evaluation.md` | `passed` |
| REST client | Identity source-event route parity | `CA-03`–`CA-05` | `apps/server/rest-client/identity/users.rest` compared with invitation/profile/status routes and request schemas | Existing labeled requests verified current; parity record in `./evaluation.md` | `passed` |
| Manual | Header dropdown populated, dismissal, focus, visibility reads, retry | `CA-09`, `CA-10`, `CA-13` | `MV-01`; `n5xnGg.png` | `./evaluation.md` with real UI observations and transient screenshot/artifact identifiers | `passed` |
| Manual | Full-page periods, date groups, load-more, retry, and read reconciliation | `CA-11`, `CA-12`, `CA-13` | `MV-02`; `K3Vu9o.png` | `./evaluation.md` with URL/request/read observations and artifacts | `passed` |
| Manual | Stock transitions, recovery suppression, rollback, and persisted records | `CA-01`, `CA-02` | `MV-03` | `./evaluation.md` with balance/ledger/outbox IDs | `passed` |
| Manual | Identity acceptance/profile/status facts, recipients, inactive target, reactivation | `CA-03`–`CA-05` | `MV-04` | `./evaluation.md` with API observations and persisted recipient rows | `passed` |
| Manual | Multi-user/multi-tenant list/read privacy and representative `401`/`422` | `CA-07` | `MV-05` | `./evaluation.md` with HTTP and persistence isolation evidence | `passed` |
| Visual | Populated dropdown, desktop `1560 × 1020` | `CA-09`, `CA-13` | `n5xnGg.png` / `VA-DROPDOWN-DESKTOP` | Fresh Playwright screenshot path and comparison in `./evaluation.md` | `passed` |
| Visual | Populated full page, desktop `1560 × 1020` | `CA-11`, `CA-12`, `CA-13` | `K3Vu9o.png` / `VA-PAGE-DESKTOP` | Fresh Playwright screenshot path and comparison in `./evaluation.md` | `passed` |
| Visual | Dropdown loading, desktop `1560 × 1020` | `CA-10` | Manifest accepted assumption / `VA-DROPDOWN-LOADING` | Fresh runtime screenshot and comparison in `./evaluation.md` | `passed` |
| Visual | Dropdown loading, narrow `390 × 844` | `CA-10`, `CA-13` | Manifest accepted assumption / `VA-DROPDOWN-LOADING` | Fresh runtime screenshot and comparison in `./evaluation.md` | `passed` |
| Visual | Dropdown empty, desktop `1560 × 1020` | `CA-10` | Manifest accepted assumption / `VA-DROPDOWN-EMPTY` | Fresh runtime screenshot and comparison in `./evaluation.md` | `passed` |
| Visual | Dropdown empty, narrow `390 × 844` | `CA-10`, `CA-13` | Manifest accepted assumption / `VA-DROPDOWN-EMPTY` | Fresh runtime screenshot and comparison in `./evaluation.md` | `passed` |
| Visual | Dropdown error/retry, desktop `1560 × 1020` | `CA-10` | Manifest accepted assumption / `VA-DROPDOWN-ERROR` | Fresh runtime screenshot and comparison in `./evaluation.md` | `passed` |
| Visual | Dropdown error/retry, narrow `390 × 844` | `CA-10`, `CA-13` | Manifest accepted assumption / `VA-DROPDOWN-ERROR` | Fresh runtime screenshot and comparison in `./evaluation.md` | `passed` |
| Visual | Page loading, desktop `1560 × 1020` | `CA-11` | Manifest accepted assumption / `VA-PAGE-LOADING` | Fresh runtime screenshot and comparison in `./evaluation.md` | `passed` |
| Visual | Page loading, narrow `390 × 844` | `CA-11`, `CA-13` | Manifest accepted assumption / `VA-PAGE-LOADING` | Fresh runtime screenshot and comparison in `./evaluation.md` | `passed` |
| Visual | Page no history, desktop `1560 × 1020` | `CA-11` | Manifest accepted assumption / `VA-PAGE-EMPTY` | Fresh runtime screenshot and comparison in `./evaluation.md` | `passed` |
| Visual | Page no history, narrow `390 × 844` | `CA-11`, `CA-13` | Manifest accepted assumption / `VA-PAGE-EMPTY` | Fresh runtime screenshot and comparison in `./evaluation.md` | `passed` |
| Visual | Page filtered empty, desktop `1560 × 1020` | `CA-12` | Manifest accepted assumption / `VA-PAGE-FILTERED-EMPTY` | Fresh runtime screenshot and comparison in `./evaluation.md` | `passed` |
| Visual | Page filtered empty, narrow `390 × 844` | `CA-12`, `CA-13` | Manifest accepted assumption / `VA-PAGE-FILTERED-EMPTY` | Fresh runtime screenshot and comparison in `./evaluation.md` | `passed` |
| Visual | Page error/retry, desktop `1560 × 1020` | `CA-11`, `CA-12` | Manifest accepted assumption / `VA-PAGE-ERROR` | Fresh runtime screenshot and comparison in `./evaluation.md` | `passed` |
| Visual | Page error/retry, narrow `390 × 844` | `CA-11`, `CA-12`, `CA-13` | Manifest accepted assumption / `VA-PAGE-ERROR` | Fresh runtime screenshot and comparison in `./evaluation.md` | `passed` |
| Visual | Populated dropdown narrow containment, `390 × 844` | `CA-10`, `CA-13` | Manifest narrow supplemental coverage / `VA-DROPDOWN-NARROW` | Fresh runtime screenshot and independent comparison in `./evaluation.md` | `passed` |
| Visual | Populated page narrow containment, `390 × 844` | `CA-11`, `CA-12`, `CA-13` | Manifest narrow supplemental coverage / `VA-PAGE-NARROW` | Fresh runtime screenshot and independent comparison in `./evaluation.md` | `passed` |
| Review | Complete integrated candidate | All RF/CA/MV and affected surfaces | [`Implementation Reviewer`](../../../agents/implementation-reviewer-agent.md) | Single read-only reviewer confirmed the tracked visual artifacts, runtime evidence scope, structural conformance, and all prior corrections; no findings remain. | `passed` |

Final handoff requires every task and phase to be `completed`; Spec revision 4 and all validation commands current on the integrated commit; generated migration, schema metadata, route tree, fixtures, accounts, and services reviewed; every `MV-*` executable; all REST examples route-complete; every supplied and accepted supplemental visual state compared with a fresh Playwright screenshot; the latest path sensor passed after the last contracted-path correction; the single Implementation Reviewer completed; all verified findings resolved; and all affected coverage floors passed. Then route directly to `conclude-spec`.
