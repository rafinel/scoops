---
feature: "mrp/acompaniment-price"
spec: ./spec.md
spec_revision: 3
status: ready
updated_at: 2026-10-15
---

# Evaluation

Evaluation of Spec revision 3 against the current implementation candidate.

Current result: Revision 3 corrects only the Core technical contract path and package export; FR-01–FR-10 and AC-01–AC-11 are unchanged. Product-behavior, manual, and visual evidence from revision 1 remains relevant. Independent Spec compatibility and implementation reviews passed with no blockers. Concrete PDV Strategies are module-local under `pdv/domain/strategies`; only the generic `BusinessRuleStrategy` contract is shared under `shared/domain/strategies`. The six Strategy-local test files that conflicted with the Core Rule were removed; their behavior assertions now run through Preview and Register Order Use Cases, including ordered Portion-size and accompaniment shortages. Refreshed Core coverage passed 383 files and 1,340 tests, test-integrity passed, and the Spec path checker passed. The full Web integration reruns passed 278/278 and 279/279; earlier Analytics/Communication failures did not reproduce in the later full or focused reruns. The malformed-pagination case logged its expected route error-boundary diagnostic.

## Acceptance matrix

| Criterion | Evidence | Status |
| --- | --- | --- |
| AC-01 | EV-020, EV-022 | passed |
| AC-02 | EV-022, MV-01 | passed |
| AC-03 | EV-020, EV-022, MV-01 | passed |
| AC-04 | EV-020, EV-022, MV-01 | passed |
| AC-05 | EV-020, EV-022, MV-01 | passed |
| AC-06 | EV-020, EV-022, MV-02 | passed |
| AC-07 | EV-020, EV-022, EV-016, EV-017, MV-02 | passed |
| AC-08 | EV-020, EV-022, EV-024, EV-035, EV-037, MV-02 | passed |
| AC-09 | EV-022, EV-016, EV-017, EV-019, EV-035, MV-02 | passed |
| AC-10 | EV-022, MV-02 | passed |
| AC-11 | EV-020, EV-022, MV-01 | passed |

## Automated and runtime evidence

