---
title: Authentication and authorization foundation — implementation plan
status: accepted
spec: ./spec.md
evaluation: ./evaluation.md
spec_revision: 17
source_issue: https://github.com/rafinel/scoops/issues/1
updated_at: 2026-08-12
---

# Authentication and authorization foundation — Plan SDD

## Operational state

- **Plan status:** `accepted`
- **Spec:** `completed`, revision `17`
- **Current phase:** Wave 4 — F6 Integrated
- **Next action:** no implementation action remains; final evidence and Quality Gate are recorded below.
- **Judge policy:** no phase receives a Judge verdict. One `Judge Implementation Final` is reserved for the integrated implementation after all phase sensors and cross-workspace evidence pass.

This Plan is necessary because the delivery crosses `packages/core`, `apps/server`
and `apps/web`, introduces Identity persistence and a migration, integrates
Supabase Auth, changes global REST authentication, and requires real browser
validation. It is the execution ledger; the Contract and acceptance criteria
remain authoritative in [`spec.md`](./spec.md).

The execution is intentionally split into two Builder lanes after Core: the
Server lane and the Web lane can run in parallel against the stable Core and
Spec-defined REST contracts. They join only for integrated HTTP/browser evidence
and the final quality gate.

## Objective

Deliver the authentication and authorization foundation described by Spec
revision 16: provider-independent Core contracts and use cases; server-side
authentication, local-access resolution, fixed-profile authorization and tenant
scope; Identity persistence with a serializable transaction boundary; browser
session restoration, current-device logout and password recovery; protected
TanStack routes and accessible Identity UI; and evidence from unit, controller,
  automated route tests, manual `browser-use` validation, migration and build
  sensors.

## Scope

The implementation is limited to the Spec scope:

- Core Identity auth contracts, `Account`, errors, repository boundaries and the
  `ResolveAuthenticatedUserUseCase` / `ChangeUserProfileUseCase` rules;
- Identity Drizzle models, repositories, transaction adapter, migration and safe
  development seeder;
- Supabase server token verification and browser provider adapters without
  service-role credentials in runtime or browser boundaries;
- global server authentication, profile authorization, request account context,
  `GET /auth/session`, `PATCH /users/:userId/profile`, DTOs, REST examples and
  HTTP integration coverage;
- browser-safe auth composition, dynamic Bearer injection, `AuthContext`, public
  auth pages, protected `/app`, `/access-denied`, session/recovery states and
  responsive accessible widgets;
- generated route metadata, generated Drizzle migration artifacts, workspace
  checks, controller tests, widget tests, Playwright route tests and real local
  Supabase/server/web evidence.

## Out of scope

No task in this Plan may add public onboarding or sign-up, invitations or team
management screens, profile-management UI, audit or notifications, Billing/MRP/
PDV/Communication pages, custom throttling or session timers, RLS, social/
passwordless/MFA authentication, custom profiles, or per-user permission
exceptions. The Manager-only profile endpoint is a foundation slice; it does not
complete PRD REQ-07.

## Traceability

The Spec is the source of truth for all requirement text. The mapping below keeps
every `RF-*` and `CA-*` attached to at least one phase and task.

| Requirement | Planned phases | Primary observable |
| --- | --- | --- |
| RF-01 | F1 | Core contracts compile and map provider data without framework imports. |
| RF-02 | F1, F2, F3, F6 | Invalid/local-unavailable access is neutral `401`; active access resolves through the server. |
| RF-03 | F3, F4, F5, F6 | Login, recovery and unavailable states do not disclose local account status. |
| RF-04 | F3 | Controllers receive only server-derived `Account` context. |
| RF-05 | F3, F5, F6 | Direct Operator calls receive `403`; route protection is not the security boundary. |
| RF-06 | F1, F2, F3, F6 | Cross-establishment target access is `404` with no mutation or data leak. |
| RF-07 | F1, F2, F3, F6 | Self-change, cross-tenant, last-Manager and concurrent demotion invariants hold. |
| RF-08 | F4, F5, F6 | Reload restoration, pending shell, local rejection, retry and session expiry work without protected-content flash. |
| RF-09 | F4, F5, F6 | Local sign-out ends only the current provider session and returns to login. |
| RF-10 | F1, F4, F5, F6 | Neutral recovery, valid recovery reset, global sign-out and new-login requirement work. |
| RF-11 | F5, F6 | Public routes remain reachable; protected `/app` uses client middleware and the React auth gate. |
| RF-12 | F2, F4, F5, F6 | Only browser-safe configuration is exposed; secrets and raw tokens do not enter bundles, logs or DTOs. |

| Acceptance criteria | Planned evidence phase |
| --- | --- |
| CA-01 | F1 Core unit tests and typecheck |
| CA-02 | F3 controller integration through HTTP |
| CA-03 | F2/F3 controller tests plus F5/F6 browser evidence |
| CA-04 | F1 use-case test plus F3 HTTP bootstrap test |
| CA-05 | F3 authenticated request-context integration test |
| CA-06 | F3 Operator direct-call integration test |
| CA-07 | F1 use-case test plus F3 tenant-scoped HTTP test |
| CA-08 | F1 use-case tests plus F3 HTTP error assertions |
| CA-09 | F2/F3 concurrent HTTP requests and persisted-state assertion |
| CA-10 | F1 use-case test plus F3 subsequent authorization request |
| CA-11 | F4 widget/context tests plus F5/F6 manual `browser-use` and console evidence |
| CA-12 | F5/F6 direct `/app` browser-use redirect, HTML, network and console evidence |
| CA-13 | F4 provider test plus F5/F6 two-session browser-use evidence |
| CA-14 | F4 provider/context test plus F5/F6 recovery browser-use evidence |
| CA-15 | F4 provider/context test plus F5/F6 invalid/expired-link browser-use evidence |
| CA-16 | F4 provider/context test plus F5/F6 successful reset browser-use evidence |
| CA-17 | F2/F4 source and environment checks plus F6 production builds/network inspection |
| CA-18 | F4 auth-context test plus F5/F6 `503`/transport retry browser-use evidence |

