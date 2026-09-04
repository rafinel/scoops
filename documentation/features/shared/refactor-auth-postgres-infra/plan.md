---
title: Refactor authentication and PostgreSQL infrastructure — implementation plan
status: completed
spec: ./spec.md
spec_revision: 14
evaluation: ./evaluation.md
github_issue: https://github.com/rafinel/scoops/issues/28
updated_at: 2026-09-04
---

# Execution status

- **Spec:** [`./spec.md`](./spec.md), revision `14`, status `in_progress` after narrowing validation to reproducible local runtime evidence.
- **Plan rationale:** Plan-backed execution is required because this delivery crosses Core, Validation, Server, Communication, Web, PostgreSQL/Neon migration, messaging, security, CI and real-service validation with hard ordering and rollback boundaries.
- **Current phase:** F7 — integrated validation, review and handoff — **completed** after coverage-floor, Test Integrity and uninterrupted route-suite corrections.
- **Next action:** Route to `conclude-spec`. No production cutover or external resource mutation has been performed; publication remains separate and has not been started.
- **Active blockers:** None. Core, Validation, Server, Web, coverage, REST parity, local MV-01–MV-06/MV-08, static sensors and the exact uninterrupted route suite are current and passing. MV-07 is not part of the revision-14 manual matrix; its automated migration rehearsal remains recorded historically.
- **Active Builders:** `builder_core`, `builder_server`, `builder_web` and the Web coverage-fix Builder completed their bounded scopes. The Orchestrator completed integrated correction validation; no publication was performed.
- **Shared/generated ownership:** The Orchestrator owns this Plan and `evaluation.md`, root configuration and package installation/lockfile coordination, generated Drizzle migration metadata, generated `apps/web/src/routeTree.gen.ts`, Compose/CI/environment/documentation/removal coordination, integrated validation and the single Implementation Reviewer. Builder Server owns server source and all ten REST-client artifacts; Builder Web owns Web source/tests and consumes REST artifacts as a read-only parity reference. Existing unrelated governance edits remain user-owned and outside this candidate.

# Execution ledger

| Wave | Builder | Phase | Name | Depends on | Parallel with | Status | Exit condition |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | `Builder Core` | F1 | Core and Validation contracts/use cases | — | — | `completed` | Provider-neutral Core contracts, Identity use cases and shared schemas compile and their focused unit suites pass. |
| 2 | `Builder Server` | F2 | Shared PostgreSQL, transaction context and outbox foundation | F1 | — | `completed` | Shared schema, `DatabaseTransactionContext`, Better Auth/outbox models and durable transport are ready for server adapters; no repository-only test replaces integration coverage. |
| 2 | `Orchestrator` | F2 | Generate and review the additive Better Auth migration | F2-T1 and F2-T2 schema handoffs | — | `completed` | `0017_better_auth.sql`, its snapshot and journal are generated from the shared schema, reviewed for the exact Contract and ready for clean PostgreSQL application. |
| 2 | `Orchestrator` | F2 | Coordinate workspace manifests and lockfile | F1 | Builder Server F2-T1/F2-T2 | `completed` | Server/Web dependencies, server JSX/build settings and required package scripts are declared, installed with pnpm and represented by the current lockfile. |
| 3 | `Builder Server` | F3 | Better Auth server boundary and Identity workflows | F2 | Builder Web F5 | `completed` | Nest handler ordering, allowlist, cookie/session security, Identity controllers, fixtures, server-backed tests and all REST artifacts are route-complete. |
| 4 | `Builder Server` | F4 | Communication email delivery | F2 and F3 event/composition contracts | — | `completed` | Communication-only EmailProvider adapters, templates, validated jobs and root job composition pass provider, retry and ownership checks. |
| 3 | `Builder Web` | F5 | Web cookie/SSR authentication and Identity UI | F1, F2-T3 and F2-T4 | Builder Server F3 | `completed` | Web auth/REST/SSR composition, routes, widgets, mocked route suites and auth-state tests pass without readable token state. |
| 6 | `Builder Server` | F6 | Remove obsolete cutover tooling and place the shared outbox contract in Core | F2, F3 and F4 | Orchestrator F6 configuration work after server handoff | `completed` | All legacy cutover source/test/export files are absent; the provider-neutral outbox contract is exported by Core, while Server retains the Drizzle models, adapter, persistence types and injection token; imports, barrels and tests use the new paths. |
| 6 | `Orchestrator` | F6 | Supabase removal and release configuration cleanup | F3, F4, F5 and Builder Server F6-T1 | — | `completed` | Runtime/configuration removal, Compose/CI/scripts/examples alignment and obsolete cutover runbook deletion are integrated without modifying historical SDD truth. |
| 7 | `Orchestrator` | F7 | Integrated validation, review and handoff | F6 | — | `completed` | Path conformance, all workspace sensors, real services, applicable MV-01–MV-06 and local MV-08, REST parity, evidence freshness, coverage floors, and the uninterrupted 190-test route suite passed; the candidate is ready for `conclude-spec`. |

### F1 — Core and Validation contracts/use cases

#### F1-T1 — Establish provider-neutral Identity and Communication Core contracts and use cases

- **Status/owner:** `completed` — Builder Core (`builder_core`), validated by `EV-F1-03`
- **Depends/parallel:** No dependency; F1-T2 follows the revised Core event/structure exports in the same Builder lane.
- **Paths:** `packages/core/package.json`; `packages/core/src/communication/**`; `packages/core/src/identity/domain/events/**`; `packages/core/src/identity/domain/structures/**`; `packages/core/src/identity/domain/errors/**`; `packages/core/src/identity/interfaces/**`; `packages/core/src/identity/use-cases/**`; `packages/core/src/shared/interfaces/rest-client.ts`; the exact Core test paths listed in Spec §3 under “Core and Validation”.
- **Contract:** `RF-01`, `RF-02`, `RF-03`, `RF-04`, `RF-05`, `RF-09`; `CA-03`, `CA-05`, `CA-05A`, `CA-06`–`CA-09`, `CA-11`, `CA-11A`, `CA-17`.
- **Outcome:** Core exposes the revised cookie-neutral `AuthSession`, Identity provider lifecycle contracts, prepared Identity event families, Communication-only `EmailProvider`, unchanged `Broker.publish(event)` and transaction-scope session deletion; all affected use cases enforce the Spec’s retry, quota, revocation, compensation and atomic-event semantics without provider/framework imports.
- **Rules:** `documentation/rules/code-conventions-rules.md` (named declarations, AppError and kebab-case); `documentation/rules/core-package-rules.md` (contracts in interfaces, one exported type per file, Communication ownership, Broker neutrality); `documentation/rules/use-case-testing-rules.md` (one use-case test, typed mocks, deterministic time and infrastructure-free tests); `documentation/rules/messaging-layer-rules.md` (domain events and small Broker contract).
- **Exit:** Run Core code/type checks and focused Core unit tests; verify every changed use case has its own deterministic test matrix, provider/framework import search is clean, event payloads are JSON-safe, and `AuthSession` contains no access/refresh token fields.

