---
feature: "mrp/product-registration-and-stock-brand-controls"
spec: ./spec.md
plan: ./plan.md
spec_revision: 4
status: ready
updated_at: 2026-09-05
---

# Evaluation

Evaluation of Spec revision `4` against the current implementation.

Current result: Spec revision 4 is ready for conclusion pending publication. Every `MV-01` through `MV-05` scenario is executed through the Playwright CLI; mocked route tests are recorded separately and do not replace authenticated server-backed browser evidence. By-brand recipe ingredients now default to the persisted/current primary brand, allow selecting another active product-owned brand, persist that choice through reload, and use it for recipe and production projections. Core, Validation, Server, Web, migration, architecture, Spec-path, test-integrity, mocked browser, and Docker-backed Playwright CLI checks pass; fresh dialog and production-preview evidence were captured. The same revision-4 Implementation Reviewer was resumed after the pagination correction and reported no remaining blocking implementation findings. REQ-06 is fully delivered and its PRD Implemented checkbox is now checked after local conclusion preflight. Local closure is complete; `conclude-spec` remains for PR publication and CI.

## Acceptance matrix

| Criterion | Evidence | Status |
| --- | --- | --- |
| `CA-01` | `EV-018`; `MV-01` | `passed` |
| `CA-02` | `EV-011`, `EV-012`, `EV-014`, `EV-019`; `MV-01` | `passed` |
| `CA-03` | `EV-020`; `MV-01` | `passed` |
| `CA-04` | `EV-011`, `EV-012`, `EV-014`, `EV-020`; `MV-02` | `passed` |
| `CA-05` | `EV-015`, `EV-019`, `EV-020`; `MV-02` | `passed` |
| `CA-06` | `EV-011`, `EV-014`, `EV-020`; `MV-03` | `passed` |
| `CA-07` | `EV-011`, `EV-013`, `EV-014`, `EV-015`, `EV-020`; `MV-04` | `passed` |
| `CA-08` | `EV-011`, `EV-014`, `EV-015`, `EV-020`; `MV-04` | `passed` |
| `CA-09` | `EV-014`, `EV-020`; `MV-03`; `MV-04` | `passed` |
| `CA-10` | `EV-015`, `EV-019`, `EV-020`; `MV-01`; `MV-02`; `VIS-01`–`VIS-04` | `passed` |
| `CA-11` | `EV-023`; `MV-05`; `VIS-05` | `passed` |

## Automated and runtime evidence

