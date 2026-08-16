---
name: implement-plan
description: Orchestrate an open Spec through its concise Plan with scoped Builders, living evidence, user-change handling and one integrated Reviewer.
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
6. initialize it with Spec/Plan references, revision, base/current commit,
   `status: in_progress`, acceptance matrix, automated/runtime/manual/visual evidence,
   Rule/documentation compliance, findings and history.

Preserve actual source/GitHub Issue traceability. Do not overwrite historical evidence or
invent external records.
Evaluation uses only `in_progress`, `ready` and `completed`; Reviewer verdicts remain in its
evidence/history rather than metadata.

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
candidate commit and evidence, and do not convert their presence into a Reviewer finding
unless they overlap evaluated paths, contaminate evidence, or cause a validation regression.

Do not create a Reviewer per task or ordinary phase. Phase completion is sensor-backed.

### Rule reinforcement after implementation findings

When a Builder or Reviewer finding exposes a missing, ambiguous or repeatedly violated
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
- compare each running route/state with its saved reference using Browser-use/CDP,
  accessibility tree and DOM/layout inspection;
- save implementation screenshots under
  `evidence/screenshots/rev-<spec-revision>/` and update the Plan coverage status and
  `evaluation.md` evidence;
- maintain one evidence row per reference/state/viewport, naming both the original reference
  path and the implementation capture; generated implementation screenshots cannot serve as
  their own design reference;
- keep a UI task/phase `in_progress` while a material reference discrepancy remains.

Builder/Orchestrator checks do not replace the final Reviewer's personal manual
and visual validation. The Reviewer must be dispatched as a separate read-only
subagent/task whenever final validation is required; the Orchestrator must not
substitute its own review or an evaluation claim for that dispatch.

## Living evidence

After every implementation change—including Builder Fixes, generated artifacts, environment
or seed changes and added tests—reconcile the Plan and `evaluation.md` before claiming
progress. Update current commit, commands, test results, affected criteria, findings,
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
6. Re-run the final Reviewer if its evidence or verdict was invalidated.

### B. Contract change

Use when the user wants different product behavior, design intent or technical boundaries.

1. Pause affected/dependent Plan work, record the revision mismatch and set the Spec to
   `draft`.
2. Route through `create-spec` clarification/authority alignment; update PRD, Rules,
   Architecture, Modules, Design or Tooling first when required.
3. Increment the Spec revision, update affected contracts/design bundle/validation and run
   authoring integrity checks.
4. Return the Spec directly to `open`; there is no Spec Reviewer.
5. Mark affected evidence and prior verdicts historical and set evaluation to
   `in_progress`.
6. Re-evaluate the implementation route. If `implement-plan` remains appropriate, revise
   `plan.md` against the new revision, reconcile phases/tasks/paths/criteria/evidence and
   resume only after Plan integrity passes. If `implement-spec` is now appropriate, set the
   Plan to `superseded` and route to the direct workflow.

If classification or expected behavior is ambiguous, ask the user; do not silently choose a
product, design or architectural outcome.

## Integrated validation and final Reviewer

After all ordinary phases are completed:

1. run integrated sensors on the current commit;
2. review generated artifacts/migrations and run the final build Quality Gate;
3. preflight real services, database/Auth/provider state, accounts, fixtures and
   Browser-use/CDP for every applicable `MV-*`;
4. keep the final integrated phase `in_progress` and record review as the next action;
5. dispatch one separate read-only `Reviewer Final` subagent/task with the exact Spec
   revision, Plan/diff/commit, contracts, Rule Pack, Architecture, official evidence,
   design bundle, manual scenarios and findings. Record the dispatch/task identifier and
   input commit in `evaluation.md` before accepting its verdict.

The final Reviewer dispatch is mandatory before implementation-plan completion, even when
automated checks and Builder reports pass. Trigger it again whenever a fix, generated
artifact, environment change, user-requested correction or contract amendment invalidates
its evidence or verdict. If the subagent cannot be dispatched or does not return an
independent verdict, keep the integrated phase and evaluation `in_progress` and record the
blocker; do not mark the Plan completed.

Dispatch the replacement Reviewer immediately after each correction that changes code, route
behavior, generated evidence, or evaluation findings. Do not pause the workflow waiting for a
later user turn; continue safe non-overlapping work while the Reviewer is pending and report
the dispatch identifier and verdict when available.

The Reviewer directly inspects code and Rules, assesses every CA and technical contract area,
personally executes all applicable `MV-*` scenarios and independently validates every
supplied and supplemental design screenshot. For each reference, the Reviewer opens the
original image, captures the implementation at the exact declared viewport/state, and
records a direct comparison of structure, content, hierarchy, tokens, spacing, dimensions,
interaction state and responsive behavior. Automated Playwright and Builder reports are
supporting evidence only; implementation-generated screenshots are never sufficient without
the original reference. Missing required manual evidence, missing reference comparison, or
an unexplained material discrepancy produces `failed`.

The separate Reviewer subagent returns `accepted | failed`; the Orchestrator writes its
verdict, task identifier, reviewed commit and evidence to `evaluation.md`.

- On `failed`, record findings, set affected tasks/phases to `in_progress`, create scoped
  Builder Fixes, keep evaluation `in_progress`, invalidate/rerun affected evidence and ask
  the Reviewer to reassess the updated commit.
- On `accepted`, mark the integrated phase `completed`, reconcile Plan/evaluation to the exact
  commit, set the Plan `completed`, set evaluation `ready` and route to `conclude-spec`.
- After three materially identical failures, present the attempts and ask the user for the
  unresolved authority or environment decision.

Do not create task/phase Reviewers or a conclusion Reviewer, another implementation role,
fork or user-owned thread. The single final Reviewer is a separate internal subagent/task,
not the Orchestrator and not the Builder.
