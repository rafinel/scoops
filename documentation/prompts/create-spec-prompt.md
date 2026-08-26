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
create a draft Spec, design manifest, Plan, or other contract artifact and then ask the user
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

When a PRD is authoritative, consume each applicable `REQ-*` through its `Outcome`, `Actors`,
`Consumes`, `Provides`, `Capabilities` and `Experience`. The PRD does not own Acceptance
Criteria or User Stories: derive the Spec's `RF-*` and `CA-*` contract from those requirement
fields instead of expecting, reconstructing or requesting duplicate PRD sections. Use User
Journeys as cross-`REQ-*` scenario context. Treat the Product Dependency Graph as product
capability and authoritative-fact dependency evidence only, never as implementation order,
foundation work, execution waves or Plan sequencing.

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

#### Parallel Searcher research

Use [`searcher-agent.md`](../agents/searcher-agent.md) for bounded codebase research. The
Orchestrator must complete the authority preflight in stage 1 itself before dispatching
Searchers; Searcher reports do not replace the Orchestrator's required reading of
`AGENTS.md`, repository authority, or the selected Rules.

Prioritize parallel research over serial exploration:

- identify independent lanes from real ownership and technical boundaries;
- for a compact Spec with only one cohesive boundary, the Orchestrator may research it
  directly or use one Searcher;
- when two or more independent lanes are affected, dispatch all applicable Searchers in
  the same parallel wave;
- for a complete Spec, dispatch the affected `Searcher Core`, `Searcher Server`, and
  `Searcher Web` lanes concurrently;
- add `Searcher Integration` only when producer-consumer contracts, generated artifacts,
  or cross-workspace wiring form a distinct research lane;
- do not create a mandatory separate Validation Searcher: each owning lane reports its
  existing tests, fixtures, commands, and validation gaps.

Give every Searcher a bounded question, included paths, explicit search limits, applicable
authority and Rules, known starting declarations, sibling lanes, and the expected report
shape. Searchers are read-only sibling subagents in the current task. They do not author
the Spec, modify authority, create artifacts, make product or architecture decisions, ask
the user questions, or create other agents.

After all dispatched Searchers return, the Orchestrator must:

1. join the reports by path, declaration, responsibility, and runtime boundary;
2. deduplicate findings and resolve conflicting reports through direct inspection;
3. verify every consequential claim before using it in clarification or the Spec;
4. trace each cross-lane producer → contract → consumer relationship and identify missing,
   partial, or conflicting ownership;
5. aggregate material ambiguities for stage 3 instead of letting a Searcher resolve them;
6. complete any blocked or uncovered research directly, or keep the ambiguity unresolved.

Searcher reports are research input, not durable SDD artifacts or authoritative evidence.
Do not paste raw reports into the Spec. Do not begin clarification or Spec authoring until
the applicable reports have been joined and the Orchestrator has completed its verification
pass.

The Searchers and Orchestrator must collectively inspect every affected boundary for:

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

After the Searcher join and verification pass, and before creating or modifying
`spec.md`, identify every unresolved choice that could materially alter the
Contract.

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
promote an inferred screenshot detail into an RF, CA, API, route or implementation scope.

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
For new work against a concluded feature, create
`documentation/features/<domain>/<feature>/changes/<change-name>/spec.md`.

| Artifact | Creation point | Purpose |
| --- | --- | --- |
| `spec.md` | This workflow | Product, technical and validation Contract. |
| `design/manifest.md` and screenshots | During Spec authoring when UI is design-backed | File-backed implementation and visual-validation references. |
| `plan.md` | Only when Plan-backed execution is recommended | Execution phases, dependencies and durable progress ledger. |
| `evaluation.md` | At implementation kickoff | Actual validation evidence, findings and lessons learned. |

Use only this metadata and omit empty optional fields:

```yaml
---
title: <title>
status: draft
revision: 1
source:
  type: <prd|issue|report|direct-request>
  ref: <actual-url|path|codex-task>
scope:
  - <workspace|directory|file>
last_updated_at: YYYY-MM-DD
---
```

| Status | Meaning |
| --- | --- |
| `draft` | Contract authoring or amendment is active. |
| `open` | Contract is complete and implementation-ready. |
| `in_progress` | Implementation or conclusion is active. |
| `completed` | Final PR CI passed and delivery is closed. |

Findings, blockers and verdicts belong in `evaluation.md`; they do not create additional
Spec statuses.

## Required Spec structure

Write exactly these five top-level sections:

| Section | Purpose |
| --- | --- |
| `1. Context and scope` | Explain the outcome, baseline, boundaries and product alignment. |
| `2. Implementation Contract` | Define observable requirements, acceptance and design obligations. |
| `3. Technical Contract` | Define the repository-grounded implementation delta and runtime responsibilities. |
| `4. Validation Contract` | Map every acceptance criterion to automated and/or manual proof. |
| `5. Documentation alignment and revision history` | Record governing authority, Rule Pack and material revisions. |

Keep compact Specs short. Omit conditional subsections instead of writing empty or “not
applicable” content. State each fact once and reference its ID, Contract or path elsewhere.
The Spec owns expected behavior and contracts; the Plan owns execution; `evaluation.md`
owns actual evidence and findings.

### Markdown presentation rules

Use Markdown tables whenever repeated items share the same attributes or exact mapping is
important. Tables are required for:

- scope/product alignment when more than one item is involved;
- RF/REQ/CA traceability;
- design-frame inventory in `design/manifest.md`;
- implementation paths grouped by affected application and layer;
- technical decisions, when any are recorded;
- validation coverage, documentation alignment, Rule Pack and revision history.

Keep cells concise. Do not hide multi-step behavior, long rationale or code blocks inside
table cells. Use prose for context and constraints, numbered steps for executable manual
flows, signatures or JSON only when a boundary remains ambiguous, and Mermaid only when a
flow is materially clearer as a diagram. Avoid one-row tables unless the columns provide
real comparison or traceability value.

When writing Mermaid, quote labels containing paths, parentheses, brackets, braces, pipes,
slashes, backslashes, quotes or other shape-delimiter punctuation.

### 1. Context and scope

