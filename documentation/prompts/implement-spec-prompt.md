---
name: implement-spec
description: Orchestrate an open or resumed Spec through direct or Plan-backed implementation, living evaluation evidence, corrections and integrated validation.
---

# Implement a Spec

Use this as the single implementation entry point for every feature Spec. Select the execution
strategy from the current artifacts; do not require the user to choose another implementation
prompt:

```text
implement-spec
├── no current Plan → Builder Direct in the current context
└── current Plan    → stable ownership Builders by dependency wave
                     ↓
             integrated candidate
                     ↓
        one Implementation Reviewer + sensors
                     ↓
                conclude-spec
```

Run the workflow in the current task. Do not create another user-owned thread.

## Strategy selection

Read `documentation/sdd.md` and its mandatory authorities—the Spec, Modules,
Architecture, `documentation/rules.md`, every selected Rule and
`documentation/tooling.md`—then inspect colocated `plan.md` when present.

| Condition | Strategy |
| --- | --- |
| Current, non-superseded Plan references the exact Spec revision | Plan-backed execution |
| No current Plan and the Spec recommends a small cohesive delivery | Direct execution |
| No current Plan but dependencies, risk or recovery state require one | Invoke `create-plan`, then continue here with Plan-backed execution |
| Plan is stale after a Spec amendment | Reconcile or recreate it before dependent work |
| Revised Spec no longer requires its Plan | Set the Plan to `superseded`, then use direct execution |

A completed Plan remains current when conclusion or PR feedback reopens an in-Contract
correction; reopen only its affected phases/tasks. Never route from this workflow to
another implementation prompt.

The PRD Product Dependency Graph is product authority, not an execution plan. Do not derive
Builder order, technical prerequisites, Plan phases, waves or parallelism from it. Derive those
only from the current Spec's Technical Contract, affected paths, runtime dependencies and
ownership boundaries.

## Fail-closed implementation invariants

These are execution requirements, not recommendations. If any invariant cannot be verified,
stop before editing feature source and report the exact blocker:

- `implement-spec` is the only implementation entry point. Do not revive, delegate to or
  simulate a removed implementation workflow.
- No feature source, test, generated artifact or migration edit starts until a scoped execution
  assignment is activated and the preflight checklist below is recorded in an Evaluation
  materialized from `documentation/templates/evaluation.md`.
- The Orchestrator may assume the recorded `Builder Direct` role in the current context for a
  small cohesive delivery. Plan-backed work requires scoped ownership Builders; the Orchestrator
  may inspect, coordinate and integrate, but may not replace them with unscoped direct edits. A
  Builder report is not evidence; the Orchestrator must inspect the resulting diff and execute
  the validation exits.
- The Spec's exact revision, required file/widget tree, contracts, exclusions and validation
  exits are authoritative. Existing code structure, a screenshot, a passing test or a user
  message cannot silently override them.
- Any affected `apps/server/rest-client/**/*.rest` file is part of the implementation scope,
  not an optional documentation afterthought. A route-group change cannot be handed off until
  its matching example file is present, assigned, route-complete and synchronized with the
  current request contract.
- Preserve the applicable PRD's Implemented checkboxes during normal delivery.
  `implement-spec` never changes an unchecked requirement to checked; it changes a checkbox only
  to reset a materially amended requirement to unchecked through the approved Contract-change
  workflow. Evaluation `ready` means the implementation evidence can enter conclusion; it is not
  PRD closure and does not authorize checking a PRD requirement.
- An implementation, test, browser, network, console, build, migration or visual error within
  the current Contract is an automatic correction: record it, invalidate affected evidence,
  continue the responsible Builder or activate a scoped Builder Fix only when it cannot be
  resumed or the correction is genuinely independent, fix it immediately, and rerun the
  affected checks. Never pause for permission to resolve an in-Contract discrepancy.
- A UI change is not validated by a passing test alone. It requires the required behavioral
  assertions plus a fresh Playwright CLI screenshot at each affected reference/state and an
  inspected comparison recorded in Evaluation.
