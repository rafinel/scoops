---
feature: "mrp/global-accompaniments"
spec: ./spec.md
spec_revision: 1
status: ready
updated_at: 2026-10-17
---

# Evaluation

Evaluation of Spec revision `1` against the current implementation.

Current result: the integrated candidate (`feat/global-accompaniments`, head `b92acc81` plus this file) passes every automated suite, static gate, build, targeted mutation check and the complete Web route suite. MV-01..MV-03 passed against the real services at both viewports. The independent Implementation Reviewer and Visual Reviewer reported no blocking findings; their non-blocking findings are dispositioned below. Ready for `conclude-spec`.

## Acceptance matrix

| Criterion | Evidence | Status |
| --- | --- | --- |
| AC-01 | EV-04, EV-05, EV-06, MV-01 steps 2 and 7 | passed |
| AC-02 | EV-06, EV-07, MV-01 step 8 | passed |
| AC-03 | EV-04, EV-05, MV-01 step 2 (row ids kept), MV-03 (combo active after global edit) | passed |
| AC-04 | EV-04, EV-05, EV-06, MV-01 step 3b (Banana: global notice only) | passed |
| AC-05 | EV-04, EV-05, EV-06, MV-01 step 3 | passed |
| AC-06 | EV-04, EV-05, EV-06, EV-07, MV-01 steps 4 and 6 | passed |
| AC-07 | EV-04, EV-05, EV-06, MV-01 step 5 | passed |
| AC-08 | EV-04, EV-05 | passed |
| AC-09 | EV-04, EV-05, MV-01 step 7 | passed |
| AC-10 | EV-05, EV-06, MV-02, EV-14 | passed |
| AC-11 | EV-05, MV-03 | passed |
| AC-12 | EV-04, EV-05, EV-06, MV-01 step 9 (no counts); global-only type verified by automated tests only (FND-05) | passed |
| AC-13 | EV-04, EV-05 | passed |
| AC-14 | EV-04, EV-05 (rollback controller tests), MV-02 | passed |
| AC-15 | EV-06, MV-01 step 8 (keyboard, focus return, announcements), EV-13 | passed |

## Automated and runtime evidence

| ID | Layer | Command or scenario | Result | Status |
| --- | --- | --- | --- | --- |
| EV-01 | Web | `pnpm --filter web check:playwright` | Playwright CLI health check passed | passed |
| EV-02 | Core | `pnpm --filter @scoops/core test` on `c47cbf10` | 383 files, 1354 tests | passed |
| EV-03 | Core / Validation | `check:code`, `check:types`, `check:architecture` on `c47cbf10` | no errors | passed |
| EV-04 | Core | `pnpm --filter @scoops/core test` on the merged candidate | 384 files, 1406 tests passed; tests added in EV-09 also pass | passed |
| EV-05 | Server | `pnpm --filter server test` (Testcontainers) | 339 tests passed after fixing one test fixture (FND-02) | passed |
| EV-06 | Web | `pnpm --filter web test` | 219 files, 638 tests passed | passed |
| EV-07 | Web | `pnpm --filter web exec playwright test tests --workers=1` (complete route suite, once) | 286 passed | passed |
| EV-08 | Static | `check:code`, `check:types`, `check:architecture` for core, validation, server, web; `build` for server and web; `pnpm check:test-integrity` | all passed | passed |
| EV-09 | Core mutation | `pnpm --filter @scoops/core test:mutation --files` on the 11 Spec use cases; rerun for remove-product, link, update after added tests. Report: `packages/core/reports/mutation/` | every file >= 70% (lowest remove-product 75.5%); first run 1152 killed of 1479 | passed |
| EV-10 | Complexity | `pnpm check:complexity` | passes after fixing 3 real worsenings and refreshing the stale baseline (`ccff6a48`) with user approval; FND-03 | passed |
| EV-11 | Database | `db:migration:apply` + `db:seed` on local Docker Postgres, SELECT checks | migration 0029 applied; Granola global has 4 rows for 4 Portions; 4 accompaniment prices as in Spec | passed |
| EV-12 | REST client | `apps/server/rest-client/mrp/products.rest` | candidates, POST/PATCH `isGlobal`, both DELETE scopes present; parity only | passed |
| EV-25 | Coverage | `pnpm --filter @scoops/core test:coverage`, `pnpm --filter web test:coverage`, `pnpm --filter server test:coverage` on the candidate | all three exit 0 at their configured floors: Core 384 files / 1410 tests, Web 219 / 638, Server 97 / 339 | passed |
| EV-26 | Structural | `pnpm check:spec-implementation -- documentation/features/mrp/global-accompaniments/spec.md` | not applicable: the Spec declares no classified exact-path inventory. The checker reads the use-case table's `Action` column (class names marked Modify/Create) as paths and reports 22 errors, all naming use cases, none a missing artifact. Not rerun after changes; no inventory invented | not_applicable |
| EV-13 | Review | Implementation Reviewer over `git diff 5a9ccf09..HEAD` | no blocking findings; low findings dispositioned in FND-08..FND-10 | passed |