| ID | Layer | Command or scenario | Result | Status |
| --- | --- | --- | --- | --- |
| EV-001 | Web browser preflight | `pnpm --filter web check:playwright` before affected UI implementation | Chromium health check passed, 1/1 in 29.2 seconds. The script exercised browser launch, dev-server/page load, console, network, keyboard, and screenshot checks. Node emitted existing `NO_COLOR`/`FORCE_COLOR` warnings. | passed |
| EV-020 | Core tests | `pnpm --filter @scoops/core test:coverage` after Strategy integration | 383 test files and 1,340 tests passed. Coverage: 77.87% statements, 67.15% branches, 84.12% functions, 79.83% lines. Direct Strategy tests were removed; behavior is exercised through consuming use cases under the Core Rule. | passed |
| EV-021 | Core mutation | Refreshed Spec-required six-file `pnpm --filter @scoops/core test:mutation --files …` scope | 1,528 mutants; 1,194 killed, 292 survived, 42 had no coverage; 0 timeouts and 0 errors. Per-file scores: change categories 75.47%, affected sales configurations 95.07%, product pricing 87.89%, Link 75.14%, Register 73.39%, Edit 70.70%. Every targeted changed file clears the 70% floor. Remaining no-coverage/survivor dispositions are recorded in Findings. | passed |
| EV-022 | Validation, Server, and Web checks | Package type/code/architecture checks, Server and Web builds, full package tests and focused widget tests | Validation type/code/architecture checks passed. Server coverage suite passed (96 files/295 tests); Server code/architecture/types/build passed with 7 existing code warnings. Web coverage suite passed (217 files/581 tests); Web code/types/build passed with 19 existing code warnings and the existing large-chunk build warning. Two affected widget test files passed (12 tests). | passed |
| EV-023 | Full Web integration | `pnpm --filter web test:integration` | Latest full rerun: 278/278 passed in 28.6 minutes. The earlier run had seven Analytics/Communication failures and three MRP fixture failures; the seven did not reproduce, and the MRP fixtures were corrected before this rerun. | passed |
| EV-024 | Focused MRP browser regressions | Playwright CLI for the three corrected MRP regression scenarios | 3/3 passed after supplying the exact price response and required Link value. The run exercised retained form/server-error behavior and stock recovery. | passed |
| EV-025 | Spec and test integrity | `pnpm check:spec-implementation -- documentation/features/mrp/acompaniment-price/spec.md`; `pnpm check:test-integrity`; `git diff --check` after the test-boundary correction | Spec path checker passed for 57 contracted paths (17 Create, 35 Modify, 2 Generate, 3 Remove); test-integrity passed for 444 tracked test files and 47 changed test files; diff check passed. | passed |
| EV-026 | Narrow MRP dialog keyboard regression | `pnpm --filter web exec playwright test --output=/tmp/scoops-playwright-evidence-results tests/mrp/accompaniments.supplemental.test.ts --grep 'captures narrow link and edit accompaniment dialogs'` | Link and Edit both move keyboard focus to Cancel at 390 × 844, and the focused action remains fully within each dialog. The fresh authenticated screenshots also show the cost breakdown and fixed footer. | passed |
| EV-027 | Repriced-order review browser regression | `pnpm --filter web exec playwright test --output=/tmp/scoops-playwright-evidence-results tests/pdv/new-sale-page.test.ts --grep 'reviews repriced values and requires a second confirmation'` | The focused desktop/narrow scenario passed 2/2 after testing two successive repriced responses, distinct fresh tokens and a final registration. The test exposed and verified the fix for a redundant preview request that could overwrite the latest server token. Latest screenshots are recorded in EV-035. | passed |
| EV-028 | Focused accompaniment dialog widget test | `pnpm --filter web test src/ui/mrp/widgets/slots/product-accompaniments-slot/product-accompaniment-dialog/tests/product-accompaniment-dialog.test.tsx` | 1 file and 6 tests passed. | passed |
| EV-029 | Final Web code check | `pnpm --filter web check:code` | Checked 930 files with no fixes; the 19 repository warnings already recorded in EV-022 remain. | passed |
| EV-030 | Fresh authenticated MRP visual evidence | Playwright CLI Manager login against local Server and Web apps; read-only screenshots at desktop and narrow viewports | Six fresh screenshots show the current seeded state. The initial anonymous route returned the expected `401 /auth/session`; no requests failed, and authenticated visual routes loaded without HTTP errors. | passed |
| EV-031 | PDV accompaniment price delta and cause | Focused Core registration tests | The preview signs selected accompaniment price/name snapshots without returning internal metadata publicly. Registration reports the accompaniment's old/new price separately from the affected Portion line and order total, with a cause marker used for accurate review copy. Four test files and 38 tests passed. | passed |
| EV-032 | Like-for-like MRP table capture | `pnpm --filter web exec playwright test --output=/tmp/scoops-playwright-evidence-results tests/mrp/accompaniments.supplemental.test.ts --grep 'five-priced-row'` | 1/1 passed. The route-mocked capture uses five priced rows and matching density for the saved reference; real authenticated data remains in EV-030. | passed |
| EV-033 | MRP narrow dialog and table regressions | Same focused supplemental Playwright command, grepping the five-row capture and narrow Link/Edit scenario | 2/2 passed. The 390 × 844 Link and Edit captures show the cost panel and keyboard footer fully inside the dialog. | passed |
| EV-034 | Final PDV visual recheck | `pnpm --filter web exec playwright test --output=/tmp/scoops-playwright-evidence-results tests/pdv/new-sale-page.test.ts --grep 'reviews repriced values and requires a second confirmation'` | 2/2 passed. The fresh desktop and narrow captures show the amber outline, accompaniment-specific subtitle, accompaniment price, affected item and total. | passed |
| EV-035 | Repeated repricing and current-token flow | Same focused Playwright command as EV-034 | At desktop and narrow sizes, two successive `409 repriced` responses each return a different preview token and updated amounts. Each requires another keyboard review and explicit confirmation; the only registered outcome is the third request. Screenshots: `apps/web/test-results/pdv/new-sale-repriced-review-repeat-desktop-1560x1178.png` and `apps/web/test-results/pdv/new-sale-repriced-review-repeat-narrow-390x844.png`. | passed |
| EV-036 | Generic stale-cause message regression | `pnpm --filter web test src/ui/pdv/widgets/pages/new-sale-page/tests/new-sale-page.test.tsx` | Five tests passed. A channel-change response renders a generic accurate message; the Playwright accompaniment case retains the specific accompaniment-price message. | passed |
| EV-037 | Preview refresh after repricing | `pnpm --filter web test src/ui/pdv/widgets/pages/new-sale-page/tests/use-new-sale-page.test.ts` | Ten tests passed. The repriced cart keeps its server token without a duplicate preview; a subsequent channel change with the same line inputs triggers a fresh channel-specific preview and confirmation uses that token. | passed |
| EV-038 | Strategy contract and Spec revision 3 | Core Rules, architecture, active Spec, Evaluation and independent implementation review | Core rules and architecture allow pure module-owned Strategies; Spec revision 3 preserves all product FR/AC contracts and lists concrete PDV Strategy boundaries. Concrete classes are in `pdv/domain/strategies`, while the generic contract is in `shared/domain/strategies`. Independent Spec and implementation reviews passed with no blockers. | passed |
| EV-039 | Strategy contract architecture correction | `pnpm --filter @scoops/core check:architecture` after relocating the shared contract | The first run found six domain-to-interfaces violations from Strategy classes. Revision 3 places the shared contract and package subpath under `shared/domain/strategies`; the corrected run found no dependency violations (649 modules, 2,939 dependencies). Independent Spec follow-up passed. | passed |
| EV-040 | Strategy integration checks | Core code/types/architecture checks and PDV preview/registration consumer tests | Core code, types and architecture checks pass. Preview/registration consumer test command passed 8 test files and 52 tests after removing isolated Strategy tests, including unavailable size/accompaniment shortage ordering. Independent re-review found no blocker. | passed |
| EV-041 | Revision 3 interactive Spec status | Playwright CLI full-page screenshots at 1560 × 1178 and 390 × 844 | Fresh desktop/narrow captures show revision 3 and `in progress` consistently in the metadata and header; narrow content has no horizontal overflow. Paths: `apps/web/test-results/mrp-accompaniment-price/spec-revision3-desktop.png` and `apps/web/test-results/mrp-accompaniment-price/spec-revision3-narrow.png`. | passed |
| EV-042 | Core complexity advisory scan | `pnpm --filter @scoops/core check:complexity` | The scan reports zero functions over error thresholds after decomposing the new Strategies and registration orchestration. It exits 2 for 112 warning-threshold functions across 553 analyzed files; this command is not a Spec-required gate. Warnings are retained for assessment rather than expanding this local feature into broad repository refactoring. | assessed |
| EV-043 | Refreshed Server coverage | `pnpm --filter server test:coverage` | 96 files and 295 tests passed. Coverage: 73.9% statements, 57.34% branches, 76.94% functions, and 76.85% lines. | passed |
| EV-044 | Final full Web integration | `pnpm --filter web test:integration` | 279/279 passed in 23.9 minutes. All seven Analytics/Communication failures from the earlier run again did not reproduce; the three corrected MRP fixture cases pass. The malformed-pagination route test deliberately emits a Zod validation/error-boundary console diagnostic and passes. Reduced-motion environment warnings were informational. | passed |

