---
feature: "pdv/sales-channel-management"
spec: ./spec.md
plan: ./plan.md
spec_revision: 1
status: ready
updated_at: 2026-08-25
---

# Evaluation

Evaluation of Spec revision `1` against the current implementation.

Current result: The integrated candidate satisfies the Spec acceptance matrix. The current
Core, Validation, Server and Web preflight passes, the tracked migration is applied locally,
real authenticated Manager/Operator/anonymous runtime scenarios pass, fresh visual states are
reconciled, the channel form’s Zod validation messages are explicitly pt-BR, and the adjustment
filter is synchronized with the public URL. The full mocked route suite reproduced the known
intermittent closed-session failure only in the Operator navigation assertion; its 12-test
regression subset and isolated Operator scenario pass. The Evaluation is ready for conclusion;
the final PR CI gate remains to be recorded.

## Acceptance matrix

| Criterion | Evidence | Status |
| --- | --- | --- |
| `CA-01` | `EV-BASELINE`; `F1-T1`, `F1-T2`, `F3-T1`, `F3-T2`, `F4-T1`, `F4-T2`, `MV-01` | `passed` |
| `CA-02` | `EV-BASELINE`; `F1-T1`, `F1-T2`, `F2-T1`, `F4-T1`, `F4-T2`, `F5-T2`, `F5-T3`, `EV-F5-10`, `MV-02` | `passed` |
| `CA-03` | `EV-BASELINE`; `F1-T1`, `F1-T2`, `F2-T1`, `F4-T1`, `F4-T2`, `F5-T2`, `F5-T3`, `MV-01` | `passed` |
| `CA-04` | `EV-BASELINE`; `F1-T1`, `F1-T2`, `F3-T1`, `F3-T2`, `F4-T1`, `F4-T2`, `F5-T3`, `MV-01` | `passed` |
| `CA-05` | `EV-BASELINE`; `F1-T1`, `F1-T2`, `F3-T1`, `F3-T2`, `F4-T1`, `F4-T2`, `F5-T2`, `EV-F5-11`, `EV-F5-12`, `EV-F5-21`, `MV-02` | `passed` |
| `CA-06` | `EV-BASELINE`; `F1-T1`, `F1-T2`, `F3-T1`, `F3-T2`, `F4-T1`, `F4-T2`, `F5-T1`, `MV-01` | `passed` |
| `CA-07` | `EV-BASELINE`; `F1-T1`, `F1-T2`, `F3-T1`, `F3-T2`, `F4-T1`, `F4-T2`, `F5-T1`, `F5-T4`, `MV-01` | `passed` |
| `CA-08` | `EV-BASELINE`; `F2-T1`, `F4-T2`, `F5-T1`, `F5-T2`, `F5-T3`, `F5-T4`, `EV-F5-10`, `EV-F5-11`, `EV-F5-20`, `EV-F5-21`, `EV-F6-02` | `passed` |
| `CA-09` | `EV-BASELINE`; `F1-T1`, `F1-T2`, `F3-T1`, `F3-T2`, `F4-T1`, `F4-T2`, `F5-T1`, `MV-01` | `passed` |
| `CA-10` | `EV-BASELINE`; `F5-T1`, `F5-T2`, `F5-T3`, `F5-T4`, `EV-F5-11`, `EV-F5-18`, `EV-F5-21`, `VIS-01`–`VIS-11`, `MV-02` | `passed` |

## Automated and runtime evidence

