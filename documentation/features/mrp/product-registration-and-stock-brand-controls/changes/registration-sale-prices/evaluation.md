---
feature: "mrp/product-registration-and-stock-brand-controls/changes/registration-sale-prices"
spec: ./spec.md
spec_revision: 4
status: ready
updated_at: 2026-10-20
---

# Evaluation

Evaluation of Spec revision `4` (`in_progress`, Portion sizes at registration) against the current implementation. Revision 3 results are kept below as history and are reassessed per row in the revision 4 sections; evidence for behavior revision 4 does not touch (prices, Resale rule, hidden-price retention) stays reusable.

Current result (revision 4): Core, Validation, Server and Web are implemented and verified locally. Core coverage and mutation, the full Server suite (one unrelated flaky test, `FND-011`), Web coverage, the complete Web integration suite (306 of 306), builds, the complexity gate and the repository checks pass. `MV-02` and the price-row re-captures passed against the real Server, PostgreSQL and Web at 1440 × 900 and 390 × 844. The Visual Reviewer found no blocking difference and the Implementation Reviewer's findings are reconciled (`FND-010`..`FND-015`). No open blocking item remains.

## Acceptance matrix

Rows for `AC-04`..`AC-11` keep their revision 3 evidence (behavior not touched by revision 4); `EV-101` and `EV-106` re-ran the same suites on the revision 4 candidate.

| Criterion | Evidence | Status |
| --- | --- | --- |
| `AC-01` | `EV-009`, `EV-011`, `EV-109`, `EV-111`, `EV-124`..`EV-127`; `MV-01` steps 2–5, 7 | `passed` |
| `AC-02` | `EV-109`, `EV-111`; `MV-01` step 7 | `passed` |
| `AC-03` | `EV-109`, `EV-111`; `MV-01` step 6, 13 | `passed` |
| `AC-04` | `EV-002`, `EV-007`, `EV-101`, `EV-106`; `MV-01` steps 9, 10, 12 | `passed` |
| `AC-05` | `EV-002`, `EV-007`, `EV-101`, `EV-106`; `MV-01` step 9 (price `0`), step 11 | `passed` with the revision 3 caveat: PDV `Grátis` and the linked table for a registration-saved `0` were not exercised end to end; existing suites cover `Grátis` for `0` |
| `AC-06` | `EV-002`, `EV-007`, `EV-011`, `EV-101`, `EV-106` | `passed` |
| `AC-07` | `EV-007`, `EV-109`; `MV-01` step 5 | `passed` |
| `AC-08` | `EV-002`, `EV-007`, `EV-109`, `EV-111`, `EV-101`, `EV-106` | `passed` |
| `AC-09` | `EV-002`, `EV-007`, `EV-101`, `EV-106` | `passed` |
| `AC-10` | `EV-002`, `EV-007`, `EV-101`, `EV-106` | `passed` |
| `AC-11` | `EV-002`, `EV-007`, `EV-101`, `EV-106`, `EV-103` | `passed` |
| `AC-12` | `EV-109`, `EV-124`..`EV-128`; `MV-01` steps 8, 13 (tab order re-checked for revision 4 in `MV-02` step 5 and `EV-111`) | `passed` |
| `AC-13` | `EV-109`, `EV-111`, `EV-112`; `MV-02` steps 1, 4 | `passed` |
| `AC-14` | `EV-109`, `EV-111`, `EV-112`; `MV-02` steps 2, 3 | `passed` |
| `AC-15` | `EV-109`, `EV-111` | `passed` |
| `AC-16` | `EV-101`, `EV-106`; `MV-02` steps 5–7 | `passed` |
| `AC-17` | `EV-101`, `EV-106`, `EV-109`, `EV-111` | `passed` |
| `AC-18` | `EV-101`, `EV-106` | `passed` |
| `AC-19` | `EV-101`, `EV-106` (`FND-014`: a seeded global accompaniment proves no global row remains) | `passed` |
| `AC-20` | `EV-101`, `EV-103`, `EV-106` | `passed` |
| `AC-21` | `EV-109`; `EV-120`..`EV-123`; `MV-02` steps 1, 2, 5, 8 | `passed` |

## Automated and runtime evidence

Candidate (revision 3 rows): branch `feat/new-product-price-field` at `3ecf49f2` plus the uncommitted working-tree changes at that time. These `EV-001`..`EV-016` rows are revision 3 history; where a revision 4 row below re-ran the same check, the revision 4 row supersedes it.

