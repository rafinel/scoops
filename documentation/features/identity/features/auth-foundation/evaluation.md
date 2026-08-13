---
title: Authentication and authorization foundation — implementation evidence
spec: ./spec.md
plan: ./plan.md
spec_revision: 17
status: completed
source_issue: https://github.com/rafinel/scoops/issues/1
last_updated_at: 2026-08-12
---

# Implementation evidence

This file is the formal evidence record for the implementation of Spec revision
16. The Plan remains the operational ledger; this file records decisions,
commands, observations and the final implementation assessment.

## Reconciled findings

### FIND-001 — Legacy profile names

The feature uses `UserProfile.Manager` and `UserProfile.Operator` from the
Identity Spec/Core contract. The legacy `Attendant` vocabulary in generic web
rules is not applied, and no profile-specific module navigation is invented for
this foundation slice.

### FIND-002 — Legacy seed requirements

The feature-specific seed boundary takes precedence over legacy `HMS_*`
requirements in the generic database rule: the fixed Manager and Operator
Supabase UUID subjects and password are reset and verified only in `dev`/`stg`
seed mode. No seed identity environment variables are accepted; the
server-only service-role key is read from the main `EnvProvider` and is never
exposed to the browser or request-authentication path.

### FIND-003 — External traceability

The actual external source is GitHub Issue
https://github.com/rafinel/scoops/issues/1. This repository does not use Jira;
no Jira key or Jira metadata is fabricated.

## Tooling preflight

Before Web source changes, the required TanStack Intent guidance was loaded for:

- `@tanstack/router-core#router-core/auth-and-guards`;
- `@tanstack/router-core#router-core/search-params`;
- `@tanstack/router-core#router-core/ssr`;
- `@tanstack/start-client-core#start-core/execution-model`.

The guidance confirms the pathless `beforeLoad` boundary, sanitized relative
return destinations, client-only protected route behavior, and `VITE_`-only
browser configuration. It also confirms that route guards do not replace the
server authorization boundary.

## Phase evidence

Evidence is added as each Plan phase completes. A phase is not marked verified
until its applicable sensors and required evidence are recorded here.

## F1 evidence

- Core code and type checks passed.
- Core Vitest suite passed: 2 files, 14 tests.
- Core source scan found no Supabase, NestJS, Drizzle or HTTP imports.

## F2 evidence

- Server code and type checks passed.
- Server test command passed with no test files present; controller integration
  remains the F3 responsibility.
- Generated migration `0000_cold_edwin_jarvis.sql` and metadata were reviewed for
  Identity enums, tables, foreign keys, indexes and the absence of RLS, grants,
  destructive statements and credentials.
- Seed boundary accepts only UUID subjects and keeps password/service-role values
  out of the process.

## F4 evidence

- Web code and type checks passed. The four `global.css` reduced-motion
  `!important` warnings are pre-existing.
- Web Vitest suite passed: 4 files, 13 tests.
- Provider, transport and AuthContext tests cover dynamic Bearer resolution,
  lifecycle generation guards, local/global logout, status mapping and retry
  preservation.
- Browser-secret scan and `git diff --check` passed.

## F3 evidence

- Server static checks passed.
- Controller integration suites passed against Testcontainers: 2 files, 12
  tests. Coverage includes neutral authentication rejection, provider
  unavailability, profile guard ordering, strict request validation,
  cross-tenant no-mutation, self/last-Manager conflicts, successful profile
  change and concurrent Manager demotion invariants.
- The integration fixture now revalidates current `process.env` values in
  `EnvProvider`, allowing the Testcontainer database URL to reach the Nest
  application after module metadata is loaded.
- The session controller route is explicitly `GET /auth/session`; an initial
  missing path segment was corrected before certification.

## F5 evidence

- TanStack route generation passed and the generated route tree is synchronized.
- Web code/type checks and 4-file, 13-test Vitest suite passed. Four existing
  reduced-motion `!important` warnings in `global.css` remain classified as
  pre-existing.
- Auth routes, sanitized return-to behavior, protected pathless layout,
  recovery/error states and the neutral `/app` shell are implemented.
- Automated Playwright integration and manual `browser-use` validation remain
  part of F6; the F5 unit suite is not presented as real-stack evidence.

## F6 evidence

### Pencil validation

The required authentication frames were inspected through the Pencil MCP
connection in `design/onoreo.pen`:

- `mA3b4` — login;
- `JMFTA` — forgot-password initial state;
- `TCmT1` — recovery email confirmation;
- `wxfmd` — new password;
- `fmVfn` — successful reset;
- `FvrFp` — invalid or expired recovery link;
- `RZ6Ql` — unconfirmed-account reference.

All seven frames rendered without broken nodes, collapsed regions or overflow.
The implemented auth surfaces preserve the established Scoops composition,
tokens and reusable layout patterns; no parallel hardcoded design system was
introduced.

### Manual browser-use validation