Equivalent mutant: `remove-product-accompaniment-use-case.ts` line 83 (`globalAccompanimentId === undefined ||` conditional). An individual row combined with `scope=all` is rejected earlier in `execute`, so the branch cannot be reached.

## Manual evidence

Run against the real server and local Postgres with the seeded Manager and Operator, signed in through the UI. Screenshots are under `apps/web/.playwright-cli/screenshots/`.

| ID | Scenario | Criteria | Expected | Observed | Status |
| --- | --- | --- | --- | --- | --- |
| MV-01 | Manager configures accompaniments, 9 steps incl. keyboard repeat, both viewports | AC-01..07, 09, 12, 15 | per Spec §4 | all steps passed. Morango used instead of Banana for the replacement step (Banana had no other-Portion links). Conversion kept row ids; stock balances unchanged (17 rows, sum 1705.000); new Portion received Granola; types page without counts. Keyboard: focus returned to the trigger, notices are `role=status`, locked switch refuses change and is described by its help | passed |
| MV-02 | Operator reads the tab | AC-10, AC-14 | badge and description, no actions, direct writes 403 | badge and description visible, no Ações column or buttons at both viewports; PATCH x2, DELETE `scope=all`, POST returned 403; table hashes unchanged | passed |
| MV-03 | PDV consumption and Combo | AC-11 | prices include product price, consumption from main brand, Combo saves active | Granola +R$ 3,00 etc.; order of 2 units consumed Granola 0.120 (0.06 x 2) from the main brand and the history shows the sale; Combo with Granola saved active and stayed active after a global edit. Main brand package quantity is 1, so a units conversion cannot be told apart from a plain multiply on this data | passed |

## Visual evidence

Visual evidence uses `EV-*` identifiers with `Type = visual`. Each row was compared at both viewports by the independent Visual Reviewer.