#### F1-T2 — Add reusable environment, REST, route-search and event schemas

- **Status/owner:** `completed` — Builder Core (`builder_core`), validated by `EV-F1-03`
- **Depends/parallel:** Depends on F1-T1’s event and auth structures; no active parallel edit of `packages/validation`.
- **Paths:** `packages/validation/src/environment/**`; `packages/validation/src/identity/**`; `packages/validation/src/communication/**`; `packages/validation/src/index.ts`; the exact Validation paths listed in Spec §3 under “Core and Validation”.
- **Contract:** `RF-01`, `RF-02`, `RF-04`, `RF-05`, `RF-06`; `CA-02`, `CA-03`, `CA-04`, `CA-05A`, `CA-08`, `CA-09`, `CA-11`, `CA-12`.
- **Outcome:** Server/browser environment schemas, strict onboarding/invitation/recovery inputs, route token search validation and one exact Zod schema per prepared event are exported from the package root without provider SDK, application, browser-global or environment reads.
- **Rules:** `documentation/rules/validation-package-rules.md` (schema ownership, core enum derivation, root exports and no business rules); `documentation/rules/code-conventions-rules.md` (naming and declarations).
- **Exit:** Run Validation code/type/architecture checks and consumer type checks; parse valid, malformed, boundary and extra-field inputs; confirm browser schemas expose only the API origin and all event schemas match the Core payloads exactly.

### F2 — Shared PostgreSQL, transaction context and outbox foundation

#### F2-T1 — Implement shared Drizzle schema, Better Auth models and transaction context

- **Status/owner:** `completed` — Builder Server (`builder_server`), validated by `EV-F2-03` and `EV-F2-MANIFEST`
- **Depends/parallel:** Depends on F1; F2-T2 can begin only after the shared database context and schema exports are available.
- **Paths:** `apps/server/src/identity/database/drizzle/models/**`; `apps/server/src/identity/database/drizzle/repositories/drizzle-authentication-sessions-repository.ts`; `apps/server/src/identity/database/drizzle/repositories/index.ts`; `apps/server/src/identity/database/drizzle/drizzle-identity-database.ts`; `apps/server/src/shared/database/drizzle/schema.ts`; `apps/server/src/shared/database/drizzle/drizzle-client.ts`; `apps/server/src/shared/database/drizzle/database-transaction-context.ts`; `apps/server/src/shared/database/drizzle/database.module.ts`; `apps/server/src/shared/database/fixtures/database-fixture.ts`.
- **Contract:** `RF-01`, `RF-03`, `RF-06`, `RF-09`; `CA-02`, `CA-06`, `CA-12`, `CA-17`.
- **Outcome:** Standard PostgreSQL/Neon-compatible Drizzle configuration uses `DATABASE_URL` and `prepare:false`; Better Auth/control models and the shared `public.events` model inputs are exported through one schema; transaction context provides nested reuse and concurrent isolation; Identity session deletion can share the active transaction without putting Broker in `IdentityDatabaseScope`.
- **Rules:** `documentation/rules/database-layer-rules.md` (owning models, shared schema, transaction context, token injection and indirect persistence validation); `documentation/rules/code-conventions-rules.md`; `documentation/rules/server-app-layer-rules.md` where module registration is changed.
- **Exit:** Run server code/type/architecture checks and database-backed fixture checks through real PostgreSQL; prove clean context teardown, nested transaction reuse, concurrent isolation, serializable rollback behavior and exact model constraints. Repository behavior is validated through later controller/application integration, not standalone repository tests.

#### F2-T2 — Build durable shared event enqueue, publication, reprocessing and cleanup

- **Status/owner:** `completed` — Builder Server (`builder_server`), revision-7 database-boundary correction superseded by the revision-8 Drizzle-tree consolidation
- **Depends/parallel:** Depends on F2-T1 and F1’s `Event`/`Broker` contracts; sequential within Builder Server; no feature module owns the shared outbox.
- **Paths:** `apps/server/src/shared/database/drizzle/outbox/**`; `apps/server/src/shared/messaging/outbox/**`; `apps/server/src/shared/messaging/inngest/inngest-broker.ts`; `apps/server/src/shared/messaging/inngest/inngest-broker.test.ts`; `apps/server/src/shared/messaging/shared-messaging.module.ts`; the exact shared database and messaging paths listed in Spec §3.
- **Contract:** `RF-05`, `RF-09`; `CA-02`, `CA-08`, `CA-10`, `CA-11`, `CA-11A`.
- **Outcome:** `InngestBroker` inserts exactly one pending `public.events` row through the active `DatabaseTransactionContext` or standalone connection without network publication; non-Inngest `PublishEventJob` listens through the Core `OutboxDatabase` contract, drains on committed notification/startup/reconnect, and directly calls `InngestClient` with the stable event-row ID; reservations, bounded retries, terminal signals, local/test-only reprocessing, cleanup and guarded audited requeue follow revision 9. Core exports the provider-neutral contract; Server owns the outbox models, persistence types, Drizzle adapter and Nest injection token, and the shared Drizzle schema re-exports the models.
- **Rules:** `documentation/rules/messaging-layer-rules.md` (database-triggered workers, validated events, direct-client publication, five-minute reservations and environment registration); `documentation/rules/database-layer-rules.md` (transaction context and no repository-only tests); `documentation/rules/server-app-layer-rules.md`; `documentation/rules/code-conventions-rules.md`.
- **Exit:** PostgreSQL messaging coverage and the revision-8 focused suite pass for commit/rollback, standalone enqueue, nested/concurrent context isolation, listener startup/reconnect/notification draining, 100-row reservation bounds, owner-guarded transitions, crash/duplicate behavior, 1/5/15/60-minute backoff, ten-attempt terminal exclusion, five-minute backlog signal, published-only retention and redacted manual requeue audit. Static checks prove no `Broker.publish` call from `PublishEventJob`, no publisher function registration, no `ReprocessEventsJob` registration in staging/production composition, and no outbox database consumer imports from the messaging-owned database path.