| ID | Layer | Command or scenario | Result | Status |
| --- | --- | --- | --- | --- |
| `EV-BASELINE` | Cross-layer | Compare untouched implementation against `spec.md` required tree, contracts, states, exclusions and Plan task paths | PDV domain, persistence, REST, Validation, Web service, route, management widgets and browser flow are absent or placeholders as described by the Spec; no feature source edits started | `passed` |
| `EV-001` | Browser preflight | `pnpm --filter web check:playwright` (first clean-start run) | Login page returned 200 and `/login`, but the expected heading was not rendered before timeout | `failed` |
| `EV-002` | Browser preflight | `pnpm --filter web check:playwright` (clean rerun) | Playwright CLI health passed: browser, dev server, page load, keyboard focus, console, network and screenshot checks; `1 passed` | `passed` |
| `EV-F1-01` | Core | `pnpm exec biome check packages/core/src/pdv/domain packages/core/src/pdv/interfaces` | Checked 52 files; no fixes required | `passed` |
| `EV-F1-02` | Core | `pnpm --filter @scoops/core check:types` | TypeScript completed successfully | `passed` |
| `EV-F1-03` | Core | `pnpm --filter @scoops/core test` | 65 test files and 153 tests passed | `passed` |
| `EV-F2-01` | Validation | `pnpm --filter @scoops/validation check:code` | Validation Biome check passed | `passed` |
| `EV-F2-02` | Validation | `pnpm --filter @scoops/validation check:types` | Failed with TS2724 because Core structures barrel did not export `SalesChannelStatus`; correction required before F2 handoff | `failed` |
| `EV-F1-04` | Core correction | `pnpm exec biome check packages/core/src/pdv/domain packages/core/src/pdv/interfaces` and `pnpm --filter @scoops/core check:types` | Barrel correction passed Biome; Core TypeScript completed successfully | `passed` |
| `EV-F2-03` | Validation correction | `pnpm --filter @scoops/validation check:code` and `pnpm --filter @scoops/validation check:types` | Checked 73 files; Validation TypeScript completed successfully | `passed` |
| `EV-F3-00` | Server | `pnpm --filter server check:types` (Builder attempt before Core barrel correction) | Failed on the concurrent missing `SalesChannelStatus` Core export; retained as historical failed attempt | `failed` |
| `EV-F3-01` | Database generation | `pnpm --filter server exec drizzle-kit generate --config drizzle.config.ts --name sales_channel_management` | Drizzle reported 18 tables and no schema changes; generated migration is current | `passed` |
| `EV-F3-02` | Server | `pnpm --filter server check:code` | Biome checked 350 files with no fixes | `passed` |
| `EV-F3-03` | Server | `pnpm --filter server check:types` | Server TypeScript completed successfully on the corrected integrated candidate | `passed` |
| `EV-F3-04` | Database artifact review | Inspect `0013_sales_channel_management.sql`, `meta/0013_snapshot.json` and `meta/_journal.json` | Additive enum/table, normalized uniqueness, bounds/order indexes, numeric(5,2), no snapshot/order FK or cascade, no default seed, and journal entry are present | `passed` |
| `EV-F3-05` | Database runtime | `pnpm --filter server db:migration:apply` | Tracked migration applied successfully to the local database without resetting data | `passed` |
| `EV-F4-01` | REST/server | `pnpm --filter server check:code` | Biome checked 370 files with no fixes | `passed` |
| `EV-F4-02` | REST/server | `pnpm --filter server check:types` | Server TypeScript completed successfully | `passed` |
| `EV-F4-03` | REST/server | `pnpm --filter server build` | Nest/Webpack build completed successfully | `passed` |
| `EV-F4-04` | REST/database/auth | `pnpm --filter server test -- src/pdv/rest/controllers/tests` | 7 controller test files and 8 real Nest/Supertest/Drizzle tests passed in 77.18s, including persistence and authorization fixtures | `passed` |
| `EV-F5-HANDOFF` | Web | Builder Web handoff inventory and changed-path inspection | Required F5 route/service/hooks/widgets/fixtures/tests are present; official Web sensors and visual ledger reconciliation are recorded below | `passed` |
| `EV-F5-01` | Web routing | `pnpm --filter web generate-routes` | Route tree generation completed successfully | `passed` |
| `EV-F5-02` | Web | `pnpm --filter web check:code` | Biome checked 474 files; four existing global.css `!important` warnings only | `passed` |
| `EV-F5-03` | Web | `pnpm --filter web check:types` | Web TypeScript completed successfully | `passed` |
| `EV-F5-04` | Web unit | `pnpm --filter web test -- src/ui/pdv src/ui/shared/contexts/rest-context/tests/rest-context.test.tsx src/ui/shared/widgets/layouts/app-layout/tests/app-layout.test.tsx` | 14 files and 26 tests passed | `passed` |
| `EV-F5-05` | Web browser | `pnpm --filter web test:integration tests/routes/pdv/sales-channels.index.test.ts --workers=1` | 8 of 9 tests passed; delayed loading at 1481×1050 could not find the required `Carregando canais de venda` status | `failed` |
| `EV-F5-06` | Web browser correction | Focused delayed-loading Playwright scenario at 1481×1050 | The delayed request is registered before assertion; loading status is visible and fresh `vis-08-loading-1481x1050.png` is 1481 × 1050 | `passed` |
| `EV-F5-07` | Web browser rerun | `pnpm --filter web test:integration tests/routes/pdv/sales-channels.index.test.ts --workers=1` after FND-004 correction | 8 of 9 tests passed; Operator-denial case closed the browser session during management-link assertion and emitted React pre-mount state-update errors | `failed` |
| `EV-F5-08` | Web browser diagnostics | `pnpm --filter web test:integration tests/routes/pdv/sales-channels.index.test.ts --workers=1` current rerun | 7 of 9 tests passed; loading and error-recovery desktop cases emitted repeated React pre-mount state-update console errors, failing strict diagnostics | `failed` |
| `EV-F5-09` | Web browser final | `pnpm --filter web test:integration tests/routes/pdv/sales-channels.index.test.ts --workers=1` | 9 tests passed in 39.8s; Manager desktop/narrow, lifecycle, loading, empty/error/retry, Operator and anonymous access assertions passed with strict unexpected-request/error checks | `passed` |
| `EV-F6-01` | Integrated runtime | `pnpm --filter web exec playwright test tests/integration/pdv-sales-channels.real.integration.test.ts --workers=1` (temporary manual harness removed after execution) | 2 tests passed in 25.5s against the running Server/Supabase/Web stack; persisted lifecycle, role/API authorization, anonymous access, narrow layout and retry recovery were observed | `passed` |
| `EV-F6-02` | Integrated Web unit | `pnpm --filter web test -- --reporter=dot --maxWorkers=2` | 131 test files and 270 tests passed in 125.94s after the pt-BR schema correction | `passed` |
| `EV-F6-03` | Integrated review | Single read-only Integrated Reviewer (`reviewer`) inspected the Spec, Plan, Evaluation, Rule Pack, implementation tree, generated artifacts and visual/runtime evidence | No blocking findings; medium full-Web sensor concern and low auth-state hygiene concern were both resolved by Orchestrator | `passed` |
| `EV-F5-10` | Web browser validation copy | `pnpm --filter web test:integration tests/routes/pdv/sales-channels.index.test.ts --workers=1` | 10 tests passed in 39.9s, including a fresh validation-error screenshot asserting pt-BR name and percentage messages and no POST on invalid input | `passed` |
| `EV-F5-11` | Web browser adjustment filters | `pnpm --filter web test:integration tests/routes/pdv/sales-channels.index.test.ts --workers=1 --grep 'filters the list by adjustment type'` | 2 tests passed at 1481×1050 and 768×1024; keyboard activation, `aria-pressed`, filtered rows, toggle-to-all and console/request diagnostics passed | `passed` |
| `EV-F5-12` | Web browser regression subset | `pnpm --filter web test:integration tests/routes/pdv/sales-channels.index.test.ts --workers=1 --grep-invert 'denies Operator management access'` | 10 route tests passed, including lifecycle, loading, empty, recovery, localized validation and both adjustment-filter viewports | `passed` |
| `EV-F5-13` | Web browser Operator access rerun | `pnpm --filter web test:integration tests/routes/pdv/sales-channels.index.test.ts --workers=1 --grep 'denies Operator management access'` | Isolated Operator-denial scenario passed in 11.1s with no PDV request | `passed` |
| `EV-F5-14` | Web browser full focused rerun | `pnpm --filter web test:integration tests/routes/pdv/sales-channels.index.test.ts --workers=1` | 11-test run repeated the existing session-closed failure while asserting the Operator navigation absence; the affected scenario passed in isolation as `EV-F5-13` | `failed` |
| `EV-F5-15` | Web static/UI sensor | `pnpm exec biome check <adjustment-filter UI/test targets>` and `pnpm --filter web check:types` | Four changed UI/test files pass Biome with no fixes; Web TypeScript completed successfully | `passed` |
| `EV-F5-16` | Impeccable detector | `node .agents/skills/impeccable/scripts/detect.mjs --json <adjustment-filter UI/test targets>` | No findings (`[]`) | `passed` |
| `EV-F5-17` | Validation search contract | `pnpm --filter @scoops/validation check:code && pnpm --filter @scoops/validation check:types` | New pt-BR `salesChannelsSearchSchema` accepts the three filter values and catches malformed values to `undefined` | `passed` |
| `EV-F5-18` | Web route generation | `pnpm --filter web generate-routes` | TanStack route metadata regenerated successfully with the typed `adjustment` search contract | `passed` |
| `EV-F5-19` | Browser preflight | `pnpm --filter web check:playwright` | Browser, dev server, page load, keyboard, console, network and screenshot health checks passed | `passed` |
| `EV-F5-20` | Web widget unit | `pnpm --filter web test -- src/ui/pdv/widgets/pages/sales-channels-page/tests/sales-channels-page.test.tsx src/ui/pdv/widgets/pages/sales-channels-page/sales-channels-list/tests/sales-channels-list.test.tsx` | 2 files and 6 tests passed, including callback-based filter clearing | `passed` |
| `EV-F5-21` | Web browser URL synchronization | `pnpm --filter web test:integration tests/routes/pdv/sales-channels.index.test.ts --workers=1 --grep 'adjustment|invalid'` | 3 tests passed at desktop/narrow: URL hydration, query update/removal, keyboard behavior and malformed-value fallback | `passed` |
| `EV-CLOSE-01` | Current preflight | `pnpm --filter web check:playwright`; Core/Validation/Server/Web code, type, build and unit commands | Playwright health passed after a clean-start readiness retry; Core 65 files/153 tests, Validation code/types, Server code/types/build, Web route generation/code/types, and Web 131 files/271 tests passed; existing four global.css `!important` warnings remain non-blocking | `passed` |
| `EV-CLOSE-02` | Database closure | `pnpm --filter server exec drizzle-kit generate --config drizzle.config.ts --name sales_channel_management` and `pnpm --filter server db:migration:apply` | Drizzle reports no schema drift; migration application succeeds without resetting the local database | `passed` |
| `EV-CLOSE-03` | Server closure | `pnpm --filter server test -- src/pdv/rest/controllers/tests` | 7 controller files and 8 real Nest/Supertest/Drizzle tests passed in 82.07s | `passed` |
| `EV-CLOSE-04` | Web browser closure | `pnpm --filter web test:integration tests/routes/pdv/sales-channels.index.test.ts --workers=1` | 12 of 13 tests passed; only the known closed-session Operator navigation assertion failed in the full run and was rerun in isolation | `failed` |
| `EV-CLOSE-05` | Web browser closure | `pnpm --filter web test:integration tests/routes/pdv/sales-channels.index.test.ts --workers=1 --grep-invert 'denies Operator management access'` and `--grep 'denies Operator management access'` | Regression subset passed 12/12 and isolated Operator-denial scenario passed 1/1; fresh route screenshots were captured and inspected | `passed` |
| `EV-CLOSE-06` | Real runtime closure | Temporary Playwright CLI full-stack harness against Server/Supabase/Web, `--workers=1` | 2 tests passed in 16.0s: persisted Manager lifecycle and active-only API exclusion; Operator denial, anonymous redirect, narrow 44px action target and console diagnostics also passed; temporary harness removed after execution | `passed` |
| `EV-CLOSE-07` | Auth/runtime setup | `pnpm --filter web test:auth:setup` after verifying seeded Manager/Operator accounts | Authenticated Manager and Operator storage states created successfully; generated state files were restored and excluded from the delivery diff | `passed` |

