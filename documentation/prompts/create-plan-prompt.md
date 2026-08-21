---
name: create-plan
description: Create a concise SDD execution Plan for an open feature Spec that needs dependent phases, parallel lanes, risk control or a durable implementation ledger.
---

# Create a Plan

Create `plan.md` only when an `open` Spec recommends Plan-backed execution because it has
dependent phases, multiple applications or ownership boundaries, migration/integration
risk, meaningful parallelism, complex manual validation or a real need for recovery state.
After planning, `implement-spec` automatically selects this Plan. Use its direct strategy for
a small cohesive Spec.

The Orchestrator creates and owns the Plan in the current task. Builders never edit it.

The Plan is an execution ledger, not a second implementation contract. It must preserve the
Spec's exact revision and route every implementation change through `implement-spec`; never
create or reference a parallel implementation workflow.

## Preconditions and authority

Read the current Spec, its Rule Pack, Architecture and Tooling. Confirm:

- the Spec is `open` and its revision is current;
- the Technical and Validation Contracts contain enough detail to schedule work;
- every required design manifest/reference exists;
- every supplied design screenshot has a completed visual inventory, and all required
  supplemental-screenshot suggestions are captured or explicitly accepted as documented
  assumptions;
- Plan-backed execution remains appropriate;
- no material product or technical ambiguity remains.

Planning must not redefine product behavior or technical contracts. If planning exposes a
material ambiguity or requires a different contract, stop, return the Spec to the
`create-spec` amendment workflow and resume only after the revised Spec is `open`.

Use the Spec's real source and GitHub Issue traceability. Do not invent or migrate external
records.

## Location and metadata

Create `plan.md` beside the governing `spec.md`, including inside a concluded feature's
`changes/<change-name>/` directory.

```yaml
---
title: <feature> — implementation plan
status: pending
spec: ./spec.md
spec_revision: 1
evaluation: ./evaluation.md
github_issue: <actual-github-issue-url, optional>
updated_at: YYYY-MM-DD
---
```

`evaluation.md` is an expected colocated path. It is created by `implement-spec` at
implementation kickoff, not by `create-plan`.

## Required Plan structure

Write three required sections and one conditional section:

1. **Execution status**
2. **Execution ledger**
3. **Validation and handoff**
4. **Execution log** — add only after a risk, finding, failed attempt or material execution
   event exists.

Do not repeat the Spec's objective, scope, requirements, algorithms, declarations, schemas,
technical decisions or full Rule Pack. Reference the authoritative Contract instead.

### 1. Execution status

Keep one compact operational snapshot:

- Spec path, revision and `open` status;
- one-sentence rationale for Plan-backed execution;
- current phase;
- next action;
- active blockers;
- only shared/generated-file, package/lockfile or other ownership coordination that cannot
  be represented by a single task.

Update this snapshot throughout implementation. If the Spec revision changes, record the
revision mismatch as a blocker, stop dependent execution and reconcile every affected phase,
task, path, criterion, design reference and validation target before resuming.

### 2. Execution ledger

Use one phase/parallelism table with exactly these columns:

| Wave | Lane | Phase | Name | Depends on | Parallel with | Status | Exit condition |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | `<actual lane>` | F1 | `<outcome>` | — | — | `pending` | `<sensor-backed exit>` |

Derive the dependency graph from the Spec's Technical Contract. Do not mandate a Core,
Server, Web or any other lane. Parallel lanes require stable input contracts, non-overlapping
paths and explicit ownership of shared/generated files. The Orchestrator coordinates package
installation and lockfile changes before parallel Builders edit application code.

Below the table, group concise task cards by phase:

```md
### F1 — <phase name>

#### F1-T1 — <task outcome>

- **Status/owner:** `pending` — Builder F1-T1
- **Depends/parallel:** <dependencies and safe parallel work>
- **Paths:** <exact owned paths or coherent path groups>
- **Contract:** <RF-* and CA-*>
- **Outcome:** <observable result>
- **Rules:** <exact applicable Rule paths and relevant `Antipatterns to Avoid` subsections, when present>
- **Exit:** <focused commands/sensors and required evidence>
```

