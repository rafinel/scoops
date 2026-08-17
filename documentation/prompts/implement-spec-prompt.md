---
name: implement-spec
description: Orchestrate direct implementation of a small open Spec with a Builder, living evaluation evidence, user-change handling and one final Reviewer.
---

# Implement a Spec Directly

Use for a small cohesive Spec whose author summary recommends `implement-spec`:

```text
Orchestrator → Builder Direct → sensors/manual preflight → Reviewer → conclude-spec
```

Run the workflow in the current task. Do not create another user-owned thread.

## Preflight and evaluation kickoff

Read the Spec, Rule Pack, Architecture and `documentation/tooling.md`. Confirm the Spec is
`open`, its revision is current, the direct route remains appropriate, required design
references exist and no material ambiguity remains. Preserve actual source/GitHub Issue
traceability without inventing external records.

Before the first implementation change:

1. record the base commit and freeze the Spec revision;
2. set the Spec to `in_progress`;
3. create colocated `evaluation.md` when absent, or reconcile it when resuming;
4. initialize it with the Spec revision, base/current commit, `status: in_progress`,
   acceptance-evidence matrix, validation evidence, Rule/documentation compliance, findings
   and evaluation history;
5. record required services, accounts, fixtures, design references and evidence targets.

Do not overwrite historical evidence. Actual command results, runtime observations,
implementation screenshots, findings and verdicts belong in `evaluation.md`.
Evaluation uses only `in_progress`, `ready` and `completed`; Reviewer verdicts remain in its
evidence/history rather than metadata.

## Persistence and user questions

Continue the implementation loop until the Spec evaluation is `ready`. Ask the user only when
an unresolved product, authority, environment or safety decision is genuinely required for the
next change; state the blocker and the smallest decision needed. Do not pause for a pending
Reviewer, a routine validation step, or a choice that can be inferred safely from the Spec,
Rules, repository, or existing evidence. After the answer, resume immediately and keep cycling
through fixes, sensors, evidence refresh, and Reviewer dispatches until `ready`.

## Direct implementation loop

1. Create `Builder Direct` with the current Spec revision, mapped RF/CA, observable outcome,
   allowed/prohibited paths, Rule Pack, Architecture, design bundle and applicable tools.
2. Inspect and integrate the Builder diff. The Builder does not edit Spec, state, Plan or
   evaluation artifacts.
3. Run focused repository-approved generation, code, type, unit and applicable integration
   checks. Reserve repeated full builds for the final Quality Gate unless bundler, exports,
   environment, Docker, workflow or generated-artifact changes require an earlier build.
4. Update `evaluation.md` with exact commands/results, current commit, criterion coverage,
   findings and evidence freshness.

Changes outside the Spec scope may remain in the shared worktree. Keep them out of the
candidate commit and evidence, and do not convert their presence into a Reviewer finding
unless they overlap evaluated paths, contaminate evidence, or cause a validation regression.
5. On a sensor failure or implementation discrepancy, record a finding, create
   `Builder Fix QG-<n>`, mark only affected evidence stale, rerun invalidated checks and
   repeat until the implementation is review-ready or user authority is required.

Builder reports are not official evidence by themselves. The Orchestrator verifies the diff
and records observed results.

### Rule reinforcement after implementation findings

When a Builder or Reviewer finding exposes a missing, ambiguous or repeatedly violated
Rule, distinguish it from an ordinary implementation correction:

- if the Rule already states the requirement clearly, fix the implementation and keep the
  Rule unchanged;
- if the reusable convention is not stated clearly enough, pause dependent work and route
  a Rule-document change through the authority gate before creating the next Builder Fix;
- add a focused `## Antipatterns to Avoid` entry to the relevant Rule document, stating the
  prohibited pattern, required alternative and validation evidence;
- reread the changed Rule, recompute the Rule Pack, record the authority change and finding
  in `evaluation.md`, invalidate affected evidence and rerun the scoped Builder Fix and
  its sensors.

Builders do not edit Rules, Specs, Plans or evaluation artifacts. A feature-specific
behavior belongs in the Spec rather than in a reusable antipattern entry.

## Design-backed UI loop

When a Design Contract exists:

- read `design/manifest.md` and every saved reference screenshot before coding;
- confirm that the Spec contains a visual inventory for every supplied screenshot and a
  recorded decision for every additional-screenshot suggestion before starting UI work;
- do not require live Pencil during implementation;
- preserve each state → surface → viewport mapping and intentionally distinct compositions;
- compare the running UI with the saved reference using the Playwright CLI, accessible
  locators and DOM/layout inspection;
- save implementation screenshots under
  `evidence/screenshots/rev-<spec-revision>/` and record route, state, viewport and findings;
- maintain one direct comparison record per supplied or supplemental reference; never use an
  implementation-generated screenshot as the only visual oracle;
