---
name: create-pr
description: Publish or update a Scoops delivery pull request with GitHub Issue and SDD traceability, current validation evidence, and saved design-reference coverage.
---

# Create or Update a Pull Request

Publish one coherent Scoops delivery through GitHub. Use authenticated `gh`, preserve the user's worktree
and update an existing delivery PR instead of creating a duplicate.

## Inputs and authority

Read the implemented Spec or Bug Report, `evaluation.md`, actual diff,
`documentation/sdd.md`, `documentation/tooling.md`, applicable Rules and
`documentation/rules/commit-rules.md`. For a feature delivery, confirm that the Evaluation
uses the Canonical Evaluation shape defined in `documentation/prompts/implement-spec-prompt.md`
and that its evidence is current for the exact Spec revision.
Preserve only actual GitHub Issue or direct-request traceability; do not invent external
records.

Require explicit authority to commit, push and create or update the PR. Standalone use may
invoke `commit-code` for pending scoped changes; when called by `conclude-spec`, reuse its
prepared commits.

## Pull request readiness policy

Every pull request opened or updated by this workflow must be ready for review, never draft.
Create PRs with `draft: false` (or the equivalent `gh` behavior), and if an existing delivery
PR is draft, run `gh pr ready <number>` before returning its publication metadata. Do not leave
a delivery PR in draft status unless the user explicitly changes this repository policy.

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

For a Spec delivery, the Spec and Evaluation are review artifacts and belong
in the PR. Include delivery-owned status, execution and evidence changes, including the final
closure update created by `conclude-spec`. Do not exclude them as operational or closure-only
documentation. Preserve and exclude unrelated user-owned changes.

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
5. Before calculating the publication diff or creating/updating the PR, merge the fetched
   `origin/main` into the delivery branch. The delivery branch must contain the current
   `main` history; do not submit a PR while it is behind `main`. Treat this merge as part of
   the publication and require the same explicit commit authority before creating its merge
   commit.
6. If the merge has only minor, unambiguous textual conflicts in delivery-owned files, resolve
   them automatically by preserving the intended delivery change and the current `main`
   behavior, then stage the resolutions, complete the merge, and review the resulting diff.
   Never guess when a conflict affects business behavior, authorization, migrations or other
   generated artifacts, unrelated user work, or the intended ownership of a change.
7. If conflicts are complex or ambiguous, stop before publishing and ask the user for guidance.
   Report each conflicted path, the competing changes, and the decision needed; do not abort or
   complete the merge, push, or create/update the PR until the user directs the resolution.
8. After the merge is complete, calculate and review the complete diff against the PR base.
9. If a delivery PR exists, update its head and body. Otherwise create one PR for the
   coherent delivery.

Do not use destructive Git operations, bypass hooks, create accidental dependent branches
or mix unrelated work. For composed deliveries, document every base and dependency and
validate the integrated diff. Do not create an intermediate branch merely to divide a diff;
separate PRs require real semantic boundaries and explicit dependency ordering.

## Validation evidence

Use the current Spec/evaluation evidence and run only additional repository-approved checks
needed to validate publication state. Integration-base merges invalidate only evidence whose
implementation, contract, dependency or environment assumptions changed; verify that impact
before reusing results or publishing. Never replace exact workspace commands from
`documentation/tooling.md` with assumed generic commands.

Before publication, verify that current evidence covers the Spec revision, observable behavior,
boundaries and acceptance criteria of the integrated diff. Reuse passing evidence when its
implementation, dependencies and environment assumptions remain valid; run only missing or
invalidated checks. The Spec need not inventory ordinary internal declarations or every changed
file. When it explicitly classifies artifact paths as `Create`, `Modify`, `Generate` or `Remove`,
require current structural-check evidence for those paths; otherwise record that checker as not
applicable. If validation fails, record the finding, invoke `implement-spec` for correction and
integrated verification, then resume publication automatically after Evaluation returns `ready`.
Do not repair implementation directly in the PR workflow.
When HTTP routes are affected, include the matching `.rest` files in that scope review and
confirm their route/example parity is recorded in Evaluation. Do not omit a REST-client file
from the delivery diff merely because it is manually executed or not compiled by the workspace.

Use `design/handoff.md` for new design bundles. If an existing feature bundle lacks
it, read its legacy `design/manifest.md` instead; preserve that legacy artifact and
do not create both files.

For design-backed UI, use the saved Spec design bundle—not live Pencil—and reuse the recorded independent
comparison for every supplied screenshot and every required supplemental screenshot:

- route/state and exact saved reference path or source node ID from `design/handoff.md`;
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
- reuse valid generation/verification evidence; run the repository-documented command
  only when that evidence is missing or invalidated, using its exact argument syntax;
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
- **Related issues** — real GitHub Issues and their relationship, or `None`. For every listed
  issue, use the GitHub closing keyword `Closes #<number>`; do not use `Refs #<number>` or
  another non-closing relationship when an issue is listed.
- **PRD and Spec traceability** — applicable PRD, fully/partially delivered `PRQ-*`
  requirements and their current Implemented-checkbox disposition, Spec revision
  and covered `FR-*`/`AC-*` criteria. Link to the Spec and Evaluation and report their actual
  current state; only `conclude-spec` changes PRD Implemented checkboxes after local preflight.
  Publication before its final CI and closure gate does not establish completion;
- **Implementation** — coherent frontend, backend, domain, persistence and test slices with
  the most relevant changed paths. Describe each affected layer concretely: name the
  contracts/use cases, schemas, migrations/models, routes/controllers, UI routes/widgets,
  generated artifacts and test/evidence surfaces that materially changed. Do not use a
  generic one-line inventory when the delivery crosses multiple layers;
- **Business-rule changes** — only when behavior, validation, authorization or workflow
  changed; state the previous behavior, new behavior, reason and evidence. Cover ownership,
  authorization/tenant scope, validation and invariants, persistence/side-effect boundaries,
  conflict or concurrency behavior, and explicit exclusions. If no business behavior
  changed, write `None — no behavior, validation, authorization or workflow change`;
- **Manual testing** — prerequisites, reproducible steps, expected result and error/recovery
  flows. Include environment/services and fixture prerequisites, then numbered user-visible
  scenarios covering the primary lifecycle, success persistence, authorization or tenant
  isolation, validation/conflict recovery, keyboard/accessibility and responsive behavior
  when applicable. Name the route or entry point, action, expected result and relevant retry,
  cancellation or failure outcome. Point to `evaluation.md` for exact commands and artifact
  identifiers;
- **Automated validation** — exact commands and observed results, including failures,
  limitations and omitted checks;
- **Known limitations** — explicit non-blocking gaps, or `None`.

When UI changes, summarize the visual validation result and link the detailed state/viewport
comparisons in `evaluation.md`; do not create a separate `Visual evidence` PR section.

Do not add a generic `Changelog`, `Impact and compatibility` or `Observations` section. Do not
invent Issue keys, Spec requirements, test results or human approvals. Before publishing,
review the three sections above for concrete layer ownership, business decisions and
reproducible manual coverage; if any is only a generic summary, expand it before returning
the PR metadata. Keep the body concise enough to review; it is a traceability and validation
summary, not a copy of the full diff.

Never include a Conventional Commit type or scope prefix in any PR title, including
`feat(scope):`, `fix:`, `docs:`, or `chore(scope):`. Use only a concise noun-phrase title
without a fabricated issue key; commit messages may still use Conventional Commit format.
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