| ID | Layer | Command or scenario | Result | Status |
| --- | --- | --- | --- | --- |
| `EV-001` | Tooling | `pnpm --filter web check:playwright` | Playwright CLI 1.62.1; health test passed. | `passed` |
| `EV-002` | Core | `pnpm --filter @scoops/core test:coverage` | 384 files, 1706 tests passed, coverage thresholds met. `register-product-use-case.test.ts` and `save-product-resale-configuration-use-case.test.ts` hold the AC-04…06, 08…11 assertions (rejection tables assert no `database.run`). | `passed` |
| `EV-003` | Core | `pnpm --filter @scoops/core check:code`, `check:architecture`, `check:types` | No errors, no dependency violations. | `passed` |
| `EV-004` | Core mutation | Node v24.20.0 (`nvm use 24`): `pnpm --filter @scoops/core test:mutation --files src/mrp/use-cases/register-product-use-case.ts src/mrp/use-cases/save-product-resale-configuration-use-case.ts --force`. Reports: `packages/core/reports/mutation/index.html`, `mutation.json`. | `register-product-use-case.ts` 79.18%, `save-product-resale-configuration-use-case.ts` 98.94%, 0 execution errors. No surviving or uncovered mutant in the new code (`SALE_PRICE_TARGET_MESSAGES`, inline Resale `add`, `accompanimentPrice` spread, `validateSalePrices`, `requireSalePriceTarget`, `requireValidSalePrice`). Remaining survivors are in pre-existing code (e.g. `validateCurrentUnitCost` message, brand validation, `publishCreation`) and in the unsupported-stock-control `else` of the Save use case. A first run scored the Save use case at 64.89%; behavior tests for its existing eligibility rules were added and it was re-run. | `passed` |
| `EV-005` | Validation | `pnpm --filter @scoops/validation check:code`, `check:architecture`, `check:types` | Passed. | `passed` |
| `EV-006` | Complexity | `pnpm --filter {@scoops/core,@scoops/validation,server,web} check:complexity` | All four exit 0. Baseline refreshed only for files touched by this change and, at the user's request, for the sidebar-navigation and `use-catalog-query.ts` files (`FND-002`, `FND-004`). | `passed` |
| `EV-007` | Server | Full: `pnpm --filter server test:coverage` (Docker Testcontainers). Focused re-run of `register-product.controller.test.ts` after the later-write rollback test was added. | Full suite: 97 files, 383 tests passed, exit 0. `register-product.controller.test.ts`: 35 tests passed. `save-single-` and `save-brand-resale-configuration.controller.test.ts` passed in the full run. | `passed` |
| `EV-008` | Server | `pnpm --filter server check:code`, `check:architecture`, `check:types`, `build` | Passed (7 pre-existing Biome warnings, none in touched files). | `passed` |
| `EV-009` | Web | `pnpm --filter web test:coverage` | 220 files, 705 tests passed, coverage thresholds met. Suites: page hook, page, form, `product-sale-price-fields` (direct-prop) and stock-card. | `passed` |
| `EV-010` | Web | `pnpm --filter web check:code`, `check:architecture`, `check:types`, `build` | Passed (19 pre-existing Biome warnings, none in touched files). | `passed` |
| `EV-011` | Web route (mocked transport) | `pnpm --filter web exec playwright test tests/mrp/new-product-page.test.tsx --workers=1` | 16 tests passed (6 new: visibility and restore, hidden prices not sent, desktop/narrow layout, invalid price without POST, typed prices posted as numbers, server 400 keeps values). Mocked transport; not real-service proof. | `passed` |
| `EV-012` | Web route (mocked transport) | `pnpm --filter web test:integration` (complete suite, once on the integrated candidate) | 298 of 299 passed. The one failure, `landing-page.test.ts:123` (carousel pointer/keyboard timing), is unrelated and was run while the full Server suite loaded the machine; it passed when re-run alone together with `new-product-page.test.tsx` (17 passed). Styling-only class changes to `SalePriceField` and the added route test came after the full run and are covered by that re-run and the page suites. | `passed` |
| `EV-013` | Repository | `pnpm check:test-integrity` | Passed; 9 changed test files. | `passed` |
| `EV-014` | Repository | `pnpm check:architecture` | Passed for all workspaces. | `passed` |
| `EV-015` | Repository | `pnpm check:spec-implementation -- documentation/features/mrp/product-registration-and-stock-brand-controls/changes/registration-sale-prices/spec.md` | Passed: 11 contracted Modify paths. Path and Git-state conformance only. | `passed` |
| `EV-016` | REST parity | `apps/server/rest-client/mrp/products.rest` gained `Register a Single-stock Resale and Accompaniment product with sale prices` with `resalePrice` and `accompanimentPrice`. Parity only; HTTP behavior is proven by `EV-007` and `MV-01`. | Present. | `passed` |

### Revision 4 evidence

Candidate: branch `feat/new-product-price-field` at `3ecf49f2` plus the uncommitted working-tree changes (revision 3 delivery plus Portion sizes). Node.js v22.17.0 except mutation (v24.20.0).

