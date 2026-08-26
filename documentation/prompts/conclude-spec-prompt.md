---
name: conclude-spec
description: Publish a validated Spec implementation through its pull request, run the final PR CI Quality Gate, close the SDD artifacts, and report the delivery state.
---

# Conclude a Spec

Close a validation-ready implementation in the current task. `conclude-spec` owns publication,
the final pull-request CI gate, evidence closure and artifact completion. It does not
implement changes or process later reviewer feedback.

## Workflow continuity

Treat every route named by this workflow as an immediate transition inside the current task,
not as a recommendation for the user to run another prompt. When an in-Contract correction is
required, invoke `implement-spec`, let it select direct or Plan-backed execution and create
the Builder, refresh evidence and return evaluation to `ready`, then resume `conclude-spec`
automatically.

Do not end the task with a routine correction as a "next action", and do not ask whether the
user wants it fixed. The active SDD delivery authorizes reversible implementation, test,
generated-artifact and checked-in CI corrections required to satisfy the current Contract.
Pause for the user only when a Contract or higher-authority decision is required, publication
authority is missing, an external blocker prevents progress, or the same failure reaches the
retry limit defined by the Orchestrator.

## Preconditions

Require:

- Spec status is `in_progress`;
- `evaluation.md` has `status: ready` and references the current Spec revision and
  implementation;
- direct implementation or all Plan phases are complete;
- required CA, `MV-*`, runtime and visual evidence is current;
- no blocking implementation finding remains;
- source and GitHub Issue traceability is preserved.

Also require a final implementation conformance record: the exact Spec revision and Builder
scope match the diff; the required file/widget tree, contracts, exclusions and applicable UI
states pass; every affected screenshot is fresh and inspected; and Playwright console,
network, HTTP status, accessibility, keyboard and responsive checks are classified. Passing
tests without this record is not validation-ready.
For every affected HTTP route group, the same record must verify the matching
`apps/server/rest-client/<module>/<route-group>.rest` file is present, included in the scoped
diff, and contains one current labeled example for every controller route with the required
parameters, headers and representative body. A passing controller test does not replace this
REST-client artifact check.

Require explicit PRD implementation traceability in that record. Map every in-scope `REQ-*`
through the Spec's `RF-*` requirements and `CA-*` acceptance criteria to current Evaluation
evidence, then classify it as fully delivered, partially delivered or deferred. A requirement
is fully delivered only when its complete current Outcome, Actors, applicable Consumes and
Provides, Capabilities and conditional Experience are implemented and every mapped Contract
obligation has current passing evidence. Scoped
delivery, passing only a subset of mapped criteria or deliberately leaving part for later is
partial or deferred, not full delivery.

Conclusion requires authorization to create commits, push the delivery branch and create or
update its pull request. If that authority is not explicit or already in scope, ask once and
keep the Spec `in_progress`. Do not silently publish, merge or deploy.

All pull requests opened or updated by this workflow must be ready for review, never draft.
The mandatory `create-pr` publication step must create or convert the delivery PR with
`draft: false`; verify `isDraft: false` before the conclusion summary.

## Authority and late-change routing

If local preflight or closure review finds a discrepancy, pause the closure phase and classify
it:

- **Implementation correction:** record the finding, mark affected evidence stale, set
  evaluation to `in_progress` and immediately invoke `implement-spec`. It selects the current
  Plan automatically when present and owns the correction and validation.
- **Contract change:** set the Spec to `draft`, immediately invoke `create-spec`, obtain required
  product or technical authority, uncheck every materially changed PRD `REQ-*` before the
  revised Spec is authored, increment the revision, reconcile Plan/evaluation and continue
  through the recommended implementation route before resuming conclusion.
- **Documented transient CI/infrastructure failure:** keep the Spec `in_progress` and allow
  a same-SHA rerun only with concrete evidence that the failure is transient; keep waiting for
  its result in the current task.

When a correction reopens a previously checked delivery, change an affected PRD requirement
back to `- [ ] **Implemented**` only when current evidence verifies a product failure against
that requirement. Do not uncheck requirements for a transient CI/infrastructure failure or an
evidence-only gap where the delivered product behavior remains verified. Preserve partial and
deferred requirements as unchecked throughout every route.

Do not create a Builder or change the implementation inside `conclude-spec`.
The invoked implementation workflow creates the Builder and refreshes validation. Resume
conclusion automatically after it returns evaluation to `ready`.

## Prepare and publish the PR

1. Read the Spec Validation Contract, Rule Pack, current evaluation and
   `documentation/tooling.md`.
2. Run the applicable local generation, formatting/code, type, unit, integration, Playwright CLI,
   architecture and build preflight required by the Spec and changed paths.