| ID | Type | Surface and state | Viewport | Reference | Implementation | Differences | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| EV-14 | visual | Populated table | 1560 / 390 | `b1dyL` | `mv01-step01-table-*` | longer description wording; card divider; horizontal scroll inside the card at 390 (existing pattern) | passed_with_authorized_difference |
| EV-15 | visual | Link, switch off | 1560 / 390 | `iSdux` | `mv01-step02-link-switch-off-*` | "Marca atual" disabled input instead of select; darker labels; about 512px width | passed_with_authorized_difference |
| EV-16 | visual | Link, global on | 1560 / 390 | `zN1rE` | `mv01-step08-kbd-link-global-new-global-1560.png`, `mv01-step02-link-global-new-390.png` | none material | passed |
| EV-17 | visual | Link, replacement notice | 1560 / 390 | `ymvAn` | `mv01-step02-link-global-replacement-*` | none material | passed |
| EV-18 | visual | Edit, individual | 1560 / 390 | `DT6Vc` | `mv01-step03b-edit-individual-banana-*` | same Marca and label differences; quantity shown with a dot (FND-06) | passed_with_authorized_difference |
| EV-19 | visual | Edit, global locked | 1560 / 390 | `DyrWo` | `mv01-step03-edit-global-locked-*` | none material | passed |
| EV-20 | visual | Link again, locked | 1560 / 390 | `y7dXvq` | `mv01-step05-link-again-global-locked-*` | none material | passed |
| EV-21 | visual | Remove dialog, scope off | 1560 / 390 | `q2gZuS` | `fix-remove-global-scope-off-*` | Cancelar uses the shared grey `outline` variant; 390 subtitle wraps oddly | passed_with_authorized_difference |
| EV-22 | visual | Remove dialog, scope on | 1560 / 390 | `C8la0H` | `fix-remove-global-scope-on-*` | row border fixed in `79ab8eb0`; filled action border fixed in `b92acc81` after the capture, with no new capture | passed |
| EV-23 | visual | Types page | 1560 / 390 | `A5c2Q` | `mv01-step09-types-page-*` | disabled `Remover` on in-use rows (handoff text) vs hidden in the reference; emoji lock in the banner (pre-existing) | passed_with_authorized_difference |
| EV-24 | visual | Operator table, error state, narrow table | 1560 / 390 | none dedicated (existing patterns) | `mv02-operator-table-*`, `mv01-error-state-*` | none material | passed |

## Delivery disposition

Local closure preflight passed on the integrated candidate (EV-04..EV-13, EV-25, MV-01..MV-03, EV-14..EV-24). Dispositions follow the Spec's coverage table.

| Requirement | Disposition | Basis |
| --- | --- | --- |
| MRP PRQ-08 (global accompaniments, incl. the 2026-10-17 amendment) | fully delivered | AC-01..AC-15 passed; FR-01..FR-14 mapped in the acceptance matrix |
| MRP PRQ-09 | partially delivered, as scoped | product-owned price stays shared for globals (AC-05, AC-11); no price-rule change was in scope |
| MRP PRQ-01 / PRQ-05 | partially delivered, as scoped | Portion/Accompaniment category changes and product deletion with globals (AC-09, AC-13) |
| MRP PRQ-10 | partially delivered, as scoped | accessible, keyboard-operable, responsive dialogs and tables (AC-15, EV-14..EV-24) |
| PDV PRQ-03 / PRQ-13 | partially delivered, consumer proof only | globals appear with product price and identical consumption; Combo components accept globals (AC-11, MV-03); no PDV production code changed |

Prompt synchronization: `implement-spec-prompt.md` changed; `pnpm sync:commands` was run and produced no tracked change beyond the canonical prompt (the command copies are symlinks).

## Rule and documentation compliance

| Authority | Reference | Result | Notes |
| --- | --- | --- | --- |
| Rules: core-package, use-case-testing, validation-package, rest-layer, controllers-testing, database-layer, ui-layer, widget-testing, code-conventions | `documentation/rules/` | compliant | Implementation Reviewer found no Rule violation and no weakened test; the Strategy is tested only through use cases |
| Test integrity | `pnpm check:test-integrity` | passed | |
| Complexity | `.code-multivitals-baseline.json` | refreshed with user approval | no new error-level metric (errors 187 to 182); FND-03 |
| PRD MRP PRQ-08 | `documentation/prds/mrp.md` | aligned | amendment committed before the Spec |
| Design | `design/handoff.md` and saved references | aligned | EV-14..EV-24 |
| Reusable guidance | FND-04 lesson | No change | feature-local CSS pitfall; no global Rule proposed without an owner decision |
| Prompt `implement-spec-prompt.md` | `documentation/prompts/` | Updated | states that the prompt does not plan the work and allows parallel worktrees; included in this PR as a user-requested change |

## Findings