| ID | Layer | Command or scenario | Result | Status |
| --- | --- | --- | --- | --- |
| `EV-100` | Tooling | `pnpm --filter web check:playwright` (before affected browser work) | Playwright CLI 1.62.1; health test passed. | `passed` |
| `EV-101` | Core | `pnpm --filter @scoops/core test:coverage` | 384 files, 1732 tests passed; coverage 79.04% statements, 68.43% branches, 84.93% functions, 80.9% lines (thresholds met). New cases in `register-product-use-case.test.ts` (sizes: ordering, trimming, By-brand, empty list, non-Portion, each rejection with no `database.run`, bounds, duplicate names, rollback, Operator), `register-product-size-use-case.test.ts` and `update-product-size-use-case.test.ts` (10^15/10^16 limits, values just below, 3/2 decimals). | `passed` |
| `EV-102` | Core | `pnpm --filter @scoops/core check:code`, `check:architecture`, `check:types` | Passed. | `passed` |
| `EV-103` | Core mutation | Node v24.20.0 (`nvm use 24`): `pnpm --filter @scoops/core test:mutation --files src/mrp/use-cases/register-product-use-case.ts src/mrp/use-cases/save-product-resale-configuration-use-case.ts src/mrp/use-cases/register-product-size-use-case.ts src/mrp/use-cases/update-product-size-use-case.ts --force`. Reports: `packages/core/reports/mutation/index.html`, `mutation.json`. | `register-product-use-case.ts` 81.16% (267 killed, 50 survived, 12 no coverage), `register-product-size-use-case.ts` 96.23%, `save-product-resale-configuration-use-case.ts` 98.94%, `update-product-size-use-case.ts` 97.65%; 0 execution errors; all four ≥ 70%. No surviving or uncovered mutant in the new price or size branches except one equivalent one (`FND-012`); every other survivor is on pre-existing lines. | `passed` |
| `EV-104` | Validation | `pnpm --filter @scoops/validation check:code`, `check:architecture`, `check:types` | Passed. Schemas have no direct tests (Rules); their bounds and messages are exercised through the hook, form and controller suites (`EV-101`, `EV-106`, `EV-109`). | `passed` |
| `EV-105` | Complexity | `pnpm --filter {@scoops/core,@scoops/validation,server,web} check:complexity` after refreshing `.code-multivitals-baseline.json` for the touched files only | All four exit 0 (`FND-010`). | `passed` |
| `EV-106` | Server | Full `pnpm --filter server test:coverage` (Docker Testcontainers): 97 files; 408 of 409 tests passed. The one failure, `reprocess-events-job.test.ts › logs telemetry errors without failing event recovery`, is outside this change and passes alone (3 tests) (`FND-011`). `register-product.controller.test.ts` (54 tests, including 19 for sizes, re-run in full after the AC-19 correction), `register-product-size` and `update-product-size` controller tests (66 together) pass. Coverage 75.37% / 60.54% / 78.42% / 78.07% (floors met). | `passed` |
| `EV-107` | Server | `pnpm --filter server check:code`, `check:architecture`, `check:types`, `build` | Passed (7 pre-existing Biome warnings, none in touched files). | `passed` |
| `EV-108` | REST parity | `apps/server/rest-client/mrp/products.rest` gained `Register a Portion with its sizes` (`sizes` array) next to the revision 3 priced example. Parity only. | Present. | `passed` |
| `EV-109` | Web | `pnpm --filter web test:coverage` | 221 files, 731 tests passed; coverage 55.43% / 52.19% / 56.06% / 57.32% (floors met). Suites: page hook (51 tests), page, form, `product-sale-price-fields`, `product-size-fields` (direct-prop), `affixed-input`, stock card. | `passed` |
| `EV-110` | Web | `pnpm --filter web check:code`, `check:architecture`, `check:types`, `build` | Passed (19 pre-existing Biome warnings, none in touched files). | `passed` |
| `EV-111` | Web route (mocked transport) | `pnpm --filter web exec playwright test tests/mrp/new-product-page.test.tsx --workers=1` | 22 tests passed: 6 new for sizes (visibility and order between Catálogo and Estoque, restore after unselecting, row errors and no POST, typed sizes posted as numbers, hidden rows not sent, mocked 400 keeps rows, one-line desktop and stacked narrow layout). Mocked transport; not real-service proof. | `passed` |
| `EV-112` | Web route (mocked transport) | `pnpm --filter web test:integration` (complete suite, once on the integrated candidate) | 306 of 306 passed (24.6 min). | `passed` |
| `EV-113` | Repository | `pnpm check:test-integrity`, `pnpm check:architecture`, `pnpm check:spec-implementation -- documentation/features/mrp/product-registration-and-stock-brand-controls/changes/registration-sale-prices/spec.md` | All passed; 13 changed test files; 14 contracted Modify paths (path and Git-state conformance only). | `passed` |

### Closure refresh (conclude-spec, 2026-10-20)

Files edited after the revision 4 runs (`use-product-registration-page.ts` and its test, `product-size-row/index.tsx`, the complexity baseline, Spec/handoff text) invalidated the Web evidence, so it was re-run once on the integrated working tree. Core, Validation and Server sources are unchanged since `EV-101`..`EV-107`, so those rows stay valid.

| ID | Layer | Command or scenario | Result | Status |
| --- | --- | --- | --- | --- |
| `EV-130` | Web | `pnpm --filter web check:code`, `check:types`, `check:architecture` | Passed (19 pre-existing Biome warnings, none in touched files). | `passed` |
| `EV-131` | Complexity | `pnpm --filter {web,@scoops/core,@scoops/validation,server} check:complexity` | All four: 0 errors. | `passed` |
| `EV-132` | Web | `vitest run src/ui/mrp/widgets/pages/product-registration-page` | 8 files, 106 tests passed. | `passed` |
| `EV-133` | Web route (mocked transport) | `pnpm --filter web exec playwright test tests/mrp/new-product-page.test.tsx --workers=1` | 22 passed. | `passed` |
| `EV-134` | Web | `pnpm --filter web test:coverage` | 222 files, 735 tests passed; floors met. Supersedes `EV-109`. | `passed` |
| `EV-135` | Repository | `pnpm check:spec-implementation -- <spec path>` | Passed: 14 contracted Modify paths (path and Git-state conformance only). | `passed` |

