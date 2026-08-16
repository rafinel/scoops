---
name: conclude-spec
description: Publish an accepted Spec implementation through its pull request, run the final PR CI Quality Gate, close the SDD artifacts, and report the delivery state.
---

# Conclude a Spec

Close a review-ready implementation in the current task. `conclude-spec` owns publication,
the final pull-request CI gate, evidence closure and artifact completion. It does not
implement changes, process later reviewer feedback or run a Reviewer.

## Preconditions

Require:

- Spec status is `in_progress`;
- `evaluation.md` has `status: ready` and references the current Spec revision and
  implementation;
- direct implementation or all Plan phases are complete;
- required CA, `MV-*`, runtime and visual evidence is current;
- no blocking implementation finding remains;
- source and GitHub Issue traceability is preserved.

Conclusion requires authorization to create commits, push the delivery branch and create or
update its pull request. If that authority is not explicit or already in scope, ask once and
keep the Spec `in_progress`. Do not silently publish, merge or deploy.

## Authority and late-change routing

If local preflight or closure review finds a discrepancy, stop conclusion and classify it:

- **Implementation correction:** record the finding, mark affected evidence stale and route
  back to `implement-spec` or `implement-plan`. Set evaluation to `in_progress`; that
  workflow owns the correction, validation and implementation review.
- **Contract change:** set the Spec to `draft`, route through `create-spec`, obtain required
  product or technical authority, increment the revision, reconcile Plan/evaluation and
  resume the recommended implementation route.
- **Documented transient CI/infrastructure failure:** keep the Spec `in_progress` and allow
  a same-SHA rerun only with concrete evidence that the failure is transient.

Do not create a Builder, run a Reviewer or change the implementation inside `conclude-spec`.
Resume conclusion only after the routed workflow returns evaluation to `ready`.

## Prepare and publish the PR candidate

1. Read the Spec Validation Contract, Rule Pack, current evaluation and
   `documentation/tooling.md`.
2. Run the applicable local generation, formatting/code, type, unit, integration, browser,
   architecture and build preflight required by the Spec and changed paths.
3. Reconcile generated artifacts, migrations, saved design evidence and factual
   documentation against the current diff.
4. Verify the accepted Reviewer evidence covers the exact candidate diff. Any later
   implementation or acceptance-evidence change routes back to the implementation workflow.
5. Invoke `commit-code` to create intentional scoped commits.
6. Invoke `create-pr` to push the branch and create or update the delivery PR. Reuse an
   existing PR for the same delivery; never create a duplicate.
7. Record the candidate SHA, branch and PR URL in `evaluation.md`.

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
- route implementation, test, generated-artifact or contract failures through the authority
  and late-change routing above;
- after the routed workflow returns, invoke `commit-code`, update the existing PR through
  `create-pr`, and run this gate again on its new head SHA;
- rerun the same SHA only for a documented transient CI/infrastructure failure.

`conclude-spec` observes and routes CI failures; it does not implement their fixes.

## Evidence and documentation closure

After CI passes, verify `evaluation.md` contains:

- exact Spec revision and CI-tested candidate SHA;
- complete acceptance-criteria matrix;
- automated, runtime, manual and visual evidence;
- saved reference and implementation screenshot paths;
- Rule compliance and documentation alignment;
- resolved and active findings with evaluation history;
- accepted Reviewer verdict;
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

When completion statuses require a closure-only documentation commit, invoke `commit-code`,
update the existing PR with `create-pr`, and wait for any PR checks triggered on the new head
before declaring delivery complete. Report the closure SHA in the conclusion summary; do not
create another commit solely to make a document refer to its own SHA.

Do not wait indefinitely for reviewer comments and do not process them here. Later actionable
review feedback is handled by `resolve-pr-feedback`; while the PR remains open, that workflow
may reopen the Spec, route implementation and invoke `conclude-spec` again. After merge, use
the bug-fix workflow for a defect or a new change Spec for changed behavior.

Do not merge or deploy unless explicitly requested.

## Conclusion summary

Return:

- clickable Spec, Plan when present, evaluation and PR links;
- Spec revision and completed status;
- CI-tested candidate SHA and closure SHA when present;
- Reviewer verdict and CA/manual/visual coverage;
- applicable PR CI workflows and results;
- documentation alignment and remaining non-blocking limitations;
- PR state and next authorized action.
