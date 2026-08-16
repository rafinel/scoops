---
title: Identity user management — implementation plan
status: accepted
spec: ./spec.md
evaluation: ./evaluation.md
spec_revision: 2
github_issue: https://github.com/rafinel/scoops/issues/5
updated_at: 2026-08-16
---

# Identity user management — Plan SDD

## Operational state

- **Plan status:** `accepted`
- **Spec:** `in_progress`, revision `2` (implementation accepted; formal closure requires the authorized commit/PR quality gate).
- **Source:** direct implementation of [GitHub Issue #5](https://github.com/rafinel/scoops/issues/5), represented by `spec.md`.
- **Current phase:** Wave 4 — F6 integrated validation and evidence, accepted.
- **Next action:** none for implementation; run the authorized `conclude-spec` publication flow when commit/PR authority is provided.
- **Attempts:** implementation completed through Core, Server, and Web lanes; final quality gates, canonical Browser-use validation, and Pencil MCP reconnection pass on 2026-08-16.
- **Findings active:** no blocking implementation findings. Historical rejected verdicts and their resolved findings remain in `evaluation.md`.
- **Judge policy:** no phase receives a Judge verdict. One `Judge Implementation Final` is reserved for the integrated implementation after every phase sensor and cross-workspace evidence requirement passes.

This Plan is necessary because the Spec is complete mode and crosses `packages/core`,
`apps/server` and `apps/web`; adds an immutable audit table and migration; integrates
Supabase invitation identity operations, post-commit Identity events and an existing
expiration job; introduces multiple REST routes and generated TanStack route metadata;
and requires real full-stack, responsive, accessibility and Pencil/browser evidence.
The Spec contract and acceptance criteria remain authoritative.

## Execution update

F1 Core contracts/use cases, F2 Server persistence/provider infrastructure, F4 Web
transport/auth, F3 REST/composition, and F5 routes/pages are present and their
automated quality gates pass. Real local Supabase/Mailpit and two-session status flows
also pass. The final Core, Server, Web, Browser-use and Pencil evidence gates pass. F6 is
accepted; exact current evidence and historical findings are recorded in `evaluation.md`.

## Objective

Deliver the Manager-only, tenant-safe user-management workflow from Spec revision 1:
list and inspect users; invite, correct, resend, cancel and accept invitations; promote,
demote, inactivate and reactivate users; correct another user's name; preserve immutable
audit history and authorship; publish stable Identity events after commit; and expose
the `/users`, `/users/$userId` and `/invitation/accept` experiences with profile-driven
navigation, accessible responsive states and verified transport behavior.

## Scope

The implementation is limited to the Spec scope:

- Core Identity audit entities, projections, errors, repository/provider/service contracts,
  invitation-operation coordination, Identity events and the ten use cases, including
  the existing profile use case and invitation cleanup extension;
- Identity Drizzle audit persistence, serializable transaction integration, migration,
  mapper/repository bindings and development seeder changes;
- the server Supabase user-access adapter, provider error translation, Identity REST
  schemas/DTOs/controllers, controlled test provider, job coverage and feature module
  composition;
- the web Identity REST adapter, query/action hooks, invitation-acceptance auth marker,
  profile-driven shell navigation, Users list/detail/accept routes and page widgets;
- generated `routeTree.gen.ts`, generated Drizzle migration artifacts and the web port
  correction required by the repository's canonical validation endpoint;
- Core, server controller, provider, web widget/hook and mocked-transport browser tests,
  followed by real local Supabase/Mailpit/server/web validation and final evidence.

## Out of scope

No task in this Plan may add onboarding, login/session policy, password recovery changes,
My Account editing, establishment settings/deletion, Billing, MRP, PDV, Communication
templates/jobs/notification persistence/UI, custom profiles or permissions, active-user
email changes, Manager-set passwords, provider-side instant JWT invalidation, a
transactional outbox, an establishment-wide audit explorer, mobile Pencil frames,
deployment, CI/CD, commits or pull requests. Communication remains a future consumer of
the stable Identity event handoff; this Plan must not modify `AppModule` or Communication
business files for that purpose.

## Traceability strategy

- **F1** owns RF-01–RF-12 and CA-01, CA-03–CA-12 at the framework-independent contract
  and use-case boundary. It also establishes the exact event, repository, provider and
  service shapes consumed by both application lanes.
- **F2** owns the Server persistence/provider realization of RF-03–RF-12 and the
  persisted/provider portions of CA-03–CA-12. It must leave the Spec-defined REST
  transport and stable Core contracts unchanged for the Web lane.
- **F4** owns Pencil preflight, web transport, query/action hooks and invitation-session
  integration for RF-13–RF-14 and CA-02, CA-07, CA-12–CA-14. It may use the Spec contract
  and F1 exports without waiting for the Server implementation because its transport is
  mocked at this stage.
- **F3** owns the Server REST, cleanup-job and module-composition boundary for RF-01–RF-12
  and CA-01, CA-03–CA-12. Controller tests must prove real Nest/Drizzle persistence and
  HTTP error mapping rather than direct controller or repository calls.
- **F5** owns routes, shell navigation and the three distinct UI page compositions for
  RF-01, RF-02, RF-04–RF-10 and RF-13–RF-14, with automated evidence for CA-02,
  CA-05, CA-07–CA-11 and CA-13–CA-14. Separate pages remain separate compositions even
  where widgets share tokens or primitives.
- **F6** joins F1–F5 and must provide criterion-by-criterion evidence for RF-01–RF-14
  and CA-01–CA-14, including real provider behavior, two-session inactivation, stale/
  expired/used invitation paths, visual comparison and browser accessibility findings.

## Phase and parallel execution ledger

| Wave | Lane | Phase | Name | Depends on | Parallel with | Status | Exit condition |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Core | F1 | Stable Identity user-management contracts and business rules | — | — | `accepted` | Exact Core exports, concurrency contracts, use cases, fakers and deterministic unit sensors pass without framework or infrastructure imports. |
| 2 | Server | F2 | Audit persistence, invitation provider and transaction infrastructure | F1 accepted; Spec REST contract stable | **Web F4**; no overlapping paths; Orchestrator coordinates any package/lockfile change first | `accepted` | Drizzle models/repositories, generated migration, seeder, Supabase adapter and provider tests are wired and static/migration sensors pass. |
| 2 | Web | F4 | Pencil preflight, REST transport, query/action hooks and auth boundary | F1 accepted; Spec REST contract stable; Pencil node/token inspection complete | **Server F2**; no overlapping paths; Orchestrator coordinates any package/lockfile change first | `accepted` | All mapped Pencil nodes/states are recorded, REST/query/action contracts and invitation-session auth tests pass, and Web is ready for route/page builders. |
| 3 | Server | F3 | Identity REST controllers, expiry job and server composition | F2 accepted | **Web F5**; no overlapping paths | `accepted` | One real integration suite per action, cleanup-job coverage, module bindings, Swagger/error matrix and REST examples pass. |
| 3 | Web | F5 | Users routes, shell navigation and distinct page compositions | F4 accepted, including Pencil mapping | **Server F3**; no overlapping paths; generated route tree owned by Orchestrator | `accepted` | `/users`, `/users/$userId` and `/invitation/accept` render through protected/public route boundaries, widget/hook tests pass, and mocked-transport route suites pass. |
| 4 | Integrated | F6 | Full-stack, visual/accessibility validation and final judgment | F1–F5 verified | — | `accepted` | Real local stack, persistence/provider flows, generated artifacts, builds, Browser-use/Pencil evidence and the single final Judge all pass. |

Allowed phase states are `pending`, `in_progress`, `awaiting_judgment`, `failed` and
`accepted`. Allowed task states are `pending`, `implementing`, `validating` and
`verified`. Only the Orchestrator updates this Plan; Builders implement assigned paths,
sensors validate, and the final Judge is read-only over the complete implementation.

## Ownership and parallel-work protocol

- **F1 Core ownership:** F1 exclusively owns all `packages/core` changes, including
  `IdentityService`, repository/provider contracts, event payloads and Core barrels.
  Neither application lane may revise a Core contract while F2/F4 are active. A contract
  change reopens F1 and invalidates dependent sensors.
- **F2/F3 Server ownership:** the Server lane exclusively owns `apps/server` and the
  server REST client. F2 owns audit persistence, generated migration artifacts, provider
  adapter, provider tokens and the Identity database/provision bindings. F3 owns REST
  schemas/DTOs/controllers/fixtures, expiry messaging job, Identity root composition and
  controller integration tests. No Server Builder edits Web or Core paths.
- **F4/F5 Web ownership:** the Web lane exclusively owns `apps/web`. F4 owns the REST
  adapter, REST context additions, feature query/action hooks, Supabase invitation
  session behavior and `apps/web/package.json` port correction. F5 owns route constants,
  route files, sidebar/layout integration, page-local hooks/widgets and route tests.
- **Shared Web path ownership:** F5 owns `apps/web/src/routeTree.gen.ts` only through the
  Orchestrator-run route generator; it is never hand-edited. F4 owns auth-context shared
  types/provider changes; F5 may consume them but does not modify those files. F5-T1 owns
  shell/navigation paths; F5-T2 owns the Users list and invitation-accept page trees;
  F5-T3 owns the user-details page tree. No two builders edit one path concurrently.
- **Generated artifacts:** the Orchestrator alone runs
  `pnpm --filter server db:migration:generate` and
  `pnpm --filter web generate-routes`, reviews the generated diff and records the exact
  output in the phase evidence. Generated files are read-only to Builders.
- **Dependencies and lockfile:** no new package is expected from the Spec. If a package
  is discovered to be necessary, the Orchestrator pauses both application lanes, updates
  only the owning `package.json`, runs pnpm installation, validates and commits the
  resulting lockfile change to the coordinated baseline before Builders resume.
- **Documentation alignment:** no PRD business rule changes are planned. If implementation
  reveals a product-rule discrepancy, stop the affected phase and amend the Spec and the
  owning PRD before changing behavior.
- **Validation roles:** controller tests use real Nest/Drizzle/Testcontainer wiring;
  Core tests remain infrastructure-free; Web unit tests render the real owning page
  composition where behavior crosses a hook boundary; mocked-transport browser tests
  prove route/UI/REST mapping only; manual UI validation uses Browser-use via CDP, never
  Playwright.

## Detailed task ledger

### F1 — Stable Identity user-management contracts and business rules

**Dependency:** none. **Phase state:** `accepted`.

#### F1-T1 — Add audit, projection, invitation-operation, provider and event contracts

- **Task state:** `verified`
- **Paths:**
  - `packages/core/src/identity/domain/entities/user-audit-record.ts`
  - `packages/core/src/identity/domain/structures/{user-audit-action,user-audit-actor-type,user-summary,user-details,invitation-operation}.ts`
  - `packages/core/src/identity/domain/errors/` for the five specified Identity errors
  - `packages/core/src/identity/domain/events/` for invitation events and the four
    existing event payload refinements
  - `packages/core/src/identity/interfaces/{user-audit-records-repository,user-access-identity-provider}.ts`
  - `packages/core/src/identity/interfaces/{identity-database,identity-service,registration-attempts-repository}.ts`
  - affected Core barrels and `user-registration-attempt.ts`
- **Requirements:** RF-01, RF-02, RF-03, RF-04, RF-05, RF-06, RF-07, RF-08, RF-09,
  RF-10, RF-11, RF-12; CA-01, CA-03–CA-12.
- **Observable result:** Core exports one-file-per-type domain contracts exactly matching
  the Spec; audit IDs/snapshots have no removable-user FK; invitation operations expose
  claim/finalize/clear coordination; provider contracts contain no Supabase types or
  credentials; events expose stable `_NAME` values and safe serializable payloads.
- **Parallelizable:** `false` — this is the Core precondition and all later use-case and
  application work consumes these exact exports.

#### F1-T2 — Implement use cases, cleanup extension, fakers and deterministic tests

- **Task state:** `verified`
- **Paths:**
  - `packages/core/src/identity/use-cases/{list-users,get-user-details,invite-user,correct-user-invitation,resend-user-invitation,cancel-user-invitation,accept-user-invitation,inactivate-user,reactivate-user,correct-user-name}-use-case.ts`
  - `packages/core/src/identity/use-cases/change-user-profile-use-case.ts`
  - `packages/core/src/identity/use-cases/expire-ice-cream-shop-onboardings-use-case.ts`
  - matching files under `packages/core/src/identity/use-cases/tests/`
  - `packages/core/src/identity/domain/entities/fakers/user-audit-record-faker.ts`
  - affected use-case and faker barrels
- **Requirements:** RF-01–RF-12; CA-01, CA-03–CA-12.
- **Observable result:** every action enforces server-supplied actor/tenant, state,
  self-change, last-active-Manager, email uniqueness, expiry, nonce and concurrency
  rules in Core; multi-record writes use the serializable database callback; provider
  work stays outside retryable transactions; broker calls occur only after commit; no-op
  transitions publish or audit nothing; tests cover successful values, dependency calls,
  errors, fixed time, compensation, stale claims and races with typed mocks.
- **Parallelizable:** `false` — use cases share Core barrels, contracts, fakers and the
  existing profile/expiration behavior; the Orchestrator accepts the full Core sensor
  set as one atomic precondition.
- **Sensors:** `pnpm --filter @scoops/core check:code`,
  `pnpm --filter @scoops/core check:types`, `pnpm --filter @scoops/core test`, `git diff --check`
  and a source scan confirming no Supabase/NestJS/Drizzle/HTTP/Node imports in Core.
- **Expected evidence:** one `.test.ts` per use case, deterministic `DatetimeProvider`,
  `vitest-mock-extended` contracts, assertions for exact event/audit/provider behavior,
  and a complete changed-export inventory.

**F1 phase sensors and evidence:** Core code/type checks and unit suite; inspection of
all Core barrels and public shapes; no infrastructure bootstrap; no phase Judge. F1 is
accepted only when both tasks are `verified` and every RF-01–RF-12 Core branch has a
test or an explicit evidence reference.

### F2 — Audit persistence, invitation provider and transaction infrastructure

**Dependency:** F1 accepted and the Spec REST contract frozen. **Phase state:** `accepted`.

#### F2-T1 — Implement audit persistence, repository binding and generated migration

- **Task state:** `verified`
- **Paths:**
  - `apps/server/src/identity/database/drizzle/models/{user-audit-action-model,user-audit-actor-type-model,user-audit-record-model}.ts`
  - `apps/server/src/identity/database/drizzle/types/entities/drizzle-user-audit-record.ts`
  - `apps/server/src/identity/database/drizzle/mappers/drizzle-user-audit-record-mapper.ts`
  - `apps/server/src/identity/database/drizzle/repositories/drizzle-user-audit-records-repository.ts`
  - database `index.ts` barrels, `identity-repositories` token and
    `apps/server/src/identity/database/identity-database.module.ts`
  - `apps/server/src/shared/database/drizzle/schema.ts`
  - `apps/server/src/identity/database/identity-seeder.ts`
  - generated `apps/server/src/shared/database/drizzle/migrations/*.sql` and `meta/*`
- **Requirements:** RF-02, RF-03, RF-04, RF-05, RF-06, RF-07, RF-08, RF-09, RF-10,
  RF-12; CA-03, CA-05, CA-06, CA-08–CA-11.
- **Observable result:** audit rows persist UUID identity, tenant, affected-user and
  immutable actor/name snapshots, action/value fields, timestamp and required indexes;
  removable pending users have no FK from history; repository tokens bind Core
  contracts; audit and state changes share the serializable transaction; migration is
  generated from the shared schema without destructive guesses, RLS or browser grants.
- **Parallelizable:** `true` with Web F4 after F1 — all paths are Server-owned and do not
  overlap F2-T2's provider paths. The Orchestrator owns migration generation and any
  shared lockfile update.

#### F2-T2 — Implement Supabase user-access provider and server bindings

- **Task state:** `verified`
- **Paths:**
  - `apps/server/src/identity/provision/supabase/supabase-user-access-identity-provider.ts`
  - `apps/server/src/identity/provision/supabase/tests/supabase-user-access-identity-provider.test.ts`
  - `packages/core/src/identity/domain/errors/user-invitation-rate-limited-error.ts`
  - `apps/server/src/identity/constants/{identity-providers,index}.ts`
  - `apps/server/src/identity/provision/identity-provision.module.ts`
  - `apps/server/src/identity/fixtures/test-user-access-identity-provider.ts`
- **Requirements:** RF-03, RF-04, RF-05, RF-06, RF-08, RF-11, RF-12; CA-03–CA-07,
  CA-12.
- **Observable result:** service-role invite/update/delete, anon resend and provider
  email lookup are isolated behind `UserAccessIdentityProvider`; provider subjects stay
  stable during email correction; redirects are server-built; rate-limit, collision and
  availability failures map to known Scoops errors; raw Supabase payloads, credentials,
  links and tokens do not cross the adapter or logs.
- **Parallelizable:** `true` with Web F4 and F2-T1 — the provider module and constants are
  explicitly owned here; no builder may edit them from another Server task.
- **Sensors:** focused provider Vitest suite, server static checks after composition,
  source/secret scan and provider error-mapping review.

**F2 phase sensors and evidence:** Orchestrator-run migration generation and diff review;
`pnpm --filter server check:code`; `pnpm --filter server check:types`; focused provider
tests; migration review for indexes, nullable/required ordering, no drops/truncation/RLS;
lockfile consistency; no phase Judge. Controller persistence proof remains in F3.

### F4 — Pencil preflight, REST transport, query/action hooks and auth boundary

**Dependency:** F1 accepted and the Spec REST contract frozen. **Phase state:** `accepted`.

#### F4-T1 — Inspect Pencil nodes/tokens and establish the normative mapping

- **Task state:** `verified`
- **Paths:** `design/onoreo.pen` read-only through Pencil MCP; `documentation/design.md`
  read-only; evidence target `documentation/features/identity/features/users-management/evaluation.md`.
- **Requirements:** RF-14; CA-13, CA-14.
- **Observable result:** before UI implementation, Pencil editor state/schema and the
  existing Scoops tokens/components are inspected. The following page/state mappings are
  recorded without collapsing distinct compositions: `cnfd3` → Users desktop list;
  `lSA6c` → invite modal; `RFuUY`/`ri3go` → active Operator/pending menus;
  `l8YLSD`/`YbW4I`/`vViP2` → deactivate/promote/demote confirmations;
  `zqSsD`/`G3Ydc`/`V2pGH8`/`oBFH0` → Operator/pending/inactive/Manager details;
  `k0jLMr` → correct-name modal. Each mapped state has an implementing surface,
  viewport target and evidence owner.
- **Parallelizable:** `false` within F4 — node/token inspection is a mandatory precondition
  for F5 and is the visual source of truth; use Pencil MCP only, never shell access to the
  encrypted `.pen` file.
- **Expected evidence:** node IDs, token/component mapping, screenshot/layout inspection
  references and a finding register that distinguishes Pencil desktop references from the
  independent 320 px contract.

#### F4-T2 — Add Identity REST service, context, query keys and action hooks

- **Task state:** `verified`
- **Paths:**
  - `apps/web/src/rest/services/identity-service.ts`
  - `apps/web/src/ui/shared/contexts/rest-context/{types/rest-context-value.ts,use-rest-context-provider.ts}`
  - `apps/web/src/ui/identity/hooks/{identity-query-keys,use-users-query,use-user-details-query,use-invite-user-action,use-correct-user-invitation-action,use-resend-user-invitation-action,use-cancel-user-invitation-action,use-accept-user-invitation-action,use-change-user-profile-action,use-change-user-status-action,use-correct-user-name-action}.ts`
- **Requirements:** RF-02, RF-03, RF-04, RF-05, RF-06, RF-07, RF-08, RF-09,
  RF-10, RF-12, RF-13; CA-02–CA-12.
- **Observable result:** the service implements the exact Core `IdentityService` HTTP
  contract through the shared `RestClient`; query keys include URL filters or `userId`;
  semantic hooks hide React Query generic names; successful mutations invalidate list and
  affected detail caches, cancellation removes the detail cache, and errors preserve
  input without business rules or direct auth/header handling in feature services.
- **Parallelizable:** `true` after F4-T1 — paths do not overlap F4-T3 or F5, and the
  service can be verified with mocked transport against the Spec contract.
- **Sensors:** Web focused hook/service tests, `pnpm --filter web check:code` and
  `pnpm --filter web check:types` after this task's paths are complete.

#### F4-T3 — Add invitation acceptance auth state and canonical web port

- **Task state:** `verified`
- **Paths:**
  - `apps/web/src/provision/auth/supabase/{supabase-client.ts,supabase-auth-provider.ts}`
  - matching Supabase provider/client tests
  - `apps/web/src/ui/shared/contexts/auth-context/{types/auth-context-value.ts,types/index.ts,use-auth-context-provider.ts,index.tsx}`
  - `apps/web/src/provision/auth/auth-composition.ts`
  - `apps/web/package.json`
- **Requirements:** RF-06, RF-08, RF-13, RF-14; CA-07, CA-09, CA-13, CA-14.
- **Observable result:** the `invitation-acceptance` redirect marker, password update,
  local confirmation activation and failure/cancellation cleanup are separate from
  recovery; generation guards prevent stale restoration; the target session is not
  retained after failed confirmation; the Web dev script uses canonical port `3000`.
- **Parallelizable:** `true` with F4-T2 after F4-T1 — paths are disjoint. Package/lockfile
  changes, if any, remain Orchestrator-owned.

**F4 phase sensors and evidence:** Pencil mapping is complete before F5; service and hook
  tests prove method/path/query/body mapping and invalidation; auth-context/provider tests
  prove marker lifecycle and no recovery regression; Web code/type checks pass; no phase
  Judge. F4 is accepted only when F5 can implement against stable exports and the mapped
  design states.

### F3 — Identity REST controllers, expiry job and server composition

**Dependency:** F2 accepted. **Phase state:** `accepted`.

#### F3-T1 — Expose strict REST schemas, DTOs and one integration controller per action

- **Task state:** `verified`
- **Paths:**
  - `apps/server/src/identity/rest/schemas/{list-users,invite-user,correct-user-invitation,accept-user-invitation,change-user-status,correct-user-name,user-id}-schema.ts`
  - `apps/server/src/identity/rest/dtos/{user-summary-response,user-audit-record-response,user-details-response,users-page-response}.dto.ts`
  - the nine new controller/test pairs listed in Spec inventory under
    `apps/server/src/identity/rest/controllers/` and `.../controllers/tests/`
  - existing `change-user-profile.controller.ts` and its integration test
  - `apps/server/src/identity/fixtures/identity-module-fixture.ts`
  - REST/controller/schema/DTO barrels and `apps/server/rest-client/identity/users.rest`
- **Requirements:** RF-01, RF-02, RF-03, RF-04, RF-05, RF-06, RF-07, RF-08, RF-09,
  RF-10, RF-12; CA-01, CA-03–CA-12.
- **Observable result:** every public action has one thin controller, strict Zod input,
  server-derived `Account`, semantic `:userId`, documented success/error statuses,
  neutral cross-tenant `404`, stable `401/403/409/422/429/503` mapping and synchronized
  `.rest` examples. Each controller test exercises HTTP through the real module fixture,
  repositories, mapper and database, asserting persisted state for writes.
- **Parallelizable:** `true` with Web F5 after F2 and F4 — no Web paths overlap; within
  Server, fixture/controller barrels are owned by this task and are not edited by F3-T2.
- **Sensors:** focused server controller integration suites with Docker-compatible
  PostgreSQL, response/persistence assertions, Swagger inspection and REST example review.

#### F3-T2 — Extend invitation expiry cleanup and Identity messaging composition

- **Task state:** `verified`
- **Paths:**
  - `apps/server/src/identity/messaging/inngest/jobs/expire-ice-cream-shop-onboardings-job.ts`
  - `apps/server/src/identity/messaging/inngest/jobs/expire-ice-cream-shop-onboardings-job.test.ts`
  - the Identity messaging module and job barrel
  - existing cleanup-job/use-case wiring needed to distinguish onboarding from
    `user-invitation`
- **Requirements:** RF-05, RF-11, RF-12; CA-06, CA-12.
- **Observable result:** hourly/bounded cleanup claims only due pending user invitations,
  safely removes their provider identity and local user/attempt, remains idempotent under
  retries/races, never deletes an establishment and does not invent an expiration audit
  or Communication implementation.
- **Parallelizable:** `true` with F3-T1 and Web F5 — job paths are disjoint from REST
  controller paths; root Inngest endpoint remains shared and unchanged.

#### F3-T3 — Join server module bindings and verify the complete HTTP boundary

- **Task state:** `verified`
- **Paths:**
  - `apps/server/src/identity/identity.module.ts`
  - Identity database/provision/messaging imports and exports required for composition
  - `apps/server/src/identity/constants/index.ts` only when final barrel wiring is needed
  - integration fixture composition and test-provider bindings owned by F3-T1
- **Requirements:** RF-01–RF-12; CA-01–CA-12.
- **Observable result:** all controllers resolve Core interfaces through module tokens;
  `InngestBroker` is injected as `Broker`; the existing single root Inngest composition
  remains the only endpoint; real HTTP writes persist audit/state together, and broker
  failures are surfaced safely after commit without Communication or `AppModule` edits.
- **Parallelizable:** `false` — it is the Server-lane join and may start only after F3-T1
  and F3-T2 paths are stable. The Orchestrator owns any shared barrel conflict.

**F3 phase sensors and evidence:** one real HTTP suite per controller/action; persisted
  audit/state assertions; cleanup job retry/idempotency evidence; module token resolution;
  `pnpm --filter server check:code`, `check:types`, `test` and `build`; secret/provider
  payload scan; no phase Judge. F3 is accepted only when the entire Server lane is
  `verified` and the REST error matrix is complete.

### F5 — Users routes, shell navigation and distinct page compositions

**Dependency:** F4 accepted, including Pencil preflight. **Phase state:** `accepted`.

#### F5-T1 — Add canonical routes, Manager-only shell navigation and route boundaries

- **Task state:** `verified`
- **Paths:**
  - `apps/web/src/constants/routes.ts` and existing sidebar constants/configuration
  - `apps/web/src/routes/_authenticated/users/index.tsx`
  - `apps/web/src/routes/_authenticated/users/$userId.tsx`
  - `apps/web/src/routes/invitation/accept.tsx`
  - `apps/web/src/ui/shared/widgets/layouts/app-layout/{index.tsx,use-app-layout.ts}` and tests
  - `apps/web/src/routeTree.gen.ts` generated only by the Orchestrator
- **Requirements:** RF-01, RF-02, RF-06, RF-13, RF-14; CA-01, CA-02, CA-07,
  CA-13, CA-14.
- **Observable result:** protected Users routes use shared auth plus Manager authorization
  before rendering; invitation acceptance is public but pending-auth protected as defined
  by the Spec; list search is typed URL state with deterministic defaults/reset-to-page-1;
  Operator direct access resolves to `/access-denied`; shell navigation is profile-driven;
  generated route metadata matches actual files and no route file contains business logic.
- **Parallelizable:** `false` within F5 — route constants, shell entries and route-tree
  generation are shared navigation surfaces. F5-T2/F5-T3 consume these contracts but do
  not edit them.
- **Sensors:** route generation diff review, layout tests, route-level type checks and
  focused mocked-transport route tests for redirects, final URLs, query strings and
  accessible primary content.

#### F5-T2 — Implement Users list and invitation-accept page compositions

- **Task state:** `verified`
- **Paths:**
  - `apps/web/src/ui/identity/types/user-management-action.ts`
  - `apps/web/src/ui/identity/widgets/pages/users-page/` including filters, list and invite dialog
  - `apps/web/src/ui/identity/widgets/pages/accept-user-invitation-page/` and its tests
  - only the list/accept route test files under `apps/web/tests/routes/identity/`
- **Requirements:** RF-02, RF-03, RF-04, RF-05, RF-06, RF-07, RF-08, RF-12, RF-13,
  RF-14; CA-02–CA-07, CA-09, CA-13, CA-14.
- **Observable result:** `UsersPage` has one owning hook for URL/query/dialog state;
  loading, empty, no-results, retry/error and mutation states are visible; action
  availability matches pending/active Operator/active Manager/inactive matrix; invite
  form preserves input on errors; list rows become priority cards at 320 px; acceptance
  owns its idle/invalid/editing/submitting/accepted/expired-or-used/error states and
  updates the provider password before local REST confirmation.
- **Parallelizable:** `true` with F5-T3 after F5-T1 — the list and acceptance page trees
  are disjoint from the detail page tree and use only F4 hooks plus shared route contracts.
- **Sensors:** real-composition Vitest component tests, hook tests for URL/race/dialog
  state, accessibility queries and focused browser route suites with stateful mocked
  transport. Do not treat callback-only or mocked-page tests as complete coverage.

#### F5-T3 — Implement user-details page, action matrix and audit timeline

- **Task state:** `verified`
- **Paths:**
  - `apps/web/src/ui/identity/widgets/pages/user-details-page/`
  - summary, access card, audit timeline, correction dialogs and confirmation dialog
  - colocated `use-user-details-page.ts`, dialog hooks and component/hook tests
  - `apps/web/tests/routes/identity/users.$userId.test.ts`
- **Requirements:** RF-01, RF-04, RF-07, RF-08, RF-09, RF-10, RF-13, RF-14;
  CA-01, CA-05, CA-08–CA-11, CA-13, CA-14.
- **Observable result:** detail loading/error/retry and newest-first timeline states are
  accessible; each mapped pending/Operator/Manager/inactive composition exposes only the
  correct actions; one dialog is open at a time, confirmations disable while pending,
  errors retain input and focus returns to the trigger; São Paulo formatting is applied
  only in presentation while API dates remain ISO UTC; historical snapshots are rendered
  unchanged after name correction.
- **Parallelizable:** `true` with F5-T2 after F5-T1 — the detail page tree and dynamic
  route test are disjoint from list/accept paths. It must not collapse distinct Pencil
  detail states into a shared approximation.
- **Sensors:** real-composition component tests and hook tests for all action branches,
  focused dynamic-route browser assertions, keyboard/focus behavior, no-color-only status
  meaning and accessible timeline structure.

**F5 phase sensors and evidence:** Orchestrator-run route generation; Web code/type checks;
full Web unit suite; three focused route suites; layout and navigation evidence; responsive
320 px assertions; no phase Judge. F5 is accepted only when every mapped page/state has a
corresponding implementation and automated behavior evidence, while visual acceptance is
reserved for F6.

### F6 — Full-stack, visual/accessibility validation and final judgment

**Dependency:** F1–F5 tasks are `verified`. **Phase state:** `accepted`.

#### F6-T1 — Run integrated static, test, migration and build quality gate

- **Task state:** `verified`
- **Paths:** read-only integrated worktree; generated artifacts owned by Orchestrator;
  evidence target `evaluation.md`.
- **Requirements:** RF-01–RF-14; CA-01–CA-14.
- **Observable result:** the Spec validation commands pass for Core, Server and Web;
  generated migration and route diffs are reviewed; focused controller/cleanup/provider,
  widget/hook and route suites pass; server and web builds pass; no secrets, raw tokens,
  passwords, provider subjects or accidental out-of-scope Communication changes appear
  in source, logs, DTOs, audit or events.
- **Parallelizable:** `false` — it joins all lanes and must see one stable integrated tree.
- **Sensors:**
  - `pnpm --filter @scoops/core check:code`
  - `pnpm --filter @scoops/core check:types`
  - `pnpm --filter @scoops/core test`
  - `pnpm --filter server check:code`
  - `pnpm --filter server check:types`
  - `pnpm --filter server test`
  - `pnpm --filter server build`
  - `pnpm --filter web generate-routes`
  - `pnpm --filter web check:code`
  - `pnpm --filter web check:types`
  - `pnpm --filter web test`
  - focused route integration command from the Spec for the three Identity route tests
  - `pnpm --filter web build`
  - `git diff --check` and generated-artifact/secret/out-of-scope scans.

#### F6-T2 — Validate the real local stack and user-management workflows

- **Task state:** `verified`
- **Paths:** read-only running services and integrated application; evidence target
  `evaluation.md`.
- **Requirements:** RF-01–RF-12; CA-01, CA-03–CA-12, CA-14.
- **Observable result:** with Docker services healthy and real Manager/Operator accounts,
  the flow proves invite email capture, password acceptance, list/search/filter/page,
  all four detail states, correction, promotion/demotion, inactivation/reactivation,
  duplicate email, stale/expired/used links, provider failure and broker-failure behavior.
  Inactivation is proven with a second target session whose next protected request is
  rejected by local status resolution. Final URL, HTTP method/path/body/status, database
  effect and Mailpit/provider effect are recorded for each critical flow.
- **Parallelizable:** `false` — this is the integrated server/web join and depends on
  actual migration, module composition and browser-ready applications.
- **Sensors:** `docker compose ps`; Supabase `:54321`; Server `:3333`; Mailpit `:54324`;
  Web `:3000`; persistent `pnpm --filter server dev` and `pnpm --filter web dev` sessions;
  Browser-use via CDP for manual interactions; browser console, failed-network and
  persistence inspection; stop only app processes started for this validation.

#### F6-T3 — Validate each Pencil mapping, responsive/accessibility contract and final judgment

- **Task state:** `verified`
- **Paths:** mapped UI surfaces and `design/onoreo.pen` through Pencil MCP only; evidence
  target `evaluation.md`.
- **Requirements:** RF-13, RF-14; CA-02, CA-05, CA-07, CA-09, CA-10, CA-13, CA-14.
- **Observable result:** every mapped page/state is checked at its Pencil desktop target
  and at the independent 320 px contract. For each mapping, evidence includes screenshot,
  accessibility tree, DOM/layout inspection, `problemsOnly` layout findings, keyboard
  path/focus restoration, visible loading/error/success state, no horizontal overflow,
  reduced-motion behavior, status/destructive non-color cues and browser console/network
  findings. The final Judge evaluates the complete implementation once, after sensors and
  evidence are complete, and records the verdict only in `evaluation.md` and the Plan's
  final operational state.
- **Parallelizable:** `false` — visual validation is the final cross-page join and the
  Judge must evaluate the entire implementation, not individual phases.
- **Sensors:** Browser-use via CDP for manual UI validation; Pencil MCP node screenshot and
  layout inspection; fresh accessibility snapshot before each state-changing interaction;
  focused keyboard path at desktop and 320 px; final static/build/browser evidence review.

**F6 acceptance condition:** F6 tasks are `verified`, all CA-01–CA-14 have direct evidence
  or an explicitly justified negative result, no active blocking finding remains, and the
  single final Implementation Judge accepts the complete implementation. Only then may the
  Orchestrator change this Plan to `accepted` and complete the handoff.

## Risks and mitigations

- **Provider invalidation limitation:** Supabase cannot immediately revoke all existing
  target JWTs by user ID. Local `inactive` status is authoritative on every protected
  request; no undocumented global-signout API may be introduced. F6 must prove the next
  Scoops request is rejected even if a target provider session remains cryptographically
  valid.
- **Post-commit broker gap:** direct publication is the MVP boundary. State/audit commits
  first, then the typed event publishes; a broker failure is surfaced and observable, but
  rollback/outbox is out of scope. Tests must prove no event for rejected/no-op changes and
  no sensitive payload on broker failure.
- **Invitation races:** `claimInvitationOperation` is the single arbiter for accept,
  resend, correction, cancel and expiry. Lease/token/revision checks and persisted
  winner/audit agreement must be proven through Core and controller tests.
- **Provider/local compensation:** invite provider identity is removed when local commit
  fails; correction/resend/cancel stale claims are recoverable by cleanup. Provider errors
  must become stable Scoops errors, never raw SDK responses.
- **Immutable history after pending deletion:** audit rows use snapshot IDs/names and no
  FK to removable pending users. Migration review must prove cancellation/expiry preserves
  history while releasing the email.
- **Generated artifacts:** route tree and migration metadata can drift if hand-edited or
  generated before the final paths exist. The Orchestrator runs both generators only after
  implementation paths are stable and reviews their diffs.
- **Web endpoint drift:** Tooling and Playwright require port `3000`, while the current
  Web script uses `3002`; F4-T3 owns the single script correction and F6 verifies readiness.
- **Visual scope drift:** Pencil desktop frames contain shell content outside this feature.
  Builders implement only mapped Users/invitation surfaces using existing tokens; F6
  records any mismatch instead of adding unrelated Dashboard/Product/Sales behavior.
- **Communication scope drift:** Identity event handoff is included, but message templates,
  notification storage and delivery jobs are not. Any request to cross that boundary must
  amend the Spec before implementation.

## Findings, attempts and next action ledger

- **Finding FND-01 — initial state:** `spec.md` is revision 1 and `open`; no `plan.md` or
  `evaluation.md` existed before this Plan. **State:** resolved by this Plan for planning;
  implementation remains pending.
- **Finding FND-02 — architecture:** the Spec is consistent with Identity ownership,
  server-derived tenant authorization, serializable writes, Core-owned events and
  Communication-owned consumption. **State:** no amendment required.
- **Finding FND-03 — current code:** audit persistence/provider/Users UI/routes are absent,
  while profile-change, auth guards, onboarding patterns and base User persistence exist.
  **State:** active implementation context; F1 must extend existing behavior without
  duplicating or weakening it.
- **Finding FND-04 — UI authority:** Pencil mapping is supplied by the Spec, but the
  encrypted `.pen` file must be inspected through Pencil MCP before UI implementation.
  **State:** active precondition for F4-T1; no visual acceptance inferred from the Spec
  alone.
- **Attempt A-01:** read root/nested agent instructions, rules, architecture, modules,
  tooling, design, Identity/Communication PRDs, Spec revision 1 and existing Plan patterns.
  **Result:** completed read-only discovery; no code or dependency mutation.
- **Attempt A-02:** ran the integrated local quality gate, generated route validation,
  Core/Server/Web checks and tests, Server/Web builds, the 50-test mocked browser suite,
  live health checks, and bounded Browser-use diagnostics. **Result:** automated checks
  passed; Browser-use/Pencil were unavailable; the final Judge rejected the implementation
  for the blockers recorded in `evaluation.md`.
- **Builder Fix QG-01:** correct the Judge findings across invitation acceptance/races,
  320 px Users layout, broker compensation, REST parsing/statuses and page-hook ownership;
  rerun the invalidated Core/Server/Web/browser sensors before requesting reevaluation.
- **Attempt A-03:** completed Builder Fix QG-01, reran the invalidated sensors, reconnected
  Pencil MCP to `design/onoreo.pen`, and executed the canonical Browser-use flow at
  `127.0.0.1:3000` at 320 px. **Result:** all current blockers resolved; evidence is in
  `evaluation.md`.
- **Final Judge Implementation:** the read-only final reevaluation on 2026-08-16 returned
  **ACCEPTED** with no blocking findings. Core 40 tests, Server 36 tests, Web 85 tests,
  Browser integration 50/50, type/code checks, build and diff hygiene all passed.
- **Next action:** none for implementation. Formal Spec closure remains subject to the
  authorized commit/PR Quality Gate described by `conclude-spec`.

## Handoff contract

At every phase boundary, the Orchestrator records task states, command results, changed
paths, generated artifact diffs, active findings and evidence locations here or in
`evaluation.md`. A phase cannot be marked `accepted` from green static checks alone when
its exit condition names persisted, browser, visual or accessibility evidence. Builders
must hand off only their assigned paths and observable results; Judges remain read-only.

The final handoff consists of the accepted Plan, `evaluation.md` with criterion-level
evidence and the final Implementation Judge verdict. No commit, push, pull request,
deployment or external mutation is part of this Plan.
