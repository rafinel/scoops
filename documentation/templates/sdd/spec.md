---
title: <feature title>
status: draft
revision: 1
source:
  type: <prd|issue|report|direct-request>
  ref: <actual source URL or path>
scope:
  - <affected workspace or module boundary>
last_updated_at: YYYY-MM-DD
---

# <Feature title>

<!-- Replace placeholders and omit irrelevant subsections. Expected behavior belongs here;
actual results belong in evaluation.md. The agent owns routine internal structure and
execution order. Use create-spec for clarification and independent review before opening. -->

## 1. Context and scope

**Objective:** <observable user or business outcome>.

**Baseline and gap:** <current behavior and the missing outcome>.

**Depth:** <compact or complete, chosen from delivery risk>.

**Scope:** <included behavior>.

**Exclusions:** <explicit adjacent behavior outside this delivery>.

**Resolved decisions and accepted assumptions:** <consequential product choices>.

| Source requirement | Coverage | Boundary |
| --- | --- | --- |
| <real PRQ ID or source statement> | full / partial / deferred | <delivery scope without weakening source authority> |

## 2. Behavior Contract

| ID | PRQ/source coverage | Required behavior |
| --- | --- | --- |
| FR-01 | <real source requirement> | <observable behavior, actors and restrictions> |

| ID | FR coverage | Requirement | Given | When | Then | Expected evidence |
| --- | --- | --- | --- | --- | --- | --- |
| AC-01 | FR-01 | <observable criterion> | <precondition> | <action or trigger> | <observable result and applicable side effect> | <checker or MV-01> |

### Design Contract

<!-- Include for design-backed UI. Use existing design/manifest.md only when handoff.md
does not exist. Saved reference images are durable; implementation captures are transient. -->

**Saved references:** [Design handoff](./design/handoff.md).

**Required states and viewports:** <reference-backed states, responsive behavior,
accessibility and permitted deviations, mapped to AC IDs>.

## 3. Technical Contract

<!-- Keep only affected workspace/layer subsections. Use actual module boundaries;
omit unchanged layers rather than empty or "No changes" inventories. Within each owning
section document existing boundaries, public contracts, runtime flow and consequential
constraints (authorization, tenancy, atomicity, concurrency, idempotency, compatibility,
failure recovery, lifecycle and browser/SSR guarantees) where applicable. -->

### packages/core

#### Domain

<Changed entities, structures, errors and events. Entities/structures describe data;
business rules belong exclusively in owning use-case classes. Include source-backed illustrative TypeScript
snippets where they clarify the contract, identifying existing versus proposed members.>

#### Use cases

<Typed input/result, authoritative behavior, dependencies, transaction and error semantics.>

#### Interfaces

<Changed repository/provider capabilities, exported contracts and consumers.>

### packages/validation

<Changed schemas, composition and input bounds; distinguish syntax from authoritative rules.>

### apps/server

#### REST

<Routes/methods, authorization, payloads, error mapping, compatibility and .rest examples.>

#### Database

<Affected tables/columns, types, nullability, defaults, keys, indexes and constraints;
repository/mapping contracts, atomicity, historical data and migration/generation commands.>

#### Messaging

<Events, producers/consumers, outbox, commit ordering, durable steps, retries and idempotency.>

#### Provision

<Affected provider adapters, consuming contracts, registrations and failure translation.>

### apps/web

#### UI

<Screens/dialogs, permissions, states, form behavior, refresh, accessibility and responsive behavior.>

#### Routes

<Navigation, route/search contracts, guards and generated metadata obligations.>

#### REST

<Services, transport mapping, requests/results, failure handling and consumer refresh.>

#### Provision

<Affected browser adapters and their contracts, wiring and lifecycle.>

### packages/email

<Include only changed templates, rendering contracts and exports; delivery stays with its owner.>

<!-- Within affected sections, optionally include expected file trees and the table below.
Identify existing versus proposed paths; Create/Modify/Move/Generate/Remove describe changes.
Proposed names and illustrative snippets do not prescribe routine private decomposition.
No blanket file inventory or provider refactor is required. -->

| Action | Path |
| --- | --- |
| <Create / Modify / Move / Generate / Remove> | <affected path; label proposed names and move destination> |

### Cross-layer flow and decisions

<Connect affected owners, source of truth, synchronous/asynchronous flow and side effects.>

| Decision | Chosen approach | Alternative | Reason and accepted trade-off |
| --- | --- | --- | --- |
| <consequential choice> | <approach> | <credible alternative> | <reason and limitation> |

<!-- Omit decisions fixed by repository authority. Specify exact public details when
correctness depends on them; routine internal structure and execution remain with the agent. -->

## 4. Verification Contract

| Acceptance | Checker and permitted boundary | Expected assertion | Evidence target |
| --- | --- | --- | --- |
| AC-01 | <existing suite, allowed consuming boundary or MV-01> | <observable result and effect> | evaluation.md |

| Command | Purpose and prerequisites |
| --- | --- |
| <real repository command> | <affected validation boundary and required services> |

### MV-01 — <manual scenario>

<!-- Include executable manual scenarios only where required. Use Playwright CLI for
browser work; mocked transport does not prove real server-backed integration. -->

- **Acceptance:** <AC IDs>.
- **Prerequisites:** <services/health checks, accounts, data and starting route/state>.
- **Viewport and reference:** <dimensions and applicable saved reference>.

1. <Action with accessible locator or control name>.
2. <Keyboard path and relevant state-changing action>.

**Expected proof:** <visible result, final URL and relevant network or persisted effect;
focus/accessibility, console and failed-request checks>.

**Capture and comparison:** <fresh screenshot in ignored test-results/ or CI artifacts,
mapped saved reference and comparison obligation; record actual path/result in Evaluation>.

**Cleanup:** <task-owned processes and temporary state>.

## 5. Documentation alignment and revision history

| Authority | Applies to | Alignment |
| --- | --- | --- |
| <actual PRD, Architecture, Modules, Rule, Design or Tooling path> | <governed concern> | <confirmed or approved change> |

| Revision | Date | Material change and reason |
| --- | --- | --- |
| 1 | YYYY-MM-DD | <initial contract and source decision> |
