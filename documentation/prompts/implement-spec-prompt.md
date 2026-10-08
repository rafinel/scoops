---
name: implement-spec
description: Implement an open or resumed Spec autonomously, integrate the candidate, verify its contracts, and correct findings until the evidence is ready.
---

# Implement a Spec

Use this single implementation entry point in the current chat:

```text
Spec → autonomous implementation → integrated verification
                                      ↓
                             corrections until passing
                                      ↓
                                 conclude-spec
```

The Spec defines behavior, boundaries, consequential decisions and proofs. The agent
chooses implementation order, decomposition and delegation. Evaluation records actual
progress, evidence and findings; it is not a second task plan. Do not create or maintain
`plan.md`, phase ledgers, dependency waves or task-exit bureaucracy.

## Read and establish scope

Read `documentation/sdd.md`, the current Spec, Modules, Architecture,
`documentation/rules.md`, every selected Rule, and `documentation/tooling.md`.
Read applicable PRDs and Design documentation for the affected behavior. When resuming,
read the colocated Evaluation and its continuation handoff before editing.

Confirm that the Spec is `open` initially or `in_progress` when resuming, its revision is
current, and no material Contract ambiguity remains. Preserve source and Issue traceability.
PRD `PRQ-*` requirements define product intent; their Product Dependency Graph and User
Journeys do not determine implementation order. Do not invent PRD Acceptance Criteria.

Before the first feature edit:

1. set an `open` Spec to `in_progress` and retain its current revision;
2. create or reconcile `evaluation.md` from
   [`evaluation.md`](../templates/sdd/evaluation.md), preserving historical results;
3. inspect current source and the shared worktree; identify scope boundaries, existing
   findings, required services, accounts, fixtures and design references;
4. when browser work applies, run `pnpm --filter web check:playwright` using the documented
   command, correct failures, and record the result before affected implementation;
5. record a concise current result and known blockers in Evaluation.

Freeze the Contract, not the agent's internal implementation choices. Exact public APIs,
required migration artifacts and other explicitly contracted decisions remain authoritative;
ordinary internal file layout and sequencing are chosen within repository Rules. A historical
Plan is context only and does not control execution or readiness.

## Organize and implement

Implement a small cohesive scope directly when appropriate. Delegate independent workstreams
with stable input contracts and non-overlapping paths. Give each Builder a descriptive stable
name, exact Spec revision, relevant `FR-*`/`AC-*`, observable outcome, owned and prohibited
paths, selected Rules and design references. Tell Builders they share the codebase and must
preserve others' edits. Reuse the responsible Builder for related work and corrections.

The main agent owns shared decisions, root configuration, lockfiles, generated/shared files,
integration, Evaluation and the official readiness verdict. Inspect delegated diffs together;
a Builder's report alone does not establish acceptance. Do not require fixed Builder roles,
one agent per layer, a written dispatch ledger or a separate execution artifact.

Run focused checks during development. Use the repository's commands and test-ownership
policy; do not add direct tests to indirect boundaries or weaken tests, coverage thresholds,
complexity baselines or checkers to pass. Run applicable complexity checks at a coherent
composition boundary before expensive checks that a structural correction would invalidate.
Reserve the complete Web integration suite (`pnpm --filter web test:integration`) for final
validation of the integrated candidate. Do not run it during implementation or intermediate
corrections; use focused tests and targeted browser scenarios while making changes. At final
validation, run the complete suite once, then repeat it only when a subsequent correction
affects its claims or an unresolved risk justifies another full run. Keep repeated full builds
and other complete integration suites for the integrated candidate unless an earlier failure,
runtime dependency or Contract requirement justifies them.

For changed HTTP route groups, update the matching
`apps/server/rest-client/<module>/<route-group>.rest` file in the same scope. Verify one
labeled request per controller operation with current method, parameters, headers, body and
reusable non-secret variables. Record route/example parity; it does not prove HTTP behavior.

