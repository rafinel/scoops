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
5. On a sensor failure or implementation discrepancy, record a finding, create
   `Builder Fix QG-<n>`, mark only affected evidence stale, rerun invalidated checks and
   repeat until the implementation is review-ready or user authority is required.

Builder reports are not official evidence by themselves. The Orchestrator verifies the diff
and records observed results.

## Design-backed UI loop

When a Design Contract exists:

- read `design/manifest.md` and every saved reference screenshot before coding;
- do not require live Pencil during implementation;
- preserve each state → surface → viewport mapping and intentionally distinct compositions;
- compare the running UI with the saved reference using Browser-use/CDP, accessibility tree
  and DOM/layout inspection;
- save implementation screenshots under
  `evidence/screenshots/rev-<spec-revision>/` and record route, state, viewport and findings;
- iterate until no material discrepancy remains.

Builder/Orchestrator browser checks are implementation feedback. They do not replace the
Reviewer's personal `MV-*` and visual validation.

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

After the integrated diff and current evidence are ready, create one read-only
`Reviewer Direct`. Send the exact Spec revision, evaluated commit/diff,
Implementation and Technical Contracts, Rule Pack, Architecture, official sensor evidence,
design bundle, all applicable `MV-*` scenarios and previous findings.

The Reviewer must directly inspect code and Rules, assess every CA and technical contract area,
personally execute every applicable `MV-*` scenario, and compare design-backed UI with saved
references at exact viewports. Automated Playwright and Builder reports are supporting
evidence only. Missing required manual evidence produces `failed`.

The Reviewer returns `accepted | failed`; the Orchestrator persists the verdict and evidence
in `evaluation.md`.

- On `failed`, record findings, create scoped Builder Fixes, invalidate affected evidence,
  keep evaluation `in_progress`, rerun it and ask the Reviewer to reassess the updated
  commit.
- On `accepted`, reconcile all evidence to the exact current commit, set evaluation to
  `ready` and route to `conclude-spec`.
- After three materially identical failures, present the attempts and ask the user for the
  unresolved authority or environment decision.

Do not create a task/phase Reviewer, conclusion Reviewer, extra implementation role, fork or
new task.
