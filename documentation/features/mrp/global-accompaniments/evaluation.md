---
feature: "mrp/global-accompaniments"
spec: ./spec.md
spec_revision: 1
status: in_progress
updated_at: 2026-10-17
---

# Evaluation

Evaluation of Spec revision `1` against the current implementation.

Current result: the integrated candidate (Core, validation, server, web) passes all automated suites, static gates, builds, targeted mutation testing and the complete Web route suite. Manual validation MV-01..MV-03, visual comparison and the independent reviews are pending. No blocking findings.

## Acceptance matrix

| Criterion | Evidence | Status |
| --- | --- | --- |
| AC-01, AC-03, AC-04, AC-05, AC-06, AC-07 | EV-04..EV-09, EV-12 | pending MV |
| AC-02, AC-15 | EV-06, EV-07 | pending MV |
| AC-08, AC-09, AC-11, AC-12, AC-13, AC-14 | EV-04..EV-06, EV-09 | pending MV where cited |
| AC-10 | EV-06, EV-07 | pending MV-02 |

## Automated and runtime evidence

| ID | Layer | Command or scenario | Result | Status |
| --- | --- | --- | --- | --- |
| EV-01 | Web | `pnpm --filter web check:playwright` | Playwright CLI health check passed (1 test) | passed |
| EV-02 | Core | `pnpm --filter @scoops/core test` on `c47cbf10` | 383 files, 1354 tests passed | passed |
| EV-03 | Core / Validation | `check:code`, `check:types`, `check:architecture` for both packages on `c47cbf10` | no errors, no dependency violations | passed |
| EV-04 | Core | `pnpm --filter @scoops/core test` on merged candidate | 384 files, 1406 tests passed (before the later added tests) | passed |
| EV-05 | Server | `pnpm --filter server test` (Testcontainers) | 339 tests passed after fixing one test fixture (FND-02) | passed |
| EV-06 | Web | `pnpm --filter web test` | 219 files, 638 tests passed | passed |
| EV-07 | Web | `pnpm --filter web exec playwright test tests --workers=1` (complete route suite, once) | 286 passed | passed |
| EV-08 | Static | `check:code`, `check:types`, `check:architecture` for core, validation, server, web; `build` for server and web; `pnpm check:test-integrity` | all passed | passed |
| EV-09 | Core mutation | `pnpm --filter @scoops/core test:mutation --files` (11 Spec use cases) then rerun for remove-product, link, update | every file >= 70% (lowest remove-product 75.5%); equivalent mutant: remove-product-accompaniment line 83 (individual row + scope all is rejected earlier in execute) | passed |
| EV-10 | Complexity | `pnpm check:complexity` | passed after fixing 3 real worsenings and refreshing the stale baseline (commit ccff6a48); see FND-03 | passed |
| EV-11 | Database | `db:migration:apply` + `db:seed` on local Docker Postgres; SELECT checks | migration 0029 applied; Granola global has 4 rows for 4 Portions; 4 accompaniment prices as in Spec | passed |
| EV-12 | REST client | `apps/server/rest-client/mrp/products.rest` | candidates, POST/PATCH isGlobal, both DELETE scopes present; parity only, not HTTP proof | passed |

## Manual evidence

| ID | Scenario | Criteria | Expected | Observed | Status |
| --- | --- | --- | --- | --- | --- |
| MV-01 | Manager configures accompaniments | AC-01..07, 09, 12, 15 | per Spec §4 | not run | pending |
| MV-02 | Operator reads tab | AC-10, AC-14 | per Spec §4 | not run | pending |
| MV-03 | PDV consumption | AC-11 | per Spec §4 | not run | pending |

## Visual evidence

Visual evidence uses `EV-*` identifiers with `Type = visual`.

| ID | Type | Surface and state | Viewport | Reference | Implementation | Differences | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |

## Rule and documentation compliance

| Authority | Reference | Result | Notes |
| --- | --- | --- | --- |

## Findings

| ID | Classification | Source | Affected evidence | Status | Resolution |
| --- | --- | --- | --- | --- | --- |
| FND-02 | test defect | server controller test used a single-category target | EV-05 | resolved | Target given a second category; Core correctly rejects removing a last category |
| FND-03 | tooling | complexity baseline was stale (line shifts; 6 web files failing before this work) and 3 functions truly worsened | EV-10 | resolved | 3 functions fixed in code; baseline regenerated with user approval and reviewed (no new error metrics) |
| FND-01 | process | Pre-edit steps (Spec `in_progress`, Evaluation, Playwright preflight) were done after Phase A code was committed | none | resolved | Done before any further feature edit; no evidence depends on the order |

## Lessons learned

- No durable lesson identified.

## PR CI quality gate

| ID | Workflow | Head SHA | Result | Run |
| --- | --- | --- | --- | --- |

## Continuation handoff

- **Branch/candidate:** `feat/global-accompaniments` at `c47cbf10` plus uncommitted docs (this file, Spec status, `implement-spec-prompt.md`)
- **Progress:** Phase A done. Three Builders (core-use-cases, server, web) are running in isolated worktrees from `c47cbf10`.
- **Interrupted/uncommitted paths:** `documentation/prompts/implement-spec-prompt.md`, `documentation/features/mrp/global-accompaniments/{spec.md,evaluation.md}`; Builder worktrees own their code
- **Unfinished criteria:** AC-01..AC-15
- **Blockers and stale evidence:** none
- **Latest checkers:** EV-01..EV-03 passed
- **Next useful action:** merge the three worktree branches, resolve barrel conflicts, then run the full verification list

## History

| Date/Time | Event |
| --- | --- |
| 2026-10-17 | Spec set to `in_progress`; Evaluation created; Phase A committed as `c47cbf10`; Builders launched |
