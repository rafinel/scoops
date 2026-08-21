---
feature: "mrp/products-details-page-stock-tab"
spec: ./spec.md
plan: ./plan.md
spec_revision: 6
status: completed
updated_at: 2026-08-21
---

# Evaluation

Evaluation of Spec revision `6` against the current implementation.

Current result: Revision 6 implementation evidence and the final PR CI quality gate are complete. Core, Server, and Web pull-request workflows passed on the final documentation-inclusive head.

## Builder activation and conformance checkpoints

| Checkpoint | Builder/scope | Contract and required tree | Prohibited paths | Rules/design | Validation/evidence | Result |
| --- | --- | --- | --- | --- | --- | --- |
| `BLD-F1-T1` | `/root/builder_f1_t1`; `packages/core/src/mrp/domain/entities/**`, `packages/core/src/mrp/domain/structures/**` | Revision 6; `RF-02–RF-05`, `RF-11`; `CA-02–CA-09`, `CA-16`, `CA-18`; exact F1-T1 declarations, fakers and barrels from Spec/Plan | Spec, Plan, Evaluation, interfaces, use cases, apps, other packages, generated files and lockfiles | `code-conventions-rules.md`, `core-package-rules.md`; design bundle read-only/contextual | `pnpm exec biome check packages/core/src/mrp/domain`; 43 files checked | `passed` |
| `BLD-F1-T2` | `/root/builder_f1_t2`; `packages/core/src/mrp/interfaces/**` | Revision 6; `RF-02–RF-08`, `RF-10`, `RF-11`; `CA-02–CA-12`, `CA-16–CA-18`; exact repositories, transaction scope and `MrpService` contracts from Spec/Plan | Spec, Plan, Evaluation, domain, use cases, apps, other packages, generated files and lockfiles | `code-conventions-rules.md`, `core-package-rules.md`, `database-layer-rules.md`; design not applicable to interface source | `pnpm exec biome check packages/core/src/mrp/interfaces`; 13 files checked; diff check passed | `passed` |
| `BLD-F1-T3` | `/root/builder_f1_t3`; `packages/core/src/mrp/use-cases/**` | Revision 6; `RF-02–RF-08`, `RF-10`, `RF-11`; `CA-02–CA-12`, `CA-16–CA-18`; exact seven use cases, amended callers, barrels and tests from Spec/Plan | Spec, Plan, Evaluation, domain, interfaces, apps, validation, generated files and lockfiles | `code-conventions-rules.md`, `core-package-rules.md`, `use-case-testing-rules.md`; design not applicable | Core code/types/tests all passed; `EV-CORE` | `passed` |
| `BLD-F2-T1` | `/root/builder_f2_t1`; four declared `packages/validation/src/mrp/*schema.ts` files | Revision 6; `RF-03`, `RF-05`, `RF-11`; `CA-04–CA-06`, `CA-09`, `CA-15`, `CA-16`; exact Add/Edit/adjust/history schemas | Spec, Plan, Evaluation, root barrel, web schemas, other paths and lockfiles | `code-conventions-rules.md`, `validation-package-rules.md` | Focused MRP Biome and direct boundary assertions passed | `passed` |
| `BLD-F2-T2` | `/root/builder_f2_t2`; two declared web form schemas and `packages/validation/src/index.ts` | Revision 6; `RF-03`, `RF-05`, `RF-09`; `CA-04–CA-06`, `CA-09`, `CA-13–CA-15`; RHF schemas and complete root exports | Spec, Plan, Evaluation, MRP schema files, other paths and lockfiles | `code-conventions-rules.md`, `validation-package-rules.md` | Validation code/types passed; 48 files | `passed` |
| `BLD-F3-T1` | `/root/builder_f3_t1`; declared models/types/mappers and exact 0007 generated artifacts | Revision 6; `RF-04–RF-07`, `RF-10`, `RF-11`; `CA-07–CA-10`, `CA-16–CA-18`; brand constraints and immutable ledger schema | Spec, Plan, Evaluation, repositories/composition, other paths and lockfiles; generated artifacts never hand-edited | `code-conventions-rules.md`, `database-layer-rules.md` | Migration generated once with corrected pnpm forwarding syntax; focused Biome/diff and artifact review passed | `passed` |
| `BLD-F3-T2` | `/root/builder_f3_t2`; `apps/server/src/mrp/database/drizzle/repositories/**` | Revision 6; `RF-02–RF-08`, `RF-10`, `RF-11`; `CA-02–CA-08`, `CA-10`, `CA-12`, `CA-16–CA-18`; exact tenant-safe repositories and retrying serializable scope | SDD, models/types/mappers/migrations, composition/seeder/controllers, other paths and lockfiles | `code-conventions-rules.md`, `database-layer-rules.md` | 6 repository files passed Biome/diff and query/transaction inspection; persistence proof deferred F4-T2 | `passed` |
| `BLD-F3-T3` | `/root/builder_f3_t3`; MRP repository tokens, database module and seeder | Revision 6; `RF-02`, `RF-04`, `RF-08`, `RF-10`, `RF-11`; `CA-02`, `CA-07`, `CA-12`, `CA-16–CA-18`; exact token/export/seeding composition | SDD, drizzle/migrations, REST/server feature module, other paths and lockfiles | `code-conventions-rules.md`, `database-layer-rules.md` | Focused Biome/diff and token/useExisting/export/no-raw-SQL inspection passed | `passed` |
| `BLD-F4-T1` | `/root/builder_f4_t1`; declared REST controllers/barrels, DTOs and schema adapter | Revision 6; `RF-02–RF-08`, `RF-10`, `RF-11`; `CA-02–CA-12`, `CA-16–CA-18`; seven exact operations plus existing registration wiring | SDD, fixtures/tests, database/server module, web, other paths and lockfiles | `code-conventions-rules.md`, `rest-layer-rules.md`, `validation-package-rules.md`, `database-layer-rules.md` | 14 REST files passed Biome; server typecheck passed; route/status/actor/serialization inspected | `passed` |
| `BLD-F5-T1` | `/root/builder_f5_t1`; exact Plan transport/context/hooks/route/navigation paths; exclusive generated route tree | Revision 6; `RF-01`, `RF-08`, `RF-10`, `RF-11`; `CA-01`, `CA-04`, `CA-08`, `CA-11`, `CA-12`, `CA-16`, `CA-17`; canonical service/hooks/navigation/route | SDD, Stock widgets/tests, Playwright fixtures/routes, other paths and lockfiles; route tree generated only | `code-conventions-rules.md`, `ui-layer-rules.md`, `web-app-routing-rules.md`, `rest-layer-rules.md`, design read-only | Route generation, focused Biome and products-index Playwright with fresh screenshot/console/network evidence | `passed` |
| `BLD-F4-T2` | `/root/builder_f4_t2`; server MRP fixture and controller test paths | Revision 6; `RF-02–RF-08`, `RF-10`, `RF-11`; `CA-02–CA-12`, `CA-16–CA-18`; real fixture and one HTTP suite/controller | SDD, controllers/DTOs/database/module/rest-client/web/other paths and lockfiles | `code-conventions-rules.md`, `controllers-testing-rules.md`, `database-layer-rules.md`, `rest-layer-rules.md` | 9 files Biome/type pass; focused 7 files/19 tests and full 26 files/60 tests pass | `passed` |
| `BLD-F4-T3` | `/root/builder_f4_t3`; server MRP module and products REST examples | Revision 6; `RF-02–RF-08`, `RF-10`, `RF-11`; `CA-02–CA-12`, `CA-16–CA-18`; nine controllers and complete operation examples | SDD, controllers/tests/database/web/other paths and lockfiles | `code-conventions-rules.md`, `rest-layer-rules.md` | Focused composition check; final server code/types/build after F4-T2 | `passed` |
| `BLD-F5-T2` | `/root/builder_f5_t2`; Product Stock page/hook, header, summary and brands card/hook paths | Revision 6; `RF-01–RF-04`, `RF-08`, `RF-09`; `CA-01–CA-07`, `CA-11–CA-14`; Stock-only loading/error/empty/success shell, identity/metrics/Single actions/brands responsiveness | SDD, action dialogs/menu/history/tests/hooks/route/other paths and lockfiles | `code-conventions-rules.md`, `ui-layer-rules.md`, `documentation/design.md`; saved manifest/references | Focused Biome and Playwright exact tree/keyboard/narrow/console/network with fresh populated/loading/error/empty captures | `passed` |
| `BLD-FIX-F3-QG1` | `/root/builder_fix_f3_qg1`; generated 0007 snapshot and journal only | Revision 6; preserve exact generated schema/journal semantics while satisfying repository formatting gate | All source/SDD/SQL/other migrations/lockfiles; no second migration generation or manual JSON edits | `database-layer-rules.md`, `documentation/tooling.md` | Formatter-only change; semantic hashes/order unchanged; 2-file and 230-file server code checks passed | `passed` |
| `BLD-F5-T3` | `/root/builder_f5_t3`; brand action menu, Add/Edit dialog and remove dialog paths | Revision 6; `RF-05–RF-07`, `RF-09`; `CA-08–CA-10`, `CA-13`, `CA-14`; exact lifecycle forms/menu/delete states | SDD, parent page/brands, adjustment/history/tests/routes/hooks/other paths and lockfiles | `code-conventions-rules.md`, `ui-layer-rules.md`, `validation-package-rules.md`, design/references | Focused Biome and exact reference/state/keyboard/focus/narrow captures | `passed` |
| `BLD-F5-T4` | `/root/builder_f5_t4`; adjustment dialog/hook and transaction-history card | Revision 6; `RF-03`, `RF-04`, `RF-09`, `RF-11`; `CA-04–CA-07`, `CA-13–CA-18`; exact conversion/insufficiency and independent history states | SDD, page/other widgets/tests/routes/hooks/other paths and lockfiles | `code-conventions-rules.md`, `ui-layer-rules.md`, `validation-package-rules.md`, design/reference | Focused Biome and adjustment/history state/keyboard/narrow/console/network captures | `passed` |
| `BLD-FIX-F5-T2-QG1` | `/root/builder_fix_f5_t2_qg1`; original F5-T2 page/hook/header/summary/brands paths | Revision 6; compose all F5-T3/F5-T4 public child contracts and exact page tree without duplicating child behavior | F5-T3/F5-T4 implementations, tests/hooks/routes/SDD/other paths and lockfiles | `code-conventions-rules.md`, `ui-layer-rules.md`, design/manifest | Full Stock widget Biome (14 files), web typecheck and HTTP-200 route render smoke passed | `passed` |
| `BLD-F5-T5` | `/root/builder_f5_t5`; six exact colocated product-stock test files | Revision 6; `RF-01–RF-11`; `CA-01–CA-18`; real page composition, lifecycle/forms/refresh/focus/conversion/history matrices | All production source, SDD, route tests/fixtures, other paths and lockfiles | `code-conventions-rules.md`, `widget-testing-rules.md`, `ui-layer-rules.md` | Focused 6 files/11 tests, full 36 files/111 tests, web code/types passed | `passed` |
| `BLD-F5-T6` | `/root/builder_f5_t6`; exact web MRP fixture and three route test files | Revision 6; `RF-01–RF-11`; `CA-01–CA-18`; stateful route access/URL/transport/lifecycle/actions/keyboard/focus/responsive matrix and real-flow preparation | Production source, SDD, unit tests, other paths and lockfiles | `web-app-routing-rules.md`, `widget-testing-rules.md`, design/manifest, Playwright CLI workflow | Focused mocked Playwright, exact console/network/DOM/URL and all fresh reference/supplemental captures | `passed` |
| `BLD-FIX-F5-T3-QG1` | `/root/builder_fix_f5_t3_qg1`; original menu/brand-dialog/remove-dialog paths | Revision 6; preserve lifecycle behavior while correcting exact 293×188 menu, 596×353 delete and 320×900 dialog layout/surface failures | Parent/other widgets, tests/routes/SDD/other paths and lockfiles | `ui-layer-rules.md`, `documentation/design.md`, saved references and fresh failed captures | Focused Biome/types; targeted existing Playwright recapture and exact visual inspection | `passed` |
| `BLD-FIX-F5-T6-QG1` | `/root/builder_fix_f5_t6_qg1`; original F5-T6 fixture/route-test paths | Revision 6; deterministically initialize current route/transport state and rerun invalidated visuals without masking production failures | Production source, unit tests, SDD, other paths and lockfiles | `web-app-routing-rules.md`, `widget-testing-rules.md`, Playwright CLI workflow | Error-context console/network inspection, exact 10-test route + catalog, Biome/types and VIS-04/05/17 recapture | `passed` |
| `CONF-BASELINE` | Orchestrator; untouched candidate inspection | Required revision-6 file/widget tree, boundaries, RF/CA contracts, UI/design states, exclusions and validation commands | No feature implementation edit | Full Rule Pack and five saved design references | `find`/`rg` baseline on 2026-08-18; exact gaps below | `passed` |
| `CONF-F1-T1` | Orchestrator; domain handoff | Required files exist/non-empty; changes remain in owned domain paths; exact readonly projections/inputs/ledger snapshots and exports match revision 6; UI/design states not applicable; exclusions preserved | No out-of-scope diff | F1-T1 Rule Pack | Focused Biome passed on current candidate; no runtime/UI claim | `passed` |
| `CONF-F1-T2` | Orchestrator; interface handoff | Required repository/service paths exist; changes remain in owned interface paths; establishment/product qualification, signed delta, paging and shared transaction scope match revision 6; UI/design states not applicable; exclusions preserved | No out-of-scope diff | F1-T2 Rule Pack | Focused Biome and diff check passed; full typecheck deferred to active consumers | `passed` |
| `CONF-F1` | Orchestrator; complete phase handoff | Exact domain/interface/use-case/test tree exists; every changed path is inside F1 scopes; role/tenant/mode/Main/balance/ledger/history contracts and exclusions match revision 6; UI/design states not applicable; no stock event/outbox/messaging dependency | No out-of-scope diff | Complete F1 Rule Pack | Core code/types/tests passed on current candidate; 30 files/74 tests; downstream Datetime/actor-name wiring recorded | `passed` |
| `CONF-F2` | Orchestrator; Validation handoff | Six required schemas and root exports exist; paths remain in F2 scopes; exact strict fields, bounds, Core enum, inclusive dates/default paging, Add/Edit/stock exclusions match revision 6; UI rendering/design not yet applicable | No out-of-scope diff | F2 Rule Pack | Validation code/types passed; direct schema boundary assertions passed | `passed` |
| `CONF-F3-T1` | Orchestrator; model/migration handoff | Required model/type/mapper and exact 0007 artifacts exist; paths remain in F3-T1 scope; brand/ledger columns, precision, snapshots, checks, indexes and FK/deletion semantics match revision 6; UI/design not applicable; prior journal order preserved | No out-of-scope diff; generated outputs inspected, not hand-edited | F3-T1 Rule Pack | Focused Biome/diff passed; SQL/snapshot/journal reviewed; full server type/persistence deferred | `passed` |
| `CONF-F3-T2` | Orchestrator; repository handoff | Required repository tree exists; paths remain in F3-T2 scope; tenant/product predicates, product-qualified brand changes, atomic guarded signed arithmetic, reused history filters/order/count and one serializable retry match revision 6; UI/design not applicable; publication exclusions preserved | No out-of-scope diff; unrelated legacy scope placeholders classified pre-existing | F3-T2 Rule Pack | Focused Biome/diff passed; server type reached only the planned out-of-scope controller constructor gap; real persistence deferred | `passed` |
| `CONF-F3` | Orchestrator; complete persistence handoff | Exact model/type/mapper/repository/token/module/seeder/migration tree exists; every path stays in F3 scopes; schema/query/transaction/composition contracts and exclusions match revision 6; UI/design not applicable | Generated outputs reviewed; no raw SQL seeding; unrelated legacy scope placeholders remain pre-existing | Complete F3 Rule Pack | All focused Biome/diff checks pass; server type reaches only planned F4 register-controller constructor gap; real persistence pending F4-T2 | `passed` |
| `CONF-F4-T1` | Orchestrator; REST boundary handoff | Seven controller/DTO/schema paths and barrels exist; all changes remain in F4-T1 scope; exact methods/semantic params/shared bodies/guards/actors/statuses/date serialization match revision 6; UI/design not applicable; business logic remains Core-owned | No out-of-scope diff | F4-T1 Rule Pack | Focused Biome and server typecheck passed; real HTTP/persistence pending F4-T2 | `passed` |
| `CONF-F4` | Orchestrator; complete server handoff | Exact controllers/DTOs/schema/fixture/tests/module/REST-example tree exists; paths remain in F4 scopes; HTTP/auth/tenant/transaction/contention/history/status/serialization contracts and exclusions match revision 6; UI/design not applicable | No out-of-scope diff; generated formatting correction semantically neutral | Complete F4 Rule Pack | Orchestrator server code 230 files, types and build pass; focused 19 and full 60 tests pass | `passed` |