Include:

- **Objective and source:** desired outcome, actual source and selected mode;
- **Current behavior and product gap:** user-visible baseline and missing behavior;
- **Scope and product alignment:** included/excluded behavior and delivered, partial or
  deferred PRD outcomes without weakening the PRD;
- **Product decisions and assumptions:** resolved product choices and explicitly accepted
  premises, not an interview transcript.

Prefer these tables when applicable:

| Area | In scope | Out of scope |
| --- | --- | --- |
| `<product area>` | `<included behavior>` | `<excluded adjacent behavior>` |

| Source requirement | Delivery | Notes |
| --- | --- | --- |
| `<PRD requirement or request>` | `full`, `partial` or `deferred` | `<boundary without weakening authority>` |

Do not put repository implementation evidence or technical decisions in this section.

### 2. Implementation Contract

Define observable requirements as `RF-*`. Keep internal paths and algorithms out of them.
When the authoritative PRD/source defines `REQ-*` requirements, map every RF to one or more
real `REQ-*` identifiers; do not invent requirement IDs. If no REQ taxonomy exists, map each RF
to the actual source statement or Issue acceptance instead. Show the mapping directly in the RF
table or an adjacent RF-to-REQ/source traceability table.

For every applicable PRD `REQ-*`, derive the RF and CA set from the complete requirement
contract:

- `Outcome` defines the user or business result the Spec must deliver;
- `Actors` define initiators, autonomous triggers and applicable authorization perspectives;
- `Consumes` and `Provides` define product capability or authoritative-fact boundaries and
  cross-requirement/module obligations, not implementation dependencies or delivery order;
- `Capabilities` define observable behavior, validation, limits, transitions, consistency,
  history and exceptions;
- `Experience` defines user-visible interaction, feedback, states, responsiveness and
  accessibility when present.

Do not reduce a requirement to only its Capabilities or Experience bullets. Synthesize RFs from
the six fields, then derive Spec-owned `CA-*` criteria that prove those RFs. Use PRD User
Journeys to identify end-to-end and alternate scenarios spanning one or more requirements and
to inform CA/MV coverage without copying journeys into a second requirement system. Do not
look for PRD Acceptance Criteria or User Stories; their absence is intentional.

Use a requirements table when there is more than one requirement:

| ID | REQ/source coverage | Required behavior |
| --- | --- | --- |
| `RF-01` | `<real REQ-* IDs or source anchor>` | `<observable behavior and applicable restrictions>` |

Map every requirement to acceptance evidence using this required table. Every CA must link to
one or more RFs, and every RF must link to one or more CAs; do not leave either direction
implicit:

| ID | RF coverage | Requirement | Given | When | Then | Expected evidence |
| --- | --- | --- | --- | --- | --- | --- |
| `CA-01` | `RF-01` | `<observable criterion>` | `<precondition>` | `<action>` | `<observable result>` | `<test boundary and/or MV-01>` |

Cover applicable success, rejection, authorization, tenant isolation, concurrency,
provider failure, session/hydration restoration, accessibility, performance and secret
boundaries. Every RF must have acceptance evidence. `MV-*` identifies a manual scenario;
it is not another requirement system.

Add **Cross-cutting restrictions** only when needed. Use a `Concern | Contract` table when
several restrictions apply.

#### Design Contract — conditional

For design-backed UI, link `design/manifest.md` and define required frames/states,
screenshot coverage, exact viewports, responsive behavior, implementation surfaces and
allowed deviations. Keep the detailed frame inventory in the manifest, not `spec.md`.

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
- the RF/CA criteria and implementation surface that the screenshot must validate.

The design manifest must preserve that analysis in a concise table or linked design note:

| Reference | Route/surface/state | Viewport | Required visible inventory | Interaction/state coverage | Ambiguities or exclusions | Validation target |
| --- | --- | --- | --- | --- | --- | --- |
| `<screenshot>` | `<route and state>` | `<width × height>` | `<elements and hierarchy>` | `<controls/states>` | `<explicit notes>` | `<CA/MV/validation-artifact identifier>` |

After reviewing the supplied screenshots, the Spec creator must decide whether additional
screenshots are necessary. Suggest them whenever the supplied bundle leaves a material gap,
including missing loading, error, empty, success, disabled, dialog, dropdown, permission,
role, tenant, mobile or breakpoint states. Each suggestion must state:

- the proposed route/surface/state and role or fixture;
- the exact viewport;
- why the supplied references are insufficient;
- the RF/CA/MV criteria it would clarify;
- whether it is **required before implementation** or **recommended supplemental coverage**.

Required supplemental screenshots must be captured and added to the feature-local design
bundle before the Spec becomes `open`, or the user must explicitly accept a documented
visual assumption. Recommended screenshots may be deferred only when the manifest records
the deferral, rationale and planned validation state.

During Spec research, use the Pencil skill and MCP for `.pen` contents. Never inspect a
`.pen` file through shell or generic filesystem tools. Before setting the Spec to `open`:

1. inspect editor state/schema and every relevant frame/state, component, variable,
   viewport and node name;
2. save one screenshot per relevant frame/state under the feature-local `design/` folder;
3. create a manifest using this table:

   | Reference | Pencil file/node | State | Viewport | Screenshot | Implementation surface | Tokens/components | Validation |
   | --- | --- | --- | --- | --- | --- | --- | --- |
   | `<name>` | `<file and node ID>` | `<state>` | `<width × height>` | `<relative link>` | `<route/widget>` | `<mapped primitives>` | `<required comparison>` |

4. record layout-problem inspection for every mapped node;
5. define responsive behavior when a required viewport has no Pencil frame.

For every screenshot, verify that the manifest path exists and is non-empty, the file is a
valid image, visual inspection succeeds, dimensions match the declared viewport or record
the deliberate export scale, and screenshot count matches manifest coverage. An MCP export
response alone is not proof that the file exists in the shared workspace. Also verify that
every supplied screenshot has a completed visual inventory, every required supplemental
capture is present or explicitly accepted as an assumption, and every reference/state has a
planned implementation comparison and evidence target.

