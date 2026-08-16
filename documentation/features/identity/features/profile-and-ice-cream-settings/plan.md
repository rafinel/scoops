---
title: Identity profile and ice cream shop settings — implementation plan
status: in_progress
spec: ./spec.md
spec_revision: 3
evaluation: ./evaluation.md
github_issue: https://github.com/rafinel/scoops/issues/6
updated_at: 2026-08-16
---

# Execution status

- **Spec:** `./spec.md`, revision `3`, `open`.
- **Rationale:** `implement-plan` is required because this feature crosses Core, Server/database, Web/UI, generated artifacts, transactional audit boundaries, role-aware routing, and real browser/manual validation.
- **Current phase:** F6 — Full-stack, visual/accessibility validation and final review (`in_progress`).
- **Next action:** Obtain the independent final Reviewer verdict against the refreshed implementation captures and current working tree.
- **Active blockers:** None after the Builder Fixes; the final Reviewer must still independently validate the exact screenshots and MV scenarios.
- **Coordination:** The Orchestrator owns package/lockfile changes if discovered, Drizzle migration generation/review, TanStack route-tree generation/review, and the final integrated validation/reviewer. No new dependency is expected.

# Execution ledger

| Wave | Lane | Phase | Name | Depends on | Parallel with | Status | Exit condition |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Core | F1 | Stable Identity projections, audit contracts, and name/settings use cases | — | — | `completed` | Core contracts, use cases, fakers, and focused unit tests cover the specified self-name, Manager, tenant, audit, transaction, and event-after-commit behavior. |
| 2 | Server | F2 | Establishment audit persistence and transaction scope | F1 | Web F3; disjoint paths | `completed` | Drizzle models, mappers, repositories, bindings, generated migration, and database integration prerequisites are complete and reviewed. |
| 2 | Web | F3 | Identity REST transport and local-session boundary | F1; REST contract in Spec | Server F2; disjoint paths | `completed` | Web service methods, REST mapping tests, account refresh, and local Supabase sign-out behavior are ready for page consumers. |
| 3 | Server | F4 | Identity REST actions and server composition | F1, F2 | Web F5; disjoint paths | `completed` | Real Nest/HTTP/controller integration tests prove authorization, validation, safe response shapes, persistence, audit effects, and error mapping. |
| 3 | Web | F5 | Account/shop-settings pages, shell navigation, routes, and browser suites | F3; Spec design references | Server F4; disjoint paths | `completed` | Both protected routes render their owning compositions, role navigation/denial is covered, widget tests pass, and mocked-transport route suites prove visible and transport outcomes. |
| 4 | Integrated | F6 | Full-stack, visual/accessibility validation and final review | F1–F5 | — | `in_progress` | All automated and manual criteria have evidence, generated artifacts are reviewed, services/fixtures are ready, no blocking finding remains, and the single read-only Reviewer accepts the integrated result. |

### F1 — Stable Identity projections, audit contracts, and name/settings use cases

#### F1-T1 — Add Core account, settings, establishment-audit, repository, and event contracts

- **Status/owner:** `completed` — Builder F1-T1
- **Depends/parallel:** None; unlocks F1-T2, F2, and F3. No parallel Core Builder may change these exports.
- **Paths:** `packages/core/src/identity/domain/entities/**` (account, establishment audit entity/create contract, barrels and fakers); `packages/core/src/identity/domain/structures/**` (establishment audit action/settings and barrels); `packages/core/src/identity/domain/events/establishment-updated-event.ts`; `packages/core/src/identity/interfaces/{establishment-audit-records-repository,identity-database,identity-service}.ts` and `index.ts`.
- **Contract:** RF-01, RF-02, RF-05, RF-06, RF-07; CA-01, CA-02, CA-06, CA-08, CA-09.
- **Outcome:** The safe `Account` projection includes `establishmentName`; establishment settings and immutable audit snapshots are framework-independent; the new repository and transaction contracts are explicit; existing user-correction semantics and event `_NAME` values remain compatible; no provider/session/password data crosses Core.
- **Rules:** `documentation/rules/code-conventions-rules.md`; `documentation/rules/core-package-rules.md` (one exported type per file, entities own identity, contracts under `interfaces`, faker conventions).
- **Exit:** `pnpm --filter @scoops/core check:code`, `pnpm --filter @scoops/core check:types`, barrel/export inspection, and a source scan confirming no NestJS/Drizzle/Supabase/HTTP imports in Core.

