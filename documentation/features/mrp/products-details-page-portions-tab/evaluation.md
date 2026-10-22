---
feature: "mrp/products-details-page-portions-tab"
spec: ./spec.md
spec_revision: 5
status: ready
updated_at: 2026-10-22
---

# Evaluation

Evaluation of Spec revision `5` against the integrated, uncommitted candidate on `feat/products-details-page-portions-tab` (base `main` `3e6e638e`). Revision 5 removes the global Link action, makes the Link dialog individual-only and adds the per-link and per-global price (FR-21, AC-23, AC-24). Revision-4 evidence that revision 5 invalidated was replaced below; revision-4 evidence whose files and contract did not change is reused and marked as reused.

Current result: the candidate is complete and verified locally for conclusion. Static checks, complexity, builds, targeted Core mutation, Server coverage, focused Web unit and route suites, the real-service scenarios MV-01 to MV-07, the migration backfill check and the independent Implementation and Visual reviews are recorded and reconciled; no blocking finding is open. Per the user's instruction (2026-10-22) full test suites are not repeated locally: Core, Server and Web test and coverage-floor results and the complete mocked route suite are taken from the PR CI runs (see PR CI quality gate). Items needing the user's confirmation do not block readiness: FND-01 (Spec wording), FND-20 (shared-component visual differences), FND-24 (Portion-side card subtitle copy) and the saved `design/onoreo.pen` (48 px search edit).

## Acceptance matrix