#### F2-T3 — Generate and review the additive Better Auth migration

- **Status/owner:** `completed` — Orchestrator, validated by `EV-F2-MIGRATION-REVIEW` and `EV-F2-03`
- **Depends/parallel:** Depends on the F2-T1 schema handoff; may run while Builder Web implements mocked transport, but F3 server work waits for this checkpoint.
- **Paths:** `apps/server/src/shared/database/drizzle/migrations/0017_better_auth.sql`; `apps/server/src/shared/database/drizzle/migrations/meta/0017_snapshot.json`; `apps/server/src/shared/database/drizzle/migrations/meta/_journal.json`.
- **Contract:** `RF-01`, `RF-05`, `RF-06`; `CA-02`, `CA-11`, `CA-11A`, `CA-12`.
- **Outcome:** The migration is generated from the shared Drizzle schema and contains the dedicated `better_auth` schema, Better Auth/control tables, `public.events`, named constraints/indexes, the recovery audit enum value and no runtime/provider auto-migration or hand-edited snapshot drift.
- **Rules:** `documentation/rules/database-layer-rules.md` (shared generated migration source and model ownership); `documentation/tooling.md` (pnpm/Drizzle commands); `documentation/rules/code-conventions-rules.md` for generated-source review boundaries.
- **Exit:** Run `pnpm --filter server exec drizzle-kit generate --name=better_auth`, review SQL/snapshot/journal against the exact Spec schema, apply to a clean standard PostgreSQL target and record the generated artifact review in `./evaluation.md`. Do not use Better Auth `migrate`, Drizzle `push` or provider runtime auto-migration.

#### F2-T4 — Coordinate workspace manifests and lockfile

- **Status/owner:** `completed` — Orchestrator, validated by `EV-F2-MANIFEST`
- **Depends/parallel:** Depends on F1’s Core/Validation contract; must complete before F3/F4/F5 use newly declared dependencies; package installation is coordinated centrally.
- **Paths:** `apps/server/package.json`; `apps/web/package.json`; `apps/server/tsconfig.json`; `apps/server/tsconfig.build.json`; `pnpm-lock.yaml`.
- **Contract:** `RF-01`, `RF-05`, `RF-06`, `RF-08`; `CA-01`, `CA-10`, `CA-12`, `CA-16`.
- **Outcome:** Exact Better Auth, bcrypt, email, React Email and client dependencies, server JSX/build inclusion and the guarded requeue script are declared once; Supabase and obsolete cutover dependencies/scripts are removed and the lockfile matches the manifests without Neon SDK drift.
- **Rules:** `documentation/tooling.md` (pnpm workspace installation and lockfile discipline); `documentation/rules/code-conventions-rules.md`; `documentation/rules/server-app-layer-rules.md`; `documentation/rules/provision-layer-rules.md`.
- **Exit:** Run the required pnpm installation with a frozen lockfile after manifest updates, inspect the dependency diff for exact Spec versions and no forbidden SDK, and run package-level type/config checks sufficient for Server JSX and Web Better Auth imports. Do not edit the lockfile by hand.

### F3 — Better Auth server boundary and Identity workflows

#### F3-T1 — Mount Better Auth and enforce server-side cookie/session security

- **Status/owner:** `completed` — Builder Server (`builder_server`), validated by `EV-F3-08` and final Server gates
- **Depends/parallel:** Depends on F1 contracts and the F2 migration/context; F3-T2 follows the adapter and guard boundary.
- **Paths:** `apps/server/src/identity/provision/better-auth/**`; `apps/server/src/identity/provision/identity-provision.module.ts`; `apps/server/src/identity/provision/index.ts`; `apps/server/src/identity/constants/identity-providers.ts`; `apps/server/src/identity/rest/guards/authentication.guard.ts`; `apps/server/src/identity/rest/guards/origin.guard.ts`; `apps/server/src/identity/rest/types/authenticated-request.ts`; `apps/server/src/identity/rest/guards/pending-authentication.guard.ts`; `apps/server/src/identity/rest/types/pending-authenticated-request.ts`; `apps/server/src/identity/decorators/current-auth-user.ts`; `apps/server/src/identity/decorators/index.ts`; `apps/server/src/shared/rest/bootstrap/**`; `apps/server/src/main.ts`.
- **Contract:** `RF-01`, `RF-02`, `RF-03`, `RF-04`, `RF-06`, `RF-09`; `CA-01`, `CA-03`–`CA-06`, `CA-05A`, `CA-12`, `CA-17`.
- **Outcome:** The pinned Better Auth factory uses shared Drizzle/PostgreSQL, bcrypt, exact trusted origins and cookie options; the handler is mounted before Nest parsers; only the allowed provider routes are public; Origin/session guards enforce local eligibility, idle/absolute expiry, safe cookie rotation and sanitized request metadata.
- **Rules:** `documentation/rules/provision-layer-rules.md` (replaceable provider adapter, server-only secrets and mocks); `documentation/rules/rest-layer-rules.md` (cookie transport, global error boundary and server aliases); `documentation/rules/database-layer-rules.md`; `documentation/rules/server-app-layer-rules.md`; `documentation/rules/code-conventions-rules.md`.
- **Exit:** Run full AppModule HTTP integration checks with real PostgreSQL for body-parser ordering, route allowlist denial, exact CORS and unsafe Origin rejection, cookie flags/allowlisting, no readable token or Bearer path, pending/inactive/orphan eligibility rejection before session insertion, controlled five-failure lockout, idle-only rotation and absolute expiry enforcement. Record real request/response and persistence/authorization results.