| ID | Classification | Source | Affected evidence | Status | Resolution |
| --- | --- | --- | --- | --- | --- |
| FND-01 | process | pre-edit steps done after Phase A code was committed | none | resolved | done before any further feature edit |
| FND-02 | test defect | server test used a single-category target | EV-05 | resolved | target given a second category |
| FND-03 | tooling | complexity baseline stale; 3 functions truly worsened (`buildDetails`, `set-primary` execute, `MrpService`) | EV-10 | resolved | 3 fixed in code; baseline regenerated with approval and its diff reviewed |
| FND-04 | defect | global `* { border-color }` is unlayered and overrides Tailwind border utilities, so `border-danger` rendered grey in the removal dialog | EV-22 | resolved | `border-danger!` on the row and both action states (`79ab8eb0`, `b92acc81`). The same pattern may exist elsewhere in the repo (`border-danger/20` in the analytics dashboard); out of scope |
| FND-05 | evidence gap | AC-12 global-only type shown as `Em uso` in the browser was not exercised in MV-01 | AC-12 | accepted_non_blocking | covered by Core and server controller tests (list and remove accompaniment type with a global-only type) |
| FND-06 | pre-existing | Edit quantity shows `0.08` with a dot while price uses a comma (`use-product-accompaniment-form.ts` `getDefaultQuantity`) | EV-18 | accepted_non_blocking | outside this feature's design delta |
| FND-07 | observation | seeded "Combo Açaí Clássico" becomes inactive on the first Portion republish because its component with `Calda de chocolate` is unpriced (the Spec keeps it unpriced) | MV-01 | accepted_non_blocking | pre-existing seed characteristic; combos with priced accompaniments stay active (MV-03) |
| FND-08 | interpretation | PATCH on an individual row always republishes; no-op suppression applies to global rows (Spec §3 prose vs use-case table) | AC-05 | accepted_non_blocking | follows the use-case table and prior behavior; republishing is idempotent for PDV |
| FND-09 | observation | `role=status` notices mount with their content; announcement by assistive technology was not confirmed with a screen reader | AC-15 | accepted_non_blocking | roles and aria wiring verified by tests and the keyboard run |
| FND-10 | observation | empty-state button still reads `Vincular acompanhamento`; Link and Edit dialogs open with focus on the switch while the select is disabled during loading; candidates use one count query per candidate | AC-15 | accepted_non_blocking | the handoff covers only the card button; benign |
| FND-11 | environment | `pnpm --filter web test:auth:setup` fails on an `origins` assertion | MV-01 | accepted_non_blocking | unrelated to the feature; sign-in done through the UI |

## Lessons learned

- Unlayered global CSS (`* { border-color }`) silently defeats layered Tailwind border-color utilities; use the `!` modifier or move the rule into a layer. Disposition: recorded in FND-04; no Rule change proposed without an owner decision.

## PR CI quality gate

| ID | Workflow | Head SHA | Result | Run |
| --- | --- | --- | --- | --- |

## Continuation handoff

- **Branch/candidate:** `feat/global-accompaniments` at `b92acc81` plus the commit of this file; local only, not pushed
- **Progress:** implementation integrated and verified; both independent reviews reconciled; Evaluation `ready`
- **Interrupted/uncommitted paths:** `documentation/prompts/implement-spec-prompt.md` (prompt edit made at the user's request, uncommitted)
- **Unfinished criteria:** none
- **Blockers and stale evidence:** none blocking; the local dev database holds MV test data (extra Portion, one order, "Combo MV Granola") pending a user decision on reseeding
- **Latest checkers:** EV-04..EV-13 passed; MV-01..MV-03 passed
- **Next useful action:** run `conclude-spec` when publication authority exists

## History

| Date/Time | Event |
| --- | --- |
| 2026-10-17 | Spec set to `in_progress`; Evaluation created; Phase A committed as `c47cbf10`; Builders launched in worktrees |
| 2026-10-17 | Builders merged; server, web, mutation, complexity and route-suite evidence recorded |
| 2026-10-17 | MV-01..MV-03 run; Implementation Reviewer and Visual Reviewer reported no blocking findings; Evaluation set to `ready` |