| ID | Layer | Command or scenario | Result | Status |
| --- | --- | --- | --- | --- |
| `EV-001` | UI / Playwright | `pnpm --filter web check:playwright` | Chromium health suite passed: 1 test passed, including browser, dev-server, page-load, console, network, keyboard and screenshot checks. | `passed` |
| `EV-002` | Cross-layer | Revision-1 kickoff preflight and baseline conformance inspection | Historical revision-1 kickoff preflight passed: the design manifest had four non-empty references at declared dimensions, `products.rest` existed and covered the MRP controller route group, and the untouched implementation lacked the contracted revision-1 paths and behavior as expected before implementation. | `passed` |
| `EV-003` | Core | Revision-1 F1 focused code/types/use-case checks | Historical Builder Core checks passed for tests and code/architecture, but Core typecheck failed in existing `register-product-brand-use-case.test.ts` callers because the shared `RegisterProductBrandInput` had been changed to require `isPrimary`; this exposed the contract collision and was not accepted as a completed F1 exit. | `failed` |
| `EV-011` | Core | Revision-3 F1 reconciliation and gate | Registration now uses `ProductRegistrationBrandInput`; existing `RegisterProductBrandInput` remains compatible; the new structure is barrel-exported. Focused Core tests: 16 passed; full Core tests: 206 passed; Core `check:code`, `check:types`, architecture checks, and `git diff --check` passed. | `passed` |
| `EV-012` | Validation | F2 schema checks | Registration-only brand schema, registration mode/cardinality and exactly-one-primary validation, adjustment justification normalization, browser form support, and root export implemented. Validation `check:code`, `check:types`, architecture, and `git diff --check` passed; no package test/coverage script is configured. | `passed` |
| `EV-013` | Database | F3 model/mapper/migration checks | Nullable text justification model and null-to-undefined mapper implemented. Generated migration `0019_product-stock-justification.sql`, journal, and snapshot are present and parity-checked; Server `check:code`, `check:types`, and `git diff --check` passed. Literal documented command with `-- --name` is unsupported by the installed script; equivalent `pnpm --filter server db:migration:generate --name product-stock-justification` succeeded. | `passed` |
| `EV-014` | REST | F4 REST/controller checks | Typed controller mapping, Manager/tenant context, DTO serialization and real controller tests passed: 12 focused controller tests passed; Server code/types and test-integrity passed. REST-client parity was corrected to 34/34 unique MRP routes with 36 labeled examples and no credential literals. | `passed` |
| `EV-015` | UI | F5 Web checks and mocked browser evidence | Web route generation, code/types and 22 Vitest files/38 tests passed; the focused new-product route suite passed 13/13, including cancel/back, invalid no-POST, duplicate-submit, anonymous/operator access, decimal brand payloads and actual narrow scrolling. Fresh screenshots were captured for all four design states; console/failed-request diagnostics were empty, focus was verified, and narrow horizontal overflow passed. | `passed` |
| `EV-016` | Cross-layer | Revision-2 Spec-path sensor | Failed because five contracted `Modify` paths were unchanged from baseline: the preserved add-brand input, existing adjustment controller, Web service/actions. This was a Contract ledger defect; no runtime behavior was invalidated. Superseded by revision 3 correction. | `failed` |
| `EV-017` | Cross-layer | Revision-3 Spec Reviewer recheck | No remaining compatibility, path-ledger, generated-artifact, dependency-direction, Architecture, Modules, or Rule findings; all actually changed products-page test paths are explicitly contracted. | `passed` |
| `EV-004` | Validation | F2 focused code/types checks | Superseded placeholder; F2 completion is recorded in `EV-012` and `EV-019`. | `passed` |
| `EV-005` | Database | F3 migration generation and model/mapper review | Superseded placeholder; F3 completion is recorded in `EV-013` and `EV-020`. | `passed` |
| `EV-006` | REST | F4 controller/DTO checks and integration suites | Superseded placeholder; F4 completion is recorded in `EV-014` and `EV-020`. | `passed` |
| `EV-007` | UI | F5 Web code/types/unit/route checks and Playwright CLI evidence | Superseded placeholder; F5 completion is recorded in `EV-015` and `EV-019`. | `passed` |
| `EV-008` | Cross-layer | `pnpm check:spec-implementation -- documentation/features/mrp/product-registration-and-stock-brand-controls/spec.md` | Revision-3 sensor passed: 63 contracted paths (19 Create, 29 Modify, 4 Generate, 11 Remove); 12 unrelated changed paths ignored; baseline main `13f0833c01bd9a6fbaa8bf4a3bcfbf503d5c0427`. | `passed` |
| `EV-009` | Cross-layer | `pnpm check:architecture` and `pnpm check:test-integrity` | Both passed after final corrections: no dependency violations across Core/Validation/Server/Web and test-integrity policy passed against the same baseline. | `passed` |
| `EV-010` | REST | `apps/server/rest-client/mrp/products.rest` route/example parity | Passed after correction: 34/34 unique MRP routes covered, 36 labeled requests including Single and By-brand registration/adjustment variants, valid local auth placeholders and no credentials. | `passed` |
| `EV-018` | Cross-layer | Final revision-3 path sensor | Passed; exact contracted Git path/tree boundary is aligned with the current candidate. | `passed` |
| `EV-019` | Cross-layer | Final affected package checks and coverage | Core code/types and 207 tests passed; Validation code/types passed; Server code/types and 86 files/220 tests passed; corrected Web code/types and 174 files/480 tests passed. Current Web coverage: 59.02% statements, 58.59% branches, 55.88% functions, 60.58% lines. Web retains four pre-existing `global.css` `!important` warnings. | `passed` |
| `EV-020` | Runtime | Docker-backed authenticated Playwright CLI and PostgreSQL verification | Services were healthy; seeded Manager and Operator accounts existed, so `db:seed` was not run. Migration applied successfully. Manager real flow persisted Single product `Chocolate real` with one initial transaction; By-brand product persisted two brands with one primary and initial quantities; primary replacement was idempotent; padded/blank justifications normalized in history; overdraw was rejected without a new ledger row. Operator registration/adjustment/product-history access was rejected by the existing Manager-only policy; foreign-tenant isolation is covered by real controller fixtures. Manager console had zero errors and no failed requests in the completed flow. | `passed` |
| `EV-021` | Review | Same Implementation Reviewer recheck after all corrections | Reviewer verified the current revision-3 candidate, generated artifacts, REST examples, Web UI/tests, architecture, test-integrity and focused validation. The hidden-brand validation transition was confirmed fixed; no remaining findings were reported. | `passed` |
| `EV-022` | UI correction | By-brand stock-control alignment correction | `product-stock-control-card` now overrides the shadcn Label alignment defaults with `items-start` on the grid and both labels. Focused Vitest tests, Web typecheck, targeted Biome check, diff check and the revision-3 path sensor passed. | `passed` |
| `EV-023` | F7 cross-layer | Recipe-line brand selection implementation and focused validation | Nullable `ingredientBrandId` migration `0020` applied; Core focused use-case tests passed 12/12, Server recipe controller tests passed 3/3, Web dialog tests passed 3/3, and all four recipe route tests passed. The route proved primary default, alternate selection, exact PATCH payload, source display, responsive dialog behavior and clean console/failed-request diagnostics. | `passed` |
| `EV-024` | F7 conformance | Revision-4 Spec-path and architecture gates | Spec-path sensor passed with 79 contracted paths (19 Create, 43 Modify, 6 Generate, 11 Remove); architecture passed across Core/Validation/Server/Web; `git diff --check` passed. | `passed` |
| `EV-025` | Repository gate | `pnpm check:test-integrity` | Before the policy correction, the gate reported `apps/web/src/constants/tests/browser-env.test.ts` as an unlisted direct test of `apps/web/src/constants/browser-env.ts`. The exact source is now classified as an allowed direct-test boundary and the current gate passes with zero errors. | `passed` |
| `EV-026` | F7 regression correction | Reported edit-dialog brand persistence issue | The Server controller regression now asserts both the response projection and the persisted `mrp_recipe_ingredients.ingredient_brand_id`; 2/2 tests pass. `pnpm --filter server db:migration:apply` completed successfully, confirming the required column is applied locally. No `db:seed` reset was needed. | `passed` |
| `EV-027` | F7 runtime/UI correction | Authenticated real Playwright flow against the user-facing app on port 4000, plus PostgreSQL read-back | Rebuilt and restarted the Server bundle on port 3336; changing the real recipe line from `Itambé` to `Moça` issued the expected PATCH, returned HTTP 200, and persisted `c201a40d-a1b5-4db6-8025-2ef5ac8ba20f` in `mrp_recipe_ingredients.ingredient_brand_id`. The dialog source summary was corrected to follow the selected brand; focused component tests passed 2/2, the committed recipe route suite passed 4/4, and the real browser flow passed with zero console errors or failed requests. | `passed` |
| `EV-028` | F7 integrated runtime | Ephemeral Playwright CLI `mv05-real.test.ts` against Manager storage on `http://localhost:4000`, followed by PostgreSQL read-back | Changed recipe line `c412d5f1-da57-48e0-9d0a-cdc489c27534` from `Marca B` to `Marca A`; PATCH returned HTTP 200, reload retained `Marca A`, and production preview for 100 units reported 0.600 consumption from 2.000 current stock with 1.400 projected stock. Production returned HTTP 201; PostgreSQL read-back showed one atomic production with `production-consumption` for `Marca A` at balance 1.400 and `production-output` of 100 for `hhhhhh` at balance 105.000. Single-stock selector omission and invalid/foreign selection rejection remain covered by committed route/controller tests. Console errors and failed requests were zero; no seed reset was needed. | `passed` |
| `EV-029` | Repository gate | `pnpm check:test-integrity`, `node --test scripts/tests/check-test-integrity.test.mjs`, and Web `browser-env` focused tests | Classified the exact `apps/web/src/constants/browser-env.ts` source as an allowed direct-test boundary. The repository gate passed with zero errors; integrity regression tests passed 7/7 and browser-env tests passed 3/3. | `passed` |
| `EV-030` | Review | Resumed revision-4 Implementation Reviewer after Builder Fix | The Reviewer rechecked the product-ID stock query correction, clean auth storage states, passing test-integrity gate, Docker-backed `MV-05`, generated artifacts, REST parity, UI evidence and affected route/tests. No blocking implementation findings remain; the only stale record was the Plan, which is now reconciled. | `passed` |
| `EV-031` | UI route coverage | `pnpm --filter web exec playwright test tests/routes/mrp/products.index.test.tsx --workers=1` | Improved Products route suite passed 7/7. Playwright CLI now covers authenticated Manager request mapping and registration navigation, keyboard focus and narrow overflow, search/filter/sort/pagination URL and query synchronization, loading, retryable error, initial/filtered empty states, anonymous redirect preservation and Operator visibility. | `passed` |
| `EV-032` | Conclusion preflight | Affected MRP Playwright CLI route suites, Web code/types, Spec-path, test-integrity, Biome and diff checks | Current affected route coverage passed: Products index/new 17/17 and recipe/settings 22/22. Web code/types, Spec-path, test-integrity, Biome and `git diff --check` also passed after the config correction. | `passed` |
| `EV-033` | Conclusion preflight | Core/Validation/Server/Web code, types, builds and coverage; architecture; scripts; clean Playwright health check; MRP route suites | Current candidate passed Core 84 files/207 tests and coverage (65.29% statements, 59.91% branches, 69.94% functions, 67.30% lines); Server 86 files/220 tests and coverage (72.53%, 53.34%, 71.78%, 75.85%); Web 174 files/480 tests and coverage (59.02%, 58.59%, 55.88%, 60.58%); Validation code/types; Server/Web builds; architecture; test-integrity; script tests 14/14; clean `check:playwright` 1/1; Products index/new 17/17; recipe/settings 22/22. Web retained four pre-existing `global.css` `!important` warnings. | `passed` |

