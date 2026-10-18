---
feature: "pdv/new-order-workflow/changes/search-only-unavailable-products"
spec: ./spec.md
spec_revision: 1
status: completed
updated_at: 2026-10-18
---

# Evaluation

Evaluation of Spec revision `1` against the current implementation.

Current result: implementation of Spec revision 1 is integrated across Core, Server and Web. Every acceptance criterion has current passing evidence, the Implementation Reviewer and Visual Reviewer findings are reconciled, and no blocking finding remains. Delivered in [PR #65](https://github.com/rafinel/scoops/pull/65); candidate PR CI passed.

## Acceptance matrix

| Criterion | Evidence | Status |
| --- | --- | --- |
| `AC-01` | `EV-01`; `EV-05`; `EV-09`; `MV-01`; `MV-02` | `passed` |
| `AC-02` | `EV-01`; `EV-05`; `EV-09`; `EV-10`; `MV-01`; `MV-02` | `passed` |
| `AC-03` | `EV-01`; `EV-05` | `passed` |
| `AC-04` | `EV-01`; `EV-05`; `EV-08`; `EV-10`; `MV-01` | `passed` |
| `AC-05` | `EV-08`; `EV-10`; `MV-02` | `passed` |
| `AC-06` | `EV-08`; `EV-10`; `MV-02` | `passed` |
| `AC-07` | `EV-08`; `EV-10`; `MV-01` | `passed` |
| `AC-08` | `EV-01`; `EV-05` | `passed` |
| `AC-09` | `EV-05` | `passed` |
| `AC-10` | `EV-05`; `EV-08`; `EV-11` | `passed` |
| `AC-11` | `EV-08`; `EV-10`; `MV-01` | `passed` |
| `AC-12` | `MV-01`; `MV-02`; `EV-12`–`EV-15`; Visual Reviewer (`FND-07`) | `passed` |
| `AC-13` | `EV-08`; `EV-10`; `MV-01`; `MV-02` | `passed` |
| `AC-14` | `EV-01`; `EV-05` | `passed` |

## Automated and runtime evidence

| ID | Layer | Command or scenario | Result | Status |
| --- | --- | --- | --- | --- |
| `EV-01` | Core | `pnpm --filter @scoops/core test` (full) | 384 files, 1645 tests passed, includes rewritten `list-order-catalog` / `list-combo-products` use-case tests (AC-01–AC-04, AC-08 matrix) | `passed` |
| `EV-02` | Core | `pnpm --filter @scoops/core test:mutation --files src/pdv/use-cases/list-order-catalog-use-case.ts src/pdv/use-cases/list-combo-products-use-case.ts` | 100% on both files (167 killed, 0 survived, 0 no-cov). A first run left 6 error-message string-literal survivors; killed by asserting exact messages. Report: `packages/core/reports/mutation/index.html` | `passed` |
| `EV-03` | Core | `check:code`, `check:architecture`, `check:types`, `test:coverage` | All passed (coverage run green) | `passed` |
| `EV-04` | Core | `pnpm --filter @scoops/core check:complexity` | First run failed (exit 2): baseline keys functions by line range, so the moved `execute` methods read as new violations. After `FND-01` correction: exit 0. | `passed` |
| `EV-05` | Server | `pnpm --filter server test:coverage` (full suite, Docker/Testcontainers) | All pass, exit 0; statements 75.15%, branches 59.96%, functions 78.58%, lines 77.87%. Includes updated `list-order-catalog`, `list-combo-products` and `create-combo` controller tests (AC-01–AC-04, AC-08–AC-10, AC-14). Additional assertion added by the orchestrator that no `availableQuantity` is exposed (explicit DTO field lists restored). | `passed` |
| `EV-06` | Server | `check:types`, `check:code`, `check:architecture`, `check:complexity`, `build` | All exit 0 (`check:code` has pre-existing `useHookAtTopLevel` warnings in files not touched) | `passed` |
| `EV-07` | REST parity | Inspection of `orders.rest` / `discounts.rest` against `list-order-catalog` / `list-combo-products` controllers | One labeled request per controller operation; default, searched and kind examples describe `availability` | `passed` |
| `EV-08` | Web | `pnpm --filter web test:coverage` (219 files, 662 tests) | All pass; coverage statements 54.99%, branches 51.78%, functions 55.6%, lines 56.89% (floor met, exit 0) | `passed` |
| `EV-09` | Web/Server | Real HTTP (`curl`, seeded Manager session) against `/orders/catalog` with five `zzteste` fixtures | Default hides `sem estoque`/`sem preço`/`ambos`, keeps `disponível` and price-`0` `grátis`; `search=zzteste` returns five with `available`, `out_of_stock`, `missing_price` (`ambos` and `sem preço`) | `passed` |
| `EV-10` | Web | `pnpm --filter web test:integration` (complete suite, once) | 292 passed (21.4 min), exit 0; includes the new New Sale and Combo route assertions at 1481×1050 and 390×844 | `passed` |
| `EV-11` | Web | `check:types`, `check:code`, `check:architecture`, `check:complexity`, `build`; `pnpm check:test-integrity` | All exit 0 / PASSED | `passed` |
| `EV-16` | Tooling | `pnpm --filter web check:playwright` | Passed (17.6 s) once port 4001 was free | `passed` |
| `EV-17` | Web | Correction rerun after review: `pnpm --filter web test -- src/ui/pdv` (56 files, 146 tests), `tests/pdv/new-sale-page.test.ts` + `tests/pdv/new-discount-page.test.tsx` (28 passed), `check:types`/`check:code`/`check:architecture` | Passed; includes the clear-then-retype regression tests in both hook test files (`FND-04`) | `passed` |
| `EV-18` | Server | Correction rerun: `list-order-catalog`, `list-combo-products`, `create-combo` controller tests (26 passed); `check:types`, `check:code`, `check:architecture` | Passed; new exact documented-field assertions on both routes (`FND-05`) | `passed` |
| `EV-19` | Tooling | `check:complexity` Core, Server, Web and `pnpm check:test-integrity` after the corrections and a second touched-file baseline refresh (provider +1 line, `use-debounced-value.ts`) | All exit 0 / PASSED | `passed` |
| `EV-20` | Core/Web | After adding `SalesCatalogProductFaker`: Core `list-order`/`list-combo-products` tests (143), `check:types`, `check:code`, `check:architecture`; Web `src/ui/pdv` tests (146), `check:types`, `check:code`, `check:architecture`; targeted mutation (100%, 0 survived); `check:complexity` Core/Server/Web exit 0; `check:test-integrity` PASSED | All passed | `passed` |
| `EV-21` | Core | After extracting `PaginationParamsStrategy` and `PaginationSliceStrategy` (used by both catalog list use cases; the params one also by `ListCombosUseCase`): full Core suite (384 files, 1645 tests), `check:types`, `check:code`, `check:architecture`, Server `check:types`, targeted mutation on the two contracted files (100%, 115 killed, 0 survived), `check:complexity` Core/Server/Web exit 0 after a third touched-file baseline refresh | All passed. `ListCombosUseCase` behavior and its error message are unchanged (outside the Spec's mutation scope, its existing NoCoverage mutants are pre-existing). | `passed` |
| `EV-22` | Core/Web | After extracting `CatalogSearchStrategy` (three list use cases) and the Web `useCatalogQuery` helper (both catalog query hooks): full Core suite (384 files, 1645 tests), targeted mutation on the two contracted files (100%, 97 killed, 0 survived), Web `src/ui/pdv` tests (146), route suites `new-sale-page` + `new-discount-page` (28 passed), `check:types`/`check:code`/`check:architecture`, `check:test-integrity`, `check:complexity` Core/Server/Web exit 0 after a fourth touched-file baseline refresh | All passed. Hook return shapes are unchanged except the combo hook now also exposes `refetchCatalog`. | `passed` |

## Manual evidence

| ID | Scenario | Criteria | Expected | Observed | Status |
| --- | --- | --- | --- | --- | --- |
| `MV-01` | New Sale default and search, desktop, narrow, keyboard | AC-01, AC-02, AC-04, AC-07, AC-11, AC-12, AC-13 | See Spec §4 | Operator (`operator.seed@scoops.com`), real server + DB, fixtures `zzteste …` created through the MRP API. Default: `10 produtos elegíveis`, only `zzteste disponível` and `zzteste grátis`; `Revendas` filter alone: `6 produtos elegíveis`, same two. `  zzteste  `: no search request at 100 ms, `GET /orders/catalog?page=1&pageSize=20&search=zzteste` after the debounce (≈430 ms to render), five cards in name order, `5 produtos encontrados · 0 adicionados`, pills `Sem preço` / `Sem estoque` / `Sem preço`, price lines `Preço não definido` / `R$ 9,00`. Disabled `Adicionar`: reached by real Tab, focused, `aria-disabled="true"`, not natively `disabled`, description `Sem preço`; Enter, Space and forced click opened no dialog. Clearing the search removed the unavailable cards immediately (`10 produtos elegíveis`). At 390×844 identical behavior, no horizontal overflow, 3/3 pills whole. No console errors. | `passed` |
| `MV-02` | Combo picker default and search, desktop, narrow, keyboard | AC-01, AC-02, AC-05, AC-06, AC-12, AC-13 | See Spec §4 | Manager, real server. Default list: only `disponível` and `grátis`. `zzteste`: `GET /discounts/catalog?page=1&pageSize=50&search=zzteste`, five rows, `ambos`/`sem estoque`/`sem preço` disabled (`aria-disabled="true"`, no `aria-pressed`) with the correct pill; click on `sem estoque`, Enter and Space on `sem preço` left the configuration pane at `Selecione um produto para configurar.` and kept focus; description `Sem preço`. Selecting `zzteste disponível` loaded its configuration pane (unchanged path). Same at 390×844, no horizontal overflow. No Combo was saved. No console errors. | `passed` |

## Visual evidence

Visual evidence uses `EV-*` identifiers with `Type = visual`.

| ID | Type | Surface and state | Viewport | Reference | Implementation | Differences | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `EV-12` | visual | New Sale, search with unavailable products | 1481×1050 | `design/VEtyb.png` | `apps/web/test-results/mv/mv01-desktop-search.png` | Only allowed deviations: existing `Adicionar` button as the control (focus ring visible on the disabled one), `Disponível`/`Adicionado` badge sizing, cart content, extra fixture cards, no `Adicionado` card in the fixture. Muted cards, pills with icons, price lines and count copy match. | `passed` |
| `EV-13` | visual | New Sale, search, narrow | 390×844 | assumption in handoff | `apps/web/test-results/mv/mv01-narrow-search.png` | One column, pill and price on one row, pills whole, no overflow | `passed` |
| `EV-14` | visual | Combo picker, search with unavailable rows | dialog at 1481×1050 | `design/cUFG9.png` | `apps/web/test-results/mv/mv02-desktop-search.png` | Allowed deviations: no row subtitles, no check icon, no "Disponível para venda" label; muted rows with pills match | `passed` |
| `EV-15` | visual | Combo picker, search, narrow | 390×844 | assumption in handoff | `apps/web/test-results/mv/mv02-narrow-search.png` | Name truncates (`zzteste sem esto…`), pill whole, no overflow | `passed` |

## Rule and documentation compliance

| Authority | Reference | Result | Notes |
| --- | --- | --- | --- |
| Spec reviewers | Implementation Reviewer, Visual Reviewer | Reconciled | See `FND-04`–`FND-07` |
| `documentation/rules/core-package-rules.md`, `use-case-testing-rules.md` | Strategy under `domain/strategies`, one exported type per file, Strategy tested through both use cases | Compliant | No faker added (`FND-03`) |
| `documentation/rules/provision-layer-rules.md`, `rest-layer-rules.md`, `controllers-testing-rules.md` | Adapter holds no business filter; one DTO per file; `.rest` parity; real-DB controller tests | Compliant | DTO field lists kept explicit (`FND-02`) |
| `documentation/rules/ui-layer-rules.md`, `widget-testing-rules.md`, `code-conventions-rules.md` | Feature hook in `ui/pdv/hooks`, nested widgets, no direct tests for hooks/services, pt-BR copy | Compliant | Extra files beyond the Spec tree: `use-effective-search.ts`, `get-effective-availability.ts`, `new-sale-catalog-card`, `new-sale-catalog-card-status`, `combo-product-row` |
| `documentation/tooling.md` complexity | Baseline policy | Compliant with a user-approved, scoped baseline refresh | `FND-01` |

## Findings

| ID | Classification | Source | Affected evidence | Status | Resolution |
| --- | --- | --- | --- | --- | --- |
| `FND-01` | Tooling | `scripts/check-complexity.mjs` matches baselined functions by file, name and line range | `EV-04` | `resolved` | 10 legacy functions (core `execute` ×2, Web dialog/catalog hooks and widgets, one server DTO `from`) only moved lines with equal or better metrics; 10 genuinely new functions (UI widgets and helpers) sit below MI 65, the warn line used by 1610 of 1642 baselined functions. User-approved option: replace the baseline entries of the 13 files touched by this change (functions and the clone pairs involving them) from a fresh run; all other entries untouched. Core, Server and Web `check:complexity` exit 0. Spec exclusion 'do not regenerate the baseline to absorb them' was interpreted as forbidding whole-file regeneration or absorbing worsened metrics: no severity rank worsened (the gate compares severity: every touched baselined function kept or lowered its rank; one MI value, `handleSelectProduct`, moved 61.3 → 59.4 within the same `warn` rank). The user approved this option explicitly on 2026-10-18 when the conflict with the Spec text was put to them; the Spec itself was not revised. |
| `FND-02` | Contract | Server builder replaced the explicit DTO field lists by object spread | `EV-05` | `resolved` | Spread would have exposed `availableQuantity` (stock levels) in the API. Explicit lists restored, only `availability` added; test added. |
| `FND-03` | Rule conformance | Hand-written catalog products in tests | `EV-01`, `EV-20` | `resolved` | Initially a local builder replaced a faker that failed the MI gate. On user request, `SalesCatalogProductFaker` (`fake`, `fakeListItem`, `fakeMany`) was added in Core `pdv/domain/structures/fakers`, exported as `@scoops/core/pdv/domain/structures/fakers`, and now backs the Core use-case tests and the Web fixtures/tests. Its functions are covered by the user-approved touched-file baseline refresh (`FND-01`). |
| `FND-04` | Implementation Reviewer #2 (correctness) | `use-effective-search.ts`: clearing the search and retyping within 250 ms briefly requested the previous search again | `EV-08`, `EV-10`, `EV-17` | `resolved` | `useDebouncedValue` gained a `shouldSkipDelay` flag so an empty input flushes the debounced value immediately; regression tests added to both hook test files; route suites rerun. |
| `FND-05` | Implementation Reviewer #4 (test strength) | The server 'adds only availability' test only checked one negative key | `EV-05`, `EV-18` | `resolved` | Replaced by exact documented-field assertions (`undocumentedProductFields` / `missingProductFields`) over all 18 items on both routes. |
| `FND-06` | Implementation Reviewer #1, #3, #5–#7 | Baseline waiver note; transient label after clear with `keepPreviousData`; pre-existing nested accompaniment/brand spread; duplicated pill announcement in Combo rows; cosmetic naming | `EV-04`, `EV-19` | `accepted_non_blocking` | #1 recorded in `FND-01` (waiver approved by the user, wording corrected). #3 follows FR-12 literally (label derives from the debounced value) and only shows on a slow default list. #5 is unchanged from HEAD and outside this change. #6 follows the Spec literally. #7: the dropped blank line in the provider was restored. |
| `FND-07` | Visual Reviewer | Verdict 'matches with allowed differences'; one low finding: focus ring of the last Combo row is partly clipped by the list's scroll container at desktop width | `EV-14` | `accepted_non_blocking` | Pre-existing container (`max-h-[360px] overflow-y-auto`), focus remains clearly visible, ring whole at 390 px; not a design-contract state. |

## Lessons learned

- The CodeMultiVitals baseline is keyed by file, function name and start line, and any function below MI 65 is a violation. Editing a file that contains baselined functions, or adding a widget, therefore needs a reviewed baseline update. Disposition: no Rule change proposed; flag to tooling owners that `tooling.md` could state the line-sensitivity.
- Non-exhaustive: builders optimizing complexity may replace explicit DTO mappings with spread, which changes the public API surface; review serializers for newly exposed fields.

## Closure preflight

| Check | Result |
| --- | --- |
| Evidence freshness | No tracked or untracked path is newer than the last evidence run (`EV-01`–`EV-22`, `MV-01`, `MV-02`); no check was invalidated. Branch `feat/enhanced-pdv-search` is level with `origin/main` (`2e2b828a`). |
| `pnpm check:spec-implementation` | Not applicable: the checker finds no contracted `Create`/`Modify`/`Generate`/`Remove` rows in the Spec (0 paths). No inventory was invented. |
| Mutation | Current: `EV-02`, `EV-21`, `EV-22` (100%, 0 survived, on both contracted use cases). |
| REST parity | `EV-07`: `orders.rest` and `discounts.rest` route-complete. |
| Local changes included | All shareable working-tree changes ship in this PR: implementation, tests, `.rest` files, `design/onoreo.pen`, the user-owned PRD amendment `documentation/prds/pdv.md` (approved before the Spec, Q13), the scoped `.code-multivitals-baseline.json` refresh (`FND-01`) and `packages/core/package.json` (fakers export, `FND-03`). Exclusions: none. |

## Delivery disposition

| Requirement | Disposition | Evidence |
| --- | --- | --- |
| `PRQ-02` | fully delivered | `FR-01`–`FR-08`, `FR-10`–`FR-12`, `FR-14`; `AC-01`–`AC-04`, `AC-07`–`AC-11`, `AC-13` |
| `PRQ-13` | partially delivered (Experience bullet "Unavailable products in Add product" only; Combo capabilities unchanged) | `FR-01`, `FR-02`, `FR-08`, `FR-09`; `AC-05`, `AC-06`, `AC-14` |
| `PRQ-11` | partially delivered (isolation and unchanged authorization of both list routes) | `FR-06`; `AC-09` |
| `PRQ-12` | partially delivered (search timing, keyboard, focus, screen readers, narrow screens) | `FR-10`, `FR-11`; `AC-07`, `AC-12`, `AC-13` |

## PR CI quality gate

| ID | Workflow | Head SHA | Result | Run |
| --- | --- | --- | --- | --- |
| `CI-01` | Core CI (includes Mutation baseline/candidate 1–4 and `Mutation score (70% per module, Billing temporarily excluded)`) | `64cec27e` | success | https://github.com/rafinel/scoops/actions/runs/39153484813 |
| `CI-02` | Server CI | `64cec27e` | success | https://github.com/rafinel/scoops/actions/runs/39153484825 |
| `CI-03` | Web CI | `64cec27e` | success | https://github.com/rafinel/scoops/actions/runs/39153484706 |
| `CI-04` | Validation CI | `64cec27e` | success | https://github.com/rafinel/scoops/actions/runs/39153484758 |

All 34 checks of PR #65 passed on the implementation candidate head `64cec27e`. Server CI, Web CI, Core CI and Validation CI were all applicable (inputs changed in each workspace). The mutation score gate passed alongside the local 100% result (`EV-02`, `EV-21`, `EV-22`).

## Authority updates

| Finding | Authority path | Disposition | Reason |
| --- | --- | --- | --- |
| `FND-01` line-sensitive complexity baseline | `documentation/tooling.md` | No change | Feature-local tooling note; flagged to tooling owners, no new policy. |
| `FND-02` spread-exposed DTO fields | `documentation/rules/rest-layer-rules.md` | No change | Already requires explicit documented DTO fields; caught by tests. |
| PRD amendment | `documentation/prds/pdv.md` | Updated | Applied before the Spec and delivered in this PR. |

## Continuation handoff

- **Branch/candidate:** `feat/enhanced-pdv-search`, PR #65, candidate head `64cec27e`.
- **Progress:** completed. Candidate published as PR #65; all applicable CI passed.
- **Interrupted/uncommitted paths:** none.
- **Unfinished criteria:** none.
- **Blockers and stale evidence:** none.
- **Latest checkers:** `EV-01`–`EV-22` and `MV-01`/`MV-02` passed.
- **Next useful action:** reviewer comments are handled by `resolve-pr-feedback`; do not merge automatically.

## History

| Date/Time | Event |
| --- | --- |
| 2026-10-18 | Implementation started; Spec set to `in_progress`. |
| 2026-10-18 | Core, Server and Web integrated; automated and manual evidence recorded. |
| 2026-10-18 | Implementation and Visual reviews reconciled; corrections rerun; Evaluation set to `ready`. |
| 2026-10-18 | Published as PR #65; PR CI passed on `64cec27e`; Evaluation and Spec set to `completed`. |
