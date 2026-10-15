---
issue: https://github.com/rafinel/scoops/issues/55
report: ./bug-report.md
status: ready
updated_at: 2026-10-14
branch: fix/acompaniment-dialog
---

# Evaluation

Evaluation of the accompaniment type selector correction for issue #55.

Current result: The Type control displays the registered name in link and edit
states, including when an edited type is absent from the loaded first page, while
the canonical type ID remains the form value. Focused tests, type checking, live
Manager interaction, keyboard selection, responsive screenshots, and diff checks
pass. The full Web code check has three formatting errors and 19 warnings in
untouched files; these are recorded below. All changes already on the branch are
included in this delivery, including the clarified MRP/PDV pricing contract and
the canonical bug-issue prompt update. Pricing runtime behavior is not implemented
by this correction; issue #56 remains open.

## Acceptance matrix

| Criterion | Evidence | Status |
| --- | --- | --- |
| `AC-01` The selected accompaniment type shows its registered name in link and edit dialogs. | `EV-001`, `MV-01`, `VIS-01`, `VIS-02` | `passed` |
| `AC-02` The type ID remains the form and request value; a linked name is used when the selected type is absent from the loaded page. | `EV-001`, `MV-01` | `passed` |
| `AC-03` The one-price-per-Accompaniment-product contract, its initial Resale-price source, and refresh of open carts before registration are consistent across MRP/PDV PRDs and issue #56 without claiming runtime delivery. | `DOC-01`, `DOC-02`, `EV-008` | `passed` |
| `AC-04` The canonical bug-issue prompt and issue #55 report/evidence reflect the delivered correction. | `DOC-03`, `DOC-04`, `EV-001` | `passed` |

## Automated and runtime evidence

| ID | Layer | Command or scenario | Result | Status |
| --- | --- | --- | --- | --- |
| `EV-001` | Web unit | `pnpm --filter web exec vitest run src/ui/mrp/widgets/slots/product-accompaniments-slot/product-accompaniment-dialog/tests/product-accompaniment-dialog.test.tsx src/ui/mrp/widgets/slots/product-accompaniments-slot/product-accompaniment-dialog/tests/use-product-accompaniment-dialog.test.ts` | 2 files and 8 tests passed, including visible-name, canonical-ID, and missing-loaded-page fallback assertions. | `passed` |
| `EV-002` | Web types | `pnpm --filter web check:types` | Type check exited successfully. | `passed` |
| `EV-003` | Changed paths | `pnpm --filter web exec biome check src/ui/mrp/widgets/slots/product-accompaniments-slot/product-accompaniment-dialog/index.tsx src/ui/mrp/widgets/slots/product-accompaniments-slot/product-accompaniment-dialog/use-product-accompaniment-dialog.ts src/ui/mrp/widgets/slots/product-accompaniments-slot/product-accompaniment-dialog/tests/product-accompaniment-dialog.test.tsx src/ui/mrp/widgets/slots/product-accompaniments-slot/product-accompaniment-dialog/tests/use-product-accompaniment-dialog.test.ts` | All four changed TypeScript files passed Biome. | `passed` |
| `EV-004` | Web code | `pnpm --filter web exec biome check src --max-diagnostics=50` | Checked 928 files; failed with three formatting errors and 19 warnings. The three formatter errors are in `src/ui/pdv/widgets/pages/new-sale-page/new-sale-cart/index.tsx`, `src/ui/pdv/widgets/pages/new-sale-page/new-sale-cart/tests/new-sale-cart.test.tsx`, and `src/ui/pdv/widgets/pages/new-sale-page/tests/use-new-sale-page.test.ts`; none is changed by this branch. | `failed` |
| `EV-005` | Auth setup helper | `pnpm --filter web test:auth:setup` | Helper failed its empty-origin local-storage assertion after app telemetry entries were present. Manager login was separately completed successfully in the real browser flow (`MV-01`); no seed/reset was run. | `failed` |
| `EV-006` | Repository diff | `git diff --check` | No whitespace errors. | `passed` |
| `EV-007` | Independent implementation review | Read-only review of the current branch against issue #55 and the Bug Report | Reviewer found no selector behavior, ID-preservation, or regression-test findings. It caught dangling `DOC-*` references in this evaluation; those were added to the documentation table before this checkpoint. | `passed` |
| `EV-008` | Issue and PRD traceability | `gh issue view 56 --json body,state,url`; local review of MRP/PDV pricing requirements | Issue #56 and the PRDs agree: initialize once from the single Resale price or the current main brand's configured Resale price, when applicable; otherwise Manager entry is required. Later Resale changes do not propagate. An open cart is refreshed to the current price before registration, and the Operator reviews/confirms updated totals; registered snapshots remain unchanged. PDV PRQ-03 and PRQ-07 are unchecked pending implementation; PRQ-09 remains unchecked. Issue #56 remains open. | `passed` |
| `EV-009` | Independent pricing-contract review | Read-only audit of MRP/PDV PRDs and issue #56, followed by the user's clarification | Reviewer confirmed the initial price rule and found two traceability gaps: missing PDV PRQ references and undefined open-cart behavior. Issue #56 now cites PDV PRQ-03/07/09; the user specified that carts refresh to the current price before registration, and the PRD/issue now require review and confirmation of updated totals. | `passed` |

