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
├── no current Plan → Builder Direct
└── current Plan    → phase/task Builders
                     ↓
        sensors + manual/visual validation
                     ↓
                conclude-spec
```

Run the workflow in the current task. Do not create another user-owned thread.

## Strategy selection

Read the Spec, Rule Pack, Architecture and `documentation/tooling.md`, then inspect colocated
`plan.md` when present.

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

## Fail-closed implementation invariants

These are execution requirements, not recommendations. If any invariant cannot be verified,
stop before editing feature source and report the exact blocker:

- `implement-spec` is the only implementation entry point. Do not revive, delegate to or
  simulate a removed implementation workflow.
- No feature source, test, generated artifact or migration edit starts until the scoped Builder
  is activated and the preflight checklist below is recorded in Evaluation.
- The Orchestrator may inspect, coordinate and integrate, but may not replace the Builder with
  an unscoped direct edit. A Builder report is not evidence; the Orchestrator must inspect the
  resulting diff and execute the validation exits.
- The Spec's exact revision, required file/widget tree, contracts, exclusions and validation
  exits are authoritative. Existing code structure, a screenshot, a passing test or a user
  message cannot silently override them.
- An implementation, test, browser, network, console, build, migration or visual error within
  the current Contract is an automatic correction: record it, invalidate affected evidence,
  create or continue a scoped Builder Fix, fix it immediately, and rerun the affected checks.
  Never pause for permission to resolve an in-Contract discrepancy.
- A UI change is not validated by a passing test alone. It requires the required behavioral
  assertions plus a fresh Playwright CLI screenshot at each affected reference/state and an
  inspected comparison recorded in Evaluation.
- Never claim readiness from evidence captured before the latest affected change. Mark it
  `stale` and recapture it.

## Builder activation gate

For feature implementation changes, the Orchestrator must activate a scoped Builder before any
feature source is edited. The Builder must receive the exact Spec revision, acceptance criteria,
required file/widget tree, allowed paths, Rule Pack, design references and validation exits; the
activation and scope must be recorded in Evaluation and the current execution artifacts. Use
`Builder Direct` for direct execution or a phase/task Builder for execution with a current Plan.
The Orchestrator may coordinate, inspect, integrate and validate, but must not silently replace
the Builder with direct feature implementation. If no Builder can be activated, stop before
editing feature code and report the orchestration blocker. Prompt, Spec, Plan or evaluation-only
documentation maintenance may be handled directly when explicitly requested.

## Preflight and evaluation kickoff

Confirm the Spec is `open` for initial implementation or `in_progress` for a resumed
implementation/correction, its revision is current, required design references exist and no
material ambiguity remains. Preserve actual source and GitHub Issue traceability without
inventing external records.

Before the first implementation change for the current revision:

1. when web/browser validation applies, run the repository Playwright health check with its
   exact documented command:
   `pnpm --filter web check:playwright`; fix a failing health check and rerun it before
   implementation. Do not improvise Playwright CLI arguments or broaden a focused command
   after a syntax error; correct the command from `documentation/tooling.md` and rerun it;
2. record the base commit and freeze the Spec revision;
3. set an `open` Spec to `in_progress`;
4. activate the Builder and record, before any feature edit, its identifier, exact Spec
   revision, RF/CA mapping, owned and prohibited paths, required file/widget tree, Rule Pack,
   design references, validation exits and expected evidence locations;
5. compare the untouched candidate against the Spec's required tree, contracts, states and
   exclusions, and record the baseline result. For a resumed correction, compare the current
   diff as well;
6. for Plan-backed execution, validate dependencies, paths, exits and coverage, then set the
   current Plan and affected work to `in_progress`;
7. create colocated `evaluation.md` from
   `documentation/templates/evaluation.md` when absent, or reconcile an existing file to
   that structure when resuming without discarding history;
8. initialize or update the Spec/Plan references, revision, candidate snapshot,
   `status: in_progress`, acceptance matrix, automated/runtime/manual/visual evidence,
   Rule/documentation compliance, findings and history;
9. record required services, accounts, fixtures, design references and evidence targets.

Do not proceed when the Builder activation, baseline conformance comparison or Playwright
health result is missing or failed. A prose statement that these steps happened is insufficient;
record exact paths, commands, results and evidence identifiers.

Do not overwrite historical evidence. Evaluation uses only `in_progress`, `ready` and
`completed`; actual results, findings and history remain in the evidence ledger rather than
metadata.

### Evaluation template contract

Preserve the canonical table columns from `documentation/templates/evaluation.md`. Add one
row per `CA-*`, executed automated/runtime sensor, `MV-*`, each supplied or required
supplemental design screenshot, finding and PR CI run; do not collapse criterion or screenshot
ranges into one row. Visual rows are mandatory for design-backed UI and optional only when no
design reference applies.
Use stable
`EV-*`, `MV-*`, `VIS-*`, `FND-*` and `CI-*` IDs so findings can invalidate exact evidence.

Use `pending`, `passed`, `failed`, `stale` or `not_applicable` for ordinary evidence.
Visual evidence may use `passed_with_authorized_difference`; findings use `active`,
`resolved`, `accepted_non_blocking` or `superseded`. Every manual row records both expected
and observed behavior. For design-backed UI, every supplied and required supplemental visual
row records its exact viewport, reference path, implementation path and differences; optional
visual evidence applies only when no design reference is in scope.

## Persistence and user questions

Continue until Evaluation is `ready`. Ask the user only when an unresolved product,
technical-authority, environment or safety decision is genuinely required. Do not pause for
routine implementation, validation or a choice safely established by the Spec, Rules,
repository or evidence. After an answer, resume the active strategy automatically.

Whenever an implementation, sensor, browser, build or validation error occurs, immediately
fix it when the correction is within the current Contract and repository authority. Record
the finding, apply the smallest scoped fix, invalidate affected evidence and rerun it. Do not
ask permission to resolve an in-Contract implementation, CI/test or visual discrepancy.

Changes outside the Spec may remain in the shared worktree. Keep them out of the candidate
and evidence unless they overlap evaluated paths, contaminate evidence or cause a regression.

## Direct execution strategy

Use when no current Plan exists:

1. create `Builder Direct` with the current revision, RF/CA mapping, observable outcome,
   allowed/prohibited paths, Rule Pack, Architecture, design bundle and applicable tools;
2. inspect and integrate its diff; the Builder does not edit Spec, Plan or Evaluation;
3. run focused repository-approved generation, code, type, unit and integration checks;
4. update Evaluation with exact commands/results, candidate identity, criterion coverage,
   findings and evidence freshness;
5. for each discrepancy, create `Builder Fix QG-<n>`, rerun only invalidated evidence and
   repeat until validation-ready or authority is required.

Reserve repeated full builds for the final Quality Gate unless bundler, exports, environment,
Docker, workflow or generated-artifact changes require an earlier build.

## Plan-backed execution strategy

Use when a current Plan exists. The Plan owns sequencing, status, attempts and next action;
Evaluation owns executed evidence and findings.

For each dependency-ready phase:

1. confirm the current Spec revision, dependencies, criteria, paths, Rules and exits;
2. mark the phase and assigned tasks `in_progress`;
3. create `Builder F<n>` for a cohesive phase or sibling `Builder F<n>-T<m>` agents only
   for genuinely independent tasks with non-overlapping paths;
4. coordinate shared/generated files, dependencies and lockfiles through the Orchestrator;
5. inspect and integrate Builder diffs; Builders do not edit Spec, Plan or Evaluation;
6. run focused generation, code, type, unit and integration checks from the task exits;
7. update Evaluation with exact results and the Plan with status, finding IDs, attempts and
   next action;
8. complete a task only when its exit passes, and a phase only when every task and phase exit
   passes;
9. on failure, keep affected work `in_progress`, create a scoped Builder Fix, invalidate
   affected evidence and rerun only what changed.

Phase completion must be sensor-backed. Do not use a Builder report as official evidence.

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
| Contract | RF/CA, API fields, domain rules, persistence behavior, error semantics and exclusions match the current revision. |
| UI states | Loading, empty, success, error, recovery, disabled, selected, focus, keyboard and responsive states applicable to the change are exercised. |
| Design references | Every supplied and required supplemental screenshot has an exact state/viewport capture, direct comparison, and current evidence path. |
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
- store every design-backed capture under `evidence/screenshots/rev-<spec-revision>/` and
  record the comparison details in Evaluation;
- keep affected direct work or Plan tasks `in_progress` while a material discrepancy remains.

If an approved implementation change intentionally introduces a visual element absent from
the references, treat it as a Design Contract amendment. Clarify only unresolved placement or
scope, update the Spec and manifest/reference artifact, recapture affected screenshots and
rerun invalidated validation.

## Living evidence

After every implementation change—including fixes, generated artifacts, environment/seed
changes and tests—reconcile Evaluation and the Plan when present. Update candidate identity,
commands, results, affected criteria, findings, screenshots and manual/runtime evidence.
Mark affected earlier evidence `stale` or historical; never accept the candidate with evidence
from an earlier affected diff.

## User-requested changes before conclusion

Classify every requested change against the current Spec, design bundle, Rules and
implementation before changing artifacts or code.

### Implementation correction

When the request makes implementation comply with the current Contract:

1. keep the Spec revision unchanged;
2. record a mapped finding in Evaluation;
3. set Evaluation and affected Plan work, when present, to `in_progress`;
4. create a scoped Builder Fix and mark only affected evidence stale;
5. rerun affected exits, sensors, `MV-*` scenarios and visual comparisons;
6. continue the selected strategy automatically.

### Contract change

When product behavior, design intent or technical boundaries change:

1. pause affected work and set the Spec to `draft`;
2. immediately invoke `create-spec` for clarification and authority alignment, updating PRD,
   Rules, Architecture, Modules, Design or Tooling first when required;
3. increment the revision, update affected Contracts/design/validation and run integrity
   checks;
4. return the Spec to `open` and preserve invalidated evidence as historical;
5. set Evaluation to `in_progress` and re-evaluate strategy;
6. create or reconcile a Plan when the revision requires Plan-backed execution, or set the
   old Plan to `superseded` when direct execution is now appropriate;
7. resume this workflow automatically under the selected strategy.

Ask the user only when the classification or intended product/technical outcome is genuinely
ambiguous.

## Integrated validation and readiness

After implementation work is complete, validate the exact Spec revision and candidate:

1. run integrated technical sensors and the final build Quality Gate;
2. review generated artifacts and migration bodies;
3. preflight real services, database/Auth/provider state, accounts and fixtures;
4. execute every applicable `MV-*` with the Playwright CLI;
5. inspect every CA, manual scenario and supplied/supplemental screenshot with exact
   viewport/state, console/network, accessibility, DOM/layout and persistence evidence;
6. record commands, captures, results and findings in Evaluation.

For Plan-backed execution, keep the integrated phase `in_progress` during this validation and
complete the Plan only after all affected phases and evidence pass.

- On failure, record the finding, reopen affected direct/Plan work, create Builder Fixes and
  rerun invalidated evidence.
- When all evidence is current and no blocking finding remains, reconcile Evaluation to the
  exact candidate, complete the Plan when present, set Evaluation to `ready` and immediately
  invoke `conclude-spec` when publication authority is available.
- After three materially identical failures, ask the user only when resolution requires a
  decision unavailable in the repository or environment; otherwise continue safely.

`evaluation.md` is the operational evidence ledger. It is not part of the review candidate by
default and does not require a closure-only documentation commit.
