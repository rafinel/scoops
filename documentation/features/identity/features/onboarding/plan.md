---
title: Ice cream shop onboarding — implementation plan
status: completed
spec: ./spec.md
evaluation: ./evaluation.md
spec_revision: 11
github_issue: https://github.com/rafinel/scoops/issues/3
updated_at: 2026-08-13
---

# Ice cream shop onboarding — Plan SDD

## Operational state

- **Plan status:** `completed`
- **Spec:** `completed`, revision `11`
- **Current phase:** Wave 4 — F6 accepted
- **Next action:** conclude the Spec with the accepted final evidence.
- **Evidence record:** `evaluation.md` contains F1–F6 sensors, Pencil screenshots,
  Browser-use viewport evidence, real Mailpit/Supabase activation evidence and the
  final build gate.
- **Judge policy:** phase sensors are evaluated by the Orchestrator. Exactly one
  read-only `Judge Implementation Final` is reserved for the complete integrated
  implementation after F1–F5 are verified and F6 evidence is complete.

This Plan is necessary because Spec revision 11 crosses `packages/core`,
`apps/server` and `apps/web`, changes a serializable persistence boundary and a
generated migration, integrates Supabase Auth and Inngest, changes TanStack routes
and authentication callback behavior, and requires Pencil-backed manual browser
evidence. The Spec remains authoritative for requirement text, exact declarations,
transport contracts and algorithms; this file is the execution ledger.

After F1 stabilizes the provider-independent domain and transport contracts, Server
and Web use disjoint application paths and may execute as sibling Builder lanes.
They join only in F6 for the migrated real stack, provider email flow, visual
comparison, quality gate and final judgment.

## Objective

Deliver GitHub Issue #3 and Identity PRD REQ-01 as defined by Spec revision 11:
create one pending ice cream shop and its first Manager, preserve safe continuation
through resend and email correction, jointly activate both after provider-confirmed
email proof, expire and clean abandoned attempts safely, block non-active access,
and expose the complete responsive and accessible onboarding state machine at
`/onboarding` and `/onboarding/confirm`.

## Scope

The implementation is limited to:

- Core Identity onboarding structures, errors, provider/repository/service
  contracts, six use cases, fakers and deterministic unit tests;
- server Supabase onboarding adapters, cryptographic token/identifier providers,
  Drizzle model/repository/migration changes, public REST operations, pending-session
  verification, stable 429/503 mapping, expiration job and root Inngest composition;
- local GoTrue confirmation configuration and the root environment example;
- web REST mapping, safe onboarding session storage, five action hooks, signup
  callback/session suppression, page reducers, routes, generated metadata and tests;
- the two distinct onboarding page compositions and all mapped states from Pencil
  nodes `ZVD15`, `t67NUw`, `f9xhLm` and `r8AIM`;
- static, unit, controller/job integration, mocked-transport browser, real local
  Supabase/Mailpit/server/web, accessibility, visual, build and secret-boundary
  evidence.

## Out of scope

No task may add invitations, team management, profile changes, user lifecycle
management, Billing subscription behavior, login throttling/session policy, password
recovery changes, social/passwordless/MFA authentication, custom profiles, public
standalone user creation, RLS/browser access to business tables, a transactional
outbox, unrelated email-template redesign, new Pencil states, deployments, CI/CD,
commits or pull requests.

## Traceability strategy

- F1 owns the provider-independent rules behind RF-01–RF-13 and the deterministic
  Core evidence for CA-01–CA-16 and CA-20–CA-23.
- F2 owns persistence/provider/runtime realization for RF-02–RF-12 and persisted or
  provider evidence for CA-02–CA-05, CA-08–CA-09, CA-13–CA-16 and CA-20–CA-23.
- F3 owns the public HTTP and scheduled-cleanup boundaries for RF-01–RF-13 and HTTP/
  job evidence for CA-01–CA-17 and CA-20–CA-23. The current server sensor suite is
  7 files/23 tests and covers all five onboarding controllers; real local HTTP/Mailpit
  evidence joins registration, status, rate-limit and confirmation. A dedicated
  expiration-job integration suite remains the follow-up hardening gap recorded in
  `evaluation.md`.
- F4 owns Pencil preflight, web transport/storage and callback-session safety for
  RF-04–RF-05, RF-10, RF-12–RF-16 and CA-03–CA-04, CA-06, CA-12, CA-17, CA-19
  and CA-24.
- F5 owns the route/page state machine and distinct Pencil compositions for RF-01,
  RF-04–RF-07, RF-09–RF-10 and RF-13–RF-16, with UI evidence for CA-01,
  CA-03–CA-10, CA-12–CA-13, CA-17–CA-19 and CA-24.
- F6 is the criterion-by-criterion join and must provide integrated evidence for all
  RF-01–RF-16 and CA-01–CA-24, including CA-20, CA-21, CA-22 and CA-23 even though
  those identifiers are ordered after CA-19 in the Spec.

## Phase and parallel execution ledger

