---
feature: "<domain>/<feature>"
spec: ./spec.md
plan: ./plan.md # omit for direct execution
spec_revision: 1
status: in_progress
updated_at: YYYY-MM-DD
---

# Evaluation

Evaluation of Spec revision `<revision>` against the current implementation.

Current result: `<concise statement of validated, pending and blocking evidence>`.

## Acceptance matrix

| Criterion | Evidence | Status |
| --- | --- | --- |
| `CA-01` | `EV-01`; `MV-01` | `pending` |

## Automated and runtime evidence

| ID | Layer | Command or scenario | Result | Status |
| --- | --- | --- | --- | --- |
| `EV-01` | `<Domain, Use cases, Interfaces, Validation, REST, Provision, Database, Messaging, UI or Cross-layer>` | `<exact command or runtime scenario>` | `<observed result>` | `pending` |

For implementation candidates, record
`pnpm check:spec-implementation -- <exact-spec-path>` as a Cross-layer row after integration and
again after every correction affecting a contracted path. Include the exact command,
classification totals and observed result. Retain prior runs and mark a superseded
pass `stale`; only the latest passing row may support implementation review or readiness.

When HTTP routes are affected, include a REST-client parity row in this section for each
matching `apps/server/rest-client/<module>/<route-group>.rest` file. Record the exact path and
verify that every controller route has one current labeled request with its parameters,
headers, representative body and reusable non-secret variables. This artifact check is
separate from real HTTP integration evidence.

## Manual evidence

| ID | Scenario | Criteria | Expected | Observed | Status |
| --- | --- | --- | --- | --- | --- |
| `MV-01` | `<user-visible scenario>` | `CA-01` | `<expected outcome>` | `<actual observation>` | `pending` |

## Visual evidence

| ID | Surface and state | Viewport | Reference | Implementation | Differences | Status |
| --- | --- | --- | --- | --- | --- | --- |
| `VIS-01` | `<surface and state>` | `<width × height>` | `design/<reference>.png` | `<Playwright test-results path or CI artifact identifier; — when not retained>` | `<missing, extra, altered or mismatched elements>` | `pending` |

## Rule and documentation compliance

| Authority | Reference | Result | Notes |
| --- | --- | --- | --- |
| Rule Pack | `<repository-relative path>` | `pending` | `<evidence or required alignment>` |

## Findings

| ID | Classification | Source | Affected evidence | Status | Resolution |
| --- | --- | --- | --- | --- | --- |
| `FND-001` | `<implementation, Contract, Rule, environment or CI>` | `<CA, Rule, screenshot, command or PR run>` | `<EV, MV, VIS or CI IDs>` | `active` | `<correction, accepted limitation or next action>` |

## Lessons learned

- `<reusable lesson extracted from a material finding, or “No durable lesson identified.”>`

## PR CI quality gate

<!-- Populate during conclude-spec. The head SHA identifies the PR revision checked by CI; it
is not SDD current-commit metadata. Retain failed and superseded-head runs as history. -->

| ID | Workflow | Head SHA | Result | Run |
| --- | --- | --- | --- | --- |
| `CI-01` | `<applicable workflow>` | `<sha>` | `pending` | `<run URL when available>` |

## History

| Date/Time | Event |
| --- | --- |
| `YYYY-MM-DD HH:mm` | Evaluation created for Spec revision `<revision>`. |