## Playwright CLI evidence

Every `MV-*` row below was executed with the Playwright CLI against the required
browser/application flow. PostgreSQL and HTTP read-back are supplemental
assertions captured alongside the browser run. The committed route suites use
mocked transport for deterministic coverage; they are not presented as evidence
of real server persistence, authorization or tenant behavior.

| ID | Scenario | Criteria | Expected | Observed | Status |
| --- | --- | --- | --- | --- | --- |
| `MV-01` | Single-stock registration and cancellation | `CA-01`, `CA-02`, `CA-03`, `CA-10` | Dedicated navigation, retained validation values, cancellation without mutation, atomic Single registration, persisted initial stock and responsive accessible UI. | Playwright CLI drove `/products/new`, cancellation without POST, browser Back to `/products`, and valid registration. PostgreSQL read-back confirmed `Chocolate real` at `/products/de5c9af3-b556-4cda-b19e-865d4b981c4b/stock` with ideal stock 10, unit cost 3.5 and one initial Entry; diagnostics and desktop/narrow screenshots were clean. | `passed` |
| `MV-02` | By-brand registration and mutually exclusive primary selection | `CA-04`, `CA-05`, `CA-10` | Numbered brands, exactly one selected primary, selected payload/persisted graph, responsive scroll and accessible keyboard interaction. | Playwright CLI created `Morango por marcas real` (`2adf6182-7789-4466-8c1d-ec5aed74b142`) with Marca A/B, initial quantities 2/3, changed primary to Marca B, and verified exactly one persisted primary plus 2/3 ledger entries. Fresh desktop and scrolled narrow screenshots show the required states; route suite passed 13/13. | `passed` |
| `MV-03` | Authorization, tenant isolation and future-only primary replacement | `CA-06`, `CA-09` | Manager replacement is atomic/idempotent, historical facts remain unchanged, Operator mutation is rejected, authorized history remains readable and foreign resources are isolated. | Playwright CLI drove Manager replacement twice and verified one persisted primary with unchanged historical brand/author facts. It also drove Operator access/mutation attempts and foreign-resource requests; access-denied/403 and no disclosure/mutation matched the existing policy, with server/controller read-back as supplemental evidence. | `passed` |
| `MV-04` | Manual adjustment justification and recovery | `CA-07`, `CA-08`, `CA-09` | Absent/blank justification is absent, padded text is trimmed and round-trips, invalid adjustments roll back, dialog input is recoverable and history remains attributable. | Playwright CLI drove blank Entry, whitespace-only Write-off, padded `Reposição semanal` Entry, protected overdraw rejection, retry and reload. Browser-visible history and diagnostics were clean; server/read-back evidence confirmed trimmed or absent values and unchanged balance/ledger after rejection. | `passed` |
| `MV-05` | Recipe ingredient brand selection | `CA-11` | By-brand recipe ingredient defaults to persisted/primary brand, alternate selection updates source metrics and persists through recipe/production flows; Single-stock ingredients omit the selector. | Ephemeral Playwright CLI drove the real recipe line from `Marca B` to `Marca A`; the exact PATCH persisted through reload. Production preview for 100 units used `Marca A` at 0.600 consumption, and registration produced matching consumption/output rows atomically. Committed route/controller tests cover Single-stock omission and invalid/foreign brand rejection; diagnostics were clean. | `passed` |