| Criterion | Evidence | Status |
| --- | --- | --- |
| `AC-01` | Web tabs/slot tests (EV-007); Portions route suite (EV-008); MV-01 | `passed` |
| `AC-02` | Core Get-global test and mutation (EV-005); get-global controller (EV-004); Web header tests (EV-007); MV-02 | `passed` |
| `AC-03` | Core List test and mutation (EV-005); list controller (two tenants, search escaping, EV-004); route suite (EV-008); Web card/table tests; pagination capture (EV-016) | `passed` |
| `AC-04` | Web table/card/slot tests; route suite; MV-01–MV-03; visual EV-011, EV-012 | `passed` |
| `AC-05` | Core Candidates test and mutation; candidates controller; Web picker/dialog tests; MV-01 | `passed` |
| `AC-06` | Core Link test and mutation; link controller (rows, per-link price, events); route suite; MV-01 | `passed` |
| `AC-07` | Core Link test; link controller rollback; Web dialog test (500 cap); route suite | `passed` |
| `AC-08` | Core Link/Update-global tests; controllers; Web dialog tests; MV-01 | `passed` |
| `AC-09` | Core Link mode b; controller (row ids preserved, row prices cleared); Web make-global tests; MV-02 | `passed` |
| `AC-10` | Core Link mode c; controller; Web 409 recovery tests (route suite); no Web entry on a global tab (MV-02) | `passed` |
| `AC-11` | Core Update-global; controller; Web dialog tests; MV-02 (price changed for every row) | `passed` |
| `AC-12` | Core Remove-global; controller; Web dialog tests; MV-02 | `passed` |
| `AC-13` | Web slot/card/dialog tests; route suite; MV-01–MV-03, MV-06; visual EV-011–EV-016 | `passed` |
| `AC-14` | Core tests; every new controller (Operator 403, foreign tenant 404); MV-03 | `passed` |
| `AC-15` | Web tests (roles, focus, overflow); MV-01/MV-02 at 1560 × 1178 and 390 × 844; Visual Reviewer (EV-011–EV-016) | `passed_with_authorized_difference` (FND-20 pending user confirmation) |
| `AC-16` | `use-category-dependency-dialog` tests; `product-settings-page.test.ts`; MV-05 (revision-4 run; the Settings slot is unchanged in revision 5) | `passed` |
| `AC-17` | PDV order-catalog, preview-order and register-order controller suites inside EV-004 (the PDV adapter is `indirect`); MV-04 (catalog shows each Portion's own price; order registration not exercised manually) | `passed` |
| `AC-18` | Core tests of the 15 refactored and 3 new write use cases; characterization controller tests; moved-assertion map; mutation EV-005, EV-006 | `passed` |
| `AC-19` | Inspection record; `check:architecture` (EV-001); PDV suites | `passed` |
| `AC-20` | Web make-global tests; route suite; Core/Server Link mode b and Q21; MV-01, MV-02 | `passed` |
| `AC-21` | Core keep-mode tests; remove-global controller (`keepPortionLinks`: ids kept, price copied to rows, no event); Web confirmation tests; MV-02 (row ids kept, each row received 6,00) | `passed` (Combo-referenced row not exercised: PDV tables are outside the MRP controller fixture) |
| `AC-22` | Web dialog tests and replaced assertions; `product-accompaniments-page.test.ts` (12/12); MV-02 and MV-07 (Portion-side global Edit: 0 switches; inline edit changes only that link); FND-23 correction (global candidate prefill) | `passed` |
| `AC-23` | Core Link/Update/Update-global/Remove-global tests and mutation; link, update, update-global and remove-global controllers; PDV catalog suites; Web price-field and dialog tests (incl. FND-23); MV-01, MV-02, MV-04, MV-07 | `passed` |
| `AC-24` | Migration `0030_parallel_zarda.sql` checked on a populated scratch database (EV-003); Testcontainers apply it to empty tables (EV-004); readers proven through PDV and Core suites | `passed` |

## Automated and runtime evidence

Revision-5 evidence on the current candidate. Full workspace suites and the complete route suite are CI-only by the user's instruction (2026-10-22); they are not repeated here.

| ID | Layer | Command or scenario | Result | Status |
| --- | --- | --- | --- | --- |
| `EV-001` | Static | `check:types`, `check:code`, `check:architecture` for `@scoops/core`, `@scoops/validation`, `server`, `web`, then `pnpm --filter web check:types/check:architecture` and Biome error-level check again after the last Web edits (2026-10-22) | All exit 0; Biome only pre-existing warnings. | `passed` |
| `EV-002` | Test ownership | `pnpm check:test-integrity` (baseline `main`, 46 changed test files), rerun after the last test edits | PASSED; moved-test counts below. | `passed` |
| `EV-003` | Database | Migration backfill check: scratch database `scratch_0030` migrated to 0029 with `psql`, seeded with an individual link of a priced product (4,50), a second link of the same product, a link of an unpriced product, a global (product price 7,25), a link referencing that global and a foreign-tenant product, then `0030_parallel_zarda.sql` applied (database dropped afterwards) | Individual links became 4,50 and 4,50; the unpriced link stayed null; the link referencing the global stayed null; the global became 7,25; `updated_at` unchanged; products untouched; all three CHECK constraints (`…accompaniment_price_non_negative` on both tables, `…global_row_has_no_price`) rejected a violating write. | `passed` |
| `EV-004` | Server | `pnpm --filter server test:coverage` (2026-10-22, 18 min, candidate unchanged on the Server since) | 103 files, 500 tests passed; statements 76.08%, branches 61.52%, functions 79.28%, lines 78.73% (floors met). Includes every new controller, the PDV catalog/preview/register suites and the rollback tests. | `passed` |
| `EV-005` | Core mutation | `pnpm --filter @scoops/core test:mutation --files <11 use cases changed in revision 5> --force` (2026-10-22, 3 min 29 s, report `packages/core/reports/mutation/mutation.json`) | Total 89.59%. New: get-global 97.87, link-accompaniment-portions 97.72, list-accompaniment-portion-candidates 97.87, list-accompaniment-portions 99.14, remove-global 100.00, update-global 99.27. Changed existing: list-product-accompaniment-candidates 93.42, remove-product-accompaniment 86.36, link-product-accompaniment 84.59, update-product-accompaniment 81.37, get-product-accompaniments 74.05 (99.01 in revision 4: revision 5 added price/global projection logic; 8 uncovered mutants are message strings and guard blocks). Every file ≥ 70%. Survivor disposition: 130 survivors and uncovered mutants, concentrated in error-message string literals, guard conditionals of pre-existing validation branches and optional chaining in the four older use cases; none individually triaged as equivalent; the revision-5 price behavior is killed by the price tests (scores of the six new use cases 97.7–100%). Accepted non-blocking (FND-27); the Core CI `Mutation` job is the authority for the per-file floor. | `passed` |
| `EV-006` | Core mutation | Reuse of revision 4: the other 12 refactored callers (EV-017 of revision 4, all ≥ 70%, lowest `change-product-unit` 71.19%) and the eight collateral files (EV-030, 71.43–99.01%) | Their sources are unchanged since 2026-10-21 08:47 and their tests passed in the EV-005 dry run (257 tests) and in the Server/PDV suites; reused. | `passed` (reused) |
| `EV-007` | Web | Focused: `vitest run src/ui/mrp/widgets/slots/product-portions-slot src/ui/mrp/widgets/slots/product-accompaniments-slot src/ui/mrp/widgets/components`; dialog tests after the FND-23 fix | 42 files, 371 tests passed (dialog hook and component tests 65/65 including the new global-candidate prefill test). Web `test:coverage` is CI-only. | `passed` |
| `EV-008` | Web integration | Focused mocked route files: `playwright test tests/mrp/product-portions-page.test.ts --workers=1`; `tests/mrp/product-accompaniments-page.test.ts --workers=1` | 45/45 and 12/12 passed (portions: pagination, search, Link, make global/individual, removals, 409 recovery, responsive, keyboard; accompaniments: Portion-side dialogs incl. the shared-price prefill assertion). Mocked transport only; the complete route suite is CI-only. | `passed` |
| `EV-009` | Static | `pnpm check:complexity` after `pnpm update:complexity-baseline` (2026-10-22) | Gate exit 0. Compared with `main`: errors 181 → 170, warnings 1482 → 1663. The four error-level functions flagged before the refresh (`buildSeedCombos`, `buildSeedOrders`, `seedDatabase`, `mapProduct`) have metrics identical to `main` (only line numbers moved). No new error-level function; the only error-level metrics above `main` are the two already absorbed in revision 4: `MrpService` cyclomatic 38 → 40 and `ProductCategoriesCard` length 123 → 124 (FND-13). | `passed` |
| `EV-010` | Build | `pnpm --filter server build`; `pnpm --filter web build` | Both exit 0. | `passed` |

### Baseline for moved Web tests (check:test-integrity does not compare moved files)

Counts use the integrity script's regex (`it`/`test`/`it.each` cases and `expect(` occurrences) on the base branch before any edit. Each moved file must keep at least these counts after the move; FR-20 replaces locked-switch assertions one for one.

| File (under `apps/web/src/ui/mrp/widgets/slots/product-accompaniments-slot/` unless noted) | Cases | `expect(` |
| --- | --- | --- |
| `product-accompaniment-dialog/tests/product-accompaniment-dialog.test.tsx` | 15 | 54 |
| `product-accompaniment-dialog/tests/use-product-accompaniment-dialog.test.ts` | 26 | 73 |
| `remove-global-accompaniment-dialog/tests/remove-global-accompaniment-dialog.test.tsx` | 9 | 24 |
| `remove-global-accompaniment-dialog/tests/use-remove-global-accompaniment-dialog.test.ts` | 10 | 26 |
| `remove-product-accompaniment-dialog/tests/remove-product-accompaniment-dialog.test.tsx` | 2 | 5 |
| `remove-product-accompaniment-dialog/tests/use-remove-product-accompaniment-dialog.test.ts` | 2 | 3 |
| `apps/web/tests/mrp/product-accompaniments-page.test.ts` (modified in place) | 12 | 138 |
| `apps/web/tests/mrp/product-settings-page.test.ts` (modified in place) | 15 | 63 |
| `…/product-settings-slot/category-dependency-dialog/tests/use-category-dependency-dialog.test.ts` (modified in place) | 4 | 5 |
| `…/product-settings-slot/category-dependency-dialog/tests/category-dependency-dialog.test.tsx` (modified in place) | 6 | 28 |

### Moved and modified Web tests: after counts (integrity script's counting rule, 2026-10-22)

| File | Base cases/`expect(` | After |
| --- | --- | --- |
| `product-accompaniment-dialog.test.tsx` | 15/54 | 21/72 |
| `use-product-accompaniment-dialog.test.ts` | 26/73 | 41/137 |
| `remove-global-accompaniment-dialog.test.tsx` | 9/24 | 13/37 |
| `use-remove-global-accompaniment-dialog.test.ts` | 10/26 | 16/44 |
| `remove-product-accompaniment-dialog.test.tsx` | 2/5 | 4/7 |
| `use-remove-product-accompaniment-dialog.test.ts` | 2/3 | 2/3 |
| `apps/web/tests/mrp/product-accompaniments-page.test.ts` | 12/138 | 12/147 |
| `apps/web/tests/mrp/product-settings-page.test.ts` | 15/63 | 17/68 |
| `use-category-dependency-dialog.test.ts` | 4/5 | 7/9 |
| `category-dependency-dialog.test.tsx` | 6/28 | 6/28 |

### FR-20 replaced locked-switch assertions (AC-22), one for one

- `product-accompaniment-dialog.test.tsx`: 'locks a global accompaniment with an announced reason and 60% opacity' now asserts the two-sentence `role="status"` notice, no `role="switch"`, no switch label/help and no `handleGlobalChange` call; 'does not describe a locked switch with the replacement notice' now asserts no switch and no replacement notice; a new case keeps the switch, help and one-sentence notice for an individual item.
- `use-product-accompaniment-dialog.test.ts`: 'locks a global candidate…', 'ignores attempts to turn off a locked global switch', 'clears the shared values and unlocks…' and 'locks Edit of a global row…' were renamed and assert `hasGlobalSwitch` false (true for the unlock case); payload assertions unchanged, so PATCH of a global row still sends `isGlobal: true` (FND-01).
- `apps/web/tests/mrp/product-accompaniments-page.test.ts`: 'links a removed global again…' and 'edits a global…' now assert the exact notice text and zero `role="switch"`; their request-body assertions are unchanged.

### AC-18 moved-assertion map (removed helper test: 7 cases / 14 expanded, 16 `expect(`)

Complete tenant-qualified snapshot, saved price published once and unpriced legacy link → `update-product-size`; inverse owners found once, de-duplicated, order [accompaniment, owner] → `update-product-size`, `change-product-unit`, `set-primary-product-brand`, `update-product-settings`; foreign child rows dropped, By-brand names and brand `updatedAt`, Single product ignoring brand `updatedAt` → `save-product-resale-configuration`; missing or foreign product skipped → `remove-product-brand`; four dangling-relationship `NotFoundError` cases → `register-product-size`; five price cases (zero, negative, Infinity, 2.755, inactive) → `remove-product-size`. Full outbox payloads are additionally proved at the controller boundary by characterization tests written against the old helper before the refactor and unchanged afterwards (update-product-size, update-product-accompaniment, link-product-accompaniment, save-single and save-brand resale, update-product-brand, remove-product, remove-product-accompaniment all-scope).

### AC-19 inspection

`git grep -n "GetAffectedProductSalesConfigurations\|publishAffectedProductSalesConfigurations" -- packages apps` returns no source references; no MRP use case imports another use case to build or publish sales configurations (remaining use-case-to-use-case dependencies are the four known out-of-scope ones of Q18). `pnpm --filter @scoops/core check:architecture` passed (EV-001); PDV `revalidate-combos-for-product-job`, order catalog and register-order controller suites passed unchanged inside EV-004.

## Manual evidence

Real stack (PostgreSQL `scoops-postgres`, `pnpm --filter server dev`, `pnpm --filter web dev`), seeded Manager `manager.seed@scoops.com` and Operator `operator.seed@scoops.com`, driven by the Playwright CLI (`playwright-cli run-code`), captures under ignored `apps/web/.playwright-cli/screenshots/` (`v5-*`). Sessions were created by signing in (the documented `test:auth:setup` fails on a pre-existing assertion, FND-15). Seeded product `Banana fatiada` with four individual links.

| ID | Scenario | Criteria | Observed | Status |
| --- | --- | --- | --- | --- |
| `MV-01` | Manager, individual Accompaniment | AC-01, AC-03–AC-08, AC-11, AC-13, AC-23 | Default tab: `PREÇO` column with each link's own price (10,00 / 5,00 / 2,00 / 2,00), the individual subtitle, 48 px search, `Tornar global` and `Vincular porções`. With every Portion linked the dialog says "Todas as porções já têm este acompanhamento." Removing one link (confirmation copy as specified) removed only that row. Link dialog: individual-only, no switch, price field prefilled with the default (2,00) with the help "Este preço vale para as porções selecionadas."; linking `Sorvete de morango` with type Frutas, quantity 0,5 and price 7,50 created a row priced 7,50 while the other rows kept their prices. Row Edit (subtitle names the Portion, help "Este preço vale só para este vínculo.", no switch) of `Açaí tropical` to 3,25 changed only that row. | `passed` |
| `MV-02` | Manager, `Tornar global`, global Edit, `Tornar individual` | AC-04, AC-09, AC-11, AC-12, AC-21–AC-23 | `Tornar global` dialog (global notice, replacement warning, empty Type/Quantity, price prefilled with the default, help "Este preço vale para todas as porções.", no switch): saving with Frutas, 0,2 kg and 4,00 left four rows at 4,00; the header showed the `Global` tag; the tab offered `Editar`, `Tornar individual`, `Remover de todas as porções` and no `Vincular porções`; rows show only `Remover desta porção`. Global Edit to 6,00 changed every row. `Tornar individual` confirmation copy as specified; confirming kept the rows as individual links priced 6,00 each with `Editar`/`Remover` and `Tornar global`/`Vincular porções` back. | `passed` |
| `MV-03` | Operator | AC-04, AC-13, AC-14 | Individual tab with columns PORÇÃO/TIPO/QTD POR PORÇÃO/PREÇO, no actions or Actions column. Direct calls with the Operator session: list 200, global 200, candidates 403, POST 403, PATCH 403, DELETE 403. | `passed` |
| `MV-04` | PDV catalog | AC-17, AC-23 | `GET /orders/catalog` showed `Banana fatiada` at 6 on every Portion after the global-to-individual conversion, then 9 for `Açaí kids` and 6 for the others after editing one link to 9,00 (each Portion's own price). Order registration and stock consumption not exercised manually (covered by the PDV controller suites in EV-004). | `passed` (partial: no order registered) |
| `MV-05` | Settings dependency navigation | AC-16 | Revision-4 run (Morango: `Ver produtos` navigated to `/products/<id>/portions?retryCategory=…`); the Settings slot and dependency dialog are unchanged by revision 5. | `passed` (reused) |
| `MV-06` | Real-stack overrides and mock-only states | AC-13 | Global without rows (route override of the real responses): `Editar` and `Remover de todas as porções` only, empty copy "Ele continua global: novas porções o receberão." without CTA; pagination with 47 rows (override, 10 rows/page range text depends on the real page size); inactive product (real status toggle, then restored): notice, `Vincular porções`, `Tornar global` and row `Editar` disabled, `Remover` enabled; no page overflow at 390 px. Load error, loading and no-Portion states use the revision-4 captures. | `passed` (visual-only for overridden states) |
| `MV-07` | Portion side (`Açaí tradicional`, Accompaniments tab) | AC-22, AC-23 | Inline Edit of the individual row `Banana fatiada` to 8,25 changed only that link (Portions tab showed 9,00, 8,25, 6,00, 6,00); the Edit dialog help reads "Este preço vale só para este vínculo."; the global row `Granola` shows `Global` and its edit has the notice and no switch. | `passed` |

Console and network: every browser error came from deliberate probes (wrong-route 404s, Operator 403 writes, the 401 on `/auth/session` before sign-in); no unexpected 4xx/5xx or console error from the application. The 409 "became global" recovery was proven by the mocked route suite only (EV-008), not on the real stack. Local data: the seed was changed during the runs (Banana fatiada now global-converted-back with edited prices); reseed with `pnpm --filter server db:seed` before the next manual run.

## Visual evidence

Fresh real-stack captures at 1560 × 1178 and 390 × 844 (`apps/web/.playwright-cli/screenshots/v5-*`; overridden states marked). The independent Visual Reviewer compared them with the saved references; unchanged revision-4 captures were reused only where the review judged them unchanged.

| ID | Type | Surface and state | Viewport | Reference | Implementation | Differences | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `EV-011` | visual | Default individual tab; Operator; search-empty | 1560 × 1178 | `Nlypf`, `zkm8K`, `pMRSi` | `v5-individual-desktop`, `v5-operator-individual-desktop`, `vr-search-empty` | `PREÇO` header, subtitle, each row's price, actions, 48 px search match; shared-component residuals accepted (FND-20); `pMRSi` PNG still shows a 39 px field although the handoff says 48 px (FND-26). | `passed_with_authorized_difference` |
| `EV-012` | visual | Global tab (no Link), global without rows (override) | 1560 × 1178 | `K94D7U`, `o0dUMY` | `v5-global-desktop`, `v5-global-no-rows-desktop` | One action row; single shared price; subtitle wraps to two lines as in the frame; no CTA on the empty state. | `passed` |
| `EV-013` | visual | Link dialog (empty/filled), row Edit, global Edit, Tornar global, Tornar individual, row Remove | 1560 × 1178 | `vrB3x`, `JyW9f`, `s30kJA`, `V4tfiT`, `z6Ur3D` | `v5-link-dialog*`, `v5-edit-row`, `v5-edit-global`, `v5-make-global`, `v5-make-individual`, `v5-remove-row` | Copy, notices, price help and no-switch rules match; price help sits about 10 px under the field (frames leave about 25 px), shared price-help spacing folded into FND-20. | `passed_with_authorized_difference` |
| `EV-014` | visual | Portion-side tab and Edit | 1560 × 1178 | `DyrWo` family | `v5-portion-side`, `v5-portion-side-edit` | Edit help per Spec; the card subtitle contradicted per-link prices and was corrected (FND-24); the global-edit frame `DyrWo` was not recaptured. | `passed` |
| `EV-015` | visual | Inactive (real toggle) | 1560 × 1178 and 390 × 844 | `Ukgbr` | `v5-inactive-desktop`, `v5-inactive-narrow` | Pill, notice and disabled controls match; new header, subtitle and 48 px search. | `passed` |
| `EV-016` | visual | Pagination (override, 47 rows) | 1560 × 1178 and 390 × 844 | `Nlypf`, `fAy9D` | `v5-pagination-desktop`, `v5-pagination-narrow` | Range and numbered buttons present; shared Pagination spacing (FND-20). | `passed_with_authorized_difference` |
| `EV-017` | visual | Narrow individual tab, narrow Edit row, narrow Tornar global, narrow global without rows | 390 × 844 | `fAy9D`, `A4lMzz` rules | `v5-narrow-individual`, `v5-narrow-edit-row`, `v5-narrow-make-global`, `v5-global-no-rows-narrow` | No page overflow (0 px); table scrolls inside the card; footers stack full width; dialog 358 px at x = 16. | `passed` |
| `EV-018` | visual | Empty, no-Portion, loading, error, picker thumb and focus, remove-all, remaining narrow states | both | `i4m0t`, `L4WsP`, `Ukgbr`, `hl9fU`, `U3fQY1` family | Revision-4 captures (`v3-*`, `v4-*`, `mv02-*`) | Reviewer judged these unchanged by revision 5 (no search field or price copy in them); captures that show the subtitle or the 50 px search were replaced by EV-011–EV-017. | `passed` (reused) |

## Rule and documentation compliance

| Authority | Reference | Result | Notes |
| --- | --- | --- | --- |
| Rule Pack | `code-conventions`, `core-package`, `use-case-testing`, `validation-package`, `rest-layer`, `controllers-testing`, `database-layer`, `ui-layer`, `web-app-routing`, `widget-testing` | Passed | Read by the orchestrator and builders; independent review found no Rule violation after the widget-testing correction (FND-19). `messaging-layer` unaffected: the event schema and consumer are unchanged. |
| Core architecture | `documentation/rules/core-package-rules.md`, `check:architecture` | Passed | Pure Strategies only (`ProductSalesConfigurationStrategy`, `AccompanimentPortionDetailsStrategy`, `GlobalAccompanimentDetailsStrategy`, `AccompanimentCostSourceStrategy`); no use case imports another for sales configurations (AC-19). The inherited `id` on the reused row projection and the four out-of-scope use-case dependencies are the documented Spec exceptions. |
| REST parity | `apps/server/rest-client/mrp/products.rest` | Passed (parity only) | 6 new routes, three Link modes and both DELETE modes; confirmed by the reviewer; not proof of HTTP behavior. |
| Spec path checker | `pnpm check:spec-implementation` | not_applicable | The Spec lists proposals, not a classified exact-path contract. |
| Test ownership | `pnpm check:test-integrity` | Passed | No counts decreased; moved-file counts recorded above (EV-002). |
| Complexity baseline | `pnpm check:complexity` | Passed with recorded absorption | See EV-009 and FND-13. |
| Documentation | PRD `PRQ-05/08/09/10`, Issue #67 | No change required | Aligned before implementation (Spec §5). FND-01 proposes a one-line FR-20 wording fix. |

## Findings

Findings FND-01–FND-21 come from revision 4 and cite revision-4 evidence ids that were replaced in this file; their resolutions stand and the reuse of the unchanged evidence is recorded in EV-006, EV-018 and MV-05.

| ID | Classification | Source | Affected evidence | Status | Resolution |
| --- | --- | --- | --- | --- | --- |
| `FND-01` | documentation discrepancy | Spec FR-20 says Portion-side PATCH of a global row "keeps omitting `isGlobal`"; current code sends `isGlobal: true` (`use-product-accompaniment-submit.ts:77`, asserted in `use-product-accompaniment-dialog.test.ts` and `tests/mrp/product-accompaniments-page.test.ts`). | AC-22 | accepted_non_blocking | Implementation keeps payloads exactly as today (AC-22 "same payloads as today" governs). Propose a one-line wording fix to the user at conclusion. |
| `FND-02` | implementation note | Spec says "native checkboxes"; repository `Checkbox` is shadcn over `@base-ui/react`, and the handoff says shadcn. | AC-05, AC-15 | resolved | Use shadcn `Checkbox`; prove Space/Enter operation, labels and announcements in tests. |
| `FND-03` | implementation risk | `ProductsRepository.findManyByIds` truncates to 500 ids; a 500-Portion link republishes 501 products. | AC-06, AC-18 | resolved | The new sources repository uses its own uncapped `inArray` queries. |
| `FND-04` | implementation risk | `product_brands` has no `establishment_id`. | AC-18 | resolved | Scope brands through tenant-filtered product ids. |
| `FND-05` | proof gap | Existing controller tests assert only ids or partial payloads for sales-configuration events; `update-product-size` and resale-save tests assert none. | AC-18 | resolved | Write characterization tests on the current helper before the refactor, then require identical payloads. |
| `FND-06` | implementation risk | 10 of the 15 callers rebuild a hand-made `scope` literal; unmocked `findById` in some tests currently yields no event. | AC-18 | resolved | Callers use the `scope` parameter directly; tests mock `findManyByProductIds`. |
| `FND-07` | implementation decision | Three copies of the row projection exist; Rules forbid a use case as helper. | AC-03, AC-11 | resolved | One pure `ProductAccompanimentDetailsStrategy` used only by the new List, Link and UpdateGlobal use cases; the existing three stay untouched. |
| `FND-08` | implementation risk | 13 field widgets import `ProductAccompanimentDialogState`; the Link dialog has a different form schema. | AC-05, AC-22 | resolved | Decouple field Props when promoting widgets to shared components; keep test parity. |
| `FND-09` | implementation risk | The header's new global read is hit by `product-prices-page.test.ts` and `product-settings-page.test.ts`; `product-stock-slot.test.tsx` builds a full `MrpService` literal. | AC-01, AC-02 | resolved | Add a `mockGlobalAccompaniment` fixture helper and use it; extend the literal with six entries. |
| `FND-10` | proof gap | `failInsertInto`/`countRows` do not cover accompaniment/global/event tables; multi-row insert trigger behavior is unverified. | AC-07 | resolved | Extend helpers; prefer `failSecondSalesConfigurationEvent` for rollback proof. |
| `FND-11` | implementation note | `useDebouncedValue(value, delayMs, shouldSkipDelay)` lives in `ui/pdv/hooks`. | AC-03 | resolved | Move to `ui/shared/hooks` with its single importer updated. |
| `FND-12` | implementation note | `search-x` is missing from `IconName`; `ice-cream-cone`, `globe` and `link` exist. | AC-13 | resolved | Add `search-x` mapped to lucide `SearchX`. |
| `FND-13` | accepted baseline note | Complexity gate counts maintainability-index-only "warn" ratings, which splitting small functions cannot always remove. | EV-010 | accepted_non_blocking | 173 MI-only entries of new or moved files are absorbed by the baseline refresh, as the repository baseline already does for existing code; every threshold metric (cyclomatic, cognitive, length, nesting, Halstead) of new code is within warn limits. |
| `FND-14` | resolved | Mutation run EV-006 found three refactored files below 70%; complexity pass found 33 new threshold violations in new code and one worsened existing function (`save-recipe-yield` 72 lines). | AC-18, EV-006, EV-010 | resolved | Behavior tests strengthened (EV-007); builders split functions; `save-recipe-yield` now uses the `scope` parameter directly. |
| `FND-15` | pre-existing | `pnpm --filter web test:auth:setup` fails at `expect(state.origins).toEqual([])` because the app writes telemetry localStorage entries. | MV runs | accepted_non_blocking | Unrelated to this Spec; sessions created by signing in through the Playwright CLI; tracked auth state untouched. Candidate for a separate fix. |
| `FND-16` | defect | Make-global dialog shows a permanent "Carregando acompanhamentos…" status (disabled candidates query treated as pending). Found in MV-01. | AC-20, AC-13 | resolved | Correction requested from the Web builder; recapture after the fix. Fixed by the Web builder (candidates query enabled only in `portion` mode); confirmed on the real stack (no 'Carregando' text in make-global or row Edit). |
| `FND-17` | visual defect | On a global accompaniment at 1560 px the page actions wrap `Vincular porções` to a second row (reference `K94D7U` keeps one row); row action buttons look larger than the handoff. Found in MV-02. | AC-04, AC-15 | resolved | Correction requested from the Web builder; recapture after the fix. Fixed (global actions share one row, y=415); row buttons aligned to the handoff. |
| `FND-18` | review finding | Independent review: eight Core use cases outside the 15 callers (add/update-recipe-ingredient, get-product-pricing/recipe/accompaniments, preview-product-category-removal, preview-production, save-recipe-yield) were changed by the mechanical `scope` edit, worsening error-level complexity metrics and falling under the CI "changed file ≥ 70% mutation" rule. Also: route suite, builds, moved-test counts and several AC records were missing from the Evaluation. | EV-006, EV-010, AC-18, AC-19, AC-22 | resolved | Records added (EV-014..EV-017 and the three subsections); the refactor builder is reverting the seven files to the `scope` parameter form and mutating all eight files. Seven files restored to the `scope` parameter form (metrics at or below `main`); eight files mutated (EV-030); records added. |
| `FND-19` | review finding | Web: slot and action-dialog tests mocked internal child widgets (widget-testing rule); `Porções (N)`/`hasRows` stale while a search is active; no cap for >500 `Selecionar todas`; scroll region not keyboard reachable for Operators; rest-spread hook consumption. | AC-04, AC-07, AC-13, AC-15 | resolved | Corrections requested from the Web builder together with FND-16 and FND-17. Slot and action-dialog tests render real children; unfiltered total refreshed during search; 500 cap with status; keyboard-reachable table region; rest-spread consumption kept (it would exceed complexity thresholds) and recorded. |
| `FND-20` | accepted deviation (needs user confirmation) | Visual Reviewer: differences owned by shared pre-existing components that the Spec maps to rather than redefines: outline Button grey fill and weight, Input/search height 50 px vs 39, row action size, `link` icon glyph, cost preview 'Não disponível' vs '—' in the shared cost estimate, extra 'Preço já configurado para este produto.' price helper, Dialog header/footer dividers and circular close control (dialog ~60–70 px taller than the frames), native scrollbar on the narrow table, Pagination buttons 36 px vs 32 px, dialog 512 px vs 520 px, 'Marca atual' label. | EV-018, EV-021, EV-022 | accepted_non_blocking | Recorded as `passed_with_authorized_difference` only after the user confirms at conclusion; no change to shared components in this Spec. |
| `FND-21` | visual defect | Visual Reviewer: page-level `Remover de todas as porções` lacks the `$danger` stroke (AC-12); picker scrollbar thumb not visible (AC-05/AC-06); empty block uses `$border` instead of `$border-soft` and is ~17 px taller (AC-13). | EV-019, EV-020, EV-021 | resolved | Corrections requested from the Web builder; recapture and re-review of changed surfaces after the fix. Destructive stroke, picker thumb (painted-scrollbar capture) and `$border-soft` tokens verified by the Visual Reviewer. |
| `FND-22` | contract change requested by the user | After implementation the user asked that `Vincular porções` not be shown when the Accompaniment is global, and that the picker's `Selecionar todas`/`Limpar seleção` link have no border. Both were implemented. Contract drift: FR-04, FR-09, FR-12 and AC-04, AC-10, MV-02 (the global page action `Vincular porções` that restores excluded Portions), the global-without-rows empty state (CTA and copy 'Vincule porções para restaurá-lo.'), frames `K94D7U`, `jW65M`, `o0dUMY`, and the corresponding PRD wording (PRQ-08, Journey G). Consequence: an excluded Portion of a global can now be restored only from the Portion side. The global mode of the Link dialog remains reachable only through the 'became global while the dialog was open' recovery (FR-06). Global-empty copy now reads 'Ele continua global: novas porções o receberão.' without a CTA. | AC-04, AC-10, AC-13, MV-02 | active | Spec amended to revision 5 (Q27B/Q33A–Q38A) with PRD and Issue #67 updated first; frames updated and `jW65M` removed; Web code and tests were already aligned; revision-5 evidence is recorded in this file (EV-007, EV-008, MV-01–MV-07, EV-011–EV-018). |
| `FND-23` | review finding | Implementation Reviewer: the Portion-side Link dialog of a global candidate prefilled the Accompaniment's default price instead of the global's shared price, so saving without noticing could overwrite the global's price for every Portion (`use-product-accompaniment-queries.ts`, `product-accompaniment-dialog-scope.ts`). | AC-22, AC-23 | resolved | `getOwnSalePrice`/`getBaselinePrice` now take the selected candidate and use its price when it is global; a new hook test (fails without the fix) proves the prefill and that an unchanged shared price is omitted; the existing global-candidate test types a different price; a route assertion checks the displayed `3,00`. |
| `FND-24` | visual review finding (needs user confirmation) | Visual Reviewer: the Portion-side Accompaniments card subtitle read "O preço de cada produto vale para todas as porções e tamanhos.", contradicting per-link prices (`product-accompaniments-card/index.tsx`); the Spec does not specify it. | FR-21 | accepted_non_blocking | Changed to "… Cada vínculo tem o seu preço. Itens globais aparecem em todas as porções."; no test asserted the old text. Confirm the wording with the user. |
| `FND-25` | evidence gap | Visual Reviewer: revision-3/4 captures of global-without-rows, inactive, pagination and narrow search-empty still showed the old subtitle, header or 50 px search. | EV-012, EV-015, EV-016 | resolved | Recaptured on the real stack (overrides for global-without-rows and pagination, real status toggle for inactive); the reviewer's own captures replace search-empty. |
| `FND-26` | reference inconsistency | `pMRSi.png` still shows a 39 px search although the handoff says it was re-exported at 48 px; the 48 px search edit in `design/onoreo.pen` is unsaved. | AC-15 | accepted_non_blocking | Implementation follows the handoff text and `Nlypf` (48 px, the project default `Input` height). The user is asked to save `design/onoreo.pen` and re-export `pMRSi`. |
| `FND-27` | accepted proof limit | Targeted mutation left 130 survivors or uncovered mutants in four pre-existing use cases (mostly message strings and guard branches); `get-product-accompaniments` fell from 99.01% to 74.05%. | EV-005 | accepted_non_blocking | Every file clears the 70% floor; revision-5 price behavior is killed by tests; the Core CI `Mutation` job decides the per-file gate. Strengthen if CI reports a regression. |
| `FND-28` | process decision | The user directed that only PR CI runs the full test suites. | EV-004, EV-007, EV-008 | accepted_non_blocking | Core and Web `test:coverage` and the complete route suite were not run locally in this closure (Server coverage, 500 tests, had finished before the instruction); their results are recorded from CI. `documentation/prompts/conclude-spec-prompt.md` was updated accordingly (Updated). |
| `FND-29` | low review notes | (a) The status "Este acompanhamento agora é global…" stays until the next action; (b) pre-existing: the Edit quantity prefill uses a dot (`0.2`) while the price uses a comma; (c) deploy ordering: between applying migration 0030 and shipping the new server, old code writes only product-level prices, so new links read `Não configurado`. | FR-06, FR-21 | accepted_non_blocking | Known limitations in the PR body; (b) is unchanged from `main`. |

## Lessons learned

- Adding a required field to a shared repository scope broke many hand-built `scope` literals; the mechanical fix worsened already-flagged complexity metrics and pulled eight unrelated use cases under the CI mutation floor. Disposition: feature-local; existing Rules already prefer passing the scope object (no Rule change). Starting such a change from the `scope` parameter form avoids the collateral.
- The complexity baseline records maintainability-index-only ratings, so a baseline refresh silently absorbs new warnings; comparing it against `main` per function (threshold metrics versus MI-only) is the useful review. Disposition: process note for Tooling; no Rule change requested.
- `pnpm --filter web test:auth:setup` fails on an existing assertion about telemetry localStorage (FND-15). Disposition: candidate for a separate fix; not part of this Spec.
- Headless Chromium paints no native scrollbars, so scrollbar requirements need either computed-style assertions or a capture launched without `--hide-scrollbars`.
- A price that moved from the product to each link must not be prefilled from the product anywhere: every dialog entry that reads the product-level price (here the Portion-side Link of a global candidate) silently reintroduced the cross-Portion overwrite. Disposition: feature-local; fixed and covered (FND-23); no Rule change.
- Saved design references drift from the Spec text (a 39 px search frame, an old Portion-side subtitle). Disposition: handoff/design note (FND-24, FND-26); no Rule change.
- Full-suite runs belong to PR CI, not to local conclusion. Disposition: Updated `documentation/prompts/conclude-spec-prompt.md`; the `implement-spec` prompt still asks for local full suites and is left for the user to align.

## PR CI quality gate

<!-- Populate during conclude-spec. The head SHA identifies the PR revision checked
by CI. Candidate branch/diff/checkpoint or commit provenance may also be recorded below
when useful; provenance is not a separate status gate. Retain failed and superseded runs as history. -->

| ID | Workflow | Head SHA | Result | Run |
| --- | --- | --- | --- | --- |

## Continuation handoff

- **Branch/candidate:** `feat/products-details-page-portions-tab` at base `main` `3e6e638e`, which is already contained (no merge needed); all work is uncommitted until `conclude-spec` publishes it; moved Web files are staged renames; `.code-multivitals-baseline.json` is refreshed (EV-009).
- **Progress:** revision-5 implementation complete and verified locally (EV-001–EV-010, MV-01–MV-07, EV-011–EV-018); Implementation and Visual reviews reconciled; FND-23 fixed. Full suites are CI-only by user instruction.
- **Delivery disposition (PRQ):** PRQ-08 fully delivered (Accompaniment-side capabilities and experience incl. per-link price); PRQ-05, PRQ-09 and PRQ-10 delivered for the Spec's stated partial scope; nothing deferred. Mapping: PRQ-05 → FR-01–FR-04, FR-13, FR-14 / AC-01–AC-04, AC-14; PRQ-08 → FR-02–FR-14, FR-17–FR-21 / AC-02–AC-13, AC-17–AC-23; PRQ-09 → FR-03, FR-05–FR-08, FR-10, FR-17, FR-21 / AC-06, AC-11, AC-17, AC-23, AC-24; PRQ-10 → FR-12, FR-15, FR-16 / AC-13, AC-15, AC-16.
- **Interrupted/uncommitted paths:** none interrupted. Inherited uncommitted user files included in this delivery by the conclude rule: `documentation/prds/mrp.md`, `documentation/prompts/create-spec-prompt.md` (and `design/onoreo.pen`, binary design file, with the 48 px edit unsaved: save it).
- **Unfinished criteria:** none.
- **Blockers and stale evidence:** none blocking. Needs the user: FND-01, FND-20, FND-24 and saving `design/onoreo.pen`. Local seed data was changed by the manual runs; reseed before the next manual run.
- **Latest checkers:** EV-001–EV-010 passed on the current candidate.
- **Next useful action:** commit with `commit-code`, publish with `create-pr`, wait for every applicable CI workflow on the exact PR head (Core CI incl. `Mutation`, Server CI, Web CI), record them under PR CI quality gate, then the closure commit.

## History

| Date/Time | Event |
| --- | --- |
| 2026-10-20 | Kickoff: Spec `open` → `in_progress`, Evaluation created, exploration findings FND-01–FND-12, EV-001 passed. |
| 2026-10-20 | Phase 1 shared contracts implemented (EV-002, EV-003 passed; EV-004 baseline noise tracked). Builders dispatched: `sales-config-republish-refactor-builder`, `accompaniment-portions-api-builder`, `portions-tab-web-builder`. |
| 2026-10-21 | API and refactor builders reported; Core suite green (EV-005); mutation EV-006 found three refactored files under 70%; test strengthening requested from the refactor builder. |
| 2026-10-21 | Final verification and reviews reconciled: Core/Server/Web suites, full route suite, mutation, builds, complexity baseline compared with `main`, real-service MV-01–MV-06, Implementation Review (findings FND-18/19 resolved), Visual Review across three rounds (FND-16/17/21 resolved, FND-20 accepted pending confirmation). Evaluation set to `ready`; Spec remains `in_progress` for conclusion. |
| 2026-10-21 | User-requested changes after readiness: removed the border of the picker `Selecionar todas` link and hid `Vincular porções` on global Accompaniments (FND-22). Evaluation reopened to `in_progress` pending Spec amendment and evidence refresh. |
| 2026-10-22 | Revision 5 verified: real-stack MV-01–MV-07, Implementation Review (FND-23 fixed) and Visual Review (FND-24/25 handled), migration backfill check, mutation, complexity, builds and focused suites; user set full suites to PR-CI-only; Evaluation set to `ready`. |