Manual validation used `browser-use` over CDP against the local Web and Server
applications, not Playwright. Evidence recorded from the browser:

- `/forgot-password`: submitted a syntactically valid email and observed the
  neutral confirmation copy; the browser requested Supabase
  `/auth/v1/recover` with the local reset redirect.
- `/reset-password`: direct navigation showed the expired/invalid-link state
  without exposing protected information.
- Anonymous `/app`: redirected to `/login?returnTo=%2Fapp` and rendered the
  login surface.
- Real local auth: a seeded Manager account completed Supabase password login,
  reached `/app`, displayed the Manager identity, and generated both the
  Supabase token request and Server `GET /auth/session` requests. Logout
  returned to `/login` and cleared the authenticated surface.
- Keyboard path: focusing the email field and pressing Tab moved focus to the
  `Esqueci minha senha` link.
- Narrow viewport: at 320×800, document and body scroll widths remained 320px;
  no horizontal overflow was detected.
- Browser events contained no console errors, runtime exceptions or failed
  network requests. React/Vite informational messages were present only as
  development diagnostics.

- After the final Server bootstrap changes, the local seed command also passed:
  `pnpm --filter server db:seed` with two UUID-only temporary Auth subjects.
  The temporary Auth users and Identity rows were removed after validation.

### Integrated sensors and build gate

- `pnpm format` passed with one warning for the repository's broken
  `.claude/skills/grill-me` symlink; 534 files were formatted.
- Core: code check, type check and 14 tests passed.
- Server: code check, type check and 12 controller tests passed. The concurrent
  suite was repeated after isolating a Testcontainers URL race and then passed
  in the full two-file run.
- Web: route generation, code check, type check and 31 tests passed. The four
  reduced-motion `!important` diagnostics remain pre-existing warnings.
- Automated Playwright integration passed 5 tests; this remains automated
  route/transport coverage and is not substituted for the manual browser-use
  evidence above.
- `pnpm --filter server build`, `pnpm --filter web build` and `pnpm build`
  passed. The existing Web bundle-size warning and Turbo missing-output warning
  remain non-blocking.
- Source, browser bundle and token scans were clean; `git diff --check` passed.

The seed entrypoint now loads decorator metadata, concrete Nest dependencies use
explicit injection where the `tsx` seed runtime cannot emit constructor
metadata, and `EnvProvider` captures validated configuration per application
instance. This fixes both standalone seed execution and parallel Testcontainers
isolation without changing the runtime secret boundary.

## F6 remediation attempt 09

The scoped repair addressed the three findings from the single final Judge:

- `JI-01`: `DrizzleIdentityDatabase` now retries both PostgreSQL serialization
  failures (`40001`) and deadlocks (`40P01`). The clean full Server rerun passed
  2 files and 12 tests. An earlier concurrent run still produced one transient
  `[200, 500]` result; the subsequent full rerun produced the required
  `[200, 409]` outcome and passed the persistence assertion.
- `JI-02`: the focused clean route sensor passed all 4 tests covering login,
  recovery/access-denied states and anonymous `/app` redirect. The test remains
  automated Playwright contract coverage, not manual browser evidence.
- `JI-03`: fresh local Auth users were created with UUID-only seeding. In two
  isolated Chrome profiles controlled serially through `browser-use`, Manager
  and Operator sessions reached `/app` simultaneously with different subjects.
  A DOM fallback was used only for the unlabeled user-menu button: logging out
  Manager ended profile A at `/login` with no `sb-*` storage key while profile B
  remained at `/app` showing `Scoops Operator / Operator`.

The valid recovery flow was exercised manually in `browser-use` from a fresh
Mailpit recovery message. The password form accepted an 8+ character password;
the browser reached `/login`, had no `sb-*` storage key, and its performance
entries included the real Supabase update and global logout requests:
`/auth/v1/user` and `/auth/v1/logout?scope=global`. The local GoTrue template
redirects to the root despite the requested path, so the callback fragment was
captured from the real provider response and opened at `/reset-password` in a
clean browser profile; no token value is recorded here.

The recovery implementation now captures the `type=recovery` intent before
Supabase consumes the hash, persists it in browser `sessionStorage` across
SSR/hydration, and initializes the auth recovery ref before `INITIAL_SESSION`
can race the restore. The marker is cleared after auth resolution, and the
generic Core provider contract remains unchanged.

Current F6 status is `accepted`. The existing final Judge was reused and
returned `accepted` with no blocking findings.

## Final Judge and Quality Gate

The reused `Judge Implementation Final` evaluated Spec revision 16 against
base commit `7062adf7c66354ed39d87179005ec396f1523f3b` plus the integrated
working-tree diff and returned `accepted`. CA-01 through CA-18 passed; no
blocking findings remain.

The closing Quality Gate was run after the Judge:

- `pnpm format` passed; Biome formatted 591 files and reported only the known
  broken `.claude/skills/grill-me` symlink warning.