## Phase and parallel execution ledger

| Wave | Lane | Phase | Name | Depends on | Parallel with | Status | Exit condition |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Core | F1 | Core contracts and Identity business rules | — | — | `accepted` | Core contracts, use cases, fakers and unit sensors pass. |
| 2 | Server | F2 | Identity persistence, transaction boundary and provider infrastructure | F1 | **Web F4**; lockfile coordinated before wave | `accepted` | Migration, repositories, seeder and server Supabase adapter are wired and static sensors pass. |
| 2 | Web | F4 | Provider, REST transport and AuthContext | F1 + stable Spec/Core REST contract | **Server F2**; lockfile coordinated before wave | `accepted` | Provider, dynamic token transport and auth lifecycle tests pass. |
| 3 | Server | F3 | Server authentication and REST authorization boundary | F2 | **Web F5** | `accepted` | Real HTTP controller tests prove authentication, profile checks, tenancy and concurrency. |
| 3 | Web | F5 | Web routes, protected shell and Identity UI | F4 | **Server F3** | `accepted` | Generated routes, widget tests and focused mocked-transport browser suites pass. |
| 4 | Integrated | F6 | Cross-workspace integration, real browser evidence and final quality gate | F1–F5 | — | `accepted` | Integrated sensors, Pencil evidence, real browser-use evidence and the reused final Judge pass. |

Allowed phase states are `pending`, `in_progress`, `awaiting_judgment`, `failed`
and `accepted`. Allowed task states are `pending`, `implementing`,
`validating` and `verified`. The initial state for every phase and task below is
`pending`.

## Detailed task ledger

### F1 — Core contracts and Identity business rules

**Dependency:** none. **Phase state:** `accepted`.

#### F1-T1 — Add provider-independent contracts and projections

- **Task state:** `verified`
- **Paths:**
  - `packages/core/src/identity/domain/structures/`
  - `packages/core/src/identity/domain/entities/account.ts`
  - `packages/core/src/identity/domain/errors/`
  - `packages/core/src/shared/domain/errors/authorization-error.ts`
  - `packages/core/src/identity/interfaces/`
  - `packages/core/src/identity/domain/*/index.ts`
  - `packages/core/src/shared/domain/errors/index.ts`
  - `packages/core/package.json`
- **Requirements:** RF-01, RF-02, RF-06, RF-07, RF-10; CA-01, CA-04, CA-07, CA-08, CA-10.
- **Observable result:** Core exports `AuthCredentials`, `AuthSession`, `AuthStateChange`, `AuthStateChangeListener`, `AuthUser`, `Account`, `AuthProvider`, `AuthIdentityProvider`, `IdentityService`, the Identity repository additions and the single `IdentityDatabase.run` transaction contract. `Account` contains no provider token or status metadata, and Core has no Supabase, HTTP, NestJS or Drizzle import.
- **Parallelizable:** `false` — all later Core work depends on these contracts and barrels.

#### F1-T2 — Implement access/profile use cases and deterministic Core tests

- **Task state:** `verified`
- **Paths:**
  - `packages/core/src/identity/use-cases/resolve-authenticated-user-use-case.ts`
  - `packages/core/src/identity/use-cases/change-user-profile-use-case.ts`
  - `packages/core/src/identity/use-cases/index.ts`
  - `packages/core/src/identity/use-cases/tests/`
  - `packages/core/src/identity/domain/entities/fakers/`
  - `packages/core/package.json`
- **Requirements:** RF-02, RF-06, RF-07; CA-01, CA-04, CA-07, CA-08, CA-09, CA-10.
- **Observable result:** Active local access resolves only from provider subject → user → derived establishment. Profile changes enforce actor, tenant, self-change, idempotency, last-active-Manager and captured-timestamp rules inside `IdentityDatabase.run`; serialization retry/conflict behavior is represented by the use-case contract tests. Fakers have valid defaults and partial overrides.
- **Parallelizable:** `false` — it consumes F1-T1 contracts; the Core test script and Core dependency declarations remain one atomic workspace change. The Orchestrator owns the shared lockfile update before the application lanes start.
- **Sensors:** `pnpm --filter @scoops/core check:code`, `pnpm --filter @scoops/core check:types`, `pnpm --filter @scoops/core test`.
- **Expected evidence:** test output for every meaningful use-case branch, typed mock interactions, deterministic `DatetimeProvider` assertion and no infrastructure bootstrap.

**F1 phase sensors and evidence:**

- Sensors: Core Biome check, TypeScript check and Core unit suite.
- Evidence: changed Core exports, `Account`, auth contracts, repository contract extensions, use-case files, fakers, 14 deterministic tests, command results and a scan confirming no provider/framework imports in Core.
- Sensor results: `pnpm --filter @scoops/core check:code` passed; `pnpm --filter @scoops/core check:types` passed; `pnpm --filter @scoops/core exec vitest run` passed with 2 files and 14 tests; `git diff --check` passed.
- Phase acceptance: F1 tasks are `verified`; no Judge was created for F1.

### F2 — Identity persistence, transaction boundary and provider infrastructure

**Dependency:** F1 accepted by deterministic sensors. **Phase state:** `accepted`.

#### F2-T1 — Implement Identity Drizzle persistence, migration and seeder

