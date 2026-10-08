---
name: conclude-spec
description: Publish a validated Spec implementation, verify final PR CI, and close its evidence and delivery records.
---

# Conclude a Spec

`conclude-spec` owns publication, the final pull-request CI gate and delivery closure.
It consumes the integrated evidence established by `implement-spec`; it does not repeat
implementation or local validation merely because conclusion has started.

## Preconditions and authority

Read the current Spec, `evaluation.md`, `documentation/sdd.md`, applicable Rule Pack and
`documentation/tooling.md`. Require Spec `in_progress`, Evaluation `ready`, evidence for the
current Spec revision and integrated candidate, and no blocking finding or unfinished
acceptance criterion. Preserve actual GitHub Issue or direct-request traceability.

Require authority to commit, push and create or update the PR. Reuse authorization already
provided in the task. Complete local preparation before asking once for missing publication
authority; keep the Spec `in_progress` while awaiting it. Do not merge or deploy automatically.
Use authenticated `gh` for GitHub inspection and publication.

When creating or renaming a delivery branch, use `feat/<name>`, `fix/<name>` or `chore/<name>`
according to the change. Delivery PRs must be ready for review; verify `isDraft: false`.

## Local closure preflight

1. Compare the integrated candidate with the current Spec's observable behavior, boundaries,
   acceptance criteria and consequential technical decisions. Inspect the actual diff and
   existing automated, runtime, manual, visual and independent-review evidence. Evidence must
   name the candidate or affected diff and its assumptions; a check label alone is insufficient.
2. Reuse passing evidence when its implementation, contract, dependencies and environment
   assumptions remain valid. Run only missing or invalidated checks. Every affected Core,
   Server or Web workspace must have current passing `test:coverage` evidence at its configured
   floor; never lower a threshold to make closure pass. Apply the same freshness decision to
   generation, formatting, types, integration, architecture, build and Playwright CLI checks.
3. When the Spec explicitly classifies exact artifact paths as `Create`, `Modify`, `Generate`
   or `Remove`, require a current passing
   `pnpm check:spec-implementation -- <exact-spec-path>` result for those obligations. Reuse
   its result when the relevant paths and Git state remain valid; otherwise rerun it. When no
   such classified inventory exists, record the structural checker as not applicable. Do not
   invent an internal file inventory to satisfy the tool. This check never replaces semantic
   acceptance evidence.
4. Verify migrations, generated artifacts, saved design references and affected documentation.
   For every affected HTTP route group, verify its matching
   `apps/server/rest-client/<module>/<route-group>.rest` file is scoped and route-complete with
   current parameters, headers, representative bodies and reusable non-secret variables.
   For UI, require fresh inspected captures for the changed state/viewport and the applicable
   Playwright behavior, console, network, keyboard, accessibility and responsive evidence.
5. Inspect all changed documentation in status and staged/unstaged diffs. Include delivery-owned
   and required factual documentation in the normal commits, PR traceability and Evaluation;
   preserve unrelated user work and explicitly record exclusions. Spec and Evaluation are review
   artifacts even when their changes only record evidence or closure.
6. Map every in-scope `PRQ-*` through `FR-*` and `AC-*` to current evidence and classify it as
   fully delivered, partially delivered or deferred. Full delivery requires the complete current
   Outcome, Actors, applicable Consumes and Provides, Capabilities and conditional Experience,
   with all mapped obligations passing. After this local preflight passes, and before the
   delivery commit, publication or final PR CI, mark only fully delivered PRD requirements
   `- [x] **Implemented**`; partial and deferred requirements remain `- [ ] **Implemented**`.

Only conclusion marks a PRD requirement implemented. Evaluation `ready` is permission to
proceed with closure, not PRD delivery state.

When business rules or correctness-critical logic in eligible Core use cases changed,
require current mutation evidence for the Spec's scope and semantic pass conditions, including report paths and
dispositions for surviving, uncovered and equivalent mutants. Reuse valid evidence and run
only missing or invalidated checks. Successful Stryker execution, a dry run or an empty
selection cannot substitute for accepted mutation proof; execution errors and actionable gaps
remain correction work. Mutation targets are direct `src/**/use-cases/*-use-case.ts` files;
supporting Core code is consumed by tests but is not mutated. This requirement does not
introduce Web or Server mutation suites.

## Corrections and amendments

A missing or invalidated check is run once for the current candidate. If it fails, record a
finding and mark only dependent evidence stale. Set Evaluation `in_progress`, invoke
`implement-spec` for correction and integrated verification, then resume conclusion after it
returns `ready`. Keep the current Spec revision for an implementation correction.

A change to product behavior, design intent or a consequential technical boundary requires
Spec amendment: set the Spec `draft`, route through `create-spec`, update higher authority first
with the required approval, return materially amended PRD requirements to unchecked before the
revised Spec is authored, increment the revision and reconcile affected Evaluation evidence.
Continue implementation and conclusion in the same task after the amendment is resolved.

Uncheck a previously delivered PRD requirement only when verified product evidence shows it
is no longer delivered. Preserve its checkbox for transient infrastructure failures or an
evidence-only gap when the delivered behavior remains verified.