If export cannot reach a shared repository path, keep the Spec `draft` and report the
artifact blocker. Builders and the Orchestrator use the saved bundle without live Pencil.
Reopen Pencil only when the Design Contract changes or the user requests a refresh.

#### Pencil node export workflow

When exporting a design-backed Spec's Pencil frames or interaction states, use this
workflow. `.pen` files are encrypted; never read or edit them with shell tools or generic
filesystem APIs.

1. Load the active Pencil editor state and schema:

   ```ts
   mcp__pencil__get_app_state({
     include_canvas_design: true,
     include_schema: true,
     include_scripts_and_shaders: false,
   })
   ```

2. Confirm each node ID exists and capture it for visual inspection:

   ```js
   TakeScreenshot(["<frame-id>", "<interaction-state-id>"]);
   ```

3. Export through the WSL UNC path. Use `String.raw` so JavaScript preserves the
   backslashes; a normal `/home/...` path may be written inside Pencil's isolated
   environment and appear successful without reaching the repository:

   ```js
   Export(
     ["<frame-id>", "<interaction-state-id>"],
     "png",
     String.raw`\\wsl.localhost\Ubuntu-22.04\home\<user>\projects\<repo>\documentation\features\<domain>\features\<feature>\design`,
     { scale: 1 },
   );
   ```

   Run the snippet with `mcp__pencil__execute` and the active Pencil `.pen` path.
   If the execute call fails, retry with its returned `editId` and `edits`; do not
   resend the failed snippet unchanged.

4. Verify the artifacts from the repository workspace, not from Pencil's response:

   ```sh
   find documentation/features/<domain>/features/<feature>/design \
     -maxdepth 1 -type f -printf '%f %s bytes\n' | sort
   file documentation/features/<domain>/features/<feature>/design/*.png
   ```

   Use `view_image` for visual inspection and verify that `file` reports valid,
   non-empty PNGs with dimensions matching the manifest. An MCP “Exported ...”
   response alone is not evidence that a shared file exists.

5. Add one manifest row per exported node with its ID, state, viewport/dimensions,
   relative PNG link, implementation surface, and visual validation requirement.
   If the UNC export cannot reach the workspace, keep the Spec `draft` and record
   the artifact blocker instead of claiming the Design Contract is satisfied.

### 3. Technical Contract

Translate the behavioral Contract into one repository-grounded implementation delta. A
Builder must be able to identify each owning boundary, declaration, dependency and runtime
guarantee without choosing new product behavior or architecture. Establish the technical
baseline, define the runtime solution and boundary crossings, then contract every affected
path in its owning application and layer.

Do not turn this section into an execution Plan. Specify required declarations and
semantics, not task order, implementation attempts or incidental algorithms. Do not repeat
RF/CA behavior, validation procedures or the same technical responsibility in multiple
subsections.

#### Current technical state

Record only relevant existing evidence: paths/declarations, current flow, reusable
contracts, generated artifacts, material versions, documentation/code discrepancies and
the exact gap. Use an `Evidence | Current responsibility | Gap` table when several facts
share that structure. This is the as-is baseline: do not inventory the repository, repeat
the user-visible baseline or describe planned files here.

Every baseline claim must be inspectable in the current repository or cited authority.
Distinguish an absent capability from an existing but incomplete or incorrectly wired one.
When documentation and code disagree, state which source governs the Contract and where
alignment occurs.

#### Solution and runtime flow

Explain the end-to-end runtime behavior without listing files:

- authoritative owner and entry point;
- synchronous and asynchronous boundary crossings;
- data/state transformations and serialization boundaries;
- authentication, authorization and tenant-context propagation;
- transaction start/commit boundaries, concurrency control and idempotency;
- side-effect timing, event publication and retry ownership;
- expected failure translation, recovery and partial-failure prevention.

Include only applicable concerns, but never silently omit one that can change correctness.
Add one compact Mermaid flow when three or more layers, state transitions or failure
branches make prose insufficient. Do not diagram every declaration or repeat details owned
by the layer tables.

When a typed payload, event, persisted state or provider result crosses two or more runtime
boundaries, add this table before the layer contracts. Record the canonical owner once and
reference its layer row rather than duplicating field definitions.

| Boundary | Producer | Consumer | Canonical contract | Mapping/guarantees | Failure ownership |
| --- | --- | --- | --- | --- | --- |
| `<HTTP, repository, event or provider boundary>` | `<declaration>` | `<declaration>` | `<type/schema and owning layer row>` | `<serialization, versioning, ordering or consistency>` | `<validator/translator and named failure>` |

#### Layer implementation contracts

Treat each application/package as a container with one or more affected layers. Use only
**Domain**, **Use cases**, **Interfaces**, **Validation**, **REST**, **Provision**,
**Database**, **Messaging**, **UI** and **Composition**. Create one subsection per affected
application/layer combination—for example, `packages/core — Domain`,
`packages/validation — Validation`, `apps/server — REST` or `apps/web — UI`—and omit
unaffected layers.

Every affected path appears exactly once with `Create`, `Modify`, `Generate` or `Remove`.
Verify that classification against the filesystem. Keep tests and generated artifacts in
their owning layer. Put root modules, registries, exports and cross-layer dependency wiring
under **Composition** instead of forcing them into a feature layer. Do not create a
separate file inventory or separate Domain, Integration or Persistence Contract.

Use repository-relative exact paths. A planned path is contractual only when repository
conventions establish its location; resolve uncertain placement before setting the Spec to
`open`. Group multiple declarations from one file in one row so the path still appears
once. Mention an unchanged dependency as baseline evidence or a consumer, not as an
affected path. For `Generate`, name the source command/input and generated output; never
contract a manual edit to a generated file.

For every row, name exact declarations rather than describing a file generically. Include
types, named errors, side-effect timing, exports, registration and generated outputs when
they are part of the contract. State both what changes and the runtime guarantee the change
must preserve. Reference RF/CA IDs only where they disambiguate the responsibility; the
Validation Contract remains the canonical evidence map. Add a short TypeScript signature,
JSON/schema example or state table after the layer table only when the columns would
otherwise leave the contract ambiguous. Domain Entity/Structure declaration code is required
by the Domain rules above; do not include implementation bodies, migration SQL examples or
UI query/action hook signatures unless an authoritative source explicitly requires them.