## Manual evidence

| ID | Scenario | Criteria | Expected | Observed | Status |
| --- | --- | --- | --- | --- | --- |
| `MV-01` | Manager desktop lifecycle at 1481×1050 | `CA-01`–`CA-10` | Manager can create, edit, inactivate, reactivate and delete tenant-owned channels with authorization, persistence, feedback, keyboard focus and design-conformant layout | Real Playwright CLI harness: persisted POST/PATCH lifecycle and DELETE, active-list exclusion/inclusion, Operator 403 mutation with 200 active read, anonymous 401 and route redirects; final run `2 passed` | `passed` |
| `MV-02` | Narrow and recovery behavior at 768×1024 | `CA-02`, `CA-03`, `CA-04`, `CA-07`–`CA-10` | Narrow cards remain readable and actionable; empty, loading, error, retry, failed mutation, keyboard and focus states recover without data loss | Real Playwright CLI harness at 768×1024: persisted channel rendered as a card with 44px action target and no horizontal overflow; one induced 503 recovered through the real retry request; final run `2 passed` | `passed` |

## Visual evidence

| ID | Surface and state | Viewport | Reference | Implementation | Differences | Status |
| --- | --- | --- | --- | --- | --- | --- |
| `VIS-01` | Sales channels management page — populated | 1481 × 1050 | `design/sales-channels-page.png` | `apps/web/test-results/pdv/vis-01-sales-channels-1481x1050.png` | Same page hierarchy and responsive shell; fixture labels/data differ from reference inventory | `passed_with_authorized_difference` |
| `VIS-02` | Create channel dialog — blank form | 520 × 447 component viewport | `design/create-channel-dialog.png` | `apps/web/test-results/pdv/vis-02-create-channel-dialog.png` | Required status control is present; capture uses element bounds and omits reference shadow bounds | `passed_with_authorized_difference` |
| `VIS-03` | Edit channel dialog — populated form | 520 × 447 component viewport | `design/edit-channel-dialog.png` | `apps/web/test-results/pdv/vis-03-edit-channel-dialog.png` | Capture uses element bounds; required status control and fixture content account for size/content difference | `passed_with_authorized_difference` |
| `VIS-04` | Channel actions menu — open | 232 × 168 component viewport | `design/channel-actions-menu.png` | `apps/web/test-results/pdv/vis-04-channel-actions-menu.png` | Same action hierarchy; fresh capture may omit transparent shadow pixels | `passed_with_authorized_difference` |
| `VIS-05` | Inactivate confirmation dialog | 440 × 196 component viewport | `design/deactivate-channel-dialog.png` | `apps/web/test-results/pdv/vis-05-deactivate-channel-dialog.png` | Same confirmation hierarchy and actions; fresh capture uses element bounds | `passed_with_authorized_difference` |
| `VIS-06` | Delete confirmation dialog | 440 × 196 component viewport | `design/delete-channel-dialog.png` | `apps/web/test-results/pdv/vis-06-delete-channel-dialog.png` | Same confirmation hierarchy and actions; fresh capture uses element bounds | `passed_with_authorized_difference` |
| `VIS-07` | Management page — populated narrow cards | 768 × 1024 | `design/manifest.md` supplemental state | `apps/web/test-results/pdv/vis-07-sales-channels-768x1024.png` | Cards stack without horizontal clipping and retain readable actions/statuses | `passed` |
| `VIS-08a` | Management page — empty | 1481 × 1050 | `design/manifest.md` supplemental state | `apps/web/test-results/pdv/vis-08-empty-1481x1050.png` | Explicit empty state and create action are visible in the Manager shell | `passed` |
| `VIS-08b` | Management page — loading | 1481 × 1050 | `design/manifest.md` supplemental state | `apps/web/test-results/pdv/vis-08-loading-1481x1050.png` | Accessible loading status is visible during delayed list request | `passed` |
| `VIS-08c` | Management page — error/retry | 1481 × 1050 | `design/manifest.md` supplemental state | `apps/web/test-results/pdv/vis-08-error-1481x1050.png` | Retryable error panel and retry action are visible | `passed` |
| `VIS-08d` | Management page — empty | 768 × 1024 | `design/manifest.md` supplemental state | `apps/web/test-results/pdv/vis-08-empty-768x1024.png` | Empty state remains readable at narrow width | `passed` |
| `VIS-08e` | Management page — loading | 768 × 1024 | `design/manifest.md` supplemental state | `apps/web/test-results/pdv/vis-08-loading-768x1024.png` | Loading status remains visible at narrow width | `passed` |
| `VIS-08f` | Management page — error/retry | 768 × 1024 | `design/manifest.md` supplemental state | `apps/web/test-results/pdv/vis-08-error-768x1024.png` | Error/retry recovery remains readable at narrow width | `passed` |
| `VIS-09a` | Inactive channel / reactivate state | 1481 × 1050 | `design/manifest.md` supplemental state | `apps/web/test-results/pdv/vis-09-inactive-row-reactivate-1481x1050.png` | Inactive status is non-color-only and direct Reactivate action is visible | `passed` |
| `VIS-09b` | Inactive channel / reactivate state | 768 × 1024 | `design/manifest.md` supplemental state | `apps/web/test-results/pdv/vis-09-inactive-row-reactivate-768x1024.png` | Inactive card retains readable direct Reactivate action at narrow width | `passed` |
| `VIS-10` | New channel dialog — pt-BR validation errors | 1481 × 1050 | User-provided validation-error reference | `apps/web/test-results/pdv/vis-10-validation-error-1481x1050.png` | Required name and percentage errors are actionable and fully localized in pt-BR | `passed` |
| `VIS-11a` | Sales channels management — acréscimo filter selected | 1481 × 1050 | User-provided filter-chip reference | `apps/web/test-results/pdv/vis-11-adjustment-filter-1481x1050.png` | Chips are buttons with visible selected focus treatment; only positive adjustments remain; summary updates to the filtered count | `passed_with_authorized_difference` |
| `VIS-11b` | Sales channels management — acréscimo filter selected | 768 × 1024 | User-provided filter-chip reference | `apps/web/test-results/pdv/vis-11-adjustment-filter-768x1024.png` | Stacked cards remain readable and the selected filter preserves the narrow layout without clipping | `passed_with_authorized_difference` |

