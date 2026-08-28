---
name: create-feat-issue
description: Create a scoped GitHub feature issue from a product requirement or feature request.
---

# Prompt: Create Feature Issue

## Objective

Transform a product requirement or feature request into one clear, actionable
GitHub feature issue for the current repository.

The result of this task is one GitHub issue. Do not implement code, create a
branch, or open a pull request.

## Input

- **Feature request:** the requested capability or product outcome.
- **Context (optional):** affected module, user role, workflow, technical
  constraint, or related issue.

If the request is ambiguous, inspect the repository documentation and code for
evidence before asking for clarification. Do not invent product behavior that
is not supported by the request or the applicable PRD.

## Grilling protocol

Before drafting the issue, build a design tree of the decisions that determine its scope. Work
the tree in rounds:

- The frontier is every decision whose prerequisites are already settled.
- Ask the whole frontier in one round, numbering each question and giving a recommended answer.
- Use this format for every round:

  ```yaml
  ❓ **Q1** - **<question title>**: <question body, including choices when useful>

  ➡️ <recommended answer>

  ---

  ❓ **Q2** - **<question title>**: <question body>

  ➡️ <recommended answer>
  ```

- Wait for the user's answers before recomputing the next frontier.
- Research repository facts directly; do not ask the user for facts that can be inspected. Keep
  decisions with the user.
- Challenge contradictions, record resolved decisions and do not silently assume material scope,
  ownership, permissions, dependencies or exclusions.
- When the frontier is empty, present the shared understanding and ask for explicit confirmation.
- Do not draft or publish the issue until the user confirms the shared understanding. The existing
  issue approval gate still applies after the draft is prepared.

## Required repository context

Before writing the issue:

1. Read `AGENTS.md` and any applicable nested instruction files.
2. Read `documentation/rules.md` and select rules relevant to the feature.
3. Read `documentation/architecture.md` when the feature affects system
   boundaries, persistence, authentication, authorization, integrations, or
   asynchronous processing.
4. Read `documentation/modules.md` to identify the owning module.
5. Read the owning PRD under `documentation/prds/`.
6. Inspect relevant existing source files and tests when technical scope needs
   to be grounded in the current implementation.

## Approved PRD consumption

When an applicable PRD requirement exists, derive the issue from its complete approved
structure:

- use `Outcome` and `Actors` to state who receives which user or business result;
- use `Consumes` and `Provides` to preserve required product capabilities, authoritative facts
  and cross-requirement or cross-module boundaries;
- use `Capabilities` to define included observable behavior, rules, validation, transitions,
  consistency and exceptions;
- use `Experience` to define applicable visible interaction, states, responsiveness and
  accessibility.

Use all of those fields together to derive the issue Outcome and Scope; do not treat any single
field as the complete requirement. PRDs intentionally have no Acceptance Criteria or User
Stories sections. Derive issue-level acceptance criteria from the selected requirement fields
without adding a duplicate PRD contract. Use User Journeys only to preserve end-to-end or
alternate scenarios that cross one or more `REQ-*` requirements.

The PRD Product Dependency Graph describes consumption of product capabilities or
authoritative facts. It is not implementation sequencing, issue decomposition, foundation
work, execution waves or delivery priority.

Treat the PRD `Implemented` checkbox as read-only. Creating an issue never checks, unchecks or
otherwise changes a requirement's checkbox state.

## GitHub metadata

Create the issue in the current repository and use only the repository's
existing labels:

- `feat` — required for every issue created by this prompt.
- `server` — when the issue affects `apps/server`.
- `web` — when the issue affects `apps/web`.
- `chore` — only when the request is primarily configuration or infrastructure
  work rather than a user-facing feature.
- `documentation` — only when the deliverable is documentation itself.
- `bug` and `refactor` are not feature labels and must not be added by default.

Add only labels supported by the repository. Never create a new label as part
of this prompt.

Assign exactly one PRD milestone when the feature belongs to a known module:

- `Identity PRD` — `documentation/prds/identity.md`
- `Billing PRD` — `documentation/prds/billing.md`
- `MRP PRD` — `documentation/prds/mrp.md`
- `PDV PRD` — `documentation/prds/pdv.md`
- `Communication PRD` — `documentation/prds/communication.md`

If the feature crosses module boundaries, assign the milestone of the module
that owns the business lifecycle and mention the other modules as dependencies
in the issue. Do not assign the aggregate MVP milestone when a module PRD
milestone exists.

## Issue title

Use this format:

```text
Implement <short feature name>
```

The title must describe the outcome, not an implementation detail. Keep it
concise and avoid duplicating the milestone name.

## Issue body

Use the following structure:

```md
## Outcome

<The user or business outcome this feature enables.>

## Scope

- <Included product behavior or capability.>
- <Important business, technical, design, or integration constraint.>
- <Design references, including the exact Pencil file and node IDs when supplied.>
- **Not included:** <Explicitly excluded adjacent behavior.>

## Acceptance criteria

- [ ] <Observable success behavior.>
- [ ] <Validation and error behavior.>
- [ ] <Authorization and tenant-isolation behavior, if applicable.>
- [ ] <Responsive and accessible behavior, if applicable.>
- [ ] <Required automated and manual validation passes.>

## References

- PRD requirement: <GitHub link to the applicable requirement>
- Milestone: <GitHub link to the applicable milestone>
- Design or dependency: <link, when applicable>
```

Keep the issue at product-delivery level. Include only technical constraints
that materially limit the solution; the Spec owns layer-by-layer contracts,
file choices, runtime flows, and detailed validation commands. Omit optional
scope bullets, acceptance criteria, and references that do not apply. Keep
acceptance criteria observable and testable, and separate required behavior
from implementation ideas. When the request supplies Pencil design references,
place the exact file path and node IDs in the Scope section; the References
section may link to the design file as supporting context.

## Scope rules

- Create exactly one issue for the request unless the user explicitly asks for
  decomposition.
- Keep the issue small enough to implement and review as one coherent change.
- Preserve the owning module's boundaries from `documentation/modules.md`.
- Put business rules in `packages/core`; describe application adapters in the
  issue only when the feature needs them.
- Treat the backend as authoritative for permissions, pricing, stock, tenancy,
  and other business decisions.
- Do not add unrelated cleanup, speculative future work, or unrequested
  dependencies.
- When Pencil file or node references are supplied, preserve them exactly and
  include them as an explicit Scope bullet rather than only listing them under
  References.
- Do not claim that a requirement is implemented or change its `Implemented`
  checkbox; this prompt only creates the issue.

## Approval gate

Before writing to GitHub:

1. Present the exact proposed title, body, labels, and milestone.
2. Ask the user to approve the draft or request changes.
3. If changes are requested, revise and present the complete draft again.
4. Create the GitHub issue only after the user explicitly approves the current
   draft.

Do not create or update an issue while approval is pending. Approval authorizes
only the proposed issue submission; it does not authorize implementation, a
branch, a commit, or a pull request.

## Completion

After creating the issue, report:

- Issue number and URL.
- Title.
- Assigned PRD milestone and URL.
- Labels.
- A one-sentence summary of the scope.
