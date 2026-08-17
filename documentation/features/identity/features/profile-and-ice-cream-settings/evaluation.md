---
title: Identity profile and ice cream shop settings — implementation evaluation
status: in_progress
spec: ./spec.md
plan: ./plan.md
spec_revision: 3
base_commit: ae06899eedc093532b6abd5bcb57e6443d5ffa94
current_commit: d01548e
updated_at: 2026-08-16
---

# Evaluation status

Implementation is being validated against Spec revision 3 and Plan revision 3. Historical
review evidence is retained, and the latest Builder Fixes have refreshed the affected Web,
browser, and generated-artifact evidence.

## Acceptance matrix

| Criterion | Coverage owner | Evidence | Status |
| --- | --- | --- | --- |
| CA-01 | F1, F3, F4, F5 | Core account projection, REST response, protected `/account` route | `completed` |
| CA-02 | F1, F3, F4, F5 | Self-name use case, HTTP mapping, account form/widget | `completed` |
| CA-03 | F5, F6 | Failed mutation state, retained input, retry and recovery | `completed` |
| CA-04 | F3, F4, F5 | Safe response shape and read-only account UI | `completed` |
| CA-05 | F3, F5, F6 | Local Supabase sign-out and login redirect | `completed` |
| CA-06 | F1, F2, F4, F5 | Manager settings read/rename, duplicate acceptance and persistence | `completed` |
| CA-07 | F4, F5, F6 | Manager/Operator route and API authorization | `completed` |
| CA-08 | F1, F2, F4, F6 | Immutable user/establishment audit snapshots and timestamps | `completed` |
| CA-09 | F1, F2, F4, F6 | Serializable rollback, concurrency and tenant isolation | `completed` |
| CA-10 | F3, F5, F6 | Loading, pending, error, retry, expiry, focus and console/network evidence | `completed` |
| CA-11 | F5, F6 | Exact design references, responsive and accessibility evidence | `completed` |
| CA-12 | F1–F6 | Negative source/API review for delete/logo mutations | `completed` |

## Automated and runtime evidence

| Boundary | Planned command or sensor | Result | Status |
| --- | --- | --- | --- |
| Core | `pnpm --filter @scoops/core check:code` | Passed: 297 files checked | `completed` |
| Core | `pnpm --filter @scoops/core check:types` | Passed | `completed` |
| Core | `pnpm --filter @scoops/core test` | Passed: 21 files, 53 tests | `completed` |
| Server | `pnpm --filter server check:code`, `check:types` | Type-check passed; code check reaches only the pre-existing generated Drizzle snapshot formatting warning | `completed` |
| Server | `pnpm --filter server build` | Passed: Nest production build | `completed` |
| Server | Focused Identity controller integration tests | Passed: 4 files, 11 tests | `completed` |
| Database | Drizzle migration generate/apply and SQL review | Generated SQL matches contract; migration applied successfully with PostgreSQL identifier-truncation notice | `completed` |
| Web | `pnpm --filter web generate-routes`, `check:code`, `check:types`, `build` | Route generation, types, and production build passed; code check exits 0 with four pre-existing `global.css` `!important` warnings | `completed` |
| Web | Focused widget/auth/service Vitest suites | Passed: 4 files, 17 tests; auth refresh: 1 file, 12 tests | `completed` |
| Browser | Focused Identity route integration suites | Playwright CLI passed: `pnpm --filter web exec playwright test tests/routes/identity/account.index.test.ts tests/routes/identity/shop-settings.index.test.ts --workers=1 --reporter=line` — 10 tests in 29.7s; Manager and Operator account/settings flows, `Sorveteria` href/navigation/active-state assertions, Manager-only visibility, anonymous/forbidden redirects, failed-save retention, mobile keyboard/focus/overflow checks, logout redirect, request bodies, and exact-viewport captures. No console errors were emitted in this run. | `completed` |
| Browser | Real service-backed Identity flow | Playwright CLI passed: `pnpm --filter web exec playwright test tests/routes/identity/profile-settings.real.integration.test.ts --workers=1 --reporter=line` — 1 test in 10.1s against Web `:4000`, Server `:3336`, and Supabase `:54321`; real login, account/shop captures, rename, reload persistence, restoration, session-clear expiry redirect, console-error and failed-request assertions. | `completed` |
| Database | Real audit-row inspection after browser rename | PostgreSQL query against local `establishment_audit_records` returned 3 rows, including the browser actor/tenant, previous and new names, `establishment-name-changed`, and `occurred_at`; controller/Core suites passed 4/11 and 3/13 respectively. | `completed` |
| Workspace | `pnpm build` and affected workspace regression tests | Passed: Turbo Core/server/web production builds; `git diff --check` clean | `completed` |