## Delivery disposition

| Requirement | Disposition | Basis |
| --- | --- | --- |
| `PRQ-01` (Provides, Capabilities, Experience for prices and Portion sizes) | partially delivered | `FR-01`..`FR-15`, `AC-01`..`AC-21` all `passed`. Other PRQ-01 behavior is outside this Spec (Coverage table). Fabricável + Revenda mutual exclusion is a separate Issue. |
| `PRQ-09` (registration-time Resale/size creation, shared rules) | partially delivered | `AC-04`..`AC-11`, `AC-16`..`AC-20`. By-brand Resale and size editing remain on the Prices page. |
| `PRQ-08`, `PRQ-05`, `PRQ-10` | partially delivered | Accompaniment price origin at registration, Prices—Resale reading it, and field/row states and accessibility (`AC-05`, `AC-04`, `AC-12`, `AC-21`). |

Excluded from the delivery: nothing. All shareable local changes are included, among them `design/onoreo.pen`, `documentation/prds/mrp.md`, `documentation/prompts/create-spec-prompt.md` and the sidebar and `use-catalog-query.ts` edits (`FND-002`).

## Manual evidence

| ID | Scenario | Criteria | Expected | Observed | Status |
| --- | --- | --- | --- | --- | --- |
| `MV-01` | Manager registers priced products. Real Server (`pnpm --filter server dev`, :3336), PostgreSQL (`scoops-postgres`), Web (`pnpm --filter web dev`, :4000), seeded `manager.seed@scoops.com` signed in through the login form (the `test:auth:setup` helper fails, `FND-003`). Product `Paçoca MV 225800`; Portion `Açaí tradicional` with an active size. | `AC-01`, `AC-03`, `AC-04`, `AC-05`, `AC-07`, `AC-12` | Spec §4 `MV-01` expected proof. | Step 2: no price field for Ingredient. Step 3: `Preço de revenda`, `R$` prefix, `0,00`, hint present; Accompaniment absent. Step 4: only `Preço como acompanhamento`. Step 5: both fields; Resale `12,00`, Accompaniment empty, no suggestion text. Step 6: `-1` in Accompaniment gave the field error with `aria-invalid="true"` and `aria-describedby="accompaniment-price-hint accompaniment-price-error"`; no `POST /products`; values preserved. Step 7: unticking and re-ticking Revenda restored `12,00`; `Por marca` hid both fields and returning to `Estoque único` restored `12,00`/`-1`. Step 8: tab order Nome → Unidade → Preço de revenda → Preço como acompanhamento → categories; inner input shows no outline (wrapper-delegated focus); Accompaniment set to `0`, initial stock `10`, submitted with Enter on `Criar produto`. Step 9: `POST /products` → 201, body `{"name":"Paçoca MV 225800","unit":"un","categories":["accompaniment","resale"],"stockControl":"single","resalePrice":12,"accompanimentPrice":0,"allowNegativeStock":false,"idealStock":0,"initialStock":10}`; navigated to `/products/fc77dc84-4174-48dd-b768-9714d08a2096/stock`; DB: `products.accompaniment_price = 0.00`, one `resale_configurations` row `price 12.00`, `is_active true`, `brand_id` null. Step 10: Prices page shows Resale `12,00` with `Disponível no PDV` on. Step 11: Portion Acompanhamentos → `Vincular Acompanhamento` → new product selected → price prefilled `0,00`; cancelled. Step 12: `/sales/new` lists `Paçoca MV 225800` as `Revenda`, `R$ 12,00`, `Disponível`. Step 13: at 390 × 844 fields stacked full width (same x, Accompaniment below Resale), no horizontal overflow, field error visible for `1,234`. Console: 0 errors after sign-in (one expected 401 on `/auth/session` before login). No 4xx/5xx during the flow. | `passed` |
| `MV-02` | Manager registers a Portion with sizes. Real Server (:3336), PostgreSQL (`scoops-postgres`), Web (:4000), `manager.seed@scoops.com` signed in through the login form. Product `Açaí MV 1792501812877`. | `AC-13`, `AC-14`, `AC-16`, `AC-21` | Spec §4 `MV-02` expected proof. | Step 1: with only Porção selected the page has headings `Catálogo`, `Tamanhos e preços`, `Estoque` in that order, no price row, one empty row (`Ex: Pequeno`, `0,000` + `un`, `R$` `0,00`). Step 2: rows `Pequeno 0,300 9,90`, `Médio 0,500 14,50` and `Grande` with quantity `0` and empty price; submit showed the quantity and price messages beside row 3 with `aria-invalid` and `aria-describedby`; URL stayed `/products/new`; no `POST /products`. Step 3: `Médio` then ` médio ` gave `Já existe um tamanho com esse nome.` on row 2 only; removed the third row. Step 4: unselecting Porção hid the section; re-selecting restored `Pequeno` and `Médio`; `Por marca` kept the section. Step 5: Tab order `Nome → Quantidade → Preço → Remover` per row; one focus ring on the affixed wrapper (`EV-123`); initial stock `5`; submitted with Enter on `Criar produto`. Step 6: `POST /products` → 201, body `{"name":"Açaí MV 1792501812877","unit":"un","categories":["portion"],"stockControl":"single","sizes":[{"name":"Pequeno","quantity":0.3,"price":9.9},{"name":"Médio","quantity":0.5,"price":14.5}],"allowNegativeStock":false,"idealStock":0,"initialStock":5}`; navigated to `/products/5f60962d-…`; DB `product_sizes`: `Pequeno 0.300 9.90 t`, `Médio 0.500 14.50 t`; Preços → `Tamanhos e preços` listed both as `Ativo` (`0,3 un R$ 9,90`, `0,5 un R$ 14,50`). Step 7: `/sales/new` listed the Portion as `Escolha o tamanho e os acompanhamentos`, `A partir de R$ 9,90`, `Disponível`. Step 8: at 390 × 844 rows stack in bordered cards with the trash at top-right, no horizontal overflow (`scrollWidth` 390), errors under their fields. Console: no errors beyond the expected pre-login 401; no failed requests. | `passed` |