For changed business rules or correctness-critical logic in eligible Core use cases, execute
the Spec's targeted Stryker checks using `pnpm --filter @scoops/core test:mutation` and the appropriate Tooling
scope options. Targets must be direct files matching `src/**/use-cases/*-use-case.ts`;
supporting Core code remains consumed by tests but is not mutated. Use explicit eligible
package-relative `--files` when automatic selection cannot cover the affected claims.
Inspect HTML/JSON reports and correct actionable survivors or uncovered
logic with behavior-focused tests at allowed boundaries. Record actual scope, command, report
paths, results and evidence-based equivalent/survivor dispositions in `EV-*`/`FND-*` rows.
Dry runs, empty selections and execution errors are not passing mutation proof; successful
execution alone does not satisfy the Spec's semantic pass conditions. No global score
threshold or Web/Server mutation obligation is implied by the Spec's semantic acceptance.
Core CI separately runs the full eligible Core use-case scope with `--all` across four
balanced shards for both the PR target branch and candidate in the same workflow run. Its
gate requires at least 70% per included module (Analytics, Communication, Identity, MRP
and PDV), at least 70% for each changed/new eligible file in those modules, and no exact
score drop for unchanged eligible files. Billing's module and per-file thresholds are
temporarily suspended. It does not replace local assessment of the contracted scope.
After corrections, rerun only invalidated mutation checks and preserve unaffected evidence.

Preserve PRD Implemented checkboxes during implementation. Evaluation `ready` authorizes
conclusion, not PRD closure. Only the approved material-amendment workflow may reset an
affected requirement to unchecked here; `conclude-spec` owns marking delivered requirements.

## Design-backed UI

Read `documentation/design.md`, applicable UI Rules and every required saved reference.
Use `design/handoff.md`; for an existing bundle lacking it, use its legacy
`design/manifest.md` without creating both. Treat node IDs as provenance.
Implementation and runtime validation consume the saved bundle rather than live Pencil.
Missing required design details are Contract gaps; route them for amendment before affected
work rather than inferring behavior from screenshots.

Use the Playwright CLI for all browser interaction and validation. Exercise relevant behavior,
keyboard paths, focus and a narrow viewport, inspect console and failed requests, and verify
the URL, network or persistence result needed by the criterion. For real-service flows,
follow the documented Docker/service health and account preflight; seed only explicitly when
required and authorized, never implicitly from Playwright. Mocked transport does not prove
real authorization, persistence or external-service behavior.

After each visual implementation or correction checkpoint, capture and inspect fresh runtime
screenshots against the assigned references at their exact state and viewport. Record each
comparison and material difference with an `EV-*` row. Include loading, empty, error,
responsive and other states when contracted. Capture under ignored `test-results/` or as CI
artifacts; do not create feature evidence folders or dedicated visual-reference tests.
Stop application processes started for validation and leave shared Docker services running.

## Integrate and verify

Once all source and shared/generated artifacts form one coherent candidate:

1. compare the integrated diff with `FR-*`, `AC-*`, boundaries, exclusions and consequential
   technical decisions; inspect migrations, generated artifacts and REST-client parity;
2. run each applicable complete integration suite once on the integrated candidate, together
   with contracted code, architecture, type, coverage and build checks. Affected Core, Server
   and Web workspaces must meet their configured coverage floors;
3. execute required `MV-*` scenarios with their actual environment and fixtures. Record
   expected and observed results; inspect console, network and persisted state where relevant;
4. record current evidence and criterion coverage in Evaluation;
5. activate exactly one independent read-only
   [`Implementation Reviewer`](../agents/implementation-reviewer-agent.md) for the complete
   candidate. For a design-backed UI candidate, also activate one
   [`Visual Reviewer`](../agents/visual-reviewer-agent.md) with fresh captures and saved
   references. Reviews may run in parallel with verification once their needed inputs exist;
6. verify findings, apply in-Contract corrections automatically, and rerun failed and affected
   checks until every required proof passes.

