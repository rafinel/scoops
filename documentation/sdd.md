# Specification-Driven Development

Scoops uses SDD for features and changes that need an explicit product or technical
contract. The Spec defines the required outcomes and their checkers. The agent
organizes implementation autonomously. Evaluation records actual progress,
findings and verified evidence through pull-request closure.

```text
Spec → autonomous implementation → integrated verification → conclusion
                                      ↑            ↓
                                      └── fixes ───┘
```

Behavior-preserving maintenance may use direct implementation when a feature
contract would add no useful authority or traceability. A discovered product or
consequential technical choice requires reconciliation before dependent work.

## Authority and context discovery

Before specifying or resuming a feature in a fresh context, read root and applicable
nested `AGENTS.md`, this workflow, [`modules.md`](./modules.md),
[`architecture.md`](./architecture.md), [`rules.md`](./rules.md) and its selected Rule
Pack, and [`tooling.md`](./tooling.md). Inspect actual manifests and affected code.
Read the complete affected module PRD and relevant Issue/report/direct request.
For UI, also read [`design.md`](./design.md) and the saved design references.

Reuse complete reads and repository facts already current in the same context.
Refresh affected sources when scope expands, authority changes or facts become
uncertain. Repository documentation governs the Spec; the Spec cannot silently
change product intent, module ownership, architecture or Rules to fit existing code.
Resolve missing product decisions with the user. Update higher authority first
when a change requires it, using authorization already given in the conversation;
material unresolved product, architecture, module or global Rule changes require
explicit approval. Routine reversible implementation decisions require no approval.

### PRD requirement contract

Each module PRD expresses a canonical `PRQ-*` requirement with these fields, in this order:

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
belongs to the Spec's `AC-*` contract. PRD User Journeys may cross several `PRQ-*` requirements
and must not become a duplicate requirement list.

A PRD Product Dependency Graph records only product-capability consumption: an edge from A to B
means B consumes a capability or authoritative fact provided by A. It does not define file or
technical dependencies, implementation priority, foundation work, execution phases, waves or
parallelism. The implementing agent derives execution dependencies from the Technical Contract and real
repository boundaries, never from the PRD graph.

New and materially amended requirements use an unchecked Implemented checkbox. A material PRD
amendment returns every affected `PRQ-*` to unchecked before the revised Spec is authored.
`create-prd`, `create-spec` and `implement-spec` never check a PRD requirement. Only
`conclude-spec` may check a fully delivered current requirement, after conclusion preflight and
before the delivery commit and final PR CI. Evaluation `ready` means implementation evidence can
enter conclusion; it is not PRD closure and does not authorize a checkbox change by
`implement-spec`.

### SDD identifier taxonomy

| Identifier | Meaning | Owner or use |
| --- | --- | --- |
| `PRQ-*` | Product Requirement | Module PRDs |
| `FR-*` | Functional Requirement | Spec Implementation Contract |
| `AC-*` | Acceptance Criterion | Spec acceptance and traceability |
| `MV-*` | Manual Validation | Executable user-visible validation scenario |
| `EV-*` | Evidence | Automated, runtime, manual-supporting or visual evidence; use a `Type` field for visual evidence |
| `FND-*` | Finding | Evaluation issue, discrepancy or correction record |
| `CI-*` | CI Quality Gate | Evaluation record for a checked-in PR workflow run |

`VIS-*` is not a separate namespace. Visual comparisons use `EV-*` with `Type = visual`.
Completed historical Specs and Evaluations may retain legacy identifiers for record stability;
new artifacts and active artifacts being revised use this taxonomy. Do not rewrite historical
evidence only to rename an identifier.

## Durable artifacts

```text
documentation/features/<domain>/<feature>/
├── spec.md                 # contracts and checkers
├── evaluation.md           # progress, evidence, findings and current handoff
└── design/                 # saved references when material
    ├── handoff.md
    └── <reference screenshots>.png
```

Use the [Spec](./templates/sdd/spec.md) and [Evaluation](./templates/sdd/evaluation.md)
templates. New behavior for an already concluded feature uses
`changes/<change-name>/` under that feature. Existing design bundles may retain
`design/manifest.md`; do not create a duplicate handoff solely to rename it.

