---
name: create-spec
description: Create, refine, and judge an implementation-ready feature Spec from a PRD, GitHub Issue, report, existing reference, or direct request, grounded in repository rules and real code paths.
---

# Create a Spec

Author the Spec in the current task. Do not create another user-owned thread. Use this
workflow for feature delivery or a feature-scoped change; use a direct workflow for
maintenance without a feature Contract.

## Repository authority

Read the root and applicable nested `AGENTS.md` files before research. Repository
instructions override generic workflow assumptions, especially traceability, source
systems, tests, architecture, design tools, commands, and terminology.

Do not assume Jira, Confluence, a specific migration path, framework, test taxonomy, or
folder convention. Discover them from repository instructions, documentation, tooling,
configuration, and source. Never invent an external ticket or migrate traceability to a
system the repository does not use.

## Classify the delivery

Identify the actual source as one of:

- `prd`: a product requirements document at the repository-approved URL or path;
- `issue`: a repository-approved issue URL, such as a GitHub Issue;
- `report`: a bug or security report that is safe to reference;
- `direct-request`: the current task or another explicit user request.

Use compact mode for a small cohesive change. Use complete mode when the delivery crosses
workspaces/layers, adds persistence or external integration, includes multiple user states,
or has meaningful security, concurrency, migration, or UI risk.

Define `scope` with the workspaces, directories, configuration, generated outputs, and
documentation expected to change. Revisit it when research expands the delivery.

## Research before writing

Read in this order:

1. the request source and referenced implementation/design files;
2. the repository rule router and every selected rule;
3. Architecture, module ownership, affected PRD, design, and tooling documents required
   by repository instructions;
4. the actual code paths, package versions, configuration, exports, fixtures, and similar
   implementations for every affected layer;
5. current library documentation through the repository-approved documentation MCP when
   an evolving framework or SDK decision matters.

Inspect the worktree and preserve unrelated changes. Treat documentation as intent when it
conflicts with code and surface the discrepancy.

For each affected layer, record:

- real existing paths and their relevant declarations;
- reference implementations to follow, including external/local references explicitly
  supplied by the user;
- current data/control flow and where it changes;
- contracts crossing layers or applications;
- generated files and their canonical commands;
- risks, gaps, concurrency, security, tenancy, SSR/hydration, and external-provider
  limitations where applicable.

When a supplied reference and the repository differ, preserve the requested pattern only
where it fits the target repository. State intentional deviations instead of copying
obsolete frameworks, migrations, test conventions, secrets, or out-of-scope operations.

Resolve material choices before finalizing. Ask only when local evidence and repository
rules cannot produce a safe answer. Record accepted assumptions and explicitly deferred
product requirements.

## File and frontmatter

Create `documentation/features/<domain>/<feature>/spec.md`. For a change to an already
implemented feature, use
`documentation/features/<domain>/<feature>/changes/<change-name>/spec.md`. Use short
kebab-case names.

Use only metadata supported by the repository. A typical frontmatter is:

```yaml
---
title: <title>
status: draft
revision: 1
source:
  type: <prd|issue|report|direct-request>
  ref: <actual-url|path|codex-task>
issue: <actual-issue-url, optional>
prd: <actual-prd-url-or-path, optional>
scope:
  - <workspace|directory|file>
last_updated_at: YYYY-MM-DD
---
```

Do not add empty metadata. Preserve existing traceability across revisions. Do not include
Jira-specific metadata unless repository instructions explicitly require Jira.

`plan.md` is optional and recommended when phases, risk, or dependencies need a ledger.
`evaluation.md` is required after implementation/final judgment unless the Spec is
abandoned before implementation. The Spec defines intent; final logs and implementation
evidence belong in `evaluation.md`.

## Required document structure

Write these sections:

1. **Context** — objective, source, why the chosen Spec mode applies, and documentation
   limitations.
2. **Scope** — explicit in-scope and out-of-scope behavior.
3. **Product alignment** — delivered PRD requirements, partial slices, and deferred
   outcomes without weakening the PRD.
4. **Contract** — functional requirements and acceptance criteria.
5. **Current state** — concise evidence from the repository.
6. **Technical solution** — end-to-end responsibilities and flow per affected layer.
7. **Implementation blueprint** — exact declarations, file inventory, decisions, runtime
   flows, removals, and open technical questions.
8. **Validation plan** — commands and real/manual validation proportional to risk.
9. **Evaluation** — link to `evaluation.md`.
10. **Documentation alignment** — PRD/Architecture/module documents changed or confirmed.
11. **Premises and resolved questions**.
12. **Amendments** — one dated entry per revision explaining material changes.

Omit only a section that is genuinely inapplicable, and say why when its absence could be
ambiguous.

## Contract rules

Use only `RF-*` and `CA-*` as required IDs. Keep acceptance criteria in list format, not a
table:

```md
- **CA-01 — RF-01**
  - **Given:** precondition.
  - **When:** action.
  - **Then:** observable result.
  - **Expected evidence:** exact test, browser, sensor, or inspection boundary.
```