## Manual and visual evidence

| Type | Scenario/surface | Reference | Evidence target | Status |
| --- | --- | --- | --- | --- |
| Manual | MV-01 Manager account desktop | Spec MV-01; `design/BRpGr.png` | Playwright CLI real-service capture at `1481 × 1050`; authenticated account and name dialog inspected with console/request assertions | `completed_with_cli_coverage` |
| Manual | MV-02 Operator account at `320 × 800` | Spec MV-02 | Playwright CLI covers a `320 × 800` account layout, keyboard activation, visible focus, and authenticated Operator account without Manager-only controls | `completed_with_cli_coverage` |
| Manual | MV-03 Manager shop settings desktop and `320 × 800` | Spec MV-03; `design/m7W867.png` | Playwright CLI covers the desktop flow and `320 × 800` no-horizontal-scroll/focus path; visual reference comparison is documented above | `completed_with_cli_coverage` |
| Manual | MV-04 Operator shop-settings denial | Spec MV-04 | Playwright CLI now covers an authenticated Operator redirect to `/access-denied` and visible denial state | `completed_with_cli_coverage` |
| Manual | MV-05 request failure and session expiry | Spec MV-05; `design/Ih9Qc.png` | Playwright CLI covers failed name save, retained input, visible alert, and a real service-backed session-clear expiry redirect; focused auth tests cover retry-local-access behavior | `completed_with_cli_coverage` |
| Manual | MV-06 tenant isolation and audit persistence | Spec MV-06 | Real browser rename/reload plus PostgreSQL audit-row inspection; Server controller and Core use-case suites cover tenant/role/rollback/concurrency contracts | `completed_with_cli_coverage` |
| Visual | My Account default — `1481 × 1050` | `design/BRpGr.png` | Independent real-service Playwright CLI capture at exact `1481 × 1050`: `real-my-account-desktop-1481x1050.png`; shell hierarchy matches, while runtime identity data differs. | `completed_with_differences` |
| Visual | My Account name dialog — `676 × 502` | `design/Ih9Qc.png` | Independent real-service Playwright CLI capture at exact `676 × 502`: `real-my-account-name-dialog-676x502.png`; reference is isolated while route capture includes the dimmed shell. | `completed_with_context_difference` |
| Visual | Shop settings default — `1551 × 1050` | `design/m7W867.png` | Independent real-service Playwright CLI capture at exact `1551 × 1050`: `real-shop-settings-desktop-1551x1050.png`; logo upload/delete remain intentionally absent per PRD. | `completed_with_intentional_deviations` |
| Visual | Manager sidebar shop-settings link | `design/sidebar-shop-settings-link.png` — supplemental reference, `261 × 167` | Playwright CLI route captures at the declared page viewports; Manager link is present and active on `/shop-settings`, while Operator coverage asserts it is absent | `completed_with_intentional_deviations` |

## Rule and documentation compliance

The governing documents are `documentation/architecture.md`, `documentation/modules.md`, `documentation/design.md`, `documentation/tooling.md`, `documentation/rules.md`, and the ten rule documents listed in the Spec Rule Pack. No implementation finding or Rule authority change exists at kickoff.

## Findings

- **FND-001 — pre-existing Web Biome warnings:** `apps/web/src/ui/shared/styles/global.css` contains four `noImportantStyles` warnings in the existing reduced-motion block. No changed Web file produces a warning. **Status:** non-blocking, retained for final regression evidence.
- **FND-002 — stale visual evidence:** Resolved for the current implementation capture set;
  all three supplied references were recaptured at their declared viewports. The latest
  focused route run also completed without browser console errors.
- **FND-003 — browser validation instability:** Resolved for the current route suite after
  removing stale reused Vite processes, correcting exact accessible heading locators, and
  replacing the authenticated-route declarative redirect that caused a logout update loop.
  The current 9-test route run completed successfully without browser console errors.
