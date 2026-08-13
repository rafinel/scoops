---
description: Prompt for creating release pull requests from develop to main via gh, using SemVer and release-ready notes.
---

# Prompt: Create a Release PR

**Goal:** Standardize release Pull Requests from `develop` to `main`. The
version and release notes must work with production deployment and GitHub
Release workflows. Use only the GitHub CLI (`gh`) for GitHub interactions.

## Input

- Optional target version in `vX.Y.Z` format.
- `develop` containing production-approved changes.
- Clean, validated integration state ready for review.

If no version is provided, infer the next Semantic Version from changes since
the latest release.

## Workflow

1. Inspect `git status --short`, the current branch, remote branches, and the
   commits/diff from `origin/main` to `origin/develop`. Confirm that the changes
   are committed and pushed, no conflicts exist, and no open release PR already
   exists. Do not commit pending local changes or create a release branch.
2. Inspect the latest published release and all subsequent changes. Cross-check
   the diff and capture user-visible features, fixes, architecture changes,
   migrations, breaking changes, risks, and deployment requirements.
3. Choose the highest-impact SemVer increment: major for breaking changes,
   minor for backward-compatible features, and patch for fixes, performance,
   refactoring, documentation, tests, build, CI, or maintenance. Use `v0.1.0`
   for a first release unless explicitly instructed otherwise. Stop if the tag
   or release already exists.
4. Run the project validation commands and record their actual results.
5. Create the PR directly from `develop` to `main` with the title and body below.

## Title

Use a short, direct noun phrase without a Conventional Commit or branch prefix:

```text
Release vX.Y.Z
```

The version becomes the Git tag after merge.

## Body

The body is also the GitHub Release description. Do not use a top-level `#`
heading, speculative claims, secrets, internal URLs, or empty sections.

```markdown
## Goal

Explain the purpose and delivered result of the version.

## Main changes

### Web
- Relevant frontend changes.

### Server
- Relevant API and persistence changes.

### Core
- Relevant shared-domain changes.

### Infrastructure
- Relevant Docker, Coolify, CI/CD, or tooling changes.

## Fixes

- Fixes included in the version, or `No specific fixes in this version.`

## Migrations and deployment

- Database migrations, environment variables, execution order, or deployment care.

## Breaking changes

- Incompatibilities and required adaptation, or `No breaking changes identified.`

## Validation

1. Objective steps for validating the main behaviors.
2. Validation commands actually executed and their results.

## Related issues

resolve #123
```

Include `## Related issues` only when issue numbers are known, and use only the
`resolve` keyword.
