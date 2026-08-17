---
name: create-pr
description: Publish or update a Scoops delivery pull request with GitHub Issue and SDD traceability, current validation evidence, and saved design-reference coverage.
---

# Create or Update a Pull Request

Publish one coherent Scoops delivery through GitHub. Use `gh`, preserve the user's worktree
and update an existing delivery PR instead of creating a duplicate.

## Inputs and authority

Read the implemented Spec or Bug Report, Plan when present, `evaluation.md`, actual diff,
`documentation/tooling.md`, applicable Rules and `documentation/rules/commit-rules.md`.
Preserve only actual GitHub Issue or direct-request traceability; do not invent external
records.

Require explicit authority to commit, push and create or update the PR. Standalone use may
invoke `commit-code` for pending scoped changes; when called by `conclude-spec`, reuse its
prepared commits.

## Branch and PR preparation

1. Inspect status and staged/unstaged changes. Preserve unrelated or user-owned work.
2. Fetch the real integration branch and inspect open and closed PRs for the delivery.
3. Verify base, head, SHA and ancestry; branch names do not prove incorporation.
4. Use `main`/`origin/main` as the integration base unless the repository state or user says
   otherwise.
5. Calculate and review the complete diff against the PR base.
6. If a delivery PR exists, update its head and body. Otherwise create one PR for the
   coherent delivery.

Do not use destructive Git operations, bypass hooks, create accidental dependent branches
or mix unrelated work. For composed deliveries, document every base and dependency and
validate the integrated diff.

## Validation evidence

Use the current Spec/evaluation evidence and run only additional repository-approved checks
needed to validate publication state. Never replace exact workspace commands from
`documentation/tooling.md` with assumed generic commands.

For design-backed UI, use the saved Spec design bundle—not live Pencil—and include:

- route/state and exact saved reference path or source node ID from `design/manifest.md`;
- target viewport;
- Playwright CLI manual result;
- implementation screenshot/comparison path;
- one direct comparison for each supplied and required supplemental reference, recording
  structure, content, hierarchy, spacing, dimensions, tokens, interaction/state and responsive
  differences;
- accessibility/DOM observations and resolved visual findings.

The visual evidence must enumerate every supplied screenshot and every required supplemental
screenshot suggested by the Spec creator or added to close a documented state/viewport gap. Each
entry must name the original reference, exact viewport/state, implementation capture and direct
comparison result, including missing, extra, altered or mismatched elements. Do not publish a
design-backed PR when a required reference lacks an independent comparison or when a required
supplemental screenshot decision remains unresolved.

Review migrations, generated artifacts and lockfile changes when affected. Do not claim a
check, manual flow, review or deployment that was not observed.

## PR contract

Use `.github/pull_request_template.md` when it exists. Otherwise include these sections:

- **Goal** — central delivery outcome;
- **Change description** — why the change exists and its coherent slices;
- **Affected modules and paths** — exact changed areas;
- **How to test** — applicable commands and manual/runtime steps;
- **Related issues** — GitHub closing syntax for real issues, or state that none exists;
- **Spec and Plan** — repository links and exact Spec revision;
- **Validation evidence** — automated, runtime, manual and visual results;
- **Known limitations** — explicit non-blocking gaps, or `None`.

Use a short noun-phrase title without a Conventional Commit prefix or fabricated issue key.
For a bug fix, include the evidence-based cause and correction.

## Publish and return

Push the prepared branch, create or update the PR, and add the exact comment
`@codex review` when it has not already been requested for the current delivery state.
Return the PR URL, number, base, head, head SHA, changed-path summary and current check/review
state. Do not merge or deploy.

Reviewer comments may arrive later. They are handled by `resolve-pr-feedback`, not by this
workflow.