Baseline conformance: existing catalog/domain files are present, but the required detail projections, immutable ledger entity, adjustment/history structures, stock-transaction repository, expanded service operations, seven stock use cases, validation schemas, persistence migration/repositories, REST operations, dynamic route, Stock page/widget tree and route tests are absent. Existing `MrpDatabaseScope` is partial and existing product/brand/balance contracts require revision-6 changes. This is the expected pre-implementation gap, not acceptance evidence. No extra implementation path was admitted; UI states and all five supplied plus thirteen supplemental visual targets are unimplemented. The current exclusions remain intact: no adjacent tabs, product Edit/Remove, administrative audit/export, stock event, broker, outbox or messaging implementation was found in the candidate slice.

Required runtime resources: Docker PostgreSQL/Supabase, authenticated manager and non-manager accounts, two establishments, Single and By-brand product fixtures, deterministic brands/balances/history/authors, server `127.0.0.1:3333`, web `127.0.0.1:4000`. Validation records live in `evaluation.md`; implementation screenshots are transient Playwright or CI artifacts.

## Acceptance matrix

| Criterion | Evidence | Status |
| --- | --- | --- |
| `CA-01` | `EV-WEB`; `MV-01` | `passed` |
| `CA-02` | `EV-CORE`; `EV-SERVER`; `EV-WEB`; `MV-01`; `VIS-01` | `passed` |
| `CA-03` | `EV-CORE`; `EV-WEB`; `MV-01` | `passed` |
| `CA-04` | `EV-CORE`; `EV-SERVER`; `EV-REAL`; `MV-02`; `VIS-06` | `passed` |
| `CA-05` | `EV-CORE`; `EV-SERVER`; `MV-02`; `VIS-08` | `passed` |
| `CA-06` | `EV-CORE`; `EV-SERVER`; `MV-02` | `passed` |
| `CA-07` | `EV-CORE`; `EV-SERVER`; `EV-WEB`; `MV-03`; `VIS-01` | `passed` |
| `CA-08` | `EV-CORE`; `EV-SERVER`; `EV-WEB`; `MV-03`; `VIS-02`; `VIS-04` | `passed` |
| `CA-09` | `EV-VALIDATION`; `EV-CORE`; `EV-SERVER`; `EV-WEB`; `MV-03`; `VIS-02`; `VIS-03` | `passed` |
| `CA-10` | `EV-CORE`; `EV-SERVER`; `EV-WEB`; `MV-03`; `VIS-04`; `VIS-05` | `passed` |
| `CA-11` | `EV-SERVER`; `MV-04` | `passed` |
| `CA-12` | `EV-CORE`; `EV-SERVER`; `EV-REAL`; `MV-04` | `passed` |
| `CA-13` | `EV-WEB`; `MV-05`; `VIS-09–VIS-14`; `VIS-17` | `passed` |
| `CA-14` | `EV-WEB`; `MV-05`; `VIS-15–VIS-17` | `passed` |
| `CA-15` | `EV-VALIDATION`; `EV-WEB`; `MV-03`; `VIS-07`; `VIS-08` | `passed` |
| `CA-16` | `EV-CORE`; `EV-SERVER`; `EV-WEB`; `EV-REAL`; `MV-03`; `MV-04`; `VIS-01`; `VIS-11–VIS-14` | `passed` |
| `CA-17` | `EV-CORE`; `EV-SERVER`; `EV-REAL`; `MV-02` | `passed` |
| `CA-18` | `EV-CORE`; `EV-SERVER`; `EV-WEB`; `EV-REAL`; `MV-03`; `VIS-01`; `VIS-05` | `passed` |