#### F3-T2 — Orchestrate Identity onboarding, invitation, recovery and access controllers

- **Status/owner:** `completed` — Builder Server (`builder_server`), validated by `EV-F3-08`
- **Depends/parallel:** Depends on F3-T1; F3-T3 follows these route and request-shape changes; Communication jobs consume the prepared events in F4.
- **Paths:** `apps/server/src/identity/rest/controllers/*.ts`; `apps/server/src/identity/rest/dtos/**`; `apps/server/src/identity/identity.module.ts`; the exact modified Identity controller paths in Spec §3, including onboarding, invitation, recovery/reset, session and status actions.
- **Contract:** `RF-02`, `RF-03`, `RF-04`, `RF-05`, `RF-09`; `CA-05A`, `CA-06`–`CA-09`, `CA-11A`, `CA-17`.
- **Outcome:** Controllers remain thin adapters while completing provider/local orchestration, no-early-cookie behavior, non-enumerating recovery, immediate authenticated confirmation/acceptance, atomic inactivation with session deletion and event enqueue, and sanitized REST errors.
- **Rules:** `documentation/rules/rest-layer-rules.md` (one controller per action, use-case-derived request bodies, Swagger responses and route groups); `documentation/rules/controllers-testing-rules.md`; `documentation/rules/validation-package-rules.md`; `documentation/rules/database-layer-rules.md`; `documentation/rules/code-conventions-rules.md`.
- **Exit:** Run focused real controller integration tests through production Nest wiring and PostgreSQL. Verify response status/body, persistence, cookie forwarding, authorization, retry/idempotency, quota/audit, session revocation and rollback/no-state-change behavior for every affected Identity action.

#### F3-T3 — Migrate server fixtures/regression suites and REST-client artifacts

- **Status/owner:** `completed` — Builder Server (`builder_server`), validated by `EV-F3-08`
- **Depends/parallel:** Depends on F3-T1/F3-T2; the Web lane may consume these artifacts read-only; no overlapping REST edits in F6.
- **Paths:** `apps/server/src/identity/fixtures/better-auth-fixture.ts`; `apps/server/src/identity/fixtures/supabase-auth-fixture.ts`; `apps/server/src/identity/fixtures/identity-module-fixture.ts`; `apps/server/src/identity/rest/controllers/tests/**`; `apps/server/src/mrp/rest/controllers/tests/**`; `apps/server/src/pdv/fixtures/pdv-module-fixture.ts`; `apps/server/src/pdv/rest/controllers/tests/**`; `apps/server/src/shared/rest/tests/rest-fixture.ts`; `apps/server/rest-client/identity/auth.rest`; `apps/server/rest-client/identity/establishments.rest`; `apps/server/rest-client/identity/registration-attempts.rest`; `apps/server/rest-client/identity/users.rest`; `apps/server/rest-client/mrp/accompaniment-types.rest`; `apps/server/rest-client/mrp/products.rest`; `apps/server/rest-client/pdv/discounts.rest`; `apps/server/rest-client/pdv/orders.rest`; `apps/server/rest-client/pdv/sales-channels.rest`; `apps/server/rest-client/shared/health.rest`.
- **Contract:** `RF-02`, `RF-03`, `RF-04`, `RF-08`, `RF-09`; `CA-01`, `CA-03`–`CA-09`, `CA-12`, `CA-16`, `CA-17`.
- **Outcome:** Better Auth fixtures issue controlled cookies, every Identity/MRP/PDV controller regression uses the real cookie-backed path, and every affected REST group has labeled requests for every current route with reusable non-secret variables, current methods/paths/parameters/headers/bodies and no Bearer contract.
- **Rules:** `documentation/rules/controllers-testing-rules.md` (real module wiring, DatabaseFixture/RestFixture and persistence assertions); `documentation/rules/rest-layer-rules.md` (complete `.rest` groups and cookie transport); `documentation/rules/database-layer-rules.md`; `documentation/rules/provision-layer-rules.md`; `documentation/rules/code-conventions-rules.md`.
- **Exit:** Run the complete affected Identity/MRP/PDV controller suites and inspect each REST artifact against its controller routes and shared schemas. Verify one labeled request per route, no credentials, route-complete parameters/headers/bodies and recorded parity in `./evaluation.md`; run real HTTP/auth/persistence/authorization assertions, not mocked transport alone.

### F4 — Communication email delivery

#### F4-T1 — Implement Communication-owned providers, templates and durable email jobs

- **Status/owner:** `completed` — Builder Server (`builder_server`), validated by `EV-F4-01`
- **Depends/parallel:** Depends on F1 event schemas and F2 outbox publication; follows F3 prepared-event orchestration; sequential within Builder Server.
- **Paths:** `apps/server/src/communication/constants/**`; `apps/server/src/communication/provision/email/**`; `apps/server/src/communication/messaging/inngest/jobs/**`; `packages/email/**`; the exact Communication test paths listed in Spec §3.
- **Contract:** `RF-05`, `RF-09`; `CA-08`–`CA-11A`.
- **Outcome:** Communication alone owns `EmailProvider`, Resend/SMTP adapters, Portuguese escaped HTML templates, event validation and durable Inngest steps; stable event IDs become provider idempotency keys and provider failures remain retryable application failures.
- **Rules:** `documentation/rules/email-package-rules.md` (package ownership, public exports, typed arrow-function template/render declarations and rendering/delivery separation); `documentation/rules/provision-layer-rules.md` (owning adapters and server-only credentials); `documentation/rules/messaging-layer-rules.md` (typed triggers, `this.function`, step durability and consumer ownership); `documentation/rules/validation-package-rules.md`; `documentation/rules/core-package-rules.md`; `documentation/rules/code-conventions-rules.md`.
- **Exit:** Run template, Resend and SMTP adapter tests plus Communication job tests for all three event families, escaping, Portuguese content, stable idempotency, SDK `{data,error}` mapping, Mailpit configuration, named durable steps, retryable failures and secret/redaction checks. Prove Identity imports no EmailProvider/provider implementation.