There is no separate `plan.md` or `create-plan` step. Execution order, decomposition,
dependencies and delegation belong to the agent's working context. Existing Plans
are preserved under `history/legacy-execution.md` for audit and continuation.
Their task/phase statuses do not gate resumed work. Resume from the current Spec,
Evaluation and actual diff; consult the archived ledger for unique obligations or
unfinished work that has not yet been reconciled. Move any unique acceptance
obligation into the Spec and factual progress/evidence into Evaluation before
relying on the new handoff. Do not silently discard or weaken earlier obligations.

Implementation captures are transient validation artifacts under ignored
`test-results/` output or CI artifacts. Record state, viewport, comparison result
and path in Evaluation. Saved design references remain durable; do not create new
implementation evidence directories under feature documentation.

## Contract and checkers

The Spec has five sections: Context and scope, Implementation Contract, Technical
Contract, Validation Contract, and Documentation alignment and revision history.
It defines:

- the problem, selected `PRQ-*`, actors, scope, exclusions and accepted assumptions;
- observable `FR-*`, testable Given/When/Then `AC-*`, and traceability to product intent;
- module ownership, public interfaces, persistent invariants, runtime boundaries,
  migrations and consequential or difficult-to-reverse technical decisions;
- applicable saved design references, required states and viewports;
- concrete proof for every criterion: commands or test selectors, expected assertions,
  environment/fixtures, manual steps or visual comparisons and evidence limits;
- the exact Rule Pack and material contract revisions.

Specify constraints that affect correctness. Ordinary helper names, internal file
placement, widget decomposition, exhaustive declaration inventories, task lists
and execution waves belong to the implementer following repository conventions.
A Spec may name an existing boundary or a required artifact without prescribing
every future internal file. Migration semantics, atomicity, compatibility and data
preservation must be explicit; generated metadata stays generator-owned.

Every FR maps to product requirements and every AC to FR and concrete proof.
Enumerated states, bounds and transitions require explicit coverage; a sample proves
only that sample. Negative, recovery, authorization, concurrency and unusual outcomes
need automated coverage at repository-approved test boundaries. Manual scenarios
should be concise user-visible journeys, with required screenshots captured during
them. Additional manual checks need a concrete evidence gap or risk. Do not invent
product identifiers or weaken acceptance to make implementation pass.

HTTP route changes include route-complete examples in the owning
`apps/server/rest-client/<module>/<route-group>.rest` file. Record route/example
parity separately; it cannot prove real HTTP integration. A delivery is incomplete
while required examples or generated artifacts are missing, stale or untracked.

Changed business rules and correctness-critical logic in eligible Core use cases
require targeted Stryker mutation checks. Define their use-case scope, mapped ACs
and semantic pass conditions in the Validation Contract. Mutation targets are only
direct files matching `src/**/use-cases/*-use-case.ts`; supporting Core code is
consumed by tests but is not mutated. Web and Server retain their existing checks.
Follow Tooling for local changed-file selection or explicit use-case scope. Core CI
always executes every eligible Core use case with `--all` across all four CI
shards and publishes HTML/JSON reports, including on failure.
The integrated CI suite measures the PR candidate and target branch in the same
run and compares their merged reports. Each included Core module and each changed
or new eligible use-case source file in an included module must score at least 70%.
Each unchanged eligible use-case file in an included module must preserve or improve its exact target-branch score;
rounding and score decreases are not allowed. Billing is temporarily excluded until
related tests make its mutants scoreable; its module and per-file thresholds are
temporarily suspended. Missing, invalid or incomplete reports, missing unchanged-file
baselines and unscoreable included modules fail closed. A file that is N/A on both
revisions remains N/A; when only one revision has a score, the candidate must meet
70%. Passing that gate does not
replace a Spec’s semantic pass conditions or evidence-based dispositions of
surviving, uncovered and equivalent mutants.
Execution errors and actionable assertion gaps require correction, not a blanket
waiver or reduced scope. Keep mutation results in ordinary `EV-*` evidence rows
and findings in `FND-*`; do not introduce another identifier or artifact system.

`pnpm check:spec-implementation -- <spec-path>` remains available for legacy or
new Specs that explicitly classify exact required artifact paths as `Create`,
`Modify`, `Generate` or `Remove`. It proves only those declared artifacts, not
behavior or exhaustive scope. Do not add an internal path inventory merely to
satisfy this tool. If applicable, run it on the integrated candidate and repeat
only after changes that invalidate its structural claims. Specs without those
declarations use their contracted checkers and a scoped diff/artifact inspection.

