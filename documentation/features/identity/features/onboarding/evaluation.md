---
title: Ice cream shop onboarding — implementation evidence
spec: ./spec.md
plan: ./plan.md
spec_revision: 11
status: completed
github_issue: https://github.com/rafinel/scoops/issues/3
updated_at: 2026-08-13
---

# Implementation evidence

This file is the formal evidence record for implementation of Spec revision 11.
The Plan is the operational ledger; this file records executed commands,
observations, findings and the final implementation assessment. No result is
considered passed until its command or browser flow is recorded here.

## Pre-implementation state

- The feature Spec is open at revision 11.
- The Plan entered F1 with no onboarding implementation files present.
- The existing user changes in `spec.md` and `documentation/prompts/create-spec-prompt.md`
  are preserved and are outside the implementation scope.
- The canonical migration generator initially hit an esbuild host/binary mismatch;
  `pnpm install --force` repaired the local install without changing the lockfile.
- No persistent local-service mutation was executed; browser validation was run
  against the local Web app with isolated mocked transport where noted below.

## Phase evidence

F1 is accepted after all three tasks were verified by the Core sensors.

### F1-T1 evidence

- Added the exact onboarding structures, named errors, provider/token/identifier
  contracts, repository extensions, linked-attempt cleanup fields and five-operation
  `IdentityService` contract under `packages/core`.
- `pnpm --filter @scoops/core format` passed and formatted one changed Core file
  among 231 inspected files.
- `pnpm --filter @scoops/core check:code` passed for 228 Core source files.
- `pnpm --filter @scoops/core check:types` passed.
- `pnpm --filter @scoops/core test` passed: 2 files and 14 tests.
- The contract source contains no Supabase, NestJS, Drizzle, HTTP or Node provider
  imports. No application or migration files were changed by F1-T1.

### F1 evidence

- Added the six onboarding use cases, the attempt faker and one colocated test file
  per use case. The tests use typed contract mocks and fixed timestamps.
- `pnpm --filter @scoops/core format` passed: 244 files inspected, no fixes needed
  on the final run.
- `pnpm --filter @scoops/core check:code` passed: 241 files checked.
- `pnpm --filter @scoops/core check:types` passed.
- `pnpm --filter @scoops/core test` passed: 8 files and 24 tests.
- The Core import scan found no Supabase, NestJS, Drizzle, HTTP, Node provider or
  infrastructure imports in the onboarding source.
- F1 phase result: all tasks `verified`; no phase Judge was created. F2/F3 are
  accepted; F4 and F5 were subsequently accepted after the Pencil preflight and
  route/page sensors completed.

### F2 evidence

- Supabase onboarding identity, token and identifier adapters, DI bindings, stable
  429/503 translation and persistence repository changes are present under
  `apps/server/src/identity`.
- Canonical generation passed:
  `pnpm --filter server db:migration:generate --name ice-cream-shop-onboarding`.
  The generated SQL was amended only as permitted by the Spec: nullable `user_id`,
  deterministic establishment/lower-email backfill, aborting assertions for
  unresolved/ambiguous users and duplicate token/user values, then NOT NULL,
  restrictive FK and exact indexes. No RLS/grants/destructive repair was added.
- `pnpm --filter server check:code` passed (119 files).
- `pnpm --filter server check:types` passed.
- `pnpm --filter server test` passed: 2 files and 12 tests.
- `docker compose config` passed; resolved GoTrue config contains
  `GOTRUE_MAILER_AUTOCONFIRM=false` and the exact `/onboarding/confirm` callback
  in `GOTRUE_URI_ALLOW_LIST`.
- F2 phase result: all tasks `verified`; phase accepted. Public REST/job proof is
  deferred to F3.

### F4 evidence

- The web REST adapter maps all five onboarding operations with ISO-date validation;
  versioned session storage retains only the continuation token and safe snapshot;
  five action hooks and callback-session/auth-context protections are implemented.
- Required TanStack Intent guidance loaded successfully for auth/guards,
  search-params, SSR and Start execution model before route/page work.
- `pnpm --filter web check:types` passed.
- `pnpm --filter web test` passed: 9 files and 39 tests.
- `pnpm --filter web check:code` passed with four pre-existing warnings in
  `src/ui/shared/styles/global.css` reduced-motion `!important` declarations.