## Visual evidence

Visual evidence uses `EV-*` identifiers with `Type = visual`. Captures live in `apps/web/.playwright-cli/screenshots/` (ignored) with the `rsp-` prefix. `EV-018`..`EV-025` are revision 3 history: they captured the price row before the Categorias section, which revision 4 moved, so `EV-124`..`EV-128` supersede `EV-018`..`EV-022` for the layout; `EV-023`..`EV-025` (hidden-then-restored, error state, By-brand hidden) stay valid because only the row position changed.

| ID | Type | Surface and state | Viewport | Reference | Implementation | Differences | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `EV-018` | visual | `/products/new`, Ingredient, fields hidden | 1440 × 900 | `design/k4tYU.png` | `rsp-k4tYU-ingredient-1440.png` | Category cards directly below Nome/Unidade, no price row, `Custo unitário atual` visible. Shell, sidebar and font scale differ from the reference as in the parent bundle (not part of this change). | `passed` |
| `EV-019` | visual | Resale only | 1440 × 900 | `design/o5ZnH.png` | `rsp-o5ZnH-resale-1440.png` | Price row in the left column, right column empty; `R$` prefix segment and `0,00` placeholder instead of one `R$ 0,00` text (authorized); Porção disabled; no `Custo unitário`. | `passed_with_authorized_difference` |
| `EV-020` | visual | Accompaniment only | 1440 × 900 | `design/SvYqt.png` | `rsp-SvYqt-accompaniment-1440.png` | Price row, hint and layout match. Porção is disabled in the reference but the current Web picker disables only Resale/Portion pairs, so it is not compared (Spec allowance). | `passed_with_authorized_difference` |
| `EV-021` | visual | Resale + Accompaniment, Resale `12,00` | 1440 × 900 | `design/IYhx0.png` | `rsp-IYhx0-both-1440.png` | Two columns with hints, Accompaniment empty, no suggestion control. One focus ring on the affixed wrapper. `R$` prefix segment (authorized). | `passed_with_authorized_difference` |
| `EV-022` | visual | Resale + Accompaniment, stacked | 390 × 844 | `design/n1BjGx.png` | `rsp-n1BjGx-both-390.png` | Fields stacked full width with hints, categories below, no overflow. Mobile header and action bar differ from the reference (pre-existing shell). | `passed_with_authorized_difference` |
| `EV-023` | visual | Hidden-then-restored price | 1440 × 900 | Handoff supplemental state | `rsp-hidden-1440.png`, `rsp-restored-1440.png` | Resale field gone after unticking Revenda, then `12,00` back after re-ticking (fresh capture pair; also asserted in `MV-01` step 7). | `passed` |
| `EV-024` | visual | Price field error under the hint | 1440 × 900 and 390 × 844 | Handoff supplemental state | `rsp-error-state-1440.png` (after the `FND-006` fix), `rsp-error-state-390.png` | Error shown below the hint, layout stable, no horizontal shift; the invalid wrapper now shows one destructive ring (unfocused and focused). The 390 capture predates the ring-only fix; the change is styling only and identical across viewports. | `passed` |
| `EV-025` | visual | By-brand with Resale selected, fields hidden | 1440 × 900 | Parent bundle `lZGJu` | `rsp-bybrand-hidden-1440.png` | No price row; By-brand stock editor shown. | `passed` |


### Revision 4 visual evidence

Fresh captures live in `apps/web/.playwright-cli/screenshots/` (ignored). The Visual Reviewer inspected all of them against the saved references and found no blocking difference.