- Core code/type checks and 14 tests passed.
- Server code/type checks, full test suite (2 files, 12 tests), and build passed.
- Web code/type checks and 32 Vitest tests passed. `check:code` retained the
  four pre-existing reduced-motion `!important` warnings in `global.css`.
- Focused automated route integration passed 4 Playwright tests. Manual UI
  validation remained exclusively `browser-use` CDP, as required by the Plan.
- `pnpm --filter web build`, `pnpm build`, `git diff --check`, and source/bundle/
  token scans passed. Root `pnpm lint` and `pnpm check-types` exited cleanly but
  Turbo executed no package tasks because those package scripts are absent;
  root `pnpm test` is not defined. The package-scoped checks above are the
  authoritative evidence.
- Existing bundle-size/Turbo output warnings, hydration diagnostics and the
  unrelated Inngest port conflict remain non-blocking and documented.

The Spec is completed at revision 16. No commit or pull request was created in
this task because external delivery was not explicitly authorized.

The local Docker stack reported healthy Supabase and Server health endpoints.
The repository's existing `global.css` reduced-motion `!important` warnings,
the existing Vite hydration diagnostic, and the unrelated host port conflict
for the pre-existing Inngest container remain classified as pre-existing.

## Post-completion implementation amendments

The following implementation changes were made after the original F6
certification. They do not alter the feature Contract; they complete the
credential interaction and make the development/staging seed deterministic.

### Password visibility controls

- Login and reset-password fields now expose functional visibility buttons.
- Each control toggles the input between `password` and `text`, updates its
  accessible label and `aria-pressed` state, and uses the shared Lucide `Icon`
  widget with `eye`/`eye-off` icons.
- The login page regression test covers the toggle behavior.
- Web validation passed: 33 Vitest tests, code check, type check and
  `git diff --check`.
- Manual Browser-use CDP validation passed on `/login`: mouse activation and
  keyboard activation changed the input type and accessible state correctly;
  no browser runtime errors were observed.

### Deterministic Supabase Auth seed reset

- `db:seed` now deletes only the fixed Manager and Operator seed users by UUID
  or seed email, recreates them with their fixed UUIDs and password `123456`,
  then clears and repopulates Scoops application data.
- Unrelated Supabase Auth users are not deleted.
- `SUPABASE_SERVICE_ROLE_KEY` is now part of the main server `EnvProvider`
  schema and is reused by the seed entrypoint. The seed-mode schema continues
  to restrict execution to `dev` and `stg`.
- The service-role key remains server-only and is not exposed to the web app.
- Local `pnpm db:seed` passed after provisioning the fixed Auth users; the
  resulting application rows used the expected Manager and Operator UUIDs.
- Server code check and type check passed.

### Pencil validation process amendment

The SDD prompts now require Pencil node inspection and exact page/state mapping
before UI implementation, route-by-route Browser-use CDP validation at the
design viewport, screenshot plus accessibility/DOM comparison, and visual
parity as an acceptance criterion. Manual UI validation is explicitly
Browser-use-based; Playwright remains reserved for automated repository tests.

## Historical Final Judge finding — F6 repair required

The single final Judge returned `failed` and identified three findings:

- `JI-01` (high): concurrent Manager demotion was observed as `500` instead of
  the required `409` in the Server sensor; repair the transaction/error mapping
  and rerun the full controller suite.
- `JI-02` (high): the automated route sensor was reported failing for anonymous
  `/app` and `/access-denied`; rerun from a clean browser context and repair the
  route/test boundary if reproducible.
- `JI-03` (medium): the evidence did not yet contain concrete real-browser proof
  of two preserved simultaneous sessions and a valid reset followed by global
  logout; add serial `browser-use` evidence without presenting mocked Playwright
  as real integration.

This finding is resolved by remediation attempt 09 above. F6 is accepted after
the reused Judge and closing Quality Gate; no second Judge was created.

## Final amendment conclusion — 2026-08-12

The Spec was amended to revision 17 for the password visibility controls,
deterministic Supabase Auth seed reset, nested PostgreSQL serialization-conflict
mapping, and improved identity route tests. The final closing sensors passed:

- Core code/type checks and 14 tests;
- Server code/type checks and 12 tests, including concurrent Manager demotion;
- Web code/type checks, 33 unit tests, and 8 route integration tests;
- full Server/Web/root build;
- local `db:seed` with fixed UUID Auth reset and application repopulation;
- manual Browser-use CDP mouse and keyboard password-eye validation;
- `git diff --check`.

Root `pnpm lint` and `pnpm check-types` completed without failures but executed
no package tasks because the package lint/type scripts are not wired into the
Turbo task graph. The four reduced-motion CSS warnings, bundle-size warning,
Turbo output warnings and known symlink warning remain non-blocking and are
classified as pre-existing/tooling findings.

The final read-only `Judge Implementation` evaluated Spec revision 16 plus the
working-tree amendments and returned `accepted`. CA-01 through CA-18 passed;
no blocking findings remain. The Spec is therefore concluded at revision 17.
