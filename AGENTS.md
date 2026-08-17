Guidance for AI coding agents working in this repository (Scoops).

Scoops is a pnpm and Turborepo monorepo:

- `apps/web` — TanStack Start and React frontend with Tailwind CSS;
- `apps/server` — NestJS backend with Drizzle ORM and Inngest;
- `packages/core` — shared, infrastructure-independent domain entities, events,
  contracts, and use cases consumed by both applications.

## Instruction scope

This file applies to the complete repository. A nested `AGENTS.md` refines these
instructions for files inside its directory. Read every applicable instruction
file before changing code. In particular, `apps/web/AGENTS.md` contains mandatory
TanStack Intent commands for matching web tasks.

## External traceability

This project does not use Jira tickets. When external issue traceability exists,
use the corresponding GitHub Issue URL and preserve it through Specs, Plans,
implementation evidence, commits, and pull requests as applicable. Do not invent
Jira keys, add `jira_tickets` metadata, migrate GitHub Issues into Jira, or treat
Jira/Confluence workflow requirements from generic prompts as applicable to this
repository. If no GitHub Issue exists, record the direct request or other actual
source without fabricating an issue.

If `AGENTS.local.md` exists, read it before repository work and apply it alongside
this file. When it is absent, continue with the instructions below.

## MCP availability and usage

The development environment uses Pencil, Context7, and Playwright MCP servers.
Use an MCP when the task matches its purpose; do not invoke one when local source,
repository documentation, and normal validation commands are sufficient.

### Pencil (`mcp__pencil__*`)

Use Pencil for `.pen` files, Pencil node inspection or editing, design-system
work, design-to-code implementation, and visual validation tied to a Pencil
design.

Before another Pencil operation, call `mcp__pencil__get_editor_state` with
`include_schema: true` when the current editor state and schema are not already
known. Treat `.pen` files as encrypted design documents: never read, search, or
modify them with shell commands or generic filesystem tools. Use only Pencil MCP
operations for their contents.

Before modifying a Pencil design, classify the request as either a visual-only
change or a product-behavior change. A change to actors, permissions, workflow,
states, validation, scope or business outcomes is a product-behavior change.

For a product-behavior change requested outside an active Spec:

1. Pause the Pencil edit and read the affected module PRD.
2. Identify the current PRD statement, the proposed change and its product
   impact; ask concise product questions for any unresolved behavior.
3. Present the proposed PRD amendment and obtain explicit user approval.
4. Update the PRD first, then reread it before editing Pencil.
5. Apply and visually validate the approved Pencil change.

Do not create or reopen a Spec solely for an out-of-Spec design request. If the
change is later selected for implementation, create the normal issue and Spec
from the updated PRD and Pencil design; `create-spec` then captures the required
frame screenshots and manifest. When a Spec is already active, use its contract
amendment workflow instead. Visual-only changes do not require a PRD amendment,
but must remain consistent with the current PRD and Design documentation.

When implementing a Pencil design:

1. Read `documentation/design.md` and the applicable UI rules first.
2. Inspect the relevant Pencil nodes and reusable design-system components.
3. Map Pencil values to existing Scoops tokens instead of introducing parallel
   hardcoded colors, spacing, typography, radii, or shadows.
4. Implement the smallest coherent screen or component boundary.
5. Validate the result in the browser with Playwright when the application can
   be run locally.

Use the Pencil design skill whenever a task involves a Pencil workflow and that
skill is available in the current agent environment.

### Context7 (`mcp__context7__*`)

Use Context7 when implementation depends on current documentation for a library,
framework, SDK, API, CLI, or cloud service. This is especially important for
TanStack Start and Router, NestJS, Drizzle, Inngest, Supabase, Vite, Nitro, and
other dependencies whose APIs evolve.

Resolve the library identifier with
`mcp__context7__resolve_library_id`, then query the relevant documentation with
`mcp__context7__query_docs`. Ask a narrow question that includes the installed
version or intended API when it matters.

Prefer Context7 over relying on memory or copying an example from another
project. Context7 supplements rather than replaces local evidence: inspect the
installed package version, repository source, configuration, and project rules
before applying documentation examples.

### Playwright (`mcp__playwright__*`)

Use Playwright MCP to validate real browser behavior in `apps/web`, especially
after changes to UI, routes, forms, responsive layouts, accessibility,
authentication, or REST integration.

For manual or interactive UI validation requested by the user or specified by a
feature Plan, use the `browser-use` skill and its CDP workflow instead of
Playwright. Prefer the accessibility tree for interaction and inspect the DOM,
final URL, network requests, console messages, viewport behavior, and keyboard
paths. Keep Playwright for the repository's automated browser test suite; do not
present mocked Playwright coverage as evidence of a real authenticated,
server-backed flow.

Playwright can navigate the running application, inspect accessibility snapshots,
interact with controls, inspect console messages and network requests, and capture
screenshots when visual evidence is useful. Prefer accessibility snapshots,
console output, and network evidence for diagnosis; screenshots are supporting
visual evidence rather than the only assertion.

#### Required browser-validation workflow

1. Identify the services required by the flow. For full-stack behavior, inspect
   `docker compose ps` and verify the relevant health endpoints before opening the
   browser. Default local endpoints are Supabase at
   `http://127.0.0.1:54321`, the server at `http://127.0.0.1:3333`, and the web
   app at `http://127.0.0.1:4000`.
2. Start `pnpm --filter server dev` and `pnpm --filter web dev` in persistent
   terminal sessions when the flow needs both applications. Wait for compilation
   and Nest bootstrap to finish before browser assertions.