#### F1-T2 — Implement transactional self-name and current-establishment use cases with focused tests

- **Status/owner:** `completed` — Builder F1-T2
- **Depends/parallel:** F1-T1; blocks F2 and F4 behavior work. F1-T2 owns all three use cases and their tests so shared transaction/event semantics remain coherent.
- **Paths:** `packages/core/src/identity/use-cases/{change-own-user-name,get-establishment-settings,change-establishment-name}-use-case.ts`; `packages/core/src/identity/use-cases/resolve-authenticated-user-use-case.ts`; `packages/core/src/identity/use-cases/index.ts`; `packages/core/src/identity/use-cases/tests/{change-own-user-name,get-establishment-settings,change-establishment-name}-use-case.test.ts`; affected Core fakers.
- **Contract:** RF-01, RF-02, RF-05, RF-06, RF-07; CA-01, CA-02, CA-06, CA-08, CA-09, CA-12.
- **Outcome:** Manager and Operator self-edits trim/reject empty input and no-op unchanged values; Manager-only settings read/rename uses `actor.establishmentId`; duplicate names succeed; primary update plus audit is serializable/atomic; historical snapshots remain unchanged; events publish only after commit; cross-tenant and unauthorized attempts cannot write.
- **Rules:** `documentation/rules/code-conventions-rules.md`; `documentation/rules/core-package-rules.md` (business rules in use cases); `documentation/rules/use-case-testing-rules.md` (one test file per use case, typed mocks, deterministic time, infrastructure-free tests); `documentation/rules/provision-layer-rules.md` (DatetimeProvider contract when timestamps are created).
- **Exit:** Focused Core tests for the three named files, then `pnpm --filter @scoops/core test`, code/type checks, and `git diff --check`; evidence must include successful, no-op, validation, role, tenant, audit snapshot, rollback, concurrency, and event-after-commit assertions.

### F2 — Establishment audit persistence and transaction scope

#### F2-T1 — Add establishment audit Drizzle persistence and transaction bindings

- **Status/owner:** `completed` — Builder F2-T1
- **Depends/parallel:** F1 complete; parallel with F3 after the Core REST contract is stable. F2 owns Server database paths only.
- **Paths:** `apps/server/src/identity/database/drizzle/models/{establishment-audit-action-model,establishment-audit-record-model}.ts`; `types/entities/drizzle-establishment-audit-record.ts`; `mappers/drizzle-establishment-audit-record-mapper.ts`; `repositories/drizzle-establishment-audit-records-repository.ts`; related database barrels; `apps/server/src/identity/database/drizzle/drizzle-identity-database.ts`; `apps/server/src/identity/database/identity-database.module.ts`; `apps/server/src/identity/constants/identity-repositories.ts`; `apps/server/src/shared/database/drizzle/schema.ts`.
- **Contract:** RF-06, RF-07; CA-08, CA-09, CA-12.
- **Outcome:** Establishment audit rows preserve tenant, affected-establishment name, actor snapshot/type, previous/new values, action, timestamp, foreign-key/index semantics, and immutable history; the repository is available inside the existing serializable `IdentityDatabase.run(...)` scope without leaking Drizzle types into Core.
- **Rules:** `documentation/rules/code-conventions-rules.md`; `documentation/rules/database-layer-rules.md` (owning module, one model per file, persistence types/mappers, repository vocabulary, module tokens, no direct repository tests); `documentation/rules/provision-layer-rules.md` for the shared datetime binding if touched.
- **Exit:** `pnpm --filter server check:code`, `pnpm --filter server check:types`, schema/export inspection, and transaction-scope review against the Spec migration body. Persistence is validated indirectly through F4 controller integration tests.

#### F2-T2 — Generate and review the forward establishment-audit migration