#### F4-T2 — Compose Communication and shared Inngest functions exactly once

- **Status/owner:** `completed` — Builder Server/Orchestrator, validated by `EV-F4-01` and root composition inspection
- **Depends/parallel:** Depends on F4-T1; shares root application composition only with Orchestrator review, not overlapping edits.
- **Paths:** `apps/server/src/communication/messaging/communication-messaging.module.ts`; `apps/server/src/communication/communication.module.ts`; `apps/server/src/app.module.ts`.
- **Contract:** `RF-05`, `RF-09`; `CA-01`, `CA-10`, `CA-11`, `CA-11A`, `CA-16`.
- **Outcome:** Feature modules register their own jobs and providers; the single application composition registers publish, reprocessing, cleanup and Communication send functions exactly once; no second Inngest endpoint or module cycle is introduced.
- **Rules:** `documentation/rules/server-app-layer-rules.md` (feature layer modules and composition); `documentation/rules/messaging-layer-rules.md`; `documentation/rules/rest-layer-rules.md`; `documentation/rules/code-conventions-rules.md`.
- **Exit:** Start the real Nest composition and inspect the registered Inngest functions/routes, module dependency graph and provider tokens. Run server architecture/code/type checks and a real local Mailpit delivery path with persisted outbox/provider correlation.

### F5 — Web cookie/SSR authentication and Identity UI

#### F5-T1 — Replace Web auth, REST transport and SSR session forwarding

- **Status/owner:** `completed` — Builder Web (`builder_web`), validated by `EV-F5-08`
- **Depends/parallel:** Depends on F1, F2-T4’s Web manifest and the Spec’s stable REST/cookie contract; can run in parallel with F2–F4 using mocked transport; real server validation waits for F7.
- **Paths:** `apps/web/src/constants/browser-env.ts`; `apps/web/src/provision/auth/better-auth/**`; `apps/web/src/provision/auth/supabase/**`; `apps/web/src/provision/auth/auth-composition.ts`; `apps/web/src/rest/axios/**`; `apps/web/src/rest/services/identity-service.ts`; `apps/web/src/server/auth/resolve-auth-session.ts`; `apps/web/src/middlewares/require-auth-middleware.ts`; `apps/web/src/middlewares/require-manager-middleware.ts`; `apps/web/src/ui/shared/contexts/auth-context/**`; `apps/web/src/ui/shared/contexts/rest-context/**`.
- **Contract:** `RF-02`, `RF-04`, `RF-08`, `RF-09`; `CA-03`, `CA-04`, `CA-05A`, `CA-06`, `CA-09`, `CA-16`, `CA-18`.
- **Outcome:** Browser and SSR requests use credentials and sanitized Scoops session projections; no token accessor, Authorization header, localStorage/sessionStorage token, readable cookie or provider secret remains in Web auth/REST composition.
- **Rules:** `documentation/rules/ui-layer-rules.md` (context/provider boundaries and REST factories, including **Antipatterns to Avoid**); `documentation/rules/rest-layer-rules.md` (cookie transport and SSR forwarding); `documentation/rules/web-app-routing-rules.md` (middleware and canonical paths); `documentation/rules/provision-layer-rules.md`; `documentation/rules/validation-package-rules.md`; `documentation/rules/code-conventions-rules.md`.
- **Exit:** Run Web provider/context/transport tests and inspect browser state/network requests for absence of Authorization/token lookup. Exercise mocked SSR cookie forwarding and sanitized response mapping; for any rendered-state change, capture a fresh Playwright CLI screenshot for each affected desktop/narrow state, otherwise record the explicit no-visual-delta decision in `./evaluation.md`.

#### F5-T2 — Migrate Identity actions, pages, route search and protected navigation

- **Status/owner:** `completed` — Builder Web (`builder_web`), validated by `EV-F5-08`
- **Depends/parallel:** Depends on F5-T1; route files remain thin and use the shared middleware/search schemas.
- **Paths:** `apps/web/src/ui/identity/hooks/**`; `apps/web/src/ui/identity/widgets/pages/accept-user-invitation-page/**`; `apps/web/src/ui/identity/widgets/pages/onboarding-confirmation-page/**`; `apps/web/src/ui/identity/widgets/pages/reset-password-page/**`; `apps/web/src/ui/identity/widgets/pages/landing-page/**`; `apps/web/src/routes/invitation/accept.tsx`; `apps/web/src/routes/onboarding/confirm.tsx`; `apps/web/src/routes/reset-password/index.tsx`.
- **Contract:** `RF-02`, `RF-04`, `RF-09`; `CA-03`, `CA-04`, `CA-06`–`CA-09`, `CA-18`.
- **Outcome:** Existing Portuguese loading, failure, pending, validation, return-to and recovery states remain user-visible while sign-in, sign-out, onboarding, invitation and reset actions use the cookie/session contract and strict token search validation.
- **Rules:** `documentation/rules/ui-layer-rules.md` (feature ownership, action/page hooks, accessible feedback and **Antipatterns to Avoid**); `documentation/rules/web-app-routing-rules.md` (thin routes, search validation, protected middleware and canonical navigation); `documentation/rules/rest-layer-rules.md`; `documentation/rules/validation-package-rules.md`; `documentation/rules/code-conventions-rules.md`.
- **Exit:** Run the affected widget and route tests with accessible role/name assertions. Exercise loading, success, empty/unavailable, validation, pending/duplicate-submit, error/retry and protected/unauthorized states; compare the exact Spec widget tree, keyboard path and narrow viewport behavior; inspect console and failed requests; capture fresh Playwright screenshots for every affected rendered design state or record the no-visual-delta decision when markup/styling is unchanged.

#### F5-T3 — Update Web auth/widget/route fixtures and mocked browser coverage

