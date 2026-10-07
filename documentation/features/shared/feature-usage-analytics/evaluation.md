---
feature: "shared/feature-usage-analytics"
spec: ./spec.md
spec_revision: 6
status: in_progress
updated_at: 2026-10-06
---

# Evaluation

Evaluation of Spec revision `6` against the current implementation.

Current result: The revision-6 implementation is integrated in the shared worktree and remains `in_progress`. Provider-neutral contracts, validation schemas, the PostHog adapter/context, onboarding and MRP workflow observations, configuration, browser fixtures, and native insight guidance are implemented. AC-02 configuration and AC-12 documentation are supported by their reviews; the other criteria remain pending full integrated proof. Web type, code, architecture, test-integrity, focused consumer/SDK browser checks, and serialized coverage pass. The enabled analytics browser suite passes 8/8 after correcting a retry assertion race. The latest full Playwright run passed 243/243 tests after restoring the route-transition status card and artwork expected by MV-03/MV-04. The Web complexity gate now passes with 0 warnings and 0 errors; no thresholds or baselines were changed. Per revision 6, enabled-valid collection is verified in the intercepted synthetic-`stg` Vite-serve browser fixture. The independent review found no telemetry contract or retry-accounting defect. The source remains GitHub Issue #51 with the Spec's recorded chat amendments. No PRD checkbox was changed.

## Acceptance matrix

| Criterion | Evidence | Status |
| --- | --- | --- |
| AC-01 | EV-03, EV-06, EV-08 | pending |
| AC-02 | EV-03, EV-08 | passed |
| AC-03 | EV-05, EV-07 | pending |
| AC-04 | EV-05, EV-07 | pending |
| AC-05 | EV-05, EV-06, EV-07 | pending |
| AC-06 | EV-05, EV-07 | pending |
| AC-07 | EV-05, EV-06 | pending |
| AC-08 | EV-05, EV-06 | pending |
| AC-09 | EV-05, EV-06 | pending |
| AC-10 | EV-05, EV-07 | pending |
| AC-11 | EV-05, EV-07 | pending |
| AC-12 | EV-09 | passed |
| AC-13 | EV-04, EV-07 | pending |
| AC-14 | EV-05, EV-07 | pending |
| AC-15 | EV-05, EV-07 | pending |

## Automated and runtime evidence