- Never claim readiness from evidence captured before the latest affected change. Mark it
  `stale` and recapture it.
- Evaluation is a living ledger, not a final report: after every implementation, test, browser,
  generated-artifact, migration, documentation or validation change, update the colocated
  `evaluation.md` in the same task with the exact command/scenario, result, evidence IDs,
  freshness and applicable lesson/disposition. Invalidate affected prior evidence immediately. Do not report
  completion, readiness or a passing validation result while the current change is absent from
  Evaluation.

## Builder activation gate

For feature implementation changes, the Orchestrator must activate a scoped execution assignment
before any feature source is edited. The assignment must receive the exact Spec revision,
Spec `CA-*` acceptance criteria, mapped PRD `REQ-*` requirements or source statements, required
file/widget tree, allowed paths, Rule Pack, design references and validation exits; its
activation and scope must be recorded in Evaluation and the current execution artifacts. PRDs do
not define a separate Acceptance Criteria section.

Use `Builder Direct` in the current agent context for a small cohesive delivery that fits
comfortably with correction and validation headroom. With a current Plan, activate stable
ownership Builders derived from the affected applications, packages and module boundaries. The
current Scoops affinities are `Builder Core` for `packages/core/**`, `Builder Validation` for
`packages/validation/**`, `Builder Server` for `apps/server/**` and `Builder Web` for
`apps/web/**`. Activate only affected Builders; group small or tightly coupled package work into
one cohesive ownership assignment, and add future package-specific Builders only when their work
is substantial, path-independent and worth the context-loading cost.

The Orchestrator coordinates, inspects, integrates and validates Plan-backed work but must not
silently replace an activated ownership Builder with direct feature implementation. If the
required assignment cannot be activated, stop before editing feature code and report the
orchestration blocker. Prompt, Spec, Plan or evaluation-only documentation maintenance may be
handled directly when explicitly requested.

### Subagent display names

Pass an explicit stable `task_name` whenever activating a subagent so the Subagents panel shows
its role and ownership boundary. Use lowercase snake case; Codex renders underscores as spaces
and title-cases the display label:

| Assignment | `task_name` | Display label |
| --- | --- | --- |
| Builder Core | `builder_core` | `Builder core` |
| Builder Validation | `builder_validation` | `Builder validation` |
| Builder Server | `builder_server` | `Builder server` |
| Builder Web | `builder_web` | `Builder web` |
| Implementation Reviewer | `implementation-reviewer` | `Implementation Reviewer` |

For a future ownership boundary, use `builder_<normalized-boundary>`. When a genuinely independent
replacement fix Builder is required, use `builder_fix_<normalized-boundary>`. Resume an existing
Builder or Reviewer by its original identifier so its name and context remain stable. Do not use
phase numbers, task numbers, generated IDs or vague names such as `worker`, `agent` or `reviewer`
alone. `Builder Direct` runs in the current context and therefore has no subagent `task_name`.

## Preflight and evaluation kickoff

Confirm the Spec is `open` for initial implementation or `in_progress` for a resumed
implementation/correction, its revision is current, required design references exist and no
material ambiguity remains. Preserve actual source and GitHub Issue traceability without
inventing external records.

When a module PRD is authoritative, confirm each mapped `REQ-*` uses the canonical contract:
Implemented checkbox, Outcome, Actors, optional Consumes, optional Provides, Capabilities and
conditional Experience. Treat User Journeys as cross-requirement product narratives, not as
execution order. Do not expect PRD User Stories or Acceptance Criteria, and do not add them as
implementation artifacts.

Before the first implementation change for the current revision:

1. when web/browser validation applies, run the repository Playwright health check with its
   exact documented command:
   `pnpm --filter web check:playwright`; fix a failing health check and rerun it before
   implementation. Do not improvise Playwright CLI arguments or broaden a focused command
   after a syntax error; correct the command from `documentation/tooling.md` and rerun it;
