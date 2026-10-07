---
name: create-spec
description: Create or refine an implementation-ready feature Spec from a PRD, GitHub Issue, report, existing reference, or direct request, grounded in repository rules and real code paths.
---

# Create a Spec

Create or revise one implementation-ready feature Spec in the current task. Do not create
another user-owned task. Use a direct maintenance workflow when the requested work does not
need a feature Contract.

## Workflow

Follow these stages in order. Research may precede clarification; writing or modifying
`spec.md` may not. The clarification gate is a hard stop, not a documentation step: never
create a draft Spec, design handoff or other contract artifact and then ask the user
to resolve a material product or technical choice that the artifact already encodes. Research
outputs such as inspected screenshots or notes may be saved when needed, but the feature
Spec remains unwritten until the gate passes.

### 1. Establish repository authority

1. Read the root and applicable nested `AGENTS.md` files.
2. Read `documentation/rules.md`, select Rules from affected paths and behavior, and read
   every selected Rule in full.
3. Read the actual source request and the applicable Architecture, Modules, PRD, Design and
   Tooling documents.
4. Inspect the worktree and preserve unrelated or user-owned changes.

Repository authority overrides generic workflow assumptions. Use actual repository paths,
commands, versions, terminology and source systems. Never invent tickets, migrations,
framework conventions or validation categories.

When a PRD is authoritative, consume each applicable `PRQ-*` through its `Outcome`, `Actors`,
`Consumes`, `Provides`, `Capabilities` and `Experience`. The PRD does not own Acceptance
Criteria or User Stories: derive the Spec's `FR-*` and `AC-*` contract from those requirement
fields instead of expecting, reconstructing or requesting duplicate PRD sections. Use User
Journeys as cross-`PRQ-*` scenario context. Treat the Product Dependency Graph as product
capability and authoritative-fact dependency evidence only, never as implementation order,
foundation work, agent execution order.

The `Implemented` checkbox records conclusion state; it does not define product behavior or
Spec scope. This workflow never changes an applicable requirement from `[ ]` to `[x]`. Before
authoring the Spec, return every materially amended applicable requirement to `[ ]`, including
one that was previously checked, while leaving unchanged requirement checkboxes untouched.

### 2. Classify and research

Record the real source as `prd`, `issue`, `report` or `direct-request`. Choose depth from
delivery risk, not file or endpoint counts:

| Mode | Use when |
| --- | --- |
| `compact` | One cohesive outcome, stable dependencies, limited ownership and low delivery risk. |
| `complete` | Multiple applications or layers, persistence/integration changes, several UI states, or material security, concurrency, migration or operational risk. |

#### Direct repository research

The Orchestrator owns consequential decisions and verifies repository facts. Delegate independent
research lanes when useful and required by AGENTS.md, then reconcile their findings.
Inspect every affected boundary for:

- current paths, declarations, exports, registration, configuration and generated files;
- current control/data flow, reusable contracts and the exact technical gap;
- contracts crossing packages, applications, providers or persistence;
- established implementation and testing patterns to reuse;
- installed versions and current library documentation when APIs evolve;
- security, tenancy, concurrency, transactions, side effects, failures, SSR/hydration,
  migration and rollout risk.

Treat documentation as intent when it conflicts with code. Surface the discrepancy and
record any intentional deviation from supplied references.

### 3. Clarify product and technical choices

After research and the verification pass, and before creating or modifying
`spec.md`, identify every unresolved choice that could materially alter the
Contract.

#### Grilling protocol

Map unresolved choices as a design tree: every decision branches into decisions that depend on
it. Work the tree in rounds:

- The frontier is every decision whose prerequisites are already settled.
- Keep one monotonically increasing question sequence across all rounds; never restart numbering.
- Ask the whole frontier in one round, numbering each question and giving repository evidence,
  materially different choices, a recommendation and the consequence of accepting it. When a
  choice depends on an earlier answer, defer it instead of embedding a speculative default.