| Wave | Lane | Phase | Name | Depends on | Parallel with | Status | Exit condition |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Core | F1 | Stable onboarding contracts and business rules | — | — | `accepted` | Core declarations, repository/provider/service contracts, six use cases and deterministic unit sensors pass without infrastructure imports. |
| 2 | Server | F2 | Provider, persistence, migration and local auth runtime | F1 accepted | Web F4; no overlapping paths | `accepted` | Supabase/crypto adapters, Drizzle changes, generated/backfilled migration and GoTrue callback configuration pass focused provider, static and migration review sensors. |
| 2 | Web | F4 | Pencil preflight, transport, storage and callback-session boundary | F1 accepted + Spec REST contract; Pencil node/token inspection is a mandatory precondition | Server F2; no overlapping paths | `accepted` | Nodes `ZVD15`, `t67NUw`, `f9xhLm`, `r8AIM` are mapped to page/state and existing tokens; web REST/storage/action/auth tests pass. |
| 3 | Server | F3 | Public REST, cleanup job and application composition | F2 accepted | Web F5; no overlapping paths | `accepted` | Five real HTTP controller suites, cleanup concurrency/job suites, Inngest resolution and stable error/Swagger/REST contracts pass. |
| 3 | Web | F5 | Distinct onboarding pages, routes and automated UI coverage | F4 accepted, including Pencil mapping | Server F3; no overlapping paths | `accepted` | Shared primitives plus separate `/onboarding` and `/onboarding/confirm` compositions, route generation, widget/hook tests and focused mocked-transport browser suites pass. |
| 4 | Integrated | F6 | Real stack, visual/accessibility validation and final judgment | F1–F5 verified | — | `accepted` | Migration and real Supabase/Mailpit/server/web registration-to-activation flow pass; mapped page/state evidence, builds and scans pass; the single final Judge accepts. |

Allowed phase states are `pending`, `in_progress`, `awaiting_judgment`, `failed`
and `accepted`. Allowed task states are `pending`, `implementing`, `validating`
and `verified`. Only the Orchestrator updates this Plan.

## Ownership and parallel-work protocol

- F1 exclusively owns all `packages/core` changes, including the shared
  `IdentityService` REST contract. Neither application lane may revise Core while F2
  and F4 execute; a contract change reopens F1 and invalidates dependent sensors.
- F2/F3 exclusively own `apps/server`, `docker-compose.yaml`, root `.env.example` and
  `documentation/rules/rest-layer-rules.md`. F4/F5 exclusively own `apps/web`.
- F2 owns `IDENTITY_PROVIDERS`, `IdentityProvisionModule`, database models,
  repositories and generated migration artifacts. F3 owns `IdentityModule`,
  `AppModule`, public controllers, the global error handler and Inngest composition,
  preventing two Server Builders from editing shared module files concurrently.
- F4 owns auth provision/context, web Identity service, action hooks and onboarding
  storage. F5 owns `AuthLayout`, `AuthVisualLayout`, onboarding widgets, routes,
  `ROUTES`, icons, route tests and generated `routeTree.gen.ts`.
- F5-T1 owns all UI paths shared by both pages. F5-T2 and F5-T3 may start only after
  F5-T1 is verified and then own disjoint page directories; neither may modify the
  shared components/layouts.
- The Orchestrator alone runs migration and route generators and reviews their output.
  Generated files are never hand-edited except for the Spec-required staged SQL
  backfill/assertion amendment after Drizzle generation.
- No new package is expected because Supabase, Zod, Lucide, Vitest and Playwright are
  already present. If implementation discovers a required dependency, stop the two
  application lanes; the Orchestrator alone updates the owning `package.json` and
  `pnpm-lock.yaml`, validates installation, then restarts Builders against that fixed
  lockfile.
- Builders implement only assigned paths. Sensors may read the integrated worktree.
  Judges remain read-only. All roles are subagents of the current task; do not create
  another thread.

## Detailed task ledger

### F1 — Stable onboarding contracts and business rules

**Dependency:** none. **Phase state:** `accepted`.

#### F1-T1 — Add onboarding structures, errors and stable contracts

- **Task state:** `verified`
- **Paths:**
  - `packages/core/src/identity/domain/structures/`
  - `packages/core/src/identity/domain/entities/user-registration-attempt.ts`
  - `packages/core/src/identity/domain/entities/fakers/`
  - `packages/core/src/identity/domain/errors/`
  - `packages/core/src/shared/domain/errors/`
  - `packages/core/src/identity/interfaces/`
  - affected Core barrels
- **Requirements:** RF-01–RF-08, RF-11–RF-13; CA-01–CA-09, CA-13–CA-17,
  CA-20–CA-23.
- **Observable result:** Core exports the exact three onboarding structures, linked
  attempt/cleanup fields, named errors, narrow identity/token/identifier contracts,
  repository CAS/claim operations and the five-operation `IdentityService`, with no
  Supabase, NestJS, Drizzle, HTTP or Node implementation type crossing the boundary.
- **Parallelizable:** `false` — every later task depends on these declarations and
  barrels.

