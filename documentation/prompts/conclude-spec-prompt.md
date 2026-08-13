---
name: conclude-spec
description: Close a feature Spec with final evidence, the CI Quality Gate, and the build, using a final Implementation Judge when necessary.
---

# Close a Spec

The Orchestrator conducts the closing in the current task. Do not create a new thread.

## Preconditions

- Spec is `in_progress`;
- direct implementation is accepted or all phases are accepted;
- no blocking task or finding remains pending;
- the corresponding Spec reflects the current diff.

## Final validation

1. Run `pnpm format` if changes still exist.
2. Run `pnpm lint`, `pnpm check-types`, and `pnpm test` for the integrated scope.
3. Run the architectural review documented in `documentation/rules/rules.md`
   when boundaries or dependencies change.
4. Run integration/e2e as declared by the Spec or otherwise applicable.
5. Classify all changes and discovered findings and confirm that each is recorded
   in the Spec, Plan, `evaluation.md`, or an appropriate Rule/Architecture/tooling document.
6. Update `evaluation.md` with the matrix of actual evidence, Judge verdicts,
   the Quality Gate/build result, and remaining findings.
7. Create `Judge Implementation Final` when there is a Plan, multiple phases,
   high risk, or a change after the last verdict.
8. Record in the Spec only the status, summarized verdict, evaluated commit,
   and link to `evaluation.md`.

For UI work with Pencil references, the final evidence must include a route-by-
route audit of every mapped page/state: Pencil node ID, target viewport,
Browser-use CDP result, screenshot or visual comparison, accessibility/DOM
inspection, and unresolved findings. Do not conclude the Spec while material
Pencil-to-browser differences remain. Manual UI validation must use Browser-use,
not Playwright; Playwright remains available for automated repository tests.

For a small Spec, `Judge Implementation Direct` may be the final verdict and no
second Judge is needed.

## Documentation and delivery

Check the PRD in Confluence, Rules, Architecture, modules, tooling, and the
overview against the facts. When authorized to update external sources, update
the PRD in Confluence and preserve every Jira key from the Spec/Plan. Do not
create or update milestones/GitHub Issues or change Jira ticket status without
explicit instruction.
Normative updates that change the product, Contract, global Rules, or
architectural boundaries require a user decision.

Create the commit and PR, request Codex Review, and wait for the Quality Gate
and build of the current `HEAD`. The Quality Gate repeats the official sensors;
the build is the final artifact validation in CI.

If the Quality Gate or build fails, keep the Spec `in_progress`, record the
failure in `evaluation.md`, create `Builder Fix QG-<n>` when the correction is
in scope, rerun invalidated sensors, and reevaluate if the diff changes.

Only after CI is green, blocking conversations are resolved, and the PR is
mergeable:

- fill in final evidence in `evaluation.md`;
- record documentation alignment;
- update the Spec to `completed` and point to `evaluation.md`;
- complete the Plan, when one exists.