- Use this format for every round:

  ```yaml
  ❓ **Q1** - **<question title>**: <question body, including choices when useful>

  ➡️ <recommended answer>

  ---

  ❓ **Q2** - **<question title>**: <question body>

  ➡️ <recommended answer>
  ```

- Wait for the user's answers before recomputing the next frontier.
- Maintain a decision ledger after every answer round. Reconcile each answer to its question,
  record accepted recommendations and explicit alternatives, call out contradictions, and carry
  only unanswered or newly unlocked choices into the next frontier. Do not silently interpret a
  partial answer as acceptance of every recommendation.
- When the client supplies response annotations, treat an annotation such as `ok`, `accepted` or
  an equivalent confirmation as acceptance of that selected question's recommendation. Treat an
  annotation naming an alternative as selection of that alternative. A later explicit annotation
  overrides an earlier unannotated selection of the same question. Repeated selections without a
  comment provide context but do not override an explicit annotated answer. Address every supplied
  annotation using the client-required inline annotation directive in the next response.
- Research repository facts directly; do not ask the user for facts that can be inspected.
- Keep product, technical, design and validation decisions with the user unless repository
  authority already fixes them. Record decisions, dependencies and assumptions.
- Challenge contradictions and risks. When the frontier is empty, present the shared
  understanding and request explicit confirmation before authoring or amending `spec.md`.

#### Exhaustive questionnaire mode

When the user asks to decide, question or approve **every technical decision**, make the grilling
protocol exhaustive rather than collapsing several decisions into a generic architecture choice.
Research first, then continue dependency-ordered rounds until every consequential
implementation-shaping alternative is settled. Cover each applicable branch below:

- owning module, application, layer, declaration and composition boundary;
- technology, protocol, dependency and provider/client abstraction;
- API route, method, authentication, authorization lifetime, payload, serialization, validation,
  versioning and compatibility;
- source of truth, transaction/commit boundary, persistence model, migration generation,
  indexing, tenancy and historical-value behavior;
- synchronous/asynchronous flow, publication timing, delivery guarantee, idempotency,
  deduplication, ordering, concurrency, buffering, backpressure and capacity limits;
- connection/subscription lifecycle, retries, timeouts, heartbeat, reconnect, offline/hidden
  behavior, replay and cleanup;
- multi-process, multi-tab, multi-device or multi-tenant coordination and degraded fallbacks;
- UI state ownership, component/widget boundaries, interaction semantics, exact copy/timing,
  focus, keyboard, announcement, responsive behavior, stacking and design-reference gaps;
- error translation, user-visible failure behavior, observability, privacy and secret handling;
- automated test ownership, indirect versus direct boundaries, manual fixtures/services,
  viewports, screenshots and evidence targets.

Ask about exact operational values when they affect the Contract—for example duration, retry
schedule, heartbeat interval, connection cap, queue size, viewport or concurrency limit. Continue
from broad prerequisites to their dependent concrete choices: selecting SSE, for example, may
unlock route, authentication, payload, heartbeat, reconnection, authorization-lifetime,
backpressure and browser-ownership decisions.

Exhaustive does not mean asking the user to restate repository facts or approve conventions with
only one legal answer. Resolve those directly from authority and include them in the final shared
understanding. Do not ask about incidental implementation syntax or algorithms that cannot alter
observable behavior, architecture, ownership, operability, security, validation or the Builder's
contract.

Before declaring the frontier empty in exhaustive mode:

1. replay the decision ledger against every affected runtime boundary and Rule-selected layer;
2. inspect the chosen combination for newly exposed decisions and contradictions;
3. state any authority correction or design artifact required before authoring;
4. present one consolidated shared-understanding summary containing the resolved product,
   technical, design and validation decisions; and
5. request explicit confirmation. A typo-tolerant unambiguous confirmation such as `confirmed`
   or `comfirmed` passes this final gate.

