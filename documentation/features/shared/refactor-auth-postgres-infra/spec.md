---
title: Refactor authentication and PostgreSQL infrastructure
status: in_progress
revision: 14
source:
  type: issue
  ref: https://github.com/rafinel/scoops/issues/28
scope:
  - packages/core/src/identity
  - packages/core/src/communication
  - packages/core/src/shared
  - packages/core/package.json
  - packages/email
  - packages/validation/src
  - apps/server/src/identity
  - apps/server/src/communication
  - apps/server/src/shared
  - apps/server/rest-client
  - apps/server/package.json
  - apps/server/tsconfig.json
  - apps/server/tsconfig.build.json
  - apps/web/src
  - apps/web/tests
  - apps/web/package.json
  - package.json
  - pnpm-lock.yaml
  - .dependency-cruiser.mjs
  - .env.example
  - apps/server/.env.example
  - apps/web/.env.example
  - docker-compose.yaml
  - .github/workflows
  - scripts
  - volumes
  - AGENTS.md
  - documentation/architecture.md
  - documentation/rules
  - documentation/tooling.md
  - documentation/operations
last_updated_at: 2026-09-04
---

# Review cycle 1 — implementation correction

The delivery is reopened at revision `14` for implementation corrections requested on the open
delivery PR. The Contract is unchanged. The correction scope is limited to mapping Resend and SMTP
provider failures to the existing Core `EmailDeliveryUnavailableError`, and ensuring the auth-route
unavailable retry handler invalidates the router even when local access retry rejects.

Mapped review conversations:

- [Resend adapter comment](https://github.com/rafinel/scoops/pull/32#discussion_r3933976723) — `RF-05`, `CA-10`.
- [SMTP adapter comment](https://github.com/rafinel/scoops/pull/32#discussion_r3933976774) — `RF-05`, `CA-10`.
- [Auth retry comment](https://github.com/rafinel/scoops/pull/32#discussion_r3933976802) — Identity `REQ-13`, `RF-04`, `CA-18`.

# 1. Context and scope

## Objective and source

Replace Supabase Auth and the Supabase-shaped local stack with application-hosted Better Auth,
standard PostgreSQL locally and in integration tests, and Neon through `DATABASE_URL` in staging
and production. Preserve every approved Identity outcome while changing browser authentication
from readable Bearer tokens to server-issued `HttpOnly` cookies. Deliver Identity transactional
email through a Communication-owned provider boundary: SMTP/Mailpit locally and Resend in staging
and production.

This is a `complete` mode Spec derived from [GitHub issue
#28](https://github.com/rafinel/scoops/issues/28), the Identity and Communication PRDs, the approved
architecture amendment, and the repository's current implementation. It includes persistence,
security, cross-module messaging, and regression validation because these boundaries cannot be
safely delivered as independent partial contracts. The repository has no production or staging
data to preserve, so legacy Supabase-to-Neon cutover tooling is deliberately excluded from the
active implementation.

## Current state and gap

The current server delegates identity, credentials, email verification, recovery, invitations,
and sessions to Supabase Auth. Protected REST guards parse Bearer tokens. The browser initializes a
Supabase client, keeps provider session data readable in JavaScript, and injects the access token
through Axios. Local Compose and server CI start Supabase Auth, Kong, PostgREST, Meta, and Studio;
seed and controller fixtures call Supabase administration APIs; health checks include the external
Supabase service.

Scoops already stores establishments, local users, registration attempts, authorization state,
and immutable access audit records in PostgreSQL through Drizzle. `DATABASE_URL` and `postgres.js`
are already the persistence boundary, but the local database contains Supabase roles and schemas.
Communication has an Inngest
invitation job shell, but no email-provider contract or real delivery adapter.

The target removes the external authentication runtime without moving Identity business rules
into Better Auth. Better Auth owns credentials, verification records, provider identity, and
sessions in a dedicated schema. Scoops continues to own local status, profile, establishment
membership, tenant authorization, audit history, invitation lifecycle, and the last-active-Manager
rule. Communication owns message composition and delivery.

## Product and authority alignment

| Authority | Applicable contract | Consequence |
| --- | --- | --- |
| Issue #28 | Better Auth in NestJS; Neon when deployed; standard local PostgreSQL; cookie sessions; Supabase removal | Deliver the replacement infrastructure and preserve application behavior; legacy-data migration is excluded because no deployed data exists |
| Identity PRD `REQ-01` | Onboarding creates pending Identity state and confirms email before access | Keep the existing pending flow and immediate authenticated outcome after confirmation |
| Identity PRD `REQ-02` | Email/password sign-in, five-failure lockout, 30-minute idle expiry, seven-day maximum, multiple devices, current-device exit | Enforce these rules around Better Auth rather than adopting provider defaults |
| Identity PRD `REQ-03` | One-hour recovery link, global session revocation, three messages per 24 hours and two-minute spacing | Configure recovery and add provider-neutral quota persistence |
| Identity PRD `REQ-04` | Server-owned authorization and tenant scope | Resolve every Better Auth session to an active local Scoops account before authorization |
| Identity PRD `REQ-05` | Seven-day invitation, password choice, immediate access after acceptance | Keep the Scoops invitation attempt authoritative and issue the cookie only after completion |
| Identity PRD `REQ-08` | Inactivation immediately removes access and ends every session | Revoke Better Auth sessions and keep local status rejection authoritative |
| Identity PRD `REQ-09` | Exit ends only the current session | Map UI logout to current Better Auth session revocation |
| Identity PRD `REQ-13` | Existing loading, failure, responsive and accessible states | Preserve current pages and copy except token-query and transport mechanics |
| Communication PRD `REQ-01`, `REQ-04`, `REQ-05` | Identity messages use email with subject and Brazilian Portuguese HTML | Add Communication-owned templates and delivery adapters |
| Communication PRD `REQ-08` | Originating action completes only after mandatory communication is initiated | Await event publication; provider or broker failure prevents the successful action response |
| Architecture and Modules | Identity owns authentication facts; Communication owns communications; provider types stay behind adapters | Identity publishes typed facts and never imports `EmailProvider`, Resend, SMTP, or Mailpit |

The approved amendments do not change a product outcome, actor, permission, or PRD delivery
checkbox. They replace infrastructure and make an already documented Communication capability
concrete. No PRD amendment or requirement checkbox transition is part of this Spec.

## Approved decisions

- Better Auth is hosted by NestJS under `/api/auth/*` and pinned to `1.6.23` for this delivery.
  A later Better Auth upgrade is separate from this replacement.
- Better Auth uses the existing Drizzle/Postgres.js connection and a dedicated `better_auth`
  schema. Drizzle migrations are the only schema-history mechanism; Better Auth CLI output may be
  used as input for the reviewed Drizzle migration but must not apply schema directly.
- Authentication uses the `scoops.session_token` server cookie. Browser code cannot read, mirror,
  or persist its value. There are no access or refresh tokens in `AuthSession`.
- Deployed Web and API hosts share one registrable application domain. The cookie is scoped to that
  parent domain so both browser API requests and TanStack Start SSR requests can carry it. It is
  `Secure`, `HttpOnly`, and `SameSite=Lax`; local loopback cookies are non-secure.
- The web REST client uses credentials and never creates an `Authorization` header. TanStack Start
  server functions explicitly forward the incoming `Cookie` header only to the configured Scoops
  API and return sanitized account/session projections.
- SMTP through Mailpit is the only local email transport. Resend remains the staging/production
  adapter, but deployment-provider smoke evidence is outside this revision's validation scope.
  Better Auth Infrastructure is explicitly deferred.
- `EmailProvider` and its input/output structures belong only to Communication. Identity emits
  authoritative email-prepared domain events; it has no email-provider dependency.
- Onboarding confirmation and invitation acceptance preserve immediate authenticated access.
  Set-Cookie headers are forwarded only after the Scoops action finishes successfully.
- The database migration is Drizzle-managed for an empty pre-launch environment. No legacy data
  importer, cutover rehearsal, dual write, CDC, rollback checkpoint, or Supabase recovery command
  is included.
- Local Compose creates a new `scoops-postgres-data` volume for the standard PostgreSQL image. It
  does not reuse, delete, or mutate the existing `scoops-supabase-db-data` volume; that orphaned
  volume remains recoverable until a separately authorized cleanup.
- No social login, passwordless login, MFA, Better Auth Organizations, Better Auth admin roles,
  new Scoops profiles, UI redesign, database RLS, unrelated cleanup, or deployment automation is
  included.

## Product delivery boundaries

| Product authority | Delivery | Boundary |
| --- | --- | --- |
| Identity `REQ-01`–`REQ-05`, `REQ-08`, `REQ-09`, `REQ-13` | full infrastructure preservation | Every listed authentication, authorization, onboarding, recovery, invitation, access, session, and state outcome is a regression contract |
| Identity `REQ-10` recovery audit | full for this flow | Recovery initiation gains the already-required System audit without secret content; unrelated audit surfaces are regression-only |
| Communication `REQ-01`, `REQ-05`, `REQ-08` | partial | Deliver the channel/content/initiation foundation only for the Identity authentication messages in this Spec |
| Communication `REQ-04` | partial | Deliver onboarding confirmation, invitation/resend, and recovery; email-change, promotion/demotion, inactivation/reactivation, and establishment-exclusion messages remain deferred and are not weakened |
| Communication `REQ-02`, `REQ-03`, `REQ-06`, `REQ-07`, `REQ-09` | deferred | Stock, Billing, notification-center, read-state, and in-product history remain outside issue #28 |
| Issue #28 exclusions | excluded | social/passwordless/MFA/Organizations/new roles/product redesign/unrelated cleanup remain outside delivery |

# 2. Implementation Contract

## Functional requirements and source traceability

| ID | Source coverage | Requirement | Acceptance |
| --- | --- | --- | --- |
| `RF-01` | Issue #28 Scope 1–2 and AC 1–2; Architecture §§5,12 | Host exact-pinned Better Auth in NestJS with Drizzle models in `better_auth`, UUID identities, bcrypt credentials, and no provider SDK types in Core/Web business services. | `CA-01`, `CA-02` |
| `RF-02` | Issue #28 cookie/security AC; Identity `REQ-02`, `REQ-04` | Use server cookies for browser/SSR, exact origins, credentialed CORS, unsafe-method Origin validation, local eligibility before session creation, safe rotation, and no readable token. | `CA-03`–`CA-05A` |
| `RF-03` | Identity `REQ-02`, `REQ-03`, `REQ-08`, `REQ-09` | Enforce consecutive-failure lockout, rolling/absolute expiry, multiple devices, current exit, and global reset/inactivation revocation. | `CA-05`, `CA-06` |
| `RF-04` | Issue #28 behavior-preservation scope; Identity `REQ-01`–`REQ-05`, `REQ-08`, `REQ-09`, `REQ-13` | Preserve onboarding, sign-in, recovery, invitation, authorization, access status, session, and Portuguese state outcomes. | `CA-05A`, `CA-07`–`CA-09` |
| `RF-05` | User-approved Resend/Mailpit decision; Communication `REQ-01`, `REQ-04`, `REQ-05`, `REQ-08` partial | Persist prepared Identity email events transactionally and deliver onboarding, recovery, invitation, and resend HTML through Communication-only providers. | `CA-08`–`CA-11A` |
| `RF-06` | Issue #28 database scope and AC 3; Architecture §§5,13,19 | Use one `DATABASE_URL` with standard PostgreSQL locally/tests, Neon deployed, Postgres.js, and Drizzle-only history. | `CA-02`, `CA-12` |
| `RF-07` | Issue #28 migration scope and current deployment state | Keep schema evolution in reviewed Drizzle migrations; do not ship legacy-data cutover/import tooling for the empty pre-launch environments. | `CA-02`, `CA-16` |
| `RF-08` | Issue #28 removal scope and AC 1,7–8 | Remove active Supabase/Bearer services, dependencies, configuration, seeds, fixtures, CI, health, scripts, and volumes while preserving historical SDD truth. | `CA-16` |
| `RF-09` | Issue #28 AC 7–8; Architecture §17 | Prove Core, provider, database, controller, messaging, Web, migration, real-service browser, Neon, and Resend boundaries. | `CA-17`, `CA-18` |

## Acceptance criteria and evidence traceability

| ID | RF | Given | When | Then | Primary evidence |
| --- | --- | --- | --- | --- | --- |
| `CA-01` | `RF-01` | the Nest process starts | auth routes are requested | only `/ok`, `/sign-in/email`, and `/sign-out` are public before the parser; other provider routes are denied and no external Auth service exists | full AppModule HTTP suite |
| `CA-02` | `RF-01`, `RF-06` | clean standard PostgreSQL | committed migrations apply | public, Better Auth, controls, and outbox schemas are complete through Drizzle only | clean migration integration |
| `CA-03` | `RF-02` | valid active credentials | sign-in succeeds | the environment-correct `scoops.session_token` is set and its value appears in no JSON, storage, log, or client state | HTTP + browser storage inspection |
| `CA-04` | `RF-02` | trusted and untrusted origins | safe/unsafe cookie requests run | trusted requests work; missing/mismatched unsafe Origins fail before use cases | guard/CORS integration |
| `CA-05` | `RF-03` | one normalized account | five consecutive passwords fail, then time/success advances | the account locks for 15 minutes, responses do not enumerate, and success resets the counter | controlled-time provider integration |
| `CA-05A` | `RF-02`, `RF-04` | pending, inactive, missing-local, and inactive-establishment identities | direct Better Auth sign-in/session routes are called | no session/cookie is created and provider session lookup is not public | direct route integration |
| `CA-06` | `RF-03` | current and second-device sessions | REST/SSR activity, idle/absolute time, logout, reset, or inactivation occurs | idle rotates only to 30 minutes, absolute stays seven days, local exit affects one session, successful global actions affect all, and failed inactivation preserves status/audit/sessions/outbox | time/revocation transaction integration + Playwright |
| `CA-07` | `RF-04` | a valid pending onboarding | confirmation succeeds or retries after a partial failure | local activation precedes cookie delivery and retries do not duplicate state | Core/controller integration |
| `CA-08` | `RF-04`, `RF-05` | a pending seven-day invitation | invite/resend/accept executes | old links invalidate, outbox initiation commits atomically, token/password activates both stores, and cookie follows success | Core/controller/outbox/Mailpit tests |
| `CA-09` | `RF-04`, `RF-05` | known or unknown recovery email | request/reset executes | response is non-enumerating, all auth messages share 3/24h and 2-minute spacing, one-hour reset revokes all sessions, and known initiation is audited safely | use-case/provider/controller tests |
| `CA-10` | `RF-05` | prepared Identity email events | local jobs run | Mailpit receives equivalent Portuguese HTML with stable idempotency IDs; the Resend adapter remains covered by provider/job tests | Mailpit real flow + provider tests |
| `CA-11` | `RF-05` | the built dependency graph | imports are checked | Identity uses prepared events plus the independently injected Broker; Communication alone owns `EmailProvider`, templates, Resend, and SMTP; Broker is absent from database scopes | dependency-cruiser + import search |
| `CA-11A` | `RF-05` | an Identity mutation requiring email | commit, rollback, concurrent publication, failure, terminal recovery, and retry execute | the independently injected `InngestBroker` records the event through the active `DatabaseTransactionContext`; rollback sends nothing; non-Inngest `PublishEventJob` receives committed database notifications, reserves no more than 100 rows for five minutes, and sends directly through `InngestClient`; startup/reconnect draining and local/test reprocessing recover missed notifications; staging/production do not register the reprocessor; terminal failures signal, and guarded manual requeue is audited | transactional DB + Broker/publisher/reprocessor/CLI tests |
| `CA-12` | `RF-06` | local PostgreSQL URL | server connects | the local and integration clients use `DATABASE_URL` with `prepare:false`; no Neon SDK/browser secret exists | PostgreSQL integration + configuration tests |
| `CA-16` | `RF-08` | implementation is complete | active repository removal gate runs | runtime/config contains no Supabase or Bearer contract; historical SDD remains unchanged | search, Compose, lockfile, CI, health |
| `CA-17` | `RF-09` | cookie-backed fixtures | Identity/MRP/PDV controller suites run | authorization, profile, and tenant assertions remain green | complete server coverage |
| `CA-18` | `RF-09` | local real services and seeded users | required Playwright flows run | session, SSR, invitation, recovery, revocation, protected MRP/PDV, console, network, and persistence checks pass for the in-scope local scenarios | `MV-01`–`MV-08` |

## End-to-end runtime topology

1. NestJS starts with its default body parser disabled.
2. The Express adapter mounts `toNodeHandler(auth)` at `/api/auth/*splat` before installing
   `express.json()` and `express.urlencoded()` for Nest controllers.
3. Better Auth uses the shared Drizzle connection and the dedicated schema. It enables only
   email/password authentication and email verification; Organizations, social providers,
   passwordless plugins, MFA, and admin-role plugins stay disabled.
4. Better Auth endpoint hooks enforce account-failure and message quotas in database-backed
   controls. Built-in IP/path rate limiting remains enabled as defense in depth but is not treated
   as the PRD account lockout.
5. The browser Better Auth client calls the API with credentials. Business REST calls use the same
   credentials setting. No session accessor is allowed to inject a header.
6. `AuthenticationGuard` maps request cookies/headers to the provider-neutral session request,
   asks the Identity adapter for a Better Auth session, then executes the existing local-account
   resolution and authorization chain.
7. `GET /auth/session` remains the canonical Scoops account projection. Better Auth's session
   endpoint is provider infrastructure and does not replace local status/profile/tenant checks.
8. Identity creates or refreshes a verification/recovery/invitation action and calls the
   independently injected `Broker` inside the same Drizzle transaction. `InngestBroker.publish`
   stores the matching typed event in the shared transactional outbox through the active
   `DatabaseTransactionContext`; it makes no network call. The action
   completes only after that durable initiation commits. `PublishEventJob` listens for committed
   PostgreSQL notifications and publishes rows to Inngest through `InngestClient`; Communication
   renders and sends the message in a durable step through `EmailProvider`. `ReprocessEventsJob` is
   enabled only in local/test environments as the periodic recovery safety net.
9. The local Communication module selects SMTP only in `dev`/`test`; staging/production select
   Resend. Invalid mode/provider combinations fail environment validation at startup.

The public Better Auth handler uses an exact route allowlist: health, email/password sign-in, and
current sign-out. Direct provider session lookup, sign-up, verification-send, verification-consume,
password-recovery, password-reset, password-change, email-change, user-management, and plugin
routes are rejected. Scoops controllers call the server API programmatically after enforcing local
workflow, audit, quota, and compensation contracts. This prevents bypassing onboarding,
invitation, recovery, and authenticated-password-change rules through the catch-all handler.

Before Better Auth persists any new session, its session-create hook resolves the provider UUID to
the local user and establishment. It permits creation only when both are `Active`; every failure is
translated to the same non-enumerating sign-in result and produces no Set-Cookie header. The check
runs after valid credential verification and immediately before session insertion, so pending,
inactive, missing-local, and inactive-establishment identities cannot obtain a provider session.
Scoops `GET /auth/session` is the only public session/account authority.

## Session and cookie contract

| Concern | Contract |
| --- | --- |
| Cookie | `scoops.session_token`; `HttpOnly`; path `/`; `SameSite=Lax`; `Secure` outside loopback; parent application domain required in `stg`/`prod` and omitted locally |
| Browser transport | Axios and Better Auth fetch use credentials; no Authorization header, storage token, query token, or client-readable cookie |
| SSR transport | a TanStack Start server function reads the incoming `Cookie` header with the server API and forwards it only to `SCOOPS_SERVER_APP_URL`; it returns the sanitized Scoops session/account result |
| Trusted origins | exact configured Web origin plus the explicit localhost/127.0.0.1 development counterpart; no wildcard or reflected arbitrary origin |
| CSRF | Better Auth origin/CSRF checks for its endpoints plus a Nest `OriginGuard` for non-public unsafe application REST methods |
| Idle expiry | database and cookie expiry roll to 30 minutes after protected REST activity or SSR session restoration; refresh occurs no more frequently than the configured update age |
| Absolute expiry | guard rejects and revokes a session when `createdAt + 7 days <= now`, regardless of rolling expiry |
| Devices | each sign-in creates an independent session; no implicit single-device restriction |
| Logout | account page revokes the presented session only and expires the current cookie |
| Global revocation | password reset and user inactivation delete every session for the user; local inactive status independently denies any stale cookie |
| Response hygiene | provider token fields and raw Set-Cookie values are never serialized, logged, placed in events, or returned by `GET /auth/session` |

`BetterAuthSessionVerifier` is a server-only adapter, not a Core interface. It calls the pinned
Better Auth session API with request headers and `returnHeaders: true`, checks the immutable
`createdAt` absolute boundary, and returns `{ authUser, session, setCookieHeaders }` to the Nest
guard. The guard appends only parsed `scoops.session_token` Set-Cookie headers to the current HTTP
response; every other provider header is discarded. If the absolute boundary is reached, it
revokes the session and appends only the cookie-expiration header.

For browser-to-API requests, the browser processes that response cookie normally. For SSR, the
TanStack Start server function forwards the incoming cookie to `GET /auth/session`, reads all
`Set-Cookie` response values, validates their cookie name/domain/path/flags against this contract,
and appends the allowlisted values to the TanStack response headers. It never serializes those
values into server-function data. Tests advance time to prove ordinary REST and SSR requests move
only idle `expiresAt`; `createdAt` and the seven-day `absoluteExpiresAt` never move.

`AuthSession` contains only the provider-neutral authenticated user, session identifier, creation
time, idle expiry, and absolute expiry needed by application state. It contains no `accessToken` or
`refreshToken`. HTTP headers, cookies, response headers, and rotation metadata stay in the server
adapter and never enter Core.

## Identity journey contract

### Sign-in and session restoration

- `signIn({ email, password })` normalizes the email, checks the account lock, delegates password
  verification to Better Auth's configured bcrypt implementation, atomically records failures, and
  resets failures on success.
- Unknown email, missing credential, wrong password, and a locked account use non-enumerating
  public responses. Internally the locked response remains distinguishable for tests/metrics.
- The fifth consecutive failure establishes `lockedUntil = now + 15 minutes`. A request while
  locked cannot perform password verification. Expired locks may try again; success clears the row.
- Route middleware resolves the sanitized Scoops account through the server function on SSR and
  client transitions. Provider success with a missing, pending, or inactive local account is
  rejected and the presented session is revoked.

### Onboarding confirmation

- Registration still creates a pending establishment, pending local Manager, pending registration
  attempt, and matching Better Auth credential identity with the same UUID.
- Better Auth prepares an email-verification token with the existing onboarding expiry. Identity
  publishes an onboarding-confirmation-prepared event containing only the recipient facts, action
  URL, expiry, message ID, and required token-bearing URL. Logs must redact the URL query.
- Confirmation first inspects the verification token without consuming it, validates the matching
  Scoops attempt, and atomically activates local state. It then consumes the Better Auth token,
  marks the email verified, creates the session, and forwards Set-Cookie.
- If the local transaction fails, no cookie is forwarded and the provider token remains retryable.
  If provider completion fails after local activation, the retry recognizes the already activated
  local state and resumes provider completion. Duplicate successful requests return the same
  authenticated outcome or an already-confirmed redirect, never duplicate records.
- Correction and resend invalidate the superseded verification, prepare a new one, and retain the
  current operation-claim concurrency behavior.

### Invitation

- Inviting creates the Better Auth identity with an unusable generated credential and returns its
  UUID for the pending local user. The generated credential is never logged or emailed.
- Identity remains authoritative for the seven-day invitation token, pending user, corrections,
  resend/cancel claims, audit, and final activation. Each new/corrected/resend token invalidates the
  previous token before its prepared event is published.
- Communication sends invitation and resend messages through the same provider selection. The link
  is `/invitation/accept?confirmationToken=<token>` on the configured Web origin.
- Acceptance is a public Scoops action with schema `{ confirmationToken, password }`. The server
  validates and claims the invitation, sets the Better Auth credential through the Identity
  adapter, activates the local user/audit record, then signs in and forwards Set-Cookie. A local
  failure leaves the account unable to access the product and may be retried with the same token;
  no cookie is forwarded early.
- Cancellation removes the pending Better Auth identity only after the local operation claim is
  valid. Reactivation never invents a new credential.

### Recovery and access changes

- Recovery accepts an email without revealing existence through a Scoops-owned public controller
  and `RequestPasswordRecoveryUseCase`. A single database quota keyed by normalized identifier hash
  counts every onboarding, recovery, invitation, and resend authentication message together. It
  enforces at most three sends in a rolling 24-hour window and a minimum two-minute interval.
- For a known local user, recovery initiation writes the existing immutable access audit with the
  System actor and no token, URL, password, or recovery content. Unknown-email requests retain the
  same public response and create neither an email nor an identifiable audit row.
- The email action points to `/reset-password?token=<token>`. Route search validation rejects a
  missing or malformed token. Reset requires the password schema, consumes a one-hour token,
  replaces the bcrypt credential, revokes all sessions, expires any presented cookie, and returns
  to login without an authenticated session.
- Inactivation validates Manager permission, self-protection, target state, and the final-active-
  Manager invariant inside the serializable Identity transaction. The same transaction updates the
  local user/audit rows and deletes every target row from `better_auth.session` through the
  provider-neutral `AuthenticationSessionsRepository`, enqueues the existing
  `UserInactivatedEvent`, and reads the response audit projection. `InactivateUserUseCase` performs
  no fallible Broker/database/provider work after commit. A conflict or failure rolls back status,
  audit, sessions, and outbox together, so a failed response preserves the entire prior state; a
  successful response guarantees inactive local state, no Better Auth session, and durable event
  initiation.
- Every protected request still resolves the local account, so an inactive user is denied even if
  an abnormal cleanup failure leaves a stale database session row.

## Communication contract

Communication introduces these provider-neutral declarations:

```ts
export type EmailMessage = {
  idempotencyKey: string
  to: string
  subject: string
  html: string
}

export type EmailDelivery = {
  providerMessageId: string
}

export interface EmailProvider {
  send(message: EmailMessage): Promise<EmailDelivery>
}
```

Each exported type lives in its own file. Identity must not import these declarations. The three
Identity event families are `OnboardingConfirmationPreparedEvent`,
`PasswordRecoveryPreparedEvent`, and `UserInvitationPreparedEvent`; the invitation event carries
an `operation` discriminator for initial, corrected, and resent delivery. Validation owns one Zod
schema per event payload.

Communication jobs validate the event, render a Brazilian Portuguese HTML template, and call the
provider inside a named Inngest step. The job reads the Inngest event `id` supplied by the outbox
publisher and uses it as the provider idempotency key; the identity is transport metadata, not payload.
The Resend adapter passes it as the SDK idempotency key and throws an application
provider error when the SDK returns `error`. The SMTP adapter sends through Nodemailer with the
configured host/port and no TLS/auth for local Mailpit; it retains the idempotency key in the
message ID. Provider failures throw so Inngest retries them. No job logs the action URL, token,
credential, API key, raw provider response, or full recipient address.

Templates use React Email rendering, but the provider interface accepts final HTML and has no React
or provider type. The common layout and all Identity templates are owned by Communication. Plain
text, user-selected channels, delivery dashboards, Better Auth Infrastructure, and production SMTP
fallback are out of scope.

### Transactional event outbox

The existing Core `Broker` contract remains `publish(event: Event): Promise<void>` and exposes no
SQL, transaction, outbox, Inngest, or delivery concern. `InngestBroker` implements that contract as
a durable enqueue: it assigns one UUID and inserts one `pending` `public.events` row. When a
`DatabaseTransactionContext` is active, the insert uses its current Drizzle transaction; otherwise
it uses the shared Drizzle connection as a standalone operation. The broker is independently
injected into use cases and never belongs to `IdentityDatabaseScope`. Identity use cases that need
mutation/event atomicity call it inside `IdentityDatabase.run`, after the authoritative state is
prepared and before commit. A committed outbox row is the Communication PRD's durable initiation
boundary. A rolled-back business action has no row and cannot send a message.

The same shared contract records the existing `UserInactivatedEvent` with the status/audit/session
transaction so a Broker outage cannot turn a committed inactivation into a failed response. This
does not implement the deferred inactivation email; it only preserves the existing domain event and
the Identity PRD's failure semantics.

`PublishEventJob` is shared messaging infrastructure but is not an Inngest function. It owns a
long-lived PostgreSQL `LISTEN/NOTIFY` subscription through the `OutboxDatabase` interface. The
channel is `scoops_events`; the migration installs an `AFTER INSERT` trigger on `public.events`
that calls `pg_notify` with the event UUID, so notification occurs only after the outbox insert
commits. The notification payload identifies the event row but is not trusted as the event source.
On startup, reconnect, and notification, the job first reclaims expired `publishing` reservations,
then claims eligible `pending` rows with `FOR UPDATE SKIP LOCKED`, changes them to `publishing`, and
publishes each row directly through `InngestClient`, setting the external Inngest event `id` to
`events.id`. It must not call `Broker.publish`, because that would create a second event row. The
publisher marks a row `published` only after Inngest acknowledges the send. A failed attempt
increments `attempts`, records a safe error code, changes status to `failed`, and sets `available_at`
using the fixed backoff sequence 1, 5, 15, and 60 minutes, capped at 60 minutes. `ReprocessEventsJob`
changes eligible `failed` rows with `attempts < 10` back to `pending`; it also recovers an expired
`publishing` reservation to `pending` without incrementing the attempt count and explicitly wakes
the publisher after recovery. It is registered and scheduled only in local/test environments,
never staging/production. Rows with `attempts >= 10` remain terminal `failed` for operator action
and are excluded from automatic reprocessing.
Publication is at-least-once; the stable outbox/Inngest/provider idempotency key makes retries safe.
Inngest owns consumer retries after publication. A daily cleanup deletes only `published` rows older
than 30 days and never deletes `pending`, `publishing`, or `failed` rows. No separate delivery table
is created.

Each `PublishEventJob` execution reserves at most 100 rows for five minutes. `reserved_by` uses
`<instance-id>:<execution-id>` so a guarded update can prove reservation ownership. The jobs emit
a safe structured warning/metric signal when an event becomes terminal `failed`; the always-running
publisher also emits the oldest-eligible-pending signal when its drain observes an event exceeding
five minutes. The deployment's existing log/metric collection may
route those signals; configuring or adding an alert platform remains out of scope. Terminal events are reactivated only through the
guarded `events:requeue` administrative command with an event UUID, operator reference, and reason.
The command changes only terminal `failed` rows back to `pending`, resets `attempts` to zero and
`available_at` to the transaction timestamp, clears the safe error/reservation fields, never edits payload/name, and emits a
redacted structured audit record. Direct SQL reactivation is prohibited.

The outbox payload may contain the necessary one-time action URL, so database access and telemetry
follow credential-level handling: no payload logging, no report export, encrypted managed storage,
and bounded post-publication retention. Communication still exclusively owns `EmailProvider`,
templates, and provider selection; shared messaging owns only durable event transport.

`OutboxDatabase` is a provider-neutral shared Core contract. Core owns its declaration under
`packages/core/src/shared/interfaces/outbox-database.ts`; Server owns the runtime injection token,
Drizzle adapter, Postgres.js listener handle and Drizzle queries. The adapter exposes a teardown-safe
`listen`/`unlisten` lifecycle, drains pending rows in bounded batches, reclaims expired reservations,
and performs owner-guarded published/failed transitions. It never exposes Drizzle or provider types
to Core. Listener connection loss is logged as a safe infrastructure signal; postgres.js reconnects
and invokes the ready callback, which causes a fresh reservation recovery and drain. Nest module
shutdown always awaits `unlisten` before the database client closes.

The resulting interface is:

```ts
type OutboxDatabaseListener = { unlisten(): Promise<void> }

type OutboxEvent = {
  id: string
  eventName: string
  payload: Record<string, unknown>
  attempts: number
  reservedBy: string | null
  reservationExpiresAt: Date | null
}

interface OutboxDatabase {
  listen(
    onEvent: (eventId: string) => void,
    onReady: () => void,
    onError: (error: unknown) => void,
  ): Promise<OutboxDatabaseListener>
  reservePending(now: Date, owner: string, limit: 100): Promise<OutboxEvent[]>
  reclaimExpiredReservations(now: Date, owner: string): Promise<string[]>
  markPublished(eventId: string, owner: string, publishedAt: Date): Promise<boolean>
  markFailed(input: {
    eventId: string
    owner: string
    attempts: number
    availableAt: Date
    errorCode: string
    updatedAt: Date
  }): Promise<boolean>
  oldestPending(now: Date): Promise<Date | null>
  wake(eventIds: readonly string[]): Promise<void>
}
```

`OUTBOX_DATABASE` is the Server-only runtime injection token and is exported by
`SharedMessagingModule`; it is not part of the Core contract.
`DrizzleOutboxDatabase` binds that token and
implements the port with the shared Postgres.js/Drizzle infrastructure. `listen` uses the
`scoops_events` channel, forwards only the UUID payload to `onEvent`, invokes `onReady` on initial
connection and every reconnect, forwards connection failures to `onError`, and returns the
teardown handle. `reservePending` always uses the fixed limit `100`; `wake` emits one UUID-only
post-commit notification per supplied event ID without inserting an outbox row. Reprocessing and
manual requeue pass the IDs they changed to `wake` after their database transaction commits.

## Environment contract

| Variable | Boundary and rule |
| --- | --- |
| `DATABASE_URL` | Server only; standard PostgreSQL locally/tests and Neon pooled URL in staging/production |
| `BETTER_AUTH_SECRET` | Server only; minimum 32 characters; required in every mode |
| `BETTER_AUTH_COOKIE_DOMAIN` | Empty/absent on loopback; required shared parent domain in `stg`/`prod` |
| `SCOOPS_SERVER_APP_URL` | Canonical public API origin and Better Auth base URL |
| `SCOOPS_WEB_APP_URL` | Exact canonical Web origin and email-link origin |
| `VITE_SCOOPS_SERVER_APP_URL` | Browser-exposed exact API origin only; never contains a secret and must equal the public API origin |
| `SCOOPS_EMAIL_PROVIDER` | `smtp` in `dev`/`test`; `resend` in `stg`/`prod` |
| `SMTP_HOST`, `SMTP_PORT` | Local Mailpit connection; defaults `127.0.0.1` and `54325` |
| `RESEND_API_KEY` | Required only for `resend`; server secret |
| `EMAIL_FROM` | Required sender identity in every mode; a verified domain is required for Resend |

`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, browser Supabase variables, and
Supabase JWT settings are deleted. No legacy source credentials or cutover command is part of the
runtime or deployment configuration.

## Persistence and data model

All timestamps are `timestamptz`. Better Auth model field mapping is explicit in the adapter; Core
does not import these models.

| Table | Keys and columns | Constraints and lifecycle |
| --- | --- | --- |
| `better_auth.user` | `id text`; `name`; `email`; `email_verified`; `image?`; `created_at`; `updated_at` | UUID-text PK; case-insensitive unique email; UUID equals `public.users.id` for Scoops users |
| `better_auth.session` | `id text`; `token`; `user_id`; `expires_at`; `ip_address?`; `user_agent?`; `created_at`; `updated_at` | UUID-text PK; unique token; indexed user FK with cascade; no imported rows |
| `better_auth.account` | `id text`; `account_id`; `provider_id`; `user_id`; token columns nullable; `password?`; timestamps | UUID-text PK; unique provider/account pair; indexed user FK with cascade; only `credential` provider in scope |
| `better_auth.verification` | `id text`; `identifier`; `value`; `expires_at`; `created_at`; `updated_at` | UUID-text PK; indexed identifier; one-time verification/recovery records |
| `better_auth.rate_limit` | `key text`; `count`; `last_request` | PK key; Better Auth distributed endpoint/IP throttling storage |
| `better_auth.sign_in_attempt` | `identifier_hash text`; `failed_attempts`; `locked_until?`; `last_failed_at?`; `updated_at` | PK normalized-email hash; atomic increment/reset; no plaintext email |
| `better_auth.message_quota` | `identifier_hash text`; `window_started_at`; `sent_count`; `last_sent_at?`; `last_kind`; `updated_at` | PK normalized-email hash; all authentication-message kinds share one atomic 24-hour/two-minute quota |
| `public.events` | `id uuid`; `event_name`; `payload jsonb`; `status`; `occurred_at`; `available_at`; `published_at?`; `attempts`; `reserved_by?`; `reservation_expires_at?`; `last_error_code?`; `created_at`; `updated_at` | UUID PK/event id; explicit pending/publishing/published/failed state; same transaction as originating Identity mutation; at-least-once publication and 30-day published retention |

The migration creates the schema, tables, indexes, and foreign keys additively before any Supabase
removal. The shared Drizzle schema re-exports the Better Auth and outbox models from the
`apps/server/src/shared/database/drizzle/` tree so migrations and tests use one model set; every
outbox database models and persistence types are owned under
`apps/server/src/shared/database/drizzle/outbox/`; `DrizzleOutboxDatabase` is owned by the shared
Drizzle database boundary at `apps/server/src/shared/database/drizzle/drizzle-outbox-database.ts`.
The provider-neutral database contract is owned by Core under
`packages/core/src/shared/interfaces/`, and the Server-only injection token remains next to the
Server outbox infrastructure.
Database fixtures
reset both `public` and `better_auth` application tables without dropping schemas or the database.

### Exact migration schema

All `created_at`/`updated_at` columns below are `timestamptz NOT NULL DEFAULT now()` unless stated
otherwise. UUID-text IDs use a named UUID-format check because Better Auth expects string IDs while
`public.users.id` remains PostgreSQL `uuid`; there is intentionally no cross-type database FK
between them. The session eligibility hook enforces their equality for newly created sessions.

| `better_auth.user` column | SQL contract |
| --- | --- |
| `id` | `text PRIMARY KEY`, `better_auth_user_id_uuid_check` |
| `name` | `text NOT NULL` |
| `email` | `text NOT NULL` |
| `email_verified` | `boolean NOT NULL DEFAULT false` |
| `image` | `text NULL` |
| `created_at`, `updated_at` | standard timestamps |

Indexes/constraints: `better_auth_user_email_lower_unique_idx` is unique on `lower(email)`; the
adapter normalizes email before every lookup/write. No direct FK to `public.users` is created.

| `better_auth.session` column | SQL contract |
| --- | --- |
| `id` | `text PRIMARY KEY`, `better_auth_session_id_uuid_check` |
| `expires_at` | `timestamptz NOT NULL` |
| `token` | `text NOT NULL`, unique constraint `better_auth_session_token_unique` |
| `ip_address`, `user_agent` | `text NULL` |
| `user_id` | `text NOT NULL`, FK to `better_auth.user(id) ON DELETE CASCADE` |
| `created_at`, `updated_at` | standard timestamps; `created_at` is immutable absolute-age origin |

Index: `better_auth_session_user_id_idx` on `user_id`. Session refresh updates `expires_at` and
`updated_at`, never `created_at`.

| `better_auth.account` column | SQL contract |
| --- | --- |
| `id` | `text PRIMARY KEY`, `better_auth_account_id_uuid_check` |
| `account_id`, `provider_id` | `text NOT NULL` |
| `user_id` | `text NOT NULL`, FK to `better_auth.user(id) ON DELETE CASCADE` |
| `access_token`, `refresh_token`, `id_token`, `scope`, `password` | `text NULL` |
| `access_token_expires_at`, `refresh_token_expires_at` | `timestamptz NULL` |
| `created_at`, `updated_at` | standard timestamps |

Constraints/indexes: `better_auth_account_provider_account_unique` on
`(provider_id, account_id)` and `better_auth_account_user_id_idx` on `user_id`. This delivery writes
only `provider_id = 'credential'`; imported credential accounts use `account_id = user_id`.

| `better_auth.verification` column | SQL contract |
| --- | --- |
| `id` | `text PRIMARY KEY`, `better_auth_verification_id_uuid_check` |
| `identifier`, `value` | `text NOT NULL` |
| `expires_at` | `timestamptz NOT NULL` |
| `created_at`, `updated_at` | standard timestamps |

Index: `better_auth_verification_identifier_idx` on `identifier`. Single-use consumption deletes
the record in the same provider transaction that applies its effect.

| `better_auth.rate_limit` column | SQL contract |
| --- | --- |
| `key` | `text PRIMARY KEY` |
| `count` | `integer NOT NULL DEFAULT 0`, non-negative check |
| `last_request` | `bigint NOT NULL`, epoch milliseconds required by Better Auth `1.6.23` database rate-limit storage |

| `better_auth.sign_in_attempt` column | SQL contract |
| --- | --- |
| `identifier_hash` | `text PRIMARY KEY`, 64-lowercase-hex check |
| `failed_attempts` | `integer NOT NULL DEFAULT 0`, range check `0..5` |
| `locked_until`, `last_failed_at` | `timestamptz NULL` |
| `updated_at` | standard timestamp |

Index: `better_auth_sign_in_attempt_locked_until_idx` on non-null `locked_until`. Updates use one
row lock/atomic statement; success deletes the row, and expired unlocked zero rows may be cleaned.

| `better_auth.message_quota` column | SQL contract |
| --- | --- |
| `identifier_hash` | `text PRIMARY KEY`, 64-lowercase-hex check |
| `window_started_at` | `timestamptz NOT NULL` |
| `sent_count` | `integer NOT NULL DEFAULT 0`, range check `0..3` |
| `last_sent_at` | `timestamptz NULL` |
| `last_kind` | `text NOT NULL`, check in `verification`, `recovery`, `invitation` |
| `updated_at` | standard timestamp |

Index: `better_auth_message_quota_window_idx` on `window_started_at`. Reservation and outbox insert
share the Identity transaction; rollback restores the quota. A window older than 24 hours resets to
one, while an in-window send requires both `sent_count < 3` and two elapsed minutes.

| `public.events` column | SQL contract |
| --- | --- |
| `id` | `uuid PRIMARY KEY` and stable Inngest/provider idempotency identity |
| `event_name` | `text NOT NULL` |
| `payload` | `jsonb NOT NULL` |
| `status` | `event_status NOT NULL DEFAULT 'pending'`; enum `pending`, `publishing`, `published`, `failed` |
| `occurred_at`, `available_at` | `timestamptz NOT NULL` |
| `published_at` | `timestamptz NULL` |
| `attempts` | `integer NOT NULL DEFAULT 0`, non-negative check |
| `reserved_by`, `last_error_code` | `text NULL`; `reserved_by` follows `<instance-id>:<execution-id>` while publishing |
| `reservation_expires_at` | `timestamptz NULL`; exactly five minutes after reservation |
| `created_at`, `updated_at` | standard timestamps |

Indexes: partial `events_pending_available_idx` on `(available_at, created_at)` where status is
`pending`; partial `events_failed_available_idx` on `(available_at, attempts)` where status is
`failed` and attempts are below 10; partial `events_reservation_expiry_idx` on `reservation_expires_at`
where status is `publishing`; `events_published_at_idx` for cleanup. Event-name/payload runtime
validation occurs before publication. No FK crosses into a feature module.

A check constraint requires `reserved_by` and `reservation_expires_at` together only while status
is `publishing`; every other status requires both fields to be null. Publisher acknowledgements and
failures use guarded updates matching `id`, `status = 'publishing'`, and `reserved_by`.

Migration `0017_better_auth.sql` is produced once with
`pnpm --filter server exec drizzle-kit generate --name=better_auth`, reviewed for the dedicated
schema, named constraints/indexes, `ALTER TYPE user_audit_action ADD VALUE
'password-recovery-initiated'`, and outbox creation, then committed with its generated snapshot and
journal. Implementation must not hand-edit the snapshot or use Better Auth `migrate`, Drizzle
`push`, or provider runtime auto-migration.

The reviewed migration must append this notification contract after `public.events` exists; the
function is replaceable for reruns and the trigger is recreated idempotently. The UUID-only payload
keeps secrets and event data off the notification channel:

```sql
CREATE OR REPLACE FUNCTION public.notify_scoops_event_insert()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM pg_notify('scoops_events', NEW.id::text);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS events_notify_scoops_event_insert ON public.events;
CREATE TRIGGER events_notify_scoops_event_insert
AFTER INSERT ON public.events
FOR EACH ROW
EXECUTE FUNCTION public.notify_scoops_event_insert();
```

`pg_notify` is transactional: PostgreSQL delivers the notification only when the inserting
transaction commits. The trigger does not run on publisher state changes; `OutboxDatabase.wake(eventIds)`
uses the same channel after a committed recovery/requeue update so those rows are drained too.

## Legacy data migration boundary

No production or staging data exists for this pre-launch replacement. Consequently this delivery
does not include a Supabase source reader, public-data importer, Better Auth credential importer,
cutover report, maintenance-window runbook, rollback checkpoint, or post-write recovery command.
The deployment path applies the reviewed Drizzle migrations to an empty standard PostgreSQL or Neon
database and creates new Better Auth identities through the normal application flows. Any future
legacy-data migration is a separate authorized Spec with its own source backup, reconciliation,
rollback, and validation contract.

# 3. Technical Contract

## Current technical state

| Boundary | Repository evidence | Current state | Gap this Spec closes |
| --- | --- | --- | --- |
| Server identity provider | `apps/server/src/identity/provision/supabase/supabase-server-auth-provider.ts` | Nest delegates credentials, verification, user administration, and access-token validation to two Supabase clients | external Auth/gateway dependency, provider-shaped error/retry behavior, and no local session transaction |
| Web auth provider | `apps/web/src/provision/auth/supabase/supabase-auth-provider.ts` and `apps/web/src/provision/auth/auth-composition.ts` | browser SDK owns sessions/events and maps readable access/refresh tokens into Core state | tokens are readable by JavaScript and SSR/business REST depend on provider state |
| Protected REST | `apps/server/src/identity/rest/guards/authentication.guard.ts` and `apps/web/src/rest/axios/axios-rest-client.ts` | browser injects Bearer access token; server validates it remotely, then resolves local account | no server cookie, rolling server session, same-origin CSRF contract, or safe SSR rotation path |
| Persistence | `apps/server/src/shared/database/drizzle/drizzle-client.ts`, current migrations, and `docker-compose.yaml` | public business tables use Drizzle/Postgres.js, while Supabase Auth owns a separate managed schema and Compose exposes the Supabase stack | one reviewed Drizzle history must own business/auth/control/outbox schema on standard PostgreSQL and Neon |
| Identity transactions | `packages/core/src/identity/interfaces/identity-database.ts` and `apps/server/src/identity/database/drizzle/drizzle-identity-database.ts` | serializable local transactions expose module repositories only; independently injected infrastructure cannot reuse the active transaction | shared `DatabaseTransactionContext` plus transaction-scoped auth-session deletion are required for failure-without-state-change guarantees |
| Broker/messaging | `packages/core/src/shared/interfaces/broker.ts`, `apps/server/src/shared/messaging/inngest/inngest-broker.ts`, and `apps/server/src/app.module.ts` | `Broker.publish(event)` persists the outbox row; current publisher is a registered Inngest cron function | `InngestBroker` remains durable enqueue-only; non-Inngest `PublishEventJob` listens through a database interface and sends through `InngestClient`; root registers only the Inngest jobs, and excludes `ReprocessEventsJob` in staging/production |
| Communication | `apps/server/src/communication/messaging/inngest/jobs/send-invitation-email-job.ts` | invitation job validates and returns the event data but sends no message; no Communication Core/provider/template boundary exists | Communication-only interface, templates, Resend adapter, SMTP/Mailpit adapter, and durable delivery jobs |

## Cross-boundary contract map

| Boundary | Producer | Consumer | Canonical contract | Mapping/guarantees | Failure ownership |
| --- | --- | --- | --- | --- | --- |
| Browser sign-in/sign-out | Web Better Auth adapter | Nest-mounted Better Auth handler | exact `/api/auth/sign-in/email` and `/api/auth/sign-out` allowlist plus `scoops.session_token` | credentialed request; server-only HttpOnly cookie; response body never contains credential material | Better Auth adapter maps provider failures; Identity security controls own lock/eligibility; Web owns accessible feedback |
| Protected browser REST | browser REST client | Nest `AuthenticationGuard` and local authorization | credentialed HTTP, exact CORS/Origin policy, `GET /auth/session` projection | cookie → verified provider session → local active user/establishment → profile/tenant authorization | guard expires invalid cookie; Identity errors are sanitized; controller/use case owns business failure |
| Web SSR restoration | TanStack Start request/server function | Scoops `GET /auth/session` | incoming `Cookie` forwarding and allowlisted `Set-Cookie` propagation | only configured API origin; only `scoops.session_token`; sanitized result; idle rotates, absolute does not | Web server rejects malformed cookie headers/provider headers and returns unauthenticated/error state without serialization |
| Atomic Identity work | Identity use case inside `IdentityDatabase.run` | public/Better Auth tables plus independently injected `InngestBroker` | transaction-scoped repositories, `AuthenticationSessionsRepository`, `Broker.publish(Event)`, and active `DatabaseTransactionContext` | serializable one-database commit/rollback across local status/audit, auth sessions, and the single durable outbox row; Broker is absent from `IdentityDatabaseScope` | Identity use case owns invariants; Drizzle database/context owns retry/rollback; no fallible post-commit operation where failure must preserve state |
| Durable event publication | `PublishEventJob` over `public.events` and PostgreSQL notifications | database interface plus `InngestClient` | notification-triggered drain; direct `InngestClient.send` with `id: event.id`; never `Broker.publish` | batches of at most 100; five-minute reservation owned by `<instance-id>:<execution-id>`; startup/reconnect drain; external ID equals event-row UUID; guarded status transitions | shared messaging owns notification/listener lifecycle, recovery/terminal visibility and manual requeue; `ReprocessEventsJob` is local/test only; Inngest owns consumer retries; originating/consuming modules retain business ownership |
| Authentication email | Identity prepared event via Inngest | Communication job/template/`EmailProvider` | one Zod event schema per family and provider-neutral `EmailMessage` | Inngest event ID → email idempotency key; Portuguese escaped HTML; SMTP in dev/test, Resend in stg/prod | Communication maps template/provider errors and throws for durable retry; Identity owns recipient/action facts |
| Database runtime | environment validation | shared Drizzle client | one server-only `DATABASE_URL` | standard PostgreSQL locally/tests and Neon pooled URL deployed; Postgres.js `prepare:false`; no browser/database SDK | environment fails startup; database adapter owns connection/health; deployment operations own restore |

## Technical decisions

| Decision | Chosen approach | Alternative considered | Reason | Trade-off/control |
| --- | --- | --- | --- | --- |
| Authentication runtime | Better Auth exact-pinned in NestJS through shared Drizzle/PostgreSQL | retain hosted Supabase Auth or run another auth service | satisfies issue #28, removes gateway/service-key dependency, and enables one transactional store | version-sensitive hooks/schema require exact pin, adapter tests, and reviewed migration |
| Browser/SSR session transport | server-issued HttpOnly cookie plus sanitized Scoops session projection | readable Bearer tokens/local storage | eliminates JavaScript token handling and supports server authorization/session rotation | requires credentialed CORS, exact Origin checks, SSR cookie forwarding, and cookie-header allowlist |
| Deployed cookie topology | Web/API share parent application domain; `Secure`, `HttpOnly`, `SameSite=Lax` parent-domain cookie | unrelated domains with `SameSite=None`, or API host-only cookie | same-site security and Web SSR must both receive the cookie | broader subdomain scope is constrained to the application parent and exact deployed hosts/origins |
| Authentication email provider | Communication-owned SMTP/Mailpit in dev/test and Resend in stg/prod | Better Auth Infrastructure now or SMTP fallback in production | matches approved environment decision and keeps provider choice out of Identity | no production fallback; provider failure remains visible/retryable; managed infrastructure explicitly deferred |
| Message initiation reliability | `InngestBroker.publish` records one transactional `events` row through `DatabaseTransactionContext`; `PublishEventJob` listens after commit and sends through `InngestClient` with the stable UUID | direct after-commit publish or polling-only relay | Communication `REQ-08` and inactivation failure semantics require mutation/event atomicity without placing Broker in a database scope, while LISTEN/NOTIFY provides prompt dispatch | adds one notification channel/listener plus table and recovery/cleanup jobs; notifications can be lost and are covered by startup/reconnect draining and local/test reprocessing; at-least-once duplicates are controlled by stable idempotency; no delivery table |
| Publication trigger and recovery | committed PostgreSQL `LISTEN/NOTIFY` for prompt `PublishEventJob` dispatch; startup/reconnect drain; `ReprocessEventsJob` only local/test | one-minute Inngest cron for both publisher and reprocessor | event publishing should be immediate while staging avoids scheduled reprocessing runs | notification delivery is not durable; drain/requeue controls remain required; staging terminal failures require operator visibility/requeue |
| Publication reservation terminology and limits | five-minute `reservation`, maximum batch 100, `<instance-id>:<execution-id>` owner, safe terminal/backlog signals, guarded audited manual requeue | `lease` terminology and implementation-selected limits | approved language is clearer to operators and fixed limits make concurrency/recovery tests executable | long publications may be retried after five minutes; stable idempotency absorbs duplicates; external alert-platform provisioning remains out of scope |
| Migration strategy | reviewed Drizzle migrations applied to an empty standard PostgreSQL/Neon database | legacy-data importer, dual write, or CDC | no deployed data exists to migrate; normal application flows create new Better Auth identities | any future legacy migration requires a separate authorized Spec and recovery contract |
| PostgreSQL deployment | standard PostgreSQL local/tests and Neon pooled URL deployed through Postgres.js/Drizzle | Neon SDK/runtime branching | one portable `DATABASE_URL` and ORM history avoids environment-specific domain code | prepared statements disabled consistently; deployment smoke and restore drills are outside this revision's validation scope |

## Rule Pack

| Rule | Evaluated revision | Application |
| --- | --- | --- |
| `documentation/rules/code-conventions-rules.md` | approved working tree, 2026-08-31 | Kebab-case files, application errors, named declarations, no provider leakage |
+| `documentation/rules/core-package-rules.md` | approved working tree, 2026-09-02 | Identity contracts remain provider-neutral; `EmailProvider` belongs only to Communication; Broker exposes no transaction or outbox types |
| `documentation/rules/email-package-rules.md` | approved working tree, 2026-09-03 | Standalone Communication-owned React Email composition, public template exports, typed props, arrow-function declarations, rendering/delivery separation, and package validation |
| `documentation/rules/validation-package-rules.md` | `main@4ce2965` | Separate schemas for environment, REST bodies, route search, and event payloads |
| `documentation/rules/use-case-testing-rules.md` | `main@4ce2965` | Identity behavior is proved at Core with mocked contracts and deterministic time |
| `documentation/rules/server-app-layer-rules.md` | `main@4ce2965` | Nest modules/controllers only compose application and provider boundaries |
| `documentation/rules/rest-layer-rules.md` | approved working tree, 2026-08-31 | Cookie transport, SSR forwarding, exact Origin enforcement, REST examples |
| `documentation/rules/controllers-testing-rules.md` | `main@4ce2965` | Controller suites use production wiring plus controlled cookie/auth fixtures |
| `documentation/rules/database-layer-rules.md` | amended and user-approved, 2026-09-03 | Drizzle-only schema, shared `DatabaseTransactionContext`, Testcontainers PostgreSQL, transactional/idempotent writes, and the shared transport-persistence exception with required barrels/types |
| `documentation/rules/provision-layer-rules.md` | approved working tree, 2026-08-31 | Better Auth, Resend, and SMTP remain replaceable owning-module adapters |
| `documentation/rules/messaging-layer-rules.md` | amended and user-approved, 2026-09-03 | `InngestBroker` durable enqueue, one shared `events` table, non-Inngest database-triggered `PublishEventJob`, direct `InngestClient` publication, local/test-only reprocessing, Inngest consumer steps, retryable provider errors |
| `documentation/rules/ui-layer-rules.md` | approved working tree, 2026-08-31 | Auth context delegates, routes stay thin, existing feedback/accessibility remains |
| `documentation/rules/web-app-routing-rules.md` | `main@4ce2965` | Public/protected routing, validated token search, honest browser evidence |
| `documentation/rules/widget-testing-rules.md` | approved working tree, 2026-08-31 | Full auth-state/action matrices through application provider mocks |

## Dependency and version contract

| Workspace | Add | Remove/change |
| --- | --- | --- |
| Server | exact `better-auth@1.6.23`; `bcryptjs@3.0.3`; `resend@6.25.0`; `nodemailer@9.1.0`; workspace `@scoops/email` | remove `@supabase/supabase-js` and direct React Email/template runtime dependencies; remove server-side template JSX configuration |
| Web | exact `better-auth@1.6.23` | remove `@supabase/supabase-js` |
| Core | Communication exports and `#communication/*` import alias only | no runtime provider dependency |
| Root | updated lockfile and removal of Supabase key-generation script | no Neon SDK; keep `postgres` as the database driver |

Better Auth is exact-pinned because the adapter, hooks, table contract, and handler ordering are
version-sensitive. Resend's `{ data, error }` response is checked explicitly and its SDK
idempotency option is mandatory. Postgres.js is configured with `prepare: false` so local and Neon
pooled URLs share one connection behavior.

The Better Auth factory uses these explicit options for the pinned version:

| Option | Value/contract |
| --- | --- |
| `basePath` | `/api/auth` |
| `database` | `drizzleAdapter(database, { provider: 'pg', schema: betterAuthSchema })` |
| `advanced.database.generateId` | `'uuid'` for every Better Auth model |
| `advanced.cookiePrefix` | `'scoops'` |
| `advanced.crossSubDomainCookies` | enabled with `BETTER_AUTH_COOKIE_DOMAIN` only in `stg`/`prod`; disabled on loopback |
| `trustedOrigins` | exact normalized Web origins from the environment contract |
| `emailAndPassword` | enabled; password length 8–64; bcrypt `hash`/`verify`; reset expiry 3,600 seconds; revoke sessions on reset |
| `emailVerification` | required; one-time expiry aligned with the owning Scoops attempt; auto sign-in used only through the Scoops confirmation orchestration |
| `session` | `expiresIn: 1_800`, `updateAge: 300`, cookie cache disabled; seven-day absolute rejection remains in the Identity adapter/guard |
| `rateLimit` | enabled with database storage and default endpoint/IP defense; custom account/message controls remain authoritative |
| User features | direct change-email and delete-user disabled |
| Plugins | no Organizations, admin-role, social, passwordless, magic-link, email-OTP, or MFA plugin |

## Core relationships and resulting declarations

```text
Identity use case
  -> IdentityDatabase.run(scope)
       -> module repositories
       -> DatabaseTransactionContext binds the active Drizzle transaction
       -> independently injected Broker.publish(prepared Identity event)
            -> InngestBroker inserts one pending public.events row
  -> OnboardingIdentityProvider / UserAccessIdentityProvider /
     PasswordRecoveryIdentityProvider

Shared PublishEventJob
  -> PostgreSQL LISTEN/NOTIFY
  -> public.events
  -> InngestClient.send(Inngest typed event with id = eventRow.id)

Communication send job
  -> template renderer
  -> EmailProvider
       -> SmtpEmailProvider (dev/test)
       -> ResendEmailProvider (stg/prod)

AuthenticationGuard (server-only HTTP boundary)
  -> BetterAuthSessionVerifier
  -> ResolveAuthenticatedUserUseCase
  -> protected controller
```

The resulting Core auth structures are complete:

```ts
export type AuthSession = {
  sessionId: string
  user: AuthUser
  createdAt: Date
  expiresAt: Date
  absoluteExpiresAt: Date
}

export type AuthStateChange =
  | 'INITIAL_SESSION'
  | 'SIGNED_IN'
  | 'SIGNED_OUT'
  | 'SESSION_EXPIRED'

export type AuthStateChangeListener = (
  event: AuthStateChange,
  session: AuthSession | null,
) => void

export interface AuthProvider {
  signIn(credentials: AuthCredentials): Promise<AuthSession>
  getSession(): Promise<AuthSession | null>
  onAuthStateChange(listener: AuthStateChangeListener): () => void
  signOut(): Promise<void>
}
```

`AuthSession` dates are sanitized metadata, never a credential. The Web Better Auth adapter emits
the four application events after Scoops session responses/actions; it does not subscribe to or
expose raw provider-token changes.

`AuthSession` field schema:

| Field | Type | Required | Validation | Description |
| --- | --- | --- | --- | --- |
| `sessionId` | `string` | yes | non-empty opaque identifier; never logged | Provider-neutral session correlation identifier, not a bearer credential |
| `user` | `AuthUser` | yes | existing sanitized `AuthUser` contract | Authenticated external identity projection |
| `createdAt` | `Date` | yes | valid date and immutable | Absolute-lifetime origin |
| `expiresAt` | `Date` | yes | valid date after `createdAt`, at most 30 minutes after latest accepted activity | Rolling idle expiry exposed as metadata |
| `absoluteExpiresAt` | `Date` | yes | exactly `createdAt + 7 days` | Non-rolling maximum lifetime |

`EmailMessage` field schema:

| Field | Type | Required | Validation | Description |
| --- | --- | --- | --- | --- |
| `idempotencyKey` | `string` | yes | UUID string equal to the published `events`/Inngest identity | Stable delivery retry key supplied from transport metadata |
| `to` | `string` | yes | normalized valid email; never logged in full | Recipient selected by the authoritative Identity event |
| `subject` | `string` | yes | trimmed, non-empty, single line | Portuguese transactional subject |
| `html` | `string` | yes | non-empty rendered HTML with escaped dynamic values | Final provider-neutral email body |

`EmailDelivery` field schema:

| Field | Type | Required | Validation | Description |
| --- | --- | --- | --- | --- |
| `providerMessageId` | `string` | yes | trimmed and non-empty; safe only after redaction policy | Provider acknowledgement used for operational correlation, never domain state |

The complete resulting `UserAuditAction` declaration is:

```ts
export const UserAuditAction = {
  UserRegistered: 'user-registered',
  InvitationResent: 'invitation-resent',
  InvitationCancelled: 'invitation-cancelled',
  UserActivated: 'user-activated',
  ProfileChanged: 'profile-changed',
  UserInactivated: 'user-inactivated',
  UserReactivated: 'user-reactivated',
  UserNameChanged: 'user-name-changed',
  PasswordRecoveryInitiated: 'password-recovery-initiated',
} as const

export type UserAuditAction =
  (typeof UserAuditAction)[keyof typeof UserAuditAction]
```

Resulting value schema (all values are required members of the closed string union; no null,
unknown string, rename, or removal is accepted):

| Constant | Stored literal | Existing/new | Description |
| --- | --- | --- | --- |
| `UserRegistered` | `user-registered` | existing | pending/active user registration record |
| `InvitationResent` | `invitation-resent` | existing | invitation resend audit |
| `InvitationCancelled` | `invitation-cancelled` | existing | pending invitation cancellation audit |
| `UserActivated` | `user-activated` | existing | invitation/reactivation activation audit |
| `ProfileChanged` | `profile-changed` | existing | role/profile transition audit |
| `UserInactivated` | `user-inactivated` | existing | active-to-inactive access transition audit |
| `UserReactivated` | `user-reactivated` | existing | inactive-to-active access transition audit |
| `UserNameChanged` | `user-name-changed` | existing | user display-name correction audit |
| `PasswordRecoveryInitiated` | `password-recovery-initiated` | new | System-actor recovery initiation without email/token/URL content |

`userAuditActionModel` continues to derive the PostgreSQL enum from
`Object.values(UserAuditAction)`. Migration `0017_better_auth.sql` appends only
`password-recovery-initiated`; it does not recreate, reorder, rename, or remove any existing enum
value.

The resulting server-facing Core provider contracts are:

```ts
export interface OnboardingIdentityProvider {
  registerPendingIdentity(input: {
    email: string
    password: string
    name: string
    confirmationRedirectTo: string
  }): Promise<{
    authUser: AuthUser
    event: OnboardingConfirmationPreparedEvent
  }>
  prepareOnboardingConfirmation(input: {
    providerSubject: string
    confirmationRedirectTo: string
  }): Promise<OnboardingConfirmationPreparedEvent>
  inspectOnboardingConfirmation(token: string): Promise<AuthUser | undefined>
  completeOnboardingConfirmation(token: string): Promise<AuthUser>
  replacePendingIdentity(input: {
    providerSubject: string
    email: string
    password: string
    name: string
    confirmationRedirectTo: string
  }): Promise<{
    authUser: AuthUser
    event: OnboardingConfirmationPreparedEvent
  }>
  removeIdentity(providerSubject: string): Promise<void>
}

export interface UserAccessIdentityProvider {
  inviteIdentity(input: {
    email: string
    name: string
    invitationRedirectTo: string
  }): Promise<{ authUser: AuthUser; event: UserInvitationPreparedEvent }>
  correctPendingIdentity(input: {
    providerSubject: string
    email: string
    name: string
    invitationRedirectTo: string
  }): Promise<UserInvitationPreparedEvent>
  prepareInvitationResend(input: {
    providerSubject: string
    invitationRedirectTo: string
  }): Promise<UserInvitationPreparedEvent>
  setInvitationPassword(input: {
    providerSubject: string
    password: string
  }): Promise<AuthUser>
  getIdentityEmail(providerSubject: string): Promise<string | undefined>
  revokeSessions(providerSubject: string): Promise<void>
  removeIdentity(providerSubject: string): Promise<void>
}

export interface PasswordRecoveryIdentityProvider {
  preparePasswordRecovery(input: {
    providerSubject: string
    recoveryRedirectTo: string
  }): Promise<PasswordRecoveryPreparedEvent>
  resetPassword(input: { token: string; password: string }): Promise<AuthUser>
}

export interface ServerAuthProvider
  extends OnboardingIdentityProvider,
    UserAccessIdentityProvider,
    PasswordRecoveryIdentityProvider {}

export interface Broker {
  publish(event: Event): Promise<void>
}

export interface AuthenticationSessionsRepository {
  removeAllByProviderSubject(providerSubject: string): Promise<void>
}
```

The Identity database transaction scope gains only
`authenticationSessionsRepository: AuthenticationSessionsRepository`; Broker remains independently
injected. `DrizzleIdentityDatabase.run` establishes `DatabaseTransactionContext` around the scope,
so `InngestBroker.publish` can reuse the same PostgreSQL transaction without entering the scope.
The sessions repository is used only when local access state and session deletion must share that
transaction. `AuthIdentityProvider`,
`AuthSessionRequest`, cookie/header Core structures, and token-verification methods are removed.
Session verification/rotation belongs to `BetterAuthSessionVerifier` inside the server Identity
adapter.

Prepared-event payloads are exact and JSON-safe. Every listed field is required and non-null; no
payload accepts extra fields.

| Event | Field | Type | Validation/description |
| --- | --- | --- | --- |
| all three | `userId` | `string` | UUID equal to the Scoops/provider user identity |
| recovery, invitation | `establishmentId` | `string` | UUID of the owning establishment |
| all three | `email` | `string` | normalized valid recipient email; credential-level handling |
| all three | `name` | `string` | trimmed non-empty display name used only for template composition |
| all three | `actionUrl` | `string` | absolute `http` loopback or deployed `https` URL on exact `SCOOPS_WEB_APP_URL`; contains the one-time token and is never logged |
| all three | `expiresAt` | `string` | ISO 8601 date-time after `occurredAt`; journey-specific one-hour/seven-day/current-attempt expiry |
| all three | `occurredAt` | `string` | ISO 8601 date-time when Identity prepared the message |
| invitation only | `operation` | `'initial' \| 'corrected' \| 'resent'` | exact discriminator controlling template wording/metrics, not recipient policy |

New named errors are `AuthenticationAccountUnavailableError`, `AuthenticationTemporarilyLockedError`,
`AuthenticationMessageRateLimitedError`, `AuthenticationSessionExpiredError`,
`AuthenticationOriginRejectedError`, and `EmailDeliveryUnavailableError`.
REST maps them to the existing non-enumerating or service-unavailable shapes appropriate to the
journey; none contains provider payload or secret data.

Resulting use-case signatures that materially change are:

| Use case | `execute` request | Result/atomic responsibility |
| --- | --- | --- |
| `RegisterIceCreamShopUseCase` | existing onboarding input | pending local records plus prepared confirmation outbox row; compensate provider identity on rollback |
| `ConfirmIceCreamShopOnboardingUseCase` | `{ confirmationToken }` | idempotent active local state and verified `AuthUser`; controller creates/forwards session afterward |
| `CorrectIceCreamShopOnboardingEmailUseCase` | existing correction input | replacement provider identity/token plus local change/outbox in one transaction |
| `ResendIceCreamShopConfirmationUseCase` | existing resend input | shared quota plus new token/local attempt/outbox atomically |
| `InviteUserUseCase` | existing Manager invitation input | pending user/attempt/audit/outbox atomically with provider compensation |
| `CorrectUserInvitationUseCase` | existing correction input | corrected pending user/attempt/outbox atomically |
| `ResendUserInvitationUseCase` | existing resend input | invalidated old token, restarted expiry, quota, audit, and outbox atomically |
| `AcceptUserInvitationUseCase` | `{ confirmationToken, password }` | credential set plus active user/audit; returns `AuthUser`; controller creates/forwards session after success |
| `RequestPasswordRecoveryUseCase` | `{ email, recoveryRedirectTo }` | same public result for all emails; known user quota/audit/outbox atomically |
| `ResetPasswordUseCase` | `{ token, password }` | one-time credential reset and all-session revocation; no authenticated result |
| `InactivateUserUseCase` | existing Manager/target request | validate, change local status/audit, delete all Better Auth sessions, enqueue `UserInactivatedEvent`, and build the result inside one transaction; no fallible post-commit work |

## Layer and path ledger

Each path below has one owner and one disposition. Every entry is an exact file path; no directory
or wildcard owns implicit children.

### Core and Validation

| Path | Disposition | Required declarations/changes |
| --- | --- | --- |
| `packages/core/package.json` | Modify | export Communication structures/interfaces; add `#communication/*` alias |
| `packages/core/src/communication/domain/structures/email-message.ts` | Create | exact `EmailMessage` declaration |
| `packages/core/src/communication/domain/structures/email-delivery.ts` | Create | exact `EmailDelivery` declaration |
| `packages/core/src/communication/domain/structures/index.ts` | Create | Communication structure barrel |
| `packages/core/src/communication/interfaces/email-provider.ts` | Create | sole `EmailProvider` contract |
| `packages/core/src/communication/interfaces/index.ts` | Create | Communication interface barrel |
| `packages/core/src/communication/domain/errors/email-delivery-unavailable-error.ts` | Create | provider-neutral delivery failure |
| `packages/core/src/communication/domain/errors/index.ts` | Create | Communication error barrel |
| `packages/core/src/identity/domain/events/onboarding-confirmation-prepared-event.ts` | Create | stable event and exact payload |
| `packages/core/src/identity/domain/events/password-recovery-prepared-event.ts` | Create | stable event and exact payload |
| `packages/core/src/identity/domain/events/user-invitation-prepared-event.ts` | Create | stable event, operation discriminator, exact payload |
| `packages/core/src/identity/domain/events/index.ts` | Modify | export three prepared events |
| `packages/core/src/identity/domain/structures/auth-session.ts` | Modify | remove access/refresh tokens; add provider-neutral session timestamps/identity |
| `packages/core/src/identity/domain/structures/auth-state-change.ts` | Modify | remove Supabase-specific refresh semantics; preserve application states |
| `packages/core/src/identity/domain/structures/user-audit-action.ts` | Modify | add `PasswordRecoveryInitiated` without sensitive audit content |
| `packages/core/src/identity/domain/structures/index.ts` | Modify | export revised/new auth structures |
| `packages/core/src/identity/interfaces/auth-provider.ts` | Modify | cookie-based browser methods; no token input/output |
| `packages/core/src/identity/interfaces/auth-identity-provider.ts` | Remove | session/cookie verification moves to server-only adapter |
| `packages/core/src/identity/interfaces/onboarding-identity-provider.ts` | Modify | verification preparation/inspection/completion and idempotent compensation |
| `packages/core/src/identity/interfaces/user-access-identity-provider.ts` | Modify | invitation credential lifecycle and `revokeSessions` |
| `packages/core/src/identity/interfaces/password-recovery-identity-provider.ts` | Create | recovery preparation and one-time reset contract |
| `packages/core/src/identity/interfaces/server-auth-provider.ts` | Modify | compose the revised provider-neutral server capabilities |
| `packages/core/src/identity/interfaces/identity-database.ts` | Modify | transaction scope adds only the provider-neutral authentication sessions repository; Broker stays independently injected |
| `packages/core/src/identity/interfaces/authentication-sessions-repository.ts` | Create | provider-neutral transaction participant for atomic all-session deletion |
| `packages/core/src/identity/interfaces/index.ts` | Modify | export revised contracts; remove `AuthIdentityProvider` |
| `packages/core/src/identity/interfaces/identity-service.ts` | Modify | expose Scoops-owned recovery request/reset operations to Web |
| `packages/core/src/identity/domain/errors/authentication-account-unavailable-error.ts` | Create | local eligibility failure |
| `packages/core/src/identity/domain/errors/authentication-temporarily-locked-error.ts` | Create | five-failure lock response |
| `packages/core/src/identity/domain/errors/authentication-message-rate-limited-error.ts` | Create | shared email quota failure |
| `packages/core/src/identity/domain/errors/authentication-session-expired-error.ts` | Create | idle/absolute session expiry |
| `packages/core/src/identity/domain/errors/authentication-origin-rejected-error.ts` | Create | unsafe-origin rejection |
| `packages/core/src/identity/domain/errors/index.ts` | Modify | export new Identity auth errors |
| `packages/core/src/shared/interfaces/rest-client.ts` | Modify | remove `setAuthorization`; retain provider-neutral transport operations |
| `packages/core/src/identity/use-cases/accept-user-invitation-use-case.ts` | Modify | accept verified provider identity produced from token/password orchestration |
| `packages/core/src/identity/use-cases/confirm-ice-cream-shop-onboarding-use-case.ts` | Modify | idempotent local confirmation compatible with provider completion retry |
| `packages/core/src/identity/use-cases/register-ice-cream-shop-use-case.ts` | Modify | pending provider/local identity plus transactional confirmation outbox |
| `packages/core/src/identity/use-cases/correct-ice-cream-shop-onboarding-email-use-case.ts` | Modify | replacement identity/local state/outbox compensation |
| `packages/core/src/identity/use-cases/resend-ice-cream-shop-confirmation-use-case.ts` | Modify | shared quota, verification replacement, transactional outbox |
| `packages/core/src/identity/use-cases/invite-user-use-case.ts` | Modify | provider identity, pending local state, audit, outbox, compensation |
| `packages/core/src/identity/use-cases/correct-user-invitation-use-case.ts` | Modify | pending correction and replacement invitation outbox |
| `packages/core/src/identity/use-cases/resend-user-invitation-use-case.ts` | Modify | shared quota, audit, token invalidation, outbox |
| `packages/core/src/identity/use-cases/inactivate-user-use-case.ts` | Modify | atomic local status/audit, session deletion, event enqueue, and response projection; remove post-commit Broker/read |
| `packages/core/src/identity/use-cases/request-password-recovery-use-case.ts` | Create | non-enumerating provider preparation, shared message quota, and System audit |
| `packages/core/src/identity/use-cases/reset-password-use-case.ts` | Create | consume provider token, replace credential, and globally revoke sessions |
| `packages/core/src/identity/use-cases/index.ts` | Modify | export revised/new use cases |
| `packages/core/src/identity/use-cases/tests/register-ice-cream-shop-use-case.test.ts` | Modify | provider/outbox commit and compensation matrix |
| `packages/core/src/identity/use-cases/tests/confirm-ice-cream-shop-onboarding-use-case.test.ts` | Modify | confirmation idempotency/partial retry matrix |
| `packages/core/src/identity/use-cases/tests/correct-ice-cream-shop-onboarding-email-use-case.test.ts` | Modify | replacement/outbox rollback matrix |
| `packages/core/src/identity/use-cases/tests/resend-ice-cream-shop-confirmation-use-case.test.ts` | Modify | global message quota/outbox matrix |
| `packages/core/src/identity/use-cases/tests/invite-user-use-case.test.ts` | Modify | pending identity/outbox/compensation matrix |
| `packages/core/src/identity/use-cases/tests/correct-user-invitation-use-case.test.ts` | Modify | replacement invitation matrix |
| `packages/core/src/identity/use-cases/tests/resend-user-invitation-use-case.test.ts` | Modify | token invalidation/quota/outbox matrix |
| `packages/core/src/identity/use-cases/tests/accept-user-invitation-use-case.test.ts` | Modify | password/provider/local retry matrix |
| `packages/core/src/identity/use-cases/tests/inactivate-user-use-case.test.ts` | Modify | commit changes all state once; every validation/outbox/conflict/read failure preserves status, audit, sessions, and event state |
| `packages/core/src/identity/use-cases/tests/request-password-recovery-use-case.test.ts` | Create | enumeration/quota/audit/outbox matrix |
| `packages/core/src/identity/use-cases/tests/reset-password-use-case.test.ts` | Create | single-use/global-revocation matrix |
| `packages/validation/src/environment/server-env-schema.ts` | Modify | Better Auth/cookie/email mode variables; remove Supabase runtime variables |
| `packages/validation/src/environment/browser-env-schema.ts` | Modify | retain only the Scoops API URL for auth transport |
| `packages/validation/src/identity/accept-user-invitation-schema.ts` | Modify | strict token plus password body |
| `packages/validation/src/identity/confirm-onboarding-schema.ts` | Modify | validated confirmation token contract |
| `packages/validation/src/identity/reset-password-schema.ts` | Create | token/password reset body and route-search composition |
| `packages/validation/src/communication/send-invitation-email-event-schema.ts` | Remove | retire stub event shape |
| `packages/validation/src/communication/onboarding-confirmation-prepared-event-schema.ts` | Create | exact runtime event schema |
| `packages/validation/src/communication/password-recovery-prepared-event-schema.ts` | Create | exact runtime event schema |
| `packages/validation/src/communication/user-invitation-prepared-event-schema.ts` | Create | exact runtime event schema |
| `packages/validation/src/index.ts` | Modify | export every new/revised boundary schema |

### Server Identity, database, REST, and fixtures

| Path | Disposition | Required declarations/changes |
| --- | --- | --- |
| `apps/server/src/identity/database/drizzle/models/better-auth-user-model.ts` | Create | exact user model |
| `apps/server/src/identity/database/drizzle/models/better-auth-session-model.ts` | Create | exact session model |
| `apps/server/src/identity/database/drizzle/models/better-auth-account-model.ts` | Create | exact account model |
| `apps/server/src/identity/database/drizzle/models/better-auth-verification-model.ts` | Create | exact verification model |
| `apps/server/src/identity/database/drizzle/models/better-auth-rate-limit-model.ts` | Create | exact rate-limit model |
| `apps/server/src/identity/database/drizzle/models/better-auth-sign-in-attempt-model.ts` | Create | exact account-lock model |
| `apps/server/src/identity/database/drizzle/models/better-auth-message-quota-model.ts` | Create | exact global message quota model |
| `apps/server/src/identity/database/drizzle/models/user-audit-action-model.ts` | Modify | include recovery-initiation enum value |
| `apps/server/src/identity/database/drizzle/models/index.ts` | Modify | export Better Auth/control models |
| `apps/server/src/identity/database/drizzle/repositories/drizzle-authentication-sessions-repository.ts` | Create | delete a subject's Better Auth sessions through the supplied Drizzle transaction |
| `apps/server/src/identity/database/drizzle/repositories/index.ts` | Modify | export the session repository with existing Identity repositories |
| `apps/server/src/identity/database/drizzle/drizzle-identity-database.ts` | Modify | establish `DatabaseTransactionContext` and construct only transaction-scoped Identity repositories, including `AuthenticationSessionsRepository` |
| `apps/server/src/identity/database/cutover/supabase-auth-reader.ts` | Remove | remove unused legacy Supabase source reader |
| `apps/server/src/identity/database/cutover/auth-credential-classifier.ts` | Remove | remove unused legacy credential classification |
| `apps/server/src/identity/database/cutover/better-auth-importer.ts` | Remove | remove unused legacy Better Auth importer |
| `apps/server/src/identity/database/cutover/better-auth-importer.test.ts` | Remove | remove importer-only tests with no deployed data source |
| `apps/server/src/identity/database/cutover/index.ts` | Remove | remove the legacy cutover export boundary |
| `apps/server/src/identity/provision/auth/better-auth.ts` | Create | pinned factory/options/Drizzle adapter |
| `apps/server/src/identity/provision/auth/better-auth-password.ts` | Create | bcrypt hash/verify |
| `apps/server/src/identity/provision/auth/better-auth-security-controls.ts` | Create | thin Better Auth callbacks that delegate lockout, message-quota, and session-eligibility decisions to Identity-owned application contracts |
| `apps/server/src/identity/provision/auth/better-auth-route-allowlist.ts` | Create | exact public endpoint allowlist |
| `apps/server/src/identity/provision/auth/better-auth-session-verifier.ts` | Create | server-only session/absolute-age/rotation adapter |
| `apps/server/src/identity/provision/auth/better-auth-server-auth-provider.ts` | Create | Core Identity lifecycle adapter |
| `apps/server/src/identity/provision/auth/index.ts` | Create | Better Auth provision exports |
| `apps/server/src/identity/provision/supabase/supabase-server-auth-provider.ts` | Remove | remove server Supabase implementation |
| `apps/server/src/identity/provision/identity-provision.module.ts` | Modify | register/export Better Auth provider for existing Identity tokens |
| `apps/server/src/identity/provision/index.ts` | Modify | export Better Auth provision boundary only |
| `apps/server/src/identity/constants/identity-providers.ts` | Modify | add Better Auth instance/session orchestration tokens without SDK types in Core |
| `apps/server/src/identity/rest/guards/authentication.guard.ts` | Modify | cookie/session verification plus local account resolution; no Bearer parser |
| `apps/server/src/identity/rest/guards/pending-authentication.guard.ts` | Remove | pending workflows authenticate their one-time token inside Scoops controllers |
| `apps/server/src/identity/rest/guards/origin.guard.ts` | Create | reject unsafe protected requests outside exact trusted origins |
| `apps/server/src/identity/rest/types/authenticated-request.ts` | Modify | local account plus server-only verified session metadata |
| `apps/server/src/identity/rest/types/pending-authenticated-request.ts` | Remove | remove Supabase pending-session request type |
| `apps/server/src/identity/decorators/current-auth-user.ts` | Remove | remove Supabase pending-session request projection |
| `apps/server/src/identity/decorators/index.ts` | Modify | remove deleted pending-auth decorator export |
| `apps/server/src/identity/rest/controllers/accept-user-invitation.controller.ts` | Modify | token/password/provider/local/session orchestration and Set-Cookie forwarding |
| `apps/server/src/identity/rest/controllers/confirm-ice-cream-shop-onboarding.controller.ts` | Modify | inspect/local-confirm/provider-complete/session orchestration |
| `apps/server/src/identity/rest/controllers/get-auth-session.controller.ts` | Modify | sanitized session/account projection only |
| `apps/server/src/identity/rest/controllers/request-password-recovery.controller.ts` | Create | public non-enumerating Scoops workflow endpoint |
| `apps/server/src/identity/rest/controllers/tests/request-password-recovery.controller.test.ts` | Create | enumeration, spacing, quota, audit, and outbox atomicity |
| `apps/server/src/identity/rest/controllers/reset-password.controller.ts` | Create | public validated token/password workflow endpoint |
| `apps/server/src/identity/rest/controllers/tests/reset-password.controller.test.ts` | Create | token lifecycle, password update, and global session revocation |
| `apps/server/src/identity/rest/controllers/register-ice-cream-shop-onboarding.controller.ts` | Modify | server-side Better Auth registration and prepared-confirmation orchestration |
| `apps/server/src/identity/rest/controllers/get-ice-cream-shop-onboarding.controller.ts` | Modify | pending token flow without provider access token |
| `apps/server/src/identity/rest/controllers/resend-ice-cream-shop-confirmation.controller.ts` | Modify | shared message quota and new prepared verification |
| `apps/server/src/identity/rest/controllers/correct-ice-cream-shop-onboarding-email.controller.ts` | Modify | replace provider identity/verification safely before publishing |
| `apps/server/src/identity/rest/controllers/invite-user.controller.ts` | Modify | create pending Better Auth identity and publish invitation preparation |
| `apps/server/src/identity/rest/controllers/correct-user-invitation.controller.ts` | Modify | replace pending address/token and publish corrected invitation |
| `apps/server/src/identity/rest/controllers/resend-user-invitation.controller.ts` | Modify | shared quota, token invalidation, and prepared resend |
| `apps/server/src/identity/rest/controllers/cancel-user-invitation.controller.ts` | Modify | remove pending Better Auth identity after valid operation claim |
| `apps/server/src/identity/rest/controllers/change-user-status.controller.ts` | Modify | return success only after atomic local status/audit and all-session transaction commits |
| `apps/server/src/identity/rest/controllers/index.ts` | Modify | export new and revised controllers |
| `apps/server/src/identity/fixtures/better-auth-fixture.ts` | Create | Testcontainers-backed users, credentials, sessions, cookies, time controls, and cleanup |
| `apps/server/src/identity/fixtures/supabase-auth-fixture.ts` | Remove | remove external gateway fixture |
| `apps/server/src/identity/fixtures/identity-module-fixture.ts` | Modify | consume `ServerAuthProvider` without token constants and expose cookie helpers |
| `apps/server/src/identity/identity.module.ts` | Modify | register Origin guard in the protected REST chain |

### Server Communication and application composition

| Path | Disposition | Required declarations/changes |
| --- | --- | --- |
| `apps/server/src/communication/constants/communication-providers.ts` | Create | Communication-only email DI token |
| `apps/server/src/communication/provision/email/resend/resend-email-provider.ts` | Create | Resend adapter and idempotency/error mapping |
| `apps/server/src/communication/provision/email/smtp/smtp-email-provider.ts` | Create | Nodemailer/Mailpit adapter |
| `apps/server/src/communication/provision/communication-provision.module.ts` | Create | environment-selected adapter registration |
| `apps/server/src/communication/messaging/inngest/jobs/send-onboarding-confirmation-email-job.ts` | Create | validated confirmation delivery job |
| `apps/server/src/communication/messaging/inngest/jobs/send-password-recovery-email-job.ts` | Create | validated recovery delivery job |
| `apps/server/src/communication/messaging/inngest/jobs/send-invitation-email-job.ts` | Modify | real validated invitation/resend delivery job |
| `apps/server/src/communication/messaging/inngest/jobs/send-identity-email-jobs.test.ts` | Create | trigger/step/retry/idempotency coverage |
| `apps/server/src/communication/messaging/inngest/jobs/index.ts` | Modify | export all three jobs |
| `apps/server/src/communication/messaging/communication-messaging.module.ts` | Modify | register jobs and Communication email provision |
| `apps/server/src/communication/communication.module.ts` | Modify | compose/export Communication-owned messaging/provision only |
| `apps/server/src/app.module.ts` | Modify | use SharedMessaging composition; always provide `PublishEventJob` without adding it to `InngestModule.forRoot({ functions })`; add `ReprocessEventsJob` as a provider and Inngest function only when the validated `SCOOPS_SERVER_APP_MODE` is `dev` or `test`; always register cleanup and feature send jobs |
| `apps/server/src/main.ts` | Modify | disable Nest body parser and delegate to shared HTTP bootstrap |
| `apps/server/src/configure-http-app.ts` | Create | handler-before-parser, Swagger cookie scheme, CORS, filters, and parsers |
| `apps/server/src/shared/rest/tests/rest-fixture.ts` | Modify | support parser ordering and Better Auth full-wiring tests |

### Shared persistence, operations, and cross-module server coverage

| Path | Disposition | Required declarations/changes |
| --- | --- | --- |
| `apps/server/src/shared/database/drizzle/schema.ts` | Modify | re-export Better Auth and outbox models through the one shared Drizzle schema; Server outbox models, persistence types and the adapter live under `apps/server/src/shared/database/drizzle/outbox/`, while the provider-neutral port lives in Core shared interfaces |
| `apps/server/src/shared/database/drizzle/drizzle-client.ts` | Modify | `prepare: false`, unchanged `DATABASE_URL`, transaction-context integration, health/lifecycle behavior, and safe listener access for the shared database adapter |
| `apps/server/src/shared/database/drizzle/database-transaction-context.ts` | Create | AsyncLocalStorage-backed `DatabaseTransactionContext` that binds and retrieves the current Drizzle transaction with nested reuse and concurrent isolation |
| `apps/server/src/shared/database/drizzle/database.module.ts` | Modify | provide and export the singleton `DatabaseTransactionContext` beside `DrizzleClient` for Identity and shared messaging |
| `apps/server/src/shared/database/drizzle/migrations/0017_better_auth.sql` | Generate | output of `pnpm --filter server exec drizzle-kit generate --name=better_auth`, reviewed for additive schema/tables/indexes/FKs plus the `scoops_events` channel function and `AFTER INSERT` trigger on `public.events`; never hand-edit snapshot drift |
| `apps/server/src/shared/database/drizzle/migrations/meta/0017_snapshot.json` | Generate | exact schema snapshot |
| `apps/server/src/shared/database/drizzle/migrations/meta/_journal.json` | Generate | append migration journal entry |
| `apps/server/src/shared/database/fixtures/database-fixture.ts` | Modify | reset public, Better Auth, and outbox tables safely |
| `apps/server/src/shared/database/drizzle/models/event-model.ts` | Create | exact shared `public.events` Drizzle model |
| `apps/server/src/shared/database/drizzle/models/event-status-model.ts` | Create | exact `pending`/`publishing`/`published`/`failed` PostgreSQL enum |
| `apps/server/src/shared/messaging/outbox/index.ts` | Create | root barrel for exported shared outbox declarations |
| `apps/server/src/shared/messaging/outbox/event-validation.ts` | Create | validates event names and serialized payloads before direct Inngest publication |
| `apps/server/src/shared/messaging/outbox/outbox-test-support.ts` | Create | shared PostgreSQL fixture helpers for outbox integration tests; no production contract |
| `apps/server/src/shared/database/drizzle/outbox/index.ts` | Create | barrel for shared outbox database declarations |
| `apps/server/src/shared/database/drizzle/outbox/types/entities/drizzle-event.ts` | Create | `DrizzleEvent` inferred from `eventModel`; persistence-only row type |
| `apps/server/src/shared/database/drizzle/outbox/types/entities/index.ts` | Create | barrel for outbox persistence entities |
| `apps/server/src/shared/database/drizzle/outbox/types/index.ts` | Create | barrel for outbox persistence types |
| `apps/server/src/shared/database/drizzle/drizzle-outbox-database.ts` | Create | `DrizzleOutboxDatabase` implements the Core `OutboxDatabase` contract with the notification, drain, reservation, recovery, wake and guarded-transition operations using shared Postgres.js/Drizzle infrastructure |
| `apps/server/src/shared/messaging/outbox/publish-event-job.ts` | Create | non-Inngest `PublishEventJob` subscribes through a database interface, drains after committed notifications/startup/reconnect, reserves at most 100 eligible rows for five minutes, and calls `InngestClient.send` directly with the stable event-row ID; never calls Broker |
| `apps/server/src/shared/messaging/outbox/tests/publish-event-job.test.ts` | Create | listener lifecycle, startup/reconnect/notification drain, batch bound, reservation ownership, crash/duplicate, signal, and terminal-failure coverage |
| `packages/core/src/shared/interfaces/outbox-database.ts` | Create | provider-neutral `OutboxDatabase` contract exposes notification subscription, pending-row drain/reservation, guarded publication transitions and recovery operations without leaking Drizzle/provider details |
| `packages/core/src/shared/interfaces/outbox-database-listener.ts` | Create | provider-neutral teardown contract for the outbox listener |
| `packages/core/src/shared/interfaces/outbox-event.ts` | Create | provider-neutral outbox event projection consumed by the publisher |
| `apps/server/src/shared/database/drizzle/outbox/outbox-database-token.ts` | Create | Server-only Nest runtime token for injecting the Core `OutboxDatabase` implementation |
| `apps/server/src/shared/database/cutover/cutover-table-order.ts` | Remove | remove unused legacy table allowlist |
| `apps/server/src/shared/database/cutover/cutover-report.ts` | Remove | remove unused legacy migration report |
| `apps/server/src/shared/database/cutover/cutover-conflict-error.ts` | Remove | remove unused legacy migration errors |
| `apps/server/src/shared/database/cutover/import-supabase-to-neon.ts` | Remove | remove unused legacy public-data importer |
| `apps/server/src/shared/database/cutover/index.ts` | Remove | remove the legacy cutover export boundary |
| `apps/server/src/shared/messaging/outbox/reprocess-events-job.ts` | Create | `ReprocessEventsJob` returns eligible failed and expired-publishing reservations to pending with a ten-attempt cap and fixed backoff; registration is local/test only |
| `apps/server/src/shared/messaging/outbox/tests/reprocess-events-job.test.ts` | Create | backoff eligibility, expired-reservation recovery, publisher wake-up, and terminal-failed exclusion coverage |
| `apps/server/src/shared/messaging/outbox/cleanup-published-events-job.ts` | Create | `CleanupPublishedEventsJob` applies 30-day published-only cleanup |
| `apps/server/src/shared/messaging/outbox/tests/cleanup-published-events-job.test.ts` | Create | retention boundary and non-published preservation coverage |
| `apps/server/src/shared/messaging/outbox/requeue-event.ts` | Create | guarded `events:requeue` CLI for one terminal event with required operator reference/reason, redacted audit log, and post-commit `OutboxDatabase.wake([eventId])` so the reactivated row is dispatched |
| `apps/server/src/shared/messaging/inngest/inngest-broker.ts` | Modify | implement `Broker.publish(event)` as one pending outbox insert through active `DatabaseTransactionContext` or standalone Drizzle connection; make no Inngest network call |
| `apps/server/src/shared/messaging/shared-messaging.module.ts` | Modify | import SharedDatabaseModule; bind `OUTBOX_DATABASE` to `DrizzleOutboxDatabase`; own/export Broker, Inngest client, `PublishEventJob` and cleanup/CLI declarations; do not provide or export `ReprocessEventsJob`, avoiding its construction outside local/test composition and avoiding an OutboxModule cycle |

The following working-tree paths are explicitly removed as part of the revision-8 consolidation:

| Path | Disposition | Required declarations/changes |
| --- | --- | --- |
| `apps/server/src/shared/database/outbox/drizzle-outbox-database.ts` | Remove | remove superseded outbox adapter location |
| `apps/server/src/shared/database/outbox/event-model.ts` | Remove | remove superseded event model location |
| `apps/server/src/shared/database/outbox/event-status-model.ts` | Remove | remove superseded event status model location |
| `apps/server/src/shared/database/outbox/index.ts` | Remove | remove superseded database outbox barrel |
| `apps/server/src/shared/database/outbox/outbox-database.ts` | Remove | remove superseded outbox port location |
| `apps/server/src/shared/database/outbox/types/entities/drizzle-event.ts` | Remove | remove superseded persistence type location |
| `apps/server/src/shared/database/outbox/types/entities/index.ts` | Remove | remove superseded persistence entity barrel |
| `apps/server/src/shared/database/outbox/types/index.ts` | Remove | remove superseded persistence type barrel |
| `apps/server/src/shared/messaging/inngest/jobs/cleanup-published-events-job.ts` | Remove | remove superseded worker location |
| `apps/server/src/shared/messaging/inngest/jobs/event-validation.ts` | Remove | remove superseded worker-support location |
| `apps/server/src/shared/messaging/inngest/jobs/index.ts` | Remove | remove superseded messaging job barrel |
| `apps/server/src/shared/messaging/inngest/jobs/outbox-test-support.ts` | Remove | remove superseded test-support location |
| `apps/server/src/shared/messaging/inngest/jobs/publish-event-job.ts` | Remove | remove superseded publisher location |
| `apps/server/src/shared/messaging/inngest/jobs/reprocess-events-job.ts` | Remove | remove superseded reprocessor location |
| `apps/server/src/shared/messaging/inngest/jobs/requeue-event.ts` | Remove | remove superseded requeue command location |
| `apps/server/src/shared/messaging/inngest/jobs/tests/cleanup-published-events-job.test.ts` | Remove | remove superseded cleanup test location |
| `apps/server/src/shared/messaging/inngest/jobs/tests/publish-event-job.test.ts` | Remove | remove superseded publisher test location |
| `apps/server/src/shared/messaging/inngest/jobs/tests/reprocess-events-job.test.ts` | Remove | remove superseded reprocessor test location |
| `apps/server/src/shared/messaging/inngest/jobs/tests/requeue-event.test.ts` | Remove | remove superseded requeue test location |

The revision-4 plural publisher files currently present in the uncommitted working tree
(`publish-events-job.ts` and `publish-events-job.test.ts`) are not baseline paths and are not
contracted declarations. The Builder must remove them while creating the singular replacement;
their disappearance is working-tree cleanup, not a new baseline `Remove` path.
| `apps/server/src/communication/templates/identity/email-layout.tsx` | Remove | move the shared email layout to `packages/email/templates/identity/` |
| `apps/server/src/communication/templates/identity/onboarding-confirmation-email.tsx` | Remove | move the onboarding template to `packages/email/templates/identity/` |
| `apps/server/src/communication/templates/identity/password-recovery-email.tsx` | Remove | move the recovery template to `packages/email/templates/identity/` |
| `apps/server/src/communication/templates/identity/user-invitation-email.tsx` | Remove | move the invitation template to `packages/email/templates/identity/` |

| `apps/server/src/shared/database/seed.ts` | Modify | seed Better Auth credentials/sessions through the Identity adapter; preserve fixed UUIDs |
| `apps/server/src/shared/rest/controllers/check-health.controller.ts` | Modify | database/storage only; remove external Auth HTTP check |
| `apps/server/src/shared/rest/controllers/tests/check-health.controller.test.ts` | Create | direct controller boundary coverage for healthy and unavailable database/storage dependencies |
| `apps/server/src/shared/rest/dtos/health-response.dto.ts` | Modify | remove Supabase service state |
| `apps/server/src/pdv/fixtures/pdv-module-fixture.ts` | Modify | consume Better Auth cookie fixture |

### Web authentication, routes, and browser tests

| Path | Disposition | Required declarations/changes |
| --- | --- | --- |
| `apps/web/src/constants/browser-env.ts` | Modify | remove Supabase URL/key and expose only Scoops API origin |
| `apps/web/src/provision/auth/better-auth/better-auth-client.ts` | Create | credentials-only browser client for allowed sign-in/sign-out routes |
| `apps/web/src/provision/auth/better-auth/better-auth-provider.ts` | Create | exact Core `AuthProvider` adapter and application event bridge |
| `apps/web/src/provision/auth/supabase/supabase-client.ts` | Remove | remove hash/session client |
| `apps/web/src/provision/auth/supabase/supabase-auth-provider.ts` | Remove | remove browser adapter |
| `apps/web/src/provision/auth/supabase/tests/supabase-auth-provider.test.ts` | Remove | remove obsolete provider tests |
| `apps/web/src/provision/auth/auth-composition.ts` | Modify | compose Better Auth and sanitized Scoops session service; no token accessor |
| `apps/web/src/rest/axios/axios-rest-client.ts` | Modify | `withCredentials: true`; remove session accessor and authorization setter behavior |
| `apps/web/src/rest/axios/utils/request.ts` | Modify | credentials-only requests and unchanged response mapping |
| `apps/web/src/rest/axios/utils/tests/request.test.ts` | Remove | remove the obsolete direct REST utility test; cookie transport is verified at the owning REST client and consuming widget/route boundaries |
| `apps/web/src/rest/services/identity-service.ts` | Modify | map recovery/reset to Scoops controllers instead of public Better Auth routes |
| `apps/web/src/server/auth/resolve-auth-session.ts` | Create | TanStack Start server function using `getRequestHeader('cookie')` and safe API forwarding |
| `apps/web/src/middlewares/require-auth-middleware.ts` | Modify | resolve sanitized Scoops account for SSR/client navigation and preserve return-to behavior |
| `apps/web/src/middlewares/require-manager-middleware.ts` | Modify | use the same sanitized SSR/client account resolution and preserve profile denial |
| `apps/web/src/ui/shared/contexts/auth-context/use-auth-context-provider.ts` | Modify | no readable-token lifecycle; preserve full state machine |
| `apps/web/src/ui/shared/contexts/auth-context/types/auth-context-value.ts` | Modify | revised session/actions without token access |
| `apps/web/src/ui/shared/contexts/rest-context/use-rest-context-provider.ts` | Modify | construct one credentialed client without auth accessor |
| `apps/web/src/ui/identity/hooks/use-login-action.ts` | Modify | Better Auth sign-in then Scoops session resolution |
| `apps/web/src/ui/identity/hooks/use-logout-action.ts` | Modify | current-session sign-out only |
| `apps/web/src/ui/identity/hooks/use-register-ice-cream-shop-action.ts` | Modify | Scoops onboarding endpoint only |
| `apps/web/src/ui/identity/hooks/use-confirm-ice-cream-shop-onboarding-action.ts` | Modify | query-token confirmation and immediate session resolution |
| `apps/web/src/ui/identity/hooks/use-resend-ice-cream-shop-confirmation-action.ts` | Modify | Scoops resend/quota errors |
| `apps/web/src/ui/identity/hooks/use-accept-user-invitation-action.ts` | Modify | send token/password once to Scoops endpoint |
| `apps/web/src/ui/identity/hooks/use-request-password-recovery-action.ts` | Modify | Scoops non-enumerating recovery endpoint |
| `apps/web/src/ui/identity/hooks/use-reset-password-action.ts` | Modify | Scoops token/password reset and login outcome |
| `apps/web/src/ui/identity/widgets/pages/accept-user-invitation-page/index.tsx` | Modify | token/password form result states |
| `apps/web/src/ui/identity/widgets/pages/accept-user-invitation-page/use-accept-user-invitation-page.ts` | Modify | validated query token and one submit |
| `apps/web/src/ui/identity/widgets/pages/accept-user-invitation-page/tests/accept-user-invitation-page.test.tsx` | Modify | accessible states |
| `apps/web/src/ui/identity/widgets/pages/accept-user-invitation-page/tests/use-accept-user-invitation-page.test.ts` | Modify | action/error/navigation matrix |
| `apps/web/src/ui/identity/widgets/pages/onboarding-confirmation-page/use-onboarding-confirmation-page.ts` | Modify | confirmation/session retry orchestration |
| `apps/web/src/ui/identity/widgets/pages/onboarding-confirmation-page/tests/use-onboarding-confirmation-page.test.ts` | Modify | success/expired/retry matrix |
| `apps/web/src/ui/identity/widgets/pages/reset-password-page/use-reset-password-page.ts` | Modify | route token and reset/login outcome |
| `apps/web/src/ui/identity/widgets/pages/reset-password-page/tests/use-reset-password-page.test.ts` | Modify | missing/expired/used/success matrix |
| `apps/web/src/ui/identity/widgets/pages/landing-page/use-landing-page.ts` | Modify | remove hash redirect parsing |
| `apps/web/src/ui/identity/widgets/pages/landing-page/tests/use-landing-page.test.ts` | Modify | cookie-based initial routing |
| `apps/web/src/routes/invitation/accept.tsx` | Modify | strict `confirmationToken` search validation |
| `apps/web/src/routes/onboarding/confirm.tsx` | Modify | shared confirmation-token validation; preserve no-token failure state |
| `apps/web/src/routes/reset-password/index.tsx` | Modify | strict Better Auth `token` search validation |
| `apps/web/tests/fixtures/identity-module-fixture.ts` | Modify | mock Better Auth endpoints/cookies and Scoops account projection, not Supabase storage |
| `apps/web/tests/routes/identity/index.test.ts` | Modify | landing cookie states |
| `apps/web/tests/routes/identity/login.index.test.ts` | Modify | sign-in cookie outcomes |
| `apps/web/tests/routes/identity/forgot-password.index.test.ts` | Modify | non-enumerating recovery |
| `apps/web/tests/routes/identity/reset-password.index.test.ts` | Modify | token query/reset outcomes |
| `apps/web/tests/routes/identity/onboarding.index.test.ts` | Modify | registration/resend states |
| `apps/web/tests/routes/identity/onboarding.confirm.test.ts` | Modify | confirmation query/session states |
| `apps/web/tests/routes/identity/invitation.accept.test.ts` | Modify | invitation query/password/session states |
| `apps/web/tests/routes/identity/app.index.test.ts` | Modify | protected session restoration |
| `apps/web/tests/routes/identity/access-denied.index.test.ts` | Modify | profile denial with sanitized session |
| `apps/web/tests/routes/identity/account.index.test.ts` | Modify | current-session exit |
| `apps/web/tests/routes/identity/shop-settings.index.test.ts` | Modify | Manager cookie authorization |
| `apps/web/tests/routes/identity/users.index.test.ts` | Modify | Manager cookie authorization |
| `apps/web/tests/routes/identity/users.$userId.test.ts` | Modify | status/revocation states |
| `apps/web/tests/auth.setup.ts` | Modify | create ignored Manager/Operator cookie storage states through real login |
| `apps/web/tests/auth-state.ts` | Modify | cookie-state paths and validation without localStorage tokens |

### Configuration, CI, REST examples, documentation, and deletions

| Path | Disposition | Required declarations/changes |
| --- | --- | --- |
| `apps/server/package.json` | Modify | dependencies plus the guarded `events:requeue` script; no legacy cutover scripts |
| `apps/server/tsconfig.json` | Modify | preserve the server compiler boundary after moving email JSX into the package |
| `apps/server/tsconfig.build.json` | Modify | preserve the server build boundary after moving email JSX into the package |
| `packages/email/package.json` | Create | private React Email package with the public templates export |
| `packages/email/tsconfig.json` | Create | strict package type-check boundary for the email templates |
| `packages/email/templates/index.ts` | Create | public email template exports |
| `packages/email/templates/identity/email-layout.tsx` | Create | shared accessible HTML layout |
| `packages/email/templates/identity/onboarding-confirmation-email.tsx` | Create | Portuguese confirmation template |
| `packages/email/templates/identity/password-recovery-email.tsx` | Create | Portuguese recovery template |
| `packages/email/templates/identity/user-invitation-email.tsx` | Create | Portuguese invitation/resend template |
| `documentation/rules/email-package-rules.md` | Create | package boundary, export, declaration, rendering, markup, and validation rules for Communication-owned email templates |
| `apps/web/package.json` | Modify | Better Auth client dependency and Supabase removal |
| `package.json` | Modify | remove Supabase key-generation script entry |
| `pnpm-lock.yaml` | Generate | match manifests exactly |
| `.dependency-cruiser.mjs` | Modify | register Communication Core subpaths and prohibit Identity-to-Communication/provider imports |
| `.env.example` | Modify | standard PostgreSQL/Mailpit Compose values only |
| `apps/server/.env.example` | Modify | Better Auth, cookie-domain, server/Web origins, SMTP/Resend variables; no real secrets |
| `apps/web/.env.example` | Modify | Scoops API URL only |
| `docker-compose.yaml` | Modify | `postgres:17-alpine` service with new `scoops-postgres-data` volume plus Mailpit/MinIO/Inngest; remove Auth/Kong/REST/Meta/Studio without deleting the old volume |
| `volumes/auth/templates/confirmation.html` | Remove | remove Supabase-managed template; Communication owns the replacement |
| `volumes/auth/templates/email_change.html` | Remove | remove unused Supabase-managed template |
| `volumes/auth/templates/invite.html` | Remove | remove Supabase-managed template; Communication owns the replacement |
| `volumes/auth/templates/magic_link.html` | Remove | remove unused Supabase-managed template |
| `volumes/auth/templates/recovery.html` | Remove | remove Supabase-managed template; Communication owns the replacement |
| `volumes/db/jwt.sql` | Remove | remove Supabase JWT bootstrap |
| `volumes/db/roles.sql` | Remove | remove Supabase role bootstrap |
| `volumes/kong/kong.yml` | Remove | remove Supabase gateway configuration |
| `scripts/generate-supabase-keys.mjs` | Remove | remove obsolete local JWT helper |
| `scripts/tests/generate-supabase-keys.test.mjs` | Remove | remove obsolete helper test |
| `.github/workflows/server-app-ci.yml` | Modify | no Supabase service/log step; Testcontainers PostgreSQL and normal server checks |
| `.github/workflows/web-app-ci.yml` | Modify | Better Auth/cookie mocked route suite terminology and prerequisites |
| `apps/server/rest-client/identity/auth.rest` | Modify | cookie login/session/logout/recovery examples and no Bearer variable |
| `apps/server/rest-client/identity/establishments.rest` | Modify | cookie variable/header example |
| `apps/server/rest-client/identity/registration-attempts.rest` | Modify | token/password invitation and onboarding examples |
| `apps/server/rest-client/identity/users.rest` | Modify | cookie-protected examples |
| `apps/server/rest-client/mrp/accompaniment-types.rest` | Modify | cookie-protected examples |
| `apps/server/rest-client/mrp/products.rest` | Modify | cookie-protected examples |
| `apps/server/rest-client/pdv/discounts.rest` | Modify | cookie-protected examples |
| `apps/server/rest-client/pdv/orders.rest` | Modify | cookie-protected examples |
| `apps/server/rest-client/pdv/sales-channels.rest` | Modify | cookie-protected examples |
| `apps/server/rest-client/shared/health.rest` | Modify | database/storage health plus `/api/auth/ok`; no Supabase dependency |
| `documentation/operations/supabase-to-neon-cutover.md` | Remove | remove the unused legacy cutover runbook |

The authority documents amended before this Spec are recorded in Section 5 and are not repeated in
the implementation ledger. Closed Specs, Plans, Evaluations, and evidence files are historical and
must not be rewritten merely to remove the word Supabase.

## Error, security, and observability contract

- Known Better Auth, email, quota, and configuration failures translate to named
  application errors. Provider bodies and stack traces never cross REST.
- Authentication responses do not distinguish unknown email from incorrect password. Password
  hashing is still performed for unknown identities to reduce timing disclosure.
- Cookie/session IDs, password hashes, reset/verification/invitation tokens, token-bearing URLs,
  Resend keys, SMTP credentials, database URLs, and full email addresses are redacted from logs,
  events diagnostics, reports, and test snapshots.
- Metrics/log fields may include safe operation name, provider name, duration, outcome, HTTP status,
  attempt count bucket, event ID, and irreversible identifier digest.
- Event publication emits a safe structured terminal-failure warning/metric immediately and an
  oldest-pending warning/metric once eligible age exceeds five minutes. Tests prove emission;
  existing deployment collection may route the signals, but new alert-platform configuration is
  not required. Neither signal includes event payload, recipient, action URL, or token.
- Better Auth/email calls have bounded timeouts. Resend and Inngest retries use stable idempotency
  identifiers. A provider error is never reported as a successful initiation/delivery.
- `/health` proves PostgreSQL and object storage readiness. `/api/auth/ok` proves the Better Auth
  handler is mounted; neither endpoint performs a paid/external email send.

### Server REST regression-test affected paths

Every existing file below is a `modify` disposition. Identity files replace Bearer setup and add
cookie, Origin, quota, retry, and provider/local consistency assertions as applicable. MRP and PDV
files replace only the shared authenticated-request fixture with `BetterAuthFixture` cookies and
retain their existing business assertions. The two new Identity controller tests are declared
separately in the automated-test structure that follows.

| Path | Disposition | Required change |
| --- | --- | --- |
| `apps/server/src/identity/rest/controllers/tests/accept-user-invitation.controller.test.ts` | Modify | cookie, Origin, retry, and immediate-session assertions |
| `apps/server/src/identity/rest/controllers/tests/cancel-user-invitation.controller.test.ts` | Modify | cookie authentication and provider cleanup assertions |
| `apps/server/src/identity/rest/controllers/tests/change-establishment-name.controller.test.ts` | Modify | cookie authentication regression |
| `apps/server/src/identity/rest/controllers/tests/change-own-user-name.controller.test.ts` | Modify | cookie authentication regression |
| `apps/server/src/identity/rest/controllers/tests/change-user-profile.controller.test.ts` | Modify | cookie authentication regression |
| `apps/server/src/identity/rest/controllers/tests/change-user-status.controller.test.ts` | Modify | cookie auth and all-session revocation assertions |
| `apps/server/src/identity/rest/controllers/tests/confirm-ice-cream-shop-onboarding.controller.test.ts` | Modify | token, retry, outbox, and immediate-session assertions |
| `apps/server/src/identity/rest/controllers/tests/correct-ice-cream-shop-onboarding-email.controller.test.ts` | Modify | replacement token/provider/outbox assertions |
| `apps/server/src/identity/rest/controllers/tests/correct-user-invitation.controller.test.ts` | Modify | replacement invitation/outbox assertions |
| `apps/server/src/identity/rest/controllers/tests/correct-user-name.controller.test.ts` | Modify | cookie authentication regression |
| `apps/server/src/identity/rest/controllers/tests/get-auth-session.controller.test.ts` | Modify | sanitized cookie session and rotation assertions |
| `apps/server/src/identity/rest/controllers/tests/get-establishment-settings.controller.test.ts` | Modify | cookie authentication regression |
| `apps/server/src/identity/rest/controllers/tests/get-ice-cream-shop-onboarding.controller.test.ts` | Modify | one-time-token pending flow assertions |
| `apps/server/src/identity/rest/controllers/tests/get-user-details.controller.test.ts` | Modify | cookie authentication regression |
| `apps/server/src/identity/rest/controllers/tests/invite-user.controller.test.ts` | Modify | cookie auth, quota, audit, provider, and outbox assertions |
| `apps/server/src/identity/rest/controllers/tests/list-users.controller.test.ts` | Modify | cookie authentication regression |
| `apps/server/src/identity/rest/controllers/tests/register-ice-cream-shop-onboarding.controller.test.ts` | Modify | provider, quota, and outbox assertions |
| `apps/server/src/identity/rest/controllers/tests/resend-ice-cream-shop-confirmation.controller.test.ts` | Modify | shared quota and token invalidation assertions |
| `apps/server/src/identity/rest/controllers/tests/resend-user-invitation.controller.test.ts` | Modify | shared quota, audit, and token invalidation assertions |
| `apps/server/src/mrp/rest/controllers/tests/add-recipe-ingredient.controller.test.ts` | Modify | Better Auth cookie fixture regression |
| `apps/server/src/mrp/rest/controllers/tests/adjust-product-stock.controller.test.ts` | Modify | Better Auth cookie fixture regression |
| `apps/server/src/mrp/rest/controllers/tests/change-product-categories.controller.test.ts` | Modify | Better Auth cookie fixture regression |
| `apps/server/src/mrp/rest/controllers/tests/change-product-unit.controller.test.ts` | Modify | Better Auth cookie fixture regression |
| `apps/server/src/mrp/rest/controllers/tests/create-accompaniment-type.controller.test.ts` | Modify | Better Auth cookie fixture regression |
| `apps/server/src/mrp/rest/controllers/tests/get-product-accompaniments.controller.test.ts` | Modify | Better Auth cookie fixture regression |
| `apps/server/src/mrp/rest/controllers/tests/get-product-category-removal-impact.controller.test.ts` | Modify | Better Auth cookie fixture regression |
| `apps/server/src/mrp/rest/controllers/tests/get-product-pricing.controller.test.ts` | Modify | Better Auth cookie fixture regression |
| `apps/server/src/mrp/rest/controllers/tests/get-product-recipe.controller.test.ts` | Modify | Better Auth cookie fixture regression |
| `apps/server/src/mrp/rest/controllers/tests/get-product-removal-impact.controller.test.ts` | Modify | Better Auth cookie fixture regression |
| `apps/server/src/mrp/rest/controllers/tests/get-product-settings.controller.test.ts` | Modify | Better Auth cookie fixture regression |
| `apps/server/src/mrp/rest/controllers/tests/get-product-stock.controller.test.ts` | Modify | Better Auth cookie fixture regression |
| `apps/server/src/mrp/rest/controllers/tests/link-product-accompaniment.controller.test.ts` | Modify | Better Auth cookie fixture regression |
| `apps/server/src/mrp/rest/controllers/tests/list-accompaniment-types.controller.test.ts` | Modify | Better Auth cookie fixture regression |
| `apps/server/src/mrp/rest/controllers/tests/list-products.controller.test.ts` | Modify | Better Auth cookie fixture regression |
| `apps/server/src/mrp/rest/controllers/tests/list-stock-transactions.controller.test.ts` | Modify | Better Auth cookie fixture regression |
| `apps/server/src/mrp/rest/controllers/tests/mrp-controller-test-helpers.ts` | Modify | issue cookie-authenticated requests; remove Bearer setup |
| `apps/server/src/mrp/rest/controllers/tests/preview-product-unit-change.controller.test.ts` | Modify | Better Auth cookie fixture regression |
| `apps/server/src/mrp/rest/controllers/tests/preview-production.controller.test.ts` | Modify | Better Auth cookie fixture regression |
| `apps/server/src/mrp/rest/controllers/tests/register-product-brand.controller.test.ts` | Modify | Better Auth cookie fixture regression |
| `apps/server/src/mrp/rest/controllers/tests/register-product-size.controller.test.ts` | Modify | Better Auth cookie fixture regression |
| `apps/server/src/mrp/rest/controllers/tests/register-production.controller.test.ts` | Modify | Better Auth cookie fixture regression |
| `apps/server/src/mrp/rest/controllers/tests/remove-accompaniment-type.controller.test.ts` | Modify | Better Auth cookie fixture regression |
| `apps/server/src/mrp/rest/controllers/tests/remove-product-accompaniment.controller.test.ts` | Modify | Better Auth cookie fixture regression |
| `apps/server/src/mrp/rest/controllers/tests/remove-product-brand.controller.test.ts` | Modify | Better Auth cookie fixture regression |
| `apps/server/src/mrp/rest/controllers/tests/remove-product-size.controller.test.ts` | Modify | Better Auth cookie fixture regression |
| `apps/server/src/mrp/rest/controllers/tests/remove-product.controller.test.ts` | Modify | Better Auth cookie fixture regression |
| `apps/server/src/mrp/rest/controllers/tests/remove-recipe-ingredient.controller.test.ts` | Modify | Better Auth cookie fixture regression |
| `apps/server/src/mrp/rest/controllers/tests/rename-accompaniment-type.controller.test.ts` | Modify | Better Auth cookie fixture regression |
| `apps/server/src/mrp/rest/controllers/tests/save-brand-resale-configuration.controller.test.ts` | Modify | Better Auth cookie fixture regression |
| `apps/server/src/mrp/rest/controllers/tests/save-recipe-yield.controller.test.ts` | Modify | Better Auth cookie fixture regression |
| `apps/server/src/mrp/rest/controllers/tests/save-single-resale-configuration.controller.test.ts` | Modify | Better Auth cookie fixture regression |
| `apps/server/src/mrp/rest/controllers/tests/set-primary-product-brand.controller.test.ts` | Modify | Better Auth cookie fixture regression |
| `apps/server/src/mrp/rest/controllers/tests/update-product-accompaniment.controller.test.ts` | Modify | Better Auth cookie fixture regression |
| `apps/server/src/mrp/rest/controllers/tests/update-product-brand.controller.test.ts` | Modify | Better Auth cookie fixture regression |
| `apps/server/src/mrp/rest/controllers/tests/update-product-settings.controller.test.ts` | Modify | Better Auth cookie fixture regression |
| `apps/server/src/mrp/rest/controllers/tests/update-product-size.controller.test.ts` | Modify | Better Auth cookie fixture regression |
| `apps/server/src/mrp/rest/controllers/tests/update-recipe-ingredient.controller.test.ts` | Modify | Better Auth cookie fixture regression |
| `apps/server/src/pdv/rest/controllers/tests/cancel-order.controller.test.ts` | Modify | Better Auth cookie fixture regression |
| `apps/server/src/pdv/rest/controllers/tests/combo-controller-test-helpers.ts` | Modify | issue cookie-authenticated requests; remove Bearer setup |
| `apps/server/src/pdv/rest/controllers/tests/create-combo.controller.test.ts` | Modify | Better Auth cookie fixture regression |
| `apps/server/src/pdv/rest/controllers/tests/create-sales-channel.controller.test.ts` | Modify | Better Auth cookie fixture regression |
| `apps/server/src/pdv/rest/controllers/tests/delete-combo.controller.test.ts` | Modify | Better Auth cookie fixture regression |
| `apps/server/src/pdv/rest/controllers/tests/delete-sales-channel.controller.test.ts` | Modify | Better Auth cookie fixture regression |
| `apps/server/src/pdv/rest/controllers/tests/get-combo.controller.test.ts` | Modify | Better Auth cookie fixture regression |
| `apps/server/src/pdv/rest/controllers/tests/get-order.controller.test.ts` | Modify | Better Auth cookie fixture regression |
| `apps/server/src/pdv/rest/controllers/tests/inactivate-combo.controller.test.ts` | Modify | Better Auth cookie fixture regression |
| `apps/server/src/pdv/rest/controllers/tests/inactivate-sales-channel.controller.test.ts` | Modify | Better Auth cookie fixture regression |
| `apps/server/src/pdv/rest/controllers/tests/list-active-sales-channels.controller.test.ts` | Modify | Better Auth cookie fixture regression |
| `apps/server/src/pdv/rest/controllers/tests/list-combo-products.controller.test.ts` | Modify | Better Auth cookie fixture regression |
| `apps/server/src/pdv/rest/controllers/tests/list-combos.controller.test.ts` | Modify | Better Auth cookie fixture regression |
| `apps/server/src/pdv/rest/controllers/tests/list-order-catalog.controller.test.ts` | Modify | Better Auth cookie fixture regression |
| `apps/server/src/pdv/rest/controllers/tests/list-orders.controller.test.ts` | Modify | Better Auth cookie fixture regression |
| `apps/server/src/pdv/rest/controllers/tests/list-sales-channels.controller.test.ts` | Modify | Better Auth cookie fixture regression |
| `apps/server/src/pdv/rest/controllers/tests/preview-order.controller.test.ts` | Modify | Better Auth cookie fixture regression |
| `apps/server/src/pdv/rest/controllers/tests/reactivate-combo.controller.test.ts` | Modify | Better Auth cookie fixture regression |
| `apps/server/src/pdv/rest/controllers/tests/reactivate-sales-channel.controller.test.ts` | Modify | Better Auth cookie fixture regression |
| `apps/server/src/pdv/rest/controllers/tests/register-order.controller.test.ts` | Modify | Better Auth cookie fixture regression |
| `apps/server/src/pdv/rest/controllers/tests/update-combo.controller.test.ts` | Modify | Better Auth cookie fixture regression |
| `apps/server/src/pdv/rest/controllers/tests/update-sales-channel.controller.test.ts` | Modify | Better Auth cookie fixture regression |

# 4. Validation Contract

## Automated-test structure

| Test file | Test type | Target | Coverage goal |
| --- | --- | --- | --- |
| `packages/core/src/identity/use-cases/tests/register-ice-cream-shop-use-case.test.ts` | unit | onboarding registration | provider/local compensation, quota, and atomic prepared-event enqueue |
| `packages/core/src/identity/use-cases/tests/confirm-ice-cream-shop-onboarding-use-case.test.ts` | unit | onboarding confirmation | idempotent local activation and provider-completion retry boundary |
| `packages/core/src/identity/use-cases/tests/correct-ice-cream-shop-onboarding-email-use-case.test.ts` | unit | onboarding correction | replacement identity/token and rollback-safe outbox |
| `packages/core/src/identity/use-cases/tests/resend-ice-cream-shop-confirmation-use-case.test.ts` | unit | onboarding resend | shared quota, invalidation, and atomic outbox |
| `packages/core/src/identity/use-cases/tests/invite-user-use-case.test.ts` | unit | invitation creation | provider compensation, pending state, audit, and atomic outbox |
| `packages/core/src/identity/use-cases/tests/correct-user-invitation-use-case.test.ts` | unit | invitation correction | replacement semantics and atomic outbox |
| `packages/core/src/identity/use-cases/tests/resend-user-invitation-use-case.test.ts` | unit | invitation resend | shared quota, old-token invalidation, audit, and outbox |
| `packages/core/src/identity/use-cases/tests/accept-user-invitation-use-case.test.ts` | unit | invitation acceptance | credential/local activation retry matrix and no early session |
| `packages/core/src/identity/use-cases/tests/inactivate-user-use-case.test.ts` | unit + transaction contract | user inactivation | local status/audit/session deletion/event enqueue/result read commit or rollback as one unit |
| `packages/core/src/identity/use-cases/tests/request-password-recovery-use-case.test.ts` | unit | recovery request | enumeration resistance, quota, audit, and outbox |
| `packages/core/src/identity/use-cases/tests/reset-password-use-case.test.ts` | unit | password reset | single use, credential replacement, and global revocation |
| `apps/server/src/identity/rest/controllers/tests/request-password-recovery.controller.test.ts` | controller integration | recovery REST | public response, quota/audit/outbox, and no secret disclosure |
| `apps/server/src/identity/rest/controllers/tests/reset-password.controller.test.ts` | controller integration | reset REST | validation, token lifecycle, password, and session revocation |
| `apps/server/src/shared/messaging/outbox/tests/publish-event-job.test.ts` | job integration | `PublishEventJob` | notification/startup/reconnect drain, 100-row batch, reservation ownership/expiry, transitions, direct client ID, retry/crash, terminal signal, and redaction |
| `apps/server/src/shared/messaging/outbox/tests/reprocess-events-job.test.ts` | PostgreSQL job integration | `ReprocessEventsJob` | fixed backoff eligibility, expired publishing reservation recovery, publisher wake-up, and ten-attempt terminal exclusion |
| `apps/server/src/shared/messaging/outbox/tests/cleanup-published-events-job.test.ts` | PostgreSQL job integration | `CleanupPublishedEventsJob` | delete only published rows older than 30 days and preserve every other status/boundary |
| `apps/server/src/communication/messaging/inngest/jobs/send-identity-email-jobs.test.ts` | job unit | Communication jobs | schema validation, renderer/provider boundary, durable step, and retry |

The exact Identity/MRP/PDV controller regression files in Section 3 are the owning-layer manifest
for fixture-only conversions. Each retains every existing assertion and proves no Authorization
header is constructed; they are not duplicated in this structure table.

## Automated test cases

| Test file | Test case | Description | Assertions |
| --- | --- | --- | --- |
| `packages/core/src/identity/use-cases/tests/inactivate-user-use-case.test.ts` | `commits complete inactivation together` | valid Manager inactivation | inactive user, one audit, zero subject sessions, one outbox event, and response projection in one transaction; no post-commit dependency call |
| `packages/core/src/identity/use-cases/tests/inactivate-user-use-case.test.ts` | `rolls back every inactivation effect on failure` | fail each invariant and inject session/outbox/read/transaction conflict | original status/audit/session/outbox rows remain byte-equivalent |
| `packages/core/src/identity/use-cases/tests/request-password-recovery-use-case.test.ts` | `does not enumerate and shares message quota` | known/unknown plus spacing/window attempts | identical result; only known row/audit/outbox; 2-minute and 3/24h rules |
| `packages/core/src/identity/use-cases/tests/reset-password-use-case.test.ts` | `consumes once and revokes all sessions` | reset then replay across two devices | new bcrypt works; old password/token/sessions fail; no authenticated result |
| `apps/server/src/shared/messaging/outbox/tests/publish-event-job.test.ts` | `publishes one bounded owned reservation from a database notification` | emit a committed notification with 101 eligible rows, fail/retry, then simulate crash after external acknowledgement | exactly 100 rows reserved for five minutes with distinct `<instance-id>:<execution-id>` ownership; guarded statuses change correctly; direct client receives stable IDs; terminal failure emits safe signal; Broker is never called |
| `apps/server/src/shared/messaging/outbox/tests/publish-event-job.test.ts` | `drains on startup and listener reconnect` | leave pending and expired publishing rows before startup/reconnect | expired reservations are reclaimed, pending rows are published, and no notification payload is trusted as event data |
| `apps/server/src/shared/messaging/outbox/tests/publish-event-job.test.ts` | `signals an aged pending backlog` | leave the oldest eligible pending row older than five minutes during a drain | the always-running publisher emits the safe backlog signal without exposing payload or recipient data |
| `apps/server/src/shared/messaging/outbox/tests/reprocess-events-job.test.ts` | `requeues only eligible attempts` | advance time across 1/5/15/60-minute backoff, expire a publishing reservation, and reach attempt 10 | eligible failed and expired publishing rows become pending; early/terminal rows remain unchanged; attempts are not inflated |
| `apps/server/src/shared/messaging/outbox/tests/reprocess-events-job.test.ts` | `wakes the publisher after recovery` | requeue an eligible failed or expired row | row becomes pending and the database wake/notification trigger causes direct publication |
| `apps/server/src/shared/messaging/outbox/tests/cleanup-published-events-job.test.ts` | `deletes only expired published rows` | place all statuses before, at, and after the 30-day boundary | only published rows strictly older than 30 days are deleted; pending, publishing, failed, boundary, and newer rows remain |
| `apps/server/src/communication/messaging/inngest/jobs/send-identity-email-jobs.test.ts` | `delivers each validated event idempotently` | run all families and retry provider error | correct template/provider input; stable key; thrown failure; no secret log |

## Acceptance evidence map

| Acceptance | Automated and manual evidence |
| --- | --- |
| `CA-01`–`CA-04` | full AppModule HTTP tests for handler ordering, route allowlist, cookie flags/rotation, trusted/untrusted Origin, CORS, sanitized session, SSR forwarding, and no Bearer path; `MV-01` |
| `CA-05`–`CA-06` | Better Auth provider integration tests with deterministic time fixtures and Testcontainers PostgreSQL for failures, eligibility, idle/absolute expiry, devices, and revocation; `MV-01`, `MV-02`, `MV-06` |
| `CA-07`–`CA-09` | Core use-case tests plus exact Identity controller tests for onboarding, invitation, recovery, retries, expiry, and quotas; `MV-03`–`MV-06` |
| `CA-10` | Communication template/job/provider tests and local Mailpit real-service assertions in `MV-03`–`MV-05`, `MV-08` |
| `CA-11`–`CA-11A` | dependency-cruiser/import checks plus Broker/outbox transaction, publish, retry, and rollback tests; `MV-03`–`MV-05` |
| `CA-12` | Drizzle client test against standard PostgreSQL and browser-env schema test; `MV-08` |
| `CA-16` | repository search gate, manifest/lockfile checks, Compose config, environment schema tests, health tests, and CI workflow run |
| `CA-17` | complete Identity, MRP, and PDV server controller suites through `BetterAuthFixture` cookies |
| `CA-18` | manual real-service Playwright CLI scenarios plus migration/staging evidence; `MV-01`–`MV-08` |

## Required commands

Run from the repository root unless a command says otherwise:

```bash
pnpm install --frozen-lockfile
pnpm --filter @scoops/core check:code
pnpm --filter @scoops/core check:architecture
pnpm --filter @scoops/core check:types
pnpm --filter @scoops/core test:coverage
pnpm --filter @scoops/validation check:code
pnpm --filter @scoops/validation check:architecture
pnpm --filter @scoops/validation check:types
pnpm --filter server check:code
pnpm --filter server check:architecture
pnpm --filter server check:types
pnpm --filter server test:coverage
pnpm --filter server build
pnpm --filter web check:code
pnpm --filter web check:architecture
pnpm --filter web check:types
pnpm --filter web check:playwright
pnpm --filter web test:coverage
pnpm --filter web exec playwright test tests/routes --workers=1
pnpm --filter web build
docker compose config
pnpm test:scripts
pnpm check:spec-implementation -- documentation/features/shared/refactor-auth-postgres-infra/spec.md
```

Database and migration validation:

```bash
docker compose up -d postgres mailpit minio inngest
docker compose ps
pnpm --filter server exec drizzle-kit generate --name=better_auth
pnpm --filter server db:migration:apply
pnpm --filter server db:seed
```

Repository removal gate, excluding historical SDD artifacts and this Spec:

```bash
rg -n -i 'supabase|authorization:\s*bearer|session\.accessToken' \
  apps packages scripts docker-compose.yaml package.json pnpm-lock.yaml \
  .github .env.example apps/server/.env.example apps/web/.env.example \
  --glob '!documentation/features/**'
```

The command must return no active runtime/configuration match. Historical documentation is outside
this gate and does not authorize an active dependency.

## Manual and real-service scenario matrix

| ID | CA coverage | Preconditions and viewport | Action | Required evidence |
| --- | --- | --- | --- | --- |
| `MV-01` | `CA-03`, `CA-04`, `CA-06`, `CA-18` | seeded active Manager; PostgreSQL/Server/Web healthy; desktop then narrow viewport | sign in, load a protected SSR route, reload, then sign out | login and protected page visible; exact final URLs; browser stores only the secure HttpOnly session cookie; REST and SSR responses propagate only allowlisted cookies; no token in HTML/storage/logs; no failed requests, hydration warnings, or console errors; keyboard path passes. Idle/absolute expiry durations remain covered by automated provider tests. |
| `MV-02` | `CA-04`, `CA-05A`, `CA-18` | valid credentials for an inactive user and for a user in an inactive establishment | attempt the allowed Better Auth email sign-in endpoint directly and through the Web form | both fail before session insertion/`Set-Cookie`; response is sanitized; session-table count is unchanged; untrusted Origin on an unsafe protected request is rejected |
| `MV-03` | `CA-07`, `CA-10`, `CA-11A`, `CA-18` | fresh address; Mailpit reachable; desktop and narrow confirmation form | register onboarding, inspect the Mailpit message, follow its action, confirm, and reload the protected destination | one Portuguese accessible HTML email with correct host/expiry intent; outbox row and Communication delivery correlate by redacted event ID; local/provider identities become active once; immediate authenticated cookie works after reload; resend/correction invalidates the old token |
| `MV-04` | `CA-08`, `CA-10`, `CA-11A`, `CA-18` | active Manager plus unused invite address; Mailpit reachable | invite, resend, inspect latest message, reject the old action, accept the latest with password, and reload | Mailpit invitation is Portuguese and token-safe in evidence; seven-day expiry; old token rejected; local and Better Auth credential activate atomically/idempotently; immediate authenticated cookie; Manager audit and exactly one effective acceptance |
| `MV-05` | `CA-09`, `CA-10`, `CA-11A`, `CA-18` | known and unknown addresses; Mailpit reachable | request recovery for both, reset with the latest token, retry the consumed token, and verify the resulting session state | identical public responses; no unknown-address email; one-hour token behavior, audit, latest password, token-reuse rejection and session revocation are covered by the local flow and automated quota/provider tests; no secret in logs/evidence |
| `MV-06` | `CA-06`, `CA-18` | active user signed in in two independent browser contexts; Manager session available | sign out context A, verify B, sign A back in, then inactivate the user from Manager context | current-only exit revokes A but preserves B; inactivation revokes every user session and prevents direct Better Auth sign-in; authorized Manager UI and persisted state agree. Failed-transaction rollback remains covered by automated transaction tests. |
| `MV-08` | `CA-10`, `CA-12`, `CA-18` | local PostgreSQL/Mailpit/Server/Web healthy; exact local origins | run one local message flow, sign in/SSR/reload/sign out, try an untrusted Origin, and inspect health | local Mailpit delivery, local `DATABASE_URL`/`prepare:false`, cookie attributes, SSR behavior, hostile-Origin rejection and health are verified. Neon pooled-URL and staging Resend smoke are outside this revision's validation scope. |

## Real-service Playwright workflow

1. Verify PostgreSQL, Mailpit, MinIO, and Inngest with `docker compose ps`; verify `/health` and
   `/api/auth/ok` before browser assertions.
2. Seed Manager and Operator explicitly, then run `pnpm --filter web test:auth:setup`. Playwright
   must not invoke the destructive seed implicitly.
3. Start `pnpm --filter server dev` and `pnpm --filter web dev` in persistent terminals and wait for
   Nest bootstrap and Vite readiness.
4. Run `pnpm --filter web exec playwright test tests/routes --workers=1` for the committed mocked
   route suites. Execute real-service scenarios manually with the Playwright CLI; do not create or
   retain committed tests under `apps/web/tests/integration`. Use role/name locators, verify URL and
   server state, and inspect failed requests and console output.
5. Prove: bad-password lock, successful login, page reload, protected SSR/navigation, second-device
   session, current-device logout, onboarding email/confirmation, invitation email/acceptance,
   recovery email/reset/global revocation, and inactive-user rejection.
6. Inspect Mailpit through its HTTP API to assert recipient, Portuguese subject, HTML body, action
   host, and expiry journey without printing the full token in evidence.
7. Exercise one narrow viewport and keyboard path for the token/password forms. This is a transport
   refactor with no approved visual change; a fresh screenshot is required only if implementation
   changes rendered markup or styling. Any such screenshot stays in Playwright output, not SDD
   evidence directories.
8. Stop only the server/Web processes started for validation. Leave shared Compose services running.

Record each completed scenario and its artifact paths in
[`evaluation.md`](./evaluation.md). The evaluation maps every `CA-*` row to automated command output
and, where specified above, an `MV-*` result; it redacts addresses, cookies, tokens, hashes, provider
keys, database URLs, and token-bearing links.

Mocked route tests prove UI branching only. They are not evidence of cookie attributes, real
authorization, PostgreSQL persistence, Mailpit delivery, or Resend delivery.

## Migration and staging evidence

The implementation evaluation must retain redacted evidence for:

- clean migration on standard PostgreSQL;
- local Mailpit delivery for the required authentication message families;
- exact deployed cookie attributes and trusted-origin rejection;
- normal application-created Better Auth identities in the empty target environment.

Neon pooled-URL and staging Resend smoke are explicitly deferred from this pre-launch validation
revision; no legacy source or production/staging cutover action is required.

## Completion gate

The implementation is not complete until all `CA-*` rows have current evidence, all commands pass,
the in-scope server-backed browser scenarios pass, and active code
has no Supabase/Bearer/session-token residue. A green mocked suite cannot waive a failed real-service
or migration boundary.

# 5. Documentation alignment and revision history

## Governing documents

| Document | Authority for | State | Required change/confirmation |
| --- | --- | --- | --- |
| `documentation/architecture.md` | runtime, persistence, authentication, cookie, integration, and messaging boundaries | amended and user-approved, 2026-09-03 | Better Auth in NestJS; Neon/standard PostgreSQL; parent-domain server cookie; Communication-owned Resend/Mailpit; `InngestBroker` atomic outbox enqueue; committed `LISTEN/NOTIFY` delivery through non-Inngest `PublishEventJob`; local/test-only reprocessing |
| `documentation/rules/email-package-rules.md` | standalone email package ownership and implementation conventions | created, 2026-09-03 | React Email composition stays independent from Server delivery/provider infrastructure; public components/render helpers use typed arrow-function declarations |
| `documentation/modules.md` | module ownership and cross-module contracts | confirmed unchanged at `main@4ce2965` | Identity owns authentication facts; Communication alone owns email composition/provider/delivery; shared owns only transport |
| `documentation/prds/identity.md` | authentication, onboarding, invitation, recovery, access, audit, and session outcomes | confirmed unchanged at `main@4ce2965` | preserve `REQ-01`–`REQ-05`, `REQ-08`, `REQ-09`, `REQ-10`, and `REQ-13`, including failure-without-state-change |
| `documentation/prds/communication.md` | mandatory message initiation/content/delivery behavior | confirmed unchanged at `main@4ce2965` | partially deliver `REQ-01`, `REQ-04`, `REQ-05`, and `REQ-08` for authentication messages; keep remaining messages deferred |
| `documentation/tooling.md` | supported commands, local services, environment guidance, and CI evidence | amended and user-approved, 2026-08-31 | standard PostgreSQL/Mailpit prerequisites; remove Supabase gateway/key helper; update again if implemented command names differ |
| `AGENTS.md` | repository workflow and real browser validation | amended and user-approved, 2026-08-31 | PostgreSQL/Mailpit Playwright prerequisites and current Better Auth/Neon/Resend documentation routing |
| Authentication-related rule files in the Rule Pack | layer placement, provider neutrality, REST cookies, outbox/Broker, UI, and tests | amended selections user-approved; exact evaluated revisions in Rule Pack | enforce Communication-only `EmailProvider`, unchanged Core Broker signature, one shared `events` table, `DatabaseTransactionContext`, database-triggered `PublishEventJob` with direct `InngestClient` publication, local/test-only reprocessing, server/SSR cookie transport, and provider-neutral test doubles |

Implementation must update `documentation/tooling.md` again if final script names or verified local
commands differ from this contract. It must not rewrite completed Specs, Plans, Evaluations, or
historical evidence merely because they truthfully describe the former Supabase implementation.

## Risks and controls

| Risk | Control |
| --- | --- |
| Cookie works in browser but not SSR | shared parent-domain cookie plus explicit server-only Cookie forwarding test |
| CSRF after moving from Bearer to cookies | SameSite, exact origins, Better Auth checks, protected unsafe-method Origin guard |
| Provider/local partial completion | ordered idempotent operations, no early Set-Cookie, compensating cleanup, explicit retry tests |
| Brute-force policy silently replaced by provider rate limit | separate persisted consecutive-failure control with controlled-time tests |
| Cross-module email ownership leak | Identity events only; dependency-cruiser and import search for Communication/provider imports |
| Duplicate emails during retry | stable event/message ID, Inngest step, Resend idempotency key; local SMTP is non-production |
| Neon pooling incompatibility | `prepare: false`, clean migration, Neon branch smoke |
| Local image replacement makes the old database unreadable | use a new standard-PostgreSQL volume and retain the prior named volume untouched for separately authorized recovery/cleanup |
| Failed inactivation changes state | one serializable cross-schema PostgreSQL transaction for status, audit, Better Auth session deletion, event enqueue, and response read; no fallible post-commit work; rollback integration tests |
| Secrets enter evidence | structured redaction rules and report tests with synthetic credentials |
| Scope drifts into product redesign or Better Auth plugins | explicit exclusions and exact dependency/path ledger |

## Delivery recommendation

This Spec should use `create-plan` followed by plan-backed `implement-spec`. The work spans Core,
Validation, Server, Web, Communication, database migration, CI, and security validation with hard
ordering constraints. The Plan should separate additive schema/provider work, email delivery,
cookie transport, Supabase removal, and integrated validation.

## Revision history

| Revision | Date | Status | Change | Reason |
| --- | --- | --- | --- | --- |
| 1 | 2026-08-31 | open | Initial complete-mode contract from issue #28, repository research, approved cookie/cutover decisions, Communication-owned Resend/Mailpit delivery, and independent-review corrections | Replace Supabase Auth/infrastructure without changing product outcomes and make the cross-layer implementation/validation boundary executable |
| 2 | 2026-09-02 | open | Rename the shared transaction carrier to `DatabaseTransactionContext`; make independently injected `InngestBroker.publish(event)` persist the single outbox row; remove `EventOutbox`, Broker publish options, delivery records, and Broker-based relay; add direct `InngestClient` relay plus explicit outbox states and reprocessing | Keep Broker outside database scopes while preserving atomic mutation/event persistence and simplifying durable delivery bookkeeping |
| 3 | 2026-09-02 | open | Rename the publishing worker to `PublishEventsJob` and the transactional outbox table to `public.events`, including model, enum, indexes, path ledger, diagrams, and validation references | Use concise domain-oriented runtime names while retaining the transactional outbox pattern as the architectural description |
| 4 | 2026-09-02 | open | Replace lease terminology with five-minute reservations; fix a 100-row batch, owner identity format, terminal/backlog signals, and a guarded audited `events:requeue` command | Register the approved operational choices so implementation does not invent concurrency or recovery behavior |
| 5 | 2026-09-03 | open | Replace the scheduled `PublishEventsJob` with non-Inngest `PublishEventJob` using PostgreSQL `LISTEN/NOTIFY`, startup/reconnect draining, and direct `InngestClient` publication; keep `ReprocessEventsJob` only in local/test composition | Publish committed events promptly without consuming recurring Inngest runs, while retaining recovery controls and honoring the staging reprocessor constraint |
| 6 | 2026-09-03 | open | Move each outbox job’s test into `apps/server/src/shared/messaging/outbox/tests/` | Keep job implementation files separate from their test files and make the requested test ownership/layout explicit |
| 7 | 2026-09-03 | open | Move shared outbox database persistence and port declarations into `apps/server/src/shared/database/outbox/`, leaving worker orchestration under `shared/messaging/outbox/` | Keep database persistence owned by shared database infrastructure while messaging jobs remain in the messaging boundary |
| 8 | 2026-09-03 | open | Remove legacy Supabase-to-Neon cutover tooling because production and staging contain no data; place the remaining outbox database declarations and models under `apps/server/src/shared/database/drizzle/outbox/` | Keep the pre-launch delivery focused on the live runtime and make the Drizzle tree the complete shared database boundary |
| 9 | 2026-09-03 | draft | Move the provider-neutral `OutboxDatabase` contract and its event/listener types to `packages/core/src/shared/interfaces`; retain the Server-only Nest token and Drizzle adapter in shared Server infrastructure | Make the shared outbox port available from the Core interfaces boundary without leaking database implementation or dependency-injection details into Core |
| 11 | 2026-09-03 | open | Remove committed Web real-service integration tests from `apps/web/tests/integration`; retain real-service scenarios as manual Playwright CLI evidence and limit test-integrity ownership to approved route, health, widget, hook, job and template boundaries | Keep browser integration tests out of the repository test inventory while preserving explicit manual runtime validation and preventing broad Web test globs from authorizing unrelated files |
| 12 | 2026-09-03 | open | Move Communication React Email templates into the dedicated `packages/email` (`@scoops/email`) package and make Server email jobs consume its public templates export | Isolate message composition from NestJS runtime and delivery-provider infrastructure while preserving the existing template content and render contracts |
| 13 | 2026-09-03 | open | Add the Email Package Rule Pack and standardize exported template components and render helpers as typed arrow-function constants | Make the standalone package boundary, public API, rendering/delivery separation, and requested declaration format enforceable for future Communication email work |
| 14 | 2026-09-04 | open | Narrow validation to local runtime evidence: remove mandatory staging Neon/Resend smoke, controlled-time browser rotation, manual rollback injection, full manual quota/recovery repetition and old-device recovery checks; retain automated coverage for the underlying product rules | Remove unavailable or redundant manual blockers without changing authentication, quota, expiry, revocation, rollback or deployment behavior |