## Manual evidence

| ID | Scenario | Criteria | Expected | Observed | Status |
| --- | --- | --- | --- | --- | --- |
| MV-01 | Manager configures and edits shared price | AC-02–AC-06, AC-11 | Saved price, suggestion, category tabs, permissions, atomic Link/Edit, shared propagation, cost separation, and recovery are visible and persisted. | Linked Creme de avelã and confirmed the first-link suggestion was its Resale price (R$75), while estimated consumption cost was R$1.89 for 0.03 kg. Link/Edit saved the product-owned price; both linked Portion tables reflected edits. The saved Accompaniment price remained R$80 while PDV resale stayed R$75; current table was later set to R$84 for screenshots. The Spec contract permits finite, non-negative prices with at most two decimal places; no R$75,000 upper limit was tested or evidenced. | passed |
| MV-02 | Operator reviews changed price and preserves history | AC-06–AC-10 | PDV uses current paid/free prices, requires review and renewed confirmation, creates one order, and preserves historical snapshots. | A 300 g Açaí sale added the paid accompaniment once. Changing R$80 to R$82 triggered review before any write (order count stayed 22); renewed keyboard review and explicit confirmation created Order #0023 at R$101.90. Changing to R$84 triggered another review and created #0024 at R$103.90. SQL confirmed #0023 retained base/final accompaniment price R$82 and #0024 captured R$84; historical totals stayed unchanged. | passed |