Do not create or modify the Spec before that confirmation. After confirmation, apply approved
authority changes first, create the artifacts, run integrity checks and the applicable independent
Spec review. If authoring or review exposes a genuinely material unasked choice, return to the
questionnaire with the next question number; otherwise resolve repository-fixed compatibility
corrections directly and resume the same Reviewer.

| Area | Clarify when unresolved |
| --- | --- |
| Product | Actors, permissions, success/rejection behavior, states, scope and deferrals. |
| Technical | Ownership, technologies, dependencies, APIs, transactions, concurrency, failure semantics, integrations and runtime constraints. |
| Design | Authoritative frames/states, responsive behavior, missing references and allowed deviations. |
| Validation | Automated boundaries, manual flows, services, accounts/data, viewports and evidence. |

When screenshot analysis reveals a feature, state or behavior that is not explicit in the
request, PRD or existing authoritative documentation, ask a clarifying question before
writing the Spec. This includes inferred actions, permission boundaries, read-only versus
editable fields, session/device controls, deletion or destructive controls, status badges,
workflow transitions, empty/loading/error behavior, role-specific differences, and any
element whose presence suggests product behavior rather than decoration. Do not silently
promote an inferred screenshot detail into an FR, AC, API, route or implementation scope.

Each screenshot-derived clarification must include:

- the screenshot path and exact visible element/state that triggered the question;
- the current request/PRD statement, or an explicit note that no authoritative statement
  exists;
- the proposed interpretation and at least one materially different alternative;
- the recommended answer and the impact on product scope, permissions, technical boundaries
  and validation if accepted;
- whether the screenshot detail is required behavior, visual-only treatment, intentionally
  excluded scope or an unresolved ambiguity.

During initial Spec creation, if the user cannot resolve the question or has not answered,
stop and return the question with its evidence, recommendation, alternatives and impact; do
not write `spec.md` or encode the unresolved choice in a draft. The `draft` status is for an
existing Spec under active authoring/amendment, or for a user-explicitly accepted documented
assumption—not a reason to ask a material question after creating the artifact. If repository
authority already resolves the choice, cite that authority and record the interpretation
without asking the user to re-decide an established contract.

Resolve a choice from repository authority when one safe answer is already established.
Otherwise ask the user concise questions. For each material question, provide repository
evidence, a recommendation, alternatives and impact. Do not ask the user to decide facts
already fixed by authoritative documents or established code.

Write only after every material ambiguity is answered or the user explicitly accepts a
documented assumption. Before the first write, perform a final ambiguity scan across the
request, PRD, issue, screenshots, routes, permissions, validation states, API fields and
technical ownership; if any material choice remains, ask it now and end the turn.

#### Authority changes

When the Spec requires an authoritative document to change:

1. identify the current statement, evidence, proposed change and affected scope;
2. obtain explicit user approval for product behavior, global Rules, architecture,
   ownership or another normative change;
3. update the PRD, Rule, Architecture, Modules, Design or Tooling document first;
4. reread the updated authority and recompute the Rule Pack before writing the Spec.

Feature-specific behavior and choices belong in the Spec. Reusable conventions belong in
their authoritative document. If implementation exposes a missing or easily misapplied
reusable Rule, add a focused `## Antipatterns to Avoid` entry stating the prohibited
pattern, required alternative and validating proof. Record the authority change in the
Spec, reread the Rule and rebuild the Rule Pack.

### 4. Create the artifacts

Create `documentation/features/<domain>/<feature>/spec.md` using short kebab-case names.
For a distinct change to a concluded feature, use
`documentation/features/<domain>/<feature>/changes/<change-name>/spec.md`.
Create saved `design/handoff.md` and references when UI is design-backed. Evaluation starts
at implementation kickoff and owns actual results, findings, unfinished ACs and the short
continuation handoff. Do not create a Plan.