- **Task state:** `verified`
- **Paths:**
  - `apps/server/src/identity/database/drizzle/models/`
  - `apps/server/src/identity/database/drizzle/types/`
  - `apps/server/src/identity/database/drizzle/mappers/`
  - `apps/server/src/identity/database/drizzle/repositories/`
  - `apps/server/src/identity/database/drizzle/drizzle-identity-database.ts`
  - `apps/server/src/identity/database/identity-database.module.ts`
  - `apps/server/src/identity/database/identity-seeder.ts`
  - `apps/server/src/shared/database/drizzle/schema.ts`
  - `apps/server/src/shared/database/seed-env.ts`
  - `apps/server/src/shared/database/seed.ts`
  - `apps/server/src/shared/database/drizzle/migrations/<generated>_identity_auth_foundation.sql`
  - generated Drizzle migration metadata
  - `apps/server/package.json`
  - `apps/server/.env.example`
- **Requirements:** RF-02, RF-06, RF-07, RF-12; CA-04, CA-07, CA-08, CA-09, CA-10, CA-17.
- **Observable result:** Identity models, mappers and repositories implement the Core contracts; all Identity operations execute through serializable `IdentityDatabase.run`; PostgreSQL `40001` is retried once and then translated to `ConflictError`; seed clear/run order respects foreign keys and accepts only provider subject UUIDs; generated migration contains the Identity enums, tables, constraints and indexes without RLS.
- **Parallelizable:** `false` — schema barrel, module composition, package scripts, environment examples and migration generation are shared integration surfaces with F2-T2.

#### F2-T2 — Add server Supabase identity verification and environment boundary

- **Task state:** `verified`
- **Paths:**
  - `apps/server/src/identity/constants/identity-providers.ts`
  - `apps/server/src/identity/constants/index.ts`
  - `apps/server/src/identity/provision/supabase/supabase-auth-identity-provider.ts`
  - `apps/server/src/identity/provision/errors/authentication-provider-unavailable.error.ts`
  - `apps/server/src/identity/provision/identity-provision.module.ts`
  - `apps/server/src/shared/provision/env/env-provider.ts`
  - `apps/server/.env.example`
  - `apps/server/package.json`
- **Requirements:** RF-02, RF-03, RF-12; CA-02, CA-03, CA-04, CA-17.
- **Observable result:** The server adapter verifies one Bearer access token, returns only the provider subject, maps invalid/expired responses to `undefined`, translates provider/network availability failures to a server-local typed error and reads only `SUPABASE_URL` plus a server-safe anon/public verification key. No service-role key, JWT secret, database credential, provider payload or raw token crosses the boundary.
- **Parallelizable:** `false` — it shares server package/environment changes with F2-T1 and must be integrated with the Identity module composition.
- **Sensors:** `pnpm --filter server check:code`, `pnpm --filter server check:types`, migration generation review and a source/environment secret scan.
- **Expected evidence:** generated migration diff, provider error-mapping tests or focused adapter evidence, package/lock diff and proof that secret-only variables are absent from runtime/browser paths.

**F2 phase sensors and evidence:**

- Sensors: server code/type checks; migration/schema review; lockfile consistency; secret/source scan.
- Evidence: `0000_cold_edwin_jarvis.sql` and metadata, module token bindings, seeder order, serializable transaction configuration and provider boundary behavior.
- Sensor results: `pnpm --filter server check:code` passed; `pnpm --filter server check:types` passed; `pnpm --filter server test` passed with no server test files; migration contains Identity enums/tables/constraints/indexes and no RLS/grants/drop/truncate; `git diff --check` passed.
- Phase acceptance: F2 tasks are `verified`; no phase Judge was created.
- Phase acceptance: repository behavior is not certified by standalone repository tests; it is certified later through F3 controller integration as required by the database and controller rules.

### F3 — Server authentication and REST authorization boundary

**Dependency:** F2 persistence and provider infrastructure. **Phase state:** `accepted`.

#### F3-T1 — Compose public metadata, authentication guard, profile guard and request context

- **Task state:** `verified`
- **Paths:**
  - `apps/server/src/shared/rest/decorators/public-route.ts`
  - `apps/server/src/shared/rest/controllers/check-health.controller.ts`
  - `apps/server/src/shared/messaging/inngest/inngest-controller.ts`
  - `apps/server/src/identity/decorators/`
  - `apps/server/src/identity/rest/types/authenticated-request.ts`
  - `apps/server/src/identity/rest/guards/authentication.guard.ts`
  - `apps/server/src/identity/rest/guards/profiles.guard.ts`
  - `apps/server/src/identity/identity.module.ts`
  - `apps/server/src/app.module.ts` when root guard composition requires it
- **Requirements:** RF-02, RF-03, RF-04, RF-05, RF-06, RF-12; CA-02, CA-03, CA-04, CA-05, CA-06, CA-07.
- **Observable result:** Secure-by-default global authentication bypasses only explicit public metadata; strict Bearer parsing, provider verification, local-access resolution and server-derived `request.account` produce neutral `401`, retryable `503` and profile `403` responses in the documented order. Profile metadata never reads client-supplied actor, establishment or status.
- **Parallelizable:** `false` — guard order, metadata keys, module registration and shared public endpoints form one authorization boundary.

#### F3-T2 — Expose session/profile REST actions and controller integration coverage