## Visual evidence

Visual evidence uses `EV-*` identifiers with `Type = visual`.

| ID | Type | Surface and state | Viewport | Reference | Implementation | Differences | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| EV-013 | visual, route-mocked | Populated Portion Accompaniments table, Manager | 1560 × 1178 | `design/s3CfpB.png` | `apps/web/test-results/mrp/accompaniment-price-populated-table-1560x1178.png` | Five priced rows now match the reference state. The live authenticated four-row state, including the saved R$84 value, remains recorded in EV-030. | passed |
| EV-014 | visual | Link accompaniment dialog, Manager | 1560 × 1178 | `design/iSdux.png` | `apps/web/test-results/mrp-accompaniment-price/live-link-dialog-1560x1178.png` | Leading icon is removed and the right-aligned quantity × unit-cost detail is visible. The live target is Creme de avelã at R$84; its estimated consumption cost is R$1,89 for 0,03 kg. | passed |
| EV-015 | visual | Edit accompaniment dialog, Manager | 1560 × 1178 | `design/DyrWo.png` | `apps/web/test-results/mrp-accompaniment-price/live-edit-dialog-1560x1178.png` | Leading icon is removed, the saved R$84 price is prefilled, and the cost panel shows quantity × unit cost; the live target/quantity differ from the illustrative reference. | passed |
| EV-016 | visual, route-mocked | PDV price review dialog, Operator | 1560 × 1178 | `design/AYpcB.png` | `apps/web/test-results/pdv/new-sale-repriced-review-desktop-1560x1178.png` | Amber outline and accompaniment-specific subtitle match; the accompaniment price is bold and the affected Portion line is smaller and muted. Rendering only; server-backed behavior is recorded separately in MV-02 and EV-031. | passed |
| EV-017 | visual, route-mocked | PDV price review dialog, Operator | 390 × 844 | `design/mouHc.png` | `apps/web/test-results/pdv/new-sale-repriced-review-narrow-390x844.png` | Subtitle and secondary price line wrap readably; both warning cards, the total and review action remain visible. Rendering only; server-backed behavior is recorded separately in MV-02 and EV-031. | passed |
| EV-018 | visual | Portion Accompaniments table, Manager | 390 × 844 | `design/s3CfpB.png` (desktop reference) | `apps/web/test-results/mrp-accompaniment-price/live-product-accompaniments-390x844.png` | Horizontal table scrolling exposes the action column without page overflow; keyboard focus is on Edit for Creme de avelã. Seed content differs from the reference labels. | passed |
| EV-019 | visual | Link and Edit dialog keyboard footer, Manager | 390 × 844 | `design/iSdux.png`, `design/DyrWo.png` (desktop references) | `apps/web/test-results/mrp-accompaniment-price/live-link-dialog-390x844-keyboard-footer.png`; `apps/web/test-results/mrp-accompaniment-price/live-edit-dialog-390x844-keyboard-footer.png` | Tab moves focus to Cancel; both footer actions and the complete cost amount/detail remain visible inside the dialog. | passed |