2. freeze the Spec revision;
3. set an `open` Spec to `in_progress`;
4. create colocated `evaluation.md` from
   `documentation/templates/evaluation.md` when absent, or reconcile an existing file to
   that structure without discarding existing evidence;
5. activate the direct assignment or affected ownership Builders and record, before any feature
   edit, their identifiers, exact Spec revision, RF/CA mapping, owned and prohibited paths,
   assigned phases, required file/widget tree, Rule Pack, design references, validation exits
   and expected evidence locations;
6. compare the untouched implementation against the Spec's required tree, contracts, states and
   exclusions, and record the baseline result. For a resumed correction, compare the current
   diff as well;
7. for Plan-backed execution, validate dependencies, paths, exits and coverage, then set the
   current Plan and affected work to `in_progress`;
8. initialize or update the Spec/Plan references, revision,
   `status: in_progress`, acceptance matrix, automated/runtime/manual/visual evidence,
   Rule/documentation compliance, findings and lessons learned;
9. record required services, accounts, fixtures, design references and evidence targets.

Do not proceed when the Builder activation, baseline conformance comparison or Playwright
health result is missing or failed. A prose statement that these steps happened is insufficient;
record exact paths, commands, results and evidence identifiers.

Do not overwrite prior evidence. Evaluation uses only `in_progress`, `ready` and `completed`;
actual results, findings and lessons learned remain in the evidence ledger rather than metadata.

When a colocated Evaluation already exists, read it before activating the Builder. Treat its
open findings, failed attempts, command corrections, service prerequisites and visual notes as
implementation inputs for the current revision. Historical or completed evidence is context,
not proof for a new revision; keep it intact and recapture any evidence affected by the current
diff.

### Evaluation template contract

Treat `documentation/templates/evaluation.md` as the structural source of truth at every
implementation kickoff or resume. Copy it into the feature folder; do not link to it, edit the
shared template with feature evidence or invent a parallel Evaluation format. Replace its
placeholders with actual values, omit only the optional `plan` metadata when direct execution
applies, and preserve its section order and canonical table columns.

Do not add base, current or candidate commit metadata to Spec, Plan or Evaluation. Commit
identity is not part of SDD state. During conclusion, only the PR CI table records the PR head
SHA needed to identify the revision checked by GitHub.

When reconciling an existing Evaluation, add missing canonical sections/columns and map legacy
evidence into them without deleting historical commands, findings, failed attempts, CI runs or
visual comparisons. Remove unused example rows; use an explicit `not_applicable` row only when
the absence itself needs traceability.

Add one row per `CA-*`, executed automated/runtime sensor, `MV-*`, each supplied or required
supplemental design screenshot, finding and PR CI run; do not collapse criterion or screenshot
ranges into one row. Visual rows are mandatory for design-backed UI and optional only when no
design reference applies. Use stable
`EV-*`, `MV-*`, `VIS-*`, `FND-*` and `CI-*` IDs so findings can invalidate exact evidence.

Use `pending`, `passed`, `failed`, `stale` or `not_applicable` for ordinary evidence.
Visual evidence may use `passed_with_authorized_difference`; findings use `active`,
`resolved`, `accepted_non_blocking` or `superseded`. Every manual row records both expected
and observed behavior. For design-backed UI, every supplied and required supplemental visual
row records its exact viewport, reference path, implementation path and differences; optional
visual evidence applies only when no design reference is in scope.

### Canonical Evaluation shape

Materialize the colocated file using the canonical template's exact frontmatter and section
order. The resulting file must have this shape; do not replace it with a narrative report or a
feature-specific ledger:

```text
---
feature: "<domain>/<feature>"
spec: ./spec.md
plan: ./plan.md                 # omit for direct execution
spec_revision: <revision>
status: in_progress | ready | completed
updated_at: YYYY-MM-DD
---

# Evaluation

Current result: <concise statement>

## Acceptance matrix
| Criterion | Evidence | Status |

## Automated and runtime evidence
| ID | Layer | Command or scenario | Result | Status |

## Manual evidence
| ID | Scenario | Criteria | Expected | Observed | Status |

## Visual evidence
| ID | Surface and state | Viewport | Reference | Implementation | Differences | Status |

## Rule and documentation compliance
| Authority | Reference | Result | Notes |

## Findings
| ID | Classification | Source | Affected evidence | Status | Resolution |

## PR CI quality gate
| ID | Workflow | Head SHA | Result | Run |

## Lessons learned
| Lesson | Source finding | Authority disposition |
```