Do not stop with a routine fix listed as a suggested next action. Continue corrections until
passing. Pause only for a required authority decision, missing publication authority or an
external blocker that prevents meaningful progress, or the documented repeated-failure limit
from `implement-spec`. Diagnose repeated failures and change the approach before retrying.

## Publish the candidate

Use `commit-code` for intentional scoped commits, including authorized PRD checkbox changes and
all delivery-owned documentation. Then invoke `create-pr` to publish or update the same PR;
never create a duplicate or bypass its metadata/traceability workflow. Inspect publication's
resulting diff, base, head SHA and evidence freshness, especially after integration-base merges.
An integration change invalidates only the checks whose claims it affects. Route required
corrections through implementation before resuming publication.

Record the branch and PR URL in Evaluation when needed. Do not invent approvals or results.

## Final PR CI gate

After publication, wait for all applicable checked-in GitHub Actions workflows on the actual
current PR head SHA. Determine applicability from their real path filters, including Core CI,
Server CI and Web CI when their inputs changed. Record each applicable workflow/check name,
result, run URL and tested SHA in Evaluation; state why any workflow is inapplicable.

For applicable Core CI, include its separate `Mutation` job, which runs the full eligible
Core use-case scope with `--all` across all four CI shards and uploads HTML/JSON
reports even on failure. Verify
execution success and the hybrid score gate separately from the Spec's semantic
mutation acceptance. Require same-run target-branch and candidate reports: each
included module (Analytics, Communication, Identity, MRP and PDV) and each changed
or new eligible use-case source file in those modules must score at least 70%; every
unchanged eligible use-case file in those modules must preserve or improve its exact
target-branch score, without rounding or an allowed decrease. Billing's module and
per-file thresholds are temporarily suspended pending related test coverage. Missing,
invalid or incomplete reports, missing unchanged-file baselines and unscoreable
included modules fail closed. A file that is N/A on both revisions remains N/A; when
only one revision has a score, the candidate must meet 70%. Inspect relevant
CI report discrepancies and reconcile them with current local mutation evidence.

Pending, missing expected, cancelled or earlier-SHA checks are not passing evidence. A local
check or branch-push run does not satisfy this PR gate. Poll to terminal results without ending
the task while required checks are pending.

On failure, record the observed cause and keep the Spec `in_progress`. Invoke `implement-spec`
for an in-contract implementation or checked-in CI correction, or the amendment route for a
Contract change. After Evaluation returns `ready`, use `commit-code`, update the existing PR
with `create-pr`, and verify its new head. A same-SHA rerun is allowed only for a concretely
documented transient infrastructure failure; wait for its terminal result. Repeat until passing
or an actual authority/external blocker prevents progress.

## Evidence and documentation closure

Keep Evaluation concise and sufficient for resumption: current revision/status, AC results,
exact checks and outcomes, runtime/manual/visual evidence, independent review findings,
unresolved findings and unfinished criteria, and a short continuation handoff. Use its
canonical shape from `implement-spec`; do not add a task, phase or ownership ledger.

Before closure, verify PRD checkbox disposition against the same `PRQ-*`/`FR-*`/`AC-*` mapping.
Review material findings, including resolved failures, for reusable guidance. Record the
concrete finding separately from its lesson. Update the applicable PRD, Architecture, Modules,
Design, Tooling, Rule, SDD, prompt or agent authority when a factual clarification is warranted;
otherwise record a specific no-change disposition. New product, architecture, ownership or
global-policy decisions use the amendment/authority route. Do not turn every isolated typo,
transient failure or feature-local detail into a global rule.

Record each material finding's authority path, disposition (`Updated`, `No change` or
`Routed authority change`) and reason. Required factual updates belong in the scoped delivery.
An unresolved material finding or required authority change blocks closure. Synchronize changed
canonical prompts or agent definitions with the documented repository commands when applicable.

## Complete the delivery

After implementation-candidate PR CI passes and no blocking finding remains, set Evaluation and
Spec `completed`, preserve the full Spec contract and detailed evidence, and add a concise outcome
and Evaluation link. Use `commit-code` for the scoped closure documentation, then `create-pr`
to publish it to the same PR. Require every applicable live check to pass on this final head.

Record the implementation-candidate gate in Evaluation before the closure commit. Report the
final closure-head check results and URLs directly from GitHub; do not append those run IDs to
Evaluation and create an endless sequence of documentation commits. If a final-head failure
requires implementation correction, reopen the same Spec/Evaluation and repeat the correction,
publication and verification loop.

Later reviewer comments belong to `resolve-pr-feedback`. Do not wait indefinitely for comments.
Do not merge or deploy automatically.

## Conclusion summary

Return clickable Spec, Evaluation and PR links, revision/status, validation and AC/manual/visual
coverage, fully/partially delivered or deferred `PRQ-*` dispositions, the final PR head SHA and
applicable live CI results, material limitations and any excluded user work. Report factual
authority updates or justified no-change dispositions when relevant. Claim completion only after
the final published head passes its applicable checks.
