---
title: Product details pricing tab
status: completed
revision: 1
source:
  type: issue
  ref: [https://github.com/rafinel/scoops/issues/17](https://github.com/rafinel/scoops/issues/17)
evaluation: ./evaluation.md
plan: ./plan.md
completed_at: 2026-08-24
last_updated_at: 2026-08-24
---

# Outcome

Spec revision 1 is complete. GitHub Issue [#17](https://github.com/rafinel/scoops/issues/17)
was delivered as a full-stack MRP pricing feature for the Manager product details page:

- Portion pricing supports read, add, edit, activation/deactivation and confirmed removal,
  including validation retention and final-active protection.
- Resale pricing supports Single and By-brand current configuration with unavailable/no-brand
  states and future-only semantics.
- Core, Validation, transactional Server persistence, migration `0010`, REST composition,
  protected Web routing, responsive widgets and browser coverage are implemented.
- PDV order/history data is not rewritten by pricing changes.

PRD requirements `REQ-01`, `REQ-02`, `REQ-05`, `REQ-09` and `REQ-10` remain unchecked because
this delivery implements their pricing-related partial scope; product registration, brand
management, broader product-page settings and product+size+accompaniment pricing remain outside
the Spec. Issue #17 acceptance is complete.

The delivery commit is `7c6d47b63f3edfc1d5feaeb59cd5c05f67307390`, published as draft
[PR #19](https://github.com/rafinel/scoops/pull/19). Core, Server and Web PR CI all passed on
that head. No merge or deployment was performed.

For the authoritative acceptance matrix, runtime/manual/visual evidence, findings, documentation
alignment and CI records, see [`evaluation.md`](./evaluation.md). The execution ledger is retained
in [`plan.md`](./plan.md).