Preserve the template's column names, evidence ID conventions and status vocabulary exactly.
The PR CI table is populated only during `conclude-spec`; its head SHA identifies the PR
revision checked by CI and is not current-implementation metadata.

## Persistence and user questions

Continue until Evaluation is `ready`. Ask the user only when an unresolved product,
technical-authority, environment or safety decision is genuinely required. Do not pause for
routine implementation, validation or a choice safely established by the Spec, Rules,
repository or evidence. After an answer, resume the active strategy automatically.

Whenever an implementation, sensor, browser, build or validation error occurs, immediately
fix it when the correction is within the current Contract and repository authority. Record
the finding, apply the smallest scoped fix, invalidate affected evidence and rerun it. Do not
ask permission to resolve an in-Contract implementation, CI/test or visual discrepancy.

Changes outside the Spec may remain in the shared worktree. Keep them out of the implementation
and evidence unless they overlap evaluated paths, contaminate evidence or cause a regression.

## Direct execution strategy

Use when no current Plan exists:

1. activate `Builder Direct` in the current context with the current revision, RF/CA mapping,
   observable outcome, allowed/prohibited paths, Rule Pack, Architecture, design bundle and
   applicable tools;
2. implement within that recorded scope, then inspect the diff; while acting as `Builder Direct`,
   do not edit Spec, Plan or Evaluation, and return to the Orchestrator role for those updates;
3. run focused repository-approved generation, code, type, unit and integration checks;
4. update Evaluation with exact commands/results, criterion coverage,
   findings and evidence freshness;
5. for each discrepancy, continue `Builder Direct`, rerun only invalidated evidence and repeat
   until validation-ready or authority is required.

Reserve repeated full builds for the final Quality Gate unless bundler, exports, environment,
Docker, workflow or generated-artifact changes require an earlier build.

## Plan-backed execution strategy

Use when a current Plan exists. The Plan owns sequencing, status, attempts and next action;
Evaluation owns executed evidence and findings.

Before dispatching, map affected paths to the smallest coherent set of stable ownership Builders.
Do not create one Builder per phase, task or package. A Builder may own multiple sequential phases
inside its ownership boundary, and the same Builder must be continued across related phases and
corrections so its implementation context is retained.

Default to at most three concurrent implementation Builders. Exceed that only when the Plan
records a concrete speed or context benefit, stable input contracts, substantial independent
work and non-overlapping paths that justify the additional loading and integration cost. Package
count alone is never sufficient. The Orchestrator owns root configuration, dependency
installation, lockfiles, shared/generated files and cross-Builder integration.

For each dependency-ready wave:

1. confirm the current Spec revision, dependencies, criteria, paths, Rules, Builder assignments
   and exits;
2. mark the wave's phases and assigned tasks `in_progress`;
3. activate or resume each affected ownership Builder, assigning all dependency-ready phases in
   its ownership boundary; keep tightly coupled work together and run only stable,
   non-overlapping Builder scopes in parallel;
4. coordinate shared/generated files, dependencies and lockfiles through the Orchestrator;
5. inspect and integrate Builder diffs; Builders do not edit Spec, Plan or Evaluation;
6. run focused generation, code, type, unit and integration checks from the task exits;
7. update Evaluation immediately with exact results, evidence freshness and lessons learned, then update
   the Plan with status, finding IDs, attempts and next action;
8. complete a task only when its exit passes, and a phase only when every task and phase exit
   passes;
9. on failure, keep affected work `in_progress`, resume the responsible ownership Builder,
   invalidate affected evidence and rerun only what changed; activate a new scoped Builder Fix
   only when that Builder cannot be resumed or the correction is genuinely independent.