## Automated and runtime evidence

| ID | Layer | Command or scenario | Result | Status |
| --- | --- | --- | --- | --- |
| `EV-PREFLIGHT` | UI | `pnpm --filter web check:playwright` | Playwright CLI 1.62.1; browser/dev-server/page/console/network/keyboard/screenshot health; 1 passed in 16.4s | `passed` |
| `EV-BASELINE` | Cross-layer | `find` and `rg` comparison of untouched revision-6 scope against the required tree/contracts | Expected implementation gap recorded in `CONF-BASELINE`; no acceptance claim | `passed` |
| `EV-F1-T1` | Domain | `pnpm exec biome check packages/core/src/mrp/domain` plus schema/barrel inspection | 43 files checked; exact required files/fields/faker/barrels inspected | `passed` |
| `EV-F1-T2` | Interfaces | `pnpm exec biome check packages/core/src/mrp/interfaces` plus boundary-signature inspection | 13 files checked; diff check passed; exact semantic signatures inspected | `passed` |
| `EV-CORE` | Domain/Use cases/Interfaces | `pnpm --filter @scoops/core check:code && pnpm --filter @scoops/core check:types && pnpm --filter @scoops/core test` | 333 code files checked; typecheck passed; 30 test files/74 tests passed | `passed` |
| `EV-VALIDATION` | Validation | `pnpm --filter @scoops/validation check:code && pnpm --filter @scoops/validation check:types` | 48 code files checked; typecheck passed; schema boundary assertions passed | `passed` |
| `EV-MIGRATION` | Database | Documented command attempt, corrected `pnpm --filter server db:migration:generate --name product_stock_history`, focused Biome and generated-artifact review | Documented extra `--` was rejected before generation; corrected command generated 0007 once; SQL/snapshot/journal reviewed | `passed` |
| `EV-SERVER` | REST/Database | `pnpm --filter server check:code && pnpm --filter server check:types && pnpm --filter server test && pnpm --filter server build` | Code 230 files, types and build pass; focused controller 7 files/19 tests and full server 26 files/60 tests pass | `passed` |
| `EV-WEB` | UI | `pnpm --filter web generate-routes && pnpm --filter web check:code && pnpm --filter web check:types && pnpm --filter web test` plus focused mocked Playwright route suite | Generation and types pass; code passes with four pre-existing reduced-motion `!important` warnings; 36 files/111 tests and focused detail 10/10 pass | `passed` |
| `EV-RUNTIME-TX` | Database | Serializable balance + ledger commit/rollback/contention | Real Testcontainers HTTP suites passed: simultaneous write-offs yielded 201+409, final balance 1 and one ledger row; rollback/negative-policy cases passed | `passed` |
| `EV-RUNTIME-AUTH` | REST/Database | Manager authorization and uniform tenant-safe not-found | Real manager/operator/foreign-tenant controller cases passed with no foreign mutation | `passed` |
| `EV-RUNTIME-HISTORY` | Cross-layer | Stable paginated/filterable history after rename/delete | Real filters/page/order and deleted-brand/author snapshot cases passed | `passed` |
| `EV-REAL` | Cross-layer | `PLAYWRIGHT_HTML_OPEN=never pnpm --filter web exec playwright test tests/routes/mrp/products.real.integration.test.ts --workers=1 --reporter=line` against Supabase, Scoops REST `:3336` and PostgreSQL | 6/6 passed: catalog, By-brand registration, Single registration + exact `{type: entry, quantity: 2}` commit and visible `3 un`/ledger row, filters, anonymous redirect and operator 403 | `passed` |