- **Status/owner:** `completed` — Orchestrator F2-T2
- **Depends/parallel:** F2-T1; blocks F4 database-backed tests. Generation is serialized by the Orchestrator and does not overlap Builder edits to generated files.
- **Paths:** `apps/server/src/shared/database/drizzle/migrations/0003_establishment_name_audit.sql`; `apps/server/src/shared/database/drizzle/migrations/meta/0003_snapshot.json`; `apps/server/src/shared/database/drizzle/migrations/meta/_journal.json`.
- **Contract:** RF-06, RF-07, RF-09; CA-08, CA-09, CA-12.
- **Outcome:** Drizzle-generated artifacts match the Spec’s enum, table, cascade, indexes, timestamp and nullable-value contract; no delete/logo/product mutation or destructive migration is introduced.
- **Rules:** `documentation/rules/database-layer-rules.md` (migrations from the shared schema, forward-only review, indexes and ownership); `documentation/tooling.md` (workspace Drizzle commands and local database safeguards).
- **Exit:** Run `pnpm --filter server db:migration:generate`, inspect the generated diff against the Spec’s required SQL, apply with `pnpm --filter server db:migration:apply` in the local database environment, and record the exact command/output in `evaluation.md`.

### F3 — Identity REST transport and local-session boundary

#### F3-T1 — Extend the Web Identity REST adapter for account and shop settings

- **Status/owner:** `completed` — Builder F3-T1
- **Depends/parallel:** F1 complete; parallel with F2. F3 owns the Web REST service and its tests, not server controllers or page state.
- **Paths:** `apps/web/src/rest/services/identity-service.ts`; `apps/web/src/rest/services/tests/identity-service-profile-settings.test.ts`.
- **Contract:** RF-01, RF-02, RF-03, RF-05, RF-07; CA-01, CA-02, CA-04, CA-06, CA-07, CA-10.
- **Outcome:** `changeOwnUserName`, `getEstablishmentSettings`, and `changeEstablishmentName` map exactly to the specified methods/paths/body shapes and return safe typed projections; transport errors remain available to owning hooks; no business, auth-header, cache, or tenant-selection logic enters the service.
- **Rules:** `documentation/rules/code-conventions-rules.md`; `documentation/rules/rest-layer-rules.md` (service implements Core contract and delegates transport); `documentation/rules/ui-layer-rules.md` (REST adapters are factories and are composed by RestContext).
- **Exit:** Focused service test covering method/path/body/response/error mapping, `pnpm --filter web check:code`, and `pnpm --filter web check:types` for the owned paths.

#### F3-T2 — Add account refresh and preserve local Supabase session exit

- **Status/owner:** `completed` — Builder F3-T2
- **Depends/parallel:** F3-T1; blocks the account page’s post-save and logout flows. F3 exclusively owns shared auth context/provider paths.
- **Paths:** `apps/web/src/provision/auth/supabase/supabase-auth-provider.ts` and its tests; `apps/web/src/ui/shared/contexts/auth-context/{types/auth-context-value.ts,use-auth-context-provider.ts,index.tsx}` and related tests; `apps/web/src/ui/shared/contexts/rest-context/**` only if composition needs the new Identity service.
- **Contract:** RF-01, RF-03, RF-04, RF-07, RF-08; CA-01, CA-04, CA-05, CA-10.
- **Outcome:** Successful self-name mutation can refresh the server-authoritative account; local sign-out continues to use `scope: 'local'`, clears local state, and exposes recoverable pending/error behavior; no provider subject, token, password, recovery or session internals enter REST responses.
- **Rules:** `documentation/rules/provision-layer-rules.md` (web client-plus-factory boundary, browser-safe configuration); `documentation/rules/ui-layer-rules.md` (auth context composition); `documentation/rules/widget-testing-rules.md` for the auth-context behavior test.
- **Exit:** Auth-context/provider tests assert refresh success/failure and exact local sign-out scope; run the focused Vitest test, Web code/type checks, and a source review for secret/session-field exclusion.

### F4 — Identity REST actions and server composition

#### F4-T1 — Add authenticated self-name and Manager current-establishment controllers