## Rule and documentation compliance

| Authority | Reference | Result | Notes |
| --- | --- | --- | --- |
| SDD lifecycle | `documentation/sdd.md` | Read and applied | Spec revision 3 records the architecture boundary correction; Evaluation remains in progress and PRD checkboxes remain delivery-owned. |
| Product intent | `documentation/prds/mrp.md`, `documentation/prds/pdv.md` | Read; aligned | MRP Link/Edit ownership and PDV current-price review/history contract match the Spec. |
| Architecture and ownership | `documentation/architecture.md`, `documentation/modules.md` | Read; aligned | MRP owns product price and eligibility; PDV owns cart recalculation and order snapshots; Server adapters preserve transaction and outbox boundaries. |
| Rule router and selected Rule Pack | `documentation/rules.md`; code conventions, Core, use-case testing, Validation, REST, controller testing, database, provision, messaging, UI, routing, and widget testing rules | Read in full; selected | Re-run discovery if implementation expands into another layer. |
| Tooling | `documentation/tooling.md` | Read; applied | Workspace commands, migration generation, mutation scope, browser workflow, and structural checker recorded in the Spec. |
| Design | `documentation/design.md`, `design/handoff.md`, five saved PNG references | Read and visually inspected | Runtime comparisons are recorded in EV-013–EV-019; no live Pencil dependency. |

## Findings

