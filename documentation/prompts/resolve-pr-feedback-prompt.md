---
name: resolve-pr-feedback
description: Resolve reviewer comments on an open Scoops pull request, reopening and rerouting its Spec delivery when feedback requires implementation or contract changes.
---

# Resolve Pull Request Feedback

Process reviewer conversations that arrive after a delivery PR is open. This workflow owns
feedback classification, replies and SDD reopening. It does not own the final CI gate, close
the Spec, implement changes or run implementation validation.

## Inspect the current review state

Use authenticated `gh` to read the open PR, current head SHA, unresolved conversations,
reviews, Spec, `evaluation.md`, actual diff and GitHub Issue traceability. Ignore stale comments
that target superseded code only after verifying they are no longer applicable.

Read the applicable PRD and the delivery's `PRQ-*`/`FR-*`/`AC-*` traceability. Delivery state is
owned by verified product evidence in Spec and Evaluation, not by the PRD.

When feedback affects an HTTP route group or request contract, inspect the matching
`apps/server/rest-client/<module>/<route-group>.rest` file as part of the same review. Classify
the file as an affected implementation artifact, verify that every current controller operation
has one labeled example with current parameters, headers, body and reusable non-secret variables,
and include any required REST-client correction in the `implement-spec` scope. Do not resolve the
conversation or report the implementation as ready while the example file is missing, stale,
untracked or absent from the Spec/Evaluation traceability.

Preserve only actual GitHub Issue or direct-request traceability. Do not resolve a
conversation before its requested action exists on the branch or an evidence-backed response
has been accepted.

## Classify every actionable comment

Classify feedback against the current Spec, saved design bundle, Rules, authoritative
documentation and implementation:

### Explanation only

Use when no repository change is required. Reply with concise evidence and resolve the
conversation only when appropriate. Do not reopen the Spec.

### PR metadata correction

Use for title, body, labels or traceability changes that do not alter repository artifacts.
Update the PR and reply. Do not reopen the Spec.

### Implementation correction

Use when the delivered implementation, tests or evidence does not satisfy the existing
Spec or Rules while the PR remains open:

1. if completed, change the same Spec to `open` without incrementing its revision; if already
   active, preserve its current revision and reopen the affected evidence;
2. set `evaluation.md` to `status: in_progress`, append a review-cycle entry and record the
   comment URL as a mapped finding;
3. verify the finding against the delivered product and its `PRQ-*`/`FR-*`/`AC-*` mapping. If
   it proves an affected PRD requirement is not delivered, record it as not delivered in
   `evaluation.md`; if it is only an evidence gap or transient CI/infrastructure issue
   and product behavior remains verified, preserve the current delivery disposition;
4. invoke `implement-spec` for autonomous correction and integrated verification;
5. let that implementation workflow own fixes, invalidated evidence and manual validation;
6. after it returns Evaluation to `ready`, invoke `conclude-spec` to publish the corrected
   candidate, run its PR CI gate, and close the Spec again. Do not publish a separate commit
   solely for the `ready` status transition.

Never apply the correction directly from this workflow, even when the comment appears small.
The resumed `implement-spec` run owns decomposition and delegation, verifies the integrated
diff and reruns only evidence invalidated by the correction. Reuse unaffected passing checks
and review findings. Check affected REST-client parity and use fresh Playwright captures for
changed UI state/viewport. Run the structural checker only for explicit classified artifact
paths; do not require a replacement file inventory or execution ledger. Run applicable
independent code and visual review in parallel with integrated checks once the candidate and
required captures exist, using existing valid evidence as their starting point. Resolve verified
blocking findings and continue corrections until passing or the documented blocker/retry boundary.

### Contract change

Use when the reviewer requests different product behavior, design intent or technical
boundaries while the delivery PR remains open:

1. set the same Spec to `draft`;
2. append the review comment and reason to its revision history;
3. route through `create-spec` for product/technical clarification and required authority;
4. once the amendment is approved, identify every materially changed PRD `PRQ-*`, update the
   PRD first before the revised Spec is authored;
5. update Rules, Architecture, Modules, Design or Tooling first when required;
6. increment the Spec revision, reconcile the design bundle and validation, set
   `evaluation.md` to `status: in_progress`, preserving unaffected evidence as current and
   invalidated evidence as historical; run the applicable Spec Reviewer
   inside the `create-spec` integrity gate, and return the Spec to `open` after verified findings
   are resolved without a separate user-facing approval stage;
7. invoke `implement-spec` to autonomously implement and verify the amended contract;
8. invoke `conclude-spec` again to resolve the delivery disposition, update the existing PR,
   run CI and close the delivery.

If classification or expected behavior is ambiguous, ask the user before changing the Spec
or implementation.

When the requested action is clearly within the existing Contract, do not ask for permission to
fix it. Record the reviewer comment as a finding, route it through `implement-spec`, and let the
workflow continue until the affected evidence is current or an actual authority blocker exists.

For every accepted review finding, preserve the distinction between the concrete `Findings`
record and any reusable `Lessons learned` entry in `evaluation.md`. If the lesson reveals a
repeatable gap, update the applicable PRD, Architecture, Design, Tooling or Rule document before
conclusion; otherwise record an explicit no-change disposition. Do not close a review cycle
with only a resolved finding when the lesson requires authority updates.

## Reply and resolve every addressed thread

Replying is not closing. Do not end a review cycle with an addressed conversation still open.
For every actionable thread:

1. once the requested action is on the PR branch and, for an implementation or contract
   correction, `conclude-spec` has published it and its final head passed the applicable PR CI
   gate, reply on the thread with the commit that addresses it and the concrete evidence
   (regression test, observed result, or explanation);
2. then resolve the thread through authenticated `gh` (GraphQL `resolveReviewThread`), and verify
   from GitHub that its `isResolved` is `true`; do this by default, without waiting for the
   reviewer or asking the user, because the evidence-backed reply has been published;
3. leave a thread open only when the action does not yet exist on the branch, the reviewer's
   concern is disputed or ambiguous and needs their or the user's decision, or CI on the
   corrected head has not passed. State each such thread and its reason in the completion
   report;
4. finish by listing the PR's review threads from GitHub and confirming none addressed thread
   remains unresolved.

## Post-merge boundary

Do not reopen a completed Spec after its PR has merged:

- use the bug-fix workflow for a defect against the delivered contract;
- create a change Spec under `changes/<change-name>/spec.md` for new or changed behavior.

## Completion report

Return:

- PR and conversation links inspected;
- classification and evidence for every actionable comment;
- replies or PR metadata changes made, and the verified resolved state of every addressed thread;
- Spec/Evaluation transition when reopened;
- affected PRD `PRQ-*` requirements and any changed or preserved delivery disposition;
- correction, publication and closure outcomes reached in the current task;
- unresolved comments and blockers.

Do not claim the PR is finally validated or close the Spec. `conclude-spec` owns the final PR
CI gate and closure after any implementation cycle.