- **Status/owner:** `completed` — Builder F4-T1
- **Depends/parallel:** F1 and F2; parallel with F5 after F3’s Web contract is available. F4 owns Server REST controllers, DTOs, schemas, module registration, and server fixture updates.
- **Paths:** `apps/server/src/identity/rest/controllers/{change-own-user-name,get-establishment-settings,change-establishment-name}.controller.ts`; `get-auth-session.controller.ts`; `apps/server/src/identity/rest/dtos/{account-response,establishment-settings-response}.dto.ts`; `schemas/change-identity-name-schema.ts`; REST barrels; `apps/server/src/identity/identity.module.ts`; `apps/server/src/identity/fixtures/identity-module-fixture.ts`; `apps/server/rest-client/identity/{auth,establishments}.rest`.
- **Contract:** RF-01, RF-02, RF-03, RF-05, RF-07, RF-09; CA-01, CA-02, CA-04, CA-06, CA-07, CA-12.
- **Outcome:** Thin controllers expose `GET /auth/session`, `PATCH /auth/session/name`, `GET /establishments/current`, and `PATCH /establishments/current/name`; guards and Core both enforce actor/profile scope; DTOs expose only safe projections; validation and global error mapping match the contract; REST examples cover every route group action.
- **Rules:** `documentation/rules/code-conventions-rules.md`; `documentation/rules/rest-layer-rules.md` (group decorators, one action/controller, derived request body, Swagger responses, REST client examples, global errors); `documentation/rules/database-layer-rules.md` for token injection; `documentation/rules/provision-layer-rules.md` for provider boundaries.
- **Exit:** Focused server checks and Swagger/route inspection; controller integration tests in F4-T2 must pass through real Nest/module/repository wiring rather than direct `handle()` calls.

#### F4-T2 — Prove HTTP authorization, validation, persistence, and audit effects

- **Status/owner:** `completed` — Builder F4-T2
- **Depends/parallel:** F4-T1; no parallel Builder edits F4 controller tests or fixture paths.
- **Paths:** `apps/server/src/identity/rest/controllers/tests/{change-own-user-name,get-establishment-settings,change-establishment-name}.controller.test.ts`; `get-auth-session.controller.test.ts`; any feature-specific server test fixture additions owned by F4.
- **Contract:** RF-01, RF-02, RF-03, RF-05, RF-06, RF-07, RF-09; CA-01, CA-02, CA-04, CA-06, CA-07, CA-08, CA-09, CA-12.
- **Outcome:** Real HTTP tests prove Manager/Operator role behavior, current-account/current-establishment scoping, duplicate acceptance, trimmed/empty validation, safe response absence of secrets, persisted name plus audit row, historical snapshot preservation, rollback/no orphan audit, and foreign-establishment rejection.
- **Rules:** `documentation/rules/controllers-testing-rules.md` (real Nest/Supertest/Drizzle path, DatabaseFixture/RestFixture, isolation, HTTP plus persistence assertions); `documentation/rules/rest-layer-rules.md`; `documentation/rules/database-layer-rules.md`; `documentation/rules/use-case-testing-rules.md` only as the Core-test boundary reference.
- **Exit:** `pnpm --filter server test -- src/identity/rest/controllers/tests/change-own-user-name.controller.test.ts src/identity/rest/controllers/tests/get-establishment-settings.controller.test.ts src/identity/rest/controllers/tests/change-establishment-name.controller.test.ts src/identity/rest/controllers/tests/get-auth-session.controller.test.ts`; then `pnpm --filter server check:code`, `pnpm --filter server check:types`, and `pnpm --filter server build`.

### F5 — Account/shop-settings pages, shell navigation, routes, and browser suites

#### F5-T1 — Implement account and shop-settings page state and compositions

- **Status/owner:** `completed` — Builder Fix F5-T1-UI
- **Depends/parallel:** F3; may proceed in parallel with F4 using the Spec REST contract and deterministic Web boundaries. F5 owns feature hooks/widgets and must not edit F3 auth/service paths.
- **Paths:** `apps/web/src/ui/identity/hooks/{use-change-own-user-name-action,use-establishment-settings-query,use-change-establishment-name-action,identity-query-keys}.ts` and tests; `apps/web/src/ui/identity/widgets/pages/my-account-page/**`; `apps/web/src/ui/identity/widgets/pages/ice-cream-shop-settings-page/**`; shared existing UI primitives only when the feature contract requires an extension.
- **Contract:** RF-01, RF-02, RF-03, RF-04, RF-05, RF-08, RF-09; CA-01–CA-06, CA-10, CA-11, CA-12.
- **Outcome:** Stateful pages use colocated hooks and existing design-system primitives; account name editing, read-only identity, local logout, Manager shop rename, duplicate success, loading/pending/error/retry/session-expired/unauthorized states, focus movement, live announcements, keyboard paths, reduced motion, and 320px layout are user-observable and recoverable; deletion/logo controls are absent.
- **Rules:** `documentation/rules/ui-layer-rules.md` (feature/shared boundaries, stateful widget hooks, action/query semantics, contexts, tokens, accessibility); `documentation/rules/widget-testing-rules.md` (real owning hook composition, behavior matrix, accessible assertions); `documentation/design.md` (Manrope, semantic tokens, cards, focus, responsive and reduced motion).
- **Exit:** Focused page/action/hook Vitest suites for both pages and auth context; assertions cover each meaningful state and role, retained failed input, pending disablement, success refresh, focus/announcement, no horizontal overflow, no dangerous mutation controls, and direct comparison against all supplied references.