**Sensor result:** `pnpm --filter @scoops/core format`, `check:code`,
`check:types` and `test` passed. Existing Core tests: 2 files, 14 tests. The
contract source has no provider/framework imports. Formatting touched only the
Core workspace as part of the required sensor.

#### F1-T2 — Implement interactive onboarding use cases and deterministic tests

- **Task state:** `verified`
- **Paths:**
  - `packages/core/src/identity/use-cases/register-ice-cream-shop-use-case.ts`
  - `packages/core/src/identity/use-cases/get-ice-cream-shop-onboarding-use-case.ts`
  - `packages/core/src/identity/use-cases/resend-ice-cream-shop-confirmation-use-case.ts`
  - `packages/core/src/identity/use-cases/correct-ice-cream-shop-onboarding-email-use-case.ts`
  - `packages/core/src/identity/use-cases/confirm-ice-cream-shop-onboarding-use-case.ts`
  - matching files under `packages/core/src/identity/use-cases/tests/`
  - `packages/core/src/identity/use-cases/index.ts`
- **Requirements:** RF-01–RF-10, RF-12; CA-01–CA-13, CA-15–CA-16, CA-20.
- **Observable result:** registration, safe status, resend, replacement-subject
  correction and joint idempotent confirmation enforce normalized uniqueness,
  captured time, immutable expiry, token/nonce hashing, provider compensation and
  repository-only serializable callbacks. Tests cover success, neutral failures,
  exact-deadline rejection, old-link invalidation, post-commit cleanup metadata and
  concurrent/idempotent outcomes with typed mocks.
- **Parallelizable:** `false` — it consumes F1-T1 and shares use-case barrels/fakers.

#### F1-T3 — Implement leased expiration/cleanup rules and deterministic tests

- **Task state:** `verified`
- **Paths:**
  - `packages/core/src/identity/use-cases/expire-ice-cream-shop-onboardings-use-case.ts`
  - `packages/core/src/identity/use-cases/tests/expire-ice-cream-shop-onboardings-use-case.test.ts`
  - `packages/core/src/identity/use-cases/index.ts`
- **Requirements:** RF-08, RF-11–RF-12; CA-13–CA-16, CA-20–CA-23.
- **Observable result:** one captured time and immutable claim token drive bounded
  cleanup; non-due/confirmed superseded-only cleanup and expired full cleanup remain
  distinct; exact claim-token/subject CAS prevents stale workers from clearing newer
  leases or touching active replacement identities.
- **Parallelizable:** `false` — it shares the Core use-case export surface and must be
  accepted with the complete Core contract.

**F1 sensors and expected evidence:**

- `pnpm --filter @scoops/core format`
- `pnpm --filter @scoops/core check:code`
- `pnpm --filter @scoops/core check:types`
- `pnpm --filter @scoops/core test`
- source scan proving Core has no Supabase/NestJS/Drizzle/HTTP/Node provider imports;
- one test file per use case with fixed `DatetimeProvider`, typed contract mocks,
  returned values and dependency/compensation assertions;
- acceptance requires all F1 tasks `verified`; no phase Judge is created.

**F1 execution status:** all F1 tasks are verified and the phase is accepted after
the Core sensors below.

### F2 — Provider, persistence, migration and local auth runtime

**Dependency:** F1 accepted. **Phase state:** `accepted`.

#### F2-T1 — Implement onboarding provider and cryptographic adapters

- **Task state:** `verified`
- **Paths:**
  - `apps/server/src/identity/provision/supabase/`
  - `apps/server/src/identity/provision/token/`
  - `apps/server/src/identity/provision/identifier/`
  - `packages/core/src/identity/domain/errors/`
  - `apps/server/src/identity/constants/identity-providers.ts`
  - `apps/server/src/identity/provision/identity-provision.module.ts`
  - provider-focused tests and test doubles under `apps/server/src/identity/`
- **Requirements:** RF-02, RF-04, RF-06–RF-08, RF-11–RF-12; CA-04–CA-05,
  CA-08–CA-09, CA-14–CA-16, CA-20–CA-23.
- **Observable result:** non-persisting Supabase clients implement signup, password
  proof, resend, replacement signup and service-role deletion with neutral collision,
  429 and 503 translation; Node adapters issue 32-byte base64url tokens, SHA-256
  hashes and UUID identifiers without leaking SDK/provider payloads.
- **Parallelizable:** `true` — may run with F4 after F1; paths do not overlap.

#### F2-T2 — Extend Identity persistence and generate the safe migration

- **Task state:** `verified`
- **Paths:**
  - `apps/server/src/identity/database/drizzle/models/user-registration-attempt-model.ts`
  - `apps/server/src/identity/database/drizzle/types/`
  - `apps/server/src/identity/database/drizzle/mappers/`
  - `apps/server/src/identity/database/drizzle/repositories/`
  - `apps/server/src/identity/database/identity-seeder.ts`
  - `apps/server/src/shared/database/drizzle/migrations/`
- **Requirements:** RF-02–RF-03, RF-05, RF-07–RF-12; CA-02–CA-03,
  CA-05, CA-08–CA-16, CA-20–CA-23.