3. Reconcile generated artifacts, migrations, REST-client examples, saved design evidence and factual
   documentation against the current diff.
4. Rerun the final Spec conformance comparison and verify the current validation evidence covers
   the exact implementation diff. Any later
   implementation or acceptance-evidence change routes back to the implementation workflow.
5. Resolve the PRD implementation-checkbox disposition from the completed `REQ-*`/`RF-*`/`CA-*`
   traceability record. Change only fully delivered requirements to
   `- [x] **Implemented**`; leave partially delivered and deferred requirements as
   `- [ ] **Implemented**`. Make this PRD update only after steps 1–4 pass and before invoking
   `commit-code`, `create-pr` or the final PR CI gate. If traceability or evidence is incomplete,
   route the discrepancy through the authority and late-change rules instead of checking the
   requirement.
6. Invoke `commit-code` to create intentional scoped commits, including any authorized PRD
   checkbox changes from step 5.
7. Inspect the existing delivery PR, if any, and compare its base, head SHA, title and body
   with the current candidate. If no matching PR exists, the PR points at an earlier SHA, or
   its publication details are stale or incomplete, **invoke `create-pr` immediately and
   mandatorily** to create or update it. Do not bypass `create-pr` with an ad hoc PR edit or
   proceed to the final CI gate before it returns the current PR metadata.
8. Invoke `create-pr` for the final publication whenever the branch was newly committed or
   the PR needs any update; reuse the existing delivery PR and never create a duplicate.
9. Record the branch and PR URL in the delivery record; update
   `evaluation.md` only when the operational ledger needs the reference.

## Final PR CI Quality Gate

The PR CI gate is a blocking loop. After publication, poll every applicable check attached
to the current PR head SHA until each reaches a terminal result. A pending or in-progress
check is not a pass, and this workflow must not return a final delivery summary while any
required check is pending. Use the actual PR check/run URLs and record each workflow's head
SHA and result in `evaluation.md`.

Use the checks attached to the current pull request and select the applicable checked-in
GitHub Actions workflows by their real path filters:

- **Core CI** for affected Core/package inputs;
- **Server CI** for affected Server or Core inputs;
- **Web CI** for affected Web or Core inputs.

Wait for every applicable PR check on the current PR head SHA. A branch-push run, local build,
earlier SHA, cancelled run or missing expected workflow does not satisfy this gate. Record
the check/workflow name, result, run URL, PR head SHA and relevant test/build summary in
`evaluation.md`. Record why a workflow is inapplicable when its path filters exclude it.

If CI fails:

- record the failure in `evaluation.md` and keep the Spec `in_progress`;
- classify whether it proves an affected PRD requirement is not delivered. Uncheck each affected
  previously checked `REQ-*` only for a verified product failure; preserve checkbox state for a
  transient CI/infrastructure failure or an evidence-only issue where product behavior remains
  verified;
- immediately invoke the applicable implementation or amendment workflow through the
  authority and late-change routing above;
- after that workflow returns evaluation to `ready`, invoke `commit-code`, update the existing
  PR through the mandatory `create-pr` workflow, and run this gate again on its new head SHA;
- rerun the same SHA only for a documented transient CI/infrastructure failure;
- repeat this correction, publication and CI loop until the gate passes or a permitted pause
  condition from Workflow continuity occurs.

The correction/publication loop must invoke the workflows explicitly in this order:

1. `implement-spec` (or the applicable amendment workflow) for an implementation or
   Contract correction;
2. `commit-code` after the correction returns Evaluation to `ready`;
3. `create-pr` to update the existing delivery PR and obtain its new head SHA;
4. this CI gate, polling the new head until every applicable check is terminal.

For a same-SHA transient rerun, invoke `create-pr` only if publication metadata changed,
then continue polling the rerun to a terminal result. Do not stop monitoring because a tool
call, shell session or assistant turn ended; resume the loop in the current task until the
gate passes or a permitted pause condition is reached. If a failure remains actionable,
route it immediately instead of reporting it as a suggested next step.

`conclude-spec` observes and orchestrates CI failures; it does not edit their fixes directly.
Reporting the failure with a suggested next workflow while fixable work remains is an
incomplete conclusion run.

## Evidence and documentation closure

After CI passes, verify `evaluation.md` contains:

- the canonical `documentation/templates/evaluation.md` sections, table columns and stable
  evidence IDs;
- exact Spec revision;
- complete acceptance-criteria matrix;
- automated, runtime, manual and visual evidence;
- saved reference paths and transient Playwright/CI artifact identifiers when visual evidence
  was collected; never require a feature `evidence/` directory;