3. Navigate to the target route and capture a fresh accessibility snapshot.
   Snapshot references are ephemeral; do not reuse a reference after navigation
   or a state-changing re-render.
4. Exercise the user-visible behavior with the current snapshot, preferring
   accessible role and name locators over CSS selectors.
5. Verify both the visible result and the resulting URL, network request, or
   persisted state relevant to the behavior. A successful navigation alone is
   not sufficient evidence for a server-backed flow.
6. Inspect browser console messages and failed network requests before calling a
   flow successful. Classify console errors, hydration warnings, and HTTP 4xx/5xx
   responses as fixed, pre-existing, or blocking.
7. For UI changes, exercise at least one narrow viewport and a keyboard path.
   Validate theme, focus, loading, empty, and error behavior when those states are
   part of the change.
8. Stop application processes started for the validation. Leave shared Docker
   services running unless the task explicitly requests teardown.

Route or transport mocks are acceptable for isolated tests, but they must not be
presented as evidence that a real authenticated or server-backed integration
works. Use `pnpm --filter web test:integration` for the repository's committed
Playwright test suite.

## Required reading

Repository documentation is architectural intent. Read the documents selected
below before implementation rather than reconstructing the intended design from
code alone.

### 1. [`documentation/rules.md`](documentation/rules.md) — always

This is the dynamic rule router for the repository.

- Read it before selecting task-specific rules.
- Match both the paths being changed and the behavior affected.
- Read every selected rule document in full.
- Repeat discovery if implementation expands into another layer.

Do not load every rule by default, and do not select rules from request wording
alone.

### 2. [`documentation/architecture.md`](documentation/architecture.md) — architecture, domain, or integrations

Read this before changing system layers, persistence strategy, authentication,
asynchronous processing, runtime technology, or external integrations.

### 3. [`documentation/modules.md`](documentation/modules.md) — module ownership

Read this before changing business capabilities, module ownership, cross-module
contracts, domain events, or feature placement. Keep Identity, Billing, MRP, PDV,
and Communication responsibilities inside their owning boundaries. Shared
infrastructure may support modules but must not absorb their business rules.

### 4. Module PRDs under [`documentation/prds`](documentation/prds) — product behavior

Read the PRD owned by the affected module before changing business rules, user
flows, permissions, validation, or product-facing behavior:

- `identity.md` for establishments, users, access, and onboarding;
- `billing.md` for plans, trials, subscriptions, and charges;
- `mrp.md` for catalog, stock, recipes, and production;
- `pdv.md` for sales channels, carts, orders, and POS behavior;
- `communication.md` for email and in-product notifications.

If implementation changes a business rule, update the corresponding PRD in the
same task so product intent and code remain aligned.

### 5. [`documentation/design.md`](documentation/design.md) — UI work

Read this before changing UI, styling, layouts, or reusable components. Use the
documented tokens and existing CSS variables. Do not introduce arbitrary colors,
fonts, spacing, radii, or shadows when the design system already defines the
value.

Validate responsive behavior, contrast, focus visibility, reduced motion, and
other accessibility expectations relevant to the change.

### 6. [`documentation/tooling.md`](documentation/tooling.md) — commands and configuration

Read this before installing dependencies, running unfamiliar commands, or
changing `package.json`, `turbo.json`, `biome.json`, TypeScript configuration,
test configuration, Docker Compose, Drizzle, or Inngest setup.

Use pnpm and workspace `--filter` commands. Do not copy package names, scripts,
CI configuration, deployment secrets, or environment names from another project.

## Workflow expectations

- Inspect the worktree before editing and preserve unrelated or user-owned
  changes. Do not overwrite a dirty file without understanding the overlap.
- Use the root `AGENTS.md`, every applicable nested `AGENTS.md`, the rule router,
  and dynamically selected rules together.
- Treat documentation as intent when code and documentation disagree. Surface the
  discrepancy instead of silently copying the implementation.
- Keep dependency direction explicit: feature modules may use shared
  infrastructure; shared layers must not import feature-owned jobs, repositories,
  controllers, or business rules.
- Keep business logic in `packages/core` use cases. Application layers translate
  framework input, wire dependencies, persist data, and integrate external
  services.
- Use core event class `_NAME` values when configuring Inngest `eventType`
  triggers. Do not duplicate event names as string literals in server jobs.
- Keep `InngestModule.forRoot({ client, functions })` in the root `AppModule` as
  the single messaging composition point.
- Use aliases defined by each workspace. Server imports use `@/`; core internal
  imports use the package's `#<module>/*` aliases.
- Do not edit generated files such as `apps/web/src/routeTree.gen.ts` manually.
  Regenerate them through the documented command.
- Add dependencies only to the workspace that uses them. Update and commit
  `pnpm-lock.yaml` with dependency changes.
- Validate in proportion to risk. At minimum, run code and type checks for every
  changed workspace; add unit, integration, browser, and build checks for the
  affected boundaries.
- Do not claim a test or browser flow passed unless it was actually executed.
- Do not add CI/CD, external writes, deployments, or third-party mutations unless
  the user explicitly requests them.

## Worktree and environment safety

- Never commit `.env` files or credentials. Keep `.env.example` templates free of
  real secrets.
- When creating another worktree, copy only ignored, untracked local environment
  files that are needed there. Do not copy tracked `.env.example` templates as if
  they were secrets.
- Do not delete Docker volumes, reset databases, remove migrations, or tear down
  shared services unless the user explicitly requests that destructive action.
- Stop persistent development processes started for a task when validation is
  complete, unless the user asks to leave them running.