## Roles and lifecycle

The Orchestrator owns Spec/Evaluation state, shared decisions, integration and the
official evidence verdict. It implements coherent scopes directly or delegates
independent work to bounded [Builders](./agents/builder-agent.md), as `AGENTS.md`
requires. Builders own disjoint code/test scopes and report results without
changing acceptance obligations or governing artifacts. Reuse Builders for related
corrections where possible. Only the Orchestrator creates subagents.

A [Spec Reviewer](./agents/spec-reviewer-agent.md) independently checks architecture,
module and Rule compatibility before the draft becomes `open`; repeat that review
only for material contract amendments. One independent
[Implementation Reviewer](./agents/implementation-reviewer-agent.md) assesses the
integrated implementation and proof coverage. For design-backed UI, run the
[Visual Reviewer](./agents/visual-reviewer-agent.md) in parallel on the same candidate
using current required captures. Reviewers do not edit files, decide official
readiness or automatically rerun integration suites. Findings need concrete evidence
and a mapped correction; the Orchestrator verifies them.

| Artifact | Status | Meaning |
| --- | --- | --- |
| Spec | `draft` | Contract being authored or materially amended. |
| Spec | `open` | Authoring integrity and compatibility review passed. |
| Spec | `in_progress` | Implementation or conclusion active. |
| Spec | `completed` | Final PR CI passed and closure recorded. |
| Evaluation | `in_progress` | Progress and evidence being gathered or corrected. |
| Evaluation | `ready` | All required proof accepted; ready for conclusion, not PRD closure. |
| Evaluation | `completed` | Final PR CI and delivery closure recorded. |

Executed validation outcomes are `passed`, `failed` or `blocked`. Evidence lifecycle
may also use `pending`, `stale` or `not_applicable`; an authorized visual difference
is recorded explicitly. Findings and incomplete criteria describe failures; do not
invent phase statuses. Existing historical identifiers, revisions and facts remain stable.

## Implementation and verification

1. Establish or resume the current contract and reconcile Git status/diff with
   Evaluation. Create its acceptance matrix and concise handoff before editing.
   Inspect prerequisites without automatically launching baseline integration suites.
2. Implement within the contract. Organize dependencies and bounded delegation
   directly; use focused unit/component and static checks for early feedback.
   Record material findings and meaningful checkpoints, not every edit.
3. Integrate all implementation scopes and generated artifacts. Perform any
   already-authorized delivery-branch synchronization before final verification.
4. Run applicable static, architecture, type, build and coverage gates and each
   applicable server/browser/job integration suite against the integrated candidate.
   Run broad integration suites once at this point. Fix failures and rerun failed
   and affected checks until every applicable suite passes. Preserve configured
   coverage floors; required unavailable infrastructure is a recorded blocker.
   A zero-test selection, skipped suite or bare exit code is not proof of acceptance.
   Run contracted Core mutation checks and assess their reports against the Spec's
   pass conditions; retain valid unaffected mutation evidence after corrections.
5. Execute the required manual journeys with the Playwright CLI and required
   services/seeded accounts. Capture and inspect fresh UI screenshots at relevant
   desktop/narrow states and keyboard paths, checking console, network, URL and
   persisted state. Follow `AGENTS.md` service/account safety and cleanup.
   Mocked transport cannot prove real authentication, persistence or server-backed
   behavior. Record whether errors are fixed, pre-existing or blocking.
6. Run independent code and required visual review in parallel using this candidate,
   checker results and captures. Review assertion coverage and evidence limits;
   do not automatically launch another integration run for review.
7. Fix in-contract findings autonomously. Refresh only invalidated checks/captures
   and comparisons; preserve passed evidence for unaffected behavior. Material
   contract changes route through amendment before dependent implementation.
8. When all applicable criteria/checkers have accepted current evidence and no
   verified blocker remains, set Evaluation `ready` and proceed to conclusion.

Later implementation, fixture, configuration or source-contract changes reopen
proof whose claims/dependencies they affect. Record the changed scope and retained
evidence. A new role, status update, ledger edit or commit hash alone does not
invalidate unchanged proof. Additional broad reruns require a concrete integration
risk, affected shared dependency or discovered coverage gap. This reuse policy
covers local evidence; required GitHub checks still run on the actual PR head.

## Evaluation and continuation