| ID | Type | Surface and state | Viewport | Reference | Implementation | Differences | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `EV-120` | visual | `/products/new`, Porção selected, one empty row | 1440 × 900 (full-page capture) | `design/z4KT5.png` | `rsp-z4KT5-portion-1440.png` | Sizes card between Catálogo and Estoque, same width as the other cards; title, hint, placeholders, `un` suffix, `R$` prefix and `Adicionar tamanho` match. Shell, sticky-sidebar capture artifact, 32px trash button (reference 38px), `Adicionar tamanho` 12px (reference 11/700) and the existing Portion/Revenda helper line differ (authorized or pre-existing). | `passed_with_authorized_difference` |
| `EV-121` | visual | Rows with a row error (quantity `0`, empty price) | 1440 × 900 | `design/U8PLRt.png` | `rsp-U8PLRt-errors-1440.png` | Errors beside the fields, siblings unaffected, no horizontal shift. Invalid state is the app-wide destructive ring instead of a 1px border (`FND-006`); message text is 12px and wraps one line more than the 10/600 design. | `passed_with_authorized_difference` |
| `EV-122` | visual | Narrow, one valid row and one row with both errors | 390 × 844 (full-page capture) | `design/SJ0wZ.png` | `rsp-SJ0wZ-narrow-390.png` | Bordered row cards with `Tamanho n` header and trash at top-right; Nome, Quantidade (unit) and Preço stacked full width; no overflow. Category cards stack in one column in the app (pre-existing, `FND-009`). | `passed_with_authorized_difference` |
| `EV-123` | visual | Focus on an affixed Preço and Quantidade field | 1440 × 900 | Handoff checklist item 5 | `rsp-focus-price-1440.png`, `rsp-focus-quantity-1440.png` | One continuous ring on the affixed wrapper, no inner outline. | `passed` |
| `EV-124` | visual | Ingredient, no price row (price row after Categorias) | 1440 × 900 | `design/k4tYU.png` | `rsp-k4tYU-r4-1440.png` | No price row; `Custo unitário atual` unchanged (outside this change). | `passed` |
| `EV-125` | visual | Resale only | 1440 × 900 | `design/o5ZnH.png` | `rsp-o5ZnH-r4-1440.png` | Price row after the Categorias section in the left column; `R$` prefix segment and `0,00` (authorized). | `passed_with_authorized_difference` |
| `EV-126` | visual | Accompaniment only | 1440 × 900 | `design/SvYqt.png` | `rsp-SvYqt-r4-1440.png` | Price row, hint and layout match (Porção disabled in the reference is not compared, per Spec). | `passed_with_authorized_difference` |
| `EV-127` | visual | Resale + Accompaniment, Resale `12,00` | 1440 × 900 | `design/IYhx0.png` | `rsp-IYhx0-r4-1440.png` | Two columns after Categorias, hints, Accompaniment empty, no suggestion control; DOM order Categorias → Resale → Accompaniment (tops 337 / 554 / 554). | `passed_with_authorized_difference` |
| `EV-128` | visual | Resale + Accompaniment, stacked | 390 × 844 | `design/n1BjGx.png` | `rsp-n1BjGx-r4-390.png` | Fields stacked full width after the categories; no overflow (`scrollWidth` ≤ `clientWidth`). | `passed_with_authorized_difference` |

## Rule and documentation compliance

| Authority | Reference | Result | Notes |
| --- | --- | --- | --- |
| Rules router and SDD | `documentation/rules.md`, `documentation/sdd.md` | Applied. | Rule pack: Code Conventions, Core Package, Use Case Testing, Validation Package, REST Layer, Controller Testing, UI Layer, Widget Testing. Database Layer unchanged: no migration. |
| Core Package | `core-package-rules.md` | Compliant. | Reused rule is `ResalePriceValidationStrategy` (pure, no direct test, proven through both use-case suites). Helpers are private class methods. |
| Use Case Testing | `use-case-testing-rules.md` | Compliant. | `vitest-mock-extended`, `ResaleConfigurationFaker`, fixed datetime. |
| Validation Package | `validation-package-rules.md` | Compliant. | New `resale-price-schema.ts` exported from the root; composed by the register, save-resale and form schemas. |
| REST Layer / Controller Testing | `rest-layer-rules.md`, `controllers-testing-rules.md` | Compliant. | Controller unchanged (`RequestBody` derives from the use case); `.rest` example added; DB-trigger failure helper in `mrp-controller-test-helpers.ts`. |
| UI Layer / Widget Testing | `ui-layer-rules.md`, `widget-testing-rules.md` | Compliant. | `ProductSalePriceFields` and its nested `SalePriceField` are widget directories; tests live in the owning `tests/` directories; component tests mock the owning hook. |
| Code Conventions | `code-conventions-rules.md` | Compliant. | |
| Design | `documentation/design.md`, `design/handoff.md` | Compliant. | Affixed input follows the `CurrentUnitCostField` pattern; delegated focus ring. |

## Findings

