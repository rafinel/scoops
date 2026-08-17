---
name: create-spec
description: Create or refine an implementation-ready feature Spec from a PRD, GitHub Issue, report, existing reference, or direct request, grounded in repository rules and real code paths.
---

# Create a Spec

Create or revise one implementation-ready feature Spec in the current task. Do not create
another user-owned task. Use a direct maintenance workflow when the requested work does not
need a feature Contract.

## Workflow

Follow these stages in order. Research may precede clarification; writing `spec.md` may not.

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

### 2. Classify and research

Record the real source as `prd`, `issue`, `report` or `direct-request`. Choose depth from
delivery risk, not file or endpoint counts:

| Mode | Use when |
| --- | --- |
| `compact` | One cohesive outcome, stable dependencies, limited ownership and low delivery risk. |
| `complete` | Multiple applications or layers, persistence/integration changes, several UI states, or material security, concurrency, migration or operational risk. |

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

Before creating or modifying `spec.md`, identify every unresolved choice that could
materially alter the Contract.

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

If the user cannot resolve the question, keep the Spec `draft` and record the ambiguity as a
blocker. If repository authority already resolves it, cite that authority and record the
interpretation without asking the user to re-decide an established contract.

Resolve a choice from repository authority when one safe answer is already established.
Otherwise ask the user concise questions. For each material question, provide repository
evidence, a recommendation, alternatives and impact. Do not ask the user to decide facts
already fixed by authoritative documents or established code.

Write only after every material ambiguity is answered or the user explicitly accepts a
documented assumption.

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
| `plan.md` | Only when the recommended route is `implement-plan` | Execution phases, dependencies and durable progress ledger. |
| `evaluation.md` | At implementation kickoff | Actual validation evidence, findings and history. |

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
- RF/CA traceability;
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
Use a requirements table when there is more than one requirement:

| ID | Required behavior |
| --- | --- |
| `RF-01` | `<observable behavior and applicable restrictions>` |

Map every requirement to acceptance evidence using this required table:

| ID | Requirement | Given | When | Then | Expected evidence |
| --- | --- | --- | --- | --- | --- |
| `CA-01` | `RF-01` | `<precondition>` | `<action>` | `<observable result>` | `<test boundary and/or MV-01>` |

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
| `<screenshot>` | `<route and state>` | `<width × height>` | `<elements and hierarchy>` | `<controls/states>` | `<explicit notes>` | `<CA/MV/evidence path>` |

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
**Domain**, **Use cases**, **Interfaces**, **REST**, **Provision**, **Database**,
**Messaging**, **UI** and **Composition**. Create one subsection per affected
application/layer combination—for example, `packages/core — Domain`,
`apps/server — REST` or `apps/web — UI`—and omit unaffected layers.

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
otherwise leave the contract ambiguous. Do not include implementation bodies except
required migration SQL.

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

##### REST

Treat one REST operation as an end-to-end transport contract connecting a thin server
controller to its core action and, when browser-facing, a web service operation. Map the
operation chain before individual files:

| Operation | Server entry | Core action/contract | Web consumer | Security/tenant source | Compatibility/error owner |
| --- | --- | --- | --- | --- | --- |
| `<HTTP method and path>` | `<controller.handle>` | `<use case and service structures>` | `<service method or external consumer>` | `<authentication, permission and establishment context>` | `<schema/DTO, serializer and error translator>` |

Then map every affected REST path, including route decorators, schemas, DTOs, controllers,
web service adapters, transport utilities and `.rest` examples:

| Path | Change | Declaration/operation | Boundary/security | Request/response/errors | Effects/consumers | Registration/examples |
| --- | --- | --- | --- | --- | --- | --- |
| `<exact path>` | `<change>` | `<controller, service, schema, DTO or method/path>` | `<session, actor, permission, tenant and trust boundary>` | `<validation, serialization, compatibility and statuses>` | `<idempotency, use case, service or UI consumer>` | `<decorator, module, Swagger and REST example>` |

Add a request/response field table or short JSON example only when the signature remains
ambiguous. Do not reproduce unchanged fields.

Audit REST contracts for one controller per action, semantic route parameters, derived
use-case request types, synchronized validation/Swagger/error statuses, current-session
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

For every migration path, follow the table with **Migration body — `<path>`** and a fenced
`sql` block containing the complete expected migration body. Include all required DDL,
constraints, indexes, data transformations/backfills and statement ordering. Ground the
body in the repository's current schema and migration conventions; do not use pseudocode or
omit operations because the migration will later be generated. The implementation may use
the documented generator, but its generated result must satisfy the body contracted by the
Spec.

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
| `<exact path>` | `<change>` | `<event, broker, schema, job, module or registry>` | `<stable name, trigger and serialized contract>` | `<idempotency, retry, concurrency and durable side effects>` | `<client, endpoint, function registry and bootstrap>` | `<publisher and downstream>` |

Audit Messaging contracts for event `_NAME` reuse, complete authoritative payloads,
runtime schema parity, ISO date serialization, stable function/step identifiers, durable
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
non-trivial state, effects, refs, forms, derived state, async orchestration and handlers. A
pure prop-to-markup widget may omit the hook. Parent widgets pass explicit props and
callbacks; a child owns its internal behavior and must not reach into the parent's local
state.

For Page widgets, identify the thin route entry, screen-level workflow, page-owned hook and
children. For Layout widgets, identify the subtree, structural slots, providers and owned
navigation or responsive state. For Component widgets, identify the focused interaction,
reuse boundary and whether it is public, feature-shared or internal to its parent. Place a
hook according to its actual consumers: colocated for one widget, feature-level when shared
by several widgets and shared application-level only when it represents a reusable
application concern.

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
evidence record as `./evaluation.md`.

The Orchestrator executes every applicable `MV-*` with the Playwright CLI and compares
design-backed UI against saved references at the declared viewports. Builder checks and
automated results are supporting evidence, not substitutes for this manual Playwright CLI validation.

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

Builders and the Orchestrator read Rule source files directly. Do not put implementation
attempts, test results or verdicts in revision history.

## Integrity gate and handoff

There is no separate Spec review stage. Keep the Spec `draft` while clarification, authority alignment
or integrity work remains. Before changing it to `open`, verify:

- metadata, source, status and revision consistency;
- complete RF/CA/evidence traceability;
- filesystem-valid layer-contract path and change classifications;
- complete resulting field schemas for every affected Entity and Structure;
- no unresolved material product or technical ambiguity;
- complete/current design bundle and screenshot integrity when applicable;
- visual analysis inventory for every supplied screenshot and a recorded decision for every
  additional-screenshot suggestion;
- a complete SQL body for every created or modified migration path;
- executable manual scenarios and real validation commands;
- valid documentation and Rule Pack paths;
- valid Markdown tables, links, Mermaid and artifact structure.

After writing, return a concise author summary containing:

- clickable Spec path, revision and status;
- objective, user-visible outcome, scope and important exclusions;
- key product and technical decisions;
- affected applications/layers and technical approach;
- design screenshot count and coverage when applicable;
- automated boundaries and `MV-*` coverage;
- accepted assumptions, risks or blockers;
- recommended route: `implement-spec` or `implement-plan`, with rationale.

Recommend `implement-spec` for a small cohesive change with stable dependencies, limited
ownership and no meaningful execution waves. Recommend `implement-plan` for dependent
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
6. rerun the integrity gate and return the Spec directly to `open`;
7. re-evaluate `implement-spec` versus `implement-plan`.

Amend the same Spec; do not create another Spec unless the original feature is already
concluded and the request is a distinct new change.
