---
title: Ice cream shop onboarding
status: open
revision: 3
source:
  type: direct-request
  ref: https://github.com/rafinel/scoops/issues/3
issue: https://github.com/rafinel/scoops/issues/3
prd: documentation/prds/identity.md
scope:
  - packages/core/src/identity
  - packages/core/src/shared
  - apps/server/src/identity
  - apps/server/src/shared/messaging
  - apps/server/src/shared/database
  - apps/server/src/app.module.ts
  - apps/server/rest-client/identity
  - apps/server/.env.example
  - docker-compose.yaml
  - .env.example
  - apps/web/src/provision/auth
  - apps/web/src/ui/identity
  - apps/web/src/ui/shared
  - apps/web/src/rest
  - apps/web/src/routes
  - apps/web/src/constants
  - apps/web/tests/routes/identity
  - documentation/prds/identity.md
last_updated_at: 2026-08-13
---

# Ice cream shop onboarding

## Context

This Spec delivers Identity PRD REQ-01: a public flow that creates one ice cream
shop and its first Manager, keeps both inaccessible while email confirmation is
pending, and activates both together after confirmation. It also covers pending
email correction, confirmation resend, the original seven-day deadline and
expiration cleanup.

The product source is
[`rafinel/scoops#3`](https://github.com/rafinel/scoops/issues/3). It is classified
as a direct request because this repository uses GitHub Issues, not Jira or
Confluence. Product behavior is traced to
[`documentation/prds/identity.md`](../../../../prds/identity.md), specifically
REQ-01. No Jira metadata is invented.

This is a complete-mode Spec because the feature crosses provider-independent
Core rules, Supabase identity, transactional persistence, public REST operations,
durable expiration, TanStack routes, responsive UI and real browser validation.
`documentation/sdd.md`, referenced by the generic create-spec workflow, is absent;
the repository Rules, Architecture, module ownership, Identity PRD, Design System,
Tooling and existing authentication foundation are the available SDD authority.

## Scope

### In scope

- a public onboarding form for ice cream shop name, first Manager name, email,
  password and password confirmation;
- creation of a pending establishment, pending first Manager and pending
  establishment-onboarding attempt;
- first-Manager profile assignment and global, case-insensitive email uniqueness;
- neutral pending-confirmation feedback containing the submitted destination email;
- an opaque continuation credential for status, correction and resend operations;
- correction of only the pending email after re-entering the registered password;
- cancellation of email editing without a mutation;
- invalidation of the previous confirmation link and delivery of a new link after
  a successful email correction;
- confirmation resend without extending the original deadline;
- confirmation-return handling and atomic local activation of the establishment
  and first Manager;
- exact logical expiration at the original seven-day deadline and durable cleanup
  of expired provider and local records;
- blocking pending and expired identities from protected application access;
- `/onboarding` and `/onboarding/confirm` public routes, including initial,
  submitting, validation-error, pending, correction, resent, expired and success
  states;
- Core unit, server controller integration, web widget and real browser coverage.

### Out of scope

- team invitations, user-management screens and lifecycle actions after the first
  Manager is active;
- billing, trial or subscription activation;
- changes to login throttling, inactivity limits or maximum session duration;
- password recovery, social login, passwordless login or two-factor authentication;
- custom permission profiles or a public user-registration operation detached from
  establishment onboarding;
- a general redesign of authentication emails or the existing auth shell;
- Row-Level Security or direct browser access to business tables;
- Pencil-backed visual implementation; no Pencil frame or node is attached to the
  request, so the repository Design System and existing auth layout are normative.

## Contract

### Functional requirements

- **RF-01 — Public onboarding input.** The public flow must accept a non-empty ice
  cream shop name, non-empty Manager name, syntactically valid normalized email and
  password of 8–64 characters. The web password confirmation must match before
  submission. Server and Core validation remain authoritative.
- **RF-02 — Unique, inseparable registration.** A public request may create a user
  only as the first Manager of a newly created establishment. Email uniqueness is
  global and case-insensitive across active users and pending registration
  attempts. A duplicate, malformed or unavailable email response must be actionable
  without disclosing whether an active or pending account exists.
- **RF-03 — Pending creation.** A valid request must create the establishment,
  first Manager and onboarding attempt in pending state. The Manager receives the
  fixed `Manager` profile. The local user identifier is the Supabase provider
  subject, and the original `expiresAt` is exactly seven days after creation.
- **RF-04 — Credential and secret boundary.** The password may exist only in the
  user's input, the onboarding/correction request in transit and transient server
  request-processing memory needed to pass it to Supabase; Scoops must never return,
  persist, log, publish, cache or place it in continuation state. Production transport
  must use HTTPS. Supabase owns password verification and confirmation credentials.
  Server-only provider administration credentials stay out of Core, browser bundles,
  REST responses and committed environment files.
- **RF-05 — Safe continuation.** Creation returns a high-entropy opaque
  continuation credential and a safe pending snapshot. Only its one-way hash is
  persisted. Status, resend and correction operations require the credential,
  return the same neutral not-found/expired shape for invalid credentials, and
  never accept a client-supplied establishment or user identifier as authority.
- **RF-06 — Pending feedback and resend.** Pending feedback must state that access
  depends on confirmation and display the current destination email. Resend must
  rotate the provider confirmation link, invalidate the prior link, preserve the
  local pending records and preserve the original `createdAt` and `expiresAt`.
- **RF-07 — Email correction.** A pending visitor may edit only the email. The
  server must require the continuation credential, current registered password and
  a valid available replacement email. A failed validation or provider operation
  preserves the previous email, provider identity and local pending records. A
  successful correction updates the pending Manager and attempt consistently,
  invalidates all earlier confirmation links, sends a link to the corrected email
  and does not change the original deadline. Cancelling edit mode makes no request
  and no mutation.
- **RF-08 — Confirmation activation.** The confirmation return must establish a
  provider-verified subject and verified email; query parameters, continuation
  credentials or browser state alone cannot confirm an attempt. Before activation,
  the server must match the provider subject to the pending attempt and re-check
  the exact deadline. One serializable Identity transaction activates the pending
  establishment and first Manager and marks the attempt confirmed with one shared
  business timestamp. Repeated confirmation is idempotent.
- **RF-09 — Pending and expired access block.** Existing authentication and route
  guards must continue accepting only active users of active establishments.
  Pending, expired, missing or partially cleaned provider identities cannot render
  `/app` or call protected APIs and receive no status details that disclose account
  existence.
- **RF-10 — Exact expiration and cleanup.** At `expiresAt`, confirmation, resend
  and correction become unavailable immediately even if physical cleanup has not
  run. An Identity-owned durable cleanup job must remove the provider identity and
  transactionally remove the pending establishment and its cascading first Manager
  and onboarding attempt. Cleanup is idempotent, retries provider failures and
  frees the normalized email only after cleanup completes. Confirmation requests
  observed after the deadline must route through the same expiration behavior.
- **RF-11 — Failure consistency.** Provider and PostgreSQL writes cannot be one
  distributed transaction. The server adapter must therefore use idempotency keys
  and compensating cleanup: failed initial local creation removes the newly created
  provider identity; failed email rotation restores or preserves the prior pending
  identity; failed expiration cleanup remains retryable. Any uncertain state stays
  locally inaccessible and must never activate a partial establishment.
- **RF-12 — Responsive accessible experience.** The complete flow must work
  without horizontal scrolling from 320 px, use the Scoops tokens and auth layout,
  provide programmatic labels and textual instructions, announce validation and
  asynchronous results, preserve visible focus, move focus to email when correction
  opens, retain non-email form values, and support a complete keyboard path.
- **RF-13 — REST and abuse boundary.** Public endpoints must expose only the
  minimum create, status, resend, email-correction and confirmation operations.
  Inputs are schema-validated and bounded; responses never include token hashes,
  provider payloads or tenant selectors. Provider-native rate limits are preserved;
  custom onboarding throttling is not introduced by this feature.

### Acceptance criteria

| CA | RF | Given | When | Then | Expected evidence |
| --- | --- | --- | --- | --- | --- |
| CA-01 | RF-01, RF-02 | valid establishment and Manager data with an available normalized email | onboarding is submitted | the request is accepted; invalid fields or a case-insensitive duplicate receive an actionable neutral error with no existence disclosure | Core tests, controller integration tests, widget tests |
| CA-02 | RF-02, RF-03 | a valid new onboarding request | creation completes | one pending establishment, one pending Manager with `Manager` profile and one pending establishment-onboarding attempt exist; no standalone public user exists | Core tests and persisted controller assertion |
| CA-03 | RF-03, RF-04 | onboarding creation or correction succeeds or fails | persistence, responses, logs, events, continuation state, browser storage, rendered HTML and bundles are inspected | the password appears only in the encrypted outbound request that intentionally submits it; no plaintext/recoverable password or server provider credential is retained or returned, and provider failure details are translated | provider/controller tests, source scan, browser storage/DOM/network inspection |
| CA-04 | RF-05, RF-06 | a valid pending attempt | the pending state is opened with its continuation credential | the destination email and original deadline are shown without exposing internal IDs or secrets | controller test and browser validation |
| CA-05 | RF-06 | a valid unexpired pending attempt | confirmation is resent | a new link is delivered, the previous link becomes invalid, and `createdAt`/`expiresAt` remain unchanged | provider/controller integration test and persisted assertion |
| CA-06 | RF-07 | a pending visitor opens correction | correction mode renders | establishment and Manager names remain filled, only email is editable, focus moves to email and cancel returns without mutation | widget test and keyboard browser validation |
| CA-07 | RF-02, RF-07 | the replacement email is invalid, unavailable or paired with a wrong password | correction is submitted | the previous email and all pending records remain unchanged and the response is actionable without account disclosure | Core tests, provider/controller integration tests |
| CA-08 | RF-06, RF-07 | a valid available replacement email and the registered password | correction succeeds | Manager and attempt use the normalized new email, a new link is sent, every older link is invalid and the original deadline is unchanged | Core tests, provider/controller integration test, browser flow |
| CA-09 | RF-08 | a valid unexpired provider confirmation | the callback completes | the establishment and first Manager become active in one serializable local transaction, the attempt is confirmed and the browser is guided to login | Core tests, controller integration test, real browser flow |
| CA-10 | RF-08 | the same valid confirmation callback is retried | confirmation runs again | no duplicate records or repeated state transitions are created and the already-confirmed result is returned safely | Core and controller integration tests |
| CA-11 | RF-09 | a provider session belongs to a pending or expired local identity | `/app` or a protected API is requested | access is blocked without protected-content flash or account-state disclosure | controller integration test and browser network/DOM inspection |
| CA-12 | RF-10 | the original seven-day deadline has passed | status, resend, correction or confirmation is attempted | the attempt is treated as expired immediately, regardless of resend/correction history | deterministic Core tests and controller integration tests |
| CA-13 | RF-10, RF-11 | an attempt is expired and cleanup runs, including a transient provider failure | the durable job retries | provider identity, pending establishment, Manager and attempt are ultimately removed idempotently and the normalized email becomes available again | Core tests, Inngest job test and persisted controller/job integration evidence |
| CA-14 | RF-11 | provider creation succeeds but the local transaction fails | compensation executes | no usable provider-only account remains; any failed compensation is retryable and local protected access remains impossible | provider/controller failure-path integration test |
| CA-15 | RF-11 | email rotation fails before or during local persistence | correction returns an error or retries | the previous pending email remains authoritative, no old link becomes usable after a reported success, and no partial local activation occurs | provider/controller failure-path integration test |
| CA-16 | RF-12 | a visitor at 320 px uses only keyboard and assistive-technology semantics | the entire create, pending, correction and return flow is exercised | every control is reachable and operable, focus and announcements are correct, and there is no horizontal scroll | widget tests and Browser-use CDP evidence at 320 px |
| CA-17 | RF-12 | loading, invalid, pending, resent, expired and success states | each state renders | copy is understandable in Portuguese, state is not conveyed only by color, and retry/next actions are explicit | widget tests and browser accessibility-tree inspection |
| CA-18 | RF-13 | malformed, oversized or forged public requests | each endpoint is called | validation rejects input, forged continuation/tenant identity yields a neutral response, and no cross-establishment record is read or changed | controller integration tests |

## Current state

- The authentication foundation from GitHub Issue #1 is implemented. Supabase Auth
  verifies provider access tokens, and protected access resolves only active local
  users of active establishments.
- Core already defines `Establishment`, `User`, `UserRegistrationAttempt`, pending
  and active statuses, the two registration-attempt types, Identity repository
  contracts, a serializable `IdentityDatabase` boundary and registration-attempt
  lifecycle events. No onboarding use cases or onboarding request/result structures
  exist.
- Identity Drizzle models and repositories already persist establishments, users and
  registration attempts. The current attempt stores its token hash and deadline but
  lacks the explicit provider-subject/continuation lookup and expiration query
  operations required by this flow.
- The server Supabase adapter currently verifies access tokens only. It has no
  provider registration, password verification, confirmation rotation, pending-email
  update or provider-identity cleanup capability. Identity exposes only session and
  profile-change controllers and registers no Identity messaging job.
- Local GoTrue currently sets `GOTRUE_MAILER_AUTOCONFIRM` to `true` and allows only
  the application origin as an auth redirect. That runtime cannot prove pending email
  confirmation or the `/onboarding/confirm` return flow until auto-confirmation is
  disabled and the exact callback URL is allow-listed.
- The web app has auth provider/context composition, REST token injection, the shared
  responsive `AuthLayout`, and login/recovery routes. It has no onboarding route,
  onboarding service contract, continuation state or confirmation callback.
- Existing route constants contain `/login`, recovery, access-denied and `/app` only.
  The auth shell displays a non-interactive “Criar conta” affordance that can become
  the onboarding navigation entry.
- No Pencil design node is associated with Issue #3. UI implementation must extend
  the documented design tokens and existing auth patterns without inventing a second
  visual system.

## Technical solution

### Core

1. Add explicit request/result structures for onboarding creation, safe pending
   snapshot, resend, email correction, confirmation and expiration. Normalize email
   once at the Core boundary and compare it case-insensitively.
2. Extend the server-side Identity provider contract with narrow capabilities for
   pending identity creation, current-password verification, confirmation resend/link
   rotation, pending-email rotation, verified-subject inspection and provider identity
   removal. Keep Supabase types and error codes inside the server adapter. Do not add a
   password field to a domain entity, event or repository input.
3. Implement focused use cases for create, get pending status, resend, correct email,
   confirm and expire onboarding. Use `DatetimeProvider` for all timestamps and an
   injectable cryptographic/opaque-token capability for continuation credential
   generation and hashing.
4. Execute local multi-record changes through `IdentityDatabase.run` at serializable
   isolation. Create and confirm each use the same transaction for establishment,
   Manager and attempt changes. Add repository lookups by normalized email,
   continuation hash/provider subject and expiration cutoff with only the context each
   operation requires.
5. Keep `expiresAt` immutable after creation. Every use case that reads a pending
   attempt compares it to provider time before taking an action, so physical cleanup
   latency never extends access.
6. Use stable lifecycle events only where durable processing consumes them. Event
   payloads carry identifiers and timestamps, never email, password, provider tokens or
   continuation credentials.
7. Add deterministic unit tests for normalization, uniqueness, pending creation,
   resend/correction deadline preservation, wrong-password and unavailable-email
   preservation, atomic/idempotent confirmation, expiration and compensation outcomes.

### Server

1. Extend the feature-owned Supabase adapter. Administrative operations use a
   server-only provider credential loaded through `EnvProvider`; browser-safe anon keys
   remain the only Supabase credentials exposed to the web. Translate provider errors
   to neutral Core outcomes and never log raw credentials, confirmation links or SDK
   payloads.
2. Configure local GoTrue with email auto-confirmation disabled and allow-list the
   exact web callback URL (`http://127.0.0.1:3000/onboarding/confirm` by default).
   Represent the callback in the root environment template without weakening the
   production redirect allow-list. Keep Mailpit SMTP delivery and the existing
   confirmation/email-change templates as the local integration path.
3. Add the minimum public controllers under the registration-attempt boundary:
   create onboarding, resolve safe pending state, resend confirmation, correct pending
   email and confirm a provider-verified callback. Mark only these routes public; the
   confirmation controller still verifies the returned provider access token/subject.
4. Validate request bodies with Zod/Nest pipes, accept the opaque continuation
   credential in a dedicated authorization header rather than URL parameters, and
   return only safe snapshots. Create/correction operations accept idempotency keys to
   make browser retry safe.
5. Evolve the existing Identity models, mapper and repositories through a generated
   Drizzle migration. Add uniqueness/indexes needed for normalized email,
   continuation hash, provider-subject correlation and expiration scans. Preserve
   module ownership and cascade deletion from pending establishment to Manager and
   attempt.
6. Implement provider/local compensation in an application adapter around the Core
   use cases. Initial provider creation is compensated if the local transaction fails.
   Email rotation reports success only after provider and local state agree; otherwise
   the prior pending identity is restored/preserved or the operation remains retryable
   and inaccessible.
7. Add an Identity-owned Inngest expiration job and export its function to the single
   `AppModule` composition point. The job invokes Core expiration behavior, retries
   provider cleanup and is idempotent. A periodic expiration scan reconciles missed
   delivery while access checks enforce the deadline exactly.
8. Add one `.rest` request collection and one controller integration test per new
   controller through the real Nest/Drizzle fixture. Provider behavior may use the
   local Supabase service where practical; any test double must stay at the provider
   boundary and explicitly model token invalidation and failure compensation.

### Web

1. Add typed route constants and thin TanStack files for `/onboarding` and
   `/onboarding/confirm`; regenerate `routeTree.gen.ts` with the documented command.
   The routes are public and must not derive authority from query-string attempt IDs.
2. Extend the Identity REST service and add a page controller/hook for the onboarding
   state machine. Keep the opaque continuation credential in same-origin session
   storage through a dedicated adapter, never in a URL, analytics event or rendered
   HTML. Clear it after confirmation or final expiration.
3. Build the form and states within `AuthLayout` using existing tokens and shared form,
   icon and anchor primitives. The initial form keeps establishment/Manager names in
   page state when correction opens; status resolution can restore the server-owned
   safe snapshot after reload.
4. Use semantic form controls, `autocomplete` values, password-manager-compatible
   inputs, inline field associations, an `aria-live` status region and `role=alert`
   only for actionable errors. On correction entry, focus the email field; on cancel,
   return focus to “Voltar e corrigir”.
5. The confirmation route consumes the Supabase verification response through the
   existing auth provider boundary, calls the server confirmation operation, signs out
   the temporary provider session if necessary and guides the now-active Manager to
   login. Invalid, superseded and expired links render distinct actionable UI without
   disclosing another account.
6. Add widget tests for form validation and every material state, plus committed
   browser coverage for creation, pending access block, resend, correction, old-link
   invalidation, confirmation, expiration and a 320 px keyboard path.

## Validation plan

### Static and automated validation

- `pnpm --filter @scoops/core format`
- `pnpm --filter @scoops/core check:code`
- `pnpm --filter @scoops/core check:types`
- `pnpm --filter @scoops/core test`
- `pnpm --filter server format`
- `pnpm --filter server check:code`
- `pnpm --filter server check:types`
- `pnpm --filter server test`
- `pnpm --filter web format`
- `pnpm --filter web check:code`
- `pnpm --filter web check:types`
- `pnpm --filter web test`
- `pnpm --filter web generate-routes`, followed by a clean generated-tree diff check
- `pnpm --filter web test:integration`
- `pnpm --filter server build`
- `pnpm --filter web build` as the final CI validation after lower-level checks pass

### Manual browser validation

Use Browser-use CDP against the real local Supabase, server and web services; route
or transport mocks are not evidence for the authenticated provider-backed flow.

1. Verify service health, start server and web in persistent sessions, and navigate
   to `/onboarding`.
2. Complete creation at desktop width, retrieve the delivered confirmation message in
   Mailpit and verify the pending copy, destination email, POST response, persisted
   pending state and blocked `/app` request before opening the email link.
3. Exercise invalid/duplicate email, wrong correction password, successful correction,
   cancellation, resend and the invalidity of every superseded link. Confirm through
   the newest link and verify the active local records plus redirect to login.
4. Move business time beyond the original deadline after a resend and correction;
   verify immediate expired behavior, durable cleanup and subsequent email reuse.
5. Repeat the full interactive path at 320 px using keyboard only. Inspect the
   accessibility tree, focus order, live announcements, DOM overflow, final URLs,
   console messages and failed network requests. Classify every console/network issue.
6. Inspect browser storage, rendered HTML, responses, logs, events and production
   bundles for password, continuation-token or server-secret retention. The password
   is expected only in the request that intentionally submits onboarding or email
   correction and transient request-processing memory; it must not appear in any
   response or retained browser/server state. Local validation may use the documented
   loopback HTTP endpoints; deployed environments require HTTPS.
7. Stop only the application processes started for validation; leave shared Docker
   services running.

## Evaluation

Implementation and judgment evidence must be recorded in
[`evaluation.md`](evaluation.md). That file is mandatory after implementation and is
the only place for final assessments, executed-command results, browser evidence and
remaining findings. Do not duplicate final evidence in this Spec.

## Documentation alignment

- `documentation/prds/identity.md` remains the product authority for REQ-01. If
  implementation resolves a product ambiguity or changes a business rule, update the
  PRD in the same change.
- `documentation/architecture.md` remains aligned: Identity owns onboarding,
  Supabase owns external credentials, Core is framework-independent, local activation
  is atomic, server authorization is authoritative and tenant context is never
  browser-selected.
- `documentation/modules.md` remains aligned because onboarding and its provider,
  persistence, REST, UI and cleanup behavior stay inside Identity. Billing and
  Communication do not absorb the onboarding lifecycle.
- `documentation/design.md` governs tokens, responsive behavior, focus,
  accessibility and auth-shell reuse. No new arbitrary visual values are authorized by
  this Spec.
- `documentation/tooling.md` governs pnpm filters, generated routes, migrations,
  integration tests, browser setup and final builds.

## Assumptions and resolved questions

- The GitHub Issue is the traceable product source; no Jira or Confluence source
  exists for this repository.
- “Seven days” means the exact instant `createdAt + 7 days`, evaluated in UTC by the
  server. Resend and correction never rewrite either timestamp.
- “Activate together” means one serializable transaction for the local establishment,
  first Manager and attempt. Provider email verification necessarily precedes that
  transaction; local guards keep provider-only or partial states inaccessible.
- The pending visitor proves possession through an opaque continuation credential and
  proves knowledge of the registered password only for email correction. Resend does
  not require re-entering the password because neither the Issue nor PRD requires it.
- Confirmed registration attempts may be retained for Identity audit/history. The
  seven-day destructive rule applies to unconfirmed onboarding records.
- Physical cleanup may retry after the logical deadline, but all user-visible and
  protected behavior treats the attempt as expired at the exact deadline.

## Amendments

| Revision | Date | Change | Reason |
| --- | --- | --- | --- |
| 1 | 2026-08-13 | Initial complete Spec for GitHub Issue #3 and Identity PRD REQ-01 | Define the implementation contract before delivery |
| 2 | 2026-08-13 | Added the required GoTrue pending-confirmation runtime configuration and corrected password-in-transit validation | Address blocking Spec Judge findings |
| 3 | 2026-08-13 | Clarified transient request-memory handling and the loopback HTTP exception; opened the accepted Spec | Incorporate non-blocking Judge guidance and record acceptance |
