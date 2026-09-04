---
description: Developer tooling used in the Scoops monorepo for installation, local development, validation, testing, database work, messaging, and local infrastructure.
---

# Tooling

This document describes how to install, run, validate, and test the Scoops
monorepo. For application architecture and runtime technology choices, see
[`architecture.md`](architecture.md).

## Requirements

- **Node.js** `>= 20.0.0`, as declared by the root `package.json` and required by Vitest 4.
- **pnpm** `9.0.0`, pinned through the root `packageManager` field.
- **Docker Engine with Docker Compose** for the local PostgreSQL, Mailpit,
  MinIO, and Inngest services.

Enable Corepack so the repository's pnpm version is selected automatically:

```bash
corepack enable
pnpm install
```

## Monorepo layout

The repository is a pnpm workspace configured by `pnpm-workspace.yaml`:

```text
apps/
├── server/       NestJS backend
└── web/          TanStack Start frontend

packages/
├── core/         Shared domain entities, events, contracts, and use cases
├── validation/   Shared Zod schemas for application boundaries
└── email/        Communication-owned React Email templates and renderers
```

Run a command in one workspace with `--filter`:

```bash
pnpm --filter web dev
pnpm --filter server dev
pnpm --filter @scoops/core check:types
pnpm --filter @scoops/validation check:types
```

## Package management with pnpm

Install all workspace dependencies from the repository root:

```bash
pnpm install
```

Add a dependency to one application:

```bash
pnpm --filter web add <package>
pnpm --filter server add <package>
```

Add the local core package to an application with the workspace protocol:

```bash
pnpm --filter server add @scoops/core@workspace:*
```

Add the shared Validation package only to a workspace that consumes its schemas:

```bash
pnpm --filter web add @scoops/validation@workspace:*
pnpm --filter server add @scoops/validation@workspace:*
```

Commit `pnpm-lock.yaml` whenever dependency declarations change. Use pnpm for
workspace installation and dependency updates; do not generate a new npm lockfile
for workspace changes.

## Environment setup

The repository provides separate templates for Docker Compose and both runnable
applications:

```bash
cp .env.example .env
cp apps/server/.env.example apps/server/.env
cp apps/web/.env.example apps/web/.env
```

The root `.env` configures Docker Compose. The server `.env` configures NestJS,
PostgreSQL, Better Auth, trusted origins, cookie scope, email delivery, local
service URLs, and Inngest. The web `.env` contains browser-safe Vite variables;
only variables prefixed with `VITE_` are exposed to browser code.

Local email uses SMTP through Mailpit. Staging and production use Resend through
server-only `RESEND_API_KEY` and sender configuration. Better Auth secrets,
Resend keys, SMTP credentials, database URLs, and real production credentials
must never be committed or exposed through `VITE_` variables.

## Task orchestration with Turborepo

Turborepo is configured in `turbo.json`. The functional root orchestration
commands are:

| Root command | Behavior |
| --- | --- |
| `pnpm build` | Runs each workspace `build` task and builds dependencies first. |
| `pnpm dev` | Runs persistent development tasks without caching. |
| `pnpm format` | Formats the complete repository with Biome. |

The repository currently names workspace validation scripts `check:code` and
`check:types`, while the root Turbo tasks are named `lint` and `check-types`.
Until those names are aligned, run validation through the workspace commands
documented below instead of assuming `pnpm lint` or `pnpm check-types` validates
every workspace.

## TypeScript

Each workspace owns its TypeScript configuration and version:

- `apps/web` uses bundler resolution, JSX, the `@/*` source alias, and strict
  no-emit checks.
- `apps/server` uses NodeNext resolution, NestJS decorators, the `@/*` source
  alias, and emits its build to `apps/server/dist`.
- `packages/core` uses bundler resolution, no emit, package subpath exports, and
  internal aliases such as `#identity/*`, `#billing/*`, and `#shared/*`.
- `packages/validation` uses bundler resolution, no emit, a root package export,
  and source-backed ESM imports with explicit `.ts` extensions internally.
- `packages/email` uses NodeNext resolution, JSX, strict no-emit checks, and
  the public `@scoops/email/templates` export.

Run type checks independently:

```bash
pnpm --filter web check:types
pnpm --filter server check:types
pnpm --filter @scoops/core check:types
pnpm --filter @scoops/validation check:types
pnpm --filter @scoops/email check:types
```

## Linting and formatting with Biome

Biome is configured centrally in `biome.json`.

- Formatting uses two spaces, a line width of 90, single quotes, JSX single
  quotes, and semicolons only as needed.
- The CSS parser recognizes Tailwind directives.
- Generated route metadata, build output, and local infrastructure volumes are
  excluded from formatting or linting as appropriate.