- visual comparison rows for any supplied or Spec-requested supplemental screenshot that was
  explicitly scoped as acceptance evidence, including exact viewport/state and differences;
- a resolved decision for every additional-screenshot suggestion when the suggestion affects
  an acceptance decision;
- Rule compliance and documentation alignment;
- resolved and active findings with their lessons and dispositions;
- a `Lessons learned` section that extracts reusable guidance from material findings;
- final validation result;
- applicable PR CI run evidence and final build result.

Check PRD, Architecture, Modules, Design, Tooling and the Rule Pack against delivered facts.
Apply factual documentation corrections only. Product, Contract, global Rule, module
ownership or architecture changes require user authority and the late-change route.

Reconcile the final PRD checkbox state against the same complete `REQ-*`/`RF-*`/`CA-*`
traceability used before publication. Every checked requirement must still be fully delivered;
every partial or deferred requirement must remain unchecked. A mismatch is a blocking closure
finding and follows the same correction, amendment or transient-failure routing above.

Treat material findings as inputs to durable documentation improvement, not only as closure
records. For every resolved or active finding, classify whether it exposed reusable missing or
ambiguous guidance:

1. record the concrete issue first in `Findings` with evidence, status and resolution;
2. extract the reusable principle into `Lessons learned` when applicable;
3. update the appropriate authority, or record an explicit no-change disposition when no durable
   update is warranted.

Recording a reusable lesson is not complete until its authority disposition is decided in the
same conclusion pass. For each lesson, name the applicable Markdown authority file(s), make the
factual update when the lesson is already consistent with the approved Contract, or record
`No change` with a concrete reason. If applying the lesson would change product intent,
architecture, module ownership or a global policy, route it as a Contract or authority change
instead of silently editing the document.

- update the applicable module PRD under `documentation/prds/` when the finding clarifies
  product behavior, user-visible states, permissions or acceptance intent;
- update `documentation/architecture.md` when the finding reveals an architectural boundary,
  dependency, data-flow or system-responsibility clarification that future work must retain;
- update the applicable document under `documentation/rules/` when the finding reveals a
  repeatable implementation, testing, validation or tooling pitfall that a repository rule can
  prevent;
- update `documentation/design.md` when the finding reveals reusable visual-system,
  component-state, accessibility, responsive-layout or interaction guidance that future UI
  work must follow;
- update `documentation/tooling.md` when the finding reveals reusable command syntax,
  environment setup, generation, CI or validation guidance;
- update every applicable document when the reusable lesson spans architecture, design,
  tooling and execution guidance;
- make no durable documentation change for a transient environment failure, isolated typo,
  already-documented rule or feature-local detail that would overfit global guidance.

Record each material finding's documentation disposition in `evaluation.md`: link the updated
PRD, Architecture, Design, Tooling or Rule document and summarize the lesson, or state why no
update was warranted. A finding entry without its lesson/disposition is insufficient evidence of
this review.
Keep these corrections concise and generally applicable. A clarification consistent with the
approved Contract and delivered architecture is part of conclusion; a new product rule,
Contract obligation, module-ownership decision, architecture decision or global policy still
requires user authority and the late-change route.

## Complete the delivery

Only after the PR CI gate passes and no blocking finding remains:

- set `evaluation.md` to `completed`;
- set `plan.md` to `completed`, when present;
- set `spec.md` to `completed` and retain only the summarized outcome and
  link to `evaluation.md`;
- preserve detailed evidence in `evaluation.md`.

Do not create a closure-only commit solely to update `evaluation.md`, `plan.md` or another
SDD ledger. Preserve final evidence in the operational artifacts and PR record; create a
normal delivery commit only when the implementation or required product documentation itself
needs to be committed. Wait for checks on the actual delivery head before declaring delivery
complete.

Do not wait indefinitely for reviewer comments and do not process them here. Later actionable
review feedback is handled by `resolve-pr-feedback`; while the PR remains open, that workflow
may reopen the Spec, route implementation and invoke `conclude-spec` again. After merge, use
the bug-fix workflow for a defect or a new change Spec for changed behavior.

Do not merge or deploy unless explicitly requested.

## Conclusion summary

Return:

- clickable Spec, Plan when present, evaluation and PR links;
- Spec revision and completed status;
- delivery references, when present;
- validation result and CA/manual/visual coverage;
- fully delivered, partially delivered and deferred PRD `REQ-*` requirements with their final
  Implemented-checkbox disposition;
- applicable PR CI workflows and results;
- documentation alignment and remaining non-blocking limitations;
- finding-derived PRD, Architecture, Design, Tooling and Rule Pack improvements, including
  justified no-change dispositions;
- PR state and next authorized action.