Phase completion must be sensor-backed. Do not use a Builder report as official evidence.

### Builder-focused validation

Each Builder runs focused feedback checks for the paths it changes before handoff:

- `Builder Core` and `Builder Validation` run their applicable code, type and unit sensors;
- `Builder Server` runs applicable sensors plus focused `curl` scenarios against the real local
  server for changed runtime behavior, covering status/body, validation, authentication,
  authorization, persistence, side effects and relevant logs;
- For every changed HTTP route group, the owning Builder verifies the matching `.rest` file
  contains one labeled request per controller route, current parameters/headers/bodies and
  reusable non-secret variables; the Orchestrator records this route/example parity in
  `evaluation.md`.
- `Builder Web` uses the Playwright CLI for affected interactions and states, including keyboard,
  focus, narrow viewport, console, failed requests and fresh screenshots against applicable
  design references.

Builders return exact commands and observed results, but their reports are not official evidence.
The Orchestrator reruns or verifies every required exit on the integrated candidate and records it
in Evaluation in the same task turn. A Builder handoff is incomplete until its commands, results,
affected evidence freshness and any applicable lesson are materialized there. Keep Builder checks focused;
do not run a full workspace or UI regression after every small edit unless the task exit requires it.

### Behavior-hook coverage gate

When a feature or widget tree contains colocated `use-*.ts` behavior hooks, enumerate every hook
under the active scope before handoff and verify that each one has a colocated
`tests/use-*.test.ts` file. The component test that mocks the owning hook is not a substitute for
the hook test: the dedicated test must exercise the hook's public state, derived values, guards,
effects and action outcomes that are relevant to the contract. Mock the nearest domain query or
action abstraction rather than React Query or another third-party primitive.

If the repository Rule Pack explicitly excludes dedicated tests for a query/action hook, record
that hook as an explicit exception with the consuming-widget or route evidence that covers it. If
the Spec or user request requires every hook in a directory, that request takes precedence over
the default exception and every in-scope hook receives a focused test. Record the hook inventory,
test paths, exact focused command, result and any documented exception in `evaluation.md`.

### Implementation Reviewer

For Plan-backed execution, activate exactly one read-only
[`Implementation Reviewer`](../agents/implementation-reviewer-agent.md) after all
implementation Builder diffs are integrated. Never create a Reviewer per Builder, phase,
application or package, and do not add specialist Reviewers. Direct execution does not require a
separate Reviewer unless the Spec or another repository authority explicitly requires one.

Give the Reviewer the exact Spec revision, Plan, Rule Pack, integrated diff, design references and
current evidence index. It reviews the complete candidate for Spec conformance, cross-Builder
contracts, missing states/tests, integration conflicts and stale evidence. When UI is affected, it
must inspect every required final screenshot and comparison and independently replay high-risk
interactions with the Playwright CLI, including applicable responsive, keyboard, accessibility,
console and network behavior. When server-backed behavior is affected, it may replay high-risk
real `curl` scenarios and inspect the resulting authorization, persistence or side effects.

The Reviewer may run in parallel with the Orchestrator's integrated sensors, but it never edits
feature code, Spec, Plan or Evaluation. Its report is not official evidence. The Orchestrator
verifies every finding, records accepted findings in Evaluation, invalidates affected evidence and
resumes the responsible Builder. After a correction, resume the same Implementation Reviewer to
recheck the affected candidate; never activate a replacement Reviewer merely because the
implementation changed. Readiness requires the review to be current and every verified blocking
finding to be resolved.

## Rule reinforcement after findings

When a finding exposes a missing, ambiguous or repeatedly violated reusable Rule:

- if the Rule is already clear, fix the implementation and leave the Rule unchanged;
- if the reusable convention is unclear, pause dependent work and route the Rule change
  through its authority gate;
- add a focused `## Antipatterns to Avoid` entry stating the prohibited pattern, required
  alternative and validation proof;