| ID | Classification | Source | Affected evidence | Status | Resolution |
| --- | --- | --- | --- | --- | --- |
| F-001 | Validation harness | `pnpm --filter web test:auth:setup` expects empty origin storage after login; local telemetry stores a value there | MV-01, MV-02 | isolated | The helper assertion failed after authentication. Existing seeded Manager/Operator accounts were used through accessible Playwright login flows instead; both authenticated real-server scenarios passed. Auth state files were restored. |
| F-002 | Transient browser failures | Full integration tests `tests/analytics/dashboard-page.test.ts`, `tests/communication/notification-toast.test.tsx`, and `tests/communication/notifications-page.test.tsx` | EV-023 | resolved on rerun | The seven failures from the earlier full run did not reproduce in the later 278/278 full rerun or the focused Analytics/Communication rerun. The narrow toast scenario failed once in the focused run, passed three consecutive repeats, and passed in the full rerun; this isolated miss remains recorded as intermittent test evidence, with no product failure reproduced. |
| F-003 | Stale browser fixtures | `tests/mrp/accompaniments.supplemental.test.ts` and `tests/mrp/product-accompaniments-page.test.ts` | EV-023, EV-024 | resolved | Fixtures now provide exact successful pricing responses and the required Link value; stock recovery reaches its intended stock failure. All three corrected cases pass in the focused rerun. |
| F-004 | Mutation survivors and uncovered mutants | Spec-required six-file Core mutation scope | EV-021 | assessed | The final run reports 292 survivors and 42 no-coverage mutants. Added focused cases now cover invalid Link owners before writes and primary-brand cost selection when an ingredient has no selected brand. Remaining mutants include exact copy strings, deterministic category dependency sorting not asserted by the contract, null-to-empty fallbacks under repository array contracts, and defensive missing/foreign snapshot reads that tenant-scoped repositories plus database foreign keys cannot return during a valid transaction. All six files clear 70%; no mutation runner errors or timeouts occurred. |
| F-005 | Unsupported price-limit statement | Independent implementation review | MV-01 | resolved | Removed the unsupported R$75,000 upper-limit claim. The saved-price contract permits finite, non-negative values with at most two decimal places. |
| F-006 | Missing accompaniment delta in repricing response | Independent implementation review; AC-09 and `design/AYpcB.png` | EV-031, MV-02 | resolved | Signed preview facts now retain the selected accompaniment's prior name and base price. Registration compares those snapshots with current catalog facts and reports the accompaniment price separately from the affected item and total; regression coverage passes. |
| F-007 | Stale or non-comparable visual evidence | Independent implementation and visual reviews | EV-013–EV-019 | resolved | Captured the five-row priced MRP reference state, refreshed current authenticated Link/Edit/table screenshots, and corrected PDV screenshots to existing route-mocked paths. Route-mocked visual proof and authenticated behavior proof are labeled separately. |
| F-008 | Remaining visual differences | Independent visual review | EV-013–EV-019, EV-035 | assessed | Corrected reference copy and amber outline, matched the five-priced-row table, removed Link/Edit header icons, added quantity × unit-cost details and kept narrow content/actions visible. Current Link/Edit dialogs are about 788px high versus the 721px reference; PDV review is about 448px versus 382px desktop and 485px versus 435px narrow. The added cost and repricing details remain fully visible; independent visual review found no screenshot-evident blocker. |
| F-009 | Inaccurate cause-specific review copy | Independent implementation review | EV-031, EV-036 | resolved | Registration marks accompaniment-price deltas explicitly. The dialog uses the dedicated accompaniment message only for that cause and a generic accurate message for channel, Combo and other stale outcomes; the channel regression passes. |
| F-010 | Repeated repricing could reuse an older preview token | Independent implementation review; AC-08 | EV-035, EV-037 | resolved | A redundant automatic preview after receiving a server-repriced cart could overwrite its fresh token. The page now preserves the authoritative cart/token pair for those line inputs; the redundant fetch is skipped once, while a later channel change or explicit refresh can preview the same lines normally. |
| F-011 | Repriced-preview skip sentinel could suppress later refreshes | Independent implementation re-review | EV-037 | resolved | The one-time sentinel is consumed when the redundant preview is skipped. A hook regression changes channel with unchanged line inputs and verifies a new preview and current token. |
| F-012 | Shared Strategy contract placed in integration boundary | Core architecture check | EV-038–EV-040 | resolved | `check:architecture` rejected six imports from domain Strategies into `shared/interfaces`. Revision 3 places the contract under `shared/domain/strategies`, documents it as a domain contract, and preserves the rule that domain code cannot depend on interfaces. The corrected architecture check passed, and independent Spec and implementation reviews found no blockers. |
| F-013 | Test-boundary rule violation | Core Package Rules and Use Case Testing Rules | EV-020, EV-025, EV-040 | resolved | Removed six direct `domain/strategies/tests` files. Added missing input-validation, selected-price snapshot, product-availability, rounding and Combo-allocation assertions to Preview Order Use Case tests, plus ordered unavailable size/accompaniment shortage coverage through Register Order Use Case. Focused consumer tests passed (8 files/52 tests); refreshed Core coverage passed (383 files/1,340 tests), test-integrity passed, and independent re-review found no blocker. |

## Lessons learned

- Product-specific Playwright route mocks should be exact or registered so broad `**/products/**` handlers can pass unrelated requests through to their intended fixtures.
- Signed order-preview facts can retain the prior accompaniment price needed for a precise reprice explanation without adding internal catalog metadata to the public preview response.
- A server-repriced cart and its token are one authoritative result; refreshing an identical line selection can race and replace the token before the user's next confirmation.
- The generic contract shared by pure domain Strategies belongs under the shared domain boundary, not the integration `interfaces` directory; the architecture checker caught this before integration was complete.
- Test Strategy behavior through consuming use cases so Core unit tests preserve the repository's use-case-only test boundary.

## PR CI quality gate

| ID | Workflow | Head SHA | Result | Run |
| --- | --- | --- | --- | --- |

## Continuation handoff