## Manual evidence

| ID | Scenario | Criteria | Expected | Observed | Status |
| --- | --- | --- | --- | --- | --- |
| `MV-01` | Authenticated Manager at `/products/e431a5b6-fac7-433f-a07a-3962be1ecfa5/accompaniments` | `AC-01`, `AC-02` | Link and edit Type controls show names; keyboard selection works; IDs remain selected values; no unrelated mutation. | On the live local server, the Link dialog showed `Complementos`; ArrowDown/Enter selected a type by name and the hidden value remained its UUID. Editing `Banana fatiada` showed `Frutas` while retaining its UUID. Relevant session, notifications, stock, accompaniments, type-list, candidate-product, and selected-stock requests returned 200. Dialogs were canceled without submitting; the link count remained 8 and the edited Portion remained at 4 links. Browser console had no errors or warnings. | `passed` |

## Visual evidence

Visual evidence uses `VIS-*` identifiers with `Type = visual`.

| ID | Type | Surface and state | Viewport | Reference | Implementation | Differences | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `VIS-01` | visual | Link dialog, selected Type | 676 × 843 | `documentation/features/mrp/product-details-page-accompaniments-tab/design/iSdux.png` | `apps/web/test-results/accompaniment-type-selector-link-676x843.png` | Matches the selector treatment; runtime data shows `Complementos` instead of illustrative `Cobertura`, and the selected label contains no UUID. The saved frame shows a price input that is not part of this bug fix; the amended product-owned pricing contract is tracked separately by open issue #56. | `passed_with_authorized_difference` |
| `VIS-02` | visual | Edit dialog, preselected Type | 676 × 843 | `documentation/features/mrp/product-details-page-accompaniments-tab/design/DyrWo.png` | `apps/web/test-results/accompaniment-type-selector-edit-676x843.png` | Matches the selector treatment; runtime data shows `Frutas` instead of illustrative `Cobertura`, and the selected label contains no UUID. The edit view also displays the existing `Carregando acompanhamentos…` state. | `passed_with_authorized_difference` |
| `VIS-03` | visual | Link and edit dialogs, narrow | 320 × 900 | Supplemental narrow capture; no saved narrow reference | `apps/web/test-results/accompaniment-type-selector-link-320x900.png`; `apps/web/test-results/accompaniment-type-selector-edit-320x900.png` | Both dialogs fit the viewport without horizontal overflow and keep actions visible. At 320 px, the existing dialog title wraps its final `o` onto a third line. | `passed_with_authorized_difference` |
| `VIS-04` | visual | Link dialog, narrow | 390 × 844 | Supplemental narrow capture; no saved narrow reference | `apps/web/test-results/accompaniment-type-selector-mobile.png` | Dialog remains usable at the captured viewport; type label is readable. | `passed_with_authorized_difference` |

## Rule and documentation compliance