- reread the changed Rule, recompute affected Rule Pack and Plan references, record the
  authority change, invalidate affected evidence and rerun the scoped correction.

Feature-specific behavior belongs in the Spec. Builders do not edit Rules or SDD artifacts.

## Finding-to-lesson documentation

Every accepted finding has two distinct records in `evaluation.md`:

1. a `Findings` entry describing the concrete problem, affected evidence, status and resolution;
2. a `Lessons learned` entry when the finding exposes guidance that future work can reuse.

The lesson, not the finding label alone, determines whether durable documentation needs an
update. Classify each reusable lesson against the applicable PRD, Architecture, Design,
Tooling or Rule document, update that authority through its required workflow, and record the
link and disposition in `evaluation.md`. If the lesson is feature-local, transient, or already
covered, record an explicit no-change disposition instead. Do not treat a finding entry as a
substitute for a lesson or authority update.

## Spec conformance gate during implementation

Treat the current Spec as an active implementation contract throughout the implementation, not
only as final-validation guidance. Before the first change, before each phase/task or Builder
handoff, and after every implementation correction, compare the candidate against the Spec's
required paths, widget/module tree, contracts, behavior, design states, exclusions and
validation requirements. Use explicit Spec file-tree and contract sections as a checklist;
never substitute the existing code structure for the structure required by the Spec. Any missing,
extra or misplaced path, boundary, API field, behavior or design state is an in-Contract finding:
record it in Evaluation, keep affected work `in_progress`, invalidate affected evidence, fix it
immediately, and rerun conformance plus the affected sensors. Passing tests or screenshots alone
does not establish readiness until Spec conformance has also passed.

### Mandatory conformance record

Every implementation checkpoint and Builder handoff must record all of the following, even when
the result is unchanged:

| Check | Required proof |
| --- | --- |
| File/widget tree | Every required path exists, no path is misplaced, and any intentional extra path is mapped to the Spec or explicitly excluded from the candidate. |
| Boundary ownership | Each changed path is inside the active Builder scope and the Spec's declared layer/module boundary. |
| REST-client parity | Every affected route group has its declared `.rest` file; each controller route is represented once with current method, path, parameters, headers and representative body, and no credentials are committed. |
| Contract | RF/CA, API fields, domain rules, persistence behavior, error semantics and exclusions match the current revision. |
| Behavior hooks | Every in-scope `use-*.ts` behavior hook has a colocated `tests/use-*.test.ts` file, or an explicit Rule Pack exception with linked consumer/route evidence. |
| UI states | Loading, empty, success, error, recovery, disabled, selected, focus, keyboard and responsive states applicable to the change are exercised. |
| Design references | Every supplied and required supplemental screenshot has an exact state/viewport capture, direct comparison, and current transient artifact identifier. |
| Validation | Commands actually ran on the current candidate; console errors, failed requests, HTTP 4xx/5xx, hydration warnings and persistence results are classified. |

If a check fails, keep the affected work `in_progress`; do not mark it passed because another
sensor passed. The next action is correction and rerun, not a user permission request.

## Design-backed UI execution

When a Design Contract exists:

- read `design/manifest.md` and every saved reference before coding;
- confirm every supplied screenshot has a visual inventory and every supplemental-screenshot
  suggestion has a recorded decision;
- do not depend on live Pencil during normal implementation;
- preserve exact state, surface and viewport mappings;
- use existing behavioral Playwright coverage for accessible interaction, DOM/layout,
  console, failed-request and persistence evidence;
- do not create a dedicated visual-reference integration test;
- capture and compare every supplied design screenshot and every required supplemental state at
  its exact viewport, using an existing behavioral scenario or a manual Playwright CLI run;
  supplemental screenshots marked recommended may be deferred only when the manifest records
  the decision and the state is not an acceptance gap;
- capture every design-backed state at its exact viewport into Playwright's ignored
  `test-results/` output or a CI artifact, and record the comparison details plus the
  transient artifact identifier in Evaluation; do not create a feature `evidence/` folder;