Every RF must have acceptance evidence. Cover success, rejection, authorization, tenant
isolation, concurrency, provider failure, hydration/session restoration, accessibility,
and secret boundaries when relevant. Evidence names must follow the repository's test
taxonomy; do not invent test categories. If server integration tests are defined only for
controllers and jobs, express persistence behavior through those boundaries and do not
propose repository/database integration suites.

Security, performance, architecture, and provider limitations may be acceptance criteria
or technical restrictions. Do not add alternate ID systems, evidence comments, custom
gates, or baselines unless repository instructions require them.

### Test creation is part of the Contract

Treat test creation as an implementation requirement, not as optional follow-up work.
Before finalizing a Spec, derive the test boundary for every RF and CA from the actual
repository taxonomy and name the concrete test file or suite that will provide its
evidence. Include those paths in the implementation blueprint and file inventory.

For every behavior-owning UI page or widget, specify the appropriate component tests and
hook tests for its rendered states, validation, interactions, async success/failure,
loading, persistence, navigation, and stale-request behavior. A pure renderer still
requires component tests for its props and state variants. Route-level browser tests are
supplemental evidence and must not silently replace page/widget or hook tests when the
Spec names those boundaries. If a browser test is the only appropriate boundary, state
why and identify the behavior it uniquely proves.

For server and Core changes, name the corresponding unit, provider, controller/job
integration, persistence, concurrency, or browser test boundary only when that boundary
is supported by repository rules and existing patterns. Do not describe a test as
evidence unless the test is explicitly planned for creation or modification. A Spec is
not implementation-ready if its required behavior has no named test path, fixture,
controlled dependency, or observable assertion.

The validation plan must run every newly named test boundary and the relevant workspace
suite. Record mocked transport, real server-backed, and manual browser evidence as
distinct categories; passing one category does not imply that another category exists.

## Implementation-ready technical detail

The Spec must be implementable without rediscovering architecture. Include exact paths,
TypeScript signatures, dependencies, input/output types, algorithms, status/error mapping,
transaction semantics, state ownership, and generated commands where applicable. Do not
write full implementation bodies.

### Organize implementation by application and technical layer

The **Implementation blueprint** must begin with an implementation directory organized
first by affected application or package and then by the technical layers that actually
change. Use real repository names as headings, for example:

```md
### Implementation map by application and technical layer

#### `packages/core`
##### Domain structures and errors
##### Provider and repository contracts
##### Use cases

#### `apps/server`
##### Provision providers
##### Database model, mapper, repositories and migration
##### REST schemas, DTOs, guards and controllers
##### Messaging and composition

#### `apps/web`
##### Provision and REST adapters
##### Application hooks and contexts
##### UI widgets
##### Routes and generated metadata
```

The example headings are not a fixed architecture. Include only applications/packages and
layers proven by repository research, use their native terminology, and add other real
layers when needed. Do not create empty or “not applicable” layer headings.

For every layer, group the relevant classes, functions, types and files and specify:

- **Location:** exact existing or planned repository path;
- **Declarations:** exact class, function, method, interface and type names/signatures;
- **Dependencies:** injected contracts, providers, contexts or libraries;
- **Input/output:** request, response, props, state or persisted shapes crossing the
  boundary;
- **Responsibility/algorithm:** what the declaration owns and what it must not own;
- **Integration:** callers, consumers, exports, registration/composition and generated
  artifacts affected by the change.

For multi-application delivery, finish the directory with the cross-application control
and data flow: which application exposes a boundary, which consumes it, the transport or
event format, state/serialization mapping, and ownership of side effects. A compact
Mermaid flow is preferred when three or more layers participate.

The directory complements rather than replaces exact contracts, technical decisions and
the create/modify/generate/remove file inventory. All paths and declarations must remain
consistent across those sections.

For UI layers, make the widget implementation directly actionable. For every page,
layout and nested widget, specify its component and widget-specific props type, path,
owning hook (or explicitly state that it is a pure renderer), state/render variants,
callbacks/actions, child widgets and complete directory tree. State which hook/context
owns behavior so nested widgets do not infer business state or introduce a second source
of truth. Map each design frame/state to the exact widget that implements it.

### Existing references

List the real paths and declarations used as patterns. Explain what each reference governs.
When the user names a specific reference, inspect it and identify which aspects are adopted
and which are intentionally not adopted.

### Core/domain

- Place concepts with identity in `domain/entities`; value/state/provider projections
  without local identity belong in `domain/structures`, subject to repository rules.
- Define domain entities, structures, repository/provider/service contracts, use cases,
  and domain errors in their owning module.
- Give exact signatures and use-case algorithms, including neutral not-found/auth behavior.
- Keep business rules in use cases and infrastructure/framework types out of Core.
- Prefer named domain error subclasses when failures participate in control flow or REST
  mapping. Keep provider availability errors in infrastructure and HTTP parsing/validation
  errors at the transport boundary.
- Derive Zod enum values from runtime Core domain objects; do not duplicate string arrays.
  Apply the same rule to persistence enums when repository conventions support it.