- **Task state:** `verified`
- **Paths:**
  - `apps/server/src/identity/rest/controllers/get-auth-session.controller.ts`
  - `apps/server/src/identity/rest/controllers/change-user-profile.controller.ts`
  - `apps/server/src/identity/rest/schemas/change-user-profile-schema.ts`
  - `apps/server/src/shared/rest/pipes/zod-validation.pipe.ts`
  - `apps/server/src/shared/rest/filters/global-error-handler.ts`
  - `apps/server/src/identity/rest/dtos/`
  - `apps/server/rest-client/identity/auth.rest`
  - `apps/server/rest-client/identity/users.rest`
  - `apps/server/src/identity/fixtures/identity-module-fixture.ts`
  - `apps/server/src/identity/rest/controllers/tests/get-auth-session.controller.test.ts`
  - `apps/server/src/identity/rest/controllers/tests/change-user-profile.controller.test.ts`
- **Requirements:** RF-02, RF-03, RF-04, RF-05, RF-06, RF-07, RF-12; CA-02 through CA-10 and CA-17.
- **Observable result:** `GET /auth/session` returns only the safe `AccountResponse`; `PATCH /users/:userId/profile` derives actor/tenant from `CurrentAccount`, validates only the fixed Core enum, maps documented errors and proves success, neutrality, profile rejection, cross-tenant `404`, self/last-Manager `409`, provider `503` and concurrent persisted invariants through real Nest/Drizzle HTTP wiring.
- **Parallelizable:** `false` — F3-T2 consumes F3-T1 and its fixture must use the same module token bindings and guard order.
- **Sensors:** `pnpm --filter server check:code`, `pnpm --filter server check:types`, `pnpm --filter server test` with Docker-compatible PostgreSQL for controller integration.
- **Expected evidence:** one controller test per controller, HTTP method/path/status/body assertions, persisted-state assertions for writes, real repository/mapper/database path and documented local provider double only at the external Auth boundary.

**F3 phase sensors and evidence:**

- Sensors: server static checks and the two real HTTP controller suites; inspect Swagger responses and REST examples.
- Evidence: `401`/`403`/`404`/`409`/`422`/`503` matrix, request account contents, no target lookup for Operator, cross-tenant no-mutation proof and concurrent two-Manager persisted state.
- Sensor results: `pnpm --filter server check:code` passed; `pnpm --filter server check:types` passed; `pnpm --filter server test` passed with 2 files and 12 tests after the Testcontainer `DATABASE_URL` fixture fix; `git diff --check` passed.
- Phase acceptance: F3 tasks are `verified`; no phase Judge was created.

### F4 — Web provider, REST transport and AuthContext

**Dependency:** F1 Core contracts and the stable REST contract defined by the
Spec/Core `IdentityService`; F3 server implementation is not required for Web
unit or mocked-transport route work. **Phase state:** `accepted`.

Before editing any web source, execute the matching TanStack Intent guidance from
`apps/web/AGENTS.md`; the initial candidates are the Router core auth/guards,
search-params, SSR and Start execution-model guidance. Record the command/result
in `evaluation.md` during implementation.

#### F4-T1 — Add browser Supabase adapter, composition and dynamic REST authorization

- **Task state:** `verified`
- **Paths:**
  - `apps/web/src/provision/auth/supabase/supabase-client.ts`
  - `apps/web/src/provision/auth/supabase/supabase-auth-provider.ts`
  - `apps/web/src/provision/auth/auth-composition.ts`
  - `apps/web/src/provision/auth/supabase/tests/supabase-auth-provider.test.ts`
  - `apps/web/src/constants/browser-env.ts`
  - `apps/web/.env.example`
  - `apps/web/src/rest/services/identity-service.ts`
  - `apps/web/src/rest/axios/axios-rest-client.ts`
  - `apps/web/src/rest/axios/utils/request.ts`
  - `apps/web/src/rest/axios/utils/`
  - `apps/web/package.json`
- **Requirements:** RF-01, RF-03, RF-08, RF-09, RF-10, RF-12; CA-01, CA-13, CA-14, CA-15, CA-16, CA-17.
- **Observable result:** The browser has exactly one browser-safe Supabase provider/composition and one Identity REST service. Every authenticated request resolves the latest provider access token per request; local/global sign-out scopes, nullable session/user mapping and provider error translation are covered without logging or freezing tokens.
- **Parallelizable:** `false` — provider, transport, browser environment and package dependency changes are one Web application boundary, while the entire F4 Web phase runs in parallel with the independent F2 Server phase.
- **Sensors:** `pnpm --filter web check:code`, `pnpm --filter web check:types`, focused provider tests and a browser-source secret scan.
- **Expected evidence:** mocked Supabase client tests for mapping, nulls, errors, unsubscribe and scopes; request-header assertions proving refresh-safe Bearer injection; browser env output containing only URL/anon key.

#### F4-T2 — Implement AuthContext lifecycle and provider composition

- **Task state:** `verified`
- **Paths:**
  - `apps/web/src/ui/shared/contexts/auth-context/`
  - `apps/web/src/ui/shared/hooks/use-auth-context.ts`
  - `apps/web/src/ui/shared/widgets/layouts/root-layout/index.tsx`
  - `apps/web/src/ui/shared/contexts/rest-context/use-rest-context-provider.ts`
  - `apps/web/src/ui/shared/contexts/auth-context/tests/`
- **Requirements:** RF-03, RF-08, RF-09, RF-10, RF-12; CA-11, CA-13, CA-14, CA-15, CA-16, CA-18.
- **Observable result:** `AuthContext` is the only browser auth state owner. It starts as `resolving`, restores provider state, validates `/auth/session`, handles provider events without callback deadlock, invalidates only on `401`, preserves the session for `503`/transport failure with retry, clears state on local/global sign-out, and prevents stale async work from republishing authenticated state after sign-out/unmount.
- **Parallelizable:** `false` — it depends on F4-T1 and changes the shared provider order and REST-context dependency graph.