```yaml
---
title: <title>
status: draft
revision: 1
source:
  type: <prd|issue|report|direct-request>
  ref: <actual-url|path|codex-task>
scope:
  - <affected workspace or module boundary>
last_updated_at: YYYY-MM-DD
---
```

Use `draft` while authoring or materially amending the contract, `open` when implementation
ready, `in_progress` during implementation or conclusion, and `completed` only after final
PR CI and delivery closure. Findings do not add Spec statuses.

## Required Spec structure

Keep these five sections, scaling detail to risk and omitting irrelevant subsections.
State facts once and reference their IDs elsewhere. Specs own the expected contract;
the agent chooses execution order, decomposition, delegation and routine internal structure.

### 1. Context and scope

State the objective, actual source, compact/complete depth, current behavior, product gap,
included behavior, exclusions, accepted assumptions and resolved product decisions.
Map applicable PRQ IDs or source statements to `full`, `partial` or `deferred` coverage.
Partial delivery never weakens the PRD or checks its Implemented box.

### 2. Implementation Contract

Define observable requirements as `FR-*`. Keep internal paths and algorithms out of them.
When the authoritative PRD/source defines `PRQ-*` requirements, map every FR to one or more
real `PRQ-*` identifiers; do not invent requirement IDs. If no PRQ taxonomy exists, map each FR
to the actual source statement or Issue acceptance instead. Show the mapping directly in the FR
table or an adjacent FR-to-PRQ/source traceability table.

For every applicable PRD `PRQ-*`, derive the FR and AC set from the complete requirement
contract:

- `Outcome` defines the user or business result the Spec must deliver;
- `Actors` define initiators, autonomous triggers and applicable authorization perspectives;
- `Consumes` and `Provides` define product capability or authoritative-fact boundaries and
  cross-requirement/module obligations, not implementation dependencies or delivery order;
- `Capabilities` define observable behavior, validation, limits, transitions, consistency,
  history and exceptions;
- `Experience` defines user-visible interaction, feedback, states, responsiveness and
  accessibility when present.

Do not reduce a requirement to only its Capabilities or Experience bullets. Synthesize FRs from
the six fields, then derive Spec-owned `AC-*` criteria that prove those FRs. Use PRD User
Journeys to identify end-to-end and alternate scenarios spanning one or more requirements and
to inform AC/MV coverage without copying journeys into a second requirement system. Do not
look for PRD Acceptance Criteria or User Stories; their absence is intentional.

Use a requirements table when there is more than one requirement:

| ID | PRQ/source coverage | Required behavior |
| --- | --- | --- |
| `FR-01` | `<real PRQ-* IDs or source anchor>` | `<observable behavior and applicable restrictions>` |

Map every requirement to acceptance evidence using this required table. Every AC must link to
one or more FRs, and every FR must link to one or more ACs; do not leave either direction
implicit:

| ID | FR coverage | Requirement | Given | When | Then | Expected evidence |
| --- | --- | --- | --- | --- | --- | --- |
| `AC-01` | `FR-01` | `<observable criterion>` | `<precondition>` | `<action>` | `<observable result>` | `<test boundary and/or MV-01>` |

Cover applicable success, rejection, authorization, tenant isolation, concurrency,
provider failure, session/hydration restoration, accessibility, performance and secret
boundaries. Every FR must have acceptance evidence. `MV-*` identifies a manual scenario;
it is not another requirement system.

Add **Cross-cutting restrictions** only when needed. Use a `Concern | Contract` table when
several restrictions apply.

#### Design Contract — conditional

New design bundles use `design/handoff.md` as the canonical filename. Existing bundles
may retain `design/manifest.md`; consuming workflows use that legacy file only when
`design/handoff.md` is absent. Do not create both files for a new bundle.

For design-backed UI, link `design/handoff.md` and define required frames/states,
screenshot coverage, exact viewports, responsive behavior, implementation surfaces and
allowed deviations. Keep the detailed frame inventory in the handoff, not `spec.md`.