| ID | Classification | Source | Affected evidence | Status | Resolution |
| --- | --- | --- | --- | --- | --- |
| `FND-001` | Environment | Shell default Node is v22.17.0; `test:mutation` needs ≥ 22.18. | `EV-004` | `resolved` | Mutation ran under `nvm use 24` (v24.20.0). |
| `FND-002` | Pre-existing, fixed at user request | `check:complexity` for Web reported new entries for `sidebar-navigation/index.tsx` and `use-sidebar-navigation.ts` (from earlier sidebar commits) and a parse error in `use-catalog-query.ts` (a generic arrow function `<Data>(…) =>` in a `.ts` file read as JSX by the analyzer). | `EV-006` | `resolved` | `use-catalog-query.ts`: generic arrow replaced by a named generic function (behavior unchanged). Sidebar: logic split into `getStartingGroup`, `getItemClassName`, `buildNavigationItem`; group heading and item rendering moved into `sidebar-group-heading/` and `sidebar-navigation-item/` widgets (markup identical). Complexity went from 3 warnings to 2 rating-only warnings (`SidebarNavigation`, `buildNavigationItem`, MI ≈ 61.5, cutoff 65), recorded in the baseline for those files only. Verified: layout, PDV and registration Vitest suites (66 files, 236 tests), `tests/mrp/new-product-page.test.tsx` and `tests/pdv` Playwright suites (83 passed), lint, types, architecture, test-integrity. |
| `FND-003` | Pre-existing, outside scope | `pnpm --filter web test:auth:setup` fails its `expect(state.origins).toEqual([])` assertion because product telemetry now writes `localStorage` (`scoops.product-telemetry.*`). | `MV-01` | `accepted_non_blocking` | Signed in through the login form instead; tracked `playwright/.auth/*.json` untouched (`git status` clean for them). |
| `FND-004` | Complexity baseline | New small maintainability-rating warnings: Core `validateSalePrices`, `requireSalePriceTarget`; Validation `isSalePriceVisible`, `validateSalePrices`; Web `ProductSalePriceFields`. Plus line-number shifts of existing entries in touched files. | `EV-006` | `accepted_non_blocking` | `.code-multivitals-baseline.json` updated only for the 7 touched files; no new metric threshold is crossed by new code and no existing severity worsened. Structure was reworked first to remove a new clone pair and four rating warnings. `register` gained a Halstead warning but kept its warn severity. |
| `FND-005` | Mutation disposition | The `!categories.includes(Portion)` clause in `requireSalePriceTarget` is redundant with the earlier Portion checks in `validateCategories`. | `EV-004` | `accepted_non_blocking` | Kept to match the Spec (Core is defence in depth); Stryker reported no survivor for it. |
| `FND-006` | Visual (Visual Reviewer, medium) | Invalid price field kept a neutral wrapper border and the inner input's invalid ring was clipped to a sliver. | `EV-022`, `EV-024` | `resolved` | The app's unlayered `* { border-color }` rule defeats every `border-*` utility (shared `Input` included), so the wrapper now uses the same ring treatment as `Input` (`has-aria-invalid:ring-3 ring-destructive/20`) and the inner ring is suppressed. Verified at 1440 × 900 focused and unfocused. |
| `FND-007` | Evidence (Implementation Reviewer, medium) | `EV-011` did not prove AC-02 at route level. | `AC-02`, `EV-011` | `resolved` | Added a route test that types prices, unticks both categories, submits and asserts no price keys in the request body. |
| `FND-008` | Evidence (Implementation Reviewer, low) | AC-10 rollback proof only covered the product row (failure fired right after the product insert). | `AC-10`, `EV-007` | `resolved` | Added a controller test with a trigger on `stock_transactions`; asserts no product, Resale row, balance, transaction or event remains. |
| `FND-009` | Reviewer notes (low) | Visibility rule duplicated in the Web telemetry module and the form schema; `SalePriceField` has no direct test; AC-05 PDV `Grátis` not end to end; narrow capture is scrolled and shell differences (subtitle, category columns) predate this change. | `EV-009`, `EV-022` | `accepted_non_blocking` | Rule is small and each copy is covered by hook, form and route tests; `SalePriceField` is covered through its owner per Widget Testing Rules; shell differences are outside the price row. |
| `FND-010` | Complexity baseline | Line shifts and growth in touched files: `useProductRegistrationPage` (cyclomatic 21 → 22, length 221 → 278, Halstead 1040 → 1655, all already `error` severity), `ProductRegistrationPage` (length still `error`, Halstead stayed `warn` at 799.93 after grouping the size props into `sizeFields`), size use cases and `registerProductSchema` (keys moved). | `EV-105` | `accepted_non_blocking` | `ProductSizeRow` was split into `SizeField` so it adds no new error entry. Baseline refreshed for the touched files only (original ordering preserved); no existing severity worsened and no new error entry was added. |
| `FND-011` | Flaky, unrelated | Full Server run: `reprocess-events-job.test.ts › logs telemetry errors without failing event recovery` saw two `logError` calls. | `EV-106` | `accepted_non_blocking` | Passes alone (3 tests, 18 s); outside this change and the Spec's boundaries. |
| `FND-012` | Mutation disposition | Survivor `size.name.trim().toLocaleUpperCase()` (`register-product-use-case.ts` duplicate-name key); the same equivalent mutant exists in the size use cases' `normalizeName`. | `EV-103` | `accepted_non_blocking` | Equivalent: a case-insensitive comparison gives the same result with either case. The pre-existing `sizes.some → every` survivor in `register-product-size-use-case.ts` is outside the new code. |
| `FND-013` | Contract clarification (Implementation Reviewer agreed) | The Spec asked to keep the size tolerance `\|v·10^n − round(v·10^n)\| < 1e-8`, but `AC-20` requires price `1234567.89` to save and that tolerance rejects it (difference 1.49e-8). | `AC-20`, `EV-101` | `resolved` | The shared `ProductSizeValidationStrategy` and `registerProductSizeSchema` use `Number(v.toFixed(n)) === v` like the Resale and Accompaniment rules. Spec §3 and the decision table now state it, including that float artifacts are rejected on add and edit. No product intent changed. |
| `FND-014` | Evidence (Implementation Reviewer, low) | The `AC-19` rollback test never wrote a global accompaniment row, so its "no global accompaniment row" claim was vacuous. | `AC-19`, `EV-106` | `resolved` | The controller test now seeds a global accompaniment and asserts `product_accompaniments` stays empty after the second size insert fails. |
| `FND-015` | Reviewer notes (low) | `ProductSizeRow` has no own `tests/` directory (covered through `ProductSizeFields`); a stale test title in the form suite; no size-specific page-level alert test; the page-level 12px error text and 12px add button differ slightly from the 10/11px design. | `AC-13`, `AC-17`, `AC-21` | `accepted_non_blocking` | `ProductSizeRow` follows the accepted `SalePriceField` disposition (`FND-009`); `AffixedInput` got its own direct-prop test; the title was fixed; the alert is covered by the hook, route and generic page tests; type sizes follow the repository's existing `text-xs`/`text-sm` scale. |


