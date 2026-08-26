---
description: Diagnose a GitHub bug issue into a concise, evidence-based Bug Report and recommend its delivery route.
---

# Prompt: Create a Bug Report

## Goal

Turn an approved GitHub bug issue into a repository Bug Report that records the evidence-backed
technical diagnosis and correction boundary.

The Bug Report is diagnostic input, not an implementation Spec. Do not add acceptance criteria,
manual validations, implementation phases, tasks, signatures or proposed file inventories. When
the correction needs a Spec, recommend that route in the output summary instead of creating the
Spec or adding a `Delivery Route` section to the Bug Report.

## Input

- **GitHub bug issue:** approved intake issue containing the observed symptom, expected behavior,
  reproduction and context.
- **Technical context (optional):** device, OS, browser, environment and affected feature or flow.

## Applicable rules

Read `documentation/rules.md`, `documentation/sdd-rules.md`, the relevant PRD, and every Rule
selected by dynamic context discovery for the affected layers. Read
`documentation/architecture.md` and `documentation/modules.md` when module ownership,
persistence, authentication, asynchronous processing or integrations are involved.

Use Rules to validate technical boundaries and established patterns; do not turn the report into
an implementation Spec.

## Parallel Searcher research

Use [`searcher-agent.md`](../agents/searcher-agent.md) for bounded, read-only diagnosis. The
Orchestrator owns the final diagnosis and must verify material Searcher findings against the
repository before writing the report.

- For one narrow boundary, use one Searcher.
- When two or more independent boundaries are affected, dispatch the applicable Searchers in
  parallel.
- Use bounded Core, Server, Web and Integration lanes as applicable; do not dispatch unrelated
  lanes merely to fill a fixed set.
- Give each Searcher the symptom, expected behavior, relevant paths, selected Rules and a precise
  diagnostic question.
- Require exact file paths, observed evidence, probable cause, regression risk and unresolved
  uncertainty in each response.
- Searchers are read-only sibling subagents. They do not edit artifacts, choose the delivery
  route, create Specs or create other subagents.

After joining the Searchers, resolve conflicts through direct inspection, separate confirmed
findings from hypotheses, and omit claims that cannot be supported by repository evidence.

## Workflow

1. Require an existing GitHub bug issue. If none exists, stop and route intake through
   `create-bug-issue`; do not create or update the issue from this workflow.
2. Separate the observed failure from expected product behavior.
3. Link the report to the relevant PRD `REQ-*` when the defect violates an existing product
   requirement. Do not amend the PRD unless intended product behavior changes.
4. Dispatch the applicable Searchers and inspect the real feature entry point, state control,
   remote call, use case, persistence or integration boundaries implicated by the evidence.
5. Create or update
   `documentation/reports/{module-name}/{issue-number}-{slug}/bug-report.md` using the required
   template below. The issue remains the tracking artifact; the report is the durable technical
   diagnosis.
6. Determine the delivery route:
   - **Direct correction** for a narrow, well-understood, low-risk fix that does not require a
     durable implementation contract; or
   - **Correction Spec** for ambiguous, cross-layer, high-risk or coordinated work that needs
     formal `CA-*`, `MV-*` or implementation planning.
7. Report the GitHub issue, Bug Report path and recommended delivery route in the final output
   summary. Do not write the route into a separate Bug Report section.

## Required Bug Report template

```md
---
title: {Short descriptive title}
issue: {GitHub issue URL}
prd: {PRD path and REQ-* or null}
status: open
last_updated_at: {YYYY-MM-DD}
---

# Bug Report: {Short descriptive title}

## Diagnosis

### Observed Failure

{Confirmed incorrect behavior and the conditions in which it occurs.}

### Expected Behavior

{Behavior required by the PRD, existing Spec, design or established contract.}

### Root Cause

{Evidence-backed technical explanation. Clearly identify any remaining hypotheses.}

### Affected Areas

- `{relative/path/to/file}` — {How the file contributes to the defect.}

### Regression Risk

{Related behavior that the correction must preserve.}

## Correction Boundary

{What must be corrected and what must remain unchanged.}
```

## Constraints

- Use GitHub Issues, never Jira.
- Do not invent file paths, methods, contracts, reproduction results or causes.
- Cite each problematic file and separate confirmed facts from hypotheses.
- Keep the GitHub issue concise; put technical diagnosis in the Bug Report.
- Do not add a `Delivery Route` section or Spec link field to the Bug Report.
- Do not create or edit a Spec from this workflow.
- Do not include acceptance criteria, manual validations or implementation planning in the Bug
  Report.
- Use only repository-relative paths inside the report.
