---
description: Prompt for creating release pull requests from develop to main via gh, using SemVer and release-ready notes.
---

# Prompt: Create Release PR

**Goal:** Standardize the creation of release Pull Requests (PRs) from `develop`
to `main`, ensuring that the version and release notes can be used by the
production deployment and GitHub Release workflows. The workflow relies
exclusively on the **GitHub CLI (gh)** for GitHub interactions.

---

## Input

- An optional target version in the `vX.Y.Z` format.
- The `develop` branch containing the changes approved for production.
- A clean and validated integration state ready to be reviewed for release.

If no target version is provided, infer the next version from the changes since
the latest release according to Semantic Versioning.

---

## Project Context

This is a pnpm + Turborepo monorepo:

- `apps/web` — TanStack Start + React frontend (Tailwind v4, shadcn/ui)
- `apps/server` — NestJS backend
- `packages/core` — shared domain (entities, errors, events) consumed by both apps

The project follows Gitflow:

- `main` — production
- `develop` — staging and integration
- `feature/*` — feature branches created from `develop`

Commits follow **Conventional Commits**, enforced by commitlint + husky. The
release PR must be opened directly from `develop` to `main`. After the PR is
manually merged, GitHub Actions:

- deploys the web application to production
- applies production database migrations and deploys the server
- creates the Git tag and GitHub Release from the PR title and body

---

## Execution Guidelines

### 1. Inspect the Repository State

Before creating the PR, collect the current repository and remote state:

```bash
git status --short
git branch --show-current
git fetch origin --prune --tags
git log --oneline origin/main..origin/develop
git diff --stat origin/main...origin/develop
```

Confirm that:

- `origin/develop` contains commits not present in `origin/main`
- the changes intended for production are already committed and pushed
- there are no unresolved conflicts between `develop` and `main`
- there is no open release PR from `develop` to `main`

Check for an existing PR with:

```bash
gh pr list --base main --head develop --state open \
  --json number,title,url
```

If an open PR already exists, do not create a duplicate. Return its URL and
explain the current state.

Do not commit pending local changes, create a release branch, or push unrelated
work as part of this task.

---

### 2. Analyze the Release Changes

Identify the latest published release and inspect all subsequent changes:

```bash
gh release list --exclude-drafts --limit 20 \
  --json tagName,publishedAt
git log --format='%h %s' <latest-tag>..origin/develop
git diff <latest-tag>...origin/develop
```

If the repository does not have a previous release, analyze the changes available
in `origin/develop` and treat the target as the initial release.

Classify the changes by affected workspace and impact:

- **web** — user interface and frontend behavior
- **server** — API, integrations, persistence, and migrations
- **core** — shared domain rules, entities, errors, and events
- **infrastructure** — Docker, Coolify, CI/CD, dependencies, and tooling

Capture:

- user-visible functionality
- relevant bug fixes
- technical or architectural changes
- database migrations and deployment requirements
- breaking changes and required consumer actions
- known risks, limitations, or follow-up work

Do not generate release notes from commit subjects alone. Cross-check the diff so
the description reflects the actual behavior delivered.

---

### 3. Define the Version

The version must follow Semantic Versioning and include the `v` prefix:

```text
vX.Y.Z
```

When a version is not explicitly provided, determine the increment from the
changes since the latest release:

- **major** — incompatible or breaking change
- **minor** — backward-compatible functionality (`feat`)
- **patch** — backward-compatible fix, performance, refactoring, documentation,
  tests, build, CI, or maintenance change

Use the highest-impact change found in the release. Examples:

```text
v1.4.2 + fix  -> v1.4.3
v1.4.2 + feat -> v1.5.0
v1.4.2 + breaking change -> v2.0.0
```

For the first release, use `v0.1.0` unless the user explicitly provides another
version.

Before proceeding, ensure the target tag and release do not already exist:

```bash
git rev-parse "<version>^{tag}"
gh release view <version>
```

If either command finds the version, stop and report the conflict instead of
reusing or deleting it.

---

### 4. Define the Title

The title must be:

- short and direct
- **in Brazilian Portuguese (PT-BR)**
- a noun phrase
- without a Conventional Commits or branch prefix
- inclusive of exactly one version in the `vX.Y.Z` format

Use this format:

```text
Publicação da versão vX.Y.Z
```

Do not use titles such as:

```text
release/v1.2.0
chore: release v1.2.0
Publicar nova versão
```

The version in the title becomes the Git tag after the PR is merged.

---

### 5. Define the Body

The PR body is also used as the GitHub Release description after merge. It must be
written in PT-BR, use Markdown, and contain meaningful release notes rather than a
raw list of commits or changed files.

Do not use a top-level `#` heading. Use the following template:

```markdown
## Objetivo

Explique o propósito da versão e o resultado entregue.

## Principais mudanças

### Web

- Mudanças relevantes do frontend.

### Server

- Mudanças relevantes da API e persistência.

### Core

- Mudanças relevantes do domínio compartilhado.

### Infraestrutura

- Mudanças relevantes de Docker, Coolify, CI/CD ou tooling.

Remova apenas as subseções que realmente não se aplicam.

## Correções

- Correções incluídas na versão.

Se não houver correções, informe `Nenhuma correção específica nesta versão.`

## Migrações e deploy

- Migrações de banco, novas variáveis de ambiente, ordem de execução ou cuidados
  necessários no deploy.

Se não houver ação adicional, informe `Nenhuma ação manual adicional.`

## Breaking changes

- Incompatibilidades e ações necessárias para adaptação.

Se não houver breaking changes, informe `Nenhum breaking change identificado.`

## Como validar

1. Passos objetivos para validar os comportamentos principais.
2. Comandos de validação executados e seus resultados.

## Issues relacionadas

resolve #123
```

Include `## Issues relacionadas` only when the issue numbers are known. Use only
the `resolve` keyword, never `close`, `closes`, `fix`, or `fixes`.

Avoid:

- speculative claims not supported by the diff
- secrets, credentials, internal URLs, or sensitive environment values
- implementation noise with no value to reviewers or release readers
- empty headings or placeholder text in the final body

---

### 6. Validate the Release Candidate

Run the repository checks before creating the PR:

```bash
pnpm install --frozen-lockfile
pnpm lint
pnpm check-types
pnpm test
pnpm build
```

Record which commands passed. If a command fails or cannot be executed, do not
hide the result. Explain the failure and do not create the PR unless the user
explicitly authorizes proceeding with the known risk.

Do not bypass hooks or checks.

---

### 7. Create the PR via gh CLI

⚠️ Do not use GitHub MCP or any MCP API. Use **gh** exclusively.

The PR must be created directly from `develop` to `main`:

```bash
gh pr create \
  --base main \
  --head develop \
  --title "Publicação da versão vX.Y.Z" \
  --body-file <release-body-file>
```

Rules:

- do not create a `release/*` branch
- do not merge the PR
- do not enable auto-merge
- do not create or push a tag
- do not create the GitHub Release manually
- do not trigger production deployment manually

The reviewer must merge the PR manually. The production CD and release workflows
will run only after the merge.

---

### 8. Verify and Return

After creation, inspect the final PR:

```bash
gh pr view --json number,url,title,body,baseRefName,headRefName,state
```

Confirm that:

- `baseRefName` is `main`
- `headRefName` is `develop`
- the title contains the intended version
- the body contains the release notes and no placeholders
- the PR remains open and has not been merged

Return:

- link to the created PR
- selected version and increment type (`major`, `minor`, or `patch`)
- final title
- concise summary of the release notes
- validation commands and results
- risks, skipped checks, or required manual actions
