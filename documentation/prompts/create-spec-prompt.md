---
name: create-spec
description: Create or refine an implementation-ready feature Spec from a PRD, GitHub Issue, report, existing reference, or direct request, grounded in repository rules and real code paths.
---

# Create a Spec

Create or revise the Spec in the current task. Do not create another user-owned thread.
Use this workflow for a feature or feature-scoped change; use a direct maintenance workflow
when no feature Contract is needed.

## Repository authority

Read the root and applicable nested `AGENTS.md` files, then use
`documentation/rules.md` to select and read every applicable Rule. Read the source request,
Architecture, Modules, affected PRD, Design, Tooling and actual code paths required by the
repository. Repository authority overrides generic workflow assumptions.

Use the repository's real source system and terminology. Do not invent Jira, Confluence,
migrations, commands, test categories, paths or framework conventions. Inspect the
worktree and preserve unrelated changes.

## Classify and research

Record the real source as `prd`, `issue`, `report` or `direct-request`. Use compact mode for
a small cohesive delivery and complete mode when it crosses applications/layers, changes
persistence or integrations, contains multiple UI states, or has meaningful security,
concurrency, migration or operational risk.

Before writing, inspect for every affected boundary:

- existing paths, declarations, exports, configuration and generated artifacts;
- current control/data flow and the exact technical gap;
- contracts crossing applications or layers;
- existing references and patterns to reuse;
- installed versions and current library documentation when an evolving API matters;
- security, tenancy, concurrency, side-effect, SSR/hydration, provider and migration risk.

Treat documentation as intent when it conflicts with code and surface the discrepancy.
Adopt supplied references only where they fit the target repository and state intentional
deviations.

## Clarification and authority gate

Research may happen before clarification; Spec authoring may not. Before creating or
modifying `spec.md`, identify unresolved choices that could materially change product
behavior, scope, architecture, domain ownership, persistence, security, APIs, integrations,
provider behavior, UI/design, validation or delivery risk.

Resolve a choice from repository authority when one safe answer is already established.
Otherwise ask the user concise questions covering the applicable areas:

- **Product:** actors, permissions, success/rejection behavior, states, scope and deferrals;
- **Technical:** ownership, contracts, transactions, concurrency, failure semantics,
  integrations, dependencies and runtime constraints;
- **Design:** authoritative frames/states, responsive behavior, allowed deviations and
  missing references;
- **Validation:** automated boundaries, manual flows, accounts/data, viewports and evidence.

For every material question, provide repository evidence, a recommendation, alternatives
and impact. Do not ask the user to decide facts already fixed by Rules, Architecture or
established code. Write only after every material ambiguity is answered or the user
explicitly accepts a documented assumption.

When research shows that authoritative documentation must change:

1. identify the current statement, evidence, proposed change and affected scope;
2. obtain user approval for product behavior, global Rules, architecture boundaries,
   module ownership or other normative changes;
3. update the PRD, Rule, Architecture, Modules, Design or Tooling document first;
4. reread the changed authority and recompute the Rule Pack before writing the Spec.

When an implementation finding shows that a reusable Rule was missing, ambiguous or
too easy to misapply, reinforce the relevant Rule document with a focused
`## Antipatterns to Avoid` section before continuing implementation. Each entry should
state the prohibited pattern, the required alternative and the validation that proves
compliance. Keep the entry reusable across features; feature-specific behavior remains
in the Spec's acceptance criteria. Record the evidence and authority change in the
Spec's Documentation alignment and revision history, then reread the Rule and rebuild
the Rule Pack.

Feature-specific behavior and technical choices stay in the Spec. Reusable conventions
belong in their authoritative documentation.

## Location and metadata

Create `documentation/features/<domain>/<feature>/spec.md`. For a new change to an already
concluded feature, create
`documentation/features/<domain>/<feature>/changes/<change-name>/spec.md`. Use short
kebab-case names.

Use only supported metadata and omit empty fields:

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

`plan.md` is optional and exists only when execution needs phases or a durable ledger.
`evaluation.md` is created at implementation kickoff, not during Spec authoring. The Spec
may reference the expected `./evaluation.md` path.

