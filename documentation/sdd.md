# Specification-Driven Development

Specification-Driven Development (SDD) is the delivery workflow used for Scoops features
and feature-scoped changes. It keeps product intent, implementation contracts, execution
state, evidence, review and pull-request closure in durable repository artifacts.

SDD is not required for maintenance that does not need a feature Contract. The Orchestrator
classifies the request and uses a direct maintenance workflow when a Spec would add no useful
authority or traceability.

## Mandatory reading

Before starting or resuming any SDD workflow, read these repository authorities in full,
regardless of the initially expected paths or layers:

1. [`modules.md`](./modules.md) for business ownership and cross-module boundaries;
2. [`architecture.md`](./architecture.md) for system invariants and dependency direction;
3. [`rules.md`](./rules.md) for dynamic Rule selection, followed by every selected Rule;
4. [`tooling.md`](./tooling.md) for actual workspace, generation, validation and environment
   commands.

Read root and applicable nested `AGENTS.md` files before these documents. Re-run Rule
discovery and reread affected authority whenever the task expands or an authority changes.
Do not postpone Architecture, Modules or Tooling until implementation happens to cross a
boundary; they are mandatory SDD preflight inputs.

## Sources of authority

SDD does not replace repository documentation. A feature Spec is written from the applicable
sources of truth:

| Authority | Governs |
| --- | --- |
| Root and nested `AGENTS.md` | Agent behavior, repository safety and tool usage. |
| [`rules.md`](./rules.md) and selected Rules | Reusable implementation conventions for affected paths and behavior. |
| [`architecture.md`](./architecture.md) | System boundaries, dependency direction, consistency and integrations. |
| [`modules.md`](./modules.md) | Business-module ownership. |
| Module PRD | Product outcomes, actors, capabilities, experience, product dependencies, user journeys and implementation inventory. |
| [`design.md`](./design.md) and saved design references | UI system and feature-specific visual intent. |
| [`tooling.md`](./tooling.md) | Real generation, validation, build and environment commands. |
| GitHub Issue, report or direct request | Delivery source and external traceability when present. |

When a requested feature requires a PRD, Rule, architecture, module, design or tooling
change, that authority is updated first. Product behavior, global Rules, architecture and
module ownership require explicit user approval. The Spec is then written against the
updated authority.

### PRD requirement contract

Each module PRD expresses a canonical `REQ-*` requirement with these fields, in this order:

1. an **Implemented** checkbox;
2. **Outcome**;
3. **Actors**;
4. optional **Consumes**;
5. optional **Provides**;
6. **Capabilities**;
7. **Experience** when the requirement has a user-visible effect.

Omit `Consumes` or `Provides` when no meaningful product-capability relationship exists, and
omit `Experience` only for a purely system-executed requirement with no user-visible effect.
PRDs do not contain User Stories or Acceptance Criteria. Observable implementation acceptance
belongs to the Spec's `CA-*` contract. PRD User Journeys may cross several `REQ-*` requirements
and must not become a duplicate requirement list.

A PRD Product Dependency Graph records only product-capability consumption: an edge from A to B
means B consumes a capability or authoritative fact provided by A. It does not define file or
technical dependencies, implementation priority, foundation work, execution phases, waves or
parallelism. Specs and Plans derive execution dependencies from the Technical Contract and real
repository boundaries, never from the PRD graph.

New and materially amended requirements use an unchecked Implemented checkbox. A material PRD
amendment returns every affected `REQ-*` to unchecked before the revised Spec is authored.
`create-prd`, `create-spec` and `implement-spec` never check a PRD requirement. Only
`conclude-spec` may check a fully delivered current requirement, after conclusion preflight and
before the delivery commit and final PR CI. Evaluation `ready` means implementation evidence can
enter conclusion; it is not PRD closure and does not authorize a checkbox change by
`implement-spec`.

## Roles

SDD uses four roles. Prompt names such as `create-spec` or `conclude-spec` are workflows,
not additional agents.