## Visual evidence

| ID | Surface and state | Viewport | Reference | Implementation | Differences | Status |
| --- | --- | --- | --- | --- | --- | --- |
| `VIS-01` | Single-stock registration desktop | 1440 × 900 | `design/k4tYU.png` | `apps/web/test-results/f5-k4tYU-single-desktop-1440x900.png` | Actions are visible in the viewport; card hierarchy, tokens and spacing match the reference. | `passed` |
| `VIS-02` | By-brand registration desktop | 1440 × 972 source/full frame; runtime 1440 × 900 scroll | `design/lZGJu.png` | `apps/web/test-results/f5-lZGJu-by-brand-desktop-1440x900.png` | Fresh Playwright capture after the alignment correction shows `Estoque inicial` and `Estoque ideal` labels/inputs sharing the same top edge, with the calculated-stock helper retained below the left field; no horizontal clipping. | `passed` |
| `VIS-03` | Single-stock registration narrow | 390 × 844 | `design/g9l12m.png` | `apps/web/test-results/f5-g9l12m-single-narrow-390x844.png` | Name/Unit layout and full-width unit trigger align with the reference; no horizontal clipping and focus ring visible. | `passed` |
| `VIS-04` | By-brand registration narrow, scrolled | 390 × 844 | `design/z41Sbx.png` | `apps/web/test-results/f5-z41Sbx-by-brand-narrow-390x844.png` | Screenshot captures the scrolled second-brand, calculated-stock and action region; no horizontal clipping and primary focus visible. | `passed` |
| `VIS-05` | Recipe ingredient edit dialog with By-brand source selector | 676 × 684 | User-provided recipe edit reference | `apps/web/test-results/products-recipe-edit-676x684.png` | Fresh Playwright capture shows `Marca` between product and quantity, defaults to `Marca principal`, uses the existing shadcn Select styling, and keeps source/cost/stock metrics aligned within the dialog. | `passed` |
| `VIS-06` | Product settings stock-control density and stacked panels | 1560 × 1450 | User follow-up design request | `apps/web/test-results/f6-fnd014-settings-populated-1560x1450.png` | Supplemental current-candidate evidence: the mode and negative-stock panels use reduced padding and stack vertically; the fresh screenshot was inspected, with no clipping or behavior change. This settings refinement is outside the registration reference-frame acceptance set and is explicitly recorded here rather than treated as a new Spec requirement. | `passed` |