#### F5-T2 — Add protected routes, shell navigation, generated route metadata, and route integration tests

- **Status/owner:** `completed` — Builder Fix F5-T2-UI; Orchestrator owns generated output.
- **Depends/parallel:** F5-T1 and F3; parallel with F4-T2 with disjoint Web paths. F5 owns route constants, route files, app shell/user-menu changes, Web fixtures, and route tests; the Orchestrator alone runs route generation.
- **Paths:** `apps/web/src/constants/routes.ts`; `apps/web/src/routes/_authenticated/account/index.tsx`; `apps/web/src/routes/_authenticated/shop-settings/index.tsx`; `apps/web/src/ui/shared/widgets/layouts/app-layout/{index.tsx,user-menu/index.tsx}`; `apps/web/tests/routes/identity/{account.index,shop-settings.index}.test.ts`; `apps/web/tests/fixtures/{identity-data-fixtures,identity-module-fixture}.ts`; generated `apps/web/src/routeTree.gen.ts` only through `pnpm --filter web generate-routes`.
- **Contract:** RF-01, RF-04, RF-05, RF-07, RF-08, RF-09; CA-01, CA-04, CA-05, CA-06, CA-07, CA-10, CA-11, CA-12.
- **Outcome:** `/account` uses shared auth middleware for Manager/Operator access; `/shop-settings` is Manager-only in route behavior and server authority; Account is reachable from the user menu, Shop Settings is absent for Operators, canonical links use `ROUTES`, and generated route metadata matches both protected leaves. Browser suites assert final URLs, mocked request method/path/body/status, visible outcomes, retry, keyboard, and 320px no-scroll behavior.
- **Rules:** `documentation/rules/ui-layer-rules.md` (canonical route constants, Anchor/navigation, profile-driven shell, shared app layout); `documentation/rules/web-app-routing-rules.md` (thin route files, one auth middleware, generated tree, protected-route and failure coverage); `documentation/rules/widget-testing-rules.md` (layout/navigation boundary and route integration boundary).
- **Exit:** Run `pnpm --filter web generate-routes`, inspect the generated diff, then `pnpm --filter web check:code`, `pnpm --filter web check:types`, focused Web tests, and `pnpm --filter web test:integration tests/routes/identity/account.index.test.ts tests/routes/identity/shop-settings.index.test.ts`.

### F6 — Full-stack, visual/accessibility validation and final review

#### F6-T1 — Execute integrated evidence and the single read-only review

- **Status/owner:** `in_progress` — Reviewer F6-T1 dispatched after Builder Fixes
- **Depends/parallel:** F1–F5 completed; no parallel implementation work. The Reviewer is read-only and evaluates the integrated commit plus `evaluation.md`.
- **Paths:** `documentation/features/identity/features/profile-and-ice-cream-settings/evaluation.md`; `documentation/features/identity/features/profile-and-ice-cream-settings/evidence/screenshots/rev-3/{my-account-desktop-1481x1050,my-account-name-dialog-676x502,shop-settings-desktop-1551x1050}.png`.
- **Contract:** RF-01–RF-09; CA-01–CA-12; MV-01–MV-06.
- **Outcome:** Real local service/browser evidence connects Core, Server, database, Web, auth, route, audit, responsive, accessibility, console, and network behavior; every visual manifest state is compared at its exact viewport; implementation screenshots and manual findings are saved; no blocking finding or unreviewed generated artifact remains.
- **Rules:** `documentation/architecture.md`; `documentation/modules.md`; `documentation/design.md`; `documentation/tooling.md`; `documentation/rules/code-conventions-rules.md`; `documentation/rules/core-package-rules.md`; `documentation/rules/use-case-testing-rules.md`; `documentation/rules/rest-layer-rules.md`; `documentation/rules/controllers-testing-rules.md`; `documentation/rules/database-layer-rules.md`; `documentation/rules/provision-layer-rules.md`; `documentation/rules/ui-layer-rules.md`; `documentation/rules/web-app-routing-rules.md`; `documentation/rules/widget-testing-rules.md`.
- **Exit:** Run current Core/Server/Web code, type, build, focused tests, `pnpm build`, generated-route and migration reviews, then execute MV-01–MV-06 with required services and fixtures. Inspect browser console/network and database rows. Mark the phase complete only when all tasks/coverage rows are complete and the single read-only Reviewer accepts the integrated result.