- **Status/owner:** `completed` — Builder Web (`builder_web`), validated by `EV-F5-08`
- **Depends/parallel:** Depends on F5-T1/F5-T2; real-service validation is manual and is only evidence after F7 services are ready.
- **Paths:** the exact Identity widget tests, route tests, fixtures, `auth.setup.ts` and `auth-state.ts` listed in Spec §3 Web ledger. The obsolete `apps/web/src/rest/axios/utils/tests/request.test.ts` is removed; no committed test is permitted under `apps/web/tests/integration` or outside `ui/**/widgets/**` for Web UI ownership.
- **Contract:** `RF-02`, `RF-04`, `RF-09`; `CA-03`, `CA-04`, `CA-06`–`CA-09`, `CA-18`.
- **Outcome:** Web widget and mocked route tests prove the complete sanitized cookie-session/action state matrix through the shared fixture; manual real-service Playwright CLI scenarios assert URLs, persistence, auth/session behavior and Mailpit/Neon boundaries without adding committed integration files.
- **Rules:** `documentation/rules/widget-testing-rules.md` (owning hook mocks, public behavior matrix and accessible assertions); `documentation/rules/web-app-routing-rules.md` (mandatory route matrix and shared Playwright fixture); `documentation/rules/ui-layer-rules.md` (widget hooks, contexts and **Antipatterns to Avoid**); `documentation/rules/rest-layer-rules.md`; `documentation/rules/provision-layer-rules.md`; `documentation/rules/code-conventions-rules.md`.
- **Exit:** Run Web code/architecture/type/unit/coverage checks and focused mocked route suites. Verify exact request/response/URL/visible outcomes, keyboard/narrow states, console/network diagnostics, and no token in storage/HTML. Keep real-service evidence pending until F7 and write fresh screenshots to Playwright `test-results/` for any changed visual state.

### F6 — Remove obsolete cutover tooling and consolidate the Drizzle database boundary

#### F6-T1 — Remove legacy cutover artifacts and place the outbox contract in Core

- **Status/owner:** `in_progress` — Builder Server (`builder_server`), revision-9 contract correction
- **Depends/parallel:** Depends on F2 migration and F3/F4 provider/event contracts; no production or staging data operation is permitted.
- **Paths:** `apps/server/src/identity/database/cutover/**` (Remove); `apps/server/src/shared/database/cutover/**` (Remove); `packages/core/src/shared/interfaces/outbox-database.ts` (Create); `apps/server/src/shared/database/drizzle/outbox/**` (Create/Modify); all server imports and barrels listed in Spec §3.
- **Contract:** `RF-07`, `RF-08`, `RF-09`; `CA-02`, `CA-11`, `CA-11A`, `CA-12`, `CA-16`.
- **Outcome:** Legacy source/import/rehearsal code is removed because deployed environments are empty; the provider-neutral outbox contract is exported from Core, while Server consumers resolve the Drizzle adapter and Server-only injection token from the shared database/messaging composition boundary.
- **Rules:** `documentation/rules/database-layer-rules.md`; `documentation/rules/messaging-layer-rules.md`; `documentation/rules/code-conventions-rules.md`.
- **Exit:** Verify no cutover source/import/runbook reference remains in active runtime/configuration; run Core and Server code, architecture, types and focused messaging checks; verify contract imports use `@scoops/core/shared/interfaces`, Server token imports use the token file, and no superseded `shared/database/outbox` path exists.

#### F6-T2 — Remove active Supabase/Bearer infrastructure and align release configuration

- **Status/owner:** `completed` — Orchestrator, revision-14 integrated cleanup
- **Depends/parallel:** Depends on F6-T1 and completed F3–F5 handoffs; REST artifacts remain Builder Server-owned and are reviewed read-only here.
- **Paths:** `apps/server/package.json`; `package.json`; `.dependency-cruiser.mjs`; `.env.example`; `apps/server/.env.example`; `apps/web/.env.example`; `docker-compose.yaml`; `.github/workflows/server-app-ci.yml`; `.github/workflows/web-app-ci.yml`; `scripts/generate-supabase-keys.mjs`; `scripts/tests/generate-supabase-keys.test.mjs`; `volumes/auth/templates/confirmation.html`; `volumes/auth/templates/email_change.html`; `volumes/auth/templates/invite.html`; `volumes/auth/templates/magic_link.html`; `volumes/auth/templates/recovery.html`; `volumes/db/jwt.sql`; `volumes/db/roles.sql`; `volumes/kong/kong.yml`; `documentation/operations/supabase-to-neon-cutover.md`; `documentation/tooling.md` only if verified implementation command names differ from the current approved guidance.
- **Contract:** `RF-06`, `RF-08`, `RF-09`; `CA-12`, `CA-16`, `CA-18`.
- **Outcome:** Local Compose uses a new standard PostgreSQL volume plus Mailpit/MinIO/Inngest; active runtime/config/CI/dependencies contain no Supabase, Bearer, or obsolete cutover contract; environment validation, health, dependency rules, scripts and CI describe the approved Better Auth/Neon/Resend boundary while historical SDD artifacts remain unchanged.
- **Rules:** `documentation/tooling.md` (pnpm, Compose, CI, migrations and test commands); `documentation/rules/database-layer-rules.md`; `documentation/rules/rest-layer-rules.md`; `documentation/rules/provision-layer-rules.md`; `documentation/rules/messaging-layer-rules.md`; `documentation/rules/code-conventions-rules.md`.
- **Exit:** Run `docker compose config`, script/config/lockfile/dependency scans and health/config tests after F2-T4’s coordinated install. Confirm the removal gate has no active runtime/configuration Supabase/Bearer/session-token or cutover-command match, the old volume is untouched, approved `AGENTS.md`/`documentation/architecture.md` changes remain untouched, and no production cutover/DNS/resource deletion occurred.

### F7 — Integrated validation, review and handoff

#### F7-T1 — Generate route metadata and run the complete Spec path sensor

- **Status/owner:** `completed` — Orchestrator; route generation and the current Spec path sensor pass (`EV-F7-SENSOR-REV13-01`)
- **Depends/parallel:** Depends on all Builder diffs, generated migration review and F6 configuration integration; no integrated sensor or Reviewer starts before the path sensor passes.
- **Paths:** `apps/web/src/routeTree.gen.ts`; complete integrated candidate path map; `./plan.md`; `./evaluation.md`.
- **Contract:** All `RF-01`–`RF-09`; all `CA-01`–`CA-18` as structural coverage.
- **Outcome:** Generated route metadata is current and the complete candidate conforms to every Spec `Create`, `Modify` and `Generate` path with no unassigned or stale contracted artifact.
- **Rules:** `documentation/rules/web-app-routing-rules.md` (generated route tree is read-only); `documentation/tooling.md`; `documentation/rules/code-conventions-rules.md`; the complete Spec Rule Pack for cross-boundary conformance.
- **Exit:** Run `pnpm --filter web generate-routes`, inspect the generated diff, then run `pnpm check:spec-implementation -- documentation/features/shared/refactor-auth-postgres-infra/spec.md`. Record the exact result in `./evaluation.md`; if any path is missing/stale, keep F7 in progress, invalidate affected evidence and resume the responsible Builder.

