---
feature: mrp/products-page/changes/global-kpis
spec: ./spec.md
spec_revision: 1
status: ready
updated_at: 2026-08-20
---

# Evaluation

Evaluation of Spec revision 1 against the current implementation.

Current result: Ready. Tenant-global KPI aggregation, filtered list behavior, browser stability, and the fresh filtered-state capture pass on the current candidate.

Builder Direct `/root/global_kpis_builder` is activated for revision 1. Owned paths are
`apps/server/src/mrp/database/drizzle/repositories/drizzle-products-repository.ts`, the
existing repository-backed `GET /products` controller test/fixture path, and
`apps/web/tests/routes/mrp/products.index.test.ts`. All other feature, SDD, authority,
migration, route, and production UI paths are prohibited. Contract coverage is RF-01–RF-03
and CA-01–CA-03; the required exits are focused Biome, server/web types, focused server
integration evidence, and focused Products Playwright evidence.

Builder Fix QG-2 expands validation ownership only to
`apps/web/tests/routes/mrp/products.real.integration.test.ts`, after handoff inspection found
that the existing real repeated-category scenario can prove the production repository
aggregation through the authenticated REST boundary without adding a prohibited
repository-direct test.

## Acceptance matrix

| Criterion | Evidence | Status |
| --- | --- | --- |
| `CA-01` | `EV-02` | `passed` |
| `CA-02` | `EV-02` | `passed` |
| `CA-03` | `EV-03`; `MV-01`; `VIS-01` | `passed` |

## Automated and runtime evidence

| ID | Layer | Command or scenario | Result | Status |
| --- | --- | --- | --- | --- |
| `EV-01` | UI preflight | `pnpm --filter web check:playwright` | Playwright CLI 1.62.1 health flow passed 1/1 | `passed` |
| `EV-02` | Database/REST | `pnpm --filter server check:types`; real `products.real.integration.test.ts` repeated-category scenario | Server types pass; authenticated real GET proves filtered rows/metadata with KPI equality to the unfiltered response, no console errors or failed requests | `passed` |
| `EV-03` | UI | Focused Biome; `pnpm --filter web check:types`; mocked Products route global-KPI scenario | Checks pass and Playwright 1/1 proves one request per list state, changed rows/query, and stable 22/7/4 cards | `passed` |

## Manual evidence

| ID | Scenario | Criteria | Expected | Observed | Status |
| --- | --- | --- | --- | --- | --- |
| `MV-01` | Narrow a populated product list with search/filter | `CA-03` | Rows and request change; Products, Brands, and Low Stock values do not | Search `morango` produced filtered-empty state while cards remained 22/7/4; authenticated repeated-category flow likewise retained the initial KPI payload | `passed` |

## Visual evidence

| ID | Surface and state | Viewport | Reference | Implementation | Differences | Status |
| --- | --- | --- | --- | --- | --- | --- |
| `VIS-01` | Products catalog with narrowed list and global KPIs | `1481 × 900` viewport (`1481 × 901` full-page image) | User-supplied current-state screenshot (behavioral report, not styling authority) | Playwright `test-results/` artifact, not retained in feature docs | Inspected: filtered-empty list and search are visible; global cards remain 22/7/4; layout is unchanged | `passed` |

## Rule and documentation compliance

| Authority | Reference | Result | Notes |
| --- | --- | --- | --- |
| Product authority | `documentation/prds/mrp.md` | `passed` | Explicit user-approved global KPI rule recorded before Spec authoring |
| Rule Pack | Spec §5 | `passed` | Diff stays in the MRP Drizzle read boundary and existing Playwright integration boundaries; no direct repository test added |
| Architecture/Modules/Tooling/Design | Repository authorities | `passed` | No boundary, ownership, command, or visual-system amendment required |

## Findings

| ID | Classification | Source | Affected evidence | Status | Resolution |
| --- | --- | --- | --- | --- | --- |
| `FND-001` | Contract/implementation | Direct request; former PRD and Products-page revision-16 RF-03 | `EV-02`; `EV-03`; `MV-01`; `VIS-01` | `resolved` | KPI SQL uses the establishment predicate alone; rows and pagination retain active filter predicates |
| `FND-002` | Validation evidence | Builder Direct handoff inspection | `EV-03`; `MV-01`; `VIS-01` | `resolved` | QG-1 added the required fresh 1481×900 viewport capture and focused browser rerun passed |
| `FND-003` | Validation evidence | Builder Direct handoff inspection | `EV-02`; `CA-01`; `CA-02` | `resolved` | QG-2 compares unfiltered and filtered KPI payloads through the real authenticated REST/repository flow; 1/1 passes with clean console/network |

## PR CI quality gate

| ID | Workflow | Head SHA | Result | Run |
| --- | --- | --- | --- | --- |

## History

| Date | Event |
| --- | --- |
| `2026-08-20` | Revision-1 change Spec opened after explicit product-authority amendment; Evaluation created, Playwright health passed, and baseline discrepancy recorded. |
| `2026-08-20` | Builder Direct `/root/global_kpis_builder` activated for revision 1 with exact repository, controller-test, and Products-route-test ownership; prohibited from SDD/authority, migration, route, and production UI edits. |
| `2026-08-20` | Orchestrator inspection confirmed the one-line tenant-only KPI predicate and browser stability assertions, but found the required fresh visual capture missing; `FND-002` activated and Builder Fix QG-1 assigned on the existing route-test path only. |
| `2026-08-20` | QG-1 added the required fresh capture and passed focused browser validation. Orchestrator inspection then identified the existing real repeated-category scenario as the correct server-backed aggregation boundary; `FND-003` activated and QG-2 assigned on that test path only. |
| `2026-08-20` | QG-2 and Orchestrator rerun passed the real authenticated repeated-category scenario. Static/type checks, mocked browser regression, real REST/repository proof, console/network inspection, and fresh visual inspection are current; Evaluation moved to `ready`. |
