---
name: create-pr
description: Publish or update a Scoops delivery pull request with GitHub Issue and SDD traceability, current validation evidence, and saved design-reference coverage.
---

# Create or Update a Pull Request

Publish one coherent Scoops delivery through GitHub. Use `gh`, preserve the user's worktree
and update an existing delivery PR instead of creating a duplicate.

## Inputs and authority

Read the implemented Spec or Bug Report, Plan when present, `evaluation.md`, actual diff,
`documentation/sdd-rules.md`, `documentation/tooling.md`, applicable Rules and
`documentation/rules/commit-rules.md`. For a feature delivery, confirm that the Evaluation
uses the canonical `documentation/templates/evaluation.md` structure and that its evidence is
current for the exact Spec revision.
Preserve only actual GitHub Issue or direct-request traceability; do not invent external
records.

Require explicit authority to commit, push and create or update the PR. Standalone use may
invoke `commit-code` for pending scoped changes; when called by `conclude-spec`, reuse its
prepared commits.

## Mandatory workflow invocation

This prompt is a publication workflow, not a replacement for the commit or conclusion
workflows. When pending implementation changes require a commit, invoke `commit-code`
before publishing. After the commit is created, **invoke `create-pr` again** (including when
the current prompt is being resumed by `conclude-spec`) so the PR metadata, body, head SHA
and traceability are refreshed through this workflow. Do not create commits or edit PR
metadata ad hoc while claiming that `commit-code` or `create-pr` was invoked.

When `conclude-spec` calls this prompt, return the exact PR number, URL, base, head SHA and
check URLs to `conclude-spec`; do not return while publication is only partially complete.

## Delivery inspection

Before publication, inspect the complete worktree and delivery history:

```bash
git status --short
git diff --stat
git diff
git diff --cached --stat
git diff --cached
git log -10 --format='%h %s'
```

Identify staged, unstaged and untracked files; generated artifacts, migrations, seeds and
configuration; affected workspaces; unrelated user-owned changes; and secrets or local data
that must not enter the PR. Keep unrelated changes in place and out of commits. If the
relationship between a file and the delivery is ambiguous, stop and report it instead of
including the file speculatively.

## Branch and PR preparation

1. Inspect status and staged/unstaged changes. Preserve unrelated or user-owned work.
2. Fetch the real integration branch without changing the worktree and inspect open and closed
   PRs for the delivery, for example:

   ```bash
   git fetch origin main --prune
   gh pr list --state all --search "<Spec or Issue terms>"
   ```

3. Verify base, head, SHA and ancestry; branch names do not prove incorporation.
4. Use `main`/`origin/main` as the integration base unless the repository state or user says
   otherwise.
5. Calculate and review the complete diff against the PR base.
6. If a delivery PR exists, update its head and body. Otherwise create one PR for the
   coherent delivery.

Do not use destructive Git operations, bypass hooks, create accidental dependent branches
or mix unrelated work. For composed deliveries, document every base and dependency and
validate the integrated diff. Do not create an intermediate branch merely to divide a diff;
separate PRs require real semantic boundaries and explicit dependency ordering.

## Validation evidence

Use the current Spec/evaluation evidence and run only additional repository-approved checks
needed to validate publication state. Never replace exact workspace commands from
`documentation/tooling.md` with assumed generic commands.

Before publication, verify the current candidate passes the `implement-spec` conformance gate:
the exact Spec revision is frozen, every changed path is within the recorded Builder scope, the
required file/widget tree and contracts match, and no affected evidence is stale. If any check
fails, stop publication and route the correction through `implement-spec`; do not repair the
implementation directly in the PR workflow.

For design-backed UI, use the saved Spec design bundle—not live Pencil—and include an independent
comparison for every supplied screenshot and every required supplemental screenshot:

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
entry must name the original reference, exact viewport/state, transient implementation capture
or CI artifact identifier and direct comparison result, including missing, extra, altered or
mismatched elements. Do not publish a
design-backed PR when a required reference lacks an independent comparison or when a required
supplemental screenshot decision remains unresolved.

Review migrations, generated artifacts and lockfile changes when affected. Do not claim a
check, manual flow, review or deployment that was not observed. For server-backed or database
changes, verify the real request/response and relevant persistence, authorization, tenant or
provider result; mocked transport is not proof of server behavior. Record environment limits,
failed attempts and omitted commands in `evaluation.md` without converting them into passing
evidence.

## Generated artifacts and migrations

When the delivery changes persistence or generated output:

- compare migration files, snapshots and journals with `origin/main`;
- resolve migration-number collisions explicitly and preserve prior journal entries;
- run the repository-documented generation or verification command once, using its exact
  argument syntax;
- review the generated SQL and metadata against the Spec before publication;
- verify seeds, generated routes, lockfiles and other derived files are current and included
  only when required by the delivery.

Never hand-edit generated artifacts to conceal a mismatch, and never treat a failed generation
attempt or unavailable Docker/Testcontainers environment as a passing check.

For every implementation or visual discrepancy found during PR preparation, immediately record
the finding, invalidate its dependent evidence, invoke `implement-spec`, and continue the
current delivery automatically after the correction returns Evaluation to `ready`. Do not ask
the user whether an in-Contract discrepancy should be fixed.

## PR contract

Include these sections in this order:

- **Objective** — problem, expected outcome, scope and explicit exclusions;
- **Related issues** — real GitHub Issues and their relationship, or `None` (use closing
  keywords only when closure is intended);
- **PRD and Spec traceability** — applicable PRD, Spec, Plan, exact revision and covered
  `RF-*`/`CA-*` criteria;
- **Implementation** — coherent frontend, backend, domain, persistence and test slices with
  the most relevant changed paths;
- **Business-rule changes** — only when behavior, validation, authorization or workflow
  changed; state the previous behavior, new behavior, reason and evidence;
- **Manual testing** — prerequisites, reproducible steps, expected result and error/recovery
  flows;
- **Automated validation** — exact commands and observed results, including failures,
  limitations and omitted checks;
- **Known limitations** — explicit non-blocking gaps, or `None`.

When UI changes, summarize the visual validation result and link the detailed state/viewport
comparisons in `evaluation.md`; do not create a separate `Visual evidence` PR section.

Do not add a generic `Changelog`, `Impact and compatibility` or `Observations` section. Do not
invent Issue keys, Spec requirements, test results or human approvals. Keep the body concise
enough to review; it is a traceability and validation summary, not a copy of the full diff.

Use a short noun-phrase title without a Conventional Commit prefix or fabricated issue key.
For a bug fix, include the evidence-based cause and correction.

## Publish and return

Push the prepared branch, create or update the PR, and add the exact comment
`@codex review` when it has not already been requested for the current delivery state.
Then obtain the actual delivery metadata:

```bash
gh pr view <number> --json number,url,headRefName,baseRefName,commits,statusCheckRollup
```

Return the PR URL, number, base, head, head SHA, changed-path summary and current check/review
state. Do not merge or deploy.

Reviewer comments may arrive later. They are handled by `resolve-pr-feedback`, not by this
workflow.