#### Implementation-facing design handoff

Implementation and UI-validation agents must not use Pencil MCP or the live canvas.
Their design inputs are the saved handoff and screenshots; node IDs are provenance only.
Require Playwright CLI for browser interaction and fresh runtime capture comparisons.
The Spec authoring workflow may use Pencil to inspect/design and export those inputs.
If required details are missing, treat them as a Design Contract gap and complete the
saved handoff/reference bundle before handing the surface to implementation.

`design/handoff.md` must go beyond a screenshot inventory. Preserve the inventory and
add measured design specifications for the affected regions/components so a Builder can
implement the visual result without guessing or reopening the design tool:

- source node/component IDs and mapping to existing repository surfaces;
- container sizing, padding, gaps, alignment, columns and content-driven height;
- font family, size, weight, line-height when explicitly defined, and text wrapping;
- color, border, radius, shadow and icon dimensions, mapped to existing tokens;
- desktop/narrow/paper behavior where applicable, including focus/disabled/error states;
- differences between inspected design values and existing component defaults, with
  repository-governed mappings and approved deviations clearly distinguished;
- comparison checklist tied to the existing AC/MV/evidence targets.

Use concise property tables with `Element/source | Design value | Repository mapping |
Responsive/state guidance` or equivalent columns. Read actual design properties and
existing source; never infer exact measurements from screenshots, claim unspecified
line-height values, or invent tokens. Label measured reference values separately from
approved responsive assumptions. Keep product/runtime behavior in the Spec; the handoff
describes its visual realization without introducing new behavior.

#### Mandatory screenshot analysis and coverage proposal

The Spec creator must visually inspect every supplied design screenshot before writing the
Design Contract. Filenames, dimensions, OCR or a textual description are not substitutes
for opening and analyzing the image. For each screenshot, record an implementation-facing
inventory covering:

- exact viewport and visible route/surface/state;
- page regions, containers, columns, cards, rows, controls, icons and status indicators;
- visible copy, labels, actions, read-only/disabled/selected/error/loading states;
- hierarchy, alignment, spacing relationships, dimensions, typography, color tokens,
  borders, radii, shadows and responsive implications;
- elements intentionally absent, ambiguous, or likely to be confused with adjacent scope;
- the FR/AC criteria and implementation surface that the screenshot must validate.

The design handoff must preserve that analysis in a concise table or linked design note:

| Reference | Route/surface/state | Viewport | Required visible inventory | Interaction/state coverage | Ambiguities or exclusions | Validation target |
| --- | --- | --- | --- | --- | --- | --- |
| `<screenshot>` | `<route and state>` | `<width × height>` | `<elements and hierarchy>` | `<controls/states>` | `<explicit notes>` | `<AC/MV/validation-artifact identifier>` |

After reviewing the supplied screenshots, the Spec creator must decide whether additional
screenshots are necessary. Suggest them whenever the supplied bundle leaves a material gap,
including missing loading, error, empty, success, disabled, dialog, dropdown, permission,
role, tenant, mobile or breakpoint states. Each suggestion must state:

- the proposed route/surface/state and role or fixture;
- the exact viewport;
- why the supplied references are insufficient;
- the FR/AC/MV criteria it would clarify;
- whether it is **required before implementation** or **recommended supplemental coverage**.

Required supplemental screenshots must be captured and added to the feature-local design
bundle before the Spec becomes `open`, or the user must explicitly accept a documented
visual assumption. Recommended screenshots may be deferred only when the handoff records
the deferral, rationale and planned validation state.

During Spec research, use the Pencil skill and MCP for `.pen` contents. Never inspect a
`.pen` file through shell or generic filesystem tools. Before setting the Spec to `open`:

1. inspect editor state/schema and every relevant frame/state, component, variable,
   viewport and node name;