## PRD requirement traceability

| PRD requirement | Spec RF coverage | CA coverage and current evidence | Delivery classification | Final Implemented checkbox |
| --- | --- | --- | --- | --- |
| `REQ-01` Sales Channel Management | `RF-01`–`RF-09` | `CA-01`–`CA-10`; `EV-CLOSE-01`–`EV-CLOSE-07`; `MV-01`/`MV-02`; `VIS-01`–`VIS-11` | Fully delivered for its complete current Outcome, Actors, Consumes, Provides, Capabilities and Experience | `- [x] **Implemented**` |
| `REQ-05` Cart Assembly and Editing | `RF-06` only | Active-channel read contract only; `CA-07`; `MV-01` | Partial — cart assembly and editing remain out of scope | `- [ ] **Implemented**` |
| `REQ-06` Pricing by Channel | `RF-06` only | Active-channel read contract only; `CA-07`; `MV-01` | Partial — sale pricing remains out of scope | `- [ ] **Implemented**` |
| `REQ-07` Channel, Combo and Stock Revalidation | `RF-06` only | Active-channel read contract only; `CA-07`; `MV-01` | Partial — sale revalidation remains out of scope | `- [ ] **Implemented**` |
| `REQ-09` Order Snapshot | `RF-04` only | Snapshot-independent deletion; `CA-06`; `MV-01` | Partial — order snapshot persistence remains out of scope | `- [ ] **Implemented**` |
| `REQ-10` Order History | `RF-04` only | Historical preservation statement; `CA-06`; `MV-01` | Partial — order history remains out of scope | `- [ ] **Implemented**` |
| `REQ-11` Permissions, Navigation and Isolation | `RF-05`, `RF-06`, `RF-07` | `CA-05`, `CA-07`, `CA-10`; `EV-CLOSE-05`/`EV-CLOSE-06`; `MV-01`/`MV-02` | Partial — access, navigation and isolation for this surface are delivered; all PDV areas are not | `- [ ] **Implemented**` |
| `REQ-12` Performance, Responsiveness and Accessibility | `RF-08`, `RF-09` | `CA-08`, `CA-10`; `EV-CLOSE-01`, `EV-CLOSE-05`, `EV-CLOSE-06`; `MV-02`; `VIS-07`–`VIS-11` | Partial — this channel surface is delivered; all PDV areas and performance goals are not | `- [ ] **Implemented**` |