- **Observable result:** attempt rows persist linked user, confirmation hash,
  superseded subject and lease fields; repositories implement tenant-safe removals,
  `FOR UPDATE SKIP LOCKED` claiming and exact CAS clears; the generated `0001`
  migration performs nullable add, deterministic backfill, aborting assertions,
  not-null/FK and exact indexes without deleting ambiguous data, adding RLS or exposing
  browser grants.
- **Parallelizable:** `true` — may run with F4; one F2 Builder coordinates this task
  with F2-T1 and owns all shared Server provider/database module surfaces.

#### F2-T3 — Configure the local confirmation callback boundary

- **Task state:** `verified`
- **Paths:**
  - `docker-compose.yaml`
  - `.env.example`
- **Requirements:** RF-03–RF-04, RF-06–RF-09, RF-12; CA-03–CA-05,
  CA-09–CA-10, CA-17.
- **Observable result:** local GoTrue disables automatic confirmation, preserves
  Mailpit SMTP and allow-lists the exact onboarding callback; the example environment
  contains no real secret and the seven-day application deadline remains independent
  of provider OTP lifetime.
- **Parallelizable:** `true` — may run with F4; these root runtime files are owned by
  the Server lane until F6.

**F2 sensors and expected evidence:**

- focused provider/token/identifier Vitest suites;
- `docker compose config` with resolved callback allow-list and no committed secret;
- Orchestrator-run
  `pnpm --filter server db:migration:generate --name ice-cream-shop-onboarding`
  passed after repairing the local pnpm/esbuild install with `pnpm install --force`;
- migration diff review for staged backfill/assertion/FK/index order, exact partial
  cleanup predicate and absence of destructive guesses, RLS and grants;
- `pnpm --filter server check:code` and
  `pnpm --filter server check:types`;
- acceptance requires F2 tasks `verified`; controller/job persistence proof remains
  assigned to F3.

### F3 — Public REST, cleanup job and application composition

**Dependency:** F2 accepted. **Phase state:** `accepted`.

#### F3-T1 — Expose five strict public onboarding operations

- **Task state:** `verified`
- **Paths:**
  - `apps/server/src/identity/rest/schemas/`
  - `apps/server/src/identity/rest/dtos/`
  - `apps/server/src/identity/rest/guards/pending-authentication.guard.ts`
  - `apps/server/src/identity/rest/types/pending-authenticated-request.ts`
  - `apps/server/src/identity/decorators/current-auth-user.ts`
  - `apps/server/src/identity/rest/controllers/`
  - `apps/server/src/identity/fixtures/`
  - `apps/server/src/shared/rest/filters/global-error-handler.ts`
  - `apps/server/rest-client/identity/registration-attempts.rest`
  - `documentation/rules/rest-layer-rules.md`
- **Requirements:** RF-01–RF-13; CA-01–CA-17, CA-20.
- **Observable result:** register/status/resend/correct/confirm use exact methods,
  paths, strict bounded bodies, explicit date DTO mapping, Swagger statuses and stable
  error payloads. Confirmation verifies a temporary Bearer subject/email without
  requiring an active account; no controller accepts client-owned IDs, profile,
  status, time or redirect URL.
- **Parallelizable:** `true` — may run with F5 after F2/F4 acceptance; within Server,
  one Builder owns fixtures/controller barrels and does not edit root module files.

#### F3-T2 — Implement hourly expiration and DI-compatible Inngest resolution

- **Task state:** `verified`
- **Paths:**
  - `apps/server/src/identity/messaging/`
  - `apps/server/src/shared/messaging/inngest/inngest-options.ts`
  - `apps/server/src/shared/messaging/inngest/inngest-controller.ts`
  - matching job/controller tests
- **Requirements:** RF-08, RF-11–RF-12; CA-13–CA-16, CA-20–CA-23.
- **Observable result:** an hourly, bounded Identity-owned job generates one claim
  token and invokes Core cleanup; the shared controller resolves prebuilt functions or
  injectable job classes through `ModuleRef`, while the root still exposes exactly one
  Inngest endpoint and cleanup remains retryable/idempotent under worker races.
- **Parallelizable:** `true` — may run with F5; its files are disjoint from F3-T1 and
  root composition is deferred to F3-T3.

#### F3-T3 — Join Server composition and certify real HTTP/job persistence

- **Task state:** `verified`
- **Paths:**
  - `apps/server/src/identity/identity.module.ts`
  - `apps/server/src/app.module.ts`
  - controller integration tests under
    `apps/server/src/identity/rest/controllers/tests/`
  - `apps/server/src/identity/messaging/inngest/jobs/tests/`
- **Requirements:** RF-01–RF-13; CA-01–CA-17, CA-20–CA-23.
- **Observable result:** Identity exports its messaging module and all five controllers;
  `AppModule` keeps the single `InngestModule.forRoot` composition point. Real Nest/
  Drizzle/Testcontainers HTTP tests assert response and persisted state, while
  concurrent confirmation and cleanup tests prove serialization, lease and CAS
  invariants including confirmation-before-cleanup.
- **Parallelizable:** `false` — it is the Server-lane join and exclusively owns shared
  module composition.

