---
feature: "pdv/new-order-workflow"
status: completed
spec_revision: 3
github_issue: https://github.com/rafinel/scoops/issues/23
pull_request: https://github.com/rafinel/scoops/pull/27
evaluation: ./evaluation.md
plan: ./plan.md
completed_at: 2026-08-28
updated_at: 2026-08-28
---

# New Sale order workflow — completed

Spec revision `3` was implemented across Core, Validation, MRP and PDV persistence, REST and
the protected Web New Sale route. The delivery includes authoritative catalog/pricing/Combo
preview, signed preview-token concurrency validation, atomic order registration with stock and
Sale-ledger correlation, tenant-qualified idempotency, replay/rollback verification and the
responsive configuration, recovery and success states.

The implementation was published in commit `899550d` with the CI correction `73ab7f8` through
[PR #27](https://github.com/rafinel/scoops/pull/27). All `CA-01`–`CA-12` and `MV-01`–`MV-06`
passed, including fresh supplied and supplemental visual evidence and current-head Core,
Validation, Server and Web PR CI.

PDV `REQ-02`–`REQ-08` and `REQ-14` are fully delivered and checked. `REQ-09`, `REQ-11` and
`REQ-12` remain partial and unchecked; `REQ-10` remains deferred and unchecked. Payment,
fiscalization, cancellation/refund, offline behavior and order history/list/detail remain
outside this delivery.

See [evaluation.md](./evaluation.md) for the complete acceptance matrix, RF/CA/REQ traceability,
runtime/manual/visual evidence, findings and documentation dispositions, and CI quality gate.
The execution ledger is retained in [plan.md](./plan.md).