#### F4-T3 — Cover web auth context and transport behavior

- **Task state:** `verified`
- **Paths:**
  - colocated tests under `apps/web/src/ui/shared/contexts/auth-context/tests/`
  - REST transport tests under `apps/web/src/rest/axios/`
  - any touched shared context test files
- **Requirements:** RF-08, RF-09, RF-10, RF-12; CA-11, CA-13, CA-14, CA-15, CA-16, CA-18.
- **Observable result:** Tests prove restoration, sign-in, refresh, recovery, cleanup, deferred validation after sign-out, `401` local sign-out and `503`/unexpected transport preservation plus retry. Assertions use accessible/state outcomes where rendered and shared HTTP status constants for status branching.
- **Parallelizable:** `false` — test coverage must follow the final context/transport composition and cannot certify an intermediate design.
- **Sensors:** `pnpm --filter web test` focused to the changed unit suites.
- **Expected evidence:** Vitest output and explicit case-to-criterion mapping in `evaluation.md`.

**F4 phase sensors and evidence:**

- Sensors: web code/type checks, provider/context/transport Vitest suites, browser-safe environment scan and token-log scan.
- Evidence: auth state transition matrix, generation guard behavior, current-device/global logout calls, dynamic header behavior and `503` retry preservation.
- Sensor results: `pnpm --filter web check:code` passed with four pre-existing reduced-motion `!important` warnings in `global.css`; `pnpm --filter web check:types` passed; `pnpm --filter web test` passed with 4 files and 13 tests; `git diff --check` and browser-secret scan passed.
- Phase acceptance: F4 tasks are `verified`; no browser route Judge was created.
- Phase acceptance: mark F4 tasks `verified` only after tests pass; no browser route Judge is created.

### F5 — Web routes, protected shell and Identity UI

**Dependency:** F4 accepted by web unit sensors. **Phase state:** `accepted`.

#### F5-T1 — Add canonical routes, middleware and generated route tree

- **Task state:** `verified`
- **Paths:**
  - `apps/web/src/constants/routes.ts`
  - `apps/web/src/middlewares/sanitize-return-to.ts`
  - `apps/web/src/middlewares/auth-route-unavailable-error.ts`
  - `apps/web/src/middlewares/require-auth-middleware.ts`
  - `apps/web/src/routes/login/index.tsx`
  - `apps/web/src/routes/forgot-password/index.tsx`
  - `apps/web/src/routes/reset-password/index.tsx`
  - `apps/web/src/routes/access-denied/index.tsx`
  - `apps/web/src/routes/_authenticated/route.tsx`
  - `apps/web/src/routes/_authenticated/app/index.tsx`
  - `apps/web/src/routeTree.gen.ts` (generated only)
- **Requirements:** RF-03, RF-05, RF-08, RF-11, RF-12; CA-11, CA-12, CA-18.
- **Observable result:** Public auth routes remain reachable; `_authenticated` is a client-only pathless protected layout with `beforeLoad: requireAuthMiddleware`, a safe pending shell and retryable unavailable error boundary. `returnTo` accepts only a sanitized relative path and never carries session/account state. The generated route tree matches the route files.
- **Parallelizable:** `false` — routes, canonical constants, middleware and generated metadata must be updated and validated together.
- **Sensors:** `pnpm --filter web generate-routes`, `pnpm --filter web check:code`, `pnpm --filter web check:types`.
- **Expected evidence:** generated diff review, route middleware assertions, sanitized return matrix and no manual edits to generated metadata.

#### F5-T2 — Build auth pages, route states and action hooks

- **Task state:** `verified`
- **Paths:**
  - `apps/web/src/ui/identity/widgets/layouts/auth-layout/`
  - `apps/web/src/ui/identity/widgets/pages/login-page/`
  - `apps/web/src/ui/identity/widgets/pages/forgot-password-page/`
  - `apps/web/src/ui/identity/widgets/pages/reset-password-page/`
  - `apps/web/src/ui/identity/widgets/pages/access-denied-page/`
  - `apps/web/src/ui/identity/widgets/pages/authenticated-home-page/`
  - `apps/web/src/ui/identity/widgets/layouts/authenticated-route/`
  - `apps/web/src/ui/identity/widgets/states/auth-route-unavailable-state/`
  - `apps/web/src/ui/identity/hooks/`
  - colocated widget/page/action tests under `apps/web/src/ui/identity/`
- **Requirements:** RF-03, RF-08, RF-10, RF-11, RF-12; CA-11 through CA-16 and CA-18.
- **Observable result:** Login, forgot-password, reset-password, access-denied and authenticated home render semantic loading, success, neutral failure, invalid/expired recovery and retry states; actions remain disabled while pending; password fields are accessible/password-manager friendly; layout works from 320 px and uses existing design tokens.
- **Parallelizable:** `false` — all pages consume the same AuthContext and route contract; nested widgets must be integrated before tests are considered complete.

#### F5-T3 — Integrate `/app` shell and current-device user menu

- **Task state:** `verified`
- **Paths:**
  - `apps/web/src/ui/shared/widgets/layouts/app-layout/`
  - `apps/web/src/ui/shared/widgets/layouts/app-layout/user-menu/index.tsx`
  - `apps/web/src/ui/identity/widgets/layouts/authenticated-route/`
  - `apps/web/src/ui/identity/widgets/pages/authenticated-home-page/`
  - related app-layout and protected-route tests