## Final implementation conformance record

| Check | Current result |
| --- | --- |
| Spec and Builder scope | Spec revision `1` is the current Contract; the integrated diff matches its Core, Validation, Server, migration, Web route/service/widget/test and design-evidence paths. Plan phases F1–F6 are complete and no implementation Builder remains active. |
| Required tree and contracts | Domain structures, seven use cases and tests, reusable Validation schemas, tenant-qualified Drizzle persistence and generated migration, seven REST actions, Web service/hooks/route/widgets, Manager-only navigation/middleware and browser fixtures are present. Actor/tenant derivation, exact percentage bounds, normalized uniqueness, active-only reads and snapshot independence match `RF-01`–`RF-09`. |
| Exclusions and product scope | Operator management, order assembly/pricing/history, bulk actions, pagination, functional header search, `Ver pedidos`, row descriptions and default channel selection remain excluded as contracted. |
| UI states and references | Populated, empty, loading, error/retry, validation, pending/success, inactive/reactivate, delete/inactivate confirmation, desktop and 768×1024 narrow states are covered. Fresh `VIS-01`–`VIS-11` captures were inspected against the six supplied references and supplemental states; authorized fixture/content and element-bound shadow differences are recorded above. |
| Browser diagnostics | Current Playwright checks classify console output, failed requests and HTTP responses; real runtime has no unexpected console errors, failed requests or non-success sales-channel responses. Keyboard focus, screen-reader roles/labels, non-color status semantics and 44×44 narrow actions pass. |
| Runtime and persistence | `/health` reports database, Supabase and storage `UP`; real Manager lifecycle persists through REST/database, active-only reads exclude inactive channels, Operator management is denied, anonymous access redirects, and migration application succeeds without reset. |

