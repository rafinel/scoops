---
title: Realtime in-product notification toast
status: completed
revision: 7
source:
  type: issue
  ref: https://github.com/rafinel/scoops/issues/35
scope:
  - packages/core
  - packages/validation
  - apps/server
  - apps/web
plan: ./plan.md
evaluation: ./evaluation.md
updated_at: 2026-09-11
---

# Completed outcome

Revision 7 delivered the authenticated realtime in-product notification toast across Core,
Validation, Server and Web. The implementation includes tenant- and recipient-scoped SSE
delivery, database-triggered notification events, the Web realtime lifecycle and toast/dropdown
experience, and the controller-test fixture consolidation: all five controller-test helper
functions now live on `CommunicationModuleFixture`, and the legacy helper module was removed.

Final implementation, runtime, visual, acceptance, rule-alignment and PR CI evidence is retained
in [`evaluation.md`](./evaluation.md). The execution ledger is retained in [`plan.md`](./plan.md).