| Role | Responsibility | Restrictions |
| --- | --- | --- |
| Orchestrator | The main agent selects workflows, owns artifact state, creates subagents, integrates Builder diffs, runs deterministic sensors, records evidence, publishes the PR and routes failures or changes. | Does not delegate integration or the official evidence verdict, skip required sensors or claim evidence that was not executed. |
| [Builder](./agents/builder-agent.md) | Implements one bounded direct, phase, task or fix scope against the current Spec revision and Rules. | Does not edit Spec, Plan, Evaluation, PRD or Rules; does not review its own work or publish delivery artifacts. |
| [Spec Reviewer](./agents/spec-reviewer-agent.md) | Independently audits one otherwise open-ready draft Spec against its source authorities, Rule Pack, real repository paths, design references and validation taxonomy. | Does not edit files, resolve product or technical ambiguity, create subagents or decide the Spec status. |
| [Implementation Reviewer](./agents/implementation-reviewer-agent.md) | Independently reviews one integrated Plan-backed implementation candidate against the Spec, Rules, design references and current evidence. | Does not edit files, implement fixes, create subagents or decide the official evidence verdict. |

Builders and Reviewers are scoped subagents created by the Orchestrator in the current task.
No subagent creates another subagent, fork or user-owned task. Spec quality is enforced by
clarification, authoring-integrity checks and the applicable independent Spec Reviewer;
implementation quality is enforced by deterministic sensors, Playwright CLI evidence and the
applicable Implementation Reviewer.

## Durable artifacts

Feature artifacts live under:

```text
documentation/features/<domain>/<feature>/
├── spec.md
├── plan.md                         # optional
├── evaluation.md                   # created at implementation kickoff
├── design/
│   ├── manifest.md                 # for design-backed UI
│   └── <reference screenshots>.png
```

Implementation screenshots are validation artifacts, not durable feature files. Capture
them in Playwright's ignored `test-results/` output or retain them as CI artifacts when a
review needs the pixels; record the state, viewport, comparison result and artifact
identifier in `evaluation.md`. Do not create or extend
`documentation/features/**/evidence/` for new features. Legacy evidence directories from
older revisions may remain in Git history, but they are not part of the current artifact tree.

New behavior for an already concluded feature uses:

```text
documentation/features/<domain>/<feature>/changes/<change-name>/
```

| Artifact | Owns | Does not own |
| --- | --- | --- |
| `spec.md` | Product, design, technical and validation Contracts. | Execution attempts or test results. |
| `plan.md` | Execution waves, dependencies, task ownership, status and next action. | Duplicate product or technical contracts. |
| `evaluation.md` | Actual commands, runtime/manual/visual evidence, findings, history and PR CI evidence. | Product or architecture authority. |
| `design/manifest.md` | Reference-frame inventory, source node, state, viewport, screenshot, implementation surface and comparison requirement. | Implementation-generated visual proof. |

## Artifact statuses

### Spec

| Status | Meaning |
| --- | --- |
| `draft` | The Contract is being created or materially amended. |
| `open` | The Contract passed authoring integrity and is implementation-ready. |
| `in_progress` | Implementation or conclusion is active. |
| `completed` | Final pull-request CI passed and delivery closure was recorded. |

### Plan and execution ledger

| Artifact | Statuses |
| --- | --- |
| Plan | `pending`, `in_progress`, `completed`, `superseded` |
| Phase, task or coverage row | `pending`, `in_progress`, `completed` |

Failures do not create extra status values. The affected item remains `in_progress`, with
the finding and next action recorded in the Plan and Evaluation. `superseded` is reserved
for a revised Spec that replaces the Plan or switches to direct implementation.

### Evaluation

| Item | Values | Meaning |
| --- | --- | --- |
| Evaluation status | `in_progress`, `ready`, `completed` | Evidence is being gathered, accepted and ready for conclusion, or closed after PR CI. `ready` is not PRD closure and does not change a PRD Implemented checkbox. |
| Validation result | `passed`, `failed`, `blocked` | Sensor-backed result stored in Evaluation history, not Evaluation metadata. |

## End-to-end lifecycle

```mermaid
flowchart TD
    A["PRD, GitHub Issue, report or direct request"] --> B["create-spec authoring and integrity"]
    B --> SR["Applicable Spec Reviewer and verified corrections"]
    SR --> C{"Implementation route"}
    C -->|Small cohesive delivery| D["implement-spec: direct strategy"]
    C -->|Dependent or risky delivery| E["create-plan"]
    E --> F["implement-spec: Plan-backed strategy"]
    D --> IC["Complete integrated candidate"]
    F --> IC
    IC --> SIC["check:spec-implementation path gate"]
    SIC --> RT{"Plan-backed?"}
    RT -->|No| G["Integrated sensors and Playwright CLI evidence"]
    RT -->|Yes| R["One Implementation Reviewer and integrated sensors"]
    G --> H{"ready evidence"}
    R --> H
    H -->|No| I["Responsible Builder correction and refreshed evidence"]
    I --> C
    H -->|Yes| J["conclude-spec"]
    J --> K["commit-code and create-pr"]
    K --> L["PR CI Quality Gate"]
    L -->|Failure| M["Route to implementation or Spec amendment"]
    M --> J
    L -->|Pass| N["Spec, Plan and Evaluation completed"]
    N --> O["resolve-pr-feedback when later comments arrive"]
```