Use the matching contract model below for each affected layer.

Each layer contract has two views when the layer contains more than one collaborating
declaration:

1. a **declaration relationship map** that establishes ownership, roles and direct
   collaborators using exact symbol names;
2. an **affected-path map** that specifies the file delta and runtime guarantees.

Do not invent IDs for technical declarations. Reference exact class, function, type,
interface, event, widget, module or exported constant names. Omit the relationship map for
a single declaration when its path row communicates the complete contract without losing
ownership or dependency information.

##### Domain

Treat domain declarations as the vocabulary of the owning business module:

- **Entity** — independently identifiable record with lifecycle state;
- **Structure** — identity-free value, request, filter, configuration or projection;
- **Error** — expected named application failure without transport concerns;
- **Event** — stable, serializable fact that has already occurred.

Business decisions and action orchestration belong to Use cases, not domain declarations.
When several domain declarations collaborate, map their direct relationships first:

| Declaration | Kind | Ownership/identity | Contract summary | Related declarations | Consumers |
| --- | --- | --- | --- | --- | --- |
| `<exact symbol>` | `<Entity, Structure, Error or Event>` | `<module owner and identity semantics>` | `<purpose, lifecycle or payload responsibility>` | `<embedded/referenced symbols>` | `<use cases, interfaces, transports or events>` |

Then map every affected Domain path:

| Path | Change | Declaration | Domain role/schema | Invariants/transitions | Errors/events | Exports/consumers |
| --- | --- | --- | --- | --- | --- | --- |
| `<exact path>` | `<change>` | `<exact symbol and declaration kind>` | `<role and Entity/Structure schema heading when applicable>` | `<valid state, variants and mutation constraints>` | `<named failures and emitted facts>` | `<barrel/subpath and callers>` |

For every affected Entity and Structure, add a complete resulting field schema immediately
after the Domain path table. Use one subsection per declaration; do not combine several
declarations into one table:

Also include the resulting TypeScript/domain declaration as code for every new or changed
Entity and Structure. The code declaration is the canonical shape; the field table is the
auditable schema and must agree with it. Do not replace the code with prose, a database model,
or a transport example. This code requirement applies to domain objects, not to UI query/action
hooks.

```ts
// packages/core/src/<module>/<path>/<declaration>.ts
export type <ExactEntityOrStructureName> = {
  // complete resulting fields and domain types
}
```

**Schema — `<ExactEntityOrStructureName>`**

| Field | Type | Required | Validation | Description |
| --- | --- | --- | --- | --- |
| `<exact field name>` | `<exact TypeScript/domain type>` | `<Yes, No or Conditional>` | `<format, allowed values, range, length, relationship, default or —>` | `<domain meaning and referenced entity when applicable>` |

The schema is canonical for the declaration's fields. Include every field in the resulting
Entity or Structure, including unchanged fields retained by a modification. Express arrays,
unions, enums, nested structures, entity references, dates, nullability and optionality
exactly as the core contract does. For discriminated unions, include the discriminator and
mark variant-only fields `Conditional`, or use one complete table per variant when that is
clearer. `Required` describes presence in the domain value; distinguish an omitted field
from a required field whose type permits `null` or `undefined`.

Put field-level constraints in `Validation` and cross-field or lifecycle rules in the
Domain path row's `Invariants/transitions` cell. Reference another affected declaration's
schema by its exact name instead of repeating nested fields. Do not substitute database
column types, transport serialization types, example values or implementation code for the
core TypeScript/domain type. The schema defines the contract, not the enforcement location:
name enforcement in the owning Use-case, REST or persistence row and do not add business
validation methods to Entities or Structures.

Audit Domain contracts for entity identity, structure identity-freedom, serializable event
payloads, stable event names, transport-independent errors, complete Entity/Structure field
schemas, historical-value preservation and the absence of framework, persistence,
environment or provider types.

##### Use cases

Treat one use case as one authoritative application action. It owns business decisions,
authorization and orchestration while depending only on core contracts and domain
declarations. When several actions or collaborators participate, map the orchestration:

| Use case | Actor/trigger | Input/output | Direct collaborators | Consistency boundary | Failures/side effects |
| --- | --- | --- | --- | --- | --- |
| `<exact class>` | `<actor, system or event trigger>` | `<request and result types>` | `<repositories, providers, broker and domain declarations>` | `<tenant, transaction, concurrency and idempotency>` | `<named errors and event/provider effects>` |

Then map every affected Use-case path:

| Path | Change | Declaration/signature | Input/output/errors | Authorization/consistency | Side effects/dependencies | Consumers/tests |
| --- | --- | --- | --- | --- | --- | --- |
| `<exact path>` | `<change>` | `<class and execute signature>` | `<request, result and named failures>` | `<actor, tenant, transaction, concurrency and idempotency>` | `<events, providers and interfaces with timing>` | `<controller/job and unit-test boundary>` |

Audit Use-case contracts for one action per class, owning-module authority, server-side
authorization, establishment scoping, deterministic time/provider access, atomic critical
writes, explicit concurrency behavior and event publication after the fact it describes.

##### Interfaces

Treat interfaces as ports owned by core and implemented by application adapters. Classify
each contract by capability—repository, database/transaction, provider, service, broker,
storage or another repository-authorized kind—and map both sides of the port:

| Contract | Kind/owner | Capability | Implementers | Consumers | Guarantees/failures |
| --- | --- | --- | --- | --- | --- |
| `<exact interface/type>` | `<kind and owning module>` | `<method responsibilities>` | `<exact adapters>` | `<use cases, controllers, jobs or UI services>` | `<semantic guarantees and named failures>` |

Then map every affected Interface path:

| Path | Change | Contract/signature | Capability semantics | Guarantees/failures | Implementers/consumers | Exports |
| --- | --- | --- | --- | --- | --- | --- |
| `<exact path>` | `<change>` | `<exact methods, arguments and return types>` | `<ownership and operation semantics>` | `<consistency, availability and failure contract>` | `<all adapters and callers>` | `<barrel/subpath>` |

