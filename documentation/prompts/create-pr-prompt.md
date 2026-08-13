---
name: create-pr
description: Create HMS Pull Requests via gh, with Jira/Confluence traceability and a validation checklist.
---

# Create a PR

The Orchestrator prepares and publishes the Pull Request using only the GitHub
CLI (`gh`). Preserve traceability to the Spec, Confluence PRD, and Jira tickets;
do not turn those records into GitHub Issues or milestones.

## Input

- Implemented and validated Spec or Bug Report;
- work branch based on `main`;
- Confluence PRD link, when applicable;
- every `jira_tickets` key/URL, when applicable.

## Branch integration and topology

In this repository, `main` is the integration branch and is the equivalent of
the generic `develop` branch referenced by this workflow. Use `main` and
`origin/main` for branch, ancestry, migration, and diff operations.

Discover the real topology before creating or updating a PR. Do not assume that
similar branch names contain cumulative changes.

1. Refresh remote references without changing the user's worktree:

   ```bash
   git fetch origin main --prune
   gh pr list --state all --search "<Spec terms>"
   ```

2. For every related PR or branch, record base, head, SHA, state, and merge.
   Verify ancestry with `git merge-base --is-ancestor`; names and visual order
   do not prove that a change was incorporated.
3. Normally use a delivery branch based on `origin/main`. Do not create
   intermediate branches or accidental chains of dependent worktrees.
4. If several PRs are required, each must declare its base and dependencies.
   After acceptance, create or update an integration branch from the current
   `main`, explicitly incorporating every accepted head in dependency order.
   Compare the final PR with `origin/main` and include the complete accepted set.
5. If a delivery PR already exists, update its head instead of opening a duplicate.

Use a clean temporary worktree for integration when the main worktree is dirty.
Preserve user changes and copy only ignored local environment files; never copy
tracked `.env.example`. Do not use `reset --hard`, `checkout --`, or rebase to
erase work.

For UI changes based on Pencil, include route-by-route visual fidelity evidence
in the PR validation checklist: exact Pencil node ID, target viewport,
Browser-use CDP validation, screenshot or comparison, accessibility/DOM review,
and any resolved findings. Treat Pencil as the normative visual source and do
not describe a generic approximation as validated. Manual UI validation uses
Browser-use, not Playwright.

## Validation and analysis

Review the Spec, implementation changelog, actual modified paths, technical
impact, decisions, risks, and side effects. Identify original authors/codeowners
for each modified file using Git history. Read `documentation/github-flow.md`,
the commit rules, applicable Rules, and `documentation/prompts/commit-code-prompt.md`.
Consult Confluence/Jira when available without changing status or comments.

Run and record the project preflight:

```bash
pnpm lint
pnpm check-types
pnpm test
pnpm build
```

Use workspace filters when sufficient and record skipped, pre-existing, and
additional integration/e2e checks. For a composed delivery, validate the
integrated state and calculate the real diff against the PR base:

```bash
git diff --stat origin/main...HEAD
git diff --name-status origin/main...HEAD
```

Do not impose an artificial line limit or split a coherent PR only to bypass a
size check. If a policy check remains red, report it rather than bypassing it.

## Migrations and generated files

For database changes, compare migration numbers and `meta/_journal.json` across
`main` and accepted branches. Resolve numbering collisions explicitly and
update snapshots, journals, tests, and references. Never blindly choose `ours`
or `theirs`. Run migration generation/verification and relevant tests. Record
Docker/Testcontainers limitations instead of treating them as approval.

The PR body must follow `.github/pull_request_template.md`.

## Title

Use a short noun phrase without a Conventional Commit prefix or Jira key, for
example `Fix customer loading` or `Configure employee registration`.

## Pending commits

Inspect status and staged/unstaged diffs, preserve out-of-scope work, group by
semantic responsibility, and create atomic Conventional Commits using the
commit rules. Do not use `git add .`, `--no-verify`, `--amend`, rebase, or
destructive commands. Open the PR only when delivery files are clean.

## PR body

Use Markdown without a top-level heading and include:

### Goal

Explain the central purpose of the change.

### Change description

Explain why the PR exists, its main purpose, and the problems it solves.

### Affected modules and exact paths

List every modified or created path under its module (`apps/web`, `apps/server`,
`packages/core`, or `supabase`).

### Codeowner/author alignment

List the original author/codeowner of every modified file from Git history and
record alignment details.

### How to test

Give clear reviewer steps and relevant commands, such as `pnpm install`, the
web/server development commands, and workspace type checks.

### Related Jira tickets

List all known keys or URLs without GitHub closing keywords. If none exist,
write `No Jira ticket associated.` Do not create a ticket automatically.

### Confluence PRD

Include the page link when applicable and describe product discrepancies or
known limitations. Explicitly state when no PRD applies.

### Bug cause

For bug fixes, explain the evidence-based root cause and correction.

### Validation evidence

List the commands and browser/integration evidence actually executed. Do not
claim green checks, review, or deployment unless observed.