## Manual evidence

| ID | Scenario | Criteria | Expected | Observed | Status |
| --- | --- | --- | --- | --- | --- |
| `MV-01` | Navigation and product summary | `CA-01–CA-03` | Canonical detail/back URLs and correct identity, zero/ideal/situation semantics | Mocked detail 10/10 plus real catalog/detail navigation and VIS-01/VIS-11 prove URLs, identity and zero/target states | `passed` |
| `MV-02` | Single adjustment and concurrency | `CA-04–CA-06`, `CA-17` | Exact base-unit delta and ledger; contention never crosses zero; negative opt-in works | Real web committed +2 to 1 → 3 with one visible ledger row; Testcontainers contention produced 201+409, final 1 and one ledger; negative/rollback cases pass | `passed` |
| `MV-03` | By-brand lifecycle, package input and history | `CA-07–CA-10`, `CA-15`, `CA-16`, `CA-18` | Main lifecycle, exact conversion, protected deletion and stable newest-first history | Widget/mocked-route lifecycle and package payload pass; real By-brand registration passes; controller persistence proves Main/delete/history snapshots and ordering | `passed` |
| `MV-04` | Authorization and tenant isolation | `CA-11`, `CA-12`, `CA-16` | 401/403 and uniform foreign/missing 404 with no mutation/leak | Real browser proves anonymous redirect/operator 403; real controller suites prove manager access and uniform foreign/missing 404 without mutation | `passed` |
| `MV-05` | Lifecycle states, keyboard and narrow layout | `CA-13`, `CA-14` | Loading/error/retry/empty/pending, focus restoration and 320px containment | Focused mocked route 10/10 exercised loading/error/retry/empty, keyboard/focus and 320px containment; VIS-09–VIS-18 independently inspected | `passed` |

