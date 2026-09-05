---
title: Product registration and stock brand controls
status: completed
revision: 4
source:
  type: issue
  ref: https://github.com/rafinel/scoops/issues/31
last_updated_at: 2026-09-05
---

# Completed outcome

Issue #31 is delivered through [PR #33](https://github.com/rafinel/scoops/pull/33).
Managers can register products on the dedicated `/products/new` page with initial
stock and an explicit primary brand, manual stock adjustments retain optional
trimmed justifications, and recipe lines can select active ingredient brands with
primary-brand fallback. The selected recipe brand persists through reload and
drives current recipe costing, capacity, production preview, and production
consumption.

The implementation passed the final applicable PR CI quality gate at head
`5787ea4b2eb38e85610d82282d58052d2c42632d`. REQ-06 is fully delivered and checked
in the MRP PRD; REQ-01, REQ-02, and REQ-03 remain partial and unchecked because
their broader capabilities are outside this delivery.

Detailed acceptance criteria, implementation conformance, runtime and visual
evidence, findings, lessons, documentation disposition, and CI records are
preserved in [evaluation.md](./evaluation.md).