#### F7-T2 — Run integrated sensors, real scenarios and the single Implementation Reviewer

- **Status/owner:** `blocked` — Orchestrator; the current path sensor and focused local runtime are green, but the uninterrupted route suite and remaining integrated evidence are incomplete and stop implementation
- **Depends/parallel:** Depends on F7-T1 passing. The affected workspace sensors and one read-only Reviewer run against the same integrated candidate; any contracted-path correction invalidates affected evidence, reruns the path sensor and resumes the same Reviewer after correction.
- **Paths:** Complete revision-14 candidate; `./evaluation.md`; transient Playwright `test-results/`; generated migration/route artifacts; all affected REST-client artifacts; [`../../../agents/implementation-reviewer-agent.md`](../../../agents/implementation-reviewer-agent.md).
- **Contract:** All `RF-01`–`RF-09`, `CA-01`–`CA-12`, `CA-16`–`CA-18` and `MV-01`–`MV-06`, `MV-08`; Spec Validation Contract and empty-environment migration boundary.
- **Outcome:** Core, Validation, Server and Web quality gates, clean migration, REST parity, local Mailpit runtime, real authenticated Playwright behavior, security/redaction checks and one independent Implementation Reviewer converge on a handoff-ready candidate.
- **Rules:** `documentation/agents/implementation-reviewer-agent.md`; `documentation/tooling.md`; `documentation/rules/code-conventions-rules.md`; `documentation/rules/core-package-rules.md`; `documentation/rules/validation-package-rules.md`; `documentation/rules/use-case-testing-rules.md`; `documentation/rules/server-app-layer-rules.md`; `documentation/rules/rest-layer-rules.md`; `documentation/rules/controllers-testing-rules.md`; `documentation/rules/database-layer-rules.md`; `documentation/rules/provision-layer-rules.md`; `documentation/rules/messaging-layer-rules.md`; `documentation/rules/ui-layer-rules.md` (including **Antipatterns to Avoid**); `documentation/rules/web-app-routing-rules.md`; `documentation/rules/widget-testing-rules.md`.
- **Exit:** Prepare `docker compose` PostgreSQL/Mailpit/MinIO/Inngest, verify `/health` and `/api/auth/ok`, explicitly seed only when required, start/stop only Server/Web processes used for validation, run every Spec command and coverage floor, execute the reduced applicable MV-01–MV-06 and local MV-08 scenarios with real request/response plus persistence/authorization evidence, inspect console/failed requests and exact URLs, verify every REST group, record fresh screenshots for every changed rendered state or explicit no-visual-delta decisions, activate exactly one read-only Implementation Reviewer after the path sensor, resolve every verified finding through the responsible Builder and same Reviewer, and route directly to [`conclude-spec`](../../../prompts/conclude-spec-prompt.md) only when the final handoff condition is true.

# Validation and handoff

The Orchestrator creates `./evaluation.md` at implementation kickoff. The rows below schedule evidence without duplicating the authoritative scenario steps in the Spec.