Keep one acceptance/evidence matrix, findings and a small factual handoff in
`evaluation.md`. Record actual checker commands/results, test counts/assertions,
environment/fixtures, covered AC/MV IDs, evidence paths and limitations. Identify
the validated candidate by branch and diff/checkpoint details, with a commit when
useful for evidence freshness; this is proof provenance, not a new status gate.
Preserve failed attempts and historical evidence without reporting them as current.

The handoff names the Spec revision, branch/candidate, completed and unfinished
criteria, interrupted or uncommitted work, latest checker results, blockers and
next concrete action. A continuing agent reconciles this with Git and the diff
before choosing execution order. Evaluation describes actual state; it must not
become a replacement task/phase Plan.

## Amendments and feedback

An implementation correction keeps the Spec revision, reopens Evaluation and
refreshes affected proof. A changed product, design or consequential technical
contract returns the Spec to `draft`, reconciles governing authority first,
increments its revision and refreshes affected design/checkers. Materially amended
PRD requirements return to unchecked before revised Spec authoring. Routine internal
implementation choices within the contract do not require amendments.

While a PR remains open, `resolve-pr-feedback` owns comment inspection,
classification, replies and reopening. Explanation or metadata-only feedback does
not reopen the contract. Implementation corrections reopen the same completed Spec
as `open` and Evaluation as `in_progress` without a revision increment. Return PRD
requirements to unchecked only when verified product evidence is invalidated.
Contract changes use amendment. Continue implementation and conclusion rather
than ending with a proposed correction. After merge, defects use the bug workflow
and changed product behavior uses a new change Spec.

## Publication, CI and closure

`conclude-spec` requires Spec `in_progress`, Evaluation `ready`, current accepted
evidence and no verified blocker. Reconcile source authority, generated artifacts,
migrations, saved design coverage, REST parity and scope. Reuse valid local checks;
run missing or invalidated proof. Corrections immediately re-enter implementation
and conclusion, subject to documented external blockers and bounded retry limits.

With authorization to commit, push and publish:

1. resolve every selected `PRQ-*` through FR/AC to evidence; check only fully
   delivered current requirements as Implemented after local closure preflight
   and before the delivery commit; partial/deferred requirements remain unchecked;
2. use `commit-code` for scoped commits, including delivery-owned Spec/Evaluation
   and required PRD changes; exclude inherited unrelated governance or user work
   unless explicitly authorized, recording its disposition;
3. invoke `create-pr` when the delivery PR is missing or its publication details
   are stale; update the same PR and record its URL;
4. require every applicable checked-in GitHub Actions workflow to pass on the
   current PR head, recording workflow/result/run URL/tested SHA in Evaluation;
5. after candidate CI passes, set Spec/Evaluation `completed` and commit scoped
   closure artifacts to that PR; verify applicable live checks on the closure head.

A local pass, earlier SHA or missing expected workflow does not satisfy final PR CI.
Record the CI that authorized closure before the closure commit; report live
closure-head results without writing them back into Evaluation and creating another
untested head. Product failures return affected PRD requirements to unchecked;
transient infrastructure failures preserve verified product disposition. Explicit
waivers are recorded honestly and never reported as passed proof. Do not merge
or deploy without an explicit request.

## Workflow registry

| Workflow | Canonical source |
| --- | --- |
| Define product intent | [create-prd](./prompts/create-prd-prompt.md) |
| Create feature Issue | [create-feat-issue](./prompts/create-feat-issue.md) |
| Create refactor Issue | [create-refactor-issue](./prompts/create-refactor-issue-prompt.md) |
| Create or amend Spec | [create-spec](./prompts/create-spec-prompt.md) |
| Implement and verify | [implement-spec](./prompts/implement-spec-prompt.md) |
| Increase existing-behavior coverage | [increase-test-coverage](./prompts/increase-test-coverage-prompt.md) |
| Publish and conclude | [conclude-spec](./prompts/conclude-spec-prompt.md) |
| Create or update delivery PR | [create-pr](./prompts/create-pr-prompt.md) |
| Resolve PR feedback | [resolve-pr-feedback](./prompts/resolve-pr-feedback-prompt.md) |

Prompts and agent contracts inherit this workflow. `pnpm sync:commands` and
`pnpm sync:agents` regenerate their installed representations. Historical records
preserve original facts; resumed delivery applies the current execution and local
evidence-reuse policy without lowering acceptance or checker coverage.