| Authority | Reference | Result | Notes |
| --- | --- | --- | --- |
| `DOC-01` | MRP product intent: `documentation/prds/mrp.md`, PRQ-05, PRQ-08, PRQ-09 | `passed` | The PRD states one required sale price per Accompaniment product, shared across all links and Portion sizes. Initial value is copied once from the applicable configured Resale price when available, otherwise entered by a Manager; subsequent Resale-price changes do not update it. These PRQ checkboxes remain unchecked because the feature is not implemented here. |
| `DOC-02` | PDV product intent: `documentation/prds/pdv.md`, PRQ-03, PRQ-07, PRQ-09 | `passed` | PDV uses the same product-owned price for each selected accompaniment, refreshes an unregistered cart to the current price before registration, and preserves registered snapshots. PRQ-03 and PRQ-07 are unchecked because their materially amended price behaviors remain pending; PRQ-09 is also unchecked. |
| `DOC-03` | Issue intake prompt: `documentation/prompts/create-bug-issue-prompt.md` | `passed` | The branch includes the updated canonical issue-body prompt. |
| `DOC-04` | Bug contract: `documentation/reports/mrp/55-accompaniment-type-selector-displays-id/bug-report.md` | `passed` | Correction stays within the dialog boundary and preserves canonical IDs, link behavior, and shared Select behavior. |
| `DOC-05` | Design reference: `documentation/features/mrp/product-details-page-accompaniments-tab/design/manifest.md`, `iSdux.png`, `DyrWo.png` | `passed_with_authorized_difference` | Frames support the selector comparison, but their brand/price controls are stale relative to the current product-owned price contract; no pricing UI is claimed in this PR. |

## Findings

| ID | Classification | Source | Affected evidence | Status | Resolution |
| --- | --- | --- | --- | --- | --- |
| `FND-01` | Repository baseline | Full Web Biome check | `EV-004` | `accepted_non_blocking` | Three formatting errors and 19 warnings are outside the changed paths. They are reported as a failed repository-wide check; no unrelated files were reformatted. |
| `FND-02` | Local test helper | Auth setup helper local-storage assertion | `EV-005`, `MV-01` | `accepted_non_blocking` | The helper's assertion fails in the presence of telemetry entries. The authenticated Manager flow was performed directly, and no database reset or seed was run. |
| `FND-03` | Existing narrow layout | Dialog title at 320 px and edit loading feedback | `VIS-02`, `VIS-03` | `accepted_non_blocking` | These states do not affect Type label rendering; both screenshots show the dialogs usable without horizontal overflow. |
| `FND-04` | Pending feature | Accompaniment sale-price runtime behavior | `DOC-01`, `DOC-02`, `VIS-01`, `EV-008` | `accepted_non_blocking` | The branch carries the user's approved PRD change and matching issue #56 contract. Runtime implementation remains a separate open feature and is not closed by this PR. |
| `FND-05` | Evaluation cross-reference | Independent implementation review | `EV-007` | `resolved` | Added the missing `DOC-01`–`DOC-05` evidence rows so every cited documentation identifier resolves. |
| `FND-06` | PRD and issue traceability | Independent pricing-contract review | `DOC-02`, `EV-008`, `EV-009` | `resolved` | Added PDV PRQ-03, PRQ-07 and PRQ-09 references to issue #56 and documented price revalidation for open carts. |
| `FND-07` | Open-cart price change behavior | Independent pricing-contract review and user clarification | `DOC-02`, `EV-008`, `EV-009` | `resolved` | PDV now recalculates unregistered carts to the current Accompaniment price before registration and requires review/confirmation; registered snapshots remain unchanged. |

## Lessons learned

- Keep a select's display label separate from its canonical form value, and provide a fallback label when edit data is absent from the current paginated options. The focused tests now cover both cases.

## Continuation handoff

- **Branch/candidate:** `fix/acompaniment-dialog`; includes the existing bug/PRD commits, approved pricing clarifications, focused regression tests and this evaluation.
- **Progress:** All branch changes are validated for PR review; pricing behavior remains a separate open feature.
- **Interrupted/uncommitted paths:** None; all delivery paths are committed on the current branch head.
- **Unfinished criteria:** None for issue #55.
- **Blockers and stale evidence:** `FND-01` through `FND-04` are accepted non-blocking limitations; `FND-05` through `FND-07` are resolved. Exact-head GitHub CI remains pending.
- **Latest checkers:** `EV-001`, `EV-002`, `EV-003`, `EV-006`, `EV-007`, `EV-008`, and `EV-009` passed; `EV-004` and `EV-005` failed as recorded.
- **Next useful action:** Publish the review-ready PR, then inspect exact-head checks and review status.

## History

| Date/Time | Event |
| --- | --- |
| 2026-10-14 | Added focused label/fallback regression coverage and recorded issue #55 delivery evidence for all existing branch changes. |
| 2026-10-14 | Recorded the one-time Resale-price default in MRP/PDV traceability and aligned open issue #56 after the user's clarification. |
| 2026-10-14 | Clarified that PDV refreshes an unregistered cart to the current Accompaniment price before registration, and aligned issue #56 and PRQ-07. |
| 2026-10-14 | Corrected the continuation handoff after the evidence and regression tests were committed to the delivery branch. |