- `mcp__pencil__get_app_state` was refreshed with schema against
  `/home/petros/projects/scoops/design/onoreo.pen`; the four normative nodes
  `ZVD15`, `t67NUw`, `f9xhLm` and `r8AIM` resolved and were screenshot-checked.
  The existing Pencil components `XJAAn` (form field) and `j81wx` (primary button),
  Manrope typography, semantic colors and the 620/820 desktop split were mapped to
  the incumbent Scoops tokens and shared UI boundary. The user-supplied node
  `Q2Aflw` was also read successfully as a separate identity reference.
- F4-T1, F4-T2 and F4-T3 are verified; F4 phase accepted. The earlier MCP mismatch
  was corrected by reconnecting to the intended `onoreo.pen` document.

### F3 evidence

- Added the five public onboarding controllers with strict bounded schemas,
  DTO mapping, pending-authentication guard and current-auth-user decorator.
- Added stable global 429/503 mappings, the hourly Identity cleanup job and
  ModuleRef-compatible Inngest function resolution while retaining the single
  root `InngestModule.forRoot` composition point.
- `pnpm --filter server check:code` passed (132 files).
- `pnpm --filter server check:types` passed.
- The initial server sensor run passed: 2 files and 12 tests. An initial test run
  exposed missing `InngestClient` in the Identity messaging test module; the
  module provider composition was fixed and the suite was rerun successfully.
- `pnpm --filter server build` passed with Nest webpack compilation.
- F3 phase result: all tasks `verified`; phase accepted. Its HTTP contracts and
  cleanup sensors are joined with the real provider/persistence evidence below.

### F5 evidence

- Added separate `/onboarding` and `/onboarding/confirm` route compositions,
  shared progress/detail/recovery primitives, controlled registration and email
  correction forms, pending confirmation and success widgets, typed visual
  variants, and generated route metadata.
- Required TanStack Intent guidance was loaded before the route/UI edits for
  auth-and-guards, search params, SSR and Start execution model.
- `pnpm --filter web generate-routes` passed.
- `pnpm --filter web check:code` passed with only the four pre-existing reduced-motion
  `!important` warnings in `global.css`; `pnpm --filter web check:types` passed.
- `pnpm --filter web test` passed: 9 files and 39 tests.
- Focused mocked-transport browser contract suite passed with a temporary base URL
  on the Scoops dev server at 4000 (the unrelated HMS Vite process occupies 3000):
  `onboarding.index.test.ts` and `onboarding.confirm.test.ts`, 4 tests passed.
  The suite covered the five controls, empty-form validation without registration
  transport, missing token recovery and malformed-token rejection.
- F5 phase result: all tasks `verified`; phase accepted.

### F6 integrated sensor evidence

- `docker compose config` passed and resolved `GOTRUE_MAILER_AUTOCONFIRM=false`
  plus the exact onboarding callback allow-list.
- Core: `check:code`, `check:types` and `test` passed (8 files, 24 tests).
- Server: `check:code`, `check:types`, `test` and `build` passed (7 files, 23 tests;
  Nest webpack build successful).
- Web: `format`, `check:code`, `check:types`, `test` and route generation passed;
  Web build passed. Root `pnpm build` passed through Turbo for Server and Web.
  Web build emitted only the existing large-chunk advisory.
- `git diff --check` passed. The source/storage scan found no password or raw
  continuation-token persistence/logging; the only service-role match is the
  intentional Server env-provider lookup and Supabase library documentation in the
  generated bundle. Existing ignored local `.env` files contain development secrets
  and are not part of the change set.

### F6 real provider and persistence evidence

- `docker compose up -d` started the configured local Supabase/Postgres/Auth,
  Mailpit and supporting services. `pnpm --filter server db:migration:apply` applied
  the onboarding migration to the local database. GoTrue and Mailpit health checks
  returned `200`.
- A real `POST /registration-attempts/onboarding` against Scoops on `127.0.0.1:3335`
  returned `201` with a 43-character continuation token. The persisted row linked
  the pending establishment, Manager and provider subject. Mailpit contained a real
  confirmation message whose allow-listed redirect carried only the 43-character
  application `confirmationToken`; the continuation token was absent from the URL.
- A real status request returned the safe pending snapshot. An immediate resend was
  translated to `429` by GoTrue's email rate limit, and a malformed token was rejected
  with `422` before lookup.
- Browser-use/CDP opened the real Mailpit verify link. Supabase established the
  temporary verified session, the confirmation request returned `204`, the page
  rendered `Cadastro concluído`, and a database query showed
  `establishments.status=active`, `users.status=active` and
  `user_registration_attempts.status=confirmed` for the same email. The final AX tree
  exposed the success heading, live progress status and login action; the page had no
  onboarding session snapshot or raw continuation token in browser storage.