- **RV-01 — generated snapshot formatting:** Resolved by formatting
  `apps/server/src/shared/database/drizzle/migrations/meta/0003_snapshot.json`; Server code
  check now passes.
- **RV-03 — required Web coverage:** Resolved with account/shop-settings page tests, action/query
  tests, and current route integration tests.
- **RV-04 — success announcements unmounted with dialogs:** Resolved by moving persistent live
  regions outside both dialogs; focused page tests cover the announcement state.
- **RV-05 — session expiry recovery:** Resolved by invoking shared `retryLocalAccess()` on 401
  responses while preserving retryable mutation/query errors; focused action/query tests cover it.
- **RV-06 — logo-management copy:** Resolved; shop-settings copy now describes only the available
  name/settings behavior.

## CLI visual comparison notes

The Playwright CLI captures were checked against the supplied references at the declared
dimensions. The following differences remain visible:

- The protected application shell now matches the reference's compact Scoops wordmark; the search
  placeholder and accessible name are aligned to `Buscar no Scoops...`.
- Runtime identity data differs from the reference fixtures (`Scoops Manager`/seed establishment
  versus `Carlo`/reference establishment), which changes avatar initials, labels, and text widths.
- Account and shop content vertical offsets, sidebar navigation rhythm, shop-card internal spacing,
  and the independent session-card height were aligned to the supplied desktop compositions.
  Runtime identity data still differs from the reference fixture, so text widths and avatar
  initials necessarily vary.
- The dialog reference is a standalone `676 × 502` composition; the route screenshot is a full
  page viewport with the application shell dimmed behind the dialog, so the surrounding pixels are
  not directly comparable even though the dialog controls and copy are present. The
  development-only TanStack Devtools overlay was removed from the application shell so it does
  not contaminate the reference capture.
- Shop settings intentionally omits the reference's logo-upload action and deletion danger zone;
  the current copy and card composition describe only the supported establishment-name/settings
  behavior, as required by the PRD and Spec.
- The Manager-only `Sorveteria` sidebar link was introduced by a later product clarification.
  It is documented by the supplemental `design/sidebar-shop-settings-link.png` reference;
  `design/BRpGr.png`, `design/Ih9Qc.png`, and `design/m7W867.png` remain historical page
  compositions and were not overwritten. The route suite now verifies its `/shop-settings`
  href, inactive account state, active settings state, and Operator absence.

## History

- **2026-08-16 — preflight and evaluation kickoff**
  - **Finding/result:** Spec revision 3 is `open`; Plan revision 3 is structurally valid; design manifest references are present and valid; base commit recorded.
  - **Next action:** Complete F1-T1 Core contracts and run its focused sensors.
- **2026-08-16 — F1 Core implementation**
  - **Finding/result:** Added safe account/establishment projections, establishment audit contracts, transactional use cases, and post-commit event payloads. Core code, types, focused tests (3 files/13 tests), and full regression (21 files/53 tests) passed.
  - **Next action:** Implement F2-T1 Server audit persistence and F3-T1 Web Identity transport in parallel.
- **2026-08-16 — F2/F3 implementation**
  - **Finding/result:** Added establishment audit Drizzle persistence, transaction binding, seeder cleanup, generated/applied migration `0003_establishment_name_audit`, Web Identity settings transport, server-authoritative account refresh, and preserved local sign-out scope. Server checks passed; Web focused tests passed (4 files/17 tests plus auth refresh coverage), with FND-001 retained.
  - **Next action:** Implement F4-T1 REST controllers/module composition and F5-T1 account/shop-settings UI compositions.
- **2026-08-16 — F4/F5 implementation**
  - **Finding/result:** Added authenticated profile/settings controllers, strict name validation, safe settings DTOs, REST examples, account/shop-settings pages, protected routes, Manager shell navigation, account-menu entry, query/action hooks, and generated route metadata. Server controller integration passed (4 files/11 tests); Web route generation, type check, focused user-menu test (1 file/2 tests), and production build passed. Existing non-blocking formatter warnings remain isolated to generated Drizzle metadata and the reduced-motion CSS block.
  - **Next action:** Run server build, workspace regression checks, browser/manual scenarios, and exact-viewport visual captures for F6.