- iterate until no material discrepancy remains.
- If an approved implementation change intentionally introduces a visual element not present
  in the supplied references, treat it as a Design Contract amendment: ask the user only if
  the intended placement/scope is unclear, record the decision in the Spec, add a supplemental
  reference or annotated design artifact to `design/manifest.md`, and recapture affected
  implementation screenshots before dispatching the Reviewer. Never silently leave the
  screenshots, manifest and Evaluation describing the old UI.

Builder/Orchestrator Playwright CLI checks are implementation feedback. They do not replace the
Reviewer's personal `MV-*` and visual validation. The Reviewer must be dispatched as a
separate read-only subagent/task whenever final validation is required; the Orchestrator
must not substitute its own review or an evaluation claim for that dispatch.

## User-requested change gate before conclusion

Whenever the user requests a change after implementation has started but before the Spec is
concluded, pause conclusion and classify the request against the current Spec, design bundle,
Rules and implementation. Show the classification and evidence to the user before changing
artifacts or code.

### A. Implementation correction

Use when the request makes the implementation comply with an existing RF/CA, Design
Contract, Technical Contract or Rule.

1. Keep the Spec revision unchanged.
2. Record a finding in `evaluation.md` mapped to the affected criterion/rule/reference.
3. Create a scoped Builder Fix.
4. Set evaluation status to `in_progress` when `ready` evidence is invalidated and mark only
   affected automated, runtime, manual and visual evidence stale.
5. Rerun affected checks, `MV-*` scenarios and screenshots.
6. Re-run the Reviewer when its evidence or verdict is invalidated.

### B. Contract change

Use when the user wants different product behavior, design intent or technical boundaries.

1. Pause implementation and set the current Spec to `draft`.
2. Route through `create-spec` clarification/authority alignment; update PRD, Rules,
   Architecture, Modules, Design or Tooling first when required.
3. Increment the Spec revision, update affected contracts/design bundle/validation and run
   authoring integrity checks.
4. Return the Spec directly to `open`; there is no Spec Reviewer.
5. Mark affected implementation evidence and prior verdicts historical, then reconcile
   `evaluation.md` to the new revision with `status: in_progress`.
6. Re-evaluate the implementation route. If `implement-spec` remains appropriate, resume
   this loop. If `implement-plan` is recommended, stop direct execution and route to
   `create-plan` then `implement-plan`.

If classification or expected behavior is ambiguous, ask the user; do not silently choose a
product, design or architectural outcome.

## Final Reviewer

After the integrated diff and current evidence are ready, dispatch one separate read-only
`Reviewer Direct` subagent/task. Send the exact Spec revision, evaluated commit/diff,
Implementation and Technical Contracts, Rule Pack, Architecture, official sensor evidence,
design bundle, all applicable `MV-*` scenarios and previous findings. Record the
dispatch/task identifier and input commit in `evaluation.md` before accepting its verdict.

The final Reviewer dispatch is mandatory before direct implementation can be completed,
even when automated checks and Builder reports pass. Trigger it again whenever a fix,
generated artifact, environment change, user-requested correction or contract amendment
invalidates its evidence or verdict. If the subagent cannot be dispatched or does not
return an independent verdict, keep evaluation `in_progress` and record the blocker; do
not route to `conclude-spec` or mark the implementation complete.

Dispatch the replacement Reviewer immediately after each correction that changes code, route
behavior, generated evidence, or evaluation findings. Do not pause the workflow waiting for a
later user turn; continue safe non-overlapping work while the Reviewer is pending and report
the dispatch identifier and verdict when available.

The Reviewer must directly inspect code and Rules, assess every CA and technical contract area,
personally execute every applicable `MV-*` scenario, and independently validate every
supplied and supplemental design screenshot at its exact viewport/state. The Reviewer must
open the original reference, inspect the implementation capture beside it, and record
missing, extra, altered or mismatched elements. Automated test reports and Builder reports are
supporting evidence only. Missing required Playwright CLI evidence, missing screenshot comparison,
or an unexplained material discrepancy produces `failed`.

The separate Reviewer subagent returns `accepted | failed`; the Orchestrator persists its
verdict, task identifier, reviewed commit and evidence in `evaluation.md`.

- On `failed`, record findings, create scoped Builder Fixes, invalidate affected evidence,
  keep evaluation `in_progress`, rerun it and ask the Reviewer to reassess the updated
  commit.
- On `accepted`, reconcile all evidence to the exact current commit, set evaluation to
  `ready` and route to `conclude-spec`.
- After three materially identical failures, ask the user only if the repeated blocker requires
  a decision unavailable in the repository or environment; otherwise continue with the next
  safe corrective action and Reviewer cycle. Never stop merely because the Reviewer is pending.

Do not create a task/phase Reviewer or conclusion Reviewer, an extra implementation role,
fork or user-owned task. The single final Reviewer is a separate internal subagent/task,
not the Orchestrator and not the Builder.