- Import organization is disabled so repository import grouping remains
  intentional and follows
  [`rules/code-conventions-rules.md`](rules/code-conventions-rules.md).

Format the repository:

```bash
pnpm format
```

Check each workspace's source:

```bash
pnpm --filter web check:code
pnpm --filter server check:code
pnpm --filter @scoops/core check:code
pnpm --filter @scoops/validation check:code
```

## Architecture boundaries

Each workspace exposes a `check:architecture` command backed by Dependency Cruiser. Its
shared `.dependency-cruiser.mjs` policy parses TypeScript dependencies and enforces the
dependency direction documented in
[`architecture.md`](architecture.md): Core remains framework-independent, Validation
depends only on Zod and Core structures, Web cannot import authoritative server or
use-case implementation, and Server shared/module boundaries remain explicit.

Run every architecture check from the repository root:

```bash
pnpm check:architecture
```

The repository also enforces test ownership through an explicit allowlist in
`test-integrity.config.mjs`. Only sources classified as `required` or `allowed`
may own direct tests. Sources classified as `indirect`—for example the Inngest
broker, repositories, database adapters, REST services, and query/action hooks—
must be tested through their consumers and cannot have corresponding test files.
Web UI direct tests are limited to widget folders under `apps/web/src/ui/**/widgets`;
context, storage, query/action-hook, and provider tests are not direct-test
boundaries. Browser tests outside widget source folders are limited to the
explicit route and health smoke-test patterns in the same policy.

Run the check from the repository root:

```bash
pnpm check:test-integrity
```

Run one boundary independently:

```bash
pnpm --filter web check:architecture
pnpm --filter server check:architecture
pnpm --filter @scoops/core check:architecture
pnpm --filter @scoops/validation check:architecture
```

## Testing

### Web unit tests

The web application uses Vitest, Testing Library, and jsdom. Unit tests are
discovered from `apps/web/src/**/*.test.{ts,tsx}`:

```bash
pnpm --filter web test
```

### Web browser tests

Playwright runs browser integration tests from `apps/web/tests`. Route suites
under `apps/web/tests/routes` use mocked transport and the shared fixture factory;
the repository does not permit committed suites under `apps/web/tests/integration`;
real-service scenarios are manual Playwright CLI evidence and require their
documented Server/PostgreSQL prerequisites. The committed route suite starts an isolated
Vite server on `http://127.0.0.1:4001` with the SSR-auth fixture enabled; override the
port with `PLAYWRIGHT_PORT` when needed. The real-service auth setup continues to use the
developer server on port `4000`.

Use the Playwright CLI for all repository browser interaction, inspection and
validation, including manual or exploratory flows. Do not use `browser-use`, CDP
workflows or Playwright MCP.

```bash
pnpm --filter web test:integration
pnpm --filter web test:integration:ui
```

The checked-in Web CI workflow runs only the mocked route suite:

```bash
pnpm --filter web exec playwright test tests/routes --workers=1
```

Run a real-service scenario explicitly only after starting the required Server,
database, and Mailpit services; mocked route coverage is not persistence,
authorization, or external-email evidence.

To create reusable authenticated browser sessions for real-service scenarios,
run the opt-in setup command after seeding the local development accounts:

```bash
pnpm --filter web test:auth:setup
```

The command logs in the local Manager and Operator seed accounts and writes
ignored Playwright storage states to `apps/web/playwright/.auth/`. Override the
credentials with `PLAYWRIGHT_MANAGER_EMAIL`, `PLAYWRIGHT_MANAGER_PASSWORD`,
`PLAYWRIGHT_OPERATOR_EMAIL`, and `PLAYWRIGHT_OPERATOR_PASSWORD` when needed.
Use a generated state in a test with `test.use({ storageState: ... })`; do not
commit the generated files.

Browser screenshots used for validation are ephemeral. Write them to Playwright's
`test-results/` output or retain them as CI artifacts; do not write implementation
captures under `documentation/features/**/evidence/`.

The configured browser project is Chromium. Install the Playwright browser when
required by a new machine:

```bash
pnpm --filter web exec playwright install chromium
```

### Server tests

The server uses Vitest with a Node environment. Tests are discovered from
`apps/server/src/**/*.test.ts`; Testcontainers PostgreSQL is available for
database-backed fixtures. Better Auth controller fixtures use the same standard
PostgreSQL contract and do not require an external authentication gateway.

```bash
pnpm --filter server test
pnpm --filter server test:watch
pnpm --filter server test:coverage
```

The server configuration gives tests and lifecycle hooks a 60-second timeout to
allow container startup. The test command currently passes when no test files are
present.

The Core package uses Vitest for use-case unit tests:

```bash
pnpm --filter @scoops/core test
```

### Unit-test coverage