Audit Interface contracts for the smallest capability needed by core, infrastructure-free
types, explicit method semantics, complete implementer/caller impact and no provider SDK,
Drizzle, HTTP, framework or environment details.

##### Validation

Treat reusable Zod schemas as a shared runtime-validation boundary owned by
`packages/validation`. Schemas establish syntactic shape and boundary feedback; they do not
own authorization, tenant ownership, persistence checks or business decisions. Map schema
composition and consumption before individual files:

| Schema | Concern/owner | Shape responsibility | Composes/derives from | Boundary consumers | Error/type contract |
| --- | --- | --- | --- | --- | --- |
| `<exact schema export>` | `<module, web or environment concern>` | `<input/search/config/event shape>` | `<primitive schemas or Core runtime structures>` | `<forms, routes, controllers, providers or jobs>` | `<inferred type and issue/error mapping>` |

Then map every affected Validation path, including schema modules, the root barrel and
schema-focused tests:

| Path | Change | Schema/declaration | Fields/refinements | Composition/ownership | Consumers | Export/tests |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `<exact path>` | `<change>` | `<schema and inferred type>` | `<required/optional fields, formats, transforms and defaults>` | `<reused primitives, Core enum source and excluded business rules>` | `<exact web/server boundaries>` | `<root export and test boundary>` |

For every new or modified reusable schema, make the resulting shape and refinements
unambiguous in the path row or a compact field table. Reference reused primitive schemas and
Core runtime structures instead of duplicating their literals. A compatibility re-export
belongs to its consuming layer's Composition row and must not become a second schema owner.

Audit Validation contracts for one primary schema per kebab-case module, `Schema`-suffixed
camelCase exports, root-barrel exposure, explicit `.ts` internal imports, complete consumer
impact, the allowed `Validation → Core` dependency with no reverse Core dependency, and the
absence of application/framework, provider, environment-global or business-rule ownership.

##### REST

Treat one REST operation as an end-to-end transport contract connecting a thin server
controller to its core action and, when browser-facing, a web service operation. Map the
operation chain before individual files:

| Operation | Server entry | Core action/contract | Web consumer | Security/tenant source | Compatibility/error owner |
| --- | --- | --- | --- | --- | --- |
| `<HTTP method and path>` | `<controller.handle>` | `<use case and service structures>` | `<service method or external consumer>` | `<authentication, permission and establishment context>` | `<schema/DTO, serializer and error translator>` |

Then map every affected REST path, including route decorators, boundary-local DTOs,
controllers, web service adapters, transport utilities and the matching `.rest` example file.
Every controller route group must have exactly one matching
`apps/server/rest-client/<module>/<route-group>.rest` artifact; declare it as `Create` when
absent or `Modify` when an existing example file must change. The file must cover every route
in the group, not only the highest-risk operation. Put reusable Zod schema declarations under
Validation; REST rows name how each operation consumes them:

| Path | Change | Declaration/operation | Boundary/security | Request/response/errors | Effects/consumers | Registration/examples |
| --- | --- | --- | --- | --- | --- | --- |
| `<exact path>` | `<change>` | `<controller, service, schema, DTO or method/path>` | `<session, actor, permission, tenant and trust boundary>` | `<validation, serialization, compatibility and statuses>` | `<idempotency, use case, service or UI consumer>` | `<decorator, module, Swagger and REST example>` |

Add a request/response field table or short JSON example only when the signature remains
ambiguous. Do not reproduce unchanged fields. For each `.rest` row, record its base URL and
reusable identifiers, request labels, method/path/query/header coverage and representative
body coverage; do not place secrets or environment credentials in the file.

When a browser-facing service adapter is affected, enumerate its exact methods explicitly.
For each HTTP operation, name the corresponding Core service/interface method and the web
adapter method, including request input, response/result mapping, error preservation and the
owning test file. Do not handwave a service as “the API client” and do not add methods for
excluded routes or surfaces.

Audit REST contracts for one controller per action, semantic route parameters, derived
use-case request types, synchronized shared-schema/Swagger/error statuses, current-session
headers at the transport boundary, aligned server and web operation signatures and no
business decisions in controllers or service adapters.

##### Provision

Treat provision declarations as replaceable adapters from a core capability to a runtime,
environment or third-party provider. Map the complete adapter relationship first:

| Capability | Core contract | Adapter | Runtime/provider | Registration | Consumers |
| --- | --- | --- | --- | --- | --- |
| `<technical capability>` | `<exact interface>` | `<exact class/factory>` | `<SDK, API, clock, environment or client>` | `<module/context and token>` | `<use cases, controllers, jobs or contexts>` |

Then map every affected Provision path:

| Path | Change | Adapter/signature | Contract mapping/config | Failure/retry/secret boundary | Lifecycle/registration | Consumers/tests |
| --- | --- | --- | --- | --- | --- | --- |
| `<exact path>` | `<change>` | `<adapter and implemented interface>` | `<request/result mapping and required config>` | `<timeouts, retry owner, safe errors and protected data>` | `<construction, scope, cleanup, module/context and token>` | `<callers and mocked contract boundary>` |

Audit Provision contracts for one implementation per shared capability, module ownership
for feature-specific adapters, smallest core-facing API, provider-type containment,
browser/server secret separation, deterministic replacement in tests and explicit timeout,
retry, lifecycle and safe-error behavior.

Put reusable environment/configuration schema declarations under Validation. Provision rows
own reading runtime values, invoking the shared schema, protecting secrets and translating
validation issues into the application startup/configuration failure contract.

##### Database

Treat one persistence capability as a chain from a core repository/database contract to
module-owned models, persistence types, mappers and Drizzle implementations. Map that chain
before individual files:

| Persistence capability | Domain owner | Core contract | Models/types | Mapper | Repository/transaction owner |
| --- | --- | --- | --- | --- | --- |
| `<aggregate, projection or operation>` | `<module/entity>` | `<repository or database interface>` | `<table, enum and row/projection types>` | `<toDomain/write mapping>` | `<adapter and transaction boundary>` |