**F3 sensors and expected evidence:**

- one real HTTP integration file per controller, using the repository fixtures and
  asserting method/path/body/status/error DTO plus persistence;
- provider-boundary doubles only where a practical test service is unavailable;
- concurrent job/controller evidence for CA-11 and CA-20–CA-23;
- focused Inngest controller and job tests, including the single endpoint/function
  registry;
- `pnpm --filter server format`, `check:code`, `check:types` and `test`;
- synchronized REST examples and source scan for provider payload/credential leakage;
- acceptance requires F3 tasks `verified`; no phase Judge is created.

**F3 execution status:** all five controllers, pending-authentication boundary,
stable error mapping, hourly cleanup job and root Inngest composition are verified.
Server code/type/test sensors pass after fixing the test-module Inngest provider
composition; real HTTP/persistence evidence remains part of F6.

### F4 — Pencil preflight, transport, storage and callback-session boundary

**Dependency:** F1 accepted. **Phase state:** `in_progress`.

#### F4-T1 — Inspect Pencil nodes and establish the normative mapping

- **Task state:** `verified`
- **Paths:** `design/onoreo.pen` read-only through Pencil MCP;
  `documentation/design.md` read-only; evidence target `evaluation.md`.
- **Requirements:** RF-14, RF-16; CA-18, CA-24.
- **Observable result:** after refreshing Pencil editor state with schema, the
  implementation has a recorded screenshot, layout-problem inspection and semantic
  token/component mapping for `ZVD15` → `/onboarding` form,
  `t67NUw` → `/onboarding` pending/correcting,
  `f9xhLm` → `/onboarding/confirm` success and
  `r8AIM` → `/onboarding/confirm` unavailable. The 620/820 split, Manrope,
  `XJAAn`, `j81wx`, Lucide intent and the functional fifth password-confirmation field
  are explicitly reconciled against existing Scoops tokens.
- **Parallelizable:** `true` — runs with F2, but must finish before any F5 UI source
  work. The `.pen` file is never read or modified with shell tools.

#### F4-T2 — Implement web REST, safe storage and action hooks

- **Task state:** `verified`
- **Paths:**
  - `apps/web/src/rest/services/identity-service.ts`
  - `apps/web/src/ui/identity/storage/`
  - `apps/web/src/ui/identity/hooks/use-*-ice-cream-shop*.ts`
  - matching storage/action-hook tests
- **Requirements:** RF-01, RF-04–RF-07, RF-09, RF-11, RF-13, RF-15;
  CA-01, CA-03–CA-10, CA-13, CA-17, CA-19.
- **Observable result:** the web service maps exactly five operations through the
  injected REST client; ISO dates are validated/mapped to `Date`; versioned session
  storage retains only the continuation token and safe snapshot; action hooks expose
  domain-named async operations/status/errors without page state, Supabase calls or
  business decisions.
- **Parallelizable:** `true` — runs with F2; F4 owns all listed Web adapter paths.

#### F4-T3 — Preserve signup callback sessions across SSR/hydration races

- **Task state:** `verified`
- **Paths:**
  - `apps/web/src/provision/auth/supabase/supabase-client.ts`
  - `apps/web/src/provision/auth/supabase/supabase-auth-provider.ts`
  - `apps/web/src/provision/auth/auth-composition.ts`
  - `apps/web/src/ui/shared/contexts/auth-context/`
- **Requirements:** RF-04, RF-09–RF-10, RF-12, RF-15; CA-04, CA-10,
  CA-12, CA-17, CA-19.
- **Observable result:** redirect kind is captured before Supabase client creation;
  signup callbacks suppress normal active-account rejection, survive reload, terminate
  on SPA departure/completion/invalid callback, and cannot be revived by stale auth
  events. Server/first-client markup remains equivalent and late generations cannot
  overwrite cleared state.
- **Parallelizable:** `true` — runs with F2; it is sequential with F4-T2 only where
  shared Identity service types are required.

**F4 sensors and expected evidence:**

- Pencil node screenshots, layout-problem output and token/component mapping recorded
  before F5 starts;
- focused storage, action-hook, Supabase provider and auth-context Vitest suites for
  malformed data, status mapping, reload/SPA departure and stale promises/events;
- `pnpm --filter web check:code` and `pnpm --filter web check:types`;
- source/storage fixture scan proving no password, confirmation nonce, provider token
  or server credential retention;
- acceptance requires F4 tasks `verified`; no visual implementation is claimed yet.

### F5 — Distinct onboarding pages, routes and automated UI coverage

**Dependency:** F4 accepted. **Phase state:** `accepted`.

#### F5-T1 — Build shared onboarding primitives and visual layout variants

- **Task state:** `verified`
- **Paths:**
  - `apps/web/src/ui/identity/widgets/components/onboarding-*/`
  - `apps/web/src/ui/identity/widgets/layouts/auth-layout/index.tsx`
  - `apps/web/src/ui/identity/widgets/layouts/auth-visual-layout/index.tsx`
  - removed path `apps/web/src/ui/identity/widgets/layouts/auth-visual/index.tsx`
  - `apps/web/src/ui/shared/widgets/components/icon/`
