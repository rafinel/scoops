---
feature: "<domain>/<feature>"
spec: ./spec.md
plan: ./plan.md # omit for direct execution
spec_revision: 1
base_commit: "<sha>"
candidate_commit: working-tree
status: in_progress
updated_at: YYYY-MM-DD
---

# Evaluation

Evaluation of Spec revision `<revision>` against candidate `<sha-or-working-tree>`.

Current result: `<concise statement of validated, pending and blocking evidence>`.

## Acceptance matrix

| Criterion | Evidence | Status |
| --- | --- | --- |
| `CA-01` | `EV-01`; `MV-01` | `pending` |

## Automated and runtime evidence

| ID | Layer | Command or scenario | Result | Status |
| --- | --- | --- | --- | --- |
| `EV-01` | `<Domain, Use cases, Interfaces, Validation, REST, Provision, Database, Messaging, UI or Cross-layer>` | `<exact command or runtime scenario>` | `<observed result>` | `pending` |

## Manual evidence

| ID | Scenario | Criteria | Expected | Observed | Status |
| --- | --- | --- | --- | --- | --- |
| `MV-01` | `<user-visible scenario>` | `CA-01` | `<expected outcome>` | `<actual observation>` | `pending` |

## Visual evidence

| ID | Surface and state | Viewport | Reference | Implementation | Differences | Status |
| --- | --- | --- | --- | --- | --- | --- |
| `VIS-01` | `<surface and state>` | `<width × height>` | `design/<reference>.png` | `evidence/screenshots/rev-<revision>/<capture>.png` | `<missing, extra, altered or mismatched elements>` | `pending` |

## Rule and documentation compliance

| Authority | Reference | Result | Notes |
| --- | --- | --- | --- |
| Rule Pack | `<repository-relative path>` | `pending` | `<evidence or required alignment>` |

## Findings

| ID | Classification | Source | Affected evidence | Status | Resolution |
| --- | --- | --- | --- | --- | --- |
| `FND-001` | `<implementation, Contract, Rule, environment or CI>` | `<CA, Rule, screenshot, command or PR run>` | `<EV, MV, VIS or CI IDs>` | `active` | `<correction, accepted limitation or next action>` |

## PR CI quality gate

<!-- Populate during conclude-spec. Retain failed and superseded-head runs as history. -->

| ID | Workflow | Head SHA | Result | Run |
| --- | --- | --- | --- | --- |
| `CI-01` | `<applicable workflow>` | `<sha>` | `pending` | `<run URL when available>` |

## History

| Date | Candidate | Event |
| --- | --- | --- |
| `YYYY-MM-DD` | `working-tree` | Evaluation created for Spec revision `<revision>`. |
