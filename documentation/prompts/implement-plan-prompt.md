---
name: implement-plan
description: Orchestrate an open Spec through its concise Plan with scoped Builders, living evidence and user-change handling.
---

# Implement a Plan

Read the Plan, current Spec, Architecture, Rule Pack and `documentation/tooling.md`. Use
`documentation/rules.md` to discover additional Rules if execution expands into another
layer. The Orchestrator owns the Plan and evaluation; all work remains in the current task.

## Preflight and evaluation kickoff

Before implementation:

1. confirm the Spec is `open`, the Plan references its exact revision and `implement-plan`
   remains appropriate;
2. validate phase dependencies, task ownership, non-overlapping parallel paths, exits and
   manual/runtime/visual coverage;
3. verify required design references, services, accounts, fixtures and generated commands;
4. record the base commit, set the Spec and Plan to `in_progress`;
5. create colocated `evaluation.md` when absent, or reconcile it when resuming;
6. initialize it with Spec/Plan references, revision, candidate snapshot identity when available,
   `status: in_progress`, acceptance matrix, automated/runtime/manual/visual evidence,
   Rule/documentation compliance, findings and history.

Preserve actual source/GitHub Issue traceability. Do not overwrite historical evidence or
invent external records.
Evaluation uses only `in_progress`, `ready` and `completed`; validation findings and history
remain in the evidence ledger rather than metadata.

## Persistence and user questions

Continue the implementation loop until the Spec evaluation is `ready`. Ask the user only when
an unresolved product, authority, environment or safety decision is genuinely required for the
next change; state the blocker and the smallest decision needed. Do not pause for a routine
validation step or a choice that can be inferred safely from the Spec,
Rules, repository, or existing evidence. After the answer, resume immediately and keep cycling
through fixes, sensors and evidence refresh until `ready`.

## Phase execution

For each dependency-ready phase:

1. confirm the current Spec revision, task dependencies, criteria, paths, Rules and exits;
2. mark the phase and assigned tasks `in_progress`;
3. create `Builder F<n>` for a cohesive phase or scoped sibling `Builder F<n>-T<m>` agents
   only for genuinely independent, non-overlapping tasks;
4. coordinate shared/generated files, package installation and lockfile changes through the
   Orchestrator before parallel application edits;
5. inspect and integrate Builder diffs; Builders do not edit Spec, Plan or evaluation;
6. run focused repository-approved generation, code, type, unit and applicable integration
   checks from the task exits;
7. update `evaluation.md` with exact commands/results and the Plan with status, finding IDs,
   attempts and next action;
8. mark tasks `completed` only when their exits pass; mark the phase `completed` only when
   all tasks and its phase exit pass;
9. on failure, record the formal finding in `evaluation.md`, keep affected tasks/phase
   `in_progress`,
   create a scoped Builder Fix, mark affected evidence stale and rerun only invalidated
   checks.

Changes outside the Spec scope may remain in the shared worktree. Keep them out of the
review candidate snapshot and evidence, and do not convert their presence into a validation
finding unless they overlap evaluated paths, contaminate evidence, or cause a validation
regression.

Phase completion is sensor-backed.

### Rule reinforcement after implementation findings

When an implementation or sensor finding exposes a missing, ambiguous or repeatedly violated
Rule, distinguish it from an ordinary implementation correction:

- if the Rule already states the requirement clearly, fix the implementation and keep the
  Rule unchanged;
- if the reusable convention is not stated clearly enough, pause dependent work and route
  a Rule-document change through the authority gate before creating the next Builder Fix;
- add a focused `## Antipatterns to Avoid` entry to the relevant Rule document, stating the
  prohibited pattern, required alternative and validation evidence;
- reread the changed Rule, recompute every affected Rule Pack/task reference, record the
  authority change and finding in the Plan/evaluation, invalidate affected evidence and
  rerun the scoped Builder Fix and its sensors.

Builders do not edit Rules, Specs, Plans or evaluation artifacts. A feature-specific
behavior belongs in the Spec rather than in a reusable antipattern entry.

## Design-backed UI phases

When a Design Contract exists:

- read `design/manifest.md` and all mapped reference screenshots before coding;
- confirm that the Spec contains a visual inventory for every supplied screenshot and a
  recorded decision for every additional-screenshot suggestion before starting the UI task;
- do not depend on live Pencil during implementation;
- preserve exact state/surface/viewport mappings and intentionally distinct compositions;
- compare each running route/state with its saved reference using the Playwright CLI,
  accessibility tree and DOM/layout inspection;
- save implementation screenshots under
  `evidence/screenshots/rev-<spec-revision>/` and update the Plan coverage status and
  `evaluation.md` evidence;