2. save one screenshot per relevant frame/state under the feature-local `design/` folder;
3. create a handoff using this table:

   | Reference | Pencil file/node | State | Viewport | Screenshot | Implementation surface | Tokens/components | Validation |
   | --- | --- | --- | --- | --- | --- | --- | --- |
   | `<name>` | `<file and node ID>` | `<state>` | `<width × height>` | `<relative link>` | `<route/widget>` | `<mapped primitives>` | `<required comparison>` |

4. record layout-problem inspection for every mapped node;
5. define responsive behavior when a required viewport has no Pencil frame.

For every screenshot, verify that the handoff path exists and is non-empty, the file is a
valid image, visual inspection succeeds, dimensions match the declared viewport or record
the deliberate export scale, and screenshot count matches handoff coverage. An MCP export
response alone is not proof that the file exists in the shared workspace. Also verify that
every supplied screenshot has a completed visual inventory, every required supplemental
capture is present or explicitly accepted as an assumption, and every reference/state has a
planned implementation comparison and evidence target.

If export cannot reach a shared repository path, keep the Spec `draft` and report the
artifact blocker. Builders and the Orchestrator use the saved bundle without live Pencil.
Reopen Pencil only when the Design Contract changes or the user requests a refresh.

For Pencil export, use the available skill and current MCP schema rather than hardcoded
host paths or API examples. Inspect editor state with `include_schema: true` when unknown,
export to the shared feature-local design directory, and verify saved images with normal
image tools. Never inspect `.pen` contents through filesystem tools. Refresh the saved
bundle when the Design Contract changes.

### 3. Technical Contract

Describe affected modules/applications, existing integration surfaces and proposed runtime
and data flow. Cite existing repository paths to establish ownership, reusable patterns or
public boundaries; do not prescribe every future file or declaration.

Include applicable contracts:

- public routes, methods, authentication/authorization, request/response schemas, status and
  error semantics, compatibility and affected consumers;
- shared exported interfaces, events and provider boundaries, producer/consumer obligations,
  serialization and side-effect timing;
- authoritative data, tenant scoping, transaction boundaries, relevant fields, indexes and
  constraints, migration generation/delivery, historical data and rollout risks;
- consequential concurrency, idempotency, retries, timeouts, lifecycle and degraded behavior;
- required UI states, browser/SSR boundaries, responsive and accessibility guarantees;
- generated artifacts, authoritative inputs and generation commands where affected.

Give exact details where compatibility or correctness depends on them. Public names,
payload fields and required migration/artifact locations may be contracts. New internal
paths, private signatures, widget trees, hook names, task ownership and phase order remain
agent decisions governed by Rules. Do not require exhaustive layer/path ledgers, unchanged
entity schemas, per-file test plans or duplicate wiring inventories. A missing invented
future internal path is not a material ambiguity.

Record only consequential choices with credible alternatives:

| Decision | Chosen approach | Alternative | Reason and accepted trade-off |
| --- | --- | --- | --- |
| `<decision>` | `<approach>` | `<real alternative>` | `<reason, cost or limitation>` |

Omit this table when authority fixes the approach. Unresolved material decisions return to
clarification rather than becoming defaults.

### 4. Validation Contract

Make every AC checkable through a concrete allowed automated boundary and/or executable
manual checker, prerequisites, observable assertion and evidence destination. Name existing
suites/files when known. New checkers may be specified by allowed ownership boundary and
scenario without inventing future filenames; the implementing agent adds actual tests.

| Acceptance | Checker and boundary | Expected assertion | Evidence target |
| --- | --- | --- | --- |
| `AC-01` | `<existing suite, permitted consumer boundary or MV-01>` | `<observable result and side effect>` | `evaluation.md` |

Cover applicable success, rejection, authorization/tenant boundaries, persistence/provider
effects, failures and UI recovery. Tests assert behavior rather than mirrored implementation.
Direct tests for `indirect` or `excluded` sources are forbidden; name the allowed consumer
boundary instead. Respect actual coverage policy and thresholds.