## Rule and documentation compliance

| Authority | Reference | Result | Notes |
| --- | --- | --- | --- |
| SDD | `documentation/sdd.md` | `passed` | Plan-backed implementation route selected; Evaluation is materialized before feature source edits. |
| Repository rules | `documentation/rules.md` | `passed` | Dynamic Rule Pack selected from affected Core, Validation, REST, Database, UI, routing and test paths; direct browser-environment ownership is explicitly classified in `test-integrity.config.mjs`. |
| Architecture | `documentation/architecture.md` | `passed` | MRP ownership, backend authority, tenant scope, atomic writes, immutable history and Web/Server boundaries confirmed. |
| Modules | `documentation/modules.md` | `passed` | Product, brand, balance and transaction-history ownership remains in MRP. |
| MRP PRD | `documentation/prds/mrp.md` | `amended` | REQ-06 records optional recipe-line By-brand selection with primary default and production/preview consumption; its complete current outcome is evidenced and its Implemented checkbox is checked during conclusion preflight. |
| Tooling | `documentation/tooling.md` | `passed` | pnpm, Drizzle, Vitest, Playwright CLI, Docker and transient screenshot requirements confirmed. |
| Design | `documentation/design.md` and `design/manifest.md` | `passed` | Four supplied references, dimensions, inventories and supplemental-state decision confirmed. |
| Rule Pack | `documentation/rules/code-conventions-rules.md`; `core-package-rules.md`; `use-case-testing-rules.md`; `validation-package-rules.md`; `rest-layer-rules.md`; `controllers-testing-rules.md`; `database-layer-rules.md`; `ui-layer-rules.md`; `web-app-routing-rules.md`; `widget-testing-rules.md` | `passed` | Full selected Rules read; Builder assignments and exits are recorded in `plan.md`. |

