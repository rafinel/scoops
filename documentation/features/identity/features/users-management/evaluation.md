---
title: Identity user management — implementation evidence
spec: ./spec.md
plan: ./plan.md
spec_revision: 2
status: completed
github_issue: https://github.com/rafinel/scoops/issues/5
updated_at: 2026-08-16
---

# Identity user management — implementation evaluation

## PR Quality Gate and closure — 2026-08-16

- Pull request: [#7](https://github.com/rafinel/scoops/pull/7)
- CI-tested head: `0d32461caf6a67e6bad517cdf256c38230da4db9`
- Core CI: passed — [run](https://github.com/rafinel/scoops/actions/runs/31960905575)
- Server CI: passed — [run](https://github.com/rafinel/scoops/actions/runs/31960905547)
- Web CI, including browser integration: passed — [run](https://github.com/rafinel/scoops/actions/runs/31960904245)
- Vercel preview checks: passed for Web and Server.

The earlier Server CI failure was caused by missing non-secret test configuration on
GitHub-hosted runners and was resolved in `1ade8a0`. The earlier Web startup timeout and
listener mismatch were resolved in `8ad1e89` and `0d32461`. The final PR quality gate is
green on the current head. The Spec is now completed; no merge or deployment was performed.

## Final implementation reevaluation — 2026-08-16

The final read-only `Judge Implementation Final` reevaluation accepted the current
worktree against Spec revision 2. No blocking implementation findings remain.

### Current quality gates

- Core: 18 test files / 40 tests passed.
- Server: 16 test files / 36 tests passed.
- Web: 25 test files / 85 tests passed; type checks passed; production client, SSR and
  Nitro build passed.
- Web code checks passed with only the four existing reduced-motion `!important`
  warnings in `apps/web/src/ui/shared/styles/global.css`.
- Canonical Browser integration: 50/50 passed at `http://127.0.0.1:3000`.
- `git diff --check` passed.

### Current manual and visual evidence

- Browser-use/CDP authenticated with the seeded Manager account at the canonical Web
  port. At 320 px, `/users?search=&page=1` reported both document and body scroll widths
  of 320 px and rendered two responsive user cards without horizontal overflow.
- The first user action menu opened, “Rebaixar a operador” opened its confirmation dialog,
  and Escape closed it successfully.
- A real two-session local status flow returned `200 → 401 → 200` for the Operator before,
  during and after Manager inactivation/reactivation.
- Invitation confirmation failure cleanup clears the invitation acceptance marker/local
  session and calls the global provider sign-out path; the behavior has focused hook tests.
- Pencil MCP confirmed the active Scoops document
  `/Ubuntu-22.04/home/petros/projects/scoops/design/onoreo.pen` and the relevant Sidebar,
  Header and user-management components (`K4g10V`, `d8DadK`, `lSA6c`, `RFuUY`, `i5V4HL`,
  `ri3go`).
- No hydration mismatch was observed in the final browser run. A development-only route
  guard state-update warning remains non-blocking and is separate from hydration.

### Final Judge result

**Verdict: ACCEPTED.** The Judge verified CA-01–CA-14, the prior invitation, responsive,
REST, broker, race and page-hook blockers, and found no remaining blocking findings.

This accepted implementation evidence supersedes the earlier pending sections below;
the earlier rejected verdicts remain as historical audit records.

## Final validation pass — 2026-08-16

The rejected implementation blockers were addressed and revalidated against the current
worktree:

- Core: 18 files / 38 tests passed; type checks passed.
- Server: 16 files / 34 tests passed; type checks passed.
- Web: 25 files / 84 tests passed; type checks passed; production client/SSR/Nitro build
  passed. Biome reports only the four existing reduced-motion `!important` warnings in
  `apps/web/src/ui/shared/styles/global.css`.
- Browser integration: `CI=1 pnpm --filter web exec playwright test --workers=1
  --reporter=line` passed all 50 tests.
- Diff hygiene: `git diff --check` passed.

Browser-use/CDP validation was completed against the seeded Manager account on the live
local stack. At a 320px viewport, `/users?search=&page=1` rendered the responsive user
cards with `document.documentElement.scrollWidth === 320` and
`document.body.scrollWidth === 320`; no table was rendered. The first user action menu
opened, its confirmation dialog opened, and Escape closed it while the viewport remained
bounded. The local server health endpoint returned HTTP 200 with database, Supabase and
storage `UP`.

Pencil MCP is now connected. The active design document is
`/Ubuntu-22.04/home/petros/projects/scoops/design/onoreo.pen`; its canvas exposes the
Scoops `K4g10V` Sidebar, `d8DadK` Header, and user-management components `lSA6c`,
`RFuUY`, `i5V4HL`, and `ri3go`. The integrated Pencil browser loaded the current local
application successfully; its unauthenticated screenshot showed the expected Scoops
brand/login surface, while the authenticated responsive flow was validated separately
through Browser-use/CDP.

The automated browser run no longer reports a hydration mismatch. It still emits a React
development warning about a state update before mount during some route-guard cases; this
is tracked separately from the removed hydration mismatch and is not a failed assertion.

This section records validation evidence only. The final implementation-judge verdict is
recorded below after the read-only reevaluation completes.

## Post-rejection blocker fixes — 2026-08-16

The next implementation pass addressed the final judge's JI-01–JI-04 findings:

- Invitation acceptance now enforces both `minLength=8` and `maxLength=64` in the input,
  submit hook and route integration assertion.
- Expired user invitations are discovered separately and finalized only through
  `claimInvitationOperation(operation=expire)`. Stale correction operations verify the
  provider subject email before reconciling local state; expired onboarding cleanup still
  uses its dedicated cleanup claim.
- Server integration tests now exercise resend-vs-cancel and accept-vs-cancel races, and
  Core tests cover expiry arbitration and stale correction reconciliation.
- The Web dev script is canonicalized to port `3000`, and the root document declares the
  shipped `/favicon.svg` so the protected route has no favicon 404.
- A fresh real local two-session flow against server port `3336` returned
  `operator_before=200`, `inactivate=200`, `operator_inactive=401`, `reactivate=200`,
  and `operator_after=200` through `/auth/session`.

Latest gates after these changes: Core 18 files / 40 tests, Server 16 files / 34 tests,
Web 25 files / 84 tests, canonical Playwright browser integration 50/50, all affected
type checks, Core/Server code checks, Web build, and `git diff --check` passed. Web Biome
still reports only the four existing reduced-motion `!important` warnings in
`global.css`. The required final judge reevaluation is pending.

## Current result

The integrated implementation is locally green across Core, Server and Web, but the
committed mocked-transport browser suite passes all 50 tests after correcting two
validation defects found during closing: API route mocks now allow document navigation,
and user queries do not retry failed detail/list requests before showing recovery UI.

The remaining manual evidence gap is environmental. Browser-use could not attach because
this environment has no running Chrome/CDP daemon, and Pencil could not be reattached to
the Scoops design document for a fresh authenticated comparison. No material visual
finding was observed in the previously captured Pencil mapping, but those two checks are
not claimed as freshly executed here.

## Post-evaluation changes and evidence — 2026-08-16

The following substantial changes were completed after the original evaluation:

- Core identity entity fakers were standardized under
  `packages/core/src/identity/domain/entities/fakers`. `AccountFaker`,
  `EstablishmentFaker`, `UserFaker`, `UserAuditRecordFaker`, and
  `UserRegistrationAttemptFaker` now expose `static fake()` and
  `static fakeMany()` methods. All Core use-case tests were migrated from free
  functions to the class API.
- Server onboarding provider fakers now follow the same class API through
  `OnboardingIdentifierProviderFaker` and `OnboardingTokenProviderFaker`; all
  controller test call sites were migrated.
- Server identity test doubles were consolidated into
  `apps/server/src/identity/fixtures/supabase-auth-fixture.ts`, implementing the
  shared `ServerAuthProvider` contract for auth, onboarding and user-access
  behavior.
- The Inngest test double was moved to the shared messaging boundary at
  `apps/server/src/shared/messaging/inngest/inngest-fixture.ts`, and
  `IdentityModuleFixture` now binds it for controller integration tests.
- Web route fixtures now consume the Core faker classes directly. The response
  serialization helper was renamed from `identity-data-fakers.ts` to
  `identity-data-fixtures.ts` to distinguish transport fixtures from domain
  fakers.
- Identity route integration suites were expanded for validation, malformed
  input, loading/pending controls, provider failures, retries, redirects,
  authenticated flows, mutation payloads, and visible outcomes.
- `documentation/rules/web-app-routing-rules.md` now requires detailed route
  integration coverage, transport assertions, stateful mocks, faker-backed
  fixtures, and explicit separation between mocked browser evidence and real
  backend evidence.
- `documentation/rules/core-package-rules.md` now documents the required
  class-based faker pattern, `fake`/`fakeMany` methods, override behavior, and
  barrel exports.
- The application shell was aligned with the mapped Pencil header/sidebar composition:
  the sidebar occupies the full viewport edge, manager-only and subscription navigation
  remain at the bottom, placeholder module routes are available, and the header includes
  global search, notifications and the authenticated account menu.
- The applicable web UI primitives were installed and centralized under
  `apps/web/src/ui/shadcn`. Existing UI surfaces now compose those primitives for
  buttons, inputs, labels, dialogs, alert dialogs, menus, selects, radio groups, tables
  and related controls while retaining `global.css` as the UI project's global style
  entrypoint.
- React Hook Form `^7.85.0` was added to the Web workspace and adopted for the login,
  password-reset and user-invitation forms. The onboarding state machine and minimal
  single-field flows intentionally retain their existing local-state ownership because
  their behavior is not a simple independent form boundary.
- `AuthRouteUnavailableState` follows the required widget boundary with an `index.tsx`
  renderer and colocated `use-auth-route-unavailable-state.ts` behavior hook. The
  user-invitation dialog also retains its index/hook boundary, with profile selection,
  field validation and submit/reset behavior owned by React Hook Form.
- The canonical authenticated application path is `/`; user filtering and navigation
  use `/users` and `/users/$userId` rather than the removed `/app` path.
- The separate Pencil `BRpGr` “Identity / Minha conta” screen was not implemented.
  My Account self-service editing is explicitly out of scope for this Spec and remains
  a follow-up feature.

Validation executed after these changes:

| Boundary | Command/result |
| --- | --- |
| Core | `pnpm --filter @scoops/core check:types` passed; `pnpm --filter @scoops/core test` passed: 18 files / 35 tests. |
| Server | `pnpm --filter server check:code` and `check:types` passed; `pnpm --filter server test` passed: 16 files / 34 tests. |
| Web | `pnpm --filter web check:types` passed; Biome passed for the changed faker, fixture, route-test, and Core test paths. |
| Browser integration | Final post-fixture-rename targeted suites passed: 17/17 tests. The preceding complete identity route/user-management run passed: 45/45 tests. |
| Latest Web UI/form checks | `pnpm --filter web test` passed: 21 files / 73 tests; `pnpm --filter web check:types` passed; `pnpm --filter web build` passed for client, SSR and Nitro output; `pnpm --filter web check:code` passed with the four existing reduced-motion `!important` warnings in `global.css`. |
| Latest focused browser check | Playwright verified the login fields and React Hook Form empty-submit validation alert at `/login`; no browser console errors were reported. Browser-use/CDP remained unavailable, so this is not real authenticated full-stack evidence. |
| Diff hygiene | `git diff --check` passed. |

This is an evidence update, not a new Judge verdict. The earlier **REJECTED**
verdict, the open Browser-use/CDP and Pencil evidence gaps, hydration diagnostics,
and the previously listed product-level blocking findings remain unchanged until
they are separately corrected and reevaluated.

## Quality Gate and build evidence

| Boundary | Command/result |
| --- | --- |
| Formatting | `pnpm format` passed; Biome formatted the worktree and reported only one broken-symlink warning. |
| Diff hygiene | `git diff --check` passed. |
| Core | `check:code` passed for 285 files; `check:types` passed; 18 files / 35 tests passed. |
| Server | `check:code` passed for 169 files; `check:types` passed; 16 files / 34 tests passed; `build` passed. |
| Web | `check:code` passed for 160 files with four known reduced-motion `!important` warnings; `check:types` passed; 24 files / 81 tests passed; `build` passed. |
| Browser integration | `CI=1 pnpm --filter web exec playwright test --workers=1 --reporter=line` passed: 50/50 tests. The focused User detail suite also passed: 5/5. |
| Generated artifacts | `apps/server/src/shared/database/drizzle/migrations/0002_rare_unus.sql`, matching snapshot/journal metadata, and `apps/web/src/routeTree.gen.ts` are generated artifacts in the current diff. |
| Local services | `docker compose ps` showed supporting services running; `GET http://127.0.0.1:3336/health` returned 200 with database, Supabase and storage `UP`; the live Web login endpoint returned 200. |
| Root commands | `pnpm lint` and `pnpm check-types` ran zero Turbo tasks because workspace scripts are named `check:code`/`check:types`; `pnpm test` is unavailable because the root has no test script. Workspace commands above are the authoritative checks documented by `documentation/tooling.md`. |

## Acceptance matrix

| Criteria | Evidence and result |
| --- | --- |
| CA-01, CA-03–CA-12 | Core use-case tests, Server controller integration tests, provider/messaging tests and the real local API evidence recorded below cover tenant boundaries, invitations, audit, status/profile transitions, events and persistence. PASS locally. |
| CA-02 | Users list/detail query and action hooks, Web component tests and route integration cover loading, empty/error/retry, URL filters, pagination and detail history. PASS automatically. |
| CA-04–CA-06 | Invitation controller/use-case suites cover provider compensation, correction, resend, cancellation, expiry and acceptance paths; real Manager/Mailpit evidence is recorded below. PASS automatically and in the recorded local flow. |
| CA-07 | Invitation acceptance route suite covers idle, validation, success and API failure states. PASS automatically. |
| CA-08–CA-10 | Profile/status/name use-case and controller suites cover self-change, last-Manager protection, no-op behavior, audit snapshots and post-commit events. PASS automatically; two-session status evidence is recorded below. |
| CA-11–CA-12 | Detail/audit and Identity event/broker tests cover immutable history and stable handoff. PASS automatically; direct broker failure is test-covered, not live-broker demonstrated. |
| CA-13 | 50/50 route integration plus Web unit/component/hook tests pass. Dialog focus capture/restoration, Escape, Tab trapping and pending controls are implemented. Fresh manual 320 px keyboard inspection remains unavailable without Browser-use. |
| CA-14 | Protected/unauthorized route integration passes and generated route metadata is synchronized. Fresh authenticated manual browser, console and Pencil comparison remain unavailable; Playwright dev mode emits repeated hydration-mismatch diagnostics during auth/error-route cases. |

## Real local workflow evidence

These flows were executed during implementation and retained as part of the feature
evidence:

- An authenticated Manager listed three users, invited a unique pending Operator,
  observed one matching Mailpit message, then cancelled the invitation with HTTP 204;
  the pending user was removed.
- A seeded Operator session returned HTTP 200. A Manager inactivated that Operator; the
  same Operator token then received HTTP 401 from the local status guard. Reactivation
  restored HTTP 200 for the existing Operator token.
- The generated migration was applied locally before the health check above.

## Visual and manual evidence

- Pencil mappings and screenshots were previously captured for `cnfd3`, `lSA6c`,
  `RFuUY`, `ri3go`, `l8YLSD`, `YbW4I`, `vViP2`, `zqSsD`, `G3Ydc`, `V2pGH8`, `oBFH0`
  and `k0jLMr`; the Users desktop composition was structurally intact in that review.
- The current environment has no active Chrome, Browser-use daemon or browser
  connection: `browser-use --doctor` failed all three runtime checks, and a bounded
  `browser-use` launch attempt failed with `chrome-not-running`. Therefore no fresh
  route-by-route CDP screenshot/accessibility audit is claimed.
- Pencil MCP could not reconnect to the Scoops design window; the active editor was
  focused on an unrelated document. No `.pen` contents were read or edited through the
  filesystem.
- Playwright logs include repeated hydration mismatch diagnostics caused by the Vite
  development validation path. The suite is green, but this console finding remains
  recorded for follow-up rather than being presented as a clean-console result.

## Findings and classification

| Finding | Classification | State |
| --- | --- | --- |
| Browser-use/CDP unavailable | Environment limitation; blocks fresh manual evidence only | Open, explicitly justified negative result |
| Fresh authenticated Pencil comparison unavailable | Environment limitation; prior mapping exists but is not refreshed | Open, explicitly justified negative result |
| Hydration mismatch diagnostics in Playwright dev server | Non-blocking follow-up finding; not a failing assertion and not introduced by the user-management route mock defect | Open and recorded for future SSR/devtools cleanup |
| Four Biome warnings for `!important` reduced-motion declarations | Existing design-system accessibility implementation warning; no format/type/test/build failure | Open, non-blocking |
| Root Turbo `lint`/`check-types` task naming and missing root `test` script | Tooling discrepancy documented in `documentation/tooling.md` | Open, non-blocking |

## Documentation alignment

Identity and Communication PRDs, Architecture, Modules, Design and Tooling were checked
against the implementation. Identity owns user/access/audit rules and event facts;
Communication delivery/templates and an outbox remain deferred. No Jira or Confluence
traceability was invented; GitHub Issue #5 remains the source.

## Final Judge

`Judge Implementation Final` is required for this multi-phase Spec. Its read-only verdict,
including treatment of the two environment-blocked manual checks and the hydration
diagnostic, was recorded on 2026-08-15:

**Verdict: REJECTED.**

Blocking findings from the Judge:

- CA-14/RF-14 is not satisfied: hydration diagnostics remain, Browser-use/CDP is
  unavailable, and there is no fresh authenticated Manager/Operator browser evidence.
- The Users list still uses a wide table (`overflow-x-auto` and `min-w-[720px]`) instead
  of the required 320 px card layout without horizontal scrolling.
- RF-06/CA-07 lacks complete provider-subject matching, used-link idempotency, 64-byte
  maximum password validation and invitation-session cleanup after failed confirmation.
- RF-04–RF-06 define invitation-operation claim/finalize coordination, but production
  invitation use cases do not call those methods.
- RF-11 is violated when invite broker failure removes the provider identity after local
  state has already committed.
- RF-12 has a resend success-status mismatch and missing UUID parsing on profile change.
- RF-13 is violated because Users action state and mutation orchestration remain in the
  page component instead of its owning page hook.

The Spec remains `in_progress`. No commit, PR or completion claim is authorized until
the blocking implementation findings are corrected, invalidated sensors are rerun, and
the Judge reevaluates the changed implementation.

## Evaluated commit

`TBD` until the final Conventional Commit is created after the Judge verdict.