Within an active SDD task, transitions are owned by the Orchestrator. “Return to
`create-spec`” means temporarily invoking its clarification and amendment workflow against
the same Spec; it does not require the user to rerun a prompt manually or create another
task. The same rule applies to every route between conclusion, implementation and amendment:
the Orchestrator invokes the destination immediately and resumes the caller automatically.

## 1. Optional issue creation

When the product outcome itself is undefined, the Orchestrator routes through
[`create-prd`](./prompts/create-prd-prompt.md) before feature SDD begins. Once an
authoritative request or PRD exists, GitHub Issue creation is optional traceability.

[`create-feat-issue`](./prompts/create-feat-issue.md) turns a product request into a concise
GitHub Issue containing outcome, scope, acceptance criteria and references. Detailed
layer contracts belong in the Spec, not the Issue.

[`create-refactor-issue`](./prompts/create-refactor-issue-prompt.md) captures one
evidence-backed, behavior-preserving structural improvement. It routes defects and product
changes to their owning issue workflows, records the contracts that must remain stable and
requires proof of both the structural result and regression safety.

Before writing to GitHub, the workflow presents the exact title, body, labels and milestone.
It submits only after the user explicitly approves that draft. Issue approval does not
authorize implementation, commits or a pull request.

## 2. Spec creation

[`create-spec`](./prompts/create-spec-prompt.md) researches the repository and writes the
implementation Contract. Before authoring it must resolve every material product,
technical, design and validation ambiguity. Questions include repository evidence, a
recommendation, alternatives and impact. Facts already fixed by authoritative documents
are not delegated back to the user.

When a PRD is authoritative, the Spec derives its `RF-*` and `CA-*` contracts from the complete
mapped requirement: Outcome, Actors, applicable Consumes and Provides, Capabilities, conditional
Experience and relevant cross-requirement User Journeys. The PRD does not duplicate User Stories
or Acceptance Criteria, and its Product Dependency Graph is not implementation sequencing.

The Spec has five top-level sections:

| Section | Content |
| --- | --- |
| Context and scope | Objective, source, current product gap, boundaries, product alignment and accepted assumptions. |
| Implementation Contract | Observable `RF-*` requirements, `CA-*` Given/When/Then acceptance, cross-cutting restrictions and conditional Design Contract. |
| Technical Contract | Current technical state, runtime flow, application/layer contracts and consequential technical decisions. |
| Validation Contract | Automated boundaries, executable `MV-*` manual scenarios, commands and evidence targets. |
| Documentation alignment and revision history | Governing documents, exact Rule Pack and material Spec revisions. |

The Technical Contract maps exact paths and declarations under the affected project layers:
Domain, Use cases, Interfaces, Validation, REST, Provision, Database, Messaging and UI.
Composition wiring is recorded where needed without moving business responsibility out of
its owning layer. Reusable Zod schemas belong to Validation; their application consumers
remain in their respective boundary layers. Migration paths include the complete expected
SQL body.

REST-client examples are first-class implementation artifacts. Whenever a Spec adds or
changes an HTTP route group, its matching `apps/server/rest-client/<module>/<route-group>.rest`
file is part of the REST Contract and must appear as an exact allowed path with a `Create` or
`Modify` classification. The file must cover every route in that group with the current method,
path parameters, headers, representative request body and reusable variables. The Plan assigns
the file to the REST-owning Builder (or the Orchestrator when it is a shared generated or
coordination artifact), and Evaluation records the route/example parity check. A route group
is not implementation-complete while its REST-client file is missing, stale or untracked.

The Spec remains `draft` until its metadata, RF/CA traceability, technical map, design
bundle, manual scenarios, commands, links and Rule Pack pass Orchestrator integrity checks and
the applicable independent [`Spec Reviewer`](./agents/spec-reviewer-agent.md) findings are
verified and resolved. This review is part of `create-spec`, not a separate user-facing stage or
approval verdict. A valid Spec then moves directly to `open` and its author summary recommends:

- direct `implement-spec` for a small cohesive change with stable dependencies;
- `create-plan` followed by Plan-backed `implement-spec` for dependent phases, shared
  ownership, meaningful parallelism or migration, provider, concurrency, security, visual
  or recovery risk.

## 3. Design-backed Specs

For UI backed by Pencil or supplied screenshots, the Spec creator:

1. visually inspects every relevant reference and records its visible inventory;
2. asks about behavior implied by a screenshot but not established by the request or PRD;
3. identifies missing states or viewports and classifies supplemental screenshots as
   required or recommended;
4. saves one reference image per required frame/state in the feature-local `design/` folder;
5. creates `design/manifest.md` with exact node, state, viewport, implementation surface and
   validation mapping;
6. verifies every image exists, is valid and non-empty, has the declared dimensions or
   export scale, and was opened for visual inspection.

The Spec stays `draft` when a required reference cannot be saved or a screenshot-derived
product ambiguity remains unresolved.

Builders and the Orchestrator use the saved bundle. They do not use live Pencil during normal
implementation. Pencil is reopened only when the Design Contract changes or the user requests
a reference refresh.

## 4. Optional Plan creation

[`create-plan`](./prompts/create-plan-prompt.md) creates `plan.md` only when the open Spec
recommends Plan-backed execution. The Plan cannot redefine the Contract; an ambiguity routes back
to Spec amendment.

The Plan contains:

| Section | Purpose |
| --- | --- |
| Execution status | Current Spec revision, phase, active Builders, next action, blockers and shared ownership. |
| Execution ledger | Waves, stable ownership Builders, phases, tasks, dependencies, non-overlapping paths and sensor-backed exits. |
| Validation and handoff | Scheduled automated, runtime, manual and visual evidence. |
| Execution log | Conditional record of findings, failed attempts or material execution events. |

Builders never edit the Plan. The Orchestrator keeps it current throughout implementation.

## 5. Implementation and living evidence

Implementation always starts through [`implement-spec`](./prompts/implement-spec-prompt.md).
It selects direct execution when no current Plan exists and Plan-backed execution when a
current Plan references the Spec revision. The common workflow:

1. freeze the current Spec revision;
2. set the Spec to `in_progress`, and the Plan when present;
3. create or reconcile `evaluation.md` from the canonical
   [`evaluation.md` template](./templates/evaluation.md) with `status: in_progress`;
4. activate bounded direct or stable ownership Builders with RF/CA coverage, allowed paths,
   assigned phases, Rules, Architecture and design references;
5. inspect and integrate all Builder diffs and Orchestrator-owned artifacts, run
   `pnpm check:spec-implementation -- <exact-spec-path>` on the complete candidate, then run
   repository-approved integrated sensors; only after the package check passes, for Plan-backed
   execution activate one read-only Implementation Reviewer in parallel with those sensors;
6. verify applicable review findings and record exact results, findings and validation-artifact
   freshness in Evaluation;
7. resume the responsible Builder for corrections when possible and rerun only invalidated
   evidence until the Evaluation is ready.

The direct route activates `Builder Direct` in the current agent context. The Plan route derives
stable ownership Builders from affected application, package and module boundaries, reuses each
Builder across related phases and defaults to at most three concurrent implementation Builders.
It does not create agents linearly with phases, tasks or package count. Builders run in parallel
only when their contracts are stable and paths do not overlap. After integration, exactly one
Implementation Reviewer checks the complete candidate, including UI and server-backed surfaces when
affected; no per-Builder, per-phase, per-application, per-package or specialist Reviewers are
created. The Orchestrator coordinates root configuration, lockfiles, shared files, generated
artifacts, integration and the official evidence verdict.

Builder reports are not official evidence. The Orchestrator must verify the diff and sensor
results. Validation artifacts tied to an earlier affected diff are marked historical or stale
rather than silently reused; transient screenshots are regenerated under `test-results/` or
as CI artifacts instead of being committed under feature documentation.

The package check is one Orchestrator-owned structural gate on the complete integrated candidate,
not a Builder exit or Reviewer. It validates the Spec's `Create`, `Modify`, `Generate` and
`Remove` paths against disk and Git state. It runs before integrated sensors and the applicable
Reviewer, and again after any correction affecting a contracted path. Its exact command,
classification totals and result are recorded in Evaluation, but it is not semantic evidence and
cannot establish readiness by itself.