Core, Server and Web use Vitest's V8 coverage provider. Coverage includes unimported production
source files so an untested file remains visible at `0%`; tests, fixtures, generated route
metadata and pure export barrels are excluded where applicable.

Run all coverage suites from the repository root:

```bash
pnpm test:coverage
```

Run one workspace independently:

```bash
pnpm --filter @scoops/core test:coverage
pnpm --filter server test:coverage
pnpm --filter web test:coverage
```

Each workspace writes ignored HTML, JSON and LCOV reports to its local `coverage/` directory and
prints a text summary. CI runs these commands and enforces the measured no-regression floors
configured in each Vitest file. Falling below any statements, branches, functions or lines floor
makes Vitest exit non-zero and fails the CI job. Automatic threshold updates are disabled. These
floors are not the quality target and must never be lowered to make a change pass.

After a workspace coverage gate passes, its CI workflow writes the metrics to the GitHub Actions
job summary and creates or updates that workspace's coverage comment on internal pull requests.
The complete HTML, JSON and LCOV output is uploaded as a workflow artifact with 14-day retention.
Pull requests from forks still receive the job summary and artifact, but skip the comment because
their workflow token cannot safely receive pull-request write permission. No external coverage
service or upload token is required.

| Workspace | Statements | Branches | Functions | Lines |
| --- | ---: | ---: | ---: | ---: |
| Core baseline floor | 62.4% | 57.7% | 68.6% | 64.5% |
| Server baseline floor | 71.6% | 52.7% | 71.6% | 75.2% |
| Web baseline floor | 52.2% | 49.2% | 49.0% | 54.1% |
| Project target | 85.0% | 80.0% | 85.0% | 85.0% |

The project target is at least 85% lines, statements and functions and 80% branches in every
workspace. New and materially changed behavior must add scenario-complete tests and improve or
preserve the workspace result until those targets become the enforced floors. Coverage
percentages supplement behavioral assertions; they do not prove acceptance, authorization,
failure, persistence, integration or user-journey correctness by themselves.

## Frontend tooling

The web application is built with TanStack Start, TanStack Router, React, Vite,
Tailwind CSS, and Nitro.

| Command | Purpose |
| --- | --- |
| `pnpm --filter web dev` | Start development on port 4000. |
| `pnpm --filter web generate-routes` | Regenerate `src/routeTree.gen.ts`. |
| `pnpm --filter web build` | Build the client, SSR bundle, and Nitro server output. |
| `pnpm --filter web start` | Run `.output/server/index.mjs`. |
| `pnpm --filter web preview` | Preview the Vite production build. |

`apps/web/src/routeTree.gen.ts` is generated by TanStack Router and must not be
edited manually. Nitro is enabled for production builds; development SSR is
served directly by TanStack Start and Vite.

Browser-visible configuration is validated in
`apps/web/src/constants/browser-env.ts`.

## Backend tooling

The server uses NestJS and its CLI:

| Command | Purpose |
| --- | --- |
| `pnpm --filter server start` | Start the server through NestJS. |
| `pnpm --filter server dev` | Start NestJS in watch mode. |
| `pnpm --filter server debug` | Start watch mode with the Node debugger. |
| `pnpm --filter server build` | Compile the server into `apps/server/dist`. |
| `pnpm --filter server prod` | Run the compiled `dist/main` entrypoint. |

The server imports `@scoops/core`, `@scoops/email`, and `@scoops/validation` through
package subpath exports. Its Nest build uses `apps/server/webpack.config.cjs` to
bundle those workspace packages into the server artifact while leaving normal Node
dependencies external. This prevents the production Node process from trying to
execute workspace TypeScript source exports directly.

### Database tooling

Drizzle Kit reads `apps/server/drizzle.config.ts`. It uses the shared schema
barrel and writes generated migrations to
`apps/server/src/shared/database/drizzle/migrations`.

Set `DATABASE_URL` in `apps/server/.env` before running database commands:

```bash
pnpm --filter server db:migration:generate
pnpm --filter server db:migration:apply
pnpm --filter server db:schema:push
pnpm --filter server db:studio
```

Use migration generation and application for tracked schema changes. Direct
schema push is intended for local development.

### Inngest tooling

The server exposes all registered background jobs through `/api/inngest`.
`AppModule` performs the single root registration with
`InngestModule.forRoot({ client, functions })`.

For local development, set `INNGEST_DEV=1` in `apps/server/.env` and run the
Docker Compose Inngest service. Production removes `INNGEST_DEV` and supplies
`INNGEST_EVENT_KEY` and `INNGEST_SIGNING_KEY` through the deployment environment.

Messaging implementation rules are documented in
[`rules/messaging-layer-rules.md`](rules/messaging-layer-rules.md).

## Local infrastructure with Docker Compose