- Add required entity/structure fakers and barrels when tests consume new domain types.

### Transactions and side effects

Preserve the repository's database abstraction. Do not introduce a second transaction
method when one repository-approved transaction API can express the requirement. Specify
isolation, locking, retry, conflict translation, and concurrency evidence in the adapter.

For retryable transactions:

- capture deterministic inputs such as business time once before entering the callback;
- restrict the replayable callback to repository work through its database scope;
- never call providers or emit external side effects inside the callback;
- publish messages, remote mutations, or other side effects only after a successful
  commit, unless an established outbox pattern says otherwise.

### Application/server boundaries

Specify provider tokens/registration, environment variables, guards/middleware, request
context, decorators, schemas, DTOs, controllers/jobs, repositories, mappers, models,
migrations, modules, seeders, fixtures, and error translation that actually apply.

Derive server-controlled values from authenticated context, route params, or server state;
exclude them from request schemas. State exact public HTTP behavior without leaking local
account status or provider payloads. Keep service-role credentials and signing secrets out
of browser/runtime boundaries that do not need them.

### Web/UI boundaries

Specify provider factories, service adapters, context/state ownership, route protection,
SSR/client behavior, token refresh, async race protection, return-URL sanitization,
loading/error/empty/success states, widget tree, responsive behavior, accessibility, and
browser evidence.

Every widget that is a layout must use the `Layout` suffix consistently across its full
public contract:

- the React component name ends in `Layout`, for example `AuthVisualLayout`;
- the widget-specific props type ends in `LayoutProps`, for example
  `AuthVisualLayoutProps`;
- related public types retain the layout identity, for example
  `AuthVisualLayoutVariant` instead of `AuthVisualVariant`;
- the kebab-case widget directory ends in `-layout`, for example
  `widgets/layouts/auth-visual-layout/`.

When an existing layout violates this invariant, the Spec must classify the change as a
coherent rename/move: list the new path under **Files to create**, the old path under
**Files to remove**, every importing consumer under **Files to modify**, and rename the
component, props and related public types together. Do not leave compatibility aliases
with names that omit `Layout` unless repository evidence requires a staged migration.

Use one clear source of truth for state. Do not introduce a store, context, middleware, or
parallel provider merely because it is common; follow the repository and explicit user
direction. Describe cancellation/generation handling when stale async auth/data work could
overwrite logout, navigation, or newer state.

### File inventory

Separate paths under clear headings such as **Files to create**, **Files to modify**,
**Files to generate**, and **Files to remove**. Do not use parenthetical `new file`
annotations. Ensure every nonexistent path is under creation/generation and every path
under modification exists.

Use visually clear Markdown:

- one top-level list item per file or coherent file group;
- a blank line before nested responsibilities or code blocks;
- bold labels such as **Dependencies**, **Request**, **Response**, **Algorithm**,
  **Route**, **Input**, **Output**, **Errors**, and **Metadata**;
- balanced fenced blocks nested under their owning item;
- no orphan punctuation, duplicate continuation text, or mixed create/modify lists.

## Pencil-backed UI

When UI is tied to Pencil, use the Pencil skill and MCP. Treat `.pen` files as encrypted
and never inspect them with filesystem tools.

1. Inspect editor state/schema, supplied Node IDs, reusable components, variables, exact
   viewport, and node names.
2. Add a mapping table: Pencil file, Node ID, frame/state, feature surface, and required UI
   validation.
3. Mark design-only references that must not expand functional scope.
4. Require mapping to existing code tokens/components rather than hardcoded Pencil values.
5. Require a Pencil screenshot and layout-problem inspection for every mapped node.
6. Require manual browser validation through the repository-approved interactive workflow
   at the design viewport, plus accessibility tree/DOM, URL, network, console, keyboard,
   and narrow-viewport checks.
7. Record route, Node ID, viewport, comparison, screenshot/layout result, and remaining
   findings in `evaluation.md`.

Desktop-only frames do not waive responsive validation and must not be treated as mobile
specifications.

## Validation plan

Use commands from repository tooling. Include only applicable generation, format,
code-check, typecheck, unit, controller/job integration, automated browser, manual browser,
and build commands. State the distinction between mocked browser coverage and a real
authenticated/server-backed flow.

For real UI validation, name required services, health checks, target routes/states,
viewport, keyboard path, accessibility checks, console/network inspection, persisted
effect, design Node IDs, and process cleanup.

## Judge Spec

Trigger `judge-spec-agent` as a read-only `Judge Spec` subagent in the current task. Send
the source, current Spec, research, Architecture, applicable Rules, reference
implementations, and explicit repository/user constraints without persuasive framing.

- On `failed`, correct every concrete blocker and submit the current file again.
- On `accepted`, set `status: open` and recommend `implement-spec` or `create-plan` based
  on size/risk.

After every user-requested amendment, increment `revision`, update documentation alignment
and amendment history, rerun Markdown integrity checks, and repeat Judge Spec. Do not call
an earlier accepted revision current after the Contract or blueprint changes.
