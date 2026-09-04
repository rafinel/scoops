---
name: increase-test-coverage
description: Improve Scoops test coverage with behavior-focused tests, test-integrity compliance, preserved thresholds and evidence-backed validation.
---

# Increase Test Coverage

Use this workflow for an explicit request to improve automated test coverage in an existing
Scoops implementation. It is a maintenance workflow, not a replacement for feature
implementation. If the work changes product behavior, authorization, persistence semantics,
public contracts, runtime architecture or a PRD outcome, stop and route the change through the
normal Issue/Spec workflow before editing the affected implementation.

## Objective

Raise or preserve the affected workspace's meaningful behavioral coverage by adding scenario-
complete tests for currently untested behavior. Coverage percentages are a diagnostic signal, not
the acceptance criterion by themselves. Tests must prove observable outcomes, failure handling,
authorization, persistence, side effects, state transitions and recovery behavior where those
concerns belong to the target boundary.

Do not invent a target percentage for one file or use superficial assertions to increase a metric.
Use the workspace floors and project targets documented in `documentation/tooling.md`:

- Core baseline: 62.4% statements, 57.7% branches, 68.6% functions and 64.5% lines;
- Server baseline: 71.6% statements, 52.7% branches, 71.6% functions and 75.2% lines;
- Web baseline: 52.2% statements, 49.2% branches, 49.0% functions and 54.1% lines;
- Project target: at least 85% statements, functions and lines, and 80% branches in every
  workspace.

Never lower a configured threshold to make the change pass.

## Required authorities and discovery

Before editing, read:

1. `documentation/rules.md` and every Rule selected for the affected paths and behavior;
2. `documentation/tooling.md` for the real workspace commands, coverage configuration and
   test-integrity policy;
3. `documentation/architecture.md` when the target crosses application, persistence, provider,
   messaging or runtime boundaries;
4. `documentation/modules.md` and the owning module PRD when the target involves a business
   capability, actor, permission or product outcome;
5. `documentation/design.md` for UI changes;
6. the current source, existing tests, coverage configuration and any relevant fixtures.

Inspect `test-integrity.config.mjs` and run `pnpm check:test-integrity` before adding test files.
Honor each source classification and test boundary. A source classified as `indirect` must be
covered through its consumers; do not add a forbidden direct test merely to improve a metric.
For Web UI, direct tests belong to the permitted widget boundaries, and browser coverage belongs
in the repository's permitted route or health suites.

## Baseline

Identify the affected workspace and record the current state before editing:

- run its focused test command when available;
- run its `test:coverage` command and inspect the text summary plus
  `<workspace>/coverage/coverage-summary.json`;
- identify uncovered files, functions, branches and lines;
- inspect the source and existing tests around each candidate;
- classify each gap as required behavior, unreachable/defensive code, generated code, an excluded
  boundary or a test-integrity exception.

Do not assume that the lowest percentage is the best first target. Prioritize untested behavior
that can fail in production: domain rules, validation branches, authorization and tenant
boundaries, persistence effects, provider failures, retries/idempotency, REST error mapping,
loading/empty/error/recovery UI states and keyboard-accessible interactions.

## Parallel work and subagents

After the baseline and scenario matrix identify independent workstreams, split them across
subagents whenever parallel execution is useful. Typical independent boundaries are Core,
Validation, Server, Web widgets/routes and standalone tooling, but ownership must follow the
actual source and test boundaries discovered in the repository.

Every subagent assignment must include:

- one clearly bounded responsibility;
- the exact source and test paths it may inspect or edit;
- the coverage gaps or scenarios it owns;
- the applicable Rules, fixtures, commands and expected evidence;
- an explicit prohibition on editing another subagent's paths.

Keep tightly coupled scenarios together and do not parallelize work that would create overlapping
edits, conflicting fixtures or an unclear test owner. The main agent owns shared decisions,
integration, conflict resolution, review of every subagent diff and the final validation run. A
subagent report is not evidence; verify all returned changes on the integrated candidate and
rerun the affected tests and coverage commands.

## Test design

Build a small scenario matrix before implementation. For every selected source boundary, map:

- the public entry point and owning test file;
- the success path and meaningful alternate branches;
- invalid input, missing data, permission failures and dependency failures;
- state transitions, side effects and persistence/provider expectations;
- the acceptance or behavior being proven;
- any intentionally untested or indirect path and its documented reason.

Prefer the smallest test boundary that can prove the behavior. Reuse repository fixtures, fakers,
factories and mocking conventions. Assert observable results and relevant side effects, not only
that a mock method was called. Keep mocked transport, real service integration and manual browser
evidence distinct; one does not substitute for another.

For UI coverage, test the owning widget or route boundary with accessible role/name locators and
include relevant loading, empty, error, recovery, focus, keyboard, responsive, console and failed
request behavior. Use the Playwright CLI for browser interaction and validation. Capture a fresh
screenshot when the change affects rendered appearance; store it under Playwright's ignored
`test-results/` output or as a CI artifact, never under feature documentation evidence folders.

## Implementation

Add or refine tests in the permitted test boundary. Keep the production change zero-behavior or
testability-only unless the user explicitly authorizes a broader correction and the applicable
Spec/PRD process is active. Do not:

- weaken or bypass `test-integrity.config.mjs`;
- add direct tests for excluded or indirect sources;
- replace a required integration, authorization or persistence scenario with a unit mock;
- assert private implementation details when public behavior can be observed;
- add meaningless branches, sleeps, snapshots or duplicated cases for metric inflation;
- commit coverage output, Playwright storage state, credentials or generated local artifacts.

If a gap reveals a real product or implementation defect, record it separately and do not silently
change the behavior as part of a coverage-only task. If a small behavior-preserving refactor is
needed to make a valid boundary testable, explain the reason, keep the diff minimal and validate
that behavior remains unchanged.

## Validation gate

Run the focused tests first, then the full affected workspace checks. Use only commands defined by
the repository; typical exits are:

```bash
pnpm check:test-integrity
pnpm --filter @scoops/core test:coverage
pnpm --filter server test:coverage
pnpm --filter web test:coverage
pnpm test:scripts
```

Run only the commands applicable to changed paths. Add workspace code, architecture, type,
build, database or Playwright checks when the change crosses those boundaries. For browser or
server-backed behavior, verify the documented services and health endpoints first; a mocked test
must not be reported as evidence of a real authenticated or persisted flow.

The final validation must demonstrate that:

- all new tests pass;
- `check:test-integrity` passes;
- each affected workspace remains above its configured floor;
- coverage improves or is preserved, with any unchanged metric explained;
- no threshold, exclusion, test classification or acceptance rule was weakened;
- required UI, runtime, persistence, authorization and integration evidence is current.

## Handoff report

Return a concise evidence-backed report containing:

1. affected workspaces and source/test paths;
2. the uncovered behavior gaps selected and the scenario each new test proves;
3. before/after statements, branches, functions and lines for each affected workspace;
4. exact commands run and their results;
5. test-integrity, integration, browser, persistence or authorization evidence where applicable;
6. remaining gaps with a concrete reason, ownership boundary or follow-up issue.

Do not claim that coverage alone proves feature acceptance, authorization, persistence,
integration correctness or user-journey completion.