| ID | Layer | Command or scenario | Result | Status |
| --- | --- | --- | --- | --- |
| EV-01 | Web tooling preflight | `pnpm --filter web check:playwright` before implementation | Playwright CLI 1.62.1 health check passed: one Chromium login-page test, including browser, dev-server, page-load, console, network, keyboard, and screenshot checks. Non-blocking pnpm workspace-field and Node color-environment warnings were printed. | passed |
| EV-02 | Core | Core code, architecture, type, complexity, and coverage gates for the shared telemetry contracts; 96 files/270 tests, statements 70.53%, branches 63.34%, functions 77.37%, lines 72.36% | Passed earlier on the integrated contract candidate; no Core files changed after this proof. | passed |
| EV-03 | Validation and Web static checks | Validation code, architecture, type, complexity; `pnpm --filter web check:types`, `pnpm --filter web check:code`, `pnpm --filter web check:architecture` | Validation gates passed. Latest Web type, code, and architecture checks passed; Biome reports 15 warnings and no errors. Architecture: 896 modules/3051 dependencies. | passed |
| EV-04 | Telemetry boundary | Enabled analytics route consumers through the real context, malformed consumer candidates, final transport filtering, retry and peer-tab cases | The integrated enabled-SDK route cases passed 8/8, including malformed consumer observations, retry and peer-tab invalidation. | passed |
| EV-05 | Web consumer behavior | Focused tests for onboarding, confirmation, product registration, stock slot/adjustment, and production dialog | 6 test files passed, 61/61 tests. Serialized broad coverage passed 574 tests; see EV-12. | passed |
| EV-06 | Web browser integration | `pnpm --filter web test:integration --workers=1` | Final serial run passed 243/243 tests in 17.5 minutes. This includes all four MV-03/MV-04 route-status cases after the owning route-transition UI was restored. Earlier blocked external-request failures remain resolved by the local 204 fixture. | passed |
| EV-07 | Enabled SDK browser integration | `SCOOPS_PLAYWRIGHT_ANALYTICS_FIXTURE=1 pnpm --filter web test:integration --grep analytics` | Latest candidate passed all 8 Chromium cases in 51.6 seconds with intercepted PostHog/Sentry and external egress blocked by the fixture. The retry case now waits for the attempt-2 event before asserting the shared `workflow_id`; that focused browser case also passed 1/1. | passed |
| EV-08 | Web build/configuration | `pnpm --filter web build` with PostHog absent/disabled in `dev` and enabled-invalid `stg`; enabled-valid behavior through the synthetic-`stg` Vite-serve fixture | Absent and explicitly disabled `dev` builds passed. Enabled-invalid `stg` rejected malformed `VITE_POSTHOG_API_HOST` before build/upload and named the setting only. Enabled-valid collection passes the intercepted Playwright serve fixture in EV-07. Revision 6 removes the deployed-enabled build/source-map upload from required evidence; existing Sentry gates remain unchanged. | passed |
| EV-09 | Documentation | Review `native-insights.md` against the Spec's event/filter and measurement limits | Event families, filters, seven-day funnel, duration guidance, Monday-start `America/Sao_Paulo` calendar settings, retention semantics, and measurement limits align with the Spec. No live insight is claimed. | passed |
| EV-10 | Repository integrity | `pnpm check:test-integrity`; `git diff --check` | Test-integrity passed (443 tracked test files, 9 changed); diff whitespace check passed. | passed |
| EV-11 | Web complexity | `pnpm --filter web check:complexity` | Integrated run passed: 0 warnings, 0 hard metric errors. Refactored identity handlers/storage, MRP production and stock telemetry helpers, browser-environment parsing, shared layout boundaries and order-confirmation formatting. No baseline or threshold was changed. | passed |
| EV-12 | Web unit coverage | `pnpm --filter web exec vitest run --coverage --passWithNoTests --testTimeout=15000 --maxWorkers=1` | Serialized rerun passed: 217 files, 574 tests. Coverage: statements 56.74%, branches 52.05%, functions 55.97%, lines 58.67%, all above configured floors. The initial parallel run had one scheduler teardown error (`window is not defined`); the isolated implicated file passed 4/4 and the serialized run did not reproduce it. | passed |
| EV-13 | Independent Implementation Review | Read-only review of Spec revision 5, integrated candidate, current evidence, and corrections | Initial review found an operational retry-accounting defect and stale Evaluation claims. The source defect is corrected and verified in EV-07; the evidence mismatch is reconciled in this Evaluation. A refreshed review found no telemetry contract or retry-accounting defect and corrected the FND-07 handoff wording. | passed |
| EV-14 | Independent Spec Amendment Review | Read-only review of Spec revision 6 validation-scope amendment | Confirmed AC-02 remains covered: absent/disabled and malformed-enabled cases are build-checked, enabled-valid collection is exercised through intercepted synthetic-`stg` Vite serve, and the Sentry gate is preserved without requiring its build-only upload plugin. | passed |

## Manual evidence

No manual journey is required by revision 6. The acceptance contract uses allowed consumer tests and intercepted browser SDK transport; it excludes staging project access and remote reporting proof.

## Visual evidence

No visible UI change or design reference is in scope. Fresh implementation screenshots and a Visual Reviewer are not required unless a later in-scope correction affects rendered appearance.

| ID | Type | Surface and state | Viewport | Reference | Implementation | Differences | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |

## Rule and documentation compliance

| Authority | Reference | Result | Notes |
| --- | --- | --- | --- |
| SDD and scope | `documentation/sdd.md`, feature Spec revision 6, GitHub Issue #51 | aligned | Issue is open; Spec retains source traceability and approved amendments. |
| Architecture and ownership | `documentation/architecture.md`, `documentation/modules.md` | aligned | Existing PostHog shared-provision addition is present in the pre-existing worktree diff; Identity/MRP remain owners of workflow facts. |
| Product behavior | Identity and MRP PRDs | aligned | Measurement remains partial; all PRQ Implemented checkboxes are preserved. |
| UI and validation rules | Code Conventions, UI Layer, Web App Routing, Widget Testing, Core Package, Provision Layer, Validation Package rules | aligned | Selected from the Spec's declared layers and checked against actual repository paths. |
| Design and tooling | `documentation/design.md`, `documentation/tooling.md` | aligned | No visual redesign; use pnpm workspace commands and current test-ownership boundaries. |
| Shared worktree | `git status --short --branch` at kickoff | reconciled | Numerous unrelated user edits and untracked feature/history/template files predate implementation; preserve them and scope changes to this Spec. |