`docker-compose.yaml` and `volumes/` provide:

- standard PostgreSQL for business and Better Auth schemas;
- Mailpit for local email capture;
- MinIO plus an initialization container for S3-compatible storage;
- the Inngest development server.

Start and inspect the stack from the repository root:

```bash
docker compose up -d
docker compose ps
docker compose logs -f
```

Stop containers without deleting named data volumes:

```bash
docker compose down
```

Default local endpoints are:

| Service | URL |
| --- | --- |
| Web application | `http://localhost:4000` |
| Server application | `http://localhost:3336` |
| PostgreSQL | `postgresql://postgres:postgres@localhost:54322/postgres` |
| Mailpit UI | `http://localhost:54324` |
| Mailpit SMTP | `localhost:54325` |
| MinIO API | `http://localhost:9000` |
| MinIO Console | `http://localhost:9001` |
| Inngest UI/API | `http://localhost:8298` |

Ports and local credentials can be overridden in the root `.env`.

## Helper scripts

The repository provides prompt and agent synchronization helpers:

```bash
pnpm sync:commands
pnpm sync:agents
pnpm test:scripts
```

`sync-commands.mjs` synchronizes Markdown prompts from `documentation/prompts` into command files
for Cursor, Claude, and OpenCode, and generates matching local agent skills under
`.agents/skills`. It creates symlinks when supported and copies files as a
fallback.

`sync-agents.mjs` validates the canonical `documentation/agents/*-agent.md` contracts, removes
stale managed definitions, and generates matching Codex, Claude Code, and OpenCode agent
configuration.

`test:scripts` runs the tests under `scripts/tests` with Node's built-in test runner.

### Spec path implementation check

Check every affected path in a feature Spec against the current filesystem and its Git state
relative to `main`:

```bash
pnpm check:spec-implementation -- documentation/features/<domain>/<feature>/spec.md
```

Use `--base <git-ref>` to select another local baseline and `--json` for machine-readable output.
The command does not fetch. It requires every `Create`, `Modify`, `Generate` and `Remove` path to
have the corresponding final filesystem and Git-diff state, rejects duplicate or non-exact paths,
and ignores unrelated changed files. This is structural conformance only; semantic behavior and
test correctness remain owned by the Spec's validation commands and Evaluation evidence.
Run it after all affected paths and Orchestrator-owned artifacts are integrated, rerun it after
every correction affecting a contracted path, and record each run in the colocated Evaluation
before implementation review or readiness.

## Commit conventions

Commit message conventions are documented in
[`rules/commit-rules.md`](rules/commit-rules.md). The repository does not
currently configure Husky or commitlint hooks, so these conventions are not
automatically enforced by local Git hooks.

## GitHub Actions CI status

The repository contains four path-filtered GitHub Actions validation workflows. The workflow
files are authoritative for their exact triggers, path filters and commands; this section provides
the maintained summary:

- `.github/workflows/core-package-ci.yml` (`Core CI`) runs Core code, architecture and
  type checks plus tests for Core and shared tooling inputs;
- `.github/workflows/validation-package-ci.yml` (`Validation CI`) runs Validation code,
  architecture and type checks for Validation or Core inputs;
- `.github/workflows/server-app-ci.yml` (`Server CI`) runs Server code, architecture and
  type checks, tests and build for Server, Validation or Core inputs;
- `.github/workflows/web-app-ci.yml` (`Web CI`) generates routes and runs Web code,
  architecture and type checks, unit tests, the mocked Playwright route suite and build
  for Web, Validation or Core inputs. Real-service browser scenarios are validated
  separately with their required Server/PostgreSQL environment.

The workflows run on matching pushes and pull requests. The repository does not currently contain
deployment automation, such as Coolify workflows; deployment remains a separate manual or
externally managed infrastructure concern. New GitHub automation must use Scoops-specific
workflow names, secrets and environment variables.

## Recommended local validation

Before handing off a change, run the checks for each affected workspace:

```bash
pnpm --filter @scoops/core check:code
pnpm --filter @scoops/core check:architecture
pnpm --filter @scoops/core check:types
pnpm --filter @scoops/core test:coverage

pnpm --filter @scoops/validation check:code
pnpm --filter @scoops/validation check:architecture
pnpm --filter @scoops/validation check:types

pnpm --filter server check:code
pnpm --filter server check:architecture
pnpm --filter server check:types
pnpm --filter server test:coverage
pnpm --filter server build

pnpm --filter web check:code
pnpm --filter web check:architecture
pnpm --filter web check:types
pnpm --filter web test:coverage
pnpm --filter web test:integration
pnpm --filter web build
```

Run only the workspaces affected by the change, adding Docker-backed integration
checks when persistence or external service behavior changes.