## Visual evidence

| ID | Surface and state | Viewport | Reference | Implementation | Differences | Status |
| --- | --- | --- | --- | --- | --- | --- |
| `VIS-01` | Populated By-brand Stock page | 1560 × 1320 | `design/bi8Au.png` | Playwright/CI artifact, not retained in feature docs | Stock-only hierarchy, summary, brands and history conform; excluded adjacent tabs absent | `passed` |
| `VIS-02` | Add brand dialog | 676 × 771 | `design/p72QC.png` | Playwright/CI artifact, not retained in feature docs | Required fields/context/preview/actions conform with repository tokens | `passed` |
| `VIS-03` | Edit brand dialog without stock field | 676 × 771 | `design/Jo3va.png` | Playwright/CI artifact, not retained in feature docs | Shared hierarchy conforms; initial-stock field intentionally omitted by Contract | `passed_with_authorized_difference` |
| `VIS-04` | Brand actions menu | 293 × 188 | `design/yUkPJ.png` | Playwright/CI artifact, not retained in feature docs | All three actions visible; order/destructive separator preserved; popup contained | `passed` |
| `VIS-05` | Delete brand confirmation | 596 × 353 | `design/K48XWv.png` | Playwright/CI artifact, not retained in feature docs | Corrected copy and actions separated/contained; hierarchy matches reference intent | `passed` |
| `VIS-06` | Single-stock page and adjustment success | 1280 × 900 | Manifest supplemental decision | Playwright/CI artifact, not retained in feature docs | Single/base-unit adjustment, preview and reachable actions conform | `passed` |
| `VIS-07` | By-brand package adjustment success | 676 × 771 | Manifest supplemental decision | Playwright/CI artifact, not retained in feature docs | Package mode and exact conversion preview conform | `passed` |
| `VIS-08` | By-brand insufficient adjustment | 676 × 771 | Manifest supplemental decision | Playwright/CI artifact, not retained in feature docs | Requested/available context and destructive state conform | `passed` |
| `VIS-09` | Detail loading | 1280 × 900 | Manifest supplemental decision | Playwright/CI artifact, not retained in feature docs | Skeleton hierarchy is stable and contained | `passed` |
| `VIS-10` | Detail request error/retry | 1280 × 900 | Manifest supplemental decision | Playwright/CI artifact, not retained in feature docs | Error and retry action are visible/contained | `passed` |
| `VIS-11` | Empty brands | 1280 × 900 | Manifest supplemental decision | Playwright/CI artifact, not retained in feature docs | Zero below ideal renders Low; empty guidance/actions visible | `passed` |
| `VIS-12` | History loading | 1280 × 900 | Manifest supplemental decision | Playwright/CI artifact, not retained in feature docs | Independent history loading preserves populated stock summary | `passed` |
| `VIS-13` | History empty | 1280 × 900 | Manifest supplemental decision | Playwright/CI artifact, not retained in feature docs | Independent empty history preserves populated 18 kg brands state | `passed` |
| `VIS-14` | History request error | 1280 × 900 | Manifest supplemental decision | Playwright/CI artifact, not retained in feature docs | Independent retryable history error preserves stock content | `passed` |
| `VIS-15` | History filtered-empty | 1280 × 900 | Manifest supplemental decision | Playwright/CI artifact, not retained in feature docs | Active filter/clear and distinct empty copy conform | `passed` |
| `VIS-16` | Narrow populated page | 320 × 900 | Manifest supplemental decision | Playwright/CI artifact, not retained in feature docs | Cards stack, filters/actions remain reachable, no page overflow | `passed` |
| `VIS-17` | Narrow dialog | 320 × 900 | Manifest supplemental decision | Playwright/CI artifact, not retained in feature docs | Opaque, legible, contained and actions reachable; underlying content correctly dimmed | `passed` |
| `VIS-18` | Narrow action menu | 320 × 900 | Manifest supplemental decision | Playwright/CI artifact, not retained in feature docs | Menu actions are visible, contained and keyboard reachable | `passed` |

## Rule and documentation compliance

| Authority | Reference | Result | Notes |
| --- | --- | --- | --- |
| SDD | `documentation/sdd-rules.md` | `passed` | Revision/status/Plan/evaluation kickoff reconciled before source edits |
| Architecture/modules | `documentation/architecture.md`; `documentation/modules.md` | `passed` | MRP ownership, tenant scope, server authority and atomic writes preserved across conformance checkpoints |
| Rule Pack | `documentation/rules/code-conventions-rules.md`; `core-package-rules.md`; `use-case-testing-rules.md`; `validation-package-rules.md`; `rest-layer-rules.md`; `controllers-testing-rules.md`; `database-layer-rules.md`; `ui-layer-rules.md`; `web-app-routing-rules.md`; `widget-testing-rules.md` | `passed` | Task-specific and integrated gates passed; no blocking rule deviation remains |
| Tooling | `documentation/tooling.md` | `passed` | Workspace, Docker, migration, static, unit, controller and Playwright CLI workflows completed |
| Design | `documentation/design.md`; `design/manifest.md`; five saved PNGs | `passed` | All supplied and supplemental targets resolved independently; VIS-03 records the authorized Edit-field omission |

## Findings