- maintain one evidence row per reference/state/viewport, naming both the original reference
  path and the implementation capture; generated implementation screenshots cannot serve as
  their own design reference;
- keep a UI task/phase `in_progress` while a material reference discrepancy remains.
- If an approved implementation change intentionally introduces a visual element not present
  in the supplied references, treat it as a Design Contract amendment: ask the user only if
  the intended placement/scope is unclear, record the decision in the Spec, add a supplemental
  reference or annotated design artifact to `design/manifest.md`, and recapture affected
  implementation screenshots before rerunning the affected validation. Never silently leave the
  screenshots, manifest and Evaluation describing the old UI.

The Orchestrator owns the final manual and visual validation. Automated checks and Builder
reports are supporting evidence only; the Orchestrator must reconcile them with Playwright
CLI DOM/layout inspection, screenshots, console messages, failed requests and persistence
evidence for the exact candidate snapshot.

## Living evidence

After every implementation change—including Builder Fixes, generated artifacts, environment
or seed changes and added tests—reconcile the Plan and `evaluation.md` before claiming
progress. Update the candidate snapshot identity when available, commands, test results, affected criteria, findings,
screenshots and manual/runtime evidence. Mark stale evidence historical or replace it; never
accept a phase or implementation using evidence from an earlier affected diff.

The Plan owns sequencing, status, attempts and next action. `evaluation.md` owns actual
evidence, full findings and verdicts. The Spec owns contracts only.

## User-requested change gate before conclusion

Whenever the user requests a change after implementation has started but before conclusion,
pause dependent execution and classify the request against the current Spec, design bundle,
Rules and implementation. Show the classification and evidence before changing artifacts or
code.

### A. Implementation correction

Use when the request makes implementation comply with an existing RF/CA, Design Contract,
Technical Contract or Rule.

1. Keep the Spec revision unchanged.
2. Record a mapped finding in `evaluation.md`.
3. Set affected tasks/phases to `in_progress` and create scoped Builder Fixes.
4. Set evaluation status to `in_progress` when `ready` evidence is invalidated and mark only
   affected automated, runtime, manual and visual evidence stale.
5. Rerun affected exits, integrated checks, `MV-*` scenarios and screenshots.
6. Rerun the affected sensors, Playwright CLI scenarios and screenshot comparisons if their
   evidence was invalidated.

### B. Contract change

Use when the user wants different product behavior, design intent or technical boundaries.

1. Pause affected/dependent Plan work, record the revision mismatch and set the Spec to
   `draft`.
2. Route through `create-spec` clarification/authority alignment; update PRD, Rules,
   Architecture, Modules, Design or Tooling first when required.
3. Increment the Spec revision, update affected contracts/design bundle/validation and run
   authoring integrity checks.
4. Return the Spec directly to `open`; there is no separate Spec review stage.
5. Mark affected evidence and prior verdicts historical and set evaluation to
   `in_progress`.
6. Re-evaluate the implementation route. If `implement-plan` remains appropriate, revise
   `plan.md` against the new revision, reconcile phases/tasks/paths/criteria/evidence and
   resume only after Plan integrity passes. If `implement-spec` is now appropriate, set the
   Plan to `superseded` and route to the direct workflow.

If classification or expected behavior is ambiguous, ask the user; do not silently choose a
product, design or architectural outcome.

## Integrated validation and readiness

After all ordinary phases are completed:

1. run integrated sensors on the current candidate snapshot;
2. review generated artifacts/migrations and run the final build Quality Gate;
3. preflight real services, database/Auth/provider state, accounts, fixtures and
   the Playwright CLI for every applicable `MV-*`;
4. keep the final integrated phase `in_progress` while the Orchestrator executes the
   validation matrix;
5. inspect every CA, MV scenario, supplied and supplemental screenshot and relevant
   technical contract against the exact candidate snapshot. Record commands, screenshots,
   viewport/state, console/network results, persistence evidence and findings in
   `evaluation.md`.
`evaluation.md` is an operational evidence ledger; it is not part of the review candidate
by default and does not require a closure-only documentation commit.

- On a failed sensor or material discrepancy, record findings, set affected tasks/phases to
  `in_progress`, create scoped Builder Fixes, invalidate and rerun affected evidence.
- When all required evidence is current and no blocking finding remains, mark the integrated
  phase `completed`, reconcile Plan/evaluation to the exact candidate snapshot, set the Plan
  `completed`, set evaluation `ready` and route to `conclude-spec`.
- After three materially identical failures, ask the user only if the repeated blocker requires
  a decision unavailable in the repository or environment; otherwise continue with the next
  safe corrective action and validation cycle.
