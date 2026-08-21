---
feature: identity/users-management/changes/global-summary
spec: ./spec.md
spec_revision: 1
status: ready
updated_at: 2026-08-20
---

# Evaluation

Evaluation of Spec revision 1. Current result: Ready. Global tenant summary, filtered list behavior, REST mapping, browser stability, and fresh visual evidence pass.

Builder Direct `/root/users_global_summary_builder` is activated for revision 1 with RF-01–RF-03/CA-01–CA-03. Owned paths are the Core Identity summary/page structures, list-users use case/interface/service contracts and tests; Identity Drizzle users repository, list-users DTO/controller test; web Identity REST adapter, users query/page/widget tests; and `apps/web/tests/routes/identity/users.index.test.ts`. SDD/PRD/Rules, migrations/models, unrelated routes, and all other dirty paths are prohibited. Required exits are focused Biome, Core/server/web types and tests, authenticated controller evidence, mocked Playwright behavior, screenshot, and console/network inspection.

After dependency tracing, Builder ownership also includes the existing web Identity
`users-page-mapper.ts` and its focused test/barrel only when required; this is the current
adapter boundary that maps `GET /users` responses into the Core page contract.

## Acceptance matrix

| Criterion | Evidence | Status |
| --- | --- | --- |
| `CA-01` | `EV-CORE`; `EV-SERVER` | `passed` |
| `CA-02` | `EV-WEB`; `MV-01` | `passed` |
| `CA-03` | `MV-01`; `VIS-01` | `passed` |

## Automated and runtime evidence

| ID | Layer | Command or scenario | Result | Status |
| --- | --- | --- | --- | --- |
| `EV-PREFLIGHT` | UI | `pnpm --filter web check:playwright` | Playwright CLI 1.62.1 health passed 1/1 | `passed` |
| `EV-CORE` | Core | Core types; focused list-users use-case test | Types pass; 1 file/2 tests pass with summary preservation | `passed` |
| `EV-SERVER` | REST/Database | Server types; focused real `list-users.controller.test.ts` | Types pass; 1 file/2 tests pass, proving filtered metadata, global 3/1/2 summary, actor exclusion and foreign-tenant exclusion | `passed` |
| `EV-WEB` | UI | Web types; focused Users widget/hook tests; focused Users Playwright scenario | Types pass; 2 files/5 tests and affected Playwright 1/1 pass. Builder full Users route run also passed 6/6 with clean console/network | `passed` |

## Manual evidence

| ID | Scenario | Criteria | Expected | Observed | Status |
| --- | --- | --- | --- | --- | --- |
| `MV-01` | Filter a populated Users table | `CA-02`, `CA-03` | Table changes while global counts remain stable; clean console/network | Search/profile/status narrowed the table to one inactive Operator while summary remained 3 total, 1 Manager, 2 Operators; four list-state requests and no separate summary request; console/request failures empty | `passed` |

## Visual evidence

| ID | Surface and state | Viewport | Reference | Implementation | Differences | Status |
| --- | --- | --- | --- | --- | --- | --- |
| `VIS-01` | Filtered Users table with global summary | `1481 × 900` | User-supplied screenshot as behavioral report | Playwright `test-results/` artifact, not retained in feature docs | Inspected: Ana/inactive filtered row and global 3/1/2 header/chips are visible; layout unchanged | `passed` |

## Rule and documentation compliance

| Authority | Reference | Result | Notes |
| --- | --- | --- | --- |
| Product authority | `documentation/prds/identity.md` | `passed` | Explicit global-summary rule added before Spec |
| Rule Pack | Spec §5 | `passed` | Core read structures, Identity repository/REST boundary, mapper, UI consumption and owning tests follow selected rules |
| Architecture/Modules/Design/Tooling | Repository authorities | `passed` | No amendment needed |

## Findings

| ID | Classification | Source | Affected evidence | Status | Resolution |
| --- | --- | --- | --- | --- | --- |
| `FND-001` | Contract/implementation | Direct request and baseline UI/repository inspection | `EV-CORE`; `EV-SERVER`; `EV-WEB`; `MV-01`; `VIS-01` | `resolved` | Added authoritative `UsersPage.summary`, tenant/actor-scoped aggregation, REST mapping and UI consumption without a second request |
| `FND-002` | Test expectation | Initial focused controller rerun | `EV-SERVER` | `resolved` | Replaced an incompatible nested `toMatchObject`/array matcher with direct ID comparison; data implementation was unchanged and focused 2/2 rerun passed |

## PR CI quality gate

| ID | Workflow | Head SHA | Result | Run |
| --- | --- | --- | --- | --- |

## History

| Date | Event |
| --- | --- |
| `2026-08-20` | Revision-1 change Spec and Evaluation created after PRD amendment; Playwright health passed. |
| `2026-08-20` | Builder Direct `/root/users_global_summary_builder` activated with exact revision-1 contracts, paths, exclusions, and validation exits. |
| `2026-08-20` | Dependency tracing expanded Builder ownership to the existing Identity users-page mapper and focused mapping coverage; no other scope changed. |
| `2026-08-20` | Builder and Orchestrator validation passed Core/server/web types, Core 2/2, real controller 2/2, widget/hook 5/5 and affected Playwright 1/1; Builder full Users route passed 6/6. Fresh 1481×900 evidence inspected, findings resolved, Evaluation moved to `ready`. |