Every task has exactly these seven concerns: status/owner, dependency/parallelism, owned
paths, RF/CA coverage, observable outcome, applicable Rules (including relevant
`Antipatterns to Avoid` subsections) and validation/exit. Reference the Spec for technical
detail. Paths may not overlap between active Builders.

For every task that changes UI or browser behavior, its exit must also require: the exact Spec
widget tree comparison, applicable keyboard/narrow-viewport states, console and failed-request
inspection, and a fresh Playwright CLI screenshot for each affected design state. For every task
that changes server-backed behavior, its exit must require the real request/response and
persistence or authorization result; mocked transport is not sufficient evidence.

A Builder may not start until the Orchestrator records the exact Spec revision, task paths,
criteria, Rules, design references and exits. A task may not be marked complete from a Builder
report alone. On any error or discrepancy, keep it `in_progress`, record the finding, invalidate
affected evidence, route a scoped Builder Fix through `implement-spec`, and rerun the exit
without asking the user for permission to make an in-Contract correction.

Status vocabulary:

- **Plan:** `pending`, `in_progress`, `completed`, `superseded`;
- **Phase, task and coverage row:** `pending`, `in_progress`, `completed`.

Keep a failed or blocked item `in_progress` and record its finding/blocker and next action;
do not create failure statuses. Keep the final integrated phase `in_progress` while integrated
validation is active. Use `superseded` only when a revised Spec replaces
the Plan or switches to direct implementation.

### 3. Validation and handoff

Use one coverage table to schedule evidence without repeating the Spec's scenario steps:

| Type | Scenario/surface | Criteria | Reference | Evidence target | Status |
| --- | --- | --- | --- | --- | --- |
| Manual | MV-01 | CA-01 | Spec MV-01 | `./evaluation.md` | `pending` |
| Visual (optional) | `<state>` | CA-02 | `./design/<reference>.png` | `Playwright test-results path or CI artifact identifier` | `pending` |
| Runtime | `<integration>` | CA-03 | Integration Contract | `./evaluation.md` | `pending` |

Include only applicable rows. For design-backed UI, schedule every supplied screenshot and every
required supplemental state at its exact viewport and record an independent comparison row for
each. Do not create a dedicated visual-reference test or use one generic capture as evidence for
multiple states/viewports. Recommended supplemental screenshots may be deferred only when the
manifest records the decision and no acceptance gap remains. Builders and the Orchestrator use
saved references and do not depend on Pencil MCP.

Define the final handoff condition: all tasks and phases completed, Spec validation
commands current on the integrated commit, generated artifacts/migrations reviewed,
services/accounts/fixtures ready, every `MV-*` executable, transient validation-artifact
identifiers recorded, the final Spec tree/conformance comparison passed, all additional-screenshot
decisions resolved and no blocking finding active. Then
route directly to `conclude-spec`.

### 4. Execution log — conditional

After implementation starts, record only material operational entries:

```md
- **YYYY-MM-DD — <phase/task event>**
  - **Finding/result:** <evaluation finding ID or concise result>
  - **Next action:** <action>
```

The Plan owns status, attempts and next action. Full command evidence, screenshots, finding
details and verdicts belong in `evaluation.md`.

## Plan integrity and author summary

Before saving, verify the Spec revision, acyclic dependencies, complete RF/CA scheduling,
non-overlapping active paths, valid Rule paths, executable exits, complete `MV-*`/design
coverage, explicit Builder ownership, final conformance checkpoints and valid colocated links.

After creating or materially revising `plan.md`, return a concise summary with:

- clickable Plan path, status and Spec revision;
- reason for Plan-backed execution;
- number of waves, phases and tasks;
- parallel lanes, critical dependencies and shared ownership;
- planned manual/runtime/visual coverage;
- active risks or blockers;
- initial phase and next action.

Do not claim unexecuted phases, sensors or validation passed. If the Spec is not `open`, the
revision is stale or a prerequisite is missing, report the blocker instead of presenting the
Plan as implementation-ready.