| ID | Classification | Source | Affected evidence | Status | Resolution |
| --- | --- | --- | --- | --- | --- |
| `FND-001` | Contract baseline | Revision-6 required tree/contracts | `EV-F1-T1`, `EV-F1-T2`, `EV-CORE–EV-REAL`, `MV-01–MV-05`, `VIS-01–VIS-18` | `resolved` | Required revision-6 tree and contracts now exist and all integrated evidence passes |
| `FND-002` | Implementation | `pnpm --filter @scoops/core check:types` after F1-T1/F1-T2 | `EV-CORE` | `resolved` | Builder F1-T3 updated callers/use cases/tests; full Core code/types/tests pass |
| `FND-003` | Tooling | Documented migration command forwarded a literal `--` | `EV-MIGRATION` | `resolved` | No artifact was generated by failed attempt; corrected repository-supported pnpm syntax generated 0007 exactly once and artifacts were reviewed |
| `FND-004` | Implementation dependency | F5-T1 web type/render after generated dynamic route | `EV-WEB`; `CA-01` | `resolved` | F5-T2 supplied `ProductStockPage`; route generation, types and browser suites pass |
| `FND-005` | Test expectation | `products.index.test.ts` still expects forbidden registration `isPrimary` | `EV-WEB`; `CA-08` | `resolved` | F5-T6 corrected the route expectation and catalog suite passes 8/8 |
| `FND-006` | Generated artifact formatting | `pnpm --filter server check:code` | `EV-MIGRATION`; `EV-SERVER` | `resolved` | Repository formatter changed only layout; semantic hashes and journal idx/tags stayed identical; full server code gate passed |
| `FND-007` | Environment/runtime | `pnpm --filter web check:playwright` after F5-T2 | `EV-PREFLIGHT`; `EV-WEB`; all `VIS-*` | `resolved` | Orchestrator exact rerun passed 1/1 in 12.6s; earlier blank login classified transient, with no visual evidence promoted |
| `FND-008` | Implementation | F5-T3/F5-T4 handoff conformance | `EV-WEB`; `CA-04–CA-10`; `CA-13–CA-18`; `VIS-01–VIS-18` | `resolved` | Page/hook now composes all lifecycle/adjustment/history children; Stock widget Biome, web typecheck and route render smoke pass; browser evidence remains pending fresh capture |
| `FND-009` | Visual implementation | Orchestrator inspection of `VIS-04`, `VIS-05`, `VIS-17` | `EV-WEB`; `CA-08–CA-10`; `CA-13`, `CA-14`; `VIS-04`; `VIS-05`; `VIS-17` | `resolved` | Corrected captures show all menu actions, separated delete hierarchy/actions, and opaque usable narrow dialog |
| `FND-010` | Test/runtime isolation | Orchestrator direct focused mocked route run | `EV-WEB`; `CA-02`; `CA-13`; `VIS-01`; `VIS-10` | `resolved` | Route helpers await exact semantic request/response readiness; deliberate loading awaits request only. Builder passed 10/10 three times; Orchestrator detail 10/10 and catalog 8/8 passed |
| `FND-011` | Visual fixture/conformance | Orchestrator inspection/hash of `VIS-11` and `VIS-13` | `CA-03`; `CA-13`; `CA-16`; `VIS-11`; `VIS-13` | `resolved` | VIS-11 now shows Low for zero below ideal; VIS-13 independently preserves populated stock/brands with empty history; hashes differ and inspection passes |
| `FND-012` | Environment/runtime | Initial real browser run targeted configured REST `:3336` while only an unrelated service listened on `:3333` | `EV-REAL`; `MV-01–MV-04` | `resolved` | Started the Scoops server on its `.env` port, verified health and reran serially against the correct stack |
| `FND-013` | Test fixture | Single-stock real scenario omitted required ideal stock and asserted the wrong default unit | `EV-REAL`; `CA-04`; `CA-17` | `resolved` | Scoped Builder Fix supplied ideal stock and semantic `un` balance/history assertions; focused 1/1 and full real 6/6 pass |
| `FND-014` | Visual implementation/documentation | Native history date input showed an inner-only outline instead of one composed-control focus state | `EV-WEB`; `CA-14`; `VIS-15` | `resolved` | Delegated focus to the complete `De`/`Até` wrapper; focused static/widget/Playwright gates pass and fresh VIS-15 was inspected. Reusable lesson added to `documentation/design.md` and `documentation/rules/ui-layer-rules.md`; Architecture and Tooling need no change because no system boundary or command workflow was affected |
| `FND-015` | Visual implementation/documentation | Ordinary inputs could receive divergent page-level focus rings instead of the project-wide shared focus treatment | `EV-WEB`; `VIS-03`; `VIS-06` | `resolved` | Shared Input now owns one 2px soft focus ring and composite controls delegate focus to their wrapper. Focus overrides were removed from affected consumers and the reusable rule is documented in Design/UI rules; Architecture and Tooling need no change because no boundary or command workflow changed |
| `FND-016` | Visual implementation/documentation | Dialog headers used competing horizontal, vertical, and missing-icon layouts across MRP and Identity | `EV-WEB`; `VIS-03`; `VIS-06`; `VIS-17` | `resolved` | Application dialog headers now follow the vertical semantic-icon, title, supporting-copy, top-right close, and separator pattern. Design/UI rules record the reusable contract; Architecture and Tooling need no change because no boundary or command workflow changed |

## PR CI quality gate

<!-- Populate during conclude-spec. The head SHA identifies the PR revision checked by CI; it
is not SDD current-commit metadata. Retain failed and superseded-head runs as history. -->