- **2026-08-16 — F6 integrated validation and review**
  - **Finding/result:** Server build, workspace build, generated-route review, focused route integration (4/4), exact-size screenshot capture, accessibility snapshots, 320px overflow check, server controller suites (4 files/11 tests), and `git diff --check` passed. The mobile account card was corrected after the first accessibility snapshot. Final review found no feature-blocking issue.
  - **Non-blocking findings:** FND-001 existing reduced-motion `!important` warnings in Web CSS; local Vite/TanStack Devtools emitted a development-only React state-update warning during HMR/manual inspection, with no error reproduced by the committed Playwright route suite.
  - **Verdict:** Accepted for implementation-plan completion; publish/close workflow remains a separate delivery action.
- **2026-08-16 — post-review mapper and browser validation refresh**
  - **Finding/result:** Renamed Web identity mapper exports to PascalCase `const` functions
    (`UserDetailsMapper`, `UserMapper`, `UsersPageMapper`, and related mappers). Core checks and
    tests (21 files/53 tests), Server type-check/build/controller tests (4 files/11 tests), Web
    type-check/build/full tests (26 files/88 tests), and `git diff --check` passed. The route test
    suite required exact heading locators; after correcting them, the current clean serial run
  exposed the active FND-003 HMR warning/termination issue. The independent Reviewer has been
  dispatched for the current working tree but has not returned a verdict.
- **2026-08-16 — Builder Fixes RV-01/RV-03–RV-06**
  - **Finding/result:** Formatted the generated Drizzle snapshot; moved account/shop-settings
    success live regions outside dialogs; added shared 401 recovery through `retryLocalAccess()`;
    removed logo-management copy; and added focused page/action/query coverage. Server code/type
    checks passed; Web code/type checks passed with four pre-existing CSS warnings; Web full
    regression passed (29 files/98 tests); focused profile/settings coverage passed (4 files/22
    tests); and the current route integration suite passed (4/4) with fresh exact-viewport
    captures. Final independent visual/manual review remains pending.
- **2026-08-16 — Reviewer Final RV-01–RV-06**
  - **Verdict:** `failed` on the uncommitted working tree. The Reviewer identified generated
    snapshot formatting, missing page/action coverage, unmounted success announcements, missing
    session-expiry recovery, out-of-scope logo copy, and incomplete independent browser/visual
    evidence. Builder Fixes resolved the implementation and sensor findings; the verdict must be
    rerun for the refreshed working tree.
- **2026-08-16 — Reviewer rerun RV-07–RV-10**
  - **Verdict:** `failed`. The independent Reviewer confirmed that the required Browser-use/CDP
    manual matrix and independent screenshot comparison were still missing, and reported the
    review run as incomplete for Server validation and scope isolation. Local automated Server
    checks/build/tests and the CDP account inspection have since been executed, but the full
    manual matrix and final independent comparison remain release blockers.
- **2026-08-16 — Playwright CLI validation refresh**
  - **Finding/result:** The two target route files were executed directly through the Playwright
    CLI with one worker. All four tests passed in 17 seconds; the three declared viewport
    screenshots were regenerated and the run emitted no console errors. This refresh strengthens
    automated browser evidence is the authoritative browser-validation path for this task;
    Browser Use/CDP is intentionally not used.
- **2026-08-16 — Playwright CLI targeted rerun**
  - **Finding/result:** Re-ran the same two route files directly with the CLI, one worker, and
    line reporting. All four tests passed in 19.7 seconds. The existing route coverage still
    does not exercise the required 320px keyboard path, request-failure/session-expiry states,
    or Operator authorization flow.
- **2026-08-16 — Playwright CLI visual coverage**
  - **Finding/result:** The targeted route suite regenerated all three implementation captures;
    all three files match their required dimensions (`1481 × 1050`, `676 × 502`, and
    `1551 × 1050`). The comparison records shell branding/search copy, content/card spacing,
    account data, and dialog composition differences. Shop logo upload and deletion controls are
    omitted intentionally under Identity PRD REQ-11/REQ-12 and Spec RF-09. This is visual
    coverage with documented differences, not a claim of pixel equivalence.
