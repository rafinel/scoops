---
title: Combo discount management
status: completed
revision: 10
source:
  type: issue
  ref: https://github.com/rafinel/scoops/issues/22
scope:
  - packages/core
  - packages/validation
  - apps/server
  - apps/web
  - documentation/features/pdv/combo-discount-management
last_updated_at: 2026-08-26
---

# Combo discount management — completed

Spec revision `10` was implemented and published through [PR #26](https://github.com/rafinel/scoops/pull/26) at commit `87f59606b3ed537b99751f383cf0cd79d777f241`. The Manager-facing, tenant-scoped Combo management capability, MRP-driven revalidation, REST/API, persistence, seed, responsive Web experience and validation contract were delivered within the recorded exclusions.

`REQ-13` is fully delivered and checked. `REQ-11` and `REQ-12` remain partial and unchecked; `REQ-07` and `REQ-14` consumer behavior remains deferred and unchecked.

See [evaluation.md](./evaluation.md) for the final acceptance matrix, RF/CA/REQ traceability, manual/runtime and visual evidence, findings, limitations, and Core/Server/Web CI quality gate.