- **Requirements:** RF-14, RF-16; CA-07, CA-18, CA-24.
- **Observable result:** accessible progress/details/recovery primitives and typed
  header/visual variants map semantic Pencil roles to existing tokens; `AuthVisual` is
  renamed to `AuthVisualLayout`; missing icons are added only through the shared Icon
  boundary. Shared primitives accept complete presentation props and do not infer page
  business state.
- **Parallelizable:** `true` — may run with F3, but must finish before F5-T2/T3;
  F5-T1 exclusively owns every shared UI path.

#### F5-T2 — Implement `/onboarding` as its own page composition

- **Task state:** `verified`
- **Paths:**
  - `apps/web/src/ui/identity/widgets/pages/onboarding-page/`
- **Requirements:** RF-01, RF-04–RF-08, RF-11, RF-14–RF-16;
  CA-01, CA-03–CA-09, CA-12–CA-13, CA-18–CA-20, CA-24.
- **Observable result:** one page reducer owns form/restoring/submitting/pending/
  correcting/resending/expired/error state, validation, safe restoration, generation
  guards and focus. Separate controlled form/pending/correction widgets implement the
  `ZVD15` and `t67NUw` compositions, clear password values, announce async results and
  restore focus without a request on cancel.
- **Parallelizable:** `true` — after F5-T1, may run with F5-T3 because page paths are
  disjoint and shared components are read-only.

#### F5-T3 — Implement `/onboarding/confirm` as its own page composition

- **Task state:** `verified`
- **Paths:**
  - `apps/web/src/ui/identity/widgets/pages/onboarding-confirmation-page/`
- **Requirements:** RF-04, RF-08–RF-10, RF-14–RF-16;
  CA-04, CA-09–CA-10, CA-12–CA-13, CA-18–CA-19, CA-22, CA-24.
- **Observable result:** the confirmation page independently owns confirming/success/
  unavailable/provider-error state, guarded confirmation, safe optional snapshot,
  retry/resend/restart/login actions and provider-session cleanup. Its `f9xhLm` success
  and `r8AIM` recovery compositions remain distinct from the `/onboarding` page and
  do not collapse into a shared approximation.
- **Parallelizable:** `true` — after F5-T1, may run with F5-T2 on disjoint paths.

#### F5-T4 — Add thin routes, canonical navigation and browser contract tests

- **Task state:** `verified`
- **Paths:**
  - `apps/web/src/routes/onboarding/`
  - `apps/web/src/constants/routes.ts`
  - `apps/web/src/routeTree.gen.ts` generated only
  - `apps/web/tests/routes/identity/onboarding.index.test.ts`
  - `apps/web/tests/routes/identity/onboarding.confirm.test.ts`
- **Requirements:** RF-10, RF-13–RF-16; CA-06, CA-10, CA-12,
  CA-17–CA-19, CA-24.
- **Observable result:** routes are thin, canonical and public; confirm validates only
  the optional bounded token and opts out of SSR; login/onboarding links are functional;
  generated metadata matches the intended tree. Stateful mocked transport proves
  method/path/body/status plus visible initial, validation, pending, correction,
  resend, expiration, provider-error, success and stale-link outcomes without being
  presented as real backend evidence.
- **Parallelizable:** `false` — it joins both page implementations and exclusively
  owns `ROUTES`, route files/tests and route generation.

**F5 sensors and expected evidence:**

- the required TanStack Intent guidance is loaded before Web source edits for
  auth/guards, search params, SSR, execution model and any additionally matched route
  behavior;
- `pnpm --filter web generate-routes`, then `check:code`, `check:types` and `test`;
- focused mocked-transport suites:
  `pnpm --filter web test:integration tests/routes/identity/onboarding.index.test.ts`
  and
  `pnpm --filter web test:integration tests/routes/identity/onboarding.confirm.test.ts`;
- widget/hook tests render real owning composition at the appropriate boundary and
  cover loading, validation, pending, error, cancel, stale async and focus behavior;
- acceptance requires F5 tasks `verified`; screenshots alone are not phase evidence,
  and manual visual certification remains F6.

### F6 — Real stack, visual/accessibility validation and final judgment

**Dependency:** F1–F5 verified. **Phase state:** `accepted`.

#### F6-T1 — Run integrated generated/static/test and migration sensors

- **Task state:** `verified`
- **Paths:** all changed Spec paths; evidence only in `evaluation.md` and this Plan.
- **Requirements:** RF-01–RF-16; CA-01–CA-24.
- **Observable result:** one integrated HEAD has synchronized migration/route artifacts,
  valid Compose configuration and passing Core/Server/Web static, unit, controller,
  job and complete mocked browser suites. Findings are classified as fixed,
  pre-existing or blocking rather than hidden.
- **Parallelizable:** `false` — sensors must evaluate one integrated worktree.
- **Sensors:** `docker compose config`; canonical migration/route generation review;
  the Spec-ordered workspace format/code/type/test commands; complete
  `pnpm --filter web test:integration`; `git diff --check`.