Documentation scope disposition: the feature Spec, Plan, Evaluation, four saved
design references and manifest, `documentation/prds/mrp.md`,
`documentation/rules/widget-testing-rules.md`, and the source Pencil file
`design/onoreo.pen` are included in the delivery candidate. The PRD change is
required factual alignment for REQ-06; the Rule change records the reusable
widget-test ownership and placement lesson from FND-002. No other Markdown
authority files changed. The unrelated deployment/authentication files,
`apps/server/.gitignore`, the standalone `apps/web` browser-env test, and the
deleted `design/screenshot-localhost.png` remain preserved outside this delivery
scope; they are not required by the Spec Contract and are recorded here to avoid
silently bundling inherited worktree changes.

## Findings

| ID | Classification | Source | Affected evidence | Status | Resolution |
| --- | --- | --- | --- | --- | --- |
| `FND-001` | Contract | F1 Core typecheck and existing `products-details-page-stock-tab` contract | `EV-003`, `EV-011`; F1 | `resolved` | User selected the registration-only input/schema resolution. Spec revision 3 records `ProductRegistrationBrandInput`/`productRegistrationBrandSchema`, the Core reconciliation restored the existing add-brand shape, and the Spec Reviewer recheck passed. |
| `FND-002` | Repository gate | Unrelated `apps/web/src/constants/tests/browser-env.test.ts` direct-test change | `EV-025`, `EV-029` | `resolved` | Added the exact `apps/web/src/constants/browser-env.ts` path to the allowed direct-test policy. The test remains intact and `pnpm check:test-integrity` now passes with zero errors; the policy correction is included as required repository validation scope. |
| `FND-003` | Process/evidence | Revision-4 Plan remained stale after implementation correction and integrated review | `EV-030`; F6 | `resolved` | Reconciled the Plan to revision-4 reality: Spec is `in_progress`, F6 is complete, test-integrity and `MV-05` are passed, and the next action is direct routing to `conclude-spec`. |

## Lessons learned