- **Branch/candidate:** `fix/acompaniment-price`; dirty worktree, no implementation commit. Candidate evidence must distinguish the pre-existing user changes from this feature's implementation.
- **Progress:** Spec revision 3 passed independent compatibility review and remains `in_progress`; Evaluation is `ready` for the conclusion workflow. Revision 1's AC-01–AC-11, manual and visual evidence remains current. Server coverage, mutation and Web integration evidence remain current. Core coverage/test-integrity evidence is refreshed after the consumer-boundary correction. No acceptance criteria or PRD checkboxes changed.
- **Interrupted/uncommitted paths:** Pre-existing user changes in `design/onoreo.pen`, `documentation/prds/mrp.md`, `documentation/prompts/create-spec-prompt.md`, `documentation/sdd.md`, and `documentation/templates/sdd/spec.md`; feature directory was already untracked and contains the Spec, design bundle, and interactive HTML. Preserve all of them.
- **Unfinished criteria:** No local review findings remain open. Delivery closure, PR CI and PRD requirement disposition remain part of this conclusion workflow; the seven mapped requirements are partial, so their boxes remain unchecked.
- **Blockers and stale evidence:** No open browser-suite failures remain after the refreshed 279/279 full rerun. The narrow realtime-toast test missed once in isolation, then passed three repeats and the full suite. The `test:auth:setup` helper's local telemetry assertion remains a harness issue.
- **Latest checkers:** Strategy ownership, contract exports and shared-domain path match revision 3. Core architecture/types/code, coverage (383 files/1,339 tests), test-integrity, the six-file mutation scope and Spec path checks pass. Server code/architecture/types/build and refreshed Server coverage (96 files/295 tests) pass. The Web integration suite passed 279/279. The malformed-pagination console diagnostic is expected by its passing error-boundary test. Preserve unrelated worktree edits.
- **Next useful action:** Complete delivery preflight, create the delivery commit and PR, then record PR CI and closure evidence. Preserve unrelated worktree edits.

## History

| Date/Time | Event |
| --- | --- |
| 2026-10-14 | Implementation kickoff; Spec set to `in_progress` at revision 1; pre-implementation Playwright check passed. |
| 2026-10-15 | Core/Validation/Server/Web implementation verified; full-stack Manager and Operator scenarios completed; mutation thresholds cleared; 3 corrected MRP browser regressions passed. Spec remains `in_progress`. |
| 2026-10-15 | Final Core coverage, test-integrity, Spec path, code formatting, diff, and six-file mutation checks rerun after adding primary-brand pricing and invalid-owner tests. Spec remains `in_progress`. |
| 2026-10-15 | Re-ran all Web integration tests after correcting MRP fixtures: 278/278 passed. The seven failures from the earlier run did not reproduce; the isolated narrow toast miss passed three repeats and the full suite. |
| 2026-10-15 | Independent implementation review found inaccurate generic-cause copy and missing repeated repricing proof. Added the cause marker and generic message, tested two successive stale responses, fixed the redundant preview/token race, and recaptured repeated desktop/narrow states. |
| 2026-10-15 | Follow-up review found that the one-time repriced-preview skip also needed to be consumed. Added a same-line channel-change hook test and repeated affected validation. |
| 2026-10-15 | Both independent re-reviews completed without blockers; Evaluation marked `ready` with the measured non-blocking dialog-height differences retained in F-008. |
| 2026-10-15 | Material technical amendment created as Spec revision 2; reusable module-owned Strategy contract and PDV pricing boundaries added. Previous ready status is no longer current pending review and implementation evidence. |
| 2026-10-15 | Core architecture validation rejected the Strategy contract's original `shared/interfaces` path. Revision 3 updates Core Rules, architecture, Spec and interactive HTML to place the generic contract under `shared/domain/strategies` and export it from the shared Strategy subpath; independent compatibility review passed without blockers. |
| 2026-10-15 | Independent compatibility review passed Spec revision 3 without blockers; Spec reopened and implementation resumed. |
| 2026-10-15 | Final integrated verification passed, including 279/279 Web integration tests, refreshed Server coverage, Spec path and test-integrity checks. Evaluation set to `ready`; Spec remains `in_progress` for the separate conclusion workflow. |
| 2026-10-15 | Conclusion preflight moved Strategy behavior assertions to Preview and Register Order Use Case tests to comply with Core test rules, including ordered size/accompaniment stock shortages. Focused consumer tests (8 files/52 tests), refreshed Core coverage (383 files/1,340 tests), test-integrity, Spec path and diff checks passed; F-013 resolved. |
