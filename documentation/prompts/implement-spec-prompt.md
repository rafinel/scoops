---
name: implement-spec
description: Orchestrate direct implementation of a small open Spec with a Builder, living evaluation evidence and user-change handling.
---

# Implement a Spec Directly

Use for a small cohesive Spec whose author summary recommends `implement-spec`:

```text
Orchestrator → Builder Direct → sensors/manual preflight → integrated validation → conclude-spec
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
4. initialize it with the Spec revision, candidate snapshot identity when available, `status: in_progress`,
   acceptance-evidence matrix, validation evidence, Rule/documentation compliance, findings
   and evaluation history;
5. record required services, accounts, fixtures, design references and evidence targets.

Do not overwrite historical evidence. Actual command results, runtime observations,
implementation screenshots, findings and verdicts belong in `evaluation.md`.
Evaluation uses only `in_progress`, `ready` and `completed`; validation findings and history
remain in the evidence ledger rather than metadata.

## Persistence and user questions

Continue the implementation loop until the Spec evaluation is `ready`. Ask the user only when
an unresolved product, authority, environment or safety decision is genuinely required for the
next change; state the blocker and the smallest decision needed. Do not pause for a routine
validation step or a choice that can be inferred safely from the Spec,
Rules, repository, or existing evidence. After the answer, resume immediately and keep cycling
through fixes, sensors and evidence refresh until `ready`.

## Direct implementation loop

1. Create `Builder Direct` with the current Spec revision, mapped RF/CA, observable outcome,
   allowed/prohibited paths, Rule Pack, Architecture, design bundle and applicable tools.
2. Inspect and integrate the Builder diff. The Builder does not edit Spec, state, Plan or
   evaluation artifacts.
3. Run focused repository-approved generation, code, type, unit and applicable integration
   checks. Reserve repeated full builds for the final Quality Gate unless bundler, exports,
   environment, Docker, workflow or generated-artifact changes require an earlier build.
4. Update `evaluation.md` with exact commands/results, candidate snapshot identity when available, criterion coverage,
   findings and evidence freshness.

Changes outside the Spec scope may remain in the shared worktree. Keep them out of the
review candidate snapshot and evidence, and do not convert their presence into a validation
finding unless they overlap evaluated paths, contaminate evidence, or cause a validation
regression.
5. On a sensor failure or implementation discrepancy, record a finding, create
   `Builder Fix QG-<n>`, mark only affected evidence stale, rerun invalidated checks and
   repeat until the implementation is validation-ready or user authority is required.

Builder reports are not official evidence by themselves. The Orchestrator verifies the diff
and records observed results.

### Rule reinforcement after implementation findings

When an implementation or sensor finding exposes a missing, ambiguous or repeatedly violated
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
  implementation screenshots before rerunning the affected validation. Never silently leave the
  screenshots, manifest and Evaluation describing the old UI.

Builder/Orchestrator Playwright CLI checks are implementation evidence. The Orchestrator owns
the final `MV-*` and visual validation and must reconcile it with DOM/layout inspection,
screenshots, console messages, failed requests and persistence evidence for the exact candidate.

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
6. Rerun the affected sensors, Playwright CLI scenarios and screenshot comparisons when their
   evidence is invalidated.

### B. Contract change

Use when the user wants different product behavior, design intent or technical boundaries.

1. Pause implementation and set the current Spec to `draft`.
2. Route through `create-spec` clarification/authority alignment; update PRD, Rules,
   Architecture, Modules, Design or Tooling first when required.
3. Increment the Spec revision, update affected contracts/design bundle/validation and run
   authoring integrity checks.
4. Return the Spec directly to `open`; there is no separate Spec review stage.
5. Mark affected implementation evidence and prior verdicts historical, then reconcile
   `evaluation.md` to the new revision with `status: in_progress`.
6. Re-evaluate the implementation route. If `implement-spec` remains appropriate, resume
   this loop. If `implement-plan` is recommended, stop direct execution and route to
   `create-plan` then `implement-plan`.

If classification or expected behavior is ambiguous, ask the user; do not silently choose a
product, design or architectural outcome.

## Integrated validation and readiness

After the integrated diff and current evidence are ready, the Orchestrator executes the full
validation matrix against the exact Spec revision and candidate snapshot: technical sensors,
all applicable `MV-*` scenarios, screenshot comparisons at declared viewports/states, and
console, network, accessibility, DOM/layout and persistence inspection. Record the commands,
captures, results and findings in `evaluation.md`.
`evaluation.md` is an operational evidence ledger; it is not part of the review candidate
by default and does not require a closure-only documentation commit.

- On a failed sensor or material discrepancy, record findings, create scoped Builder Fixes,
  invalidate affected evidence, rerun it against the updated candidate snapshot and keep
  evaluation `in_progress`.
- When all required evidence is current and no blocking finding remains, reconcile it to the
  exact current candidate snapshot, set evaluation to `ready` and route to `conclude-spec`.
- After three materially identical failures, ask the user only if the repeated blocker requires
  a decision unavailable in the repository or environment; otherwise continue with the next
  safe corrective action and validation cycle.