Then map every affected Database path, including models, persistence types, mappers,
repositories, tokens, database modules, seeders, schema barrels and migrations:

| Path | Change | Declaration/operation | Schema/mapping | Integrity/query contract | Migration/transaction | Registration/consumers |
| --- | --- | --- | --- | --- | --- | --- |
| `<exact path>` | `<change>` | `<model, type, mapper, repository, token, module, seeder or migration>` | `<columns, types, defaults and domain mapping>` | `<tenant filters, indexes, constraints and repository semantics>` | `<rollout, compatibility, backfill, isolation, locking and retry>` | `<token binding, schema barrel and callers>` |

For every migration path, document the data model instead of embedding a migration example.
Use one subsection per table with these required parts:

- a **Columns** table: `Column | Type | Nullable | Default | Description`;
- an **Indexes** table: `Index name | Columns | Type | Purpose`;
- a **Constraints** table: `Constraint | Type | Definition | Purpose`;
- **Cross-database notes** when portability or database-specific behavior matters; and
- concise **Migration delivery** prose naming the exact path, generator/journal command,
  ordering/backfill/compatibility requirements and transaction/rollout constraints.

Do not include a fenced SQL migration body or a “Migration example” subsection unless the user,
source specification or repository rule explicitly requires SQL in the Spec. The generated
migration remains implementation-owned; its result must satisfy the documented data-model
invariants.

Do not reproduce unrelated unchanged tables. Keep external side effects outside retryable
transactions unless an approved outbox contract says otherwise.

Audit Database contracts for module ownership, tenant-qualified queries, model/type/mapper
alignment, repository semantics matching core, explicit transaction ownership, atomic
critical writes, historical-value preservation, constraints and indexes supporting the
access pattern, safe migration ordering/backfill and token-based adapter registration.

##### Messaging

Treat messaging as a directed event flow: an owning module publishes an authoritative
domain fact, shared infrastructure transports it and a registered feature job coordinates
durable reactions. Map each flow before individual files:

| Event | Publisher | Trigger/consumer | Payload authority | Durable steps/side effects | Registration/reliability |
| --- | --- | --- | --- | --- | --- |
| `<event class and _NAME>` | `<use case/job>` | `<job/function>` | `<originating module and schema>` | `<step identifiers, child events and providers>` | `<registry, retry, idempotency and concurrency>` |

Then map every affected Messaging path:

| Path | Change | Declaration | Event/trigger/payload | Reliability/steps | Lifecycle/registration | Producers/consumers |
| --- | --- | --- | --- | --- | --- | --- |
| `<exact path>` | `<change>` | `<event, broker, job, module or registry>` | `<stable name, trigger, shared schema consumption and serialized contract>` | `<idempotency, retry, concurrency and durable side effects>` | `<client, endpoint, function registry and bootstrap>` | `<publisher and downstream>` |

Audit Messaging contracts for event `_NAME` reuse, complete authoritative payloads,
shared runtime-schema parity, ISO date serialization, stable function/step identifiers, durable
side effects, retryable failures, idempotency, fan-out independence, single-endpoint
registration and an explicit direct-publication or outbox delivery guarantee.

##### UI

Treat a **widget** as the composable UI unit. Classify each widget by its role:

- **Page** — owns one route-level screen or workflow and composes its child widgets;
- **Layout** — owns stable structure, provider or navigation composition for a subtree;
- **Component** — owns one focused presentation or interaction and may compose child
  component widgets.

A loading, empty, error or unavailable surface is a Component widget unless an applicable
repository Rule establishes another grouping. Routes, contexts and standalone query/action
hooks are UI declarations but are not widgets.

When one or more widgets change, define their composition first. Use one row per affected
widget declaration, not per file. `Parent/entry` names the route, layout or parent widget
that renders it; `Direct children` lists only immediate child widgets. A widget may be both
a child of another widget and the parent of its own children.

| Widget | Kind | Parent/entry | Direct children | Public contract | Behavior owner |
| --- | --- | --- | --- | --- | --- |
| `<exported widget declaration>` | `<Page, Layout or Component>` | `<route, layout, widget or application root>` | `<exact direct child widget declarations or —>` | `<named props type, slots, callbacks and visible responsibility>` | `<colocated hook or pure renderer>` |

The hierarchy table is the canonical parent/child map. Do not repeat that tree in prose or
the path table. Contract enough child widgets to keep each behavior-owning boundary
independently understandable and testable; do not hide an internal component inside its
parent row when repository Rules require it to be its own widget.

Then map every affected UI path exactly once:

| Path | Change | Declaration/surface | Widget/role | State/actions contract | Async/failure contract | Design/responsive/accessibility | Dependencies/tests |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `<exact path>` | `<change>` | `<route, widget, hook, context, constant or generated declaration>` | `<exact widget declaration and kind, or non-widget role>` | `<props, owned state, derived values, handlers and transitions>` | `<loading, empty, error, recovery, stale and optimistic behavior>` | `<reference, tokens, viewports, semantics, focus, keyboard and reduced motion>` | `<parent/consumer, children, services/providers and test boundary>` |

For widget files, contract the rendering and behavior boundaries separately: `index.tsx`
owns rendering, composition and DOM event wiring; a colocated `use-<widget-name>.ts` owns
non-trivial state, effects, refs, forms, derived state, async orchestration and handlers. When
the repository's widget convention requires a hook, every contracted child widget must name
both its `index.tsx` and colocated `use-<widget-name>.ts`; do not hide children under a generic
`components/` folder unless the repository explicitly establishes that convention. Parent
widgets pass explicit props and callbacks; a child owns its internal behavior and must not reach
into the parent's local state.

Put reusable form and route-search schema declarations under Validation. UI rows name the
schema they consume, React Hook Form and resolver ownership, field-error presentation and
submit/recovery behavior without redefining the shared schema.

