---
title: Destino do estoque por linha no cancelamento de pedido
status: completed
revision: 1
source:
  type: issue
  ref: https://github.com/rafinel/scoops/issues/45
scope:
  - packages/core/src/pdv
  - packages/core/src/mrp
  - packages/validation/src/pdv
  - apps/server/src/pdv
  - apps/server/src/shared/provision/pdv-order-registration
  - apps/server/src/shared/database/drizzle/migrations
  - apps/web/src/ui/pdv
  - apps/web/src/rest/services/pdv-service.ts
last_updated_at: 2026-09-27
---

# Outcome

Spec revision 1 is implemented and complete. Order cancellation supports a return-or-loss choice per line, persists line-attributed outcomes atomically, and preserves the original sale snapshot.

[Pull request #46](https://github.com/rafinel/scoops/pull/46) passed Core, Server, Validation, Web, and all Complexity checks at head `f8602d2df7b94aba68c8d9e5f88510ce4520b30a`.

See [Evaluation](./evaluation.md) for the acceptance matrix, PRD disposition, implementation and runtime evidence, visual comparisons, findings, and final CI results.
