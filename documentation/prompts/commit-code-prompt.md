---
description: Prompt for creating atomic Conventional Commits from validated changes, with intentional staging and concise messages.
---

# Prompt: Create Commits

**Goal:** Standardize commit creation so each commit is atomic, reviewable, and
described by a concise Conventional Commit message. Preserve unrelated local work
and use Git explicitly so only intended changes are committed.

---

## Input

- Implemented changes in the working tree or staging area.
- Optional task, issue, Spec, or Bug Report that explains the intended change.
- Optional user instructions about commit grouping or message scope.

---

## Project Context

This is a pnpm + Turborepo monorepo:

- `apps/web` — TanStack Start + React frontend (Tailwind v4, shadcn/ui)
- `apps/server` — NestJS backend
- `packages/core` — shared domain (entities, errors, events) consumed by both apps

Commits follow **Conventional Commits**, enforced by commitlint + husky. Prefer
these scopes when they represent the affected workspace:

- `web`
- `server`
- `core`

Use another short, lowercase scope only when it adds meaningful context. Omit the
scope for genuinely cross-cutting repository changes.

---

## Execution Guidelines

### 1. Inspect the Repository State

Read the complete local state before staging or committing anything:

```bash
git status --short
git diff --stat
git diff
git diff --cached --stat
git diff --cached
git log -10 --format='%h %s'
```

Identify:

- tracked, untracked, and already staged changes
- which files belong to the requested task
- unrelated or pre-existing user changes
- generated files, lockfile changes, migrations, and configuration updates
- files that may contain secrets or machine-specific data

Do not assume every dirty file belongs to the same task. If ownership remains
ambiguous after inspecting the diff and task context, exclude the file and report
the ambiguity instead of committing it speculatively.

---

### 2. Protect Local Work

Preserve all changes that are outside the intended commit scope.

Rules:

- do not discard, reset, restore, checkout, or overwrite user changes
- do not use `git reset --hard`, `git checkout --`, or destructive equivalents
- do not stash changes unless the user explicitly requests it
- do not stage `.env` files, credentials, private keys, tokens, or local artifacts
- do not use `git add .` or `git add -A`
- do not amend, rebase, squash, or rewrite existing commits unless explicitly asked
- do not push commits unless explicitly requested

If files are already staged, verify that they belong to the requested scope before
creating the commit. Do not silently unstage changes owned by the user.

---

### 3. Plan Atomic Commits

Group changes by intent, not merely by directory or file type. Each commit must:

- represent one coherent behavior, fix, refactor, or infrastructure change
- remain understandable and reviewable in isolation
- include the tests that validate its behavior
- include a lockfile when it belongs to the dependency change
- include generated migration metadata when required by the migration
- avoid bundling unrelated cleanup or formatting

Prefer one commit when all changes are necessary for the same outcome. Split into
multiple commits when changes have independent purposes, can be reviewed
separately, or require different Conventional Commit types.

Before staging, define the proposed commit plan with:

- intended type and scope
- concise purpose
- exact files or hunks included
- validation relevant to that commit

Do not create artificial micro-commits that leave the repository in a broken or
misleading intermediate state.

---

### 4. Validate the Changes

Run the narrowest sufficient checks for the affected workspaces before committing.
Use the scripts documented by the project, for example:

```bash
pnpm lint
pnpm check-types
pnpm test
pnpm build
```

Use `--filter` when the change is limited to one workspace and the narrower check
provides adequate coverage:

```bash
pnpm --filter web lint
pnpm --filter web check-types
pnpm --filter web test

pnpm --filter server lint
pnpm --filter server check-types
pnpm --filter server test

pnpm --filter @hms/core lint
pnpm --filter @hms/core check-types
pnpm --filter @hms/core test
```

Record every command executed and its result. If a relevant check fails, diagnose
whether the failure belongs to the intended changes. Do not hide failures or
claim validation that was not performed.

---

### 5. Define the Commit Message

Use this format:

```text
<type>(<scope>): <subject>

<optional body>

<optional footer>
```

Allowed types:

- `feat` — new functionality
- `fix` — bug fix
- `refactor` — behavior-preserving code restructuring
- `perf` — performance improvement
- `docs` — documentation only
- `test` — test additions or corrections
- `style` — formatting without behavior changes
- `build` — dependencies or build system
- `ci` — CI/CD workflows and automation
- `chore` — repository maintenance not covered above
- `revert` — reversal of an earlier commit

Subject rules:

- use imperative mood: `add`, `fix`, `remove`, not `added`, `fixes`, `removing`
- start the subject in lowercase
- do not end with a period
- describe the intent rather than restating filenames
- aim for no more than 50 characters; never exceed the repository's 100-character
  commit header limit
- do not add emoji or AI attribution

Examples:

```text
feat(web): add appointment filters
fix(server): validate database URL at startup
test(core): cover HTTP status constants
ci: deploy staging from develop
docs: add release PR prompt
```

Use a body only when the reason is not obvious from the subject. A body is
mandatory for:

- breaking changes
- security fixes
- database or data migrations
- reverts

Wrap body lines at approximately 72 characters and explain why the change is
needed, its relevant tradeoffs, or migration requirements. Do not write filler
such as `This commit`, `I`, `we`, `now`, or a prose inventory of files.

Declare breaking changes explicitly:

```text
feat(core)!: rename person document field

BREAKING CHANGE: consumers must replace `documentId` with `taxId`.
```

Add issue references only when they are known and relevant:

```text
Refs #123
```

---

### 6. Stage Intentionally

Stage only the files planned for the current commit, using explicit paths:

```bash
git add -- <path-1> <path-2>
git diff --cached --stat
git diff --cached
git diff --cached --check
```

For a file containing changes from more than one intent, stage only the relevant
hunks. Reinspect the complete staged diff afterward.

Before committing, confirm that:

- every staged line belongs to the current commit purpose
- required tests, lockfiles, and migration metadata are included
- no secret or unrelated file is staged
- the staged diff has no whitespace errors
- the proposed message accurately describes the staged diff

If the staging area is empty, do not create an empty commit unless the user
explicitly requests one.

---

### 7. Create the Commit

Create the commit without bypassing repository hooks:

```bash
git commit -m "<type>(<scope>): <subject>"
```

When a body or footer is required, use additional message paragraphs:

```bash
git commit \
  -m "<type>(<scope>): <subject>" \
  -m "<body>" \
  -m "<footer>"
```

Rules:

- never use `--no-verify`
- never use `--amend` unless explicitly requested
- do not create an empty commit accidentally
- stop and report the hook output if commitlint or another hook rejects the commit
- do not weaken project rules to force a commit through

For multiple planned commits, repeat the inspection, staging, and commit steps for
each group. Do not assume that the remaining working tree still matches the
original plan after each commit.

---

### 8. Verify and Return

After each commit, inspect the result:

```bash
git show --stat --oneline --decorate HEAD
git status --short
```

Return:

- commit hash and final message for every commit created
- concise mapping of files or intent included in each commit
- validation commands and results
- remaining uncommitted or untracked changes
- skipped checks, known failures, or ambiguities
- confirmation that no push was performed, unless the user explicitly requested it