- keep affected direct work or Plan tasks `in_progress` while a material discrepancy remains.

If an approved implementation change intentionally introduces a visual element absent from
the references, treat it as a Design Contract amendment. Clarify only unresolved placement or
scope, update the Spec and manifest/reference artifact, recapture affected screenshots and
rerun invalidated validation.

## Living evidence

After every implementation change—including fixes, generated artifacts, environment/seed
changes and tests—reconcile Evaluation and the Plan when present. Update
commands, results, affected criteria, findings, screenshots and manual/runtime evidence.
Mark affected earlier evidence `stale` or historical; never accept the implementation with evidence
from an earlier affected diff.

## User-requested changes before conclusion

Classify every requested change against the current Spec, design bundle, Rules and
implementation before changing artifacts or code.

### Implementation correction

When the request makes implementation comply with the current Contract:

1. keep the Spec revision unchanged;
2. record a mapped finding in Evaluation;
3. set Evaluation and affected Plan work, when present, to `in_progress`;
4. resume the responsible Builder and mark only affected evidence stale; activate a scoped
   Builder Fix only when the original Builder cannot be resumed or the correction is genuinely
   independent;
5. rerun affected exits, sensors, `MV-*` scenarios and visual comparisons;
6. continue the selected strategy automatically.

### Contract change

When product behavior, design intent or technical boundaries change:

1. pause affected work and set the Spec to `draft`;
2. immediately invoke `create-spec` for clarification and authority alignment, updating PRD,
   Rules, Architecture, Modules, Design or Tooling first when required;
3. when the approved change materially amends PRD requirements, return every affected `REQ-*`
   Implemented checkbox to unchecked before authoring the revised Spec;
4. increment the revision, update affected Contracts/design/validation and run integrity
   checks;
5. return the Spec to `open` and preserve invalidated evidence as historical;
6. set Evaluation to `in_progress` and re-evaluate strategy;
7. create or reconcile a Plan when the revision requires Plan-backed execution, or set the
   old Plan to `superseded` when direct execution is now appropriate;
8. resume this workflow automatically under the selected strategy.

Ask the user only when the classification or intended product/technical outcome is genuinely
ambiguous.

## Integrated validation and readiness

After implementation work is complete, validate the exact Spec revision and implementation. For
Plan-backed execution, activate the single Implementation Reviewer on the integrated candidate while
the Orchestrator runs the applicable sensors:

1. run integrated technical sensors and the final build Quality Gate;
2. review generated artifacts and migration bodies;
3. preflight real services, database/Auth/provider state, accounts and fixtures;
4. execute every applicable `MV-*` with the Playwright CLI;
5. verify every affected REST-client file against its controller route group and shared request
   schemas, then record the parity result;
6. inspect every CA, manual scenario and supplied/supplemental screenshot with exact
   viewport/state, console/network, accessibility, DOM/layout and persistence evidence;
7. when an Implementation Reviewer applies, verify and classify every finding;
8. record commands, captures, REST-client parity, results, review findings and resolutions in Evaluation.

For Plan-backed execution, keep the integrated phase `in_progress` during this validation and
complete the Plan only after all affected phases and evidence pass, every affected REST-client file
is route-complete, the Implementation Reviewer has
completed on the current candidate and every verified blocking review finding is resolved.

- On failure, record the finding, reopen affected direct/Plan work, resume the responsible
  Builder when possible and rerun invalidated evidence.
- When all evidence is current and no blocking finding remains, reconcile Evaluation to the
  current implementation, complete the Plan when present, set Evaluation to `ready` and immediately
  invoke `conclude-spec` when publication authority is available. Do not check any PRD
  requirement: Evaluation `ready` is an implementation-evidence transition, not PRD closure.
- After three materially identical failures, ask the user only when resolution requires a
  decision unavailable in the repository or environment; otherwise continue safely.

`evaluation.md` is the operational evidence ledger. It is not part of the review candidate by
default and does not require a closure-only documentation commit.