For Page widgets, identify the thin route entry, screen-level workflow, page-owned hook and
children. For Layout widgets, identify the subtree, structural slots, providers and owned
navigation or responsive state. For Component widgets, identify the focused interaction,
reuse boundary and whether it is public, feature-shared or internal to its parent. Place a
hook according to its actual consumers: colocated for one widget, feature-level when shared
by several widgets and shared application-level only when it represents a reusable
application concern. For data-backed UI, explicitly name every feature-level query/action hook
path, the service method it calls, the state/effects it owns, invalidation/recovery behavior and
its test boundary. Query/action hooks are UI declarations, not widgets; specify their
responsibilities and paths, but do not require TypeScript code-shape signatures for them.

Audit the completed UI contract for:

- one explicit owner for every state value, effect, form, request and interaction handler;
- complete parent-to-child props/callback flow with no hidden state coupling;
- thin routes and layouts that do not absorb feature-widget behavior;
- domain-specific query/action hooks and REST/context dependencies at the correct boundary;
- complete loading, empty, success, error, disabled and recovery states where applicable;
- SSR/hydration equivalence and browser-only boundaries where applicable;
- design-token reuse, responsive behavior, semantics, accessible names, focus, keyboard and
  reduced-motion behavior;
- generated route artifacts tied to their authoritative route input and generation command;
- tests owned by the smallest boundary that can prove behavior, with composed behavior
  exercised at the owning parent widget when appropriate.

##### Composition

Treat composition declarations as wiring boundaries that assemble existing contracts
without acquiring their business meaning. Classify them as feature module, infrastructure
module, application root, registry, public export or generated composition artifact. Map
the assembled graph first:

| Composition boundary | Kind/scope | Imports/dependencies | Provides/exports | Consumers | Lifecycle/order |
| --- | --- | --- | --- | --- | --- |
| `<exact module, registry or export>` | `<kind and application/module scope>` | `<modules, providers, jobs or declarations>` | `<tokens, functions, routes or public symbols>` | `<parent module or external importers>` | `<bootstrap, scope, order and teardown>` |

Then map every affected Composition path:

| Path | Change | Declaration | Wiring/configuration | Lifecycle/order | Connected contracts | Generation/consumers |
| --- | --- | --- | --- | --- | --- | --- |
| `<exact path>` | `<change>` | `<module, registry, export or generated declaration>` | `<imports, providers, tokens, functions, routes or exports>` | `<bootstrap, scope, ordering and teardown guarantees>` | `<layers/interfaces composed>` | `<source command/input and downstream>` |

Audit Composition contracts for one root owner per runtime concern, complete provider/token
bindings, explicit exports, feature-to-shared dependency direction, one messaging
composition point, deterministic bootstrap/lifecycle behavior and generated artifacts that
remain derived from authoritative inputs.

After completing the layer tables, audit them as one dependency graph:

- every new consumer has a producer or registered implementation;
- every interface change identifies all implementers and callers;
- every new declaration is exported and registered where required;
- every schema or payload change has compatible producers, consumers and serializers;
- every state mutation has an owning transaction and tenant boundary;
- every event or external side effect has explicit timing and failure ownership;
- every generated artifact names its authoritative input and generation mechanism;
- no dependency points from core into a framework or feature-owned infrastructure layer.

#### Technical Decisions

Record only consequential choices with a real alternative:

| Decision | Chosen approach | Alternative considered | Reason | Accepted trade-off |
| --- | --- | --- | --- | --- |
| `<decision>` | `<choice>` | `<credible alternative>` | `<why>` | `<cost or limitation>` |

Do not restate standard repository conventions as decisions.

If no consequential alternative exists, omit this subsection. Unresolved choices are not
technical decisions: keep the Spec `draft` and return to clarification.

### 4. Validation Contract

Testing is part of implementation. Derive each boundary from the repository test taxonomy
and name real test files/suites and the CA IDs they prove. Keep mocked transport, real
integration and manual Playwright CLI evidence distinct. Do not invent test functions, arbitrary
coverage percentages or commands.

When a feature has more than one test boundary or test file, include an explicit testing
strategy with these two tables:

**Test file structure**

| Test file | Test type | Target | Coverage goal |
| --- | --- | --- | --- |
| `<repository-relative test path>` | `<unit, component, integration, route or manual>` | `<class, hook, widget, controller or route>` | `<behavioral coverage goal; no invented percentage>` |

**Test cases by file**

| Test file | Test case | Description | Assertions |
| --- | --- | --- | --- |
| `<test path>` | `<real test/suite name or descriptive case>` | `<scenario>` | `<observable assertions and side effects>` |

List the relevant cases for every contracted test file, including domain rule branches,
authorization/tenant boundaries, transport failures, persistence effects, query/action hook
state and UI recovery. Assertions must describe observable outcomes, not only mocked method
calls. Preserve the repository's real naming convention; do not invent arbitrary coverage
percentages or implementation-only test claims.

Use this required coverage table:

| Acceptance | Automated boundary | Manual scenario | Evidence target |
| --- | --- | --- | --- |
| `CA-01` | `<real test file/suite or none with reason>` | `MV-01` or `—` | `<evaluation section/artifact>` |

For each `MV-*`, provide:

- mapped CA IDs, services/health checks, accounts/fixtures and preconditions;
- starting route/state, exact viewport and saved design reference when applicable;
- numbered actions, including a keyboard path;
- expected visible result, final URL, network and persistence/provider effect;
- accessibility/DOM/layout, focus, console and failed-request checks;
- evidence target and cleanup.

List applicable commands in a `Command | Purpose/coverage` table and link the expected
evidence record as `./evaluation.md`. Include a REST-client parity check in the validation
coverage whenever a route group is affected: verify the declared `.rest` path exists, every
controller operation is represented once, and its examples match the current route and
request contract.

The Orchestrator executes every applicable `MV-*` with the Playwright CLI. Design-backed
visual comparison is optional evidence for material acceptance decisions and does not require
a dedicated visual-reference integration test. Builder checks and automated results remain
supporting evidence for the applicable behavioral and manual validation.

### 5. Documentation alignment and revision history

Use these required tables:

| Document | Authority for | State | Required change/confirmation |
| --- | --- | --- | --- |
| `<PRD, Architecture, Modules, Design, Tooling or other path>` | `<governed concern>` | `changed` or `confirmed` | `<concise result>` |

| Rule | Applies to | Evaluated revision |
| --- | --- | --- |
| `<exact Rule path>` | `<affected boundary>` | `<repository revision>` |