During normal delivery, `implement-spec` preserves every PRD Implemented checkbox exactly as
received; an approved material PRD amendment is the sole case in this workflow that changes an
affected checkbox, and it changes it only to unchecked. Reaching Evaluation `ready` establishes
only that the current implementation and evidence can proceed to conclusion; it neither closes
the PRD requirement nor marks it implemented.

The canonical [`evaluation.md` template](./templates/evaluation.md) fixes the table structure
and stable evidence IDs. An Evaluation records:

- Spec and Plan references, revision and status;
- acceptance matrix;
- automated and runtime command evidence;
- manual and visual evidence;
- Rule and documentation compliance;
- findings and their resolution;
- implementation and validation history;
- PR candidate and CI evidence during conclusion;
- chronological evaluation history.

## 6. Integrated validation

After the integrated implementation is current, the Orchestrator first runs
`pnpm check:spec-implementation -- <exact-spec-path>`. Only after it passes, Plan-backed execution
activates one read-only Implementation Reviewer while the Orchestrator runs the required Core,
Validation, Server, Web, database, coverage, build and Playwright CLI sensors. Every affected
Core, Server and Web workspace must pass its configured `test:coverage` floor; lowering a floor
to make a delivery pass is prohibited, and any result below a configured floor is a blocking
validation failure. Direct execution does not require a separate Reviewer
unless the Spec or another repository authority requires one. The Reviewer covers cross-Builder
contracts and, when UI is affected, inspects every final visual comparison and independently
replays high-risk Playwright CLI interactions. The Orchestrator compares every transient
implementation capture with its original saved reference at the exact viewport and state, records
each CA and MV result, inspects console, network and persisted-state evidence, and verifies every
affected REST-client example file against the current controller operations and shared request
schemas. REST-client parity is a separate artifact check and does not replace real HTTP integration
evidence.

On a failed sensor or material discrepancy, findings are recorded, the responsible Builder is
resumed when possible and affected evidence is invalidated. When a correction affects a
contracted path, mark the prior package-check row stale and rerun the package check first. Only
after it passes are affected sensors rerun and the same Implementation Reviewer resumed. A scoped
Builder Fix is activated only when the responsible Builder cannot be resumed or the correction is
genuinely independent. Reviewer reports are not evidence; the Orchestrator verifies and records
accepted findings. When all required evidence and applicable review results are current and no
verified blocking finding remains, Evaluation becomes `ready`; the Plan route also completes its
integrated phase and Plan before routing to conclusion.

## 7. Changes before conclusion

Every user-requested change after implementation starts is classified before code or
artifacts are changed:

| Classification | Meaning | SDD action |
| --- | --- | --- |
| Implementation correction | Existing implementation does not satisfy the current Spec, Design Contract or Rule. | Keep the Spec revision, record a finding, reopen affected work/evidence, resume the responsible Builder when possible and rerun the affected validation. |
| Contract change | Requested product behavior, design intent or technical boundary differs from the current Spec. | Set the Spec to `draft`, route through `create-spec`, update higher authority first when required, return every materially amended PRD `REQ-*` to unchecked, increment revision, refresh affected design/validation, reopen and reroute implementation. |

Earlier evidence and verdicts affected by a new Spec revision remain as historical records.
If the route changes from Plan to direct implementation, the Plan becomes `superseded`.

## 8. PR publication, CI and closure

[`conclude-spec`](./prompts/conclude-spec-prompt.md) starts only when the Spec is
`in_progress`, Evaluation is `ready`, the integrated implementation is validated and no blocking
finding remains. Conclusion does not edit code directly; when it finds an in-Contract
correction, it invokes the applicable implementation workflow, which creates the Builder and
refreshes validation before returning control to conclusion.

With user authorization to commit, push and publish, conclusion:

1. runs `pnpm check:spec-implementation -- <exact-spec-path>` on the complete delivery candidate,
   then runs the remaining required local preflight;
2. verifies generated artifacts, migrations, design evidence and documentation;
3. resolves every in-scope PRD requirement through `REQ-*`/`RF-*`/`CA-*` traceability, checks
   only fully delivered requirements as Implemented and leaves partial/deferred requirements
   unchecked;