- The first callback attempt exposed a React StrictMode in-flight-effect race that
  left the page in `Confirmando seu cadastro…`; the hook now shares one in-flight
  promise across the development double-effect, and a fresh browser tab completed the
  same real activation path successfully.
- Recovery from a failed or unavailable callback now calls
  `completeOnboardingConfirmation()` before restarting, clearing the temporary
  provider session and callback marker on SPA departure as required by RF-10/RF-15.

### F6 Pencil and Browser-use evidence

- Pencil screenshots were captured for `ZVD15`, `t67NUw`, `f9xhLm` and `r8AIM` from
  `design/onoreo.pen`; each frame rendered without a collapsed or clipped layout.
- Browser-use/CDP manual checks ran against the Scoops Web app at the exact design
  viewport 1440 × 1024 and narrow viewport 320 × 800. Initial form, pending
  confirmation (with a local isolated status stub), success (with a local isolated
  confirmation stub), and unavailable-link recovery were exercised.
- For every exercised state, `body.scrollWidth` equaled the viewport width at both
  viewports, the accessibility tree exposed the expected heading/action labels, and
  the relevant confirmation/status request or no-request malformed-link behavior was
  inspected. The four screenshots were captured under `/tmp/scoops-onboarding-*`.
- The isolated stubs are retained only for deterministic pending and unavailable
  layout checks; they are not presented as evidence of the real authenticated
  integration. The real provider path above is the server-backed acceptance evidence.

### Post-implementation reconciliation

The implementation changed after the original F6 evidence was recorded. This
section supersedes stale counts and records the latest validation of those changes.

- Added dedicated HTTP integration suites for all five onboarding controllers under
  `apps/server/src/identity/rest/controllers/tests`: registration, status, resend,
  email correction and confirmation. The complete controller suite now passes with
  7 files and 23 tests through the real Nest module, repositories and PostgreSQL
  fixture.
- Fixed the `POST /registration-attempts/onboarding/status` response contract to
  return the documented `200` status.
- Fixed production tsx/Nest dependency metadata by making shared providers and
  framework dependencies explicit injection tokens. `check:code` and
  `check:types` pass after the changes.
- Moved Inngest job resolution from the controller constructor to `onModuleInit`,
  after all job providers are initialized. `pnpm db:seed` now exits with code `0`
  without the `serve()` undefined-function warning.
- Updated the seed reset behavior to paginate through and delete every Supabase
  Auth user before recreating the two fixed seed users. A local verification after
  `pnpm db:seed` found only `manager.seed@scoops.com` and
  `operator.seed@scoops.com`.

## Findings

### FIND-001 — Legacy generic-rule vocabulary

- **Status:** active, non-blocking pending reconciliation.
- **Impact:** generic examples must not override the Identity Spec's Manager/
  Operator and feature-specific onboarding contracts.
- **Next action:** keep the feature-specific contracts authoritative and record any
  concrete implementation conflict when it appears.

### FIND-002 — Real local provider stack unavailable

- **Status:** resolved.
- **Evidence:** Compose services were started, the migration was applied, Mailpit
  delivered a real confirmation message, and Browser-use completed provider callback
  plus persisted local activation.
- **Impact:** none for the integrated registration/confirmation path. Cleanup and
  broader correction/expiry scenarios remain covered by deterministic tests and
  controller/job sensors rather than this single local manual run.
- **Next action:** retain the stopped-service attempt as historical evidence.

### FIND-004 — Confirmation callback nonce and StrictMode effect race

- **Status:** resolved.
- **Evidence:** the first real Mailpit link lacked the local nonce and the callback
  page could not correlate it; after adding the nonce to provider redirect URLs and
  rotating it on resend, the first Browser-use callback also exposed a StrictMode
  double-effect race. The in-flight promise guard and fresh-tab retest completed with
  `Cadastro concluído` and active persisted records.
- **Impact:** none after the fix; raw continuation tokens remain out of URLs and
  browser storage.
- **Next action:** final Judge reviews the corrected integrated HEAD.

### FIND-005 — Server expiration-job integration-test inventory

- **Status:** accepted limitation, non-blocking for this local implementation run.
- **Evidence:** all five onboarding controllers now have committed HTTP integration
  coverage (7 files and 23 tests total); a dedicated expiration-job integration suite
  for cleanup concurrency and expiry remains absent.