- **Requirements:** RF-05, RF-08, RF-09, RF-11; CA-11, CA-12, CA-13, CA-18.
- **Observable result:** Both Manager and Operator can render the neutral `/app` landing; safe account name/profile appear in the user menu; `Exit this device` invokes local sign-out; no placeholder module navigation is invented and no profile-dependent route is treated as delivered.
- **Parallelizable:** `false` — shared app layout and protected route composition overlap with F5-T2 and the profile nomenclature finding must be resolved before implementation.
- **Sensors:** `pnpm --filter web test` focused to Identity pages, protected route and AppLayout tests.
- **Expected evidence:** accessible output, keyboard path, pending/error/retry states, role-neutral `/app` behavior and logout navigation.

**F5 phase sensors and evidence:**

- Sensors: route generation, web code/type checks, widget Vitest suites and the repository's focused automated Playwright suites with mocked transport.
- Evidence: final URLs, visible accessible states, outgoing HTTP method/path/body, protected redirect, return-to behavior, role matrix, narrow viewport and keyboard checks. Manual UI validation is performed with `browser-use`, not Playwright.
- Design evidence: before each mapped surface, inspect Pencil nodes `mA3b4`, `JMFTA`, `TCmT1`, `wxfmd`, `fmVfn`, `FvrFp` and `RZ6Ql` only through Pencil MCP; record node ID, screenshot/layout inspection result and token/component mapping in `evaluation.md`.
- Sensor results: route generation passed; `pnpm --filter web check:code` passed with four pre-existing reduced-motion `!important` warnings in `global.css`; `pnpm --filter web check:types` passed; `pnpm --filter web test` passed with 4 files and 13 tests; `git diff --check` passed. F5 automated Playwright integration was not run in this phase; manual browser-use evidence remains required in F6.
- Phase acceptance: F5 tasks are `verified`; no Judge per route or widget was created.

### F6 — Cross-workspace integration, real browser evidence and final quality gate

**Dependency:** F1–F5 verified. **Phase state:** `accepted`.

#### F6-T1 — Run integrated static, test and generated-artifact sensors

- **Task state:** `verified`
- **Paths:** all changed paths in the Spec scope; generated migration metadata and `apps/web/src/routeTree.gen.ts`.
- **Requirements:** all RF-01 through RF-12; all CA-01 through CA-18.
- **Observable result:** The integrated HEAD passes the documented workspace checks and tests with generated outputs synchronized.
- **Parallelizable:** `false` — sensors must run against one integrated HEAD and failures must be attributable to the current Plan state.
- **Sensors:**
  - `pnpm format`
  - `pnpm --filter @scoops/core check:code`
  - `pnpm --filter @scoops/core check:types`
  - `pnpm --filter @scoops/core test`
  - `pnpm --filter server check:code`
  - `pnpm --filter server check:types`
  - `pnpm --filter server test`
  - `pnpm --filter web generate-routes`
  - `pnpm --filter web check:code`
  - `pnpm --filter web check:types`
  - `pnpm --filter web test`
- **Expected evidence:** command results, generated-file diff review, changed-file inventory and findings classified as fixed, pre-existing or blocking.

#### F6-T2 — Validate the real local Supabase/server/web workflow

- **Task state:** `verified`
- **Paths:** no planned source path; evidence is written to `evaluation.md` and summarized in this Plan.
- **Requirements:** RF-02 through RF-12; CA-02 through CA-18.
- **Observable result:** With Docker/Supabase healthy, two temporary local Auth users seeded only by UUID subject, and server/web dev processes running, the real flow proves login, reload, local rejection, current-device logout, recovery/reset, protected `/app`, direct Manager-only HTTP authorization, `503` retry preservation, no protected HTML/account serialization, and no token/secret leakage.
- **Parallelizable:** `false` — browser flows mutate shared local Auth/database state and must be executed serially with fresh seeded state where required.
- **Sensors:**
  - inspect `docker compose ps` and health endpoints before navigation;
  - verify the fixed local Supabase seed users and password configured in the seed entry point, then run `pnpm --filter server db:seed`;
  - start `pnpm --filter server dev` and `pnpm --filter web dev` in persistent sessions;
  - use the `browser-use` CLI/CDP workflow for manual flows against `http://127.0.0.1:3000` and `http://127.0.0.1:3333`; navigate with `new_tab`, wait after navigation, prefer the accessibility tree for interaction, and inspect DOM/network/console evidence before each result;
  - inspect accessibility snapshots, final URL, request/response status and body, console messages, failed network requests and narrow viewport/keyboard behavior;
  - stop only the application processes started for validation; leave shared Docker services running.
- **Expected evidence:** per-flow `browser-use` result with route, account role, HTTP/Auth evidence, console/network classification and cleanup confirmation. The repository's mocked Playwright suite remains labeled as automated UI/REST-contract evidence, not real authenticated integration; it does not replace the manual `browser-use` run.

#### F6-T3 — Run the final build/security gate and prepare the Judge handoff

- **Task state:** `verified`
- **Paths:** no new source path; `evaluation.md` receives formal evidence and the Plan receives the ledger summary.
- **Requirements:** RF-08, RF-11, RF-12; CA-11, CA-12, CA-13, CA-16, CA-17, CA-18.
- **Observable result:** Final artifacts build successfully and the current HEAD has complete, non-narrative evidence for every acceptance criterion.
- **Parallelizable:** `false` — the build and security evidence must evaluate the exact integrated HEAD after all fixes.
- **Sensors:** `pnpm --filter server build`, `pnpm --filter web build`, `pnpm build`, source/bundle/network/log scan for secrets and tokens.
- **Expected evidence:** build output, bundle scan, browser network/console evidence, open findings list and a criterion-by-criterion handoff package.
- **Handoff:** after F6 sensors pass, create exactly one `Judge Implementation Final` in read-only mode against Spec revision 16, the integrated diff and official sensor evidence. Record its formal verdict in `evaluation.md`; do not add a Judge to any phase or retry.