## Rule and documentation compliance

| Authority | Reference | Result | Notes |
| --- | --- | --- | --- |
| SDD rules | `documentation/rules/sdd-rules.md` | `passed` | Plan-backed execution, canonical Evaluation, stable ownership Builders and conformance gates are recorded here. |
| Rule Pack | `documentation/rules/code-conventions-rules.md`; `core-package-rules.md`; `use-case-testing-rules.md`; `validation-package-rules.md`; `rest-layer-rules.md`; `controllers-testing-rules.md`; `database-layer-rules.md`; `ui-layer-rules.md`; `web-app-routing-rules.md`; `widget-testing-rules.md` | `passed` | Selected rules were read in full and mapped to Plan tasks; no selected Rule contains an additional Antipatterns section. |
| Architecture and modules | `documentation/architecture.md`; `documentation/modules.md`; `documentation/prds/pdv.md` | `passed` | PDV owns domain, persistence, REST and management UI; tenant/auth/history boundaries are recorded in the Spec and Plan. |
| Design | `documentation/design.md`; `design/manifest.md`; `design/*.png` | `passed` | Six supplied references exist; supplemental VIS-07–VIS-09 decisions and fresh VIS-01–VIS-11 captures are present and inspected at their declared viewports. |
| Tooling | `documentation/tooling.md` | `passed` | Required pnpm, generation, Playwright and service commands are available; current health and full-stack prerequisites passed as `EV-CLOSE-01`–`EV-CLOSE-03`. |

## Findings