Use only these Spec statuses:

- `draft` — contract authoring or amendment;
- `open` — implementation-ready contract;
- `in_progress` — implementation or conclusion is active;
- `completed` — final PR CI passed and delivery closed.

Findings, blockers and verdicts are recorded separately; they do not create more Spec
statuses.

## Required Spec structure

Write five top-level sections:

1. **Context and scope**
2. **Implementation Contract**
3. **Technical Contract**
4. **Validation Contract**
5. **Documentation alignment and revision history**

Keep compact Specs short. Omit conditional subsections instead of writing empty or “not
applicable” sections. State each fact once and reference its ID, contract or path elsewhere.
The Spec owns expected behavior and technical/evidence contracts; the Plan owns execution;
`evaluation.md` owns actual evidence, findings and verdicts.

### 1. Context and scope

Include concise subsections for:

- **Objective and source:** outcome, source and delivery mode;
- **Current behavior and product gap:** user-visible baseline and missing behavior;
- **Scope and product alignment:** in scope, out of scope, delivered/partial/deferred PRD
  outcomes without weakening the PRD;
- **Product decisions and assumptions:** resolved product choices and explicitly accepted
  premises, not an interview transcript.

Do not put repository implementation evidence or technical decisions here.

### 2. Implementation Contract

Define observable behavior with `RF-*` requirements and `CA-*` acceptance criteria. `MV-*`
may identify manual scenarios but is not another requirement system.

```md
- **CA-01 — RF-01**
  - **Given:** precondition.
  - **When:** action.
  - **Then:** observable result.
  - **Expected evidence:** exact test boundary and/or `MV-01`.
```

Every RF must have acceptance evidence. Cover applicable success, rejection, authorization,
tenant isolation, concurrency, provider failure, session/hydration restoration,
accessibility, performance and secret boundaries. Keep internal paths and algorithms out of
the behavioral requirements.

Add **Cross-cutting restrictions** only for applicable security, privacy, accessibility,
concurrency, idempotency, performance, provider or failure constraints.

#### Design Contract — conditional

For design-backed UI, include a concise **Design Contract** subsection linking
`design/manifest.md` and defining required frames/states, screenshot coverage, exact
viewports, responsive behavior, implementation surfaces and allowed deviations. The
manifest owns the detailed frame inventory; do not duplicate it in `spec.md`.

During Spec research, use the Pencil skill and MCP for `.pen` contents. Never inspect a
`.pen` file with filesystem tools. Before the Spec becomes `open`:

1. inspect editor state/schema, every relevant frame/state, components, variables, viewport
   and node name;
2. save one reference screenshot per relevant frame/state under the feature-local
   `design/` directory;
3. create `design/manifest.md` mapping Pencil file, Node ID, state, viewport, screenshot,
   implementation surface, code tokens/components and required validation;
4. record layout-problem inspection for every mapped node;
5. define responsive behavior when no mobile frame exists.

Builders and the Reviewer use the saved bundle and do not require live Pencil.
Reopen Pencil only when the Design Contract changes or the user requests a refresh.

### 3. Technical Contract

The Technical Contract translates the behavioral Contract into an implementable delta.
Use these subsections:

#### Current technical state

Record only relevant existing paths/declarations, current control/data flow, reusable
contracts and references, generated artifacts, material version constraints,
documentation/code discrepancies and the exact technical gap. Do not inventory the
repository or describe future implementation here.

#### Domain Contract — conditional

When domain concepts change, define entities and identity, structures/value objects,
invariants, relationships and ownership, state transitions, domain errors, domain events
and domain-owned interfaces/signatures. Do not include class bodies.

#### Solution and runtime flow

Explain end-to-end ownership, boundary crossings, state changes, transaction boundaries,
side effects and material failure branches. Add one compact Mermaid flow only when three or
more layers or branches make prose insufficient. Do not diagram every file or component.

#### Implementation map

Organize by affected application/package and actual technical layer. Each affected path
appears once and is classified as **Create**, **Modify**, **Generate** or **Remove**. For
each path include only applicable:

- exact declarations and signatures;
- responsibility and what it must not own;
- dependencies;
- input/output crossing the boundary;
- callers, consumers, exports, registration/composition and generation.

Do not create a second file inventory. Verify that create/modify/generate/remove
classification matches the filesystem. For UI, identify page/widget boundaries, props,
state owner or pure-renderer status, render variants, actions, child widgets, responsive
behavior and tests. Follow the actual UI Rules and established repository structure.

#### Integration Contract — conditional

When boundaries change, define only changed REST operations, events/jobs, provider
interfaces and cross-application contracts: authentication/authorization, input/output
types, validation/serialization, status/error mapping, idempotency and side effects. Use a
JSON example only when a signature/schema would remain ambiguous.

#### Persistence Contract — conditional

When persisted state changes, define only changed models/fields, indexes, constraints,
repository operations, mappings, migrations, compatibility/rollout, transaction/isolation,
locking, retries and concurrency. Do not reproduce unchanged tables or write migration
bodies. Keep external side effects outside retryable transactions unless an approved
outbox pattern says otherwise.

#### Technical Decisions

Record only consequential choices with a real alternative: choice, reason and accepted
trade-off. Standard repository conventions are not decisions and should not be repeated.

### 4. Validation Contract

Testing is part of implementation. Derive every test boundary from the repository taxonomy
and name concrete test files/suites and the behavior/CA IDs they prove. Avoid speculative
lists of every test function or arbitrary coverage percentages. Keep mocked transport,
real integration and manual browser evidence distinct.

Define executable `MV-*` scenarios for behavior requiring manual validation. Each includes:

- mapped `CA-*`, services/health checks, accounts/fixtures and preconditions;
- starting route/state, exact viewport and saved design reference when applicable;
- numbered actions and keyboard path;
- expected visible result, final URL, network and persistence/provider effect;
- accessibility/DOM/layout, focus, console and failed-request checks;
- evidence target and cleanup.

List actual repository generation, code, type, unit, integration, browser and final build
commands that apply. Link the expected evidence record as `./evaluation.md`.

The Reviewer personally executes every applicable `MV-*` scenario and compares
design-backed UI against saved references at the declared viewports. Builder checks and
automated Playwright are supporting evidence, not substitutes for manual review.

### 5. Documentation alignment and revision history

Under **Documentation alignment**, list each governing PRD, Architecture, Modules, Design,
Tooling and other authoritative document, its applicability and whether it changed or was
confirmed.

Under **Rule Pack**, list exact applicable Rule paths and the evaluated repository revision.
Builders and the Reviewer read the source documents directly.

Under **Revision history**, record one dated entry per material Spec revision. Do not put
implementation attempts, test results or verdicts here.

## Integrity and author handoff

There is no Spec Reviewer. Keep the Spec `draft` while clarification or integrity work
remains.
Before setting it to `open`, verify:

- metadata, source and revision consistency;
- complete RF/CA traceability and named evidence;
- filesystem-valid implementation-map classifications;
- no unresolved material product or technical ambiguity;
- complete/current design bundle when applicable;
- executable manual scenarios and valid documentation/Rule Pack paths;
- Markdown and artifact integrity.

After creating or materially revising the Spec, return a concise author summary containing:

- clickable path, revision and status;
- objective, user-visible outcome, scope and important exclusions;
- key product and technical decisions;
- affected applications/layers and technical approach;
- design screenshot count/coverage when applicable;
- automated boundaries and `MV-*` coverage;
- accepted assumptions, risks or blockers;
- recommended route: `implement-spec` or `implement-plan`, with rationale.

Recommend `implement-spec` for a small cohesive change with stable dependencies, limited
ownership and no meaningful waves. Recommend `implement-plan` for dependent phases,
multiple applications/shared ownership, migration/provider/concurrency/security risk,
multiple design-backed surfaces/manual environments, useful parallel lanes or a needed
recovery ledger. Do not choose by file count alone.

For a material amendment before conclusion, set the current Spec to `draft`, increment the
revision, repeat clarification and authority alignment, refresh affected design/evidence
contracts, run integrity checks and return it directly to `open`. Re-evaluate the
implementation route. Earlier affected implementation evidence becomes historical.