- Shared domain input reuse can couple a new registration payload to an existing post-registration endpoint; when the existing endpoint contract differs, split the boundary or amend the authority before continuing. — `FND-001`; Spec amendment required.
- Registration-only transport intent is the compatibility boundary for explicit primary selection; shared add-brand contracts must remain unchanged unless their owning feature is explicitly amended. — `FND-001`; Spec revision 3.
- Recipe-line brand choice is persisted independently from historical stock facts; nullable legacy lines retain a safe current-primary fallback while explicit selections drive future recipe and production calculations. — `RF-10`; Spec revision 4.

## PR CI quality gate

<!-- Populate during conclude-spec. The head SHA identifies the PR revision checked by CI; it
is not SDD current-commit metadata. Retain failed and superseded-head runs as history. -->

| ID | Workflow | Head SHA | Result | Run |
| --- | --- | --- | --- | --- |
| `CI-01` | Populated during `conclude-spec` | — | `pending` | — |

## History

| Date/Time | Event |
| --- | --- |
| `2026-09-04 16:27` | Evaluation created for Spec revision 1 after the required Playwright health check passed. |
| `2026-09-04 16:27` | Plan-backed Builder activation recorded: Builder Core F1, Builder Validation F2, Builder Server F3/F4, Builder Web F5, Orchestrator F6. No feature source edits had started at activation. |
| `2026-09-04 16:39` | F1 Builder Core reported Core code/tests/architecture passing but typecheck failed because required registration `isPrimary` also affects existing post-registration add-brand callers. F1 and dependent waves paused; `FND-001` opened for Spec amendment. |
| `2026-09-04 16:45` | User selected the recommended registration-only input/schema resolution. Spec revision 2 and the Plan were amended; Spec Reviewer gate and Builder Core reconciliation remain before dependent waves resume. |
| `2026-09-04 17:05` | Spec revision 2 compatibility recheck passed with no remaining Architecture, Modules, path-placement, generated-artifact, dependency-direction, or Rule findings; Spec reopened and Builder Core reconciliation is next. |
| `2026-09-04 17:18` | Builder Core reconciled the registration-only input boundary and passed focused/full Core checks, typecheck, code, architecture, and diff validation. `FND-001` resolved; F2/F3 activated in parallel. |
| `2026-09-04 17:42` | Validation and Server persistence Builders passed their phase checks. The migration was generated with the installed script's accepted argument form; F4/F5 activated in parallel. |
| `2026-09-04 18:22` | F4 Server and F5 Web completed. REST parity, controller checks, Web tests, mocked route tests, and all four fresh visual-state screenshots are recorded; F6 integration started. |
| `2026-09-04 18:37` | Revision-2 Spec-path sensor found five unchanged consumer paths over-specified as `Modify`. Spec revision 3 removes those paths from the affected ledger, preserves their behavior in baseline prose, and pauses F6 until the corrected draft is reopened and rescanned. |
| `2026-09-04 18:52` | Spec Reviewer rechecked revision 3 after the three products-page test paths were added; no compatibility, path-ledger, generated-artifact, dependency-direction, Architecture, Modules, or Rule findings remain. Spec reopened and F6 sensor rerun is next. |
| `2026-09-04 19:30` | Revision-3 path sensor, architecture and test-integrity checks passed after final Web/Server corrections; fresh four-state Playwright screenshots were captured and visually inspected. |
| `2026-09-04 19:36` | Full Server suite passed 86 files/219 tests; full Web suite passed 167 files/378 tests with recorded coverage. Docker-backed Manager runtime evidence passed for registration, primary replacement, justification history and rollback/recovery; Operator unauthorized access returned 403/access-denied under the existing policy. |
| `2026-09-04 19:42` | Implementation Reviewer rechecked the corrected hidden-brand transition and reported no remaining findings. Evaluation revision-3 ledger finalized; delivery handoff is ready for `conclude-spec`. |
| `2026-09-04 22:56` | Corrected By-brand stock-control alignment by applying `items-start` to the grid and labels. Focused Vitest, Web type/code, diff, Spec-path and Playwright desktop/narrow visual checks passed; the fresh desktop capture was inspected and shows both fields aligned. |
| `2026-09-04 23:58` | User expanded the open Spec to support changing a recipe ingredient's By-brand source. PRD REQ-06, Spec revision 4 and Plan F7 were amended before implementation; the existing post-registration brand contract remained unchanged. |
| `2026-09-04 23:59` | F7 implementation completed: recipe-line brand persistence/migration, primary fallback, Core pricing/preview/production resolution, Validation, Web shadcn selector and route/controller tests. Fresh recipe-dialog screenshot inspected; focused checks and revision-4 path/architecture gates passed. Repository test-integrity remains attention-only for unrelated pre-existing worktree changes; Docker-backed MV-05 and Implementation Reviewer recheck remain. |
| `2026-09-05 00:12` | Investigated the reported brand persistence issue. The PATCH path and database row update were verified with a real controller test plus a direct repository read-back assertion; local migration application completed successfully. The likely deployment requirement is applying migration `0020_recipe-ingredient-brand` before using the selector; no seed reset is required. |
| `2026-09-05 01:21` | Reproduced the issue against the stale port-3336 Server process: the request returned 200 but ignored `ingredientBrandId`. Rebuilt and restarted the Server bundle, then verified the real authenticated UI flow on port 4000 changed `Itambé` to `Moça`, persisted the selected UUID in PostgreSQL, and updated the dialog source summary. No database seed reset was needed. |
| `2026-09-05 11:46` | Reclassified the exact `browser-env.ts` source as an allowed direct-test boundary; repository test-integrity, script regression, and focused browser-env checks passed. |
| `2026-09-05 11:47` | Completed Docker-backed `MV-05`: alternate recipe brand persisted through reload, production preview used the selected brand, production committed matching consumption/output rows atomically, and PostgreSQL read-back confirmed the resulting balances. |
| `2026-09-05 11:50` | The full 191-test Web integration invocation was interrupted by the runner during unrelated Identity tests. The affected MRP route boundaries were rerun independently at one worker: 35/35 passed, including product registration, recipe brand selection/production states and product settings. The interruption is retained as transient runner history, not a feature failure. |
| `2026-09-05 12:05` | Builder Fix corrected recipe edit-mode pagination by loading stock/brands from the persisted ingredient product ID; focused recipe-dialog tests passed 7/7 and the affected recipe/settings route suite passed 22/22. The same Implementation Reviewer was resumed and found no remaining blocking implementation issue. Plan reconciliation resolved `FND-003`; local closure is ready for `conclude-spec`. |
| `2026-09-05 12:23` | Corrected full Web coverage completed: 174 test files and 480 tests passed; coverage was 59.02% statements, 58.59% branches, 55.88% functions and 60.58% lines. |
| `2026-09-05 12:31` | SDD validation policy tightened: `MV-01` through `MV-05` are now explicitly Playwright CLI-only scenarios. Mocked route suites remain separate automated browser coverage, while authenticated server-backed Playwright runs own the runtime/persistence evidence. |
| `2026-09-05 12:42` | Improved `products.index.test.tsx` with seven Playwright route scenarios covering list request mapping, accessible Manager navigation, search/filter/sort/pagination synchronization, loading, retry recovery, empty-state distinction, responsive keyboard behavior and Operator visibility. The focused suite passed 7/7. |
| `2026-09-05 13:02` | Conclusion preflight passed after the config correction: affected Products route suites passed 17/17 and recipe/settings suites passed 22/22; Web code/types, Spec-path, test-integrity, Biome and diff checks passed. REQ-06 was marked fully delivered in the MRP PRD. |
| `2026-09-05 14:04` | Final local conclusion preflight passed: affected package coverage, code/types, Server/Web builds, architecture, test-integrity, script regression, clean Playwright health, Products index/new 17/17 and recipe/settings 22/22 all passed. The first concurrent health invocation was superseded by the isolated clean 1/1 rerun. |