**F6 phase sensors and evidence:**

- Sensors: integrated workspace checks, real local `browser-use` flow, Pencil UI evidence, final builds and secret scan.
- Evidence: `evaluation.md` with criterion matrix, commands, URLs, HTTP/Auth/network/console observations, Pencil node references, and final build/security results.
- Sensor results: `pnpm format` passed with one broken-symlink warning; Core checks and 14 tests passed; Server type/code checks and 12 tests passed, with the full Server suite passing on the clean rerun; Web route generation/checks and 31 tests passed; focused automated Playwright route integration passed 4 tests; local `db:seed` passed with UUID-only subjects; Web build passed; source/bundle/token scan and `git diff --check` passed; Pencil MCP inspection and manual `browser-use` CDP validation passed, including valid reset/global logout and isolated Manager/Operator sessions.
- Phase acceptance: F6 is `accepted` after the reused final Judge returned
  `accepted`; the conclusion workflow recorded the final Quality Gate and
  completed the Spec.

**Judge findings requiring Builder Fix:**

- `JI-01` — resolved by recognizing PostgreSQL serialization/deadlock conflicts
  (`40001`/`40P01`) and rerunning the clean full Server suite: 2 files, 12 tests
  passed. One earlier run remained a transient concurrent-sensor flake and is
  retained in the evidence history.
- `JI-02` — resolved by rerunning the focused route integration from a clean
  browser context: 4 tests passed for login, recovery/access-denied states and
  anonymous `/app` redirect.
- `JI-03` — resolved with real `browser-use` CDP evidence: separate Chrome
  profiles held Manager and Operator sessions simultaneously; local logout in
  Manager ended only that profile while Operator remained on `/app`. A fresh
  recovery session accepted the password update and global logout, observed as
  `/login`, no `sb-*` storage key, and `/auth/v1/logout?scope=global`.

## Risks and controls

| Risk | Impact | Control / evidence |
| --- | --- | --- |
| Provider session is accepted without local active access | Cross-tenant or inactive-account access | Resolve local user and derived establishment on every protected request; prove neutral `401` and no protected-data read in F3/F6. |
| Tenant selector leaks into bootstrap or target lookup | Cross-establishment data exposure | Keep provider-subject bootstrap narrow; require `establishmentId` in subsequent repository methods; prove `404` and no mutation. |
| Concurrent Manager demotions remove the last Manager | Authorization invariant violation | Serializable `IdentityDatabase.run`, bounded `40001` retry, `409` loser and persisted-state assertion. |
| Stale auth validation wins after logout/unmount | Protected UI or stale account reappears | Monotonic auth generation and mounted checks; deferred-resolution context test plus browser evidence. |
| Refreshed token is not used by REST | Intermittent `401` after refresh | Resolve session accessor per request, never freeze Axios defaults; request-header test and browser network evidence. |
| SSR serializes provider/session/account data | Secret or protected-content leak | Client-only `_authenticated` subtree, stable pending shell, HTML/source scan and direct `/app` browser inspection. |
| Seed subjects do not match local Supabase users | Real browser validation cannot authenticate | In `dev`/`stg`, `db:seed` uses the server-only service-role key to reset only the fixed Auth users, verifies their UUIDs/password, then repopulates application data. |
| UI drifts from Pencil/tokens or fails narrow/keyboard use | Product and accessibility regression | Pencil MCP node inspection, token mapping, layout-problem inspection, 320px viewport and keyboard evidence. |
| Generated route/migration artifacts are stale | Incorrect runtime graph or schema delivery | Run canonical generation commands and review generated diffs before marking the phase verified. |

## Active findings

These findings are recorded at Plan creation. They do not change the Spec
Contract, and no source or global rule is silently rewritten to hide them.

### FIND-001 — Legacy profile names in generic web rules

- **Status:** `accepted`, non-blocking documentation drift; no feature change is required.
- **Evidence:** `documentation/rules/ui-layer-rules.md` and
  `documentation/rules/widget-testing-rules.md` still describe
  `CollaboratorProfile.Attendant`/HMS navigation, while Spec revision 16 and the
  Identity PRD require fixed `UserProfile.Manager`/`UserProfile.Operator`.
- **Impact:** applying the generic sidebar rule literally would introduce the
  wrong domain vocabulary or placeholder profile behavior.
- **Resolution:** The Identity Spec/Core `UserProfile` remains the feature
  contract, role-specific navigation remains absent in this slice, and no HMS
  profile adapter was invented.

### FIND-002 — Legacy seed requirements conflict with the Spec

- **Status:** `resolved` by Spec revision 17 and the final implementation.
- **Evidence:** `documentation/rules/database-layer-rules.md` contains legacy
  `HMS_*` seed/password requirements, while Spec revision 16 requires
  the fixed Manager and Operator Supabase UUID subjects and password. The
  server-only service-role key is read from the main `EnvProvider` only for the
  dev/staging Auth reset and never crosses the browser or request-auth boundary.
- **Impact:** following both documents literally would violate the Spec's secret
  boundary and make the development seed unsafe or unusable.
- **Resolution:** The feature-specific seed boundary is recorded in
  `evaluation.md`; execution remains restricted to `dev`/`stg` and unrelated
  Auth users are not deleted.

### FIND-003 — No Confluence PRD URL or Jira ticket supplied

- **Status:** `active`, metadata-only and non-blocking.
- **Evidence:** Spec revision 16 references the local Identity PRD and GitHub Issue
  #1; it contains no Confluence URL and no `jira_tickets` key.