| ID | Workflow | Head SHA | Result | Run |
| --- | --- | --- | --- | --- |
| `CI-001` | Core CI (pull request) | `004ec5222a33e4770a6a304a84d0dad7ce84dccd` | `passed` | [run 32432813105](https://github.com/rafinel/scoops/actions/runs/32432813105) |
| `CI-002` | Server CI (pull request) | `004ec5222a33e4770a6a304a84dccd` | `failed_transient_rerun_pending` — Supabase Auth `AuthRetryableFetchError: fetch failed` while creating test users; same-SHA rerun authorized | [run 32432813159](https://github.com/rafinel/scoops/actions/runs/32432813159) |
| `CI-003` | Web CI (pull request) | `004ec5222a33e4770a6a304a84d0dad7ce84dccd` | `failed_baseline` — unchanged `use-onboarding-page.test.ts` expects `pending`, but the current date makes the fixture `expired`; no Stock-tab test failed | [run 32432813495](https://github.com/rafinel/scoops/actions/runs/32432813495) |
| `CI-004` | Server CI (pull request, same-SHA rerun) | `004ec5222a33e4770a6a304a84d0dad7ce84dccd` | `failed` — the same Supabase Auth fetch failure repeated; not transient after the permitted rerun | [run 32432813159](https://github.com/rafinel/scoops/actions/runs/32432813159) |
| `CI-005` | Web CI (pull request) | `51180de64d7e8fef74911cae2c314977a84d0dbb` | `failed` — Web unit tests passed, but the unchanged browser onboarding fixture expired during the continuation flow | [run 32435196405](https://github.com/rafinel/scoops/actions/runs/32435196405) |
| `CI-006` | Server CI (pull request) | `51180de64d7e8fef74911cae2c314977a84d0dbb` | `failed` — gateway startup and health passed, then placeholder `ci-*` credentials were rejected as malformed JWTs | [run 32435196492](https://github.com/rafinel/scoops/actions/runs/32435196492) |
| `CI-007` | Core CI (pull request) | `4306811939faeab094389bf3db6f7f045d482f5d` | `passed` | [run 32435801302](https://github.com/rafinel/scoops/actions/runs/32435801302) |
| `CI-008` | Server CI (pull request) | `4306811939faeab094389bf3db6f7f045d482f5d` | `passed` — valid test JWTs, gateway health, full tests, and build | [run 32435801300](https://github.com/rafinel/scoops/actions/runs/32435801300) |
| `CI-009` | Web CI (pull request) | `4306811939faeab094389bf3db6f7f045d482f5d` | `passed` — unit tests, 81 browser tests, and build | [run 32435801278](https://github.com/rafinel/scoops/actions/runs/32435801278) |

## History

| Date | Event |
| --- | --- |
| `2026-08-18` | Evaluation created from the canonical template for Spec revision 6. |
| `2026-08-18` | `pnpm --filter web check:playwright` passed before feature implementation: Playwright CLI 1.62.1, 1/1 test. |
| `2026-08-18` | Spec revision 6 frozen and moved from `open` to `in_progress`; Plan and F1 moved to `in_progress`. |
| `2026-08-18` | Untouched candidate compared against required file/widget tree, boundaries, contracts, UI/design states, exclusions and validation; expected feature gaps recorded in `CONF-BASELINE`. |
| `2026-08-18` | Builders `/root/builder_f1_t1` and `/root/builder_f1_t2` activated on non-overlapping scopes with exact RF/CA mappings, prohibited paths, Rule Packs and exits. |
| `2026-08-18` | Orchestrator inspected F1-T1/F1-T2 diffs and reran both focused Biome exits successfully; conformance checkpoints passed. |
| `2026-08-18` | Interim Core typecheck found eight old-contract use-case errors; `FND-002` routed to activated Builder `/root/builder_f1_t3`. |
| `2026-08-18` | F1 completed after Orchestrator inspection and successful Core code/type/test gate (333 files; 30 test files/74 tests); `FND-002` resolved. |
| `2026-08-18` | Wave 2 Builders `/root/builder_f2_t1`, `/root/builder_f2_t2` and `/root/builder_f3_t1` activated with exact non-overlapping paths, contracts, Rules and exits. |
| `2026-08-18` | F2 completed: Validation code/type checks passed (48 files), root exports reconciled, and transport/form boundary assertions inspected. |
| `2026-08-18` | F3-T1 completed: documented migration command failed before generation due literal argument forwarding; corrected syntax generated 0007 once; model/SQL/snapshot/journal checks passed and `FND-003` resolved. |
| `2026-08-18` | Builder `/root/builder_f3_t2` activated for repository and transaction-scope paths with exact revision-6 contract and exit. |
| `2026-08-18` | F3-T2 completed: repository Biome/diff and Orchestrator query/transaction inspection passed; real PostgreSQL behavior remains pending F4-T2. |
| `2026-08-18` | Builder `/root/builder_f3_t3` activated for database token/module/seeder composition with exact revision-6 contract and exit. |
| `2026-08-18` | F3 completed: focused persistence checks and full conformance review passed; server typecheck is pending the planned F4 constructor wiring, and real PostgreSQL proof remains F4-T2. |
| `2026-08-18` | Builders `/root/builder_f4_t1` and `/root/builder_f5_t1` activated for non-overlapping Wave 3 REST and web transport/routing scopes. |
| `2026-08-18` | F4-T1 completed: focused REST Biome and server typecheck passed; routes/status/actor/serialization conformance inspected. |
| `2026-08-18` | F5-T1 generation and focused Biome passed; products-index Playwright ran 8 tests (5 passed, 3 failed) due the planned missing F5-T2 route import and stale F5-T6 `isPrimary` expectation; `FND-004`/`FND-005` active. |
| `2026-08-18` | Builders `/root/builder_f4_t2` and `/root/builder_f4_t3` activated for real controller evidence and server composition/examples. |
| `2026-08-18` | Builder `/root/builder_f5_t2` activated for the Stock page shell/header/summary/brands paths and exact design/state exit. |
| `2026-08-18` | F4-T2 real Testcontainers evidence passed: focused 7 files/19 tests and full server 26 files/60 tests, including tenant/auth/contention/rollback/history snapshots. |
| `2026-08-18` | F4-T3 owned checks, server typecheck and build passed; server code check exposed generated 0007 metadata formatting `FND-006`. |
| `2026-08-18` | F5-T2 focused Biome and web typecheck passed; Playwright health failed twice at login before feature validation, recorded as `FND-007`; no visual claim. |
| `2026-08-18` | Builder Fix `/root/builder_fix_f3_qg1` activated for formatting-only generated metadata correction with semantic/order proof. |
| `2026-08-18` | F3-QG-1 resolved `FND-006`: snapshot/journal semantic hashes and order unchanged; focused and full 230-file server code checks passed. |
| `2026-08-18` | Orchestrator reran Playwright health successfully (1/1 in 12.6s), resolving transient `FND-007`. |
| `2026-08-18` | Builders `/root/builder_f5_t3` and `/root/builder_f5_t4` activated for disjoint lifecycle-dialog and adjustment/history paths. |
| `2026-08-18` | F4 completed after Orchestrator reran server code (230 files), types and build successfully; current real controller test evidence remains 7 files/19 and full 26 files/60 passed. |
| `2026-08-18` | F5-T3/F5-T4 focused static/type exits passed, but handoff inspection found the page did not compose their dialogs/history; `FND-008` activated and browser evidence remains pending. |
| `2026-08-18` | Builder Fix `/root/builder_fix_f5_t2_qg1` activated on original page/hook composition paths only. |
| `2026-08-18` | F5-T2-QG-1 resolved `FND-008`: all child widgets integrated; full Stock widget Biome (14 files), web typecheck and route render smoke passed. |
| `2026-08-18` | Builder `/root/builder_f5_t5` activated for six exact colocated integrated widget test files. |
| `2026-08-18` | F5-T5 completed; Orchestrator rerun passed 36 web test files/111 tests, web code (four pre-existing shared CSS warnings) and web types. |
| `2026-08-18` | Builder `/root/builder_f5_t6` activated for exact route fixtures/tests, stale payload correction and fresh browser/design evidence. |
| `2026-08-18` | F5-T6 command history retained: accidental broad `--` forwarding was interrupted; unescaped `$` focus found no tests; corrected escaped focus passed. Catalog 8/8 and mocked detail 10/10 passed, with later invalidated scenarios rerun after test-only fixes. |
| `2026-08-18` | All 18 visual files were captured fresh/non-empty. Orchestrator inspected VIS-04/VIS-05/VIS-17 and recorded blocking `FND-009`; no failed visual was accepted. |
| `2026-08-18` | Builder Fix `/root/builder_fix_f5_t3_qg1` activated on original lifecycle-dialog/menu paths only. |
| `2026-08-18` | F5-T3-QG-1 source/static/type and targeted recapture passed; Orchestrator visual inspection now sees menu actions, separated delete hierarchy and opaque narrow dialog, but evidence remains stale until route boundary rerun. |
| `2026-08-18` | Orchestrator direct 10-test mocked detail run failed 2 initial-render scenarios (8 passed), activating `FND-010`; Builder Fix `/root/builder_fix_f5_t6_qg1` activated on route fixture/tests only. |
| `2026-08-18` | F5-T6-QG-1 stabilized exact request readiness; Builder ran detail 10/10 three times. Orchestrator rerun passed detail 10/10 and catalog 8/8 (single worker for the pre-existing long catalog suite). |
| `2026-08-18` | Orchestrator inspection resolved `FND-009`, then found VIS-11 invalid zero/ideal semantics and VIS-13 byte-identical rather than independent; `FND-011` routed to the same fixture/test Builder Fix. |
| `2026-08-18` | F5-T6-QG-1 recaptured VIS-11/VIS-13 independently and passed detail 10/10; Orchestrator inspection passed all 18 visual rows. F5 completed and F6 began. |
| `2026-08-18` | Initial F6 real run failed because web correctly targeted Scoops `:3336` while only an unrelated project listened on `:3333`; `FND-012` resolved by starting the repository server and applying committed migrations. |
| `2026-08-18` | Correct-stack real run passed four flows and exposed a test-only required-field/default-unit mismatch; scoped Builder Fix `/root/f6_real_test_fix` resolved `FND-013`, focused 1/1 passed. |
| `2026-08-18` | Orchestrator full real authenticated suite passed 6/6 in 36.2s; web code/types and 36 files/111 tests passed; focused mocked detail passed 10/10. MV-01–MV-05 and CA-01–CA-18 reconciled as passed. |
| `2026-08-18` | Final conformance found no blocking finding; Evaluation moved to `ready` and Plan/F6 to `completed`. |
| `2026-08-20` | Post-readiness visual correction delegated focus treatment to the complete prefixed/suffixed controls and prevented unit wrapping. Focused Biome, web types, 2 widget files/4 tests, Impeccable detector and affected Playwright states (2/2) pass; fresh VIS-03, VIS-06 and VIS-17 inspection confirms continuous focus rings and single-line `kg` affixes. |
| `2026-08-20` | Follow-up focus correction marked all brand-dialog nested inputs as delegated focus targets and suppressed their internal focus border. Focused Biome, web types, 1 widget file/2 tests, detector and Playwright 1/1 pass; fresh VIS-03 shows one continuous outer focus state with a neutral `R$` divider. |
| `2026-08-20` | `FND-014` resolved the history date-filter focus state: full wrapper ring with native segment editing cue retained. Biome, web types, 1 widget file/2 tests, detector and Playwright 1/1 pass; VIS-15 refreshed and inspected. Design/UI rules now document the reusable composed-date pattern; Architecture/Tooling no-change disposition recorded. |
| `2026-08-20` | `FND-015` standardized project input focus styling through the shared Input primitive and delegated composite wrappers; Design/UI rules updated, with Architecture/Tooling unchanged. |
| `2026-08-20` | `FND-016` standardized dialog headers across current MRP and Identity dialogs; validation evidence is recorded in the current EV-WEB run, and Design/UI rules updated with Architecture/Tooling unchanged. |
| `2026-08-21` | PR #12 opened at `004ec522`; Core PR CI passed. Web PR CI failed the unchanged date-sensitive Identity onboarding test, and Server PR CI failed twice during unrelated Supabase Auth test-user setup; Evaluation returned to `in_progress` and conclusion is paused pending scope/CI authority. |
| `2026-08-21` | CI correction authorized: the onboarding fixture now uses a date-independent future expiry, and Server CI configures `SUPABASE_URL`, starts the Compose Supabase gateway, and waits for Auth health before tests. Focused Web and MRP Server suites pass locally; the updated PR head is pending CI. |
| `2026-08-21` | New PR CI evidence: Core passed; Web unit tests passed but its shared browser onboarding fixture expired; Server reached the gateway health check but rejected placeholder credentials as malformed JWTs. The follow-up correction uses a shared future fixture and Compose-secret-signed `anon`/`service_role` JWTs. |
| `2026-08-21` | Final PR CI gate passed on `4306811`: Core, Server and Web pull-request workflows passed. Evaluation and Spec are closed; no merge or deployment was performed. |