| Revision | Date | Material change | Reason |
| --- | --- | --- | --- |
| `1` | `YYYY-MM-DD` | `<contract created or amended>` | `<source decision/change>` |

Searchers, Builders, and the Orchestrator read Rule source files directly. Do not
put implementation attempts, test results or verdicts in revision history.

## Independent Spec review

After the Orchestrator has authored an otherwise open-ready draft and completed its own
deterministic integrity checks, activate exactly one read-only
[`Spec Reviewer`](../agents/spec-reviewer-agent.md) before changing the Spec to `open`:

- the review is mandatory for every `complete` Spec and every material amendment to one;
- for a `compact` Spec, activate the Reviewer only when cross-boundary, generated-artifact,
  security, concurrency, provider, migration, design or validation risk makes independent review
  useful;
- give the Reviewer the exact draft revision, source/mode, governing documents, Rule Pack,
  relevant repository paths and declarations, planned change classifications, design manifest,
  accepted assumptions, exclusions, validation commands and known risks;
- do not give it a Plan, implementation diff or Evaluation as substitutes for authoring
  authority; those artifacts belong to later workflows;
- do not create Reviewers per application, package, layer, Rule or design frame.

The Reviewer checks the Contract itself for source/RF/CA traceability, path and declaration
completeness, ownership and naming, exports and registration, producer-consumer wiring,
generated artifacts, test ownership, command ordering, design handoff and validation
executability. It never edits files, resolves ambiguity, asks the user questions directly or
decides the Spec status.

The report is advisory and transient. Verify every finding against repository authority. Apply
accepted corrections to the draft, rerun affected integrity checks and resume the same Reviewer
to recheck the affected Contract. If a finding exposes a material product or technical ambiguity,
return to the clarification gate before further authoring. The Spec may become `open` only when
the applicable review is current and every verified Contract finding is resolved. This is part of
the `create-spec` integrity gate, not a separate user-facing review or approval stage.

## Integrity gate and handoff

Keep the Spec `draft` while clarification, authority alignment, integrity work or an applicable
Spec review remains. Before changing it to `open`, verify:

- every applicable independent research lane was covered, with parallel Searchers used when
  two or more lanes could proceed independently;
- every dispatched Searcher report was joined, conflicting findings were resolved by direct
  inspection, and consequential claims were verified by the Orchestrator;
- every cross-lane producer, contract, and consumer relationship is consistent or represented
  as a resolved clarification or explicit Contract decision;
- metadata, source, status and revision consistency;
- every applicable PRD requirement was consumed through Outcome, Actors, Consumes, Provides,
  Capabilities and Experience, with cross-REQ User Journeys reflected where relevant;
- no Product Dependency Graph edge was treated as implementation sequencing;
- no requirement was marked Implemented by this workflow, and every materially amended
  applicable requirement is unchecked before Spec authoring;
- complete RF/CA/evidence traceability;
- filesystem-valid layer-contract path and change classifications;
- complete resulting field schemas for every affected Entity and Structure;
- no unresolved material product or technical ambiguity;
- complete/current design bundle and screenshot integrity when applicable;
- visual analysis inventory for every supplied screenshot and a recorded decision for every
  additional-screenshot suggestion;
- a complete data-model contract for every created or modified migration path, including
  columns, indexes, constraints, database notes and migration delivery requirements (without
  inline SQL unless explicitly required);
- executable manual scenarios and real validation commands;
- valid documentation and Rule Pack paths;
- every affected HTTP route group has a matching `.rest` path with complete route/example parity;
- valid Markdown tables, links, Mermaid and artifact structure.
- the applicable Spec Reviewer inspected the current draft revision, every verified finding was
  resolved and the same Reviewer rechecked affected corrections.

For every implementation-facing Spec, also verify that the handoff is executable rather than
interpretive:

- include an exact, repository-relative file/widget tree for every changed UI surface, with
  one path per line and explicit component boundaries;
- declare allowed paths, prohibited paths, owning layer/module, generated-file treatment and
  the Builder validation exits;
- map every supplied design screenshot and every required supplemental state to an exact
  route, viewport, state, implementation surface and transient validation-artifact identifier;
- define the required loading, empty, success, error, recovery, disabled, selected, focus,
  keyboard and responsive behavior wherever applicable;
- include an explicit exclusion list so an implementation cannot infer missing behavior from
  the existing codebase or from a screenshot alone;
- ensure the resulting Spec can be checked against the filesystem and the declared validation
  commands without inventing paths, tests, APIs or evidence.

An incomplete tree, ambiguous widget boundary, missing state, missing screenshot mapping or
non-executable validation command keeps the Spec `draft`; do not hand it to implementation.

After writing, return a concise author summary containing:

- clickable Spec path, revision and status;
- objective, user-visible outcome, scope and important exclusions;
- key product and technical decisions;
- affected applications/layers and technical approach;
- design screenshot count and coverage when applicable;
- automated boundaries and `MV-*` coverage;
- accepted assumptions, risks or blockers;
- recommended strategy: direct `implement-spec`, or `create-plan` followed by
  Plan-backed `implement-spec`, with rationale.

Recommend direct `implement-spec` for a small cohesive change with stable dependencies,
limited ownership and no meaningful execution waves. Recommend `create-plan` followed by
Plan-backed `implement-spec` for dependent
phases, multiple applications/shared ownership, migration/provider/concurrency/security
risk, multiple design-backed surfaces/manual environments, useful parallel lanes or a
needed recovery ledger. Do not choose by file count alone.

## Material amendments

For a material amendment before conclusion:

1. set the existing Spec to `draft`;
2. increment its revision;
3. repeat clarification and authority alignment;
4. refresh affected Contracts, design references and validation coverage;
5. mark superseded evidence as historical;
6. rerun the integrity gate and the applicable Spec Reviewer against the amended draft;
7. return the Spec directly to `open` after verified findings are resolved;
8. re-evaluate direct versus Plan-backed `implement-spec` execution.

Amend the same Spec; do not create another Spec unless the original feature is already
concluded and the request is a distinct new change.
