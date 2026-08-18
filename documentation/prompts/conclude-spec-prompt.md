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

Also require a final current-candidate conformance record: the exact Spec revision and Builder
scope match the diff; the required file/widget tree, contracts, exclusions and applicable UI
states pass; every affected screenshot is fresh and inspected; and Playwright console,
network, HTTP status, accessibility, keyboard and responsive checks are classified. Passing
tests without this record is not validation-ready.

Conclusion requires authorization to create commits, push the delivery branch and create or
update its pull request. If that authority is not explicit or already in scope, ask once and
keep the Spec `in_progress`. Do not silently publish, merge or deploy.

## Authority and late-change routing

If local preflight or closure review finds a discrepancy, pause the closure phase and classify
it:

- **Implementation correction:** record the finding, mark affected evidence stale, set
  evaluation to `in_progress` and immediately invoke `implement-spec`. It selects the current
  Plan automatically when present and owns the correction and validation.
- **Contract change:** set the Spec to `draft`, immediately invoke `create-spec`, obtain required
  product or technical authority, increment the revision, reconcile Plan/evaluation and
  continue through the recommended implementation route before resuming conclusion.
- **Documented transient CI/infrastructure failure:** keep the Spec `in_progress` and allow
  a same-SHA rerun only with concrete evidence that the failure is transient; keep waiting for
  its result in the current task.

Do not create a Builder or change the implementation inside `conclude-spec`.
The invoked implementation workflow creates the Builder and refreshes validation. Resume
conclusion automatically after it returns evaluation to `ready`.

## Prepare and publish the PR candidate

1. Read the Spec Validation Contract, Rule Pack, current evaluation and
   `documentation/tooling.md`.
2. Run the applicable local generation, formatting/code, type, unit, integration, Playwright CLI,
   architecture and build preflight required by the Spec and changed paths.
3. Reconcile generated artifacts, migrations, saved design evidence and factual
   documentation against the current diff.
4. Rerun the final Spec conformance comparison and verify the current validation evidence covers
   the exact candidate diff. Any later
   implementation or acceptance-evidence change routes back to the implementation workflow.
5. Invoke `commit-code` to create intentional scoped commits.
6. Invoke `create-pr` to push the branch and create or update the delivery PR. Reuse an
   existing PR for the same delivery; never create a duplicate.
7. Record the candidate identity, branch and PR URL in the delivery record; update
   `evaluation.md` only when the operational ledger needs the reference.

## Final PR CI Quality Gate

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
- immediately invoke the applicable implementation or amendment workflow through the
  authority and late-change routing above;
- after that workflow returns evaluation to `ready`, invoke `commit-code`, update the existing
  PR through `create-pr`, and run this gate again on its new head SHA;
- rerun the same SHA only for a documented transient CI/infrastructure failure;
- repeat this correction, publication and CI loop until the gate passes or a permitted pause
  condition from Workflow continuity occurs.

`conclude-spec` observes and orchestrates CI failures; it does not edit their fixes directly.
Reporting the failure with a suggested next workflow while fixable work remains is an
incomplete conclusion run.

## Evidence and documentation closure

After CI passes, verify `evaluation.md` contains:

- the canonical `documentation/templates/evaluation.md` sections, table columns and stable
  evidence IDs;
- exact Spec revision and CI-tested candidate identity, when available;
- complete acceptance-criteria matrix;
- automated, runtime, manual and visual evidence;
- saved reference and implementation screenshot paths when visual evidence was collected;
- visual comparison rows for any supplied or Spec-requested supplemental screenshot that was
  explicitly scoped as acceptance evidence, including exact viewport/state and differences;
- a resolved decision for every additional-screenshot suggestion when the suggestion affects
  an acceptance decision;
- Rule compliance and documentation alignment;
- resolved and active findings with evaluation history;
- final validation result;
- applicable PR CI run evidence and final build result.

Check PRD, Architecture, Modules, Design, Tooling and the Rule Pack against delivered facts.
Apply factual documentation corrections only. Product, Contract, global Rule, module
ownership or architecture changes require user authority and the late-change route.

## Complete the delivery

Only after the PR CI gate passes and no blocking finding remains:

- set `evaluation.md` to `completed`;
- set `plan.md` to `completed`, when present;
- set `spec.md` to `completed` and retain only the summarized outcome, CI-tested commit and
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
- CI-tested candidate identity and delivery references, when present;
- validation result and CA/manual/visual coverage;
- applicable PR CI workflows and results;
- documentation alignment and remaining non-blocking limitations;
- PR state and next authorized action.