## Lessons learned

- The complexity baseline keys functions by `file::name::startLine`, so any edit that shifts lines in a file with baselined functions looks like new violations. Regenerate only the touched files' entries (keep the original entry order, otherwise the diff is unreadable) and review the semantic diff by function name. No new Rule needed; `documentation/tooling.md` already describes regenerating the baseline.
- Running `biome format --write` on a folder reformats unrelated files in it; scope the write to the files you changed (five unrelated Playwright suites were reverted after this happened).

## PR CI quality gate

<!-- Populate during conclude-spec. -->

| ID | Workflow | Head SHA | Result | Run |
| --- | --- | --- | --- | --- |

## Continuation handoff

- **Branch/candidate:** `feat/new-product-price-field` at `3ecf49f2` plus uncommitted working-tree changes: revision 3 delivery (prices) and revision 4 (Portion sizes: Core Strategy and use cases, Validation schemas, Server tests and `.rest` example, Web sizes section, shared `AffixedInput`, price row after Categorias, complexity baseline for touched files). Unrelated user-owned changes: `design/onoreo.pen` and its exports, `documentation/prds/mrp.md`, the untracked `changes/` bundle, plus the sidebar and `use-catalog-query.ts` edits from `FND-002`.
- **Progress:** revision 4 implemented; static checks, coverage suites, mutation, builds, full Web integration, `MV-02` and visual captures recorded; Visual Reviewer reconciled (no blocking finding); Implementation Reviewer findings reconciled (`FND-010`..`FND-015`). Dev servers on :3336 and :4000 belong to the user and were left running; the Playwright CLI browser session was closed.
- **Interrupted/uncommitted paths:** none interrupted; nothing is committed.
- **Unfinished criteria:** none.
- **Blockers and stale evidence:** none. Revision 3 rows `EV-018`..`EV-022` are superseded by `EV-124`..`EV-128`.
- **Latest checkers:** all `EV-100`..`EV-128` and `MV-02` passed; `EV-106` has one unrelated flaky failure (`FND-011`).
- **Next useful action:** hand off to `conclude-spec` when publication is authorized. Consider splitting the sidebar and `use-catalog-query.ts` edits into their own commit. Fabricável + Revenda mutual exclusion is a separate Issue that is still to be created.

## History

| Date/Time | Event |
| --- | --- |
| 2026-10-19 | Kickoff: Spec `in_progress`, Evaluation created, Rules and SDD read. |
| 2026-10-19 | Core, Validation, Server and Web implemented; mutation, complexity, coverage, builds and `MV-01` recorded. |
| 2026-10-20 | `FND-002` fixed at the user's request (sidebar navigation, `use-catalog-query.ts`); Web complexity gate passes; Evaluation set to `ready`. |
| 2026-10-19 | Full Server and Web suites recorded; Implementation and Visual Reviewers reconciled (`FND-006`–`FND-009`). |
| 2026-10-20 | Spec returned to `draft` as revision 4 (Portion sizes at registration); Evaluation reopened to `in_progress`. Impact assessment: AC-01..AC-03, AC-12 and the registration page, schema and use-case evidence are reassessed; AC-04..AC-11 evidence stays reusable unless the shared size rule or complexity baseline invalidates it. |
| 2026-10-20 | Revision 4 implemented (Portion sizes, price row after Categorias, affixed inputs); size decimal rule aligned with the Resale rule (`FND-013`); mutation, coverage, full Server and Web integration suites, builds, `MV-02` and visual captures recorded; Visual and Implementation Reviewers reconciled. |