| Type | Scenario/surface | Criteria | Reference | Evidence target | Status |
| --- | --- | --- | --- | --- | --- |
| Automated | Complete affected-path map | `CA-01`–`CA-12`, `CA-16`–`CA-18` | Spec Technical Contract | `./evaluation.md` — `pnpm check:spec-implementation -- documentation/features/shared/refactor-auth-postgres-infra/spec.md` after F6 integration | `passed` |
| Automated | Core contracts and Identity use cases | `CA-03`, `CA-05`–`CA-09`, `CA-11`, `CA-11A`, `CA-17` | Spec Core Contract and Core Rule Pack | `./evaluation.md` — Core code, architecture, types, unit and coverage commands plus provider-import scan | `passed` |
| Automated | Shared Validation schemas | `CA-02`, `CA-03`, `CA-04`, `CA-05A`, `CA-08`, `CA-09`, `CA-11`, `CA-12` | Spec Validation Contract | `./evaluation.md` — Validation code, architecture and type commands plus consumer boundary assertions | `passed` |
| Automated | Server Better Auth, Identity, Communication and messaging | `CA-01`–`CA-12`, `CA-17` | Spec Server/Database/Messaging/Provision Contracts | `./evaluation.md` — server code, architecture, types, coverage, build and focused real PostgreSQL/controller/job tests | `passed` |
| Automated | Web auth, SSR, widgets and mocked routes | `CA-03`, `CA-04`, `CA-05A`, `CA-06`–`CA-09`, `CA-18` | Spec Web Contract and UI/Route/Widget Rules | `./evaluation.md` — Web code, architecture, types, unit/coverage/build and focused mocked Playwright route suites | `passed` |
| REST client | Identity auth route group | `CA-01`, `CA-03`–`CA-09`, `CA-16` | `apps/server/rest-client/identity/auth.rest` | Compare every labeled request with auth controllers/shared schemas: cookie sign-in/session/logout/recovery/reset, methods/paths/headers/bodies, reusable non-secret variables and no Bearer credentials | `passed` |
| REST client | Identity establishment route group | `CA-03`, `CA-04`, `CA-17` | `apps/server/rest-client/identity/establishments.rest` | Compare every labeled request with establishment controllers and cookie/Origin contract; record route-complete parity and no credentials | `passed` |
| REST client | Identity registration-attempt route group | `CA-07`, `CA-08`, `CA-09` | `apps/server/rest-client/identity/registration-attempts.rest` | Compare onboarding/invitation token/password requests with current controllers/schemas, reusable variables and redacted examples | `passed` |
| REST client | Identity users route group | `CA-06`, `CA-08`, `CA-09`, `CA-17` | `apps/server/rest-client/identity/users.rest` | Compare every user list/detail/invite/correct/resend/cancel/profile/status/name request with controller routes and cookie/Origin headers | `passed` |
| REST client | MRP accompaniment-types route group | `CA-17` | `apps/server/rest-client/mrp/accompaniment-types.rest` | Verify every current route has one labeled cookie-authenticated request with current methods/paths/headers/bodies and no Bearer variable | `passed` |
| REST client | MRP products route group | `CA-17` | `apps/server/rest-client/mrp/products.rest` | Verify every current product/catalog/stock/recipe/production route and request shape against controllers/shared schemas with cookie transport | `passed` |
| REST client | PDV discounts route group | `CA-17` | `apps/server/rest-client/pdv/discounts.rest` | Verify every combo route and request shape against controllers/shared schemas with reusable non-secret variables and cookie transport | `passed` |
| REST client | PDV orders route group | `CA-17`, `CA-18` | `apps/server/rest-client/pdv/orders.rest` | Verify every order route, query/body, response example, auth header and stateful error example against controllers/shared schemas; record exact parity | `passed` |
| REST client | PDV sales-channels route group | `CA-17` | `apps/server/rest-client/pdv/sales-channels.rest` | Verify every sales-channel route and request shape with current cookie/Origin contract and no credentials | `passed` |
| REST client | Shared health route group | `CA-01`, `CA-12`, `CA-16`, `CA-18` | `apps/server/rest-client/shared/health.rest` | Verify `/health` and `/api/auth/ok` examples match current health/auth routes and show PostgreSQL/storage without external Auth dependency | `passed` |
| Automated | Clean migration and database runtime | `CA-02`, `CA-12` | Spec migration schema and environment contract | `./evaluation.md` — clean standard PostgreSQL migration, `prepare:false` and browser-env secret scan | `passed` |
| Automated | Removal/configuration gate | `CA-16` | Spec removal gate and F6-T2 | `./evaluation.md` — Compose config, CI/scripts/environment/lockfile/dependency scans and active Supabase/Bearer residue classification | `passed` |
| Runtime | `MV-01` — sign-in, SSR and current logout | `CA-03`, `CA-04`, `CA-06`, `CA-18` | Spec `MV-01`; local PostgreSQL/Server/Web | `./evaluation.md` — desktop and narrow browser evidence, exact URLs, HttpOnly cookie/storage inspection, persistence, keyboard path, console/network and fresh screenshots when visual output changes | `passed` |
| Runtime | `MV-02` — unavailable identity and hostile Origin | `CA-04`, `CA-05A`, `CA-18` | Spec `MV-02` | `./evaluation.md` — direct/form sign-in responses, unchanged session count, no cookie, sanitized body and unsafe-Origin rejection | `passed` |
| Runtime | `MV-03` — onboarding and Mailpit confirmation | `CA-07`, `CA-10`, `CA-11A`, `CA-18` | Spec `MV-03` | `./evaluation.md` — Portuguese Mailpit message, redacted event correlation, atomic activation, immediate cookie, old-token invalidation and browser state | `passed` |
| Runtime | `MV-04` — invitation, resend and acceptance | `CA-08`, `CA-10`, `CA-11A`, `CA-18` | Spec `MV-04` | `./evaluation.md` — old-token rejection, latest Mailpit message, atomic credential/local activation, audit and immediate session | `passed` |
| Runtime | `MV-05` — recovery and global revocation | `CA-09`, `CA-10`, `CA-11A`, `CA-18` | Spec `MV-05` | `./evaluation.md` — non-enumerating responses, one-hour token, audit, reset, replay/session failure and redaction | `passed` |
| Runtime | `MV-06` — device logout and inactivation | `CA-06`, `CA-18` | Spec `MV-06` | `./evaluation.md` — two browser contexts, current-only logout, global inactivation revocation and UI/database agreement | `passed` |
| Runtime | `MV-08` — local email, cookie and health smoke | `CA-10`, `CA-12`, `CA-18` | Spec `MV-08` | `./evaluation.md` — Mailpit delivery, local database configuration, exact cookie attributes, SSR behavior, hostile-Origin rejection and health surface | `passed` |
| Visual (conditional) | Auth state rendered output at desktop and narrow viewports | `CA-03`, `CA-06`–`CA-09`, `CA-18` | `documentation/design.md`; no supplied screenshot/manifest | No production markup or styling changed in this validation correction; fresh route screenshots were generated by the committed suite and the explicit no-visual-delta decision is recorded in `evaluation.md` | `not_applicable` |
| Review | Complete integrated candidate | All `RF-*`, `CA-*`, `MV-*`, REST groups and current evidence | [`Implementation Reviewer`](../../../agents/implementation-reviewer-agent.md) | The same read-only Implementation Reviewer rechecked revision 14 after the Playwright isolation and secondary-context corrections. The reviewer findings on live auth-state files and stale ledger entries were resolved; no blocking implementation finding remains. | `passed` |

Integrated validation runs in this order: integrate all Builder diffs and Orchestrator-owned artifacts; prepare standard PostgreSQL/Mailpit/MinIO/Inngest and required fixtures; generate the route tree; pass the complete Spec path sensor; run affected workspace and migration/removal sensors; execute mocked and real browser/runtime/manual evidence; inspect every REST artifact; activate exactly one read-only Implementation Reviewer; resolve and recheck every verified finding; then route directly to `conclude-spec`.

The final handoff condition is: all phases and tasks are `completed`; revision-14 commands are current on the integrated candidate; generated migration and route artifacts are reviewed; services, explicit seed accounts and fixtures are ready; every applicable `MV-*` is executable; transient evidence identifiers and every REST parity result are recorded; final path/tree conformance and all additional-screenshot decisions are resolved; the latest `pnpm check:spec-implementation -- documentation/features/shared/refactor-auth-postgres-infra/spec.md` passed after the last contracted-path correction; every affected REST-client artifact is present and route-complete; one Implementation Reviewer completed with every verified finding resolved and no blocking finding active; all workspace coverage floors pass without lowering them; and no production cutover, DNS change, source-backup removal or stale-Supabase rollback was performed.