For each `MV-*`, specify mapped ACs, services/health checks, accounts/data, starting route and
state, viewport, numbered actions and keyboard path, visible result, final URL and relevant
network/persisted effect, console/failed-request checks, evidence and cleanup. Keep mocked
transport distinct from real authenticated/server-backed proof.

| Command | Purpose and prerequisites |
| --- | --- |
| `<real command from Tooling or package scripts>` | `<affected boundary and services>` |

List applicable code/type/architecture/test-integrity, coverage, build and integration checks
for affected workspaces. Include REST-client route/example parity when HTTP routes change.
Use Playwright CLI for browser flows, narrow viewport and keyboard coverage, fresh screenshots
and comparison with every saved design reference. Runtime captures belong in ignored
`test-results/` or CI artifacts; record paths/results in Evaluation.

Run applicable integration suites after the candidate is integrated. Correct failures and
rerun affected checks until passing; the Spec does not choreograph attempts. Require an
independent Visual Reviewer only when requested by the user or contract, after current
captures exist. Name references/states/viewports; the Orchestrator owns official EV evidence.

### 5. Documentation alignment and revision history

Record governing authorities and the selected Rule Pack with their scope. Record material
contract revisions, dates and reasons; omit implementation attempts and test results.

| Authority | Applies to | Alignment |
| --- | --- | --- |
| `<actual PRD, Rule, Architecture, Modules, Design or Tooling path>` | `<concern>` | `<confirmed or approved change>` |

| Revision | Date | Material change and reason |
| --- | --- | --- |
| `1` | `YYYY-MM-DD` | `<source decision>` |

## Independent Spec review

Before changing any draft Spec to `open`, activate one read-only
[Spec Reviewer](../agents/spec-reviewer-agent.md) for the whole contract. Repeat review for
material amendments. Supply the draft revision, Architecture/Modules, selected Rule Pack,
existing boundaries, public contracts, consequential decisions, test-integrity policy,
assumptions and exclusions.

The Reviewer audits Architecture, ownership, dependency direction, public boundaries,
generated artifacts and Rules, including permitted checker ownership. It does not require
invented internal paths, Plans, implementation results or runtime evidence. It does not assess
product completeness or design fidelity, edit files, choose behavior or decide Spec status.

Verify findings against authority, resolve verified blockers, and resume the same Reviewer
for affected corrections. Newly exposed material ambiguity returns to clarification.
The Orchestrator owns the opening decision; review is part of authoring, not an extra
user-facing approval stage.

## Integrity gate and handoff

Before setting the Spec to `open`, verify:

- source, metadata, status and revision agree;
- applicable PRQ Outcome, Actors, Consumes, Provides, Capabilities and Experience have FR/AC
  coverage, with User Journeys informing end-to-end and alternate scenarios;
- every FR has AC coverage and every AC has a concrete checker;
- material ambiguities and authority changes are resolved, with amended PRQ boxes unchecked;
- public boundary/data/migration contracts and consequential decisions are precise, while
  routine internal structure remains agent-owned;
- saved references exist, were visually inspected, cover required states/viewports and map
  to acceptance checks; required missing design information is resolved;
- commands/prerequisites are real, checker ownership follows Rules, and mocked evidence
  cannot be mistaken for real integration proof;
- authority links, tables and artifact structure are valid;
- the current draft passed independent compatibility review with verified blockers resolved.

Return the clickable Spec path, revision/status, outcome and exclusions, important decisions,
design/checker coverage and accepted risks. The next workflow is `implement-spec`.

## Material amendments

Before conclusion, amend the same Spec: set `draft`, increment revision, clarify material
choices, update approved authority first, refresh affected contracts/design/checkers and
mark affected evidence historical. Repeat authoring integrity and independent Spec review,
then return to `open` for autonomous implementation and integrated verification.
Evidence unaffected by the amendment remains reusable when its claims and prerequisites
remain current. A distinct change to a concluded feature uses a new change Spec.
