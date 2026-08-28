Guidance for AI coding agents working in this repository (Scoops).

## Tool availability and usage

The development environment uses Pencil and Context7 MCP servers. Use an MCP when
the task matches its purpose; do not invoke one when local source, repository
documentation, and normal validation commands are sufficient. Use the Playwright
CLI for all browser interaction, inspection and validation; do not use
`browser-use`, CDP workflows or Playwright MCP for repository implementation.

## Parallel work and subagents

Whenever the work contains independent workstreams that can be executed in
parallel, create subagents and delegate those workstreams instead of performing
them sequentially. Give each subagent a clearly bounded responsibility, identify
the files or paths it owns, and avoid assigning overlapping edits. Keep shared
decisions and integration in the main task, then review and validate all
subagent results together before completion.

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
5. Validate the result with the Playwright CLI when the application can be run
   locally.
6. After an approved Pencil update, treat the affected design as an
   implementation change when production code is in scope: trace the changed
   nodes to their owning source paths, update the corresponding UI, routes,
   behavior and tests in the same task, and validate the runtime result against
   the updated Pencil reference. Do not finish with only a `.pen` change when
   the request includes implementation changes. If the Pencil update changes
   product behavior, use the active Spec amendment and PRD workflow before
   editing production code.

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

### Playwright CLI

Use the Playwright CLI to validate real browser behavior in `apps/web`, especially
after changes to UI, routes, forms, responsive layouts, accessibility,
authentication, or REST integration. Use the CLI for both automated suites and
interactive/manual scenarios; do not use `browser-use`, CDP workflows or
Playwright MCP instead.

Use accessible role and name locators where possible. Inspect the DOM, final URL,
network requests, console messages, viewport behavior and keyboard paths. For every
UI change where the rendered appearance could be affected, capture a fresh
screenshot with the CLI after the change and inspect it against the applicable
design reference. Repeat this at each relevant implementation or correction
checkpoint; never reuse a pre-change screenshot as evidence. Screenshots support
the behavioral assertions and do not replace them. Non-visual changes do not
require a new screenshot. Mocked transport coverage must not be presented as
evidence that a real authenticated, server-backed flow works.

#### Required Playwright CLI validation workflow

1. Identify the services required by the flow. For full-stack behavior, inspect
   `docker compose ps` and verify the relevant health endpoints before running the
   Playwright CLI flow. Default local endpoints are Supabase at
   `http://127.0.0.1:54321`, the server at `http://127.0.0.1:3336`, and the web
   app at `http://127.0.0.1:4000`.
   For flows using persisted authentication, verify that the local Manager and
   Operator seed accounts exist. If they do not, run
   `pnpm --filter server db:seed` explicitly before
   `pnpm --filter web test:auth:setup`; the seed resets local Auth users and
   application seed data, so Playwright must not invoke it implicitly.
2. Start `pnpm --filter server dev` and `pnpm --filter web dev` in persistent
   terminal sessions when the flow needs both applications. Wait for compilation
   and Nest bootstrap to finish before Playwright assertions.
3. Run the applicable Playwright CLI suite or focused test against the target
   route and capture fresh evidence after each state-changing interaction.
4. Exercise the user-visible behavior with accessible role and name locators
   rather than CSS selectors where possible.
5. Verify both the visible result and the resulting URL, network request, or
   persisted state relevant to the behavior. A successful navigation alone is
   not sufficient evidence for a server-backed flow.
6. Inspect console messages and failed network requests before calling a
   flow successful. Classify console errors, hydration warnings, and HTTP 4xx/5xx
   responses as fixed, pre-existing, or blocking.
7. For UI changes, exercise at least one narrow viewport and a keyboard path.
   Validate theme, focus, loading, empty, and error behavior when those states are
   part of the change.
8. For each appropriate UI change, capture and inspect a fresh screenshot after
   the change, including the relevant desktop or narrow viewport state. Record
   the screenshot path and the comparison result in the applicable evaluation
   evidence.
9. Stop application processes started for the validation. Leave shared Docker
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

Read the PRD owned by the affected module before changing outcomes, actors,
capabilities, experience, user journeys, permissions, validation, product
dependencies, or other product-facing behavior:

- `identity.md` for establishments, users, access, and onboarding;
- `billing.md` for plans, trials, subscriptions, and charges;
- `mrp.md` for catalog, stock, recipes, and production;
- `pdv.md` for sales channels, carts, orders, and POS behavior;
- `communication.md` for email and in-product notifications.

If implementation changes a business rule, update the corresponding PRD in the
same task so product intent and code remain aligned.

PRD requirement checkboxes are delivery state, not implementation-progress state.
Only `conclude-spec` marks a complete requirement Implemented, after local closure
preflight and before the delivery commit and final PR CI. A materially amended
requirement returns to unchecked before its revised Spec is authored.

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
