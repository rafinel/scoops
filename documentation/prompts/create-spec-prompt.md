---
name: create-spec
description: Create and judge a compact or complete feature Spec from a Confluence PRD, Jira ticket, report, or direct request.
---

# Create a Spec

The Orchestrator authors the Spec in the current task. Do not create a new
thread. Use a Spec only for feature-related delivery; use a direct workflow for
cross-cutting maintenance without a feature Contract.

## Classification

Identify the source as `prd`, `jira-ticket`, `report`, or `direct-request`. A PRD
is a Confluence page, and every traceable request must use a Jira ticket; do not
use a GitHub Issue or milestone as the product source. Define `scope` with
workspaces, directories, or files. Use compact mode for a small, cohesive
change; use complete mode for multiple flows, risk, integrations, or phases.

## Sources

Read the request source in Confluence/Jira, `documentation/architecture.md`,
applicable Rules, `documentation/sdd.md`, and the actual codebase paths. Use
available MCPs when applicable. If Confluence or Jira is unavailable, record
the limitation and do not invent requirements or criteria.

Resolve material ambiguities before the technical solution. Record assumptions
and pending questions; before `open`, pending questions must be resolved and
critical assumptions confirmed or explicitly accepted with risk.

## File and Contract

Create `documentation/features/<domain>/<feature>/spec.md`. `plan.md` is
optional and should be created only when size, risk, or dependencies require
phases and a ledger; `evaluation.md` is mandatory after implementation/judgment,
even without a Plan. The only exception is a Spec abandoned before implementation.
For changes to an already implemented feature, use
`documentation/features/<domain>/<feature>/changes/<change-name>/`. Use a short
kebab-case name and keep the ticket in frontmatter. For bugs or security, do
not copy the private report into the repository; for product evolution, record
the ticket request as the source of the change.

```yaml
---
title: <title>
status: draft
revision: 1
source:
  type: <prd|jira-ticket|report|direct-request>
  ref: <confluence-url|jira-url|report-url|path|codex-task>
prd: <confluence-url, optional>
jira_tickets:
  - <PROJ-123>
scope:
  - <workspace|directory|file>
last_updated_at: YYYY-MM-DD
---
```

The body must contain context, scope, Contract, current state, technical
solution, validation plan, a reference to `evaluation.md`, documentation
alignment, and amendments. Do not duplicate final assessments or evidence in
the Spec; record them in `evaluation.md` after implementation or judgment.

Use only `RF-*` and `CA-*` as required IDs:

```md
| CA | RF | Given | When | Then | Expected evidence |
|---|---|---|---|---|---|
| CA-01 | RF-01 | precondition | action | result | test/browser/sensor |
```

Treat security, performance, and architecture as acceptance criteria or
technical constraints. Do not use `RN-*`, `RNF-*`, `RA-*`, `harness:evidence`
comments, custom gates, or baselines.

When `source.type` is `report`, prefer the direct Jira ticket URL. For Security
Reports, use the URL only if repository access control is compatible; never
copy sensitive ticket content.

Declare applicable validation according to `documentation/tooling.md`: format,
lint, typecheck, tests, and, for UI or REST, integration/e2e and browser
validation. Build is the final CI validation.

## Pencil design fidelity

For UI work with Pencil frames or node IDs, treat the Pencil design as the
normative visual source, not general inspiration. Before implementation:

1. Inspect the Pencil editor state, relevant node trees, reusable components,
   variables, and the exact target viewport through Pencil MCP.
2. Map every implemented page or state to its specific Pencil node ID and record
   the mapping in the Spec's current state or validation plan.
3. Identify which elements are genuinely shared and which are intentionally
   different. Do not generalize distinct page visuals, right-side compositions,
   copy, spacing, or motion into one approximation.

For every Pencil-backed page, require Browser-use CDP validation at the design
viewport. Capture the rendered result, inspect the accessibility tree and DOM,
compare layout and visual details against the mapped Pencil node, and iterate
until discrepancies are resolved. Manual UI validation uses Browser-use, not
Playwright. Visual parity is an acceptance criterion and the evidence must be
recorded with the route, node ID, viewport, screenshot or comparison, and
remaining findings. A UI Spec is not ready for implementation judgment while
material Pencil-to-browser differences remain unresolved.

## Traceability

Relate every requirement to the Confluence PRD and applicable Jira tickets.
Preserve every `jira_tickets` key in the Spec and do not change ticket status
automatically.

## Spec Judge

Trigger `judge-spec-agent` as a read-only `Judge Spec` subagent in the current
task. Send the source, Spec, research, Architecture, and Rules without
persuasive narrative.

- `failed`: send findings to the Orchestrator, correct them, and reevaluate;
- `accepted`: change the Spec to `status: open` and route to `implement-spec` or
  `create-plan`.

Do not create a new thread for research or judgment.