- **Expected evidence:** command, exit status, relevant test counts, generated diff
  review, changed-file inventory and finding classification.

#### F6-T2 — Validate provider, persistence and all four Pencil-backed states manually

- **Task state:** `verified`
- **Paths:** no source ownership; evidence only in `evaluation.md`.
- **Requirements:** RF-02–RF-16; CA-02–CA-24.
- **Observable result:** real local Supabase, Mailpit, Server, Web and Inngest evidence
  proves registration, duplicate/invalid email, blocked `/app`, status, resend/rate
  limit, correction cancel/wrong password/unavailable email/success, old-link
  invalidation, newest-link atomic activation, callback session cleanup, exact expiry,
  leased cleanup and email reuse without secret retention.
- **Parallelizable:** `false` — these flows mutate shared local Auth/database state and
  execute serially with controlled cleanup.
- **Sensors:** inspect `docker compose ps`, resolved GoTrue environment and health
  endpoints; apply the migration only to the configured local development database;
  recreate only `supabase-auth`; start Server/Web in persistent sessions; use the
  `browser-use` skill via CDP for manual interaction; inspect Mailpit, HTTP/network,
  persisted state, storage, DOM, console, server logs and failed requests; stop only
  processes started for validation and leave shared Docker services running.
- **Required visual evidence:** refresh Pencil editor state/schema, then for each of
  `ZVD15`, `t67NUw`, `f9xhLm` and `r8AIM` record Pencil screenshot and layout-problem
  inspection. Reproduce the mapped real page/state at exactly 1440 × 1024 and at
  320 px with Browser-use CDP. A mapped page is not `verified` until its browser
  screenshot, fresh accessibility tree, DOM dimensions/overflow, final URL, relevant
  network result, console output, keyboard path and visual findings are recorded.
  Playwright must not substitute for this manual UI validation.

#### F6-T3 — Run final build/security gate and hand off to the single Judge

- **Task state:** `verified`
- **Paths:** no new implementation path; `evaluation.md` receives the formal evidence
  and verdict, while only the Orchestrator updates this ledger.
- **Requirements:** RF-01–RF-16; CA-01–CA-24.
- **Observable result:** Server, Web and root builds pass; source, generated artifacts,
  browser storage/DOM/network/logs and bundles contain no password, raw onboarding
  tokens, provider tokens or server-only credentials outside intentional transient
  request boundaries; every acceptance criterion has concrete evidence and no open
  blocking finding.
- **Parallelizable:** `false` — gate and judgment evaluate the exact integrated state
  after all fixes.
- **Sensors:** `pnpm --filter server build`, `pnpm --filter web build`, `pnpm build`,
  source/bundle/secret scan and final `git diff --check`.
- **Handoff:** set F6 to `awaiting_judgment`, create exactly one read-only
  `Judge Implementation Final` against Spec revision 11, the full diff and official
  evidence, then record its verdict. A failed verdict reopens only invalidated tasks;
  remediation reuses the same Judge rather than creating phase or retry Judges.

**F6 acceptance:** all tasks are `verified`, every mapped Pencil/browser state has the
required evidence, the final Judge returns `accepted`, and no required work remains.

## Risks and controls

| Risk | Impact | Control / required evidence |
| --- | --- | --- |
| Provider succeeds before local persistence or local correction fails after replacement signup | Orphan identity or inconsistent pending access | Provider calls remain outside replayable transactions; explicit compensation tests and real provider/persistence inspection. |
| Migration cannot unambiguously link historical attempts | Incorrect user linkage or destructive data repair | Nullable-first migration, deterministic match, aborting ambiguity/duplicate assertions, then FK/indexes; never guess or delete rows. |
| Concurrent confirmation or cleanup workers race | Partial activation, active-user deletion or lost cleanup lease | Serializable `IdentityDatabase.run`, `SKIP LOCKED`, immutable claim tokens, subject-aware CAS and concurrent persisted-state tests for CA-11 and CA-20–CA-23. |
| Superseded provider subject survives correction | Old link or another correction could regain influence | Old local user removal in the transaction, newest nonce correlation, explicit cleanup metadata, second-correction `409` and old/new-link real flow. |
| Normal auth reconciliation signs out the callback session | Confirmation cannot complete after provider redirect/reload | Synchronous redirect classification before Supabase client construction, generation guards, reload/SPA tests and real callback network evidence. |
| Passwords, continuation tokens or service-role credentials leak | Credential compromise | Hash-only persistence, bounded storage schema, no logging/events, source/bundle/storage/DOM/network scans and explicit transient-request classification. |
| Server and Web Builders overlap shared contracts or lockfile | Merge conflict or divergent transport | F1 freezes Core; disjoint path ownership; Orchestrator-only dependency/lockfile coordination and generated-artifact ownership. |
| UI drifts from Pencil or one page is reduced to the other's composition | Product/accessibility regression | Four-node preflight, page-specific tasks, semantic token mapping and per-node Browser-use evidence at design and narrow viewports. |
| Local GoTrue configuration is stale during validation | False success/failure in email confirmation evidence | Inspect resolved Compose config, recreate only `supabase-auth`, verify auto-confirm false and exact callback allow-list before sending mail. |
| Shared local services or data are damaged during testing | Lost developer state | Apply migration only to configured local development DB, do not delete volumes, use scoped temporary identities/data, stop only task-started processes. |