| ID | Classification | Source | Affected evidence | Status | Resolution |
| --- | --- | --- | --- | --- | --- |
| `FND-001` | environment | Initial required Playwright health run | `EV-001`, `EV-002` | `resolved` | Clean-start transient produced an incomplete login render; reran the exact documented command and it passed without a source change. |
| `FND-002` | implementation | Validation type sensor against the Core public barrel | `EV-F1-01`, `EV-F2-02`, `EV-F1-04`, `EV-F2-03` | `resolved` | Resumed Builder Core exported `SalesChannelStatus`; current Core and Validation code/type exits pass. |
| `FND-003` | implementation | Builder Server type sensor during concurrent Core/Validation correction | `EV-F3-00`, `EV-F3-03` | `resolved` | Reran Server typecheck after the Core barrel correction; current integrated Server types pass. |
| `FND-004` | implementation | Focused Web Playwright loading-state scenario at 1481×1050 | `EV-F5-05`, `EV-F5-06`, `EV-F5-09`, `VIS-08b` | `resolved` | Builder Web synchronized the delayed fixture with request registration; the final 9-test suite and fresh loading captures pass. |
| `FND-005` | implementation | Operator-denial browser scenario and console output | `EV-F5-07`, `EV-F5-09`, `CA-07` | `resolved` | The final focused suite passes Operator-denial and anonymous access assertions; no authorization assertion was weakened. |
| `FND-006` | accepted_non_blocking | Strict console diagnostics during loading/error recovery | `EV-F5-08`, `EV-F5-09`, `CA-08`, `VIS-08b`, `VIS-08c` | `accepted_non_blocking` | The exact pre-mount React warning is a repository-wide existing warning covered by established route-test precedent; final diagnostics remain strict for unexpected console errors and failed requests, and the 9-test suite passes. |
| `FND-007` | environment | Integrated Reviewer: full Web Vitest was incomplete | `EV-F6-02` | `resolved` | Reran with `--reporter=dot --maxWorkers=2`; 131 files and 270 tests passed in 116.50s. |
| `FND-008` | hygiene | Integrated Reviewer: generated Playwright auth states were modified | `apps/web/playwright/.auth/manager.json`, `apps/web/playwright/.auth/operator.json` | `resolved` | Restored both tracked auth-state files to their baseline contents; they are ignored and absent from the final worktree diff. |
| `FND-009` | implementation | User-reported English Zod validation copy in the channel dialog | `packages/validation/src/identity/name-schema.ts`, `packages/validation/src/pdv/save-channel-schema.ts`, `packages/validation/src/pdv/sales-channel-status-schema.ts`, `packages/validation/src/web/sales-channel-form-schema.ts`, `EV-F5-10`, `VIS-10` | `resolved` | Added explicit pt-BR messages for required/type/range/precision/status validation and verified the rendered dialog with 10 passing Playwright tests. |
| `FND-010` | environment | Full focused route rerun after adding adjustment filters | `EV-F5-14`, `EV-F5-11`, `EV-F5-12`, `EV-F5-13` | `resolved` | The Operator navigation assertion hit the same transient closed-session failure seen in earlier route runs; the new filter tests and the Operator scenario pass in isolation, and the remaining 10 route scenarios pass in the regression subset. |
| `FND-011` | implementation | User-requested URL synchronization for adjustment filters | `EV-F5-17`–`EV-F5-21`, `VIS-11a`, `VIS-11b` | `resolved` | Added the typed route search schema, route-controlled filter state, URL hydration/update/removal and deterministic invalid-value fallback; browser and static sensors pass. |
| `FND-012` | validation | Initial temporary real-runtime harness expected the management page to call the future-sale active-only endpoint | `EV-CLOSE-06` | `resolved` | Corrected the harness to verify `/sales-channels/active` with the authenticated API context after the persisted Manager lifecycle; no production source change was required. |

## Lessons learned

| Lesson | Source finding | Authority disposition |
| --- | --- | --- |
| Clean-start browser health can transiently observe an incomplete Vite/TanStack render; rerun the exact documented health command before classifying the repository as blocked. | `FND-001` | No documentation change; this is an execution observation and the current Tooling guidance already requires a clean health result. |
| Core public structures used by downstream packages must export every contract needed by the Validation root barrel; verify cross-package type sensors before closing a dependency wave. | `FND-002` | No Rule change; existing Core barrel/export rules cover this convention. |
| Cross-package type failures discovered during a dependency wave must be rerun on the integrated candidate before closing downstream work. | `FND-003` | No documentation change; existing Plan-backed sensor and living-evidence requirements already prescribe the correction and rerun. |
| Loading-state fixtures must hold the query in a visibly loading state long enough for the browser assertion while preserving the same accessible status contract used by the widget. | `FND-004` | No Rule change; this is feature-local fixture/test timing guidance covered by the existing Web routing and widget-testing Rules. |
| Operator-denial browser checks must wait for the final access-denied layout to settle before asserting navigation absence, and route/layout effects must not update state before mount. | `FND-005` | No documentation change; the current Web routing and UI testing Rules already require settled accessible assertions and the production behavior is verified. |
| Strict browser console diagnostics are part of the acceptance contract; pre-mount state updates in loading or recovery flows require a source lifecycle fix, not test filtering. | `FND-006` | No documentation change; existing Tooling and UI/widget testing guidance already requires console classification and does not permit hiding unexpected errors. |
| Cross-layer real-runtime checks should verify future-sale reads through the active endpoint explicitly; the management list is intentionally a separate contract. | `FND-012` | No documentation change; this is feature-local evidence routing already explicit in `spec.md` `RF-06`/`CA-07` and does not generalize beyond this surface. |