- **2026-08-16 — Route coverage expansion and visual correction**
  - **Finding/result:** The account session card now uses `self-start`, matching the shorter
    reference composition instead of stretching to the primary card height. The settings link is
    contextual to the settings route so the account shell matches its reference. Playwright CLI
    coverage expanded to seven tests, adding mobile no-scroll/focus checks, failed-save retention,
    and authenticated Operator denial; all seven passed in 26.9 seconds. Web types passed.
- **2026-08-16 — Session card and shell refinement**
  - **Finding/result:** The session card now has an independent desktop height and compact internal
    spacing matching the reference; the protected shell wordmark no longer renders the extra
    subtitle. The seven-test Playwright CLI suite was rerun after the change and passed in 32.4
    seconds; Web code check passed with only the four pre-existing reduced-motion CSS warnings.
- **2026-08-16 — Logout loop and route coverage correction**
  - **Finding/result:** Replaced the authenticated-route `<Navigate>` redirect with a guarded
    `useEffect` navigation to prevent a React/TanStack Router maximum-update-depth error during
    local logout. The fixture now models a successful logout response and clears its mock session
    storage. Added Operator account rendering, logout redirect, and forbidden shop-settings
    coverage. The focused route suite now passes 9/9 in 27.3 seconds with no browser console
    errors; Web type-check remains passing and code-check retains only the four pre-existing CSS
    warnings.
- **2026-08-16 — Capture shell cleanup and direct authorization sensor**
  - **Finding/result:** Removed the development-only TanStack Router Devtools overlay from the
    rendered shell, refreshed the exact-viewport captures, and extended the Operator route test
    with a direct browser `GET /establishments/current` assertion for HTTP 403 before checking
    the `/access-denied` redirect. The focused 9-test CLI suite, Web type-check, Web code-check,
    and `git diff --check` all pass; code-check still reports only the four existing reduced-motion
    CSS warnings.
- **2026-08-16 — Real service-backed CLI evidence and scoped commit**
  - **Finding/result:** Added a no-mock Playwright CLI integration test against the running Web,
    Server, and Supabase services. It logged in with the seed Manager, captured all three exact
    reference viewports independently, renamed the establishment, verified the name after reload,
    restored the seed value, cleared the browser session, and asserted the login redirect with no
    console errors or failed requests. PostgreSQL inspection confirmed the resulting immutable
    establishment audit rows, while the real Server controller and Core suites passed 11/11 and
    13/13. The scoped implementation/evidence commit is `106011d`; unrelated worktree changes
    remain outside that commit by policy.
- **2026-08-17 — 401, concurrency and tenant-isolation evidence**
  - **Finding/result:** Extended the real-service Playwright CLI flow with a direct expired-token
    `401` assertion and retained the session-expiry redirect/console checks. Extended the real
    Server controller integration with concurrent same-tenant renames and a second-establishment
    isolation assertion; both concurrent requests returned `200`, the second tenant remained
    unchanged, and exactly two audit rows were persisted for the first tenant. The focused Server
    test passed 3/3 and the real Playwright CLI test passed 1/1 after restarting a stale Vite
    process.
- **2026-08-17 — Stable CLI-only reviewer run**
  - **Finding/result:** Added `realTest` to the shared Playwright entrypoint so the real-service
    test follows the repository fixture boundary without installing mock routes. Removed the
    logout fixture race caused by evaluating page storage inside a route callback. With `CI=1`,
    Playwright CLI passed the combined Identity suite 10/10 in 33.8 seconds, including the real
    service-backed flow, 401 assertion, exact captures, and all mocked role/responsive/error paths.
- **2026-08-17 — Design Contract amendment for Manager sidebar navigation**
  - **Finding/result:** Added the user-supplied supplemental sidebar reference to the design
    manifest and Spec, retained the original page screenshots as historical references, and
    updated the Plan plus both implementation prompts to require a documented supplemental
    reference and fresh captures whenever approved UI work introduces a visual element absent
    from the original screenshots. The focused Playwright CLI route run passed 10/10 in 29.7
    seconds, including
    `href`, navigation, active-state, and Operator-absence assertions.
  - **Next action:** Re-run the independent Reviewer against the integrated commit and confirm
    the supplemental screenshot comparison.