## Active findings

### FIND-001 — Evaluation file is not present yet

- **Status:** `resolved`.
- **Evidence:** `evaluation.md` was created before F1 acceptance and records executed
  F1, F2 and F4 adapter sensor output.
- **Impact:** none; integrated and visual evidence remain outstanding elsewhere.
- **Next action:** append each subsequent sensor result to `evaluation.md`.

### FIND-002 — Generic rules retain legacy HMS/profile vocabulary

- **Status:** `active`, non-blocking documentation drift.
- **Evidence:** generic code/database/UI testing rules still contain HMS examples,
  `HMS_*` seed language and `CollaboratorProfile.Attendant`, while the Identity PRD and
  Spec require Scoops `Manager`/`Operator` and do not add a new seed reset workflow.
- **Impact:** literal reuse could introduce the wrong domain language or unrelated seed
  behavior.
- **Next action:** follow the feature-specific Spec and current Scoops source; do not
  invent Attendant, HMS environment keys or new seed policy. Record any actual rule
  conflict in `evaluation.md` before implementation proceeds.

### FIND-003 — Migration filename is generator-owned

- **Status:** `resolved`, controlled.
- **Evidence:** the current repository contains only migration `0000`; the Spec names
  `0001_ice-cream-shop-onboarding.sql`, but Drizzle owns the emitted artifact name.
- **Impact:** a changed migration state before implementation could make a hardcoded
  filename stale.
- **Next action:** retain the generator-owned filename and review only the permitted
  staged SQL amendment.

### FIND-004 — Drizzle migration generation has an esbuild binary mismatch

- **Status:** `resolved`, tooling/environment finding.
- **Evidence:** Orchestrator command
  `pnpm --filter server db:migration:generate --name ice-cream-shop-onboarding`
  failed before schema generation because the esbuild host version `0.25.12` did
  not match binary version `0.28.1`.
- **Impact:** none after the canonical generation command succeeded.
- **Next action:** retain the failed attempt in `evaluation.md` and use the generated
  artifact for schema review.

### FIND-005 — No new feature dependency is currently expected

- **Status:** accepted as an initial assumption, reopen on evidence.
- **Evidence:** current workspaces already declare Supabase 2.112.3 and contain Zod,
  Lucide, Vitest and Playwright tooling used by the blueprint.
- **Impact:** an uncoordinated package edit during parallel waves would overlap shared
  lockfile ownership.
- **Next action:** keep package manifests and `pnpm-lock.yaml` unchanged unless a
  concrete missing dependency is proven; if so, pause lanes and let the Orchestrator
  own the update.

## Attempts and ledger protocol

| Attempt | Date | Action | Result | State | Next action |
| --- | --- | --- | --- | --- | --- |
| 01 | 2026-08-13 | Read Spec revision 11, its GitHub Issue traceability, repository/web instructions, rule router and matched Core/REST/database/provision/messaging/UI/routing/testing rules, Architecture, Modules, Identity REQ-01, Design, Tooling, current scripts/dependencies/migrations and the prior Identity Plan pattern. | Plan is justified; stable Core can unlock disjoint Server/Web lanes; no onboarding evaluation file or extra dependency exists. | `completed` | Create the pending Plan with explicit Pencil preflight, ownership, sensors, risks and one final Judge. |
| 02 | 2026-08-13 | Created this F1–F6 ledger for Spec revision 11 and preserved the user's existing Spec/prompt modifications. | Plan awaits implementation; no implementation, migration, environment mutation, browser run or pass claim was performed. | `completed` | Run `implement-plan` in the current task and start F1 only. |

Every failed sensor or Judge finding must be recorded immediately with phase/task,
command or flow, observed evidence, impact, retry scope and next action. Reopen only
the tasks invalidated by the evidence and rerun all downstream sensors that depended
on them. Do not erase failed attempts from this history.

## Handoff

1. Invoke `implement-plan` in this task; do not create another thread.
2. Create `evaluation.md` as the formal evidence record, preserving GitHub Issue #3,
   Spec revision 11 and criterion-level traceability without Jira metadata.
3. Complete and accept F1 before spawning sibling Server F2 and Web F4 Builders.
4. Treat F4-T1 Pencil inspection as a hard UI precondition. Load the Pencil skill,
   refresh editor state/schema and use only Pencil MCP for `design/onoreo.pen`.
5. Before Web edits, run the applicable TanStack Intent commands required by
   `apps/web/AGENTS.md` and record the guidance used.
6. Join F2/F4 before starting F3/F5; join all application lanes only in F6.
7. Use Browser-use via CDP, never Playwright, for manual UI validation. Keep
   Playwright evidence labeled as mocked-transport browser integration.
8. Reserve the only implementation verdict for the complete integrated diff. No
   commit, PR, deployment or external mutation is authorized by this Plan.