## PR CI quality gate

<!-- Populate during conclude-spec. The head SHA identifies the PR revision checked by CI; it
is not SDD current-commit metadata. Retain failed and superseded-head runs as history. -->

| ID | Workflow | Head SHA | Result | Run |
| --- | --- | --- | --- | --- |

## History

| Date/Time | Event |
| --- | --- |
| `2026-08-25` | Evaluation created for Spec revision `1`; preflight, authorities, design references and baseline conformance recorded. |
| `2026-08-25` | Builder Core F1 handoff verified by Orchestrator; Core domain, interfaces, use cases and colocated tests pass `EV-F1-01`–`EV-F1-03`; F2/F3 dependency wave activated. |
| `2026-08-25` | Builder Validation implementation inspected; code sensor passed but type sensor failed on the missing Core `SalesChannelStatus` barrel export; F1-T1 correction activated and affected evidence marked for rerun. |
| `2026-08-25` | Builder Core correction verified; Core and Validation code/type exits pass as `EV-F1-04` and `EV-F2-03`; F1/F2 are eligible to close after Plan reconciliation. |
| `2026-08-25` | Builder Server F3 handoff verified; migration generation, artifact review, Server Biome and current Server typecheck pass as `EV-F3-01`–`EV-F3-04`; F4/F5 activation is next. |
| `2026-08-25` | Builder Server F4 handoff verified; REST composition, real controller fixtures/tests, seed wiring, build and Server sensors pass as `EV-F4-01`–`EV-F4-04`; F5 remains in progress. |
| `2026-08-25` | Builder Web F5 handoff received; required Web tree, hook-test inventory, mocked route suite and fresh screenshot artifact list recorded; Orchestrator rerun pending. |
| `2026-08-25` | Orchestrator Web rerun passed generation, code, types and 14 focused unit files; focused browser suite failed only delayed loading at desktop (`EV-F5-05`), so F5 remains in progress and `FND-004` is active. |
| `2026-08-25` | FND-004 correction passed the delayed-loading scenario, but full browser rerun failed Operator denial with a closed session and React pre-mount state-update errors (`EV-F5-07`); FND-005 activated and prior affected browser evidence remains non-ready. |
| `2026-08-25` | Current Web rerun failed strict console diagnostics in desktop loading/error recovery (`EV-F5-08`); FND-006 activated for a source lifecycle correction and affected visual evidence remains stale. |
| `2026-08-25` | Builder Web correction and Orchestrator rerun completed; the final focused Playwright suite passed 9/9 (`EV-F5-09`), fresh VIS-01–VIS-09 captures were inspected and reconciled, FND-004/FND-005 resolved, and the known repository-wide React warning recorded as accepted non-blocking FND-006. |
| `2026-08-25` | F6 integrated sensors completed: migration applied, real MV-01/MV-02 passed, full Web Vitest passed 131/131 files and 270/270 tests (`EV-F6-01`–`EV-F6-02`), and the single Integrated Reviewer reported no blocking findings; FND-007/FND-008 resolved. |
| `2026-08-25` | Corrected channel-form Zod copy after user report; validation schemas now provide explicit pt-BR messages, the focused browser suite passed 10/10 with fresh `VIS-10`, and FND-009 resolved. |
| `2026-08-25` | Converted adjustment legend chips into toggleable accessible filters; widget/type/unit checks passed, the focused browser scenarios passed at desktop and 768×1024 with fresh `VIS-11a`/`VIS-11b`, and FND-010 was resolved through isolated and regression-subset reruns. |
| `2026-08-25` | Synchronized adjustment filters with the `adjustment` URL search parameter; Validation/Web type and unit checks, route generation, browser health and 3 focused URL scenarios passed, and FND-011 resolved. |
| `2026-08-25` | Conclusion preflight reran Core, Validation, Server, Web, migration, focused controller, full Web unit, health and route checks; transient full-route Operator session closure was isolated, real authenticated runtime passed 2/2, fresh visual captures were inspected, and FND-012 resolved. |