4. uses `commit-code` for scoped commits, including required PRD checkbox changes;
5. invokes [`create-pr`](./prompts/create-pr-prompt.md) mandatorily whenever the delivery PR
   is missing, points at an earlier candidate SHA, or has stale/incomplete publication details;
   `conclude-spec` does not bypass this workflow with ad hoc PR edits;
6. records the branch and PR URL;
7. waits for every applicable checked-in GitHub Actions workflow on the current PR head SHA;
8. records workflow name, result, run URL and tested SHA in Evaluation.

Checkbox resolution happens after local closure preflight and before the delivery commit, PR
publication and final PR CI, so the checked PRD state is part of the exact tested candidate. A
verified product failure returns affected requirements to unchecked; partial/deferred delivery
stays unchecked. Transient infrastructure failures and evidence-only gaps that do not invalidate
verified product behavior preserve checkbox state.

Before staging a delivery commit, conclusion and `commit-code` audit the complete
candidate diff against the Spec scope. Pre-existing SDD, Rule, prompt or other
governance changes outside that scope are inherited changes: exclude them unless
the user explicitly authorizes their inclusion, and record the disposition in
Evaluation. A green sensor does not authorize unrelated files to ship.

SDD artifacts do not track a repository base, current or candidate commit. The SHA in the PR CI
table is limited to identifying the exact PR revision checked by GitHub and is not SDD status
metadata.

Local checks, a branch-push run, an earlier SHA or a missing expected workflow do not satisfy
the final PR CI gate. A CI implementation or Contract failure routes back to the appropriate
workflow; only a demonstrated transient infrastructure failure may rerun the same SHA.
Routing is not a terminal result: the Orchestrator immediately runs the correction or
amendment workflow, updates the same PR and resumes the CI gate. It must not report the
workflow as a next action or ask whether to fix an in-Contract failure. It pauses only for
missing authority, a required product or technical decision, an external blocker, or the
documented repeated-failure limit.

After applicable CI passes, conclusion sets Evaluation, Plan when present, and Spec to
`completed`. It does not create a closure-only commit solely for SDD ledger status changes;
any required implementation or product-documentation commit updates the same PR and its
resulting checks must pass. Conclusion does not merge or deploy unless the user explicitly
asks.

## 9. Pull-request feedback and reopening

[`resolve-pr-feedback`](./prompts/resolve-pr-feedback-prompt.md) may run later while the PR is
open. It classifies each actionable conversation:

| Feedback | Action |
| --- | --- |
| Explanation only | Reply with evidence; do not reopen SDD artifacts. |
| PR metadata correction | Update title, body, labels or traceability; do not reopen the Spec. |
| Implementation correction | Move the same completed Spec back to `open` without a revision increment, return affected PRD requirements to unchecked only when verified product evidence is invalidated, set Evaluation and affected Plan work to `in_progress`, implement/validate, then invoke conclusion again. |
| Contract change | Move the Spec to `draft`, return materially amended PRD requirements to unchecked, route through `create-spec`, increment the revision, reconcile Plan/Evaluation, implement/validate, then invoke conclusion again. |

The feedback workflow owns comment inspection, classification, replies and reopening. It
does not implement changes or own final CI. After merge, defects use the
bug-fix workflow and changed behavior uses a new change Spec.

## Workflow registry

| Workflow | Source |
| --- | --- |
| Define an unresolved product outcome | [`create-prd-prompt.md`](./prompts/create-prd-prompt.md) |
| Create an approved feature Issue | [`create-feat-issue.md`](./prompts/create-feat-issue.md) |
| Create an approved refactor Issue | [`create-refactor-issue-prompt.md`](./prompts/create-refactor-issue-prompt.md) |
| Create or amend a Spec | [`create-spec-prompt.md`](./prompts/create-spec-prompt.md) |
| Create an optional Plan | [`create-plan-prompt.md`](./prompts/create-plan-prompt.md) |
| Implement directly or through a Plan | [`implement-spec-prompt.md`](./prompts/implement-spec-prompt.md) |
| Publish, run PR CI and close | [`conclude-spec-prompt.md`](./prompts/conclude-spec-prompt.md) |
| Create or update the delivery PR | [`create-pr-prompt.md`](./prompts/create-pr-prompt.md) |
| Resolve later PR comments | [`resolve-pr-feedback-prompt.md`](./prompts/resolve-pr-feedback-prompt.md) |

The files under `documentation/prompts/` are canonical. `scripts/sync-commands.mjs`
synchronizes their generated command and skill representations.