The structural command `pnpm check:spec-implementation -- <exact-spec-path>` applies only
when the Spec declares exact paths classified as `Create`, `Modify`, `Generate` or `Remove`.
Record its result where applicable and rerun it when its contracted path state changes. It
checks disk/Git conformance, not behavior. Lean Specs without such a path contract do not need
an exhaustive file inventory or this legacy structural gate; do not manufacture one.

Reviewers inspect the Spec, integrated diff and current evidence. They do not automatically
replay browser/manual scenarios or repeat complete suites. Reuse valid evidence; request a
narrow additional check only for a concrete unresolved risk, missing proof or discrepancy.
After a correction, resume the same reviewer only over affected findings and changed surfaces.

## Evidence and corrections

Use the canonical [Evaluation template](../templates/sdd/evaluation.md) and stable `EV-*`,
`MV-*`, `FND-*` and `CI-*` identifiers. Preserve Spec `FR-*`/`AC-*` IDs and historical failed
attempts. Visual rows use `EV-*` with `Type = visual`, never a separate identifier namespace.
Update actual progress and evidence at coherent implementation, validation and correction
checkpoints; do not mirror every edit as a task ledger. Keep one row per criterion, executed
check, manual scenario and required visual reference/state.

Record exact commands/scenarios, observed results, artifacts and findings. Describe executed
check outcomes as passed, failed or blocked; retain pending, stale and not_applicable as
evidence lifecycle states, and explain blockers in the result and linked finding. Mark evidence
`stale` only when a change affects what it proves; retain valid unaffected evidence across
corrections, review and conclusion. A revision change requires an impact assessment rather
than blindly reusing or invalidating every result. Do not claim readiness from stale evidence.
Record branch, diff or checkpoint provenance when useful to establish which candidate a proof
covers; a commit identifier may also serve that purpose. Provenance is not an additional
status gate. The PR CI table records the exact head SHA checked by GitHub.

Fix implementation, test, browser, build, migration and visual defects inside the Contract
without asking permission. Record the finding, invalidate affected evidence, make the smallest
scoped correction, rerun failed/affected checks and continue. Full regression is repeated only
when the change affects its claims or an unresolved risk justifies it. After three materially
identical failures, ask the user only when resolution requires a decision unavailable in the
repository or environment; otherwise change the approach and continue safely.

A required unavailable service, account, fixture, observation capability or external approval
blocks readiness. Record the exact gap and keep Evaluation `in_progress`; do useful independent
work where safe, but never substitute mocks or partial results for the required proof. Pause
only dependent work and ask for a decision/access only when it cannot be obtained within the
current authority. Correctable failures remain correction work, not permission requests.

If a discrepancy changes product intent, scope, design intent, architecture or another
contracted decision, pause affected work and return the Spec to `draft` through `create-spec`.
Update higher authorities first when required, reset materially amended PRD requirements to
unchecked, increment the revision and refresh affected references and evidence. The Spec
Reviewer belongs to `create-spec` and is not an implementation reviewer or recurring gate.
If a declared test conflicts with test-integrity Rules, amend the invalid contract before
editing that test; never weaken the checker.

For accepted findings, capture a reusable lesson only when warranted. If an existing Rule is
clear, fix the code. Route missing/ambiguous reusable guidance through its authority workflow;
feature-local behavior belongs in the Spec. Record the documentation disposition without
requiring a new Rule for every defect.

## Readiness and continuation

Keep Evaluation `in_progress` while required criteria, checks or verified blocking findings
remain open. Set it to `ready` when all required evidence is current, both applicable reviews
are reconciled and no blocking finding remains. Proceed to `conclude-spec` when publication
authority exists; do not mark the Spec completed or check PRD requirements here.

Before interruption or handoff, leave a small continuation record: branch/candidate provenance, current progress, interrupted or uncommitted paths,
unfinished criteria, active blockers, latest checker IDs/results, affected stale evidence and
the next useful action. Do not turn it
into a replacement Plan, phase list or dependency graph. Preserve unrelated user changes.
Conclusion and later review reuse valid evidence and reopen only affected proofs.