- **Impact:** the Plan cannot populate the optional `prd` Confluence field or
  invent Jira traceability.
- **Next action:** keep `prd` and `jira_tickets` absent from this Plan, preserve
  the local PRD path as a contextual evidence reference only, and add external
  links only when supplied by the user or connected system.

## Attempts and ledger protocol

| Attempt | Date | Action | Result | Next action |
| --- | --- | --- | --- | --- |
| 01 | 2026-08-11 | Read Spec revision 16, Rules router, Architecture, Modules, Identity PRD, Design, Tooling, applicable Core/REST/DB/Provision/UI/Router/testing rules and current workspace state. | No existing Plan was present. F1–F6 ledger created with initial statuses and three explicit findings. | Run `implement-plan` after resolving FIND-001/FIND-002 at the Orchestrator boundary. |
| 02 | 2026-08-11 | Reworked execution topology after confirming that Server and Web depend on stable Core contracts, not on each other's implementation. | Added parallel waves `Server F2 || Web F4` and `Server F3 || Web F5`, with an Orchestrator-owned dependency/lockfile join before Wave 2 and an integrated F6 join. | Spawn sibling Builders only for non-overlapping lanes in the same task; join for real server/web/browser evidence. |
| 03 | 2026-08-12 | Implemented F1 Core contracts and Identity business rules with a dedicated Builder, then repeated the Core sensors locally. | F1 accepted: Core checks passed, 14 use-case tests passed, and the Core import scan found no provider/framework infrastructure. | Start sibling Builders for F2 Server and F4 Web in parallel. |
| 04 | 2026-08-12 | Started sibling Builders for F2 Server and F4 Web after coordinating `@supabase/supabase-js` and the shared lockfile. | Both lanes are implementing against the accepted Core contracts with disjoint application ownership. | Wait for both Builders, review diffs, then run Wave 2 sensors and advance to F3/F5. |
| 05 | 2026-08-12 | Started sibling Builders for F3 Server and F5 Web after accepting F2/F4 sensors. | Server authorization/REST and Web routes/UI are now progressing in parallel; integration is deferred to F6. | Review both lanes, run F3/F5 sensors, then join for real HTTP/browser validation. |
| 06 | 2026-08-12 | Repeated Wave 3 sensors after correcting the session route path and making EnvProvider observe the Testcontainer database URL. | F3 HTTP suites passed: 2 files, 12 tests. F5 route generation, web static checks, types and Vitest passed; only pre-existing CSS warnings remain. | Start F6 integrated services, Pencil inspection, browser-use manual flows and final quality gate. |
| 07 | 2026-08-12 | Completed F6 integration: inspected all seven Pencil frames, ran local Supabase/Server/Web flows through browser-use CDP, fixed standalone seeder metadata/bootstrap and parallel Testcontainers configuration isolation, then reran sensors and builds. | Real login/reload/logout, recovery, protected-route, keyboard and 320px evidence passed; all integrated checks, 5 automated browser tests, builds and scans passed; temporary local Auth/Identity data was removed. | Create the single final read-only Judge, then conclude the Spec. |
| 08 | 2026-08-12 | Final Judge failed F6 with JI-01 concurrency, JI-02 automated protected-route evidence, and JI-03 incomplete two-session/valid-reset evidence. | F6 reopened; no new Judge is created. | Run a scoped Builder Fix, repair or stabilize only invalidated sensors, extend browser-use evidence, and reuse the same Judge. |
| 09 | 2026-08-12 | Applied the scoped F6 repair: PostgreSQL retry classification now includes serialization and deadlock conflicts; recovery redirect intent is retained across SSR/hydration and provider event races; clean server/web processes were used for reruns. | Full Server suite passed on the clean rerun (2 files, 12 tests); focused automated route integration passed 4 tests; real browser-use reset/global logout and isolated Manager/Operator sessions passed; Web build, type checks and Pencil evidence passed. | Reuse the existing final Judge against this evidence package; do not create a second Judge. |
| 10 | 2026-08-12 | Reused the same final Judge and ran the `conclude-spec` Quality Gate/build. | Judge accepted CA-01–CA-18 with no blocking findings; format, workspace checks, tests, builds and diff checks passed or were classified as no-op/pre-existing warnings. | Reopen the closing evidence for the post-completion amendments before final conclusion. |
| 11 | 2026-08-12 | Applied the post-completion amendments: deterministic Auth reset through `EnvProvider`, password visibility controls, nested serialization-conflict mapping, and stronger identity route assertions. | Core 14 tests, Server 12 tests, Web 33 unit tests, 8 route integration tests, full build, `db:seed`, Browser-use mouse/keyboard validation and `git diff --check` passed. Final Judge accepted revision 16 plus the working-tree amendments with no blocking findings. | Mark Spec revision 17 and Plan accepted; no commit/PR created because external delivery was not authorized. |

The Orchestrator is the only role that updates this Plan. Builders change only
their assigned implementation paths; Judges are read-only. Each failure must be
recorded here immediately with the phase/task, sensor, evidence, impact, retry
scope and next action. Reopen only the affected tasks and rerun invalidated
sensors.

## Handoff

1. Keep the reconciled FIND-001 and FIND-002 decisions in force under Spec
   revision 17; the service-role key is server-only and seed execution remains
   restricted to `dev`/`stg`.
2. Keep `evaluation.md` as the formal evidence/verdict record; keep this file as
   the operational ledger and keep `spec.md` focused on Contract and acceptance
   criteria.
3. No implementation or validation action remains. The final Judge, Quality Gate
   and documentation alignment are complete; no commit or PR was created because
   external delivery was not authorized.