## Findings

| ID | Classification | Source | Affected evidence | Status | Resolution |
| --- | --- | --- | --- | --- | --- |
| FND-01 | complexity gate | Web CodeMultiVitals check | EV-11 | resolved | Refactored the flagged identity, MRP, environment, shared layout, and PDV functions until the integrated check passed with 0 warnings and 0 errors. No baseline or threshold changes. |
| FND-02 | browser fixture behavior | Automatic analytics egress fixture | EV-06 | resolved | Replaced `route.abort('blockedbyclient')` with a local 204 response for denied external egress. Previously noisy clean-console assertions now pass across the full suite. No external request is sent. |
| FND-03 | test-runner / coverage | Parallel Vitest teardown | EV-12 | resolved | The isolated dialog suite passed 4/4 and the serialized full coverage run passed 217 files/574 tests with all configured floors met; the parallel-only unhandled scheduler error did not recur. |
| FND-04 | validation scope | Deployed-enabled Web build/source-map upload proof | EV-08 | resolved | Revision 6, directed by the user, removes this build/upload from required evidence. Enabled-valid collection is covered by the intercepted synthetic-`stg` Vite-serve case in EV-07; malformed enabled configuration remains build-tested and the Sentry gate is unchanged. |
| FND-05 | workflow telemetry correctness | Independent Implementation Reviewer; operational completion lifecycle | EV-05, EV-07 | resolved | Removed immediate workflow closure on operational completion. Added a consumer-boundary browser scenario that records two successful attempts on one occurrence; EV-07 passes 8/8 and confirms attempt 1 then 2 with the same `workflow_id`. The reviewer verified the correction. |
| FND-06 | evidence lifecycle | Independent Implementation Reviewer | Evaluation, EV-02–EV-10 | resolved | Reconciled the kickoff-only Evaluation with the current implementation, checks, failures, stale proofs, and handoff. |
| FND-07 | unrelated integration failure | Route-transition-feedback browser cases | EV-06 | resolved | Restored the route-status card and 96×96 artwork in the owning shared UI. The focused route suite passed 11/11 and the full Web integration suite passed 243/243, including both viewports and reduced motion. |

## Lessons learned

- No durable implementation lesson identified at kickoff.

## PR CI quality gate

| ID | Workflow | Head SHA | Result | Run |
| --- | --- | --- | --- | --- |

## Continuation handoff

- **Branch/candidate:** `main`, current shared-worktree candidate; extensive unrelated pre-existing changes remain. Spec revision 6 and this Evaluation are task-owned.
- **Progress:** Implementation integrated. Focused consumer tests (61/61) and enabled analytics browser cases (8/8) pass; static Web type/code/architecture, repository integrity, Core/Validation gates and safe build cases pass. The latest full Web integration run passed 243/243, including the route-transition cases previously tracked as FND-07. The Web complexity gate now passes with 0 warnings and 0 errors, with thresholds and baseline unchanged. The independent review found no telemetry contract or retry-accounting defect.
- **Interrupted/uncommitted paths:** Existing user changes across `documentation/**`, unrelated feature history/evaluations/specs, and templates; preserve them. The task-owned change set also spans the shared Core/Validation analytics contracts, Web telemetry provider/context and Identity/MRP consumers, analytics fixtures/tests, and this Spec/Evaluation; do not treat the shared worktree as a clean branch.
- **Unfinished criteria:** AC-01, AC-03 through AC-11, and AC-13 through AC-15; AC-02 configuration and AC-12 documentation passed.
- **Blockers and stale evidence:** FND-01 through FND-07 are resolved. Remote ingestion and configured insights remain excluded by the Contract.
- **Latest checkers:** EV-01–EV-14 passed, including EV-06 (243/243).
- **Next useful action:** Continue the remaining analytics acceptance evidence; no route-transition integration failure remains.

## History

| Date/Time | Event |
| --- | --- |
| 2026-10-05 | Opened Spec revision 5 for implementation and recorded the required pre-implementation Playwright CLI preflight. |
| 2026-10-06 | Implemented the telemetry contracts, adapter/context and owning Identity/MRP observations; recorded current integrated checks and blockers. |

| 2026-10-06 | Resolved FND-07 after the route-status card/artwork regression was fixed; the focused route suite passed 11/11 and the full serial Web integration suite passed 243/243. |