- **Impact:** committed regression coverage is still thinner than the Spec's ideal
  evidence inventory for cleanup concurrency and expiry.
- **Next action:** add the expiration-job integration suite in a follow-up hardening
  task; do not represent the current controller suite as job coverage.

### FIND-003 — Migration generation environment mismatch

- **Status:** resolved, tooling/environment finding.
- **Evidence:** `pnpm --filter server db:migration:generate --name
  ice-cream-shop-onboarding` failed before generation with esbuild host `0.25.12`
  versus binary `0.28.1`.
- **Impact:** none after `pnpm install --force` and a successful canonical generation.
- **Next action:** retain the failed attempt as historical evidence.

## Attempts

| Attempt | Date | Action | Result | Next action |
| --- | --- | --- | --- | --- |
| 01 | 2026-08-13 | Created the evidence record and opened F1 after auditing the clean onboarding implementation scope. | F1/F2/F4 adapter sensors subsequently executed and recorded above. | Continue with F3 and resolve the Pencil MCP document finding before F5. |
| 02 | 2026-08-13 | Reconnected Pencil to `design/onoreo.pen`, read the four normative nodes, completed F5, ran integrated sensors/builds and Browser-use viewport checks. | F4/F5 accepted; all static/unit/build/browser-mock evidence passed. At that time, real local provider/persistence flow remained pending because Compose was stopped. | Start local services and complete F6-T2, then hand the exact integrated HEAD to the single final Judge. |
| 03 | 2026-08-13 | Started Compose, applied the migration, registered through the real server, inspected Mailpit, opened the provider link with Browser-use/CDP and verified active persisted records. Fixed the missing callback nonce and the StrictMode in-flight confirmation race. | Real registration/status/rate-limit/malformed-token/activation evidence passed; static, unit and build gates remain green. | Invoke the single final read-only Judge on the integrated HEAD. |

## Final judgment

- **Verdict:** `ACCEPTED` by the single read-only `Judge Implementation Final`.
- **Resolved blocker:** confirmation recovery clears the temporary provider session
  and onboarding callback marker before SPA restart, satisfying RF-10/RF-15.
- **Remaining finding:** a dedicated expiration-job suite is a non-blocking P2
  follow-up hardening gap; controller suites now exist, while the current evidence
  does not claim a dedicated job suite exists.
- **Evaluated state:** current uncommitted working tree for Spec revision 11; no commit
  or pull request was requested or created.

## Conclude-spec Quality Gate — 2026-08-13

The final validation was rerun against `HEAD` `9931bf2` plus the current working
tree. The repository's root `lint` and `check-types` Turbo tasks executed with no
workspace tasks because the packages expose `check:code` and `check:types`; those
workspace-equivalent checks passed for Core, Server and Web.

| Sensor | Result | Evidence |
| --- | --- | --- |
| `pnpm format` | passed | Biome formatted 712 files; two files changed, with one broken-symlink warning. |
| Core code/types/tests | passed | `check:code`, `check:types`; 8 files and 24 tests. |
| Server code/types/tests | passed | `check:code`, `check:types`; 7 files and 23 tests. |
| Web code/types/tests | passed with known warnings | `check:code`, `check:types`; 15 files and 59 tests; four existing reduced-motion `!important` warnings. |
| Route generation | passed | `pnpm --filter web generate-routes`. |
| Browser integration | passed | `pnpm --filter web test:integration`; existing FORCE_COLOR/NO_COLOR warning only. |
| Server/Web/root builds | passed | `pnpm --filter server build`, `pnpm --filter web build`, `pnpm build`; existing chunk/output warnings only. |
| Compose/configuration | passed | `docker compose config`; local GoTrue confirmation settings and callback allow-list resolved correctly. |
| Diff integrity | passed | `git diff --check`. |
| Manual Browser-use rerun | unavailable | The local Chrome/CDP daemon was unavailable and could not be launched in this environment; prior route-by-route Browser-use/CDP and real provider evidence remains recorded above. |

The single final `Judge Implementation Final` remains `ACCEPTED`. No blocking
finding remains. FIND-005 (no dedicated expiration-job integration suite) remains
an accepted non-blocking P2 follow-up, and the four Web reduced-motion lint
warnings plus build advisories remain pre-existing/non-blocking. The Spec is
concluded at revision 11 against the uncommitted working tree; no commit, PR or
external mutation was authorized or created.