# Validation and handoff

| Type | Scenario/surface | Criteria | Reference | Evidence target | Status |
| --- | --- | --- | --- | --- | --- |
| Automated | Core contracts and use cases | CA-01, CA-02, CA-06, CA-08, CA-09, CA-12 | F1-T1/F1-T2; Core Rule Pack | `./evaluation.md` | `pending` |
| Runtime | Server REST and persistence | CA-01, CA-02, CA-04, CA-06, CA-07, CA-08, CA-09, CA-12 | F4-T1/F4-T2; REST and Controller Testing Rules | `./evaluation.md` | `completed` |
| Runtime | Web REST/auth boundary | CA-01, CA-04, CA-05, CA-10 | F3-T1/F3-T2; REST/Provision Rules | `./evaluation.md` | `pending` |
| Automated | Web widgets, hooks, layout and auth context | CA-01, CA-02, CA-03, CA-04, CA-05, CA-06, CA-10, CA-11, CA-12 | F5-T1; UI and Widget Testing Rules | `./evaluation.md` | `pending` |
| Runtime | Protected route and browser transport behavior | CA-01, CA-04–CA-07, CA-10–CA-12 | F5-T2; MV-01–MV-05 route portions | `./evaluation.md` | `completed` |
| Visual | My Account default desktop — `1481 × 1050` | CA-11 | `./design/BRpGr.png` | `./evidence/screenshots/rev-3/real-my-account-desktop-1481x1050.png` | `completed` |
| Visual | My Account name-correction dialog — `676 × 502` | CA-02, CA-03, CA-04, CA-10, CA-11 | `./design/Ih9Qc.png` | `./evidence/screenshots/rev-3/real-my-account-name-dialog-676x502.png` | `completed` |
| Visual | Ice Cream Shop Settings default desktop — `1551 × 1050` | CA-06, CA-07, CA-11, CA-12 | `./design/m7W867.png` | `./evidence/screenshots/rev-3/real-shop-settings-desktop-1551x1050.png` | `completed` |
| Manual | MV-01 — Manager account desktop | CA-01, CA-02, CA-04, CA-05, CA-10, CA-11, CA-12 | Spec MV-01 | `./evaluation.md` | `pending` |
| Manual | MV-02 — Operator account at `320 × 800` | CA-02, CA-03, CA-04, CA-05, CA-10, CA-11 | Spec MV-02 | `./evaluation.md` | `pending` |
| Manual | MV-03 — Manager shop settings desktop and `320 × 800` | CA-06, CA-08, CA-10, CA-11, CA-12 | Spec MV-03 | `./evaluation.md` | `pending` |
| Manual | MV-04 — Operator shop-settings denial | CA-07, CA-10 | Spec MV-04 | `./evaluation.md` | `pending` |
| Manual | MV-05 — request failure and session expiry recovery | CA-03, CA-05, CA-10 | Spec MV-05 | `./evaluation.md` | `pending` |
| Manual | MV-06 — tenant isolation and audit persistence | CA-06, CA-08, CA-09 | Spec MV-06 | `./evaluation.md` | `pending` |

Final handoff requires every task and phase to be `completed`, the Spec revision to remain `3`, current Core/Server/Web validation commands to pass on the integrated commit, generated route/migration artifacts to be reviewed, local services/accounts/fixtures to be ready, all six `MV-*` scenarios to be executable with evidence, all three design-reference screenshots to have matching implementation captures, and no blocking finding to be active. Only then may the single read-only Reviewer run and record the final verdict in `evaluation.md`.
