---
title: Sentry operational monitoring
status: completed
revision: 9
source:
  type: issue
  ref: https://github.com/rafinel/scoops/issues/42
scope:
  - apps/web
  - apps/server
  - packages/core
  - packages/validation
  - .github/workflows
  - .code-multivitals-baseline.json
last_updated_at: 2026-09-25
---

# Outcome

Implemented the repository-scoped monitoring capability from [Issue #42](https://github.com/rafinel/scoops/issues/42) for Web and Server. Revision 9 requirements FR-01–06 and acceptance criteria AC-01–08 pass current evaluation and exact-head CI. The Server startup now loads configured dotenv files before Sentry schema validation while keeping Sentry initialization ahead of Nest and AppModule imports.

The delivery is partial against Issue #42: Sentry account setup, live ingestion, alert delivery, deployed release/map comparison and production deployment remain operator-owned and outside this repository Spec's acceptance. No module PRQ applies.

**Delivery:** [PR #43](https://github.com/rafinel/scoops/pull/43), ready for review at `a952f7b423a23baeda02f5063934755d9bf19a97`.

**Evidence and implementation record:** [Evaluation](./evaluation.md).
