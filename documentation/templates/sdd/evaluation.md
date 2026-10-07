---
feature: "<domain>/<feature>"
spec: ./spec.md
spec_revision: 1
status: in_progress
updated_at: YYYY-MM-DD
---

# Evaluation

Evaluation of Spec revision `<revision>` against the current implementation.

Current result: `<validated progress, unfinished criteria and blocking findings>`.

<!-- Record actual results, not future phases or task assignments. Preserve historical
attempts. Executed check outcomes: passed, failed, blocked. Evidence lifecycle statuses:
pending, passed, failed, blocked, stale, not_applicable. Explain blocked proof with a finding.
Visual evidence additionally allows passed_with_authorized_difference. Findings:
active, resolved, accepted_non_blocking, superseded. Update affected evidence at coherent
checkpoints; retain valid unaffected proof. Evaluation statuses: in_progress, ready,
completed; only conclusion sets completed. Replace placeholders and omit unused examples. -->

## Acceptance matrix

| Criterion | Evidence | Status |
| --- | --- | --- |

## Automated and runtime evidence

| ID | Layer | Command or scenario | Result | Status |
| --- | --- | --- | --- | --- |

## Manual evidence

| ID | Scenario | Criteria | Expected | Observed | Status |
| --- | --- | --- | --- | --- | --- |

## Visual evidence

Visual evidence uses `EV-*` identifiers with `Type = visual`.

| ID | Type | Surface and state | Viewport | Reference | Implementation | Differences | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |

## Rule and documentation compliance

| Authority | Reference | Result | Notes |
| --- | --- | --- | --- |

## Findings

| ID | Classification | Source | Affected evidence | Status | Resolution |
| --- | --- | --- | --- | --- | --- |

## Lessons learned

- `<reusable lesson and documentation disposition, or No durable lesson identified>`

## PR CI quality gate

<!-- Populate during conclude-spec. The head SHA identifies the PR revision checked
by CI. Candidate branch/diff/checkpoint or commit provenance may also be recorded below
when useful; provenance is not a separate status gate. Retain failed and superseded runs as history. -->

| ID | Workflow | Head SHA | Result | Run |
| --- | --- | --- | --- | --- |

## Continuation handoff

<!-- Keep this short and current. It is a resumption aid, not an execution plan. -->

- **Branch/candidate:** `<branch and diff/checkpoint or useful commit provenance>`
- **Progress:** `<current integrated/unfinished state>`
- **Interrupted/uncommitted paths:** `<paths and ownership or none>`
- **Unfinished criteria:** `<AC-* or none>`
- **Blockers and stale evidence:** `<FND-*/EV-*/MV-* and required input, or none>`
- **Latest checkers:** `<EV-*/MV-* IDs and passed/failed/blocked results>`
- **Next useful action:** `<one concrete action or conclusion>`

## History

| Date/Time | Event |
| --- | --- |
